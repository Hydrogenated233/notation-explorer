;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      add: ['-1y', 't--1y', '0y'],
      decorate: [
         'y-seq',
         'omega-y-weak',
         'omega-y-medium',
         'omega-y-strong',
         { targetId: 'omega-y', sourceId: 'omega-y-actual' },
      ],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
