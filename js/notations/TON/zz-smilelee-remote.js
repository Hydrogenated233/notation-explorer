;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
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
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
