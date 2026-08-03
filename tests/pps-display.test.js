'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { NotationRegistryHub } = require('../js/notation-registry.js')
const { resolveDisplay } = require('../js/notation-display.js')

const root = path.join(__dirname, '..')
const notationFiles = [
   'PPS.js',
   'PPS4.js',
   'ewPPS4.js',
   'fPPS4.js.disable',
   'sPPS4.js',
   'tPPS4.js',
   'wPPS4.js',
]

function loadPPSFamily() {
   const hub = new NotationRegistryHub()
   const context = vm.createContext({
      register: hub.main,
      analysis_register: hub.analysis,
      Infinity,
      Number,
      String,
      Object,
      Array,
      parseInt,
   })

   vm.runInContext(
      fs.readFileSync(path.join(root, 'js', 'notations', '00-shared-seq.js'), 'utf8'),
      context,
      { filename: '00-shared-seq.js' }
   )
   notationFiles.forEach((filename) => {
      vm.runInContext(
         fs.readFileSync(path.join(root, 'js', 'notations', 'PPS', filename), 'utf8'),
         context,
         { filename }
      )
   })
   return hub.main
}

test('every PPS-family display marks all one-based columns without changing plain text', () => {
   const register = loadPPSFamily()
   const expectedHtml = '0<sub class="pps-column-index">1</sub>' +
      '10<sub class="pps-column-index">2</sub>' +
      '2<sub class="pps-column-index">3</sub>'
   const expectedLatex = '0_{\\color{gray}1}10_{\\color{gray}2}2_{\\color{gray}3}'

   for (const id of ['pps', 'pps4', 'ewpps4', 'fpps4', 'spps4', 'tpps4', 'wpps4']) {
      const notation = register.get(id)
      const display = resolveDisplay(notation)
      assert.equal(notation.display([0, 10, 2]), '0,10,2', id + ' legacy display')
      assert.equal(display.plain([0, 10, 2]), '0,10,2', id + ' plain display')
      assert.equal(display.html([0, 10, 2]), expectedHtml, id + ' HTML display')
      assert.equal(display.latex([0, 10, 2]), expectedLatex, id + ' LaTeX display')
      assert.equal(display.html([Infinity]), 'Limit', id + ' HTML Limit')
      assert.equal(display.latex([Infinity]), 'Limit', id + ' LaTeX Limit')
      assert.deepEqual(Array.from(notation.fromDisplay(display.plain([0, 10, 2]))), [0, 10, 2])
   }
})

test('PPS HTML includes the final and multi-digit column labels without commas', () => {
   const register = loadPPSFamily()
   const sequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

   for (const id of ['pps', 'pps4', 'ewpps4', 'fpps4', 'spps4', 'tpps4', 'wpps4']) {
      const html = resolveDisplay(register.get(id)).html(sequence)
      assert.doesNotMatch(html, /,/, id + ' HTML commas')
      assert.match(html, /9<sub class="pps-column-index">10<\/sub>$/, id + ' final column')
   }
})

test('ordinary PPS variants keep empty expressions empty in every display mode', () => {
   const register = loadPPSFamily()

   for (const id of ['pps', 'pps4', 'ewpps4', 'fpps4', 'tpps4', 'wpps4']) {
      const display = resolveDisplay(register.get(id))
      assert.equal(display.plain([]), '', id + ' empty plain')
      assert.equal(display.html([]), '', id + ' empty HTML')
      assert.equal(display.latex([]), '', id + ' empty LaTeX')
   }
})

test('Second PPS4 keeps its existing empty-expression displays', () => {
   const display = resolveDisplay(loadPPSFamily().get('spps4'))

   assert.equal(display.plain([]), '(empty)')
   assert.equal(display.html([]), '(empty)')
   assert.equal(display.latex([]), '\\emptyset')
})

test('PPS column labels have a shared gray presentation style', () => {
   const css = fs.readFileSync(path.join(root, 'css', 'index.css'), 'utf8')
   assert.match(css, /\.pps-column-index\s*\{[^}]*color:\s*#888;/s)
   assert.match(css, /html\.dark \.pps-column-index\s*\{[^}]*color:\s*#999;/s)
})
