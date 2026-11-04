// 기기·화면 크기 시험(1102.s): node devices.mjs  (BASE=주소, 기본 http://localhost:8791, SHOTS=폴더 → 기기별 화면 저장)
// 아이폰 SE(375×667)·아이폰 13(390×844)·픽셀 7(412×915)·아이패드 미니(768×1024)·아이패드 프로(1024×1366)를 세로로 열어 '렌더'(실사 3D, ?pr=1)가
// 빈 화면 없이 뜨는지, 화면 가로 넘침이 없는지, 주요 조작(실사 패널·나침반·VR 버튼 줄·위쪽 버튼 줄)이 서로 겹치거나 화면 밖으로 잘리지 않는지 보고,
// 휴대폰은 가로로 돌려 같은 검사를 다시 한다. 터치 한 번 누르기, 자동 품질 단계, 메모리(JS 힙·GPU 텍스처 수)를 적는다.
// 마지막으로 WebGL2 가 없는 기기를 흉내 내 '렌더'를 고르면 멈추거나 빈 화면 없이 안내가 뜨고 스케치업으로 돌아가는지 본다.
// 흉내의 한계: 사파리 고유 동작(KTX2 형식 선택, iOS 탭 메모리 한도로 탭이 다시 열리는 것)은 크롬 흉내로 잡히지 않는다(docs/device-checklist.md 의 실기기 항목)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791', SHOTS = process.env.SHOTS || null;
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true }); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const DEV = [['iphone-se', 375, 667, 2, IOS, true], ['iphone-13', 390, 844, 3, IOS, true], ['pixel-7', 412, 915, 2.625, AND, true], ['ipad-mini', 768, 1024, 2, IPAD, false], ['ipad-pro', 1024, 1366, 2, IPAD, false]];
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const res = { at: new Date().toISOString(), runs: [] }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const wait = ms => new Promise(r => setTimeout(r, ms));
// 주요 조작 상자: 실사 패널, 나침반, VR·멀티 버튼 줄, 위쪽 왼쪽('내부 보기' 줄)·오른쪽('메뉴' 줄) 버튼 줄
const layout = p => p.evaluate(() => {
  const box = e => { if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; if (e._v) return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; const s = getComputedStyle(e); if (s.visibility === 'hidden' || +s.opacity === 0) return null; return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const row = txt => { const bt = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === txt && x.getClientRects().length); if (!bt) return null; const bs = [...bt.parentElement.children].filter(c => c.getClientRects().length); const rs = bs.map(c => c.getBoundingClientRect()); return { getClientRects: () => [1], getBoundingClientRect: () => ({ left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)), width: 9, height: 9 }), nodeType: 1, _v: true }; };   /* 줄 = 보이는 버튼들을 감싼 상자(부모 상자는 화면 폭 전체라 겹친 것으로 보였다) */
  const el = { panel: document.getElementById('pr-panel'), compass: document.getElementById('compass'), bar: document.getElementById('khxr-bar'), topL: row('내부 보기'), topR: row('메뉴') || row('메뉴 ▴') };
  const B = {}; for (const [k, e] of Object.entries(el)) B[k] = box(e);
  const se = document.scrollingElement, cv = document.querySelector('canvas'), cr = cv && cv.getBoundingClientRect();
  return { B, vw: innerWidth, vh: innerHeight, scrollW: se.scrollWidth, canvas: cr ? [Math.round(cr.width), Math.round(cr.height)] : null };
});
const check = L => { const ks = Object.keys(L.B).filter(k => L.B[k]), hit = (a, c) => a.l < c.r - 1 && a.r > c.l + 1 && a.t < c.b - 1 && a.b > c.t + 1, over = [], clip = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (hit(L.B[ks[i]], L.B[ks[j]])) over.push(ks[i] + '×' + ks[j]);
  for (const k of ks) { const r = L.B[k]; if (r.l < -1 || r.t < -1 || r.r > L.vw + 1 || r.b > L.vh + 1) clip.push(k); }
  return { over, clip, hscroll: L.scrollW > L.vw + 1, canvasOk: !!L.canvas && L.canvas[0] >= L.vw - 2 && L.canvas[1] >= L.vh * 0.5, seen: ks }; };
for (const [name, w, h, dpr, ua, phone] of DEV) {
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.emulate({ viewport: { width: w, height: h, deviceScaleFactor: dpr, isMobile: true, hasTouch: true }, userAgent: ua });
  const t0 = Date.now();
  await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0', { waitUntil: 'load', timeout: 180000 });
  const ready = await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.firstFrame != null && KHPRLayer.t.warm != null, { timeout: 300000 }).then(() => true).catch(() => false);
  const tReady = Date.now() - t0; await wait(2500);
  const L1 = await layout(p), c1 = check(L1);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-portrait.jpg`, type: 'jpeg', quality: 70 });
  // 화면 가운데 한 번 누르기(터치)
  await p.touchscreen.tap(Math.round(w / 2), Math.round(h / 2)); await wait(800);
  const info = await p.evaluate(() => { const R = KHXR.renderer, m = performance.memory; let lum = 0; try { const c = R.getContext(), px = new Uint8Array(4 * 9); } catch (e) {}
    return { q: KHPRLayer.q && (KHPRLayer.q.name || KHPRLayer.q.key || null), qline: (KHPRLayer.diagLine && KHPRLayer.diagLine() || '').slice(0, 80), heapMB: m ? Math.round(m.usedJSHeapSize / 1048576) : null, tex: R.info.memory.textures, geo: R.info.memory.geometries, calls: R.info.render.calls, vmode: (document.querySelector('input[name=vmode]:checked') || {}).value }; });
  // 빈 화면 검사: 화면 가운데 띠의 밝기 표준편차(한 가지 색이면 0 에 가깝다)
  const stdOf = async () => { const u = 'data:image/jpeg;base64,' + await p.screenshot({ type: 'jpeg', quality: 60, encoding: 'base64' }); return p.evaluate(async u => { const i = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = u; }); const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const g = cv.getContext('2d'); g.drawImage(i, 0, 0, 64, 64); const d = g.getImageData(0, 16, 64, 32).data; let s = 0, s2 = 0, n = 0; for (let k = 0; k < d.length; k += 4) { const L = (d[k] + d[k + 1] + d[k + 2]) / 3; s += L; s2 += L * L; n++; } const mu = s / n; return +Math.sqrt(Math.max(0, s2 / n - mu * mu)).toFixed(1); }, u); };
  const flat = await stdOf();   // 화면 가운데 띠의 밝기 표준편차(한 가지 색이면 0 에 가깝다)
  let c2 = null;
  if (phone) { await p.setViewport({ width: h, height: w, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, isLandscape: true }); await wait(2500); c2 = check(await layout(p)); if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-landscape.jpg`, type: 'jpeg', quality: 70 }); }
  const r = { name, w, h, dpr, ready, tReady, portrait: c1, landscape: c2, info, flatStd: flat, errs };
  res.runs.push(r); console.log(name, JSON.stringify(r));
  await p.close();
}
for (const r of res.runs) {
  ok(`${r.name}: 렌더(실사 3D) 뜸·빈 화면 아님`, r.ready && r.flatStd > 4 && r.info.vmode === 'real', { t: r.tReady, std: r.flatStd, q: r.info.q });
  ok(`${r.name}: 세로 겹침·잘림·가로 넘침 없음`, !r.portrait.over.length && !r.portrait.clip.length && !r.portrait.hscroll && r.portrait.canvasOk, r.portrait);
  if (r.landscape) ok(`${r.name}: 가로로 돌려도 겹침·잘림·가로 넘침 없음`, !r.landscape.over.length && !r.landscape.clip.length && !r.landscape.hscroll && r.landscape.canvasOk, r.landscape);
  ok(`${r.name}: 페이지 오류 없음`, !r.errs.length, r.errs.slice(0, 2));
}
// WebGL2 가 없는 기기: '렌더'를 골라도 멈추지 않고 안내 + 스케치업 유지
{
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: IOS });
  await p.evaluateOnNewDocument(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { if (t === 'webgl2') return null; return g.call(this, t, o); }; });
  await p.goto(BASE + '/new/3d-model.html?prsw=0', { waitUntil: 'load', timeout: 180000 }); await wait(8000);
  await p.evaluate(() => { const e = document.getElementById('vm-real'); if (e) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } });
  await wait(6000);
  const st = await p.evaluate(() => ({ pr: !!(window.KHPRLayer && KHPRLayer.on), gl2: KHXR.renderer.capabilities.isWebGL2, vmode: (document.querySelector('input[name=vmode]:checked') || {}).value, note: (document.getElementById('pr-gate-note') || {}).textContent || '', r3d: KHXR.R3D.on }));
  const u = 'data:image/jpeg;base64,' + await p.screenshot({ type: 'jpeg', quality: 60, encoding: 'base64' }); st.std = await p.evaluate(async u => { const i = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = u; }); const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const g = cv.getContext('2d'); g.drawImage(i, 0, 0, 64, 64); const d = g.getImageData(0, 16, 64, 32).data; let s = 0, s2 = 0, n = 0; for (let k = 0; k < d.length; k += 4) { const L = (d[k] + d[k + 1] + d[k + 2]) / 3; s += L; s2 += L * L; n++; } const mu = s / n; return +Math.sqrt(Math.max(0, s2 / n - mu * mu)).toFixed(1); }, u);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/no-webgl2.jpg`, type: 'jpeg', quality: 70 });
  // WebGL1 로도 그려지면(빈 화면 아님) 그대로 합격, 아니면 안내가 떠야 한다
  ok('WebGL2 없는 기기: 렌더(실사 3D)가 WebGL1 로 그려지거나, 안내가 뜨고 멈추지 않음', errs.length === 0 && ((st.pr && st.std > 4) || (!st.pr && /WebGL2/.test(st.note))), { ...st, errs: errs.slice(0, 2) });
  res.nogl2 = st; await p.close();
}
fs.writeFileSync(OUT + 'devices.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
