;(function (root) {
   'use strict'
   var version = 'BMS-20260721-v10-weirdfull-display-'
   var ids = []
   ;['GBMS', 'UPMS', 'LPMS2'].forEach(function (system) {
      ;['omega-P', 'pQSS', 'QSS', 'Full', 'Weirdly Full'].forEach(function (projection) {
         ids.push(version + system + '-' + projection)
      })
      ids.push(version + system + '-n-2-P')
      ids.push(version + system + '-n-3-P')
   })
   root.SmileLeeNotationAdapter.install(root.register, { add: ids }, root.SmileLeeNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
