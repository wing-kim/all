import assert from 'node:assert/strict';
import * as T from 'three/webgpu';
import {createSectionClip} from './section-clip.js';

const scene=new T.Scene(),a=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial()),b=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());
a.userData.context=true;b.position.set(3,0,0);const sun=new T.DirectionalLight();scene.add(a,b,sun);
const clip=createSectionClip(T,scene);
assert.equal(clip.active,false);assert.equal(clip.objects().length,3);
// 원본 secBtn과 같은 평면(0,0,-1,zc): 조명 외 객체만 ClippingGroup 아래로, 월드 위치 유지.
assert.equal(clip.set([[0,0,-1,6.78]]),true);assert.equal(clip.set([[0,0,-1,6.78]]),false,'same planes are ignored');
assert.equal(a.parent,clip.group);assert.equal(b.parent,clip.group);assert.equal(sun.parent,scene);
assert.equal(clip.group.clippingPlanes.length,1);assert.deepEqual(clip.planes,[[0,0,-1,6.78]]);
b.updateMatrixWorld(true);assert.deepEqual(new T.Vector3().setFromMatrixPosition(b.matrixWorld).toArray(),[3,0,0]);
assert.ok(clip.objects().includes(a)&&clip.objects().includes(sun)&&!clip.objects().includes(clip.group),'objects() lists wrapped and direct children');
// 건물 재생성: suspend 동안 장면 직계로 돌아오고 새 복사본도 resume 때 감싸진다.
clip.suspend();assert.equal(a.parent,scene);assert.equal(clip.group.parent,null);
const c=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());scene.add(c);clip.resume();assert.equal(c.parent,clip.group);
// 해제: 모두 장면 직계로, 그룹 제거.
assert.equal(clip.set([]),true);assert.equal(clip.active,false);assert.equal(a.parent,scene);assert.equal(c.parent,scene);assert.equal(clip.group.parent,null);
assert.equal(scene.children.filter(o=>o.isMesh).length,3);
console.log('section clip: original planes wrap non-light objects, rebuild suspend/resume, release restores the scene graph.');
