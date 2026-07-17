;(() => {
   'use strict'

   // Ported from the supplied Primitive Matrix System Python expander.
   const isInfinity = (expr) => String(expr) === 'Infinity'
   const coordinateKey = (column, row) => column + ',' + row
   const readCoordinate = (key) => key.split(',').map(Number)
   const cloneMatrix = (matrix) => matrix.map((column) => column.slice())

   const toSparse = (matrix) => {
      const result = new Map()
      if (!Array.isArray(matrix)) return result
      for (let column = 0; column < matrix.length; column++) {
         const values = matrix[column]
         if (!Array.isArray(values)) continue
         for (let row = 0; row < values.length; row++) {
            if (values[row] !== 0) result.set(coordinateKey(column, row), values[row])
         }
      }
      return result
   }

   const fromSparse = (matrix) => {
      if (matrix.size === 0) return []
      let maxColumn = -1
      for (const key of matrix.keys()) {
         const [column] = readCoordinate(key)
         if (column > maxColumn) maxColumn = column
      }

      const result = []
      for (let column = 0; column <= maxColumn; column++) {
         let maxRow = -1
         for (const key of matrix.keys()) {
            const [candidateColumn, row] = readCoordinate(key)
            if (candidateColumn === column && row > maxRow) maxRow = row
         }
         if (maxRow < 0) break

         const values = Array(maxRow + 1).fill(0)
         for (let row = 0; row <= maxRow; row++) {
            const value = matrix.get(coordinateKey(column, row))
            if (value !== undefined) values[row] = value
         }
         result.push(values)
      }
      return result
   }

   const normalizeMatrix = (matrix) => fromSparse(toSparse(matrix))

   const display = (expr) => {
      if (isInfinity(expr)) return 'Limit'
      const matrix = normalizeMatrix(expr)
      if (matrix.length === 0) return '()'
      return matrix.map((column) => '(' + column.join(',') + ')').join('')
   }

   const fromDisplay = (source) => {
      const text = String(source).trim()
      if (text === 'Limit' || text === 'Infinity' || text === '\u221e') return [[Infinity]]
      if (text === '()') return []
      return matrix_fromDisplay(text)
   }

   const lastNonzero = (matrix) => {
      let last = null
      for (const [key, value] of matrix.entries()) {
         if (value === 0) continue
         const [column, row] = readCoordinate(key)
         if (last === null || column > last.column ||
            (column === last.column && row > last.row)) {
            last = { column, row, value }
         }
      }
      return last
   }

   const getParent = (matrix, column, row, value) => {
      let parent = null
      for (const [key, candidateValue] of matrix.entries()) {
         const [candidateColumn, candidateRow] = readCoordinate(key)
         if (candidateValue === 0 || candidateColumn > column || candidateRow > row ||
            candidateValue <= 0 || candidateValue >= value) continue

         if (parent === null || candidateValue > parent.value ||
            (candidateValue === parent.value && candidateColumn > parent.column) ||
            (candidateValue === parent.value && candidateColumn === parent.column &&
               candidateRow > parent.row)) {
            parent = { column: candidateColumn, row: candidateRow, value: candidateValue }
         }
      }
      return parent
   }

   const coordinateCompare = (leftColumn, leftRow, rightColumn, rightRow) => {
      if (leftColumn !== rightColumn) return leftColumn < rightColumn ? -1 : 1
      if (leftRow !== rightRow) return leftRow < rightRow ? -1 : 1
      return 0
   }

   const getBadPart = (matrix, parent, last) => {
      const result = []
      for (const [key, value] of matrix.entries()) {
         const [column, row] = readCoordinate(key)
         if (column < parent.column ||
            coordinateCompare(column, row, parent.column, parent.row) < 0 ||
            coordinateCompare(column, row, last.column, last.row) >= 0) continue
         result.push({ column, row, value })
      }
      result.sort((left, right) =>
         coordinateCompare(left.column, left.row, right.column, right.row))
      return result
   }

   const expand = (source, index) => {
      const matrix = toSparse(source)
      const last = lastNonzero(matrix)
      if (last === null) return []

      const parent = getParent(matrix, last.column, last.row, last.value)
      let previous = new Map(matrix)
      previous.delete(coordinateKey(last.column, last.row))
      if (parent === null || index === 0) return fromSparse(previous)

      const badPart = getBadPart(matrix, parent, last)
      const columnOffset = last.column - parent.column
      const rowOffset = last.row - parent.row

      for (let iteration = 1; iteration <= index; iteration++) {
         const current = new Map(previous)

         for (const entry of badPart) {
            current.set(
               coordinateKey(
                  entry.column + columnOffset * iteration,
                  entry.row + rowOffset * iteration
               ),
               entry.value
            )
         }

         if (last.row > 0) {
            const startColumn = parent.column + columnOffset * iteration
            const endColumn = parent.column + columnOffset * (iteration + 1)

            for (let column = startColumn + 1; column <= endColumn; column++) {
               const threshold = Math.max(
                  parent.row + rowOffset * (iteration - 1),
                  1
               )
               for (let row = 0; row < threshold; row++) {
                  const value = current.get(coordinateKey(column - columnOffset, row))
                  if (value !== undefined) current.set(coordinateKey(column, row), value)
               }

               const lower = threshold
               const upper = parent.row + rowOffset * iteration
               for (let row = lower; row < upper; row++) {
                  const value = current.get(coordinateKey(column, row - 1))
                  if (value !== undefined) current.set(coordinateKey(column, row), value)
               }
            }
         }

         previous = current
      }

      return fromSparse(previous)
   }

   const limitFS = (index) => {
      const result = []
      for (let value = 1; value <= index + 1; value++) {
         result.push(Array(value).fill(value))
      }
      return result
   }

   const able = (expr) => {
      if (isInfinity(expr)) return true
      const matrix = toSparse(expr)
      const last = lastNonzero(matrix)
      return last !== null && getParent(matrix, last.column, last.row, last.value) !== null
   }

   const compare = (left, right) => {
      const leftIsInfinity = isInfinity(left)
      const rightIsInfinity = isInfinity(right)
      if (leftIsInfinity || rightIsInfinity) {
         if (leftIsInfinity && rightIsInfinity) return 0
         return leftIsInfinity ? 1 : -1
      }
      return matrix_compare(left, right)
   }

   const FS = (() => {
      const cache = Object.create(null)
      return (expr, term) => {
         const index = Math.max(0, Math.floor(Number(term) || 0))
         if (isInfinity(expr)) return limitFS(index)

         if (!Array.isArray(expr) || expr.length === 0) return []
         const key = JSON.stringify(expr)
         if (cache[key] === undefined) cache[key] = []
         if (cache[key][index] !== undefined) return cloneMatrix(cache[key][index])

         const result = expand(expr, index)
         cache[key][index] = cloneMatrix(result)
         return result
      }
   })()

   register.push({
      id: 'prms',
      name: 'Primitive Matrix System',
      display,
      fromDisplay,
      able,
      compare,
      FS,
      init: () => ([
         { expr: [[Infinity]], low: [[]], subitems: [] },
         { expr: [], low: [[]], subitems: [] },
      ]),
   })
})()
