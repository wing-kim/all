// 실내 가구 겹침 시험(1102.o): node furn.mjs  (BASE=주소, 기본 http://localhost:8791)
// 실사 3D 에서 모든 층(B3～옥상) × 미성 현재/미래 × 7층 사용 켬/끔으로 들어가, 보이는 GLB 가구 자리 상자와 절반 넘게 겹치는
// 다른 보이는 작은 메시(숨겨야 할 절차적 대체물·상자 가구)가 0 인지 본다(KHPRLayer.furnOverlap, 바운딩 상자 교차)
// 고치기 전(1102.n): tagDress 가 숨긴 대체물을 층 묶음으로 옮겨 GLB 의자·소파와 회색 상자·파란 상자 의자가 겹쳐 보였다
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = { at: new Date().toISOString(), runs: [] }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null, { timeout: 240000 }).catch(() => {});
const pick = id => p.evaluate(id => { const e = document.getElementById(id); if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } return !!e; }, id);
const settle = () => p.waitForFunction(() => !KHPRLayer.settling() && KHPRLayer.t.dress != null, { timeout: 120000 }).catch(() => {});
const use7 = await p.evaluate(() => { const e = document.getElementById('use7') || document.querySelector('input[id*=use7]'); return e ? e.id : null; });
for (const u7 of use7 ? [false, true] : [false]) {
  if (use7) { await p.evaluate((id, v) => { const e = document.getElementById(id); if (e.checked !== v) { e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, use7, u7); await new Promise(r => setTimeout(r, 1500)); await settle(); }
  for (const ms of ['ms-now', 'ms-future']) {
    await pick(ms); await settle();
    const keys = await p.evaluate(() => KHPR.LEVELS.map(l => l.key));
    for (const k of keys) {
      await p.evaluate(k => { const i = KHPR.LEVELS.findIndex(l => l.key === k); if (!KHPR.I.on) KHXR.enterInt(); KHXR.placeLevel(i, true); }, k);
      await settle(); await new Promise(r => setTimeout(r, 600));
      const o = await p.evaluate(() => KHPRLayer.furnOverlap());
      res.runs.push({ use7: u7, ms, lv: k, boxes: o.boxes, hits: o.hits, list: o.list });
    }
  }
}
const bad = res.runs.filter(r => r.hits > 0);
res.dropped = await p.evaluate(() => KHPRLayer.stat.furnFallbackDropped);
ok('실내 가구 겹침 0(' + res.runs.length + '개 조합, 층 × 미성 × 7층 사용)', res.runs.length > 0 && bad.length === 0 && res.runs.every(r => r.boxes > 0), { bad: bad.slice(0, 4), boxes: res.runs[0] && res.runs[0].boxes, dropped: res.dropped });
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 3));
fs.writeFileSync(OUT + 'furn.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
