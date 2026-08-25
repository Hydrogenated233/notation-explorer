'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const component = require('../js/local-notation-ui.js')
const renderer = require('../js/markdown-renderer.js')

test('exposes the bundled development guide from the local notation toolbar', () => {
   assert.match(component.template, /ref="guideButton"/)
   assert.match(component.template, /@click="openGuide"/)
   assert.match(component.template, /class="ne-local-guide__dialog"/)
   assert.match(component.template, /v-html="guideHtml"/)
   assert.equal(
      fs.existsSync(path.join(__dirname, '..', 'docs', 'making-a-notation.md')),
      true
   )

   const english = component.computed.copy.call({ $root: { lang: 'en' } })
   const chinese = component.computed.copy.call({ $root: { lang: 'zh' } })
   assert.equal(english.guide, 'Guide')
   assert.equal(chinese.guide, '\u5f00\u53d1\u6307\u5357')
})

test('loads and caches the rendered guide using the document base URL', async () => {
   const originalDocument = globalThis.document
   const originalFetch = globalThis.fetch
   const originalRenderer = globalThis.MarkdownRenderer
   const requested = []
   let dialogFocused = false

   globalThis.document = { baseURI: 'https://example.test/app/' }
   globalThis.MarkdownRenderer = renderer
   globalThis.fetch = async function(url) {
      requested.push(url)
      return {
         ok: true,
         async text() { return '# Loaded\n\nGuide body.' },
      }
   }

   const vm = Object.assign(component.data(), {
      copy: {
         guideUnavailable: 'Renderer unavailable.',
         guideLoadFailed: 'Load failed.',
      },
      $refs: {
         guideDialog: {
            setAttribute() {},
            focus() { dialogFocused = true },
         },
      },
      $nextTick(callback) { callback() },
   })
   vm.guideDocumentUrl = component.methods.guideDocumentUrl
   vm.focusGuideDialog = function() { component.methods.focusGuideDialog.call(vm) }
   vm.loadGuide = function() { return component.methods.loadGuide.call(vm) }

   try {
      await component.methods.openGuide.call(vm)
      await component.methods.openGuide.call(vm)
   } finally {
      globalThis.document = originalDocument
      globalThis.fetch = originalFetch
      globalThis.MarkdownRenderer = originalRenderer
   }

   assert.equal(vm.guideOpen, true)
   assert.equal(dialogFocused, true)
   assert.deepEqual(requested, ['https://example.test/app/docs/making-a-notation.md'])
   assert.match(vm.guideHtml, /<h1>Loaded<\/h1>/)
   assert.equal(vm.guideError, '')
   assert.equal(vm.guideLoading, false)
})

test('reports a guide fetch failure and succeeds when retried', async () => {
   const originalDocument = globalThis.document
   const originalFetch = globalThis.fetch
   const originalRenderer = globalThis.MarkdownRenderer
   let succeeds = false

   globalThis.document = { baseURI: 'https://example.test/subpath/' }
   globalThis.MarkdownRenderer = renderer
   globalThis.fetch = async function() {
      if (!succeeds) return { ok: false, status: 404 }
      return { ok: true, async text() { return '## Recovered' } }
   }

   const vm = Object.assign(component.data(), {
      copy: { guideUnavailable: 'Renderer unavailable.' },
   })
   vm.guideDocumentUrl = component.methods.guideDocumentUrl

   try {
      assert.equal(await component.methods.loadGuide.call(vm), '')
      assert.equal(vm.guideError, 'HTTP 404')
      succeeds = true
      assert.match(await component.methods.loadGuide.call(vm), /<h2>Recovered<\/h2>/)
   } finally {
      globalThis.document = originalDocument
      globalThis.fetch = originalFetch
      globalThis.MarkdownRenderer = originalRenderer
   }

   assert.equal(vm.guideError, '')
   assert.equal(vm.guideLoading, false)
})

test('keeps keyboard focus inside the guide and closes it from document Escape', () => {
   const originalDocument = globalThis.document
   const focused = []
   const first = {
      getAttribute() { return null },
      focus() { focused.push('first') },
   }
   const last = {
      getAttribute() { return null },
      focus() { focused.push('last') },
   }
   const dialog = {
      getAttribute() { return null },
      querySelectorAll() { return [first, last] },
      focus() { focused.push('dialog') },
   }
   let closed = 0
   const vm = Object.assign(component.data(), {
      guideOpen: true,
      $refs: { guideDialog: dialog },
      closeGuide() { closed++ },
   })
   vm.guideFocusableElements = function(target) {
      return component.methods.guideFocusableElements.call(vm, target)
   }

   function keyEvent(key, shiftKey) {
      return {
         key,
         shiftKey: !!shiftKey,
         prevented: false,
         stopped: false,
         preventDefault() { this.prevented = true },
         stopPropagation() { this.stopped = true },
      }
   }

   try {
      globalThis.document = { activeElement: last }
      const forward = keyEvent('Tab')
      component.methods.onGuideDocumentKeydown.call(vm, forward)
      assert.deepEqual(focused, ['first'])
      assert.equal(forward.prevented, true)
      assert.equal(forward.stopped, true)

      globalThis.document.activeElement = first
      const backward = keyEvent('Tab', true)
      component.methods.onGuideDocumentKeydown.call(vm, backward)
      assert.deepEqual(focused, ['first', 'last'])

      globalThis.document.activeElement = { outside: true }
      const escapedFocus = keyEvent('Tab')
      component.methods.onGuideDocumentKeydown.call(vm, escapedFocus)
      assert.deepEqual(focused, ['first', 'last', 'first'])

      const escape = keyEvent('Escape')
      component.methods.onGuideDocumentKeydown.call(vm, escape)
      assert.equal(closed, 1)
      assert.equal(escape.prevented, true)
      assert.equal(escape.stopped, true)
   } finally {
      globalThis.document = originalDocument
   }
})

test('downloadSource downloads the selected JavaScript source and revokes its URL', () => {
   const originalBlob = globalThis.Blob
   const originalURL = globalThis.URL
   const originalDocument = globalThis.document
   const originalSetTimeout = globalThis.setTimeout
   const events = []
   let createdBlob
   let createdLink

   class FakeBlob {
      constructor(parts, options) {
         this.parts = parts
         this.options = options
      }
   }

   globalThis.Blob = FakeBlob
   globalThis.URL = {
      createObjectURL(blob) {
         createdBlob = blob
         events.push('create-url')
         return 'blob:test'
      },
      revokeObjectURL(url) {
         events.push('revoke:' + url)
      },
   }
   globalThis.document = {
      createElement(tagName) {
         assert.equal(tagName, 'a')
         createdLink = {
            style: {},
            click() { events.push('click') },
         }
         return createdLink
      },
      body: {
         appendChild(link) {
            assert.equal(link, createdLink)
            events.push('append')
         },
         removeChild(link) {
            assert.equal(link, createdLink)
            events.push('remove')
         },
      },
   }
   globalThis.setTimeout = function(callback) {
      callback()
      return 1
   }

   try {
      component.methods.downloadSource('MyNotation', 'register.push({});')
   } finally {
      globalThis.Blob = originalBlob
      globalThis.URL = originalURL
      globalThis.document = originalDocument
      globalThis.setTimeout = originalSetTimeout
   }

   assert.deepEqual(createdBlob.parts, ['register.push({});'])
   assert.equal(createdBlob.options.type, 'text/javascript;charset=utf-8')
   assert.equal(createdLink.href, 'blob:test')
   assert.equal(createdLink.download, 'MyNotation.js')
   assert.equal(createdLink.style.display, 'none')
   assert.deepEqual(events, ['create-url', 'append', 'click', 'remove', 'revoke:blob:test'])
})

test('AI settings use the assistant session API and expose the CORS/key warning', () => {
   const originalAssistant = globalThis.AINotationAssistant
   const writes = []
   globalThis.AINotationAssistant = {
      DEFAULT_BASE_URL: 'https://api.example.test',
      DEFAULT_MODEL: 'fixture-model',
      readSessionSettings() {
         return { baseUrl: 'https://proxy.example.test', apiKey: 'session-key', model: 'stored-model' }
      },
      writeSessionSettings(settings) {
         writes.push(settings)
      },
   }

   const vm = Object.assign(component.data(), {
      aiAssistant: component.methods.aiAssistant,
   })
   try {
      component.methods.loadAiSettings.call(vm)
      assert.equal(vm.aiBaseUrl, 'https://proxy.example.test')
      assert.equal(vm.aiApiKey, 'session-key')
      assert.equal(vm.aiModel, 'stored-model')
      vm.aiApiKey = 'new-session-key'
      component.methods.saveAiSettings.call(vm)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
   }

   assert.equal(writes.length, 1)
   assert.equal(writes[0].apiKey, 'new-session-key')
   assert.match(component.computed.copy.call({ $root: { lang: 'en' } }).aiWarning, /CORS/)
})

test('AI generation creates a disabled untrusted file without running it', async () => {
   const originalAssistant = globalThis.AINotationAssistant
   const originalRuntime = globalThis.localNotationManager
   const calls = []
   const runtime = {
      listFiles() { return [] },
      createUpload(name, source, trusted) {
         calls.push({ name, source, trusted })
         assert.equal(trusted, false)
         return {
            file: { id: 'ai-file', name, source, enabled: false, trusted: false },
            enabled: false,
            change: null,
         }
      },
   }
   globalThis.localNotationManager = runtime
   globalThis.AINotationAssistant = {
      writeSessionSettings() {},
      async generate(options) {
         calls.push({ generate: options })
         return { source: 'register.push({ id: "generated" });', validation: { valid: true } }
      },
   }

   const refreshed = []
   const vm = Object.assign(component.data(), {
      aiAssistant: component.methods.aiAssistant,
      runtime: component.methods.runtime,
      nextAiFileName: component.methods.nextAiFileName,
      copy: component.computed.copy.call({ $root: { lang: 'en' } }),
      aiApiKey: 'session-key',
      aiPrompt: 'Create a notation',
      saveAiSettings() {},
      persistDraftNow() { return true },
      refreshFiles(id, reload) { refreshed.push({ id, reload }) },
      dirty: false,
   })

   try {
      assert.equal(await component.methods.generateWithAi.call(vm), true)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(calls.find((entry) => entry.generate).generate.fileName, 'AI-Notation.js')
   assert.deepEqual(calls.find((entry) => entry.name), {
      name: 'AI-Notation.js',
      source: 'register.push({ id: "generated" });',
      trusted: false,
   })
   assert.deepEqual(refreshed, [{ id: 'ai-file', reload: true }])
   assert.match(vm.notice, /disabled, untrusted/)
})

test('AI generation reports API errors and never creates a file on failure', async () => {
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

   const vm = Object.assign(component.data(), {
      aiAssistant: component.methods.aiAssistant,
      runtime: component.methods.runtime,
      nextAiFileName: component.methods.nextAiFileName,
      copy: component.computed.copy.call({ $root: { lang: 'en' } }),
      aiApiKey: 'session-key',
      aiPrompt: 'Create a notation',
      saveAiSettings() {},
      persistDraftNow() { return true },
      dirty: false,
   })

   try {
      assert.equal(await component.methods.generateWithAi.call(vm), false)
   } finally {
      globalThis.AINotationAssistant = originalAssistant
      globalThis.localNotationManager = originalRuntime
   }

   assert.equal(createCalls, 0)
   assert.equal(vm.aiError, 'CORS request failed')
   assert.equal(vm.aiBusy, false)
   assert.equal(vm.busy, false)
})
