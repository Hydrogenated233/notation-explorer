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

function sseResponse(events) {
   const encoder = new TextEncoder()
   const chunks = events.map((event) => encoder.encode(
      'event: ' + event.type + '\n' + 'data: ' + JSON.stringify(event) + '\n\n'
   ))
   let index = 0
   return {
      ok: true,
      status: 200,
      body: {
         getReader() {
            return {
               async read() {
                  if (index >= chunks.length) return { done: true, value: undefined }
                  return { done: false, value: chunks[index++] }
               },
            }
         },
      },
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

test('generation sends only the current conversation text history before the new request', async () => {
   const requests = []
   const response = {
      ok: true,
      async text() {
         return JSON.stringify({ choices: [{ message: {
            content: '```js\nregister.push({ id: "continued" });\n```',
         } }] })
      },
   }
   await withGlobalsAsync({
      fetch: async (_endpoint, options) => {
         requests.push(JSON.parse(options.body))
         return response
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      await assistant.generate({
         apiKey: 'session-only-key',
         baseUrl: 'https://example.test',
         model: 'fixture-model',
         prompt: 'Refine the prior notation.',
         context: 'fixture context',
         history: [
            { role: 'system', content: 'do not replay this' },
            { role: 'user', content: 'Create a sequence notation.' },
            { role: 'assistant', content: '```js\nregister.push({ id: "first" });\n```' },
            { role: 'tool', content: 'do not replay this either' },
         ],
      })
   })

   assert.equal(requests.length, 1)
   assert.deepEqual(
      requests[0].messages.map((message) => message.role),
      ['system', 'user', 'assistant', 'user']
   )
   assert.equal(requests[0].messages[1].content, 'Create a sequence notation.')
   assert.match(requests[0].messages[2].content, /id: "first"/)
   assert.equal(requests[0].messages[3].content, 'Refine the prior notation.')
})

test('tool loops report model rounds and tool execution before the final result', async () => {
   const events = []
   const responses = [
      {
         ok: true,
         async text() {
            return JSON.stringify({ choices: [{ message: {
               tool_calls: [{ id: 'call-list', function: { name: 'list_notations', arguments: '{}' } }],
            } }] })
         },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({ choices: [{ message: {
               content: '```js\nregister.push({ id: "progress" });\n```',
            } }] })
         },
      },
   ]

   await withGlobalsAsync({
      register: [],
      analysis_register: [],
      fetch: async () => responses.shift(),
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      await assistant.generate({
         apiKey: 'key',
         baseUrl: 'https://example.test',
         prompt: 'Show progress.',
         context: 'ctx',
         onProgress(event) { events.push(event) },
      })
   })

   assert.deepEqual(events.map((event) => event.type), [
      'model_request_started',
      'model_response_received',
      'tool_call_started',
      'tool_call_finished',
      'model_request_started',
      'model_response_received',
      'generation_completed',
   ])
   assert.equal(events[0].round, 1)
   assert.equal(events[2].name, 'list_notations')
   assert.deepEqual(events[2].arguments, {})
   assert.equal(events[3].ok, true)
   assert.equal(events[4].round, 2)
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
      assert.equal(result.toolMode, 'plain')
      assert.equal(calls.length, 2)
      assert.equal(Object.prototype.hasOwnProperty.call(calls[0], 'tools'), true)
      assert.equal(Object.prototype.hasOwnProperty.call(calls[1], 'tools'), false)
   })
})

test('an unavailable Chat Completions endpoint falls back to a Responses tool loop', async () => {
   const requests = []
   const events = []
   const responses = [
      {
         ok: false,
         status: 502,
         async text() {
            return JSON.stringify({ status: 'failed', message: '当前中转未启用 Chat Completions 协议代理' })
         },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({
               id: 'response-1',
               output: [
                  {
                     type: 'reasoning',
                     id: 'reasoning-1',
                     status: 'completed',
                     content: [],
                     encrypted_content: 'opaque-reasoning',
                  },
                  {
                     type: 'function_call',
                     id: 'item-1',
                     call_id: 'call-list',
                     name: 'list_notations',
                     arguments: '{}',
                  },
               ],
            })
         },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({
               id: 'response-2',
               output: [{
                  type: 'message',
                  role: 'assistant',
                  content: [{
                     type: 'output_text',
                     text: '```js\nregister.push({ id: "responses-fallback" });\n```',
                  }],
               }],
            })
         },
      },
   ]

   await withGlobalsAsync({
      register: [],
      analysis_register: [],
      fetch: async (endpoint, options) => {
         requests.push({ endpoint, body: JSON.parse(options.body) })
         return responses.shift()
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'key',
         baseUrl: 'http://127.0.0.1:57321/v1',
         model: 'deepseek-v4-flash',
         prompt: 'Create a notation.',
         context: 'ctx',
         onProgress(event) { events.push(event) },
      })

      assert.equal(result.protocol, 'responses')
      assert.equal(result.usedTools, true)
      assert.match(result.source, /responses-fallback/)
      assert.match(result.endpoint, /\/v1\/responses$/)
   })

   assert.equal(requests.length, 3)
   assert.match(requests[0].endpoint, /\/v1\/chat\/completions$/)
   assert.match(requests[1].endpoint, /\/v1\/responses$/)
   assert.equal(requests[1].body.tools[0].name, 'list_notations')
   assert.equal(Object.prototype.hasOwnProperty.call(requests[1].body.tools[0], 'function'), false)
   assert.deepEqual(
      requests[2].body.input.slice(-3).map((item) => item.type),
      ['reasoning', 'function_call', 'function_call_output']
   )
   assert.equal(Object.prototype.hasOwnProperty.call(requests[2].body, 'previous_response_id'), false)
   const protocolFallback = events.find((event) => event.type === 'protocol_fallback_started')
   assert.equal(protocolFallback.round, 1)
   const finalResponse = events.filter((event) => event.type === 'model_response_received').at(-1)
   assert.match(finalResponse.text, /responses-fallback/)
})

test('Responses streaming reports reasoning, tool preparation, and output deltas live', async () => {
   const events = []
   const responses = [
      {
         ok: false,
         status: 502,
         async text() {
            return JSON.stringify({ status: 'failed', message: 'Chat Completions not enabled' })
         },
      },
      sseResponse([
         { type: 'response.output_text.delta', item_id: 'SSE-Keep-Alive', delta: '\u200b' },
         { type: 'response.created', response: { id: 'response-stream-1', output: [] } },
         { type: 'response.reasoning_text.delta', delta: 'planning ' },
         { type: 'response.reasoning_text.delta', delta: 'tools' },
         { type: 'response.reasoning_text.done', text: 'planning tools' },
         {
            type: 'response.output_item.added',
            output_index: 1,
            item: {
               type: 'function_call', id: 'item-list', call_id: 'call-list',
               name: 'list_notations', arguments: '',
            },
         },
         {
            type: 'response.function_call_arguments.delta',
            output_index: 1, item_id: 'item-list', delta: '{}',
         },
         {
            type: 'response.function_call_arguments.done',
            output_index: 1, item_id: 'item-list', arguments: '{}',
         },
         {
            type: 'response.completed',
            response: {
               id: 'response-stream-1',
               output: [{
                  type: 'function_call', id: 'item-list', call_id: 'call-list',
                  name: 'list_notations', arguments: '{}',
               }],
            },
         },
      ]),
      sseResponse([
         { type: 'response.output_text.delta', delta: '```js\n' },
         { type: 'response.output_text.delta', delta: 'register.push({ id: "streamed" });\n```' },
         { type: 'response.output_text.done', text: '```js\nregister.push({ id: "streamed" });\n```' },
         {
            type: 'response.completed',
            response: {
               id: 'response-stream-2',
               output: [{
                  type: 'message', role: 'assistant',
                  content: [{ type: 'output_text', text: '```js\nregister.push({ id: "streamed" });\n```' }],
               }],
            },
         },
      ]),
   ]

   await withGlobalsAsync({
      register: [],
      analysis_register: [],
      fetch: async () => responses.shift(),
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'key',
         baseUrl: 'http://example.test/v1',
         prompt: 'Stream progress.',
         context: 'ctx',
         onProgress(event) { events.push(event) },
      })
      assert.match(result.source, /streamed/)
      assert.equal(result.protocol, 'responses')
   })

   const reasoning = events.filter((event) => event.type === 'model_reasoning_stream')
   const preparing = events.filter((event) => event.type === 'tool_call_preparing')
   const output = events.filter((event) => event.type === 'model_output_stream')
   assert.equal(reasoning.at(-1).chars, 'planning tools'.length)
   assert.equal(preparing.at(-1).name, 'list_notations')
   assert.equal(preparing.at(-1).argumentsText, '{}')
   assert.equal(output.at(-1).chars > 20, true)
   assert.match(output.at(-1).text, /register\.push/)
   assert.equal(output.some((event) => event.chars === 1), false)
})

test('Responses incomplete streams report the endpoint reason', async () => {
   const responses = [
      {
         ok: false,
         status: 502,
         async text() { return JSON.stringify({ message: 'Chat Completions not enabled' }) },
      },
      sseResponse([{
         type: 'response.incomplete',
         response: {
            id: 'incomplete-1',
            status: 'incomplete',
            incomplete_details: { reason: 'max_output_tokens' },
            output: [],
         },
      }]),
   ]

   await assert.rejects(
      () => withGlobalsAsync({
         fetch: async () => responses.shift(),
         sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
      }, () => assistant.generate({
         apiKey: 'key', baseUrl: 'https://example.test/v1', prompt: 'incomplete', context: 'ctx',
         onProgress() {},
      })),
      /incomplete: max_output_tokens/
   )
})

test('non-streaming Responses fallback rejects incomplete and failed results', async () => {
   async function rejectsTerminalResult(result, expected) {
      const responses = [
         {
            ok: false,
            status: 502,
            async text() { return JSON.stringify({ message: 'Chat Completions not enabled' }) },
         },
         {
            ok: false,
            status: 501,
            async text() { return JSON.stringify({ message: 'Streaming not implemented' }) },
         },
         {
            ok: true,
            status: 200,
            async text() { return JSON.stringify(result) },
         },
      ]
      await assert.rejects(
         () => withGlobalsAsync({
            fetch: async () => responses.shift(),
            sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
         }, () => assistant.generate({
            apiKey: 'key', baseUrl: 'https://example.test/v1', prompt: 'terminal state',
            context: 'ctx', onProgress() {},
         })),
         expected
      )
   }

   await rejectsTerminalResult({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output_text: '```js\nregister.push({ id: "partial" });\n```',
   }, /incomplete: max_output_tokens/)

   await rejectsTerminalResult({
      status: 'failed',
      error: { message: 'upstream generation failed' },
      output: [],
   }, /upstream generation failed/)
})

test('Chat Completions streaming exposes reasoning and tool argument progress', async () => {
   const requests = []
   const events = []
   const responses = [
      sseResponse([
         {
            type: 'chat.completion.chunk',
            choices: [{ delta: { reasoning_content: 'checking tools' }, finish_reason: null }],
         },
         {
            type: 'chat.completion.chunk',
            choices: [{ delta: {
               tool_calls: [{
                  index: 0, id: 'call-list', type: 'function',
                  function: { name: 'list_notations', arguments: '' },
               }],
            }, finish_reason: null }],
         },
         {
            type: 'chat.completion.chunk',
            choices: [{ delta: {
               tool_calls: [{ index: 0, function: { arguments: '{}' } }],
            }, finish_reason: 'tool_calls' }],
         },
      ]),
      sseResponse([
         {
            type: 'chat.completion.chunk',
            choices: [{ delta: { content: '```js\n' }, finish_reason: null }],
         },
         {
            type: 'chat.completion.chunk',
            choices: [{
               delta: { content: 'register.push({ id: "chat-stream" });\n```' },
               finish_reason: 'stop',
            }],
         },
      ]),
   ]

   await withGlobalsAsync({
      register: [],
      analysis_register: [],
      fetch: async (_endpoint, options) => {
         requests.push(JSON.parse(options.body))
         return responses.shift()
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'key',
         baseUrl: 'https://example.test/v1',
         prompt: 'Use a tool.',
         context: 'ctx',
         onProgress(event) { events.push(event) },
      })
      assert.equal(result.protocol, 'chat_completions')
      assert.equal(result.usedTools, true)
      assert.match(result.source, /chat-stream/)
   })

   assert.equal(requests.every((body) => body.stream === true), true)
   assert.equal(requests[1].messages.some((message) => message.role === 'tool'), true)
   assert.equal(events.some((event) => event.type === 'model_reasoning_stream'), true)
   const preparing = events.filter((event) => event.type === 'tool_call_preparing')
   assert.equal(preparing.at(-1).name, 'list_notations')
   assert.equal(preparing.at(-1).argumentsText, '{}')
   assert.equal(events.some((event) => event.type === 'model_output_stream'), true)
   assert.match(events.filter((event) => event.type === 'model_output_stream').at(-1).text, /chat-stream/)
})

test('stream and tool capability errors stay on Chat Completions fallbacks', async () => {
   const streamRequests = []
   const streamEvents = []
   const streamResponses = [
      {
         ok: false,
         status: 501,
         async text() { return JSON.stringify({ message: 'Streaming not implemented' }) },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({ choices: [{ message: {
               content: '```js\nregister.push({ id: "non-stream-chat" });\n```',
            } }] })
         },
      },
   ]
   await withGlobalsAsync({
      fetch: async (endpoint, options) => {
         streamRequests.push({ endpoint, body: JSON.parse(options.body) })
         return streamResponses.shift()
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'key', baseUrl: 'https://example.test/v1', prompt: 'fallback', context: 'ctx',
         onProgress(event) { streamEvents.push(event) },
      })
      assert.equal(result.protocol, 'chat_completions')
      assert.match(result.source, /non-stream-chat/)
   })
   assert.equal(streamRequests.length, 2)
   assert.equal(streamRequests[0].body.stream, true)
   assert.equal(Object.prototype.hasOwnProperty.call(streamRequests[1].body, 'stream'), false)
   assert.equal(streamRequests.every((request) => /chat\/completions$/.test(request.endpoint)), true)
   assert.equal(streamEvents.some((event) => event.type === 'stream_fallback_started'), true)

   const toolRequests = []
   const toolResponses = [
      {
         ok: false,
         status: 404,
         async text() { return JSON.stringify({ message: 'Function tools are not supported' }) },
      },
      {
         ok: true,
         async text() {
            return JSON.stringify({ choices: [{ message: {
               content: '```js\nregister.push({ id: "plain-chat" });\n```',
            } }] })
         },
      },
   ]
   await withGlobalsAsync({
      fetch: async (endpoint, options) => {
         toolRequests.push({ endpoint, body: JSON.parse(options.body) })
         return toolResponses.shift()
      },
      sessionStorage: { setItem() {}, removeItem() {}, getItem() { return null } },
   }, async () => {
      const result = await assistant.generate({
         apiKey: 'key', baseUrl: 'https://example.test/v1', prompt: 'fallback', context: 'ctx',
         onProgress() {},
      })
      assert.equal(result.protocol, 'chat_completions')
      assert.equal(result.toolMode, 'plain')
      assert.match(result.source, /plain-chat/)
   })
   assert.equal(toolRequests.length, 2)
   assert.equal(toolRequests.every((request) => /chat\/completions$/.test(request.endpoint)), true)
   assert.equal(Object.prototype.hasOwnProperty.call(toolRequests[1].body, 'tools'), false)
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
