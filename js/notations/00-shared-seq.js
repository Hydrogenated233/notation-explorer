// Shared helpers for sequence-based notations
var sequence_compare = (seq1,seq2)=>{
   if(seq1.length===0){
      if(seq2.length===0) return 0
      else return -1
   }else{
      if(seq2.length===0) return 1
      else{
         if(seq1[0]<seq2[0]) return -1
         else if(seq1[0]>seq2[0]) return 1
         else return sequence_compare(seq1.slice(1),seq2.slice(1))
      }
   }
}
,sequence_display = expr=>''+expr==='Infinity'?'Limit':''+expr
,pps_escape_html = value=>String(value).replace(/[&<>"']/g,char=>({
   '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char])
,pps_sequence_display_html = expr=>{
   if(''+expr==='Infinity') return 'Limit'
   if(!Array.isArray(expr)) return pps_escape_html(expr)
   return expr.map((value,index)=>
      pps_escape_html(value)+'<sub class="pps-column-index">'+(index+1)+'</sub>'
   ).join('')
}
,pps_sequence_display_latex = expr=>{
   if(''+expr==='Infinity') return 'Limit'
   if(!Array.isArray(expr)) return String(expr)
   return expr.map((value,index)=>
      String(value)+'_{\\color{gray}'+(index+1)+'}'
   ).join('')
}
,Y_limit = seq=>seq[seq.length-1]>1
