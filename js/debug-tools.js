/**
 * Debug tools for Notation Explorer
 * 无穷降链检测器等调试工具
 * 挂载到 root.debugTools 上，结果输出到 console
 */

;(function() {
  var detectModule = {};

  /**
   * DFS 检测无穷降链
   * @param {object} notation - register 中的记号对象
   * @param {object} opts - 选项
   * @param {number} opts.limitTerm - 取 Limit 前 N 个基本列 (default 8)
   * @param {number} opts.maxSteps - 每个分支最多展开 N 步 (default 100)
   * @param {number} opts.maxN - 尝试展开 n=0..N (default 3)
   * @param {number} opts.preview - 检测到无限时输出前 N 项 (default 10)
   * @returns {Array} 结果数组
   */
  detectModule.detectInfChain = function(notation, opts) {
    var opt = opts || {};
    var limitTerm = opt.limitTerm || 8;
    var maxSteps = opt.maxSteps || 100;
    var maxN = opt.maxN !== undefined ? opt.maxN : 3;
    var preview = opt.preview || 10;

    var display = notation.display || function(x) { return JSON.stringify(x); };
    var able = notation.able || function(seq) { return seq.length > 0 && seq[seq.length - 1] > 0; };
    var FS = notation.FS;
    var limit = notation.limit || function(n) {
      if (n === 0) return [];
      var r = [];
      for (var i = 1; i <= n; i++) r.push(i);
      return r;
    };

    var results = [];

    for (var fsIdx = 1; fsIdx <= limitTerm; fsIdx++) {
      var seq = [];
      for (var i = 1; i <= fsIdx + 1; i++) seq.push(i);

      // DFS
      var stack = [{ seq: seq, steps: 0, path: [seq] }];
      var visited = new Set();
      visited.add(JSON.stringify(seq));
      var found = false;
      var chain = [];

      while (stack.length > 0) {
        var item = stack.pop();
        var s = item.seq;
        var steps = item.steps;
        var path = item.path;

        if (steps >= maxSteps) {
          found = true;
          chain = path.slice(0, preview);
          break;
        }

        if (s.length <= 1) continue;

        if (s[s.length - 1] === 1) {
          var ns = s.slice(0, -1);
          var key = JSON.stringify(ns);
          if (!visited.has(key)) {
            visited.add(key);
            stack.push({ seq: ns, steps: steps + 1, path: path.concat([ns]) });
          }
          continue;
        }

        for (var n = 0; n <= maxN; n++) {
          try {
            var ns = FS(s, n);
            var key2 = JSON.stringify(ns);
            if (!visited.has(key2)) {
              visited.add(key2);
              stack.push({ seq: ns, steps: steps + 1, path: path.concat([ns]) });
            }
          } catch(e) {
            // skip on error
          }
        }
      }

      results.push({
        start: display(seq),
        found: found,
        chain: chain.map(function(c) { return { expr: display(c), length: c.length }; }),
        visited: visited.size
      });
    }

    return results;
  };

  /**
   * 打印检测结果到控制台
   */
  detectModule.printResults = function(notation, results) {
    console.log('=== BFS 无穷降链检测 ===');
    console.log('Notation:', notation.name, '(' + notation.id + ')');
    console.log('');

    var anyFound = false;
    results.forEach(function(r, idx) {
      console.log('Limit FS(' + idx + ') = ' + r.start + '  (visited: ' + r.visited + ')');
      if (r.found) {
        anyFound = true;
        console.log('  >>> 无穷降链! (>= 步数限制)');
        console.log('  前 ' + r.chain.length + ' 项:');
        r.chain.forEach(function(c, i) {
          console.log('    ' + i + ': ' + c.expr + '  (len=' + c.length + ')');
        });
      } else {
        console.log('  (已终止)');
      }
      console.log('');
    });

    if (!anyFound) {
      console.log('√ 所有分支均已终止，未检测到无穷降链');
    }
  };

  /**
   * 检测所有 register 中的记号
   */
  detectModule.detectAll = function(opts) {
    register.forEach(function(notation) {
      console.log('──────────────────────────────');
      var results = detectModule.detectInfChain(notation, opts);
      detectModule.printResults(notation, results);
    });
  };

  /**
   * 检测指定 ID 的记号
   */
  detectModule.detectById = function(id, opts) {
    var notation = register.find(function(r) { return r.id === id; });
    if (!notation) {
      console.error('Notation "' + id + '" not found. Available: ' + register.map(function(r) { return r.id; }).join(', '));
      return;
    }
    var results = detectModule.detectInfChain(notation, opts);
    detectModule.printResults(notation, results);
    return results;
  };

  // 挂载到全局
  window.debugTools = detectModule;

  console.log('Debug tools loaded. Use debugTools.detectById("<notation-id>", {limitTerm:6, maxSteps:50}) to run.');
  console.log('Available notations:', register.map(function(r) { return r.id; }).join(', '));
})();
