;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      decorate: ['asan-1', 'asan-2', 'asan-3', 'asan-tilde3plus'],
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
