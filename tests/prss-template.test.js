'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const PrSSTemplate = require('../js/prss-template.js');

function loadNotation(source) {
  const register = [];
  vm.runInNewContext(source, { register }, { filename: 'PrSS.js' });
  assert.equal(register.length, 1);
  return register[0];
}

function assertValidMainNotation(notation) {
  assert.equal(typeof notation.id, 'string');
  assert.equal(typeof notation.name, 'string');
  for (const field of ['display', 'fromDisplay', 'able', 'compare', 'FS', 'init']) {
    assert.equal(typeof notation[field], 'function', `${field} should be a function`);
  }
  const roots = notation.init();
  assert.equal(roots.length, 2);
  assert.equal(notation.display(roots[0].expr), 'Limit');
  assert.equal(notation.display(roots[1].expr), '');
}

test('default generated source registers a complete legacy notation', () => {
  const notation = loadNotation(PrSSTemplate.DEFAULT_SOURCE);
  assert.equal(notation.id, 'prss');
  assert.equal(notation.name, 'PrSS');
  assertValidMainNotation(notation);
});

test('generateSource safely substitutes a unique id and display name', () => {
  const name = 'PrSS 2 "quoted" \\ \'single\'';
  const source = PrSSTemplate.generateSource({
    id: 'prss-2',
    name,
  });
  const notation = loadNotation(source);
  assert.equal(notation.id, 'prss-2');
  assert.equal(notation.name, name);
  assert.doesNotMatch(source, /__PRSS_(?:ID|NAME)_LITERAL__/);
  assert.throws(() => PrSSTemplate.generateSource({ id: 'PrSS', name: 'PrSS' }), TypeError);
});

test('browser build exposes the same generator on globalThis', () => {
  const modulePath = path.join(__dirname, '..', 'js', 'prss-template.js');
  const moduleSource = fs.readFileSync(modulePath, 'utf8');
  const browser = {};
  vm.runInNewContext(moduleSource, browser, { filename: 'prss-template.js' });

  assert.equal(typeof browser.PrSSTemplate.generateSource, 'function');
  const notation = loadNotation(browser.PrSSTemplate.generateSource({ id: 'prss-3', name: 'PrSS 3' }));
  assert.equal(notation.id, 'prss-3');
});

test('parser round-trips empty, finite, and Limit expressions strictly', () => {
  const notation = loadNotation(PrSSTemplate.DEFAULT_SOURCE);
  assert.deepEqual(Array.from(notation.fromDisplay('')), []);
  assert.deepEqual(Array.from(notation.fromDisplay(' 0, 12,3 ')), [0, 12, 3]);
  assert.equal(notation.fromDisplay('Limit')[0], Infinity);
  assert.equal(notation.display(notation.fromDisplay('')), '');
  assert.equal(notation.display(notation.fromDisplay('0,12,3')), '0,12,3');
  assert.equal(notation.display(notation.fromDisplay('Limit')), 'Limit');

  for (const invalid of ['1x', '1.5', '-1', '01', '1,,2', ',', 'Infinity']) {
    assert.throws(() => notation.fromDisplay(invalid), /Illegal PrSS sequence/);
  }
});

test('FS preserves PrSS expansion and caches finite terms', () => {
  const notation = loadNotation(PrSSTemplate.DEFAULT_SOURCE);
  const first = notation.FS([0, 2], 3);
  const cached = notation.FS([0, 2], 3);

  assert.deepEqual(Array.from(first), [0, 0, 0]);
  assert.equal(cached, first);
  assert.deepEqual(Array.from(notation.FS([0, 1], 7)), [0]);
  assert.deepEqual(Array.from(notation.FS([Infinity], 3)), [1, 2, 3]);
  assert.throws(() => notation.FS([0, 2], -1), /non-negative integer/);
});

test('documented example is exactly the maintained default template', () => {
  const examplePath = path.join(__dirname, '..', 'docs', 'example-PrSS.js');
  const example = fs.readFileSync(examplePath, 'utf8');
  assert.equal(example, PrSSTemplate.DEFAULT_SOURCE);
  assertValidMainNotation(loadNotation(example));
});
