// Generated from https://github.com/SmileLee-lyx/ne-rewritten
// Pinned commit: 5413a94f0c5b6b56b4c13a91a8acf3a794698bb9
// Run: npm run build:smilelee-notations -- --source <checkout>
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/utils.ts
  function number_compare(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  function boolean_compare(a, b) {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }
  function compare_by(transform, cmp) {
    return (a, b) => cmp(transform(a), transform(b));
  }
  function lex_compare(a, b, cmp) {
    let len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const result = cmp(a[i], b[i]);
      if (result !== 0) return result;
    }
    return number_compare(a.length, b.length);
  }
  function lex_compare_by(cmp) {
    return (a, b) => lex_compare(a, b, cmp);
  }
  function anti_lex_compare(a, b, cmp) {
    if (a.length !== b.length) return number_compare(a.length, b.length);
    let len = a.length;
    for (let i = len - 1; i >= 0; i--) {
      const result = cmp(a[i], b[i]);
      if (result !== 0) return result;
    }
    return 0;
  }
  function tuple_lex_compare(a, b, cmp) {
    for (let i = 0; i < cmp.length; i++) {
      const result = cmp[i]?.(a[i], b[i]) ?? 0;
      if (result !== 0) return result;
    }
    return 0;
  }
  function tuple_lex_compare_by(cmp) {
    return (a, b) => tuple_lex_compare(a, b, cmp);
  }
  function object_lex_compare(a, b, cmp, order) {
    for (let key of order) {
      const result = cmp[key](a[key], b[key]);
      if (result !== 0) return result;
    }
    return 0;
  }
  function object_lex_compare_by(cmp, order) {
    return (a, b) => object_lex_compare(a, b, cmp, order);
  }
  function deepcopy(obj) {
    if (!obj) return obj;
    if (typeof obj === "number" || typeof obj === "boolean" || typeof obj === "string") return obj;
    if (Array.isArray(obj)) {
      const result = Array.from({ length: obj.length });
      for (let i = 0, len = obj.length; i < len; i++) {
        if (i in obj) result[i] = deepcopy(obj[i]);
      }
      return result;
    } else {
      const result = {};
      for (const key in obj) {
        result[key] = deepcopy(obj[key]);
      }
      return result;
    }
  }
  function index_of_first(array, predicate) {
    return array.findIndex(predicate);
  }
  function index_of_last(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) return i;
    }
    return -1;
  }
  function bind1(fn, t1) {
    return (...t_rest) => fn(t1, ...t_rest);
  }
  function bind2(fn, t2) {
    return (t1, ...t_rest) => fn(t1, t2, ...t_rest);
  }
  function bind3(fn, t3) {
    return (t1, t2, ...t_rest) => fn(t1, t2, t3, ...t_rest);
  }
  var DisplaySet = class {
    constructor(display19, items) {
      __publicField(this, "_map");
      __publicField(this, "_display");
      this._display = display19;
      this._map = /* @__PURE__ */ new Map();
      if (items) {
        for (const item of items) {
          this.add(item);
        }
      }
    }
    add(value) {
      this._map.set(this._display(value), value);
      return this;
    }
    has(value) {
      return this._map.has(this._display(value));
    }
    delete(value) {
      return this._map.delete(this._display(value));
    }
    values() {
      return Array.from(this._map.values());
    }
    get size() {
      return this._map.size;
    }
    forEach(callback) {
      this._map.forEach((value) => callback(value));
    }
    [Symbol.iterator]() {
      return this._map.values();
    }
  };
  var DisplayMap = class {
    constructor(display19, entries) {
      __publicField(this, "_map");
      __publicField(this, "_display");
      this._display = display19;
      this._map = /* @__PURE__ */ new Map();
      if (entries) {
        for (const [key, value] of entries) {
          this.set(key, value);
        }
      }
    }
    set(key, value) {
      this._map.set(this._display(key), [key, value]);
      return this;
    }
    get(key) {
      return this._map.get(this._display(key))?.[1];
    }
    has(key) {
      return this._map.has(this._display(key));
    }
    delete(key) {
      return this._map.delete(this._display(key));
    }
    entries() {
      return Array.from(this._map.values());
    }
    values() {
      return Array.from(this._map.values()).map(([, v]) => v);
    }
    keys() {
      return Array.from(this._map.values()).map(([k]) => k);
    }
    get size() {
      return this._map.size;
    }
    forEach(callback) {
      this._map.forEach(([k, v]) => callback(v, k));
    }
  };

  // src/notations/Misc/Omega.ts
  function is_infinity(a) {
    return a === Infinity;
  }
  function compare(a, b) {
    return number_compare(a, b);
  }
  function display(a) {
    return a === Infinity ? "\u03C9" : "" + a;
  }
  function from_display(s) {
    s = s.trim().toLowerCase();
    if (s === "\u03C9" || s === "w" || s === "Infinity" || s === "Limit") return Infinity;
    if (!/^-?\d+$/.test(s)) throw new Error(`Illegal input string: ${s}`);
    return parseInt(s, 10);
  }
  var omega = {
    id: "omega",
    name: "Natural numbers",
    simple_name: "\u03C9",
    display: { plain: display, from_display },
    is_limit: is_infinity,
    compare,
    FS: (a, i) => is_infinity(a) ? i : a > 0 ? a - 1 : 0,
    init: () => [Infinity, 0]
  };

  // src/notations/notation_utils.ts
  function Y_FS_variants(expand_longer, is_infinity31, infinity_FS27, is_limit21, display19) {
    const data20 = {};
    const data_short2 = {};
    const core = {
      FS: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data20[data_key] === void 0) data20[data_key] = [];
        else if (data20[data_key][index] !== void 0) return data20[data_key][index];
        return data20[data_key][index] = expand_longer(seq, index);
      },
      FS_alter: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const result = core.FS(seq, index);
        return result.slice(0, result.length - 1);
      },
      FS_short: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        if (index === 0) return seq.slice(0, seq.length - 1);
        if (index === 1) {
          const result = core.FS(seq, 1);
          return result.slice(0, seq.length);
        }
        const data_key = display19(seq);
        const d = data_short2[data_key];
        if (d === void 0) {
          data_short2[data_key] = core.FS_alter(seq, 1).length !== seq.length;
        }
        return core.FS_alter(seq, index - (data_short2[data_key] ? 1 : 0));
      }
    };
    return core;
  }
  function sequence_FS_variants0(expand18, is_infinity31, infinity_FS27, is_limit21, display19) {
    const data20 = {};
    const data_short2 = {};
    const core = {
      FS: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data20[data_key] === void 0) data20[data_key] = [];
        else if (data20[data_key][index] !== void 0) return data20[data_key][index];
        return data20[data_key][index] = expand18(seq, index);
      },
      FS_short: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        if (index === 0) return seq.slice(0, seq.length - 1);
        if (index === 1) {
          const result = core.FS(seq, 1);
          return result.slice(0, seq.length);
        }
        const data_key = display19(seq);
        let d = data_short2[data_key];
        if (d === void 0) {
          d = data_short2[data_key] = core.FS(seq, 0).length !== seq.length;
        }
        return core.FS(seq, index - (d ? 2 : 1));
      }
    };
    return core;
  }
  function sequence_FS_variants(expand18, is_infinity31, infinity_FS27, is_limit21, display19) {
    const data20 = {};
    const data_alter = {};
    const data_short2 = {};
    const core = {
      FS: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data20[data_key] === void 0) data20[data_key] = [];
        else if (data20[data_key][index] !== void 0) return data20[data_key][index];
        return data20[data_key][index] = expand18(seq, index, false);
      },
      FS_alter: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data_alter[data_key] === void 0) data_alter[data_key] = [];
        else if (data_alter[data_key][index] !== void 0) return data_alter[data_key][index];
        return data_alter[data_key][index] = expand18(seq, index, true);
      },
      FS_short: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        if (index === 0) return seq.slice(0, seq.length - 1);
        if (index === 1) {
          const result = core.FS(seq, 1);
          return result.slice(0, seq.length);
        }
        const data_key = display19(seq);
        let d = data_short2[data_key];
        if (d === void 0) {
          d = data_short2[data_key] = core.FS_alter(seq, 1).length !== seq.length;
        }
        return core.FS_alter(seq, index - (d ? 1 : 0));
      }
    };
    return core;
  }
  function MN_FS_variants(expand18, is_infinity31, infinity_FS27, is_limit21, display19) {
    const data20 = {};
    const data_alter = {};
    const data_short2 = {};
    const core = {
      FS: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data20[data_key] === void 0) data20[data_key] = [];
        else if (data20[data_key][index] !== void 0) return data20[data_key][index];
        return data20[data_key][index] = expand18(seq, index, false);
      },
      FS_alter: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        if (data_alter[data_key] === void 0) data_alter[data_key] = [];
        else if (data_alter[data_key][index] !== void 0) return data_alter[data_key][index];
        return data_alter[data_key][index] = expand18(seq, index, true);
      },
      FS_short: (seq, index) => {
        if (is_infinity31(seq)) return infinity_FS27(index);
        if (!seq.length) return [];
        if (!is_limit21(seq)) return seq.slice(0, seq.length - 1);
        if (index === 0) return seq.slice(0, seq.length - 1);
        const data_key = display19(seq);
        let d = data_short2[data_key];
        if (d === void 0) {
          let target = core.FS_alter(seq, 1);
          d = data_short2[data_key] = [
            target[seq.length - 1].length !== seq[seq.length - 1].length - 1,
            target.length !== seq.length
          ];
        }
        let current = 1;
        if (d[0]) {
          if (index === current) {
            let result = seq.slice();
            result[result.length - 1] = result[result.length - 1].slice();
            result[result.length - 1].pop();
            return result;
          } else current++;
        }
        if (d[1]) {
          if (index === current) {
            return core.FS_alter(seq, 1).slice(0, seq.length);
          } else current++;
        }
        return core.FS_alter(seq, 1 + index - current);
      }
    };
    return core;
  }
  function merge_sum(terms) {
    let result = [];
    let i = 0;
    while (i < terms.length) {
      let j = i + 1;
      let t = terms[i];
      while (j < terms.length && terms[j] === t) j++;
      if (j === i + 1) {
        result.push(terms[i]);
      } else {
        let count = j - i;
        if (t === "1") result.push("" + count);
        else result.push(t + count);
      }
      i = j;
    }
    return result.join("+");
  }

  // src/notations/Misc/Veblen.ts
  var INFINITY = Symbol("infinity");
  function is_infinity2(e) {
    return e === INFINITY;
  }
  function display_list_impl(l, d) {
    function impl_list(l2) {
      if (l2.length === 0) return "";
      if (list_is_finite(l2[0][0])) {
        const max = list_to_nat(l2[0][0]);
        const values3 = Array(max + 1).fill(zero());
        for (let [p, v] of l2) values3[list_to_nat(p)] = v;
        return values3.map(d).toReversed().join(",");
      }
      return l2.map(impl_list_entry).join(",");
    }
    function impl_list_entry([p, v]) {
      if (p.length === 0) return d(v) + "@0";
      if (p.length === 1 && p[0][0].length === 0) return d(v) + "@" + d(p[0][1]);
      return d(v) + "@(" + impl_list(p) + ")";
    }
    return impl_list(l);
  }
  function is_finite(e) {
    if (e[0] === 0) return true;
    if (e[0] === 2) return is_one(e);
    return is_one(e[1][0]);
  }
  function to_nat(e) {
    return prim_list(e).length;
  }
  function from_nat(n) {
    return from_prim_list(Array(n).fill(one()));
  }
  function list_is_finite(l) {
    return l.length === 0 || l.length === 1 && l[0][0].length === 0 && is_finite(l[0][1]);
  }
  function list_to_nat(l) {
    if (l.length === 0) return 0;
    return to_nat(l[0][1]);
  }
  function list_from_nat(n) {
    if (n === 0) return [];
    return [[[], from_nat(n)]];
  }
  function add_tail_to_list(l, tail2) {
    let new_l = [];
    for (let [p, v] of l) {
      if (!list_is_finite(p)) new_l.push([p, v]);
      else new_l.push([list_from_nat(list_to_nat(p) + 1), v]);
    }
    if (!is_zero(tail2)) new_l.push([[], tail2]);
    return new_l;
  }
  function display2(e, type) {
    const is_latex = type === "latex";
    if (is_infinity2(e)) return is_latex ? "\\mathrm{Limit}" : "Limit";
    function impl(e2) {
      switch (e2[0]) {
        case 0:
          return "0";
        case 1:
          return merge_sum(e2[1].map(impl));
        case 2:
          const phi = is_latex ? "\\varphi " : "\u03C6";
          if (e2[1].length === 0) {
            if (is_zero(e2[2])) return "1";
            if (is_one(e2[2])) return is_latex ? "\\omega" : "\u03C9";
            if (type === "html") {
              return "\u03C9<sup>" + impl(e2[2]) + "</sup>";
            } else if (type === "latex") {
              return "\\omega^{" + impl(e2[2]) + "}";
            }
            return phi + "(" + impl(e2[2]) + ")";
          }
          let l = add_tail_to_list(e2[1], e2[2]);
          return phi + "(" + display_list_impl(l, impl) + ")";
        default:
          throw new Error("Unreachable");
      }
    }
    return impl(e);
  }
  function display_separate(e, type) {
    const is_latex = type === "latex";
    if (is_infinity2(e)) return is_latex ? "\\mathrm{Limit}" : "Limit";
    function impl(e2) {
      switch (e2[0]) {
        case 0:
          return "0";
        case 1:
          return merge_sum(e2[1].map(impl));
        case 2:
          const phi = is_latex ? "\\varphi " : "\u03C6";
          if (e2[1].length === 0) {
            if (is_zero(e2[2])) return "1";
            if (is_one(e2[2])) return is_latex ? "\\omega" : "\u03C9";
            if (type === "html") {
              return "\u03C9<sup>" + impl(e2[2]) + "</sup>";
            } else if (type === "latex") {
              return "\\omega^{" + impl(e2[2]) + "}";
            }
            return phi + "(" + impl(e2[2]) + ")";
          }
          return phi + "(" + display_list_impl(e2[1], impl) + ";" + impl(e2[2]) + ")";
        default:
          throw new Error("Unreachable");
      }
    }
    return impl(e);
  }
  function zero() {
    return [0];
  }
  function one() {
    return [2, [], zero()];
  }
  function is_zero(e) {
    return e[0] === 0;
  }
  function is_one(e) {
    return e[0] === 2 && e[1].length === 0 && is_zero(e[2]);
  }
  function infinity_FS(index) {
    let list = [];
    for (let i = 0; i < index; i++) {
      list = [[list, one()]];
    }
    return [2, list, zero()];
  }
  function is_limit(e) {
    if (is_infinity2(e)) return true;
    if (e[0] === 0) return false;
    else if (e[0] === 1) return is_limit(e[1][e[1].length - 1]);
    return e[1].length !== 0 || !is_zero(e[2]);
  }
  function list_is_limit(l) {
    if (l.length === 0) return false;
    const [p, v] = l[l.length - 1];
    return p.length > 0 || is_limit(v);
  }
  function prim_list(a) {
    switch (a[0]) {
      case 0:
        return [];
      case 1:
        return a[1];
      case 2:
        return [a];
    }
  }
  function from_prim_list(a) {
    if (a.length === 0) return [0];
    if (a.length === 1) return a[0];
    return [1, a];
  }
  function count_unbounded(l, bound) {
    let result = 0;
    for (let [p, v] of l) {
      result += count_unbounded(p, bound);
      if (compare2(v, bound) >= 0) result++;
    }
    return result;
  }
  function bounded_by(l, bound) {
    return count_unbounded(l, bound) === 0;
  }
  function list_lex_compare(a, b) {
    return lex_compare(a, b, tuple_lex_compare_by([list_lex_compare, compare2]));
  }
  function compare2(a, b) {
    if (is_infinity2(a) || is_infinity2(b)) {
      return boolean_compare(is_infinity2(a), is_infinity2(b));
    }
    if (a[0] === 0 || b[0] === 0) {
      return boolean_compare(!is_zero(a), !is_zero(b));
    }
    if (a[0] === 1 || b[0] === 1) {
      return lex_compare(prim_list(a), prim_list(b), compare2);
    }
    let list_cmp = list_lex_compare(a[1], b[1]);
    if (list_cmp === 0) return compare2(a[2], b[2]);
    if (list_cmp < 0) [a, b] = [b, a];
    return list_cmp * (bounded_by(b[1], a) && compare2(b[2], a) < 0 ? 1 : -1);
  }
  function get_abnormal(l, current) {
    if (current === void 0) current = l;
    if (current.length === 0) return void 0;
    const [p, v] = current[current.length - 1];
    if (v[0] !== 2) return void 0;
    if (is_one(v)) return get_abnormal(l, p);
    if (list_lex_compare(l, v[1]) < 0 && count_unbounded(l, v) === 1) return v;
    return void 0;
  }
  function is_normal_tail(l, v) {
    if (v[0] !== 2) return true;
    return list_lex_compare(l, v[1]) >= 0 || !bounded_by(l, v);
  }
  function normalized_phi(l, v) {
    if (!is_normal_tail(l, v)) return v;
    if (is_zero(v)) {
      let abnormal = get_abnormal(l);
      if (abnormal !== void 0) return abnormal;
    }
    return [2, l, v];
  }
  function normalize(e) {
    if (e[0] !== 2) throw new Error("illegal argument");
    return normalized_phi(e[1], e[2]);
  }
  var MARK = Symbol("mark");
  function replace_mark(template, value) {
    function impl(t) {
      if (t === MARK) return value;
      switch (t[0]) {
        case 0:
          return [0];
        case 1:
          return [1, t[1].map(impl)];
        case 2:
          return [2, impl_list(t[1]), impl(t[2])];
      }
    }
    function impl_list(l) {
      const result = l.map(impl_entry);
      if (result.length > 0 && is_zero(result[result.length - 1][1])) result.pop();
      return result;
    }
    function impl_entry([p, v]) {
      return [impl_list(p), impl(v)];
    }
    return impl(template);
  }
  function prev_list(l) {
    const [p, v] = l[l.length - 1];
    const v_prev = FS(v, 0);
    if (is_zero(v_prev)) return l.slice(0, -1);
    return [...l.slice(0, -1), [p, v_prev]];
  }
  function create_template_list(l, index) {
    const [p, v] = l[l.length - 1];
    if (is_limit(v)) return [[...l.slice(0, -1), [p, FS(v, index)]], "plain"];
    const v_prev = FS(v, 0);
    let new_l = l.slice(0, -1);
    if (!is_zero(v_prev)) new_l.push([p, v_prev]);
    if (!list_is_limit(p)) {
      new_l.push([prev_list(p), MARK]);
      return [new_l, "iterate"];
    }
    const [new_p, type] = create_template_list(p, index);
    new_l.push([new_p, one()]);
    return [new_l, type];
  }
  function create_template(l, index) {
    if (!list_is_limit(l)) {
      const l_prev = prev_list(l);
      return [[2, l_prev, MARK], "iterate"];
    }
    const [tl, type] = create_template_list(l, index);
    if (type === "plain") return [[2, tl, MARK], "plain"];
    else return [[2, tl, zero()], "iterate"];
  }
  function FS(a, index) {
    if (is_infinity2(a)) return infinity_FS(index);
    if (a[0] === 0) return zero();
    if (a[0] === 1) {
      const tail_FS = FS(a[1][a[1].length - 1], index);
      return from_prim_list([...a[1].slice(0, -1), ...prim_list(tail_FS)]);
    }
    if (is_limit(a[2])) {
      const tail_FS = FS(a[2], index);
      return normalized_phi(a[1], tail_FS);
    }
    if (a[1].length === 0) {
      if (is_zero(a[2])) return zero();
      let tail_FS = FS(a[2], 0);
      let result = normalized_phi([], tail_FS);
      return from_prim_list(Array(index).fill(result));
    }
    let initial_value;
    if (is_zero(a[2])) initial_value = zero();
    else initial_value = [1, [normalized_phi(a[1], FS(a[2], 0)), one()]];
    const [t, type] = create_template(a[1], index);
    if (type === "plain") return normalize(replace_mark(t, initial_value));
    if (index === 0) return initial_value;
    let current = normalize(replace_mark(t, initial_value));
    for (let i = 1; i < index; i++) current = replace_mark(t, current);
    return current;
  }
  var VeblenPhi = {
    id: "veblen-phi",
    name: "Extended Veblen's \u03C6 Function",
    simple_name: "BHO \u03C6",
    is_limit,
    FS,
    compare: compare2,
    display: {
      plain: bind2(display2, "plain"),
      html: bind2(display2, "html"),
      latex: bind2(display2, "latex")
    },
    display_equiv: {
      separate: {
        plain: bind2(display_separate, "plain"),
        html: bind2(display_separate, "html"),
        latex: bind2(display_separate, "latex"),
        name_id: "display.veblen-separate"
      }
    },
    init: () => [INFINITY, zero()]
  };

  // src/notations/OCN/OCN_utils.ts
  function merge_sum2(terms) {
    if (terms.length === 0) return { type: "number", value: 0 };
    const result = [];
    let i = 0;
    while (i < terms.length) {
      let j = i + 1;
      const key = display_OCN_IR(terms[i], "plain");
      while (j < terms.length && display_OCN_IR(terms[j], "plain") === key) j++;
      const count = j - i;
      if (count === 1) {
        result.push(terms[i]);
      } else if (key === "1") {
        result.push({ type: "number", value: count });
      } else {
        result.push({ type: "mul_nat", value: terms[i], coe: count });
      }
      i = j;
    }
    if (result.length === 0) return { type: "number", value: 0 };
    if (result.length === 1) return result[0];
    return { type: "sum", terms: result };
  }
  function display_OCN_IR(e, type) {
    switch (e.type) {
      case "number":
        return "" + e.value;
      case "sum":
        return e.terms.map((t) => display_OCN_IR(t, type)).join("+");
      case "mul_nat": {
        const v = display_OCN_IR(e.value, type);
        if (type === "latex") return v + "\\cdot " + e.coe;
        return v + "\xB7" + e.coe;
      }
      case "omega":
        return display_OCN_IR(
          {
            type: "constant",
            display: "\u03C9",
            display_latex: "\\omega ",
            sup: e.sup
          },
          type
        );
      case "Omega":
        return display_OCN_IR(
          {
            type: "constant",
            display: "\u03A9",
            display_latex: "\\Omega ",
            sub: e.sub
          },
          type
        );
      case "psi":
        return display_OCN_IR(
          {
            type: "constant",
            display: "\u03C8",
            display_latex: "\\psi ",
            sub: e.sub,
            arg: e.arg
          },
          type
        );
      case "constant": {
        const name = type === "latex" ? e.display_latex : e.display;
        const sup_str = e.sup ? display_OCN_IR(e.sup, type) : void 0;
        const sub_str = e.sub ? display_OCN_IR(e.sub, type) : void 0;
        const arg_str = e.arg ? display_OCN_IR(e.arg, type) : "";
        let result = name;
        if (sup_str !== void 0) {
          if (type === "html") result += "<sup>" + sup_str + "</sup>";
          else if (type === "latex") result += "^{" + sup_str + "}";
          else result += "{" + sup_str + "}";
        }
        if (sub_str !== void 0) {
          if (type === "html") result += "<sub>" + sub_str + "</sub>";
          else if (type === "latex") result += "_{" + sub_str + "}";
          else result += "[" + sub_str + "]";
        }
        if (e.arg) result += "(" + arg_str + ")";
        return result;
      }
    }
  }
  function make_OCN_display(to_ir) {
    return {
      plain: (e) => display_OCN_IR(to_ir(e), "plain"),
      html: (e) => display_OCN_IR(to_ir(e), "html"),
      latex: (e) => display_OCN_IR(to_ir(e), "latex")
    };
  }

  // src/notations/OCN/BOCF_EBO.ts
  function INFINITY2() {
    return [Infinity];
  }
  function is_infinity3(a) {
    return a[0] === Infinity;
  }
  function is_zero2(a) {
    return a[0] === 0;
  }
  function prim_list2(e) {
    return is_zero2(e) ? [] : [e[1], ...prim_list2(e[2])];
  }
  function from_prim_list2(ps) {
    let result = [0];
    for (let i = ps.length - 1; i >= 0; i--) {
      result = [1, ps[i], result];
    }
    return result;
  }
  function infinity_FS2(index) {
    let result = [0];
    for (let i = 0; i < index; i++) result = [1, [result, [0]], [0]];
    return [1, [[0], result], [0]];
  }
  function to_OCN_IR(e) {
    if (is_infinity3(e)) return { type: "constant", display: "Limit", display_latex: "\\text{Limit}" };
    if (is_zero2(e)) return { type: "number", value: 0 };
    return merge_sum2(prim_list2(e).map(to_OCN_display_prim));
  }
  function to_OCN_display_prim(p) {
    const [v, a] = p;
    if (is_zero2(v)) return { type: "psi", arg: to_OCN_IR(a) };
    return { type: "psi", sub: to_OCN_IR(v), arg: to_OCN_IR(a) };
  }
  function compare3(a, b) {
    if (is_infinity3(a) || is_infinity3(b)) {
      return boolean_compare(is_infinity3(a), is_infinity3(b));
    }
    return lex_compare(prim_list2(a), prim_list2(b), prim_compare);
  }
  function prim_compare(a, b) {
    return lex_compare(a, b, compare3);
  }
  function cofinality(e) {
    const ps = prim_list2(e);
    if (ps.length === 0) return void 0;
    return cofinality_prim(ps[ps.length - 1]);
  }
  function cofinality_prim(p) {
    let [v, a] = p;
    if (is_zero2(a)) {
      if (is_zero2(v)) return void 0;
      let cf_v = cofinality(v);
      if (cf_v === void 0) return v;
      return cf_v;
    }
    let cf_a = cofinality(a);
    if (cf_a === void 0) return [0];
    if (compare3(cf_a, v) <= 0) return cf_a;
    return [0];
  }
  function ZERO() {
    return [0];
  }
  function ONE_prim() {
    return [ZERO(), ZERO()];
  }
  function from_nat2(n) {
    let result = [0];
    for (let i = 0; i < n; i++) {
      result = [1, ONE_prim(), result];
    }
    return result;
  }
  function to_nat2(e) {
    let ps = prim_list2(e);
    if (ps.length === 0) return 0;
    if (prim_compare(ps[0], ONE_prim()) !== 0) throw new Error("not a natural number");
    return ps.length;
  }
  function prim_FS(p, index) {
    let [v, a] = p;
    if (is_zero2(a)) {
      if (is_zero2(v)) return ZERO();
      let cf_v = cofinality(v);
      if (cf_v === void 0) return index;
      return [1, [FS2(v, index), [0]], [0]];
    }
    let cf_a = cofinality(a);
    if (cf_a === void 0) {
      let index_nat2 = to_nat2(index);
      let pred_prim = [v, FS2(a, [0])];
      return from_prim_list2(Array.from({ length: index_nat2 }, () => pred_prim));
    }
    if (compare3(cf_a, v) <= 0) {
      return [1, [v, FS2(a, index)], [0]];
    }
    let result = [0];
    let index_nat = to_nat2(index);
    let cf_a_pred = FS2(cf_a, [0]);
    for (let i = 0; i < index_nat; i++) {
      result = FS2(a, [1, [cf_a_pred, result], [0]]);
    }
    return [1, [v, result], [0]];
  }
  function FS2(e, index) {
    if (is_infinity3(e)) return infinity_FS2(to_nat2(index));
    if (is_zero2(e)) return e;
    if (is_zero2(e[2])) return prim_FS(e[1], index);
    return [1, e[1], FS2(e[2], index)];
  }
  var BOCF_EBO = {
    id: "bocf-ebo",
    name: "Buchholz's OCF",
    simple_name: "BOCF (EBO)",
    category_id: "category-ocf",
    is_limit: (e) => is_infinity3(e) || cofinality(e) !== void 0,
    compare: compare3,
    FS: (e, index) => FS2(e, from_nat2(index)),
    display: make_OCN_display(to_OCN_IR),
    credit_text_id: "credit.bocf",
    init: () => [INFINITY2(), ZERO()]
  };

  // src/notations/OCN/MOCF_EBO.ts
  function INFINITY3() {
    return [Infinity];
  }
  function is_infinity4(a) {
    return a[0] === Infinity;
  }
  function is_zero3(a) {
    return a[0] === 0;
  }
  function prim_list3(e) {
    if (is_zero3(e)) return [];
    if (e[0] !== 1) return [e];
    return e[1];
  }
  function from_prim_list3(ps) {
    if (ps.length === 0) return [0];
    if (ps.length === 1) return ps[0];
    return [1, ps];
  }
  function infinity_FS3(index) {
    let result = ONE();
    for (let i = 0; i < index; i++) result = [3, result];
    return [4, ZERO2(), result];
  }
  function to_OCN_IR2(e) {
    if (is_infinity4(e)) {
      return { type: "constant", display: "Limit", display_latex: "\\text{Limit}" };
    }
    switch (e[0]) {
      case 0:
        return { type: "number", value: 0 };
      case 1:
        return merge_sum2(e[1].map(to_OCN_IR2));
      case 2: {
        if (e[1][0] === 0) return { type: "number", value: 1 };
        if (e[1][0] === 2 && e[1][1][0] === 0) return { type: "omega" };
        return { type: "omega", sup: to_OCN_IR2(e[1]) };
      }
      case 3: {
        if (e[1][0] === 2 && e[1][1][0] === 0) return { type: "Omega" };
        return { type: "Omega", sub: to_OCN_IR2(e[1]) };
      }
      case 4: {
        const arg = to_OCN_IR2(e[2]);
        if (e[1][0] === 0) return { type: "psi", arg };
        const sub = to_OCN_IR2(e[1]);
        return { type: "psi", sub, arg };
      }
    }
  }
  function compare4(a, b) {
    if (is_infinity4(a) || is_infinity4(b)) {
      return boolean_compare(is_infinity4(a), is_infinity4(b));
    }
    function impl(a2, b2) {
      if (a2[0] === 0 || b2[0] === 0 || a2[0] === 1 || b2[0] === 1) {
        return lex_compare(prim_list3(a2), prim_list3(b2), impl);
      }
      if (a2[0] === 2 && b2[0] === 2) return impl(a2[1], b2[1]);
      if (a2[0] === 2) return impl(a2[1], b2);
      if (b2[0] === 2) return impl(a2, b2[1]);
      if (a2[0] === 3) {
        if (b2[0] === 3) {
          return impl(a2[1], b2[1]);
        }
        return tuple_lex_compare([a2[1], 0], [b2[1], 1], [impl, number_compare]);
      }
      if (b2[0] === 3) {
        return tuple_lex_compare([a2[1], 1], [b2[1], 0], [impl, number_compare]);
      }
      return tuple_lex_compare([a2[1], a2[2]], [b2[1], b2[2]], [impl, impl]);
    }
    return impl(a, b);
  }
  function add(a, b) {
    return from_prim_list3([...prim_list3(a), ...prim_list3(b)]);
  }
  function omega_pow(a) {
    if (a[0] >= 3) return a;
    return [2, a];
  }
  function cofinality2(e) {
    switch (e[0]) {
      case 0:
        return void 0;
      case 1:
        return cofinality2(e[1][e[1].length - 1]);
      case 2:
        if (is_zero3(e[1])) return void 0;
        return cofinality2(e[1]) ?? ZERO2();
      case 3:
        return cofinality2(e[1]) ?? e[1];
      case 4:
        let [, v, a] = e;
        if (is_zero3(a)) {
          return ZERO2();
        }
        let cf_a = cofinality2(a);
        if (cf_a === void 0) return ZERO2();
        if (compare4(cf_a, v) <= 0) return cf_a;
        return ZERO2();
      default:
        throw new Error("unreachable");
    }
  }
  function ZERO2() {
    return [0];
  }
  function ONE() {
    return [2, ZERO2()];
  }
  function mul_nat(e, n) {
    return from_prim_list3(Array.from({ length: n }, () => e));
  }
  function from_nat3(n) {
    return mul_nat(ONE(), n);
  }
  function to_nat3(e) {
    let ps = prim_list3(e);
    if (ps.length === 0) return 0;
    if (compare4(ps[0], ONE()) !== 0) throw new Error("not a natural number");
    return ps.length;
  }
  function FS3(e, index) {
    if (is_infinity4(e)) return infinity_FS3(to_nat3(index));
    switch (e[0]) {
      case 0: {
        return ZERO2();
      }
      case 1: {
        let tail_FS = FS3(e[1][e[1].length - 1], index);
        return from_prim_list3([...e[1].slice(0, -1), ...prim_list3(tail_FS)]);
      }
      case 2: {
        if (is_zero3(e[1])) return ZERO2();
        let cf_e1 = cofinality2(e[1]);
        if (cf_e1 === void 0) {
          let wp_prev = omega_pow(FS3(e[1], ZERO2()));
          return mul_nat(wp_prev, to_nat3(index));
        } else {
          return omega_pow(FS3(e[1], index));
        }
      }
      case 3: {
        let cf_e1 = cofinality2(e[1]);
        if (cf_e1 === void 0) return index;
        let e1_FS = FS3(e[1], index);
        if (is_zero3(e1_FS)) return ZERO2();
        return [3, e1_FS];
      }
      case 4: {
        let [, v, a] = e;
        let cf_a = cofinality2(a);
        if (cf_a === void 0) {
          let i_nat = to_nat3(index);
          let base;
          if (is_zero3(a)) {
            if (is_zero3(v)) {
              base = ZERO2();
            } else {
              base = [3, v];
            }
          } else {
            let a_prev = FS3(a, ZERO2());
            base = [4, v, a_prev];
          }
          if (i_nat === 0) return base;
          let result = add(base, ONE());
          for (let i = 0; i < i_nat - 1; i++) {
            result = omega_pow(result);
          }
          return result;
        }
        if (compare4(cf_a, v) <= 0) {
          return [4, v, FS3(a, index)];
        } else {
          let cf_a_prev = FS3(cf_a, ZERO2());
          let i_nat = to_nat3(index);
          let result = ZERO2();
          for (let i = 0; i < i_nat; i++) {
            result = FS3(a, [4, cf_a_prev, result]);
          }
          return [4, v, result];
        }
      }
    }
  }
  var MOCF_EBO = {
    id: "mocf-ebo",
    name: "Madore's OCF",
    simple_name: "MOCF (EBO)",
    category_id: "category-ocf",
    is_limit: (e) => is_infinity4(e) || cofinality2(e) !== void 0,
    compare: compare4,
    FS: (e, index) => FS3(e, from_nat3(index)),
    display: make_OCN_display(to_OCN_IR2),
    credit_text_id: "credit.mocf",
    init: () => [INFINITY3(), ZERO2()]
  };

  // src/notations/OCN/NOCF_EBO.ts
  function INFINITY4() {
    return [Infinity];
  }
  function is_infinity5(a) {
    return a[0] === Infinity;
  }
  function is_zero4(a) {
    return a[0] === 0;
  }
  function infinity_FS4(index) {
    let result = [0];
    for (let i = 0; i < index; i++) result = [1, result, [0]];
    return [1, [0], result];
  }
  function to_OCN_IR3(e) {
    if (is_infinity5(e)) return { type: "constant", display: "Limit", display_latex: "\\text{Limit}" };
    if (is_zero4(e)) return { type: "number", value: 0 };
    const [, v, a] = e;
    if (is_zero4(v)) return { type: "psi", arg: to_OCN_IR3(a) };
    return { type: "psi", sub: to_OCN_IR3(v), arg: to_OCN_IR3(a) };
  }
  function compare5(a, b) {
    if (is_infinity5(a) || is_infinity5(b)) {
      return boolean_compare(is_infinity5(a), is_infinity5(b));
    }
    if (is_zero4(a) || is_zero4(b)) {
      return boolean_compare(!is_zero4(a), !is_zero4(b));
    }
    return lex_compare([a[1], a[2]], [b[1], b[2]], compare5);
  }
  function cofinality3(e) {
    if (is_zero4(e)) return void 0;
    let [, v, a] = e;
    if (is_zero4(a)) {
      if (is_zero4(v)) return void 0;
      let cf_v = cofinality3(v);
      if (cf_v === void 0) return v;
      return cf_v;
    }
    let cf_a = cofinality3(a);
    if (cf_a === void 0) return void 0;
    if (compare5(cf_a, v) <= 0) return cf_a;
    return [0];
  }
  function ZERO3() {
    return [0];
  }
  function from_nat4(n) {
    let result = [0];
    for (let i = 0; i < n; i++) {
      result = [1, [0], result];
    }
    return result;
  }
  function to_nat4(e) {
    if (is_zero4(e)) return 0;
    if (compare5(e[1], ZERO3()) !== 0) throw new Error("not a natural number");
    return 1 + to_nat4(e[2]);
  }
  function FS4(e, index) {
    if (is_infinity5(e)) return infinity_FS4(to_nat4(index));
    if (is_zero4(e)) return e;
    let [, v, a] = e;
    if (is_zero4(a)) {
      if (is_zero4(v)) return ZERO3();
      let cf_v = cofinality3(v);
      if (cf_v === void 0) return index;
      return [1, FS4(v, index), [0]];
    }
    let cf_a = cofinality3(a);
    if (cf_a === void 0) {
      return [1, v, FS4(a, [0])];
    }
    if (compare5(cf_a, v) <= 0) {
      return [1, v, FS4(a, index)];
    }
    let result = [0];
    let index_nat = to_nat4(index);
    let cf_a_pred = FS4(cf_a, [0]);
    for (let i = 0; i < index_nat; i++) {
      result = FS4(a, [1, cf_a_pred, result]);
    }
    return [1, v, result];
  }
  var NOCF_EBO = {
    id: "nocf-ebo",
    name: "Nothing OCF",
    simple_name: "NOCF (EBO)",
    category_id: "category-ocf",
    is_limit: (e) => is_infinity5(e) || cofinality3(e) !== void 0,
    compare: compare5,
    FS: (e, index) => FS4(e, from_nat4(index)),
    display: make_OCN_display(to_OCN_IR3),
    credit_text_id: "credit.nocf",
    init: () => [INFINITY4(), ZERO3()]
  };

  // src/notations/OCN/Inacc_OCF.ts
  function INFINITY5() {
    return [Infinity];
  }
  function zero2() {
    return ["zero"];
  }
  function one2() {
    return ["omega_pow", zero2()];
  }
  function omega2() {
    return ["omega_pow", one2()];
  }
  function Omega() {
    return ["Omega", one2()];
  }
  function I() {
    return ["I"];
  }
  function is_infinity6(e) {
    return "" + e === "Infinity";
  }
  function is_zero5(e) {
    return e[0] === "zero";
  }
  function is_one2(e) {
    return e[0] === "omega_pow" && is_zero5(e[1]);
  }
  function prim_list4(e) {
    if (is_zero5(e)) return [];
    if (e[0] === "sum") return e[1];
    return [e];
  }
  function from_prim_list4(es) {
    if (es.length === 0) return zero2();
    if (es.length === 1) return es[0];
    return ["sum", es];
  }
  function compare6(a, b) {
    if (is_infinity6(a) || is_infinity6(b)) {
      return boolean_compare(is_infinity6(a), is_infinity6(b));
    }
    function impl(a2, b2) {
      if (a2[0] === "zero" || b2[0] === "zero") {
        return boolean_compare(!is_zero5(a2), !is_zero5(b2));
      }
      if (a2[0] === "sum" || b2[0] === "sum") {
        return lex_compare(prim_list4(a2), prim_list4(b2), impl);
      }
      if (a2[0] === "omega_pow" && b2[0] === "omega_pow") {
        return impl(a2[1], b2[1]);
      }
      if (a2[0] === "omega_pow") {
        return impl(a2[1], b2);
      }
      if (b2[0] === "omega_pow") {
        return impl(a2, b2[1]);
      }
      if (a2[0] === "I") {
        switch (b2[0]) {
          case "Omega":
            return impl(a2, b2[1]);
          case "I":
            return 0;
          case "psi":
            return impl(a2, b2[1]) < 0 ? -1 : 1;
        }
      }
      if (b2[0] === "I") return -impl(b2, a2);
      if (a2[0] === "Omega") {
        switch (b2[0]) {
          case "Omega":
            return impl(a2[1], b2[1]);
          case "psi":
            if (b2[1][0] === "I") {
              return impl(a2[1], b2);
            }
            return impl(a2, b2[1]) < 0 ? -1 : 1;
        }
      }
      if (b2[0] === "Omega") return -impl(b2, a2);
      if (a2[1][0] === "I") {
        if (b2[1][0] === "I") return impl(a2[2], b2[2]);
        return impl(a2, b2[1]);
      }
      if (b2[1][0] === "I") return -impl(b2, a2);
      return lex_compare([a2[1], a2[2]], [b2[1], b2[2]], impl);
    }
    return impl(a, b);
  }
  function to_OCN_IR4(e) {
    if (is_infinity6(e)) return { type: "constant", display: "Limit", display_latex: "\\text{Limit}" };
    switch (e[0]) {
      case "zero":
        return { type: "number", value: 0 };
      case "sum":
        return merge_sum2(e[1].map(to_OCN_IR4));
      case "omega_pow": {
        if (is_zero5(e[1])) return { type: "number", value: 1 };
        if (is_one2(e[1])) return { type: "omega" };
        return { type: "omega", sup: to_OCN_IR4(e[1]) };
      }
      case "Omega": {
        if (is_one2(e[1])) return { type: "Omega" };
        return { type: "Omega", sub: to_OCN_IR4(e[1]) };
      }
      case "I":
        return { type: "constant", display: "I", display_latex: "\\mathrm{I}" };
      case "psi": {
        const sub = to_OCN_IR4(e[1]);
        const arg = to_OCN_IR4(e[2]);
        if (display_OCN_IR(sub, "plain") === "\u03A9") return { type: "psi", arg };
        return { type: "psi", sub, arg };
      }
    }
  }
  function add2(a, b) {
    return from_prim_list4([...prim_list4(a), ...prim_list4(b)]);
  }
  function omega_pow2(a) {
    if (a[0] === "zero" || a[0] === "sum" || a[0] === "omega_pow") return ["omega_pow", a];
    return a;
  }
  function Omega_index(a) {
    if (is_zero5(a)) return zero2();
    if (a[0] === "I" || a[0] === "psi" && a[1][0] === "I") return a;
    return ["Omega", a];
  }
  function cofinality4(e) {
    switch (e[0]) {
      case "zero": {
        return zero2();
      }
      case "sum": {
        return cofinality4(e[1][e[1].length - 1]);
      }
      case "omega_pow": {
        let cf_e1 = cofinality4(e[1]);
        if (is_zero5(cf_e1)) return one2();
        if (is_one2(cf_e1)) return omega2();
        return cf_e1;
      }
      case "Omega": {
        let cf_e1 = cofinality4(e[1]);
        if (is_one2(cf_e1)) return e;
        return cf_e1;
      }
      case "I": {
        return e;
      }
      case "psi": {
        let [, v, a] = e;
        if (is_zero5(a)) {
          return omega2();
        }
        let cf_a = cofinality4(a);
        if (is_zero5(cf_a) || is_one2(cf_a)) return omega2();
        if (compare6(cf_a, v) < 0) return cf_a;
        return omega2();
      }
    }
  }
  function mul_nat2(e, n) {
    return from_prim_list4(Array.from({ length: n }, () => e));
  }
  function from_nat5(n) {
    return mul_nat2(one2(), n);
  }
  function to_nat5(e) {
    let ps = prim_list4(e);
    if (ps.length === 0) return 0;
    if (compare6(ps[0], one2()) !== 0) throw new Error("not a natural number");
    return ps.length;
  }
  function infinity_FS5(index) {
    let result;
    if (index === 0) result = zero2();
    else if (index === 1) result = I();
    else {
      result = add2(I(), one2());
      for (let i = 0; i < index - 2; i++) result = ["omega_pow", result];
    }
    return ["psi", Omega(), result];
  }
  function FS5(e, index) {
    if (is_infinity6(e)) return infinity_FS5(to_nat5(index));
    switch (e[0]) {
      case "zero": {
        return zero2();
      }
      case "sum": {
        let tail_FS = FS5(e[1][e[1].length - 1], index);
        return from_prim_list4([...e[1].slice(0, -1), ...prim_list4(tail_FS)]);
      }
      case "omega_pow": {
        if (is_zero5(e[1])) return zero2();
        let cf_e1 = cofinality4(e[1]);
        if (is_one2(cf_e1)) {
          let wp_prev = omega_pow2(FS5(e[1], zero2()));
          return mul_nat2(wp_prev, to_nat5(index));
        } else {
          return omega_pow2(FS5(e[1], index));
        }
      }
      case "Omega": {
        let cf_e1 = cofinality4(e[1]);
        if (is_one2(cf_e1)) return index;
        let e1_FS = FS5(e[1], index);
        return Omega_index(e1_FS);
      }
      case "I": {
        return index;
      }
      case "psi": {
        let [, v, a] = e;
        let cf_a = cofinality4(a);
        if (is_zero5(cf_a) || is_one2(cf_a)) {
          let i_nat = to_nat5(index);
          let base;
          if (is_zero5(a)) {
            if (v[0] === "I" || v[0] === "Omega" && is_one2(v[1])) {
              base = zero2();
            } else {
              if (v[0] !== "Omega") throw new Error("Illegal state");
              base = Omega_index(FS5(v[1], zero2()));
            }
          } else {
            let a_prev = FS5(a, zero2());
            base = ["psi", v, a_prev];
          }
          if (i_nat === 0) return base;
          let result = add2(base, one2());
          for (let i = 0; i < i_nat - 1; i++) {
            if (v[0] === "Omega") {
              result = ["omega_pow", result];
            } else {
              result = ["Omega", result];
            }
          }
          return result;
        }
        if (compare6(cf_a, v) < 0) {
          return ["psi", v, FS5(a, index)];
        } else {
          let i_nat = to_nat5(index);
          let result = zero2();
          for (let i = 0; i < i_nat; i++) {
            result = FS5(a, ["psi", cf_a, result]);
          }
          return ["psi", v, result];
        }
      }
    }
  }
  function is_limit2(e) {
    if (is_infinity6(e)) return true;
    let cf_e = cofinality4(e);
    return !is_zero5(cf_e) && !is_one2(cf_e);
  }
  var Inacc_OCF = {
    id: "inacc-ocf",
    name: "Inaccessible ordinal OCF",
    simple_name: "OCF (I)",
    category_id: "category-ocf",
    is_limit: is_limit2,
    compare: compare6,
    FS: (e, index) => FS5(e, from_nat5(index)),
    display: make_OCN_display(to_OCN_IR4),
    credit_text_id: "credit.bocf",
    init: () => [INFINITY5(), zero2()],
    debug: { cofinality: cofinality4 }
  };

  // src/notations/OCN/finite_Mahlo_OCF.ts
  function INFINITY6() {
    return [Infinity];
  }
  function zero3() {
    return ["zero"];
  }
  function one3() {
    return ["omega_pow", zero3()];
  }
  function omega3() {
    return ["omega_pow", one3()];
  }
  function Omega2() {
    return ["M", 1];
  }
  function M_index(n) {
    return ["M", n];
  }
  function is_infinity7(e) {
    return "" + e === "Infinity";
  }
  function is_zero6(e) {
    return e[0] === "zero";
  }
  function is_one3(e) {
    return e[0] === "omega_pow" && is_zero6(e[1]);
  }
  function prim_list5(e) {
    if (is_zero6(e)) return [];
    if (e[0] === "sum") return e[1];
    return [e];
  }
  function from_prim_list5(es) {
    if (es.length === 0) return zero3();
    if (es.length === 1) return es[0];
    return ["sum", es];
  }
  function to_OCN_IR5(e) {
    if (is_infinity7(e)) return { type: "constant", display: "Limit", display_latex: "\\text{Limit}" };
    switch (e[0]) {
      case "zero":
        return { type: "number", value: 0 };
      case "sum":
        return merge_sum2(e[1].map(to_OCN_IR5));
      case "omega_pow": {
        if (is_zero6(e[1])) return { type: "number", value: 1 };
        if (is_one3(e[1])) return { type: "omega" };
        return { type: "omega", sup: to_OCN_IR5(e[1]) };
      }
      case "M": {
        if (e[1] === 1) return { type: "Omega" };
        if (e[1] === 2) return { type: "constant", display: "M", display_latex: "\\mathrm{M}" };
        return {
          type: "constant",
          display: "\u039E",
          display_latex: "\\Xi",
          arg: { type: "number", value: e[1] }
        };
      }
      case "psi": {
        const sub = to_OCN_IR5(e[1]);
        const arg = to_OCN_IR5(e[2]);
        if (display_OCN_IR(sub, "plain") === "\u03A9") return { type: "psi", arg };
        return { type: "psi", sub, arg };
      }
    }
  }
  function compare7(a, b) {
    if (is_infinity7(a) || is_infinity7(b)) {
      return boolean_compare(is_infinity7(a), is_infinity7(b));
    }
    function impl(a2, b2) {
      if (a2[0] === "zero" || b2[0] === "zero") {
        return boolean_compare(!is_zero6(a2), !is_zero6(b2));
      }
      if (a2[0] === "sum" || b2[0] === "sum") {
        return lex_compare(prim_list5(a2), prim_list5(b2), impl);
      }
      if (a2[0] === "omega_pow" && b2[0] === "omega_pow") {
        return impl(a2[1], b2[1]);
      }
      if (a2[0] === "omega_pow") {
        return impl(a2[1], b2);
      }
      if (b2[0] === "omega_pow") {
        return impl(a2, b2[1]);
      }
      if (a2[0] === "M") {
        switch (b2[0]) {
          case "M":
            return number_compare(a2[1], b2[1]);
          case "psi":
            return impl(a2, b2[1]) < 0 ? -1 : 1;
        }
      }
      if (b2[0] === "M") return -impl(b2, a2);
      let cmp_v = compare7(a2[1], b2[1]);
      if (cmp_v === 0) return compare7(a2[2], b2[2]);
      if (cmp_v < 0) [a2, b2] = [b2, a2];
      return cmp_v * (compare7(a2, b2[1]) < 0 ? -1 : 1);
    }
    return impl(a, b);
  }
  function m_deg(a) {
    switch (a[0]) {
      case "zero":
      case "sum":
      case "omega_pow":
        return 0;
      case "M":
        return a[1];
      case "psi":
        return m_deg(a[1]) - 1;
    }
  }
  function add3(a, b) {
    return from_prim_list5([...prim_list5(a), ...prim_list5(b)]);
  }
  function omega_pow3(a) {
    if (a[0] === "zero" || a[0] === "sum" || a[0] === "omega_pow") return ["omega_pow", a];
    return a;
  }
  function mul_nat3(e, n) {
    return from_prim_list5(Array.from({ length: n }, () => e));
  }
  function from_nat6(n) {
    return mul_nat3(one3(), n);
  }
  function to_nat6(e) {
    let ps = prim_list5(e);
    if (ps.length === 0) return 0;
    if (compare7(ps[0], one3()) !== 0) throw new Error("not a natural number");
    return ps.length;
  }
  function iterate(fn, initial) {
    return (index) => {
      const i_nat = to_nat6(index);
      let current = initial;
      for (let i = 0; i < i_nat; i++) current = fn(current);
      return current;
    };
  }
  function iterate_plus_one(fn, base) {
    return (index) => {
      const i_nat = to_nat6(index);
      let current = base;
      if (i_nat !== 0) current = add3(current, one3());
      for (let i = 1; i < i_nat; i++) current = fn(current);
      return current;
    };
  }
  function cofinality5(e) {
    switch (e[0]) {
      case "zero": {
        return zero3();
      }
      case "sum": {
        return cofinality5(e[1][e[1].length - 1]);
      }
      case "omega_pow": {
        let cf_e1 = cofinality5(e[1]);
        if (is_zero6(cf_e1)) return one3();
        if (is_one3(cf_e1)) return omega3();
        return cf_e1;
      }
      case "M": {
        return e;
      }
      case "psi": {
        const d = m_deg(e);
        if (d > 0) return e;
        let [, v, a] = e;
        if (is_zero6(a)) {
          return compute_data(v).psi0_cf;
        }
        let cf_a = cofinality5(a);
        if (is_zero6(cf_a) || is_one3(cf_a)) return omega3();
        if (compare7(cf_a, v) < 0) return cf_a;
        return omega3();
      }
    }
  }
  function infinity_FS6(index) {
    let result;
    if (index === 0) result = zero3();
    else result = M_index(index);
    return ["psi", Omega2(), result];
  }
  function FS6(e, index) {
    if (is_infinity7(e)) return infinity_FS6(to_nat6(index));
    switch (e[0]) {
      case "zero": {
        return zero3();
      }
      case "sum": {
        let tail_FS = FS6(e[1][e[1].length - 1], index);
        return from_prim_list5([...e[1].slice(0, -1), ...prim_list5(tail_FS)]);
      }
      case "omega_pow": {
        if (is_zero6(e[1])) return zero3();
        let cf_e1 = cofinality5(e[1]);
        if (is_one3(cf_e1)) {
          let wp_prev = omega_pow3(FS6(e[1], zero3()));
          return mul_nat3(wp_prev, to_nat6(index));
        } else {
          return omega_pow3(FS6(e[1], index));
        }
      }
      case "M": {
        return index;
      }
      case "psi": {
        const d = m_deg(e);
        if (d > 0) return index;
        let [, v, a] = e;
        let cf_a = cofinality5(a);
        if (is_zero6(cf_a)) {
          return compute_data(v).psi0_FS(index);
        }
        if (is_one3(cf_a)) {
          let a_prev = FS6(a, zero3());
          const base = ["psi", v, a_prev];
          return iterate_plus_one(compute_data(v).fn_def, base)(index);
        }
        if (compare7(cf_a, v) < 0) {
          return ["psi", v, FS6(a, index)];
        } else {
          return ["psi", v, iterate((x) => FS6(a, ["psi", cf_a, x]), zero3())(index)];
        }
      }
    }
  }
  function compute_data(e) {
    function cache(data20) {
      e.data = data20;
      return data20;
    }
    if (e.data !== void 0) return e.data;
    switch (e[0]) {
      case "zero":
      case "sum":
      case "omega_pow": {
        throw new Error("Illegal state");
      }
      case "M": {
        return {
          fn_def: omega_pow3,
          psi0_cf: omega3(),
          psi0_FS: e[1] === 1 ? iterate(omega_pow3, zero3()) : iterate_plus_one(omega_pow3, ["M", e[1] - 1])
        };
      }
      case "psi": {
        const d = m_deg(e);
        if (d === 0) throw new Error("Illegal state");
        const [, v, a] = e;
        const cf_a = cofinality5(a);
        const cmp = compare7(cf_a, v);
        if (is_zero6(cf_a)) {
          return cache(compute_data(v));
        } else if (is_one3(cf_a)) {
          const v_data = compute_data(v);
          const a_prev = FS6(a, zero3());
          const e_prev = ["psi", v, a_prev];
          return cache({
            fn_def: v_data.fn_def,
            psi0_cf: omega3(),
            psi0_FS: iterate_plus_one(v_data.fn_def, e_prev)
          });
        } else if (cmp < 0) {
          const v_data = compute_data(v);
          return cache({
            fn_def: v_data.fn_def,
            psi0_cf: cf_a,
            psi0_FS: (x) => ["psi", v, FS6(a, x)]
          });
        } else if (cmp === 0) {
          const fn_def = (x) => ["psi", v, FS6(a, x)];
          return cache({
            fn_def,
            psi0_cf: omega3(),
            psi0_FS: iterate(fn_def, zero3())
          });
        } else {
          const v_data = compute_data(v);
          return cache({
            fn_def: v_data.fn_def,
            psi0_cf: omega3(),
            psi0_FS: (i) => ["psi", v, iterate((x) => FS6(a, ["psi", cf_a, x]), zero3())(i)]
          });
        }
      }
    }
  }
  function is_limit3(e) {
    if (is_infinity7(e)) return true;
    let cf_e = cofinality5(e);
    return !is_zero6(cf_e) && !is_one3(cf_e);
  }
  var finite_Mahlo_OCF = {
    id: "finite-mahlo-ocf",
    name: "Finite Mahlo ordinal OCF",
    simple_name: "OCF (n-Mahlo)",
    category_id: "category-ocf",
    is_limit: is_limit3,
    compare: compare7,
    FS: (e, index) => FS6(e, from_nat6(index)),
    display: make_OCN_display(to_OCN_IR5),
    credit_text_id: "credit.bocf",
    init: () => [INFINITY6(), zero3()],
    debug: { cofinality: cofinality5 }
  };

  // src/notations/draw_mountain_util.ts
  function draw_mountain_diagram(data20, opts) {
    const {
      W = 30,
      WV = 50,
      H_off = 10,
      padding = 10,
      text_size = 14,
      invert_vertical = false,
      display_html_vertical = false
    } = opts ?? {};
    const { sorted_verticals, heights, line_heights, entries, left_legs } = data20;
    const cols = entries.length;
    if (cols === 0) return void 0;
    const height_last = heights[heights.length - 1] + padding;
    const total_height = height_last + padding;
    const width = WV + cols * W;
    const calc_cy = (vj) => invert_vertical ? padding + heights[vj] : height_last - heights[vj];
    const h_off_vec = invert_vertical ? -H_off : H_off;
    const elements = [];
    const lines = [];
    const extra_text = [];
    const black = { r: 0, g: 0, b: 0 };
    const gray = { r: 200, g: 200, b: 200 };
    for (const h of line_heights) {
      const y = invert_vertical ? h + padding : height_last - h;
      lines.push({
        type: "line",
        x1: 0,
        y1: y,
        x2: width,
        y2: y,
        stroke: true,
        stroke_color: gray,
        width: 1
      });
    }
    for (let vj = 0; vj < sorted_verticals.length; vj++) {
      const label = sorted_verticals[vj];
      if (label === void 0) continue;
      extra_text.push({
        text: label,
        x: WV / 2,
        y: calc_cy(vj),
        size: text_size,
        color: black,
        align: "center",
        ...display_html_vertical ? { display_html: true } : {}
      });
    }
    for (let i = 0; i < cols; i++) {
      for (let vj = 0; vj < sorted_verticals.length; vj++) {
        const text = entries[i][vj];
        if (text === void 0) continue;
        const cx = WV + W * i + W / 2;
        const cy = calc_cy(vj);
        if (vj > 0) {
          let kv = vj - 1;
          while (kv > 0 && entries[i][kv] === void 0) kv--;
          if (entries[i][kv] !== void 0) {
            const cy_below = calc_cy(kv);
            lines.push({
              type: "line",
              x1: cx,
              y1: cy + h_off_vec,
              x2: cx,
              y2: cy_below - h_off_vec,
              stroke: true,
              stroke_color: black,
              width: 1
            });
          }
        }
        const leg = left_legs[i][vj];
        if (leg !== void 0 && vj > 0) {
          const [pi, pvj] = leg;
          const p_cx = WV + W * pi + W / 2;
          const cy_mid = calc_cy(vj - 1);
          const cy_target = calc_cy(pvj);
          lines.push({
            type: "line",
            x1: cx,
            y1: cy + h_off_vec,
            x2: p_cx,
            y2: cy_mid - h_off_vec,
            stroke: true,
            stroke_color: black,
            width: 1
          });
          lines.push({
            type: "line",
            x1: p_cx,
            y1: cy_mid - h_off_vec,
            x2: p_cx,
            y2: cy_target - h_off_vec,
            stroke: true,
            stroke_color: black,
            width: 1
          });
        }
        extra_text.push({
          text,
          x: cx,
          y: cy,
          size: text_size,
          color: black,
          align: "center"
        });
      }
    }
    elements.unshift(...lines);
    return { width, height: total_height, elements, extra_text };
  }

  // src/notations/Y/Omega_Y.ts
  function INFINITY7() {
    return [Infinity];
  }
  function is_infinity8(expr) {
    return "" + expr === "Infinity";
  }
  function sequence_display(expr) {
    return is_infinity8(expr) ? "Limit" : "" + expr;
  }
  function is_limit4(seq) {
    return seq[seq.length - 1] > 1;
  }
  var sequence_from_display = (str) => {
    if (str === "Limit") return INFINITY7();
    const result = str.split(",").map((s) => parseInt(s.trim(), 10));
    if (result.find(Number.isNaN) !== void 0) throw new Error("Illegal omega-Y sequence");
    return result;
  };
  function seq_compare(a, b) {
    return lex_compare(a, b, number_compare);
  }
  var from_sequence = (seq) => {
    const mountain = [];
    for (let i = 0; i < seq.length; i++) {
      const bottom = { value: seq[i], x: i, y: [1], left_up: [] };
      const phantom = { x: i, y: [], left_up: [], value: void 0 };
      bottom.right_down = phantom;
      phantom.right_up = bottom;
      if (i > 0) {
        bottom.left_down = mountain[i - 1][1];
        mountain[i - 1][1].left_up.push(bottom);
      }
      mountain[i] = [bottom, phantom];
    }
    return mountain;
  };
  function to_sequence(mountain) {
    return mountain.map((col) => col[col.length - 2].value);
  }
  function vertical_compare(a, b) {
    if (a.length > b.length) return 1;
    if (a.length < b.length) return -1;
    for (let i = a.length; i >= 0; i--) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
  }
  function same_row(entry1, entry2) {
    return !vertical_compare(entry1.y, entry2.y);
  }
  function vertical_increase(y, d) {
    const c = y.slice();
    c[d] = (c[d] ?? 0) + 1;
    c.fill(0, 0, d);
    return c;
  }
  function dimension_difference(c1, c2) {
    let d = Math.max(c1.length, c2.length);
    while (d--) {
      if (c1[d] !== c2[d]) return d;
    }
    return d;
  }
  function create_entry(parent8, entry) {
    const new_entry = {
      value: entry.value - parent8.value,
      x: entry.x,
      y: vertical_increase(entry.y, dimension_difference(parent8.y, entry.y) + 1),
      left_up: []
    };
    new_entry.right_down = entry;
    entry.right_up = new_entry;
    new_entry.left_down = parent8;
    parent8.left_up.push(new_entry);
    return new_entry;
  }
  function draw_mountain(mountain) {
    for (const column of mountain) {
      while (true) {
        const entry = column[0];
        if (entry.value === 1) break;
        let parent8 = entry;
        while (true) {
          let up = parent8.left_down;
          while (up.right_up && vertical_compare(up.right_up.y, parent8.y) <= 0) up = up.right_up;
          parent8 = up;
          if (parent8.value < entry.value) break;
        }
        column.unshift(create_entry(parent8, entry));
      }
    }
    return mountain;
  }
  function find_lower(column, y) {
    let i1 = 0, i2 = column.length - 1;
    while (i1 < i2) {
      const i = Math.floor((i1 + i2) / 2);
      if (vertical_compare(column[i].y, y) < 0) i2 = i;
      else i1 = i + 1;
    }
    return column[i2];
  }
  function find_higher_equal(column, y) {
    let i1 = 0, i2 = column.length - 1;
    while (i1 < i2) {
      const i = Math.ceil((i1 + i2) / 2);
      if (vertical_compare(column[i].y, y) >= 0) i1 = i;
      else i2 = i - 1;
    }
    return column[i1];
  }
  function y_slice(column, low_equal, high) {
    let i1 = 0, i2 = column.length - 1;
    while (i1 < i2) {
      const i = Math.floor((i1 + i2) / 2);
      if (vertical_compare(column[i].y, high) < 0) i2 = i;
      else i1 = i + 1;
    }
    const start = i2;
    i1 = start;
    i2 = column.length - 1;
    while (i1 < i2) {
      const i = Math.floor((i1 + i2) / 2);
      if (vertical_compare(column[i].y, low_equal) < 0) i2 = i;
      else i1 = i + 1;
    }
    return column.slice(start, i2);
  }
  function collect_usual(working_entry, collection = []) {
    for (const e of working_entry.left_up) {
      const child = e.right_down;
      if (collection.includes(child)) continue;
      if (same_row(working_entry, child)) {
        collection.push(child);
        collect_usual(child, collection);
      }
    }
    return collection;
  }
  function collect1D(working_entry, collection = []) {
    for (const child of working_entry.right_down.left_up) {
      if (collection.includes(child)) continue;
      if (same_row(working_entry, child)) {
        collection.push(child);
        collect1D(child, collection);
      }
    }
    return collection;
  }
  function collect(working_entry) {
    if (vertical_compare(working_entry.y, [1]) > 0 && dimension_difference(working_entry.y, working_entry.right_down.y) === 0) {
      return collect1D(working_entry);
    } else {
      return collect_usual(working_entry);
    }
  }
  function fill_magma_edge(mountain, source_entry, left_leg_entry) {
    const target_x = source_entry.x - source_entry.left_down.x + left_leg_entry.x;
    for (let d = dimension_difference(left_leg_entry.y, left_leg_entry.right_up.y); d >= 0; --d) {
      const new_entry = {
        x: target_x,
        y: vertical_increase(left_leg_entry.y, d),
        left_up: [],
        value: void 0
      };
      new_entry.left_down = left_leg_entry;
      left_leg_entry.left_up.push(new_entry);
      mountain[target_x].push(new_entry);
    }
  }
  function copy_single_edge(mountain, source_entry, x_offset, BR_x, target_y) {
    if (target_y === void 0) target_y = source_entry.y;
    const new_entry = {
      x: source_entry.x + x_offset,
      y: target_y.slice(),
      left_up: [],
      value: void 0
    };
    if (source_entry.y.length > 0) {
      let left_leg_entry;
      if (source_entry.left_down.x >= BR_x) {
        left_leg_entry = find_lower(mountain[source_entry.left_down.x + x_offset], new_entry.y);
      } else {
        left_leg_entry = source_entry.left_down;
      }
      new_entry.left_down = left_leg_entry;
      left_leg_entry.left_up.push(new_entry);
    }
    mountain[source_entry.x + x_offset].push(new_entry);
  }
  function expand_weak_magma(seq, index) {
    const mountain = draw_mountain(from_sequence(seq));
    const child = mountain[mountain.length - 1];
    let BR = child[0].left_down;
    const width = mountain.length - 1 - BR.x;
    let top = mountain[BR.x];
    top = top.slice(
      top.findIndex((entry) => entry === BR),
      top.length - 1
    );
    top.unshift(child[0]);
    const s = seq.slice();
    s[s.length - 1]--;
    const newMountain = draw_mountain(from_sequence(s));
    BR = newMountain[BR.x].find((entry) => same_row(entry, BR));
    const magma_entries = [];
    for (let BR1 = BR; true; BR1 = BR1.right_down) {
      collect_usual(BR1).forEach((entry) => {
        const dx = entry.x - BR.x;
        if (magma_entries[dx] === void 0) magma_entries[dx] = [];
        magma_entries[dx].push(entry);
      });
      if (!BR1.y.length) break;
    }
    for (let n = 1; n <= index; n++) {
      const ref = top.map((top_entry) => find_lower(newMountain[newMountain.length - 1], top_entry.y));
      for (let dx = 1; dx <= width; dx++) {
        const column = [];
        newMountain[BR.x + n * width + dx] = column;
        for (const magma_entry of magma_entries[dx]) {
          copy_single_edge(newMountain, magma_entry, n * width, BR.x);
          let source_entry = magma_entry;
          let target_y = find_higher_equal(ref, magma_entry.y).y;
          const target_y0 = target_y;
          while (!(source_entry.value <= 1 || magma_entries[dx].includes(source_entry.right_up))) {
            target_y = vertical_increase(
              target_y,
              dimension_difference(source_entry.y, source_entry.right_up.y)
            );
            source_entry = source_entry.right_up;
            copy_single_edge(newMountain, source_entry, n * width, BR.x, target_y);
          }
          const left_leg_x = magma_entry.right_up.left_down.x + n * width;
          y_slice(newMountain[left_leg_x], magma_entry.y, target_y0).forEach(
            (left_leg_entry) => fill_magma_edge(newMountain, magma_entry.right_up, left_leg_entry)
          );
        }
        column.sort((entry1, entry2) => -vertical_compare(entry1.y, entry2.y));
        for (let i = 0; i < column.length - 1; i++) {
          column[i].right_down = column[i + 1];
          column[i + 1].right_up = column[i];
        }
        column[0].value = 1;
        column.slice(1, column.length - 1).forEach((entry) => {
          entry.value = entry.right_up.value + entry.right_up.left_down.value;
        });
      }
    }
    return to_sequence(newMountain);
  }
  function expand_actual_magma(seq, index) {
    const mountain = draw_mountain(from_sequence(seq));
    const child = mountain[mountain.length - 1];
    const BR = child[0].left_down;
    const width = mountain.length - 1 - BR.x;
    let top = mountain[BR.x];
    top = top.slice(
      top.findIndex((entry) => entry === BR),
      top.length - 1
    );
    top.unshift(child[0]);
    const s = seq.slice();
    s[s.length - 1]--;
    const sMountain = draw_mountain(from_sequence(s));
    const newBR = sMountain[BR.x].find((entry) => same_row(entry, BR));
    const magma_entries = [];
    for (let BR1 = newBR; true; BR1 = BR1.right_down) {
      collect(BR1).forEach((entry) => {
        const dx = entry.x - BR1.x;
        if (magma_entries[dx] === void 0) magma_entries[dx] = [];
        magma_entries[dx].push(entry);
      });
      if (!BR1.y.length) break;
    }
    for (let n = 1; n <= index; n++) {
      const ref = top.map((top_entry) => find_lower(sMountain[sMountain.length - 1], top_entry.y));
      for (let dx = 1; dx <= width; dx++) {
        const column = [];
        sMountain[BR.x + n * width + dx] = column;
        for (const magma_entry of magma_entries[dx]) {
          copy_single_edge(sMountain, magma_entry, n * width, BR.x);
          let source_entry = magma_entry;
          let target_y = find_higher_equal(ref, magma_entry.y).y;
          const target_y0 = target_y;
          while (!(source_entry.value <= 1 || magma_entries[dx].includes(source_entry.right_up))) {
            target_y = vertical_increase(
              target_y,
              dimension_difference(source_entry.y, source_entry.right_up.y)
            );
            source_entry = source_entry.right_up;
            copy_single_edge(sMountain, source_entry, n * width, BR.x, target_y);
          }
          if (!magma_entry.y.length) continue;
          const left_leg_x = magma_entry.left_down.x + n * width;
          y_slice(sMountain[left_leg_x], magma_entry.y, target_y0).forEach(
            (left_leg_entry) => fill_magma_edge(sMountain, magma_entry, left_leg_entry)
          );
        }
        column.sort((entry1, entry2) => -vertical_compare(entry1.y, entry2.y));
        for (let i = 0; i < column.length - 1; i++) {
          column[i].right_down = column[i + 1];
          column[i + 1].right_up = column[i];
        }
        column[0].value = 1;
        column.slice(1, column.length - 1).forEach((entry) => {
          entry.value = entry.right_up.value + entry.right_up.left_down.value;
        });
      }
    }
    return to_sequence(sMountain);
  }
  function expand_medium_magma(seq, index) {
    const mountain = draw_mountain(from_sequence(seq));
    const child = mountain[mountain.length - 1];
    let BR = child[0].left_down;
    const width = mountain.length - 1 - BR.x;
    let top = mountain[BR.x];
    top = top.slice(
      top.findIndex((entry) => entry === BR),
      top.length - 1
    );
    top.unshift(child[0]);
    const s = seq.slice();
    s[s.length - 1]--;
    const newMountain = draw_mountain(from_sequence(s));
    BR = newMountain[BR.x].find((entry) => same_row(entry, BR));
    const magma_entries = [];
    for (let BR1 = BR; true; BR1 = BR1.right_down) {
      collect_usual(BR1).forEach((entry) => {
        const dx = entry.x - BR.x;
        if (magma_entries[dx] === void 0) magma_entries[dx] = [];
        magma_entries[dx].push(entry);
      });
      if (!BR1.y.length) break;
    }
    for (let n = 1; n <= index; n++) {
      const ref = top.map((top_entry) => find_lower(newMountain[newMountain.length - 1], top_entry.y));
      for (let dx = 1; dx <= width; dx++) {
        const column = [];
        newMountain[BR.x + n * width + dx] = column;
        for (const magma_entry of magma_entries[dx]) {
          copy_single_edge(newMountain, magma_entry, n * width, BR.x);
          let source_entry = magma_entry;
          let target_y = find_higher_equal(ref, magma_entry.y).y;
          const target_y0 = target_y;
          while (!(source_entry.value <= 1 || magma_entries[dx].includes(source_entry.right_up))) {
            target_y = vertical_increase(
              target_y,
              dimension_difference(source_entry.y, source_entry.right_up.y)
            );
            source_entry = source_entry.right_up;
            copy_single_edge(newMountain, source_entry, n * width, BR.x, target_y);
          }
          if (!magma_entry.y.length) continue;
          const left_leg_x = magma_entry.left_down.x + n * width;
          y_slice(newMountain[left_leg_x], magma_entry.y, target_y0).forEach(
            (left_leg_entry) => fill_magma_edge(newMountain, magma_entry, left_leg_entry)
          );
        }
        column.sort((entry1, entry2) => -vertical_compare(entry1.y, entry2.y));
        for (let i = 0; i < column.length - 1; i++) {
          column[i].right_down = column[i + 1];
          column[i + 1].right_up = column[i];
        }
        column[0].value = 1;
        column.slice(1, column.length - 1).forEach((entry) => {
          entry.value = entry.right_up.value + entry.right_up.left_down.value;
        });
      }
    }
    return to_sequence(newMountain);
  }
  function expand_strong_magma(seq, index) {
    const mountain = draw_mountain(from_sequence(seq));
    const child = mountain[mountain.length - 1];
    let BR = child[0].left_down;
    const width = mountain.length - 1 - BR.x;
    let top = mountain[BR.x];
    top = top.slice(
      top.findIndex((entry) => entry === BR),
      top.length - 1
    );
    top.unshift(child[0]);
    const s = seq.slice();
    s[s.length - 1]--;
    const newMountain = draw_mountain(from_sequence(s));
    BR = newMountain[BR.x].find((entry) => same_row(entry, BR));
    const magma_entries = [];
    for (let BR1 = BR; true; BR1 = BR1.right_down) {
      if (BR1.y.length) {
        collect1D(BR1).forEach((entry) => {
          const dx = entry.x - BR.x;
          if (magma_entries[dx] === void 0) magma_entries[dx] = [];
          magma_entries[dx].push(entry);
        });
      } else {
        newMountain.slice(BR.x + 1).forEach((column, dx1) => magma_entries[dx1 + 1].push(column[column.length - 1]));
        break;
      }
    }
    for (let n = 1; n <= index; n++) {
      const ref = top.map((top_entry) => find_lower(newMountain[newMountain.length - 1], top_entry.y));
      for (let dx = 1; dx <= width; dx++) {
        const column = [];
        newMountain[BR.x + n * width + dx] = column;
        for (const magma_entry of magma_entries[dx]) {
          copy_single_edge(newMountain, magma_entry, n * width, BR.x);
          let source_entry = magma_entry;
          let target_y = find_higher_equal(ref, magma_entry.y).y;
          const target_y0 = target_y;
          while (!(source_entry.value <= 1 || magma_entries[dx].includes(source_entry.right_up))) {
            target_y = vertical_increase(
              target_y,
              dimension_difference(source_entry.y, source_entry.right_up.y)
            );
            source_entry = source_entry.right_up;
            copy_single_edge(newMountain, source_entry, n * width, BR.x, target_y);
          }
          if (!magma_entry.y.length) continue;
          const left_leg_x = magma_entry.left_down.x + n * width;
          y_slice(newMountain[left_leg_x], magma_entry.y, target_y0).forEach(
            (left_leg_entry) => fill_magma_edge(newMountain, magma_entry, left_leg_entry)
          );
        }
        column.sort((entry1, entry2) => -vertical_compare(entry1.y, entry2.y));
        for (let i = 0; i < column.length - 1; i++) {
          column[i].right_down = column[i + 1];
          column[i + 1].right_up = column[i];
        }
        column[0].value = 1;
        column.slice(1, column.length - 1).forEach((entry) => {
          entry.value = entry.right_up.value + entry.right_up.left_down.value;
        });
      }
    }
    return to_sequence(newMountain);
  }
  function draw_dbms_mountain(m, Asheep) {
    let mountain = m;
    for (let col of mountain) {
      for (let j = col.length - 3; j >= 0; j--) {
        let entry = col[j];
        if (entry.y.length === 0) continue;
        entry.sep = dimension_difference(entry.y, entry.left_down.y);
        let left_entry = entry.left_down.right_up;
        if (Asheep && left_entry !== void 0 && vertical_compare(left_entry.y, entry.y) !== 0)
          left_entry = void 0;
        entry.depth = 1 + (left_entry?.depth ?? 0);
      }
    }
    return mountain;
  }
  function to_dbms_display(seq, type) {
    if ("" + seq === "Infinity") return "Limit";
    let mountain = draw_dbms_mountain(draw_mountain(from_sequence(seq)), type === "ADBMS");
    let result = "";
    for (let col of mountain) {
      result += "(";
      for (let j = col.length - 3; j >= 0; j--) {
        let entry = col[j];
        switch (type) {
          case "DBMS":
            result += entry.depth + ",".repeat(entry.sep + 1);
            break;
          case "DBMS'":
          case "ADBMS":
            result += ",".repeat(entry.sep + 1) + entry.depth;
            break;
        }
      }
      if (type === "DBMS") result += "0";
      result += ")";
    }
    return result;
  }
  function vertical_display(v) {
    return v.toReversed().join(",");
  }
  function vertical_display_html(v) {
    if (v.length === 0) return "0";
    const parts = [];
    for (let i = v.length - 1; i >= 0; i--) {
      const c = v[i];
      if (c === 0) continue;
      if (i === 0) {
        parts.push("" + c);
      } else if (i === 1) {
        parts.push(c === 1 ? "\u03C9" : "\u03C9" + c);
      } else {
        parts.push(c === 1 ? `\u03C9<sup>${i}</sup>` : `\u03C9<sup>${i}</sup>${c}`);
      }
    }
    return parts.join("+");
  }
  function compute_y_mountain_diagram(seq, current_equiv) {
    if (is_infinity8(seq) || seq.length === 0) return void 0;
    const mountain = draw_dbms_mountain(draw_mountain(from_sequence(seq)), current_equiv === "ADBMS");
    const vertical_set = new DisplaySet(vertical_display);
    for (const col of mountain) for (const entry of col) vertical_set.add(entry.y);
    const sorted = vertical_set.values().sort(vertical_compare);
    const vertical_index = new DisplayMap(vertical_display);
    for (let i = 0; i < sorted.length; i++) vertical_index.set(sorted[i], i);
    const entries = Array.from(
      { length: mountain.length },
      () => Array.from({ length: sorted.length }, () => void 0)
    );
    const left_legs = Array.from(
      { length: mountain.length },
      () => Array.from({ length: sorted.length }, () => void 0)
    );
    for (let i = 0; i < mountain.length; i++) {
      for (let j = 0; j < mountain[i].length - 1; j++) {
        const entry = mountain[i][j];
        const vj = vertical_index.get(entry.y);
        if (current_equiv === "DBMS") {
          entries[i][vj - 1] = entry.right_up !== void 0 ? "" + entry.right_up.depth + ",".repeat(entry.right_up.sep + 1) : "0";
        } else if (current_equiv === "ADBMS" || current_equiv === "DBMS'") {
          entries[i][vj - 1] = entry.sep !== void 0 ? ",".repeat(entry.sep + 1) + entry.depth : "*";
        } else {
          entries[i][vj - 1] = "" + entry.value;
        }
        if (entry.left_down) {
          const pvj = vertical_index.get(entry.left_down.y);
          if (pvj !== 0) left_legs[i][vj - 1] = [entry.left_down.x, pvj - 1];
        }
      }
    }
    const H = 40, HS = 5;
    const heights = [0];
    const line_heights = [];
    for (let i = 2; i < sorted.length; i++) {
      const sep = dimension_difference(sorted[i], sorted[i - 1]);
      const d_height = H + HS * sep;
      heights.push(heights[i - 2] + d_height);
      for (let k = 0; k <= sep; k++) line_heights.push(heights[i - 2] + H / 2 + HS * k);
    }
    let vertical_names = sorted.slice(1).map((v) => vertical_display_html(v.length === 1 ? v[0] === 1 ? [] : [v[0] - 1] : v));
    return { sorted_verticals: vertical_names, heights, line_heights, entries, left_legs };
  }
  var y_diagram_control = {
    default_data: { current_equiv: void 0, invert_vertical: void 0 },
    draw_diagram: (seq, data20) => {
      const mountain = compute_y_mountain_diagram(seq, data20.current_equiv);
      if (!mountain) return void 0;
      return draw_mountain_diagram(mountain, {
        invert_vertical: data20.invert_vertical ?? false,
        display_html_vertical: true
      });
    },
    handle_action: (data20, action) => {
      if (action.type === "scroll") {
        if (action.direction === "down") return { ...data20, invert_vertical: true };
        if (action.direction === "up") return { ...data20, invert_vertical: false };
      }
      return null;
    }
  };
  var category_y_omega = {
    id: "category-y-omega",
    name: "\u03C9Y",
    parent_id: "category-y"
  };
  function create_magma_notation(type, magma) {
    return {
      id: "omega-y-" + type,
      name: "\u03C9-Y (" + type + " magma)",
      simple_name: "\u03C9Y " + type,
      category_id: "category-y-omega",
      display: {
        plain: sequence_display,
        from_display: sequence_from_display
      },
      display_equiv: {
        DBMS: (s) => to_dbms_display(s, "DBMS"),
        DBMS_MN: (s) => to_dbms_display(s, "DBMS'"),
        ADBMS: (s) => to_dbms_display(s, "ADBMS")
      },
      is_limit: is_limit4,
      compare: seq_compare,
      draw_diagram: y_diagram_control,
      ...Y_FS_variants(magma, is_infinity8, (index) => [1, index + 1], is_limit4, sequence_display),
      credit_text_id: "credit.yukito",
      init: () => [[Infinity], [1], []]
    };
  }
  var omega_Y_weak = create_magma_notation("weak", expand_weak_magma);
  var omega_Y_actual = create_magma_notation("actual", expand_actual_magma);
  var omega_Y_medium = create_magma_notation("medium", expand_medium_magma);
  var omega_Y_strong = create_magma_notation("strong", expand_strong_magma);

  // src/notations/Y/minus1_Y.ts
  function INFINITY8() {
    return [Infinity];
  }
  function is_infinity9(e) {
    return "" + e === "Infinity";
  }
  function is_limit5(e) {
    return is_infinity9(e) || e.length > 0 && e[e.length - 1] > 1;
  }
  function compare8(a, b) {
    return lex_compare(a, b, number_compare);
  }
  function root(a) {
    if (is_infinity9(a)) return -1;
    if (a.length === 0) return -1;
    let result = a.length - 2;
    while (result >= 0 && a[result] >= a[a.length - 1]) result--;
    return result;
  }
  function infinity_FS7(index) {
    return [1, index + 1];
  }
  function FS7(a, index) {
    if (is_infinity9(a)) return infinity_FS7(index);
    if (a.length === 0) return a;
    if (a[a.length - 1] === 1) return a.slice(0, a.length - 1);
    let r2 = root(a);
    let result = a.slice(0, a.length - 1);
    let dup = a.slice(r2, a.length - 1);
    dup[0] = a[a.length - 1] - 1;
    for (let i = 0; i < index; i++) result.push(...dup);
    return result;
  }
  var Minus1_Y = {
    id: "-1y",
    name: "-1Y sequence",
    simple_name: "-1Y",
    category_id: "category-y",
    display: { plain: sequence_display, from_display: sequence_from_display },
    compare: compare8,
    is_limit: is_limit5,
    FS: FS7,
    credit_text_id: "credit.community_y",
    init: () => [INFINITY8(), [1], []]
  };

  // src/notations/Y/T_minus1_Y.ts
  function INFINITY9() {
    return [Infinity];
  }
  function is_infinity10(e) {
    return "" + e === "Infinity";
  }
  function is_limit6(e) {
    return is_infinity10(e) || e.length > 0 && e[e.length - 1].length > 0;
  }
  function compare9(a, b) {
    return lex_compare(a, b, compare9);
  }
  function root2(a) {
    if (is_infinity10(a)) return -1;
    if (a.length === 0) return -1;
    let result = a.length - 2;
    while (result >= 0 && compare9(a[result], a[a.length - 1]) >= 0) result--;
    return result;
  }
  function infinity_FS8(index) {
    if (index === 0) return [[]];
    return [[], infinity_FS8(index - 1)];
  }
  function FS8(a, index) {
    if (is_infinity10(a)) return infinity_FS8(index);
    if (a.length === 0) return a;
    if (a[a.length - 1].length === 0) return a.slice(0, -1);
    if (is_limit6(a[a.length - 1])) {
      return [...a.slice(0, -1), FS8(a[a.length - 1], index)];
    }
    let r2 = root2(a);
    let result = a.slice(0, -1);
    let dup = a.slice(r2, -1);
    dup[0] = a[a.length - 1].slice(0, -1);
    for (let i = 0; i < index; i++) result.push(...dup);
    return result;
  }
  function display3(a, top_level = true) {
    if (is_infinity10(a)) return "Limit";
    if (top_level) return a.map((t) => display3(t, false)).join(",");
    if (a.every((t) => t.length === 0)) return "" + a.length;
    return "(" + display3(a, true) + ")";
  }
  var T_Minus1_Y = {
    id: "t--1y",
    name: "Transfinite -1Y",
    simple_name: "T(-1)Y",
    category_id: "category-y",
    display: { plain: display3 },
    compare: compare9,
    is_limit: is_limit6,
    FS: FS8,
    credit_text_id: "credit.community_y",
    init: () => [INFINITY9(), []]
  };

  // src/notations/Y/Y.ts
  function parseSequenceElement(s, i) {
    if (s.indexOf("v") == -1 || !isFinite(Number(s.substring(s.indexOf("v") + 1)))) {
      return {
        value: Number(s),
        position: i,
        parentIndex: -1
      };
    } else {
      return {
        value: Number(s.substring(0, s.indexOf("v"))),
        position: i,
        parentIndex: Math.max(Math.min(i - 1, Number(s.substring(s.indexOf("v") + 1))), -1),
        forcedParent: true
      };
    }
  }
  var FS_Y = /* @__PURE__ */ (() => {
    const itemSeparatorRegex = /[\t ,]/g;
    function calcMountain(s) {
      let lastLayer;
      if (typeof s == "string") {
        lastLayer = s.split(itemSeparatorRegex).map(parseSequenceElement);
      } else lastLayer = s;
      const calculatedMountain = [lastLayer];
      while (true) {
        let hasNextLayer = false;
        for (let i = 0; i < lastLayer.length; i++) {
          if (lastLayer[i].forcedParent) {
            if (lastLayer[i].parentIndex != -1) hasNextLayer = true;
            continue;
          }
          let p;
          if (calculatedMountain.length == 1) {
            p = lastLayer[i].position + 1;
          } else {
            p = 0;
            while (calculatedMountain[calculatedMountain.length - 2][p].position < lastLayer[i].position + 1)
              p++;
          }
          while (true) {
            if (p < 0) break;
            let j;
            if (calculatedMountain.length == 1) {
              p--;
              j = p - 1;
            } else {
              p = calculatedMountain[calculatedMountain.length - 2][p].parentIndex;
              if (p < 0) break;
              j = 0;
              while (lastLayer[j].position < calculatedMountain[calculatedMountain.length - 2][p].position - 1)
                j++;
            }
            if (j < 0 || j < lastLayer.length - 1 && lastLayer[j].position + 1 != lastLayer[j + 1].position)
              break;
            if (lastLayer[j].value < lastLayer[i].value) {
              lastLayer[i].parentIndex = j;
              hasNextLayer = true;
              break;
            }
          }
        }
        if (!hasNextLayer) break;
        const currentLayer = [];
        calculatedMountain.push(currentLayer);
        for (let i = 0; i < lastLayer.length; i++) {
          if (lastLayer[i].parentIndex != -1) {
            currentLayer.push({
              value: lastLayer[i].value - lastLayer[lastLayer[i].parentIndex].value,
              position: lastLayer[i].position - 1,
              parentIndex: -1
            });
          }
        }
        lastLayer = currentLayer;
      }
      return calculatedMountain;
    }
    function calcDiagonal(mountain) {
      const diagonal = [];
      const diagonalTree = [];
      for (let i = 0; i < mountain[0].length; i++) {
        for (let j = mountain.length - 1; j >= 0; j--) {
          let k = 0;
          while (mountain[j][k] && mountain[j][k].position + j < i) k++;
          if (!mountain[j][k] || mountain[j][k].position + j != i) continue;
          let height = j;
          let lastIndex = k;
          while (true) {
            if (height == 0) {
              lastIndex = mountain[height][lastIndex].parentIndex;
            } else {
              let l = 0;
              while (mountain[height - 1][l].position != mountain[height][lastIndex].position + 1) l++;
              l = mountain[height - 1][l].parentIndex;
              let m = 0;
              while (mountain[height][m].position < mountain[height - 1][l].position - 1) m++;
              if (mountain[height][m].position == mountain[height - 1][l].position - 1) {
                lastIndex = m;
              } else {
                height--;
                lastIndex = l;
              }
            }
            if (!mountain[height][lastIndex] || mountain[height][lastIndex].parentIndex == -1) {
              diagonal.push(mountain[j][k].value);
              diagonalTree.push(
                (mountain[height][lastIndex] ? mountain[height][lastIndex].position : -1) + height
              );
              break;
            }
          }
          break;
        }
      }
      const pw = [];
      for (let i = 0; i < diagonal.length; i++) {
        let p = -1;
        for (let j = i - 1; j >= 0; j--) {
          if (diagonal[j] < diagonal[i]) {
            p = j;
            break;
          }
        }
        pw.push(p);
      }
      const r2 = [];
      for (let i = 0; i < diagonal.length; i++) {
        let p = i;
        while (true) {
          p = diagonalTree[p];
          if (p < 0 || diagonal[p] < diagonal[i]) break;
        }
        if (p == pw[i]) r2.push("" + diagonal[i]);
        else r2.push(diagonal[i] + "v" + p);
      }
      return r2.join(",");
    }
    function getBadRoot(s) {
      let mountain;
      if (typeof s == "string") mountain = calcMountain(s);
      else mountain = deepcopy(s);
      const diagonal = calcMountain(calcDiagonal(mountain));
      if (diagonal[0][diagonal[0].length - 1].value != 1) {
        return getBadRoot(diagonal);
      } else {
        for (let i = mountain.length - 1; i >= 0; i--) {
          if (mountain[i][mountain[i].length - 1].position + i == mountain[0].length - 1)
            return mountain[i - 1][mountain[i - 1][mountain[i - 1].length - 1].parentIndex].position + i - 1;
        }
      }
      return NaN;
    }
    function expand18(s, n, stringify) {
      let mountain;
      if (typeof s == "string") mountain = calcMountain(s);
      else mountain = deepcopy(s);
      let result = deepcopy(mountain);
      if (mountain[0][mountain[0].length - 1].parentIndex == -1) {
        result[0].pop();
      } else {
        let cutHeight = mountain.length - 1;
        while (mountain[cutHeight][mountain[cutHeight].length - 1].position + cutHeight != mountain[0].length - 1)
          cutHeight--;
        const actualCutHeight = cutHeight;
        const badRootSeam = getBadRoot(mountain);
        let badRootHeight;
        const diagonal = calcMountain(calcDiagonal(mountain));
        let newDiagonal;
        const yamakazi = diagonal[0][diagonal[0].length - 1].value == 1;
        if (yamakazi) {
          newDiagonal = deepcopy(diagonal);
          newDiagonal[0].pop();
          for (let i = 0; i < n; i++) {
            for (let j = badRootSeam; j < mountain[0].length - 1; j++) {
              newDiagonal[0].push(newDiagonal[0][j]);
            }
          }
          cutHeight--;
          badRootHeight = cutHeight;
        } else {
          newDiagonal = expand18(diagonal, n, false);
          badRootHeight = mountain.length - 1;
          while (true) {
            let i = 0;
            while (mountain[badRootHeight][i] && mountain[badRootHeight][i].position + badRootHeight < badRootSeam)
              i++;
            if (mountain[badRootHeight][i] && mountain[badRootHeight][i].position + badRootHeight == badRootSeam)
              break;
            badRootHeight--;
          }
        }
        for (let i = 0; i <= actualCutHeight; i++) result[i].pop();
        if (!result[result.length - 1].length) result.pop();
        const afterCutHeight = result.length;
        const afterCutLength = result[0].length;
        let badRootSeamHeight = afterCutHeight - 1;
        while (true) {
          let l = 0;
          while (mountain[badRootSeamHeight][l] && mountain[badRootSeamHeight][l].position + badRootSeamHeight < badRootSeam)
            l++;
          if (mountain[badRootSeamHeight][l] && mountain[badRootSeamHeight][l].position + badRootSeamHeight == badRootSeam)
            break;
          badRootSeamHeight--;
        }
        badRootSeamHeight++;
        for (let i = 1; i <= n; i++) {
          for (let j = badRootSeam; j < afterCutLength; j++) {
            let isAscending;
            let p = 0;
            while (mountain[badRootHeight][p].position + badRootHeight < j) p++;
            if (mountain[badRootHeight][p].position + badRootHeight == j) {
              while (true) {
                if (!mountain[badRootHeight][p] || mountain[badRootHeight][p].position + badRootHeight < badRootSeam) {
                  isAscending = false;
                  break;
                }
                if (mountain[badRootHeight][p].position + badRootHeight == badRootSeam) {
                  isAscending = true;
                  break;
                }
                p = mountain[badRootHeight][p].parentIndex;
              }
            } else {
              isAscending = false;
            }
            let seamHeight = afterCutHeight - 1;
            while (true) {
              let l = 0;
              while (mountain[seamHeight][l] && mountain[seamHeight][l].position + seamHeight < j) l++;
              if (mountain[seamHeight][l] && mountain[seamHeight][l].position + seamHeight == j) break;
              seamHeight--;
            }
            seamHeight++;
            const isReplacingCut = j == badRootSeam;
            if (isAscending) {
              for (let k = 0; k < seamHeight + (cutHeight - badRootHeight) * i; k++) {
                if (!result[k]) result.push([]);
                if (k < badRootHeight) {
                  let sy = k;
                  let sx;
                  if (isReplacingCut) {
                    sx = mountain[sy].length - 1;
                  } else {
                    sx = 0;
                    while (mountain[sy][sx].position + sy < j) sx++;
                  }
                  const sourceParentIndex = mountain[sy][sx].parentIndex;
                  const parentShifts = i - (isReplacingCut ? 1 : 0);
                  const parentPosition = mountain[sy][sourceParentIndex] ? mountain[sy][sourceParentIndex].position + parentShifts * (afterCutLength - badRootSeam) * (mountain[sy][sourceParentIndex].position + sy >= badRootSeam ? 1 : 0) - (k - sy) : -1;
                  let parentIndex = 0;
                  while (result[k][parentIndex] && result[k][parentIndex].position < parentPosition)
                    parentIndex++;
                  if (!result[k][parentIndex] || result[k][parentIndex].position != parentPosition)
                    parentIndex = -1;
                  result[k].push({
                    value: parentIndex == -1 ? newDiagonal[0][j + (afterCutLength - badRootSeam) * i].value : NaN,
                    position: j + (afterCutLength - badRootSeam) * i - k,
                    parentIndex,
                    forcedParent: mountain[sy][sx].forcedParent
                  });
                } else if (k <= badRootHeight + (cutHeight - badRootHeight) * (i - (isReplacingCut ? 1 : 0))) {
                  let sy = badRootHeight;
                  let sx;
                  if (!yamakazi && isReplacingCut) {
                    sx = mountain[sy].length - 1;
                  } else {
                    sx = 0;
                    while (mountain[sy][sx].position + sy < j) sx++;
                  }
                  const sourceParentIndex = mountain[sy][sx].parentIndex;
                  const parentShifts = i - (isReplacingCut ? 1 : 0);
                  const parentPosition = mountain[sy][sourceParentIndex] ? mountain[sy][sourceParentIndex].position + parentShifts * (afterCutLength - badRootSeam) * (mountain[sy][sourceParentIndex].position + sy >= badRootSeam ? 1 : 0) - (k - sy) : -1;
                  let parentIndex = 0;
                  while (result[k][parentIndex] && result[k][parentIndex].position < parentPosition)
                    parentIndex++;
                  if (!result[k][parentIndex] || result[k][parentIndex].position != parentPosition)
                    parentIndex = -1;
                  result[k].push({
                    value: parentIndex == -1 ? newDiagonal[0][j + (afterCutLength - badRootSeam) * i].value : NaN,
                    position: j + (afterCutLength - badRootSeam) * i - k,
                    parentIndex,
                    forcedParent: mountain[sy][sx].forcedParent
                  });
                } else if (isReplacingCut && k <= badRootHeight + (cutHeight - badRootHeight) * i) {
                  let sy = k - (cutHeight - badRootHeight) * (i - 1);
                  let sx;
                  if (!yamakazi && isReplacingCut) {
                    sx = mountain[sy].length - 1;
                  } else {
                    sx = 0;
                    while (mountain[sy][sx].position + sy < j) sx++;
                  }
                  const sourceParentIndex = mountain[sy][sx].parentIndex;
                  const parentShifts = i - (isReplacingCut ? 1 : 0);
                  const parentPosition = mountain[sy][sourceParentIndex] ? mountain[sy][sourceParentIndex].position + parentShifts * (afterCutLength - badRootSeam) * (mountain[sy][sourceParentIndex].position + sy >= badRootSeam ? 1 : 0) - (k - sy) : -1;
                  let parentIndex = 0;
                  while (result[k][parentIndex] && result[k][parentIndex].position < parentPosition)
                    parentIndex++;
                  if (!result[k][parentIndex] || result[k][parentIndex].position != parentPosition)
                    parentIndex = -1;
                  result[k].push({
                    value: parentIndex == -1 ? newDiagonal[0][j + (afterCutLength - badRootSeam) * i].value : NaN,
                    position: j + (afterCutLength - badRootSeam) * i - k,
                    parentIndex,
                    forcedParent: mountain[sy][sx].forcedParent
                  });
                } else {
                  let sy = k - (cutHeight - badRootHeight) * i;
                  let sx;
                  if (!yamakazi && isReplacingCut) {
                    sx = mountain[sy].length - 1;
                  } else {
                    sx = 0;
                    while (mountain[sy][sx].position + sy < j) sx++;
                  }
                  const sourceParentIndex = mountain[sy][sx].parentIndex;
                  const parentShifts = i - (isReplacingCut ? 1 : 0);
                  const parentPosition = mountain[sy][sourceParentIndex] ? mountain[sy][sourceParentIndex].position + parentShifts * (afterCutLength - badRootSeam) * (mountain[sy][sourceParentIndex].position + sy >= badRootSeam ? 1 : 0) - (k - sy) : -1;
                  let parentIndex = 0;
                  while (result[k][parentIndex] && result[k][parentIndex].position < parentPosition)
                    parentIndex++;
                  if (!result[k][parentIndex] || result[k][parentIndex].position != parentPosition)
                    parentIndex = -1;
                  result[k].push({
                    value: parentIndex == -1 ? newDiagonal[0][j + (afterCutLength - badRootSeam) * i].value : NaN,
                    position: j + (afterCutLength - badRootSeam) * i - k,
                    parentIndex,
                    forcedParent: mountain[sy][sx].forcedParent
                  });
                }
              }
            } else {
              if (isReplacingCut) console.warn("Cut child and not connected to bad root. Makes sense.");
              for (let k = 0; k < seamHeight; k++) {
                if (!result[k]) result.push([]);
                let sy = k;
                let sx;
                if (isReplacingCut) {
                  sx = mountain[sy].length - 1;
                } else {
                  sx = 0;
                  while (mountain[sy][sx].position + sy < j) sx++;
                }
                const sourceParentIndex = mountain[sy][sx].parentIndex;
                const parentShifts = i - (isReplacingCut ? 1 : 0);
                const parentPosition = mountain[sy][sourceParentIndex] ? mountain[sy][sourceParentIndex].position + parentShifts * (afterCutLength - badRootSeam) * (mountain[sy][sourceParentIndex].position + sy >= badRootSeam ? 1 : 0) - (k - sy) : -1;
                let parentIndex = 0;
                while (result[k][parentIndex] && result[k][parentIndex].position < parentPosition)
                  parentIndex++;
                if (!result[k][parentIndex] || result[k][parentIndex].position != parentPosition)
                  parentIndex = -1;
                result[k].push({
                  value: parentIndex == -1 ? newDiagonal[0][j + (afterCutLength - badRootSeam) * i].value : NaN,
                  position: j + (afterCutLength - badRootSeam) * i - k,
                  parentIndex,
                  forcedParent: mountain[sy][sx].forcedParent
                });
              }
            }
          }
        }
      }
      for (let i = result.length - 1; i >= 0; i--) {
        if (!result[i].length) {
          result.pop();
          continue;
        }
        for (let j = 0; j < result[i].length; j++) {
          if (!isNaN(result[i][j].value)) continue;
          let k = 0;
          while (result[i + 1][k].position < result[i][j].position - 1) k++;
          if (result[i + 1][k].position !== result[i][j].position - 1) throw Error("Mountain not complete");
          result[i][j].value = result[i][result[i][j].parentIndex].value + result[i + 1][k].value;
        }
      }
      let rr;
      if (stringify) {
        rr = [];
        for (let i = 0; result[0] && i < result[0].length; i++) {
          rr.push(result[0][i].value + (result[0][i].forcedParent ? "v" + result[0][i].parentIndex : ""));
        }
        rr = rr.join(",");
      } else {
        rr = result;
      }
      return rr;
    }
    return (seq, index) => {
      if ("" + seq === "Infinity") return [1, 1 + index];
      return expand18("" + seq, index, true).split(",").map((e) => +e);
    };
  })();
  var data = {};
  var Y_seq = {
    id: "y-seq",
    name: "Y sequence",
    simple_name: "Y",
    category_id: "category-y",
    display: { plain: sequence_display, from_display: sequence_from_display },
    is_limit: is_limit4,
    compare: (a, b) => lex_compare(a, b, number_compare),
    FS: (m, index) => {
      const key = "" + m;
      if (key === "Infinity") return [1, 1 + index];
      if (!data[key]) data[key] = [];
      else if (data[key][index] !== void 0) return data[key][index];
      return data[key][index] = FS_Y(m, index);
    },
    credit_text_id: "credit.yukito",
    init: () => [[Infinity], [1], []]
  };

  // src/notations/BM-like/BM.ts
  function INFINITY10() {
    return [[Infinity]];
  }
  function is_infinity11(a) {
    return ("" + a).startsWith("Infinity");
  }
  function compare10(a, b) {
    if (is_infinity11(a) || is_infinity11(b)) {
      return boolean_compare(is_infinity11(a), is_infinity11(b));
    }
    return lex_compare(a, b, (x, y) => lex_compare(normalize_col(x), normalize_col(y), number_compare));
  }
  function column_display(col) {
    const n_col = normalize_col(col);
    if (n_col.length === 0) return "(0)";
    return "(" + n_col + ")";
  }
  function display4(a) {
    if (is_infinity11(a)) return "Limit";
    return a.map(column_display).join("");
  }
  function from_display2(s, std = false) {
    if (s === "Limit") return INFINITY10();
    s = s.trim();
    if (s === "") return [];
    function error() {
      throw new Error(`Illegal input string: ${s}`);
    }
    function skip_spaces(i) {
      while (i < s.length && s[i] === " ") i++;
      return i;
    }
    function parse_column(start) {
      if (s[start] !== "(") error();
      let i = skip_spaces(start + 1);
      if (i < s.length && s[i] === ")") return [[], i + 1];
      const col = [];
      while (i < s.length) {
        i = skip_spaces(i);
        if (i < s.length && s[i] >= "0" && s[i] <= "9") {
          let num = 0;
          while (i < s.length && s[i] >= "0" && s[i] <= "9") {
            num = num * 10 + (s.charCodeAt(i) - 48);
            i++;
          }
          col.push(num);
          i = skip_spaces(i);
          if (i < s.length && s[i] === ",") {
            i++;
          } else if (i < s.length && s[i] === ")") {
            i++;
            break;
          } else {
            error();
          }
        } else {
          error();
        }
      }
      return [col, i];
    }
    function parse_expression(start) {
      const result2 = [];
      let i = start;
      while (i < s.length) {
        i = skip_spaces(i);
        if (i >= s.length || s[i] !== "(") break;
        const [col, end2] = parse_column(i);
        result2.push(col);
        i = end2;
      }
      return [result2, i];
    }
    const [result, end] = parse_expression(0);
    if (end !== s.length) error();
    return std ? standardize(result) : normalize2(result);
  }
  function is_limit7(a) {
    return is_infinity11(a) || a.length > 0 && a[a.length - 1][0] > 0;
  }
  function normalize_col(col) {
    return col.slice(0, index_of_last(col, (x) => x > 0) + 1);
  }
  function normalize2(m) {
    return m.map(normalize_col);
  }
  function standardize(m) {
    if (m.length === 0) return m;
    const H = Math.max(...m.map((col) => col.length));
    return m.map((col) => [...col, ...Array.from({ length: H - col.length }, () => 0)]);
  }
  function parents(m) {
    const result = [];
    for (let i = 0; i < m.length; i++) {
      result.push([]);
      for (let j = 0; j < m[i].length; j++) {
        let p = i;
        while (true) {
          p = j > 0 ? result[p][j - 1] : p - 1;
          if (p < 0) p = void 0;
          if (p === void 0) break;
          if ((m[p][j] ?? 0) < m[i][j]) break;
        }
        if (p !== void 0) result[i].push(p);
        else break;
      }
    }
    return result;
  }
  function ascending_threshold(P, r2, j_max) {
    const result = [];
    result[r2] = j_max;
    for (let i = r2 + 1; i < P.length; i++) {
      let result_i;
      for (let j = 0; j < j_max; j++) {
        const pij = P[i][j];
        if (pij === void 0 || pij < r2 || j >= result[pij]) {
          result_i = j;
          break;
        }
      }
      result[i] = result_i ?? j_max;
    }
    return result;
  }
  function expand(m, index) {
    if (m.length === 0) return m;
    const rightmost = m.length - 1;
    const col_last = m[rightmost];
    let topmost = col_last.length - 1;
    for (; topmost >= 0; --topmost) {
      if (col_last[topmost] > 0) break;
    }
    let result = m.slice(0, rightmost);
    if (topmost < 0) return result;
    const P = parents(m);
    const r2 = P[rightmost][topmost];
    const A = ascending_threshold(P, r2, topmost);
    const col_r = m[r2];
    const offset = Array.from({ length: topmost }, (_, j) => col_last[j] - (col_r[j] ?? 0));
    for (let w = 1; w <= index; ++w) {
      for (let i = r2; i < rightmost; ++i) {
        result.push(
          Array.from({ length: Math.max(m[i].length, A[i]) }, (_, y) => {
            const val = m[i][y] ?? 0;
            return y < A[i] ? val + offset[y] * w : val;
          })
        );
      }
    }
    return result;
  }
  function infinity_FS9(n) {
    return [[], Array.from({ length: n + 1 }, () => 1)];
  }
  function compute_mountain(m) {
    const P = parents(m);
    const h = Math.max(...m.map((col) => col.length));
    const diagram_rows = h + 1;
    const M = [];
    for (let i = 0; i < m.length; i++) {
      M.push([]);
      for (let j = diagram_rows - 1; j >= 0; j--) {
        if (j >= P[i].length || P[i][j] < 0) {
          M[i][j] = 1;
        } else {
          const up = M[i][j + 1] ?? 1;
          const left = M[P[i][j]][j] ?? 1;
          M[i][j] = up + left;
        }
      }
    }
    return { m, M, P };
  }
  function convert_to_0Y(m) {
    return compute_mountain(m).M.map((col) => col[0]);
  }
  function display_as_0Y(m) {
    return is_infinity11(m) ? "1,\u03C9" : convert_to_0Y(m).join(",");
  }
  function compute_0Y_mountain(seq) {
    const P = Array.from({ length: seq.length }, () => []);
    const M = Array.from({ length: seq.length }, (_, i) => [seq[i]]);
    const m = Array.from({ length: seq.length }, (_) => []);
    for (let j = 0; ; j++) {
      let has_next = false;
      for (let i = 0; i < seq.length; i++) {
        if (M[i][j] === 1) {
          M[i].push(1);
        } else {
          let p = j === 0 ? i - 1 : P[i][j - 1];
          while (p >= 0) {
            if (M[i][j] > M[p][j]) break;
            p = j === 0 ? p - 1 : P[p][j - 1];
          }
          if (p >= 0) {
            P[i].push(p);
            M[i].push(M[i][j] - M[p][j]);
            m[i].push((m[p][j] ?? 0) + 1);
            has_next = true;
          } else {
            throw new Error("Illegal 0Y sequence: " + seq);
          }
        }
      }
      if (!has_next) break;
    }
    return { M, P, m };
  }
  function from_display_as_0Y(str) {
    if (str === "Limit" || str === "1,\u03C9" || str === "1,w") return INFINITY10();
    const result = str.split(",").map((s) => parseInt(s.trim(), 10));
    if (result.find(Number.isNaN) !== void 0) throw new Error("Illegal omega-Y sequence");
    return compute_0Y_mountain(result).m;
  }
  function entry_display_simple(e) {
    let str = "" + e;
    return str.length > 1 ? "(" + str + ")" : str;
  }
  function column_display_simple(col) {
    let N = index_of_last(col, (x) => x > 0) + 1;
    if (N === 0) return "0";
    return col.slice(0, N).map(entry_display_simple).join("");
  }
  function display_simple(m) {
    if (is_infinity11(m)) return "Limit";
    return m.map(column_display_simple).join(" ");
  }
  function from_display_simple(s, std = false) {
    if (s === "Limit") return INFINITY10();
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_value() {
      if (i < s.length && s[i] === "(") {
        i++;
        const start = i;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
        if (start === i) error();
        if (i >= s.length || s[i] !== ")") error();
        const v = parseInt(s.substring(start, i), 10);
        i++;
        return v;
      }
      if (i < s.length && s[i] >= "0" && s[i] <= "9") {
        const v = s.charCodeAt(i) - 48;
        i++;
        return v;
      }
      error();
    }
    function parse_entry() {
      return parse_value();
    }
    function parse_column() {
      const col = [];
      while (i < s.length && s[i] !== " ") {
        col.push(parse_entry());
      }
      return col;
    }
    function parse_expr() {
      const result2 = [];
      while (i < s.length) {
        skip_spaces();
        if (i >= s.length) break;
        if (s[i] === "0" && (i + 1 >= s.length || s[i + 1] === " ")) {
          result2.push([]);
          i++;
          continue;
        }
        result2.push(parse_column());
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY10();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return std ? standardize(result) : normalize2(result);
  }
  function compute_bm_mountain_diagram(m, current_equiv) {
    const { M, P } = compute_mountain(m);
    const h = M[0].length - 1;
    const line_height = 40;
    const sorted_verticals = [];
    const heights = [];
    for (let vj = 0; vj <= h; vj++) {
      sorted_verticals.push(void 0);
      heights.push(vj * line_height);
    }
    const entries = Array.from(
      { length: m.length },
      () => Array.from({ length: h + 1 }, () => void 0)
    );
    const left_legs = Array.from(
      { length: m.length },
      () => Array.from({ length: h + 1 }, () => void 0)
    );
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j <= h; j++) {
        const val = current_equiv === "0Y" ? M[i][j] : (m[i] ?? [])[j] ?? 0;
        entries[i][j] = "" + val;
      }
      for (let j = 0; j < P[i].length; j++) {
        if (P[i][j] >= 0 && j + 1 <= h) {
          left_legs[i][j + 1] = [P[i][j], j];
        }
      }
    }
    return { sorted_verticals, heights, line_heights: [], entries, left_legs };
  }
  var draw_diagram_control_BM = {
    default_data: { current_equiv: void 0, invert_vertical: void 0 },
    draw_diagram: (m, _data) => {
      if (is_infinity11(m) || m.length === 0) return void 0;
      const mountain = compute_bm_mountain_diagram(m, _data.current_equiv ?? "BMS");
      return draw_mountain_diagram(mountain, { WV: 0, invert_vertical: _data.invert_vertical ?? false });
    },
    handle_action: (data20, action) => {
      if (action.type === "scroll") {
        if (action.direction === "down") return { ...data20, invert_vertical: true };
        if (action.direction === "up") return { ...data20, invert_vertical: false };
      }
      return null;
    }
  };
  var draw_diagram_control_0Y = {
    ...draw_diagram_control_BM,
    draw_diagram: (m, _data) => {
      if (is_infinity11(m) || m.length === 0) return void 0;
      const mountain = compute_bm_mountain_diagram(m, _data.current_equiv ?? "0Y");
      return draw_mountain_diagram(mountain, { WV: 0, invert_vertical: _data.invert_vertical ?? false });
    }
  };
  var BM4 = {
    id: "bm4",
    name: "Bashicu matrix system",
    simple_name: "BMS",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display2 },
    display_equiv: {
      "0Y": {
        plain: display_as_0Y,
        from_display: from_display_as_0Y
      },
      simple: {
        plain: display_simple,
        from_display: from_display_simple,
        name_id: "display.simple"
      }
    },
    is_limit: is_limit7,
    compare: compare10,
    draw_diagram: draw_diagram_control_BM,
    ...Y_FS_variants(expand, is_infinity11, infinity_FS9, is_limit7, display4),
    credit_text_id: "credit.bashicu",
    init: () => [INFINITY10(), []],
    debug: { compute_0Y_mountain }
  };
  var seq_0Y = {
    id: "0y",
    name: "0-Y sequence",
    simple_name: "0Y",
    category_id: "category-y",
    display: { plain: display_as_0Y, from_display: from_display_as_0Y },
    display_equiv: {
      BMS: {
        plain: display4,
        from_display: from_display2
      }
    },
    is_limit: is_limit7,
    compare: compare10,
    draw_diagram: draw_diagram_control_0Y,
    ...Y_FS_variants(expand, is_infinity11, infinity_FS9, is_limit7, display4),
    credit_text_id: "credit.yukito",
    init: () => [INFINITY10(), []]
  };

  // src/notations/BM-like/TBM.ts
  function entry_compare(e1, e2) {
    return tuple_lex_compare(e1, e2, [number_compare, compare11]);
  }
  function column_compare(c1, c2) {
    return lex_compare(c1, c2, entry_compare);
  }
  function compare11(a, b) {
    return lex_compare(a, b, column_compare);
  }
  function vertical_compare2(v1, v2) {
    return lex_compare(v1, v2, compare11);
  }
  function index_after(V, pos) {
    for (let k = 0; k < V.length; k++) {
      if (vertical_compare2(V[k], pos) > 0) return k;
    }
    return V.length;
  }
  function vertical_parent(v, Pi, Vi) {
    for (let k = 0; k < Vi.length; k++) {
      if (vertical_compare2(Vi[k], v) >= 0) return Pi[k];
    }
    return void 0;
  }
  function vertical_add(v1, v2) {
    if (v1.length === 0) return v2.slice();
    if (v2.length === 0) return v1.slice();
    const first2 = v2[0];
    let i = v1.length;
    while (i > 0 && compare11(v1[i - 1], first2) < 0) i--;
    return v1.slice(0, i).concat(v2);
  }
  function parents2(m, V) {
    const P = [];
    for (let i = 0; i < m.length; i++) {
      const Pi = [];
      for (let j = 0; j < m[i].length; j++) {
        const [value] = m[i][j];
        const pos = j === 0 ? [] : V[i][j - 1];
        let p = j === 0 ? i - 1 : Pi[j - 1][0];
        while (p >= 0) {
          if (m[p].length === 0) {
            if (0 < value) {
              Pi.push([p, 0]);
              break;
            }
            p = -1;
            break;
          }
          const j_p = j === 0 ? 0 : index_after(V[p], pos);
          if (j_p >= m[p].length) {
            Pi.push([p, j_p]);
            break;
          }
          const value_p = m[p][j_p][0];
          if (value_p < value) {
            Pi.push([p, j_p]);
            break;
          }
          const next = j === 0 ? [p - 1, 0] : vertical_parent(pos, P[p], V[p]);
          if (!next) {
            p = -1;
            break;
          }
          p = next[0];
        }
        if (p < 0) break;
      }
      P.push(Pi);
    }
    return P;
  }
  function column_verticals(col) {
    const result = [];
    let acc = [];
    for (const [, height_expr] of col) {
      acc = vertical_add(acc, [height_expr]);
      result.push(acc.slice());
    }
    return result;
  }
  function is_one4(expr) {
    return expr.length === 1 && expr[0].length === 0;
  }
  function to_vertical(m) {
    const v = [];
    let prev = 0;
    for (let i = 1; i <= m.length; i++) {
      if (i === m.length || m[i].length === 0) {
        v.push(m.slice(prev, i));
        prev = i;
      }
    }
    return v;
  }
  function expand_limit(m, index, N) {
    const col = m[N];
    const last_idx = col.length - 1;
    const [v, h] = col[last_idx];
    const new_h = TBM.FS(h, index);
    const segs = to_vertical(new_h);
    const result = m.slice();
    const new_entries = col.slice(0, last_idx);
    for (const seg of segs) new_entries.push([v, seg]);
    result[N] = new_entries;
    return result;
  }
  function expand_successor(m, index) {
    const V = m.map(column_verticals);
    const P = parents2(m, V);
    const N = m.length - 1;
    const r2 = P[N][m[N].length - 1][0];
    const result = m.slice(0, N);
    const j_max = m[N].length > 1 ? V[N][m[N].length - 2] : [];
    const offset = compute_offset(m, V, N, r2);
    const A = ascending_threshold2(V, P, r2, j_max);
    for (let w = 1; w <= index; w++) {
      for (let i = r2; i < N; i++) {
        result.push(copy_column(m[i], offset, A[i], w));
      }
    }
    return result;
  }
  function compute_offset(m, V, N, r2) {
    const off = [];
    for (let j = 0; j < m[N].length; j++) {
      const pos = j === 0 ? [] : V[N][j - 1];
      const j_r = index_after(V[r2], pos);
      const delta = m[N][j][0] - (j_r < m[r2].length ? m[r2][j_r][0] : 0);
      off.push([delta, m[N][j][1]]);
    }
    return off;
  }
  function ascending_threshold2(V, P, r2, j_max) {
    const A = [];
    for (let i = 0; i < V.length; i++) {
      if (i < r2) {
        A.push([]);
        continue;
      }
      if (i === r2) {
        A.push(j_max);
        continue;
      }
      let found;
      for (let j = 0; j < V[i].length; j++) {
        const pos = j === 0 ? [] : V[i][j - 1];
        const [col_p] = P[i][j];
        if (col_p < r2) {
          found = pos;
          break;
        }
        if (vertical_compare2(pos, A[col_p]) >= 0) {
          found = pos;
          break;
        }
        let new_pos = V[i][j];
        if (vertical_compare2(new_pos, A[col_p]) >= 0) {
          found = A[col_p];
          break;
        }
      }
      A.push(found ?? V[i][V[i].length - 1]);
    }
    return A;
  }
  function column_add(a, b) {
    const res = [];
    let ai = 0, bi = 0;
    while (ai < a.length || bi < b.length) {
      if (ai >= a.length) {
        res.push([b[bi][0], b[bi][1]]);
        bi++;
      } else if (bi >= b.length) {
        res.push([a[ai][0], a[ai][1]]);
        ai++;
      } else {
        const ea = a[ai], eb = b[bi];
        const cmp = compare11(ea[1], eb[1]);
        const h = cmp < 0 ? ea[1] : eb[1];
        res.push([ea[0] + eb[0], h]);
        if (cmp <= 0) ai++;
        if (cmp >= 0) bi++;
      }
    }
    return res;
  }
  function column_truncate(col, j_max) {
    const res = [];
    let ci = 0, vi = 0;
    while (ci < col.length && vi < j_max.length) {
      const e = col[ci];
      const vh = j_max[vi];
      const cmp = compare11(e[1], vh);
      const h = cmp < 0 ? e[1] : vh;
      res.push([e[0], h]);
      if (cmp <= 0) ci++;
      if (cmp >= 0) vi++;
    }
    return res;
  }
  function column_mul(col, w) {
    return col.map(([v, e]) => [v * w, e]);
  }
  function copy_column(col_i, offset, A_i, w) {
    return column_add(col_i, column_mul(column_truncate(offset, A_i), w));
  }
  function expand2(m, index) {
    if (m.length === 0) return m;
    const N = m.length - 1;
    const last_col = m[N];
    if (last_col.length === 0) return m.slice(0, N);
    const [, last_height] = last_col[last_col.length - 1];
    if (is_one4(last_height)) {
      return expand_successor(m, index);
    } else {
      return expand_limit(m, index, N);
    }
  }
  function is_infinity12(a) {
    return a.length > 0 && a[0].length > 0 && a[0][0][0] === Infinity;
  }
  function ONE2() {
    return [[]];
  }
  function OMEGA() {
    return [[], [[1, ONE2()]]];
  }
  function INFINITY11() {
    return [[[Infinity, []]]];
  }
  function height_display(s, html) {
    if (s.length === 1) return void 0;
    if (compare11(s, OMEGA()) === 0) return "\u03C9";
    return display5(s, html);
  }
  function entry_display([v, s], html) {
    let sd = height_display(s, html);
    if (sd === void 0) return "" + v;
    if (html) return v + "<sup>" + sd + "</sup>";
    return v + "^" + sd;
  }
  function column_display2(col, html) {
    return "(" + col.map((e) => entry_display(e, html)).join(",") + ")";
  }
  function display5(m, html = false) {
    if (is_infinity12(m)) return "Limit";
    return m.map((col) => column_display2(col, html)).join("");
  }
  function from_display3(str) {
    let i = 0;
    const s = str;
    function error() {
      throw new Error(`Illegal input string: ${s}`);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const entries = [];
      skip_spaces();
      if (i < s.length && s[i] !== ")") {
        entries.push(parse_entry());
        skip_spaces();
        while (i < s.length && s[i] === ",") {
          i++;
          skip_spaces();
          if (i < s.length && s[i] === ")") break;
          entries.push(parse_entry());
          skip_spaces();
        }
      }
      skip_spaces();
      if (i >= s.length || s[i] !== ")") error();
      i++;
      return entries;
    }
    function parse_height() {
      skip_spaces();
      if (i < s.length && (s[i] === "\u03C9" || s[i] === "w")) {
        i++;
        return OMEGA();
      }
      return parse_expr();
    }
    function parse_entry() {
      const v = parse_number();
      skip_spaces();
      if (i < s.length && s[i] === "^") {
        i++;
        return [v, parse_height()];
      }
      return [v, ONE2()];
    }
    skip_spaces();
    if (i + 5 <= s.length && s.slice(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY11();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function infinity_FS10(index) {
    if (index === 0) return [[]];
    return [[], [[1, infinity_FS10(index - 1)]]];
  }
  var TBM = {
    id: "tbm",
    name: "Transfinite Bashicu matrix",
    simple_name: "TBMS",
    category_id: "category-bm-like",
    display: {
      plain: (m) => display5(m, false),
      html: (m) => display5(m, true),
      from_display: from_display3
    },
    is_limit: (m) => {
      if (is_infinity12(m)) return true;
      if (m.length === 0) return false;
      return m[m.length - 1].length > 0;
    },
    compare: compare11,
    FS: (m, index) => {
      if (is_infinity12(m)) {
        return infinity_FS10(index);
      }
      if (m.length === 0) return m;
      return expand2(m, index);
    },
    credit_text_id: "credit.tbm",
    init: () => {
      return [INFINITY11(), []];
    }
  };

  // src/notations/BM-like/CMS.ts
  var CMS = {
    id: "cms",
    name: "Crane matrix system",
    simple_name: "CMS",
    category_id: "category-bm-like",
    display: {
      plain: display4,
      from_display: from_display2
    },
    is_limit: is_limit7,
    compare: compare10,
    FS: /* @__PURE__ */ (() => {
      var data20 = {}, expand18 = (m1, FSterm) => {
        var parent8 = (m, cache, x, y) => {
          var str = x + "," + y;
          if (cache[str] !== void 0) return cache[str];
          for (var p = x; (p = y ? parent8(m, cache, p, y - 1) : p - 1) >= 0; ) {
            if (m[p][y] < m[x][y]) break;
          }
          return cache[str] = p;
        }, L3 = (m, cache, x1, x2) => {
          var x, y;
          for (y = ymax; y >= 0; --y) {
            if (!m[x2][y]) continue;
            for (x = x2; x1 < x; ) x = parent8(m, cache, x, y);
            if (x === x1) return y;
          }
          return -1;
        }, ascending = (r2, x, y) => {
          var str = r2 + "," + x + "," + y;
          if (ascending_cache[str] !== void 0) return ascending_cache[str];
          return ascending_cache[str] = r2 <= x && (r2 === x || ascending(r2, parent8(m1, m1cache, x, y), y));
        }, m1cache = {}, m2cache = {}, ascending_cache = {}, endcol = m1.length - 1, m2 = m1.slice(0, endcol), child = m1[endcol], ymax = child.length - 1, LNZ;
        for (LNZ = ymax; LNZ >= 0; --LNZ) {
          if (child[LNZ] > 0) break;
        }
        if (LNZ < 0 || !FSterm) return m2;
        var BR = parent8(m1, m1cache, endcol, LNZ), BRcolumn = m1[BR], offset = child.map((value, y) => y < LNZ ? value - BRcolumn[y] : 0), offset_asc = Array(endcol).fill(0, BR).map((t, x) => offset.map((value, y) => ascending(BR, x, y) ? value : 0)), col, n;
        for (n = 0; ++n <= FSterm; ) {
          for (col = BR; col < endcol; ++col) {
            m2.push(m1[col].map((value, y) => value + offset_asc[col][y] * n));
          }
        }
        for (col = endcol; BR < --col; ) if (L3(m1, m1cache, BR, col) > LNZ) break;
        if (col === BR) {
          if (ymax > 0 && m2.every((column) => column[ymax] === 0))
            m2 = m2.map((column) => column.slice(0, ymax));
          return m2;
        }
        m2.push(child.map((value, y) => value + (y <= LNZ ? value - BRcolumn[y] : 0) * FSterm));
        var c = col, c_ = c + (endcol - BR), d = m2.length - 1, D = [];
        for (col = endcol; col < d; ++col)
          D.push(
            m2[col].map((value, k) => {
              if (k > LNZ) return value;
              var u = 0, ss = col, nextss;
              while (true) {
                nextss = parent8(m2, m2cache, ss, k);
                if (nextss < endcol) break;
                ++u;
                ss = nextss;
              }
              if (L3(m2, m2cache, ss, d) >= k - 1) return m2[c_][k] + u;
              else return value;
            })
          );
        m2 = m2.slice(0, c_).concat(D);
        if (ymax > 0 && m2.every((column) => column[ymax] === 0))
          m2 = m2.map((column) => column.slice(0, ymax));
        return m2;
      };
      return (m, FSterm) => {
        if ("" + m === "Infinity") return [[], Array(FSterm + 1).fill(1)];
        if (m.length === 0) return [];
        var datakey = display4(m);
        if (!data20[datakey]) data20[datakey] = [];
        else if (data20[datakey][FSterm] !== void 0) return data20[datakey][FSterm];
        return data20[datakey][FSterm] = normalize2(expand18(standardize(m), FSterm));
      };
    })(),
    init: () => [[[Infinity]], []]
  };

  // src/notations/BM-like/BHM.ts
  var data2 = {};
  function expand3(m, index) {
    function parent8(x, y, cache) {
      const str = x + "," + y;
      if (cache[str] !== void 0) return cache[str];
      let p;
      for (p = x; (p = y ? parent8(p, y - 1, cache) : p - 1) >= 0; ) {
        if (m[p][y] < m[x][y]) break;
      }
      return cache[str] = p;
    }
    function ascending(r2, x, y, cache, roots2) {
      const str = r2 + "," + x + "," + y;
      if (cache[str] !== void 0) return cache[str];
      return cache[str] = r2 <= x && (roots2.includes(x) || ascending(r2, parent8(x, y, parent_cache), y, cache, roots2));
    }
    function delta(r2, LNZ2) {
      return m[r2].map((value, y) => y < LNZ2 ? child[y] - value : 0);
    }
    function expansion(r2, n2, LNZ2, parent_cache2, ascend_cache2, roots2) {
      const ss = m.slice(0, end_col);
      const del_r = delta(r2, LNZ2);
      for (let a = 1; a <= n2; ++a) {
        for (let x = r2; x < end_col; ++x) {
          ss.push(
            ss[x].map((value, y) => value + a * del_r[y] * (ascending(r2, x, y, ascend_cache2, roots2) ? 1 : 0))
          );
        }
      }
      return ss;
    }
    function expansion_append(r2, LNZ2, parent_cache2, ascend_cache2, roots2) {
      const del_r = delta(r2, LNZ2);
      const res2 = expansion(r2, 1, LNZ2, parent_cache2, ascend_cache2, roots2);
      res2.push(
        m[end_col].map((value, y) => value + del_r[y] * (ascending(r2, end_col, y, ascend_cache2, roots2) ? 1 : 0))
      );
      return res2;
    }
    const end_col = m.length - 1;
    const result = m.slice(0, end_col);
    const child = m[end_col];
    const y_max = child.length - 1;
    let LNZ = y_max;
    for (; LNZ >= 0; --LNZ) {
      if (child[LNZ] > 0) break;
    }
    if (LNZ < 0) return result;
    const parent_cache = {};
    const ascend_cache = {};
    const special_root = parent8(parent8(end_col, LNZ, parent_cache), LNZ, parent_cache);
    const roots = [];
    for (let n2 = end_col; (n2 = LNZ ? parent8(n2, LNZ - 1, parent_cache) : n2 - 1) > special_root; ) {
      if (parent8(n2, LNZ, parent_cache) === special_root) roots.push(n2);
    }
    const threshold2 = expansion_append(roots[0], LNZ, parent_cache, ascend_cache, roots);
    let n = roots.findIndex((r2) => compare10(expansion_append(r2, LNZ, parent_cache, ascend_cache, roots), threshold2) < 0);
    if (n === -1) n = roots.length;
    let res = expansion(roots[n - 1], index, LNZ, parent_cache, ascend_cache, roots);
    if (y_max > 0 && res.every((col) => col[y_max] === 0)) res = res.map((col) => col.slice(0, y_max));
    return res;
  }
  function from_display4(str) {
    return from_display2(str, true);
  }
  var BHM = {
    id: "bhm",
    name: "Bashicu hyper matrix",
    simple_name: "BHM",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display4 },
    is_limit: is_limit7,
    compare: compare10,
    FS: (m, index) => {
      if (is_infinity11(m)) return [Array(index + 1).fill(0), Array(index + 1).fill(1)];
      if (m.length === 0) return [];
      const key = display4(m);
      if (!data2[key]) data2[key] = [];
      else if (data2[key][index] !== void 0) return data2[key][index];
      return data2[key][index] = expand3(m, index);
    },
    credit_text_id: "credit.bashicu",
    init: () => [INFINITY10(), []]
  };

  // src/notations/BM-like/BSM.ts
  var data3 = {};
  function expand4(m, index) {
    function parent8(x, y, cache) {
      const str = x + "," + y;
      if (cache[str] !== void 0) return cache[str];
      let p;
      for (p = x; (p = y ? parent8(p, y - 1, cache) : p - 1) >= 0; ) {
        if (m[p][y] < m[x][y]) break;
      }
      return cache[str] = p;
    }
    function ascending(r2, x, y, cache, roots2) {
      const str = r2 + "," + x + "," + y;
      if (cache[str] !== void 0) return cache[str];
      return cache[str] = r2 <= x && (roots2.includes(x) || ascending(r2, parent8(x, y, parent_cache), y, cache, roots2));
    }
    function delta(r2, LNZ2) {
      return m[r2].map((value, y) => y < LNZ2 ? child[y] - value : y === LNZ2 ? child[y] - value - 1 : 0);
    }
    function expansion(r2, n2, LNZ2, parent_cache2, ascend_cache2, roots2) {
      const ss = m.slice(0, end_col);
      const del_r = delta(r2, LNZ2);
      for (let a = 1; a <= n2; ++a) {
        for (let x = r2; x < end_col; ++x) {
          ss.push(
            ss[x].map((value, y) => value + a * del_r[y] * (ascending(r2, x, y, ascend_cache2, roots2) ? 1 : 0))
          );
        }
      }
      return ss;
    }
    function expansion_append(r2, LNZ2, parent_cache2, ascend_cache2, roots2) {
      const del_r = delta(r2, LNZ2);
      const res2 = expansion(r2, 1, LNZ2, parent_cache2, ascend_cache2, roots2);
      res2.push(
        m[end_col].map((value, y) => value + del_r[y] * (ascending(r2, end_col, y, ascend_cache2, roots2) ? 1 : 0))
      );
      return res2;
    }
    const end_col = m.length - 1;
    const result = m.slice(0, end_col);
    const child = m[end_col];
    const y_max = child.length - 1;
    let LNZ = y_max;
    for (; LNZ >= 0; --LNZ) {
      if (child[LNZ] > 0) break;
    }
    if (LNZ < 0) return result;
    const parent_cache = {};
    const ascend_cache = {};
    const special_roots = [];
    const roots = [];
    for (let n2 = end_col; n2 >= 0; ) {
      special_roots.push(n2 = parent8(n2, LNZ, parent_cache));
    }
    for (let n2 = special_roots[0]; n2 >= 0; n2 = LNZ ? parent8(n2, LNZ - 1, parent_cache) : n2 - 1) {
      if (special_roots.includes(parent8(n2, LNZ, parent_cache))) roots.push(n2);
    }
    const test_root = m[roots[0]].slice(LNZ + 1);
    const threshold2 = expansion_append(roots[0], LNZ, parent_cache, ascend_cache, roots);
    let n = roots.findIndex(
      (r2) => special_roots.includes(r2) ? m[r2].slice(LNZ + 1).some((value, dy) => value !== test_root[dy]) : compare10(expansion_append(r2, LNZ, parent_cache, ascend_cache, roots), threshold2) < 0
    );
    if (n === -1) n = roots.length;
    let res = expansion(roots[n - 1], index, LNZ, parent_cache, ascend_cache, roots);
    if (y_max > 0 && res.every((col) => col[y_max] === 0)) res = res.map((col) => col.slice(0, y_max));
    return res;
  }
  function from_display5(str) {
    return from_display2(str, true);
  }
  var BSM = {
    id: "bsm",
    name: "Bashicu sudden matrix",
    simple_name: "BSM",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display5 },
    is_limit: is_limit7,
    compare: compare10,
    FS: (m, index) => {
      if (is_infinity11(m)) return [Array(index + 1).fill(0), Array(index + 1).fill(1)];
      if (m.length === 0) return [];
      const key = display4(m);
      if (!data3[key]) data3[key] = [];
      else if (data3[key][index] !== void 0) return data3[key][index];
      return data3[key][index] = expand4(m, index);
    },
    credit_text_id: "credit.bashicu",
    init: () => [INFINITY10(), []]
  };

  // src/notations/BM-like/BLM.ts
  var BLM = {
    id: "blm",
    name: "Bashicu large matrix",
    simple_name: "BLM",
    category_id: "category-bm-like",
    display: {
      plain: display4,
      from_display: from_display2
    },
    is_limit: is_limit7,
    compare: compare10,
    FS: /* @__PURE__ */ (() => {
      var data20 = {}, expand18 = (b, a) => {
        var d3 = b.length - 1, d2 = b[0].length - 1, b2 = Array(d3 + 1).fill(Array(d2 + 1).fill(0)), c = Array(d2 + 1).fill(0), c2 = Array(d3 + 1).fill(0), c3 = Array(d2 + 1).fill(0), d7 = 0, d8 = 0, d9 = 0, d18 = 0, d19 = 0;
        for (var d4 = 0; d4 <= d2; ++d4) {
          if (0 < b[d3][d4] && !b[d3][d4 + 1]) {
            for (var d5 = 0; d5 <= d3; ++d5) {
              for (var d6 = 0; d6 <= d4; ++d6) {
                if (b[d3 - d5][d6] < b[d3][d6] - c[d6]) {
                  if (d6 < d4) {
                    c[d6] = b[d3][d6] - b[d3 - d5][d6];
                  } else {
                    if (!d7) d8 = d5;
                    ++d9;
                    if (c[d4] + 1 < b[d3][d6] - b[d3 - d5][d6]) ++c[d4];
                    c2[d9] = d5;
                    for (var d10 = 0; d10 <= d4; ++d10) {
                      b2[d3 - d5][d10] = d9;
                    }
                    for (var d11 = 0; d11 <= d4; ++d11) {
                      for (var d12 = d3 - d5 + 1; d12 <= d3; ++d12) {
                        for (var d13 = d12; d13 >= d3 - d5; --d13) {
                          for (var d14 = 0; d14 <= d11; ++d14) {
                            if (b[d13][d14] < b[d12][d14] - c3[d14]) {
                              if (d11 === d14) {
                                if (0 < b2[d13][d11] && !b2[d12][d11])
                                  b2[d12][d11] = d9;
                                d13 = d3 - d5;
                              } else {
                                c3[d14] = b[d12][d14] - b[d13][d14];
                              }
                            } else {
                              d14 = d11;
                            }
                          }
                        }
                        for (var d15 = 0; d15 <= d4; ++d15) {
                          c3[d15] = 0;
                        }
                      }
                    }
                    for (var d16 = 0; d16 <= d8; ++d16) {
                      for (var d17 = 0; d17 <= d2; ++d17) {
                        d18 = 0;
                        if (0 < b2[d3 - d8 + d16][d17]) {
                          if (d17 < d4 + 1)
                            d18 = b[d3 - c2[b2[d3 - d8 + d16][d17]]][d17] - b[d3 - d5][d17];
                        }
                        if (b[d3 - d5 + d16][d17] < b[d3 - d8 + d16][d17] - d18 || 1 < d5 - d7 && 0 < d7) {
                          d16 = d7;
                          d17 = d2;
                          d19 = 1;
                          d5 = d3;
                          --d9;
                        } else if (b[d3 - d8 + d16][d17] - d18 < b[d3 - d5 + d16][d17]) {
                          d16 = d7;
                          d17 = d2;
                        }
                      }
                    }
                    if (!d19) d7 = d5;
                    else d19 = 0;
                  }
                } else {
                  d6 = d4;
                }
              }
            }
            d4 = d2;
          }
        }
        for (var d20 = 0; d20 <= d2; ++d20) {
          if (0 < b[d3][d20 + 1]) {
            c[d20] = b[d3][d20] - b[d3 - d7][d20];
          } else {
            c[d20] = b[d3][d20] - b[d3 - d7][d20] - 1;
            d20 = d2;
          }
        }
        var result = b.slice(0, d3).map((col) => col.slice());
        for (var d21 = 1; d21 <= a * d7; ++d21) {
          if (!result[d3]) result[d3] = [];
          if (!b2[d3]) b2[d3] = [];
          for (var d22 = 0; d22 <= d2; ++d22) {
            if (0 < b2[d3 - d7][d22] && b2[d3 - d7][d22] < d9 + 1) {
              result[d3][d22] = result[d3 - d7][d22] + c[d22];
            } else {
              result[d3][d22] = result[d3 - d7][d22];
            }
            b2[d3][d22] = b2[d3 - d7][d22];
          }
          ++d3;
        }
        if (d2 > 0 && result.every((column) => column[d2] === 0))
          result = result.map((column) => column.slice(0, d2));
        return result;
      };
      return (m, FSterm) => {
        if ("" + m === "Infinity") return [[], Array(FSterm + 1).fill(1)];
        if (m.length === 0) return [];
        var datakey = display4(m);
        if (!data20[datakey]) data20[datakey] = [];
        else if (data20[datakey][FSterm] !== void 0) return data20[datakey][FSterm];
        return data20[datakey][FSterm] = normalize2(expand18(standardize(m), FSterm));
      };
    })(),
    init: () => [[[Infinity]], []]
  };

  // src/notations/BM-like/UPMS.ts
  function make_context(matrix) {
    const m = standardize(matrix);
    const colCount = m.length;
    const rowCount = colCount === 0 ? 0 : m[0].length;
    const P = parents(m);
    return { m, colCount, rowCount, P };
  }
  function is_ancestor(ctx, jCol, target, b) {
    let current = jCol;
    while (current >= target) {
      if (current === target) return true;
      current = ctx.P[current][b];
      if (current === void 0) break;
    }
    return false;
  }
  function last_column_is_zero(matrix) {
    if (matrix.length === 0) return true;
    const last = matrix[matrix.length - 1];
    for (let r2 = 0; r2 < last.length; r2++) {
      if (last[r2] !== 0) return false;
    }
    return true;
  }
  function find_LNZ_index(matrix) {
    if (matrix.length === 0) return -1;
    const last_col = matrix[matrix.length - 1];
    for (let r2 = last_col.length - 1; r2 >= 0; r2--) {
      if (last_col[r2] !== 0) return r2;
    }
    return -1;
  }
  function find_bad_root(ctx) {
    const lastCol = ctx.colCount - 1;
    const t = find_LNZ_index(ctx.m);
    if (t === -1) return null;
    const rootCol = ctx.P[lastCol][t];
    if (rootCol === void 0) return null;
    return { r: rootCol, t };
  }
  function compute_delta(ctx, rootCol, t) {
    const lastCol = ctx.colCount - 1;
    const delta = new Array(ctx.rowCount);
    for (let r2 = 0; r2 < ctx.rowCount; r2++) delta[r2] = r2 >= t ? 0 : ctx.m[lastCol][r2] - ctx.m[rootCol][r2];
    return delta;
  }
  function compare_marked_matrix(a, b) {
    return lex_compare(a, b, lex_compare_by(tuple_lex_compare_by([boolean_compare, number_compare])));
  }
  function compute_UPMS_verification_roots(ctx, rootCol, t, bm_threshold = 1) {
    const m = ctx.m;
    const alpha = ctx.colCount - 1;
    const y = rootCol;
    const height = ctx.rowCount;
    const P = ctx.P;
    const vr = Array(alpha).fill(0);
    function get_VR(c, row) {
      return row < vr[c];
    }
    function get_base(c, k) {
      return Array.from({ length: k + 2 }, (_, r2) => m[c][r2] + (r2 <= k ? 1 : 0));
    }
    const transformed_X_value = (source, row, iCol, k) => {
      let value = m[source][row];
      let mark4 = row < k && get_VR(source, row);
      if (mark4) value -= m[iCol][row];
      return [mark4, value];
    };
    const transformed_Y_value = (source, row, jCol, k) => {
      let value = m[source][row];
      let mark4 = false;
      if (row < k) {
        const colIsJ = source === jCol;
        const containsJ = is_ancestor(ctx, source, jCol, row);
        if (colIsJ || containsJ) {
          mark4 = true;
          value -= m[jCol][row];
        }
      }
      return [mark4, value];
    };
    function compute_transformed_X(c, k) {
      let u = void 0;
      const base = get_base(c, k);
      for (let candidate = c + 1; candidate <= alpha; candidate++) {
        if (lex_compare(m[candidate], base, number_compare) < 0) {
          u = candidate;
          break;
        }
      }
      if (u === void 0) return null;
      const result = [];
      for (let l = c; l < u; l++) {
        result.push(Array.from({ length: height }, (_, row) => transformed_X_value(l, row, c, k)));
      }
      return result;
    }
    function compute_transformed_Y(k) {
      let a = alpha;
      while (a !== void 0 && m[a][k] !== m[y][k] + 1) a = P[a][k];
      if (a === void 0) a = alpha;
      const result = [];
      for (let l = a; l <= alpha; l++) {
        result.push(Array.from({ length: height }, (_, row) => transformed_Y_value(l, row, a, k)));
      }
      return result;
    }
    for (let row = 0; row < t; row++) {
      for (let col = y; col < alpha; col++) {
        if (col === y || row === 0) {
          vr[col]++;
          continue;
        }
        if (vr[col] !== row) {
          continue;
        }
        const parent8 = P[col][row];
        if (parent8 === void 0 || parent8 < y || !get_VR(parent8, row)) {
          continue;
        }
        if (parent8 !== y || row < bm_threshold) {
          vr[col]++;
          continue;
        }
        let higher_parent_escapes_bad_root = false;
        for (let vRow = row + 1; vRow < t - 1; vRow++) {
          if (P[col][vRow] !== y) {
            higher_parent_escapes_bad_root = true;
            break;
          }
        }
        if (higher_parent_escapes_bad_root) {
          continue;
        }
        const transformed_X = compute_transformed_X(col, row);
        if (transformed_X === null) {
          vr[col]++;
          continue;
        }
        const transformed_Y = compute_transformed_Y(row);
        const cmp = compare_marked_matrix(transformed_X, transformed_Y);
        if (cmp >= 0) vr[col]++;
      }
    }
    return vr;
  }
  function expand5(matrix, index, bm_threshold = 1) {
    const ctx = make_context(matrix);
    const m = ctx.m;
    const n = Math.max(0, Math.floor(index));
    if (m.length === 0) return [];
    if (last_column_is_zero(m)) return m.slice(0, -1);
    const badRoot = find_bad_root(ctx);
    if (badRoot === null) return [];
    const { r: r2, t } = badRoot;
    const alpha = ctx.colCount - 1;
    const delta = compute_delta(ctx, r2, t);
    const vr = compute_UPMS_verification_roots(ctx, r2, t, bm_threshold);
    const result = [...m.slice(0, alpha)];
    for (let w = 1; w <= n; w++) {
      for (let j = r2; j < alpha; j++) {
        let result_col = [...m[j]];
        for (let k = 0; k < vr[j]; k++) result_col[k] += delta[k] * w;
        result.push(result_col);
      }
    }
    return normalize2(result);
  }
  var UPMS = {
    id: "upms",
    name: "Unupgrading projection matrix system",
    simple_name: "UPMS",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display2 },
    display_equiv: {
      UP0Y: {
        plain: display_as_0Y,
        from_display: from_display_as_0Y
      },
      simple: {
        plain: display_simple,
        from_display: from_display_simple,
        name_id: "display.simple"
      }
    },
    is_limit: is_limit7,
    compare: compare10,
    ...sequence_FS_variants0(expand5, is_infinity11, infinity_FS9, is_limit7, display4),
    credit_text_id: "credit.test-alpha0",
    init: () => [INFINITY10(), []],
    debug: { expandUPMS: expand5 }
  };
  function partial_UPMS(n) {
    return {
      id: "upms-partial-" + n,
      name: "BMS(" + n + " rows) + UPMS",
      simple_name: "(>" + n + ")-UPMS",
      category_id: "category-upms-partial",
      display: { plain: display4, from_display: from_display2 },
      display_equiv: {
        ["(>" + n + ")-UP0Y"]: {
          plain: display_as_0Y,
          from_display: from_display_as_0Y
        },
        simple: {
          plain: display_simple,
          from_display: from_display_simple,
          name_id: "display.simple"
        }
      },
      is_limit: is_limit7,
      compare: compare10,
      ...sequence_FS_variants0(bind3(expand5, n), is_infinity11, infinity_FS9, is_limit7, display4),
      credit_text_id: "credit.test-alpha0",
      init: () => [INFINITY10(), [[], Array(n + 3).fill(1)], []],
      debug: { expandUPMS: expand5 }
    };
  }
  var category_partial_UPMS = {
    id: "category-upms-partial",
    name: "BMS(n rows) + UPMS",
    simple_name: "(>n)-UPMS",
    parent_id: "category-bm-like",
    generator: { start: 2, initial: 3, create: partial_UPMS }
  };

  // src/notations/BM-like/LPMS.ts
  var pseudoInfinity = (expr) => "" + expr === "Infinity";
  var cloneCol = (col) => col.slice();
  var isNat = (x) => Number.isInteger(x) && x >= 0 && Number.isFinite(x);
  var maxRows = (matrix) => {
    if (!Array.isArray(matrix) || matrix.length === 0) return 0;
    let rows = 0;
    for (const col of matrix) rows = Math.max(rows, Array.isArray(col) ? col.length : 0);
    return rows;
  };
  var standardize2 = (matrix, rows) => {
    if (!Array.isArray(matrix)) return [];
    const r2 = rows === void 0 ? maxRows(matrix) : rows;
    return matrix.map((col) => {
      const out = Array.isArray(col) ? col.slice(0, r2) : [];
      while (out.length < r2) out.push(0);
      return out;
    });
  };
  var zeroCol = (rows) => Array(rows).fill(0);
  var onesCol = (rows) => Array(rows).fill(1);
  var constCol = (a, rows) => {
    const col = Array(rows).fill(0);
    if (rows > 0) col[0] = a;
    return col;
  };
  var colCompare = (a, b, rows = Math.max(a ? a.length : 0, b ? b.length : 0), missingA = 0, missingB = 0) => {
    for (let r2 = 0; r2 < rows; r2++) {
      const av = a ? r2 < a.length ? a[r2] : 0 : missingA;
      const bv = b ? r2 < b.length ? b[r2] : 0 : missingB;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  };
  var getPhaseColumn = (matrix, index, rows) => index >= 0 && index < matrix.length ? matrix[index] : Array(rows).fill(-1);
  var phaseColCompare = (matrix, index, col, rows) => colCompare(getPhaseColumn(matrix, index, rows), col, rows, -1, 0);
  var phaseColEq = (matrix, index, col, rows) => phaseColCompare(matrix, index, col, rows) === 0;
  var phaseColLt = (matrix, index, col, rows) => phaseColCompare(matrix, index, col, rows) < 0;
  var phaseColLe = (matrix, index, col, rows) => phaseColCompare(matrix, index, col, rows) <= 0;
  var phaseColGt = (matrix, index, col, rows) => phaseColCompare(matrix, index, col, rows) > 0;
  var phaseColGe = (matrix, index, col, rows) => phaseColCompare(matrix, index, col, rows) >= 0;
  var phaseColsCompare = (matrix, startIndex, cols, rows) => {
    for (let i = 0; i < cols.length; i++) {
      const cmp = phaseColCompare(matrix, startIndex + i, cols[i], rows);
      if (cmp) return cmp;
    }
    return 0;
  };
  var phaseColsLt = (matrix, startIndex, cols, rows) => phaseColsCompare(matrix, startIndex, cols, rows) < 0;
  var matrixCompare = (m1, m2) => {
    const inf1 = pseudoInfinity(m1), inf2 = pseudoInfinity(m2);
    if (inf1 || inf2) return inf1 === inf2 ? 0 : inf1 ? 1 : -1;
    const rows = Math.max(maxRows(m1), maxRows(m2));
    const len = Math.max(m1.length, m2.length);
    for (let c = 0; c < len; c++) {
      if (c >= m1.length) return -1;
      if (c >= m2.length) return 1;
      const cmp = colCompare(m1[c], m2[c], rows);
      if (cmp) return cmp;
    }
    return 0;
  };
  var legal = (matrix) => {
    if (pseudoInfinity(matrix)) return true;
    if (!Array.isArray(matrix)) return false;
    for (const col of matrix) {
      if (!Array.isArray(col)) return false;
      for (const v of col) if (!isNat(v)) return false;
    }
    if (matrix.length === 0) return true;
    const rows = maxRows(matrix);
    const m = standardize2(matrix, rows);
    for (let r2 = 0; r2 < rows; r2++) if (m[0][r2] !== 0) return false;
    for (let c = 0; c < m.length; c++) {
      for (let r2 = 1; r2 < rows; r2++) if (m[c][r2] > m[c][r2 - 1]) return false;
    }
    return true;
  };
  var makeCtx = (matrix, rows = maxRows(matrix)) => {
    const m = standardize2(matrix, rows);
    const cols = m.length;
    const parentCache = Array.from({ length: rows + 1 }, () => Array(cols).fill(-2));
    const ancCache = Array.from(
      { length: rows + 1 },
      () => Array(cols).fill(null)
    );
    const getBParent = (col, b) => {
      if (b < 1 || b > rows || col < 0 || col >= cols) return -1;
      const cached = parentCache[b][col];
      if (cached !== -2) return cached;
      const row = b - 1;
      const value = m[col][row];
      const ancestors = getAAncestors(col, b - 1).list;
      let best = -1;
      for (let i = 0; i < ancestors.length; i++) {
        const candidate = ancestors[i];
        if (candidate >= col) continue;
        if (m[candidate][row] < value) {
          best = candidate;
          break;
        }
      }
      parentCache[b][col] = best;
      return best;
    };
    const getAAncestors = (col, a) => {
      if (a < 0 || a > rows || col < 0 || col >= cols) return { list: [], mask: new Uint8Array(cols) };
      const cached = ancCache[a][col];
      if (cached) return cached;
      const list = [];
      const mask = new Uint8Array(cols);
      let current = col, guard = 0;
      while (current !== -1 && !mask[current] && guard++ <= cols + 2) {
        list.push(current);
        mask[current] = 1;
        current = a === 0 ? current > 0 ? current - 1 : -1 : getBParent(current, a);
      }
      return ancCache[a][col] = { list, mask };
    };
    return { m, rows, cols, getBParent, getAAncestors };
  };
  var lastNonZeroRow = (matrix) => {
    if (matrix.length === 0) return -1;
    const last = matrix[matrix.length - 1];
    for (let r2 = last.length - 1; r2 >= 0; r2--) if (last[r2] !== 0) return r2 + 1;
    return -1;
  };
  var lastAllZero = (matrix) => matrix.length === 0 || matrix[matrix.length - 1].every((v) => v === 0);
  var computeDelta = (ctx, root10, t) => {
    const alpha = ctx.cols - 1;
    const delta = Array(ctx.rows).fill(0);
    for (let r2 = 0; r2 < ctx.rows; r2++) delta[r2] = r2 >= t - 1 ? 0 : ctx.m[alpha][r2] - ctx.m[root10][r2];
    return delta;
  };
  var maxEntry = (m) => {
    let max = 0;
    for (const col of m) for (const v of col) if (v > max) max = v;
    return max;
  };
  var findRoot = (ctx) => {
    const t = lastNonZeroRow(ctx.m);
    if (t < 1) return null;
    const root10 = ctx.getBParent(ctx.cols - 1, t);
    if (root10 < 0) return null;
    return { root: root10, t };
  };
  var upmsPrepare = (matrix, rows = maxRows(matrix)) => {
    const ctx = makeCtx(matrix, rows);
    if (ctx.cols === 0) return null;
    const fr = findRoot(ctx);
    if (!fr) return null;
    const { root: root10, t } = fr;
    const alpha = ctx.cols - 1;
    const G = ctx.m.slice(0, root10).map(cloneCol);
    const B = ctx.m.slice(root10, alpha).map(cloneCol);
    const delta = computeDelta(ctx, root10, t);
    const maxTwice = maxEntry(ctx.m) * 2;
    const vr = new Int8Array(ctx.cols * Math.max(1, ctx.rows));
    vr.fill(-1);
    const vri = (c, r2) => c * Math.max(1, ctx.rows) + r2;
    const inBad = (c, r2) => c >= root10 && c < alpha && r2 < t - 1;
    const getVR = (c, r2) => inBad(c, r2) ? vr[vri(c, r2)] : -1;
    const setVR = (c, r2, val) => {
      vr[vri(c, r2)] = val;
    };
    const baseColFor = (col, k) => {
      const base = Array(ctx.rows).fill(0);
      for (let r2 = 0; r2 < ctx.rows; r2++) base[r2] = r2 <= k ? ctx.m[col][r2] : 0;
      for (let r2 = 0; r2 < k; r2++) base[r2]++;
      return base;
    };
    const buildXY = (col, k) => {
      const base = baseColFor(col, k);
      let u = -1;
      let uMissing = false;
      for (let c = col + 1; c <= alpha; c++) {
        if (colCompare(ctx.m[c], base, ctx.rows) < 0) {
          u = c;
          break;
        }
      }
      if (u < 0) {
        u = alpha + 1;
        uMissing = true;
      }
      const Ayk = ctx.m[root10][k - 1];
      const alphaAnc = ctx.getAAncestors(alpha, k).list;
      let j = -1;
      for (const c of alphaAnc) {
        if (ctx.m[c][k - 1] === Ayk + 1) {
          j = c;
          break;
        }
      }
      if (j < 0) j = alpha;
      const xStart = col, xEnd = u - 1, yStart = j, yEnd = alpha;
      const X = [], Y = [];
      for (let c = xStart; c <= xEnd; c++) {
        const out = ctx.m[c].slice();
        for (let s = 1; s <= k - 1; s++) {
          const r2 = s - 1;
          if (getVR(c, r2) === 1) out[r2] += maxTwice - ctx.m[col][r2];
        }
        X.push(out);
      }
      for (let c = yStart; c <= yEnd; c++) {
        const out = ctx.m[c].slice();
        for (let s = 1; s <= k - 1; s++) {
          const r2 = s - 1;
          if (c === j || ctx.getAAncestors(c, s).mask[j] === 1) out[r2] += maxTwice - ctx.m[j][r2];
        }
        Y.push(out);
      }
      return { X, Y, u, j, uMissing };
    };
    const matrixLexCompare = (X, Y) => {
      const len = Math.max(X.length, Y.length);
      for (let c = 0; c < len; c++) {
        const xc = c < X.length ? X[c] : Array(ctx.rows).fill(-1);
        const yc = c < Y.length ? Y[c] : Array(ctx.rows).fill(-1);
        const cmp = colCompare(xc, yc, ctx.rows);
        if (cmp) return cmp;
      }
      return 0;
    };
    for (let row = 0; row < t - 1; row++) {
      const k = row + 1;
      for (let col = root10; col < alpha; col++) {
        if (col === root10 || row === 0) {
          setVR(col, row, 1);
          continue;
        }
        const ancestors = ctx.getAAncestors(col, k);
        let has0 = false;
        for (const a of ancestors.list)
          if (getVR(a, row) === 0) {
            has0 = true;
            break;
          }
        const parent8 = ctx.getBParent(col, k);
        if (ancestors.mask[root10] !== 1 || has0 || parent8 < 0) {
          setVR(col, row, 0);
          continue;
        }
        if (parent8 !== root10) {
          setVR(col, row, 1);
          continue;
        }
        let earlier0 = false;
        for (let r2 = 0; r2 < row; r2++)
          if (getVR(col, r2) === 0) {
            earlier0 = true;
            break;
          }
        if (earlier0) {
          setVR(col, row, 0);
          continue;
        }
        let higherEscapes = false;
        for (let r2 = row + 1; r2 < t - 1; r2++)
          if (ctx.getBParent(col, r2 + 1) !== root10) {
            higherEscapes = true;
            break;
          }
        if (higherEscapes) {
          setVR(col, row, 0);
          continue;
        }
        const { X, Y, u, uMissing } = buildXY(col, k);
        if (u === alpha + 1 || uMissing) {
          setVR(col, row, 1);
          continue;
        }
        setVR(col, row, matrixLexCompare(X, Y) < 0 ? 0 : 1);
      }
    }
    const Bhs = (h) => B.map((col, local) => {
      const original = root10 + local;
      const out = Array(ctx.rows);
      for (let r2 = 0; r2 < ctx.rows; r2++)
        out[r2] = col[r2] + h * delta[r2] * (r2 < t - 1 && getVR(original, r2) === 1 ? 1 : 0);
      return out;
    });
    const B1 = Bhs(1), B2 = Bhs(2);
    return { ctx, root: root10, t, alpha, G, B, B1, B2, delta, getVR, buildXY };
  };
  var upmsSingle = (matrix, l = Infinity, rows = maxRows(matrix)) => {
    const m = standardize2(matrix, rows);
    if (m.length === 0 || lastAllZero(m)) return m.slice(0, -1).map(cloneCol);
    const prep = upmsPrepare(m, rows);
    if (!prep) return [];
    const take = Math.min(prep.B1.length, Number.isFinite(l) ? l : prep.B1.length);
    return standardize2(
      [...prep.G.map(cloneCol), ...prep.B.map(cloneCol), ...prep.B1.slice(0, take).map(cloneCol)],
      rows
    );
  };
  var bmsFS = (matrix, n, rows = maxRows(matrix)) => {
    const m = standardize2(matrix, rows);
    if (m.length === 0) return [];
    if (lastAllZero(m)) return m.slice(0, -1).map(cloneCol);
    const ctx = makeCtx(m, rows);
    const fr = findRoot(ctx);
    if (!fr) return [];
    const { root: root10, t } = fr;
    const alpha = ctx.cols - 1;
    const G = ctx.m.slice(0, root10).map(cloneCol);
    const B = ctx.m.slice(root10, alpha).map(cloneCol);
    const delta = computeDelta(ctx, root10, t);
    const ancestorContainsRoot = (col, rowLabel) => ctx.getAAncestors(col, rowLabel).mask[root10] === 1;
    const result = [...G, ...B.map(cloneCol)];
    for (let h = 1; h <= n; h++) {
      for (let local = 0; local < B.length; local++) {
        const original = root10 + local;
        const out = B[local].map(
          (v, r2) => v + h * delta[r2] * (r2 < t - 1 && ancestorContainsRoot(original, r2 + 1) ? 1 : 0)
        );
        result.push(out);
      }
    }
    return standardize2(result, rows);
  };
  var firstDifferentColumn = (X, Y, rows) => {
    const len = Math.max(X.length, Y.length);
    for (let i = 0; i < len; i++) {
      const xc = i < X.length ? X[i] : Array(rows).fill(-1);
      const yc = i < Y.length ? Y[i] : Array(rows).fill(-1);
      if (colCompare(xc, yc, rows, -1, -1) !== 0) return i + 1;
    }
    return X.length + 1;
  };
  var matricesEqual = (X, Y, rows) => firstDifferentColumn(X, Y, rows) === X.length + 1 && X.length === Y.length;
  var columnCPrime = (M, r2, n, rows) => {
    const out = Array(rows).fill(0);
    for (let i = 0; i < rows; i++) out[i] = i < n ? M[r2][i] + 1 : 0;
    return out;
  };
  var columnC = (M, t, n, rows) => {
    const out = M[t].slice();
    for (let i = 0; i < rows; i++) {
      if (i < n - 1) out[i]++;
      else if (i >= n) out[i] = 0;
    }
    return out;
  };
  var appendS = (state, prep, phase) => {
    const local = phase - prep.root;
    if (local < 0 || local >= prep.B1.length) return;
    const col = prep.B1[local].slice();
    for (let r2 = 0; r2 < state.rows; r2++) if (state.desc[phase * state.rows + r2]) col[r2]--;
    state.Mp.push(col);
  };
  var markSkipRange = (skip, from, to, alpha) => {
    for (let c = from; c <= to && c < alpha; c++) if (c >= 0) skip[c] = true;
  };
  var findMinParentRoot = (ctx, col, root10) => {
    for (let k = 1; k <= ctx.rows; k++) if (ctx.getBParent(col, k) === root10) return k;
    return ctx.rows;
  };
  var findAdjustedD = (ctx, t, d) => {
    const idx = t + d - 1;
    if (idx < 0 || idx >= ctx.cols) return d;
    const p1 = ctx.getBParent(idx, 1);
    if (p1 <= t) return d;
    const ancestors = ctx.getAAncestors(idx, 1).list;
    for (const tp of ancestors) {
      if (ctx.getBParent(tp, 1) === t) return tp + 1 - t;
    }
    return d;
  };
  var lpmsSingle = (matrix) => {
    let rows = maxRows(matrix);
    let M = standardize2(matrix, rows);
    if (M.length === 0) return [];
    if (lastAllZero(M)) return M.slice(0, -1).map(cloneCol);
    if (M.length === 2 && rows > 1 && M[0].every((x) => x === 0) && M[1].every((x) => x === 1)) {
      const nr = rows - 1;
      return [zeroCol(nr), onesCol(nr), Array(nr).fill(2), constCol(3, nr)];
    }
    const prep = upmsPrepare(M, rows);
    if (!prep) return [];
    const { ctx, root: r2, t: n, alpha } = prep;
    let Mp = [...prep.G.map(cloneCol), ...prep.B.map(cloneCol)];
    let mSwitch = true, bSwitch = true, l = 0;
    const skip = Array(ctx.cols).fill(false);
    const desc = new Uint8Array(ctx.cols * Math.max(1, rows));
    const state = { Mp, rows, desc };
    const cPrime = columnCPrime(M, r2, n, rows);
    const last2ParentIsRoot = ctx.getBParent(alpha, 2) === r2;
    const markDescent = (col, row) => {
      for (let c = 0; c < ctx.cols; c++) {
        if (ctx.getAAncestors(c, row + 1).mask[col] === 1) desc[c * rows + row] = 1;
      }
    };
    for (let t = r2; t < alpha; t++) {
      state.Mp = Mp;
      if (skip[t]) continue;
      if (bSwitch) {
        appendS(state, prep, t);
        Mp = state.Mp;
        if (n >= rows || M[r2][n] === 0 || phaseColLe(M, t + 1, cPrime, rows)) {
          bSwitch = false;
          l = t + 1 - r2;
        }
        continue;
      }
      const nMinusParent = n > 1 ? ctx.getBParent(t, n - 1) : -1;
      const nMinusVR = n > 1 ? prep.getVR(t, n - 2) : 0;
      if (nMinusParent !== r2 || nMinusVR === 0) {
        appendS(state, prep, t);
        Mp = state.Mp;
        continue;
      }
      const c = columnC(M, t, n, rows);
      if (last2ParentIsRoot) {
        if (n < rows && M[t][n] > 0) {
          appendS(state, prep, t);
          Mp = state.Mp;
          continue;
        }
        if (phaseColEq(M, t + 1, c, rows) && phaseColLe(M, t + 2, c, rows)) {
          if (t + 1 < alpha) skip[t + 1] = true;
          appendS(state, prep, t);
          Mp = state.Mp;
          continue;
        }
        const threshold2 = constCol(c[0] + 1, rows);
        if (phaseColGt(M, t + 1, c, rows) || phaseColEq(M, t + 1, c, rows) && phaseColGe(M, t + 2, threshold2, rows)) {
          appendS(state, prep, t);
          Mp = state.Mp;
          continue;
        }
        if (phaseColLt(M, t + 1, c, rows)) {
          appendS(state, prep, t);
          Mp = state.Mp;
          mSwitch = false;
          let a = M[t][0];
          if (phaseColsLt(M, t + 1, [constCol(a + 1, rows), constCol(a + 2, rows)], rows) && ctx.getBParent(t, 2) === r2)
            mSwitch = true;
          a = Mp.length ? Mp[Mp.length - 1][0] : 0;
          Mp = upmsSingle(Mp, l, rows);
          if (mSwitch) Mp.push(constCol(a + 1, rows));
          continue;
        }
      }
      let k = findMinParentRoot(ctx, t, r2);
      let kp = k === 1 ? 2 : k;
      const xy = prep.buildXY(t, kp);
      const eqXY = matricesEqual(xy.X, xy.Y, rows);
      let d = eqXY ? xy.X.length + 1 : firstDifferentColumn(xy.X, xy.Y, rows);
      if (!eqXY) {
        if (xy.uMissing && t + d - 1 >= alpha) {
          d = xy.X.length + 1;
        } else {
          d = findAdjustedD(ctx, t, d);
        }
      }
      if (d === 1) {
        appendS(state, prep, t);
        Mp = state.Mp;
        continue;
      }
      if (phaseColLt(M, t + d - 1, c, rows)) {
        markSkipRange(skip, t + 1, t + d - 2, alpha);
        mSwitch = false;
        let a = M[t][0];
        if (kp === 2 && phaseColsLt(M, t + d - 1, [constCol(a + 1, rows), constCol(a + 2, rows)], rows))
          mSwitch = true;
        if (t !== r2 + l) {
          appendS(state, prep, t);
          Mp = state.Mp;
          if (Mp.length) for (let rr = k; rr < rows; rr++) Mp[Mp.length - 1][rr] = 0;
          Mp = upmsSingle(Mp, l, rows);
        }
        a = l > 0 && Mp.length >= l ? Mp[Mp.length - l][0] : Mp.length ? Mp[Mp.length - 1][0] : 0;
        if (mSwitch) Mp.push(constCol(a + 1, rows));
        for (let rr = k - 1; rr <= n - 2 && rr < rows; rr++) markDescent(t, rr);
        continue;
      }
      if (n === 3 && phaseColEq(M, t + d - 1, c, rows) && phaseColLt(M, t + d, c, rows)) {
        markSkipRange(skip, t + 1, t + d - 1, alpha);
        appendS(state, prep, t);
        Mp = state.Mp;
        mSwitch = false;
        let a = M[t][0];
        if (phaseColsLt(M, t + d, [constCol(a + 1, rows), constCol(a + 2, rows)], rows)) mSwitch = true;
        a = Mp.length ? Mp[Mp.length - 1][0] : 0;
        Mp = upmsSingle(Mp, l, rows);
        if (mSwitch) Mp.push(constCol(a + 1, rows));
        continue;
      }
      markSkipRange(skip, t + 1, t + d - 2, alpha);
      if (n === 3 && phaseColEq(M, t + d - 1, c, rows) && phaseColEq(M, t + d, c, rows)) {
        if (t + d - 1 < alpha) skip[t + d - 1] = true;
        if (t + d < alpha) skip[t + d] = true;
      }
      if (n > 3 && phaseColEq(M, t + d - 1, c, rows) && phaseColLt(M, t + d, constCol(c[0] + 1, rows), rows)) {
        if (t + d - 1 < alpha) skip[t + d - 1] = true;
      }
      appendS(state, prep, t);
      Mp = state.Mp;
    }
    if (bSwitch) l = ctx.cols - r2 - 1;
    if (last2ParentIsRoot) {
      const take = Math.min(l, prep.B2.length);
      for (let i = 0; i < take; i++) Mp.push(prep.B2[i].slice());
      const a = prep.B2.length ? prep.B2[0][0] : Mp.length ? Mp[Mp.length - 1][0] : 0;
      Mp.push(constCol(a + 1, rows));
    } else {
      const bLen = ctx.cols - r2 - 1;
      if (l === bLen) {
        const source = Mp[ctx.cols - 1] || Mp[Mp.length - 1] || [0];
        Mp.push(constCol(source[0] + 1, rows));
      }
    }
    return standardize2(Mp, rows);
  };
  var lpmsFS = (expr, n) => {
    n = Math.max(0, Math.floor(n));
    if (pseudoInfinity(expr)) return n === 0 ? [[]] : [zeroCol(n), onesCol(n)];
    if (!legal(expr)) return [];
    const rows = maxRows(expr);
    const M = standardize2(expr, rows);
    if (M.length === 0) return [];
    if (lastAllZero(M)) return M.slice(0, -1).map(cloneCol);
    if (rows < 3 || M[M.length - 1][2] === 0) return bmsFS(M, n, rows);
    return lpmsFS(lpmsSingle(M), n);
  };
  var lpmsLimit = (expr) => pseudoInfinity(expr) || legal(expr) && !lastAllZero(standardize2(expr, maxRows(expr)));
  var lpmsInfinityFs = (n) => {
    return [zeroCol(n), onesCol(n)];
  };
  var lptssInfinityFs = (n) => {
    return Array.from({ length: n + 1 }, (_, i) => [i, i, i]);
  };
  var LPMS = {
    id: "lpms",
    name: "Lifting projection matrix system",
    simple_name: "LPMS",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display2 },
    display_equiv: {
      LP0Y: {
        plain: display_as_0Y,
        from_display: from_display_as_0Y
      },
      simple: {
        plain: display_simple,
        from_display: from_display_simple,
        name_id: "display.simple"
      }
    },
    is_limit: lpmsLimit,
    compare: matrixCompare,
    ...sequence_FS_variants0(lpmsFS, pseudoInfinity, lpmsInfinityFs, lpmsLimit, display4),
    credit_text_id: "credit.test-alpha0",
    init: () => [[[Infinity]], []],
    debug: { lpmsFS }
  };
  var LPTSS = {
    id: "lptss",
    name: "Lifting projection triple sequence system",
    simple_name: "LPTSS",
    category_id: "category-bm-like",
    display: { plain: display4, from_display: from_display2 },
    display_equiv: {
      LP0Y: {
        plain: display_as_0Y,
        from_display: from_display_as_0Y
      },
      simple: {
        plain: display_simple,
        from_display: from_display_simple,
        name_id: "display.simple"
      }
    },
    is_limit: lpmsLimit,
    compare: matrixCompare,
    ...sequence_FS_variants0(lpmsFS, pseudoInfinity, lptssInfinityFs, lpmsLimit, display4),
    credit_text_id: "credit.test-alpha0",
    init: () => [[[Infinity]], []]
  };

  // src/notations/BM-like/wMM.ts
  var vertical_cache = /* @__PURE__ */ new Map();
  var vertical_compare3 = (a, b) => {
    if (a.length > b.length) return 1;
    if (a.length < b.length) return -1;
    for (var i = a.length; i--; ) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
  };
  var vertical_increase2 = (y, d) => {
    var c = y.slice();
    c[d] === void 0 ? c[d] = 1 : c[d] += 1;
    c.fill(0, 0, d);
    return c;
  };
  var extract = (A, [x, y]) => A[x][y] || 0;
  var get_vertical = (A, [x, y]) => {
    var val;
    if (vertical_cache.has(A)) {
      val = vertical_cache.get(A);
    } else {
      val = A.map((column, x2) => {
        var result = [], i, y2 = 0;
        for (; y2 < column.length; ++y2) {
          i = y2;
          while (--i >= 0 && extract(A, [x2, y2]) === extract(A, [x2, i])) ;
          result.push(vertical_increase2(result[i] ?? [], y2 - i - 1));
        }
        return result;
      });
      vertical_cache.set(A, val);
    }
    if (val[x][y] !== void 0) return val[x][y];
    var ending = val[x].length - 1;
    return vertical_increase2(ending >= 0 ? val[x][ending] : [], y - ending - 1);
  };
  var parentCheck = (A, [x, y]) => {
    if (!y) return [x - 1, y];
    var p = parent(A, [x, y - 1])[0];
    var i = Math.max(y, A[p].length - 1);
    while (extract(A, [p, i]) < extract(A, [x, y]) - 1 || vertical_compare3(get_vertical(A, [p, i]), get_vertical(A, [x, y])) > 0) {
      --i;
    }
    return [p, i];
  };
  var parent = (A, cur) => {
    if (!extract(A, cur)) return [-1, cur[1]];
    var p = cur;
    do {
      p = parentCheck(A, p);
    } while (extract(A, p) !== extract(A, cur) - 1);
    return p;
  };
  var expand6 = (M, FSterm) => {
    var LNZx = M.length - 1;
    var LNZy = M[LNZx].findLastIndex((e) => e);
    var LNZ = M[LNZx][LNZy];
    var collection = [];
    var working = [LNZx, LNZy];
    do {
      while (extract(M, working) !== LNZ - 1) {
        working = parent(M, working);
      }
      if (!collection[working[0]]) collection[working[0]] = [];
      collection[working[0]].unshift(working[1]);
    } while (--working[1] >= 0);
    var counts = collection.filter(() => true).map((e) => e.length);
    var columns = collection.map((e, i) => i).filter(() => true);
    counts.unshift(1);
    var root10;
    var r2 = counts.length - 1;
    if (counts[r2] === 1) {
      root10 = parent(M, [LNZx, LNZy]);
    } else {
      const lastValidColumnIndex = columns[columns.length - 1];
      root10 = [lastValidColumnIndex, collection[lastValidColumnIndex][0]];
      console.assert(
        collection[lastValidColumnIndex] && collection[lastValidColumnIndex].length > 0,
        "\u672B\u5217\u6570\u636E\u5F02\u5E38",
        lastValidColumnIndex,
        collection
      );
    }
    var width = LNZx - root10[0];
    var height = LNZy - root10[1];
    var A = M.map((column) => column.slice());
    --A[LNZx][LNZy];
    M[root10[0]].slice(root10[1]).forEach((val, dy) => {
      A[LNZx][LNZy + dy] = val;
    });
    var ascending_cache = {};
    const ascendingAt = (cur) => {
      var str = "" + cur;
      if (ascending_cache[str] !== void 0) return ascending_cache[str];
      if (cur[0] < root10[0]) return ascending_cache[str] = -1;
      if (cur[0] === root10[0]) return ascending_cache[str] = cur[1];
      return ascending_cache[str] = ascendingAt(parent(A, cur));
    };
    for (var n = 1; n <= FSterm; ++n) {
      var reference = [], y1 = 0, y2 = 0, cmp;
      while (y2 <= root10[1] + height * n) {
        cmp = vertical_compare3(get_vertical(A, [root10[0], y1 + 1]), get_vertical(A, [root10[0] + width * n, y2]));
        if (cmp > 0 || y1 >= root10[1]) {
          reference[y1] = y2;
          ++y2;
          continue;
        } else {
          ++y1;
          continue;
        }
      }
      for (var dx = 1; dx <= width; ++dx) {
        var x = root10[0] + dx;
        var targetColumn = A[x + width * n] = [];
        var lastmagma = -1;
        A[x].forEach((val, y) => {
          var asc = ascendingAt([x, y]);
          if (~asc) {
            if (asc <= root10[1] && !vertical_compare3(get_vertical(A, [root10[0], asc]), get_vertical(A, [x, y]))) {
              for (var j = (reference[asc - 1] ?? -1) + 1; j <= reference[asc]; ++j) {
                targetColumn.push(val - extract(A, [root10[0], asc]) + extract(A, [root10[0] + width * n, j]));
              }
              lastmagma = asc;
            } else {
              if (~lastmagma) {
                targetColumn.push(
                  val - extract(A, [root10[0], lastmagma]) + extract(A, [root10[0] + width * n, reference[lastmagma]])
                );
              } else {
                targetColumn.push(val - extract(A, [root10[0], 0]) + extract(A, [root10[0] + width * n, 0]));
              }
            }
          } else {
            targetColumn.push(val);
          }
        });
      }
      vertical_cache.delete(A);
    }
    A.forEach((column) => {
      var i = column.findLastIndex((e) => e);
      column.splice(i + 1);
    });
    return A;
  };
  function infinity_FS11(index) {
    return [[], Array(index + 1).fill(1)];
  }
  var wMM = {
    id: "wmm",
    name: "Weak mutant matrix",
    simple_name: "wMM",
    category_id: "category-bm-like",
    display: {
      plain: display4,
      from_display: from_display2
    },
    is_limit: is_limit7,
    compare: compare10,
    ...Y_FS_variants(expand6, is_infinity11, infinity_FS11, is_limit7, display4),
    credit_text_id: "credit.wmm",
    init: function() {
      return [[[Infinity]], []];
    }
  };

  // src/notations/BM-like/DSM.ts
  function generate_limit_matrix(k) {
    const matrix = [[]];
    for (let i = 1; i <= k; i++) {
      const col = [];
      for (let j = i; j >= 1; j--) {
        col.push(j);
      }
      matrix.push(col);
    }
    return matrix;
  }
  function get_predecessor(parentsRM, r2, c) {
    if (parentsRM[r2][c] !== -1 || r2 === 0) return null;
    const upRow = r2 - 1;
    const chainCols = [];
    let currCol = parentsRM[upRow][c];
    while (currCol !== -1) {
      chainCols.push(currCol);
      currCol = parentsRM[upRow][currCol];
    }
    currCol = parentsRM[upRow][c];
    while (currCol !== -1) {
      if (parentsRM[upRow][currCol] !== -1 && parentsRM[r2][currCol] === -1) {
        return { r: r2, c: currCol };
      }
      const nextCol = parentsRM[upRow][currCol];
      if (nextCol === -1) {
        return { r: upRow, c: currCol };
      }
      currCol = nextCol;
    }
    return { r: upRow, c };
  }
  function construct_matrix_values(parentsColMajor) {
    const cols = parentsColMajor.length;
    const rows = parentsColMajor[0].length;
    const matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let c = 0; c < cols; c++) {
      for (let r2 = 0; r2 < rows; r2++) {
        const p = parentsColMajor[c][r2];
        if (p === -1) {
          matrix[c][r2] = 0;
        } else {
          matrix[c][r2] = matrix[p][r2] + 1;
        }
      }
    }
    return matrix;
  }
  function generate_expansion(parentsColMajor, badRow, badCol, times, strong) {
    const rows = parentsColMajor[0].length;
    const cols = parentsColMajor.length;
    const lastCol = cols - 1;
    let targetRow = -1;
    for (let r2 = rows - 1; r2 >= 0; r2--) {
      if (parentsColMajor[lastCol][r2] !== -1) {
        targetRow = r2;
        break;
      }
    }
    const S5 = badCol;
    const E = lastCol;
    const segmentDist = E - S5;
    let finalParentsMatrix = null;
    const parentsRM = Array.from({ length: rows }, () => Array(cols).fill(-1));
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        parentsRM[r2][c] = parentsColMajor[c][r2];
      }
    }
    if (targetRow === badRow) {
      const expandedParents_RM = Array.from({ length: rows }, () => []);
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c = 0; c < cols; c++) {
          expandedParents_RM[r2].push(parentsRM[r2][c]);
        }
      }
      for (let i = 1; i <= times; i++) {
        const shiftAmount = i * segmentDist;
        for (let c = S5; c <= E; c++) {
          const newC = c + shiftAmount;
          for (let r2 = 0; r2 < rows; r2++) {
            const originalParent = parentsRM[r2][c];
            let newParent = originalParent;
            if (c === S5 && r2 < targetRow) {
              newParent = parentsRM[r2][E] + shiftAmount - segmentDist;
            } else if (originalParent >= badCol) {
              newParent = originalParent + shiftAmount;
            }
            while (expandedParents_RM[r2].length <= newC) expandedParents_RM[r2].push(-1);
            expandedParents_RM[r2][newC] = newParent;
          }
        }
      }
      finalParentsMatrix = Array.from({ length: expandedParents_RM[0].length }, () => Array(rows).fill(-1));
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c = 0; c < expandedParents_RM[r2].length; c++) {
          finalParentsMatrix[c][r2] = expandedParents_RM[r2][c];
        }
      }
    } else {
      let resultRM = Array.from({ length: rows }, () => Array(cols).fill(-1));
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c = 0; c < cols; c++) {
          resultRM[r2][c] = parentsRM[r2][c];
        }
      }
      for (let i = 1; i <= times; i++) {
        const shiftAmount = i * segmentDist;
        for (let c = S5 + 1; c <= E; c++) {
          for (let r2 = 0; r2 < rows; r2++) {
            const originalParent = parentsRM[r2][c];
            let newParentVal = -1;
            if (!(r2 === targetRow && c === E)) {
              newParentVal = originalParent >= badCol ? originalParent + shiftAmount : originalParent;
            }
            resultRM[r2].push(newParentVal);
          }
        }
      }
      const currentCols = resultRM[0].length;
      const parentCol = parentsRM[targetRow][lastCol];
      const validCandidates = [];
      let scanNode = { r: targetRow, c: parentCol };
      while (scanNode) {
        if (scanNode.r === badRow && scanNode.c > badCol) {
          validCandidates.push(scanNode);
        }
        const pred = get_predecessor(parentsRM, scanNode.r, scanNode.c);
        if (pred === null) break;
        scanNode = pred;
      }
      const isRising = Array.from({ length: rows }, () => Array(cols).fill(false));
      const isBase = Array.from({ length: rows }, () => Array(cols).fill(false));
      isRising[badRow][badCol] = true;
      let changed = true;
      while (changed) {
        changed = false;
        for (let r2 = badRow; r2 < rows; r2++) {
          for (let c = 0; c < cols; c++) {
            if (isRising[r2][c]) continue;
            let becomeRising = false;
            if (r2 === badRow && strong) {
              const lowerParent = badRow > 0 ? parentsRM[badRow - 1][c] : c - 1;
              if (lowerParent !== -1 && isRising[r2][lowerParent]) becomeRising = true;
            }
            const p = parentsRM[r2][c];
            if (p !== -1 && isRising[r2][p]) becomeRising = true;
            if (!becomeRising && r2 > badRow) {
              const upP = parentsRM[r2 - 1][c];
              if (upP !== -1 && isRising[r2 - 1][upP]) becomeRising = true;
            }
            if (!becomeRising && r2 < rows - 1) {
              if (isRising[r2 + 1][c]) becomeRising = true;
            }
            if (becomeRising) {
              isRising[r2][c] = true;
              changed = true;
            }
          }
        }
      }
      const queueBase = [];
      for (let c = 0; c < cols; c++) {
        if (strong) {
          const lowerParent = badRow > 0 ? parentsRM[badRow - 1][c] : c - 1;
          if (lowerParent === badCol) {
            isBase[badRow][c] = true;
          }
        } else {
          if (parentsRM[badRow][c] === badCol) {
            isBase[badRow][c] = true;
          }
        }
        if (isBase[badRow][c]) {
          queueBase.push(c);
        }
      }
      while (queueBase.length > 0) {
        const currParentCol = queueBase.shift();
        for (let c = 0; c < cols; c++) {
          if (strong) {
            const lowerParent = badRow > 0 ? parentsRM[badRow - 1][c] : c - 1;
            if (lowerParent === currParentCol && !isBase[badRow][c]) {
              isBase[badRow][c] = true;
              queueBase.push(c);
            }
          } else {
            if (parentsRM[badRow][c] === currParentCol && !isBase[badRow][c]) {
              isBase[badRow][c] = true;
              queueBase.push(c);
            }
          }
        }
      }
      const R = targetRow - badRow;
      const C = lastCol - badCol;
      const finalRows = rows + R * times;
      const finalCols = currentCols;
      for (let r2 = rows; r2 < finalRows; r2++) {
        resultRM.push(Array(finalCols).fill(-1));
      }
      for (let i = 1; i <= times; i++) {
        const rowShift = R * i;
        const colShift = C * i;
        for (let r2 = 0; r2 < rows; r2++) {
          for (let c = 0; c < cols; c++) {
            if (isRising[r2][c]) {
              const newR = r2 + rowShift;
              const newC = c + colShift;
              let val = parentsRM[r2][c];
              if (val !== -1) val = val + colShift;
              resultRM[newR][newC] = val;
            }
          }
        }
        for (let c = 0; c < cols; c++) {
          if (isBase[badRow][c]) {
            const newC = c + colShift;
            let baseParent;
            if (strong) {
              baseParent = badRow > 0 ? parentsRM[badRow - 1][c] : c - 1;
            } else {
              baseParent = parentsRM[badRow][c];
            }
            const newBaseParent = baseParent !== -1 ? baseParent + colShift : -1;
            for (let k = 0; k < rowShift; k++) {
              const newR = badRow + k;
              resultRM[newR][newC] = newBaseParent;
            }
          }
        }
      }
      finalParentsMatrix = Array.from({ length: resultRM[0].length }, () => Array(resultRM.length).fill(-1));
      for (let r2 = 0; r2 < resultRM.length; r2++) {
        for (let c = 0; c < resultRM[0].length; c++) {
          finalParentsMatrix[c][r2] = resultRM[r2][c];
        }
      }
    }
    return construct_matrix_values(finalParentsMatrix);
  }
  function get_bad_item_info(matrix) {
    if (!matrix || matrix.length === 0) return null;
    const cols = matrix.length;
    const rows = Math.max(...matrix.map((c) => c.length));
    const matrixRM = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        matrixRM[r2][c] = r2 < matrix[c].length ? matrix[c][r2] : 0;
      }
    }
    const parentsRM = Array.from({ length: rows }, () => Array(cols).fill(-1));
    for (let c = 1; c < cols; c++) {
      const val = matrixRM[0][c];
      for (let k = c - 1; k >= 0; k--) {
        if (matrixRM[0][k] < val) {
          parentsRM[0][c] = k;
          break;
        }
      }
    }
    for (let r2 = 1; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        const val = matrixRM[r2][c];
        let chainIndex = c;
        while (chainIndex !== null) {
          if (chainIndex !== c && matrixRM[r2][chainIndex] < val) {
            parentsRM[r2][c] = chainIndex;
            break;
          }
          chainIndex = chainIndex !== -1 ? parentsRM[r2 - 1][chainIndex] : null;
        }
      }
    }
    let targetRow = -1;
    const targetCol = cols - 1;
    for (let r2 = rows - 1; r2 >= 0; r2--) {
      if (parentsRM[r2][targetCol] !== -1) {
        targetRow = r2;
        break;
      }
    }
    if (targetRow === -1) return null;
    const parentCol = parentsRM[targetRow][targetCol];
    if (parentCol === -1) return null;
    const candidatesPool = [];
    const options = [];
    let currItem = { r: targetRow, c: parentCol };
    candidatesPool.push(currItem);
    options.push(currItem);
    let pred = get_predecessor(parentsRM, currItem.r, currItem.c);
    while (pred !== null) {
      candidatesPool.push(pred);
      currItem = pred;
      pred = get_predecessor(parentsRM, currItem.r, currItem.c);
    }
    candidatesPool.sort((a, b) => b.c - a.c);
    let prevItemForOptions = { r: targetRow, c: targetCol };
    for (const item of candidatesPool) {
      if (item.r < prevItemForOptions.r) {
        options.push(item);
        prevItemForOptions = item;
      }
    }
    const parentsColMajor = Array.from({ length: cols }, () => Array(rows).fill(-1));
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        parentsColMajor[c][r2] = parentsRM[r2][c];
      }
    }
    const standardSeg = generate_expansion(parentsColMajor, targetRow, parentCol, 1, true);
    let badItem = null;
    let foundBadItem = false;
    for (const cand of candidatesPool) {
      const candSeg = generate_expansion(parentsColMajor, cand.r, cand.c, 1, true);
      const cmp = compare10(candSeg, standardSeg);
      if (cmp < 0) {
        const rightOptions = options.filter((opt) => opt.c > cand.c);
        if (rightOptions.length > 0) {
          rightOptions.sort((a, b) => a.c - b.c);
          badItem = rightOptions[0];
        } else {
          badItem = options[options.length - 1];
        }
        foundBadItem = true;
        break;
      }
    }
    if (!foundBadItem) {
      badItem = options[options.length - 1];
    }
    return { targetRow, parentCol, badItem, parentsColMajor };
  }
  function expand_normal(matrix, times) {
    if (!matrix || matrix.length === 0) return [];
    const cols = matrix.length;
    const isLastColZero = matrix[cols - 1].every((val) => val === 0);
    if (isLastColZero) return matrix.slice(0, cols - 1);
    const info = get_bad_item_info(matrix);
    if (!info) return [];
    const { badItem, parentsColMajor } = info;
    const fullExpandedMatrix = generate_expansion(parentsColMajor, badItem.r, badItem.c, times, false);
    fullExpandedMatrix.pop();
    return normalize2(fullExpandedMatrix);
  }
  var DSM = {
    id: "dsm",
    name: "Diagonal Sudden Matrix",
    simple_name: "DSM",
    category_id: "category-bm-like",
    display: {
      plain: display4,
      from_display: from_display2
    },
    is_limit: is_limit7,
    compare: compare10,
    ...Y_FS_variants(expand_normal, is_infinity11, generate_limit_matrix, is_limit7, display4),
    credit_text_id: "credit.dsm",
    init: () => [INFINITY10(), []]
  };

  // src/notations/BM-like/WSM.ts
  var INFINITY12 = Infinity;
  function is_infinity13(str) {
    return "" + str === "" + INFINITY12;
  }
  var WSM = class _WSM {
    constructor(parentMatrix) {
      __publicField(this, "parent");
      this.parent = parentMatrix.map((col) => [...col]);
    }
    static fromString(inputStr) {
      const { matrix } = _WSM.parse(inputStr);
      return _WSM.fromValue(matrix);
    }
    static fromValue(valueMatrix) {
      const rows = valueMatrix.length > 0 ? valueMatrix[0].length : 0;
      const cols = valueMatrix.length;
      if (rows === 0 || cols === 0) return new _WSM([]);
      const parent8 = Array.from({ length: cols }, () => Array(rows).fill(-1));
      const virtualParent = Array(cols).fill(-1);
      for (let c = 1; c < cols; c++) virtualParent[c] = c - 1;
      const getAncestors = (col, row, parentMat) => {
        const ancestors = [];
        let p = parentMat[col][row];
        while (p !== -1) {
          ancestors.push(p);
          p = parentMat[p][row];
        }
        return ancestors;
      };
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c = 0; c < cols; c++) {
          let belowAncestors = [];
          if (r2 === 0) {
            let p = virtualParent[c];
            while (p !== -1) {
              belowAncestors.push(p);
              p = virtualParent[p];
            }
          } else {
            belowAncestors = getAncestors(c, r2 - 1, parent8);
          }
          const curVal = valueMatrix[c][r2];
          let best = -1;
          for (const anc of belowAncestors) {
            if (valueMatrix[anc][r2] < curVal) {
              best = anc;
              break;
            }
          }
          parent8[c][r2] = best;
        }
      }
      return new _WSM(parent8);
    }
    static fromWorm(worm) {
      const n = worm.length;
      if (n === 0) return new _WSM([]);
      const aux = [worm.slice()];
      const parentRows = [];
      const row0 = [];
      for (let c = 0; c < n; c++) {
        let best = -1;
        for (let p = c - 1; p >= 0; p--) {
          if (aux[0][p] < aux[0][c]) {
            best = p;
            break;
          }
        }
        row0.push(best);
      }
      parentRows.push(row0);
      let i = 0;
      while (true) {
        const auxNext = [];
        const row = parentRows[i];
        for (let c = 0; c < n; c++) {
          if (row[c] !== -1) {
            auxNext.push(aux[i][c] - aux[i][row[c]]);
          } else {
            auxNext.push(1);
          }
        }
        aux.push(auxNext);
        if (auxNext.every((v) => v === 1)) {
          break;
        }
        const nextRow = [];
        for (let c = 0; c < n; c++) {
          let ancestors = [];
          let p = parentRows[i][c];
          while (p !== -1) {
            ancestors.push(p);
            p = parentRows[i][p];
          }
          let maxCol = -1;
          for (const anc of ancestors) {
            if (aux[i + 1][anc] < aux[i + 1][c]) {
              if (anc > maxCol) maxCol = anc;
            }
          }
          nextRow.push(maxCol);
        }
        parentRows.push(nextRow);
        i++;
      }
      const parentCols = Array.from({ length: n }, (_, c) => parentRows.map((row) => row[c]));
      return new _WSM(parentCols);
    }
    static parse(inputStr) {
      const colRegex = /\(([^)]*)\)/g;
      let match;
      const columns = [];
      while ((match = colRegex.exec(inputStr)) !== null) {
        const content = match[1];
        if (content.trim() === "") {
          columns.push([0]);
        } else {
          const nums = content.split(",").map((n) => parseInt(n.trim(), 10));
          if (nums.some(isNaN)) {
            columns.push([0]);
          } else {
            columns.push(nums);
          }
        }
      }
      let maxRows2 = 0;
      for (const col of columns) {
        if (col.length > maxRows2) maxRows2 = col.length;
      }
      for (const col of columns) {
        while (col.length < maxRows2) col.push(0);
      }
      return { matrix: columns, rows: maxRows2, cols: columns.length };
    }
    static format(matrix) {
      if (!matrix || matrix.length === 0) return "";
      return matrix.map((col) => {
        let trimmed = [...col];
        while (trimmed.length > 1 && trimmed[trimmed.length - 1] === 0) {
          trimmed.pop();
        }
        return "(" + trimmed.join(",") + ")";
      }).join("");
    }
    static clone(matrix) {
      return matrix.map((col) => [...col]);
    }
    static getGenerationColumn(colIdx, lnzRow, parentMat, lastColIdx) {
      return parentMat[lastColIdx].map((v, r2) => {
        if (r2 >= lnzRow) {
          return parentMat[colIdx][r2];
        }
        return v;
      });
    }
    static copyColumns(parentMat, refCol, start, end, shiftAmount) {
      const result = [];
      for (let c = start; c <= end; c++) {
        const newCol = [];
        for (let r2 = 0; r2 < parentMat[c].length; r2++) {
          const p = parentMat[c][r2];
          if (p === -1) {
            newCol.push(-1);
          } else {
            newCol.push(p < refCol ? p : p + shiftAmount);
          }
        }
        result.push(newCol);
      }
      return result;
    }
    getAncestorsAt(col, row) {
      const ancestors = [];
      let p = this.parent[col][row];
      while (p !== -1) {
        ancestors.push(p);
        p = this.parent[p][row];
      }
      return ancestors;
    }
    trialExpand(refCol, lnzRowVal, lastColIdx, genColToUse) {
      const newMat = _WSM.clone(this.parent);
      if (refCol + 1 <= lastColIdx) {
        const shiftAmount = lastColIdx - refCol;
        const copied = _WSM.copyColumns(this.parent, refCol, refCol + 1, lastColIdx, shiftAmount);
        for (const col of copied) {
          newMat.push(col);
        }
      }
      for (let r2 = 0; r2 < newMat[lastColIdx].length; r2++) {
        if (r2 >= lnzRowVal) {
          newMat[lastColIdx][r2] = genColToUse[r2];
        }
      }
      return newMat;
    }
    static compareParentMatrices(matA, matB) {
      const maxCols = Math.max(matA.length, matB.length);
      const maxRows2 = Math.max(matA.length > 0 ? matA[0].length : 0, matB.length > 0 ? matB[0].length : 0);
      for (let c = 0; c < maxCols; c++) {
        const colA = c < matA.length ? matA[c] : [];
        const colB = c < matB.length ? matB[c] : [];
        const maxR = Math.max(colA.length, colB.length);
        for (let r2 = 0; r2 < maxR; r2++) {
          const pA = r2 < colA.length ? colA[r2] : -1;
          const pB = r2 < colB.length ? colB[r2] : -1;
          if (pA !== pB) {
            if (pA === -1) return -1;
            if (pB === -1) return 1;
            return pA - pB;
          }
        }
      }
      return matA.length - matB.length;
    }
    expand(times) {
      const parent8 = this.parent;
      const cols = parent8.length;
      if (cols === 0) {
        return {
          wsm: new _WSM([]),
          badRoot: -1,
          candidateRoots: [],
          trialResults: {},
          originalRoot: -1,
          lnzRow: -1,
          lastCol: -1,
          genCol: [],
          smallerRoots: [],
          pendingRoots: []
        };
      }
      const rows = parent8[0].length;
      const lastCol = cols - 1;
      let lnzRow = -1;
      for (let r2 = rows - 1; r2 >= 0; r2--) {
        if (parent8[lastCol][r2] !== -1) {
          lnzRow = r2;
          break;
        }
      }
      if (lnzRow === -1) {
        const newParent2 = parent8.slice(0, -1);
        return {
          wsm: new _WSM(newParent2),
          badRoot: -1,
          candidateRoots: [],
          trialResults: {},
          originalRoot: -1,
          lnzRow: -1,
          lastCol,
          genCol: [],
          smallerRoots: [],
          pendingRoots: []
        };
      }
      const originalRoot = parent8[lastCol][lnzRow];
      if (originalRoot === -1) {
        return {
          wsm: new _WSM(parent8),
          badRoot: -1,
          candidateRoots: [],
          trialResults: {},
          originalRoot: -1,
          lnzRow,
          lastCol,
          genCol: [],
          smallerRoots: [],
          pendingRoots: []
        };
      }
      let origElemRow = -1;
      for (let r2 = rows - 1; r2 >= 0; r2--) {
        if (parent8[originalRoot][r2] !== -1) {
          origElemRow = r2;
          break;
        }
      }
      if (origElemRow === -1 || origElemRow < lnzRow) {
        origElemRow = lnzRow;
      }
      const genCol = _WSM.getGenerationColumn(originalRoot, lnzRow, parent8, lastCol);
      const origRootTrial = this.trialExpand(originalRoot, lnzRow, lastCol, genCol);
      let candidateRoots = [];
      let pendingRoots = [];
      let trialResults = {};
      let smallerRoots = [];
      let smallRoot = -1;
      let badRoot = originalRoot;
      pendingRoots = [originalRoot];
      let p = parent8[originalRoot][origElemRow];
      while (p !== -1) {
        pendingRoots.push(p);
        p = parent8[p][origElemRow];
      }
      let cond1Cols = [];
      if (lnzRow > 0) {
        cond1Cols = this.getAncestorsAt(lastCol, lnzRow - 1);
      } else {
        let temp = lastCol;
        const vp = Array(cols).fill(-1);
        for (let c = 1; c < cols; c++) vp[c] = c - 1;
        while (temp !== -1) {
          cond1Cols.push(temp);
          temp = vp[temp];
        }
        cond1Cols = cond1Cols.filter((c) => c !== lastCol);
      }
      const ancestorsSet = /* @__PURE__ */ new Set();
      let q = parent8[originalRoot][origElemRow];
      while (q !== -1) {
        ancestorsSet.add(q);
        q = parent8[q][origElemRow];
      }
      const cond2Cols = /* @__PURE__ */ new Set();
      for (const anc of ancestorsSet) {
        cond2Cols.add(anc);
        for (let c = 0; c < cols; c++) {
          if (parent8[c][origElemRow] === anc) {
            cond2Cols.add(c);
          }
        }
      }
      const cond3Cols = [];
      for (let c = 0; c < cols; c++) {
        if (c === lastCol) continue;
        const genColC = _WSM.getGenerationColumn(c, lnzRow, parent8, lastCol);
        let contains = true;
        for (let r2 = 0; r2 < rows; r2++) {
          const a = genColC[r2];
          const b = genCol[r2];
          if (a === -1) continue;
          if (a === b) continue;
          let isAncestor2 = false;
          let pp = b;
          while (pp !== -1) {
            pp = parent8[pp][r2];
            if (pp === a) {
              isAncestor2 = true;
              break;
            }
          }
          if (!isAncestor2) {
            contains = false;
            break;
          }
        }
        if (contains) cond3Cols.push(c);
      }
      const set1 = new Set(cond1Cols);
      const set2 = cond2Cols;
      const set3 = new Set(cond3Cols);
      for (const c of set1) {
        if (set2.has(c) && set3.has(c)) {
          candidateRoots.push(c);
        }
      }
      candidateRoots.sort((a, b) => a - b);
      if (!candidateRoots.includes(originalRoot)) {
        candidateRoots.push(originalRoot);
        candidateRoots.sort((a, b) => a - b);
      }
      pendingRoots = pendingRoots.filter((root10) => candidateRoots.includes(root10));
      trialResults[originalRoot] = origRootTrial;
      for (const cr of candidateRoots) {
        if (cr === originalRoot) continue;
        trialResults[cr] = this.trialExpand(cr, lnzRow, lastCol, genCol);
        const cmp = _WSM.compareParentMatrices(trialResults[cr], origRootTrial);
        if (cmp < 0) {
          smallerRoots.push(cr);
        }
      }
      const sortedCandidates = [...candidateRoots].sort((a, b) => a - b);
      for (let i = sortedCandidates.length - 1; i >= 0; i--) {
        const cr = sortedCandidates[i];
        if (cr === originalRoot) continue;
        const cmp = _WSM.compareParentMatrices(trialResults[cr], origRootTrial);
        if (cmp < 0) {
          smallRoot = cr;
          break;
        }
      }
      if (smallRoot !== -1) {
        let minRight = Infinity;
        for (const pr of pendingRoots) {
          if (pr > smallRoot && pr < minRight) {
            minRight = pr;
          }
        }
        if (minRight !== Infinity) {
          badRoot = minRight;
        } else {
          badRoot = pendingRoots.length > 0 ? Math.min(...pendingRoots) : -1;
        }
      } else {
        badRoot = pendingRoots.length > 0 ? Math.min(...pendingRoots) : -1;
      }
      if (badRoot === -1) {
        badRoot = originalRoot;
      }
      let newParent = _WSM.clone(parent8);
      for (let r2 = 0; r2 < newParent[lastCol].length; r2++) {
        if (r2 >= lnzRow) {
          newParent[lastCol][r2] = genCol[r2];
        }
      }
      if (badRoot + 1 <= lastCol) {
        const copyWidth = lastCol - badRoot;
        for (let k = 1; k <= times; k++) {
          const shiftAmount = k * copyWidth;
          const copied = _WSM.copyColumns(newParent, badRoot, badRoot + 1, lastCol, shiftAmount);
          for (const col of copied) {
            newParent.push(col);
          }
        }
      }
      newParent.pop();
      return {
        wsm: new _WSM(newParent),
        badRoot,
        candidateRoots,
        trialResults,
        originalRoot,
        lnzRow,
        lastCol,
        genCol,
        smallerRoots,
        pendingRoots
      };
    }
    format() {
      const value = this.toValue();
      return _WSM.format(value);
    }
    toValue() {
      const parentMat = this.parent;
      const valueMat = _WSM.clone(parentMat);
      for (let c = 0; c < parentMat.length; c++) {
        for (let r2 = 0; r2 < parentMat[c].length; r2++) {
          const p = parentMat[c][r2];
          if (p === -1) {
            valueMat[c][r2] = 0;
          } else {
            valueMat[c][r2] = valueMat[p][r2] + 1;
          }
        }
      }
      return valueMat;
    }
    toWorm() {
      const parent8 = this.parent;
      const cols = parent8.length;
      if (cols === 0) return [];
      const rows = parent8[0].length;
      const val = Array.from({ length: cols }, () => Array(rows).fill(0));
      const rTop = rows - 1;
      for (let c = 0; c < cols; c++) {
        const p = parent8[c][rTop];
        if (p === -1) {
          val[c][rTop] = 1;
        } else {
          val[c][rTop] = val[p][rTop] + 1;
        }
      }
      for (let r2 = rows - 2; r2 >= 0; r2--) {
        for (let c = 0; c < cols; c++) {
          const p = parent8[c][r2];
          if (p === -1) {
            val[c][r2] = 1;
          } else {
            val[c][r2] = val[p][r2] + val[c][r2 + 1];
          }
        }
      }
      const worm = [];
      for (let c = 0; c < cols; c++) {
        worm.push(val[c][0]);
      }
      return worm;
    }
  };
  var WSMv1_4_1 = {
    id: "WSMv1.4.1",
    name: "WSM v1.4.1",
    simple_name: "WSM",
    category_id: "category-bm-like",
    display: {
      plain: (a) => is_infinity13(a) ? "Limit" : a,
      html: (a) => is_infinity13(a) ? "Limit" : a,
      latex: (a) => is_infinity13(a) ? "\\text{Limit}" : a,
      from_display: (str) => str === "Limit" ? INFINITY12 : str
    },
    display_equiv: {
      worm: {
        plain: (a) => {
          if (is_infinity13(a)) return "Limit";
          const wsm = WSM.fromString(a);
          return wsm.toWorm().join(",");
        },
        html: (a) => {
          if (is_infinity13(a)) return "Limit";
          const wsm = WSM.fromString(a);
          return wsm.toWorm().join(",");
        }
      }
    },
    is_limit: (a) => {
      if (is_infinity13(a)) return true;
      try {
        const wsm = WSM.fromString(a);
        const parent8 = wsm.parent;
        if (parent8.length === 0) return false;
        const lastCol = parent8.length - 1;
        for (let r2 = 0; r2 < parent8[lastCol].length; r2++) {
          if (parent8[lastCol][r2] !== -1) return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    compare: (a, b) => {
      if (is_infinity13(a) && is_infinity13(b)) return 0;
      if (is_infinity13(a)) return 1;
      if (is_infinity13(b)) return -1;
      try {
        const wsmA = WSM.fromString(a);
        const wsmB = WSM.fromString(b);
        return WSM.compareParentMatrices(wsmA.parent, wsmB.parent);
      } catch {
        return 0;
      }
    },
    FS: (a, i) => {
      if (is_infinity13(a)) {
        if (i === 0) return "";
        const parent8 = [];
        const col0 = Array(i).fill(-1);
        const col1 = Array(i).fill(0);
        parent8.push(col0);
        parent8.push(col1);
        const wsm = new WSM(parent8);
        return wsm.format();
      }
      try {
        const wsm = WSM.fromString(a);
        if (i === 0) {
          const newParent = wsm.parent.slice(0, -1);
          const newWsm = new WSM(newParent);
          return newWsm.format();
        }
        const result = wsm.expand(i);
        return result.wsm.format();
      } catch {
        return "";
      }
    },
    init: () => [INFINITY12, ""],
    credit_text_id: "credit.dsm"
  };

  // src/notations/BM-like/BTBM.ts
  var INFINITY13 = Symbol("infinity");
  var INFINITY_height = INFINITY13;
  function is_infinity14(e) {
    return e === INFINITY13;
  }
  function infinity_FS12(index) {
    if (index === 0) return [[]];
    let col = [{ value: index - 1, height: [] }];
    for (let i = index - 1; i > 0; i--) {
      col = [{ value: i - 1, height: [col] }];
    }
    return [[], col];
  }
  function to_height(e, r2) {
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const result_col = [];
      for (const entry of col) {
        const p = entry.value;
        let mark4, value;
        if (p < r2) {
          [mark4, value] = [false, p];
        } else {
          [mark4, value] = [true, p - r2];
        }
        result_col.push({
          mark: mark4,
          value,
          height: to_height(entry.height, r2)
        });
      }
      result.push(result_col);
    }
    return result;
  }
  function from_height(h, r2) {
    const result = [];
    for (let i = 0; i < h.length; i++) {
      const col = h[i];
      const result_col = [];
      for (const entry of col) {
        const { mark: mark4, value } = entry;
        result_col.push({
          value: value + (mark4 ? r2 : 0),
          height: from_height(entry.height, r2)
        });
      }
      result.push(result_col);
    }
    return result;
  }
  function height_compare(a, b) {
    if (is_infinity14(a) || is_infinity14(b)) return boolean_compare(is_infinity14(a), is_infinity14(b));
    return lex_compare(a, b, lex_compare_by(height_entry_comparator));
  }
  var height_entry_comparator = object_lex_compare_by(
    { mark: boolean_compare, value: number_compare, height: height_compare },
    ["mark", "value", "height"]
  );
  function has_next_layer(expr) {
    const right = expr.length - 1;
    if (right === -1) return false;
    const top = expr[right].length - 1;
    return top !== -1;
  }
  function next_layer(expr) {
    const right = expr.length - 1;
    const top = expr[right].length - 1;
    return expr[right][top].height;
  }
  function skip_layers(expr, l) {
    for (let i = 0; i < l; i++) expr = next_layer(expr);
    return expr;
  }
  function tail_layer(expr) {
    if (!has_next_layer(expr)) return -1;
    return 1 + tail_layer(next_layer(expr));
  }
  function tail(expr, t_layer) {
    let current_left = 0;
    let current = expr;
    for (let i = 0; i < t_layer; i++) {
      current_left += current.length;
      current = next_layer(current);
    }
    return current_left + current.length - 1;
  }
  function root3(expr, t_layer) {
    const current = skip_layers(expr, t_layer);
    return current[current.length - 1][current[current.length - 1].length - 1].value;
  }
  function root_layer(expr, r2) {
    let current = expr;
    let current_left = 0;
    let current_layer = 0;
    while (true) {
      if (r2 < current_left + current.length) {
        return [current_layer, r2 - current_left];
      }
      current_left += current.length;
      current = next_layer(current);
      current_layer++;
    }
  }
  function ascend_replace(expr, r2, diff, t_layer, new_tail) {
    let result = [];
    for (let i = 0; i < expr.length; i++) {
      if (t_layer === 0 && i === expr.length - 1) {
        result.push(...new_tail);
      } else {
        const col = expr[i];
        let result_col = [];
        for (let j = 0; j < col.length; j++) {
          const entry = col[j];
          const new_t_layer = t_layer !== void 0 && i === expr.length - 1 && j === col.length - 1 ? t_layer - 1 : void 0;
          result_col.push({
            value: entry.value >= r2 ? entry.value + diff : entry.value,
            height: ascend_replace(entry.height, r2, diff, new_t_layer, new_tail)
          });
        }
        result.push(result_col);
      }
    }
    return result;
  }
  function is_special(expr, t_layer) {
    if (t_layer === 0) return false;
    let current = expr;
    let current_left = 0;
    for (let i = 0; i < t_layer; i++) {
      current_left += current.length;
      current = next_layer(current);
    }
    if (current[current.length - 1].length !== 1) return false;
    const entry = current[current.length - 1][0];
    return entry.height.length === 0 && entry.value === current_left - 1;
  }
  function expand_special(expr, t_layer, index) {
    let result = expr.slice(0, -1);
    let col = expr[expr.length - 1];
    let result_col = col.slice(0, -1);
    let entry = col[col.length - 1];
    if (t_layer > 1) {
      let new_entry = {
        value: entry.value,
        height: expand_special(entry.height, t_layer - 1, index)
      };
      result_col.push(new_entry);
    } else {
      let new_entry = {
        value: entry.value,
        height: entry.height.slice(0, -1)
      };
      result_col.push(...Array(index).fill(new_entry));
    }
    result.push(result_col);
    return result;
  }
  function root_appending_start(col_root, r2, col_tail, t) {
    let heights_root = col_root.map(({ height }) => to_height(height, r2));
    let heights_tail = col_tail.slice(0, -1).map(({ height }) => to_height(height, t));
    let ir = 0, it3 = 0;
    while (ir !== heights_root.length && it3 !== heights_tail.length) {
      const cmp = height_compare(heights_root[ir], heights_tail[it3]);
      if (cmp >= 0) it3++;
      if (cmp <= 0) ir++;
    }
    return ir;
  }
  function is_limit8(expr) {
    return is_infinity14(expr) || expr.length > 0 && expr[expr.length - 1].length > 0;
  }
  function FS9(expr, index) {
    if (is_infinity14(expr)) return infinity_FS12(index);
    if (expr.length === 0) return expr;
    const t_layer = tail_layer(expr);
    if (t_layer < 0) return expr.slice(0, -1);
    if (is_special(expr, t_layer)) {
      return expand_special(expr, t_layer, index);
    }
    const t = tail(expr, t_layer);
    const r2 = root3(expr, t_layer);
    const [r_layer, ri] = root_layer(expr, r2);
    const expr_root = skip_layers(expr, r_layer);
    const col_root = expr_root[ri];
    const expr_tail = skip_layers(expr_root, t_layer - r_layer);
    const col_tail = expr_tail[expr_tail.length - 1];
    const appending = root_appending_start(col_root, r2, col_tail, t);
    let new_tail = [];
    for (let j = index; j >= 1; j--) {
      if (ri !== expr_root.length - 1) {
        let new_tail_1 = ascend_replace(expr_root.slice(ri + 1), r2, j * (t - r2), t_layer - r_layer, new_tail);
        let new_col = ascend_replace([col_tail.slice(0, -1)], r2, (j - 1) * (t - r2), void 0, [])[0];
        for (let k = appending; k < col_root.length; k++) {
          new_col.push({
            value: col_root[k].value,
            height: ascend_replace(col_root[k].height, r2, j * (t - r2), void 0, [])
          });
        }
        new_tail = [new_col, ...new_tail_1];
      } else {
        if (appending === col_root.length) throw new Error("Illegal state");
        let new_col = ascend_replace([col_tail.slice(0, -1)], r2, (j - 1) * (t - r2), void 0, [])[0];
        for (let k = appending; k < col_root.length; k++) {
          new_col.push({
            value: col_root[k].value,
            height: ascend_replace(
              col_root[k].height,
              r2,
              j * (t - r2),
              k === col_root.length - 1 ? t_layer - r_layer - 1 : void 0,
              new_tail
            )
          });
        }
        new_tail = [new_col];
      }
    }
    return ascend_replace(expr, 0, 0, t_layer, new_tail);
  }
  function display6(expr, html) {
    if (is_infinity14(expr)) return "Limit";
    return expr.map(bind2(display_column, html)).join("");
  }
  function display_column(col, html) {
    if (col.length === 0) return "(0)";
    return "(" + col.map(bind2(display_entry, html)).join(",") + ")";
  }
  function display_marked(expr, type, start_index = 1) {
    if (is_infinity14(expr)) return "Limit";
    let idx = start_index;
    const parts = [];
    for (const col of expr) {
      parts.push(display_column_marked(col, type, idx));
      idx++;
    }
    return parts.join("");
  }
  function display_column_marked(col, type, index) {
    if (col.length === 0) {
      if (type === "plain") return "(:" + index + ")";
      if (type === "html") return "(0)<sub><span style='color:#888'>" + index + "</span></sub>";
      return "(0)_{\\color{gray}" + index + "}";
    }
    const content = col.map((e) => display_entry_marked(e, type, index)).join(",");
    if (type === "plain") return "(" + content + ":" + index + ")";
    if (type === "html") return "(" + content + ")<sub><span style='color:#888'>" + index + "</span></sub>";
    return "(" + content + ")_{\\color{gray}" + index + "}";
  }
  function display_entry_marked(entry, type, col_index) {
    const v_display = "" + (entry.value + 1);
    if (entry.height.length === 0) return v_display;
    const h_display = display_marked(entry.height, type, col_index + 1);
    if (type === "html") return v_display + "<sup>" + h_display + "</sup>";
    if (type === "latex") return v_display + "^{" + h_display + "}";
    return v_display + "^" + h_display;
  }
  function display_entry(entry, html) {
    const v_display = "" + (entry.value + 1);
    if (entry.height.length === 0) return v_display;
    const h_display = display6(entry.height, html);
    return html ? v_display + "<sup>" + h_display + "</sup>" : v_display + "^" + h_display;
  }
  function from_display6(s) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function skip_index() {
      if (i < s.length && s[i] === ":") {
        i++;
        skip_spaces();
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      }
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const entries = [];
      skip_spaces();
      if (i < s.length && s[i] !== ")" && s[i] !== ":") {
        entries.push(parse_entry());
        skip_spaces();
        while (i < s.length && s[i] === ",") {
          i++;
          skip_spaces();
          if (i < s.length && s[i] === ")") break;
          entries.push(parse_entry());
          skip_spaces();
        }
      }
      skip_spaces();
      skip_index();
      skip_spaces();
      if (i >= s.length || s[i] !== ")") error();
      i++;
      while (entries.length > 0 && entries[entries.length - 1].value === -1) entries.pop();
      return entries;
    }
    function parse_entry() {
      const v = parse_number() - 1;
      skip_spaces();
      if (i < s.length && s[i] === "^") {
        i++;
        return { value: v, height: parse_expr() };
      }
      return { value: v, height: [] };
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY13;
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function compare12(a, b) {
    return lex_compare(a, b, lex_compare_by(entry_comparator));
  }
  var entry_comparator = object_lex_compare_by(
    {
      value: number_compare,
      height: compare12
    },
    ["value", "height"]
  );
  function vertical_increase3(vert, h_diff) {
    const result = [...vert];
    while (result.length > 0 && height_compare(result[result.length - 1], h_diff) < 0) {
      result.pop();
    }
    result.push(h_diff);
    return result;
  }
  function convert_to_layer(e, parsed_stack = []) {
    if (is_infinity14(e)) return e;
    const lS = parsed_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const iS = parsed_stack.length;
      const col = e[i];
      const parsed_col = [];
      let current_vertical = [];
      for (let j = 0; j < col.length; j++) {
        const entry = col[j];
        const parent8 = entry.value;
        const height = to_height(entry.height, iS);
        let kp = 0, ki = 0;
        while (kp !== parsed_stack[parent8].length && ki !== current_vertical.length) {
          const cmp = height_compare(parsed_stack[parent8][kp].height, current_vertical[ki]);
          if (cmp <= 0) kp++;
          if (cmp >= 0) ki++;
        }
        if (kp === parsed_stack[parent8].length) {
          parsed_col.push({ value: 0, parent: parent8, height });
        } else {
          while (kp <= parsed_stack[parent8].length) {
            if (kp === parsed_stack[parent8].length) {
              parsed_col.push({ value: 0, parent: parent8, height });
              break;
            }
            const cmp = height_compare(parsed_stack[parent8][kp].height, height);
            if (cmp < 0) {
              parsed_col.push({
                value: parsed_stack[parent8][kp].value + 1,
                parent: parent8,
                height: parsed_stack[parent8][kp].height
              });
            } else {
              parsed_col.push({ value: parsed_stack[parent8][kp].value + 1, parent: parent8, height });
              break;
            }
            kp++;
          }
        }
        current_vertical = vertical_increase3(current_vertical, height);
      }
      parsed_stack.push(parsed_col);
      const result_col = [];
      for (let parsed_entry of parsed_col) {
        const height_expr = from_height(parsed_entry.height, iS);
        result_col.push({
          value: parsed_entry.value,
          height: convert_to_layer(height_expr, parsed_stack)
        });
      }
      result.push(result_col);
    }
    parsed_stack.splice(lS);
    return result;
  }
  function parent_info(parsed, vertical) {
    let ip = 0, iv = 0;
    let lower_parent = void 0;
    while (ip !== parsed.length && iv !== vertical.length) {
      const cmp = height_compare(parsed[ip].height, vertical[iv]);
      if (cmp >= 0) {
        lower_parent = parsed[ip].parent;
        iv++;
      }
      if (cmp <= 0) ip++;
    }
    return { lower_parent, higher_value: parsed[ip]?.value ?? -1 };
  }
  function convert_from_layer(e, parsed_stack = []) {
    if (is_infinity14(e)) return e;
    const lS = parsed_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const iS = parsed_stack.length;
      const col = e[i];
      const parsed_col = [];
      parsed_stack.push(parsed_col);
      const result_col = [];
      let current_vertical = [];
      for (let j = 0; j < col.length; j++) {
        const entry = col[j];
        let parent8 = j === 0 ? iS - 1 : parsed_col[j - 1].parent;
        while (parent8 >= 0) {
          let { lower_parent, higher_value } = parent_info(parsed_stack[parent8], current_vertical);
          if (higher_value < entry.value) break;
          parent8 = lower_parent ?? parent8 - 1;
        }
        parsed_col.push({
          value: entry.value,
          parent: parent8,
          height: INFINITY_height
        });
        const height_expr = convert_from_layer(entry.height, parsed_stack);
        const height = to_height(height_expr, iS);
        parsed_col[j].height = height;
        while (result_col.length > 0) {
          const top = result_col[result_col.length - 1];
          if (top.value === parent8 && compare12(top.height, height_expr) < 0) {
            result_col.pop();
          } else {
            break;
          }
        }
        result_col.push({ value: parent8, height: height_expr });
        current_vertical = vertical_increase3(current_vertical, height);
      }
      result.push(result_col);
    }
    parsed_stack.splice(lS);
    return result;
  }
  var BTBM = {
    id: "btbm",
    name: "Branching Transfinite BMS",
    simple_name: "BTBMS",
    category_id: "category-bm-like",
    display: {
      plain: bind2(display6, false),
      html: bind2(display6, true),
      from_display: from_display6,
      name_id: "display.index"
    },
    display_equiv: {
      layer: {
        plain: (e) => display6(convert_to_layer(e), false),
        html: (e) => display6(convert_to_layer(e), true),
        from_display: (str) => convert_from_layer(from_display6(str)),
        name_id: "display.layer"
      },
      marked: {
        plain: (e) => display_marked(e, "plain"),
        html: (e) => display_marked(e, "html"),
        latex: (e) => display_marked(e, "latex"),
        from_display: from_display6,
        name_id: "display.index-marked"
      }
    },
    is_limit: is_limit8,
    compare: compare12,
    FS: FS9,
    init: () => [INFINITY13, []],
    credit_text_id: "credit.btbm"
  };

  // src/notations/BM-like/GMS.ts
  function bmsIsInfinity(a) {
    return String(a) === String(Infinity);
  }
  function bmsValue(col, row) {
    const value = col && col[row];
    return value === void 0 ? 0 : value;
  }
  function bmsRowCount(a) {
    let n = 1;
    for (const col of a) n = Math.max(n, col.length);
    return n;
  }
  function bmsCloneMatrix(a, rows) {
    const n = rows === void 0 ? bmsRowCount(a) : rows;
    return a.map((col) => {
      const out = new Array(n);
      for (let r2 = 0; r2 < n; r2++) out[r2] = bmsValue(col, r2);
      return out;
    });
  }
  function bmsZeroColumn(n) {
    return new Array(n).fill(0);
  }
  function bmsIsZeroColumn(col, n) {
    const rows = n === void 0 ? Math.max(1, col.length) : n;
    for (let r2 = 0; r2 < rows; r2++) {
      if (bmsValue(col, r2) !== 0) return false;
    }
    return true;
  }
  function bmsAddColumns(a, b, n) {
    const out = new Array(n);
    for (let r2 = 0; r2 < n; r2++) out[r2] = bmsValue(a, r2) + bmsValue(b, r2);
    return out;
  }
  function bmsAddMatrices(a, b, n) {
    if (a.length !== b.length) {
      throw new Error("BMS: \u53EA\u80FD\u5BF9\u540C\u5F62\u77E9\u9635\u505A\u52A0\u6CD5");
    }
    const out = new Array(a.length);
    for (let c = 0; c < a.length; c++) out[c] = bmsAddColumns(a[c], b[c], n);
    return out;
  }
  function bmsScaleMatrix(a, scalar, n) {
    return a.map((col) => {
      const out = new Array(n);
      for (let r2 = 0; r2 < n; r2++) out[r2] = bmsValue(col, r2) * scalar;
      return out;
    });
  }
  function bmsColumnCompare(a, b, rows) {
    const n = rows === void 0 ? Math.max(a.length, b.length, 1) : rows;
    for (let r2 = 0; r2 < n; r2++) {
      const av = bmsValue(a, r2);
      const bv = bmsValue(b, r2);
      if (av !== bv) return av < bv ? -1 : 1;
    }
    return 0;
  }
  function bmsMatrixCompare(a, b) {
    const rows = Math.max(bmsRowCount(a), bmsRowCount(b));
    const common = Math.min(a.length, b.length);
    for (let c = 0; c < common; c++) {
      const cmp = bmsColumnCompare(a[c], b[c], rows);
      if (cmp !== 0) return cmp;
    }
    if (a.length === b.length) return 0;
    return a.length < b.length ? -1 : 1;
  }
  function bmsSuffixCompare(a, b, startRow, rows) {
    for (let r2 = startRow; r2 < rows; r2++) {
      const av = bmsValue(a, r2);
      const bv = bmsValue(b, r2);
      if (av !== bv) return av < bv ? -1 : 1;
    }
    return 0;
  }
  function bmsComputeParents(a, rows) {
    const parents5 = [];
    const p1 = new Array(a.length).fill(-1);
    for (let c = 0; c < a.length; c++) {
      for (let q = c - 1; q >= 0; q--) {
        if (bmsValue(a[q], 0) < bmsValue(a[c], 0)) {
          p1[c] = q;
          break;
        }
      }
    }
    parents5.push(p1);
    for (let level = 2; level <= rows; level++) {
      const previous = parents5[level - 2];
      const current = new Array(a.length).fill(-1);
      const suffixStart = level - 1;
      for (let c = 0; c < a.length; c++) {
        let p = previous[c];
        while (p !== -1) {
          if (bmsSuffixCompare(a[p], a[c], suffixStart, rows) < 0) {
            current[c] = p;
            break;
          }
          p = previous[p];
        }
      }
      parents5.push(current);
    }
    return parents5;
  }
  function bmsParent(parents5, level, colIndex) {
    if (level < 1 || level > parents5.length || colIndex < 0) return -1;
    return parents5[level - 1][colIndex];
  }
  function bmsIsAncestor(parents5, level, ancestorIndex, colIndex) {
    let p = bmsParent(parents5, level, colIndex);
    while (p !== -1) {
      if (p === ancestorIndex) return true;
      p = bmsParent(parents5, level, p);
    }
    return false;
  }
  function bmsChildAboveAncestor(parents5, level, descendant, ancestor) {
    let current = descendant;
    while (current !== -1) {
      const p = bmsParent(parents5, level, current);
      if (p === ancestor) return current;
      if (p === -1) return -1;
      current = p;
    }
    return -1;
  }
  function bmsHighestNonzeroRow(col, rows) {
    for (let r2 = rows - 1; r2 >= 0; r2--) {
      if (bmsValue(col, r2) !== 0) return r2 + 1;
    }
    return 0;
  }
  function bmsMaxEntry(a, rows) {
    let result = 0;
    for (const col of a) {
      for (let r2 = 0; r2 < rows; r2++) result = Math.max(result, bmsValue(col, r2));
    }
    return result;
  }
  function bmsTrimZeroRows(a) {
    if (a.length === 0) return [];
    const rows = bmsRowCount(a);
    const keptRows = [];
    for (let r2 = 0; r2 < rows; r2++) {
      let nonzero = false;
      for (const col of a) {
        if (bmsValue(col, r2) !== 0) {
          nonzero = true;
          break;
        }
      }
      if (nonzero) keptRows.push(r2);
    }
    if (keptRows.length === 0) keptRows.push(0);
    return a.map((col) => keptRows.map((r2) => bmsValue(col, r2)));
  }
  function bmsPrepareLimitContext(a) {
    if (a.length === 0) throw new Error("BMS: \u7A7A\u77E9\u9635\u4E0D\u662F\u6781\u9650\u8868\u8FBE\u5F0F");
    const rows = bmsRowCount(a);
    const last = a.length - 1;
    const x = a[last];
    const m = bmsHighestNonzeroRow(x, rows);
    if (m === 0) throw new Error("BMS: \u51680\u672B\u5217\u662F\u540E\u7EE7\uFF0C\u4E0D\u8FDB\u5165\u6781\u9650\u5C55\u5F00");
    const parents5 = bmsComputeParents(a, rows);
    const yIndex = bmsParent(parents5, m, last);
    if (yIndex === -1) {
      throw new Error("BMS: \u672B\u5217\u4E0D\u5B58\u5728\u7B2C" + m + "-\u7236\u5217");
    }
    const y = a[yIndex];
    const d = bmsZeroColumn(rows);
    for (let r2 = 0; r2 < m - 1; r2++) d[r2] = bmsValue(x, r2) - bmsValue(y, r2);
    const k = bmsHighestNonzeroRow(d, rows);
    const B = bmsCloneMatrix(a.slice(0, yIndex), rows);
    const C = bmsCloneMatrix(a.slice(yIndex + 1, last), rows);
    const APrime = bmsCloneMatrix(a.slice(0, last), rows);
    const yPlusC = bmsCloneMatrix(a.slice(yIndex, last), rows);
    const fs1 = bmsCloneMatrix(APrime, rows).concat([bmsAddColumns(y, d, rows)]);
    return {
      a: bmsCloneMatrix(a, rows),
      rows,
      last,
      x: bmsCloneMatrix([x], rows)[0],
      m,
      parents: parents5,
      yIndex,
      y: bmsCloneMatrix([y], rows)[0],
      d,
      k,
      B,
      C,
      APrime,
      yPlusC,
      fs1
    };
  }
  function bmsBuildGBMSD(ctx) {
    const D = ctx.yPlusC.map(() => bmsZeroColumn(ctx.rows));
    for (let local = 0; local < ctx.yPlusC.length; local++) {
      const global = ctx.yIndex + local;
      for (let row = 1; row <= ctx.k; row++) {
        if (global === ctx.yIndex || bmsIsAncestor(ctx.parents, row, ctx.yIndex, global)) {
          D[local][row - 1] = ctx.d[row - 1];
        }
      }
    }
    return D;
  }
  function bmsBuildProjectionRecurrence(ctx, D, index) {
    if (index === 0) return bmsCloneMatrix(ctx.APrime, ctx.rows);
    if (index === 1) return bmsCloneMatrix(ctx.fs1, ctx.rows);
    const result = bmsCloneMatrix(ctx.APrime, ctx.rows);
    for (let factor = 1; factor <= index - 1; factor++) {
      const shifted = bmsAddMatrices(ctx.yPlusC, bmsScaleMatrix(D, factor, ctx.rows), ctx.rows);
      result.push(...shifted);
    }
    return result;
  }
  function bmsBuildUPMSContext(ctx) {
    const h = 2 * bmsMaxEntry(ctx.a, ctx.rows);
    const span = bmsCloneMatrix(ctx.a.slice(ctx.yIndex, ctx.last + 1), ctx.rows);
    const spanLength = span.length;
    const Y = new Array(ctx.k + 1);
    const v = new Array(ctx.k + 1);
    const xCache = /* @__PURE__ */ new Map();
    function buildAdjustedSuffix(zIndex, level) {
      const key = zIndex + ":" + level;
      if (xCache.has(key)) return bmsCloneMatrix(xCache.get(key), ctx.rows);
      const suffix = bmsCloneMatrix(ctx.a.slice(zIndex, ctx.last + 1), ctx.rows);
      const adjustment = suffix.map(() => bmsZeroColumn(ctx.rows));
      for (let local = 0; local < suffix.length; local++) {
        const spanPosition = zIndex + local - ctx.yIndex;
        for (let row = 1; row < level; row++) {
          if (v[row] && v[row][spanPosition] === 1) {
            adjustment[local][row - 1] = h - bmsValue(ctx.a[zIndex], row - 1);
          }
        }
      }
      const result = bmsAddMatrices(suffix, adjustment, ctx.rows);
      xCache.set(key, result);
      return bmsCloneMatrix(result, ctx.rows);
    }
    for (let level = 2; level <= ctx.k; level++) {
      const zIndex = bmsChildAboveAncestor(ctx.parents, level, ctx.last, ctx.yIndex);
      if (zIndex === -1) throw new Error("UPMS: \u65E0\u6CD5\u6784\u9020Y_" + level + "\u4E2D\u7684z");
      const suffix = bmsCloneMatrix(ctx.a.slice(zIndex, ctx.last + 1), ctx.rows);
      const adjustment = suffix.map(() => bmsZeroColumn(ctx.rows));
      for (let local = 0; local < suffix.length; local++) {
        const global = zIndex + local;
        for (let row = 1; row < level; row++) {
          if (global === zIndex || bmsIsAncestor(ctx.parents, row, zIndex, global)) {
            adjustment[local][row - 1] = h - bmsValue(ctx.a[zIndex], row - 1);
          }
        }
      }
      Y[level] = bmsAddMatrices(suffix, adjustment, ctx.rows);
    }
    v[1] = new Array(spanLength).fill(1);
    for (let level = 2; level <= ctx.k; level++) {
      const current = new Array(spanLength).fill(0);
      current[0] = 1;
      current[spanLength - 1] = 1;
      for (let pos = 1; pos < spanLength - 1; pos++) {
        const zIndex = ctx.yIndex + pos;
        if (!bmsIsAncestor(ctx.parents, level, ctx.yIndex, zIndex)) continue;
        if (v[level - 1][pos] === 0) continue;
        const zPrime = bmsChildAboveAncestor(ctx.parents, level, zIndex, ctx.yIndex);
        if (zPrime === -1) continue;
        const X = buildAdjustedSuffix(zPrime, level);
        current[pos] = bmsMatrixCompare(X, Y[level]) < 0 ? 0 : 1;
      }
      v[level] = current;
    }
    const D = ctx.yPlusC.map(() => bmsZeroColumn(ctx.rows));
    for (let row = 1; row <= ctx.k; row++) {
      for (let pos = 0; pos < ctx.yPlusC.length; pos++) {
        D[pos][row - 1] = ctx.d[row - 1] * v[row][pos];
      }
    }
    return { h, span, Y, v, D, buildAdjustedSuffix };
  }
  function bmsFirstDifferentColumn(a, b) {
    const common = Math.min(a.length, b.length);
    const rows = Math.max(bmsRowCount(a), bmsRowCount(b));
    for (let i = 0; i < common; i++) {
      if (bmsColumnCompare(a[i], b[i], rows) !== 0) return i;
    }
    if (a.length !== b.length) return common;
    return common;
  }
  function bmsBuildLPMS2X(ctx, upms) {
    const cLength = ctx.C.length;
    const s = new Array(cLength + 1).fill(0);
    const X = [];
    for (let round = 0; round < cLength; round++) {
      if (s[round] === 1) continue;
      const zIndex = ctx.yIndex + 1 + round;
      const z = ctx.a[zIndex];
      const spanPosition = round + 1;
      const passesK = bmsParent(ctx.parents, ctx.k, zIndex) === ctx.yIndex && upms.v[ctx.k][spanPosition] === 1;
      if (passesK) {
        let level = -1;
        for (let candidate = 2; candidate <= ctx.k; candidate++) {
          if (bmsParent(ctx.parents, candidate, zIndex) === ctx.yIndex) {
            level = candidate;
            break;
          }
        }
        if (level !== -1) {
          const adjusted = upms.buildAdjustedSuffix(zIndex, level);
          const target = upms.Y[level];
          const difference = bmsFirstDifferentColumn(adjusted, target);
          const wIndex = difference < adjusted.length ? zIndex + difference : ctx.last + 1;
          if (wIndex !== zIndex) {
            let jPrime = -1;
            if (wIndex === ctx.last + 1) {
              jPrime = cLength + 1;
            } else {
              let search5 = wIndex;
              for (; search5 >= ctx.yIndex + 2; search5--) {
                if (bmsValue(ctx.a[search5], 0) <= bmsValue(z, 0) + 1) {
                  jPrime = search5 - ctx.yIndex - 1;
                  break;
                }
              }
            }
            if (jPrime !== -1) {
              for (let q = round + 1; q <= jPrime - 1 && q < s.length; q++) {
                s[q] = 1;
              }
            }
          }
        }
      }
      X.push(bmsAddColumns(z, upms.D[round + 1], ctx.rows));
    }
    return X;
  }
  function bmsOldFiniteFS(a, index, system) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(system + ": \u57FA\u672C\u5E8F\u5217\u4E0B\u6807\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570");
    }
    if (a.length === 0) return [];
    const rows = bmsRowCount(a);
    const last = a.length - 1;
    if (bmsIsZeroColumn(a[last], rows)) {
      return bmsCloneMatrix(a.slice(0, last), rows);
    }
    const ctx = bmsPrepareLimitContext(a);
    if (index === 0) return bmsCloneMatrix(ctx.APrime, ctx.rows);
    if (index === 1) return bmsCloneMatrix(ctx.fs1, ctx.rows);
    const gbmsD = bmsBuildGBMSD(ctx);
    if (system === "GBMS" || ctx.k <= 1) {
      return bmsBuildProjectionRecurrence(ctx, gbmsD, index);
    }
    const upms = bmsBuildUPMSContext(ctx);
    if (system === "UPMS") {
      return bmsBuildProjectionRecurrence(ctx, upms.D, index);
    }
    if (system === "LPMS2") {
      const X = bmsBuildLPMS2X(ctx, upms);
      const next = bmsCloneMatrix(ctx.fs1, ctx.rows).concat(X);
      return bmsOldFiniteFS(next, index - 1, "LPMS2");
    }
    throw new Error("BMS: \u672A\u77E5\u7CFB\u7EDF " + system);
  }
  function bmsMakeFS(system, limitBuilder, trimZeroRows, compareFn) {
    function rawAdjustedFS(a, index) {
      if (bmsIsInfinity(a)) return limitBuilder(index);
      let oldIndex = index;
      if (index >= 2) {
        const old1 = bmsOldFiniteFS(a, 1, system);
        const old2 = bmsOldFiniteFS(a, 2, system);
        if (old2.length <= old1.length) oldIndex = index + 1;
      }
      const result = bmsOldFiniteFS(a, oldIndex, system);
      return trimZeroRows ? bmsTrimZeroRows(result) : result;
    }
    return function FS17(a, index) {
      if (!Number.isInteger(index) || index < 0) {
        throw new Error(system + ": \u57FA\u672C\u5E8F\u5217\u4E0B\u6807\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570");
      }
      let result = rawAdjustedFS(a, 0);
      if (index === 0) return result;
      let logicalIndex = 0;
      let rawIndex = 1;
      while (logicalIndex < index) {
        const candidate = rawAdjustedFS(a, rawIndex++);
        if (compareFn(candidate, result) === 0) {
          if (rawIndex > index + 1e4) {
            throw new Error(system + ": \u57FA\u672C\u5E8F\u5217\u542B\u6709\u8FC7\u957F\u7684\u91CD\u590D\u6BB5");
          }
          continue;
        }
        result = candidate;
        logicalIndex++;
      }
      return result;
    };
  }
  function bmsLimit2P(index) {
    const out = [[0, 0, 0]];
    for (let n = 1; n <= index; n++) out.push([n, n - 1, 1]);
    return out;
  }
  function bmsLimit3P(index) {
    const out = [[0, 0, 0]];
    for (let n = 1; n <= index; n++) {
      const third = Math.min(n, 2);
      out.push([n, n - third, third]);
    }
    return out;
  }
  function bmsLimitNP(n) {
    const out = [[0, 0, 0]];
    return (index) => {
      for (let j = out.length; j <= index; j++) {
        const third = Math.min(j, n - 1);
        out.push([j, j - third, third]);
      }
      return out.slice(0, index + 1);
    };
  }
  function bmsLimitOmegaP(index) {
    const out = [[0, 0, 0]];
    for (let n = 1; n <= index; n++) out.push([n, Math.floor(n / 2), Math.ceil(n / 2)]);
    return out;
  }
  function bmsLimitPQSS(index) {
    const out = [[0, 0, 0, 0]];
    for (let n = 1; n <= index; n++) {
      out.push([n, Math.floor(n / 2), Math.floor((n - 1) / 2), 1]);
    }
    return out;
  }
  function bmsLimitQSS(index) {
    const out = [[0, 0, 0, 0]];
    for (let n = 1; n <= index; n++) {
      out.push([n, Math.floor((n + 1) / 3), Math.floor(n / 3), Math.ceil(n / 3)]);
    }
    return out;
  }
  function bmsLimitFull(index) {
    if (index === 0) return [];
    const out = [new Array(index).fill(0)];
    for (let stage = 2; stage <= index; stage++) {
      const triangular = (stage - 2) * (stage - 1) / 2;
      for (let j = 1; j <= stage - 1; j++) {
        const col = [triangular + j];
        for (let r2 = 1; r2 <= stage - 1; r2++) {
          const value = Math.max(1, stage - r2 - (r2 >= j ? 1 : 0));
          col.push(value);
        }
        while (col.length < index) col.push(0);
        out.push(col);
      }
    }
    return out;
  }
  function bmsLimitWeirdlyFull(index) {
    const rows = index + 2;
    const out = [new Array(rows).fill(0)];
    for (let j = 1; j < rows; j++) {
      const col = [j];
      for (let r2 = 1; r2 < rows - 1; r2++) {
        col.push(r2 < j ? 1 : 0);
      }
      col.push(1);
      out.push(col);
    }
    return out;
  }
  var bmsLimitBuilders = {
    "2-P": bmsLimit2P,
    "3-P": bmsLimit3P,
    "\u03C9-P": bmsLimitOmegaP,
    pQSS: bmsLimitPQSS,
    QSS: bmsLimitQSS,
    Full: bmsLimitFull,
    "Weirdly Full": bmsLimitWeirdlyFull
  };
  function bmsDisplay(a) {
    if (bmsIsInfinity(a)) return "Limit";
    return a.map(column_display).join("");
  }
  function bmsDisplayWeirdlyFull(a) {
    if (bmsIsInfinity(a)) return "Limit";
    return a.map((col) => {
      if (col.length === 0) return "()";
      const last = col[col.length - 1];
      if (last === 0) {
        return "(" + normalize_col(col.slice(0, -1)) + ")";
      }
      if (last === 1) {
        return "(" + normalize_col(col.slice(0, -1)) + ",,1)";
      }
      return "(" + normalize_col(col) + ")";
    }).join("");
  }
  function bmsCompare(a, b) {
    if (bmsIsInfinity(a)) return bmsIsInfinity(b) ? 0 : 1;
    if (bmsIsInfinity(b)) return -1;
    return bmsMatrixCompare(a, b);
  }
  function bmsCompareWeirdlyFull(a, b) {
    if (bmsIsInfinity(a)) return bmsIsInfinity(b) ? 0 : 1;
    if (bmsIsInfinity(b)) return -1;
    if (a.length === 0 || b.length === 0) return bmsMatrixCompare(a, b);
    const rowsA = bmsRowCount(a);
    const rowsB = bmsRowCount(b);
    if (rowsA !== rowsB) return rowsA < rowsB ? -1 : 1;
    return bmsMatrixCompare(a, b);
  }
  function bmsIsLimit(a) {
    if (bmsIsInfinity(a)) return true;
    if (a.length === 0) return false;
    return !bmsIsZeroColumn(a[a.length - 1], bmsRowCount(a));
  }
  function lpms2IsInfinity(a) {
    return bmsIsInfinity(a);
  }
  function lpms2CloneMatrix(a) {
    return a.map((col) => [bmsValue(col, 0), bmsValue(col, 1), bmsValue(col, 2)]);
  }
  function lpms2ColumnCompare(a, b) {
    return bmsColumnCompare(a, b, 3);
  }
  function lpms2MatrixCompare(a, b) {
    return bmsMatrixCompare(lpms2CloneMatrix(a), lpms2CloneMatrix(b));
  }
  function lpms2OcnMatrixEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (lpms2ColumnCompare(a[i], b[i]) !== 0) return false;
    }
    return true;
  }
  function lpms2OcnSplitComponents(a) {
    if (a.length === 0) return [];
    const starts = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i][0] === 0) starts.push(i);
    }
    if (starts.length === 0 || starts[0] !== 0) {
      return [lpms2CloneMatrix(a)];
    }
    const result = [];
    for (let i = 0; i < starts.length; i++) {
      const end = i + 1 < starts.length ? starts[i + 1] : a.length;
      result.push(lpms2CloneMatrix(a.slice(starts[i], end)));
    }
    return result;
  }
  function lpms2OcnRawMatrix(a) {
    const text = a.map((col) => "(" + col.join(",") + ")").join("");
    return { plain: text, html: text, latex: "\\text{" + text + "}" };
  }
  function lpms2OcnSubscript(basePlain, baseHtml, baseLatex, sub) {
    if (sub === "" || sub === null || sub === void 0) {
      return { plain: basePlain, html: baseHtml, latex: baseLatex };
    }
    return {
      plain: basePlain + "_" + sub,
      html: baseHtml + "<sub>" + sub + "</sub>",
      latex: baseLatex + "_{" + sub + "}"
    };
  }
  function lpms2OcnOneColumn(col) {
    const a = col[1];
    const b = col[2];
    if (a === 0 && b === 0) {
      return { plain: "1", html: "1", latex: "1" };
    }
    if (a === 0 && b === 1) {
      return { plain: "\u03A9", html: "\u03A9", latex: "\\Omega" };
    }
    if (b === 0 && a > 0) {
      if (a === 1) return { plain: "\u03B1", html: "\u03B1", latex: "\\alpha" };
      return lpms2OcnSubscript("\u03B1", "\u03B1", "\\alpha", String(a));
    }
    if (b === 1 && a > 0) {
      if (a === 1) return { plain: "D", html: "D", latex: "D" };
      return lpms2OcnSubscript("D", "D", "D", String(a));
    }
    return lpms2OcnRawMatrix([col]);
  }
  function lpms2OcnPsiSubscript(firstCol) {
    const a = firstCol[1];
    const b = firstCol[2];
    if (a === 0 && b === 0) return { plain: "", html: "", latex: "" };
    if (a === 0 && b === 1) return { plain: "\u03B1", html: "\u03B1", latex: "\\alpha" };
    if (a === 1 && b === 0) return { plain: "D", html: "D", latex: "D" };
    if (b === 0) {
      return lpms2OcnSubscript("D", "D", "D", String(a));
    }
    if (b === 1) {
      const sub = String(a + 1);
      if (a + 1 === 1) return { plain: "\u03B1", html: "\u03B1", latex: "\\alpha" };
      return lpms2OcnSubscript("\u03B1", "\u03B1", "\\alpha", sub);
    }
    const raw = "(" + a + "," + b + ")";
    return { plain: raw, html: raw, latex: "\\text{" + raw + "}" };
  }
  function lpms2OcnNPSymbol(n, index) {
    const base_list = [
      { plain: "", html: "", latex: "" },
      { plain: "\u03A9", html: "\u03A9", latex: "\\Omega" },
      { plain: "\u03B1", html: "\u03B1", latex: "\\alpha" },
      { plain: "\u03B2", html: "\u03B2", latex: "\\beta" },
      { plain: "\u03B3", html: "\u03B3", latex: "\\gamma" }
    ];
    const base = n < base_list.length ? base_list[n] : {
      plain: n + "P",
      html: n + "P",
      latex: n + "P"
    };
    if (index === 1) return base;
    return lpms2OcnSubscript(base.plain, base.html, base.latex, String(index));
  }
  function lpms2OcnMinus(left, right) {
    return {
      plain: left.plain + "-" + right.plain,
      html: left.html + "-" + right.html,
      latex: left.latex + "-" + right.latex
    };
  }
  function lpms2OcnNPOneColumn(n, col) {
    const a = col[1];
    const b = col[2];
    if (a === 0 && b === 0) {
      return { plain: "1", html: "1", latex: "1" };
    }
    if (a === 0 && b < n) {
      return lpms2OcnNPSymbol(b, 1);
    }
    if (a > 0 && b === 0) {
      return lpms2OcnNPSymbol(n, a);
    }
    if (a > 0 && b < n) {
      return lpms2OcnMinus(lpms2OcnNPSymbol(n, a), lpms2OcnNPSymbol(b, 1));
    }
    return lpms2OcnRawMatrix([col]);
  }
  function lpms2OcnNPPsiSubscript(n, firstCol) {
    const a = firstCol[1];
    const b = firstCol[2];
    if (a === 0 && b === 0) return { plain: "", html: "", latex: "" };
    if (a === 0 && b < n) return lpms2OcnNPSymbol(b + 1, 1);
    if (b < n - 1) {
      return lpms2OcnMinus(lpms2OcnNPSymbol(n, a), lpms2OcnNPSymbol(b + 1, 1));
    }
    if (b === n - 1) {
      return lpms2OcnNPSymbol(n, a + 1);
    }
    const raw = "(" + a + "," + b + ")";
    return { plain: raw, html: raw, latex: "\\text{" + raw + "}" };
  }
  var lpms2Ocn2PProfile = {
    oneColumn: lpms2OcnOneColumn,
    psiSubscript: lpms2OcnPsiSubscript
  };
  function lpms2OcnNPProfile(n) {
    return {
      oneColumn: bind1(lpms2OcnNPOneColumn, n),
      psiSubscript: bind1(lpms2OcnNPPsiSubscript, n)
    };
  }
  function lpms2OcnMultiply(term, count) {
    if (term.plain === "1" && term.html === "1") {
      const text = String(count);
      return { plain: text, html: text, latex: text };
    }
    if (count === 1) return term;
    const n = String(count);
    return {
      plain: term.plain + "\xB7" + n,
      html: term.html + "\xB7" + n,
      latex: term.latex + "\\cdot " + n
    };
  }
  function lpms2OcnJoinSum(terms) {
    return {
      plain: terms.map((x) => x.plain).join("+"),
      html: terms.map((x) => x.html).join("+"),
      latex: terms.map((x) => x.latex).join("+")
    };
  }
  function lpms2OcnToStrings(a, profile) {
    if (a.length === 0) {
      return { plain: "0", html: "0", latex: "0" };
    }
    const components = lpms2OcnSplitComponents(a);
    if (components.length > 1) {
      const grouped = [];
      for (const component of components) {
        const last = grouped[grouped.length - 1];
        if (last && lpms2OcnMatrixEqual(last.matrix, component)) {
          last.count++;
        } else {
          grouped.push({ matrix: component, count: 1 });
        }
      }
      return lpms2OcnJoinSum(
        grouped.map((group) => lpms2OcnMultiply(lpms2OcnToStrings(group.matrix, profile), group.count))
      );
    }
    if (a.length === 1) return profile.oneColumn(a[0]);
    const first = a[0];
    const inner3 = a.slice(1).map(([x1, x2, x3]) => [x1 - 1, x2, x3]);
    const arg = lpms2OcnToStrings(inner3, profile);
    const sub = profile.psiSubscript(first);
    const psiPlain = sub.plain === "" ? "\u03C8" : "\u03C8_" + sub.plain;
    const psiHtml = sub.html === "" ? "\u03C8" : "\u03C8<sub>" + sub.html + "</sub>";
    const psiLatex = sub.latex === "" ? "\\psi" : "\\psi_{" + sub.latex + "}";
    return {
      plain: psiPlain + "(" + arg.plain + ")",
      html: psiHtml + "(" + arg.html + ")",
      latex: psiLatex + "\\left(" + arg.latex + "\\right)"
    };
  }
  function makeOcnDisplay(profile) {
    return {
      plain: function(a) {
        if (lpms2IsInfinity(a)) return "Limit";
        return lpms2OcnToStrings(a, profile).plain;
      },
      html: function(a) {
        if (lpms2IsInfinity(a)) return "Limit";
        return lpms2OcnToStrings(a, profile).html;
      },
      latex: function(a) {
        if (lpms2IsInfinity(a)) return "\\text{Limit}";
        return lpms2OcnToStrings(a, profile).latex;
      }
    };
  }
  var lpms2OcnDisplay = makeOcnDisplay(lpms2Ocn2PProfile);
  var lpms2Ocn3PDisplay = makeOcnDisplay(lpms2OcnNPProfile(3));
  function lpms2DeluxeText(plain, html, latex) {
    return {
      plain,
      html: html === void 0 ? plain : html,
      latex: latex === void 0 ? plain : latex
    };
  }
  function lpms2DeluxeRawMatrix(a) {
    return lpms2OcnRawMatrix(a);
  }
  function lpms2DeluxeMatrixKey(a) {
    return JSON.stringify(a);
  }
  function lpms2DeluxeConcatMatrices(parts) {
    const result = [];
    for (const part of parts) {
      for (const col of part) result.push([col[0], col[1], col[2]]);
    }
    return result;
  }
  function lpms2DeluxeTerms(a) {
    const components = lpms2OcnSplitComponents(a);
    const terms = [];
    for (const component of components) {
      const previous = terms[terms.length - 1];
      if (previous && lpms2OcnMatrixEqual(previous.matrix, component)) {
        previous.count++;
      } else {
        terms.push({ matrix: lpms2CloneMatrix(component), count: 1 });
      }
    }
    return terms;
  }
  function lpms2DeluxeExpandTerms(terms, start, end) {
    const pieces = [];
    const from = start === void 0 ? 0 : start;
    const to = end === void 0 ? terms.length : end;
    for (let i = from; i < to; i++) {
      for (let n = 0; n < terms[i].count; n++) {
        pieces.push(terms[i].matrix);
      }
    }
    return lpms2DeluxeConcatMatrices(pieces);
  }
  function lpms2DeluxeIsZeroRoot(a) {
    return a.length === 1 && a[0][0] === 0 && a[0][1] === 0 && a[0][2] === 0;
  }
  function lpms2DeluxeAPrime(a) {
    return a.slice(1).map(([x1, x2, x3]) => [x1 - 1, x2, x3]);
  }
  var lpms2DeluxeEpsilonThreshold = [
    [0, 0, 0],
    [1, 0, 1]
  ];
  function lpms2DeluxeAnalyzePrimitive(a) {
    const aPrime = lpms2DeluxeAPrime(a);
    const primeTerms = lpms2DeluxeTerms(aPrime);
    let m = -1;
    for (let i = 0; i < primeTerms.length; i++) {
      const currentIsLower = lpms2MatrixCompare(primeTerms[i].matrix, a) < 0;
      const previousIsNotLower = i === 0 || lpms2MatrixCompare(primeTerms[i - 1].matrix, a) >= 0;
      if (currentIsLower && previousIsNotLower) {
        m = i;
        break;
      }
    }
    const epsilon = (primeTerms.length === 0 || m === -1) && lpms2MatrixCompare(a, lpms2DeluxeEpsilonThreshold) >= 0;
    if (epsilon) {
      return {
        epsilon: true,
        aPrime,
        primeTerms,
        m: -1,
        epart: lpms2CloneMatrix(a),
        rest: [],
        logw: lpms2CloneMatrix(a)
      };
    }
    if (m === -1) {
      const epart2 = a.length === 0 ? [] : [[a[0][0], a[0][1], a[0][2]]];
      const rest2 = lpms2CloneMatrix(aPrime);
      return {
        epsilon: false,
        aPrime,
        primeTerms,
        m: -1,
        epart: epart2,
        rest: rest2,
        logw: rest2
      };
    }
    let prefixLength = 0;
    for (let i = 0; i < m; i++) {
      prefixLength += primeTerms[i].matrix.length * primeTerms[i].count;
    }
    const epart = lpms2CloneMatrix(a.slice(0, 1 + prefixLength));
    const rest = lpms2DeluxeExpandTerms(primeTerms, m);
    const pivot = primeTerms[m].matrix;
    const cmp = lpms2MatrixCompare(epart, pivot);
    let logw;
    if (cmp > 0) {
      logw = lpms2DeluxeConcatMatrices([epart, rest]);
    } else if (cmp === 0) {
      const adjusted = primeTerms.map((term, i) => ({
        matrix: lpms2CloneMatrix(term.matrix),
        count: term.count + (i === m ? 1 : 0)
      }));
      logw = lpms2DeluxeExpandTerms(adjusted, m);
    } else {
      logw = lpms2CloneMatrix(rest);
    }
    return {
      epsilon: false,
      aPrime,
      primeTerms,
      m,
      epart,
      rest,
      logw
    };
  }
  function lpms2DeluxeContext(profile) {
    return {
      profile,
      tCache: /* @__PURE__ */ new Map(),
      wCache: /* @__PURE__ */ new Map(),
      tActive: /* @__PURE__ */ new Set(),
      wActive: /* @__PURE__ */ new Set()
    };
  }
  function lpms2DeluxeSingleT(col, ctx) {
    return ctx.profile.oneColumn(col);
  }
  function lpms2DeluxeSingleW(col, ctx) {
    if (col[0] === 0 && col[1] === 0 && col[2] === 0) {
      return lpms2DeluxeText("\u03C9", "\u03C9", "\\omega");
    }
    return lpms2DeluxeSingleT(col, ctx);
  }
  function lpms2DeluxePsiSubscript(firstCol, ctx) {
    return ctx.profile.psiSubscript(firstCol);
  }
  function lpms2DeluxePsi(firstCol, arg, ctx) {
    const sub = lpms2DeluxePsiSubscript(firstCol, ctx);
    const psiPlain = sub.plain === "" ? "\u03C8" : "\u03C8_" + sub.plain;
    const psiHtml = sub.html === "" ? "\u03C8" : "\u03C8<sub>" + sub.html + "</sub>";
    const psiLatex = sub.latex === "" ? "\\psi" : "\\psi_{" + sub.latex + "}";
    return {
      plain: psiPlain + "(" + arg.plain + ")",
      html: psiHtml + "(" + arg.html + ")",
      latex: psiLatex + "\\left(" + arg.latex + "\\right)"
    };
  }
  function lpms2DeluxeSup(base, exponent) {
    return {
      plain: base.plain + "^(" + exponent.plain + ")",
      html: base.html + "<sup>" + exponent.html + "</sup>",
      latex: "{" + base.latex + "}^{" + exponent.latex + "}"
    };
  }
  function lpms2DeluxeProduct(parts) {
    return {
      plain: parts.map((x) => x.plain).join("\xB7"),
      html: parts.map((x) => x.html).join("\xB7"),
      latex: parts.map((x) => x.latex).join("\\cdot ")
    };
  }
  function lpms2DeluxeSum(parts) {
    return lpms2OcnJoinSum(parts);
  }
  function lpms2DeluxeMultiplyString(term, count) {
    return lpms2OcnMultiply(term, count);
  }
  function lpms2DeluxeTImpl(a, ctx) {
    const key = lpms2DeluxeMatrixKey(a);
    if (ctx.tCache.has(key)) return ctx.tCache.get(key);
    if (ctx.tActive.has(key)) return lpms2DeluxeRawMatrix(a);
    ctx.tActive.add(key);
    let result;
    if (a.length === 0) {
      result = lpms2DeluxeText("", "", "");
    } else {
      const terms = lpms2DeluxeTerms(a);
      const oneUnrepeatedTerm = terms.length === 1 && terms[0].count === 1;
      if (!oneUnrepeatedTerm) {
        result = lpms2DeluxeSum(
          terms.map((term) => lpms2DeluxeMultiplyString(lpms2DeluxeTImpl(term.matrix, ctx), term.count))
        );
      } else if (a.length === 1) {
        result = lpms2DeluxeSingleT(a[0], ctx);
      } else {
        const info = lpms2DeluxeAnalyzePrimitive(a);
        if (info.epsilon) {
          result = lpms2DeluxePsi(a[0], lpms2DeluxeTImpl(info.aPrime, ctx), ctx);
        } else if (!lpms2DeluxeIsZeroRoot(info.epart)) {
          result = lpms2DeluxeWImpl(info.logw, ctx);
        } else {
          result = lpms2DeluxeWImpl(info.rest, ctx);
        }
      }
    }
    ctx.tActive.delete(key);
    ctx.tCache.set(key, result);
    return result;
  }
  function lpms2DeluxeWImpl(a, ctx) {
    const key = lpms2DeluxeMatrixKey(a);
    if (ctx.wCache.has(key)) return ctx.wCache.get(key);
    if (ctx.wActive.has(key)) return lpms2DeluxeRawMatrix(a);
    ctx.wActive.add(key);
    let result;
    if (a.length === 0) {
      result = lpms2DeluxeText("1", "1", "1");
    } else {
      const terms = lpms2DeluxeTerms(a);
      const oneUnrepeatedTerm = terms.length === 1 && terms[0].count === 1;
      if (oneUnrepeatedTerm && a.length === 1) {
        result = lpms2DeluxeSingleW(a[0], ctx);
      } else if (oneUnrepeatedTerm) {
        const info = lpms2DeluxeAnalyzePrimitive(a);
        if (info.epsilon) {
          result = lpms2DeluxePsi(a[0], lpms2DeluxeTImpl(info.aPrime, ctx), ctx);
        } else {
          result = lpms2DeluxeWNonEpsilon(a, terms, ctx);
        }
      } else {
        result = lpms2DeluxeWNonEpsilon(a, terms, ctx);
      }
    }
    ctx.wActive.delete(key);
    ctx.wCache.set(key, result);
    return result;
  }
  function lpms2DeluxeWNonEpsilon(a, terms, ctx) {
    const enriched = terms.map((term) => ({
      matrix: term.matrix,
      count: term.count,
      info: lpms2DeluxeAnalyzePrimitive(term.matrix)
    }));
    const blocks = [];
    for (const term of enriched) {
      const previous = blocks[blocks.length - 1];
      if (previous && lpms2OcnMatrixEqual(previous.epart, term.info.epart)) {
        previous.terms.push(term);
      } else {
        blocks.push({
          epart: lpms2CloneMatrix(term.info.epart),
          terms: [term]
        });
      }
    }
    if (blocks.length > 1) {
      const factors = blocks.map((block) => {
        const blockTerms = block.terms.map((term) => ({
          matrix: term.matrix,
          count: term.count
        }));
        return lpms2DeluxeWImpl(lpms2DeluxeExpandTerms(blockTerms), ctx);
      });
      return lpms2DeluxeProduct(factors);
    }
    const epart = enriched[0].info.epart;
    if (lpms2DeluxeIsZeroRoot(epart)) {
      return lpms2DeluxeSup(lpms2DeluxeText("\u03C9", "\u03C9", "\\omega"), lpms2DeluxeTImpl(a, ctx));
    }
    const exponentTerms = enriched.map(
      (term) => lpms2DeluxeMultiplyString(lpms2DeluxeWImpl(term.info.rest, ctx), term.count)
    );
    return lpms2DeluxeSup(lpms2DeluxeTImpl(epart, ctx), lpms2DeluxeSum(exponentTerms));
  }
  function lpms2DeluxeT(a, profile) {
    return lpms2DeluxeTImpl(a, lpms2DeluxeContext(profile));
  }
  function makeOcnDeluxeDisplay(profile) {
    return {
      plain: function(a) {
        if (lpms2IsInfinity(a)) return "Limit";
        if (a.length === 0) return "0";
        return lpms2DeluxeT(a, profile).plain;
      },
      html: function(a) {
        if (lpms2IsInfinity(a)) return "Limit";
        if (a.length === 0) return "0";
        return lpms2DeluxeT(a, profile).html;
      },
      latex: function(a) {
        if (lpms2IsInfinity(a)) return "\\text{Limit}";
        if (a.length === 0) return "0";
        return lpms2DeluxeT(a, profile).latex;
      }
    };
  }
  var lpms2OcnDeluxeDisplay = makeOcnDeluxeDisplay(lpms2Ocn2PProfile);
  var lpms2Ocn3PDeluxeDisplay = makeOcnDeluxeDisplay(lpms2OcnNPProfile(3));
  function bmsNormalize3ForOcn(a) {
    if (bmsIsInfinity(a)) return a;
    return a.map((col) => [bmsValue(col, 0), bmsValue(col, 1), bmsValue(col, 2)]);
  }
  function bmsWrapOcnDisplay(spec) {
    return {
      plain: (a) => spec.plain(bmsNormalize3ForOcn(a)),
      html: (a) => spec.html(bmsNormalize3ForOcn(a)),
      latex: (a) => spec.latex(bmsNormalize3ForOcn(a))
    };
  }
  var bms2POcnDisplay = bmsWrapOcnDisplay(lpms2OcnDisplay);
  var bms2POcnDeluxeDisplay = bmsWrapOcnDisplay(lpms2OcnDeluxeDisplay);
  var bms3POcnDisplay = bmsWrapOcnDisplay(lpms2Ocn3PDisplay);
  var bms3POcnDeluxeDisplay = bmsWrapOcnDisplay(lpms2Ocn3PDeluxeDisplay);
  var bmsScriptVersion = "20260721-v10-weirdfull-display";
  var systems = ["GBMS", "UPMS", "LPMS2"];
  var projectionNames = ["\u03C9-P", "pQSS", "QSS", "Full", "Weirdly Full"];
  var gmsParentId = "category-GMS-" + bmsScriptVersion;
  function makeNPNotation(system, n) {
    const limitBuilder = bmsLimitNP(n);
    const ocnProfile = n === 2 ? lpms2Ocn2PProfile : lpms2OcnNPProfile(n);
    const definition = {
      id: "BMS-" + bmsScriptVersion + "-" + system + "-n-" + n + "-P",
      name: system + " " + n + "-P",
      simple_name: n + "-P",
      category_id: gmsParentId + "-" + system + "-n-P",
      display: {
        plain: bmsDisplay,
        from_display: from_display2
      },
      is_limit: bmsIsLimit,
      compare: bmsCompare,
      FS: bmsMakeFS(system, limitBuilder, false, bmsCompare),
      credit_text_id: system === "LPMS2" ? "credit.test-alpha0-ocn" : "credit.test-alpha0",
      init: () => [[[Infinity]], []],
      debug: {
        oldFS: (a, index) => bmsOldFiniteFS(a, index, system),
        parents: (a) => bmsComputeParents(a, bmsRowCount(a)),
        context: (a) => bmsPrepareLimitContext(a),
        upmsContext: (a) => {
          const ctx = bmsPrepareLimitContext(a);
          return bmsBuildUPMSContext(ctx);
        },
        lpms2X: (a) => {
          const ctx = bmsPrepareLimitContext(a);
          const upms = bmsBuildUPMSContext(ctx);
          return bmsBuildLPMS2X(ctx, upms);
        }
      }
    };
    if (system === "LPMS2") {
      const ocnDisplay = bmsWrapOcnDisplay(makeOcnDisplay(ocnProfile));
      const ocnDeluxeDisplay = bmsWrapOcnDisplay(makeOcnDeluxeDisplay(ocnProfile));
      definition.display_equiv = {
        [n + "-P OCN"]: ocnDisplay,
        [n + "-P OCN deluxe"]: ocnDeluxeDisplay
      };
    }
    return definition;
  }
  var GMS_categories = [
    {
      id: gmsParentId,
      name: "General Matrix System",
      simple_name: "GMS",
      parent_id: "category-bm-like"
    },
    ...systems.flatMap((system) => [
      {
        id: gmsParentId + "-" + system,
        name: system,
        parent_id: gmsParentId
      },
      {
        id: gmsParentId + "-" + system + "-n-P",
        name: system + " n-P",
        simple_name: "n-P",
        parent_id: gmsParentId + "-" + system,
        generator: {
          start: 2,
          initial: 3,
          create: (n) => makeNPNotation(system, n)
        }
      }
    ])
  ];
  var GMS_notations = [];
  for (const system of systems) {
    for (const projectionName of projectionNames) {
      const limitBuilder = bmsLimitBuilders[projectionName];
      const compareFn = projectionName === "Weirdly Full" ? bmsCompareWeirdlyFull : bmsCompare;
      const definition = {
        id: "BMS-" + bmsScriptVersion + "-" + system + "-" + projectionName.replace("\u03C9", "omega"),
        name: system + " " + projectionName,
        simple_name: projectionName,
        category_id: gmsParentId + "-" + system,
        display: {
          plain: projectionName === "Weirdly Full" ? bmsDisplayWeirdlyFull : bmsDisplay,
          from_display: from_display2
        },
        is_limit: bmsIsLimit,
        compare: compareFn,
        FS: bmsMakeFS(
          system,
          limitBuilder,
          projectionName === "Full" || projectionName === "Weirdly Full",
          compareFn
        ),
        credit_text_id: "credit.test-alpha0",
        init: () => [[[Infinity]], []],
        debug: {
          oldFS: (a, index) => bmsOldFiniteFS(a, index, system),
          parents: (a) => bmsComputeParents(a, bmsRowCount(a)),
          context: (a) => bmsPrepareLimitContext(a),
          upmsContext: (a) => {
            const ctx = bmsPrepareLimitContext(a);
            return bmsBuildUPMSContext(ctx);
          },
          lpms2X: (a) => {
            const ctx = bmsPrepareLimitContext(a);
            const upms = bmsBuildUPMSContext(ctx);
            return bmsBuildLPMS2X(ctx, upms);
          }
        }
      };
      GMS_notations.push(definition);
    }
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/Minus1_Y_nSS.ts
  function INFINITY14() {
    return [[[Infinity]]];
  }
  function EMPTY_COLUMN(n) {
    return [Array.from({ length: n }, () => 0), 0];
  }
  function is_infinity15(e) {
    return "" + e === "Infinity";
  }
  function infinity_FS13(index, n) {
    return [EMPTY_COLUMN(n), [Array.from({ length: n }, () => 1), index]];
  }
  function column_compare2(a, b) {
    return tuple_lex_compare(a, b, [(x, y) => lex_compare(x, y, number_compare), number_compare]);
  }
  function compare13(a, b) {
    return lex_compare(a, b, column_compare2);
  }
  function parents3(e, n) {
    if (is_infinity15(e)) return [];
    let result = [];
    for (let i = 0; i < e.length; i++) {
      result[i] = [Array.from({ length: n }, () => -1), -1];
      for (let j = 0; j < n; j++) {
        let v2 = e[i][0][j] ?? 0;
        let p2 = j === 0 ? i - 1 : result[i][0][j - 1];
        while (p2 >= 0) {
          if (e[p2][0][j] < v2) break;
          p2 = j === 0 ? p2 - 1 : result[p2][0][j - 1];
        }
        if (p2 < 0) break;
        result[i][0][j] = p2;
      }
      let v = e[i][1];
      let p = n === 0 ? i - 1 : result[i][0][n - 1];
      while (p >= 0) {
        if (e[p][1] < v) break;
        p = n === 0 ? p - 1 : result[p][0][n - 1];
      }
      result[i][1] = p;
    }
    return result;
  }
  function is_limit9(e, n) {
    return is_infinity15(e) || e.length > 0 && (n === 0 ? e[e.length - 1][1] > 0 : e[e.length - 1][0][0] > 0);
  }
  function root4(P, n) {
    if (P.length === 0) return void 0;
    let right = P.length - 1;
    if (P[right][1] >= 0) return [P[right][1], n];
    let b = index_of_last(P[right][0], (pb) => pb >= 0);
    if (b === -1) return void 0;
    return [P[right][0][b], b];
  }
  function ascension_vector(e, r2, b) {
    return Array.from({ length: b }, (_, i) => e[e.length - 1][0][i] - e[r2][0][i]);
  }
  function ascension_thresholds(P, r2, b) {
    let result = [];
    result[r2] = b;
    for (let i = r2 + 1; i < P.length; i++) {
      let ai = 0;
      while (ai < b) {
        let p = i;
        while (p > r2) p = P[p][0][ai];
        if (p < r2) break;
        ai++;
      }
      result[i] = ai;
    }
    return result;
  }
  function ascend(ei, delta, b, w) {
    let result = [deepcopy(ei[0]), ei[1]];
    for (let i = 0; i < b; i++) result[0][i] += delta[i] * w;
    return result;
  }
  function FS10(e, index, n) {
    if (is_infinity15(e)) return infinity_FS13(index, n);
    if (e.length === 0) return e;
    let P = parents3(e, n);
    let rb = root4(P, n);
    if (rb === void 0) return e.slice(0, -1);
    let right = e.length - 1;
    let [r2, b] = rb;
    let width = right - r2;
    let V = ascension_vector(e, r2, b);
    let A = ascension_thresholds(P, r2, b);
    let result = e.slice(0, -1).map((c) => [deepcopy(c[0]), c[1]]);
    for (let w = 1; w <= index; w++) {
      for (let i = r2; i < right; i++) {
        result.push(ascend(e[i], V, A[i], w));
      }
      if (b === n) result[r2 + w * width][1] = e[right][1] - 1;
    }
    return result;
  }
  function column_display3(c) {
    let result_list = [...c[0], c[1]];
    while (result_list.length > 0 && result_list[result_list.length - 1] === 0) result_list.pop();
    return "(" + result_list.join(",") + ")";
  }
  function display7(e) {
    if (is_infinity15(e)) return "Limit";
    return e.map(column_display3).join("");
  }
  function from_display7(s, n) {
    if (s.trim() === "Limit") return INFINITY14();
    let i = 0;
    function error() {
      throw new Error(`Illegal input string: ${s}`);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      skip_spaces();
      const values3 = [];
      if (i < s.length && s[i] !== ")") {
        values3.push(parse_number());
        while (true) {
          skip_spaces();
          if (i >= s.length || s[i] !== ",") break;
          i++;
          skip_spaces();
          if (i < s.length && s[i] === ")") break;
          values3.push(parse_number());
        }
      }
      skip_spaces();
      if (i >= s.length || s[i] !== ")") error();
      i++;
      const arr = values3.slice(0, n);
      while (arr.length < n) arr.push(0);
      const step = values3.length > n ? values3[n] : 0;
      return [arr, step];
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length) {
        if (s[i] !== "(") break;
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function INFINITY_BOCF() {
    return [Infinity];
  }
  function bocf_from_2ss(e) {
    if (is_infinity15(e)) return INFINITY_BOCF();
    let i = 0;
    function impl(base) {
      let result = [];
      while (i < e.length) {
        let [[x], y] = e[i];
        if (x <= base) break;
        i++;
        let inner3 = impl(x);
        result.push([1, y, inner3]);
      }
      if (result.length === 1) return result[0];
      return [0, result];
    }
    return impl(-1);
  }
  function display_bocf(e, html) {
    if (is_infinity15(e)) return "Limit";
    function impl(a) {
      if (a[0] === 0) {
        if (a[1].length === 0) return "0";
        return a[1].map(impl).join("+");
      }
      let str_inner = impl(a[2]);
      if (str_inner === "0") {
        if (a[1] === 0) return "1";
        if (a[1] === 1) return "\u03A9";
        return html ? "\u03A9<sub>" + a[1] + "</sub>" : "\u03A9(" + a[1] + ")";
      }
      return html ? "\u03C8<sub>" + a[1] + "</sub>(" + str_inner + ")" : "\u03C8(" + a[1] + "," + str_inner + ")";
    }
    return impl(e);
  }
  var category_bm_minus1_y_nss = {
    id: "category-bm-minus1-y-nss",
    name: "-1Y n-tuple Sequence System",
    simple_name: "-1Y-nSS",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 0, initial: 3, create: (n) => Minus1_Y_nSS(n) }
  };
  function Minus1_Y_nSS(n) {
    let display_equiv = {};
    if (n === 1) {
      display_equiv = {
        BOCF: {
          plain: (e) => display_bocf(bocf_from_2ss(e), false),
          html: (e) => display_bocf(bocf_from_2ss(e), true)
        }
      };
    }
    return {
      id: "-1y-" + (n + 1) + "ss",
      name: "(-1)Y-" + (n + 1) + "SS",
      category_id: "category-bm-minus1-y-nss",
      display: { plain: display7, from_display: (s) => from_display7(s, n) },
      display_equiv,
      is_limit: bind2(is_limit9, n),
      compare: compare13,
      FS: bind3(FS10, n),
      credit_text_id: "credit.community_y",
      init: () => [INFINITY14(), [EMPTY_COLUMN(n)], []]
    };
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/T_Minus1_Y_nSS.ts
  function INFINITY15() {
    return [[[Infinity]]];
  }
  function EMPTY_COLUMN2(n) {
    return [Array.from({ length: n }, () => 0), []];
  }
  function ONE_COLUMN(n) {
    return n === 0 ? [[], [EMPTY_COLUMN2(n)]] : [[1, ...Array.from({ length: n - 1 }, () => 0)], []];
  }
  function is_infinity16(e) {
    return "" + e === "Infinity";
  }
  function infinity_FS14(index, n) {
    if (index === 0) return [EMPTY_COLUMN2(n)];
    return [EMPTY_COLUMN2(n), [Array.from({ length: n }, () => 1), infinity_FS14(index - 1, n)]];
  }
  function column_compare3(a, b) {
    return tuple_lex_compare(a, b, [(x, y) => lex_compare(x, y, number_compare), compare14]);
  }
  function compare14(a, b) {
    return lex_compare(a, b, column_compare3);
  }
  function parents4(e, n) {
    if (is_infinity16(e)) return [];
    let result = [];
    for (let i = 0; i < e.length; i++) {
      result[i] = [Array.from({ length: n }, () => -1), -1];
      for (let j = 0; j < n; j++) {
        let v2 = e[i][0][j] ?? 0;
        let p2 = j === 0 ? i - 1 : result[i][0][j - 1];
        while (p2 >= 0) {
          if (e[p2][0][j] < v2) break;
          p2 = j === 0 ? p2 - 1 : result[p2][0][j - 1];
        }
        if (p2 < 0) break;
        result[i][0][j] = p2;
      }
      let v = e[i][1];
      let p = n === 0 ? i - 1 : result[i][0][n - 1];
      while (p >= 0) {
        if (compare14(e[p][1], v) < 0) break;
        p = n === 0 ? p - 1 : result[p][0][n - 1];
      }
      result[i][1] = p;
    }
    return result;
  }
  function is_limit10(e, n) {
    return is_infinity16(e) || e.length > 0 && (n === 0 ? e[e.length - 1][1].length > 0 : e[e.length - 1][0][0] > 0);
  }
  function root5(P, n) {
    if (P.length === 0) return void 0;
    let right = P.length - 1;
    if (P[right][1] >= 0) return [P[right][1], n];
    let b = index_of_last(P[right][0], (pb) => pb >= 0);
    if (b === -1) return void 0;
    return [P[right][0][b], b];
  }
  function ascension_vector2(e, r2, b) {
    return Array.from({ length: b }, (_, i) => e[e.length - 1][0][i] - e[r2][0][i]);
  }
  function ascension_thresholds2(P, r2, b) {
    let result = [];
    result[r2] = b;
    for (let i = r2 + 1; i < P.length; i++) {
      let ai = 0;
      while (ai < b) {
        let p = i;
        while (p > r2) p = P[p][0][ai];
        if (p < r2) break;
        ai++;
      }
      result[i] = ai;
    }
    return result;
  }
  function ascend2(ei, delta, b, w) {
    let result = [deepcopy(ei[0]), ei[1]];
    for (let i = 0; i < b; i++) result[0][i] += delta[i] * w;
    return result;
  }
  function FS11(e, index, n) {
    if (is_infinity16(e)) return infinity_FS14(index, n);
    if (e.length === 0) return e;
    let right = e.length - 1;
    if (is_limit10(e[right][1], n)) {
      return [...e.slice(0, -1), [e[right][0].slice(), FS11(e[right][1], index, n)]];
    }
    let P = parents4(e, n);
    let rb = root5(P, n);
    if (rb === void 0) return e.slice(0, -1);
    let [r2, b] = rb;
    let width = right - r2;
    let V = ascension_vector2(e, r2, b);
    let A = ascension_thresholds2(P, r2, b);
    let result = e.slice(0, -1).map((c) => [deepcopy(c[0]), c[1]]);
    for (let w = 1; w <= index; w++) {
      for (let i = r2; i < right; i++) {
        result.push(ascend2(e[i], V, A[i], w));
      }
      if (b === n) result[r2 + w * width][1] = e[right][1].slice(0, -1);
    }
    return result;
  }
  function is_zero_column(c) {
    return c[0].every((x) => x === 0) && c[1].length === 0;
  }
  function is_one_column(c) {
    let n = c[0].length;
    return n === 0 ? c[1].length === 1 : c[0][0] === 1 && c[0].slice(1).every((x) => x === 0) && c[1].length === 0;
  }
  function column_display4(c) {
    let result_list = [...c[0].map((x) => "" + x), display8(c[1], false)];
    while (result_list.length > 0 && result_list[result_list.length - 1] === "0") result_list.pop();
    return "(" + result_list.join(",") + ")";
  }
  function display8(e, top_level = true) {
    if (is_infinity16(e)) return "Limit";
    if (!top_level) {
      if (e.every(is_zero_column)) {
        return "" + e.length;
      }
      if (e.length === 2 && is_one_column(e[1])) {
        return "\u03C9";
      }
    }
    return e.map(column_display4).join("");
  }
  function from_display8(s, n) {
    let i = 0;
    function error() {
      throw new Error(`Illegal input string: ${s}`);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parseNumber() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parseExpr(top_level) {
      skip_spaces();
      if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
        i += 5;
        return INFINITY15();
      }
      if (!top_level) {
        if (i < s.length && s[i] >= "0" && s[i] <= "9") {
          const num = parseNumber();
          return Array.from({ length: num }, () => EMPTY_COLUMN2(n));
        }
        if (i < s.length && (s[i] === "\u03C9" || s[i] === "w")) {
          i++;
          return [EMPTY_COLUMN2(n), ONE_COLUMN(n)];
        }
      }
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parseColumn());
        skip_spaces();
      }
      return result2;
    }
    function parseColumn() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      skip_spaces();
      const arr = [];
      for (let j = 0; j < n; j++) {
        if (j > 0) {
          skip_spaces();
          if (i >= s.length || s[i] !== ",") {
            arr.push(0);
            continue;
          }
          i++;
        }
        skip_spaces();
        if (i < s.length && s[i] >= "0" && s[i] <= "9") {
          arr.push(parseNumber());
        } else {
          arr.push(0);
        }
      }
      skip_spaces();
      let step = [];
      if (i < s.length && s[i] === ",") {
        i++;
        step = parseExpr(false);
      }
      skip_spaces();
      if (i >= s.length || s[i] !== ")") error();
      i++;
      return [arr, step];
    }
    const result = parseExpr(true);
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function INFINITY_BOCF2() {
    return [Infinity];
  }
  function bocf_from_2ss2(e) {
    if (is_infinity16(e)) return INFINITY_BOCF2();
    let i = 0;
    function impl(base) {
      let result = [];
      while (i < e.length) {
        let [[x], y] = e[i];
        if (x <= base) break;
        i++;
        let inner3 = impl(x);
        result.push([1, bocf_from_2ss2(y), inner3]);
      }
      if (result.length === 1) return result[0];
      return [0, result];
    }
    return impl(-1);
  }
  function display_bocf2(e, html) {
    if (is_infinity16(e)) return "Limit";
    function impl(a) {
      if (a[0] === 0) {
        if (a[1].length === 0) return "0";
        return a[1].map(impl).join("+");
      }
      let str_index = impl(a[1]);
      let str_inner = impl(a[2]);
      if (str_inner === "0") {
        if (str_index === "0") return "1";
        if (str_index === "1") return "\u03A9";
        return html ? "\u03A9<sub>" + str_index + "</sub>" : "\u03A9(" + str_index + ")";
      }
      return html ? "\u03C8<sub>" + str_index + "</sub>(" + str_inner + ")" : "\u03C8(" + str_index + "," + str_inner + ")";
    }
    return impl(e);
  }
  var category_bm_t_minus1_y_nss = {
    id: "category-bm-t-minus1-y-nss",
    name: "Transfinite -1Y-nSS",
    simple_name: "T(-1)Y-nSS",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 0, initial: 3, create: (n) => T_Minus1_Y_nSS(n) }
  };
  function T_Minus1_Y_nSS(n) {
    let display_equiv = {};
    if (n === 1) {
      display_equiv = {
        BOCF: {
          plain: (e) => display_bocf2(bocf_from_2ss2(e), false),
          html: (e) => display_bocf2(bocf_from_2ss2(e), true)
        }
      };
    }
    return {
      id: "t--1y-" + (n + 1) + "ss",
      category_id: "category-bm-t-minus1-y-nss",
      name: "T(-1)Y-" + (n + 1) + "SS",
      display: { plain: display8, from_display: (s) => from_display8(s, n) },
      display_equiv,
      is_limit: bind2(is_limit10, n),
      compare: compare14,
      FS: bind3(FS11, n),
      credit_text_id: "credit.community_y",
      init: () => [INFINITY15(), [EMPTY_COLUMN2(n)], []]
    };
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/BT_Minus1_Y_nSS.ts
  function INFINITY16() {
    return [[[Infinity]]];
  }
  function ZERO_COLUMN(n) {
    return [Array.from({ length: n }, () => 0), []];
  }
  function is_infinity17(e) {
    return "" + e === "Infinity";
  }
  function infinity_FS15(index, n) {
    let result = [];
    for (let i = index; i > 0; i--) {
      result = [[Array.from({ length: n }, () => i), result]];
    }
    return [ZERO_COLUMN(n), ...result];
  }
  function is_zero_column2(c) {
    return c[0].every((x) => x === 0) && c[1].length === 0;
  }
  function is_one_column2(c) {
    let n = c[0].length;
    return n === 0 ? c[1].length === 1 && is_zero_column2(c[1][0]) : c[0][0] === 1 && c[0].slice(1).every((x) => x === 0) && c[1].length === 0;
  }
  function column_display5(c) {
    let result_list = [...c[0].map((x) => "" + x), display9(c[1], false)];
    while (result_list.length > 0 && result_list[result_list.length - 1] === "0") result_list.pop();
    return "(" + result_list.join(",") + ")";
  }
  function display9(e, top_level = true) {
    if (is_infinity17(e)) return "Limit";
    if (!top_level) {
      if (e.every(is_zero_column2)) {
        return "" + e.length;
      }
      if (e.length === 2 && is_zero_column2(e[0]) && is_one_column2(e[1])) {
        return "\u03C9";
      }
    }
    return e.map(column_display5).join("");
  }
  function is_limit11(e) {
    return is_infinity17(e) || e.length > 0 && !is_zero_column2(e[e.length - 1]);
  }
  function column_compare4(a, b) {
    return tuple_lex_compare(a, b, [lex_compare_by(number_compare), compare15]);
  }
  function compare15(a, b) {
    return lex_compare(a, b, column_compare4);
  }
  function compute_parents(e, n, stack = [], parent_stack = [], forbidden_stack = []) {
    const lS0 = stack.length;
    let result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = stack.length;
      stack.push(e[i]);
      let result_i = Array.from({ length: n + 1 }, () => -1);
      parent_stack.push(result_i);
      for (let j = 0; j < n; j++) {
        let p2 = iS;
        while (p2 >= 0) {
          if (stack[p2][0][j] < col[0][j]) break;
          p2 = j === 0 ? p2 - 1 : parent_stack[p2][j - 1];
        }
        if (p2 < 0) break;
        result_i[j] = p2;
      }
      let p = iS;
      while (p >= 0) {
        if (compare15(stack[p][1], col[1]) < 0 && !forbidden_stack.includes(p)) break;
        p = n === 0 ? p - 1 : parent_stack[p][n - 1];
      }
      result_i[n] = p;
      forbidden_stack.push(iS);
      result[i] = [result_i, compute_parents(col[1], n, stack, parent_stack, forbidden_stack)];
      forbidden_stack.pop();
    }
    stack.splice(lS0);
    parent_stack.splice(lS0);
    return result;
  }
  function compute_tail_layer(e) {
    if (e.length === 0 || is_zero_column2(e[e.length - 1])) return -1;
    let current = e, layer = 0;
    while (true) {
      let right = current.length - 1;
      if (current[right][1].length === 0) {
        return layer;
      }
      if (!is_limit11(current[right][1])) {
        return layer;
      }
      current = current[right][1];
      layer++;
    }
  }
  function compute_root_layer(e, r2) {
    let layer = 0;
    let len = e.length;
    let current = e;
    while (len <= r2) {
      layer++;
      let right = current.length - 1;
      current = current[right][1];
      len += current.length;
    }
    return [layer, r2 - (len - current.length)];
  }
  function root6(e, P) {
    if (e.length === 0 || is_zero_column2(e[e.length - 1])) return void 0;
    let current_P = P;
    let tail_layer2 = compute_tail_layer(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right2 = current_P.length - 1;
      current_P = current_P[right2][1];
    }
    let right = current_P.length - 1;
    let b = index_of_last(current_P[right][0], (x) => x >= 0);
    let r2 = current_P[right][0][b];
    return [r2, b];
  }
  function ascension_vector3(e, r2, b) {
    let stack = [...e];
    let current = e;
    let tail_layer2 = compute_tail_layer(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right = current.length - 1;
      current = current[right][1];
      stack.push(...current);
    }
    let e_r = stack[r2];
    let e_right = stack[stack.length - 1];
    return Array.from({ length: b }, (_, j) => e_right[0][j] - e_r[0][j]);
  }
  function ascension_thresholds3(e, P, r2, b, thresholds_stack = []) {
    if (r2 === void 0) {
      return e.map((col) => [void 0, ascension_thresholds3(col[1], [], void 0, b, [])]);
    }
    const lS0 = thresholds_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = thresholds_stack.length;
      if (iS < r2 && i !== e.length - 1) {
        thresholds_stack.push(void 0);
        result[i] = [void 0, ascension_thresholds3(col[1], [], void 0, b, [])];
      } else {
        let Ai = void 0;
        if (iS === r2) {
          Ai = b;
        } else if (iS > r2) {
          Ai = 0;
          while (P[i][0][Ai] >= r2 && thresholds_stack[P[i][0][Ai]] > Ai) Ai++;
        }
        thresholds_stack.push(Ai);
        result[i] = [Ai, ascension_thresholds3(col[1], P[i][1], r2, b, thresholds_stack)];
      }
    }
    thresholds_stack.splice(lS0);
    return result;
  }
  function ascend_vector(v, A, V, w) {
    return v.map((x, i) => x + (i < A ? V[i] * w : 0));
  }
  function ascend_replace2(e, tail2, tail_layer2, A, V, w) {
    let result = [];
    for (let i = 0; i < e.length; i++) {
      if (tail_layer2 === 0 && i === e.length - 1) {
        result.push(...tail2);
      } else {
        const col = e[i];
        const Ai = A[i][0];
        const new_col_lower = ascend_vector(col[0], Ai ?? 0, V, w);
        const new_tail_layer = i !== e.length - 1 || tail_layer2 === void 0 ? void 0 : tail_layer2 - 1;
        result[i] = [new_col_lower, ascend_replace2(col[1], tail2, new_tail_layer, A[i][1], V, w)];
      }
    }
    return result;
  }
  function FS12(e, index, n) {
    if (is_infinity17(e)) return infinity_FS15(index, n);
    if (e.length === 0) return e;
    if (!is_limit11(e)) return e.slice(0, -1);
    const P = compute_parents(e, n);
    const [r2, b] = root6(e, P);
    const t_layer = compute_tail_layer(e);
    const [r_layer, ri] = compute_root_layer(e, r2);
    const A = ascension_thresholds3(e, P, r2, b);
    const V = ascension_vector3(e, r2, b);
    let current = e, current_A = A;
    for (let k = 0; k < r_layer; k++) {
      const right2 = current.length - 1;
      current = current[right2][1];
      current_A = current_A[right2][1];
    }
    const copy_part = current.slice(ri);
    const copy_part_A = current_A.slice(ri);
    for (let k = r_layer; k < t_layer; k++) {
      const right2 = current.length - 1;
      current = current[right2][1];
      current_A = current_A[right2][1];
    }
    const right = current.length - 1;
    const tail_top = current[right][1].slice(0, -1);
    const tail_top_A = current_A[right][1].slice(0, -1);
    let result = [];
    for (let w = index; w > 0; w--) {
      result = ascend_replace2(copy_part, result, t_layer - r_layer, copy_part_A, V, w);
      if (b === n) {
        result[0][1] = ascend_replace2(tail_top, [], void 0, tail_top_A, V, w - 1);
      }
    }
    result = ascend_replace2(e, result, t_layer, A, V, 0);
    return result;
  }
  var category_bm_bt_minus1_y_nss = {
    id: "category-bm-bt-minus1-y-nss",
    name: "Branching Transfinite -1Y-nSS",
    simple_name: "BT(-1)Y-nSS",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 0, initial: 3, create: (n) => BT_Minus1_Y_nSS(n) }
  };
  function BT_Minus1_Y_nSS(n) {
    return {
      id: "bt--1y-" + (n + 1) + "ss",
      category_id: "category-bm-bt-minus1-y-nss",
      name: "BT(-1)Y-" + (n + 1) + "SS",
      display: { plain: display9, from_display: (s) => from_display8(s, n) },
      is_limit: (e) => is_limit11(e),
      compare: compare15,
      FS: (e, index) => FS12(e, index, n),
      credit_text_id: "credit.community_y",
      init: () => [INFINITY16(), []]
    };
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/BT_star_Minus1_Y_nSS.ts
  function INFINITY17() {
    return [[[Infinity]]];
  }
  function ZERO_COLUMN2(n) {
    return [Array.from({ length: n }, () => 0), []];
  }
  function is_infinity18(e) {
    return "" + e === "Infinity";
  }
  function infinity_FS16(index, n) {
    let result = [];
    for (let i = index; i > 0; i--) {
      result = [[Array.from({ length: n }, () => i), [result]]];
    }
    return [ZERO_COLUMN2(n), ...result];
  }
  function is_zero_column3(c) {
    return c[0].every((x) => x === 0) && c[1].length === 0;
  }
  function top_display(e, html) {
    if (e.length === 0) return html ? "\u2217" : "*";
    let d_e = display10(e, html);
    return html ? "\u2217<sup>" + d_e + "</sup>" : "*^" + d_e;
  }
  function column_display6(c, html) {
    let result_list = [...c[0].map((x) => "" + x), ...c[1].map((x) => top_display(x, html))];
    while (result_list.length > 0 && result_list[result_list.length - 1] === "0") result_list.pop();
    return "(" + result_list.join(",") + ")";
  }
  function display10(e, html) {
    if (is_infinity18(e)) return "Limit";
    return e.map((c) => column_display6(c, html)).join("");
  }
  function is_limit12(e) {
    return is_infinity18(e) || e.length > 0 && !is_zero_column3(e[e.length - 1]);
  }
  function column_compare5(a, b) {
    return tuple_lex_compare(a, b, [lex_compare_by(number_compare), lex_compare_by(compare16)]);
  }
  function compare16(a, b) {
    return lex_compare(a, b, column_compare5);
  }
  function remove_base(a, base) {
    return a.map((col) => [col[0].map((x, i) => i === 0 ? x - base : x), col[1].map((x) => remove_base(x, base))]);
  }
  function highest_without_base(c) {
    return c[1].map((x) => remove_base(x, c[0][0] + 1));
  }
  function is_one_line_column(c, value) {
    return c[0][0] === value && c[0].slice(1).every((x) => x === 0) && c[1].length === 0;
  }
  function is_special_column(c) {
    let higher_right = c[1].length - 1;
    if (higher_right < 0) return false;
    let vert_right = c[1][higher_right].length - 1;
    if (vert_right < 0) return false;
    return is_one_line_column(c[1][higher_right][vert_right], c[0][0] + 1);
  }
  function compute_parents2(e, n, stack = [], parent_stack = [], forbidden_stack = []) {
    const lS0 = stack.length;
    let result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = stack.length;
      stack.push(e[i]);
      let result_i = Array.from({ length: n + 1 }, () => -1);
      parent_stack.push(result_i);
      for (let j = 0; j < n; j++) {
        let p2 = iS;
        while (p2 >= 0) {
          if (stack[p2][0][j] < col[0][j]) break;
          p2 = j === 0 ? p2 - 1 : parent_stack[p2][j - 1];
        }
        if (p2 < 0) break;
        result_i[j] = p2;
      }
      let p = iS;
      while (p >= 0) {
        if (!forbidden_stack.includes(p) && lex_compare(highest_without_base(stack[p]), highest_without_base(col), compare16) < 0)
          break;
        p = n === 0 ? p - 1 : parent_stack[p][n - 1];
      }
      result_i[n] = p;
      forbidden_stack.push(iS);
      result[i] = [result_i, col[1].map((x) => compute_parents2(x, n, stack, parent_stack, forbidden_stack))];
      forbidden_stack.pop();
    }
    stack.splice(lS0);
    parent_stack.splice(lS0);
    return result;
  }
  function compute_tail_layer2(e) {
    if (e.length === 0 || is_zero_column3(e[e.length - 1])) return [-1, false];
    let current = e, layer = 0;
    while (true) {
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      if (current[right][1].length === 0) {
        return [layer, false];
      }
      if (is_special_column(current[right])) {
        return [layer, true];
      }
      if (current[right][1][higher_right].length === 0) {
        return [layer, false];
      }
      current = current[right][1][higher_right];
      layer++;
    }
  }
  function compute_root_layer2(e, r2) {
    let layer = 0;
    let len = e.length;
    let current = e;
    while (len <= r2) {
      layer++;
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      current = current[right][1][higher_right];
      len += current.length;
    }
    return [layer, r2 - (len - current.length)];
  }
  function root7(e, P) {
    if (e.length === 0 || is_zero_column3(e[e.length - 1])) return void 0;
    let current_P = P;
    let [tail_layer2] = compute_tail_layer2(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right2 = current_P.length - 1;
      let higher_right = current_P[right2][1].length - 1;
      current_P = current_P[right2][1][higher_right];
    }
    let right = current_P.length - 1;
    let b = index_of_last(current_P[right][0], (x) => x >= 0);
    let r2 = current_P[right][0][b];
    return [r2, b];
  }
  function ascension_vector4(e, r2, b) {
    let stack = [...e];
    let current = e;
    let [tail_layer2] = compute_tail_layer2(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      current = current[right][1][higher_right];
      stack.push(...current);
    }
    let e_r = stack[r2];
    let e_right = stack[stack.length - 1];
    return Array.from({ length: b }, (_, j) => e_right[0][j] - e_r[0][j]);
  }
  function undefined_AT(e) {
    return e.map((col) => [void 0, col[1].map(undefined_AT)]);
  }
  function ascension_thresholds4(e, P, r2, b, thresholds_stack = []) {
    if (r2 === void 0) {
      return undefined_AT(e);
    }
    const lS0 = thresholds_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = thresholds_stack.length;
      if (iS < r2 && i !== e.length - 1) {
        thresholds_stack.push(void 0);
        result[i] = [void 0, col[1].map(undefined_AT)];
      } else {
        let Ai = void 0;
        if (iS === r2) {
          Ai = b;
        } else if (iS > r2) {
          Ai = 0;
          while (P[i][0][Ai] >= r2 && thresholds_stack[P[i][0][Ai]] > Ai) Ai++;
        }
        thresholds_stack.push(Ai);
        result[i] = [Ai, col[1].map((x, ix) => ascension_thresholds4(x, P[i][1][ix], r2, b, thresholds_stack))];
      }
    }
    thresholds_stack.splice(lS0);
    return result;
  }
  function ascend_vector2(v, A, V, w) {
    return v.map((x, i) => x + (i < A ? V[i] * w : 0));
  }
  function ascend_replace3(e, tail2, tail_layer2, A, V, w) {
    let result = [];
    for (let i = 0; i < e.length; i++) {
      if (tail_layer2 === 0 && i === e.length - 1) {
        result.push(...tail2);
      } else {
        const col = e[i];
        const Ai = A[i][0];
        const higher_right = col[1].length - 1;
        const new_col_lower = ascend_vector2(col[0], Ai ?? 0, V, w);
        const new_tail_layer = i !== e.length - 1 || tail_layer2 === void 0 ? void 0 : tail_layer2 - 1;
        result[i] = [
          new_col_lower,
          col[1].map(
            (x, ix) => ascend_replace3(x, tail2, ix === higher_right ? new_tail_layer : void 0, A[i][1][ix], V, w)
          )
        ];
      }
    }
    return result;
  }
  function FS_special(e, tail_layer2, index) {
    const right = e.length - 1;
    const higher_right = e[right][1].length - 1;
    if (tail_layer2 === 0) {
      let vert_right = e[right][1][higher_right].length - 1;
      let new_vert = e[right][1][higher_right].slice(0, vert_right);
      return [
        ...e.slice(0, right),
        [e[right][0], [...e[right][1].slice(0, higher_right), ...Array.from({ length: index }, () => new_vert)]]
      ];
    }
    return [
      ...e.slice(0, right),
      [
        e[right][0],
        [...e[right][1].slice(0, higher_right), FS_special(e[right][1][higher_right], tail_layer2 - 1, index)]
      ]
    ];
  }
  function FS13(e, index, n) {
    if (is_infinity18(e)) return infinity_FS16(index, n);
    if (e.length === 0) return e;
    if (!is_limit12(e)) return e.slice(0, -1);
    const P = compute_parents2(e, n);
    const [r2, b] = root7(e, P);
    const [t_layer, is_special2] = compute_tail_layer2(e);
    if (is_special2) return FS_special(e, t_layer, index);
    const [r_layer, ri] = compute_root_layer2(e, r2);
    const A = ascension_thresholds4(e, P, r2, b);
    const V = ascension_vector4(e, r2, b);
    let current = e, current_A = A;
    for (let k = 0; k < r_layer; k++) {
      const right2 = current.length - 1;
      const higher_right = current[right2][1].length - 1;
      current = current[right2][1][higher_right];
      current_A = current_A[right2][1][higher_right];
    }
    const copy_part = current.slice(ri);
    const copy_part_A = current_A.slice(ri);
    for (let k = r_layer; k < t_layer; k++) {
      const right2 = current.length - 1;
      const higher_right = current[right2][1].length - 1;
      current = current[right2][1][higher_right];
      current_A = current_A[right2][1][higher_right];
    }
    const right = current.length - 1;
    const tail_top = current[right][1].slice(0, -1);
    const tail_top_A = current_A[right][1].slice(0, -1);
    let result = [];
    for (let w = index; w > 0; w--) {
      result = ascend_replace3(copy_part, result, t_layer - r_layer, copy_part_A, V, w);
      if (b === n) {
        result[0][1] = tail_top.map((x, ix) => ascend_replace3(x, [], void 0, tail_top_A[ix], V, w - 1));
      }
    }
    result = ascend_replace3(e, result, t_layer, A, V, 0);
    return result;
  }
  function from_display9(s, n) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_higher() {
      if (i >= s.length || s[i] !== "*" && s[i] !== "\u2217") error();
      i++;
      skip_spaces();
      if (i < s.length && s[i] === "^") {
        i++;
        return parse_expr();
      }
      return [];
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const numbers = [];
      const higher = [];
      skip_spaces();
      while (i < s.length && s[i] !== ")" && s[i] >= "0" && s[i] <= "9" && numbers.length < n) {
        numbers.push(parse_number());
        skip_spaces();
        if (i < s.length && s[i] === ",") i++;
        skip_spaces();
      }
      while (i < s.length && s[i] !== ")") {
        skip_spaces();
        if (s[i] === "*" || s[i] === "\u2217") {
          if (numbers.length !== n) error();
          higher.push(parse_higher());
        } else {
          error();
        }
        skip_spaces();
        if (i < s.length && s[i] === ",") i++;
      }
      if (i >= s.length) error();
      i++;
      const arr = numbers.slice(0, n);
      while (arr.length < n) arr.push(0);
      return [arr, higher];
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY17();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  var category_bm_bt_star_minus1_y_nss = {
    id: "category-bm-bt-star-minus1-y-nss",
    name: "Branching Transfinite* -1Y-nSS",
    simple_name: "BT*(-1)Y-nSS",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 1, initial: 3, create: (n) => BT_star_Minus1_Y_nSS(n) }
  };
  function BT_star_Minus1_Y_nSS(n) {
    return {
      id: "bt*--1y-" + (n + 1) + "ss",
      category_id: "category-bm-bt-star-minus1-y-nss",
      name: "BT*(-1)Y-" + (n + 1) + "SS",
      display: {
        plain: (e) => display10(e, false),
        html: (e) => display10(e, true),
        from_display: (s) => from_display9(s, n)
      },
      is_limit: (e) => is_limit12(e),
      compare: compare16,
      FS: (e, index) => FS13(e, index, n),
      credit_text_id: "credit.asheep",
      init: () => [INFINITY17(), []]
    };
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/BT_star_Minus1_Y_nSS'.ts
  function INFINITY18() {
    return [[[Infinity]]];
  }
  function ZERO_COLUMN3(n) {
    return [Array.from({ length: n }, () => 0), []];
  }
  function is_infinity19(e) {
    return "" + e === "Infinity";
  }
  function infinity_FS17(index, n) {
    let result = [];
    for (let i = index; i > 0; i--) {
      result = [[Array.from({ length: n }, () => i), [result]]];
    }
    return [ZERO_COLUMN3(n), ...result];
  }
  function is_zero_column4(c) {
    return c[0].every((x) => x === 0) && c[1].length === 0;
  }
  function top_display2(e, html) {
    if (e.length === 0) return html ? "\u2217" : "*";
    let d_e = display11(e, html);
    return html ? "\u2217<sup>" + d_e + "</sup>" : "*^" + d_e;
  }
  function column_display7(c, html) {
    let result_list = [...c[0].map((x) => "" + x), ...c[1].map((x) => top_display2(x, html))];
    while (result_list.length > 0 && result_list[result_list.length - 1] === "0") result_list.pop();
    return "(" + result_list.join(",") + ")";
  }
  function display11(e, html) {
    if (is_infinity19(e)) return "Limit";
    return e.map((c) => column_display7(c, html)).join("");
  }
  function is_limit13(e) {
    return is_infinity19(e) || e.length > 0 && !is_zero_column4(e[e.length - 1]);
  }
  function column_compare6(a, b) {
    return tuple_lex_compare(a, b, [lex_compare_by(number_compare), lex_compare_by(compare17)]);
  }
  function compare17(a, b) {
    return lex_compare(a, b, column_compare6);
  }
  function is_one_line_column2(c, value) {
    return c[0][0] === value && c[0].slice(1).every((x) => x === 0) && c[1].length === 0;
  }
  function is_special_column2(c) {
    let higher_right = c[1].length - 1;
    if (higher_right < 0) return false;
    let vert_right = c[1][higher_right].length - 1;
    if (vert_right < 0) return false;
    return is_one_line_column2(c[1][higher_right][vert_right], c[0][0] + 1);
  }
  function compute_lower_parents(e, n, stack = [], parent_stack = []) {
    const lS0 = stack.length;
    let result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = stack.length;
      stack.push(e[i]);
      let result_i = Array.from({ length: n + 1 }, () => -1);
      parent_stack.push(result_i);
      for (let j = 0; j < n; j++) {
        let p = iS;
        while (p >= 0) {
          if (stack[p][0][j] < col[0][j]) break;
          p = j === 0 ? p - 1 : parent_stack[p][j - 1];
        }
        if (p < 0) break;
        result_i[j] = p;
      }
      result[i] = [result_i, col[1].map((x) => compute_lower_parents(x, n, stack, parent_stack))];
    }
    stack.splice(lS0);
    parent_stack.splice(lS0);
    return result;
  }
  function undefined_AT2(e) {
    return e.map((col) => [void 0, col[1].map(undefined_AT2)]);
  }
  function ascension_thresholds5(e, P, r2, b, thresholds_stack = []) {
    if (r2 === void 0) {
      return undefined_AT2(e);
    }
    const lS0 = thresholds_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = thresholds_stack.length;
      if (iS < r2 && i !== e.length - 1) {
        thresholds_stack.push(void 0);
        result[i] = [void 0, col[1].map(undefined_AT2)];
      } else {
        let Ai = void 0;
        if (iS === r2) {
          Ai = b;
        } else if (iS > r2) {
          Ai = 0;
          while (P[i][0][Ai] >= r2 && thresholds_stack[P[i][0][Ai]] > Ai) Ai++;
        }
        thresholds_stack.push(Ai);
        result[i] = [Ai, col[1].map((x, ix) => ascension_thresholds5(x, P[i][1][ix], r2, b, thresholds_stack))];
      }
    }
    thresholds_stack.splice(lS0);
    return result;
  }
  function top_comparison_key(base, current, thresholds, n) {
    const result = [];
    for (let i = 0; i < current.length; i++) {
      const [col, col_children] = current[i];
      const [t, t_children] = thresholds[i];
      const result_i_lower = Array.from(
        { length: n },
        (_, j) => j < t ? [true, col[j] - base[0][j]] : [false, col[j]]
      );
      const result_i_higher = Array.from(
        { length: col_children.length },
        (_, j) => top_comparison_key(base, col_children[j], t_children[j], n)
      );
      result.push([result_i_lower, result_i_higher]);
    }
    return result;
  }
  function compare_key(k1, k2) {
    return lex_compare(
      k1,
      k2,
      tuple_lex_compare_by([
        lex_compare_by(tuple_lex_compare_by([boolean_compare, number_compare])),
        lex_compare_by(compare_key)
      ])
    );
  }
  function fill_top_parents(e, P, n, parent_stack = [], key_stack = [], outer_stack = []) {
    const lS0 = parent_stack.length;
    let result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const Pi = P[i];
      const iS = parent_stack.length;
      parent_stack.push(P[i][0]);
      const [[, AT]] = ascension_thresholds5(
        [col],
        [Pi],
        iS,
        n,
        Array(iS).fill(void 0)
      );
      const key = col[1].map((col_top, j) => top_comparison_key(col, col_top, AT[j], n));
      key_stack.push(key);
      let p = iS;
      while (p >= 0) {
        if (!outer_stack.includes(p) && lex_compare(key_stack[p], key, compare_key) < 0) break;
        p = parent_stack[p][n - 1];
      }
      Pi[0][n] = p;
      outer_stack.push(iS);
      for (let j = 0; j < col[1].length; j++) {
        fill_top_parents(col[1][j], Pi[1][j], n, parent_stack, key_stack, outer_stack);
      }
      outer_stack.pop();
    }
    parent_stack.splice(lS0);
    key_stack.splice(lS0);
    return result;
  }
  function compute_parents3(e, n) {
    const P = compute_lower_parents(e, n);
    fill_top_parents(e, P, n);
    return P;
  }
  function compute_tail_layer3(e) {
    if (e.length === 0 || is_zero_column4(e[e.length - 1])) return [-1, false];
    let current = e, layer = 0;
    while (true) {
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      if (current[right][1].length === 0) {
        return [layer, false];
      }
      if (is_special_column2(current[right])) {
        return [layer, true];
      }
      if (current[right][1][higher_right].length === 0) {
        return [layer, false];
      }
      current = current[right][1][higher_right];
      layer++;
    }
  }
  function compute_root_layer3(e, r2) {
    let layer = 0;
    let len = e.length;
    let current = e;
    while (len <= r2) {
      layer++;
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      current = current[right][1][higher_right];
      len += current.length;
    }
    return [layer, r2 - (len - current.length)];
  }
  function root8(e, P) {
    if (e.length === 0 || is_zero_column4(e[e.length - 1])) return void 0;
    let current_P = P;
    let [tail_layer2] = compute_tail_layer3(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right2 = current_P.length - 1;
      let higher_right = current_P[right2][1].length - 1;
      current_P = current_P[right2][1][higher_right];
    }
    let right = current_P.length - 1;
    let b = index_of_last(current_P[right][0], (x) => x >= 0);
    let r2 = current_P[right][0][b];
    return [r2, b];
  }
  function ascension_vector5(e, r2, b) {
    let stack = [...e];
    let current = e;
    let [tail_layer2] = compute_tail_layer3(e);
    for (let k = 0; k < tail_layer2; k++) {
      let right = current.length - 1;
      let higher_right = current[right][1].length - 1;
      current = current[right][1][higher_right];
      stack.push(...current);
    }
    let e_r = stack[r2];
    let e_right = stack[stack.length - 1];
    return Array.from({ length: b }, (_, j) => e_right[0][j] - e_r[0][j]);
  }
  function ascend_vector3(v, A, V, w) {
    return v.map((x, i) => x + (i < A ? V[i] * w : 0));
  }
  function ascend_replace4(e, tail2, tail_layer2, A, V, w) {
    let result = [];
    for (let i = 0; i < e.length; i++) {
      if (tail_layer2 === 0 && i === e.length - 1) {
        result.push(...tail2);
      } else {
        const col = e[i];
        const Ai = A[i][0];
        const higher_right = col[1].length - 1;
        const new_col_lower = ascend_vector3(col[0], Ai ?? 0, V, w);
        const new_tail_layer = i !== e.length - 1 || tail_layer2 === void 0 ? void 0 : tail_layer2 - 1;
        result[i] = [
          new_col_lower,
          col[1].map(
            (x, ix) => ascend_replace4(x, tail2, ix === higher_right ? new_tail_layer : void 0, A[i][1][ix], V, w)
          )
        ];
      }
    }
    return result;
  }
  function FS_special2(e, tail_layer2, index) {
    const right = e.length - 1;
    const higher_right = e[right][1].length - 1;
    if (tail_layer2 === 0) {
      let vert_right = e[right][1][higher_right].length - 1;
      let new_vert = e[right][1][higher_right].slice(0, vert_right);
      return [
        ...e.slice(0, right),
        [e[right][0], [...e[right][1].slice(0, higher_right), ...Array.from({ length: index }, () => new_vert)]]
      ];
    }
    return [
      ...e.slice(0, right),
      [
        e[right][0],
        [...e[right][1].slice(0, higher_right), FS_special2(e[right][1][higher_right], tail_layer2 - 1, index)]
      ]
    ];
  }
  function FS14(e, index, n) {
    if (is_infinity19(e)) return infinity_FS17(index, n);
    if (e.length === 0) return e;
    if (!is_limit13(e)) return e.slice(0, -1);
    const P = compute_parents3(e, n);
    const [r2, b] = root8(e, P);
    const [t_layer, is_special2] = compute_tail_layer3(e);
    if (is_special2) return FS_special2(e, t_layer, index);
    const [r_layer, ri] = compute_root_layer3(e, r2);
    const A = ascension_thresholds5(e, P, r2, b);
    const V = ascension_vector5(e, r2, b);
    let current = e, current_A = A;
    for (let k = 0; k < r_layer; k++) {
      const right2 = current.length - 1;
      const higher_right = current[right2][1].length - 1;
      current = current[right2][1][higher_right];
      current_A = current_A[right2][1][higher_right];
    }
    const copy_part = current.slice(ri);
    const copy_part_A = current_A.slice(ri);
    for (let k = r_layer; k < t_layer; k++) {
      const right2 = current.length - 1;
      const higher_right = current[right2][1].length - 1;
      current = current[right2][1][higher_right];
      current_A = current_A[right2][1][higher_right];
    }
    const right = current.length - 1;
    const tail_top = current[right][1].slice(0, -1);
    const tail_top_A = current_A[right][1].slice(0, -1);
    let result = [];
    for (let w = index; w > 0; w--) {
      result = ascend_replace4(copy_part, result, t_layer - r_layer, copy_part_A, V, w);
      if (b === n) {
        result[0][1] = tail_top.map((x, ix) => ascend_replace4(x, [], void 0, tail_top_A[ix], V, w - 1));
      }
    }
    result = ascend_replace4(e, result, t_layer, A, V, 0);
    return result;
  }
  function from_display10(s, n) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_higher() {
      if (i >= s.length || s[i] !== "*" && s[i] !== "\u2217") error();
      i++;
      skip_spaces();
      if (i < s.length && s[i] === "^") {
        i++;
        return parse_expr();
      }
      return [];
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const numbers = [];
      const higher = [];
      skip_spaces();
      while (i < s.length && s[i] !== ")" && s[i] >= "0" && s[i] <= "9" && numbers.length < n) {
        numbers.push(parse_number());
        skip_spaces();
        if (i < s.length && s[i] === ",") i++;
        skip_spaces();
      }
      while (i < s.length && s[i] !== ")") {
        skip_spaces();
        if (s[i] === "*" || s[i] === "\u2217") {
          if (numbers.length !== n) error();
          higher.push(parse_higher());
        } else {
          error();
        }
        skip_spaces();
        if (i < s.length && s[i] === ",") i++;
      }
      if (i >= s.length) error();
      i++;
      const arr = numbers.slice(0, n);
      while (arr.length < n) arr.push(0);
      return [arr, higher];
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY18();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  var category_bm_bt_star_minus1_y_nss1 = {
    id: "category-bm-bt-star-minus1-y-nss'",
    name: "Branching Transfinite* -1Y-nSS'",
    simple_name: "BT*(-1)Y-nSS'",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 1, initial: 3, create: (n) => BT_star_Minus1_Y_nSS1(n) }
  };
  function BT_star_Minus1_Y_nSS1(n) {
    return {
      id: "bt*--1y-" + (n + 1) + "ss'",
      category_id: "category-bm-bt-star-minus1-y-nss'",
      name: "BT*(-1)Y-" + (n + 1) + "SS'",
      display: {
        plain: (e) => display11(e, false),
        html: (e) => display11(e, true),
        from_display: (s) => from_display10(s, n)
      },
      is_limit: (e) => is_limit13(e),
      compare: compare17,
      FS: (e, index) => FS14(e, index, n),
      credit_text_id: "credit.asheep",
      init: () => [INFINITY18(), []]
    };
  }

  // src/notations/BM-like/Minus1_Y_nSS-series/BTL_Minus1_Y_nSS.ts
  function compactify(e) {
    if (is_infinity20(e)) return INFINITY_compact();
    return e.map(({ lower, mark: mark4, higher }) => [lower, mark4, higher.map(compactify)]);
  }
  function decompactify(e) {
    if (is_infinity20(e)) return INFINITY19();
    return e.map((col) => ({ lower: col[0], mark: col[1], higher: col[2].map(decompactify) }));
  }
  function INFINITY19() {
    return Infinity;
  }
  function INFINITY_compact() {
    return Infinity;
  }
  function is_infinity20(e) {
    return "" + e === "Infinity";
  }
  function ZERO_COLUMN4(n) {
    return { lower: Array.from({ length: n }, () => 0), mark: 0, higher: [] };
  }
  function infinity_FS18(index, n) {
    let result = [];
    for (let i = index; i > 0; i--) {
      result = [{ lower: Array.from({ length: n }, () => i), mark: i, higher: [result] }];
    }
    return [ZERO_COLUMN4(n), ...result];
  }
  function is_zero_column5(col) {
    return col.lower.every((x) => x === 0) && col.higher.length === 0;
  }
  function top_display3(e, u, html, use_sc) {
    if (e.length === 0) return "" + u;
    let d_e = display12(e, html, use_sc);
    return html ? "" + u + "<sup>" + d_e + "</sup>" : "" + u + "^" + d_e;
  }
  function column_display8(col, html, use_sc) {
    if (col.higher.length > 0) {
      let higher_display = col.higher.map((x) => top_display3(x, col.mark, html, use_sc));
      if (use_sc) {
        return "(" + col.lower + ";" + higher_display + ")";
      } else {
        let j = col.lower.length;
        if (col.higher[0].length > 0) {
          j = index_of_last(col.lower, (x) => x !== col.mark) + 1;
        }
        return "(" + [...col.lower.slice(0, j), ...higher_display].join(",") + ")";
      }
    } else {
      let j = index_of_last(col.lower, (x) => x > 0) + 1;
      return "(" + col.lower.slice(0, j) + ")";
    }
  }
  function display12(e, html, separate) {
    if (is_infinity20(e)) return "Limit";
    return e.map((c) => column_display8(c, html, separate)).join("");
  }
  function is_limit14(e) {
    return is_infinity20(e) || e.length > 0 && !is_zero_column5(e[e.length - 1]);
  }
  function column_compare7(a, b) {
    return object_lex_compare(
      a,
      b,
      {
        lower: lex_compare_by(number_compare),
        mark: number_compare,
        higher: lex_compare_by(compare18)
      },
      ["lower", "mark", "higher"]
    );
  }
  function compare18(a, b) {
    return lex_compare(a, b, column_compare7);
  }
  function remove_base2(e, base) {
    function expr_remove_base(a) {
      return a.map(col_remove_base);
    }
    function col_remove_base(col) {
      return {
        lower: col.lower.map((x, i) => i === 0 ? x - base : x),
        mark: col.mark,
        higher: col.higher.map(expr_remove_base)
      };
    }
    return expr_remove_base(e);
  }
  function higher_remove_base(c) {
    return c.higher.map((x) => remove_base2(x, c.lower[0] + 1));
  }
  function is_one_line_column3(c, value) {
    return c.lower[0] === value && c.lower.slice(1).every((x) => x === 0) && c.higher.length === 0;
  }
  function compute_parents4(e, n, column_stack = [], parent_stack = [], outer_stack = []) {
    const lS0 = column_stack.length;
    let result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = column_stack.length;
      column_stack.push(e[i]);
      let result_i = {
        entry_parents: Array.from({ length: n + 1 }, () => -1),
        type: void 0,
        is_tail: false
      };
      parent_stack.push(result_i);
      for (let j = 0; j < n; j++) {
        let p = iS;
        while (p >= 0) {
          if (column_stack[p].lower[j] < col.lower[j]) break;
          p = j === 0 ? p - 1 : parent_stack[p].entry_parents[j - 1];
        }
        if (p < 0) break;
        result_i.entry_parents[j] = p;
      }
      {
        let p = iS;
        while (p >= 0) {
          if (column_stack[p].mark < col.mark && outer_stack.includes(p)) {
            result_i.type = "mark";
            if (col.higher.length === 1 && col.higher[0].length === 0) {
              result_i.type = "mark*";
            }
            break;
          } else if (column_stack[p].mark <= col.mark && !outer_stack.includes(p) && lex_compare(higher_remove_base(column_stack[p]), higher_remove_base(col), compare18) < 0) {
            result_i.type = "higher";
            break;
          }
          p = parent_stack[p].entry_parents[n - 1];
        }
        result_i.entry_parents[n] = p;
        if (p < 0) {
          if (lS0 > 0 && is_one_line_column3(col, column_stack[lS0 - 1].lower[0] + 1)) {
            result_i.type = "star";
          } else {
            result_i.type = "lower";
          }
          result_i.is_tail = true;
        } else {
          const higher_right = col.higher.length - 1;
          if (col.higher[higher_right].length === 0) result_i.is_tail = true;
        }
      }
      outer_stack.push(iS);
      result[i] = {
        ...result_i,
        higher: col.higher.map((x) => compute_parents4(x, n, column_stack, parent_stack, outer_stack))
      };
      outer_stack.pop();
    }
    column_stack.splice(lS0);
    parent_stack.splice(lS0);
    return result;
  }
  function get_right_higher(e) {
    const right = e.length - 1;
    let higher_right = e[right].higher.length - 1;
    return e[right].higher[higher_right];
  }
  function skip_to_layer(e, layer) {
    let current = e;
    for (let k = 0; k < layer; k++) current = get_right_higher(current);
    return current;
  }
  function compute_tail_info(P) {
    let current_P = P, layer = 0;
    while (true) {
      const right = current_P.length - 1;
      if (current_P[right].is_tail) return [layer, current_P[right].type];
      current_P = get_right_higher(current_P);
      layer++;
    }
  }
  function root9(P, t_layer) {
    let current_P = P;
    for (let k = 0; k < t_layer; k++) {
      let right2 = current_P.length - 1;
      let higher_right = current_P[right2].higher.length - 1;
      current_P = current_P[right2].higher[higher_right];
    }
    let right = current_P.length - 1;
    let b = index_of_last(current_P[right].entry_parents, (x) => x >= 0);
    let r2 = current_P[right].entry_parents[b];
    return [r2, b];
  }
  function compute_root_layer4(e, r2) {
    let layer = 0;
    let len = e.length;
    let current = e;
    while (len <= r2) {
      layer++;
      current = get_right_higher(current);
      len += current.length;
    }
    return [layer, r2 - (len - current.length)];
  }
  function ascension_vector6(e, r2, b, t_layer) {
    let stack = [...e];
    let current = e;
    for (let k = 0; k < t_layer; k++) {
      let right = current.length - 1;
      let higher_right = current[right].higher.length - 1;
      current = current[right].higher[higher_right];
      stack.push(...current);
    }
    let e_r = stack[r2];
    let e_right = stack[stack.length - 1];
    return Array.from({ length: b }, (_, j) => e_right.lower[j] - e_r.lower[j]);
  }
  function undefined_AT3(e) {
    return e.map((col) => ({ higher: col.higher.map(undefined_AT3) }));
  }
  function ascension_thresholds6(e, P, r2, b, thresholds_stack = []) {
    if (r2 === void 0) {
      return undefined_AT3(e);
    }
    const lS0 = thresholds_stack.length;
    const result = [];
    for (let i = 0; i < e.length; i++) {
      const col = e[i];
      const iS = thresholds_stack.length;
      if (iS < r2 && i !== e.length - 1) {
        thresholds_stack.push(void 0);
        result[i] = { higher: col.higher.map(undefined_AT3) };
      } else {
        let Ai = void 0;
        if (iS === r2) {
          Ai = b;
        } else if (iS > r2) {
          Ai = 0;
          while (P[i].entry_parents[Ai] >= r2 && thresholds_stack[P[i].entry_parents[Ai]] > Ai) Ai++;
        }
        thresholds_stack.push(Ai);
        result[i] = {
          threshold: Ai,
          higher: col.higher.map((x, ix) => ascension_thresholds6(x, P[i].higher[ix], r2, b, thresholds_stack))
        };
      }
    }
    thresholds_stack.splice(lS0);
    return result;
  }
  function ascend_vector4(v, A, V, w) {
    return v.map((x, i) => x + (i < A ? V[i] * w : 0));
  }
  function ascend_replace5(e, tail2, t_layer, A, V, w) {
    let result = [];
    for (let i = 0; i < e.length; i++) {
      if (t_layer === 0 && i === e.length - 1) {
        result.push(...tail2);
      } else {
        const col = e[i];
        const Ai = A[i].threshold;
        const higher_right = col.higher.length - 1;
        const new_col_lower = ascend_vector4(col.lower, Ai ?? 0, V, w);
        const new_tail_layer = i !== e.length - 1 || t_layer === void 0 ? void 0 : t_layer - 1;
        result[i] = {
          lower: new_col_lower,
          mark: col.mark,
          higher: col.higher.map(
            (x, ix) => ascend_replace5(x, tail2, ix === higher_right ? new_tail_layer : void 0, A[i].higher[ix], V, w)
          )
        };
        if (result[i].higher.length === 0) result[i].mark = 0;
      }
    }
    return result;
  }
  function FS_star(e, tail_layer2, index) {
    const right = e.length - 1;
    const higher_right = e[right].higher.length - 1;
    if (tail_layer2 === 1) {
      let vert_right = e[right].higher[higher_right].length - 1;
      let new_vert = e[right].higher[higher_right].slice(0, vert_right);
      return [
        ...e.slice(0, right),
        {
          lower: e[right].lower,
          mark: higher_right === 0 && index === 0 ? 0 : e[right].mark,
          higher: [...e[right].higher.slice(0, higher_right), ...Array.from({ length: index }, () => new_vert)]
        }
      ];
    }
    return [
      ...e.slice(0, right),
      {
        lower: e[right].lower,
        mark: e[right].mark,
        higher: [
          ...e[right].higher.slice(0, higher_right),
          FS_star(e[right].higher[higher_right], tail_layer2 - 1, index)
        ]
      }
    ];
  }
  function FS15(e, index, n) {
    if (is_infinity20(e)) return infinity_FS18(index, n);
    if (e.length === 0) return e;
    if (!is_limit14(e)) return e.slice(0, -1);
    const P = compute_parents4(e, n);
    const [t_layer, type] = compute_tail_info(P);
    if (type === void 0) return e.slice(0, -1);
    if (type === "star") return FS_star(e, t_layer, index);
    const [r2, b] = root9(P, t_layer);
    const [r_layer, ri] = compute_root_layer4(e, r2);
    const V = ascension_vector6(e, r2, b, t_layer);
    const A = ascension_thresholds6(e, P, r2, b);
    let copy_part = skip_to_layer(e, r_layer).slice(ri);
    let copy_part_A = skip_to_layer(A, r_layer).slice(ri);
    let diff_layer = t_layer - r_layer;
    if (type === "mark") {
      const higher_right = copy_part[0].higher.length - 1;
      copy_part = [
        {
          lower: copy_part[0].lower,
          mark: 0,
          higher: []
        },
        ...copy_part[0].higher[higher_right]
      ];
      copy_part_A = [
        {
          threshold: b,
          higher: []
        },
        ...copy_part_A[0].higher[higher_right]
      ];
      diff_layer--;
    }
    const current = skip_to_layer(e, t_layer);
    const current_A = skip_to_layer(A, t_layer);
    const right = current.length - 1;
    const tail_top = current[right].higher.slice(0, -1);
    const tail_top_A = current_A[right].higher.slice(0, -1);
    const tail_mark = tail_top.length === 0 ? 0 : current[right].mark;
    let result = [];
    for (let w = index; w > 0; w--) {
      result = ascend_replace5(copy_part, result, diff_layer, copy_part_A, V, w);
      if (type === "higher" || type === "mark") {
        result[0].mark = tail_mark;
        result[0].higher = tail_top.map((x, ix) => ascend_replace5(x, [], void 0, tail_top_A[ix], V, w - 1));
      }
    }
    result = ascend_replace5(e, result, t_layer, A, V, 0);
    return result;
  }
  function from_display11(s, n) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const numbers = [];
      const higher = [];
      let mark4;
      let in_higher = false;
      let expect_value = true;
      while (i < s.length && s[i] !== ")") {
        skip_spaces();
        if (i >= s.length) break;
        if (s[i] === "," || s[i] === ";") {
          if (expect_value) error();
          if (s[i] === ";") {
            if (numbers.length !== n) error();
            in_higher = true;
          }
          i++;
          expect_value = true;
          continue;
        }
        if (!expect_value) error();
        const m = parse_number();
        skip_spaces();
        if (i < s.length && s[i] === "^") {
          in_higher = true;
          if (mark4 === void 0) {
            mark4 = m;
          } else if (m !== mark4) {
            error();
          }
          i++;
          higher.push(parse_expr());
        } else if (in_higher || numbers.length >= n) {
          if (mark4 === void 0) {
            mark4 = m;
          } else if (m !== mark4) {
            error();
          }
          higher.push([]);
        } else {
          numbers.push(m);
        }
        expect_value = false;
      }
      if (i >= s.length) error();
      i++;
      while (numbers.length < n) numbers.push(mark4 ?? 0);
      const final_mark = higher.length === 0 ? 0 : mark4 ?? 0;
      if (higher.length > 0 && final_mark === 0) error();
      return { lower: numbers, mark: final_mark, higher };
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY19();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  var category_bm_btl_minus1_y_nss = {
    id: "category-bm-btl-minus1-y-nss",
    name: "Asheep's Transfinite nSS",
    simple_name: "ATnSS",
    parent_id: "category-minus1-y-nss-series",
    generator: { start: 1, initial: 3, create: (n) => BTL_Minus1_Y_nSS(n) }
  };
  function BTL_Minus1_Y_nSS(n) {
    return {
      id: "btl--1y-" + (n + 1) + "ss",
      category_id: "category-bm-btl-minus1-y-nss",
      name: "AT" + (n + 1) + "SS",
      display: {
        plain: (e) => display12(decompactify(e), false, true),
        html: (e) => display12(decompactify(e), true, true),
        from_display: (s) => compactify(from_display11(s, n))
      },
      display_equiv: {
        combined: {
          plain: (e) => display12(decompactify(e), false, false),
          html: (e) => display12(decompactify(e), true, false),
          from_display: (s) => compactify(from_display11(s, n)),
          name_id: "display.btl-m1y-nss-combined"
        }
      },
      is_limit: (e) => is_limit14(decompactify(e)),
      compare: (a, b) => compare18(decompactify(a), decompactify(b)),
      FS: (e, index) => compactify(FS15(decompactify(e), index, n)),
      credit_text_id: "credit.asheep",
      init: () => [INFINITY_compact(), []]
    };
  }

  // src/notations/MN/Omega_MN.ts
  function INFINITY20() {
    return [[[Infinity]]];
  }
  function is_infinity21(m) {
    return ("" + m).startsWith("Infinity");
  }
  function entry_compare2(a, b) {
    return lex_compare(a, b, number_compare);
  }
  function column_compare8(a, b) {
    return lex_compare(a, b, entry_compare2);
  }
  function mountain_compare(a, b) {
    if (is_infinity21(a) && is_infinity21(b)) return 0;
    if (is_infinity21(a)) return 1;
    if (is_infinity21(b)) return -1;
    return lex_compare(a, b, column_compare8);
  }
  function mountain_is_limit(m) {
    return is_infinity21(m) || m.length > 0 && m[m.length - 1].length > 0;
  }
  function sep_display(sep, simple) {
    if (simple && sep === 0) return "";
    return ",".repeat(sep + 1);
  }
  function vertical_display2(v) {
    return v.map((s) => sep_display(s, false)).join("/");
  }
  function entry_display2([v, sep], simple) {
    let d_sep = sep_display(sep, simple);
    let d_v = "" + v;
    if (simple && d_v.length >= 2) d_v = "(" + d_v + ")";
    return d_sep + d_v;
  }
  function column_display9(col, simple) {
    if (simple && col.length === 0) return "0";
    let result = col.map((e) => entry_display2(e, simple)).join("");
    return simple ? result : "(" + result + ")";
  }
  function mountain_display(m, simple) {
    if (is_infinity21(m)) return "Limit";
    return m.map((col) => column_display9(col, simple)).join(simple ? " " : "");
  }
  function to_data_key(m) {
    return mountain_display(m, true);
  }
  function mountain_from_display(str) {
    if (str === "Limit") return [[[Infinity]]];
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + str);
    }
    function skip_spaces() {
      while (i < str.length && str[i] === " ") i++;
    }
    function skip_index() {
      if (i < str.length && str[i] === ":") {
        i++;
        skip_spaces();
        while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      }
    }
    function parse_sep() {
      let count = 0;
      while (i < str.length && str[i] === ",") {
        count++;
        i++;
      }
      return count === 0 ? 0 : count - 1;
    }
    function parse_number() {
      const start = i;
      while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      if (start === i) error();
      return parseInt(str.substring(start, i), 10);
    }
    function parse_parenthesized_column() {
      i++;
      const col = [];
      skip_spaces();
      while (i < str.length && str[i] !== ")" && str[i] !== ":") {
        skip_spaces();
        const sep = parse_sep();
        skip_spaces();
        const v = parse_number();
        col.push([v, sep]);
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= str.length || str[i] !== ")") error();
      i++;
      return col;
    }
    function parse_unparenthesized_column() {
      skip_spaces();
      if (i >= str.length) error();
      if (str[i] === "0" && (i + 1 >= str.length || str[i + 1] === ":" || str[i + 1] === " " || str[i + 1] === "(" || str[i + 1] === ",")) {
        i++;
        skip_index();
        return [];
      }
      const col = [];
      while (i < str.length && str[i] !== " " && str[i] !== "(" && str[i] !== ":") {
        if (str[i] === ",") {
          const sep = parse_sep();
          skip_spaces();
          const v = parse_number();
          col.push([v, sep]);
        } else {
          error();
        }
      }
      skip_index();
      return col;
    }
    const result = [];
    skip_spaces();
    while (i < str.length) {
      if (str[i] === "(") {
        result.push(parse_parenthesized_column());
      } else {
        result.push(parse_unparenthesized_column());
      }
      skip_spaces();
    }
    return result;
  }
  function from_display_simple2(s) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_sep() {
      let count = 0;
      while (i < s.length && s[i] === ",") {
        count++;
        i++;
      }
      return count === 0 ? 0 : count - 1;
    }
    function parse_entry() {
      const sep = parse_sep();
      let v;
      if (i < s.length && s[i] === "(") {
        i++;
        const start = i;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
        if (start === i) error();
        if (i >= s.length || s[i] !== ")") error();
        v = parseInt(s.substring(start, i), 10);
        i++;
      } else if (i < s.length && s[i] >= "0" && s[i] <= "9") {
        v = s.charCodeAt(i) - 48;
        i++;
      } else {
        error();
      }
      return [v, sep];
    }
    function parse_column() {
      const col = [];
      while (i < s.length && s[i] !== " ") {
        col.push(parse_entry());
      }
      return col;
    }
    function parse_expr() {
      const result2 = [];
      while (true) {
        skip_spaces();
        if (i >= s.length) break;
        if (s[i] === "0" && (i + 1 >= s.length || s[i + 1] === " ")) {
          result2.push([]);
          i++;
          continue;
        }
        result2.push(parse_column());
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY20();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function vertical_compare4(a, b) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  }
  function vertical_diff(v1, v2) {
    let i = 0;
    while (i < v2.length && v1[i] === v2[i]) i++;
    return v1[i];
  }
  function vertical_increase4(v, s) {
    let i = v.length;
    while (i > 0 && v[i - 1] < s) --i;
    return v.slice(0, i).concat([s]);
  }
  function find_index_below_row(Vi, v) {
    const working = [[]].concat(Vi);
    let i1 = 0, i2 = working.length - 1;
    while (i1 < i2) {
      const i = Math.ceil((i1 + i2) / 2);
      if (vertical_compare4(working[i], v) < 0) i1 = i;
      else i2 = i - 1;
    }
    return i1;
  }
  function parent2(m, V, [i, j]) {
    const pi = m[i][j][0] - 1;
    const pj = find_index_below_row(V[pi], V[i][j]);
    return [pi, pj];
  }
  function column_verticals2(column) {
    const v = [[]];
    for (let j = 0; j < column.length; j++) v.push(vertical_increase4(v[j], column[j][1]));
    return v.slice(1);
  }
  function mountain_verticals(m) {
    return m.map(column_verticals2);
  }
  function get_references(m, r_tops) {
    const verticals = column_verticals2(m[m.length - 1]);
    verticals.unshift([]);
    const ref = [];
    let i = 0, j = 0;
    while (i < verticals.length && j < r_tops.length) {
      if (vertical_compare4(verticals[i], r_tops[j]) < 0) {
        ref[j] = i;
        i++;
      } else {
        j++;
      }
    }
    return ref;
  }
  function expand7(m0, index, shorter = false) {
    const rightmost = m0.length - 1;
    const topmost = m0[rightmost].length - 1;
    const m = deepcopy(m0);
    if (topmost === -1) {
      m.pop();
      return m;
    }
    const tr_entry = m[rightmost][topmost];
    const tr_separator = tr_entry[1];
    const V0 = mountain_verticals(m);
    const BRij = parent2(m, V0, [rightmost, topmost]);
    const width = rightmost - BRij[0];
    const top_verticals = V0[BRij[0]].slice(0, BRij[1]);
    top_verticals.push(V0[rightmost][topmost]);
    if (tr_separator === 0) {
      m[rightmost].pop();
    } else {
      const new_tr_separator = tr_separator - 1;
      if (vertical_compare4(
        vertical_increase4(V0[BRij[0]][BRij[1] - 1] ?? [], new_tr_separator),
        V0[rightmost][topmost - 1] ?? []
      ) <= 0)
        m[rightmost].pop();
      else m[rightmost][topmost][1] = new_tr_separator;
    }
    m[rightmost] = m[rightmost].concat(m[BRij[0]].slice(BRij[1]));
    const V = mountain_verticals(m);
    const magma_checks_list = [];
    for (let i = BRij[0] + 1; i <= rightmost; i++) {
      magma_checks_list[i] = [];
      for (let j = 0; j < m[i].length; j++) {
        let working = [i, j];
        while (working[0] > BRij[0]) {
          if (m[working[0]].length <= working[1]) --working[1];
          working = parent2(m, V, working);
        }
        magma_checks_list[i][j] = working[0] === BRij[0] && working[1] <= BRij[1] && !vertical_compare4(V[working[0]][working[1] - 1] ?? [], V[i][j - 1] ?? []) ? working[1] : -1;
      }
    }
    for (let n = 1; n <= index; n++) {
      const refs = get_references(m, top_verticals);
      refs[-1] = -1;
      for (let dx = 1; dx <= width; dx++) {
        const x = BRij[0] + dx;
        const source_magmas = magma_checks_list[x];
        const target_column = [];
        m[x].forEach((entry, y) => {
          const value = entry[0];
          if (~source_magmas[y]) {
            const BR_index = source_magmas[y];
            for (let j = refs[BR_index - 1] + 1; j <= refs[BR_index]; j++) {
              if (j === refs[BR_index]) target_column.push([value + width * n, entry[1]]);
              else target_column.push([value + width * n, m[BRij[0] + width * n][j][1]]);
            }
          } else {
            target_column.push([value + (value > BRij[0] ? width * n : 0), entry[1]]);
          }
        });
        m[x + width * n] = target_column;
      }
    }
    if (shorter) m.pop();
    return m;
  }
  function infinity_FS19(n) {
    return [[], [[1, n]]];
  }
  function calc_ancestor_depths(m) {
    if (!Array.isArray(m) || m.length === 0) return [];
    const V = m.map(column_verticals2);
    const depthMap = Array.from({ length: m.length }, () => []);
    const visited = /* @__PURE__ */ new Set();
    function getDepth(i, j) {
      const key = `${i},${j}`;
      if (visited.has(key)) return 0;
      visited.add(key);
      const [pCol, pRow] = parent2(m, V, [i, j]);
      if (pCol < 0 || pCol >= m.length || pRow < 0 || pRow >= m[pCol].length) {
        visited.delete(key);
        return 0;
      }
      const depth = 1 + getDepth(pCol, pRow);
      visited.delete(key);
      return depth;
    }
    for (let i = 0; i < m.length; i++) {
      const column = m[i];
      for (let j = 0; j < column.length; j++) {
        depthMap[i][j] = getDepth(i, j);
      }
    }
    return depthMap;
  }
  function convert_to_layer2(om) {
    if (is_infinity21(om)) return om;
    const depthMap = calc_ancestor_depths(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j] + 1;
      }
    }
    return dm;
  }
  function convert_from_layer2(dm) {
    if (is_infinity21(dm)) return dm;
    const om = deepcopy(dm);
    let V = om.map(column_verticals2);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent2(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_row(V[i1], j === 0 ? [0] : V[i][j - 1].concat([0]));
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function compute_mountain_diagram(expr, current_equiv) {
    if (is_infinity21(expr) || expr.length === 0) return void 0;
    const m = expr;
    const m_display = current_equiv?.includes("layer") ? convert_to_layer2(expr) : expr;
    const V = m.map(column_verticals2);
    const vertical_set = new DisplaySet(vertical_display2);
    vertical_set.add([]);
    for (const Vi of V) for (const v of Vi) vertical_set.add(v);
    const sorted = vertical_set.values().sort(vertical_compare4);
    const sorted_verticals = sorted.map(vertical_display2);
    const vertical_index = new DisplayMap(vertical_display2);
    for (let i = 0; i < sorted.length; i++) {
      vertical_index.set(sorted[i], i);
    }
    const H = 40, HS = 5;
    const line_heights = [];
    const heights = [0];
    for (let i = 1; i < sorted.length; i++) {
      const sep = vertical_diff(sorted[i], sorted[i - 1]);
      const d_height = H + HS * sep;
      heights.push(heights[i - 1] + d_height);
      for (let k = 0; k <= sep; k++) line_heights.push(heights[i - 1] + H / 2 + HS * k);
    }
    const entries = Array.from(
      { length: m.length },
      () => Array.from({ length: vertical_index.size }, () => void 0)
    );
    const left_legs = Array.from(
      { length: m.length },
      () => Array.from({ length: vertical_index.size }, () => void 0)
    );
    for (let i = 0; i < m.length; ++i) {
      entries[i][0] = "*";
      for (let j = 0; j < m[i].length; j++) {
        const vj = vertical_index.get(V[i][j]);
        entries[i][vj] = entry_display2(m_display[i][j], false);
        const [pi, pj] = parent2(m, V, [i, j]);
        const pvj = pj === 0 ? 0 : vertical_index.get(V[pi][pj - 1]);
        left_legs[i][vj] = [pi, pvj];
      }
    }
    return { sorted_verticals, heights, line_heights, entries, left_legs };
  }
  var draw_diagram_control = {
    default_data: { current_equiv: void 0, invert_vertical: void 0 },
    draw_diagram: (_expr, _data) => {
      const mountain = compute_mountain_diagram(_expr, _data.current_equiv);
      if (!mountain) return void 0;
      return draw_mountain_diagram(mountain, { invert_vertical: _data.invert_vertical ?? false });
    },
    handle_action: (data20, action) => {
      if (action.type === "scroll") {
        if (action.direction === "down") {
          return { ...data20, invert_vertical: true };
        } else if (action.direction === "up") {
          return { ...data20, invert_vertical: false };
        }
      }
      return null;
    }
  };
  function column_display_marked(c, type, index) {
    let result = c.map((e) => entry_display2(e, false)).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked(m, type) {
    if (is_infinity21(m)) return "Limit";
    return m.map((col, i) => column_display_marked(col, type, i + 1)).join("");
  }
  var omega_MN = {
    id: "omega-mn",
    name: "\u03C9 mountain notation",
    simple_name: "\u03C9MN",
    category_id: "category-mn",
    display: {
      plain: (m) => mountain_display(m, false),
      from_display: mountain_from_display,
      name_id: "display.index"
    },
    display_equiv: {
      layer: {
        plain: (m) => mountain_display(convert_to_layer2(m), false),
        from_display: (str) => convert_from_layer2(mountain_from_display(str)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked(m, "label"),
        html: (m) => mountain_display_marked(m, "sub"),
        from_display: mountain_from_display,
        name_id: "display.index-marked"
      },
      simple: {
        plain: (m) => mountain_display(m, true),
        from_display: from_display_simple2,
        name_id: "display.index-simple"
      },
      "layer simple": {
        plain: (m) => mountain_display(convert_to_layer2(m), true),
        from_display: (s) => convert_from_layer2(from_display_simple2(s)),
        name_id: "display.layer-simple"
      }
    },
    is_limit: mountain_is_limit,
    compare: mountain_compare,
    draw_diagram: draw_diagram_control,
    ...MN_FS_variants(expand7, is_infinity21, infinity_FS19, mountain_is_limit, to_data_key),
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY20(), [[]], []]
  };

  // src/notations/MN/T_omega_MN.ts
  var data4 = /* @__PURE__ */ new Map();
  var data_short = /* @__PURE__ */ new Map();
  function is_infinity22(m) {
    return "" + m === "Infinity";
  }
  function INFINITY21() {
    return [[[Infinity]]];
  }
  function entry_compare3(a, b) {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return mountain_compare2(a[1], b[1]);
  }
  function column_compare9(a, b) {
    return lex_compare(a, b, entry_compare3);
  }
  function mountain_compare2(a, b) {
    return lex_compare(a, b, column_compare9);
  }
  function mountain_is_limit2(m) {
    return m.length > 0 && m[m.length - 1].length > 0;
  }
  function mountain_is_one(m) {
    return m.length === 1 && m[0].length === 0;
  }
  function sep_display2(sep, simple) {
    if (sep.every((col) => !col.length)) {
      let sep_len = sep.length;
      if (sep_len === 1 && simple) return "";
      return ",".repeat(sep_len);
    }
    let d_m = mountain_display2(sep, simple);
    return simple ? "[" + d_m + "]" : d_m;
  }
  function entry_display3([v, sep], simple) {
    let d_sep = sep_display2(sep, simple);
    let d_v = "" + v;
    if (simple && d_v.length >= 2) d_v = "(" + d_v + ")";
    return d_sep + d_v;
  }
  function column_display10(col, simple) {
    if (simple && col.length === 0) return "0";
    let result = col.map((e) => entry_display3(e, simple)).join("");
    return simple ? result : "(" + result + ")";
  }
  function mountain_display2(m, simple) {
    if (is_infinity22(m)) return "Limit";
    return m.map((col) => column_display10(col, simple)).join(simple ? " " : "");
  }
  function mountain_from_display2(s) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_number() {
      skip_spaces();
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (start === i) error();
      return parseInt(s.substring(start, i), 10);
    }
    function parse_sep() {
      skip_spaces();
      if (i < s.length && s[i] === ",") {
        let count = 0;
        while (i < s.length && s[i] === ",") {
          count++;
          i++;
        }
        return Array.from({ length: count }, () => []);
      }
      if (i < s.length && s[i] === "(") {
        return parse_expr();
      }
      error();
    }
    function parse_entry() {
      const sep = parse_sep();
      const v = parse_number();
      return [v, sep];
    }
    function skip_index() {
      if (i < s.length && s[i] === ":") {
        i++;
        skip_spaces();
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      }
    }
    function parse_column() {
      skip_spaces();
      if (i >= s.length || s[i] !== "(") error();
      i++;
      const col = [];
      skip_spaces();
      while (i < s.length && s[i] !== ")" && s[i] !== ":") {
        col.push(parse_entry());
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= s.length) error();
      i++;
      return col;
    }
    function parse_expr() {
      const result2 = [];
      skip_spaces();
      while (i < s.length && s[i] === "(") {
        result2.push(parse_column());
        skip_spaces();
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY21();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function from_display_simple3(s) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_value() {
      if (i < s.length && s[i] === "(") {
        i++;
        const start = i;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
        if (start === i) error();
        if (i >= s.length || s[i] !== ")") error();
        const v = parseInt(s.substring(start, i), 10);
        i++;
        return v;
      }
      if (i < s.length && s[i] >= "0" && s[i] <= "9") {
        const v = s.charCodeAt(i) - 48;
        i++;
        return v;
      }
      error();
    }
    function parse_sep() {
      let comma_count = 0;
      while (i < s.length && s[i] === ",") {
        comma_count++;
        i++;
      }
      if (comma_count > 0) {
        return Array.from({ length: comma_count }, () => []);
      }
      if (i < s.length && s[i] === "[") {
        i++;
        const sep = parse_expr("]");
        if (i >= s.length || s[i] !== "]") error();
        i++;
        return sep;
      }
      return [[]];
    }
    function parse_entry() {
      const sep = parse_sep();
      const v = parse_value();
      return [v, sep];
    }
    function parse_column(stop_char) {
      const col = [];
      while (i < s.length && s[i] !== " " && (stop_char === void 0 || s[i] !== stop_char)) {
        col.push(parse_entry());
      }
      return col;
    }
    function parse_expr(stop_char) {
      const result2 = [];
      while (true) {
        skip_spaces();
        if (i >= s.length) break;
        if (stop_char !== void 0 && s[i] === stop_char) break;
        if (s[i] === "0" && (i + 1 >= s.length || s[i + 1] === " " || s[i + 1] === stop_char)) {
          result2.push([]);
          i++;
          continue;
        }
        result2.push(parse_column(stop_char));
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY21();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function vertical_compare5(a, b) {
    let i = 0;
    while (true) {
      if (i >= a.length) return i >= b.length ? 0 : -1;
      if (i >= b.length) return 1;
      const c = mountain_compare2(a[i], b[i]);
      if (c) return c;
      ++i;
    }
  }
  function vertical_increase5(v, m) {
    let i = v.length - 1;
    while (i >= 0 && mountain_compare2(v[i], m) < 0) --i;
    return v.slice(0, i + 1).concat([m]);
  }
  function find_index_below_row2(verticals, y) {
    const working = [[]].concat(verticals);
    let i1 = 0, i2 = working.length - 1;
    while (i1 < i2) {
      const i = Math.ceil((i1 + i2) / 2);
      if (vertical_compare5(working[i], y) < 0) i1 = i;
      else i2 = i - 1;
    }
    return i1;
  }
  function parent3(A, V, [i, j]) {
    const target_column = A[i][j][0] - 1;
    const target_i = find_index_below_row2(V[target_column], V[i][j]);
    return [target_column, target_i];
  }
  function column_verticals3(column) {
    const v = [[]];
    for (let j = 0; j < column.length; ++j) v.push(vertical_increase5(v[j], column[j][1]));
    return v.slice(1);
  }
  function get_references2(A, r_tops) {
    const verticals = column_verticals3(A[A.length - 1]);
    verticals.unshift([]);
    const ref = [];
    let i = 0, j = 0;
    while (i < verticals.length && j < r_tops.length) {
      if (vertical_compare5(verticals[i], r_tops[j]) < 0) {
        ref[j] = i;
        ++i;
      } else {
        ++j;
      }
    }
    return ref;
  }
  function threshold(A, shorter, low, high) {
    let n = 0;
    while (true) {
      const res = expand8(A, n, shorter);
      if (vertical_compare5(vertical_increase5(low, res), vertical_increase5(high, res)) >= 0) return n;
      n++;
    }
  }
  function expand8(A0, index, shorter = false) {
    const data_key = mountain_display2(A0, true);
    if (shorter) {
      const v = data_short.get(data_key + '"' + index);
      if (v) return v;
    } else {
      const v = data4.get(data_key + '"' + index);
      if (v) return v;
    }
    const rightmost = A0.length - 1;
    const topmost = A0[rightmost].length - 1;
    const A = deepcopy(A0);
    if (topmost === -1) {
      A.pop();
      return A;
    }
    const top_right_entry = A[rightmost][topmost];
    let top_right_separator = top_right_entry[1];
    const V0 = A.map(column_verticals3);
    const BRij = parent3(A, V0, [rightmost, topmost]);
    const width = rightmost - BRij[0];
    if (mountain_is_limit2(top_right_separator)) {
      A[rightmost][topmost][1] = expand8(
        top_right_separator,
        threshold(top_right_separator, shorter, V0[BRij[0]][BRij[1] - 1] ?? [], V0[rightmost][topmost - 1] ?? []) + index,
        shorter
      );
      return A;
    }
    const top_verticals = V0[BRij[0]].slice(0, BRij[1]);
    top_verticals.push(V0[rightmost][topmost]);
    if (mountain_is_one(top_right_separator)) A[rightmost].pop();
    else {
      top_right_separator = top_right_separator.slice(0, -1);
      if (vertical_compare5(
        vertical_increase5(V0[BRij[0]][BRij[1] - 1] ?? [], top_right_separator),
        V0[rightmost][topmost - 1] ?? []
      ) <= 0)
        A[rightmost].pop();
      else A[rightmost][topmost][1] = top_right_separator;
    }
    A[rightmost] = A[rightmost].concat(A[BRij[0]].slice(BRij[1]));
    const V = A.map(column_verticals3);
    const magma_checks_list = [];
    for (let i = BRij[0] + 1; i <= rightmost; ++i) {
      magma_checks_list[i] = [];
      for (let j = 0; j < A[i].length; ++j) {
        let working = [i, j];
        while (working[0] > BRij[0]) {
          if (A[working[0]].length <= working[1]) --working[1];
          working = parent3(A, V, working);
        }
        magma_checks_list[i][j] = working[0] === BRij[0] && working[1] <= BRij[1] && !vertical_compare5(V[working[0]][working[1] - 1] ?? [], V[i][j - 1] ?? []) ? working[1] : -1;
      }
    }
    for (let n = 1; n <= index; ++n) {
      const refs = get_references2(A, top_verticals);
      refs[-1] = -1;
      for (let dx = 1; dx <= width; ++dx) {
        const x = BRij[0] + dx;
        const source_magmas = magma_checks_list[x];
        const target_column = [];
        A[x].forEach((entry, y) => {
          const value = entry[0];
          if (~source_magmas[y]) {
            const BR_index = source_magmas[y];
            for (let j = refs[BR_index - 1] + 1; j <= refs[BR_index]; ++j) {
              if (j === refs[BR_index]) target_column.push([value + width * n, entry[1]]);
              else target_column.push([value + width * n, A[BRij[0] + width * n][j][1]]);
            }
          } else {
            target_column.push([value + (value > BRij[0] ? width * n : 0), entry[1]]);
          }
        });
        A[x + width * n] = target_column;
      }
    }
    if (shorter) A.pop();
    if (shorter) data_short.set(data_key + '"' + index, A);
    else data4.set(data_key + '"' + index, A);
    return A;
  }
  function infinity_FS20(n) {
    return n > 0 ? [[], [[1, infinity_FS20(n - 1)]]] : [[]];
  }
  function calc_ancestor_depths2(m) {
    if (!Array.isArray(m) || m.length === 0) return [];
    const V = m.map(column_verticals3);
    const depthMap = Array.from({ length: m.length }, () => []);
    const visited = /* @__PURE__ */ new Set();
    function getDepth(i, j) {
      const key = `${i},${j}`;
      if (visited.has(key)) return 0;
      visited.add(key);
      const [pCol, pRow] = parent3(m, V, [i, j]);
      if (pCol < 0 || pCol >= m.length || pRow < 0 || pRow >= m[pCol].length) {
        visited.delete(key);
        return 0;
      }
      const depth = 1 + getDepth(pCol, pRow);
      visited.delete(key);
      return depth;
    }
    for (let i = 0; i < m.length; i++) {
      const column = m[i];
      for (let j = 0; j < column.length; j++) {
        depthMap[i][j] = getDepth(i, j);
      }
    }
    return depthMap;
  }
  function convert_to_layer3(om) {
    if (is_infinity22(om)) return om;
    const depthMap = calc_ancestor_depths2(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j] + 1;
        if (Array.isArray(entry[1]) && entry[1].length > 0) {
          entry[1] = convert_to_layer3(entry[1]);
        }
      }
    }
    return dm;
  }
  function convert_from_layer3(dm) {
    if (is_infinity22(dm)) return dm;
    const om = deepcopy(dm);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        if (Array.isArray(entry[1]) && entry[1].length > 0) {
          entry[1] = convert_from_layer3(entry[1]);
        }
      }
    }
    let V = om.map(column_verticals3);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent3(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_row2(V[i1], j === 0 ? [[[]]] : V[i][j - 1].concat([[[]]]));
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function sep_display_marked(sep, type) {
    if (sep.every((col) => !col.length)) {
      let sep_len = sep.length;
      return ",".repeat(sep_len);
    }
    return mountain_display_marked2(sep, type);
  }
  function entry_display_marked([v, sep], type) {
    return sep_display_marked(sep, type) + v;
  }
  function column_display_marked2(c, type, index) {
    let result = c.map((e) => entry_display_marked(e, type)).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked2(m, type) {
    if (is_infinity22(m)) return "Limit";
    return m.map((col, i) => column_display_marked2(col, type, i + 1)).join("");
  }
  var T_omega_MN = {
    id: "t-omega-mn",
    name: "Transfinite \u03C9MN",
    simple_name: "T\u03C9MN",
    category_id: "category-mn",
    display: {
      plain: (m) => mountain_display2(m, false),
      from_display: mountain_from_display2,
      name_id: "display.index"
    },
    display_equiv: {
      layer: {
        plain: (m) => mountain_display2(convert_to_layer3(m), false),
        from_display: (s) => convert_from_layer3(mountain_from_display2(s)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked2(m, "label"),
        html: (m) => mountain_display_marked2(m, "sub"),
        from_display: mountain_from_display2,
        name_id: "display.index-marked"
      },
      simple: {
        plain: (m) => mountain_display2(m, true),
        from_display: from_display_simple3,
        name_id: "display.index-simple"
      },
      "layer simple": {
        plain: (m) => mountain_display2(convert_to_layer3(m), true),
        from_display: (s) => convert_from_layer3(from_display_simple3(s)),
        name_id: "display.layer-simple"
      }
    },
    is_limit: mountain_is_limit2,
    compare: mountain_compare2,
    FS: (m, index) => {
      if (is_infinity22(m)) return infinity_FS20(index);
      if (m.length === 0) return [];
      return expand8(m, index, true);
    },
    FS_alter: (m, index) => {
      if (is_infinity22(m)) return infinity_FS20(index);
      if (m.length === 0) return [];
      return expand8(m, index);
    },
    FS_short: (m, index) => {
      if (is_infinity22(m)) return infinity_FS20(index);
      if (m.length === 0) return [];
      if (index === 0) return expand8(m, 0, true);
      if (index === 1) {
        if (mountain_compare2(expand8(m, 0, true), expand8(m, 0, false)) === 0) return expand8(m, 1, true);
        else return expand8(m, 0, false);
      }
      if (mountain_compare2(expand8(m, 0, true), expand8(m, 0, false)) === 0 || mountain_compare2(expand8(m, 1, true), expand8(m, 0, false)) === 0)
        return expand8(m, index, true);
      return expand8(m, index - 1, true);
    },
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY21(), []]
  };

  // src/notations/MN/Aw2MN2.ts
  function is_infinity23(a) {
    return "" + a === "Infinity";
  }
  function entry_compare4(a, b) {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return mountain_compare3(a[1], b[1]);
  }
  function column_compare10(a, b) {
    return lex_compare(a, b, entry_compare4);
  }
  function mountain_compare3(a, b) {
    return lex_compare(a, b, column_compare10);
  }
  function mountain_is_limit3(m) {
    return m.length > 0 && m[m.length - 1].length > 0;
  }
  function mountain_is_one2(m) {
    return m.length === 1 && m[0].length === 0;
  }
  function sep_display3(sep) {
    if (sep.every((column) => !column.length)) return ",".repeat(sep.length);
    if (mountain_display3(sep.slice(0, 2)) === mountain_display3([[], [[1, [[]]]]]) && sep.slice(2).every((column) => !column.length))
      return ";" + ",".repeat(sep.length - 2);
    return mountain_display3(sep);
  }
  function entry_display4(entry) {
    return sep_display3(entry[1]) + (entry[2] ? "*" : "") + entry[0];
  }
  function column_display11(col) {
    return "(" + col.map(entry_display4).join("") + ")";
  }
  function mountain_display3(m) {
    if (is_infinity23(m)) return "Limit";
    return m.map(column_display11).join("");
  }
  function INFINITY22() {
    return [[[Infinity]]];
  }
  function from_display12(str) {
    if (str === "Limit") return INFINITY22();
    const OMEGA_SEP = [[], [[1, [[]]]]];
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + str);
    }
    function skip_spaces() {
      while (i < str.length && str[i] === " ") i++;
    }
    function skip_index() {
      if (i < str.length && str[i] === ":") {
        i++;
        skip_spaces();
        while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      }
    }
    function parse_sep() {
      if (i < str.length && str[i] === ";") {
        i++;
        let c02 = 0;
        while (i < str.length && str[i] === ",") {
          c02++;
          i++;
        }
        const sep2 = [OMEGA_SEP[0], OMEGA_SEP[1]];
        for (let k = 0; k < c02; k++) sep2.push([]);
        return sep2;
      }
      let c0 = 0;
      while (i < str.length && str[i] === ",") {
        c0++;
        i++;
      }
      if (c0 === 0) error();
      const sep = [];
      for (let k = 0; k < c0; k++) sep.push([]);
      return sep;
    }
    function parse_number() {
      const start = i;
      while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      if (start === i) error();
      return parseInt(str.substring(start, i), 10);
    }
    function parse_parenthesized_column() {
      i++;
      const col = [];
      skip_spaces();
      while (i < str.length && str[i] !== ")" && str[i] !== ":") {
        skip_spaces();
        const sep = parse_sep();
        skip_spaces();
        let astral = false;
        if (i < str.length && str[i] === "*") {
          astral = true;
          i++;
        }
        const v = parse_number();
        col.push(astral ? [v, sep, true] : [v, sep]);
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= str.length || str[i] !== ")") error();
      i++;
      return col;
    }
    function parse_unparenthesized_column() {
      skip_spaces();
      if (i >= str.length) error();
      if (str[i] === "0" && (i + 1 >= str.length || str[i + 1] === ":" || str[i + 1] === " " || str[i + 1] === "(" || str[i + 1] === "," || str[i + 1] === ";")) {
        i++;
        skip_index();
        return [];
      }
      const col = [];
      if (str[i] === ":") {
        skip_index();
        return [];
      }
      while (i < str.length && str[i] !== " " && str[i] !== "(" && str[i] !== ":") {
        const sep = parse_sep();
        skip_spaces();
        let astral = false;
        if (i < str.length && str[i] === "*") {
          astral = true;
          i++;
        }
        const v = parse_number();
        col.push(astral ? [v, sep, true] : [v, sep]);
      }
      skip_index();
      return col;
    }
    const result = [];
    skip_spaces();
    while (i < str.length) {
      if (str[i] === "(") {
        result.push(parse_parenthesized_column());
      } else {
        result.push(parse_unparenthesized_column());
      }
      skip_spaces();
    }
    return result;
  }
  function vertical_compare6(a, b) {
    return lex_compare(a, b, mountain_compare3);
  }
  function vertical_increase6(v, m) {
    let i = v.length - 1;
    while (i >= 0 && mountain_compare3(v[i], m) < 0) --i;
    return v.slice(0, i + 1).concat([m]);
  }
  function find_index_below_row3(verticals, y) {
    let working = [[], ...verticals];
    let i1 = 0, i2 = working.length - 1;
    while (i1 < i2) {
      let i = Math.ceil((i1 + i2) / 2);
      if (vertical_compare6(working[i], y) < 0) i1 = i;
      else i2 = i - 1;
    }
    return i1;
  }
  function Parent(A, V, [i, j]) {
    let target_column = A[i][j][0] - 1;
    let target_j = find_index_below_row3(V[target_column], V[i][j]);
    return [target_column, target_j];
  }
  function column_verticals4(column) {
    let v = [[]];
    for (let j = 0; j < column.length; ++j) v.push(vertical_increase6(v[j], column[j][1]));
    return v.slice(1);
  }
  function get_references3(A, rtops) {
    let verticals = column_verticals4(A[A.length - 1]);
    verticals.unshift([]);
    let ref = [], i = 0, j = 0;
    while (i < verticals.length && j < rtops.length) {
      if (vertical_compare6(verticals[i], rtops[j]) < 0) {
        ref[j] = i;
        ++i;
      } else {
        ++j;
      }
    }
    return ref;
  }
  function S(A, i, j) {
    return A[i]?.[j] ? A[i][j][2] ? A[i][j][1] : S(A, i, j - 1) : [];
  }
  function subtract1(A0, V0) {
    let rightmost = A0.length - 1;
    let topmost = A0[rightmost].length - 1;
    let A = deepcopy(A0);
    let top_right_value = A[rightmost][topmost][0];
    let top_right_separator = A[rightmost][topmost][1];
    let BRij = Parent(A, V0, [rightmost, topmost]);
    A[rightmost].pop();
    if (mountain_is_limit3(top_right_separator)) {
      let BR_separator = S(A, BRij[0], BRij[1] - 1);
      let J = mountain_compare3(BR_separator, top_right_separator) >= 0 ? [[]] : BR_separator.concat([[]]);
      let alpha = V0[BRij[0]][BRij[1] - 1] ?? [];
      let working_vertical = V0[rightmost][topmost - 1] ?? [];
      if (vertical_compare6(vertical_increase6(alpha, J), working_vertical) > 0) {
        if (vertical_compare6(alpha, working_vertical) > 0) {
          let i = working_vertical.length ? find_index_below_row3(V0[BRij[0]], working_vertical) : -1;
          while (++i < BRij[1]) {
            A[rightmost].push([top_right_value, A[BRij[0]][i][1], A[BRij[0]][i][2]]);
            working_vertical = vertical_increase6(working_vertical, A[BRij[0]][i][1]);
          }
        }
        A[rightmost].push([top_right_value, J, true]);
      }
    } else if (!mountain_is_one2(top_right_separator)) {
      top_right_separator = top_right_separator.slice(0, -1);
      let alpha = V0[BRij[0]][BRij[1] - 1] ?? [];
      let working_vertical = V0[rightmost][topmost - 1] ?? [];
      if (vertical_compare6(alpha, working_vertical) > 0) {
        let i = working_vertical.length ? find_index_below_row3(V0[BRij[0]], working_vertical) : -1;
        while (++i < BRij[1]) {
          A[rightmost].push([top_right_value, A[BRij[0]][i][1], A[BRij[0]][i][2]]);
          working_vertical = vertical_increase6(working_vertical, A[BRij[0]][i][1]);
        }
      }
      if (!vertical_compare6(alpha, working_vertical)) A[rightmost].push([top_right_value, top_right_separator]);
    }
    return A;
  }
  function extend(A0, small = false, weak = false) {
    let rightmost = A0.length - 1;
    let topmost = A0[rightmost].length - 1;
    let V0 = A0.map(column_verticals4);
    let BRij = Parent(A0, V0, [rightmost, topmost]);
    let top_separators = A0[BRij[0]].slice(0, BRij[1]).map((entry) => entry[1]);
    top_separators.push(A0[rightmost][topmost][1]);
    let top_verticals = V0[BRij[0]].slice(0, BRij[1]);
    top_verticals.push(V0[rightmost][topmost]);
    let width = rightmost - BRij[0];
    let magma_checks_list = [];
    for (let i = BRij[0] + 1; i <= rightmost; ++i) {
      magma_checks_list[i] = [];
      for (let j = 0; j < A0[i].length; ++j) {
        let working = [i, j];
        while (working[0] > BRij[0]) {
          if (A0[working[0]].length <= working[1]) --working[1];
          working = Parent(A0, V0, working);
        }
        magma_checks_list[i][j] = working[0] === BRij[0] && working[1] <= BRij[1] && !vertical_compare6(V0[working[0]][working[1] - 1] ?? [], V0[i][j - 1] ?? []) ? working[1] : -1;
      }
    }
    let BRi = BRij[0];
    magma_checks_list[BRi] = [];
    for (let j = 0; j < A0[BRi].length; ++j) {
      magma_checks_list[BRi][j] = -1;
    }
    let A = subtract1(A0, V0);
    let refs = get_references3(A, top_verticals);
    refs[-1] = -1;
    let stretch_threshold = [], stretch_value = [];
    for (let i = 0; i < top_separators.length; ++i) {
      if (!mountain_is_limit3(top_separators[i])) {
        stretch_value[i] = 0;
        continue;
      }
      if (mountain_compare3(S(A0, BRij[0], i - 1), top_separators[i]) >= 0) {
        stretch_threshold[i] = [[]];
      } else {
        stretch_threshold[i] = S(A0, BRij[0], i - 1).concat([[]]);
      }
      stretch_value[i] = 0;
      for (let j = refs[i]; j - 1 > refs[i - 1]; --j) {
        let M = A[rightmost][j - 1]?.[1] ?? [];
        if (mountain_compare3(M, top_separators[i]) < 0 && mountain_compare3(M, stretch_threshold[i]) >= 0) {
          stretch_value[i] = M.length - stretch_threshold[i].length + 1;
          break;
        }
      }
    }
    for (let dx = 0; dx <= (small ? 0 : width); ++dx) {
      let x = BRij[0] + dx;
      let source_magmas = magma_checks_list[x];
      if (dx) A[x + width] = [];
      let target_column = A[x + width];
      let BR_index = dx ? -1 : refs.length - 1;
      A0[x].forEach((entry, y) => {
        if (!dx && y < BRij[1]) return;
        var value = entry[0];
        if (~source_magmas[y]) {
          BR_index = source_magmas[y];
          for (var j = refs[BR_index - 1] + 1; j <= refs[BR_index]; ++j) {
            if (j === refs[BR_index])
              target_column.push([
                value + width,
                !stretch_value[BR_index] || weak && vertical_compare6(V0[x][y], top_verticals[BR_index] ?? []) >= 0 || mountain_compare3(entry[1], top_separators[BR_index]) >= 0 || mountain_compare3(entry[1], stretch_threshold[BR_index]) < 0 ? entry[1] : entry[1].concat(Array(stretch_value[BR_index]).fill([])),
                entry[2]
              ]);
            else target_column.push([value + width, A[BRij[0] + width][j][1], A[BRij[0] + width][j][2]]);
          }
        } else {
          target_column.push([
            value + (value > BRij[0] ? width : 0),
            !stretch_value[BR_index] || weak && vertical_compare6(V0[x][y], top_verticals[BR_index] ?? []) >= 0 || mountain_compare3(entry[1], top_separators[BR_index]) >= 0 || mountain_compare3(entry[1], stretch_threshold[BR_index]) < 0 ? entry[1] : entry[1].concat(Array(stretch_value[BR_index]).fill([])),
            entry[2]
          ]);
        }
      });
    }
    return A;
  }
  function expand9(A0, index, shorter = false) {
    let A = A0;
    for (let n = 1; n <= index; ++n) A = extend(A, false);
    return shorter ? A.slice(0, -1) : extend(A, true);
  }
  function expand_weak(A0, index, shorter = false) {
    let A = A0;
    for (let n = 1; n <= index; ++n) A = extend(A, false, true);
    return shorter ? A.slice(0, -1) : extend(A, true, true);
  }
  function infinity_FS21(n) {
    let Omega3 = [[], [[1, [[]]]]];
    return [[], [[1, [...Omega3, ...Array.from({ length: n }, () => [])]]]];
  }
  function calc_ancestor_depths3(m) {
    if (!Array.isArray(m) || m.length === 0) return [];
    const V = m.map(column_verticals4);
    const depthMap = Array.from({ length: m.length }, () => []);
    const visited = /* @__PURE__ */ new Set();
    function getDepth(i, j) {
      const key = `${i},${j}`;
      if (visited.has(key)) return 0;
      visited.add(key);
      const [pCol, pRow] = Parent(m, V, [i, j]);
      if (pCol < 0 || pCol >= m.length || pRow < 0 || pRow >= m[pCol].length) {
        visited.delete(key);
        return 0;
      }
      const depth = 1 + getDepth(pCol, pRow);
      visited.delete(key);
      return depth;
    }
    for (let i = 0; i < m.length; i++) {
      const column = m[i];
      for (let j = 0; j < column.length; j++) {
        depthMap[i][j] = getDepth(i, j);
      }
    }
    return depthMap;
  }
  function convert_to_layer4(om) {
    if (is_infinity23(om)) return om;
    const depthMap = calc_ancestor_depths3(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j] + 1;
        if (Array.isArray(entry[1]) && entry[1].length > 0) {
          entry[1] = convert_to_layer4(entry[1]);
        }
      }
    }
    return dm;
  }
  function column_display_marked3(c, type, index) {
    let result = c.map(entry_display4).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked3(m, type) {
    if (is_infinity23(m)) return "Limit";
    return m.map((col, i) => column_display_marked3(col, type, i + 1)).join("");
  }
  var A_omega2_MN2 = {
    id: "a-omega2-mn-2",
    name: "Astral \u03C9\xB72 mountain notation 2",
    simple_name: "A\u03C92MN2",
    category_id: "category-hypcos-w2mn",
    display: { plain: mountain_display3, from_display: from_display12, name_id: "display.index" },
    display_equiv: {
      marked: {
        plain: (m) => mountain_display_marked3(m, "label"),
        html: (m) => mountain_display_marked3(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    is_limit: mountain_is_limit3,
    compare: mountain_compare3,
    ...sequence_FS_variants(expand9, is_infinity23, infinity_FS21, mountain_is_limit3, mountain_display3),
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY22(), []]
  };
  var wA_omega2_MN2 = {
    id: "weak-a-omega2-mn-2",
    name: "weak Astral \u03C9\xB72 mountain notation 2",
    simple_name: "wA\u03C92MN2",
    category_id: "category-hypcos-w2mn",
    display: { plain: mountain_display3, from_display: from_display12, name_id: "display.index" },
    display_equiv: {
      layer: {
        plain: (m) => mountain_display3(convert_to_layer4(m)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked3(m, "label"),
        html: (m) => mountain_display_marked3(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    is_limit: mountain_is_limit3,
    compare: mountain_compare3,
    ...sequence_FS_variants(expand_weak, is_infinity23, infinity_FS21, mountain_is_limit3, mountain_display3),
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY22(), []]
  };

  // src/notations/MN/Aw2MN3.ts
  function subtract12(A0, V0) {
    let rightmost = A0.length - 1;
    let topmost = A0[rightmost].length - 1;
    let A = deepcopy(A0);
    let top_right_value = A[rightmost][topmost][0];
    let top_right_separator = A[rightmost][topmost][1];
    let BR_ij = Parent(A, V0, [rightmost, topmost]);
    A[rightmost].pop();
    if (mountain_is_one2(top_right_separator)) return A;
    let alpha = V0[BR_ij[0]][BR_ij[1] - 1] ?? [], working_vertical = V0[rightmost][topmost - 1] ?? [];
    if (vertical_compare6(alpha, working_vertical) > 0) {
      let i = working_vertical.length ? find_index_below_row3(V0[BR_ij[0]], working_vertical) : -1;
      while (++i < BR_ij[1]) {
        A[rightmost].push([top_right_value, A[BR_ij[0]][i][1], A[BR_ij[0]][i][2]]);
        working_vertical = vertical_increase6(working_vertical, A[BR_ij[0]][i][1]);
      }
    }
    if (mountain_is_limit3(top_right_separator)) {
      let BR_separator = S(A, BR_ij[0], BR_ij[1] - 1), J = mountain_compare3(BR_separator, top_right_separator) >= 0 ? [[]] : BR_separator.concat([[]]);
      while (vertical_compare6(vertical_increase6(alpha, J), vertical_increase6(working_vertical, J)))
        J = J.concat([[]]);
      A[rightmost].push([top_right_value, J, true]);
    } else {
      top_right_separator = top_right_separator.slice(0, -1);
      if (vertical_compare6(vertical_increase6(alpha, top_right_separator), working_vertical) > 0) {
        A[rightmost].push([top_right_value, top_right_separator]);
      }
    }
    return A;
  }
  function extend2(A0, small = false, weak = false) {
    let rightmost = A0.length - 1;
    let topmost = A0[rightmost].length - 1;
    let V0 = A0.map(column_verticals4);
    let BR_ij = Parent(A0, V0, [rightmost, topmost]);
    let top_separators = A0[BR_ij[0]].slice(0, BR_ij[1]).map((entry) => entry[1]);
    top_separators.push(A0[rightmost][topmost][1]);
    let top_verticals = V0[BR_ij[0]].slice(0, BR_ij[1]);
    top_verticals.push(V0[rightmost][topmost]);
    let width = rightmost - BR_ij[0];
    let magma_checks_list = [];
    for (let i = BR_ij[0] + 1; i <= rightmost; ++i) {
      magma_checks_list[i] = [];
      for (let j = 0; j < A0[i].length; ++j) {
        let working = [i, j];
        while (working[0] > BR_ij[0]) {
          if (A0[working[0]].length <= working[1]) --working[1];
          working = Parent(A0, V0, working);
        }
        magma_checks_list[i][j] = working[0] === BR_ij[0] && working[1] <= BR_ij[1] && !vertical_compare6(V0[working[0]][working[1] - 1] ?? [], V0[i][j - 1] ?? []) ? working[1] : -1;
      }
    }
    let Br_i = BR_ij[0];
    magma_checks_list[Br_i] = [];
    for (let j = 0; j < A0[Br_i].length; ++j) {
      magma_checks_list[Br_i][j] = -1;
    }
    const A = subtract12(A0, V0);
    let refs = get_references3(A, top_verticals);
    refs[-1] = -1;
    let stretch_threshold = [], stretch_value = [];
    for (let i = 0; i < top_separators.length; ++i) {
      if (!mountain_is_limit3(top_separators[i])) {
        stretch_value[i] = 0;
        continue;
      }
      if (mountain_compare3(S(A0, BR_ij[0], i - 1), top_separators[i]) >= 0) {
        stretch_threshold[i] = [[]];
      } else {
        stretch_threshold[i] = S(A0, BR_ij[0], i - 1).concat([[]]);
      }
      stretch_value[i] = 0;
      for (let j = refs[i]; j - 1 > refs[i - 1]; --j) {
        let M = A[rightmost][j - 1]?.[1] ?? [];
        if (mountain_compare3(M, top_separators[i]) < 0 && mountain_compare3(M, stretch_threshold[i]) >= 0) {
          stretch_value[i] = M.length - stretch_threshold[i].length + 1;
          break;
        }
      }
    }
    for (let dx = 0; dx <= (small ? 0 : width); ++dx) {
      let x = BR_ij[0] + dx;
      let source_magmas = magma_checks_list[x];
      if (dx) A[x + width] = [];
      let target_column = A[x + width];
      let BR_index = dx ? -1 : refs.length - 1;
      A0[x].forEach((entry, y) => {
        if (!dx && y < BR_ij[1]) return;
        let value = entry[0];
        if (~source_magmas[y]) {
          BR_index = source_magmas[y];
          for (var j = refs[BR_index - 1] + 1; j <= refs[BR_index]; ++j) {
            if (j === refs[BR_index])
              target_column.push([
                value + width,
                !stretch_value[BR_index] || weak && vertical_compare6(V0[x][y], top_verticals[BR_index] ?? []) >= 0 || mountain_compare3(entry[1], top_separators[BR_index]) >= 0 || mountain_compare3(entry[1], stretch_threshold[BR_index]) < 0 ? entry[1] : entry[1].concat(Array(stretch_value[BR_index]).fill([])),
                entry[2]
              ]);
            else target_column.push([value + width, A[BR_ij[0] + width][j][1], A[BR_ij[0] + width][j][2]]);
          }
        } else {
          target_column.push([
            value + (value > BR_ij[0] ? width : 0),
            !stretch_value[BR_index] || weak && vertical_compare6(V0[x][y], top_verticals[BR_index] ?? []) >= 0 || mountain_compare3(entry[1], top_separators[BR_index]) >= 0 || mountain_compare3(entry[1], stretch_threshold[BR_index]) < 0 ? entry[1] : entry[1].concat(Array(stretch_value[BR_index]).fill([])),
            entry[2]
          ]);
        }
      });
    }
    return A;
  }
  function expand10(A0, index, shorter = false) {
    let A = A0;
    for (let n = 1; n <= index; ++n) A = extend2(A);
    return shorter ? A.slice(0, -1) : extend2(A, true);
  }
  function expand_weak2(A0, index, shorter = false) {
    let A = A0;
    for (let n = 1; n <= index; ++n) A = extend2(A, false, true);
    return shorter ? A.slice(0, -1) : extend2(A, true, true);
  }
  var A_omega2_MN3 = {
    id: "a-omega2-mn-3",
    name: "A\u03C92MN3",
    display: { plain: mountain_display3, from_display: from_display12, name_id: "display.index" },
    display_equiv: {
      marked: {
        plain: (m) => mountain_display_marked3(m, "label"),
        html: (m) => mountain_display_marked3(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    simple_name: "A\u03C92MN3",
    category_id: "category-hypcos-w2mn",
    is_limit: mountain_is_limit3,
    compare: mountain_compare3,
    ...sequence_FS_variants(expand10, is_infinity23, infinity_FS21, mountain_is_limit3, mountain_display3),
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY22(), []]
  };
  var wA_omega2_MN3 = {
    id: "weak-a-omega2-mn-3",
    name: "weak A\u03C92MN3",
    category_id: "category-hypcos-w2mn",
    display: { plain: mountain_display3, from_display: from_display12, name_id: "display.index" },
    display_equiv: {
      layer: {
        plain: (m) => mountain_display3(convert_to_layer4(m)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked3(m, "label"),
        html: (m) => mountain_display_marked3(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    simple_name: "wA\u03C92MN3",
    is_limit: mountain_is_limit3,
    compare: mountain_compare3,
    ...sequence_FS_variants(expand_weak2, is_infinity23, infinity_FS21, mountain_is_limit3, mountain_display3),
    credit_text_id: "credit.hypcos_mn",
    init: () => [INFINITY22(), []]
  };

  // src/notations/SMN/n_MN.ts
  function INFINITY23() {
    return [[[Infinity]]];
  }
  function is_infinity24(m) {
    return "" + m === "Infinity";
  }
  function is_limit15(m) {
    return is_infinity24(m) || m.length > 0 && m[m.length - 1].length > 0;
  }
  function to_data_key2(m) {
    return mountain_display4(m, true);
  }
  function mountain_display4(m, simple) {
    if (is_infinity24(m)) return "Limit";
    return m.map((col) => column_display12(col, simple)).join(simple ? " " : "");
  }
  function column_display12(c, simple) {
    if (simple && c.length === 0) return "0";
    let result = c.map((e) => entry_display5(e, simple)).join("");
    return simple ? result : "(" + result + ")";
  }
  function entry_display5([v, sep], simple) {
    let d_sep = sep_display4(sep, simple);
    let d_v = "" + v;
    if (simple && d_v.length >= 2) d_v = "(" + d_v + ")";
    return d_sep + d_v;
  }
  function sep_display4(sep, simple) {
    if (simple && sep === 0) return "";
    return ",".repeat(sep + 1);
  }
  function vertical_display3(v) {
    return v.map((s) => sep_display4(s, false)).join("/");
  }
  function mountain_display_marked4(m, type) {
    if (is_infinity24(m)) return "Limit";
    return m.map((col, i) => column_display_marked4(col, type, i + 1)).join("");
  }
  function column_display_marked4(c, type, index) {
    let result = c.map((e) => entry_display5(e, false)).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function from_display13(str) {
    if (str === "Limit") return INFINITY23();
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + str);
    }
    function skip_spaces() {
      while (i < str.length && str[i] === " ") i++;
    }
    function skip_index() {
      if (i < str.length && str[i] === ":") {
        i++;
        skip_spaces();
        while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      }
    }
    function parse_sep() {
      let count = 0;
      while (i < str.length && str[i] === ",") {
        count++;
        i++;
      }
      return count === 0 ? 0 : count - 1;
    }
    function parse_number() {
      const start = i;
      while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      if (start === i) error();
      return parseInt(str.substring(start, i), 10);
    }
    function parse_parenthesized_column() {
      i++;
      const col = [];
      skip_spaces();
      while (i < str.length && str[i] !== ")" && str[i] !== ":") {
        skip_spaces();
        const sep = parse_sep();
        skip_spaces();
        const v = parse_number();
        col.push([v, sep]);
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= str.length || str[i] !== ")") error();
      i++;
      return col;
    }
    function parse_unparenthesized_column() {
      skip_spaces();
      if (i >= str.length) error();
      if (str[i] === "0" && (i + 1 >= str.length || str[i + 1] === ":" || str[i + 1] === " " || str[i + 1] === "(" || str[i + 1] === ",")) {
        i++;
        skip_index();
        return [];
      }
      const col = [];
      while (i < str.length && str[i] !== " " && str[i] !== "(" && str[i] !== ":") {
        if (str[i] === ",") {
          const sep = parse_sep();
          skip_spaces();
          const v = parse_number();
          col.push([v, sep]);
        } else {
          error();
        }
      }
      skip_index();
      return col;
    }
    const result = [];
    skip_spaces();
    while (i < str.length) {
      if (str[i] === "(") {
        result.push(parse_parenthesized_column());
      } else {
        result.push(parse_unparenthesized_column());
      }
      skip_spaces();
    }
    return result;
  }
  function from_display_simple4(s) {
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + s);
    }
    function skip_spaces() {
      while (i < s.length && s[i] === " ") i++;
    }
    function parse_sep() {
      let count = 0;
      while (i < s.length && s[i] === ",") {
        count++;
        i++;
      }
      return count === 0 ? 0 : count - 1;
    }
    function parse_entry() {
      const sep = parse_sep();
      let v;
      if (i < s.length && s[i] === "(") {
        i++;
        const start = i;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
        if (start === i) error();
        if (i >= s.length || s[i] !== ")") error();
        v = parseInt(s.substring(start, i), 10);
        i++;
      } else if (i < s.length && s[i] >= "0" && s[i] <= "9") {
        v = s.charCodeAt(i) - 48;
        i++;
      } else {
        error();
      }
      return [v, sep];
    }
    function parse_column() {
      const col = [];
      while (i < s.length && s[i] !== " ") {
        col.push(parse_entry());
      }
      return col;
    }
    function parse_expr() {
      const result2 = [];
      while (true) {
        skip_spaces();
        if (i >= s.length) break;
        if (s[i] === "0" && (i + 1 >= s.length || s[i + 1] === " ")) {
          result2.push([]);
          i++;
          continue;
        }
        result2.push(parse_column());
      }
      return result2;
    }
    skip_spaces();
    if (i + 5 <= s.length && s.substring(i, i + 5) === "Limit") {
      i += 5;
      skip_spaces();
      if (i !== s.length) error();
      return INFINITY23();
    }
    const result = parse_expr();
    skip_spaces();
    if (i !== s.length) error();
    return result;
  }
  function sep_compare(s1, s2) {
    return number_compare(s1, s2);
  }
  function vertical_compare7(v1, v2) {
    return lex_compare(v1, v2, sep_compare);
  }
  function entry_compare5(e1, e2) {
    return tuple_lex_compare(e1, e2, [number_compare, number_compare]);
  }
  function column_compare11(c1, c2) {
    return lex_compare(c1, c2, entry_compare5);
  }
  function mountain_compare4(m1, m2) {
    return lex_compare(m1, m2, column_compare11);
  }
  function compare19(a, b) {
    if (is_infinity24(a) || is_infinity24(b)) {
      return boolean_compare(is_infinity24(a), is_infinity24(b));
    }
    return mountain_compare4(a, b);
  }
  function vertical_diff2(v1, v2) {
    let i = 0;
    while (i < v2.length && v1[i] === v2[i]) i++;
    return v1[i];
  }
  function vertical_increase7(v, s) {
    let i = v.length;
    while (i - 1 >= 0 && sep_compare(v[i - 1], s) < 0) i--;
    return [...v.slice(0, i), s];
  }
  function column_verticals5(c) {
    const result = [];
    let current = [];
    for (let e of c) {
      result.push(current = vertical_increase7(current, e[1]));
    }
    return result;
  }
  function find_index_below(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare7(Vij, v) < 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function find_index_below_equal(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare7(Vij, v) <= 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function parent4(m, V, [i, j]) {
    const [value, _] = m[i][j];
    const pi = value - 1;
    const pj = pi === -1 ? 0 : find_index_below(V[pi], V[i][j]);
    return [pi, pj];
  }
  function magma_indices(m, V, [Ri, Rj], MI_partial) {
    const result = MI_partial ?? [];
    for (let i = result.length; i < m.length; i++) {
      result.push([]);
      if (i <= Ri) {
      } else {
        for (let j = 0; j < m[i].length; j++) {
          let [pi, pj] = parent4(m, V, [i, j]);
          if (pi < Ri) {
            break;
          } else if (pi === Ri) {
            result[i][j] = Math.min(pj, Rj);
          } else {
            if (pj === m[pi].length) pj--;
            if (pj >= result[pi].length) break;
            result[i][j] = result[pi][pj];
          }
        }
      }
    }
    return result;
  }
  function fill_ghost(m0) {
    const m = deepcopy(m0);
    const V = m.map(column_verticals5);
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m[i].length; j++) {
        const [pi, pj] = parent4(m, V, [i, j]);
        if (pj !== m[pi].length) continue;
        const v_parent = pj === 0 ? [] : V[pi][pj - 1];
        const v = V[i][j];
        const [_, sep] = m[i][j];
        if (vertical_compare7(vertical_increase7(v_parent, sep), v) < 0) {
          m[pi].push([0, v[v.length - 2]]);
          V[pi].push(v.slice(0, v.length - 1));
        }
      }
    }
    return m;
  }
  function clear_ghost(m) {
    return m.map((c) => c.filter((e) => e[0] !== 0));
  }
  function subtract_1(m, V) {
    V = V ?? m.map(column_verticals5);
    const right = m.length - 1;
    const top = m[right].length - 1;
    const top_right_sep = m[right][top][1];
    const [Ri, Rj] = parent4(m, V, [right, top]);
    const result = deepcopy(m);
    result[right].pop();
    if (top_right_sep > 0) {
      const new_sep = top_right_sep - 1;
      const v_parent = Rj === 0 ? [] : V[Ri][Rj - 1];
      const v_bottom = top === 0 ? [] : V[right][top - 1];
      if (vertical_compare7(vertical_increase7(v_parent, new_sep), v_bottom) > 0) {
        result[right].push([Ri + 1, new_sep]);
      }
    }
    for (let j = Rj; j < m[Ri].length; j++) {
      result[right].push(deepcopy(m[Ri][j]));
    }
    return result;
  }
  function copy_column2(m0i, MI0i, mr, MIr, [Ri, Rj], offset) {
    const result = [];
    let last_mi = -1;
    let ref_j = 0;
    for (let j = 0; j < m0i.length; j++) {
      if (j >= MI0i.length) {
        let entry = deepcopy(m0i[j]);
        if (entry[0] >= Ri + 1) entry[0] += offset;
        result.push(entry);
      } else {
        const [value, sep] = m0i[j];
        const new_value = value + offset;
        let current_mi = MI0i[j];
        if (current_mi !== last_mi) {
          last_mi = current_mi;
          while (ref_j < MIr.length && MIr[ref_j] === current_mi) {
            const is_row_lifting = current_mi === Rj || ref_j + 1 < MIr.length && MIr[ref_j + 1] === current_mi;
            if (is_row_lifting) {
              let [_, ref_sep] = mr[ref_j];
              result.push([new_value, ref_sep]);
            }
            ref_j++;
          }
        }
        result.push([new_value, sep]);
      }
    }
    return result;
  }
  function extend3(m0) {
    const right = m0.length - 1;
    const top = m0[right].length - 1;
    const V0 = m0.map(column_verticals5);
    const [Ri, Rj] = parent4(m0, V0, [right, top]);
    const MI0 = magma_indices(m0, V0, [Ri, Rj]);
    const m = subtract_1(m0, V0);
    const V = [...V0.slice(0, right), column_verticals5(m[right])];
    const MI = magma_indices(m, V, [Ri, Rj], MI0.slice(0, right));
    const offset = right - Ri;
    for (let i = Ri + 1; i < m0.length; i++) {
      m.push(copy_column2(m0[i], MI0[i], m[right], MI[right], [Ri, Rj], offset));
    }
    return m;
  }
  function Limit(index) {
    return [[], [[1, index]]];
  }
  function NT_infinity_FS(n) {
    return (index) => [[], Array.from({ length: index }, () => [1, n - 1])];
  }
  function expand11(m, index, shorter = false) {
    if (is_infinity24(m)) return Limit(index);
    if (m.length === 0) return m;
    if (m[m.length - 1].length === 0) return m.slice(0, m.length - 1);
    let current = fill_ghost(m);
    for (let i = 0; i < index; ++i) current = extend3(current);
    current = shorter ? current.slice(0, current.length - 1) : subtract_1(current);
    current = clear_ghost(current);
    return current;
  }
  function calc_ancestor_depths4(m) {
    const V = m.map(column_verticals5);
    const depthMap = [];
    for (let i = 0; i < m.length; i++) {
      depthMap[i] = [];
      for (let j = 0; j < m[i].length; j++) {
        const [pi, pj] = parent4(m, V, [i, j]);
        depthMap[i][j] = pj === m[pi].length ? 1 : 1 + depthMap[pi][pj];
      }
    }
    return depthMap;
  }
  function convert_to_layer5(om) {
    if (is_infinity24(om)) return om;
    const depthMap = calc_ancestor_depths4(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j];
      }
    }
    return dm;
  }
  function convert_from_layer4(dm) {
    if (is_infinity24(dm)) return dm;
    const om = deepcopy(dm);
    let V = om.map(column_verticals5);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent4(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_equal(V[i1], j === 0 ? [] : V[i][j - 1]);
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function compute_mountain_diagram2(expr, current_equiv) {
    if (is_infinity24(expr) || expr.length === 0) return void 0;
    const m = fill_ghost(expr);
    const m_display = current_equiv?.includes("layer") ? convert_to_layer5(expr) : expr;
    const V = m.map(column_verticals5);
    const vertical_set = new DisplaySet(vertical_display3);
    vertical_set.add([]);
    for (const Vi of V) for (const v of Vi) vertical_set.add(v);
    const sorted = vertical_set.values().sort(vertical_compare7);
    const sorted_verticals = sorted.map(vertical_display3);
    const vertical_index = new DisplayMap(vertical_display3);
    for (let i = 0; i < sorted.length; i++) {
      vertical_index.set(sorted[i], i);
    }
    const H = 40, HS = 5;
    const line_heights = [];
    const heights = [0];
    for (let i = 1; i < sorted.length; i++) {
      const sep = vertical_diff2(sorted[i], sorted[i - 1]);
      const d_height = H + HS * sep;
      heights.push(heights[i - 1] + d_height);
      for (let k = 0; k <= sep; k++) line_heights.push(heights[i - 1] + H / 2 + HS * k);
    }
    const entries = Array.from(
      { length: m.length },
      () => Array.from({ length: vertical_index.size }, () => void 0)
    );
    const left_legs = Array.from(
      { length: m.length },
      () => Array.from({ length: vertical_index.size }, () => void 0)
    );
    for (let i = 0; i < m.length; ++i) {
      entries[i][0] = "*";
      for (let j = 0; j < m[i].length; j++) {
        const vj = vertical_index.get(V[i][j]);
        entries[i][vj] = j < m_display[i].length ? entry_display5(m_display[i][j], false) : "*";
        const [pi, pj] = parent4(m, V, [i, j]);
        if (pi !== -1) {
          const pvj = pj === 0 ? 0 : vertical_index.get(V[pi][pj - 1]);
          left_legs[i][vj] = [pi, pvj];
        }
      }
    }
    return { sorted_verticals, heights, line_heights, entries, left_legs };
  }
  var draw_diagram_control2 = {
    default_data: { current_equiv: void 0, invert_vertical: void 0 },
    draw_diagram: (_expr, _data) => {
      const mountain = compute_mountain_diagram2(_expr, _data.current_equiv);
      if (!mountain) return void 0;
      return draw_mountain_diagram(mountain, { invert_vertical: _data.invert_vertical ?? false });
    },
    handle_action: (data20, action) => {
      if (action.type === "scroll") {
        if (action.direction === "down") {
          return { ...data20, invert_vertical: true };
        } else if (action.direction === "up") {
          return { ...data20, invert_vertical: false };
        }
      }
      return null;
    }
  };
  var category_n_mn = {
    id: "category-n-mn",
    name: "n-MN",
    parent_id: "category-mn",
    generator: { start: 1, initial: 3, create: (n) => n_MN(n) }
  };
  function n_MN(n) {
    return {
      id: n + "-MN",
      name: "non triangular " + n + "MN",
      simple_name: n + "MN",
      category_id: "category-n-mn",
      display: {
        plain: (m) => mountain_display4(m, false),
        from_display: from_display13,
        name_id: "display.index"
      },
      display_equiv: {
        layer: {
          plain: (m) => mountain_display4(convert_to_layer5(m), false),
          from_display: (str) => convert_from_layer4(from_display13(str)),
          name_id: "display.layer"
        },
        marked: {
          plain: (m) => mountain_display_marked4(m, "label"),
          html: (m) => mountain_display_marked4(m, "sub"),
          from_display: from_display13,
          name_id: "display.index-marked"
        },
        simple: {
          plain: (m) => mountain_display4(m, true),
          from_display: from_display_simple4,
          name_id: "display.index-simple"
        },
        "layer simple": {
          plain: (m) => mountain_display4(convert_to_layer5(m), true),
          from_display: (s) => convert_from_layer4(from_display_simple4(s)),
          name_id: "display.layer-simple"
        }
      },
      draw_diagram: draw_diagram_control2,
      ...MN_FS_variants(expand11, is_infinity24, NT_infinity_FS(n), is_limit15, to_data_key2),
      is_limit: is_limit15,
      compare: compare19,
      credit_text_id: "credit.n_mn",
      init: () => [INFINITY23(), []]
    };
  }

  // src/notations/SMN/SA_omega2_MN.ts
  function Limit_expr() {
    return [[[Infinity]]];
  }
  function is_infinity25(m) {
    return "" + m === "Infinity";
  }
  function is_limit16(m) {
    return is_infinity25(m) || m.length > 0 && m[m.length - 1].length > 0;
  }
  function display13(m) {
    return is_infinity25(m) ? "Limit" : mountain_display5(m);
  }
  function mountain_display5(m) {
    return m.map(column_display13).join("");
  }
  function column_display13(c) {
    return "(" + c.map(entry_display6).join("") + ")";
  }
  function entry_display6([v, sep, mark4]) {
    return sep_display5(sep) + (mark4 ? "*" : "") + v;
  }
  function sep_display5(sep) {
    return ";".repeat(sep[1]) + ",".repeat(sep[0]);
  }
  function from_display14(str) {
    if (str === "Limit") return Limit_expr();
    function normalizeSep(s) {
      while (s.length > 0 && s[s.length - 1] === 0) s.pop();
      return s;
    }
    function parseSimpleSep(start) {
      let c0 = 0, c1 = 0;
      while (start + c1 < str.length && str[start + c1] === ";") c1++;
      while (start + c1 + c0 < str.length && str[start + c1 + c0] === ",") c0++;
      return [normalizeSep([c0, c1]), start + c1 + c0];
    }
    function parseExprPrefix(start) {
      const Mountain = [];
      let i = start;
      while (i < str.length && str[i] === "(") {
        i++;
        const col = [];
        while (i < str.length && str[i] !== ")") {
          const [sep, nextI] = parseSimpleSep(i);
          i = nextI;
          let mark4 = i < str.length && str[i] === "*";
          if (mark4) i++;
          let valueStart = i;
          while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
          const valueStr = str.substring(valueStart, i);
          if (valueStr === "") throw new Error("illegal input string: " + str);
          col.push([parseInt(valueStr), sep, mark4]);
        }
        Mountain.push(col);
        if (i === str.length || str[i] !== ")") throw new Error("illegal input string: " + str);
        i++;
      }
      return [Mountain, i];
    }
    const [result, end] = parseExprPrefix(0);
    if (end !== str.length) throw new Error("illegal input string: " + str);
    return result;
  }
  function sep_compare2(s1, s2) {
    return anti_lex_compare(s1, s2, number_compare);
  }
  function vertical_compare8(v1, v2) {
    return lex_compare(v1, v2, sep_compare2);
  }
  function entry_compare6(e1, e2) {
    return tuple_lex_compare(e1, e2, [number_compare, sep_compare2, void 0]);
  }
  function column_compare12(c1, c2) {
    return lex_compare(c1, c2, entry_compare6);
  }
  function mountain_compare5(m1, m2) {
    return lex_compare(m1, m2, column_compare12);
  }
  function compare20(a, b) {
    if (is_infinity25(a) || is_infinity25(b)) {
      return boolean_compare(is_infinity25(a), is_infinity25(b));
    }
    return mountain_compare5(a, b);
  }
  function sep_is_one(s) {
    return s.length === 1 && s[0] === 1;
  }
  function sep_dimension(s) {
    let d = 0;
    while (s[d] === 0) d++;
    return d;
  }
  function sep_add(a, b) {
    if (b.length === 0) return a;
    let result = deepcopy(a);
    while (result.length < b.length) result.push(0);
    result[b.length - 1] += b[b.length - 1];
    for (let d = 0; d < b.length - 1; d++) {
      result[d] = b[d];
    }
    return result;
  }
  function sep_sub(a, b) {
    if (a.length > b.length) return a;
    if (a.length < b.length) return [];
    let d = a.length;
    while (d > 0 && a[d - 1] === b[d - 1]) d--;
    if (d === 0 || a[d - 1] < b[d - 1]) return [];
    let result = a.slice(0, d);
    result[d - 1] -= b[d - 1];
    return result;
  }
  function sep_increase(a, d) {
    let result = deepcopy(a);
    while (result.length <= d) result.push(0);
    result[d]++;
    result.fill(0, 0, d);
    return result;
  }
  function vertical_increase8(v, s) {
    let i = v.length;
    while (i - 1 >= 0 && sep_compare2(v[i - 1], s) < 0) i--;
    return [...v.slice(0, i), s];
  }
  function column_verticals6(c) {
    const result = [];
    let current = [];
    for (let e of c) {
      result.push(current = vertical_increase8(current, e[1]));
    }
    return result;
  }
  function find_index_below2(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare8(Vij, v) < 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function find_index_below_equal2(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare8(Vij, v) <= 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function parent5(m, V, [i, j]) {
    const [value, _] = m[i][j];
    const pi = value - 1;
    const pj = pi === -1 ? 0 : find_index_below2(V[pi], V[i][j]);
    return [pi, pj];
  }
  function magma_indices2(m, V, [Ri, Rj], MI_partial) {
    const result = MI_partial ?? [];
    for (let i = result.length; i < m.length; i++) {
      result.push([]);
      if (i <= Ri) {
      } else {
        for (let j = 0; j < m[i].length; j++) {
          let [pi, pj] = parent5(m, V, [i, j]);
          if (pi < Ri) {
            break;
          } else if (pi === Ri) {
            result[i][j] = Math.min(pj, Rj);
          } else {
            if (pj === m[pi].length) pj--;
            if (pj >= result[pi].length) break;
            result[i][j] = result[pi][pj];
          }
        }
      }
    }
    return result;
  }
  function S2(c, j) {
    if (j > c.length) return S2(c, j - 1);
    if (j < 0) return [];
    if (c[j][1][1]) return [];
    if (c[j][2]) return c[j][1];
    return S2(c, j - 1);
  }
  function stretch_data_top(m, V) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent5(m, V, [right, top]);
    if (m[right][top][1][0] === 0) {
      const threshold2 = S2(m[Ri], Rj - 1);
      let stretch_to = S2(m[right], top - 1);
      let force = false;
      if (sep_compare2(stretch_to, threshold2) <= 0) {
        stretch_to = sep_increase(stretch_to, 0);
        force = true;
      }
      return { threshold: threshold2, stretch_to, force };
    } else {
      return void 0;
    }
  }
  function stretch_data_list(m, V, MI) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent5(m, V, [right, top]);
    const result = [];
    let ref_j = -1;
    for (let j = 0; j < Rj; j++) {
      while (ref_j + 1 <= top && MI[right][ref_j + 1] <= j) ref_j++;
      if (m[Ri][j][1][0] !== 0) {
        result[j] = void 0;
      } else {
        const threshold2 = S2(m[Ri], j - 1);
        const stretch_to = S2(m[right], ref_j - 1);
        result[j] = { threshold: threshold2, stretch_to, force: false };
      }
    }
    result[Rj] = stretch_data_top(m, V);
    return result;
  }
  function subtract_12(m, V, SD_top) {
    V = V ?? m.map(column_verticals6);
    SD_top = SD_top ?? stretch_data_top(m, V);
    const right = m.length - 1;
    const top = m[right].length - 1;
    const top_right_sep = m[right][top][1];
    const [Ri, Rj] = parent5(m, V, [right, top]);
    const result = deepcopy(m);
    result[right].pop();
    const top_right_sep_dimension = sep_dimension(top_right_sep);
    if (sep_is_one(top_right_sep)) {
    } else if (top_right_sep_dimension === 0) {
      const new_sep = [top_right_sep[0] - 1, ...top_right_sep.slice(1)];
      const v_parent = Rj === 0 ? [] : V[Ri][Rj - 1];
      const v_bottom = top === 0 ? [] : V[right][top - 1];
      if (vertical_compare8(vertical_increase8(v_parent, new_sep), v_bottom) > 0) {
        result[right].push([Ri + 1, new_sep, top_right_sep[0] === 0]);
      }
    } else if (SD_top.force) {
      const new_sep = SD_top.stretch_to;
      result[right].push([Ri + 1, new_sep, true]);
    }
    for (let j = Rj; j < m[Ri].length; j++) {
      result[right].push(deepcopy(m[Ri][j]));
    }
    return result;
  }
  function compute_stretch(sep, data20) {
    if (data20 === void 0) return sep;
    let { threshold: threshold2, stretch_to } = data20;
    if (sep_compare2(sep, threshold2) <= 0) {
      return sep;
    } else {
      return sep_add(stretch_to, sep_sub(sep, threshold2));
    }
  }
  function copy_column3(m0i, MI0i, V0i, mr, MIr, [Ri, Rj], SD, offset, stretch_v_max) {
    const result = [];
    let last_mi = -1;
    let ref_j = 0;
    for (let j = 0; j < m0i.length; j++) {
      if (j >= MI0i.length) {
        let entry = deepcopy(m0i[j]);
        if (entry[0] >= Ri + 1) entry[0] += offset;
        result.push(entry);
      } else {
        const [value, sep, mark4] = m0i[j];
        const new_value = value + offset;
        let current_mi = MI0i[j];
        if (current_mi !== last_mi) {
          last_mi = current_mi;
          while (ref_j < MIr.length && MIr[ref_j] === current_mi) {
            const is_row_lifting = current_mi === Rj || ref_j + 1 < MIr.length && MIr[ref_j + 1] === current_mi;
            if (is_row_lifting) {
              let [_, ref_sep, ref_mark] = mr[ref_j];
              result.push([new_value, ref_sep, ref_mark]);
            }
            ref_j++;
          }
        }
        const new_sep = vertical_compare8(V0i[j], stretch_v_max) > 0 ? sep : compute_stretch(sep, SD[current_mi]);
        result.push([new_value, new_sep, mark4]);
      }
    }
    return result;
  }
  function extend4(m0) {
    const right = m0.length - 1;
    const top = m0[right].length - 1;
    const V0 = m0.map(column_verticals6);
    const [Ri, Rj] = parent5(m0, V0, [right, top]);
    const MI0 = magma_indices2(m0, V0, [Ri, Rj]);
    const SD0 = stretch_data_list(m0, V0, MI0);
    const m = subtract_12(m0, V0, SD0[Rj]);
    const V = [...V0.slice(0, right), column_verticals6(m[right])];
    const MI = magma_indices2(m, V, [Ri, Rj], MI0.slice(0, right));
    const offset = right - Ri;
    for (let i = Ri + 1; i < m0.length; i++) {
      m.push(copy_column3(m0[i], MI0[i], V0[i], m[right], MI[right], [Ri, Rj], SD0, offset, V0[right][top]));
    }
    return m;
  }
  function infinity_FS22(index) {
    return [[], [[1, [index, 1], false]]];
  }
  function expand12(m, index, shorter = false) {
    if (is_infinity25(m)) return infinity_FS22(index);
    if (m.length === 0) return m;
    if (m[m.length - 1].length === 0) return m.slice(0, m.length - 1);
    let current = m;
    for (let i = 0; i < index; ++i) current = extend4(current);
    current = shorter ? current.slice(0, current.length - 1) : subtract_12(current);
    return current;
  }
  function calc_ancestor_depths5(m) {
    const V = m.map(column_verticals6);
    const depthMap = [];
    for (let i = 0; i < m.length; i++) {
      depthMap[i] = [];
      for (let j = 0; j < m[i].length; j++) {
        const [pi, pj] = parent5(m, V, [i, j]);
        depthMap[i][j] = pj === m[pi].length ? 1 : 1 + depthMap[pi][pj];
      }
    }
    return depthMap;
  }
  function convert_to_layer6(om) {
    if (is_infinity25(om)) return om;
    const depthMap = calc_ancestor_depths5(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j];
      }
    }
    return dm;
  }
  function convert_from_layer5(dm) {
    if (is_infinity25(dm)) return dm;
    const om = deepcopy(dm);
    let V = om.map(column_verticals6);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent5(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_equal2(V[i1], j === 0 ? [] : V[i][j - 1]);
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function column_display_marked5(c, type, index) {
    let result = c.map(entry_display6).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked5(m, type) {
    if (is_infinity25(m)) return "Limit";
    return m.map((col, i) => column_display_marked5(col, type, i + 1)).join("");
  }
  var SA_omega2_MN = {
    id: "SA-omega2-MN",
    name: "Smile's Astral \u03C92 MN",
    simple_name: "SA\u03C92MN",
    category_id: "category-smile-mn",
    display: { plain: display13, from_display: from_display14, name_id: "display.index" },
    display_equiv: {
      layer: {
        plain: (m) => display13(convert_to_layer6(m)),
        from_display: (str) => convert_from_layer5(from_display14(str)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked5(m, "label"),
        html: (m) => mountain_display_marked5(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    ...MN_FS_variants(expand12, is_infinity25, infinity_FS22, is_limit16, display13),
    is_limit: is_limit16,
    compare: compare20,
    credit_text_id: "credit.n_mn",
    init: () => [Limit_expr(), []],
    debug: { extend: extend4, expand: expand12, subtract_1: subtract_12, copy_column: copy_column3, stretch_data_list, column_verticals: column_verticals6, magma_indices: magma_indices2 }
  };

  // src/notations/SMN/S_omega2_MN.ts
  function Limit_expr2() {
    return [[[Infinity]]];
  }
  function is_infinity26(m) {
    return "" + m === "Infinity";
  }
  function is_limit17(m) {
    return is_infinity26(m) || m.length > 0 && m[m.length - 1].length > 0;
  }
  function display14(m) {
    return is_infinity26(m) ? "Limit" : mountain_display6(m);
  }
  function mountain_display6(m) {
    return m.map(column_display14).join("");
  }
  function column_display14(c) {
    return "(" + c.map(entry_display7).join("") + ")";
  }
  function entry_display7([v, sep]) {
    return sep_display6(sep) + v;
  }
  function sep_display6(sep) {
    return ";".repeat(sep[1]) + ",".repeat(sep[0]);
  }
  function from_display15(str) {
    if (str === "Limit") return Limit_expr2();
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + str);
    }
    function normalize_sep(s) {
      while (s.length > 0 && s[s.length - 1] === 0) s.pop();
      return s;
    }
    function skip_spaces() {
      while (i < str.length && str[i] === " ") i++;
    }
    function skip_index() {
      if (i < str.length && str[i] === ":") {
        i++;
        skip_spaces();
        while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      }
    }
    function parse_sep() {
      let c0 = 0, c1 = 0;
      while (i < str.length && str[i] === ";") {
        c1++;
        i++;
      }
      while (i < str.length && str[i] === ",") {
        c0++;
        i++;
      }
      if (c0 === 0 && c1 === 0) error();
      return normalize_sep([c0, c1]);
    }
    function parse_number() {
      const start = i;
      while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      if (start === i) error();
      return parseInt(str.substring(start, i), 10);
    }
    function parse_parenthesized_column() {
      i++;
      const col = [];
      skip_spaces();
      while (i < str.length && str[i] !== ")" && str[i] !== ":") {
        skip_spaces();
        const sep = parse_sep();
        skip_spaces();
        const v = parse_number();
        col.push([v, sep]);
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= str.length || str[i] !== ")") error();
      i++;
      return col;
    }
    function parse_unparenthesized_column() {
      skip_spaces();
      if (i >= str.length) error();
      if (str[i] === "0" && (i + 1 >= str.length || str[i + 1] === ":" || str[i + 1] === " " || str[i + 1] === "(" || str[i + 1] === "," || str[i + 1] === ";")) {
        i++;
        skip_index();
        return [];
      }
      const col = [];
      if (str[i] === ":") {
        skip_index();
        return [];
      }
      while (i < str.length && str[i] !== " " && str[i] !== "(" && str[i] !== ":") {
        const sep = parse_sep();
        skip_spaces();
        col.push([parse_number(), sep]);
      }
      skip_index();
      return col;
    }
    const result = [];
    skip_spaces();
    while (i < str.length) {
      if (str[i] === "(") {
        result.push(parse_parenthesized_column());
      } else {
        result.push(parse_unparenthesized_column());
      }
      skip_spaces();
    }
    return result;
  }
  function sep_compare3(s1, s2) {
    return anti_lex_compare(s1, s2, number_compare);
  }
  function vertical_compare9(v1, v2) {
    return lex_compare(v1, v2, sep_compare3);
  }
  function entry_compare7(e1, e2) {
    return tuple_lex_compare(e1, e2, [number_compare, sep_compare3]);
  }
  function column_compare13(c1, c2) {
    return lex_compare(c1, c2, entry_compare7);
  }
  function mountain_compare6(m1, m2) {
    return lex_compare(m1, m2, column_compare13);
  }
  function compare21(a, b) {
    if (is_infinity26(a) || is_infinity26(b)) {
      return boolean_compare(is_infinity26(a), is_infinity26(b));
    }
    return mountain_compare6(a, b);
  }
  function sep_is_one2(s) {
    return s.length === 1 && s[0] === 1;
  }
  function sep_dimension2(s) {
    let d = 0;
    while (s[d] === 0) d++;
    return d;
  }
  function sep_add2(a, b) {
    if (b.length === 0) return a;
    let result = deepcopy(a);
    while (result.length < b.length) result.push(0);
    result[b.length - 1] += b[b.length - 1];
    for (let d = 0; d < b.length - 1; d++) {
      result[d] = b[d];
    }
    return result;
  }
  function sep_sub2(a, b) {
    if (a.length > b.length) return a;
    if (a.length < b.length) return [];
    let d = a.length;
    while (d > 0 && a[d - 1] === b[d - 1]) d--;
    if (d === 0 || a[d - 1] < b[d - 1]) return [];
    let result = a.slice(0, d);
    result[d - 1] -= b[d - 1];
    return result;
  }
  function sep_increase2(a, d) {
    let result = deepcopy(a);
    while (result.length <= d) result.push(0);
    result[d]++;
    result.fill(0, 0, d);
    return result;
  }
  function vertical_increase9(v, s) {
    let i = v.length;
    while (i - 1 >= 0 && sep_compare3(v[i - 1], s) < 0) i--;
    return [...v.slice(0, i), s];
  }
  function column_verticals7(c) {
    const result = [];
    let current = [];
    for (let e of c) {
      result.push(current = vertical_increase9(current, e[1]));
    }
    return result;
  }
  function find_index_below3(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare9(Vij, v) < 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function find_index_below_equal3(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare9(Vij, v) <= 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function parent6(m, V, [i, j]) {
    const [value, _] = m[i][j];
    const pi = value - 1;
    const pj = pi === -1 ? 0 : find_index_below3(V[pi], V[i][j]);
    return [pi, pj];
  }
  function magma_indices3(m, V, [Ri, Rj], MI_partial) {
    const result = MI_partial ?? [];
    for (let i = result.length; i < m.length; i++) {
      result.push([]);
      if (i <= Ri) {
      } else {
        for (let j = 0; j < m[i].length; j++) {
          let [pi, pj] = parent6(m, V, [i, j]);
          if (pi < Ri) {
            break;
          } else if (pi === Ri) {
            result[i][j] = Math.min(pj, Rj);
          } else {
            if (pj === m[pi].length) pj--;
            if (pj >= result[pi].length) break;
            result[i][j] = result[pi][pj];
          }
        }
      }
    }
    return result;
  }
  function S3(c, j, bound) {
    if (j > c.length) return S3(c, j - 1, bound);
    if (j < 0) return [];
    if (sep_compare3(c[j][1], bound) >= 0) return [];
    let current = c[j][1];
    let previous = S3(c, j - 1, bound);
    return sep_compare3(current, previous) < 0 ? previous : current;
  }
  function stretch_data_top2(m, V) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent6(m, V, [right, top]);
    let top_right_sep = m[right][top][1];
    if (sep_dimension2(top_right_sep) > 0) {
      const threshold2 = S3(m[Ri], Rj - 1, top_right_sep);
      let stretch_to = S3(m[right], top - 1, top_right_sep);
      let force = false;
      if (sep_compare3(stretch_to, threshold2) <= 0) {
        stretch_to = sep_increase2(stretch_to, 0);
        force = true;
      }
      return { threshold: threshold2, stretch_to, force };
    } else {
      const threshold2 = [top_right_sep[0] - 1, ...top_right_sep.slice(1)];
      const stretch_to = threshold2;
      let force = false;
      if (!sep_is_one2(top_right_sep)) {
        const v_parent = Rj === 0 ? [] : V[Ri][Rj - 1];
        const v_bottom = top === 0 ? [] : V[right][top - 1];
        if (vertical_compare9(vertical_increase9(v_parent, stretch_to), v_bottom) > 0) {
          force = true;
        }
      }
      return { threshold: threshold2, stretch_to, force };
    }
  }
  function stretch_data_list2(m, V, MI) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent6(m, V, [right, top]);
    const result = [];
    let ref_j = -1;
    for (let j = 0; j < Rj; j++) {
      while (ref_j + 1 <= top && MI[right][ref_j + 1] <= j) ref_j++;
      let current_top_sep = m[Ri][j][1];
      const threshold2 = S3(m[Ri], j - 1, current_top_sep);
      const stretch_to = S3(m[right], ref_j - 1, current_top_sep);
      result[j] = { threshold: threshold2, stretch_to, force: false };
    }
    result[Rj] = stretch_data_top2(m, V);
    return result;
  }
  function subtract_13(m, V, SD_top) {
    V = V ?? m.map(column_verticals7);
    SD_top = SD_top ?? stretch_data_top2(m, V);
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent6(m, V, [right, top]);
    const result = deepcopy(m);
    result[right].pop();
    if (SD_top.force) {
      const new_sep = SD_top.stretch_to;
      result[right].push([Ri + 1, new_sep]);
    }
    for (let j = Rj; j < m[Ri].length; j++) {
      result[right].push(deepcopy(m[Ri][j]));
    }
    return result;
  }
  function compute_stretch2(sep, data20) {
    if (data20 === void 0) return sep;
    let { threshold: threshold2, stretch_to } = data20;
    if (sep_compare3(sep, threshold2) <= 0) {
      return sep;
    } else {
      return sep_add2(stretch_to, sep_sub2(sep, threshold2));
    }
  }
  function copy_column4(m0i, MI0i, V0i, mr, MIr, [Ri, Rj], SD, offset, stretch_v_max) {
    const result = [];
    let last_mi = -1;
    let ref_j = 0;
    for (let j = 0; j < m0i.length; j++) {
      if (j >= MI0i.length) {
        let entry = deepcopy(m0i[j]);
        if (entry[0] >= Ri + 1) entry[0] += offset;
        result.push(entry);
      } else {
        const [value, sep] = m0i[j];
        const new_value = value + offset;
        let current_mi = MI0i[j];
        if (current_mi !== last_mi) {
          last_mi = current_mi;
          while (ref_j < MIr.length && MIr[ref_j] === current_mi) {
            const is_row_lifting = current_mi === Rj || ref_j + 1 < MIr.length && MIr[ref_j + 1] === current_mi;
            if (is_row_lifting) {
              let [_, ref_sep] = mr[ref_j];
              result.push([new_value, ref_sep]);
            }
            ref_j++;
          }
        }
        const new_sep = vertical_compare9(V0i[j], stretch_v_max) > 0 ? sep : compute_stretch2(sep, SD[current_mi]);
        result.push([new_value, new_sep]);
      }
    }
    return result;
  }
  function extend5(m0) {
    const right = m0.length - 1;
    const top = m0[right].length - 1;
    const V0 = m0.map(column_verticals7);
    const [Ri, Rj] = parent6(m0, V0, [right, top]);
    const MI0 = magma_indices3(m0, V0, [Ri, Rj]);
    const SD0 = stretch_data_list2(m0, V0, MI0);
    const m = subtract_13(m0, V0, SD0[Rj]);
    const V = [...V0.slice(0, right), column_verticals7(m[right])];
    const MI = magma_indices3(m, V, [Ri, Rj], MI0.slice(0, right));
    const offset = right - Ri;
    for (let i = Ri + 1; i < m0.length; i++) {
      m.push(copy_column4(m0[i], MI0[i], V0[i], m[right], MI[right], [Ri, Rj], SD0, offset, V0[right][top]));
    }
    return m;
  }
  function infinity_FS23(index) {
    return [[], [[1, [index, 1]]]];
  }
  function expand13(m, index, shorter = false) {
    if (is_infinity26(m)) return infinity_FS23(index);
    if (m.length === 0) return m;
    if (m[m.length - 1].length === 0) return m.slice(0, m.length - 1);
    let current = m;
    for (let i = 0; i < index; ++i) current = extend5(current);
    current = shorter ? current.slice(0, current.length - 1) : subtract_13(current);
    return current;
  }
  function calc_ancestor_depths6(m) {
    const V = m.map(column_verticals7);
    const depthMap = [];
    for (let i = 0; i < m.length; i++) {
      depthMap[i] = [];
      for (let j = 0; j < m[i].length; j++) {
        const [pi, pj] = parent6(m, V, [i, j]);
        depthMap[i][j] = pj === m[pi].length ? 1 : 1 + depthMap[pi][pj];
      }
    }
    return depthMap;
  }
  function convert_to_layer7(om) {
    if (is_infinity26(om)) return om;
    const depthMap = calc_ancestor_depths6(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j];
      }
    }
    return dm;
  }
  function convert_from_layer6(dm) {
    if (is_infinity26(dm)) return dm;
    const om = deepcopy(dm);
    let V = om.map(column_verticals7);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent6(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_equal3(V[i1], j === 0 ? [] : V[i][j - 1]);
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function column_display_marked6(c, type, index) {
    let result = c.map(entry_display7).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked6(m, type) {
    if (is_infinity26(m)) return "Limit";
    return m.map((col, i) => column_display_marked6(col, type, i + 1)).join("");
  }
  var S_omega2_MN = {
    id: "S-omega2-MN",
    name: "Smile's \u03C92 MN",
    simple_name: "S\u03C92MN",
    category_id: "category-smile-mn",
    display: {
      plain: display14,
      from_display: from_display15,
      name_id: "display.index"
    },
    display_equiv: {
      layer: {
        plain: (m) => display14(convert_to_layer7(m)),
        from_display: (str) => convert_from_layer6(from_display15(str)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked6(m, "label"),
        html: (m) => mountain_display_marked6(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    ...MN_FS_variants(expand13, is_infinity26, infinity_FS23, is_limit17, display14),
    is_limit: is_limit17,
    compare: compare21,
    credit_text_id: "credit.n_mn",
    init: () => [Limit_expr2(), []],
    debug: { extend: extend5, expand: expand13, subtract_1: subtract_13, copy_column: copy_column4, stretch_data_list: stretch_data_list2, column_verticals: column_verticals7, magma_indices: magma_indices3 }
  };

  // src/notations/SMN/S_omega_pow_omega_MN.ts
  function Limit_expr3() {
    return [[[Infinity]]];
  }
  function is_infinity27(m) {
    return "" + m === "Infinity";
  }
  function is_limit18(m) {
    return is_infinity27(m) || m.length > 0 && m[m.length - 1].length > 0;
  }
  function display15(m) {
    return is_infinity27(m) ? "Limit" : mountain_display7(m);
  }
  function mountain_display7(m) {
    return m.map(column_display15).join("");
  }
  function column_display15(c) {
    return "(" + c.map(entry_display8).join("") + ")";
  }
  function entry_display8([v, sep]) {
    return sep_display7(sep) + v;
  }
  function sep_display7(sep) {
    if (sep.length <= 2) return ";".repeat(sep[1]) + ",".repeat(sep[0]);
    return "[" + sep.toReversed().join(",") + "]";
  }
  function from_display16(str) {
    if (str === "Limit") return Limit_expr3();
    let i = 0;
    function error() {
      throw new Error("Illegal input string: " + str);
    }
    function normalize_sep(s) {
      while (s.length > 0 && s[s.length - 1] === 0) s.pop();
      return s;
    }
    function skip_spaces() {
      while (i < str.length && str[i] === " ") i++;
    }
    function skip_index() {
      if (i < str.length && str[i] === ":") {
        i++;
        skip_spaces();
        while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      }
    }
    function is_sep_start(ch) {
      return ch === "," || ch === ";" || ch === "[";
    }
    function parse_sep() {
      if (i < str.length && str[i] === "[") {
        i++;
        const parts = [];
        skip_spaces();
        while (i < str.length && str[i] !== "]") {
          const start = i;
          while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
          if (start === i) error();
          parts.push(parseInt(str.substring(start, i), 10));
          skip_spaces();
          if (i < str.length && str[i] === ",") {
            i++;
            skip_spaces();
          }
        }
        if (i >= str.length || str[i] !== "]") error();
        i++;
        return normalize_sep(parts.toReversed());
      }
      let c0 = 0, c1 = 0;
      while (i < str.length && str[i] === ";") {
        c1++;
        i++;
      }
      while (i < str.length && str[i] === ",") {
        c0++;
        i++;
      }
      if (c0 === 0 && c1 === 0) error();
      return normalize_sep([c0, c1]);
    }
    function parse_number() {
      const start = i;
      while (i < str.length && str[i] >= "0" && str[i] <= "9") i++;
      if (start === i) error();
      return parseInt(str.substring(start, i), 10);
    }
    function parse_parenthesized_column() {
      i++;
      const col = [];
      skip_spaces();
      while (i < str.length && str[i] !== ")" && str[i] !== ":") {
        skip_spaces();
        const sep = parse_sep();
        skip_spaces();
        const v = parse_number();
        col.push([v, sep]);
        skip_spaces();
      }
      skip_index();
      skip_spaces();
      if (i >= str.length || str[i] !== ")") error();
      i++;
      return col;
    }
    function parse_unparenthesized_column() {
      skip_spaces();
      if (i >= str.length) error();
      if (str[i] === "0" && (i + 1 >= str.length || str[i + 1] === ":" || str[i + 1] === " " || str[i + 1] === "(" || is_sep_start(str[i + 1]))) {
        i++;
        skip_index();
        return [];
      }
      const col = [];
      if (str[i] === ":") {
        skip_index();
        return [];
      }
      while (i < str.length && str[i] !== " " && str[i] !== "(" && str[i] !== ":") {
        const sep = parse_sep();
        skip_spaces();
        col.push([parse_number(), sep]);
      }
      skip_index();
      return col;
    }
    const result = [];
    skip_spaces();
    while (i < str.length) {
      if (str[i] === "(") {
        result.push(parse_parenthesized_column());
      } else {
        result.push(parse_unparenthesized_column());
      }
      skip_spaces();
    }
    return result;
  }
  function sep_compare4(s1, s2) {
    return anti_lex_compare(s1, s2, number_compare);
  }
  function vertical_compare10(v1, v2) {
    return lex_compare(v1, v2, sep_compare4);
  }
  function entry_compare8(e1, e2) {
    return tuple_lex_compare(e1, e2, [number_compare, sep_compare4]);
  }
  function column_compare14(c1, c2) {
    return lex_compare(c1, c2, entry_compare8);
  }
  function mountain_compare7(m1, m2) {
    return lex_compare(m1, m2, column_compare14);
  }
  function compare22(a, b) {
    if (is_infinity27(a) || is_infinity27(b)) {
      return boolean_compare(is_infinity27(a), is_infinity27(b));
    }
    return mountain_compare7(a, b);
  }
  function sep_is_one3(s) {
    return s.length === 1 && s[0] === 1;
  }
  function sep_dimension3(s) {
    let d = 0;
    while (s[d] === 0) d++;
    return d;
  }
  function sep_add3(a, b) {
    if (b.length === 0) return a;
    let result = deepcopy(a);
    while (result.length < b.length) result.push(0);
    result[b.length - 1] += b[b.length - 1];
    for (let d = 0; d < b.length - 1; d++) {
      result[d] = b[d];
    }
    return result;
  }
  function sep_sub3(a, b) {
    if (a.length > b.length) return a;
    if (a.length < b.length) return [];
    let d = a.length;
    while (d > 0 && a[d - 1] === b[d - 1]) d--;
    if (d === 0 || a[d - 1] < b[d - 1]) return [];
    let result = a.slice(0, d);
    result[d - 1] -= b[d - 1];
    return result;
  }
  function sep_increase3(a, d) {
    let result = deepcopy(a);
    while (result.length <= d) result.push(0);
    result[d]++;
    result.fill(0, 0, d);
    return result;
  }
  function vertical_increase10(v, s) {
    let i = v.length;
    while (i - 1 >= 0 && sep_compare4(v[i - 1], s) < 0) i--;
    return [...v.slice(0, i), s];
  }
  function column_verticals8(c) {
    const result = [];
    let current = [];
    for (let e of c) {
      result.push(current = vertical_increase10(current, e[1]));
    }
    return result;
  }
  function find_index_below4(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare10(Vij, v) < 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function find_index_below_equal4(Vi, v) {
    let l = 0, r2 = Vi.length;
    while (l < r2) {
      const j = Math.ceil((l + r2) / 2);
      const Vij = j === 0 ? [] : Vi[j - 1];
      if (vertical_compare10(Vij, v) <= 0) l = j;
      else r2 = j - 1;
    }
    return l;
  }
  function parent7(m, V, [i, j]) {
    const [value, _] = m[i][j];
    const pi = value - 1;
    const pj = pi === -1 ? 0 : find_index_below4(V[pi], V[i][j]);
    return [pi, pj];
  }
  function magma_indices4(m, V, [Ri, Rj], MI_partial) {
    const result = MI_partial ?? [];
    for (let i = result.length; i < m.length; i++) {
      result.push([]);
      if (i <= Ri) {
      } else {
        for (let j = 0; j < m[i].length; j++) {
          let [pi, pj] = parent7(m, V, [i, j]);
          if (pi < Ri) {
            break;
          } else if (pi === Ri) {
            result[i][j] = Math.min(pj, Rj);
          } else {
            if (pj === m[pi].length) pj--;
            if (pj >= result[pi].length) break;
            result[i][j] = result[pi][pj];
          }
        }
      }
    }
    return result;
  }
  function S_default(bound) {
    let d = sep_dimension3(bound);
    if (d === bound.length - 1 && bound[d] === 1) return [];
    let result = deepcopy(bound);
    result[d]--;
    return result;
  }
  function S4(c, j, bound) {
    if (j > c.length) return S4(c, j - 1, bound);
    if (j < 0) return S_default(bound);
    if (sep_compare4(c[j][1], bound) >= 0) return S_default(bound);
    let current = c[j][1];
    let previous = S4(c, j - 1, bound);
    return sep_compare4(current, previous) < 0 ? previous : current;
  }
  function stretch_data_top3(m, V) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent7(m, V, [right, top]);
    let top_right_sep = m[right][top][1];
    const threshold2 = S4(m[Ri], Rj - 1, top_right_sep);
    let stretch_to = S4(m[right], top - 1, top_right_sep);
    let force = false;
    if (sep_is_one3(top_right_sep)) {
    } else if (sep_dimension3(top_right_sep) > 0) {
      if (sep_compare4(stretch_to, sep_increase3(threshold2, sep_dimension3(top_right_sep) - 1)) < 0) {
        stretch_to = sep_increase3(stretch_to, sep_dimension3(top_right_sep) - 1);
        force = true;
      }
    } else {
      const v_parent = Rj === 0 ? [] : V[Ri][Rj - 1];
      const v_bottom = top === 0 ? [] : V[right][top - 1];
      if (vertical_compare10(vertical_increase10(v_parent, stretch_to), v_bottom) > 0) {
        force = true;
      }
    }
    return { threshold: threshold2, stretch_to, force };
  }
  function stretch_data_list3(m, V, MI) {
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent7(m, V, [right, top]);
    const result = [];
    let ref_j = -1;
    for (let j = 0; j < Rj; j++) {
      while (ref_j + 1 <= top && MI[right][ref_j + 1] <= j) ref_j++;
      let current_top_sep = m[Ri][j][1];
      const threshold2 = S4(m[Ri], j - 1, current_top_sep);
      const stretch_to = S4(m[right], ref_j - 1, current_top_sep);
      result[j] = { threshold: threshold2, stretch_to, force: false };
    }
    result[Rj] = stretch_data_top3(m, V);
    return result;
  }
  function subtract_14(m, V, SD_top) {
    V = V ?? m.map(column_verticals8);
    SD_top = SD_top ?? stretch_data_top3(m, V);
    const right = m.length - 1;
    const top = m[right].length - 1;
    const [Ri, Rj] = parent7(m, V, [right, top]);
    const result = deepcopy(m);
    result[right].pop();
    if (SD_top.force) {
      const new_sep = SD_top.stretch_to;
      result[right].push([Ri + 1, new_sep]);
    }
    for (let j = Rj; j < m[Ri].length; j++) {
      result[right].push(deepcopy(m[Ri][j]));
    }
    return result;
  }
  function compute_stretch3(sep, data20) {
    if (data20 === void 0) return sep;
    let { threshold: threshold2, stretch_to } = data20;
    if (sep_compare4(sep, threshold2) <= 0) {
      return sep;
    } else {
      return sep_add3(stretch_to, sep_sub3(sep, threshold2));
    }
  }
  function copy_column5(m0i, MI0i, V0i, mr, MIr, [Ri, Rj], SD, offset, stretch_v_max) {
    const result = [];
    let last_mi = -1;
    let ref_j = 0;
    for (let j = 0; j < m0i.length; j++) {
      if (j >= MI0i.length) {
        let entry = deepcopy(m0i[j]);
        if (entry[0] >= Ri + 1) entry[0] += offset;
        result.push(entry);
      } else {
        const [value, sep] = m0i[j];
        const new_value = value + offset;
        let current_mi = MI0i[j];
        if (current_mi !== last_mi) {
          last_mi = current_mi;
          while (ref_j < MIr.length && MIr[ref_j] === current_mi) {
            const is_row_lifting = current_mi === Rj || ref_j + 1 < MIr.length && MIr[ref_j + 1] === current_mi;
            if (is_row_lifting) {
              let [_, ref_sep] = mr[ref_j];
              result.push([new_value, ref_sep]);
            }
            ref_j++;
          }
        }
        const new_sep = vertical_compare10(V0i[j], stretch_v_max) > 0 ? sep : compute_stretch3(sep, SD[current_mi]);
        result.push([new_value, new_sep]);
      }
    }
    return result;
  }
  function extend6(m0) {
    const right = m0.length - 1;
    const top = m0[right].length - 1;
    const V0 = m0.map(column_verticals8);
    const [Ri, Rj] = parent7(m0, V0, [right, top]);
    const MI0 = magma_indices4(m0, V0, [Ri, Rj]);
    const SD0 = stretch_data_list3(m0, V0, MI0);
    const m = subtract_14(m0, V0, SD0[Rj]);
    const V = [...V0.slice(0, right), column_verticals8(m[right])];
    const MI = magma_indices4(m, V, [Ri, Rj], MI0.slice(0, right));
    const offset = right - Ri;
    for (let i = Ri + 1; i < m0.length; i++) {
      m.push(copy_column5(m0[i], MI0[i], V0[i], m[right], MI[right], [Ri, Rj], SD0, offset, V0[right][top]));
    }
    return m;
  }
  function infinity_FS24(index) {
    return [[], [[1, [...Array.from({ length: index }, () => 0), 1]]]];
  }
  function expand14(m, index, shorter = false) {
    if (is_infinity27(m)) return infinity_FS24(index);
    if (m.length === 0) return m;
    if (m[m.length - 1].length === 0) return m.slice(0, m.length - 1);
    let current = m;
    for (let i = 0; i < index; ++i) current = extend6(current);
    current = shorter ? current.slice(0, current.length - 1) : subtract_14(current);
    return current;
  }
  function calc_ancestor_depths7(m) {
    const V = m.map(column_verticals8);
    const depthMap = [];
    for (let i = 0; i < m.length; i++) {
      depthMap[i] = [];
      for (let j = 0; j < m[i].length; j++) {
        const [pi, pj] = parent7(m, V, [i, j]);
        depthMap[i][j] = pj === m[pi].length ? 1 : 1 + depthMap[pi][pj];
      }
    }
    return depthMap;
  }
  function convert_to_layer8(om) {
    if (is_infinity27(om)) return om;
    const depthMap = calc_ancestor_depths7(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
      const column = dm[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        entry[0] = depthMap[i][j];
      }
    }
    return dm;
  }
  function convert_from_layer7(dm) {
    if (is_infinity27(dm)) return dm;
    const om = deepcopy(dm);
    let V = om.map(column_verticals8);
    for (let i = 0; i < om.length; i++) {
      const column = om[i];
      for (let j = 0; j < column.length; j++) {
        const entry = column[j];
        let i1 = i, j1 = j - 1;
        while (true) {
          if (i1 === 0) {
            entry[0] = 1;
            break;
          }
          if (j1 >= 0) {
            [i1, j1] = parent7(om, V, [i1, j1]);
          } else {
            i1 = i1 - 1;
          }
          let j0 = find_index_below_equal4(V[i1], j === 0 ? [] : V[i][j - 1]);
          if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
            entry[0] = i1 + 1;
            break;
          }
        }
      }
    }
    return om;
  }
  function column_display_marked7(c, type, index) {
    let result = c.map(entry_display8).join("");
    if (type === "label") result += ":" + index;
    result = "(" + result + ")";
    if (type === "sub") result += "<sub>" + index + "</sub>";
    return result;
  }
  function mountain_display_marked7(m, type) {
    if (is_infinity27(m)) return "Limit";
    return m.map((col, i) => column_display_marked7(col, type, i + 1)).join("");
  }
  var S_omega_pow_omega_MN = {
    id: "S-omega^omega-MN",
    name: "Smile's \u03C9^\u03C9 MN",
    simple_name: "S\u03C9^\u03C9MN",
    category_id: "category-smile-mn",
    display: { plain: display15, from_display: from_display16, name_id: "display.index" },
    display_equiv: {
      layer: {
        plain: (m) => display15(convert_to_layer8(m)),
        from_display: (str) => convert_from_layer7(from_display16(str)),
        name_id: "display.layer"
      },
      marked: {
        plain: (m) => mountain_display_marked7(m, "label"),
        html: (m) => mountain_display_marked7(m, "sub"),
        name_id: "display.index-marked"
      }
    },
    ...MN_FS_variants(expand14, is_infinity27, infinity_FS24, is_limit18, display15),
    is_limit: is_limit18,
    compare: compare22,
    credit_text_id: "credit.n_mn",
    init: () => [Limit_expr3(), []],
    debug: { extend: extend6, expand: expand14, subtract_1: subtract_14, copy_column: copy_column5, stretch_data_list: stretch_data_list3, column_verticals: column_verticals8, magma_indices: magma_indices4 }
  };

  // src/notations/DEN/DEN2.ts
  function toShort(expr) {
    return expr.map(
      (row) => row[1].slice(0, -row[0]).concat([row[1][row[1].length - 1]]).map((x) => x[0])
    );
  }
  function seq_seq_compare(m1, m2) {
    return lex_compare(m1, m2, (r1, r2) => lex_compare(r1, r2, number_compare));
  }
  function compare23(expr1, expr2) {
    if ("" + expr1 === "Infinity" && "" + expr2 === "Infinity") return 0;
    if ("" + expr1 === "Infinity") return 1;
    if ("" + expr2 === "Infinity") return -1;
    return seq_seq_compare(toShort(expr1), toShort(expr2));
  }
  function is_infinity28(expr) {
    return "" + expr === "Infinity";
  }
  function entry_display9(x) {
    return (x[1] ? "*" : "") + x[0];
  }
  function row_display(row) {
    return "(" + row[1].map(entry_display9).join(",") + ")" + row[0];
  }
  function display16(expr) {
    return is_infinity28(expr) ? "Limit" : expr.map(row_display).join("");
  }
  function from_display17(str) {
    if (str === "Limit") return [Infinity];
    const result = [];
    const fullPattern = /^(\([^)]+\)\d+)*$/;
    if (!fullPattern.test(str)) throw new Error("illegal input string: " + str);
    const groupRegex = /\(([^)]+)\)(\d+)/g;
    let match;
    let lastIndex = 0;
    while ((match = groupRegex.exec(str)) !== null) {
      if (match.index !== lastIndex) throw new Error("illegal input string: " + str);
      const inner3 = match[1], stepLengthStr = match[2];
      if (!/^\d+$/.test(stepLengthStr)) throw new Error("illegal input string: " + str);
      const stepLength = parseInt(stepLengthStr, 10);
      if (inner3.length === 0) throw new Error("illegal input string: " + str);
      const parts = inner3.split(",");
      const group = [];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.length === 0) throw new Error("illegal input string: " + str);
        const hasStar = part.startsWith("*");
        let numStr = hasStar ? part.slice(1) : part;
        if (hasStar && numStr.length === 0) throw new Error("illegal input string: " + str);
        if (!/^\d+$/.test(numStr)) throw new Error("illegal input string: " + str);
        const num = parseInt(numStr, 10);
        if (hasStar) group.push([num, true]);
        else group.push([num]);
      }
      result.push([stepLength, group]);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex !== str.length) throw new Error("illegal input string: " + str);
    return result;
  }
  function values(row) {
    return row[1].map((x) => x[0]);
  }
  function pleasant_until(rows, t) {
    let t_check = values(t).slice(t[0]);
    let t_max = t_check[0], t_min = t_check[t_check.length - 1];
    for (let n = 0; n < rows.length; n++) {
      let s_check = rows[n][1];
      let i1 = index_of_first(s_check, ([x]) => x < t_max);
      let i2 = index_of_last(s_check, ([x]) => x > t_min);
      if (~i1 && ~i2 && i1 <= i2 && s_check.slice(i1, i2 + 1).some(([x]) => !t_check.includes(x))) return n;
    }
    return -1;
  }
  function is_limit19(expr) {
    if (is_infinity28(expr)) return true;
    if (expr.length === 0) return false;
    let active = expr[expr.length - 1];
    if (!active[1][active[0]]?.[0]) return false;
    return pleasant_until(expr.slice(active[1][active[0]][0] - 1, -1), active) === -1;
  }
  function cut(expr) {
    return deepcopy(expr.slice(0, -1));
  }
  function seqFrom(expr, i, j) {
    let row = expr[i], val = row[1][j][0], threshold2 = row[1][j + row[0]]?.[0] ?? 0;
    let record = [[i + 1, j], [val]];
    while (val > threshold2) {
      row = expr[val - 1];
      let idx = row[0];
      record[record.length - 1][1] = idx;
      val = row[1][idx]?.[0];
      record.push([val]);
    }
    record.pop();
    return record;
  }
  function apv(s, t, step_t) {
    return s.map(
      (x) => x < t[t.length - 1] ? x : x >= t[step_t] ? x - t[step_t] + t[0] : t[t.lastIndexOf(x) - step_t]
    );
  }
  function ap(s, t) {
    return [s[0], apv(values(s), values(t), t[0]).map((x) => [x])];
  }
  function copy(raw, flag) {
    let active = raw[raw.length - 1];
    let expr = cut(raw);
    let begin = active[1][active[0]][0];
    let end = ~flag ? active[1][active[0]][0] + flag : raw.length + 1;
    let offset = raw.length - begin;
    expr = expr.concat(raw.slice(begin - 1, end - 1).map((row) => ap(row, active)));
    for (let i = begin - 1; i < end - 1; ++i) {
      let row = raw[i];
      let target_row = expr[i + offset];
      for (let j = 0; j < row[1].length; ++j) {
        if (!row[1][j][1]) continue;
        let seq = seqFrom(raw, i, j);
        let no_move = seq.findIndex((x) => x[0] < active[1][active[0]][0]);
        if (no_move === -1) {
          target_row[1][j][1] = true;
          continue;
        }
        if (seq[no_move][0] < active[1][active[1].length - 1][0]) {
          target_row[1][j][1] = true;
          continue;
        }
        let c = seq[no_move - 1][0] + offset, row_c = expr[c - 1], b = row_c[1][seq[no_move - 1][1]][0];
        if (target_row[1][j + target_row[0] - 1]?.[0] <= active[1][active[1].length - 1][0] && active[1].find((x) => x[0] === b)?.[1])
          target_row[1][j][1] = true;
      }
    }
    return expr;
  }
  function compTo(raw, r2, already) {
    let expr = deepcopy(raw);
    for (let j = raw[r2][1].length - 1; j >= 0; --j) {
      if (!raw[r2][1][j][1]) continue;
      let n = raw[r2][1][j][0];
      let seq = seqFrom(raw, r2, j);
      let t = seq[seq.length - 1][0];
      let T = already[t - 1];
      if (!T) continue;
      let q = T.length;
      let entries = deepcopy(expr[r2][1]).concat(T.map((x) => [x])).concat(
        Array(q).fill(0).map((_, k) => [n + 1 + k, true])
      );
      entries.sort((x, y) => y[0] - x[0]);
      expr[r2] = [expr[r2][0] + q, entries];
    }
    return expr;
  }
  function compFrom(raw, r2, T) {
    let expr = deepcopy(raw.slice(0, r2));
    let q = T.length;
    let lr = raw[r2][1].length < raw[r2][0] * 2 ? raw[r2][0] : raw[r2][0] + 1;
    let cr = raw[r2][1].length < raw[r2][0] * 2 ? raw[r2][1].slice(0, -raw[r2][0]).concat(raw[r2][1].slice(raw[r2][0])) : raw[r2][1];
    for (let l = 0; l < q; ++l) {
      let entries2 = deepcopy(cr).concat(T.slice(0, 1 + l).map((x) => [x])).concat(
        Array(l).fill(0).map((_, k) => [raw[r2][1][0][0] + 1 + k])
      );
      entries2.sort((x, y) => y[0] - x[0]);
      expr[r2 + l] = [lr + l, entries2];
    }
    let entries = deepcopy(raw[r2][1]).concat(T.map((x) => [x])).concat(
      Array(q).fill(0).map((_, k) => [raw[r2][1][0][0] + 1 + k])
    );
    entries.sort((x, y) => y[0] - x[0]);
    expr[r2 + q] = [raw[r2][0] + q, entries];
    for (let l = 1; l <= q; ++l) for (let k = 1; k <= l; ++k) expr[r2 + l][1][k][1] = true;
    let m = (x) => {
      let xx = deepcopy(x);
      xx[0] += xx[0] <= raw[r2][1][0][0] ? 0 : q;
      return xx;
    };
    expr = expr.concat(raw.slice(r2 + 1).map((row) => [row[0], row[1].map(m)]));
    return expr;
  }
  function expand15(raw, index, shorter = true) {
    let active = raw[raw.length - 1];
    if (!active[1][active[0]]?.[0]) return cut(raw);
    let flag = pleasant_until(raw.slice(active[1][active[0]][0] - 1, -1), active);
    let expr = raw;
    if (~flag) {
      expr = copy(expr, flag);
    } else {
      for (let n = 1; n <= index; ++n) expr = copy(expr, flag);
      expr = shorter ? cut(expr) : copy(expr, 1);
    }
    let already = [];
    for (let r2 = raw.length - 1; r2 < expr.length; ++r2) {
      expr = compTo(expr, r2, already);
      if (!(expr[r2][1].length <= expr[r2][0] * 2)) continue;
      let T = [expr[r2][1][expr[r2][0] - 1][0]];
      do {
        T.unshift(expr[T[0] - 1][1][1][0]);
      } while (T[0] > expr[r2][1][expr[r2][0]][0]);
      T = T.slice(1, -1);
      if (T.length < 1) continue;
      expr = compFrom(expr, r2, T);
      already[r2] = T;
      r2 += T.length;
    }
    return expr;
  }
  function Limit_row(n) {
    return [
      2,
      Array(3 + n).fill(0).map((x, nn) => 3 <= nn && nn < 2 + n ? [nn, true] : [nn]).reverse()
    ];
  }
  function infinity_FS25(n) {
    const start = [
      [1, [[1], [0]]],
      [1, [[2], [1], [0]]]
    ];
    return start.concat(
      Array(n).fill(0).map((_, i) => Limit_row(1 + i))
    );
  }
  var draw_diagram_control3 = {
    default_data: { offset: 0 },
    draw_diagram: (expr, data20) => {
      if (is_infinity28(expr) || expr.length === 0) return void 0;
      const A = 16;
      const max_display = 40;
      const total = expr.length;
      const show_all = total <= max_display;
      const start = show_all ? 0 : Math.min(data20.offset, total - max_display);
      const end = Math.min(start + max_display, total);
      const visible = end - start;
      const width = end * A + A;
      const height = visible * A + A / 2;
      const elements = [];
      const lines = [];
      const circles = [];
      const extra_text = [];
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      const red = { r: 255, g: 0, b: 0 };
      for (let vi = 0; vi < visible; vi++) {
        const i = start + vi;
        const entries = expr[i][1];
        const step = expr[i][0];
        const rightmost = entries.length > 0 ? entries[0][0] : 0;
        let prev;
        for (let j = 0; j < entries.length; j++) {
          const pos = entries[j][0];
          const mark4 = entries[j][1];
          if (prev !== void 0) {
            lines.push({
              type: "line",
              x1: prev * A + A / 2,
              y1: vi * A + A / 2,
              x2: pos * A + A / 2,
              y2: vi * A + A / 2,
              stroke: true,
              stroke_color: black,
              width: 1
            });
          }
          circles.push({
            type: "circle",
            x: pos * A + A / 2,
            y: vi * A + A / 2,
            r: A / 4,
            stroke: true,
            stroke_color: j === step ? red : black,
            fill: true,
            fill_color: mark4 ? black : white,
            width: 1
          });
          prev = pos;
        }
        extra_text.push({
          text: "" + step,
          x: rightmost * A + A,
          y: vi * A + A / 2,
          size: 10,
          color: black
        });
      }
      elements.unshift(...circles);
      elements.unshift(...lines);
      return { width, height, elements, extra_text };
    },
    handle_action: (data20, action) => {
      if (action.type === "scroll") {
        if (action.direction === "up") {
          return { offset: Math.max(0, data20.offset - action.step) };
        } else if (action.direction === "down") {
          return { offset: data20.offset + action.step };
        }
      }
      return null;
    }
  };
  var DEN2 = {
    id: "den2",
    name: "DEN2",
    category_id: "category-den",
    display: { plain: display16, from_display: from_display17 },
    is_limit: is_limit19,
    compare: compare23,
    ...sequence_FS_variants(expand15, is_infinity28, infinity_FS25, is_limit19, display16),
    draw_diagram: draw_diagram_control3,
    credit_text_id: "credit.den23",
    init: () => [[Infinity], []]
  };

  // src/notations/DEN/DEN.ts
  function toShort2(expr) {
    return expr.slice(1).map((row) => row.slice(1, -row[0]).concat(row[row.length - 1]));
  }
  function seqseq_compare(m1, m2) {
    if (m1.length === 0) return m2.length === 0 ? 0 : -1;
    if (m2.length === 0) return 1;
    const cmp = lex_compare(m1[0], m2[0], number_compare);
    if (cmp) return cmp;
    return seqseq_compare(m1.slice(1), m2.slice(1));
  }
  function compare24(expr1, expr2) {
    return seqseq_compare(toShort2(expr1), toShort2(expr2));
  }
  function display17(expr) {
    return "" + expr === "Infinity" ? "Limit" : expr.slice(1).map((row) => "(" + row.slice(1).join(",") + ")" + row[0]).join("") + ";" + expr[0].join(",");
  }
  function pleasantUntil(rows, t) {
    const tcheck = t.slice(1 + t[0]), tmax = tcheck[0], tmin = tcheck[tcheck.length - 1];
    for (let n = 0; n < rows.length; n++) {
      const scheck = rows[n].slice(1);
      const i1 = scheck.findIndex((x) => x < tmax);
      const i2 = function(arr, pred) {
        for (let i = arr.length - 1; i >= 0; i--) {
          if (pred(arr[i])) return i;
        }
        return -1;
      }(scheck, (x) => x > tmin);
      if (~i1 && ~i2 && i1 <= i2 && scheck.slice(i1, i2 + 1).some((x) => !tcheck.includes(x))) return n;
    }
    return -1;
  }
  function isLimit(expr) {
    if ("" + expr === "Infinity") return true;
    const active = expr[expr.length - 1];
    if (!active[1 + active[0]]) return false;
    return pleasantUntil(expr.slice(active[1 + active[0]], -1), active) === -1;
  }
  function cut2(expr0) {
    const expr = expr0.slice(0, -1).map((row) => row.slice());
    expr[0].pop();
    return expr;
  }
  function compute_parent_for_mapped_row(r_old, row_idx, start, end, old_height, tmin) {
    let parent8 = 0;
    if (row_idx <= r_old.length && row_idx >= 1) parent8 = r_old[row_idx - 1];
    if (parent8 && start <= parent8 && parent8 <= end) return parent8 - start + old_height;
    let ancestor = parent8;
    while (ancestor) {
      if (ancestor < tmin) return ancestor;
      ancestor = r_old[ancestor - 1];
    }
    return 0;
  }
  function ap2(s, t) {
    return [s[0]].concat(
      s.slice(1).map(
        (x) => x < t[t.length - 1] ? x : x >= t[1 + t[0]] ? x - t[1 + t[0]] + t[1] : t[t.lastIndexOf(x) - t[0]]
      )
    );
  }
  function copy2(raw, flag) {
    const active = raw[raw.length - 1];
    const expr = cut2(raw);
    expr.push(...raw.slice(active[1 + active[0]], active[1 + active[0]] + flag).map((row) => ap2(row, active)));
    for (let row_idx = active[1 + active[0]]; row_idx < active[1 + active[0]] + flag; ++row_idx) {
      expr[0].push(
        compute_parent_for_mapped_row(
          raw[0],
          row_idx,
          active[1 + active[0]],
          active[1 + active[0]] + flag - 1,
          raw.length - 1,
          active[active.length - 1]
        )
      );
    }
    return expr;
  }
  function extend7(raw) {
    const active = raw[raw.length - 1];
    const expr = cut2(raw);
    expr.push(...raw.slice(active[1 + active[0]]).map((row) => ap2(row, active)));
    for (let row_idx = active[1 + active[0]]; row_idx < raw.length; ++row_idx) {
      expr[0].push(
        compute_parent_for_mapped_row(
          raw[0],
          row_idx,
          active[1 + active[0]],
          raw.length - 1,
          raw.length - 1,
          active[active.length - 1]
        )
      );
    }
    return expr;
  }
  function isAncestor(R, i, j) {
    return i === j || i < j && isAncestor(R, i, R[j - 1]);
  }
  function comp(raw, i, T) {
    const expr = raw.slice(0, i).map((row) => row.slice());
    const u = T.length;
    const li = raw[i].length < raw[i][0] * 2 + 1 ? raw[i][0] : raw[i][0] + 1;
    const ci = raw[i].length < raw[i][0] * 2 + 1 ? raw[i].slice(1, -raw[i][0]).concat(raw[i].slice(1 + raw[i][0])) : raw[i].slice(1);
    for (let r2 = 0; r2 < u; ++r2) {
      let values3 = ci.concat(T.slice(0, 1 + r2)).concat(
        Array(r2).fill(0).map((x, rr) => raw[i][1] + 1 + rr)
      );
      values3.sort((x, y) => y - x);
      expr[i + r2] = [li + r2].concat(values3);
    }
    for (let ii = i; ii < raw.length; ++ii) {
      let values3 = raw[ii].slice(1).map((x) => x <= i ? x : x + u);
      const flag = isAncestor(raw[0], i, ii) && values3.findIndex((x) => x <= i) <= raw[ii][0];
      if (flag) {
        values3 = values3.concat(T).concat(
          Array(u).fill(0).map((x, uu) => i + 1 + uu)
        );
        values3.sort((x, y) => y - x);
      }
      expr[ii + u] = [raw[ii][0] + (flag ? u : 0)].concat(values3);
    }
    const m = (x) => x < i ? x : x + u;
    expr[0] = raw[0].slice(0, i);
    for (let r2 = 0; r2 < u; ++r2) expr[0][i + r2] = i + r2;
    for (let ii = i + 1; ii < raw.length; ++ii) expr[0][m(ii) - 1] = m(raw[0][ii - 1]);
    return expr;
  }
  function fullcomp(expr, i) {
    let T = [expr[i][expr[i][0]]];
    do {
      T.unshift(expr[T[0]][2]);
    } while (T[0] > expr[i][expr[i][0] + 1]);
    T = T.slice(1, -1);
    return T.length ? comp(expr, i, T) : expr;
  }
  function expand16(raw, FSterm, longer) {
    const active = raw[raw.length - 1];
    if (!active[1 + active[0]]) return cut2(raw);
    const flag = pleasantUntil(raw.slice(active[1 + active[0]], -1), active);
    let expr = raw;
    if (~flag) {
      expr = copy2(expr, flag);
    } else {
      for (let n = 1; n <= FSterm; ++n) expr = extend7(expr);
      expr = longer ? copy2(expr, 1) : cut2(expr);
    }
    for (let i = raw.length - 1; i < expr.length; ++i) {
      if (expr[i].length <= expr[i][0] * 2 + 1) expr = fullcomp(expr, i);
    }
    return expr;
  }
  function LimitR(n) {
    return n ? [0, 0, 0].concat(
      Array(n - 1).fill(0).map((x, nn) => 3 + nn)
    ) : [0, 0];
  }
  function Limit_row2(n) {
    return Array(3 + n).fill(0).map((x, nn) => nn).concat(2).reverse();
  }
  function Limit2(n) {
    return [LimitR(n), [1, 1, 0], [1, 2, 1, 0]].concat(
      Array(n).fill(0).map((x, nn) => Limit_row2(1 + nn))
    );
  }
  function den1_to_den2(expr) {
    const marks = expr[0];
    return expr.slice(1).map((row, ri) => {
      const step = row[0];
      const mark_val = marks[ri];
      const entries = [];
      if (mark_val === 0) {
        for (let j = 1; j < row.length; j++) {
          entries.push([row[j]]);
        }
      } else {
        for (let j = 1; j < row.length; j++) {
          const val = row[j];
          entries.push(val === mark_val ? [val, true] : [val]);
        }
      }
      return [step, entries];
    });
  }
  var diagram_control = {
    default_data: draw_diagram_control3.default_data,
    draw_diagram: (expr, data20) => draw_diagram_control3.draw_diagram(den1_to_den2(expr), data20),
    handle_action: (data20, action) => draw_diagram_control3.handle_action(data20, action)
  };
  var DEN = {
    id: "den",
    name: "Defective embedding notation",
    simple_name: "DEN",
    category_id: "category-den",
    display: display17,
    is_limit: isLimit,
    compare: compare24,
    draw_diagram: diagram_control,
    FS: (m, FSterm) => {
      if ("" + m === "Infinity") return Limit2(FSterm);
      if (m.length <= 1) return [[]];
      return expand16(m, FSterm, false);
    },
    FS_alter: (m, FSterm) => {
      if ("" + m === "Infinity") return Limit2(FSterm);
      if (m.length <= 1) return [[]];
      return expand16(m, FSterm, true);
    },
    credit_text_id: "credit.den",
    init: () => [[[Infinity]], [[]]]
  };

  // src/notations/DEN/DEN3.ts
  var toShort3 = (expr) => expr.map(
    (row) => row.slice(1, -row[0]).concat([row[row.length - 1]]).map((x) => x[0])
  );
  var seqseq_compare2 = (m1, m2) => {
    if (m1.length === 0) {
      return m2.length === 0 ? 0 : -1;
    }
    if (m2.length === 0) return 1;
    var cmp = lex_compare(m1[0], m2[0], number_compare);
    if (cmp) return cmp;
    return seqseq_compare2(m1.slice(1), m2.slice(1));
  };
  var compare25 = (expr1, expr2) => seqseq_compare2(toShort3(expr1), toShort3(expr2));
  var display18 = (expr) => "" + expr === "Infinity" ? "Limit" : expr.map(
    (row) => "(" + row.slice(1).map((x) => (x[1] ? "*" : "") + x[0]).join(",") + ")" + row[0]
  ).join("");
  var values2 = (row) => [row[0]].concat(row.slice(1).map((x) => x[0]));
  var pleasantUntil2 = (rows, t) => {
    var tcheck = values2(t).slice(1 + t[0]), tmax = tcheck[0], tmin = tcheck[tcheck.length - 1], scheck, i1, i2;
    for (var n = 0; n < rows.length; n++) {
      scheck = values2(rows[n]).slice(1);
      i1 = scheck.findIndex((x) => x < tmax);
      i2 = function(arr, pred) {
        for (var i = arr.length - 1; i >= 0; i--) {
          if (pred(arr[i])) return i;
        }
        return -1;
      }(scheck, (x) => x > tmin);
      if (~i1 && ~i2 && i1 <= i2 && scheck.slice(i1, i2 + 1).some((x) => !tcheck.includes(x))) return n;
    }
    return -1;
  };
  var isLimit2 = (expr) => {
    if ("" + expr === "Infinity") return true;
    if (expr.length === 0) return false;
    var active = expr[expr.length - 1];
    if (!active[1 + active[0]]?.[0]) return false;
    return pleasantUntil2(expr.slice(active[1 + active[0]][0] - 1, -1), active) === -1;
  };
  var cut3 = (expr) => expr.slice(0, -1).map((row) => [row[0]].concat(row.slice(1).map((x) => x.slice())));
  var seqFrom2 = (expr, i, j) => {
    var row = expr[i], val = row[j][0], threshold2 = row[j + row[0]]?.[0] ?? 0, idx, record = [[i + 1, j], [val]];
    if (!threshold2) return;
    while (val > threshold2) {
      row = expr[val - 1];
      idx = 1 + row[0];
      record[record.length - 1][1] = idx;
      val = row[idx]?.[0];
      record.push([val]);
    }
    if (val !== threshold2) return;
    return record.slice(1, -1);
  };
  var apv2 = (s, t) => s.map(
    (x) => x < t[t.length - 1] ? x : x >= t[1 + t[0]] ? x - t[1 + t[0]] + t[1] : t[t.lastIndexOf(x) - t[0]]
  );
  var ap3 = (s, t) => [s[0]].concat(apv2(values2(s).slice(1), values2(t)).map((x) => [x]));
  var copy3 = (raw, flag) => {
    var active = raw[raw.length - 1], expr = cut3(raw);
    var begin = active[1 + active[0]][0];
    var a1 = active[active.length - 1][0];
    var end = ~flag ? active[1 + active[0]][0] + flag : raw.length + 1;
    var offset = raw.length - begin;
    expr = expr.concat(raw.slice(begin - 1, end - 1).map((row2) => ap3(row2, active)));
    var row, targetrow, i, j, seq;
    for (i = begin - 1; i < end - 1; ++i) {
      row = raw[i];
      targetrow = expr[i + offset];
      for (j = 1; j < row.length; ++j) {
        if (!row[j][1]) continue;
        seq = seqFrom2(expr, i + offset, j);
        if (!seq) continue;
        var nomove = seq.findIndex((x) => x[0] < begin);
        if (nomove === -1) {
          targetrow[j][1] = true;
          continue;
        }
        var y0 = seq[nomove][0];
        if (y0 < a1) {
          targetrow[j][1] = true;
          continue;
        }
        var k = 1 + active.slice(1).findIndex((x) => x[0] === y0);
        if (active[k - active[0]]?.[1] && !(targetrow[j + targetrow[0] - 1]?.[0] > a1)) targetrow[j][1] = true;
      }
    }
    return expr;
  };
  var compTo2 = (raw, r2, Rec) => {
    var expr = raw.map((row) => [row[0]].concat(row.slice(1).map((x) => x.slice())));
    for (var i = raw[r2].length - 1; i > 0; --i) {
      if (!raw[r2][i][1]) continue;
      var bi = raw[r2][i][0];
      var seq = seqFrom2(expr, r2, i);
      if (!seq) continue;
      var t = seq[seq.length - 1][0];
      var T = Rec[t - 1];
      if (!T) continue;
      for (var j = 0; j + 1 < seq.length; ++j)
        if (!expr[seq[j + 1][0] - 1].some((x) => x[0] === seq[j][0] + 1)) continue;
      var q = T.length;
      var entries = expr[r2].slice(1).map((x) => x.slice()).concat(T.map((x) => [x])).concat(
        Array(q).fill(0).map((x, uu) => [bi + 1 + uu, true])
      );
      entries.sort((x, y) => y[0] - x[0]);
      expr[r2] = [expr[r2][0] + q].concat(entries);
    }
    return expr;
  };
  var compFrom2 = (raw, r2, T) => {
    var expr = raw.slice(0, r2).map((row) => [row[0]].concat(row.slice(1).map((x) => x.slice())));
    var q = T.length;
    var lr = raw[r2].length < raw[r2][0] * 2 + 1 ? raw[r2][0] : raw[r2][0] + 1;
    var cr = raw[r2].length < raw[r2][0] * 2 + 1 ? raw[r2].slice(1, -raw[r2][0]).concat(raw[r2].slice(1 + raw[r2][0])) : raw[r2].slice(1);
    for (var qq = 0; qq < q; ++qq) {
      var entries = cr.map((x) => x.slice()).concat(T.slice(0, 1 + qq).map((x) => [x])).concat(
        Array(qq).fill(0).map((x, uu2) => [raw[r2][1][0] + 1 + uu2])
      );
      entries.sort((x, y) => y[0] - x[0]);
      expr[r2 + qq] = [lr + qq].concat(entries);
    }
    entries = raw[r2].slice(1).map((x) => x.slice()).concat(T.map((x) => [x])).concat(
      Array(q).fill(0).map((x, uu2) => [raw[r2][1][0] + 1 + uu2])
    );
    entries.sort((x, y) => y[0] - x[0]);
    expr[r2 + q] = [raw[r2][0] + q].concat(entries);
    for (qq = 1; qq <= q; ++qq) for (var uu = 2; uu <= 1 + qq; ++uu) expr[r2 + qq][uu][1] = true;
    var m = (x, idx) => {
      if (!idx) return x;
      var xx = x.slice();
      xx[0] += xx[0] <= raw[r2][1][0] ? 0 : q;
      return xx;
    };
    expr = expr.concat(raw.slice(r2 + 1).map((row) => row.map(m)));
    return expr;
  };
  var expand17 = (raw, FSterm, longer) => {
    var active = raw[raw.length - 1];
    if (!active[1 + active[0]]?.[0]) return cut3(raw);
    var flag = pleasantUntil2(raw.slice(active[1 + active[0]][0] - 1, -1), active);
    var expr = raw;
    if (~flag) {
      expr = copy3(expr, flag);
    } else {
      for (var n = 1; n <= FSterm; ++n) expr = copy3(expr, flag);
      if (longer) {
        var len0 = expr.length;
        expr = copy3(expr, 1);
      } else {
        expr = cut3(expr);
      }
    }
    var Rec = [];
    for (var r2 = raw.length - 1; r2 < expr.length; ++r2) {
      expr = compTo2(expr, r2, Rec);
      if (!(expr[r2].length <= expr[r2][0] * 2 + 1)) continue;
      var row = expr[r2], pr = row[1 + row[0]][0];
      var T = [row[row[0]][0]];
      do {
        T.unshift(expr[T[0] - 1][2][0]);
      } while (T[0] > pr);
      T = T.slice(1, -1);
      if (T.length < 1) continue;
      Rec[r2] = T;
      expr = compFrom2(expr, r2, T);
      r2 += T.length;
    }
    if (longer) while (expr.length > len0) expr = cut3(expr);
    return expr;
  };
  var Limit_row3 = (n) => Array(3 + n).fill(0).map((x, nn) => 3 <= nn && nn < 2 + n ? [nn, true] : [nn]).concat([2]).reverse();
  var Limit3 = (n) => [
    [1, [1], [0]],
    [1, [2], [1], [0]]
  ].concat(
    Array(n).fill(0).map((x, nn) => Limit_row3(1 + nn))
  );
  function den3_to_den2(expr) {
    return expr.map((row) => [row[0], row.slice(1)]);
  }
  var diagram_control2 = {
    default_data: draw_diagram_control3.default_data,
    draw_diagram: (expr, data20) => draw_diagram_control3.draw_diagram(den3_to_den2(expr), data20),
    handle_action: (data20, action) => draw_diagram_control3.handle_action(data20, action)
  };
  var DEN3 = {
    id: "den3",
    name: "DEN3",
    category_id: "category-den",
    display: display18,
    is_limit: isLimit2,
    compare: compare25,
    draw_diagram: diagram_control2,
    FS: (m, FSterm) => {
      if ("" + m === "Infinity") return Limit3(FSterm);
      if (!m.length) return [];
      return expand17(m, FSterm, false);
    },
    FS_alter: (m, FSterm) => {
      if ("" + m === "Infinity") return Limit3(FSterm);
      if (!m.length) return [];
      return expand17(m, FSterm, true);
    },
    credit_text_id: "credit.den23",
    init: () => [[Infinity], []]
  };

  // src/notations/OCN/LMN.ts
  function is_infinity29(m) {
    return "" + m === "true,Infinity";
  }
  function LMN_display(x, style) {
    if (is_infinity29(x)) return "Limit";
    if (x === 0) return style === "html-psi" ? "0" : "";
    if (x[0]) {
      if (style === "html-psi") {
        return "\u03C8<sub>" + x[1] + "</sub>(" + LMN_display(x[2], style) + ")";
      } else {
        if (x[2] === 0) return "" + x[1];
        let x2_display = LMN_display(x[2], style);
        return style === "plain" ? x[1] + "(" + x2_display + ")" : x[1] + "<sup>" + x2_display + "</sup>";
      }
    } else {
      return LMN_display(x[1], style) + "+" + LMN_display(x[2], style);
    }
  }
  function from_display18(str) {
    str = str.trim();
    const len = str.length;
    function parse(start) {
      if (start >= len || str[start] === ")") return [0, start];
      const [first, pos1] = parseTerm(start);
      const terms = [first];
      let pos = pos1;
      while (pos < len && str[pos] === "+") {
        pos++;
        const [next, nextPos] = parseTerm(pos);
        terms.push(next);
        pos = nextPos;
      }
      let result = terms[0];
      for (let i = 1; i < terms.length; i++) result = [false, result, terms[i]];
      return [result, pos];
    }
    function parseTerm(start) {
      if (start >= len || !/\d/.test(str[start])) throw new Error("illegal input string: " + str);
      let end = start;
      while (end < len && /\d/.test(str[end])) end++;
      const num = parseInt(str.slice(start, end), 10);
      if (end < len && str[end] === "(") {
        const [innerExpr, afterInner] = parse(end + 1);
        if (afterInner >= len || str[afterInner] !== ")") throw new Error("illegal input string: " + str);
        return [[true, num, innerExpr], afterInner + 1];
      }
      return [[true, num, 0], end];
    }
    const [expr, endPos] = parse(0);
    if (endPos !== len) throw new Error("illegal input string: " + str);
    return expr;
  }
  var LMN_compare = (x, y) => {
    if (x === 0) {
      return y === 0 ? 0 : -1;
    }
    if (y === 0) return 1;
    if (x[0]) {
      if (y[0]) {
        if (x[1] < y[1]) return -1;
        if (x[1] > y[1]) return 1;
        return LMN_compare(x[2], y[2]);
      } else {
        return LMN_compare(x, y[1]) <= 0 ? -1 : 1;
      }
    } else {
      if (y[0]) {
        return LMN_compare(x[1], y) < 0 ? -1 : 1;
      } else {
        let cmp = LMN_compare(x[1], y[1]);
        if (cmp) return cmp;
        return LMN_compare(x[2], y[2]);
      }
    }
  };
  function LMN_is_limit(x) {
    if (is_infinity29(x)) return true;
    if (x === 0) return false;
    if (x[0]) return x[1] !== 0 || x[2] !== 0;
    return LMN_is_limit(x[2]);
  }
  var data5 = {};
  function max_summand(x) {
    if (x === 0 || x[0]) return x;
    let x1 = max_summand(x[1]), x2 = max_summand(x[2]);
    if (LMN_compare(x1, x2) < 0) return x2;
    else return x1;
  }
  function cut0(x) {
    if (x === 0) {
      return 0;
    } else if (x[0]) {
      return [true, x[1], cut0(x[2])];
    } else {
      return x[2] ? LMN_compare(x[1], max_summand(x[2])) < 0 ? cut0(x[2]) : [false, cut0(x[1]), cut0(x[2])] : cut0(x[1]);
    }
  }
  function L(x0) {
    let x = x0, lx = [];
    while (x) {
      if (x[0]) {
        lx.push(x);
        if ((x = x[2]) === 0) break;
      } else {
        x = x[2];
      }
    }
    return lx;
  }
  function change(x, y) {
    let x1 = deepcopy(x), lx = L(x1), n = lx.length - 1;
    if (lx[n] === x1) return y;
    let prev = n ? lx[n - 1] : x1;
    while (prev[2] !== lx[n]) prev = prev[2];
    prev[2] = y;
    return x1;
  }
  function it(x, n) {
    return n ? change(x, it(x, n - 1)) : 0;
  }
  function term_tier(x) {
    let n = 0;
    while (LMN_compare(x, [true, n + 1, 0]) >= 0) ++n;
    return n;
  }
  function inner(x) {
    let n = term_tier(x), Lx = L(x);
    let m = Lx.slice(1).findIndex((xj) => term_tier(xj) === n);
    if (m === -1) return 0;
    let A = Lx[m][2];
    while (!A[0]) {
      if (term_tier(A) === n) return A;
      A = A[2];
    }
    return A[1] === n ? A : 0;
  }
  function is_critical(x) {
    let n = term_tier(x), lx = L(x);
    return lx.findIndex(
      (xi, i) => LMN_compare(x, xi) < 0 && term_tier(xi) === n && lx.slice(i + 1).every((xj) => LMN_compare(xj, [true, n + 1, 0]) >= 0) && lx.slice(0, i).every((xj) => LMN_compare(xj, [true, n, 0]) >= 0)
    ) >= 0;
  }
  function subtract(c, b) {
    if (b === 0) return c;
    if (c === 0) return 0;
    let b1 = b[0] ? b : b[1], c1 = c[0] ? c : c[1], cmp = LMN_compare(b1, c1);
    if (cmp < 0) return c;
    if (cmp > 0) return 0;
    return subtract(c[0] ? 0 : c[2], b[0] ? 0 : b[2]);
  }
  function lift(x, a, s) {
    if (x === 0 || x[0] && LMN_compare(x, a) < 0) return x;
    if (!x[0]) return [false, lift(x[1], a, s), lift(x[2], a, s)];
    if (a[1] < x[1]) return [true, x[1] - a[1] + s[1], lift(x[2], a, s)];
    return [true, s[1], cut0([false, s[2], lift(subtract(x[2], a[2]), a, s)])];
  }
  function is_one5(x) {
    return "" + x === "true,0,0";
  }
  function LMN_FS(x, index) {
    if ("" + x === "true,Infinity") {
      let res = 0;
      for (let i = index; i >= 0; --i) res = [true, i, res];
      return [true, 0, res];
    }
    if (x === 0) return 0;
    if (!x[0]) {
      let x2 = x[2];
      if (is_one5(x2)) return x[1];
      return cut0([x[0], x[1], LMN_FS(x2, index)]);
    }
    let x1 = deepcopy(x);
    let lx = L(x1), xn = lx[lx.length - 1];
    if (is_one5(xn)) {
      let xn1 = lx[lx.length - 2];
      if (xn1[2] === xn) xn1[2] = 0;
      else {
        let prev = xn1;
        while (prev[2][2] !== xn) prev = prev[2];
        prev[2] = prev[2][1];
      }
      if (x1 === xn1) {
        let res = 0;
        for (let i = index; i--; ) res = [false, deepcopy(xn1), res];
        return cut0(res);
      } else {
        let prev = lx.length === 2 ? x1 : lx[lx.length - 3];
        while (prev[2] !== xn1) prev = prev[2];
        prev[2] = 0;
        for (let i = index; i--; ) prev[2] = [false, deepcopy(xn1), prev[2]];
        return cut0(x1);
      }
    }
    let j = xn[1];
    let lxr = lx.slice();
    let xk = lxr.reverse().find((xz) => term_tier(xz) === j - 1);
    let xi = lxr.find(is_critical);
    let s = term_tier(xi);
    if (s === j - 1) {
      if (LMN_compare(xi, change(xk, xk)) >= 0) {
        let prev = x1;
        while (prev[2] !== xk) prev = prev[2];
        prev[2] = [true, 0, 0];
        if (x1 === xi) return cut0(it(xi, index));
        prev = x1;
        while (prev[2] !== xi) prev = prev[2];
        prev[2] = it(xi, index);
        return cut0(x1);
      }
      return cut0(change(x1, it(inner(xi), index)));
    }
    let xj = lxr.find((xz) => term_tier(xz) === s);
    return LMN_FS(cut0(change(x1, lift(inner(xi), xj, xk))), index);
  }
  var LMN = {
    id: "lmn",
    name: "lifting M-notation",
    simple_name: "LMN",
    category_id: "category-ocn",
    display: {
      plain: (e) => LMN_display(e, "plain"),
      html: (e) => LMN_display(e, "html-psi"),
      from_display: from_display18
    },
    display_equiv: {
      plain: {
        plain: (e) => LMN_display(e, "plain"),
        name_id: "display.simple"
      },
      sup: {
        plain: (e) => LMN_display(e, "plain"),
        html: (e) => LMN_display(e, "html-plain"),
        name_id: "display.pocn-sup"
      }
    },
    is_limit: LMN_is_limit,
    compare: LMN_compare,
    FS: (x, index) => {
      const key = "" + x;
      if (!data5[key]) data5[key] = [];
      else if (data5[key][index] !== void 0) return data5[key][index];
      return data5[key][index] = LMN_FS(x, index);
    },
    credit_text_id: "credit.test-alpha0",
    init: () => [[true, Infinity], [true, 0, 0], 0]
  };

  // src/notations/OCN/LON.ts
  var data6 = {};
  var Copy = (x) => typeof x === "number" ? x : [x[0]].concat(x.slice(1).map(Copy));
  var maxsummand = (x) => {
    if (!x || x[0]) return x;
    var x1 = maxsummand(x[1]), x2 = maxsummand(x[2]);
    if (LMN_compare(x1, x2) < 0) return x2;
    else return x1;
  };
  var cut02 = (x) => x ? x[0] ? [true, x[1], cut02(x[2])] : x[2] ? LMN_compare(x[1], maxsummand(x[2])) < 0 ? cut02(x[2]) : [false, cut02(x[1]), cut02(x[2])] : cut02(x[1]) : 0;
  var L2 = (x0) => {
    var x = x0, lx = [];
    while (x) {
      if (x[0]) {
        lx.push(x);
        if ((x = x[2]) === 0) break;
      } else {
        x = x[2];
      }
    }
    return lx;
  };
  var change2 = (x, y) => {
    var x1 = Copy(x), lx = L2(x1), n = lx.length - 1;
    if (lx[n] === x1) return y;
    var prev = n ? lx[n - 1] : x1;
    while (prev[2] !== lx[n]) prev = prev[2];
    prev[2] = y;
    return x1;
  };
  var it2 = (x, n) => n ? change2(x, it2(x, n - 1)) : 0;
  var termtier = (x) => {
    for (var n = 0; LMN_compare(x, [true, n + 1, 0]) >= 0; ++n) ;
    return n;
  };
  var inner2 = (x) => {
    var n = termtier(x), Lx = L2(x), m = Lx.slice(1).findIndex((xj) => termtier(xj) === n);
    if (m === -1) return 0;
    var A = Lx[m][2];
    while (!A[0]) {
      if (termtier(A) === n) return A;
      A = A[2];
    }
    return A[1] === n ? A : 0;
  };
  var iscritical = (x) => {
    var n = termtier(x), lx = L2(x);
    return lx.findIndex(
      (xi, i) => LMN_compare(x, xi) < 0 && termtier(xi) === n && lx.slice(i + 1).every((xj) => LMN_compare(xj, [true, n + 1, 0]) >= 0) && lx.slice(0, i).every((xj) => LMN_compare(xj, [true, n, 0]) >= 0)
    ) >= 0;
  };
  var subtract2 = (c, b) => {
    if (b === 0) return c;
    if (c === 0) return 0;
    var b1 = b[0] ? b : b[1], c1 = c[0] ? c : c[1], cmp = LMN_compare(b1, c1);
    if (cmp < 0) return c;
    if (cmp > 0) return 0;
    return subtract2(c[0] ? 0 : c[2], b[0] ? 0 : b[2]);
  };
  var lift2 = (x, a, s) => {
    if (x === 0 || x[0] && LMN_compare(x, a) < 0) return x;
    if (!x[0]) return [false].concat(x.slice(1).map((xi) => lift2(xi, a, s)));
    if (a[1] < x[1]) return [true, x[1] - a[1] + s[1], lift2(x[2], a, s)];
    return [true, s[1], cut02([false, s[2], lift2(subtract2(x[2], a[2]), a, s)])];
  };
  var isone = (x) => "" + x === "true,0,0";
  var LON_FS = (x, FSterm) => {
    var i, res, x2, xn1, prev;
    if ("" + x === "true,Infinity") {
      res = 0;
      for (i = FSterm; i >= 0; --i) res = [true, i, res];
      return [true, 0, res];
    }
    if (x === 0) return 0;
    if (!x[0]) {
      x2 = x[2];
      if (isone(x2)) return x[1];
      return cut02(x.slice(0, 2).concat([LON_FS(x2, FSterm)]));
    }
    x2 = Copy(x);
    var lx = L2(x2), xn = lx[lx.length - 1];
    if (isone(xn)) {
      xn1 = lx[lx.length - 2];
      if (xn1[2] === xn) xn1[2] = 0;
      else {
        prev = xn1;
        while (prev[2][2] !== xn) prev = prev[2];
        prev[2] = prev[2][1];
      }
      if (x2 === xn1) {
        res = 0;
        for (i = FSterm; i--; ) res = [false, Copy(xn1), res];
        return cut02(res);
      } else {
        prev = lx.length === 2 ? x2 : lx[lx.length - 3];
        while (prev[2] !== xn1) prev = prev[2];
        prev[2] = 0;
        for (i = FSterm; i--; ) prev[2] = [false, Copy(xn1), prev[2]];
        return cut02(x2);
      }
    }
    var j = xn[1], lxr = lx.slice(), xk = lxr.reverse().find((xz) => termtier(xz) === j - 1);
    if (xk && LMN_compare(xk, [true, j - 1, [true, j, 0]]) > 0) {
      return cut02(change2(x2, it2(xk, FSterm)));
    }
    var xi = lxr.find(iscritical), s = termtier(xi);
    if (s === j - 1) {
      return cut02(change2(x2, it2(inner2(xi), FSterm)));
    }
    var xj = lxr.find((xz) => termtier(xz) === s);
    return LON_FS(cut02(change2(x2, lift2(inner2(xi), xj, xk))), FSterm);
  };
  var LON = {
    id: "lon",
    name: "lifting Omega notation",
    simple_name: "LON",
    category_id: "category-ocn",
    display: {
      plain: (e) => LMN_display(e, "plain"),
      html: (e) => LMN_display(e, "html-psi"),
      from_display: from_display18
    },
    display_equiv: {
      plain: {
        plain: (e) => LMN_display(e, "plain"),
        name_id: "display.simple"
      },
      sup: {
        plain: (e) => LMN_display(e, "plain"),
        html: (e) => LMN_display(e, "html-plain"),
        name_id: "display.pocn-sup"
      }
    },
    is_limit: LMN_is_limit,
    compare: LMN_compare,
    FS: (x, index) => {
      const key = "" + x;
      if (!data6[key]) data6[key] = [];
      else if (data6[key][index] !== void 0) return data6[key][index];
      return data6[key][index] = LON_FS(x, index);
    },
    credit_text_id: "credit.test-alpha0",
    init: () => [[true, Infinity], [true, 0, 0], 0]
  };

  // src/notations/OCN/UPS1_1r5.ts
  var INFINITY24 = Symbol("infinity");
  function is_infinity30(e) {
    return e === INFINITY24;
  }
  function infinity_FS26(index) {
    return Array.from({ length: index }, (_, i) => ({ value: i, starred: i >= 2 }));
  }
  function parseSequence(str) {
    if (!str.trim()) return [];
    const parts = str.split(",").map((s) => s.trim());
    return parts.map((part) => {
      let starred = false;
      if (part.endsWith("*")) {
        starred = true;
        part = part.slice(0, -1);
      }
      const value = parseInt(part, 10);
      if (isNaN(value)) throw new Error(`\u65E0\u6548\u6570\u5B57: ${part}`);
      return { value, starred };
    });
  }
  function formatSequence(seq) {
    if (is_infinity30(seq)) return "Limit";
    return seq.map((item) => item.starred ? item.value + "*" : "" + item.value).join(", ");
  }
  function extractValues(seq) {
    return seq.map((item) => item.value);
  }
  function computeLeftLess(values3) {
    const n = values3.length;
    const leftLess = new Array(n).fill(-1);
    const stack = [];
    for (let i = 0; i < n; i++) {
      while (stack.length && values3[stack[stack.length - 1]] >= values3[i]) stack.pop();
      leftLess[i] = stack.length ? stack[stack.length - 1] : -1;
      stack.push(i);
    }
    return leftLess;
  }
  function getAncestorChain(seq, leftLess) {
    const chain = [];
    let idx = seq.length - 1;
    while (idx !== -1) {
      chain.push(idx);
      if (idx === 0) break;
      idx = leftLess[idx];
    }
    chain.reverse();
    return chain;
  }
  function getDirectItemSet(seq, leftLess, startIdx) {
    const n = seq.length;
    const directSet = /* @__PURE__ */ new Set();
    directSet.add(startIdx);
    for (let j = startIdx + 1; j < n; j++) {
      const parent8 = leftLess[j];
      if (parent8 === -1) continue;
      if (seq[j].starred && directSet.has(parent8)) {
        directSet.add(j);
      }
    }
    return directSet;
  }
  function getDirectSegmentIndices(seq, leftLess, startIdx) {
    const directSet = getDirectItemSet(seq, leftLess, startIdx);
    if (directSet.size === 0) return [startIdx];
    const maxDirectIdx = Math.max(...directSet);
    let candidateIdx = -1;
    let candidateValue = Infinity;
    for (let i = maxDirectIdx + 1; i < seq.length; i++) {
      if (!directSet.has(i)) {
        const parent8 = leftLess[i];
        if (parent8 !== -1 && directSet.has(parent8)) {
          const val = seq[i].value;
          if (val < candidateValue) {
            candidateValue = val;
            candidateIdx = i;
          }
        }
      }
    }
    if (candidateIdx !== -1) {
      const stopIdx = candidateIdx > maxDirectIdx ? candidateIdx : maxDirectIdx;
      const segment = [];
      for (let i = startIdx; i <= stopIdx; i++) segment.push(i);
      return segment;
    } else {
      const segment = [];
      for (let i = startIdx; i <= maxDirectIdx; i++) segment.push(i);
      return segment;
    }
  }
  function getDirectSegmentAsSeq(seq, leftLess, startIdx) {
    return getDirectSegmentIndices(seq, leftLess, startIdx).map((i) => deepcopy(seq[i]));
  }
  function getDirectSegmentRange(seq, leftLess, startIdx) {
    const indices = getDirectSegmentIndices(seq, leftLess, startIdx);
    if (indices.length === 0) return { start: startIdx, end: startIdx };
    return { start: indices[0], end: indices[indices.length - 1] };
  }
  function ensureLastStarred(seq) {
    const newSeq = deepcopy(seq);
    if (newSeq.length && !newSeq[newSeq.length - 1].starred) newSeq[newSeq.length - 1].starred = true;
    return newSeq;
  }
  function sequenceOffset(seq, offset) {
    return seq.map((item) => ({ value: item.value + offset, starred: item.starred }));
  }
  function normalize3(seq) {
    if (!seq.length) return [];
    const base = seq[0].value;
    return sequenceOffset(seq, -base);
  }
  function getSubsequence(seq, chain, k) {
    const start = chain[k];
    const sub = deepcopy(seq.slice(start));
    if (sub.length) sub[0].starred = false;
    return sub;
  }
  function compareProjectionRaw(a, b) {
    const a2 = ensureLastStarred(a), b2 = ensureLastStarred(b);
    const vA = extractValues(a2), vB = extractValues(b2);
    const llA = computeLeftLess(vA), llB = computeLeftLess(vB);
    const chainA = getAncestorChain(a2, llA), chainB = getAncestorChain(b2, llB);
    const sA = chainA.length - 1, sB = chainB.length - 1;
    if (sA !== sB) return sA - sB;
    if (sA === 0) return 0;
    const subA = getSubsequence(a2, chainA, sA - 1), subB = getSubsequence(b2, chainB, sB - 1);
    const normA = normalize3(subA), normB = normalize3(subB);
    return compare26(normA, normB);
  }
  function isDirectSegmentLess(a, b) {
    const a2 = normalize3(ensureLastStarred(a));
    const b2 = normalize3(ensureLastStarred(b));
    return compare26(a2, b2) < 0;
  }
  function buildParentSegmentMap(seq, leftLess) {
    const n = seq.length;
    const parentSegment = /* @__PURE__ */ new Map();
    for (let i = 0; i < n; i++) {
      if (seq[i].starred) continue;
      let p = leftLess[i];
      while (p !== -1 && seq[p].starred) {
        p = leftLess[p];
      }
      if (p !== -1) {
        parentSegment.set(i, p);
      } else {
        parentSegment.set(i, -1);
      }
    }
    return parentSegment;
  }
  function getDroppingAncestor(startIdx, seq, leftLess, parentSegmentMap) {
    const directSeg = getDirectSegmentAsSeq(seq, leftLess, startIdx);
    if (directSeg.length === 1) {
      return startIdx;
    }
    let current = startIdx;
    let best = current;
    let refIdx = current;
    while (true) {
      const parent8 = parentSegmentMap.get(current);
      if (parent8 === -1 || parent8 === void 0) break;
      const parentSeg = getDirectSegmentAsSeq(seq, leftLess, parent8);
      const refSeg = getDirectSegmentAsSeq(seq, leftLess, refIdx);
      if (isDirectSegmentLess(refSeg, parentSeg)) {
        current = parent8;
        continue;
      }
      const cmp = compareProjectionRaw(parentSeg, refSeg);
      if (cmp > 0) {
        best = parent8;
        refIdx = parent8;
        current = parent8;
      } else {
        break;
      }
    }
    return best;
  }
  function getRealBadRoot(seq, leftLess, candidateIdx) {
    const seg = getDirectSegmentIndices(seq, leftLess, candidateIdx);
    return seg.length ? seg[seg.length - 1] : candidateIdx;
  }
  function findBadRoot(seq, leftLess) {
    const chain = getAncestorChain(seq, leftLess);
    const directAncestors = chain.filter((idx) => !seq[idx].starred);
    if (directAncestors.length === 0) return 0;
    const directParent = directAncestors[directAncestors.length - 1];
    const lastSegmentSeq = getDirectSegmentAsSeq(seq, leftLess, directParent);
    const parentSegmentMap = buildParentSegmentMap(seq, leftLess);
    const dropOfLast = getDroppingAncestor(directParent, seq, leftLess, parentSegmentMap);
    const dropRangeLast = getDirectSegmentRange(seq, leftLess, dropOfLast);
    const subSeqLast = deepcopy(seq.slice(dropRangeLast.start, seq.length));
    const skipped = /* @__PURE__ */ new Set();
    let mark4 = directParent;
    while (true) {
      skipped.add(mark4);
      if (mark4 === dropOfLast) break;
      const p = parentSegmentMap.get(mark4);
      if (p === -1 || p === void 0) break;
      mark4 = p;
    }
    for (let i = directAncestors.length - 2; i >= 0; i--) {
      const currIdx = directAncestors[i];
      if (skipped.has(currIdx)) continue;
      const dropIdx = getDroppingAncestor(currIdx, seq, leftLess, parentSegmentMap);
      const dropRange = getDirectSegmentRange(seq, leftLess, dropIdx);
      const currRange = getDirectSegmentRange(seq, leftLess, currIdx);
      const subSeq = deepcopy(seq.slice(dropRange.start, currRange.end + 1));
      const isSubLessOrEqual = !isDirectSegmentLess(subSeqLast, subSeq);
      let mark22 = currIdx;
      while (true) {
        skipped.add(mark22);
        if (mark22 === dropIdx) break;
        const p = parentSegmentMap.get(mark22);
        if (p === -1 || p === void 0) break;
        mark22 = p;
      }
      if (isSubLessOrEqual) {
        const chainIndices = [];
        let cur = currIdx;
        while (true) {
          chainIndices.unshift(cur);
          if (cur === dropIdx) break;
          const p = parentSegmentMap.get(cur);
          if (p === -1 || p === void 0) break;
          cur = p;
        }
        let selectedSegStart = null;
        for (let k = chainIndices.length - 1; k >= 0; k--) {
          const startIdx = chainIndices[k];
          const seg = getDirectSegmentAsSeq(seq, leftLess, startIdx);
          const isLE = !isDirectSegmentLess(lastSegmentSeq, seg);
          if (isLE) {
            selectedSegStart = startIdx;
            break;
          }
        }
        if (selectedSegStart === null) {
          selectedSegStart = chainIndices[chainIndices.length - 1];
        }
        const selectedRange = getDirectSegmentRange(seq, leftLess, selectedSegStart);
        return selectedRange.end;
      }
    }
    const fallback = directAncestors[0];
    return getRealBadRoot(seq, leftLess, fallback);
  }
  function expandOnOriginal(seq, m) {
    if (seq.length === 0) return { expanded: [], applied: false, reason: "\u7A7A\u5E8F\u5217" };
    const last = seq[seq.length - 1];
    if (last.value === 0) {
      const newSeq2 = seq.slice(0, -1);
      return { expanded: newSeq2, applied: true, reason: "\u672B\u9879\u4E3A0\uFF0C\u76F4\u63A5\u5220\u9664\u672B\u9879" };
    }
    if (!last.starred) {
      const values4 = extractValues(seq);
      const leftLess2 = computeLeftLess(values4);
      const L3 = seq.length, p = leftLess2[L3 - 1];
      const blockStart = p === -1 ? 0 : p;
      if (blockStart > L3 - 2)
        return { expanded: seq.slice(0, L3 - 1), applied: true, reason: "\u672B\u9879\u65E0\u661F\u975E0\uFF0C\u65E0\u590D\u5236\u5757" };
      const block2 = seq.slice(blockStart, L3 - 1);
      const newSeq2 = seq.slice(0, L3 - 1);
      for (let i = 0; i < m; i++) newSeq2.push(...deepcopy(block2));
      return { expanded: newSeq2, applied: true, reason: "\u672B\u9879\u65E0\u661F\u975E0\uFF0C\u590D\u5236\u7236\u5757" };
    }
    const values3 = extractValues(seq);
    const leftLess = computeLeftLess(values3);
    const realBadRoot = findBadRoot(seq, leftLess);
    const lastValue = last.value;
    const d = lastValue - seq[realBadRoot].value;
    let newSeq = seq.slice(0, -1);
    const block = seq.slice(realBadRoot, seq.length - 1);
    for (let i = 0; i < m; i++) {
      const offset = d * (i + 1);
      newSeq.push(...sequenceOffset(block, offset));
    }
    return { expanded: newSeq, applied: true, reason: `\u672B\u9879\u6709\u661F\uFF0C\u574F\u6839=${realBadRoot}` };
  }
  var depthColors = [
    "",
    // depth 0 无色
    "#80d0ff",
    // 亮蓝
    "#80ff80",
    // 亮绿
    "#ff80c0",
    // 亮粉
    "#ffe066",
    // 亮黄
    "#c080ff",
    // 亮紫
    "#80ffff",
    // 亮青
    "#ff8080"
    // 亮红
  ];
  function getCompleteSeq(node, seq, completeMap) {
    const comp2 = completeMap.get(node);
    const compSeq = seq.slice(comp2.start, comp2.end + 1);
    return normalize3(compSeq);
  }
  function matchP(seq) {
    if (seq.length === 1 && seq[0].value === 0 && !seq[0].starred) {
      return -1;
    }
    if (seq.length < 2) return null;
    if (seq[0].value !== 0 || seq[0].starred) return null;
    for (let i = 1; i < seq.length; i++) {
      if (!(seq[i].value === i && seq[i].starred)) return null;
    }
    return seq.length - 2;
  }
  function ordinal(m) {
    if (m === 1) return "";
    if (m % 10 === 1 && m % 100 !== 11) return m + "\\mathrm{st}";
    if (m % 10 === 2 && m % 100 !== 12) return m + "\\mathrm{nd}";
    if (m % 10 === 3 && m % 100 !== 13) return m + "\\mathrm{rd}";
    return m + "\\mathrm{th}";
  }
  function ocn_data_key(e) {
    switch (e.type) {
      case "raw":
        return "r[" + formatSequence(e.value) + "]";
      case "P":
        return "P[" + e.k + "]";
      case "psi":
        return "p[" + ocn_data_key(e.index) + "," + ocn_data_key(e.arg) + "]";
      case "sum":
        return "s[" + e.values.map(ocn_data_key) + "]";
      case "mul":
        return "m[" + ocn_data_key(e.value) + "," + e.coe + "]";
      case "index":
        return "i[" + e.index + "," + e.k + "," + ocn_data_key(e.value) + "]";
      case "aft":
        return "a[" + ocn_data_key(e.left) + "," + e.k + "," + ocn_data_key(e.right) + "]";
      case "number":
        return "" + e.value;
    }
  }
  function compactSum(arr) {
    if (arr.length === 0) return { type: "sum", values: [] };
    const result = [];
    let i = 0;
    while (i < arr.length) {
      let j = i + 1;
      const str = ocn_data_key(arr[i]);
      while (j < arr.length && ocn_data_key(arr[j]) === str) j++;
      const count = j - i;
      if (count === 1) {
        result.push(arr[i]);
      } else {
        if (str === "1") {
          result.push({ type: "number", value: count, depth: arr[i].depth });
        } else {
          result.push({ type: "mul", value: arr[i], coe: count, depth: arr[i].depth });
        }
      }
      i = j;
    }
    return { type: "sum", values: result };
  }
  function sequenceToOCN(seq, baseDepth = 0, reverse = false, aftMode = false) {
    if (!seq || seq.length === 0) return { type: "number", value: 0 };
    const values3 = extractValues(seq);
    const leftLess = computeLeftLess(values3);
    const parentSegmentMap = buildParentSegmentMap(seq, leftLess);
    const directSegments = [];
    for (let i = 0; i < seq.length; i++) {
      if (!seq[i].starred) {
        const range = getDirectSegmentRange(seq, leftLess, i);
        directSegments.push({ ...range, index: i });
      }
    }
    directSegments.sort(compare_by((a) => a.start, number_compare));
    const filteredSegments = [];
    for (let i = 0; i < directSegments.length; i++) {
      const seg = directSegments[i];
      let contained = false;
      for (let j = 0; j < directSegments.length; j++) {
        if (i === j) continue;
        const other = directSegments[j];
        if (other.start < seg.start && other.end > seg.end) {
          contained = true;
          break;
        }
      }
      if (!contained) {
        filteredSegments.push(seg);
      }
    }
    const nodeSegments = filteredSegments.map((s) => s.index);
    nodeSegments.sort(number_compare);
    const completeMap = /* @__PURE__ */ new Map();
    for (const node of nodeSegments) {
      const range = getDirectSegmentRange(seq, leftLess, node);
      completeMap.set(node, range);
    }
    const forestParentMap = /* @__PURE__ */ new Map();
    const forestChildrenMap = /* @__PURE__ */ new Map();
    for (const node of nodeSegments) {
      let cur = node;
      let foundParent = null;
      while (true) {
        const parent8 = parentSegmentMap.get(cur);
        if (parent8 === -1 || parent8 === void 0) break;
        if (nodeSegments.includes(parent8)) {
          foundParent = parent8;
          break;
        }
        cur = parent8;
      }
      if (foundParent !== null) {
        forestParentMap.set(node, foundParent);
        if (!forestChildrenMap.has(foundParent)) forestChildrenMap.set(foundParent, []);
        forestChildrenMap.get(foundParent).push(node);
      } else {
        forestParentMap.set(node, -1);
      }
    }
    for (const [_, children] of forestChildrenMap) {
      children.sort(number_compare);
    }
    const roots = nodeSegments.filter((n) => forestParentMap.get(n) === -1);
    if (nodeSegments.length === 0 || roots.length === 0) {
      return { type: "raw", value: seq, depth: baseDepth };
    }
    const dropAncestorMap = /* @__PURE__ */ new Map();
    for (const node of nodeSegments) {
      dropAncestorMap.set(node, getDroppingAncestor(node, seq, leftLess, parentSegmentMap));
    }
    const relDepthMap = /* @__PURE__ */ new Map();
    for (const node of nodeSegments) {
      const drop = dropAncestorMap.get(node);
      const isRoot = forestParentMap.get(node) === -1;
      if (isRoot) {
        relDepthMap.set(node, 0);
      } else if (drop === node) {
        const parentNode = forestParentMap.get(node);
        const parentDepth = relDepthMap.get(parentNode);
        relDepthMap.set(node, parentDepth + 1);
      } else {
        relDepthMap.set(node, relDepthMap.get(drop));
      }
    }
    const finalDepthMap = /* @__PURE__ */ new Map();
    for (const node of nodeSegments) {
      finalDepthMap.set(node, relDepthMap.get(node) + baseDepth);
    }
    const data20 = {
      completeMap,
      forestChildrenMap,
      roots,
      finalDepthMap
    };
    function performNodeImpl(node, reverse2, aftMode2) {
      const children = data20.forestChildrenMap.get(node) || [];
      const isLeaf = children.length === 0;
      const compSeq = getCompleteSeq(node, seq, data20.completeMap);
      if (isLeaf) {
        const matched = matchP(compSeq);
        if (matched !== null) {
          if (matched === -1) return { type: "number", value: 1 };
          return { type: "P", k: matched };
        }
      } else {
        const starCopy = deepcopy(compSeq);
        if (starCopy.length > 0) {
          starCopy[starCopy.length - 1].starred = true;
        }
        const matched = matchP(starCopy);
        if (matched !== null) {
          const childrenOCN = compactSum(children.map((c) => performNode(c, reverse2, aftMode2)));
          return { type: "psi", index: { type: "P", k: matched }, arg: childrenOCN };
        }
      }
      const values4 = compSeq.map((item) => item.value);
      const leftLess2 = computeLeftLess(values4);
      const childMap = /* @__PURE__ */ new Map();
      for (let i = 0; i < compSeq.length; i++) {
        const p = leftLess2[i];
        if (p !== -1) {
          if (!childMap.has(p)) childMap.set(p, []);
          childMap.get(p).push(i);
        }
      }
      let pIdx = -1;
      for (let i = 0; i < compSeq.length; i++) {
        if (childMap.has(i) && childMap.get(i).length > 1) {
          pIdx = i;
          break;
        }
      }
      if (pIdx === -1) {
        return { type: "raw", value: seq };
      }
      const P = compSeq[pIdx].value;
      const childrenList = childMap.get(pIdx);
      const c_last = childrenList[childrenList.length - 1];
      const lastIdx = compSeq.length - 1;
      if (!compSeq[lastIdx].starred && childrenList.length >= 2) {
        const lastBlock2 = compSeq.slice(c_last);
        const lastBlockStar = lastBlock2.map((item) => ({ ...item }));
        lastBlockStar[lastBlockStar.length - 1].starred = true;
        const prevIdx = childrenList[childrenList.length - 2];
        const prevBlock = compSeq.slice(prevIdx, c_last);
        if (compare26(lastBlockStar, prevBlock) <= 0) {
          const starSeq = deepcopy(compSeq);
          starSeq[starSeq.length - 1].starred = true;
          const currentDepth2 = data20.finalDepthMap.get(node);
          const S1_str = sequenceToOCN(starSeq, currentDepth2, reverse2, aftMode2);
          if (isLeaf) {
            return S1_str;
          } else {
            const childrenLatex2 = compactSum(children.map((c) => performNode(c, reverse2, aftMode2)));
            return { type: "psi", index: S1_str, arg: childrenLatex2 };
          }
        }
      }
      const childIndices = childrenList;
      const numChildren = childIndices.length;
      function getBlock(i) {
        const idx = childIndices[i];
        const nextIdx = i + 1 < numChildren ? childIndices[i + 1] : compSeq.length;
        return compSeq.slice(idx, nextIdx);
      }
      const k = P;
      const headSeq = compSeq.slice(0, pIdx);
      const lastBlock = getBlock(numChildren - 1);
      const S2_seq = headSeq.concat(compSeq[pIdx], lastBlock);
      let S3_seq = null;
      if (numChildren >= 2) {
        const prevBlock = getBlock(numChildren - 2);
        S3_seq = headSeq.concat(compSeq[pIdx], prevBlock);
      }
      const currentDepth = data20.finalDepthMap.get(node);
      const S2_str = sequenceToOCN(S2_seq, currentDepth, reverse2, aftMode2);
      const S3_str = S3_seq ? sequenceToOCN(S3_seq, currentDepth, reverse2, aftMode2) : null;
      const S2star_seq = S2_seq.map((item) => ({ ...item }));
      if (S2star_seq.length > 0) {
        S2star_seq[S2star_seq.length - 1].starred = true;
      }
      const S2star_str = sequenceToOCN(S2star_seq, currentDepth, reverse2, aftMode2);
      const childrenLatex = isLeaf ? void 0 : compactSum(children.map((c) => performNode(c, reverse2, aftMode2)));
      const childrenLatex_noColor = isLeaf ? void 0 : compactSum(children.map((c) => performNode(c, reverse2, aftMode2)));
      let m;
      let startIdx;
      if (isLeaf) {
        m = 1;
        startIdx = numChildren - 1;
        for (let i = numChildren - 2; i >= 0; i--) {
          const block1 = getBlock(i);
          const block2 = getBlock(i + 1);
          if (block1.length === block2.length && block1.every(
            (item, idx) => item.value === block2[idx].value && item.starred === block2[idx].starred
          )) {
            m++;
            startIdx = i;
          } else {
            break;
          }
        }
      } else {
        const psiPart = { type: "psi", index: S2star_str, arg: childrenLatex_noColor };
        let l = 0;
        if (S3_str !== null && numChildren >= 2 && ocn_data_key(psiPart) === ocn_data_key(S3_str)) {
          l = 1;
          let tempIdx = numChildren - 3;
          while (tempIdx >= 0) {
            const blockA = getBlock(tempIdx);
            const blockB = getBlock(tempIdx + 1);
            if (blockA.length === blockB.length && blockA.every(
              (item, idx) => item.value === blockB[idx].value && item.starred === blockB[idx].starred
            )) {
              l++;
              tempIdx--;
            } else {
              break;
            }
          }
        }
        m = l + 1;
        startIdx = numChildren - 1 - l;
      }
      let finalS1_str = null;
      if (startIdx > 0) {
        const endIdx = childIndices[startIdx];
        const S1_seq = compSeq.slice(0, endIdx);
        finalS1_str = sequenceToOCN(S1_seq, currentDepth, reverse2, aftMode2);
      }
      const X = isLeaf ? S2_str : { type: "psi", index: S2star_str, arg: childrenLatex };
      const Y = finalS1_str;
      if (aftMode2) {
        if (Y) {
          let X1 = X;
          if (m > 1) {
            X1 = { type: "index", index: m, k, value: X };
          }
          if (reverse2) {
            return { type: "aft", left: Y, k, right: X1 };
          } else {
            return { type: "aft", left: X1, k, right: Y };
          }
        } else {
          return { type: "index", index: m, k, value: X };
        }
      } else {
        let pPart;
        if (m === 1) pPart = "p_{" + k + "}";
        else pPart = "p^{" + m + "}_{" + k + "}";
        if (Y) {
          throw new Error("Not implemented");
        } else {
          throw new Error("Not implemented");
        }
      }
    }
    function performNode(node, reverse2, aftMode2) {
      const result = performNodeImpl(node, reverse2, aftMode2);
      result.depth = data20.finalDepthMap.get(node);
      return result;
    }
    const rootEntryArray = data20.roots.map((r2) => performNode(r2, reverse, aftMode));
    return compactSum(rootEntryArray);
  }
  function OCN_display(e, type) {
    let type_no_color;
    if (type === "html-colored") type_no_color = "html";
    else if (type === "latex-colored") type_no_color = "latex";
    else type_no_color = type;
    const isColor = type === "html-colored" || type === "latex-colored";
    const mode = type_no_color;
    const sub = (s) => mode === "html" ? `<sub>${s}</sub>` : `_{${s}}`;
    const text = (s) => mode === "latex" ? `\\mathrm{${s}}` : s;
    const greek = (sym, latex) => mode === "latex" ? latex : sym;
    const sp = () => mode === "latex" ? "\\ " : " ";
    function kSym(k, omitOmega) {
      if (k === 0) return omitOmega ? "" : greek("\u03A9", "\\mathrm{\\Omega} ");
      if (k === 1) return greek("\u03B1", "\\mathrm{\\alpha} ");
      if (k === 2) return text("S");
      return text("P") + sub("" + k);
    }
    function ordText(m) {
      if (m <= 1) return "";
      const raw = ordinal(m);
      return mode === "latex" ? raw : raw.replace(/\\mathrm{([^}]*)}/g, "$1");
    }
    function impl(e2) {
      let content;
      switch (e2.type) {
        case "raw":
          content = "[" + e2.value.map((i) => i.value + (i.starred ? "*" : "")).join(",") + "]";
          break;
        case "P":
          content = kSym(e2.k, false);
          break;
        case "psi":
          content = greek("\u03C8", "\\psi ") + sub(impl(e2.index)) + "(" + impl(e2.arg) + ")";
          break;
        case "sum":
          content = e2.values.map(impl).join("+");
          break;
        case "mul": {
          const v = impl(e2.value);
          const times = mode === "latex" ? "\\times " : "\xD7";
          content = v === "1" ? "" + e2.coe : v + times + e2.coe;
          break;
        }
        case "index": {
          const v = impl(e2.value);
          const k_sym = kSym(e2.k, true);
          const o = ordText(e2.index);
          content = o + (k_sym ? sub(k_sym) : "") + sp() + v;
          break;
        }
        case "aft": {
          const left = impl(e2.left);
          const right = impl(e2.right);
          const aft_word = mode === "latex" ? "\\mathrm{aft}" : "aft";
          const k_sym = kSym(e2.k, true);
          if (k_sym) {
            content = left + sp() + aft_word + sub(k_sym) + sp() + right;
          } else {
            content = left + sp() + aft_word + sp() + right;
          }
          break;
        }
        case "number":
          content = "" + e2.value;
          break;
      }
      if (isColor && e2.depth !== void 0 && e2.depth > 0) {
        const idx = (e2.depth - 1) % (depthColors.length - 1) + 1;
        const color = depthColors[idx];
        if (type === "html-colored") {
          return `<span style='color:${color}'>${content}</span>`;
        } else {
          return `{\\color{${color}}${content}}`;
        }
      }
      return content;
    }
    return impl(e);
  }
  function display_as_OCN(e, type) {
    if (is_infinity30(e)) return type === "latex" || type === "latex-colored" ? "\\mathrm{Limit}" : "Limit";
    return OCN_display(sequenceToOCN(e, 0, false, true), type);
  }
  function compare26(a, b) {
    return lex_compare(
      a,
      b,
      object_lex_compare_by(
        {
          value: number_compare,
          starred: boolean_compare
        },
        ["value", "starred"]
      )
    );
  }
  function is_limit20(e) {
    if (is_infinity30(e)) return true;
    if (e.length === 0) return false;
    return e[e.length - 1].value !== 0;
  }
  function FS16(e, index) {
    if (is_infinity30(e)) return infinity_FS26(index);
    return expandOnOriginal(e, index).expanded;
  }
  var UPS1_1r5 = {
    id: "ups1.1r5",
    name: "Upward Projection Sequence 1.1r5",
    simple_name: "UPS 1.1r5",
    category_id: "category-ocn",
    display: {
      plain: formatSequence,
      from_display: parseSequence
    },
    display_equiv: {
      POCN: {
        plain: bind2(display_as_OCN, "plain"),
        html: bind2(display_as_OCN, "html"),
        latex: bind2(display_as_OCN, "latex"),
        name_id: "display.pocn"
      },
      colored: {
        plain: bind2(display_as_OCN, "plain"),
        html: bind2(display_as_OCN, "html-colored"),
        latex: bind2(display_as_OCN, "latex-colored"),
        name_id: "display.pocn-colored"
      }
    },
    is_limit: is_limit20,
    compare: compare26,
    ...sequence_FS_variants0(FS16, is_infinity30, infinity_FS26, is_limit20, formatSequence),
    credit_text_id: "credit.ups1_1r5",
    init: () => [INFINITY24, []]
  };

  // src/notations/OCN/cOCF.ts
  var cOCF_count = (x) => (x.match(/\(/g) || []).length - (x.match(/\)/g) || []).length;
  function cOCF_op(x) {
    if (cOCF_lt(x, "p(p(0))")) {
      return false;
    }
    let f = x[0] == "p" ? `p(${cOCF_sua(cOCF_arg(x))[0]})` : "P(0)";
    let g = null;
    let h = null;
    if (f == "p(0)") {
      f = "p(p(0))";
      g = cOCF_log(x);
      h = cOCF_exp(g);
    } else {
      g = cOCF_div(cOCF_log(x), f);
      h = cOCF_exp(cOCF_mul(f, g));
    }
    let c = cOCF_div(x, h);
    let d = cOCF_sub(x, cOCF_mul(h, cOCF_div(x, h)));
    if (d != "0") {
      return true;
    }
    return false;
  }
  function cOCF_display(x) {
    if (x + "" == "Infinity") {
      return "c";
    }
    if (x == "0") {
      return "0";
    }
    if (/^(p\(0\)\+)*p\(0\)$/.test(x)) {
      return ((x.length + 1) / 5).toString();
    }
    let f = x[0] == "p" ? `p(${cOCF_sua(cOCF_arg(x))[0]})` : "P(0)";
    let g = null;
    let h = null;
    if (f == "p(0)") {
      f = "p(p(0))";
      g = cOCF_log(x);
      h = cOCF_exp(g);
    } else {
      g = cOCF_div(cOCF_log(x), f);
      h = cOCF_exp(cOCF_mul(f, g));
    }
    let c = cOCF_div(x, h);
    let d = cOCF_sub(x, cOCF_mul(h, cOCF_div(x, h)));
    if (c == "p(0)" && d == "0") {
      if (cOCF_exp(x) != x) {
        if (x == "p(p(0))") {
          return "\u03C9";
        }
        if (cOCF_lt(x, "p(P(0))")) {
          return `\u03C9<sup>${cOCF_display(cOCF_log(x))}</sup>`;
        }
        return `${cOCF_display(f)}<sup>${cOCF_display(g)}</sup>`;
      }
      if (x == "P(0)") {
        return "c";
      }
      let m = cOCF_div(cOCF_log(cOCF_lastTerm(cOCF_arg(x))[1]), "P(0)");
      let k = cOCF_exp(cOCF_mul("P(0)", cOCF_div(cOCF_log(cOCF_lastTerm(cOCF_arg(x))[1]), "P(0)")));
      k = cOCF_div(cOCF_arg(x), k);
      k = cOCF_sua(k);
      let t = cOCF_exp(cOCF_add(cOCF_mul("P(0)", m), "P(0)"));
      let l = null;
      if (k[0] == "0") {
        l = "0";
      } else {
        l = "p(" + cOCF_mul(cOCF_exp(cOCF_mul("P(0)", m)), k[0]) + ")";
      }
      let r2 = "p(" + cOCF_mul(cOCF_exp(cOCF_mul("P(0)", m)), cOCF_add(k[0], "P(0)")) + ")";
      let [a2, b] = cOCF_split(k[1], r2);
      a2 = "p(" + cOCF_mul(cOCF_exp(cOCF_mul("P(0)", m)), a2) + ")";
      if (a2 == "p(0)") {
        a2 = "0";
      }
      l = cOCF_add(l, cOCF_add(a2, b));
      let s = "";
      if (cOCF_lastTerm(cOCF_arg(x))[1][0] == "P" && b != "0") {
        if (m == "p(0)") {
          s = "\u03A9";
        }
        if (m == "p(0)+p(0)") {
          s = "L";
        }
        if (m == "p(0)+p(0)+p(0)") {
          s = "R";
        }
        if (m == "P(0)") {
          s = "J";
        }
        if (s == "") {
          return `\u03C8(${cOCF_display(cOCF_arg(x))})`;
        }
        if (l == "p(0)") {
          return s;
        }
        return `${s}<sub>${cOCF_display(l)}</sub>`;
      }
      return `\u03C8(${cOCF_display(cOCF_arg(x))})`;
    }
    let a = cOCF_display(h);
    if (c != "p(0)") {
      if (!cOCF_op(c)) {
        a += cOCF_display(c);
      } else {
        a += `&sdot;(${cOCF_display(c)})`;
      }
    }
    if (d != "0") {
      a += "+" + cOCF_display(d);
    }
    return a;
  }
  function cOCF_paren(x, n) {
    console.log();
    let q = x[n] == "(" ? 1 : -1;
    let i = n;
    let t = 0;
    while (1) {
      t += x[i] == "(" ? 1 : x[i] == ")" ? -1 : 0;
      if (!t) {
        break;
      }
      i += q;
    }
    return i;
  }
  function cOCF_firstTerm(x) {
    console.log();
    let m = cOCF_paren(x, 1);
    return [x.slice(0, m + 1), x.slice(m + 2) || "0"];
  }
  function cOCF_lastTerm(x) {
    console.log();
    let m = cOCF_paren(x, x.length - 1);
    return [x.slice(0, m - 2) || "0", x.slice(m - 1)];
  }
  function cOCF_terms(x) {
    console.log();
    if (x == "0") {
      return [];
    }
    return [cOCF_firstTerm(x)[0]].concat(cOCF_terms(cOCF_firstTerm(x)[1]));
  }
  function cOCF_trim(s) {
    while (s[s.length - 1] == ")") {
      s = s.slice(0, -1);
    }
    return s;
  }
  function cOCF_arg(x) {
    console.log();
    return cOCF_firstTerm(x)[0].slice(2, -1);
  }
  function cOCF_lt(x, y) {
    console.log();
    if (y == "0") {
      return false;
    }
    if (x == "0") {
      return true;
    }
    if (x[0] == "p" && y[0] == "P") {
      return true;
    }
    if (x[0] == "P" && y[0] == "p") {
      return false;
    }
    if (cOCF_arg(x) != cOCF_arg(y)) {
      return cOCF_lt(cOCF_arg(x), cOCF_arg(y));
    }
    return cOCF_lt(cOCF_firstTerm(x)[1], cOCF_firstTerm(y)[1]);
  }
  function cOCF_expW(x) {
    console.log();
    if (cOCF_lt(x, "P(0)")) {
      return "0";
    }
    x = cOCF_arg(x);
    let y = "";
    while (cOCF_lt("P(0)", cOCF_firstTerm(x)[0]) || cOCF_firstTerm(x)[0] == "P(0)") {
      y += cOCF_firstTerm(x)[0] + "+";
      x = cOCF_firstTerm(x)[1];
    }
    if (cOCF_lt(y.slice(0, -1) || "0", "P(p(0))")) {
      y = "P(0)+" + y;
    }
    return y.slice(0, -1);
  }
  function cOCF_lv(x) {
    return cOCF_expW(cOCF_lastTerm(cOCF_arg(x)).at(-1));
  }
  function cOCF_fix(s) {
    while (cOCF_count(s)) {
      s += ")";
    }
    return s;
  }
  function cOCF_root1(x) {
    let i = cOCF_trim(x).length + 1;
    let c = void 0;
    while (1) {
      c = cOCF_paren(x, i);
      if (cOCF_lt(x.slice(c - 1, i + 1), "P(0)")) {
        break;
      }
      i++;
      if (i == x.length) {
        return void 0;
      }
    }
    console.log();
    let v = cOCF_lv(x.slice(c - 1, i + 1));
    let p = c;
    let q = i;
    let m = c;
    let n = i;
    i++;
    if (i >= x.length) {
      return void 0;
    }
    while (1) {
      c = cOCF_paren(x, i);
      if (x[c - 1] == "p") {
        let l = cOCF_lv(x.slice(c - 1, i + 1));
        if (cOCF_lv(x.slice(m - 1, n + 1)) == "0") {
          m = p;
          n = q;
          break;
        }
        if (cOCF_lt(l, v)) {
          break;
        }
        m = c;
        n = i;
      }
      i++;
      if (i == x.length) {
        return void 0;
      }
    }
    return [n, x.slice(m - 1, n + 1)];
  }
  function cOCF_root2(x) {
    console.log();
    if (cOCF_root1(x) === void 0) {
      return void 0;
    }
    let y = cOCF_root1(x)[1];
    let i = cOCF_root1(x)[0];
    let k = [i, y];
    let c = null;
    let z = null;
    while (1) {
      if (i == x.length) {
        return void 0;
      }
      c = cOCF_paren(x, i);
      if (cOCF_lt(x.slice(c - 1, i + 1), y)) {
        z = [i, x.slice(c - 1, i + 1)];
        break;
      }
      i++;
    }
    let m = cOCF_paren(x, i);
    let s = cOCF_lv("p(" + x.slice(m + 1, i) + ")");
    s = s == "0" ? "P(0)" : `P({cOCF_add(cOCF_sub(s,'P(0)'),'P(0)')})`;
    let [p, q] = cOCF_split(x.slice(m + 1, i), s);
    p = cOCF_findall(p);
    let u = "0";
    for (let i2 of p) {
      if (cOCF_lt(u, i2)) {
        u = i2;
      }
    }
    let j = cOCF_paren(x, i);
    i--;
    while (1) {
      m = cOCF_paren(x, i);
      if (x[m - 1] == "p") {
        c = cOCF_paren(x, i + 1);
        z = [i, cOCF_split(x.slice(c + 1, i + 1), "P(0)")[1]];
        break;
      }
      i--;
    }
    if (!cOCF_lt(u, q) && p.length) {
      let v = k[0] - k[1].length;
      let t = x.slice(j - 1, v + 1);
      t += "P(0)";
      v += 4;
      return [v, x.slice(j - 1, v + 1)];
    }
    return z;
  }
  function cOCF_fs(x, n) {
    if (x == "0") {
      return x;
    }
    let y = x;
    let m = cOCF_paren(x, x.length - 1);
    let d = x.slice(m - 1);
    if (d == "p(0)") {
      if (m === 1) return "0";
      return x.slice(0, m - 2);
    }
    x = cOCF_trim(x);
    let o = "";
    if (x.at(-3) == "p") {
      x += "))";
      let k = cOCF_paren(x, x.length - 1);
      let z = x.slice(k - 1, -5) + ")";
      o = x.slice(0, k - 1) + ("+" + z).repeat(n + 1);
    } else {
      if (y == "P(0)" || cOCF_lt("P(0)", y)) {
        let b = cOCF_trim(x).slice(0, -3);
        o = b + "p(" + "P(".repeat(n);
      } else {
        let r2 = cOCF_root2(y);
        if (r2 == void 0) {
          let b = cOCF_trim(x).slice(0, -3);
          o = b + "p(" + "P(".repeat(n);
        } else {
          let b = cOCF_trim(x.slice(r2[0] - r2[1].length + 1, r2[0])).slice(0, -3);
          o = x.slice(0, r2[0] - r2[1].length + 1) + b.repeat(n);
        }
      }
    }
    o = cOCF_fix(o).replaceAll("+)", ")").replaceAll("(+", "(").replaceAll("++", "+").replaceAll("()", "(0)");
    if (o[0] == "+") {
      o = o.slice(1);
    }
    o = o || "0";
    return o;
  }
  function cOCF_add(x, y) {
    if (x == "0") {
      return y;
    }
    if (y == "0") {
      return x;
    }
    if (cOCF_lt(cOCF_firstTerm(x)[0], cOCF_firstTerm(y)[0])) {
      return y;
    }
    let z = cOCF_firstTerm(x)[0];
    let w = cOCF_add(cOCF_firstTerm(x)[1], y);
    if (w != "0") {
      return z + "+" + w;
    }
    return z;
  }
  function cOCF_sub(x, y) {
    if (x == "0") {
      return "0";
    }
    if (y == "0") {
      return x;
    }
    if (cOCF_lt(cOCF_firstTerm(y)[0], cOCF_firstTerm(x)[0])) {
      return x;
    }
    return cOCF_sub(cOCF_firstTerm(x)[1], cOCF_firstTerm(y)[1]);
  }
  function cOCF_sua(x) {
    return cOCF_split(x, "P(0)");
  }
  function cOCF_exp(a) {
    if (a[0] == "P") {
      return `P(${cOCF_sub(a, "P(0)")})`;
    }
    if (cOCF_lt(a, "p(p(P(0)))")) {
      return `p(${a})`;
    }
    let [x, y] = cOCF_sua(cOCF_arg(a));
    let p = cOCF_split(y, `p(${cOCF_add(x, "P(0)")})`)[0];
    return "p(" + cOCF_add(x, cOCF_add(p, cOCF_sub(a, "p(" + cOCF_add(x, p) + ")"))) + ")";
  }
  function cOCF_log(a) {
    if (a == "0") {
      return [];
    }
    if (a[0] == "P") {
      return cOCF_add("P(0)", cOCF_arg(a));
    }
    let [x, y] = cOCF_sua(cOCF_arg(a));
    let [p, q] = cOCF_split(y, `p(${cOCF_add(x, "P(0)")})`);
    if (x == "0" && p == "0") {
      return q;
    }
    let m = cOCF_add(`p(${cOCF_add(x, p)})`, q);
    return m;
  }
  function cOCF_div(a, b) {
    if (cOCF_lt(a, b)) {
      return "0";
    }
    return cOCF_add(cOCF_exp(cOCF_sub(cOCF_log(a), cOCF_log(b))), cOCF_div(cOCF_firstTerm(a)[1], b));
  }
  function cOCF_mul(a, b) {
    if (b == "0") {
      return "0";
    }
    return cOCF_add(cOCF_exp(cOCF_add(cOCF_log(a), cOCF_log(b))), cOCF_mul(a, cOCF_firstTerm(b)[1]));
  }
  function cOCF_split(a, x) {
    if (a == "0") {
      return ["0", "0"];
    }
    if (cOCF_lt(cOCF_firstTerm(a)[0], x)) {
      return ["0", a];
    }
    return [
      cOCF_add(cOCF_firstTerm(a)[0], cOCF_split(cOCF_firstTerm(a)[1], x)[0]),
      cOCF_split(cOCF_firstTerm(a)[1], x)[1]
    ];
  }
  function cOCF_findall(a) {
    if (a == "0") {
      return [];
    }
    let [p, q] = cOCF_split(a, "P(0)");
    return cOCF_terms(p).map(cOCF_arg).map(cOCF_findall).flat().filter((x) => x != "0").concat([q].filter((x) => x != "0"));
  }
  function cOCF_compare(x, y) {
    if (cOCF_lt(x, y)) {
      return -1;
    }
    if (cOCF_lt(y, x)) {
      return 1;
    }
    return 0;
  }
  function cOCF_islimit(a) {
    if (a + "" == "Infinity") {
      return true;
    }
    if (a == "0") {
      return false;
    }
    return a.slice(-4) != "p(0)";
  }
  function cOCF_display_plain(x) {
    return cOCF_display(x).replace(/<sup>/g, "^(").replace(/<\/sup>/g, ")").replace(/<sub>/g, "_{").replace(/<\/sub>/g, "}").replace(/&sdot;/g, "\xB7");
  }
  var cOCF = {
    id: "cocf",
    name: "cOCF",
    category_id: "category-ocn",
    display: {
      plain: cOCF_display_plain,
      html: cOCF_display
    },
    is_limit: cOCF_islimit,
    compare: cOCF_compare,
    FS: /* @__PURE__ */ (() => {
      var data20 = {};
      return (m, n) => {
        if ("" + m === "Infinity") return cOCF_fs("P(0)", n);
        if (m === "0") return "0";
        var datakey = m;
        if (!data20[datakey]) data20[datakey] = [];
        else if (data20[datakey][n] !== void 0) return data20[datakey][n];
        return data20[datakey][n] = cOCF_fs(m, n);
      };
    })(),
    init: () => [Infinity, "0"]
  };

  // src/notations/OCN/n_shifted_psi.ts
  var HSPN_count = (x) => (x.match(/\(/g) || []).length - (x.match(/\)/g) || []).length;
  function unabbreviate(x) {
    let y = x;
    y = y.replaceAll("\u03C8", "psi");
    y = y.replaceAll("\u03A9", "W");
    y = y.replaceAll("\u03C9", "w");
    y = y.replaceAll("psi", "p");
    y = y.replaceAll("_", "");
    y = y.replaceAll(/W\d+/g, (p) => "W".repeat(Number(p.slice(1))));
    function e(x2) {
      return x2.replaceAll(/p\(W{2,}\)/g, (p) => "W".repeat(p.length - 4));
    }
    while (e(y) != y) {
      y = e(y);
    }
    y = y.replaceAll("w", "p(1)");
    y = y.replaceAll(/[1-9]\d*/g, (p) => {
      return "p(0)+".repeat(Number(p)).slice(0, -1);
    });
    return y;
  }
  function abbreviate(x) {
    let y = x;
    y = y.replaceAll(/W{2,}/g, (p) => `W_${p.length}`);
    y = y.replaceAll("W", "\u03A9");
    y = y.replaceAll("p(0)", "1");
    y = y.replaceAll(/(1\+)+1/g, (p) => ((p.length + 1) / 2).toString());
    y = y.replaceAll("p(1)", "\u03C9");
    y = y.replaceAll("p", "\u03C8");
    return y;
  }
  function HSPN_std(x) {
    return x == "" ? 0 : unabbreviate(abbreviate(x));
  }
  function HSPN_paren(x, n, sw = true) {
    if (x[n - 1] == "W" && sw) {
      n--;
      let i2 = n;
      while (x[i2] == "W") {
        i2++;
      }
      return i2 - 1;
    }
    let q = x[n] == "(" ? 1 : -1;
    let i = n;
    let t = 0;
    while (1) {
      t += x[i] == "(" ? 1 : x[i] == ")" ? -1 : 0;
      if (!t) {
        break;
      }
      i += q;
    }
    return i;
  }
  function HSPN_lv(x) {
    if (x == "0") {
      return 0;
    } else if (x.match(/^W+(\+|$)/)) {
      return HSPN_paren(x, 1) + 1;
    } else {
      let t = HSPN_paren(x, 1);
      return Math.max(0, HSPN_lv(x.slice(2, t)) - 1);
    }
  }
  function HSPN_arg(x) {
    if (x[0] == "0") {
      return x;
    }
    if (x[0] == "W") {
      return "W".repeat(HSPN_paren(x, 1) + 1);
    }
    return x.slice(2, HSPN_paren(x, 1));
  }
  function HSPN_lt(x, y) {
    if (y == "0") {
      return false;
    }
    if (x == "0") {
      return true;
    }
    if (HSPN_lv(x) == HSPN_lv(y)) {
      let x_ = HSPN_paren(x, 1);
      let y_ = HSPN_paren(y, 1);
      if (x.slice(0, x_ + 1) == y.slice(0, y_ + 1)) {
        return HSPN_lt(HSPN_std(x.slice(x_ + 2)), HSPN_std(y.slice(y_ + 2)));
      }
      return HSPN_lt(HSPN_arg(x), HSPN_arg(y));
    }
    return HSPN_lv(x) < HSPN_lv(y);
  }
  function HSPN_limit(s, n) {
    return "p(".repeat(n + 1) + "W".repeat(s + n) + "+" + "W".repeat(s + n) + ")".repeat(n + 1);
  }
  function HSPN_fix(s) {
    while (HSPN_count(s)) {
      s += ")";
    }
    return s;
  }
  function HSPN_trim(s) {
    while (s.at(-1) == ")") {
      s = s.slice(0, -1);
    }
    return s;
  }
  function HSPN_islimit(x) {
    if ("" + x == "Infinity") {
      return true;
    }
    if (x == "0") {
      return false;
    }
    if (x.at(-1) == "W") {
      return true;
    }
    x = HSPN_trim(x);
    if (x.at(-1) == "0" && HSPN_count(x) == 1) {
      return false;
    }
    return true;
  }
  function HSPN_root(x, l) {
    let b = x.length - 1;
    while (x[b] == ")") {
      b--;
    }
    if (x[b] == "0") {
      return void 0;
    }
    let a = b;
    while (x[a] != "+" && x[a] != "(") {
      a--;
    }
    a++;
    b++;
    let i = b;
    let y = x.slice(a, b);
    if (l == 1) {
      while (1) {
        if (i == x.length) {
          return void 0;
        }
        let c2 = HSPN_paren(x, i, false);
        if (HSPN_lt(x.slice(c2 - 1, i + 1), y)) {
          return [i, x.slice(c2 - 1, i + 1)];
        }
        i++;
      }
    }
    let h = x.length - 1;
    while (x.at(h) != "W") {
      h--;
    }
    let v = x.slice(0, HSPN_root(x, l - 1)[0]);
    let f = HSPN_root(x, l - 1);
    let z = HSPN_count(v);
    let q = f[0] - f[1].length + 2;
    let w = q;
    let c = f[1];
    i = f[0] - f[1].length + 1;
    while (1) {
      if (x[i] == "(") {
        let m = x.slice(0, i);
        let t = HSPN_count(m);
        if (t <= z) {
          if (HSPN_lt(HSPN_fix(x.slice(i - 1, h)), HSPN_root(x, l - 1)[1])) {
            break;
          }
          q = i;
        }
      }
      i--;
    }
    q--;
    let n = f[0];
    while (HSPN_count(x.slice(q, n + 1)) > 0) {
      n++;
    }
    return [n, x.slice(q, n + 1)];
  }
  function HSPN_fs(x, n) {
    if (x == "0") {
      return x;
    }
    if (x.at(-1) == "W") {
      let y = x;
      while (y.at(-1) == "W") {
        y = y.slice(0, -1);
      }
      return y + HSPN_limit(x.length - y.length, n);
    }
    x = HSPN_trim(x);
    let o = "";
    if (x.at(-1) == "0") {
      if (HSPN_count(x) == 1) {
        o = x != "p(0" ? x.slice(0, -4) : "0";
      } else {
        x += "))";
        let k = HSPN_paren(x, x.length - 1);
        let z = x.slice(k - 1, -5) + ")";
        o = x.slice(0, k - 1) + ("+" + z).repeat(n + 1);
      }
    } else {
      let m = false;
      let z = x;
      let y = HSPN_fix(x);
      let i = 0;
      while (z.at(-1) == "W") {
        i++;
        z = z.slice(0, -1);
      }
      let l = i;
      let j = x.length;
      let v = "W".repeat(i);
      let a = void 0;
      while (1) {
        while (1) {
          if (j == y.length) {
            m = true;
            break;
          }
          a = HSPN_paren(y, j, false);
          if (HSPN_lt(y.slice(a - 1, j + 1), v)) {
            break;
          }
          j++;
        }
        if (m) {
          break;
        }
        v = y.slice(a - 1, j + 1);
        i--;
        if (!i) {
          break;
        }
      }
      if (m) {
        o = z + HSPN_limit(l, n);
      } else {
        let r2 = HSPN_root(y, l)[0] - HSPN_root(y, l)[1].length + 1;
        if (r2 < 1) {
          n++;
        }
        o = x.slice(0, r2) + z.slice(r2).repeat(n);
      }
    }
    o = HSPN_fix(o).replaceAll("+)", ")").replaceAll("(+", "(").replaceAll("++", "+").replaceAll("()", "(0)");
    if (o[0] == "+") {
      o = o.slice(1);
    }
    return HSPN_std(o);
  }
  function HSPN_display(x) {
    if ("" + x == "Infinity") {
      return "Limit";
    }
    return abbreviate(x).replaceAll(/_\d+/g, (x2) => `<sub>${Number(x2.slice(1))}</sub>`);
  }
  function HSPN_compare(x, y) {
    if (HSPN_lt(x, y)) {
      return -1;
    }
    if (HSPN_lt(y, x)) {
      return 1;
    }
    return 0;
  }
  function HSPN_display_plain(x) {
    return HSPN_display(x).replace(/<sub>/g, "_").replace(/<\/sub>/g, "");
  }
  var n_shifted_psi = {
    id: "hspn",
    name: "n-shifted psi",
    simple_name: "n-dp",
    category_id: "category-ocn",
    display: {
      plain: HSPN_display_plain,
      html: HSPN_display
    },
    is_limit: HSPN_islimit,
    compare: HSPN_compare,
    FS: /* @__PURE__ */ (() => {
      var data20 = {};
      return (m, n) => {
        if ("" + m === "Infinity") return HSPN_fs("W", n);
        if (m === "0") return "0";
        var datakey = HSPN_display(m);
        if (!data20[datakey]) data20[datakey] = [];
        else if (data20[datakey][n] !== void 0) return data20[datakey][n];
        return data20[datakey][n] = HSPN_fs(m, n);
      };
    })(),
    init: () => [Infinity, "0"]
  };

  // src/notations/TON/ton_helpers.ts
  var TON_noraise_compare = (x, y) => {
    var comp2 = (a, b) => {
      if (a.length) {
        if (b.length) {
          if (a[0] > b[0]) return 1;
          else if (a[0] < b[0]) return -1;
          else return comp2(a.slice(1), b.slice(1));
        } else return 1;
      } else if (b.length) {
        return -1;
      } else return 0;
    };
    return comp2(
      ("" + x).split(",").map((e) => +e),
      ("" + y).split(",").map((e) => +e)
    );
  };
  var TON_noraise_display = (term) => typeof term === "number" ? term === Infinity ? "Limit" : term < 0 ? "0" : "\u03A9" : TON_noraise_display(term[0]) + TON_noraise_display(term[1]) + "C";
  var raise = (term, sys) => typeof term === "number" ? term >= 0 && term < sys ? [-1, raise(term + 1, sys), -2] : term : [raise(term[0], sys), raise(term[1], sys), -2];
  var TON_compare = (x, y) => {
    var comp2 = (a, b) => {
      if (a.length) {
        if (b.length) {
          if (a[0] > b[0]) return 1;
          else if (a[0] < b[0]) return -1;
          else return comp2(a.slice(1), b.slice(1));
        } else return 1;
      } else if (b.length) {
        return -1;
      } else return 0;
    };
    var sysx, sysy, tmpx = ("" + x).split(","), tmpy = ("" + y).split(",");
    sysx = Math.max(0, ...tmpx.map(Number));
    sysy = Math.max(0, ...tmpy.map(Number));
    if (sysx < Infinity && sysy < Infinity && (sysx > 0 || sysy > 0)) {
      x = raise(x, Math.max(sysx, sysy));
      y = raise(y, Math.max(sysx, sysy));
    }
    return comp2(
      ("" + x).split(",").map((e) => +e),
      ("" + y).split(",").map((e) => +e)
    );
  };
  var TON_main_display = (term) => typeof term === "number" ? term === Infinity ? "Limit" : term < 0 ? "0" : "\u03A9<sub>" + term + "</sub>" : TON_main_display(term[0]) + TON_main_display(term[1]) + "C";
  var TON_limit = (term) => typeof term === "number" ? term >= 0 : typeof term[1] !== "number" || term[1] >= 0;
  var r = (a, b) => {
    if (typeof a === "number") return a;
    if (TON_compare(a, b) > 0) {
      if (TON_compare(a[0], b) > 0) {
        return [r(a[0], b), r(a[1], b), -2];
      } else {
        return [-0.5, r(a[1], b), -2];
      }
    } else {
      if (TON_compare(a, b) < 0) {
        return a;
      } else {
        return -0.5;
      }
    }
  };

  // src/notations/TON/TON_DRC.ts
  var data7 = {};
  var DRCStd = {};
  var smallpart = (term) => {
    var sow_smallpart = (a) => {
      if (a === 0) return;
      if (TON_noraise_compare(a, 0) < 0) {
        result.push(a);
      } else {
        sow_smallpart(a[0]);
        sow_smallpart(a[1]);
      }
    }, result = [];
    sow_smallpart(term);
    return result;
  };
  var BuiltQ = (a, ap4, b, x, xp) => TON_noraise_compare(x, 0) < 0 ? TON_noraise_compare(x, b) < 0 || TON_noraise_compare(r(x, xp), r(a, ap4)) <= 0 && BuiltQ(a, ap4, b, x[0], x) && BuiltQ(a, ap4, b, x[1], x) : x === 0 || BuiltQ(a, ap4, b, x[0], xp) && BuiltQ(a, ap4, b, x[1], xp);
  var StandardQ = (a) => {
    var str = JSON.stringify(a);
    if (DRCStd[str]) {
      return DRCStd[str];
    } else if (typeof a === "number" || StandardQ(a[1]) && StandardQ(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallpart(a[1]).every((x) => BuiltQ(x, a, a, x, a))) {
      return DRCStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy2 = (x) => typeof x === "number" ? x : [Copy2(x[0]), Copy2(x[1]), -2];
  var TON_gen = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy2(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ(beta)) {
        n = yield Copy2(beta);
        flag = false;
      }
    }
  };
  var TON_DRC = {
    id: "ton-drc",
    name: "Degrees of Reflection (reflection configuration)",
    simple_name: "TON_DRC",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, 0, -2];
        }
        var datakey = "" + term, dataterm = data7[datakey];
        if (!dataterm) {
          dataterm = data7[datakey] = [];
          dataterm.gen = TON_gen(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, -1]
  };

  // src/notations/TON/TON_DRP.ts
  var data8 = {};
  var DRPStd = {};
  var smallpart2 = (term) => {
    var sow_smallpart = (a) => {
      if (a === 0) return;
      if (TON_noraise_compare(a, 0) < 0) {
        result.push(a);
      } else {
        sow_smallpart(a[0]);
        sow_smallpart(a[1]);
      }
    }, result = [];
    sow_smallpart(term);
    return result;
  };
  var BuiltQ2 = (a, ai, b, a0, d) => {
    if (a === 0 || TON_noraise_compare(a, b) < 0) return true;
    if (d === -1 && TON_noraise_compare(a, 0) < 0 && TON_noraise_compare(a, ai) > 0) return false;
    if (TON_noraise_compare(a, d) < 0) return BuiltQ2(a, ai, b, a0, -1);
    if (d === -1 && TON_noraise_compare(a[0], 0) < 0 && TON_noraise_compare(a[1], a0) < 0)
      return BuiltQ2(a, ai, b, a0, a);
    return BuiltQ2(a[0], ai, b, a0, d) && BuiltQ2(a[1], ai, b, a0, d);
  };
  var StandardQ2 = (a) => {
    var str = JSON.stringify(a);
    if (DRPStd[str]) {
      return DRPStd[str];
    } else if (typeof a === "number" || StandardQ2(a[1]) && StandardQ2(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallpart2(a[1]).every((x) => BuiltQ2(x, x, a, a[1], -1))) {
      return DRPStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy3 = (x) => typeof x === "number" ? x : [Copy3(x[0]), Copy3(x[1]), -2];
  var TON_gen2 = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy3(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ2(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ2(beta)) {
        n = yield Copy3(beta);
        flag = false;
      }
    }
  };
  var TON_DRP = {
    id: "ton-drp",
    name: "Degrees of Reflection with Passthrough",
    simple_name: "TON_DRP",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, 0, -2];
        }
        var datakey = "" + term, dataterm = data8[datakey];
        if (!dataterm) {
          dataterm = data8[datakey] = [];
          dataterm.gen = TON_gen2(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, -1]
  };

  // src/notations/TON/TON_DoR.ts
  var data9 = {};
  var DRStd = {};
  var smallpart3 = (term) => {
    var sow_smallpart = (a) => {
      if (a === 0) return;
      if (TON_noraise_compare(a, 0) < 0) {
        result.push(a);
      } else {
        sow_smallpart(a[0]);
        sow_smallpart(a[1]);
      }
    }, result = [];
    sow_smallpart(term);
    return result;
  };
  var BuiltQ3 = (a, b, x) => TON_noraise_compare(x, 0) < 0 ? TON_noraise_compare(x, b) < 0 || TON_noraise_compare(x, a) <= 0 && BuiltQ3(a, b, x[0]) && BuiltQ3(a, b, x[1]) : x === 0 || BuiltQ3(a, b, x[0]) && BuiltQ3(a, b, x[1]);
  var StandardQ3 = (a) => {
    var str = JSON.stringify(a);
    if (DRStd[str]) {
      return DRStd[str];
    } else if (typeof a === "number" || StandardQ3(a[1]) && StandardQ3(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallpart3(a[1]).every((x) => BuiltQ3(x, a, x))) {
      return DRStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy4 = (x) => typeof x === "number" ? x : [Copy4(x[0]), Copy4(x[1]), -2];
  var TON_gen3 = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy4(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ3(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ3(beta)) {
        n = yield Copy4(beta);
        flag = false;
      }
    }
  };
  var TON_DoR = {
    id: "ton-dr",
    name: "Degrees of Reflection",
    simple_name: "TON_DoR",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, 0, -2];
        }
        var datakey = "" + term, dataterm = data9[datakey];
        if (!dataterm) {
          dataterm = data9[datakey] = [];
          dataterm.gen = TON_gen3(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, -1]
  };

  // src/notations/TON/TON_DRPC.ts
  var data10 = {};
  var DRPCStd = {};
  var smallpart4 = (term) => {
    var sow_smallpart = (a) => {
      if (a === 0) return;
      if (TON_noraise_compare(a, 0) < 0) {
        result.push(a);
      } else {
        sow_smallpart(a[0]);
        sow_smallpart(a[1]);
      }
    }, result = [];
    sow_smallpart(term);
    return result;
  };
  var BuiltQ4 = (a, ap4, ai, b, a0, d) => {
    if (a === 0 || TON_noraise_compare(a, b) < 0) return true;
    if (d === -1 && TON_noraise_compare(a, 0) < 0 && TON_noraise_compare(r(a, ap4), r(ai, b)) > 0) return false;
    if (TON_noraise_compare(a, d) < 0) return BuiltQ4(a, ap4, ai, b, a0, -1);
    var x2 = TON_noraise_compare(a, 0) < 0 ? a : ap4;
    if (d === -1 && TON_noraise_compare(a[0], 0) < 0 && TON_noraise_compare(r(a[1], x2), r(a0, b)) < 0)
      return BuiltQ4(a, ap4, ai, b, a0, a);
    return BuiltQ4(a[0], x2, ai, b, a0, d) && BuiltQ4(a[1], x2, ai, b, a0, d);
  };
  var StandardQ4 = (a) => {
    var str = JSON.stringify(a);
    if (DRPCStd[str]) {
      return DRPCStd[str];
    } else if (typeof a === "number" || StandardQ4(a[1]) && StandardQ4(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallpart4(a[1]).every((x) => BuiltQ4(x, a, x, a, a[1], -1))) {
      return DRPCStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy5 = (x) => typeof x === "number" ? x : [Copy5(x[0]), Copy5(x[1]), -2];
  var TON_gen4 = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy5(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ4(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ4(beta)) {
        n = yield Copy5(beta);
        flag = false;
      }
    }
  };
  var TON_DRPC = {
    id: "ton-drpc",
    name: "Degrees of Reflection with Passthrough (reflection configuration)",
    simple_name: "TON_DRPC",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, 0, -2];
        }
        var datakey = "" + term, dataterm = data10[datakey];
        if (!dataterm) {
          dataterm = data10[datakey] = [];
          dataterm.gen = TON_gen4(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, -1]
  };

  // src/notations/TON/TON_I.ts
  var data11 = {};
  var IStd = {};
  var extract2 = (term, index) => index.length ? extract2(term[index[0]], index.slice(1)) : term;
  var smallindex = (a) => {
    if (a === 0) return [];
    var sow_smallindex = (a2, begin) => {
      if (a2 === 0) return;
      if (TON_noraise_compare(a2, 0) < 0) {
        result.push(begin);
      } else {
        sow_smallindex(a2[0], begin.concat(0));
        sow_smallindex(a2[1], begin.concat(1));
      }
    }, result = [];
    sow_smallindex(a, []);
    return result;
  };
  var Copy6 = (x) => typeof x === "number" ? x : [Copy6(x[0]), Copy6(x[1]), -2];
  var get_n = (term, index) => {
    var subterm, i, a = Copy6(term), a1index = index.slice();
    for (i = 0; i < a1index.length; ) {
      if (a1index[i] === 0) {
        if (i === 0) {
          a = a[0];
        } else {
          subterm = extract2(a, a1index.slice(0, i - 1));
          subterm[a1index[i - 1]] = subterm[a1index[i - 1]][0];
        }
        a1index.splice(i, 1);
      } else i++;
    }
    if (a1index.length === 0) {
      a = 0;
    } else {
      subterm = extract2(a, a1index.slice(0, a1index.length - 1));
      subterm[a1index[a1index.length - 1]] = 0;
    }
    var scan = (x) => {
      if (typeof x === "number") return;
      if (typeof x[0] === "number") return;
      if (TON_noraise_compare(x[1], x[0][1]) > 0) x[0] = x[0][0];
      scan(x[0]);
      scan(x[1]);
    };
    scan(a);
    var alim = a;
    a = Copy6(term);
    var str1 = ("" + a).split(",").map((e) => +e), str2 = ("" + alim).split(",").map((e) => +e), a2 = [];
    while (str1.length && str2.length && str1[0] === str2[0]) {
      a2.push(str1[0]);
      str1.shift();
      str2.shift();
    }
    var n = 0;
    while (a2[a2.length - 1] === -2) a2.pop();
    if (a2[a2.length - 1] === -1) {
      ++n;
      a2.pop();
    } else {
      return n;
    }
    while (a2[a2.length - 1] === -2 && a2[a2.length - 2] === -1) {
      ++n;
      a2.splice(a2.length - 2, 2);
    }
    return n;
  };
  var BuiltQ5 = (a, b, n, x) => n ? TON_noraise_compare(x, 0) < 0 && BuiltQ5(x, b, n - 1, x) || (TON_noraise_compare(x, 0) >= 0 || TON_noraise_compare(x, a) <= 0) && (x === 0 || BuiltQ5(a, b, n, x[0]) && BuiltQ5(a, b, n, x[1])) : TON_noraise_compare(a, b) < 0;
  var StandardQ5 = (a) => {
    var str = JSON.stringify(a);
    if (IStd[str]) {
      return IStd[str];
    } else if (typeof a === "number" || StandardQ5(a[1]) && StandardQ5(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallindex(a[1]).every(
      (index) => BuiltQ5(extract2(a[1], index), a, get_n(a[1], index), extract2(a[1], index))
    )) {
      return IStd[str] = true;
    } else {
      return false;
    }
  };
  var TON_gen5 = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy6(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ5(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ5(beta)) {
        n = yield Copy6(beta);
        flag = false;
      }
    }
  };
  var TON_I = {
    id: "ton-i",
    name: "Iteration of n-built from below (no passthrough)",
    simple_name: "TON_I",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, [[0, [0, -1, -2], -2], 0, -2], -2];
        }
        var datakey = "" + term, dataterm = data11[datakey];
        if (!dataterm) {
          dataterm = data11[datakey] = [];
          dataterm.gen = TON_gen5(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, [-1, [0, [0, -1, -2], -2], -2], [-1, [0, 0, -2], -2], [-1, 0, -2], -1]
  };

  // src/notations/TON/TON_IBP.ts
  var data12 = {};
  var IBPStd = {};
  var extract3 = (term, index) => index.length ? extract3(term[index[0]], index.slice(1)) : term;
  var subterm_index = (a) => {
    var sow_subterms = (a2, begin) => {
      result.push(begin.slice());
      if (typeof a2 === "number") return;
      sow_subterms(a2[0], begin.concat(0));
      sow_subterms(a2[1], begin.concat(1));
    }, result = [];
    sow_subterms(a, []);
    return result;
  };
  var smallindex2 = (a) => {
    if (a === 0) return [];
    var sow_smallindex = (a2, begin) => {
      if (a2 === 0) return;
      if (TON_noraise_compare(a2, 0) < 0) {
        result.push(begin);
      } else {
        sow_smallindex(a2[0], begin.concat(0));
        sow_smallindex(a2[1], begin.concat(1));
      }
    }, result = [];
    sow_smallindex(a, []);
    return result;
  };
  var Copy7 = (x) => typeof x === "number" ? x : [Copy7(x[0]), Copy7(x[1]), -2];
  var get_a2 = (term, index) => {
    var subterm, i, a = Copy7(term), a1index = index.slice();
    for (i = 0; i < a1index.length; ) {
      if (a1index[i] === 0) {
        if (i === 0) {
          a = a[0];
        } else {
          subterm = extract3(a, a1index.slice(0, i - 1));
          subterm[a1index[i - 1]] = subterm[a1index[i - 1]][0];
        }
        a1index.splice(i, 1);
      } else i++;
    }
    if (a1index.length === 0) {
      a = 0;
    } else {
      subterm = extract3(a, a1index.slice(0, a1index.length - 1));
      subterm[a1index[a1index.length - 1]] = 0;
    }
    var scan = (x) => {
      if (typeof x === "number") return;
      if (typeof x[0] === "number") return;
      if (TON_noraise_compare(x[1], x[0][1]) > 0) x[0] = x[0][0];
      scan(x[0]);
      scan(x[1]);
    };
    scan(a);
    var alim = a;
    a = Copy7(term);
    var str1 = ("" + a).split(",").map((e) => +e), str2 = ("" + alim).split(",").map((e) => +e), a2 = [];
    while (str1.length && str2.length && str1[0] === str2[0]) {
      a2.push(str1[0]);
      str1.shift();
      str2.shift();
    }
    return a2;
  };
  var get_n2 = (a2) => {
    var n = 0;
    while (a2[a2.length - 1] === -2) a2.pop();
    if (a2[a2.length - 1] === -1) {
      ++n;
      a2.pop();
    } else {
      return n;
    }
    while (a2[a2.length - 1] === -2 && a2[a2.length - 2] === -1) {
      ++n;
      a2.splice(a2.length - 2, 2);
    }
    return n;
  };
  var BuiltQ6 = (a, b, c, n) => n ? subterm_index(a).every(
    (x) => TON_noraise_compare(extract3(a, x), a) <= 0 || TON_noraise_compare(extract3(a, x), 0) >= 0 || BuiltQ6(extract3(a, x), b, c, n - 1) || x.some((e, yindex) => {
      var z, y = x.slice(0, yindex);
      if (TON_noraise_compare(extract3(a, y), 0) >= 0) return false;
      if (BuiltQ6(extract3(a, y), b, c, n - 1)) return true;
      if (typeof extract3(a, y) === "number") return false;
      if (TON_noraise_compare(extract3(a, y)[1], c) >= 0) return false;
      for (var zindex = x.length; zindex >= yindex; --zindex) {
        z = x.slice(0, zindex);
        if (TON_noraise_compare(extract3(a, z), extract3(a, y)) < 0) return false;
      }
      return true;
    })
  ) : TON_noraise_compare(a, b) < 0;
  var StandardQ6 = (a) => {
    var str = JSON.stringify(a);
    if (IBPStd[str]) {
      return IBPStd[str];
    } else {
      var result = typeof a === "number" || StandardQ6(a[1]) && StandardQ6(a[0]) && (typeof a[0] === "number" || TON_noraise_compare(a[1], a[0][1]) <= 0) && smallindex2(a[1]).every((a1index) => {
        var a2 = get_a2(a[1], a1index);
        return BuiltQ6(extract3(a[1], a1index), a, a2, get_n2(a2));
      });
      return result ? IBPStd[str] = result : result;
    }
  };
  var TON_gen6 = function* (term) {
    var flag = true, c1, c3, n = 0, beta = Copy7(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], 0, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], 0, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ6(beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], 0, -2];
        } else {
          beta = [beta, 0, -2];
        }
      }
      if (StandardQ6(beta)) {
        n = yield Copy7(beta);
        flag = false;
      }
    }
  };
  var TON_IBP = {
    id: "ton-ibp",
    name: "Iteration of n-built from below",
    simple_name: "TON_IBP",
    category_id: "category-ton",
    display: TON_noraise_display,
    is_limit: TON_limit,
    compare: TON_noraise_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        if ("" + term === "Infinity") {
          term = [-1, [[0, [0, -1, -2], -2], 0, -2], -2];
        }
        var datakey = "" + term, dataterm = data12[datakey];
        if (!dataterm) {
          dataterm = data12[datakey] = [];
          dataterm.gen = TON_gen6(term);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, [-1, [0, [0, -1, -2], -2], -2], [-1, [0, 0, -2], -2], [-1, 0, -2], -1]
  };

  // src/notations/TON/TON_main.ts
  var data13 = {};
  var StdTrue = {};
  var mark = (sys) => {
    var res = [[-1, sys, -2], sys, -2];
    for (var i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var mark_FS = (sys, n) => {
    var i, res = sys - 1;
    for (i = 0; i < n; ++i) res = [sys - 1, res, -2];
    for (i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var BuiltQ7 = (n, b, a, x) => n ? BuiltQ7(n - 1, b, x, x) || TON_compare(x, a) <= 0 && (typeof x === "number" ? x >= 0 : BuiltQ7(n, b, a, x[1]) && BuiltQ7(n, b, a, x[0])) : TON_compare(a, b) < 0;
  var StandardQ7 = (n, a) => {
    var str = JSON.stringify(a);
    if (StdTrue[str]) {
      return StdTrue[str];
    } else if (typeof a === "number" || StandardQ7(n, a[1]) && StandardQ7(n, a[0]) && (typeof a[0] === "number" || TON_compare(a[1], a[0][1]) <= 0) && BuiltQ7(n, a, a[1], a[1])) {
      return StdTrue[str] = true;
    } else {
      return false;
    }
  };
  var Copy8 = (x) => typeof x === "number" ? x : [Copy8(x[0]), Copy8(x[1]), -2];
  var regress = (x) => typeof x === "number" ? x : x[0] === -1 && x[1] > 0 ? x[1] - 1 : [regress(x[0]), regress(x[1]), -2];
  var regress_repeated = (x) => {
    var x1;
    while ("" + (x1 = regress(x)) !== "" + x) x = x1;
    return x1;
  };
  var TON_gen7 = function* (term, sys) {
    var flag = true, c1, c3, n = 0, beta = Copy8(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], sys, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], sys, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ7(sys, beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], sys, -2];
        } else {
          beta = [beta, sys, -2];
        }
      }
      if (StandardQ7(sys, beta)) {
        n = yield regress_repeated(beta);
        flag = false;
      }
    }
  };
  var TON_main = {
    id: "ton-m",
    name: "Taranosvky's ordinal notation",
    simple_name: "TON",
    category_id: "category-ton",
    display: TON_main_display,
    is_limit: TON_limit,
    compare: TON_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        var i, res, sys = typeof term === "number" ? term : Math.max(0, ...("" + term).split(",").map(Number));
        if (sys === Infinity) {
          res = [n, n, -2];
          for (i = 0; i < n; ++i) res = [-1, res, -2];
          return res;
        }
        term = raise(term, sys);
        if (sys >= 1 && "" + term === "" + mark(sys)) return mark_FS(sys, n);
        var datakey = "" + term, dataterm = data13[datakey];
        if (!dataterm) {
          dataterm = data13[datakey] = [];
          dataterm.gen = TON_gen7(term, sys);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, 0, -1]
  };

  // src/notations/TON/TON_MC.ts
  var data14 = {};
  var MCStd = {};
  var mark2 = (sys) => {
    var res = sys;
    for (var i = sys; i > 0; i--) res = [[-1, sys, -2], res, -2];
    for (i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var mark_FS2 = (sys, n) => {
    var i, res = sys - 1;
    for (i = 0; i < n; ++i) res = [sys - 1, res, -2];
    for (i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var extract4 = (term, index) => index.length ? extract4(term[index[0]], index.slice(1)) : term;
  var subterm_index2 = (a) => {
    var sow_subterms = (a2, begin) => {
      result.push(begin.slice());
      if (typeof a2 === "number") return;
      sow_subterms(a2[0], begin.concat(0));
      sow_subterms(a2[1], begin.concat(1));
    }, result = [];
    sow_subterms(a, []);
    return result;
  };
  var BuiltQ8 = (a, b, n) => {
    if (!(n > 0)) return TON_compare(a, b) < 0;
    var extractparent = (x) => x.length ? extract4(a, x.slice(0, x.length - 1)) : b, refresh_totest = (d, e) => {
      if (typeof extract4(a, d) === "number" || TON_compare(extract4(a, d), extractparent(e)) < 0) return;
      totest.push(d);
      refresh_totest(d.concat(0), e);
      refresh_totest(d.concat(1), e);
    }, totest = [];
    return subterm_index2(a).every((x) => {
      if (TON_compare(r(extract4(a, x), extractparent(x)), r(a, b)) <= 0) return true;
      if (x.some((t, zindex) => TON_compare(extract4(a, x.slice(0, zindex)), b) < 0)) return true;
      totest = [];
      refresh_totest(x, x);
      for (var y = x.slice(); y.length > 0; y.pop()) {
        if (x.slice(y.length).every(
          (t, dz) => TON_compare(extract4(a, x.slice(0, y.length + dz)), extractparent(y)) >= 0
        ) && totest.every((z) => TON_compare(extract4(a, z), extractparent(y)) >= 0) && BuiltQ8(extract4(a, y), extractparent(y), n - 1))
          return true;
      }
      return false;
    });
  };
  var StandardQ8 = (n, a) => {
    var str = JSON.stringify(a);
    if (MCStd[str]) {
      return MCStd[str];
    } else if (typeof a === "number" || StandardQ8(n, a[1]) && StandardQ8(n, a[0]) && (typeof a[0] === "number" || TON_compare(a[1], a[0][1]) <= 0) && BuiltQ8(a[1], a, n)) {
      return MCStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy9 = (x) => typeof x === "number" ? x : [Copy9(x[0]), Copy9(x[1]), -2];
  var regress2 = (x) => typeof x === "number" ? x : x[0] === -1 && x[1] > 0 ? x[1] - 1 : [regress2(x[0]), regress2(x[1]), -2];
  var regress_repeated2 = (x) => {
    var x1;
    while ("" + (x1 = regress2(x)) !== "" + x) x = x1;
    return x1;
  };
  var TON_gen8 = function* (term, sys) {
    var flag = true, c1, c3, n = 0, beta = Copy9(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], sys, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], sys, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ8(sys, beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], sys, -2];
        } else {
          beta = [beta, sys, -2];
        }
      }
      if (StandardQ8(sys, beta)) {
        n = yield regress_repeated2(beta);
        flag = false;
      }
    }
  };
  var TON_MC = {
    id: "ton-mc",
    name: "TON (reflection configuration) without passthrough",
    simple_name: "TON_MC",
    category_id: "category-ton",
    display: TON_main_display,
    is_limit: TON_limit,
    compare: TON_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        var i, res, sys = typeof term === "number" ? term : Math.max(0, ...("" + term).split(",").map(Number));
        if (sys === Infinity) {
          res = [n, n, -2];
          for (i = 0; i < n; ++i) res = [-1, res, -2];
          return res;
        }
        term = raise(term, sys);
        if (sys >= 1 && "" + term === "" + mark2(sys)) return mark_FS2(sys, n);
        var datakey = "" + term, dataterm = data14[datakey];
        if (!dataterm) {
          dataterm = data14[datakey] = [];
          dataterm.gen = TON_gen8(term, sys);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, 0, -1]
  };

  // src/notations/TON/TON_MPC.ts
  var data15 = {};
  var MPCStd = {};
  var mark3 = (sys) => {
    var res = sys;
    for (var i = sys; i > 0; i--) res = [[-1, sys, -2], res, -2];
    for (i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var mark_FS3 = (sys, n) => {
    var i, res = sys - 1;
    for (i = 0; i < n; ++i) res = [sys - 1, res, -2];
    for (i = sys - 1; i > 0; i--) res = [-1, res, -2];
    return res;
  };
  var extract5 = (term, index) => index.length ? extract5(term[index[0]], index.slice(1)) : term;
  var subterm_index3 = (a) => {
    var sow_subterms = (a2, begin) => {
      result.push(begin.slice());
      if (typeof a2 === "number") return;
      sow_subterms(a2[0], begin.concat(0));
      sow_subterms(a2[1], begin.concat(1));
    }, result = [];
    sow_subterms(a, []);
    return result;
  };
  var BuiltQ9 = (a, b, rc, n) => {
    if (!(n > 0)) return TON_compare(a, b) < 0;
    var extractparent = (x) => x.length ? extract5(a, x.slice(0, x.length - 1)) : b, refresh_totest = (d, e) => {
      if (typeof extract5(a, d) === "number" || TON_compare(extract5(a, d), extractparent(e)) < 0) return;
      totest.push(d);
      refresh_totest(d.concat(0), e);
      refresh_totest(d.concat(1), e);
    }, totest = [];
    return subterm_index3(a).every((x) => {
      if (TON_compare(r(extract5(a, x), extractparent(x)), r(a, b)) <= 0) return true;
      if (x.some((t, zindex) => TON_compare(extract5(a, x.slice(0, zindex)), b) < 0)) return true;
      totest = [];
      refresh_totest(x, x);
      for (var y = x.slice(); y.length > 0; y.pop()) {
        if (x.slice(y.length).every(
          (t, dz) => TON_compare(extract5(a, x.slice(0, y.length + dz)), extractparent(y)) >= 0
        ) && totest.every((z) => TON_compare(extract5(a, z), extractparent(y)) >= 0) && (TON_compare(r(extract5(a, y), extractparent(y)), rc) < 0 || BuiltQ9(extract5(a, y), extractparent(y), rc, n - 1)))
          return true;
      }
      return false;
    });
  };
  var StandardQ9 = (n, a) => {
    var str = JSON.stringify(a);
    if (MPCStd[str]) {
      return MPCStd[str];
    } else if (typeof a === "number" || StandardQ9(n, a[1]) && StandardQ9(n, a[0]) && (typeof a[0] === "number" || TON_compare(a[1], a[0][1]) <= 0) && BuiltQ9(a[1], a, r(a[1], a), n)) {
      return MPCStd[str] = true;
    } else {
      return false;
    }
  };
  var Copy10 = (x) => typeof x === "number" ? x : [Copy10(x[0]), Copy10(x[1]), -2];
  var regress3 = (x) => typeof x === "number" ? x : x[0] === -1 && x[1] > 0 ? x[1] - 1 : [regress3(x[0]), regress3(x[1]), -2];
  var regress_repeated3 = (x) => {
    var x1;
    while ("" + (x1 = regress3(x)) !== "" + x) x = x1;
    return x1;
  };
  var TON_gen9 = function* (term, sys) {
    var flag = true, c1, c3, n = 0, beta = Copy10(term), len = ("" + term).split(",").length;
    mainloop: while (true) {
      if (flag) {
        if (typeof beta === "number" && beta >= 0) {
          beta = -1;
        } else if (beta[1] === -1) {
          beta = beta[0];
          continue;
        } else if (typeof beta[1] === "number" && beta[1] >= 0) {
          beta[1] = -1;
        } else if (beta[1][1] === -1) {
          beta = [[beta[0], beta[1][0], -2], sys, -2];
        } else if (typeof beta[1][1] === "number" && beta[1][1] >= 0) {
          beta[1][1] = -1;
        } else {
          c3 = beta;
          c1 = beta[1][1];
          while (typeof c1[1] !== "number") {
            c3 = c3[1];
            c1 = c1[1];
          }
          if (c1[1] === -1) {
            c3[1] = [[c3[1][0], c1[0], -2], sys, -2];
          } else {
            c1[1] = -1;
          }
        }
      }
      flag = true;
      while (("" + beta).split(",").length < len + n * 2) {
        if (!StandardQ9(sys, beta)) continue mainloop;
        if (typeof beta !== "number") {
          c1 = beta;
          while (typeof c1[1] !== "number") c1 = c1[1];
          c1[1] = [c1[1], sys, -2];
        } else {
          beta = [beta, sys, -2];
        }
      }
      if (StandardQ9(sys, beta)) {
        n = yield regress_repeated3(beta);
        flag = false;
      }
    }
  };
  var TON_MPC = {
    id: "ton-mpc",
    name: "TON with passthrough (reflection configuration)",
    simple_name: "TON_MPC",
    category_id: "category-ton",
    display: TON_main_display,
    is_limit: TON_limit,
    compare: TON_compare,
    FS: /* @__PURE__ */ (() => {
      return (term, n) => {
        var i, res, sys = typeof term === "number" ? term : Math.max(0, ...("" + term).split(",").map(Number));
        if (sys === Infinity) {
          res = [n, n, -2];
          for (i = 0; i < n; ++i) res = [-1, res, -2];
          return res;
        }
        term = raise(term, sys);
        if (sys >= 1 && "" + term === "" + mark3(sys)) return mark_FS3(sys, n);
        var datakey = "" + term, dataterm = data15[datakey];
        if (!dataterm) {
          dataterm = data15[datakey] = [];
          dataterm.gen = TON_gen9(term, sys);
          dataterm[0] = dataterm.gen.next().value;
        }
        if (dataterm[n] !== void 0) return dataterm[n];
        return dataterm[n] = dataterm.gen.next(n).value;
      };
    })(),
    credit_text_id: "credit.ton",
    init: () => [Infinity, 0, -1]
  };

  // src/notations/aSAN/asan_helpers.ts
  var aSAN_compare = (a, b) => {
    if (typeof a === "number") {
      if (typeof b === "number") return a > b ? 1 : a < b ? -1 : 0;
      a = [a];
    }
    if (typeof b === "number") b = [b];
    if (a.length > b.length) return 1;
    if (a.length < b.length) return -1;
    var tmp, k;
    for (k = a.length; k--; ) {
      tmp = aSAN_compare(a[k], b[k]);
      if (tmp !== 0) return tmp;
    }
    return 0;
  };
  var aSAN_display = (a) => typeof a === "number" ? "" + a : "" + a === "1,Infinity" ? "Limit" : "(" + a.map(aSAN_display).join() + ")";
  var aSAN_base = (A) => typeof A === "number" ? A : aSAN_base(A[0]);
  var aSAN_able = (a) => typeof a !== "number" && aSAN_base(a) === 1;
  var aSAN_semiable = (a) => a !== 1;

  // src/notations/aSAN/aSAN.ts
  var data16 = {};
  var Copy11 = (a) => typeof a === "number" ? a : a.map(Copy11);
  var pilot = (A) => {
    if (typeof A === "number") return A;
    for (var b = 0; b < A.length; ++b) {
      if (A[b] !== 1) return A[b];
    }
  };
  var pre = (A) => {
    if (typeof A === "number") return A - 1;
    var e = A.slice();
    e.unshift(pre(e.shift()));
    return e;
  };
  var change3 = (A, n) => {
    var b, e = A.slice();
    for (b = 0; b < e.length; ++b) {
      if (e[b] !== 1) {
        b ? e.splice(b - 1, 2, n, pre(e[b])) : e.splice(b, 1, pre(e[b]));
        return e;
      }
    }
  };
  var layers = (A) => {
    var Lk, L3 = [A];
    while (true) {
      Lk = pilot(L3[L3.length - 1]);
      if (aSAN_base(Lk) > 1) break;
      L3.push(Lk);
    }
    return L3;
  };
  var changeL = (L3, a, b) => {
    if (a === L3.length - 1) return change3(L3[a], b);
    var x = L3[a].indexOf(L3[a + 1]), La = Copy11(L3[a]);
    La[x] = changeL(L3, a + 1, b);
    return La;
  };
  var search = (L3) => {
    var n = L3.length - 1;
    for (var a = n; --a >= 0 && aSAN_compare(L3[n], L3[a]) <= 0; ) ;
    return a + 1;
  };
  var Standard = (A) => {
    if (typeof A === "number") return A;
    if (A.length === 1) {
      if (typeof A[0] === "number") return A[0];
      if (A[0].length === 1) return Standard(A[0]);
    }
    if (A[A.length - 1] === 1) return Standard(A.slice(0, A.length - 1));
    return A.map(Standard);
  };
  var aSAN_FS = (A, FSterm) => {
    var L3 = layers(Copy11(A)), m = search(L3), f = (n2) => changeL(L3, m, n2), result = FSterm + 1;
    for (var n = FSterm; n--; ) {
      result = f(result);
    }
    if (m > 0) {
      L3[m - 1][L3[m - 1].indexOf(L3[m])] = result;
      result = L3[0];
    }
    var std;
    while (JSON.stringify(std = Standard(result)) !== JSON.stringify(result)) result = std;
    return result;
  };
  var aSAN = {
    id: "asan-1",
    name: "Aarex's superstrong array notation",
    simple_name: "aSAN-1",
    category_id: "category-asan",
    display: aSAN_display,
    is_limit: aSAN_able,
    compare: aSAN_compare,
    FS: (A, FSterm) => {
      if (!aSAN_semiable(A)) return A;
      if ("" + A === "1,Infinity") return FSterm ? Array(FSterm).fill(1).concat(2) : 2;
      if (aSAN_base(A) > 1) return pre(A);
      var key = aSAN_display(A);
      if (!data16[key]) data16[key] = [];
      else if (data16[key][FSterm] !== void 0) return data16[key][FSterm];
      return data16[key][FSterm] = aSAN_FS(A, FSterm);
    },
    credit_text_id: "credit.asan",
    init: () => [[1, Infinity], 1]
  };

  // src/notations/aSAN/aSAN2.ts
  var data17 = {};
  var Copy12 = (a) => typeof a === "number" ? a : a.map(Copy12);
  var pilot2 = (A) => {
    if (typeof A === "number") return A;
    for (var b = 0; b < A.length; ++b) {
      if (A[b] !== 1) return A[b];
    }
  };
  var pre2 = (A) => {
    if (typeof A === "number") return A - 1;
    var e = A.slice();
    e.unshift(pre2(e.shift()));
    return e;
  };
  var change4 = (A, n) => {
    var b, e = A.slice();
    for (b = 0; b < e.length; ++b) {
      if (e[b] !== 1) {
        b ? e.splice(b - 1, 2, n, pre2(e[b])) : e.splice(b, 1, pre2(e[b]));
        return e;
      }
    }
  };
  var layers2 = (A) => {
    var Lk, L3 = [A];
    while (true) {
      Lk = pilot2(L3[L3.length - 1]);
      if (aSAN_base(Lk) > 1) break;
      L3.push(Lk);
    }
    return L3;
  };
  var changeL2 = (L3, a, b) => {
    if (a === L3.length - 1) return change4(L3[a], b);
    var x = L3[a].indexOf(L3[a + 1]), La = Copy12(L3[a]);
    La[x] = changeL2(L3, a + 1, b);
    return La;
  };
  var trans = (L3) => {
    var n = L3.length - 1, Transcenders = [];
    for (var k = 1; k <= n; ++k) {
      if (L3[k - 1][0] !== L3[k] && aSAN_compare(L3[k - 1], L3[k]) > 0) Transcenders.push(k - 1);
    }
    return Transcenders;
  };
  var search2 = (L3) => {
    var T = trans(L3), n = L3.length - 1;
    for (var a = n; --a >= 0 && aSAN_compare(L3[n], L3[a]) <= 0; ) ;
    var t = Math.max(...T);
    if (t >= 0 && t >= a) {
      for (var u = T.length; --u >= 0 && !(aSAN_compare(L3[t], L3[T[u]]) > 0); ) ;
      if (u >= 0) {
        for (var v = T[u]; v <= t; ++v) {
          if (aSAN_compare(L3[v], L3[t]) >= 0) return v;
        }
      } else {
        return 0;
      }
    } else if (a >= 0) {
      return a + 1;
    } else {
      return 0;
    }
  };
  var Standard2 = (A) => {
    if (typeof A === "number") return A;
    if (A.length === 1) {
      if (typeof A[0] === "number") return A[0];
      if (A[0].length === 1) return Standard2(A[0]);
    }
    if (A[A.length - 1] === 1) return Standard2(A.slice(0, A.length - 1));
    return A.map(Standard2);
  };
  var aSAN_FS2 = (A, FSterm) => {
    var L3 = layers2(Copy12(A)), m = search2(L3), f = (n2) => changeL2(L3, m, n2), result = FSterm + 1;
    for (var n = FSterm; n--; ) {
      result = f(result);
    }
    if (m > 0) {
      L3[m - 1][L3[m - 1].indexOf(L3[m])] = result;
      result = L3[0];
    }
    var std;
    while (JSON.stringify(std = Standard2(result)) !== JSON.stringify(result)) result = std;
    return result;
  };
  var aSAN2 = {
    id: "asan-2",
    name: "aSAN-2",
    simple_name: "aSAN-2",
    category_id: "category-asan",
    display: aSAN_display,
    is_limit: aSAN_able,
    compare: aSAN_compare,
    FS: (A, FSterm) => {
      if (!aSAN_semiable(A)) return A;
      if ("" + A === "1,Infinity") return FSterm ? Array(FSterm).fill(1).concat(2) : 2;
      if (aSAN_base(A) > 1) return pre2(A);
      var key = aSAN_display(A);
      if (!data17[key]) data17[key] = [];
      else if (data17[key][FSterm] !== void 0) return data17[key][FSterm];
      return data17[key][FSterm] = aSAN_FS2(A, FSterm);
    },
    credit_text_id: "credit.asan",
    init: () => [[1, Infinity], 1]
  };

  // src/notations/aSAN/aSAN3.ts
  var data18 = {};
  var Copy13 = (a) => typeof a === "number" ? a : a.map(Copy13);
  var pilot3 = (A) => {
    if (typeof A === "number") return A;
    for (var b = 0; b < A.length; ++b) {
      if (A[b] !== 1) return A[b];
    }
  };
  var pre3 = (A) => {
    if (typeof A === "number") return A - 1;
    var e = A.slice();
    e.unshift(pre3(e.shift()));
    return e;
  };
  var change5 = (A, n) => {
    var b, e = A.slice();
    for (b = 0; b < e.length; ++b) {
      if (e[b] !== 1) {
        b ? e.splice(b - 1, 2, n, pre3(e[b])) : e.splice(b, 1, pre3(e[b]));
        return e;
      }
    }
  };
  var layers3 = (A) => {
    var Lk, L3 = [A];
    while (true) {
      Lk = pilot3(L3[L3.length - 1]);
      if (aSAN_base(Lk) > 1) break;
      L3.push(Lk);
    }
    return L3;
  };
  var changeL3 = (L3, a, b) => {
    if (a === L3.length - 1) return change5(L3[a], b);
    var x = L3[a].indexOf(L3[a + 1]), La = Copy13(L3[a]);
    La[x] = changeL3(L3, a + 1, b);
    return La;
  };
  var trans2 = (L3) => {
    var n = L3.length - 1, Trans = 0, Transcenders = [];
    for (var k = 1; k <= n; ++k) {
      if (Trans) {
        if (aSAN_compare(L3[n], L3[k]) > 0) Trans = 0;
      } else {
        if (L3[k - 1][0] !== L3[k] && aSAN_compare(L3[k - 1], L3[k]) > 0) {
          Transcenders.push(k - 1);
          Trans = 1;
        }
      }
    }
    return Transcenders;
  };
  var search3 = (L3) => {
    var T = trans2(L3), n = L3.length - 1;
    for (var a = n; --a >= 0 && aSAN_compare(L3[n], L3[a]) <= 0; ) ;
    var t = Math.max(...T);
    if (t >= 0 && t >= a) {
      for (var u = T.length; --u >= 0 && !(aSAN_compare(L3[t], L3[T[u]]) > 0); ) ;
      if (u >= 0) {
        for (var v = T[u]; v <= t; ++v) {
          if (aSAN_compare(L3[v], L3[t]) >= 0) return v;
        }
      } else {
        return 0;
      }
    } else if (a >= 0) {
      return a + 1;
    } else {
      return 0;
    }
  };
  var Standard3 = (A) => {
    if (typeof A === "number") return A;
    if (A.length === 1) {
      if (typeof A[0] === "number") return A[0];
      if (A[0].length === 1) return Standard3(A[0]);
    }
    if (A[A.length - 1] === 1) return Standard3(A.slice(0, A.length - 1));
    return A.map(Standard3);
  };
  var aSAN_FS3 = (A, FSterm) => {
    var L3 = layers3(Copy13(A)), m = search3(L3), f = (n2) => changeL3(L3, m, n2), result = FSterm + 1;
    for (var n = FSterm; n--; ) {
      result = f(result);
    }
    if (m > 0) {
      L3[m - 1][L3[m - 1].indexOf(L3[m])] = result;
      result = L3[0];
    }
    var std;
    while (JSON.stringify(std = Standard3(result)) !== JSON.stringify(result)) result = std;
    return result;
  };
  var aSAN3 = {
    id: "asan-3",
    name: "aSAN-3",
    simple_name: "aSAN-3",
    category_id: "category-asan",
    display: aSAN_display,
    is_limit: aSAN_able,
    compare: aSAN_compare,
    FS: (A, FSterm) => {
      if (!aSAN_semiable(A)) return A;
      if ("" + A === "1,Infinity") return FSterm ? Array(FSterm).fill(1).concat(2) : 2;
      if (aSAN_base(A) > 1) return pre3(A);
      var key = aSAN_display(A);
      if (!data18[key]) data18[key] = [];
      else if (data18[key][FSterm] !== void 0) return data18[key][FSterm];
      return data18[key][FSterm] = aSAN_FS3(A, FSterm);
    },
    credit_text_id: "credit.asan",
    init: () => [[1, Infinity], 1]
  };

  // src/notations/aSAN/aSAN_tilde3plus.ts
  var data19 = {};
  var Copy14 = (a) => typeof a === "number" ? a : a.map(Copy14);
  var pilot4 = (A) => {
    if (typeof A === "number") return A;
    for (var b = 0; b < A.length; ++b) {
      if (A[b] !== 1) return A[b];
    }
  };
  var pre4 = (A) => {
    if (typeof A === "number") return A - 1;
    var e = A.slice();
    e.unshift(pre4(e.shift()));
    return e;
  };
  var change6 = (A, n) => {
    var b, e = A.slice();
    for (b = 0; b < e.length; ++b) {
      if (e[b] !== 1) {
        b ? e.splice(b - 1, 2, n, pre4(e[b])) : e.splice(b, 1, pre4(e[b]));
        return e;
      }
    }
  };
  var layers4 = (A) => {
    var Lk, L3 = [A];
    while (true) {
      Lk = pilot4(L3[L3.length - 1]);
      if (aSAN_base(Lk) > 1) break;
      L3.push(Lk);
    }
    return L3;
  };
  var changeL4 = (L3, a, b) => {
    if (a === L3.length - 1) return change6(L3[a], b);
    var x = L3[a].indexOf(L3[a + 1]), La = Copy14(L3[a]);
    La[x] = changeL4(L3, a + 1, b);
    return La;
  };
  var trans3 = (L3) => {
    var n = L3.length - 1, Trans = 0, Transcenders = {};
    for (var k = 1; k <= n; ++k) {
      if (!Trans && L3[k - 1][0] !== L3[k]) {
        Transcenders[k - 1] = true;
        Trans = 1;
      }
      if (Trans && aSAN_compare(L3[n], L3[k]) > 0) Trans = 0;
    }
    return Transcenders;
  };
  var search4 = (L3) => {
    var T = trans3(L3), k = L3.length - 1, N = L3[k], o = k, M = N, Trans = 0;
    while (k--) {
      if (aSAN_compare(L3[k], M) > 0) o = k;
      if (!Trans) {
        if (T[k]) {
          if (aSAN_compare(M, L3[k]) > 0 && aSAN_compare(L3[k], L3[k + 1]) > 0) return o;
          o = k;
          M = L3[k];
          Trans = 1;
        }
        if (N[1] === 1 && k > 0) continue;
      }
      if (Trans && !T[k]) continue;
      if (aSAN_compare(M, L3[k]) > 0) return o;
    }
    return 0;
  };
  var Standard4 = (A) => {
    if (typeof A === "number") return A;
    if (A.length === 1) {
      if (typeof A[0] === "number") return A[0];
      if (A[0].length === 1) return Standard4(A[0]);
    }
    if (A[A.length - 1] === 1) return Standard4(A.slice(0, A.length - 1));
    return A.map(Standard4);
  };
  var aSAN_FS4 = (A, FSterm) => {
    var L3 = layers4(Copy14(A)), m = search4(L3), f = (n2) => changeL4(L3, m, n2), result = FSterm + 1;
    for (var n = FSterm; n--; ) {
      result = f(result);
    }
    if (m > 0) {
      L3[m - 1][L3[m - 1].indexOf(L3[m])] = result;
      result = L3[0];
    }
    var std;
    while (JSON.stringify(std = Standard4(result)) !== JSON.stringify(result)) result = std;
    return result;
  };
  var aSAN_tilde3plus = {
    id: "asan-tilde3plus",
    name: "aSAN~3+",
    simple_name: "aSAN~3+",
    category_id: "category-asan",
    display: aSAN_display,
    is_limit: aSAN_able,
    compare: aSAN_compare,
    FS: (A, FSterm) => {
      if (!aSAN_semiable(A)) return A;
      if ("" + A === "1,Infinity") return FSterm ? Array(FSterm).fill(1).concat(2) : 2;
      if (aSAN_base(A) > 1) return pre4(A);
      var key = aSAN_display(A);
      if (!data19[key]) data19[key] = [];
      else if (data19[key][FSterm] !== void 0) return data19[key][FSterm];
      return data19[key][FSterm] = aSAN_FS4(A, FSterm);
    },
    credit_text_id: "credit.asan",
    init: () => [[1, Infinity], 1]
  };

  // src/notations/OCN/categories.ts
  var category_ocf = {
    id: "category-ocf",
    name: "Ordinal Collapsing Function",
    simple_name: "OCF"
  };
  var category_ocn = {
    id: "category-ocn",
    name: "OCF-like notation",
    simple_name: "OCN"
  };

  // src/notations/Y/categories.ts
  var category_y = {
    id: "category-y",
    name: "Y sequence",
    simple_name: "Y"
  };

  // src/notations/BM-like/categories.ts
  var category_bm_like = {
    id: "category-bm-like",
    name: "Bashicu Matrix-like notation",
    simple_name: "BM-like"
  };
  var category_minus1_y_nss_series = {
    id: "category-minus1-y-nss-series",
    name: "-1Y-nSS Series",
    simple_name: "-1Y-nSS Series",
    parent_id: "category-bm-like"
  };

  // src/notations/MN/categories.ts
  var category_mn = {
    id: "category-mn",
    name: "Mountain Notation",
    simple_name: "MN"
  };
  var category_hypcos_w2mn = {
    id: "category-hypcos-w2mn",
    name: "HypCos's \u03C92MN",
    simple_name: "HypCos",
    parent_id: "category-mn"
  };

  // src/notations/SMN/categories.ts
  var category_smile_mn = {
    id: "category-smile-mn",
    name: "Smile's \u03C92+MN",
    simple_name: "Smile",
    parent_id: "category-mn"
  };

  // src/notations/DEN/categories.ts
  var category_den = {
    id: "category-den",
    name: "Defective Embedding Notation",
    simple_name: "DEN"
  };

  // src/notations/TON/categories.ts
  var category_ton = {
    id: "category-ton",
    name: "Taranosvky's ordinal notation",
    simple_name: "TON"
  };

  // src/notations/aSAN/categories.ts
  var category_asan = {
    id: "category-asan",
    name: "Aarex's Superstrong Array Notation",
    simple_name: "aSAN"
  };

  // notation-explorer-smilelee-entry.ts
  var REPOSITORY = "https://github.com/SmileLee-lyx/ne-rewritten";
  var COMMIT = "5413a94f0c5b6b56b4c13a91a8acf3a794698bb9";
  var EXPECTED_NOTATION_COUNT = 105;
  var EXPECTED_DIRECT_COUNT = 73;
  var EXPECTED_GENERATED_COUNT = 32;
  var directNotations = [
    omega,
    VeblenPhi,
    BOCF_EBO,
    MOCF_EBO,
    NOCF_EBO,
    Inacc_OCF,
    finite_Mahlo_OCF,
    Minus1_Y,
    T_Minus1_Y,
    seq_0Y,
    Y_seq,
    omega_Y_weak,
    omega_Y_actual,
    omega_Y_medium,
    omega_Y_strong,
    BM4,
    TBM,
    CMS,
    BHM,
    BSM,
    BLM,
    UPMS,
    LPMS,
    LPTSS,
    wMM,
    DSM,
    WSMv1_4_1,
    BTBM,
    ...GMS_notations,
    omega_MN,
    T_omega_MN,
    A_omega2_MN2,
    wA_omega2_MN2,
    A_omega2_MN3,
    wA_omega2_MN3,
    SA_omega2_MN,
    S_omega2_MN,
    S_omega_pow_omega_MN,
    DEN,
    DEN2,
    DEN3,
    LMN,
    LON,
    UPS1_1r5,
    cOCF,
    n_shifted_psi,
    TON_DRC,
    TON_DRP,
    TON_DoR,
    TON_DRPC,
    TON_I,
    TON_IBP,
    TON_main,
    TON_MC,
    TON_MPC,
    aSAN,
    aSAN2,
    aSAN3,
    aSAN_tilde3plus
  ];
  var generatorCategories = [
    category_partial_UPMS,
    category_bm_minus1_y_nss,
    category_bm_t_minus1_y_nss,
    category_bm_bt_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss1,
    category_bm_btl_minus1_y_nss,
    ...GMS_categories.filter((category) => category.generator !== void 0),
    category_n_mn
  ];
  var allCategories = [
    category_ocf,
    category_y,
    category_y_omega,
    category_bm_like,
    category_partial_UPMS,
    category_minus1_y_nss_series,
    category_bm_minus1_y_nss,
    category_bm_t_minus1_y_nss,
    category_bm_bt_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss1,
    category_bm_btl_minus1_y_nss,
    ...GMS_categories,
    category_mn,
    category_n_mn,
    category_hypcos_w2mn,
    category_smile_mn,
    category_den,
    category_ocn,
    category_ton,
    category_asan
  ];
  function materializeGenerator(category) {
    const generator = category.generator;
    if (!generator) return [];
    const result = [];
    for (let index = generator.start; index <= generator.initial; index++) {
      result.push(generator.create(index));
    }
    return result;
  }
  var generatedNotations = generatorCategories.flatMap(materializeGenerator);
  var notations = [...directNotations, ...generatedNotations];
  var notationsById = /* @__PURE__ */ Object.create(null);
  for (const notation of notations) {
    if (!notation || typeof notation.id !== "string" || notation.id.length === 0) {
      throw new Error("SmileLee notation bundle contains an invalid notation definition.");
    }
    if (notationsById[notation.id]) {
      throw new Error(`SmileLee notation bundle contains duplicate id '${notation.id}'.`);
    }
    notationsById[notation.id] = notation;
  }
  if (directNotations.length !== EXPECTED_DIRECT_COUNT || generatedNotations.length !== EXPECTED_GENERATED_COUNT || notations.length !== EXPECTED_NOTATION_COUNT) {
    throw new Error(
      `SmileLee notation bundle inventory changed: ${directNotations.length} direct + ${generatedNotations.length} generated = ${notations.length}; expected ${EXPECTED_DIRECT_COUNT} + ${EXPECTED_GENERATED_COUNT} = ${EXPECTED_NOTATION_COUNT}.`
    );
  }
  function validateGeneratorIndex(categoryId, index, start) {
    if (!Number.isSafeInteger(index)) {
      throw new TypeError(`Generator index for '${categoryId}' must be a safe integer.`);
    }
    if (index < start) {
      throw new RangeError(`Generator index for '${categoryId}' must be at least ${start}; received ${index}.`);
    }
  }
  function validateGeneratedNotation(categoryId, index, notation) {
    if (!notation || typeof notation !== "object" || typeof notation.id !== "string" || notation.id.length === 0) {
      throw new Error(`Generator '${categoryId}' returned an invalid notation for index ${index}.`);
    }
    if (notation.category_id !== categoryId) {
      throw new Error(
        `Generator '${categoryId}' returned notation '${notation.id}' in category '${notation.category_id}'.`
      );
    }
    return notation;
  }
  var categories = allCategories.map((category) => {
    const generator = category.generator;
    return Object.freeze({
      id: category.id,
      name: category.name,
      simple_name: category.simple_name,
      parent_id: category.parent_id,
      generator: generator ? Object.freeze({
        start: generator.start,
        initial: generator.initial,
        create(index) {
          validateGeneratorIndex(category.id, index, generator.start);
          return validateGeneratedNotation(category.id, index, generator.create(index));
        }
      }) : void 0
    });
  });
  var categoriesById = /* @__PURE__ */ Object.create(null);
  for (const category of categories) {
    if (categoriesById[category.id]) {
      throw new Error(`SmileLee notation bundle contains duplicate category id '${category.id}'.`);
    }
    categoriesById[category.id] = category;
  }
  var generatorCategoryIds = categories.filter((category) => category.generator !== void 0).map((category) => category.id);
  function createGeneratedNotation(categoryId, index) {
    if (typeof categoryId !== "string" || categoryId.length === 0) {
      throw new TypeError("Generator category id must be a non-empty string.");
    }
    const category = categoriesById[categoryId];
    if (!category) throw new Error(`Unknown SmileLee notation category '${categoryId}'.`);
    if (!category.generator) throw new Error(`SmileLee notation category '${categoryId}' is not generated.`);
    return category.generator.create(index);
  }
  var credits = {
    "credit.bashicu": {
      zh: "\u7531 Bashicu Hyudora \u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE.",
      en: "Defined by Bashicu Hyudora; expander from the original NE project."
    },
    "credit.tbm": { zh: "\u7531\u793E\u533A\u5B9A\u4E49.", en: "Defined by the community." },
    "credit.yukito": {
      zh: "\u7531 Yukito \u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE, \u6700\u521D\u7531 Yukito \u7ED9\u51FA; \u5C71\u8109\u56FE\u7ED8\u5236\u7531 Yukito \u7ED9\u51FA.",
      en: "Defined by Yukito; expander from the original NE project, originally by Yukito; mountain diagram by Yukito."
    },
    "credit.den": {
      zh: "\u7531 Hypcos \u57FA\u4E8E test_alpha0 \u5B9A\u4E49\u7684 BLP \u4F5C\u51FA\u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE; \u53EF\u89C6\u5316\u65B9\u6848\u7531 test_alpha0 \u7ED9\u51FA.",
      en: "Defined by Hypcos based on BLP by test_alpha0; expander from the original NE project; visualization by test_alpha0."
    },
    "credit.den23": {
      zh: "\u7531 test_alpha0 \u57FA\u4E8E DEN \u4F5C\u51FA\u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE; \u53EF\u89C6\u5316\u65B9\u6848\u7531 test_alpha0 \u7ED9\u51FA.",
      en: "Defined by test_alpha0 based on DEN; expander from the original NE project; visualization by test_alpha0."
    },
    "credit.btbm": {
      zh: "\u7531 Bubby3 \u6700\u521D\u63D0\u51FA\u8BBE\u60F3, \u7531\u793E\u533A\u5B8C\u5584. \u7B11\u59D0\u59D0 \u57FA\u4E8E\u4E0E Asheep233 \u7684\u8BA8\u8BBA\u7ED9\u51FA\u5C55\u5F00\u5668.",
      en: "Originally conceived by Bubby3, refined by the community. Expander by \u7B11\u59D0\u59D0 (Smile Lee) based on discussions with Asheep233."
    },
    "credit.hypcos_mn": {
      zh: "\u7531 Hypcos \u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE.",
      en: "Defined by Hypcos; expander from the original NE project."
    },
    "credit.n_mn": {
      zh: "\u7531 \u7B11\u59D0\u59D0 \u57FA\u4E8E Hypcos \u7684 MN \u7CFB\u5217\u4F5C\u51FA\u5B9A\u4E49, \u5E76\u7ED9\u51FA\u5C55\u5F00\u5668.",
      en: "Defined by \u7B11\u59D0\u59D0 (Smile Lee) based on Hypcos's MN series; expander also by \u7B11\u59D0\u59D0 (Smile Lee)."
    },
    "credit.test-alpha0": {
      zh: "\u7531 test_alpha0 \u5B9A\u4E49, \u5E76\u7ED9\u51FA\u5C55\u5F00\u5668.",
      en: "Defined by test_alpha0, with expander by the same author."
    },
    "credit.test-alpha0-ocn": {
      zh: "\u7531 test_alpha0 \u5B9A\u4E49, \u5E76\u7ED9\u51FA\u5C55\u5F00\u5668. \u540C\u65F6\u63D0\u4F9B OCN \u6E32\u67D3.",
      en: "Defined by test_alpha0, with expander by the same author. Also provides OCN rendering."
    },
    "credit.ton": {
      zh: "\u7531 Taranosvky \u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE.",
      en: "Defined by Taranosvky; expander from the original NE project."
    },
    "credit.asan": {
      zh: "\u7531 Aarex \u5B9A\u4E49; \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE.",
      en: "Defined by Aarex; expander from the original NE project."
    },
    "credit.community_y": { zh: "\u7531\u793E\u533A\u5B9A\u4E49.", en: "Defined by the community." },
    "credit.asheep": {
      zh: "\u7531 Asheep233 \u7ED9\u51FA\u7C97\u7565\u5B9A\u4E49, \u7531 \u7B11\u59D0\u59D0 \u57FA\u4E8E\u6B64\u7ED9\u51FA\u5C55\u5F00\u5668.",
      en: "Rough definition by Asheep233; expander by \u7B11\u59D0\u59D0 (Smile Lee) based on it."
    },
    "credit.bocf": {
      zh: "\u7531 Buchholz \u7ED9\u51FA\u6700\u521D\u5B9A\u4E49; \u7531\u793E\u533A\u5B8C\u5584.",
      en: "Initially defined by Buchholz; refined by the community."
    },
    "credit.mocf": { zh: "\u7531 Madore \u7ED9\u51FA\u6700\u521D\u5B9A\u4E49.", en: "Initially defined by Madore." },
    "credit.nocf": { zh: "\u7531\u793E\u533A\u5B9A\u4E49.", en: "Defined by the community." },
    "credit.ups1_1r5": {
      zh: "\u7531 Optimism \u6700\u521D\u521B\u4F5C, Alice \u5B8C\u5584. \u7531 Alice \u7ED9\u51FA\u5C55\u5F00\u5668\u4E0E\u53EF\u89C6\u5316\u65B9\u6848.",
      en: "Originally created by Optimism, refined by Alice. Expander and visualization by Alice."
    },
    "credit.dsm": {
      zh: "\u7531 Alice \u5B9A\u4E49\u5E76\u7ED9\u51FA\u5C55\u5F00\u5668.",
      en: "Defined by Alice, with expander by the same author."
    },
    "credit.wmm": {
      zh: "\u7531\u793E\u533A\u4ECE Aarex \u5B9A\u4E49\u7684 MMS \u6539\u8FDB\u800C\u6765. \u5C55\u5F00\u5668\u6765\u81EA\u539F NE \u9879\u76EE.",
      en: "A community improvement upon MMS defined by Aarex. Expander from the original NE project."
    }
  };
  var bundle = Object.freeze({
    schemaVersion: 2,
    source: Object.freeze({ repository: REPOSITORY, commit: COMMIT }),
    counts: Object.freeze({
      direct: directNotations.length,
      generated: generatedNotations.length,
      total: notations.length
    }),
    notations: Object.freeze(notations),
    notationsById: Object.freeze(notationsById),
    generatedNotationIds: Object.freeze(generatedNotations.map((notation) => notation.id)),
    categories: Object.freeze(categories),
    categoriesById: Object.freeze(categoriesById),
    generatorCategoryIds: Object.freeze(generatorCategoryIds),
    createGeneratedNotation,
    credits: Object.freeze(credits)
  });
  Object.defineProperty(globalThis, "SmileLeeNotationBundle", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: bundle
  });
})();
