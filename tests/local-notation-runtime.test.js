'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const RegistryRuntime = require('../js/notation-registry.js')
const PrSSTemplate = require('../js/prss-template.js')

const runtimeSource = fs.readFileSync(
   path.join(__dirname, '..', 'js', 'local-notation-runtime.js'),
   'utf8'
)

class MemoryStorage {
   constructor() {
      this.data = new Map()
      this.writeError = null
   }

   getItem(key) {
      return this.data.has(key) ? this.data.get(key) : null
   }

   setItem(key, value) {
      if (this.writeError) throw this.writeError
      this.data.set(key, String(value))
   }
}

function main(id, name) {
   return {
      id,
      name: name || id,
      display() { return '' },
      able() { return false },
      compare() { return 0 },
      FS() { return [] },
      init() { return [] },
   }
}

function sourceFor(id, label) {
   return `register.push({
      id: ${JSON.stringify(id)},
      name: ${JSON.stringify(label || id)},
      display: function () { return ''; },
      able: function () { return false; },
      compare: function () { return 0; },
      FS: function () { return []; },
      init: function () {
         return [{ expr: [${JSON.stringify(label || id)}], low: [[]], subitems: [] }];
      }
   });`
}

function createHarness() {
   const storage = new MemoryStorage()
   const hub = new RegistryRuntime.NotationRegistryHub()
   const context = vm.createContext({
      NotationRegistryRuntime: RegistryRuntime,
      notationRegistryHub: hub,
      register: hub.main,
      analysis_register: hub.analysis,
      PrSSTemplate,
      console,
   })

   vm.runInContext(runtimeSource, context, { filename: 'local-notation-runtime.js' })

   let nextId = 0
   let now = 100
   const store = new RegistryRuntime.LocalNotationFileStore({
      storage,
      createId: () => `file-${++nextId}`,
      now: () => now++,
   })
   const runtime = new context.LocalNotationRuntime({ hub, store })
   return { context, hub, runtime, storage, store }
}

test('boot loads valid trusted files and auto-disables only a failing file', () => {
   const { hub, runtime, store } = createHarness()
   const broken = store.createFile({
      name: 'Broken.js',
      source: 'throw new Error("boot failed");',
      enabled: true,
      trusted: true,
      loadedRevision: 0,
   })
   const valid = store.createFile({
      name: 'Valid.js',
      source: sourceFor('valid'),
      enabled: true,
      trusted: true,
      loadedRevision: 0,
   })

   const errors = runtime.boot()

   assert.equal(errors.length, 1)
   assert.equal(errors[0].fileId, broken.id)
   assert.equal(errors[0].error.code, 'SOURCE_EXECUTION_FAILED')
   assert.equal(store.getFile(broken.id).enabled, false)
   assert.equal(store.getFile(broken.id).source, broken.source)
   assert.equal(store.getFile(valid.id).enabled, true)
   assert.equal(store.getFile(valid.id).loadedRevision, valid.sourceRevision)
   assert.equal(hub.main.ownerOf('valid'), valid.id)
   assert.deepEqual(store.getFile(valid.id).manifest.main, ['valid'])
})

test('boot does not commit registrations when its metadata write fails', () => {
   const { hub, runtime, storage, store } = createHarness()
   const file = store.createFile({
      name: 'NoMetadata.js',
      source: sourceFor('must-not-load'),
      enabled: true,
      trusted: true,
      loadedRevision: 0,
   })
   const quota = new Error('full')
   quota.name = 'QuotaExceededError'
   storage.writeError = quota

   const errors = runtime.boot()

   assert.equal(errors.length, 1)
   assert.equal(errors[0].fileId, file.id)
   assert.equal(errors[0].error.code, 'QUOTA_EXCEEDED')
   assert.equal(runtime.storageError.code, 'QUOTA_EXCEEDED')
   assert.equal(hub.main.get('must-not-load'), undefined)
})

test('upload enables valid trusted source and retains failed source as a disabled file', () => {
   const { hub, runtime, store } = createHarness()

   const success = runtime.createUpload('Good.js', sourceFor('good'), true)
   const failureSource = 'register.push({ id: "incomplete" });'
   const failure = runtime.createUpload('Bad.js', failureSource, true)

   assert.equal(success.enabled, true)
   assert.equal(success.file.enabled, true)
   assert.equal(success.change.main.added[0].id, 'good')
   assert.equal(hub.main.ownerOf('good'), success.file.id)

   assert.equal(failure.enabled, false)
   assert.equal(failure.error.code, 'INVALID_ENTRY')
   assert.equal(failure.file.enabled, false)
   assert.equal(failure.file.source, failureSource)
   assert.equal(store.getFile(failure.file.id).lastError.code, 'INVALID_ENTRY')
   assert.equal(hub.main.ownerOf('incomplete'), undefined)
})

test('load errors report only reliable locations in the edited source', () => {
   const { runtime } = createHarness()
   const runtimeFailure = runtime.createUpload(
      'Located.js',
      'var ready = true;\nthrow new Error("located");',
      true
   )
   const syntaxFailure = runtime.createUpload('Syntax.js', 'register.push({', true)

   assert.equal(runtimeFailure.file.lastError.line, 2)
   assert.equal(runtimeFailure.file.lastError.column, 7)
   assert.equal(syntaxFailure.file.lastError.line, null)
   assert.equal(syntaxFailure.file.lastError.column, null)
})

test('direct enable failure persists a disabled load error for the manager', () => {
   const { hub, runtime, store } = createHarness()
   const uploaded = runtime.createUpload('EnableLater.js', 'register.push({ id: "invalid" });', false)
   runtime.trustFile(uploaded.file.id)

   assert.throws(
      () => runtime.enable(uploaded.file.id),
      (error) => error.code === 'INVALID_ENTRY'
   )

   const retained = store.getFile(uploaded.file.id)
   assert.equal(retained.enabled, false)
   assert.equal(retained.lastError.code, 'INVALID_ENTRY')
   assert.equal(retained.source, 'register.push({ id: "invalid" });')
   assert.equal(hub.main.get('invalid'), undefined)
})

test('failed enabled save keeps retained source, live registrations, and draft intact', () => {
   const { hub, runtime, store } = createHarness()
   const originalSource = sourceFor('old-id', 'old')
   const uploaded = runtime.createUpload('Replace.js', originalSource, true)
   const originalEntry = hub.main.get('old-id')
   const originalRevision = uploaded.file.sourceRevision
   const attemptedSource = sourceFor('new-id') + '\nthrow new Error("replace failed");'
   runtime.setDraft(uploaded.file.id, { name: 'Replace.js', source: attemptedSource })

   assert.throws(
      () => runtime.saveFile(uploaded.file.id, 'Replace.js', attemptedSource),
      (error) => error.code === 'SOURCE_EXECUTION_FAILED'
   )

   const retained = store.getFile(uploaded.file.id)
   assert.equal(retained.source, originalSource)
   assert.equal(retained.sourceRevision, originalRevision)
   assert.equal(retained.enabled, true)
   assert.equal(retained.lastError.code, 'SOURCE_EXECUTION_FAILED')
   assert.equal(runtime.getDraft(uploaded.file.id).source, attemptedSource)
   assert.equal(hub.main.get('old-id'), originalEntry)
   assert.equal(hub.main.get('new-id'), undefined)
})

test('storage failure rolls back a prepared enabled replacement', () => {
   const { hub, runtime, storage, store } = createHarness()
   const uploaded = runtime.createUpload('Stored.js', sourceFor('stored-old'), true)
   const originalEntry = hub.main.get('stored-old')
   const quota = new Error('full')
   quota.name = 'QuotaExceededError'
   storage.writeError = quota

   assert.throws(
      () => runtime.saveFile(uploaded.file.id, 'Stored.js', sourceFor('stored-new')),
      (error) => error.code === 'QUOTA_EXCEEDED'
   )

   storage.writeError = null
   assert.equal(store.getFile(uploaded.file.id).source, sourceFor('stored-old'))
   assert.equal(hub.main.get('stored-old'), originalEntry)
   assert.equal(hub.main.get('stored-new'), undefined)
})

test('disable and re-enable report whether the retained source revision changed', () => {
   const { hub, runtime, store } = createHarness()
   const uploaded = runtime.createUpload('Revision.js', sourceFor('revision-old'), true)

   runtime.disable(uploaded.file.id)
   assert.equal(hub.main.get('revision-old'), undefined)
   assert.equal(runtime.enable(uploaded.file.id).sourceChanged, false)
   assert.equal(hub.main.ownerOf('revision-old'), uploaded.file.id)

   runtime.disable(uploaded.file.id)
   const saved = runtime.saveFile(uploaded.file.id, 'Revision.js', sourceFor('revision-new'))
   assert.equal(saved.enabled, false)
   assert.equal(saved.file.loadedRevision, uploaded.file.loadedRevision)
   assert.equal(saved.file.sourceRevision, uploaded.file.sourceRevision + 1)

   const enabled = runtime.enable(uploaded.file.id)
   assert.equal(enabled.sourceChanged, true)
   assert.equal(enabled.file.loadedRevision, enabled.file.sourceRevision)
   assert.equal(store.getFile(uploaded.file.id).enabled, true)
   assert.equal(hub.main.get('revision-old'), undefined)
   assert.equal(hub.main.ownerOf('revision-new'), uploaded.file.id)
})

test('re-enabled files return to fixed creation order after built-ins', () => {
   const { hub, runtime } = createHarness()
   hub.main.push(main('builtin'))
   const first = runtime.createUpload('First.js', sourceFor('first'), true).file
   const middle = runtime.createUpload('Middle.js', sourceFor('middle'), false).file
   runtime.createUpload('Last.js', sourceFor('last'), true)

   runtime.trustFile(middle.id)
   runtime.enable(middle.id)
   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin', 'first', 'middle', 'last'])

   runtime.disable(first.id)
   runtime.enable(first.id)
   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin', 'first', 'middle', 'last'])
})

test('template creation chooses unique paired names and IDs and leaves drafts disabled', () => {
   const { hub, runtime } = createHarness()
   const first = runtime.createTemplate()
   runtime.saveFile(first.id, 'Renamed-PrSS.js', first.source)
   const second = runtime.createTemplate()

   assert.equal(first.name, 'PrSS.js')
   assert.equal(first.enabled, false)
   assert.equal(first.trusted, true)
   assert.equal(first.template, true)
   assert.deepEqual(first.knownMainIds, ['prss'])
   assert.match(first.source, /id: 'prss'/)
   assert.equal(second.name, 'PrSS-2.js')
   assert.match(second.source, /id: 'prss-2'/)
   assert.equal(hub.main.get('prss'), undefined)

   runtime.enable(first.id)
   runtime.enable(second.id)
   assert.deepEqual(hub.main.map((entry) => entry.id), ['prss', 'prss-2'])
})

test('same-name lookup is trimmed and case-insensitive', () => {
   const { runtime } = createHarness()
   const file = runtime.createUpload('MixedCase.js', sourceFor('mixed'), false).file

   assert.equal(runtime.findByName('  mixedcase.JS  ').id, file.id)
   assert.equal(runtime.findByName('missing.js'), undefined)
})

test('delete removes source, draft, registrations, and remembered owner order', () => {
   const { hub, runtime, store } = createHarness()
   const uploaded = runtime.createUpload('Delete.js', sourceFor('delete-me'), true)
   runtime.setDraft(uploaded.file.id, { source: 'unsaved' })

   const result = runtime.deleteFile(uploaded.file.id)

   assert.equal(result.deleted, true)
   assert.equal(result.change.main.removed[0].id, 'delete-me')
   assert.equal(store.getFile(uploaded.file.id), undefined)
   assert.equal(runtime.getDraft(uploaded.file.id), undefined)
   assert.equal(hub.main.get('delete-me'), undefined)
   assert.equal(hub.ownerOrder(uploaded.file.id), undefined)
})
