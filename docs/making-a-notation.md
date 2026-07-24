# 如何开发一个记号文件（Notation File）

本文档聚焦于如何编写一个记号文件。完整的 Notation Explorer 项目文档见 `notation-dev-guide.md`。

## 文件结构

每个记号文件是一个独立的 `.js` 文件，遵循以下固定结构：

```js
;(() => {
   // 1. 展开逻辑（核心算法）
   function expand(seq, n) { /* ... */ }

   // 2. 注册到主记号注册表
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

## 支持的两种注册格式

Notation Explorer 原生支持本项目格式和 `ne-rewritten` 格式。两种格式最终进入同一个注册表、使用同一套展开树和本地文件生命周期，不存在单独的兼容运行时。

### 本项目格式

上面的 `register.push({...})` 是原有格式。它要求 `display`、`able`、`compare`、`FS` 和返回树节点数组的 `init`。旧记号文件可以继续使用该接口；也可以将同一个对象传给 `register_notation({...})`。

### ne-rewritten 格式

ne-rewritten 原始对象必须使用 `register_notation({...})`，不能传给 `register.push(...)`：

```js
;(() => {
   register_notation({
      id: 'my-rewritten',
      name: 'My Rewritten Notation',
      simple_name: 'MyRW',          // 可选：文件夹中的短名称
      category_id: 'my-category',   // 可选：所属分类 ID

      display: {
         plain: function(expr) { return String(expr); },
         html: function(expr) { return '<b>' + expr + '</b>'; },
         latex: function(expr) { return '\\mathbf{' + expr + '}'; },
         from_display: function(text) { return Number(text); },
         from_display_alter: function(text) { return Number(text); }, // 可选
      },

      is_limit: function(expr) { return expr === Infinity; },
      compare: function(a, b) { return a === b ? 0 : a < b ? -1 : 1; },
      FS: function(expr, n) { return expr === Infinity ? n + 1 : 0; },
      FS_alter: function(expr, n) { return expr; }, // 可选
      FS_short: function(expr, n) { return expr; }, // 可选

      // ne-rewritten 的 init 返回原始表达式，不返回树节点。
      init: function() { return [Infinity, 0]; },
   });
})();
```

框架会做以下映射：

| ne-rewritten 字段 | 本项目中的用途 |
|------|------|
| `display.html` | 主树 HTML 显示，即本项目的 `display` |
| `display.plain` | 导入导出等纯文本显示；省略时回退到 `html` |
| `display.latex` | KaTeX 源；省略时由支持的 HTML 子集转换 |
| `display.from_display` | `fromDisplay` |
| `display.from_display_alter` | `fromDisplay_alter` |
| `is_limit` | `able` |
| `FS_alter` | `FSalter` |
| `FS_short` | `FSShort` |
| `init() => expr[]` | 自动转换为 `{ expr, low, subitems }[]` |

`init()` 中每个表达式以下一个表达式为下界，最后一个表达式以自身为下界。`display_equiv`、`credit_text_id` 和受支持的 `draw_diagram` 元数据也会保留。

不要混写两套字段：带 `is_limit` 的 ne-rewritten 对象不要再提供 `able`。`from_display` 必须放在 `display` 对象内。直接编写一个 ne-rewritten 对象时无需提供远端 bundle 参数。

## register 对象的每个字段

### `id`（必填，string）

当前注册表中的非空唯一标识符。应用选择、分析归档和热替换都通过这个稳定 ID 关联；建议使用小写字母、数字和连字符组成的可读 ID。

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

### `latex`（可选，expr → KaTeX source）

当 `display` 的历史 HTML 不能表达所需排版时，可返回不含 `$...$` 或 `\(...\)` 定界符的 KaTeX 数学源。该函数只影响主树和基本列提示框的展示，不参与导航、导入导出或工具输出。

```js
latex: function(expr) {
   if ('' + expr === 'Infinity') return '\\mathrm{Limit}';
   return String(expr).replace(/,/g, ',\\,');
}
```

不实现 `latex` 时，框架会转换 `display(expr)` 中受支持的 `<sub>` / `<sup>`、希腊字母和少量 HTML 实体。应用不提供默认 `\newcommand` 或 `\renewcommand`；用户可在 Settings 中自行定义。

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
compare: sequence_compare  // 序列型——使用 00-shared-seq.js 提供的函数
```

对于满足字典序的序列型记号（`number[]`），直接用 `sequence_compare`。
对于满足字典序的矩阵型记号（`number[][]`），用 `matrix_compare`。
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

## 加载与安装

### 作为内置记号（自动发现）

将 `.js` 文件放入对应的谱系目录；没有对应谱系时使用 `Misc/`，然后运行：

```bash
node generate-notation-manifest.js
```

无需修改 `index.html`。文件按最多四级分类目录、再按文件名的区分大小写字典序加载。要暂时排除内置文件，将 `MyNotation.js` 重命名为 `MyNotation.js.disable` 并重新生成清单；恢复 `.js` 即重新启用。

这种方式随应用发布，不能在本地文件管理器中启用、禁用或编辑。

### 作为持久化本地文件（通过设置页）

不需要修改仓库即可加载自己的文件：

1. 打开 Settings → **Local notation files**。
2. 可先点击 **Guide / 开发指南** 在应用内阅读本文档。
3. 点击 **Upload .js** 并选择文件名以 `.js` 结尾的源码。
4. 检查源码后确认信任；页面会立即尝试启用整份文件。
5. 加载成功后即可在记号菜单中选择它；刷新页面后仍会自动恢复。

源码、启用状态和未保存草稿保存在浏览器 `localStorage` 的 `ne-local-notation-files` 中。本地文件的加载规则如下：

- 上传成功后文件立即启用；加载失败时保留为可编辑的禁用文件。
- 刷新时只自动执行已启用且已信任的文件；启动失败的文件会自动禁用。
- 保存已启用文件会事务热替换整个文件；失败时旧源码和旧注册继续运行，失败草稿仍会保留。
- 保存禁用文件只更新源码，不执行它。
- **New PrSS** 创建禁用模板并打开编辑器。
- 文件级开关会整体加载或卸载该文件注册的所有主记号、分析记号、分类和生成器。
- 本地文件可以使用页面提供的 shared 函数和内置记号，但不能依赖其他本地文件。

一个文件可以多次调用 `register.push(...)`、`register_notation(...)`、`register_category(...)` 和 `analysis_register.push(...)`。主记号与分析记号使用独立 ID 命名空间；同一命名空间内的 ID 必须唯一。文件必须产生至少一个主记号或分析记号；只有不生成任何记号的空分类不能单独加载。

## 生成类记号与 `+/-` 接口

一组按整数参数生成的记号应注册为一个分类生成器。记号菜单会把它显示为独立文件夹，并自动提供 `+`、`-` 按钮：

```js
;(() => {
   register_category({
      id: 'n-demo',
      name: 'Generated Demo',
      simple_name: 'n-Demo',
      path: ['Examples', 'n-Demo'],

      generator: {
         start: 1,
         initial: 2,
         maximum: 64,

         create: function(index) {
            return {
               id: 'demo-' + index,
               name: index + '-Demo',
               category_id: 'n-demo',

               // create 可返回这种 ne-rewritten 对象，也可返回本项目格式对象。
               display: function(expr) { return String(expr); },
               is_limit: function(expr) { return expr === Infinity; },
               compare: function(a, b) { return a === b ? 0 : a < b ? -1 : 1; },
               FS: function(expr, n) { return expr === Infinity ? index + n : 0; },
               init: function() { return [Infinity, 0]; },
            };
         },
      },
   });
})();
```

注册分类时会自动生成从 `start` 到 `initial`（含两端）的项目，不需要再调用 `init_generator(...)`。`+` 每次注册下一个整数变体；`-` 每次注销当前最大的变体，并在 `start` 停止。生成器状态由应用保存，重新加载后会恢复。

生成器字段：

| 字段 | 说明 |
|------|------|
| `start` | 必须保留的最小安全整数索引 |
| `initial` | 初次加载时生成到的索引，必须不小于 `start` |
| `maximum` | 允许增加到的最大索引；省略时为 `max(initial, 64)` |
| `create(index)` | 返回该索引对应的本项目格式或 ne-rewritten 格式主记号 |
| `resolveId(index, notation)` | 可选，重写生成项目的实时 ID；别名为 `idForIndex`、`mapId` |

若 `create(index)` 返回 ne-rewritten 对象，其 `category_id` 必须与生成器分类的 `id` 相同。`maximum` 可以显式设为更小或更大的安全整数；项目默认值是 64，并不是注册表强制的硬上限。

脚本可用以下全局函数控制生成器：

```js
generator_current('n-demo');        // 当前最大索引
generator_can_increment('n-demo');  // 能否增加
generator_can_decrement('n-demo');  // 能否移除
generator_increment('n-demo');      // 返回新增记号；不能增加时返回 undefined
generator_decrement('n-demo');      // 返回移除记号；不能移除时返回 undefined
```

`register` 上提供等价方法：

```js
register.generatorCurrent(id);
register.generatorMaximum(id);
register.generatorCanIncrement(id);
register.generatorCanDecrement(id);
register.generatorAdd(id);       // 别名：generatorIncrement
register.generatorRemove(id);    // 别名：generatorDecrement
```

在本地文件中，这些函数在源码同步执行时操作该文件的暂存生成族；文件成功启用或保存后，已被回调闭包捕获的同一组 `generator_*` 函数和 `register.generator*` 方法会自动操作实时注册表。加载失败或事务回滚后，这些句柄不能继续使用。

`init_generator(categoryOrId)` 仍为兼容接口，但 `register_category(...)` 已自动初始化，之后重复调用不会重复注册。分类可使用 `parent_id` 组成真实的多层层级，也可用 `path` 提供显示路径。本地文件在事务提交时允许先声明子分类、后声明父分类；直接作为内置脚本执行时应先注册父分类。

## 测试记号

### 浏览器快速测试

1. 打开 DevTools Console（F12）
2. 检查注册表：`console.table(register.map(n => ({ id: n.id, name: n.name })))`
3. 按 ID 调用 FS：`register.get('my-notation').FS([0,1,2,3], 0)`

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
| 序列型 | `number[]` 如 `[0,1,2,3]` | `sequence_compare` | `sequence_display` | `00-shared-seq.js` |
| 矩阵型 | `number[][]` 如 `[[0],[1],[2]]` | `matrix_compare` | `matrix_display` | `01-shared-matrix.js` |

## 参考文件

- **最小工作示例：** `docs/example-PrSS.js`（与 Settings 中的 PrSS 模板保持一致）
- **完整参考：** `js/notations/Y/omega-Y.js`（含 drawDiagram、FSalter、缓存）
- **矩阵型参考：** `js/notations/BM-like/BM.js`
- **字符串型参考：** `js/notations/OCN/cOCF.js`
- **PPS 变体参考：** `js/notations/PPS/sPPS4.js`
- **开发指南：** `docs/notation-dev-guide.md`
