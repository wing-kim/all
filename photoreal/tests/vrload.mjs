// VR '불러오는 중' 판이 닫히는지(1102.u, Jack 퀘스트: 실내로 들어가면 판이 뜬 뒤 사라지지 않음): node vrload.mjs  (BASE=주소)
// 퀘스트 브라우저는 몰입 중에 창 requestAnimationFrame 을 멈춘다. IWER 에뮬레이터는 창 rAF 가 계속 돌아 그 차이를 못 봤으므로,
// VR 에 들어간 뒤 창 rAF 로 도는 실사 계층 프레임 번호(PR.tick, 함수 tk)를 멈춘(QUEST=1, 기본, 에뮬레이터는 세션 프레임도 창 rAF 로 돌려 전체를 멈추면 세션이 선다) 채로 실내 진입·층 이동·밖으로 나가기를 하며 각 이동 뒤 판이 닫히는 시간을 잰다.
// 합격: 이동마다 20초 안에 판이 닫힘(받을 것이 없으면 수 초). 결과: out/vrload.json
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791', QUEST = process.env.QUEST !== '0', LIM = 20000;
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&prsw=0&pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null, { timeout: 240000 });
const ev = (f, ...a) => p.evaluate(f, ...a);
await ev(() => KHXRLayer.enter('vr'));
await ev(() => new Promise(r => setTimeout(r, 1500)));
if (QUEST) await ev(() => { window.__rafOff = true; const o = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { return window.__rafOff && f && f.name === 'tk' ? 0 : o.call(window, f); }; });
// 판이 닫힐 때까지(세션 프레임으로 기다림) 걸린 시간과 그동안의 이유
const waitClosed = () => ev(async LIM => { const s = KHXR.renderer.xr.getSession(), t0 = performance.now(); let seen = false, why = new Set(), last = '';
  while (performance.now() - t0 < LIM + 5000) { await new Promise(r => s.requestAnimationFrame(() => r())); const on = KHXRLayer.loading(); if (on) { seen = true; const w = KHXRLayer.loadWhy ? KHXRLayer.loadWhy() : ''; if (w) { why.add(w); last = w; } }
    if (!on && performance.now() - t0 > 2500) return { closedMs: Math.round(performance.now() - t0), seen, why: [...why].slice(0, 6), timedOut: !!(KHXRLayer.loadTimedOut && KHXRLayer.loadTimedOut()) }; }
  return { closedMs: null, seen, why: [...why].slice(0, 6), last }; }, LIM);
const steps = [['실내 1층', () => KHXRLayer.goInside()], ['2층', () => KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === '2F'))], ['지하 1층', () => KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === 'B1'))],
  ['5층', () => KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === '5F'))], ['밖', () => KHXRLayer.goOutside()], ['다시 실내', () => KHXRLayer.goInside()]];
const res = { quest: QUEST, steps: [] };
for (const [n, f] of steps) { await ev(f); const r = await waitClosed(); res.steps.push({ n, ...r }); console.log(n, JSON.stringify(r)); }
// 끝나지 않는 일이 있어도 닫히는지: 실사 계층이 늘 '받는 중'이라고 답하게 바꾼 뒤 실내 이동(20초 + 이유 3초 안에 닫혀야 함)
await ev(() => { window.__pg = KHPRLayer.progress; KHPRLayer.progress = () => ({ busy: true, text: '시험: 끝나지 않는 일' }); });
await ev(() => KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === '2F')));
{ const r = await waitClosed(); res.stuck = r; console.log('끝나지 않는 일', JSON.stringify(r)); }
await ev(() => { KHPRLayer.progress = window.__pg; });
res.errors = errs;
fs.writeFileSync(OUT + 'vrload.json', JSON.stringify(res, null, 1));
const bad = res.steps.filter(s => s.closedMs == null || s.closedMs > LIM); const stuckOk = res.stuck && res.stuck.closedMs != null && res.stuck.closedMs <= LIM + 4000 && res.stuck.timedOut;
console.log((bad.length ? 'FAIL' : 'PASS') + ' VR 로딩 판: 이동 ' + res.steps.length + '번 모두 ' + LIM / 1000 + '초 안에 닫힘' + (QUEST ? '(창 rAF 멈춤 = 퀘스트 조건)' : ''), JSON.stringify(bad.map(s => s.n)));
console.log((stuckOk ? 'PASS' : 'FAIL') + ' 끝나지 않는 일이 있어도 20초 뒤 이유를 보이고 닫힘', JSON.stringify(res.stuck));
console.log((errs.length ? 'FAIL' : 'PASS') + ' 페이지 오류 없음', JSON.stringify(errs.slice(0, 2)));
console.log(`\n${3 - (bad.length ? 1 : 0) - (stuckOk ? 0 : 1) - (errs.length ? 1 : 0)}/3 통과`);
await b.close(); process.exit(bad.length || !stuckOk || errs.length ? 1 : 0);
