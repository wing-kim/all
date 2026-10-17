// 야간 외부: 원본이 야간 버튼에서 켜는 가로등(R3D.lamps)을 실사 장면에도 켜고,
// 낮 전용 보정(원경 헤이즈 색, 가로수 잎 발광)을 밤에는 끈다. 모두 실시간이며 미리 굽지 않는다.
export const DAY_HAZE=0xbdcbd5,NIGHT_HAZE=0x1b2433;
// environment.js가 가로수 잎에 준 낮 반투과 보정 발광색. 복사 재질에는 userData가 없어 색으로 찾는다.
export const LEAF_GLOW=0x6d682f;
// 장면의 조명 단위는 측광값이 아니다(태양 2.6, 야간 달빛 0.15). 8 m 높이에서 바닥 조도가
// 달빛의 약 3배가 되도록 맞춘 시각 보정값이다.
export const LAMP_INTENSITY=40,LAMP_RANGE=28,LAMP_ANGLE=Math.PI*.36;

export function createExteriorNight(T,scene,sources=[]){
 const lamps=[],point=new T.Vector3();
 for(const source of sources){
  source.updateWorldMatrix(true,false);point.setFromMatrixPosition(source.matrixWorld);
  const lamp=new T.SpotLight(source.color.getHex(),0,LAMP_RANGE,LAMP_ANGLE,.65,2);
  lamp.position.copy(point);lamp.target.position.set(point.x,0,point.z);lamp.userData.streetLamp=true;
  scene.add(lamp,lamp.target);lamps.push(lamp);
 }
 const leaves=new Map();
 scene.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material))if(m?.emissive&&m.emissiveIntensity>0&&m.emissive.getHex()===LEAF_GLOW&&!leaves.has(m))leaves.set(m,m.emissiveIntensity)});
 let night=null;
 return {lamps,leaves:leaves.size,
  apply(value,haze){
   night=!!value;
   // 조명 개수가 바뀌면 모든 재질이 다시 컴파일되므로 visible은 유지하고 세기만 바꾼다(실내 조명과 같은 방식).
   for(const lamp of lamps)lamp.intensity=night?LAMP_INTENSITY:0;
   for(const [material,intensity] of leaves)material.emissiveIntensity=night?0:intensity;
   haze?.value.setHex(night?NIGHT_HAZE:DAY_HAZE);
  },
  get night(){return night}};
}
