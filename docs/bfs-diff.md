# BFS Diff Tool for Notation Explorer

## Purpose
Compare two notation explorer `register` notations by BFS on their FS expansions.
Detects mismatches in expand logic, cache collisions, and FS indexing differences.

## Usage

```bash
node bfs-diff.js <notation-a> <notation-b> [options]
```

- `<notation-a>`, `<notation-b>`: notation IDs from `register` (e.g. `cps`, `ssqlprss`)
- Options:
  - `--limit N`: max expressions to visit (default 500)
  - `--max-pos N`: max FS index to check (default 8, meaning FS indices 0..7)
  - `--cap N`: cap parameter for FS expansions (default 200)
  - `--json`: output results as JSON to stdout
  - `--out <file>`: write JSON results to file

## How it works

1. Loads shared-seq.js, then ALL notation files (same as index.html)
2. Extracts the two specified notations by their `register` IDs
3. BFS from `[Infinity]`:
   - Visits expressions in FIFO order
   - For each expression, calls both notations' FS at indices 0..max-pos-1
   - Compares results by stringified JSON (handles nested arrays correctly)
   - Enqueues children from the first notation's FS → ensures consistent BFS
4. Reports mismatches with both notations' display strings

## Features

- Handles nested array expressions correctly (unlike `toString()`-based cache)
- Skips successor expressions (both must agree on "able")
- Reports expressions as both JSON and display strings
- Tracks queue depth to help identify deep mismatches

## Output format

Mismatches are printed to stderr in readable format.

With `--json`, stdout gets:
```json
{
  "notationA": "id-a",
  "notationB": "id-b",
  "stats": {
    "totalVisited": 168,
    "totalMismatches": 0,
    "afkNodes": 42,
    "successorSkipped": 84
  },
  "mismatches": [
    {
      "exprJSON": "[1,2,3]",
      "fsPos": 3,
      "aResultJSON": "[1,2]",
      "bResultJSON": "[1,2,2]",
      "aResultDisplay": "1,2",
      "bResultDisplay": "1,2,2",
      "queueDepth": 5
    }
  ]
}
```
