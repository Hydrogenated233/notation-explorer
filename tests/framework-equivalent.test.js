'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.join(__dirname, '..')

function memoryStorage() {
   const values = new Map()
   return {
      getItem(key) { return values.has(key) ? values.get(key) : null },
      setItem(key, value) { values.set(key, String(value)) },
   }
}

function fixtureNotation() {
   return {
      id: 'fixture',
      name: 'Fixture',
      display(expr) { return `P<sub>${expr}</sub>` },
      displayPlain(expr) { return `P${expr}` },
      fromDisplay(source) { return Number(String(source).slice(1)) },
      able() { return false },
      compare(a, b) { return Math.sign(a - b) },
      FS(expr, index) { return expr + index },
      init() { return [{ expr: 0, low: [[0]], subitems: [] }] },
      display_equiv: {
         layer: {
            plain(expr) { return expr === Infinity ? 'LayerLimit' : `L${expr}` },
            html(expr) { return `L<sup>${expr}</sup>` },
            latex(expr) { return `L^{${expr}}` },
            from_display(source) { return Number(String(source).slice(1)) },
            name_id: 'display.layer',
         },
         view: {
            plain(expr) { return `V${expr}` },
         },
      },
      credit_text_id: 'credit.dsm',
   }
}

function loadHarness() {
   const hub = new NotationRegistryHub()
   hub.main.push(fixtureNotation())
   hub.main.push(Object.assign(fixtureNotation(), {
      id: 'other',
      name: 'Other',
      display(expr) { return `Q<sub>${expr}</sub>` },
      displayPlain(expr) { return `Q${expr}` },
      fromDisplay(source) { return Number(String(source).slice(1)) },
      FS(expr, index) { return expr + index + 100 },
   }))
   const storage = memoryStorage()
   const components = Object.create(null)
   let root
   let exportedWorkbook
   let importWorkbook
   const fileReaders = []

   function FileReader() {
      fileReaders.push(this)
   }
   FileReader.prototype.readAsArrayBuffer = function (file) {
      this.file = file
   }

   const context = vm.createContext({
      console,
      register: hub.main,
      analysis_register: hub.analysis,
      localStorage: storage,
      document: {
         documentElement: { classList: { toggle() {} } },
         getElementById() { return null },
      },
      Worker: function () { this.postMessage = function () {} },
      FileReader,
      ResizeObserver: undefined,
      XLSX: {
         utils: {
            aoa_to_sheet(rows) { return rows },
            book_new() { return { sheets: [] } },
            book_append_sheet(workbook, sheet, name) { workbook.sheets.push({ name, sheet }) },
            sheet_to_json(sheet) { return sheet },
         },
         read() { return importWorkbook },
         writeFile(workbook) { exportedWorkbook = workbook },
      },
      setTimeout,
      clearTimeout,
      setInterval() { return 1 },
      clearInterval() {},
      alert() {},
   })
   context.window = context
   context.globalThis = context
   context.Vue = {
      createApp(options) {
         return {
            config: { globalProperties: {} },
            component(name, definition) {
               components[name] = definition
               return this
            },
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

   for (const file of [
      'js/notation-display.js',
      'js/notation-credits.js',
      'js/framework.js',
   ]) {
      vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), context, { filename: file })
   }

   return {
      context,
      hub,
      root,
      components,
      storage,
      getExportedWorkbook() { return exportedWorkbook },
      completeImport(workbook) {
         importWorkbook = workbook
         const reader = fileReaders.shift()
         assert.ok(reader, 'expected a pending file reader')
         reader.onload({ target: { result: new ArrayBuffer(0) } })
      },
   }
}

function componentInstance(definition, values) {
   const instance = Object.assign({}, values)
   Object.keys(definition.methods || {}).forEach((name) => {
      instance[name] = definition.methods[name]
   })
   Object.keys(definition.computed || {}).forEach((name) => {
      Object.defineProperty(instance, name, {
         configurable: true,
         get() { return definition.computed[name].call(instance) },
      })
   })
   return instance
}

test('equivalent selection and hide-original state persist per notation', () => {
   const { root, storage } = loadHarness()

   assert.equal(root.currentEquivalentId, '')
   root.setCurrentEquivalent('layer')
   assert.equal(root.currentEquivalentId, 'layer')
   assert.equal(root.currentEquivalentHideOriginal, true)
   root.setCurrentEquivalentHideOriginal(false)

   const saved = JSON.parse(storage.getItem('ne-config'))
   const key = '@notation-explorer/builtin::fixture'
   assert.deepEqual(saved.equivActive, { [key]: 'layer' })
   assert.deepEqual(saved.equivHideOriginal, { [key]: false })

   root.equivActive = Object.create(null)
   root.equivHideOriginal = Object.create(null)
   root.loadSettings()
   assert.equal(root.currentEquivalentId, 'layer')
   assert.equal(root.currentEquivalentHideOriginal, false)

   root.equivActive[key] = 'removed'
   assert.equal(root.currentEquivalentId, '')
})

test('removed local IDs do not leak equivalent state into a later file', () => {
   const { root, storage } = loadHarness()
   const key = '@notation-explorer/builtin::fixture'
   root.equivActive[key] = 'layer'
   root.equivHideOriginal[key] = false

   root.clearEquivalentStateForIds(['fixture'], '@notation-explorer/builtin')
   root.saveSettings()

   assert.equal(root.equivActive[key], undefined)
   assert.equal(root.equivHideOriginal[key], undefined)
   const saved = JSON.parse(storage.getItem('ne-config'))
   assert.equal(saved.equivActive[key], undefined)
   assert.equal(saved.equivHideOriginal[key], undefined)
})

test('equivalent state is isolated when two local files reuse the same notation id', () => {
   const { root, hub } = loadHarness()
   const builtin = hub.main.unregister('fixture', '@notation-explorer/builtin')
   hub.main.appendOwned('file-a', [builtin])
   root.currentNotationId = 'fixture'
   root.setCurrentEquivalent('layer')

   hub.main.unregister('fixture', 'file-a')
   hub.main.appendOwned('file-b', [fixtureNotation()])
   assert.equal(root.requestedEquivalentId('fixture'), undefined)

   root.setCurrentEquivalent('view')
   root.clearEquivalentStateForIds(['fixture'], 'file-a')

   assert.equal(root.equivActive['file-a::fixture'], undefined)
   assert.equal(root.equivActive['file-b::fixture'], 'view')
   assert.equal(root.requestedEquivalentId('fixture'), 'view')
})

test('legacy bare-id equivalent settings migrate to the active owner key', () => {
   const { root, storage } = loadHarness()
   storage.setItem('ne-config', JSON.stringify({
      equivActive: { fixture: 'layer' },
      equivHideOriginal: { fixture: false },
   }))

   root.loadSettings()

   assert.equal(root.equivActive['@notation-explorer/builtin::fixture'], 'layer')
   assert.equal(root.equivHideOriginal['@notation-explorer/builtin::fixture'], false)
   assert.equal(root.currentEquivalentId, 'layer')
})

test('re-enabling changed source clears removed ids using the previous manifest', () => {
   const { root } = loadHarness()
   root.equivActive['file-a::old-id'] = 'layer'
   root.equivHideOriginal['file-a::old-id'] = false

   root.applyLocalFileChange({
      file: { id: 'file-a' },
      previous: { manifest: { main: ['old-id'] } },
      sourceChanged: true,
      change: {
         main: { added: [{ id: 'new-id' }], removed: [], initialData: [] },
         analysis: { added: [], removed: [] },
      },
   }, 'enable', {
      mainOrder: ['fixture', 'other'],
      currentNotationId: 'fixture',
      currentAnalysisId: '',
   })

   assert.equal(root.equivActive['file-a::old-id'], undefined)
   assert.equal(root.equivHideOriginal['file-a::old-id'], undefined)
})

test('tree expressions render active equivalents and optionally retain the original', () => {
   const { root, components } = loadHarness()
   root.setCurrentEquivalent('layer')
   root.setCurrentEquivalentHideOriginal(false)
   const notation = root.currentNotation
   const expression = componentInstance(components['notation-expression'], {
      $root: root,
      notation,
      expression: 3,
      includeOriginal: true,
   })

   assert.equal(expression.renderedExpression, 'L<sup>3</sup>')
   assert.equal(expression.showOriginal, true)
   assert.equal(expression.renderedOriginalExpression, 'P<sub>3</sub>')

   root.setCurrentEquivalentHideOriginal(true)
   assert.equal(expression.showOriginal, false)
})

test('xlsx export and direct expansion use the selected plain display and parser', () => {
   const harness = loadHarness()
   const { root } = harness
   root.setCurrentEquivalent('layer')
   root.datasets.fixture = {
      is_root: true,
      subitems: [{ expr: 2, analysis: 'note', subitems: [] }],
   }

   root.export_xlsx()
   assert.deepEqual(
      JSON.parse(JSON.stringify(harness.getExportedWorkbook().sheets[0].sheet)),
      [['L2', 'note']]
   )

   root.toolsExpandNotation = 'fixture'
   root.toolsExpandEquiv = 'layer'
   root.toolsExpandExpr = 'L4'
   root.toolsExpandN = 1
   root.toolsExpandCount = 2
   root.runExpand()
   assert.match(root.toolsOutput, /Expression: L4/)
   assert.match(root.toolsOutput, /FS\(1\) = L5/)
   assert.match(root.toolsOutput, /FS\(2\) = L6/)
})

test('xlsx import remains bound to the notation and equivalent selected when reading starts', () => {
   const harness = loadHarness()
   const { root } = harness
   root.setCurrentEquivalent('layer')

   const targetDataset = root.datasets.fixture
   const otherDataset = root.datasets.other
   const targetKey = root.dataKeyForId('fixture')
   root.handle_import_file({
      target: { files: [{ name: 'analysis.xlsx' }], value: 'analysis.xlsx' },
   })

   root.allNoteSheets[targetKey] = root.noteSheets
   root.currentNotationId = 'other'
   root.initSheets()
   const otherSheets = root.noteSheets

   harness.completeImport({
      SheetNames: ['sheet1', 'Imported notes'],
      Sheets: {
         sheet1: [['L0', 'fixture analysis']],
         'Imported notes': [['fixture', 'notes']],
      },
   })

   assert.equal(targetDataset.subitems[0].analysis, 'fixture analysis')
   assert.equal(otherDataset.subitems[0].analysis, undefined)
   assert.equal(root.noteSheets, otherSheets)
   assert.deepEqual(JSON.parse(JSON.stringify(root.allNoteSheets[targetKey])), [
      { name: 'Imported notes', text: 'fixture,notes' },
   ])
})

test('an equivalent without a parser never falls back to the primary parser', () => {
   const { root } = loadHarness()
   root.toolsExpandNotation = 'fixture'
   root.toolsExpandEquiv = 'view'
   root.toolsExpandExpr = 'P4'
   root.runExpand()

   assert.equal(root.toolsOutput, 'Parse error: selected representation cannot parse input')
})

test('direct expansion notes are disposable independent instances', () => {
   const { root, storage } = loadHarness()
   root.setCurrentEquivalent('layer')

   const first = root.createDirectExpandNote()
   root.currentNotationId = 'other'
   const second = root.createDirectExpandNote()

   assert.notEqual(first.id, second.id)
   assert.equal(first.notationId, 'fixture')
   assert.equal(first.equivalentId, 'layer')
   assert.equal(second.notationId, 'other')
   assert.equal(second.equivalentId, '')
   assert.ok(first.x + first.width < second.x)

   root.toolsOutput = 'shared tools output'
   first.expression = 'L4'
   first.startN = 1
   first.count = 2
   second.expression = 'Q10'
   second.startN = 2
   second.count = 1

   root.runDirectExpandNote(first)
   assert.match(first.output, /Expression: L4/)
   assert.match(first.output, /FS\(1\) = L5/)
   assert.match(first.output, /FS\(2\) = L6/)
   assert.equal(second.output, '')

   root.runDirectExpandNote(second)
   assert.match(second.output, /Notation: Other \(other\)/)
   assert.match(second.output, /Expression: Q10/)
   assert.match(second.output, /FS\(2\) = Q112/)
   assert.match(first.output, /FS\(2\) = L6/)
   assert.equal(root.toolsOutput, 'shared tools output')

   root.closeDirectExpandNote(first.id)
   assert.equal(root.directExpandNotes.length, 1)
   assert.equal(root.directExpandNotes[0], second)
   const replacement = root.createDirectExpandNote()
   assert.equal(replacement.slot, first.slot)
   assert.notEqual(replacement.x, second.x)
   root.closeDirectExpandNote(replacement.id)
   root.closeDirectExpandNote(999999)
   assert.equal(root.directExpandNotes.length, 1)
   assert.equal(root.directExpandNotes[0], second)

   root.saveSettings()
   const saved = JSON.parse(storage.getItem('ne-config'))
   assert.equal(Object.prototype.hasOwnProperty.call(saved, 'directExpandNotes'), false)
})

test('direct expansion notes reconcile unloaded notations and invalid equivalents', () => {
   const { root, hub } = loadHarness()
   root.setCurrentEquivalent('layer')
   const note = root.createDirectExpandNote()

   hub.main.unregister('fixture', '@notation-explorer/builtin')
   root.reconcileDirectExpandNotes('other')

   assert.equal(note.notationId, 'other')
   assert.equal(note.ownerId, '@notation-explorer/builtin')
   assert.equal(note.equivalentId, '')
})

test('direct expansion validates its numeric range before iterating', () => {
   const { root } = loadHarness()
   const base = {
      notationId: 'fixture', equivalentId: '', expression: 'P4', startN: 0, count: 1,
   }

   assert.equal(
      root.directExpansionOutput(Object.assign({}, base, { startN: -1 })),
      'Start n must be a non-negative safe integer'
   )
   assert.equal(
      root.directExpansionOutput(Object.assign({}, base, { startN: '' })),
      'Start n must be a non-negative safe integer'
   )
   assert.equal(
      root.directExpansionOutput(Object.assign({}, base, { count: 1001 })),
      'Count must be an integer from 1 to 1000'
   )
   assert.equal(
      root.directExpansionOutput(Object.assign({}, base, { count: 1e308 })),
      'Count must be an integer from 1 to 1000'
   )
   assert.equal(
      root.directExpansionOutput(Object.assign({}, base, {
         startN: Number.MAX_SAFE_INTEGER,
         count: 2,
      })),
      'Fundamental-sequence index exceeds the safe integer range'
   )
})

test('Limit aliases use the selected equivalent representation for input and output', () => {
   const { root } = loadHarness()

   for (const expression of ['Limit', 'Infinity', '\u221e']) {
      const output = root.directExpansionOutput({
         notationId: 'fixture',
         equivalentId: 'layer',
         expression,
         startN: 0,
         count: 1,
      })
      assert.match(output, /Expression: LayerLimit/)
      assert.match(output, /FS\(0\) = LayerLimit/)
   }
})

test('direct expansion note pointer interactions clamp geometry to the viewport', () => {
   const { root } = loadHarness()
   const note = root.createDirectExpandNote()
   const target = {
      setPointerCapture() {},
      releasePointerCapture() {},
   }

   root.startDirectExpandPointer(note, 'drag', {
      pointerType: 'mouse', button: 0, pointerId: 1,
      clientX: 100, clientY: 100, currentTarget: target,
   })
   root.onDirectExpandPointerMove({
      pointerId: 1, clientX: -1000, clientY: -1000, preventDefault() {},
   })
   assert.equal(note.x, 8)
   assert.equal(note.y, 8)
   root.endDirectExpandPointer({ pointerId: 1 })

   root.startDirectExpandPointer(note, 'resize', {
      pointerType: 'mouse', button: 0, pointerId: 2,
      clientX: 0, clientY: 0, currentTarget: target,
   })
   root.onDirectExpandPointerMove({
      pointerId: 2, clientX: 5000, clientY: 5000, preventDefault() {},
   })
   assert.ok(note.width <= 1008)
   assert.ok(note.height <= 752)
   root.endDirectExpandPointer({ pointerId: 2 })
   assert.equal(root.directExpandPointer, null)
})

test('single-column direct expansion notes keep every title reachable after focus changes', () => {
   const { context, root } = loadHarness()
   context.innerWidth = 390
   context.innerHeight = 844

   const first = root.createDirectExpandNote()
   root.createDirectExpandNote()
   root.createDirectExpandNote()
   assert.equal(root.directExpandNotes.map((note) => note.y).join(','), '56,100,144')

   root.focusDirectExpandNote(first)
   const byLayer = root.directExpandNotes.slice().sort((a, b) => a.z - b.z)
   assert.equal(byLayer.map((note) => note.y).join(','), '56,100,144')
   assert.equal(byLayer.at(-1), first)

   let prevented = false
   root.handleDirectExpandWindowKeydown(first, 'drag', {
      key: 'ArrowDown', shiftKey: false, preventDefault() { prevented = true },
   })
   assert.equal(first.y, 154)
   assert.equal(prevented, true)
   root.handleDirectExpandWindowKeydown(first, 'drag', {
      key: 'ArrowDown', shiftKey: false, preventDefault() {},
   })
   assert.equal(first.y, 164)

   root.closeDirectExpandNote(first.id)
   assert.equal(
      root.directExpandNotes.slice().sort((a, b) => a.z - b.z).map((note) => note.y).join(','),
      '56,100'
   )
})

test('credit text follows the current UI language', () => {
   const { root } = loadHarness()
   root.lang = 'zh'
   assert.equal(root.currentNotationCredit, '由 Alice 定义并给出展开器.')
   root.lang = 'en'
   assert.equal(root.currentNotationCredit, 'Defined by Alice, with expander by the same author.')
})
