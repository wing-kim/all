import assert from 'node:assert/strict';
import {equirectDirection} from './cube-equirect.js';
// three 등장방형 규약: u=atan(z,x)/2π+0.5, v=asin(y)/π+0.5. 역변환이 정확히 되돌아오는지 확인.
for(const [u,v] of [[.5,.5],[.25,.8],[.9,.1],[.62,.97],[.01,.5]]){
 const [x,y,z]=equirectDirection(u,v);assert.ok(Math.abs(Math.hypot(x,y,z)-1)<1e-12);
 assert.ok(Math.abs(Math.asin(y)/Math.PI+.5-v)<1e-12);
 if(Math.abs(y)<.999){const back=Math.atan2(z,x)/(2*Math.PI)+.5;assert.ok(Math.abs(((back-u+1.5)%1)-.5)<1e-12)}
}
assert.deepEqual(equirectDirection(.5,1).map(v=>Math.round(v*1e9)/1e9),[0,1,0],'top row is the zenith');
console.log('cube to equirect: inverse of three equirect mapping (zenith on top) passed');
