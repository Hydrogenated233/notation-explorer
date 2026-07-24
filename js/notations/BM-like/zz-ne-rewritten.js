;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      add: [
         'tbm',
         'lpms',
         'lptss',
         'dsm',
         'WSMv1.4.1',
         'btbm',
      ],
      generators: ['category-upms-partial'],
      decorate: [
         'bm4',
         'bhm',
         'bsm',
         'blm',
         'upms',
         'wmm',
         { targetId: 'cm', sourceId: 'cms', metadata: false },
      ],
   }, root.NeRewrittenNotationBundle)
   root.register.get('tbm4').credit_text_id = 'credit.tbm'
})(typeof globalThis !== 'undefined' ? globalThis : this)
