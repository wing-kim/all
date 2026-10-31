// 개발용: 실사 3D 를 켠 뒤 페이지에서 식 하나를 평가해 출력. node ev.mjs '<식>'  (QS=추가 쿼리)
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE || 'http://localhost:8791';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1200, height: 800 });
const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 500)));
await p.goto(BASE + '/new/3d-model.html?pr=1' + (process.env.QS || ''), { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null, { timeout: 90000 }).catch(() => errs.push('timeout'));
for (const x of process.argv.slice(2)) console.log(String(JSON.stringify(await p.evaluate(x))).slice(0, 3000));
console.log(errs.join('\n'));
await b.close();
