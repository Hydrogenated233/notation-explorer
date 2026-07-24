;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationRegistryRuntime = api
   root.NotationRegistry = api.NotationRegistry
   root.NotationRegistryHub = api.NotationRegistryHub
   root.LocalNotationFileStore = api.LocalNotationFileStore
   root.NotationRegistryError = api.NotationRegistryError
   root.LocalNotationStorageError = api.LocalNotationStorageError
   api.installGlobals(root)
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var BUILTIN_OWNER = '@notation-explorer/builtin'
   var MAIN_FIELDS = ['id', 'name', 'display', 'able', 'compare', 'FS', 'init']
   var ANALYSIS_FIELDS = ['id', 'name', 'display', 'fromDisplay', 'FS']
   var FILE_STORE_VERSION = 1
   var DEFAULT_FILE_STORE_KEY = 'ne-local-notation-files'
   var DEFAULT_GENERATOR_MAXIMUM = 64
   var rewrittenGeneratorCoordinateCache = typeof WeakMap === 'function' ? new WeakMap() : undefined

   function hasOwn(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key)
   }

   function assertIdentifier(value, label) {
      if (typeof value !== 'string' || value.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_' + label.toUpperCase(),
            'A non-empty ' + label + ' is required.',
            { value: value }
         )
      }
      return value.trim()
   }

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

   function normalizeRewrittenDisplay(spec) {
      var objectSpec = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {}
      var simple = typeof spec === 'function' ? spec : undefined
      var plain = firstFunction(objectSpec.plain, simple, objectSpec.html, objectSpec.latex)
      var html = firstFunction(objectSpec.html, simple, plain)
      if (!plain || !html) {
         throw new NotationRegistryError(
            'INVALID_REWRITTEN_NOTATION',
            'An ne-rewritten display spec must provide a display function.'
         )
      }
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

   function pushDiagramText(actions, text, x, y, size, color, align, isHtml) {
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

   function convertRewrittenDiagram(diagram) {
      if (diagram === undefined || diagram === null) return undefined
      if (!diagram || typeof diagram !== 'object') {
         throw new TypeError('ne-rewritten draw_diagram() must return a diagram object or undefined.')
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
            pushDiagramText(
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
            throw new TypeError('Unsupported ne-rewritten diagram element type: ' + element.type)
         }
      })

      extraText.forEach(function (entry) {
         if (!entry || typeof entry !== 'object') return
         pushDiagramText(
            actions,
            entry.text,
            entry.x,
            entry.y,
            entry.size,
            entry.color,
            entry.align,
            entry.display_html === true
         )
      })

      return { width: diagram.width, height: diagram.height, actions: actions }
   }

   function rewrittenDiagramEquivalentId(raw, equivalentId) {
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

   function createRewrittenDrawDiagram(raw) {
      var control = raw && raw.draw_diagram
      if (!control || typeof control.draw_diagram !== 'function') return undefined
      return function (expression, equivalentId) {
         var defaults = control.default_data
         var data = defaults && typeof defaults === 'object' && !Array.isArray(defaults)
            ? Object.assign({}, defaults)
            : {}
         data.current_equiv = rewrittenDiagramEquivalentId(raw, equivalentId)
         return convertRewrittenDiagram(control.draw_diagram(expression, data))
      }
   }

   function isRewrittenDefinition(entry) {
      return !!entry &&
         typeof entry === 'object' &&
         !Array.isArray(entry) &&
         typeof entry.is_limit === 'function' &&
         typeof entry.able !== 'function'
   }

   function requireRewrittenBundle(bundle) {
      if (
         !bundle ||
         typeof bundle !== 'object' ||
         !bundle.notationsById ||
         typeof bundle.notationsById !== 'object' ||
         !bundle.source ||
         typeof bundle.source !== 'object'
      ) {
         throw new TypeError('An explicit ne-rewritten notation bundle is required.')
      }
      return bundle
   }

   function rewrittenProvenance(raw, bundle) {
      if (bundle === undefined) return undefined
      bundle = requireRewrittenBundle(bundle)
      return Object.freeze({
         repository: bundle.source.repository,
         commit: bundle.source.commit,
         notationId: raw.id,
      })
   }

   function normalizeRewrittenDefinition(raw, bundle) {
      if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || raw.id.length === 0) {
         throw new TypeError('An ne-rewritten notation definition is required.')
      }
      var primary = normalizeRewrittenDisplay(raw.display)
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
         upstreamDefinition: raw,
      }
      var provenance = rewrittenProvenance(raw, bundle)
      if (provenance) adapted.provenance = provenance
      if (typeof raw.category_id === 'string') adapted.upstream_category_id = raw.category_id
      if (primary.fromDisplay) adapted.fromDisplay = primary.fromDisplay
      if (primary.fromDisplayAlter) adapted.fromDisplay_alter = primary.fromDisplayAlter
      if (typeof raw.FS_alter === 'function') adapted.FSalter = raw.FS_alter
      if (typeof raw.FS_short === 'function') adapted.FSShort = raw.FS_short
      if (raw.display_equiv && typeof raw.display_equiv === 'object' && !Array.isArray(raw.display_equiv)) {
         adapted.display_equiv = Object.assign({}, raw.display_equiv)
      }
      if (typeof raw.credit_text_id === 'string') adapted.credit_text_id = raw.credit_text_id
      if (raw.debug !== undefined) adapted.debug = raw.debug
      var drawDiagram = createRewrittenDrawDiagram(raw)
      if (drawDiagram) adapted.drawDiagram = drawDiagram
      return adapted
   }

   function normalizeNotationRegistration(entry, bundle) {
      return isRewrittenDefinition(entry)
         ? normalizeRewrittenDefinition(entry, bundle)
         : entry
   }

   function decorateWithRewrittenDefinition(target, raw, bundle, options) {
      options = options || {}
      if (!target || typeof target !== 'object') throw new TypeError('A target notation is required.')
      if (!raw || typeof raw !== 'object') throw new TypeError('An ne-rewritten notation is required.')

      target.provenance = rewrittenProvenance(raw, requireRewrittenBundle(bundle))
      if (options.metadata === false) return target
      if (typeof raw.category_id === 'string') {
         target.upstream_category_id = raw.category_id
         if (typeof target.category_id !== 'string' || !target.category_id) {
            target.category_id = raw.category_id
         }
      }
      if (typeof raw.credit_text_id === 'string') target.credit_text_id = raw.credit_text_id
      var equivalents = raw.display_equiv
      if (equivalents && typeof equivalents === 'object' && !Array.isArray(equivalents)) {
         target.display_equiv = Object.assign({}, equivalents, target.display_equiv || {})
      }

      var remoteDraw = createRewrittenDrawDiagram(raw)
      if (remoteDraw && equivalents && Object.keys(equivalents).length) {
         var originalDraw = typeof target.drawDiagram === 'function' ? target.drawDiagram : undefined
         target.drawDiagram = function (expression, equivalentId) {
            if (typeof equivalentId === 'string' && hasOwn(equivalents, equivalentId)) {
               return remoteDraw(expression, equivalentId)
            }
            return originalDraw ? originalDraw.apply(this, arguments) : undefined
         }
      }
      return target
   }

   function rewrittenRawById(bundle, id) {
      bundle = requireRewrittenBundle(bundle)
      var raw = bundle.notationsById[id]
      if (!raw) throw new Error('Unknown ne-rewritten notation id: ' + id)
      return raw
   }

   function rewrittenCategory(bundle, categoryId) {
      bundle = requireRewrittenBundle(bundle)
      if (typeof categoryId !== 'string' || categoryId.length === 0) {
         throw new TypeError('Generator category id must be a non-empty string.')
      }
      var category = bundle.categoriesById && bundle.categoriesById[categoryId]
      if (!category && Array.isArray(bundle.categories)) {
         category = bundle.categories.find(function (item) { return item && item.id === categoryId })
      }
      if (!category) throw new Error('Unknown ne-rewritten generator category: ' + categoryId)
      if (!category.generator || typeof category.generator.create !== 'function') {
         throw new Error('ne-rewritten category is not generated: ' + categoryId)
      }
      return category
   }

   function rewrittenCategoryPath(bundle, categoryId) {
      var path = []
      var seen = Object.create(null)
      var current = categoryId
      while (current) {
         if (seen[current]) return []
         seen[current] = true
         var category = bundle.categoriesById && bundle.categoriesById[current]
         if (!category && Array.isArray(bundle.categories)) {
            category = bundle.categories.find(function (item) { return item && item.id === current })
         }
         if (!category) return []
         path.unshift(category.simple_name || category.name || category.id)
         current = category.parent_id
      }
      return path
   }

   function rewrittenCategoryDescriptor(bundle, category) {
      var descriptor = {
         id: category.id,
         name: category.name || category.simple_name || category.id,
         simple_name: category.simple_name || category.name || category.id,
         parent_id: category.parent_id,
         path: rewrittenCategoryPath(bundle, category.id),
      }
      if (category.origin !== undefined) descriptor.origin = category.origin
      if (category.help !== undefined) descriptor.help = category.help
      return descriptor
   }

   function registerRewrittenCategoryHierarchy(registry, bundle, categoryId, seen) {
      seen = seen || Object.create(null)
      if (seen[categoryId]) return
      seen[categoryId] = true
      var category = bundle.categoriesById && bundle.categoriesById[categoryId]
      if (!category && Array.isArray(bundle.categories)) {
         category = bundle.categories.find(function (item) { return item && item.id === categoryId })
      }
      if (!category) return
      if (category.parent_id) {
         registerRewrittenCategoryHierarchy(registry, bundle, category.parent_id, seen)
      }
      registry.registerCategory(rewrittenCategoryDescriptor(bundle, category))
   }

   function registerRewrittenBundleCategories(registry, bundle) {
      bundle = requireRewrittenBundle(bundle)
      var categories = Array.isArray(bundle.categories) ? bundle.categories : []
      var seen = Object.create(null)
      categories.forEach(function (category) {
         if (category && typeof category.id === 'string') {
            registerRewrittenCategoryHierarchy(registry, bundle, category.id, seen)
         }
      })
      return typeof registry.categories === 'function' ? registry.categories() : categories.slice()
   }

   function attachRewrittenGeneratorMetadata(adapted, category, index) {
      adapted.upstreamGenerator = Object.freeze({
         categoryId: category.id,
         index: index,
         start: category.generator.start,
         initial: category.generator.initial,
         category: category,
      })
      return adapted
   }

   function rewrittenGeneratorCoordinates(bundle) {
      bundle = requireRewrittenBundle(bundle)
      if (rewrittenGeneratorCoordinateCache && rewrittenGeneratorCoordinateCache.has(bundle)) {
         return rewrittenGeneratorCoordinateCache.get(bundle)
      }
      var coordinates = Object.create(null)
      var generatedIds = Array.isArray(bundle.generatedNotationIds)
         ? bundle.generatedNotationIds : []
      var generatedSet = Object.create(null)
      generatedIds.forEach(function (id) { generatedSet[id] = true })
      var categoryIds = Array.isArray(bundle.generatorCategoryIds)
         ? bundle.generatorCategoryIds
         : (bundle.categories || []).filter(function (category) {
            return category && category.generator
         }).map(function (category) { return category.id })

      categoryIds.forEach(function (categoryId) {
         var category = rewrittenCategory(bundle, categoryId)
         for (var index = category.generator.start; index <= category.generator.initial; index++) {
            var raw = typeof bundle.createGeneratedNotation === 'function'
               ? bundle.createGeneratedNotation(categoryId, index)
               : category.generator.create(index)
            if (raw && (generatedSet[raw.id] || (!generatedIds.length && bundle.notationsById[raw.id]))) {
               coordinates[raw.id] = { category: category, index: index }
            }
         }
      })
      if (rewrittenGeneratorCoordinateCache) rewrittenGeneratorCoordinateCache.set(bundle, coordinates)
      return coordinates
   }

   function normalizeBundledRewrittenDefinition(raw, bundle) {
      var adapted = normalizeRewrittenDefinition(raw, bundle)
      var coordinate = rewrittenGeneratorCoordinates(bundle)[raw.id]
      return coordinate
         ? attachRewrittenGeneratorMetadata(adapted, coordinate.category, coordinate.index)
         : adapted
   }

   function createBundledGeneratedDefinition(categoryId, index, bundle) {
      bundle = requireRewrittenBundle(bundle)
      var category = rewrittenCategory(bundle, categoryId)
      if (!Number.isSafeInteger(index)) {
         throw new TypeError('Generator index for ' + category.id + ' must be a safe integer.')
      }
      if (index < category.generator.start) {
         throw new RangeError(
            'Generator index for ' + category.id + ' must be at least ' +
            category.generator.start + '; received ' + index + '.'
         )
      }
      var raw = typeof bundle.createGeneratedNotation === 'function'
         ? bundle.createGeneratedNotation(categoryId, index)
         : category.generator.create(index)
      if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || raw.id.length === 0) {
         throw new Error(
            'ne-rewritten generator ' + categoryId + ' returned an invalid notation for index ' + index + '.'
         )
      }
      if (raw.category_id !== categoryId) {
         throw new Error(
            'ne-rewritten generator ' + categoryId + " returned notation '" + raw.id +
            "' in category '" + raw.category_id + "'."
         )
      }
      return attachRewrittenGeneratorMetadata(
         normalizeRewrittenDefinition(raw, bundle),
         category,
         index
      )
   }

   function registerBundledGenerator(registry, categoryId, bundle, options) {
      options = options || {}
      bundle = requireRewrittenBundle(bundle)
      var category = rewrittenCategory(bundle, categoryId)
      registerRewrittenCategoryHierarchy(registry, bundle, category.id)
      var create = typeof options.create === 'function'
         ? options.create
         : function (index) { return createBundledGeneratedDefinition(category.id, index, bundle) }
      var spec = {
         id: category.id,
         categoryId: category.id,
         category: rewrittenCategoryDescriptor(bundle, category),
         start: category.generator.start,
         initial: category.generator.initial,
         maximum: Number.isSafeInteger(options.maximum)
            ? options.maximum
            : DEFAULT_GENERATOR_MAXIMUM,
         create: create,
      }
      var resolver = options.resolveId || options.idForIndex || options.mapId
      if (typeof resolver === 'function') spec.resolveId = resolver
      if (options.owner !== undefined) spec.owner = options.owner
      return registry.registerGenerator(spec, bundle)
   }

   function installRewrittenBundleInto(registry, specification, bundle) {
      bundle = requireRewrittenBundle(bundle)
      specification = specification || {}
      if (!registry || typeof registry.registerNotation !== 'function' ||
         typeof registry.registerCategory !== 'function' ||
         typeof registry.registerGenerator !== 'function') {
         throw new TypeError('A notation registry with the native rewritten API is required.')
      }
      registerRewrittenBundleCategories(registry, bundle)

      var adapted = (specification.add || []).map(function (id) {
         if (registry.get(id)) throw new Error('Notation id is already registered: ' + id)
         var notation = normalizeBundledRewrittenDefinition(rewrittenRawById(bundle, id), bundle)
         return registry.registerNotation(notation)
      })

      var generators = []
      var requestedGeneratorIds = Object.create(null)
      ;(specification.generators || []).forEach(function (item) {
         var descriptor = typeof item === 'string' ? { categoryId: item } : (item || {})
         var categoryId = descriptor.categoryId || descriptor.id
         if (typeof categoryId !== 'string' || !categoryId) {
            throw new TypeError('An ne-rewritten generator registration requires a category ID.')
         }
         requestedGeneratorIds[categoryId] = true
         generators.push(registerBundledGenerator(registry, categoryId, bundle, descriptor))
      })

      var inferredGeneratorIds = Object.create(null)
      adapted.forEach(function (notation) {
         var info = notation && notation.upstreamGenerator
         if (info && typeof info.categoryId === 'string') inferredGeneratorIds[info.categoryId] = true
      })
      Object.keys(inferredGeneratorIds).forEach(function (categoryId) {
         if (requestedGeneratorIds[categoryId]) return
         generators.push(registerBundledGenerator(registry, categoryId, bundle, {}))
      })

      var decorated = []
      ;(specification.decorate || []).forEach(function (item) {
         var descriptor = typeof item === 'string'
            ? { targetId: item, sourceId: item }
            : (item || {})
         var target = registry.get(descriptor.targetId)
         if (!target) throw new Error('Cannot decorate missing notation id: ' + descriptor.targetId)
         if (
            registry._owner !== undefined &&
            typeof registry.ownerOf === 'function' &&
            registry.ownerOf(target) !== registry._owner
         ) {
            throw new NotationRegistryError(
               'OWNER_MISMATCH',
               'A local notation file cannot decorate a notation owned by another file.',
               {
                  id: descriptor.targetId,
                  expectedOwner: registry._owner,
                  actualOwner: registry.ownerOf(target),
               }
            )
         }
         decorateWithRewrittenDefinition(
            target,
            rewrittenRawById(bundle, descriptor.sourceId || descriptor.targetId),
            bundle,
            { metadata: descriptor.metadata }
         )
         decorated.push(target)
      })
      return { added: adapted, decorated: decorated, generators: generators }
   }

   function normalizeCategory(category, generator) {
      category = category || {}
      var id = category.id || category.categoryId
      if (!id && generator) id = generator.id || generator.categoryId
      id = assertIdentifier(id, 'category ID')
      var name = category.name || category.simple_name || category.simpleName || id
      name = assertIdentifier(name, 'category name')
      var parentId = category.parent_id
      if (parentId === undefined) parentId = category.parentId
      if (parentId !== undefined && parentId !== null && parentId !== '') {
         parentId = assertIdentifier(parentId, 'parent category ID')
      } else {
         parentId = undefined
      }
      var normalized = {
         id: id,
         name: name,
         simple_name: category.simple_name || category.simpleName || name,
         parent_id: parentId,
      }
      if (Array.isArray(category.path)) normalized.path = category.path.slice()
      if (category.origin !== undefined) normalized.origin = category.origin
      if (category.help !== undefined) normalized.help = category.help
      if (category.generator && typeof category.generator === 'object') {
         normalized.generator = category.generator
      } else if (generator) {
         normalized.generator = generator
      }
      return normalized
   }

   function generatorSpecFromCategory(category, normalized) {
      var generator = category && category.generator
      if (!generator || typeof generator.create !== 'function') return undefined
      var spec = {
         id: normalized.id,
         categoryId: normalized.id,
         category: normalized,
         start: generator.start,
         initial: generator.initial,
         maximum: generator.maximum,
         create: generator.create,
      }
      var resolver = generator.resolveId || generator.idForIndex || generator.mapId
      if (typeof resolver === 'function') spec.resolveId = resolver
      return spec
   }

   function normalizeGenerator(spec, bundle) {
      spec = spec || {}
      var source = spec.generator && typeof spec.generator === 'object'
         ? Object.assign({}, spec.generator, spec)
         : spec
      var id = source.id || source.categoryId || (source.category && (source.category.id || source.category.categoryId))
      id = assertIdentifier(id, 'generator ID')
      var start = source.start
      var initial = source.initial
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(initial) || initial < start) {
         throw new NotationRegistryError(
            'INVALID_GENERATOR',
            'Generator "' + id + '" requires safe integer start/initial values with start <= initial.',
            { id: id, start: start, initial: initial }
         )
      }
      var maximum = source.maximum
      if (maximum === undefined) maximum = Math.max(initial, DEFAULT_GENERATOR_MAXIMUM)
      if (!Number.isSafeInteger(maximum) || maximum < initial) {
         throw new NotationRegistryError(
            'INVALID_GENERATOR',
            'Generator "' + id + '" maximum must be a safe integer >= initial.',
            { id: id, maximum: maximum, initial: initial }
         )
      }
      if (typeof source.create !== 'function') {
         throw new NotationRegistryError(
            'INVALID_GENERATOR',
            'Generator "' + id + '" must provide a create(index) function.',
            { id: id }
         )
      }
      var resolveId = source.resolveId || source.idForIndex || source.mapId
      if (resolveId !== undefined && typeof resolveId !== 'function') {
         throw new NotationRegistryError(
            'INVALID_GENERATOR',
            'Generator "' + id + '" resolveId/idForIndex/mapId must be a function.',
            { id: id }
         )
      }
      var rawCreate = source.create
      var generatorBundle = bundle === undefined ? source.bundle : bundle
      return {
         id: id,
         start: start,
         initial: initial,
         maximum: maximum,
         create: function (index) {
            var raw = rawCreate.call(source, index)
            if (
               isRewrittenDefinition(raw) &&
               typeof raw.category_id === 'string' &&
               raw.category_id !== id
            ) {
               throw new NotationRegistryError(
                  'INVALID_GENERATED_NOTATION',
                  'Generator "' + id + '" returned notation "' + raw.id +
                     '" in category "' + raw.category_id + '".',
                  { id: id, index: index, notationId: raw.id, categoryId: raw.category_id }
               )
            }
            return normalizeNotationRegistration(raw, generatorBundle)
         },
         rawCreate: rawCreate,
         bundle: generatorBundle,
         resolveId: resolveId,
         owner: source.owner,
      }
   }

   function NotationRegistryError(code, message, details, cause) {
      Error.call(this, message)
      this.name = 'NotationRegistryError'
      this.code = code
      this.message = message
      this.details = details || {}
      if (cause !== undefined) this.cause = cause
      if (Error.captureStackTrace) Error.captureStackTrace(this, NotationRegistryError)
   }
   NotationRegistryError.prototype = Object.create(Error.prototype)
   NotationRegistryError.prototype.constructor = NotationRegistryError

   function LocalNotationStorageError(code, message, cause) {
      Error.call(this, message)
      this.name = 'LocalNotationStorageError'
      this.code = code
      this.message = message
      if (cause !== undefined) this.cause = cause
      if (Error.captureStackTrace) Error.captureStackTrace(this, LocalNotationStorageError)
   }
   LocalNotationStorageError.prototype = Object.create(Error.prototype)
   LocalNotationStorageError.prototype.constructor = LocalNotationStorageError

   function assertOwner(owner) {
      if (typeof owner !== 'string' || owner.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_OWNER',
            'A non-empty owner ID is required for notation registrations.',
            { owner: owner }
         )
      }
   }

   function validateEntry(namespace, requiredFields, entry) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Every ' + namespace + ' registration must be an object.',
            { namespace: namespace }
         )
      }

      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Every ' + namespace + ' registration must have a non-empty string ID.',
            { namespace: namespace, field: 'id' }
         )
      }

      if (typeof entry.name !== 'string' || entry.name.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Notation "' + entry.id + '" must have a non-empty string name.',
            { namespace: namespace, id: entry.id, field: 'name' }
         )
      }

      for (var i = 0; i < requiredFields.length; i++) {
         var field = requiredFields[i]
         if (field === 'id' || field === 'name') continue
         if (typeof entry[field] !== 'function') {
            throw new NotationRegistryError(
               'INVALID_ENTRY',
               'Notation "' + entry.id + '" must provide a ' + field + ' function.',
               { namespace: namespace, id: entry.id, field: field }
            )
         }
      }

      return entry
   }

   function validateMainInitialData(entry) {
      var initial
      try {
         initial = entry.init()
      } catch (error) {
         throw new NotationRegistryError(
            'INVALID_INIT',
            'Notation "' + entry.id + '" failed while creating its initial dataset: ' +
               (error && error.message ? error.message : 'unknown error'),
            { namespace: 'main', id: entry.id },
            error
         )
      }

      if (!Array.isArray(initial)) {
         throw new NotationRegistryError(
            'INVALID_INIT',
            'Notation "' + entry.id + '" init() must return an array.',
            { namespace: 'main', id: entry.id }
         )
      }
      for (var i = 0; i < initial.length; i++) {
         var item = initial[i]
         if (!item || typeof item !== 'object' || !Array.isArray(item.low) || item.low.length === 0) {
            throw new NotationRegistryError(
               'INVALID_INIT',
               'Notation "' + entry.id + '" init() item ' + i + ' must contain a non-empty low array.',
               { namespace: 'main', id: entry.id, itemIndex: i }
            )
         }
      }
      return initial
   }

   class NotationRegistry extends Array {
      constructor(namespace, requiredFields, options) {
         super()
         options = options || {}
         Object.defineProperties(this, {
            _namespace: { value: namespace || 'main', enumerable: false },
            _requiredFields: {
               value: (requiredFields || MAIN_FIELDS).slice(),
               enumerable: false
            },
            _defaultOwner: {
               value: options.defaultOwner || BUILTIN_OWNER,
               enumerable: false
            },
            _hub: {
               value: options.hub,
               writable: true,
               enumerable: false
            },
            _ownerByEntry: {
               value: new WeakMap(),
               writable: true,
               enumerable: false
            }
         })
      }

      static get [Symbol.species]() {
         return Array
      }

      get namespace() {
         return this._namespace
      }

      push() {
         var entries = Array.prototype.slice.call(arguments)
         this.appendOwned(this._defaultOwner, entries)
         return this.length
      }

      // Canonical API aliases. Legacy notation files may continue to use push().
      registerNotation(entry, bundle) {
         entry = normalizeNotationRegistration(entry, bundle)
         return this.appendOwned(this._defaultOwner, [entry])[0]
      }

      register_notation(entry, bundle) {
         return this.registerNotation(entry, bundle)
      }

      registerCategory(category, bundle) {
         var hub = this._ensureHub()
         var registrySnapshot = this._snapshotPairs()
         var metadataSnapshot = hub._snapshotMetadata()
         try {
            var registered = hub.registerCategory(category, { owner: this._defaultOwner })
            var generatorSpec = generatorSpecFromCategory(category, registered)
            if (generatorSpec) this.registerGenerator(generatorSpec, bundle)
            return registered
         } catch (error) {
            this._restorePairs(registrySnapshot)
            hub._restoreMetadata(metadataSnapshot)
            throw error
         }
      }

      register_category(category, bundle) {
         return this.registerCategory(category, bundle)
      }

      registerGenerator(spec, bundle) {
         var hub = this._ensureHub()
         var registrySnapshot = this._snapshotPairs()
         var metadataSnapshot = hub._snapshotMetadata()
         try {
            return hub.registerGenerator(spec, {
               owner: this._defaultOwner,
               registry: this,
               bundle: bundle,
            })
         } catch (error) {
            this._restorePairs(registrySnapshot)
            hub._restoreMetadata(metadataSnapshot)
            throw error
         }
      }

      installRewrittenBundle(specification, bundle) {
         return installRewrittenBundleInto(this, specification, bundle)
      }

      initGenerator(category, bundle) {
         return this._ensureHub().initGenerator(category, { registry: this, bundle: bundle })
      }

      init_generator(category, bundle) {
         return this.initGenerator(category, bundle)
      }

      generatorDefinition(id) {
         return this._hub ? this._hub.generatorDefinition(id) : undefined
      }

      generatorDefinitions() {
         return this._hub ? this._hub.generatorDefinitions() : []
      }

      generatorCategoryIds() {
         return this._hub ? this._hub.generatorCategoryIds() : []
      }

      generatorCurrent(id) {
         return this._hub ? this._hub.generatorCurrent(id) : 0
      }

      generatorMaximum(id) {
         return this._hub ? this._hub.generatorMaximum(id) : 0
      }

      generatorCanIncrement(id) {
         return this._hub ? this._hub.generatorCanIncrement(id) : false
      }

      generatorCanDecrement(id) {
         return this._hub ? this._hub.generatorCanDecrement(id) : false
      }

      generatorAdd(id) {
         return this._hub ? this._hub.generatorAdd(id) : undefined
      }

      generatorIncrement(id) {
         return this.generatorAdd(id)
      }

      generatorRemove(id) {
         return this._hub ? this._hub.generatorRemove(id) : undefined
      }

      generatorDecrement(id) {
         return this.generatorRemove(id)
      }

      materializeGenerator(id, index) {
         return this._ensureHub().materializeGenerator(id, index, { registry: this })
      }

      setGeneratorState(state) {
         if (this._hub) this._hub.setGeneratorState(state)
      }

      getGeneratorState() {
         return this._hub ? this._hub.getGeneratorState() : {}
      }

      categories() {
         return this._hub ? this._hub.categories() : []
      }

      _ensureHub() {
         if (!this._hub) this._hub = new NotationRegistryHub({ main: this })
         return this._hub
      }

      appendOwned(owner, entries) {
         assertOwner(owner)
         entries = Array.isArray(entries) ? entries.slice() : [entries]
         this._validateBatch(entries)

         var known = new Set(this.map(function (entry) { return entry.id }))
         for (var i = 0; i < entries.length; i++) {
            if (known.has(entries[i].id)) {
               throw this._duplicateError(entries[i].id, this.ownerOf(entries[i].id), owner)
            }
            known.add(entries[i].id)
         }

         for (var j = 0; j < entries.length; j++) {
            Array.prototype.push.call(this, entries[j])
            this._ownerByEntry.set(entries[j], owner)
         }
         return entries.slice()
      }

      get(id) {
         return this.find(function (entry) { return entry.id === id })
      }

      ownerOf(id) {
         var entry = typeof id === 'string' ? this.get(id) : id
         return entry ? this._ownerByEntry.get(entry) : undefined
      }

      entriesForOwner(owner) {
         var registry = this
         return this.filter(function (entry) {
            return registry._ownerByEntry.get(entry) === owner
         })
      }

      idsForOwner(owner) {
         return this.entriesForOwner(owner).map(function (entry) { return entry.id })
      }

      unregister(id, expectedOwner) {
         var index = this.findIndex(function (entry) { return entry.id === id })
         if (index === -1) return undefined

         var entry = this[index]
         var actualOwner = this._ownerByEntry.get(entry)
         if (expectedOwner !== undefined && actualOwner !== expectedOwner) {
            throw new NotationRegistryError(
               'OWNER_MISMATCH',
               'Cannot unregister the ' + this._namespace + ' notation "' + id +
                  '": expected owner "' + expectedOwner + '", but it is owned by "' + actualOwner + '".',
               {
                  namespace: this._namespace,
                  id: id,
                  expectedOwner: expectedOwner,
                  actualOwner: actualOwner
               }
            )
         }

         Array.prototype.splice.call(this, index, 1)
         this._ownerByEntry.delete(entry)
         return entry
      }

      removeOwner(owner) {
         var plan = this._planOwnerReplacement(owner, [])
         this._applyPlan(plan)
         return plan.removed.slice()
      }

      replaceOwner(owner, entries) {
         var plan = this._planOwnerReplacement(owner, entries)
         this._applyPlan(plan)
         return {
            owner: owner,
            namespace: this._namespace,
            removed: plan.removed.slice(),
            added: plan.added.slice()
         }
      }

      validate(entry) {
         return validateEntry(this._namespace, this._requiredFields, entry)
      }

      _validateBatch(entries) {
         var ids = new Set()
         for (var i = 0; i < entries.length; i++) {
            this.validate(entries[i])
            if (ids.has(entries[i].id)) {
               throw this._duplicateError(entries[i].id, undefined, undefined)
            }
            ids.add(entries[i].id)
         }
      }

      _duplicateError(id, existingOwner, attemptedOwner) {
         return new NotationRegistryError(
            'DUPLICATE_ID',
            'The ' + this._namespace + ' notation ID "' + id + '" is already registered.',
            {
               namespace: this._namespace,
               id: id,
               existingOwner: existingOwner,
               attemptedOwner: attemptedOwner
            }
         )
      }

      _snapshotPairs() {
         var registry = this
         return this.map(function (entry) {
            return { entry: entry, owner: registry._ownerByEntry.get(entry) }
         })
      }

      _planOwnerReplacement(owner, entries, options) {
         assertOwner(owner)
         options = options || {}
         entries = Array.isArray(entries) ? entries.slice() : [entries]
         this._validateBatch(entries)

         var current = this._snapshotPairs()
         var insertionIndex = current.length
         var removed = []
         var remaining = []

         for (var i = 0; i < current.length; i++) {
            if (current[i].owner === owner) {
               if (insertionIndex === current.length) insertionIndex = remaining.length
               removed.push(current[i].entry)
            } else {
               remaining.push(current[i])
            }
         }

         if (options.insertionIndex !== undefined) {
            insertionIndex = Math.max(0, Math.min(remaining.length, options.insertionIndex))
         }

         var occupied = new Map()
         for (var j = 0; j < remaining.length; j++) {
            occupied.set(remaining[j].entry.id, remaining[j].owner)
         }
         for (var k = 0; k < entries.length; k++) {
            if (occupied.has(entries[k].id)) {
               throw this._duplicateError(entries[k].id, occupied.get(entries[k].id), owner)
            }
         }

         var additions = entries.map(function (entry) {
            return { entry: entry, owner: owner }
         })
         remaining.splice.apply(remaining, [insertionIndex, 0].concat(additions))

         return {
            pairs: remaining,
            removed: removed,
            added: entries.slice()
         }
      }

      _applyPlan(plan) {
         this._restorePairs(plan.pairs)
      }

      _restorePairs(pairs) {
         Array.prototype.splice.call(this, 0, this.length)
         this._ownerByEntry = new WeakMap()
         for (var i = 0; i < pairs.length; i++) {
            Array.prototype.push.call(this, pairs[i].entry)
            this._ownerByEntry.set(pairs[i].entry, pairs[i].owner)
         }
      }
   }

   class StagedRegistry extends Array {
      constructor(liveRegistry, owner, transaction) {
         super()
         Object.defineProperties(this, {
            _liveRegistry: { value: liveRegistry, enumerable: false },
            _owner: { value: owner, enumerable: false },
            _transaction: { value: transaction, enumerable: false },
            _staged: { value: [], enumerable: false },
            _stagedCategories: { value: [], enumerable: false },
            _stagedGenerators: { value: [], enumerable: false },
            _hub: { value: liveRegistry._hub, enumerable: false },
            _locked: { value: false, writable: true, enumerable: false }
         })

         for (var i = 0; i < liveRegistry.length; i++) {
            if (liveRegistry.ownerOf(liveRegistry[i]) === BUILTIN_OWNER) {
               Array.prototype.push.call(this, liveRegistry[i])
            }
         }
      }

      static get [Symbol.species]() {
         return Array
      }

      _generatorMode() {
         var state = this._transaction && this._transaction.state
         if (state === 'rolled_back') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'Generator controls cannot be used after the notation transaction was rolled back.',
               { owner: this._owner, namespace: this._liveRegistry.namespace, state: state }
            )
         }
         return state === 'committed' ? 'live' : 'staged'
      }

      _assertStagedGeneratorMutable() {
         if (this._locked) {
            throw new NotationRegistryError(
               'TRANSACTION_PREPARED',
               'Generator registrations cannot be changed after transaction validation.',
               { owner: this._owner, namespace: this._liveRegistry.namespace }
            )
         }
      }

      push() {
         if (this._locked) {
            throw new NotationRegistryError(
               'TRANSACTION_PREPARED',
               'Registrations cannot be changed after transaction validation.',
               { owner: this._owner, namespace: this._liveRegistry.namespace }
            )
         }
         var entries = Array.prototype.slice.call(arguments)
         for (var i = 0; i < entries.length; i++) {
            this._staged.push(entries[i])
            Array.prototype.push.call(this, entries[i])
         }
         return this.length
      }

      appendOwned(owner, entries) {
         if (owner !== this._owner) {
            throw new NotationRegistryError(
               'OWNER_MISMATCH',
               'A staged notation registry can only register entries for its transaction owner.',
               { expectedOwner: this._owner, owner: owner }
            )
         }
         entries = Array.isArray(entries) ? entries : [entries]
         for (var i = 0; i < entries.length; i++) this.push(entries[i])
         return entries.slice()
      }

      registerNotation(entry, bundle) {
         entry = normalizeNotationRegistration(entry, bundle)
         return this.appendOwned(this._owner, [entry])[0]
      }

      register_notation(entry, bundle) {
         return this.registerNotation(entry, bundle)
      }

      registerCategory(category, bundle) {
         var normalized = this._stageCategory(category)
         var generatorSpec = generatorSpecFromCategory(category, normalized)
         if (generatorSpec) {
            var existing = this._stagedGenerators.find(function (item) {
               return item.family.id === normalized.id
            })
            if (!existing) this.registerGenerator(generatorSpec, bundle)
         }
         return normalized
      }

      _stageCategory(category) {
         var normalized = normalizeCategory(category)
         var existing = this._stagedCategories.find(function (item) { return item.id === normalized.id })
         if (existing) return existing
         if (this._hub && this._hub.getCategory(normalized.id)) {
            var liveOwner = this._hub.categoryOwnerOf(normalized.id)
            if (liveOwner === BUILTIN_OWNER) {
               return this._hub.getCategory(normalized.id)
            }
            if (liveOwner === this._owner) {
               this._stagedCategories.push(normalized)
               return normalized
            }
            throw new NotationRegistryError(
               'DUPLICATE_CATEGORY',
               'The notation category ID "' + normalized.id + '" is owned by another local file.',
               { id: normalized.id, existingOwner: liveOwner, attemptedOwner: this._owner }
            )
         }
         this._stagedCategories.push(normalized)
         return normalized
      }

      register_category(category, bundle) {
         return this.registerCategory(category, bundle)
      }

      registerGenerator(spec, bundle) {
         var generator = normalizeGenerator(spec, bundle)
         var existingFamily = this._hub && this._hub.generatorDefinition(generator.id)
         if (existingFamily && existingFamily.owner !== this._owner) {
            throw new NotationRegistryError(
               'DUPLICATE_GENERATOR',
               'The notation generator ID "' + generator.id + '" is owned by "' + existingFamily.owner + '".',
               { id: generator.id, existingOwner: existingFamily.owner, attemptedOwner: this._owner }
            )
         }
         var stagedFamily = this._stagedGenerators.find(function (entry) {
            return entry.family.id === generator.id
         })
         if (stagedFamily) {
            throw new NotationRegistryError(
               'DUPLICATE_GENERATOR',
               'The notation generator ID "' + generator.id + '" is registered more than once in this file.',
               { id: generator.id, attemptedOwner: this._owner }
            )
         }
         var categoryInput = Object.assign({}, spec && spec.category || {})
         if (!categoryInput.id) categoryInput.id = generator.id
         if (!categoryInput.name) categoryInput.name = spec.name || spec.simple_name || spec.simpleName || generator.id
         if (categoryInput.parent_id === undefined && spec.parent_id !== undefined) categoryInput.parent_id = spec.parent_id
         if (categoryInput.parentId === undefined && spec.parentId !== undefined) categoryInput.parentId = spec.parentId
         if (!categoryInput.path && Array.isArray(spec.path)) categoryInput.path = spec.path.slice()
         var category = this._stageCategory(categoryInput)
         var family = {
            id: generator.id,
            categoryId: generator.id,
            category: category,
            owner: this._owner,
            start: generator.start,
            initial: generator.initial,
            maximum: generator.maximum,
            create: generator.create,
            rawCreate: generator.rawCreate,
            bundle: generator.bundle,
            resolveId: generator.resolveId,
            entries: Object.create(null),
            created: Object.create(null),
            currentIndex: generator.initial,
         }
         var self = this
         for (var index = family.start; index <= family.initial; index++) {
            var raw = this._hub._createGenerated(family, index)
            var decorated = this._hub._decorateGenerated(raw, family, index)
            var existingEntry = this.get(decorated.liveId)
            if (existingEntry) {
               var existingOwner = this.ownerOf(existingEntry)
               var existingInfo = existingEntry.generatedFamily || existingEntry.generatorFamily || existingEntry.upstreamGenerator
               if (
                  existingOwner !== this._owner ||
                  !existingInfo ||
                  existingInfo.categoryId !== family.categoryId ||
                  existingInfo.index !== index
               ) {
                  throw new NotationRegistryError(
                     'GENERATOR_ID_CONFLICT',
                     'Generated notation ID "' + decorated.liveId + '" conflicts with an existing registration.',
                     {
                        id: decorated.liveId,
                        familyId: family.id,
                        existingOwner: existingOwner,
                        attemptedOwner: this._owner,
                     }
                  )
               }
               family.entries[index] = { id: existingEntry.id, notation: existingEntry }
            } else {
               var entry = decorated.notation
               this.appendOwned(this._owner, [entry])
               family.entries[index] = { id: entry.id, notation: entry }
            }
         }
         this._stagedGenerators.push({ spec: spec, family: family })
         return family
      }

      installRewrittenBundle(specification, bundle) {
         return installRewrittenBundleInto(this, specification, bundle)
      }

      initGenerator(category, bundle) {
         if (this._generatorMode() === 'live') {
            return this._hub.initGenerator(category, {
               owner: this._owner,
               registry: this._liveRegistry,
               bundle: bundle,
            })
         }
         var id = typeof category === 'string' ? category : category && (category.id || category.categoryId)
         var item = this._stagedGenerators.find(function (entry) { return entry.family.id === id })
         if (item) return item.family
         var stagedCategory = typeof category === 'string'
            ? this._stagedCategories.find(function (entry) { return entry.id === id })
            : category
         if (stagedCategory && stagedCategory.generator && typeof stagedCategory.generator.create === 'function') {
            return this.registerGenerator({
               id: id,
               category: stagedCategory,
               start: stagedCategory.generator.start,
               initial: stagedCategory.generator.initial,
               maximum: stagedCategory.generator.maximum,
               create: stagedCategory.generator.create,
               resolveId: stagedCategory.generator.resolveId || stagedCategory.generator.idForIndex,
            }, bundle)
         }
         if (this._hub) return this._hub.initGenerator(category, { registry: this, bundle: bundle })
         return undefined
      }

      init_generator(category, bundle) {
         return this.initGenerator(category, bundle)
      }

      generatorDefinition(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorDefinition(id)
         var staged = this._stagedGenerators.find(function (entry) {
            return entry.family.id === id
         })
         return staged ? staged.family : (this._hub ? this._hub.generatorDefinition(id) : undefined)
      }

      generatorDefinitions() {
         if (this._generatorMode() === 'live') return this._hub.generatorDefinitions()
         var staged = this._stagedGenerators.map(function (entry) { return entry.family })
         if (!this._hub) return staged
         var ids = Object.create(null)
         staged.forEach(function (family) { ids[family.id] = true })
         return staged.concat(this._hub.generatorDefinitions().filter(function (family) {
            return !ids[family.id]
         }))
      }

      generatorCategoryIds() {
         if (this._generatorMode() === 'live') return this._hub.generatorCategoryIds()
         return this.generatorDefinitions().map(function (family) { return family.id })
      }

      generatorCurrent(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorCurrent(id)
         var family = this.generatorDefinition(id)
         if (!family) return 0
         return Number.isSafeInteger(family.currentIndex)
            ? family.currentIndex
            : (this._hub && this._hub.generatorDefinition(id)
               ? this._hub.generatorCurrent(id)
               : family.initial)
      }

      generatorMaximum(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorMaximum(id)
         var family = this.generatorDefinition(id)
         return family ? family.maximum : 0
      }

      generatorCanIncrement(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorCanIncrement(id)
         var staged = this._stagedGenerators.find(function (entry) { return entry.family.id === id })
         return !!staged && this.generatorCurrent(id) < staged.family.maximum
      }

      generatorCanDecrement(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorCanDecrement(id)
         var staged = this._stagedGenerators.find(function (entry) { return entry.family.id === id })
         return !!staged && this.generatorCurrent(id) > staged.family.start
      }

      generatorIncrement(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorAdd(id)
         this._assertStagedGeneratorMutable()
         var staged = this._stagedGenerators.find(function (entry) { return entry.family.id === id })
         if (!staged || !this.generatorCanIncrement(id)) return undefined
         var family = staged.family
         var index = this.generatorCurrent(id) + 1
         var raw = this._hub._createGenerated(family, index)
         var decorated = this._hub._decorateGenerated(raw, family, index)
         var existing = this.get(decorated.liveId)
         if (existing && this.ownerOf(existing) !== this._owner) {
            throw new NotationRegistryError(
               'GENERATOR_ID_CONFLICT',
               'Generated notation ID "' + decorated.liveId + '" conflicts with an existing registration.',
               {
                  id: decorated.liveId,
                  familyId: family.id,
                  existingOwner: this.ownerOf(existing),
                  attemptedOwner: this._owner,
               }
            )
         }
         var notation = existing || decorated.notation
         if (!existing) this.appendOwned(this._owner, [notation])
         family.entries[index] = { id: notation.id, notation: notation }
         family.currentIndex = index
         return notation
      }

      generatorDecrement(id) {
         if (this._generatorMode() === 'live') return this._hub.generatorRemove(id)
         this._assertStagedGeneratorMutable()
         var staged = this._stagedGenerators.find(function (entry) { return entry.family.id === id })
         if (!staged || !this.generatorCanDecrement(id)) return undefined
         var family = staged.family
         var index = this.generatorCurrent(id)
         var entry = family.entries[index]
         if (!entry) return undefined
         this.unregister(entry.id, this._owner)
         delete family.entries[index]
         family.currentIndex = index - 1
         return entry.notation
      }

      generatorAdd(id) {
         return this.generatorIncrement(id)
      }

      generatorRemove(id) {
         return this.generatorDecrement(id)
      }

      stagedCategories() {
         return this._stagedCategories.slice()
      }

      stagedGenerators() {
         return this._stagedGenerators.slice()
      }

      get(id) {
         return this.find(function (entry) { return entry.id === id })
      }

      ownerOf(id) {
         var entry = typeof id === 'string' ? this.get(id) : id
         if (!entry) return undefined
         if (this._staged.indexOf(entry) !== -1) return this._owner
         return this._liveRegistry.ownerOf(entry)
      }

      unregister(id, expectedOwner) {
         var index = this.findIndex(function (entry) { return entry.id === id })
         if (index === -1) return undefined
         var entry = this[index]
         var actualOwner = this.ownerOf(entry)
         if (expectedOwner !== undefined && actualOwner !== expectedOwner) {
            throw new NotationRegistryError(
               'OWNER_MISMATCH',
               'Cannot unregister staged notation "' + id + '" for owner "' + expectedOwner + '".',
               { id: id, expectedOwner: expectedOwner, actualOwner: actualOwner }
            )
         }
         Array.prototype.splice.call(this, index, 1)
         var stagedIndex = this._staged.indexOf(entry)
         if (stagedIndex !== -1) this._staged.splice(stagedIndex, 1)
         return entry
      }

      stagedEntries() {
         return this._staged.slice()
      }

      lock() {
         this._locked = true
      }
   }

   class NotationTransaction {
      constructor(hub, owner, ownerOrder) {
         this.owner = owner
         this.ownerOrder = ownerOrder
         this.main = new StagedRegistry(hub.main, owner, this)
         this.analysis = new StagedRegistry(hub.analysis, owner, this)
         this.register = this.main
         this.analysis_register = this.analysis
         Object.defineProperties(this, {
            _hub: { value: hub, enumerable: false },
            _state: { value: 'open', writable: true, enumerable: false },
            _preview: { value: null, writable: true, enumerable: false }
         })
      }

      get state() {
         return this._state
      }

      validate() {
         this._assertOpen()
         this.main.lock()
         this.analysis.lock()
         try {
            this._preview = this._hub._previewTransaction(this)
            this._state = 'prepared'
            return this.preview()
         } catch (error) {
            this._state = 'rolled_back'
            throw error
         }
      }

      preview() {
         if (this._state === 'open') return this.validate()
         if (!this._preview) {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction has no validated preview.',
               { owner: this.owner, state: this._state }
            )
         }
         var preview = this._preview
         return {
            owner: this.owner,
            main: {
               removed: preview.main.removed.slice(),
               added: preview.main.added.slice(),
               initialData: preview.main.initialData.map(function (prepared) {
                  return {
                     id: prepared.id,
                     notation: prepared.notation,
                     items: prepared.items
                  }
               })
            },
            analysis: {
               removed: preview.analysis.removed.slice(),
               added: preview.analysis.added.slice()
            },
            categories: (preview.categories || []).slice(),
            generators: (preview.generators || []).map(function (item) {
               var family = item.family || item
               return {
                  id: family.id,
                  category: family.category,
                  start: family.start,
                  initial: family.initial,
                  maximum: family.maximum,
               }
            })
         }
      }

      commit() {
         if (this._state === 'open') this.validate()
         this._assertPrepared()
         var result = this._hub._commitTransaction(this)
         this._state = 'committed'
         return result
      }

      rollback() {
         if (this._state === 'committed') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'A committed notation transaction cannot be rolled back.',
               { owner: this.owner, state: this._state }
            )
         }
         this._state = 'rolled_back'
      }

      _assertOpen() {
         if (this._state !== 'open') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction is already ' + this._state + '.',
               { owner: this.owner, state: this._state }
            )
         }
      }

      _assertPrepared() {
         if (this._state !== 'prepared') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction is not available for commit.',
               { owner: this.owner, state: this._state }
            )
         }
      }
   }

   class NotationRegistryHub {
      constructor(options) {
         options = options || {}
         this.main = options.main || new NotationRegistry('main', MAIN_FIELDS, { hub: this })
         this.analysis = options.analysis || new NotationRegistry('analysis', ANALYSIS_FIELDS, { hub: this })
         this.register = this.main
         this.analysis_register = this.analysis
         this.main._hub = this
         this.analysis._hub = this
         Object.defineProperty(this, '_listeners', {
            value: new Set(),
            enumerable: false
         })
         Object.defineProperty(this, '_ownerOrders', {
            value: new Map(),
            enumerable: false
         })
         Object.defineProperties(this, {
            _categories: { value: new Map(), enumerable: false },
            _categoryOwners: { value: new Map(), enumerable: false },
            _generators: { value: new Map(), enumerable: false },
            _generatorState: {
               value: Object.create(null),
               writable: true,
               enumerable: false
            }
         })
         if (options.generatorState) this.setGeneratorState(options.generatorState)
      }

      registerCategory(category, options) {
         options = options || {}
         var normalized = normalizeCategory(category)
         var existing = this._categories.get(normalized.id)
         if (existing) {
            if (
               normalized.parent_id !== existing.parent_id ||
               normalized.name !== existing.name
            ) {
               throw new NotationRegistryError(
                  'DUPLICATE_CATEGORY',
                  'The notation category ID "' + normalized.id + '" is already registered with different metadata.',
                  { id: normalized.id }
               )
            }
            if (normalized.path && !existing.path) existing.path = normalized.path.slice()
            if (normalized.generator && !existing.generator) existing.generator = normalized.generator
            return existing
         }

         if (normalized.parent_id && !this._categories.has(normalized.parent_id)) {
            throw new NotationRegistryError(
               'MISSING_CATEGORY_PARENT',
               'Parent category "' + normalized.parent_id + '" is not registered for "' + normalized.id + '".',
               { id: normalized.id, parentId: normalized.parent_id }
            )
         }
         this._categories.set(normalized.id, normalized)
         this._categoryOwners.set(normalized.id, options.owner || BUILTIN_OWNER)
         return normalized
      }

      register_category(category, bundle) {
         return this.main.registerCategory(category, bundle)
      }

      getCategory(id) {
         return this._categories.get(id)
      }

      categoryOwnerOf(id) {
         return this._categoryOwners.get(id)
      }

      categories() {
         return Array.from(this._categories.values())
      }

      categoryIds() {
         return Array.from(this._categories.keys())
      }

      categoryAncestors(id) {
         var result = []
         var seen = Object.create(null)
         var current = id
         while (current) {
            if (seen[current]) return []
            seen[current] = true
            var category = this._categories.get(current)
            if (!category) return []
            result.unshift(category)
            current = category.parent_id
         }
         return result
      }

      registerGenerator(spec, options) {
         options = options || {}
         var generator = normalizeGenerator(spec, options.bundle)
         var categoryInput = Object.assign({}, spec && spec.category || {})
         if (!categoryInput.id) categoryInput.id = generator.id
         if (!categoryInput.name) categoryInput.name = spec.name || spec.simple_name || spec.simpleName || generator.id
         if (categoryInput.parent_id === undefined && spec.parent_id !== undefined) categoryInput.parent_id = spec.parent_id
         if (categoryInput.parentId === undefined && spec.parentId !== undefined) categoryInput.parentId = spec.parentId
         if (!categoryInput.path && Array.isArray(spec.path)) categoryInput.path = spec.path.slice()
         if (spec.help !== undefined && categoryInput.help === undefined) categoryInput.help = spec.help

         var owner = options.owner || generator.owner || spec.owner || BUILTIN_OWNER
         assertOwner(owner)
         var category = this._categories.get(generator.id)
         if (!category) {
            category = this.registerCategory(
               normalizeCategory(categoryInput, generator),
               { owner: owner }
            )
         }

         var existing = this._generators.get(generator.id)
         if (existing) {
            if (existing.owner !== owner) {
               throw new NotationRegistryError(
                  'DUPLICATE_GENERATOR',
                  'The notation generator ID "' + generator.id + '" is owned by "' + existing.owner + '".',
                  { id: generator.id, existingOwner: existing.owner, attemptedOwner: owner }
               )
            }
            if (
               existing.start !== generator.start ||
               existing.initial !== generator.initial ||
               existing.maximum !== generator.maximum
            ) {
               throw new NotationRegistryError(
                  'DUPLICATE_GENERATOR',
                  'The notation generator ID "' + generator.id + '" is already registered with different bounds.',
                  { id: generator.id }
               )
            }
            return existing
         }

         var family = {
            id: generator.id,
            categoryId: generator.id,
            category: category,
            owner: owner,
            start: generator.start,
            initial: generator.initial,
            maximum: generator.maximum,
            create: generator.create,
            rawCreate: generator.rawCreate,
            bundle: generator.bundle,
            resolveId: generator.resolveId,
            entries: Object.create(null),
            created: Object.create(null),
         }
         category.generator = family
         this._generators.set(family.id, family)

         var target = this._normalizeGeneratorCurrent(family, this._generatorState[family.id])
         if (options.materialize !== false) {
            this._materializeGenerator(family, target, options.registry || this.main)
         } else {
            family.currentIndex = target
         }
         this._generatorState[family.id] = target
         return family
      }

      register_generator(spec, options) {
         return this.registerGenerator(spec, options)
      }

      generatorDefinition(id) {
         return this._generators.get(id)
      }

      generatorDefinitions() {
         return Array.from(this._generators.values())
      }

      generatorCategoryIds() {
         return Array.from(this._generators.keys())
      }

      setGeneratorState(state) {
         var next = Object.create(null)
         if (state && typeof state === 'object') {
            var self = this
            Object.keys(state).forEach(function (id) {
               var value = state[id]
               if (value && typeof value === 'object') value = value.current
               if (Number.isSafeInteger(value)) next[id] = value
            })
         }
         this._generatorState = next
         return this.getGeneratorState()
      }

      getGeneratorState() {
         var copy = Object.create(null)
         var self = this
         Object.keys(this._generatorState).forEach(function (id) {
            copy[id] = self._generatorState[id]
         })
         this._generators.forEach(function (family, id) {
            if (!hasOwn(copy, id)) copy[id] = self._normalizeGeneratorCurrent(family)
         })
         return copy
      }

      generatorCurrent(id) {
         var family = this._generators.get(id)
         if (!family) return 0
         return this._normalizeGeneratorCurrent(family, this._generatorState[id])
      }

      generatorMaximum(id) {
         var family = this._generators.get(id)
         return family ? family.maximum : 0
      }

      generatorCanIncrement(id) {
         var family = this._generators.get(id)
         return !!family && this.generatorCurrent(id) < family.maximum
      }

      generatorCanDecrement(id) {
         var family = this._generators.get(id)
         return !!family && this.generatorCurrent(id) > family.start
      }

      initGenerator(category, options) {
         options = options || {}
         var id = typeof category === 'string' ? category : category && (category.id || category.categoryId)
         var family = this._generators.get(id)
         if (!family) {
            var registeredCategory = this._categories.get(id)
            var categoryInput = typeof category === 'object' && category ? category : registeredCategory
            var generator = categoryInput && categoryInput.generator
            if (generator && typeof generator.create === 'function') {
               family = this.registerGenerator({
                  id: id,
                  category: categoryInput,
                  start: generator.start,
                  initial: generator.initial,
                  maximum: generator.maximum,
                  create: generator.create,
                  resolveId: generator.resolveId || generator.idForIndex || generator.mapId,
                }, {
                   owner: options.owner || this._categoryOwners.get(id) || BUILTIN_OWNER,
                   registry: options.registry || this.main,
                   bundle: options.bundle,
                })
            } else {
               throw new NotationRegistryError('UNKNOWN_GENERATOR', 'Unknown notation generator: ' + id, { id: id })
            }
         }
         var target = options.target === undefined
            ? this.generatorCurrent(id)
            : this._normalizeGeneratorCurrent(family, options.target)
         var registry = options.registry || this.main
         var changed = []
         while (this._materializedCurrent(family, registry) > target) {
            var removed = this._removeGeneratorVariant(family, registry, false)
            if (!removed) break
            changed.push({ type: 'removed', notation: removed })
         }
         while (this._materializedCurrent(family, registry) < target) {
            var added = this._addGeneratorVariant(family, registry, false)
            if (!added) break
            changed.push({ type: 'added', notation: added })
         }
         this._generatorState[id] = this.generatorCurrent(id)
         return { family: family, changed: changed }
      }

      generatorAdd(id) {
         var family = this._generators.get(id)
         if (!family || !this.generatorCanIncrement(id)) return undefined
         var notation = this._addGeneratorVariant(family, this.main, true)
         if (!notation) return undefined
         return notation
      }

      generatorIncrement(id) {
         return this.generatorAdd(id)
      }

      generatorRemove(id) {
         var family = this._generators.get(id)
         if (!family || !this.generatorCanDecrement(id)) return undefined
         var notation = this._removeGeneratorVariant(family, this.main, true)
         if (!notation) return undefined
         return notation
      }

      generatorDecrement(id) {
         return this.generatorRemove(id)
      }

      materializeGenerator(id, index, options) {
         options = options || {}
         var family = this._generators.get(id)
         if (!family) throw new NotationRegistryError('UNKNOWN_GENERATOR', 'Unknown notation generator: ' + id, { id: id })
         if (!Number.isSafeInteger(index) || index < family.start || index > family.maximum) {
            throw new NotationRegistryError('INVALID_GENERATOR_INDEX', 'Generator index out of range for ' + id + ': ' + index, { id: id, index: index })
         }
         var registry = options.registry || this.main
         return this._materializeOne(family, index, registry)
      }

      _normalizeGeneratorCurrent(family, value) {
         if (!Number.isSafeInteger(value) || value < family.start || value > family.maximum) {
            return family.initial
         }
         return value
      }

      _generatedId(family, index, notation) {
         var id = notation && notation.id
         if (family.resolveId) {
            id = family.resolveId(index, notation)
         }
         if (typeof id !== 'string' || id.trim() === '') {
            throw new NotationRegistryError(
               'INVALID_GENERATED_NOTATION',
               'Generator "' + family.id + '" did not provide a live notation ID for index ' + index + '.',
               { id: family.id, index: index }
            )
         }
         return id
      }

      _createGenerated(family, index) {
         if (hasOwn(family.created, index)) return family.created[index]
         var notation
         try {
            notation = family.create(index)
         } catch (error) {
            throw new NotationRegistryError(
               'GENERATOR_FAILED',
               'Generator "' + family.id + '" failed at index ' + index + ': ' +
                  (error && error.message ? error.message : String(error)),
               { id: family.id, index: index },
               error
            )
         }
         if (!notation || typeof notation !== 'object') {
            throw new NotationRegistryError(
               'INVALID_GENERATED_NOTATION',
               'Generator "' + family.id + '" returned an invalid notation at index ' + index + '.',
               { id: family.id, index: index }
            )
         }
         family.created[index] = notation
         return notation
      }

      _decorateGenerated(notation, family, index) {
         // Generator results are cached for later re-materialization. Decorate a
         // fresh registry entry so aliases never rewrite the factory's object.
         var result = Object.assign({}, notation)
         var liveId = this._generatedId(family, index, notation)
         var sourceId = result && result.id
         var upstreamGenerator = result && result.upstreamDefinition && !result.upstreamGenerator
            ? Object.freeze({
               categoryId: family.categoryId,
               index: index,
               start: family.start,
               initial: family.initial,
               category: family.category,
            })
            : undefined
         // The clone also keeps frozen bundle definitions writable here.
         try {
            if (liveId !== sourceId) result.id = liveId
            result.category_id = result.category_id || family.categoryId
            result.categoryId = result.categoryId || family.categoryId
            result.generatedFamily = Object.assign({}, result.generatedFamily || {}, {
               categoryId: family.categoryId,
               index: index,
               sourceId: sourceId,
               liveId: liveId,
            })
            result.generatorFamily = Object.assign({}, result.generatorFamily || {}, {
               categoryId: family.categoryId,
               index: index,
               sourceId: sourceId,
               liveId: liveId,
            })
            if (!result.parameterGenerator) {
               result.parameterGenerator = {
                  id: family.id,
                  start: family.start,
                  initial: family.initial,
                  maximum: family.maximum,
               }
            }
            if (upstreamGenerator) result.upstreamGenerator = upstreamGenerator
         } catch (error) {
            result = Object.assign({}, result, {
               id: liveId,
               category_id: family.categoryId,
               categoryId: family.categoryId,
               generatedFamily: Object.assign({}, result.generatedFamily || {}, {
                  categoryId: family.categoryId,
                  index: index,
                  sourceId: sourceId,
                  liveId: liveId,
               }),
               generatorFamily: {
                  categoryId: family.categoryId,
                  index: index,
                  sourceId: sourceId,
                  liveId: liveId,
               },
               parameterGenerator: {
                  id: family.id,
                  start: family.start,
                  initial: family.initial,
                  maximum: family.maximum,
               },
            })
            if (upstreamGenerator) result.upstreamGenerator = upstreamGenerator
         }
         return { notation: result, liveId: liveId }
      }

      _materializeOne(family, index, registry) {
         if (hasOwn(family.entries, index)) {
            var retained = family.entries[index]
            var retainedEntry = registry.get ? registry.get(retained.id) : undefined
            if (retainedEntry) return retainedEntry
         }

         var raw = this._createGenerated(family, index)
         var decorated = this._decorateGenerated(raw, family, index)
         var existing = registry.get ? registry.get(decorated.liveId) : undefined
         if (existing) {
            var existingInfo = existing.generatedFamily || existing.generatorFamily || existing.upstreamGenerator
            var existingOwner = registry.ownerOf ? registry.ownerOf(existing.id) : family.owner
            if (existingOwner !== family.owner) {
               throw new NotationRegistryError(
                  'GENERATOR_ID_CONFLICT',
                  'Generated notation ID "' + decorated.liveId + '" is owned by "' + existingOwner + '".',
                  { id: decorated.liveId, familyId: family.id, owner: family.owner, existingOwner: existingOwner }
               )
            }
            if (existingInfo && existingInfo.categoryId === family.categoryId && existingInfo.index === index) {
               family.entries[index] = { id: existing.id, notation: existing }
               return existing
            }
            throw new NotationRegistryError(
               'GENERATOR_ID_CONFLICT',
               'Generated notation ID "' + decorated.liveId + '" is already registered without matching family metadata.',
               { id: decorated.liveId, familyId: family.id, owner: family.owner }
            )
         }

         var entry = decorated.notation
         if (entry.id !== decorated.liveId && !registry.get(decorated.liveId)) {
            // A resolver may select an alias that does not exist yet. Keep the
            // factory's ID as the actual registry key in that case.
            decorated.liveId = entry.id
         }
         if (!registry || typeof registry.appendOwned !== 'function') {
            if (!registry || typeof registry.push !== 'function') {
               throw new NotationRegistryError('REGISTRY_UNAVAILABLE', 'A writable notation registry is required.')
            }
            registry.push(entry)
         } else {
            registry.appendOwned(family.owner, [entry])
         }
         family.entries[index] = { id: entry.id, notation: entry }
         return entry
      }

      _materializeGenerator(family, target, registry) {
         var created = []
         for (var index = family.start; index <= target; index++) {
            created.push(this._materializeOne(family, index, registry))
         }
         family.currentIndex = target
         return created
      }

      _materializedCurrent(family, registry) {
         var current = family.start - 1
         var entries = family.entries
         Object.keys(entries).forEach(function (key) {
            var index = Number(key)
            var item = entries[key]
            if (!item) return
            var present = registry && typeof registry.get === 'function'
               ? registry.get(item.id) : item.notation
            if (present && index > current) current = index
         })
         if (family.currentIndex !== undefined && family.currentIndex > current) {
            var candidate = family.entries[family.currentIndex]
            if (candidate && (!registry || !registry.get || registry.get(candidate.id))) {
               current = family.currentIndex
            }
         }
         return current
      }

      _addGeneratorVariant(family, registry, notify) {
         var current = this._materializedCurrent(family, registry)
         if (current >= family.maximum) return undefined
         var next = current + 1
         var notation = this._materializeOne(family, next, registry)
         this._generatorState[family.id] = next
         family.currentIndex = next
         if (notify !== false) {
            this._emit({
               type: 'generator-add',
               owner: family.owner,
               family: family,
               familyId: family.id,
               main: { added: [notation], removed: [] },
               notation: notation,
            })
         }
         return notation
      }

      _removeGeneratorVariant(family, registry, notify) {
         var current = this._materializedCurrent(family, registry)
         if (current <= family.start) return undefined
         var retained = family.entries[current]
         var raw = retained && retained.notation
         if (!raw) raw = this._createGenerated(family, current)
         var liveId = retained ? retained.id : this._generatedId(family, current, raw)
         var entry = registry.get ? registry.get(liveId) : undefined
         if (!entry && registry !== this.main && this.main.get) entry = this.main.get(liveId)
         if (!entry) {
            throw new NotationRegistryError(
               'GENERATOR_VARIANT_MISSING',
               'Generated notation "' + liveId + '" is not registered.',
               { familyId: family.id, index: current, id: liveId }
            )
         }
         var actualOwner = registry.ownerOf ? registry.ownerOf(entry) : family.owner
         if (actualOwner !== family.owner) {
            throw new NotationRegistryError(
               'GENERATOR_OWNER_MISMATCH',
               'Generated notation "' + liveId + '" is owned by "' + actualOwner + '".',
               { familyId: family.id, index: current, id: liveId, owner: family.owner, actualOwner: actualOwner }
            )
         }
         if (typeof registry.unregister !== 'function') {
            throw new NotationRegistryError('REGISTRY_UNAVAILABLE', 'The notation registry cannot unregister generated entries.')
         }
         registry.unregister(liveId, family.owner)
         delete family.entries[current]
         this._generatorState[family.id] = current - 1
         family.currentIndex = current - 1
         if (notify !== false) {
            this._emit({
               type: 'generator-remove',
               owner: family.owner,
               family: family,
               familyId: family.id,
               main: { added: [], removed: [entry] },
               notation: entry,
            })
         }
         return entry
      }

      begin(owner, options) {
         options = options || {}
         assertOwner(owner)
         if (owner === BUILTIN_OWNER) {
            throw new NotationRegistryError(
               'RESERVED_OWNER',
               'The built-in notation owner is reserved.',
               { owner: owner }
            )
         }
         var ownerOrder = options.ownerOrder
         if (ownerOrder === undefined && this._ownerOrders.has(owner)) {
            ownerOrder = this._ownerOrders.get(owner)
         }
         if (ownerOrder === undefined) ownerOrder = this._nextOwnerOrder()
         if (typeof ownerOrder !== 'number' || !Number.isFinite(ownerOrder)) {
            throw new NotationRegistryError(
               'INVALID_OWNER_ORDER',
               'A local notation owner order must be a finite number.',
               { owner: owner, ownerOrder: ownerOrder }
            )
         }
         return new NotationTransaction(this, owner, ownerOrder)
      }

      prepareSource(owner, source, options) {
         options = options || {}
         if (typeof source !== 'string') {
            throw new NotationRegistryError(
               'INVALID_SOURCE',
               'Local notation source must be a string.',
               { owner: owner }
            )
         }

         var transaction = this.begin(owner, { ownerOrder: options.ownerOrder })
         var context = options.context || {}
         var names = [
            'register', 'analysis_register',
            'register_notation', 'register_category', 'init_generator',
            'generator_current', 'generator_can_increment', 'generator_can_decrement',
            'generator_increment', 'generator_decrement',
         ]
         var values = [
            transaction.main,
            transaction.analysis,
            transaction.main.register_notation.bind(transaction.main),
            transaction.main.register_category.bind(transaction.main),
            transaction.main.init_generator.bind(transaction.main),
            transaction.main.generatorCurrent.bind(transaction.main),
            transaction.main.generatorCanIncrement.bind(transaction.main),
            transaction.main.generatorCanDecrement.bind(transaction.main),
            transaction.main.generatorIncrement.bind(transaction.main),
            transaction.main.generatorDecrement.bind(transaction.main),
         ]
         var contextNames = Object.keys(context)

         for (var i = 0; i < contextNames.length; i++) {
            var name = contextNames[i]
            if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(name) || names.indexOf(name) !== -1) {
               throw new NotationRegistryError(
                  'INVALID_CONTEXT',
                  'Invalid source context name "' + name + '".',
                  { owner: owner, name: name }
               )
            }
            names.push(name)
            values.push(context[name])
         }

         var sourceURL = String(options.sourceURL || ('local-notation-' + owner + '.js'))
            .replace(/[\r\n\u2028\u2029]/g, '')
         var body = source + '\n//# sourceURL=' + sourceURL

         try {
            // Keep legacy script semantics while isolating var/function declarations to this call.
            var execute = new Function(...names, body)
            execute.apply(undefined, values)
            transaction.validate()
            return transaction
         } catch (error) {
            transaction.rollback()
            if (error instanceof NotationRegistryError) throw error
            throw new NotationRegistryError(
               'SOURCE_EXECUTION_FAILED',
               error && error.message
                  ? 'Local notation execution failed: ' + error.message
                  : 'Local notation execution failed.',
               { owner: owner, sourceURL: sourceURL },
               error
            )
         }
      }

      executeSource(owner, source, options) {
         return this.prepareSource(owner, source, options).commit()
      }

      removeOwner(owner) {
         assertOwner(owner)
         if (owner === BUILTIN_OWNER) {
            throw new NotationRegistryError(
               'RESERVED_OWNER',
               'Built-in registrations cannot be removed through the local notation hub.',
               { owner: owner }
            )
         }

         var mainSnapshot = this.main._snapshotPairs()
         var analysisSnapshot = this.analysis._snapshotPairs()
         var metadataSnapshot = this._snapshotMetadata()
         var mainPlan = this.main._planOwnerReplacement(owner, [])
         var analysisPlan = this.analysis._planOwnerReplacement(owner, [])
         mainPlan.initialData = []

         try {
            this.main._applyPlan(mainPlan)
            this.analysis._applyPlan(analysisPlan)
            this._removeOwnerMetadata(owner)
         } catch (error) {
            this.main._restorePairs(mainSnapshot)
            this.analysis._restorePairs(analysisSnapshot)
            this._restoreMetadata(metadataSnapshot)
            throw error
         }

         var result = this._result(
            owner,
            mainPlan,
            analysisPlan,
            'remove',
            this._ownerOrders.get(owner)
         )
         this._emit(result)
         return result
      }

      registrationsFor(owner) {
         return {
            main: this.main.entriesForOwner(owner),
            analysis: this.analysis.entriesForOwner(owner)
         }
      }

      ownerOrder(owner) {
         return this._ownerOrders.get(owner)
      }

      forgetOwner(owner) {
         this._ownerOrders.delete(owner)
      }

      subscribe(listener) {
         if (typeof listener !== 'function') {
            throw new TypeError('Notation registry listeners must be functions.')
         }
         this._listeners.add(listener)
         var listeners = this._listeners
         return function () { listeners.delete(listener) }
      }

      _snapshotMetadata() {
         var categoryGenerators = []
         this._categories.forEach(function (category) {
            categoryGenerators.push({
               category: category,
               hasGenerator: hasOwn(category, 'generator'),
               generator: category.generator,
            })
         })
         return {
            categories: Array.from(this._categories.entries()),
            categoryOwners: Array.from(this._categoryOwners.entries()),
            generators: Array.from(this._generators.entries()),
            generatorState: Object.assign(Object.create(null), this._generatorState),
            categoryGenerators: categoryGenerators,
         }
      }

      _restoreMetadata(snapshot) {
         this._categories.forEach(function (category) {
            if (hasOwn(category, 'generator')) delete category.generator
         })
         this._categories.clear()
         this._categoryOwners.clear()
         this._generators.clear()
         snapshot.categories.forEach(function (pair) { this._categories.set(pair[0], pair[1]) }, this)
         snapshot.categoryOwners.forEach(function (pair) { this._categoryOwners.set(pair[0], pair[1]) }, this)
         snapshot.generators.forEach(function (pair) { this._generators.set(pair[0], pair[1]) }, this)
         snapshot.categoryGenerators.forEach(function (item) {
            if (item.hasGenerator) item.category.generator = item.generator
            else if (hasOwn(item.category, 'generator')) delete item.category.generator
         })
         this._generatorState = Object.assign(Object.create(null), snapshot.generatorState)
      }

      _removeOwnerMetadata(owner) {
         var self = this
         this._generators.forEach(function (family, id) {
            if (family.owner !== owner) return
            self._generators.delete(id)
            delete self._generatorState[id]
            if (family.category && family.category.generator === family) {
               delete family.category.generator
            }
         })

         var changed = true
         while (changed) {
            changed = false
            Array.from(this._categories.keys()).reverse().forEach(function (id) {
               if (self._categoryOwners.get(id) !== owner) return
               var category = self._categories.get(id)
               if (category && category.generator) return
               var hasChild = Array.from(self._categories.values()).some(function (candidate) {
                  return candidate.parent_id === id
               })
               if (hasChild) return
               self._categories.delete(id)
               self._categoryOwners.delete(id)
               changed = true
            })
         }
      }

      _previewTransaction(transaction, validateInitialData) {
         var mainEntries = transaction.main.stagedEntries()
         var analysisEntries = transaction.analysis.stagedEntries()
         if (mainEntries.length + analysisEntries.length === 0) {
            throw new NotationRegistryError(
               'EMPTY_TRANSACTION',
               'A local notation file must register at least one main or analysis notation.',
               { owner: transaction.owner }
            )
         }

         var mainIndex = this._ownerInsertionIndex(this.main, transaction.owner, transaction.ownerOrder)
         var analysisIndex = this._ownerInsertionIndex(this.analysis, transaction.owner, transaction.ownerOrder)
         var mainPlan = this.main._planOwnerReplacement(transaction.owner, mainEntries, {
            insertionIndex: mainIndex
         })
         var analysisPlan = this.analysis._planOwnerReplacement(transaction.owner, analysisEntries, {
            insertionIndex: analysisIndex
         })

         var initialData = []
         if (validateInitialData !== false) {
            for (var i = 0; i < mainEntries.length; i++) {
               initialData.push({
                  id: mainEntries[i].id,
                  notation: mainEntries[i],
                  items: validateMainInitialData(mainEntries[i])
               })
            }
         } else if (transaction._preview) {
            initialData = transaction._preview.main.initialData
         }
         mainPlan.initialData = initialData

         return {
            main: mainPlan,
            analysis: analysisPlan,
            categories: transaction.main.stagedCategories(),
            generators: transaction.main.stagedGenerators(),
         }
      }

      _commitTransaction(transaction) {
         // Replan against current live owners, but commit exactly the entries and init data
         // captured while the transaction was validated.
         var prepared = transaction._preview
         var mainIndex = this._ownerInsertionIndex(this.main, transaction.owner, transaction.ownerOrder)
         var analysisIndex = this._ownerInsertionIndex(this.analysis, transaction.owner, transaction.ownerOrder)
         var mainPlan = this.main._planOwnerReplacement(transaction.owner, prepared.main.added, {
            insertionIndex: mainIndex
         })
         var analysisPlan = this.analysis._planOwnerReplacement(transaction.owner, prepared.analysis.added, {
            insertionIndex: analysisIndex
         })
         mainPlan.initialData = prepared.main.initialData
         var plans = { main: mainPlan, analysis: analysisPlan }
         var mainSnapshot = this.main._snapshotPairs()
         var analysisSnapshot = this.analysis._snapshotPairs()
         var metadataSnapshot = this._snapshotMetadata()

         try {
            this.main._applyPlan(plans.main)
            this.analysis._applyPlan(plans.analysis)
            this._removeOwnerMetadata(transaction.owner)
            this._commitStagedFamilies(transaction, prepared)
         } catch (error) {
            this.main._restorePairs(mainSnapshot)
            this.analysis._restorePairs(analysisSnapshot)
            this._restoreMetadata(metadataSnapshot)
            throw error
         }

         this._ownerOrders.set(transaction.owner, transaction.ownerOrder)

         var result = this._result(
            transaction.owner,
            plans.main,
            plans.analysis,
            'replace',
            transaction.ownerOrder
         )
         result.categories = (prepared.categories || []).slice()
         result.generators = (prepared.generators || []).map(function (item) {
            return item.family || item
         })
         this._emit(result)
         return result
      }

      _commitStagedFamilies(transaction, prepared) {
         var categories = prepared.categories || []
         var pending = categories.slice()
         var registered = Object.create(null)
         while (pending.length) {
            var progress = false
            for (var i = 0; i < pending.length; i++) {
               var category = pending[i]
               if (category.parent_id && !this._categories.has(category.parent_id)) continue
               this.registerCategory(category, { owner: transaction.owner })
               registered[category.id] = true
               pending.splice(i, 1)
               progress = true
               // Restart at the earliest declaration: the category just added
               // may unblock an earlier child that must precede later siblings.
               break
            }
            if (!progress) {
               throw new NotationRegistryError(
                  'MISSING_CATEGORY_PARENT',
                  'A staged category refers to an unregistered parent.',
                  { owner: transaction.owner }
               )
            }
         }

         var generators = prepared.generators || []
         for (var index = 0; index < generators.length; index++) {
            var staged = generators[index]
            var family = staged.family
            var spec = Object.assign({}, staged.spec, {
               id: family.id,
               categoryId: family.categoryId,
               category: family.category,
               owner: transaction.owner,
               start: family.start,
               initial: family.initial,
               maximum: family.maximum,
               create: family.create,
               resolveId: family.resolveId,
            })
            var liveFamily = this.registerGenerator(spec, {
               owner: transaction.owner,
               registry: this.main,
               materialize: false,
            })
            var entries = family.entries
            var self = this
            Object.keys(entries).forEach(function (key) {
               var stagedEntry = entries[key]
               var liveEntry = self.main.get(stagedEntry.id)
               if (liveEntry) liveFamily.entries[key] = { id: liveEntry.id, notation: liveEntry }
            })
            liveFamily.currentIndex = family.currentIndex
            this._generatorState[liveFamily.id] = Number.isSafeInteger(family.currentIndex)
               ? family.currentIndex
               : family.initial
         }
      }

      _result(owner, mainPlan, analysisPlan, type, ownerOrder) {
         return {
            type: type,
            owner: owner,
            ownerOrder: ownerOrder,
            main: {
               removed: mainPlan.removed.slice(),
               added: mainPlan.added.slice(),
               initialData: (mainPlan.initialData || []).map(function (prepared) {
                  return {
                     id: prepared.id,
                     notation: prepared.notation,
                     items: prepared.items
                  }
               })
            },
            analysis: {
               removed: analysisPlan.removed.slice(),
               added: analysisPlan.added.slice()
            },
            categories: [],
            generators: []
         }
      }

      _nextOwnerOrder() {
         var next = 1
         this._ownerOrders.forEach(function (order) {
            if (order >= next) next = order + 1
         })
         return next
      }

      _ownerInsertionIndex(registry, owner, ownerOrder) {
         var pairs = registry._snapshotPairs().filter(function (pair) {
            return pair.owner !== owner
         })
         for (var i = 0; i < pairs.length; i++) {
            if (pairs[i].owner === BUILTIN_OWNER) continue
            var otherOrder = this._ownerOrders.get(pairs[i].owner)
            if (otherOrder !== undefined && otherOrder > ownerOrder) return i
         }
         return pairs.length
      }

      _emit(change) {
         this._listeners.forEach(function (listener) {
            try {
               listener(change)
            } catch (error) {
               if (typeof console !== 'undefined' && console.error) console.error(error)
            }
         })
      }
   }

   function cloneJSON(value) {
      if (value === undefined) return undefined
      try {
         return JSON.parse(JSON.stringify(value))
      } catch (error) {
         throw new LocalNotationStorageError(
            'SERIALIZATION_FAILED',
            'Local notation data could not be serialized.',
            error
         )
      }
   }

   function defaultFileId() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
         return crypto.randomUUID()
      }
      return 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
   }

   function defaultState() {
      return {
         version: FILE_STORE_VERSION,
         nextOrder: 1,
         files: [],
         drafts: {}
      }
   }

   function isQuotaError(error) {
      return !!error && (
         error.name === 'QuotaExceededError' ||
         error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
         error.code === 22 ||
         error.code === 1014
      )
   }

   class LocalNotationFileStore {
      constructor(options) {
         options = options || {}
         var fallbackStorage = typeof localStorage !== 'undefined' ? localStorage : null
         this.storage = options.storage || fallbackStorage
         this.key = options.key || DEFAULT_FILE_STORE_KEY
         this.now = options.now || function () { return Date.now() }
         this.createId = options.createId || defaultFileId
      }

      snapshot() {
         return cloneJSON(this._read())
      }

      listFiles() {
         return this._read().files
            .slice()
            .sort(function (a, b) { return a.order - b.order })
            .map(cloneJSON)
      }

      getFile(id) {
         var file = this._read().files.find(function (candidate) {
            return candidate.id === id
         })
         return file ? cloneJSON(file) : undefined
      }

      createFile(record) {
         var store = this
         record = record || {}
         return this._mutate(function (state) {
            var id = record.id || store.createId()
            if (typeof id !== 'string' || id.trim() === '') {
               throw new LocalNotationStorageError('INVALID_FILE', 'A local notation file ID is required.')
            }
            if (state.files.some(function (file) { return file.id === id })) {
               throw new LocalNotationStorageError('DUPLICATE_FILE_ID', 'A local notation file already uses ID "' + id + '".')
            }
            store._validateName(state, record.name)
            if (record.source !== undefined && typeof record.source !== 'string') {
               throw new LocalNotationStorageError('INVALID_FILE', 'Local notation source must be a string.')
            }

            var timestamp = store.now()
            var file = Object.assign({}, cloneJSON(record), {
               id: id,
               name: record.name.trim(),
               source: record.source || '',
               order: state.nextOrder++,
               createdAt: record.createdAt === undefined ? timestamp : record.createdAt,
               updatedAt: timestamp,
               sourceRevision: record.sourceRevision === undefined ? 1 : record.sourceRevision
            })
            state.files.push(file)
            return file
         })
      }

      updateFile(id, patch) {
         var store = this
         patch = patch || {}
         return this._mutate(function (state) {
            return store._updateFileState(state, id, patch)
         })
      }

      updateFileAndClearDraft(id, patch) {
         var store = this
         patch = patch || {}
         return this._mutate(function (state) {
            var next = store._updateFileState(state, id, patch)
            delete state.drafts[id]
            return next
         })
      }

      deleteFile(id) {
         var store = this
         return this._mutate(function (state) {
            var index = state.files.findIndex(function (file) { return file.id === id })
            if (index === -1) store._notFound(id)
            var removed = state.files.splice(index, 1)[0]
            delete state.drafts[id]
            return removed
         })
      }

      getDraft(id) {
         var draft = this._read().drafts[id]
         return draft ? cloneJSON(draft) : undefined
      }

      setDraft(id, draft) {
         var store = this
         return this._mutate(function (state) {
            store._findFile(state, id)
            var value = typeof draft === 'string' ? { source: draft } : cloneJSON(draft || {})
            if (typeof value.source !== 'string') {
               throw new LocalNotationStorageError('INVALID_DRAFT', 'A draft must contain string source text.')
            }
            value.updatedAt = store.now()
            state.drafts[id] = value
            return value
         })
      }

      clearDraft(id) {
         return this._mutate(function (state) {
            var previous = state.drafts[id]
            delete state.drafts[id]
            return previous
         })
      }

      _updateFileState(state, id, patch) {
         var index = state.files.findIndex(function (file) { return file.id === id })
         if (index === -1) this._notFound(id)
         var current = state.files[index]
         var nextName = Object.prototype.hasOwnProperty.call(patch, 'name') ? patch.name : current.name
         this._validateName(state, nextName, id)
         if (Object.prototype.hasOwnProperty.call(patch, 'source') && typeof patch.source !== 'string') {
            throw new LocalNotationStorageError('INVALID_FILE', 'Local notation source must be a string.')
         }

         var next = Object.assign({}, current, cloneJSON(patch))
         next.id = current.id
         next.name = nextName.trim()
         next.order = current.order
         next.createdAt = current.createdAt
         next.updatedAt = this.now()
         if (Object.prototype.hasOwnProperty.call(patch, 'source') && patch.source !== current.source) {
            next.sourceRevision = (Number(current.sourceRevision) || 0) + 1
         } else {
            next.sourceRevision = current.sourceRevision
         }
         state.files[index] = next
         return next
      }

      _findFile(state, id) {
         var file = state.files.find(function (candidate) { return candidate.id === id })
         if (!file) this._notFound(id)
         return file
      }

      _notFound(id) {
         throw new LocalNotationStorageError(
            'FILE_NOT_FOUND',
            'No local notation file exists with ID "' + id + '".'
         )
      }

      _validateName(state, name, ignoredId) {
         if (typeof name !== 'string' || !/\.js$/i.test(name.trim())) {
            throw new LocalNotationStorageError(
               'INVALID_FILE_NAME',
               'A local notation file name must end in .js.'
            )
         }
         var normalized = name.trim().toLowerCase()
         var duplicate = state.files.find(function (file) {
            return file.id !== ignoredId && file.name.trim().toLowerCase() === normalized
         })
         if (duplicate) {
            throw new LocalNotationStorageError(
               'DUPLICATE_FILE_NAME',
               'A local notation file named "' + name.trim() + '" already exists.'
            )
         }
      }

      _read() {
         if (!this.storage || typeof this.storage.getItem !== 'function') {
            throw new LocalNotationStorageError(
               'STORAGE_UNAVAILABLE',
               'Local notation storage is unavailable in this browser.'
            )
         }

         var raw
         try {
            raw = this.storage.getItem(this.key)
         } catch (error) {
            throw new LocalNotationStorageError(
               'STORAGE_READ_FAILED',
               'Local notation files could not be read from browser storage.',
               error
            )
         }
         if (raw === null || raw === '') return defaultState()

         var state
         try {
            state = JSON.parse(raw)
         } catch (error) {
            throw new LocalNotationStorageError(
               'STORAGE_CORRUPT',
               'Stored local notation data is not valid JSON.',
               error
            )
         }

         if (!state || typeof state !== 'object' || Array.isArray(state)) {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation data has an invalid shape.')
         }
         if (state.version !== FILE_STORE_VERSION) {
            throw new LocalNotationStorageError(
               'UNSUPPORTED_VERSION',
               'Stored local notation data uses unsupported version ' + String(state.version) + '.'
            )
         }
         if (!Array.isArray(state.files) || !state.drafts || typeof state.drafts !== 'object') {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation data has an invalid shape.')
         }
         if (!Number.isInteger(state.nextOrder) || state.nextOrder < 1) {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation ordering data is invalid.')
         }
         return state
      }

      _mutate(mutator) {
         var state = cloneJSON(this._read())
         var result = mutator(state)
         var serialized
         try {
            serialized = JSON.stringify(state)
         } catch (error) {
            throw new LocalNotationStorageError(
               'SERIALIZATION_FAILED',
               'Local notation data could not be serialized.',
               error
            )
         }

         try {
            this.storage.setItem(this.key, serialized)
         } catch (error) {
            if (isQuotaError(error)) {
               throw new LocalNotationStorageError(
                  'QUOTA_EXCEEDED',
                  'Browser storage is full. The local notation change was not saved.',
                  error
               )
            }
            throw new LocalNotationStorageError(
               'STORAGE_WRITE_FAILED',
               'The local notation change could not be saved to browser storage.',
               error
            )
         }
         return cloneJSON(result)
      }
   }

   function installGlobals(target, options) {
      target = target || (typeof globalThis !== 'undefined' ? globalThis : undefined)
      options = options || {}
      if (!target) throw new TypeError('A global target object is required.')
      var hub = options.hub
      if (!hub && target.notationRegistryHub instanceof NotationRegistryHub) {
         hub = target.notationRegistryHub
      }
      if (!hub) hub = new NotationRegistryHub()

      target.notationRegistryHub = hub
      target.register = hub.main
      target.analysis_register = hub.analysis
      // Upstream-compatible function names. They intentionally delegate to
      // the same owner-aware registry used by legacy register.push files.
      target.register_notation = function (entry, bundle) { return hub.main.registerNotation(entry, bundle) }
      target.register_category = function (category, bundle) { return hub.main.registerCategory(category, bundle) }
      target.init_generator = function (category, bundle) { return hub.main.initGenerator(category, bundle) }
      target.generator_current = function (id) { return hub.generatorCurrent(id) }
      target.generator_can_increment = function (id) { return hub.generatorCanIncrement(id) }
      target.generator_can_decrement = function (id) { return hub.generatorCanDecrement(id) }
      target.generator_increment = function (id) { return hub.generatorAdd(id) }
      target.generator_decrement = function (id) { return hub.generatorRemove(id) }
      target.on_registry_change = function (listener) { return hub.subscribe(listener) }
      return hub
   }

   return {
      BUILTIN_OWNER: BUILTIN_OWNER,
      MAIN_FIELDS: MAIN_FIELDS.slice(),
      ANALYSIS_FIELDS: ANALYSIS_FIELDS.slice(),
      FILE_STORE_VERSION: FILE_STORE_VERSION,
      DEFAULT_FILE_STORE_KEY: DEFAULT_FILE_STORE_KEY,
      NotationRegistryError: NotationRegistryError,
      LocalNotationStorageError: LocalNotationStorageError,
      NotationRegistry: NotationRegistry,
      NotationRegistryHub: NotationRegistryHub,
      LocalNotationFileStore: LocalNotationFileStore,
      htmlToLatex: htmlToLatex,
      normalizeRewrittenDisplay: normalizeRewrittenDisplay,
      convertRewrittenDiagram: convertRewrittenDiagram,
      createRewrittenDrawDiagram: createRewrittenDrawDiagram,
      normalizeRewrittenDefinition: normalizeRewrittenDefinition,
      decorateWithRewrittenDefinition: decorateWithRewrittenDefinition,
      createBundledGeneratedDefinition: createBundledGeneratedDefinition,
      registerRewrittenCategoryHierarchy: registerRewrittenCategoryHierarchy,
      registerRewrittenBundleCategories: registerRewrittenBundleCategories,
      registerBundledGenerator: registerBundledGenerator,
      installRewrittenBundle: installRewrittenBundleInto,
      installGlobals: installGlobals
   }
})
