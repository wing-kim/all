// 케이프혼타워 XR 스모크 테스트
// 사용: (작업 폴더에서 python3 -m http.server 8790 --bind 127.0.0.1 실행 후)
//   cd xr/tests && npm install && node smoke.mjs [기준주소=http://localhost:8790] [--shots]
// 헤드리스 Chrome + IWER(Quest 3 에뮬레이터)로 VR·피규어·메뉴·웹 복귀를 돌려 보고 수치와 통과 여부를 출력한다.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));

const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://localhost:8790';
const SHOTS = process.argv.includes('--shots');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = process.env.PAGE || 'new/3d-model.html';
fs.mkdirSync(OUT, { recursive: true });

const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });

const shot = async n => { if (SHOTS) await page.screenshot({ path: OUT + n + '.png' }); };
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const frames = n => ev(async n => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < n; i++) await new Promise(r => s.requestAnimationFrame(() => r())); return KHXR.renderer.info.render.calls; }, n);

try {
  await page.goto(BASE + '/' + PAGE + '?xremu=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 30000 });
  const boot = await ev(() => ({ log: KHXRLayer.log.slice(), support: KHXRLayer.support, full: KHXRLayer.K && KHXRLayer.K.full }));
  ok('연결 통로로 시작', boot.full, boot.support);
  await shot('01-desktop');

  // 몰입
  await ev(() => KHXRLayer.enter('vr'));
  let calls = await frames(10);
  const vr = await ev(() => ({ mode: KHXRLayer.state.mode, sm: KHXRLayer.state.sessionMode, opt: KHXRLayer.opt.stat }));
  ok('몰입 진입', vr.mode === 'vr', vr.sm);
  ok('외부 그리기 호출 < 200', calls < 200, calls);
  await shot('02-vr-ext');
  await ev(() => KHXRLayer.goInside()); await frames(40);
  const in1 = await ev(() => ({ inside: KHXR.I.on, key: KHXR.LEVELS[KHXR.I.li].key, y: KHXRLayer.rig.position.y }));
  calls = await frames(5);
  ok('건물 안 1층', in1.inside && in1.key === '1F', in1);
  ok('내부 그리기 호출 < 200', calls < 200, calls);
  await ev(() => KHXRLayer.stepFloor(1)); await frames(40);
  const up = await ev(() => ({ key: KHXR.LEVELS[KHXR.I.li].key, rigY: KHXRLayer.rig.position.y, floor: KHXR.floorTop(KHXR.LEVELS[KHXR.I.li]) }));
  ok('위층 이동과 바닥 높이 일치', up.key !== '1F' && Math.abs(up.rigY - up.floor) < 0.05, up);
  await shot('03-vr-int');

  // 메뉴
  await ev(() => KHXRLayer.ui.openMenu()); await frames(5);
  const menu = await ev(() => ({ tabs: KHXRLayer.ui.tabs(), cells: KHXRLayer.ui.cells().length }));
  ok('메뉴 열림과 탭', menu.cells > 10 && menu.tabs.length >= 7, menu);
  await shot('04-menu');
  // 외관 탭에서 시안 하나 고르기 → 원본 상태 변화
  const pick = await ev(async () => {
    KHXRLayer.ui.setTab(1); await new Promise(r => setTimeout(r, 50));
    const s = KHXR.renderer.xr.getSession(); await new Promise(r => s.requestAnimationFrame(() => r()));
    const c = KHXRLayer.ui.cells().find(c => /^r:dsg:/.test(c.key) && !c.on());
    if (!c) return { ok: false };
    KHXRLayer.ui.activate({ cell: c }); await new Promise(r => setTimeout(r, 800));
    return { ok: true, want: c.key.split(':')[2], got: (document.querySelector('input[name=dsg]:checked') || {}).value, emode: (document.querySelector('input[name=emode]:checked') || {}).value };
  });
  ok('메뉴로 외관 시안 변경', pick.ok && pick.want === pick.got && pick.emode === 'preset', pick);
  await frames(30);
  const cyc = await ev(async () => { const a = (document.querySelector('input[name=dsg]:checked') || {}).value; KHXRLayer.ui.cycle(1); await new Promise(r => setTimeout(r, 600)); return { a, b: (document.querySelector('input[name=dsg]:checked') || {}).value }; });
  ok('시안 넘기기', cyc.a !== cyc.b, cyc);
  await ev(() => KHXRLayer.ui.closeMenu());

  // 피규어
  await ev(() => KHXRLayer.setMode('fig')); await frames(40);
  calls = await frames(5);
  const fig = await ev(() => ({ mode: KHXRLayer.state.mode, bg: KHXR.scene.background === null, scale: KHXRLayer.rig.scale.x }));
  ok('피규어 전환(세션 유지)', fig.mode === 'fig' && fig.bg && fig.scale > 20, fig);
  ok('피규어 그리기 호출 < 200', calls < 200, calls);
  await shot('05-fig');
  await ev(() => KHXRLayer.setMode('vr')); await frames(40);
  const back = await ev(() => ({ mode: KHXRLayer.state.mode, scale: KHXRLayer.rig.scale.x, bg: KHXR.scene.background !== null }));
  ok('피규어 → 몰입 복귀', back.mode === 'vr' && back.scale === 1 && back.bg, back);

  // 렌더 모드(하늘·반사·톤매핑)에서도 기준 유지
  await ev(() => { document.querySelector('input[name=vmode][value=render]').click(); });
  await new Promise(r => setTimeout(r, 2500)); await frames(30);
  calls = await frames(5);
  const rend = await ev(() => ({ on: !!(KHXR.R3D && KHXR.R3D.on), tris: KHXR.renderer.info.render.triangles, opt: KHXRLayer.opt.stat }));
  ok('렌더 모드 그리기 호출 < 200', rend.on && calls < 200, Object.assign({ calls }, rend));
  ok('삼각형 < 150만', rend.tris < 1500000, rend.tris);
  await shot('05b-vr-render');
  await ev(() => { document.querySelector('input[name=vmode][value=sketch]').click(); }); await new Promise(r => setTimeout(r, 1000));

  // 실사 사진 액자
  const photo = await ev(async () => { KHXRLayer.photo.open(KHXRLayer.photo.extList()); for (let i = 0; i < 40 && KHXRLayer.photo.loading; i++) await new Promise(r => setTimeout(r, 200)); const r = { n: KHXRLayer.photo.list.length, ok: KHXRLayer.photo.ok }; KHXRLayer.photo.close(); return r; });
  ok('실사 사진 액자(외관)', photo.n >= 1 && photo.ok, photo);
  // 핸드 입력: 메뉴 3열·가까이, 핀치로 피규어 잡기 준비
  const hand = await ev(async () => {
    await KHEMU.remote.dispatch('set_input_mode', { mode: 'hand' });
    const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 10; i++) await new Promise(r => s.requestAnimationFrame(() => r()));
    KHXRLayer.ui.openMenu(); await new Promise(r => s.requestAnimationFrame(() => r()));
    const cells = KHXRLayer.ui.cells().filter(c => /^r:|^b:|^c:|^lv:/.test(c.key));
    const xs = [...new Set(cells.map(c => Math.round(c.x)))].length;
    const menu = KHXR.scene.getObjectByName('khxr-menu'); const sc = menu ? menu.scale.x : 0;
    const gapPx = cells.length > 1 ? Math.min(...cells.slice(1).map((c, i) => c.y === cells[i].y ? c.x - (cells[i].x + cells[i].w) : 999)) : 0;
    const gapMM = gapPx / 1024 * 1.0 * sc * 1000, hMM = (cells[0] ? cells[0].h : 0) / 768 * 0.75 * sc * 1000;
    KHXRLayer.ui.closeMenu();
    await KHEMU.remote.dispatch('set_input_mode', { mode: 'controller' });
    for (let i = 0; i < 5; i++) await new Promise(r => s.requestAnimationFrame(() => r()));
    return { input: 'hand', cols: xs, scale: +sc.toFixed(2), gapMM: +gapMM.toFixed(1), cellHmm: +hMM.toFixed(1) };
  });
  ok('핸드 메뉴: 3열, 0.45m, 간격 12mm·높이 22mm 이상', hand.cols === 3 && Math.abs(hand.scale - 0.45) < 0.01 && hand.gapMM >= 12 && hand.cellHmm >= 22, hand);

  // 웹 화면 복귀
  await ev(() => KHXRLayer.goInside()); await frames(40);
  const before = await ev(() => ({ key: KHXR.LEVELS[KHXR.I.li].key }));
  await ev(() => KHXRLayer.exit()); await new Promise(r => setTimeout(r, 800));
  const web = await ev(() => { const c = KHXR.camera.position; return { pres: KHXR.renderer.xr.isPresenting, inside: KHXR.I.on, key: KHXR.I.on ? KHXR.LEVELS[KHXR.I.li].key : null, finite: [c.x, c.y, c.z].every(Number.isFinite), hidden: KHXRLayer.opt.hidden.length }; });
  ok('웹 화면으로 같은 층 복귀', !web.pres && web.inside && web.key === before.key && web.finite && web.hidden === 0, web);
  await new Promise(r => setTimeout(r, 1000));
  await shot('06-web-after');

  // 진입·종료 반복
  const loops = await ev(async () => { for (let i = 0; i < 5; i++) { await KHXRLayer.enter(i % 2 ? 'fig' : 'vr'); const s = KHXR.renderer.xr.getSession(); for (let k = 0; k < 5; k++) await new Promise(r => s.requestAnimationFrame(() => r())); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 200)); } return { pres: KHXR.renderer.xr.isPresenting, hidden: KHXRLayer.opt.hidden.length, bgOk: KHXR.scene.background !== null || !!KHXR.R3D.on, rigInScene: KHXR.scene.children.includes(KHXRLayer.rig) }; });
  ok('진입·종료 5회 반복 후 정상', !loops.pres && loops.hidden === 0 && !loops.rigInScene, loops);
} catch (e) {
  ok('시험 실행', false, e.message);
}
ok('콘솔 오류 없음', errors.length === 0, errors.slice(0, 5));
fs.writeFileSync(OUT + 'result.json', JSON.stringify(results, null, 1));
const fail = results.filter(r => !r.pass).length;
console.log(`\n${results.length - fail}/${results.length} 통과`);
await browser.close();
process.exit(fail ? 1 : 0);
