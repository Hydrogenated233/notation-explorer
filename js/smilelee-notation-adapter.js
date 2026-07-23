;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.SmileLeeNotationAdapter = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var hasOwn = Object.prototype.hasOwnProperty
   var generatorCoordinateCache = typeof WeakMap === 'function' ? new WeakMap() : undefined

   function firstFunction() {
      for (var index = 0; index < arguments.length; index++) {
         if (typeof arguments[index] === 'function') return arguments[index]
      }
      return undefined
   }

   function htmlToLatex(html) {
      html = String(html === undefined || html === null ? '' : html)
      var index = 0
      var escapes = {
         '\\': '\\textbackslash ',
         '{': '\\{',
         '}': '\\}',
         '^': '\\^{}',
         '_': '\\_',
         'ω': '\\omega ',
         'Ω': '\\Omega ',
         'ψ': '\\psi ',
      }

      function read(endTag) {
         var result = ''
         while (index < html.length) {
            if (endTag && html.slice(index, index + endTag.length) === endTag) {
               index += endTag.length
               break
            }
            if (html.slice(index, index + 5) === '<sub>') {
               index += 5
               result += '_{' + read('</sub>') + '}'
            } else if (html.slice(index, index + 5) === '<sup>') {
               index += 5
               result += '^{' + read('</sup>') + '}'
            } else {
               var character = html[index++]
               result += escapes[character] || character
            }
         }
         return result
      }

      return read()
   }

   function normalizeDisplay(spec) {
      var objectSpec = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {}
      var simple = typeof spec === 'function' ? spec : undefined
      var plain = firstFunction(objectSpec.plain, simple, objectSpec.html, objectSpec.latex)
      var html = firstFunction(objectSpec.html, simple, plain)
      if (!plain || !html) throw new TypeError('Upstream display spec must provide a display function.')
      return {
         plain: plain,
         html: html,
         latex: firstFunction(objectSpec.latex) || function (expression) {
            return htmlToLatex(html(expression))
         },
         fromDisplay: firstFunction(objectSpec.fromDisplay, objectSpec.from_display),
         fromDisplayAlter: firstFunction(
            objectSpec.fromDisplayAlter,
            objectSpec.fromDisplay_alter,
            objectSpec.from_display_alter
         ),
      }
   }

   function rgba(color, fallback) {
      if (!color || typeof color !== 'object') return fallback || 'rgba(0, 0, 0, 1)'
      var alpha = color.a === undefined ? 1 : color.a
      return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')'
   }

   function plainDiagramText(value, isHtml) {
      value = String(value === undefined || value === null ? '' : value)
      if (!isHtml) return value
      return value
         .replace(/<sub>/gi, '_')
         .replace(/<sup>/gi, '^')
         .replace(/<br\s*\/?\s*>/gi, ' ')
         .replace(/<[^>]*>/g, '')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&amp;/g, '&')
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'")
   }

   function pushText(actions, text, x, y, size, color, align, isHtml) {
      actions.push({ type: 'font', size: size || 14, font: 'Consolas' })
      actions.push({ type: 'fillStyle', value: rgba(color) })
      actions.push({
         type: 'text',
         value: plainDiagramText(text, isHtml),
         pos: { x: x, y: y },
         h_center: align === 'center',
         align: align || 'left',
      })
   }

   function convertDiagram(diagram) {
      if (diagram === undefined || diagram === null) return undefined
      if (!diagram || typeof diagram !== 'object') {
         throw new TypeError('Upstream draw_diagram() must return a diagram object or undefined.')
      }

      var actions = []
      var elements = Array.isArray(diagram.elements) ? diagram.elements : []
      var extraText = Array.isArray(diagram.extra_text)
         ? diagram.extra_text
         : (Array.isArray(diagram.extraText) ? diagram.extraText : [])

      elements.forEach(function (element) {
         if (!element || typeof element !== 'object') return
         if (element.type === 'circle') {
            if (element.stroke === false && element.fill === false) return
            actions.push({ type: 'lineWidth', value: element.width || 1 })
            actions.push({
               type: 'strokeStyle',
               value: element.stroke === false
                  ? 'rgba(0, 0, 0, 0)'
                  : rgba(element.stroke_color),
            })
            actions.push({ type: 'fillStyle', value: rgba(element.fill_color) })
            actions.push({
               type: 'circle',
               center: { x: element.x, y: element.y },
               radius: element.r,
               fill: element.fill !== false,
            })
         } else if (element.type === 'line') {
            if (element.stroke === false) return
            actions.push({ type: 'lineWidth', value: element.width || 1 })
            actions.push({ type: 'strokeStyle', value: rgba(element.stroke_color) })
            actions.push({
               type: 'line',
               start: { x: element.x1, y: element.y1 },
               end: { x: element.x2, y: element.y2 },
            })
         } else if (element.type === 'text') {
            if (element.fill === false) return
            pushText(
               actions,
               element.text,
               element.x,
               element.y,
               element.size,
               element.fill_color,
               element.align,
               false
            )
         } else {
            throw new TypeError('Unsupported upstream diagram element type: ' + element.type)
         }
      })

      extraText.forEach(function (text) {
         if (!text || typeof text !== 'object') return
         pushText(
            actions,
            text.text,
            text.x,
            text.y,
            text.size,
            text.color,
            text.align,
            text.display_html === true
         )
      })

      return {
         width: diagram.width,
         height: diagram.height,
         actions: actions,
      }
   }

   function diagramEquivalentId(raw, equivalentId) {
      if (
         raw &&
         typeof raw.id === 'string' &&
         raw.id.indexOf('omega-y-') === 0 &&
         equivalentId === 'DBMS_MN'
      ) {
         return "DBMS'"
      }
      return equivalentId
   }

   function createDrawDiagram(raw) {
      var control = raw && raw.draw_diagram
      if (!control || typeof control.draw_diagram !== 'function') return undefined
      return function (expression, equivalentId) {
         var defaults = control.default_data
         var data = defaults && typeof defaults === 'object' && !Array.isArray(defaults)
            ? Object.assign({}, defaults)
            : {}
         data.current_equiv = diagramEquivalentId(raw, equivalentId)
         return convertDiagram(control.draw_diagram(expression, data))
      }
   }

   function resolveBundle(bundle) {
      if (!bundle && typeof globalThis !== 'undefined') bundle = globalThis.SmileLeeNotationBundle
      if (!bundle || typeof bundle !== 'object' || !bundle.notationsById || !bundle.source) {
         throw new TypeError('A SmileLeeNotationBundle is required.')
      }
      return bundle
   }

   function provenanceFor(raw, bundle) {
      bundle = resolveBundle(bundle)
      return Object.freeze({
         repository: bundle.source.repository,
         commit: bundle.source.commit,
         notationId: raw.id,
      })
   }

   function adaptDefinition(raw, bundle) {
      bundle = resolveBundle(bundle)
      if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') {
         throw new TypeError('An upstream notation definition is required.')
      }
      var primary = normalizeDisplay(raw.display)
      var adapted = {
         id: raw.id,
         name: raw.name,
         simple_name: raw.simple_name,
         category_id: raw.category_id,
         display: primary.html,
         displayPlain: primary.plain,
         latex: primary.latex,
         able: raw.is_limit,
         compare: raw.compare,
         FS: raw.FS,
         init: function () {
            var expressions = raw.init()
            return expressions.map(function (expression, index) {
               var lowerBound = expressions[index + 1]
               if (lowerBound === undefined) lowerBound = expression
               return { expr: expression, low: [lowerBound], subitems: [] }
            })
         },
         provenance: provenanceFor(raw, bundle),
         upstreamDefinition: raw,
      }
      if (typeof raw.category_id === 'string') adapted.upstream_category_id = raw.category_id
      if (primary.fromDisplay) adapted.fromDisplay = primary.fromDisplay
      if (primary.fromDisplayAlter) adapted.fromDisplay_alter = primary.fromDisplayAlter
      if (typeof raw.FS_alter === 'function') adapted.FSalter = raw.FS_alter
      if (typeof raw.FS_short === 'function') adapted.FSShort = raw.FS_short
      if (raw.display_equiv && typeof raw.display_equiv === 'object') {
         adapted.display_equiv = Object.assign({}, raw.display_equiv)
      }
      if (typeof raw.credit_text_id === 'string') adapted.credit_text_id = raw.credit_text_id
      if (raw.debug !== undefined) adapted.debug = raw.debug
      var drawDiagram = createDrawDiagram(raw)
      if (drawDiagram) adapted.drawDiagram = drawDiagram
      return adapted
   }

   function findNotation(registry, id) {
      if (!registry) return undefined
      if (typeof registry.get === 'function') return registry.get(id)
      return Array.prototype.find.call(registry, function (notation) { return notation.id === id })
   }

   function decorateDefinition(target, raw, bundle, options) {
      options = options || {}
      if (!target || typeof target !== 'object') throw new TypeError('A target notation is required.')
      if (!raw || typeof raw !== 'object') throw new TypeError('An upstream notation is required.')

      target.provenance = provenanceFor(raw, bundle)
      if (options.metadata === false) return target

      if (typeof raw.credit_text_id === 'string') target.credit_text_id = raw.credit_text_id
      var equivalents = raw.display_equiv
      if (equivalents && typeof equivalents === 'object' && !Array.isArray(equivalents)) {
         target.display_equiv = Object.assign({}, equivalents, target.display_equiv || {})
      }

      var remoteDraw = createDrawDiagram(raw)
      if (remoteDraw && equivalents && Object.keys(equivalents).length) {
         var originalDraw = typeof target.drawDiagram === 'function' ? target.drawDiagram : undefined
         target.drawDiagram = function (expression, equivalentId) {
            if (typeof equivalentId === 'string' && hasOwn.call(equivalents, equivalentId)) {
               return remoteDraw(expression, equivalentId)
            }
            return originalDraw ? originalDraw.apply(this, arguments) : undefined
         }
      }
      return target
   }

   function rawById(bundle, id) {
      bundle = resolveBundle(bundle)
      var raw = bundle.notationsById[id]
      if (!raw) throw new Error('Unknown upstream notation id: ' + id)
      return raw
   }

   function generatorCategory(bundle, categoryId) {
      bundle = resolveBundle(bundle)
      if (typeof categoryId !== 'string' || categoryId.length === 0) {
         throw new TypeError('Generator category id must be a non-empty string.')
      }
      var category = bundle.categoriesById && bundle.categoriesById[categoryId]
      if (!category && Array.isArray(bundle.categories)) {
         category = bundle.categories.find(function (item) { return item.id === categoryId })
      }
      if (!category) throw new Error('Unknown upstream generator category: ' + categoryId)
      if (!category.generator || typeof category.generator.create !== 'function') {
         throw new Error('Upstream category is not generated: ' + categoryId)
      }
      return category
   }

   function attachGeneratorMetadata(adapted, category, index) {
      adapted.upstreamGenerator = Object.freeze({
         categoryId: category.id,
         index: index,
         start: category.generator.start,
         initial: category.generator.initial,
         category: category,
      })
      return adapted
   }

   function defaultGeneratorCoordinates(bundle) {
      if (generatorCoordinateCache && generatorCoordinateCache.has(bundle)) {
         return generatorCoordinateCache.get(bundle)
      }

      var coordinates = Object.create(null)
      var generatedIds = Array.isArray(bundle.generatedNotationIds)
         ? bundle.generatedNotationIds : []
      var generatedSet = Object.create(null)
      generatedIds.forEach(function(id) { generatedSet[id] = true })
      var categoryIds = Array.isArray(bundle.generatorCategoryIds)
         ? bundle.generatorCategoryIds
         : (bundle.categories || []).filter(function(category) {
            return category && category.generator
         }).map(function(category) { return category.id })

      categoryIds.forEach(function(categoryId) {
         var category = generatorCategory(bundle, categoryId)
         for (var index = category.generator.start; index <= category.generator.initial; index++) {
            var raw = typeof bundle.createGeneratedNotation === 'function'
               ? bundle.createGeneratedNotation(categoryId, index)
               : category.generator.create(index)
            if (raw && generatedSet[raw.id]) {
               coordinates[raw.id] = { category: category, index: index }
            }
         }
      })

      if (generatorCoordinateCache) generatorCoordinateCache.set(bundle, coordinates)
      return coordinates
   }

   function adaptBundledDefinition(raw, bundle) {
      var adapted = adaptDefinition(raw, bundle)
      var coordinate = defaultGeneratorCoordinates(bundle)[raw.id]
      return coordinate
         ? attachGeneratorMetadata(adapted, coordinate.category, coordinate.index)
         : adapted
   }

   function validateGeneratorIndex(category, index) {
      if (!Number.isSafeInteger(index)) {
         throw new TypeError('Generator index for ' + category.id + ' must be a safe integer.')
      }
      if (index < category.generator.start) {
         throw new RangeError(
            'Generator index for ' + category.id + ' must be at least ' +
            category.generator.start + '; received ' + index + '.'
         )
      }
   }

   function createGeneratedDefinition(categoryId, index, bundle) {
      bundle = resolveBundle(bundle)
      var category = generatorCategory(bundle, categoryId)
      validateGeneratorIndex(category, index)
      var raw = typeof bundle.createGeneratedNotation === 'function'
         ? bundle.createGeneratedNotation(categoryId, index)
         : category.generator.create(index)
      if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || raw.id.length === 0) {
         throw new Error(
            'Upstream generator ' + categoryId + ' returned an invalid notation for index ' + index + '.'
         )
      }
      if (raw.category_id !== categoryId) {
         throw new Error(
            'Upstream generator ' + categoryId + " returned notation '" + raw.id +
            "' in category '" + raw.category_id + "'."
         )
      }
      var adapted = adaptDefinition(raw, bundle)
      return attachGeneratorMetadata(adapted, category, index)
   }

   function installGenerated(registry, categoryId, index, bundle) {
      if (!registry || typeof registry.push !== 'function') {
         throw new TypeError('A writable notation registry is required.')
      }
      var adapted = createGeneratedDefinition(categoryId, index, bundle)
      if (findNotation(registry, adapted.id)) {
         throw new Error(
            'Generated notation id is already registered: ' + adapted.id +
            ' (' + categoryId + '[' + index + '])'
         )
      }
      registry.push(adapted)
      return adapted
   }

   function install(registry, specification, bundle) {
      bundle = resolveBundle(bundle)
      specification = specification || {}
      var addIds = specification.add || []
      var adapted = addIds.map(function (id) {
         if (findNotation(registry, id)) throw new Error('Notation id is already registered: ' + id)
         return adaptBundledDefinition(rawById(bundle, id), bundle)
      })
      if (adapted.length) registry.push.apply(registry, adapted)

      var decorated = []
      ;(specification.decorate || []).forEach(function (item) {
         var descriptor = typeof item === 'string'
            ? { targetId: item, sourceId: item }
            : item
         var target = findNotation(registry, descriptor.targetId)
         if (!target) throw new Error('Cannot decorate missing notation id: ' + descriptor.targetId)
         decorateDefinition(
            target,
            rawById(bundle, descriptor.sourceId || descriptor.targetId),
            bundle,
            { metadata: descriptor.metadata }
         )
         decorated.push(target)
      })

      return { added: adapted, decorated: decorated }
   }

   return Object.freeze({
      htmlToLatex: htmlToLatex,
      normalizeDisplay: normalizeDisplay,
      convertDiagram: convertDiagram,
      createDrawDiagram: createDrawDiagram,
      adaptDefinition: adaptDefinition,
      decorateDefinition: decorateDefinition,
      createGeneratedDefinition: createGeneratedDefinition,
      installGenerated: installGenerated,
      install: install,
   })
})
