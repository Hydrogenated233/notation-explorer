# DFS Diff Tool for Notation Explorer

## Purpose
Compare two notation explorer `register` notations by DFS on their FS expansions.
Detects mismatches in expand logic, cache collisions, and FS indexing differences.

## Usage

```bash
node dfs-diff.js <notation-a> <notation-b> [options]
```

- `<notation-a>`, `<notation-b>`: notation IDs from `register` (e.g. `cps`, `ssqlprss`)
- Options:
  - `--max-n N`: maximum FS position (default 3, meaning FS indices 0..3)
  - `--visited N`: maximum number of expressions to visit (default 200)
  - `--steps N`: maximum depth per branch (default 10)
  - `--timeout N`: timeout in milliseconds (default 3000)
  - `--json`: output results as JSON to stdout
  - `--out <file>`: write JSON results to file

## How it works

1. Loads shared-seq.js, then ALL notation files (same as index.html)
2. Extracts the two specified notations by their `register` IDs
3. DFS from the limit expression of each notation
4. For each expression, calls both notations' FS at indices 0..max-n
5. Compares results by stringified JSON, reports mismatches
6. Stops on timeout or when max visited nodes reached

## Features

- Handles nested array expressions correctly (unlike `toString()`-based cache)
- Skips successor expressions (both must agree on "able")
- Reports mismatches with both notations' display strings
- Timeout protection to prevent infinite loops

## Output format

Mismatches are printed to stdout in readable text format.

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
