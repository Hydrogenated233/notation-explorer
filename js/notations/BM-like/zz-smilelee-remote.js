;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: [
         'tbm',
         'lpms',
         'lptss',
         'dsm',
         'WSMv1.4.1',
         'btbm',
         'upms-partial-2',
         'upms-partial-3',
      ],
      decorate: [
         'bm4',
         'bhm',
         'bsm',
         'blm',
         'upms',
         'wmm',
         { targetId: 'cm', sourceId: 'cms', metadata: false },
      ],
   }, root.SmileLeeNotationBundle)
   root.register.get('tbm4').credit_text_id = 'credit.tbm'
})(typeof globalThis !== 'undefined' ? globalThis : this)
