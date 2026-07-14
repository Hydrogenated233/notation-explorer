;(function () {
   'use strict'

   // Ported from ne-rewritten PPS.ts at commit 3fc02cd.
   function isInfinity(seq) {
      return String(seq) === 'Infinity'
   }

   function isLimit(seq) {
      return seq.length > 0 && seq[seq.length - 1] > 0
   }

   function display(seq) {
      return isInfinity(seq) ? 'Limit' : String(seq)
   }

   function fromDisplay(value) {
      if (value === 'Limit') return [Infinity]
      var result = value.split(',').map(function (part) {
         return parseInt(part.trim(), 10)
      })
      if (result.find(Number.isNaN) !== undefined) {
         throw new Error('Illegal PPS sequence')
      }
      return result
   }

   function limitFS(index) {
      var result = []
      for (var current = 0; current <= index; current++) result.push(current)
      return result
   }

   function expandSecond(seq, x, b, copyIndex, width) {
      for (var index = x - 2; index >= b; index--) {
         if (seq[index] === b) return b + 1 + index + width * copyIndex - width
         if (seq[index] < b) break
      }
      return b
   }

   function expand(seq, fsIndex) {
      var length = seq.length
      var x = seq[length - 1]
      var b = seq[x - 1]
      var badPart = seq.slice(x, length - 1)
      var width = length - x
      var weak = badPart.some(function (value) { return value === b })
      var result = seq.slice(0, -1)

      for (var copyIndex = 1; copyIndex <= fsIndex; copyIndex++) {
         result.push(weak ? b : expandSecond(seq, x, b, copyIndex, width))
         for (var index = 0; index < badPart.length; index++) {
            var value = badPart[index]
            result.push(value < x ? value : value + width * copyIndex)
         }
      }
      return result
   }

   function createFSVariants() {
      var cache = Object.create(null)
      var shortOffsets = Object.create(null)

      function FS(seq, index) {
         if (isInfinity(seq)) return limitFS(index)
         if (seq.length === 0) return []
         if (!isLimit(seq)) return seq.slice(0, -1)
         var key = display(seq)
         if (cache[key] === undefined) cache[key] = []
         else if (cache[key][index] !== undefined) return cache[key][index]
         cache[key][index] = expand(seq, index)
         return cache[key][index]
      }

      function FSalter(seq, index) {
         if (isInfinity(seq)) return limitFS(index)
         if (seq.length === 0) return []
         if (!isLimit(seq)) return seq.slice(0, -1)
         return FS(seq, index).slice(0, -1)
      }

      function FSShort(seq, index) {
         if (isInfinity(seq)) return limitFS(index)
         if (seq.length === 0) return []
         if (!isLimit(seq)) return seq.slice(0, -1)
         if (index === 0) return seq.slice(0, -1)
         if (index === 1) return FS(seq, 1).slice(0, seq.length)

         var key = display(seq)
         if (shortOffsets[key] === undefined) {
            shortOffsets[key] = FSalter(seq, 1).length !== seq.length
         }
         return FSalter(seq, index - (shortOffsets[key] ? 1 : 0))
      }

      return { FS: FS, FSalter: FSalter, FSShort: FSShort }
   }

   var variants = createFSVariants()

   register.push({
      id: 'spps4',
      name: 'Second PPS4',
      display: display,
      fromDisplay: fromDisplay,
      able: isLimit,
      compare: sequence_compare,
      FS: variants.FS,
      FSalter: variants.FSalter,
      FSShort: variants.FSShort,
      init: function () {
         return [
            { expr: [Infinity], low: [[]], subitems: [] },
            { expr: [], low: [[]], subitems: [] },
         ]
      },
   })
})()
