import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as T from 'three';
import {FNV_OFFSET,hashStep,isGlazing,receiverTriangle,receiverTriangles} from './cafe-room-bake.js';

// Python parity of the 32-bit FNV step, including negative quantised coordinates.
assert.equal(hashStep(FNV_OFFSET,0),Math.imul(FNV_OFFSET,16777619)>>>0);
assert.equal(hashStep(hashStep(FNV_OFFSET,-1.2345),5.0004),hashStep(hashStep(FNV_OFFSET,-1.2345),5.0004));
assert.notEqual(hashStep(FNV_OFFSET,1.0004),hashStep(FNV_OFFSET,1.0006),'millimetre steps change the hash');

const box={min:[-1,-.08,-1],max:[1,5.47,1]};
assert.equal(receiverTriangle(box,.07,5.02,[0,.07,0],[0,.07,.5],[.5,.07,0]),true,'floor triangle');
assert.equal(receiverTriangle(box,.07,5.02,[0,.07,0],[0,.07,2],[.5,.07,0]),false,'outside the room box');
assert.equal(receiverTriangle(box,.07,5.02,[0,5.4,0],[0,5.4,.5],[.5,5.4,0]),false,'upper slab top is not a cafe surface');
assert.equal(receiverTriangle(box,.07,5.02,[0,0,0],[0,0,0],[.5,0,0]),false,'degenerate triangle');
assert.equal(isGlazing({transmission:1}),true);assert.equal(isGlazing({transparent:true,opacity:.5}),true);assert.equal(isGlazing({transparent:false,opacity:1}),false);

// Every baked object must be reproduced by the runtime filter from the same snapshot.
const manifestPath=new URL('../../new/360/assets/cafe-room-bake/spring-pm/manifest.json',import.meta.url),sourcePath=new URL('./cafe-ambient-source.json.gz',import.meta.url);
if(existsSync(manifestPath)&&existsSync(sourcePath)){
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8')),source=JSON.parse(gunzipSync(readFileSync(sourcePath)));
 const expected=new Map(manifest.objects.map(entry=>[entry.hash+':'+entry.triangles,entry]));
 const materials=Object.fromEntries(Object.entries(source.materials).map(([key,data])=>{
  const material=new T.MeshPhysicalMaterial({transparent:!!data.transparent,opacity:data.opacity??1});
  if(data.glazing)material.transmission=1;return [key,material];
 }));
 let found=0;
 for(const object of source.objects){
  const data=source.geometries[object.geometry],geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(data.position,3));
  if(data.index)geometry.setIndex(data.index);
  for(const group of data.groups)geometry.addGroup(group.start,group.count,group.materialIndex);
  const list=object.materials.map(key=>materials[key]);
  const mesh=new T.Mesh(geometry,list.length===1?list[0]:list);mesh.matrixWorld.fromArray(object.matrix);
  const {offsets,hash}=receiverTriangles(T,mesh,manifest);
  if(expected.has(hash+':'+offsets.length)){found++;expected.delete(hash+':'+offsets.length)}
 }
 assert.equal(expected.size,0,`runtime filter reproduces every baked object (${found} matched, missing ${[...expected.values()].slice(0,3).map(e=>e.name)})`);
 assert.equal(manifest.objects.reduce((sum,entry)=>sum+entry.triangles,0),manifest.triangles);
 console.log(`cafe room bake: ${found}/${manifest.objects.length} objects, ${manifest.triangles} triangles reproduced from the snapshot`);
}else console.log('cafe room bake: snapshot or local bake output absent; parity check skipped');
console.log('cafe room bake: filter, hash and glazing rules passed');

// Lifecycle with a one-triangle fixture: slot matching, light hand-off, fail-closed loads.
const {createCafeRoomBake}=await import('./cafe-room-bake.js');
const fakeThree={...T,MeshPhysicalNodeMaterial:class extends T.MeshPhysicalMaterial{},IrradianceNode:class{constructor(node){this.node=node;this.isLightingNode=true}},
 TextureLoader:class{async loadAsync(){return new T.Texture()}}};
function roomFixture(){
 const scene=new T.Scene(),state={floors:6};
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,.07,0,0,.07,1,1,.07,0, 40,.07,0,40,.07,1,41,.07,0],3));
 const mesh=new T.Mesh(geometry,new T.MeshPhysicalMaterial());mesh.userData.primary=true;scene.add(mesh);
 const ceilingLight=new T.Object3D();ceilingLight.userData.cafeRoomBakedLight=true;scene.add(ceilingLight);
 const manifest={kind:'cafe-room',slot:{key:'spring-pm',season:'spring',time:'pm',sunDirection:[.0758,.6412,.7636]},sourceState:state,sourceCafeFloor:.07,sourceCafeCeiling:5.02,
  furnitureManifest:{},box:{min:[-1,-.08,-1],max:[2,5.47,2]},uv:{file:'uv.bin'},lightmaps:{day:{file:'day.png',scale:.5},lights:{file:'lights.png',scale:.5}}};
 scene.updateMatrixWorld(true);
 const {offsets,hash}=receiverTriangles(T,mesh,manifest);
 Object.assign(manifest,{triangles:offsets.length,area:.5,objects:[{hash,triangles:offsets.length,offset:0,area:.5}]});
 const context={state,interiorDressing:{userData:{cafe:{floor:.07,ceiling:5.02}}},city:{visible:true},ctx:{visible:true},reviewDaylight:{season:'spring',time:'pm',custom:false,night:false,direction:[.0758,.6412,.7636]}};
 const route=async url=>url.endsWith('cafe-room-bake/index.json')?{ok:true,json:async()=>({slots:['spring-pm']})}
  :url.endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>new Uint16Array(offsets.length*6).buffer};
 return {scene,mesh,ceilingLight,manifest,context,route};
}
const previousLocation=globalThis.location,previousFetch=globalThis.fetch;
try{
 for(const search of ['?ambientBake=off','?ambientBake=study']){
  globalThis.location={search};globalThis.fetch=()=>{throw Error('no room bake request expected')};
  const f=roomFixture(),bake=await createCafeRoomBake(fakeThree,f.scene,f.context);
  assert.equal(bake.status().requested,false,search+' keeps the room bake idle');bake.dispose();
 }
 globalThis.location={search:'?lab=360'};
 const f=roomFixture();globalThis.fetch=f.route;
 const bake=await createCafeRoomBake(fakeThree,f.scene,f.context);
 assert.equal(f.manifest.triangles,1,'only the in-room triangle is a receiver');
 assert.equal(bake.status().reason,'active');assert.equal(bake.status().slot,'spring-pm');assert.equal(bake.status().coverage.ratio,1);
 assert.equal(f.ceilingLight.visible,false,'realtime ceiling lights are replaced by the baked lights channel');
 assert.equal(f.mesh.geometry.index.count,3,'the out-of-room triangle stays on the original mesh');
 const lit=[].concat(f.scene.children.find(o=>o.userData.roomReceiver).material)[0];
 bake.interiorLights(false);
 const unlit=[].concat(f.scene.children.find(o=>o.userData.roomReceiver).material)[0];
 assert.notEqual(lit,unlit,'turning baked interior lights off swaps to a distinct compiled material');
 bake.interiorLights(true);assert.equal([].concat(f.scene.children.find(o=>o.userData.roomReceiver).material)[0],lit,'materials are cached per light scale');
 bake.light({...f.context.reviewDaylight,time:'am'});
 assert.equal(bake.status().reason,'unbaked-time');assert.equal(f.ceilingLight.visible,true,'unbaked times restore realtime lights');
 bake.light(f.context.reviewDaylight);bake.precision(true);
 assert.equal(bake.status().enabled,false,'precision rendering uses original materials');bake.precision(false);
 f.context.state={floors:7};bake.light(f.context.reviewDaylight);
 assert.equal(bake.status().reason,'source-state-mismatch','a different structure never uses the bake');
 bake.dispose();assert.equal(f.mesh.geometry.attributes.position.count,6,'dispose restores the source geometry');
 // A large unmatched surface (e.g. the ceiling) rejects the bake even when the ratio is high.
 const big=roomFixture();big.manifest.objects.push({hash:1,triangles:1,offset:1,area:25,name:'ceiling'});big.manifest.triangles=2;big.manifest.area=1000;
 globalThis.fetch=async url=>url.endsWith('uv.bin')?{ok:true,arrayBuffer:async()=>new Uint16Array(12).buffer}:big.route(url);
 const bigRejected=await createCafeRoomBake(fakeThree,big.scene,big.context);
 assert.equal(bigRejected.status().reason,'room-large-surface-unmatched:ceiling');
 const low=roomFixture();low.manifest.triangles=50;low.manifest.area=40;globalThis.fetch=async url=>url.endsWith('uv.bin')?{ok:true,arrayBuffer:async()=>new Uint16Array(300).buffer}:low.route(url);
 const rejected=await createCafeRoomBake(fakeThree,low.scene,low.context);
 assert.match(rejected.status().reason,/room-coverage-low/);assert.equal(rejected.status().enabled,false);
}finally{globalThis.location=previousLocation;globalThis.fetch=previousFetch}
console.log('cafe room bake: lifecycle, light hand-off and fail-closed loading passed');
