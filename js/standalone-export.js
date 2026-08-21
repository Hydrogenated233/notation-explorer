;(function (root, factory) {
   var api = factory(root)

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.StandaloneExport = api
   api.captureAppTemplate()
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
   'use strict'

   var BUILTIN_OWNER = '@notation-explorer/builtin'
   var SHARED_FILES = Object.freeze(['00-shared-seq.js', '01-shared-matrix.js'])
   var DEFAULT_TITLE = 'Notation Explorer'
   var DEFAULT_FILE_NAME = 'notation-explorer-standalone.html'
   var DEFAULT_BASE_ESTIMATE = 1300000
   var CDN = Object.freeze({
      vue: 'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js',
      xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
      katex: 'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js',
      katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css',
   })
   var CORE_TEXT_ASSETS = Object.freeze({
      css: 'css/index.css',
      latexRenderer: 'js/latex-renderer.js',
      registry: 'js/notation-registry.js',
      rewrittenBundle: 'js/ne-rewritten-notation-bundle.js',
      notationDisplay: 'js/notation-display.js',
      notationCredits: 'js/notation-credits.js',
      notationMenu: 'js/notation-menu.js',
      framework: 'js/framework.js',
      worker: 'js/diagram/Diagram.js',
   })
   var capturedAppTemplate = ''

   function textByteLength(value) {
      value = String(value == null ? '' : value)
      if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length
      if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf8')
      return unescape(encodeURIComponent(value)).length
   }

   function toBase64(value) {
      value = String(value == null ? '' : value)
      if (typeof Buffer !== 'undefined' && typeof window === 'undefined') {
         return Buffer.from(value, 'utf8').toString('base64')
      }
      var bytes = new TextEncoder().encode(value)
      var chunks = []
      var size = 0x8000
      for (var offset = 0; offset < bytes.length; offset += size) {
         chunks.push(String.fromCharCode.apply(null, bytes.subarray(offset, offset + size)))
      }
      return btoa(chunks.join(''))
   }

   function escapeHtml(value) {
      return String(value == null ? '' : value)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
   }

   function captureAppTemplate() {
      if (capturedAppTemplate) return capturedAppTemplate
      if (!root || !root.document || typeof root.document.getElementById !== 'function') return ''
      var element = root.document.getElementById('app')
      if (element && element.outerHTML) capturedAppTemplate = element.outerHTML
      return capturedAppTemplate
   }

   function extractAppTemplate(indexHtml) {
      indexHtml = String(indexHtml || '')
      var startMatch = /<div\b[^>]*\bid=["']app["'][^>]*>/i.exec(indexHtml)
      if (!startMatch) throw new Error('The application template (#app) was not found in index.html.')
      var start = startMatch.index
      var tagPattern = /<\/?div\b[^>]*>/gi
      tagPattern.lastIndex = start
      var depth = 0
      var match
      while ((match = tagPattern.exec(indexHtml))) {
         if (/^<\/div/i.test(match[0])) depth--
         else depth++
         if (depth === 0) return indexHtml.slice(start, tagPattern.lastIndex)
      }
      throw new Error('The application template (#app) is not balanced.')
   }

   function prepareAppTemplate(template) {
      template = String(template || '')
      template = template.replace(
         /<standalone-export\b[^>]*>[\s\S]*?<\/standalone-export\s*>/gi,
         ''
      )
      template = template.replace(/<standalone-export\b[^>]*\/\s*>/gi, '')
      template = template.replace(/<div\b([^>]*\bid=["']app["'][^>]*)>/i, function (_, attrs) {
         if (/\bhidden\b/i.test(attrs)) return '<div' + attrs + '>'
         return '<div' + attrs + ' hidden data-ne-standalone="true">'
      })
      return template
   }

   function currentResourceSize(path) {
      if (!root || !root.performance || typeof root.performance.getEntriesByType !== 'function') return 0
      var entries = root.performance.getEntriesByType('resource') || []
      var normalized = String(path || '').replace(/\\/g, '/')
      for (var index = entries.length - 1; index >= 0; index--) {
         var name = String(entries[index].name || '').replace(/\\/g, '/')
         if (name.indexOf(normalized) === -1) continue
         return entries[index].decodedBodySize || entries[index].transferSize || 0
      }
      return 0
   }

   function generatedCategoryIdsForEntries(entries) {
      var result = []
      var seen = Object.create(null)
      ;(entries || []).forEach(function (notation) {
         var family = notation && (
            notation.generatedFamily || notation.generatorFamily || notation.upstreamGenerator
         )
         var id = family && family.categoryId
         if (typeof id === 'string' && id && !seen[id]) {
            seen[id] = true
            result.push(id)
         }
      })
      return result
   }

   function collectSelectionRecords(options) {
      options = options || {}
      var register = options.register || root.register
      var analysisRegister = options.analysisRegister || root.analysis_register
      var catalog = options.catalog || root.BUILTIN_NOTATION_CATALOG || []
      var manager = options.localManager === undefined ? root.localNotationManager : options.localManager
      var hub = options.hub || root.notationRegistryHub
      var records = []

      ;(catalog || []).forEach(function (entry, order) {
         if (!entry || SHARED_FILES.indexOf(entry.path) !== -1) return
         var mainEntries = (entry.mainIds || []).map(function (id) {
            return register && typeof register.get === 'function' ? register.get(id) : undefined
         }).filter(Boolean)
         var generatorIds = generatedCategoryIdsForEntries(mainEntries)
         var currentMainIds = (entry.mainIds || []).slice()
         if (register && generatorIds.length) {
            register.forEach(function (notation) {
               var family = notation && (
                  notation.generatedFamily || notation.generatorFamily || notation.upstreamGenerator
               )
               if (family && generatorIds.indexOf(family.categoryId) !== -1 &&
                  currentMainIds.indexOf(notation.id) === -1) {
                  currentMainIds.push(notation.id)
               }
            })
         }
         records.push({
            key: 'builtin:' + entry.path,
            kind: 'builtin',
            ownerId: BUILTIN_OWNER,
            path: entry.path,
            sourcePath: 'js/notations/' + entry.path,
            directories: (entry.directories || []).slice(),
            fileName: entry.fileName || entry.path.split('/').pop(),
            mainIds: (entry.mainIds || []).slice(),
            currentMainIds: currentMainIds,
            analysisIds: (entry.analysisIds || []).slice(),
            generatorIds: generatorIds,
            order: order,
            estimatedBytes: currentResourceSize('js/notations/' + entry.path) || 16000,
         })
      })

      if (!manager || typeof manager.listFiles !== 'function') return records
      var files = manager.listFiles()
      ;(files || []).forEach(function (file) {
         if (!file || !file.enabled || !file.trusted || file.lastError) return
         if (Number.isSafeInteger(file.sourceRevision) && Number.isSafeInteger(file.loadedRevision) &&
            file.loadedRevision !== file.sourceRevision) return
         var mainEntries = register && typeof register.entriesForOwner === 'function'
            ? register.entriesForOwner(file.id) : []
         var analysisEntries = analysisRegister && typeof analysisRegister.entriesForOwner === 'function'
            ? analysisRegister.entriesForOwner(file.id) : []
         var generators = hub && typeof hub.generatorDefinitions === 'function'
            ? hub.generatorDefinitions().filter(function (family) { return family.owner === file.id })
            : []
         if (!mainEntries.length && !analysisEntries.length && !generators.length) return
         records.push({
            key: 'local:' + file.id,
            kind: 'local',
            ownerId: file.id,
            path: file.name,
            sourcePath: '',
            directories: ['@local'],
            fileName: file.name,
            mainIds: mainEntries.map(function (entry) { return entry.id }),
            currentMainIds: mainEntries.map(function (entry) { return entry.id }),
            analysisIds: analysisEntries.map(function (entry) { return entry.id }),
            generatorIds: generators.map(function (family) { return family.id }),
            source: file.source,
            sourceRevision: file.sourceRevision,
            loadedRevision: file.loadedRevision,
            order: file.order,
            estimatedBytes: textByteLength(file.source || ''),
         })
      })
      return records
   }

   function recordSearchText(record, register, analysisRegister) {
      var labels = [record.path, record.fileName]
      ;(record.mainIds || []).forEach(function (id) {
         var notation = register && typeof register.get === 'function' ? register.get(id) : undefined
         labels.push(id, notation && notation.name)
      })
      ;(record.analysisIds || []).forEach(function (id) {
         var notation = analysisRegister && typeof analysisRegister.get === 'function'
            ? analysisRegister.get(id) : undefined
         labels.push(id, notation && notation.name)
      })
      return labels.filter(Boolean).join(' ').toLowerCase()
   }

   function recordFileLabel(record) {
      if (!record) return ''
      return record.kind === 'local' ? 'Local/' + record.fileName : String(record.path || record.fileName || '')
   }

   function downloadNameForLabel(label) {
      var name = String(label || 'notation.js')
         .replace(/[\\/]+/g, '__')
         .replace(/[<>:"|?*\u0000-\u001f]/g, '-')
         .trim()
      return name || 'notation.js'
   }

   function downloadFileDescriptor(record, source) {
      var label = recordFileLabel(record)
      return {
         label: label,
         downloadName: downloadNameForLabel(label),
         source: toBase64(source),
      }
   }

   function uniqueDownloadName(name, used) {
      name = String(name || 'notation.js')
      if (!used[name]) {
         used[name] = true
         return name
      }
      var extensionIndex = name.lastIndexOf('.')
      var stem = extensionIndex > 0 ? name.slice(0, extensionIndex) : name
      var extension = extensionIndex > 0 ? name.slice(extensionIndex) : ''
      var suffix = 2
      var candidate
      do {
         candidate = stem + '__' + suffix++ + extension
      } while (used[candidate])
      used[candidate] = true
      return candidate
   }

   function downloadFileDescriptors(records, sources) {
      var used = Object.create(null)
      return (records || []).map(function (record) {
         var descriptor = downloadFileDescriptor(record, sources && sources[record.key])
         descriptor.downloadName = uniqueDownloadName(descriptor.downloadName, used)
         return descriptor
      })
   }

   function estimateSelectionBytes(records) {
      return Math.round(DEFAULT_BASE_ESTIMATE + (records || []).reduce(function (sum, record) {
         return sum + Math.ceil((record.estimatedBytes || 16000) * 4 / 3)
      }, 0))
   }

   function defaultReadText(path) {
      if (!root || typeof root.fetch !== 'function') {
         return Promise.reject(new Error('Fetch is unavailable while reading ' + path + '.'))
      }
      var url = root.document && root.document.baseURI
         ? new URL(path, root.document.baseURI).href : path
      return root.fetch(url, { cache: 'no-store' }).then(function (response) {
         if (!response.ok) throw new Error('HTTP ' + response.status + ' while reading ' + path + '.')
         return response.text()
      })
   }

   function containsQuotedIdentifier(source, id) {
      source = String(source || '')
      id = String(id || '')
      return source.indexOf("'" + id + "'") !== -1 ||
         source.indexOf('"' + id + '"') !== -1 ||
         source.indexOf('`' + id + '`') !== -1
   }

   async function resolveDependencies(selected, available, sources, readText, progress) {
      var selectedKeys = Object.create(null)
      var recordByKey = Object.create(null)
      var idOwners = Object.create(null)
      var queue = []
      var dependencies = []

      ;(available || []).forEach(function (record) {
         recordByKey[record.key] = record
         if (record.kind !== 'builtin') return
         ;(record.mainIds || []).concat(record.analysisIds || []).forEach(function (id) {
            if (!idOwners[id]) idOwners[id] = record
         })
      })
      ;(selected || []).forEach(function (record) {
         selectedKeys[record.key] = true
         queue.push(record)
      })

      for (var queueIndex = 0; queueIndex < queue.length; queueIndex++) {
         var record = queue[queueIndex]
         var source = sources[record.key]
         if (source === undefined) {
            source = record.kind === 'local' ? record.source : await readText(record.sourcePath)
            sources[record.key] = source
         }
         var ids = Object.keys(idOwners)
         for (var idIndex = 0; idIndex < ids.length; idIndex++) {
            var dependency = idOwners[ids[idIndex]]
            if (selectedKeys[dependency.key] || dependency.key === record.key) continue
            if (!containsQuotedIdentifier(source, ids[idIndex])) continue
            selectedKeys[dependency.key] = true
            dependencies.push(dependency)
            queue.push(dependency)
            if (progress) progress(dependency)
         }
         ;(record.dependencies || []).forEach(function (key) {
            var dependency = recordByKey[key] || (available || []).find(function (candidate) {
               return candidate.path === key
            })
            if (!dependency || selectedKeys[dependency.key]) return
            selectedKeys[dependency.key] = true
            dependencies.push(dependency)
            queue.push(dependency)
         })
      }
      return dependencies
   }

   function notationIdFromDataKey(key) {
      var index = String(key || '').lastIndexOf('::')
      return index === -1 ? String(key || '') : String(key).slice(index + 2)
   }

   function filterMapByNotation(value, allowedIds) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value
      var result = {}
      Object.keys(value).forEach(function (key) {
         if (allowedIds.has(notationIdFromDataKey(key))) result[key] = value[key]
      })
      return result
   }

   function safeJson(raw) {
      if (typeof raw !== 'string' || !raw) return undefined
      try { return JSON.parse(raw) } catch (error) { return undefined }
   }

   function filterSnapshot(snapshot, records, fallbackMainId) {
      snapshot = snapshot || {}
      var allowedMainIds = new Set()
      var allowedAnalysisIds = new Set()
      var allowedGeneratorIds = new Set()
      ;(records || []).forEach(function (record) {
         ;(record.currentMainIds || record.mainIds || []).forEach(function (id) { allowedMainIds.add(id) })
         ;(record.analysisIds || []).forEach(function (id) { allowedAnalysisIds.add(id) })
         ;(record.generatorIds || []).forEach(function (id) { allowedGeneratorIds.add(id) })
      })

      var result = {}
      var analysis = safeJson(snapshot['ne-analysis'])
      if (analysis && analysis.notations) {
         analysis.notations = filterMapByNotation(analysis.notations, allowedMainIds)
         analysis.noteSheets = filterMapByNotation(analysis.noteSheets || {}, allowedMainIds)
         result['ne-analysis'] = JSON.stringify(analysis)
      }

      var config = safeJson(snapshot['ne-config'])
      if (config) {
         config.equivActive = filterMapByNotation(config.equivActive || {}, allowedMainIds)
         config.equivHideOriginal = filterMapByNotation(config.equivHideOriginal || {}, allowedMainIds)
         var generatorState = {}
         Object.keys(config.generatorState || {}).forEach(function (id) {
            if (allowedGeneratorIds.has(id)) generatorState[id] = config.generatorState[id]
         })
         config.generatorState = generatorState
         if (!allowedMainIds.has(config.mainId)) {
            config.mainId = fallbackMainId && allowedMainIds.has(fallbackMainId)
               ? fallbackMainId : Array.from(allowedMainIds)[0] || ''
         }
         if (!allowedAnalysisIds.has(config.analysisId)) config.analysisId = ''
         result['ne-config'] = JSON.stringify(config)
      }
      if (typeof snapshot['ne-summary-pos'] === 'string') {
         result['ne-summary-pos'] = snapshot['ne-summary-pos']
      }
      return result
   }

   function uniqueBundleId() {
      var random = ''
      if (root && root.crypto && typeof root.crypto.getRandomValues === 'function') {
         var values = new Uint32Array(4)
         root.crypto.getRandomValues(values)
         random = Array.prototype.map.call(values, function (value) {
            return value.toString(16).padStart(8, '0')
         }).join('')
      } else {
         random = Date.now().toString(36) + Math.random().toString(36).slice(2)
      }
      return 'ne-' + random
   }

   function loaderStyles() {
      return [
         '#ne-standalone-loader{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#f7f8fa;color:#20242b;font:14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
         '#ne-standalone-loader .ne-sl-card{width:min(420px,calc(100vw - 40px));padding:24px;border:1px solid #d8dde5;border-radius:8px;background:#fff;box-shadow:0 12px 36px rgba(19,31,48,.09)}',
         '#ne-standalone-loader h1{margin:0 0 14px;font-size:18px;font-weight:600}',
         '#ne-standalone-loader .ne-sl-track{height:6px;overflow:hidden;border-radius:999px;background:#e6e9ee}',
         '#ne-standalone-loader .ne-sl-bar{display:block;width:0;height:100%;border-radius:inherit;background:#3978c5;transition:width .18s ease}',
         '#ne-standalone-loader .ne-sl-status{min-height:21px;margin:12px 0 0;color:#596273}',
         '#ne-standalone-loader .ne-sl-error{display:none;margin:12px 0 0;white-space:pre-wrap;color:#a53131}',
         '#ne-standalone-loader .ne-sl-retry{display:none;margin-top:14px;padding:6px 14px;border:1px solid #b7bec9;border-radius:4px;background:#fff;color:#20242b;cursor:pointer}',
         '@media(prefers-color-scheme:dark){#ne-standalone-loader{background:#15171a;color:#e6e8eb}#ne-standalone-loader .ne-sl-card{border-color:#3a3e45;background:#202328;box-shadow:none}#ne-standalone-loader .ne-sl-track{background:#343840}#ne-standalone-loader .ne-sl-status{color:#abb2bd}#ne-standalone-loader .ne-sl-retry{border-color:#555b65;background:#292d33;color:#e6e8eb}}',
      ].join('')
   }

   function standaloneBootstrap(payload) {
      'use strict'

      var loader = document.getElementById('ne-standalone-loader')
      var bar = loader.querySelector('.ne-sl-bar')
      var status = loader.querySelector('.ne-sl-status')
      var errorOutput = loader.querySelector('.ne-sl-error')
      var retry = loader.querySelector('.ne-sl-retry')
      var running = false

      function decode(base64) {
         var binary = atob(base64 || '')
         var bytes = new Uint8Array(binary.length)
         for (var index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
         return new TextDecoder().decode(bytes)
      }

      function update(percent, label) {
         bar.style.width = Math.max(0, Math.min(100, percent)) + '%'
         status.textContent = label
      }

      function loadScript(url, globalName, label) {
         if (globalName && window[globalName]) return Promise.resolve()
         return new Promise(function (resolve, reject) {
            var script = document.createElement('script')
            script.src = url
            script.async = true
            script.onload = function () {
               if (globalName && !window[globalName]) {
                  reject(new Error(label + ' loaded without exposing ' + globalName + '.'))
                  return
               }
               resolve()
            }
            script.onerror = function () { reject(new Error('Unable to load ' + label + ' from jsDelivr.')) }
            document.head.appendChild(script)
         })
      }

      function loadStyle(url) {
         var existing = document.querySelector('link[data-ne-standalone-katex]')
         if (existing && existing.sheet) return Promise.resolve()
         if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
         return new Promise(function (resolve, reject) {
            var link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = url
            link.setAttribute('data-ne-standalone-katex', 'true')
            link.onload = function () { resolve() }
            link.onerror = function () { reject(new Error('Unable to load KaTeX styles from jsDelivr.')) }
            document.head.appendChild(link)
         })
      }

      function execute(source, name) {
         var thrown
         function capture(event) {
            if (!thrown) thrown = event.error || new Error(event.message || ('Failed to execute ' + name + '.'))
         }
         window.addEventListener('error', capture)
         var script = document.createElement('script')
         script.textContent = source + '\n//# sourceURL=' + String(name || 'standalone-inline.js').replace(/[\r\n\u2028\u2029]/g, '')
         document.head.appendChild(script)
         window.removeEventListener('error', capture)
         if (script.parentNode) script.parentNode.removeChild(script)
         if (thrown) throw thrown
      }

      function appended(registry, before, file, namespace) {
         if (registry.length < before.length) throw new Error(file + ' removed ' + namespace + ' registrations.')
         for (var index = 0; index < before.length; index++) {
            if (registry[index] !== before[index]) throw new Error(file + ' reordered ' + namespace + ' registrations.')
         }
         return Array.prototype.slice.call(registry, before.length)
      }

      function catalogRecord(file, mainEntries, analysisEntries) {
         return Object.freeze({
            path: file.path,
            directories: Object.freeze((file.directories || []).slice()),
            fileName: file.fileName,
            mainIds: Object.freeze(mainEntries.map(function (entry) { return entry.id })),
            analysisIds: Object.freeze(analysisEntries.map(function (entry) { return entry.id })),
         })
      }

      function storageAdapter() {
         var memory = Object.create(null)
         var prefix = 'ne-standalone:' + payload.bundleId + ':'
         var nativeStorage
         try {
            nativeStorage = window.localStorage
            var probe = prefix + '@probe'
            nativeStorage.setItem(probe, '1')
            nativeStorage.removeItem(probe)
         } catch (error) {
            nativeStorage = null
         }

         function read(key) {
            if (!nativeStorage) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null
            return nativeStorage.getItem(prefix + key)
         }
         function write(key, value) {
            value = String(value)
            if (!nativeStorage) memory[key] = value
            else nativeStorage.setItem(prefix + key, value)
         }
         function remove(key) {
            if (!nativeStorage) delete memory[key]
            else nativeStorage.removeItem(prefix + key)
         }
         if (read('@seeded') !== '1') {
            Object.keys(payload.snapshot || {}).forEach(function (key) {
               if (read(key) === null) write(key, decode(payload.snapshot[key]))
            })
            write('@seeded', '1')
         }
         return { getItem: read, setItem: write, removeItem: remove }
      }

      function installLocalFiles() {
         var initialData = new Map()
         var files = []
         ;(payload.localFiles || []).forEach(function (file, index) {
            var transaction = window.notationRegistryHub.prepareSource(
               file.ownerId,
               decode(notationFileSource(file)),
               { sourceURL: file.fileName, ownerOrder: file.order === undefined ? index : file.order }
            )
            var change = transaction.commit()
            ;(change.main.initialData || []).forEach(function (prepared) {
               initialData.set(prepared.id, prepared.items)
            })
            files.push(Object.freeze({
               id: file.ownerId,
               name: file.fileName,
               enabled: true,
               trusted: true,
               sourceRevision: file.sourceRevision,
               loadedRevision: file.loadedRevision,
               order: file.order,
               manifest: Object.freeze({
                  main: change.main.added.map(function (entry) { return entry.id }),
                  analysis: change.analysis.added.map(function (entry) { return entry.id }),
               }),
            }))
         })
         window.localNotationManager = {
            storageError: null,
            bootErrors: [],
            listFiles: function () { return files.slice() },
            getFile: function (id) {
               return files.find(function (file) { return file.id === id })
            },
            initialItemsFor: function (id) { return initialData.get(id) },
         }
      }

      function notationFileSource(file) {
         if (file && typeof file.source === 'string') return file.source
         var downloadIndex = file && file.downloadIndex
         var downloadFile = typeof downloadIndex === 'number' && payload.downloadFiles
            ? payload.downloadFiles[downloadIndex] : undefined
         return downloadFile && downloadFile.source || ''
      }

      function readonlyManagerComponent() {
         function safeDownloadName(label) {
            return String(label || 'notation.js')
               .replace(/[\\/]+/g, '__')
               .replace(/[<>:"|?*\u0000-\u001f]/g, '-')
               .trim() || 'notation.js'
         }

         return {
            name: 'StandaloneBundledFiles',
            data: function () {
               var files = Array.isArray(payload.downloadFiles) ? payload.downloadFiles : []
               if (!files.length) {
                  files = (payload.fileLabels || []).map(function (label) {
                     return { label: label, downloadName: safeDownloadName(label), source: '' }
                  })
               }
               return { files: files }
            },
            computed: {
               zh: function () { return this.$root && this.$root.lang === 'zh' },
            },
            methods: {
               downloadLabel: function (file) {
                  return (this.zh ? '下载 ' : 'Download ') + (file && file.label || '')
               },
               downloadFile: function (file) {
                  if (!file || !file.source || typeof Blob !== 'function') return
                  var urlApi = window.URL || window.webkitURL
                  if (!urlApi || typeof urlApi.createObjectURL !== 'function') return
                  var source = decode(file.source)
                  var blob = new Blob([source], { type: 'text/javascript;charset=utf-8' })
                  var url = urlApi.createObjectURL(blob)
                  var anchor = document.createElement('a')
                  anchor.href = url
                  anchor.download = file.downloadName || safeDownloadName(file.label)
                  document.body.appendChild(anchor)
                  anchor.click()
                  anchor.remove()
                  setTimeout(function () {
                     if (typeof urlApi.revokeObjectURL === 'function') urlApi.revokeObjectURL(url)
                  }, 1000)
               },
            },
            template: '<section class="ne-standalone-readonly"><h3>{{ zh ? "独立应用" : "Standalone application" }}</h3><p>{{ zh ? "此导出版本中的记号文件固定，不能上传、编辑或再次导出独立 HTML；可下载导出时嵌入的源码副本。" : "Notation files are fixed in this export and cannot be uploaded, edited, or used to export another standalone HTML; the embedded source copies can be downloaded." }}</p><details><summary>{{ zh ? "包含的记号文件" : "Bundled notation files" }} ({{ files.length }})</summary><ul class="ne-standalone-readonly__files"><li v-for="file in files" :key="file.downloadName || file.label" class="ne-standalone-readonly__file"><span class="ne-standalone-readonly__file-label">{{ file.label }}</span><button type="button" class="ne-standalone-readonly__download" :disabled="!file.source" :aria-label="downloadLabel(file)" @click="downloadFile(file)">{{ zh ? "下载" : "Download" }}</button></li></ul></details></section>',
         }
      }

      async function start() {
         if (running) return
         running = true
         retry.style.display = 'none'
         errorOutput.style.display = 'none'
         errorOutput.textContent = ''
         try {
            update(4, 'Loading KaTeX styles...')
            await loadStyle(payload.cdn.katexCss)
            update(10, 'Loading third-party libraries...')
            var libraryProgress = 0
            await Promise.all([
               loadScript(payload.cdn.vue, 'Vue', 'Vue').then(function () { update(10 + (++libraryProgress * 8), 'Loading third-party libraries...') }),
               loadScript(payload.cdn.xlsx, 'XLSX', 'XLSX').then(function () { update(10 + (++libraryProgress * 8), 'Loading third-party libraries...') }),
               loadScript(payload.cdn.katex, 'katex', 'KaTeX').then(function () { update(10 + (++libraryProgress * 8), 'Loading third-party libraries...') }),
            ])

            update(38, 'Preparing notation runtime...')
            execute(decode(payload.core.latexRenderer), 'js/latex-renderer.js')
            execute(decode(payload.core.registry), 'js/notation-registry.js')
            execute(decode(payload.core.rewrittenBundle), 'js/ne-rewritten-notation-bundle.js')

            update(48, 'Loading shared notation helpers...')
            ;(payload.sharedFiles || []).forEach(function (file) {
               execute(decode(file.source), 'js/notations/' + file.path)
            })

            var catalog = []
            var builtinFiles = payload.builtinFiles || []
            for (var fileIndex = 0; fileIndex < builtinFiles.length; fileIndex++) {
               var file = builtinFiles[fileIndex]
               var mainBefore = Array.prototype.slice.call(window.register)
               var analysisBefore = Array.prototype.slice.call(window.analysis_register)
               execute(decode(file.source), 'js/notations/' + file.path)
               catalog.push(catalogRecord(
                  file,
                  appended(window.register, mainBefore, file.path, 'main'),
                  appended(window.analysis_register, analysisBefore, file.path, 'analysis')
               ))
               update(52 + Math.round((fileIndex + 1) / Math.max(1, builtinFiles.length) * 20), 'Loading notation files...')
            }
            window.loadedBuiltinNotationFiles = Object.freeze(builtinFiles.map(function (file) { return file.path }))
            window.BUILTIN_NOTATION_CATALOG = Object.freeze(catalog)

            update(76, 'Preparing application modules...')
            execute(decode(payload.core.notationDisplay), 'js/notation-display.js')
            execute(decode(payload.core.notationCredits), 'js/notation-credits.js')
            execute(decode(payload.core.notationMenu), 'js/notation-menu.js')
            installLocalFiles()
            window.NotationStorage = storageAdapter()
            window.NotationStandalone = Object.freeze({
               bundleId: payload.bundleId,
               files: (payload.fileLabels || []).slice(),
               downloadFiles: (payload.downloadFiles || []).slice(),
            })
            window.LocalNotationManagerComponent = readonlyManagerComponent()

            var workerBlob = new Blob([decode(payload.core.worker)], { type: 'text/javascript' })
            window.NotationStandaloneWorkerURL = URL.createObjectURL(workerBlob)
            window.addEventListener('unload', function () {
               URL.revokeObjectURL(window.NotationStandaloneWorkerURL)
            }, { once: true })

            update(88, 'Starting Notation Explorer...')
            execute(decode(payload.core.framework), 'js/framework.js')
            var app = document.getElementById('app')
            if (!app || !app.hasAttribute('data-v-app')) {
               throw new Error('Notation Explorer did not mount successfully.')
            }
            app.hidden = false
            update(100, 'Ready')
            setTimeout(function () {
               if (loader && loader.parentNode) loader.parentNode.removeChild(loader)
            }, 120)
         } catch (error) {
            console.error('Standalone Notation Explorer failed to start.', error)
            status.textContent = 'Unable to start the standalone application.'
            errorOutput.textContent = error && (error.stack || error.message) || String(error)
            errorOutput.style.display = 'block'
            retry.style.display = 'inline-block'
         } finally {
            running = false
         }
      }

      retry.addEventListener('click', function () { window.location.reload() })
      start()
   }

   function htmlDocument(options) {
      var title = options.title || DEFAULT_TITLE
      var css = String(options.css || '').replace(/<\/style/gi, '<\\/style')
      var payloadJson = JSON.stringify(options.payload).replace(/</g, '\\u003c')
      var bootstrap = '(' + standaloneBootstrap.toString() + ')(' + payloadJson + ');'
      return '<!DOCTYPE html>\n' +
         '<html lang="zh-CN">\n<head>\n' +
         '   <meta charset="UTF-8">\n' +
         '   <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
         '   <meta name="generator" content="Notation Explorer standalone export">\n' +
         '   <title>' + escapeHtml(title) + '</title>\n' +
         '   <style>' + loaderStyles() + '</style>\n' +
         '   <style>' + css + '</style>\n' +
         '</head>\n<body>\n' +
         '   <div id="ne-standalone-loader" role="status" aria-live="polite">\n' +
         '      <div class="ne-sl-card">\n' +
         '         <h1>' + escapeHtml(title) + '</h1>\n' +
         '         <div class="ne-sl-track" aria-hidden="true"><span class="ne-sl-bar"></span></div>\n' +
         '         <p class="ne-sl-status">Preparing standalone application...</p>\n' +
         '         <pre class="ne-sl-error"></pre>\n' +
         '         <button type="button" class="ne-sl-retry">Retry</button>\n' +
         '      </div>\n' +
         '   </div>\n' +
         options.appTemplate + '\n' +
         '   <script>' + bootstrap.replace(/<\/script/gi, '<\\/script') + '<\/script>\n' +
         '</body>\n</html>\n'
   }

   async function buildStandalone(options) {
      options = options || {}
      var selected = (options.selectedRecords || []).slice()
      if (!selected.length) throw new Error('Select at least one notation file.')
      var available = (options.availableRecords || selected).slice()
      var readText = options.readText || defaultReadText
      var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {}
      var sources = Object.create(null)
      var title = String(options.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE
      var bundleId = String(options.bundleId || uniqueBundleId()).replace(/[^0-9A-Za-z._-]/g, '-')
      var fallbackMainId = selected.reduce(function (id, record) {
         return id || (record.currentMainIds || record.mainIds || [])[0] || ''
      }, '')

      onProgress({ progress: 0.02, label: 'Preparing export...' })
      var appTemplate = options.appTemplate || capturedAppTemplate
      var coreKeys = Object.keys(CORE_TEXT_ASSETS)
      var completedCore = 0
      var coreValues = await Promise.all(coreKeys.map(function (key) {
         return readText(CORE_TEXT_ASSETS[key]).then(function (value) {
            completedCore++
            onProgress({
               progress: 0.04 + completedCore / coreKeys.length * 0.3,
               label: 'Reading application assets (' + completedCore + '/' + coreKeys.length + ')...',
            })
            return value
         })
      }))
      var core = {}
      coreKeys.forEach(function (key, index) { core[key] = coreValues[index] })
      if (!appTemplate) appTemplate = extractAppTemplate(await readText('index.html'))

      var selectedCompleted = 0
      await Promise.all(selected.map(function (record) {
         var sourcePromise = record.kind === 'local'
            ? Promise.resolve(record.source || '') : readText(record.sourcePath)
         return sourcePromise.then(function (source) {
            sources[record.key] = source
            selectedCompleted++
            onProgress({
               progress: 0.36 + selectedCompleted / selected.length * 0.2,
               label: 'Reading selected notation files (' + selectedCompleted + '/' + selected.length + ')...',
            })
         })
      }))

      var dependencies = await resolveDependencies(
         selected,
         available,
         sources,
         readText,
         function (record) {
            onProgress({ progress: 0.59, label: 'Adding dependency ' + record.path + '...' })
         }
      )
      var included = selected.concat(dependencies)
      var builtin = included.filter(function (record) { return record.kind === 'builtin' })
         .sort(function (left, right) { return left.order - right.order })
      var local = included.filter(function (record) { return record.kind === 'local' })
         .sort(function (left, right) { return left.order - right.order })

      var dependencyCompleted = 0
      await Promise.all(dependencies.map(function (record) {
         if (sources[record.key] !== undefined) return Promise.resolve()
         return readText(record.sourcePath).then(function (source) {
            sources[record.key] = source
            dependencyCompleted++
            onProgress({
               progress: 0.6 + dependencyCompleted / Math.max(1, dependencies.length) * 0.08,
               label: 'Reading automatic dependencies...',
            })
         })
      }))

      var sharedSources = await Promise.all(SHARED_FILES.map(function (file) {
         return readText('js/notations/' + file)
      }))
      onProgress({ progress: 0.72, label: 'Preparing standalone startup...' })

      var rawSnapshot = options.includeData ? (options.snapshot || {}) : {}
      var snapshot = options.includeData
         ? filterSnapshot(rawSnapshot, included, fallbackMainId) : {}
      var downloadFiles = downloadFileDescriptors(included, sources)
      var downloadIndexByKey = Object.create(null)
      included.forEach(function (record, index) { downloadIndexByKey[record.key] = index })
      var payload = {
         version: 1,
         bundleId: bundleId,
         cdn: CDN,
         core: {
            latexRenderer: toBase64(core.latexRenderer),
            registry: toBase64(core.registry),
            rewrittenBundle: toBase64(core.rewrittenBundle),
            notationDisplay: toBase64(core.notationDisplay),
            notationCredits: toBase64(core.notationCredits),
            notationMenu: toBase64(core.notationMenu),
            framework: toBase64(core.framework),
            worker: toBase64(core.worker),
         },
         sharedFiles: SHARED_FILES.map(function (file, index) {
            return { path: file, source: toBase64(sharedSources[index]) }
         }),
         builtinFiles: builtin.map(function (record) {
            return {
               path: record.path,
               directories: record.directories,
               fileName: record.fileName,
               downloadIndex: downloadIndexByKey[record.key],
            }
         }),
         localFiles: local.map(function (record) {
            return {
               ownerId: record.ownerId,
               fileName: record.fileName,
               sourceRevision: record.sourceRevision,
               loadedRevision: record.loadedRevision,
               order: record.order,
               downloadIndex: downloadIndexByKey[record.key],
            }
         }),
         snapshot: Object.keys(snapshot).reduce(function (result, key) {
            result[key] = toBase64(snapshot[key])
            return result
         }, {}),
         fileLabels: included.map(recordFileLabel),
         downloadFiles: downloadFiles,
      }
      var html = htmlDocument({
         title: title,
         css: core.css,
         payload: payload,
         appTemplate: prepareAppTemplate(appTemplate),
      })
      onProgress({ progress: 1, label: 'Standalone application ready.' })
      return {
         html: html,
         bundleId: bundleId,
         includedRecords: included,
         dependencies: dependencies,
         estimatedBytes: textByteLength(html),
      }
   }

   return {
      BUILTIN_OWNER: BUILTIN_OWNER,
      SHARED_FILES: SHARED_FILES,
      CDN: CDN,
      CORE_TEXT_ASSETS: CORE_TEXT_ASSETS,
      DEFAULT_TITLE: DEFAULT_TITLE,
      DEFAULT_FILE_NAME: DEFAULT_FILE_NAME,
      captureAppTemplate: captureAppTemplate,
      extractAppTemplate: extractAppTemplate,
      prepareAppTemplate: prepareAppTemplate,
      collectSelectionRecords: collectSelectionRecords,
      recordSearchText: recordSearchText,
      recordFileLabel: recordFileLabel,
      downloadNameForLabel: downloadNameForLabel,
      downloadFileDescriptor: downloadFileDescriptor,
      downloadFileDescriptors: downloadFileDescriptors,
      estimateSelectionBytes: estimateSelectionBytes,
      containsQuotedIdentifier: containsQuotedIdentifier,
      resolveDependencies: resolveDependencies,
      filterSnapshot: filterSnapshot,
      buildStandalone: buildStandalone,
      textByteLength: textByteLength,
      toBase64: toBase64,
   }
})
