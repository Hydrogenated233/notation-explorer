'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const manifest = require('../js/notation-manifest.js')
const Loader = require('../js/notation-loader.js')
const {
   buildPages,
   pagesDocPaths,
   runtimeBundlePath,
   standaloneCorePaths,
} = require('../scripts/build-pages.js')

const projectRoot = path.join(__dirname, '..')

test('Pages build collapses startup assets without changing application sources', () => {
   const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notation-pages-'))
   const sourceIndexPath = path.join(projectRoot, 'index.html')
   const sourceIndex = fs.readFileSync(sourceIndexPath, 'utf8')

   try {
      const metadata = buildPages({ outputRoot, quiet: true })
      const html = fs.readFileSync(path.join(outputRoot, 'index.html'), 'utf8')
      const runtimeBundle = fs.readFileSync(path.join(outputRoot, runtimeBundlePath), 'utf8')
      const copiedXlsx = path.join(outputRoot, 'lib', 'xlsx.full.min.js')

      assert.equal(fs.readFileSync(sourceIndexPath, 'utf8'), sourceIndex)
      assert.match(
         html,
         new RegExp('<script src="' + runtimeBundlePath.replace('/', '\\/') +
            '\\?v=[^" ]+" defer data-ne-pages-runtime></script>')
      )
      assert.equal((html.match(/<script\b/gi) || []).length, 1)
      assert.doesNotMatch(html, /<link\b[^>]*\brel=["']stylesheet["']/i)
      assert.match(html, /<style data-ne-build-source="pages\.css">/)
      assert.match(html, /#app:not\(\[data-v-app\]\)\{visibility:hidden\}/)
      assert.doesNotMatch(html, /fonts\/[^)]+\.woff\)/)
      assert.doesNotMatch(html, /fonts\/[^)]+\.ttf\)/)
      assert.match(html, /<link rel="icon" href="data:,">/)
      assert.match(html, /data-ne-xlsx-action/)
      assert.doesNotMatch(html, /lib\/xlsx\.full\.min\.js\?v=/)
      assert.match(runtimeBundle, /NotationStandaloneWorkerURL/)
      assert.match(runtimeBundle, /AINotationPageComponent/)
      assert.match(runtimeBundle, /bm4/)
      assert.match(runtimeBundle, /function loadXlsx|xlsx\.full\.min\.js/)
      assert.doesNotThrow(() => new vm.Script(runtimeBundle))
      assert.ok(Buffer.byteLength(html) < 150000, 'HTML should stay small enough to parse quickly')
      assert.ok(Buffer.byteLength(runtimeBundle) > 1000000, 'startup code should live in the cacheable bundle')
      assert.equal(fs.existsSync(copiedXlsx), true)
      assert.deepEqual(
         fs.readFileSync(copiedXlsx),
         fs.readFileSync(path.join(projectRoot, 'lib', 'xlsx.full.min.js'))
      )
      pagesDocPaths.forEach((relativePath) => {
         assert.equal(
            fs.existsSync(path.join(outputRoot, relativePath)),
            true,
            'missing public Pages document: ' + relativePath
         )
      })
      assert.equal(fs.existsSync(path.join(outputRoot, '.nojekyll')), true)
      standaloneCorePaths.forEach((relativePath) => {
         assert.equal(
            fs.existsSync(path.join(outputRoot, relativePath)),
            true,
            'missing standalone runtime asset: ' + relativePath
         )
      })
      assert.equal(fs.existsSync(path.join(outputRoot, 'lib', 'Vue.js')), false)
      assert.equal(fs.existsSync(path.join(outputRoot, 'lib', 'katex', 'katex.min.js')), false)
      assert.equal(fs.existsSync(path.join(outputRoot, 'js', 'notation-loader.js')), false)
      assert.equal(fs.existsSync(path.join(outputRoot, 'lib', 'katex', 'fonts', 'KaTeX_Main-Regular.ttf')), false)
      assert.equal(fs.existsSync(path.join(outputRoot, 'lib', 'katex', 'fonts', 'KaTeX_Main-Regular.woff')), false)
      assert.equal(fs.existsSync(path.join(outputRoot, 'lib', 'katex', 'fonts', 'KaTeX_Main-Regular.woff2')), true)
      assert.equal(metadata.catalogEntries, manifest.length)
      assert.equal(
         metadata.bundledScripts,
         7 + manifest.length + Loader.APP_SCRIPTS.length + 2
      )
      assert.equal(metadata.inlinedScripts, 0)
      assert.equal(metadata.optimizedDefaultInitialRequests, 2)
      assert.equal(
         metadata.sourceInitialRequests,
         1 + 2 + 9 + manifest.length + Loader.APP_SCRIPTS.length
      )
      assert.equal(metadata.sourceScriptRequests, 9 + manifest.length + Loader.APP_SCRIPTS.length)
      assert.equal(metadata.runtimeBundlePath, runtimeBundlePath)
      assert.deepEqual(metadata.deferredScripts, ['lib/xlsx.full.min.js'])
   } finally {
      fs.rmSync(outputRoot, { recursive: true, force: true })
   }
})
