'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const Exporter = require('../js/standalone-export.js')
const component = require('../js/standalone-export-ui.js')
const Loader = require('../js/notation-loader.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.resolve(__dirname, '..')

function builtinRecord(overrides) {
   return Object.assign({
      key: 'builtin:Group/A.js',
      kind: 'builtin',
      ownerId: Exporter.BUILTIN_OWNER,
      path: 'Group/A.js',
      sourcePath: 'js/notations/Group/A.js',
      directories: ['Group'],
      fileName: 'A.js',
      mainIds: ['a'],
      currentMainIds: ['a'],
      analysisIds: [],
      generatorIds: [],
      order: 0,
      estimatedBytes: 100,
   }, overrides)
}

test('uses fixed-version jsDelivr dependencies and standalone loader scripts', () => {
   assert.equal(
      Exporter.CDN.vue,
      'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js'
   )
   assert.equal(
      Exporter.CDN.xlsx,
      'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
   )
   assert.equal(
      Exporter.CDN.katex,
      'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js'
   )
   assert.ok(Loader.APP_SCRIPTS.includes('js/standalone-export.js'))
   assert.ok(Loader.APP_SCRIPTS.includes('js/standalone-export-ui.js'))
   assert.ok(
      Loader.APP_SCRIPTS.indexOf('js/standalone-export-ui.js') <
      Loader.APP_SCRIPTS.indexOf('js/framework.js')
   )
})

test('collectSelectionRecords includes built-ins and only loaded trusted local files', () => {
   const builtInNotation = { id: 'builtin-a', name: 'Built-in A' }
   const localNotation = { id: 'local-a', name: 'Local A' }
   const register = {
      get(id) { return id === builtInNotation.id ? builtInNotation : undefined },
      forEach(callback) { callback(builtInNotation) },
      entriesForOwner(owner) { return owner === 'local-ok' ? [localNotation] : [] },
   }
   const analysisRegister = {
      entriesForOwner(owner) {
         return owner === 'local-analysis' ? [{ id: 'local-analysis-entry' }] : []
      },
   }
   const files = [
      { id: 'local-ok', name: 'Ok.js', source: 'register.push({})', enabled: true, trusted: true, sourceRevision: 2, loadedRevision: 2, order: 1 },
      { id: 'local-analysis', name: 'Analysis.js', source: 'analysis_register.push({})', enabled: true, trusted: true, sourceRevision: 1, loadedRevision: 1, order: 2 },
      { id: 'local-disabled', name: 'Disabled.js', source: '', enabled: false, trusted: true },
      { id: 'local-untrusted', name: 'Untrusted.js', source: '', enabled: true, trusted: false },
      { id: 'local-error', name: 'Error.js', source: '', enabled: true, trusted: true, lastError: { message: 'bad' } },
      { id: 'local-stale', name: 'Stale.js', source: '', enabled: true, trusted: true, sourceRevision: 2, loadedRevision: 1 },
   ]
   const records = Exporter.collectSelectionRecords({
      register,
      analysisRegister,
      catalog: [{
         path: 'Group/A.js',
         directories: ['Group'],
         fileName: 'A.js',
         mainIds: ['builtin-a'],
         analysisIds: [],
      }],
      localManager: { listFiles() { return files } },
      hub: { generatorDefinitions() { return [] } },
   })

   assert.deepEqual(records.map((record) => record.key), [
      'builtin:Group/A.js',
      'local:local-ok',
      'local:local-analysis',
   ])
   assert.deepEqual(records[1].mainIds, ['local-a'])
   assert.deepEqual(records[2].analysisIds, ['local-analysis-entry'])
})

test('dependency resolution follows quoted notation IDs transitively', async () => {
   const a = builtinRecord({
      key: 'builtin:A.js', path: 'A.js', sourcePath: 'A.js', fileName: 'A.js',
      mainIds: ['a'], currentMainIds: ['a'], order: 0,
   })
   const b = builtinRecord({
      key: 'builtin:B.js', path: 'B.js', sourcePath: 'B.js', fileName: 'B.js',
      mainIds: ['b'], currentMainIds: ['b'], order: 1,
   })
   const c = builtinRecord({
      key: 'builtin:C.js', path: 'C.js', sourcePath: 'C.js', fileName: 'C.js',
      mainIds: ['c'], currentMainIds: ['c'], order: 2,
   })
   const sources = { 'builtin:A.js': 'function getB(){ return register.get("b") }' }
   const sourceByPath = {
      'B.js': "function getC(){ return register.get('c') }",
      'C.js': 'register.push({ id: "c" })',
   }

   const dependencies = await Exporter.resolveDependencies(
      [a], [a, b, c], sources,
      async (file) => sourceByPath[file]
   )

   assert.deepEqual(dependencies.map((record) => record.key), ['builtin:B.js', 'builtin:C.js'])
   assert.equal(sources['builtin:B.js'], sourceByPath['B.js'])
   assert.equal(sources['builtin:C.js'], sourceByPath['C.js'])
})

test('download descriptors preserve embedded source and make safe flat filenames', () => {
   const record = builtinRecord({
      path: 'BM-like/Family/BM.js',
      fileName: 'BM.js',
   })
   const descriptor = Exporter.downloadFileDescriptor(record, 'register.push({ id: "bm" })')

   assert.equal(descriptor.label, 'BM-like/Family/BM.js')
   assert.equal(descriptor.downloadName, 'BM-like__Family__BM.js')
   assert.equal(
      Buffer.from(descriptor.source, 'base64').toString('utf8'),
      'register.push({ id: "bm" })'
   )

   const local = Exporter.downloadFileDescriptor({ kind: 'local', fileName: 'my:file.js' }, 'x')
   assert.equal(local.label, 'Local/my:file.js')
   assert.equal(local.downloadName, 'Local__my-file.js')

   const descriptors = Exporter.downloadFileDescriptors([
      { kind: 'builtin', key: 'a', path: 'A.js', fileName: 'A.js' },
      { kind: 'builtin', key: 'b', path: 'A.js', fileName: 'A.js' },
   ], { a: 'a', b: 'b' })
   assert.deepEqual(descriptors.map((file) => file.downloadName), ['A.js', 'A__2.js'])
})

test('snapshot filtering keeps only selected notation and generator state', () => {
   const analysis = {
      version: 4,
      notations: {
         '@notation-explorer/builtin::a': { notationId: 'a', items: [{ analysis: 'keep' }] },
         '@notation-explorer/builtin::b': { notationId: 'b', items: [{ analysis: 'drop' }] },
      },
      noteSheets: {
         '@notation-explorer/builtin::a': [{ text: 'keep note' }],
         '@notation-explorer/builtin::b': [{ text: 'drop note' }],
      },
   }
   const config = {
      mainId: 'b',
      analysisId: 'analysis-b',
      generatorState: { 'generator-a': 4, 'generator-b': 9 },
      equivActive: {
         '@notation-explorer/builtin::a': 'alt-a',
         '@notation-explorer/builtin::b': 'alt-b',
      },
      equivHideOriginal: {
         '@notation-explorer/builtin::a': true,
         '@notation-explorer/builtin::b': true,
      },
   }
   const record = builtinRecord({
      mainIds: ['a'], currentMainIds: ['a'], analysisIds: ['analysis-a'], generatorIds: ['generator-a'],
   })
   const filtered = Exporter.filterSnapshot({
      'ne-analysis': JSON.stringify(analysis),
      'ne-config': JSON.stringify(config),
      'ne-summary-pos': '{"x":10}',
   }, [record], 'a')
   const filteredAnalysis = JSON.parse(filtered['ne-analysis'])
   const filteredConfig = JSON.parse(filtered['ne-config'])

   assert.deepEqual(Object.keys(filteredAnalysis.notations), ['@notation-explorer/builtin::a'])
   assert.deepEqual(Object.keys(filteredAnalysis.noteSheets), ['@notation-explorer/builtin::a'])
   assert.deepEqual(filteredConfig.generatorState, { 'generator-a': 4 })
   assert.deepEqual(filteredConfig.equivActive, { '@notation-explorer/builtin::a': 'alt-a' })
   assert.equal(filteredConfig.mainId, 'a')
   assert.equal(filteredConfig.analysisId, '')
   assert.equal(filtered['ne-summary-pos'], '{"x":10}')
})

test('single-file build embeds the app, Blob worker, namespace, and retry loader safely', async () => {
   const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')
   const notationSource = fs.readFileSync(path.join(projectRoot, 'js/notations/PPS/PPS.js'), 'utf8')
   const record = builtinRecord({
      key: 'builtin:PPS/PPS.js',
      path: 'PPS/PPS.js',
      sourcePath: 'js/notations/PPS/PPS.js',
      directories: ['PPS'],
      fileName: 'PPS.js',
      mainIds: ['pps'],
      currentMainIds: ['pps'],
   })
   const result = await Exporter.buildStandalone({
      selectedRecords: [record],
      availableRecords: [record],
      appTemplate: Exporter.extractAppTemplate(indexHtml),
      bundleId: 'test-package',
      title: '<Standalone>',
      readText: async (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8'),
   })
   const scriptMatches = [...result.html.matchAll(/<script>([\s\S]*?)<\/script>/gi)]

   assert.equal(scriptMatches.length, 1)
   assert.doesNotMatch(result.html, /<script\s+src=/i)
   assert.doesNotMatch(result.html, /<standalone-export\b/i)
   assert.match(result.html, /<local-notation-manager\b/i)
   assert.match(result.html, /<div\b[^>]*id="app"[^>]*hidden[^>]*data-ne-standalone="true"/i)
   assert.match(result.html, /NotationStandaloneWorkerURL/)
   assert.match(result.html, /new Blob\(\[decode\(payload\.core\.worker\)\]/)
   assert.match(result.html, /ne-standalone:/)
   assert.match(result.html, /vue@3\.2\.31/)
   assert.match(result.html, /class="ne-sl-retry"/)
   assert.match(result.html, /downloadFiles/)
   assert.match(result.html, /downloadFile/)
   assert.match(result.html, /downloadIndex/)
   assert.equal(
      result.html.split(Buffer.from(notationSource, 'utf8').toString('base64')).length - 1,
      1
   )
   assert.match(result.html, /<title>&lt;Standalone&gt;<\/title>/)
   assert.doesNotThrow(() => new vm.Script(scriptMatches[0][1]))
   assert.ok(result.estimatedBytes > 500000)
})

test('settings component exposes file-tree selection and no upload control', () => {
   assert.match(component.template, /class="ne-standalone-export__tree"/)
   assert.match(component.template, /v-model="search"/)
   assert.match(component.template, /@click="selectAll"/)
   assert.match(component.template, /@click="clearSelection"/)
   assert.match(component.template, /v-model="includeData"/)
   assert.match(component.template, /@click="exportHtml"/)
   assert.doesNotMatch(component.template, /type="file"/)
   assert.doesNotMatch(component.template, /upload/i)
})

test('standalone file list exposes source downloads without mutation controls', () => {
   const source = fs.readFileSync(path.join(projectRoot, 'js/standalone-export.js'), 'utf8')
   assert.match(source, /ne-standalone-readonly__download/)
   assert.match(source, /new Blob\(\[source\]/)
   assert.match(source, /anchor\.download = file\.downloadName/)
   assert.doesNotMatch(source, /<input[^>]+type=["']file["']/i)
})

test('framework uses the standalone storage adapter and Blob worker URL when provided', () => {
   const hub = new NotationRegistryHub()
   const nativeStorage = new Map()
   const standaloneStorage = new Map()
   const workerSources = []
   let appDefinition
   const mountedRoot = { currentDataset: { is_root: true, mark: 0, subitems: [] } }
   const app = {
      component() { return this },
      config: { globalProperties: {} },
      mount() { return mountedRoot },
   }
   const context = vm.createContext({
      console,
      Vue: {
         createApp(definition) {
            appDefinition = definition
            return app
         },
      },
      Worker: function (source) {
         workerSources.push(source)
         this.postMessage = function () {}
      },
      register: hub.main,
      analysis_register: hub.analysis,
      window: null,
      document: { documentElement: { classList: { toggle() {} } } },
      localStorage: {
         getItem(key) { return nativeStorage.has(key) ? nativeStorage.get(key) : null },
         setItem(key, value) { nativeStorage.set(key, String(value)) },
      },
      NotationStorage: {
         getItem(key) { return standaloneStorage.has(key) ? standaloneStorage.get(key) : null },
         setItem(key, value) { standaloneStorage.set(key, String(value)) },
      },
      NotationStandaloneWorkerURL: 'blob:standalone-worker',
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Infinity,
      Number,
      String,
      Object,
      Array,
      Math,
      Map,
      Set,
      WeakMap,
      WeakSet,
      parseInt,
      isNaN,
   })
   context.window = context

   vm.runInContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8'),
      context,
      { filename: 'js/framework.js' }
   )
   const state = appDefinition.data()
   Object.entries(appDefinition.methods).forEach(([name, method]) => {
      state[name] = method.bind(state)
   })
   state.saveSettings()
   state.saveAnalysis()
   state.savePos()

   assert.deepEqual(workerSources, ['blob:standalone-worker'])
   assert.ok(standaloneStorage.has('ne-config'))
   assert.ok(standaloneStorage.has('ne-analysis'))
   assert.ok(standaloneStorage.has('ne-summary-pos'))
   assert.equal(nativeStorage.size, 0)
})
