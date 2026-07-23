;(function (root, factory) {
   if (typeof module === 'object' && module.exports) {
      var latexTools
      try {
         latexTools = require('./latex-renderer.js')
      } catch (error) {
         latexTools = null
      }
      module.exports = factory(function () { return latexTools })
      return
   }

   root.NotationDisplay = factory(function () { return root.NotationLatex })
})(typeof globalThis !== 'undefined' ? globalThis : this, function (getLatexTools) {
   'use strict'

   var hasOwn = Object.prototype.hasOwnProperty

   function firstFunction() {
      for (var index = 0; index < arguments.length; index++) {
         if (typeof arguments[index] === 'function') return arguments[index]
      }
      return undefined
   }

   function firstString() {
      for (var index = 0; index < arguments.length; index++) {
         if (typeof arguments[index] === 'string' && arguments[index] !== '') {
            return arguments[index]
         }
      }
      return undefined
   }

   function htmlToLatex(value) {
      var tools = typeof getLatexTools === 'function' ? getLatexTools() : null
      if (tools && typeof tools.htmlToLatex === 'function') {
         return tools.htmlToLatex(value)
      }
      return String(value === null || value === undefined ? '' : value)
   }

   function getDisplayNameId(spec) {
      if (!spec || typeof spec === 'function' || typeof spec !== 'object') return undefined
      return firstString(spec.nameId, spec.name_id)
   }

   function normalizeDisplaySpec(spec, overrides) {
      overrides = overrides || {}
      var objectSpec = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {}
      var simpleDisplay = typeof spec === 'function' ? spec : undefined

      var plain = firstFunction(
         overrides.plain,
         objectSpec.plain,
         objectSpec.displayPlain,
         objectSpec.display_plain,
         simpleDisplay,
         objectSpec.html,
         objectSpec.latex
      )
      var html = firstFunction(
         overrides.html,
         objectSpec.html,
         objectSpec.displayHtml,
         objectSpec.display_html,
         simpleDisplay,
         plain
      )
      var explicitLatex = firstFunction(overrides.latex, objectSpec.latex)

      if (!plain || !html) {
         throw new TypeError('A display spec must provide a display function.')
      }

      var latex = explicitLatex || function (expression) {
         return htmlToLatex(html(expression))
      }
      var fromDisplay = firstFunction(
         overrides.fromDisplay,
         objectSpec.fromDisplay,
         objectSpec.from_display
      )
      var fromDisplayAlter = firstFunction(
         overrides.fromDisplayAlter,
         objectSpec.fromDisplayAlter,
         objectSpec.fromDisplay_alter,
         objectSpec.from_display_alter
      )

      return {
         plain: plain,
         html: html,
         latex: latex,
         fromDisplay: fromDisplay,
         fromDisplayAlter: fromDisplayAlter,
         nameId: firstString(overrides.nameId, getDisplayNameId(objectSpec)),
      }
   }

   function resolvePrimary(notation) {
      return normalizeDisplaySpec(notation.display, {
         plain: firstFunction(notation.displayPlain, notation.display_plain),
         html: firstFunction(notation.displayHtml, notation.display_html),
         latex: notation.latex,
         fromDisplay: firstFunction(notation.fromDisplay, notation.from_display),
         fromDisplayAlter: firstFunction(
            notation.fromDisplayAlter,
            notation.fromDisplay_alter,
            notation.from_display_alter
         ),
         nameId: firstString(notation.displayNameId, notation.display_name_id),
      })
   }

   function resolvedResult(normalized, requestedId, effectiveId, rawSpec) {
      normalized.requestedId = requestedId
      normalized.effectiveId = effectiveId
      normalized.isEquivalent = effectiveId !== undefined
      normalized.rawSpec = rawSpec
      return normalized
   }

   function resolveDisplay(notation, requestedId) {
      if (!notation || typeof notation !== 'object' || Array.isArray(notation)) {
         throw new TypeError('A notation object is required.')
      }

      var requested = typeof requestedId === 'string' && requestedId !== ''
         ? requestedId
         : undefined
      var equivalents = notation.display_equiv
      if (requested !== undefined && equivalents && typeof equivalents === 'object' &&
         !Array.isArray(equivalents) && hasOwn.call(equivalents, requested)) {
         return resolvedResult(
            normalizeDisplaySpec(equivalents[requested]),
            requested,
            requested,
            equivalents[requested]
         )
      }

      return resolvedResult(resolvePrimary(notation), requested, undefined, notation.display)
   }

   function listEquivalentDisplays(notation) {
      var equivalents = notation && notation.display_equiv
      if (!equivalents || typeof equivalents !== 'object' || Array.isArray(equivalents)) return []
      return Object.keys(equivalents).map(function (id) {
         var spec = equivalents[id]
         return { id: id, spec: spec, nameId: getDisplayNameId(spec) }
      })
   }

   function formatDisplayName(id, spec, translate, fallback) {
      var nameId = spec && typeof spec.nameId === 'string'
         ? spec.nameId
         : getDisplayNameId(spec)
      if (nameId && typeof translate === 'function') {
         try {
            var translated = translate(nameId)
            if (translated !== undefined && translated !== null && translated !== '' && translated !== nameId) {
               return String(translated)
            }
         } catch (error) {
            // Fall back to the stable display ID.
         }
      }
      if (fallback !== undefined && fallback !== null && fallback !== '') return String(fallback)
      return id === undefined || id === null ? '' : String(id)
   }

   return {
      resolveDisplay: resolveDisplay,
      listEquivalentDisplays: listEquivalentDisplays,
      getDisplayNameId: getDisplayNameId,
      formatDisplayName: formatDisplayName,
   }
})
