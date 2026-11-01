// 조합별 굽기 확인: 주차 방식·1층 안을 바꾸고 1층·B1 화면과 사용 중인 굽기 변형을 기록. node bakevar.mjs
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:8791', OUT = fileURLToPath(new URL('./out/', import.meta.url));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1100, height: 700 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await p.goto(BASE + '/new/3d-model.html?pr=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.bake != null, { timeout: 90000 });
const pick = id => p.evaluate(id => { const e = document.getElementById(id); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, id);
for (const [sch, g1] of [['sch-alt4', 'g1-slant'], ['sch-mech', 'g1-skin'], ['sch-alt3', 'g1-corner']]) {
  await pick(sch); await pick(g1); await new Promise(r => setTimeout(r, 2500));
  for (const lv of ['1F', 'B1']) {
    await p.evaluate(k => { const i = KHPR.LEVELS.findIndex(l => l.key === k); if (!KHPR.I.on) KHXR.enterInt(); KHXR.placeLevel(i, true); }, lv);
    await new Promise(r => setTimeout(r, 2000));
    await p.screenshot({ path: OUT + `bv-${sch}-${g1}-${lv}.jpg`, type: 'jpeg', quality: 75 });
  }
  console.log(sch, g1, JSON.stringify(await p.evaluate(() => [KHPRLayer.bake.vars, KHPRLayer.bake.u.k.value, KHPRLayer.bake.u.on.value])));
  await p.evaluate(() => KHXR.go('corner'));
}
console.log(errs.join('\n')); await b.close();
