// Evaluate in the local review page's precision-frame for offline bake preparation.
// Snapshot only. Never changes geometry or source materials.
(()=>{
 const w=document.querySelector('#precision-frame')?.contentWindow||window,C=w.TOWER_LAB_CONTEXT,T=C.THREE;
 const region=new T.Box3(new T.Vector3(-14,-.2,-14),new T.Vector3(3,5.6,11));
 const out={state:{...C.state},geometries:{},materials:{},objects:[],skipped:[],floor:C.interiorDressing?.userData.cafe?.floor,ceiling:C.interiorDressing?.userData.cafe?.ceiling,camera:{position:C.camera.position.toArray(),quaternion:C.camera.quaternion.toArray(),fov:C.camera.fov},scope:'bounded cafe geometry and material colors; textures and exterior occluders not included; not a completed lighting bake'};
 let vertices=0;
 for(const root of [C.bld,C.interiorDressing]){if(!root)continue;root.updateMatrixWorld(true);root.traverse(o=>{
  if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;
  const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m.alphaTest>0))return;
  const g=o.geometry;if(!g.attributes.position||g.attributes.position.isInterleavedBufferAttribute)return;
  if(!g.boundingBox)g.computeBoundingBox();const matrices=[];const one=new T.Matrix4();
  for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){if(o.isInstancedMesh){o.getMatrixAt(i,one);one.premultiply(o.matrixWorld)}else one.copy(o.matrixWorld);if(g.boundingBox.clone().applyMatrix4(one).intersectsBox(region))matrices.push(one.toArray());}
  if(!matrices.length)return;
  if(!out.geometries[g.uuid]){if(vertices+g.attributes.position.count>250000){out.skipped.push({name:o.name,reason:'vertex budget',vertices:g.attributes.position.count});return;}vertices+=g.attributes.position.count;out.geometries[g.uuid]={position:Array.from(g.attributes.position.array),index:g.index?Array.from(g.index.array):null,groups:g.groups,drawRange:{start:g.drawRange.start,count:Number.isFinite(g.drawRange.count)?g.drawRange.count:null}};}
  for(const m of ms)if(!out.materials[m.uuid])out.materials[m.uuid]={color:m.color?.toArray()||[.5,.5,.5],roughness:m.roughness??.7,metalness:m.metalness??0,opacity:m.opacity,transparent:m.transparent,emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity||0};
  for(const matrix of matrices)out.objects.push({name:o.name,geometry:g.uuid,materials:ms.map(m=>m.uuid),matrix});
 });}
 out.vertices=vertices;return JSON.stringify(out);
})()
