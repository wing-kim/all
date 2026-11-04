// 지니 단일 HTML 들여오기(1102.o): node photoreal/tools/model/jinny-import.mjs <지니 HTML> --deps <npm 임시 폴더> [--dry] [--force]
// 지니가 보내는 단일 HTML(Wing 페이지 + window.KHDATA = Draco GLB·webp 텍스처 base64)을 우리 방식으로 바꿔 new/models/ 에 쌓는다.
//  1) KHDATA 를 꺼내 지난번 들여온 판(photoreal/tools/model/jinny/import-state.json 의 해시)과 비교해 바뀐 것만 고른다
//  2) 모델: Draco 를 풀어(gltf-transform + draco3dgltf) 평범한 GLB 를 new/models/<id>.js(바로 연 파일 file:// 대비)로 쓰고,
//     env-glb.mjs 로 meshopt(.glb, gltfpack -cc) 압축과 bin-list.js 를 갱신한다
//  3) 텍스처: webp 를 new/models/tex/<이름>.js 로 쓰고 env-ktx.py 로 바뀐 것만 KTX2, 라이트맵·노후 맵이 바뀌면 env-atlas.py 로 아틀라스를 다시 만든다.
//     VR 용 색 텍스처 아틀라스(vr-atlas.py, new/models/tex/vr_atlas.ktx2 + vr-atlas.js)도 다시 굽는다
//  4) 재질표: HTML 의 KH.mat 을 new/models/kh-lib.js 에 넣고 KH.ver(캐시 꼬리표)를 바뀐 파일만 새로 매긴다. 우리가 만든 모델(school410r 등)은 그대로 둔다
//  5) 코드: KHDATA·Draco 해독기 같은 큰 덩어리를 뺀 HTML 을 지난번 판과 줄 단위로 비교해 out/jinny-import/<판>-code.diff 와 요약을 남긴다(자동 반영은 하지 않음)
//  6) prefetch-list.py 로 미리받기 목록을 다시 만든다
// 준비(한 번): 임시 폴더에서 npm i gltfpack@0.22.0 @gltf-transform/core@4 @gltf-transform/extensions@4 draco3dgltf@1.5.7  (모두 MIT·Apache-2.0)
// 사용법·주의: docs/jinny-import.md
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const SRC = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--deps'), DEPS = opt('deps'), DRY = flag('dry'), FORCE = flag('force');
if (!SRC || !DEPS) { console.error('사용법: node jinny-import.mjs <지니 HTML> --deps <npm 임시 폴더> [--dry] [--force]'); process.exit(1); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), M = path.join(ROOT, 'new/models'), TX = path.join(M, 'tex');
const ST = path.join(ROOT, 'photoreal/tools/model/jinny/import-state.json'), SNAP = path.join(ROOT, 'photoreal/tools/model/jinny/import-code.html');
const OUT = path.join(ROOT, 'photoreal/tests/out/jinny-import'); fs.mkdirSync(OUT, { recursive: true });
const sha = b => crypto.createHash('sha1').update(b).digest('hex');
const OURS = new Set(['school410r']);   // 우리가 만든 모델(지니 판에 없음): 지우거나 덮지 않는다

/* ---------- 1. HTML 풀기 ---------- */
const raw = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
// 문자열 안의 괄호를 건너뛰며 { … } 끝을 찾는다
function objEnd(s, k) { let d = 0, q = false, e = false; for (let n = k; n < s.length; n++) { const c = s[n]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; continue; } if (c === '"') q = true; else if (c === '{') d++; else if (c === '}') { d--; if (!d) return n + 1; } } return -1; }
const grab = (s, key) => { const i = s.indexOf(key); if (i < 0) return null; const k = i + key.length, e = objEnd(s, k); return { i, k, e, text: s.slice(k, e) }; };
const kd = grab(raw, 'window.KHDATA='); if (!kd) { console.error('KHDATA 가 없습니다(지니 단일 HTML 이 맞는지 확인)'); process.exit(1); }
const DATA = JSON.parse(kd.text);
const mat = grab(raw, 'KH.mat='), MAT = mat ? JSON.parse(mat.text) : null;
const VER = (raw.match(/VER='(v\d+)'/) || [])[1] || 'v?';
// 코드 판: 큰 데이터(KHDATA·Draco 해독기 문자열)를 자리표로 바꾼다
let code = raw.slice(0, kd.k) + '{/*KHDATA*/}' + raw.slice(kd.e);
for (const key of ['window.KHDRACO=']) { const g = grab(code, key); if (g) code = code.slice(0, g.k) + '{/*' + key + '*/}' + code.slice(g.e); }
code = code.replace(/window\.KHDRACOLOADER="(?:[^"\\]|\\.)*"/, 'window.KHDRACOLOADER="/*생략*/"');
console.log('지니 판', VER, '·', Object.keys(DATA).length, '항목', (kd.text.length / 1e6).toFixed(1) + 'MB', '· 원본 SHA-1', sha(fs.readFileSync(SRC)).slice(0, 12));

/* ---------- 2. 바뀐 것 고르기 ---------- */
const prev = fs.existsSync(ST) ? JSON.parse(fs.readFileSync(ST, 'utf8')) : { ver: null, src: {} };
const glb = [], tex = [], same = [];
for (const [k, v] of Object.entries(DATA)) {
  const [t, n] = k.split('/'), h = sha(v).slice(0, 12), out = t === 'glb' ? path.join(M, n + '.js') : path.join(TX, n + '.js');
  if (!FORCE && prev.src[k] === h && fs.existsSync(out)) { same.push(k); continue; }
  (t === 'glb' ? glb : tex).push(n);
}
const gone = Object.keys(prev.src).filter(k => !(k in DATA));
console.log('바뀐 모델', glb.length, glb.join(' ') || '-'); console.log('바뀐 텍스처', tex.length, tex.join(' ') || '-'); console.log('그대로', same.length, '· 지니 판에서 빠진 것', gone.join(' ') || '-');

/* ---------- 3. 코드 차이 보고 ---------- */
const prevCode = fs.existsSync(SNAP) ? fs.readFileSync(SNAP, 'utf8') : null;
if (prevCode) {
  const a = path.join(os.tmpdir(), 'khj-a.html'), b = path.join(os.tmpdir(), 'khj-b.html'); fs.writeFileSync(a, prevCode); fs.writeFileSync(b, code);
  let d = ''; try { d = execFileSync('diff', ['-u', a, b], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch (e) { d = e.stdout || ''; }
  const f = path.join(OUT, `${prev.ver || 'prev'}-${VER}-code.diff`); fs.writeFileSync(f, d);
  const hunks = (d.match(/^@@/gm) || []).length, add = (d.match(/^\+[^+]/gm) || []).length, del = (d.match(/^-[^-]/gm) || []).length;
  console.log(`코드 차이 ${prev.ver} → ${VER}: 덩어리 ${hunks}, 추가 ${add}줄, 삭제 ${del}줄 → ${path.relative(ROOT, f)}`);
} else console.log('지난 코드 판 없음(첫 들여오기): 다음부터 비교한다');
if (DRY) { console.log('--dry: 파일은 바꾸지 않았다'); process.exit(0); }

/* ---------- 4. 모델(.js = Draco 를 푼 GLB) ---------- */
const req = createRequire(path.join(path.resolve(DEPS), 'package.json'));
const imp = m => import(pathToFileURL(req.resolve(m)).href);
if (glb.length) {
  const { NodeIO } = await imp('@gltf-transform/core'), { ALL_EXTENSIONS } = await imp('@gltf-transform/extensions'), draco3d = (await imp('draco3dgltf')).default;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
  for (const n of glb) {
    const doc = await io.readBinary(new Uint8Array(Buffer.from(DATA['glb/' + n], 'base64')));
    for (const e of doc.getRoot().listExtensionsUsed()) if (e.extensionName === 'KHR_draco_mesh_compression') e.dispose();
    const plain = Buffer.from(await io.writeBinary(doc));
    fs.writeFileSync(path.join(M, n + '.js'), `(window.KH=window.KH||{tex:{},glb:{}});KH.glb['${n}']='data:model/gltf-binary;base64,${plain.toString('base64')}';\n`);
  }
  // meshopt 압축(.glb)과 bin-list.js: 바뀐 모델만
  execFileSync(process.execPath, [path.join(ROOT, 'photoreal/tools/model/env-glb.mjs'), req.resolve('gltfpack/cli.js')], { stdio: 'inherit', env: { ...process.env, KH_IDS: glb.join(',') } });
}
/* ---------- 5. 텍스처(.js = webp) → KTX2·아틀라스 ---------- */
for (const n of tex) fs.writeFileSync(path.join(TX, n + '.js'), `(window.KH=window.KH||{tex:{},glb:{}});KH.tex['${n}']='data:image/webp;base64,${DATA['tex/' + n]}';\n`);
if (tex.length) execFileSync('python3', ['-I', path.join(ROOT, 'photoreal/tools/ktx/env-ktx.py'), ...tex], { stdio: 'inherit' });
if (tex.length || glb.length) execFileSync('python3', ['-I', path.join(ROOT, 'photoreal/tools/ktx/env-atlas.py')], { stdio: 'inherit' });   // env-ktx 가 목록을 다시 쓰면 아틀라스 칸 자리도 다시 붙여야 한다
if (tex.length || MAT) execFileSync('python3', ['-I', path.join(ROOT, 'photoreal/tools/ktx/vr-atlas.py')], { stdio: 'inherit' });   // 1102.r: VR 용 색 텍스처 아틀라스(재질표가 쓰는 색 텍스처가 바뀌면 칸도 바뀐다)
/* ---------- 6. 재질표·캐시 꼬리표 ---------- */
{
  const lib = path.join(M, 'kh-lib.js'), s = fs.readFileSync(lib, 'utf8'), old = grab(s, 'KH.ver='), ver = old ? JSON.parse(old.text) : {};
  const touch = [...glb.map(n => [n, path.join(M, n + '.js')]), ...tex.map(n => ['tex/' + n, path.join(TX, n + '.js')])];
  for (const [k, f] of touch) ver[k] = sha(fs.readFileSync(f)).slice(0, 8);
  for (const k of gone) if (!OURS.has(k.split('/').pop().replace(/_(lm|ao)$/, ''))) console.log('주의: 지니 판에서 빠졌지만 지우지 않음', k);
  const m = MAT || JSON.parse(grab(s, 'KH.mat=').text);
  fs.writeFileSync(lib, '(window.KH=window.KH||{tex:{},glb:{}});KH.mat=' + JSON.stringify(m) + ';KH.ver=' + JSON.stringify(ver) + ';\n');
}
fs.writeFileSync(SNAP, code);
fs.writeFileSync(ST, JSON.stringify({ ver: VER, at: new Date().toISOString(), file: path.basename(SRC), sha1: sha(fs.readFileSync(SRC)), src: Object.fromEntries(Object.entries(DATA).map(([k, v]) => [k, sha(v).slice(0, 12)])) }, null, 1));
execFileSync('python3', ['-I', path.join(ROOT, 'photoreal/tools/prefetch-list.py')], { stdio: 'inherit' });
console.log('끝. 다음: 지니 코드 차이를 new/3d-model.html 에 손으로 반영(우리 [PR] 접점 유지), KH_ENV_VER 올리기, qa 의 env 시험');
