// 호환·안정성 점검: node compat.mjs [기준주소]
//  Q2  화면 모드가 Wing 원본(origin/main)과 같은지(스케치·렌더 스크린샷 픽셀 비교)
//  Q14 연결 통로가 없어도(대체 경로) XR 이 버티는지, [XR] 줄이 모두 없어도 원본이 정상인지
//  Q13 진입·종료 10회 후 메모리(지오메트리·텍스처) 누수 없는지
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://localhost:8790';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
fs.mkdirSync(OUT + 'orig/new', { recursive: true });
fs.writeFileSync(OUT + 'orig/new/3d-model.html', execSync('git show origin/main:new/3d-model.html', { cwd: ROOT, maxBuffer: 64 << 20 }));
const results = []; const ok = (n, p, d) => { results.push({ n, p: !!p, d }); console.log((p ? 'PASS' : 'FAIL') + '  ' + n + (d !== undefined ? '  ' + JSON.stringify(d) : '')); };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
async function open(url) {
  const p = await browser.newPage(); await p.setViewport({ width: 1280, height: 800 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }); p.errs = errs; return p;
}
const settle = p => p.evaluate(() => new Promise(r => setTimeout(r, 2500)));
function diff(a, b) {   // 두 PNG 의 다른 픽셀 비율(채널 차 합 > 40)
  const A = PNG.sync.read(a), B = PNG.sync.read(b); let d = 0;
  for (let i = 0; i < A.data.length; i += 4) { const s = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]); if (s > 40) d++; }
  return d / (A.width * A.height);
}
try {
  // Q2: 원본과 화면 비교
  for (const [name, setup] of [['스케치', ''], ['렌더', "document.querySelector('input[name=vmode][value=render]').click();"]]) {
    const shots = [];
    for (const url of [BASE + '/xr/tests/out/orig/new/3d-model.html', BASE + '/new/3d-model.html']) {
      const p = await open(url); await settle(p);
      if (setup) { await p.evaluate(setup); await p.evaluate(() => new Promise(r => setTimeout(r, 5000))); }
      const buf = Buffer.from(await p.screenshot({ clip: { x: 0, y: 0, width: 930, height: 800 } })); shots.push(buf);
      fs.writeFileSync(OUT + 'q2-' + name + (shots.length === 1 ? '-orig' : '-ours') + '.png', buf); await p.close();
    }
    const r = diff(shots[0], shots[1]);
    ok('Q2 화면 모드 원본과 동일(' + name + ')', r < 0.01, { diffRatio: +r.toFixed(4) });
  }
  // Q14-a: 연결 통로 없음 → 최소 기능
  {
    const p = await open(BASE + '/xr/tests/fallback.html?mode=nobridge&xremu=1');
    await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
    const r = await p.evaluate(async () => { await KHXRLayer.enter('vr'); const s = KHXR_S = KHXRLayer.K.renderer.xr.getSession(); for (let i = 0; i < 10; i++) await new Promise(q => s.requestAnimationFrame(() => q())); const calls = KHXRLayer.K.renderer.info.render.calls; await KHXRLayer.exit(); return { full: KHXRLayer.K.full, mode: 'ok', calls, bridge: !!window.KHXR }; }).catch(e => ({ err: e.message }));
    ok('Q14 연결 통로 없을 때 최소 기능으로 VR', r.full === false && r.calls > 0 && p.errs.length === 0, Object.assign(r, { errs: p.errs.slice(0, 3) }));
    await p.close();
  }
  // Q14-b: [XR] 줄 모두 없음 → 원본 그대로
  {
    const p = await open(BASE + '/xr/tests/fallback.html?mode=noxr'); await settle(p);
    const r = await p.evaluate(() => ({ layer: !!window.KHXRLayer, canvas: !!document.querySelector('#viewer canvas, canvas'), btn: !!document.getElementById('khxr-bar') }));
    ok('Q14 XR 줄이 모두 없어도 원본 정상', !r.layer && r.canvas && !r.btn && p.errs.length === 0, Object.assign(r, { errs: p.errs.slice(0, 3) }));
    await p.close();
  }
  // P8: 패스스루가 없는 세션(비전 프로 WebXR 과 같은 조건) — 몰입과 가상 방 피규어
  {
    const p = await open(BASE + '/new/3d-model.html?xremu=1&xrsession=vr');
    await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
    const r = await p.evaluate(async () => {
      const f = async n => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < n; i++) await new Promise(q => s.requestAnimationFrame(() => q())); };
      await KHXRLayer.enter('vr'); await f(10); const vr = { sm: KHXRLayer.state.sessionMode, mode: KHXRLayer.state.mode };
      KHXRLayer.setMode('fig'); await new Promise(r => setTimeout(r, 2200)); await f(5);
      const fig = { mode: KHXRLayer.state.mode, room: !!(KHXRLayer.room.g && KHXRLayer.room.g.visible), placed: KHXRLayer.fig.placed, calls: KHXR.renderer.info.render.calls };
      await KHXRLayer.exit(); return { vr, fig };
    });
    ok('P8 패스스루 없는 세션: 몰입과 가상 방 피규어', r.vr.sm === 'immersive-vr' && r.vr.mode === 'vr' && r.fig.mode === 'fig' && r.fig.room && r.fig.placed && p.errs.length === 0, Object.assign(r, { errs: p.errs.slice(0, 3) }));
    await p.close();
  }
  // Q13: 진입·종료 10회 메모리
  {
    const p = await open(BASE + '/new/3d-model.html?xremu=1');
    await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
    const r = await p.evaluate(async () => {
      const m = () => Object.assign({}, KHXR.renderer.info.memory);
      let s; for (const m of ['vr', 'fig']) { await KHXRLayer.enter(m); s = KHXR.renderer.xr.getSession(); for (let k = 0; k < 10; k++) await new Promise(q => s.requestAnimationFrame(() => q())); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); }   // 준비: 두 모드를 한 번씩 그려 첫 업로드를 기준선에 포함
      const a = m();
      for (let i = 0; i < 10; i++) { await KHXRLayer.enter(i % 2 ? 'fig' : 'vr'); s = KHXR.renderer.xr.getSession(); for (let k = 0; k < 10; k++) await new Promise(q => s.requestAnimationFrame(() => q())); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); }
      const b = m(); return { before: a, after: b, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null };
    });
    const dg = r.after.geometries - r.before.geometries, dt = r.after.textures - r.before.textures;
    ok('Q13 진입·종료 10회 후 누수 없음(XR 계층)', dg < 60 && dt < 20 && p.errs.length === 0, { dGeo: dg, dTex: dt, heapMB: r.heapMB, errs: p.errs.slice(0, 3) });
    await p.close();
  }
} catch (e) { ok('점검 실행', false, e.message); }
fs.writeFileSync(OUT + 'compat.json', JSON.stringify(results, null, 1));
const fail = results.filter(r => !r.p).length; console.log(`\n${results.length - fail}/${results.length} 통과`);
await browser.close(); process.exit(fail ? 1 : 0);
