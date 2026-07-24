;

const node_map = new Map()

const first_main_id = () => register.length ? register[0].id : ''
const second_main_id = () => register.length > 1 ? register[1].id : first_main_id()
const N_CPS_GENERATOR_ID = 'n-cps'
const BUILTIN_NOTATION_OWNER = '@notation-explorer/builtin'
const MAX_GENERATOR_VALUE = 64
const DIRECT_EXPAND_MAX_COUNT = 1000

const generator_definition = (categoryId) => {
   if (typeof register !== 'undefined' && typeof register.generatorDefinition === 'function') {
      return register.generatorDefinition(categoryId)
   }
   return undefined
}

const generator_category_ids = () => {
   if (typeof register !== 'undefined' && typeof register.generatorCategoryIds === 'function') {
      return register.generatorCategoryIds()
   }
   return []
}

const generated_notation_info = (notation) => {
   return notation && (notation.generatedFamily || notation.generatorFamily || notation.upstreamGenerator)
}

const init_datasets = () => {
   var datasets = Object.create(null)
   register.forEach(function (notation) {
      var prepared = window.localNotationManager
         ? window.localNotationManager.initialItemsFor(notation.id)
         : undefined
      datasets[notation.id] = init_dataset(notation, prepared)
   })
   return datasets
}

const init_dataset = (notation, preparedItems) => {
   let root_item = {
      is_root: true, mark: 0, path: undefined
   }
   var initialItems = preparedItems === undefined ? notation.init() : preparedItems
   root_item.subitems = initialItems.map(
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
      currentNotationId: first_main_id(),
      currentAnalysisId: '',
      FS_shown: 3,
      tier: 0,
      length_limit: 20,
      datasets: init_datasets(),
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
      displayMode: 'html',
      equivActive: Object.create(null),
      equivHideOriginal: Object.create(null),
      latexCommands: '',
      analysisLatexPreview: false,
      analysisLatexInline: false,
      analysisInputVisible: true,
      analysisInputWidth: 180,
      analysisLatexState: { visible: false, source: '', x: 0, y: 0 },
      generatorState: Object.create(null),
      toolsNotation: first_main_id(),
      toolsOpts: { limitTerm: 6, maxSteps: 50, maxN: 1, preview: 8, maxVisited: 2000 },
      toolsDiffA: first_main_id(),
      toolsDiffB: second_main_id(),
      toolsDiffOpts: { limitTerm: 6, maxSteps: 10, maxN: 3, maxVisited: 200 },
      toolsOutput: '',
      toolsExpandNotation: first_main_id(),
      toolsExpandEquiv: '',
      toolsExpandExpr: '',
      toolsExpandN: 0,
      directExpandNotes: [],
      directExpandNoteSequence: 1,
      directExpandTopZ: 0,
      directExpandPointer: null,
      notationSearch: '',
      dropdownOpen: false,
      notationExpandedNodes: Object.create(null),
      notationMenuFocusIndex: -1,
      autoSaveInterval: 60,
      autoSaveHidden: false,
      lastSaveTime: null,
      saveLabelTick: 0,
      saveTimerId: null,
      allNoteSheets: Object.create(null),
      toolsExpandCount: 1,
      toolsPPSInput: '0, 1, 0, 2, 0, 3',
      notationVersion: 0,
      notationRevisions: Object.create(null),
      analysisArchive: Object.create(null),
      isHydrating: true,
      suppressSelectionWatch: false,
   }),
   computed: {
      currentNotation() {
         void this.notationVersion;
         return register.get(this.currentNotationId) || { name: '', id: '' };
      },
      currentDataset() { return this.datasets[this.currentNotationId] || { is_root: true, mark: 0, subitems: [] } },
      currentNotationKey() { return this.currentNotationId + ':' + (this.notationRevisions[this.currentNotationId] || 0) },
      current_analysis_notation() {
         void this.notationVersion;
         return analysis_register.get(this.currentAnalysisId) || {};
      },
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
                display_mode: 'Expression rendering',
                display_html: 'HTML',
                display_latex: 'LaTeX',
                'equiv.label': 'Equivalent notation:',
                'equiv.none': '(none)',
                'equiv.default': 'Original',
                'equiv.hide-original': 'Hide original',
                'display.index': 'Index',
                'display.layer': 'Layer',
                'display.index-marked': 'Annotated',
                'display.index-simple': 'Simple index',
                'display.layer-simple': 'Simple layer',
                'display.simple': 'Simple',
                'display.pocn': 'Projection OCN',
                'display.veblen-separate': 'Separate last term',
                'display.btl-m1y-nss-combined': 'Combined',
                'display.pocn-sup': 'Superscript',
                'display.pocn-colored': 'Projection OCN (colored)',
                'expand.equiv': 'Equiv',
                latex_commands: 'LaTeX commands',
                latex_commands_placeholder: '\\newcommand{\\foo}[1]{#1^2}',
                latex_commands_error: 'Invalid LaTeX commands',
                analysis_latex_preview: 'Render analysis as LaTeX',
                analysis_latex_inline: 'Show LaTeX in analysis fields when not editing',
                analysis_input_visible: 'Show analysis input',
                analysis_input_width: 'Analysis input width',
                tools: 'Tools',
               tools_title: 'Tools',
               tools_notation_select: 'Notation',
               tools_limit: 'Limit',
               tools_steps: 'Max steps',
               tools_maxn: 'Max n',
               tools_preview: 'Preview',
               tools_inf_chain: 'Inf Chain Detection',
               tools_run: 'Run',
               tools_run_all: 'Run All',
               tools_maxvisited: 'Max visited',
               tools_bfs_diff: 'DFS Diff',
               tools_notation_a: 'Notation A',
               tools_notation_b: 'Notation B',
               tools_diff_limit: 'DFS limit',
               tools_diff_maxpos: 'Max FS pos',
               tools_diff_run: 'Diff',
               tools_placeholder: 'Click \"Run\" to detect infinite descending chains',
               tools_direct_expand: 'Direct Expansion',
               tools_expand_expr: 'Expression',
               tools_expand_n: 'Start n',
                tools_expand_count: 'Count',
                tools_expand_run: 'Expand',
                tools_expand_note_new: 'Open another direct expansion window',
                tools_expand_note_close: 'Close direct expansion window',
                tools_expand_note_move: 'Move direct expansion window',
                tools_expand_note_resize: 'Resize direct expansion window',
                tools_expand_note_output: 'Result',
                tools_pps_translate: 'PPS Translation',
               tools_pps_input: 'PPS Sequence',
               tools_pps_convert: 'Translate',
               n_param_label: 'n =',
               generator_add: 'Add next variant',
               generator_remove: 'Remove last added variant',
                notation_search_placeholder: 'Search notation...',
                notation_search_empty: 'No matching notation',
                notation_builtin_folder: 'Built-in',
                notation_local_folder: 'Local files',
                notation_expand_folder: 'Expand folder',
                notation_collapse_folder: 'Collapse folder',
                notation_select_label: 'Select notation',
               auto_save: 'Auto-save',
               auto_save_interval: 'Auto-save interval (s)',
               auto_save_hidden: 'Save hidden state',
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
                display_mode: '表达式渲染',
                display_html: 'HTML',
                display_latex: 'LaTeX',
                'equiv.label': '等价表示:',
                'equiv.none': '(无)',
                'equiv.default': '原记号',
                'equiv.hide-original': '隐藏原表达式',
                'display.index': '标记列标',
                'display.layer': '标记层级',
                'display.index-marked': '显示列标',
                'display.index-simple': '简化标记层级',
                'display.layer-simple': '简化标记列标',
                'display.simple': '简化形式',
                'display.pocn': '投影 OCN',
                'display.veblen-separate': '分离末项',
                'display.btl-m1y-nss-combined': '合并形式',
                'display.pocn-sup': '上标形式',
                'display.pocn-colored': '投影 OCN (彩色)',
                'expand.equiv': '等价表示',
                latex_commands: 'LaTeX 命令',
                latex_commands_placeholder: '\\newcommand{\\foo}[1]{#1^2}',
                latex_commands_error: 'LaTeX 命令无效',
                analysis_latex_preview: '分析文本 LaTeX 渲染',
                analysis_latex_inline: '非编辑时在分析框中显示 LaTeX',
                analysis_input_visible: '显示分析输入框',
                analysis_input_width: '分析输入框宽度',
                tools: '工具',
               tools_title: '工具',
               tools_notation_select: '记号',
               tools_limit: '基本列数',
               tools_steps: '最大步数',
               tools_maxn: '最大 n',
               tools_preview: '预览项数',
               tools_inf_chain: '无穷降链检测',
               tools_run: '运行',
               tools_run_all: '全部运行',
               tools_maxvisited: '最大访问数',
               tools_bfs_diff: 'DFS 差异对比',
               tools_notation_a: '记号 A',
               tools_notation_b: '记号 B',
               tools_diff_limit: 'DFS 上限',
               tools_diff_maxpos: '最大 FS 位置',
               tools_diff_run: '对比',
               tools_placeholder: '点击「运行」检测无穷降链',
               tools_direct_expand: '直接展开',
               tools_expand_expr: '表达式',
               tools_expand_n: '起始 n',
                tools_expand_count: '项数',
                tools_expand_run: '展开',
                tools_expand_note_new: '新建直接展开窗口',
                tools_expand_note_close: '关闭直接展开窗口',
                tools_expand_note_move: '移动直接展开窗口',
                tools_expand_note_resize: '调整直接展开窗口大小',
                tools_expand_note_output: '结果',
                tools_pps_translate: 'PPS 翻译',
               tools_pps_input: 'PPS 序列',
               tools_pps_convert: '转换',
               n_param_label: 'n =',
               generator_add: '增加下一个变种',
               generator_remove: '移除最后增加的变种',
                notation_search_placeholder: '搜索记号...',
                notation_search_empty: '无匹配记号',
                notation_builtin_folder: '内置记号',
                notation_local_folder: '本地文件',
                notation_expand_folder: '展开文件夹',
                notation_collapse_folder: '收起文件夹',
                notation_select_label: '选择记号',
               auto_save: '自动保存',
               auto_save_interval: '自动保存间隔（秒）',
               auto_save_hidden: '保存隐藏状态',
            },
         };
         return t[this.lang] || t.en;
      },
      tab_names() { void this.notationVersion; return register.map(n => n.name); },
      analysisNotations() { void this.notationVersion; return analysis_register.map(n => ({ id: n.id, name: n.name })); },
      notationMenuTree() {
         void this.notationVersion;
         if (!window.NotationMenu) return [];
         var manager = window.localNotationManager;
         return window.NotationMenu.buildTree({
            catalog: window.BUILTIN_NOTATION_CATALOG || [],
            notations: register.map(function(notation) { return notation; }),
            getNotation: function(id) { return register.get(id); },
            getOwner: function(id) { return register.ownerOf(id); },
            localFiles: manager ? manager.listFiles() : [],
            entriesForOwner: function(ownerId) { return register.entriesForOwner(ownerId); },
            builtinLabel: this.L.notation_builtin_folder,
            localLabel: this.L.notation_local_folder,
            categories: typeof register.categories === 'function' ? register.categories() : [],
            generatorDefinitions: typeof register.generatorDefinitions === 'function'
               ? register.generatorDefinitions() : [],
            generatorState: this.generatorState,
         });
      },
      notationMenuRows() {
         if (!window.NotationMenu) return [];
         return window.NotationMenu.flattenTree(
            this.notationMenuTree,
            this.notationExpandedNodes,
            this.notationSearch
         );
      },
      currentEquivalentOptions() {
         void this.notationVersion
         return this.equivalentOptionsFor(this.currentNotation)
      },
      currentEquivalentId() {
         return this.effectiveEquivalentId(this.currentNotation)
      },
      currentEquivalentHideOriginal() {
         return this.equivalentHideOriginalFor(this.currentNotationId)
      },
      currentNotationCredit() {
         void this.notationVersion
         if (!window.NotationCredits) return ''
         return window.NotationCredits.resolveCredit(this.currentNotation, this.lang)
      },
      toolsExpandEquivalentOptions() {
         void this.notationVersion
         return this.equivalentOptionsFor(register.get(this.toolsExpandNotation))
      },
      lastSaveLabel() {
         if (this.lastSaveTime === null) return '';
         void this.saveLabelTick;
         var now = Date.now();
         var diff = now - this.lastSaveTime;
         var s = Math.floor(diff / 1000);
         if (s < 60) return this.lang === 'zh' ? s + '秒前保存' : s + 's ago';
         var m = Math.floor(s / 60);
         if (m < 60) return this.lang === 'zh' ? m + '分钟前保存' : m + 'm ago';
         var h = Math.floor(m / 60);
         return this.lang === 'zh' ? h + '小时前保存' : h + 'h ago';
      },
      toolsNotations() { void this.notationVersion; return register.map(n => ({ id: n.id, name: n.name })); },
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
      },
      latexCommandsError() {
         if (!window.NotationLatex) return 'KaTeX is unavailable.'
         return window.NotationLatex.validateCommands(this.latexCommands)
      }
   },
   watch: {
      darkMode(val) { document.documentElement.classList.toggle('dark', val); this.saveSettings() },
      lang() { this.saveSettings() },
      displayMode() { this.saveSettings() },
      latexCommands() { this.saveSettings() },
      analysisLatexPreview(val) {
         if (!val) this.hideAnalysisLatexPreview()
         this.saveSettings()
      },
      analysisLatexInline() { this.saveSettings() },
      analysisInputVisible(val) {
         if (!val) this.hideAnalysisLatexPreview()
         this.saveSettings()
      },
      analysisInputWidth(val) {
         var width = Math.max(60, Math.min(600, Math.round(Number(val) || 180)))
         if (width !== val) {
            this.analysisInputWidth = width
            return
         }
         this.saveSettings()
      },
      diagram_follow() { this.saveSettings() },
      auto_scroll() { this.saveSettings() },
      export_hide() { this.saveSettings() },
      use_alternative() { this.saveSettings() },
      diagram_scale() { this.saveSettings() },
      tier() { this.saveSettings() },
      length_limit() { this.saveSettings() },
      FS_shown() { this.saveSettings() },
      currentAnalysisId() { this.saveSettings() },
      currentNotationId(val, oldId) {
         if (this.isHydrating || this.suppressSelectionWatch) return;
         if (oldId) this.allNoteSheets[this.dataKeyForId(oldId)] = this.noteSheets;
         this.initSheets();
         this.saveSettings();
      },
      autoSaveInterval() { this.saveSettings(); this.startAutoSave(); },
      autoSaveHidden() { this.saveSettings(); },
      notationSearch() { this.notationMenuFocusIndex = -1; },
      toolsExpandNotation() { this.ensureToolsExpandEquivalent() },
   },
   methods: {
      generatorCurrent(categoryId) {
         if (typeof register.generatorCurrent === 'function') {
            return register.generatorCurrent(categoryId)
         }
         var value = this.generatorState && this.generatorState[categoryId]
         var definition = generator_definition(categoryId)
         if (!definition) return 0
         return Number.isSafeInteger(value) && value >= definition.start &&
            value <= this.generatorMaximum(categoryId)
            ? value
            : definition.initial
      },
      generatorMaximum(categoryId) {
         if (typeof register.generatorMaximum === 'function') {
            return register.generatorMaximum(categoryId)
         }
         var definition = generator_definition(categoryId)
         if (!definition) return 0
         return Number.isSafeInteger(definition.maximum)
            ? definition.maximum : Math.max(definition.initial, MAX_GENERATOR_VALUE)
      },
      generatorCanIncrement(categoryId) {
         if (typeof register.generatorCanIncrement === 'function') {
            return register.generatorCanIncrement(categoryId)
         }
         return !!generator_definition(categoryId) && this.generatorCurrent(categoryId) < this.generatorMaximum(categoryId)
      },
      generatorCanDecrement(categoryId) {
         if (typeof register.generatorCanDecrement === 'function') {
            return register.generatorCanDecrement(categoryId)
         }
         var definition = generator_definition(categoryId)
         return !!definition && this.generatorCurrent(categoryId) > definition.start
      },
      installGeneratedNotation(categoryId, index, restoreAnalysis) {
         var notation
         if (typeof register.materializeGenerator === 'function') {
            notation = register.materializeGenerator(categoryId, index)
         } else {
            throw new Error('The notation registry does not support generated variants.')
         }
         if (this.datasets[notation.id]) return notation
         var dataset = init_dataset(notation)
         this.datasets[notation.id] = dataset
         this.notationRevisions[notation.id] = (this.notationRevisions[notation.id] || 0) + 1
         if (restoreAnalysis) {
            try {
               this.restoreNotationAnalysis(notation.id, BUILTIN_NOTATION_OWNER)
            } catch (error) {
               console.warn('Restore generated notation analysis failed for "' + notation.id + '"', error)
            }
         }
         return notation
      },
      restoreGeneratedNotations() {
         if (typeof register.setGeneratorState === 'function') register.setGeneratorState(this.generatorState)
         var changed = false
         var self = this
         generator_category_ids().forEach(function(categoryId) {
            var definition = generator_definition(categoryId)
            if (!definition) return
            var target = self.generatorCurrent(categoryId)
            var actual = Number.isSafeInteger(definition.currentIndex)
               ? definition.currentIndex : definition.initial
            for (var removeIndex = actual; removeIndex > target; removeIndex--) {
               var retained = definition.entries && definition.entries[removeIndex]
               var removeNotation = retained && register.get(retained.id)
               if (removeNotation) {
                  try { self.stashNotationData(removeNotation.id, register.ownerOf(removeNotation.id)) }
                  catch (error) { console.warn('Archive generated notation failed', error) }
               }
            }
            try {
               var result = typeof register.initGenerator === 'function'
                  ? register.initGenerator(categoryId, { target: target }) : null
               if (result && Array.isArray(result.changed)) {
                  result.changed.forEach(function(change) {
                     var entry = change.notation
                     if (!entry) return
                     if (change.type === 'removed') {
                        delete self.datasets[entry.id]
                     } else if (change.type === 'added') {
                        self.installGeneratedNotation(categoryId, generated_notation_info(entry).index, false)
                        try { self.restoreNotationAnalysis(entry.id, register.ownerOf(entry.id)) }
                        catch (error) { console.warn('Restore generated notation analysis failed', error) }
                     }
                     changed = true
                  })
               }
               self.generatorState[categoryId] = self.generatorCurrent(categoryId)
            } catch (error) {
               console.warn('Restore generated notation failed for ' + categoryId, error)
            }
         })
         if (changed) this.notationVersion++
      },
      incrementGenerator(categoryId) {
         if (!this.generatorCanIncrement(categoryId)) return
         try {
            var notation = typeof register.generatorAdd === 'function'
               ? register.generatorAdd(categoryId) : undefined
            if (!notation) return
            this.datasets[notation.id] = init_dataset(notation)
            this.notationRevisions[notation.id] = (this.notationRevisions[notation.id] || 0) + 1
            try { this.restoreNotationAnalysis(notation.id, register.ownerOf(notation.id)) }
            catch (error) { console.warn('Restore generated notation analysis failed', error) }
            this.generatorState[categoryId] = this.generatorCurrent(categoryId)
            this.notationVersion++
            this.saveSettings()
            this.saveAnalysis()
         } catch (error) {
            console.error('Add generated notation failed.', error)
            window.alert(error && error.message || String(error))
         }
      },
      decrementGenerator(categoryId) {
         if (!this.generatorCanDecrement(categoryId)) return
         try {
            var definition = generator_definition(categoryId)
            var current = Number.isSafeInteger(definition && definition.currentIndex)
               ? definition.currentIndex : this.generatorCurrent(categoryId)
            var retained = definition && definition.entries && definition.entries[current]
            var notation = retained && register.get(retained.id)
            if (!notation) throw new Error('Generated notation is not registered for ' + categoryId + '[' + current + ']')

            var oldOrder = register.map(function(entry) { return entry.id })
            var snapshot = {
               mainOrder: oldOrder,
               currentNotationId: this.currentNotationId,
               currentAnalysisId: this.currentAnalysisId,
            }
            this.stashNotationData(notation.id, register.ownerOf(notation.id))
            if (this.currentNotationId === notation.id) {
               this.allNoteSheets[this.dataKeyForId(notation.id, register.ownerOf(notation.id))] = this.noteSheets
            }
            this.saveAnalysis()
            var removed = typeof register.generatorRemove === 'function'
               ? register.generatorRemove(categoryId) : undefined
            if (!removed) return
            delete this.datasets[notation.id]
            this.generatorState[categoryId] = this.generatorCurrent(categoryId)
            this.reconcileNotationSelections(
               snapshot,
               { change: { main: { added: [] } } },
               'generator-decrement'
            )
            this.notationVersion++
            this.saveSettings()
            this.saveAnalysis()
         } catch (error) {
            console.error('Remove generated notation failed.', error)
            window.alert(error && error.message || String(error))
         }
      },
      resolveNotationDisplay(notation, requestedId) {
         if (window.NotationDisplay) {
            return window.NotationDisplay.resolveDisplay(notation, requestedId)
         }
         return {
            plain: notation.display,
            html: notation.display,
            latex: notation.latex || notation.display,
            fromDisplay: notation.fromDisplay,
            fromDisplayAlter: notation.fromDisplay_alter,
            requestedId: requestedId || undefined,
            effectiveId: undefined,
            isEquivalent: false,
         }
      },
      equivalentOptionsFor(notation) {
         if (!notation || !window.NotationDisplay) return []
         var self = this
         return window.NotationDisplay.listEquivalentDisplays(notation).map(function (option) {
            return {
               id: option.id,
               label: window.NotationDisplay.formatDisplayName(
                  option.id,
                  option.spec,
                  function (key) { return self.L[key] || key }
               ),
            }
         })
      },
      equivalentStateKey(notationId, ownerId) {
         return this.dataKeyForId(notationId, ownerId)
      },
      migrateEquivalentStateMap(values) {
         var migrated = Object.create(null)
         var self = this
         var legacyNCpSKey = BUILTIN_NOTATION_OWNER + '::' + N_CPS_GENERATOR_ID
         var currentNCpSKey = BUILTIN_NOTATION_OWNER + '::2-cps'
         Object.keys(values || {}).forEach(function(key) {
            if (key.indexOf('::') === -1) return
            var targetKey = key === legacyNCpSKey ? currentNCpSKey : key
            migrated[targetKey] = values[key]
         })
         Object.keys(values || {}).forEach(function(notationId) {
            if (notationId.indexOf('::') !== -1) return
            if (notationId === N_CPS_GENERATOR_ID) {
               if (migrated[currentNCpSKey] === undefined) {
                  migrated[currentNCpSKey] = values[notationId]
               }
               return
            }
            var owners = []
            var activeOwner = register.ownerOf(notationId)
            if (activeOwner) owners.push(activeOwner)
            var manager = window.localNotationManager
            if (manager && typeof manager.listFiles === 'function') {
               manager.listFiles().forEach(function(file) {
                  var knownIds = (file.knownMainIds || []).concat(
                     file.manifest && Array.isArray(file.manifest.main) ? file.manifest.main : []
                  )
                  if (knownIds.indexOf(notationId) !== -1 && owners.indexOf(file.id) === -1) {
                     owners.push(file.id)
                  }
               })
            }
            if (owners.length > 1) return
            var owner = owners[0] || BUILTIN_NOTATION_OWNER
            var targetKey = self.equivalentStateKey(notationId, owner)
            if (migrated[targetKey] === undefined) migrated[targetKey] = values[notationId]
         })
         return migrated
      },
      requestedEquivalentId(notationId, ownerId) {
         var key = this.equivalentStateKey(notationId, ownerId)
         var value = this.equivActive && this.equivActive[key]
         return typeof value === 'string' && value ? value : undefined
      },
      effectiveEquivalentId(notation) {
         if (!notation || !notation.id) return ''
         try {
            return this.resolveNotationDisplay(
               notation,
               this.requestedEquivalentId(notation.id)
            ).effectiveId || ''
         } catch (error) {
            return ''
         }
      },
      equivalentHideOriginalFor(notationId, ownerId) {
         if (!notationId || !this.equivHideOriginal) return true
         var key = this.equivalentStateKey(notationId, ownerId)
         return Object.prototype.hasOwnProperty.call(this.equivHideOriginal, key)
            ? !!this.equivHideOriginal[key]
            : true
      },
      setCurrentEquivalent(equivalentId) {
         var notation = this.currentNotation
         if (!notation || !notation.id) return
         var requested = typeof equivalentId === 'string' && equivalentId ? equivalentId : undefined
         var effective = requested
            ? this.resolveNotationDisplay(notation, requested).effectiveId
            : undefined
         var key = this.equivalentStateKey(notation.id)
         if (effective) this.equivActive[key] = effective
         else delete this.equivActive[key]
         this.saveSettings()
      },
      setCurrentEquivalentHideOriginal(value) {
         if (!this.currentNotationId) return
         this.equivHideOriginal[this.equivalentStateKey(this.currentNotationId)] = !!value
         this.saveSettings()
      },
      ensureToolsExpandEquivalent() {
         var notation = register.get(this.toolsExpandNotation)
         if (!notation || !this.toolsExpandEquiv) {
            this.toolsExpandEquiv = ''
            return
         }
         try {
            if (!this.resolveNotationDisplay(notation, this.toolsExpandEquiv).effectiveId) {
               this.toolsExpandEquiv = ''
            }
         } catch (error) {
            this.toolsExpandEquiv = ''
         }
      },
      directExpandEquivalentOptions(note) {
         void this.notationVersion
         return this.equivalentOptionsFor(note && register.get(note.notationId))
      },
      ensureDirectExpandNoteEquivalent(note) {
         if (!note) return
         var notation = register.get(note.notationId)
         if (!notation || !note.equivalentId) {
            note.equivalentId = ''
            return
         }
         try {
            if (!this.resolveNotationDisplay(notation, note.equivalentId).effectiveId) {
               note.equivalentId = ''
            }
         } catch (error) {
            note.equivalentId = ''
         }
      },
      selectDirectExpandNoteNotation(note) {
         if (!note) return
         var notation = register.get(note.notationId)
         note.ownerId = notation ? register.ownerOf(notation.id) : ''
         this.ensureDirectExpandNoteEquivalent(note)
      },
      setDisplayMode(mode) {
         if (mode === 'html' || mode === 'latex') this.displayMode = mode
      },
      setAnalysisInputWidth(width) {
         var next = Math.max(60, Math.min(600, Math.round(Number(width) || 180)))
         if (next !== this.analysisInputWidth) this.analysisInputWidth = next
      },
      renderAnalysisLatex(source) {
         if (!window.NotationLatex) return ''
         return window.NotationLatex.renderAnalysisText(source, true, this.latexCommands)
      },
      showAnalysisLatexPreview(source, x, y) {
         if (!this.analysisLatexPreview || !this.analysisInputVisible || !source) {
            this.hideAnalysisLatexPreview()
            return
         }
         this.analysisLatexState.source = String(source)
         this.analysisLatexState.x = Math.max(8, Math.min(Number(x) || 8, Math.max(8, window.innerWidth - 440)))
         this.analysisLatexState.y = Math.max(8, Math.min(Number(y) || 8, Math.max(8, window.innerHeight - 120)))
         this.analysisLatexState.visible = true
      },
      hideAnalysisLatexPreview() {
         this.analysisLatexState.visible = false
      },
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
      openNotationDropdown() {
         if (this.dropdownOpen) return;
         this.openCurrentNotationFolders();
         this.dropdownOpen = true;
         this.notationMenuFocusIndex = -1;
         this.$nextTick(() => {
            if (this.$refs.notationSearchInput) this.$refs.notationSearchInput.focus();
         });
      },
      toggleDropdown() {
         if (this.dropdownOpen) this.closeDropdown(false);
         else this.openNotationDropdown();
      },
      openCurrentNotationFolders() {
         if (!window.NotationMenu) return;
         var keys = window.NotationMenu.ancestorKeysForNotation(
            this.notationMenuTree,
            this.currentNotationId
         );
         for (var index = 0; index < keys.length; index++) {
            this.notationExpandedNodes[keys[index]] = true;
         }
      },
      toggleNotationFolder(row) {
         if (!row || row.kind !== 'folder') return;
         this.notationExpandedNodes[row.key] = !this.notationExpandedNodes[row.key];
      },
      activateNotationMenuRow(row) {
         if (!row) return;
         if (row.kind === 'folder') this.toggleNotationFolder(row);
         else this.selectNotation(row.id);
      },
      focusNotationMenuRow(index) {
         var lastIndex = this.notationMenuRows.length - 1;
         if (lastIndex < 0) return;
         index = Math.max(0, Math.min(index, lastIndex));
         this.notationMenuFocusIndex = index;
         this.$nextTick(() => {
            var refs = this.$refs.notationMenuRows;
            var target = Array.isArray(refs) ? refs[index] : refs;
            if (target && typeof target.focus === 'function') target.focus();
         });
      },
      handleNotationSearchKeydown(event) {
         if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusNotationMenuRow(0);
         } else if (event.key === 'Escape') {
            event.preventDefault();
            this.closeDropdown(true);
         }
      },
      handleNotationMenuKeydown(event, row, index) {
         var rows = this.notationMenuRows;
         if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusNotationMenuRow(index + 1);
         } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (index === 0 && this.$refs.notationSearchInput) this.$refs.notationSearchInput.focus();
            else this.focusNotationMenuRow(index - 1);
         } else if (event.key === 'Home') {
            event.preventDefault();
            this.focusNotationMenuRow(0);
         } else if (event.key === 'End') {
            event.preventDefault();
            this.focusNotationMenuRow(rows.length - 1);
         } else if (event.key === 'ArrowRight' && row.kind === 'folder') {
            event.preventDefault();
            if (!row.expanded && !this.notationSearch) this.toggleNotationFolder(row);
            else if (rows[index + 1] && rows[index + 1].depth > row.depth) this.focusNotationMenuRow(index + 1);
         } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            if (row.kind === 'folder' && row.expanded && !this.notationSearch) {
               this.toggleNotationFolder(row);
            } else if (row.parentKey) {
               var parentIndex = rows.findIndex(function(candidate) { return candidate.key === row.parentKey; });
               if (parentIndex >= 0) this.focusNotationMenuRow(parentIndex);
            }
         } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.activateNotationMenuRow(row);
         } else if (event.key === 'Escape') {
            event.preventDefault();
            this.closeDropdown(true);
         }
      },
      selectNotation(id) {
         if (!register.get(id)) return;
         this.currentNotationId = id;
         this.notationSearch = '';
         this.closeDropdown(true);
      },
      closeDropdown(restoreFocus) {
         this.dropdownOpen = false;
         this.notationMenuFocusIndex = -1;
         if (restoreFocus) {
            this.$nextTick(() => {
               if (this.$refs.notationTrigger) this.$refs.notationTrigger.focus();
            });
         }
      },
      async navigateToPage(targetPage) {
         if (targetPage === this.page) return;
         if (this.page === 'settings') {
            var manager = this.$refs.localNotationManagerComponent;
            if (manager && typeof manager.guardPendingChanges === 'function') {
               var canLeave = await manager.guardPendingChanges('page');
               if (!canLeave) return;
            }
         }
         this.page = targetPage;
      },
      captureLocalFileState(file, action) {
         var mainEntries = register.entriesForOwner(file.id);
         var analysisEntries = analysis_register.entriesForOwner(file.id);
         for (var i = 0; i < mainEntries.length; i++) {
            this.stashNotationData(mainEntries[i].id, file.id);
         }
         if (this.currentNotationId && register.ownerOf(this.currentNotationId) === file.id) {
            this.allNoteSheets[this.dataKeyForId(this.currentNotationId, file.id)] = this.noteSheets;
         }
         this.saveAnalysis();
         return {
            action: action,
            mainOrder: register.map(function (entry) { return entry.id }),
            currentNotationId: this.currentNotationId,
            currentAnalysisId: this.currentAnalysisId,
            oldMainIds: mainEntries.map(function (entry) { return entry.id }),
            oldAnalysisIds: analysisEntries.map(function (entry) { return entry.id }),
         };
      },
      clearOwnerAnalysis(ownerId) {
         var prefix = ownerId + '::';
         var archive = this.analysisArchive;
         Object.keys(archive).forEach(function (key) {
            if (key.indexOf(prefix) === 0) delete archive[key];
         });
      },
      clearEquivalentStateForIds(ids, ownerId) {
         var active = this.equivActive
         var hidden = this.equivHideOriginal
         var self = this
         ;(ids || []).forEach(function(id) {
            var key = self.equivalentStateKey(id, ownerId)
            delete active[key]
            delete hidden[key]
         })
      },
      purgeOwnerData(ownerId) {
         var prefix = ownerId + '::';
         var archive = this.analysisArchive;
         var sheets = this.allNoteSheets;
         Object.keys(archive).forEach(function (key) {
            if (key.indexOf(prefix) === 0) delete archive[key];
         });
         Object.keys(sheets).forEach(function (key) {
            if (key.indexOf(prefix) === 0) delete sheets[key];
         });
      },
      restoreNotationAnalysis(notationId, ownerId) {
         var notation = register.get(notationId);
         var dataset = this.datasets[notationId];
         if (!notation || !dataset) return;
         var key = this.dataKeyForId(notationId, ownerId || register.ownerOf(notationId));
         var archived = this.analysisArchive[key];
         if (!archived || !archived.items || archived.items.length === 0) return;
         var owner = ownerId || register.ownerOf(notationId);
         if (owner !== '@notation-explorer/builtin') {
            var localFile = window.localNotationManager && window.localNotationManager.getFile(owner);
            if (!localFile || archived.sourceRevision !== localFile.loadedRevision) {
               delete this.analysisArchive[key];
               return;
            }
         }
         var version = archived.legacyVersion || 3;
         var analysisList;
         if (version >= 2) {
            analysisList = archived.items.map(function (item) {
               var expr = restoreArchivedExpression(notation, item);
               if (expr === undefined) return null;
               var analysis = Object.prototype.hasOwnProperty.call(item, 'analysis')
                  ? item.analysis : undefined;
               return [expr, analysis, item.hide ? true : undefined];
            }).filter(function (item) { return item !== null; });
         } else {
            analysisList = archived.items.map(function (entry) {
               var expr = safeFromDisplay(notation, entry[0]);
               return expr === undefined ? null : [expr, entry[1], entry[2]];
            }).filter(function (item) { return item !== null; });
         }
         if (analysisList.length) {
            import_analysis(dataset, analysisList, notation, this.use_alternative, false, this.length_limit);
         }
      },
      reconcileDirectExpandNotes(firstNotationId) {
         var fallbackId = firstNotationId || ''
         var fallback = fallbackId && register.get(fallbackId)
         var fallbackOwner = fallback ? register.ownerOf(fallback.id) : ''
         var self = this
         this.directExpandNotes.forEach(function(note) {
            var notation = note && register.get(note.notationId)
            var owner = notation ? register.ownerOf(notation.id) : ''
            if (!notation || (note.ownerId && note.ownerId !== owner)) {
               note.notationId = fallbackId
               note.ownerId = fallbackOwner
               note.equivalentId = ''
            } else {
               note.ownerId = owner
               self.ensureDirectExpandNoteEquivalent(note)
            }
         })
      },
      reconcileNotationSelections(snapshot, result, action) {
         var available = register.map(function (entry) { return entry.id });
         var selected = snapshot && snapshot.currentNotationId || this.currentNotationId;
         if (action === 'upload' && result.change && result.change.main.added.length) {
            selected = result.change.main.added[0].id;
         } else if (!register.get(selected)) {
            var oldOrder = snapshot && snapshot.mainOrder || [];
            var oldIndex = oldOrder.indexOf(selected);
            var replacement = '';
            if (oldIndex >= 0) {
               for (var nextIndex = oldIndex + 1; nextIndex < oldOrder.length; nextIndex++) {
                  if (register.get(oldOrder[nextIndex])) {
                     replacement = oldOrder[nextIndex];
                     break;
                  }
               }
               if (!replacement) {
                  for (var previousIndex = oldIndex - 1; previousIndex >= 0; previousIndex--) {
                     if (register.get(oldOrder[previousIndex])) {
                        replacement = oldOrder[previousIndex];
                        break;
                     }
                  }
               }
            }
            selected = replacement || available[0] || '';
         }

         this.suppressSelectionWatch = true;
         this.currentNotationId = selected;
         if (!analysis_register.get(this.currentAnalysisId)) this.currentAnalysisId = '';
         var first = available[0] || '';
         if (!register.get(this.toolsNotation)) this.toolsNotation = first;
         if (!register.get(this.toolsDiffA)) this.toolsDiffA = first;
         if (!register.get(this.toolsDiffB)) this.toolsDiffB = available[1] || first;
         if (!register.get(this.toolsExpandNotation)) this.toolsExpandNotation = first;
         this.reconcileDirectExpandNotes(first);
         this.initSheets();
         this.saveSettings();
         this.$nextTick(() => { this.suppressSelectionWatch = false; });
      },
      applyLocalFileChange(result, action, snapshot) {
         if (!result) return;
         var ownerId = result.file.id;
         var change = result.change;
         if (!change) {
            this.notationVersion++;
            if (action === 'delete') {
               this.clearEquivalentStateForIds(result.file.knownMainIds || [], ownerId);
               this.purgeOwnerData(ownerId);
               this.reconcileNotationSelections(snapshot, result, action);
               this.saveAnalysis();
            }
            return;
         }
         var resetAnalysis = action === 'save' || action === 'replace-upload' ||
            (action === 'enable' && result.sourceChanged);

         if (action === 'delete') {
            this.clearEquivalentStateForIds(
               (result.file.knownMainIds || []).concat(change.main.removed.map(function(entry) { return entry.id })),
               ownerId
            );
         } else if (resetAnalysis) {
            var addedIds = new Set(change.main.added.map(function(entry) { return entry.id }));
            var previousMainIds = result.previous && result.previous.manifest &&
               Array.isArray(result.previous.manifest.main)
               ? result.previous.manifest.main
               : change.main.removed.map(function(entry) { return entry.id });
            this.clearEquivalentStateForIds(previousMainIds
               .filter(function(id) { return !addedIds.has(id) }), ownerId);
         }

         for (var i = 0; i < change.main.removed.length; i++) {
            delete this.datasets[change.main.removed[i].id];
         }
         if (action === 'delete') this.purgeOwnerData(ownerId);
         else if (resetAnalysis) this.clearOwnerAnalysis(ownerId);

         for (var j = 0; j < change.main.initialData.length; j++) {
            var prepared = change.main.initialData[j];
            this.datasets[prepared.id] = init_dataset(prepared.notation, prepared.items);
            this.notationRevisions[prepared.id] = (this.notationRevisions[prepared.id] || 0) + 1;
         }
         if (action === 'enable' && !result.sourceChanged) {
            for (var k = 0; k < change.main.added.length; k++) {
               try {
                  this.restoreNotationAnalysis(change.main.added[k].id, ownerId);
               } catch (error) {
                  console.warn('Restore analysis: notation "' + change.main.added[k].id + '" failed', error);
               }
            }
         }
         if (this.currentAnalysisId && change.analysis.removed.some(entry => entry.id === this.currentAnalysisId)) {
            this.show_fs_dialog = false;
            this.analysis_fs_target = undefined;
         }
         this.notationVersion++;
         this.reconcileNotationSelections(snapshot, result, action);
         this.saveAnalysis();
      },
      localFileRetainedCount(file) {
         var active = new Set((file.manifest && file.manifest.main) || []);
         var count = 0;
         var self = this;
         ;(file.knownMainIds || []).forEach(function (id) {
            if (active.has(id)) return;
            var key = self.dataKeyForId(id, file.id);
            var archived = self.analysisArchive[key];
            var sheets = self.allNoteSheets[key];
            if ((archived && archived.items && archived.items.length) ||
                (sheets && sheets.some(function (sheet) { return !!sheet.text; }))) count++;
         });
         return count;
      },
      // ===== Auto-save analysis =====
      dataKeyForId(id, ownerId) {
         var owner = ownerId || register.ownerOf(id) || '__builtin__';
         return owner + '::' + id;
      },
      serializeDataset(notationId) {
         var dataset = this.datasets[notationId];
         if (!dataset) return [];
         var notation = register.get(notationId);
         var self = this;
         var items = [];
         var walk = function (node) {
            for (var i = node.subitems.length - 1; i >= 0; i--) walk(node.subitems[i]);
            var saveAnalysis = node.analysis !== undefined;
            var saveHidden = self.autoSaveHidden && node.hide_child;
            if (saveAnalysis || saveHidden) {
               var item = serializeArchivedExpression(notation, node.expr);
               if (item.expr === undefined && typeof item.display !== 'string') return;
               if (saveAnalysis) item.analysis = node.analysis;
               if (saveHidden) item.hide = true;
               items.push(item);
            }
         };
         walk(dataset);
         return items;
      },
      stashNotationData(notationId, ownerId) {
         if (!notationId) return;
         var owner = ownerId || register.ownerOf(notationId) || '__builtin__';
         var key = this.dataKeyForId(notationId, owner);
         if (this.datasets[notationId]) {
            var localFile = owner !== '@notation-explorer/builtin' && window.localNotationManager
               ? window.localNotationManager.getFile(owner)
               : null;
            this.analysisArchive[key] = {
               ownerId: owner,
               notationId: notationId,
               items: this.serializeDataset(notationId),
               sourceRevision: localFile ? localFile.loadedRevision : null,
            };
         }
         if (notationId === this.currentNotationId) this.allNoteSheets[key] = this.noteSheets;
      },
      serializeAnalysis() {
         var self = this;
         if (this.currentNotationId) {
            var currentOwner = register.ownerOf(this.currentNotationId) || '__builtin__';
            this.allNoteSheets[this.dataKeyForId(this.currentNotationId, currentOwner)] = this.noteSheets;
         }
         register.forEach(function (notation) {
            self.stashNotationData(notation.id, register.ownerOf(notation.id));
         });
         return {
            version: 4,
            savedAt: Date.now(),
            notations: this.analysisArchive,
            noteSheets: this.allNoteSheets,
         };
      },
      saveAnalysis() {
         try {
            var data = this.serializeAnalysis();
            localStorage.setItem('ne-analysis', JSON.stringify(data));
            this.lastSaveTime = Date.now();
         } catch (e) {
            console.warn('Auto-save failed:', e);
         }
      },
      loadAnalysis() {
         var self = this;
         var raw, data;
         try {
            raw = localStorage.getItem('ne-analysis');
            if (!raw) return;
            data = JSON.parse(raw);
         } catch (e) {
            console.warn('Load analysis: parse failed', e);
            return;
         }
         if (!data || !data.notations) return;
         var version = data.version || 1;
         self.analysisArchive = Object.create(null);
         self.allNoteSheets = Object.create(null);

         if (version >= 3) {
            var legacyNCpSKey = BUILTIN_NOTATION_OWNER + '::' + N_CPS_GENERATOR_ID;
            var currentNCpSKey = BUILTIN_NOTATION_OWNER + '::2-cps';
            Object.keys(data.notations || {}).forEach(function (key) {
               if (key === legacyNCpSKey) {
                  if (!data.notations[currentNCpSKey]) {
                     self.analysisArchive[currentNCpSKey] = Object.assign(
                        {},
                        data.notations[key],
                        { notationId: '2-cps' }
                     );
                  }
                  return;
               }
               self.analysisArchive[key] = data.notations[key];
            });
            Object.keys(data.noteSheets || {}).forEach(function (key) {
               if (key === legacyNCpSKey && data.noteSheets[currentNCpSKey] !== undefined) return;
               var targetKey = key === legacyNCpSKey ? currentNCpSKey : key;
               if (self.allNoteSheets[targetKey] === undefined) {
                  self.allNoteSheets[targetKey] = data.noteSheets[key];
               }
            });
         } else {
            var legacyNotations = Array.isArray(data.notations) ? data.notations : [];
            for (var li = 0; li < legacyNotations.length; li++) {
               var legacy = legacyNotations[li];
               var legacyNotationId = legacy.notationId === N_CPS_GENERATOR_ID
                  ? '2-cps' : legacy.notationId;
               var active = register.get(legacyNotationId);
               var legacyOwner = active ? register.ownerOf(active.id) : '__builtin__';
               self.analysisArchive[self.dataKeyForId(legacyNotationId, legacyOwner)] = {
                  ownerId: legacyOwner,
                  notationId: legacyNotationId,
                  items: legacy.items || [],
                  legacyVersion: version,
               };
            }
            if (version >= 2 && data.noteSheets) {
               Object.keys(data.noteSheets).forEach(function (id) {
                  var noteId = id === N_CPS_GENERATOR_ID ? '2-cps' : id;
                  var owner = register.ownerOf(noteId) || '__builtin__';
                  self.allNoteSheets[self.dataKeyForId(noteId, owner)] = data.noteSheets[id];
               });
            } else if (data.noteSheets && self.currentNotationId) {
               self.allNoteSheets[self.dataKeyForId(self.currentNotationId)] = data.noteSheets;
            }
         }

         self.initSheets();
         var activeEntries = Object.keys(self.analysisArchive);
         for (var t = 0; t < activeEntries.length; t++) {
            try {
               var nd = self.analysisArchive[activeEntries[t]];
               var notation = register.get(nd.notationId);
               var notationOwner = notation && register.ownerOf(notation.id);
               if (notation && self.dataKeyForId(notation.id, notationOwner) !== activeEntries[t]) continue;
               if (!notation || !nd.items || nd.items.length === 0) continue;
               if (notationOwner !== '@notation-explorer/builtin') {
                  var localFile = window.localNotationManager && window.localNotationManager.getFile(notationOwner);
                  if (!localFile || nd.sourceRevision !== localFile.loadedRevision) {
                     delete self.analysisArchive[activeEntries[t]];
                     continue;
                  }
               }
               var analysisList;
               if ((nd.legacyVersion || version) >= 2) {
                   analysisList = nd.items.map(function (item) {
                      var expr = restoreArchivedExpression(notation, item);
                      if (expr === undefined) return null;
                      var analysis = Object.prototype.hasOwnProperty.call(item, 'analysis')
                         ? item.analysis : undefined;
                      return [expr, analysis, item.hide ? true : undefined];
                   }).filter(function (x) { return x !== null; });
               } else {
                  analysisList = nd.items.map(function (entry) {
                     var expr = safeFromDisplay(notation, entry[0]);
                     if (expr === undefined) return null;
                     return [expr, entry[1], entry[2]];
                  }).filter(function (x) { return x !== null; });
               }
               if (analysisList.length === 0) continue;
               import_analysis(self.datasets[notation.id], analysisList, notation,
                  self.use_alternative, false, self.length_limit);
            } catch (e) {
               console.warn('Load analysis: notation[' + t + '] failed', e);
            }
         }
         self.lastSaveTime = data.savedAt || Date.now();
      },
      startAutoSave() {
         if (this.saveTimerId) {
            clearInterval(this.saveTimerId);
            clearInterval(this._labelTimerId);
         }
         var self = this;
         // ensure lastSaveTime is always set so the indicator renders
         self.lastSaveTime = Date.now();
         self.saveAnalysis();
         this.saveTimerId = setInterval(function () {
            self.saveAnalysis();
         }, Math.max(this.autoSaveInterval, 10) * 1000);
         // update label every second
         this._labelTimerId = setInterval(function () {
            self.saveLabelTick++;
         }, 1000);
      },
      alert(msg) {
         window.alert(msg);
      },
      reset_list() {
         if (this.currentNotation.id) this.datasets[this.currentNotationId] = init_dataset(this.currentNotation)
      },
      export_xlsx() {
         let result = [];
         var displaySpec = this.resolveNotationDisplay(
            this.currentNotation,
            this.requestedEquivalentId(this.currentNotationId)
         )

         let find_result = (node) => {
            for (let i = node.subitems.length - 1; i >= 0; i--) {
               let child = node.subitems[i];
               find_result(child)
            }

            let text = node.analysis
            if (text !== undefined) {
               if (root.export_hide && node.hide_child) {
                  result.push([displaySpec.plain(node.expr), text, 'true'])
               } else {
                  result.push([displaySpec.plain(node.expr), text])
               }
            }
         }

         find_result(root.currentDataset)

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
         const notation = this.currentNotation
         const displaySpec = this.resolveNotationDisplay(
            notation,
            this.requestedEquivalentId(notation.id)
         )
         const targetDataset = this.currentDataset
         const targetDataKey = this.dataKeyForId(notation.id)
         const useAlternative = this.use_alternative

         let file = event.target.files[0];
         if (!file) return;

         const reader = new FileReader();

         reader.onload = function (e) {
            // FileReader completes asynchronously. Do not import through a stale
            // notation object after its local file was replaced or unloaded.
            if (register.get(notation.id) !== notation || root.datasets[notation.id] !== targetDataset) return

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
                  let expr = safeFromResolvedDisplay(displaySpec, expr_str)
                  if (expr === undefined) continue
                  let hidden = (row[2] || '').trim() === 'true'
                  objects.push([expr, analysis, hidden]);
               }
            }

            import_analysis(targetDataset, objects, notation, useAlternative)

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
               root.allNoteSheets[targetDataKey] = sheets;
               if (root.currentNotationId === notation.id && root.currentDataset === targetDataset) {
                  root.noteSheets = sheets;
                  root.currentSheet = 0;
               }
            }
         };

         reader.onerror = function () {
         };

         reader.readAsArrayBuffer(file);

         event.target.value = '';
      },
      find_notation() {
         let notation = this.currentNotation
         let displayed_expr = this.$refs.navigate_input.value
         let displaySpec = this.resolveNotationDisplay(
            notation,
            this.requestedEquivalentId(notation.id)
         )
         let expr = safeFromResolvedDisplay(displaySpec, displayed_expr)
         if (expr === undefined) return;
         import_analysis(this.currentDataset, [[expr]], notation, this.use_alternative, true)
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
         let notation = analysis_register.get(this.currentAnalysisId);
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
         try {
            localStorage.setItem('ne-config', JSON.stringify({
               darkMode: this.darkMode,
               lang: this.lang,
               displayMode: this.displayMode,
               equivActive: this.equivActive,
               equivHideOriginal: this.equivHideOriginal,
               latexCommands: this.latexCommands,
               analysisLatexPreview: this.analysisLatexPreview,
               analysisLatexInline: this.analysisLatexInline,
               analysisInputVisible: this.analysisInputVisible,
               analysisInputWidth: this.analysisInputWidth,
               generatorState: this.generatorState,
               diagramFollow: this.diagram_follow,
               autoScroll: this.auto_scroll,
               exportHide: this.export_hide,
               useAlt: this.use_alternative,
               diagramScale: this.diagram_scale,
               tier: this.tier,
               lengthLimit: this.length_limit,
               fsShown: this.FS_shown,
               analysisId: this.currentAnalysisId,
               mainId: this.currentNotationId,
               autoSaveInterval: this.autoSaveInterval,
               autoSaveHidden: this.autoSaveHidden,
            }))
         } catch (error) {
            console.warn('Save settings failed:', error)
         }
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
               function loadMap(value, type) {
                  var result = Object.create(null)
                  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
                  Object.keys(value).forEach(function (key) {
                     if (type === 'string' && typeof value[key] === 'string' && value[key]) {
                        result[key] = value[key]
                     } else if (type === 'boolean' && typeof value[key] === 'boolean') {
                        result[key] = value[key]
                     } else if (type === 'number' && Number.isSafeInteger(value[key])) {
                        result[key] = value[key]
                     }
                  })
                  return result
               }
               self.darkMode = getOr('darkMode', false)
               self.lang = getOr('lang', 'en')
               var displayMode = getOr('displayMode', 'html')
               self.displayMode = displayMode === 'latex' ? 'latex' : 'html'
               self.equivActive = loadMap(s.equivActive, 'string')
               self.equivHideOriginal = loadMap(s.equivHideOriginal, 'boolean')
               self.latexCommands = typeof s.latexCommands === 'string' ? s.latexCommands : ''
               self.analysisLatexPreview = !!getOr('analysisLatexPreview', false)
               self.analysisLatexInline = !!getOr('analysisLatexInline', false)
                self.analysisInputVisible = !!getOr('analysisInputVisible', true)
                var inputWidth = Number(getOr('analysisInputWidth', 180))
                self.analysisInputWidth = Math.max(60, Math.min(600, Math.round(inputWidth || 180)))
                self.generatorState = loadMap(s.generatorState, 'number')
                Object.keys(self.generatorState).forEach(function(categoryId) {
                   var value = self.generatorState[categoryId]
                   var definition = generator_definition(categoryId)
                   if (!definition || value < definition.start ||
                       value > self.generatorMaximum(categoryId)) {
                      delete self.generatorState[categoryId]
                   }
                })
                self.restoreGeneratedNotations()
                self.equivActive = self.migrateEquivalentStateMap(self.equivActive)
                self.equivHideOriginal = self.migrateEquivalentStateMap(self.equivHideOriginal)
                self.diagram_follow = getOr('diagramFollow', false)
               self.auto_scroll = getOr('autoScroll', true)
               self.export_hide = getOr('exportHide', true)
               self.use_alternative = getOr('useAlt', true)
               self.diagram_scale = getOr('diagramScale', 0)
               self.tier = getOr('tier', 0)
               self.length_limit = getOr('lengthLimit', 20)
               self.FS_shown = getOr('fsShown', 3)
               var analysisId = getOr('analysisId', '')
               if (!analysisId && Number.isInteger(s.analysisIdx) && analysis_register[s.analysisIdx]) {
                  analysisId = analysis_register[s.analysisIdx].id
               }
               self.currentAnalysisId = analysis_register.get(analysisId) ? analysisId : ''
               var mainId = getOr('mainId', self.currentNotationId)
               if (mainId === N_CPS_GENERATOR_ID) mainId = '2-cps'
               if (register.get(mainId)) self.currentNotationId = mainId
               self.autoSaveInterval = getOr('autoSaveInterval', 60)
               self.autoSaveHidden = getOr('autoSaveHidden', false)
            }
         } catch (e) {
            console.warn('Load settings failed:', e)
         }
         this.loadPos()
         document.documentElement.classList.toggle('dark', this.darkMode)
      },
      resetSettings() {
         var self = this
         generator_category_ids().forEach(function(categoryId) {
               var definition = generator_definition(categoryId)
               if (!definition) return
               while (self.generatorCurrent(categoryId) > definition.initial) {
                  var before = self.generatorCurrent(categoryId)
                  self.decrementGenerator(categoryId)
                  if (self.generatorCurrent(categoryId) >= before) break
               }
               while (self.generatorCurrent(categoryId) < definition.initial) {
                  var previous = self.generatorCurrent(categoryId)
                  self.incrementGenerator(categoryId)
                  if (self.generatorCurrent(categoryId) <= previous) break
               }
         })
         this.generatorState = Object.create(null)
         this.darkMode = false
         this.lang = 'en'
         this.displayMode = 'html'
         this.equivActive = Object.create(null)
         this.equivHideOriginal = Object.create(null)
         this.latexCommands = ''
         this.analysisLatexPreview = false
         this.analysisLatexInline = false
         this.analysisInputVisible = true
         this.analysisInputWidth = 180
         this.diagram_follow = false
         this.auto_scroll = true
         this.export_hide = true
         this.use_alternative = true
         this.diagram_scale = 0
         this.tier = 0
         this.length_limit = 20
         this.FS_shown = 3
         this.currentAnalysisId = ''
         this.autoSaveInterval = 60
         this.autoSaveHidden = false
         this.saveSettings()
      },

      // ===== 规律总结便利贴（每个记号独立） =====
      initSheets() {
         var id = this.currentNotationId;
         var key = id ? this.dataKeyForId(id) : '';
         if (key && this.allNoteSheets[key]) {
            this.noteSheets = this.allNoteSheets[key];
         } else {
            this.noteSheets = [{ name: 'Sheet2', text: '' }];
            if (key) this.allNoteSheets[key] = this.noteSheets;
         }
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

      // ===== 无穷降链检测 =====
      runInfChain() {
         var self = this;
         var id = self.toolsNotation;
         var notation = register.get(id);
         if (!notation) { self.toolsOutput = 'Notation not found'; return; }
         var display = notation.display || function (x) { return JSON.stringify(x); };
         var results = window.debugTools.detectInfChain(notation, self.toolsOpts);
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
         self.toolsOutput = lines.join('\n');
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
         self.toolsOutput = lines.join('\n');
         console.log('=== DFS Inf Chain Detection (All) ===');
         console.log(lines.join('\n'));
      },
      // ---- 直接展开 ----
      directExpansionOutput(request) {
         var notation = register.get(request.notationId)
         if (!notation) return 'Notation not found'
         var exprStr = String(request.expression === undefined ? '' : request.expression).trim()
         if (!exprStr) return 'Please enter an expression'

         var displaySpec
         try {
            displaySpec = this.resolveNotationDisplay(notation, request.equivalentId || undefined)
         } catch (error) {
            return 'Display error: ' + error.message
         }

         var expr
         if (exprStr === 'Limit' || exprStr === 'Infinity' || exprStr === '\u221e') {
            expr = Infinity
         } else if (displaySpec.isEquivalent) {
            if (typeof displaySpec.fromDisplay !== 'function' &&
               typeof displaySpec.fromDisplayAlter !== 'function') {
               return 'Parse error: selected representation cannot parse input'
            }
            expr = safeFromResolvedDisplay(displaySpec, exprStr)
            if (expr === undefined) return 'Parse error: invalid expression'
         } else {
            try {
               if (typeof notation.fromDisplay === 'function') expr = notation.fromDisplay(exprStr)
               else expr = JSON.parse(exprStr)
            } catch (error) {
               return 'Parse error: ' + error.message
            }
         }

         var display = displaySpec.plain || function (value) { return JSON.stringify(value) }
         var lines = ['Notation: ' + notation.name + ' (' + notation.id + ')']
         try {
            lines.push('Expression: ' + display(expr))
         } catch (error) {
            return 'Display error: ' + error.message
         }
         lines.push('')

         var startValue = request.startN
         var startMissing = startValue === null || startValue === undefined ||
            (typeof startValue === 'string' && startValue.trim() === '')
         var nStart = startMissing ? NaN : Number(startValue)
         var count = Number(request.count)
         if (!Number.isSafeInteger(nStart) || nStart < 0) {
            return 'Start n must be a non-negative safe integer'
         }
         if (!Number.isSafeInteger(count) || count < 1 || count > DIRECT_EXPAND_MAX_COUNT) {
            return 'Count must be an integer from 1 to ' + DIRECT_EXPAND_MAX_COUNT
         }
         if (nStart > Number.MAX_SAFE_INTEGER - count + 1) {
            return 'Fundamental-sequence index exceeds the safe integer range'
         }
         for (var offset = 0; offset < count; offset++) {
            var i = nStart + offset
            try {
               var result = notation.FS(expr, i)
               var displayResult = display(result)
               lines.push('FS(' + i + ') = ' + displayResult)
            } catch (error) {
               lines.push('FS(' + i + ') = Error: ' + error.message)
            }
         }
         return lines.join('\n')
      },
      runExpand() {
         this.toolsOutput = this.directExpansionOutput({
            notationId: this.toolsExpandNotation,
            equivalentId: this.toolsExpandEquiv,
            expression: this.toolsExpandExpr,
            startN: this.toolsExpandN,
            count: this.toolsExpandCount,
         })
         console.log('=== Direct Expansion ===')
         console.log(this.toolsOutput)
      },
      runDirectExpandNote(note) {
         if (!note) return
         note.output = this.directExpansionOutput(note)
         console.log('=== Direct Expansion #' + note.id + ' ===')
         console.log(note.output)
      },
      directExpandViewport() {
         return {
            width: Math.max(0, Number(window.innerWidth) || 1024),
            height: Math.max(0, Number(window.innerHeight) || 768),
         }
      },
      directExpandClamp(value, minimum, maximum) {
         maximum = Math.max(minimum, maximum)
         return Math.min(maximum, Math.max(minimum, Number(value) || 0))
      },
      clampDirectExpandNote(note) {
         if (!note) return
         var viewport = this.directExpandViewport()
         var maxWidth = Math.max(160, viewport.width - 16)
         var maxHeight = Math.max(180, viewport.height - 16)
         var minWidth = Math.min(300, maxWidth)
         var minHeight = Math.min(260, maxHeight)
         note.width = this.directExpandClamp(note.width, minWidth, maxWidth)
         note.height = this.directExpandClamp(note.height, minHeight, maxHeight)
         note.x = this.directExpandClamp(note.x, 8, viewport.width - note.width - 8)
         note.y = this.directExpandClamp(note.y, 8, viewport.height - note.height - 8)
      },
      clampDirectExpandNotes() {
         var self = this
         this.directExpandNotes.forEach(function(note) { self.clampDirectExpandNote(note) })
         this.arrangeDirectExpandSingleColumn()
      },
      arrangeDirectExpandSingleColumn() {
         var viewport = this.directExpandViewport()
         var width = Math.min(400, Math.max(160, viewport.width - 16))
         var columns = Math.max(1, Math.floor(
            (viewport.width - 16 + 12) / (width + 12)
         ))
         if (columns !== 1) return
         var self = this
         this.directExpandNotes.slice().sort(function(a, b) {
            return a.z - b.z || a.id - b.id
         }).forEach(function(note, index) {
            note.x = 8
            note.y = 56 + index * 44
            self.clampDirectExpandNote(note)
         })
      },
      createDirectExpandNote() {
         var viewport = this.directExpandViewport()
         var notation = register.get(this.currentNotationId) || register[0]
         var width = Math.min(400, Math.max(160, viewport.width - 16))
         var height = Math.min(400, Math.max(180, viewport.height - 16))
         var gap = 12
         var margin = 8
         var columns = Math.max(1, Math.floor(
            (viewport.width - margin * 2 + gap) / (width + gap)
         ))
         var usedSlots = new Set(this.directExpandNotes.map(function(note) { return note.slot }))
         var slot = 0
         while (usedSlots.has(slot)) slot++
         var column = slot % columns
         var layer = Math.floor(slot / columns)
         var note = {
            id: this.directExpandNoteSequence++,
            slot: slot,
            notationId: notation ? notation.id : '',
            ownerId: notation ? register.ownerOf(notation.id) : '',
            equivalentId: notation && notation.id === this.currentNotationId ? this.currentEquivalentId : '',
            expression: '',
            startN: 0,
            count: 1,
            output: '',
            x: margin + column * (width + gap),
            y: 56 + layer * 44,
            width: width,
            height: height,
            z: 0,
         }
         this.ensureDirectExpandNoteEquivalent(note)
         this.clampDirectExpandNote(note)
         this.directExpandNotes.push(note)
         this.focusDirectExpandNote(note)
         if (!this._directExpandReturnFocus) this._directExpandReturnFocus = new Map()
         if (typeof document !== 'undefined' && document.activeElement) {
            this._directExpandReturnFocus.set(note.id, document.activeElement)
         }
         this.$nextTick(function() {
            if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return
            var input = document.querySelector(
               '[data-direct-expand-note-id="' + note.id + '"] [data-direct-expand-expression]'
            )
            if (input && typeof input.focus === 'function') input.focus()
         })
         return note
      },
      closeDirectExpandNote(noteId) {
         if (this.directExpandPointer && this.directExpandPointer.noteId === noteId) {
            this.endDirectExpandPointer()
         }
         var index = this.directExpandNotes.findIndex(function(note) { return note.id === noteId })
         if (index < 0) return
         this.directExpandNotes.splice(index, 1)
         this.arrangeDirectExpandSingleColumn()
         var returnFocus = this._directExpandReturnFocus && this._directExpandReturnFocus.get(noteId)
         if (this._directExpandReturnFocus) this._directExpandReturnFocus.delete(noteId)
         this.$nextTick(function() {
            if (returnFocus && typeof returnFocus.focus === 'function' && returnFocus.isConnected !== false) {
               returnFocus.focus()
            }
         })
      },
      focusDirectExpandNote(note) {
         if (!note) return
         var previousTop = this.directExpandNotes.reduce(function(top, item) {
            return !top || item.z > top.z ? item : top
         }, null)
         if (this.directExpandTopZ >= 600) {
            this.directExpandNotes.slice().sort(function(a, b) { return a.z - b.z })
               .forEach(function(item, index) { item.z = index + 1 })
            this.directExpandTopZ = this.directExpandNotes.length
         }
         this.directExpandTopZ++
         note.z = this.directExpandTopZ
         if (previousTop && previousTop !== note) this.arrangeDirectExpandSingleColumn()
      },
      directExpandNoteStyle(note) {
         return {
            left: note.x + 'px',
            top: note.y + 'px',
            width: note.width + 'px',
            height: note.height + 'px',
            zIndex: 1100 + note.z,
         }
      },
      handleDirectExpandWindowKeydown(note, mode, event) {
         if (!note || !event || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) < 0) {
            return
         }
         var step = event.shiftKey ? 40 : 10
         var horizontal = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
         var vertical = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
         this.focusDirectExpandNote(note)
         if (mode === 'resize') {
            note.width += horizontal
            note.height += vertical
         } else {
            note.x += horizontal
            note.y += vertical
         }
         this.clampDirectExpandNote(note)
         if (typeof event.preventDefault === 'function') event.preventDefault()
      },
      startDirectExpandPointer(note, mode, event) {
         if (!note || !event || (event.pointerType === 'mouse' && event.button !== 0)) return
         if (this.directExpandPointer) this.endDirectExpandPointer()
         this.focusDirectExpandNote(note)
         this.directExpandPointer = {
            noteId: note.id,
            mode: mode,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            x: note.x,
            y: note.y,
            width: note.width,
            height: note.height,
            captureTarget: event.currentTarget,
         }
         if (event.currentTarget && typeof event.currentTarget.setPointerCapture === 'function') {
            try { event.currentTarget.setPointerCapture(event.pointerId) } catch (error) { }
         }
         if (document && typeof document.addEventListener === 'function') {
            document.addEventListener('pointermove', this.onDirectExpandPointerMove)
            document.addEventListener('pointerup', this.endDirectExpandPointer)
            document.addEventListener('pointercancel', this.endDirectExpandPointer)
         }
      },
      onDirectExpandPointerMove(event) {
         var pointer = this.directExpandPointer
         if (!pointer || (event && event.pointerId !== undefined &&
            pointer.pointerId !== undefined && event.pointerId !== pointer.pointerId)) return
         var note = this.directExpandNotes.find(function(item) { return item.id === pointer.noteId })
         if (!note) {
            this.endDirectExpandPointer(event)
            return
         }
         if (event && typeof event.preventDefault === 'function') event.preventDefault()
         var deltaX = event.clientX - pointer.startX
         var deltaY = event.clientY - pointer.startY
         if (pointer.mode === 'drag') {
            note.x = pointer.x + deltaX
            note.y = pointer.y + deltaY
         } else {
            note.width = pointer.width + deltaX
            note.height = pointer.height + deltaY
         }
         this.clampDirectExpandNote(note)
      },
      endDirectExpandPointer(event) {
         var pointer = this.directExpandPointer
         if (event && pointer && event.pointerId !== undefined &&
            pointer.pointerId !== undefined && event.pointerId !== pointer.pointerId) return
         this.directExpandPointer = null
         if (pointer && pointer.captureTarget &&
            typeof pointer.captureTarget.releasePointerCapture === 'function') {
            try { pointer.captureTarget.releasePointerCapture(pointer.pointerId) } catch (error) { }
         }
         if (document && typeof document.removeEventListener === 'function') {
            document.removeEventListener('pointermove', this.onDirectExpandPointerMove)
            document.removeEventListener('pointerup', this.endDirectExpandPointer)
            document.removeEventListener('pointercancel', this.endDirectExpandPointer)
         }
      },

      runDiff() {
         var self = this;
         var nA = register.get(self.toolsDiffA);
         var nB = register.get(self.toolsDiffB);
         if (!nA || !nB) { self.toolsOutput = 'Notation not found'; return; }
         function safeDisplay(fn, x) {
            if (x === null || x === undefined) return 'null';
            if (Array.isArray(x) && x.length === 0) return '[]';
            var s;
            try { s = fn(x); } catch (e) { s = JSON.stringify(x); }
            return s || JSON.stringify(x);
         }
         var displayA = function (x) { return safeDisplay(nA.display || JSON.stringify, x); };
         var displayB = function (x) { return safeDisplay(nB.display || JSON.stringify, x); };
         var result = window.debugTools.dfsDiff(nA, nB, self.toolsDiffOpts);
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
         self.toolsOutput = lines.join('\n');
         console.log('=== DFS Diff ===');
         console.log(lines.join('\n'));
       },
      // ---- PPS 翻译 ----
      runPPS() {
         var self = this;
         var raw = self.toolsPPSInput.trim();
         if (!raw) { self.toolsOutput = 'Please enter a PPS sequence'; return; }

         // ===== 核心转换函数 =====
         function trim_trailing_zeros(lst) {
            for (var i = lst.length - 1; i >= 0; i--) {
               if (lst[i] !== 0) return lst.slice(0, i + 1);
            }
            return [];
         }
         function arrayLessThan(a, b) {
            for (var i = 0; i < Math.min(a.length, b.length); i++) {
               if (a[i] < b[i]) return true;
               if (a[i] > b[i]) return false;
            }
            return a.length < b.length;
         }
         function std(L) {
            var i = 0, l = [];
            if (L.length < 2) return L;
            while (i < L.length) {
               var j = i; i++;
               while (i < L.length && L[i] > L[0]) i++;
               var k = std(L.slice(j + 1, i));
               while (l.length && l[l.length - 1] < k) l.pop();
               l.push(k);
            }
            var s = [];
            for (var sub of l) { s.push(L[0]); s = s.concat(sub); }
            return s;
         }
         function tran(L) {
            var i = 0, l = [];
            if (L.length < 1) return String(L.length);
            while (i < L.length) {
               var j = i; i++;
               while (i < L.length && L[i] > L[0]) i++;
               var k = tran(L.slice(j + 1, i));
               if (k === '0') l.push('1');
               else if (k === '1') l.push('\u03c9');
               else l.push('\u03c9^{' + k + '}');
            }
            var s = ''; i = 0;
            while (i < l.length) {
               var j = i;
               while (i < l.length && l[i] === l[j]) i++;
               if (i - j > 1) {
                  if (l[j] === '1') s += String(i - j);
                  else s += l[j] + '*' + String(i - j);
               } else { s += l[j]; }
               if (i < l.length) s += '+';
            }
            return s;
         }
         function ppsm(l, l4, j, b) {
            if (b === 0) {
               if (j > 1) {
                  var range1 = Array.from({ length: j + 2 }, function(_, idx) { return idx; });
                  var range2 = Array.from({ length: j - 1 }, function(_, idx) { return j - idx; });
                  l = l.concat(range1, range2);
               } else { l = l.concat([0, 1, 2, 1, 2]); }
            } else {
               l = trim_trailing_zeros(l);
               var range1 = Array.from({ length: j + 2 }, function(_, idx) { return b - 1 + idx; });
               var range2 = Array.from({ length: j - 1 }, function(_, idx) { return j + b - 1 - idx; });
               l = l.concat(range1, range2);
            }
            return l;
         }
         function pps(L) {
            if (L.length < 2 || L[1] === 0) return Array(L.length).fill(0);
            var l = [], i = 2, l3 = [], l4 = [], j = 0, b = 0;
            if (arrayLessThan(L, [0, 1, 0, 1])) {
               l = [0, 1];
               for (var idx = 2; idx < L.length; idx++) {
                  if (L[idx] === 0) l.push(0);
                  else if (L[idx] === idx) l.push(0, 1, 2);
                  else l.push(1);
               }
               return std(l);
            } else {
               l = []; var m = []; j = 0; b = 0;
               for (var idx = 0; idx < L.length; idx++) {
                  var x = L[idx];
                  if (x === 0) { l.push(0); m.push(0); }
                  else if (L[x - 1] === 0) {
                     if (j !== 0) { l = ppsm(l, l4, j, b); j = 0; }
                     if (x === idx) {
                        if (idx === 1 || idx + 2 >= L.length || L[idx + 2] < L[idx]) {
                           l.push(0, 1, 2); m.push(0);
                        } else {
                           var l2 = L.slice(idx - 1);
                           var l3 = l2.map(function(val, idx2) {
                              if (val === 0) return 0;
                              else return val - L[idx] + 1;
                           });
                           l = l.concat(pps(l3));
                           break;
                        }
                     } else if (L[x] !== 0) {
                        l = trim_trailing_zeros(l);
                        l.push(m[x] + 1); m.push(m[x] + 1);
                     } else { l.push(1); m.push(1); }
                  } else {
                     if (x === 2) b = 0;
                     else b = m[x - 1] + 1;
                     l4 = l[x - 1]; m.push(b); j++;
                  }
               }
               if (j !== 0) {
                  l = ppsm(l, l4, j, b); j = 0;
                  var trailingZeros = 0;
                  for (var k = L.length - 1; k >= 0; k--) {
                     if (L[k] === 0) trailingZeros++;
                     else break;
                  }
                  for (var k = 0; k < trailingZeros; k++) l.push(0);
                  return std(l);
               }
               return std(l);
            }
         }

         // ===== 解析输入并执行 =====
         var parts = raw.split(/\s*,\s*/);
         var nums = [];
         for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p === '') continue;
            var v = Number(p);
            if (isNaN(v) || !Number.isInteger(v) || v < 0) {
               self.toolsOutput = 'Invalid number: "' + p + '"';
               return;
            }
            nums.push(v);
         }
         if (nums.length === 0) { self.toolsOutput = 'Please enter a PPS sequence'; return; }

         try {
            var lines = [];
            lines.push('PPS Input: [' + nums.join(', ') + ']');
            lines.push('');

            // 特殊处理 ε₀
            var isEpsilonZero = nums.length === 6 && nums[0] === 0 && nums[1] === 1 && nums[2] === 0 && nums[3] === 2 && nums[4] === 0 && nums[5] === 3;
            if (isEpsilonZero) {
               lines.push('Special case: 0,1,0,2,0,3 \u2192 \u03b5\u2080');
               lines.push('');
               lines.push('Cantor Normal Form: \u03b5\u2080');
            } else {
               var prssRaw = pps(nums);
               if (!prssRaw || !Array.isArray(prssRaw)) {
                  lines.push('Error: pps() returned invalid result');
               } else {
                  var prssStd = std(prssRaw);
                  lines.push('PrSS Standard: [' + prssStd.join(', ') + ']');
                  lines.push('');
                  var cnfStr = tran(prssStd);
                  lines.push('Cantor Normal Form: ' + cnfStr);
               }
            }

            self.toolsOutput = lines.join('\n');
            console.log('=== PPS Translation ===');
            console.log(lines.join('\n'));
         } catch (err) {
            self.toolsOutput = 'Error during translation: ' + (err.message || String(err));
            console.error(err);
         }
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
      this.loadAnalysis()
      this.startAutoSave()
      if (typeof window.addEventListener === 'function') {
         window.addEventListener('resize', this.clampDirectExpandNotes)
      }
      this.$nextTick(() => { this.isHydrating = false; });
   },
   beforeUnmount() {
      this.endDirectExpandPointer()
      if (typeof window.removeEventListener === 'function') {
         window.removeEventListener('resize', this.clampDirectExpandNotes)
      }
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

function isJsonStableExpression(value, seen) {
   if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
   if (typeof value === 'number') return isFinite(value) && !Object.is(value, -0);
   if (typeof value !== 'object') return false;
   var proto = Object.getPrototypeOf(value);
   if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return false;
   seen = seen || new WeakSet();
   if (seen.has(value)) return false;
   seen.add(value);
   var keys = Object.keys(value);
   for (var index = 0; index < keys.length; index++) {
      if (!isJsonStableExpression(value[keys[index]], seen)) return false;
   }
   seen.delete(value);
   return true;
}

function isLegacyArchivedExpression(value, seen) {
   if (value === null) return false;
   if (typeof value === 'string' || typeof value === 'boolean') return true;
   if (typeof value === 'number') return isFinite(value);
   if (typeof value !== 'object') return false;
   seen = seen || new WeakSet();
   if (seen.has(value)) return false;
   seen.add(value);
   var keys = Object.keys(value);
   for (var index = 0; index < keys.length; index++) {
      if (!isLegacyArchivedExpression(value[keys[index]], seen)) return false;
   }
   seen.delete(value);
   return true;
}

function serializeArchivedExpression(notation, expr) {
   var item = {};
   if (isJsonStableExpression(expr)) {
      item.expr = expr;
      item.exprFormat = 'json';
   }
   if (notation && typeof notation.display === 'function') {
      try {
         var displayed = notation.display(expr);
         if (displayed !== undefined && displayed !== null) item.display = String(displayed);
      } catch (error) {
         // A JSON-safe expression can still be retained without a display fallback.
      }
   }
   return item;
}

function restoreArchivedExpression(notation, item) {
   if (!item || typeof item !== 'object') return undefined;
   var hasExpr = Object.prototype.hasOwnProperty.call(item, 'expr');
   if (item.exprFormat === 'json' && hasExpr && isJsonStableExpression(item.expr)) return item.expr;
   if (item.exprFormat === undefined && hasExpr && isLegacyArchivedExpression(item.expr)) return item.expr;
   if (typeof item.display === 'string') return safeFromDisplay(notation, item.display);
   return undefined;
}

function safeFromResolvedDisplay(displaySpec, str) {
   if (displaySpec && typeof displaySpec.fromDisplay === 'function') try {
      return displaySpec.fromDisplay(str)
   } catch (error) {
      // Try the display-specific alternate parser.
   }
   if (displaySpec && typeof displaySpec.fromDisplayAlter === 'function') try {
      return displaySpec.fromDisplayAlter(str)
   } catch (error) {
      // Invalid input is reported by the caller.
   }
   return undefined
}

const workerAssetVersion = window.NotationLoader && window.NotationLoader.ASSET_VERSION
const worker = new Worker(
   "js/diagram/Diagram.js" + (workerAssetVersion ? "?v=" + encodeURIComponent(workerAssetVersion) : "")
)

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

function import_analysis(root_item, analysis_list, notation, use_short, auto_focus, lengthLimit) {
   if (lengthLimit === undefined) lengthLimit = 20;
   let item = last_child(root_item)
   let index = 0
   let cmp

   let outerGuard = 0;
   while (index < analysis_list.length) {
      if (++outerGuard > 50000) { console.warn('import_analysis: outer guard limit'); return; }
      let guard = 0;
      while ((cmp = notation.compare(item.expr, analysis_list[index][0])) !== 0) {
         if (++guard > 50000) { console.warn('import_analysis: guard limit reached'); return; }
         if (cmp > 0) {
            if (item.mark > lengthLimit) return
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
            new_bound = root.currentDataset.subitems[item.index + 1].expr
         }
      }

      // Children and generated siblings must stay strictly above their insertion bound.
      if (notation.compare(result_expr, new_bound) <= 0) return

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

app.component('notation-expression', {
   props: ['notation', 'expression', 'includeOriginal'],
   computed: {
      isLatex() {
         return this.$root.displayMode === 'latex'
      },
      displaySpec() {
         return this.$root.resolveNotationDisplay(
            this.notation,
            this.$root.requestedEquivalentId(this.notation && this.notation.id)
         )
      },
      primaryDisplaySpec() {
         return this.$root.resolveNotationDisplay(this.notation)
      },
      showOriginal() {
         return !!this.includeOriginal && this.displaySpec.isEquivalent &&
            !this.$root.equivalentHideOriginalFor(this.notation.id)
      },
      renderedExpression() {
         return this.renderDisplay(this.displaySpec)
      },
      renderedOriginalExpression() {
         return this.showOriginal ? this.renderDisplay(this.primaryDisplaySpec) : ''
      },
   },
   methods: {
      renderDisplay(displaySpec) {
         if (!displaySpec) return ''
         try {
            if (this.isLatex && window.NotationLatex) {
               return window.NotationLatex.renderLatex(
                  displaySpec.latex(this.expression),
                  this.$root.latexCommands
               )
            }
            return displaySpec.html(this.expression)
         } catch (error) {
            if (this.isLatex) {
               try { return displaySpec.html(this.expression) } catch (ignored) { }
            }
            var message = error && error.message ? error.message : String(error)
            return window.NotationLatex
               ? '<span class="latex-render-error">' + window.NotationLatex.escapeHtml(message) + '</span>'
               : ''
         }
      },
   },
   template: `<span class="notation-expression" :class="{ 'is-latex': isLatex }"
      ><span class="notation-expression__active" v-html="renderedExpression"></span><span
      v-if="showOriginal" class="notation-expression__original"><span
      class="notation-expression__separator" aria-hidden="true"> = </span><span
      v-html="renderedOriginalExpression"></span></span></span>`
})

app.component('notation-list-item', {
      props: ['item', 'notationId'],
      data: () => ({
         shownFS: []
         , tooltip: false
         , tooltipX: {}
         , inputVisited: false
         , inputResizeObserver: null
      }),
      computed: {
         notation() { return register.get(this.notationId) || {} },
         analysisSource() {
            var value = this.item.analysis
            return String(value === undefined || value === null ? '' : value)
         },
         showInlineAnalysisLatex() {
            return this.$root.analysisLatexPreview &&
               this.$root.analysisLatexInline &&
               this.$root.analysisInputVisible &&
               this.analysisSource.trim().length > 0
         },
         renderedInlineAnalysis() {
            return this.showInlineAnalysisLatex
               ? this.$root.renderAnalysisLatex(this.analysisSource)
               : ''
         },
      },
      methods: {
         renderTooltipAnalysis(comment) {
            var source = String(comment || '')
            if (!source) return ''
            var asLatex = this.$root.analysisLatexPreview
            var rendered = window.NotationLatex
               ? window.NotationLatex.renderAnalysisText(source, asLatex, this.$root.latexCommands)
               : source
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
            return '; ' + rendered
         },
         // 注意：this.FS 和 this.FSalter 已废弃（由 expand_item 内部接管），保留以兼容引用
         onmouseenter(event) {
            if (typeof this.notation.drawDiagram === 'function' && root.diagram_follow) {
               var equivalentId = root.effectiveEquivalentId(this.notation)
               let diagram = this.notation.drawDiagram(this.item.expr, equivalentId || undefined)
               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.id + ':' + equivalentId + ':' + this.notation.display(this.item.expr)
                  })
                  root.showCanvas = true
                  root.pCanvas.x = event.clientX + 100
                  root.pCanvas.y = event.clientY + 15
               } else {
                  root.showCanvas = false
               }
            }

            if (!this.notation.able(this.item.expr)) return;
            var FS = get_FS(this.notation, root.use_alternative)
            var nmax = root.FS_shown
            // Build a lookup map: all analysis items by their expr
            var commentMap = {}
            var scanItems = function (items) {
               for (var si = 0; si < items.length; si++) {
                  var it = items[si]
                  if (it.analysis) commentMap['' + it.expr] = it.analysis
                  if (it.subitems && it.subitems.length) scanItems(it.subitems)
               }
            }
            scanItems(root.currentDataset.subitems)
            var terms = []
            for (let n = 0; n <= nmax; ++n) {
               var fsExpr = FS(this.item.expr, n)
               var childComment = commentMap['' + fsExpr] || ''
               terms.push({ index: n, expr: fsExpr, comment: childComment })
            }
            this.shownFS = terms
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

            if (this.notation.drawDiagram != null && !root.analysisLatexPreview) {
               var equivalentId = root.effectiveEquivalentId(this.notation)
               let diagram = this.notation.drawDiagram(this.item.expr, equivalentId || undefined)

               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.id + ':' + equivalentId + ':' + this.notation.display(this.item.expr)
                  })

                  root.showCanvas = true

                  let rect = this.$refs.input.getBoundingClientRect()
                  root.pCanvas.x = rect.left + 5 + root.pCanvasModifier.x
                  root.pCanvas.y = 105 + rect.bottom - rect.top + root.pCanvasModifier.y
               } else {
                  root.showCanvas = false
               }
            } else if (root.analysisLatexPreview) {
               root.showCanvas = false
            }
            this.updateAnalysisLatexPreview(target.value, target)
         },
         onblur() {
            root.showCanvas = false
            root.hideAnalysisLatexPreview()
         },
         onAnalysisInput(event) {
            this.updateAnalysisLatexPreview(event.target.value, event.target)
         },
         updateAnalysisLatexPreview(value, input) {
            if (!root.analysisLatexPreview || !root.analysisInputVisible || !value || !input) {
               root.hideAnalysisLatexPreview()
               return
            }
            var rect = input.getBoundingClientRect()
            root.showAnalysisLatexPreview(value, rect.left, rect.bottom + 8)
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
               root.hideAnalysisLatexPreview()
            } else if (event.key.toLowerCase() === 's' && event.ctrlKey) {
               event.preventDefault()

               root.export_xlsx()
            } else if (event.key.toLowerCase() === 'h' && event.ctrlKey) {
               event.preventDefault()

               this.item.hide_child = !this.item.hide_child
            } else if (event.key.toLowerCase() === 'e' && event.ctrlKey) {
               event.preventDefault()

               let notation = analysis_register.get(root.currentAnalysisId);
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

         var inputWrap = this.$refs.analysisInputWrap
         if (inputWrap && typeof ResizeObserver === 'function') {
            this.inputResizeObserver = new ResizeObserver(function () {
               if (!root.analysisInputVisible || !document.body.contains(inputWrap)) return
               var width = Math.round(inputWrap.getBoundingClientRect().width)
               var inlineWidth = Math.round(parseFloat(inputWrap.style.width) || 0)
               if (inlineWidth !== width) return
               if (width >= 60) root.setAnalysisInputWidth(width)
            })
            this.inputResizeObserver.observe(inputWrap)
         }

         if (this.item.auto_focus) {
            this.$refs.input.focus({ preventScroll: true })
            this.item.auto_focus = false
         }
      },
      unmounted() {
         if (this.inputResizeObserver) this.inputResizeObserver.disconnect()
         node_map.delete(this.item.path)
      },
      template: `<li><div class="shown-item" :class="{analyzed: item.analysis !== undefined}" @mouseenter="onmouseenter" @mousemove="onmousemove" @mouseleave="onmouseleave" @mousedown="onmousedown">
            <input type="checkbox" v-model="item.hide_child" @mousedown.stop>
            <span ref="analysisInputWrap" class="analysis-input-resize"
               :class="{
                  'is-hidden': !$root.analysisInputVisible,
                  'has-inline-latex': showInlineAnalysisLatex
               }"
               :style="{ width: $root.analysisInputWidth + 'px' }" @mousedown.stop>
               <input type="text" @mousedown.stop @keydown.stop="onkeydown" @input="onAnalysisInput"
                  ref="input" @focus="onfocus" @blur="onblur" v-model="item.analysis"/>
               <span v-if="showInlineAnalysisLatex" class="analysis-inline-latex" aria-hidden="true"
                  v-html="renderedInlineAnalysis"></span>
            </span>
            <notation-expression :notation="notation" :expression="item.expr"
               :include-original="true"></notation-expression>
            <div class="tooltip" v-if="tooltip" :style="tooltipX" @mousedown.stop>
            <notation-expression :notation="notation" :expression="item.expr"></notation-expression> fundamental sequence:
            <div class="tooltip-fs">
               <div v-for="term in shownFS" :key="term.index" class="tooltip-row">
                  <span class="tooltip-index">{{ term.index }}:</span>
                  <notation-expression class="tooltip-expr" :notation="notation"
                     :expression="term.expr"></notation-expression>
                  <span class="tooltip-cmnt"
                     v-html="renderTooltipAnalysis(term.comment)"></span>
               </div>
            </div>
         </div></div>
         <ul v-if="!item.hide_child">
             <notation-list-item v-for="subitem in item.subitems" :item="subitem" :notation-id="notationId"
                :key="subitem.path"></notation-list-item>
          </ul>
       </li>`
   })

app.component('notation-tree', {
   props: ['subitems', 'notationId'],
   template: `<ul class="nowrap"><notation-list-item v-for="subitem in subitems" :item="subitem"
      :notation-id="notationId" :key="subitem.path"></notation-list-item></ul>`,
})

app.component('local-notation-manager', window.LocalNotationManagerComponent)

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
