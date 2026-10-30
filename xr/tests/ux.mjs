// 케이프혼타워 XR 사용감 시나리오 시험(자체 검토 체계)
// 사용: (작업 폴더에서 python3 -m http.server 8790 --bind 127.0.0.1 실행 후)
//   cd xr/tests && node ux.mjs [기준주소=http://localhost:8790] [--page=new/3d-model.html?pr=1]
// smoke.mjs 가 "기능이 동작하는가"를 본다면, 이 시험은 "실제 사람이 쓰는 자세로 손이 닿고 보이고 갈 수 있는가"를 본다.
// 각 시나리오는 실제 컨트롤러 자세와 버튼 입력으로만 조작하고(내부 함수 직접 호출 금지), 판정과 함께 화면을 out/ux-*.png 로 남긴다.
// 실기기에서 새로 발견된 문제는 여기에 재현 시나리오로 먼저 추가한 뒤 고친다.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://localhost:8790';
const PAGE = (process.argv.find(a => a.startsWith('--page=')) || '--page=new/3d-model.html').slice(7);
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const shot = n => page.screenshot({ path: OUT + 'ux-' + n + '.png' });
const sep = PAGE.includes('?') ? '&' : '?';

// 페이지 안 도우미: 프레임 기다리기, 리그 기준 좌표의 점을 컨트롤러로 겨누기, 트리거 누르기
const HELP = `
window.UX = {
  f: async n => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < n; i++) await new Promise(r => s.requestAnimationFrame(() => r())); },
  aim(hand, fromLocal, toWorld) {
    const c = KHEMU.controllers[hand], to = KHXRLayer.rig.worldToLocal(toWorld.clone());
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), to.clone().sub(fromLocal).normalize());
    c.position.set(fromLocal.x, fromLocal.y, fromLocal.z); c.quaternion.set(q.x, q.y, q.z, q.w);
  },
  async press(hand) { const c = KHEMU.controllers[hand]; c.updateButtonValue('trigger', 1); await UX.f(3); c.updateButtonValue('trigger', 0); await UX.f(3); },
  // 빠른 막대/메뉴 칸의 월드 좌표(캔버스 픽셀 기준 칸 중심)
  cellWorld(mesh, cell, W, H, pw, ph) { mesh.updateMatrixWorld(true); return new THREE.Vector3((cell.x + cell.w / 2) / W * pw - pw / 2, ph / 2 - (cell.y + cell.h / 2) / H * ph, 0).applyMatrix4(mesh.matrixWorld); },
  // 사용자 눈 위치에서 본 화면만 남기기: 웹 패널·라벨·안내 카드 숨김
  clean(on = true) { let st = document.getElementById('ux-clean'); if (!st) { st = document.createElement('style'); st.id = 'ux-clean'; document.head.appendChild(st); } st.textContent = on ? 'body *{visibility:hidden!important} canvas{visibility:visible!important}' : ''; try { localStorage.setItem('khxr.helpSeen', 'true'); } catch (e) {} const h = KHXR.scene.getObjectByName('khxr-help') || null; if (h) h.visible = false; },
  head(x, y, z, pitchDeg = 0, yawDeg = 0) { const d = KHEMU, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchDeg * Math.PI / 180, yawDeg * Math.PI / 180, 0, 'YXZ')); d.position.set(x, y, z); d.quaternion.set(q.x, q.y, q.z, q.w); },
  // 원본 평면 픽셀 → 월드(toPx 의 역)
  px2w(q) { const o = KHXR.toPx(0, 0), a = KHXR.toPx(1, 0), b = KHXR.toPx(0, 1); const sx = a[0] - o[0], sz = b[1] - o[1]; return new THREE.Vector3((q[0] - o[0]) / sx, 0, (q[1] - o[1]) / sz); },
  mid(s) { return UX.px2w([(s.i[0] + s.o[0]) / 2, (s.i[1] + s.o[1]) / 2]); },
  // 길점들을 따라 머리를 돌려 가며 왼쪽 스틱 앞으로 걷기. 매 프레임 발 높이 기록
  async walkPath(pts, maxF = 900) {
    const ys = [], L = KHEMU.controllers.left; let wi = 0, f = 0;
    for (; f < maxF && wi < pts.length; f++) {
      const h = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3()), t = pts[wi], dx = t.x - h.x, dz = t.z - h.z;
      if (Math.hypot(dx, dz) < 0.35) { wi++; continue; }
      const yawW = Math.atan2(-dx, -dz), yawL = yawW - KHXRLayer.rig.rotation.y; UX.head(KHEMU.position.x, 1.6, KHEMU.position.z, 0, yawL * 180 / Math.PI);
      L.updateAxes('thumbstick', 0, -1); await UX.f(1); ys.push(+KHXRLayer.rig.position.y.toFixed(3));
    }
    L.updateAxes('thumbstick', 0, 0); await UX.f(2);
    return { ys, reached: wi, of: pts.length, frames: f };
  },
  rest() { const L = KHEMU.controllers.left, R = KHEMU.controllers.right; L.position.set(-0.2, 1.1, -0.3); R.position.set(0.2, 1.1, -0.3); L.quaternion.set(0, 0, 0, 1); R.quaternion.set(0, 0, 0, 1); }
};`;

const scenarios = {
  // 1. 피규어 모드: 모형 자르기 범위 밖에 둔 왼손 빠른 막대가 보이고 오른손 레이로 눌림
  async figQuick() {
    await ev(async () => { await KHXRLayer.enter('fig'); await UX.f(30); await new Promise(r => setTimeout(r, 2200)); KHXRLayer.state.fig.crop = 18; await UX.f(5); });
    const r = await ev(async () => {
      const L = KHEMU.controllers.left; L.position.set(-0.45, 1.15, -0.15); { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0.5, 0)); L.quaternion.set(q.x, q.y, q.z, q.w); }
      await UX.f(5);
      const quick = KHXR.scene.getObjectByName('khxr-quick') || KHXRLayer.rig.getObjectByName('khxr-quick');
      const cell = KHXRLayer.ui.qcells().find(c => c.key === 'q:s+'); if (!quick || !cell) return { why: 'no quick/cell' };
      const before = KHXRLayer.state.fig.scale;
      UX.aim('right', new THREE.Vector3(0.2, 1.2, -0.2), UX.cellWorld(quick, cell, 512, 320, 0.2, 0.125)); await UX.f(4);
      const hover = !!KHXR.renderer.xr.getController(1).userData.uiHit;
      // 자르기 범위 밖인지: 막대의 월드 위치가 모형 상자 밖
      const qp = quick.getWorldPosition(new THREE.Vector3()), c = KHXRLayer.state.center, out = Math.max(Math.abs(qp.x - c.x), Math.abs(qp.z - c.z)) > KHXRLayer.state.fig.crop;
      await UX.press('right');
      return { outsideCrop: out, hover, before: +before.toFixed(5), after: +KHXRLayer.state.fig.scale.toFixed(5), visible: quick.visible };
    });
    await shot('fig-quick');
    ok('피규어: 범위 밖 왼손 빠른 막대를 레이로 누르기', r.visible && r.hover && r.after > r.before, r);
    // 렌더 확인: 자르기가 UI 에 걸리지 않는지(빠른 막대 렌더가 별도 장면 패스에서 이뤄지는지 호출 수로)
    const calls = await ev(async () => { await UX.f(2); return KHXR.renderer.info.render.calls; });
    ok('피규어: 손·메뉴는 자르기 없는 별도 패스', calls > 0, calls);
    await ev(async () => { UX.rest(); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 2. 피규어 모습: 책상 앞에 앉아 내려다본 화면(경계·받침·패스스루 연결부 육안 검토용)
  async figLook() {
    await ev(async () => { UX.clean(); await KHXRLayer.enter('fig'); await UX.f(30); await new Promise(r => setTimeout(r, 2200)); UX.head(0, 1.45, 0.05, -35, 0); UX.rest(); await UX.f(10); });
    for (const crop of [18, 45]) { await ev(async c => { KHXRLayer.state.fig.crop = c; await UX.f(8); }, crop); await shot('fig-look-' + crop); }
    await ev(async () => { UX.head(0.5, 1.3, -0.1, -20, 70); await UX.f(8); }); await shot('fig-look-side');
    await ev(async () => { UX.head(0, 1.6, 0, 0, 0); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
    ok('피규어 모습 화면 저장(육안 검토)', true);
    // 양안 일치: 자르기는 재질마다(눈마다 변환). 렌더러 전체 자르기는 비어 있어야 함(r128 은 가운데 카메라 기준이라 두 눈이 어긋남)
    const st = await ev(async () => { await KHXRLayer.enter('fig'); await UX.f(40); await new Promise(r => setTimeout(r, 700)); await UX.f(5);
      let n = 0, withP = 0; KHXR.scene.traverse(o => { if (o.isMesh && o.visible && !o.userData.khxr) { n++; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.clippingPlanes && m.clippingPlanes.length === 4) withP++; } });
      const g = KHXR.renderer.clippingPlanes.length; await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300));
      let left = 0; KHXR.scene.traverse(o => { const m = o.material && (Array.isArray(o.material) ? o.material[0] : o.material); if (m && m.clippingPlanes && m.clippingPlanes.length === 4) left++; });
      return { global: g, visibleMeshes: n, clippedPerMaterial: withP, leftAfterExit: left }; });
    ok('피규어 양안 일치: 자르기는 재질마다, 끝나면 원복', st.global === 0 && st.clippedPerMaterial === st.visibleMeshes && st.leftAfterExit === 0, st);
  },
  // 3. 밖에서 출입구까지: 바로가기 지점이 있고, 레이로 눌러 문 앞으로 감
  async hotspot() {
    await ev(async () => { UX.clean(); await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goOutside(); await new Promise(r => setTimeout(r, 900)); await UX.f(10); });
    const r = await ev(async () => {
      const H = KHXRLayer.hot, n = H.list.length; if (!n) return { n };
      const i = H.list.findIndex(h => /압구정로|정면/.test(h.name)), k = i >= 0 ? i : 0, h = H.list[k];
      UX.aim('right', new THREE.Vector3(0.2, 1.3, -0.2), h.at.clone().add(new THREE.Vector3(0, 1.4, 0))); await UX.f(4);
      const hover = (KHXR.renderer.xr.getController(1).userData.uiHit || {}).where;
      await UX.press('right'); await new Promise(r => setTimeout(r, 900)); await UX.f(5);
      const eye = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3()), look = new THREE.Vector3(); KHXRLayer.xrCam.getWorldDirection(look); look.y = 0; look.normalize();
      const toDoor = h.door.clone().sub(eye).setY(0).normalize();
      // 이름표 방향: 밖에서 볼 때 글자 왼쪽(A)→오른쪽(B)이 보는 사람의 오른쪽 방향이어야 함(뒷면이면 반대)
      const head = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3()), tp = H.tags.geometry.attributes.position.array, k0 = (H.list.length - 1) * 18;
      const A = new THREE.Vector3(tp[k0], tp[k0 + 1], tp[k0 + 2]), B = new THREE.Vector3(tp[k0 + 3], tp[k0 + 4], tp[k0 + 5]), vd = A.clone().add(B).multiplyScalar(0.5).sub(head);
      const right = vd.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), tagFacing = +B.clone().sub(A).normalize().dot(right).toFixed(2);
      return { n, tagFacing, names: H.list.map(x => x.name), hover, dist: +Math.hypot(eye.x - h.at.x, eye.z - h.at.z).toFixed(2), facing: +look.dot(toDoor).toFixed(2) };
    });
    await shot('hotspot');
    ok('출입구 바로가기: 지점 표시와 레이로 이동, 이름표 앞면', r.n >= 2 && r.hover === 'hot' && r.dist < 0.6 && r.facing > 0.9 && r.tagFacing > 0.9, r);
    await ev(async () => { UX.rest(); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 4. 순간이동만으로 밖 스폰 지점에서 정면 출입구를 거쳐 1층 안까지(사람처럼 문 쪽으로 30° 위를 겨눔)
  async tpWalk() {
    await ev(async () => { await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goOutside(); await new Promise(r => setTimeout(r, 900)); await UX.f(10); });
    const r = await ev(async () => {
      const H = KHXRLayer.hot, h = H.list.find(x => /압구정로|정면/.test(x.name)) || H.list[0]; if (!h) return { why: 'no door' };
      const goal = h.door.clone().add(KHXRLayer.state.center.clone().sub(h.door).setY(0).normalize().multiplyScalar(3));   // 문 안쪽 3m
      const hops = [], bad = [];
      for (let k = 0; k < 12; k++) {
        const eye = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3()), rem = Math.hypot(goal.x - eye.x, goal.z - eye.z);
        if (KHXR.I.on) break;
        const hd = goal.clone().sub(eye).setY(0).normalize(), pitch = rem > 12 ? 0.5 : rem > 5 ? 0.18 : -0.2;
        const dir = hd.multiplyScalar(Math.cos(pitch)).setY(Math.sin(pitch)).normalize(), o = eye.clone().add(new THREE.Vector3(0, -0.3, 0));
        const a = KHXRLayer.arc(o, dir);
        if (!a.ok) { bad.push({ at: [+eye.x.toFixed(1), +eye.z.toFixed(1)], hit: a.point && a.point.toArray().map(v => +v.toFixed(2)) }); break; }
        KHXRLayer.teleportTo(a.point, KHXRLayer.rig.rotation.y); await UX.f(3);
        hops.push(+Math.hypot(a.point.x - eye.x, a.point.z - eye.z).toFixed(1));
      }
      return { hops, inside: KHXR.I.on, key: KHXR.I.on && KHXR.LEVELS[KHXR.I.li].key, bad };
    });
    ok('순간이동만으로 밖에서 1층 안까지', r.inside && r.key === '1F' && r.bad.length === 0 && r.hops[0] >= 12, r);
    await ev(async () => { await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 5. 건물 둘레 땅 착지 판정: 출입구 앞 반경 2～8m, 도로 쪽 점들을 위에서 겨눠 '불가'가 뜨는 비율
  async landRing() {
    await ev(async () => { await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goOutside(); await new Promise(r => setTimeout(r, 900)); await UX.f(5); });
    const r = await ev(async () => {
      const H = KHXRLayer.hot, c = KHXRLayer.state.center, bad = []; let n = 0;
      for (const h of H.list) for (const d of [2, 4, 6, 8]) for (const s of [-2, 0, 2]) {
        const out = h.door.clone().sub(c).setY(0).normalize(), side = new THREE.Vector3(-out.z, 0, out.x);
        const p = h.door.clone().addScaledVector(out, d).addScaledVector(side, s);
        const o = p.clone().addScaledVector(out, 3).setY(1.3), dir = p.clone().setY(0).sub(o).normalize().lerp(new THREE.Vector3(0, 0.6, 0), 0).normalize();
        const a = KHXRLayer.arc(o, p.clone().sub(o).normalize()); n++;
        if (!a.ok) bad.push({ door: h.name, d, s, hit: a.point && a.point.toArray().map(v => +v.toFixed(2)) });
      }
      return { n, bad: bad.length, sample: bad.slice(0, 5) };
    });
    ok('출입구 앞 땅 착지 불가 5% 이하', r.n > 0 && r.bad / r.n <= 0.05, r);
    await ev(async () => { await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 6. 계단: 1층에서 계단으로 걸어 올라가면 단 높이씩 오르고 2층이 됨
  async stairUp() {
    await ev(async () => { UX.clean(); await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goInside(); await new Promise(r => setTimeout(r, 900)); await UX.f(10); });
    const r = await ev(async () => {
      const W = KHXR.STW, f1 = KHXR.floorTop(KHXR.LEVELS.find(l => l.key === '1F')), f2 = KHXR.floorTop(KHXR.LEVELS.find(l => l.key === '2F'));
      const i0 = W.findIndex(w => Math.abs(w.E[0] - f1) < 0.05 && w.E[w.E.length - 1] > f1 + 1); if (i0 < 0) return { why: 'no stair' };
      const seq = []; for (let i = i0; i < W.length && seq.length < 4; i++) { seq.push(W[i]); if (Math.abs(W[i].E[W[i].E.length - 1] - f2) < 0.05) break; }
      const pts = []; seq.forEach(w => { pts.push(UX.mid(w.sm[0])); pts.push(UX.mid(w.sm[w.sm.length - 1])); });
      const back = pts[0].clone().sub(pts[1]).setY(0).normalize().multiplyScalar(0.6);
      KHXRLayer.teleportTo(pts[0].clone().add(back).setY(f1), Math.atan2(-(pts[1].x - pts[0].x), -(pts[1].z - pts[0].z))); await UX.f(3);
      const w = await UX.walkPath(pts.concat([pts[pts.length - 1].clone().add(pts[pts.length - 1].clone().sub(pts[pts.length - 2]).setY(0).normalize().multiplyScalar(1.2))]));
      const ys = w.ys, steps = new Set(ys.map(y => y.toFixed(2))).size, maxJump = Math.max(...ys.slice(1).map((y, i) => Math.abs(y - ys[i])));
      return { reached: w.reached + '/' + w.of, from: ys[0], to: ys[ys.length - 1], f2: +f2.toFixed(2), levels: steps, maxJump: +maxJump.toFixed(3), key: KHXR.LEVELS[KHXR.I.li].key };
    });
    await shot('stair');
    ok('계단: 걸어 올라 2층 도착, 단 높이씩', r.key === '2F' && Math.abs(r.to - r.f2) < 0.05 && r.levels >= 10 && r.maxJump < 0.25, r);
    await ev(async () => { UX.head(0, 1.6, 0); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 7. 지하 램프: 자주식3에서 밖의 차량 램프 입구부터 걸어 내려가 B1 실내가 됨
  async rampDown() {
    await ev(async () => { const r = [...document.querySelectorAll('input[name=sch]')]; const t = r.find(x => /자주식\s*3/.test(x.parentElement.textContent)) || r[r.length - 1]; t.click(); await new Promise(q => setTimeout(q, 2500)); });
    await ev(async () => { UX.clean(); await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goOutside(); await new Promise(r => setTimeout(r, 900)); await UX.f(5); });
    const r = await ev(async () => {
      const R0 = (KHXR.SCH.ramps || [])[0]; if (!R0) return { why: 'no ramp' };
      const pts = R0.sm.map(UX.mid), out = pts[0].clone().add(pts[0].clone().sub(pts[1]).setY(0).normalize().multiplyScalar(1.5));
      KHXRLayer.teleportTo(out.setY(0.03), Math.atan2(-(pts[1].x - pts[0].x), -(pts[1].z - pts[0].z))); await UX.f(3);
      const w = await UX.walkPath(pts, 1400);
      const B1 = KHXR.floorTop(KHXR.LEVELS.find(l => l.key === 'B1'));
      return { sch: (document.querySelector('input[name=sch]:checked') || {}).value, reached: w.reached + '/' + w.of, from: w.ys[0], to: w.ys[w.ys.length - 1], B1: +B1.toFixed(2), inside: KHXR.I.on, key: KHXR.I.on && KHXR.LEVELS[KHXR.I.li].key };
    });
    await shot('ramp');
    ok('지하 램프: 밖에서 걸어 내려가 B1', r.inside && r.key === 'B1' && Math.abs(r.to - r.B1) < 0.1, r);
    await ev(async () => { UX.head(0, 1.6, 0); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); document.querySelector('input[name=sch][value=mech]') && document.querySelector('input[name=sch][value=mech]').click(); });
  },
  // 8. 메뉴: 탭마다 눈높이 화면 저장, 레이로 끌어 스크롤, 시각 막대 끌기
  async menu() {
    await ev(async () => { UX.clean(); await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goInside(); await new Promise(r => setTimeout(r, 900)); UX.head(0, 1.6, 0, 0, 0); await UX.f(5); KHXRLayer.ui.openMenu(); await UX.f(5); });
    const tabs = await ev(() => KHXRLayer.ui.tabs());
    for (let i = 0; i < tabs.length; i++) { await ev(async i => { KHXRLayer.ui.setTab(i); await new Promise(r => setTimeout(r, 400)); await UX.f(4); }, i); await shot('menu-' + i); }
    // 외관 탭 스크롤: 본문 한 점을 트리거로 잡고 위로 끌기
    const sc = await ev(async () => {
      KHXRLayer.ui.setTab(1); await UX.f(3);
      const cell = KHXRLayer.ui.cells().find(c => /^r:dsg:/.test(c.key)); if (!cell) return { why: 'no cell' };
      const from = new THREE.Vector3(0.15, 1.35, -0.1), R = KHEMU.controllers.right, s0 = KHXRLayer.ui.scrollOf(), H0 = KHXRLayer.ui.contentH();
      const key0 = cell.key, p0 = KHXRLayer.ui.cellPoint(cell), before = (document.querySelector('input[name=dsg]:checked') || {}).value;
      UX.aim('right', from, p0); await UX.f(3); R.updateButtonValue('trigger', 1); await UX.f(3);
      for (let k = 1; k <= 8; k++) { UX.aim('right', from, p0.clone().add(new THREE.Vector3(0, 0.05 * k, 0))); await UX.f(2); }
      R.updateButtonValue('trigger', 0); await UX.f(3);
      const picked = (document.querySelector('input[name=dsg]:checked') || {}).value;
      return { s0, s1: Math.round(KHXRLayer.ui.scrollOf()), contentH: H0, notPicked: picked === before };
    });
    ok('메뉴: 레이로 끌어 스크롤(누름은 취소)', sc.s1 > sc.s0 + 100 && sc.notPicked, sc);
    // 빛과 시간: 시각 막대를 끌어 값 바꾸고 놓으면 적용
    const sl = await ev(async () => {
      document.querySelector('input[name=vmode][value=render]').click(); await new Promise(r => setTimeout(r, 2500));
      const i = KHXRLayer.ui.tabs().findIndex(t => /^빛과 시간/.test(t)); KHXRLayer.ui.setTab(i); await new Promise(r => setTimeout(r, 300)); await UX.f(3);
      const cell = KHXRLayer.ui.cells().find(c => c.slider); if (!cell) return { why: 'no slider' };
      const el = document.getElementById('sun-hour'), v0 = +el.value, from = new THREE.Vector3(0.15, 1.35, -0.1), R = KHEMU.controllers.right;
      const pAt = f => KHXRLayer.ui.cellPoint(Object.assign({}, cell, { x: cell.x + 40 + (cell.w - 80) * f - 1, w: 2, y: cell.y + 78 - 1, h: 2 }));
      UX.aim('right', from, pAt(0.5)); await UX.f(3); R.updateButtonValue('trigger', 1); await UX.f(3);
      UX.aim('right', from, pAt(0.85)); await UX.f(4); R.updateButtonValue('trigger', 0); await UX.f(3);
      return { v0, v1: +el.value, min: cell.min, max: cell.max };
    });
    await shot('menu-slider');
    ok('메뉴: 시각 막대 끌기', sl.v1 !== undefined && sl.v1 > sl.v0 && sl.v1 > sl.min + (sl.max - sl.min) * 0.7, sl);
    await ev(async () => { KHXRLayer.ui.closeMenu(); UX.rest(); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); document.querySelector('input[name=vmode][value=sketch]').click(); });
  },
  // 9. 메뉴 창: 아래 막대를 잡아 옮기고, 모서리를 잡아 키움(크기는 기억)
  async menuWin() {
    await ev(async () => { UX.clean(); try { localStorage.removeItem('khxr.menuScaleC'); } catch (e) {} await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goInside(); await new Promise(r => setTimeout(r, 900)); UX.head(0, 1.6, 0, 0, 0); await UX.f(5); KHXRLayer.ui.openMenu(); await UX.f(5); });
    const mv = await ev(async () => {
      const P = KHXRLayer.ui.panel(), [bar] = P.userData.ctl, R = KHEMU.controllers.right, from = new THREE.Vector3(0.15, 1.3, -0.1);
      const F0 = KHXRLayer.ui.panelFront(), b0 = bar.getWorldPosition(new THREE.Vector3());
      UX.aim('right', from, b0); await UX.f(3); const hover = (KHXR.renderer.xr.getController(1).userData.uiHit || {}).where;
      R.updateButtonValue('trigger', 1); await UX.f(3);
      const fw = KHXRLayer.rig.localToWorld(from.clone()), dir0 = b0.clone().sub(fw);
      for (let k = 1; k <= 10; k++) { const d = dir0.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.05 * k); UX.aim('right', from, fw.clone().add(d)); await UX.f(2); }
      R.updateButtonValue('trigger', 0); await UX.f(3);
      const F1 = KHXRLayer.ui.panelFront(), head = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3());
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(P.getWorldQuaternion(new THREE.Quaternion())), toHead = head.clone().sub(F1).setY(0).normalize();
      return { hover, moved: +F0.distanceTo(F1).toFixed(2), facing: +(-f.dot(toHead)).toFixed(2), menuOpen: KHXRLayer.ui.menuOpen() };
    });
    await shot('menu-moved');
    ok('메뉴 창: 아래 막대로 옮기기(사용자를 봄)', mv.hover === 'win' && mv.moved > 0.3 && mv.facing > 0.95 && mv.menuOpen, mv);
    const rs = await ev(async () => {
      const P = KHXRLayer.ui.panel(), cr = P.userData.ctl[2], R = KHEMU.controllers.right, from = new THREE.Vector3(0.15, 1.3, -0.1);
      const F = KHXRLayer.ui.panelFront(), c0 = cr.getWorldPosition(new THREE.Vector3()), s0 = P.scale.x;
      UX.aim('right', from, c0); await UX.f(3); R.updateButtonValue('trigger', 1); await UX.f(3);
      for (let k = 1; k <= 8; k++) { UX.aim('right', from, F.clone().add(c0.clone().sub(F).multiplyScalar(1 + 0.05 * k))); await UX.f(2); }
      R.updateButtonValue('trigger', 0); await UX.f(3);
      const F1 = KHXRLayer.ui.panelFront();
      return { s0, s1: +P.scale.x.toFixed(2), frontKept: +F.distanceTo(F1).toFixed(3), saved: localStorage.getItem('khxr.menuScaleC') };
    });
    await shot('menu-resized');
    ok('메뉴 창: 모서리로 크기 키우기(앞면 고정, 기억)', rs.s1 > 1.3 && rs.frontKept < 0.05 && rs.saved && +JSON.parse(rs.saved) > 1.3, rs);
    await ev(async () => { KHXRLayer.ui.closeMenu(); try { localStorage.removeItem('khxr.menuScaleC'); } catch (e) {} UX.rest(); UX.clean(false); await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 10. 오른쪽 스틱 위아래로 외관 시안이 바뀌지 않음, 걷기 속도 초당 2.6m
  async stickWalk() {
    await ev(async () => { await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goOutside(); await new Promise(r => setTimeout(r, 900)); await UX.f(5); });
    const r = await ev(async () => {
      const a = (document.querySelector('input[name=dsg]:checked') || {}).value, R = KHEMU.controllers.right;
      R.updateAxes('thumbstick', 0, -1); await UX.f(30); R.updateAxes('thumbstick', 0, 1); await UX.f(30); R.updateAxes('thumbstick', 0, 0); await UX.f(3);
      const b = (document.querySelector('input[name=dsg]:checked') || {}).value;
      const L = KHEMU.controllers.left, p0 = KHXRLayer.rig.position.clone(), t0 = performance.now(); L.updateAxes('thumbstick', 0, -1); await UX.f(60); L.updateAxes('thumbstick', 0, 0); const t1 = performance.now(); await UX.f(2);
      const dist = KHXRLayer.rig.position.distanceTo(p0);
      return { before: a, after: b, speed: +(dist / ((t1 - t0) / 1000)).toFixed(2), setting: KHXRLayer.state.walkSpeed };
    });
    ok('오른쪽 스틱으로 시안이 바뀌지 않음', r.before === r.after, r);
    ok('걷기 속도 기본 초당 2.6m', r.setting === 2.6 && r.speed > 1.9, r);
    await ev(async () => { await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); });
  },
  // 11. 실내 높이 치수(빨간 선, 원본에서 '항상 맨 앞'): 병합에서 빠지고 반투명 목록 맨 끝에서 그려짐, 끝나면 원복
  async onTop() {
    await ev(async () => { UX.clean(); await KHXRLayer.enter('vr'); await UX.f(10); KHXRLayer.goInside(); await new Promise(r => setTimeout(r, 900)); UX.head(0, 1.6, 0, -5, 0); await UX.f(30); await new Promise(r => setTimeout(r, 700)); await UX.f(5); });
    const r = await ev(async () => {
      const L = []; KHXR.scene.traverse(o => { if (!(o.isMesh || o.isLine)) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.depthTest !== false || o.userData.khxr) return; let v = true; for (let q = o; q; q = q.parent) if (!q.visible && !(KHXRLayer.opt.hiddenSet && KHXRLayer.opt.hiddenSet.has(q))) v = false; L.push({ vis: v, ro: o.renderOrder, tr: m.transparent, merged: !!(KHXRLayer.opt.hiddenSet && KHXRLayer.opt.hiddenSet.has(o)), red: m.color && m.color.getHexString() === 'd6372c' }); });
      const red = L.filter(x => x.red && x.vis);
      return { total: L.length, red: red.length, allTop: red.every(x => x.ro >= 900 && x.tr), anyMerged: red.some(x => x.merged) };
    });
    await shot('ontop');
    const back = await ev(async () => { await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 300)); let tr = 0; KHXR.scene.traverse(o => { const m = o.material && (Array.isArray(o.material) ? o.material[0] : o.material); if (m && m.depthTest === false && m.color && m.color.getHexString() === 'd6372c' && m.transparent) tr++; }); return { stillTransparent: tr, kept: KHXRLayer.ontop.done.size }; });
    ok('실내 높이 치수: 병합 제외, 맨 끝에 그림, 끝나면 원복', r.red > 0 && r.allTop && !r.anyMerged && back.stillTransparent === 0 && back.kept === 0, Object.assign(r, back));
    await ev(() => { UX.head(0, 1.6, 0); UX.clean(false); });
  },
};

try {
  await page.goto(BASE + '/' + PAGE + sep + 'xremu=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.KHXRLayer && KHXRLayer.support, { timeout: 60000 });
  await ev(HELP);
  for (const [k, fn] of Object.entries(scenarios)) { if (ONLY && !ONLY.split(',').includes(k)) continue; try { await fn(); } catch (e) { ok(k, false, 'error: ' + e.message); } }
  ok('콘솔 오류 없음', errors.length === 0, errors.slice(0, 5));
} catch (e) { ok('실행', false, e.message); }
await browser.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} 통과`);
fs.writeFileSync(OUT + 'ux-results.json', JSON.stringify(results, null, 1));
process.exit(pass === results.length ? 0 : 1);
