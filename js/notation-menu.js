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
      var roots = []
      var seen = Object.create(null)

      catalog.forEach(function (record) {
         var notations = (record.mainIds || []).map(getNotation).filter(Boolean)
         if (!notations.length) return

         var directories = (record.directories || []).slice()
         var children = roots
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
            children = folder.children
         })

         notations.forEach(function (notation) {
            seen[notation.id] = true
            children.push(notationNode(notation, 'builtin', record.path, record.fileName))
         })
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
