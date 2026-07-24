# Notation Explorer — 记号开发指南

## 目录结构

```
notation-explorer/
├── index.html              ← 入口页面
├── css/
│   └── index.css           ← 全局样式
├── lib/
│   ├── Vue.js              ← 第三方 Vue 库
│   ├── xlsx.full.min.js    ← Excel 导出/导入（本地加载）
│   └── katex/              ← KaTeX 运行库、样式、字体与许可证
├── js/
│   ├── framework.js        ← Vue 应用框架（UI、展开逻辑、分析）
│   ├── debug-tools.js      ← 调试工具（无穷降链检测等）
│   ├── latex-renderer.js   ← HTML/记号表达式到 KaTeX 的展示适配层
│   ├── notation-display.js ← 主表示/等价表示统一解析层
│   ├── notation-credits.js ← 记号归属的中英文文本与解析
│   ├── notation-registry.js← 按 ID/文件 owner 管理、归一化并注册记号
│   ├── ne-rewritten-notation-bundle.js ← 固定上游算法与原始定义（生成文件）
│   ├── local-notation-runtime.js ← 本地文件持久化与热加载事务
│   ├── local-notation-ui.js← 设置页文件管理器与编辑器
│   ├── notation-editor.js  ← 行号、高亮与括号匹配
│   ├── prss-template.js    ← PrSS 模板生成器
│   ├── notation-file-index.js ← 内置文件路径排序契约
│   ├── notation-manifest.js← 自动生成的内置文件清单
│   ├── notation-loader.js  ← 按清单串行加载并启动应用
│   ├── notations/
│   │   ├── 00-shared-seq.js   ← 跨谱系序列通用函数
│   │   ├── 01-shared-matrix.js← 跨谱系矩阵通用函数
│   │   ├── BM-like/        ← Bashicu Matrix-like 谱系
│   │   ├── CpS/            ← CpS 谱系
│   │   ├── DEN/            ← Defective Embedding Notation
│   │   ├── MN/             ← Mountain Notation 与 HypCos 变体
│   │   ├── Misc/           ← 尚无独立谱系的记号
│   │   ├── OCN/            ← OCF-like notation（上游分类简称 OCN）
│   │   ├── PPS/            ← PPS、PPS4 及 sPPS4 等变体
│   │   ├── PrSS/           ← PrSS 衍生系统
│   │   ├── SMN/            ← Smile/n-MN 谱系
│   │   ├── TON/            ← Taranovsky Ordinal Notation
│   │   ├── Y/              ← Y sequence 谱系
│   │   └── aSAN/           ← aSAN 谱系
│   └── diagram/
│       └── Diagram.js      ← 画布渲染 Worker（不属于记号谱系）
├── docs/
│   ├── notation-dev-guide.md ← 本文件
│   ├── making-a-notation.md  ← 记号文件开发入门（精简版）
│   ├── dfs-diff.md           ← DFS 差异对比工具文档
│   ├── example-PrSS.js       ← 与内置模板保持一致的 PrSS 示例
│   └── bfs-diff.md           ← （已弃用，重命名为 dfs-diff.md）
├── dfs-detect.js           ← CLI 无穷降链检测器
├── dfs-diff.js             ← CLI DFS 差异对比工具
├── generate-notation-manifest.js ← 扫描并生成内置文件清单
└── scripts/build-ne-rewritten-bundle.js ← 重建固定上游定义 bundle
```

## 核心概念

Notation Explorer 是一个 Vue 3 应用，用于**展开**各种大数/序数记号的基本列（Fundamental Sequence）。每个可选择的记号由一个注册对象描述，包含表达式格式、展开规则和比较方式等。

**两个全局注册表：**

| 数组 | 用途 |
|------|------|
| `register` | 主列表中的记号（可展开/可导航） |
| `analysis_register` | 分析窗口中的记号（用于分析被展开序列的强度） |

注册表保留数组兼容接口；现有记号文件仍通过 `register.push({...})` 或 `analysis_register.push({...})` 注册自己，也可用 `get(id)` 按稳定 ID 查找。唯一的 `NotationRegistry` 同时接受本地注册对象和 `ne-rewritten` 定义，并在注册边界把后者归一化为同一个运行时记号契约；不存在第二套 registry 或专用适配器。主记号和分析记号使用独立的 ID 命名空间，因此同一个 ID 可以各出现一次，但同一注册表中不允许重复。

### 内置记号与本地记号文件

| 类型 | 方法 | 管理方式 |
|------|------|----------|
| **内置记号** | 放入对应谱系目录，由清单生成器递归发现 | 随应用加载，不出现在本地文件管理器中 |
| **本地记号文件** | Settings → Local notation files → Upload `.js` | 保存在 `localStorage`，可编辑、启用、禁用、下载和删除 |

两种方式使用相同的注册 API。本地管理以整个文件为单位，一个文件可以同时注册多个主记号和分析记号；启用、禁用或删除时会整体加载或卸载。启用文件的保存采用事务热替换，校验或 `init()` 失败时旧版本仍保持运行。

## 共享函数

以下函数由独立的 shared 文件提供，**不需要**在每个记号文件中重复定义：

| 文件 | 函数 | 用途 |
|------|------|------|
| `00-shared-seq.js` | `sequence_compare(seq1, seq2)` | 按字典序比较两个数字序列 |
| `00-shared-seq.js` | `sequence_display(expr)` | 将序列转为字符串：`Infinity`→`'Limit'`，否则 `''+expr` |
| `01-shared-matrix.js` | `matrix_compare(m1, m2)` | 比较两个矩阵 |
| `01-shared-matrix.js` | `matrix_display(expr)` | 矩阵转字符串：列用 `()` 包裹，如 `(0)(1)(2)` |
| `01-shared-matrix.js` | `matrix_limit(m)` | 判断矩阵是否有极限：`m.length>0 && m[m.length-1][0]>0` |

清单按分类目录后按文件名字典序加载。根目录文件先于分类目录，数字前缀保证序列 helper 先于矩阵 helper，并且两者都先于谱系文件。

## register 对象的完整 API

### 注册表方法与生成族

普通记号继续使用 `register.push(notation)`；也可以使用等价的
`register.registerNotation(notation)`。需要由菜单中的 `+ / -` 动态增加、移除整数变体时，
通过主注册表注册一个生成族：

```js
register.registerCategory({
  id: 'category-example',
  name: 'Example',
  path: ['Example'],
})

register.registerGenerator({
  id: 'category-n-example',
  category: {
    id: 'category-n-example',
    name: 'n-Example',
    parent_id: 'category-example',
  },
  start: 1,
  initial: 3,
  maximum: 64,
  create: function (n) {
    return {
      id: n + '-example',
      name: n + '-Example',
      // display / able / compare / FS / init ...
    }
  },
})
```

注册时会创建 `start...initial`；若设置中保存了合法的当前上限，则恢复到该上限。
框架和菜单只调用注册表的通用接口，不读取上游 bundle 或某个记号文件的私有生成器：

| 方法 | 作用 |
|------|------|
| `register.generatorCurrent(id)` | 返回生成族当前已注册的最大整数参数 |
| `register.generatorCanIncrement(id)` | 是否可以增加下一项 |
| `register.generatorCanDecrement(id)` | 是否可以移除当前末项；始终保留 `start` |
| `register.generatorAdd(id)` | 注册下一项并返回新记号对象 |
| `register.generatorRemove(id)` | 注销当前末项并返回被移除的记号对象 |

`generatorIncrement` / `generatorDecrement` 是 `generatorAdd` /
`generatorRemove` 的兼容别名。若生成器产生的源码 ID 与本项目的稳定 ID 不同，可提供
`resolveId(index, notation)`；例如 n-MN 用它把变体绑定到 `nt-1-mn`、`nt-2-mn` 等现有 ID。

生成项会获得 `category_id` 和 `generatedFamily` 元数据，因此下拉菜单始终把它放回生成族文件夹。
在本地记号文件中调用这些 API 时，分类、生成族及其初始项与该文件的普通注册一起暂存；只有整个文件
校验成功才提交，提交后源码闭包已捕获的生成器控制方法会转发到实时注册表；禁用、删除或替换文件时按文件 owner 一起卸载。旧式
`register.push(...)` / `analysis_register.push(...)` 保持兼容。

`register.registerNotation(...)` 和全局 `register_notation(...)` 都接受本地注册对象或
`ne-rewritten` 定义。后者常用的结构化 `display`、`is_limit`、`FS_alter`、`FS_short`
以及返回原始表达式数组的 `init()` 会由注册表转换成当前框架契约。全局
`register_category(...)`、`init_generator(...)`、`generator_increment(...)` 和
`generator_decrement(...)` 也是同一注册表的原生入口；带 `generator` 的
`register_category(...)` 会自动初始化，无需用户文件再显式调用 `init_generator(...)`。
ne-rewritten 字段映射、本地上传步骤和完整生成器示例见 `docs/making-a-notation.md`。

以下是一个记号 `register` 对象的所有字段：

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 当前注册表中的非空唯一标识符；应用状态和持久化数据均按此 ID 绑定 |
| `name` | string | 显示在选项卡/菜单中的名称 |
| `display` | `(expr) => string` | 把内部表达式转为显示字符串 |
| `able` | `(expr) => boolean` | 判断表达式是否还可以再展开（是否有极限） |
| `compare` | `(a, b) => -1 / 0 / 1` | 比较两个表达式的大小：`-1` 小于，`0` 相等，`1` 大于 |
| `FS` | `(expr, n) => expr` | 基本列函数：返回 `expr` 的第 `n` 项（n 从 0 开始） |
| `init` | `() => array` | 返回初始项列表（见下方「init 输入格式」） |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `latex` | `(expr) => string` | 返回不含 `$...$` 或 `\(...\)` 定界符的 KaTeX 数学源，仅用于表达式展示 |
| `displayPlain` | `(expr) => string` | 主表示的纯文本形式；缺省时使用 `display` |
| `display_equiv` | `Record<string, displaySpec>` | 同一记号的命名等价表示，详见下节 |
| `fromDisplay` | `(str) => expr` | 将字符串解析为内部表达式（"From Display" 的反向）。用于「Navigate to notation」和导入分析 |
| `fromDisplay_alter` | `(str) => expr` | 备选解析方式（兜底，`fromDisplay` 抛异常时尝试） |
| `FSalter` | `(expr, n) => expr` | 备选基本列函数（勾选 "Use alternative (short) fundamental sequence" 时使用） |
| `FSShort` | `(expr, n) => expr` | 短基本列（也是备选，与 `FSalter` 二选一，通过 `get_FS()` 确定优先级：`FSShort` → `FSalter` → `FS`） |
| `semiable` | `(expr) => boolean` | 判断表达式"可语义化"（影响 UI 中某些处理） |
| `drawDiagram` | `(expr) => diagramObject` | 返回画图对象（见「画图」部分）。在输入框获得焦点时调用，浮窗显示山图 |
| `credit_text_id` | string | 记号级归属文本键；未知键不显示，不从文件或分类推断 |

### init 的输入格式

`init()` 返回一个数组，每个元素是一个初始项对象：

```js
[
  { expr: [Infinity],  low: [[]], subitems: [] },  // 最大项（极限）
  { expr: [0,1,2,3,4], low: [[]], subitems: [] },  // 示例项
  { expr: [0],          low: [[]], subitems: [] },  // 中间项
  { expr: [],           low: [[]], subitems: [] },  // 最小项
]
```

- `expr` — 内部表达式（数组、矩阵、字符串等）
- `low` — 下界（与 bound 有关，通常为 `[[]]`）
- `subitems` — 初始子项（始终为 `[]`，展开时会动态添加）

> `expr` 为 `Infinity` 时表示极限顶点，`display` 应返回 `'Limit'`，`compare` 处理 `Infinity` 作为最大。

## 表达式类型

根据记号不同，内部表达式主要有几种类型：

| 记号系列 | 表达式类型 | 示例 |
|----------|-----------|------|
| ω-Y, 1-Y, PrSS, PPS | `number[]` 数字数组 | `[0,1,2,3]` |
| BM, BHM, BSM, etc | `number[][]` 矩阵（列数组） | `[[0,0],[1,0]]` |
| cOCF | `string` 字符串 | `'p(p(p(0)))'` |
| TON, DEN | 混合（数组/对象） | 见各实现 |

> `Infinity` 是 JS 原生 `Infinity`，作为特判值处理极限。

## 表达式渲染与 LaTeX

Settings 中的 **Expression rendering** 在 HTML 与 LaTeX 之间全局切换，默认使用 HTML。统一的 `notation-expression` 组件只负责主展开树和基本列提示框里的记号表达式；分析文本、笔记、工具输出和 xlsx 不随此模式转换。

LaTeX 模式优先调用可选的 `notation.latex(expr)`。未提供该函数时，框架调用 `notation.display(expr)`，再由 `htmlToLatex()` 转换项目历史显示格式中明确支持的子集：

- 可嵌套的 `<sub>` 与 `<sup>`
- `ω`、`Ω`、`ψ`
- `&sdot;`、`&middot;`、`&times;`、`&nbsp;`、`&amp;`、`&lt;`、`&gt;`
- KaTeX 中需要转义的 `\ { } ^ _ # $ % & ~`

其他 HTML 标签和实体不保证可转换。需要特殊排版的记号应实现 `latex(expr)`，且它必须与 `display(expr)` 表示同一个内部表达式。

主 `display(expr)` / `fromDisplay(str)` 仍是兼容性数据契约。若选择了等价表示，导航、分析导入导出和直接展开改用该表示的 `plain` / `from_display`；图表任务标识、自动分析存档、缓存和旧代码仍使用主显示字符串或原始表达式。两种路径都不会写入 KaTeX HTML 或 `latex(expr)` 源文本，切换渲染模式也不会重建展开树或清空分析文本。

KaTeX 从仓库的 `lib/katex` 本地加载，以行内模式、`trust: false` 和 `maxExpand: 1000` 渲染。单个表达式失败时显示可诊断的回退内容，不中断其余展开树。

设置页可保存用户自己的 `\newcommand` / `\renewcommand` 声明，应用默认声明为空。有效声明会编译为宏表；无效编辑显示错误并沿用当前会话中最后一次有效的宏表。每次渲染使用宏表副本，避免表达式内的全局定义泄漏到后续表达式。

## 等价表示与归属

`display_equiv` 为同一个主记号提供一个或多个命名显示协议。它不是新记号，也不会获得独立的树或 ID。值可以是一个显示函数，也可以是：

```js
display_equiv: {
  layer: {
    plain: expr => layerPlain(expr),
    html: expr => layerHtml(expr),       // 可省略，回退 plain
    latex: expr => layerLatex(expr),     // 可省略，从 html 转换
    from_display: text => parseLayer(text),
    name_id: 'display.layer',
  },
}
```

选择按 `ownerId::notationId` 保存在 `ne-config`；内置记号和两个先后复用同一 ID 的本地文件互不污染。旧版裸 ID 配置会迁移到当前活动 owner。树使用当前等价表示，并可按用户设置在其后同时显示原表示；基本列提示框只显示当前表示。导航、xlsx 导入导出和直接展开使用当前表示的 `plain` / `from_display`。若某个等价表示没有解析器，输入功能会拒绝该表示，而不会退回 `fromDisplay`。自动分析存档、调试工具、缓存和旧代码仍使用原始表达式或主 `display`，因此切换表示不会重建树或清空分析。

`credit_text_id` 通过 `notation-credits.js` 解析，在当前树下显示中英文归属。归属属于单个注册记号；即使多个记号来自同一文件，也必须逐项声明。上游没有提供归属时保持空白。

## FS 函数的实现细节

### 基本列缓存

大部分 FS 实现使用闭包缓存来避免重复计算：

```js
FS: (() => {
  var data = {};
  return (expr, n) => {
    // 处理 Infinity（极限）
    if ('' + expr === 'Infinity') return limitFS(n);
    // 空序列
    if (expr.length === 0) return [];

    var key = display(expr);
    if (!data[key]) data[key] = [];
    else if (data[key][n] !== undefined) return data[key][n];

    // 实际计算
    return data[key][n] = doExpand(expr, n);
  };
})(),
```

**缓存模式要点：**
- `data` 在 IIFE 闭包内
- `data[key][n]` 缓存指定 FS index 的结果
- 先查缓存再计算

### FS 对 `Infinity` 的处理

当 `expr === Infinity` 时，基本列应返回极限的第 n 项：

```js
if ('' + expr === 'Infinity') {
  // ω-Y: 返回 0~n 的简单序列
  return [0, 1, ..., n];
  // BM: 返回 (0) 重复 n+1 次
  // return [Array(n+1).fill(0), Array(n+1).fill(1)];
  // 1-Y
  // return [1, 1 + n];
}
```

### 展开层级

`tier` 控制展开的重数：

- 0 = small expansion（只展开一次）
- 1 = single expansion
- 2 = double expansion
- ...

框架中的 `expand_item()` 函数递归调用 `FS` 来实现多级展开。

## FSalter / FSShort

当用户勾选 "Use alternative (short) fundamental sequence" 时，框架通过 `get_FS()` 选择：

```js
const get_FS = (notation, use_short) => {
  if (use_short) return notation.FSShort || notation.FS;
  return notation.FS;
};
```

> 注意：`use_short` 勾选时优先 `FSShort`，若未定义则回退 `FS`，**不会**使用 `FSalter`。需要 `FSalter` 时框架逻辑中另有处理（**目前仅在分析导入时涉及**）。

但是 `FSalter` 在分析计算弹窗（Analysis FS Dialog）中使用，当用户点击确认时会调用 `notation.FS(display_value, fsIndex)`。

## fromDisplay / fromDisplay_alter

框架使用 `safeFromDisplay()` 函数进行安全转换：

```js
function safeFromDisplay(notation, str) {
  if (notation.fromDisplay) try { return notation.fromDisplay(str); } catch (e) { /* fall through */ }
  if (notation.fromDisplay_alter) try { return notation.fromDisplay_alter(str); } catch (e) { /* fall through */ }
  return undefined;
}
```

- 先尝试 `fromDisplay`，抛出异常则尝试 `fromDisplay_alter`
- 都失败则返回 `undefined`（用户输入无效时无操作）

## Diagram（画图）

### 主框架中的处理

当记号提供了 `drawDiagram` 属性时，输入框聚焦时会触发画图：

```js
if (this.notation.drawDiagram != null) {
  let diagram = this.notation.drawDiagram(this.item.expr);
  if (diagram != null) {
    worker.postMessage({ type: 'render', diagram, taskId: ... });
    root.showCanvas = true;
    // 计算浮窗位置...
  }
}
```

### drawDiagram 返回值格式

`drawDiagram` 返回的对象必须有 `actions` 数组和 `width`/`height`：

```js
{
  width: 200,     // 画布宽
  height: 150,    // 画布高
  actions: [
    { type: 'circle', x: 50, y: 20, r: 10 },
    { type: 'line', x1: 10, y1: 40, x2: 80, y2: 40, color: '#333' },
    { type: 'text', x: 20, y: 70, text: '1', fontSize: 14 },
  ]
}
```

**Action 类型：**

| type | 字段 | 说明 |
|------|------|------|
| `circle` | `x, y, r` | 实心圆 |
| `line` | `x1, y1, x2, y2, color` | 线段，颜色默认 `#666` |
| `text` | `x, y, text, fontSize` | 文本标签 |

### Diagram.js 双重加载

`Diagram.js` 在两个环境中运行：
1. **作为 Worker** — `new Worker("js/diagram/Diagram.js")`，接收 `render` 消息，绘制到 offscreen canvas
2. **在主线程** — 同时也作为普通 `<script>` 加载，提供 `let canvas = null` 全局变量（`framework.js` 的 `mounted()` 通过 `document.getElementById('hoverCanvas').transferControlToOffscreen()` 获取）

渲染器位于 `js/diagram/`，不应归入任一记号谱系。

## 编写一个完整的记号文件

### 最小工作示例：PrSS

参见 `docs/example-PrSS.js`。该文件与 Settings 中「New PrSS」生成的已订正模板保持一致，可直接上传到本地记号文件管理器测试。

关键点：

- 使用 IIFE 包裹 `;(()=>{ ... })()` 避免变量污染
- 通过 `register.push({...})` 注册
- `display`: 对 `Infinity` 返回 `'Limit'`，否则返回 `''+expr`
- `fromDisplay`: 解析 `'Limit'` 或逗号分隔序列
- `able`: 最后一项 > 1 时可展开
- `compare`: 使用 `sequence_compare`（来自 `00-shared-seq.js`）
- `FS`: 带缓存的闭包模式
- `init`: 返回 `[Limit, 空序列]` 两个根节点

完整文件内容仅 ~65 行，可作为新记号的模板。

### 添加、排除与恢复内置记号

先把 `.js` 文件放入最接近的谱系目录；没有对应谱系时放入 `Misc/`。目录最多嵌套四级。无需编辑 `index.html`，运行清单生成器即可递归检测全部活动文件：

```bash
node generate-notation-manifest.js
```

加载顺序先逐级比较分类目录，再比较文件名，均采用固定、区分大小写的字典序。一个文件内的多次注册保持源码顺序。若存在文件间依赖，应通过文件名让依赖项排在使用者之前；TON 和 shared helper 使用数字前缀体现该规则。

将 `Example.js` 重命名为 `Example.js.disable` 后重新生成清单，即可排除该内置文件；恢复 `.js` 后重新生成即可重新启用。`node generate-notation-manifest.js --check` 只校验清单是否最新，不写文件，完整测试也会执行同一校验。

新记号会自动出现在下拉菜单中，并始终位于已启用的本地记号之前。

> 注意：内置记号不受 Settings 中的本地文件管理器管理。需要让用户自行维护源码时，应改用下面的本地记号文件流程。

### 固定上游定义 bundle

从 `ne-rewritten` 合并的算法与原始定义保存在生成文件 `js/ne-rewritten-notation-bundle.js`，并固定到源码中记录的 commit。该 bundle 只暴露 `NeRewrittenNotationBundle` 数据，不包含上游的 Vue、registry、settings、状态模型或注册生命周期。运行时始终由本项目唯一的 `NotationRegistry` 负责定义归一化、owner、事务、注册、注销、树初始化和持久化。

每个相关分类目录使用小型 `zz-ne-rewritten.js` 文件调用
`register.installRewrittenBundle(spec, NeRewrittenNotationBundle)`。`spec.add` 选择需要新增的定义，
`spec.generators` 选择需要注册的生成族，`spec.decorate` 把兼容的等价表示、归属等元数据附加到
现有同源 ID。分类文件只声明选择关系；转换和生命周期规则均属于注册表。

在依赖安装后，可用指定 commit 的干净上游 checkout 重建或校验：

```bash
npm run build:ne-rewritten-notations -- --source ../ne-rewritten-source
npm run build:ne-rewritten-notations -- --source ../ne-rewritten-source --check
```

构建脚本拒绝非固定 commit、带 tracked 修改的上游 checkout，以及进入 Vue/UI/registry/settings 等非算法模块的依赖。Bundle schema v2 保留纯算法 generator 的 `start`、`initial` 和 `create(index)`，但实际注册、注销、树初始化和持久化仍由本项目现有 registry 与 `ne-config` 管理。

下拉菜单按上游 `category_id` / `parent_id` 显示远端新增定义。带 generator 的文件夹显示 `- / 当前上限 / +`：初次加载 `start...initial`，`+` 只注册下一个整数变种，`-` 从当前上限开始注销且最低保留 `start`。当前上限保存在 `ne-config.generatorState`，并限制在 64 以内以防损坏的持久化数据在启动时批量创建无界记号。注销会卸载该记号的实时树但保留分析文本、折叠状态和便利贴；无法直接 JSON 表示的极限哨兵通过规范显示字符串恢复。再次增加同一变种时自动恢复。`CpS / n-CpS` 同样是生成文件夹，其中 `1-CpS`、`2-CpS`、... 是拥有独立展开树与 FS 缓存的不同主记号；旧版 `n-cps` 选择、分析文字和便利贴迁移到 `2-CpS`。

### 管理本地记号文件（无需修改 index.html）

Settings 中的 **Local notation files** 工作区将文件和草稿保存在 `localStorage`：

1. **Guide / 开发指南**：在应用内读取 `docs/making-a-notation.md`，不改变文件或草稿状态。
2. **Upload .js**：确认信任后立即尝试加载；失败的源码仍以禁用文件保留，便于编辑修复。
3. **New PrSS**：创建一个禁用的唯一命名模板，只打开编辑器，不执行源码。
4. **Save**：禁用文件只保存；启用文件在完整校验成功后自动热替换该文件的全部注册。
5. 文件列表开关：启用会加载整个文件，禁用会卸载整个文件但保留源码、分析和笔记。
6. **Download**：下载单个文件；存在未保存草稿时可选择保存、直接下载草稿或取消。
7. 删除：确认后永久删除文件源码、草稿及该文件拥有的分析和笔记。

**工作原理：**

```
文件源码 → 隔离函数作用域中执行 register.push()/register_notation()/register_category()/analysis_register.push()
  → 暂存并验证两个注册表、每个主记号的 init()
  → 在一次 localStorage 写入中更新源码并清除草稿，再原子提交 owner 的全部注册
  → 按 ID 更新选择和受影响的数据树
```

本地文件可以使用页面已经提供的 shared 函数和内置记号，但不能依赖另一个本地文件。用户首次执行非模板源码时必须确认信任；这是函数作用域隔离，不是安全沙箱。未保存草稿单独持久化，刷新后可恢复且绝不会执行。

## 分析输入与 LaTeX 渲染

分析输入框逐节点编辑 `Analysis text`，但可见性和宽度是全局设置。输入框默认显示、默认宽度为 180px，可在 Settings 用滑杆调整，也可横向拖动任一输入框同步更新全部输入框；共享设置限制在 60..600px。窄屏可以视觉压缩输入框，但不会把该临时压缩写回共享宽度。隐藏输入框只隐藏编辑控件，不删除已保存文本。

**Render analysis as LaTeX** 默认关闭，并独立于表达式的 HTML/LaTeX 模式。开启后，非空分析输入框在获得焦点或编辑时显示浮动 KaTeX 预览，基本列提示框也把分号后的分析文本渲染为 KaTeX；关闭时两处继续显示原文本。分析文本直接作为 KaTeX 源处理，不经过 `htmlToLatex()`，并复用用户的 LaTeX 命令。失焦、删除文本、关闭预览或隐藏输入框时只收起浮动预览；分析预览开启时，它优先于同一输入焦点触发的图表浮窗。

**Show LaTeX in analysis fields when not editing** 是上述设置的子开关，默认关闭。两个开关同时开启时，非空分析输入框在失焦状态用同宽的 KaTeX 层显示；点击或用键盘聚焦后立即恢复 raw LaTeX 输入，并继续显示原有浮动预览。空字符串和纯空白始终保留输入框，隐藏分析输入框会同时隐藏 raw 输入和行内 KaTeX。该显示层不改变保存、导入、导出或分析基本列所使用的原始文本。

## 设置信息持久化

所有用户设置压缩为单个 `localStorage` 键 `ne-config`（JSON 格式），不再分多个键。

**存储的字段：**

| 键名 | 类型 | 说明 |
|------|------|------|
| `darkMode` | boolean | 暗黑模式 |
| `lang` | string | 语言 (`'en'` / `'zh'`) |
| `displayMode` | string | 表达式渲染模式 (`'html'` / `'latex'`) |
| `equivActive` | object | 以 `ownerId::notationId` 为键的活动等价表示 ID |
| `equivHideOriginal` | object | 以 `ownerId::notationId` 为键的原表示隐藏状态；未记录时默认为隐藏 |
| `latexCommands` | string | 用户自定义的 KaTeX 宏声明，默认空字符串 |
| `analysisLatexPreview` | boolean | 是否在聚焦预览和基本列提示框中将分析文本渲染为 LaTeX |
| `analysisLatexInline` | boolean | 是否在分析文本非编辑状态显示行内 LaTeX；依赖 `analysisLatexPreview` |
| `analysisInputVisible` | boolean | 是否显示全部分析输入框 |
| `analysisInputWidth` | number | 全局分析输入框宽度（60..600px） |
| `diagramFollow` | boolean | 画布跟随鼠标 |
| `autoScroll` | boolean | 焦点自动滚动/居中 |
| `exportHide` | boolean | 导出包含隐藏状态 |
| `useAlt` | boolean | 使用短基本列 |
| `diagramScale` | number | 画布缩放 |
| `tier` | number | 全局展开层级（不再按记号分别保存） |
| `lengthLimit` | number | 自动展开项数限制 |
| `fsShown` | number | 提示框 FS 最大下标（显示 `0..fsShown`，全局统一） |
| `analysisId` | string | 当前分析记号 ID |
| `mainId` | string | 当前主记号 ID |
| `autoSaveInterval` | number | 自动保存分析的间隔秒数 |
| `autoSaveHidden` | boolean | 自动保存时是否包含隐藏状态 |

所有设置仅在框架 (`framework.js`) 中管理，记号文件无需关心。

## 分析数据持久化

Notation Explorer 会自动保存和恢复用户的分析数据，包括展开树中的分析文本和便利贴内容。

### 存储方式

分析数据存储在 `localStorage` 的 `ne-analysis` 键中（JSON 格式），与设置数据 (`ne-config`) 分开管理。

### 存储内容

```json
{
  "version": 3,
  "savedAt": 1700000000000,
  "notations": {
    "@notation-explorer/builtin::omega-Y": {
      "ownerId": "@notation-explorer/builtin",
      "notationId": "omega-Y",
      "items": [
        { "expr": [0,1,2,3], "analysis": "ε₀", "hide": false },
        { "expr": [0,1,2],   "analysis": "ω^ω" }
      ]
    }
  },
  "noteSheets": {
    "@notation-explorer/builtin::omega-Y": [{ "name": "Sheet2", "text": "笔记内容..." }]
  }
}
```

| 字段 | 说明 |
|------|------|
| `version` | 数据格式版本（当前为 3） |
| `savedAt` | 保存时间戳 |
| `notations` | 以 `ownerId::notationId` 为键的分析树归档 |
| `notations[key].ownerId` | 内置 owner 或本地文件的稳定 ID |
| `notations[key].notationId` | 注册表中的记号 ID |
| `notations[key].sourceRevision` | 本地文件加载时的源码版本，用于拒绝恢复过期分析 |
| `notations[key].items` | 有分析内容的节点列表 |
| `items[].expr` | 内部表达式（原始引用，非序列化字符串） |
| `items[].analysis` | 用户输入的分析文本 |
| `items[].hide` | （可选）是否隐藏子项 |
| `noteSheets` | 同样按 `ownerId::notationId` 保存的便利贴数据 |

### 读取时机

应用启动时自动恢复（`loadAnalysis()` 在 `mounted()` 中调用）：
1. 读取 `ne-analysis` JSON
2. 按 owner 和记号 ID 匹配当前注册项；本地源码版本必须一致
3. 对每个记号的 items，通过 `expr` 展开分析树
4. 将分析文本填入匹配的节点
5. 恢复便利贴内容

### 保存时机

- **自动保存（周期）**：`startAutoSave()` 按 `autoSaveInterval`（设置页可调，默认 60 秒）周期性调用 `saveAnalysis()`
- **手动导出**：通过「Export analysis」按钮调用 `export_xlsx()` 导出为 `.xlsx` 文件

### exports 导出/导入分析

**导出（Export analysis）：**
- 遍历当前记号的整个展开树
- 用当前等价表示的 `plain(expr)` 生成表达式标识；未选择等价表示时使用主 `notation.display(expr)`，再与用户输入的 `analysis` 文本一起写入 xlsx
- 便利贴内容以 Sheet2+ 形式导出

**导入（Import analysis）：**
- 读取 xlsx 的 Sheet1，每行 `[表达式字符串, 分析文本, 可选隐藏状态]`
- 用当前等价表示的解析器还原为内部表达式；未选择等价表示时使用 `safeFromDisplay(notation, str)`
- 执行展开直到匹配，填入分析文本

> 导出/导入使用当前活动表示的纯文本协议，不受 HTML/LaTeX 渲染模式影响，也不会写入 KaTeX HTML 或 `latex(expr)` 源文本。活动等价表示没有解析器时，导入会拒绝该表示，不会回退主解析器。

## Vue 组件与热替换

框架使用三个通用组件，不再根据记号 ID 动态注册组件：

```js
app.component('notation-expression', { /* HTML/LaTeX 展示边界 */ });
app.component('notation-tree', { /* 根列表 */ });
app.component('notation-list-item', { /* 递归节点 */ });
```

递归组件通过 `notationId` 从注册表读取当前定义，并把原始表达式对象交给 `notation-expression`。基本列提示框保留 `{ index, expr, comment }`，所有条目共享 index / expression / analysis 三列；即使某项没有分析文本也保留空的第三格，因此每项表达式左对齐，所有可见分号从最长表达式之后的同一位置开始。分析列的正文随 `analysisLatexPreview` 在原文本与 KaTeX 之间切换，分号始终保留在数学公式之外。主树中的分析输入始终挂载；启用 `analysisLatexInline` 后只用 `:focus-within` 在 raw 输入与同尺寸 KaTeX 层之间切换，因此方向键导航、自动聚焦和宽度调整仍使用原输入元素。

根树的 key 包含记号 ID 的运行时版本，因此同 ID 的本地源码替换会卸载旧组件实例并挂载新定义，而无关记号的树不受影响。渲染模式不属于这个 key，切换 HTML/LaTeX 不会重新挂载树。

## 工具页面

应用通过顶部导航栏中的 **Tools** 页面提供三个调试/工具功能。

### 1. 无穷降链检测（Inf Chain Detection）

从 Limit 的基本列出发，DFS 检测记号是否存在无穷降链。

- **Notation** — 选择要检测的记号
- **Limit** — 取 Limit 的前 N 个基本列（默认 6）
- **Max steps** — 每个分支最多展开步数（默认 50）
- **Max n** — 尝试展开 n=0..N（默认 1）
- **Preview** — 检测到无限时输出前 N 项（默认 8）
- **Max visited** — 最大访问节点数（默认 2000）
- 点击 **Run** 执行检测（对应 Vue 方法 `runInfChain`），结果输出到下方终端区域

### 2. DFS 差异对比（DFS Diff）

比较两个记号的 FS 展开结果差异。

- **Notation A / B** — 选择要对比的两个记号
- **DFS limit** — 每个分支最大深度（默认 10）
- **Max FS pos** — 最大 FS 位置（默认 3）
- **Max visited** — 最大访问节点数（默认 200）
- 点击 **Diff** 执行对比（对应 Vue 方法 `runDiff`），结果输出到下方终端区域

### 3. 直接展开（Direct Expansion）

直接展开指定记号的指定表达式，查看其基本列结果。

- **Notation** — 选择要展开的记号
- **Expression** — 输入表达式字符串（如 `0,1,2,3`，或 `Limit`）
- **Start n** — 起始 FS 位置（默认 0）
- **Count** — 连续展开几项（默认 1）
- 点击 **Expand** 执行展开（对应 Vue 方法 `runExpand`），结果输出到下方终端区域

支持 `Limit` / `Infinity` / `∞` 作为极限表达式。

### 4. PPS 翻译

将 PPS 序列转换为 PrSS 标准形式和 Cantor Normal Form。

### 底层实现

工具功能对应 `js/framework.js` 中的四个 Vue 方法：

| 工具 | Vue 方法 | 后端逻辑 |
|------|---------|---------|
| 无穷降链检测 | `runInfChain()` | `window.debugTools.detectInfChain()`（定义在 `debug-tools.js`） |
| DFS 差异对比 | `runDiff()` | 直接调用两个记号的 `FS` 比较 |
| 直接展开 | `runExpand()` | 直接调用记号的 `FS` |
| PPS 翻译 | `runPPS()` | 全局函数 `pps()`、`std()`、`tran()` |

## CLI 脚本

项目根目录下提供两个 Node.js CLI 脚本，功能与工具页面同步：

- **`dfs-detect.js`** — DFS 无穷降链检测器，详见 `docs/dfs-diff.md`
- **`dfs-diff.js`** — DFS 差异对比，详见 `docs/dfs-diff.md`

CLI 脚本与浏览器清单共用递归发现和排序契约，直接扫描 `js/notations` 中以 `.js` 结尾的活动文件；`.js.disable` 不会执行。CLI 不再解析 `index.html`。

## 常见模式与最佳实践

### 1. IIFE 包裹

用 `;(() => { ... })()` 包裹整个文件，避免变量污染。

### 2. 缓存

FS 计算通常较慢，统一使用闭包缓存模式。注意对 `Infinity` 和空序列也做缓存。

### 3. FS 调用约定

- `FS(expr, 0)` 返回基本列的第 0 项（最小的下一级）
- `FS(expr, 1)` 返回第 1 项
- 框架通过循环调用直到结果 > `bound` 来确定实际使用的项
- 展开层级 `tier` 控制 FS 被调用的深度

### 4. Infinity 处理

始终在 `display` 中把 `Infinity` 显示为 `"Limit"`，在 `compare` 中处理 `Infinity` 为最大。

### 5. 导出/导入分析

- 导出：调用活动表示的 `plain(expr)` 获取字符串标识，与用户输入的分析文本一起写入 xlsx；未选择等价表示时回退主 `display(expr)`
- 导入：调用活动表示的解析器将行首字符串还原为内部表达式，然后执行展开直到匹配；活动等价表示没有解析器时拒绝导入

### 6. 下拉菜单 + 中英文

名称通过 `name` 字段显示。如果希望下拉菜单内容也支持中英文切换，可以动态修改 `name` 属性。

## 调试技巧

### 浏览器 DevTools

1. **打开浏览器 DevTools Console**，检查 `register` 和 `analysis_register` 注册表
2. 输入框聚焦时，观察 `showCanvas` 和 `diagram` 数据是否正确
3. FS 缓存可以通过 `console.log` 在 IIFE 闭包内输出调试

### 快速测试展开逻辑

创建 JS 后在 Node.js 中快速验证展开逻辑：

```bash
node -e "
  function expand(seq, n) { /* 粘贴展开函数 */ }
  console.log(expand([0,1,2,3], 0));
"
```

或直接在浏览器 DevTools Console 中用 `register.get('id')` 检查指定记号。

## 参考文件

- **记号开发入门**：`docs/making-a-notation.md`（精简版，逐字段说明 + 加载/测试方式）
- **最小示例（带注释）**：`docs/example-PrSS.js`（~65 行，详注，适合作为新记号起点模板）
- **序列型参考**：`js/notations/Y/omega-Y.js`（含 drawDiagram、FSalter、缓存）
- **矩阵型参考**：`js/notations/BM-like/BM.js`（典型 Matrix 实现）
- **字符串型参考**：`js/notations/OCN/cOCF.js`（完整自包含记号系统）
- **PPS 参考**：`js/notations/PPS/sPPS4.js`（含 FS、FSalter、FSShort）
- **LaTeX 展示适配**：`js/latex-renderer.js` 与 `tests/latex-renderer.test.js`
- **本地文件管理**：Settings → Local notation files，上传或创建 `docs/example-PrSS.js` 对应模板
