// 그래픽 컨텍스트 손실 복구(T6) 시험: node ctxloss.mjs  (BASE=주소, 기본 http://localhost:8791)
// 실사 3D 를 켠 뒤 WEBGL_lose_context 로 잃었다가 되살리고, 화면이 다시 정상(하늘·건물)인지와 콘솔 오류가 없는지 본다. 외관과 B1 두 장면
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null, { timeout: 120000 });
const ev = (f, ...a) => p.evaluate(f, ...a), wait = ms => new Promise(r => setTimeout(r, ms));
await wait(2000);
const res = { base: BASE, at: new Date().toISOString(), checks: [] };
const ok = (name, pass, info) => { res.checks.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(info)); };
// 화면을 작게 읽어 평균 밝기와 직전 화면과의 차이
const grab = () => ev(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 3; i++) await raf();
  KHPRLayer.K.R3D.composer.render(); const c = KHXR.renderer.domElement, cv = document.createElement('canvas'); cv.width = 160; cv.height = 90; const g = cv.getContext('2d'); g.drawImage(c, 0, 0, 160, 90);
  return Array.from(g.getImageData(0, 0, 160, 90).data);
});
const cmp = (a, c) => { let s = 0, l = 0; for (let i = 0; i < a.length; i += 4) { s += (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2])) / 3; l += (c[i] + c[i + 1] + c[i + 2]) / 3; } const n = a.length / 4; return { diff: +(s / n).toFixed(1), lum: +(l / n).toFixed(1) }; };
const lose = async () => {
  await ev(async () => { const x = KHXR.renderer.getContext().getExtension('WEBGL_lose_context'); window.__lc = x; x.loseContext(); });
  await wait(600);
  await ev(() => window.__lc.restoreContext());
  await wait(3500);
};
for (const lv of ['out', 'B1']) {
  await ev(lv => document.querySelector(`[data-lv="${lv}"]`).click(), lv); await wait(3000);
  const a = await grab(); await lose(); const c = await grab(), r = cmp(a, c);
  ok(`${lv}: 복구 뒤 화면이 손실 전과 비슷함(평균 차 < 12, 밝기 > 20)`, r.diff < 12 && r.lum > 20, { ...r, restored: await ev(() => KHPRLayer.stat.restored) });
}
await ev(() => document.querySelector('[data-lv="out"]').click());
ok('콘솔·페이지 오류 없음', errs.length === 0, errs.slice(0, 6));
res.pass = res.checks.filter(c => c.pass).length + '/' + res.checks.length;
fs.writeFileSync(OUT + 'ctxloss.json', JSON.stringify(res, null, 1));
console.log('결과', res.pass);
await b.close();
