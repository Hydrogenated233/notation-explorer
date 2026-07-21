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
   const components = Object.create(null)
   const storage = new Map()
   let appDefinition

   const root = { currentDataset: { is_root: true, mark: 0, subitems: [] } }
   const app = {
      component(name, definition) {
         components[name] = definition
         return this
      },
      config: { globalProperties: {} },
      mount() { return root },
   }
   const context = vm.createContext({
      console,
      Vue: {
         createApp(definition) {
            appDefinition = definition
            return app
         },
      },
      Worker: function () { this.postMessage = function () {} },
      register: hub.main,
      analysis_register: hub.analysis,
      window: null,
      document: {
         documentElement: { classList: { toggle() {} } },
      },
      localStorage: {
         getItem(key) { return storage.has(key) ? storage.get(key) : null },
         setItem(key, value) { storage.set(key, String(value)) },
      },
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

   vm.runInContext(
      fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8'),
      context,
      { filename: 'js/framework.js' }
   )

   return { appDefinition, components, storage }
}

function createRootState(appDefinition) {
   const state = appDefinition.data()
   for (const [name, method] of Object.entries(appDefinition.methods)) {
      state[name] = method.bind(state)
   }
   return state
}

function inlineView(component, analysis, rootOverrides) {
   const instance = {
      item: { analysis },
      $root: Object.assign({
         analysisLatexPreview: true,
         analysisLatexInline: true,
         analysisInputVisible: true,
         renderAnalysisLatex(source) { return '<rendered>' + source + '</rendered>' },
      }, rootOverrides),
   }
   instance.analysisSource = component.computed.analysisSource.call(instance)
   instance.showInlineAnalysisLatex = component.computed.showInlineAnalysisLatex.call(instance)
   instance.renderedInlineAnalysis = component.computed.renderedInlineAnalysis.call(instance)
   return instance
}

test('analysis inline LaTeX persists, loads compatibly, and resets off', () => {
   const { appDefinition, storage } = loadFramework()
   const state = createRootState(appDefinition)

   assert.equal(state.analysisLatexInline, false)
   state.analysisLatexInline = true
   state.saveSettings()
   assert.equal(JSON.parse(storage.get('ne-config')).analysisLatexInline, true)

   storage.set('ne-config', JSON.stringify({ analysisLatexPreview: true }))
   state.analysisLatexInline = true
   state.loadSettings()
   assert.equal(state.analysisLatexInline, false)

   storage.set('ne-config', JSON.stringify({
      analysisLatexPreview: true,
      analysisLatexInline: true,
   }))
   state.loadSettings()
   assert.equal(state.analysisLatexInline, true)

   state.resetSettings()
   assert.equal(state.analysisLatexInline, false)
   assert.equal(JSON.parse(storage.get('ne-config')).analysisLatexInline, false)
})

test('analysis inline LaTeX requires both switches, visibility, and nonblank text', () => {
   const { components } = loadFramework()
   const component = components['notation-list-item']

   const active = inlineView(component, '\\alpha + 1')
   assert.equal(active.showInlineAnalysisLatex, true)
   assert.equal(active.renderedInlineAnalysis, '<rendered>\\alpha + 1</rendered>')

   assert.equal(inlineView(component, '\\alpha', { analysisLatexPreview: false }).showInlineAnalysisLatex, false)
   assert.equal(inlineView(component, '\\alpha', { analysisLatexInline: false }).showInlineAnalysisLatex, false)
   assert.equal(inlineView(component, '\\alpha', { analysisInputVisible: false }).showInlineAnalysisLatex, false)
   assert.equal(inlineView(component, '   ').showInlineAnalysisLatex, false)
   assert.equal(inlineView(component, undefined).showInlineAnalysisLatex, false)
})

test('analysis inline LaTeX overlays the mounted raw input only while unfocused', () => {
   const { components } = loadFramework()
   const template = components['notation-list-item'].template
   const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')
   const css = fs.readFileSync(path.join(projectRoot, 'css', 'index.css'), 'utf8')

   assert.match(html, /v-model="analysisLatexInline"\s+:disabled="!analysisLatexPreview"/)
   assert.match(template, /ref="input"[^>]*v-model="item\.analysis"/s)
   assert.match(template, /class="analysis-inline-latex"\s+aria-hidden="true"/)
   assert.match(template, /v-html="renderedInlineAnalysis"/)
   assert.match(css, /\.analysis-input-resize\.has-inline-latex:not\(:focus-within\)[^{]*> input\[type="text"\]\s*\{[^}]*opacity:\s*0;/s)
   assert.match(css, /\.analysis-input-resize\.has-inline-latex:focus-within\s*>\s*\.analysis-inline-latex\s*\{[^}]*opacity:\s*0;/s)
   assert.match(css, /\.analysis-inline-latex\s*\{[^}]*pointer-events:\s*none;/s)
})
