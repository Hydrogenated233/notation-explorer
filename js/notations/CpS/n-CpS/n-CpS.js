;
(function (root) {
  var GENERATOR_ID = 'n-cps';
  var START = 1;
  var INITIAL = 2;
  var MAXIMUM = 64;

  function firstNPrimes(n) {
    var primes = [];
    var num = 2;
    while (primes.length < n) {
      var isPrime = true;
      for (var p = 0; p < primes.length && primes[p] * primes[p] <= num; p++) {
        if (num % primes[p] === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(num);
      num++;
    }
    return primes;
  }

  function pGcd(a, b, primes) {
    var result = 1;
    for (var i = 0; i < primes.length; i++) {
      var prime = primes[i];
      if (a % prime === 0 && b % prime === 0) {
        var count = 0;
        while (a % prime === 0 && b % prime === 0) {
          a /= prime;
          b /= prime;
          count++;
        }
        result *= Math.pow(prime, count);
      }
    }
    return result;
  }

  function findAncestors(seq, index) {
    var ancestors = [];
    while (true) {
      var parentIndex = -1;
      for (var i = index - 1; i >= 0; i--) {
        if (seq[i] < seq[index]) {
          parentIndex = i;
          break;
        }
      }
      if (parentIndex === -1) break;
      ancestors.push(parentIndex);
      index = parentIndex;
    }
    return ancestors;
  }

  function createNotation(parameter) {
    if (!Number.isSafeInteger(parameter) || parameter < START || parameter > MAXIMUM) {
      throw new Error('n-CpS parameter must be an integer from ' + START + ' to ' + MAXIMUM + '.');
    }

    var primes = firstNPrimes(parameter);
    var cache = {};

    function findBadRoot(seq) {
      var lastValue = seq[seq.length - 1];
      var ancestors = findAncestors(seq, seq.length - 1);
      for (var i = 0; i < ancestors.length; i++) {
        var ancestorIndex = ancestors[i];
        if (pGcd(seq[ancestorIndex], lastValue, primes) === 1) return ancestorIndex + 1;
      }
      return null;
    }

    function expand(seq, fsTerm) {
      if (seq.length === 0) return [];
      var lastValue = seq[seq.length - 1];
      var rootIndex = findBadRoot(seq);
      if (rootIndex === null) {
        if (lastValue <= 1) return seq.slice(0, -1);
        return seq.slice(0, -1).concat(lastValue - 1);
      }
      var rootValue = seq[rootIndex - 1];
      var delta = lastValue - rootValue - 1;
      var goodPart = seq.slice(0, rootIndex - 1);
      var badPart = seq.slice(rootIndex - 1, seq.length - 1);
      var result = goodPart.slice();
      for (var i = 0; i <= fsTerm; i++) {
        result = result.concat(badPart.map(function (value) { return value + delta * i; }));
      }
      return result;
    }

    return {
      id: parameter + '-cps',
      name: parameter + '-CpS',
      generatedFamily: { categoryId: GENERATOR_ID, index: parameter },
      parameterGenerator: {
        id: GENERATOR_ID,
        start: START,
        initial: INITIAL,
        maximum: MAXIMUM,
      },
      nHelp: 'n-CpS family: ' + parameter + '-CpS uses the first ' + parameter +
        ' primes when testing whether the last item and an ancestor are coprime.',
      display: sequence_display,
      fromDisplay: function (str) {
        str = str.trim();
        if (str === 'Limit') return [Infinity];
        if (str === '') return [];
        var result = str.split(',').map(function (value) { return parseInt(value.trim(), 10); });
        if (result.some(Number.isNaN)) throw new Error('Illegal ' + parameter + '-CpS sequence');
        return result;
      },
      able: function (seq) {
        return seq.length > 0 && seq[seq.length - 1] > 1;
      },
      compare: sequence_compare,
      FS: function (seq, n) {
        if ('' + seq === 'Infinity') return [1, n + 1];
        if (seq.length === 0) return [];
        var key = '' + seq;
        if (!cache[key]) cache[key] = [];
        else if (cache[key][n] !== undefined) return cache[key][n];
        return cache[key][n] = expand(seq, n);
      },
      init: function () {
        return [
          { expr: [Infinity], low: [[]], subitems: [] },
          { expr: [1], low: [[]], subitems: [] },
          { expr: [], low: [[]], subitems: [] },
        ];
      },
    };
  }

  var generator = {
    id: GENERATOR_ID,
    start: START,
    initial: INITIAL,
    maximum: MAXIMUM,
    create: createNotation,
  };
  root.NotationGenerators = root.NotationGenerators || Object.create(null);
  root.NotationGenerators[GENERATOR_ID] = generator;
  register.push(createNotation(1), createNotation(2));
})(typeof window !== 'undefined' ? window : globalThis);
