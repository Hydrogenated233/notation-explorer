;(function (root) {
   'use strict'
   root.SmileLeeNotationAdapter.install(root.register, {
      add: [
         'a-omega2-mn-2',
         'weak-a-omega2-mn-2',
         'a-omega2-mn-3',
         'weak-a-omega2-mn-3',
      ],
      decorate: ['omega-mn', 't-omega-mn'],
   }, root.SmileLeeNotationBundle)
   root.register.get('a-omega2-mn').credit_text_id = 'credit.hypcos_mn'
   root.register.get('wa-omega2-mn').credit_text_id = 'credit.hypcos_mn'
})(typeof globalThis !== 'undefined' ? globalThis : this)
