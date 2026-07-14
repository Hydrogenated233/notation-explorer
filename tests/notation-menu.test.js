'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Menu = require('../js/notation-menu.js')

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
