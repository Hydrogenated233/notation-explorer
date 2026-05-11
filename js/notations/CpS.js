;
(function () {
  var data = {};

  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

  function findAncestors(seq, idx) {
    var ancestors = [];
    while (true) {
      var parentIdx = -1;
      for (var i = idx - 1; i >= 0; i--) {
        if (seq[i] < seq[idx]) { parentIdx = i; break; }
      }
      if (parentIdx === -1) break;
      ancestors.push(parentIdx);
      idx = parentIdx;
    }
    return ancestors;
  }

  function findCpSBadRoot(seq) {
    var lastVal = seq[seq.length - 1];
    var ancestors = findAncestors(seq, seq.length - 1);
    for (var i = 0; i < ancestors.length; i++) {
      if (gcd(seq[ancestors[i]], lastVal) === 1) return ancestors[i] + 1;
    }
    return null;
  }

  function expandCpS(seq, FSterm) {
    if (seq.length === 0) return [];
    var lastVal = seq[seq.length - 1];
    var rootIdx = findCpSBadRoot(seq);
    if (rootIdx === null) {
      if (lastVal <= 1) return seq.slice(0, -1);
      return seq.slice(0, -1).concat(lastVal - 1);
    }
    var rootVal = seq[rootIdx - 1];
    var d = lastVal - rootVal;
    var delta = d - 1;
    var G = seq.slice(0, rootIdx - 1);
    var B = seq.slice(rootIdx - 1, seq.length - 1);
    var result = G.slice();
    for (var i = 0; i <= FSterm; i++) {
      result = result.concat(B.map(function (v) { return v + delta * i; }));
    }
    return result;
  }

  register.push({
    id: 'cps',
    name: 'CpS',
    display: sequence_display,
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      return str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
    },
    able: function (seq) { return seq.length > 0 && seq[seq.length - 1] > 1; },
    compare: sequence_compare,
    FS: (function () {
      var cache = {};
      return function (seq, n) {
        var key = '' + seq;
        if (key === 'Infinity') {
          var result = [1,n+1];
          return result;
        }
        if (seq.length === 0) return [];
        if (!cache[key]) cache[key] = [];
        else if (cache[key][n] !== undefined) return cache[key][n];
        return cache[key][n] = expandCpS(seq, n);
      };
    })(),
    init: function () {
      return [
        { expr: [Infinity], low: [[]], subitems: [] },
        { expr: [1],        low: [[]], subitems: [] },
        { expr: [],         low: [[]], subitems: [] },
      ];
    },
  });
})();
