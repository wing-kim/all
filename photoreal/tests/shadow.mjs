// 그림자 최신 시험(1102.o): node shadow.mjs  (BASE=주소, 기본 http://localhost:8791)
// 실사 3D 를 켠 뒤 여러 시점(동쪽 골목·대지 위·북동 골목·압구정로)으로 옮겨 다니며, 화면을 찍고 그림자를 강제로 다시 그린 화면과 비교한다.
// 다르면 그림자 맵이 예전 상태(카드 나무·바뀌기 전 매스·Wing 가림 전 매스)를 남긴 것이다. 고치기 전(1102.n): 동쪽 골목에 네모 조각·쐐기 그림자,
// 시점 이동 뒤 가림이 바뀐 매스의 그림자가 남음(화소 1.6%)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT + 'qa-shots', { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const res = { at: new Date().toISOString(), views: [] }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null && KHPRLayer.t.env2 != null, { timeout: 240000 }).catch(() => errs.push('준비 시간 초과'));
await p.waitForFunction(() => !KHPRLayer.settling(), { timeout: 120000 }).catch(() => {});
await p.addStyleTag({ content: '.panel,#panel,aside,.side{display:none!important}' });
const clip = { x: 340, y: 80, width: 600, height: 420 };
const shot = () => p.screenshot({ type: 'png', clip, encoding: 'base64' });
// 두 PNG 의 초록 채널 차이가 24 넘는 화소 비율(%): 페이지 안에서 풀어 비교한다(시험 폴더에 그림 모듈이 없어도 되게)
const diff = (A, B) => p.evaluate(async (A, B) => {
  const dec = async s => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height).data; };
  const [a, b] = await Promise.all([dec(A), dec(B)]); let d = 0; for (let i = 1; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 24) d++; return +(d / (a.length / 4) * 100).toFixed(2); }, A, B);
const views = [['east-alley', [45, 70, 0], [45, 0, 0]], ['site-top', [20, 80, -1], [20, 0, 0]], ['ne-alley', [-5, 34, -70], [25, 6, -10]], ['apgujeong', [-75, 2, 0], [0, 8, 0]], ['east-alley-again', [45, 70, 0], [45, 0, 0]]];
for (const [n, c, t] of views) {
  await p.evaluate((c, t) => { const X = KHXR; X.camera.position.set(...c); X.controls.target.set(...t); X.controls.update(); }, c, t);
  await new Promise(r => setTimeout(r, 2500)); const a = await shot();
  await p.evaluate(() => { KHXR.renderer.shadowMap.needsUpdate = true; }); await new Promise(r => setTimeout(r, 900)); const bb = await shot();
  const d = await diff(a, bb); res.views.push({ n, pct: d }); if (process.env.SAVE && n === 'east-alley-again') fs.writeFileSync(OUT + '_shadow-' + process.env.SAVE + '.png', Buffer.from(a, 'base64'));
  if (n === 'east-alley') fs.writeFileSync(OUT + 'qa-shots/shadow-east.png', Buffer.from(bb, 'base64'));
}
const worst = Math.max(...res.views.map(v => v.pct));
ok('그림자가 최신(강제로 다시 그린 화면과 차이 ≤ 0.05%, 시점 ' + res.views.length + '곳)', worst <= 0.05, res.views);
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 3));
fs.writeFileSync(OUT + 'shadow.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
