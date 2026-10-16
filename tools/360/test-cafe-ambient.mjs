import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as T from 'three';
import {createCafeAmbientStudy,findReceiver,triangleKey,validateAmbientSource} from './cafe-ambient.js';

const manifest=JSON.parse(readFileSync(new URL('./ambient-proof/manifest.json',import.meta.url),'utf8'));
const cafe={floor:manifest.sourceCafeFloor,ceiling:manifest.sourceCafeCeiling};
assert.equal(validateAmbientSource(manifest,manifest.sourceState,cafe,{night:false}),null);
assert.equal(validateAmbientSource(manifest,{...manifest.sourceState,floors:7},cafe,{night:false}),'source-state-mismatch');
assert.equal(validateAmbientSource(manifest,manifest.sourceState,{...cafe,ceiling:cafe.ceiling+.1},{night:false}),'cafe-extent-mismatch');
assert.equal(validateAmbientSource(manifest,manifest.sourceState,cafe,{night:true}),'night');
const key=manifest.receiverGeometry.floor.triangleKeys[0];
assert.equal(triangleKey(key.split('|').reverse().map(point=>point.split(',').map(Number))),key,'receiver matching is independent of vertex order');
const sourcePath=new URL('./cafe-ambient-source.json.gz',import.meta.url);
if(existsSync(sourcePath)){
 const source=JSON.parse(gunzipSync(readFileSync(sourcePath))),scene=new T.Scene();
 for(const name of ['floor','ceiling']){
  const geometryKey=manifest.receiverGeometry[name].geometryKey,object=source.objects.find(item=>item.geometry===geometryKey),data=source.geometries[geometryKey];
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.position,3));geometry.setIndex(data.index);
  for(const group of data.groups)geometry.addGroup(group.start,group.count,group.materialIndex);
  const mesh=new T.Mesh(geometry,new T.MeshPhysicalMaterial());mesh.matrix.fromArray(object.matrix);mesh.matrixAutoUpdate=false;mesh.userData.primary=true;scene.add(mesh);
 }
 for(const name of ['floor','ceiling']){
  const result=findReceiver(T,scene,manifest.receiverGeometry[name],name==='floor'?1:-1,manifest[name==='floor'?'sourceCafeFloor':'sourceCafeCeiling']);
  assert.equal(result.reason,undefined,`${name} receiver exists in source snapshot`);
  assert.equal(result.offsets.size,manifest.receiverGeometry[name].triangleCount);
 }
}

const previousLocation=globalThis.location,previousFetch=globalThis.fetch;
globalThis.location={search:'?lab=360'};
globalThis.fetch=()=>{throw Error('default mode must not load study assets')};
try{
 const study=await createCafeAmbientStudy(null,{children:[]},{state:manifest.sourceState});
 assert.deepEqual(study.status().requested,false);
 study.light({night:false});study.refresh();study.dispose();
 assert.equal(study.status().enabled,false);
}finally{globalThis.location=previousLocation;globalThis.fetch=previousFetch}

function recoveryFixture(night,mismatch=false){
 const scene=new T.Scene(),state={...manifest.sourceState};
 for(const [name,height,vertices] of [
  ['floor',.07,[0,.07,0,0,.07,1,1,.07,0]],
  ['ceiling',5.02,[0,5.02,0,1,5.02,0,0,5.02,1]]]){
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex([0,1,2]);geometry.addGroup(0,3,0);
  const mesh=new T.Mesh(geometry,new T.MeshPhysicalMaterial());mesh.userData.primary=true;scene.add(mesh);
 }
 const studyManifest={sourceState:state,sourceCafeFloor:.07,sourceCafeCeiling:5.02,sourceSha256:'fixture',furnitureManifest:{},receiverGeometry:{}};
 for(const [name,height,vertices] of [
  ['floor',.07,[[0,.07,0],[0,.07,1],[1,.07,0]]],
  ['ceiling',5.02,[[0,5.02,0],[1,5.02,0],[0,5.02,1]]]])
  studyManifest.receiverGeometry[name]={triangleKeys:[triangleKey(vertices)],atlasBoundsXY:[0,-1,1,0],runtimeImage:name+'.png'};
 const context={state:mismatch?{...state,floors:7}:state,interiorDressing:{userData:{cafe:{floor:.07,ceiling:5.02}}},reviewDaylight:{night}};
 return {scene,context,studyManifest,state};
}
const fakeThree={...T,TextureLoader:class{async loadAsync(){return new T.Texture()}}};
globalThis.location={search:'?ambientBake=study'};
try{
 for(const [night,mismatch] of [[true,false],[false,true]]){
  const {scene,context,studyManifest,state}=recoveryFixture(night,mismatch);
  globalThis.fetch=async()=>({ok:true,json:async()=>studyManifest});
  const study=await createCafeAmbientStudy(fakeThree,scene,context);
  assert.equal(study.status().enabled,false,'an initially invalid study is fail-closed');
  assert.equal(study.status().reason,night?'night':'source-state-mismatch');
  context.state=state;context.reviewDaylight={night:false};study.refresh();study.light(context.reviewDaylight);
  assert.equal(study.status().enabled,true,'matching daytime can recover without reloading assets');
  study.dispose();
 }
 const failed=recoveryFixture(false);
 globalThis.fetch=async()=>({ok:false});
 const unavailable=await createCafeAmbientStudy(fakeThree,failed.scene,failed.context);
 assert.equal(unavailable.status().reason,'manifest-unavailable');
 unavailable.refresh();unavailable.light({night:false});
 assert.equal(unavailable.status().reason,'manifest-unavailable','failed assets cannot bind on a later refresh');
}finally{globalThis.location=previousLocation;globalThis.fetch=previousFetch}
console.log('cafe ambient study: source guards and default-off contract passed');
