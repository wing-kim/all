import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as T from 'three';
import {createCafeAmbientStudy,findReceiver,matchSlot,sameReceivers,triangleKey,validateAmbientSource} from './cafe-ambient.js';

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
globalThis.location={search:'?lab=360&ambientBake=off'};
globalThis.fetch=()=>{throw Error('ambientBake=off must not load bake assets')};
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
 const context={state:mismatch?{...state,floors:7}:state,interiorDressing:{userData:{cafe:{floor:.07,ceiling:5.02}}},city:{visible:true},ctx:{visible:true},reviewDaylight:{night}};
 return {scene,context,studyManifest,state};
}
const fakeThree={...T,TextureLoader:class{async loadAsync(){return new T.Texture()}}};
// Route fixture requests: the study manifest, an optional slot index and slot manifests.
const route=(study,slots={})=>async url=>url.endsWith('cafe-ambient-slots/index.json')?{ok:true,json:async()=>({slots:Object.keys(slots)})}
 :url.includes('cafe-ambient-slots/')?{ok:true,json:async()=>slots[url.split('/').at(-2)]}:{ok:true,json:async()=>study};
globalThis.location={search:'?ambientBake=study'};
try{
 for(const [night,mismatch] of [[true,false],[false,true]]){
  const {scene,context,studyManifest,state}=recoveryFixture(night,mismatch);
  globalThis.fetch=route(studyManifest);
  const study=await createCafeAmbientStudy(fakeThree,scene,context);
  assert.equal(study.status().enabled,false,'an initially invalid study is fail-closed');
  assert.equal(study.status().reason,night?'night':'source-state-mismatch');
  context.state=state;context.reviewDaylight={night:false};study.refresh();study.light(context.reviewDaylight);
  assert.equal(study.status().enabled,true,'matching daytime can recover without reloading assets');
  context.dollMode=true;study.light(context.reviewDaylight);
  assert.equal(study.status().reason,'dollhouse');assert.equal(study.status().enabled,false);
  context.dollMode=false;context.ctx.visible=false;study.light(context.reviewDaylight);
  assert.equal(study.status().reason,'context-hidden');assert.equal(study.status().enabled,false);
  context.ctx.visible=true;study.light(context.reviewDaylight);
  assert.equal(study.status().enabled,true,'restored spatial context can re-enable the study');
  study.dispose();
 }
 const failed=recoveryFixture(false);
 globalThis.fetch=async()=>({ok:false});
 const unavailable=await createCafeAmbientStudy(fakeThree,failed.scene,failed.context);
 assert.equal(unavailable.status().reason,'manifest-unavailable:study');
 unavailable.refresh();unavailable.light({night:false});
 assert.equal(unavailable.status().reason,'manifest-unavailable:study','failed assets cannot bind on a later refresh');

 // Time-slot bakes: exact original season/time button pairs only.
 const slot={key:'spring-pm',season:'spring',time:'pm',sunDirection:[.0758,.6412,.7636]};
 const springPm={season:'spring',time:'pm',custom:false,night:false,direction:[.07581,.64119,.76361]};
 assert.equal(matchSlot(slot,springPm),true);
 assert.equal(matchSlot(slot,{...springPm,custom:true}),false,'custom date/time never uses a slot bake');
 assert.equal(matchSlot(slot,{...springPm,time:'am'}),false);
 assert.equal(matchSlot(slot,{...springPm,season:'summer'}),false);
 assert.equal(matchSlot(slot,{...springPm,direction:[.2,.6,.76]}),false,'a changed solar vector invalidates the slot');
 const fixture=recoveryFixture(false);
 const slotManifest={...fixture.studyManifest,slot};
 assert.equal(sameReceivers(fixture.studyManifest,slotManifest),true);
 assert.equal(sameReceivers(fixture.studyManifest,{...slotManifest,sourceSha256:'other'}),false);
 globalThis.location={search:'?lab=360'};
 globalThis.fetch=route(fixture.studyManifest,{'spring-pm':slotManifest});
 fixture.context.reviewDaylight=springPm;
 const slotted=await createCafeAmbientStudy(fakeThree,fixture.scene,fixture.context);
 assert.equal(slotted.status().study,false,'default review mode loads slots without the neutral study');
 assert.deepEqual(slotted.status().slots,['spring-pm']);
 assert.equal(slotted.status().enabled,true);assert.equal(slotted.status().slot,'spring-pm');
 slotted.light({...springPm,time:'sunset',direction:[-.5,.11,.86]});
 assert.equal(slotted.status().enabled,false);assert.equal(slotted.status().reason,'unbaked-time','other times keep the realtime path');
 slotted.light({...springPm,night:true});assert.equal(slotted.status().reason,'night');
 slotted.light(springPm);assert.equal(slotted.status().slot,'spring-pm','returning to the baked pair re-enables the slot');
 slotted.dispose();
 const mismatched=recoveryFixture(false);
 globalThis.fetch=route(mismatched.studyManifest,{'spring-pm':{...slotManifest,slot:{...slot,key:'summer-pm'}}});
 const rejected=await createCafeAmbientStudy(fakeThree,mismatched.scene,mismatched.context);
 assert.equal(rejected.status().reason,'slot-key-mismatch:spring-pm');assert.equal(rejected.status().enabled,false);
}finally{globalThis.location=previousLocation;globalThis.fetch=previousFetch}
console.log('cafe ambient bake: source guards, ambientBake=off contract and time-slot selection passed');
