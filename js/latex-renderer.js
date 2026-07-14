;(function (root, factory) {
   var api = factory(root)
   if (typeof module === 'object' && module.exports) module.exports = api
   if (root) root.NotationLatex = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
   'use strict'

   var ESCAPES = {
      '\\': '\\textbackslash ',
      '{': '\\{',
      '}': '\\}',
      '^': '\\^{}',
      '_': '\\_',
      '#': '\\#',
      '$': '\\$',
      '%': '\\%',
      '&': '\\&',
      '~': '\\textasciitilde ',
      '\u03c9': '\\omega ',
      '\u03a9': '\\Omega ',
      '\u03c8': '\\psi '
   }

   var ENTITIES = {
      '&sdot;': '\\cdot ',
      '&middot;': '\\cdot ',
      '&times;': '\\times ',
      '&nbsp;': '\\ ',
      '&amp;': '\\&',
      '&lt;': '<',
      '&gt;': '>'
   }

   var commandCache = {
      engine: null,
      source: null,
      macros: {},
      lastValidMacros: {},
      error: ''
   }

   function escapeHtml(value) {
      return String(value)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
   }

   function htmlToLatex(value) {
      var html = String(value === null || value === undefined ? '' : value)
      var index = 0

      function read(endTag) {
         var result = ''
         while (index < html.length) {
            if (endTag && html.indexOf(endTag, index) === index) {
               index += endTag.length
               break
            }
            if (html.indexOf('<sub>', index) === index) {
               index += 5
               result += '_{' + read('</sub>') + '}'
               continue
            }
            if (html.indexOf('<sup>', index) === index) {
               index += 5
               result += '^{' + read('</sup>') + '}'
               continue
            }

            var entity = Object.keys(ENTITIES).find(function (candidate) {
               return html.indexOf(candidate, index) === index
            })
            if (entity) {
               result += ENTITIES[entity]
               index += entity.length
               continue
            }

            var character = html[index]
            result += ESCAPES[character] || character
            index++
         }
         return result
      }

      return read()
   }

   function notationToLatex(notation, expression) {
      if (notation && typeof notation.latex === 'function') {
         return String(notation.latex(expression))
      }
      if (!notation || typeof notation.display !== 'function') return ''
      return htmlToLatex(notation.display(expression))
   }

   function composeLatex(commands, latex) {
      var commandSource = String(commands === null || commands === undefined ? '' : commands)
      var expressionSource = String(latex === null || latex === undefined ? '' : latex)
      return commandSource.trim() ? commandSource + '\n' + expressionSource : expressionSource
   }

   function renderOptions(throwOnError, macros, globalGroup) {
      var options = {
         throwOnError: throwOnError,
         displayMode: false,
         strict: 'ignore',
         trust: false,
         maxExpand: 1000
      }
      if (macros) options.macros = macros
      if (globalGroup) options.globalGroup = true
      return options
   }

   function cloneMacros(macros) {
      return Object.assign({}, macros || {})
   }

   function resetCommandCache() {
      commandCache.engine = null
      commandCache.source = null
      commandCache.macros = {}
      commandCache.lastValidMacros = {}
      commandCache.error = ''
   }

   function compileCommands(commands, engine) {
      var source = String(commands === null || commands === undefined ? '' : commands)
      var katexEngine = engine || (root && root.katex)
      if (!katexEngine || typeof katexEngine.renderToString !== 'function') {
         return { macros: {}, error: 'KaTeX is unavailable.' }
      }
      if (commandCache.engine === katexEngine && commandCache.source === source) {
         return { macros: cloneMacros(commandCache.macros), error: commandCache.error }
      }
      if (commandCache.engine !== katexEngine) {
         commandCache.lastValidMacros = {}
      }

      var macros = {}
      var error = ''
      if (source.trim()) {
         try {
            katexEngine.renderToString(
               source + '\n\\relax',
               renderOptions(true, macros, true)
            )
            commandCache.lastValidMacros = cloneMacros(macros)
         } catch (caught) {
            error = caught && caught.message ? caught.message : String(caught)
            macros = cloneMacros(commandCache.lastValidMacros)
         }
      } else {
         commandCache.lastValidMacros = {}
      }

      commandCache.engine = katexEngine
      commandCache.source = source
      commandCache.macros = cloneMacros(macros)
      commandCache.error = error
      return { macros: cloneMacros(macros), error: error }
   }

   function renderLatex(latex, commands, engine) {
      var katexEngine = engine || (root && root.katex)
      if (!katexEngine || typeof katexEngine.renderToString !== 'function') {
         return '<span class="latex-render-error">' + escapeHtml(latex) + '</span>'
      }
      try {
         var compiled = compileCommands(commands, katexEngine)
         return katexEngine.renderToString(
            String(latex === null || latex === undefined ? '' : latex),
            renderOptions(false, cloneMacros(compiled.macros), false)
         )
      } catch (error) {
         var message = error && error.message ? error.message : String(error)
         return '<span class="latex-render-error" title="' + escapeHtml(message) + '">' +
            escapeHtml(latex) + '</span>'
      }
   }

   function renderAnalysisText(source, asLatex, commands, engine) {
      var text = String(source === null || source === undefined ? '' : source)
      return asLatex ? renderLatex(text, commands, engine) : text
   }

   function renderNotation(notation, expression, commands, prefix) {
      var latex = notationToLatex(notation, expression)
      if (prefix) latex = htmlToLatex(prefix) + latex
      return renderLatex(latex, commands)
   }

   function validateCommands(commands, engine) {
      var source = String(commands === null || commands === undefined ? '' : commands)
      if (!source.trim()) return ''
      return compileCommands(source, engine).error
   }

   return {
      escapeHtml: escapeHtml,
      htmlToLatex: htmlToLatex,
      notationToLatex: notationToLatex,
      composeLatex: composeLatex,
      compileCommands: compileCommands,
      resetCommandCache: resetCommandCache,
      renderLatex: renderLatex,
      renderAnalysisText: renderAnalysisText,
      renderNotation: renderNotation,
      validateCommands: validateCommands
   }
})
