'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const assistant = require('../js/ai-notation-assistant.js')

function withGlobals(values, callback) {
   const previous = new Map()
   Object.keys(values).forEach((key) => {
      previous.set(key, Object.prototype.hasOwnProperty.call(global, key)
         ? { present: true, value: global[key] }
         : { present: false })
      global[key] = values[key]
   })
   try {
      return callback()
   } finally {
      previous.forEach((entry, key) => {
         if (entry.present) global[key] = entry.value
         else delete global[key]
      })
   }
}

async function withGlobalsAsync(values, callback) {
   const previous = new Map()
   Object.keys(values).forEach((key) => {
      previous.set(key, Object.prototype.hasOwnProperty.call(global, key)
         ? { present: true, value: global[key] }
         : { present: false })
      global[key] = values[key]
   })
   try {
      return await callback()
   } finally {
      previous.forEach((entry, key) => {
         if (entry.present) global[key] = entry.value
         else delete global[key]
      })
   }
}

function fixtureNotation() {
   return {
      id: 'fixture',
      name: 'Fixture',
      display(value) { return String(value) },
      fromDisplay(value) { return Number(value) },
      able() { return false },
      compare() { return 0 },
      FS(expression, index) { return [expression, index] },
      init() { return [{ expr: 0, low: [0], subitems: [] }] },
   }
}

test('tool definitions use valid Chat Completions function schemas', () => {
   const tools = assistant.toolDefinitions()
   assert.deepEqual(
      tools.map((tool) => tool.function.name),
      ['list_notations', 'inspect_notation', 'expand', 'detect_inf_chain', 'validate_source']
   )
   tools.forEach((tool) => {
      assert.equal(tool.type, 'function')
      assert.equal(tool.function.parameters.type, 'object')
   })
   assert.equal(tools[2].function.parameters.properties.expression.type, 'string')
})

test('validateSource compiles syntax and never invokes generated source', () => {
   const source = `
      globalThis.__aiValidationExecuted = true;
      register.push({
         id: 'generated', name: 'Generated',
         display: function () { return ''; },
         able: function () { return false; },
         compare: function () { return 0; },
         FS: function () { return []; },
         init: function () { return []; }
      });
   `
   const observed = withGlobals({ __aiValidationExecuted: false }, () => ({
      result: assistant.validateSource(source, 'generated.js'),
      executed: global.__aiValidationExecuted,
   }))
   const result = observed.result
   assert.equal(result.valid, true)
   assert.deepEqual(result.mainIds, ['generated'])
   assert.equal(observed.executed, false)
})

test('validate_source does not call the live registry or mutate it', () => {
   let prepareCalls = 0
   const before = []
   const result = withGlobals({
      register: before,
      analysis_register: [],
      notationRegistryHub: {
         prepareSource() {
            prepareCalls++
            throw new Error('must not be called')
         },
      },
   }, () => assistant.runTool('validate_source', {
      file_name: 'generated.js',
      source: `register.push({
         id: 'generated', name: 'Generated', display() { return ''; },
         able() { return false; }, compare() { return 0; },
         FS() { return []; }, init() { return []; }
      })`,
   }))

   assert.equal(result.valid, true)
   assert.equal(prepareCalls, 0)
   assert.deepEqual(before, [])
})

test('tool adapters use the existing registry and debug detector', () => {
   const notation = fixtureNotation()
   let detectorArgs
   const detectorResult = [{ reason: 'TERM', found: false, chain: [], visited: 1, start: [1] }]
   const result = withGlobals({
      register: [notation],
      analysis_register: [],
      debugTools: {
         detectInfChain(target, options) {
            assert.equal(target, notation)
            detectorArgs = options
            return detectorResult
         },
      },
   }, () => ({
      list: assistant.runTool('list_notations', {}),
      inspected: assistant.runTool('inspect_notation', { notation_id: 'fixture' }),
      expanded: assistant.runTool('expand', { notation_id: 'fixture', expression: '2', indexes: [0, 1] }),
      detected: assistant.runTool('detect_inf_chain', {
         notation_id: 'fixture', limitTerm: 2, maxSteps: 3, maxN: 1, preview: 2, maxVisited: 10,
      }),
   }))

   assert.equal(result.list.main[0].id, 'fixture')
   assert.equal(result.inspected.id, 'fixture')
   assert.deepEqual(result.expanded.terms.map((term) => term.index), [0, 1])
   assert.deepEqual(result.detected, detectorResult)
   assert.deepEqual(detectorArgs, { limitTerm: 2, maxSteps: 3, maxN: 1, preview: 2, maxVisited: 10 })
})

test('expand delegates contiguous requests to the mounted direct-expansion implementation', () => {
   const notation = fixtureNotation()
   let request
   const result = withGlobals({
      register: [notation],
      notationExplorerApp: {
         directExpansionOutput(value) {
            request = value
            return 'Notation: Fixture (fixture)\nFS(0) = 2'
         },
      },
   }, () => assistant.runTool('expand', {
      notation_id: 'fixture',
      expression: '2',
      indexes: [0],
   }))

   assert.deepEqual(request, {
      notationId: 'fixture',
      expression: '2',
      startN: 0,
      count: 1,
   })
   assert.match(result.output, /FS\(0\)/)
})

test('generated source is returned without executing it', async () => {
   const source = `globalThis.__aiGenerateExecuted = true;
      register.push({ id: 'generated', name: 'Generated', display() { return ''; },
         able() { return false; }, compare() { return 0; }, FS() { return []; }, init() { return []; } });`
   const response = {
      ok: true,
      async text() {
         return JSON.stringify({ choices: [{ message: { content: '```js\n' + source + '\n```' } }] })
      },
   }
   await withGlobalsAsync({
      __aiGenerateExecuted: false,
      fetch: async () => response,
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'session-only-key',
         baseUrl: 'https://example.test',
         model: 'fixture-model',
         prompt: 'Create a notation.',
         context: 'fixture context',
      })
      assert.equal(result.validation.valid, true)
      assert.match(result.source, /register\.push/)
      assert.equal(global.__aiGenerateExecuted, false)
   })
})

test('tool incompatibility retries once without tools, but tool-loop errors do not downgrade', async () => {
   const calls = []
   const responses = [
      {
         ok: false,
         status: 400,
         async text() { return JSON.stringify({ error: { message: 'Unsupported parameter: tools' } }) },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({ choices: [{ message: { content: '```js\nregister.push({id:"fallback",name:"Fallback",display(){return ""},able(){return false},compare(){return 0},FS(){return []},init(){return []}})\n```' } }] })
         },
      },
   ]
   await withGlobalsAsync({
      fetch: async (_endpoint, options) => {
         calls.push(JSON.parse(options.body))
         return responses.shift()
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({ apiKey: 'key', baseUrl: 'https://example.test', prompt: 'fallback', context: 'ctx' })
      assert.equal(result.usedTools, false)
      assert.equal(calls.length, 2)
      assert.equal(Object.prototype.hasOwnProperty.call(calls[0], 'tools'), true)
      assert.equal(Object.prototype.hasOwnProperty.call(calls[1], 'tools'), false)
   })
})

test('tool loop stops with a safety error after the configured round limit', async () => {
   const toolCallResponse = {
      ok: true,
      async text() {
         return JSON.stringify({ choices: [{ message: {
            tool_calls: [{ id: 'call-1', function: { name: 'list_notations', arguments: '{}' } }],
         } }] })
      },
   }
   await assert.rejects(
      () => withGlobalsAsync({
         register: [],
         analysis_register: [],
         fetch: async () => toolCallResponse,
         sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
      }, () => assistant.generate({ apiKey: 'key', baseUrl: 'https://example.test', prompt: 'loop', context: 'ctx' })),
      /safety limit/
   )
})

test('authoring context is bundled and generation does not fetch the guide', async () => {
   const originalFetch = global.fetch
   let fetchCalls = 0
   global.fetch = async function () {
      fetchCalls++
      throw new Error('documentation fetch must not be needed')
   }
   try {
      const context = await assistant.fetchContext()
      assert.match(context, /如何开发一个记号文件/)
      assert.match(context, /## Built-in PrSS template/)
      assert.match(context, /register_notation/)
      assert.match(context, /FS\(expr, n\)/)
      assert.equal(fetchCalls, 0)
   } finally {
      global.fetch = originalFetch
   }
})

test('API key settings use sessionStorage only and tolerate storage failures', () => {
   const values = new Map()
   const sessionStorage = {
      setItem(key, value) { values.set(key, String(value)) },
      getItem(key) { return values.get(key) || null },
      removeItem(key) { values.delete(key) },
   }
   withGlobals({ sessionStorage }, () => {
      assistant.writeSessionSettings({
         baseUrl: 'https://proxy.example.test',
         apiKey: 'session-only',
         model: 'fixture',
      })
      assert.deepEqual(assistant.readSessionSettings(), {
         baseUrl: 'https://proxy.example.test',
         apiKey: 'session-only',
         model: 'fixture',
      })
      assistant.clearSessionApiKey()
      assert.equal(values.has(assistant.SESSION_KEYS.apiKey), false)
   })

   assert.equal(
      assistant.normalizeEndpoint('https://proxy.example.test/chat/completions'),
      'https://proxy.example.test/chat/completions'
   )
})

test('API key is sent in Authorization and never embedded in the prompt body', async () => {
   const requests = []
   const response = {
      ok: true,
      async text() {
         return JSON.stringify({ choices: [{ message: {
            content: '```js\nregister.push({ id: "secret-check" });\n```',
         } }] })
      },
   }
   await withGlobalsAsync({
      fetch: async (_endpoint, options) => {
         requests.push(options)
         return response
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      await assistant.generate({
         apiKey: 'do-not-inline-this-key',
         baseUrl: 'https://example.test',
         prompt: 'Create a notation.',
         context: 'fixture context',
      })
   })

   assert.equal(requests.length, 1)
   assert.equal(requests[0].headers.Authorization, 'Bearer do-not-inline-this-key')
   assert.doesNotMatch(requests[0].body, /do-not-inline-this-key/)
})
