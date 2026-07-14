;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationFileIndex = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var MAX_CATEGORY_DEPTH = 4

   function compareText(left, right) {
      if (left < right) return -1
      if (left > right) return 1
      return 0
   }

   function normalizePath(value) {
      if (typeof value !== 'string' || value.length === 0) {
         throw new TypeError('A non-empty notation path is required.')
      }

      var normalized = value.replace(/\\/g, '/').replace(/^\.\//, '')
      var parts = normalized.split('/')
      if (parts.some(function (part) { return !part || part === '.' || part === '..' })) {
         throw new Error('Notation paths must stay inside js/notations: ' + value)
      }
      if (parts.length - 1 > MAX_CATEGORY_DEPTH) {
         throw new Error(
            'Notation paths support at most ' + MAX_CATEGORY_DEPTH + ' category levels: ' + value
         )
      }
      return parts.join('/')
   }

   function isEnabledPath(value) {
      return normalizePath(value).endsWith('.js')
   }

   function isExcludedPath(value) {
      return normalizePath(value).endsWith('.js.disable')
   }

   function comparePaths(left, right) {
      var leftParts = normalizePath(left).split('/')
      var rightParts = normalizePath(right).split('/')
      var leftFile = leftParts.pop()
      var rightFile = rightParts.pop()

      for (var level = 0; level < MAX_CATEGORY_DEPTH; level++) {
         var categoryResult = compareText(leftParts[level] || '', rightParts[level] || '')
         if (categoryResult) return categoryResult
      }
      return compareText(leftFile, rightFile)
   }

   function sortPaths(paths) {
      if (!Array.isArray(paths)) throw new TypeError('Notation paths must be an array.')
      return paths.map(normalizePath).sort(comparePaths)
   }

   return {
      MAX_CATEGORY_DEPTH: MAX_CATEGORY_DEPTH,
      normalizePath: normalizePath,
      isEnabledPath: isEnabledPath,
      isExcludedPath: isExcludedPath,
      comparePaths: comparePaths,
      sortPaths: sortPaths,
   }
})
