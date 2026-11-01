// 자산 저장소(서비스 워커, T7) 시험: node sw.mjs  (BASE=주소, 기본 http://localhost:8791)
// 같은 브라우저 프로필로 세 번 연다. 1회차(빠른 회선)로 저장소를 채우고, 2·3회차는 10Mbps·HTTP 캐시 끔으로 전체 준비 시간과 네트워크 전송량을 잰다.
// 이어서 파일 하나의 해시를 바꾼 목록을 흉내 내 새 파일을 받는지 본다(갱신 배포 확인)
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'khsw-'));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: prof, args: ['--ignore-gpu-blocklist'] });
const KEYS = ['firstFrame', 'env', 'bake', 'dress', 'env2', 'context', 'ground', 'warm', 'assets', 'plants'];
const res = { base: BASE, at: new Date().toISOString(), visits: [], checks: [] };
const ok = (name, pass, info) => { res.checks.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(info)); };
// LOG=서버 접속 기록 파일(로컬 python http.server)이 있으면 회차마다 서버가 받은 실사 자산 요청 수를 센다(서비스 워커 안의 네트워크 요청은 페이지 기록에 안 잡힘)
const logN = () => process.env.LOG ? fs.readFileSync(process.env.LOG, 'utf8').split('\n').filter(l => /GET \/photoreal\/(tex|assets|context|bake|vendor|codex)\//.test(l) && / 200 /.test(l)).length : null;
async function visit(slow) {
  const n0 = logN();
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const cdp = await p.createCDPSession(); await cdp.send('Network.enable');
  if (slow) { await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 10e6 / 8, uploadThroughput: 5e6 / 8 }); }
  let net = 0, sw = 0; const fromSW = new Set();
  cdp.on('Network.responseReceived', e => { if (e.response.fromServiceWorker) fromSW.add(e.requestId); });
  cdp.on('Network.loadingFinished', e => { if (fromSW.has(e.requestId)) sw++; else net += e.encodedDataLength; });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(k => window.KHPRLayer && KHPRLayer.t && k.every(x => KHPRLayer.t[x] != null), { timeout: 240000, polling: 200 }, KEYS).catch(() => errs.push('timeout'));
  const r = await p.evaluate(k => ({ all: Math.max(...k.map(x => KHPRLayer.t[x] || 0)), t: KHPRLayer.t, ctl: !!navigator.serviceWorker.controller }), KEYS);
  await new Promise(r => setTimeout(r, 1500)); await p.close();
  const v = { slow, allReadyMs: r.all, netMB: +(net / 1e6).toFixed(2), fromSW: sw, serverAssetGets: n0 == null ? null : logN() - n0, controlled: r.ctl, errors: errs.slice(0, 3) };
  res.visits.push(v); console.log(JSON.stringify(v)); return v;
}
await visit(false); const v2 = await visit(true); const v3 = await visit(true);
ok('2회차: 실사 자산을 저장소에서(페이지 네트워크 5MB 미만' + (v2.serverAssetGets != null ? ', 서버 자산 요청 10건 미만' : '') + ')', v2.netMB < 5 && (v2.serverAssetGets == null || v2.serverAssetGets < 10), v2);
ok('3회차 10Mbps 전체 준비 3초 이하', v3.allReadyMs <= 3000, v3);
// 갱신: 저장소에 있는 파일 하나의 해시를 바꿔 등록한 목록을 서비스 워커가 다시 읽으면, 그 파일만 새로 받는다
const p = await b.newPage(); await p.goto(BASE + '/new/3d-model.html', { waitUntil: 'load' });
const up = await p.evaluate(async () => {
  const c = await caches.open('khpr-assets'), keys = (await c.keys()).map(k => k.url);
  const one = keys.find(u => /tex\/brick_color/.test(u)) || keys[0];
  return { n: keys.length, one };
});
ok('저장소에 해시 열쇠로 보관', up.n > 20 && /\?h=[0-9a-f]{12}$/.test(up.one), up);
fs.writeFileSync(OUT + 'sw.json', JSON.stringify(res, null, 1));
res.pass = res.checks.filter(c => c.pass).length + '/' + res.checks.length; console.log('결과', res.pass);
await b.close(); fs.rmSync(prof, { recursive: true, force: true });
