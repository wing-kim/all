// 자체 점검(qa)의 화질·예산·UI 측정: node qmetrics.mjs  (BASE=주소, QS=추가 옵션, ONLY=flicker,still,base,ui,mem)
// 결과: out/qmetrics.json. qa.mjs 가 부른다(단독 실행 가능).
// - flicker: 카메라(와 보는 곳)를 MOVE(기본 2mm)씩 6번 옆으로 옮긴 연속 프레임의 화소 밝기 변화(실제 화면 경로, 후처리 포함). '수평면(바닥) 화소'만(1.5m 안 제외), 가장자리·거리 단차 4화소를 깎고(가까운 물체가 실제로 움직여 바닥을 가리고 드러내는 것 제외) 거리 구간(가까움 <8m, 중간 8～25m, 멂 >25m)별로 잰다.
//   구성: 화면(1280×720, 배율 1), 휴대폰(390×844, 배율 3), 퀘스트 한 눈(916×960, 배율 2, 시야 97°, AO 끔), 낮은 시점(눈높이 0.5m)
// - alias: 같은 화면을 1배와 4배 초표본으로 그려 바닥 화소 밝기 차의 고주파 성분(움직임과 무관한 앨리어싱 에너지, 8단계 넘는 화소 비율)을 거리 구간별로 잰다
// - still: 포화 화소 비율, 천장 검은 구멍 비율, 야간 우리 건물 대 이웃 휘도 비, 석양 대 오후 휘도, 잎 휘도 변동(앞뒤 차), 이웃 건물 명도 편차(p90/p10)
// - base: 기준 스크린샷 비교용 장면 저장(out/qa-shots/*.jpg, 비교는 qa.mjs)
// - ui: 겹침·숨김 규칙·콘솔 오류
// - mem: 텍스처 GPU 메모리 추정(장면의 고유 텍스처 크기 합)
// 바닥·천장·묶음 판정은 장면을 한 번 '판정 색'으로 그려 얻는다(빨강 = 묶음, 초록 = 위를 보는 면 1 / 아래를 보는 면 0.5, 파랑 = 거리/100m)
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const QS = process.env.QS || '';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT + 'qa-shots', { recursive: true });
const ONLY = new Set((process.env.ONLY || 'flicker,alias,still,base,ui,mem').split(','));
const wait = ms => new Promise(r => setTimeout(r, ms));
const MV = +(process.env.MOVE || 0.002);   // 깜빡임 측정의 한 프레임 이동(m): 2mm 는 25m 앞 바닥이 화면에서 약 0.1화소 움직이는 양
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = { base: BASE, qs: QS, at: new Date().toISOString(), flicker: {}, alias: {}, still: {}, ui: {}, mem: null, shots: [], errors: [] };

async function open(dev, extra = '') {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + String(e).slice(0, 200)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /THREE\.WebGL(Program|Shader)/.test(t)) errs.push(t.slice(0, 200)); });
  p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  if (dev === 'phone') await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  else if (dev === 'eye') await p.setViewport({ width: 916, height: 960, deviceScaleFactor: 2 });
  else await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + (dev === 'eye' ? '&prq=medium' : '') + QS + extra, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.plants != null && KHPRLayer.t.ground != null, { timeout: 240000 });
  // 3D 캔버스만 보이게(미니맵 등 다른 캔버스도 숨긴다)
  await p.addStyleTag({ content: 'body *{visibility:hidden!important}' }); await p.evaluate(() => KHXR.renderer.domElement.style.setProperty('visibility', 'visible', 'important'));
  await wait(1500);
  if (dev === 'eye') await p.evaluate(() => { KHXR.camera.fov = 97; KHXR.camera.updateProjectionMatrix(); });
  return { p, errs, dev };
}
// 장면 이동: out(Wing 모서리 보기), 층 키(실내), 'street'(길 위 눈높이), low(실내 0.5m)
async function go(P, v, low) {
  await P.p.evaluate((v, low) => {
    const X = KHXR, K = KHPRLayer.K;
    if (v === 'out' || v === 'street') { if (K.I.on) X.exitInt(); X.go('corner'); }
    else { const i = K.LEVELS.findIndex(l => l.key === v); if (!K.I.on) X.enterInt(); X.placeLevel(i, true); }
    window.__qaLow = low; window.__qaV = v;
  }, v, !!low);
  await wait(3200);
  await P.p.evaluate(() => {
    const X = KHXR, c = X.camera, t = X.controls.target;
    if (window.__qaV === 'street') { const d = c.position.clone().sub(t); d.y = 0; d.normalize(); t.y = 0; c.position.copy(t).addScaledVector(d, 60); c.position.y = 1.7; X.controls.update(); }
    if (window.__qaLow) { const dy = c.position.y - (KHXR.floorTop ? 0 : 0); const f = KHXR.LEVELS[KHXR.I.li]; const y0 = f ? KHXR.floorTop(f) : 0; const h = c.position.y - y0; c.position.y = y0 + 0.5; t.y += 0.5 - h; X.controls && X.controls.update(); }
  });
  await P.p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 30 ? r() : requestAnimationFrame(f)); f(); }));
}
// 판정 색 그리기: 화면 크기 그대로 읽어 페이지 안에 둔다(window.__qaMask, 너비·높이)
const maskPass = (P, size) => P.p.evaluate(size => {
  const R = KHXR.renderer, S = KHXR.scene, C = KHXR.camera, T = THREE, G = KHPRLayer.groups();
  // 화면 합치기(T1) 묶음은 원래 묶음을 알 수 없으므로 판정 동안 끄고 원본 메시를 보인다
  const O = window.KHXRLayer && KHXRLayer.opt, og = O && O.group, oh = O && O.hidden ? O.hidden.slice() : [];
  if (og) { og.visible = false; oh.forEach(m => { m.visible = true; }); }
  const code = new Map(); const tag = (arr, v) => arr.forEach(r => r.traverse(o => { if (!code.has(o)) code.set(o, v); }));
  S.traverse(o => { if (/^pr-trees|^pr-street/.test(o.name)) o.traverse(q => code.set(q, 4)); });
  tag(G.ours, 1); tag(G.ctx, 2); tag(G.ground, 3);
  // 재질마다(묶음 값·자르기 평면을 그대로) 판정 재질을 만든다. 실내 보기는 위층을 재질의 자르기 평면으로 잘라 보이므로 장면 전체 덮어쓰기(overrideMaterial)로는 안 된다
  const VS = '#include <clipping_planes_pars_vertex>\nvarying vec3 vW;varying vec3 vN;void main(){vec3 tr=position;vec3 on=normal;\n#ifdef USE_INSTANCING\ntr=(instanceMatrix*vec4(tr,1.0)).xyz;on=mat3(instanceMatrix)*on;\n#endif\nvec4 w=modelMatrix*vec4(tr,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*on);vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <clipping_planes_vertex>\n}';
  const FS = '#include <clipping_planes_pars_fragment>\nuniform float uG;varying vec3 vW;varying vec3 vN;void main(){\n#include <clipping_planes_fragment>\nvec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;float up=n.y>0.85?1.0:(n.y<-0.85?0.5:0.0);gl_FragColor=vec4(uG/4.0,up,clamp(distance(vW,cameraPosition)/100.0,0.0,1.0),1.0);}';
  const MM = new Map(); const mm = (m, g) => { const k = (m ? m.uuid : '-') + g; let q = MM.get(k); if (!q) { q = new T.ShaderMaterial({ uniforms: { uG: { value: g } }, vertexShader: VS, fragmentShader: FS, side: T.DoubleSide, clipping: true });
    if (m && m.clippingPlanes) { q.clippingPlanes = m.clippingPlanes; q.clipIntersection = m.clipIntersection; } MM.set(k, q); } return q; };
  // 글자 판·선·점, 깊이 검사·쓰기를 안 하는 덧그림(라벨·하늘 돔), 투명(유리)은 판정에서 뺀다: 유리 너머 바닥이 보이도록
  const off = [], saved = [];
  S.traverse(o => { if (!o.visible) return; const m0 = o.material && (Array.isArray(o.material) ? o.material[0] : o.material);
    if (o.isSprite || o.isLine || o.isPoints || (m0 && (m0.depthTest === false || m0.depthWrite === false || m0.side === T.BackSide || (m0.transparent && m0.opacity < 0.95)))) { off.push(o); return; }
    if (o.isMesh) { const g = code.get(o) || 0; saved.push([o, o.material]); o.material = Array.isArray(o.material) ? o.material.map(m => mm(m, g)) : mm(o.material, g); } });
  off.forEach(o => { o.visible = false; });
  const w = size ? size[0] : R.domElement.width, h = size ? size[1] : R.domElement.height, rt = new T.WebGLRenderTarget(w, h);
  const bg = S.background, fog = S.fog, tm = R.toneMapping, oe = R.outputEncoding, sob = S.onBeforeRender;
  S.background = null; S.fog = null; R.toneMapping = T.NoToneMapping; R.outputEncoding = T.LinearEncoding; S.onBeforeRender = () => {};
  R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(S, C); const buf = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, buf); R.setRenderTarget(null);
  S.background = bg; S.fog = fog; R.toneMapping = tm; R.outputEncoding = oe; S.onBeforeRender = sob;
  saved.forEach(([o, m]) => { o.material = m; }); off.forEach(o => { o.visible = true; });
  rt.dispose(); MM.forEach(q => q.dispose());
  if (og) { og.visible = true; oh.forEach(m => { m.visible = false; }); }
  window.__qaMask = { w, h, buf };   // 아래에서 위로 쌓인 행(GL)
  const cnt = [0, 0, 0, 0, 0]; for (let i = 0; i < buf.length; i += 4) cnt[Math.round(buf[i] / 255 * 4)]++;
  return cnt.map(c => +(c / (w * h) * 100).toFixed(1));
}, size);
// 스크린샷(PNG base64)을 페이지 안에서 판정 색과 맞춰 계산한다
// 3D 캔버스 영역만 찍는다(오른쪽 설정 패널 제외). 판정 색 버퍼와 같은 영역
const shot = async P => { const r = await P.p.evaluate(() => { const b = KHXR.renderer.domElement.getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; });
  return 'data:image/png;base64,' + await P.p.screenshot({ encoding: 'base64', type: 'png', clip: r }); };
const pageCalc = (P, fn, ...a) => P.p.evaluate(fn, ...a);
const IMGLIB = `window.__qaImg = async (urls) => { const ld = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; }); const I = await Promise.all(urls.map(ld));
  const M = window.__qaMask, w = M.w, h = M.h, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true });
  const D = I.map(i => { g.drawImage(i, 0, 0, w, h); return g.getImageData(0, 0, w, h).data; });
  const mk = (x, y) => { const j = ((h - 1 - y) * w + x) * 4; return { grp: Math.round(M.buf[j] / 255 * 4), up: M.buf[j + 1] > 200 ? 1 : M.buf[j + 1] > 90 ? -1 : 0, dist: M.buf[j + 2] / 255 * 100 }; };
  return { w, h, D, mk }; };`;

/* ---------- flicker ---------- */
async function flicker(P, tag, views) {
  await P.p.evaluate(IMGLIB); if (process.env.SAVE) await P.p.evaluate(() => { window.__qaSave = true; });
  for (const [v, low] of views) {
    if (process.env.FL && !(tag + ':' + v).includes(process.env.FL)) continue;
    await go(P, v, low);
    const cover = await maskPass(P);
    const S = [];
    for (let k = 0; k < 6; k++) {
      await P.p.evaluate((k, MV) => { const c = KHXR.camera, t = KHXR.controls.target; if (!c.userData.p0) { c.userData.p0 = c.position.clone(); c.userData.t0 = t.clone(); } const r = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quaternion);   // 보는 곳도 같이 옮긴다(실내 걷기는 보는 곳이 눈 바로 앞이라 눈만 옮기면 시선이 돈다)
        c.position.copy(c.userData.p0).addScaledVector(r, k * MV); t.copy(c.userData.t0).addScaledVector(r, k * MV); c.updateMatrixWorld(); }, k, MV);
      await P.p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 4 ? r() : requestAnimationFrame(f)); f(); }));
      S.push(await shot(P));
    }
    await P.p.evaluate(() => { const c = KHXR.camera; c.position.copy(c.userData.p0); KHXR.controls.target.copy(c.userData.t0); delete c.userData.p0; delete c.userData.t0; });
    const r = await P.p.evaluate(async S => {
      const { w, h, D, mk } = await window.__qaImg(S); const band = { near: [0, 0, 0], mid: [0, 0, 0], far: [0, 0, 0] };
      const fl = (x, y) => { if (x < 4 || y < 4 || x >= w - 4 || y >= h - 4) return false; const m0 = mk(x, y); if (m0.up !== 1 || m0.grp === 4 || m0.dist < 1.5) return false; /* 1.5m 안은 카메라 이동이 실제 움직임으로 보인다 */ for (let a = -4; a <= 4; a += 2) for (let c = -4; c <= 4; c += 2) { const q = mk(x + c, y + a); if (q.up !== 1 || Math.abs(q.dist - m0.dist) > 0.04 * m0.dist + 0.1) return false; } return true; }; /* 이웃 화소의 거리가 매끄럽게 이어지는 면만(책상 윗면과 그 뒤 바닥의 경계 같은 단차 제외) */
      for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) { if (!fl(x, y)) continue; const m = mk(x, y);
        const b = m.dist < 8 ? 'near' : m.dist < 25 ? 'mid' : 'far', i = (y * w + x) * 4; let a = 0;
        for (let k = 1; k < D.length; k++) a += Math.abs((D[k][i] + D[k][i + 1] + D[k][i + 2]) - (D[k - 1][i] + D[k - 1][i + 1] + D[k - 1][i + 2])) / 3;
        a /= D.length - 1; band[b][0] += a; band[b][1]++; if (a > 12) band[b][2]++; }
      // 화면 전체(나무 제외): 형상 가장자리(차선·줄눈·창틀)의 자글거림을 포함한 값
      let as = 0, an = 0, ah = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const m = mk(x, y); if (m.grp === 4 || (m.dist > 0 && m.dist < 1.5)) continue; /* 1.5m 안은 실제 움직임 */ const i = (y * w + x) * 4; let a = 0;
        for (let k = 1; k < D.length; k++) a += Math.abs((D[k][i] + D[k][i + 1] + D[k][i + 2]) - (D[k - 1][i] + D[k - 1][i + 1] + D[k - 1][i + 2])) / 3; a /= D.length - 1; as += a; an++; if (a > 12) ah++; }
      if (window.__qaSave) { const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const g2 = cv2.getContext('2d'), id = g2.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; let a = 0; for (let k = 1; k < D.length; k++) a += Math.abs((D[k][i] + D[k][i + 1] + D[k][i + 2]) - (D[k - 1][i] + D[k - 1][i + 1] + D[k - 1][i + 2])) / 3; a /= D.length - 1;
          const f = fl(x, y); id.data[i] = Math.min(255, a * 12); id.data[i + 1] = f ? 90 : D[0][i + 1] * 0.25; id.data[i + 2] = f ? 0 : D[0][i + 2] * 0.25; id.data[i + 3] = 255; } g2.putImageData(id, 0, 0); window.__qaHeat = cv2.toDataURL(); }
      const o = { all: { flick: +(as / an).toFixed(2), hiPct: +(ah / an * 100).toFixed(2) } }; for (const [k, [s, n, hi]] of Object.entries(band)) o[k] = n > 200 ? { flick: +(s / n).toFixed(2), hiPct: +(hi / n * 100).toFixed(2), px: n } : null; return o;
    }, S);
    const key = tag + ':' + v + (low ? '-low' : '');
    if (process.env.SAVE) { const png = await P.p.evaluate(() => window.__qaHeat); if (png) fs.writeFileSync(OUT + 'flick-' + key.replace(/:/g, '-') + '.png', Buffer.from(png.split(',')[1], 'base64')); }
    res.flicker[key] = { ...r, cover };
    console.log('flicker', key, JSON.stringify(r));
  }
}

/* ---------- alias: 같은 화면을 1배와 4배(초표본)로 그려 바닥 화소의 차이를 잰다 ----------
   움직임과 무관한 '앨리어싱 에너지'. 걸을 때의 자글거림(시간 깜빡임)은 이 값에 비례한다. 후처리(SSAO 등) 없이 장면만 그린다 */
async function alias(P, tag, views) {
  for (const [v, low] of views) {
    await go(P, v, low);
    const W = 960, H = await P.p.evaluate(() => Math.round(960 * KHXR.renderer.domElement.height / KHXR.renderer.domElement.width));
    await maskPass(P, [W, H]);
    const r = await P.p.evaluate((W, H) => {
      const R = KHXR.renderer, S = KHXR.scene, C = KHXR.camera, T = THREE, F = 4;
      const draw = (w, h) => { const rt = new T.WebGLRenderTarget(w, h); rt.texture.encoding = T.sRGBEncoding; const sob = S.onBeforeRender; S.onBeforeRender = () => {};
        R.setRenderTarget(rt); R.clear(); R.render(S, C); const b = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, b); R.setRenderTarget(null); S.onBeforeRender = sob; rt.dispose(); return b; };
      const lo = draw(W, H), hi = draw(W * F, H * F), M = window.__qaMask.buf;
      // 화소별 밝기 차(1배 - 4배 평균). 밉맵 흐림처럼 넓게 고른 차이는 빼고(3×3 평균을 뺀 고주파만) 앨리어싱만 남긴다
      const D = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = (y * W + x) * 4; let r = 0, g = 0, bl = 0;
        for (let yy = 0; yy < F; yy++) for (let xx = 0; xx < F; xx++) { const k = ((y * F + yy) * W * F + x * F + xx) * 4; r += hi[k]; g += hi[k + 1]; bl += hi[k + 2]; }
        const n = F * F; D[y * W + x] = (lo[j] * 0.2126 + lo[j + 1] * 0.7152 + lo[j + 2] * 0.0722) - (r * 0.2126 + g * 0.7152 + bl * 0.0722) / n; }
      const band = { near: [0, 0, 0], mid: [0, 0, 0], far: [0, 0, 0] }; const E = new Float32Array(W * H);
      // 바닥 판정은 가장자리 2화소를 깎는다(물체 윤곽·수평선의 형상 앨리어싱은 바닥 질감 문제가 아니므로 뺀다)
      const isF = i => { const j = i * 4; return M[j + 1] >= 200 && Math.round(M[j] / 255 * 4) !== 4; };
      const inner = (x, y) => { const i = y * W + x, d0 = M[i * 4 + 2]; for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) { const q = i + a * W + c; if (!isF(q) || Math.abs(M[q * 4 + 2] - d0) > 3) return false; } return true; };
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const j = (y * W + x) * 4, i = y * W + x; if (!isF(i) || !inner(x, y)) continue;
        let m = 0; for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) m += D[i + a * W + c]; const d = Math.abs(D[i] - m / 9); E[i] = d;
        const dist = M[j + 2] / 255 * 100, b = dist < 8 ? 'near' : dist < 25 ? 'mid' : 'far';
        band[b][0] += d; band[b][1]++; if (d > 8) band[b][2]++; }
      window.__qaErr = { W, H, E, lo };
      const o = {}; for (const [k, [s, n, hi2]] of Object.entries(band)) o[k] = n > 200 ? { err: +(s / n).toFixed(2), hiPct: +(hi2 / n * 100).toFixed(2), px: n } : null; return o;
    }, W, H);
    const key = tag + ':' + v + (low ? '-low' : '');
    if (process.env.SAVE) { const png = await P.p.evaluate(() => { const { W, H, E, lo } = window.__qaErr, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), id = g.createImageData(W, H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = ((H - 1 - y) * W + x) * 4, i = y * W + x, j = i * 4; id.data[k] = Math.min(255, E[i] * 12); id.data[k + 1] = lo[j + 1] * 0.35; id.data[k + 2] = 0; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return cv.toDataURL(); });
      fs.writeFileSync(OUT + 'alias-' + tag + '-' + v + (low ? '-low' : '') + (process.env.TAG || '') + '.png', Buffer.from(png.split(',')[1], 'base64')); }
    res.alias[key] = r; console.log('alias', key, JSON.stringify(r).replace(/,"px":\d+/g, ''));
  }
}
/* ---------- still ---------- */
async function still(P) {
  await P.p.evaluate(IMGLIB);
  const lumOf = async (sel) => P.p.evaluate(async (S, sel) => { const { w, h, D, mk } = await window.__qaImg([S]); const d = D[0]; const acc = {}; const all = [];
    let sat = 0, n = 0; const grp = { 1: [], 2: [], 3: [], 4: [] }; let ceilN = 0, ceilBlack = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const i = (y * w + x) * 4, L = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722); n++; all.push(L);
      if (Math.min(d[i], d[i + 1], d[i + 2]) >= 250) sat++; const m = mk(x, y); if (grp[m.grp]) grp[m.grp].push(L); if (m.up === -1 && m.grp === 1) { ceilN++; if (L < 14) ceilBlack++; } }
    const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null, pct = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
    return { lum: +mean(all).toFixed(1), satPct: +(sat / n * 100).toFixed(2), ours: grp[1].length > 100 ? +mean(grp[1]).toFixed(1) : null, ctx: grp[2].length > 100 ? +mean(grp[2]).toFixed(1) : null,
      ground: grp[3].length > 100 ? +mean(grp[3]).toFixed(1) : null, trees: grp[4].length > 100 ? { mean: +mean(grp[4]).toFixed(1), cv: +(Math.sqrt(mean(grp[4].map(v => (v - mean(grp[4])) ** 2))) / mean(grp[4])).toFixed(3) } : null,
      ctxP90P10: grp[2].length > 400 ? +((pct(grp[2], 0.9) + 1) / (pct(grp[2], 0.1) + 1)).toFixed(2) : null, ceilBlackPct: ceilN > 400 ? +(ceilBlack / ceilN * 100).toFixed(2) : null };
  }, await shot(P), sel);
  // 시간대 바꾸기: 그 시간대 굽기가 실제로 쓰일 때까지(굽기 이미지 받기) 기다린 뒤 2.5초 더
  const tod = async t => { await P.p.evaluate(t => { const e = document.getElementById('tod-' + t); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, t);
    await P.p.waitForFunction(t => KHPRLayer.bake && KHPRLayer.bake.slot === t && KHPRLayer.bake.u.on.value === 1, { timeout: 30000 }, t).catch(() => {}); await wait(2500); };
  const st = res.still;
  await go(P, 'out'); await maskPass(P); st.out_pm = await lumOf();
  await tod('sunset'); await go(P, 'out'); await maskPass(P); st.out_sunset = await lumOf();
  await tod('night'); await go(P, 'out'); await maskPass(P); st.out_night = await lumOf();
  await tod('pm');
  for (const v of ['1F', '5F', 'B1']) { await go(P, v); await maskPass(P); st['in_' + v] = await lumOf(); }
  // 잎 앞뒤: 앞면·뒷면 색이 다르면 한 화면 안 잎 휘도가 두 무리로 갈라져 변동계수(표준편차/평균)가 커진다. 길 위 시점과 모서리 보기에서 잰다
  await go(P, 'street'); await maskPass(P); const A = await lumOf();
  st.leaf = { street: A.trees, out: st.out_pm.trees };
  // 이웃 명도 편차: 조감(원경)
  await P.p.evaluate(() => { const b = document.getElementById('v-apt'); b && b.click(); }); await wait(3500); await maskPass(P); st.aerial = await lumOf();
  const s = res.still;
  s.derived = { nightOursOverCtx: s.out_night.ours && s.out_night.ctx ? +(s.out_night.ours / s.out_night.ctx).toFixed(2) : null,
    sunsetVsPm: +((s.out_sunset.lum - s.out_pm.lum) / s.out_pm.lum * 100).toFixed(1),
    sunsetVsPmBldGround: s.out_pm.ours && s.out_sunset.ours ? +(((s.out_sunset.ours + (s.out_sunset.ground || 0)) - (s.out_pm.ours + (s.out_pm.ground || 0))) / (s.out_pm.ours + (s.out_pm.ground || 0)) * 100).toFixed(1) : null,
    ctxSpread: s.aerial.ctxP90P10, satMaxPct: Math.max(...['out_pm', 'out_sunset', 'out_night', 'in_1F', 'in_5F', 'in_B1'].map(k => s[k].satPct)),
    ceilBlackMaxPct: Math.max(...['in_1F', 'in_5F', 'in_B1'].map(k => s[k].ceilBlackPct || 0)), soffitBlackSunsetPct: s.out_sunset.ceilBlackPct, leafCV: Math.max(s.leaf.street ? s.leaf.street.cv : 0, s.leaf.out ? s.leaf.out.cv : 0) };
  console.log('still', JSON.stringify(s.derived));
}
/* ---------- base 스크린샷 ---------- */
async function baseShots(P) {
  const list = [['out'], ['street'], ['1F'], ['5F'], ['B1'], ['B3']];
  for (const [v] of list) { await go(P, v); const f = 'qa-shots/' + v + '.jpg'; await P.p.screenshot({ path: OUT + f, type: 'jpeg', quality: 80 }); res.shots.push(f); }
  await P.p.evaluate(() => { const e = document.getElementById('tod-night'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(4500);
  await go(P, 'out'); await P.p.screenshot({ path: OUT + 'qa-shots/out-night.jpg', type: 'jpeg', quality: 80 }); res.shots.push('qa-shots/out-night.jpg');
  await P.p.evaluate(() => { const e = document.getElementById('tod-pm'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(3000);
  // 미성아파트·신사중 라인 현재/미래(추정), 미성아파트 방향 조감
  const ms = v => P.p.evaluate(v => { const e = document.getElementById('ms-' + v); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  await P.p.evaluate(() => document.getElementById('v-apt').click()); await wait(3500);
  for (const v of ['now', 'future']) { await ms(v); await wait(2500); await P.p.screenshot({ path: OUT + 'qa-shots/apt-' + v + '.jpg', type: 'jpeg', quality: 80 }); res.shots.push('qa-shots/apt-' + v + '.jpg'); }
  await ms('now'); await wait(1500);
}
/* ---------- UI ---------- */
async function ui() {
  for (const dev of ['pc', 'phone']) {
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const bad = []; p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(BASE, '')); });
    if (dev === 'phone') await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    else await p.setViewport({ width: 1280, height: 720 });
    await p.evaluateOnNewDocument(() => { try { localStorage.removeItem('khpr.perf'); } catch (e) {} });
    await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + QS, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.plants != null, { timeout: 240000 }); await wait(2500);
    const r = await p.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
      const hit = (a, c) => a && c && a.l < c.r - 1 && a.r > c.l + 1 && a.t < c.b - 1 && a.b > c.t + 1;
      const B = { panel: box('#pr-panel'), compass: box('#compass'), bar: box('#khxr-bar'), views: box('#views') || box('.views'), menu: box('#menuBtn') };
      const pairs = [['panel', 'compass'], ['panel', 'bar'], ['bar', 'compass'], ['panel', 'menu']].filter(([a, c]) => hit(B[a], B[c])).map(x => x.join('×'));
      const st = document.getElementById('pr-stat');
      return { overlaps: pairs, mpBtn: !!document.getElementById('khxr-mp'), fps: !!(document.getElementById('pr-fps') && document.getElementById('pr-fps').isConnected), statVisible: !!(st && !st.hidden && st.textContent), xrFps: !!(KHXRLayer.fps && KHXRLayer.fps.on) };
    });
    res.ui[dev] = { ...r, errors: errs.slice(0, 5), http4xx: [...new Set(bad)].slice(0, 6) };
    console.log('ui', dev, JSON.stringify(res.ui[dev]));
    await p.close();
  }
}
/* ---------- 텍스처 메모리 ---------- */
const memEst = P => P.p.evaluate(() => {
  const seen = new Set(); let bytes = 0, n = 0;
  KHXR.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { for (const k in m) { const t = m[k]; if (!t || !t.isTexture || seen.has(t)) continue; seen.add(t); n++;
    if (t.isCompressedTexture && t.mipmaps && t.mipmaps.length) bytes += t.mipmaps.reduce((s, mm) => s + (mm.data ? mm.data.byteLength : 0), 0);
    else { const i = t.image; const w = i && (i.width || i.videoWidth) || 0, h = i && (i.height || i.videoHeight) || 0; bytes += w * h * 4 * (t.generateMipmaps !== false ? 1.333 : 1) * (t.isCubeTexture ? 6 : 1); } } }); });
  return { textures: n, MB: +(bytes / 1e6).toFixed(1) };
});

const pc = await open('pc');
if (ONLY.has('mem')) { res.mem = await memEst(pc); console.log('mem', JSON.stringify(res.mem)); }
if (ONLY.has('flicker')) await flicker(pc, 'pc', [['street'], ['1F'], ['B1'], ['5F'], ['1F', true], ['B1', true]]);
if (ONLY.has('alias')) await alias(pc, 'pc', [['street'], ['out'], ['1F'], ['B1'], ['5F'], ['1F', true], ['B1', true], ['5F', true]]);
if (ONLY.has('still')) await still(pc);
if (ONLY.has('base')) await baseShots(pc);
res.errors.push(...pc.errs.map(e => 'pc ' + e)); await pc.p.close();
if (ONLY.has('flicker')) {
  const ph = await open('phone'); await flicker(ph, 'phone', [['street'], ['1F'], ['B1']]); res.errors.push(...ph.errs.map(e => 'phone ' + e)); await ph.p.close();
  const ey = await open('eye'); await flicker(ey, 'eye', [['street'], ['1F'], ['B1'], ['5F']]); res.errors.push(...ey.errs.map(e => 'eye ' + e)); await ey.p.close();
}
if (ONLY.has('ui')) await ui();
fs.writeFileSync(OUT + 'qmetrics.json', JSON.stringify(res, null, 1));
console.log('끝', res.errors.length ? '오류 ' + res.errors.length : '오류 0');
await b.close();
