export function batchStaticSurroundings(T,mergeGeometries,scene){
 // Coalesce exact-equivalent opaque surroundings without changing any surface data.
 // Keep the building separate so model updates never rebuild these buffers.
 const palette=new Map(),batches=new Map(),sources=new Map();
 for(const o of scene.children){
  // Keep dense scanned assets instanced by shared geometry in the path tracer.
  // Flattening repeated foliage into large unique meshes explodes BVH/storage size.
  // 원본 occl()로 건물 단위 숨김이 바뀌는 주변 건물(본체·부속)은 개별로 남긴다.
  if(!o.isMesh||o.isInstancedMesh||o.geometry.attributes.position.count>3000||o.userData.primary||o.userData.sourceOverlay||o.userData.occlusionLinked||Array.isArray(o.material)||o.material.transparent||o.material.transmission)continue;
  const m=o.material,key=JSON.stringify([m.color.toArray(),m.emissive.toArray(),m.emissiveIntensity,m.roughness,m.metalness,m.side,m.opacity,m.alphaTest,m.clearcoat,m.clearcoatRoughness,m.normalScale.toArray(),m.bumpScale,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,...['map','normalMap','roughnessMap','metalnessMap','bumpMap','emissiveMap','alphaMap'].map(k=>m[k]?.uuid)]);
  if(!palette.has(key))palette.set(key,m);o.material=palette.get(key);
  const center=new T.Vector3();o.geometry.computeBoundingBox();o.geometry.boundingBox.getCenter(center).applyMatrix4(o.matrix);
  const groupKey=[o.material.uuid,o.castShadow,o.receiveShadow,o.visible,o.userData.contextKind||'',!!o.userData.outdoorEnhancement,Math.floor(center.x/48),Math.floor(center.z/48)].join(':');
  if(!batches.has(groupKey))batches.set(groupKey,[]);batches.get(groupKey).push(o);
 }
 let batchedObjects=0,batchBoundsDelta=0;
 for(const objects of batches.values()){
  if(objects.length<2)continue;
  const parts=objects.map(o=>{let g=o.geometry.clone().applyMatrix4(o.matrix);if(g.index){const indexed=g;g=g.toNonIndexed();indexed.dispose()}return g});
  const attrs=Object.keys(parts[0].attributes).sort().join(',');
  if(parts.some(g=>Object.keys(g.attributes).sort().join(',')!==attrs)){parts.forEach(g=>g.dispose());continue;}
  const before=new T.Box3();parts.forEach(g=>{g.computeBoundingBox();before.union(g.boundingBox)});
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!merged)continue;
  merged.computeBoundingBox();
  const delta=Math.max(before.min.distanceTo(merged.boundingBox.min),before.max.distanceTo(merged.boundingBox.max));batchBoundsDelta=Math.max(batchBoundsDelta,delta);
  if(delta>.001){merged.dispose();continue;}
  const first=objects[0],mesh=new T.Mesh(merged,first.material);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.visible=first.visible;mesh.userData={...first.userData};scene.add(mesh);sources.set(mesh,objects);objects.forEach(o=>scene.remove(o));batchedObjects+=objects.length-1;
 }
 return {batchedObjects,batchBoundsDelta,sources};
}

// Keep geometry sharing for the BVH; raster batches are a draw-call optimization only.
export function createPrecisionScene(T,scene,sources){
 const result=new T.Scene();result.environment=scene.environment;result.environmentIntensity=scene.environmentIntensity;result.environmentRotation.copy(scene.environmentRotation);result.background=scene.background;result.backgroundIntensity=scene.backgroundIntensity;result.backgroundRotation.copy(scene.backgroundRotation);
 for(const object of scene.children)for(const source of sources.get(object)||[object]){if(source.userData.reviewLimit)continue;const copy=source.clone(false);copy.visible=object.visible;result.add(copy);}
 return result;
}
