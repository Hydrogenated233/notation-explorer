;
/**
 * Parented Predecessor Sequence 4 (PPS4)
 *
 * 极限表达式：0,1,2,3,4,5,...
 * 列标从1开始。
 *
 * 坏根：列标等于(末项的值)的项。如果末项是0，则表示后继序数。
 * L = y - b  (末项列标 - 坏根的值)
 * b = 坏根的值
 * x = 末项的值
 * y = 末项的列标
 *
 * 末项展开：
 *   弱展开条件：末项和坏根之间(两边都不含)存在一项，它的值等于b
 *   弱展开：将末项的值换成b
 *   强展开：在第b列和第x列(都不含)之间找到最右侧的值≤b的项，将末项的值换为这个项的列标；如果找不到，则等同弱展开
 *
 * 其他项展开：对任意的 i > y - L，如果第i项的值 ≥ x，则第i+L项的值 = 第i项的值 + L，否则第i+L项的值 = 第i项的值
 *
 * 基本列[n]：展开到第 y + n*L - 1 项
 */

(function () {
  var data = {};

  function expand(seq, FSterm) {
    if (seq.length === 0) return [];

    var y = seq.length;         // 末项列标（1-indexed）
    var x = seq[y - 1];         // 末项的值

    // 末项为0 → 后继序数
    if (x === 0) {
      return seq.slice(0, -1);
    }

    // 坏根列标 = x（1-indexed），索引 = x - 1
    var badRootIndex = x - 1;
    if (badRootIndex < 0 || badRootIndex >= y - 1) {
      // 坏根不在序列中，删末项
      return seq.slice(0, -1);
    }

    var b = seq[badRootIndex];  // 坏根的值
    var L = y - b;              // L = 末项列标 - 坏根的值

    // --- 末项展开 ---
    // 检查弱展开：末项和坏根之间(两边都不含)是否存在一项值等于b
    var weakExpand = false;
    for (var i = badRootIndex + 2; i < y; i++) {
      if (seq[i - 1] === b) {
        weakExpand = true;
        break;
      }
    }

    // 先拷贝序列，再修改末项
    var result = seq.slice();

    if (weakExpand) {
      // 弱展开：末项值换成b
      result[y - 1] = b;
    } else {
      // 强展开：在第b列和第x列(都不含)之间找最右侧的值≤b的项
      // 索引范围：b 到 x-2（1-indexed的b到x-1之间）
      var found = -1;
      for (var i = x - 2; i >= b; i--) {
        if (seq[i] <= b) {
          found = i + 1;  // 列标
          break;
        }
      }
      if (found !== -1) {
        result[y - 1] = found;  // 末项值换为找到项的列标
      } else {
        // 找不到，等同弱展开
        result[y - 1] = b;
      }
    }

    // --- 其他项展开 ---
    // 目标长度：y + FSterm * L - 1
    var targetLen = y + FSterm * L - 1;
    // 从 i > y - L 开始，即 i = y - L + 1 (1-indexed)
    var startI = y - L + 1; // 1-indexed

    // 从原始序列的索引 startI-1 开始，追加到 targetLen
    // 注意此时 result 长度 = y（末项已修改但没追加新项）
    for (var i = startI; result.length < targetLen; i++) {
      var idx = i - 1; // 0-indexed
      if (idx >= result.length) break;

      var val = result[idx];
      var newVal;
      if (val >= x) {
        newVal = val + L;
      } else {
        newVal = val;
      }
      result.push(newVal);
    }

    return result;
  }

  function sequence_compare(seq1, seq2) {
    if (seq1.length === 0) {
      if (seq2.length === 0) return 0;
      else return -1;
    } else {
      if (seq2.length === 0) return 1;
      else {
        if (seq1[0] < seq2[0]) return -1;
        else if (seq1[0] > seq2[0]) return 1;
        else return sequence_compare(seq1.slice(1), seq2.slice(1));
      }
    }
  }

  register.push({
    id: 'pps4',
    name: 'Parented Predecessor Sequence 4',
    display: function (expr) {
      if ('' + expr === 'Infinity') return 'Limit';
      return '' + expr;
    },
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      var result = str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal PPS4 sequence");
      return result;
    },
    able: function (seq) {
      return seq.length > 0 && seq[seq.length - 1] > 0;
    },
    compare: sequence_compare,
    FS: (function () {
      var cache = {};
      return function (seq, FSterm) {
        var key = '' + seq;
        if (key === 'Infinity') {
          var result = [];
          for (var i = 0; i < FSterm; i++) result.push(i);
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
        { expr: [], low: [[]], subitems: [] },
      ];
    },
  });
})();
