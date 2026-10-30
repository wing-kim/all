// 실사 3D 의 XR 예산 점검(IWER Quest 3 에뮬레이터, 헤드리스 Chrome): node xr.mjs
// XR 계층(xr/kh-xr.js)이 같은 장면을 그대로 그리므로, 실사 3D 를 켠 채 몰입 모드에 들어가 그리기 호출·삼각형을 잰다(양안 합계).
// 실제 퀘스트 프레임 시간은 기기에서만 잴 수 있다(이 시험은 예산 수치만 본다).
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&pr=1&pf=glass', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null, { timeout: 60000 });
const ev = (f, ...a) => p.evaluate(f, ...a);
const frames = n => ev(async n => { const s = KHXR.renderer.xr.getSession(); let c = 0, t = 0; for (let i = 0; i < n; i++) await new Promise(r => s.requestAnimationFrame(() => r())); c = KHXR.renderer.info.render.calls; t = KHXR.renderer.info.render.triangles; return { calls: c, tris: t }; }, n);
const res = {};
await ev(() => KHXRLayer.enter('vr'));
await frames(20);
res.ext_first = await frames(5);
for (const pf of ['brick', 'stack', 'colonnade', 'glass']) { await ev(pf => document.querySelector(`[data-pf="${pf}"]`).click(), pf); await frames(30); res['ext_' + pf] = await frames(5); }
await p.screenshot({ path: OUT + 'xr-ext.jpg', type: 'jpeg', quality: 80 });
await ev(() => KHXRLayer.goInside()); await frames(60);
res.int_1F = await frames(5);
await p.screenshot({ path: OUT + 'xr-1F.jpg', type: 'jpeg', quality: 80 });
for (const k of ['B1', 'B2', 'B3']) { await ev(k => KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === k)), k); await frames(60); res['int_' + k] = await frames(5); }
await p.screenshot({ path: OUT + 'xr-B3.jpg', type: 'jpeg', quality: 80 });
res.opt = await ev(() => KHXRLayer.opt.stat);
res.errors = errs;
fs.writeFileSync(OUT + 'xr.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await b.close();
