// 지니 주변 모델 비교 촬영(최적화 1102.m 확인용): node envcmp.mjs <주소> <이름> [추가 쿼리]
// 실사 3D 를 켜고 지니 모델·실사 레이어를 다 받은 뒤 같은 시점 3곳을 찍고, 지니 재질·텍스처·그리기 수를 적는다(out/envcmp-<이름>.json, out/envcmp-<이름>-<n>.png)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const [BASE, NAME = 'x', QX = ''] = process.argv.slice(2);
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?prsw=0&pr=1' + QX, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.dress != null && window.KHENV && KHENV.loaded().n === KHENV.loaded().of && KHENV.loaded().real && !KHENV.busy, { timeout: 240000 });
await new Promise(r => setTimeout(r, 4000));
await p.addStyleTag({ content: '.panel,#panel,aside,.side,.pr-panel{display:none!important}' });
const views = [[[-5, 34, -70], [25, 6, -10]], [[-60, 25, 40], [-20, 8, -20]], [[30, 12, 60], [20, 6, 20]]], res = { shots: [] };
for (let i = 0; i < views.length; i++) {
  await p.evaluate(v => { const C = KHXR.controls; KHXR.camera.position.set(...v[0]); C.target.set(...v[1]); C.update(); }, views[i]); await new Promise(r => setTimeout(r, 2500));
  const f = `envcmp-${NAME}-${i}.png`; await p.screenshot({ path: OUT + f }); res.shots.push(f);
}
res.stat = await p.evaluate(() => { const ms = new Set(), tx = new Set(); (KHENV.R.bld || []).forEach(k => { const m = k.material; ms.add(m); ['map', 'lightMap', 'aoMap', 'normalMap'].forEach(s => m[s] && tx.add(m[s])); });
  const R = KHXR.renderer; return { bldMeshes: (KHENV.R.bld || []).length, bldMats: ms.size, bldTex: tx.size, lm: [...tx].filter(t => /_lm|lmao/.test(t.name || '')).length, atlas: KHENV.R.atlas || null, calls: R.info.render.calls, textures: R.info.memory.textures, geos: R.info.memory.geometries, opt: window.KHXRLayer && KHXRLayer.opt && KHXRLayer.opt.stat }; });
res.errs = errs; fs.writeFileSync(OUT + `envcmp-${NAME}.json`, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
await b.close();
