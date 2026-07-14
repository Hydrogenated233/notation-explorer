'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
   BUILTIN_OWNER,
   FILE_STORE_VERSION,
   NotationRegistryHub,
   NotationRegistryError,
   LocalNotationFileStore,
   LocalNotationStorageError,
} = require('../js/notation-registry.js')

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

function analysis(id, name) {
   return {
      id,
      name: name || id,
      display() { return '' },
      fromDisplay() { return [] },
      FS() { return [] },
   }
}

function sourceFor(mainId, analysisId) {
   const lines = []
   if (mainId) {
      lines.push(`register.push({
         id: ${JSON.stringify(mainId)}, name: ${JSON.stringify(mainId)},
         display: function () { return ''; }, able: function () { return false; },
         compare: function () { return 0; }, FS: function () { return []; },
         init: function () { return []; }
      });`)
   }
   if (analysisId) {
      lines.push(`analysis_register.push({
         id: ${JSON.stringify(analysisId)}, name: ${JSON.stringify(analysisId)},
         display: function () { return ''; }, fromDisplay: function () { return []; },
         FS: function () { return []; }
      });`)
   }
   return lines.join('\n')
}

class MemoryStorage {
   constructor() {
      this.data = new Map()
      this.writeError = null
      this.readError = null
   }

   getItem(key) {
      if (this.readError) throw this.readError
      return this.data.has(key) ? this.data.get(key) : null
   }

   setItem(key, value) {
      if (this.writeError) throw this.writeError
      this.data.set(key, String(value))
   }
}

test('registries preserve legacy array behavior and track owners by ID', () => {
   const hub = new NotationRegistryHub()
   assert.equal(Array.isArray(hub.main), true)
   assert.equal(hub.main.push(main('builtin-a'), main('builtin-b')), 2)
   assert.equal(hub.main.length, 2)
   assert.equal(hub.main[0].id, 'builtin-a')
   assert.equal(hub.main.find((entry) => entry.id === 'builtin-b').id, 'builtin-b')
   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin-a', 'builtin-b'])
   assert.deepEqual(Array.from(hub.main, (entry) => entry.id), ['builtin-a', 'builtin-b'])
   assert.equal(hub.main.get('builtin-a'), hub.main[0])
   assert.equal(hub.main.ownerOf('builtin-a'), BUILTIN_OWNER)
})

test('owner replacement allows the same IDs and preserves the owner slot', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('builtin'))
   hub.executeSource('file-a', sourceFor('a', null))
   hub.executeSource('file-b', sourceFor('b', null))

   const replacement = main('a', 'A replacement')
   const result = hub.main.replaceOwner('file-a', [replacement])

   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin', 'a', 'b'])
   assert.equal(hub.main[1], replacement)
   assert.equal(hub.main.ownerOf('a'), 'file-a')
   assert.equal(result.removed.length, 1)
   assert.equal(result.added[0], replacement)
})

test('hub restores a disabled owner according to file creation order', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('builtin'))
   hub.executeSource('file-a', sourceFor('a', null), { ownerOrder: 1 })
   hub.executeSource('file-b', sourceFor('b', null), { ownerOrder: 2 })
   hub.executeSource('file-c', sourceFor('c', null), { ownerOrder: 3 })

   hub.removeOwner('file-b')
   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin', 'a', 'c'])
   hub.executeSource('file-b', sourceFor('b-again', null), { ownerOrder: 2 })

   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin', 'a', 'b-again', 'c'])
   assert.equal(hub.ownerOrder('file-b'), 2)
})

test('prepareSource stages and validates both namespaces without live mutation', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('builtin-main'))
   hub.analysis.push(analysis('builtin-analysis'))

   const transaction = hub.prepareSource('file-a', sourceFor('shared-id', 'shared-id'))
   assert.equal(transaction.state, 'prepared')
   assert.equal(hub.main.get('shared-id'), undefined)
   assert.equal(hub.analysis.get('shared-id'), undefined)
   assert.deepEqual(transaction.preview().main.added.map((entry) => entry.id), ['shared-id'])
   assert.deepEqual(transaction.preview().analysis.added.map((entry) => entry.id), ['shared-id'])

   transaction.commit()
   assert.equal(hub.main.ownerOf('shared-id'), 'file-a')
   assert.equal(hub.analysis.ownerOf('shared-id'), 'file-a')
})

test('preview validates and locks an open transaction', () => {
   const hub = new NotationRegistryHub()
   const transaction = hub.begin('file-a')
   transaction.main.push(main('previewed'))

   const preview = transaction.preview()

   assert.equal(transaction.state, 'prepared')
   assert.deepEqual(preview.main.added.map((entry) => entry.id), ['previewed'])
   assert.equal(hub.main.get('previewed'), undefined)
   assert.throws(
      () => transaction.main.push(main('late')),
      (error) => error.code === 'TRANSACTION_PREPARED'
   )
   transaction.commit()
   assert.equal(hub.main.ownerOf('previewed'), 'file-a')
})

test('a failed staged replacement leaves both live registries untouched', () => {
   const hub = new NotationRegistryHub()
   hub.executeSource('file-a', sourceFor('old-main', 'old-analysis'))
   const oldMain = hub.main.get('old-main')
   const oldAnalysis = hub.analysis.get('old-analysis')

   const invalid = sourceFor('new-main', null) + `
      analysis_register.push({ id: 'broken', name: 'broken', display: function () {}, FS: function () {} });`

   assert.throws(
      () => hub.prepareSource('file-a', invalid),
      (error) => error instanceof NotationRegistryError &&
         error.code === 'INVALID_ENTRY' && error.details.field === 'fromDisplay'
   )
   assert.equal(hub.main.get('old-main'), oldMain)
   assert.equal(hub.analysis.get('old-analysis'), oldAnalysis)
   assert.equal(hub.main.get('new-main'), undefined)
})

test('prepareSource runs main init validation before committing either namespace', () => {
   const hub = new NotationRegistryHub()
   hub.executeSource('file-a', sourceFor('old-main', 'old-analysis'))
   const oldMain = hub.main.get('old-main')
   const oldAnalysis = hub.analysis.get('old-analysis')
   const invalidInit = `
      register.push({
         id: 'broken-init', name: 'broken-init', display: function () { return ''; },
         able: function () { return false; }, compare: function () { return 0; },
         FS: function () { return []; }, init: function () { throw new Error('init exploded'); }
      });
      analysis_register.push({
         id: 'new-analysis', name: 'new-analysis', display: function () { return ''; },
         fromDisplay: function () { return []; }, FS: function () { return []; }
      });`

   assert.throws(
      () => hub.prepareSource('file-a', invalidInit),
      (error) => error.code === 'INVALID_INIT' &&
         error.details.id === 'broken-init' && error.cause.message === 'init exploded'
   )
   assert.equal(hub.main.get('old-main'), oldMain)
   assert.equal(hub.analysis.get('old-analysis'), oldAnalysis)
   assert.equal(hub.analysis.get('new-analysis'), undefined)
})

test('transactions reject empty files, conflicts, and duplicate IDs per namespace', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('occupied'))

   assert.throws(
      () => hub.prepareSource('empty', 'var harmless = 1;'),
      (error) => error.code === 'EMPTY_TRANSACTION'
   )
   assert.throws(
      () => hub.prepareSource('conflict', sourceFor('occupied', null)),
      (error) => error.code === 'DUPLICATE_ID' && error.details.existingOwner === BUILTIN_OWNER
   )
   assert.throws(
      () => hub.prepareSource('duplicate', sourceFor('same', null) + sourceFor('same', null)),
      (error) => error.code === 'DUPLICATE_ID'
   )
   assert.deepEqual(hub.main.map((entry) => entry.id), ['occupied'])
})

test('source execution can read built-ins and runtime errors roll back the stage', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('base'))
   const source = `
      if (!register.find(function (entry) { return entry.id === 'base'; })) throw new Error('missing base');
      register.push({
         id: 'never-live', name: 'never-live', display: function () { return ''; },
         able: function () { return false; }, compare: function () { return 0; },
         FS: function () { return []; }, init: function () { return []; }
      });
      throw new Error('stop');`

   assert.throws(
      () => hub.prepareSource('file-a', source),
      (error) => error.code === 'SOURCE_EXECUTION_FAILED' && error.cause.message === 'stop'
   )
   assert.equal(hub.main.get('never-live'), undefined)
})

test('staged source cannot resolve registrations owned by another local file', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('builtin'))
   hub.executeSource('file-a', sourceFor('private-a', null))
   const source = `
      if (!register.find(function (entry) { return entry.id === 'builtin'; })) throw new Error('missing builtin');
      if (register.find(function (entry) { return entry.id === 'private-a'; })) throw new Error('local leaked');
   ` + sourceFor('private-b', null)

   hub.executeSource('file-b', source)
   assert.equal(hub.main.ownerOf('private-b'), 'file-b')
})

test('prepared init data is carried through commit without a second init call', () => {
   const hub = new NotationRegistryHub()
   let calls = 0
   const items = [{ expr: ['root'], low: [[]], subitems: [] }]
   const source = `register.push({
      id: 'prepared', name: 'prepared', display: function () { return ''; },
      able: function () { return false; }, compare: function () { return 0; },
      FS: function () { return []; }, init: makeInitial
   });`
   const transaction = hub.prepareSource('file-a', source, {
      context: { makeInitial() { calls++; return items } },
   })

   assert.equal(calls, 1)
   assert.equal(transaction.preview().main.initialData[0].items, items)
   const change = transaction.commit()
   assert.equal(calls, 1)
   assert.equal(change.main.initialData[0].items, items)
})

test('init cannot add registrations after transaction staging is locked', () => {
   const hub = new NotationRegistryHub()
   const source = `register.push({
      id: 'first', name: 'first', display: function () { return ''; },
      able: function () { return false; }, compare: function () { return 0; },
      FS: function () { return []; },
      init: function () {
         register.push({
            id: 'late', name: 'late', display: function () { return ''; },
            able: function () { return false; }, compare: function () { return 0; },
            FS: function () { return []; }, init: function () { return []; }
         });
         return [];
      }
   });`

   assert.throws(
      () => hub.prepareSource('file-a', source),
      (error) => error.code === 'INVALID_INIT' &&
         error.cause instanceof NotationRegistryError &&
         error.cause.code === 'TRANSACTION_PREPARED'
   )
   assert.deepEqual(hub.main.map((entry) => entry.id), [])
})

test('commit uses the exact registration batch captured during validation', () => {
   const hub = new NotationRegistryHub()
   const transaction = hub.prepareSource('file-a', sourceFor('prepared', null))

   transaction.main._staged.push(main('late'))
   const change = transaction.commit()

   assert.deepEqual(change.main.added.map((entry) => entry.id), ['prepared'])
   assert.deepEqual(change.main.initialData.map((entry) => entry.id), ['prepared'])
   assert.deepEqual(hub.main.map((entry) => entry.id), ['prepared'])
})

test('file store persists records and drafts in stable creation order', () => {
   const storage = new MemoryStorage()
   let tick = 100
   let id = 0
   const options = {
      storage,
      now: () => tick++,
      createId: () => `file-${++id}`,
   }
   const store = new LocalNotationFileStore(options)

   const first = store.createFile({ name: 'First.js', source: 'one', enabled: true })
   const second = store.createFile({ name: 'Second.js', source: 'two', enabled: false })
   store.setDraft(first.id, { source: 'one draft', name: 'First.js' })
   const updated = store.updateFile(first.id, { source: 'one changed' })

   assert.equal(updated.sourceRevision, first.sourceRevision + 1)
   assert.deepEqual(store.listFiles().map((file) => file.id), [first.id, second.id])
   assert.equal(store.getDraft(first.id).source, 'one draft')

   const reloaded = new LocalNotationFileStore(options)
   assert.equal(reloaded.snapshot().version, FILE_STORE_VERSION)
   assert.deepEqual(reloaded.listFiles().map((file) => file.name), ['First.js', 'Second.js'])
   assert.equal(reloaded.getDraft(first.id).source, 'one draft')

   reloaded.deleteFile(first.id)
   assert.equal(reloaded.getFile(first.id), undefined)
   assert.equal(reloaded.getDraft(first.id), undefined)
})

test('file store enforces case-insensitive names and reports quota failures cleanly', () => {
   const storage = new MemoryStorage()
   const store = new LocalNotationFileStore({
      storage,
      createId: () => 'one',
      now: () => 1,
   })
   store.createFile({ name: 'Example.js', source: '' })

   assert.throws(
      () => store.createFile({ id: 'two', name: 'example.JS', source: '' }),
      (error) => error instanceof LocalNotationStorageError && error.code === 'DUPLICATE_FILE_NAME'
   )

   const quota = new Error('full')
   quota.name = 'QuotaExceededError'
   storage.writeError = quota
   assert.throws(
      () => store.setDraft('one', 'draft'),
      (error) => error instanceof LocalNotationStorageError &&
         error.code === 'QUOTA_EXCEEDED' && /not saved/i.test(error.message)
   )
})

test('file store reports corrupt and unsupported persisted data', () => {
   const storage = new MemoryStorage()
   storage.data.set('custom', '{nope')
   const corrupt = new LocalNotationFileStore({ storage, key: 'custom' })
   assert.throws(() => corrupt.listFiles(), (error) => error.code === 'STORAGE_CORRUPT')

   storage.data.set('custom', JSON.stringify({
      version: FILE_STORE_VERSION + 1,
      nextOrder: 1,
      files: [],
      drafts: {},
   }))
   assert.throws(() => corrupt.listFiles(), (error) => error.code === 'UNSUPPORTED_VERSION')
})
