'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
   BUILTIN_OWNER,
   FILE_STORE_VERSION,
   installGlobals,
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

function generatorSource(options) {
   options = options || {}
   const familyId = options.familyId || 'local-family'
   const rawPrefix = options.rawPrefix || familyId + '-variant-'
   const categoryName = options.categoryName || familyId
   const marker = options.marker || 'default'
   const parent = options.parentId
      ? ', parent_id: ' + JSON.stringify(options.parentId)
      : ''
   const resolver = options.livePrefix
      ? `resolveId: function (index) { return ${JSON.stringify(options.livePrefix)} + index; },`
      : ''
   return `register.registerGenerator({
      id: ${JSON.stringify(familyId)},
      category: {
         id: ${JSON.stringify(familyId)},
         name: ${JSON.stringify(categoryName)},
         path: ['Local', ${JSON.stringify(categoryName)}]${parent}
      },
      start: ${options.start === undefined ? 1 : options.start},
      initial: ${options.initial === undefined ? 2 : options.initial},
      maximum: ${options.maximum === undefined ? 4 : options.maximum},
      ${resolver}
      create: function (index) {
         return {
            id: ${JSON.stringify(rawPrefix)} + index,
            name: ${JSON.stringify(categoryName + ' ')} + index,
            factoryVersion: ${JSON.stringify(marker)},
            display: function () { return ''; },
            able: function () { return false; },
            compare: function () { return 0; },
            FS: function () { return []; },
            init: function () {
               return [{ expr: [index], low: [[]], subitems: [] }];
            }
         };
      }
   });`
}

function categoryGeneratorSource(options) {
   options = options || {}
   const familyId = options.familyId || 'category-generator-family'
   const prefix = options.prefix || familyId + '-variant-'
   return `register_category({
      id: ${JSON.stringify(familyId)},
      name: ${JSON.stringify(options.name || familyId)},
      generator: {
         start: 1,
         initial: 2,
         maximum: 3,
         create: function (index) {
            return {
               id: ${JSON.stringify(prefix)} + index,
               name: ${JSON.stringify((options.name || familyId) + ' ')} + index,
               display: function () { return ''; },
               able: function () { return false; },
               compare: function () { return 0; },
               FS: function () { return []; },
               init: function () { return []; }
            };
         }
      }
   });`
}

function officialRewrittenSource() {
   return `register_notation({
      id: 'official-direct',
      name: 'Official direct',
      display: {
         plain: function (value) { return 'plain:' + value; },
         html: function (value) { return '<b>' + value + '</b>'; },
         latex: function (value) { return '\\\\mathbf{' + value + '}'; },
         from_display: function (value) { return Number(value); }
      },
      is_limit: function (value) { return value === Infinity; },
      compare: function (left, right) { return left === right ? 0 : left < right ? -1 : 1; },
      FS: function (value, index) { return value === Infinity ? index + 1 : 0; },
      init: function () { return [Infinity, 0]; }
   });
   register_category({
      id: 'official-family',
      name: 'Official family',
      simple_name: 'n-Official',
      generator: {
         start: 1,
         initial: 2,
         maximum: 3,
         create: function (index) {
            return {
               id: 'official-generated-' + index,
               name: index + '-Official',
               category_id: 'official-family',
               display: function (value) { return String(value); },
               is_limit: function (value) { return value === Infinity; },
               compare: function (left, right) { return left === right ? 0 : left < right ? -1 : 1; },
               FS: function (value, fsIndex) { return value === Infinity ? index + fsIndex : 0; },
               init: function () { return [Infinity, index]; }
            };
         }
      }
   });`
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

test('unregister removes one ID while preserving the remaining order and owners', () => {
   const hub = new NotationRegistryHub()
   hub.main.push(main('builtin-a'))
   hub.executeSource('file-a', sourceFor('local-a', null))
   hub.executeSource('file-b', sourceFor('local-b', null))

   const removed = hub.main.unregister('local-a', 'file-a')

   assert.equal(removed.id, 'local-a')
   assert.deepEqual(hub.main.map((entry) => entry.id), ['builtin-a', 'local-b'])
   assert.equal(hub.main.ownerOf('builtin-a'), BUILTIN_OWNER)
   assert.equal(hub.main.ownerOf('local-b'), 'file-b')
   assert.equal(hub.main.ownerOf('local-a'), undefined)
   assert.equal(hub.main.ownerOf(removed), undefined)
   assert.equal(hub.main.unregister('missing', 'any-owner'), undefined)
})

test('unregister rejects an owner mismatch without mutating the registry', () => {
   const hub = new NotationRegistryHub()
   hub.executeSource('file-a', sourceFor('local-a', null))
   const original = hub.main.get('local-a')

   assert.throws(
      () => hub.main.unregister('local-a', 'file-b'),
      (error) => error instanceof NotationRegistryError &&
         error.code === 'OWNER_MISMATCH' &&
         error.details.namespace === 'main' &&
         error.details.id === 'local-a' &&
         error.details.expectedOwner === 'file-b' &&
         error.details.actualOwner === 'file-a'
   )
   assert.equal(hub.main.get('local-a'), original)
   assert.equal(hub.main.ownerOf('local-a'), 'file-a')
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

test('local source generator commits to the hub and remains controllable through plus/minus', () => {
   const hub = new NotationRegistryHub()
   const familyId = 'local-source-family'
   hub.executeSource('file-generator', generatorSource({
      familyId,
      rawPrefix: 'local-source-',
      marker: 'v1',
   }))

   assert.equal(hub.main.generatorCurrent(familyId), 2)
   assert.deepEqual(hub.main.idsForOwner('file-generator'), ['local-source-1', 'local-source-2'])
   const added = hub.main.generatorAdd(familyId)
   assert.equal(added.id, 'local-source-3')
   assert.equal(added.factoryVersion, 'v1')
   assert.equal(hub.main.ownerOf(added.id), 'file-generator')
   assert.equal(hub.main.generatorCurrent(familyId), 3)

   const removed = hub.main.generatorRemove(familyId)
   assert.equal(removed.id, 'local-source-3')
   assert.equal(hub.main.get('local-source-3'), undefined)
   assert.equal(hub.main.generatorCurrent(familyId), 2)
})

test('generator controls captured by local source switch from staged to live state after commit', () => {
   const hub = new NotationRegistryHub()
   const owner = 'file-captured-controls'
   const familyId = 'captured-controls-family'
   let controls
   const source = generatorSource({
      familyId,
      rawPrefix: 'captured-controls-',
      maximum: 5,
   }) + `
      var staged = generator_increment(${JSON.stringify(familyId)});
      if (!staged || staged.id !== 'captured-controls-3') throw new Error('staged increment failed');
      captureControls({
         current: generator_current,
         canIncrement: generator_can_increment,
         increment: generator_increment,
         decrement: generator_decrement,
         register: register
      });`

   const transaction = hub.prepareSource(owner, source, {
      context: { captureControls(value) { controls = value } },
   })

   assert.deepEqual(transaction.main.stagedEntries().map((entry) => entry.id), [
      'captured-controls-1',
      'captured-controls-2',
      'captured-controls-3',
   ])
   assert.deepEqual(hub.main.idsForOwner(owner), [])
   assert.throws(
      () => controls.decrement(familyId),
      (error) => error.code === 'TRANSACTION_PREPARED'
   )

   transaction.commit()

   assert.equal(controls.current(familyId), 3)
   assert.equal(controls.register.generatorCurrent(familyId), 3)
   assert.equal(controls.canIncrement(familyId), true)
   assert.equal(controls.increment(familyId).id, 'captured-controls-4')
   assert.equal(hub.main.get('captured-controls-4').id, 'captured-controls-4')
   assert.equal(controls.register.generatorDecrement(familyId).id, 'captured-controls-4')
   assert.equal(hub.main.get('captured-controls-4'), undefined)
   assert.equal(controls.register.generatorAdd(familyId).id, 'captured-controls-4')
   assert.equal(controls.register.generatorRemove(familyId).id, 'captured-controls-4')
   assert.equal(hub.main.generatorCurrent(familyId), 3)
})

test('captured generator controls stay isolated after source failure or explicit rollback', () => {
   const hub = new NotationRegistryHub()
   const familyId = 'rolled-back-controls-family'
   let failedControls
   const failedSource = generatorSource({
      familyId,
      rawPrefix: 'failed-controls-',
   }) + `
      captureFailed({ increment: generator_increment, register: register });
      throw new Error('stop after capture');`

   assert.throws(
      () => hub.prepareSource('file-failed-controls', failedSource, {
         context: { captureFailed(value) { failedControls = value } },
      }),
      (error) => error.code === 'SOURCE_EXECUTION_FAILED'
   )
   assert.throws(
      () => failedControls.increment(familyId),
      (error) => error.code === 'TRANSACTION_CLOSED'
   )
   assert.throws(
      () => failedControls.register.generatorIncrement(familyId),
      (error) => error.code === 'TRANSACTION_CLOSED'
   )
   assert.deepEqual(hub.main.idsForOwner('file-failed-controls'), [])
   assert.equal(hub.main.generatorDefinition(familyId), undefined)

   let rolledBackControls
   const transaction = hub.prepareSource(
      'file-explicit-rollback',
      generatorSource({
         familyId: 'explicit-rollback-family',
         rawPrefix: 'explicit-rollback-',
      }) + `captureRolledBack({ decrement: generator_decrement, register: register });`,
      { context: { captureRolledBack(value) { rolledBackControls = value } } }
   )
   transaction.rollback()

   assert.throws(
      () => rolledBackControls.decrement('explicit-rollback-family'),
      (error) => error.code === 'TRANSACTION_CLOSED'
   )
   assert.throws(
      () => rolledBackControls.register.generatorCurrent('explicit-rollback-family'),
      (error) => error.code === 'TRANSACTION_CLOSED'
   )
   assert.deepEqual(hub.main.idsForOwner('file-explicit-rollback'), [])
   assert.equal(hub.main.generatorDefinition('explicit-rollback-family'), undefined)
})

test('reloading one owner atomically replaces its generator factory and bounds', () => {
   const hub = new NotationRegistryHub()
   const owner = 'file-generator'
   const familyId = 'replaceable-family'
   hub.executeSource(owner, generatorSource({
      familyId,
      rawPrefix: 'replaceable-',
      start: 1,
      initial: 2,
      maximum: 4,
      marker: 'old',
   }))
   const oldFamily = hub.main.generatorDefinition(familyId)
   const transaction = hub.prepareSource(owner, generatorSource({
      familyId,
      rawPrefix: 'replaceable-',
      start: 2,
      initial: 3,
      maximum: 5,
      marker: 'new',
   }))

   assert.equal(hub.main.generatorDefinition(familyId), oldFamily)
   assert.deepEqual(hub.main.idsForOwner(owner), ['replaceable-1', 'replaceable-2'])
   transaction.commit()

   const family = hub.main.generatorDefinition(familyId)
   assert.notEqual(family, oldFamily)
   assert.deepEqual(
      { start: family.start, initial: family.initial, maximum: family.maximum },
      { start: 2, initial: 3, maximum: 5 }
   )
   assert.deepEqual(hub.main.idsForOwner(owner), ['replaceable-2', 'replaceable-3'])
   assert.equal(hub.main.get('replaceable-2').factoryVersion, 'new')
   assert.equal(hub.main.generatorAdd(familyId).factoryVersion, 'new')
   assert.ok(hub.main.get('replaceable-4'))
})

test('failed family commit rolls back notation entries, categories, and generators together', () => {
   const hub = new NotationRegistryHub()
   const transaction = hub.begin('file-broken')
   transaction.main.registerGenerator({
      id: 'rollback-family-a',
      category: { id: 'rollback-family-a', name: 'Rollback family A' },
      start: 1,
      initial: 1,
      maximum: 2,
      create(index) { return main('rollback-a-' + index) },
   })
   transaction.main.registerGenerator({
      id: 'rollback-family-b',
      category: { id: 'rollback-family-b', name: 'Rollback family B' },
      start: 1,
      initial: 1,
      maximum: 2,
      create(index) { return main('rollback-b-local-' + index) },
   })
   transaction.validate()

   const occupied = hub.main.registerGenerator({
      id: 'rollback-family-b',
      category: { id: 'rollback-family-b', name: 'Rollback family B' },
      start: 1,
      initial: 1,
      maximum: 2,
      create(index) { return main('rollback-b-live-' + index) },
   })
   const baselineIds = hub.main.map((entry) => entry.id)
   const baselineCategories = hub.categories().map((category) => category.id)
   const baselineGenerators = hub.main.generatorCategoryIds()

   assert.throws(
      () => transaction.commit(),
      (error) => error.code === 'DUPLICATE_GENERATOR'
   )
   assert.deepEqual(hub.main.map((entry) => entry.id), baselineIds)
   assert.deepEqual(hub.categories().map((category) => category.id), baselineCategories)
   assert.deepEqual(hub.main.generatorCategoryIds(), baselineGenerators)
   assert.equal(hub.main.generatorDefinition('rollback-family-b'), occupied)
   assert.equal(hub.main.generatorDefinition('rollback-family-a'), undefined)
   assert.equal(hub.getCategory('rollback-family-a'), undefined)
})

test('removeOwner removes its generated family, category, state, and live variants', () => {
   const hub = new NotationRegistryHub()
   const owner = 'file-generator'
   const familyId = 'removable-family'
   hub.executeSource(owner, generatorSource({
      familyId,
      rawPrefix: 'removable-',
   }))
   hub.main.generatorAdd(familyId)

   assert.equal(hub.categoryOwnerOf(familyId), owner)
   assert.equal(hub.main.generatorCurrent(familyId), 3)
   hub.removeOwner(owner)

   assert.deepEqual(hub.main.idsForOwner(owner), [])
   assert.equal(hub.main.generatorDefinition(familyId), undefined)
   assert.equal(hub.getCategory(familyId), undefined)
   assert.equal(Object.prototype.hasOwnProperty.call(hub.getGeneratorState(), familyId), false)
})

test('resolveId keeps alias live IDs for defaults and later plus/minus variants', () => {
   const hub = new NotationRegistryHub()
   const familyId = 'aliased-family'
   hub.executeSource('file-alias', generatorSource({
      familyId,
      rawPrefix: 'raw-alias-',
      livePrefix: 'live-alias-',
   }))

   assert.deepEqual(hub.main.idsForOwner('file-alias'), ['live-alias-1', 'live-alias-2'])
   assert.equal(hub.main.get('raw-alias-1'), undefined)
   assert.equal(hub.main.get('live-alias-1').generatedFamily.sourceId, 'raw-alias-1')
   assert.equal(hub.main.get('live-alias-1').generatedFamily.liveId, 'live-alias-1')

   const added = hub.main.generatorAdd(familyId)
   const family = hub.main.generatorDefinition(familyId)
   const factoryEntry = family.created[3]
   assert.equal(added.id, 'live-alias-3')
   assert.equal(hub.main.get('raw-alias-3'), undefined)
   assert.notEqual(added, factoryEntry)
   assert.equal(factoryEntry.id, 'raw-alias-3')
   assert.equal(factoryEntry.generatedFamily, undefined)
   assert.equal(hub.main.generatorRemove(familyId).id, 'live-alias-3')
   assert.equal(hub.main.get('live-alias-3'), undefined)
   const readded = hub.main.generatorAdd(familyId)
   assert.equal(readded.generatedFamily.sourceId, 'raw-alias-3')
   assert.equal(factoryEntry.id, 'raw-alias-3')
})

test('staged categories use stable topological order when a parent is declared late', () => {
   const hub = new NotationRegistryHub()
   const transaction = hub.begin('file-category-order')
   transaction.main.registerCategory({
      id: 'ordered-child',
      name: 'Ordered child',
      parent_id: 'ordered-parent',
   })
   transaction.main.registerCategory({ id: 'ordered-parent', name: 'Ordered parent' })
   transaction.main.registerCategory({ id: 'ordered-sibling', name: 'Ordered sibling' })
   transaction.main.push(main('ordered-anchor'))

   transaction.commit()

   assert.deepEqual(hub.categoryIds(), [
      'ordered-parent',
      'ordered-child',
      'ordered-sibling',
   ])
})

test('global generator category registration rolls back partial defaults', () => {
   const hub = new NotationRegistryHub()

   assert.throws(
      () => hub.main.registerCategory({
         id: 'broken-live-family',
         name: 'Broken live family',
         generator: {
            start: 1,
            initial: 2,
            create(index) {
               if (index === 2) throw new Error('default failed')
               return main('broken-live-' + index)
            },
         },
      }),
      (error) => error.code === 'GENERATOR_FAILED'
   )
   assert.deepEqual(hub.main.map((entry) => entry.id), [])
   assert.equal(hub.getCategory('broken-live-family'), undefined)
   assert.equal(hub.main.generatorDefinition('broken-live-family'), undefined)
   assert.equal(
      Object.prototype.hasOwnProperty.call(hub.main.getGeneratorState(), 'broken-live-family'),
      false
   )
})

test('official ne-rewritten local source uses only register_notation and register_category', () => {
   const hub = new NotationRegistryHub()
   const owner = 'official-local-file'
   const transaction = hub.prepareSource(owner, officialRewrittenSource())

   assert.equal(hub.main.length, 0)
   assert.deepEqual(transaction.main.map((entry) => entry.id), [
      'official-direct',
      'official-generated-1',
      'official-generated-2',
   ])
   const staged = transaction.main.get('official-direct')
   assert.equal(staged.display(4), '<b>4</b>')
   assert.equal(staged.displayPlain(4), 'plain:4')
   assert.equal(staged.fromDisplay('12'), 12)
   assert.equal(staged.able(Infinity), true)
   assert.deepEqual(staged.init(), [
      { expr: Infinity, low: [0], subitems: [] },
      { expr: 0, low: [0], subitems: [] },
   ])

   transaction.commit()

   assert.deepEqual(hub.main.idsForOwner(owner), [
      'official-direct',
      'official-generated-1',
      'official-generated-2',
   ])
   assert.equal(hub.main.ownerOf('official-direct'), owner)
   assert.equal(hub.main.ownerOf('official-generated-1'), owner)
   assert.equal(hub.main.get('official-generated-1').able(Infinity), true)
   assert.equal(hub.main.generatorDefinition('official-family').owner, owner)
   assert.equal(hub.main.generatorAdd('official-family').id, 'official-generated-3')
   assert.equal(hub.main.ownerOf('official-generated-3'), owner)

   hub.removeOwner(owner)
   assert.equal(hub.main.get('official-direct'), undefined)
   assert.equal(hub.main.generatorDefinition('official-family'), undefined)
})

test('global register_category auto-materializes a generator and init_generator is idempotent', () => {
   const target = {}
   const hub = installGlobals(target)
   const category = target.register_category({
      id: 'global-category-family',
      name: 'Global category family',
      generator: {
         start: 1,
         initial: 2,
         maximum: 3,
         create(index) { return main('global-category-' + index) },
      },
   })

   assert.deepEqual(hub.main.map((entry) => entry.id), [
      'global-category-1',
      'global-category-2',
   ])
   const defaults = hub.main.slice()
   const initialized = target.init_generator(category)
   assert.deepEqual(initialized.changed, [])
   assert.deepEqual(hub.main.slice(), defaults)
   assert.equal(hub.main.ownerOf('global-category-1'), BUILTIN_OWNER)
   assert.equal(hub.main.generatorCurrent('global-category-family'), 2)
   assert.equal(target.generator_increment('global-category-family').id, 'global-category-3')
})

test('local source register_category auto-initializes while staged and keeps its owner', () => {
   const hub = new NotationRegistryHub()
   const owner = 'file-category-generator'
   const familyId = 'local-category-family'
   const transaction = hub.prepareSource(owner, categoryGeneratorSource({
      familyId,
      prefix: 'local-category-',
      name: 'Local category family',
   }))

   assert.equal(hub.main.get('local-category-1'), undefined)
   assert.equal(hub.getCategory(familyId), undefined)
   assert.equal(hub.main.generatorDefinition(familyId), undefined)
   transaction.commit()

   assert.deepEqual(hub.main.idsForOwner(owner), ['local-category-1', 'local-category-2'])
   assert.equal(hub.categoryOwnerOf(familyId), owner)
   assert.equal(hub.main.generatorDefinition(familyId).owner, owner)
   assert.equal(hub.main.generatorAdd(familyId).id, 'local-category-3')
   assert.equal(hub.main.ownerOf('local-category-3'), owner)

   hub.removeOwner(owner)
   assert.equal(hub.main.generatorDefinition(familyId), undefined)
   assert.equal(hub.getCategory(familyId), undefined)
   assert.equal(hub.main.get('local-category-3'), undefined)
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
   assert.throws(
      () => store.createFile({ id: 'disabled', name: 'Example.js.disable', source: '' }),
      (error) => error instanceof LocalNotationStorageError && error.code === 'INVALID_FILE_NAME'
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
