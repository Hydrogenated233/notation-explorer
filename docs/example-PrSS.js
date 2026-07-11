// PrSS — Primitive Sequence System
// 最小工作示例：展示一个完整的记号文件需要哪些部分
//
// 用法：
//   1. 临时加载：Settings → "Load Notation" → 选择此文件
//   2. 永久加载：在 index.html 中加入 <script src="js/notations/...">
//   3. 参考 docs/making-a-notation.md 了解各字段含义

;(() => {
   // ============================================================
   // 1. 展开逻辑：定义 FS 如何计算
   //    这是记号的核心，纯数学算法，不依赖任何框架
   // ============================================================

   // findBadRoot: 找到 PrSS 的坏根位置
   // 从右往左找第一个小于最后一个元素的元素
   // 返回值是 1-indexed 位置（方便后续切片）
   function findBadRoot(arr, lastVal) {
      for (let i = arr.length - 1; i >= 0; i--) {
         if (arr[i] < lastVal) return i + 1;
      }
      return null;  // 未找到坏根（整个序列都在增大）
   }

   // expand: 对序列 seq 展开, 取基本列第FSterm项
   // 参数：
   //   seq    — 内部表达式（number[]）
   //   FSterm — 基本列位置（0, 1, 2, ...）
   // 返回值：
   //   展开后的新序列（number[]）
   function expand(seq, FSterm) {
      if (seq.length === 0) return [];
      var last = seq[seq.length - 1];

      // 最后一项 ≤ 1 → 截断最后一项（后继情况的展开）
      if (last <= 1) {
         return seq.slice(0, -1);
      }

      // 找坏根
      var k = findBadRoot(seq, last);
      if (k === null) {
         // 没有坏根 → 删去最后一项
         return seq.slice(0, -1);
      }

      // 好部 G = 坏根之前的所有项
      // 坏部 B = 坏根到倒数第二项
      var G = seq.slice(0, k - 1);
      var B = seq.slice(k - 1, seq.length - 1);
      if (B.length === 0) {
         return seq.slice(0, -1).concat(last - 1);
      }

      // 结果 = G + B + B + ...（重复 FSterm 次）
      var result = G.slice();
      for (let i = 0; i < FSterm; i++) {
         result = result.concat(B);
      }
      return result;
   }

   // ============================================================
   // 2. 注册到全局 register 数组
   //    使框架能识别、下拉、展开这个记号
   // ============================================================

   register.push({
      // --- 必填字段 ---

      // id: 唯一标识符，用作 Vue 组件名
      // 规则：小写字母、数字、连字符
      id: 'prss',

      // name: 下拉菜单中显示的名称
      name: 'PrSS',

      // display: 内部表达式 → 显示字符串
      // 必须处理 expr === Infinity
      display: function(expr) {
         if ('' + expr === 'Infinity') return 'Limit';
         return '' + expr;
      },

      // fromDisplay: 用户输入的字符串 → 内部表达式
      // 这是 display 的逆操作，用于导航和导入分析
      // 解析失败时应抛出异常
      fromDisplay: function(str) {
         str = str.trim();
         if (str === 'Limit') return [Infinity];
         var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });
         if (result.find(Number.isNaN) !== undefined) throw new Error("Illegal PrSS sequence");
         return result;
      },

      // able: 判断表达式还能否继续展开
      // true = 可展开（有极限），false = 后继
      able: function(seq) {
         return seq.length > 0 && seq[seq.length - 1] > 1;
      },

      // compare: 三路比较函数（-1 / 0 / 1）
      // 一般的序列型使用 shared-seq.js 提供的 sequence_compare
      compare: sequence_compare,

      // FS: 基本列函数 - 整个记号的核心
      // 使用闭包缓存模式避免重复计算
      FS: function(seq, FSterm) {
         // 处理 Infinity（极限）：返回长度为 FSterm+1 的递增序列
         if ('' + seq === 'Infinity') {
            var result = [];
            for (var i = 0; i < FSterm; i++) result.push(i + 1);
            return result;
         }
         // 空序列的基本列是空序列
         if (seq.length === 0) return [];
         // 调用展开逻辑（此处省略了缓存，生产环境应使用闭包缓存）
         return expand(seq, FSterm);
      },

      // init: 返回初始树节点
      // 至少应包含极限 [Infinity] 和空序列 []
      init: function() {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },  // 极限顶点
            { expr: [],         low: [[]], subitems: [] },  // 最小项
         ];
      },

      // --- 可选字段 ---
      // FSalter: 备选基本列（勾选 "Use alternative" 时使用）
      // drawDiagram: 画图函数（浮窗显示山图）
      // fromDisplay_alter: 备选解析函数
   });
})();
