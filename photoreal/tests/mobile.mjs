// 휴대폰 화면 겹침(T16)과 멀티플레이 연결 시간 초과 안내(T15) 시험: node mobile.mjs  (BASE=주소, 기본 http://localhost:8791)
// 390×844(아이폰 크기) 흉내: 실사 패널이 처음에 접혀 있고 나침반·XR 버튼 줄과 겹치지 않는지, 펼쳤을 때 나침반이 위로 비켜 가는지.
// 멀티플레이: XR 없는 휴대폰에서 버튼이 숨는지, ?mp=1 로 받은 방 링크(?room=)로 혼자 들어가 ?mpwait=3000 안에 아무와도 연결되지 않으면 안내와 다시 시도가 보이는지(인터넷 없이도 됨)
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = { base: BASE, at: new Date().toISOString(), checks: [] };
const ok = (name, pass, info) => { res.checks.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(info)); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const p = await b.newPage(); p.on('pageerror', e => errs.push(String(e)));
await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0&room=khtest' + Math.random().toString(36).slice(2, 8) + '&mpwait=3000', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.firstFrame != null && document.getElementById('pr-panel'), { timeout: 120000 });
await wait(2500);
const rects = () => p.evaluate(() => { const R = id => { const e = typeof id === 'string' ? document.querySelector(id) : id; if (!e || !e.getClientRects().length) return null; /* position:fixed 는 offsetParent 가 없으므로 상자 유무로 본다 */ const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { panel: R('#pr-panel'), compass: R('#compass'), bar: R('#khxr-bar'), fold: document.getElementById('pr-panel').classList.contains('fold'), vh: innerHeight }; });
const hit = (a, c) => a && c && a.l < c.r && a.r > c.l && a.t < c.b && a.b > c.t;
const r1 = await rects();
ok('휴대폰: 실사 패널 처음엔 접힘(높이 60px 이하)', r1.fold && r1.panel.h <= 60, r1);
ok('접힌 패널이 나침반·XR 버튼 줄과 겹치지 않음', !hit(r1.panel, r1.compass) && !hit(r1.panel, r1.bar), r1);
await p.screenshot({ path: OUT + 'mobile-fold.png' });
await p.evaluate(() => document.querySelector('#pr-panel .pr-fold').click()); await wait(900);
const r2 = await rects();
ok('펼치면 나침반이 패널 위로 비켜 감(겹침 없음)', !r2.fold && !hit(r2.panel, r2.compass) && !hit(r2.panel, r2.bar), r2);
await p.screenshot({ path: OUT + 'mobile-open.png' });
// 멀티플레이 버튼: 몰입 VR·AR 이 없는 휴대폰 브라우저에서는 숨는다(방 링크로 열어도). ?mp=1 이면 보인다
const mp0 = await p.evaluate(() => ({ btn: !!document.getElementById('khxr-mp'), sup: window.KHXRLayer && KHXRLayer.support }));
ok('XR 없는 휴대폰: 멀티플레이 버튼 숨김', !mp0.btn, mp0);
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0&mp=1&room=khtest' + Math.random().toString(36).slice(2, 8) + '&mpwait=3000', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.firstFrame != null && document.getElementById('khxr-mp'), { timeout: 120000 }).catch(() => {});
ok('?mp=1: 멀티플레이 버튼 보임', await p.evaluate(() => !!document.getElementById('khxr-mp')), null);
// 멀티플레이 시간 초과
await p.evaluate(() => document.getElementById('khxr-mp').click());
await p.waitForFunction(() => window.KHMP && document.querySelector('#khmp [data-a="join"]'), { timeout: 30000 });
await p.evaluate(() => { const c = document.getElementById('khmp-mic'); if (c) c.checked = false; document.querySelector('#khmp [data-a="join"]').click(); });
await p.waitForFunction(() => KHMP.joined, { timeout: 30000 }).catch(() => {});
await wait(4500);
const m1 = await p.evaluate(() => ({ joined: KHMP.joined, stuck: !!KHMP.stuck, warn: (document.querySelector('#khmp .warn') || {}).textContent || '', retry: !!document.querySelector('#khmp [data-a="retry"]') }));
ok('혼자 3초 넘게 연결 안 됨: 안내와 다시 시도 보임', m1.joined && m1.stuck && m1.retry && /연결되지 않았습니다/.test(m1.warn), m1);
await p.evaluate(() => document.querySelector('#khmp [data-a="retry"]').click()); await wait(1500);
const m2 = await p.evaluate(() => ({ joined: KHMP.joined, stuck: !!KHMP.stuck, room: KHMP.roomId }));
ok('다시 시도: 같은 방으로 다시 들어가고 안내가 사라짐', m2.joined && !m2.stuck, m2);
await p.evaluate(() => KHMP.leave());
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 5));
res.pass = res.checks.filter(c => c.pass).length + '/' + res.checks.length; console.log('결과', res.pass);
fs.writeFileSync(OUT + 'mobile.json', JSON.stringify(res, null, 1));
await b.close();
