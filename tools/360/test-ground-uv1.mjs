// 지면 베이크 UV1: 월드 xz를 ±extent 범위에 맞추고, 원본 기하는 건드리지 않는다(교체된 지면 재연결에도 같은 함수 사용).
import assert from 'node:assert/strict';
import * as T from 'three';
import { withGroundUV1 } from './baked-ground.js';

const source=new T.PlaneGeometry(20,20).rotateX(-Math.PI/2),matrix=new T.Matrix4().makeTranslation(10,0,-5);
const g=withGroundUV1(T,source,matrix,100);
assert.notEqual(g,source,'복제본을 돌려준다');
assert.equal(source.attributes.uv1,undefined,'원본 기하에는 UV1을 붙이지 않는다');
const p=g.attributes.position,uv=g.attributes.uv1,point=new T.Vector3();
for(let i=0;i<p.count;i++){
 point.fromBufferAttribute(p,i).applyMatrix4(matrix);
 assert.ok(Math.abs(uv.getX(i)-(point.x+100)/200)<1e-6);
 assert.ok(Math.abs(uv.getY(i)-(point.z+100)/200)<1e-6);
}
console.log('ground uv1 ok');
