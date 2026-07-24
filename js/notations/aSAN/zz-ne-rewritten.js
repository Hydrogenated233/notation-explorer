;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      decorate: ['asan-1', 'asan-2', 'asan-3', 'asan-tilde3plus'],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
