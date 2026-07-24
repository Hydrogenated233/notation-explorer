'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Runtime = require('../js/notation-registry.js')
const {
   BUILTIN_OWNER,
   installGlobals,
   NotationRegistryHub,
   NotationRegistryError,
} = Runtime

function localNotation(id, overrides) {
   return Object.assign({
      id,
      name: id,
      display() { return 'local' },
      able() { return false },
      compare() { return 0 },
      FS() { return [] },
      init() { return [] },
   }, overrides)
}

function rewrittenNotation(overrides) {
   return Object.assign({
      id: 'rewritten',
      name: 'Rewritten',
      simple_name: 'RW',
      category_id: 'category-parent',
      display: {
         plain: (value) => 'plain:' + value,
         html: (value) => '<b>' + value + '</b>',
         latex: (value) => '\\mathbf{' + value + '}',
         from_display: (value) => Number(value),
         from_display_alter: (value) => Number(value) + 1,
      },
      display_equiv: { remote: (value) => 'remote:' + value },
      is_limit: (value) => value > 0,
      compare: (left, right) => left - right,
      FS: (value, index) => value - index,
      FS_alter: (value, index) => value + index,
      FS_short: (value) => value - 1,
      init: () => [Infinity, 0],
      credit_text_id: 'credit.test',
   }, overrides)
}

function rewrittenBundle() {
   const parent = {
      id: 'category-parent',
      name: 'Parent category',
      simple_name: 'Parent',
   }
   const generated = {
      id: 'category-generated',
      name: 'Generated category',
      simple_name: 'n-G',
      parent_id: parent.id,
      generator: {
         start: 1,
         initial: 2,
         create(index) {
            return rewrittenNotation({
               id: 'generated-' + index,
               name: index + '-Generated',
               category_id: 'category-generated',
            })
         },
      },
   }
   const direct = rewrittenNotation({ id: 'direct', name: 'Direct notation' })
   const decorated = rewrittenNotation({
      id: 'decorate-source',
      name: 'Decoration source',
      display_equiv: {
         remote: (value) => 'remote:' + value,
         same: () => 'upstream',
      },
      draw_diagram: {
         default_data: { invert_vertical: true },
         draw_diagram(expression, data) {
            return {
               width: 20,
               height: 10,
               elements: [{
                  type: 'text',
                  x: 1,
                  y: 2,
                  text: expression + ':' + data.current_equiv,
                  fill: true,
                  size: 9,
               }],
               extra_text: [],
            }
         },
      },
   })
   const defaults = [1, 2].map((index) => generated.generator.create(index))
   const notations = [direct, decorated].concat(defaults)
   const notationsById = Object.fromEntries(notations.map((notation) => [notation.id, notation]))
   return {
      source: {
         repository: 'https://github.com/SmileLee-lyx/ne-rewritten',
         commit: 'test-commit',
      },
      notationsById,
      categories: [parent, generated],
      categoriesById: {
         [parent.id]: parent,
         [generated.id]: generated,
      },
      generatorCategoryIds: [generated.id],
      generatedNotationIds: defaults.map((notation) => notation.id),
      createGeneratedNotation(categoryId, index) {
         return this.categoriesById[categoryId].generator.create(index)
      },
   }
}

test('registerNotation accepts an ne-rewritten definition while push remains legacy-only', () => {
   const bundle = rewrittenBundle()
   const raw = rewrittenNotation({
      id: 'direct-raw',
      draw_diagram: {
         default_data: { invert_vertical: true },
         draw_diagram(expression, data) {
            assert.equal(data.invert_vertical, true)
            return {
               width: 8,
               height: 4,
               elements: [{ type: 'line', x1: 1, y1: 2, x2: 3, y2: 4, stroke: true }],
               extra_text: [{ text: 'x<sub>1</sub>', x: 0, y: 0, display_html: true }],
            }
         },
      },
   })
   bundle.notationsById[raw.id] = raw
   const hub = new NotationRegistryHub()
   const notation = hub.main.registerNotation(raw, bundle)

   assert.equal(notation.display(2), '<b>2</b>')
   assert.equal(notation.displayPlain(2), 'plain:2')
   assert.equal(notation.latex(2), '\\mathbf{2}')
   assert.equal(notation.fromDisplay('12'), 12)
   assert.equal(notation.fromDisplay_alter('12'), 13)
   assert.equal(notation.able, raw.is_limit)
   assert.equal(notation.FS, raw.FS)
   assert.equal(notation.FSalter, raw.FS_alter)
   assert.equal(notation.FSShort, raw.FS_short)
   assert.deepEqual(notation.init(), [
      { expr: Infinity, low: [0], subitems: [] },
      { expr: 0, low: [0], subitems: [] },
   ])
   assert.deepEqual(notation.provenance, {
      repository: bundle.source.repository,
      commit: bundle.source.commit,
      notationId: raw.id,
   })
   assert.equal(Object.isFrozen(notation.provenance), true)
   assert.deepEqual(
      notation.drawDiagram('expr').actions.filter((action) => action.type === 'text')
         .map((action) => action.value),
      ['x_1']
   )

   assert.throws(
      () => new NotationRegistryHub().main.push(raw),
      (error) => error instanceof NotationRegistryError && error.code === 'INVALID_ENTRY'
   )
})

test('global and staged register_notation normalize direct upstream definitions', () => {
   const bundle = rewrittenBundle()
   const globalTarget = {}
   const globalHub = installGlobals(globalTarget)
   const globalRaw = rewrittenNotation({ id: 'global-raw' })
   bundle.notationsById[globalRaw.id] = globalRaw
   globalTarget.register_notation(globalRaw, bundle)
   assert.equal(globalHub.main.get('global-raw').display(3), '<b>3</b>')

   const localHub = new NotationRegistryHub()
   const localRaw = rewrittenNotation({ id: 'local-raw' })
   bundle.notationsById[localRaw.id] = localRaw
   const transaction = localHub.prepareSource(
      'local-rewritten-file',
      'register_notation(remoteDefinition, rewrittenBundle);',
      { context: { remoteDefinition: localRaw, rewrittenBundle: bundle } }
   )
   assert.equal(localHub.main.get('local-raw'), undefined)
   transaction.commit()
   assert.equal(localHub.main.get('local-raw').display(4), '<b>4</b>')
   assert.equal(localHub.main.ownerOf('local-raw'), 'local-rewritten-file')
})

test('a staged generator category auto-initializes and supports child-before-parent declarations', () => {
   const hub = new NotationRegistryHub()
   const child = {
      id: 'category-child-generator',
      name: 'Child generator',
      parent_id: 'category-late-parent',
      generator: {
         start: 1,
         initial: 2,
         maximum: 3,
         create(index) {
            return rewrittenNotation({
               id: 'child-generated-' + index,
               name: 'Child ' + index,
               category_id: 'category-child-generator',
            })
         },
      },
   }
   const parent = { id: 'category-late-parent', name: 'Late parent' }
   const transaction = hub.prepareSource(
      'category-only-file',
      'register_category(childCategory); register_category(parentCategory);',
      { context: { childCategory: child, parentCategory: parent } }
   )

   assert.equal(hub.main.length, 0)
   transaction.commit()
   assert.deepEqual(hub.main.idsForOwner('category-only-file'), [
      'child-generated-1',
      'child-generated-2',
   ])
   assert.equal(hub.getCategory(child.id).parent_id, parent.id)
   assert.equal(hub.main.get('child-generated-1').upstreamDefinition.id, 'child-generated-1')
   assert.deepEqual(hub.main.initGenerator(child).changed, [])
})

test('installRewrittenBundle installs hierarchy, variants, aliases, metadata, and decorations', () => {
   const bundle = rewrittenBundle()
   const hub = new NotationRegistryHub()
   const localDisplay = () => 'local-primary'
   const localDraw = () => ({ width: 1, height: 1, actions: [{ type: 'local' }] })
   const local = localNotation('local-target', {
      display: localDisplay,
      drawDiagram: localDraw,
      display_equiv: { same: () => 'local-equivalent' },
   })
   hub.main.push(local)

   const result = hub.main.installRewrittenBundle({
      add: ['direct'],
      generators: [{
         categoryId: 'category-generated',
         resolveId(index) { return 'live-generated-' + index },
      }],
      decorate: [{ targetId: 'local-target', sourceId: 'decorate-source' }],
   }, bundle)

   assert.deepEqual(result.added.map((notation) => notation.id), ['direct'])
   assert.deepEqual(hub.categoryAncestors('category-generated').map((category) => category.id), [
      'category-parent',
      'category-generated',
   ])
   assert.deepEqual(hub.getCategory('category-generated').path, ['Parent', 'n-G'])
   assert.equal(hub.main.get('direct').provenance.notationId, 'direct')
   assert.equal(hub.main.get('generated-1'), undefined)
   assert.equal(hub.main.get('live-generated-1').generatedFamily.sourceId, 'generated-1')
   assert.equal(hub.main.get('live-generated-1').upstreamGenerator.index, 1)
   assert.equal(hub.main.ownerOf('live-generated-1'), BUILTIN_OWNER)
   assert.equal(hub.main.generatorAdd('category-generated').id, 'live-generated-3')
   assert.equal(hub.main.generatorRemove('category-generated').id, 'live-generated-3')

   assert.equal(local.display, localDisplay)
   assert.equal(local.display_equiv.same(), 'local-equivalent')
   assert.equal(local.display_equiv.remote('x'), 'remote:x')
   assert.deepEqual(local.drawDiagram('x'), localDraw())
   assert.equal(
      local.drawDiagram('x', 'remote').actions.find((action) => action.type === 'text').value,
      'x:remote'
   )
   assert.equal(local.provenance.notationId, 'decorate-source')
})

test('bundle add infers generated families and bundle lookup never falls back to a global', () => {
   const bundle = rewrittenBundle()
   const hub = new NotationRegistryHub()
   hub.main.installRewrittenBundle({ add: ['generated-1', 'generated-2'] }, bundle)

   assert.equal(hub.main.generatorDefinition('category-generated').currentIndex, 2)
   assert.equal(hub.main.get('generated-2').upstreamGenerator.index, 2)
   assert.equal(hub.main.generatorAdd('category-generated').id, 'generated-3')

   globalThis.NeRewrittenNotationBundle = bundle
   try {
      assert.throws(
         () => new NotationRegistryHub().main.installRewrittenBundle({ add: ['direct'] }),
         /explicit ne-rewritten notation bundle is required/
      )
   } finally {
      delete globalThis.NeRewrittenNotationBundle
   }
})

test('failed staged bundle installation leaves entries and metadata untouched', () => {
   const bundle = rewrittenBundle()
   const hub = new NotationRegistryHub()
   const builtIn = localNotation('local-target')
   hub.main.push(builtIn)

   assert.throws(
      () => hub.prepareSource(
         'local-bundle-file',
         `register.installRewrittenBundle({
            add: ['direct'],
            decorate: [{ targetId: 'local-target', sourceId: 'decorate-source' }]
         }, rewrittenBundle);`,
         { context: { rewrittenBundle: bundle } }
      ),
      (error) => error instanceof NotationRegistryError && error.code === 'OWNER_MISMATCH'
   )
   assert.deepEqual(hub.main.map((notation) => notation.id), ['local-target'])
   assert.equal(builtIn.provenance, undefined)
   assert.equal(hub.getCategory('category-parent'), undefined)
   assert.equal(hub.main.generatorDefinition('category-generated'), undefined)
})

test('rewritten normalization helpers are exported by the registry runtime', () => {
   assert.equal(typeof Runtime.normalizeRewrittenDefinition, 'function')
   assert.equal(typeof Runtime.decorateWithRewrittenDefinition, 'function')
   assert.equal(typeof Runtime.createBundledGeneratedDefinition, 'function')
   assert.equal(typeof Runtime.installRewrittenBundle, 'function')
})
