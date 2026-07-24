'use strict'

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const assert = require('node:assert/strict')
const manifest = require('../js/notation-manifest.js')
const NotationFileIndex = require('../js/notation-file-index.js')
const NotationDisplay = require('../js/notation-display.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.resolve(__dirname, '..')
const notationRoot = path.join(projectRoot, 'js', 'notations')
const STUB_FILES = NotationFileIndex.sortPaths([
   'Misc/zz-ne-rewritten.js',
   'Y/zz-ne-rewritten.js',
   'BM-like/zz-ne-rewritten.js',
   'BM-like/GMS/zz-ne-rewritten.js',
   'BM-like/nSS/zz-ne-rewritten.js',
   'MN/zz-ne-rewritten.js',
   'SMN/zz-ne-rewritten.js',
   'OCN/zz-ne-rewritten.js',
   'DEN/zz-ne-rewritten.js',
   'TON/zz-ne-rewritten.js',
   'aSAN/zz-ne-rewritten.js',
])

function runFile(context, file, root) {
   vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file })
}

function loadIntegratedRegistry() {
   const hub = new NotationRegistryHub()
   const context = vm.createContext({
      register: hub.main,
      analysis_register: hub.analysis,
      console,
      setTimeout,
      clearTimeout,
   })
   context.window = context
   context.globalThis = context
   runFile(context, 'ne-rewritten-notation-bundle.js', path.join(projectRoot, 'js'))

   const baseFiles = manifest.filter((file) => !STUB_FILES.includes(file))
   baseFiles.forEach((file) => runFile(context, file, notationRoot))
   const beforeIds = hub.main.map((notation) => notation.id)
   const preserved = new Map()
   ;[
      'bm4', 'bhm', 'bsm', 'blm', 'upms', 'wmm',
      'y-seq', 'omega-y-weak', 'omega-y-medium', 'omega-y-strong', 'omega-y',
      'omega-mn', 't-omega-mn', 'nt-1-mn', 'nt-2-mn', 'nt-3-mn',
      'lmn', 'lon', 'cocf', 'hspn', 'den', 'den2', 'den3',
      'ton-drc', 'ton-drp', 'ton-dr', 'ton-drpc', 'ton-i', 'ton-ibp', 'ton-m', 'ton-mc', 'ton-mpc',
      'asan-1', 'asan-2', 'asan-3', 'asan-tilde3plus', 'cm',
   ].forEach((id) => {
      const notation = hub.main.get(id)
      preserved.set(id, {
         display: notation.display,
         able: notation.able,
         compare: notation.compare,
         FS: notation.FS,
         init: notation.init,
      })
   })

   STUB_FILES.forEach((file) => runFile(context, file, notationRoot))
   return { hub, context, beforeIds, preserved }
}

function json(value) {
   return JSON.stringify(value)
}

test('ne-rewritten inventory adds exactly 68 missing definitions without duplicate IDs', () => {
   const { hub, context, beforeIds, preserved } = loadIntegratedRegistry()
   const bundle = context.NeRewrittenNotationBundle
   const afterIds = hub.main.map((notation) => notation.id)
   const before = new Set(beforeIds)
   const addedIds = afterIds.filter((id) => !before.has(id))
   const semanticExclusions = new Set(['cms', 'omega-y-actual', '1-MN', '2-MN', '3-MN'])
   const expectedAddedIds = Array.from(bundle.notations, (notation) => notation.id)
      .filter((id) => !before.has(id) && !semanticExclusions.has(id))
      .sort()
   const exactOverlap = bundle.notations.filter((notation) => before.has(notation.id))

   assert.equal(bundle.counts.direct, 73)
   assert.equal(bundle.counts.generated, 32)
   assert.equal(bundle.counts.total, 105)
   assert.equal(beforeIds.length, 64)
   assert.equal(addedIds.length, 68)
   assert.equal(afterIds.length, 132)
   assert.equal(new Set(afterIds).size, afterIds.length)
   assert.deepEqual(addedIds.slice().sort(), expectedAddedIds)
   assert.equal(exactOverlap.length, 32)
   exactOverlap.forEach((raw) => {
      assert.equal(hub.main.get(raw.id).provenance.notationId, raw.id)
   })

   semanticExclusions.forEach((id) => {
      assert.equal(hub.main.get(id), undefined, id + ' must stay excluded')
   })
   assert.equal(hub.main.get('tbm4').provenance, undefined)
   assert.equal(hub.main.get('a-omega2-mn').provenance, undefined)
   assert.equal(hub.main.get('tbm4').credit_text_id, 'credit.tbm')
   assert.equal(hub.main.get('a-omega2-mn').credit_text_id, 'credit.hypcos_mn')
   assert.equal(hub.main.get('wa-omega2-mn').credit_text_id, 'credit.hypcos_mn')

   preserved.forEach((fields, id) => {
      const notation = hub.main.get(id)
      assert.equal(notation.display, fields.display, id + ' primary display changed')
      assert.equal(notation.able, fields.able, id + ' limit predicate changed')
      assert.equal(notation.compare, fields.compare, id + ' comparison changed')
      assert.equal(notation.FS, fields.FS, id + ' FS changed')
      assert.equal(notation.init, fields.init, id + ' init changed')
   })

   assert.equal(hub.main.get('omega-y').provenance.notationId, 'omega-y-actual')
   assert.equal(hub.main.get('nt-1-mn').provenance.notationId, '1-MN')
   assert.equal(hub.main.get('nt-2-mn').provenance.notationId, '2-MN')
   assert.equal(hub.main.get('nt-3-mn').provenance.notationId, '3-MN')
   assert.equal(hub.main.get('cm').provenance.notationId, 'cms')

   hub.main.forEach((notation) => {
      const initial = notation.init()
      assert.equal(Array.isArray(initial), true, notation.id + ' init is not an array')
      initial.forEach((item) => {
         assert.equal(Array.isArray(item.low), true, notation.id + ' init item lacks low')
         assert.equal(Array.isArray(item.subitems), true, notation.id + ' init item lacks subitems')
      })
   })
})

test('representative adapted FS calls exactly match the pinned upstream definitions', () => {
   const { hub, context } = loadIntegratedRegistry()
   const bundle = context.NeRewrittenNotationBundle
   const fixtures = [
      ['WSMv1.4.1', 0, 1],
      ['-1y-2ss', 0, 1],
      ['bocf-ebo', 0, 0],
      ['BMS-20260721-v10-weirdfull-display-GBMS-n-2-P', 0, 1],
      ['SA-omega2-MN', 0, 0],
   ]

   fixtures.forEach(([id, initialIndex, fsIndex]) => {
      const raw = bundle.notationsById[id]
      const adapted = hub.main.get(id)
      const rawExpression = raw.init()[initialIndex]
      const adaptedExpression = adapted.init()[initialIndex].expr
      assert.equal(
         json(adapted.FS(adaptedExpression, fsIndex)),
         json(raw.FS(rawExpression, fsIndex)),
         id
      )
   })
})

test('every imported OCN definition can expand its Limit above the initial lower bound', () => {
   const { hub } = loadIntegratedRegistry()
   const expected = new Map([
      ['bocf-ebo', { index: 0, display: 'ψ(0)' }],
      ['mocf-ebo', { index: 0, display: 'ψ(1)' }],
      ['nocf-ebo', { index: 0, display: 'ψ(0)' }],
      ['inacc-ocf', { index: 0, display: 'ψ(0)' }],
      ['finite-mahlo-ocf', { index: 0, display: 'ψ(0)' }],
      ['ups1.1r5', { index: 1, display: '0' }],
   ])

   expected.forEach((expectedExpansion, id) => {
      const notation = hub.main.get(id)
      const initial = notation.init()
      const limit = initial[0]
      assert.equal(notation.able(limit.expr), true, id + ' Limit must be expandable')

      ;[
         ['FS', notation.FS],
         ['FSShort', notation.FSShort || notation.FS],
      ].forEach(([variant, FS]) => {
         let expansion
         for (let index = 0; index <= 32; index++) {
            const expression = FS(limit.expr, index)
            if (notation.compare(expression, limit.low[0]) > 0) {
               expansion = { index, expression }
               break
            }
         }

         const label = id + '/' + variant
         assert.ok(expansion, label + ' generateFS did not find a term above the initial lower bound')
         assert.equal(expansion.index, expectedExpansion.index, label + ' index')
         assert.equal(notation.display(expansion.expression), expectedExpansion.display, label + ' display')
      })
   })
})

test('WSMv1.4.1 carries Alice attribution and equivalent diagrams reach the registry', () => {
   const { hub } = loadIntegratedRegistry()
   const wsm = hub.main.get('WSMv1.4.1')
   const omegaY = hub.main.get('omega-y')

   assert.equal(wsm.credit_text_id, 'credit.dsm')
   assert.equal(wsm.provenance.notationId, 'WSMv1.4.1')
   assert.equal(typeof omegaY.display_equiv.DBMS_MN, 'function')
   assert.equal(typeof omegaY.drawDiagram, 'function')

   const finite = omegaY.init()[1].expr
   const diagram = omegaY.drawDiagram(finite, 'DBMS_MN')
   assert.equal(diagram && Array.isArray(diagram.actions), true)
})

test('every imported equivalent parser round-trips representative initial expressions', () => {
   const { hub } = loadIntegratedRegistry()
   var checked = 0

   hub.main.forEach((notation) => {
      NotationDisplay.listEquivalentDisplays(notation).forEach((option) => {
         const resolved = NotationDisplay.resolveDisplay(notation, option.id)
         if (typeof resolved.fromDisplay !== 'function') return
         const expressions = notation.init().slice(0, 3).map((item) => item.expr)
         if (expressions.length) {
            for (let fsIndex = 0; fsIndex < 2; fsIndex++) {
               try { expressions.push(notation.FS(expressions[0], fsIndex)) } catch (error) { }
            }
         }
         const seen = new Set()
         expressions.forEach((expression, index) => {
            const plain = resolved.plain(expression)
            if (plain === '' || plain === 'Limit' || plain === 'Infinity') return
            if (seen.has(plain)) return
            seen.add(plain)
            let parsed
            try {
               parsed = resolved.fromDisplay(plain)
            } catch (error) {
               throw new Error(
                  notation.id + '/' + option.id + ' sample[' + index + '] parser rejected ' + plain + ': ' +
                  (error && error.message || error)
               )
            }
            let comparison
            try {
               comparison = notation.compare(parsed, expression)
            } catch (error) {
               throw new Error(
                  notation.id + '/' + option.id + ' sample[' + index + '] compare failed for ' + plain + ': ' +
                  (error && error.message || error)
               )
            }
            assert.equal(
               comparison,
               0,
               notation.id + '/' + option.id + ' sample[' + index + '] failed: ' + plain
            )
            checked++
         })
      })
   })

   assert.ok(checked > 50, 'expected broad equivalent parser coverage')
})
