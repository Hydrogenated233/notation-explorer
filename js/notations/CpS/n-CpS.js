;
(function () {
  var data = {};

  // 生成前n个素数
  function firstNPrimes(n) {
    var primes = [];
    var num = 2;
    while (primes.length < n) {
      var isPrime = true;
      for (var p = 0; p < primes.length && primes[p] * primes[p] <= num; p++) {
        if (num % primes[p] === 0) { isPrime = false; break; }
      }
      if (isPrime) primes.push(num);
      num++;
    }
    return primes;
  }

  // p-gcd: 仅考虑给定素数集的公因数
  function pGcd(a, b, primes) {
    var result = 1;
    for (var i = 0; i < primes.length; i++) {
      var p = primes[i];
      if (a % p === 0 && b % p === 0) {
        var count = 0;
        while (a % p === 0 && b % p === 0) { a /= p; b /= p; count++; }
        result *= Math.pow(p, count);
      }
    }
    return result;
  }

  // 找祖先链
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

  // n-CpS 坏根：祖先中最靠右的与末项没有前 n 个素数中公因数的项
  function findNCpSBadRoot(seq) {
    var lastVal = seq[seq.length - 1];
    var nVal = window.nCpSN || 2;
    var primes = firstNPrimes(nVal);
    var ancestors = findAncestors(seq, seq.length - 1);
    for (var i = 0; i < ancestors.length; i++) {
      var aIdx = ancestors[i];
      if (pGcd(seq[aIdx], lastVal, primes) === 1) return aIdx + 1;
    }
    return null;
  }

  function expandNCpS(seq, FSterm) {
    if (seq.length === 0) return [];
    var lastVal = seq[seq.length - 1];
    var rootIdx = findNCpSBadRoot(seq);
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
    id: 'n-cps',
    name: 'n-CpS',
    nParam: true,
    nHelp: 'n-CpS: 坏根搜索时仅考虑前 n 个素数 (2,3,5,...)，末项与祖先项的 $p_n$-gcd 为 1 时视为互素',
    display: sequence_display,
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      var result = str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal n-CpS sequence");
      return result;
    },
    able: function (seq) {
      return seq.length > 0 && seq[seq.length - 1] > 1;
    },
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
        return cache[key][n] = expandNCpS(seq, n);
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
