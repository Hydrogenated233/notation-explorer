'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Editor = require('../js/notation-editor.js');

test('escapeHtml escapes every character relevant in HTML text', () => {
  assert.equal(
    Editor.escapeHtml('<script data-x="a&b">\'x\'</script>'),
    '&lt;script data-x=&quot;a&amp;b&quot;&gt;&#39;x&#39;&lt;/script&gt;'
  );
});

test('highlight classifies basic JavaScript and safely escapes source', () => {
  const source = 'const answer = 42; // <unsafe>\nif (answer) return "yes";\nlet x = true ?? null;';
  const html = Editor.highlight(source);

  assert.match(html, /ne-editor-token--keyword">const<\/span>/);
  assert.match(html, /ne-editor-token--number">42<\/span>/);
  assert.match(html, /ne-editor-token--comment">\/\/ &lt;unsafe&gt;<\/span>/);
  assert.match(html, /ne-editor-token--string">&quot;yes&quot;<\/span>/);
  assert.match(html, /ne-editor-token--literal">true<\/span>/);
  assert.match(html, /ne-editor-token--literal">null<\/span>/);
  assert.doesNotMatch(html, /<unsafe>/);
});

test('highlight supports multiline comments, templates, and common number forms', () => {
  const tokens = Editor.tokenize('/* a\nb */ `x ${ignored}` 0xff 0b10 1_000 2.5e-3');
  assert.deepEqual(
    tokens.filter((token) => token.type !== 'plain').map((token) => [token.type, token.value]),
    [
      ['comment', '/* a\nb */'],
      ['template', '`x ${ignored}`'],
      ['number', '0xff'],
      ['number', '0b10'],
      ['number', '1_000'],
      ['number', '2.5e-3']
    ]
  );
});

test('tokenization covers source exactly and preserves whitespace and newlines', () => {
  const source = '  const\tx = "<&";\r\n// tail\n';
  const tokens = Editor.tokenize(source);
  assert.equal(tokens.map((token) => token.value).join(''), source);
  assert.equal(tokens[0].start, 0);
  assert.equal(tokens[tokens.length - 1].end, source.length);
  for (let index = 1; index < tokens.length; index++) {
    assert.equal(tokens[index - 1].end, tokens[index].start);
  }
});

test('line number helpers include the empty line after a final newline', () => {
  assert.equal(Editor.getLineCount(''), 1);
  assert.deepEqual(Editor.getLineNumbers('a\nb\n'), [1, 2, 3]);
  assert.equal(Editor.renderLineNumbers('a\r\nb\rc'), '1\n2\n3');
});

test('findBracketMatch matches nested mixed brackets from either side', () => {
  const source = 'call({ value: [1, 2] })';
  assert.deepEqual(Editor.findBracketMatch(source, 4), {
    status: 'matched',
    index: 4,
    matchIndex: 22,
    bracket: '(',
    match: ')',
    pair: [4, 22]
  });
  assert.deepEqual(Editor.findBracketMatch(source, 23), {
    status: 'matched',
    index: 22,
    matchIndex: 4,
    bracket: ')',
    match: '(',
    pair: [4, 22]
  });
});

test('findBracketMatch ignores brackets in comments and quoted/template strings', () => {
  const source = 'const a = "("; // ]\nconst b = `}`;\nrun([ok]);';
  assert.equal(Editor.findBracketMatch(source, source.indexOf('(')).status, 'none');
  assert.equal(Editor.findBracketMatch(source, source.indexOf(']')).status, 'none');
  assert.equal(Editor.findBracketMatch(source, source.indexOf('}')).status, 'none');

  const opening = source.lastIndexOf('[');
  const result = Editor.findBracketMatch(source, opening);
  assert.equal(result.status, 'matched');
  assert.equal(result.matchIndex, source.lastIndexOf(']'));
});

test('findBracketMatch reports missing and structurally invalid pairs', () => {
  assert.deepEqual(Editor.findBracketMatch('const x = [1, 2;', 10), {
    status: 'unmatched',
    index: 10,
    matchIndex: -1,
    bracket: '[',
    match: null,
    pair: null
  });
  assert.equal(Editor.findBracketMatch('([)]', 0).status, 'unmatched');
  assert.equal(Editor.findBracketMatch('plain text', 3).status, 'none');
});

test('caret prefers a bracket under it, then the immediately preceding bracket', () => {
  const source = '()';
  const between = Editor.findBracketMatch(source, 1);
  assert.equal(between.index, 1);
  assert.equal(between.matchIndex, 0);

  const after = Editor.findBracketMatch(source, 2);
  assert.equal(after.index, 1);
  assert.equal(after.matchIndex, 0);
});
