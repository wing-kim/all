import assert from 'node:assert/strict';
import * as T from 'three';
import {copyGeometry} from './geometry-copy.js';
// A side-only glass extrusion must not grow its removed caps back in the BVH.
const glass=new T.BoxGeometry(2,4,.08).toNonIndexed();glass.setDrawRange(12,24);glass.clearGroups();
const expected=Array.from(glass.attributes.position.array.slice(36,108));
const result=copyGeometry(T,glass);
assert.deepEqual(Array.from(result.attributes.position.array),expected);
assert.equal(result.attributes.position.count,24);
assert.equal(glass.attributes.position.count,36);
// Indexed material groups must be clipped and rebased, not left at old offsets.
const indexed=new T.BoxGeometry(2,4,.08);indexed.setDrawRange(9,12);
const copy=copyGeometry(T,indexed);
assert.deepEqual(Array.from(copy.index.array),Array.from(indexed.index.array.slice(9,21)));
assert.deepEqual(copy.groups,[{start:0,count:3,materialIndex:1},{start:3,count:6,materialIndex:2},{start:9,count:3,materialIndex:3}]);
const ordinary=new T.BoxGeometry(1,2,3),full=copyGeometry(T,ordinary);
assert.deepEqual(Array.from(full.index.array),Array.from(ordinary.index.array));
assert.deepEqual(full.groups,ordinary.groups);
console.log('Authored draw-range copies passed: nonindexed glass, indexed groups, full geometry.');
