'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Adapter = require('../js/smilelee-notation-adapter.js')

const SOURCE = Object.freeze({
   repository: 'https://github.com/SmileLee-lyx/ne-rewritten',
   commit: '5413a94f0c5b6b56b4c13a91a8acf3a794698bb9',
})

function bundleFor(raw) {
   return { source: SOURCE, notationsById: { [raw.id]: raw } }
}

function generatedBundle(overrides) {
   const category = {
      id: 'category-generated',
      name: 'Generated family',
      simple_name: 'n-G',
      parent_id: 'category-parent',
      generator: {
         start: 2,
         initial: 3,
         create(index) {
            return rawDefinition({
               id: 'generated-' + index,
               name: index + '-Generated',
               category_id: 'category-generated',
            })
         },
      },
   }
   const bundle = {
      source: SOURCE,
      notationsById: {},
      categories: [category],
      categoriesById: { [category.id]: category },
      createGeneratedNotation(categoryId, index) {
         return this.categoriesById[categoryId].generator.create(index)
      },
   }
   return Object.assign(bundle, overrides)
}

function rawDefinition(overrides) {
   return Object.assign({
      id: 'remote',
      name: 'Remote',
      simple_name: 'R',
      category_id: 'category-test',
      display: {
         plain: (value) => 'plain:' + value,
         html: (value) => '<b>' + value + '</b>',
         latex: (value) => '\\mathbf{' + value + '}',
         from_display: (value) => Number(value),
      },
      display_equiv: { alternate: (value) => 'alt:' + value },
      is_limit: (value) => value > 0,
      compare: (left, right) => left - right,
      FS: (value, index) => value - index,
      FS_alter: (value, index) => value + index,
      FS_short: (value) => value - 1,
      init: () => [Infinity, 0],
      credit_text_id: 'credit.test-alpha0',
   }, overrides)
}

test('adaptDefinition maps the upstream surface without replacing its algorithms', () => {
   const raw = rawDefinition()
   const adapted = Adapter.adaptDefinition(raw, bundleFor(raw))

   assert.equal(adapted.id, raw.id)
   assert.equal(adapted.name, raw.name)
   assert.equal(adapted.display(2), '<b>2</b>')
   assert.equal(adapted.displayPlain(2), 'plain:2')
   assert.equal(adapted.latex(2), '\\mathbf{2}')
   assert.equal(adapted.fromDisplay('12'), 12)
   assert.equal(adapted.able, raw.is_limit)
   assert.equal(adapted.compare, raw.compare)
   assert.equal(adapted.FS, raw.FS)
   assert.equal(adapted.FSalter, raw.FS_alter)
   assert.equal(adapted.FSShort, raw.FS_short)
   assert.deepEqual(adapted.init(), [
      { expr: Infinity, low: [0], subitems: [] },
      { expr: 0, low: [0], subitems: [] },
   ])
   assert.notEqual(adapted.display_equiv, raw.display_equiv)
   assert.equal(adapted.display_equiv.alternate, raw.display_equiv.alternate)
   assert.equal(adapted.credit_text_id, 'credit.test-alpha0')
   assert.deepEqual(adapted.provenance, {
      repository: SOURCE.repository,
      commit: SOURCE.commit,
      notationId: raw.id,
   })
})

test('display fallback derives LaTeX from an upstream function display', () => {
   const normalized = Adapter.normalizeDisplay((value) => 'ω<sub>' + value + '</sub>')
   assert.equal(normalized.plain(3), 'ω<sub>3</sub>')
   assert.equal(normalized.html(3), 'ω<sub>3</sub>')
   assert.equal(normalized.latex(3), '\\omega _{3}')
})

test('adapted initial lower bounds follow the next upstream expression', () => {
   const raw = rawDefinition({ init: () => [[Infinity], ['middle'], ['zero']] })
   const adapted = Adapter.adaptDefinition(raw, bundleFor(raw))

   assert.deepEqual(adapted.init(), [
      { expr: [Infinity], low: [['middle']], subitems: [] },
      { expr: ['middle'], low: [['zero']], subitems: [] },
      { expr: ['zero'], low: [['zero']], subitems: [] },
   ])
})

test('diagram conversion maps elements and extra text to legacy canvas actions', () => {
   let receivedData
   const defaults = { current_equiv: undefined, invert_vertical: true }
   const raw = rawDefinition({
      id: 'omega-y-actual',
      draw_diagram: {
         default_data: defaults,
         draw_diagram(expression, data) {
            assert.equal(expression, 'expr')
            receivedData = data
            return {
               width: 80,
               height: 40,
               elements: [
                  {
                     type: 'line', x1: 1, y1: 2, x2: 3, y2: 4,
                     stroke: true, stroke_color: { r: 1, g: 2, b: 3, a: 0.5 }, width: 2,
                  },
                  {
                     type: 'circle', x: 5, y: 6, r: 7,
                     stroke: false, fill: true, fill_color: { r: 4, g: 5, b: 6 },
                  },
                  {
                     type: 'text', x: 8, y: 9, text: 'node', fill: true,
                     fill_color: { r: 7, g: 8, b: 9 }, size: 12, align: 'center',
                  },
               ],
               extra_text: [
                  { text: 'x<sub>1</sub>', x: 10, y: 11, display_html: true, align: 'center' },
               ],
            }
         },
      },
   })

   const diagram = Adapter.createDrawDiagram(raw)('expr', 'DBMS_MN')
   assert.equal(receivedData.current_equiv, "DBMS'")
   assert.equal(receivedData.invert_vertical, true)
   assert.equal(defaults.current_equiv, undefined)
   assert.equal(diagram.width, 80)
   assert.equal(diagram.height, 40)
   assert.deepEqual(
      diagram.actions.filter((action) => action.type === 'line').map((action) => action.start),
      [{ x: 1, y: 2 }]
   )
   assert.deepEqual(
      diagram.actions.filter((action) => action.type === 'circle').map((action) => action.center),
      [{ x: 5, y: 6 }]
   )
   assert.deepEqual(
      diagram.actions.filter((action) => action.type === 'text').map((action) => action.value),
      ['node', 'x_1']
   )
})

test('decorateDefinition keeps the local primary implementation and adds equivalent metadata only', () => {
   const localDisplay = () => 'local'
   const localFS = () => ['local-fs']
   const localDraw = () => ({ width: 1, height: 1, actions: [{ type: 'local' }] })
   const target = {
      id: 'local',
      display: localDisplay,
      FS: localFS,
      drawDiagram: localDraw,
      display_equiv: { local: () => 'local-equiv' },
   }
   const raw = rawDefinition({
      id: 'remote',
      display_equiv: { remote: () => 'remote-equiv' },
      draw_diagram: {
         default_data: {},
         draw_diagram: () => ({ width: 2, height: 3, elements: [], extra_text: [] }),
      },
   })

   Adapter.decorateDefinition(target, raw, bundleFor(raw))

   assert.equal(target.display, localDisplay)
   assert.equal(target.FS, localFS)
   assert.equal(target.display_equiv.local(), 'local-equiv')
   assert.equal(target.display_equiv.remote(), 'remote-equiv')
   assert.deepEqual(target.drawDiagram('x'), localDraw())
   assert.deepEqual(target.drawDiagram('x', 'remote'), { width: 2, height: 3, actions: [] })
   assert.equal(target.credit_text_id, raw.credit_text_id)
   assert.equal(target.provenance.notationId, raw.id)

   const provenanceOnly = { id: 'provenance-only' }
   Adapter.decorateDefinition(provenanceOnly, raw, bundleFor(raw), { metadata: false })
   assert.equal(provenanceOnly.provenance.notationId, raw.id)
   assert.equal(provenanceOnly.credit_text_id, undefined)
   assert.equal(provenanceOnly.display_equiv, undefined)
})

test('generated definitions retain generator and category metadata', () => {
   const bundle = generatedBundle()
   const adapted = Adapter.createGeneratedDefinition('category-generated', 4, bundle)

   assert.equal(adapted.id, 'generated-4')
   assert.equal(adapted.upstream_category_id, 'category-generated')
   assert.deepEqual(adapted.upstreamGenerator, {
      categoryId: 'category-generated',
      index: 4,
      start: 2,
      initial: 3,
      category: bundle.categoriesById['category-generated'],
   })
   assert.equal(adapted.display(4), '<b>4</b>')
   assert.equal(adapted.FS, adapted.upstreamDefinition.FS)
})

test('bulk install retains generator coordinates for default variants', () => {
   const bundle = generatedBundle()
   const defaults = [2, 3].map((index) => bundle.createGeneratedNotation('category-generated', index))
   bundle.notationsById = Object.fromEntries(defaults.map((raw) => [raw.id, raw]))
   bundle.generatorCategoryIds = ['category-generated']
   bundle.generatedNotationIds = defaults.map((raw) => raw.id)
   const registry = []

   Adapter.install(registry, { add: bundle.generatedNotationIds }, bundle)

   assert.deepEqual(
      registry.map((notation) => [notation.id, notation.upstreamGenerator.index]),
      [['generated-2', 2], ['generated-3', 3]]
   )
   assert.equal(registry[1].upstreamGenerator.categoryId, 'category-generated')
})

test('generated definition indexes are validated before invoking upstream code', () => {
   let calls = 0
   const bundle = generatedBundle()
   bundle.categoriesById['category-generated'].generator.create = function () {
      calls++
      return rawDefinition({ id: 'never', category_id: 'category-generated' })
   }

   assert.throws(
      () => Adapter.createGeneratedDefinition('category-generated', 1, bundle),
      /must be at least 2; received 1/
   )
   assert.throws(
      () => Adapter.createGeneratedDefinition('category-generated', 2.5, bundle),
      /must be a safe integer/
   )
   assert.throws(
      () => Adapter.createGeneratedDefinition('missing', 2, bundle),
      /Unknown upstream generator category: missing/
   )
   assert.equal(calls, 0)
})

test('installGenerated rejects duplicate ids and reports their generator coordinate', () => {
   const bundle = generatedBundle()
   const registry = []
   const installed = Adapter.installGenerated(registry, 'category-generated', 4, bundle)

   assert.equal(registry.length, 1)
   assert.equal(registry[0], installed)
   assert.throws(
      () => Adapter.installGenerated(registry, 'category-generated', 4, bundle),
      /Generated notation id is already registered: generated-4 \(category-generated\[4\]\)/
   )
   assert.equal(registry.length, 1)
})

test('generated definitions must belong to the requested category', () => {
   const bundle = generatedBundle()
   bundle.categoriesById['category-generated'].generator.create = function () {
      return rawDefinition({ id: 'wrong-category', category_id: 'category-other' })
   }
   assert.throws(
      () => Adapter.createGeneratedDefinition('category-generated', 4, bundle),
      /returned notation 'wrong-category' in category 'category-other'/
   )
})
