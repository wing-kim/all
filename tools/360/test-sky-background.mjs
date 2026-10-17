import assert from 'node:assert/strict';
import {createSourceSky} from './sky-background.js';

let captures=0,disposed=0;
class Scene{add(object){this.child=object}}
class CubeRenderTarget{constructor(size){this.size=size;this.texture={source:'source-sky'}}dispose(){disposed++}}
class CubeCamera{constructor(near,far,target){this.target=target}update(renderer,scene){assert.ok(scene.child.isSkyMesh);captures++}}
const sky=createSourceSky({Scene,CubeRenderTarget,CubeCamera,HalfFloatType:1},{});
const day={night:false,direction:[.2,.8,-.4]};
assert.equal(sky.update(day).source,'source-sky');assert.equal(captures,1);
const direction=sky.status().lastSunDirection,scale=Math.hypot(...day.direction);
for(let i=0;i<3;i++)assert.ok(Math.abs(direction[i]-day.direction[i]/scale)<1e-10);
assert.equal(sky.update({night:true,direction:[0,1,0]}),null);assert.equal(captures,1,'night does not recapture a fake sun');
assert.equal(sky.status().captures,1);sky.dispose();assert.equal(disposed,1);
console.log('source sky: cached capture follows sun direction, night skips capture, resources disposed');
