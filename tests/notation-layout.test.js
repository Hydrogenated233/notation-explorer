'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const NotationFileIndex = require('../js/notation-file-index.js')
const {
   notationRoot,
   discoverNotationFiles,
   currentManifestSource,
   normalizeLineEndings,
} = require('../generate-notation-manifest.js')
const manifest = require('../js/notation-manifest.js')
const Loader = require('../js/notation-loader.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.join(__dirname, '..')

test('notation files are grouped by lineage with ordered shared helpers at the root', () => {
   const entries = fs.readdirSync(notationRoot, { withFileTypes: true })
   const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
   const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()

   assert.deepEqual(directories, [
      'BM-like', 'CpS', 'DEN', 'MN', 'Misc', 'OCN',
      'PPS', 'PrSS', 'SMN', 'TON', 'Y', 'aSAN',
   ])
   assert.deepEqual(files, ['00-shared-seq.js', '01-shared-matrix.js'])
   assert.equal(fs.existsSync(path.join(notationRoot, 'PPS', 'fPPS4.js.disable')), true)
   assert.equal(fs.existsSync(path.join(projectRoot, 'js', 'diagram', 'Diagram.js')), true)
})

test('discovery compares category levels before filenames and excludes non-js files', () => {
   const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notation-discovery-'))
   try {
      fs.mkdirSync(path.join(temporaryRoot, 'B'))
      fs.mkdirSync(path.join(temporaryRoot, 'A', 'Z'), { recursive: true })
      fs.mkdirSync(path.join(temporaryRoot, 'A', 'Y'), { recursive: true })
      fs.writeFileSync(path.join(temporaryRoot, 'root.js'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'A', 'z.js'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'A', 'Y', 'b.js'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'A', 'Z', 'a.js'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'B', 'a.js'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'A', 'disabled.js.disable'), '')
      fs.writeFileSync(path.join(temporaryRoot, 'A', 'notes.txt'), '')

      assert.deepEqual(discoverNotationFiles(temporaryRoot), [
         'root.js',
         'A/z.js',
         'A/Y/b.js',
         'A/Z/a.js',
         'B/a.js',
      ])
   } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true })
   }
})

test('generated manifest exactly matches repository discovery and deterministic order', () => {
   const discovered = discoverNotationFiles()
   const generatedSource = fs.readFileSync(path.join(projectRoot, 'js', 'notation-manifest.js'), 'utf8')

   assert.equal(discovered.length, 60)
   assert.deepEqual(manifest, discovered)
   assert.deepEqual(discovered, NotationFileIndex.sortPaths(discovered))
   assert.equal(normalizeLineEndings(generatedSource), normalizeLineEndings(currentManifestSource()))
   assert.deepEqual(discovered.slice(0, 2), ['00-shared-seq.js', '01-shared-matrix.js'])
   assert.equal(discovered.includes('PPS/sPPS4.js'), true)
   assert.equal(discovered.some((file) => file.includes('fPPS4')), false)
   assert.equal(discovered.includes('MN/Tomega^omegaMN.js'), true)
   assert.equal(discovered.includes('aSAN/aSAN~3+.js'), true)
})

test('index delegates notation and application startup to the generated loader', () => {
   const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')

   assert.doesNotMatch(html, /<script src="js\/notations\//)
   assert.match(html, /<script src="js\/notation-file-index\.js"><\/script>/)
   assert.match(html, /<script src="js\/notation-manifest\.js"><\/script>/)
   assert.match(html, /<script src="js\/notation-loader\.js"><\/script>/)
})

test('every discovered built-in loads and initializes in manifest order', () => {
   const hub = new NotationRegistryHub()
   const context = vm.createContext({
      register: hub.main,
      analysis_register: hub.analysis,
      nCpSN: 2,
      console,
      setTimeout,
      clearTimeout,
   })
   context.window = context
   context.globalThis = context
   const catalog = []

   for (const file of manifest) {
      const mainBefore = Loader.registrySnapshot(hub.main)
      const analysisBefore = Loader.registrySnapshot(hub.analysis)
      vm.runInContext(
         fs.readFileSync(path.join(notationRoot, file), 'utf8'),
         context,
         { filename: file }
      )
      catalog.push(Loader.createCatalogEntry(
         file,
         Loader.appendedEntries(hub.main, mainBefore, file, 'main'),
         Loader.appendedEntries(hub.analysis, analysisBefore, file, 'analysis')
      ))
   }
   hub.main.forEach((notation) => notation.init())

   assert.equal(hub.main.length, 62)
   assert.equal(hub.analysis.length, 6)
   assert.equal(Boolean(hub.main.get('spps4')), true)
   assert.equal(Boolean(hub.main.get('fpps4')), false)
   assert.equal(catalog.length, manifest.length)
   assert.deepEqual(catalog.flatMap((record) => record.mainIds), hub.main.map((entry) => entry.id))
   assert.deepEqual(catalog.flatMap((record) => record.analysisIds), hub.analysis.map((entry) => entry.id))
   assert.deepEqual(catalog.find((record) => record.path === '00-shared-seq.js').mainIds, [])
   assert.deepEqual(
      catalog.find((record) => record.path === 'Y/omega-Y-magma.js').mainIds,
      ['omega-y-weak', 'omega-y-medium', 'omega-y-strong']
   )
   assert.deepEqual(
      hub.main.entriesForOwner('@notation-explorer/builtin').filter((entry) => entry.id.startsWith('ton-')).map((entry) => entry.id),
      ['ton-m', 'ton-dr', 'ton-drc', 'ton-drp', 'ton-drpc', 'ton-i', 'ton-ibp', 'ton-mc', 'ton-mpc']
   )
})
