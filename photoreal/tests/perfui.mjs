// 성능 정보 표시 규칙 시험: node perfui.mjs  (BASE=주소, 기본 http://localhost:8791)
// 기본은 fps 표시·켜기 시간·VR 프레임 판 모두 숨김, 패널 '성능 보기'를 켜면 보이고 localStorage 로 기억, ?prfps=1 은 켜고 ?prfps=0 은 기억을 무시하고 끈다
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE || 'http://localhost:8791';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = []; const ok = (n, pass, info) => { res.push(pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 }); p.on('pageerror', e => errs.push(String(e)));
const open = async qs => { await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + qs, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.plants != null && document.getElementById('pr-perf'), { timeout: 180000 }); await wait(1800); };
const st = () => p.evaluate(() => { const f = document.getElementById('pr-fps'), s = document.getElementById('pr-stat');
  return { fps: !!(f && f.isConnected && !f.hidden && f.textContent), stat: s.hidden ? '' : s.textContent, box: document.getElementById('pr-perf').checked, xr: !!(window.KHXRLayer && KHXRLayer.fps && KHXRLayer.fps.on) }; });
await open('');
await p.evaluate(() => { try { localStorage.removeItem('khpr.perf'); } catch (e) {} }); await open('');
const a = await st(); ok('기본: fps 표시·켜기 시간·VR 판 모두 숨김', !a.fps && !/켜기|ms/.test(a.stat) && !a.box && !a.xr, a);
await p.evaluate(() => { const c = document.getElementById('pr-perf'); c.checked = true; c.dispatchEvent(new Event('change')); }); await wait(1500);
const b1 = await st(); ok('성능 보기 켜면 모두 보임', b1.fps && /켜기/.test(b1.stat) && b1.xr, b1);
await open(''); const c = await st(); ok('다시 열어도 기억(localStorage)', c.fps && c.box && c.xr, c);
await open('&prfps=0'); const d = await st(); ok('?prfps=0 은 기억을 무시하고 끔', !d.fps && !d.xr && !/켜기/.test(d.stat), d);
await p.evaluate(() => { const c = document.getElementById('pr-perf'); c.checked = false; c.dispatchEvent(new Event('change')); });
await open('&prfps=1'); const e = await st(); ok('?prfps=1 은 기억 없이도 켬', e.fps && e.xr, e);
await p.evaluate(() => { try { localStorage.removeItem('khpr.perf'); } catch (e) {} });
ok('페이지 오류 없음', !errs.length, errs.slice(0, 3));
console.log('결과', res.filter(Boolean).length + '/' + res.length);
await b.close();
