;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationRegistryRuntime = api
   root.NotationRegistry = api.NotationRegistry
   root.NotationRegistryHub = api.NotationRegistryHub
   root.LocalNotationFileStore = api.LocalNotationFileStore
   root.NotationRegistryError = api.NotationRegistryError
   root.LocalNotationStorageError = api.LocalNotationStorageError
   api.installGlobals(root)
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var BUILTIN_OWNER = '@notation-explorer/builtin'
   var MAIN_FIELDS = ['id', 'name', 'display', 'able', 'compare', 'FS', 'init']
   var ANALYSIS_FIELDS = ['id', 'name', 'display', 'fromDisplay', 'FS']
   var FILE_STORE_VERSION = 1
   var DEFAULT_FILE_STORE_KEY = 'ne-local-notation-files'

   function NotationRegistryError(code, message, details, cause) {
      Error.call(this, message)
      this.name = 'NotationRegistryError'
      this.code = code
      this.message = message
      this.details = details || {}
      if (cause !== undefined) this.cause = cause
      if (Error.captureStackTrace) Error.captureStackTrace(this, NotationRegistryError)
   }
   NotationRegistryError.prototype = Object.create(Error.prototype)
   NotationRegistryError.prototype.constructor = NotationRegistryError

   function LocalNotationStorageError(code, message, cause) {
      Error.call(this, message)
      this.name = 'LocalNotationStorageError'
      this.code = code
      this.message = message
      if (cause !== undefined) this.cause = cause
      if (Error.captureStackTrace) Error.captureStackTrace(this, LocalNotationStorageError)
   }
   LocalNotationStorageError.prototype = Object.create(Error.prototype)
   LocalNotationStorageError.prototype.constructor = LocalNotationStorageError

   function assertOwner(owner) {
      if (typeof owner !== 'string' || owner.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_OWNER',
            'A non-empty owner ID is required for notation registrations.',
            { owner: owner }
         )
      }
   }

   function validateEntry(namespace, requiredFields, entry) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Every ' + namespace + ' registration must be an object.',
            { namespace: namespace }
         )
      }

      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Every ' + namespace + ' registration must have a non-empty string ID.',
            { namespace: namespace, field: 'id' }
         )
      }

      if (typeof entry.name !== 'string' || entry.name.trim() === '') {
         throw new NotationRegistryError(
            'INVALID_ENTRY',
            'Notation "' + entry.id + '" must have a non-empty string name.',
            { namespace: namespace, id: entry.id, field: 'name' }
         )
      }

      for (var i = 0; i < requiredFields.length; i++) {
         var field = requiredFields[i]
         if (field === 'id' || field === 'name') continue
         if (typeof entry[field] !== 'function') {
            throw new NotationRegistryError(
               'INVALID_ENTRY',
               'Notation "' + entry.id + '" must provide a ' + field + ' function.',
               { namespace: namespace, id: entry.id, field: field }
            )
         }
      }

      return entry
   }

   function validateMainInitialData(entry) {
      var initial
      try {
         initial = entry.init()
      } catch (error) {
         throw new NotationRegistryError(
            'INVALID_INIT',
            'Notation "' + entry.id + '" failed while creating its initial dataset: ' +
               (error && error.message ? error.message : 'unknown error'),
            { namespace: 'main', id: entry.id },
            error
         )
      }

      if (!Array.isArray(initial)) {
         throw new NotationRegistryError(
            'INVALID_INIT',
            'Notation "' + entry.id + '" init() must return an array.',
            { namespace: 'main', id: entry.id }
         )
      }
      for (var i = 0; i < initial.length; i++) {
         var item = initial[i]
         if (!item || typeof item !== 'object' || !Array.isArray(item.low) || item.low.length === 0) {
            throw new NotationRegistryError(
               'INVALID_INIT',
               'Notation "' + entry.id + '" init() item ' + i + ' must contain a non-empty low array.',
               { namespace: 'main', id: entry.id, itemIndex: i }
            )
         }
      }
      return initial
   }

   class NotationRegistry extends Array {
      constructor(namespace, requiredFields, options) {
         super()
         options = options || {}
         Object.defineProperties(this, {
            _namespace: { value: namespace || 'main', enumerable: false },
            _requiredFields: {
               value: (requiredFields || MAIN_FIELDS).slice(),
               enumerable: false
            },
            _defaultOwner: {
               value: options.defaultOwner || BUILTIN_OWNER,
               enumerable: false
            },
            _ownerByEntry: {
               value: new WeakMap(),
               writable: true,
               enumerable: false
            }
         })
      }

      static get [Symbol.species]() {
         return Array
      }

      get namespace() {
         return this._namespace
      }

      push() {
         var entries = Array.prototype.slice.call(arguments)
         this.appendOwned(this._defaultOwner, entries)
         return this.length
      }

      appendOwned(owner, entries) {
         assertOwner(owner)
         entries = Array.isArray(entries) ? entries.slice() : [entries]
         this._validateBatch(entries)

         var known = new Set(this.map(function (entry) { return entry.id }))
         for (var i = 0; i < entries.length; i++) {
            if (known.has(entries[i].id)) {
               throw this._duplicateError(entries[i].id, this.ownerOf(entries[i].id), owner)
            }
            known.add(entries[i].id)
         }

         for (var j = 0; j < entries.length; j++) {
            Array.prototype.push.call(this, entries[j])
            this._ownerByEntry.set(entries[j], owner)
         }
         return entries.slice()
      }

      get(id) {
         return this.find(function (entry) { return entry.id === id })
      }

      ownerOf(id) {
         var entry = typeof id === 'string' ? this.get(id) : id
         return entry ? this._ownerByEntry.get(entry) : undefined
      }

      entriesForOwner(owner) {
         var registry = this
         return this.filter(function (entry) {
            return registry._ownerByEntry.get(entry) === owner
         })
      }

      idsForOwner(owner) {
         return this.entriesForOwner(owner).map(function (entry) { return entry.id })
      }

      removeOwner(owner) {
         var plan = this._planOwnerReplacement(owner, [])
         this._applyPlan(plan)
         return plan.removed.slice()
      }

      replaceOwner(owner, entries) {
         var plan = this._planOwnerReplacement(owner, entries)
         this._applyPlan(plan)
         return {
            owner: owner,
            namespace: this._namespace,
            removed: plan.removed.slice(),
            added: plan.added.slice()
         }
      }

      validate(entry) {
         return validateEntry(this._namespace, this._requiredFields, entry)
      }

      _validateBatch(entries) {
         var ids = new Set()
         for (var i = 0; i < entries.length; i++) {
            this.validate(entries[i])
            if (ids.has(entries[i].id)) {
               throw this._duplicateError(entries[i].id, undefined, undefined)
            }
            ids.add(entries[i].id)
         }
      }

      _duplicateError(id, existingOwner, attemptedOwner) {
         return new NotationRegistryError(
            'DUPLICATE_ID',
            'The ' + this._namespace + ' notation ID "' + id + '" is already registered.',
            {
               namespace: this._namespace,
               id: id,
               existingOwner: existingOwner,
               attemptedOwner: attemptedOwner
            }
         )
      }

      _snapshotPairs() {
         var registry = this
         return this.map(function (entry) {
            return { entry: entry, owner: registry._ownerByEntry.get(entry) }
         })
      }

      _planOwnerReplacement(owner, entries, options) {
         assertOwner(owner)
         options = options || {}
         entries = Array.isArray(entries) ? entries.slice() : [entries]
         this._validateBatch(entries)

         var current = this._snapshotPairs()
         var insertionIndex = current.length
         var removed = []
         var remaining = []

         for (var i = 0; i < current.length; i++) {
            if (current[i].owner === owner) {
               if (insertionIndex === current.length) insertionIndex = remaining.length
               removed.push(current[i].entry)
            } else {
               remaining.push(current[i])
            }
         }

         if (options.insertionIndex !== undefined) {
            insertionIndex = Math.max(0, Math.min(remaining.length, options.insertionIndex))
         }

         var occupied = new Map()
         for (var j = 0; j < remaining.length; j++) {
            occupied.set(remaining[j].entry.id, remaining[j].owner)
         }
         for (var k = 0; k < entries.length; k++) {
            if (occupied.has(entries[k].id)) {
               throw this._duplicateError(entries[k].id, occupied.get(entries[k].id), owner)
            }
         }

         var additions = entries.map(function (entry) {
            return { entry: entry, owner: owner }
         })
         remaining.splice.apply(remaining, [insertionIndex, 0].concat(additions))

         return {
            pairs: remaining,
            removed: removed,
            added: entries.slice()
         }
      }

      _applyPlan(plan) {
         this._restorePairs(plan.pairs)
      }

      _restorePairs(pairs) {
         Array.prototype.splice.call(this, 0, this.length)
         this._ownerByEntry = new WeakMap()
         for (var i = 0; i < pairs.length; i++) {
            Array.prototype.push.call(this, pairs[i].entry)
            this._ownerByEntry.set(pairs[i].entry, pairs[i].owner)
         }
      }
   }

   class StagedRegistry extends Array {
      constructor(liveRegistry, owner) {
         super()
         Object.defineProperties(this, {
            _liveRegistry: { value: liveRegistry, enumerable: false },
            _owner: { value: owner, enumerable: false },
            _staged: { value: [], enumerable: false },
            _locked: { value: false, writable: true, enumerable: false }
         })

         for (var i = 0; i < liveRegistry.length; i++) {
            if (liveRegistry.ownerOf(liveRegistry[i]) === BUILTIN_OWNER) {
               Array.prototype.push.call(this, liveRegistry[i])
            }
         }
      }

      static get [Symbol.species]() {
         return Array
      }

      push() {
         if (this._locked) {
            throw new NotationRegistryError(
               'TRANSACTION_PREPARED',
               'Registrations cannot be changed after transaction validation.',
               { owner: this._owner, namespace: this._liveRegistry.namespace }
            )
         }
         var entries = Array.prototype.slice.call(arguments)
         for (var i = 0; i < entries.length; i++) {
            this._staged.push(entries[i])
            Array.prototype.push.call(this, entries[i])
         }
         return this.length
      }

      get(id) {
         return this.find(function (entry) { return entry.id === id })
      }

      ownerOf(id) {
         var entry = typeof id === 'string' ? this.get(id) : id
         if (!entry) return undefined
         if (this._staged.indexOf(entry) !== -1) return this._owner
         return this._liveRegistry.ownerOf(entry)
      }

      stagedEntries() {
         return this._staged.slice()
      }

      lock() {
         this._locked = true
      }
   }

   class NotationTransaction {
      constructor(hub, owner, ownerOrder) {
         this.owner = owner
         this.ownerOrder = ownerOrder
         this.main = new StagedRegistry(hub.main, owner)
         this.analysis = new StagedRegistry(hub.analysis, owner)
         this.register = this.main
         this.analysis_register = this.analysis
         Object.defineProperties(this, {
            _hub: { value: hub, enumerable: false },
            _state: { value: 'open', writable: true, enumerable: false },
            _preview: { value: null, writable: true, enumerable: false }
         })
      }

      get state() {
         return this._state
      }

      validate() {
         this._assertOpen()
         this.main.lock()
         this.analysis.lock()
         try {
            this._preview = this._hub._previewTransaction(this)
            this._state = 'prepared'
            return this.preview()
         } catch (error) {
            this._state = 'rolled_back'
            throw error
         }
      }

      preview() {
         if (this._state === 'open') return this.validate()
         if (!this._preview) {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction has no validated preview.',
               { owner: this.owner, state: this._state }
            )
         }
         var preview = this._preview
         return {
            owner: this.owner,
            main: {
               removed: preview.main.removed.slice(),
               added: preview.main.added.slice(),
               initialData: preview.main.initialData.map(function (prepared) {
                  return {
                     id: prepared.id,
                     notation: prepared.notation,
                     items: prepared.items
                  }
               })
            },
            analysis: {
               removed: preview.analysis.removed.slice(),
               added: preview.analysis.added.slice()
            }
         }
      }

      commit() {
         if (this._state === 'open') this.validate()
         this._assertPrepared()
         var result = this._hub._commitTransaction(this)
         this._state = 'committed'
         return result
      }

      rollback() {
         if (this._state === 'committed') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'A committed notation transaction cannot be rolled back.',
               { owner: this.owner, state: this._state }
            )
         }
         this._state = 'rolled_back'
      }

      _assertOpen() {
         if (this._state !== 'open') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction is already ' + this._state + '.',
               { owner: this.owner, state: this._state }
            )
         }
      }

      _assertPrepared() {
         if (this._state !== 'prepared') {
            throw new NotationRegistryError(
               'TRANSACTION_CLOSED',
               'The notation transaction is not available for commit.',
               { owner: this.owner, state: this._state }
            )
         }
      }
   }

   class NotationRegistryHub {
      constructor(options) {
         options = options || {}
         this.main = options.main || new NotationRegistry('main', MAIN_FIELDS)
         this.analysis = options.analysis || new NotationRegistry('analysis', ANALYSIS_FIELDS)
         this.register = this.main
         this.analysis_register = this.analysis
         Object.defineProperty(this, '_listeners', {
            value: new Set(),
            enumerable: false
         })
         Object.defineProperty(this, '_ownerOrders', {
            value: new Map(),
            enumerable: false
         })
      }

      begin(owner, options) {
         options = options || {}
         assertOwner(owner)
         if (owner === BUILTIN_OWNER) {
            throw new NotationRegistryError(
               'RESERVED_OWNER',
               'The built-in notation owner is reserved.',
               { owner: owner }
            )
         }
         var ownerOrder = options.ownerOrder
         if (ownerOrder === undefined && this._ownerOrders.has(owner)) {
            ownerOrder = this._ownerOrders.get(owner)
         }
         if (ownerOrder === undefined) ownerOrder = this._nextOwnerOrder()
         if (typeof ownerOrder !== 'number' || !Number.isFinite(ownerOrder)) {
            throw new NotationRegistryError(
               'INVALID_OWNER_ORDER',
               'A local notation owner order must be a finite number.',
               { owner: owner, ownerOrder: ownerOrder }
            )
         }
         return new NotationTransaction(this, owner, ownerOrder)
      }

      prepareSource(owner, source, options) {
         options = options || {}
         if (typeof source !== 'string') {
            throw new NotationRegistryError(
               'INVALID_SOURCE',
               'Local notation source must be a string.',
               { owner: owner }
            )
         }

         var transaction = this.begin(owner, { ownerOrder: options.ownerOrder })
         var context = options.context || {}
         var names = ['register', 'analysis_register']
         var values = [transaction.main, transaction.analysis]
         var contextNames = Object.keys(context)

         for (var i = 0; i < contextNames.length; i++) {
            var name = contextNames[i]
            if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(name) || names.indexOf(name) !== -1) {
               throw new NotationRegistryError(
                  'INVALID_CONTEXT',
                  'Invalid source context name "' + name + '".',
                  { owner: owner, name: name }
               )
            }
            names.push(name)
            values.push(context[name])
         }

         var sourceURL = String(options.sourceURL || ('local-notation-' + owner + '.js'))
            .replace(/[\r\n\u2028\u2029]/g, '')
         var body = source + '\n//# sourceURL=' + sourceURL

         try {
            // Keep legacy script semantics while isolating var/function declarations to this call.
            var execute = new Function(...names, body)
            execute.apply(undefined, values)
            transaction.validate()
            return transaction
         } catch (error) {
            transaction.rollback()
            if (error instanceof NotationRegistryError) throw error
            throw new NotationRegistryError(
               'SOURCE_EXECUTION_FAILED',
               error && error.message
                  ? 'Local notation execution failed: ' + error.message
                  : 'Local notation execution failed.',
               { owner: owner, sourceURL: sourceURL },
               error
            )
         }
      }

      executeSource(owner, source, options) {
         return this.prepareSource(owner, source, options).commit()
      }

      removeOwner(owner) {
         assertOwner(owner)
         if (owner === BUILTIN_OWNER) {
            throw new NotationRegistryError(
               'RESERVED_OWNER',
               'Built-in registrations cannot be removed through the local notation hub.',
               { owner: owner }
            )
         }

         var mainSnapshot = this.main._snapshotPairs()
         var analysisSnapshot = this.analysis._snapshotPairs()
         var mainPlan = this.main._planOwnerReplacement(owner, [])
         var analysisPlan = this.analysis._planOwnerReplacement(owner, [])
         mainPlan.initialData = []

         try {
            this.main._applyPlan(mainPlan)
            this.analysis._applyPlan(analysisPlan)
         } catch (error) {
            this.main._restorePairs(mainSnapshot)
            this.analysis._restorePairs(analysisSnapshot)
            throw error
         }

         var result = this._result(
            owner,
            mainPlan,
            analysisPlan,
            'remove',
            this._ownerOrders.get(owner)
         )
         this._emit(result)
         return result
      }

      registrationsFor(owner) {
         return {
            main: this.main.entriesForOwner(owner),
            analysis: this.analysis.entriesForOwner(owner)
         }
      }

      ownerOrder(owner) {
         return this._ownerOrders.get(owner)
      }

      forgetOwner(owner) {
         this._ownerOrders.delete(owner)
      }

      subscribe(listener) {
         if (typeof listener !== 'function') {
            throw new TypeError('Notation registry listeners must be functions.')
         }
         this._listeners.add(listener)
         var listeners = this._listeners
         return function () { listeners.delete(listener) }
      }

      _previewTransaction(transaction, validateInitialData) {
         var mainEntries = transaction.main.stagedEntries()
         var analysisEntries = transaction.analysis.stagedEntries()
         if (mainEntries.length + analysisEntries.length === 0) {
            throw new NotationRegistryError(
               'EMPTY_TRANSACTION',
               'A local notation file must register at least one main or analysis notation.',
               { owner: transaction.owner }
            )
         }

         var mainIndex = this._ownerInsertionIndex(this.main, transaction.owner, transaction.ownerOrder)
         var analysisIndex = this._ownerInsertionIndex(this.analysis, transaction.owner, transaction.ownerOrder)
         var mainPlan = this.main._planOwnerReplacement(transaction.owner, mainEntries, {
            insertionIndex: mainIndex
         })
         var analysisPlan = this.analysis._planOwnerReplacement(transaction.owner, analysisEntries, {
            insertionIndex: analysisIndex
         })

         var initialData = []
         if (validateInitialData !== false) {
            for (var i = 0; i < mainEntries.length; i++) {
               initialData.push({
                  id: mainEntries[i].id,
                  notation: mainEntries[i],
                  items: validateMainInitialData(mainEntries[i])
               })
            }
         } else if (transaction._preview) {
            initialData = transaction._preview.main.initialData
         }
         mainPlan.initialData = initialData

         return { main: mainPlan, analysis: analysisPlan }
      }

      _commitTransaction(transaction) {
         // Replan against current live owners, but commit exactly the entries and init data
         // captured while the transaction was validated.
         var prepared = transaction._preview
         var mainIndex = this._ownerInsertionIndex(this.main, transaction.owner, transaction.ownerOrder)
         var analysisIndex = this._ownerInsertionIndex(this.analysis, transaction.owner, transaction.ownerOrder)
         var mainPlan = this.main._planOwnerReplacement(transaction.owner, prepared.main.added, {
            insertionIndex: mainIndex
         })
         var analysisPlan = this.analysis._planOwnerReplacement(transaction.owner, prepared.analysis.added, {
            insertionIndex: analysisIndex
         })
         mainPlan.initialData = prepared.main.initialData
         var plans = { main: mainPlan, analysis: analysisPlan }
         var mainSnapshot = this.main._snapshotPairs()
         var analysisSnapshot = this.analysis._snapshotPairs()

         try {
            this.main._applyPlan(plans.main)
            this.analysis._applyPlan(plans.analysis)
         } catch (error) {
            this.main._restorePairs(mainSnapshot)
            this.analysis._restorePairs(analysisSnapshot)
            throw error
         }

         this._ownerOrders.set(transaction.owner, transaction.ownerOrder)

         var result = this._result(
            transaction.owner,
            plans.main,
            plans.analysis,
            'replace',
            transaction.ownerOrder
         )
         this._emit(result)
         return result
      }

      _result(owner, mainPlan, analysisPlan, type, ownerOrder) {
         return {
            type: type,
            owner: owner,
            ownerOrder: ownerOrder,
            main: {
               removed: mainPlan.removed.slice(),
               added: mainPlan.added.slice(),
               initialData: (mainPlan.initialData || []).map(function (prepared) {
                  return {
                     id: prepared.id,
                     notation: prepared.notation,
                     items: prepared.items
                  }
               })
            },
            analysis: {
               removed: analysisPlan.removed.slice(),
               added: analysisPlan.added.slice()
            }
         }
      }

      _nextOwnerOrder() {
         var next = 1
         this._ownerOrders.forEach(function (order) {
            if (order >= next) next = order + 1
         })
         return next
      }

      _ownerInsertionIndex(registry, owner, ownerOrder) {
         var pairs = registry._snapshotPairs().filter(function (pair) {
            return pair.owner !== owner
         })
         for (var i = 0; i < pairs.length; i++) {
            if (pairs[i].owner === BUILTIN_OWNER) continue
            var otherOrder = this._ownerOrders.get(pairs[i].owner)
            if (otherOrder !== undefined && otherOrder > ownerOrder) return i
         }
         return pairs.length
      }

      _emit(change) {
         this._listeners.forEach(function (listener) {
            try {
               listener(change)
            } catch (error) {
               if (typeof console !== 'undefined' && console.error) console.error(error)
            }
         })
      }
   }

   function cloneJSON(value) {
      if (value === undefined) return undefined
      try {
         return JSON.parse(JSON.stringify(value))
      } catch (error) {
         throw new LocalNotationStorageError(
            'SERIALIZATION_FAILED',
            'Local notation data could not be serialized.',
            error
         )
      }
   }

   function defaultFileId() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
         return crypto.randomUUID()
      }
      return 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
   }

   function defaultState() {
      return {
         version: FILE_STORE_VERSION,
         nextOrder: 1,
         files: [],
         drafts: {}
      }
   }

   function isQuotaError(error) {
      return !!error && (
         error.name === 'QuotaExceededError' ||
         error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
         error.code === 22 ||
         error.code === 1014
      )
   }

   class LocalNotationFileStore {
      constructor(options) {
         options = options || {}
         var fallbackStorage = typeof localStorage !== 'undefined' ? localStorage : null
         this.storage = options.storage || fallbackStorage
         this.key = options.key || DEFAULT_FILE_STORE_KEY
         this.now = options.now || function () { return Date.now() }
         this.createId = options.createId || defaultFileId
      }

      snapshot() {
         return cloneJSON(this._read())
      }

      listFiles() {
         return this._read().files
            .slice()
            .sort(function (a, b) { return a.order - b.order })
            .map(cloneJSON)
      }

      getFile(id) {
         var file = this._read().files.find(function (candidate) {
            return candidate.id === id
         })
         return file ? cloneJSON(file) : undefined
      }

      createFile(record) {
         var store = this
         record = record || {}
         return this._mutate(function (state) {
            var id = record.id || store.createId()
            if (typeof id !== 'string' || id.trim() === '') {
               throw new LocalNotationStorageError('INVALID_FILE', 'A local notation file ID is required.')
            }
            if (state.files.some(function (file) { return file.id === id })) {
               throw new LocalNotationStorageError('DUPLICATE_FILE_ID', 'A local notation file already uses ID "' + id + '".')
            }
            store._validateName(state, record.name)
            if (record.source !== undefined && typeof record.source !== 'string') {
               throw new LocalNotationStorageError('INVALID_FILE', 'Local notation source must be a string.')
            }

            var timestamp = store.now()
            var file = Object.assign({}, cloneJSON(record), {
               id: id,
               name: record.name.trim(),
               source: record.source || '',
               order: state.nextOrder++,
               createdAt: record.createdAt === undefined ? timestamp : record.createdAt,
               updatedAt: timestamp,
               sourceRevision: record.sourceRevision === undefined ? 1 : record.sourceRevision
            })
            state.files.push(file)
            return file
         })
      }

      updateFile(id, patch) {
         var store = this
         patch = patch || {}
         return this._mutate(function (state) {
            var index = state.files.findIndex(function (file) { return file.id === id })
            if (index === -1) store._notFound(id)
            var current = state.files[index]
            var nextName = Object.prototype.hasOwnProperty.call(patch, 'name') ? patch.name : current.name
            store._validateName(state, nextName, id)
            if (Object.prototype.hasOwnProperty.call(patch, 'source') && typeof patch.source !== 'string') {
               throw new LocalNotationStorageError('INVALID_FILE', 'Local notation source must be a string.')
            }

            var next = Object.assign({}, current, cloneJSON(patch))
            next.id = current.id
            next.name = nextName.trim()
            next.order = current.order
            next.createdAt = current.createdAt
            next.updatedAt = store.now()
            if (Object.prototype.hasOwnProperty.call(patch, 'source') && patch.source !== current.source) {
               next.sourceRevision = (Number(current.sourceRevision) || 0) + 1
            } else {
               next.sourceRevision = current.sourceRevision
            }
            state.files[index] = next
            return next
         })
      }

      deleteFile(id) {
         var store = this
         return this._mutate(function (state) {
            var index = state.files.findIndex(function (file) { return file.id === id })
            if (index === -1) store._notFound(id)
            var removed = state.files.splice(index, 1)[0]
            delete state.drafts[id]
            return removed
         })
      }

      getDraft(id) {
         var draft = this._read().drafts[id]
         return draft ? cloneJSON(draft) : undefined
      }

      setDraft(id, draft) {
         var store = this
         return this._mutate(function (state) {
            store._findFile(state, id)
            var value = typeof draft === 'string' ? { source: draft } : cloneJSON(draft || {})
            if (typeof value.source !== 'string') {
               throw new LocalNotationStorageError('INVALID_DRAFT', 'A draft must contain string source text.')
            }
            value.updatedAt = store.now()
            state.drafts[id] = value
            return value
         })
      }

      clearDraft(id) {
         return this._mutate(function (state) {
            var previous = state.drafts[id]
            delete state.drafts[id]
            return previous
         })
      }

      _findFile(state, id) {
         var file = state.files.find(function (candidate) { return candidate.id === id })
         if (!file) this._notFound(id)
         return file
      }

      _notFound(id) {
         throw new LocalNotationStorageError(
            'FILE_NOT_FOUND',
            'No local notation file exists with ID "' + id + '".'
         )
      }

      _validateName(state, name, ignoredId) {
         if (typeof name !== 'string' || !/\.js$/i.test(name.trim())) {
            throw new LocalNotationStorageError(
               'INVALID_FILE_NAME',
               'A local notation file name must end in .js.'
            )
         }
         var normalized = name.trim().toLowerCase()
         var duplicate = state.files.find(function (file) {
            return file.id !== ignoredId && file.name.trim().toLowerCase() === normalized
         })
         if (duplicate) {
            throw new LocalNotationStorageError(
               'DUPLICATE_FILE_NAME',
               'A local notation file named "' + name.trim() + '" already exists.'
            )
         }
      }

      _read() {
         if (!this.storage || typeof this.storage.getItem !== 'function') {
            throw new LocalNotationStorageError(
               'STORAGE_UNAVAILABLE',
               'Local notation storage is unavailable in this browser.'
            )
         }

         var raw
         try {
            raw = this.storage.getItem(this.key)
         } catch (error) {
            throw new LocalNotationStorageError(
               'STORAGE_READ_FAILED',
               'Local notation files could not be read from browser storage.',
               error
            )
         }
         if (raw === null || raw === '') return defaultState()

         var state
         try {
            state = JSON.parse(raw)
         } catch (error) {
            throw new LocalNotationStorageError(
               'STORAGE_CORRUPT',
               'Stored local notation data is not valid JSON.',
               error
            )
         }

         if (!state || typeof state !== 'object' || Array.isArray(state)) {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation data has an invalid shape.')
         }
         if (state.version !== FILE_STORE_VERSION) {
            throw new LocalNotationStorageError(
               'UNSUPPORTED_VERSION',
               'Stored local notation data uses unsupported version ' + String(state.version) + '.'
            )
         }
         if (!Array.isArray(state.files) || !state.drafts || typeof state.drafts !== 'object') {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation data has an invalid shape.')
         }
         if (!Number.isInteger(state.nextOrder) || state.nextOrder < 1) {
            throw new LocalNotationStorageError('STORAGE_CORRUPT', 'Stored local notation ordering data is invalid.')
         }
         return state
      }

      _mutate(mutator) {
         var state = cloneJSON(this._read())
         var result = mutator(state)
         var serialized
         try {
            serialized = JSON.stringify(state)
         } catch (error) {
            throw new LocalNotationStorageError(
               'SERIALIZATION_FAILED',
               'Local notation data could not be serialized.',
               error
            )
         }

         try {
            this.storage.setItem(this.key, serialized)
         } catch (error) {
            if (isQuotaError(error)) {
               throw new LocalNotationStorageError(
                  'QUOTA_EXCEEDED',
                  'Browser storage is full. The local notation change was not saved.',
                  error
               )
            }
            throw new LocalNotationStorageError(
               'STORAGE_WRITE_FAILED',
               'The local notation change could not be saved to browser storage.',
               error
            )
         }
         return cloneJSON(result)
      }
   }

   function installGlobals(target, options) {
      target = target || (typeof globalThis !== 'undefined' ? globalThis : undefined)
      options = options || {}
      if (!target) throw new TypeError('A global target object is required.')
      var hub = options.hub
      if (!hub && target.notationRegistryHub instanceof NotationRegistryHub) {
         hub = target.notationRegistryHub
      }
      if (!hub) hub = new NotationRegistryHub()

      target.notationRegistryHub = hub
      target.register = hub.main
      target.analysis_register = hub.analysis
      return hub
   }

   return {
      BUILTIN_OWNER: BUILTIN_OWNER,
      MAIN_FIELDS: MAIN_FIELDS.slice(),
      ANALYSIS_FIELDS: ANALYSIS_FIELDS.slice(),
      FILE_STORE_VERSION: FILE_STORE_VERSION,
      DEFAULT_FILE_STORE_KEY: DEFAULT_FILE_STORE_KEY,
      NotationRegistryError: NotationRegistryError,
      LocalNotationStorageError: LocalNotationStorageError,
      NotationRegistry: NotationRegistry,
      NotationRegistryHub: NotationRegistryHub,
      LocalNotationFileStore: LocalNotationFileStore,
      installGlobals: installGlobals
   }
})
