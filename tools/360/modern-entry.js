import { copyMaterialTextures } from './material-textures.js';
import { glazingSides } from './glazing-sides.js';
import { applyBakedGround, exportGroundSource, withGroundUV1 } from './baked-ground.js';
import { createExteriorNight, DAY_HAZE } from './exterior-night.js';
import { createSectionClip } from './section-clip.js';
import { cubeToEquirect } from './cube-equirect.js';
import { createInteriorFill } from './interior-fill.js';
import { batchStaticSurroundings, createPrecisionScene } from './static-batching.js';
import { copyRoundedMullions, collectGlazingEdges } from './curtain-wall.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { copyGeometry, copySourceLine } from './geometry-copy.js';
import { summarizeSamples } from './performance-stats.js';
import { createSourceSky } from './sky-background.js';
import { createCafeAmbientStudy } from './cafe-ambient.js';
import { createCafeRoomBake } from './cafe-room-bake.js';
import { bindSourceVisibility, sourceVisible, syncCopiedVisibility } from './source-visibility.js';
import * as T from 'three/webgpu';
import { pass, texture as textureNode, vec4, mix, saturation, uniform, normalWorld, positionWorld, positionView, cameraPosition, fog } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
export async function start(C){
 const bootAt=performance.now();let firstFrameMs=null,lastUpdateMs=null,lastDrawAt=0;
 const timings={adapterMs:null,rendererInitMs:null,sceneCopyMs:null,bakeMs:null,hdrMs:null,probeMs:null};
 const counts={previewFrames:0,precisionSamples:0,cameraMoves:0,buildingUpdates:0,precisionRequests:0,probeRefreshes:0};
 // Wall-clock intervals and render submission time; these are not GPU timings.
 const frameSubmitMs=[],frameIntervals=[];
 const precisionTiming={moduleMs:null,sceneMs:null,tracerMs:null,totalMs:null,cancelMs:null};
 const measure=(items,value)=>{items.push(value);if(items.length>600)items.shift()};
 let performanceBaseline={...counts};
 const performanceStatus=()=>({counts:{...counts},windowCounts:Object.fromEntries(Object.keys(counts).map(key=>[key,counts[key]-performanceBaseline[key]])),bootMs:{...timings,firstFrame:firstFrameMs},precisionMs:{...precisionTiming},previewIntervalMs:summarizeSamples(frameIntervals),previewSubmitMs:summarizeSamples(frameSubmitMs)});
 function resetPerformance(){frameSubmitMs.length=0;frameIntervals.length=0;lastDrawAt=0;performanceBaseline={...counts};return performanceStatus()}
 const compactTouch=parent.innerWidth<=850&&matchMedia('(pointer: coarse)').matches;
 T.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(C.camera.fov,C.camera.aspect,2,1800);
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('WebGPU adapter unavailable');
 timings.adapterMs=performance.now()-bootAt;
 const limit=512*1024*1024;
 // 화면 품질 진단용(?msaa=0|4, ?pr=배율). 기본값은 아래에서 정한다.
 // 멈춘 화면은 기기 해상도(원본 스케치업과 같은 배율, 최대 2)로, 움직이는 동안은 배율 1 상당으로 그린다.
 const renderParams=new URLSearchParams(location.search),compactScreen=parent.innerWidth<=850&&matchMedia('(pointer: coarse)').matches;
 const balancedRatio=renderParams.has('pr')?Math.min(2,Math.max(.5,+renderParams.get('pr')||1)):Math.min(devicePixelRatio||1,compactScreen?1.5:2);
 const STILL_DELAY_MS=150,WARM_CHUNK=60,METAL_REFLECT_MIN=.3,METAL_ENV_SCALE=3;
 // 최종 출력은 후처리 파이프라인이 그리므로 캔버스 자체 MSAA는 쓰지 않는다(장면 패스에서 MSAA).
 const renderer=new T.WebGPURenderer({alpha:false,antialias:false,powerPreference:'high-performance',requiredLimits:{maxStorageBufferBindingSize:Math.min(limit,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(limit,adapter.limits.maxBufferSize)}});renderer.setPixelRatio(balancedRatio);renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.4;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;await renderer.init();timings.rendererInitMs=performance.now()-bootAt;
 let gpuError=null,deviceLost=false;renderer.backend.device?.addEventListener('uncapturederror',event=>{event.preventDefault();if(!gpuError){gpuError=event.error;console.warn('Precision GPU validation failure',gpuError.message)}});
 renderer.backend.device?.lost.then(info=>{if(info.reason!=='destroyed'){deviceLost=true;gpuError=new Error(info.message||'GPU device lost')}});
 const host=C.renderer.domElement.parentElement;renderer.setSize(host.clientWidth,host.clientHeight);Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'2'});
 const materials=new Map(),geometries=new Map(),textures=new Map();
 // 타워 금속(원본 금속성 0.3 이상: 메탈 밴드·메시 베일·돌출 박스 창 테두리 등)은 반사가 거의 전부라 약한 장면 환경광(낮 0.32)만으로는
 // 검게 보인다. 같은 하늘 HDR을 재질 envMap으로 직접 반사하되 세기는 장면 환경광에 비례(밤에는 함께 어두워짐).
 // 실내 간접광 복제 재질도 envMap을 물려받으므로 집합 대신 장면의 타워 재질을 직접 훑는다.
 function syncMetalReflections(){if(!scene.environment)return;scene.traverse(o=>{if(!o.isMesh||!o.userData.primary)return;for(const m of [].concat(o.material))if(m.envMap===scene.environment){m.envMapIntensity=scene.environmentIntensity*METAL_ENV_SCALE;m.envMapRotation.copy(scene.environmentRotation)}})}
 function bindMetalReflections(root=scene){
  if(!scene.environment)return;
  root.traverse(o=>{if(!o.isMesh||!o.userData.primary)return;for(const m of [].concat(o.material)){if(m.metalness<METAL_REFLECT_MIN||m.transmission>0||m.userData?.glazingRole!=null||m.userData?.interiorFill||m.envMap)continue;m.envMap=scene.environment;m.needsUpdate=true}});
  syncMetalReflections();
 }
 function texture(t){if(!t)return null;if(textures.has(t))return textures.get(t);const n=new T.Texture(t.image);n.wrapS=t.wrapS;n.wrapT=t.wrapT;n.repeat.copy(t.repeat);n.offset.copy(t.offset);n.rotation=t.rotation;n.flipY=t.flipY;n.colorSpace=t.encoding===3001?T.SRGBColorSpace:T.NoColorSpace;n.anisotropy=4;n.needsUpdate=true;textures.set(t,n);return n}
 function material(m){if(materials.has(m))return materials.get(m);
  const glass=m===C.M.glass||m===C.M.glass1||m===C.M.door||m===C.M.guard||m===C.M.rail;
  const n=new T.MeshPhysicalMaterial({color:m.color?.clone()||new T.Color(.5,.5,.5),roughness:m.roughness??.7,metalness:m.metalness??0,side:m.side,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest||0});
  copyMaterialTextures(m,n,texture);if(m.normalScale)n.normalScale.copy(m.normalScale);n.bumpScale=m.bumpScale||.01;if(m.emissive)n.emissive.copy(m.emissive);n.emissiveIntensity=m.emissiveIntensity||0;
  n.clearcoat=m.clearcoat||0;n.clearcoatRoughness=m.clearcoatRoughness||0;
  // 알파 테스트 잎(가로수·화분)은 MSAA 커버리지로 가장자리를 부드럽게 한다(정렬 문제 없는 불투명 경로 유지).
  if(n.alphaTest>0&&!n.transparent)n.alphaToCoverage=true;
  n.polygonOffset=!!m.polygonOffset;n.polygonOffsetFactor=m.polygonOffsetFactor||0;n.polygonOffsetUnits=m.polygonOffsetUnits||0;
  if(m.userData?.satinMetal){n.anisotropy=.32;n.clearcoat=.12;n.clearcoatRoughness=.28;}
  if(glass){n.color.set('#f3f9fc');n.transmission=1;n.opacity=1;n.transparent=false;n.metalness=0;n.roughness=.045;n.ior=1.52;n.thickness=0;n.side=T.DoubleSide;}
  // Coating appearance study, not a measured glazing specification. Keep the base dielectric.
  if(m===C.M.glass){n.metalness=0;n.ior=1.8;n.clearcoat=1;n.clearcoatRoughness=.03;n.roughness=.025;}
  if(glass)n.userData.glazingRole=m===C.M.glass?'facade':m===C.M.glass1?'ground':'clear';
  // Opaque painted backing with a glossy surface, preserving the authored spandrel geometry.
  if(m===C.FM?.spandrel){n.color.set('#41494d');n.opacity=1;n.transparent=false;n.metalness=.05;n.roughness=.35;n.clearcoat=1;n.clearcoatRoughness=.06;n.userData.spandrelFinish=true;}
  if(m===C.M.slab){n.color.set('#e7dfd1');n.roughness=.82;}
  materials.set(m,n);return n;
 }
 function geometry(g){if(geometries.has(g))return geometries.get(g);const n=copyGeometry(T,g);geometries.set(g,n);return n}
 C.scene.updateMatrixWorld(true);
 const roundedProfiles=new Map();
 // all: 원본 조상 가시성과 무관하게 복사(지연 추가하는 실내 모델), edges: 미리 계산한 유리 모서리(없으면 계산).
 function copyRoot(root,all=false,edges=null){const glazingEdges=edges||(root===C.ovl?new Map():collectGlazingEdges(T,C.bld,[C.M.glass,C.M.glass1]));root.updateWorldMatrix(true,true);
 root.traverse(o=>{
  let building=false;for(let p=o;p;p=p.parent)if(p===C.bld)building=true;
  if(!building&&!all)for(let p=o;p;p=p.parent)if(!p.visible&&!p.userData.box&&p!==C.city&&p!==C.ctx)return;
  if(!o.isMesh||o.userData.batched||o===C.R3D.sky||o.material?.isShaderMaterial)return;
  const m=Array.isArray(o.material)?o.material.map(material):material(o.material);
  let copies=o.isInstancedMesh&&o.userData.roundedCurtainWall?copyRoundedMullions(T,RoundedBoxGeometry,o,m,roundedProfiles,glazingEdges):null;
  if(!copies){
   let g=geometry(o.geometry);if(o.material===C.M.glass||o.material===C.M.glass1){g=glazingSides(T,g,o.matrixWorld);}let n;
   if(o.isInstancedMesh){n=new T.InstancedMesh(g,m,o.count);n.instanceMatrix.array.set(o.instanceMatrix.array.subarray(0,o.count*16));n.instanceMatrix.needsUpdate=true;if(o.instanceColor)n.instanceColor=new T.InstancedBufferAttribute(o.instanceColor.array.subarray(0,o.count*3),3)}
   else n=new T.Mesh(g,m);
   n.matrix.copy(o.matrixWorld);n.matrixAutoUpdate=false;n.castShadow=o.castShadow;n.receiveShadow=true;copies=[n];
  }
  for(const n of copies){if(o.material===C.M.glass||o.material===C.M.glass1)n.userData.renderGlazing=true;bindSourceVisibility(n,o);for(let p=o;p;p=p.parent)if(p.userData.box){n.userData.occlusionLinked=true;break}for(let p=o;p;p=p.parent){if(p===C.city||p===C.ctx)n.userData.context=true;if(p===C.bld||p===C.interiorDressing)n.userData.primary=true;if(p===C.interiorDressing)n.userData.interiorDressing=true;if(p===C.ovl)n.userData.sourceOverlay=true;if(p===C.persistentNeighborhood||p===C.R3D.street||p===C.R3D.props)n.userData.outdoorEnhancement=true;if(p===C.city)n.userData.contextKind='city';if(p===C.ctx)n.userData.contextKind='ctx';}n.visible=sourceVisible(o);scene.add(n)}
 });}
 copyRoot(C.scene);
 function currentOverlaySources(){const sources=new Set();C.ovl?.traverse(o=>{if(o.isMesh&&!o.userData.batched&&!o.material?.isShaderMaterial)sources.add(o)});return sources}
 let overlaySources=currentOverlaySources();
 function refreshOverlayCopies(){
  const next=currentOverlaySources();
  if(next.size===overlaySources.size&&[...next].every(o=>overlaySources.has(o)))return 0;
  const stale=scene.children.filter(o=>o.userData.sourceOverlay);
  for(const copy of stale){scene.remove(copy);const source=copy.sourceVisibilityObject;if(source&&geometries.get(source.geometry)===copy.geometry&&!scene.children.some(other=>other.geometry===copy.geometry)){geometries.delete(source.geometry);copy.geometry.dispose()}}
  overlaySources=next;copyRoot(C.ovl);return stale.length+next.size;
 }
 function syncSourceVisibility(){const overlaysChanged=refreshOverlayCopies();if(overlaysChanged)cancelPrecision();const changed=syncCopiedVisibility(T,scene,C,renderer)+(typeof syncOcclusion==='function'?syncOcclusion():0);ambientStudy?.light(C.reviewDaylight);roomBake?.light(C.reviewDaylight);return changed+overlaysChanged}
 const limitLines=[];
 C.limits.updateWorldMatrix(true,true);
 C.limits.traverse(source=>{if(!source.isLine)return;const copy=copySourceLine(T,source);copy.visible=C.limits.visible;copy.userData.reviewLimit=true;scene.add(copy);limitLines.push(copy)});
 const {batchedObjects,batchBoundsDelta,sources:batchSources}=batchStaticSurroundings(T,mergeGeometries,scene);
 timings.sceneCopyMs=performance.now()-bootAt;
 const loadProgress=window.TOWER_LOAD_PROGRESS=Object.assign(window.TOWER_LOAD_PROGRESS||{},{stage:'scene'});
 // 단계 사이에 한 프레임 양보해 부모 화면의 진행률이 실제로 그려지게 한다.
 const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));await nextFrame();
 // 원본 occl(): 카메라와 시점 중심 사이를 가리는 주변 건물을 숨긴다. 실사에서는 꾸밈 부속까지 건물 단위로
 // 같은 규칙을 카메라가 바뀔 때마다 직접 계산한다(원본 루프와의 실행 순서 차이로 생기는 지연·잔상 방지).
 const occlusionHosts=new Map();
 for(const copy of scene.children){const source=copy.sourceVisibilityObject;if(!source||!copy.userData.occlusionLinked)continue;for(let p=source;p;p=p.parent)if(p.userData?.box){if(!occlusionHosts.has(p))occlusionHosts.set(p,[]);occlusionHosts.get(p).push(copy);break}}
 const occlusionRay=new T.Ray(),occlusionHit=new T.Vector3(),occlusionCenter=new T.Vector3();
 const visibleExcept=(node,skip)=>{for(;node;node=node.parent){if(node!==skip&&!node.visible)return false;if(node.isScene)return true}return false};
 function syncOcclusion(){
  if(!occlusionHosts.size)return 0;
  const from=C.camera.position,to=C.controls.target,distance=from.distanceTo(to);occlusionRay.origin.copy(from);occlusionRay.direction.copy(to).sub(from).normalize();let changed=0;
  for(const [host,copies] of occlusionHosts){
   const box=host.userData.box,hit=occlusionRay.intersectBox(box,occlusionHit),blocked=!!hit&&from.distanceTo(occlusionHit)<distance-1,along=box.getCenter(occlusionCenter).sub(from).dot(occlusionRay.direction);
   const open=host.userData.rayOnly?!(blocked||box.distanceToPoint(from)<30):!(blocked||(along>0&&along<distance*.85));
   for(const copy of copies){const visible=open&&visibleExcept(copy.sourceVisibilityObject,host);if(copy.visible!==visible){copy.visible=visible;changed++}}
  }
  if(changed)renderer.shadowMap.needsUpdate=true;return changed;
 }
 let improved=new URLSearchParams(location.search).get('bake')!=='off';
 let groundBake=null;try{groundBake=await applyBakedGround(T,scene);groundBake.setEnabled(improved&&C.city.visible&&C.ctx.visible)}catch(error){console.warn('Baked ground unavailable; retaining realtime lighting',error)}
 timings.bakeMs=performance.now()-bootAt;
 loadProgress.stage='sky';await nextFrame();
 const hdr=await new HDRLoader().loadAsync('360/assets/daylight-sky_1k.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.environment=hdr;
 timings.hdrMs=performance.now()-bootAt;loadProgress.stage='shaders';await nextFrame();
 function skyGradient(top,horizon,bottom){const canvas=document.createElement('canvas');canvas.width=4;canvas.height=256;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,top);gradient.addColorStop(.48,horizon);gradient.addColorStop(1,bottom);ctx.fillStyle=gradient;ctx.fillRect(0,0,4,256);const map=new T.CanvasTexture(canvas);map.mapping=T.EquirectangularReflectionMapping;map.colorSpace=T.SRGBColorSpace;return map}
 const nightSky=skyGradient('#080e1a','#233047','#202938'),sourceSky=createSourceSky(T,renderer);
 const sun=new T.DirectionalLight(C.sun.color.getHex(),C.sun.intensity);sun.position.copy(C.sun.position);sun.target.position.copy(C.sun.target.position);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:300});sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
 // The HDR is ambient reflection only. Its fixed bright texel cannot represent
 // the source solar elevation, so never show it as a second visible sun.
 function alignDaylight(daylight=C.reviewDaylight){
  sun.position.copy(C.sun.position);sun.target.position.copy(C.sun.target.position);
  sun.color.setHex(daylight.color);sun.intensity=daylight.intensity;
  const azimuth=Math.atan2(daylight.direction[2],daylight.direction[0]);
  scene.environmentRotation.y=.5967185264875144-azimuth;
  scene.environmentIntensity=daylight.night ? .025 : .32;syncMetalReflections();
  scene.background=daylight.night?nightSky:sourceSky.update(daylight);
 }
 alignDaylight();
 // Keep moving-preview glass reflections tied to the actual surrounding scene.
 // Path tracing continues to use geometric reflections and the original lighting HDR.
 const probeTarget=new T.CubeRenderTarget(256,{type:T.HalfFloatType});
 const probe=new T.CubeCamera(.5,1500,probeTarget);probe.position.set(-3,18,0);
 const primary=scene.children.filter(o=>o.userData.primary||o.userData.reviewLimit),primaryVisibility=primary.map(o=>o.visible);primary.forEach(o=>o.visible=false);
 try {probe.update(renderer,scene);for(const m of materials.values())if(m.transmission>0){m.envMap=probeTarget.texture;m.envMapIntensity=1;m.needsUpdate=true;}}
 finally {primary.forEach((o,i)=>o.visible=primaryVisibility[i]);}
 counts.probeRefreshes++;timings.probeMs=performance.now()-bootAt;
 let tracer=null,precisionRequested=false,precisionLoading=false,requestVersion=0,precisionError=null,stopped=false,paused=false,lightProbeTimer=null;
 bindMetalReflections();addInteriorLighting({scene},C);
 // 미리 구운 빛이 없는 실내(2F~PH1·지하)의 환경광 가림 근사와 따뜻한 실내 조명 간접광. 1층(카페 베이크)은 제외.
 const interiorFill=createInteriorFill(T),firstUpper=()=>Math.min(...C.levels().filter(l=>l.kind==='upper').map(l=>C.floorTop(l)));
 const fillBox=new T.Box3(),groundOnly=o=>{fillBox.setFromObject(o);return fillBox.min.y>-.2&&fillBox.max.y<firstUpper()-.1};
 const applyInteriorFill=()=>{try{timings.interiorFill=interiorFill.apply(scene,C,{exclude:groundOnly}).count}catch(error){console.warn('Interior fill skipped',error)}};
 applyInteriorFill();
 // Bake validation downloads and hashes furniture files. Never hold the first frame for it:
 // the realtime path renders immediately and the bake binds once every check has passed.
 let ambientStudy={status:()=>({requested:true,valid:false,enabled:false,reason:'loading',receivers:0,slot:null,slots:[]}),clear(){},refresh(){},light(){},precision(){},dispose(){},materials:()=>[]};
 // Whole-cafe slot bake (structure + furniture + separately baked ceiling lights), also non-blocking.
 let roomBake={status:()=>({requested:true,valid:false,enabled:false,reason:'loading',receivers:0,slot:null,slots:[]}),clear(){},refresh(){},light(){},precision(){},dispose(){}};
 const roomChanged=()=>{renderer.shadowMap.needsUpdate=true;invalidatePresentation()};
 // 첫 방문 로딩: 카페 베이크(라이트맵·UV 약 8 MB)는 첫 화면 뒤에 받기 시작해 필수 자산과 대역폭을 나누지 않는다.
 function startCafeBakes(){
 createCafeAmbientStudy(T,scene,C).then(study=>{
  if(stopped){study.dispose();return}
  ambientStudy=study;study.precision(precisionRequested||precisionLoading);study.light(C.reviewDaylight);materialsChanged();
 }).catch(error=>console.warn('Cafe bake unavailable; realtime lighting retained',error));
 createCafeRoomBake(T,scene,C,{onChange:()=>roomChanged()}).then(bake=>{
  if(stopped){bake.dispose();return}
  roomBake=bake;bake.precision(precisionRequested||precisionLoading);bake.light(C.reviewDaylight);renderer.shadowMap.needsUpdate=true;materialsChanged();
 }).catch(error=>console.warn('Cafe room bake unavailable; realtime lighting retained',error));
 }
 syncSourceVisibility();
 let skyEquirect=null;
 async function requestPrecision(){
  if(precisionLoading||precisionRequested||C.dollMode)return;
  ambientStudy.precision(true);roomBake.precision(true);
  counts.precisionRequests++;lastDrawAt=0;
  const prepareAt=performance.now();
  const version=++requestVersion;precisionLoading=true;precisionError=null;
  try{
   const {createTracer}=await import('./precision.js');
   precisionTiming.moduleMs=performance.now()-prepareAt;
   if(version!==requestVersion||stopped)return;
   // Raster batching reduces draw calls; tracing needs the original shared geometries.
   const sceneAt=performance.now(),traceScene=createPrecisionScene(T,scene,batchSources);
   precisionTiming.sceneMs=performance.now()-sceneAt;
   // 낮 하늘(원본 하늘 큐브 캡처)은 경로 추적기가 WebGPU에서 변환하지 못하므로 등장방형으로 바꿔 넘긴다.
   if(traceScene.background?.isCubeTexture){const key=sourceSky.status().captures;if(!skyEquirect||skyEquirect.key!==key){skyEquirect?.texture.dispose();skyEquirect={key,texture:await cubeToEquirect(T,renderer,traceScene.background)}}if(version!==requestVersion||stopped)return;traceScene.background=skyEquirect.texture}const tracerAt=performance.now();
   if(!tracer)tracer=createTracer(renderer,traceScene,camera,compactTouch);else tracer.setScene(traceScene,camera);
   precisionTiming.tracerMs=performance.now()-tracerAt;
   tracer.maxSamples=previewHigh?64:32;tracer.renderScale=previewHigh?1:.8;
   precisionRequested=true;invalidatePresentation();
  }catch(error){ambientStudy.precision(false);roomBake.precision(false);precisionError=String(error.message||error);console.warn('Precision request failed',error)}
  finally{precisionTiming.totalMs=performance.now()-prepareAt;lastDrawAt=0;if(version===requestVersion)precisionLoading=false;}
 }
 function cancelPrecision(){requestVersion++;const wasActive=precisionRequested||precisionLoading;precisionRequested=false;precisionLoading=false;if(wasActive){const cancelAt=performance.now();tracer?.reset();precisionTiming.cancelMs=performance.now()-cancelAt;lastDrawAt=0;}ambientStudy.precision(false);roomBake.precision(false);invalidatePresentation();}

 const previewPass=pass(scene,camera,{samples:0}),previewAO=ao(previewPass.getTextureNode('depth'),null,camera);
 previewPass.renderTarget.texture.name='tower-preview-color';
 previewAO.resolutionScale=.5;previewAO.radius.value=1;previewAO.thickness.value=.4;
 const filteredAO=denoise(previewAO.getTextureNode(),previewPass.getTextureNode('depth'),null,camera);
 // Depth-based aerial perspective, shared by moving and converged frames.
 // Protect the nearby architecture and leave the photographic sky untouched.
 const haze=previewPass.getViewZNode().negate().sub(100).max(0).mul(-.0006).exp().oneMinus().min(.3).mul(previewPass.getTextureNode('depth').lessThan(.999999));
 // 헤이즈 색은 시간대를 따른다(낮 색 고정이면 야간 원경 건물이 하얗게 뜬다).
 const sectionClip=createSectionClip(T,scene);
 const hazeColor=uniform(new T.Color(DAY_HAZE));
 const exteriorNight=createExteriorNight(T,scene,C.R3D?.lamps||[]);exteriorNight.apply(C.reviewDaylight?.night,hazeColor);
 const whiteBalance=uniform(new T.Vector3(.97,1,1.025)),colorSaturation=uniform(1.03);
 // Final presentation is opaque: AO must never expose the legacy input canvas below.
 const atmospheric=node=>vec4(saturation(mix(node.rgb,hazeColor,haze).mul(whiteBalance),colorSaturation),1);
 // 실시간 화면의 원경 헤이즈는 재질 안개로 계산한다(MSAA 깊이는 후처리에서 읽을 수 없다). 같은 식·같은 색.
 scene.fogNode=fog(hazeColor,positionView.z.negate().sub(100).max(0).mul(-.0006).exp().oneMinus().min(.3));
 const graded=node=>vec4(saturation(node.rgb.mul(whiteBalance),colorSaturation),1);
 // 기본 화면: MSAA 4배로 가는 멀리언·잎 가장자리의 계단과 이동 중 반짝임을 줄인다.
 const msaaSamples=renderParams.has('msaa')?Math.max(0,+renderParams.get('msaa')||0):4;
 // 움직이는 동안: 배율 1 상당 + MSAA 4배(계단·반짝임 감소). 멈춘 뒤: 전체 해상도 + FXAA(고해상도 MSAA는 메모리가 과도).
 const movingPass=pass(scene,camera,{samples:msaaSamples});movingPass.renderTarget.texture.name='tower-moving-color';movingPass.setResolutionScale(Math.min(1,1/balancedRatio));
 const stillPass=pass(scene,camera,{samples:0});stillPass.renderTarget.texture.name='tower-still-color';
 const previewPipeline=new T.RenderPipeline(renderer);previewPipeline.outputNode=fxaa(graded(vec4(previewPass.rgb.mul(filteredAO.r.mul(.65).add(.35)),1)));
 const balancedPipeline=new T.RenderPipeline(renderer);balancedPipeline.outputNode=graded(movingPass);
 const stillPipeline=new T.RenderPipeline(renderer);stillPipeline.outputNode=fxaa(graded(stillPass));
 const precisionTexture=textureNode(new T.Texture());
 const precisionPipeline=new T.RenderPipeline(renderer);precisionPipeline.outputNode=atmospheric(precisionTexture);
 let previewHigh=false;
 let previewGlass=[];
 const previewGlazing=new Map(),previewBindings=[];
 function refreshGlazing(){
  previewGlazing.forEach(m=>m.dispose());previewGlazing.clear();previewBindings.length=0;
  previewGlass=[...materials.values()].filter(m=>m.transmission>0);
  for(const m of previewGlass){const p=m.clone();p.transmission=0;p.transparent=true;p.opacity=m.userData.glazingRole==='facade'?.64:.22;p.color.set(m.userData.glazingRole==='facade'?'#8cabb9':'#dce7e9');p.metalness=m.userData.glazingRole==='facade'?.32:.05;p.roughness=.065;p.side=T.DoubleSide;p.depthWrite=false;p.envMap=probeTarget.texture;p.envMapIntensity=1.15;
   if(improved){const facade=m.userData.glazingRole==='facade';// Alpha preview is not transmission: a pale diffuse layer reads as frosted paint.
    // Keep its absorption tint restrained and let the scene probe supply highlights.
    p.color.set(facade?'#33474e':'#779094');p.metalness=0;p.ior=1.52;p.roughness=.09;p.clearcoat=.12;p.clearcoatRoughness=.08;p.envMapIntensity=facade?1.5:1.0;
    const grazing=normalWorld.dot(cameraPosition.sub(positionWorld).normalize()).abs().oneMinus().pow(5);
    // 올 글라스 시안 사진 기준: 정면에서도 하늘·주변 반사가 읽히는 은은한 반사 유리(정면 약 34%).
    p.opacityNode=grazing.mul(facade?.5:.52).add(facade?.34:.1);
   }
   previewGlazing.set(m,p);}
  scene.traverse(o=>{if(!o.material)return;const original=o.material,replacement=Array.isArray(original)?(original.some(m=>previewGlazing.has(m))?original.map(m=>previewGlazing.get(m)||m):null):previewGlazing.get(original);if(replacement)previewBindings.push({object:o,original,replacement})});
 }
 refreshGlazing();
 // 셰이더(렌더 파이프라인)는 compileAsync로 미리 준비한다. 처음 그릴 때의 동기 컴파일은 같은 스레드를 쓰는
 // 원본 화면 조작까지 수 초 멈춘다. 정지·움직임 패스는 MSAA 표본 수가 달라 파이프라인을 따로 준비한다.
 let bootWarm=false,movingReady=false,warmPending=0,warmChain=Promise.resolve(),movingGen=0,rewarming=false;
 // root를 주면 장면 밖 임시 묶음의 물체만 실제 장면(조명·안개·환경광) 기준으로 준비한다(지연 추가용).
 function warmPass(target,onProgress=null,root=scene){
  // compileAsync는 그릴 대상(재질 포함)을 동기적으로 모은 뒤 비동기로 컴파일하므로 바로 원래대로 돌린다.
  // 시야 밖 물체도 곧 보이게 되므로 시야 절두체 제외를 잠시 끄고 장면 전체를 준비한다.
  const previous=renderer.getRenderTarget(),culled=[];let job;
  root.traverse(o=>{if(o.frustumCulled){o.frustumCulled=false;culled.push(o)}});
  const bindings=root===scene?previewBindings:[];
  for(const b of bindings)b.object.material=b.replacement;
  // 장면은 후처리(RenderPipeline) 안에서 한 단계 중첩(호출 깊이 1)으로 그려지고, 렌더 객체·노드 캐시는 그 깊이의
  // 렌더 컨텍스트별로 따로 잡힌다. compileAsync는 항상 깊이 0으로 준비하므로 이때만 깊이 1 컨텍스트를 쓰게 한다(three 0.186).
  const contexts=renderer._renderContexts,contextAt=contexts.get;contexts.get=(renderTarget,mrt)=>contextAt.call(contexts,renderTarget,mrt,1);
  try{renderer.setRenderTarget(target);job=renderer.compileAsync(root,camera,root===scene?null:scene,onProgress)}
  finally{contexts.get=contextAt;renderer.setRenderTarget(previous);for(const b of bindings)b.object.material=b.original;for(const o of culled)o.frustumCulled=true}
  return job;
 }
 // 첫 화면용(정지 패스+그림자) 준비: 보이는 물체를 조금씩만 켜고 실제 경로로 그려 셰이더·노드를 만든다.
 // compileAsync는 물체마다 GPU 컴파일을 하나씩 기다려 느리고 그림자 경로는 준비하지 못한다.
 async function warmStillInChunks(onProgress){
  const drawables=[];scene.traverseVisible(o=>{if(o.isMesh||o.isLine||o.isPoints||o.isSprite)drawables.push(o)});
  const culled=drawables.filter(o=>o.frustumCulled);
  const hidden=new Set(drawables);for(const o of drawables){o.visible=false;o.frustumCulled=false}
  try{
   // 후처리 패스는 프레임마다 한 번만 장면을 그리므로 한 프레임에 한 묶음씩 처리한다.
   for(let i=0;i<drawables.length;){
    // 부모도 그릴 물체(예: 주변 건물 본체 아래 창·난간)면 부모까지 켜야 자식이 그려진다.
    const end=Math.min(drawables.length,i+WARM_CHUNK),on=new Set();
    for(let k=i;k<end;k++)for(let o=drawables[k];o&&o!==scene;o=o.parent)if(hidden.has(o))on.add(o);
    for(const o of on)o.visible=true;renderer.shadowMap.needsUpdate=true;renderPreview(false);for(const o of on)o.visible=false;i=end;
    onProgress({loaded:i,total:drawables.length});await nextFrame();if(stopped)break;
   }
  }finally{for(const o of drawables)o.visible=true;for(const o of culled)o.frustumCulled=true;renderer.shadowMap.needsUpdate=true}
 }
 // 건물 재생성(시안·주차 방식 전환) 뒤: 부팅과 같은 방식으로 정지 패스·그림자 셰이더를 묶음 단위로 준비하고(로딩 카드가 덮는다)
 // 움직임 패스는 백그라운드로 준비한다. 첫 렌더에서 수천 개를 한꺼번에 동기 준비하면 화면이 수 초 멈췄다.
 async function rewarm(onProgress){
  if(stopped)return;const gen=++movingGen;rewarming=true;movingReady=false;
  try{await warmStillInChunks(onProgress||(()=>{}))}catch(error){console.warn('Shader warm-up failed',error)}
  finally{rewarming=false;invalidatePresentation()}
  warmChain=warmChain.then(()=>warmPass(movingPass.renderTarget)).catch(error=>console.warn('Shader warm-up failed',error)).then(()=>{if(gen===movingGen)movingReady=true});
 }
 // 실내 가구 모델 지연 추가(첫 화면 뒤 층별로): 원본 쪽에 새로 붙은 모델(holders)을 복사해 장면 밖 임시 묶음에서
 // 실내 간접광·금속 반사를 적용하고 셰이더를 비동기로 준비한 뒤 장면에 넣는다. 그동안 기존 화면은 계속 그린다.
 let lazyChain=Promise.resolve();
 function addInteriorObjects(holders){
  const job=lazyChain.then(async()=>{
   if(stopped||!holders?.length)return 0;
   const version=counts.buildingUpdates,before=new Set(scene.children),edges=new Map();
   for(const holder of holders){holder.updateWorldMatrix(true,true);copyRoot(holder,true,edges)}
   // 그림자 패스 셰이더는 미리 준비할 수 없어 첫 사용 때 동기 컴파일(첫 방문 GPU 캐시가 비면 수 초)되므로 지연 추가 가구는 그림자를 드리우지 않는다.
   const added=scene.children.filter(o=>!before.has(o)),temp=new T.Group();for(const o of added){o.castShadow=false;temp.add(o)}
   bindMetalReflections(temp);interiorFill.apply(temp,C,{exclude:groundOnly});
   try{await warmPass(stillPass.renderTarget,null,temp);await warmPass(movingPass.renderTarget,null,temp)}catch(error){console.warn('Interior model warm-up failed',error)}
   // 준비하는 동안 건물이 다시 만들어졌으면(시안 전환) updateBuilding이 이미 새 실내를 복사했으므로 버린다.
   if(stopped||version!==counts.buildingUpdates)return 0;
   sectionClip.suspend();for(const o of [...temp.children])scene.add(o);sectionClip.resume();
   syncMetalReflections();syncSourceVisibility();renderer.shadowMap.needsUpdate=true;invalidatePresentation();
   counts.lazyInteriorObjects=(counts.lazyInteriorObjects||0)+added.length;return added.length;
  });
  lazyChain=job.catch(()=>0);return job;
 }
 // 재질이 바뀌면(카페 베이크 도착 등) 새 셰이더를 준비하는 동안 이전 화면을 유지한다.
 // 첫 화면 뒤 도착한 카페 베이크는 새 수신면(roomReceiver)만 장면 밖 임시 묶음에서 준비한 뒤 다시 넣는다.
 // 준비하는 동안 카페 일부 면만 잠시 빠지고 나머지 화면은 계속 그린다(전체 재준비로 화면이 멈추지 않게).
 function materialsChanged(){
  if(!bootWarm){invalidatePresentation();return}
  warmChain=warmChain.then(async()=>{
   const fresh=scene.children.filter(o=>o.userData.roomReceiver&&!o.userData.receiverWarmed);
   if(!fresh.length){invalidatePresentation();return}
   const receivers=roomBake.status().receivers,version=counts.buildingUpdates,temp=new T.Group();
   // 카페 수신면의 그림자는 베이크에 이미 들어 있으므로 실시간 그림자 패스에서 뺀다(새 그림자 셰이더 동기 컴파일 방지).
   for(const o of fresh)o.castShadow=false;
   sectionClip.suspend();for(const o of fresh)temp.add(o);sectionClip.resume();
   try{await warmPass(stillPass.renderTarget,null,temp);await warmPass(movingPass.renderTarget,null,temp)}catch(error){console.warn('Shader warm-up failed',error)}
   // 준비 중 베이크가 해제·재결합됐거나 건물이 바뀌었으면 옛 수신면은 버린다.
   if(stopped||version!==counts.buildingUpdates||roomBake.status().receivers!==receivers)return;
   sectionClip.suspend();for(const o of fresh){o.userData.receiverWarmed=true;scene.add(o)}sectionClip.resume();
   renderer.shadowMap.needsUpdate=true;invalidatePresentation();
  }).catch(error=>console.warn('Shader warm-up failed',error));
 }
 function renderPreview(moving=false){
  // Alpha glazing needs no transmission framebuffer allocation.

  // Moving raster frames use an alpha approximation of thin glass. Screen-space
  // refraction through overlapping facade faces otherwise obscures the interiors.
  // Restore every original material before the path tracer or guide pass runs.
  for(const b of previewBindings)b.object.material=b.replacement;
  try{if(previewHigh)previewPipeline.render();else if(moving&&movingReady)balancedPipeline.render();else stillPipeline.render()}finally{for(const b of previewBindings)b.object.material=b.original}
 }
 let presented=false,previewCached=false,stillDrawn=false;
 // While the camera is still, keep a single exact preview frame above the tracer.
 // Repainting thousands of scene objects during every tracing pass wastes GPU time.
 const cachedPreview=document.createElement('canvas'),cachedContext=cachedPreview.getContext('2d',{alpha:false});
 Object.assign(cachedPreview.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3',display:'none'});
 function invalidatePresentation(){presented=false;previewCached=false;stillDrawn=false;cachedPreview.style.display='none'}
 function cachePreview(){
  renderPreview();
  if(!cachedContext)return;
  cachedPreview.width=renderer.domElement.width;cachedPreview.height=renderer.domElement.height;
  cachedContext.drawImage(renderer.domElement,0,0);cachedPreview.style.display='block';previewCached=true;
 }
 let lastW=host.clientWidth,lastH=host.clientHeight,lastMotion=performance.now(),signature='';host.appendChild(renderer.domElement);host.appendChild(cachedPreview);window.TOWER_MODERN_ACTIVE=true;
 function refreshProbe(){const primary=scene.children.filter(o=>o.userData.primary||o.userData.reviewLimit),visibility=primary.map(o=>o.visible);primary.forEach(o=>o.visible=false);try{probe.update(renderer,scene);counts.probeRefreshes++}finally{primary.forEach((o,i)=>o.visible=visibility[i])}}
 // 지하층 투시(원본 t-b1): 원본 applyB1See와 같이 지면·대지·도로·보도 재질을 반투명(0.3)·깊이 기록 끔으로 바꾼다.
 // 배칭 메시와 하늘 가림 복제 재질도 같은 원본 재질에서 왔으므로 재질 단위로 처리한다.
 let undergroundSee=false;
 function applyUndergroundSee(value){
  const on=!!value;if(on===undergroundSee)return false;undergroundSee=on;
  const sources=[C.M.ground,C.M.site,C.M.road,C.M.walk,C.RMAT?.ground,C.RMAT?.site,C.RMAT?.road,C.RMAT?.walk].filter(Boolean);
  const ids=new Set(sources.map(m=>materials.get(m)?.uuid).filter(Boolean)),seen=new Set();
  scene.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material)){if(!m||seen.has(m))continue;seen.add(m);if(ids.has(m.uuid)||ids.has(m.userData?.groundBakeSource)){m.transparent=on;m.opacity=on?.3:1;m.depthWrite=!on;m.needsUpdate=true}}});
  return true;
 }
 // 원본은 건물을 다시 만들 때 건물 밖 메시 일부도 새로 만든다(예: 램프·선큰 구멍을 뚫은 3km 지면).
 // 옛 원본이 장면에서 빠진 복사본은 같은 재질·크기의 새 원본에 다시 연결하고 기하를 바꾼다(재질·베이크는 유지).
 function relinkReplacedSources(){
  const attached=o=>{for(;o;o=o.parent)if(o.isScene)return true;return false},size=new T.Vector3(),other=new T.Vector3();
  const bound=new Set(scene.children.map(c=>c.sourceVisibilityObject).filter(Boolean));let relinked=0;
  for(const copy of scene.children){
   const source=copy.sourceVisibilityObject;if(!source||copy.userData.primary||copy.userData.sourceOverlay||attached(source))continue;
   source.geometry.computeBoundingBox();source.geometry.boundingBox.getSize(size);let next=null;
   C.scene.traverse(o=>{if(next||!o.isMesh||o.material!==source.material||bound.has(o)||o.geometry.type!==source.geometry.type||!attached(o))return;o.geometry.computeBoundingBox();if(o.geometry.boundingBox.getSize(other).distanceTo(size)<.01*Math.max(1,size.length()))next=o});
   if(!next)continue;
   next.updateWorldMatrix(true,false);let g=geometry(next.geometry);
   if(copy.geometry.attributes.uv1&&groundBake?.extent)g=withGroundUV1(T,g,next.matrixWorld,groundBake.extent);
   if(!scene.children.some(o=>o!==copy&&o.geometry===copy.geometry)&&![...geometries.values()].includes(copy.geometry))copy.geometry.dispose();
   copy.geometry=g;copy.matrix.copy(next.matrixWorld);copy.matrixWorldNeedsUpdate=true;bindSourceVisibility(copy,next);bound.add(next);relinked++;
  }
  return relinked;
 }
 function updateBuilding(){
  const began=performance.now();counts.buildingUpdates++;cancelPrecision();
  // 종단면 중이면 감싸기를 잠시 풀어 기존 복사본 제거·새 복사본 추가가 장면 직계에서 일어나게 한다.
  sectionClip.suspend();
  ambientStudy.clear();roomBake.clear();
  scene.children.filter(o=>o.userData.primary||o.userData.interiorLight).forEach(o=>{scene.remove(o);if(o.userData.renderGlazing)o.geometry.dispose();});
  // Keep neighbourhood buffers/textures, release only resources no longer referenced.
  const usedG=new Set(),usedM=new Set(groundBake?.materials||[]);for(const originals of batchSources.values())for(const o of originals){usedG.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])usedM.add(m)}scene.traverse(o=>{if(o.geometry)usedG.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])usedM.add(m)});
  for(const [key,value] of geometries)if(!usedG.has(value)){value.dispose();geometries.delete(key)}
  for(const [key,value] of materials)if(!usedM.has(value)){value.dispose();materials.delete(key)}
  roundedProfiles.forEach(g=>g.dispose?.());roundedProfiles.clear();
  copyRoot(C.bld);copyRoot(C.interiorDressing);counts.relinkedSources=(counts.relinkedSources||0)+relinkReplacedSources();bindMetalReflections();addInteriorLighting({scene},C);applyInteriorFill();ambientStudy.refresh();roomBake.refresh();syncSourceVisibility();refreshGlazing();
  // 장면에 남은 모든 재질(배칭된 주변·지면 베이크·꾸밈 재질 포함)이 쓰는 텍스처는 지우지 않는다.
  const usedTextures=new Set(),liveMaterials=new Set([...materials.values(),...(groundBake?.materials||[])]);
  scene.traverse(o=>{for(const m of o.material?[].concat(o.material):[])liveMaterials.add(m)});
  for(const m of liveMaterials)for(const value of Object.values(m))if(value?.isTexture)usedTextures.add(value);
  for(const [source,target] of textures)if(!usedTextures.has(target)){target.dispose();textures.delete(source)}
  sectionClip.resume();renderer.shadowMap.needsUpdate=true;lastUpdateMs=performance.now()-began;
 }
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 window.TOWER_CINEMA={scene,camera,renderer,groundSource:()=>exportGroundSource(T,scene),get captureCanvas(){return cachedPreview.style.display==='block'?cachedPreview:renderer.domElement},get tracer(){return tracer},requestPrecision,cancelPrecision,updateBuilding,pause:value=>{if(paused===value)return;paused=value;cancelPrecision()},
 limits:on=>{cancelPrecision();for(const line of limitLines)line.visible=!!on},
 section:planes=>{if(sectionClip.set(planes)){cancelPrecision();renderer.shadowMap.needsUpdate=true}},
 addInteriorObjects,rewarm,lastMotionAt:()=>lastMotion,
 undergroundSee:on=>{if(applyUndergroundSee(on)){cancelPrecision();renderer.shadowMap.needsUpdate=true}},
 appearance:value=>{cancelPrecision();improved=value;groundBake?.setEnabled(value&&C.city.visible&&C.ctx.visible);refreshGlazing();refreshProbe()},
 context:display=>{cancelPrecision();groundBake?.setEnabled(improved&&(typeof display==='boolean'?display:display.city!==false&&display.ctx!==false));sectionClip.objects().forEach(o=>{if(o.userData.context)o.visible=typeof display==='boolean'?display:display[o.userData.contextKind]!==false});syncSourceVisibility();refreshProbe();renderer.shadowMap.needsUpdate=true},
 quality:value=>{cancelPrecision();previewHigh=value==='high';renderer.setPixelRatio(previewHigh?(compactTouch?1:1.25):balancedRatio);renderer.setSize(host.clientWidth,host.clientHeight)},
 light:daylight=>{cancelPrecision();alignDaylight(daylight);exteriorNight.apply(daylight?.night,hazeColor);ambientStudy.light(daylight);roomBake.light(daylight);renderer.shadowMap.needsUpdate=true;clearTimeout(lightProbeTimer);lightProbeTimer=setTimeout(()=>{if(!stopped&&!paused)refreshProbe()},900)},
 background:async url=>{const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;scene.background=map;cancelPrecision()},
 whiteBalance:(r,g,b)=>{whiteBalance.value.set(r,g,b);cancelPrecision()},
 // Separately baked cafe ceiling lights (room bake lights channel); realtime lights are unaffected.
 cafeInteriorLights:value=>{roomBake.interiorLights?.(value)},
  resetPerformance,syncSourceVisibility,
  status:()=>({bake:groundBake?{receivers:groundBake.count,facades:groundBake.facades,enabled:groundBake.enabled,valid:groundBake.status.valid,reason:groundBake.status.reason,signature:groundBake.status.signature,sunlightBakeValid:groundBake.sunlightBakeValid,loadMs:groundBake.loadMs}:null,ambientStudy:ambientStudy.status(),roomBake:roomBake.status(),exteriorNight:{night:exteriorNight.night,lamps:exteriorNight.lamps.length,leaves:exteriorNight.leaves},section:sectionClip.planes,undergroundSee,daylight:{...C.reviewDaylight,renderedSunDirection:sun.position.clone().sub(sun.target.position).normalize().toArray(),renderedSunIntensity:sun.intensity},sky:sourceSky.status(),improved,mode:precisionLoading?'preparing':precisionRequested?(tracer?._denoiser?.complete?'complete':'rendering'):'interactive',error:precisionError,samples:tracer?._lastSampleCounts,objects:scene.children.length,batchedObjects,batchBoundsDelta,materials:materials.size,firstFrameMs,lastUpdateMs,shaders:{stillMs:timings.shadersMs??null,movingMs:timings.movingShadersMs??null,movingReady,pending:warmPending},frameIntervalMs:frameIntervals.length?frameIntervals.reduce((a,b)=>a+b,0)/frameIntervals.length:null,frameMs:frameSubmitMs.length?frameSubmitMs.reduce((a,b)=>a+b,0)/frameSubmitMs.length:null,performance:performanceStatus()}),
 stop:()=>{stopped=true;clearTimeout(lightProbeTimer);cancelPrecision();interiorFill.dispose();ambientStudy.dispose();roomBake.dispose();window.TOWER_MODERN_ACTIVE=false;renderer.domElement.remove();cachedPreview.remove();previewGlazing.forEach(m=>m.dispose());tracer?.dispose();probeTarget.dispose();sourceSky.dispose();skyEquirect?.texture.dispose();nightSky.dispose();previewPipeline.dispose();balancedPipeline.dispose();stillPipeline.dispose();precisionPipeline.dispose();previewAO.dispose();previewPass.dispose();renderer.dispose()}};
 function frame(){if(!window.TOWER_MODERN_ACTIVE)return;requestAnimationFrame(frame);if(paused||rewarming){lastDrawAt=0;return}const w=host.clientWidth,h=host.clientHeight;if(lastW!==w||lastH!==h){invalidatePresentation();lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(precisionRequested)tracer?.updateCamera()}
  const next=C.camera.position.toArray().concat(C.camera.quaternion.toArray(),[C.camera.fov,C.camera.near]).map(v=>v.toFixed(5)).join(',');if(next!==signature){counts.cameraMoves++;cancelPrecision();stillDrawn=false;syncOcclusion();lastMotion=performance.now();signature=next;whiteBalance.value.set(...(C.cafeMode?[1.045,1,.955]:[.97,1,1.025]));camera.position.copy(C.camera.position);camera.quaternion.copy(C.camera.quaternion);camera.fov=C.camera.fov;camera.near=C.camera.near;camera.updateProjectionMatrix();camera.updateMatrixWorld()}
  // Keep stochastic grain off screen during movement and convergence.
  // Both views share geometry, camera and environment; moving glass is an alpha approximation.
  try{
    if(gpuError)throw gpuError;
    if(!precisionRequested){if(warmPending>0){lastDrawAt=0;return}const moving=performance.now()-lastMotion<STILL_DELAY_MS;if(!previewCached||(!moving&&!stillDrawn)){const began=performance.now();renderPreview(moving);counts.previewFrames++;if(moving){if(lastDrawAt)measure(frameIntervals,began-lastDrawAt);lastDrawAt=began;measure(frameSubmitMs,performance.now()-began)}else{counts.stillFrames=(counts.stillFrames||0)+1;lastDrawAt=0}if(firstFrameMs===null){firstFrameMs=performance.now()-bootAt;loadProgress.stage='ready'}previewCached=true;stillDrawn=!moving;}else lastDrawAt=0;return;}
    lastDrawAt=0;
    if(presented&&tracer._denoiser?.complete)return;
    if(performance.now()-lastMotion>200){tracer.renderSample();counts.precisionSamples++;}
    if(performance.now()-lastMotion<=200)renderPreview(true);
    else if(!tracer._denoiser?.complete){if(!previewCached)cachePreview();}
    else if(tracer._denoiser.texture){cachedPreview.style.display='none';if(precisionTexture.value!==tracer._denoiser.texture){precisionTexture.value=tracer._denoiser.texture;precisionPipeline.needsUpdate=true;}// The atmospheric depth node reuses previewPass. Keep its auxiliary raster
      // render on the same non-transmissive preview materials as moving frames.
      for(const b of previewBindings)b.object.material=b.replacement;
      try{precisionPipeline.render()}finally{for(const b of previewBindings)b.object.material=b.original}
      presented=true;}
  }catch(error){if(!deviceLost&&(tracer||precisionRequested||precisionLoading)){precisionError=String(error?.message||error);tracer?.dispose();tracer=null;gpuError=null;cancelPrecision();console.warn('Precision stopped; interactive renderer retained',precisionError);return;}console.warn('Precision renderer stopped; restoring realtime view',error);window.TOWER_CINEMA_FAILURE=true;window.TOWER_CINEMA_FAILURE_REASON=String(error?.message||error);window.TOWER_CINEMA.stop();window.TOWER_CINEMA=null;}

 }
 // 첫 화면 전에 정지 화면용 셰이더를 준비하고(진행률 표시), 움직임용은 첫 화면 뒤 백그라운드로 준비한다.
 // 카페 베이크는 대개 이 사이에 도착하므로 잠시 기다려 같은 준비에 포함한다(늦으면 도착 후 다시 준비).
 loadProgress.stage='shaders';
 if(stopped)return window.TOWER_CINEMA;
 const shaderProgress=event=>{loadProgress.shadersDone=event.loaded;loadProgress.shadersTotal=event.total};
 bootWarm=true;
 try{await warmStillInChunks(shaderProgress)}catch(error){console.warn('Shader warm-up failed',error)}
 timings.shadersMs=performance.now()-bootAt;
 frame();setTimeout(startCafeBakes,0);
 {const gen=movingGen;warmChain=warmChain.then(()=>warmPass(movingPass.renderTarget)).catch(error=>console.warn('Shader warm-up failed',error)).then(()=>{if(gen===movingGen)movingReady=true;timings.movingShadersMs=performance.now()-bootAt});}
 const countTimer=setInterval(()=>{if(!window.TOWER_MODERN_ACTIVE){clearInterval(countTimer);return}if(precisionRequested)tracer?.getSampleCountsAsync().catch(()=>{})},1500);return window.TOWER_CINEMA;
}
export async function changeBackdrop(state,url){const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;state.scene.background=map;state.tracer?.updateEnvironment();}
export function addInteriorLighting(state,C){
 for(const l of C.levels().filter(l=>l.kind==='upper')){
  // Distribute soft interior light across the glazed frontage, rather than
  // leaving one bright central patch per floor. Fixture positions remain inside the plan.
  const positions=[[-9.5,-7],[-9.5,0],[-9.5,6]].filter(([x,z])=>C.inPoly([x*41.6+914,z*41.6+770],l.poly));
  for(const [x,z] of positions){const light=new T.RectAreaLight(0xffe8ce,(l.kind==='ground'?60:45)/positions.length,2.2,.18);light.position.set(x,l.y+l.h-.45,z);light.lookAt(x,l.y,z);light.userData.interiorLight=true;state.scene.add(light);}
 }
 const cafe=C.interiorDressing?.userData.cafe;
 if(cafe){for(const x of [-10,-5])for(const z of [-7,0,5]){if(!C.inPoly([x*41.6+914,z*41.6+770],C.levels().find(l=>l.kind==='ground').poly))continue;const a=new T.RectAreaLight(0xffedda,2.5,3,3);a.position.set(x,cafe.ceiling-.12,z);a.lookAt(x,cafe.floor,z);a.userData.interiorLight=true;a.userData.cafeRoomBakedLight=true;state.scene.add(a);}
 const bounce=new T.RectAreaLight(0xffdfb6,.7,8,12);bounce.position.set(-6,cafe.floor+.1,-2);bounce.lookAt(-6,cafe.ceiling,-2);bounce.userData.interiorLight=true;bounce.userData.cafeAmbientFallback=true;state.scene.add(bounce);
 const windowFill=new T.RectAreaLight(0xe4efff,2,16,3.5);windowFill.position.set(-12.5,2.4,-1);windowFill.lookAt(-3,2.4,-1);windowFill.userData.interiorLight=true;windowFill.userData.cafeAmbientFallback=true;state.scene.add(windowFill);}
 state.tracer?.updateLights();
}
