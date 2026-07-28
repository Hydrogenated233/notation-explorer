;(function (root, factory) {
   var api = factory(root)

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationLoader = api
   root.notationLoadReady = api.start()
   root.notationLoadReady.catch(api.reportError)
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
   'use strict'

   var NOTATION_ROOT = 'js/notations/'
   var ASSET_VERSION = 'ne-rewritten-native-5'
   var APP_SCRIPTS = [
      'js/diagram/Diagram.js',
      'js/notation-display.js',
      'js/notation-credits.js',
      'js/prss-template.js',
      'js/notation-editor.js',
      'js/markdown-renderer.js',
      'js/local-notation-runtime.js',
      'js/local-notation-ui.js',
      'js/notation-menu.js',
      'js/framework.js',
   ]
   var started

   function versioned(source) {
      return source + (source.indexOf('?') === -1 ? '?' : '&') +
         'v=' + encodeURIComponent(ASSET_VERSION)
   }

   function validatedFiles() {
      if (!root.NotationFileIndex) throw new Error('NotationFileIndex is not loaded.')
      if (!Array.isArray(root.BUILTIN_NOTATION_FILES)) {
         throw new Error('The built-in notation manifest is not loaded.')
      }

      var files = root.NotationFileIndex.sortPaths(root.BUILTIN_NOTATION_FILES)
      var seen = Object.create(null)
      files.forEach(function (file) {
         if (!root.NotationFileIndex.isEnabledPath(file)) {
            throw new Error('The notation manifest contains a non-JavaScript file: ' + file)
         }
         if (seen[file]) throw new Error('Duplicate notation manifest entry: ' + file)
         seen[file] = true
      })
      return files
   }

   function loadScript(source) {
      return new Promise(function (resolve, reject) {
         var script = root.document.createElement('script')
         var settled = false

         function cleanup() {
            if (root.removeEventListener) root.removeEventListener('error', handleRuntimeError)
         }

         function fail(error) {
            if (settled) return
            settled = true
            cleanup()
            reject(error)
         }

         function handleRuntimeError(event) {
            if (event.filename && script.src && event.filename !== script.src) return
            var detail = event.error && event.error.message || event.message || 'Unknown script error'
            fail(new Error('Failed to execute script "' + source + '": ' + detail))
         }

         script.src = source
         script.async = false
         script.onload = function () {
            if (settled) return
            settled = true
            cleanup()
            resolve(source)
         }
         script.onerror = function () { fail(new Error('Failed to load script: ' + source)) }
         if (root.addEventListener) root.addEventListener('error', handleRuntimeError)
         ;(root.document.body || root.document.head).appendChild(script)
      })
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

   function start() {
      if (started) return started
      started = Promise.resolve().then(async function () {
         var files = validatedFiles()
         root.loadedBuiltinNotationFiles = Object.freeze(files.slice())
         var catalog = []

         for (var index = 0; index < files.length; index++) {
            var mainBefore = registrySnapshot(root.register)
            var analysisBefore = registrySnapshot(root.analysis_register)
            await loadScript(versioned(NOTATION_ROOT + files[index]))
            catalog.push(createCatalogEntry(
               files[index],
               appendedEntries(root.register, mainBefore, files[index], 'main'),
               appendedEntries(root.analysis_register, analysisBefore, files[index], 'analysis')
            ))
         }
         root.BUILTIN_NOTATION_CATALOG = Object.freeze(catalog)
         for (var appIndex = 0; appIndex < APP_SCRIPTS.length; appIndex++) {
            await loadScript(versioned(APP_SCRIPTS[appIndex]))
         }
         return files
      })
      return started
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

   return {
      NOTATION_ROOT: NOTATION_ROOT,
      ASSET_VERSION: ASSET_VERSION,
      APP_SCRIPTS: APP_SCRIPTS.slice(),
      versioned: versioned,
      validatedFiles: validatedFiles,
      loadScript: loadScript,
      registrySnapshot: registrySnapshot,
      appendedEntries: appendedEntries,
      createCatalogEntry: createCatalogEntry,
      start: start,
      reportError: reportError,
   }
})
