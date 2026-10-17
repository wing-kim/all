import assert from 'node:assert/strict';
import * as T from 'three/webgpu';
import {applyBakedGround,contextSignature,exportGroundSource,facadeMaterial,GROUND_EXTENT} from './baked-ground.js';
import {createExteriorNight,DAY_HAZE,NIGHT_HAZE,LEAF_GLOW,LAMP_INTENSITY} from './exterior-night.js';

function build(){
 const scene=new T.Scene(),source=new T.BoxGeometry(10,.1,10),material=new T.MeshStandardMaterial({color:0x777777});
 const ground=new T.Mesh(source,material);ground.position.set(12,0,-8);scene.add(ground);
 const tower=new T.Mesh(source,material);tower.userData.primary=true;scene.add(tower);
 const roof=new T.Mesh(source,material);roof.position.y=20;scene.add(roof);
 const wallMaterial=new T.MeshPhysicalMaterial({color:0xaaaaaa});
 const wall=new T.Mesh(new T.BoxGeometry(4,12,4),wallMaterial);wall.position.set(-20,6,10);wall.userData.context=true;scene.add(wall);
 const glass=new T.Mesh(new T.BoxGeometry(4,12,4),new T.MeshPhysicalMaterial({transmission:1}));glass.position.set(30,6,10);glass.userData.context=true;scene.add(glass);
 scene.updateMatrixWorld(true);
 return {scene,source,material,ground,tower,roof,wall,wallMaterial};
}
const loader={TextureLoader:class{async loadAsync(){return new T.Texture()}}};
const fetchMeta=meta=>async()=>({ok:true,json:async()=>meta});

// 서명: 순서 무관, 형상 이동에는 바뀐다. 투명 주변 메시와 본 건물은 제외.
{
 const a=build(),sig=contextSignature(T,a.scene);
 assert.equal(sig.triangles,12,'only the opaque context box counts (glass context and tower excluded)');
 // 배칭과 무관: 같은 월드 삼각형을 하나의 다중 재질 메시로 묶어도 서명이 같다.
 const merged=a.wall.geometry.clone().applyMatrix4(a.wall.matrixWorld).toNonIndexed();merged.clearGroups();merged.addGroup(0,36,0);merged.addGroup(36,0,1);
 const batch=new T.Scene(),mesh=new T.Mesh(merged,[a.wallMaterial,new T.MeshPhysicalMaterial({transmission:1})]);mesh.userData.context=true;batch.add(mesh);
 assert.equal(contextSignature(T,batch).hash,sig.hash,'batched/multi-material grouping does not change the signature');
 a.scene.children.reverse();assert.equal(contextSignature(T,a.scene).hash,sig.hash,'signature is order independent');
 a.wall.position.x+=.5;a.scene.updateMatrixWorld(true);assert.notEqual(contextSignature(T,a.scene).hash,sig.hash,'moved context invalidates the bake');
 const src=exportGroundSource(T,build().scene);assert.equal(src.rows.length,1);assert.equal(src.signature.hash,sig.hash);assert.equal(src.geo[0].position.length,12*9);
}
// 서명 불일치: 아무것도 바꾸지 않고 실시간 조명 유지.
{
 const a=build(),api=await applyBakedGround({...T,...loader},a.scene,{fetchImpl:fetchMeta({signature:{hash:'00000000',triangles:12},extent:GROUND_EXTENT})});
 assert.equal(api.status.reason,'context-mismatch');assert.equal(api.enabled,false);assert.equal(a.ground.material,a.material);assert.equal(a.wall.material,a.wallMaterial);assert.equal(a.ground.geometry,a.source);
}
// 서명 일치: 지면 UV1 + aoMap, 외벽 aoNode, 본 건물·지붕 불변, 끄면 원본 복원.
{
 const a=build(),sig=contextSignature(T,a.scene),before=Array.from(a.source.attributes.position.array);
 const api=await applyBakedGround({...T,...loader},a.scene,{fetchImpl:fetchMeta({signature:sig,extent:GROUND_EXTENT})});
 assert.equal(api.status.valid,true);assert.equal(api.count,1);assert.equal(api.facades,1);
 assert.equal(a.tower.geometry,a.source);assert.equal(a.tower.material,a.material);assert.equal(a.roof.material,a.material);assert.deepEqual(Array.from(a.source.attributes.position.array),before);
 assert.notEqual(a.ground.geometry,a.source);assert.equal(a.source.attributes.uv1,undefined);
 const point=new T.Vector3().fromBufferAttribute(a.ground.geometry.attributes.position,0).add(a.ground.position),uv=a.ground.geometry.attributes.uv1;
 assert.ok(Math.abs(uv.getX(0)-(point.x+112)/224)<1e-6);assert.ok(Math.abs(uv.getY(0)-(point.z+112)/224)<1e-6);
 assert.equal(a.ground.material.aoMap.channel,1);assert.equal(a.ground.material.lightMap,null,'unvalidated sun bounce must not remain active');
 assert.ok(a.wall.material.isNodeMaterial&&a.wall.material.aoNode,'context facade receives the derived sky-occlusion node');
 assert.notEqual(a.wall.material.customProgramCacheKey(),a.wallMaterial.customProgramCacheKey());
 api.setEnabled(false);assert.equal(a.ground.material,a.material);assert.equal(a.wall.material,a.wallMaterial);
 api.setEnabled(true);assert.notEqual(a.wall.material,a.wallMaterial);
 assert.equal(facadeMaterial(T,new T.ShaderMaterial(),new T.Texture()),null,'unsupported materials stay realtime');
}
// 야간 외부: 가로등은 개수 유지·세기만 전환, 잎 발광과 헤이즈 색은 밤에 끈다.
{
 const scene=new T.Scene(),src=new T.PointLight(0xffd9a0,0,26,2);src.position.set(3,7.5,4);scene.add(src);
 const leaf=new T.MeshStandardMaterial({emissive:LEAF_GLOW,emissiveIntensity:.12});scene.add(new T.Mesh(new T.BoxGeometry(),leaf));
 const other=new T.MeshStandardMaterial({emissive:0xffffff,emissiveIntensity:1});scene.add(new T.Mesh(new T.BoxGeometry(),other));
 const haze={value:new T.Color(DAY_HAZE)},night=createExteriorNight(T,scene,[src]);
 assert.equal(night.lamps.length,1);assert.equal(night.leaves,1);assert.deepEqual(night.lamps[0].position.toArray(),[3,7.5,4]);
 const lightCount=()=>{let n=0;scene.traverse(o=>{if(o.isLight&&o.visible)n++});return n},count=lightCount();
 night.apply(true,haze);assert.equal(night.lamps[0].intensity,LAMP_INTENSITY);assert.equal(leaf.emissiveIntensity,0);assert.equal(other.emissiveIntensity,1);assert.equal(haze.value.getHex(),NIGHT_HAZE);assert.equal(lightCount(),count);
 night.apply(false,haze);assert.equal(night.lamps[0].intensity,0);assert.equal(leaf.emissiveIntensity,.12);assert.equal(haze.value.getHex(),DAY_HAZE);assert.equal(lightCount(),count);
}
console.log('Baked ground: context signature gate, ground UV1/aoMap, facade aoNode, originals restored; exterior night lamps/leaves/haze switch without changing light count.');
