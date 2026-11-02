// 윈도우 PC 조건 흉내 시험: node winsim.mjs  (BASE=주소, 기본 http://localhost:8791)
// 맥에서 윈도우 노트북(내장 GPU, 화면 배율 150%, ANGLE D3D11 의 느린 셰이더 컴파일)을 흉내 내 첫 실사 3D 전환의 멈춤과 정상 상태 fps 를 잰다.
// - CPU 감속: CPU=4(기본, Chrome 개발자 도구의 CPU 감속), 화소 배율: DPR=1.5, 창 1600×900
// - 셰이더 컴파일 지연: SHADER_MS=80(기본). 프로그램을 링크한 뒤 그 프로그램을 처음 쓰는 GL 호출(유니폼 위치·링크 상태 조회 등)이 그만큼 기다린다.
//   KHR_parallel_shader_compile 의 완료 조회(COMPLETION_STATUS_KHR)는 기다리지 않고 '아직'을 돌려준다(윈도우 크롬과 같은 동작). PAR=0 이면 이 확장이 없는 것처럼
// - 자동 품질은 시험 자동화 중에는 꺼져 있으므로 ?prqauto=1 로 켠다(맥 고성능에서 '높음' 유지 확인은 CPU=1 SHADER_MS=0)
// 결과: out/winsim.json. 판정 줄(PASS/FAIL)은 qa 의 budget 묶음이 읽는다
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791';
const CPU = +(process.env.CPU || 4), DPR = +(process.env.DPR || 1.5), SMS = +(process.env.SHADER_MS ?? 80), PAR = process.env.PAR !== '0';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: DPR });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.evaluateOnNewDocument(() => { window.__cl = []; const L = console.log; console.log = function (...a) { __cl.push([performance.now(), a.join(' ').slice(0, 120)]); return L.apply(this, a); }; });
await p.evaluateOnNewDocument((SMS, PAR) => {
  if (!SMS) return; const LINK = new WeakMap(); window.__shim = { links: 0, waits: 0, waitMs: 0 };
  const spin = ms => { const e = performance.now() + ms; while (performance.now() < e); };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue; const P = C.prototype, o = {}; ['linkProgram', 'getProgramParameter', 'getExtension', 'getUniformLocation', 'getActiveUniform', 'getAttribLocation', 'getActiveAttrib', 'useProgram', 'getProgramInfoLog'].forEach(k => { o[k] = P[k]; });
    const wait = pg => { const t = LINK.get(pg); if (t == null) return; LINK.delete(pg); const r = t - performance.now(); if (r > 0) { spin(r); __shim.waits++; __shim.waitMs += r; const st = (new Error().stack || '').split('\n').slice(3, 12).map(l => (l.trim().split(' ')[1] || '')).join('<'); (__shim.w || (__shim.w = [])).push([Math.round(performance.now()), st, (window.KHXR && KHXR.renderer.getRenderTarget() ? (KHXR.renderer.getRenderTarget().isWebGLCubeRenderTarget ? 'cube' : 'rt') : 'scr')]); } };
    P.linkProgram = function (pg) { o.linkProgram.call(this, pg); LINK.set(pg, performance.now() + SMS); __shim.links++; };
    P.getProgramParameter = function (pg, n) { if (n === 0x91B1) { const t = LINK.get(pg); if (t != null && performance.now() < t) return false; LINK.delete(pg); return true; } wait(pg); return o.getProgramParameter.call(this, pg, n); };
    ['getUniformLocation', 'getActiveUniform', 'getAttribLocation', 'getActiveAttrib', 'useProgram', 'getProgramInfoLog'].forEach(k => { P[k] = function (pg, ...a) { if (pg) wait(pg); return o[k].call(this, pg, ...a); }; });
    P.getExtension = function (n) { if (n === 'KHR_parallel_shader_compile') return PAR ? (o.getExtension.call(this, n) || { COMPLETION_STATUS_KHR: 0x91B1, maxShaderCompilerThreadsKHR() {} }) : null; return o.getExtension.call(this, n); };
  }
}, SMS, PAR);
const cdp = await p.target().createCDPSession();
await p.goto(BASE + '/new/3d-model.html?prsw=0&prqauto=1', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.K && document.getElementById('vm-pr') && KHPRLayer.boot === '준비 완료', { timeout: 180000 });
await new Promise(r => setTimeout(r, 2000));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const ev = (f, ...a) => p.evaluate(f, ...a);
const pick = id => ev(id => { const e = document.getElementById(id); if (!e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, id);
// 프레임 간격 기록기: 페이지 안에서 rAF 간격을 쌓는다
await ev(() => { window.__ft = []; let t = performance.now(); (function f() { const n = performance.now(); __ft.push(n - t); if (n - t > 200) (window.__long || (window.__long = [])).push([Math.round(t), Math.round(n - t)]); t = n; requestAnimationFrame(f); })(); });
const stats = ds => { const a = ds.slice().sort((x, y) => x - y), q = k => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * k))].toFixed(1) : null;
  return { frames: a.length, medMs: q(0.5), p95Ms: q(0.95), maxMs: q(1), over100: a.filter(d => d > 100).length, over250: a.filter(d => d > 250).length, stallMs: Math.round(a.filter(d => d > 50).reduce((s, d) => s + d, 0)) }; };
const steady = async (sec, rotate = true) => { await ev(r => { KHXR.controls.autoRotate = r; KHXR.controls.autoRotateSpeed = 2; __ft.length = 0; }, rotate); await new Promise(r => setTimeout(r, sec * 1000));
  return ev(() => { KHXR.controls.autoRotate = false; return __ft.slice(); }).then(stats); };
const res = { base: BASE, cpu: CPU, dpr: DPR, shaderMs: SMS, parallel: PAR, at: new Date().toISOString() };
res.gpu = await ev(() => { const g = KHXR.renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
res.sketch = await steady(5);
// 첫 실사 3D 전환: 고른 순간부터 외관 준비(PR.t.warm)와 그 뒤 4초까지의 프레임
await ev(() => { __ft.length = 0; window.__t0 = performance.now(); });
await pick('vm-pr');
await p.waitForFunction(() => KHPRLayer.t && KHPRLayer.t.warm != null, { timeout: 600000, polling: 500 }).catch(() => {});
await new Promise(r => setTimeout(r, 4000));
res.first = { ...(await ev(() => __ft.slice()).then(stats)), readyMs: await ev(() => Math.round(performance.now() - __t0) - 4000), warm: await ev(() => KHPRLayer.t.warm) };
res.steady = await steady(10);
res.steady2 = await steady(10);   // 자동 품질이 한 단계 내린 뒤의 상태
res.state = await ev(() => { const O = KHXRLayer.opt, R = KHXR.renderer, C = KHPR.R3D.composer;
  return { q: KHPRLayer.q && KHPRLayer.q.key, why: KHPRLayer.q && KHPRLayer.q.why, rendererPR: +R.getPixelRatio().toFixed(2), composerPR: C ? +(C._pixelRatio || 0).toFixed(2) : null, programs: R.info.programs.length,
    opt: O && O.stat, optBuilds: O && O.nBuild, optMs: O && O.msTotal, warmInfo: KHPRLayer.stat && KHPRLayer.stat.warm, shim: window.__shim }; });
res.errors = errs.slice(0, 5);
// 200ms 넘는 프레임마다: 그 사이의 셰이더 대기(어느 그리기 대상: scr 화면·rt 합성·cube 반사 지도)와 콘솔 기록(어떤 작업이었는지)
res.long = await ev(() => (window.__long || []).map(([t, d]) => [d, (__shim.w || []).filter(w => w[0] >= t && w[0] <= t + d).map(w => w[2] + ':' + w[1]).slice(0, 12), __cl.filter(c => c[0] >= t - 5 && c[0] <= t + d).map(c => c[1]).join(' | ').slice(0, 600)]));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
fs.writeFileSync(OUT + 'winsim.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, long: undefined, state: { ...res.state, shim: res.state.shim && { links: res.state.shim.links, waits: res.state.shim.waits, waitMs: Math.round(res.state.shim.waitMs) } } }, null, 1));
res.long.filter(x => x[0] > 400).forEach(x => console.log('긴 프레임', x[0] + 'ms', '셰이더 대기', x[1].length, x[2].slice(0, 120)));
const ok = (n, pass, info) => console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info));
ok('첫 실사 전환: 가장 긴 프레임 ≤ 1000ms', res.first.maxMs != null && res.first.maxMs <= 1000, { maxMs: res.first.maxMs, over250: res.first.over250 });
ok('정상 상태(10초 뒤): 프레임 간격 중앙값 ≤ 50ms', res.steady2.medMs != null && res.steady2.medMs <= 50, res.steady2);
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 2));
await b.close();
