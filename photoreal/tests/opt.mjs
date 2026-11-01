// 화면 메시 합치기(T1) 시험: node opt.mjs  (BASE=주소, 기본 http://localhost:8791)
// 1) 외관 한 프레임 그리기 호출(합치기 켬/끔), 2) 같은 시점 화면 차이(평균 화소 차), 3) 1층 걷기 클릭 목표가 켬/끔에서 같은지
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null && KHPRLayer.t.dress != null, { timeout: 120000 });
const ev = (f, ...a) => p.evaluate(f, ...a);
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(2500);
const res = { base: BASE, at: new Date().toISOString(), checks: [] };
const ok = (name, pass, info) => { res.checks.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(info)); };
// 한 프레임 호출 수(이동 중 기준: SSAO 건너뜀 상태를 만들기 위해 카메라를 살짝 돌린다)
const oneFrame = () => ev(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(r)), C = KHXR.controls; C.autoRotate = true; C.autoRotateSpeed = 2;
  await raf(); await raf(); const inf = KHXR.renderer.info; inf.autoReset = false; inf.reset(); await raf(); const r = { calls: inf.render.calls, tris: inf.render.triangles }; inf.autoReset = true; C.autoRotate = false; return r;
});
// 같은 시점 화면(SSAO 포함, 정지): 합성 단계를 직접 그리고 바로 읽는다
const snap = () => ev(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 4; i++) await raf();
  KHPRLayer.still = true; KHPRLayer.K.R3D.composer.render(); const u = KHXR.renderer.domElement.toDataURL('image/png'); KHPRLayer.still = false; return u;
});
const diff = (a, c) => ev(async (a, c) => {
  const ld = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  const [A, B] = await Promise.all([ld(a), ld(c)]), W = 320, H = Math.round(A.height * 320 / A.width), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.drawImage(A, 0, 0, W, H); const da = g.getImageData(0, 0, W, H).data; g.drawImage(B, 0, 0, W, H); const db = g.getImageData(0, 0, W, H).data;
  let s = 0, big = 0; for (let i = 0; i < da.length; i += 4) { const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3; s += d; if (d > 40) big++; }
  return { mean: +(s / (W * H)).toFixed(2), bigPct: +(big / (W * H) * 100).toFixed(2) };
}, a, c);
const settle = () => wait(1500);
await ev(() => KHPRLayer.optSet(true)); await settle();
const on = await oneFrame(), st = await ev(() => KHPRLayer.stat.opt);
await ev(() => KHPRLayer.optSet(false)); await settle();
const off = await oneFrame();
ok('외관 그리기 호출 1,000 미만(합치기 켬)', on.calls < 1000, { on, off, opt: st });
// 화면 비교: 같은 카메라
await ev(() => { const C = KHXR.controls; C.autoRotate = false; KHXR.go && KHXR.go('corner'); }); await wait(2500);
const imOff = await snap();
await ev(() => KHPRLayer.optSet(true)); await settle();
const imOn = await snap();
const d = await diff(imOff, imOn);
fs.writeFileSync(OUT + 'opt-off.png', Buffer.from(imOff.split(',')[1], 'base64')); fs.writeFileSync(OUT + 'opt-on.png', Buffer.from(imOn.split(',')[1], 'base64'));
ok('합치기 켬/끔 화면 차이 작음(평균 < 3, 큰 차이 화소 < 2%)', d.mean < 3 && d.bigPct < 2, d);
// 1층 걷기 클릭: 같은 화면 위치를 눌렀을 때 걷기 목표가 같은지
const walk = async () => {
  await ev(() => document.querySelector('[data-lv="1F"]').click()); await wait(2500);
  const look = await ev(() => KHXR.I.look);
  const box = await p.$eval('#viewer canvas', c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.72 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.up(); await wait(60);
  const a = await ev(() => { const a = KHXR.anim; return a ? [a.p1.x, a.p1.y, a.p1.z].map(v => +v.toFixed(2)) : null; });
  await wait(1200); await ev(() => document.querySelector('[data-lv="out"]').click()); await wait(2000);
  return { look, target: a };
};
await ev(() => KHPRLayer.optSet(true)); const wOn = await walk();
await ev(() => KHPRLayer.optSet(false)); const wOff = await walk();
ok('1층 걷기 클릭 목표 같음(합치기 켬/끔)', JSON.stringify(wOn.target) === JSON.stringify(wOff.target), { on: wOn, off: wOff });
await ev(() => KHPRLayer.optSet(true));
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 5));
res.pass = res.checks.filter(c => c.pass).length + '/' + res.checks.length;
fs.writeFileSync(OUT + 'opt.json', JSON.stringify(res, null, 1));
console.log('결과', res.pass);
await b.close();
