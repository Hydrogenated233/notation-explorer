'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { NotationRegistryHub } = require('../js/notation-registry.js')
const Adapter = require('../js/smilelee-notation-adapter.js')

const projectRoot = path.join(__dirname, '..')
const partialUpmsCategory = 'category-upms-partial'

function loadBundle() {
   const context = Object.create(null)
   context.globalThis = context
   vm.runInNewContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'smilelee-notation-bundle.js'), 'utf8'),
      context
   )
   return context.SmileLeeNotationBundle
}

function memoryStorage(initialConfig, initialAnalysis) {
   const values = new Map()
   if (initialConfig) values.set('ne-config', JSON.stringify(initialConfig))
   if (initialAnalysis) values.set('ne-analysis', String(initialAnalysis))
   return {
      values,
      getItem(key) { return values.has(key) ? values.get(key) : null },
      setItem(key, value) { values.set(key, String(value)) },
   }
}

function loadHarness(config, initialAnalysis, options) {
   const bundle = loadBundle()
   const hub = new NotationRegistryHub()
   Adapter.install(hub.main, {
      add: ['upms-partial-2', 'upms-partial-3'],
   }, bundle)
   const storage = memoryStorage(config, initialAnalysis)
   let root
   const alerts = []
   const context = vm.createContext({
      console,
      register: hub.main,
      analysis_register: hub.analysis,
      SmileLeeNotationBundle: bundle,
      SmileLeeNotationAdapter: Adapter,
      localStorage: storage,
      document: {
         documentElement: { classList: { toggle() {} } },
         getElementById() { return null },
      },
      Worker: function () { this.postMessage = function () {} },
      setTimeout,
      clearTimeout,
      setInterval() { return 1 },
      clearInterval() {},
      alert(message) { alerts.push(String(message)) },
      ResizeObserver: undefined,
   })
   context.window = context
   context.globalThis = context
   context.Vue = {
      createApp(options) {
         return {
            config: { globalProperties: {} },
            component() { return this },
            mount() {
               const instance = Object.assign(options.data(), options.methods)
               Object.keys(options.computed).forEach((name) => {
                  Object.defineProperty(instance, name, {
                     configurable: true,
                     get() { return options.computed[name].call(instance) },
                  })
               })
               instance.$refs = {}
               instance.$nextTick = function (callback) { if (callback) callback() }
               root = instance
               return instance
            },
         }
      },
   }

   if (options && options.nCps) {
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
   }

   vm.runInContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8'),
      context,
      { filename: 'js/framework.js' }
   )
   return { root, hub, storage, context, alerts }
}

test('saved generator state restores variants before restoring the selected notation', () => {
   const { root, hub, context, alerts } = loadHarness({
      generatorState: { [partialUpmsCategory]: 4, 'n-cps': 3 },
      mainId: 'upms-partial-4',
   }, undefined, { nCps: true })

   root.loadSettings()

   assert.ok(hub.main.get('upms-partial-4'))
   assert.ok(root.datasets['upms-partial-4'])
   assert.equal(root.currentNotationId, 'upms-partial-4')
   assert.equal(root.generatorCurrent(partialUpmsCategory), 4)
   assert.equal(root.generatorCurrent('n-cps'), 3)
   assert.ok(hub.main.get('3-cps'))
   assert.deepEqual(alerts, [])
})

test('decrement archives a generated tree and increment restores it', () => {
   const { root, hub, storage, alerts } = loadHarness({
      generatorState: { [partialUpmsCategory]: 4 },
      mainId: 'upms-partial-4',
   })
   root.loadSettings()
   const item = root.datasets['upms-partial-4'].subitems[1]
   item.analysis = 'retained analysis'
   root.noteSheets = [{ name: 'Sheet2', text: 'retained note' }]

   root.decrementGenerator(partialUpmsCategory)

   assert.equal(hub.main.get('upms-partial-4'), undefined)
   assert.equal(root.generatorCurrent(partialUpmsCategory), 3)
   assert.notEqual(root.currentNotationId, 'upms-partial-4')

   root.incrementGenerator(partialUpmsCategory)

   assert.ok(hub.main.get('upms-partial-4'))
   assert.equal(root.datasets['upms-partial-4'].subitems[1].analysis, 'retained analysis')
   root.currentNotationId = 'upms-partial-4'
   root.initSheets()
   assert.equal(root.noteSheets[0].text, 'retained note')
   assert.equal(JSON.parse(storage.getItem('ne-config')).generatorState[partialUpmsCategory], 4)
   assert.deepEqual(alerts, [])
})

test('generated families can decrement from initial to start but not below start', () => {
   const { root, hub } = loadHarness()

   assert.equal(root.generatorCurrent(partialUpmsCategory), 3)
   assert.equal(root.generatorCanDecrement(partialUpmsCategory), true)
   root.decrementGenerator(partialUpmsCategory)
   assert.equal(root.generatorCurrent(partialUpmsCategory), 2)
   assert.equal(root.generatorCanDecrement(partialUpmsCategory), false)
   root.decrementGenerator(partialUpmsCategory)
   assert.deepEqual(hub.main.map((notation) => notation.id), ['upms-partial-2'])
})

test('persisted state below initial unloads the higher default variants during startup', () => {
   const { root, hub } = loadHarness({
      generatorState: { [partialUpmsCategory]: 2 },
      mainId: 'upms-partial-2',
   })

   root.loadSettings()

   assert.deepEqual(hub.main.map((notation) => notation.id), ['upms-partial-2'])
   assert.equal(root.generatorCurrent(partialUpmsCategory), 2)
   assert.equal(root.currentNotationId, 'upms-partial-2')
})

test('Limit analysis survives JSON persistence while a generated variant is absent', () => {
   const first = loadHarness({
      generatorState: { [partialUpmsCategory]: 4 },
      mainId: 'upms-partial-4',
   })
   first.root.loadSettings()
   const limitItem = first.root.datasets['upms-partial-4'].subitems[0]
   limitItem.analysis = 'retained Limit analysis'

   first.root.decrementGenerator(partialUpmsCategory)

   const persistedConfig = JSON.parse(first.storage.getItem('ne-config'))
   const persistedAnalysis = first.storage.getItem('ne-analysis')
   assert.match(persistedAnalysis, /retained Limit analysis/)
   assert.doesNotMatch(persistedAnalysis, /"expr":\[\[null\]\]/)

   const second = loadHarness(persistedConfig, persistedAnalysis)
   second.root.loadSettings()
   second.root.loadAnalysis()
   second.root.incrementGenerator(partialUpmsCategory)

   assert.equal(
      second.root.datasets['upms-partial-4'].subitems[0].analysis,
      'retained Limit analysis'
   )
   assert.deepEqual(second.alerts, [])
})

test('hidden-only generated nodes restore without gaining empty analysis text', () => {
   const { root } = loadHarness({ generatorState: { [partialUpmsCategory]: 4 } })
   root.loadSettings()
   root.autoSaveHidden = true
   const item = root.datasets['upms-partial-4'].subitems[1]
   item.hide_child = true

   root.decrementGenerator(partialUpmsCategory)
   root.incrementGenerator(partialUpmsCategory)

   const restored = root.datasets['upms-partial-4'].subitems[1]
   assert.equal(restored.hide_child, true)
   assert.equal(restored.analysis, undefined)
})

test('generated install refuses an identical id owned by a local file', () => {
   const { root, hub, context, alerts } = loadHarness()
   const local = context.SmileLeeNotationAdapter.createGeneratedDefinition(
      partialUpmsCategory,
      4,
      context.SmileLeeNotationBundle
   )
   hub.main.appendOwned('local-file', [local])

   root.incrementGenerator(partialUpmsCategory)

   assert.equal(root.generatorCurrent(partialUpmsCategory), 3)
   assert.equal(hub.main.ownerOf('upms-partial-4'), 'local-file')
   assert.equal(alerts.length, 1)
})

test('out-of-range persisted generator values fall back without mass restoration', () => {
   const { root, hub } = loadHarness({
      generatorState: {
         [partialUpmsCategory]: Number.MAX_SAFE_INTEGER,
         'n-cps': Number.MAX_SAFE_INTEGER,
      },
   }, undefined, { nCps: true })

   root.loadSettings()

   assert.equal(root.generatorCurrent(partialUpmsCategory), 3)
   assert.equal(root.generatorCurrent('n-cps'), 2)
   assert.equal(hub.main.get('3-cps'), undefined)
   assert.equal(hub.main.length, 4)
})

test('n-CpS folder controls add and remove independent notation entries', () => {
   const { root, hub } = loadHarness(undefined, undefined, { nCps: true })

   assert.deepEqual(
      hub.main.map((notation) => notation.id).filter((id) => id.endsWith('-cps')),
      ['1-cps', '2-cps']
   )
   root.incrementGenerator('n-cps')
   assert.ok(hub.main.get('3-cps'))
   assert.ok(root.datasets['3-cps'])
   assert.equal(root.generatorCurrent('n-cps'), 3)

   root.decrementGenerator('n-cps')
   assert.equal(hub.main.get('3-cps'), undefined)
   assert.equal(root.datasets['3-cps'], undefined)
   assert.equal(root.generatorCurrent('n-cps'), 2)
})

test('legacy n-cps selection, analysis, and notes migrate to 2-CpS', () => {
   const owner = '@notation-explorer/builtin'
   const legacyKey = owner + '::n-cps'
   const legacyAnalysis = JSON.stringify({
      version: 4,
      savedAt: 1,
      notations: {
         [legacyKey]: {
            ownerId: owner,
            notationId: 'n-cps',
            items: [{ expr: [1], exprFormat: 'json', analysis: 'legacy analysis' }],
         },
      },
      noteSheets: {
         [legacyKey]: [{ name: 'Sheet2', text: 'legacy note' }],
      },
   })
   const { root } = loadHarness({ mainId: 'n-cps' }, legacyAnalysis, { nCps: true })

   root.loadSettings()
   root.loadAnalysis()

   assert.equal(root.currentNotationId, '2-cps')
   assert.equal(root.datasets['2-cps'].subitems[1].analysis, 'legacy analysis')
   root.initSheets()
   assert.equal(root.noteSheets[0].text, 'legacy note')
})
