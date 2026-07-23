/**
 * DFS Infinite Descending Chain Detector (standalone)
 * 从 Limit 的基本列出发，DFS 检测无穷降链
 * 与 notation-explorer 调试页面同步
 *
 * Usage:
 *   node dfs-detect.js <notation-id> [options]
 *
 * Options:
 *   --limit N      取 Limit 的前 N 个基本列 (default 6)
 *   --steps N      每个分支最多展开 N 步 (default 50)
 *   --max-n N      尝试展开 n=0..N (default 1)
 *   --preview N    检测到无限时输出前 N 项 (default 8)
 *   --visited N    最大访问节点数 (default 2000)
 *   --json         输出 JSON 格式
 *   --out <file>   写入 JSON 文件
 */

const fs = require('fs');
const path = require('path');
const { discoverNotationFiles } = require('./generate-notation-manifest.js');

// ---- 解析参数 ----
const args = process.argv.slice(2);
let notationId = null;
let limitTerm = 6, maxSteps = 50, maxN = 1, preview = 8, maxVisited = 2000;
let jsonMode = false, outFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit') limitTerm = parseInt(args[++i]);
  else if (args[i] === '--steps') maxSteps = parseInt(args[++i]);
  else if (args[i] === '--max-n') maxN = parseInt(args[++i]);
  else if (args[i] === '--preview') preview = parseInt(args[++i]);
  else if (args[i] === '--visited') maxVisited = parseInt(args[++i]);
  else if (args[i] === '--json') jsonMode = true;
  else if (args[i] === '--out') outFile = args[++i];
  else notationId = args[i];
}

if (!notationId) {
  console.error('Usage: node dfs-detect.js <notation-id> [options]');
  process.exit(1);
}

// ---- 加载 notation-explorer 环境 ----
const baseDir = __dirname;
function loadAll() {
  for (const file of discoverNotationFiles()) {
    try {
      eval(fs.readFileSync(path.join(baseDir, 'js/notations', file), 'utf8'));
    } catch (error) {
      const wrapped = new Error(`Failed to load built-in notation file "${file}": ${error.message}`);
      wrapped.cause = error;
      throw wrapped;
    }
  }
}

var register = [];
var analysis_register = [];
loadAll();

const notation = register.find(r => r.id === notationId);
if (!notation) {
  console.error(`Notation "${notationId}" not found. Available: ${register.map(r => r.id).join(', ')}`);
  process.exit(1);
}

const display = notation.display || (x => JSON.stringify(x));
const FS = notation.FS;

// ---- 检测 ----
const results = [];

console.log(`Notation: ${notation.name} (${notation.id})`);
console.log(`Limit terms: ${limitTerm}, max steps: ${maxSteps}, max n: ${maxN}, max visited: ${maxVisited}`);
console.log();

for (let fsIdx = 0; fsIdx < limitTerm; fsIdx++) {
  let seq;
  try { seq = FS([Infinity], fsIdx); } catch(e) {}
  if (!Array.isArray(seq)) {
    seq = [1];
    for (let i = 1; i <= fsIdx; i++) seq.push(i + 1);
  }

  const parentMap = {};
  const startKey = JSON.stringify(seq);
  const stack = [{ seq, steps: 0, key: startKey }];
  let visitedCount = 0, found = false, chain = [], limitReached = false;
  let lastKey = startKey;
  parentMap[startKey] = { parentKey: null, seq, step: 0 };

  while (stack.length > 0) {
    const item = stack.pop();
    const s = item.seq, steps = item.steps, key = item.key;
    visitedCount++;
    lastKey = key;
    if (steps >= maxSteps) { found = true; break; }
    if (visitedCount >= maxVisited) { limitReached = true; break; }
    if (s.length <= 1) continue;
    if (s[s.length - 1] === 1) {
      const ns = s.slice(0, -1);
      const nskey = JSON.stringify(ns);
      if (!parentMap[nskey]) {
        parentMap[nskey] = { parentKey: key, seq: ns, step: steps + 1 };
        stack.push({ seq: ns, steps: steps + 1, key: nskey });
      }
      continue;
    }
    for (let n = 0; n <= maxN; n++) {
      try {
        const ns = FS(s, n);
        if (!Array.isArray(ns)) continue;
        const nskey2 = JSON.stringify(ns);
        if (!parentMap[nskey2]) {
          parentMap[nskey2] = { parentKey: key, seq: ns, step: steps + 1 };
          stack.push({ seq: ns, steps: steps + 1, key: nskey2 });
        }
      } catch(e) {}
    }
  }

  if (found || limitReached) {
    let curKey = lastKey;
    const backwards = [];
    while (curKey && backwards.length < preview) {
      const node = parentMap[curKey];
      if (!node) break;
      backwards.unshift(node.seq);
      curKey = node.parentKey;
    }
    chain = backwards;
  }

  const reason = found ? 'INF' : (limitReached ? 'LIMIT' : 'TERM');
  const res = { start: seq, found, chain, visited: visitedCount, reason };

  if (!jsonMode) {
    console.log(`Limit FS(${fsIdx}) = ${display(seq)}  (visited: ${visitedCount}) [${reason}]`);
    if (found || limitReached) {
      console.log(`  first ${chain.length} entries:`);
      chain.forEach((c, i) => console.log(`    ${i}: ${display(c)}  (len=${c.length})`));
    } else {
      console.log('  (terminated)');
    }
    console.log();
  }

  results.push(res);
}

// ---- JSON 输出 ----
const output = {
  notation: notation.id,
  notationName: notation.name,
  config: { limitTerm, maxSteps, maxN, preview, maxVisited },
  results: results.map(r => ({
    start: display(r.start),
    found: r.found,
    reason: r.reason,
    visited: r.visited,
    chain: r.chain.map(c => ({ expr: display(c), length: c.length }))
  }))
};

if (jsonMode) {
  const json = JSON.stringify(output, null, 2);
  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8');
    console.log(`Results written to ${outFile}`);
  } else {
    console.log(json);
  }
}
