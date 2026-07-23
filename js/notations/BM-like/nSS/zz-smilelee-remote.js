;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: [
         '-1y-1ss', '-1y-2ss', '-1y-3ss', '-1y-4ss',
         't--1y-1ss', 't--1y-2ss', 't--1y-3ss', 't--1y-4ss',
         'bt--1y-1ss', 'bt--1y-2ss', 'bt--1y-3ss', 'bt--1y-4ss',
         'bt*--1y-2ss', 'bt*--1y-3ss', 'bt*--1y-4ss',
         "bt*--1y-2ss'", "bt*--1y-3ss'", "bt*--1y-4ss'",
         'btl--1y-2ss', 'btl--1y-3ss', 'btl--1y-4ss',
      ],
   }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
