'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const renderer = require('../js/markdown-renderer.js')

test('renders the block and inline syntax used by the notation guide', () => {
   const markdown = [
      '# Guide',
      '',
      'A **strong** paragraph with `inline()` and [docs](./other.md).',
      '',
      '> A quoted note.',
      '',
      '- first',
      '- second',
      '',
      '1. one',
      '2. two',
      '',
      '| Name | Value |',
      '|:-----|------:|',
      '| a | b |',
      '',
      '```js',
      'const value = 1;',
      '```',
   ].join('\n')

   const html = renderer.render(markdown, {
      baseUrl: 'https://example.test/app/docs/guide.md',
   })

   assert.match(html, /<h1>Guide<\/h1>/)
   assert.match(html, /<strong>strong<\/strong>/)
   assert.match(html, /<code>inline\(\)<\/code>/)
   assert.match(html, /href="https:\/\/example\.test\/app\/docs\/other\.md"/)
   assert.match(html, /target="_blank" rel="noopener noreferrer"/)
   assert.match(html, /<blockquote><p>A quoted note\.<\/p><\/blockquote>/)
   assert.match(html, /<ul><li>first<\/li><li>second<\/li><\/ul>/)
   assert.match(html, /<ol><li>one<\/li><li>two<\/li><\/ol>/)
   assert.match(html, /class="ne-markdown-table-wrap"/)
   assert.match(html, /<th class="is-left">Name<\/th>/)
   assert.match(html, /<td class="is-right">b<\/td>/)
   assert.match(html, /<pre><code class="language-js">const value = 1;<\/code><\/pre>/)
})

test('escapes raw HTML and rejects executable link protocols', () => {
   const html = renderer.render([
      '<script>alert(1)</script>',
      '',
      '`<sub>literal</sub>`',
      '',
      '[run](javascript:alert(1))',
      '',
      '[data](data:text/html,boom)',
   ].join('\n'), { baseUrl: 'https://example.test/docs/guide.md' })

   assert.doesNotMatch(html, /<script>/)
   assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
   assert.match(html, /<code>&lt;sub&gt;literal&lt;\/sub&gt;<\/code>/)
   assert.doesNotMatch(html, /javascript:/)
   assert.doesNotMatch(html, /data:text/)
   assert.match(html, /<p>run<\/p>/)
   assert.match(html, /<p>data<\/p>/)
})

test('renders the complete bundled guide without exposing raw HTML', () => {
   const guidePath = path.join(__dirname, '..', 'docs', 'making-a-notation.md')
   const html = renderer.render(fs.readFileSync(guidePath, 'utf8'), {
      baseUrl: 'https://example.test/app/docs/making-a-notation.md',
   })

   assert.match(html, /<h1>如何开发一个记号文件/)
   assert.match(html, /<h2>支持的两种注册格式<\/h2>/)
   assert.match(html, /<h2>生成类记号与 <code>\+\/-<\/code> 接口<\/h2>/)
   assert.match(html, /<table>/)
   assert.match(html, /<pre><code class="language-js">/)
   assert.match(html, /&lt;sub&gt;/)
   assert.doesNotMatch(html, /<sub>/)
})
