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
      JSON,
      parseInt,
   })
   const root = path.join(__dirname, '..')
   for (const file of [
      path.join('js', 'notations', '00-shared-seq.js'),
      path.join('js', 'notations', 'PrSS', 'ssqLPrSS.js'),
   ]) {
      vm.runInContext(
         fs.readFileSync(path.join(root, file), 'utf8'),
         context,
         { filename: file }
      )
   }
   return hub.main.get('ssqprss')
}

test('Subsequential LPrSS Limit fundamental sequence preserves nesting', () => {
   const notation = loadNotation()

   assert.deepEqual(
      [0, 1, 2, 3].map((index) => notation.display(notation.FS([Infinity], index))),
      ['1', '1,2', '1,(1,2)', '1,(1,(1,2))']
   )
})

test('Subsequential LPrSS compares successive nested Limit terms strictly', () => {
   const notation = loadNotation()
   const terms = [0, 1, 2, 3].map((index) => notation.FS([Infinity], index))
   const ordered = [[], ...terms, [Infinity]]

   for (let left = 0; left < ordered.length; left++) {
      assert.equal(notation.compare(ordered[left], ordered[left]), 0)
      for (let right = left + 1; right < ordered.length; right++) {
         assert.equal(notation.compare(ordered[left], ordered[right]), -1)
         assert.equal(notation.compare(ordered[right], ordered[left]), 1)
      }
   }
   assert.equal(notation.compare(Infinity, [Infinity]), 0)
   assert.equal(notation.compare([Infinity], Infinity), 0)
})
