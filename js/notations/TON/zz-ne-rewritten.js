;(function (root) {
   'use strict'
   root.register.installRewrittenBundle({
      decorate: [
         'ton-drc',
         'ton-drp',
         'ton-dr',
         'ton-drpc',
         'ton-i',
         'ton-ibp',
         'ton-m',
         'ton-mc',
         'ton-mpc',
      ],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
