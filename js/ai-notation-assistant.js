;(function (root, factory) {
   var api = factory(root)

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.AINotationAssistant = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
   'use strict'

   var SESSION_KEYS = Object.freeze({
      baseUrl: 'ne-ai-base-url',
      apiKey: 'ne-ai-api-key',
      model: 'ne-ai-model',
   })
   var MAX_TOOL_ROUNDS = 8
   var MAX_OUTPUT_LENGTH = 120000
   var DEFAULT_MODEL = 'gpt-4o-mini'
   var DEFAULT_BASE_URL = 'https://api.openai.com'
   var FALLBACK_CONTEXT = [
      'Notation Explorer local notation files are JavaScript source files.',
      'A file must register at least one main or analysis notation.',
      'Main registrations normally provide id, name, display, fromDisplay, able, compare, FS, and init.',
      'FS(expr, n) must return the nth fundamental-sequence term and handle the Limit expression.',
      'Use an IIFE to avoid leaking variables. Do not execute or trust generated source automatically.',
   ].join('\n')
   // Replaced by scripts/build-ai-context.js with the checked-in authoring
   // guide and PrSS template. Keeping the value in this file means generation
   // needs no second documentation request.
   var BUILTIN_CONTEXT = "## Built-in notation authoring guide (docs/making-a-notation.md)\n\n# 如何开发一个记号文件（Notation File）\n\n本文档聚焦于如何编写一个记号文件。完整的 Notation Explorer 项目文档见 `notation-dev-guide.md`。\n\n## 文件结构\n\n每个记号文件是一个独立的 `.js` 文件，遵循以下固定结构：\n\n```js\n;(() => {\n   // 1. 展开逻辑（核心算法）\n   function expand(seq, n) { /* ... */ }\n\n   // 2. 注册到主记号注册表\n   register.push({\n      id: 'my-notation',       // 唯一标识符\n      name: 'My Notation',     // 下拉菜单显示名\n      display: function(expr) { /* ... */ },\n      fromDisplay: function(str) { /* ... */ },\n      able: function(seq) { /* ... */ },\n      compare: sequence_compare,\n      FS: function(seq, n) { /* ... */ },\n      init: function() { /* ... */ },\n   });\n})();\n```\n\n**注意：** 所有代码包裹在 IIFE `;(() => { ... })()` 中，避免变量污染全局作用域。\n\n## 支持的两种注册格式\n\nNotation Explorer 原生支持本项目格式和 `ne-rewritten` 格式。两种格式最终进入同一个注册表、使用同一套展开树和本地文件生命周期，不存在单独的兼容运行时。\n\n### 本项目格式\n\n上面的 `register.push({...})` 是原有格式。它要求 `display`、`able`、`compare`、`FS` 和返回树节点数组的 `init`。旧记号文件可以继续使用该接口；也可以将同一个对象传给 `register_notation({...})`。\n\n### ne-rewritten 格式\n\nne-rewritten 原始对象必须使用 `register_notation({...})`，不能传给 `register.push(...)`：\n\n```js\n;(() => {\n   register_notation({\n      id: 'my-rewritten',\n      name: 'My Rewritten Notation',\n      simple_name: 'MyRW',          // 可选：文件夹中的短名称\n      category_id: 'my-category',   // 可选：所属分类 ID\n\n      display: {\n         plain: function(expr) { return String(expr); },\n         html: function(expr) { return '<b>' + expr + '</b>'; },\n         latex: function(expr) { return '\\\\mathbf{' + expr + '}'; },\n         from_display: function(text) { return Number(text); },\n         from_display_alter: function(text) { return Number(text); }, // 可选\n      },\n\n      is_limit: function(expr) { return expr === Infinity; },\n      compare: function(a, b) { return a === b ? 0 : a < b ? -1 : 1; },\n      FS: function(expr, n) { return expr === Infinity ? n + 1 : 0; },\n      FS_alter: function(expr, n) { return expr; }, // 可选\n      FS_short: function(expr, n) { return expr; }, // 可选\n\n      // ne-rewritten 的 init 返回原始表达式，不返回树节点。\n      init: function() { return [Infinity, 0]; },\n   });\n})();\n```\n\n框架会做以下映射：\n\n| ne-rewritten 字段 | 本项目中的用途 |\n|------|------|\n| `display.html` | 主树 HTML 显示，即本项目的 `display` |\n| `display.plain` | 导入导出等纯文本显示；省略时回退到 `html` |\n| `display.latex` | KaTeX 源；省略时由支持的 HTML 子集转换 |\n| `display.from_display` | `fromDisplay` |\n| `display.from_display_alter` | `fromDisplay_alter` |\n| `is_limit` | `able` |\n| `FS_alter` | `FSalter` |\n| `FS_short` | `FSShort` |\n| `init() => expr[]` | 自动转换为 `{ expr, low, subitems }[]` |\n\n`init()` 中每个表达式以下一个表达式为下界，最后一个表达式以自身为下界。`display_equiv`、`credit_text_id` 和受支持的 `draw_diagram` 元数据也会保留。\n\n不要混写两套字段：带 `is_limit` 的 ne-rewritten 对象不要再提供 `able`。`from_display` 必须放在 `display` 对象内。直接编写一个 ne-rewritten 对象时无需提供远端 bundle 参数。\n\n## register 对象的每个字段\n\n### `id`（必填，string）\n\n当前注册表中的非空唯一标识符。应用选择、分析归档和热替换都通过这个稳定 ID 关联；建议使用小写字母、数字和连字符组成的可读 ID。\n\n```js\nid: 'prss'\n```\n\n### `name`（必填，string）\n\n显示在下拉菜单中的名称，可含任意 Unicode 字符。\n\n```js\nname: 'PrSS'\n```\n\n### `display`（必填，expr → string）\n\n将内部表达式转为可读字符串。**必须处理 `Infinity`**。\n\n```js\ndisplay: function(expr) {\n   if ('' + expr === 'Infinity') return 'Limit';\n   return '' + expr;\n}\n```\n\n### `latex`（可选，expr → KaTeX source）\n\n当 `display` 的历史 HTML 不能表达所需排版时，可返回不含 `$...$` 或 `\\(...\\)` 定界符的 KaTeX 数学源。该函数只影响主树和基本列提示框的展示，不参与导航、导入导出或工具输出。\n\n```js\nlatex: function(expr) {\n   if ('' + expr === 'Infinity') return '\\\\mathrm{Limit}';\n   return String(expr).replace(/,/g, ',\\\\,');\n}\n```\n\n不实现 `latex` 时，框架会转换 `display(expr)` 中受支持的 `<sub>` / `<sup>`、希腊字母和少量 HTML 实体。应用不提供默认 `\\newcommand` 或 `\\renewcommand`；用户可在 Settings 中自行定义。\n\n### `fromDisplay`（推荐，str → expr）\n\n将用户输入的字符串解析为内部表达式。这是 `display` 的逆操作。\n用于「Navigate to notation」对话框和分析导入。\n\n```js\nfromDisplay: function(str) {\n   str = str.trim();\n   if (str === 'Limit') return [Infinity];\n   var result = str.split(',').map(function(s) { return parseInt(s.trim(), 10); });\n   // 验证输入合法性...\n   return result;\n}\n```\n\n> 若解析失败应抛出异常，框架会自动捕获并用 `fromDisplay_alter` 兜底。\n\n### `able`（必填，expr → boolean）\n\n判断表达式是否还可以继续展开（即是否还有极限）。\n\n```js\nable: function(seq) {\n   return seq.length > 0 && seq[seq.length - 1] > 1;\n}\n```\n\n- 返回 `true` → 可展开（有子项）\n- 返回 `false` → 后继项（无法再展开）\n\n### `compare`（必填，a, b → -1 / 0 / 1）\n\n比较两个表达式的大小。**必须正确处理 `Infinity`**。\n\n```js\ncompare: sequence_compare  // 序列型——使用 00-shared-seq.js 提供的函数\n```\n\n对于满足字典序的序列型记号（`number[]`），直接用 `sequence_compare`。\n对于满足字典序的矩阵型记号（`number[][]`），用 `matrix_compare`。\n对于自定义表达式类型，需要自己实现三路比较。\n\n### `FS`（必填，expr, n → expr）\n\n基本列（Fundamental Sequence）函数。返回 `expr` 的第 `n` 项。\n这是整个记号文件的核心。\n\n**缓存模式（推荐）：**\n\n```js\nFS: (function() {\n   var cache = {};\n   return function(seq, n) {\n      if ('' + seq === 'Infinity') {\n         // 极限的基本列\n         var result = [];\n         for (var i = 0; i < n; i++) result.push(i + 1);\n         return result;\n      }\n      if (seq.length === 0) return [];  // 空序列\n      var key = '' + seq;\n      if (!cache[key]) cache[key] = [];\n      else if (cache[key][n] !== undefined) return cache[key][n];  // 缓存命中\n      return cache[key][n] = expand(seq, n);  // 计算并缓存\n   };\n})()\n```\n\n**需要注意：**\n- `FS(expr, 0)` 返回第 0 项（最小的下一级）\n- `FS(expr, 1)` 返回第 1 项\n- 框架循环调用直到 `compare(result, bound) > 0`\n- 必须处理 `Infinity`——当 `expr === Infinity` 时，返回极限的第 n 项\n- 使用闭包缓存避免重复计算\n\n### `init`（必填，() → array）\n\n返回初始的树节点列表。通常包含极限和空序列两个根节点：\n\n```js\ninit: function() {\n   return [\n      { expr: [Infinity], low: [[]], subitems: [] },  // 极限\n      { expr: [],         low: [[]], subitems: [] },  // 空序列（最小项）\n   ];\n}\n```\n\n每个元素包含：\n- `expr` — 内部表达式\n- `low` — 下界（通常为 `[[]]`）\n- `subitems` — 子项（初始为空 `[]`，展开时动态填充）\n\n### 可选字段\n\n| 字段 | 类型 | 说明 |\n|------|------|------|\n| `FSalter` | `(expr, n) => expr` | 备选基本列 |\n| `FSShort` | `(expr, n) => expr` | 短基本列（勾选 \"Use alternative\" 时使用） |\n| `fromDisplay_alter` | `(str) => expr` | 备选解析函数 |\n| `semiable` | `(expr) => boolean` | 是否可语义化 |\n| `drawDiagram` | `(expr) => diagramObject` | 山图画图函数 |\n\n## 加载与安装\n\n### 作为内置记号（自动发现）\n\n将 `.js` 文件放入对应的谱系目录；没有对应谱系时使用 `Misc/`，然后运行：\n\n```bash\nnode generate-notation-manifest.js\n```\n\n无需修改 `index.html`。文件按最多四级分类目录、再按文件名的区分大小写字典序加载。要暂时排除内置文件，将 `MyNotation.js` 重命名为 `MyNotation.js.disable` 并重新生成清单；恢复 `.js` 即重新启用。\n\n这种方式随应用发布，不能在本地文件管理器中启用、禁用或编辑。\n\n### 作为持久化本地文件（通过设置页）\n\n不需要修改仓库即可加载自己的文件：\n\n1. 打开 Settings → **Local notation files**。\n2. 可先点击 **Guide / 开发指南** 在应用内阅读本文档。\n3. 点击 **Upload .js** 并选择文件名以 `.js` 结尾的源码。\n4. 检查源码后确认信任；页面会立即尝试启用整份文件。\n5. 加载成功后即可在记号菜单中选择它；刷新页面后仍会自动恢复。\n\n源码、启用状态和未保存草稿保存在浏览器 `localStorage` 的 `ne-local-notation-files` 中。本地文件的加载规则如下：\n\n- 上传成功后文件立即启用；加载失败时保留为可编辑的禁用文件。\n- 刷新时只自动执行已启用且已信任的文件；启动失败的文件会自动禁用。\n- 保存已启用文件会事务热替换整个文件；失败时旧源码和旧注册继续运行，失败草稿仍会保留。\n- 保存禁用文件只更新源码，不执行它。\n- **New PrSS** 创建禁用模板并打开编辑器。\n- 文件级开关会整体加载或卸载该文件注册的所有主记号、分析记号、分类和生成器。\n- 本地文件可以使用页面提供的 shared 函数和内置记号，但不能依赖其他本地文件。\n\n一个文件可以多次调用 `register.push(...)`、`register_notation(...)`、`register_category(...)` 和 `analysis_register.push(...)`。主记号与分析记号使用独立 ID 命名空间；同一命名空间内的 ID 必须唯一。文件必须产生至少一个主记号或分析记号；只有不生成任何记号的空分类不能单独加载。\n\n## 生成类记号与 `+/-` 接口\n\n一组按整数参数生成的记号应注册为一个分类生成器。记号菜单会把它显示为独立文件夹，并自动提供 `+`、`-` 按钮：\n\n```js\n;(() => {\n   register_category({\n      id: 'n-demo',\n      name: 'Generated Demo',\n      simple_name: 'n-Demo',\n      path: ['Examples', 'n-Demo'],\n\n      generator: {\n         start: 1,\n         initial: 2,\n         maximum: 64,\n\n         create: function(index) {\n            return {\n               id: 'demo-' + index,\n               name: index + '-Demo',\n               category_id: 'n-demo',\n\n               // create 可返回这种 ne-rewritten 对象，也可返回本项目格式对象。\n               display: function(expr) { return String(expr); },\n               is_limit: function(expr) { return expr === Infinity; },\n               compare: function(a, b) { return a === b ? 0 : a < b ? -1 : 1; },\n               FS: function(expr, n) { return expr === Infinity ? index + n : 0; },\n               init: function() { return [Infinity, 0]; },\n            };\n         },\n      },\n   });\n})();\n```\n\n注册分类时会自动生成从 `start` 到 `initial`（含两端）的项目，不需要再调用 `init_generator(...)`。`+` 每次注册下一个整数变体；`-` 每次注销当前最大的变体，并在 `start` 停止。生成器状态由应用保存，重新加载后会恢复。\n\n生成器字段：\n\n| 字段 | 说明 |\n|------|------|\n| `start` | 必须保留的最小安全整数索引 |\n| `initial` | 初次加载时生成到的索引，必须不小于 `start` |\n| `maximum` | 允许增加到的最大索引；省略时为 `max(initial, 64)` |\n| `create(index)` | 返回该索引对应的本项目格式或 ne-rewritten 格式主记号 |\n| `resolveId(index, notation)` | 可选，重写生成项目的实时 ID；别名为 `idForIndex`、`mapId` |\n\n若 `create(index)` 返回 ne-rewritten 对象，其 `category_id` 必须与生成器分类的 `id` 相同。`maximum` 可以显式设为更小或更大的安全整数；项目默认值是 64，并不是注册表强制的硬上限。\n\n脚本可用以下全局函数控制生成器：\n\n```js\ngenerator_current('n-demo');        // 当前最大索引\ngenerator_can_increment('n-demo');  // 能否增加\ngenerator_can_decrement('n-demo');  // 能否移除\ngenerator_increment('n-demo');      // 返回新增记号；不能增加时返回 undefined\ngenerator_decrement('n-demo');      // 返回移除记号；不能移除时返回 undefined\n```\n\n`register` 上提供等价方法：\n\n```js\nregister.generatorCurrent(id);\nregister.generatorMaximum(id);\nregister.generatorCanIncrement(id);\nregister.generatorCanDecrement(id);\nregister.generatorAdd(id);       // 别名：generatorIncrement\nregister.generatorRemove(id);    // 别名：generatorDecrement\n```\n\n在本地文件中，这些函数在源码同步执行时操作该文件的暂存生成族；文件成功启用或保存后，已被回调闭包捕获的同一组 `generator_*` 函数和 `register.generator*` 方法会自动操作实时注册表。加载失败或事务回滚后，这些句柄不能继续使用。\n\n`init_generator(categoryOrId)` 仍为兼容接口，但 `register_category(...)` 已自动初始化，之后重复调用不会重复注册。分类可使用 `parent_id` 组成真实的多层层级，也可用 `path` 提供显示路径。本地文件在事务提交时允许先声明子分类、后声明父分类；直接作为内置脚本执行时应先注册父分类。\n\n## 测试记号\n\n### 浏览器快速测试\n\n1. 打开 DevTools Console（F12）\n2. 检查注册表：`console.table(register.map(n => ({ id: n.id, name: n.name })))`\n3. 按 ID 调用 FS：`register.get('my-notation').FS([0,1,2,3], 0)`\n\n### Node.js 快速验证\n\n```bash\nnode -e \"\n  function expand(seq, n) {\n    // 粘贴展开函数\n  }\n  console.log(expand([0,1,2,3], 0));\n\"\n```\n\n## 序列型 vs 矩阵型\n\n| 类型 | 表达式 | compare | display | 共享文件 |\n|------|--------|---------|---------|---------|\n| 序列型 | `number[]` 如 `[0,1,2,3]` | `sequence_compare` | `sequence_display` | `00-shared-seq.js` |\n| 矩阵型 | `number[][]` 如 `[[0],[1],[2]]` | `matrix_compare` | `matrix_display` | `01-shared-matrix.js` |\n\n## 参考文件\n\n- **最小工作示例：** `docs/example-PrSS.js`（与 Settings 中的 PrSS 模板保持一致）\n- **完整参考：** `js/notations/Y/omega-Y.js`（含 drawDiagram、FSalter、缓存）\n- **矩阵型参考：** `js/notations/BM-like/BM.js`\n- **字符串型参考：** `js/notations/OCN/cOCF.js`\n- **PPS 变体参考：** `js/notations/PPS/sPPS4.js`\n- **开发指南：** `docs/notation-dev-guide.md`\n\n\n## Built-in PrSS template (docs/example-PrSS.js / PrSSTemplate.DEFAULT_SOURCE)\n\n// PrSS - Primitive Sequence System\n// A complete, self-contained notation file compatible with register.push(...).\n;(function() {\n   'use strict';\n\n   // Return the 1-based position of the rightmost term below the final term.\n   function findBadRoot(seq, last) {\n      for (var index = seq.length - 1; index >= 0; index--) {\n         if (seq[index] < last) return index + 1;\n      }\n      return null;\n   }\n\n   // Compute term n of the fundamental sequence. This is the standard PrSS\n   // expansion algorithm; the cache below only avoids repeating this work.\n   function expand(seq, n) {\n      if (seq.length === 0) return [];\n\n      var last = seq[seq.length - 1];\n      if (last <= 1) return seq.slice(0, -1);\n\n      var badRoot = findBadRoot(seq, last);\n      if (badRoot === null) return seq.slice(0, -1);\n\n      var goodPart = seq.slice(0, badRoot - 1);\n      var badPart = seq.slice(badRoot - 1, seq.length - 1);\n      if (badPart.length === 0) {\n         return seq.slice(0, -1).concat(last - 1);\n      }\n\n      var result = goodPart.slice();\n      for (var index = 0; index < n; index++) {\n         result = result.concat(badPart);\n      }\n      return result;\n   }\n\n   function compareSequences(left, right) {\n      var length = Math.min(left.length, right.length);\n      for (var index = 0; index < length; index++) {\n         if (left[index] < right[index]) return -1;\n         if (left[index] > right[index]) return 1;\n      }\n      if (left.length < right.length) return -1;\n      if (left.length > right.length) return 1;\n      return 0;\n   }\n\n   function parseSequence(value) {\n      var source = String(value).trim();\n      if (source === 'Limit') return [Infinity];\n      if (source === '') return [];\n\n      return source.split(',').map(function(part) {\n         var token = part.trim();\n         if (!/^(?:0|[1-9]\\d*)$/.test(token)) {\n            throw new Error('Illegal PrSS sequence');\n         }\n\n         var term = Number(token);\n         if (!Number.isSafeInteger(term)) {\n            throw new Error('Illegal PrSS sequence');\n         }\n         return term;\n      });\n   }\n\n   register.push({\n      id: 'prss',\n      name: 'PrSS',\n\n      display: function(expr) {\n         return String(expr) === 'Infinity' ? 'Limit' : String(expr);\n      },\n\n      fromDisplay: parseSequence,\n\n      able: function(seq) {\n         return seq.length > 0 && seq[seq.length - 1] > 1;\n      },\n\n      compare: compareSequences,\n\n      FS: (function() {\n         var cache = Object.create(null);\n\n         return function(seq, n) {\n            if (!Number.isInteger(n) || n < 0) {\n               throw new Error('PrSS fundamental-sequence index must be a non-negative integer');\n            }\n\n            // Limit[n] is [1, ..., n], so it contains exactly n terms.\n            if (String(seq) === 'Infinity') {\n               var limitTerm = [];\n               for (var index = 0; index < n; index++) limitTerm.push(index + 1);\n               return limitTerm;\n            }\n\n            if (!Array.isArray(seq)) throw new Error('Illegal PrSS sequence');\n            if (seq.length === 0) return [];\n\n            var key = JSON.stringify(seq);\n            var entries = cache[key];\n            if (!entries) entries = cache[key] = [];\n            if (Object.prototype.hasOwnProperty.call(entries, n)) return entries[n];\n\n            var result = expand(seq, n);\n            entries[n] = result;\n            return result;\n         };\n      })(),\n\n      init: function() {\n         return [\n            { expr: [Infinity], low: [[]], subitems: [] },\n            { expr: [], low: [[]], subitems: [] },\n         ];\n      },\n   });\n})();\n\n\n## Registration and FS constraints\n\nLocal notation source is a whole JavaScript file. Keep it self-contained and wrap it in an IIFE.\nUse register.push(...) for legacy notation objects or register_notation(...) for ne-rewritten objects.\nMain and analysis registrations use separate namespaces; IDs must be unique within each namespace.\nA main notation normally supplies id, name, display, fromDisplay, able, compare, FS, and init.\nFS(expr, n) returns the nth fundamental-sequence term, with n a non-negative integer, and must handle Infinity/Limit.\ninit() returns the initial expansion roots; FS and display must preserve the notation expression contract.\nGenerated source is an untrusted local file. Never execute, trust, enable, or replace a live file automatically.\nThe user must review the source and use the existing Trust and run flow before it executes with page privileges."
   var contextCache

   function storage(kind) {
      try {
         return root && root[kind] || null
      } catch (error) {
         return null
      }
   }

   function readSessionSettings() {
      var store = storage('sessionStorage')
      if (!store || typeof store.getItem !== 'function') return {}
      try {
         return {
            baseUrl: store.getItem(SESSION_KEYS.baseUrl) || '',
            apiKey: store.getItem(SESSION_KEYS.apiKey) || '',
            model: store.getItem(SESSION_KEYS.model) || '',
         }
      } catch (error) {
         return {}
      }
   }

   function writeSessionSettings(settings) {
      var store = storage('sessionStorage')
      if (!store || typeof store.setItem !== 'function') return
      settings = settings || {}
      try {
         ;[
            ['baseUrl', SESSION_KEYS.baseUrl],
            ['apiKey', SESSION_KEYS.apiKey],
            ['model', SESSION_KEYS.model],
         ].forEach(function (pair) {
            var value = settings[pair[0]]
            if (value === undefined || value === null || value === '') {
               if (typeof store.removeItem === 'function') store.removeItem(pair[1])
            } else {
               store.setItem(pair[1], String(value))
            }
         })
      } catch (error) {
         // Private browsing/quota failures must not prevent an in-memory run.
      }
   }

   function normalizeEndpoint(baseUrl) {
      var value = String(baseUrl || '').trim().replace(/\/+$/, '')
      if (!value) value = DEFAULT_BASE_URL
      if (/\/chat\/completions$/i.test(value)) return value
      if (/\/v1$/i.test(value)) return value + '/chat/completions'
      return value + '/v1/chat/completions'
   }

   function safeJson(value) {
      try { return JSON.parse(value) } catch (error) { return undefined }
   }

   function stringify(value, limit) {
      var text
      try { text = JSON.stringify(value, null, 2) } catch (error) { text = String(value) }
      text = String(text == null ? '' : text)
      return text.length > (limit || 20000) ? text.slice(0, limit || 20000) + '\n...[truncated]' : text
   }

   function errorMessage(error) {
      if (!error) return 'Unknown error.'
      if (typeof error === 'string') return error
      if (error.message) return String(error.message)
      return String(error)
   }

   function extractText(response) {
      var choices = response && Array.isArray(response.choices) ? response.choices : []
      var message = choices[0] && choices[0].message
      if (!message) return ''
      if (typeof message.content === 'string') return message.content
      if (Array.isArray(message.content)) {
         return message.content.map(function (part) {
            return part && (part.text || part.content) || ''
         }).join('')
      }
      return ''
   }

   function extractSource(text) {
      text = String(text || '').trim()
      var fenced = text.match(/```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/i)
      if (fenced) return fenced[1].trim()
      var marker = text.match(/(?:^|\n)\s*(?:source|code)\s*:\s*([\s\S]+)$/i)
      return marker ? marker[1].trim() : text
   }

   function toolDefinitions() {
      return [
         {
            type: 'function',
            function: {
               name: 'list_notations',
               description: 'List built-in and currently registered notation IDs and names.',
               parameters: { type: 'object', properties: {}, additionalProperties: false },
            },
         },
         {
            type: 'function',
            function: {
               name: 'inspect_notation',
               description: 'Inspect one registered notation, including display, parser, FS, and initial expressions.',
               parameters: {
                  type: 'object',
                  properties: { notation_id: { type: 'string' } },
                  required: ['notation_id'],
                  additionalProperties: false,
               },
            },
         },
         {
            type: 'function',
            function: {
               name: 'expand',
               description: 'Expand one notation expression with one or more FS indexes.',
               parameters: {
                  type: 'object',
                  properties: {
                     notation_id: { type: 'string' },
                     expression: { type: 'string', description: 'Display string or JSON expression.' },
                     indexes: { type: 'array', items: { type: 'integer', minimum: 0 } },
                  },
                  required: ['notation_id', 'expression', 'indexes'],
                  additionalProperties: false,
               },
            },
         },
         {
            type: 'function',
            function: {
               name: 'detect_inf_chain',
               description: 'Run the existing infinite-descending-chain detector for a notation.',
               parameters: {
                  type: 'object',
                  properties: {
                     notation_id: { type: 'string' },
                     limitTerm: { type: 'integer', minimum: 1, maximum: 20 },
                     maxSteps: { type: 'integer', minimum: 1, maximum: 500 },
                     maxN: { type: 'integer', minimum: 0, maximum: 8 },
                     preview: { type: 'integer', minimum: 1, maximum: 30 },
                     maxVisited: { type: 'integer', minimum: 10, maximum: 20000 },
                  },
                  required: ['notation_id'],
                  additionalProperties: false,
               },
            },
         },
         {
            type: 'function',
            function: {
               name: 'validate_source',
               description: 'Validate notation source without committing, persisting, trusting, or executing it in the live registry.',
               parameters: {
                  type: 'object',
                  properties: { source: { type: 'string' }, file_name: { type: 'string' } },
                  required: ['source'],
                  additionalProperties: false,
               },
            },
         },
      ]
   }

   function notationById(id) {
      var registries = [root && root.register, root && root.analysis_register]
      for (var registryIndex = 0; registryIndex < registries.length; registryIndex++) {
         var registry = registries[registryIndex]
         if (!registry) continue
         var found = typeof registry.get === 'function'
            ? registry.get(id)
            : Array.prototype.find.call(registry, function (entry) { return entry && entry.id === id })
         if (found) return found
      }
      return undefined
   }

   function notationDisplay(notation) {
      if (!notation) return function (value) { return value }
      if (typeof notation.display === 'function') return notation.display.bind(notation)
      if (notation.display && typeof notation.display.plain === 'function') return notation.display.plain.bind(notation.display)
      if (notation.display && typeof notation.display.html === 'function') return notation.display.html.bind(notation.display)
      return function (value) { return value }
   }

   function notationParser(notation) {
      if (!notation) return null
      if (typeof notation.fromDisplay === 'function') return notation.fromDisplay.bind(notation)
      if (typeof notation.from_display === 'function') return notation.from_display.bind(notation)
      if (notation.display && typeof notation.display.from_display === 'function') {
         return notation.display.from_display.bind(notation.display)
      }
      if (typeof notation.fromDisplay_alter === 'function') return notation.fromDisplay_alter.bind(notation)
      if (typeof notation.from_display_alter === 'function') return notation.from_display_alter.bind(notation)
      if (notation.display && typeof notation.display.from_display_alter === 'function') {
         return notation.display.from_display_alter.bind(notation.display)
      }
      return null
   }

   function notationSummary(notation) {
      if (!notation) return undefined
      var initial
      try { initial = typeof notation.init === 'function' ? notation.init() : [] } catch (error) { initial = { error: errorMessage(error) } }
      var display = notationDisplay(notation)
      var safeDisplay = function (value) {
         try { return display(value) } catch (error) { return '[display error]' }
      }
      var owner = root && root.notationRegistryHub && typeof root.notationRegistryHub.ownerOf === 'function'
         ? root.notationRegistryHub.ownerOf(notation)
         : undefined
      return {
         id: notation.id,
         name: notation.name,
         owner: owner,
         hasParser: !!notationParser(notation),
         hasAble: typeof notation.able === 'function',
         hasCompare: typeof notation.compare === 'function',
         hasFS: typeof notation.FS === 'function',
         initial: Array.isArray(initial) ? initial.slice(0, 8).map(function (item) {
            return item && Object.prototype.hasOwnProperty.call(item, 'expr')
               ? { display: safeDisplay(item.expr), expression: item.expr }
               : { display: safeDisplay(item), expression: item }
         }) : initial,
      }
   }

   function parseExpression(notation, expression) {
      if (typeof expression === 'string') {
         var parser = notationParser(notation)
         if (parser) return parser(expression)
         var parsed = safeJson(expression)
         if (parsed !== undefined) return parsed
      }
      return expression
   }

   // Remove comments without evaluating the source.  This is deliberately a
   // small lexical pass: validation must stay useful in browsers without an
   // AST parser, while never invoking generated notation code.
   function maskComments(source) {
      var text = String(source || '')
      var output = ''
      var index = 0
      var quote = ''
      while (index < text.length) {
         var character = text[index]
         var next = text[index + 1]
         if (quote) {
            output += character
            if (character === '\\') {
               if (index + 1 < text.length) output += text[++index]
            } else if (character === quote) {
               quote = ''
            }
            index++
            continue
         }
         if (character === '"' || character === "'" || character === '`') {
            quote = character
            output += character
            index++
            continue
         }
         if (character === '/' && next === '/') {
            output += '  '
            index += 2
            while (index < text.length && text[index] !== '\n' && text[index] !== '\r') {
               output += ' '
               index++
            }
            continue
         }
         if (character === '/' && next === '*') {
            output += '  '
            index += 2
            while (index < text.length) {
               if (text[index] === '*' && text[index + 1] === '/') {
                  output += '  '
                  index += 2
                  break
               }
               output += text[index] === '\n' || text[index] === '\r' ? text[index] : ' '
               index++
            }
            continue
         }
         output += character
         index++
      }
      return output
   }

   function uniqueStrings(values) {
      var seen = Object.create(null)
      return (values || []).filter(function (value) {
         if (typeof value !== 'string' || !value || seen[value]) return false
         seen[value] = true
         return true
      })
   }

   function staticIds(source, pattern) {
      var ids = []
      var match
      var expression = new RegExp(pattern, 'g')
      while ((match = expression.exec(source))) {
         var windowText = source.slice(match.index, Math.min(source.length, match.index + 1600))
         var idMatch = windowText.match(/\bid\s*:\s*(['"])((?:\\.|(?!\1)[^\\])*?)\1/)
         if (idMatch) {
            try {
               var decoded = JSON.parse('"' + idMatch[2].replace(/"/g, '\\"') + '"')
               ids.push(decoded)
            } catch (error) {
               ids.push(idMatch[2])
            }
         }
      }
      return uniqueStrings(ids)
   }

   /**
    * Validate source without calling it.  The local-file trust flow remains
    * the only path that executes generated JavaScript.  Syntax is compiled
    * with Function (never invoked), then registration calls are inspected
    * lexically for useful hints and an early missing-registration error.
    */
   function validateSource(source, fileName) {
      source = String(source == null ? '' : source).replace(/^\uFEFF/, '')
      var name = String(fileName || 'ai-generated.js').replace(/[\r\n\u2028\u2029]/g, '')
      if (!source.trim()) {
         return { valid: false, code: 'EMPTY_SOURCE', error: 'Generated source is empty.', fileName: name }
      }
      if (source.length > MAX_OUTPUT_LENGTH) {
         return { valid: false, code: 'SOURCE_TOO_LARGE', error: 'Generated source is too large.', fileName: name }
      }

      try {
         // Compiling checks syntax only.  Do not invoke the resulting function.
         Function(source)
      } catch (error) {
         return {
            valid: false,
            code: 'SYNTAX_ERROR',
            error: errorMessage(error),
            fileName: name,
         }
      }

      var masked = maskComments(source)
      var mainPattern = /(?:\bregister\s*\.\s*(?:push|registerNotation|register_notation)|\bregister_notation)\s*\(/g
      var analysisPattern = /\banalysis_register\s*\.\s*(?:push|registerNotation|register_notation)\s*\(/g
      var generatorPattern = /(?:\bregister\s*\.\s*(?:registerCategory|register_category|registerGenerator|register_generator)|\bregister_category)\s*\(/g
      var mainIds = staticIds(masked, mainPattern.source)
      var analysisIds = staticIds(masked, analysisPattern.source)
      var generatorIds = staticIds(masked, generatorPattern.source)
      var mainCount = (masked.match(mainPattern) || []).length
      var analysisCount = (masked.match(analysisPattern) || []).length
      var generatorCount = (masked.match(generatorPattern) || []).length
      if (!mainCount && !analysisCount) {
         return {
            valid: false,
            code: 'NO_REGISTRATION',
            error: 'Source does not contain a main or analysis notation registration.',
            fileName: name,
            mainIds: mainIds,
            analysisIds: analysisIds,
            generatorIds: generatorIds,
            registrationCounts: { main: mainCount, analysis: analysisCount, generators: generatorCount },
         }
      }
      var warnings = []
      if (!mainIds.length && mainCount) warnings.push('Main registration IDs are dynamic; verify them in the editor.')
      if (!analysisIds.length && analysisCount) warnings.push('Analysis registration IDs are dynamic; verify them in the editor.')
      if (generatorCount && !generatorIds.length) warnings.push('Generator IDs are dynamic; verify them in the editor.')
      return {
         valid: true,
         syntaxValid: true,
         fileName: name,
         mainIds: mainIds,
         analysisIds: analysisIds,
         generatorIds: generatorIds,
         registrationCounts: { main: mainCount, analysis: analysisCount, generators: generatorCount },
         warnings: warnings,
      }
   }

   function runTool(name, args) {
      args = args || {}
      if (name === 'list_notations') {
         var all = root && root.register ? Array.prototype.map.call(root.register, notationSummary) : []
         var analysis = root && root.analysis_register ? Array.prototype.map.call(root.analysis_register, notationSummary) : []
         return { main: all, analysis: analysis }
      }

      if (name === 'inspect_notation') {
         var inspected = notationById(args.notation_id)
         if (!inspected) throw new Error('Notation not found: ' + args.notation_id)
         return notationSummary(inspected)
      }

      if (name === 'expand') {
         var notation = notationById(args.notation_id)
         if (!notation || typeof notation.FS !== 'function') throw new Error('Notation or FS not found: ' + args.notation_id)
         var expression = parseExpression(notation, args.expression)
         var indexes = Array.isArray(args.indexes) ? args.indexes.slice(0, 12) : []
         if (indexes.some(function (index) {
            return !Number.isSafeInteger(Number(index)) || Number(index) < 0
         })) {
            throw new Error('Expansion indexes must be non-negative safe integers.')
         }
         indexes = indexes.map(function (index) { return Number(index) })
         var display = notationDisplay(notation)
         var treeOutput = ''
         var mountedApp = root && root.notationExplorerApp
         if (mountedApp && typeof mountedApp.directExpansionOutput === 'function' && indexes.length) {
            var firstIndex = Number(indexes[0])
            var contiguous = indexes.every(function (index, offset) {
               return Number(index) === firstIndex + offset
            })
            if (Number.isSafeInteger(firstIndex) && firstIndex >= 0 && contiguous) {
               try {
                  var displayInput = String(expression) === 'Infinity'
                     ? 'Limit'
                     : typeof args.expression === 'string' ? args.expression : JSON.stringify(expression)
                  treeOutput = mountedApp.directExpansionOutput({
                     notationId: notation.id,
                     expression: displayInput,
                     startN: firstIndex,
                     count: indexes.length,
                  })
               } catch (error) {
                  treeOutput = ''
               }
            }
         }
         return {
            notation_id: notation.id,
            expression: expression,
            display: display(expression),
            output: treeOutput || undefined,
            terms: indexes.map(function (index) {
               var term = notation.FS(expression, index)
               return { index: index, expression: term, display: display(term) }
            }),
         }
      }

      if (name === 'detect_inf_chain') {
         var target = notationById(args.notation_id)
         if (!target) throw new Error('Notation not found: ' + args.notation_id)
         var detector = root && root.debugTools && root.debugTools.detectInfChain
         if (typeof detector !== 'function') throw new Error('The infinite-chain detector is unavailable.')
         return detector(target, {
            limitTerm: args.limitTerm,
            maxSteps: args.maxSteps,
            maxN: args.maxN,
            preview: args.preview,
            maxVisited: args.maxVisited,
         })
      }

      if (name === 'validate_source') {
         return validateSource(args.source, args.file_name)
      }

      throw new Error('Unknown tool: ' + name)
   }

   function toolCallParts(message) {
      if (!message) return []
      if (Array.isArray(message.tool_calls)) return message.tool_calls.map(function (call) {
         var fn = call && call.function || {}
         return { id: call.id || 'call-' + Math.random().toString(36).slice(2), name: fn.name, arguments: fn.arguments }
      }).filter(function (call) { return call.name })
      if (message.function_call && message.function_call.name) {
         return [{ id: 'legacy-' + Math.random().toString(36).slice(2), name: message.function_call.name, arguments: message.function_call.arguments }]
      }
      return []
   }

   async function responseJson(response) {
      var body
      if (response && typeof response.text === 'function') body = await response.text()
      else if (response && typeof response.json === 'function') body = JSON.stringify(await response.json())
      else body = ''
      var parsed = safeJson(body)
      if (response && (response.ok === false || Number(response.status) >= 400)) {
         var detail = parsed && parsed.error && (parsed.error.message || parsed.error.code)
         var failure = new Error('AI API HTTP ' + response.status + (detail ? ': ' + detail : ''))
         failure.status = response.status
         failure.apiError = parsed && parsed.error
         throw failure
      }
      if (!parsed) throw new Error('AI API returned invalid JSON.')
      return parsed
   }

   function toolsUnsupported(error) {
      if (!error) return false
      var status = Number(error.status)
      if (status === 404 || status === 422) return true
      if (status !== 400) return false
      var message = errorMessage(error).toLowerCase()
      return /tool|function.?call|unsupported|unknown field|unrecognized/.test(message)
   }

   async function fetchContext() {
      if (contextCache) return contextCache
      // The authoring material is bundled into the application. Do not fetch
      // the guide at generation time: Pages/offline use should make only the
      // configured model request, and the assistant must not depend on a
      // Codex skill or a second documentation origin.
      var builtIn = root && root.AINotationContext
      if (builtIn && typeof builtIn.text === 'string' && builtIn.text.trim()) {
         contextCache = builtIn.text
         return contextCache
      }
      if (BUILTIN_CONTEXT && BUILTIN_CONTEXT.trim()) {
         contextCache = BUILTIN_CONTEXT
         return contextCache
      }
      var template = root && root.PrSSTemplate && root.PrSSTemplate.DEFAULT_SOURCE || ''
      contextCache = [
         '## Built-in notation authoring guide',
         FALLBACK_CONTEXT,
         '## Built-in PrSS template',
         template || '(PrSS template unavailable)',
         '## Non-negotiable runtime constraints',
         FALLBACK_CONTEXT,
      ].join('\n\n')
      return contextCache
   }

   function buildSystemPrompt(context, toolsEnabled) {
      return [
         'You are an expert assistant for the Notation Explorer local notation editor.',
         'Produce one complete JavaScript local notation file, not a patch or explanation.',
         'Use the supplied context and inspect/expand existing notations before inventing conventions.',
         'When tools are available, validate the source before finalizing. Never claim that generated code was executed.',
         'Return source in a single ```js fenced block. The editor will not trust or execute it automatically.',
         toolsEnabled ? 'You may use the provided tools to inspect the current runtime.' : 'Tool calling is unavailable; reason from the supplied context only.',
         '\n' + context,
      ].join('\n\n')
   }

   async function request(endpoint, body, headers) {
      if (!root || typeof root.fetch !== 'function') throw new Error('Fetch is unavailable.')
      return responseJson(await root.fetch(endpoint, {
         method: 'POST',
         headers: headers,
         body: JSON.stringify(body),
      }))
   }

   async function generate(options) {
      options = options || {}
      var apiKey = String(options.apiKey || '').trim()
      var model = String(options.model || '').trim() || DEFAULT_MODEL
      var prompt = String(options.prompt || '').trim()
      if (!apiKey) throw new Error('An API key is required.')
      if (!prompt) throw new Error('A notation request is required.')

      writeSessionSettings({ baseUrl: options.baseUrl, apiKey: apiKey, model: model })
      var context = options.context || await fetchContext()
      var endpoint = normalizeEndpoint(options.baseUrl)
      var headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }
      var messages = [
         { role: 'system', content: buildSystemPrompt(context, true) },
         { role: 'user', content: prompt },
      ]
      var tools = toolDefinitions()
      var usedTools = false
      var rounds = 0
      var response
      var pendingToolCalls = false

      try {
         while (rounds++ < MAX_TOOL_ROUNDS) {
            response = await request(endpoint, {
               model: model,
               messages: messages,
               temperature: options.temperature === undefined ? 0.2 : options.temperature,
               tools: tools,
               tool_choice: 'auto',
            }, headers)
            var choice = response.choices && response.choices[0]
            var message = choice && choice.message
            var calls = toolCallParts(message)
            if (!calls.length) {
               pendingToolCalls = false
               break
            }
            pendingToolCalls = true
            usedTools = true
            messages.push(message)
            for (var index = 0; index < calls.length; index++) {
               var call = calls[index]
               var args = typeof call.arguments === 'string' ? safeJson(call.arguments) : call.arguments
               if (!args || typeof args !== 'object') args = {}
               var result
               try {
                  result = { ok: true, result: runTool(call.name, args) }
               } catch (error) {
                  result = { ok: false, error: errorMessage(error) }
               }
               messages.push({
                  role: 'tool',
                  tool_call_id: call.id,
                  name: call.name,
                  content: stringify(result, 30000),
               })
            }
         }
         if (pendingToolCalls) throw new Error('The AI tool loop exceeded its safety limit.')
      } catch (error) {
         if (!tools.length || usedTools || !toolsUnsupported(error)) throw error
         // Some compatible endpoints reject the tools field. Retry once in
         // ordinary chat mode while preserving the same user request/context.
         response = await request(endpoint, {
            model: model,
            messages: [
               { role: 'system', content: buildSystemPrompt(context, false) },
               { role: 'user', content: prompt },
            ],
            temperature: options.temperature === undefined ? 0.2 : options.temperature,
         }, headers)
         usedTools = false
      }

      var text = extractText(response)
      if (!text) throw new Error('AI API returned no assistant content.')
      var source = extractSource(text)
      if (source.length > MAX_OUTPUT_LENGTH) throw new Error('Generated source is too large.')

      var validation = runTool('validate_source', {
         source: source,
         file_name: options.fileName || 'ai-generated.js',
      })
      return {
         source: source,
         raw: text,
         model: model,
         endpoint: endpoint,
         usedTools: usedTools,
         validation: validation,
      }
   }

   function clearSessionApiKey() {
      var store = storage('sessionStorage')
      try {
         if (store && typeof store.removeItem === 'function') store.removeItem(SESSION_KEYS.apiKey)
      } catch (error) {
         // Best effort; the key is also cleared from the UI's in-memory state.
      }
   }

   return Object.freeze({
      DEFAULT_MODEL: DEFAULT_MODEL,
      DEFAULT_BASE_URL: DEFAULT_BASE_URL,
      SESSION_KEYS: SESSION_KEYS,
      toolDefinitions: toolDefinitions,
      normalizeEndpoint: normalizeEndpoint,
      readSessionSettings: readSessionSettings,
      writeSessionSettings: writeSessionSettings,
      clearSessionApiKey: clearSessionApiKey,
      fetchContext: fetchContext,
      runTool: runTool,
      validateSource: validateSource,
      extractSource: extractSource,
      generate: generate,
   })
})
