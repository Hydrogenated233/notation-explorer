'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { NotationRegistryHub } = require('../js/notation-registry.js')

function loadNotation() {
   const hub = new NotationRegistryHub()
   const context = vm.createContext({
      register: hub.main,
      analysis_register: hub.analysis,
      Infinity,
      Number,
      String,
      Object,
      Array,
      Math,
      Map,
      parseInt,
      isNaN,
   })
   const root = path.join(__dirname, '..')
   for (const file of [
      path.join('js', 'notations', '00-shared-seq.js'),
      path.join('js', 'notations', '01-shared-matrix.js'),
      path.join('js', 'notations', 'BM-like', 'PrMS.js'),
   ]) {
      vm.runInContext(
         fs.readFileSync(path.join(root, file), 'utf8'),
         context,
         { filename: file }
      )
   }
   return hub.main.get('prms')
}

function plainMatrix(matrix) {
   return Array.from(matrix, (column) => Array.from(column))
}

test('PrMS registers the Primitive Matrix System surface', () => {
   const notation = loadNotation()

   assert.equal(notation.name, 'Primitive Matrix System')
   assert.equal(typeof notation.FS, 'function')
   assert.deepEqual(
      Array.from(notation.init(), (item) => plainMatrix(item.expr)),
      [[[Infinity]], []]
   )
})

test('PrMS displays and parses the Python expander format', () => {
   const notation = loadNotation()

   assert.equal(notation.display([[Infinity]]), 'Limit')
   assert.equal(notation.display([]), '()')
   assert.equal(notation.display([[1], [2, 2], [3, 3, 3]]), '(1)(2,2)(3,3,3)')
   assert.deepEqual(plainMatrix(notation.fromDisplay('Limit')), [[Infinity]])
   assert.deepEqual(plainMatrix(notation.fromDisplay('()')), [])
   assert.deepEqual(plainMatrix(notation.fromDisplay('(1)(2,2)')), [[1], [2, 2]])
   assert.deepEqual(plainMatrix(notation.fromDisplay('(1)(0)(2)')), [[1], [0], [2]])
})

test('PrMS Limit fundamental sequence uses triangular constant columns', () => {
   const notation = loadNotation()

   assert.deepEqual(plainMatrix(notation.FS([[Infinity]], 0)), [[1]])
   assert.deepEqual(plainMatrix(notation.FS([[Infinity]], 1)), [[1], [2, 2]])
   assert.deepEqual(plainMatrix(notation.FS([[Infinity]], 2)), [[1], [2, 2], [3, 3, 3]])
   assert.deepEqual(plainMatrix(notation.FS([[Infinity]], 3)), [[1], [2, 2], [3, 3, 3], [4, 4, 4, 4]])
})

test('PrMS finite expansion matches PrMS展开器.py fixtures', () => {
   const notation = loadNotation()
   const fixtures = [
      ['(1)', 0, '()'],
      ['(1)', 3, '()'],
      ['(1)(2)', 0, '(1)'],
      ['(1)(2)', 1, '(1)(1)'],
      ['(1)(2)', 3, '(1)(1)(1)(1)'],
      ['(1)(2,2)', 0, '(1)(2)'],
      ['(1)(2,2)', 1, '(1)(2,1)(2,2)'],
      ['(1)(2,2)', 2, '(1)(2,1)(2,2,1)(2,2,2)'],
      ['(1)(2,2)(3,3,3)', 1, '(1)(2,2)(3,3,2)(3,3,3)'],
      ['(1)(3,2)(4,3)', 2, '(1)(3,2)(4,2)(4,2)(4)'],
      ['(1)(0)(2)', 0, '(1)'],
      ['(1)(2)(0)(3)', 1, '(1)(2)'],
   ]

   for (const [source, index, expected] of fixtures) {
      const result = notation.FS(notation.fromDisplay(source), index)
      assert.equal(notation.display(result), expected, source + '[' + index + ']')
   }
})

test('PrMS only marks finite matrices with a parented last entry as limits', () => {
   const notation = loadNotation()

   assert.equal(notation.able([[Infinity]]), true)
   assert.equal(notation.able([]), false)
   assert.equal(notation.able([[1]]), false)
   assert.equal(notation.able([[2]]), false)
   assert.equal(notation.able([[1], [2]]), true)
   assert.equal(notation.able([[1], [2, 2]]), true)
})

test('PrMS treats a parentless last item as one fixed successor step', () => {
   const notation = loadNotation()
   const expr = notation.fromDisplay('(1)(2,1)(1)(2,1)')

   assert.equal(notation.able(expr), false)
   for (let index = 0; index < 6; index++) {
      assert.equal(
         notation.display(notation.FS(expr, index)),
         '(1)(2,1)(1)(2)'
      )
   }
})

test('PrMS keeps sparse hidden columns distinct in the FS cache', () => {
   const notation = loadNotation()

   assert.equal(notation.display(notation.FS(notation.fromDisplay('(1)'), 0)), '()')
   assert.equal(notation.display(notation.FS(notation.fromDisplay('(1)(0)(2)'), 0)), '(1)')
})

test('PrMS compares every supported Limit representation', () => {
   const notation = loadNotation()
   const finite = [[1], [2, 2]]

   for (const limit of [Infinity, [Infinity], [[Infinity]]]) {
      assert.equal(notation.compare(limit, finite), 1)
      assert.equal(notation.compare(finite, limit), -1)
      assert.equal(notation.compare(limit, [[Infinity]]), 0)
   }
})
