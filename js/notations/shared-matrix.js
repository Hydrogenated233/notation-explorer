// Shared helpers for matrix-based notations
var matrix_compare = (m1,m2)=>{
   if(m1.length===0){
      if(m2.length===0) return 0
      else return -1
   }else{
      if(m2.length===0) return 1
      else{
         var col1=m1[0],col2=m2[0]
         lenDiff = col1.length-col2.length
         if(lenDiff>0) col2 = col2.concat(Array(lenDiff).fill(0))
         else if(lenDiff<0) col1 = col1.concat(Array(-lenDiff).fill(0))
         var cmp = sequence_compare(col1,col2)
         if(cmp) return cmp
         else return matrix_compare(m1.slice(1),m2.slice(1))
      }
   }
}
,matrix_display = expr=>''+expr==='Infinity'?'Limit':expr.map(col=>'('+col+')').join('')
,matrix_limit = m=>m.length>0&&m[m.length-1][0]>0
,matrix_fromDisplay = function(str) {
   str = str.trim()
   if (str === 'Limit' || str === 'Infinity' || str === '\u221e') return [Infinity]
   var result = []
   var re = /\(([^)]*)\)/g
   var match
   while ((match = re.exec(str)) !== null) {
      var colStr = match[1].trim()
      if (colStr === '') throw new Error('Empty column in matrix')
      var col = colStr.split(',').map(function(s) {
         var n = parseInt(s.trim(), 10)
         if (isNaN(n)) throw new Error('Invalid matrix element: ' + s.trim())
         return n
      })
      result.push(col)
   }
   if (result.length === 0) {
      // Try as bare comma-separated numbers = single column matrix
      var nums = str.split(',').map(function(s) {
         var n = parseInt(s.trim(), 10)
         if (isNaN(n)) throw new Error('Invalid matrix element: ' + s.trim())
         return n
      })
      result = [nums]
   }
   return result
}
