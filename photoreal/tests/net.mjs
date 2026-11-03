// 느린 회선 로딩 측정: node net.mjs [4g|fast]  (BASE=주소, 기본 http://localhost:8791)
// 4g = 하향 10Mbps·지연 60ms, 캐시 끔. ?pr=1 로 열고 실사 3D 단계별 도달 시각(켠 순간 기준 ms)과 받은 양을 잰다
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import CHROME from './chrome.mjs';
const mode = process.argv[2] || '4g';
const BASE = process.env.BASE || 'http://localhost:8791';
const QS = process.env.QS || '';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const cdp = await p.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
if (mode === '4g') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 10e6 / 8, uploadThroughput: 5e6 / 8 });
let bytes = 0, reqs = 0; const U = new Map(), grp = {};
cdp.on('Network.requestWillBeSent', e => U.set(e.requestId, e.request.url));
cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; const u = (U.get(e.requestId) || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*/, ''); const k = u.split('/').slice(0, 4).join('/'); grp[k] = (grp[k] || 0) + e.encodedDataLength; });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
// 주 스레드 긴 작업(50ms 넘는 작업, 최적화 2·6번 비교용): 페이지 시작부터 모은다
await p.evaluateOnNewDocument(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
const t0 = Date.now();
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + QS, { waitUntil: 'load', timeout: 300000 });
const tLoad = Date.now() - t0;
// 전체 준비 = 외관(1102.d 부터 실내 가구·화분은 외관 준비 뒤 받는다). 실내(dress·plants)는 따로 interiorMs
const KEYS = ['firstFrame', 'env', 'bake', 'env2', 'context', 'ground', 'warm', 'assets'], IKEYS = ['dress', 'plants'];
await p.waitForFunction(k => window.KHPRLayer && KHPRLayer.t && k.every(x => KHPRLayer.t[x] != null), { timeout: 300000, polling: 200 }, KEYS).catch(() => {});
const tExt = await p.evaluate(k => Math.max(...k.map(x => KHPRLayer.t[x] || 0)), KEYS);
await p.waitForFunction(k => k.every(x => KHPRLayer.t[x] != null), { timeout: 300000, polling: 200 }, IKEYS).catch(() => {});
const r = await p.evaluate(() => ({ mbps: KHPRLayer.stat.mbps, fast: KHPRLayer.stage && KHPRLayer.stage.fast, t: KHPRLayer.t, pre: KHPRLayer.pre || null, stage: (document.getElementById('pr-stat') || {}).textContent, log: KHPRLayer.log.slice(-40) }));
// 지니 주변 모델(1102.l): 실사 3D 를 켜면 외관 준비 뒤 받는다. 모델과 실사 레이어(라이트맵·가로 요소)까지 받은 시각(페이지 시작 기준)
await p.waitForFunction(() => window.KHENV && (KHENV.off || (KHENV.loaded().n === KHENV.loaded().of && KHENV.loaded().real && !KHENV.busy)), { timeout: 300000, polling: 200 }).catch(() => {});
const envDoneMs = Date.now() - t0, lt = await p.evaluate(() => (window.__lt || []).slice());
const longTasks = { n: lt.length, sumMs: lt.reduce((s, x) => s + x[1], 0), maxMs: Math.max(0, ...lt.map(x => x[1])) };
const all = tExt, interiorMs = Math.max(...IKEYS.map(k => r.t[k] || 0));
const res = { mode, base: BASE, qs: QS, mbps: r.mbps, fast: r.fast, at: new Date().toISOString(), pageLoadMs: tLoad, t: r.t, allReadyMs: all, interiorMs, envDoneMs, longTasks, envMB: +(Object.entries(grp).filter(([k]) => k.startsWith('/new/models')).reduce((s, [, v]) => s + v, 0) / 1e6).toFixed(2), MB: +(bytes / 1e6).toFixed(1), reqs, pre: r.pre, stage: r.stage, byFolderMB: Object.fromEntries(Object.entries(grp).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, +(v / 1e6).toFixed(2)])), errors: errs.slice(0, 5) };
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(OUT + 'net-' + mode + '.json', JSON.stringify({ ...res, log: r.log }, null, 1));
await b.close();
