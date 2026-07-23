;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: ['SA-omega2-MN', 'S-omega2-MN', 'S-omega^omega-MN'],
      decorate: [
         { targetId: 'nt-1-mn', sourceId: '1-MN' },
         { targetId: 'nt-2-mn', sourceId: '2-MN' },
         { targetId: 'nt-3-mn', sourceId: '3-MN' },
      ],
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
