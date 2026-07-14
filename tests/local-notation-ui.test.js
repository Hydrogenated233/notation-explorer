'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const component = require('../js/local-notation-ui.js')

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
