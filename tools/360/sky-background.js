import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

// Capture the analytic atmosphere only when source daylight changes. Navigation
// samples the cube texture without rerunning the cloud shader.
export function createSourceSky(T,renderer){
 const scene=new T.Scene(),sky=new SkyMesh();sky.scale.setScalar(10000);
 sky.turbidity.value=3.2;sky.rayleigh.value=1.7;sky.mieCoefficient.value=.005;
 sky.cloudCoverage.value=.32;sky.cloudDensity.value=.36;sky.cloudSpeed.value=0;
 scene.add(sky);
 const target=new T.CubeRenderTarget(256,{type:T.HalfFloatType});
 const camera=new T.CubeCamera(.1,1000,target);
 let captures=0,lastCaptureMs=0,lastSunDirection=null;
 return {
  update(daylight){
   if(daylight.night)return null;
   sky.sunPosition.value.set(...daylight.direction).normalize().multiplyScalar(450000);lastSunDirection=sky.sunPosition.value.clone().normalize().toArray();
   const began=performance.now();camera.update(renderer,scene);lastCaptureMs=performance.now()-began;captures++;
   return target.texture;
  },
  status:()=>({captures,lastCaptureMs,resolution:256,lastSunDirection}),
  dispose(){target.dispose();sky.geometry.dispose();sky.material.dispose()}
 };
}
