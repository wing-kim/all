import * as T from 'three/webgpu';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { WebGPUPathTracer, OIDNDenoiser } from 'three-gpu-pathtracer/webgpu';
import { initUNetFromURL } from 'oidn-web';
// Guide buffers contain albedo and normals, so refraction passes are unnecessary here.
// Disable them for this pass to avoid stale transmission targets after viewport resizing.
class StableGuideDenoiser extends OIDNDenoiser {
 _renderAuxiliaryBuffers(width,height){
  const saved=new Map();this.scene.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){if(m.transmission>0&&!saved.has(m)){saved.set(m,m.transmission);m.transmission=0;m.needsUpdate=true;}}});
  try{return super._renderAuxiliaryBuffers(width,height)}finally{for(const [m,value] of saved){m.transmission=value;m.needsUpdate=true}}
 }
}
export async function start(C){
 T.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(C.camera.fov,C.camera.aspect,2,1800);
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('WebGPU adapter unavailable');
 const limit=512*1024*1024;
 const renderer=new T.WebGPURenderer({antialias:true,powerPreference:'high-performance',requiredLimits:{maxStorageBufferBindingSize:Math.min(limit,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(limit,adapter.limits.maxBufferSize)}});renderer.setPixelRatio(1.25);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;await renderer.init();
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
  if(glass){n.color.set('#e2edef');n.transmission=1;n.opacity=1;n.transparent=false;n.metalness=0;n.roughness=.045;n.ior=1.46;n.thickness=0;n.side=T.DoubleSide;}
  materials.set(m,n);return n;
 }
 function geometry(g){if(geometries.has(g))return geometries.get(g);const n=new T.BufferGeometry();for(const k of ['position','normal','uv','uv2','color']){const a=g.attributes[k];if(a&&!a.isInterleavedBufferAttribute)n.setAttribute(k==='uv2'?'uv1':k,new T.BufferAttribute(a.array,a.itemSize,a.normalized));}if(g.index)n.setIndex(new T.BufferAttribute(g.index.array,1));n.groups=g.groups.map(x=>({...x}));geometries.set(g,n);return n}
 C.scene.updateMatrixWorld(true);
 C.scene.traverse(o=>{for(let p=o;p;p=p.parent){if(!p.visible&&!p.userData.box)return;}if(!o.isMesh||o===C.R3D.sky||o.material?.isShaderMaterial)return;const m=Array.isArray(o.material)?o.material.map(material):material(o.material),g=geometry(o.geometry);let n;if(o.isInstancedMesh){n=new T.InstancedMesh(g,m,o.count);n.instanceMatrix.array.set(o.instanceMatrix.array.subarray(0,o.count*16));n.instanceMatrix.needsUpdate=true;if(o.instanceColor)n.instanceColor=new T.InstancedBufferAttribute(o.instanceColor.array.subarray(0,o.count*3),3)}else n=new T.Mesh(g,m);n.matrix.copy(o.matrixWorld);n.matrixAutoUpdate=false;n.castShadow=o.castShadow;n.receiveShadow=true;for(let p=o;p;p=p.parent){if(p===C.city||p===C.ctx)n.userData.context=true;if(p===C.bld)n.userData.primary=true;}scene.add(n)});
 const hdr=await new HDRLoader().loadAsync('360/assets/daylight-sky_2k.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.environment=hdr;scene.background=hdr;scene.environmentIntensity=1.1;
 const sun=new T.DirectionalLight(0xfff3dd,3.2);sun.position.copy(C.sun.position);sun.target.position.copy(C.sun.target.position);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:300});sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
 // Keep moving-preview glass reflections tied to the actual surrounding scene.
 // Path tracing continues to use geometric reflections and the original lighting HDR.
 const probeTarget=new T.CubeRenderTarget(256,{type:T.HalfFloatType});
 const probe=new T.CubeCamera(.5,1500,probeTarget);probe.position.set(-3,18,0);
 const primary=scene.children.filter(o=>o.userData.primary);primary.forEach(o=>o.visible=false);
 try {probe.update(renderer,scene);for(const m of materials.values())if(m.transmission>0){m.envMap=probeTarget.texture;m.envMapIntensity=1;m.needsUpdate=true;}}
 finally {primary.forEach(o=>o.visible=true);}
 const tracer=new WebGPUPathTracer(renderer);tracer.maxBounces=8;tracer.maxTransparentBounces=12;tracer.frameBudget=150000;tracer.lowResScale=.25;tracer.renderDelay=350;tracer.maxSamples=parent.innerWidth<=850?32:48;tracer.renderScale=parent.innerWidth<=850?.8:1;addInteriorLighting({scene,tracer},C);tracer.setScene(scene,camera);tracer.setDenoiser(new StableGuideDenoiser({initUNetFromURL,auxWeightsUrl:"360/assets/rt_hdr_alb_nrm_small.tza",maxTileSize:256}));
 let lastW=host.clientWidth,lastH=host.clientHeight,lastMotion=performance.now(),signature='';host.appendChild(renderer.domElement);window.TOWER_MODERN_ACTIVE=true;
 window.TOWER_CINEMA={scene,camera,renderer,tracer,context:show=>{scene.children.forEach(o=>{if(o.userData.context)o.visible=show});tracer.setScene(scene,camera)},quality:value=>{tracer.maxSamples=value==='high'?64:32;tracer.renderScale=value==='high'?1:.8;tracer.reset()},light:()=>{sun.position.copy(C.sun.position);sun.color.copy(C.sun.color);sun.intensity=C.R3D.time==='sunset'?2:3.2;tracer.updateLights()},background:async url=>{const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;scene.background=map;tracer.updateEnvironment()},status:()=>({samples:tracer._lastSampleCounts,objects:scene.children.length,materials:materials.size}),stop:()=>{window.TOWER_MODERN_ACTIVE=false;renderer.domElement.remove();tracer.dispose();probeTarget.dispose();renderer.dispose()}};
 function frame(){if(!window.TOWER_MODERN_ACTIVE)return;requestAnimationFrame(frame);const w=host.clientWidth,h=host.clientHeight;if(lastW!==w||lastH!==h){lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();tracer.updateCamera()}
  const next=C.camera.position.toArray().concat(C.camera.quaternion.toArray()).map(v=>v.toFixed(5)).join(',');if(next!==signature){lastMotion=performance.now();signature=next;camera.position.copy(C.camera.position);camera.quaternion.copy(C.camera.quaternion);camera.updateMatrixWorld();tracer.updateCamera()}
  // Keep stochastic grain off screen during movement and convergence.
  // Both views use the same meshes, materials, camera and environment.
  try{
    if(gpuError)throw gpuError;
    if(performance.now()-lastMotion>200)tracer.renderSample();
    if(performance.now()-lastMotion<=200||!tracer._denoiser?.complete)renderer.render(scene,camera);
  }catch(error){console.warn('Precision renderer stopped; restoring realtime view',error);window.TOWER_CINEMA_FAILURE=true;window.TOWER_CINEMA.stop();window.TOWER_CINEMA=null;}

 }frame();
 const countTimer=setInterval(()=>{if(!window.TOWER_MODERN_ACTIVE){clearInterval(countTimer);return}tracer.getSampleCountsAsync().catch(()=>{})},1500);return window.TOWER_CINEMA;
}
export async function changeBackdrop(state,url){const map=await new HDRLoader().loadAsync(url);map.mapping=T.EquirectangularReflectionMapping;state.scene.background=map;state.tracer.updateEnvironment();}
export function addInteriorLighting(state,C){
 for(const l of C.levels().filter(l=>l.kind==='upper'||l.kind==='ground')){
  const light=new T.RectAreaLight(0xffdfae,120,2.2,.18);light.position.set(-7,l.y+l.h-.45,1);light.lookAt(-7,l.y,1);state.scene.add(light);
 }
 state.tracer.updateLights();
}
