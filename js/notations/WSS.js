;
(function() {
    var data = {};

    function compareLexicographically(arrA, arrB) {
        var minLen = Math.min(arrA.length, arrB.length);
        for (var i = 0; i < minLen; i++) {
            if (arrA[i] < arrB[i]) return -1;
            if (arrA[i] > arrB[i]) return 1;
        }
        if (arrA.length < arrB.length) return -1;
        if (arrA.length > arrB.length) return 1;
        return 0;
    }

    function findWSSBadRoot(seq) {
        var lastIdx = seq.length - 1;
        var lastVal = seq[lastIdx];

        var smallIndices = [];
        for (var i = 0; i < lastIdx; i++) {
            if (seq[i] < lastVal) {
                smallIndices.push(i);
            }
        }
        if (smallIndices.length === 0) return null;

        var secondaryIdx = smallIndices[smallIndices.length - 1];
        var boundary = seq.slice(secondaryIdx, lastIdx);

        var bestIdx = null;
        for (var j = 0; j < smallIndices.length; j++) {
            var idx = smallIndices[j];
            if (idx === secondaryIdx) continue;
            var minorPart = seq.slice(idx, secondaryIdx);
            if (compareLexicographically(minorPart, boundary) <= 0) {
                if (bestIdx === null || idx > bestIdx) {
                    bestIdx = idx;
                }
            }
        }
        return bestIdx;
    }

    function expandWSS(seq, n) {
        if (seq.length === 0) return [];
        var lastVal = seq[seq.length - 1];

        if (lastVal <= 1) {
            return seq.slice(0, -1);
        }

        var badRootIdx = findWSSBadRoot(seq);
        if (badRootIdx === null) {
            return seq.slice(0, -1);
        }

        var badRootVal = seq[badRootIdx];
        var d = lastVal - badRootVal - 1;

        var G = seq.slice(0, badRootIdx);
        var B = seq.slice(badRootIdx, seq.length - 1);

        var result = G.slice();
        for (var k = 0; k <= n; k++) {
            for (var j = 0; j < B.length; j++) {
                result.push(B[j] + d * k);
            }
        }
        return result;
    }

    register.push({
        id: 'wss',
        name: 'Wu\'s Sudden Sequence',
        display: sequence_display,
        fromDisplay: function(str) {
            str = str.trim();
            if (str === 'Limit') return [Infinity];
            var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });
            if (result.find(Number.isNaN) !== undefined) throw new Error('Illegal WSS sequence');
            return result;
        },
        able: function(seq) {
            return seq.length > 0 && seq[seq.length - 1] > 1;
        },
        compare: sequence_compare,
        FS: (function() {
            var cache = {};
            return function(seq, n) {
                var key = '' + seq;
                if (key === 'Infinity') {
                    var result = [1, 1];
                    for (var k = 2; k <= n + 1; k++) {
                        result.push(1 + k * (k - 1) / 2);
                    }
                    return result;
                }
                if (seq.length === 0) return [];
                if (!cache[key]) cache[key] = [];
                else if (cache[key][n] !== undefined) return cache[key][n];
                return cache[key][n] = expandWSS(seq, n);
            };
        })(),
        init: function() {
            return [
                { expr: [Infinity], low: [[]], subitems: [] },
                { expr: [1], low: [[]], subitems: [] },
                { expr: [], low: [[]], subitems: [] },
            ];
        },
    });
})();
