;(function(root, factory) {
   var component = factory(root)

   if (typeof module === 'object' && module.exports) module.exports = component
   if (root) root.AINotationPageComponent = component
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
   'use strict'

   var SESSION_KEY = 'ne-ai-conversations-v1'
   var MAX_CONVERSATIONS = 8
   var MAX_MESSAGES = 12
   var MAX_MESSAGE_LENGTH = 12000
   var MAX_DRAFT_LENGTH = 20000
   var MAX_TITLE_LENGTH = 72
   var conversationSequence = 0
   var messageSequence = 0

   var STRINGS = {
      en: {
         title: 'AI Notation',
         conversations: 'Conversations',
         newConversation: 'New conversation',
         closeConversation: 'Close conversation',
         conversationLimit: 'Close a conversation before opening another.',
         untitledConversation: 'Conversation {number}',
         baseUrl: 'Base URL',
         apiKey: 'API key',
         model: 'Model',
         prompt: 'Notation request',
         promptPlaceholder: 'Describe the notation to create or refine...',
         generate: 'Generate',
         generating: 'Generating...',
         clearKey: 'Clear key',
         openEditor: 'Open in local editor',
         noMessages: 'No messages yet.',
         user: 'You',
         assistant: 'Assistant',
         warning: 'The Base URL service will receive your API key and must allow browser CORS. The key is kept only in memory and this tab\'s session storage; it is never written to localStorage, conversations, exported files, source code, or Git.',
         generated: 'Generated source was written to {file} as disabled, untrusted local code. Review it before trusting and running it.',
         generatedInvalid: 'Generated source was written to {file} as disabled, untrusted local code, but validation reported: {error}',
         unavailable: 'The AI notation assistant is unavailable.',
         runtimeUnavailable: 'The local notation runtime is unavailable.',
         emptySource: 'The AI response did not contain source code.',
         leakedKey: 'The AI response included the API key and was discarded.',
         createFailed: 'The generated notation file could not be written safely.',
         fileUnavailable: 'The generated local file is no longer available.',
      },
      zh: {
         title: 'AI \u8bb0\u53f7',
         conversations: '\u4f1a\u8bdd',
         newConversation: '\u65b0\u5efa\u4f1a\u8bdd',
         closeConversation: '\u5173\u95ed\u4f1a\u8bdd',
         conversationLimit: '\u8bf7\u5148\u5173\u95ed\u4e00\u4e2a\u4f1a\u8bdd\u3002',
         untitledConversation: '\u4f1a\u8bdd {number}',
         baseUrl: 'Base URL',
         apiKey: 'API Key',
         model: '\u6a21\u578b',
         prompt: '\u8bb0\u53f7\u9700\u6c42',
         promptPlaceholder: '\u63cf\u8ff0\u8981\u521b\u5efa\u6216\u7ee7\u7eed\u4fee\u6539\u7684\u8bb0\u53f7...',
         generate: '\u751f\u6210',
         generating: '\u6b63\u5728\u751f\u6210...',
         clearKey: '\u6e05\u9664 Key',
         openEditor: '\u5728\u672c\u5730\u7f16\u8f91\u5668\u4e2d\u6253\u5f00',
         noMessages: '\u6682\u65e0\u6d88\u606f\u3002',
         user: '\u4f60',
         assistant: 'AI',
         warning: 'Base URL \u670d\u52a1\u4f1a\u6536\u5230\u4f60\u7684 API Key\uff0c\u5e76\u4e14\u5fc5\u987b\u5141\u8bb8\u6d4f\u89c8\u5668 CORS\u3002Key \u4ec5\u4fdd\u5b58\u5728\u5185\u5b58\u548c\u5f53\u524d\u6807\u7b7e\u9875\u7684 sessionStorage\uff0c\u4e0d\u4f1a\u5199\u5165 localStorage\u3001\u4f1a\u8bdd\u3001\u5bfc\u51fa\u6587\u4ef6\u3001\u6e90\u7801\u6216 Git\u3002',
         generated: '\u751f\u6210\u7684\u6e90\u7801\u5df2\u5199\u5165 {file}\uff0c\u5e76\u4fdd\u6301\u4e3a\u5df2\u7981\u7528\u3001\u672a\u4fe1\u4efb\u7684\u672c\u5730\u4ee3\u7801\u3002\u8bf7\u5ba1\u9605\u540e\u518d\u4fe1\u4efb\u5e76\u8fd0\u884c\u3002',
         generatedInvalid: '\u751f\u6210\u7684\u6e90\u7801\u5df2\u5199\u5165 {file}\uff0c\u5e76\u4fdd\u6301\u4e3a\u5df2\u7981\u7528\u3001\u672a\u4fe1\u4efb\u7684\u672c\u5730\u4ee3\u7801\uff0c\u4f46\u9a8c\u8bc1\u62a5\u544a\uff1a{error}',
         unavailable: 'AI \u8bb0\u53f7\u52a9\u624b\u4e0d\u53ef\u7528\u3002',
         runtimeUnavailable: '\u672c\u5730\u8bb0\u53f7\u8fd0\u884c\u65f6\u4e0d\u53ef\u7528\u3002',
         emptySource: 'AI \u54cd\u5e94\u4e2d\u6ca1\u6709\u6e90\u7801\u3002',
         leakedKey: 'AI \u54cd\u5e94\u4e2d\u5305\u542b API Key\uff0c\u5df2\u4e22\u5f03\u8be5\u7ed3\u679c\u3002',
         createFailed: '\u65e0\u6cd5\u5b89\u5168\u5199\u5165\u751f\u6210\u7684\u8bb0\u53f7\u6587\u4ef6\u3002',
         fileUnavailable: '\u751f\u6210\u7684\u672c\u5730\u6587\u4ef6\u5df2\u4e0d\u5b58\u5728\u3002',
      },
   }

   function sessionStorage() {
      try {
         return root && root.sessionStorage || null
      } catch (error) {
         return null
      }
   }

   function truncate(value, limit) {
      var text = typeof value === 'string' ? value : String(value == null ? '' : value)
      if (text.length <= limit) return text
      return text.slice(0, Math.max(0, limit - 16)) + '\n...[truncated]'
   }

   function randomId(prefix, sequence) {
      var crypto = root && root.crypto
      if (crypto && typeof crypto.randomUUID === 'function') return prefix + crypto.randomUUID()
      return prefix + Date.now().toString(36) + '-' + sequence.toString(36) + '-' + Math.random().toString(36).slice(2, 8)
   }

   function conversationId() {
      conversationSequence++
      return randomId('ai-', conversationSequence)
   }

   function messageId() {
      messageSequence++
      return randomId('msg-', messageSequence)
   }

   function titleFrom(value) {
      return truncate(String(value == null ? '' : value).replace(/\s+/g, ' ').trim(), MAX_TITLE_LENGTH)
   }

   function responseContainsCredential(apiKey, source, raw) {
      // Short dummy tokens are common on local OpenAI-compatible endpoints and
      // collide with ordinary source words. Real credentials are long enough
      // for exact-match scanning to be useful without rejecting normal code.
      if (String(apiKey || '').length < 8) return false
      return String(source || '').indexOf(apiKey) !== -1 || String(raw || '').indexOf(apiKey) !== -1
   }

   function newConversation() {
      var now = Date.now()
      return {
         id: conversationId(),
         title: '',
         draft: '',
         messages: [],
         toolMode: 'auto',
         fileId: '',
         fileName: '',
         busy: false,
         error: '',
         notice: '',
         createdAt: now,
         updatedAt: now,
      }
   }

   function sanitizeMessage(value) {
      if (!value || (value.role !== 'user' && value.role !== 'assistant')) return null
      var content = truncate(value.content, MAX_MESSAGE_LENGTH)
      if (!content.trim()) return null
      return {
         id: typeof value.id === 'string' && value.id ? value.id.slice(0, 128) : messageId(),
         role: value.role,
         content: content,
         createdAt: Number(value.createdAt) || Date.now(),
      }
   }

   function sanitizeConversation(value, seenIds) {
      if (!value || typeof value !== 'object') return null
      var id = typeof value.id === 'string' ? value.id.slice(0, 128) : ''
      if (!id || seenIds.has(id)) return null
      seenIds.add(id)
      var messages = (Array.isArray(value.messages) ? value.messages : [])
         .map(sanitizeMessage)
         .filter(function(message) { return !!message })
         .slice(-MAX_MESSAGES)
      var createdAt = Number(value.createdAt) || Date.now()
      return {
         id: id,
         title: titleFrom(value.title),
         draft: truncate(value.draft, MAX_DRAFT_LENGTH),
         messages: messages,
         toolMode: value.toolMode === 'plain' ? 'plain' : 'auto',
         fileId: typeof value.fileId === 'string' ? value.fileId.slice(0, 128) : '',
         fileName: typeof value.fileName === 'string' ? value.fileName.slice(0, 255) : '',
         busy: false,
         error: '',
         notice: '',
         createdAt: createdAt,
         updatedAt: Number(value.updatedAt) || createdAt,
      }
   }

   function conversationSnapshot(conversation) {
      return {
         id: conversation.id,
         title: titleFrom(conversation.title),
         draft: truncate(conversation.draft, MAX_DRAFT_LENGTH),
         messages: (conversation.messages || []).map(sanitizeMessage).filter(function(message) { return !!message }).slice(-MAX_MESSAGES),
         toolMode: conversation.toolMode === 'plain' ? 'plain' : 'auto',
         fileId: typeof conversation.fileId === 'string' ? conversation.fileId.slice(0, 128) : '',
         fileName: typeof conversation.fileName === 'string' ? conversation.fileName.slice(0, 255) : '',
         createdAt: Number(conversation.createdAt) || Date.now(),
         updatedAt: Number(conversation.updatedAt) || Date.now(),
      }
   }

   return {
      name: 'AINotationPage',

      template: `
         <section class="ne-ai-page" :aria-label="copy.title">
            <header class="ne-ai-page__header">
               <h3>{{ copy.title }}</h3>
            </header>

            <div class="ne-ai-page__tabs" role="tablist" :aria-label="copy.conversations">
               <div v-for="conversation in conversations" :key="conversation.id"
                  class="ne-ai-page__tab-group" :class="{ 'is-active': conversation.id === activeConversationId }"
                  role="presentation">
                  <button type="button" class="ne-ai-page__tab" role="tab"
                     :id="tabId(conversation.id)" :aria-controls="panelId(conversation.id)"
                     :aria-selected="String(conversation.id === activeConversationId)"
                     @click="selectConversation(conversation.id)">
                     <span class="ne-ai-page__tab-label">{{ conversationLabel(conversation) }}</span>
                     <span v-if="conversation.busy" class="ne-ai-page__tab-busy" aria-hidden="true"></span>
                  </button>
                  <button type="button" class="ne-ai-page__tab-close" :title="copy.closeConversation"
                     :aria-label="copy.closeConversation + ': ' + conversationLabel(conversation)"
                     :disabled="conversation.busy || conversations.length <= 1"
                     @click="closeConversation(conversation.id)">&times;</button>
               </div>
               <button type="button" class="ne-ai-page__tab-add"
                  :title="canCreateConversation ? copy.newConversation : copy.conversationLimit"
                  :aria-label="copy.newConversation" :disabled="!canCreateConversation"
                  @click="createConversation">+</button>
            </div>

            <section v-if="activeConversation" class="ne-ai-page__panel" role="tabpanel"
               :id="panelId(activeConversation.id)" :aria-labelledby="tabId(activeConversation.id)">
               <div class="ne-ai-page__settings">
                  <label class="ne-ai-page__field">
                     <span>{{ copy.baseUrl }}</span>
                     <input v-model="baseUrl" type="url" autocomplete="url" spellcheck="false"
                        :disabled="activeBusy" @input="saveSettings">
                  </label>
                  <label class="ne-ai-page__field">
                     <span>{{ copy.apiKey }}</span>
                     <input v-model="apiKey" type="password" name="ne-ai-api-key" autocomplete="off"
                        spellcheck="false" :disabled="activeBusy" @input="saveSettings">
                  </label>
                  <label class="ne-ai-page__field">
                     <span>{{ copy.model }}</span>
                     <input v-model="model" type="text" autocomplete="off" spellcheck="false"
                        :disabled="activeBusy" @input="saveSettings">
                  </label>
               </div>

               <p class="ne-ai-page__warning" role="note">{{ copy.warning }}</p>
               <div v-if="activeConversation.error" class="ne-ai-page__error" role="alert">
                  {{ activeConversation.error }}
               </div>
               <div v-if="activeConversation.notice" class="ne-ai-page__notice" role="status">
                  {{ activeConversation.notice }}
               </div>

               <div class="ne-ai-page__messages" role="log" aria-live="polite">
                  <p v-if="!activeConversation.messages.length" class="ne-ai-page__messages-empty">
                     {{ copy.noMessages }}
                  </p>
                  <article v-for="message in activeConversation.messages" :key="message.id"
                     class="ne-ai-page__message" :class="'is-' + message.role">
                     <header>{{ message.role === 'user' ? copy.user : copy.assistant }}</header>
                     <pre>{{ message.content }}</pre>
                  </article>
               </div>

               <form class="ne-ai-page__composer" @submit.prevent="generate">
                  <label class="ne-ai-page__field ne-ai-page__field--prompt">
                     <span>{{ copy.prompt }}</span>
                     <textarea :value="activeDraft" rows="6" maxlength="20000"
                        :placeholder="copy.promptPlaceholder" :disabled="activeBusy"
                        spellcheck="true" @input="updateDraft($event.target.value)"></textarea>
                  </label>
                  <div class="ne-ai-page__actions">
                     <button type="submit" class="ne-ai-page__button is-primary"
                        :disabled="activeBusy || !apiKey.trim() || !activeDraft.trim()">
                        <span>{{ activeBusy ? copy.generating : copy.generate }}</span>
                     </button>
                     <button type="button" class="ne-ai-page__button"
                        :disabled="activeBusy || !apiKey" @click="clearKey">{{ copy.clearKey }}</button>
                     <button v-if="activeConversation.fileId" type="button"
                        class="ne-ai-page__button" :disabled="activeBusy"
                        @click="openInEditor(activeConversation)">{{ copy.openEditor }}</button>
                  </div>
               </form>
            </section>
         </section>
      `,

      data: function() {
         return {
            baseUrl: '',
            apiKey: '',
            model: '',
            conversations: [],
            activeConversationId: '',
         }
      },

      computed: {
         copy: function() {
            return this.$root && this.$root.lang === 'zh' ? STRINGS.zh : STRINGS.en
         },
         activeConversation: function() {
            var activeId = this.activeConversationId
            return this.conversations.find(function(conversation) {
               return conversation.id === activeId
            }) || null
         },
         activeDraft: function() {
            return this.activeConversation ? String(this.activeConversation.draft || '') : ''
         },
         activeBusy: function() {
            return !!(this.activeConversation && this.activeConversation.busy)
         },
         canCreateConversation: function() {
            return this.conversations.length < MAX_CONVERSATIONS
         },
      },

      created: function() {
         this.loadSettings()
         this.loadConversations()
      },

      methods: {
         assistantRuntime: function() {
            return root && root.AINotationAssistant
         },
         localRuntime: function() {
            var runtime = root && root.localNotationManager
            if (!runtime) throw new Error(this.copy.runtimeUnavailable)
            return runtime
         },
         loadSettings: function() {
            var assistant = this.assistantRuntime()
            if (!assistant || typeof assistant.readSessionSettings !== 'function') return
            var settings
            try {
               settings = assistant.readSessionSettings() || {}
            } catch (error) {
               settings = {}
            }
            this.baseUrl = settings.baseUrl || assistant.DEFAULT_BASE_URL || ''
            this.apiKey = settings.apiKey || ''
            this.model = settings.model || assistant.DEFAULT_MODEL || ''
         },
         saveSettings: function() {
            var assistant = this.assistantRuntime()
            if (!assistant || typeof assistant.writeSessionSettings !== 'function') return
            try {
               assistant.writeSessionSettings({
                  baseUrl: this.baseUrl,
                  apiKey: this.apiKey,
                  model: this.model,
               })
            } catch (error) {
               // Keep the current in-memory values when session storage is unavailable.
            }
         },
         clearKey: function() {
            this.apiKey = ''
            this.saveSettings()
         },
         loadConversations: function() {
            var conversations = []
            var activeId = ''
            var store = sessionStorage()
            if (store && typeof store.getItem === 'function') {
               try {
                  var saved = JSON.parse(store.getItem(SESSION_KEY) || 'null')
                  var seenIds = new Set()
                  if (saved && Array.isArray(saved.conversations)) {
                     conversations = saved.conversations.map(function(value) {
                        return sanitizeConversation(value, seenIds)
                     }).filter(function(value) { return !!value }).slice(0, MAX_CONVERSATIONS)
                  }
                  activeId = saved && typeof saved.activeId === 'string' ? saved.activeId : ''
               } catch (error) {
                  conversations = []
               }
            }
            if (!conversations.length) conversations.push(newConversation())
            this.conversations = conversations
            this.activeConversationId = conversations.some(function(conversation) {
               return conversation.id === activeId
            }) ? activeId : conversations[0].id
            this.persistConversations()
         },
         persistConversations: function() {
            var store = sessionStorage()
            if (!store || typeof store.setItem !== 'function') return
            try {
               store.setItem(SESSION_KEY, JSON.stringify({
                  activeId: this.activeConversationId,
                  conversations: this.conversations.map(conversationSnapshot).slice(0, MAX_CONVERSATIONS),
               }))
            } catch (error) {
               // Conversations remain available in memory if storage is full or blocked.
            }
         },
         tabId: function(id) {
            return 'ne-ai-tab-' + String(id).replace(/[^a-z0-9_-]/gi, '')
         },
         panelId: function(id) {
            return 'ne-ai-panel-' + String(id).replace(/[^a-z0-9_-]/gi, '')
         },
         conversationLabel: function(conversation) {
            if (!conversation) return ''
            if (conversation.title) return conversation.title
            var index = this.conversations.indexOf(conversation)
            return this.copy.untitledConversation.replace('{number}', String(index < 0 ? 1 : index + 1))
         },
         selectConversation: function(id) {
            if (!this.conversations.some(function(conversation) { return conversation.id === id })) return
            this.activeConversationId = id
            this.persistConversations()
         },
         createConversation: function() {
            if (!this.canCreateConversation) return null
            var conversation = newConversation()
            this.conversations = this.conversations.concat([conversation])
            this.activeConversationId = conversation.id
            this.persistConversations()
            return conversation
         },
         closeConversation: function(id) {
            if (this.conversations.length <= 1) return false
            var index = this.conversations.findIndex(function(conversation) { return conversation.id === id })
            if (index < 0 || this.conversations[index].busy) return false
            var conversations = this.conversations.slice(0, index).concat(this.conversations.slice(index + 1))
            this.conversations = conversations
            if (this.activeConversationId === id) {
               this.activeConversationId = (conversations[index] || conversations[index - 1] || conversations[0]).id
            }
            this.persistConversations()
            return true
         },
         updateDraft: function(value) {
            var conversation = this.activeConversation
            if (!conversation || conversation.busy) return
            conversation.draft = truncate(value, MAX_DRAFT_LENGTH)
            conversation.updatedAt = Date.now()
            this.persistConversations()
         },
         appendMessage: function(conversation, role, content) {
            var message = sanitizeMessage({ role: role, content: content, createdAt: Date.now() })
            if (!message) return null
            conversation.messages = conversation.messages.concat([message]).slice(-MAX_MESSAGES)
            conversation.updatedAt = message.createdAt
            if (role === 'user' && !conversation.title) conversation.title = titleFrom(message.content)
            this.persistConversations()
            return message
         },
         nextFileName: function() {
            var files = this.localRuntime().listFiles()
            var used = new Set(files.map(function(file) { return String(file.name || '').toLowerCase() }))
            var index = 1
            var candidate
            do {
               candidate = index === 1 ? 'AI-Notation.js' : 'AI-Notation-' + index + '.js'
               index++
            } while (used.has(candidate.toLowerCase()))
            return candidate
         },
         eligibleFile: function(conversation) {
            if (!conversation || !conversation.fileId) return null
            var runtime = this.localRuntime()
            if (typeof runtime.getFile !== 'function') return null
            var file = runtime.getFile(conversation.fileId)
            if (!file || file.enabled || file.trusted) return null
            return file
         },
         captureFileState: function(file) {
            if (!file) return null
            var runtime = this.localRuntime()
            var draft = null
            var hasDraftApi = typeof runtime.getDraft === 'function'
            if (hasDraftApi) {
               try {
                  draft = runtime.getDraft(file.id)
               } catch (error) {
                  return null
               }
            }
            return {
               id: file.id,
               name: String(file.name || ''),
               source: String(file.source || ''),
               sourceRevision: Number(file.sourceRevision) || 0,
               hasDraftApi: hasDraftApi,
               draftName: draft && typeof draft.name === 'string' ? draft.name : '',
               draftSource: draft && typeof draft.source === 'string' ? draft.source : '',
            }
         },
         unchangedFile: function(state) {
            if (!state) return null
            var manager = this.$root && this.$root.$refs && this.$root.$refs.localNotationManagerComponent
            if (manager && manager.selectedId === state.id) return null
            var current = this.eligibleFile({ fileId: state.id })
            if (!current) return null
            var currentState = this.captureFileState(current)
            if (!currentState) return null
            if (currentState.name !== state.name || currentState.source !== state.source ||
               currentState.sourceRevision !== state.sourceRevision ||
               currentState.hasDraftApi !== state.hasDraftApi ||
               currentState.draftName !== state.draftName ||
               currentState.draftSource !== state.draftSource) return null
            return current
         },
         generate: async function() {
            var conversation = this.activeConversation
            if (!conversation || conversation.busy) return false
            var assistant = this.assistantRuntime()
            if (!assistant || typeof assistant.generate !== 'function') {
               conversation.error = this.copy.unavailable
               return false
            }
            var prompt = String(conversation.draft || '').trim()
            var apiKey = String(this.apiKey || '').trim()
            if (!apiKey || !prompt) return false

            var history = conversation.messages.slice()
            conversation.busy = true
            conversation.error = ''
            conversation.notice = ''
            this.saveSettings()

            try {
               var linkedFile = this.eligibleFile(conversation)
               var linkedState = this.captureFileState(linkedFile)
               var requestFileName = linkedFile ? linkedFile.name : this.nextFileName()
               var result = await Promise.resolve(assistant.generate({
                  baseUrl: this.baseUrl,
                  apiKey: apiKey,
                  model: this.model,
                  prompt: prompt,
                  history: history,
                  toolMode: conversation.toolMode,
                  fileName: requestFileName,
               }))
               var source = result && typeof result.source === 'string' ? result.source.trim() : ''
               if (!source) throw new Error(this.copy.emptySource)
               var raw = result && typeof result.raw === 'string' ? result.raw : ''
               if (responseContainsCredential(apiKey, source, raw)) {
                  throw new Error(this.copy.leakedKey)
               }

               var targetFile
               var currentLinkedFile = this.unchangedFile(linkedState)
               if (currentLinkedFile) {
                  var runtime = this.localRuntime()
                  if (typeof runtime.setDraft !== 'function') throw new Error(this.copy.createFailed)
                  runtime.setDraft(currentLinkedFile.id, { name: currentLinkedFile.name, source: source })
                  targetFile = currentLinkedFile
               } else {
                  var fileName = this.nextFileName()
                  var created = await Promise.resolve(this.localRuntime().createUpload(fileName, source, false))
                  if (!created || !created.file || created.file.enabled || created.file.trusted) {
                     throw new Error(this.copy.createFailed)
                  }
                  targetFile = created.file
               }

               this.appendMessage(conversation, 'user', prompt)
               this.appendMessage(conversation, 'assistant', raw || source)
               conversation.draft = ''
               conversation.toolMode = result && result.toolMode === 'plain' ? 'plain' : conversation.toolMode
               conversation.fileId = targetFile.id
               conversation.fileName = targetFile.name
               var validation = result && result.validation
               if (validation && validation.valid === false && validation.error) {
                  conversation.notice = this.copy.generatedInvalid
                     .replace('{file}', targetFile.name)
                     .replace('{error}', String(validation.error))
               } else {
                  conversation.notice = this.copy.generated.replace('{file}', targetFile.name)
               }
               this.persistConversations()
               return true
            } catch (error) {
               conversation.error = error && error.message || String(error || this.copy.createFailed)
               this.persistConversations()
               return false
            } finally {
               conversation.busy = false
            }
         },
         openInEditor: async function(conversation) {
            if (!conversation || !conversation.fileId) return false
            var file
            try {
               file = this.localRuntime().getFile(conversation.fileId)
            } catch (error) {
               file = null
            }
            if (!file) {
               conversation.error = this.copy.fileUnavailable
               return false
            }

            var app = this.$root
            if (!app || typeof app.navigateToPage !== 'function') return false
            await Promise.resolve(app.navigateToPage('settings'))
            app.$nextTick(function() {
               var manager = app.$refs && app.$refs.localNotationManagerComponent
               if (manager && typeof manager.refreshFiles === 'function') {
                  manager.refreshFiles(file.id, true)
               }
            })
            return true
         },
      },
   }
})
