;(function(root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.NotationEditorEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var KEYWORDS = new Set([
    'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
    'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export',
    'extends', 'finally', 'for', 'from', 'function', 'get', 'if', 'import',
    'in', 'instanceof', 'let', 'new', 'of', 'return', 'set', 'static',
    'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield'
  ]);
  var LITERALS = new Set(['true', 'false', 'null']);
  var OPEN_TO_CLOSE = { '(': ')', '[': ']', '{': '}' };
  var CLOSE_TO_OPEN = { ')': '(', ']': '[', '}': '{' };
  var BRACKETS = new Set(['(', ')', '[', ']', '{', '}']);
  var TOKEN_CLASS = {
    keyword: 'ne-editor-token ne-editor-token--keyword',
    literal: 'ne-editor-token ne-editor-token--literal',
    number: 'ne-editor-token ne-editor-token--number',
    string: 'ne-editor-token ne-editor-token--string',
    template: 'ne-editor-token ne-editor-token--template',
    comment: 'ne-editor-token ne-editor-token--comment'
  };
  var NUMBER_PATTERN = /^(?:0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*n?|0[bB][01](?:_?[01])*n?|0[oO][0-7](?:_?[0-7])*n?|\d(?:_?\d)*n|(?:(?:\d(?:_?\d)*)?\.(?:\d(?:_?\d)*)|\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?)(?:[eE][+-]?\d(?:_?\d)*)?)/;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isIdentifierStart(character) {
    return character !== undefined && /[A-Za-z_$]/.test(character);
  }

  function isIdentifierPart(character) {
    return character !== undefined && /[A-Za-z0-9_$]/.test(character);
  }

  function pushToken(tokens, type, source, start, end) {
    if (end <= start) return;

    var previous = tokens[tokens.length - 1];
    if (previous && previous.type === type && previous.end === start) {
      previous.end = end;
      previous.value += source.slice(start, end);
      return;
    }

    tokens.push({
      type: type,
      start: start,
      end: end,
      value: source.slice(start, end)
    });
  }

  /**
   * Tokenize enough JavaScript for an editor overlay. Every source character is
   * represented exactly once, including whitespace and invalid draft code.
   */
  function tokenize(value) {
    var source = String(value == null ? '' : value);
    var tokens = [];
    var index = 0;

    while (index < source.length) {
      var start = index;
      var character = source[index];
      var next = source[index + 1];

      if (character === '/' && next === '/') {
        index += 2;
        while (index < source.length && source[index] !== '\n' && source[index] !== '\r') index++;
        pushToken(tokens, 'comment', source, start, index);
        continue;
      }

      if (character === '/' && next === '*') {
        index += 2;
        while (index < source.length) {
          if (source[index] === '*' && source[index + 1] === '/') {
            index += 2;
            break;
          }
          index++;
        }
        pushToken(tokens, 'comment', source, start, index);
        continue;
      }

      if (character === '"' || character === "'") {
        var quote = character;
        index++;
        while (index < source.length) {
          if (source[index] === '\\') {
            index = Math.min(index + 2, source.length);
            continue;
          }
          if (source[index] === quote) {
            index++;
            break;
          }
          if (source[index] === '\n' || source[index] === '\r') break;
          index++;
        }
        pushToken(tokens, 'string', source, start, index);
        continue;
      }

      if (character === '`') {
        index++;
        while (index < source.length) {
          if (source[index] === '\\') {
            index = Math.min(index + 2, source.length);
            continue;
          }
          if (source[index] === '`') {
            index++;
            break;
          }
          index++;
        }
        pushToken(tokens, 'template', source, start, index);
        continue;
      }

      if (isIdentifierStart(character)) {
        index++;
        while (isIdentifierPart(source[index])) index++;
        var identifier = source.slice(start, index);
        var identifierType = KEYWORDS.has(identifier)
          ? 'keyword'
          : LITERALS.has(identifier) ? 'literal' : 'plain';
        pushToken(tokens, identifierType, source, start, index);
        continue;
      }

      if (/[0-9]/.test(character) || (character === '.' && /[0-9]/.test(next))) {
        var numberMatch = source.slice(index).match(NUMBER_PATTERN);
        if (numberMatch) {
          index += numberMatch[0].length;
          pushToken(tokens, 'number', source, start, index);
          continue;
        }
      }

      index++;
      pushToken(tokens, 'plain', source, start, index);
    }

    return tokens;
  }

  function highlight(value) {
    return tokenize(value).map(function(token) {
      var escaped = escapeHtml(token.value);
      var className = TOKEN_CLASS[token.type];
      return className
        ? '<span class="' + className + '">' + escaped + '</span>'
        : escaped;
    }).join('');
  }

  function getLineCount(value) {
    var source = String(value == null ? '' : value);
    var matches = source.match(/\r\n|\r|\n/g);
    return (matches ? matches.length : 0) + 1;
  }

  function getLineNumbers(value) {
    var count = getLineCount(value);
    var lines = [];
    for (var line = 1; line <= count; line++) lines.push(line);
    return lines;
  }

  function renderLineNumbers(value) {
    return getLineNumbers(value).join('\n');
  }

  function ignoredCharacterMap(source) {
    var ignored = new Uint8Array(source.length);
    tokenize(source).forEach(function(token) {
      if (token.type !== 'comment' && token.type !== 'string' && token.type !== 'template') return;
      for (var index = token.start; index < token.end; index++) ignored[index] = 1;
    });
    return ignored;
  }

  function noBracketResult() {
    return {
      status: 'none',
      index: -1,
      matchIndex: -1,
      bracket: null,
      match: null,
      pair: null
    };
  }

  function unmatchedResult(source, index) {
    return {
      status: 'unmatched',
      index: index,
      matchIndex: -1,
      bracket: source[index],
      match: null,
      pair: null
    };
  }

  function matchedResult(source, index, matchIndex) {
    return {
      status: 'matched',
      index: index,
      matchIndex: matchIndex,
      bracket: source[index],
      match: source[matchIndex],
      pair: [Math.min(index, matchIndex), Math.max(index, matchIndex)]
    };
  }

  function findForwardMatch(source, candidate, ignored) {
    var stack = [];
    for (var index = candidate; index < source.length; index++) {
      if (ignored[index]) continue;
      var character = source[index];
      if (OPEN_TO_CLOSE[character]) {
        stack.push(character);
      } else if (CLOSE_TO_OPEN[character]) {
        if (!stack.length || OPEN_TO_CLOSE[stack[stack.length - 1]] !== character) return -1;
        stack.pop();
        if (!stack.length) return index;
      }
    }
    return -1;
  }

  function findBackwardMatch(source, candidate, ignored) {
    var stack = [];
    for (var index = candidate; index >= 0; index--) {
      if (ignored[index]) continue;
      var character = source[index];
      if (CLOSE_TO_OPEN[character]) {
        stack.push(character);
      } else if (OPEN_TO_CLOSE[character]) {
        if (!stack.length || OPEN_TO_CLOSE[character] !== stack[stack.length - 1]) return -1;
        stack.pop();
        if (!stack.length) return index;
      }
    }
    return -1;
  }

  /**
   * Find the bracket at the caret or immediately before it. Brackets inside
   * comments and string/template literals are intentionally invisible.
   */
  function findBracketMatch(value, caret) {
    var source = String(value == null ? '' : value);
    var numericCaret = Number(caret);
    if (!Number.isFinite(numericCaret)) return noBracketResult();
    numericCaret = Math.max(0, Math.min(source.length, Math.trunc(numericCaret)));

    var ignored = ignoredCharacterMap(source);
    var candidates = numericCaret < source.length ? [numericCaret, numericCaret - 1] : [numericCaret - 1];
    var candidate = -1;
    for (var position = 0; position < candidates.length; position++) {
      var possible = candidates[position];
      if (possible >= 0 && BRACKETS.has(source[possible]) && !ignored[possible]) {
        candidate = possible;
        break;
      }
    }
    if (candidate === -1) return noBracketResult();

    var matchIndex = OPEN_TO_CLOSE[source[candidate]]
      ? findForwardMatch(source, candidate, ignored)
      : findBackwardMatch(source, candidate, ignored);
    return matchIndex === -1
      ? unmatchedResult(source, candidate)
      : matchedResult(source, candidate, matchIndex);
  }

  return Object.freeze({
    escapeHtml: escapeHtml,
    tokenize: tokenize,
    highlight: highlight,
    getLineCount: getLineCount,
    getLineNumbers: getLineNumbers,
    renderLineNumbers: renderLineNumbers,
    findBracketMatch: findBracketMatch
  });
});
