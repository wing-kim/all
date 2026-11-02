// 느린 회선 로딩 측정: node net.mjs [4g|fast]  (BASE=주소, 기본 http://localhost:8791)
// 4g = 하향 10Mbps·지연 60ms, 캐시 끔. ?pr=1 로 열고 실사 3D 단계별 도달 시각(켠 순간 기준 ms)과 받은 양을 잰다
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const mode = process.argv[2] || '4g';
const BASE = process.env.BASE || 'http://localhost:8791';
const QS = process.env.QS || '';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const cdp = await p.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
if (mode === '4g') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 10e6 / 8, uploadThroughput: 5e6 / 8 });
let bytes = 0, reqs = 0; const U = new Map(), grp = {};
cdp.on('Network.requestWillBeSent', e => U.set(e.requestId, e.request.url));
cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; const u = (U.get(e.requestId) || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*/, ''); const k = u.split('/').slice(0, 4).join('/'); grp[k] = (grp[k] || 0) + e.encodedDataLength; });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
const t0 = Date.now();
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + QS, { waitUntil: 'load', timeout: 300000 });
const tLoad = Date.now() - t0;
// 전체 준비 = 외관(1102.d 부터 실내 가구·화분은 외관 준비 뒤 받는다). 실내(dress·plants)는 따로 interiorMs
const KEYS = ['firstFrame', 'env', 'bake', 'env2', 'context', 'ground', 'warm', 'assets'], IKEYS = ['dress', 'plants'];
await p.waitForFunction(k => window.KHPRLayer && KHPRLayer.t && k.every(x => KHPRLayer.t[x] != null), { timeout: 300000, polling: 200 }, KEYS).catch(() => {});
const tExt = await p.evaluate(k => Math.max(...k.map(x => KHPRLayer.t[x] || 0)), KEYS);
await p.waitForFunction(k => k.every(x => KHPRLayer.t[x] != null), { timeout: 300000, polling: 200 }, IKEYS).catch(() => {});
const r = await p.evaluate(() => ({ mbps: KHPRLayer.stat.mbps, fast: KHPRLayer.stage && KHPRLayer.stage.fast, t: KHPRLayer.t, pre: KHPRLayer.pre || null, stage: (document.getElementById('pr-stat') || {}).textContent, log: KHPRLayer.log.slice(-40) }));
const all = tExt, interiorMs = Math.max(...IKEYS.map(k => r.t[k] || 0));
const res = { mode, base: BASE, qs: QS, mbps: r.mbps, fast: r.fast, at: new Date().toISOString(), pageLoadMs: tLoad, t: r.t, allReadyMs: all, interiorMs, MB: +(bytes / 1e6).toFixed(1), reqs, pre: r.pre, stage: r.stage, byFolderMB: Object.fromEntries(Object.entries(grp).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, +(v / 1e6).toFixed(2)])), errors: errs.slice(0, 5) };
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(OUT + 'net-' + mode + '.json', JSON.stringify({ ...res, log: r.log }, null, 1));
await b.close();
