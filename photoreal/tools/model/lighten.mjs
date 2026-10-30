// 실내·거리 모델 경량화(퀘스트 예산·외관 프레임): node lighten.mjs <파일.glb> [단순화 비율=0.5] [허용 오차=0.01]
// - 잎(재질 이름에 leaves·leaf·Pflanze·foliage): 이어진 잎 카드 묶음을 반만 남기고 남은 카드를 1.3배 키워 수관 밀도를 비슷하게 유지
//   (잎 카드는 서로 떨어진 사각형이라 일반 단순화로는 줄지 않는다)
// - 그 밖의 형상: meshoptimizer 단순화(비율·오차). 원래 파일을 덮어쓴다(원본은 git 기록에 있다)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
const [file, ratio = '0.5', err = '0.01'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
await MeshoptSimplifier.ready;
const doc = await io.read(file);
const tris = () => { let n = 0; doc.getRoot().listMeshes().forEach(m => m.listPrimitives().forEach(p => { const i = p.getIndices(); n += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; })); return Math.round(n); };
const before = tris();
await doc.transform(weld());
const LEAF = /leaves|leaf|pflanze|foliage/i;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const mat = prim.getMaterial(), leaf = LEAF.test((mat && mat.getName()) || '') || LEAF.test(mesh.getName() || '');
  if (!leaf) { simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: +ratio, error: +err, lockBorder: false }); continue; }
  const idx = prim.getIndices(), pos = prim.getAttribute('POSITION'); if (!idx) continue;
  const I = idx.getArray(), nV = pos.getCount(), par = new Int32Array(nV).map((_, i) => i);
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let t = 0; t < I.length; t += 3) { const a = find(I[t]), b = find(I[t + 1]), c = find(I[t + 2]); par[b] = a; par[c] = a; }
  // 묶음(카드)별로 반만 남긴다: 묶음 번호의 해시로 고르게
  const keep = r => (((r * 2654435761) >>> 0) % 100) < 50;
  const out = []; for (let t = 0; t < I.length; t += 3) if (keep(find(I[t]))) out.push(I[t], I[t + 1], I[t + 2]);
  // 남은 카드를 무게중심 기준 1.3배
  const P = pos.getArray().slice(), sum = new Map();
  for (let v = 0; v < nV; v++) { const r = find(v), s = sum.get(r) || [0, 0, 0, 0]; s[0] += P[v * 3]; s[1] += P[v * 3 + 1]; s[2] += P[v * 3 + 2]; s[3]++; sum.set(r, s); }
  for (let v = 0; v < nV; v++) { const s = sum.get(find(v)); for (let k = 0; k < 3; k++) { const c = s[k] / s[3]; P[v * 3 + k] = c + (P[v * 3 + k] - c) * 1.3; } }
  pos.setArray(P);
  idx.setArray(new (I.constructor)(out));
}
await doc.transform(prune());
await io.write(file, doc);
console.log(file.split('/').pop(), before, '→', tris());
