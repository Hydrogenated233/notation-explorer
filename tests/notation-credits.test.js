'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const credits = require('../js/notation-credits.js')

const expectedKeys = [
   'credit.bashicu',
   'credit.tbm',
   'credit.yukito',
   'credit.den',
   'credit.den23',
   'credit.btbm',
   'credit.hypcos_mn',
   'credit.n_mn',
   'credit.test-alpha0',
   'credit.test-alpha0-ocn',
   'credit.ton',
   'credit.asan',
   'credit.community_y',
   'credit.asheep',
   'credit.bocf',
   'credit.mocf',
   'credit.nocf',
   'credit.ups1_1r5',
   'credit.dsm',
   'credit.wmm',
]

test('exports the credit resolver through CommonJS and a browser global', () => {
   assert.equal(typeof credits.resolveCredit, 'function')

   const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'notation-credits.js'), 'utf8')
   const sandbox = {}
   sandbox.globalThis = sandbox
   vm.runInNewContext(source, sandbox, { filename: 'notation-credits.js' })

   assert.equal(typeof sandbox.NotationCredits.resolveCredit, 'function')
   assert.equal(
      sandbox.NotationCredits.resolveCredit({ credit_text_id: 'credit.dsm' }, 'zh'),
      '由 Alice 定义并给出展开器.'
   )
})

test('contains the complete upstream credit key set in both languages', () => {
   assert.deepEqual(credits.keys, expectedKeys)
   assert.deepEqual(Object.keys(credits.translations.en), expectedKeys)
   assert.deepEqual(Object.keys(credits.translations.zh), expectedKeys)
   assert.equal(Object.isFrozen(credits.keys), true)
   assert.equal(Object.isFrozen(credits.translations), true)
   assert.equal(Object.isFrozen(credits.translations.en), true)
   assert.equal(Object.isFrozen(credits.translations.zh), true)
})

test('preserves the upstream English and Chinese credit text', () => {
   assert.equal(
      credits.translations.en['credit.yukito'],
      'Defined by Yukito; expander from the original NE project, originally by Yukito; mountain diagram by Yukito.'
   )
   assert.equal(
      credits.translations.zh['credit.yukito'],
      '由 Yukito 定义; 展开器来自原 NE 项目, 最初由 Yukito 给出; 山脉图绘制由 Yukito 给出.'
   )
   assert.equal(
      credits.translations.en['credit.btbm'],
      'Originally conceived by Bubby3, refined by the community. Expander by 笑姐姐 (Smile Lee) based on discussions with Asheep233.'
   )
   assert.equal(
      credits.translations.zh['credit.test-alpha0-ocn'],
      '由 test_alpha0 定义, 并给出展开器. 同时提供 OCN 渲染.'
   )
   assert.equal(
      credits.translations.en['credit.ups1_1r5'],
      'Originally created by Optimism, refined by Alice. Expander and visualization by Alice.'
   )
   assert.equal(credits.translations.zh['credit.dsm'], '由 Alice 定义并给出展开器.')
})

test('resolveCredit selects Chinese explicitly and otherwise falls back to English', () => {
   const notation = { credit_text_id: 'credit.den23' }

   assert.equal(
      credits.resolveCredit(notation, 'zh'),
      '由 test_alpha0 基于 DEN 作出定义; 展开器来自原 NE 项目; 可视化方案由 test_alpha0 给出.'
   )
   assert.equal(
      credits.resolveCredit(notation, 'en'),
      'Defined by test_alpha0 based on DEN; expander from the original NE project; visualization by test_alpha0.'
   )
   assert.equal(credits.resolveCredit(notation), credits.translations.en['credit.den23'])
   assert.equal(credits.resolveCredit(notation, 'fr'), credits.translations.en['credit.den23'])
})

test('resolveCredit returns an empty string for missing or unknown credit keys', () => {
   assert.equal(credits.resolveCredit(null, 'en'), '')
   assert.equal(credits.resolveCredit([], 'en'), '')
   assert.equal(credits.resolveCredit({}, 'en'), '')
   assert.equal(credits.resolveCredit({ credit_text_id: '' }, 'zh'), '')
   assert.equal(credits.resolveCredit({ credit_text_id: 'credit.unknown' }, 'en'), '')
   assert.equal(credits.resolveCredit({ credit_text_id: 42 }, 'zh'), '')
})
