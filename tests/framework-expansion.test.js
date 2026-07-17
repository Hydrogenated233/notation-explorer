'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.join(__dirname, '..')

function loadFramework() {
   const hub = new NotationRegistryHub()
   const dataset = { is_root: true, mark: 0, path: '', subitems: [] }
   const root = { currentDataset: dataset }
   const app = {
      component() { return this },
      config: { globalProperties: {} },
      mount() { return root },
   }
   const context = vm.createContext({
      console,
      Vue: { createApp() { return app } },
      Worker: function () { this.postMessage = function () {} },
      register: hub.main,
      analysis_register: hub.analysis,
      window: null,
      document: {},
      setTimeout,
      clearTimeout,
      Infinity,
      Number,
      String,
      Object,
      Array,
      Math,
      Map,
      parseInt,
      isNaN,
   })
   context.window = context

   for (const file of [
      path.join('js', 'notations', '00-shared-seq.js'),
      path.join('js', 'notations', '01-shared-matrix.js'),
      path.join('js', 'notations', 'BM-like', 'PrMS.js'),
      path.join('js', 'framework.js'),
   ]) {
      vm.runInContext(
         fs.readFileSync(path.join(projectRoot, file), 'utf8'),
         context,
         { filename: file }
      )
   }

   return { context, root, notation: hub.main.get('prms') }
}

function expand(context, item, notation) {
   context.expansionTestItem = item
   context.expansionTestNotation = notation
   vm.runInContext(
      'expand_item(expansionTestItem, expansionTestNotation, false, 0)',
      context
   )
}

function treeItem(expr, bound, index, parent, itemPath) {
   return {
      expr,
      bound,
      subitems: [],
      mark: null,
      index,
      parent,
      path: itemPath,
   }
}

test('a PrMS fixed successor inserts its unique child only once', () => {
   const { context, root, notation } = loadFramework()
   const expr = notation.fromDisplay('(1)(2,1)(1)(2,1)')
   const successor = treeItem(expr, [], 0, root.currentDataset, '0')
   const zero = treeItem([], [], 1, root.currentDataset, '1')
   root.currentDataset.subitems.push(successor, zero)

   expand(context, successor, notation)
   expand(context, successor, notation)

   assert.equal(successor.subitems.length, 1)
   assert.equal(notation.display(successor.subitems[0].expr), '(1)(2,1)(1)(2)')
})

test('a PrMS fixed successor does not duplicate a generated sibling', () => {
   const { context, notation } = loadFramework()
   const parent = { is_root: false, mark: 0, path: 'p', subitems: [] }
   const expr = notation.fromDisplay('(1)(2,1)(1)(2,1)')
   const successor = treeItem(expr, [], 0, parent, 'p,0')
   parent.subitems.push(successor)

   expand(context, successor, notation)
   expand(context, successor, notation)

   assert.equal(parent.subitems.length, 2)
   assert.equal(notation.display(parent.subitems[1].expr), '(1)(2,1)(1)(2)')
   assert.equal(successor.subitems.length, 0)
})
