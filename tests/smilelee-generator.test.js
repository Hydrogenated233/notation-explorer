'use strict'

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const assert = require('node:assert/strict')
const Adapter = require('../js/smilelee-notation-adapter.js')

function loadBundle() {
   const context = Object.create(null)
   context.globalThis = context
   const bundlePath = path.resolve(__dirname, '..', 'js', 'smilelee-notation-bundle.js')
   vm.runInNewContext(fs.readFileSync(bundlePath, 'utf8'), context, { filename: bundlePath })
   return context.SmileLeeNotationBundle
}

test('bundle exposes every upstream generator beyond its default initial index', () => {
   const bundle = loadBundle()

   assert.equal(bundle.schemaVersion, 2)
   assert.equal(bundle.generatorCategoryIds.length, 11)
   bundle.generatorCategoryIds.forEach((categoryId) => {
      const category = bundle.categoriesById[categoryId]
      const index = category.generator.initial + 1
      const raw = bundle.createGeneratedNotation(categoryId, index)

      assert.equal(raw.category_id, categoryId)
      assert.equal(typeof raw.id, 'string')
      assert.ok(raw.id.length > 0)
   })
   assert.equal(
      bundle.createGeneratedNotation('category-upms-partial', 4).id,
      'upms-partial-4'
   )
})

test('real generated definitions adapt and install with duplicate protection', () => {
   const bundle = loadBundle()
   const registry = []
   const notation = Adapter.installGenerated(registry, 'category-upms-partial', 4, bundle)

   assert.equal(notation.id, 'upms-partial-4')
   assert.equal(notation.name, 'BMS(4 rows) + UPMS')
   assert.equal(notation.upstreamGenerator.index, 4)
   assert.equal(notation.upstreamGenerator.category.simple_name, '(>n)-UPMS')
   assert.equal(typeof notation.FS, 'function')
   assert.equal(registry[0], notation)
   assert.throws(
      () => Adapter.installGenerated(registry, 'category-upms-partial', 4, bundle),
      /Generated notation id is already registered: upms-partial-4/
   )
})

test('bundle rejects invalid generator coordinates without invoking a generator', () => {
   const bundle = loadBundle()

   assert.throws(
      () => bundle.createGeneratedNotation('category-upms-partial', 1),
      /must be at least 2; received 1/
   )
   assert.throws(
      () => bundle.createGeneratedNotation('category-upms-partial', 2.5),
      /must be a safe integer/
   )
   assert.throws(
      () => bundle.createGeneratedNotation('category-missing', 2),
      /Unknown SmileLee notation category 'category-missing'/
   )
})
