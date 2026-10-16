import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeSamples } from './performance-stats.js';

test('long navigation stalls remain in the frame interval summary',()=>{
 assert.deepEqual(summarizeSamples([16,17,500]),{samples:3,p50:17,p95:500,p99:500,max:500,over100Ms:1,over200Ms:1});
 assert.deepEqual(summarizeSamples([]),{samples:0,p50:null,p95:null,p99:null,max:null,over100Ms:0,over200Ms:0});
});
