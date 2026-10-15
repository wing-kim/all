import { copyRoundedMullions } from './curtain-wall.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { copyGeometry } from './geometry-copy.js';
import * as T from 'three/webgpu';
import { pass, texture as textureNode, vec4, mix, saturation, uniform, viewportOpaqueMipTexture } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { WebGPUPathTracer, OIDNDenoiser } from 'three-gpu-pathtracer/webgpu';
import { initUNetFromURL } from 'oidn-web';
// For thin clear glazing, guide the denoiser with the first opaque surface behind it.
// Opaque-glass guides flatten every interior edge to the curtain wall and smear furniture.
// This only affects auxiliary albedo/normal buffers; beauty rays still see all glazing.
class StableGuideDenoiser extends OIDNDenoiser {
 _copyOutputToTexture(output,width,height){super._copyOutputToTexture(output,width,height);if(this._rawTexture)this._rawTexture.label=`tower-denoised-${width}x${height}`;}
 _renderAuxiliaryBuffers(width,height){
  const materials=new Map(),visibility=new Map();
  this.scene.traverse(o=>{
   const list=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
   if(list.length&&list.every(m=>(materials.get(m)??m.transmission)>.9&&m.thickness===0)){visibility.set(o,o.visible);o.visible=false;}
   for(const m of list)if(m.transmission>0&&!materials.has(m)){materials.set(m,m.transmission);m.transmission=0;m.needsUpdate=true;}
  });
  try{return super._renderAuxiliaryBuffers(width,height)}finally{
   for(const [m,value] of materials){m.transmission=value;m.needsUpdate=true;}
   for(const [o,visible] of visibility)o.visible=visible;
  }
 }
}
export async function start(C){
 const compactTouch=parent.innerWidth<=850&&matchMedia('(pointer: coarse)').matches;
 T.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(C.camera.fov,C.camera.aspect,2,1800);
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('WebGPU adapter unavailable');
 const limit=512*1024*1024;
 const renderer=new T.WebGPURenderer({antialias:true,powerPreference:'high-performance',requiredLimits:{maxStorageBufferBindingSize:Math.min(limit,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(limit,adapter.limits.maxBufferSize)}});renderer.setPixelRatio(1.25);renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.4;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;await renderer.init();
 let gpuError=null;renderer.backend.device?.addEventListener('uncapturederror',event=>{event.preventDefault();if(!gpuError){gpuError=event.error;console.warn('Precision GPU validation failure',gpuError.message)}});
 renderer.backend.device?.lost.then(info=>{if(info.reason!=='destroyed')gpuError=new Error(info.message||'GPU device lost')});
 const host=C.renderer.domElement.parentElement;renderer.setSize(host.clientWidth,host.clientHeight);Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'2'});
 const materials=new Map(),geometries=new Map(),textures=new Map();
 function texture(t){if(!t)return null;if(textures.has(t))return textures.get(t);const n=new T.Texture(t.image);n.wrapS=t.wrapS;n.wrapT=t.wrapT;n.repeat.copy(t.repeat);n.offset.copy(t.offset);n.rotation=t.rotation;n.flipY=t.flipY;n.colorSpace=t.encoding===3001?T.SRGBColorSpace:T.NoColorSpace;n.anisotropy=4;n.needsUpdate=true;textures.set(t,n);return n}
 function material(m){if(materials.has(m))return materials.get(m);
  const glass=m===C.M.glass||m===C.M.glass1||m===C.M.door||m===C.M.guard||m===C.M.rail;
  const n=new T.MeshPhysicalMaterial({color:m.color?.clone()||new T.Color(.5,.5,.5),roughness:m.roughness??.7,metalness:m.metalness??0,side:m.side,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest||0});
  ['map','normalMap','roughnessMap','metalnessMap','bumpMap','emissiveMap','alphaMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap'].forEach(k=>n[k]=texture(m[k]));if(m.normalScale)n.normalScale.copy(m.normalScale);n.bumpScale=m.bumpScale||.01;if(m.emissive)n.emissive.copy(m.emissive);n.emissiveIntensity=m.emissiveIntensity||0;
  n.clearcoat=m.clearcoat||0;n.clearcoatRoughness=m.clearcoatRoughness||0;
  if(m.userData?.satinMetal){n.anisotropy=.32;n.clearcoat=.12;n.clearcoatRoughness=.28;}
  if(glass){n.color.set('#f3f9fc');n.transmission=1;n.opacity=1;n.transparent=false;n.metalness=0;n.roughness=.045;n.ior=1.46;n.thickness=0;n.side=T.DoubleSide;}
  // Appearance approximation for reflective facade glazing; not measured product optics.
  if(m===C.M.glass){n.metalness=.26;n.roughness=.035;}
  if(glass)n.userData.glazingRole=m===C.M.glass?'facade':m===C.M.glass1?'ground':'clear';
  materials.set(m,n);return n;
 }
 function geometry(g){if(geometries.has(g))return geometries.get(g);const n=copyGeometry(T,g);geometries.set(g,n);return n}
 C.scene.updateMatrixWorld(true);
 const roundedProfiles=new Map();
 C.scene.traverse(o=>{
  for(let p=o;p;p=p.parent)if(!p.visible&&!p.userData.box)return;
  if(!o.isMesh||o===C.R3D.sky||o.material?.isShaderMaterial)return;
  const m=Array.isArray(o.material)?o.material.map(material):material(o.material);
  let copies=o.isInstancedMesh&&o.userData.roundedCurtainWall?copyRoundedMullions(T,RoundedBoxGeometry,o,m,roundedProfiles):null;
  if(!copies){
   const g=geometry(o.geometry);let n;
   if(o.isInstancedMesh){n=new T.InstancedMesh(g,m,o.count);n.instanceMatrix.array.set(o.instanceMatrix.array.subarray(0,o.count*16));n.instanceMatrix.needsUpdate=true;if(o.instanceColor)n.instanceColor=new T.InstancedBufferAttribute(o.instanceColor.array.subarray(0,o.count*3),3)}
   else n=new T.Mesh(g,m);
   n.matrix.copy(o.matrixWorld);n.matrixAutoUpdate=false;n.castShadow=o.castShadow;n.receiveShadow=true;copies=[n];
  }
  for(const n of copies){for(let p=o;p;p=p.parent){if(p===C.city||p===C.ctx)n.userData.context=true;if(p===C.bld)n.userData.primary=true;}scene.add(n)}
 });
 const hdr=await new HDRLoader().loadAsync('360/assets/clear-noon-sky_2k.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.environment=hdr;scene.background=hdr;scene.environmentIntensity=1;scene.backgroundIntensity=1.55;
 const daylightColor=()=>C.R3D.time==='sunset'?C.sun.color.getHex():C.R3D.time==='am'?0xfff4e6:0xfff3dd;
 const sun=new T.DirectionalLight(daylightColor(),C.R3D.time==='sunset'?2:3.7);sun.position.copy(C.sun.position);sun.target.position.copy(C.sun.target.position);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:300});sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
 // Keep moving-preview glass reflections tied to the actual surrounding scene.
 // Path tracing continues to use geometric reflections and the original lighting HDR.
 const probeTarget=new T.CubeRenderTarget(256,{type:T.HalfFloatType});
 const probe=new T.CubeCamera(.5,1500,probeTarget);probe.position.set(-3,18,0);
 const primary=scene.children.filter(o=>o.userData.primary);primary.forEach(o=>o.visible=false);
 try {probe.update(renderer,scene);for(const m of materials.values())if(m.transmission>0){m.envMap=probeTarget.texture;m.envMapIntensity=1;m.needsUpdate=true;}}
 finally {primary.forEach(o=>o.visible=true);}
 const tracer=new WebGPUPathTracer(renderer);tracer.maxBounces=8;tracer.maxTransparentBounces=12;tracer.frameBudget=150000;tracer.lowResScale=.25;tracer.renderDelay=350;tracer.maxSamples=compactTouch?32:64;tracer.renderScale=compactTouch?.8:1;addInteriorLighting({scene,tracer},C);tracer.setScene(scene,camera);tracer.setDenoiser(new StableGuideDenoiser({initUNetFromURL,auxWeightsUrl:compactTouch?"360/assets/rt_hdr_alb_nrm_small.tza":"360/assets/rt_hdr_alb_nrm.tza",maxTileSize:256}));
 const previewPass=pass(scene,camera,{samples:0}),previewAO=ao(previewPass.getTextureNode('depth'),null,camera);
 previewPass.renderTarget.texture.name='tower-preview-color';
 previewAO.resolutionScale=.5;previewAO.radius.value=1;previewAO.thickness.value=.4;
 const filteredAO=denoise(previewAO.getTextureNode(),previewPass.getTextureNode('depth'),null,camera);
 // Depth-based aerial perspective, shared by moving and converged frames.
 // Protect the nearby architecture and leave the photographic sky untouched.
 const haze=previewPass.getViewZNode().negate().sub(100).max(0).mul(-.0006).exp().oneMinus().min(.3).mul(previewPass.getTextureNode('depth').lessThan(.999999));
 const hazeColor=new T.Color('#bdcbd5');
 const whiteBalance=uniform(new T.Vector3(.93,1.015,1.03));
 const atmospheric=node=>vec4(saturation(mix(node.rgb,hazeColor,haze).mul(whiteBalance),1.12),node.a);
 const previewPipeline=new T.RenderPipeline(renderer);previewPipeline.outputNode=fxaa(atmospheric(previewPass.mul(filteredAO.r.mul(.65).add(.35))));
 const balancedPipeline=new T.RenderPipeline(renderer);balancedPipeline.outputNode=fxaa(atmospheric(previewPass));
 const precisionTexture=textureNode(new T.Texture());
 const precisionPipeline=new T.RenderPipeline(renderer);precisionPipeline.outputNode=atmospheric(precisionTexture);
 let previewHigh=!compactTouch;
 const previewGlass=new Map([...materials.values()].filter(m=>m.transmission>0).map(m=>[m,m.color.clone()]));
 const transmissionViewport=viewportOpaqueMipTexture(),previewSize=new T.Vector2();let transmissionRevision=0;
 function prepareTransmissionViewport(){
  renderer.getDrawingBufferSize(previewSize);previewPass.setSize(previewSize.x,previewSize.y);
  const target=previewPass.renderTarget,t=transmissionViewport.getTextureForReference(target);
  t.name='tower-transmission-front';
  if(t.image.width!==target.width||t.image.height!==target.height){
   t.dispose();t.image.width=target.width;t.image.height=target.height;t.type=target.texture.type;t.generateMipmaps=true;t.needsUpdate=true;
   // Allocate before encoding the scene; resizing during transmission otherwise invalidates bindings.
   renderer.initTexture(t);transmissionRevision++;for(const m of previewGlass.keys()){m.customProgramCacheKey=()=>`tower-transmission-${transmissionRevision}`;m.needsUpdate=true;}
  }
 }
 function renderPreview(){
  prepareTransmissionViewport();
  // Raster refraction lacks the interior light loss computed by path tracing.
  // Compensate only during this draw; authored and traced materials stay unchanged.
  for(const [m,color] of previewGlass)m.color.copy(color).multiplyScalar(.55);
  try{if(previewHigh)previewPipeline.render();else balancedPipeline.render()}finally{for(const [m,color] of previewGlass)m.color.copy(color)}
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
 window.TOWER_CINEMA={scene,camera,renderer,tracer,context:show=>{invalidatePresentation();scene.children.forEach(o=>{if(o.userData.context)o.visible=show});tracer.setScene(scene,camera)},quality:value=>{invalidatePresentation();previewHigh=value==='high';tracer.maxSamples=value==='high'?64:32;tracer.renderScale=value==='high'?1:.8;tracer.reset()},light:()=>{invalidatePresentation();sun.position.copy(C.sun.position);sun.color.setHex(daylightColor());sun.intensity=C.R3D.time==='sunset'?2:3.7;tracer.updateLights()},background:async url=>{const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;scene.background=map;invalidatePresentation();tracer.updateEnvironment()},whiteBalance:(r,g,b)=>{whiteBalance.value.set(r,g,b);invalidatePresentation()},status:()=>({samples:tracer._lastSampleCounts,objects:scene.children.length,materials:materials.size}),stop:()=>{window.TOWER_MODERN_ACTIVE=false;renderer.domElement.remove();cachedPreview.remove();tracer.dispose();probeTarget.dispose();previewPipeline.dispose();balancedPipeline.dispose();precisionPipeline.dispose();previewAO.dispose();previewPass.dispose();renderer.dispose()}};
 function frame(){if(!window.TOWER_MODERN_ACTIVE)return;requestAnimationFrame(frame);const w=host.clientWidth,h=host.clientHeight;if(lastW!==w||lastH!==h){invalidatePresentation();lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();tracer.updateCamera()}
  const next=C.camera.position.toArray().concat(C.camera.quaternion.toArray()).map(v=>v.toFixed(5)).join(',');if(next!==signature){invalidatePresentation();lastMotion=performance.now();signature=next;camera.position.copy(C.camera.position);camera.quaternion.copy(C.camera.quaternion);camera.updateMatrixWorld();tracer.updateCamera()}
  // Keep stochastic grain off screen during movement and convergence.
  // Both views use the same meshes, materials, camera and environment.
  try{
    if(gpuError)throw gpuError;
    if(presented&&tracer._denoiser?.complete)return;
    if(performance.now()-lastMotion>200)tracer.renderSample();
    if(performance.now()-lastMotion<=200)renderPreview();
    else if(!tracer._denoiser?.complete){if(!previewCached)cachePreview();}
    else if(tracer._denoiser.texture){cachedPreview.style.display='none';if(precisionTexture.value!==tracer._denoiser.texture){precisionTexture.value=tracer._denoiser.texture;precisionPipeline.needsUpdate=true;}precisionPipeline.render();presented=true;}
  }catch(error){console.warn('Precision renderer stopped; restoring realtime view',error);window.TOWER_CINEMA_FAILURE=true;window.TOWER_CINEMA_FAILURE_REASON=String(error?.message||error);window.TOWER_CINEMA.stop();window.TOWER_CINEMA=null;}

 }frame();
 const countTimer=setInterval(()=>{if(!window.TOWER_MODERN_ACTIVE){clearInterval(countTimer);return}tracer.getSampleCountsAsync().catch(()=>{})},1500);return window.TOWER_CINEMA;
}
export async function changeBackdrop(state,url){const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;state.scene.background=map;state.tracer.updateEnvironment();}
export function addInteriorLighting(state,C){
 for(const l of C.levels().filter(l=>l.kind==='upper'||l.kind==='ground')){
  // Distribute soft interior light across the glazed frontage, rather than
  // leaving one bright central patch per floor. Fixture positions remain inside the plan.
  const positions=[[-9.5,-7],[-9.5,0],[-9.5,6]].filter(([x,z])=>C.inPoly([x*41.6+914,z*41.6+770],l.poly));
  for(const [x,z] of positions){const light=new T.RectAreaLight(0xffe8ce,(l.kind==='ground'?240:180)/positions.length,2.2,.18);light.position.set(x,l.y+l.h-.45,z);light.lookAt(x,l.y,z);state.scene.add(light);}
 }
 state.tracer.updateLights();
}
