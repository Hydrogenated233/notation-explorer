const test = require('node:test')
const assert = require('node:assert/strict')

const latex = require('../js/latex-renderer.js')
const katex = require('../lib/katex/katex.min.js')

test('htmlToLatex converts nested scripts, Greek symbols, and supported entities', () => {
   assert.equal(
      latex.htmlToLatex('\u03c8<sub>\u03a9</sub>(\u03c9<sup>2</sup>)&sdot;x_1'),
      '\\psi _{\\Omega }(\\omega ^{2})\\cdot x\\_1'
   )
   assert.equal(latex.htmlToLatex('a<sup>b<sub>c</sub></sup>'), 'a^{b_{c}}')
})

test('notationToLatex prefers an explicit latex display and preserves legacy fallback', () => {
   const explicit = {
      display() { return 'ignored' },
      latex() { return '\\alpha' }
   }
   const legacy = { display() { return 'x<sub>1</sub>' } }

   assert.equal(latex.notationToLatex(explicit, []), '\\alpha')
   assert.equal(latex.notationToLatex(legacy, []), 'x_{1}')
})

test('composeLatex has no built-in commands and prepends only user source', () => {
   assert.equal(latex.composeLatex('', 'x'), 'x')
   assert.equal(latex.composeLatex('   ', 'x'), 'x')
   assert.equal(
      latex.composeLatex('\\newcommand{\\foo}[1]{#1^2}', '\\foo{x}'),
      '\\newcommand{\\foo}[1]{#1^2}\n\\foo{x}'
   )
})

test('renderLatex passes bounded safe options and isolated macros to KaTeX', () => {
   let captured
   const engine = {
      renderToString(source, options) {
         captured = { source, options }
         return '<span class="katex">ok</span>'
      }
   }

   latex.resetCommandCache()
   const rendered = latex.renderLatex('x', '', engine)

   assert.equal(rendered, '<span class="katex">ok</span>')
   assert.equal(captured.source, 'x')
   assert.deepEqual(captured.options, {
      throwOnError: false,
      displayMode: false,
      strict: 'ignore',
      trust: false,
      maxExpand: 1000,
      macros: {}
   })
})

test('KaTeX compiles parameter commands and renewcommand without built-in app macros', () => {
   latex.resetCommandCache()
   assert.deepEqual(latex.compileCommands('', katex).macros, {})

   const commands = [
      '\\newcommand{\\foo}[1]{#1^2}',
      '\\renewcommand{\\omega}{\\Omega}'
   ].join('\n')
   assert.equal(latex.validateCommands(commands, katex), '')
   assert.match(latex.renderLatex('\\foo{x}+\\omega', commands, katex), /class="katex"/)
})

test('invalid commands report errors while retaining the last valid macro set', () => {
   latex.resetCommandCache()
   const valid = '\\newcommand{\\foo}{x}'
   const invalid = '\\renewcommand{\\missing}{y}'

   assert.equal(latex.validateCommands(valid, katex), '')
   const compiled = latex.compileCommands(invalid, katex)

   assert.match(compiled.error, /\\missing/)
   assert.equal(typeof compiled.macros['\\foo'], 'object')
})

test('expression-local global definitions do not leak into later renders', () => {
   latex.resetCommandCache()
   assert.match(latex.renderLatex('\\gdef\\leak{x}\\leak', '', katex), /class="katex"/)
   assert.deepEqual(latex.compileCommands('', katex).macros, {})
   assert.match(latex.renderLatex('\\leak', '', katex), /\\leak/)
})
