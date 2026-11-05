// VR 렌더 주변 건물 대조(1102.u, Jack 퀘스트: '렌더'에서 타워 주변 건물이 없거나 엉뚱한 모델로 보임): node vrlook.mjs  (BASE=주소, TAB=new|now|srv)
// 같은 자리·방향을 PC 렌더(실사 3D)와 VR(IWER 퀘스트 3, 실사 3D 켠 채 들어감)로 찍어 나란히 놓는다. 자리는 타워 둘레 길 위 8곳(눈높이 1.6m, 바깥을 봄 4곳·타워를 봄 4곳).
// 각 칸에서 VR 화면에 보이는 주변 건물 묶음 이름별 그리기 수도 적는다(누락: PC 에는 있는데 VR 에서 0, 엉뚱한 모델: 같은 자리에 둘 이상 겹침).
// 결과: out/vrlook/sheet.jpg, out/vrlook.json
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791', TAB = process.env.TAB || 'new';
const OUT = fileURLToPath(new URL('./out/vrlook/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const SPOTS = [];
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.3, r = 30; SPOTS.push({ n: 'out' + i, x: Math.cos(a) * r, z: Math.sin(a) * r, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI }); }   // 바깥을 봄
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 1.0, r = 45; SPOTS.push({ n: 'in' + i, x: Math.cos(a) * r, z: Math.sin(a) * r, yaw: Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI }); }   // 타워를 봄
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist'] });
const open = async () => { const p = await b.newPage(); await p.setViewport({ width: 960, height: 720 }); p.errs = []; p.on('pageerror', e => p.errs.push(String(e).slice(0, 200)));
  await p.goto(BASE + '/new/3d-model.html?xremu=1&prsw=0&pr=1', { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null && !(window.KHENV && KHENV.busy), { timeout: 240000 });
  await p.evaluate(t => { const e = document.querySelector(`input[name=era][value=${t}]`); if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, TAB);
  await p.waitForFunction(() => KHPRLayer.boot === '준비 완료' && !(window.KHENV && KHENV.busy), { timeout: 180000 }).catch(() => {}); await new Promise(r => setTimeout(r, 4000)); return p; };
// 보이는 주변 건물 묶음(지니 khPack·우리 pr-context·Wing city·합친 메시) 그리기 수
const census = () => { const R = KHXR.renderer, o = R.renderBufferDirect, acc = {}; R.renderBufferDirect = function (cam, sc, geo, mat, obj) { let k = null;
    for (let q = obj; q && !k; q = q.parent) { if (q.userData && q.userData.khPack) k = 'jinny:' + q.userData.khPack; else if (q.name === 'pr-context') k = 'ctx'; else if (q.name === 'khxr-proxy') k = 'proxy'; else if (window.KHPRLayer && q === KHPRLayer.K.city) k = 'wingCity'; }
    if (k) acc[k] = (acc[k] || 0) + 1; return o.apply(this, arguments); }; return () => { R.renderBufferDirect = o; return acc; }; };
const res = { tab: TAB, pc: {}, vr: {} };
// PC
{ const p = await open();
  for (const s of SPOTS) {
    await p.evaluate(s => { const c = KHXR.camera, C = KHXR.controls; c.fov = 90; c.updateProjectionMatrix(); c.position.set(s.x, 1.6, s.z); C.target.set(s.x - Math.sin(s.yaw) * 10, 1.6, s.z - Math.cos(s.yaw) * 10); C.update(); }, s);
    await new Promise(r => setTimeout(r, 2500)); await p.evaluate(`window.__cen = (${census.toString()})()`); await new Promise(r => setTimeout(r, 300)); res.pc[s.n] = await p.evaluate(() => window.__cen());
    await p.screenshot({ path: OUT + `pc-${s.n}.jpg`, type: 'jpeg', quality: 70 }); }
  res.pcErr = p.errs; await p.close(); }
// VR
{ const p = await open();
  await p.evaluate(() => KHXRLayer.enter('vr')); await p.evaluate(async () => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 60; i++) await new Promise(r => s.requestAnimationFrame(() => r())); });
  await p.evaluate(() => { const d = KHEMU; d.position.set(0, 1.6, 0); d.quaternion.set(0, 0, 0, 1); });
  for (const s of SPOTS) { await p.evaluate(s => KHXRLayer.teleportTo(new THREE.Vector3(s.x, 0, s.z), s.yaw), s);
    await p.evaluate(async () => { const s = KHXR.renderer.xr.getSession(); const t0 = performance.now(); while (performance.now() - t0 < 3500 || KHXRLayer.loading()) { await new Promise(r => s.requestAnimationFrame(() => r())); if (performance.now() - t0 > 25000) break; } });
    await p.evaluate(`window.__cen = (${census.toString()})()`); await p.evaluate(async () => { const s = KHXR.renderer.xr.getSession(); await new Promise(r => s.requestAnimationFrame(() => r())); await new Promise(r => s.requestAnimationFrame(() => r())); });
    res.vr[s.n] = await p.evaluate(() => window.__cen()); await p.screenshot({ path: OUT + `vr-${s.n}.jpg`, type: 'jpeg', quality: 70 }); }
  res.vrErr = p.errs; await p.close(); }
// 모음
const cmp = await b.newPage(); await cmp.setViewport({ width: 1300, height: 100 });
const img = f => 'data:image/jpeg;base64,' + fs.readFileSync(OUT + f).toString('base64');
await cmp.setContent(`<style>body{margin:0;font:12px sans-serif;background:#fff}td{padding:2px;vertical-align:top}img{width:420px}</style><table><tr><td></td><td>PC 렌더</td><td>VR(에뮬레이터)</td><td>VR 그리기 묶음</td></tr>` +
  SPOTS.map(s => `<tr><td>${s.n}</td><td><img src="${img('pc-' + s.n + '.jpg')}"></td><td><img src="${img('vr-' + s.n + '.jpg')}"></td><td style="width:200px">${Object.entries(res.vr[s.n] || {}).map(([k, v]) => k + ' ' + v).join('<br>')}</td></tr>`).join('') + '</table>');
await new Promise(r => setTimeout(r, 500)); await cmp.screenshot({ path: OUT + 'sheet.jpg', type: 'jpeg', quality: 65, fullPage: true });
fs.writeFileSync(fileURLToPath(new URL('./out/vrlook.json', import.meta.url)), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 0).slice(0, 3000));
await b.close();
