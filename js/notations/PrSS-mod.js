;
var seq_compare_PrSS = (seq1, seq2) => {
   if (seq1.length === 0) {
      if (seq2.length === 0) return 0;
      else return -1;
   } else {
      if (seq2.length === 0) return 1;
      else {
         if (seq1[0] < seq2[0]) return -1;
         else if (seq1[0] > seq2[0]) return 1;
         else return seq_compare_PrSS(seq1.slice(1), seq2.slice(1));
      }
   }
};

function findBadRoot_PrSS(arr, val) {
   for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] < val) return i + 1;
   }
   return null;
}

function findDoubleBadRoot_PrSS(arr, lastVal) {
   const r = findBadRoot_PrSS(arr.slice(0, -1), lastVal);
   if (r === null) return null;
   if (r <= 1) return r;
   const rVal = arr[r - 1];
   const prefix = arr.slice(0, r - 1);
   const rPrime = findBadRoot_PrSS(prefix, rVal);
   return rPrime !== null ? rPrime : r;
}

function expand_PrSS(seq, FSterm) {
   if (seq.length === 0) return [];
   const last = seq[seq.length - 1];
   if (last === 1) {
      return seq.slice(0, -1);
   }
   const k = findDoubleBadRoot_PrSS(seq, last);
   if (k === null) {
      return seq.slice(0, -1).concat(last - 1);
   }
   const G = seq.slice(0, k - 1);
   const B = seq.slice(k - 1, seq.length - 1);
   if (B.length === 0) {
      return seq.slice(0, -1).concat(last - 1);
   }
   let result = G.slice();
   for (let i = 0; i < FSterm; i++) {
      result = result.concat(B);
   }
   return result;
}

(function(){
   var data = {};
   register.push({
      id: 'prss-mod',
      name: 'PrSS改 (坏根的坏根)',
      display: function(expr) {
         if ('' + expr === 'Infinity') return 'Limit';
         return '' + expr;
      },
      fromDisplay: function(str) {
         str = str.trim();
         if (str === 'Limit') return [Infinity];
         var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });
         if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal PrSS sequence");
         return result;
      },
      able: function(seq) {
         return seq.length > 0 && seq[seq.length - 1] > 1;
      },
      compare: seq_compare_PrSS,
      FS: function(seq, FSterm) {
         var datakey = '' + seq;
         if (datakey === 'Infinity') {
            var result = [];
            for (var i = 0; i < FSterm; i++) result.push(i + 1);
            return result;
         }
         if (seq.length === 0) return [];
         if (!data[datakey]) data[datakey] = [];
         else if (data[datakey][FSterm] !== undefined) return data[datakey][FSterm];
         return data[datakey][FSterm] = expand_PrSS(seq, FSterm);
      },
      FSalter: function(seq, FSterm) {
         return this.FS(seq, FSterm);
      },
      init: function() {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ];
      },
   });
})();
