;(function(){
  'use strict';

  var data = {};

  // ── helpers ──────────────────────────────────────────────────────────

  function isExpr(term)     { return Array.isArray(term); }

  function serializeTerm(term) {
    if (Number.isInteger(term)) return 'n' + term;
    return '(' + term.map(serializeTerm).join(',') + ')';
  }

  function serializeExpr(expr) {
    if (expr === Infinity) return 'Infinity';
    return '[' + expr.map(serializeTerm).join(',') + ']';
  }

  // display helpers ── recursive term display with parentheses
  function dispTerm(term) {
    if (term === Infinity) return 'Limit';
    if (Number.isInteger(term)) return String(term);
    return '(' + dispExpr(term) + ')';
  }

  function dispExpr(expr) {
    if (expr === Infinity) return 'Limit';
    if (!expr || !expr.length) return '';
    return expr.map(dispTerm).join(',');
  }

  // ── term / expression comparison ────────────────────────────────────

  function naturalValueOfExpr(expr) {
    if (expr.length > 0 && expr.every(function(x){return x === 1;})) return expr.length;
    return null;
  }

  function canonicalTerm(term) {
    if (isExpr(term)) {
      var n = naturalValueOfExpr(term);
      if (n !== null) return n;
    }
    return term;
  }

  var cmpCache = {};
  function compareTerms(a, b) {
    var key = serializeTerm(a) + '|' + serializeTerm(b);
    if (cmpCache.hasOwnProperty(key)) return cmpCache[key];
    var aa = canonicalTerm(a), bb = canonicalTerm(b), r = 0;
    if (typeof aa === 'number' && typeof bb === 'number') {
      r = aa === bb ? 0 : aa > bb ? 1 : -1;
    } else if (typeof aa === 'number' && isExpr(bb)) {
      r = -1;
    } else if (isExpr(aa) && typeof bb === 'number') {
      r = 1;
    } else {
      r = compareExpr(aa, bb);
    }
    cmpCache[key] = r;
    return r;
  }

  var cmpExprCache = {};
  function compareExpr(a, b) {
    var key = serializeExpr(a) + '|' + serializeExpr(b);
    if (cmpExprCache.hasOwnProperty(key)) return cmpExprCache[key];
    var aa = a.length > 1 ? a.slice(1) : [];
    var bb = b.length > 1 ? b.slice(1) : [];
    var r = 0;
    for (var i = 0; i < Math.min(aa.length, bb.length); i++) {
      var c = compareTerms(aa[i], bb[i]);
      if (c !== 0) { r = c; break; }
    }
    if (r === 0) r = aa.length === bb.length ? 0 : aa.length > bb.length ? 1 : -1;
    cmpExprCache[key] = r;
    return r;
  }

  function exprEq(a, b) { return a.length === b.length && compareExpr(a, b) === 0; }
  function leExpr(a, b)  { return compareExpr(a, b) <= 0; }

  function isSuccessorExpr(expr) {
    return expr.length > 0 && Number.isInteger(expr[expr.length - 1]) && expr[expr.length - 1] === 1;
  }
  function predSuccessor(expr) { return expr.slice(0, -1); }
  function succExpr(expr)      { return expr.concat([1]); }
  function termPlusOne(term) {
    if (Number.isInteger(term)) return term + 1;
    return succExpr(term);
  }

  // ── pure-numeric LPrSS (0-Y) ────────────────────────────────────────

  function findBadRootNumeric(row) {
    var last = row[row.length - 1];
    for (var i = row.length - 2; i >= 0; i--) if (row[i] < last) return i;
    throw new Error('sequence has no LPrSS bad root');
  }

  function expandNumeric0Y(row, term) {
    if (!row.length) return [];
    if (row[row.length - 1] === 1) return row.slice(0, -1);
    var root = findBadRootNumeric(row);
    var good = row.slice(0, root);
    var bad  = row.slice(root, row.length - 1);
    var step = row[row.length - 1] - row[root] - 1;
    var out  = good.slice();
    for (var r = 0; r <= term; r++)
      for (var j = 0; j < bad.length; j++)
        out.push(bad[j] + r * step);
    return out;
  }

  function isPureNaturalRow(row) {
    for (var i = 0; i < row.length; i++) if (!Number.isInteger(row[i]) || row[i] < 1) return false;
    return true;
  }

  // ── mixed 0-Y LPrSS expansion ───────────────────────────────────────

  function parentMixed(row, lowerParent) {
    var parents = [];
    for (var i = 0; i < row.length; i++) {
      var value = row[i];
      var limit = Math.min(i - 1, lowerParent[i]);
      var found = -1;
      for (var p = limit; p >= 0; p--) {
        if (compareTerms(row[p], value) < 0) { found = p; break; }
      }
      parents.push(found);
    }
    return parents;
  }

  // for natural-last-row computation
  function expandMixed0Y(row, term, lowerParent) {
    var x = row.length;
    if (x === 0) return [];
    if (isPureNaturalRow(row)) return expandNumeric0Y(row, term);
    var last = row[x - 1];
    if (Number.isInteger(last) && last === 1) return row.slice(0, -1);
    if (!Number.isInteger(last)) throw new Error('mixed LPrSS expansion requires a natural last term');

    var root = -1;
    for (var i = x - 2; i >= 0; i--) {
      if (compareTerms(row[i], last) < 0) { root = i; break; }
    }
    if (root < 0) throw new Error('bad mixed root');
    if (!Number.isInteger(row[root])) throw new Error('mixed LPrSS bad root must be natural');

    var good = row.slice(0, root);
    var bad  = row.slice(root, x - 1);
    var step = last - row[root] - 1;
    var out  = good.slice();
    for (var r = 0; r <= term; r++)
      for (var j = 0; j < bad.length; j++)
        out.push(Number.isInteger(bad[j]) ? bad[j] + r * step : bad[j]);
    return out;
  }

  var mixedRowsCache = {};
  function naturalLastRow(expr, needLen) {
    var key = serializeExpr(expr) + '|' + needLen;
    if (mixedRowsCache.hasOwnProperty(key)) return mixedRowsCache[key];
    var maxTerm = Math.max(needLen + 200, 1);
    var best = [], term = 0;
    while (term <= maxTerm) {
      var row = expandMixed0Y(expr, term);
      best = row;
      if (row.length >= needLen) break;
      if (term === maxTerm) break;
      term = term === 0 ? 1 : Math.min(maxTerm, term * 2);
    }
    mixedRowsCache[key] = best;
    return best;
  }

  // ── subsequential (headless) helpers ─────────────────────────────────

  var containsCache = {};
  function containsInFs(ref, target, cap) {
    var key = serializeExpr(ref) + '|' + serializeExpr(target) + '|' + cap;
    if (containsCache.hasOwnProperty(key)) return containsCache[key];
    if (exprEq(ref, target)) { containsCache[key] = false; return false; }
    for (var pos = 1; pos <= cap; pos++) {
      var item = fsItem(ref, pos, cap);
      if (item === null) break;
      if (exprEq(item, target)) { containsCache[key] = true; return true; }
      if (compareExpr(item, target) > 0) break;
    }
    containsCache[key] = false;
    return false;
  }

  var mutationCache = {};
  function candidateMutations(base) {
    var key = serializeExpr(base);
    if (mutationCache.hasOwnProperty(key)) return mutationCache[key];
    var out = [], seen = {};
    var threshold = [1, [1, 2]];
    function add(expr) {
      var k = serializeExpr(expr);
      if (!seen[k]) { seen[k] = true; out.push(expr); }
    }
    if (compareExpr(base, threshold) < 0) {
      if (base.length === 2) { add([1, [1, 2]]); add([1, termPlusOne(base[1])]); }
      else { for (var j = 1; j < base.length; j++) add(base.slice(0, j).concat([termPlusOne(base[j])])); }
      mutationCache[key] = out; return out;
    }
    for (var j = 1; j < base.length; j++) {
      var term = base[j];
      if (Number.isInteger(term)) add(base.slice(0, j).concat([term + 1]));
      else {
        for (var si = 0; si < candidateMutations(term).length; si++) add(base.slice(0, j).concat([candidateMutations(term)[si]]));
        add(base.slice(0, j).concat([succExpr(term)]));
      }
    }
    mutationCache[key] = out;
    return out;
  }

  var refCache = {};
  function findReference(A, Aprime, afp, cap) {
    var key = serializeExpr(A) + '|' + serializeExpr(Aprime) + '|' + serializeExpr(afp) + '|' + cap;
    if (refCache.hasOwnProperty(key)) return refCache[key];
    var ref = A;
    var cands = candidateMutations(afp);
    for (var i = 0; i < cands.length; i++) {
      if (leExpr(cands[i], A) && containsInFs(cands[i], afp, cap)) { ref = cands[i]; break; }
    }
    refCache[key] = ref;
    return ref;
  }

  // ── feature-sequence expansion (numeric + combinatorial) ────────────

  function ft(val, plus) { return { val: val, plus: Boolean(plus) }; }

  function normalizeFeature(seq) {
    var nums = [];
    for (var i = 0; i < seq.length; i++) if (Number.isInteger(seq[i].val)) nums.push(seq[i].val);
    if (!nums.length) return { seq: seq.slice(), delta: 0 };
    var minVal = Math.min.apply(null, nums);
    var delta = minVal - 1;
    return {
      seq: seq.map(function(item){ return Number.isInteger(item.val) ? ft(item.val - delta, item.plus) : item; }),
      delta: delta
    };
  }

  function restoreFeature(seq, delta) {
    return seq.map(function(item){ return Number.isInteger(item.val) ? ft(item.val + delta, item.plus) : item; });
  }

  function featureNumericKey(item) {
    if (!Number.isInteger(item.val)) return null;
    return item.val + (item.plus ? 0.5 : 0);
  }

  function findBadRootFeature(row) {
    var last = featureNumericKey(row[row.length - 1]);
    for (var i = row.length - 2; i >= 0; i--) {
      var key = featureNumericKey(row[i]);
      if (key !== null && key < last) return i;
    }
    throw new Error('feature row has no LPrSS bad root');
  }

  function expandFeatureLPrSS(row, term, orig) {
    if (!orig) orig = row;
    if (row[row.length - 1].val === 1) {
      return { out: row.slice(0, -1), sources: (function(){var a=[];for(var i=0;i<row.length-1;i++)a.push(i);return a;})() };
    }
    if (!Number.isInteger(row[row.length - 1].val)) throw new Error('feature sequence cannot end in TOP');
    var root = findBadRootFeature(row);
    var good, bad, step, sourceOffset;
    if (row[root].plus && orig) {
      try {
        var origRoot = findBadRootFeature(orig);
        good = orig.slice(0, origRoot + 1);
        bad  = orig.slice(origRoot + 1);
        step = row[row.length - 1].val - orig[origRoot].val - 1;
        sourceOffset = origRoot + 1;
      } catch(e) {
        good = orig.slice(0, root);
        bad  = orig.slice(root);
        step = 0;
        sourceOffset = root;
      }
    } else {
      good = row.slice(0, root);
      bad  = row.slice(root, row.length - 1);
      step = row[row.length - 1].val - row[root].val - 1;
      sourceOffset = root;
    }
    var out = good.slice();
    var sources = (function(){var a=[];for(var i=0;i<sourceOffset;i++)a.push(i);return a;})();
    for (var r = 0; r <= term; r++) {
      for (var j = 0; j < bad.length; j++) {
        var item = bad[j];
        if (item.val === Infinity) out.push(item);
        else out.push(ft(item.val + r * step, item.plus));
        sources.push(sourceOffset + j);
      }
    }
    return { out: out, sources: sources };
  }

  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    var num = 1, den = 1;
    for (var i = 1; i <= k; i++) { num *= (n - k + i); den *= i; }
    return Math.round(num / den);
  }

  function expandFeatureDirect(norm, needLen) {
    if (!norm.length) return { out: [], sources: [] };

    // plain numeric (no plus)
    if (norm.every(function(it){return Number.isInteger(it.val) && !it.plus;}) && needLen > 0) {
      var row = norm.map(function(it){return ft(it.val, false);});
      row[row.length - 1] = ft(row[row.length - 1].val + 1, false);
      var bestOut = [], bestSources = [];
      var upper = Math.max(needLen + 50, 80);
      for (var n = 0; n <= upper; n++) {
        var cur = expandFeatureLPrSS(row, n, norm);
        bestOut = cur.out; bestSources = cur.sources;
        if (cur.out.length >= needLen) return { out: cur.out.slice(0, needLen), sources: cur.sources.slice(0, needLen) };
      }
      return { out: bestOut.slice(0, needLen), sources: bestSources.slice(0, needLen) };
    }

    // pattern [1, k] → binomial coefficients
    if (norm.length === 2 && norm.every(function(it){return Number.isInteger(it.val) && !it.plus;}) && norm[0].val === 1 && needLen > 0) {
      var degree = norm[1].val - 1;
      if (degree >= 1) {
        var out = (function(){var a=[];for(var i=0;i<needLen;i++)a.push(ft(comb(i + degree, degree), false));return a;})();
        var src = [0]; for (var i = 1; i < needLen; i++) src.push(1);
        return { out: out, sources: src };
      }
    }

    // general
    var row2 = norm.slice();
    row2[row2.length - 1] = ft(row2[row2.length - 1].val + 1, false);
    var best = { out: [], sources: [] };
    var upper = Math.max(needLen + 50, 80);
    for (var n = 0; n <= upper; n++) {
      var cur = expandFeatureLPrSS(row2, n, norm);
      best = cur;
      if (cur.out.length >= needLen) return { out: cur.out.slice(0, needLen), sources: cur.sources.slice(0, needLen) };
    }
    return { out: best.out.slice(0, needLen), sources: best.sources.slice(0, needLen) };
  }

  // ── headless (subsequential) term/expression items ──────────────────

  var headlessRefCache = {};
  function headlessFromRefItem(A, Aprime, reference, idx, cap) {
    var key = serializeExpr(A) + '|' + serializeExpr(Aprime) + '|' + serializeExpr(reference) + '|' + idx + '|' + cap;
    if (headlessRefCache.hasOwnProperty(key)) return headlessRefCache[key];

    var result = null;
    if (exprEq(reference, A)) {
      // build reference FS
      var refFs = [[1]];
      for (var i = 2; i <= Aprime.length; i++) refFs.push(Aprime.slice(0, i));
      var built = buildFeatureSequence(Aprime, A, refFs);
      var normalized = normalizeFeature(built.raw);
      var startLen = built.raw.length && Number.isInteger(built.raw[built.raw.length - 1].val) ? built.raw[built.raw.length - 1].val : 2;
      var rowLen = startLen + idx - 1;
      var needFeat = Math.max(rowLen - 1, 0);
      var expanded = expandFeatureDirect(normalized.seq, needFeat);
      var restored = restoreFeature(expanded.out, normalized.delta);
      var row = [1];
      for (var i = 0; i < needFeat; i++) {
        var feat = restored[i];
        var srcIdx = expanded.sources[i];
        var info = srcIdx < built.infos.length ? built.infos[srcIdx] : built.infos[built.infos.length - 1];
        if (feat.val === Infinity) {
          row.push(info.original);
        } else {
          var pos = feat.val;
          if (pos === 1) row.push([1]);
          else {
            if (row.length < pos) pos = row.length;
            row.push(feat.plus ? row.slice(0, pos).concat(info.outside) : row.slice(0, pos));
          }
        }
      }
      result = row.length >= rowLen ? row.slice(0, rowLen) : null;
    } else {
      var rowLen = idx + 1;
      var needFeat = Math.max(rowLen - 1, 0);
      var refFsForFeatures = fsFull(reference, cap, cap);
      var built = buildFeatureSequence(Aprime, reference, refFsForFeatures);
      var normalized = normalizeFeature(built.raw);
      var expanded = expandFeatureDirect(normalized.seq, needFeat);
      var restored = restoreFeature(expanded.out, normalized.delta);
      var terms = [1];
      for (var i = 0; i < needFeat; i++) {
        terms.push(termFromFeatureRef(restored[i], expanded.sources[i], built.infos, reference, refFsForFeatures, cap));
      }
      result = terms.length >= rowLen ? terms.slice(0, rowLen) : null;
    }

    headlessRefCache[key] = result;
    return result;
  }

  function isOrdinalTerm(term) {
    var c = canonicalTerm(term);
    return isExpr(c) && compareExpr(c, [1, 2]) >= 0;
  }

  function longestRefPrefix(term, refFs) {
    var bestPos = 1, bestLen = 1;
    for (var pos = 0; pos < refFs.length; pos++) {
      var item = refFs[pos];
      if (item.length <= term.length) {
        var matched = true;
        for (var i = 0; i < item.length; i++) {
          if (serializeTerm(item[i]) !== serializeTerm(term[i])) { matched = false; break; }
        }
        if (matched && item.length >= bestLen) { bestPos = pos + 1; bestLen = item.length; }
      }
    }
    return { pos: bestPos, outside: term.slice(bestLen) };
  }

  function buildFeatureSequence(aprime, reference, refFs) {
    var raw = [], infos = [];
    for (var ti = 0; ti < aprime.length; ti++) {
      var term = aprime[ti];
      if (!isOrdinalTerm(term)) continue;
      if (compareExpr(term, reference) >= 0) {
        raw.push(ft(Infinity, false));
        infos.push({ original: term, insidePos: null, outside: [], top: true });
      } else {
        var prefix = longestRefPrefix(term, refFs);
        raw.push(ft(prefix.pos, prefix.outside.length > 0));
        infos.push({ original: term, insidePos: prefix.pos, outside: prefix.outside, top: false });
      }
    }
    return { raw: raw, infos: infos };
  }

  function termFromFeatureRef(feature, source, infos, reference, seedFs, cap) {
    var info = source >= 0 && source < infos.length ? infos[source] : infos[infos.length - 1];
    if (feature.val === Infinity) return info.original;
    var pos = Math.max(1, feature.val);
    var base = pos <= seedFs.length ? seedFs[pos - 1] : fsItem(reference, pos, cap);
    if (feature.plus) return base.concat(info.outside);
    return base;
  }

  function nestedLimitHeadless(k) {
    var term = [1, 2];
    for (var i = 1; i < k; i++) term = [1, term];
    return term;
  }

  // ── main item generation ──────────────────────────────────────

  var headlessCache = {};
  function headlessItem(expr, idx, cap) {
    var key = serializeExpr(expr) + '|' + idx + '|' + cap;
    if (headlessCache.hasOwnProperty(key)) return headlessCache[key];

    var result = null;
    if (!(idx <= 0 || !expr.length || isSuccessorExpr(expr))) {
      var last = expr[expr.length - 1];
      if (Number.isInteger(last)) {
        if (last !== 1) {
          var needLen = idx + 1;
          var row = naturalLastRow(expr, needLen);
          result = row.length >= needLen ? row.slice(0, needLen) : null;
        }
      } else if (!isSuccessorExpr(last)) {
        var term = headlessTermItem(last, idx, cap);
        if (term !== null) result = expr.slice(0, -1).concat([term]);
      } else {
        var afp = predSuccessor(last);
        var aprime = expr.slice(0, -1).concat([afp]);
        var smaller = [];
        for (var i = 0; i < expr.length - 1; i++) {
          if (isOrdinalTerm(expr[i]) && compareTerms(expr[i], last) < 0) smaller.push(expr[i]);
        }
        if (!smaller.length) {
          var cur = aprime;
          for (var i = 0; i < idx - 1; i++) cur = aprime.concat([cur]);
          result = cur;
        } else {
          var ref = findReference(expr, aprime, afp, cap);
          result = headlessFromRefItem(expr, aprime, ref, idx, cap);
        }
      }
    }

    headlessCache[key] = result;
    return result;
  }

  var headlessTermCache = {};
  function headlessTermItem(expr, idx, cap) {
    var key = serializeExpr(expr) + '|' + idx + '|' + cap;
    if (headlessTermCache.hasOwnProperty(key)) return headlessTermCache[key];
    var result = (expr.length === 2 && expr[0] === 1 && expr[1] === 2) ? idx + 1 : headlessItem(expr, idx, cap);
    headlessTermCache[key] = result;
    return result;
  }

  var fsCache = {};
  function fsItem(expr, pos, cap) {
    var key = serializeExpr(expr) + '|' + pos + '|' + cap;
    if (fsCache.hasOwnProperty(key)) return fsCache[key];
    var result = null;
    if (pos >= 1) {
      if (expr === Infinity) {
        result = pos === 1 ? [1] : nestedLimitHeadless(pos - 1);
      } else if (!isSuccessorExpr(expr)) {
        result = pos === 1 ? [1] : headlessItem(expr, pos - 1, cap);
      }
    }
    fsCache[key] = result;
    return result;
  }

  function fsFull(expr, count, cap) {
    var out = [];
    for (var i = 1; i <= count; i++) {
      var item = fsItem(expr, i, cap);
      if (item === null) break;
      out.push(item);
    }
    return out;
  }

  // ── depth-limited enumeration of all subtrees ────────────────
  // (used to avoid displaying duplicate expressions in the tree)

  function allSubSequences(seq, maxDepth) {
    var seen = {}, out = [];
    function walk(s, d) {
      var k = serializeExpr(s);
      if (seen[k]) return;
      seen[k] = true;
      out.push({ expr: s, depth: d });
      if (d <= 0) return;
      // walk through FS items up to a small bound
      for (var p = 1; p <= 8; p++) {
        var item = fsItem(s, p, 200);
        if (item === null) break;
        walk(item, d - 1);
      }
    }
    walk(seq, maxDepth);
    return out;
  }

  // ── expand for a given FS index (n is column index) ───────────

  function expand(seq, n) {
    // seq: array of terms (integers or sub-expressions)
    // n: FS index
    if (seq === Infinity || seq[0] === Infinity) {
      return n === 0 ? [1] : nestedLimitHeadless(n);
    }
    if (seq.length === 0) return [];
    var item = fsItem(seq, n + 1, 200);
    return item || [];
  }

  // ── fromDisplay: parse string to expression ───────────────────

  function fromDisplay(str) {
    str = str.trim();
    if (str === 'Limit' || str === 'Infinity') return [Infinity];

    // Parse nested format: '1,(1,2)' → [1, [1,2]]
    // We use a simple recursive descent parser
    var idx = 0;
    function parseExpr() {
      var terms = [];
      while (idx < str.length) {
        var ch = str[idx];
        if (ch === ')' || ch === ']') { idx++; break; }
        if (ch === ' ') { idx++; continue; }
        if (ch === ',') { idx++; continue; }
        if (ch === '(' || ch === '[') {
          idx++; // skip opener
          var sub = parseExpr();
          terms.push(sub);
        } else {
          // read number
          var num = '';
          while (idx < str.length && /[0-9]/.test(str[idx])) { num += str[idx]; idx++; }
          terms.push(parseInt(num, 10));
        }
      }
      // If flat sequence, wrap in array
      return terms;
    }

    var result = parseExpr();
    if (result.length === 1 && Array.isArray(result[0])) return result[0];
    return result;
  }

  // ── display: expression → string ─────────────────────────────

  function displayFunc(expr) {
    if ('' + expr === 'Infinity') return 'Limit';
    return dispExpr(expr);
  }

  // ── able: can this expression be expanded? ───────────────────

  function able(seq) {
    if (seq === Infinity || seq[0] === Infinity) return true;
    if (seq.length === 0) return false;
    // successor expressions (ending in 1) cannot be expanded
    return !isSuccessorExpr(seq);
  }

  // ── init: initial data rows ─────────────────────────────────

  function init() {
    return [
      { expr: [Infinity], low: [[]], subitems: [] },
      { expr: [],         low: [[]], subitems: [] },
    ];
  }

  // ── register ─────────────────────────────────────────────────

  register.push({
    id: 'ssqprss',
    name: 'Subsequential LPrSS V0.1.1',
    display: displayFunc,
    fromDisplay: fromDisplay,
    able: able,
    compare: sequence_compare,
    FS: (function(){
      var cache = {};
      return function(seq, n) {
        var key = JSON.stringify(seq);
        if (key === '[Infinity]') {
          return n === 0 ? [1] : nestedLimitHeadless(n);
        }
        if (seq.length === 0) return [];
        if (!cache[key]) cache[key] = [];
        else if (cache[key][n] !== undefined) return cache[key][n];
        return cache[key][n] = expand(seq, n);
      };
    })(),
    init: init,
  });
})();
