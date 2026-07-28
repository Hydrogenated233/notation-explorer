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
      parseInt,
   })
   const root = path.join(__dirname, '..')
   vm.runInContext(
      fs.readFileSync(path.join(root, 'js', 'notations', 'PPS', 'sPPS4.js'), 'utf8'),
      context,
      { filename: 'sPPS4.js' }
   )
   return hub.main.get('spps4')
}

function plain(value) {
   return Array.from(value)
}

test('spps4 keeps its stable identity and framework surface', () => {
   const notation = loadNotation()

   assert.equal(notation.name, 'Second PPS4')
   assert.equal(typeof notation.FS, 'function')
   assert.equal(notation.FSalter, notation.FS)
   assert.equal(notation.FSShort, notation.FS)
   assert.deepEqual(Array.from(notation.init(), (item) => plain(item.expr)), [[Infinity], []])
})

test('spps4 uses Limit instead of 0,2 as its compatibility sentinel', () => {
   const notation = loadNotation()

   assert.equal(notation.display([Infinity]), 'Limit')
   assert.equal(notation.display(Infinity), 'Limit')
   assert.equal(notation.display([]), '(empty)')
   assert.equal(notation.latex([]), '\\emptyset')
   assert.deepEqual(plain(notation.fromDisplay('Limit')), [Infinity])
   assert.deepEqual(plain(notation.fromDisplay('Infinity')), [Infinity])
   assert.deepEqual(plain(notation.fromDisplay('∞')), [Infinity])
   assert.deepEqual(plain(notation.fromDisplay('w')), [Infinity])
   assert.deepEqual(plain(notation.fromDisplay('(empty)')), [])
   assert.deepEqual(plain(notation.fromDisplay('0,2')), [0, 2])
   assert.deepEqual(plain(notation.fromDisplay(' 0, 1x, +2, 3.9 ')), [0, 1, 2, 3])
   assert.throws(() => notation.fromDisplay('1,,2'), /Illegal Second PPS4 sequence/)
   assert.equal(notation.display(null), 'null')
   assert.equal(notation.compare([], [0]), -1)
   assert.equal(notation.compare([0, 2], [Infinity]), -1)
})

test('spps4 Limit expands independently from the finite expression 0,2', () => {
   const notation = loadNotation()

   assert.deepEqual(plain(notation.FS([Infinity], 0)), [0])
   assert.deepEqual(plain(notation.FS([Infinity], 3)), [0, 1, 2, 3])
   assert.deepEqual(plain(notation.FS([0, 2], 0)), [0])
   assert.deepEqual(plain(notation.FS([0, 2], 3)), [0, 2])
})

test('spps4 matches the supplied weak, strong, shifted, and stop rules', () => {
   const notation = loadNotation()

   assert.deepEqual(plain(notation.FS([], 7)), [])
   assert.deepEqual(plain(notation.FS([0, 1, 0], 99)), [0, 1])
   assert.deepEqual(plain(notation.FS([0, 1, 1, 1, 3], 2)), [0, 1, 1, 1, 1, 1, 1, 1])
   assert.deepEqual(plain(notation.FS([0, 1, 0, 2, 3], 2)), [0, 1, 0, 2, 1, 2, 3, 2])
   assert.deepEqual(plain(notation.FS([0, 1, 0, 4, 3], 2)), [0, 1, 0, 4, 1, 6, 3, 8])
   assert.deepEqual(
      plain(notation.FS([0, 2, 1, 0, 1, 2, 5], 2)),
      [0, 2, 1, 0, 1, 2, 3, 2, 5, 2]
   )
   assert.deepEqual(plain(notation.FS([0, 1, 1, 1, 3, 4], 1)), [0, 1, 1, 1, 3, 3, 3])
})

test('spps4 alternative modes use the replacement algorithm', () => {
   const notation = loadNotation()
   const expression = [0, 1, 0, 2, 3]

   assert.deepEqual(plain(notation.FSalter(expression, 2)), plain(notation.FS(expression, 2)))
   assert.deepEqual(plain(notation.FSShort(expression, 2)), plain(notation.FS(expression, 2)))
   assert.throws(() => notation.FS(expression, -1), /non-negative safe integer/)
   assert.throws(() => notation.FS(expression, 1.5), /non-negative safe integer/)
   assert.throws(() => notation.FS(expression, Number.NaN), /non-negative safe integer/)
   assert.throws(() => notation.FS([0, 1, 4], 1), /outside sequence length/)
})
