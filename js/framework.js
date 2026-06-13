;

const node_map = new Map()

const init_dataset = (notation) => {
   let root_item = {
      is_root: true, mark: 0, path: undefined
   }
   root_item.subitems = notation.init().map(
      (item, index) => {
         return {
            expr: item.expr,
            bound: item.low[0],
            subitems: [],
            node: undefined,
            mark: null,
            index,
            path: "" + index,
            analysis: undefined,
            parent: root_item,
         }
      }
   );
   return root_item
}

const app = Vue.createApp({
   data: () => ({
      current_tab: 0,
      current_analysis_index: -1,
      FS_shown: 3,
      tier: 0,
      length_limit: 20,
      datasets: register.map(init_dataset),
      pCanvas: { x: 0, y: 0, w: 0, h: 0, s: 1 },
      pCanvasModifier: { x: 0, y: 0, hide: false },
      showCanvas: false,
      diagram_follow: false,
      diagram_scale: 0,
      use_alternative: true,
      show_fs_dialog: false,
      analysis_fs_target: undefined,
      showSummary: false,
      noteSheets: [{ name: 'Sheet2', text: '' }],
      currentSheet: 0,
      editingTitle: false,
      summaryX: undefined,
      summaryY: undefined,
      summaryW: 440,
      summaryH: 400,
      lang: 'en',
      auto_scroll: true,
      export_hide: true,
      page: 'explore',
      darkMode: false,
      nParamVal: 2,
      nParamInput: 2,
      debugNotation: 0,
      debugOpts: { limitTerm: 6, maxSteps: 50, maxN: 1, preview: 8, maxVisited: 2000 },
      debugDiffA: 0,
      debugDiffB: 1,
      debugDiffOpts: { limitTerm: 6, maxSteps: 10, maxN: 3, maxVisited: 200 },
      debugOutput: '',
      debugExpandNotation: 0,
      debugExpandExpr: '',
      debugExpandN: 0,
      debugExpandCount: 1,
   }),
   computed: {
      current_notation_name() { return register[this.current_tab].id },
      current_analysis_notation() { return analysis_register[this.current_analysis_index] || {} },
      showNParam() { return register[this.current_tab] && register[this.current_tab].nParam },
      nHelp() { return register[this.current_tab] && register[this.current_tab].nHelp ? register[this.current_tab].nHelp : '' },
      L() {
         const t = {
            en: {
               show_hotkeys: 'Show hotkeys',
               reset: 'Reset the list',
               export: 'Export analysis',
               import: 'Import analysis',
               diagram_follow: 'Diagram follows',
               diagram_size: 'Diagram size',
               use_alternative: 'Use alternative (short) fundamental sequence',
               auto_scroll: 'Auto scroll / center on focus',
               navigate: 'Navigate to notation',
               find: 'Find',
               expansion_tier: 'Expansion tier',
               auto_fs_limit: 'Auto expansion FS terms limit',
               tooltip_fs: 'FS terms shown in tooltip',
               analysis_notation: 'Analysis notation',
               export_hide: 'Export hide state',
               explore: 'Analysis',
               settings: 'Settings',
               reset_settings: 'Reset to defaults',
               note: 'Note',
               note_placeholder: 'Enter notes here...',
               settings_title: 'Settings',
               dark_mode: 'Dark Mode',
               debug: 'Debug',
               debug_title: 'Debug Tools',
               debug_notation_select: 'Notation',
               debug_limit: 'Limit',
               debug_steps: 'Max steps',
               debug_maxn: 'Max n',
               debug_preview: 'Preview',
               debug_inf_chain: 'Inf Chain Detection',
               debug_run: 'Run',
               debug_run_all: 'Run All',
               debug_maxvisited: 'Max visited',
               debug_bfs_diff: 'DFS Diff',
               debug_notation_a: 'Notation A',
               debug_notation_b: 'Notation B',
               debug_diff_limit: 'DFS limit',
               debug_diff_maxpos: 'Max FS pos',
               debug_diff_run: 'Diff',
               debug_placeholder: 'Click \"Run\" to detect infinite descending chains',
               debug_direct_expand: 'Direct Expansion',
               debug_expand_expr: 'Expression',
               debug_expand_n: 'Start n',
               debug_expand_count: 'Count',
               debug_expand_run: 'Expand',
               n_param_label: 'n =',
               n_param_confirm: 'Apply',
            },
            zh: {
               show_hotkeys: '快捷键',
               reset: '重置分析',
               export: '导出分析',
               import: '导入分析',
               diagram_follow: '图表跟随',
               diagram_size: '图表大小',
               use_alternative: '使用短基本列（备用）',
               auto_scroll: '焦点自动滚动/居中',
               navigate: '跳转到',
               find: '查找',
               expansion_tier: '展开层级',
               auto_fs_limit: '自动展开基本列项数限制',
               tooltip_fs: '提示框显示基本列项数',
               analysis_notation: '分析记号',
               export_hide: '导出隐藏状态',
               explore: '分析',
               settings: '设置',
               reset_settings: '重置到默认',
               note: '笔记',
               note_placeholder: '在此输入笔记...',
               settings_title: '设置',
               dark_mode: '黑夜模式',
               debug: '调试',
               debug_title: '调试工具',
               debug_notation_select: '记号',
               debug_limit: '基本列数',
               debug_steps: '最大步数',
               debug_maxn: '最大 n',
               debug_preview: '预览项数',
               debug_inf_chain: '无穷降链检测',
               debug_run: '运行',
               debug_run_all: '全部运行',
               debug_maxvisited: '最大访问数',
               debug_bfs_diff: 'DFS 差异对比',
               debug_notation_a: '记号 A',
               debug_notation_b: '记号 B',
               debug_diff_limit: 'DFS 上限',
               debug_diff_maxpos: '最大 FS 位置',
               debug_diff_run: '对比',
               debug_placeholder: '点击「运行」检测无穷降链',
               debug_direct_expand: '直接展开',
               debug_expand_expr: '表达式',
               debug_expand_n: '起始 n',
               debug_expand_count: '项数',
               debug_expand_run: '展开',
               n_param_label: 'n =',
               n_param_confirm: '确定',
            },
         };
         return t[this.lang] || t.en;
      },
      tab_names: () => register.map(notation => notation.name),
      analysis_names: () => analysis_register.map(notation => notation.name),
      debugNotations() { return register; },
      tiername() {
         var n = this.tier
         var tierEn = ['small', 'single', 'double', 'triple', 'quadruple', 'quintuple', 'sextuple', 'septuple', 'octuple'];
         var tierZh = ['零次', '一次', '二次', '三次', '四次', '五次', '六次', '七次', '八次'];
         if (0 <= n && n <= 8) {
            return this.lang === 'zh' ? tierZh[n] + '展开' : tierEn[n] + ' expansion';
         }
         return this.lang === 'zh' ? n + '重展开' : n + '-fold expansion';
      },
      pCanvasScaled() {
         let scale = 0.1 / this.pCanvas.s * Math.pow(1.25, this.diagram_scale)
         return { w: this.pCanvas.w * scale, h: this.pCanvas.h * scale }
      }
   },
   watch: {
      darkMode(val) { document.documentElement.classList.toggle('dark', val); this.saveSettings() },
      lang() { this.saveSettings() },
      diagram_follow() { this.saveSettings() },
      auto_scroll() { this.saveSettings() },
      export_hide() { this.saveSettings() },
      use_alternative() { this.saveSettings() },
      diagram_scale() { this.saveSettings() },
      tier() { this.saveSettings() },
      length_limit() { this.saveSettings() },
      FS_shown() { this.saveSettings() },
      current_analysis_index() { this.saveSettings() },
      current_tab() { this.initSheets(); },
      nParamVal(val) {
         window.nCpSN = val;
         this.saveSettings();
      },
   },
   methods: {
      show_hotkeys() {
         var msg = this.lang === 'zh' ? `
当焦点在输入框时：
↑/↓：向上/下移动
Ctrl + ←/→：光标跳到最左/最右
Shift + ↑/↓, Ctrl + ↑/↓：快速移动（跳过子项/兄弟项）
Alt + ↑/↓：移动到有分析内容的项
Enter：执行展开
Ctrl + H：隐藏/显示当前节点的子树
Ctrl + Backspace：删除当前节点
Ctrl + S：导出分析
Ctrl + E：展开分析的基本列
         ` : `
When focused on an input box:
↑/↓: move up or down
Ctrl + ←/→: move cursor to leftmost/rightmost
Shift + ↑/↓, Ctrl + ↑/↓: move up or down faster
ignoring subitems (resp. sibling items)
Alt + ↑/↓: move up or down to an item that has an analysis
Enter: perform an expansion
Ctrl + H: hide/unhide subtree of current node
Ctrl + Backspace: delete focused node
Ctrl + S: export analysis
Ctrl + E: expand analysis fundamental sequence
         `;
         alert(msg)
      },
      confirmNParam() {
         this.nParamVal = this.nParamInput;
         window.nCpSN = this.nParamVal;
         this.datasets.splice(this.current_tab, 1, init_dataset(register[this.current_tab]));
      },
      alert(msg) {
         window.alert(msg);
      },
      reset_list() {
         this.datasets.splice(this.current_tab, 1, init_dataset(register[this.current_tab]))
      },
      export_xlsx() {
         let result = [];

         let find_result = (node) => {
            for (let i = node.subitems.length - 1; i >= 0; i--) {
               let child = node.subitems[i];
               find_result(child)
            }

            let text = node.analysis
            if (text !== undefined) {
               if (root.export_hide && node.hide_child) {
                  result.push([register[root.current_tab].display(node.expr), text, 'true'])
               } else {
                  result.push([register[root.current_tab].display(node.expr), text])
               }
            }
         }

         find_result(root.datasets[root.current_tab])

         // Sheet1: 分析树
         const ws1 = XLSX.utils.aoa_to_sheet(result);
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, ws1, "sheet1");
         // Sheet2+: 便利贴的每个 Sheet（每行作为 CSV 解析）
         for (var si = 0; si < this.noteSheets.length; si++) {
            var ns = this.noteSheets[si];
            var lines = (ns.text || '').split('\n');
            var rows = [];
            for (var li = 0; li < lines.length; li++) {
               var line = lines[li].trim();
               if (!line) continue;
               // 简易 CSV 解析：支持双引号包裹的字段（含逗号）
               var fields = [];
               var cur = '';
               var inQ = false;
               for (var ci = 0; ci < line.length; ci++) {
                  var ch = line[ci];
                  if (inQ) {
                     if (ch === '"') {
                        if (ci + 1 < line.length && line[ci + 1] === '"') {
                           cur += '"';
                           ci++;
                        } else {
                           inQ = false;
                        }
                     } else {
                        cur += ch;
                     }
                  } else {
                     if (ch === '"') {
                        inQ = true;
                     } else if (ch === ',') {
                        fields.push(cur);
                        cur = '';
                     } else {
                        cur += ch;
                     }
                  }
               }
               fields.push(cur);
               rows.push(fields);
            }
            if (rows.length) {
               XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), ns.name);
            }
         }

         XLSX.writeFile(workbook, "output.xlsx");
      },
      import_xlsx() {
         let file_input = this.$refs.file_input;
         file_input.click()
      },
      handle_import_file(event) {
         const notation = register[this.current_tab]

         let file = event.target.files[0];
         if (!file) return;

         const reader = new FileReader();

         reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (!rows) {
               return;
            }

            const objects = [];
            for (let i = 0; i < rows.length; i++) {
               const row = rows[i];
               if (row && row.length >= 2) {
                  let expr_str = row[0] || '';
                  let analysis = row[1] || '';
                  if (!analysis.length) continue
                  let expr = safeFromDisplay(notation, expr_str)
                  if (expr === undefined) continue
                  let hidden = (row[2] || '').trim() === 'true'
                  objects.push([expr, analysis, hidden]);
               }
            }

            import_analysis(root.datasets[root.current_tab], objects, notation, root.use_alternative)

            // 导入便利贴 Sheet（从 Sheet2 开始，跳过 sheet1）
            var names = workbook.SheetNames;
            var sheets = [];
            for (var si = 1; si < names.length; si++) {
               var sRows = XLSX.utils.sheet_to_json(workbook.Sheets[names[si]], { header: 1 });
               var text = '';
               if (sRows && sRows.length > 0) {
                  var lines = [];
                  for (var ri = 0; ri < sRows.length; ri++) {
                     var r = sRows[ri];
                     if (!r || !r.length) continue;
                     // 将 XLSX 行转为 CSV 一行：字段含逗号或引号时加双引号包裹
                     var csvFields = [];
                     for (var fi = 0; fi < r.length; fi++) {
                        var fv = r[fi];
                        var s = (fv === null || fv === undefined) ? '' : '' + fv;
                        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
                           s = '"' + s.replace(/"/g, '""') + '"';
                        }
                        csvFields.push(s);
                     }
                     lines.push(csvFields.join(','));
                  }
                  text = lines.join('\n');
               }
               sheets.push({ name: names[si], text: text });
            }
            if (sheets.length > 0) {
               root.noteSheets = sheets;
               root.currentSheet = 0;
            }
         };

         reader.onerror = function () {
         };

         reader.readAsArrayBuffer(file);

         event.target.value = '';
      },
      find_notation() {
         let notation = register[this.current_tab]
         let displayed_expr = this.$refs.navigate_input.value
         let expr = safeFromDisplay(notation, displayed_expr)
         if (expr === undefined) return;
         import_analysis(this.datasets[this.current_tab], [[expr]], notation, this.use_alternative, true)
      },
      navigate_keydown(event) {
         if (event.key === 'Enter') {
            event.preventDefault();
            this.find_notation()
         }
      },
      calc_analysis_fs(fsIndex) {
         let node = node_map.get(this.analysis_fs_target);
         let target = node?.$refs?.input
         if (!target) return;
         let notation = analysis_register[this.current_analysis_index];
         if (!notation) return;
         let result = notation.display(notation.FS(notation.fromDisplay(target.value), fsIndex))
         node.item.analysis = target.value = result
         target.focus();
         target.setSelectionRange(result.length, result.length);
      },

      incr_tier() { this.tier++ },
      decr_tier() { this.tier = Math.max(this.tier - 1, 0) },
      incrFS() { this.FS_shown++ },
      decrFS() { this.FS_shown = Math.max(this.FS_shown - 1, 0) },

      saveSettings() {
         localStorage.setItem('ne-config', JSON.stringify({
            darkMode: this.darkMode,
            lang: this.lang,
            diagramFollow: this.diagram_follow,
            autoScroll: this.auto_scroll,
            exportHide: this.export_hide,
            useAlt: this.use_alternative,
            diagramScale: this.diagram_scale,
            tier: this.tier,
            lengthLimit: this.length_limit,
            fsShown: this.FS_shown,
            analysisIdx: this.current_analysis_index,
         }))
      },
      loadSettings() {
         try {
            var raw = localStorage.getItem('ne-config')
            if (raw) {
               var s = JSON.parse(raw)
               var self = this
               function getOr(k, fallback) {
                  var v = s[k]
                  return (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v)))
                     ? fallback : v
               }
               self.darkMode = getOr('darkMode', false)
               self.lang = getOr('lang', 'en')
               self.diagram_follow = getOr('diagramFollow', false)
               self.auto_scroll = getOr('autoScroll', true)
               self.export_hide = getOr('exportHide', true)
               self.use_alternative = getOr('useAlt', true)
               self.diagram_scale = getOr('diagramScale', 0)
               self.tier = getOr('tier', 0)
               self.length_limit = getOr('lengthLimit', 20)
               self.FS_shown = getOr('fsShown', 3)
               self.current_analysis_index = getOr('analysisIdx', -1)
            }
         } catch (e) { }
         this.loadPos()
         document.documentElement.classList.toggle('dark', this.darkMode)
      },
      resetSettings() {
         this.darkMode = false
         this.lang = 'en'
         this.diagram_follow = false
         this.auto_scroll = true
         this.export_hide = true
         this.use_alternative = true
         this.diagram_scale = 0
         this.tier = 0
         this.length_limit = 20
         this.FS_shown = 3
         this.current_analysis_index = -1
         this.saveSettings()
      },

      // ===== 规律总结便利贴（多 Sheet，不持久化） =====
      initSheets() {
         this.noteSheets = [{ name: 'Sheet2', text: '' }];
         this.currentSheet = 0;
      },
      toggleSummary() {
         if (this.showSummary) {
            this.savePos();
         }
         if (!this.noteSheets.length) this.initSheets();
         this.showSummary = !this.showSummary;
      },
      prevSheet() {
         if (this.currentSheet > 0) this.currentSheet--;
      },
      nextSheet() {
         if (this.currentSheet < this.noteSheets.length - 1) this.currentSheet++;
      },
      addSheet() {
         var n = this.noteSheets.length + 2;
         this.noteSheets.push({ name: 'Sheet' + n, text: '' });
         this.currentSheet = this.noteSheets.length - 1;
      },
      savePos() {
         localStorage.setItem('ne-summary-pos', JSON.stringify({
            x: this.summaryX, y: this.summaryY,
            w: this.summaryW, h: this.summaryH
         }));
      },
      loadPos() {
         try {
            var p = JSON.parse(localStorage.getItem('ne-summary-pos') || '{}');
            if (p.x !== undefined) this.summaryX = p.x;
            if (p.y !== undefined) this.summaryY = p.y;
            if (p.w) this.summaryW = p.w;
            if (p.h) this.summaryH = p.h;
         } catch (e) { }
      },
      // 拖拽
      startDragSummary(event) {
         event.preventDefault();
         this.dragOffX = event.clientX - (this.summaryX !== undefined ? this.summaryX : window.innerWidth - 480);
         this.dragOffY = event.clientY - (this.summaryY !== undefined ? this.summaryY : 60);
         this.draggingSummary = true;
         var self = this;
         document.addEventListener('mousemove', function (e) { self.onDragSummary(e); });
         document.addEventListener('mouseup', function () { self.endDragSummary(); });
      },
      onDragSummary(event) {
         if (!this.draggingSummary) return;
         this.summaryX = event.clientX - this.dragOffX;
         this.summaryY = event.clientY - this.dragOffY;
      },
      endDragSummary() {
         this.draggingSummary = false;
         document.removeEventListener('mousemove', this.onDragSummary);
         document.removeEventListener('mouseup', this.endDragSummary);
      },
      // 缩放
      startResizeSummary(event) {
         event.preventDefault();
         this.resizeStartX = event.clientX;
         this.resizeStartY = event.clientY;
         this.resizeStartW = this.summaryW;
         this.resizeStartH = this.summaryH;
         this.resizingSummary = true;
         var self = this;
         document.addEventListener('mousemove', function (e) { self.onResizeSummary(e); });
         document.addEventListener('mouseup', function () { self.endResizeSummary(); });
      },
      onResizeSummary(event) {
         if (!this.resizingSummary) return;
         this.summaryW = Math.max(260, this.resizeStartW + event.clientX - this.resizeStartX);
         this.summaryH = Math.max(200, this.resizeStartH + event.clientY - this.resizeStartY);
      },
      endResizeSummary() {
         this.resizingSummary = false;
         document.removeEventListener('mousemove', this.onResizeSummary);
         document.removeEventListener('mouseup', this.endResizeSummary);
      },

      // ===== Debug Tools =====
      runDebug() {
         var self = this;
         var id = self.debugNotation;
         var notation = register[id];
         if (!notation) { self.debugOutput = 'Notation not found'; return; }
         var display = notation.display || function (x) { return JSON.stringify(x); };
         var results = window.debugTools.detectInfChain(notation, self.debugOpts);
         var lines = [];
         lines.push('=== ' + notation.name + ' (' + notation.id + ') ===');
         var anyFound = false;
         results.forEach(function (r, idx) {
            var statusLabel = r.reason === 'INF' ? '>>> INF' : (r.reason === 'LIMIT' ? '! limit' : 'ok');
            lines.push('Limit FS(' + idx + ') = ' + display(r.start) + '  (visited: ' + r.visited + ') [' + statusLabel + ']');
            if (r.found) {
               anyFound = true;
               lines.push('  first ' + r.chain.length + ' entries:');
               r.chain.forEach(function (c, i) {
                  lines.push('    ' + i + ': ' + display(c) + '  (len=' + c.length + ')');
               });
            } else if (r.reason === 'LIMIT') {
               lines.push('  (visited limit reached, partial chain below)');
               r.chain.forEach(function (c, i) {
                  lines.push('    ' + i + ': ' + display(c) + '  (len=' + c.length + ')');
               });
            } else {
               lines.push('  (terminated)');
            }
            lines.push('');
         });
         if (!anyFound) lines.push('All branches terminated.');
         self.debugOutput = lines.join('\n');
         console.log('=== DFS Inf Chain Detection ===');
         console.log('Notation:', notation.name);
         console.log(lines.join('\n'));
      },
      runDebugAll() {
         var self = this;
         var lines = [];
         register.forEach(function (notation) {
            lines.push('--- ' + notation.name + ' ---');
            var results = window.debugTools.detectInfChain(notation, { limitTerm: 2, maxSteps: 30, maxN: 2, preview: 5 });
            var any = false;
            results.forEach(function (r) {
               if (r.found) { any = true; }
            });
            if (any) {
               lines.push('  Found inf chains!');
               results.forEach(function (r, idx) {
                  if (r.found) {
                     lines.push('  FS(' + idx + '): ' + r.start + ' -> INF');
                  }
               });
            } else {
               lines.push('  All terminated');
            }
            lines.push('');
         });
         self.debugOutput = lines.join('\n');
         console.log('=== DFS Inf Chain Detection (All) ===');
         console.log(lines.join('\n'));
      },
      // ---- 直接展开 ----
      runExpand() {
         var self = this;
         var notation = register[self.debugExpandNotation];
         if (!notation) { self.debugOutput = 'Notation not found'; return; }
         var exprStr = self.debugExpandExpr.trim();
         if (!exprStr) { self.debugOutput = 'Please enter an expression'; return; }

         // 解析表达式
         var expr;
         if (exprStr === 'Limit' || exprStr === 'Infinity' || exprStr === '\u221e') {
            expr = Infinity;
         } else {
            try {
               if (typeof notation.fromDisplay === 'function') {
                  expr = notation.fromDisplay(exprStr);
               } else {
                  expr = JSON.parse(exprStr);
               }
            } catch (e) {
               self.debugOutput = 'Parse error: ' + e.message;
               return;
            }
         }

         var display = notation.display || function (x) { return JSON.stringify(x); };
         var lines = [];
         lines.push('Notation: ' + notation.name + ' (' + notation.id + ')');
          lines.push('Expression: ' + exprStr);
         lines.push('');

         var nStart = self.debugExpandN;
         var count = self.debugExpandCount;

         for (var i = nStart; i < nStart + count; i++) {
            try {
               var result = notation.FS(expr, i);
               var displayResult = ('' + result === 'Infinity') ? 'Limit' : display(result);
               lines.push('FS(' + i + ') = ' + displayResult);
            } catch (e) {
               lines.push('FS(' + i + ') = Error: ' + e.message);
            }
         }

         self.debugOutput = lines.join('\n');
         console.log('=== Direct Expansion ===');
         console.log(lines.join('\n'));
      },

      runDiff() {
         var self = this;
         var nA = register[self.debugDiffA];
         var nB = register[self.debugDiffB];
         if (!nA || !nB) { self.debugOutput = 'Notation not found'; return; }
         function safeDisplay(fn, x) {
            if (x === null || x === undefined) return 'null';
            if (Array.isArray(x) && x.length === 0) return '[]';
            var s;
            try { s = fn(x); } catch (e) { s = JSON.stringify(x); }
            return s || JSON.stringify(x);
         }
         var displayA = function (x) { return safeDisplay(nA.display || JSON.stringify, x); };
         var displayB = function (x) { return safeDisplay(nB.display || JSON.stringify, x); };
         var result = window.debugTools.dfsDiff(nA, nB, self.debugDiffOpts);
         var lines = [];
         lines.push('DFS Diff: ' + nA.name + ' vs ' + nB.name);
         lines.push('Visited: ' + result.totalVisited + ', Mismatches: ' + result.mismatches.length + (result.timedOut ? ' (TIMEOUT)' : ''));
         lines.push('');
         if (result.mismatches.length === 0) {
            lines.push('All expressions match!');
         } else {
            result.mismatches.slice(0, 20).forEach(function (m, i) {
               lines.push('[' + i + '] expr: ' + m.exprJSON + '  (fs=' + m.fsPos + ')');
               lines.push('  A: ' + (m.aResult === null ? 'null' : JSON.stringify(m.aResult)));
               lines.push('  B: ' + (m.bResult === null ? 'null' : JSON.stringify(m.bResult)));
               lines.push('');
            });
            if (result.mismatches.length > 20) {
               lines.push('... and ' + (result.mismatches.length - 20) + ' more mismatches');
            }
         }
         self.debugOutput = lines.join('\n');
         console.log('=== DFS Diff ===');
         console.log(lines.join('\n'));
      },
   },
   mounted() {
      var canvasEl = document.getElementById('hoverCanvas');
      if (canvasEl) {
         try {
            const offscreen = canvasEl.transferControlToOffscreen();
            worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);
         } catch (e) { }
      }

      this.loadSettings()
      window.nCpSN = this.nParamVal;
   }
})

function safeFromDisplay(notation, str) {
   if (notation.fromDisplay) try {
      return notation.fromDisplay(str);
   } catch (e) {
      // fall through
   }
   if (notation.fromDisplay_alter) try {
      return notation.fromDisplay_alter(str);
   } catch (e) {
      // fall through
   }
   return undefined;
}

const worker = new Worker("js/notations/Diagram.js")

worker.onmessage = (e) => {
   let data = e.data
   if (data.type === 'alert') {
      console.log(data.value)
   }
   if (data.type === 'resize') {
      root.pCanvas.w = data.width
      root.pCanvas.h = data.height
      root.pCanvas.s = data.scale
   }
}

function import_analysis(root_item, analysis_list, notation, use_short, auto_focus = false) {
   let item = last_child(root_item)
   let index = 0
   let cmp

   while (index < analysis_list.length) {
      let flag = false
      while ((cmp = notation.compare(item.expr, analysis_list[index][0])) !== 0) {
         if (cmp > 0) {
            if (item.mark > root.length_limit) return
            expand_item(item, notation, use_short, 0)
            item = find_next(item)
         } else {
            item = find_prev(item)
         }
      }

      if (analysis_list[index][1] !== undefined) item.analysis = analysis_list[index][1]
      if (analysis_list[index][2] !== undefined) item.hide_child = !!analysis_list[index][2]

      if (index === 0 && auto_focus) {
         let node = node_map.get(item.path)
         if (node) node.$refs.input.focus({ preventScroll: true }); else item.auto_focus = true;
      }

      ++index
   }
}

function expand_item(item, notation, use_short, max_tier, auto_focus) {
   const FS = get_FS(notation, use_short)

   const generateFS = (item) => {
      if (item.fs_index !== undefined) {
         item.fs_index++
         return FS(item.expr, item.fs_index)
      }
      let fs_index = 0, res
      while (true) {
         res = FS(item.expr, fs_index)
         if (notation.compare(res, item.bound) > 0) {
            item.fs_index = fs_index
            return res
         }
         fs_index++
      }
   }

   const expand_tier = (tier, item, to_parent, af = false) => {
      let result_expr
      if (notation.able(item.expr)) {
         result_expr = generateFS(item)
      } else {
         result_expr = FS(item.expr, 0)
         if (notation.compare(result_expr, item.bound) <= 0) return;
      }

      let new_bound
      if (item.subitems.length > 0) {
         new_bound = item.subitems[0].expr
      } else if (to_parent) {
         new_bound = item.bound
      } else {
         if (item.parent) {
            new_bound = item.parent.subitems[item.parent.mark + item.index + 1].expr
         } else {
            new_bound = root.datasets[root.current_tab][item.index + 1].expr
         }
      }

      let new_index
      if (to_parent) {
         new_index = item.index + 1
      } else {
         if (item.subitems.length > 0) {
            new_index = item.subitems[0].index - 1
         } else {
            new_index = 0
         }
      }

      const new_item = {
         expr: result_expr,
         bound: new_bound,
         subitems: [],
         mark: null,
         index: new_index,
         auto_focus: af,
         parent: to_parent ? item.parent : item,
      }
      new_item.path = new_item.parent.path + "," + new_index
      if (to_parent)
         item.parent.subitems.splice(item.parent.subitems.length, 0, new_item)
      else {
         item.subitems.splice(0, 0, new_item)
         item.mark = item.mark != null ? item.mark + 1 : 0
      }
      if (tier > 0) {
         let new_to_parent = to_parent || item.subitems.length === 1
         expand_tier(tier, new_item, new_to_parent)
         if (tier > 1) {
            if (new_item.subitems.length > 0) {
               expand_tier(tier - 1, new_item.subitems[new_item.subitems.length - 1], true)
            } else {
               expand_tier(tier - 1, new_item, false)
            }
         }
      }
   }

   expand_tier(max_tier, item, !item.parent.is_root && item.index + item.parent.mark === item.parent.subitems.length - 1, auto_focus)
}

const get_FS = (notation, use_short) => {
   if (use_short) return notation.FSShort || notation.FS
   return notation.FS
}

let last_child = (node) => {
   if (node.hide_child || node.subitems.length === 0) return node
   let ref = node.subitems[node.subitems.length - 1];
   return last_child(ref)
}
let next_sibling = (node) => {
   if (node.is_root) return undefined
   let parent = node.parent
   if (node.index + node.parent.mark !== parent.subitems.length - 1) {
      return parent.subitems[node.index + node.parent.mark + 1]
   }
   return next_sibling(parent)
}
let find_next = (node, quick_level = 0) => {
   if (quick_level >= 4) {
      let next = find_next(node, quick_level - 4)
      while (next && next.analysis === undefined) next = find_next(next, quick_level - 4)
      return next
   }

   if (node.is_root) return last_child(node)
   if (quick_level >= 2) {
      let parent = node.parent
      if (!parent.is_root) {
         let uncle = next_sibling(parent)
         if (uncle) return uncle
      }
      return last_child(parent)
   }
   if (quick_level < 1 && node.subitems.length > 0 && !node.hide_child) {
      return node.subitems[0];
   }
   return next_sibling(node)
}
let find_prev = (node, quick_level = 0) => {
   if (quick_level >= 4) {
      let prev = find_prev(node, quick_level - 4)
      while (prev && prev.analysis === undefined) prev = find_prev(prev, quick_level - 4)
      return prev
   }
   let parent = node.parent;
   if (quick_level >= 2 && !parent.is_root) return parent;
   if (!parent.is_root && node.index + node.parent.mark === 0) return parent;
   if (parent.is_root && node.index === 0) return undefined;
   let prev = parent.subitems[node.index + node.parent.mark - 1]
   return quick_level >= 1 ? prev : last_child(prev)
}

function getCaretPixelPosition(input, pos) {
   const div = document.createElement('div');
   const style = getComputedStyle(input);

   // 复制关键样式
   [
      'font', 'padding', 'border', 'white-space',
      'letter-spacing'
   ].forEach(prop => {
      div.style[prop] = style[prop];
   });

   div.style.position = 'absolute';
   div.style.visibility = 'hidden';
   div.style.whiteSpace = 'pre';

   const text = input.value.slice(0, pos);
   div.textContent = text;

   const span = document.createElement('span');
   span.textContent = '|';
   div.appendChild(span);

   document.body.appendChild(div);

   const left = span.offsetLeft;

   document.body.removeChild(div);

   return left;
}

register.forEach((notation, index) => {
   app.component(notation.id + '-list', {
      props: ['item'],
      data: () => ({
         notation
         , shownFS: []
         , tooltip: false
         , tooltipX: {}
         , inputVisited: false
      }),
      methods: {
         onmouseenter(event) {
            if (this.notation.drawDiagram !== null && root.diagram_follow) {
               let diagram = this.notation.drawDiagram(this.item.expr)
               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.display(this.item.expr)
                  })
               }

               root.showCanvas = true
               root.pCanvas.x = event.clientX + 100
               root.pCanvas.y = event.clientY + 15
            }

            if (!this.notation.able(this.item.expr)) return;
            var FS = get_FS(this.notation, root.use_alternative)
            var res = [], nmax = root.FS_shown
            // Build a lookup map: all analysis items by their expr
            var commentMap = {}
            var scanItems = function (items) {
               for (var si = 0; si < items.length; si++) {
                  var it = items[si]
                  if (it.analysis) commentMap['' + it.expr] = it.analysis
                  if (it.subitems && it.subitems.length) scanItems(it.subitems)
               }
            }
            scanItems(root.datasets[root.current_tab].subitems)
            var terms = []
            var maxWidth = 0
            for (let n = 0; n <= nmax; ++n) {
               var fsExpr = FS(this.item.expr, n)
               var seqStr = n + ': ' + this.notation.display(fsExpr)
               var childComment = commentMap['' + fsExpr] || ''
               terms.push({ exprStr: seqStr, comment: childComment })
            }
            // Use CSS to align — set fixed width for expression part
            // measured by the longest expression string
            var maxLen = 0
            for (var ti = 0; ti < terms.length; ti++) {
               var l = terms[ti].exprStr.length
               if (l > maxLen) maxLen = l
            }
            for (var ti = 0; ti < terms.length; ti++) {
               terms[ti].exprWidth = (maxLen * 0.6) + 1 + 'em'
            }
            res = terms
            this.shownFS = res
            this.tooltipX = { left: (event.offsetX + 15) + 'px' }
            this.tooltip = true
         },
         onmousemove(event) {
            if (root.diagram_follow) {
               root.pCanvas.x = event.clientX + 100
               root.pCanvas.y = event.clientY + 15
            }
         },
         onmouseleave(event) {
            if (root.diagram_follow) {
               root.showCanvas = false
            }

            this.tooltip = false
         },
         onmousedown(event) {
            if (event.button === 0) {
               let FS = root.use_alternative ? this.FSalter : this.FS;
               expand_item(this.item, this.notation, root.use_alternative, root.tier)
            } else if (event.button === 2) {
               console.log(this.notation, this.item)
            }
         },
         onfocus(event) {
            /** @type {HTMLInputElement} */
            const target = event.target;
            const rect = target.getBoundingClientRect();
            const currentScroll = window.scrollY;

            if (root.auto_scroll) {
               const targetScroll = rect.top + currentScroll - 100;
               window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }

            if (!this.inputVisited) {
               this.inputVisited = true
               target.setSelectionRange(target.value.length, target.value.length);
            }
            let pixelPosition = getCaretPixelPosition(target, target.selectionStart)
            target.scrollLeft = (pixelPosition - target.clientWidth / 2)

            if (this.notation.drawDiagram != null) {
               let diagram = this.notation.drawDiagram(this.item.expr)

               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.display(this.item.expr)
                  })

                  root.showCanvas = true

                  let rect = this.$refs.input.getBoundingClientRect()
                  root.pCanvas.x = rect.left + 5 + root.pCanvasModifier.x
                  root.pCanvas.y = 105 + rect.bottom - rect.top + root.pCanvasModifier.y
               } else {
                  root.showCanvas = false
               }
            }
         },
         onblur(event) {
            root.showCanvas = false
         },
         onkeydown(event) {
            if (event.key === 'ArrowUp') {
               event.preventDefault()

               let quick_level = (event.altKey ? 4 : 0) + (event.ctrlKey ? 2 : 0) + (event.shiftKey ? 1 : 0)

               let prev = find_prev(this.item, quick_level)
               if (prev) node_map.get(prev.path)?.$refs?.input?.focus({ preventScroll: true })
            } else if (event.key === 'ArrowDown') {
               event.preventDefault()

               let quick_level = (event.altKey ? 4 : 0) + (event.ctrlKey ? 2 : 0) + (event.shiftKey ? 1 : 0)

               let next = find_next(this.item, quick_level);
               if (next) node_map.get(next.path)?.$refs?.input?.focus({ preventScroll: true })
            } else if (event.key === 'ArrowLeft' && event.ctrlKey) {
               event.preventDefault()
               let input = event.target
               input.setSelectionRange(0, 0)
               input.scrollLeft = 0
            } else if (event.key === 'ArrowRight' && event.ctrlKey) {
               event.preventDefault()
               let input = event.target
               input.setSelectionRange(input.value.length, input.value.length)
               input.scrollLeft = input.scrollWidth - input.clientWidth
            } else if (event.key === 'Enter') {
               event.preventDefault()
               let tier = event.shiftKey ? 1 : root.tier
               let FS = root.use_alternative ? this.FSalter : this.FS;
               expand_item(this.item, this.notation, root.use_alternative, tier, true)
            } else if (event.key === 'Backspace' && event.ctrlKey) {
               event.preventDefault()
               var par = this.item.parent
               if (par && !par.is_root) {
                  var idx = par.subitems.indexOf(this.item)
                  if (idx !== -1) {
                     par.subitems.splice(idx, 1)
                     // 回退父节点的基本列计数，使被删子项可重新生成
                     if (par.fs_index !== undefined && par.fs_index > 0) {
                        par.fs_index--
                     }
                  }
                  // 聚焦到父节点
                  var parNode = node_map.get(par.path)
                  if (parNode) setTimeout(function () { parNode.$refs?.input?.focus({ preventScroll: true }); }, 0)
               }
            } else if (event.key === 'Delete') {
               event.preventDefault()
               delete this.item.analysis
            } else if (event.key.toLowerCase() === 's' && event.ctrlKey) {
               event.preventDefault()

               root.export_xlsx()
            } else if (event.key.toLowerCase() === 'h' && event.ctrlKey) {
               event.preventDefault()

               this.item.hide_child = !this.item.hide_child
            } else if (event.key.toLowerCase() === 'e' && event.ctrlKey) {
               event.preventDefault()

               let notation = analysis_register[this.current_analysis_index];
               if (!notation) return;

               root.analysis_fs_target = this.item.path
               root.show_fs_dialog = true
            } else if (event.altKey && ['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
               event.preventDefault()

               let d_pos_list = [{ y: 50 }, { x: 50 }, { y: -50 }, { x: -50 }]
               let d_pos = d_pos_list[['w', 'a', 's', 'd'].indexOf(event.key.toLowerCase())]
               root.pCanvas.x += d_pos.x || 0
               root.pCanvasModifier.x += d_pos.x || 0
               root.pCanvas.y += d_pos.y || 0
               root.pCanvasModifier.y += d_pos.y || 0
            } else if (event.key.toLowerCase() === 'h' && event.altKey) {
               root.pCanvasModifier.hide = !root.pCanvasModifier.hide
            } else if (event.key === 'Alt') {
               event.preventDefault()
            }
         },
      },
      mounted() {
         node_map.set(this.item.path, this)

         if (this.item.auto_focus) {
            this.$refs.input.focus({ preventScroll: true })
            this.item.auto_focus = false
         }
      },
      unmounted() {
         node_map.delete(this.item.path)
      },
      template: `<li><div class="shown-item" :class="{analyzed: item.analysis !== undefined}" @mouseenter="onmouseenter" @mousemove="onmousemove" @mouseleave="onmouseleave" @mousedown="onmousedown">
            <input type="checkbox" v-model="item.hide_child" @mousedown.stop>
            <input type="text" @mousedown.stop @keydown.stop="onkeydown" ref="input" @focus="onfocus" @blur="onblur" v-model="item.analysis"/>
            <span v-html="notation.display(item.expr)"></span>
            <div class="tooltip" v-if="tooltip" :style="tooltipX" @mousedown.stop>
            <span v-html="notation.display(item.expr)"></span> fundamental sequence:
            <div v-for="term in shownFS" class="tooltip-row">
               <span class="tooltip-expr" :style="{ width: term.exprWidth }" v-html="term.exprStr"></span>
               <span class="tooltip-cmnt" v-if="term.comment" v-html="'; ' + term.comment"></span>
            </div>
         </div></div>
         <ul v-if="!item.hide_child">
            <`+ notation.id + `-list v-for="subitem in item.subitems" :item="subitem" :key="subitem.index"></` + notation.id + `-list>
         </ul>
      </li>`
   })
   app.component(notation.id, {
      props: ['subitems'],
      template: `<ul class="nowrap"><` + notation.id + `-list v-for="subitem in subitems" :item="subitem" :key="subitem.index"></` + notation.id + `-list></ul>`,
      mounted() {
      }
   })
})

app.component('fs-dialog', {
   template: `
    <div v-if="modelValue" class="fs-dialog-overlay" @click.self="handleCancel">
      <div class="fs-dialog-container">
        <h3 class="fs-dialog-title">input fs index</h3>
        <input
          ref="inputRef"
          type="number"
          v-model.number="inputValue"
          step="1"
          class="fs-dialog-input"
          @keyup.enter="handleConfirm"
        >
        <div class="fs-dialog-buttons">
          <button @click="handleCancel" class="fs-dialog-btn">cancel</button>
          <button @click="handleConfirm" class="fs-dialog-btn fs-dialog-btn-primary">confirm</button>
        </div>
      </div>
    </div>
  `,
   props: {
      modelValue: false,
      init: 0,
   },
   emits: ['update:modelValue', 'confirm', 'cancel'],
   data() {
      return {
         inputValue: 0
      }
   },
   watch: {
      modelValue(newVal) {
         if (newVal) {
            this.inputValue = this.init
            this.$nextTick(() => {
               if (this.$refs.inputRef) {
                  this.$refs.inputRef.focus()
                  this.$refs.inputRef.select()
               }
            })
         }
      }
   },
   methods: {
      handleConfirm() {
         if (!Number.isInteger(this.inputValue)) {
            alert('illegal input')
            return
         }
         this.$emit('confirm', this.inputValue)
         this.close()
      },
      handleCancel() {
         this.$emit('cancel')
         this.close()
      },
      close() {
         this.$emit('update:modelValue', false)
      }
   }
})

app.config.globalProperties.nCpSN = 2;
const root = app.mount('#app')

// ===== Debug Tools =====
window.debugTools = (function () {
   function detectInfChain(notation, opts) {
      var opt = opts || {};
      var limitTerm = opt.limitTerm || 6;
      var maxSteps = opt.maxSteps || 50;
      var maxN = opt.maxN || 1;
      var preview = opt.preview || 8;
      var maxVisited = opt.maxVisited || 2000;
      var display = notation.display || JSON.stringify;
      var FS = notation.FS;
      var results = [];
      for (var fsIdx = 0; fsIdx < limitTerm; fsIdx++) {
         var seq;
         try { seq = FS([Infinity], fsIdx); } catch (e) { }
         if (!Array.isArray(seq)) {
            seq = [1];
            for (var i = 1; i <= fsIdx; i++) seq.push(i + 1);
         }
         // parentMap: key(JSON) -> {parentKey, seq, step}
         var parentMap = {};
         var startKey = JSON.stringify(seq);
         var stack = [{ seq: seq, steps: 0, key: startKey }];
         var visitedCount = 0;
         var found = false;
         var chain = [];
         var limitReached = false;
         var lastKey = startKey;
         var lastSteps = 0;
         parentMap[startKey] = { parentKey: null, seq: seq, step: 0 };
         while (stack.length > 0) {
            var item = stack.pop();
            var s = item.seq, steps = item.steps, key = item.key;
            visitedCount++;
            lastKey = key;
            lastSteps = steps;
            if (steps >= maxSteps) { found = true; break; }
            if (visitedCount >= maxVisited) { limitReached = true; break; }
            if (s.length <= 1) continue;
            if (s[s.length - 1] === 1) {
               var ns = s.slice(0, -1);
               var nskey = JSON.stringify(ns);
               if (!parentMap[nskey]) {
                  parentMap[nskey] = { parentKey: key, seq: ns, step: steps + 1 };
                  stack.push({ seq: ns, steps: steps + 1, key: nskey });
               }
               continue;
            }
            for (var n = 0; n <= maxN; n++) {
               try {
                  var ns = FS(s, n);
                  if (!Array.isArray(ns)) continue;
                  var nskey2 = JSON.stringify(ns);
                  if (!parentMap[nskey2]) {
                     parentMap[nskey2] = { parentKey: key, seq: ns, step: steps + 1 };
                     stack.push({ seq: ns, steps: steps + 1, key: nskey2 });
                  }
               } catch (e) { }
            }
         }
         // 重建路径
         if (found || limitReached) {
            var curKey = lastKey;
            var backwards = [];
            while (curKey && backwards.length < preview) {
               var node = parentMap[curKey];
               if (!node) break;
               backwards.unshift(node.seq);
               curKey = node.parentKey;
            }
            chain = backwards;
            // 如果还没满，从 start 补充
            while (chain.length < preview && chain.length > 0) {
               break;
            }
         }
         var reason = found ? 'INF' : (limitReached ? 'LIMIT' : 'TERM');
         results.push({ start: seq, found: found, chain: chain, visited: visitedCount, reason: reason });
      }
      return results;
   }
   function dfsDiff(notationA, notationB, opts) {
      var opt = opts || {};
      var maxN = opt.maxN || 3;
      var maxVisited = opt.maxVisited || 200;
      var maxSteps = opt.maxSteps || 10;
      var FSA = notationA.FS;
      var FSB = notationB.FS;
      var visited = {};
      var queue = [];
      var head = 0;
      // 先处理 [Infinity]，得到 limFS(0), limFS(1), ... 并按序入队
      for (var i = 0; i <= maxN; i++) {
         try {
            var expr = FSA([Infinity], i);
            if (Array.isArray(expr) && expr.length > 0) {
               var k = JSON.stringify(expr);
               if (!visited[k]) { visited[k] = 1; queue.push(expr); }
            }
         } catch (e) { }
      }
      var mismatches = [];
      var total = 0;
      var stepDepth = {};
      var startTime = Date.now();
      var timeLimit = 3000;
      while (head < queue.length && total < maxVisited && mismatches.length < 50) {
         if (Date.now() - startTime > timeLimit) break;
         var expr = queue[head++];
         var exprKey = JSON.stringify(expr);
         total++;
         var d = stepDepth[exprKey] || 0;
         if (d >= maxSteps) continue;
         for (var pos = 0; pos <= maxN; pos++) {
            var rA = null, rB = null;
            try { rA = FSA(expr, pos); } catch (e) { }
            if (rA === null || (Array.isArray(rA) && rA.length === 0)) continue;
            try { rB = FSB(expr, pos); } catch (e) { }
            var sA = JSON.stringify(rA);
            var sB = rB === null ? 'null' : JSON.stringify(rB);
            if (sA !== sB) {
               mismatches.push({
                  exprJSON: exprKey,
                  fsPos: pos,
                  aResult: rA,
                  bResult: rB,
               });
            }
            var pushChild = function (x) {
               var k = JSON.stringify(x);
               if (!visited[k]) { visited[k] = 1; stepDepth[k] = d + 1; queue.push(x); }
            };
            if (rA !== null) pushChild(rA);
            if (rB !== null) pushChild(rB);
         }
      }
      var timedOut = Date.now() - startTime > timeLimit;
      return { totalVisited: total, mismatches: mismatches, timedOut: timedOut };
   }
   return {
      detectInfChain: detectInfChain,
      detectById: function (id, opts) {
         var n = register.find(function (r) { return r.id === id; });
         if (!n) { console.error('Notation "' + id + '" not found'); return; }
         return detectInfChain(n, opts);
      },
      dfsDiff: dfsDiff
   };
})();