export function summarizeSamples(samples){
 if(!samples.length)return {samples:0,p50:null,p95:null,p99:null,max:null,over100Ms:0,over200Ms:0};
 const sorted=[...samples].sort((a,b)=>a-b);
 const percentile=p=>sorted[Math.ceil(p*sorted.length)-1];
 return {samples:samples.length,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),max:sorted.at(-1),over100Ms:samples.filter(v=>v>100).length,over200Ms:samples.filter(v=>v>200).length};
}
