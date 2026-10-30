// 개발용: node shot.mjs <파일명> "<실행할 async 함수 본문>"  → out/<파일명>.png
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const [name, body] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.SCHEME || 'light' }]);
await p.goto((process.env.BASE || 'http://localhost:8790') + '/new/3d-model.html?xremu=1' + (process.env.QS || ''), { waitUntil: 'load' });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
const r = await p.evaluate(new Function('return (async()=>{' + (body || '') + '})()'));
if (r !== undefined) console.log(JSON.stringify(r));
await p.screenshot({ path: fileURLToPath(new URL('./out/' + name + '.png', import.meta.url)) });
await b.close();
