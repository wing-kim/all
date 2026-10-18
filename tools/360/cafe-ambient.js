// Offline irradiance study for the exact 1F floor and ceiling source triangles.
// The original scene and default renderer path are never changed.
import { bindSourceVisibility } from './source-visibility.js';
export const stableJSON=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
export function validateAmbientSource(manifest,state,cafe,daylight){
 if(stableJSON(state)!==stableJSON(manifest.sourceState))return 'source-state-mismatch';
 if(!cafe||Math.abs(cafe.floor-manifest.sourceCafeFloor)>.001||Math.abs(cafe.ceiling-manifest.sourceCafeCeiling)>.001)return 'cafe-extent-mismatch';
 if(daylight?.night)return 'night';
 return null;
}
const fixed=value=>Math.abs(value)<.00005?'0.0000':value.toFixed(4);
export const triangleKey=points=>points.map(point=>point.map(fixed).join(',')).sort().join('|');

// Independent cached asset checks must all pass before a baked material is bound.
// Parallel requests avoid adding every network round trip to the first frame.
export async function verifyFurnitureManifest(entries,fetchAsset=fetch){
 await Promise.all(Object.entries(entries).map(async ([path,expected])=>{
  // Revalidate with the server: a cached old furniture script must never validate a stale bake.
  const result=await fetchAsset(path,{cache:'no-cache'});if(!result.ok)throw Error('furniture-unavailable:'+path);
  const digest=await crypto.subtle.digest('SHA-256',await result.arrayBuffer());
  const actual=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if(actual!==expected)throw Error('furniture-mismatch:'+path);
 }));
}

// A time-slot bake is valid only for the exact original season/time button pair.
// Custom dates, night and changed solar vectors fall back to the realtime path.
export function matchSlot(slot,daylight){
 if(!slot||!daylight||daylight.custom||daylight.night)return false;
 if(daylight.season!==slot.season||daylight.time!==slot.time)return false;
 const direction=daylight.direction||[];
 return slot.sunDirection.length===3&&slot.sunDirection.every((value,index)=>Math.abs(value-direction[index])<.002);
}
// Every bake set must describe the same receiver triangles and atlas projection.
export function sameReceivers(a,b){
 return a.sourceSha256===b.sourceSha256&&['floor','ceiling'].every(name=>{
  const left=a.receiverGeometry?.[name],right=b.receiverGeometry?.[name];
  return left&&right&&stableJSON(left.triangleKeys)===stableJSON(right.triangleKeys)&&stableJSON(left.atlasBoundsXY)===stableJSON(right.atlasBoundsXY);
 });
}

// ambientBake=study loads the neutral floor/ceiling study and any floor/ceiling slots; otherwise nothing is requested.
export async function createCafeAmbientStudy(T,scene,C){
 const mode=new URLSearchParams(location.search).get('ambientBake');
 // The whole-cafe room bake (cafe-room-bake.js) is the default; this floor/ceiling module is the diagnostic study.
 const studyRequested=mode==='study',slotsRequested=studyRequested,requested=studyRequested;
 let reason=requested?'loading':'not-requested',valid=false,enabled=false,precisionActive=false,assetsReady=false,bindings=[],sets=[],active=null,loadMs=null;
 const started=performance.now();
 const base=()=>sets[0]?.manifest||null;
 const report=()=>({requested,study:studyRequested,valid,enabled,reason,receivers:bindings.length,loadMs,sourceKey:base()?.sourceSha256||null,
  slot:enabled&&active?.slot?active.key:null,slots:sets.filter(set=>set.slot).map(set=>set.key)});
 // 조명 구성을 바꾸지 않도록 세기만 조절한다(cafe-room-bake.js와 같은 이유).
 function setLights(){scene.children.filter(o=>o.userData.cafeAmbientFallback&&o.isLight).forEach(o=>{if(o.userData.baseIntensity==null)o.userData.baseIntensity=o.intensity;o.visible=true;o.intensity=enabled?0:o.userData.baseIntensity})}
 function chooseSet(daylight){return sets.find(set=>set.slot&&matchSlot(set.slot,daylight))||sets.find(set=>!set.slot)||null}
 function setDaylight(daylight){
  active=valid?chooseSet(daylight):null;
  const common=C.dollMode?'dollhouse':!C.city?.visible||!C.ctx?.visible?'context-hidden':null;
  const invalid=!valid?reason:common||(active?validateAmbientSource(active.manifest,C.state,C.interiorDressing?.userData.cafe,daylight):(daylight?.night?'night':'unbaked-time'));
  enabled=valid&&!invalid&&!precisionActive;
  reason=valid?(invalid||(precisionActive?'precision':'active')):reason;
  const index=sets.indexOf(active);
  for(const binding of bindings)binding.receiver.material=enabled?binding.baked[index]:binding.original;
  setLights();
 }
 function clear(){
  enabled=false;active=null;setLights();
  for(const binding of bindings){
   scene.remove(binding.receiver);
   binding.object.geometry=binding.sourceGeometry;
   binding.remainder.dispose();binding.receiver.geometry.dispose();binding.baked.forEach(material=>material.dispose());
  }
  bindings=[];valid=false;
 }
 if(!requested)return {status:report,clear,refresh:()=>{},light:()=>{},precision:()=>{},dispose:clear,materials:()=>[]};
 const loader=new T.TextureLoader();
 async function loadSet(folder,key){
  const response=await fetch(folder+'manifest.json');
  if(!response.ok)throw Error('manifest-unavailable:'+key);
  const manifest=await response.json();
  if(sets.length&&!sameReceivers(sets[0].manifest,manifest))throw Error('receiver-set-mismatch:'+key);
  if(key!=='study'&&!matchSlotKey(manifest.slot,key))throw Error('slot-key-mismatch:'+key);
  await verifyFurnitureManifest(manifest.furnitureManifest);
  const maps=await Promise.all(['floor','ceiling'].map(async name=>{
   const map=await loader.loadAsync(folder+manifest.receiverGeometry[name].runtimeImage);
   map.colorSpace=T.NoColorSpace;map.channel=1;map.flipY=true;map.anisotropy=4;map.needsUpdate=true;return map;
  }));
  sets.push({key,manifest,maps,slot:manifest.slot||null});
 }
 try{
  if(studyRequested)await loadSet('360/assets/cafe-ambient/','study');
  if(slotsRequested){
   const index=await fetch('360/assets/cafe-ambient-slots/index.json');
   if(!index.ok)throw Error('slot-index-unavailable');
   for(const key of (await index.json()).slots)await loadSet('360/assets/cafe-ambient-slots/'+key+'/',key);
  }
  if(!sets.length)throw Error('no-bake-sets');
  assetsReady=true;reason='geometry-check';refresh();
 }catch(error){
  // Partial loads never bind: every loaded set must pass before any receiver changes.
  sets.forEach(set=>set.maps.forEach(map=>map.dispose()));sets=[];
  reason=String(error.message||error);valid=false;enabled=false;setLights();
 }
 loadMs=performance.now()-started;
 function refresh(){
  clear();
  if(!assetsReady)return;
  try{
   const manifest=base(),sourceIssue=validateAmbientSource(manifest,C.state,C.interiorDressing?.userData.cafe,null);
   if(sourceIssue){reason=sourceIssue;return}
   const plans=[];
   for(const [index,name] of ['floor','ceiling'].entries()){
    const target=manifest.receiverGeometry[name],matches=findReceiver(T,scene,target,name==='floor'?1:-1,manifest[name==='floor'?'sourceCafeFloor':'sourceCafeCeiling']);
    if(matches.reason){reason=matches.reason;return}
    plans.push({name,mesh:matches.mesh,offsets:matches.offsets,materialIndex:matches.materialIndex,maps:sets.map(set=>set.maps[index])});
   }
   for(const plan of plans)bindings.push(splitReceiver(T,scene,plan,manifest.receiverGeometry[plan.name]));
   valid=bindings.length===2;reason=valid?'ready':'receiver-missing';setDaylight(C.reviewDaylight);
  }catch(error){clear();reason='receiver-error:'+String(error.message||error);console.warn('Cafe ambient bake disabled',error)}
 }
 return {status:report,clear,refresh,light:setDaylight,precision(value){if(precisionActive===!!value)return;precisionActive=!!value;setDaylight(C.reviewDaylight)},dispose(){clear();sets.forEach(set=>set.maps.forEach(map=>map.dispose()))},materials:()=>bindings.flatMap(b=>b.baked)};
}
const matchSlotKey=(slot,key)=>!!slot&&slot.key===key&&key===slot.season+'-'+slot.time;

export function findReceiver(T,scene,target,facing,height){
 const expected=new Set(target.triangleKeys),matches=[],point=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const bounds=target.atlasBoundsXY,box=new T.Box3(),found=new Set();
 scene.updateMatrixWorld(true);
 for(const object of scene.children){
  if(!object.isMesh||object.isInstancedMesh||!object.userData.primary||object.userData.ambientReceiver)continue;
  box.setFromObject(object);
  if(box.min.y>height+.001||box.max.y<height-.001||box.max.x<bounds[0]-.01||box.min.x>bounds[2]+.01||box.max.z<-bounds[3]-.01||box.min.z>-bounds[1]+.01)continue;
  const geometry=object.geometry,position=geometry.attributes.position,index=geometry.index;
  if(!position)continue;
  const count=index?.count??position.count;
  for(let offset=0;offset+2<count;offset+=3){
   for(let k=0;k<3;k++)point[k].fromBufferAttribute(position,index?index.getX(offset+k):offset+k).applyMatrix4(object.matrixWorld);
   if(point.some(p=>Math.abs(p.y-height)>.001))continue;
   const a=point[0],b=point[1],c=point[2],normal=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
   if(normal*facing>=0)continue; // This signed XZ cross is opposite the Y normal.
   const key=triangleKey(point.map(p=>[p.x,p.y,p.z]));
   if(!expected.has(key))continue;
   if(found.has(key))return {reason:'receiver-duplicate:'+key};
   found.add(key);
   const materialIndex=geometry.groups.find(group=>group.start<=offset&&offset<group.start+group.count)?.materialIndex||0;
   matches.push({mesh:object,offset,materialIndex});
  }
 }
 if(found.size!==expected.size)return {reason:'receiver-triangle-mismatch:'+found.size+'/'+expected.size};
 const mesh=matches[0]?.mesh,materialIndex=matches[0]?.materialIndex;
 if(matches.some(hit=>hit.mesh!==mesh||hit.materialIndex!==materialIndex))return {reason:'receiver-material-mismatch'};
 return {mesh,offsets:new Set(matches.map(hit=>hit.offset)),materialIndex};
}

function splitReceiver(T,scene,plan,target){
 const object=plan.mesh,sourceGeometry=object.geometry,position=sourceGeometry.attributes.position,index=sourceGeometry.index;
 const faceCount=(index?.count??position.count)/3,kept=[],selected=[];
 const groups=sourceGeometry.groups;
 function slot(offset){return groups.find(group=>group.start<=offset&&offset<group.start+group.count)?.materialIndex||0}
 const keptGroups=[],selectedGroups=[];
 function addFace(indices,groupList,offset){
  const start=indices.length,materialIndex=slot(offset);for(let k=0;k<3;k++)indices.push(index?index.getX(offset+k):offset+k);
  const last=groupList.at(-1);if(last?.materialIndex===materialIndex)last.count+=3;else groupList.push({start,count:3,materialIndex});
 }
 for(let face=0;face<faceCount;face++){
  const offset=face*3;if(plan.offsets.has(offset))addFace(selected,selectedGroups,offset);else addFace(kept,keptGroups,offset);
 }
 function subset(indices,subsetGroups){const geometry=sourceGeometry.clone();geometry.setIndex(indices);geometry.clearGroups();for(const group of subsetGroups)geometry.addGroup(group.start,group.count,group.materialIndex);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry}
 const remainder=subset(kept,keptGroups),receiverGeometry=subset(selected,selectedGroups);
 const uv=new Float32Array(position.count*2),point=new T.Vector3(),[xmin,ymin,xmax,ymax]=target.atlasBoundsXY;
 for(let i=0;i<position.count;i++){
  point.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld);
  uv[2*i]=.02+.96*(point.x-xmin)/(xmax-xmin);
  uv[2*i+1]=.02+.96*(-point.z-ymin)/(ymax-ymin);
 }
 receiverGeometry.setAttribute('uv1',new T.BufferAttribute(uv,2));
 const original=Array.isArray(object.material)?object.material[plan.materialIndex]:object.material;
 if(!original)throw Error('receiver-material-missing');
 // Cycles diffuse/color-off bake is outgoing Lambert radiance for a white receiver.
 // Three's PhysicalLightingModel treats lightMap RGB as irradiance before albedo/PI.
 const baked=plan.maps.map(map=>{const material=original.clone();material.lightMap=map;material.lightMapIntensity=Math.PI;material.envMapIntensity=0;material.aoMap=null;material.needsUpdate=true;return material});
 const receiver=new T.Mesh(receiverGeometry,original);receiver.matrix.copy(object.matrix);receiver.matrixAutoUpdate=false;receiver.castShadow=object.castShadow;receiver.receiveShadow=object.receiveShadow;receiver.userData={...object.userData,ambientReceiver:true};
 if(object.sourceVisibilityObject)bindSourceVisibility(receiver,object.sourceVisibilityObject);
 object.geometry=remainder;scene.add(receiver);
 return {object,receiver,original,baked,sourceGeometry,remainder};
}
