'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { runAudit } = require('../scripts/audit-notation-expansion.js')

test('every default main notation expands its Limit and first child with FS and FSShort', {
   timeout: 120000,
}, async () => {
   const audit = await runAudit()

   assert.equal(audit.ids.length, 132, 'default main registry size changed')
   assert.equal(new Set(audit.ids).size, audit.ids.length, 'default main registry contains duplicate IDs')
   assert.equal(audit.results.length, audit.ids.length * 2)
   assert.deepEqual(
      audit.failures.map((failure) => ({
         id: failure.id,
         variant: failure.variant,
         status: failure.status,
         phase: failure.phase,
         error: failure.error,
      })),
      []
   )
})
