;(function (root, factory) {
   var api = typeof module === 'object' && module.exports
      ? require('./standalone-export.js')
      : root.StandaloneExport
   var component = factory(root, api)
   if (typeof module === 'object' && module.exports) module.exports = component
   else root.StandaloneExportComponent = component
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, StandaloneExport) {
   'use strict'

   var COPY = {
      en: {
         title: 'Export standalone application',
         description: 'Bundle selected notation files into one HTML file that opens directly from disk.',
         search: 'Search notation files',
         selectAll: 'Select all',
         clear: 'Clear',
         selected: 'selected',
         estimated: 'Estimated size',
         appTitle: 'Application title',
         fileName: 'HTML file name',
         includeData: 'Include current analysis, expansion trees, notes, settings, and generator state',
         export: 'Export HTML',
         none: 'No matching notation files.',
         empty: 'Select at least one notation file.',
         builtIn: 'Built-in',
         local: 'Local files',
         ready: 'Standalone HTML downloaded.',
         dependencies: 'automatic dependencies',
         fixedCdn: 'Vue, KaTeX, and XLSX load from fixed-version jsDelivr URLs when the exported file starts.',
      },
      zh: {
         title: '导出独立应用',
         description: '把选中的记号文件打包成一个可直接从磁盘打开的 HTML。',
         search: '搜索记号文件',
         selectAll: '全选',
         clear: '清空',
         selected: '个已选',
         estimated: '预计体积',
         appTitle: '应用标题',
         fileName: 'HTML 文件名',
         includeData: '包含当前分析、展开树、笔记、显示设置与生成类编号',
         export: '导出 HTML',
         none: '没有匹配的记号文件。',
         empty: '请至少选择一个记号文件。',
         builtIn: '内置记号',
         local: '本地文件',
         ready: '独立 HTML 已下载。',
         dependencies: '个自动依赖',
         fixedCdn: '导出文件启动时会从固定版本的 jsDelivr 地址加载 Vue、KaTeX 和 XLSX。',
      },
   }

   function folder(key, label, depth) {
      return { kind: 'folder', key: key, label: label, depth: depth, children: [], searchText: label.toLowerCase() }
   }

   function getOrCreate(children, key, label, depth) {
      for (var index = 0; index < children.length; index++) {
         if (children[index].key === key) return children[index]
      }
      var node = folder(key, label, depth)
      children.push(node)
      return node
   }

   function buildTree(records, localLabel, builtInLabel) {
      var roots = []
      var localRoot
      ;(records || []).forEach(function (record) {
         var children = roots
         var parts
         if (record.kind === 'local') {
            if (!localRoot) {
               localRoot = folder('standalone-folder:@local', localLabel, 0)
               roots.push(localRoot)
            }
            children = localRoot.children
            parts = []
         } else {
            parts = (record.directories || []).slice()
            if (!parts.length) parts = [builtInLabel]
         }
         var path = []
         parts.forEach(function (part, depth) {
            path.push(part)
            var node = getOrCreate(
               children,
               'standalone-folder:' + record.kind + ':' + path.join('/'),
               part,
               depth
            )
            children = node.children
         })
         children.push({
            kind: 'file',
            key: record.key,
            label: record.fileName,
            record: record,
            searchText: record.searchText || [record.path, record.fileName].join(' ').toLowerCase(),
         })
      })
      return roots
   }

   function filterNode(node, query, ancestorMatches) {
      var matches = ancestorMatches || node.searchText.indexOf(query) !== -1
      if (node.kind === 'file') return matches ? node : null
      var children = node.children.map(function (child) {
         return filterNode(child, query, matches)
      }).filter(Boolean)
      if (!children.length) return null
      return Object.assign({}, node, { children: children })
   }

   function filteredTree(tree, search) {
      var query = String(search || '').trim().toLowerCase()
      if (!query) return tree
      return tree.map(function (node) { return filterNode(node, query, false) }).filter(Boolean)
   }

   function flatten(tree, expanded, search) {
      var rows = []
      var searching = !!String(search || '').trim()
      function visit(node, depth) {
         if (node.kind === 'file') {
            rows.push(Object.assign({}, node, { depth: depth }))
            return
         }
         var open = searching || !!expanded[node.key]
         rows.push(Object.assign({}, node, {
            depth: depth,
            children: undefined,
            expanded: open,
            fileKeys: descendantKeys(node),
         }))
         if (open) node.children.forEach(function (child) { visit(child, depth + 1) })
      }
      tree.forEach(function (node) { visit(node, 0) })
      return rows
   }

   function descendantKeys(node) {
      if (node.kind === 'file') return [node.key]
      return node.children.reduce(function (result, child) {
         return result.concat(descendantKeys(child))
      }, [])
   }

   function formatBytes(value) {
      value = Number(value) || 0
      if (value < 1024) return value + ' B'
      if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
      return (value / 1024 / 1024).toFixed(2) + ' MB'
   }

   return {
      name: 'StandaloneExport',
      template: `
         <section class="ne-standalone-export">
            <header class="ne-standalone-export__header">
               <div>
                  <h3>{{ copy.title }}</h3>
                  <p>{{ copy.description }}</p>
               </div>
            </header>
            <div class="ne-standalone-export__toolbar">
               <input type="search" v-model="search" :placeholder="copy.search"
                  class="ne-standalone-export__search" />
               <button type="button" class="ne-local-button ne-local-button--secondary"
                  :disabled="busy || !records.length" @click="selectAll">{{ copy.selectAll }}</button>
               <button type="button" class="ne-local-button ne-local-button--secondary"
                  :disabled="busy || !selectedCount" @click="clearSelection">{{ copy.clear }}</button>
            </div>
            <div class="ne-standalone-export__tree" role="tree" :aria-label="copy.title">
               <div v-for="row in rows" :key="row.key" class="ne-standalone-export__row"
                  :class="{ 'is-folder': row.kind === 'folder', 'is-file': row.kind === 'file' }"
                  :style="{ paddingLeft: (10 + row.depth * 16) + 'px' }">
                  <button v-if="row.kind === 'folder'" type="button" class="ne-standalone-export__folder"
                     :aria-expanded="String(row.expanded)" @click="toggleFolder(row)">
                     <span class="ns-tree-chevron" :class="{ 'is-expanded': row.expanded }" aria-hidden="true"></span>
                     <span>{{ row.label }}</span>
                  </button>
                  <label v-else class="ne-standalone-export__file">
                     <input type="checkbox" :checked="!!selected[row.key]" :disabled="busy"
                        @change="setSelected(row.key, $event.target.checked)" />
                     <span>{{ row.label }}</span>
                     <small>{{ row.record.mainIds.length + row.record.analysisIds.length }}</small>
                  </label>
                  <label v-if="row.kind === 'folder'" class="ne-standalone-export__folder-check"
                     @click.stop>
                     <input type="checkbox" :checked="folderChecked(row)" :indeterminate="folderPartial(row)"
                        :disabled="busy" @change="setFolderSelected(row, $event.target.checked)" />
                  </label>
               </div>
               <p v-if="!rows.length" class="ne-standalone-export__empty">{{ copy.none }}</p>
            </div>
            <div class="ne-standalone-export__summary">
               <span>{{ selectedCount }} {{ copy.selected }}</span>
               <span>{{ copy.estimated }}: {{ estimatedSize }}</span>
            </div>
            <div class="ne-standalone-export__fields">
               <label>
                  <span>{{ copy.appTitle }}</span>
                  <input type="text" v-model="title" maxlength="120" :disabled="busy" />
               </label>
               <label>
                  <span>{{ copy.fileName }}</span>
                  <input type="text" v-model="fileName" maxlength="180" :disabled="busy" />
               </label>
               <label class="ne-standalone-export__snapshot">
                  <input type="checkbox" v-model="includeData" :disabled="busy" />
                  <span>{{ copy.includeData }}</span>
               </label>
            </div>
            <p class="ne-standalone-export__cdn-note">{{ copy.fixedCdn }}</p>
            <div v-if="busy || progress" class="ne-standalone-export__progress" role="status" aria-live="polite">
               <div><span :style="{ width: Math.round(progress * 100) + '%' }"></span></div>
               <p>{{ status }}</p>
            </div>
            <p v-if="error" class="ne-standalone-export__error" role="alert">{{ error }}</p>
            <div class="ne-standalone-export__actions">
               <button type="button" class="ne-local-button ne-local-button--primary"
                  :disabled="busy || !selectedCount" @click="exportHtml">{{ copy.export }}</button>
               <span v-if="lastSize">{{ formatBytes(lastSize) }}<template v-if="dependencyCount"> · {{ dependencyCount }} {{ copy.dependencies }}</template></span>
            </div>
         </section>
      `,
      data: function () {
         return {
            records: [],
            selected: Object.create(null),
            expanded: Object.create(null),
            search: '',
            title: StandaloneExport ? StandaloneExport.DEFAULT_TITLE : 'Notation Explorer',
            fileName: StandaloneExport ? StandaloneExport.DEFAULT_FILE_NAME : 'notation-explorer-standalone.html',
            includeData: false,
            busy: false,
            progress: 0,
            status: '',
            error: '',
            lastSize: 0,
            dependencyCount: 0,
         }
      },
      computed: {
         copy: function () {
            var lang = this.$root && this.$root.lang === 'zh' ? 'zh' : 'en'
            return COPY[lang]
         },
         tree: function () {
            return buildTree(this.records, this.copy.local, this.copy.builtIn)
         },
         rows: function () {
            return flatten(filteredTree(this.tree, this.search), this.expanded, this.search)
         },
         selectedRecords: function () {
            var selected = this.selected
            return this.records.filter(function (record) { return !!selected[record.key] })
         },
         selectedCount: function () { return this.selectedRecords.length },
         estimatedSize: function () {
            return formatBytes(StandaloneExport.estimateSelectionBytes(this.selectedRecords))
         },
      },
      mounted: function () {
         this.refreshRecords()
      },
      methods: {
         refreshRecords: function () {
            if (!StandaloneExport) return
            this.records = StandaloneExport.collectSelectionRecords().map(function (record) {
               return Object.assign({}, record, {
                  searchText: StandaloneExport.recordSearchText(record, root.register, root.analysis_register),
               })
            })
            var currentId = this.$root && this.$root.currentNotationId
            var currentOwner = currentId && root.register && root.register.ownerOf(currentId)
            var current = this.records.find(function (record) {
               if (record.ownerId !== currentOwner) return false
               return (record.currentMainIds || record.mainIds || []).indexOf(currentId) !== -1
            })
            if (!current) current = this.records[0]
            if (current) {
               this.$set ? this.$set(this.selected, current.key, true) : (this.selected[current.key] = true)
               this.expandAncestors(current)
            }
         },
         expandAncestors: function (record) {
            var path = []
            var parts = record.kind === 'local' ? ['@local'] : (record.directories || [])
            var self = this
            if (record.kind === 'local') self.expanded['standalone-folder:@local'] = true
            parts.forEach(function (part) {
               path.push(part)
               self.expanded['standalone-folder:' + record.kind + ':' + path.join('/')] = true
            })
         },
         toggleFolder: function (row) {
            this.expanded[row.key] = !row.expanded
         },
         setSelected: function (key, value) {
            this.selected[key] = !!value
         },
         selectAll: function () {
            var selected = Object.create(null)
            this.records.forEach(function (record) { selected[record.key] = true })
            this.selected = selected
         },
         clearSelection: function () {
            this.selected = Object.create(null)
         },
         folderChecked: function (row) {
            return row.fileKeys.length > 0 && row.fileKeys.every(function (key) { return !!this.selected[key] }, this)
         },
         folderPartial: function (row) {
            var count = row.fileKeys.filter(function (key) { return !!this.selected[key] }, this).length
            return count > 0 && count < row.fileKeys.length
         },
         setFolderSelected: function (row, value) {
            var self = this
            row.fileKeys.forEach(function (key) { self.selected[key] = !!value })
         },
         normalizedFileName: function () {
            var name = String(this.fileName || '').trim() || StandaloneExport.DEFAULT_FILE_NAME
            name = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
            if (!/\.html?$/i.test(name)) name += '.html'
            return name
         },
         snapshot: function () {
            if (!this.includeData) return {}
            if (this.$root) {
               if (typeof this.$root.flushAnalysisSave === 'function') this.$root.flushAnalysisSave()
               if (typeof this.$root.saveSettings === 'function') this.$root.saveSettings()
               if (typeof this.$root.savePos === 'function') this.$root.savePos()
            }
            var storage = root.NotationStorage || root.localStorage
            var result = {}
            ;['ne-analysis', 'ne-config', 'ne-summary-pos'].forEach(function (key) {
               try {
                  var value = storage && storage.getItem(key)
                  if (typeof value === 'string') result[key] = value
               } catch (error) {
                  // The build can still continue without an unavailable snapshot key.
               }
            })
            return result
         },
         download: function (name, html) {
            var blob = new Blob([html], { type: 'text/html;charset=utf-8' })
            var url = URL.createObjectURL(blob)
            var anchor = document.createElement('a')
            anchor.href = url
            anchor.download = name
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
         },
         exportHtml: async function () {
            if (!this.selectedCount || this.busy) return
            this.busy = true
            this.error = ''
            this.status = ''
            this.progress = 0.01
            this.lastSize = 0
            this.dependencyCount = 0
            try {
               var self = this
               var result = await StandaloneExport.buildStandalone({
                  selectedRecords: this.selectedRecords,
                  availableRecords: this.records,
                  title: this.title,
                  includeData: this.includeData,
                  snapshot: this.snapshot(),
                  onProgress: function (event) {
                     self.progress = event.progress
                     self.status = event.label
                  },
               })
               this.download(this.normalizedFileName(), result.html)
               this.lastSize = result.estimatedBytes
               this.dependencyCount = result.dependencies.length
               this.status = this.copy.ready
               this.progress = 1
            } catch (error) {
               this.error = error && (error.stack || error.message) || String(error)
               this.status = ''
               this.progress = 0
            } finally {
               this.busy = false
            }
         },
         formatBytes: formatBytes,
      },
   }
})
