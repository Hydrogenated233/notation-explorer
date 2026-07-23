;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: [
         'bocf-ebo',
         'mocf-ebo',
         'nocf-ebo',
         'inacc-ocf',
         'finite-mahlo-ocf',
         'ups1.1r5',
      ],
      decorate: ['lmn', 'lon', 'cocf', 'hspn'],
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
