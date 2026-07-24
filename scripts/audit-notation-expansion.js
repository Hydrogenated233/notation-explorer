'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const { spawn } = require('node:child_process')

const manifest = require('../js/notation-manifest.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.resolve(__dirname, '..')
const notationRoot = path.join(projectRoot, 'js', 'notations')
const RESULT_PREFIX = '@@NOTATION_EXPANSION_AUDIT@@'
const VARIANTS = Object.freeze(['FS', 'FSShort'])

function runFile(context, filename, root = projectRoot) {
   const absolute = path.join(root, filename)
   vm.runInContext(fs.readFileSync(absolute, 'utf8'), context, { filename: absolute })
}

function loadRegistry() {
   const hub = new NotationRegistryHub()
   const context = vm.createContext({
      register: hub.main,
      analysis_register: hub.analysis,
      console,
      setTimeout,
      clearTimeout,
   })
   context.window = context
   context.globalThis = context

   runFile(context, 'js/ne-rewritten-notation-bundle.js')
   manifest.forEach((filename) => runFile(context, filename, notationRoot))
   return hub.main
}

// This is the same bound-search loop used by framework.js expand_item().
function generateFS(notation, FS, item) {
   if (item.fs_index !== undefined) {
      item.fs_index++
      return FS(item.expr, item.fs_index)
   }

   let fsIndex = 0
   while (true) {
      const result = FS(item.expr, fsIndex)
      if (notation.compare(result, item.bound) > 0) {
         item.fs_index = fsIndex
         return result
      }
      fsIndex++
   }
}

function display(notation, expression, label) {
   const rendered = notation.display(expression)
   if (typeof rendered !== 'string') {
      throw new TypeError(label + ' display must return a string')
   }
   return rendered
}

function auditNotationVariant(notation, variant) {
   const FS = variant === 'FSShort' ? notation.FSShort || notation.FS : notation.FS
   if (typeof FS !== 'function') throw new TypeError(variant + ' is not a function')

   const initial = notation.init()
   if (!Array.isArray(initial) || initial.length < 2) {
      throw new TypeError('init() must provide a Limit item followed by its lower sibling')
   }

   const limit = {
      expr: initial[0].expr,
      bound: initial[0].low[0],
      fs_index: undefined,
   }
   if (!notation.able(limit.expr)) throw new Error('initial Limit is not expandable')

   const firstExpression = generateFS(notation, FS, limit)
   const insertionBound = initial[1].expr
   if (notation.compare(firstExpression, insertionBound) <= 0) {
      throw new Error('first Limit click did not produce an item above its insertion bound')
   }
   const firstDisplay = display(notation, firstExpression, 'first Limit child')

   // The first child is the last item in a non-root list, so framework.js expands
   // it to its parent and uses the child's insertion bound as the new bound.
   const child = {
      expr: firstExpression,
      bound: insertionBound,
      fs_index: undefined,
   }
   const secondExpression = notation.able(child.expr)
      ? generateFS(notation, FS, child)
      : FS(child.expr, 0)
   const secondDisplay = display(notation, secondExpression, 'first Limit child expansion')

   return {
      id: notation.id,
      variant,
      firstDisplay,
      secondDisplay,
      secondInserted: notation.compare(secondExpression, child.bound) > 0,
   }
}

function errorResult(id, variant, phase, error) {
   return {
      id,
      variant,
      status: 'failed',
      phase,
      error: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : undefined,
   }
}

function runWorker(id, variant) {
   let phase = 'load registry'
   try {
      const registry = loadRegistry()
      phase = 'resolve notation'
      const notation = registry.get(id)
      if (!notation) throw new Error('unknown notation ID')
      phase = 'expand Limit and first child'
      return { status: 'passed', ...auditNotationVariant(notation, variant) }
   } catch (error) {
      return errorResult(id, variant, phase, error)
   }
}

function spawnAuditCase(id, variant, timeoutMs) {
   return new Promise((resolve) => {
      const child = spawn(process.execPath, [__filename, '--worker', id, variant], {
         cwd: projectRoot,
         stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stdout = ''
      let stderr = ''
      let timedOut = false
      const timer = setTimeout(() => {
         timedOut = true
         child.kill()
      }, timeoutMs)

      child.stdout.on('data', (chunk) => { stdout += chunk })
      child.stderr.on('data', (chunk) => { stderr += chunk })
      child.on('error', (error) => {
         clearTimeout(timer)
         resolve(errorResult(id, variant, 'start worker', error))
      })
      child.on('close', (code, signal) => {
         clearTimeout(timer)
         if (timedOut) {
            resolve({ id, variant, status: 'timeout', timeoutMs })
            return
         }

         const marker = stdout.lastIndexOf(RESULT_PREFIX)
         if (marker < 0) {
            resolve({
               id,
               variant,
               status: 'failed',
               phase: 'read worker result',
               error: `worker exited with code ${code} and signal ${signal || 'none'}`,
               stderr: stderr.trim(),
            })
            return
         }

         try {
            resolve(JSON.parse(stdout.slice(marker + RESULT_PREFIX.length)))
         } catch (error) {
            resolve(errorResult(id, variant, 'parse worker result', error))
         }
      })
   })
}

async function mapConcurrent(items, concurrency, callback) {
   const results = new Array(items.length)
   let next = 0

   async function consume() {
      while (true) {
         const index = next++
         if (index >= items.length) return
         results[index] = await callback(items[index])
      }
   }

   await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume))
   return results
}

async function runAudit(options = {}) {
   const timeoutMs = options.timeoutMs || 5000
   const concurrency = options.concurrency || Math.max(1, Math.min(8, os.cpus().length))
   const requestedIds = options.ids && options.ids.length ? options.ids : undefined
   const ids = requestedIds || loadRegistry().map((notation) => notation.id)
   const cases = ids.flatMap((id) => VARIANTS.map((variant) => ({ id, variant })))
   const results = await mapConcurrent(
      cases,
      concurrency,
      ({ id, variant }) => spawnAuditCase(id, variant, timeoutMs)
   )
   return { ids, results, failures: results.filter((result) => result.status !== 'passed') }
}

function optionValue(prefix) {
   const option = process.argv.find((argument) => argument.startsWith(prefix + '='))
   return option ? option.slice(prefix.length + 1) : undefined
}

async function main() {
   if (process.argv[2] === '--worker') {
      const result = runWorker(process.argv[3], process.argv[4])
      process.stdout.write(RESULT_PREFIX + JSON.stringify(result))
      return
   }

   const ids = process.argv.filter((argument) => argument.startsWith('--id='))
      .map((argument) => argument.slice('--id='.length))
   const timeoutMs = Number(optionValue('--timeout')) || 5000
   const concurrency = Number(optionValue('--concurrency')) || undefined
   const audit = await runAudit({ ids, timeoutMs, concurrency })

   audit.results.forEach((result) => {
      if (result.status === 'passed') return
      console.error(
         `${result.id}/${result.variant}: ${result.status}` +
         (result.phase ? ` during ${result.phase}` : '') +
         (result.error ? `: ${result.error}` : '')
      )
   })
   console.log(
      `Audited ${audit.ids.length} notations and ${audit.results.length} FS paths: ` +
      `${audit.results.length - audit.failures.length} passed, ${audit.failures.length} failed.`
   )
   if (audit.failures.length) process.exitCode = 1
}

if (require.main === module) {
   main().catch((error) => {
      console.error(error)
      process.exitCode = 1
   })
}

module.exports = {
   VARIANTS,
   auditNotationVariant,
   generateFS,
   loadRegistry,
   runAudit,
}
