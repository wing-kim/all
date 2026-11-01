/* 실내 시안 가구 모델 교체(2F～6F 사무실·레스토랑). office.js가 만든 userData.modelSwap 자리(숨긴 절차적 대체물 포함)에
   같은 위치·방향·크기의 CC 모델을 넣는다. 카페 베이크가 해시로 검증하는 environment.js와 분리해 둔다.
   첫 방문 로딩을 줄이려고 첫 화면 뒤 층별로 지연 로드한다: 들어간 층을 먼저, 나머지는 카메라가 멈춰 있을 때 한 층씩.
   모델을 받지 못한 자리는 절차적 대체물을 다시 보이게 한다. 출처는 360/assets/README.md. */
window.swapInteriorModels=async function(C,root,{floor=null}={}){
 const T=C.THREE;if(!root||!T.GLTFLoader)return {audit:null,holders:[]};
 const floorOf=o=>{for(let p=o;p;p=p.parent)if(p.userData.fitoutFloor)return p.userData.fitoutFloor;return null};
 const slots=[];root.traverse(o=>{if(o.userData.modelSwap&&!o.userData.modelSwapDone&&(!floor||floorOf(o)===floor))slots.push(o)});
 if(!slots.length)return {audit:null,holders:[]};
 if(!window.__interiorModelLoader){const loader=new T.GLTFLoader();if(T.DRACOLoader)loader.setDRACOLoader(new T.DRACOLoader().setDecoderPath('../photoreal/assets/draco/'));window.__interiorModelLoader={loader,cache:new Map()}}
 const {loader,cache}=window.__interiorModelLoader;
 const fetchModel=url=>{if(!cache.has(url)){const p=loader.loadAsync(url).then(gltf=>{const scene=gltf.scene;scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(scene);return {scene,box,size:box.getSize(new T.Vector3()),center:box.getCenter(new T.Vector3())}});p.catch(()=>{});cache.set(url,p)}return cache.get(url)};
 const urls=[...new Set(slots.map(o=>o.userData.modelSwap.url))],sources=new Map();
 await Promise.all(urls.map(url=>fetchModel(url).then(source=>sources.set(url,source)).catch(error=>console.warn('Interior model unavailable; keeping procedural fit-out',url,error))));
 const holders=[];
 for(const slot of slots){
  const spec=slot.userData.modelSwap,source=sources.get(spec.url);slot.userData.modelSwapDone=true;
  if(!source){for(const child of slot.children)if(child.userData.modelFallback)child.visible=true;continue}
  const k=spec.width?spec.width/source.size.x:spec.height/source.size.y,model=source.scene.clone(true),holder=new T.Group();
  model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});
  model.scale.setScalar(k);model.position.set(-source.center.x*k,-source.box.min.y*k,-source.center.z*k);holder.add(model);holder.rotation.y=spec.yaw||0;
  holder.name='CC interior model';holder.userData.illustrativeFurniture=true;slot.add(holder);holders.push(holder);
 }
 const audit=root.userData.interiorModels||(root.userData.interiorModels={slots:0,replaced:0,assets:new Set(),floors:{}});
 audit.slots+=slots.length;audit.replaced+=holders.length;for(const u of sources.keys())audit.assets.add(u);if(floor)audit.floors[floor]={slots:slots.length,replaced:holders.length,at:Math.round(performance.now())};
 if(root.userData.office)root.userData.office.models={slots:audit.slots,replaced:audit.replaced,assets:audit.assets.size};
 return {audit,holders};
};

// 건물 재생성(시안·주차 방식 전환) 때: 이미 받은 층의 모델은 새 실내 꾸밈에 바로 다시 끼운다(받아 둔 파일 재사용).
// 그러면 실사 쪽 재복사·셰이더 준비가 로딩 카드 아래에서 한 번에 끝나고, 카드가 닫힌 뒤 층별 추가 작업이 남지 않는다.
window.restoreInteriorModels=async function(C,root){
 const done=window.__interiorFloorsLoaded;if(!root||!done?.size)return [];
 const loaded=root.userData.modelFloorsLoaded||(root.userData.modelFloorsLoaded=new Set()),floors=[];
 root.traverse(o=>{const key=o.userData.fitoutFloor;if(key&&done.has(key)&&!loaded.has(key)&&!floors.includes(key))floors.push(key)});
 for(const key of floors){loaded.add(key);await window.swapInteriorModels(C,root,{floor:key})}
 return floors;
};

// 지연 로더: 실사 렌더러의 첫 화면 뒤에 시작한다. 건물을 다시 만들면(시안 전환) 새 실내 꾸밈에 대해 다시 진행한다.
window.startInteriorModelLoader=function(C){
 if(window.__interiorModelTimer)return;
 let busy=false;
 window.__interiorModelTimer=setInterval(async()=>{
  const cinema=window.TOWER_CINEMA,root=C.interiorDressing;
  if(busy||!root||!cinema?.addInteriorObjects||cinema.status?.().firstFrameMs==null)return;
  const loaded=root.userData.modelFloorsLoaded||(root.userData.modelFloorsLoaded=new Set()),pending=[];
  root.traverse(o=>{const key=o.userData.fitoutFloor;if(key&&!loaded.has(key)&&!pending.includes(key))pending.push(key)});
  if(!pending.length)return;
  const current=C.cafeMode?C.interiorFloorKey:null;
  let key=pending.includes(current)?current:null;
  // 들어간 층이 아니면 카메라가 1.5초 이상 멈춰 있을 때만 다음 층을 준비한다(조작 중 끊김 방지).
  if(!key){if(performance.now()-(cinema.lastMotionAt?.()||0)<1500)return;key=pending[0]}
  busy=true;loaded.add(key);
  try{
   const {holders}=await window.swapInteriorModels(C,root,{floor:key});
   if(holders.length&&root===C.interiorDressing&&window.TOWER_CINEMA===cinema)await cinema.addInteriorObjects(holders);
   (window.__interiorFloorsLoaded||(window.__interiorFloorsLoaded=new Set())).add(key);
  }catch(error){console.warn('Interior model loading failed',key,error)}
  finally{busy=false}
 },400);
};
