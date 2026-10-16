import { glazingSides } from './glazing-sides.js';
import { applyBakedGround } from './baked-ground.js';
import { batchStaticSurroundings, createPrecisionScene } from './static-batching.js';
import { copyRoundedMullions, collectGlazingEdges } from './curtain-wall.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { copyGeometry } from './geometry-copy.js';
import * as T from 'three/webgpu';
import { pass, texture as textureNode, vec4, mix, saturation, uniform, normalWorld, positionWorld, cameraPosition } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
export async function start(C){
 const bootAt=performance.now();let firstFrameMs=null,lastUpdateMs=null,frameTimes=[],lastDrawAt=0,frameIntervals=[];
 const compactTouch=parent.innerWidth<=850&&matchMedia('(pointer: coarse)').matches;
 T.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(C.camera.fov,C.camera.aspect,2,1800);
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('WebGPU adapter unavailable');
 const limit=512*1024*1024;
 const renderer=new T.WebGPURenderer({antialias:true,powerPreference:'high-performance',requiredLimits:{maxStorageBufferBindingSize:Math.min(limit,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(limit,adapter.limits.maxBufferSize)}});renderer.setPixelRatio(compactTouch?1:1.25);renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.4;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;await renderer.init();
 let gpuError=null,deviceLost=false;renderer.backend.device?.addEventListener('uncapturederror',event=>{event.preventDefault();if(!gpuError){gpuError=event.error;console.warn('Precision GPU validation failure',gpuError.message)}});
 renderer.backend.device?.lost.then(info=>{if(info.reason!=='destroyed'){deviceLost=true;gpuError=new Error(info.message||'GPU device lost')}});
 const host=C.renderer.domElement.parentElement;renderer.setSize(host.clientWidth,host.clientHeight);Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'2'});
 const materials=new Map(),geometries=new Map(),textures=new Map();
 function texture(t){if(!t)return null;if(textures.has(t))return textures.get(t);const n=new T.Texture(t.image);n.wrapS=t.wrapS;n.wrapT=t.wrapT;n.repeat.copy(t.repeat);n.offset.copy(t.offset);n.rotation=t.rotation;n.flipY=t.flipY;n.colorSpace=t.encoding===3001?T.SRGBColorSpace:T.NoColorSpace;n.anisotropy=4;n.needsUpdate=true;textures.set(t,n);return n}
 function material(m){if(materials.has(m))return materials.get(m);
  const glass=m===C.M.glass||m===C.M.glass1||m===C.M.door||m===C.M.guard||m===C.M.rail;
  const n=new T.MeshPhysicalMaterial({color:m.color?.clone()||new T.Color(.5,.5,.5),roughness:m.roughness??.7,metalness:m.metalness??0,side:m.side,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest||0});
  ['map','aoMap','normalMap','roughnessMap','metalnessMap','bumpMap','emissiveMap','alphaMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap'].forEach(k=>n[k]=texture(m[k]));if(m.normalScale)n.normalScale.copy(m.normalScale);n.bumpScale=m.bumpScale||.01;if(m.emissive)n.emissive.copy(m.emissive);n.emissiveIntensity=m.emissiveIntensity||0;
  if(m.aoMap){n.aoMap.channel=1;n.aoMapIntensity=m.aoMapIntensity??1;}n.clearcoat=m.clearcoat||0;n.clearcoatRoughness=m.clearcoatRoughness||0;
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
 function copyRoot(root){const glazingEdges=collectGlazingEdges(T,C.bld,[C.M.glass,C.M.glass1]);root.updateWorldMatrix(true,true);
 root.traverse(o=>{
  for(let p=o;p;p=p.parent)if(!p.visible&&!p.userData.box&&p!==C.city&&p!==C.ctx)return;
  if(!o.isMesh||o===C.R3D.sky||o.material?.isShaderMaterial)return;
  const m=Array.isArray(o.material)?o.material.map(material):material(o.material);
  let copies=o.isInstancedMesh&&o.userData.roundedCurtainWall?copyRoundedMullions(T,RoundedBoxGeometry,o,m,roundedProfiles,glazingEdges):null;
  if(!copies){
   let g=geometry(o.geometry);if(o.material===C.M.glass||o.material===C.M.glass1){g=glazingSides(T,g,o.matrixWorld);}let n;
   if(o.isInstancedMesh){n=new T.InstancedMesh(g,m,o.count);n.instanceMatrix.array.set(o.instanceMatrix.array.subarray(0,o.count*16));n.instanceMatrix.needsUpdate=true;if(o.instanceColor)n.instanceColor=new T.InstancedBufferAttribute(o.instanceColor.array.subarray(0,o.count*3),3)}
   else n=new T.Mesh(g,m);
   n.matrix.copy(o.matrixWorld);n.matrixAutoUpdate=false;n.castShadow=o.castShadow;n.receiveShadow=true;copies=[n];
  }
  for(const n of copies){if(o.material===C.M.glass||o.material===C.M.glass1)n.userData.renderGlazing=true;for(let p=o;p;p=p.parent){if(p===C.city||p===C.ctx)n.userData.context=true;if(p===C.bld||p===C.interiorDressing)n.userData.primary=true;if(p===C.city)n.userData.contextKind='city';if(p===C.ctx)n.userData.contextKind='ctx';}if(n.userData.contextKind)n.visible=C[n.userData.contextKind].visible;scene.add(n)}
 });}
 copyRoot(C.scene);
 const {batchedObjects,batchBoundsDelta,sources:batchSources}=batchStaticSurroundings(T,mergeGeometries,scene);
 let improved=new URLSearchParams(location.search).get('bake')!=='off';
 let groundBake=null;try{groundBake=await applyBakedGround(T,scene);groundBake.setEnabled(improved&&C.city.visible&&C.ctx.visible)}catch(error){console.warn('Baked ground unavailable; retaining realtime lighting',error)}
 const hdr=await new HDRLoader().loadAsync('360/assets/daylight-sky_2k.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.environment=hdr;scene.background=hdr;scene.environmentIntensity=.8;scene.backgroundIntensity=1.55;
 const daylightColor=()=>C.R3D.time==='sunset'?C.sun.color.getHex():C.R3D.time==='am'?0xfff4e6:0xfff3dd;
 const sun=new T.DirectionalLight(daylightColor(),C.R3D.time==='sunset'?2:1.2);sun.position.copy(C.sun.position);sun.target.position.copy(C.sun.target.position);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:300});sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
 // Measured brightest texel of this specific 2K HDR: azimuth .59672, elevation .83602 rad.
 // Rotate the environment and visible sky together; align the daylight key to the HDR sun.
 function alignDaylight(){
  const azimuth=C.R3D.time==='am'?Math.atan2(-40,65):Math.atan2(70,-65);
  const elevation=.8360195293976744,r=140,flat=Math.cos(elevation)*r;
  scene.environmentRotation.y=scene.backgroundRotation.y=.5967185264875144-azimuth;
  if(C.R3D.time!=='sunset')sun.position.set(sun.target.position.x+Math.cos(azimuth)*flat,sun.target.position.y+Math.sin(elevation)*r,sun.target.position.z+Math.sin(azimuth)*flat);
 }
 alignDaylight();
 // Keep moving-preview glass reflections tied to the actual surrounding scene.
 // Path tracing continues to use geometric reflections and the original lighting HDR.
 const probeTarget=new T.CubeRenderTarget(256,{type:T.HalfFloatType});
 const probe=new T.CubeCamera(.5,1500,probeTarget);probe.position.set(-3,18,0);
 const primary=scene.children.filter(o=>o.userData.primary);primary.forEach(o=>o.visible=false);
 try {probe.update(renderer,scene);for(const m of materials.values())if(m.transmission>0){m.envMap=probeTarget.texture;m.envMapIntensity=1;m.needsUpdate=true;}}
 finally {primary.forEach(o=>o.visible=true);}
 let tracer=null,precisionRequested=false,precisionLoading=false,requestVersion=0,precisionError=null,stopped=false,paused=false;
 addInteriorLighting({scene},C);
 async function requestPrecision(){
  if(precisionLoading||precisionRequested)return;
  const version=++requestVersion;precisionLoading=true;precisionError=null;
  try{
   const {createTracer}=await import('./precision.js');
   if(version!==requestVersion||stopped)return;
   // Raster batching reduces draw calls; tracing needs the original shared geometries.
   const traceScene=createPrecisionScene(T,scene,batchSources);
   if(!tracer)tracer=createTracer(renderer,traceScene,camera,compactTouch);else tracer.setScene(traceScene,camera);
   tracer.maxSamples=previewHigh?64:32;tracer.renderScale=previewHigh?1:.8;
   precisionRequested=true;invalidatePresentation();
  }catch(error){precisionError=String(error.message||error);console.warn('Precision request failed',error)}
  finally{if(version===requestVersion)precisionLoading=false;}
 }
 function cancelPrecision(){requestVersion++;precisionRequested=false;precisionLoading=false;tracer?.reset();invalidatePresentation();}

 const previewPass=pass(scene,camera,{samples:0}),previewAO=ao(previewPass.getTextureNode('depth'),null,camera);
 previewPass.renderTarget.texture.name='tower-preview-color';
 previewAO.resolutionScale=.5;previewAO.radius.value=1;previewAO.thickness.value=.4;
 const filteredAO=denoise(previewAO.getTextureNode(),previewPass.getTextureNode('depth'),null,camera);
 // Depth-based aerial perspective, shared by moving and converged frames.
 // Protect the nearby architecture and leave the photographic sky untouched.
 const haze=previewPass.getViewZNode().negate().sub(100).max(0).mul(-.0006).exp().oneMinus().min(.3).mul(previewPass.getTextureNode('depth').lessThan(.999999));
 const hazeColor=new T.Color('#bdcbd5');
 const whiteBalance=uniform(new T.Vector3(.97,1,1.025)),colorSaturation=uniform(1.03);
 const atmospheric=node=>vec4(saturation(mix(node.rgb,hazeColor,haze).mul(whiteBalance),colorSaturation),node.a);
 const previewPipeline=new T.RenderPipeline(renderer);previewPipeline.outputNode=fxaa(atmospheric(previewPass.mul(filteredAO.r.mul(.65).add(.35))));
 const balancedPipeline=new T.RenderPipeline(renderer);balancedPipeline.outputNode=fxaa(atmospheric(previewPass));
 const precisionTexture=textureNode(new T.Texture());
 const precisionPipeline=new T.RenderPipeline(renderer);precisionPipeline.outputNode=atmospheric(precisionTexture);
 let previewHigh=!compactTouch;
 let previewGlass=[];
 const previewGlazing=new Map(),previewBindings=[];
 function refreshGlazing(){
  previewGlazing.forEach(m=>m.dispose());previewGlazing.clear();previewBindings.length=0;
  previewGlass=[...materials.values()].filter(m=>m.transmission>0);
  for(const m of previewGlass){const p=m.clone();p.transmission=0;p.transparent=true;p.opacity=m.userData.glazingRole==='facade'?.64:.22;p.color.set(m.userData.glazingRole==='facade'?'#8cabb9':'#dce7e9');p.metalness=m.userData.glazingRole==='facade'?.32:.05;p.roughness=.065;p.side=T.DoubleSide;p.depthWrite=false;p.envMap=probeTarget.texture;p.envMapIntensity=1.15;
   if(improved){const facade=m.userData.glazingRole==='facade';p.color.set(facade?'#d6e2e4':'#edf3f3');p.metalness=0;p.ior=1.52;p.roughness=.075;p.clearcoat=1;p.clearcoatRoughness=.06;p.envMapIntensity=1.35;
    const grazing=normalWorld.dot(cameraPosition.sub(positionWorld).normalize()).abs().oneMinus().pow(5);
    p.opacityNode=grazing.mul(facade?.42:.4).add(facade?.38:.16);
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
 function refreshProbe(){const primary=scene.children.filter(o=>o.userData.primary);primary.forEach(o=>o.visible=false);try{probe.update(renderer,scene)}finally{primary.forEach(o=>o.visible=true)}}
 function updateBuilding(){
  const began=performance.now();cancelPrecision();
  scene.children.filter(o=>o.userData.primary||o.userData.interiorLight).forEach(o=>{scene.remove(o);if(o.userData.renderGlazing)o.geometry.dispose();});
  // Keep neighbourhood buffers/textures, release only resources no longer referenced.
  const usedG=new Set(),usedM=new Set(groundBake?.materials||[]);for(const originals of batchSources.values())for(const o of originals){usedG.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])usedM.add(m)}scene.traverse(o=>{if(o.geometry)usedG.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])usedM.add(m)});
  for(const [key,value] of geometries)if(!usedG.has(value)){value.dispose();geometries.delete(key)}
  for(const [key,value] of materials)if(!usedM.has(value)){value.dispose();materials.delete(key)}
  roundedProfiles.forEach(g=>g.dispose?.());roundedProfiles.clear();
  copyRoot(C.bld);copyRoot(C.interiorDressing);addInteriorLighting({scene},C);refreshGlazing();
  const usedTextures=new Set();for(const m of [...materials.values(),...(groundBake?.materials||[])])for(const value of Object.values(m))if(value?.isTexture)usedTextures.add(value);
  for(const [source,target] of textures)if(!usedTextures.has(target)){target.dispose();textures.delete(source)}
  renderer.shadowMap.needsUpdate=true;lastUpdateMs=performance.now()-began;
 }
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 window.TOWER_CINEMA={scene,camera,renderer,get captureCanvas(){return cachedPreview.style.display==='block'?cachedPreview:renderer.domElement},get tracer(){return tracer},requestPrecision,cancelPrecision,updateBuilding,pause:value=>{if(paused===value)return;paused=value;cancelPrecision()},
 appearance:value=>{cancelPrecision();improved=value;groundBake?.setEnabled(value&&C.city.visible&&C.ctx.visible);refreshGlazing();refreshProbe()},
 context:display=>{cancelPrecision();groundBake?.setEnabled(improved&&(typeof display==='boolean'?display:display.city!==false&&display.ctx!==false));scene.children.forEach(o=>{if(o.userData.context)o.visible=typeof display==='boolean'?display:display[o.userData.contextKind]!==false});refreshProbe();renderer.shadowMap.needsUpdate=true},
 quality:value=>{cancelPrecision();previewHigh=value==='high';renderer.setPixelRatio(previewHigh?(compactTouch?1:1.25):1);renderer.setSize(host.clientWidth,host.clientHeight)},
 light:()=>{cancelPrecision();sun.position.copy(C.sun.position);sun.color.setHex(daylightColor());sun.intensity=C.R3D.time==='sunset'?2:1.2;alignDaylight();refreshProbe();renderer.shadowMap.needsUpdate=true},
 background:async url=>{const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;scene.background=map;cancelPrecision()},
 whiteBalance:(r,g,b)=>{whiteBalance.value.set(r,g,b);cancelPrecision()},
 status:()=>({bake:groundBake?{receivers:groundBake.count,enabled:groundBake.enabled,loadMs:groundBake.loadMs}:null,improved,mode:precisionLoading?'preparing':precisionRequested?(tracer?._denoiser?.complete?'complete':'rendering'):'interactive',error:precisionError,samples:tracer?._lastSampleCounts,objects:scene.children.length,batchedObjects,batchBoundsDelta,materials:materials.size,firstFrameMs,lastUpdateMs,frameIntervalMs:frameIntervals.length?frameIntervals.reduce((a,b)=>a+b,0)/frameIntervals.length:null,frameMs:frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:null}),
 stop:()=>{stopped=true;cancelPrecision();window.TOWER_MODERN_ACTIVE=false;renderer.domElement.remove();cachedPreview.remove();previewGlazing.forEach(m=>m.dispose());tracer?.dispose();probeTarget.dispose();previewPipeline.dispose();balancedPipeline.dispose();precisionPipeline.dispose();previewAO.dispose();previewPass.dispose();renderer.dispose()}};
 function frame(){if(!window.TOWER_MODERN_ACTIVE)return;requestAnimationFrame(frame);if(paused)return;const w=host.clientWidth,h=host.clientHeight;if(lastW!==w||lastH!==h){invalidatePresentation();lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();tracer?.updateCamera()}
  const next=C.camera.position.toArray().concat(C.camera.quaternion.toArray(),[C.camera.fov,C.camera.near]).map(v=>v.toFixed(5)).join(',');if(next!==signature){cancelPrecision();lastMotion=performance.now();signature=next;whiteBalance.value.set(...(C.cafeMode?[1.045,1,.955]:[.97,1,1.025]));camera.position.copy(C.camera.position);camera.quaternion.copy(C.camera.quaternion);camera.fov=C.camera.fov;camera.near=C.camera.near;camera.updateProjectionMatrix();camera.updateMatrixWorld();tracer?.updateCamera()}
  // Keep stochastic grain off screen during movement and convergence.
  // Both views share geometry, camera and environment; moving glass is an alpha approximation.
  try{
    if(gpuError)throw gpuError;
    if(!precisionRequested){if(!previewCached){const began=performance.now();if(lastDrawAt&&began-lastDrawAt<200){frameIntervals.push(began-lastDrawAt);if(frameIntervals.length>120)frameIntervals.shift();}lastDrawAt=began;renderPreview();frameTimes.push(performance.now()-began);if(frameTimes.length>120)frameTimes.shift();if(firstFrameMs===null)firstFrameMs=performance.now()-bootAt;previewCached=true;}return;}
    if(presented&&tracer._denoiser?.complete)return;
    if(performance.now()-lastMotion>200)tracer.renderSample();
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
 if(cafe){for(const x of [-10,-5])for(const z of [-7,0,5]){if(!C.inPoly([x*41.6+914,z*41.6+770],C.levels().find(l=>l.kind==='ground').poly))continue;const a=new T.RectAreaLight(0xffedda,2.5,3,3);a.position.set(x,cafe.ceiling-.12,z);a.lookAt(x,cafe.floor,z);a.userData.interiorLight=true;state.scene.add(a);}
 const bounce=new T.RectAreaLight(0xffdfb6,.7,8,12);bounce.position.set(-6,cafe.floor+.1,-2);bounce.lookAt(-6,cafe.ceiling,-2);bounce.userData.interiorLight=true;state.scene.add(bounce);
 const windowFill=new T.RectAreaLight(0xe4efff,2,16,3.5);windowFill.position.set(-12.5,2.4,-1);windowFill.lookAt(-3,2.4,-1);windowFill.userData.interiorLight=true;state.scene.add(windowFill);}
 state.tracer?.updateLights();
}
