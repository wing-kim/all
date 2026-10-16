import assert from 'node:assert/strict';
import * as T from 'three';
import {bindSourceVisibility,sourceVisible,syncCopiedVisibility} from './source-visibility.js';

const authored=new T.Group(),first=new T.Group(),third=new T.Group();authored.add(first,third);
const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial();
const lower=new T.Mesh(geometry,material),lowerCeiling=new T.Mesh(geometry,material),upper=new T.Mesh(geometry,material),upperCeiling=new T.Mesh(geometry,material);
first.add(lower,lowerCeiling);third.add(upper,upperCeiling);
const furniture=new T.Mesh(geometry,material);furniture.position.y=12;authored.add(furniture);
const scene=new T.Scene();
for(const source of [lower,lowerCeiling,upper,upperCeiling,furniture]){
 const copy=new T.Mesh(geometry,material);bindSourceVisibility(copy,source);copy.userData.interiorDressing=source===furniture;scene.add(copy);
}
const C={dollMode:false,interiorFloorKey:'1F',levels:()=>[{key:'1F'},{key:'3F'}],ceilOf:level=>level.key==='1F'?5:15};
const renderer={shadowMap:{needsUpdate:false}};
const visibility=()=>scene.children.map(object=>object.visible);
assert.equal(sourceVisible(lower),true);
assert.equal(scene.children[0].clone(false).sourceVisibilityObject,undefined,'precision clones do not serialize the source scene');
assert.equal(syncCopiedVisibility(T,scene,C,renderer),0);
assert.deepEqual(visibility(),[true,true,true,true,true]);

function originalDoll(key){
 C.dollMode=true;C.interiorFloorKey=key;
 first.visible=true;third.visible=key==='3F';lowerCeiling.visible=key!=='1F';upperCeiling.visible=false;
}
originalDoll('1F');renderer.shadowMap.needsUpdate=false;
assert.equal(syncCopiedVisibility(T,scene,C,renderer),4);
assert.deepEqual(visibility(),[true,false,false,false,false]);
assert.equal(renderer.shadowMap.needsUpdate,true);
originalDoll('3F');
assert.deepEqual(syncCopiedVisibility(T,scene,C,renderer)>0,true);
assert.deepEqual(visibility(),[true,true,true,false,true]);
C.dollMode=false;first.visible=third.visible=lowerCeiling.visible=upperCeiling.visible=true;
syncCopiedVisibility(T,scene,C,renderer);
assert.deepEqual(visibility(),[true,true,true,true,true],'walk mode restores every source mesh');
assert.equal(scene.children.every(object=>object.geometry===geometry),true,'visibility changes never rebuild geometry');
const outdoorSource=new T.Mesh(geometry,material),outdoorScene=new T.Scene(),outdoorCopy=new T.Mesh(geometry,material),outdoorBatch=new T.Mesh(geometry,material);
bindSourceVisibility(outdoorCopy,outdoorSource);outdoorCopy.userData.outdoorEnhancement=true;outdoorBatch.userData.outdoorEnhancement=true;
outdoorScene.add(outdoorCopy,outdoorBatch);
C.levels=()=>[{key:'B1',kind:'base'}];C.ceilOf=()=>0;C.dollMode=true;C.interiorFloorKey='B1';
syncCopiedVisibility(T,outdoorScene,C,renderer);
assert.deepEqual(outdoorScene.children.map(object=>object.visible),[false,false],'basement doll hides both copied and batched outdoor additions');
C.dollMode=false;syncCopiedVisibility(T,outdoorScene,C,renderer);
assert.deepEqual(outdoorScene.children.map(object=>object.visible),[true,true],'outdoor additions return on exit');
console.log('source visibility: floor, dollhouse, core and walk transitions passed');
