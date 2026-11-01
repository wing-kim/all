// 개발용 화면 확인: node shots.mjs [층들...] → out/s-<층>.jpg (기본: 외관 1F 3F 5F B1)
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const lv = process.argv.slice(2).length ? process.argv.slice(2) : ['out', '1F', '3F', '5F', 'B1'];
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 860 });
const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 600))); p.on('console', m => { if (m.type() === 'error' || /khpr/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.goto(BASE + '/new/3d-model.html?pr=1&pf=' + (process.env.PF || 'glass') + (process.env.QS || ''), { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null, { timeout: 60000 }).catch(() => errs.push('timeout'));
if (process.env.TOD) await p.evaluate(t => { const e = document.getElementById('tod-' + t); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, process.env.TOD);
if (process.env.TOD) await new Promise(r => setTimeout(r, 3000));
const tag = process.env.TOD ? process.env.TOD + '-' : '';
for (const k of lv) {
  await p.evaluate(k => { if (k === 'out') { if (KHPR.I.on) KHXR.go('corner'); } else { const i = KHPR.LEVELS.findIndex(l => l.key === k); if (!KHPR.I.on) KHXR.enterInt(); KHXR.placeLevel(i, true); } }, k);
  await p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 40 ? r() : requestAnimationFrame(f)); f(); }));
  await p.screenshot({ path: OUT + 's-' + tag + k + '.jpg', type: 'jpeg', quality: 80 });
}
console.log(JSON.stringify(await p.evaluate(() => ({ stat: KHPRLayer.stat, t: KHPRLayer.t, log: KHPRLayer.log.slice(-8) }))));
console.log(errs.slice(0, 15).join('\n'));
await b.close();
