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
