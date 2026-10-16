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

export async function createCafeAmbientStudy(T,scene,C){
 const requested=new URLSearchParams(location.search).get('ambientBake')==='study';
 let reason=requested?'loading':'not-requested',valid=false,enabled=false,precisionActive=false,manifest=null,assetsReady=false,bindings=[],textures=[],loadMs=null;
 const started=performance.now();
 const report=()=>({requested,valid,enabled,reason,receivers:bindings.length,loadMs,sourceKey:manifest?.sourceSha256||null});
 function setLights(){scene.children.filter(o=>o.userData.cafeAmbientFallback).forEach(o=>o.visible=!enabled)}
 function setDaylight(daylight){
  const invalid=manifest?(C.dollMode?'dollhouse':!C.city?.visible||!C.ctx?.visible?'context-hidden':validateAmbientSource(manifest,C.state,C.interiorDressing?.userData.cafe,daylight)):reason;
  enabled=valid&&!invalid&&!precisionActive;
  reason=invalid||(!valid?reason:precisionActive?'precision':'active');
  for(const binding of bindings)binding.receiver.material=enabled?binding.baked:binding.original;
  setLights();
 }
 function clear(){
  enabled=false;setLights();
  for(const binding of bindings){
   scene.remove(binding.receiver);
   binding.object.geometry=binding.sourceGeometry;
   binding.remainder.dispose();binding.receiver.geometry.dispose();binding.baked.dispose();
  }
  bindings=[];valid=false;
 }
 if(!requested)return {status:report,clear,refresh:()=>{},light:()=>{},precision:()=>{},dispose:clear,materials:()=>[]};
 try{
  const response=await fetch('360/assets/cafe-ambient/manifest.json');
  if(!response.ok)throw Error('manifest-unavailable');
  manifest=await response.json();
  for(const [path,expected] of Object.entries(manifest.furnitureManifest)){
   const result=await fetch(path);if(!result.ok)throw Error('furniture-unavailable:'+path);
   const digest=await crypto.subtle.digest('SHA-256',await result.arrayBuffer());
   const actual=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
   if(actual!==expected)throw Error('furniture-mismatch:'+path);
  }
  const loader=new T.TextureLoader();
  for(const name of ['floor','ceiling']){
   const map=await loader.loadAsync('360/assets/cafe-ambient/'+manifest.receiverGeometry[name].runtimeImage);
   map.colorSpace=T.NoColorSpace;map.channel=1;map.flipY=true;map.anisotropy=4;map.needsUpdate=true;
   textures.push(map);
  }
  assetsReady=true;reason='geometry-check';refresh();
 }catch(error){reason=String(error.message||error);valid=false;enabled=false;setLights();}
 loadMs=performance.now()-started;
 function refresh(){
  clear();
  if(!assetsReady)return;
  try{
   const sourceIssue=validateAmbientSource(manifest,C.state,C.interiorDressing?.userData.cafe,null);
   if(sourceIssue){reason=sourceIssue;return}
   const plans=[];
   for(const [index,name] of ['floor','ceiling'].entries()){
    const target=manifest.receiverGeometry[name],matches=findReceiver(T,scene,target,name==='floor'?1:-1,manifest[name==='floor'?'sourceCafeFloor':'sourceCafeCeiling']);
    if(matches.reason){reason=matches.reason;return}
    plans.push({name,mesh:matches.mesh,offsets:matches.offsets,materialIndex:matches.materialIndex,map:textures[index]});
   }
   for(const plan of plans)bindings.push(splitReceiver(T,scene,plan,manifest.receiverGeometry[plan.name]));
   valid=bindings.length===2;reason=valid?'ready':'receiver-missing';setDaylight(C.reviewDaylight);
  }catch(error){clear();reason='receiver-error:'+String(error.message||error);console.warn('Cafe ambient study disabled',error)}
 }
 return {status:report,clear,refresh,light:setDaylight,precision(value){if(precisionActive===!!value)return;precisionActive=!!value;setDaylight(C.reviewDaylight)},dispose(){clear();textures.forEach(t=>t.dispose())},materials:()=>bindings.map(b=>b.baked)};
}

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
 const baked=original.clone();baked.lightMap=plan.map;baked.lightMapIntensity=Math.PI;baked.envMapIntensity=0;baked.aoMap=null;baked.needsUpdate=true;
 const receiver=new T.Mesh(receiverGeometry,original);receiver.matrix.copy(object.matrix);receiver.matrixAutoUpdate=false;receiver.castShadow=object.castShadow;receiver.receiveShadow=object.receiveShadow;receiver.userData={...object.userData,ambientReceiver:true};
 if(object.sourceVisibilityObject)bindSourceVisibility(receiver,object.sourceVisibilityObject);
 object.geometry=remainder;scene.add(receiver);
 return {object,receiver,original,baked,sourceGeometry,remainder};
}
