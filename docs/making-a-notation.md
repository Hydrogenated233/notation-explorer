# 如何开发一个记号文件（Notation File）

本文档聚焦于如何编写一个记号文件。完整的 Notation Explorer 项目文档见 `notation-dev-guide.md`。

## 文件结构

每个记号文件是一个独立的 `.js` 文件，遵循以下固定结构：

```js
;(() => {
   // 1. 展开逻辑（核心算法）
   function expand(seq, n) { /* ... */ }

   // 2. 注册到全局 register 数组
   register.push({
      id: 'my-notation',       // 唯一标识符
      name: 'My Notation',     // 下拉菜单显示名
      display: function(expr) { /* ... */ },
      fromDisplay: function(str) { /* ... */ },
      able: function(seq) { /* ... */ },
      compare: sequence_compare,
      FS: function(seq, n) { /* ... */ },
      init: function() { /* ... */ },
   });
})();
```

**注意：** 所有代码包裹在 IIFE `;(() => { ... })()` 中，避免变量污染全局作用域。

## register 对象的每个字段

### `id`（必填，string）

唯一标识符。用于 Vue 组件名，因此必须符合 HTML 标签名规则（小写字母、数字、连字符）。

```js
id: 'prss'
```

### `name`（必填，string）

显示在下拉菜单中的名称，可含任意 Unicode 字符。

```js
name: 'PrSS'
```

### `display`（必填，expr → string）

将内部表达式转为可读字符串。**必须处理 `Infinity`**。

```js
display: function(expr) {
   if ('' + expr === 'Infinity') return 'Limit';
   return '' + expr;
}
```

### `fromDisplay`（推荐，str → expr）

将用户输入的字符串解析为内部表达式。这是 `display` 的逆操作。
用于「Navigate to notation」对话框和分析导入。

```js
fromDisplay: function(str) {
   str = str.trim();
   if (str === 'Limit') return [Infinity];
   var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });
   // 验证输入合法性...
   return result;
}
```

> 若解析失败应抛出异常，框架会自动捕获并用 `fromDisplay_alter` 兜底。

### `able`（必填，expr → boolean）

判断表达式是否还可以继续展开（即是否还有极限）。

```js
able: function(seq) {
   return seq.length > 0 && seq[seq.length - 1] > 1;
}
```

- 返回 `true` → 可展开（有子项）
- 返回 `false` → 后继项（无法再展开）

### `compare`（必填，a, b → -1 / 0 / 1）

比较两个表达式的大小。**必须正确处理 `Infinity`**。

```js
compare: sequence_compare  // 序列型——使用 shared-seq.js 提供的函数
```

对于序列型记号（`number[]`），直接用 `sequence_compare`。
对于矩阵型记号（`number[][]`），用 `matrix_compare`。
对于自定义表达式类型，需要自己实现三路比较。

### `FS`（必填，expr, n → expr）

基本列（Fundamental Sequence）函数。返回 `expr` 的第 `n` 项。
这是整个记号文件的核心。

**缓存模式（推荐）：**

```js
FS: (function() {
   var cache = {};
   return function(seq, n) {
      if ('' + seq === 'Infinity') {
         // 极限的基本列
         var result = [];
         for (var i = 0; i < n; i++) result.push(i + 1);
         return result;
      }
      if (seq.length === 0) return [];  // 空序列
      var key = '' + seq;
      if (!cache[key]) cache[key] = [];
      else if (cache[key][n] !== undefined) return cache[key][n];  // 缓存命中
      return cache[key][n] = expand(seq, n);  // 计算并缓存
   };
})()
```

**需要注意：**
- `FS(expr, 0)` 返回第 0 项（最小的下一级）
- `FS(expr, 1)` 返回第 1 项
- 框架循环调用直到 `compare(result, bound) > 0`
- 必须处理 `Infinity`——当 `expr === Infinity` 时，返回极限的第 n 项
- 使用闭包缓存避免重复计算

### `init`（必填，() → array）

返回初始的树节点列表。通常包含极限和空序列两个根节点：

```js
init: function() {
   return [
      { expr: [Infinity], low: [[]], subitems: [] },  // 极限
      { expr: [],         low: [[]], subitems: [] },  // 空序列（最小项）
   ];
}
```

每个元素包含：
- `expr` — 内部表达式
- `low` — 下界（通常为 `[[]]`）
- `subitems` — 子项（初始为空 `[]`，展开时动态填充）

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `FSalter` | `(expr, n) => expr` | 备选基本列 |
| `FSShort` | `(expr, n) => expr` | 短基本列（勾选 "Use alternative" 时使用） |
| `fromDisplay_alter` | `(str) => expr` | 备选解析函数 |
| `semiable` | `(expr) => boolean` | 是否可语义化 |
| `drawDiagram` | `(expr) => diagramObject` | 山图画图函数 |

## 两种加载方式

### 永久加载（放入 index.html）

在 `index.html` 的 `</div>` 之后、`<script src="js/framework.js">` 之前添加：

```html
<script src="js/notations/MyNotation.js"></script>
```

### 临时加载（通过设置页）

打开 Settings → **Load Notation** → 选择 `.js` 文件即可，无需修改 `index.html`。
仅当前会话有效，刷新后消失。

## 测试记号

### 浏览器快速测试

1. 打开 DevTools Console（F12）
2. 检查 `register` 数组：`console.table(register.map(n => ({ id: n.id, name: n.name })))`
3. 直接调用 FS：`register[0].FS([0,1,2,3], 0)`

### Node.js 快速验证

```bash
node -e "
  function expand(seq, n) {
    // 粘贴展开函数
  }
  console.log(expand([0,1,2,3], 0));
"
```

## 序列型 vs 矩阵型

| 类型 | 表达式 | compare | display | 共享文件 |
|------|--------|---------|---------|---------|
| 序列型 | `number[]` 如 `[0,1,2,3]` | `sequence_compare` | `sequence_display` | `shared-seq.js` |
| 矩阵型 | `number[][]` 如 `[[0],[1],[2]]` | `matrix_compare` | `matrix_display` | `shared-matrix.js` |

## 参考文件

- **最小工作示例：** `docs/example-PrSS.js`（本项目中，可直接临时加载）
- **完整参考：** `js/notations/omega-Y.js`（含 drawDiagram、FSalter、缓存）
- **矩阵型参考：** `js/notations/BM.js`
- **字符串型参考：** `js/notations/cOCF.js`
- **开发指南：** `docs/notation-dev-guide.md`
