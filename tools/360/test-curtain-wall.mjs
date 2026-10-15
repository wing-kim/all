import assert from 'node:assert/strict';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {copyRoundedMullions} from './curtain-wall.js';
const source=new T.InstancedMesh(new T.BoxGeometry(.07,1,.14),new T.MeshStandardMaterial(),3);
const matrix=new T.Matrix4(),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.4);
for(let i=0;i<3;i++)source.setMatrixAt(i,matrix.compose(new T.Vector3(i,4,2),q,new T.Vector3(1,i===1?4.2:3.82,1)));
source.position.set(2,0,-3);source.updateMatrixWorld();const original=source.instanceMatrix.array.slice();
const copies=copyRoundedMullions(T,RoundedBoxGeometry,source,source.material);
assert.equal(copies.length,2);assert.equal(copies.reduce((n,o)=>n+o.count,0),3);
source.geometry.computeBoundingBox();let maxDelta=0;
for(const mesh of copies){mesh.geometry.computeBoundingBox();assert.equal(mesh.geometry.parameters.radius,.0025);
 for(let i=0;i<mesh.count;i++){
  const sourceIndex=mesh.userData.sourceInstanceIndices[i];
  source.getMatrixAt(sourceIndex,matrix);const oldBox=source.geometry.boundingBox.clone().applyMatrix4(source.matrixWorld.clone().multiply(matrix));
  mesh.getMatrixAt(i,matrix);const newBox=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix.clone().multiply(matrix));
  maxDelta=Math.max(maxDelta,oldBox.min.distanceTo(newBox.min),oldBox.max.distanceTo(newBox.max));
 }
}
assert(maxDelta<1e-5);assert.deepEqual(source.instanceMatrix.array,original);
source.scale.setScalar(2);source.updateMatrixWorld();assert.equal(copyRoundedMullions(T,RoundedBoxGeometry,source,source.material),null);
console.log({groups:copies.length,maxBoundsDelta:maxDelta,sourceUnchanged:true,scaledParentFallback:true});
