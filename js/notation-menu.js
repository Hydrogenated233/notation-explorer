;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationMenu = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var BUILTIN_OWNER = '@notation-explorer/builtin'
   var MAX_GENERATOR_VALUE = 64

   function normalizeSearch(value) {
      return String(value || '').toLowerCase().trim()
   }

   function folderNode(key, label, origin, searchText) {
      return {
         kind: 'folder',
         key: key,
         label: label,
         origin: origin,
         searchText: normalizeSearch(searchText || label),
         children: [],
      }
   }

   function notationNode(notation, origin, sourcePath, fileName) {
      return {
         kind: 'notation',
         key: 'notation:' + notation.id,
         id: notation.id,
         name: notation.name,
         origin: origin,
         sourcePath: sourcePath || '',
         fileName: fileName || '',
         searchText: normalizeSearch([
            notation.name,
            notation.id,
            sourcePath,
            fileName,
         ].join(' ')),
      }
   }

   function getOrCreateFolder(children, key, label, origin, searchText) {
      for (var index = 0; index < children.length; index++) {
         if (children[index].key === key) return children[index]
      }
      var folder = folderNode(key, label, origin, searchText)
      children.push(folder)
      return folder
   }

   function upstreamCategoryId(notation, categoriesById) {
      if (!notation || !notation.upstreamDefinition) return ''
      var categoryId = notation.upstream_category_id || notation.category_id
      return typeof categoryId === 'string' && categoriesById[categoryId] ? categoryId : ''
   }

   function categoryPath(categoriesById, categoryId) {
      var path = []
      var seen = Object.create(null)
      while (categoryId) {
         if (seen[categoryId]) return []
         seen[categoryId] = true
         var category = categoriesById[categoryId]
         if (!category) return []
         path.unshift(category)
         categoryId = category.parent_id
      }
      return path
   }

   function categoryLabel(category) {
      return category.simple_name || category.name || category.id
   }

   function generatorMetadata(category, generatorState) {
      var generator = category && category.generator
      if (!generator ||
         !Number.isSafeInteger(generator.start) ||
         !Number.isSafeInteger(generator.initial) ||
         generator.initial < generator.start) return undefined

      var current
      if (generatorState instanceof Map) {
         current = generatorState.get(category.id)
      } else if (generatorState && Object.prototype.hasOwnProperty.call(generatorState, category.id)) {
         current = generatorState[category.id]
      }
      if (current && typeof current === 'object') current = current.current
      var maximum = Number.isSafeInteger(generator.maximum)
         ? generator.maximum : Math.max(generator.initial, MAX_GENERATOR_VALUE)
      if (!Number.isSafeInteger(current) || current < generator.start || current > maximum) {
         current = generator.initial
      }

      return {
         categoryId: category.id,
         start: generator.start,
         initial: generator.initial,
         current: current,
      }
   }

   function markParameterGenerator(folder, notation, generatorState) {
      var definition = notation && notation.parameterGenerator
      if (!folder || !definition || typeof definition !== 'object') return
      var id = typeof definition.id === 'string' && definition.id ? definition.id : notation.id
      var metadata = generatorMetadata({ id: id, generator: definition }, generatorState)
      if (!metadata) return
      if (typeof notation.nHelp === 'string' && notation.nHelp) metadata.help = notation.nHelp
      if (!folder.generator || folder.generator.categoryId === metadata.categoryId) {
         folder.generator = metadata
      }
   }

   function markRemoteFolder(folder, category, generatorState) {
      folder.categoryId = category.id
      var generator = generatorMetadata(category, generatorState)
      if (generator) folder.generator = generator
      return folder
   }

   function findGeneratorFolder(nodes, categoryId) {
      for (var index = 0; index < nodes.length; index++) {
         var node = nodes[index]
         if (node.kind === 'notation') continue
         if (node.generator && node.generator.categoryId === categoryId) return node
         var nested = findGeneratorFolder(node.children, categoryId)
         if (nested) return nested
      }
      return undefined
   }

   function getOrCreateRemoteFolder(children, category, depth, generatorState) {
      var label = categoryLabel(category)
      var key = depth === 0 ? 'builtin-folder:' + label : 'remote-category:' + category.id
      for (var index = 0; index < children.length; index++) {
         if (children[index].key === key) {
            return markRemoteFolder(children[index], category, generatorState)
         }
      }

      var folder = markRemoteFolder(folderNode(
         key,
         label,
         'builtin',
         [category.id, category.name, category.simple_name].filter(Boolean).join(' ')
      ), category, generatorState)
      if (depth !== 0) {
         children.push(folder)
         return folder
      }

      var insertAt = children.length
      for (var rootIndex = 0; rootIndex < children.length; rootIndex++) {
         if (children[rootIndex].origin !== 'builtin' || children[rootIndex].label > label) {
            insertAt = rootIndex
            break
         }
      }
      children.splice(insertAt, 0, folder)
      return folder
   }

   function buildTree(options) {
      options = options || {}
      var catalog = options.catalog || []
      var getNotation = options.getNotation || function () {}
      var getOwner = options.getOwner || function () {}
      var allNotations = options.notations || []
      var localFiles = options.localFiles || []
      var entriesForOwner = options.entriesForOwner || function () { return [] }
      var builtinLabel = options.builtinLabel || 'Built-in'
      var localLabel = options.localLabel || 'Local files'
      var remoteCategories = options.remoteCategories || []
      var remoteNotationIds = options.remoteNotationIds || []
      var generatorState = options.generatorState || {}
      var roots = []
      var seen = Object.create(null)
      var categoriesById = Object.create(null)
      var categoryOrder = Object.create(null)
      var notationOrder = Object.create(null)
      var remotePending = []

      remoteCategories.forEach(function (category, index) {
         if (!category || typeof category.id !== 'string') return
         categoriesById[category.id] = category
         categoryOrder[category.id] = index
      })
      remoteNotationIds.forEach(function (id, index) { notationOrder[id] = index })

      catalog.forEach(function (record) {
         var notations = (record.mainIds || []).map(getNotation).filter(Boolean)
         if (!notations.length) return

         var standardNotations = []
         notations.forEach(function (notation) {
            seen[notation.id] = true
            var categoryId = upstreamCategoryId(notation, categoriesById)
            if (categoryId) {
               remotePending.push({
                  notation: notation,
                  categoryId: categoryId,
                  sourcePath: record.path,
                  fileName: record.fileName,
               })
            } else {
               standardNotations.push(notation)
            }
         })
         if (!standardNotations.length) return

         var directories = (record.directories || []).slice()
         var children = roots
         var containingFolder
         var directoryPath = []
         if (!directories.length) directories.push(builtinLabel)
         directories.forEach(function (directory, index) {
            directoryPath.push(directory)
            var pathKey = record.directories && record.directories.length
               ? directoryPath.join('/')
               : '@root'
            var folder = getOrCreateFolder(
               children,
               'builtin-folder:' + pathKey,
               directory,
               'builtin',
               directoryPath.join(' ')
            )
            containingFolder = folder
            children = folder.children
         })

         standardNotations.forEach(function (notation) {
            children.push(notationNode(notation, 'builtin', record.path, record.fileName))
            markParameterGenerator(containingFolder, notation, generatorState)
         })
      })

      allNotations.forEach(function (notation) {
         if (seen[notation.id] || getOwner(notation.id) !== BUILTIN_OWNER) return
         var generatedFamily = notation.generatedFamily
         if (generatedFamily && typeof generatedFamily.categoryId === 'string') {
            var generatedFolder = findGeneratorFolder(roots, generatedFamily.categoryId)
            if (generatedFolder) {
               seen[notation.id] = true
               generatedFolder.children.push(notationNode(notation, 'builtin', '', ''))
               return
            }
         }
         var categoryId = upstreamCategoryId(notation, categoriesById)
         if (!categoryId) return
         seen[notation.id] = true
         remotePending.push({
            notation: notation,
            categoryId: categoryId,
            sourcePath: '',
            fileName: '',
         })
      })

      remotePending.sort(function (left, right) {
         var leftPath = categoryPath(categoriesById, left.categoryId)
         var rightPath = categoryPath(categoriesById, right.categoryId)
         var common = Math.min(leftPath.length, rightPath.length)
         for (var index = 0; index < common; index++) {
            var leftCategoryOrder = categoryOrder[leftPath[index].id]
            var rightCategoryOrder = categoryOrder[rightPath[index].id]
            var categoryDifference = leftCategoryOrder - rightCategoryOrder
            if (categoryDifference) return categoryDifference
         }
         if (leftPath.length !== rightPath.length) return leftPath.length - rightPath.length
         var leftSourceId = left.notation.provenance && left.notation.provenance.notationId
         var rightSourceId = right.notation.provenance && right.notation.provenance.notationId
         var leftOrder = Object.prototype.hasOwnProperty.call(notationOrder, leftSourceId)
            ? notationOrder[leftSourceId] : Number.MAX_SAFE_INTEGER
         var rightOrder = Object.prototype.hasOwnProperty.call(notationOrder, rightSourceId)
            ? notationOrder[rightSourceId] : Number.MAX_SAFE_INTEGER
         if (leftOrder !== rightOrder) return leftOrder - rightOrder

         var leftGeneratorIndex = left.notation.upstreamGenerator && left.notation.upstreamGenerator.index
         var rightGeneratorIndex = right.notation.upstreamGenerator && right.notation.upstreamGenerator.index
         if (Number.isSafeInteger(leftGeneratorIndex) && Number.isSafeInteger(rightGeneratorIndex) &&
            leftGeneratorIndex !== rightGeneratorIndex) return leftGeneratorIndex - rightGeneratorIndex
         if (Number.isSafeInteger(leftGeneratorIndex) !== Number.isSafeInteger(rightGeneratorIndex)) {
            return Number.isSafeInteger(leftGeneratorIndex) ? 1 : -1
         }
         return String(left.notation.id).localeCompare(String(right.notation.id))
      })

      remotePending.forEach(function (pending) {
         var path = categoryPath(categoriesById, pending.categoryId)
         if (!path.length) return
         var children = roots
         path.forEach(function (category, depth) {
            var folder = getOrCreateRemoteFolder(children, category, depth, generatorState)
            children = folder.children
         })
         children.push(notationNode(
            pending.notation,
            'builtin',
            pending.sourcePath,
            pending.fileName
         ))
      })

      var uncategorized
      allNotations.forEach(function (notation) {
         if (seen[notation.id] || getOwner(notation.id) !== BUILTIN_OWNER) return
         if (!uncategorized) {
            uncategorized = getOrCreateFolder(
               roots,
               'builtin-folder:@uncategorized',
               builtinLabel,
               'builtin',
               builtinLabel
            )
         }
         seen[notation.id] = true
         uncategorized.children.push(notationNode(notation, 'builtin', '', ''))
      })

      var localRoot
      localFiles.forEach(function (file) {
         if (!file || !file.enabled) return
         var entries = entriesForOwner(file.id).filter(Boolean)
         if (!entries.length) return
         if (!localRoot) {
            localRoot = folderNode('local-root', localLabel, 'local', localLabel)
            roots.push(localRoot)
         }
         var fileFolder = folderNode(
            'local-file:' + file.id,
            file.name,
            'local-file',
            file.name
         )
         entries.forEach(function (notation) {
            fileFolder.children.push(notationNode(notation, 'local', file.name, file.name))
         })
         localRoot.children.push(fileFolder)
      })

      return roots
   }

   function matches(node, query) {
      return node.searchText.indexOf(query) !== -1
   }

   function filterNode(node, query, includeAll) {
      var includeChildren = includeAll || matches(node, query)
      if (node.kind === 'notation') return includeChildren ? node : null

      var children = []
      node.children.forEach(function (child) {
         var filtered = filterNode(child, query, includeChildren)
         if (filtered) children.push(filtered)
      })
      if (!children.length) return null
      return Object.assign({}, node, { children: children })
   }

   function filterTree(nodes, query) {
      query = normalizeSearch(query)
      if (!query) return nodes
      return nodes.map(function (node) {
         return filterNode(node, query, false)
      }).filter(Boolean)
   }

   function countNotations(node) {
      if (node.kind === 'notation') return 1
      return node.children.reduce(function (count, child) {
         return count + countNotations(child)
      }, 0)
   }

   function flattenTree(nodes, expanded, query) {
      var searching = !!normalizeSearch(query)
      var rows = []
      expanded = expanded || {}

      function walk(node, depth, parentKey) {
         if (node.kind === 'notation') {
            rows.push(Object.assign({}, node, {
               depth: depth,
               level: depth + 1,
               parentKey: parentKey || '',
            }))
            return
         }

         var open = searching || !!expanded[node.key]
         rows.push(Object.assign({}, node, {
            children: undefined,
            depth: depth,
            level: depth + 1,
            parentKey: parentKey || '',
            expanded: open,
            count: countNotations(node),
         }))
         if (open) {
            node.children.forEach(function (child) {
               walk(child, depth + 1, node.key)
            })
         }
      }

      filterTree(nodes, query).forEach(function (node) { walk(node, 0, '') })
      return rows
   }

   function ancestorKeysForNotation(nodes, notationId) {
      function find(node, ancestors) {
         if (node.kind === 'notation') return node.id === notationId ? ancestors : null
         var next = ancestors.concat(node.key)
         for (var index = 0; index < node.children.length; index++) {
            var result = find(node.children[index], next)
            if (result) return result
         }
         return null
      }

      for (var index = 0; index < nodes.length; index++) {
         var result = find(nodes[index], [])
         if (result) return result
      }
      return []
   }

   return {
      BUILTIN_OWNER: BUILTIN_OWNER,
      buildTree: buildTree,
      filterTree: filterTree,
      flattenTree: flattenTree,
      countNotations: countNotations,
      ancestorKeysForNotation: ancestorKeysForNotation,
   }
})
