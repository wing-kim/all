// 빛 굽기 1단계: 실사 3D 장면(현재 조합)을 Blender 로 넘길 glTF 와 층·태양 정보로 내보낸다.
// node export.mjs <출력폴더> [pf=glass]   (BASE 기본 http://localhost:8791, puppeteer-core 는 photoreal/tests 의 것을 NODE_PATH 로)
// - 재질은 굽기에 필요한 값만 남긴 단순 재질로 바꾼다. 이름 머리: G_ 유리(빛이 통과), L_ 조명(빛을 냄), S_ 그 밖
// - 층별 바닥 높이·천장 높이·평면 범위와 시간대별(오전·오후·석양·야간) 태양 방향을 bake-input.json 에 남긴다
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
// 옵션(위치 인자 뒤): --sch mech|self|alt3|alt4  --g1 slant|straight|corner|skin  --floors 4～8  --levels B3,B2,B1 (내보낼 층, 생략하면 전부)
// 조합 옵션을 주면 해당 라디오(sch-*, g1-*)와 t-upstraight 를 고른 뒤 내보낸다. 생략하면 화면 기본 상태 그대로.
const pos = [], opt = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) opt[a.slice(2)] = process.argv[++i]; else pos.push(a); }
const out = path.resolve(pos[0] || 'bake-src');
const pf = pos[1] || 'glass';
const BASE = process.env.BASE || 'http://localhost:8791';
fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 600000 });
const p = await b.newPage(); await p.setViewport({ width: 800, height: 600 });
p.on('pageerror', e => console.error('page', String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?pr=1&pf=' + pf, { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.env2 != null, { timeout: 120000 });
await new Promise(r => setTimeout(r, 1500));
const pick = async id => { await p.evaluate(id => { const e = document.getElementById(id); if (!e) throw new Error('라디오 없음 ' + id); if (!e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, id); await new Promise(r => setTimeout(r, 2500)); };
if (opt.sch || opt.g1 || opt.floors) {
  // --floors N: 층수(c-floors, 4～8). 7F·8F 굽기(1102)는 --floors 8 --levels 7F,8F
  if (opt.floors) await p.evaluate(v => { const e = document.getElementById('c-floors'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, opt.floors);
  if (opt.sch) await pick('sch-' + opt.sch);
  if (opt.g1) await pick('g1-' + opt.g1);
  await pick('t-upstraight');
  await p.waitForFunction(() => KHPRLayer.t.dress != null && KHPRLayer.t.env2 != null, { timeout: 120000 });
  await new Promise(r => setTimeout(r, 3000));
}
const only = opt.levels ? opt.levels.split(',') : null;
await p.addScriptTag({ url: BASE + '/photoreal/vendor/GLTFExporter.js' });
const res = await p.evaluate(async only => {
  const T = THREE, K = KHPR, out = new T.Scene(), cache = new Map(), lum = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // 화면 합치기(T1)로 숨긴 원본 메시는 합친 묶음으로 그려지므로 보이는 것으로 본다(이걸 빼면 건물 대부분이 빠진 장면을 굽는다)
  const hs = window.KHXRLayer && KHXRLayer.opt && KHXRLayer.opt.hiddenSet;
  const visible = o => { for (let q = o; q; q = q.parent) if (!q.visible && !(hs && hs.has(q))) return false; return true; };
  function conv(m) {
    if (cache.has(m)) return cache.get(m);
    let kind = 'S', color = m.color ? m.color.clone() : new T.Color(1, 1, 1);
    if (m.map && m.map.image && !(m.map.image.width <= 4)) color.multiplyScalar(0.6);   // 텍스처 평균 밝기 근사
    if (m.isMeshBasicMaterial && lum(color) > 0.6) kind = 'L';
    if (m.emissive && m.emissiveIntensity > 0.5 && lum(m.emissive) > 0.3) { kind = 'L'; color = m.emissive.clone(); }
    if (m.transparent && m.opacity < 0.9 && kind === 'S') kind = 'G';
    if (m.userData && m.userData.pr && m.userData.pr.glass) kind = 'G';
    const n = new T.MeshStandardMaterial({ color: kind === 'G' ? new T.Color(0.9, 0.95, 0.97) : color, roughness: m.roughness != null ? m.roughness : 0.8, metalness: Math.min(0.3, m.metalness || 0) });
    n.name = kind + '_' + cache.size; cache.set(m, n); return n;
  }
  const tm = new T.Matrix4();
  function add(root, skipInst) {
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (!o.isMesh || !visible(o) || !o.geometry || !o.geometry.attributes.position) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.every(m => !m || m.visible === false || (m.transparent && m.opacity < 0.04))) return;
      const mm = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      if (o.isInstancedMesh) {
        if (skipInst) return;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, tm); const e = new T.Mesh(o.geometry, mm); e.matrixAutoUpdate = false; e.matrix.multiplyMatrices(o.matrixWorld, tm); out.add(e); }
      } else { const e = new T.Mesh(o.geometry, mm); e.matrixAutoUpdate = false; e.matrix.copy(o.matrixWorld); out.add(e); }
    });
  }
  add(K.bld); add(KHXR.scene.getObjectByName('pr-dress')); add(K.site); add(K.city, true); add(K.ctx, true);
  const glb = await new Promise(res => new T.GLTFExporter().parse(out, r => res(r), { binary: true }));
  // 층 정보
  const levels = K.LEVELS.filter(L => !only || only.includes(L.key)).map(L => { let a = 1e9, bz = 1e9, c = -1e9, d = -1e9; L.poly.forEach(q => { const [x, z] = K.P(q[0], q[1]); a = Math.min(a, x); bz = Math.min(bz, z); c = Math.max(c, x); d = Math.max(d, z); }); return { key: L.key, kind: L.kind, floor: K.floorTop(L), ceil: K.ceilOf(L), box: [a, bz, c, d] }; });
  // 시간대별 태양(Wing applyTime 으로 정한 방향·세기·색)
  const R3D = K.R3D, keep = R3D.time, sun = {};
  for (const t of ['am', 'pm', 'sunset', 'night']) { R3D.time = t; K.applyTime(); const d = K.sun.position.clone().normalize(); sun[t] = { dir: d.toArray(), intensity: K.sun.intensity, color: K.sun.color.toArray(), season: R3D.season, night: t === 'night' }; }
  R3D.time = keep; K.applyTime();
  const bytes = new Uint8Array(glb); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  if (only) { const miss = only.filter(k => !levels.some(l => l.key === k)); if (miss.length) throw new Error('없는 층 ' + miss); }
  return { glb: btoa(s), levels, sun, state: K.state, meshes: out.children.length, mats: cache.size };
}, only);
fs.writeFileSync(path.join(out, 'scene.glb'), Buffer.from(res.glb, 'base64'));
delete res.glb;
fs.writeFileSync(path.join(out, 'bake-input.json'), JSON.stringify(res, null, 1));
console.log('levels', res.levels.map(l => l.key).join(','), 'sch', res.state.scheme, 'g1', res.state.g1, 'meshes', res.meshes, 'mats', res.mats, 'size', fs.statSync(path.join(out, 'scene.glb')).size);
await b.close();
