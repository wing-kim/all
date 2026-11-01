// 시점별 화면 확인: node vshots.mjs 접두어 [시점들...]  (시점: Wing data-v 값, 또는 cam:x,y,z,tx,ty,tz)
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const [tag, ...vs] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 860 });
const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 600))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
await p.goto(BASE + '/new/3d-model.html?pr=1' + (process.env.QS || ''), { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.context != null, { timeout: 90000 }).catch(() => errs.push('timeout'));
if (process.env.ERA) await p.evaluate(id => { const e = document.getElementById(id); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, process.env.ERA);
await p.evaluate(() => document.querySelector('.app').classList.add('hide-ui'));
for (const v of vs) {
  await p.evaluate(v => {
    if (v.startsWith('cam:')) { const a = v.slice(4).split(',').map(Number); KHXR.controls.object.position.set(a[0], a[1], a[2]); KHXR.controls.target.set(a[3], a[4], a[5]); KHXR.controls.update(); }
    else document.querySelector(`[data-v="${v}"]`).click();
  }, v);
  await new Promise(r => setTimeout(r, 2500));
  await p.screenshot({ path: OUT + tag + '-' + vs.indexOf(v) + '.jpg', type: 'jpeg', quality: 82 });
}
console.log(JSON.stringify(await p.evaluate(() => ({ stat: KHPRLayer.stat.context, log: KHPRLayer.log.slice(-5) }))));
console.log(errs.slice(0, 10).join('\n'));
await b.close();
