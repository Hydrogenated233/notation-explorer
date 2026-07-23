/**
 * DFS Diff (standalone)
 * 比较两个记号的 FS 展开差异
 * 与 notation-explorer 调试页面同步
 *
 * Usage:
 *   node dfs-diff.js <notationA-id> <notationB-id> [options]
 *
 * Options:
 *   --max-n N      最大 FS 位置 (default 3)
 *   --visited N    最大访问节点数 (default 200)
 *   --steps N      最大深度 (default 10)
 *   --timeout N    超时毫秒数 (default 3000)
 *   --json         输出 JSON 格式
 *   --out <file>   写入 JSON 文件
 */

const fs = require('fs');
const path = require('path');
const { discoverNotationFiles } = require('./generate-notation-manifest.js');

// ---- 解析参数 ----
const args = process.argv.slice(2);
let idA = null, idB = null;
let maxN = 3, maxVisited = 200, maxSteps = 10, timeout = 3000;
let jsonMode = false, outFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--max-n') maxN = parseInt(args[++i]);
  else if (args[i] === '--visited') maxVisited = parseInt(args[++i]);
  else if (args[i] === '--steps') maxSteps = parseInt(args[++i]);
  else if (args[i] === '--timeout') timeout = parseInt(args[++i]);
  else if (args[i] === '--json') jsonMode = true;
  else if (args[i] === '--out') outFile = args[++i];
  else if (!idA) idA = args[i];
  else if (!idB) idB = args[i];
}

if (!idA || !idB) {
  console.error('Usage: node dfs-diff.js <notationA-id> <notationB-id> [options]');
  process.exit(1);
}

// ---- 加载环境 ----
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

function findNotation(id) {
  let n = register.find(r => r.id === id);
  if (!n) n = register.find(r => r.id.toLowerCase() === id.toLowerCase());
  return n;
}

const nA = findNotation(idA);
const nB = findNotation(idB);

if (!nA) { console.error(`Notation "${idA}" not found.`); process.exit(1); }
if (!nB) { console.error(`Notation "${idB}" not found.`); process.exit(1); }

const FSA = nA.FS;
const FSB = nB.FS;

// ---- Diff ----
const visited = {};
const queue = [];
let head = 0;

for (let i = 0; i <= maxN; i++) {
  try {
    const expr = FSA([Infinity], i);
    if (Array.isArray(expr) && expr.length > 0) {
      const k = JSON.stringify(expr);
      if (!visited[k]) { visited[k] = 1; queue.push(expr); }
    }
  } catch(e) {}
}

const mismatches = [];
let total = 0;
const stepDepth = {};
const startTime = Date.now();

while (head < queue.length && total < maxVisited && mismatches.length < 50) {
  if (Date.now() - startTime > timeout) break;
  const expr = queue[head++];
  const exprKey = JSON.stringify(expr);
  total++;
  const d = stepDepth[exprKey] || 0;
  if (d >= maxSteps) continue;

  for (let pos = 0; pos <= maxN; pos++) {
    let rA = null, rB = null;
    try { rA = FSA(expr, pos); } catch(e) {}
    if (rA === null || (Array.isArray(rA) && rA.length === 0)) continue;
    try { rB = FSB(expr, pos); } catch(e) {}
    const sA = JSON.stringify(rA);
    const sB = rB === null ? 'null' : JSON.stringify(rB);
    if (sA !== sB) {
      mismatches.push({
        exprJSON: exprKey,
        fsPos: pos,
        aResult: rA,
        bResult: rB,
      });
    }
    const pushChild = (x) => {
      const k = JSON.stringify(x);
      if (!visited[k]) { visited[k] = 1; stepDepth[k] = d + 1; queue.push(x); }
    };
    if (rA !== null) pushChild(rA);
    if (rB !== null) pushChild(rB);
  }
}

const timedOut = Date.now() - startTime > timeout;

// ---- 输出 ----
const result = {
  notationA: idA, notationB: idB,
  options: { maxN, maxVisited, maxSteps, timeout },
  totalVisited: total,
  mismatches: mismatches.length,
  timedOut,
  mismatchDetails: mismatches.map(m => ({
    exprJSON: m.exprJSON,
    fsPos: m.fsPos,
    aResult: m.aResult,
    bResult: m.bResult,
  })),
};

if (jsonMode) {
  const json = JSON.stringify(result, null, 2);
  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8');
    console.log(`Results written to ${outFile}`);
  } else {
    console.log(json);
  }
} else {
  console.log(`\nDFS Diff: ${nA.name} vs ${nB.name}`);
  console.log(`Visited: ${total}, Mismatches: ${mismatches.length}${timedOut ? ' (TIMEOUT)' : ''}`);
  console.log('');
  if (mismatches.length === 0) {
    console.log('All expressions match!');
  } else {
    mismatches.slice(0, 30).forEach((m, i) => {
      console.log(`[${i}] expr: ${m.exprJSON}  (fs=${m.fsPos})`);
      console.log(`  A: ${JSON.stringify(m.aResult)}`);
      console.log(`  B: ${m.bResult === null ? 'null' : JSON.stringify(m.bResult)}`);
      console.log('');
    });
    if (mismatches.length > 30) {
      console.log(`... and ${mismatches.length - 30} more mismatches`);
    }
  }
}
