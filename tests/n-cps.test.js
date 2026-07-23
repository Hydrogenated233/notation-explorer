'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const projectRoot = path.join(__dirname, '..')

function loadGenerator() {
   const context = vm.createContext({ register: [], window: null })
   context.window = context
   context.globalThis = context
   vm.runInContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'notations', '00-shared-seq.js'), 'utf8'),
      context
   )
   vm.runInContext(
      fs.readFileSync(
         path.join(projectRoot, 'js', 'notations', 'CpS', 'n-CpS', 'n-CpS.js'),
         'utf8'
      ),
      context
   )
   return {
      context,
      generator: context.NotationGenerators['n-cps'],
      initial: context.register,
   }
}

test('n-CpS registers 1-CpS and 2-CpS as independent initial notations', () => {
   const { initial } = loadGenerator()

   assert.deepEqual(Array.from(initial, (notation) => notation.id), ['1-cps', '2-cps'])
   assert.deepEqual(Array.from(initial, (notation) => notation.name), ['1-CpS', '2-CpS'])
   assert.deepEqual(
      Array.from(initial, (notation) => notation.generatedFamily.index),
      [1, 2]
   )
})

test('each generated CpS captures its own parameter and cache', () => {
   const { generator, initial } = loadGenerator()
   const atOneNotation = initial[0]
   const atThreeNotation = generator.create(3)
   const expression = [1, 1, 1, 1, 3, 6]

   const atOne = atOneNotation.FS(expression, 1)
   const atThree = atThreeNotation.FS(expression, 1)
   const atOneAgain = atOneNotation.FS(expression, 1)

   assert.deepEqual(Array.from(atOne), [1, 1, 1, 1, 3, 5])
   assert.deepEqual(Array.from(atThree), [1, 1, 1, 1, 3, 5, 7])
   assert.deepEqual(Array.from(atOneAgain), Array.from(atOne))
   assert.equal(atThreeNotation.id, '3-cps')
   assert.equal(atThreeNotation.name, '3-CpS')
})

test('n-CpS generator validates its range and every variant expands Limit', () => {
   const { generator, initial } = loadGenerator()

   assert.equal(generator.start, 1)
   assert.equal(generator.initial, 2)
   assert.equal(generator.maximum, 64)
   assert.throws(() => generator.create(0), /integer from 1 to 64/)
   assert.throws(() => generator.create(65), /integer from 1 to 64/)
   assert.deepEqual(Array.from(initial[0].FS([Infinity], 2)), [1, 3])
   assert.deepEqual(Array.from(initial[1].FS([Infinity], 2)), [1, 3])
})
