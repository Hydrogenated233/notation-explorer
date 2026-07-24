;(function (root) {
   'use strict'
   var version = 'BMS-20260721-v10-weirdfull-display-'
   var ids = []
   ;['GBMS', 'UPMS', 'LPMS2'].forEach(function (system) {
      ;['omega-P', 'pQSS', 'QSS', 'Full', 'Weirdly Full'].forEach(function (projection) {
         ids.push(version + system + '-' + projection)
      })
   })
   root.register.installRewrittenBundle({
      add: ids,
      generators: [
         'category-GMS-20260721-v10-weirdfull-display-GBMS-n-P',
         'category-GMS-20260721-v10-weirdfull-display-UPMS-n-P',
         'category-GMS-20260721-v10-weirdfull-display-LPMS2-n-P',
      ],
   }, root.NeRewrittenNotationBundle)
})(typeof globalThis !== 'undefined' ? globalThis : this)
