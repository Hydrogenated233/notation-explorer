'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const display = require('../js/notation-display.js')

function legacyNotation() {
   return {
      id: 'legacy',
      display(expr) { return `html<sub>${expr}</sub>` },
      displayPlain(expr) { return `plain:${expr}` },
      latex(expr) { return `latex:${expr}` },
      fromDisplay(source) { return `primary:${source}` },
      fromDisplay_alter(source) { return `alter:${source}` },
      displayNameId: 'display.primary',
   }
}

test('exports the resolver through CommonJS and a browser global', () => {
   assert.equal(typeof display.resolveDisplay, 'function')

   const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'notation-display.js'), 'utf8')
   const sandbox = {
      NotationLatex: { htmlToLatex(value) { return `converted:${value}` } },
   }
   sandbox.globalThis = sandbox
   vm.runInNewContext(source, sandbox, { filename: 'notation-display.js' })

   assert.equal(typeof sandbox.NotationDisplay.resolveDisplay, 'function')
   const resolved = sandbox.NotationDisplay.resolveDisplay({ display: () => 'x<sub>1</sub>' })
   assert.equal(resolved.latex(null), 'converted:x<sub>1</sub>')
})

test('resolves legacy primary fields without changing the existing display contract', () => {
   const notation = legacyNotation()
   const resolved = display.resolveDisplay(notation)

   assert.equal(resolved.requestedId, undefined)
   assert.equal(resolved.effectiveId, undefined)
   assert.equal(resolved.isEquivalent, false)
   assert.equal(resolved.plain('x'), 'plain:x')
   assert.equal(resolved.html('x'), 'html<sub>x</sub>')
   assert.equal(resolved.latex('x'), 'latex:x')
   assert.equal(resolved.fromDisplay('x'), 'primary:x')
   assert.equal(resolved.fromDisplayAlter('x'), 'alter:x')
   assert.equal(resolved.nameId, 'display.primary')
})

test('also resolves an upstream-style object as the primary display spec', () => {
   const notation = {
      display: {
         plain: (expr) => `p:${expr}`,
         html: (expr) => `h:${expr}`,
         latex: (expr) => `l:${expr}`,
         from_display: (source) => `parsed:${source}`,
         name_id: 'display.object',
      },
   }
   const resolved = display.resolveDisplay(notation)

   assert.equal(resolved.plain(1), 'p:1')
   assert.equal(resolved.html(1), 'h:1')
   assert.equal(resolved.latex(1), 'l:1')
   assert.equal(resolved.fromDisplay('x'), 'parsed:x')
   assert.equal(resolved.nameId, 'display.object')
})

test('a function equivalent supplies plain and html and derives LaTeX from HTML', () => {
   const notation = legacyNotation()
   notation.display_equiv = {
      compact: (expr) => `c<sub>${expr}</sub>`,
   }

   const resolved = display.resolveDisplay(notation, 'compact')

   assert.equal(resolved.requestedId, 'compact')
   assert.equal(resolved.effectiveId, 'compact')
   assert.equal(resolved.isEquivalent, true)
   assert.equal(resolved.plain(2), 'c<sub>2</sub>')
   assert.equal(resolved.html(2), 'c<sub>2</sub>')
   assert.equal(resolved.latex(2), 'c_{2}')
   assert.equal(resolved.fromDisplay, undefined)
})

test('object equivalents support display fallbacks and both parser naming styles', () => {
   const notation = legacyNotation()
   notation.display_equiv = {
      plainOnly: {
         plain: (expr) => `p<sup>${expr}</sup>`,
         from_display: (source) => `snake:${source}`,
      },
      htmlOnly: {
         html: (expr) => `h<sub>${expr}</sub>`,
         fromDisplay: (source) => `camel:${source}`,
      },
      explicit: {
         plain: (expr) => `p:${expr}`,
         html: (expr) => `h:${expr}`,
         latex: (expr) => `l:${expr}`,
         fromDisplay_alter: (source) => `fallback:${source}`,
      },
   }

   const plainOnly = display.resolveDisplay(notation, 'plainOnly')
   assert.equal(plainOnly.html(3), 'p<sup>3</sup>')
   assert.equal(plainOnly.latex(3), 'p^{3}')
   assert.equal(plainOnly.fromDisplay('x'), 'snake:x')

   const htmlOnly = display.resolveDisplay(notation, 'htmlOnly')
   assert.equal(htmlOnly.plain(4), 'h<sub>4</sub>')
   assert.equal(htmlOnly.latex(4), 'h_{4}')
   assert.equal(htmlOnly.fromDisplay('x'), 'camel:x')

   const explicit = display.resolveDisplay(notation, 'explicit')
   assert.equal(explicit.html(5), 'h:5')
   assert.equal(explicit.latex(5), 'l:5')
   assert.equal(explicit.fromDisplayAlter('x'), 'fallback:x')
})

test('an unavailable equivalent records the request but falls back to primary effectively', () => {
   const notation = legacyNotation()
   notation.display_equiv = { available: () => 'available' }

   const resolved = display.resolveDisplay(notation, 'removed')

   assert.equal(resolved.requestedId, 'removed')
   assert.equal(resolved.effectiveId, undefined)
   assert.equal(resolved.isEquivalent, false)
   assert.equal(resolved.html('x'), 'html<sub>x</sub>')
   assert.equal(resolved.fromDisplay('x'), 'primary:x')
})

test('lists equivalent metadata in declaration order and formats localized names', () => {
   const notation = legacyNotation()
   notation.display_equiv = {
      layer: { plain: () => '', name_id: 'display.layer' },
      raw: () => '',
   }

   const options = display.listEquivalentDisplays(notation)
   assert.deepEqual(options.map((option) => option.id), ['layer', 'raw'])
   assert.equal(options[0].nameId, 'display.layer')
   assert.equal(options[1].nameId, undefined)
   assert.equal(
      display.formatDisplayName('layer', options[0].spec, (key) => key === 'display.layer' ? 'Layer' : key),
      'Layer'
   )
   assert.equal(display.formatDisplayName('layer', options[0].spec, (key) => key), 'layer')
   assert.equal(display.formatDisplayName(undefined, {}, null, 'Original'), 'Original')
})

test('rejects missing notation objects and malformed active specs', () => {
   assert.throws(() => display.resolveDisplay(null), /notation object/i)
   assert.throws(
      () => display.resolveDisplay({ display: () => '', display_equiv: { broken: {} } }, 'broken'),
      /display function/i
   )
})
