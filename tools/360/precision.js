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

export function createTracer(renderer,scene,camera,compactTouch){
 const tracer=new WebGPUPathTracer(renderer);tracer.maxBounces=8;tracer.maxTransparentBounces=12;tracer.frameBudget=150000;tracer.lowResScale=.25;tracer.renderDelay=0;tracer.maxSamples=compactTouch?32:64;tracer.renderScale=compactTouch?.8:1;tracer.setScene(scene,camera);tracer.setDenoiser(new StableGuideDenoiser({initUNetFromURL,auxWeightsUrl:compactTouch?"360/assets/rt_hdr_alb_nrm_small.tza":"360/assets/rt_hdr_alb_nrm.tza",maxTileSize:256}));return tracer;
}
