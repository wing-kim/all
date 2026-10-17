import assert from 'node:assert/strict';
import * as T from 'three';
import {glazingSides} from './glazing-sides.js';
const g=new T.BoxGeometry(8,5,12),before=Array.from(g.index.array),m=new T.Matrix4().makeRotationY(.4),r=glazingSides(T,g,m);
assert.equal(r.index.count,24);assert.deepEqual(Array.from(g.index.array),before);
g.computeBoundingBox();r.computeBoundingBox();assert.deepEqual(r.boundingBox,g.boundingBox);
console.log('Glass cap removal: 8 vertical triangles retained; source and facade bounds preserved.');
