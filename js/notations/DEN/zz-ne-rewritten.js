;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      decorate: ['den', 'den2', 'den3'],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
