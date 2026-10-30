// 실사 3D 측정: node measure.mjs [pc|mobile]  (BASE=주소, 기본 http://localhost:8791)
// 빈 캐시로 페이지를 열고 → '실사 3D' 켜기 → 우선 조합 4종 전환 → 외관·1층·B1～B3 화면을 찍고, 시간과 그리기 호출을 out/measure-<기기>.json 에 남긴다
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const dev = process.argv[2] || 'pc';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.startsWith(dev + '-')) fs.unlinkSync(OUT + f);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const p = await b.newPage();
if (dev === 'mobile') await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
else await p.setViewport({ width: 1600, height: 900 });
await p.setCacheEnabled(process.env.WARM === '1');
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const res = { dev, base: BASE, at: new Date().toISOString() };
const t0 = Date.now();
await p.goto(BASE + '/new/3d-model.html' + (process.env.QS || ''), { waitUntil: 'load', timeout: 120000 });
res.pageLoad = Date.now() - t0;
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.K && document.getElementById('vm-pr'), { timeout: 60000 });
res.wingReady = Date.now() - t0;
const frames = n => `await new Promise(r=>{let k=0;const f=()=>{if(++k>=${n})r();else requestAnimationFrame(f)};requestAnimationFrame(f)})`;
const shot = async n => { await p.evaluate(new Function(`return (async()=>{${frames(3)}})()`)); await p.screenshot({ path: OUT + dev + '-' + n + '.jpg', type: 'jpeg', quality: 82 }); };
// 우선 조합의 원본 렌더 모드 화면(비교용)
await p.evaluate(() => { const c = id => { const e = document.getElementById(id); if (!e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }; c('sch-alt4'); c('g1-skin'); const u = document.getElementById('t-upstraight'); if (!u.checked) { u.checked = true; u.dispatchEvent(new Event('change', { bubbles: true })); } c('vm-render'); });
await shot('0-wing-render');
res.wingRenderInfo = await p.evaluate(() => KHPRLayer.frameInfo());
// 켜기
res.enable = await p.evaluate(new Function(`return (async()=>{const t=performance.now();const e=document.getElementById('vm-pr');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));const sync=performance.now()-t;${frames(2)};const first=performance.now()-t;
  const t1=performance.now();while((KHPRLayer.t.assets==null||KHPRLayer.t.dress==null||KHPRLayer.t.env==null||KHPRLayer.t.warm==null)&&performance.now()-t1<60000)await new Promise(r=>setTimeout(r,50));${frames(2)};
  return {syncMs:Math.round(sync),firstFrameMs:Math.round(first),assetsMs:KHPRLayer.t.assets,envMs:KHPRLayer.t.env,dressMs:KHPRLayer.t.dress,warmMs:KHPRLayer.t.warm,allReadyMs:Math.round(performance.now()-t)}})()`));
await shot('1-glass');
res.info = {};
const info = async k => { res.info[k] = await p.evaluate(async () => { const d = KHPRLayer.diag(); const f = await KHPRLayer.frameInfo(); return { calls: f.calls, tris: f.tris, programs: f.programs, mats: d.mats, textures: d.textures, warm: d.t.warm, swap: d.stat.swap }; }); };
await info('glass');
// 조합 전환: 패널 버튼 → 두 프레임 뒤까지
res.switch = {};
for (const pf of ['brick', 'stack', 'colonnade', 'glass', 'brick']) {
  const r = await p.evaluate(new Function(`return (async()=>{const t=performance.now();document.querySelector('[data-pf="${pf}"]').click();const sync=performance.now()-t;${frames(2)};return {syncMs:Math.round(sync),toFrameMs:Math.round(performance.now()-t),programs:KHXR.renderer.info.programs.length}})()`));
  (res.switch[pf] = res.switch[pf] || []).push(r);
  if (!fs.existsSync(OUT + dev + '-1-' + pf + '.jpg')) { await shot('1-' + pf); for (const v of ['front', 'stair']) { await p.evaluate(v => KHXR.go(v, true), v); await shot('1-' + pf + '-' + v); } await p.evaluate(() => KHXR.go('corner', true)); }
  await info(pf);
}
// 주차 방식을 바꿨다 돌아오기(건물 전체 재생성)
res.parkSwitch = await p.evaluate(new Function(`return (async()=>{const go=async id=>{const t=performance.now();const e=document.getElementById(id);e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));${frames(2)};return Math.round(performance.now()-t)};return {toMech:await go('sch-mech'),backToAlt4:await go('sch-alt4')}})()`));
// 층 보기
for (const lv of ['1F', 'B1', 'B2', 'B3']) {
  const r = await p.evaluate(new Function(`return (async()=>{const t=performance.now();document.querySelector('[data-lv="${lv}"]').click();${frames(30)};return {ms:Math.round(performance.now()-t)}})()`));
  res['level_' + lv] = r;
  await shot('2-' + lv);
  await info(lv);
}
await p.evaluate(() => document.querySelector('[data-lv="out"]').click());
res.errors = errs.slice(0, 20);
fs.writeFileSync(OUT + 'measure-' + dev + '.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await b.close();
