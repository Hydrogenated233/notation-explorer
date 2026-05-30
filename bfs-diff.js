/**
 * bfs-diff.js — BFS comparison of two Notation Explorer notations
 *
 * Usage: node bfs-diff.js <notationA-id> <notationB-id> [options]
 *
 * Compares two register notations by BFS on their FS expansions,
 * reporting all mismatches found.
 */

const fs = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────────────
const ARGS = parseArgs(process.argv.slice(2));
const PROJ_DIR = __dirname;
const NOTATIONS_DIR = path.join(PROJ_DIR, 'js/notations');
const ID_A = ARGS._[0];
const ID_B = ARGS._[1];
const BFS_LIMIT = parseInt(ARGS.limit) || 500;
const FS_POS_LIMIT = parseInt(ARGS['max-pos'] || ARGS.maxPos) || 8;
const SEARCH_CAP = parseInt(ARGS.cap) || 200;

if (!ID_A || !ID_B) {
  console.error('Usage: node bfs-diff.js <notationA-id> <notationB-id> [options]');
  console.error('Options: --limit N --max-pos N --cap N --json --out <file>');
  process.exit(1);
}

// ── Load shared-seq.js ─────────────────────────────────────────────────
const sharedCode = fs.readFileSync(path.join(NOTATIONS_DIR, 'shared-seq.js'), 'utf8');
// shared-seq.js uses comma-separated declarations; the first is `var sequence_compare = ...`
eval(sharedCode.replace(/^,sequence_display/, ';var sequence_display'));
global.register = [];
global.analysis_register = [];

// ── Load ALL notation files (same order as index.html) ─────────────────
function loadNotationFiles() {
  // Read index.html to get the load order
  const indexHtml = fs.readFileSync(path.join(PROJ_DIR, 'index.html'), 'utf8');

  // Find all <script src="js/notations/..."> tags (after Vue.js, before framework.js)
  const notationRe = /<script\s+src="js\/notations\/([^"]+\.js)">\s*<\/script>/gi;
  const files = [];
  let match;
  while ((match = notationRe.exec(indexHtml)) !== null) {
    files.push(match[1]);
  }

  // Ensure Diagram.js is loaded first if present
  for (let i = 0; i < files.length; i++) {
    if (files[i] === 'Diagram.js') {
      const diag = files.splice(i, 1)[0];
      files.unshift(diag);
      break;
    }
  }

  for (const file of files) {
    try {
      const code = fs.readFileSync(path.join(NOTATIONS_DIR, file), 'utf8');
      eval(code);
    } catch (e) {
      // skip files that fail to load
    }
  }
}

loadNotationFiles();

// ── Find notations by ID ───────────────────────────────────────────────
function findNotation(id) {
  for (const n of global.register) {
    if (n.id === id) return n;
  }
  // Fuzzy match (case-insensitive)
  for (const n of global.register) {
    if (n.id.toLowerCase() === id.toLowerCase()) return n;
  }
  return null;
}

const N_A = findNotation(ID_A);
const N_B = findNotation(ID_B);

if (!N_A) { console.error(`Notation "${ID_A}" not found in register.`); listNotations(); process.exit(1); }
if (!N_B) { console.error(`Notation "${ID_B}" not found in register.`); listNotations(); process.exit(1); }

function listNotations() {
  console.error('\nAvailable notations:');
  for (const n of global.register) {
    console.error(`  ${n.id}`);
  }
}

// ── Expression serialization (cached for performance) ──────────────────
const jsonCache = new Map();
function serializeJSON(expr) {
  return JSON.stringify(expr);
}

// Build a deep-clone-free JSON string:
function exprKey(expr) {
  if (!Array.isArray(expr)) return String(expr);
  if (expr.length === 1 && expr[0] === Infinity) return 'Infinity';
  const cached = jsonCache.get(expr);
  if (cached) return cached;
  const str = '[' + expr.map(t => {
    if (Array.isArray(t)) return '[' + exprKey(t) + ']';
    return String(t);
  }).join(',') + ']';
  jsonCache.set(expr, str);
  return str;
}

// ── Parse args ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const parts = argv[i].slice(2).split('=');
      if (parts.length === 2) {
        result[parts[0]] = parseNum(parts[1]);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        result[parts[0]] = parseNum(argv[++i]);
      } else {
        result[parts[0]] = true;
      }
    } else {
      result._.push(argv[i]);
    }
  }
  return result;
}
function parseNum(v) { const n = Number(v); return isNaN(n) ? v : n; }

// ── BFS ────────────────────────────────────────────────────────────────
const visited = new Set();
const queue = [];
const mismatches = [];
let totalVisited = 0;
let afkCount = 0;       // expressions where FS returns nothing
let succSkipped = 0;    // successor expressions (both return empty for all FS)

function enqueue(expr) {
  const key = exprKey(expr);
  if (!visited.has(key)) {
    visited.add(key);
    queue.push(expr);
  }
}

function getFS(notation, expr, n) {
  try {
    const result = notation.FS(expr, n);
    return result && Array.isArray(result) && result.length > 0 ? result : null;
  } catch (e) {
    return null;
  }
}

// Check if both notations agree this is a successor (no FS results)
function isSuccessorExpr(expr) {
  // Quick check: flat integer sequence ending in 1
  if (Array.isArray(expr) && expr.length > 0) {
    const last = expr[expr.length - 1];
    if (Number.isInteger(last)) return last === 1;
  }
  return false;
}

enqueue([Infinity]);

let reportInterval = setInterval(() => {
  if (totalVisited > 0) {
    process.stderr.write(`\rBFS: ${totalVisited} visited, ${queue.length} queued, ${mismatches.length} mismatches`);
  }
}, 1000);

while (queue.length > 0 && totalVisited < BFS_LIMIT) {
  const expr = queue.shift();
  totalVisited++;

  const isSuccessor = isSuccessorExpr(expr);
  const queueDepth = queue.length;

  let allNull = true;

  for (let pos = 0; pos < FS_POS_LIMIT; pos++) {
    const rA = getFS(N_A, expr, pos);
    const rB = getFS(N_B, expr, pos);

    if (rA !== null || rB !== null) allNull = false;

    if (rA === null && rB === null) continue;

    // Convert to comparable strings
    const sA = rA === null ? 'null' : serializeJSON(rA);
    const sB = rB === null ? 'null' : serializeJSON(rB);

    if (sA !== sB) {
      mismatches.push({
        exprJSON: serializeJSON(expr),
        exprDisplayA: N_A.display ? N_A.display(expr) : serializeJSON(expr),
        exprDisplayB: N_B.display ? N_B.display(expr) : serializeJSON(expr),
        fsPos: pos,
        aResultJSON: sA,
        bResultJSON: sB,
        aResultDisplay: rA !== null && N_A.display ? N_A.display(rA) : sA,
        bResultDisplay: rB !== null && N_B.display ? N_B.display(rB) : sB,
        queueDepth,
      });
    }

    // Enqueue children from notation A for BFS exploration
    if (rA !== null) enqueue(rA);
  }

  if (allNull) {
    if (isSuccessor) succSkipped++;
    else afkCount++;
  }

  // Also enqueue children from notation B to ensure full coverage
  for (let pos = 0; pos < 4; pos++) {
    const rB = getFS(N_B, expr, pos);
    if (rB !== null) enqueue(rB);
  }
}

clearInterval(reportInterval);
process.stderr.write('\n');

// ── Output ─────────────────────────────────────────────────────────────
const result = {
  notationA: ID_A,
  notationB: ID_B,
  options: { BFS_LIMIT, FS_POS_LIMIT, SEARCH_CAP },
  stats: {
    totalVisited,
    totalMismatches: mismatches.length,
    afkNodes: afkCount,
    successorSkipped: succSkipped,
    maxQueueDepth: Math.max(...mismatches.map(m => m.queueDepth), 0),
  },
  mismatches,
};

if (ARGS.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`\nBFS Diff: ${ID_A} vs ${ID_B}`);
  console.log(`Results: ${mismatches.length} mismatches out of ${totalVisited} expressions (FS pos 0..${FS_POS_LIMIT-1})`);
  console.log(`  AFK nodes: ${afkCount}, successor skipped: ${succSkipped}\n`);

  if (mismatches.length === 0) {
    console.log('✓ All expressions match!');
  } else {
    for (const m of mismatches.slice(0, 30)) {
      console.log(`[expr: ${m.exprDisplayA}] (fs=${m.fsPos})`);
      console.log(`  A: ${m.aResultDisplay}`);
      console.log(`  B: ${m.bResultDisplay}`);
      console.log('');
    }
    if (mismatches.length > 30) {
      console.log(`... and ${mismatches.length - 30} more mismatches`);
    }
  }
}

if (ARGS.out) {
  fs.writeFileSync(ARGS.out, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\nResults written to ${ARGS.out}`);
}
