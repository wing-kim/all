/*
  케이프혼타워 XR 계층 (xr/kh-xr.js)
  - new/3d-model.html 끝에서 불러온다. Wing 코드가 열어 준 window.KHXR(연결 통로)로 내부 함수를 쓴다.
  - 모드: 몰입(1:1 'vr'), 피규어('fig'), 웹 화면(세션 종료). 퀘스트는 패스스루 가능 세션 하나로 두 모드를 오간다.
  - 기준 문서: xr/docs/plan.html (7-1장 조작과 메뉴 명세)
  - 개발용: ?xremu=1 (Quest 3 에뮬레이터), ?xrsession=vr (패스스루 없는 세션 강제), ?xrdebug=1 (메뉴에 로그)
*/
(function () {
  'use strict';
  if (window.KHXRLayer) return;
  const VER = '1030.p1';
  const Q = new URLSearchParams(location.search);
  const SRC = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('./', SRC).href;
  const X = window.KHXRLayer = { ver: VER, log: [] };
  const log = (...a) => { const t = a.join(' '); X.log.push(t); if (X.log.length > 200) X.log.shift(); console.log('[khxr]', t); };
  const FONT = '"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('khxr.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('khxr.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ================= 0. 시작 ================= */
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function boot() {
    if (Q.get('xremu')) {
      try {
        await loadScript(BASE + 'vendor/iwer-2.7.0.min.js');
        const d = new IWER.XRDevice(IWER.metaQuest3); d.installRuntime({ forceInstall: true });
        d.stereoEnabled = Q.get('stereo') === '1'; d.position.set(0, 1.6, 0);
        d.controllers.left.position.set(-0.25, 1.3, -0.35); d.controllers.right.position.set(0.25, 1.3, -0.35);
        window.KHEMU = d; log('에뮬레이터 설치');
      } catch (e) { log('에뮬레이터 로드 실패', e.message); }
    }
    let K = null;
    for (let i = 0; i < 100 && !(K = bridge()); i++) await new Promise(r => setTimeout(r, 200));
    if (!K) K = await fallbackBridge();
    if (!K) { log('3D 장면을 찾지 못해 XR을 켜지 않습니다'); return; }
    X.K = K;
    init(K);
  }
  function bridge() { const B = window.KHXR; return B && B.renderer && B.scene && B.camera ? Object.assign(B, { full: true }) : null; }
  // 연결 통로가 없는 원본(예전 사본 업로드 등): 다음 렌더에서 renderer·scene·camera 만 붙잡아 최소 기능으로 동작
  function fallbackBridge() {
    return new Promise(res => {
      const T = window.THREE; if (!T) return res(null);
      const prev = T.Scene.prototype.onBeforeRender;
      const to = setTimeout(() => { T.Scene.prototype.onBeforeRender = prev; res(null); }, 5000);
      T.Scene.prototype.onBeforeRender = function (r, s, c) {
        if (c && c.isPerspectiveCamera && s.children.length > 10) {
          T.Scene.prototype.onBeforeRender = prev; clearTimeout(to);
          log('연결 통로 없음: 최소 기능으로 동작');
          res({ renderer: r, scene: s, camera: c, full: false });
        }
      };
    });
  }

  /* ================= 1. 초기화 ================= */
  let T, K, R, scene, rig, xrCam, fadeMesh;
  const S = X.state = {
    mode: null, session: null, sessionMode: null, ar: false, entering: false,
    fig: { pos: null, yaw: 0, scale: 1 / 150, crop: 45 }, center: null,
    turn: store.get('turn', 'snap'), showMass: store.get('showMass', false), opt: !Q.get('noopt'),
    input: 'controller', lastTurn: 0, saved: null, fade: null
  };
  function init(k) {
    K = k; T = window.THREE; R = K.renderer; scene = K.scene;
    R.xr.enabled = true;
    R.xr.setReferenceSpaceType('local-floor');
    // 연결 통로가 없는 경우: 원본 루프가 XR 중에도 그리지 않도록 막는다
    const r0 = R.render.bind(R);
    R.render = function (s, c) { if (R.xr.isPresenting && c !== xrCam && !c.isCubeCamera && !(c.parent && c.parent.isCubeCamera)) return; return r0(s, c); };
    rig = new T.Group(); rig.name = 'khxr-rig';
    xrCam = new T.PerspectiveCamera(70, 1, 0.08, 5000); xrCam.name = 'khxr-cam'; rig.add(xrCam);
    fadeMesh = new T.Mesh(new T.SphereGeometry(0.25, 16, 12), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: T.BackSide, depthTest: false, depthWrite: false }));
    fadeMesh.renderOrder = 10000; fadeMesh.visible = false; xrCam.add(fadeMesh);
    X.rig = rig; X.xrCam = xrCam;
    initControllers();
    UI.init();
    addButtons();
    patchCull();
    log('준비 완료', VER, K.full ? '연결 통로 사용' : '최소 기능');
  }

  /* ================= 2. 진입 버튼(화면) ================= */
  async function addButtons() {
    if (!window.isSecureContext || !navigator.xr) { log('WebXR 없음: 화면 모드만'); return; }
    const [vr, ar] = await Promise.all(['immersive-vr', 'immersive-ar'].map(m => navigator.xr.isSessionSupported(m).catch(() => false)));
    X.support = { vr, ar };
    if (!vr && !ar) return;
    const st = document.createElement('style');
    st.textContent = '#khxr-bar{position:fixed;left:14px;bottom:44px;z-index:9999;display:flex;gap:8px;flex-wrap:wrap}#khxr-bar button{display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:8px;border:1px solid rgba(0,0,0,.08);background:#1f5c55;color:#fff;font:600 14px ' + FONT + ';cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.18)}#khxr-bar button.alt{background:#fff;color:#1f5c55}#khxr-bar small{opacity:.6;font-weight:400;font-size:11px}#khxr-bar button:focus-visible{outline:3px solid #7fd6ff}';
    document.head.appendChild(st);
    const bar = document.createElement('div'); bar.id = 'khxr-bar';
    const mk = (t, m, cls) => { const b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; b.innerHTML = t; b.onclick = () => enter(m).catch(e => { log('진입 실패', e.message); alert('XR을 시작하지 못했습니다: ' + e.message); }); bar.appendChild(b); };
    if (vr || ar) mk('VR로 들어가기 <small>' + VER + '</small>', 'vr');
    mk(ar ? '내 공간에 놓기' : '모형으로 보기', 'fig', 'alt');
    document.body.appendChild(bar);
    log('XR 버튼 표시', JSON.stringify(X.support));
  }

  /* ================= 3. 세션 ================= */
  async function enter(mode) {
    if (S.session || S.entering) return;
    S.entering = true;
    try {
      const wantAR = X.support.ar && Q.get('xrsession') !== 'vr';
      const sm = wantAR ? 'immersive-ar' : 'immersive-vr';
      const opt = ['hand-tracking', 'bounded-floor', 'anchors', 'hit-test'];
      if (wantAR && mode === 'fig') opt.push('plane-detection');   // 공간 정보 동의창은 피규어로 시작할 때만
      const session = await navigator.xr.requestSession(sm, { requiredFeatures: ['local-floor'], optionalFeatures: opt });
      R.xr.setFramebufferScaleFactor(store.get('fbScale', 1));
      await R.xr.setSession(session);
      S.session = session; S.sessionMode = sm; S.ar = sm === 'immersive-ar';
      try { const L = session.renderState.baseLayer; if (L && 'fixedFoveation' in L) L.fixedFoveation = store.get('foveation', 0.5); } catch (e) {}
      onStart(mode);
      session.addEventListener('end', onEnd);
      session.addEventListener('inputsourceschange', () => UI.detectInput());
      log('세션 시작', sm, mode);
    } finally { S.entering = false; }
  }
  function onStart(mode) {
    const cam = K.camera;
    S.saved = { shAuto: R.shadowMap.autoUpdate, clearAlpha: R.getClearAlpha() };
    if (K.I && K.I.doll && K.setDoll) K.setDoll(false);
    R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true;    // 그림자는 장면이 바뀔 때만 다시 계산
    scene.add(rig);
    S.center = buildingCenter();
    if (mode === 'fig') { setMode('fig', { fromDesktop: true }); }
    else { setMode('vr'); placeFromDesktop(); }
    if (S.opt) Opt.build();
    R.setAnimationLoop(frame);
    UI.onSessionStart();
  }
  function onEnd() {
    R.setAnimationLoop(null);
    const leaving = S.mode;
    transferToDesktop(leaving);
    setVisualsFor(null);
    Opt.clear();
    UI.onSessionEnd();
    scene.remove(rig);
    R.shadowMap.autoUpdate = S.saved.shAuto; R.shadowMap.needsUpdate = true;
    R.setClearAlpha(1);
    S.session = null; S.mode = null;
    if (K.resize) K.resize();
    log('세션 종료 → 웹 화면');
  }
  function exitToWeb() { if (S.session) S.session.end(); }
  X.enter = enter; X.exit = exitToWeb;

  /* ================= 4. 위치와 이동(몰입) ================= */
  const V = (x, y, z) => new T.Vector3(x, y, z);
  function buildingCenter() { const t = K.controls ? K.controls.target.clone() : V(0, 0, 0); return V(t.x, 0, t.z); }
  function yawOf(from, to) { return Math.atan2(-(to.x - from.x), -(to.z - from.z)); }
  function headLocal() { return xrCam.position; }
  // rig 를 옮겨 "사용자 머리 아래 바닥"이 p 에, 시선이 yaw 가 되게
  function placeUser(p, yaw) {
    const h = headLocal();
    rig.rotation.set(0, yaw, 0); rig.scale.set(1, 1, 1); rig.updateMatrix();
    const off = V(h.x, 0, h.z).applyQuaternion(rig.quaternion);
    rig.position.set(p.x - off.x, p.y, p.z - off.z);
  }
  function wingTarget() {      // 원본이 방금 정한 데스크톱 시점(트윈 목표 포함)
    const A = K.anim; let p, t;
    if (A) { p = A.p1.clone(); t = A.t1.clone(); K.anim = null; } else { p = K.camera.position.clone(); t = K.controls ? K.controls.target.clone() : p.clone().add(V(0, 0, -1)); }
    return { p, t };
  }
  function curLevel() { return K.I && K.I.on && K.LEVELS ? K.LEVELS[K.I.li] : null; }
  function floorY(L) { return L && K.floorTop ? K.floorTop(L) : 0; }
  function placeFromDesktop() {
    const { p, t } = wingTarget();
    if (curLevel()) placeUser(V(p.x, floorY(curLevel()), p.z), yawOf(p, t));
    else outsideFacing(t, p);
  }
  function outsideFacing(T0, C) {   // 건물 중심 T0 에서 C 방향으로 32m 떨어진 땅에서 건물을 바라봄
    let dx = C.x - T0.x, dz = C.z - T0.z, d = Math.hypot(dx, dz); if (d < 1) { dx = -1; dz = 0; d = 1; }
    const p = V(T0.x + dx / d * 32, 0, T0.z + dz / d * 32); placeUser(p, yawOf(p, T0));
  }
  function sortedLevels() { return (K.LEVELS || []).map((L, i) => ({ i, y: floorY(L), L })).sort((a, b) => a.y - b.y); }
  function goLevel(li) {
    if (!K.full) return;
    fade(() => {
      if (!K.I.on) K.enterInt();
      if (K.I.doll) K.setDoll(false);
      K.placeLevel(li, true);
      const { p, t } = wingTarget();
      placeUser(V(p.x, floorY(K.LEVELS[li]), p.z), yawOf(p, t));
      afterChange();
    });
  }
  function stepFloor(dir) {
    if (!K.full) return;
    const L = sortedLevels();
    if (!K.I.on) { const g = L.findIndex(s => s.L.key === '1F'); goLevel(L[g >= 0 ? g : 0].i); return; }
    const k = L.findIndex(s => s.i === K.I.li), n = k + dir;
    if (n >= 0 && n < L.length) goLevel(L[n].i); else UI.toast(dir > 0 ? '가장 위층입니다' : '가장 아래층입니다');
  }
  function goOutside() {
    if (!K.full) return;
    fade(() => {
      const wasIn = K.I.on; const h = rigHeadWorld();
      if (wasIn) K.exitInt();
      const { t } = wingTarget();
      outsideFacing(S.center || t, wasIn ? h : K.camera.position);
      afterChange();
    });
  }
  function goInside() { const L = sortedLevels(); const g = L.findIndex(s => s.L.key === '1F'); if (L.length) goLevel(L[g >= 0 ? g : 0].i); }
  function goView(btn) {     // 시점 프리셋: 원본 버튼을 누르고 그 시점 자리로 사용자를 옮김
    fade(() => {
      btn.click();
      setTimeout(() => {
        const { p, t } = wingTarget();
        const L = curLevel();
        if (L) placeUser(V(p.x, floorY(L), p.z), yawOf(p, t));
        else placeUser(V(p.x, Math.max(0, p.y - 1.6), p.z), yawOf(p, t));
        afterChange();
      }, 30);
    });
  }
  function rigHeadWorld() { return xrCam.getWorldPosition(V(0, 0, 0)); }
  function teleportTo(pt) { const yaw = rig.rotation.y; placeUser(pt, yaw); }
  function snapTurn(a) {
    const h = rigHeadWorld();
    rig.position.sub(h).applyAxisAngle(V(0, 1, 0), a).add(h); rig.rotation.y += a;
  }
  function walk(ax, ay, dt) {
    const d = new T.Vector3(); xrCam.getWorldDirection(d); d.y = 0; if (d.lengthSq() < 1e-6) return; d.normalize();
    const side = V(-d.z, 0, d.x), sp = 1.6 * dt;
    const mv = d.multiplyScalar(-ay * sp).add(side.multiplyScalar(ax * sp));
    const L = curLevel();
    if (L && K.walkable) {     // 원본 걷기 충돌 판정 재사용(벽·기둥). 축별로 미끄러지기
      const h = rigHeadWorld();
      const okX = K.walkable(h.x + mv.x, h.z, L), okZ = K.walkable(h.x, h.z + mv.z, L);
      if (!okX) mv.x = 0; if (!okZ) mv.z = 0;
    }
    rig.position.add(mv);
  }
  function afterChange() { S.center = S.center || buildingCenter(); R.shadowMap.needsUpdate = true; UI.dirty(); }

  /* ================= 5. 피규어 ================= */
  const hiddenBg = [];
  function setMode(m, o = {}) {
    const prev = S.mode;
    if (m === prev) return;
    if (m === 'fig') {
      if (!S.fig.pos) S.fig.pos = V(0, 0.78, -0.55);
      if (o.fromDesktop || prev === 'vr') {
        // 화면(또는 몰입)에서 보던 방향이 모형에서도 정면이 되게
        const from = prev === 'vr' ? rigHeadWorld() : K.camera.position;
        S.fig.yaw = Math.atan2(from.x - S.center.x, from.z - S.center.z);
      }
      S.mode = 'fig';
    } else {
      S.mode = 'vr';
      if (prev === 'fig') { rig.scale.set(1, 1, 1); }
    }
    setVisualsFor(S.mode);
    if (S.opt) Opt.dirty();
    UI.dirty();
    log('모드', S.mode);
  }
  function figMatrix() {
    const m = new T.Matrix4().compose(S.fig.pos, new T.Quaternion().setFromAxisAngle(V(0, 1, 0), -S.fig.yaw), V(1, 1, 1).multiplyScalar(S.fig.scale));
    return m.multiply(new T.Matrix4().makeTranslation(-S.center.x, 0, -S.center.z));
  }
  function applyFigRig() { figMatrix().invert().decompose(rig.position, rig.quaternion, rig.scale); }
  // 몰입/피규어에 따른 배경 처리
  let bgSaved = null;
  function setVisualsFor(m) {
    if (m === 'fig' && S.ar) {
      if (!bgSaved) bgSaved = { bg: scene.background, fog: scene.fog };
      if (!hiddenBg.length) hideBig();
    } else if (bgSaved) {
      hiddenBg.forEach(o => { o.visible = o.userData.khxrVis; }); hiddenBg.length = 0;
      scene.background = bgSaved.bg; scene.fog = bgSaved.fog; bgSaved = null;
    }
  }
  function hideBig() {
    const box = new T.Box3(), sz = new T.Vector3();
    scene.traverse(o => {
      if (!o.isMesh || !o.visible || isOurs(o)) return;
      const sky = (window.THREE.Sky && o instanceof window.THREE.Sky) || (o.material && o.material.uniforms && o.material.uniforms.sunPosition);
      let big = false;
      if (!sky) { box.setFromObject(o); box.getSize(sz); big = Math.max(sz.x, sz.z) > 160 && sz.y < 2; }
      if (sky || big) { o.userData.khxrVis = o.visible; o.visible = false; hiddenBg.push(o); }
    });
  }
  function isOurs(o) { for (let p = o; p; p = p.parent) if (p === rig || p === Opt.group || p.userData.khxr) return true; return false; }
  function cropPlanes() {
    const c = S.center, r = S.fig.crop;
    if (!S._crop || S._crop.k !== c.x + ',' + c.z + ',' + r) S._crop = { k: c.x + ',' + c.z + ',' + r, p: [
      new T.Plane(V(1, 0, 0), -(c.x - r)), new T.Plane(V(-1, 0, 0), c.x + r), new T.Plane(V(0, 0, 1), -(c.z - r)), new T.Plane(V(0, 0, -1), c.z + r)] };
    return S._crop.p;
  }
  // r128 양안 절두체 합치기 오류 보정(rig 확대 시 가까운 모형이 컬링됨): 컬링 직전 넉넉한 대칭 절두체로
  function patchCull() {
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = function (r, s, c) {
      if (c && c.isArrayCamera && rig.scale.x !== 1) { const n = 0.01, e = n * Math.tan(Math.PI / 3); c.projectionMatrix.makePerspective(-e, e, e, -e, n, 200); }
      return prev.apply(this, arguments);
    };
  }

  /* ================= 6. 입력 ================= */
  const ctrls = [];
  function initControllers() {
    X.ray = new T.Raycaster();
    for (let i = 0; i < 2; i++) {
      const c = R.xr.getController(i);
      const line = new T.Line(new T.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, -1)]), new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.75 }));
      line.scale.z = 3; line.visible = false; c.add(line);
      c.userData = { i, line, hand: i ? 'right' : 'left', src: null, aim: false, sq: false, hit: null, uiHit: null, isHand: false };
      c.addEventListener('connected', e => { c.userData.src = e.data; c.userData.hand = e.data.handedness; c.userData.isHand = !!e.data.hand; line.visible = true; UI.detectInput(); });
      c.addEventListener('disconnected', () => { line.visible = false; c.userData.src = null; });
      c.addEventListener('selectstart', () => onSelectStart(c));
      c.addEventListener('selectend', () => onSelectEnd(c));
      c.addEventListener('squeezestart', () => { c.userData.sq = true; Grab.update(); });
      c.addEventListener('squeezeend', () => { c.userData.sq = false; Grab.update(); });
      rig.add(c); ctrls.push(c);
      const h = R.xr.getHand(i); h.userData.khxr = true; rig.add(h); c.userData.handObj = h;
      const grip = R.xr.getControllerGrip(i); rig.add(grip); c.userData.grip = grip;
    }
    // 바닥 표시
    const mk = new T.Mesh(new T.RingGeometry(0.2, 0.28, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.9, depthTest: false }));
    mk.renderOrder = 999; mk.visible = false; mk.userData.khxr = true; X.marker = mk;
  }
  function aim(c) {
    const m = new T.Matrix4().extractRotation(c.matrixWorld);
    X.ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
    X.ray.ray.direction.set(0, 0, -1).applyMatrix4(m).normalize();
    return X.ray;
  }
  function onSelectStart(c) {
    const u = c.userData;
    if (u.uiHit) { u.pressUI = u.uiHit; return; }
    if (S.mode === 'vr') u.aim = true;
    else if (S.mode === 'fig') Fig.selectStart(c);
  }
  function onSelectEnd(c) {
    const u = c.userData;
    if (u.pressUI) { const h = u.pressUI; u.pressUI = null; if (u.uiHit && u.uiHit.key === h.key) UI.activate(h); return; }
    if (u.aim) { u.aim = false; if (u.hit) fade(() => teleportTo(u.hit), 0.6); u.hit = null; X.marker.visible = false; }
  }
  const prevBtn = new WeakMap();
  function pollGamepads(dt, time) {
    for (const src of S.session.inputSources) {
      const gp = src.gamepad; if (!gp || src.hand) continue;
      const was = prevBtn.get(src) || [], b = gp.buttons.map(x => x && x.pressed), edge = k => b[k] && !was[k];
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0] || 0, ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1] || 0;
      const h = src.handedness;
      if (edge(4)) { if (S.mode === 'vr') stepFloor(+1); else Fig.levelHint(+1); }
      if (edge(5)) { if (S.mode === 'vr') stepFloor(-1); else Fig.levelHint(-1); }
      if (edge(3) && h === 'left') UI.toggleMenu();
      if (edge(1) && S.mode === 'vr' && !UI.menuOpen()) { if (K.I && K.I.on) goOutside(); else goInside(); }
      if (h === 'left' && S.mode === 'vr' && Math.hypot(ax, ay) > 0.15) walk(ax, ay, dt);
      if (h === 'right') {
        if (S.mode === 'vr') {
          if (S.turn === 'snap') { if (Math.abs(ax) > 0.7 && !S.turnHeld) { snapTurn(ax > 0 ? -Math.PI / 6 : Math.PI / 6); S.turnHeld = true; } else if (Math.abs(ax) < 0.3) S.turnHeld = false; }
          else if (Math.abs(ax) > 0.15) snapTurn(-ax * 1.6 * dt);
        } else if (S.mode === 'fig') {
          if (Math.abs(ax) > 0.15) S.fig.yaw += ax * 1.4 * dt;
        }
        // 조합 넘기기(위아래)
        if (Math.abs(ay) > 0.7 && !S.cycleHeld) { UI.cycle(ay > 0 ? 1 : -1); S.cycleHeld = true; } else if (Math.abs(ay) < 0.3) S.cycleHeld = false;
      }
      prevBtn.set(src, b);
    }
  }
  function updateRays() {
    let anyHit = null;
    for (const c of ctrls) {
      const u = c.userData; u.uiHit = null;
      if (!u.src) continue;
      aim(c);
      let len = 3;
      const uh = UI.raycast(X.ray); if (uh) { u.uiHit = uh; len = uh.distance; }
      if (!uh && u.aim && S.mode === 'vr') {
        u.hit = null; let dist = 3;
        X.ray.far = 60;
        for (const h of X.ray.intersectObjects(pickables(), true)) {
          const m = h.object.material; if (!visibleChain(h.object) || (m && (m.visible === false || (m.transparent && m.opacity < 0.2)))) continue;
          dist = h.distance;
          if (h.face && V().copy(h.face.normal).transformDirection(h.object.matrixWorld).y > 0.6) u.hit = h.point.clone();
          break;
        }
        len = dist; if (u.hit) anyHit = u.hit;
      }
      u.line.scale.z = len / Math.max(rig.scale.x, 1e-6);
      u.line.material.color.set(u.uiHit ? 0xffffff : (u.aim && !u.hit ? 0xff7a6b : 0x7fd6ff));
    }
    const mk = X.marker;
    if (anyHit) { if (!mk.parent) scene.add(mk); mk.visible = true; mk.position.copy(anyHit).y += 0.02; } else mk.visible = false;
  }
  function visibleChain(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
  function pickables() { return scene.children.filter(o => o !== rig && o !== X.marker && !o.userData.khxr && o.type !== 'DirectionalLight'); }

  /* ================= 7. 프레임 ================= */
  let last = 0;
  function frame(time) {
    const dt = Math.min(0.1, (time - (last || time)) / 1000); last = time;
    pollGamepads(dt, time);
    if (S.mode === 'fig') { Fig.update(dt); applyFigRig(); }
    Grab.tick();
    updateRays();
    UI.update(time, dt);
    fadeTick(dt);
    if (S.opt) Opt.check(time);
    // 피규어: 배경 비우고 대지 주변만
    let cp0 = null;
    if (S.mode === 'fig' && S.ar) { scene.background = null; scene.fog = null; R.setClearAlpha(0); cp0 = R.clippingPlanes; R.clippingPlanes = cropPlanes(); }
    else if (S.ar) R.setClearAlpha(1);
    xrCam.near = S.mode === 'fig' ? 0.02 : 0.08; xrCam.far = S.mode === 'fig' ? 60 : 5000;
    rig.updateMatrixWorld(true);
    R.render(scene, xrCam);
    if (cp0) R.clippingPlanes = cp0;
  }

  /* ================= 8. 화면 전환 효과 ================= */
  function fade(fn, dur = 0.35) {
    if (!S.session) { fn(); return; }
    S.fade = { t: 0, dur, fn, done: false };
  }
  function fadeTick(dt) {
    const F = S.fade; if (!F) return;
    F.t += dt; const half = F.dur / 2;
    if (!F.done && F.t >= half) { F.done = true; try { F.fn(); } catch (e) { log('전환 오류', e.message); } }
    const a = F.t < half ? F.t / half : Math.max(0, 1 - (F.t - half) / half);
    fadeMesh.visible = a > 0.01; fadeMesh.material.opacity = a;
    if (F.t >= F.dur) { S.fade = null; fadeMesh.visible = false; }
  }

  /* ================= 9. 웹 화면으로 이어받기 ================= */
  function transferToDesktop(m) {
    try {
      const cam = K.camera, ctl = K.controls;
      if (m === 'vr') {
        const h = rigHeadWorld(), d = new T.Vector3(); xrCam.getWorldDirection(d); d.y = 0; d.normalize();
        if (K.I && K.I.on && K.placeLevel) {
          K.placeLevel(K.I.li, true); K.anim = null;
          const y = cam.position.y;               // 원본 눈높이 유지
          cam.position.set(h.x, y, h.z);
          if (ctl) ctl.target.set(h.x + d.x * 0.25, y, h.z + d.z * 0.25);
        } else {
          K.anim = null;
          cam.position.set(h.x, Math.max(h.y, 1.7), h.z);
          if (ctl) ctl.target.copy(S.center || buildingCenter()).setY(8);
          if (ctl) { const dist = cam.position.distanceTo(ctl.target); if (dist < 20) cam.position.copy(ctl.target).add(cam.position.clone().sub(ctl.target).setLength(40)); }
        }
      } else if (m === 'fig') {
        // 모형을 보던 방향 그대로 바깥 투시로
        if (K.I && K.I.on && K.exitInt) K.exitInt();
        K.anim = null;
        const head = xrCam.position.clone();   // rig 로컬(=실제 방)
        const rel = head.clone().sub(S.fig.pos); const dist = Math.min(400, Math.max(60, rel.length() / S.fig.scale));
        rel.applyAxisAngle(V(0, 1, 0), S.fig.yaw).normalize();
        const c = S.center.clone().setY(10);
        cam.position.copy(c).addScaledVector(rel, dist);
        if (ctl) ctl.target.copy(c);
      }
      if (ctl) ctl.update();
    } catch (e) { log('웹 화면 이어받기 실패', e.message); }
  }

  /* ================= 10. 잡기(피규어) ================= */
  const Grab = {
    g: null,
    update() {
      const on = ctrls.filter(c => c.userData.sq || c.userData.pinchHold);
      if (S.mode !== 'fig' || !on.length) { this.g = null; return; }
      this.g = { c: on, p0: on.map(c => c.position.clone()), fig: { pos: S.fig.pos.clone(), yaw: S.fig.yaw, scale: S.fig.scale } };
    },
    tick() {
      const g = this.g; if (!g) return;
      const now = g.c.map(c => c.position.clone());
      if (g.c.length === 1) S.fig.pos.copy(g.fig.pos).add(now[0].sub(g.p0[0]));
      else {
        const d0 = g.p0[0].distanceTo(g.p0[1]), d1 = now[0].distanceTo(now[1]);
        const a0 = Math.atan2(g.p0[1].x - g.p0[0].x, g.p0[1].z - g.p0[0].z), a1 = Math.atan2(now[1].x - now[0].x, now[1].z - now[0].z);
        S.fig.scale = clampScale(g.fig.scale * d1 / Math.max(d0, 0.01));
        S.fig.yaw = g.fig.yaw - (a1 - a0);
        const m0 = g.p0[0].clone().add(g.p0[1]).multiplyScalar(0.5), m1 = now[0].clone().add(now[1]).multiplyScalar(0.5);
        S.fig.pos.copy(g.fig.pos).add(m1.sub(m0));
      }
      UI.dirtySoon();
    }
  };
  const clampScale = s => Math.min(1 / 20, Math.max(1 / 1000, s));
  const Fig = {
    update() {},
    selectStart(c) { X.ray.far = 10; },
    levelHint() {}
  };
  X.setMode = m => fade(() => { if (m === 'vr' && S.mode === 'fig') { setMode('vr'); placeFromDesktop(); } else setMode(m); });
  X.goLevel = goLevel; X.stepFloor = stepFloor; X.goOutside = goOutside; X.goInside = goInside;

  /* ================= 11. 최적화 프록시 =================
     XR 동안만 같은 재질 메시를 합친 대체 메시를 쓰고 원본은 숨긴다. 원본이 장면을 바꾸면 다시 만든다. */
  const Opt = X.opt = {
    group: null, hidden: [], sig: '', t: 0, stat: null, need: false,
    visibleMeshes() {
      const out = [];
      (function walk(o) {
        if (!o.visible || o === rig || o === Opt.group || o.userData.khxr) return;
        if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && o.geometry && o.geometry.attributes.position && !Array.isArray(o.material)) out.push(o);
        for (const c of o.children) walk(c);
      })(scene);
      return out;
    },
    sigOf(list) { let h = list.length; for (const m of list) h = (h * 31 + m.id) | 0; return h + ':' + list.length; },
    merge(list) {
      const names = Object.keys(list[0].geometry.attributes);
      let total = 0;
      const geos = list.map(m => { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld); total += g.attributes.position.count; return g; });
      const out = new T.BufferGeometry();
      for (const n of names) {
        const a0 = geos[0].attributes[n], arr = new a0.array.constructor(total * a0.itemSize);
        let off = 0; for (const g of geos) { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }
        out.setAttribute(n, new T.BufferAttribute(arr, a0.itemSize, a0.normalized));
      }
      geos.forEach(g => g.dispose()); out.computeBoundingSphere(); return out;
    },
    build() {
      this.clear();
      const t0 = performance.now(), meshes = this.visibleMeshes(), buckets = new Map();
      scene.updateMatrixWorld(true);
      for (const m of meshes) {
        const k = m.material.uuid + '|' + Object.keys(m.geometry.attributes).sort().join(',') + '|' + m.castShadow + m.receiveShadow + '|' + m.renderOrder;
        (buckets.get(k) || buckets.set(k, []).get(k)).push(m);
      }
      const grp = new T.Group(); grp.name = 'khxr-proxy'; grp.userData.khxr = true;
      for (const list of buckets.values()) {
        if (list.length < 2) continue;
        const mesh = new T.Mesh(this.merge(list), list[0].material);
        mesh.castShadow = list[0].castShadow; mesh.receiveShadow = list[0].receiveShadow; mesh.renderOrder = list[0].renderOrder;
        mesh.matrixAutoUpdate = false; grp.add(mesh);
        list.forEach(m => { m.visible = false; this.hidden.push(m); });
      }
      scene.add(grp); this.group = grp; this.sig = this.sigOf(meshes);
      this.stat = { meshes: meshes.length, merged: grp.children.length, ms: Math.round(performance.now() - t0) };
      R.shadowMap.needsUpdate = true;
      log('최적화', JSON.stringify(this.stat));
    },
    clear() {
      this.hidden.forEach(m => { m.visible = true; }); this.hidden = [];
      if (this.group) { this.group.children.forEach(c => c.geometry.dispose()); scene.remove(this.group); this.group = null; }
    },
    dirty() { this.need = true; },
    check(time) {
      if (time - this.t < 500 && !this.need) return;
      this.t = time;
      this.hidden.forEach(m => { m.visible = true; });
      const sig = this.sigOf(this.visibleMeshes());
      this.hidden.forEach(m => { m.visible = false; });
      if (sig !== this.sig || this.need) { this.need = false; this.build(); }
    }
  };

  /* ================= 12. 메뉴(공간 UI) ================= */
  const UI = X.ui = (function () {
    const W = 1024, H = 768;
    let cv, g, tex, panel, open = false, cells = [], hover = '', tab = 0, page = 0, toastMsg = '', toastT = 0, dirtyFlag = true, lastDraw = 0, soon = 0;
    let cycleTarget = null;    // 조합 넘기기 대상 {name, mode}
    let qcv, qg, qtex, quick, qcells = [];
    const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    function init() {
      cv = document.createElement('canvas'); cv.width = W; cv.height = H; g = cv.getContext('2d');
      tex = new T.CanvasTexture(cv);
      panel = new T.Mesh(new T.PlaneGeometry(1.0, 0.75), new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: T.DoubleSide }));
      panel.renderOrder = 1001; panel.visible = false; panel.userData.khxr = true; panel.name = 'khxr-menu';
      qcv = document.createElement('canvas'); qcv.width = 512; qcv.height = 220; qg = qcv.getContext('2d');
      qtex = new T.CanvasTexture(qcv);
      quick = new T.Mesh(new T.PlaneGeometry(0.2, 0.086), new T.MeshBasicMaterial({ map: qtex, transparent: true, depthTest: false, side: T.DoubleSide }));
      quick.renderOrder = 1000; quick.userData.khxr = true; quick.name = 'khxr-quick'; quick.visible = false;
    }
    /* ----- 항목 만들기: 원본 DOM 을 읽는다 ----- */
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    function txtOf(inp) {
      const lb = inp.closest('label'); if (!lb) return { t: inp.value || inp.id, s: '' };
      const sm = lb.querySelector('small'); let t = '';
      lb.childNodes.forEach(n => { if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && n !== sm && n.tagName !== 'INPUT') t += n.textContent; });
      return { t: t.replace(/\s+/g, ' ').trim(), s: sm ? sm.textContent.replace(/\s+/g, ' ').trim() : '' };
    }
    const hiddenEl = (el, lenient) => el.disabled || !!el.closest(lenient ? '.sec[hidden]' : '[hidden]');
    function radios(name, mode) {
      const emode = () => ($('input[name=emode]:checked') || {}).value;
      return $$('input[name="' + name + '"]').filter(i => !hiddenEl(i, !!mode) || mode).map(inp => {
        const { t, s } = txtOf(inp);
        return { key: 'r:' + name + ':' + inp.value, label: t, sub: s, on: () => inp.checked && (!mode || emode() === mode), off: () => hiddenEl(inp, true),
          act: () => { if (mode) { const em = document.getElementById(mode === 'preset' ? 'em-preset' : 'em-combo'); if (em && !em.checked) em.click(); } if (!inp.checked || mode) inp.click(); cycleTarget = { name, mode }; }, cyc: { name, mode } };
      });
    }
    function checks(ids) {
      return ids.map(id => document.getElementById(id)).filter(i => i && !hiddenEl(i)).map(inp => {
        const { t, s } = txtOf(inp);
        return { key: 'c:' + inp.id, label: t, sub: s, check: true, on: () => inp.checked, act: () => inp.click() };
      });
    }
    function buttons(sel, lab) {
      return $$(sel).filter(b => !hiddenEl(b) && getComputedStyle(b).display !== 'none').map((b, k) => ({ key: 'b:' + (b.id || sel + k), label: (lab ? lab(b) : (b.textContent || b.title || '').replace(/\s+/g, ' ').trim()), on: () => b.getAttribute('aria-pressed') === 'true', act: () => b.click() }));
    }
    function swatches(id) {
      const box = document.getElementById(id); if (!box || hiddenEl(box)) return [];
      return [...box.querySelectorAll('button')].map((b, k) => ({ key: 's:' + id + k, label: b.title || b.textContent.trim() || '색', color: getComputedStyle(b).backgroundColor, on: () => b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true', act: () => b.click() }));
    }
    function range(id, label, steps) {
      const el = document.getElementById(id); if (!el || hiddenEl(el)) return [];
      return steps.map(v => ({ key: 'g:' + id + v, label: label(v), on: () => Math.abs(+el.value - v) < 0.09, act: () => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } }));
    }
    const used = new Set();
    function tabs() {
      const inside = K.I && K.I.on;
      const levels = K.full ? sortedLevels().slice().reverse().map(s => ({ key: 'lv:' + s.i, label: s.L.name || s.L.key, sub: s.L.use ? String(s.L.use).slice(0, 14) : '', on: () => K.I.on && K.I.li === s.i, act: () => goLevel(s.i) })) : [];
      const T0 = [
        { t: '이동', sec: [
          { h: '시점', items: buttons('.views [data-v]').filter(b => b.key !== 'b:v-int').map(b => Object.assign(b, { act: (el => () => goView(el))(document.getElementById(b.key.slice(2))) })) },
          { h: '층', items: levels },
          { h: '', items: [{ key: 'x:out', label: inside ? '건물 밖으로' : '건물 안으로 (1층)', act: () => inside ? goOutside() : goInside() }] },
          { h: '내부 시점', items: inside ? buttons('[data-c],[data-w]') : [] }] },
        { t: '외관', sec: [
          { h: '추천 시안', items: radios('dsg', 'preset') }, { h: '시안 색상', items: swatches('sw-dsg') },
          { h: '마감재', items: radios('cfin', 'combo') }, { h: '마감재 색상', items: swatches('sw-fin') },
          { h: '입면 형태', items: radios('form', 'combo') }, { h: '창 크기', items: radios('win') }] },
        { t: '실내', sec: [
          { h: '1층 안', items: radios('g1') }, { h: '1층 옵션', items: checks($$('#sec-g1 input[type=checkbox]').map(i => i.id)) },
          { h: '주차 방식', items: radios('sch') }, { h: '최상층', items: checks(['t-use7']) },
          { h: '내부 표시', items: inside ? buttons('[data-iv]') : [] }] },
        { t: '빛과 시간', sec: [
          { h: '보기 방식', items: radios('vmode').filter(i => !/photo/.test(i.key)) },
          { h: '시간대', items: radios('tod') }, { h: '계절', items: radios('season') },
          { h: '시각 (적용 버튼으로 반영)', items: range('sun-hour', v => (v | 0) + '시', [7, 9, 12, 15, 17, 19]).concat(buttons('#sun-apply')) },
          { h: '조명', items: checks(['t-citylights']) }] },
        { t: '보기', sec: [
          { h: '현황과 신축', items: radios('era') }, { h: '겹쳐 보기', items: radios('mixq') },
          { h: '주변', items: checks(['t-city', 't-ctx', 't-b1', 't-limits', 't-frame']) },
          { h: '단면', items: inside ? buttons('#secBtn,#secAllBtn') : [] }] },
      ];
      // 기타: 위에서 쓰지 않은 원본 패널 그룹 자동 수집
      used.clear(); T0.forEach(t => t.sec.forEach(s => s.items.forEach(i => used.add(i.key))));
      const skipNames = new Set(['vwm', 'emode', 'vmode']);
      const etc = [];
      const names = [...new Set($$('#panel input[type=radio]').map(i => i.name))].filter(n => !skipNames.has(n) && !$$('input[name="' + n + '"]').some(i => used.has('r:' + n + ':' + i.value)));
      names.forEach(n => { const it = radios(n); if (it.length) etc.push({ h: n, items: it }); });
      const ck = $$('#panel input[type=checkbox]').filter(i => i.id && !used.has('c:' + i.id) && !/^t-(hq|ao|labels|cxlab)$/.test(i.id)).map(i => i.id);
      if (ck.length) etc.push({ h: '설정 항목', items: checks(ck) });
      if (S.showMass) etc.push({ h: '매스 조정', items: range('c-floors', v => v + '층', [4, 5, 6, 7, 8]) });
      T0.push({ t: '기타', sec: etc });
      T0.push({ t: '설정', sec: [
        { h: '회전', items: [{ key: 'set:snap', label: '30° 끊어 돌기', on: () => S.turn === 'snap', act: () => { S.turn = 'snap'; store.set('turn', 'snap'); } }, { key: 'set:smooth', label: '부드럽게 돌기', on: () => S.turn === 'smooth', act: () => { S.turn = 'smooth'; store.set('turn', 'smooth'); } }] },
        { h: '메뉴', items: [{ key: 'set:mass', label: '매스 조정 보이기', check: true, on: () => S.showMass, act: () => { S.showMass = !S.showMass; store.set('showMass', S.showMass); } }, { key: 'set:help', label: '조작 안내 보기', act: () => Help.show(true) }] },
        { h: '성능', items: [{ key: 'set:opt', label: '메시 합치기 최적화', check: true, on: () => S.opt, act: () => { S.opt = !S.opt; if (S.opt) Opt.build(); else Opt.clear(); } }] },
        { h: Q.get('xrdebug') ? '로그' : '', items: Q.get('xrdebug') ? X.log.slice(-6).map((l, k) => ({ key: 'log' + k, label: l.slice(0, 40) })) : [] }] });
      return T0;
    }
    /* ----- 그리기 ----- */
    function fit(t, w, size, weight) {
      let s = size; g.font = weight + ' ' + s + 'px ' + FONT;
      while (s > 15 && g.measureText(t).width > w) { s--; g.font = weight + ' ' + s + 'px ' + FONT; }
      if (g.measureText(t).width > w) { while (t.length > 1 && g.measureText(t + '…').width > w) t = t.slice(0, -1); t += '…'; }
      return t;
    }
    function layout(T0) {
      const out = []; const tb = T0[tab] || T0[0];
      const COL = 4, gap = 10, cw = (W - 48 - gap * (COL - 1)) / COL, ch = 60, top = 168, bottom = H - 76;
      const pages = [[]]; let y = top;
      tb.sec.forEach(sec => {
        if (!sec.items.length) return;
        const rows = Math.ceil(sec.items.length / COL), need = (sec.h ? 34 : 0) + rows * (ch + gap);
        if (y + Math.min(need, (sec.h ? 34 : 0) + ch + gap) > bottom && pages[pages.length - 1].length) { pages.push([]); y = top; }
        if (sec.h) { pages[pages.length - 1].push({ head: sec.h, x: 28, y }); y += 34; }
        sec.items.forEach((it, k) => {
          const c = k % COL; if (k && c === 0) y += ch + gap;
          if (y + ch > bottom) { pages.push([]); y = top; if (sec.h) { pages[pages.length - 1].push({ head: sec.h + ' (계속)', x: 28, y }); y += 34; } }
          pages[pages.length - 1].push(Object.assign({ x: 24 + c * (cw + gap), y, w: cw, h: ch }, it));
        });
        y += ch + gap + 8;
      });
      return pages;
    }
    function draw() {
      if (!open) return;
      const T0 = tabs(); if (tab >= T0.length) tab = 0;
      const pages = layout(T0); if (page >= pages.length) page = pages.length - 1;
      cells = [];
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(14,18,20,.95)'; rr(0, 0, W, H, 28); g.fill();
      g.strokeStyle = 'rgba(127,214,255,.35)'; g.lineWidth = 2; rr(1, 1, W - 2, H - 2, 28); g.stroke();
      // 상단: 모드 스위치와 위치
      const L = curLevel();
      g.fillStyle = '#7fd6ff'; g.font = '600 22px ' + FONT; g.fillText('케이프혼타워', 28, 50);
      g.fillStyle = '#f2f0ea'; g.font = '700 26px ' + FONT; g.fillText(S.mode === 'fig' ? '모형 1:' + Math.round(1 / S.fig.scale) : (L ? (L.name || L.key) : '건물 밖'), 190, 50);
      const modes = [['vr', '몰입'], ['fig', S.ar ? '피규어' : '모형'], ['web', '웹 화면으로']];
      let mx = W - 24 - 3 * 150 - 2 * 8 - 72;
      modes.forEach(([m, t]) => { cells.push({ key: 'mode:' + m, x: mx, y: 18, w: 150, h: 52, label: t, mode: m, on: () => S.mode === m, act: () => (m === 'web' ? exitToWeb() : X.setMode(m)) }); mx += 158; });
      cells.push({ key: 'close', x: W - 24 - 64, y: 18, w: 64, h: 52, label: '✕', act: () => closeMenu() });
      // 탭
      const tw = (W - 48 - 8 * (T0.length - 1)) / T0.length;
      T0.forEach((t, i) => cells.push({ key: 'tab:' + i, x: 24 + i * (tw + 8), y: 92, w: tw, h: 56, label: t.t, tab: i, on: () => tab === i, act: () => { tab = i; page = 0; } }));
      // 내용
      const items = pages[page] || [];
      items.forEach(c => { if (c.head) { g.fillStyle = '#7fd6ff'; g.font = '600 20px ' + FONT; g.fillText(c.head, c.x, c.y + 24); } else cells.push(c); });
      // 아래: 쪽 넘기기와 안내
      if (pages.length > 1) {
        cells.push({ key: 'pg:-', x: 24, y: H - 64, w: 120, h: 48, label: '◀ 이전', act: () => { page = Math.max(0, page - 1); } });
        cells.push({ key: 'pg:+', x: 152, y: H - 64, w: 120, h: 48, label: '다음 ▶', act: () => { page = Math.min(pages.length - 1, page + 1); } });
        g.fillStyle = '#9a978f'; g.font = '400 20px ' + FONT; g.fillText((page + 1) + ' / ' + pages.length, 290, H - 32);
      }
      g.fillStyle = '#8a877f'; g.font = '400 18px ' + FONT; g.textAlign = 'right';
      g.fillText(S.input === 'hand' ? '검지로 누르기 · 멀면 핀치' : '트리거로 선택 · 왼쪽 스틱 누르기로 닫기 · 오른쪽 스틱 위아래로 넘기기', W - 28, H - 32); g.textAlign = 'left';
      // 셀 그리기
      for (const c of cells) {
        const hov = hover === c.key, on = c.on ? c.on() : false, off = c.off ? c.off() : false;
        if (c.color) {
          g.fillStyle = c.color; rr(c.x, c.y, c.w, c.h, 12); g.fill();
          if (on || hov) { g.strokeStyle = on ? '#7fd6ff' : '#fff'; g.lineWidth = 4; rr(c.x + 2, c.y + 2, c.w - 4, c.h - 4, 12); g.stroke(); }
          continue;
        }
        g.fillStyle = on ? '#1f5c55' : hov && !off ? 'rgba(127,214,255,.25)' : 'rgba(255,255,255,.07)'; rr(c.x, c.y, c.w, c.h, 12); g.fill();
        if (on) { g.strokeStyle = '#7fd6ff'; g.lineWidth = 3; rr(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3, 12); g.stroke(); }
        const pre = c.check ? (on ? '☑ ' : '☐ ') : '';
        g.fillStyle = off ? '#5d5b56' : on ? '#fff' : '#e8e5dd';
        const center = c.tab != null || c.mode || c.key === 'close' || /^pg:/.test(c.key);
        if (center) { g.textAlign = 'center'; g.fillText(fit(pre + c.label, c.w - 16, 24, 600), c.x + c.w / 2, c.y + c.h / 2 + 8); g.textAlign = 'left'; }
        else if (c.sub) { g.fillText(fit(pre + c.label, c.w - 22, 22, 600), c.x + 12, c.y + 27); g.fillStyle = '#9a978f'; g.fillText(fit(c.sub, c.w - 22, 16, 400), c.x + 12, c.y + 50); }
        else g.fillText(fit(pre + c.label, c.w - 22, 22, 600), c.x + 12, c.y + c.h / 2 + 8);
      }
      if (toastMsg && performance.now() < toastT) { g.fillStyle = 'rgba(31,92,85,.95)'; rr(W / 2 - 220, H / 2 - 40, 440, 80, 16); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(fit(toastMsg, 400, 26, 600), W / 2, H / 2 + 9); g.textAlign = 'left'; }
      tex.needsUpdate = true; lastDraw = performance.now(); dirtyFlag = false;
    }
    /* ----- 빠른 막대: 층 표시 + 4 버튼 ----- */
    function drawQuick() {
      const q = qg, L = curLevel(); qcells = [];
      q.clearRect(0, 0, 512, 220);
      q.fillStyle = 'rgba(14,18,20,.92)'; q.beginPath(); q.roundRect ? q.roundRect(4, 4, 504, 212, 24) : q.rect(4, 4, 504, 212); q.fill();
      q.fillStyle = '#7fd6ff'; q.font = '600 22px ' + FONT; q.fillText(S.mode === 'fig' ? '모형 보기' : '케이프혼타워', 24, 40);
      q.fillStyle = '#f2f0ea'; q.font = '700 40px ' + FONT; q.fillText(S.mode === 'fig' ? '1:' + Math.round(1 / S.fig.scale) : (L ? (L.name || L.key) : '건물 밖'), 24, 88);
      const btns = S.mode === 'fig'
        ? [['q:in', '몰입', () => X.setMode('vr')], ['q:s+', '크게', () => { S.fig.scale = clampScale(S.fig.scale * 1.25); }], ['q:s-', '작게', () => { S.fig.scale = clampScale(S.fig.scale / 1.25); }], ['q:menu', '메뉴', () => toggleMenu()]]
        : [['q:up', '▲ 위층', () => stepFloor(1)], ['q:dn', '▼ 아래층', () => stepFloor(-1)], ['q:io', K.I && K.I.on ? '밖으로' : '안으로', () => (K.I && K.I.on ? goOutside() : goInside())], ['q:menu', '메뉴', () => toggleMenu()]];
      btns.forEach(([k, t, a], i) => {
        const c = { key: k, x: 16 + i * 122, y: 112, w: 114, h: 92, label: t, act: a }; qcells.push(c);
        q.fillStyle = hover === k ? 'rgba(127,214,255,.3)' : 'rgba(255,255,255,.1)'; q.beginPath(); q.roundRect ? q.roundRect(c.x, c.y, c.w, c.h, 14) : q.rect(c.x, c.y, c.w, c.h); q.fill();
        q.fillStyle = '#fff'; q.font = '600 24px ' + FONT; q.textAlign = 'center'; q.fillText(t, c.x + c.w / 2, c.y + 56); q.textAlign = 'left';
      });
      if (S.input !== 'hand') { q.fillStyle = '#9a978f'; q.font = '400 17px ' + FONT; q.fillText(S.mode === 'fig' ? '그립 잡기 · 두 손 크기' : 'A/X 위 · B/Y 아래 · 그립 밖', 250, 40); }
      qtex.needsUpdate = true;
    }
    /* ----- 열기/닫기와 배치(입력 방식별 거리) ----- */
    function openMenu() {
      open = true;
      const hand = S.input === 'hand', D = hand ? 0.45 : 1.0, s = D / 1.0;
      const h = xrCam.position.clone(), d = new T.Vector3(0, 0, -1).applyQuaternion(xrCam.quaternion); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize();
      if (!panel.parent) rig.add(panel);
      panel.position.copy(h).addScaledVector(d, D); panel.position.y = h.y - (hand ? 0.22 : 0.12);
      panel.quaternion.copy(new T.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.atan2(h.x - panel.position.x, h.z - panel.position.z)));
      panel.scale.setScalar(s); panel.visible = true;
      draw(); click();
    }
    function closeMenu() { open = false; panel.visible = false; hover = ''; }
    function toggleMenu() { open ? closeMenu() : openMenu(); }
    /* ----- 히트 판정 ----- */
    function cellAt(list, uv, w, h) { const x = uv.x * w, y = (1 - uv.y) * h; return list.find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) || null; }
    function raycast(ray) {
      let best = null;
      if (open && panel.visible) { const h = ray.intersectObject(panel, false)[0]; if (h) { const c = cellAt(cells, h.uv, W, H); best = { key: c ? c.key : 'panel', cell: c, distance: h.distance, where: 'menu' }; } }
      if (!best && quick.visible) { const h = ray.intersectObject(quick, false)[0]; if (h) { const c = cellAt(qcells, h.uv, 512, 220); best = { key: c ? c.key : 'quick', cell: c, distance: h.distance, where: 'quick' }; } }
      return best;
    }
    function activate(hit) {
      const c = hit.cell; if (!c || !c.act || (c.off && c.off())) return;
      click(); haptic();
      try { c.act(); } catch (e) { log('메뉴 실행 오류', e.message); }
      if (Opt) Opt.dirty();
      dirtyFlag = true; soon = performance.now() + 120;
      setTimeout(() => { dirtyFlag = true; R.shadowMap.needsUpdate = true; }, 500);
    }
    /* ----- 핸드: 검지 직접 누르기, 손바닥 보기로 빠른 막대 ----- */
    let pokeLock = 0;
    function handPoke(time) {
      for (const c of ctrls) {
        const H0 = c.userData.handObj; if (!c.userData.isHand || !H0 || !H0.joints) continue;
        const tip = H0.joints['index-finger-tip']; if (!tip || !tip.visible) continue;
        const wp = tip.getWorldPosition(V(0, 0, 0));
        for (const [mesh, list, w, h] of [[panel, cells, W, H], [quick, qcells, 512, 220]]) {
          if (!mesh.visible || (mesh === panel && !open)) continue;
          const lp = mesh.worldToLocal(wp.clone()); const sx = mesh.geometry.parameters.width, sy = mesh.geometry.parameters.height;
          if (Math.abs(lp.x) > sx / 2 || Math.abs(lp.y) > sy / 2) continue;
          const depth = lp.z * mesh.getWorldScale(V()).z;
          const uv = { x: lp.x / sx + 0.5, y: lp.y / sy + 0.5 };
          const cell = cellAt(list, uv, w, h);
          if (cell && Math.abs(depth) < 0.05) { if (hover !== cell.key) { hover = cell.key; dirtyFlag = true; } }
          if (cell && depth < 0.012 && depth > -0.03 && time > pokeLock) { pokeLock = time + 400; activate({ cell }); }
        }
      }
    }
    function palmQuick() {
      // 손: 왼손바닥이 얼굴 쪽을 보면 손목 위에 빠른 막대. 컨트롤러: 왼손 컨트롤러 위에 항상
      const left = ctrls.find(c => c.userData.hand === 'left' && c.userData.src);
      if (!left) { quick.visible = false; return; }
      if (left.userData.isHand) {
        const J = left.userData.handObj.joints || {};
        const w = J['wrist'], im = J['index-finger-metacarpal'], pm = J['pinky-finger-metacarpal'];
        if (!w || !im || !pm || !w.visible) { quick.visible = false; return; }
        const pw = w.position, a = im.position.clone().sub(pw), b = pm.position.clone().sub(pw);
        const n = a.clone().cross(b).normalize();   // 왼손 손바닥 법선(손바닥 쪽)
        const toHead = xrCam.position.clone().sub(pw).normalize();
        const facing = n.dot(toHead) > 0.55;
        if (facing) {
          if (quick.parent !== rig) rig.add(quick);
          quick.position.copy(pw).add(V(0, 0.09, 0)); quick.lookAt(rig.localToWorld(xrCam.position.clone()));
          quick.scale.setScalar(1.4); quick.visible = true;
        } else quick.visible = false;
      } else {
        const gp = left.userData.grip;
        if (quick.parent !== gp) { gp.add(quick); quick.position.set(0, 0.07, -0.04); quick.rotation.set(-0.7, 0, 0); quick.scale.setScalar(1); }
        quick.visible = true;
      }
    }
    /* ----- 소리와 진동 ----- */
    let ac = null;
    function click() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.frequency.value = 1400; v.gain.value = 0.05; o.connect(v); v.connect(ac.destination); o.start(); v.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05); o.stop(ac.currentTime + 0.06); } catch (e) {} }
    function haptic() { try { for (const s of S.session.inputSources) { const h = s.gamepad && s.gamepad.hapticActuators && s.gamepad.hapticActuators[0]; if (h && h.pulse) h.pulse(0.25, 25); } } catch (e) {} }
    /* ----- 조합 넘기기 ----- */
    function cycle(dir) {
      const tgt = cycleTarget || { name: 'dsg', mode: 'preset' };
      const list = radios(tgt.name, tgt.mode).filter(i => !(i.off && i.off()));
      if (!list.length) return;
      let k = list.findIndex(i => i.on()); k = (k + dir + list.length) % list.length;
      list[k].act(); click(); toast(list[k].label); Opt.dirty();
    }
    function toast(m) { toastMsg = m; toastT = performance.now() + 1600; if (!open) { quickToast = m; quickToastT = toastT; } dirtyFlag = true; log('알림', m); }
    let quickToast = '', quickToastT = 0;
    function detectInput() {
      if (!S.session) return;
      const hands = [...S.session.inputSources].some(s => s.hand);
      const was = S.input; S.input = hands ? 'hand' : 'controller';
      if (was !== S.input) { log('입력', S.input); if (open) openMenu(); }
    }
    /* ----- 프레임 ----- */
    function update(time) {
      palmQuick();
      if (S.input === 'hand') handPoke(time);
      const hk = ctrls.map(c => c.userData.uiHit && c.userData.uiHit.key).filter(Boolean)[0] || (S.input === 'hand' ? hover : '');
      if (hk !== hover && S.input !== 'hand') { hover = hk || ''; dirtyFlag = true; }
      if (open && (dirtyFlag || time - lastDraw > 1000 || (soon && performance.now() > soon))) { soon = 0; draw(); }
      if (quick.visible && (dirtyFlag || time % 500 < 20)) drawQuick();
      if (dirtyFlag && !open) drawQuick();
    }
    function onSessionStart() { detectInput(); drawQuick(); Help.maybe(); }
    function onSessionEnd() { closeMenu(); quick.visible = false; if (panel.parent) panel.parent.remove(panel); Help.hide(); }
    return { init, raycast, activate, update, toggleMenu, openMenu, closeMenu, menuOpen: () => open, cycle, toast, detectInput, onSessionStart, onSessionEnd,
      dirty: () => { dirtyFlag = true; }, dirtySoon: () => { soon = performance.now() + 150; }, cells: () => cells, qcells: () => qcells, setTab: i => { tab = i; page = 0; dirtyFlag = true; }, tabs: () => tabs().map(t => t.t + ':' + t.sec.reduce((n, s) => n + s.items.length, 0)) };
  })();

  /* ================= 13. 첫 안내 ================= */
  const Help = {
    mesh: null,
    maybe() { if (!store.get('helpSeen', false)) this.show(false); },
    show(force) {
      const hand = S.input === 'hand';
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 560; const g = cv.getContext('2d');
      g.fillStyle = 'rgba(14,18,20,.95)'; g.fillRect(0, 0, 1024, 560);
      g.fillStyle = '#7fd6ff'; g.font = '600 30px ' + FONT; g.fillText('케이프혼타워 VR 조작 안내 (' + (hand ? '손' : '컨트롤러') + ')', 40, 70);
      const lines = hand
        ? ['순간이동: 손바닥을 아래로, 핀치한 채 바닥을 가리키고 놓기', '빠른 막대: 왼손바닥을 얼굴 쪽으로 돌리기 (층 이동, 밖으로, 메뉴)', '메뉴: 가까이 뜨면 검지로 직접 누르기', '왼손 손바닥 핀치는 VR을 끝내니 쓰지 마세요']
        : ['순간이동: 트리거를 누른 채 바닥을 가리키고 놓기', '층 이동: A/X 위층, B/Y 아래층 · 그립: 건물 밖으로', '메뉴: 왼쪽 스틱 누르기 · 오른쪽 스틱 위아래: 시안 넘기기', '걷기: 왼쪽 스틱 · 돌기: 오른쪽 스틱 좌우'];
      g.fillStyle = '#f2f0ea'; g.font = '400 30px ' + FONT; lines.forEach((l, i) => g.fillText(l, 40, 150 + i * 80));
      g.fillStyle = '#9a978f'; g.font = '400 24px ' + FONT; g.fillText('8초 뒤 자동으로 닫힙니다', 40, 520);
      const tex = new T.CanvasTexture(cv);
      this.hide();
      this.mesh = new T.Mesh(new T.PlaneGeometry(1.0, 0.55), new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false }));
      this.mesh.renderOrder = 1002; this.mesh.userData.khxr = true;
      const h = xrCam.position.clone(), d = V(0, 0, -1).applyQuaternion(xrCam.quaternion); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize();
      rig.add(this.mesh); this.mesh.position.copy(h.lengthSq() ? h : V(0, 1.6, 0)).addScaledVector(d, 1.3); this.mesh.position.y = (h.y || 1.6) - 0.05;
      this.mesh.rotation.y = Math.atan2(-d.x, -d.z);
      store.set('helpSeen', true);
      clearTimeout(this.t); this.t = setTimeout(() => this.hide(), 8000);
    },
    hide() { if (this.mesh) { if (this.mesh.parent) this.mesh.parent.remove(this.mesh); this.mesh.material.map.dispose(); this.mesh = null; } }
  };

  boot();
})();
