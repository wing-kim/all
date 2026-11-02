// VR 안 보기 방식 전환 시험(IWER Quest 3 에뮬레이터): node vrmode.mjs  (BASE=주소, 기본 http://localhost:8791)
// 스케치 → 렌더 → 실사 3D 로 바꿔도 컨트롤러 레이가 보이는지(Wing cleanLines 가 keep 없는 선을 숨기던 문제), 렌더에서 VR 밝기 보정이 걸리는지,
// 실사 3D 에서 하늘 배경이 있는지, VR 메뉴 '빛과 시간' 보기 방식 맨 앞이 실사 3D 인지, 페이지 오류가 없는지 본다
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE || 'http://localhost:8791';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist'] });
const res = []; const ok = (n, pass, info) => { res.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&prsw=0', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.boot === '준비 완료', { timeout: 180000 });
const st = () => p.evaluate(async () => {
  const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 15; i++) await new Promise(r => s.requestAnimationFrame(() => r()));
  const R = KHXR.renderer; let ray = null; R.xr.getController(1).traverse(o => { if (o.isLine) ray = o.visible; });
  return { vmode: (document.querySelector('input[name=vmode]:checked') || {}).value, ray, exp: +R.toneMappingExposure.toFixed(3), hemi: +KHPR.hemi.intensity.toFixed(3), bg: !!KHXR.scene.background, pr: !!KHPRLayer.on };
});
const pick = v => p.evaluate(v => { const e = document.querySelector('input[name=vmode][value=' + v + ']'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
await p.evaluate(() => KHXRLayer.enter('vr'));
await new Promise(r => setTimeout(r, 2000));
const a = await st(); ok('스케치: 레이 보임', a.ray === true && a.vmode === 'sketch', a);
// 렌더 전환 전 Wing 값(화면 기준)을 기억해 보정 배율을 확인한다
await pick('render'); await new Promise(r => setTimeout(r, 3500));
const b1 = await st(); ok('렌더: 레이 보임', b1.ray === true, b1);
ok('렌더: VR 밝기 보정(노출 ≥ 0.9, 반구광 ≥ 0.3)', b1.exp >= 0.9 && b1.hemi >= 0.3, b1);
await pick('pr3d'); await p.waitForFunction(() => KHPRLayer.on && KHPRLayer.t.ground != null && KHPRLayer.t.warm != null, { timeout: 180000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));
const c = await st(); ok('실사 3D: 레이 보임', c.ray === true && c.pr, c);
ok('실사 3D: 하늘 배경 있음', c.bg, c);
const menu = await p.evaluate(async () => { const U = KHXRLayer.ui; if (!U || !U.openMenu) return null; U.openMenu(); const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 5; i++) await new Promise(r => s.requestAnimationFrame(() => r()));
  const t = U.tabs(), i = t.findIndex(x => /^빛과 시간/.test(x)); U.setTab(i); for (let k = 0; k < 5; k++) await new Promise(r => s.requestAnimationFrame(() => r()));
  return U.cells().map(c => c.key).filter(k => /vmode/.test(k)); });
ok('VR 메뉴: 보기 방식 맨 앞이 실사 3D', menu && /pr3d/.test(menu[0] || ''), menu);
await p.evaluate(() => KHXRLayer.exit()); await new Promise(r => setTimeout(r, 1500));
const d = await p.evaluate(() => ({ exp: +KHXR.renderer.toneMappingExposure.toFixed(3), hemi: +KHPR.hemi.intensity.toFixed(3) }));
ok('VR 종료 뒤 오류 없음', errs.length === 0, { d, errs: errs.slice(0, 3) });
console.log('결과', res.filter(Boolean).length + '/' + res.length);
await b.close();
