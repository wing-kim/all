// Precomputed only; no ray tracing or light baking runs in the user's browser.
// 시간과 무관한 하늘 가림(sky occlusion)만 굽는다. 태양·그림자는 원본 시간대 버튼을 따르는 실시간 그대로다.
import { texture as textureNode, positionWorld, normalWorld, vec2, float, mix, smoothstep } from 'three/tsl';

export const GROUND_EXTENT=112;
// 외벽 하부 근사: 벽에서 바깥으로 이만큼 떨어진 지면의 하늘 가림을 읽고, 높이에 따라 1로 풀어 준다.
export const FACADE_PROBE_M=1.5,FACADE_FADE_M=10,FACADE_STRENGTH=.6;

const FNV_OFFSET=0x811c9dc5;
function fnv(hash,text){for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0}return hash}
const cm=v=>Math.floor(v*100+.5);
const triangles=o=>(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
const opaque=m=>!!m&&!Array.isArray(m)&&!m.transparent&&!(m.transmission>0)&&!(m.alphaTest>0);
function primary(o){for(let p=o;p;p=p.parent)if(p.userData?.primary)return true;return false}

// 베이크 차폐체 = 주변 건물(context) 불투명 메시. 본 건물(primary)은 시안마다 형상이 바뀌므로 넣지 않는다.
// 가시성은 보지 않는다(주변 건물 숨김은 setEnabled로 처리).
export function contextOccluders(scene){const list=[];scene.traverse(o=>{if(o.isMesh&&o.userData.context&&!primary(o)&&opaque(o.material))list.push(o)});return list}

// 베이크 원천과 실행 장면이 같은 주변 건물인지 확인하는 서명(월드 경계 cm 반올림 + 삼각형 수, 순서 무관).
export function contextSignature(T,scene){
 scene.updateMatrixWorld(true);const box=new T.Box3(),rows=[];let tris=0;
 for(const o of contextOccluders(scene)){box.setFromObject(o);const n=triangles(o);tris+=n;rows.push([box.min.x,box.min.y,box.min.z,box.max.x,box.max.y,box.max.z].map(cm).join(',')+':'+n)}
 rows.sort();let hash=FNV_OFFSET;for(const row of rows)hash=fnv(hash,row+'|');
 return {hash:hash.toString(16).padStart(8,'0'),objects:rows.length,triangles:tris};
}

// 개발 환경에서 bake-ground.mjs 입력을 만든다(실행 장면 그대로, 서명 포함).
export function exportGroundSource(T,scene){
 const geo=[],ids=new Map(),rows=[];
 for(const o of contextOccluders(scene)){
  const g=o.geometry;if(!ids.has(g)){ids.set(g,geo.length);geo.push({position:Array.from(g.attributes.position.array,v=>Math.round(v*1e4)/1e4),index:g.index?Array.from(g.index.array):null})}
  const c=o.material.color||new T.Color(1,1,1),row={geometry:ids.get(g),matrix:o.matrixWorld.toArray(),color:[c.r,c.g,c.b]};
  if(o.isInstancedMesh)row.instances=Array.from(o.instanceMatrix.array.slice(0,o.count*16));
  rows.push(row);
 }
 return {version:2,signature:contextSignature(T,scene),geo,rows};
}

// 외벽 하부 하늘 가림 노드: 지면 AO를 벽 바깥쪽에서 읽어 높이에 따라 약하게 적용한다(전체 외벽 베이크 아님).
export function facadeOcclusion(ao,extent=GROUND_EXTENT){
 const probe=positionWorld.xz.add(normalWorld.xz.mul(FACADE_PROBE_M)),coord=probe.add(extent).div(extent*2);
 const ground=textureNode(ao,vec2(coord.x,coord.y)).r,fade=float(1).sub(smoothstep(0,FACADE_FADE_M,positionWorld.y));
 return mix(float(1),ground,fade.mul(FACADE_STRENGTH));
}

// 일반 재질을 three의 NodeLibrary.fromMaterial과 같은 방식으로 노드 재질에 옮겨 aoNode를 단다.
export function facadeMaterial(T,original,ao,extent=GROUND_EXTENT){
 const Class=original.isNodeMaterial?original.constructor:T[original.type.replace(/Material$/,'NodeMaterial')];if(!Class)return null;
 const material=new Class();for(const key in original)material[key]=original[key];
 material.uuid=T.MathUtils.generateUUID();material.userData={...original.userData,facadeSkyOcclusion:true};
 material.aoNode=facadeOcclusion(ao,extent);
 // 렌더러는 재질 캐시 키로 파이프라인을 재사용하므로 원본과 다른 키를 준다.
 const key=original.customProgramCacheKey.bind(original);material.customProgramCacheKey=()=>key()+':facade-sky-occlusion';
 return material;
}

export async function applyBakedGround(T,scene,{root='360/assets/',fetchImpl=globalThis.fetch?.bind(globalThis)}={}){
 const started=performance.now(),loader=new T.TextureLoader();
 // 베이크 메타(서명)와 현재 장면 서명이 다르면 베이크를 쓰지 않고 실시간 조명으로 둔다.
 const meta=await fetchImpl(root+'ground-bake.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('ground-bake.json '+r.status);return r.json()});
 const signature=contextSignature(T,scene),valid=!!meta.signature&&meta.signature.hash===signature.hash&&meta.signature.objects===signature.objects;
 const extent=meta.extent||GROUND_EXTENT;
 const status={valid,reason:valid?'active':'context-mismatch',signature:signature.hash,bakedSignature:meta.signature?.hash||null};
 if(!valid){console.warn('Baked ground: context signature mismatch; retaining realtime lighting',status);
  return {materials:[],count:0,facades:0,loadMs:performance.now()-started,setEnabled(){},get enabled(){return false},sunlightBakeValid:false,status};}
 const ao=await loader.loadAsync(root+'ground-sky-ao.png'+(meta.sha256?'?v='+meta.sha256.slice(0,12):''));
 ao.colorSpace=T.NoColorSpace;ao.channel=1;ao.flipY=false;ao.anisotropy=4;
 const bindings=[],point=new T.Vector3(),box=new T.Box3();
 scene.updateMatrixWorld(true);
 // 지면 수신면: 높이 -0.6~0.7m의 불투명 지면에 월드 좌표 UV1을 만들어 aoMap으로 연결한다.
 scene.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||primary(o)||!opaque(o.material))return;
  box.setFromObject(o);if(box.max.y>.7||box.min.y<-.6||box.max.x<-extent||box.min.x>extent||box.max.z<-extent||box.min.z>extent)return;
  const original=o.material,g=o.geometry.clone(),p=g.attributes.position,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv[i*2]=(point.x+extent)/(extent*2);uv[i*2+1]=(point.z+extent)/(extent*2)}
  // 원본 기하는 건드리지 않고 복제본에 UV1만 더해 교체한다(위치 동일, 정밀 렌더도 같은 기하 사용).
  g.setAttribute('uv1',new T.BufferAttribute(uv,2));o.geometry=g;
  const baked=original.clone();baked.aoMap=ao;baked.aoMapIntensity=.85;
  bindings.push({object:o,original,baked});
 });
 // 주변 건물 외벽: 재질별로 한 번만 복제해 aoNode를 단다(배칭 메시가 재질을 공유).
 const facadeMaterials=new Map();let facades=0;
 for(const o of contextOccluders(scene)){
  if(bindings.some(b=>b.object===o))continue;box.setFromObject(o);
  if(box.max.y<=.7||box.min.y>FACADE_FADE_M||box.max.x<-extent||box.min.x>extent||box.max.z<-extent||box.min.z>extent)continue;
  const original=o.material;
  if(!facadeMaterials.has(original))facadeMaterials.set(original,facadeMaterial(T,original,ao,extent));
  if(!facadeMaterials.get(original))continue;
  bindings.push({object:o,original,baked:facadeMaterials.get(original)});facades++;
 }
 let enabled=false;
 const api={materials:[...new Set(bindings.flatMap(b=>[b.original,b.baked]))],count:bindings.length-facades,facades,loadMs:0,sunlightBakeValid:false,status,
  setEnabled(value){enabled=!!value;for(const b of bindings){b.object.material=enabled?b.baked:b.original}},
  get enabled(){return enabled}};
 api.setEnabled(true);api.loadMs=performance.now()-started;return api;
}
