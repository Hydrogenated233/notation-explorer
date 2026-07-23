;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: ['-1y', 't--1y', '0y'],
      decorate: [
         'y-seq',
         'omega-y-weak',
         'omega-y-medium',
         'omega-y-strong',
         { targetId: 'omega-y', sourceId: 'omega-y-actual' },
      ],
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
