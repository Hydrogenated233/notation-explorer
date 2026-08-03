;
/**
 * extremely weak PPS4 (ewPPS4)
 *
 * 与 wPPS4 的区别：强展开扫描时，找到值 === b 就返回，但如果遇到 < b 的值则提前停止。
 * 即从右到左扫描 (x-2) → b，找到第一个 === b 的项；但如果在找到 === b 之前遇到了 < b，
 * 则停止并返回 b（退化为弱展开）。
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
 *   强展开：在第b列和第x列(都不含)之间从右向左扫描，找到第一个值等于b的项；
 *           但如果遇到值小于b的项则停止扫描（等同于找不到）。
 *           若找到，末项换为该项的列标；否则等同弱展开
 *
 * 其他项展开：同 PPS4 规则
 *
 * 基本列[n]：展开到第 y + n*L 项
 */

(function () {
  var data = {};

  function expand(seq, FSterm) {
    if (seq.length === 0) return [];

    var y = seq.length;
    var x = seq[y - 1];

    if (x === 0) return seq.slice(0, -1);
    if (x > y) return seq.slice(0, -1);

    var b = seq[x - 1];
    var L = y - x;

    // 弱展开检测
    var weakExpand = false;
    for (var i = x + 1; i < y; i++) {
      if (seq[i - 1] === b) { weakExpand = true; break; }
    }

    var v;
    if (weakExpand) {
      v = b;
    } else {
      // 强展开：从右向左扫描，找到第一个 === b 的项
      // 但如果遇到 < b 的项则立即停止（相当于没找到）
      var foundCol = -1;
      for (var i = x - 2; i >= b; i--) {
        if (seq[i] === b) {
          foundCol = i + 1;
          break;
        }
        if (seq[i] < b) break;  // ← ewPPS4 的区别：遇到 < b 就停
      }
      v = (foundCol !== -1) ? foundCol : b;
    }

    var totalLen = y + FSterm * L;
    var res = seq.slice(0, y - 1);
    res.push(v);

    var startI = y - L + 1;
    for (var i = startI; res.length < totalLen; i++) {
      var idx = i - 1;
      if (idx >= res.length) break;
      var val = res[idx];
      res.push(val >= x ? val + L : val);
    }

    return res;
  }

  register.push({
    id: 'ewpps4',
    name: 'Extremely Weak PPS4',
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
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal ewPPS4 sequence");
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
