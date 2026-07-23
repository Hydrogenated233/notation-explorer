;(function (root) {
   'use strict'

   var RegistryRuntime = root.NotationRegistryRuntime
   var hub = root.notationRegistryHub
   if (!RegistryRuntime || !hub) throw new Error('Notation registry runtime must load first.')

   function unique(values) {
      var seen = new Set()
      return (values || []).filter(function (value) {
         if (typeof value !== 'string' || seen.has(value)) return false
         seen.add(value)
         return true
      })
   }

   function escapeRegExp(value) {
      return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
   }

   function errorDetails(error, sourceName) {
      var causeStack = error && error.cause && error.cause.stack || ''
      var stack = causeStack || error && error.stack || ''
      var location = null
      if (causeStack && sourceName) {
         var safeName = String(sourceName).replace(/[\r\n\u2028\u2029]/g, '')
         location = causeStack.match(new RegExp(
            '(?:^|[\\s(])' + escapeRegExp(safeName) + ':(\\d+):(\\d+)\\)?',
            'm'
         ))
      }
      return {
         code: error && error.code || 'UNKNOWN_ERROR',
         message: error && error.message || String(error || 'Unknown error'),
         line: location ? Math.max(1, Number(location[1]) - 2) : null,
         column: location ? Number(location[2]) : null,
         stack: stack,
         at: Date.now(),
      }
   }

   function filePatchFromChange(file, change, extra) {
      var mainIds = change.main.added.map(function (entry) { return entry.id })
      var analysisIds = change.analysis.added.map(function (entry) { return entry.id })
      return Object.assign({
         manifest: { main: mainIds, analysis: analysisIds },
         knownMainIds: unique((file.knownMainIds || []).concat(mainIds)),
         knownAnalysisIds: unique((file.knownAnalysisIds || []).concat(analysisIds)),
         lastError: null,
      }, extra || {})
   }

   function LocalNotationRuntime(options) {
      options = options || {}
      this.hub = options.hub || hub
      this.store = options.store || new RegistryRuntime.LocalNotationFileStore({ storage: options.storage })
      this.bootErrors = []
      this.storageError = null
      this._initialData = new Map()
   }

   LocalNotationRuntime.prototype.listFiles = function () {
      try {
         this.storageError = null
         return this.store.listFiles()
      } catch (error) {
         this.storageError = errorDetails(error)
         return []
      }
   }

   LocalNotationRuntime.prototype.getFile = function (id) {
      return this.store.getFile(id)
   }

   LocalNotationRuntime.prototype.getDraft = function (id) {
      return this.store.getDraft(id)
   }

   LocalNotationRuntime.prototype.setDraft = function (id, draft) {
      return this.store.setDraft(id, draft)
   }

   LocalNotationRuntime.prototype.clearDraft = function (id) {
      return this.store.clearDraft(id)
   }

   LocalNotationRuntime.prototype.initialItemsFor = function (notationId) {
      return this._initialData.get(notationId)
   }

   LocalNotationRuntime.prototype._rememberInitialData = function (change) {
      for (var i = 0; i < change.main.initialData.length; i++) {
         var prepared = change.main.initialData[i]
         this._initialData.set(prepared.id, prepared.items)
      }
   }

   LocalNotationRuntime.prototype._forgetInitialData = function (entries) {
      for (var i = 0; i < entries.length; i++) this._initialData.delete(entries[i].id)
   }

   LocalNotationRuntime.prototype.boot = function () {
      var files = this.listFiles()
      for (var i = 0; i < files.length; i++) {
         var file = files[i]
         if (!file.enabled || !file.trusted) continue
         try {
            var transaction = this.hub.prepareSource(file.id, file.source, {
               sourceURL: file.name,
               ownerOrder: file.order,
            })
            var preview = transaction.preview()
            var updated = this.store.updateFile(file.id, filePatchFromChange(file, preview, {
               enabled: true,
               loadedRevision: file.sourceRevision,
            }))
            var change = transaction.commit()
            this._rememberInitialData(change)
            files[i] = updated
         } catch (error) {
            var details = errorDetails(error, file.name)
            this.bootErrors.push({ fileId: file.id, fileName: file.name, error: details })
            try {
               this.store.updateFile(file.id, { enabled: false, lastError: details })
            } catch (storageError) {
               this.storageError = errorDetails(storageError)
            }
         }
      }
      return this.bootErrors.slice()
   }

   LocalNotationRuntime.prototype.createTemplate = function () {
      var files = this.store.listFiles()
      var usedNames = new Set(files.map(function (file) { return file.name.toLowerCase() }))
      var usedIds = new Set()
      root.register.forEach(function (entry) { usedIds.add(entry.id) })
      files.forEach(function (file) {
         ;(file.knownMainIds || []).forEach(function (id) { usedIds.add(id) })
      })

      var number = 1
      var fileName
      var notationId
      do {
         fileName = number === 1 ? 'PrSS.js' : 'PrSS-' + number + '.js'
         notationId = number === 1 ? 'prss' : 'prss-' + number
         number++
      } while (usedNames.has(fileName.toLowerCase()) || usedIds.has(notationId))

      var displayName = notationId === 'prss' ? 'PrSS' : 'PrSS ' + notationId.slice(5)
      return this.store.createFile({
         name: fileName,
         source: root.PrSSTemplate.generateSource({ id: notationId, name: displayName }),
         enabled: false,
         trusted: true,
         template: true,
         loadedRevision: 0,
         manifest: { main: [], analysis: [] },
         knownMainIds: [notationId],
         knownAnalysisIds: [],
         lastError: null,
      })
   }

   LocalNotationRuntime.prototype.createUpload = function (name, source, trusted) {
      var file = this.store.createFile({
         name: name,
         source: source,
         enabled: false,
         trusted: !!trusted,
         template: false,
         loadedRevision: 0,
         manifest: { main: [], analysis: [] },
         knownMainIds: [],
         knownAnalysisIds: [],
         lastError: null,
      })
      if (!trusted) return { file: file, change: null, enabled: false }
      try {
         return this.enable(file.id)
      } catch (error) {
         var details = errorDetails(error, file.name)
         this.store.updateFile(file.id, { enabled: false, lastError: details })
         return { file: this.store.getFile(file.id), change: null, enabled: false, error: details }
      }
   }

   LocalNotationRuntime.prototype.replaceUpload = function (id, name, source) {
      var file = this.store.getFile(id)
      if (!file) throw new Error('Local notation file not found.')
      if (file.enabled) return this.saveFile(id, name, source)
      var updated = this.store.updateFileAndClearDraft(
         id,
         { name: name, source: source, lastError: null }
      )
      return { file: updated, change: null, enabled: false, sourceChanged: source !== file.source }
   }

   LocalNotationRuntime.prototype.saveFile = function (id, name, source) {
      var file = this.store.getFile(id)
      if (!file) throw new Error('Local notation file not found.')
      var sourceChanged = source !== file.source
      var nameChanged = name !== file.name
      if (!sourceChanged) {
         var renamed = this.store.updateFileAndClearDraft(id, nameChanged ? { name: name } : {})
         return { file: renamed, change: null, enabled: !!renamed.enabled, sourceChanged: false }
      }
      if (!file.enabled) {
         var saved = this.store.updateFileAndClearDraft(
            id,
            { name: name, source: source, lastError: null }
         )
         return { file: saved, change: null, enabled: false, sourceChanged: true }
      }

      var transaction
      try {
         transaction = this.hub.prepareSource(id, source, {
            sourceURL: name,
            ownerOrder: file.order,
         })
      } catch (error) {
         var loadError = errorDetails(error, name)
         this.store.updateFile(id, { lastError: loadError })
         throw error
      }

      var preview = transaction.preview()
      var persisted
      try {
         persisted = this.store.updateFileAndClearDraft(
            id,
            filePatchFromChange(file, preview, {
               name: name,
               source: source,
               enabled: true,
               loadedRevision: file.sourceRevision + 1,
            })
         )
      } catch (error) {
         transaction.rollback()
         throw error
      }
      var change = transaction.commit()
      this._forgetInitialData(change.main.removed)
      this._rememberInitialData(change)
      return { file: persisted, previous: file, change: change, enabled: true, sourceChanged: true }
   }

   LocalNotationRuntime.prototype.enable = function (id) {
      var file = this.store.getFile(id)
      if (!file) throw new Error('Local notation file not found.')
      if (!file.trusted) throw new Error('Local notation file is not trusted yet.')
      if (file.enabled && this.hub.registrationsFor(id).main.length + this.hub.registrationsFor(id).analysis.length) {
         return { file: file, change: null, enabled: true, sourceChanged: false }
      }

      var transaction
      try {
         transaction = this.hub.prepareSource(id, file.source, {
            sourceURL: file.name,
            ownerOrder: file.order,
         })
      } catch (error) {
         this.store.updateFile(id, { enabled: false, lastError: errorDetails(error, file.name) })
         throw error
      }
      var preview = transaction.preview()
      var sourceChanged = !!file.loadedRevision && file.loadedRevision !== file.sourceRevision
      var persisted
      try {
         persisted = this.store.updateFile(id, filePatchFromChange(file, preview, {
            enabled: true,
            loadedRevision: file.sourceRevision,
         }))
      } catch (error) {
         transaction.rollback()
         throw error
      }
      var change = transaction.commit()
      this._rememberInitialData(change)
      return { file: persisted, previous: file, change: change, enabled: true, sourceChanged: sourceChanged }
   }

   LocalNotationRuntime.prototype.disable = function (id) {
      var file = this.store.getFile(id)
      if (!file) throw new Error('Local notation file not found.')
      if (!file.enabled) return { file: file, change: null, enabled: false }
      var persisted = this.store.updateFile(id, { enabled: false, lastError: null })
      var change = this.hub.removeOwner(id)
      this._forgetInitialData(change.main.removed)
      return { file: persisted, previous: file, change: change, enabled: false }
   }

   LocalNotationRuntime.prototype.deleteFile = function (id) {
      var file = this.store.getFile(id)
      if (!file) throw new Error('Local notation file not found.')
      var removed = this.store.deleteFile(id)
      var change = file.enabled ? this.hub.removeOwner(id) : null
      if (change) this._forgetInitialData(change.main.removed)
      this.hub.forgetOwner(id)
      return { file: removed, previous: file, change: change, deleted: true }
   }

   LocalNotationRuntime.prototype.trustFile = function (id) {
      return this.store.updateFile(id, { trusted: true })
   }

   LocalNotationRuntime.prototype.findByName = function (name) {
      var normalized = String(name || '').trim().toLowerCase()
      return this.store.listFiles().find(function (file) {
         return file.name.toLowerCase() === normalized
      })
   }

   LocalNotationRuntime.prototype.errorDetails = errorDetails
   root.LocalNotationRuntime = LocalNotationRuntime
   root.localNotationManager = new LocalNotationRuntime({ hub: hub })
   root.localNotationManager.boot()
})(typeof globalThis !== 'undefined' ? globalThis : this)
