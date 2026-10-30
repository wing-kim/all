// 개발용 진단: node diag.mjs "<page.evaluate 로 실행할 async 함수 본문>"
import puppeteer from 'puppeteer-core';
const body = process.argv[2];
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
p.on('pageerror', e => console.log('pageerror', e.message));
await p.goto((process.env.BASE || 'http://localhost:8790') + '/new/3d-model.html?xremu=1' + (process.env.QS || ''), { waitUntil: 'load' });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
const fn = new Function('return (async()=>{' + body + '})()');
console.log(JSON.stringify(await p.evaluate(fn), null, 1));
await b.close();
