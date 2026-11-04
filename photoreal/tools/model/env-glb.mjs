// 지니 주변 모델 형상 압축(최적화 2·3번, 1102.m): node photoreal/tools/model/env-glb.mjs <gltfpack cli.js 경로>
// - new/models/<id>.js 안의 base64 GLB 를 꺼내 gltfpack 0.22(npm gltfpack, MIT)로 meshopt 압축(-cc)한 new/models/<id>.glb 를 만든다
// - 꼭짓점 값은 실수 그대로(-vpf -vnf -vtf): 양자화하면 위치·uv 를 되돌리는 변환이 노드·재질에 붙는데, 지니 로더는 재질을 바꾸고
//   (khMat) uv2 를 아틀라스 칸으로 옮기며(khAtlasUV) VR 합치기가 실수 배열끼리 이어 붙이므로 그대로 두는 편이 안전하다
// - 이름·재질 이름·extras 유지(-kn -km -ke), 안 쓰는 꼭짓점 값도 유지(-kv: 지니 GLB 에는 그림이 없어 uv 가 지워질 수 있다)
// - 목록: new/models/bin-list.js (KH.bin = {id: 해시}). 페이지는 http(s) 에서 이 .glb 를 fetch 로 받고, file:// 이면 원래 .js
// 예: npm i gltfpack@0.22.0 (임시 폴더) → node photoreal/tools/model/env-glb.mjs <그 폴더>/node_modules/gltfpack/cli.js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const CLI = process.argv[2]; if (!CLI) { console.error('gltfpack cli.js 경로가 필요합니다'); process.exit(1); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), M = path.join(ROOT, 'new/models');
// KH_IDS=a,b(1102.o, jinny-import.mjs): 그 모델만 다시 압축하고 나머지는 지금 bin-list.js 의 해시를 둔다
const ONLY = process.env.KH_IDS ? new Set(process.env.KH_IDS.split(',')) : null, BL = path.join(M, 'bin-list.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'khenvglb-')), list = ONLY && fs.existsSync(BL) ? JSON.parse(fs.readFileSync(BL, 'utf8').replace(/^.*?\)\.bin=/, '').replace(/;\s*$/, '')) : {};
let a = 0, b = 0;
for (const f of fs.readdirSync(M).filter(f => f.endsWith('.js') && !/^(kh-lib|ktx-list|bin-list)\.js$/.test(f)).sort()) {
  if (ONLY && !ONLY.has(f.slice(0, -3))) continue;
  const m = fs.readFileSync(path.join(M, f), 'utf8').match(/data:model\/gltf-binary;base64,([A-Za-z0-9+/=]+)/); if (!m) continue;
  const id = f.slice(0, -3); if (ONLY && !ONLY.has(id)) continue; fs.writeFileSync(path.join(tmp, 'in.glb'), Buffer.from(m[1], 'base64'));
  // gltfpack(wasm)은 작업 폴더 안의 상대 경로만 읽고 쓴다
  execFileSync(process.execPath, [path.resolve(CLI), '-i', 'in.glb', '-o', 'out.glb', '-cc', '-kn', '-km', '-ke', '-kv', '-vpf', '-vnf', '-vtf'], { cwd: tmp, stdio: 'ignore' });
  const out = fs.readFileSync(path.join(tmp, 'out.glb')); fs.writeFileSync(path.join(M, id + '.glb'), out);
  list[id] = crypto.createHash('sha1').update(out).digest('hex').slice(0, 10);
  a += fs.statSync(path.join(M, f)).size; b += out.length;
  console.log(id.padEnd(14), (fs.statSync(path.join(M, f)).size / 1024 | 0) + 'KB(.js) →', (out.length / 1024 | 0) + 'KB(.glb)');
}
fs.writeFileSync(BL, '(window.KH=window.KH||{tex:{},glb:{}}).bin=' + JSON.stringify(Object.fromEntries(Object.entries(list).sort())) + ';\n');
console.log('합계(이번에 압축한 것)', (a / 1e6).toFixed(2) + 'MB →', (b / 1e6).toFixed(2) + 'MB', '· 목록', Object.keys(list).length + '개');
fs.rmSync(tmp, { recursive: true, force: true });
