// Whole-cafe time-slot bake: structure and furniture lightmaps for one original season/time
// button pair. Receivers are matched by the same triangle filter and hash as bake-cafe-room.py;
// unmatched or invalid states keep the original realtime materials.
import { matchSlot, stableJSON, validateAmbientSource, verifyFurnitureManifest } from './cafe-ambient.js';
import { bindSourceVisibility } from './source-visibility.js';
import { texture as textureNode, uv as uvNode, vec3 } from 'three/tsl';

export const ROOM_BAKE_ROOT='360/assets/cafe-room-bake/';
export const LARGE_SURFACE_M2=20;
// In three 0.186 node materials, material.envMapIntensity only applies to a material's own envMap;
// scene.environment uses scene.environmentIntensity. Baked surfaces therefore still received the full
// environment: its diffuse part double-counted the lightmap. This node keeps only the specular
// (reflection) part, so diffuse comes from the lightmap and reflections match the realtime path.
export function specularEnvironment(T){
 return class SpecularEnvironmentNode extends T.EnvironmentNode{
  setup(builder){const kept=builder.context.iblIrradiance;builder.context.iblIrradiance=vec3(0).toVar();try{super.setup(builder)}finally{builder.context.iblIrradiance=kept}}
 };
}

// Original 야간 button is identical in every season, so a night slot may use season "any".
export function matchRoomSlot(slot,daylight){
 if(!slot||!daylight||daylight.custom)return false;
 if(slot.time==='night')return !!daylight.night&&daylight.time==='night'&&(slot.season==='any'||slot.season===daylight.season);
 return matchSlot(slot,daylight);
}
// Every slot must describe the same receivers in the same order to share one set of bindings.
export const sameRoomLayout=(a,b)=>a.sourceSha256===b.sourceSha256&&a.triangles===b.triangles&&a.objects.length===b.objects.length&&
 a.objects.every((entry,index)=>entry.hash===b.objects[index].hash&&entry.triangles===b.objects[index].triangles&&entry.offset===b.objects[index].offset);
// Glass and translucent materials stay realtime (same rule as glazing() in the bake script).
export const isGlazing=material=>!!material&&(material.transmission>0||material.userData?.glazingRole!=null||(material.transparent&&material.opacity<.95));

// Must stay identical to receiver_triangle() in bake-cafe-room.py.
export function receiverTriangle(box,floor,ceiling,a,b,c){
 for(const p of [a,b,c])for(let k=0;k<3;k++)if(p[k]<box.min[k]||p[k]>box.max[k])return false;
 const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
 const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.sqrt(nx*nx+ny*ny+nz*nz);
 if(length<1e-9)return false;
 const cy=(a[1]+b[1]+c[1])/3;
 if(cy>ceiling+.05&&ny>.5*length)return false;
 if(cy<floor-.05&&ny<-.5*length)return false;
 return true;
}
// FNV-1a 32 over floor(world * 1000 + 0.5); Python uses the same 32-bit arithmetic.
export const hashStep=(hash,value)=>Math.imul(hash^Math.floor(value*1000+.5),16777619)>>>0;
export const FNV_OFFSET=2166136261;

// Material group of an index offset for increasing offsets (first matching group, like groups.find).
export function groupCursor(groups){
 if(!groups.length)return ()=>0;
 const sorted=groups.map((group,order)=>({...group,order})).sort((a,b)=>a.start-b.start||a.order-b.order);
 return offset=>{for(const group of sorted)if(group.start<=offset&&offset<group.start+group.count)return group.materialIndex;return 0};
}

// Returns {offsets, hash} for one mesh's receiver triangles, in source triangle order.
export function receiverTriangles(T,object,manifest){
 const geometry=object.geometry,position=geometry.attributes.position,index=geometry.index;
 if(!position)return {offsets:[],hash:FNV_OFFSET};
 const count=index?.count??position.count,materials=Array.isArray(object.material)?object.material:null;
 const groups=geometry.groups,offsets=[],matrix=object.matrixWorld.elements,points=[[0,0,0],[0,0,0],[0,0,0]];
 const {box}=manifest,floor=manifest.sourceCafeFloor,ceiling=manifest.sourceCafeCeiling,slot=groupCursor(groups);
 let hash=FNV_OFFSET;
 for(let offset=0;offset+2<count;offset+=3){
  const material=materials?materials[slot(offset)]:object.material;
  if(isGlazing(material))continue;
  for(let k=0;k<3;k++){
   const i=index?index.getX(offset+k):offset+k,x=position.getX(i),y=position.getY(i),z=position.getZ(i),p=points[k];
   // Same expression order as Matrix4.applyMatrix4 and the Python world() helper.
   const w=1/(matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15]);
   p[0]=(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])*w;p[1]=(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])*w;p[2]=(matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14])*w;
  }
  if(!receiverTriangle(box,floor,ceiling,...points))continue;
  offsets.push(offset);
  for(const p of points)for(const value of p)hash=hashStep(hash,value);
 }
 return {offsets,hash};
}

export async function createCafeRoomBake(T,scene,C,{onChange=()=>{}}={}){
 const mode=new URLSearchParams(location.search).get('ambientBake');
 // The neutral study (ambientBake=study) splits the same floor/ceiling; never bind both.
 const requested=mode!=='off'&&mode!=='study';
 let reason=requested?'loading':(mode==='study'?'study-mode':'not-requested'),valid=false,enabled=false,precisionActive=false,assetsReady=false;
 let sets=[],bindings=[],active=null,loadMs=null,coverage=null,bindMs=null,refreshVersion=0,maxSliceMs=0;
 // Interior light scale is compiled into each baked material. A shared TSL uniform was observed to
 // keep its first uploaded value across these per-object materials, so changes swap materials instead.
 const started=performance.now(),bakedMaterials=new Map();let lightScale=1,defaultLightScale=1;
 const reflections=new URLSearchParams(location.search).get('roomReflect')!=='0',SpecularEnvironmentNode=specularEnvironment(T);
 const bakedFor=(binding,set)=>Array.isArray(binding.original)?binding.original.map(m=>bakedMaterial(m,set)):bakedMaterial(binding.original,set);
 const report=()=>({requested,valid,enabled,reason,loadMs,bindMs,maxSliceMs,coverage,receivers:bindings.length,slot:enabled&&active?active.key:null,slots:sets.map(set=>set.key)});
 // 숨기지 않고 세기만 0으로: 보이는 조명 구성이 바뀌면 장면의 모든 재질이 조명 노드를 다시 만든다(첫 화면 뒤 베이크 도착 시 수 초 정지).
 function setLights(){scene.children.forEach(o=>{if(!(o.userData.cafeAmbientFallback||o.userData.cafeRoomBakedLight)||!o.isLight)return;if(o.userData.baseIntensity==null)o.userData.baseIntensity=o.intensity;o.visible=true;o.intensity=enabled?0:o.userData.baseIntensity})}
 function setDaylight(daylight){
  active=valid?sets.find(set=>matchRoomSlot(set.manifest.slot,daylight))||null:null;
  // Day lightmaps load on first use: keep the realtime path until the selected slot's map arrives.
  if(active&&!active.day){
   const waiting=active;ensureDay(waiting).then(()=>{if(valid&&matchRoomSlot(waiting.manifest.slot,C.reviewDaylight))setDaylight(C.reviewDaylight)}).catch(error=>{waiting.error=String(error.message||error);setDaylight(C.reviewDaylight)});
   active=waiting.error?null:active;
  }
  const common=C.dollMode?'dollhouse':!C.city?.visible||!C.ctx?.visible?'context-hidden':null;
  // Slot matching decides the time of day (including night); the source check covers structure and extent.
  const invalid=!valid?reason:common||(active?(active.day?validateAmbientSource(active.manifest,C.state,C.interiorDressing?.userData.cafe,null):'loading-slot:'+active.key):(daylight?.night?'night':'unbaked-time'));
  enabled=valid&&!invalid&&!precisionActive;
  if(valid)reason=invalid||(precisionActive?'precision':'active');
  for(const binding of bindings)binding.receiver.material=enabled?bakedFor(binding,active):binding.original;
  setLights();onChange();
 }
 function clear(){
  enabled=false;active=null;setLights();
  for(const binding of bindings){scene.remove(binding.receiver);binding.object.geometry=binding.sourceGeometry;binding.remainder.dispose();binding.receiver.geometry.dispose()}
  bindings=[];valid=false;bakedMaterials.forEach(material=>material.dispose());bakedMaterials.clear();
 }
 const stub={status:report,clear,refresh(){},light(){},precision(){},dispose:clear};
 if(!requested)return stub;
 const loader=new T.TextureLoader(),shared=new Map();
 // uv.bin and the interior-lights lightmap are shared by every slot; fetch each URL once.
 const once=(url,load)=>{if(!shared.has(url))shared.set(url,load(url));return shared.get(url)};
 const normalize=path=>path.split('/').reduce((parts,part)=>{if(part==='..')parts.pop();else if(part!=='.')parts.push(part);return parts},[]).join('/');
 // Content hashes from the manifest version every shared file, so a stale cached copy is never mixed in.
 const resolve=(folder,file,sha)=>{const query=sha?'?v='+sha.slice(0,12):'';try{return new URL(folder+file,location.href).href+query}catch{return normalize(folder+file)+query}};
 const texture=url=>loader.loadAsync(url).then(map=>{map.colorSpace=T.NoColorSpace;map.flipY=true;map.anisotropy=4;map.needsUpdate=true;return map});
 const ensureDay=set=>once(set.dayUrl,texture).then(map=>{set.day=map;return map});
 async function loadSet(key){
  const folder=ROOM_BAKE_ROOT+key+'/',response=await fetch(folder+'manifest.json',{cache:'no-cache'});
  if(!response.ok)throw Error('room-manifest-unavailable:'+key);
  const manifest=await response.json();
  if(manifest.kind!=='cafe-room'||manifest.slot?.key!==key||key!==manifest.slot.season+'-'+manifest.slot.time)throw Error('room-slot-key-mismatch:'+key);
  const furnitureKey=stableJSON(manifest.furnitureManifest);
  await once('furniture:'+furnitureKey,()=>verifyFurnitureManifest(manifest.furnitureManifest));
  const [uvs,lights]=await Promise.all([
   once(resolve(folder,manifest.uv.file,manifest.uv.sha256),url=>fetch(url).then(r=>{if(!r.ok)throw Error('room-uv-unavailable:'+key);return r.arrayBuffer()}).then(buffer=>new Uint16Array(buffer))),
   once(resolve(folder,manifest.lightmaps.lights.file,manifest.lightmaps.lights.sha256),texture)]);
  const dayUrl=resolve(folder,manifest.lightmaps.day.file,manifest.lightmaps.day.sha256);
  if(uvs.length!==manifest.triangles*6)throw Error('room-uv-size-mismatch:'+key);
  sets.push({key,manifest,uvs,day:null,dayUrl,lights,error:null});
 }
 function bakedMaterial(original,set){
  const cacheKey=original.uuid+':'+set.key+':'+lightScale;
  if(bakedMaterials.has(cacheKey))return bakedMaterials.get(cacheKey);
  const material=new T.MeshPhysicalNodeMaterial();
  for(const key in original)material[key]=original[key];// Same copy as three's NodeLibrary.fromMaterial.
  material.uuid=T.MathUtils.generateUUID();material.userData={...original.userData,cafeRoomBaked:set.key};
  material.aoMap=null;
  // Lightmap supplies diffuse; the scene environment supplies reflections only (roomReflect=0 removes them for comparison).
  material.setupEnvironment=builder=>reflections&&builder.environmentNode?new SpecularEnvironmentNode(builder.environmentNode):null;
  const decode=(map,scale)=>{const value=textureNode(map,uvNode(1)).rgb;return value.mul(value).mul(scale*Math.PI)};
  const day=set.manifest.lightmaps.day.scale,lights=set.manifest.lightmaps.lights.scale;
  // Sky + sun-indirect lightmap plus the separately baked cafe ceiling lights.
  const debug=new URLSearchParams(location.search).get('roomDebug');
  const irradiance=debug==='lights'?decode(set.lights,lights):debug==='day'?decode(set.day,day):lightScale>0?decode(set.day,day).add(decode(set.lights,lights*lightScale)):decode(set.day,day);
  material.setupLightMap=()=>new T.IrradianceNode(irradiance);
  // The renderer reuses compiled pipelines by material cache key, which ignores function overrides.
  // Without a distinct key the original material's shader (no lightmap) is silently reused.
  material.lightMap=set.day;
  const baseKey=material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey=()=>baseKey()+':cafe-room-bake:'+set.key+':'+(debug||'full')+':'+lightScale+':'+(reflections?'specular-env':'no-env');
  material.needsUpdate=true;bakedMaterials.set(cacheKey,material);return material;
 }
 // Matching and splitting run in short slices so the first frames and camera motion stay responsive.
 async function refresh(){
  const version=++refreshVersion;
  clear();
  if(!assetsReady)return;
  const began=performance.now();let sliceAt=performance.now();
  const yieldSlice=async()=>{const spent=performance.now()-sliceAt;if(spent<12)return true;maxSliceMs=Math.max(maxSliceMs,spent);await new Promise(resolve=>setTimeout(resolve,0));sliceAt=performance.now();return version===refreshVersion};
  try{
   const set=sets[0],manifest=set.manifest;
   const sourceIssue=validateAmbientSource(manifest,C.state,C.interiorDressing?.userData.cafe,null);
   if(sourceIssue){reason=sourceIssue;return}
   const entries=new Map(manifest.objects.map(entry=>[entry.hash+':'+entry.triangles,entry]));
   scene.updateMatrixWorld(true);
   const plans=[];let matched=0;
   for(const object of [...scene.children]){
    if(!await yieldSlice())return;
    if(!object.parent||!object.isMesh||object.isInstancedMesh||!object.userData.primary||object.userData.ambientReceiver||object.userData.roomReceiver)continue;
    const {offsets,hash}=receiverTriangles(T,object,manifest);
    if(!offsets.length)continue;
    const entry=entries.get(hash+':'+offsets.length);
    if(!entry)continue;
    entries.delete(hash+':'+offsets.length);plans.push({object,offsets,entry});matched+=offsets.length;
   }
   const matchedArea=plans.reduce((sum,plan)=>sum+(plan.entry.area||0),0);
   coverage={matchedTriangles:matched,bakedTriangles:manifest.triangles,matchedArea,bakedArea:manifest.area,ratio:manifest.area?matchedArea/manifest.area:matched/manifest.triangles,matchedObjects:plans.length,bakedObjects:manifest.objects.length,
    unmatched:[...entries.values()].sort((a,b)=>(b.area||0)-(a.area||0)).slice(0,5).map(entry=>({name:entry.name,area:entry.area,triangles:entry.triangles}))};
   // Area, not triangle count: a 14-triangle ceiling outweighs thousands of chair triangles.
   // Realtime cafe lights are switched off while baked, so no large surface may stay unmatched.
   // Rounded curtain-wall mullions are re-instanced at runtime and legitimately stay realtime.
   const largeMissing=[...entries.values()].filter(entry=>(entry.area||0)>=LARGE_SURFACE_M2);
   if(largeMissing.length){reason='room-large-surface-unmatched:'+largeMissing[0].name;return}
   if(coverage.ratio<.95){reason='room-coverage-low:'+coverage.ratio.toFixed(3);return}
   // Prepare every split first; swap geometries only after all objects are ready (no half-baked frame).
   const prepared=[];
   for(const plan of plans){if(!await yieldSlice()){prepared.forEach(dispose);return}prepared.push(prepareReceiver(T,plan,set))}
   if(version!==refreshVersion){prepared.forEach(dispose);return}
   // Fetch the currently selected slot's day map before the first bind so the bake appears in one step.
   const current=sets.find(candidate=>matchRoomSlot(candidate.manifest.slot,C.reviewDaylight));
   if(current&&!current.day)await ensureDay(current).catch(error=>{current.error=String(error.message||error)});
   if(version!==refreshVersion){prepared.forEach(dispose);return}
   for(const item of prepared)bindings.push(attachReceiver(scene,item));
   valid=true;reason='ready';setDaylight(C.reviewDaylight);
  }catch(error){clear();reason='room-receiver-error:'+String(error.message||error);console.warn('Cafe room bake disabled',error)}
  finally{bindMs=performance.now()-began;maxSliceMs=Math.max(maxSliceMs,performance.now()-sliceAt)}
 }
 const dispose=item=>{item.remainder.dispose();item.receiver.geometry.dispose()};
 const disposeTextures=()=>new Set(sets.flatMap(set=>[set.day,set.lights]).filter(Boolean)).forEach(map=>map.dispose());
 try{
  const index=await fetch(ROOM_BAKE_ROOT+'index.json',{cache:'no-cache'});
  if(!index.ok)throw Error('room-index-unavailable');
  for(const key of (await index.json()).slots)await loadSet(key);
  if(!sets.length)throw Error('no-room-sets');
  const odd=sets.find(set=>!sameRoomLayout(sets[0].manifest,set.manifest)||set.uvs!==sets[0].uvs);
  if(odd)throw Error('room-slot-layout-mismatch:'+odd.key);
  // Interior lighting design level chosen after baking (lights channel is linear in light power).
  defaultLightScale=lightScale=Math.max(0,sets[0].manifest.lightmaps.lights.defaultScale??1);
  assetsReady=true;reason='geometry-check';await refresh();
 }catch(error){
  disposeTextures();sets=[];
  reason=String(error.message||error);valid=false;enabled=false;setLights();
 }
 loadMs=performance.now()-started;
 return {status:report,clear,refresh,light:setDaylight,
  precision(value){if(precisionActive===!!value)return;precisionActive=!!value;setDaylight(C.reviewDaylight)},
  dispose(){clear();disposeTextures()},
  // true/false or a numeric scale of the separately baked cafe ceiling lights.
  interiorLights(value){
   const next=typeof value==='number'?Math.max(0,value):value?defaultLightScale:0;
   if(next===lightScale)return;
   lightScale=next;
   setDaylight(C.reviewDaylight);
  },
  lightScale:()=>lightScale};
}

function prepareReceiver(T,plan,set){
 const {object,offsets,entry}=plan,sourceGeometry=object.geometry,index=sourceGeometry.index,groups=sourceGeometry.groups;
 const total=(index?.count??sourceGeometry.attributes.position.count)/3,selected=new Set(offsets);
 const slot=groupCursor(groups);
 const kept=[],chosen=[],keptGroups=[],chosenGroups=[];
 function add(indices,list,offset){const start=indices.length,materialIndex=slot(offset);for(let k=0;k<3;k++)indices.push(index?index.getX(offset+k):offset+k);const last=list.at(-1);if(last?.materialIndex===materialIndex)last.count+=3;else list.push({start,count:3,materialIndex})}
 for(let face=0;face<total;face++){const offset=face*3;if(selected.has(offset))add(chosen,chosenGroups,offset);else add(kept,keptGroups,offset)}
 function subset(indices,list){const geometry=sourceGeometry.clone();geometry.setIndex(indices);geometry.clearGroups();for(const group of list)geometry.addGroup(group.start,group.count,group.materialIndex);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry}
 const remainder=subset(kept,keptGroups),indexed=subset(chosen,chosenGroups),receiverGeometry=indexed.toNonIndexed();indexed.dispose();
 // Lightmap UVs are per triangle corner in receiver order; uv1 replaces any contact-AO UVs.
 const uv=new Float32Array(offsets.length*6),source=set.uvs,start=entry.offset*6;
 for(let i=0;i<uv.length;i++)uv[i]=source[start+i]/65535;
 receiverGeometry.setAttribute('uv1',new T.BufferAttribute(uv,2));
 const original=object.material;
 const receiver=new T.Mesh(receiverGeometry,original);receiver.matrix.copy(object.matrix);receiver.matrixAutoUpdate=false;
 receiver.castShadow=object.castShadow;receiver.receiveShadow=object.receiveShadow;receiver.userData={...object.userData,roomReceiver:true};
 return {object,receiver,original,sourceGeometry,remainder,set};
}
function attachReceiver(scene,item){
 const {object,receiver,remainder}=item;
 if(object.sourceVisibilityObject)bindSourceVisibility(receiver,object.sourceVisibilityObject);
 receiver.visible=object.visible;object.geometry=remainder;scene.add(receiver);
 return item;
}
