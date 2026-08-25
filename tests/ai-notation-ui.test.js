'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const component = require('../js/ai-notation-ui.js')
const Loader = require('../js/notation-loader.js')

function memoryStorage() {
   const values = new Map()
   return {
      values,
      setItem(key, value) { values.set(key, String(value)) },
      getItem(key) { return values.has(key) ? values.get(key) : null },
      removeItem(key) { values.delete(key) },
   }
}

function createVm(overrides) {
   const vm = Object.assign(component.data(), {
      $root: { lang: 'en' },
   }, overrides || {})

   Object.keys(component.methods).forEach((name) => {
      if (typeof vm[name] !== 'function') vm[name] = component.methods[name].bind(vm)
   })
   Object.keys(component.computed).forEach((name) => {
      Object.defineProperty(vm, name, {
         configurable: true,
         get() { return component.computed[name].call(vm) },
      })
   })
   return vm
}

test('AI notation is a separate navigation page and is absent from the local-file component', () => {
   const projectRoot = path.join(__dirname, '..')
   const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')
   const framework = fs.readFileSync(path.join(projectRoot, 'js', 'framework.js'), 'utf8')
   const localTemplate = require('../js/local-notation-ui.js').template

   assert.match(index, /page==='ai-notation'/)
   assert.match(index, /<ai-notation-page v-show="page==='ai-notation'">/)
   assert.match(framework, /app\.component\('ai-notation-page'/)
   assert.doesNotMatch(localTemplate, /AI create|AI notation assistant|AINotationAssistant|ne-local-ai/)
   assert.equal(Loader.APP_SCRIPTS.includes('js/ai-notation-ui.js'), true)
   assert.ok(
      Loader.APP_SCRIPTS.indexOf('js/ai-notation-assistant.js') <
      Loader.APP_SCRIPTS.indexOf('js/ai-notation-ui.js')
   )
   assert.ok(
      Loader.APP_SCRIPTS.indexOf('js/ai-notation-ui.js') <
      Loader.APP_SCRIPTS.indexOf('js/framework.js')
   )
})

test('active and archived conversations persist in local storage without the API key', () => {
   const originalSessionStorage = globalThis.sessionStorage
   const originalLocalStorage = globalThis.localStorage
   const originalConfirm = globalThis.confirm
   const sessionStore = memoryStorage()
   const localStore = memoryStorage()
   globalThis.sessionStorage = sessionStore
   globalThis.localStorage = localStore
   globalThis.confirm = () => true

   try {
      sessionStore.setItem('ne-ai-conversations-v1', JSON.stringify({
         activeId: 'legacy-first',
         conversations: [{
            id: 'legacy-first', title: '', draft: 'First notation request', messages: [],
            toolMode: 'auto', fileId: '', fileName: '', createdAt: 1, updatedAt: 1,
         }],
      }))
      const vm = createVm()
      vm.loadConversations()
      const first = vm.activeConversation
      const second = vm.createConversation()
      assert.equal(vm.conversations.length, 2)
      assert.equal(vm.activeConversationId, second.id)
      vm.updateDraft('Second notation request')
      vm.selectConversation(first.id)
      assert.equal(vm.activeDraft, 'First notation request')
      assert.equal(vm.archiveConversation(first.id), true)
      assert.equal(vm.activeConversationId, second.id)
      assert.equal(vm.archivedConversations[0].id, first.id)

      vm.apiKey = 'must-not-be-in-conversations'
      second.activity = [{ id: 'activity-secret', type: 'tool_call_finished', detail: 'ephemeral-output' }]
      vm.persistConversations()
      const serialized = localStore.values.get('ne-ai-conversations-v2')
      assert.doesNotMatch(serialized, /must-not-be-in-conversations/)
      assert.doesNotMatch(serialized, /ephemeral-output|activity-secret/)
      assert.match(serialized, /archivedConversations/)
      assert.equal(sessionStore.getItem('ne-ai-conversations-v1'), null)

      const restored = createVm()
      restored.loadConversations()
      assert.equal(restored.conversations.length, 1)
      assert.equal(restored.activeDraft, 'Second notation request')
      assert.equal(restored.activeConversationId, second.id)
      assert.equal(restored.archivedConversations[0].id, first.id)
      assert.equal(restored.restoreConversation(first.id), true)
      assert.equal(restored.activeConversationId, first.id)
      assert.equal(restored.activeDraft, 'First notation request')
   } finally {
      globalThis.sessionStorage = originalSessionStorage
      globalThis.localStorage = originalLocalStorage
      globalThis.confirm = originalConfirm
   }
})

test('archive and permanent delete each require confirmation', () => {
   const originalLocalStorage = globalThis.localStorage
   const originalConfirm = globalThis.confirm
   globalThis.localStorage = memoryStorage()
   const confirmations = []
   let allow = false
   globalThis.confirm = (message) => {
      confirmations.push(message)
      return allow
   }

   try {
      const vm = createVm()
      vm.loadConversations()
      const first = vm.activeConversation
      first.title = 'Cantor notation'

      assert.equal(vm.archiveConversation(first.id), false)
      assert.equal(vm.archivedConversations.length, 0)
      allow = true
      assert.equal(vm.archiveConversation(first.id), true)
      assert.equal(vm.conversations.length, 1)
      assert.notEqual(vm.activeConversationId, first.id)
      assert.equal(vm.archivedConversations[0].id, first.id)

      allow = false
      assert.equal(vm.deleteArchivedConversation(first.id), false)
      assert.equal(vm.archivedConversations.length, 1)
      allow = true
      assert.equal(vm.deleteArchivedConversation(first.id), true)
      assert.equal(vm.archivedConversations.length, 0)
      assert.equal(confirmations.length, 4)
      assert.match(component.template, /@click\.stop="archiveConversation\(conversation\.id\)"/)
      assert.match(component.template, /deleteArchivedConversation\(conversation\.id\)/)
   } finally {
      globalThis.localStorage = originalLocalStorage
      globalThis.confirm = originalConfirm
   }
})

test('archiving respects running state and restoring respects the active-tab limit', () => {
   const originalLocalStorage = globalThis.localStorage
   const originalConfirm = globalThis.confirm
   globalThis.localStorage = memoryStorage()
   let confirmCalls = 0
   globalThis.confirm = () => {
      confirmCalls++
      return true
   }

   try {
      const vm = createVm()
      vm.loadConversations()
      const running = vm.activeConversation
      running.busy = true
      assert.equal(vm.archiveConversation(running.id), false)
      assert.equal(confirmCalls, 0)
      running.busy = false
      assert.equal(vm.archiveConversation(running.id), true)
      const archivedId = vm.archivedConversations[0].id

      while (vm.canCreateConversation) vm.createConversation()
      assert.equal(vm.conversations.length, 8)
      assert.equal(vm.restoreConversation(archivedId), false)
      assert.equal(vm.archivedConversations[0].id, archivedId)
      assert.equal(vm.deleteArchivedConversation(vm.activeConversationId), false)
   } finally {
      globalThis.localStorage = originalLocalStorage
      globalThis.confirm = originalConfirm
   }
})

test('generation keeps histories isolated and writes disabled untrusted local files', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   const calls = []
   const files = new Map()
   const drafts = new Map()

   globalThis.localNotationManager = {
      listFiles() { return Array.from(files.values()) },
      getFile(id) { return files.get(id) || null },
      getDraft(id) { return drafts.get(id) || null },
      setDraft(id, draft) {
         calls.push({ setDraft: { id, name: draft.name, source: draft.source } })
         drafts.set(id, draft)
      },
      createUpload(name, source, trusted) {
         calls.push({ createUpload: { name, source, trusted } })
         const file = {
            id: 'ai-file-' + (files.size + 1),
            name,
            source,
            sourceRevision: 1,
            enabled: false,
            trusted: !!trusted,
         }
         files.set(file.id, file)
         return { file, enabled: false, change: null }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate(options) {
         calls.push({ generate: options })
         const number = calls.filter((entry) => entry.generate).length
         return {
            source: 'register.push({ id: "generated-' + number + '" });',
            raw: 'assistant response ' + number,
            toolMode: number === 1 ? 'plain' : 'auto',
            validation: { valid: true },
         }
      },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const first = {
      id: 'first', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   const second = {
      id: 'second', title: '', draft: '', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 2, updatedAt: 2,
   }
   vm.conversations = [first, second]
   vm.activeConversationId = first.id

   try {
      assert.equal(await vm.generate(), true)
      assert.equal(first.fileId, 'ai-file-1')
      assert.equal(first.toolMode, 'plain')
      assert.deepEqual(first.messages.map((message) => message.role), ['user', 'assistant'])

      vm.updateDraft('Refine the same notation')
      assert.equal(await vm.generate(), true)
      assert.equal(calls.filter((entry) => entry.createUpload).length, 1)
      assert.deepEqual(calls.find((entry) => entry.setDraft), {
         setDraft: {
            id: 'ai-file-1',
            name: 'AI-Notation.js',
            source: 'register.push({ id: "generated-2" });',
         },
      })

      vm.selectConversation(second.id)
      vm.updateDraft('Create an unrelated notation')
      assert.equal(await vm.generate(), true)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   const requests = calls.filter((entry) => entry.generate).map((entry) => entry.generate)
   assert.deepEqual(requests[0].history, [])
   assert.deepEqual(requests[1].history.map((message) => message.role), ['user', 'assistant'])
   assert.equal(requests[1].toolMode, 'plain')
   assert.deepEqual(requests[2].history, [])
   calls.filter((entry) => entry.createUpload).forEach((entry) => {
      assert.equal(entry.createUpload.trusted, false)
   })
})

test('new AI local files use a safe model-selected filename and resolve duplicates', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   const created = []
   const files = [{ id: 'existing', name: 'Cantor-Normal-Form.js' }]
   let run = 0
   globalThis.localNotationManager = {
      listFiles() { return files.concat(created.map((entry, index) => ({ id: 'created-' + index, name: entry.name }))) },
      createUpload(name, source, trusted) {
         const file = { id: 'created-' + created.length, name, source, enabled: false, trusted: !!trusted }
         created.push(file)
         return { file }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate() {
         run++
         return {
            source: 'register.push({ id: "generated-' + run + '" });',
            raw: 'result ' + run,
            fileName: run === 1 ? '../../Cantor Normal Form.js' : 'Cantor-Normal-Form.js',
            validation: { valid: true },
         }
      },
   }
   const vm = createVm({ apiKey: 'session-key' })
   const conversation = {
      id: 'filename', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', activity: [],
      startedAt: 0, finishedAt: 0, createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      assert.equal(await vm.generate(), true)
      assert.equal(created[0].name, 'Cantor-Normal-Form-2.js')
      conversation.fileId = ''
      conversation.fileName = ''
      conversation.draft = 'Create another'
      assert.equal(await vm.generate(), true)
      assert.equal(created[1].name, 'Cantor-Normal-Form-3.js')
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('another conversation can be opened while a request is running', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let resolveGeneration
   const pending = new Promise((resolve) => { resolveGeneration = resolve })

   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         return { file: { id: 'background-file', name, source, enabled: false, trusted: !!trusted } }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      generate() { return pending },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const first = {
      id: 'first', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [first]
   vm.activeConversationId = first.id

   try {
      const generation = vm.generate()
      await Promise.resolve()
      assert.equal(first.busy, true)
      const second = vm.createConversation()
      assert.ok(second)
      assert.equal(vm.activeConversationId, second.id)
      resolveGeneration({
         source: 'register.push({ id: "background" });',
         raw: 'background result',
         validation: { valid: true },
      })
      assert.equal(await generation, true)
      assert.equal(first.busy, false)
      assert.equal(vm.activeConversationId, second.id)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('a running conversation can be stopped without reporting generation failure', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let createCalls = 0

   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         createCalls++
         return { file: { id: 'background-file', name, source, enabled: false, trusted: !!trusted } }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      generate(options) {
         return new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
               const error = new Error('The operation was aborted.')
               error.name = 'AbortError'
               reject(error)
            }, { once: true })
         })
      },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const conversation = {
      id: 'stoppable', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', activity: [],
      startedAt: 0, finishedAt: 0, createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      const generation = vm.generate()
      await Promise.resolve()
      assert.equal(vm.stopGeneration(conversation), true)
      assert.equal(await generation, false)
      assert.equal(createCalls, 0)
      assert.equal(conversation.error, '')
      assert.match(conversation.notice, /stopped|cancelled/i)
      assert.equal(conversation.activity.at(-1).type, 'generation_cancelled')
      assert.match(component.template, /@click="stopGeneration\(activeConversation\)"/)

      globalThis.AINotationAssistant = {
         writeSessionSettings() {},
         async generate(options) {
            assert.equal(options.prompt, 'Create one')
            return {
               source: 'register.push({ id: "restarted" });',
               raw: 'restart result',
               validation: { valid: true },
            }
         },
      }
      assert.equal(await vm.restartGeneration(conversation), true)
      assert.equal(conversation.cancelled, false)
      assert.equal(conversation.fileId, 'background-file')
      assert.equal(createCalls, 1)
      assert.match(component.template, /@click="restartGeneration\(activeConversation\)"/)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('the active conversation exposes live agent-loop progress before completion', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let reportProgress
   let resolveGeneration

   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         return { file: { id: 'progress-file', name, source, enabled: false, trusted: !!trusted } }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      generate(options) {
         reportProgress = options.onProgress
         return new Promise((resolve) => { resolveGeneration = resolve })
      },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const conversation = {
      id: 'progress', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', activity: [],
      startedAt: 0, finishedAt: 0, createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      const generation = vm.generate()
      await Promise.resolve()
      assert.equal(typeof reportProgress, 'function')

      reportProgress({
         type: 'model_request_started', protocol: 'responses', round: 1,
         toolsEnabled: true, timestamp: 100,
      })
      reportProgress({ type: 'model_reasoning_stream', round: 1, chars: 12, timestamp: 100 })
      reportProgress({ type: 'model_reasoning_stream', round: 1, chars: 48, timestamp: 101 })
      reportProgress({
         type: 'tool_call_preparing', round: 1, key: 'call-list', name: 'list_notations',
         argumentsText: '{}', chars: 2, timestamp: 101,
      })
      reportProgress({
         type: 'tool_call_started', round: 1, name: 'list_notations', arguments: {}, timestamp: 101,
      })
      reportProgress({
         type: 'tool_call_finished', round: 1, name: 'list_notations', ok: true,
         result: { main: [{ id: 'fixture' }] }, elapsedMs: 2, timestamp: 103,
      })
      reportProgress({
         type: 'model_output_stream', round: 2, chars: 42,
         text: '```js\nregister.push({ id: "preview" });\n```', timestamp: 104,
      })

      assert.deepEqual(
         conversation.activity.map((entry) => entry.type),
         [
            'model_request_started',
            'model_reasoning_stream',
            'tool_call_preparing',
            'tool_call_started',
            'tool_call_finished',
            'model_output_stream',
         ]
      )
      assert.equal(conversation.activity[1].chars, 48)
      assert.match(vm.activityLabel(conversation.activity[0]), /Responses/)
      assert.match(conversation.activity[2].detail, /list_notations/)
      assert.match(conversation.activity[3].detail, /list_notations|\{\}/)
      assert.match(conversation.activity[4].detail, /fixture/)
      assert.match(conversation.activity[5].detail, /register\.push/)
      assert.match(component.template, /ne-ai-page__activity/)

      resolveGeneration({
         source: 'register.push({ id: "progress" });',
         raw: 'progress result',
         validation: { valid: true },
      })
      assert.equal(await generation, true)
      assert.equal(conversation.busy, false)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('progress redaction stays bound to the key captured by its request', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let reportProgress
   let resolveGeneration
   const requestKey = 'request-secret-12345'

   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         return { file: { id: 'redaction-file', name, source, enabled: false, trusted: !!trusted } }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      generate(options) {
         reportProgress = options.onProgress
         return new Promise((resolve) => { resolveGeneration = resolve })
      },
   }

   const vm = createVm({ apiKey: requestKey })
   const conversation = {
      id: 'redaction', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', activity: [],
      startedAt: 0, finishedAt: 0, createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      const generation = vm.generate()
      await Promise.resolve()
      vm.apiKey = 'different-session-key-67890'
      reportProgress({
         type: 'model_output_stream', round: 1, chars: 30,
         text: 'echo ' + requestKey.slice(0, 10), timestamp: 100,
      })
      assert.doesNotMatch(JSON.stringify(conversation.activity), new RegExp(requestKey.slice(0, 10)))
      assert.match(JSON.stringify(conversation.activity), /\[REDACTED\]/)

      resolveGeneration({
         source: 'register.push({ id: "redacted" });',
         raw: 'safe result',
         validation: { valid: true },
      })
      assert.equal(await generation, true)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('fallback and completion events settle prior running activity', () => {
   const vm = createVm()
   const conversation = {
      id: 'fallback-state', activity: [], activityAnnouncement: '',
   }

   vm.recordActivity(conversation, {
      type: 'model_request_started', protocol: 'chat_completions', round: 1, timestamp: 100,
   }, 'secret-key')
   vm.recordActivity(conversation, {
      type: 'protocol_fallback_started', round: 1, timestamp: 101,
   }, 'secret-key')
   assert.equal(conversation.activity[0].state, 'done')

   vm.recordActivity(conversation, {
      type: 'model_request_started', protocol: 'responses', round: 2, timestamp: 102,
   }, 'secret-key')
   vm.recordActivity(conversation, {
      type: 'model_response_received', protocol: 'responses', round: 2,
      text: 'final response preview', timestamp: 103,
   }, 'secret-key')
   vm.recordActivity(conversation, {
      type: 'model_output_stream', protocol: 'responses', round: 3,
      chars: 12, text: 'final output', timestamp: 104,
   }, 'secret-key')
   vm.recordActivity(conversation, {
      type: 'generation_completed', protocol: 'responses', round: 3, timestamp: 105,
   }, 'secret-key')

   assert.equal(conversation.activity.filter((entry) => entry.state === 'running').length, 0)
   assert.match(conversation.activity[3].detail, /final response preview/)
   assert.match(component.template, /activity-live[^>]*role="status"/)
   assert.doesNotMatch(component.template, /ne-ai-page__activity" aria-live/)
})

test('activity retains all rounds during a long run', () => {
   const vm = createVm()
   const conversation = { id: 'long-activity', activity: [], activityAnnouncement: '' }
   for (let round = 1; round <= 130; round++) {
      vm.recordActivity(conversation, {
         type: 'model_request_started', protocol: 'chat_completions', round, timestamp: round,
      }, 'secret-key')
      vm.recordActivity(conversation, {
         type: 'model_response_received', protocol: 'chat_completions', round, timestamp: round,
      }, 'secret-key')
   }
   assert.equal(conversation.activity.length, 260)
   assert.equal(conversation.activity[0].round, 1)
   assert.equal(conversation.activity.at(-1).round, 130)
})

test('generation rechecks linked-file trust after the API request', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let resolveGeneration
   const linked = {
      id: 'linked', name: 'AI-Notation.js', source: 'old', sourceRevision: 1,
      enabled: false, trusted: false,
   }
   const created = []
   let draftWrites = 0

   globalThis.localNotationManager = {
      listFiles() { return [linked].concat(created) },
      getFile(id) { return id === linked.id ? linked : created.find((file) => file.id === id) || null },
      getDraft() { return null },
      setDraft() { draftWrites++ },
      createUpload(name, source, trusted) {
         const file = {
            id: 'replacement', name, source, sourceRevision: 1,
            enabled: false, trusted: !!trusted,
         }
         created.push(file)
         return { file }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      generate() {
         return new Promise((resolve) => { resolveGeneration = resolve })
      },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const conversation = {
      id: 'trust-race', title: '', draft: 'Refine it', messages: [], toolMode: 'auto',
      fileId: linked.id, fileName: linked.name, busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      const generation = vm.generate()
      await Promise.resolve()
      linked.enabled = true
      linked.trusted = true
      resolveGeneration({
         source: 'register.push({ id: "replacement" });',
         raw: 'replacement result',
         validation: { valid: true },
      })
      assert.equal(await generation, true)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(draftWrites, 0)
   assert.equal(created.length, 1)
   assert.equal(created[0].enabled, false)
   assert.equal(created[0].trusted, false)
   assert.equal(conversation.fileId, 'replacement')
})

test('an API response that echoes the key is discarded before persistence', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let createCalls = 0
   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload() { createCalls++ },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate() {
         return {
            source: 'register.push({ id: "leaked", key: "secret-key" });',
            raw: 'The credential was secret-key',
            validation: { valid: true },
         }
      },
   }
   const vm = createVm({ apiKey: 'secret-key' })
   const conversation = {
      id: 'leak', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      assert.equal(await vm.generate(), false)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(createCalls, 0)
   assert.match(conversation.error, /API key/i)
   assert.deepEqual(conversation.messages, [])
   assert.equal(conversation.draft, 'Create one')
})

test('short compatibility placeholder keys do not reject ordinary source words', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let created
   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         created = { name, source, trusted }
         return { file: { id: 'short-key-file', name, source, enabled: false, trusted: !!trusted } }
      },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate() {
         return {
            source: 'register.push({ id: "key-sequence" });',
            raw: 'Generated a key-sequence notation.',
            validation: { valid: true },
         }
      },
   }
   const vm = createVm({ apiKey: 'key' })
   const conversation = {
      id: 'short-key', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      assert.equal(await vm.generate(), true)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(created.trusted, false)
   assert.match(created.source, /key-sequence/)
})

test('standalone short API keys are discarded and API errors are redacted', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let createCalls = 0
   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload() { createCalls++ },
   }
   const vm = createVm({ apiKey: 'key' })
   const conversation = {
      id: 'short-key-leak', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', activity: [],
      createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      globalThis.AINotationAssistant = {
         writeSessionSettings() {},
         async generate() {
            return {
               source: 'register.push({ id: "leaked", apiKey: "key" });',
               raw: 'Credential: key',
               validation: { valid: true },
            }
         },
      }
      assert.equal(await vm.generate(), false)
      assert.equal(createCalls, 0)
      assert.match(conversation.error, /API key/i)

      conversation.draft = 'Retry'
      globalThis.AINotationAssistant = {
         writeSessionSettings() {},
         async generate() { throw new Error('Upstream echoed key in an error') },
      }
      assert.equal(await vm.generate(), false)
      assert.doesNotMatch(conversation.error, /key/)
      assert.match(conversation.error, /\[REDACTED\]/)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }
})

test('API failures preserve the draft and do not create a local file', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   let createCalls = 0
   globalThis.localNotationManager = {
      listFiles() { return [] },
      createUpload() { createCalls++ },
   }
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate() { throw new Error('CORS request failed') },
   }

   const vm = createVm({ apiKey: 'session-key' })
   const conversation = {
      id: 'failed', title: '', draft: 'Create one', messages: [], toolMode: 'auto',
      fileId: '', fileName: '', busy: false, error: '', notice: '', createdAt: 1, updatedAt: 1,
   }
   vm.conversations = [conversation]
   vm.activeConversationId = conversation.id

   try {
      assert.equal(await vm.generate(), false)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(createCalls, 0)
   assert.equal(conversation.error, 'CORS request failed')
   assert.equal(conversation.draft, 'Create one')
   assert.deepEqual(conversation.messages, [])
   assert.equal(conversation.busy, false)
})

test('generated files can be opened in the existing local editor', async () => {
   const originalRuntime = globalThis.localNotationManager
   const selected = []
   globalThis.localNotationManager = {
      getFile(id) { return id === 'generated-file' ? { id, name: 'AI-Notation.js' } : null },
   }
   const app = {
      lang: 'en',
      $refs: {
         localNotationManagerComponent: {
            refreshFiles(id, reload) { selected.push({ id, reload }) },
         },
      },
      async navigateToPage(page) { selected.push({ page }) },
      $nextTick(callback) { callback() },
   }
   const vm = createVm({ $root: app })
   const conversation = {
      id: 'open', fileId: 'generated-file', fileName: 'AI-Notation.js',
      busy: false, error: '', notice: '', messages: [], draft: '', toolMode: 'auto', createdAt: 1, updatedAt: 1,
   }

   try {
      assert.equal(await vm.openInEditor(conversation), true)
   } finally {
      globalThis.localNotationManager = originalRuntime
   }

   assert.deepEqual(selected, [
      { page: 'settings' },
      { id: 'generated-file', reload: true },
   ])
})
