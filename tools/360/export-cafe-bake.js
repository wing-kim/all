// Evaluate in the local review page. Read-only offline ambient-bake snapshot.
// Filter triangles of large material batches instead of dropping entire batches.
(()=>{
 const w=document.querySelector('#precision-frame')?.contentWindow||window,C=w.TOWER_LAB_CONTEXT,T=C.THREE;
 // Whole 1F cafe (floor extends to x 8.44, z 13.46). The room bake box must stay inside this box.
 const room=new T.Box3(new T.Vector3(-15,-.2,-15),new T.Vector3(10,5.6,14.5));
 const surroundings=new T.Box3(new T.Vector3(-60,-1,-60),new T.Vector3(60,70,60));
 const out={version:2,state:{...C.state},daylight:C.reviewDaylight,geometries:{},materials:{},objects:[],skipped:[],floor:C.interiorDressing?.userData.cafe?.floor,ceiling:C.interiorDressing?.userData.cafe?.ceiling,camera:{position:C.camera.position.toArray(),quaternion:C.camera.quaternion.toArray(),fov:C.camera.fov},roomBox:{min:room.min.toArray(),max:room.max.toArray()},scope:'Cafe and nearby exterior triangle-filtered geometry, UVs and texture references. Ambient-only bake preparation; no direct sun is baked. No completed bake implied.'};
 let vertices=0,serial=0;const v=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),triBox=new T.Box3(),normal=new T.Vector3();
 const imageURL=t=>t?.image?.currentSrc||t?.image?.src||null;
 for(const root of [C.bld,C.interiorDressing,C.city,C.ctx]){if(!root)continue;const region=(root===C.bld||root===C.interiorDressing)?room:surroundings;root.updateMatrixWorld(true);root.traverse(o=>{
  if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;
  const ms=Array.isArray(o.material)?o.material:[o.material],g=o.geometry,p=g.attributes.position,uv=g.attributes.uv;
  if(!p)throw new Error('Bake snapshot: missing position');
  if(!g.boundingBox)g.computeBoundingBox();const one=new T.Matrix4();
  for(let instance=0;instance<(o.isInstancedMesh?o.count:1);instance++){
   if(o.isInstancedMesh){o.getMatrixAt(instance,one);one.premultiply(o.matrixWorld)}else one.copy(o.matrixWorld);
   if(!g.boundingBox.clone().applyMatrix4(one).intersectsBox(region))continue;
   const position=[],texcoord=[],index=[],groups=[],remap=new Map(),idx=g.index;
   const start=g.drawRange.start,end=Math.min(idx?.count??p.count,start+(g.drawRange.count??Infinity));
   for(let i=start;i+2<end;i+=3){const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);
    a.fromBufferAttribute(p,ids[0]).applyMatrix4(one);b.fromBufferAttribute(p,ids[1]).applyMatrix4(one);c.fromBufferAttribute(p,ids[2]).applyMatrix4(one);
    triBox.setFromPoints([a,b,c]);if(!triBox.intersectsBox(region))continue;
    const mi=Array.isArray(o.material)?(g.groups.find(q=>i>=q.start&&i<q.start+q.count)?.materialIndex||0):0,m=ms[mi];
    if(!m)throw new Error('Bake snapshot: invalid material group');
    const glass=[C.M.glass,C.M.glass1,C.M.door,C.M.guard,C.M.rail].includes(m);
    if(glass){normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();if(Math.abs(normal.y)>.999)continue;}
    const group=groups.at(-1);if(group?.materialIndex===mi)group.count+=3;else groups.push({start:index.length,count:3,materialIndex:mi});
    for(const id of ids){if(!remap.has(id)){remap.set(id,position.length/3);v.fromBufferAttribute(p,id);position.push(v.x,v.y,v.z);if(uv)texcoord.push(uv.getX(id),uv.getY(id));}index.push(remap.get(id));}
   }
   if(!index.length)continue;
   vertices+=position.length/3;if(vertices>3000000)throw new Error('Bake snapshot exceeds 3M vertices; refusing an incomplete bake');
   const key='region-'+serial++;out.geometries[key]={position,uv:uv?texcoord:null,index,groups,drawRange:{start:0,count:index.length}};
   for(const m of ms)if(!out.materials[m.uuid])out.materials[m.uuid]={name:m.name,color:m.color?.toArray()||[.5,.5,.5],roughness:m.roughness??.7,metalness:m.metalness??0,opacity:m.opacity,transparent:m.transparent,glazing:[C.M.glass,C.M.glass1,C.M.door,C.M.guard,C.M.rail].includes(m),alphaTest:m.alphaTest||0,map:imageURL(m.map),normalMap:imageURL(m.normalMap),emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity||0};
   out.objects.push({name:o.name,geometry:key,materials:ms.map(m=>m.uuid),matrix:one.toArray()});
  }
 });}
 out.vertices=vertices;return JSON.stringify(out);
})()
