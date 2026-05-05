// DFSS — Double-First Sequence System
// A PrSS variant: bad root is the second occurrence of (last-1) from the right,
// if it exists; otherwise the first (standard PrSS bad root).
;(()=>{
   // Standard PrSS bad root: rightmost element < last
   function findFirstBadRoot(arr, lastVal) {
      for (let i = arr.length - 1; i >= 0; i--) {
         if (arr[i] < lastVal) return i + 1; // 1-indexed position
      }
      return null;
   }

   // DFSS bad root: find the second occurrence of (lastVal - 1) from the right,
   // counting only elements directly equal to lastVal - 1.
   // If it exists, use that position; otherwise use the first occurrence (standard).
   function findDFSSBadRoot(arr, lastVal) {
      var target = lastVal - 1;
      var count = 0;
      var secondPos = null;
      var firstPos = null;

      for (let i = arr.length - 1; i >= 0; i--) {
         if (arr[i] === target) {
            count++;
            if (count === 1) {
               firstPos = i + 1; // 1-indexed
            } else if (count === 2) {
               secondPos = i + 1; // 1-indexed
               break;
            }
         }
      }

      // If we found a second occurrence of (last - 1), use it as bad root
      if (secondPos !== null) return secondPos;

      // Otherwise fall back to standard PrSS bad root
      return findFirstBadRoot(arr, lastVal);
   }

   function expand(seq, FSterm) {
      if (seq.length === 0) return [];
      var last = seq[seq.length - 1];
      if (last <= 1) {
         return seq.slice(0, -1);
      }
      var k = findDFSSBadRoot(seq, last);
      if (k === null) {
         return seq.slice(0, -1).concat(last - 1);
      }
      var G = seq.slice(0, k - 1);
      var B = seq.slice(k - 1, seq.length - 1);
      if (B.length === 0) {
         return seq.slice(0, -1).concat(last - 1);
      }
      var result = G.slice();
      for (let i = 0; i < FSterm; i++) {
         result = result.concat(B);
      }
      return result;
   }

   register.push({
      id: 'dfss',
      name: 'DFSS (Double-First Sequence System)',
      display: function(expr) {
         if ('' + expr === 'Infinity') return 'Limit';
         return '' + expr;
      },
      fromDisplay: function(str) {
         str = str.trim();
         if (str === 'Limit') return [Infinity];
         var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });
         if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal DFSS sequence");
         return result;
      },
      able: function(seq) {
         return seq.length > 0 && seq[seq.length - 1] > 1;
      },
      compare: sequence_compare,
      FS: function(seq, FSterm) {
         if ('' + seq === 'Infinity') {
            var result = [];
            for (var i = 0; i < FSterm; i++) result.push(i + 1);
            return result;
         }
         if (seq.length === 0) return [];
         return expand(seq, FSterm);
      },
      init: function() {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ];
      },
   });
})();
