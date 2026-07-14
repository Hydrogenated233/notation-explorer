;
/**
 * PBMSS
 *
 * 形式：逗号分隔的非负整数序列。
 * 极限表达式：0,0,1,1,1,1,1,... (0开头)
 *
 * 算法要点：
 *   坏根 = 末项的值（1-indexed）
 *   好部 = 除末项外的所有项
 *   坏部 = 从坏根到倒数第二项
 *   公差 d = L - 坏部起始位置
 *   每项展开分 复制/非复制 两种类型
 */

(function () {
  var data = {};

  // 在序列中找到 idx1（1-indexed）左侧最近的 0，若无则返回 0
  function getColumnStart(seq, idx1) {
    for (var i = idx1; i >= 1; i--) {
      if (seq[i - 1] === 0) return i;
    }
    return 0;
  }

  function getHeight(seq, idx1) {
    return idx1 - getColumnStart(seq, idx1);
  }

  // 获取某个值对应的父项的列项起始索引（基于原序列）
  function getParentColStart(seq, val) {
    if (val < 1 || val > seq.length) return null;
    return getColumnStart(seq, val - 1);
  }

  // 在当前序列中寻找最后一个值为 0 的项的位置（1-indexed），没有返回 0
  function findLastZeroIndex(curSeq) {
    for (var i = curSeq.length - 1; i >= 0; i--) {
      if (curSeq[i] === 0) return i + 1;
    }
    return 0;
  }

  // 非复制规则：根据原始项的高度 h 和当前/动态序列生成新值
  function generateNonCopyValue(curSeq, dySeq, h) {
    var lastZeroIdx = findLastZeroIndex(curSeq);
    var nonZeroPositions = [];
    var idx = lastZeroIdx; // 0-indexed 的下一个
    while (idx < dySeq.length) {
      nonZeroPositions.push(idx + 1);
      if (dySeq[idx] === 0) break;
      idx++;
    }
    if (nonZeroPositions.length === 0) return idx;
    var targetIndex = Math.min(h, nonZeroPositions.length) - 1;
    return nonZeroPositions[targetIndex];
  }

  function expand(seq, FSterm) {
    if (seq.length === 0) return [];
    var L = seq.length;
    var lastVal = seq[L - 1];

    // 末项不合法 → 直接删去末项
    if (lastVal < 1 || lastVal > L) return seq.slice(0, -1);

    var rootIdx = lastVal;           // 坏根序号（1-indexed）
    var rootVal = seq[rootIdx - 1];  // 坏根的值
    var goodPart = seq.slice(0, -1); // 好部

    // 坏部：从坏根开始到倒数第二项
    var startPos = rootIdx;
    var endPos = L - 1;
    var badParts = [];
    if (startPos <= endPos) {
      for (var p = startPos; p <= endPos; p++) {
        badParts.push({ value: seq[p - 1], position: p });
      }
    }

    var d = L - startPos; // 公差

    // 在原始序列（包含末项）中，从坏根到末尾寻找最靠左的0的位置
    var leftmostZeroPos = null;
    for (var p = rootIdx; p <= L; p++) {
      if (seq[p - 1] === 0) {
        leftmostZeroPos = p;
        break;
      }
    }

    var rootColStart = getColumnStart(seq, rootIdx);
    var lastParentStart = getParentColStart(seq, lastVal);

    // 开始展开
    var curSeq = goodPart.slice();
    var dySeq = curSeq.slice();

    for (var i = 1; i <= FSterm; i++) {
      var newValues = [];
      for (var bi = 0; bi < badParts.length; bi++) {
        var bp = badParts[bi];
        var origVal = bp.value;
        var origPos = bp.position;

        var isCopy = false;
        var addTolerance = false;

        // 3a: 值为0 或 位于最靠左0的左侧 => 复制不加公差
        if (origVal === 0) {
          isCopy = true;
          addTolerance = false;
        } else if (leftmostZeroPos === null || origPos < leftmostZeroPos) {
          isCopy = true;
          addTolerance = false;
        } else {
          var parentStart = getParentColStart(seq, origVal);
          // 3b: 原始项的父项与末项的父项是同一项 => 非复制
          if (parentStart !== null && lastParentStart !== null && parentStart === lastParentStart) {
            isCopy = false;
          } else {
            // 3c: 原始项的值 >= 坏根的列项的序号 => 复制加公差
            if (origVal >= rootColStart) {
              isCopy = true;
              addTolerance = true;
            } else {
              isCopy = true;
              addTolerance = false;
            }
          }
        }

        var newVal;
        if (isCopy) {
          newVal = addTolerance ? origVal + d * i : origVal;
        } else {
          var h = getHeight(seq, origPos);
          newVal = generateNonCopyValue(curSeq, dySeq, h);
        }

        newValues.push(newVal);
        dySeq.push(newVal);
      }
      // 追加本轮生成的所有新值
      for (var nvi = 0; nvi < newValues.length; nvi++) {
        curSeq.push(newValues[nvi]);
      }
    }

    return curSeq;
  }

  register.push({
    id: 'pbmss',
    name: 'PBMSS',
    display: function (expr) {
      if ('' + expr === 'Infinity') return 'Limit';
      return '' + expr;
    },
    fromDisplay: function (str) {
      str = str.trim();
      if (str === 'Limit') return [Infinity];
      var result = str.split(',').map(function (s) { return parseInt(s.trim(), 10); });
      if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal PBMSS sequence");
      return result;
    },
    able: function (seq) {
      return seq.at(-1)>0
    },
    compare: sequence_compare,
    FS: (function () {
      var cache = {};
      return function (seq, FSterm) {
        var key = '' + seq;
        if (key === 'Infinity') {
          var result = [0];
          for (var i = 0; i < FSterm; i++) result.push(1);
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
        { expr: [],        low: [[]], subitems: [] },
      ];
    },
  });
})();
