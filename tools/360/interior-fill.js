// 미리 구운 빛이 없는 실내(2F~PH1, 지하): 실시간 하늘 환경광은 벽·천장 가림을 모르므로 실내가 바깥만큼
// 밝고 푸르게 보이고, 밖에서 보면 유리가 밝은 하늘색으로 뜬다. 픽셀 단위로 "타워 외곽 안쪽 + 층 높이 범위"만
// 골라 환경광을 줄이고(가림 근사) 따뜻한 실내 조명 수준의 간접광을 더한다. 태양 직사광·그림자는 실시간 그대로.
// 미리 구운 카페(1F)는 제외한다. 실내 시안별 베이크가 생기면 그 층은 베이크가 대신한다.
import { positionWorld, normalWorld, float, vec3, step } from 'three/tsl';

export const INTERIOR_AO=.22,BASEMENT_AO=.05;
// 따뜻한 사무실 조명(약 3500K) 간접광. 장면 조명 단위(태양 2.6)에 맞춘 시각 보정값.
export const INTERIOR_FILL=[.95,.78,.6],INTERIOR_FILL_SCALE=.55,BASEMENT_FILL_SCALE=.42;

// 층별 실내 범위: 원본 층 평면(level.poly)의 월드 다각형 × 바닥판 위~위층 바닥판 아랫면.
// 평면이 같은 층(2F~6F 등)은 묶고, 판정점은 면 바깥 방향으로 25cm 옮겨 벽 바깥면은 제외·안쪽면은 포함한다.
export function interiorZones(C){
 const groups=new Map();
 for(const level of C.levels()){
  if(level.kind!=='upper'&&level.kind!=='base')continue;
  const poly=(level.poly||[]).map(q=>C.P(...q));if(poly.length<3)continue;
  const key=level.kind+'|'+poly.map(([x,z])=>x.toFixed(2)+','+z.toFixed(2)).join(';');
  if(!groups.has(key))groups.set(key,{kind:level.kind,poly,spans:[]});
  // 천장 마감이 따로 없는 곳은 위층 바닥판 아랫면이 천장이므로 다음 층 바닥 높이까지 포함한다.
  groups.get(key).spans.push([C.floorTop(level)-.05,Math.max(C.ceilOf(level),level.y+level.h)+.05]);
 }
 const zones={upper:[],base:[]};for(const g of groups.values())zones[g.kind].push(g);return zones;
}

function insidePolygon(x,z,poly){
 let crossings=float(0);
 for(let i=0;i<poly.length;i++){
  const [xi,zi]=poly[i],[xj,zj]=poly[(i+1)%poly.length];if(Math.abs(zj-zi)<1e-6)continue;
  const straddle=step(z,zi).sub(step(z,zj)).abs(),xCross=z.sub(zi).mul((xj-xi)/(zj-zi)).add(xi);
  crossings=crossings.add(straddle.mul(step(x,xCross)));
 }
 return crossings.mul(.5).fract().mul(2);
}

function zoneMask(zones){
 const probe=positionWorld.xz.add(normalWorld.xz.mul(.25)),y=positionWorld.y;let sum=float(0);
 for(const zone of zones){let inY=float(0);for(const [y0,y1] of zone.spans)inY=inY.add(step(y0,y).mul(step(y,y1)));sum=sum.add(insidePolygon(probe.x,probe.y,zone.poly).mul(inY.min(1)))}
 return sum.min(1);
}
export const interiorMaskNodes=zones=>({upper:zoneMask(zones.upper),base:zoneMask(zones.base)});

const isGlass=m=>!m||m.transmission>0||m.userData?.glazingRole!=null||(m.transparent&&m.opacity<.95);

export function createInteriorFill(T){
 const cache=new Map();let key='';
 function convert(original,masks,signature){
  const cacheKey=original.uuid+'|'+signature;if(cache.has(cacheKey))return cache.get(cacheKey);
  const Class=original.isNodeMaterial?original.constructor:T[original.type.replace(/Material$/,'NodeMaterial')];if(!Class){cache.set(cacheKey,original);return original}
  const n=new Class();for(const k in original)n[k]=original[k];
  n.uuid=T.MathUtils.generateUUID();n.userData={...original.userData,interiorFill:true};
  const occlusion=float(1).sub(masks.upper.mul(1-INTERIOR_AO)).sub(masks.base.mul(1-BASEMENT_AO));
  n.aoNode=original.aoNode?original.aoNode.mul(occlusion):occlusion;
  const fill=vec3(...INTERIOR_FILL).mul(masks.upper.mul(INTERIOR_FILL_SCALE*Math.PI).add(masks.base.mul(BASEMENT_FILL_SCALE*Math.PI)));
  const base=original.setupLightMap?.bind(original);
  n.setupLightMap=builder=>{const own=original.lightMap&&base?base(builder):null;return own||new T.IrradianceNode(fill)};
  const parent=original.customProgramCacheKey.bind(original);n.customProgramCacheKey=()=>parent()+':interior-fill:'+signature;
  cache.set(cacheKey,n);return n;
 }
 return {
  // 타워 메시에 적용. 건물이 다시 만들어지면 다시 부른다(층수·층고가 바뀌면 범위도 바뀐다).
  apply(scene,C,{exclude=()=>false}={}){
   const zones=interiorZones(C),signature=[...zones.upper,...zones.base].map(z=>z.poly.flat().concat(z.spans.flat()).map(v=>v.toFixed(2)).join(',')).join('|');
   if(signature!==key){for(const m of cache.values())m.dispose?.();cache.clear();key=signature}
   const masks=interiorMaskNodes(zones);let count=0;
   scene.traverse(o=>{
    if(!o.isMesh||!o.userData.primary||o.userData.renderGlazing||exclude(o))return;
    const list=[].concat(o.material);if(list.every(isGlass))return;
    const next=list.map(m=>isGlass(m)||m.userData?.interiorFill||m.userData?.cafeRoomBaked?m:convert(m,masks,signature));
    o.material=Array.isArray(o.material)?next:next[0];count++;
   });
   return {count,zones};
  },
  dispose(){for(const m of cache.values())m.dispose?.();cache.clear()}
 };
}
