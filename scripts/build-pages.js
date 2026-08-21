'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const esbuild = require('esbuild')

const Loader = require('../js/notation-loader.js')
const manifest = require('../js/notation-manifest.js')
const { NotationRegistryHub } = require('../js/notation-registry.js')

const projectRoot = path.join(__dirname, '..')
const defaultOutputRoot = path.join(projectRoot, 'dist')
const BUILD_FORMAT_VERSION = 'pages-v2-external-runtime'
const runtimeBundlePath = 'assets/pages-runtime.js'

const inlineStylePaths = [
   'lib/katex/katex.min.css',
   'css/index.css',
]

// XLSX is intentionally omitted. The generated page loads it on the first
// import/export action instead of making every visitor download it up front.
const initialScriptPaths = [
   'lib/Vue.js',
   'lib/katex/katex.min.js',
   'js/latex-renderer.js',
   'js/notation-registry.js',
   'js/ne-rewritten-notation-bundle.js',
   'js/notation-file-index.js',
   'js/notation-manifest.js',
]

const sourceScriptPaths = [
   'lib/Vue.js',
   'lib/xlsx.full.min.js',
   'lib/katex/katex.min.js',
   'js/latex-renderer.js',
   'js/notation-registry.js',
   'js/ne-rewritten-notation-bundle.js',
   'js/notation-file-index.js',
   'js/notation-manifest.js',
   'js/notation-loader.js',
]

// The optimized page embeds its startup CSS and runtime JavaScript. These
// source files are still copied selectively because the standalone-export
// feature reads them on demand when a user creates a standalone HTML file.
const standaloneCorePaths = [
   'css/index.css',
   'docs/making-a-notation.md',
   'js/diagram/Diagram.js',
   'js/framework.js',
   'js/latex-renderer.js',
   'js/ne-rewritten-notation-bundle.js',
   'js/notation-credits.js',
   'js/notation-display.js',
   'js/notation-menu.js',
   'js/notation-registry.js',
]

const pagesDocPaths = [
   'docs/bfs-diff.md',
   'docs/dfs-diff.md',
   'docs/example-PrSS.js',
   'docs/making-a-notation.md',
   'docs/notation-dev-guide.md',
   'docs/adr/0001-owner-aware-notation-registries.md',
   'docs/adr/0002-standalone-html-export.md',
]

function readProjectFile(relativePath) {
   return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function escapeRegExp(value) {
   return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeAttribute(value) {
   return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
}

function escapeClosingTag(source, tagName) {
   return source.replace(new RegExp('</' + tagName, 'gi'), '<\\/' + tagName)
}

function minifyJavaScript(source, sourcefile) {
   return esbuild.transformSync(source, {
      loader: 'js',
      sourcefile,
      target: 'es2018',
      charset: 'utf8',
      legalComments: 'none',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
   }).code.trim()
}

function minifyCss(source, sourcefile) {
   return esbuild.transformSync(source, {
      loader: 'css',
      sourcefile,
      target: 'es2018',
      charset: 'utf8',
      legalComments: 'none',
      minify: true,
   }).code.trim()
}

function pagesKatexCss(source) {
   // Pages publishes WOFF2 only. Removing the legacy fallbacks keeps the
   // generated stylesheet from advertising files that are not deployed.
   return source.replace(
      /,url\([^)]*\.woff\)\s*format\(["']woff["']\),url\([^)]*\.ttf\)\s*format\(["']truetype["']\)/g,
      ''
   )
}

function bundleScript(relativePath, source) {
   // Keep classic-script order and global bindings intact. A full module
   // bundle would change the registration contract used by notation files.
   return minifyJavaScript(source, relativePath)
}

function buildCatalog() {
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

   vm.runInContext(
      readProjectFile('js/ne-rewritten-notation-bundle.js'),
      context,
      { filename: 'js/ne-rewritten-notation-bundle.js' }
   )

   const catalog = manifest.map((file) => {
      const mainBefore = Loader.registrySnapshot(hub.main)
      const analysisBefore = Loader.registrySnapshot(hub.analysis)
      const relativePath = 'js/notations/' + file
      vm.runInContext(readProjectFile(relativePath), context, { filename: relativePath })
      return Loader.createCatalogEntry(
         file,
         Loader.appendedEntries(hub.main, mainBefore, file, 'main'),
         Loader.appendedEntries(hub.analysis, analysisBefore, file, 'analysis')
      )
   })

   return catalog.map((entry) => ({
      path: entry.path,
      directories: Array.from(entry.directories),
      fileName: entry.fileName,
      mainIds: Array.from(entry.mainIds),
      analysisIds: Array.from(entry.analysisIds),
   }))
}

function calculateBuildId(paths) {
   const hash = crypto.createHash('sha256')
   hash.update(BUILD_FORMAT_VERSION)
   hash.update('\0')
   paths.forEach((relativePath) => {
      hash.update(relativePath)
      hash.update('\0')
      hash.update(fs.readFileSync(path.join(projectRoot, relativePath)))
      hash.update('\0')
   })
   return hash.digest('hex').slice(0, 12)
}

function createRuntimeBundle(buildId, catalog) {
   const parts = []
   initialScriptPaths.forEach((relativePath) => {
      parts.push(bundleScript(relativePath, readProjectFile(relativePath)))
   })
   manifest.forEach((file) => {
      const relativePath = 'js/notations/' + file
      parts.push(bundleScript(relativePath, readProjectFile(relativePath)))
   })

   const workerSource = minifyJavaScript(
      readProjectFile('js/diagram/Diagram.js'),
      'js/diagram/Diagram.js'
   )
   parts.push(createRuntimeBootstrap(buildId, catalog, workerSource))
   parts.push(createDeferredXlsxBootstrap(buildId))

   Loader.APP_SCRIPTS.forEach((relativePath) => {
      parts.push(bundleScript(relativePath, readProjectFile(relativePath)))
   })

   return parts.filter(Boolean).join(os.EOL + ';' + os.EOL) + os.EOL
}

function createRuntimeBootstrap(buildId, catalog, workerSource) {
   const files = Array.from(manifest)
   const appScripts = Loader.APP_SCRIPTS.slice()
   return minifyJavaScript(`
;(function (root) {
   'use strict'

   var files = Object.freeze(${JSON.stringify(files)})
   var catalog = ${JSON.stringify(catalog)}.map(function (entry) {
      entry.directories = Object.freeze(entry.directories)
      entry.mainIds = Object.freeze(entry.mainIds)
      entry.analysisIds = Object.freeze(entry.analysisIds)
      return Object.freeze(entry)
   })

   function versioned(source) {
      return source + (source.indexOf('?') === -1 ? '?' : '&') +
         'v=' + encodeURIComponent(${JSON.stringify(buildId)})
   }

   function registrySnapshot(registry) {
      return Array.prototype.slice.call(registry)
   }

   function appendedEntries(registry, before, file, namespace) {
      if (registry.length < before.length) {
         throw new Error('Built-in notation file "' + file + '" removed ' + namespace + ' registrations.')
      }
      for (var index = 0; index < before.length; index++) {
         if (registry[index] !== before[index]) {
            throw new Error('Built-in notation file "' + file + '" reordered ' + namespace + ' registrations.')
         }
      }
      return Array.prototype.slice.call(registry, before.length)
   }

   function createCatalogEntry(file, mainEntries, analysisEntries) {
      var parts = file.split('/')
      var fileName = parts.pop()
      function ids(entries) {
         return Object.freeze(entries.map(function (entry) {
            return typeof entry === 'string' ? entry : entry.id
         }))
      }
      return Object.freeze({
         path: file,
         directories: Object.freeze(parts),
         fileName: fileName,
         mainIds: ids(mainEntries),
         analysisIds: ids(analysisEntries),
      })
   }

   function reportError(error) {
      if (root.console && typeof root.console.error === 'function') {
         root.console.error('Notation Explorer failed to start.', error)
      }
      if (!root.document) return
      var output = root.document.createElement('pre')
      output.className = 'notation-load-error'
      output.textContent = 'Notation Explorer failed to start: ' + (error && error.message || error)
      ;(root.document.body || root.document.documentElement).appendChild(output)
   }

   root.loadedBuiltinNotationFiles = files
   root.BUILTIN_NOTATION_CATALOG = Object.freeze(catalog)
   root.notationLoadReady = Promise.resolve(files.slice())
   root.NotationLoader = Object.freeze({
      NOTATION_ROOT: 'js/notations/',
      ASSET_VERSION: ${JSON.stringify(buildId)},
      APP_SCRIPTS: ${JSON.stringify(appScripts)},
      versioned: versioned,
      validatedFiles: function () { return files.slice() },
      registrySnapshot: registrySnapshot,
      appendedEntries: appendedEntries,
      createCatalogEntry: createCatalogEntry,
      start: function () { return root.notationLoadReady },
      reportError: reportError,
   })

   if (root.URL && root.Blob && typeof root.URL.createObjectURL === 'function') {
      root.NotationStandaloneWorkerURL = root.URL.createObjectURL(new root.Blob(
         [${JSON.stringify(workerSource)}],
         { type: 'text/javascript' }
      ))
   }
})(window)
`, 'generated/pages-runtime-bootstrap.js')
}

function createDeferredXlsxBootstrap(buildId) {
   return minifyJavaScript(`
;(function (root) {
   'use strict'
   var loading

   function loadXlsx() {
      if (root.XLSX) return Promise.resolve(root.XLSX)
      if (loading) return loading
      loading = new Promise(function (resolve, reject) {
         var script = root.document.createElement('script')
         script.src = 'lib/xlsx.full.min.js?v=' + encodeURIComponent(${JSON.stringify(buildId)})
         script.onload = function () { resolve(root.XLSX) }
         script.onerror = function () { reject(new Error('Failed to load the spreadsheet library.')) }
         ;(root.document.head || root.document.body).appendChild(script)
      })
      return loading
   }

   root.document.addEventListener('mousedown', function (event) {
      var target = event.target && event.target.nodeType === 1
         ? event.target.closest('[data-ne-xlsx-action]')
         : null
      if (!target || root.XLSX) return

      event.preventDefault()
      event.stopImmediatePropagation()
      target.setAttribute('aria-busy', 'true')
      loadXlsx().then(function () {
         target.removeAttribute('aria-busy')
         target.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: root,
            button: event.button,
            buttons: event.buttons,
            clientX: event.clientX,
            clientY: event.clientY,
         }))
      }).catch(function (error) {
         target.removeAttribute('aria-busy')
         if (root.NotationLoader) root.NotationLoader.reportError(error)
         else if (root.console) root.console.error(error)
      })
   }, true)
})(window)
`, 'generated/deferred-xlsx.js')
}

function removeSourceAssetTags(html) {
   inlineStylePaths.forEach((relativePath) => {
      const pattern = new RegExp(
         '[ \\t]*<link\\s+rel="stylesheet"\\s+type="text/css"\\s+href="' +
         escapeRegExp(relativePath) + '(?:\\?[^"\\s]*)?">\\r?\\n?',
         'g'
      )
      html = html.replace(pattern, '')
   })

   sourceScriptPaths.forEach((relativePath) => {
      const pattern = new RegExp(
         '[ \\t]*<script\\s+src="' + escapeRegExp(relativePath) +
         '(?:\\?[^"\\s]*)?"><\\/script>\\r?\\n?',
         'g'
      )
      html = html.replace(pattern, '')
   })
   return html
}

function createOptimizedHtml(buildId, catalog, options) {
   options = options || {}
   const bundlePath = options.bundlePath || runtimeBundlePath
   let html = removeSourceAssetTags(readProjectFile('index.html'))
   const katexCss = pagesKatexCss(readProjectFile('lib/katex/katex.min.css'))
      .replace(/url\((['"]?)fonts\//g, 'url($1lib/katex/fonts/')
   const css = minifyCss(
      katexCss + os.EOL + readProjectFile('css/index.css') +
         os.EOL + '#app:not([data-v-app]){visibility:hidden}',
      'generated/pages.css'
   )
   const styleTag = [
      '   <style data-ne-build-source="pages.css">',
      escapeClosingTag(css, 'style'),
      '   </style>',
      '   <link rel="icon" href="data:,">',
      '   <meta name="ne-pages-build" content="' + escapeAttribute(buildId) + '">',
      '   <script src="' + escapeAttribute(bundlePath) + '?v=' +
         encodeURIComponent(buildId) + '" defer data-ne-pages-runtime></script>',
   ].join(os.EOL)
   html = html.replace('</head>', styleTag + os.EOL + '</head>')

   const exportButton = '<button @mousedown="export_xlsx()">'
   const importButton = '<button @mousedown="import_xlsx()">'
   if (!html.includes(exportButton) || !html.includes(importButton)) {
      throw new Error('The XLSX import/export controls could not be identified in index.html.')
   }
   html = html
      .replace(exportButton, '<button data-ne-xlsx-action @mousedown="export_xlsx()">')
      .replace(importButton, '<button data-ne-xlsx-action @mousedown="import_xlsx()">')
   return html
}

function copyRuntimeFiles(outputRoot) {
   const copied = new Set()

   function copyFile(relativePath) {
      if (copied.has(relativePath)) return
      const source = path.join(projectRoot, relativePath)
      if (!fs.existsSync(source)) {
         throw new Error('Required Pages runtime asset is missing: ' + relativePath)
      }
      const destination = path.join(outputRoot, relativePath)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.copyFileSync(source, destination)
      copied.add(relativePath)
   }

   standaloneCorePaths.forEach(copyFile)
   pagesDocPaths.forEach(copyFile)
   manifest.forEach((file) => copyFile('js/notations/' + file))
   copyFile('lib/xlsx.full.min.js')

   // The optimized CSS is inlined in index.html, but standalone exports and
   // older integrations still read the source stylesheet. Keep that one file.
   // KaTeX fonts remain external and are requested only when a glyph needs one.
   fs.readdirSync(path.join(projectRoot, 'lib', 'katex', 'fonts'))
      .filter((file) => file.endsWith('.woff2'))
      .forEach((file) => copyFile('lib/katex/fonts/' + file))

   ;['CNAME', '404.html'].forEach((file) => {
      const source = path.join(projectRoot, file)
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outputRoot, file))
   })

   return copied.size
}

function buildPages(options) {
   options = options || {}
   const outputRoot = options.outputRoot || defaultOutputRoot
   const notationPaths = manifest.map((file) => 'js/notations/' + file)
   const hashedPaths = Array.from(new Set([
      'index.html',
      ...inlineStylePaths,
      ...initialScriptPaths,
      'js/diagram/Diagram.js',
      'lib/xlsx.full.min.js',
      ...notationPaths,
      ...Loader.APP_SCRIPTS,
   ]))
   const buildId = calculateBuildId(hashedPaths)
   const catalog = buildCatalog()
   const runtimeBundle = createRuntimeBundle(buildId, catalog)
   const html = createOptimizedHtml(buildId, catalog)

   fs.rmSync(outputRoot, { recursive: true, force: true })
   fs.mkdirSync(outputRoot, { recursive: true })
   const copiedRuntimeFiles = copyRuntimeFiles(outputRoot)
   const runtimeBundleOutput = path.join(outputRoot, runtimeBundlePath)
   fs.mkdirSync(path.dirname(runtimeBundleOutput), { recursive: true })
   fs.writeFileSync(runtimeBundleOutput, runtimeBundle)
   fs.writeFileSync(path.join(outputRoot, 'index.html'), html)
   fs.writeFileSync(path.join(outputRoot, '.nojekyll'), '')

   const metadata = {
      buildId,
      sourceInitialRequests:
         1 + inlineStylePaths.length + sourceScriptPaths.length +
         manifest.length + Loader.APP_SCRIPTS.length,
      sourceScriptRequests: sourceScriptPaths.length + manifest.length + Loader.APP_SCRIPTS.length,
      optimizedDefaultInitialRequests: 2,
      inlinedScripts: 0,
      bundledScripts: initialScriptPaths.length + manifest.length + Loader.APP_SCRIPTS.length + 2,
      runtimeBundlePath,
      runtimeBundleBytes: Buffer.byteLength(runtimeBundle),
      copiedRuntimeFiles,
      deferredScripts: ['lib/xlsx.full.min.js'],
      catalogEntries: catalog.length,
      outputBytes: Buffer.byteLength(html),
   }
   fs.writeFileSync(
      path.join(outputRoot, 'pages-build.json'),
      JSON.stringify(metadata, null, 2) + os.EOL
   )

   if (!options.quiet) {
      const sizeMiB = (metadata.outputBytes / 1024 / 1024).toFixed(2)
      const bundleMiB = (metadata.runtimeBundleBytes / 1024 / 1024).toFixed(2)
      process.stdout.write(
         'Built optimized GitHub Pages output in ' + path.relative(projectRoot, outputRoot) +
         ' (' + sizeMiB + ' MiB HTML + ' + bundleMiB + ' MiB runtime, build ' + buildId + ').' + os.EOL
      )
   }
   return metadata
}

if (require.main === module) buildPages()

module.exports = {
   buildPages,
   buildCatalog,
   createOptimizedHtml,
   createRuntimeBundle,
   defaultOutputRoot,
   initialScriptPaths,
   inlineStylePaths,
   runtimeBundlePath,
   standaloneCorePaths,
   pagesDocPaths,
}
