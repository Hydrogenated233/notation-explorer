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
      fs.readFileSync(path.join(root, 'js', 'notations', '00-shared-seq.js'), 'utf8'),
      context,
      { filename: '00-shared-seq.js' }
   )
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

test('spps4 registers the upstream legacy surface', () => {
   const notation = loadNotation()

   assert.equal(notation.name, 'Second PPS4')
   assert.equal(typeof notation.FS, 'function')
   assert.equal(typeof notation.FSalter, 'function')
   assert.equal(typeof notation.FSShort, 'function')
   assert.deepEqual(Array.from(notation.init(), (item) => plain(item.expr)), [[Infinity], []])
})

test('spps4 display, parsing, and comparison match PPS.ts', () => {
   const notation = loadNotation()

   assert.equal(notation.display([Infinity]), 'Limit')
   assert.equal(notation.display([]), '')
   assert.deepEqual(plain(notation.fromDisplay('Limit')), [Infinity])
   assert.deepEqual(plain(notation.fromDisplay(' 0, 1x, +2, 3.9 ')), [0, 1, 2, 3])
   assert.throws(() => notation.fromDisplay(''))
   assert.throws(() => notation.fromDisplay('Limit '))
   assert.throws(() => notation.fromDisplay('1,,2'))
   assert.equal(notation.compare([], [0]), -1)
   assert.equal(notation.compare([0, 2], [0, 2, 0]), -1)
})

test('spps4 FS matches upstream weak, strong, shifted, and stop cases', () => {
   const notation = loadNotation()

   assert.deepEqual(plain(notation.FS([Infinity], 3)), [0, 1, 2, 3])
   assert.deepEqual(plain(notation.FS([], 7)), [])
   assert.deepEqual(plain(notation.FS([0, 1, 0], 99)), [0, 1])
   assert.deepEqual(plain(notation.FS([0, 1, 1, 1, 3], 0)), [0, 1, 1, 1])
   assert.deepEqual(plain(notation.FS([0, 1, 1, 1, 3], 2)), [0, 1, 1, 1, 1, 1, 1, 1])
   assert.deepEqual(plain(notation.FS([0, 1, 0, 2, 3], 2)), [0, 1, 0, 2, 1, 2, 3, 2])
   assert.deepEqual(plain(notation.FS([0, 1, 0, 4, 3], 2)), [0, 1, 0, 4, 1, 6, 3, 8])
   assert.deepEqual(plain(notation.FS([0, 2, 1, 0, 1, 2, 5], 2)), [0, 2, 1, 0, 1, 2, 1, 2, 1, 2])
})

test('spps4 preserves the upstream b-offset quirk', () => {
   const notation = loadNotation()

   assert.deepEqual(plain(notation.FS([0, 1, 1, 1, 3, 4], 1)), [0, 1, 1, 1, 3, 4, 3])
})

test('spps4 short FS follows upstream Y_FS_variants indexing', () => {
   const notation = loadNotation()

   assert.deepEqual(plain(notation.FSalter([0, 1, 0, 2, 3], 2)), [0, 1, 0, 2, 1, 2, 3])
   assert.deepEqual(plain(notation.FSShort([Infinity], 3)), [0, 1, 2, 3])
   assert.deepEqual(plain(notation.FSShort([0, 1, 0, 2, 3], 2)), [0, 1, 0, 2, 1, 2, 3])
   assert.deepEqual(plain(notation.FSShort([0, 1, 0, 3], 0)), [0, 1, 0])
   assert.deepEqual(plain(notation.FSShort([0, 1, 0, 3], 1)), [0, 1, 0, 1])
   assert.deepEqual(plain(notation.FSShort([0, 1, 0, 3], 2)), [0, 1, 0])
   assert.deepEqual(plain(notation.FSShort([0, 1, 0, 3], 3)), [0, 1, 0, 1])
})
