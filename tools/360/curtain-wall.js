// Render copies retain source centres and dimensions. Optional wall alignment
// rotates only the profile cross-section; original model meshes stay untouched.
// Group by scale before rounding so a tall instance cannot stretch the edge radius.
export function collectGlazingEdges(T, root, glassMaterials) {
 const edges=new Map();root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh||!glassMaterials.includes(o.material))return;
  const g=o.geometry,p=g.attributes.position,index=g.index,count=index?index.count:p.count;
  for(let i=g.drawRange.start||0;i+2<Math.min(count,(g.drawRange.start||0)+g.drawRange.count);i+=3){
   const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(o.matrixWorld));
   const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();
   if(Math.abs(normal.y)>.001||normal.lengthSq()<.5)continue;
   let a=v[0],b=v[1],distance=0;
   for(const [j,k] of [[0,1],[1,2],[2,0]]){const d=(v[j].x-v[k].x)**2+(v[j].z-v[k].z)**2;if(d>distance){distance=d;a=v[j];b=v[k]}}
   if(distance<.01)continue;
   if(a.x>b.x||(a.x===b.x&&a.z>b.z))[a,b]=[b,a];
   const edge={ax:a.x,az:a.z,bx:b.x,bz:b.z,minY:Math.min(...v.map(q=>q.y)),maxY:Math.max(...v.map(q=>q.y))};
   edges.set(Object.values(edge).map(n=>n.toFixed(5)).join(','),edge);
  }
 });return [...edges.values()];
}

export function copyRoundedMullions(T, RoundedBoxGeometry, source, material, cache=new Map(), edges=[]) {
 const p=source.geometry.parameters,worldScale=new T.Vector3();source.matrixWorld.decompose(new T.Vector3(),new T.Quaternion(),worldScale);
 if(!p?.width||Array.isArray(material)||worldScale.distanceTo(new T.Vector3(1,1,1))>1e-6)return null;
 const groups=new Map(),matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
 for(let i=0;i<source.count;i++){
  matrix.fromArray(source.instanceMatrix.array,i*16);matrix.decompose(position,rotation,scale);
  if(Math.min(scale.x,scale.y,scale.z)<=0)return null;
  const dimensions=[p.width*scale.x,p.height*scale.y,p.depth*scale.z],key=dimensions.join(',');
  if(!groups.has(key))groups.set(key,{dimensions,entries:[]});
  const worldPosition=position.clone().applyMatrix4(source.matrixWorld);let nearest=null,best=.075**2;
  for(const e of edges){
   if(worldPosition.y<e.minY-.01||worldPosition.y>e.maxY+.01)continue;
   const dx=e.bx-e.ax,dz=e.bz-e.az,t=T.MathUtils.clamp(((worldPosition.x-e.ax)*dx+(worldPosition.z-e.az)*dz)/(dx*dx+dz*dz),0,1);
   const d=(worldPosition.x-e.ax-t*dx)**2+(worldPosition.z-e.az-t*dz)**2;
   if(d<best){best=d;nearest=e}
  }
  if(nearest){
   const parentRotation=new T.Quaternion();source.matrixWorld.decompose(new T.Vector3(),parentRotation,new T.Vector3());
   rotation.setFromAxisAngle(new T.Vector3(0,1,0),-Math.atan2(nearest.bz-nearest.az,nearest.bx-nearest.ax)).premultiply(parentRotation.invert());
  }
  groups.get(key).entries.push({index:i,aligned:!!nearest,matrix:new T.Matrix4().compose(position,rotation,new T.Vector3(1,1,1))});
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
  mesh.userData.alignedToGlazing=entries.filter(e=>e.aligned).length;
  result.push(mesh);
 }
 return result;
}
