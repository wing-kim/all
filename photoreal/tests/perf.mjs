// 실사 3D 프레임 측정: node perf.mjs [pc|mobile]  (BASE=주소, 기본 http://localhost:8791)
// 카메라를 천천히 돌리면서(이름 끝 _still 은 멈춘 화면) 4초 동안 프레임 간격(중앙값·95%)과 한 프레임의 그리기 호출·삼각형을 잰다.
// 맥의 GPU 로 재므로 휴대폰·퀘스트의 실제 속도는 아니다(비교용 상대값과 부하 수치로 본다).
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const dev = process.argv[2] || 'pc';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-frame-rate-limit', '--disable-gpu-vsync'] });
const p = await b.newPage();
if (dev === 'mobile') await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
else await p.setViewport({ width: 1600, height: 900 });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE + '/new/3d-model.html' + (process.env.QS ? '?' + process.env.QS : ''), { waitUntil: 'load', timeout: 120000 });   // QS=prq=low 등
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.K && document.getElementById('vm-pr'), { timeout: 60000 });
const ev = (f, ...a) => p.evaluate(f, ...a);
const res = { dev, base: BASE, at: new Date().toISOString() };
res.gpu = await ev(() => { const g = KHXR.renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
res.pixelRatio = await ev(() => KHXR.renderer.getPixelRatio());
const pick = id => ev(id => { const e = document.getElementById(id); if (!e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, id);
await pick('sch-alt4'); await pick('g1-skin'); await pick('t-upstraight');
// 측정 한 번: 자동 회전 4초, 프레임 간격과 한 프레임 부하
const measure = async (name, still) => {
  await new Promise(r => setTimeout(r, 1500));
  const r = await ev(async still => {
    const C = KHXR.controls; C.autoRotate = !still; C.autoRotateSpeed = 2;
    const raf = () => new Promise(r => requestAnimationFrame(r));
    await raf(); const ds = []; let t = performance.now(); const end = t + 4000;
    while (performance.now() < end) { await raf(); const n = performance.now(); ds.push(n - t); t = n; }
    const inf = KHXR.renderer.info; inf.autoReset = false; await raf(); inf.reset(); await raf();
    const one = { calls: inf.render.calls, tris: inf.render.triangles }; inf.autoReset = true;
    C.autoRotate = false;
    ds.sort((a, b) => a - b); const q = k => +ds[Math.min(ds.length - 1, Math.floor(ds.length * k))].toFixed(1);
    return { frames: ds.length, fps: +(1000 / q(0.5)).toFixed(1), medMs: q(0.5), p95Ms: q(0.95), maxMs: q(1), longOver50: ds.filter(d => d > 50).length, ...one, programs: inf.programs.length, textures: inf.memory.textures, geos: inf.memory.geometries };
  }, !!still);
  res[name] = r; console.log(name, JSON.stringify(r));
};
await pick('vm-render'); await measure('wing_render');
await pick('vm-pr');
await p.waitForFunction(() => KHPRLayer.t.dress != null && KHPRLayer.t.env2 != null && KHPRLayer.t.warm != null && KHPRLayer.t.bake != null, { timeout: 90000 });
await measure('pr_ext_glass');
await measure('pr_ext_glass_still', true);
for (const pf of ['brick', 'stack', 'colonnade']) { await ev(pf => document.querySelector(`[data-pf="${pf}"]`).click(), pf); await measure('pr_ext_' + pf); }
for (const t of ['sunset', 'night']) { await pick('tod-' + t).catch(() => {}); await measure('pr_ext_' + t); }
await pick('tod-pm').catch(() => {});
for (const lv of ['1F', 'B1', 'B3']) { await ev(lv => document.querySelector(`[data-lv="${lv}"]`).click(), lv); await measure('pr_' + lv); }
await ev(() => document.querySelector('[data-lv="out"]').click());
res.errors = errs.slice(0, 10);
fs.writeFileSync(OUT + 'perf-' + dev + '.json', JSON.stringify(res, null, 1));
await b.close();
