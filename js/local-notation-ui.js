;(function(root, factory) {
   var component = factory(root)

   if (typeof module === 'object' && module.exports) module.exports = component
   if (root) root.LocalNotationManagerComponent = component
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
   'use strict'

   var TOKEN_CLASSES = {
      keyword: 'ne-editor-token ne-editor-token--keyword',
      literal: 'ne-editor-token ne-editor-token--literal',
      number: 'ne-editor-token ne-editor-token--number',
      string: 'ne-editor-token ne-editor-token--string',
      template: 'ne-editor-token ne-editor-token--template',
      comment: 'ne-editor-token ne-editor-token--comment',
   }

   var STRINGS = {
      en: {
         title: 'Local notation files',
         guide: 'Guide',
         guideTitle: 'Making a notation file',
         guideLoading: 'Loading the development guide...',
         guideLoadFailed: 'The development guide could not be loaded.',
         guideUnavailable: 'The documentation renderer is unavailable.',
         retry: 'Retry',
         closeGuide: 'Close guide',
         upload: 'Upload .js',
         newPrss: 'New PrSS',
         empty: 'No local notation files',
         enabled: 'Enabled',
         disabled: 'Disabled',
         loadError: 'Load error',
         unsaved: 'Unsaved',
         retained: 'Retained IDs',
         mainIds: 'Main',
         analysisIds: 'Analysis',
         noIds: 'No registered IDs',
         enableFile: 'Enable file',
         disableFile: 'Disable file',
         deleteFile: 'Delete file',
         fileName: 'File name',
         source: 'Source',
         save: 'Save',
         discard: 'Discard',
         download: 'Download',
         downloadDraft: 'Download draft',
         cancel: 'Cancel',
         continueAction: 'Continue',
         runFile: 'Trust and run',
         replace: 'Replace',
         remove: 'Delete',
         dirtyTitle: 'Unsaved changes',
         dirtyBody: 'Save or discard the current draft before continuing.',
         trustTitle: 'Run trusted local code?',
         trustBody: 'This JavaScript runs with the page privileges. Continue only if you trust its source.',
         replaceTitle: 'Replace local file?',
         replaceBody: 'A file with this name already exists. Its identity, enabled state, and list position will be kept.',
         deleteTitle: 'Delete local file?',
         deleteBody: 'This permanently deletes the source and all analysis text and note sheets owned by the file.',
         downloadTitle: 'Download unsaved draft?',
         downloadBody: 'Choose whether to save first or download the current draft without committing it.',
         uploaded: 'File uploaded.',
         uploadFailed: 'The upload was retained as a disabled file.',
         replaced: 'File replaced.',
         templateCreated: 'PrSS template created.',
         saved: 'File saved.',
         discarded: 'Draft discarded.',
         enabledNotice: 'File enabled.',
         disabledNotice: 'File disabled.',
         deletedNotice: 'File deleted.',
         invalidUpload: 'Choose a JavaScript file whose name ends in .js.',
         managerUnavailable: 'The local notation runtime is unavailable.',
         editorUnavailable: 'The notation editor engine is unavailable.',
         draftWriteFailed: 'The draft could not be persisted.',
         errorAt: 'Line {line}, column {column}',
         jumpToError: 'Go to error location',
         errorCode: 'Error',
         closeDialog: 'Close dialog',
      },
      zh: {
         title: '\u672c\u5730\u8bb0\u53f7\u6587\u4ef6',
         guide: '\u5f00\u53d1\u6307\u5357',
         guideTitle: '\u5982\u4f55\u5f00\u53d1\u4e00\u4e2a\u8bb0\u53f7\u6587\u4ef6',
         guideLoading: '\u6b63\u5728\u52a0\u8f7d\u5f00\u53d1\u6307\u5357...',
         guideLoadFailed: '\u65e0\u6cd5\u52a0\u8f7d\u5f00\u53d1\u6307\u5357\u3002',
         guideUnavailable: '\u6587\u6863\u6e32\u67d3\u5668\u4e0d\u53ef\u7528\u3002',
         retry: '\u91cd\u8bd5',
         closeGuide: '\u5173\u95ed\u5f00\u53d1\u6307\u5357',
         upload: '\u4e0a\u4f20 .js',
         newPrss: '\u65b0\u5efa PrSS',
         empty: '\u6682\u65e0\u672c\u5730\u8bb0\u53f7\u6587\u4ef6',
         enabled: '\u5df2\u542f\u7528',
         disabled: '\u5df2\u7981\u7528',
         loadError: '\u52a0\u8f7d\u9519\u8bef',
         unsaved: '\u672a\u4fdd\u5b58',
         retained: '\u5df2\u4fdd\u7559 ID',
         mainIds: '\u4e3b\u8bb0\u53f7',
         analysisIds: '\u5206\u6790\u8bb0\u53f7',
         noIds: '\u65e0\u5df2\u6ce8\u518c ID',
         enableFile: '\u542f\u7528\u6587\u4ef6',
         disableFile: '\u7981\u7528\u6587\u4ef6',
         deleteFile: '\u5220\u9664\u6587\u4ef6',
         fileName: '\u6587\u4ef6\u540d',
         source: '\u6e90\u7801',
         save: '\u4fdd\u5b58',
         discard: '\u653e\u5f03\u4fee\u6539',
         download: '\u4e0b\u8f7d',
         downloadDraft: '\u4e0b\u8f7d\u8349\u7a3f',
         cancel: '\u53d6\u6d88',
         continueAction: '\u7ee7\u7eed',
         runFile: '\u4fe1\u4efb\u5e76\u8fd0\u884c',
         replace: '\u66ff\u6362',
         remove: '\u5220\u9664',
         dirtyTitle: '\u5b58\u5728\u672a\u4fdd\u5b58\u4fee\u6539',
         dirtyBody: '\u7ee7\u7eed\u524d\u8bf7\u4fdd\u5b58\u6216\u653e\u5f03\u5f53\u524d\u8349\u7a3f\u3002',
         trustTitle: '\u8fd0\u884c\u53ef\u4fe1\u7684\u672c\u5730\u4ee3\u7801\uff1f',
         trustBody: '\u6b64 JavaScript \u5c06\u4ee5\u9875\u9762\u6743\u9650\u8fd0\u884c\u3002\u4ec5\u5728\u4fe1\u4efb\u5176\u6765\u6e90\u65f6\u7ee7\u7eed\u3002',
         replaceTitle: '\u66ff\u6362\u672c\u5730\u6587\u4ef6\uff1f',
         replaceBody: '\u5df2\u5b58\u5728\u540c\u540d\u6587\u4ef6\u3002\u66ff\u6362\u540e\u4fdd\u7559\u5176\u8eab\u4efd\u3001\u542f\u7528\u72b6\u6001\u548c\u5217\u8868\u4f4d\u7f6e\u3002',
         deleteTitle: '\u5220\u9664\u672c\u5730\u6587\u4ef6\uff1f',
         deleteBody: '\u6b64\u64cd\u4f5c\u5c06\u6c38\u4e45\u5220\u9664\u6e90\u7801\u53ca\u6587\u4ef6\u6240\u5c5e\u7684\u5206\u6790\u6587\u672c\u548c\u4fbf\u5229\u8d34\u3002',
         downloadTitle: '\u4e0b\u8f7d\u672a\u4fdd\u5b58\u8349\u7a3f\uff1f',
         downloadBody: '\u53ef\u5148\u4fdd\u5b58\uff0c\u6216\u76f4\u63a5\u4e0b\u8f7d\u5f53\u524d\u8349\u7a3f\u800c\u4e0d\u63d0\u4ea4\u3002',
         uploaded: '\u6587\u4ef6\u5df2\u4e0a\u4f20\u3002',
         uploadFailed: '\u4e0a\u4f20\u5185\u5bb9\u5df2\u4fdd\u7559\u4e3a\u7981\u7528\u6587\u4ef6\u3002',
         replaced: '\u6587\u4ef6\u5df2\u66ff\u6362\u3002',
         templateCreated: 'PrSS \u6a21\u677f\u5df2\u521b\u5efa\u3002',
         saved: '\u6587\u4ef6\u5df2\u4fdd\u5b58\u3002',
         discarded: '\u8349\u7a3f\u5df2\u653e\u5f03\u3002',
         enabledNotice: '\u6587\u4ef6\u5df2\u542f\u7528\u3002',
         disabledNotice: '\u6587\u4ef6\u5df2\u7981\u7528\u3002',
         deletedNotice: '\u6587\u4ef6\u5df2\u5220\u9664\u3002',
         invalidUpload: '\u8bf7\u9009\u62e9\u6587\u4ef6\u540d\u4ee5 .js \u7ed3\u5c3e\u7684 JavaScript \u6587\u4ef6\u3002',
         managerUnavailable: '\u672c\u5730\u8bb0\u53f7\u8fd0\u884c\u65f6\u4e0d\u53ef\u7528\u3002',
         editorUnavailable: '\u8bb0\u53f7\u7f16\u8f91\u5668\u5f15\u64ce\u4e0d\u53ef\u7528\u3002',
         draftWriteFailed: '\u65e0\u6cd5\u6301\u4e45\u5316\u8349\u7a3f\u3002',
         errorAt: '\u7b2c {line} \u884c\uff0c\u7b2c {column} \u5217',
         jumpToError: '\u8df3\u8f6c\u5230\u9519\u8bef\u4f4d\u7f6e',
         errorCode: '\u9519\u8bef',
         closeDialog: '\u5173\u95ed\u5bf9\u8bdd\u6846',
      },
   }

   function uniqueStrings(values) {
      var seen = new Set()
      return (values || []).filter(function(value) {
         if (typeof value !== 'string' || seen.has(value)) return false
         seen.add(value)
         return true
      })
   }

   function escapeHtml(value, engine) {
      if (engine && typeof engine.escapeHtml === 'function') return engine.escapeHtml(value)
      return String(value)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
   }

   function renderHighlightedSource(value, engine, bracket) {
      var source = String(value == null ? '' : value)
      if (!engine || typeof engine.tokenize !== 'function') return escapeHtml(source || ' ', engine)

      var marked = Object.create(null)
      if (bracket && bracket.index >= 0) {
         marked[bracket.index] = bracket.status === 'unmatched'
            ? 'ne-editor-bracket is-unmatched'
            : 'ne-editor-bracket is-origin'
      }
      if (bracket && bracket.matchIndex >= 0) {
         marked[bracket.matchIndex] = 'ne-editor-bracket is-match'
      }

      var html = engine.tokenize(source).map(function(token) {
         var inner = ''
         var plainStart = token.start
         for (var index = token.start; index < token.end; index++) {
            if (!marked[index]) continue
            inner += escapeHtml(source.slice(plainStart, index), engine)
            inner += '<span class="' + marked[index] + '">' + escapeHtml(source[index], engine) + '</span>'
            plainStart = index + 1
         }
         inner += escapeHtml(source.slice(plainStart, token.end), engine)
         var className = TOKEN_CLASSES[token.type]
         return className ? '<span class="' + className + '">' + inner + '</span>' : inner
      }).join('')

      if (!source || /(?:\r\n|\r|\n)$/.test(source)) html += ' '
      return html
   }

   function readFileText(file) {
      if (file && typeof file.text === 'function') return file.text()
      return new Promise(function(resolve, reject) {
         var reader = new FileReader()
         reader.onload = function() { resolve(String(reader.result || '')) }
         reader.onerror = function() { reject(reader.error || new Error('File read failed.')) }
         reader.readAsText(file)
      })
   }

   function offsetForLocation(source, line, column) {
      var targetLine = Math.max(1, Number(line) || 1)
      var targetColumn = Math.max(1, Number(column) || 1)
      var lines = String(source).split('\n')
      var offset = 0
      for (var index = 1; index < targetLine && index <= lines.length; index++) {
         offset += lines[index - 1].length + 1
      }
      var lineText = lines[Math.min(targetLine - 1, lines.length - 1)] || ''
      return Math.min(String(source).length, offset + Math.min(targetColumn - 1, lineText.length))
   }

   return {
      name: 'LocalNotationManager',

      template: `
         <section class="ne-local-manager" :aria-label="copy.title">
            <header class="ne-local-manager__header">
               <h4 class="ne-local-manager__title">{{ copy.title }}</h4>
               <div class="ne-local-toolbar">
                  <button ref="guideButton" type="button" class="ne-local-button ne-local-button--secondary"
                     @click="openGuide">
                     <span aria-hidden="true">&#128214;</span><span>{{ copy.guide }}</span>
                  </button>
                  <input ref="uploadInput" type="file" accept=".js,text/javascript,application/javascript"
                     class="ne-local-toolbar__file-input" @change="onUploadChange">
                  <button type="button" class="ne-local-button ne-local-button--secondary"
                     :disabled="busy" @click="openUploadPicker">
                     <span aria-hidden="true">&#8679;</span><span>{{ copy.upload }}</span>
                  </button>
                  <button type="button" class="ne-local-button ne-local-button--primary"
                     :disabled="busy" @click="createTemplate">
                     <span aria-hidden="true">+</span><span>{{ copy.newPrss }}</span>
                  </button>
               </div>
            </header>

            <div v-if="runtimeStorageError || operationError" class="ne-local-manager__alert" role="alert">
               {{ topErrorText }}
            </div>
            <div v-else-if="notice" class="ne-local-manager__notice" role="status">{{ notice }}</div>

            <div class="ne-local-workspace">
               <aside class="ne-local-workspace__sidebar">
                  <p v-if="files.length === 0" class="ne-local-file-list__empty">{{ copy.empty }}</p>
                  <ul v-else class="ne-local-file-list">
                     <li v-for="file in files" :key="file.id" class="ne-local-file"
                        :class="{ 'is-selected': file.id === selectedId, 'has-error': !!file.lastError }">
                        <label class="ne-local-file__toggle" :title="file.enabled ? copy.disableFile : copy.enableFile">
                           <input type="checkbox" :checked="!!file.enabled" :disabled="busy"
                              :aria-label="file.enabled ? copy.disableFile : copy.enableFile"
                              @change="toggleFile(file, $event)">
                        </label>
                        <button type="button" class="ne-local-file__select" @click="selectFile(file)" :disabled="busy">
                           <span class="ne-local-file__name">{{ file.name }}</span>
                           <span class="ne-local-file__status" :class="fileStatusClass(file)">{{ fileStatus(file) }}</span>
                           <span v-if="file.hasDraft" class="ne-local-file__badge is-draft">{{ copy.unsaved }}</span>
                           <span v-if="hasRetainedData(file)" class="ne-local-file__badge is-retained"
                              :title="retainedIds(file).join(', ')">{{ copy.retained }}</span>
                           <span class="ne-local-file__manifest" v-if="manifestIds(file, 'main').length">
                              {{ copy.mainIds }}: {{ manifestIds(file, 'main').join(', ') }}
                           </span>
                           <span class="ne-local-file__manifest" v-if="manifestIds(file, 'analysis').length">
                              {{ copy.analysisIds }}: {{ manifestIds(file, 'analysis').join(', ') }}
                           </span>
                           <span class="ne-local-file__manifest is-empty"
                              v-if="!manifestIds(file, 'main').length && !manifestIds(file, 'analysis').length">
                              {{ copy.noIds }}
                           </span>
                        </button>
                        <button type="button" class="ne-local-file__delete" :title="copy.deleteFile"
                           :aria-label="copy.deleteFile + ': ' + file.name" :disabled="busy" @click="deleteFile(file)">
                           &times;
                        </button>
                     </li>
                  </ul>
               </aside>

               <main class="ne-local-workspace__editor">
                  <div v-if="!selectedFile" class="ne-local-editor__empty">{{ copy.empty }}</div>
                  <template v-else>
                     <div class="ne-local-editor__header">
                        <label class="ne-local-editor__filename-label">
                           <span>{{ copy.fileName }}</span>
                           <input v-model="editorName" type="text" class="ne-local-editor__filename"
                              :disabled="busy" spellcheck="false" @input="onEditorChanged"
                              @keydown.ctrl.s.prevent.stop="saveSelected"
                              @keydown.meta.s.prevent.stop="saveSelected">
                        </label>
                        <span v-if="dirty" class="ne-local-editor__dirty">{{ copy.unsaved }}</span>
                        <div class="ne-local-editor__actions">
                           <button type="button" class="ne-local-button ne-local-button--primary"
                              :disabled="busy || !dirty" @click="saveSelected">{{ copy.save }}</button>
                           <button type="button" class="ne-local-button ne-local-button--secondary"
                              :disabled="busy || !dirty" @click="discardSelected">{{ copy.discard }}</button>
                           <button type="button" class="ne-local-button ne-local-button--secondary"
                              :disabled="busy" @click="downloadSelected">
                              <span aria-hidden="true">&#8595;</span><span>{{ copy.download }}</span>
                           </button>
                        </div>
                     </div>

                     <div class="ne-local-editor" :class="{ 'has-focus': editorFocused }">
                        <div ref="lineGutter" class="ne-local-editor__gutter" aria-hidden="true">
                           <span v-for="line in lineNumbers" :key="line"
                              :class="{ 'is-active': line === activeLine }">{{ line }}</span>
                        </div>
                        <div class="ne-local-editor__code">
                           <pre ref="highlightLayer" class="ne-local-editor__highlight"
                              aria-hidden="true" v-html="highlightedSource"></pre>
                           <textarea ref="sourceInput" v-model="editorSource" class="ne-local-editor__textarea"
                              :aria-label="copy.source" :disabled="busy" wrap="off" spellcheck="false"
                              autocomplete="off" autocapitalize="off" @input="onEditorInput"
                              @keydown="onEditorKeydown" @keyup="updateCaret" @click="updateCaret"
                              @select="updateCaret" @mouseup="updateCaret" @scroll="syncEditorScroll"
                              @focus="editorFocused = true; updateCaret($event)" @blur="editorFocused = false"></textarea>
                        </div>
                     </div>

                     <div v-if="selectedRuntimeError" class="ne-local-editor__error" role="alert">
                        <div class="ne-local-editor__error-message">
                           <strong>{{ selectedRuntimeError.code || copy.errorCode }}</strong>
                           <span>{{ selectedRuntimeError.message }}</span>
                        </div>
                        <button v-if="selectedRuntimeError.line" type="button" class="ne-local-editor__error-location"
                           :title="copy.jumpToError" @click="jumpToError(selectedRuntimeError)">
                           {{ errorLocation(selectedRuntimeError) }}
                        </button>
                     </div>
                     <div v-if="draftError" class="ne-local-editor__error" role="alert">
                        <strong>{{ copy.draftWriteFailed }}</strong>
                        <span>{{ draftError.message }}</span>
                     </div>
                  </template>
               </main>
            </div>

            <div v-if="guideOpen" class="ne-local-guide" role="presentation" @mousedown.self="closeGuide">
               <section ref="guideDialog" class="ne-local-guide__dialog" role="dialog" aria-modal="true"
                  :aria-labelledby="guideTitleId">
                  <header class="ne-local-guide__header">
                     <h4 :id="guideTitleId">{{ copy.guideTitle }}</h4>
                     <button type="button" class="ne-local-guide__close" :title="copy.closeGuide"
                        :aria-label="copy.closeGuide" @click="closeGuide">&times;</button>
                  </header>
                  <div class="ne-local-guide__body">
                     <p v-if="guideLoading" class="ne-local-guide__state" role="status">
                        {{ copy.guideLoading }}
                     </p>
                     <div v-else-if="guideError" class="ne-local-guide__state is-error" role="alert">
                        <p>{{ copy.guideLoadFailed }} {{ guideError }}</p>
                        <button type="button" class="ne-local-button ne-local-button--secondary"
                           @click="loadGuide">{{ copy.retry }}</button>
                     </div>
                     <article v-else class="ne-local-guide__article" v-html="guideHtml"></article>
                  </div>
               </section>
            </div>

            <div v-if="modal.open" class="ne-local-modal" role="presentation" @mousedown.self="cancelModal">
               <section class="ne-local-modal__dialog" role="dialog" aria-modal="true"
                  :aria-labelledby="modalTitleId" @keydown.esc.prevent.stop="cancelModal">
                  <header class="ne-local-modal__header">
                     <h4 :id="modalTitleId">{{ modal.title }}</h4>
                     <button type="button" class="ne-local-modal__close" :title="copy.closeDialog"
                        :aria-label="copy.closeDialog" @click="cancelModal">&times;</button>
                  </header>
                  <p class="ne-local-modal__body">{{ modal.body }}</p>
                  <ul v-if="modal.details.length" class="ne-local-modal__details">
                     <li v-for="(detail, index) in modal.details" :key="index">{{ detail }}</li>
                  </ul>
                  <footer class="ne-local-modal__actions">
                     <button v-for="choice in modal.choices" :key="choice.value" type="button"
                        class="ne-local-button" :class="'ne-local-button--' + choice.kind"
                        @click="resolveModal(choice.value)">{{ choice.label }}</button>
                  </footer>
               </section>
            </div>
         </section>
      `,

      data: function() {
         return {
            files: [],
            selectedId: '',
            editorName: '',
            editorSource: '',
            caretPosition: 0,
            editorFocused: false,
            busy: false,
            notice: '',
            operationError: null,
            draftError: null,
            draftTimer: null,
            guideOpen: false,
            guideLoading: false,
            guideError: '',
            guideHtml: '',
            guideTitleId: 'ne-local-guide-title-' + Math.random().toString(36).slice(2),
            modalResolver: null,
            modalPromise: null,
            modalTitleId: 'ne-local-modal-title-' + Math.random().toString(36).slice(2),
            modal: {
               open: false,
               title: '',
               body: '',
               details: [],
               choices: [],
            },
         }
      },

      computed: {
         copy: function() {
            var lang = this.$root && this.$root.lang === 'zh' ? 'zh' : 'en'
            return STRINGS[lang]
         },
         selectedFile: function() {
            var selectedId = this.selectedId
            return this.files.find(function(file) { return file.id === selectedId }) || null
         },
         dirty: function() {
            return !!this.selectedFile && (
               this.editorName !== this.selectedFile.name ||
               this.editorSource !== this.selectedFile.source
            )
         },
         editorEngine: function() {
            return root && root.NotationEditorEngine
         },
         bracketMatch: function() {
            if (!this.editorEngine || typeof this.editorEngine.findBracketMatch !== 'function') return null
            return this.editorEngine.findBracketMatch(this.editorSource, this.caretPosition)
         },
         highlightedSource: function() {
            return renderHighlightedSource(this.editorSource, this.editorEngine, this.bracketMatch)
         },
         lineNumbers: function() {
            if (this.editorEngine && typeof this.editorEngine.getLineNumbers === 'function') {
               return this.editorEngine.getLineNumbers(this.editorSource)
            }
            var count = (this.editorSource.match(/\r\n|\r|\n/g) || []).length + 1
            return Array.from({ length: count }, function(_, index) { return index + 1 })
         },
         activeLine: function() {
            var beforeCaret = this.editorSource.slice(0, Math.max(0, this.caretPosition))
            return (beforeCaret.match(/\r\n|\r|\n/g) || []).length + 1
         },
         runtimeStorageError: function() {
            var runtime = root && root.localNotationManager
            return runtime && runtime.storageError || null
         },
         topErrorText: function() {
            var error = this.operationError || this.runtimeStorageError
            if (!error) return ''
            return (error.code ? error.code + ': ' : '') + (error.message || String(error))
         },
         selectedRuntimeError: function() {
            return this.selectedFile && this.selectedFile.lastError || null
         },
      },

      created: function() {
         this.refreshFiles('', true)
      },

      mounted: function() {
         this._beforeUnload = this.onBeforeUnload.bind(this)
         window.addEventListener('beforeunload', this._beforeUnload)
         this._guideKeydown = this.onGuideDocumentKeydown.bind(this)
         if (root && root.document) {
            root.document.addEventListener('keydown', this._guideKeydown, true)
         }
      },

      beforeUnmount: function() {
         this.cancelDraftTimer()
         if (this.dirty) this.persistDraftNow()
         if (this._beforeUnload) window.removeEventListener('beforeunload', this._beforeUnload)
         if (this._guideKeydown && root && root.document) {
            root.document.removeEventListener('keydown', this._guideKeydown, true)
         }
         this.guideOpen = false
         if (this.modalResolver) this.resolveModal('cancel')
      },

      methods: {
         runtime: function() {
            var runtime = root && root.localNotationManager
            if (!runtime) throw new Error(this.copy.managerUnavailable)
            return runtime
         },

         guideDocumentUrl: function() {
            if (!root || !root.document || !root.document.baseURI) {
               throw new Error('Document base URL is unavailable.')
            }
            return new URL('docs/making-a-notation.md', root.document.baseURI).href
         },

         focusGuideDialog: function() {
            var dialog = this.$refs && this.$refs.guideDialog
            if (!dialog) return
            dialog.setAttribute('tabindex', '-1')
            dialog.focus()
         },

         guideFocusableElements: function(dialog) {
            if (!dialog || typeof dialog.querySelectorAll !== 'function') return []
            var selector = [
               'a[href]',
               'button:not([disabled])',
               'input:not([disabled])',
               'select:not([disabled])',
               'textarea:not([disabled])',
               '[tabindex]:not([tabindex="-1"])',
            ].join(',')
            return Array.prototype.filter.call(dialog.querySelectorAll(selector), function(element) {
               return element.getAttribute('aria-hidden') !== 'true'
            })
         },

         onGuideDocumentKeydown: function(event) {
            if (!this.guideOpen || !event) return
            if (event.key === 'Escape' || event.key === 'Esc') {
               event.preventDefault()
               event.stopPropagation()
               this.closeGuide()
               return
            }
            if (event.key !== 'Tab') return

            var dialog = this.$refs && this.$refs.guideDialog
            if (!dialog) return
            var focusable = this.guideFocusableElements(dialog)
            var active = root && root.document && root.document.activeElement
            var index = focusable.indexOf(active)
            var next

            if (!focusable.length) {
               next = dialog
            } else if (event.shiftKey && (active === dialog || index <= 0)) {
               next = focusable[focusable.length - 1]
            } else if (!event.shiftKey && (active === dialog || index < 0 || index === focusable.length - 1)) {
               next = focusable[0]
            }

            if (!next) return
            event.preventDefault()
            event.stopPropagation()
            next.focus()
         },

         openGuide: function() {
            this.guideOpen = true
            var component = this
            this.$nextTick(function() { component.focusGuideDialog() })
            if (this.guideHtml || this.guideLoading) return Promise.resolve(this.guideHtml)
            return this.loadGuide()
         },

         loadGuide: async function() {
            if (this.guideLoading) return this.guideHtml
            this.guideLoading = true
            this.guideError = ''
            try {
               var renderer = root && root.MarkdownRenderer
               if (!renderer || typeof renderer.render !== 'function') {
                  throw new Error(this.copy.guideUnavailable)
               }
               if (!root || typeof root.fetch !== 'function') throw new Error('Fetch is unavailable.')
               var url = this.guideDocumentUrl()
               var response = await root.fetch(url)
               if (!response || response.ok === false) {
                  var status = response && response.status ? 'HTTP ' + response.status : 'No response'
                  throw new Error(status)
               }
               var markdown = await response.text()
               this.guideHtml = renderer.render(markdown, { baseUrl: url })
               return this.guideHtml
            } catch (error) {
               this.guideError = error && error.message || String(error)
               return ''
            } finally {
               this.guideLoading = false
            }
         },

         closeGuide: function() {
            if (!this.guideOpen) return
            this.guideOpen = false
            var component = this
            this.$nextTick(function() {
               var button = component.$refs && component.$refs.guideButton
               if (button) button.focus()
            })
         },

         refreshFiles: function(preferredId, reloadEditor) {
            var previousId = this.selectedId
            var runtime
            var files
            try {
               runtime = this.runtime()
               files = runtime.listFiles().map(function(file) {
                  try {
                     file.hasDraft = !!runtime.getDraft(file.id)
                  } catch (error) {
                     file.hasDraft = false
                  }
                  return file
               })
            } catch (error) {
               this.setOperationError(error)
               files = []
            }

            this.files = files
            var wanted = preferredId || previousId
            var target = files.find(function(file) { return file.id === wanted })
            if (!target) target = files[0] || null
            this.selectedId = target ? target.id : ''

            if (!target) {
               this.editorName = ''
               this.editorSource = ''
               this.caretPosition = 0
               return
            }
            if (reloadEditor !== false || previousId !== target.id) this.loadEditor(target.id)
         },

         loadEditor: function(fileId) {
            this.cancelDraftTimer()
            var runtime = this.runtime()
            var file = runtime.getFile(fileId)
            if (!file) return
            var draft
            try {
               draft = runtime.getDraft(fileId)
            } catch (error) {
               this.setOperationError(error, fileId)
            }
            this.selectedId = fileId
            this.editorName = draft && typeof draft.name === 'string' ? draft.name : file.name
            this.editorSource = draft && typeof draft.source === 'string' ? draft.source : file.source
            this.caretPosition = 0
            this.draftError = null
            this.$nextTick(function() {
               var input = this.$refs.sourceInput
               if (input) {
                  input.scrollTop = 0
                  input.scrollLeft = 0
               }
               this.syncEditorScroll()
            })
         },

         selectFile: async function(file) {
            if (!file || file.id === this.selectedId || this.busy) return
            if (!await this.guardPendingChanges('select')) return
            this.loadEditor(file.id)
         },

         fileStatus: function(file) {
            if (file.lastError) return this.copy.loadError
            return file.enabled ? this.copy.enabled : this.copy.disabled
         },

         fileStatusClass: function(file) {
            if (file.lastError) return 'is-error'
            return file.enabled ? 'is-enabled' : 'is-disabled'
         },

         manifestIds: function(file, namespace) {
            return uniqueStrings(file && file.manifest && file.manifest[namespace])
         },

         retainedIds: function(file) {
            if (!file) return []
            if (Array.isArray(file.retainedIds)) return uniqueStrings(file.retainedIds)
            var current = this.manifestIds(file, 'main').concat(this.manifestIds(file, 'analysis'))
            var currentSet = new Set(current)
            return uniqueStrings((file.knownMainIds || []).concat(file.knownAnalysisIds || []))
               .filter(function(id) { return !currentSet.has(id) })
         },

         hasRetainedData: function(file) {
            if (this.$root && typeof this.$root.localFileRetainedCount === 'function') {
               return this.$root.localFileRetainedCount(file) > 0
            }
            if (this.$root && typeof this.$root.hasRetainedLocalFileData === 'function') {
               return !!this.$root.hasRetainedLocalFileData(file)
            }
            if (file && (file.hasRetainedData || file.retainedData)) return true
            return this.retainedIds(file).length > 0
         },

         onEditorChanged: function() {
            this.scheduleDraft()
         },

         onEditorInput: function(event) {
            this.updateCaret(event)
            this.scheduleDraft()
            this.$nextTick(this.syncEditorScroll)
         },

         scheduleDraft: function() {
            this.cancelDraftTimer()
            var component = this
            this.draftTimer = setTimeout(function() {
               component.draftTimer = null
               component.persistDraftNow()
            }, 400)
         },

         cancelDraftTimer: function() {
            if (this.draftTimer !== null) clearTimeout(this.draftTimer)
            this.draftTimer = null
         },

         persistDraftNow: function() {
            this.cancelDraftTimer()
            if (!this.selectedId) return true
            try {
               var runtime = this.runtime()
               if (this.dirty) {
                  runtime.setDraft(this.selectedId, {
                     name: this.editorName,
                     source: this.editorSource,
                  })
               } else {
                  runtime.clearDraft(this.selectedId)
               }
               var file = this.selectedFile
               if (file) file.hasDraft = this.dirty
               this.draftError = null
               return true
            } catch (error) {
               this.draftError = this.errorDetails(error)
               return false
            }
         },

         onEditorKeydown: function(event) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
               event.preventDefault()
               event.stopPropagation()
               this.saveSelected()
               return
            }
            if (event.key !== 'Tab') return
            event.preventDefault()
            event.stopPropagation()
            this.applyIndent(event.shiftKey)
         },

         applyIndent: function(removeIndent) {
            var input = this.$refs.sourceInput
            if (!input) return
            var source = this.editorSource
            var start = input.selectionStart
            var end = input.selectionEnd
            var indent = '   '
            var selected = source.slice(start, end)
            var hasMultipleLines = /\r|\n/.test(selected)
            var newStart = start
            var newEnd = end

            if (!removeIndent && !hasMultipleLines) {
               this.editorSource = source.slice(0, start) + indent + source.slice(end)
               newStart = newEnd = start + indent.length
            } else {
               var lineStart = source.lastIndexOf('\n', Math.max(0, start - 1)) + 1
               var nextBreak = source.indexOf('\n', end)
               var lineEnd = nextBreak === -1 ? source.length : nextBreak
               var block = source.slice(lineStart, lineEnd)
               var lines = block.split('\n')
               var changed = 0
               var firstChanged = 0

               if (removeIndent) {
                  lines = lines.map(function(line, index) {
                     var match = line.match(/^(?: {1,3}|\t)/)
                     var count = match ? match[0].length : 0
                     if (index === 0) firstChanged = count
                     changed += count
                     return count ? line.slice(count) : line
                  })
                  newStart = Math.max(lineStart, start - firstChanged)
                  newEnd = Math.max(newStart, end - changed)
               } else {
                  lines = lines.map(function(line) { return indent + line })
                  newStart = start + indent.length
                  newEnd = end + indent.length * lines.length
               }
               this.editorSource = source.slice(0, lineStart) + lines.join('\n') + source.slice(lineEnd)
            }

            this.scheduleDraft()
            this.$nextTick(function() {
               var textarea = this.$refs.sourceInput
               if (!textarea) return
               textarea.focus()
               textarea.setSelectionRange(newStart, newEnd)
               this.caretPosition = newEnd
               this.syncEditorScroll()
            })
         },

         updateCaret: function(event) {
            var input = event && event.target && typeof event.target.selectionStart === 'number'
               ? event.target : this.$refs.sourceInput
            if (input && typeof input.selectionStart === 'number') this.caretPosition = input.selectionStart
         },

         syncEditorScroll: function() {
            var input = this.$refs.sourceInput
            if (!input) return
            var highlight = this.$refs.highlightLayer
            var gutter = this.$refs.lineGutter
            if (highlight) {
               highlight.scrollTop = input.scrollTop
               highlight.scrollLeft = input.scrollLeft
            }
            if (gutter) gutter.scrollTop = input.scrollTop
         },

         saveSelected: async function() {
            var file = this.selectedFile
            if (!file || this.busy) return false
            this.cancelDraftTimer()
            if (this.dirty && !this.persistDraftNow()) return false
            this.busy = true
            this.operationError = null
            this.notice = ''
            var activeMutation = !!file.enabled && this.editorSource !== file.source
            try {
               var component = this
               var result
               if (activeMutation) {
                  result = await this.performMutation(file, 'save', function() {
                     return component.runtime().saveFile(file.id, component.editorName, component.editorSource)
                  })
                } else {
                   result = await Promise.resolve(this.runtime().saveFile(
                      file.id,
                      this.editorName,
                      this.editorSource
                   ))
                   if (this.$root && typeof this.$root.applyLocalFileChange === 'function') {
                      await Promise.resolve(this.$root.applyLocalFileChange(result, 'save'))
                   }
                }
               this.refreshFiles(result.file.id, true)
               this.notice = this.copy.saved
               return true
            } catch (error) {
               this.setOperationError(error, file.id)
               this.refreshFiles(file.id, false)
               return false
            } finally {
               this.busy = false
            }
         },

         discardSelected: async function() {
            var file = this.selectedFile
            if (!file || this.busy) return false
            this.busy = true
            this.operationError = null
            this.notice = ''
            this.cancelDraftTimer()
            try {
               this.runtime().clearDraft(file.id)
               if (file.lastError) this.clearFileError(file)
               this.refreshFiles(file.id, true)
               this.notice = this.copy.discarded
               return true
            } catch (error) {
               this.setOperationError(error, file.id)
               this.refreshFiles(file.id, false)
               return false
            } finally {
               this.busy = false
            }
         },

         guardPendingChanges: async function(action) {
            if (!this.dirty) return true
            if (this.busy) return false
            var choice = await this.askModal({
               title: this.copy.dirtyTitle,
               body: this.copy.dirtyBody,
               details: this.selectedFile ? [this.selectedFile.name] : [],
               choices: [
                  { value: 'save', label: this.copy.save, kind: 'primary' },
                  { value: 'discard', label: this.copy.discard, kind: 'secondary' },
                  { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
               ],
            })
            if (choice === 'save') return this.saveSelected()
            if (choice === 'discard') return this.discardSelected()
            return false
         },

         openUploadPicker: async function() {
            if (this.busy || !await this.guardPendingChanges('upload')) return
            var input = this.$refs.uploadInput
            if (!input) return
            input.value = ''
            input.click()
         },

         onUploadChange: async function(event) {
            var input = event.target
            var upload = input.files && input.files[0]
            input.value = ''
            if (!upload) return
            if (!/\.js$/i.test(upload.name || '')) {
               this.setOperationError(new Error(this.copy.invalidUpload))
               return
            }
            try {
               var source = await readFileText(upload)
               await this.importUpload(upload.name, source)
            } catch (error) {
               this.setOperationError(error)
            }
         },

         importUpload: async function(name, source) {
            var runtime = this.runtime()
            var existing = runtime.findByName(name)
            if (existing) {
               var replaceChoice = await this.askModal({
                  title: this.copy.replaceTitle,
                  body: this.copy.replaceBody,
                  details: [existing.name],
                  choices: [
                     { value: 'replace', label: this.copy.replace, kind: 'primary' },
                     { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
                  ],
               })
               if (replaceChoice !== 'replace') return false
               return this.replaceUpload(existing, name, source)
            }

            var trustChoice = await this.askModal({
               title: this.copy.trustTitle,
               body: this.copy.trustBody,
               details: [name],
               choices: [
                  { value: 'run', label: this.copy.runFile, kind: 'primary' },
                  { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
               ],
            })
            if (trustChoice !== 'run') return false

            this.busy = true
            this.operationError = null
            this.notice = ''
            var createdFile = null
            try {
               var component = this
               var created = await Promise.resolve(this.runtime().createUpload(name, source, false))
               createdFile = await Promise.resolve(this.runtime().trustFile(created.file.id))
               var result = await this.performMutation(createdFile, 'upload', function() {
                  return component.runtime().enable(createdFile.id)
               })
               this.refreshFiles(result.file.id, true)
               this.notice = this.copy.uploaded
               return true
            } catch (error) {
               if (createdFile) this.recordFileError(createdFile, error)
               this.setOperationError(error, createdFile && createdFile.id)
               this.refreshFiles(createdFile && createdFile.id || '', true)
               if (createdFile) this.notice = this.copy.uploadFailed
               return false
            } finally {
               this.busy = false
            }
         },

         replaceUpload: async function(file, name, source) {
            this.busy = true
            this.operationError = null
            this.notice = ''
            try {
               var component = this
               var result
               if (file.enabled) {
                  this.runtime().setDraft(file.id, { name: name, source: source })
                  result = await this.performMutation(file, 'replace-upload', function() {
                     return component.runtime().replaceUpload(file.id, name, source)
                  })
               } else {
                  result = await Promise.resolve(this.runtime().replaceUpload(file.id, name, source))
               }
               this.refreshFiles(result.file.id, true)
               this.notice = this.copy.replaced
               return true
            } catch (error) {
               this.setOperationError(error, file.id)
               this.refreshFiles(file.id, true)
               return false
            } finally {
               this.busy = false
            }
         },

         createTemplate: async function() {
            if (this.busy || !await this.guardPendingChanges('template')) return
            this.busy = true
            this.operationError = null
            this.notice = ''
            try {
               var file = await Promise.resolve(this.runtime().createTemplate())
               this.refreshFiles(file.id, true)
               this.notice = this.copy.templateCreated
            } catch (error) {
               this.setOperationError(error)
               this.refreshFiles(this.selectedId, false)
            } finally {
               this.busy = false
            }
         },

         toggleFile: async function(file, event) {
            var desired = !!event.target.checked
            event.target.checked = !!file.enabled
            if (this.busy || desired === !!file.enabled) return
            if (!await this.guardPendingChanges(desired ? 'enable' : 'disable')) return

            var runtime = this.runtime()
            var latest = runtime.getFile(file.id) || file
            if (desired && !latest.trusted) {
               var trustChoice = await this.askModal({
                  title: this.copy.trustTitle,
                  body: this.copy.trustBody,
                  details: [latest.name],
                  choices: [
                     { value: 'run', label: this.copy.runFile, kind: 'primary' },
                     { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
                  ],
               })
               if (trustChoice !== 'run') {
                  this.refreshFiles(this.selectedId, true)
                  return
               }
               try {
                  latest = runtime.trustFile(latest.id)
               } catch (error) {
                  this.setOperationError(error, latest.id)
                  this.refreshFiles(this.selectedId, true)
                  return
               }
            }

            this.busy = true
            this.operationError = null
            this.notice = ''
            var selected = this.selectedId
            try {
               var component = this
               var action = desired ? 'enable' : 'disable'
               await this.performMutation(latest, action, function() {
                  return desired
                     ? component.runtime().enable(latest.id)
                     : component.runtime().disable(latest.id)
               })
               this.refreshFiles(selected || latest.id, true)
               this.notice = desired ? this.copy.enabledNotice : this.copy.disabledNotice
            } catch (error) {
               this.recordFileError(latest, error)
               this.setOperationError(error, latest.id)
               this.refreshFiles(selected || latest.id, true)
            } finally {
               this.busy = false
            }
         },

         deleteFile: async function(file) {
            if (this.busy || !await this.guardPendingChanges('delete')) return
            var mainIds = uniqueStrings((file.knownMainIds || []).concat(this.manifestIds(file, 'main')))
            var analysisIds = uniqueStrings((file.knownAnalysisIds || []).concat(this.manifestIds(file, 'analysis')))
            var details = [file.name]
            if (mainIds.length) details.push(this.copy.mainIds + ': ' + mainIds.join(', '))
            if (analysisIds.length) details.push(this.copy.analysisIds + ': ' + analysisIds.join(', '))
            var choice = await this.askModal({
               title: this.copy.deleteTitle,
               body: this.copy.deleteBody,
               details: details,
               choices: [
                  { value: 'delete', label: this.copy.remove, kind: 'danger' },
                  { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
               ],
            })
            if (choice !== 'delete') return

            var index = this.files.findIndex(function(candidate) { return candidate.id === file.id })
            var neighbour = this.files[index + 1] || this.files[index - 1] || null
            var preferred = file.id === this.selectedId ? neighbour && neighbour.id : this.selectedId
            this.busy = true
            this.operationError = null
            this.notice = ''
            try {
               var component = this
               await this.performMutation(file, 'delete', function() {
                  return component.runtime().deleteFile(file.id)
               })
               this.refreshFiles(preferred || '', true)
               this.notice = this.copy.deletedNotice
            } catch (error) {
               this.setOperationError(error, file.id)
               this.refreshFiles(this.selectedId, true)
            } finally {
               this.busy = false
            }
         },

         downloadSelected: async function() {
            var file = this.selectedFile
            if (!file || this.busy) return
            var source = file.source
            var name = file.name
            if (this.dirty) {
               var choice = await this.askModal({
                  title: this.copy.downloadTitle,
                  body: this.copy.downloadBody,
                  details: [file.name],
                  choices: [
                     { value: 'save', label: this.copy.save, kind: 'primary' },
                     { value: 'draft', label: this.copy.downloadDraft, kind: 'secondary' },
                     { value: 'cancel', label: this.copy.cancel, kind: 'secondary' },
                  ],
               })
               if (choice === 'cancel') return
               if (choice === 'save') {
                  if (!await this.saveSelected()) return
                  file = this.selectedFile
                  source = file.source
                  name = file.name
               } else {
                  source = this.editorSource
                  name = this.editorName
               }
            }
            this.downloadSource(name, source)
         },

         downloadSource: function(name, source) {
            var downloadName = String(name || '').trim()
            if (!/\.js$/i.test(downloadName)) downloadName = (downloadName || 'notation') + '.js'
            var blob = new Blob([String(source)], { type: 'text/javascript;charset=utf-8' })
            var url = URL.createObjectURL(blob)
            var link = document.createElement('a')
            link.href = url
            link.download = downloadName
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(function() { URL.revokeObjectURL(url) }, 0)
         },

         performMutation: async function(file, action, operation) {
            var snapshot
            if (this.$root && typeof this.$root.captureLocalFileState === 'function') {
               snapshot = await Promise.resolve(this.$root.captureLocalFileState(file, action))
            }
            var result = await Promise.resolve(operation())
            if (this.$root && typeof this.$root.applyLocalFileChange === 'function') {
               await Promise.resolve(this.$root.applyLocalFileChange(result, action, snapshot))
            }
            return result
         },

         recordFileError: function(file, error) {
            var runtime = this.runtime()
            var details = this.errorDetails(error, file && file.name)
            try {
               if (typeof runtime.recordError === 'function') {
                  runtime.recordError(file.id, details)
               } else if (runtime.store && typeof runtime.store.updateFile === 'function') {
                  runtime.store.updateFile(file.id, { lastError: details })
               }
            } catch (storageError) {
               this.draftError = this.errorDetails(storageError)
            }
         },

         clearFileError: function(file) {
            var runtime = this.runtime()
            try {
               if (typeof runtime.clearError === 'function') {
                  runtime.clearError(file.id)
               } else if (runtime.store && typeof runtime.store.updateFile === 'function') {
                  runtime.store.updateFile(file.id, { lastError: null })
               }
            } catch (storageError) {
               this.draftError = this.errorDetails(storageError)
            }
         },

         errorDetails: function(error, sourceName) {
            if (error && typeof error === 'object' && error.message && error.at !== undefined) return error
            var runtime = root && root.localNotationManager
            if (runtime && typeof runtime.errorDetails === 'function') return runtime.errorDetails(error, sourceName)
            return {
               code: error && error.code || 'UNKNOWN_ERROR',
               message: error && error.message || String(error || 'Unknown error'),
               line: null,
               column: null,
            }
         },

         setOperationError: function(error, fileId) {
            var sourceName = ''
            if (fileId) {
               if (fileId === this.selectedId) sourceName = this.editorName
               if (!sourceName) {
                  var file = this.files.find(function(candidate) { return candidate.id === fileId })
                  sourceName = file && file.name || ''
               }
            }
            this.operationError = Object.assign(
               { fileId: fileId || '' },
               this.errorDetails(error, sourceName)
            )
            this.notice = ''
         },

         errorLocation: function(error) {
            return this.copy.errorAt
               .replace('{line}', error.line == null ? '?' : error.line)
               .replace('{column}', error.column == null ? '?' : error.column)
         },

         jumpToError: function(error) {
            var input = this.$refs.sourceInput
            if (!input || !error || !error.line) return
            var offset = offsetForLocation(this.editorSource, error.line, error.column)
            input.focus()
            input.setSelectionRange(offset, offset)
            this.caretPosition = offset
            var linesBefore = this.editorSource.slice(0, offset).split('\n').length - 1
            var lineHeight = parseFloat(window.getComputedStyle(input).lineHeight) || 20
            input.scrollTop = Math.max(0, linesBefore * lineHeight - input.clientHeight / 3)
            this.syncEditorScroll()
         },

         askModal: function(options) {
            if (this.modalResolver) this.resolveModal('cancel')
            this.modal.title = options.title || ''
            this.modal.body = options.body || ''
            this.modal.details = (options.details || []).slice()
            this.modal.choices = (options.choices || []).slice(0, 3)
            this.modal.open = true
            var component = this
            this.modalPromise = new Promise(function(resolve) {
               component.modalResolver = resolve
            })
            this.$nextTick(function() {
               var dialog = this.$el && this.$el.querySelector('.ne-local-modal__dialog')
               if (dialog) {
                  dialog.setAttribute('tabindex', '-1')
                  dialog.focus()
               }
            })
            return this.modalPromise
         },

         resolveModal: function(value) {
            var resolve = this.modalResolver
            this.modalResolver = null
            this.modalPromise = null
            this.modal.open = false
            this.modal.details = []
            this.modal.choices = []
            if (resolve) resolve(value)
         },

         cancelModal: function() {
            var cancel = this.modal.choices.find(function(choice) { return choice.value === 'cancel' })
            this.resolveModal(cancel ? cancel.value : null)
         },

         onBeforeUnload: function(event) {
            if (!this.dirty) return undefined
            this.persistDraftNow()
            event.preventDefault()
            event.returnValue = ''
            return ''
         },
      },
   }
})
