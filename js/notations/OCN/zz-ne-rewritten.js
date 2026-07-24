;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      add: [
         'bocf-ebo',
         'mocf-ebo',
         'nocf-ebo',
         'inacc-ocf',
         'finite-mahlo-ocf',
         'ups1.1r5',
      ],
      decorate: ['lmn', 'lon', 'cocf', 'hspn'],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
