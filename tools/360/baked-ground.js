// Precomputed only; no ray tracing or light baking runs in the user's browser.
// 시간과 무관한 하늘 가림(sky occlusion)만 굽는다. 태양·그림자는 원본 시간대 버튼을 따르는 실시간 그대로다.
import { texture as textureNode, positionWorld, normalWorld, vec2, float, mix, smoothstep } from 'three/tsl';

export const GROUND_EXTENT=112;
// 서명 비교 허용 오차: 배칭 여부에 따라 float32/float64 경로가 달라 cm 반올림이 몇 개 꼭짓점에서 1cm씩 바뀐다.
// 축별 합 차이 2,000cm 이내는 같은 형상으로 본다(작은 건물 1m 이동만으로도 약 1만cm 차이).
export const SIGNATURE_TOLERANCE_CM=2000;
export const sameContext=(a,b)=>!!a&&!!b&&a.triangles===b.triangles&&Array.isArray(a.sum)&&Array.isArray(b.sum)&&[0,1,2].every(i=>Math.abs(a.sum[i]-b.sum[i])<=SIGNATURE_TOLERANCE_CM);
// 외벽 하부 근사: 벽에서 바깥으로 이만큼 떨어진 지면의 하늘 가림을 읽고, 높이에 따라 1로 풀어 준다.
export const FACADE_PROBE_M=1.5,FACADE_FADE_M=10,FACADE_STRENGTH=.6;

const FNV_OFFSET=0x811c9dc5;
function fnv(hash,text){for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0}return hash}
const cm=v=>Math.floor(v*100+.5);
const triangles=o=>(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
const opaque=m=>!!m&&!Array.isArray(m)&&!m.transparent&&!(m.transmission>0)&&!(m.alphaTest>0);
function primary(o){for(let p=o;p;p=p.parent)if(p.userData?.primary)return true;return false}

// 베이크 차폐체 = 주변 건물(context) 메시의 불투명 삼각형. 본 건물(primary)은 시안마다 형상이 바뀌므로 넣지 않는다.
// 가시성은 보지 않는다(주변 건물 숨김은 setEnabled로 처리). 시작 시점에 따라 배칭 묶음이 달라지므로
// 객체가 아니라 삼각형 단위로 다루고, 다중 재질 배치는 재질 그룹별로 불투명 여부를 판단한다.
export function contextOccluders(scene){const list=[];scene.traverse(o=>{if(o.isMesh&&o.userData.context&&!primary(o))list.push(o)});return list}
export function forEachOccluderTriangle(T,scene,visit){
 scene.updateMatrixWorld(true);const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),m=new T.Matrix4(),instance=new T.Matrix4();
 for(const o of contextOccluders(scene)){
  const g=o.geometry,p=g.attributes.position,idx=g.index,count=idx?idx.count:p.count,materials=[].concat(o.material);
  const groups=Array.isArray(o.material)&&g.groups.length?g.groups:[{start:0,count,materialIndex:0}];
  for(let k=0;k<(o.isInstancedMesh?o.count:1);k++){
   if(o.isInstancedMesh){o.getMatrixAt(k,instance);m.multiplyMatrices(o.matrixWorld,instance)}else m.copy(o.matrixWorld);
   for(const group of groups){
    const material=materials[group.materialIndex||0];if(!opaque(material))continue;
    const end=Math.min(count,group.start+group.count);
    for(let i=group.start;i+2<end;i+=3){
     a.fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(m);b.fromBufferAttribute(p,idx?idx.getX(i+1):i+1).applyMatrix4(m);c.fromBufferAttribute(p,idx?idx.getX(i+2):i+2).applyMatrix4(m);
     visit(a,b,c,material);
    }
   }
  }
 }
}

// 베이크 원천과 실행 장면이 같은 주변 건물인지 확인하는 서명: 삼각형 수와 꼭짓점 월드 좌표(cm 정수) 합.
// 순서·배칭 묶음과 무관하고, 건물 이동·추가·삭제에는 바뀐다.
export function contextSignature(T,scene){
 let tris=0,x=0,y=0,z=0,q=0;
 forEachOccluderTriangle(T,scene,(a,b,c)=>{tris++;for(const v of [a,b,c]){const X=cm(v.x),Y=cm(v.y),Z=cm(v.z);x+=X;y+=Y;z+=Z;q+=(X*31+Y*17+Z*7)%1000003}});
 const hash=fnv(FNV_OFFSET,[tris,x,y,z,q].join(':')).toString(16).padStart(8,'0');
 return {hash,triangles:tris,sum:[x,y,z,q]};
}

// 개발 환경에서 bake-ground.mjs 입력을 만든다(실행 장면 그대로, 월드 좌표 삼각형, 서명 포함).
export function exportGroundSource(T,scene){
 const byColor=new Map();
 forEachOccluderTriangle(T,scene,(a,b,c,material)=>{const color=material.color?material.color.toArray():[1,1,1],key=color.join(',');if(!byColor.has(key))byColor.set(key,{color,position:[]});byColor.get(key).position.push(...[a,b,c].flatMap(v=>[Math.round(v.x*1e4)/1e4,Math.round(v.y*1e4)/1e4,Math.round(v.z*1e4)/1e4]))});
 const identity=new T.Matrix4().toArray(),geo=[],rows=[];
 for(const {color,position} of byColor.values()){rows.push({geometry:geo.length,matrix:identity,color});geo.push({position,index:null})}
 return {version:3,signature:contextSignature(T,scene),geo,rows};
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

// 지면 베이크 좌표: 월드 xz를 베이크 범위(±extent)에 맞춘 UV1. 기하는 복제해 원본을 건드리지 않는다.
export function withGroundUV1(T,geometry,matrixWorld,extent=GROUND_EXTENT){
 const g=geometry.clone(),p=g.attributes.position,uv=new Float32Array(p.count*2),point=new T.Vector3();
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(matrixWorld);uv[i*2]=(point.x+extent)/(extent*2);uv[i*2+1]=(point.z+extent)/(extent*2)}
 g.setAttribute('uv1',new T.BufferAttribute(uv,2));return g;
}
export async function applyBakedGround(T,scene,{root='360/assets/',fetchImpl=globalThis.fetch?.bind(globalThis)}={}){
 const started=performance.now(),loader=new T.TextureLoader();
 // 베이크 메타(서명)와 현재 장면 서명이 다르면 베이크를 쓰지 않고 실시간 조명으로 둔다.
 const meta=await fetchImpl(root+'ground-bake.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('ground-bake.json '+r.status);return r.json()});
 const signature=contextSignature(T,scene),valid=sameContext(meta.signature,signature);
 const extent=meta.extent||GROUND_EXTENT;
 const status={valid,reason:valid?'active':'context-mismatch',signature:signature.hash,bakedSignature:meta.signature?.hash||null};
 if(!valid){console.warn('Baked ground: context signature mismatch; retaining realtime lighting',status);
  return {materials:[],count:0,facades:0,loadMs:performance.now()-started,setEnabled(){},get enabled(){return false},sunlightBakeValid:false,status};}
 const ao=await loader.loadAsync(root+'ground-sky-ao.png'+(meta.sha256?'?v='+meta.sha256.slice(0,12):''));
 ao.colorSpace=T.NoColorSpace;ao.channel=1;ao.flipY=false;ao.anisotropy=4;
 const bindings=[],box=new T.Box3();
 scene.updateMatrixWorld(true);
 // 지면 수신면: 높이 -0.6~0.7m의 불투명 지면에 월드 좌표 UV1을 만들어 aoMap으로 연결한다.
 scene.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||primary(o)||!opaque(o.material))return;
  box.setFromObject(o);if(box.max.y>.7||box.min.y<-.6||box.max.x<-extent||box.min.x>extent||box.max.z<-extent||box.min.z>extent)return;
  // 원본 기하는 건드리지 않고 복제본에 UV1만 더해 교체한다(위치 동일, 정밀 렌더도 같은 기하 사용).
  const original=o.material;o.geometry=withGroundUV1(T,o.geometry,o.matrixWorld,extent);
  const baked=original.clone();baked.aoMap=ao;baked.aoMapIntensity=.85;baked.userData.groundBakeSource=original.uuid;
  bindings.push({object:o,original,baked});
 });
 // 주변 건물 외벽: 재질별로 한 번만 복제해 aoNode를 단다(배칭 메시가 재질을 공유, 다중 재질은 그룹별).
 const facadeMaterials=new Map(),bakedFor=original=>{if(!opaque(original))return original;if(!facadeMaterials.has(original))facadeMaterials.set(original,facadeMaterial(T,original,ao,extent)||original);return facadeMaterials.get(original)};let facades=0;
 for(const o of contextOccluders(scene)){
  if(bindings.some(b=>b.object===o))continue;box.setFromObject(o);
  if(box.max.y<=.7||box.min.y>FACADE_FADE_M||box.max.x<-extent||box.min.x>extent||box.max.z<-extent||box.min.z>extent)continue;
  const original=o.material,baked=Array.isArray(original)?original.map(bakedFor):bakedFor(original);
  if(Array.isArray(original)?baked.every((m,i)=>m===original[i]):baked===original)continue;
  bindings.push({object:o,original,baked});facades++;
 }
 let enabled=false;
 const api={extent,materials:[...new Set(bindings.flatMap(b=>[b.original,b.baked].flat()))],count:bindings.length-facades,facades,loadMs:0,sunlightBakeValid:false,status,
  setEnabled(value){enabled=!!value;for(const b of bindings){b.object.material=enabled?b.baked:b.original}},
  get enabled(){return enabled}};
 api.setEnabled(true);api.loadMs=performance.now()-started;return api;
}
