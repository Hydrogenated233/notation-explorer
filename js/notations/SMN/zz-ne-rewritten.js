;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      add: ['SA-omega2-MN', 'S-omega2-MN', 'S-omega^omega-MN'],
      generators: [{
         categoryId: 'category-n-mn',
         // The local non-triangular implementation keeps the historical
         // `nt-k-mn` IDs; the registry only supplies upstream metadata.
         resolveId: function (index) { return 'nt-' + index + '-mn' },
      }],
      decorate: [
         { targetId: 'nt-1-mn', sourceId: '1-MN' },
         { targetId: 'nt-2-mn', sourceId: '2-MN' },
         { targetId: 'nt-3-mn', sourceId: '3-MN' },
      ],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
