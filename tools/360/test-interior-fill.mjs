// 실내 간접광 범위: 평면이 같은 층은 하나로 묶고, 높이 범위는 바닥판 위~위층 바닥판 아랫면까지 포함한다.
import assert from 'node:assert/strict';
import { interiorZones } from './interior-fill.js';

const square=[[0,0],[10,0],[10,10],[0,10]],core=[[0,0],[6,0],[6,6],[0,6]];
const levels=[
 {kind:'ground',y:0,h:5,poly:square},
 {kind:'upper',y:5,h:3.6,poly:square},
 {kind:'upper',y:8.6,h:3.6,poly:square},
 {kind:'upper',y:12.2,h:3.2,poly:core},
 {kind:'base',y:-4,h:4,poly:square},
];
const C={levels:()=>levels,P:(x,z)=>[x-5,z-5],floorTop:l=>l.y+.2,ceilOf:l=>l.y+l.h-.6};
const zones=interiorZones(C);

assert.equal(zones.upper.length,2,'평면이 같은 2F·3F는 한 구역');
assert.equal(zones.base.length,1);
assert.deepEqual(zones.upper[0].poly[0],[-5,-5],'월드 좌표로 변환');
assert.equal(zones.upper[0].spans.length,2);
const [y0,y1]=zones.upper[0].spans[0];
assert.ok(Math.abs(y0-5.15)<1e-9,'바닥판 윗면 바로 아래부터');
assert.ok(Math.abs(y1-8.65)<1e-9,'천장 마감이 낮아도 위층 바닥판 아랫면까지');
assert.ok(!zones.upper.some(z=>z.spans.some(([a])=>a<1)),'1층(카페 베이크)은 제외');
console.log('interior fill zones ok');
