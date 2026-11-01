// 실사 3D 텍스처·모델을 KTX2(Basis Universal)로 바꾼다(T2): cd photoreal/tools/ktx && npm install && node convert.mjs [tex|assets|facade|glb ...]
// - 인코더: basisu(Homebrew basis_universal 2.50, Apache-2.0). 이 폴더의 node 패키지: glTF-Transform(MIT), sharp(Apache-2.0), draco3dgltf(Apache-2.0)
// - 색(sRGB): ETC1S, 거칠기·금속성 등 데이터: ETC1S 선형, 노멀: UASTC(+RDO, zstd). 화면에서 GPU 압축 형식(BC7·ASTC·ETC2)으로 바뀌어 메모리가 1/4 이하
// - 원본(webp·png·glb)은 그대로 두고 옆에 .ktx2 / .k.glb 를 만든다(실사 계층은 KTX2 를 먼저 읽고, 실패하면 원본)
// - webp·png 원본은 three 가 위아래를 뒤집어(flipY) 올리지만 압축 텍스처는 뒤집지 못하므로 미리 뒤집어 저장한다. glTF 안 텍스처는 원래 뒤집지 않는다
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRTextureBasisu, EXTTextureWebP } from '@gltf-transform/extensions';
import { listTextureSlots } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

sharp.cache(false);   // 같은 임시 파일 이름을 다시 쓰면 옛 이미지를 돌려주는 캐시를 끈다
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'khktx-'));
const want = new Set(process.argv.slice(2).length ? process.argv.slice(2) : ['tex', 'assets', 'facade', 'glb']);
const log = [];

// 종류별 basisu 설정. cap = 긴 변 최대 화소
const KIND = {
  color: { args: ['-q', '192'], cap: 1024 },
  data: { args: ['-linear', '-q', '160'], cap: 512 },
  normal: { args: ['-uastc', '-normal_map', '-uastc_rdo_l', '2.0', '-ktx2_zstandard_level', '19'], cap: 512 },
  exact: { args: ['-uastc', '-linear', '-ktx2_zstandard_level', '19'], cap: 1024 },   // 셰이더가 문턱값으로 읽는 맵(주변 건물 벽·창 구분): 손실 적게
  // 모델(가구·차·나무) 안 텍스처: 작게 보이므로 전송량을 원본 수준으로 맞춘다(노멀도 ETC1S, 512 상한)
  gcolor: { args: ['-q', '128'], cap: 512 },
  gdata: { args: ['-linear', '-q', '128'], cap: 512 },
  gnormal: { args: ['-normal_map', '-q', '160'], cap: 512 },
};
async function encode(input, out, kind, { flip = false, cap } = {}) {
  const K = KIND[kind], png = path.join(TMP, path.basename(out) + '.png');
  let img = sharp(input, { failOn: 'none' }); const meta = await img.metadata();
  const c = cap || K.cap, s = Math.min(1, c / Math.max(meta.width, meta.height));
  const w = Math.max(4, Math.round(meta.width * s / 4) * 4), h = Math.max(4, Math.round(meta.height * s / 4) * 4);
  if (w !== meta.width || h !== meta.height) img = img.resize(w, h, { kernel: 'lanczos3' });
  if (flip) img = img.flip();
  await img.png().toFile(png);
  execFileSync('basisu', ['-ktx2', '-mipmap', ...K.args, png, '-output_file', out], { stdio: 'pipe' });
  return { w, h, bytes: fs.statSync(out).size };
}
const kindOf = f => /_normal\.|-nc\./.test(f) ? 'normal' : /-rm\./.test(f) ? 'exact' : /_rough\./.test(f) ? 'data' : 'color';
async function folder(dir, re, cap) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(f => re.test(f)).sort()) {
    const src = path.join(ROOT, dir, f), out = src.replace(/\.(webp|png)$/, '.ktx2'), k = kindOf(f);
    const r = await encode(src, out, k, { flip: true, cap });
    log.push([path.join(dir, f), k, fs.statSync(src).size, r.bytes, r.w + 'x' + r.h]);
  }
}
async function glbs() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
  const files = ['assets', 'assets/cars', 'assets/office'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.glb') && !f.endsWith('.k.glb')).map(f => path.join(d, f)));
  for (const rel of files) {
    const src = path.join(ROOT, rel), out = src.replace(/\.glb$/, '.k.glb');
    const doc = await io.read(src), root = doc.getRoot();
    // VR 평탄화(kh-photoreal xrFlat)는 텍스처 평균색을 쓰는데 압축 텍스처는 화면에서 읽을 수 없다 → 재질 extras.prAvg 에 원본 평균색(sRGB 0～1)을 적어 둔다
    for (const m of root.listMaterials()) { const t = m.getBaseColorTexture(); if (!t) continue; const st = await sharp(Buffer.from(t.getImage())).stats(); m.setExtras({ ...(m.getExtras() || {}), prAvg: st.channels.slice(0, 3).map(c => +(c.mean / 255).toFixed(3)) }); }
    for (const [i, t] of root.listTextures().entries()) {
      const slots = listTextureSlots(t), normal = slots.some(s => /normal/i.test(s)), color = slots.some(s => /baseColor|emissive|diffuse|specularGlossiness|sheenColor/i.test(s));
      const ext = (t.getMimeType() || 'image/png').split('/')[1], tag = path.basename(rel, '.glb') + '-' + i, inp = path.join(TMP, `${tag}.${ext}`), o = path.join(TMP, `${tag}.ktx2`);
      fs.writeFileSync(inp, Buffer.from(t.getImage()));
      await encode(inp, o, normal ? 'gnormal' : color ? 'gcolor' : 'gdata');
      t.setImage(new Uint8Array(fs.readFileSync(o))).setMimeType('image/ktx2');
    }
    root.listExtensionsUsed().filter(e => e.extensionName === EXTTextureWebP.EXTENSION_NAME).forEach(e => e.dispose());
    if (root.listTextures().length) doc.createExtension(KHRTextureBasisu).setRequired(true);
    await io.write(out, doc);
    log.push([rel, 'glb', fs.statSync(src).size, fs.statSync(out).size, root.listTextures().length + '장']);
  }
}
if (want.has('tex')) await folder('tex', /_(color|normal|rough)\.webp$/);
if (want.has('assets')) await folder('assets', /_(color|normal|rough)\.webp$/);
if (want.has('facade')) await folder('context/facade', /-(col|rm|nc)\.(webp|png)$/, 1024);   // 창 무늬 노멀은 원래 크기(창틀 경계가 무뎌지지 않게)
if (want.has('glb')) await glbs();
fs.rmSync(TMP, { recursive: true, force: true });
let a = 0, b = 0; log.forEach(([f, k, s, d, x]) => { a += s; b += d; console.log(`${f}\t${k}\t${(s / 1e3) | 0}k → ${(d / 1e3) | 0}k\t${x}`); });
console.log(`합계 ${(a / 1e6).toFixed(2)}MB → ${(b / 1e6).toFixed(2)}MB (${log.length}개)`);
