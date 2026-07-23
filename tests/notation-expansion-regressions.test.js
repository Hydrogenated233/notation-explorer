'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
   auditNotationVariant,
   generateFS,
   loadRegistry,
} = require('../scripts/audit-notation-expansion.js')

test('HPRRS Limit skips the zero term at its real insertion bound', () => {
   const notation = loadRegistry().get('hprrs')
   const initial = notation.init()
   const limit = { expr: initial[0].expr, bound: initial[0].low[0] }

   assert.equal(notation.compare(limit.bound, initial[1].expr), 0)
   assert.equal(notation.display(generateFS(notation, notation.FS, limit)), '0,1')
   assert.doesNotThrow(() => auditNotationVariant(notation, 'FS'))
})

test('cOCF reduces its first Limit child to canonical zero', () => {
   const notation = loadRegistry().get('cocf')
   const firstChild = notation.FS(notation.init()[0].expr, 0)

   assert.equal(firstChild, 'p(0)')
   assert.equal(notation.FS(firstChild, 0), '0')
   assert.doesNotThrow(() => auditNotationVariant(notation, 'FS'))
})
