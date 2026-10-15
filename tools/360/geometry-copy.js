// Materialize the authored draw range: ray-tracing BVHs may ignore drawRange.
// Keep groups relative to the compacted index/vertex stream.
export function copyGeometry(T, source) {
 const target=new T.BufferGeometry();
 const count=source.index?.count??source.attributes.position.count;
 const start=Math.max(0,Math.min(count,source.drawRange.start));
 const end=Math.max(start,Math.min(count,start+source.drawRange.count));
 for(const key of ['position','normal','uv','uv2','color']){
  const a=source.attributes[key];if(!a||a.isInterleavedBufferAttribute)continue;
  const array=source.index||start===0&&end===count?a.array:a.array.slice(start*a.itemSize,end*a.itemSize);
  target.setAttribute(key==='uv2'?'uv1':key,new T.BufferAttribute(array,a.itemSize,a.normalized));
 }
 if(source.index)target.setIndex(new T.BufferAttribute(source.index.array.slice(start,end),1));
 for(const group of source.groups){
  const from=Math.max(start,group.start),to=Math.min(end,group.start+group.count);
  if(to>from)target.addGroup(from-start,to-from,group.materialIndex);
 }
 return target;
}
