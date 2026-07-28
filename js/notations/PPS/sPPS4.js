;(function () {
   'use strict'

   // Adapted from pps4s.js. Keep the existing identity and use the app's Limit sentinel.
   function expandPPS(seq, nCount) {
      if (!Array.isArray(seq) || seq.length === 0) return []
      var y = seq.length
      var x = seq[y - 1]
      if (x === 0) return seq.slice(0, -1)
      if (x > y) {
         throw new Error('Last value ' + x + ' is outside sequence length ' + y)
      }

      var b = seq[x - 1]
      var width = y - x
      var value
      var strongExpand = false
      var foundLessOrEqual = false

      for (var column = y - 1; column >= x + 1; column--) {
         if (seq[column - 1] <= b) {
            foundLessOrEqual = true
            break
         }
      }

      if (foundLessOrEqual) {
         value = b
      } else {
         var foundColumn = null
         var strongStart = b + 1
         var strongEnd = x - 1
         if (strongStart <= strongEnd) {
            for (var candidate = strongEnd; candidate >= strongStart; candidate--) {
               if (seq[candidate - 1] === b) {
                  foundColumn = candidate
                  break
               }
            }
         }
         if (foundColumn !== null) {
            value = foundColumn
            strongExpand = true
         } else {
            value = b
         }
      }

      var totalLength = y + nCount * width - 1
      var result = new Array(totalLength)
      var index
      for (index = 0; index < x; index++) result[index] = seq[index]
      for (index = x; index < y - 1; index++) result[index] = seq[index]
      result[y - 1] = value

      for (index = x; index < y; index++) {
         var baseValue = index === y - 1 ? value : seq[index]
         var shifts = index === y - 1 ? nCount - 1 : nCount
         for (var copy = 1; copy <= shifts; copy++) {
            var position = index + copy * width
            if (position >= totalLength) continue
            if ((index === y - 1 && strongExpand) || baseValue >= x) {
               result[position] = baseValue + copy * width
            } else {
               result[position] = baseValue
            }
         }
      }
      return result
   }

   function ensureArray(expr) {
      if (expr === Infinity) return [Infinity]
      if (Array.isArray(expr)) return expr
      if (!expr || typeof expr !== 'object') return null
      var result = []
      for (var key in expr) {
         if (Object.prototype.hasOwnProperty.call(expr, key) && !Number.isNaN(parseInt(key, 10))) {
            result.push(expr[key])
         }
      }
      return result
   }

   function isInfinity(expr) {
      var seq = ensureArray(expr)
      return !!seq && seq.length === 1 && seq[0] === Infinity
   }

   function parse(value) {
      var source = value === undefined || value === null ? '' : String(value).trim()
      if (!source || source === '(empty)') return []
      if (/^(?:limit|infinity|∞)$/i.test(source)) return [Infinity]

      var parts = source.split(',')
      var seq = []
      for (var index = 0; index < parts.length; index++) {
         var token = parts[index].trim()
         if (/^w$/i.test(token)) {
            seq.push(Infinity)
            continue
         }
         var number = parseInt(token, 10)
         if (Number.isNaN(number)) throw new Error('Illegal Second PPS4 sequence')
         seq.push(number)
      }
      return seq
   }

   function displayPlain(expr) {
      if (isInfinity(expr)) return 'Limit'
      if (typeof expr === 'number') return String(expr)
      var seq = ensureArray(expr)
      if (seq === null) return String(expr)
      if (seq.length === 0) return '(empty)'
      return seq.join(',')
   }

   function displayLatex(expr) {
      var plain = displayPlain(expr)
      return plain === '(empty)' ? '\\emptyset' : plain
   }

   function isLimit(expr) {
      if (isInfinity(expr)) return true
      if (typeof expr === 'number') return expr > 0
      var seq = ensureArray(expr)
      return !!seq && seq.length > 0 && seq[seq.length - 1] > 0
   }

   function compare(left, right) {
      if (typeof left === 'number') left = [left]
      if (typeof right === 'number') right = [right]
      var leftSeq = ensureArray(left)
      var rightSeq = ensureArray(right)
      if (!leftSeq || !rightSeq) {
         if (!leftSeq && !rightSeq) return 0
         return leftSeq ? 1 : -1
      }
      var length = Math.min(leftSeq.length, rightSeq.length)
      for (var index = 0; index < length; index++) {
         if (leftSeq[index] < rightSeq[index]) return -1
         if (leftSeq[index] > rightSeq[index]) return 1
      }
      if (leftSeq.length < rightSeq.length) return -1
      if (leftSeq.length > rightSeq.length) return 1
      return 0
   }

   function limitFS(index) {
      var result = []
      for (var current = 0; current <= index; current++) result.push(current)
      return result
   }

   function FS(expr, index) {
      var fsIndex = Number(index)
      if (!Number.isSafeInteger(fsIndex) || fsIndex < 0) {
         throw new Error('FS index must be a non-negative safe integer')
      }
      if (isInfinity(expr)) return limitFS(fsIndex)
      if (typeof expr === 'number') expr = [expr]
      var seq = ensureArray(expr)
      if (!seq || seq.length === 0) return []
      if (fsIndex === 0) return seq.slice(0, -1)
      return expandPPS(seq, fsIndex)
   }

   register.push({
      id: 'spps4',
      name: 'Second PPS4',
      display: displayPlain,
      displayPlain: displayPlain,
      latex: displayLatex,
      fromDisplay: parse,
      able: isLimit,
      compare: compare,
      FS: FS,
      FSalter: FS,
      FSShort: FS,
      init: function () {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ]
      },
   })
})()
