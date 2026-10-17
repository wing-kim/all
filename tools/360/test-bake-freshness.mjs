// 배포 전 점검: 미리 구운 결과가 현재 런타임 파일과 맞는지 확인한다.
// 카페 베이크는 가구를 만드는 파일(environment.js 등) 전체 해시로 검증하므로, 외부 재질만 고쳐도
// 실행 시 furniture-mismatch로 꺼진다. 그 경우 카페 원천을 다시 뽑아 13개 시간대를 다시 굽는다.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../new/',import.meta.url)),bake=path.join(root,'360/assets/cafe-room-bake');
const sha=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const index=JSON.parse(fs.readFileSync(path.join(bake,'index.json'),'utf8'));
let checked=0;
for(const slot of index.slots){
 const manifest=JSON.parse(fs.readFileSync(path.join(bake,slot,'manifest.json'),'utf8'));
 for(const [file,expected] of Object.entries(manifest.furnitureManifest)){
  assert.equal(sha(file),expected,`${slot}: ${file} changed after the cafe bake; re-export the cafe source and rebake all slots`);checked++;
 }
 for(const map of Object.values(manifest.lightmaps))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(bake,slot,map.file))).digest('hex'),map.sha256,`${slot}: ${map.file} hash`);
}
const ground=JSON.parse(fs.readFileSync(path.join(root,'360/assets/ground-bake.json'),'utf8'));
assert.ok(ground.signature?.hash,'ground-bake.json must carry the context signature');
assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'360/assets/ground-sky-ao.png'))).digest('hex'),ground.sha256,'ground-sky-ao.png hash');
console.log(`bake freshness: ${index.slots.length} cafe slots, ${checked} furniture hashes and lightmaps match; ground AO hash and signature present.`);
