;
/**
 * HPRRS
 *
 * 形式：逗号分隔的非负整数序列，首项固定为 0。
 * 极限表达式：0,1,1,1,1,1,...
 *
 * 列标从1开始。
 *
 * 算法：
 *   z = 序列长度, y = 末项的值
 *   若 y <= 首项 → 后继序数
 *   坏根列标 = y
 *   x = seq[y-1]（坏根处的值）
 *   badPart = seq[y-1 .. z-2]（坏根到倒数第二项）
 *   L = badPart.length
 *   isWeakExpansion = (末项的左侧项 === 0)
 *
 *   弱展开：复制 badPart，值 <= x 的不变，> x 的加 k×L
 *   强展开：找到末项左侧最靠右的 0，使用指针追踪式展开
 *
 * 基本列[n]：结果长度为 z-1 + n*L
 */

(function () {
  var data = {};

  function expand(seq, FSterm) {
    if (seq.length === 0) return [];
    var z = seq.length;
    var y = seq[z - 1];

    // 末项 ≤ 首项 → 后继
    if (y <= seq[0]) return seq.slice(0, -1);
    if (y > z - 1) return seq.slice(0, -1);

    var leftOfLast = seq[z - 2];
    var badRootIdx = y;                     // 1-indexed
    var x = seq[badRootIdx - 1];            // 坏根处的值
    var badPart = seq.slice(badRootIdx - 1, z - 1);
    var L = badPart.length;
    var isWeak = leftOfLast === 0;

    // 保存原始序列的副本（强展开需要引用原始值）
    var seqOriginal = seq.slice();

    // 删去末项
    var result = seq.slice(0, -1);

    if (isWeak) {
      // 弱展开
      for (var k = 1; k <= FSterm; k++) {
        for (var i = 0; i < L; i++) {
          var v = badPart[i];
          result.push(v <= x ? v : v + k * L);
        }
      }
    } else {
      // 强展开
      // 找末项左侧第一个 0
      var zeroIdx0Based = -1;
      for (var i = z - 2; i >= 0; i--) {
        if (seqOriginal[i] === 0) {
          zeroIdx0Based = i;
          break;
        }
      }
      if (zeroIdx0Based === -1) zeroIdx0Based = 0;

      // 指针追踪
      var ptr = zeroIdx0Based + 2; // pStart1Based

      var getNextTarget = function () {
        while (ptr <= result.length) {
          if (result[ptr - 1] > x) {
            var t = ptr;
            ptr++;
            return t;
          }
          ptr++;
        }
        return ptr;
      };

      var isStrongItem = function (arr, idx1) {
        var v = arr[idx1 - 1];
        var leftV = idx1 >= 2 ? arr[idx1 - 2] : 0;
        return v !== 0 && leftV !== 0;
      };

      var findWeakPosLeft = function (arr, start1) {
        for (var j = start1; j >= 1; j--) {
          var v = arr[j - 1];
          var leftV = j >= 2 ? arr[j - 2] : 0;
          if (v !== 0 && leftV === 0) return j;
        }
        return start1;
      };

      for (var k = 1; k <= FSterm; k++) {
        for (var i = 0; i < L; i++) {
          var v = badPart[i];
          var currIdx1 = badRootIdx + i;
          var leftVOrig = currIdx1 >= 2 ? seqOriginal[currIdx1 - 2] : 0;
          var isSEI = v !== 0 && leftVOrig !== 0;
          var isWEI = v !== 0 && leftVOrig === 0;

          if (v <= x) {
            result.push(v);
            continue;
          }

          var isNotInBetween = currIdx1 <= zeroIdx0Based + 1;

          if (isSEI && isNotInBetween) {
            getNextTarget();
            result.push(v + k * L);
            continue;
          }

          var targetIdx = getNextTarget();

          if (isWEI && isStrongItem(result, targetIdx)) {
            targetIdx = findWeakPosLeft(result, targetIdx);
          }

          result.push(targetIdx);
        }
      }
    }

    return result;
  }

  register.push({
    id: 'hprrs',
    name: 'HPRRS',
    display: function (expr) {
      if ('' + expr === 'Infinity') return 'Limit';
      return '' + expr;
    },
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      var result = str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal HPRRS sequence");
      return result;
    },
    able: function (seq) {
      return seq.length > 0 && seq[seq.length - 1] > seq[0];
    },
    compare: sequence_compare,
    FS: (function () {
      var cache = {};
      return function (seq, FSterm) {
        var key = '' + seq;
        if (key === 'Infinity') {
          var result = [];
          for (var i = 0; i <= FSterm; i++) result.push(i);
          return result;
        }
        if (seq.length === 0) return [];
        if (!cache[key]) cache[key] = [];
        else if (cache[key][FSterm] !== undefined) return cache[key][FSterm];
        return cache[key][FSterm] = expand(seq, FSterm);
      };
    })(),
    FSalter: function (seq, FSterm) {
      return this.FS(seq, FSterm);
    },
    init: function () {
      return [
        { expr: [Infinity], low: [[]], subitems: [] },
        { expr: [0],        low: [[]], subitems: [] },
      ];
    },
  });
})();
