// 마감재별 코너 투시 화면(실사 3D): node fins.mjs 접두어 [마감재 value ...]
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:8791', OUT = fileURLToPath(new URL('./out/', import.meta.url));
const [tag, ...fs] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 900, height: 860 });
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null, { timeout: 90000 });
for (const f of fs) {
  await p.evaluate(f => { const e = document.querySelector(`input[name="cfin"][value="${f}"]`); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-v="corner"]').click(); }, f);
  await new Promise(r => setTimeout(r, 3000));
  await p.screenshot({ path: OUT + `${tag}-${f}.jpg`, type: 'jpeg', quality: 75, clip: { x: 150, y: 60, width: 520, height: 560 } });
}
await b.close();
