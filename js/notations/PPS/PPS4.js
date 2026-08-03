;
/**
 * Parented Predecessor Sequence 4 (PPS4)
 *
 * 极限表达式：0,1,2,3,4,5,... (0开头)
 * 列标从1开始。
 *
 * 坏根：列标等于(末项的值)的项。如果末项是0，则表示后继序数。
 * L = y - x  (末项列标 - 末项的值)
 * b = 坏根的值
 * x = 末项的值
 * y = 末项的列标
 *
 * 末项展开：
 *   弱展开条件：末项和坏根之间(两边都不含)存在一项，它的值等于b
 *   弱展开：将末项的值换成b
 *   强展开：在第b列和第x列(都不含)之间找到最右侧的值小于等于b的项，将末项的值换为这个项的列标；如果找不到，则等同弱展开
 *
 * 其他项展开：对任意的 i > y-L（即 i > x），如果第i项的值大于等于x，那么第i+L项的值 = 第i项的值 + L，否则第i+L项的值 = 第i项的值
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
    if (x > y) {
      return seq.slice(0, -1);
    }

    var b = seq[x - 1];  // 坏根的值
    var L = y - x;        // L = y - x

    // --- 末项展开 ---
    // 弱展开检测：末项和坏根之间(两边都不含) —— 即第 x+1 列到第 y-1 列
    var weakExpand = false;
    for (var i = x + 1; i < y; i++) {
      if (seq[i - 1] === b) {
        weakExpand = true;
        break;
      }
    }

    // 确定末项新值 v
    var v;
    if (weakExpand) {
      // 弱展开
      v = b;
    } else {
      // 强展开：在第b列和第x列(都不含)之间找最右侧的值≤b的项
      // 列标范围：b+1 到 x-1 (1-indexed)
      // 索引范围：b 到 x-2 (0-indexed)
      var foundCol = -1;
      for (var i = x - 2; i >= b; i--) {
        if (seq[i] <= b) {
          foundCol = i + 1;
          break;
        }
      }
      v = (foundCol !== -1) ? foundCol : b;
    }

    // --- 构造结果 ---
    var totalLen = y + FSterm * L;
    var res = seq.slice(0, y - 1); // 拷贝前 y-1 项
    res.push(v);                   // 设置末项

    // 对任意的 i > y-L（即 i >= y-L+1），循环展开到 totalLen
    var startI = y - L + 1; // i > y-L 的第一个 i

    for (var i = startI; res.length < totalLen; i++) {
      var idx = i - 1; // 0-indexed
      if (idx >= res.length) break;

      var val = res[idx];
      var newVal;
      if (val >= x) {
        newVal = val + L;
      } else {
        newVal = val;
      }
      res.push(newVal);
    }

    return res;
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
    name: 'PPS4',
    display: function (expr) {
      if ('' + expr === 'Infinity') return 'Limit';
      return '' + expr;
    },
    displayPlain: sequence_display,
    displayHtml: pps_sequence_display_html,
    latex: pps_sequence_display_latex,
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
        { expr: [], low: [[]], subitems: [] },
      ];
    },
  });
})();
