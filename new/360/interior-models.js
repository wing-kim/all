/* 실내 시안 가구 모델 교체(2F 사무실 등). office.js가 만든 userData.modelSwap 자리(숨긴 절차적 대체물 포함)에
   같은 위치·방향·크기의 CC 모델을 넣는다. 카페 베이크가 해시로 검증하는 environment.js와 분리해 둔다.
   모델을 받지 못한 자리는 절차적 대체물을 다시 보이게 한다. 출처는 360/assets/README.md. */
window.swapInteriorModels=async function(C,root){
 const T=C.THREE;if(!root||!T.GLTFLoader)return null;
 const slots=[];root.traverse(o=>{if(o.userData.modelSwap&&!o.userData.modelSwapDone)slots.push(o)});if(!slots.length)return null;
 if(!window.__interiorModelLoader){const loader=new T.GLTFLoader();if(T.DRACOLoader)loader.setDRACOLoader(new T.DRACOLoader().setDecoderPath('360/assets/draco/'));window.__interiorModelLoader={loader,cache:new Map()}}
 const {loader,cache}=window.__interiorModelLoader,progress=window.TOWER_LOAD_PROGRESS;
 const fetchModel=url=>{if(!cache.has(url)){if(progress)progress.assetsTotal=(progress.assetsTotal||0)+1;const p=loader.loadAsync(url).then(gltf=>{const scene=gltf.scene;scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(scene);return {scene,box,size:box.getSize(new T.Vector3()),center:box.getCenter(new T.Vector3())}});p.finally(()=>{if(progress)progress.assetsDone=(progress.assetsDone||0)+1}).catch(()=>{});cache.set(url,p)}return cache.get(url)};
 const urls=[...new Set(slots.map(o=>o.userData.modelSwap.url))],sources=new Map();
 await Promise.all(urls.map(url=>fetchModel(url).then(source=>sources.set(url,source)).catch(error=>console.warn('Interior model unavailable; keeping procedural fit-out',url,error))));
 let replaced=0;
 for(const slot of slots){
  const spec=slot.userData.modelSwap,source=sources.get(spec.url);slot.userData.modelSwapDone=true;
  if(!source){for(const child of slot.children)if(child.userData.modelFallback)child.visible=true;continue}
  const k=spec.width?spec.width/source.size.x:spec.height/source.size.y,model=source.scene.clone(true),holder=new T.Group();
  model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});
  model.scale.setScalar(k);model.position.set(-source.center.x*k,-source.box.min.y*k,-source.center.z*k);holder.add(model);holder.rotation.y=spec.yaw||0;
  holder.name='CC interior model';holder.userData.illustrativeFurniture=true;slot.add(holder);replaced++;
 }
 const audit={slots:slots.length,replaced,assets:sources.size};
 if(root.userData.office)root.userData.office.models=audit;
 return audit;
};
