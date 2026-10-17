// The source massing prism includes horizontal glass caps coplanar with slabs.
// Keep all vertical/sloped window triangles; omit only artificial horizontal caps.
// This affects the render copy, never the authored plan or source geometry.
export function glazingSides(T,geometry,matrix){
 const result=geometry.clone(),p=geometry.attributes.position,idx=geometry.index,indices=[];
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3();
 for(let i=0,count=idx?.count??p.count;i+2<count;i+=3){const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);a.fromBufferAttribute(p,ids[0]).applyMatrix4(matrix);b.fromBufferAttribute(p,ids[1]).applyMatrix4(matrix);c.fromBufferAttribute(p,ids[2]).applyMatrix4(matrix);n.crossVectors(b.sub(a),c.sub(a)).normalize();if(Math.abs(n.y)<.999)indices.push(...ids);}
 result.clearGroups();result.setIndex(indices);return result;
}
