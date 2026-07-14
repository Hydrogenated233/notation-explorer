;
/**
 * Parented Predecessor Sequence 4 third (tPPS4)
 *
 * 在 wPPS4 基础上增加：强展开时，由末项复制出的项加阶差(阶差等于复制宽度L)
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
 *   强展开：在第b列和第x列(都不含)之间找到最右侧的值等于b的项，将末项的值换为这个项的列标；如果找不到，则等同弱展开
 *
 * 其他项展开（强展开时）：对任意的 i > y-L（即 i > x），如果第i项是末项复制出的项（位置为 y, y+L, y+2L, ...），
 * 则其值 = v + k*L，其中 k 是副本计数（末项本身 k=0，第一个副本 k=1，...）。
 * 否则同PPS4规则。
 *
 * 基本列[n]：展开到第 y + n*L 项
 *
 * 例子:
 * t：0103=01012345...
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

    // 确定末项新值 v 和展开类型
    var v;
    var isStrong = false;
    if (weakExpand) {
      // 弱展开
      v = b;
    } else {
      // 强展开：在第b列和第x列(都不含)之间找最右侧的值等于b的项
      var foundCol = -1;
      for (var i = x - 2; i >= b; i--) {
        if (seq[i] === b) {
          foundCol = i + 1;
          isStrong = true;
          break;
        }
      }
      v = (foundCol !== -1) ? foundCol : b;
    }

    // --- 构造结果 ---
    var totalLen = y + FSterm * L;

    if (isStrong) {
      // tPPS4 强展开：末项副本位置 y + k*L 的值 = v + k*L
      var result = seq.slice(0, y - 1);
      result.push(v); // 末项 (k=0, 值=v)

      for (var pos = y + 1; pos <= totalLen; pos++) {
        // 检查当前位置是否是末项副本位置
        var isCopyOfLast = (pos > y) && ((pos - y) % L === 0);
        if (isCopyOfLast) {
          var k = (pos - y) / L;
          result.push(v + k * L);
        } else {
          // 普通PPS4规则：从 pos-L 位置复制并可能加L
          var srcPos = pos - L;
          var srcVal = result[srcPos - 1];
          result.push(srcVal >= x ? srcVal + L : srcVal);
        }
      }
      return result;
    } else {
      // 弱展开同wPPS4
      var result = seq.slice(0, y - 1);
      result.push(v);

      var startI = y - L + 1;
      for (var i = startI; result.length < totalLen; i++) {
        var idx = i - 1;
        if (idx >= result.length) break;
        var val = result[idx];
        result.push(val >= x ? val + L : val);
      }
      return result;
    }
  }

  register.push({
    id: 'tpps4',
    name: 'tPPS4',
    display: function (expr) {
      if ('' + expr === 'Infinity') return 'Limit';
      return '' + expr;
    },
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      var result = str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal tPPS4 sequence");
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
