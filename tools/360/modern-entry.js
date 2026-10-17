import { copyMaterialTextures } from './material-textures.js';
import { glazingSides } from './glazing-sides.js';
import { applyBakedGround, exportGroundSource } from './baked-ground.js';
import { createExteriorNight, DAY_HAZE } from './exterior-night.js';
import { createSectionClip } from './section-clip.js';
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
import { pass, texture as textureNode, vec4, mix, saturation, uniform, normalWorld, positionWorld, cameraPosition } from 'three/tsl';
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
 const renderer=new T.WebGPURenderer({alpha:false,antialias:true,powerPreference:'high-performance',requiredLimits:{maxStorageBufferBindingSize:Math.min(limit,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(limit,adapter.limits.maxBufferSize)}});renderer.setPixelRatio(1);renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.4;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;await renderer.init();timings.rendererInitMs=performance.now()-bootAt;
 let gpuError=null,deviceLost=false;renderer.backend.device?.addEventListener('uncapturederror',event=>{event.preventDefault();if(!gpuError){gpuError=event.error;console.warn('Precision GPU validation failure',gpuError.message)}});
 renderer.backend.device?.lost.then(info=>{if(info.reason!=='destroyed'){deviceLost=true;gpuError=new Error(info.message||'GPU device lost')}});
 const host=C.renderer.domElement.parentElement;renderer.setSize(host.clientWidth,host.clientHeight);Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'2'});
 const materials=new Map(),geometries=new Map(),textures=new Map();
 function texture(t){if(!t)return null;if(textures.has(t))return textures.get(t);const n=new T.Texture(t.image);n.wrapS=t.wrapS;n.wrapT=t.wrapT;n.repeat.copy(t.repeat);n.offset.copy(t.offset);n.rotation=t.rotation;n.flipY=t.flipY;n.colorSpace=t.encoding===3001?T.SRGBColorSpace:T.NoColorSpace;n.anisotropy=4;n.needsUpdate=true;textures.set(t,n);return n}
 function material(m){if(materials.has(m))return materials.get(m);
  const glass=m===C.M.glass||m===C.M.glass1||m===C.M.door||m===C.M.guard||m===C.M.rail;
  const n=new T.MeshPhysicalMaterial({color:m.color?.clone()||new T.Color(.5,.5,.5),roughness:m.roughness??.7,metalness:m.metalness??0,side:m.side,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest||0});
  copyMaterialTextures(m,n,texture);if(m.normalScale)n.normalScale.copy(m.normalScale);n.bumpScale=m.bumpScale||.01;if(m.emissive)n.emissive.copy(m.emissive);n.emissiveIntensity=m.emissiveIntensity||0;
  n.clearcoat=m.clearcoat||0;n.clearcoatRoughness=m.clearcoatRoughness||0;
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
 function copyRoot(root){const glazingEdges=root===C.ovl?new Map():collectGlazingEdges(T,C.bld,[C.M.glass,C.M.glass1]);root.updateWorldMatrix(true,true);
 root.traverse(o=>{
  let building=false;for(let p=o;p;p=p.parent)if(p===C.bld)building=true;
  if(!building)for(let p=o;p;p=p.parent)if(!p.visible&&!p.userData.box&&p!==C.city&&p!==C.ctx)return;
  if(!o.isMesh||o.userData.batched||o===C.R3D.sky||o.material?.isShaderMaterial)return;
  const m=Array.isArray(o.material)?o.material.map(material):material(o.material);
  let copies=o.isInstancedMesh&&o.userData.roundedCurtainWall?copyRoundedMullions(T,RoundedBoxGeometry,o,m,roundedProfiles,glazingEdges):null;
  if(!copies){
   let g=geometry(o.geometry);if(o.material===C.M.glass||o.material===C.M.glass1){g=glazingSides(T,g,o.matrixWorld);}let n;
   if(o.isInstancedMesh){n=new T.InstancedMesh(g,m,o.count);n.instanceMatrix.array.set(o.instanceMatrix.array.subarray(0,o.count*16));n.instanceMatrix.needsUpdate=true;if(o.instanceColor)n.instanceColor=new T.InstancedBufferAttribute(o.instanceColor.array.subarray(0,o.count*3),3)}
   else n=new T.Mesh(g,m);
   n.matrix.copy(o.matrixWorld);n.matrixAutoUpdate=false;n.castShadow=o.castShadow;n.receiveShadow=true;copies=[n];
  }
  for(const n of copies){if(o.material===C.M.glass||o.material===C.M.glass1)n.userData.renderGlazing=true;bindSourceVisibility(n,o);for(let p=o;p;p=p.parent){if(p===C.city||p===C.ctx)n.userData.context=true;if(p===C.bld||p===C.interiorDressing)n.userData.primary=true;if(p===C.interiorDressing)n.userData.interiorDressing=true;if(p===C.ovl)n.userData.sourceOverlay=true;if(p===C.persistentNeighborhood||p===C.R3D.street||p===C.R3D.props)n.userData.outdoorEnhancement=true;if(p===C.city)n.userData.contextKind='city';if(p===C.ctx)n.userData.contextKind='ctx';}n.visible=sourceVisible(o);scene.add(n)}
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
 function syncSourceVisibility(){const overlaysChanged=refreshOverlayCopies();if(overlaysChanged)cancelPrecision();const changed=syncCopiedVisibility(T,scene,C,renderer);ambientStudy?.light(C.reviewDaylight);roomBake?.light(C.reviewDaylight);return changed+overlaysChanged}
 const limitLines=[];
 C.limits.updateWorldMatrix(true,true);
 C.limits.traverse(source=>{if(!source.isLine)return;const copy=copySourceLine(T,source);copy.visible=C.limits.visible;copy.userData.reviewLimit=true;scene.add(copy);limitLines.push(copy)});
 const {batchedObjects,batchBoundsDelta,sources:batchSources}=batchStaticSurroundings(T,mergeGeometries,scene);
 timings.sceneCopyMs=performance.now()-bootAt;
 let improved=new URLSearchParams(location.search).get('bake')!=='off';
 let groundBake=null;try{groundBake=await applyBakedGround(T,scene);groundBake.setEnabled(improved&&C.city.visible&&C.ctx.visible)}catch(error){console.warn('Baked ground unavailable; retaining realtime lighting',error)}
 timings.bakeMs=performance.now()-bootAt;
 const hdr=await new HDRLoader().loadAsync('360/assets/daylight-sky_2k.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.environment=hdr;
 timings.hdrMs=performance.now()-bootAt;
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
  scene.environmentIntensity=daylight.night ? .025 : .32;
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
 addInteriorLighting({scene},C);
 // Bake validation downloads and hashes furniture files. Never hold the first frame for it:
 // the realtime path renders immediately and the bake binds once every check has passed.
 let ambientStudy={status:()=>({requested:true,valid:false,enabled:false,reason:'loading',receivers:0,slot:null,slots:[]}),clear(){},refresh(){},light(){},precision(){},dispose(){},materials:()=>[]};
 createCafeAmbientStudy(T,scene,C).then(study=>{
  if(stopped){study.dispose();return}
  ambientStudy=study;study.precision(precisionRequested||precisionLoading);study.light(C.reviewDaylight);invalidatePresentation();
 }).catch(error=>console.warn('Cafe bake unavailable; realtime lighting retained',error));
 // Whole-cafe slot bake (structure + furniture + separately baked ceiling lights), also non-blocking.
 let roomBake={status:()=>({requested:true,valid:false,enabled:false,reason:'loading',receivers:0,slot:null,slots:[]}),clear(){},refresh(){},light(){},precision(){},dispose(){}};
 const roomChanged=()=>{renderer.shadowMap.needsUpdate=true;invalidatePresentation()};
 createCafeRoomBake(T,scene,C,{onChange:()=>roomChanged()}).then(bake=>{
  if(stopped){bake.dispose();return}
  roomBake=bake;bake.precision(precisionRequested||precisionLoading);bake.light(C.reviewDaylight);roomChanged();
 }).catch(error=>console.warn('Cafe room bake unavailable; realtime lighting retained',error));
 syncSourceVisibility();
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
   precisionTiming.sceneMs=performance.now()-sceneAt;const tracerAt=performance.now();
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
 const previewPipeline=new T.RenderPipeline(renderer);previewPipeline.outputNode=fxaa(atmospheric(vec4(previewPass.rgb.mul(filteredAO.r.mul(.65).add(.35)),1)));
 const balancedPipeline=new T.RenderPipeline(renderer);balancedPipeline.outputNode=fxaa(atmospheric(previewPass));
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
    p.color.set(facade?'#49636b':'#779094');p.metalness=0;p.ior=1.52;p.roughness=.09;p.clearcoat=.12;p.clearcoatRoughness=.08;p.envMapIntensity=1.0;
    const grazing=normalWorld.dot(cameraPosition.sub(positionWorld).normalize()).abs().oneMinus().pow(5);
    p.opacityNode=grazing.mul(facade?.55:.52).add(facade?.18:.1);
   }
   previewGlazing.set(m,p);}
  scene.traverse(o=>{if(!o.material)return;const original=o.material,replacement=Array.isArray(original)?(original.some(m=>previewGlazing.has(m))?original.map(m=>previewGlazing.get(m)||m):null):previewGlazing.get(original);if(replacement)previewBindings.push({object:o,original,replacement})});
 }
 refreshGlazing();
 function renderPreview(moving=false){
  // Alpha glazing needs no transmission framebuffer allocation.

  // Moving raster frames use an alpha approximation of thin glass. Screen-space
  // refraction through overlapping facade faces otherwise obscures the interiors.
  // Restore every original material before the path tracer or guide pass runs.
  for(const b of previewBindings)b.object.material=b.replacement;
  try{if(previewHigh)previewPipeline.render();else balancedPipeline.render()}finally{for(const b of previewBindings)b.object.material=b.original}
 }
 let presented=false,previewCached=false;
 // While the camera is still, keep a single exact preview frame above the tracer.
 // Repainting thousands of scene objects during every tracing pass wastes GPU time.
 const cachedPreview=document.createElement('canvas'),cachedContext=cachedPreview.getContext('2d',{alpha:false});
 Object.assign(cachedPreview.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3',display:'none'});
 function invalidatePresentation(){presented=false;previewCached=false;cachedPreview.style.display='none'}
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
  copyRoot(C.bld);copyRoot(C.interiorDressing);addInteriorLighting({scene},C);ambientStudy.refresh();roomBake.refresh();syncSourceVisibility();refreshGlazing();
  const usedTextures=new Set();for(const m of [...materials.values(),...(groundBake?.materials||[])])for(const value of Object.values(m))if(value?.isTexture)usedTextures.add(value);
  for(const [source,target] of textures)if(!usedTextures.has(target)){target.dispose();textures.delete(source)}
  sectionClip.resume();renderer.shadowMap.needsUpdate=true;lastUpdateMs=performance.now()-began;
 }
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 window.TOWER_CINEMA={scene,camera,renderer,groundSource:()=>exportGroundSource(T,scene),get captureCanvas(){return cachedPreview.style.display==='block'?cachedPreview:renderer.domElement},get tracer(){return tracer},requestPrecision,cancelPrecision,updateBuilding,pause:value=>{if(paused===value)return;paused=value;cancelPrecision()},
 limits:on=>{cancelPrecision();for(const line of limitLines)line.visible=!!on},
 section:planes=>{if(sectionClip.set(planes)){cancelPrecision();renderer.shadowMap.needsUpdate=true}},
 undergroundSee:on=>{if(applyUndergroundSee(on)){cancelPrecision();renderer.shadowMap.needsUpdate=true}},
 appearance:value=>{cancelPrecision();improved=value;groundBake?.setEnabled(value&&C.city.visible&&C.ctx.visible);refreshGlazing();refreshProbe()},
 context:display=>{cancelPrecision();groundBake?.setEnabled(improved&&(typeof display==='boolean'?display:display.city!==false&&display.ctx!==false));sectionClip.objects().forEach(o=>{if(o.userData.context)o.visible=typeof display==='boolean'?display:display[o.userData.contextKind]!==false});syncSourceVisibility();refreshProbe();renderer.shadowMap.needsUpdate=true},
 quality:value=>{cancelPrecision();previewHigh=value==='high';renderer.setPixelRatio(previewHigh?(compactTouch?1:1.25):1);renderer.setSize(host.clientWidth,host.clientHeight)},
 light:daylight=>{cancelPrecision();alignDaylight(daylight);exteriorNight.apply(daylight?.night,hazeColor);ambientStudy.light(daylight);roomBake.light(daylight);renderer.shadowMap.needsUpdate=true;clearTimeout(lightProbeTimer);lightProbeTimer=setTimeout(()=>{if(!stopped&&!paused)refreshProbe()},900)},
 background:async url=>{const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;scene.background=map;cancelPrecision()},
 whiteBalance:(r,g,b)=>{whiteBalance.value.set(r,g,b);cancelPrecision()},
 // Separately baked cafe ceiling lights (room bake lights channel); realtime lights are unaffected.
 cafeInteriorLights:value=>{roomBake.interiorLights?.(value)},
  resetPerformance,syncSourceVisibility,
  status:()=>({bake:groundBake?{receivers:groundBake.count,facades:groundBake.facades,enabled:groundBake.enabled,valid:groundBake.status.valid,reason:groundBake.status.reason,signature:groundBake.status.signature,sunlightBakeValid:groundBake.sunlightBakeValid,loadMs:groundBake.loadMs}:null,ambientStudy:ambientStudy.status(),roomBake:roomBake.status(),exteriorNight:{night:exteriorNight.night,lamps:exteriorNight.lamps.length,leaves:exteriorNight.leaves},section:sectionClip.planes,undergroundSee,daylight:{...C.reviewDaylight,renderedSunDirection:sun.position.clone().sub(sun.target.position).normalize().toArray(),renderedSunIntensity:sun.intensity},sky:sourceSky.status(),improved,mode:precisionLoading?'preparing':precisionRequested?(tracer?._denoiser?.complete?'complete':'rendering'):'interactive',error:precisionError,samples:tracer?._lastSampleCounts,objects:scene.children.length,batchedObjects,batchBoundsDelta,materials:materials.size,firstFrameMs,lastUpdateMs,frameIntervalMs:frameIntervals.length?frameIntervals.reduce((a,b)=>a+b,0)/frameIntervals.length:null,frameMs:frameSubmitMs.length?frameSubmitMs.reduce((a,b)=>a+b,0)/frameSubmitMs.length:null,performance:performanceStatus()}),
 stop:()=>{stopped=true;clearTimeout(lightProbeTimer);cancelPrecision();ambientStudy.dispose();roomBake.dispose();window.TOWER_MODERN_ACTIVE=false;renderer.domElement.remove();cachedPreview.remove();previewGlazing.forEach(m=>m.dispose());tracer?.dispose();probeTarget.dispose();sourceSky.dispose();nightSky.dispose();previewPipeline.dispose();balancedPipeline.dispose();precisionPipeline.dispose();previewAO.dispose();previewPass.dispose();renderer.dispose()}};
 function frame(){if(!window.TOWER_MODERN_ACTIVE)return;requestAnimationFrame(frame);if(paused){lastDrawAt=0;return}const w=host.clientWidth,h=host.clientHeight;if(lastW!==w||lastH!==h){invalidatePresentation();lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(precisionRequested)tracer?.updateCamera()}
  const next=C.camera.position.toArray().concat(C.camera.quaternion.toArray(),[C.camera.fov,C.camera.near]).map(v=>v.toFixed(5)).join(',');if(next!==signature){counts.cameraMoves++;cancelPrecision();lastMotion=performance.now();signature=next;whiteBalance.value.set(...(C.cafeMode?[1.045,1,.955]:[.97,1,1.025]));camera.position.copy(C.camera.position);camera.quaternion.copy(C.camera.quaternion);camera.fov=C.camera.fov;camera.near=C.camera.near;camera.updateProjectionMatrix();camera.updateMatrixWorld()}
  // Keep stochastic grain off screen during movement and convergence.
  // Both views share geometry, camera and environment; moving glass is an alpha approximation.
  try{
    if(gpuError)throw gpuError;
    if(!precisionRequested){if(!previewCached){const began=performance.now();renderPreview();counts.previewFrames++;if(lastDrawAt)measure(frameIntervals,began-lastDrawAt);lastDrawAt=began;measure(frameSubmitMs,performance.now()-began);if(firstFrameMs===null)firstFrameMs=performance.now()-bootAt;previewCached=true;}else lastDrawAt=0;return;}
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

 }frame();
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
