// Rounded render copies keep the original instance envelopes and source meshes.
// Group by scale before rounding so a tall instance cannot stretch the edge radius.
export function copyRoundedMullions(T, RoundedBoxGeometry, source, material, cache=new Map()) {
 const p=source.geometry.parameters,worldScale=new T.Vector3();source.matrixWorld.decompose(new T.Vector3(),new T.Quaternion(),worldScale);
 if(!p?.width||Array.isArray(material)||worldScale.distanceTo(new T.Vector3(1,1,1))>1e-6)return null;
 const groups=new Map(),matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
 for(let i=0;i<source.count;i++){
  matrix.fromArray(source.instanceMatrix.array,i*16);matrix.decompose(position,rotation,scale);
  if(Math.min(scale.x,scale.y,scale.z)<=0)return null;
  const dimensions=[p.width*scale.x,p.height*scale.y,p.depth*scale.z],key=dimensions.join(',');
  if(!groups.has(key))groups.set(key,{dimensions,entries:[]});
  groups.get(key).entries.push({index:i,matrix:new T.Matrix4().compose(position,rotation,new T.Vector3(1,1,1))});
 }
 const result=[];
 for(const [key,{dimensions,entries}] of groups){
  if(!cache.has(key))cache.set(key,new RoundedBoxGeometry(...dimensions,1,.0025));
  const mesh=new T.InstancedMesh(cache.get(key),material,entries.length);
  entries.forEach((e,i)=>{
   mesh.setMatrixAt(i,e.matrix);
   if(source.instanceColor)mesh.setColorAt(i,new T.Color().fromArray(source.instanceColor.array,e.index*3));
  });
  mesh.instanceMatrix.needsUpdate=true;mesh.matrix.copy(source.matrixWorld);mesh.matrixAutoUpdate=false;
  mesh.castShadow=source.castShadow;mesh.receiveShadow=true;mesh.name='Rounded curtain-wall render instances';
  mesh.userData.sourceUuid=source.uuid;mesh.userData.sourceInstanceIndices=entries.map(e=>e.index);mesh.userData.edgeRadius=.0025;
  result.push(mesh);
 }
 return result;
}
