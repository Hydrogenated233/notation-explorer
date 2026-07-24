'use strict'

// Regression contract for the framework-owned generated-notation API.
//
// A generated family is a normal registry concern, independent of where its
// definition originated.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const Menu = require('../js/notation-menu.js')
const {
   BUILTIN_OWNER,
   NotationRegistryHub,
} = require('../js/notation-registry.js')

const projectRoot = path.join(__dirname, '..')
const familyId = 'test-generated-family'
const familyOwner = BUILTIN_OWNER

function compare(a, b) {
   if (a === b) return 0
   if (Array.isArray(a) && Array.isArray(b)) {
      for (let index = 0; index < Math.min(a.length, b.length); index++) {
         const result = compare(a[index], b[index])
         if (result !== 0) return result
      }
      return a.length < b.length ? -1 : 1
   }
   return a < b ? -1 : 1
}

function createNotation(index) {
   return {
      id: familyId + '-' + index,
      name: 'Generated family ' + index,
      generatedFamily: {
         categoryId: familyId,
         index,
      },
      parameterGenerator: {
         id: familyId,
         start: 1,
         initial: 2,
         maximum: 4,
      },
      display(expression) {
         return expression === Infinity ? 'Limit' : String(expression)
      },
      fromDisplay(value) {
         return value === 'Limit' ? Infinity : []
      },
      able(expression) {
         return expression === Infinity
      },
      compare,
      FS(expression, n) {
         return expression === Infinity ? [n] : []
      },
      init() {
         return [
            { expr: Infinity, low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ]
      },
   }
}

function registerTestFamily(registry, options) {
   options = options || {}
   const spec = {
      id: familyId,
      categoryId: familyId,
      category: {
         id: familyId,
         name: 'Generated test family',
         path: ['Test', 'Generated'],
      },
      start: 1,
      initial: 2,
      maximum: 4,
      create: createNotation,
   }
   if (Object.prototype.hasOwnProperty.call(options, 'owner')) spec.owner = options.owner
   else if (options.defaultOwner !== true) spec.owner = familyOwner
   return registry.registerGenerator(spec)
}

function memoryStorage(initialConfig) {
   const values = new Map()
   if (initialConfig !== undefined) values.set('ne-config', JSON.stringify(initialConfig))
   return {
      values,
      getItem(key) {
         return values.has(key) ? values.get(key) : null
      },
      setItem(key, value) {
         values.set(key, String(value))
      },
   }
}

function frameworkHarness(initialConfig) {
   const hub = new NotationRegistryHub()
   const family = registerTestFamily(hub.main)
   const storage = memoryStorage(initialConfig)
   const alerts = []
   let root

   const context = vm.createContext({
      console,
      register: hub.main,
      analysis_register: hub.analysis,
      localStorage: storage,
      document: {
         documentElement: { classList: { toggle() {} } },
         body: { contains() { return false } },
         getElementById() { return null },
         addEventListener() {},
         removeEventListener() {},
      },
      Worker: function () { this.postMessage = function () {} },
      ResizeObserver: undefined,
      setTimeout,
      clearTimeout,
      setInterval() { return 1 },
      clearInterval() {},
      alert(message) { alerts.push(String(message)) },
      innerWidth: 1280,
      innerHeight: 720,
      scrollY: 0,
      scrollTo() {},
      // Deliberately provide no source-specific bundle or generator globals.
      // The framework must discover the registry family.
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
               Object.keys(options.computed || {}).forEach((name) => {
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

   vm.runInContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8'),
      context,
      { filename: 'js/framework.js' }
   )
   return { root, hub, family, storage, context, alerts }
}

test('register.registerGenerator materializes defaults with owner and variant metadata', () => {
   const hub = new NotationRegistryHub()
   const registry = hub.main
   const family = registerTestFamily(registry)

   assert.equal(typeof registry.registerGenerator, 'function')
   assert.equal(family.id, familyId)
   assert.deepEqual(
      registry.map((notation) => notation.id),
      [familyId + '-1', familyId + '-2']
   )
   assert.equal(registry.ownerOf(familyId + '-1'), familyOwner)
   assert.equal(registry.ownerOf(familyId + '-2'), familyOwner)
   assert.equal(registry.get(familyId + '-1').generatedFamily.categoryId, familyId)
   assert.equal(registry.get(familyId + '-1').generatedFamily.index, 1)
   assert.deepEqual(family.category.path, ['Test', 'Generated'])
})

test('generator owner defaults follow the registry owner and transactions stage defaults', () => {
   const hub = new NotationRegistryHub()
   const transaction = hub.begin('local-file')
   registerTestFamily(transaction.register, { defaultOwner: true })
   assert.deepEqual(
      transaction.register.map((notation) => notation.id),
      [familyId + '-1', familyId + '-2']
   )
   assert.equal(hub.main.length, 0)
   transaction.commit()
   assert.deepEqual(
      hub.main.map((notation) => notation.id),
      [familyId + '-1', familyId + '-2']
   )
   assert.equal(hub.main.ownerOf(familyId + '-1'), 'local-file')
})

test('registry generator add/remove/current is bounded, aliases work, and preserves ownership', () => {
   const hub = new NotationRegistryHub()
   const registry = hub.main
   registerTestFamily(registry)

   assert.equal(registry.generatorCurrent(familyId), 2)
   const added = registry.generatorAdd(familyId)
   assert.equal(added.id, familyId + '-3')
   assert.equal(registry.generatorCurrent(familyId), 3)
   assert.equal(registry.ownerOf(familyId + '-3'), familyOwner)

   const addedAgain = registry.generatorIncrement(familyId)
   assert.equal(addedAgain.id, familyId + '-4')
   assert.equal(registry.generatorCurrent(familyId), 4)
   assert.equal(registry.generatorCanIncrement(familyId), false)

   const removed = registry.generatorRemove(familyId)
   assert.equal(removed.id, familyId + '-4')
   assert.equal(registry.get(familyId + '-4'), undefined)
   assert.equal(registry.generatorCurrent(familyId), 3)
   assert.equal(registry.generatorCanDecrement(familyId), true)

   const removedAgain = registry.generatorDecrement(familyId)
   assert.equal(removedAgain.id, familyId + '-3')
   assert.equal(registry.generatorCurrent(familyId), 2)
   registry.generatorRemove(familyId)
   assert.equal(registry.generatorCurrent(familyId), 1)
   assert.equal(registry.generatorCanDecrement(familyId), false)
   assert.equal(registry.generatorRemove(familyId), undefined)
   assert.equal(registry.generatorCurrent(familyId), 1)
})

test('framework restores a registry family from ne-config and persists add/remove state', () => {
   const first = frameworkHarness({
      generatorState: { [familyId]: 3 },
      mainId: familyId + '-3',
   })

   first.root.loadSettings()
   assert.equal(first.root.generatorCurrent(familyId), 3)
   assert.ok(first.hub.main.get(familyId + '-3'))
   assert.ok(first.root.datasets[familyId + '-3'])
   assert.equal(first.root.currentNotationId, familyId + '-3')

   first.root.incrementGenerator(familyId)
   assert.equal(first.root.generatorCurrent(familyId), 4)
   let saved = JSON.parse(first.storage.getItem('ne-config'))
   assert.equal(saved.generatorState[familyId], 4)

   first.root.decrementGenerator(familyId)
   assert.equal(first.root.generatorCurrent(familyId), 3)
   saved = JSON.parse(first.storage.getItem('ne-config'))
   assert.equal(saved.generatorState[familyId], 3)

   const second = frameworkHarness(saved)
   second.root.loadSettings()
   assert.equal(second.root.generatorCurrent(familyId), 3)
   assert.ok(second.hub.main.get(familyId + '-3'))
   assert.equal(second.hub.main.get(familyId + '-4'), undefined)
   assert.deepEqual(second.alerts, [])
})

test('menu groups a registry-owned family without source-specific globals', () => {
   const hub = new NotationRegistryHub()
   registerTestFamily(hub.main)
   const catalog = [{
      path: 'Test/Generated.js',
      directories: ['Test', 'Generated'],
      fileName: 'Generated.js',
      mainIds: [familyId + '-1', familyId + '-2'],
   }]

   const tree = Menu.buildTree({
      catalog,
      notations: hub.main.map((notation) => notation),
      getNotation: (id) => hub.main.get(id),
      getOwner: (id) => hub.main.ownerOf(id),
      generatorState: { [familyId]: 2 },
      // No external category inventory or bundle is supplied.
   })
   const folder = tree[0].children[0]
   assert.equal(folder.label, 'Generated')
   assert.ok(folder.generator)
   assert.equal(folder.generator.categoryId, familyId)
   assert.equal(folder.generator.current, 2)
   assert.deepEqual(folder.children.map((node) => node.id), [familyId + '-1', familyId + '-2'])
})

test('runtime has no source-specific adapter or legacy generator global', () => {
   const frameworkSource = fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8')
   const menuSource = fs.readFileSync(path.join(projectRoot, 'js', 'notation-menu.js'), 'utf8')
   assert.doesNotMatch(frameworkSource, /SmileLeeNotation(?:Bundle|Adapter)|NotationGenerators/)
   assert.doesNotMatch(menuSource, /SmileLeeNotation(?:Bundle|Adapter)|NotationGenerators/)

   const adapterPath = path.join(projectRoot, 'js', 'smilelee-notation-adapter.js')
   assert.equal(fs.existsSync(adapterPath), false)

   const runtimeRoot = path.join(projectRoot, 'js')
   const pending = [runtimeRoot]
   const legacyReferences = []
   while (pending.length) {
      const directory = pending.pop()
      fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
         const fullPath = path.join(directory, entry.name)
         if (entry.isDirectory()) pending.push(fullPath)
         else if (entry.isFile() && entry.name.endsWith('.js')) {
            const source = fs.readFileSync(fullPath, 'utf8')
            if (/SmileLeeNotationAdapter|smilelee-notation-adapter|zz-smilelee|NotationGenerators/.test(source)) {
               legacyReferences.push(path.relative(projectRoot, fullPath))
            }
         }
      })
   }
   assert.deepEqual(legacyReferences, [])
})
