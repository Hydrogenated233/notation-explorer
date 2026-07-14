;(function(root, factory) {
   var api = factory();

   if (typeof module === 'object' && module.exports) {
      module.exports = api;
   }
   if (root) {
      root.PrSSTemplate = api;
   }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
   'use strict';

   var DEFAULT_ID = 'prss';
   var DEFAULT_NAME = 'PrSS';
   var SOURCE_TEMPLATE = String.raw`// PrSS - Primitive Sequence System
// A complete, self-contained notation file compatible with register.push(...).
;(function() {
   'use strict';

   // Return the 1-based position of the rightmost term below the final term.
   function findBadRoot(seq, last) {
      for (var index = seq.length - 1; index >= 0; index--) {
         if (seq[index] < last) return index + 1;
      }
      return null;
   }

   // Compute term n of the fundamental sequence. This is the standard PrSS
   // expansion algorithm; the cache below only avoids repeating this work.
   function expand(seq, n) {
      if (seq.length === 0) return [];

      var last = seq[seq.length - 1];
      if (last <= 1) return seq.slice(0, -1);

      var badRoot = findBadRoot(seq, last);
      if (badRoot === null) return seq.slice(0, -1);

      var goodPart = seq.slice(0, badRoot - 1);
      var badPart = seq.slice(badRoot - 1, seq.length - 1);
      if (badPart.length === 0) {
         return seq.slice(0, -1).concat(last - 1);
      }

      var result = goodPart.slice();
      for (var index = 0; index < n; index++) {
         result = result.concat(badPart);
      }
      return result;
   }

   function compareSequences(left, right) {
      var length = Math.min(left.length, right.length);
      for (var index = 0; index < length; index++) {
         if (left[index] < right[index]) return -1;
         if (left[index] > right[index]) return 1;
      }
      if (left.length < right.length) return -1;
      if (left.length > right.length) return 1;
      return 0;
   }

   function parseSequence(value) {
      var source = String(value).trim();
      if (source === 'Limit') return [Infinity];
      if (source === '') return [];

      return source.split(',').map(function(part) {
         var token = part.trim();
         if (!/^(?:0|[1-9]\d*)$/.test(token)) {
            throw new Error('Illegal PrSS sequence');
         }

         var term = Number(token);
         if (!Number.isSafeInteger(term)) {
            throw new Error('Illegal PrSS sequence');
         }
         return term;
      });
   }

   register.push({
      id: __PRSS_ID_LITERAL__,
      name: __PRSS_NAME_LITERAL__,

      display: function(expr) {
         return String(expr) === 'Infinity' ? 'Limit' : String(expr);
      },

      fromDisplay: parseSequence,

      able: function(seq) {
         return seq.length > 0 && seq[seq.length - 1] > 1;
      },

      compare: compareSequences,

      FS: (function() {
         var cache = Object.create(null);

         return function(seq, n) {
            if (!Number.isInteger(n) || n < 0) {
               throw new Error('PrSS fundamental-sequence index must be a non-negative integer');
            }

            // Limit[n] is [1, ..., n], so it contains exactly n terms.
            if (String(seq) === 'Infinity') {
               var limitTerm = [];
               for (var index = 0; index < n; index++) limitTerm.push(index + 1);
               return limitTerm;
            }

            if (!Array.isArray(seq)) throw new Error('Illegal PrSS sequence');
            if (seq.length === 0) return [];

            var key = JSON.stringify(seq);
            var entries = cache[key];
            if (!entries) entries = cache[key] = [];
            if (Object.prototype.hasOwnProperty.call(entries, n)) return entries[n];

            var result = expand(seq, n);
            entries[n] = result;
            return result;
         };
      })(),

      init: function() {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ];
      },
   });
})();
`;

   function validateId(id) {
      if (typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) {
         throw new TypeError('PrSS template id must use lowercase letters, digits, and hyphens');
      }
   }

   function validateName(name) {
      if (typeof name !== 'string' || name.trim() === '' || name.trim() !== name) {
         throw new TypeError('PrSS template name must be a non-empty trimmed string');
      }
   }

   function toJavaScriptString(value) {
      var body = JSON.stringify(value).slice(1, -1)
         .replace(/'/g, "\\'")
         .replace(/\u2028/g, '\\u2028')
         .replace(/\u2029/g, '\\u2029');
      return "'" + body + "'";
   }

   function generateSource(options) {
      options = options || {};
      var id = options.id === undefined ? DEFAULT_ID : options.id;
      var name = options.name === undefined ? DEFAULT_NAME : options.name;
      validateId(id);
      validateName(name);

      return SOURCE_TEMPLATE
         .replace('__PRSS_ID_LITERAL__', toJavaScriptString(id))
         .replace('__PRSS_NAME_LITERAL__', toJavaScriptString(name));
   }

   return Object.freeze({
      DEFAULT_ID: DEFAULT_ID,
      DEFAULT_NAME: DEFAULT_NAME,
      DEFAULT_SOURCE: generateSource(),
      generateSource: generateSource,
   });
});
