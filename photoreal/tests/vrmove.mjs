// VR 이동 즉시성(1102.v, Jack: 텔레포트·층 이동마다 '불러오는 중'·검은 화면이 거슬림): node vrmove.mjs  (BASE=주소, CPU=감속 배율, 기본 1)
// 텔레포트 10번(컨트롤러와 같은 경로 KHXRLayer.jumpTo)과 층 이동 10번(goLevel)을 하며 이동마다 잰다:
//  - 첫 화면까지: 명령부터 새 자리로 그린 첫 프레임까지(ms)
//  - 검은 프레임: 전환 효과가 0.5 넘게 검은 프레임 수
//  - 로딩 판: 이동 뒤 3초 안에 판이 보인 적이 있는지
//  - 가장 긴 프레임: 이동 뒤 3초 안
// 합격: 텔레포트는 판 0번·검은 프레임 0, 층 이동은 판 0번(받을 것이 1.5초 넘게 남을 때만 뜨므로)·검은 프레임 0. 퀘스트 조건(창 rAF 의 실사 계층 루프 멈춤)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791', CPU = +(process.env.CPU || 1);
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&prsw=0&pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.dress != null, { timeout: 240000 });
const ev = (f, ...a) => p.evaluate(f, ...a);
await ev(() => KHXRLayer.enter('vr'));
await ev(async () => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 120; i++) await new Promise(r => s.requestAnimationFrame(() => r())); });
await ev(() => { const o = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { return f && f.name === 'tk' ? 0 : o.call(window, f); }; });
const cdp = await p.target().createCDPSession(); if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const one = (kind, i) => ev(async (kind, i) => { const s = KHXR.renderer.xr.getSession(), t0 = performance.now();
  if (kind === 'tp') { const a = i * 0.9, r = 26 + (i % 3) * 8; KHXRLayer.jumpTo(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), a); }
  else { const keys = ['1F', '2F', '5F', 'B1', '1F', '3F', 'B2', '1F', '4F', '1F']; KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === keys[i])); }
  let first = null, last = t0, maxF = 0, black = 0, panel = false;
  while (performance.now() - t0 < 3000) { const now = await new Promise(r => s.requestAnimationFrame(tt => r(performance.now()))); if (first == null) first = now - t0; else maxF = Math.max(maxF, now - last); last = now;
    if (KHXRLayer.fadeA() > 0.5) black++; if (KHXRLayer.loading()) panel = true; }
  return { first: Math.round(first), maxF: Math.round(maxF), black, panel }; }, kind, i);
const res = { cpu: CPU, tp: [], fl: [] };
for (let i = 0; i < 10; i++) res.tp.push(await one('tp', i));
await ev(() => KHXRLayer.goInside()); await new Promise(r => setTimeout(r, 2000));
for (let i = 0; i < 10; i++) res.fl.push(await one('fl', i));
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const sum = a => ({ panels: a.filter(x => x.panel).length, black: a.reduce((s, x) => s + x.black, 0), firstMax: Math.max(...a.map(x => x.first)), maxFrame: Math.max(...a.map(x => x.maxF)) });
res.sum = { tp: sum(res.tp), fl: sum(res.fl) }; res.errors = errs;
fs.writeFileSync(OUT + 'vrmove.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify(res.sum));
const ok = (n, pass, info) => { console.log((pass ? 'PASS' : 'FAIL') + ' ' + n, JSON.stringify(info)); return pass ? 1 : 0; };
let n = 0; n += ok('텔레포트 10번: 로딩 판 0번·검은 프레임 0', !res.sum.tp.panels && !res.sum.tp.black, res.sum.tp);
n += ok('층 이동 10번: 로딩 판 0번·검은 프레임 0', !res.sum.fl.panels && !res.sum.fl.black, res.sum.fl);
n += ok('페이지 오류 없음', !errs.length, errs.slice(0, 2));
console.log(`\n${n}/3 통과`); await b.close(); process.exit(n === 3 ? 0 : 1);
