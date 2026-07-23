'use strict'

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const assert = require('node:assert/strict')
const Menu = require('../js/notation-menu.js')
const manifest = require('../js/notation-manifest.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.resolve(__dirname, '..')
const notationRoot = path.join(projectRoot, 'js', 'notations')

function runFile(context, file, root) {
   vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file })
}

function integratedFixture() {
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
   runFile(context, 'smilelee-notation-bundle.js', path.join(projectRoot, 'js'))
   runFile(context, 'smilelee-notation-adapter.js', path.join(projectRoot, 'js'))

   const catalog = []
   manifest.forEach((file) => {
      const before = new Set(hub.main.map((notation) => notation.id))
      runFile(context, file, notationRoot)
      const parts = file.split('/')
      catalog.push({
         path: file,
         directories: parts.slice(0, -1),
         fileName: parts[parts.length - 1],
         mainIds: hub.main.map((notation) => notation.id).filter((id) => !before.has(id)),
      })
   })

   function build(generatorState) {
      return Menu.buildTree({
         catalog,
         notations: hub.main.map((notation) => notation),
         getNotation: (id) => hub.main.get(id),
         getOwner: (id) => hub.main.ownerOf(id),
         remoteCategories: context.SmileLeeNotationBundle.categories,
         remoteNotationIds: context.SmileLeeNotationBundle.notations.map((notation) => notation.id),
         generatorState,
      })
   }

   return { hub, context, build }
}

function notationIds(nodes) {
   const result = []
   function visit(node) {
      if (node.kind === 'notation') result.push(node.id)
      else node.children.forEach(visit)
   }
   nodes.forEach(visit)
   return result
}

function pathLabels(nodes, notationId) {
   function find(node, labels) {
      if (node.kind === 'notation') return node.id === notationId ? labels : null
      const next = labels.concat(node.label)
      for (const child of node.children) {
         const result = find(child, next)
         if (result) return result
      }
      return null
   }
   for (const node of nodes) {
      const result = find(node, [])
      if (result) return result
   }
   return []
}

function categoryFolder(nodes, categoryId) {
   for (const node of nodes) {
      if (node.kind !== 'notation') {
         if (node.categoryId === categoryId) return node
         const result = categoryFolder(node.children, categoryId)
         if (result) return result
      }
   }
   return undefined
}

function namedFolder(nodes, label) {
   for (const node of nodes) {
      if (node.kind !== 'notation') {
         if (node.label === label) return node
         const result = namedFolder(node.children, label)
         if (result) return result
      }
   }
   return undefined
}

function fixture() {
   const notations = [
      { id: 'pps', name: 'Parented predecessor sequence' },
      { id: 'pps4', name: 'PPS4' },
      { id: 'spps4', name: 'Second PPS4' },
      { id: 'nested', name: 'Nested notation' },
      { id: 'local-a', name: 'Local A' },
      { id: 'local-b', name: 'Local B' },
   ]
   const byId = new Map(notations.map((notation) => [notation.id, notation]))
   const owners = {
      pps: Menu.BUILTIN_OWNER,
      pps4: Menu.BUILTIN_OWNER,
      spps4: Menu.BUILTIN_OWNER,
      nested: Menu.BUILTIN_OWNER,
      'local-a': 'file-1',
      'local-b': 'file-1',
   }
   const catalog = [
      { path: '00-shared.js', directories: [], fileName: '00-shared.js', mainIds: [] },
      { path: 'PPS/PPS.js', directories: ['PPS'], fileName: 'PPS.js', mainIds: ['pps'] },
      { path: 'PPS/PPS4.js', directories: ['PPS'], fileName: 'PPS4.js', mainIds: ['pps4'] },
      { path: 'PPS/sPPS4.js', directories: ['PPS'], fileName: 'sPPS4.js', mainIds: ['spps4'] },
      { path: 'Outer/Inner/nested.js', directories: ['Outer', 'Inner'], fileName: 'nested.js', mainIds: ['nested'] },
   ]
   const localFiles = [
      { id: 'file-1', name: 'MyFile.js', enabled: true },
      { id: 'file-2', name: 'Disabled.js', enabled: false },
      { id: 'file-3', name: 'AnalysisOnly.js', enabled: true },
   ]
   const entries = {
      'file-1': [byId.get('local-a'), byId.get('local-b')],
      'file-2': [],
      'file-3': [],
   }

   const tree = Menu.buildTree({
      catalog,
      notations,
      getNotation: (id) => byId.get(id),
      getOwner: (id) => owners[id],
      localFiles,
      entriesForOwner: (owner) => entries[owner] || [],
      builtinLabel: 'Built-in',
      localLabel: 'Local files',
   })
   return { tree }
}

test('buildTree groups built-ins by directories and enabled locals by file', () => {
   const { tree } = fixture()

   assert.deepEqual(tree.map((node) => node.label), ['PPS', 'Outer', 'Local files'])
   assert.deepEqual(tree[0].children.map((node) => node.id), ['pps', 'pps4', 'spps4'])
   assert.equal(tree[1].children[0].label, 'Inner')
   assert.equal(tree[1].children[0].children[0].id, 'nested')
   assert.equal(tree[2].children[0].key, 'local-file:file-1')
   assert.equal(tree[2].children[0].label, 'MyFile.js')
   assert.deepEqual(tree[2].children[0].children.map((node) => node.id), ['local-a', 'local-b'])
})

test('flattenTree preserves folder state and counts selectable descendants', () => {
   const { tree } = fixture()
   const collapsed = Menu.flattenTree(tree, {}, '')

   assert.deepEqual(collapsed.map((row) => row.key), [
      'builtin-folder:PPS',
      'builtin-folder:Outer',
      'local-root',
   ])
   assert.deepEqual(collapsed.map((row) => row.count), [3, 1, 2])

   const ppsOpen = Menu.flattenTree(tree, { 'builtin-folder:PPS': true }, '')
   assert.deepEqual(ppsOpen.slice(0, 4).map((row) => row.key), [
      'builtin-folder:PPS',
      'notation:pps',
      'notation:pps4',
      'notation:spps4',
   ])
})

test('search matches folders, source filenames, notation names, and IDs', () => {
   const { tree } = fixture()

   assert.deepEqual(
      Menu.flattenTree(tree, {}, 'PPS').map((row) => row.key),
      ['builtin-folder:PPS', 'notation:pps', 'notation:pps4', 'notation:spps4']
   )
   assert.deepEqual(
      Menu.flattenTree(tree, {}, 'sPPS4.js').map((row) => row.key),
      ['builtin-folder:PPS', 'notation:spps4']
   )
   assert.deepEqual(
      Menu.flattenTree(tree, {}, 'nested notation').map((row) => row.key),
      ['builtin-folder:Outer', 'builtin-folder:Outer/Inner', 'notation:nested']
   )
   assert.deepEqual(
      Menu.flattenTree(tree, {}, 'local-b').map((row) => row.key),
      ['local-root', 'local-file:file-1', 'notation:local-b']
   )
})

test('ancestorKeysForNotation opens the complete current path', () => {
   const { tree } = fixture()

   assert.deepEqual(Menu.ancestorKeysForNotation(tree, 'nested'), [
      'builtin-folder:Outer',
      'builtin-folder:Outer/Inner',
   ])
   assert.deepEqual(Menu.ancestorKeysForNotation(tree, 'local-a'), [
      'local-root',
      'local-file:file-1',
   ])
   assert.deepEqual(Menu.ancestorKeysForNotation(tree, 'missing'), [])
})

test('remote-only inventory follows the complete upstream category hierarchy without duplicates', () => {
   const { hub, build } = integratedFixture()
   const tree = build()
   const ids = notationIds(tree)

   assert.equal(hub.main.length, 132)
   assert.equal(ids.length, 132)
   assert.equal(new Set(ids).size, 132)
   assert.deepEqual(pathLabels(tree, 'bocf-ebo'), ['OCF'])
   assert.deepEqual(pathLabels(tree, 'upms-partial-2'), ['BM-like', '(>n)-UPMS'])
   assert.deepEqual(
      pathLabels(tree, 'BMS-20260721-v10-weirdfull-display-GBMS-n-2-P'),
      ['BM-like', 'GMS', 'GBMS', 'n-P']
   )
   assert.deepEqual(pathLabels(tree, 'SA-omega2-MN'), ['MN', 'Smile'])

   const generator = categoryFolder(tree, 'category-upms-partial').generator
   assert.deepEqual(generator, {
      categoryId: 'category-upms-partial',
      start: 2,
      initial: 3,
      current: 3,
   })

   const cpsFolder = namedFolder(tree, 'n-CpS')
   assert.ok(cpsFolder)
   assert.equal(cpsFolder.generator.categoryId, 'n-cps')
   assert.equal(cpsFolder.generator.start, 1)
   assert.equal(cpsFolder.generator.initial, 2)
   assert.equal(cpsFolder.generator.current, 2)
   assert.match(cpsFolder.generator.help, /n-CpS/)
   assert.deepEqual(pathLabels(tree, '1-cps'), ['CpS', 'n-CpS'])
   assert.deepEqual(cpsFolder.children.map((node) => node.id), ['1-cps', '2-cps'])
})

test('runtime generated entries stay ordered in their category and expose validated state', () => {
   const { hub, context, build } = integratedFixture()
   context.SmileLeeNotationAdapter.installGenerated(
      hub.main,
      'category-upms-partial',
      4,
      context.SmileLeeNotationBundle
   )

   const tree = build({ 'category-upms-partial': 4 })
   const folder = categoryFolder(tree, 'category-upms-partial')
   assert.deepEqual(folder.children.map((node) => node.id), [
      'upms-partial-2',
      'upms-partial-3',
      'upms-partial-4',
   ])
   assert.deepEqual(pathLabels(tree, 'upms-partial-4'), ['BM-like', '(>n)-UPMS'])
   assert.equal(folder.generator.current, 4)
   assert.equal(categoryFolder(
      build({ 'category-upms-partial': 1 }),
      'category-upms-partial'
   ).generator.current, 3)
   assert.equal(categoryFolder(
      build({ 'category-upms-partial': 2 }),
      'category-upms-partial'
   ).generator.current, 2)
   assert.equal(categoryFolder(
      build({ 'category-upms-partial': 65 }),
      'category-upms-partial'
   ).generator.current, 3)
})

test('runtime n-CpS variants remain inside the n-CpS folder', () => {
   const { hub, context, build } = integratedFixture()
   hub.main.push(context.NotationGenerators['n-cps'].create(3))

   const tree = build({ 'n-cps': 3 })
   const folder = namedFolder(tree, 'n-CpS')

   assert.ok(folder)
   assert.deepEqual(folder.children.map((node) => node.id), ['1-cps', '2-cps', '3-cps'])
   assert.deepEqual(pathLabels(tree, '3-cps'), ['CpS', 'n-CpS'])
   assert.equal(folder.generator.current, 3)
})
