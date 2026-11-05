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
  const VER = '1102.v';
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
    fig: { pos: null, yaw: 0, scale: 1 / 150, crop: 45 }, center: null, walkSpeed: +store.get('walkSpeed', 2.6),
    turn: store.get('turn', 'snap'), vignette: store.get('vignette', true), moving: 0, showMass: store.get('showMass', false), opt: !Q.get('noopt'),
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
    Load.init();
    {   // 이동 중 시야 가장자리 어둡게: 가운데가 뚫린 원판
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
      const gr = c.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
      X.vig = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
      X.vig.position.z = -0.12; X.vig.renderOrder = 9999; X.vig.visible = false; xrCam.add(X.vig);
    }
    X.rig = rig; X.xrCam = xrCam;
    initControllers();
    UI.init();
    addButtons();
    patchCull();
    log('준비 완료', VER, K.full ? '연결 통로 사용' : '최소 기능');
  }

  /* ================= 2. 진입 버튼(화면) ================= */
  async function addButtons() {
    const xrOk = window.isSecureContext && navigator.xr;
    const [vr, ar] = xrOk ? await Promise.all(['immersive-vr', 'immersive-ar'].map(m => navigator.xr.isSessionSupported(m).catch(() => false))) : [false, false];
    X.support = { vr, ar };
    if (!xrOk) log('WebXR 없음: 화면 모드만');
    const st = document.createElement('style');
    st.textContent = '#khxr-bar{position:fixed;left:14px;bottom:44px;z-index:9999;display:flex;gap:8px;flex-wrap:wrap}#khxr-bar button{display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:8px;border:1px solid rgba(0,0,0,.08);background:#1f5c55;color:#fff;font:600 14px ' + FONT + ';cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.18)}#khxr-bar button.alt{background:#fff;color:#1f5c55}#khxr-bar small{opacity:.6;font-weight:400;font-size:11px}#khxr-bar button:focus-visible{outline:3px solid #7fd6ff}';
    document.head.appendChild(st);
    const bar = document.createElement('div'); bar.id = 'khxr-bar';
    const mk = (t, m, cls) => { const b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; b.innerHTML = t; b.onclick = () => enter(m).catch(e => { log('진입 실패', e.message); alert('XR을 시작하지 못했습니다: ' + e.message); }); bar.appendChild(b); };
    if (vr || ar) { mk('VR로 들어가기 <small>' + VER + '</small>', 'vr'); mk(ar ? '내 공간에 놓기' : '모형으로 보기', 'fig', 'alt'); }
    // 멀티플레이: 몰입 VR·AR 이 되는 기기(퀘스트 브라우저는 2D 창에서도 immersive-vr 지원으로 보인다)에서만 보인다.
    // 일반 PC·휴대폰 브라우저는 숨긴다. ?mp=1 이면 강제로 보이고(자동 시험·개발 확인), ?mp=0 이면 숨긴다
    const mpShow = Q.get('mp') === '1' || (Q.get('mp') !== '0' && (vr || ar));
    X.support.mp = mpShow;
    if (K.full && mpShow) {   // 누를 때만 모듈·통신 라이브러리를 받는다(평소 로딩·성능 영향 없음)
      const b = document.createElement('button'); b.type = 'button'; b.className = 'alt'; b.id = 'khxr-mp';
      b.innerHTML = Q.get('room') ? '멀티플레이 참가 <small>방 ' + Q.get('room').slice(0, 8) + '</small>' : '멀티플레이';
      b.onclick = async () => { try { if (!window.KHMP) await loadScript(BASE + 'kh-mp.js?v=' + VER); window.KHMP.open(); } catch (e) { alert('멀티플레이를 불러오지 못했습니다: ' + (e.message || e)); } };
      bar.appendChild(b);
    }
    if (!bar.children.length) return;
    document.body.appendChild(bar);
    // 실사 3D 패널(왼쪽 아래)이 떠 있으면 버튼 줄을 그 위로 올린다. 멀티플레이 카드도 --khxr-bb 로 따라 올라간다
    const lift = () => {
      const p = document.querySelector('.pr-panel'); let bb = 44;
      if (p && p.offsetParent !== null) { const r = p.getBoundingClientRect(); if (r.height && r.left < 400) bb = Math.max(44, Math.round(innerHeight - r.top + 8)); }
      if (bar.style.bottom !== bb + 'px') { bar.style.bottom = bb + 'px'; document.documentElement.style.setProperty('--khxr-bb', bb + 'px'); }
    };
    lift(); setInterval(lift, 700); addEventListener('resize', lift);
    log('XR 버튼 표시', JSON.stringify(X.support));
  }

  /* ================= 3. 세션 ================= */
  async function enter(mode) {
    if (S.session || S.entering) return;
    S.entering = true;
    try { if (window.KHPRLayer && KHPRLayer.preVR) KHPRLayer.preVR(); } catch (e) {}   // 1102.v: 세션이 열리기 전에 실사 하늘·환경광을 만든다
    try {
      // 1102.s(Jack 퀘스트): 패스스루는 피규어 모드에서만. 1:1 VR 은 패스스루 없는 immersive-vr(머리를 돌릴 때 그리지 못한 가장자리에 현실이 비치고, 패스스루 합성 비용도 든다)
      const wantAR = mode === 'fig' && X.support.ar && Q.get('xrsession') !== 'vr';
      const sm = wantAR ? 'immersive-ar' : 'immersive-vr';
      const opt = ['hand-tracking', 'bounded-floor', 'anchors', 'hit-test'];
      if (wantAR && mode === 'fig') opt.push('plane-detection');   // 공간 정보 동의창은 피규어로 시작할 때만
      const session = await navigator.xr.requestSession(sm, { requiredFeatures: ['local-floor'], optionalFeatures: opt });
      R.xr.setFramebufferScaleFactor(store.get('fbScale', 1));
      await R.xr.setSession(session);
      S.session = session; S.sessionMode = sm; S.ar = sm === 'immersive-ar';
      try { const L = session.renderState.baseLayer; if (L && 'fixedFoveation' in L) L.fixedFoveation = store.get('foveation', 0.5); } catch (e) {}
      // 목표 프레임(T5): 퀘스트는 72·90·120Hz 를 고를 수 있다. 품질 기준인 72Hz 로 명시
      try { const fr = session.supportedFrameRates; if (session.updateTargetFrameRate && (!fr || Array.from(fr).includes(XQC.fps))) session.updateTargetFrameRate(XQC.fps).catch(() => {}); } catch (e) {}
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
    // 1102.s: 실사 3D 를 끈 VR(스케치업·렌더(이전))도 지니 주변을 VR 단순화(lite)로. 실사 3D 를 켜면 실사 계층이 lite 를 맡는다
    if (window.KHENV && KHENV.lite && !(window.KHPRLayer && KHPRLayer.on)) { KHENV.lite(true); S.liteByXr = true; }
    OnTop.apply(0, true);
    if (S.opt) Opt.build(); else Opt.clear();   // 화면 합치기(실사 3D)가 켜져 있었으면 걷는다
    XQ.reset();
    R.setAnimationLoop(frame);
    UI.onSessionStart();
  }
  function onEnd() {
    R.setAnimationLoop(null); R.info.autoReset = true; clipMaterials(false); OnTop.clear(); Load.hide();
    if (S.liteByXr) { S.liteByXr = false; if (window.KHENV && KHENV.lite && !(window.KHPRLayer && KHPRLayer.on)) KHENV.lite(false); }
    const leaving = S.mode;
    transferToDesktop(leaving);
    setVisualsFor(null);
    Opt.clear();
    if (window.KHPRLayer && KHPRLayer.xrQuality) KHPRLayer.xrQuality(0);
    UI.onSessionEnd();
    ctrls.forEach(c => { const cu = c.userData.cursor; if (cu) { cu.visible = false; scene.remove(cu); } });
    scene.remove(rig);
    R.shadowMap.autoUpdate = S.saved.shAuto; R.shadowMap.needsUpdate = true;
    R.setClearAlpha(1);
    S.session = null; S.mode = null; Fig.placed = false; Fig.anchor = null; if (Fig.base) Fig.base.visible = false;
    if (K.resize) K.resize();
    log('세션 종료 → 웹 화면');
    if (S.swapTo) { const m = S.swapTo; S.swapTo = null; enter(m).catch(e => { log('세션 바꾸기 실패', String(e)); swapNote(m); }); }
  }
  function swapNote(m) { let e = document.getElementById('khxr-swap-note'); if (!e) { e = document.createElement('div'); e.id = 'khxr-swap-note'; e.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:60;padding:14px 18px;border-radius:8px;background:rgba(20,22,24,.94);color:#fff;font:15px/1.5 system-ui,sans-serif;text-align:center'; document.body.appendChild(e); }
    e.textContent = (m === 'fig' ? '피규어(패스스루)' : 'VR') + ' 로 바꾸려면 아래 버튼을 한 번 더 눌러 주세요'; e.onclick = () => e.remove(); setTimeout(() => e.remove(), 8000); }
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
  function outsideFacing(T0, C) {   // C 방향을 먼저 시도하고, 건물이 가려지면 다른 방향의 땅에서 건물을 바라봄
    let dx = C.x - T0.x, dz = C.z - T0.z, d = Math.hypot(dx, dz); if (d < 1) { dx = -1; dz = 0; d = 1; }
    const sp = outsideSpot([[dx / d, dz / d]]); placeUser(sp.p, yawOf(sp.p, sp.c));
  }
  // 밖으로 나갈 자리: 압구정로 정면 → 코너 → 6M도로 측면 → 나머지 방향 순으로, 땅 위이고 건물까지 시야가 트인 첫 자리
  const FRONT_DIRS = [[-1, 0], [-0.72, 0.69], [0.31, 0.95], [-0.71, -0.71], [0, 1], [0.71, 0.71], [1, 0], [0.71, -0.71], [0, -1]];
  function outsideSpot(prefer) {
    const box = K.bld ? new T.Box3().setFromObject(K.bld) : null;
    const ok = box && !box.isEmpty() && box.max.x - box.min.x < 200;
    const c = ok ? box.getCenter(V()).setY(0) : (S.center || buildingCenter()).clone();
    const half = ok ? Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 : 15, top = ok ? Math.max(box.max.y, 10) : 30;
    const near = ok ? box.clone().expandByScalar(1.5) : null, objs = pickables(), r = new T.Raycaster();
    const first = (o, dir, far) => { r.set(o, dir); r.far = far; return r.intersectObjects(objs, true).find(h => visibleForPick(h.object) && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.2)); };
    const groundAt = (x, z) => { const h = first(V(x, top + 60, z), V(0, -1, 0), top + 80); return h ? h.point.y : 0; };
    const dirs = (prefer || []).concat(FRONT_DIRS);
    for (const dist of [half + 34, half + 26, half + 18]) for (const [ux, uz] of dirs) {
      const x = c.x + ux * dist, z = c.z + uz * dist, gy = groundAt(x, z);
      if (Math.abs(gy) > 1.2 || (near && near.containsPoint(V(x, gy, z)))) continue;     // 다른 건물 지붕·우리 건물 안은 제외
      const eye = V(x, gy + 1.6, z);
      const clear = [3, top * 0.45, top * 0.8].every(y => { const t = V(c.x, y, c.z), v = t.clone().sub(eye), L = v.length(); const h = first(eye, v.normalize(), L); return !h || (near && near.containsPoint(h.point)); });
      if (clear) return { p: V(x, gy, z), c };
    }
    const [ux, uz] = dirs[0]; return { p: V(c.x + ux * (half + 26), 0, c.z + uz * (half + 26)), c };
  }
  function sortedLevels() { return (K.LEVELS || []).map((L, i) => ({ i, y: floorY(L), L })).sort((a, b) => a.y - b.y); }
  function goLevel(li) {
    if (!K.full) return;
    jump(() => {
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
    jump(() => {
      if (K.I.on) K.exitInt();
      wingTarget();
      const sp = outsideSpot(); placeUser(sp.p, yawOf(sp.p, sp.c));     // 늘 건물 정면이 잘 보이는 자리로
      afterChange();
    });
  }
  function goInside() { const L = sortedLevels(); const g = L.findIndex(s => s.L.key === '1F'); if (L.length) goLevel(L[g >= 0 ? g : 0].i); }
  function goView(btn) {     // 시점 프리셋: 원본 버튼을 누르고 그 시점 자리로 사용자를 옮김
    jump(() => {
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
  function teleportTo(pt, yaw = rig.rotation.y) {
    const rp = rampAt(pt);
    if (rp) { placeUser(V(pt.x, stepY(rp), pt.z), yaw); followLevel(rig.position.y); return; }
    const L = enterLevelAt(pt);
    if (L) { K.enterInt(); if (K.I.doll) K.setDoll(false); K.placeLevel(K.LEVELS.indexOf(L), true); wingTarget(); placeUser(V(pt.x, floorY(L), pt.z), yaw); afterChange(); return; }
    placeUser(pt, yaw);
  }
  function snapTurn(a) {
    const h = rigHeadWorld();
    rig.position.sub(h).applyAxisAngle(V(0, 1, 0), a).add(h); rig.rotation.y += a;
  }
  function walk(ax, ay, dt) {
    const d = new T.Vector3(); xrCam.getWorldDirection(d); d.y = 0; if (d.lengthSq() < 1e-6) return; d.normalize();
    const side = V(-d.z, 0, d.x), sp = S.walkSpeed * dt;
    const mv = d.multiplyScalar(-ay * sp).add(side.multiplyScalar(ax * sp));
    const h = rigHeadWorld(), foot = rig.position.y;
    if (K.full && K.rampHit && K.toPx) {   // 원본 데스크톱 걷기 규칙: 벽·램프 난간 막기, 계단·램프는 높이를 따라감
      const under = r => (r && r.y - foot > 0.6 ? null : r);
      const ok = (nx, nz) => {
        const L = curLevel(), a = K.toPx(h.x, h.z), b = K.toPx(nx, nz), r = under(K.rampHit(b, foot));
        if ((L && Math.abs(foot - floorY(L)) < 1.2 && (L.walls || []).some(w => K.xSeg(a, b, w))) || K.rampWallX(a, b, foot)) return false;
        if (r) return Math.abs(r.y - foot) < 0.6;
        if (!L) return true;
        if (Math.abs(floorY(L) - foot) >= 0.6) return false;
        return K.walkable(nx, nz, L);
      };
      if (!ok(h.x + mv.x, h.z + mv.z)) { if (ok(h.x + mv.x, h.z)) mv.z = 0; else if (ok(h.x, h.z + mv.z)) mv.x = 0; else return; }
      rig.position.add(mv);
      const p = rigHeadWorld(), r = under(K.rampHit(K.toPx(p.x, p.z), foot));
      if (r) { rig.position.y = stepY(r); followLevel(rig.position.y); }
      else if (curLevel()) rig.position.y = floorY(curLevel());
    } else {
      const L = curLevel();
      if (L && K.walkable) { const okX = K.walkable(h.x + mv.x, h.z, L), okZ = K.walkable(h.x, h.z + mv.z, L); if (!okX) mv.x = 0; if (!okZ) mv.z = 0; }
      rig.position.add(mv);
    }
    S.moving = 1;
  }
  // 계단(원본 STW)은 단 높이(약 17cm)씩 끊어서, 램프는 경사 그대로
  function stepY(r) {
    const E = r.r.E, k = r.k, dE = E[k + 1] - E[k];
    if (!(K.STW || []).includes(r.r) || Math.abs(dE) < 0.3) return r.y;
    const n = Math.max(1, Math.round(Math.abs(dE) / 0.17)), t = Math.max(0, Math.min(1, (r.y + 0.03 - E[k]) / dE));
    return E[k] + dE * Math.round(t * n) / n;
  }
  // 발 높이가 어느 층 바닥에 닿으면 그 층으로(밖에서 램프로 내려가면 실내 보기로)
  function followLevel(y) {
    const li = K.levelAtFoot ? K.levelAtFoot(y) : -1;
    if (!K.I.on) { if (y < -0.5 || li >= 0 && y > 0.5) { K.enterInt(); if (K.I.doll) K.setDoll(false); K.placeLevel(li >= 0 ? li : K.levelAtFoot(-3.9), true); wingTarget(); afterChange(); } return; }
    if (li >= 0 && li !== K.I.li) { K.quietLevel(li); afterChange(); }
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
      if (!Fig.placed) { Fig.placed = true; setTimeout(async () => { if (!(await Fig.restore())) Fig.place(); }, 1500); }
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
    Room.show(m === 'fig' && !S.ar);
    if (m === 'fig') {
      if (!bgSaved) bgSaved = { bg: scene.background, fog: scene.fog };
      if (!hiddenBg.length) hideBig();
    } else if (bgSaved) {
      Fig.untrim(); Fig.trimSig = '';
      hiddenBg.forEach(o => { o.visible = o.userData.khxrVis; }); hiddenBg.length = 0;
      scene.background = bgSaved.bg; scene.fog = bgSaved.fog; bgSaved = null;
    }
  }
  // 패스스루가 없을 때(비전 프로 WebXR, 퀘스트 xrsession=vr) 모형을 올려 둘 가상 방. rig 의 자식이라 실제 방 크기로 보인다
  const Room = X.room = {
    g: null, scene: null, root: null,
    build() {
      // 모형 자르기(clippingPlanes)에 잘리지 않게 별도 장면에 두고 먼저 그린다. root 는 매 프레임 rig 변환을 따른다
      this.scene = new T.Scene(); this.root = new T.Group(); this.root.matrixAutoUpdate = false; this.scene.add(this.root);
      const g = this.g = new T.Group(); g.userData.khxr = true; g.name = 'khxr-room';
      const cv = document.createElement('canvas'); cv.width = 2; cv.height = 256; const c = cv.getContext('2d');
      const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#dfe5e8'); gr.addColorStop(0.55, '#c7ced2'); gr.addColorStop(1, '#8d969b'); c.fillStyle = gr; c.fillRect(0, 0, 2, 256);
      const sky = new T.Mesh(new T.SphereGeometry(30, 32, 16), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), side: T.BackSide, depthWrite: false }));
      sky.renderOrder = -10;
      const floor = new T.Mesh(new T.CircleGeometry(6, 48).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x9aa3a8 }));
      const grid = new T.GridHelper(12, 24, 0x7f888d, 0x8a9398); grid.position.y = 0.002;
      const top = new T.Mesh(new T.BoxGeometry(1.2, 0.04, 0.8), new T.MeshBasicMaterial({ color: 0x6b5a48 }));
      const leg = new T.Mesh(new T.BoxGeometry(1.1, 1, 0.7), new T.MeshBasicMaterial({ color: 0x4a3f35 }));
      g.add(sky, floor, grid, top, leg); this.top = top; this.leg = leg;
    },
    show(on) {
      if (on && !this.g) this.build();
      if (!this.g) return;
      if (this.g.parent !== this.root) this.root.add(this.g);
      this.g.visible = on;
    },
    update() {   // 탁자는 모형 아래에
      if (!this.g || !this.g.visible || !S.fig.pos) return;
      this.root.matrix.copy(rig.matrixWorld); this.root.matrixWorldNeedsUpdate = true;
      const p = S.fig.pos; this.top.position.set(p.x, p.y - 0.035, p.z); this.leg.scale.y = Math.max(0.05, p.y - 0.06); this.leg.position.set(p.x, (p.y - 0.06) / 2, p.z);
    }
  };
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
  // 모형 자르기 평면. 렌더러 전체 자르기(renderer.clippingPlanes)는 r128 에서 두 눈 사이 가운데 카메라 기준으로 한 번만
  // 변환돼 피규어(사용자 확대)에서 왼눈·오른눈의 잘린 선이 어긋난다. 그래서 재질마다 달아 눈마다 변환되게 한다.
  let figPlanes = null; const clipped = new Set(); let clipT = 0;
  /* 피규어 범위 밖 그리지 않기: 자르기 평면은 범위 밖을 화소에서 지울 뿐 그리기 호출은 그대로 든다(가상 방 피규어 216회).
     범위(정사각형 ±crop) 밖에 통째로 있는 메시를 그 프레임에만 숨긴다. 후보는 범위·중심·합치기 묶음이 바뀌거나 2초마다 다시 고른다 */
  const FigCull = {
    list: [], sig: '', t: 0,
    pick(time) {
      const c = S.center, r = S.fig.crop, sig = c.x.toFixed(1) + ',' + c.z.toFixed(1) + ',' + r + ',' + (Opt.group ? Opt.group.uuid : '') + ',' + scene.children.length;
      if (sig === this.sig && time - this.t < 2000) return; this.sig = sig; this.t = time;
      const m = 2, x0 = c.x - r - m, x1 = c.x + r + m, z0 = c.z - r - m, z1 = c.z + r + m, bb = new T.Box3(), out = [];
      scene.traverse(o => {
        if (o === rig || !(o.isMesh || o.isLine) || o.isInstancedMesh || !o.geometry) return;
        for (let q = o; q; q = q.parent) if (q === rig || q.userData.khxrUI) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        if (bb.isEmpty() || bb.max.x < x0 || bb.min.x > x1 || bb.max.z < z0 || bb.min.z > z1) out.push(o);
      });
      this.list = out;
    },
    hide(time) { this.pick(time); const hid = []; for (const o of this.list) if (o.visible) { o.visible = false; hid.push(o); } return hid; },
  };
  X.figCull = FigCull;
  function cropPlanes() {
    if (!figPlanes) figPlanes = [new T.Plane(V(1, 0, 0), 0), new T.Plane(V(-1, 0, 0), 0), new T.Plane(V(0, 0, 1), 0), new T.Plane(V(0, 0, -1), 0)];
    const c = S.center, r = S.fig.crop;
    figPlanes[0].constant = -(c.x - r); figPlanes[1].constant = c.x + r; figPlanes[2].constant = -(c.z - r); figPlanes[3].constant = c.z + r;
    return figPlanes;
  }
  function clipMaterials(on, time = 0) {
    // 피규어 중에 자르기가 걸린 재질을 복제한 사본(실내 가구 등)은 자르기 평면도 복제되어(three 의 copy) P 와 다른 배열을 갖는다.
    // 표시(khxrClipped)와 원래 값(khxrClip)이 userData 와 함께 복사되므로, 그 값으로 원래 자르기를 되살린다
    const orig = m => { if (!m.userData.khxrClipped) return m.clippingPlanes; const v = m.userData.khxrClip; return Array.isArray(v) ? v.map(p => p && p.isPlane ? p : new T.Plane(new T.Vector3(p.normal.x, p.normal.y, p.normal.z), p.constant)) : null; };
    const back = m => { m.clippingPlanes = orig(m); delete m.userData.khxrClip; delete m.userData.khxrClipped; };
    if (!on) {
      clipped.forEach(m => { m.clippingPlanes = m.userData.khxrClip || null; delete m.userData.khxrClip; delete m.userData.khxrClipped; }); clipped.clear();
      scene.traverse(o => { if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m && m.userData.khxrClipped) back(m); });   // 마지막 훑기 뒤에 생긴 사본
      return;
    }
    if (time && time - clipT < 500) return; clipT = time;     // 새로 생긴 재질(병합 다시 만들기 등)은 0.5초마다 붙임
    const P = cropPlanes();
    (function walk(o) {
      if (o === rig || o.userData.khxr && o !== Opt.group) return;
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) if (m && m.clippingPlanes !== P) { if (!clipped.has(m)) { m.userData.khxrClip = orig(m); m.userData.khxrClipped = true; clipped.add(m); } m.clippingPlanes = P; }
      for (const c of o.children) walk(c);
    })(scene);
  }
  // r128 양안 절두체 합치기 오류 보정(rig 확대 시 가까운 모형이 컬링됨): 컬링 직전 넉넉한 대칭 절두체로
  let uiScene = null;   // 피규어 때 rig(손·메뉴·레이)만 자르기 없이 덧그리는 장면
  function fixArrayCam(c) { if (c && c.isArrayCamera && rig.scale.x !== 1) { const n = 0.01, e = n * Math.tan(Math.PI / 3); c.projectionMatrix.makePerspective(-e, e, e, -e, n, 200); } }
  function patchCull() {
    uiScene = new T.Scene(); uiScene.onBeforeRender = (r, s, c) => fixArrayCam(c);
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
      const line = makeRay(); line.scale.z = 3; line.visible = false; c.add(line);
      c.userData = { i, line, hand: i ? 'right' : 'left', src: null, aim: false, sq: false, hit: null, uiHit: null, isHand: false };
      c.addEventListener('connected', e => { c.userData.src = e.data; c.userData.hand = e.data.handedness; c.userData.isHand = !!e.data.hand; line.visible = e.data.targetRayMode !== 'transient-pointer'; UI.detectInput(); });
      c.addEventListener('disconnected', () => { line.visible = false; c.userData.src = null; });
      c.addEventListener('selectstart', () => onSelectStart(c));
      c.addEventListener('selectend', () => onSelectEnd(c));
      c.addEventListener('squeezestart', () => { if (c.userData.uiHit && c.userData.uiHit.where === 'menu') { UI.dragStart(c); return; } c.userData.sq = true; Grab.update(); });
      c.addEventListener('squeezeend', () => { if (UI.dragging() === c) { UI.dragEnd(); return; } c.userData.sq = false; Grab.update(); if (S.mode === 'fig' && !Grab.g) Fig.saveAnchor(); });
      rig.add(c); ctrls.push(c);
      const h = R.xr.getHand(i); h.userData.khxr = true; rig.add(h); c.userData.handObj = h;
      const grip = R.xr.getControllerGrip(i); rig.add(grip); c.userData.grip = grip;
    }
    // 바닥 표시
    const mk = new T.Mesh(new T.RingGeometry(0.2, 0.28, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.9, depthTest: false }));
    mk.renderOrder = 999; mk.visible = false; mk.userData.khxr = true; X.marker = mk;
  }
  /* 레이(1102.k, Jack 퀘스트 확인: 1px 선은 퀘스트에서 굵기가 안 바뀌어 잘 안 보이고 패널을 뚫고 나가는 느낌):
     흰 심(지름 3mm)과 청록 겉(지름 7mm)의 얇은 원기둥, 끝으로 갈수록 옅어진다. 길이 1(앞쪽 -Z)을 scale.z 로 늘린다. 메뉴를 가리키면 맞은 곳에서 끊고 커서를 둔다.
     색: 메뉴를 가리킬 때 흰 심+청록, 그냥 가리킬 때 옅은 청록, 순간이동 포물선은 노랑(못 가는 곳은 빨강). 메시라 Wing cleanLines 와 상관없다 */
  let rayFade = null;
  function makeRay() {
    if (!rayFade) { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#888'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); rayFade = new T.CanvasTexture(cv); }
    const geo = r => new T.CylinderGeometry(r * 0.6, r, 1, 10, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -0.5);   // 위(먼 끝)가 조금 가늘다
    const mat = (c, o) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, alphaMap: rayFade, depthWrite: false, toneMapped: false });
    const g = new T.Group(); g.name = 'khxr-ray'; g.userData.khxr = true;
    const core = new T.Mesh(geo(0.0015), mat(0xffffff, 0.95)), glow = new T.Mesh(geo(0.0035), mat(0x7fd6ff, 0.5));
    [core, glow].forEach(m => { m.renderOrder = 1001; m.frustumCulled = false; m.userData.khxr = true; g.add(m); });
    g.userData.core = core; g.userData.glow = glow; return g;
  }
  // 'ui': 메뉴를 가리킴, 'aim': 순간이동 조준(포물선이 따로 그려지므로 짧게), 'bad': 갈 수 없는 곳, 그 밖: 그냥 가리킴
  function rayLook(line, kind) {
    const C = line.userData.core.material, G = line.userData.glow.material;
    if (kind === 'ui') { C.color.setHex(0xffffff); C.opacity = 1; G.color.setHex(0x3fe0ff); G.opacity = 0.75; }
    else if (kind === 'bad') { C.color.setHex(0xffd0c8); C.opacity = 0.9; G.color.setHex(0xff7a6b); G.opacity = 0.6; }
    else if (kind === 'aim') { C.color.setHex(0xfff2c0); C.opacity = 0.9; G.color.setHex(0xffc23d); G.opacity = 0.6; }
    else { C.color.setHex(0xe8fbff); C.opacity = 0.85; G.color.setHex(0x7fd6ff); G.opacity = 0.45; }
  }
  // 메뉴·버튼을 가리킬 때 맞은 곳의 커서: 밝은 점 + 테두리 원, 늘 위에 그림(깊이 검사 끔), 레이 쪽을 향하고 패널보다 5mm 앞
  function makeCursor() {
    const g = new T.Group(); g.name = 'khxr-cursor'; g.userData.khxr = true; g.visible = false;
    const m = (c, o) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false, toneMapped: false, side: T.DoubleSide });
    const dot = new T.Mesh(new T.CircleGeometry(0.006, 20), m(0xffffff, 1)), ring = new T.Mesh(new T.RingGeometry(0.010, 0.0135, 32), m(0x3fe0ff, 0.95)), edge = new T.Mesh(new T.RingGeometry(0.0135, 0.0155, 32), m(0x0b2a33, 0.8));
    [edge, ring, dot].forEach((o, i) => { o.renderOrder = 1002 + i; o.frustumCulled = false; o.userData.khxr = true; g.add(o); });
    return g;
  }
  function aim(c) {
    const m = new T.Matrix4().extractRotation(c.matrixWorld);
    X.ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
    X.ray.ray.direction.set(0, 0, -1).applyMatrix4(m).normalize();
    X.ray.near = 0; X.ray.far = Infinity;   // 포물선·피규어 판정이 줄여 둔 길이를 되돌림(안 하면 메뉴에 레이가 안 닿음)
    return X.ray;
  }
  function onSelectStart(c) { c.userData.pending = true; }
  function startSelect(c) {   // 포즈가 갱신된 프레임에서 실제 판정
    const u = c.userData; u.pending = false;
    if (!u.uiHit) { aim(c); const h = UI.raycast(X.ray); if (h) u.uiHit = h; }
    if (u.uiHit) { u.pressUI = u.uiHit; UI.pressStart(c, u.uiHit); return; }
    if (S.mode === 'vr') { if (u.src && u.src.targetRayMode === 'transient-pointer') return; u.aim = true; }
    else if (S.mode === 'fig') { if (u.isHand || (u.src && u.src.targetRayMode === 'transient-pointer')) { u.pinchHold = true; Grab.update(); } else Fig.selectStart(c); }
  }
  function onSelectEnd(c) {
    const u = c.userData;
    if (u.pending) {   // 한 프레임 안에 누르고 뗀 짧은 탭: 지금 판정해서 메뉴만 누른다
      u.pending = false; aim(c); const h = UI.raycast(X.ray); if (h) UI.activate(h); return;
    }
    if (u.pressUI) { const h = u.pressUI; u.pressUI = null; const moved = UI.pressEnd(c); if (!moved && u.uiHit && u.uiHit.key === h.key) UI.activate(h); return; }
    if (u.pinchHold) { u.pinchHold = false; Grab.update(); return; }
    if (S.mode === 'fig' && !u.isHand) { Fig.selectEnd(c); return; }
    if (u.aim) { u.aim = false; const pt = u.hit; if (pt) jump(() => teleportTo(pt), true); u.hit = null; X.marker.visible = false; }
  }
  const prevBtn = new WeakMap();
  function pollGamepads(dt, time) {
    for (const src of S.session.inputSources) {
      const gp = src.gamepad; if (!gp || src.hand) continue;
      const was = prevBtn.get(src) || [], b = gp.buttons.map(x => x && x.pressed), edge = k => b[k] && !was[k];
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0] || 0, ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1] || 0;
      const h = src.handedness;
      if (edge(4)) { if (S.mode === 'vr') stepFloor(+1); else { S.fig.scale = clampScale(S.fig.scale * 1.25); UI.dirty(); } }
      if (edge(5)) { if (S.mode === 'vr') stepFloor(-1); else { S.fig.scale = clampScale(S.fig.scale / 1.25); UI.dirty(); } }
      if (edge(3) && h === 'left') UI.toggleMenu();
      if (edge(3) && h === 'right' && X.mp && X.mp.joined) X.mp.toggleLaser();
      if (edge(1) && S.mode === 'vr' && !UI.menuOpen() && !ctrls.some(c => c.userData.uiHit)) { if (K.I && K.I.on) goOutside(); else goInside(); }
      if (h === 'left' && S.mode === 'vr' && Math.hypot(ax, ay) > 0.15) walk(ax, ay, dt);
      if (h === 'right') {
        if (S.mode === 'vr') {
          if (S.turn === 'snap') { if (Math.abs(ax) > 0.7 && !S.turnHeld) { snapTurn(ax > 0 ? -Math.PI / 6 : Math.PI / 6); S.turnHeld = true; } else if (Math.abs(ax) < 0.3) S.turnHeld = false; }
          else if (Math.abs(ax) > 0.15) { snapTurn(-ax * 1.6 * dt); S.moving = 1; }
        } else if (S.mode === 'fig') {
          if (Math.abs(ax) > 0.15) S.fig.yaw += ax * 1.4 * dt;
        }
        // 메뉴를 가리키고 있을 때만 위아래로 스크롤(시안 넘기기는 메뉴에서)
        if (ctrls.some(c => c.userData.uiHit && c.userData.uiHit.where === 'menu')) { if (Math.abs(ay) > 0.15) UI.scrollBy(ay * 1100 * dt); }
      }
      prevBtn.set(src, b);
    }
  }
  function updateRays() {
    let anyHit = null;
    for (const c of ctrls) {
      const u = c.userData; u.uiHit = null; if (u.cursor) u.cursor.visible = false;
      if (!u.src) continue;
      aim(c);
      let len = 3;
      const uh = UI.raycast(X.ray); if (uh) { u.uiHit = uh; len = uh.distance; }
      if (u.pressUI) UI.pressMove(c, uh, X.ray);
      if (u.pending) startSelect(c);
      if (!uh && u.aim && S.mode === 'vr') {
        const r = arc(X.ray.ray.origin, X.ray.ray.direction);
        u.hit = r.ok ? r.point : null; u.arcPts = r.pts; len = 0.3;
        if (u.hit) anyHit = u.hit; else X.badHit = r.point;
      } else u.arcPts = null;
      // 1102.r: 메뉴·순간이동이 아닐 때 레이를 벽·물체에서 끊는다(3m 안, 퀘스트 CPU 를 아끼려고 3프레임마다·지금 층(실내) 또는 우리 건물(바깥)만 판정, 그 사이는 앞 값)
      if (!uh && !u.aim) { if (((u.rf = (u.rf || 0) + 1) % 3) === 1 || u.wallLen == null) { const h = wallHit(X.ray.ray.origin.clone(), X.ray.ray.direction.clone(), 3); u.wallLen = h ? h.distance : 3; } len = u.wallLen; } else u.wallLen = null;
      u.line.scale.z = len / Math.max(rig.scale.x, 1e-6);
      rayLook(u.line, u.uiHit ? 'ui' : u.aim ? (u.hit ? 'aim' : 'bad') : '');
      // 커서: 메뉴·버튼을 맞힌 곳(레이 길이도 거기서 끊김)
      const cu = u.cursor || (u.cursor = makeCursor());
      if (uh) { if (!cu.parent) scene.add(cu); const s = Math.max(rig.scale.x, 1e-6), o = X.ray.ray.origin;
        cu.position.copy(X.ray.ray.direction).multiplyScalar(Math.max(0, uh.distance - 0.005 * s)).add(o); cu.lookAt(o); cu.scale.setScalar(s); cu.visible = true; }
    }
    const mk = X.marker, aimC = ctrls.find(c => c.userData.arcPts);
    drawArc(aimC ? aimC.userData.arcPts : null, !!anyHit);
    if (anyHit || (aimC && X.badHit)) { if (!mk.parent) scene.add(mk); mk.visible = true; mk.position.copy(anyHit || X.badHit).y += 0.02; mk.material.color.set(anyHit ? 0xffc23d : 0xff7a6b); } else mk.visible = false;
    X.badHit = null;
  }
  // 순간이동 포물선: 손이 가리키는 방향으로 던진 곡선이 처음 닿는 곳. 위를 향한 면이고(건물 안이면) 걸을 수 있는 곳이어야 함
  const ARC_V = 13, ARC_N = 60;   // 초속 13m로 던진 곡선(45°에서 약 17m), 최대 60구간
  function arc(o, dir) {
    const pts = [o.clone()], v = dir.clone().multiplyScalar(ARC_V), g = -9.8, dt = 0.05;
    let p = o.clone();
    for (let i = 0; i < ARC_N; i++) {
      const q = p.clone().addScaledVector(v, dt); v.y += g * dt;
      const seg = q.clone().sub(p), L = seg.length(), sd = seg.clone().normalize();
      const h = firstSolid(p, sd, L);
      if (h) {
        let point = h.point.clone(), up = isUp(h);
        if (!up) {     // 도로 턱·문턱·계단 앞면처럼 낮은 세로면이면 바로 뒤의 윗면을 찾는다
          const back = point.clone().addScaledVector(V(sd.x, 0, sd.z).normalize(), 0.12).add(V(0, 0.45, 0));
          const d = firstSolid(back, V(0, -1, 0), 0.9);
          if (d && isUp(d)) { point = d.point.clone(); up = true; }
        }
        pts.push(point);
        return { ok: up && landOk(point), point, pts };
      }
      pts.push(q); p = q;
      if (p.y < -60) break;
    }
    return { ok: false, point: null, pts };
  }
  // 바닥이 될 수 있는 첫 면: 선·점·글자판, 투명한 것, 숨긴 것은 건너뜀
  function firstSolid(o, d, far) {
    X.ray.set(o, d); X.ray.near = 0; X.ray.far = far;
    for (const h of X.ray.intersectObjects(pickables(), true)) {
      const ob = h.object; if (!ob.isMesh || ob.isSprite || !visibleForPick(ob)) continue;
      const m = Array.isArray(ob.material) ? ob.material[0] : ob.material; if (m && (m.visible === false || (m.transparent && m.opacity < 0.9))) continue;   // 보이는 유리 너머로도 갈 수 있게(유리문·통창)
      return h;
    }
    return null;
  }
  // 1102.r: 레이를 끊을 벽 판정은 장면 전체 대신 지금 층 묶음(실내)이나 우리 건물(바깥)만(장면 전체는 CPU 4배에서 순간이동마다 130ms)
  function wallHit(o, d, far) {
    const li = K.I && K.I.on && K.I.li != null ? K.I.li : -1, tg = li >= 0 && K.LG && K.LG[li] ? [K.LG[li]] : K.bld ? [K.bld] : [];
    X.ray.set(o, d); X.ray.near = 0; X.ray.far = far;
    for (const h of X.ray.intersectObjects(tg, true)) { const ob = h.object; if (!ob.isMesh || !visibleForPick(ob)) continue; const m = Array.isArray(ob.material) ? ob.material[0] : ob.material; if (m && (m.visible === false || (m.transparent && m.opacity < 0.9))) continue; return h; }
    return null;
  }
  function isUp(h) { if (!h.face) return false; const y = V().copy(h.face.normal).transformDirection(h.object.matrixWorld).y, m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material; return m && m.side === T.DoubleSide ? Math.abs(y) > 0.6 : y > 0.6; }   // 1102.s: 양면 재질 바닥(지니 대지 둘레 면 등)은 법선이 아래를 향해도 바닥
  function rampAt(pt) { if (!K.rampHit || !K.toPx) return null; const r = K.rampHit(K.toPx(pt.x, pt.z), pt.y); return r && Math.abs(r.y - pt.y) < 0.35 ? r : null; }
  function landOk(pt) {
    if (rampAt(pt)) return true;     // 계단 단·램프 위
    const L0 = curLevel();
    if (L0) return !K.walkable || Math.abs(pt.y - floorY(L0)) > 1.5 || K.walkable(pt.x, pt.z, L0);
    const L1 = enterLevelAt(pt); if (!L1 || !K.walkable) return true;
    // 1102.s: 지니 env_detail 부터 정면 출입구 앞 3m 가 1층 높이 평지라 1층 바닥으로 잘못 보고 걷기 판정에서 떨어뜨렸다. 층 외곽 밖이면 바깥 땅이다
    if (K.toPx && L1.poly && !inPoly2(K.toPx(pt.x, pt.z), L1.poly)) return true;
    return K.walkable(pt.x, pt.z, L1);   // 밖에서 건물 1층 바닥을 가리키면 그 층 걷기 판정
  }
  function inPoly2(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
  // 건물 밖에서 건물 안 바닥을 가리켰을 때 들어갈 층(1층 높이 근처만)
  function enterLevelAt(pt) {
    if (!K.full || (K.I && K.I.on) || !K.bld || !K.LEVELS) return null;
    const b = new T.Box3().setFromObject(K.bld); if (pt.x < b.min.x || pt.x > b.max.x || pt.z < b.min.z || pt.z > b.max.z) return null;
    let best = null; K.LEVELS.forEach((L, i) => { const d = Math.abs(floorY(L) - pt.y); if (d < 0.6 && (!best || d < best.d)) best = { i, L, d }; });
    return best ? best.L : null;
  }
  let arcLine = null;
  function drawArc(pts, ok) {
    if (!arcLine) {
      arcLine = new T.Line(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(64 * 3), 3)), new T.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.9, depthTest: false }));
      arcLine.renderOrder = 999; arcLine.frustumCulled = false; arcLine.userData.khxr = true; arcLine.userData.keep = true;
    }
    if (!pts) { arcLine.visible = false; return; }
    if (!arcLine.parent) scene.add(arcLine);
    const a = arcLine.geometry.attributes.position; const n = Math.min(64, pts.length);
    for (let i = 0; i < n; i++) a.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
    arcLine.geometry.setDrawRange(0, n); a.needsUpdate = true;
    arcLine.material.color.set(ok ? 0xffc23d : 0xff7a6b); arcLine.visible = true;   // 순간이동 포물선은 노랑(메뉴 레이 청록과 구분)
  }
  function visibleChain(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
  function pickables() { return scene.children.filter(o => o !== rig && o !== X.marker && !o.userData.khxr && o !== Opt.group && o.type !== 'DirectionalLight'); }
  function visibleForPick(o) { const hid = Opt.hiddenSet; for (; o; o = o.parent) if (!o.visible && !(hid && hid.has(o))) return false; return true; }

  /* ================= 7. 프레임 ================= */
  let last = 0;
  function frame(time) {
    const dt = Math.min(0.1, (time - (last || time)) / 1000); last = time;
    if (Fps.on) Fps.tick(time, R.info.render.calls);
    if (Diag.on) Diag.tick(time);
    VRLit.tick();
    XQ.tick(time);
    R.info.autoReset = false; R.info.reset();   // 한 프레임에 여러 번 그리므로(가상 방·UI 패스) 프레임 단위로 합산
    S.moving = Math.max(0, S.moving - dt * 4);
    pollGamepads(dt, time);
    const vo = S.vignette && S.mode === 'vr' ? Math.min(0.85, S.moving * 0.85) : 0; X.vig.material.opacity = vo; X.vig.visible = vo > 0.02;
    if (S.mode === 'fig') { Fig.update(dt); applyFigRig(); }
    Grab.tick();
    updateRays();
    UI.update(time, dt);
    Labels.update();
    Hot.update();
    Photo.update();
    fadeTick(dt); Load.tick(performance.now());
    for (const f of X.hooks) f(dt, time);   // 멀티플레이 등 덧붙인 모듈
    if (S.opt) Opt.check(time);
    OnTop.apply(time);
    // 피규어: 배경 비우고 대지 주변만
    let cp0 = null;
    if (S.mode === 'fig') { scene.background = null; scene.fog = null; R.setClearAlpha(S.ar ? 0 : 1); cp0 = R.clippingPlanes; R.clippingPlanes = []; cropPlanes(); clipMaterials(true, time); }
    else if (clipped.size) clipMaterials(false);
    else if (S.ar) R.setClearAlpha(1);
    xrCam.near = S.mode === 'fig' ? 0.02 : 0.08; xrCam.far = S.mode === 'fig' ? 60 : 5000;
    rig.updateMatrixWorld(true);
    const split = S.mode === 'fig';     // 피규어: 모형만 자르고, 손·메뉴·레이(rig 안)는 잘리지 않게 따로 그림
    if (split) rig.visible = false;
    const fcHid = split ? FigCull.hide(time) : null;
    if (Room.g && Room.g.visible) {
      Room.update(); const cpR = R.clippingPlanes; R.clippingPlanes = [];
      R.render(Room.scene, xrCam);
      R.clippingPlanes = cpR; const ac = R.autoClear; R.autoClear = false; R.render(scene, xrCam); R.autoClear = ac;
    } else R.render(scene, xrCam);
    if (fcHid) fcHid.forEach(o => { o.visible = true; });
    if (S.ar || AlphaFix.probe) AlphaFix.run(S.mode === 'fig');
    if (cp0) R.clippingPlanes = cp0;
    if (split) {
      rig.visible = true; uiScene.add(rig);
      const cpU = R.clippingPlanes, ac = R.autoClear; R.clippingPlanes = []; R.autoClear = false;
      R.render(uiScene, xrCam);
      R.clippingPlanes = cpU; R.autoClear = ac; scene.add(rig);
    }
  }

  /* 패스스루 알파 보정(1102.k, Jack 퀘스트 확인: 나뭇잎 자리에 현실이 비침): 패스스루가 되는 세션(immersive-ar)은 프레임 버퍼 알파가 1 보다 작은 화소를
     현실과 섞는다. 잎·카드처럼 알파 시험(alphaTest)을 쓰는 불투명 재질은 블렌딩 없이 텍스처 알파(예: 0.6)를 그대로 써서 그 자리가 비쳤다.
     장면을 그린 뒤 알파 채널만 1 로 채운다(색은 그대로): VR 은 화면 전체, 피규어는 무엇이 그려진 곳(깊이 < 1)만 → 모형 바깥만 투명, 모형 안 잎·유리는 불투명.
     three 를 거치지 않는 작은 GL 프로그램으로 그리고 끝나면 three 상태를 되돌린다. ?pralpha=0 이면 끈다. 시험용으로 probe 가 켜져 있으면 알파를 읽어 둔다 */
  const AlphaFix = X.alphaFix = {
    on: Q.get('pralpha') !== '0', prog: null, vao: null, probe: false, last: null,
    init(gl) {
      const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){vec2 q=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(q*2.0-1.0,1.0,1.0);}'));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision mediump float;out vec4 o;void main(){o=vec4(0.0,0.0,0.0,1.0);}'));
      gl.linkProgram(p); this.prog = p; this.vao = gl.createVertexArray();
    },
    run(depthOnly) {
      if (!this.on && !this.probe) return; const gl = R.getContext(); if (!(gl instanceof WebGL2RenderingContext)) return;
      if (!this.prog) this.init(gl);
      const L = S.session && S.session.renderState.baseLayer; if (!L) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, L.framebuffer); gl.viewport(0, 0, L.framebufferWidth, L.framebufferHeight);
      gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.disable(gl.STENCIL_TEST); gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.colorMask(false, false, false, true); gl.depthMask(false);
      if (depthOnly) { gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.GREATER); } else gl.disable(gl.DEPTH_TEST);   // 피규어: 깊이 1(먼 면)의 삼각형이 그려진 곳(깊이 < 1)만 통과
      if (this.on) { gl.useProgram(this.prog); gl.bindVertexArray(this.vao); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.bindVertexArray(null); }
      if (this.probe) { const w = L.framebufferWidth, h = L.framebufferHeight, px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); let min = 255, n = 0, all = 0;
        for (let i = 3; i < px.length; i += 16) { all++; if (px[i] < 255) { n++; if (px[i] < min) min = px[i]; } }
        this.probe = false; this.last = { min, belowPct: +(n / all * 100).toFixed(2), mode: depthOnly ? 'fig' : 'vr', ar: !!S.ar, fixed: this.on }; }
      gl.colorMask(true, true, true, true); gl.depthMask(true); gl.depthFunc(gl.LEQUAL);
      R.resetState(); R.state.bindXRFramebuffer(L.framebuffer);   // resetState 는 XR 프레임 버퍼 기억도 지우므로 다시 묶는다(이어지는 피규어 UI 그리기가 같은 버퍼에)
    }
  };

  /* ================= 8. 화면 전환 효과 ================= */
  /* 1102.v(Jack: 이동할 때마다 '불러오는 중'·검은 화면이 거슬림, 원칙 = 로딩 없이 바로 보이기): 텔레포트·층 이동·밖으로·시점 이동은 검은 페이드 없이 그 프레임에 옮기고,
     VR 합치기는 다음 프레임에 바로 한 번 한다(예전: 검은 화면 0.3～1.5초 동안 합치기·실사 계층 정리를 기다림). tp: 텔레포트면 그 뒤 5초는 로딩 판을 띄우지 않는다 */
  function jump(fn, tp) {
    if (!S.session) { fn(); return; }
    S.fade = null; if (fadeMesh) fadeMesh.visible = false;
    try { fn(); } catch (e) { log('이동 오류', e.message); }
    if (S.opt) { Opt.need = true; Opt.due = performance.now(); }
    S.moved = performance.now(); if (tp) S.tpQuiet = performance.now() + 5000;
  }
  function fade(fn, dur = 0.35) {
    if (!S.session) { fn(); return; }
    S.fade = { t: 0, dur, fn, done: false };
  }
  /* VR 품질 단계(T5): 기본은 화면과 같은 품질(Jack 결정 10-30, 11-01). 프레임 간격을 감시해 목표(72Hz, 13.9ms)를 못 맞추는 상태가
     2초 이어지면 한 단계 낮추고, 여유가 15초 이어지면 한 단계 올린다. 0 그대로, 1 포비에이션 최대, 2 가까운 나무 카드·전신주 숨김(실사 계층),
     3 원경 주변 건물 숨김(실사 계층). 문턱값은 실기기 측정 전 추정값이라 XQC 에 모았다(측정 뒤 조정).
     에뮬레이터(?xremu=1)는 프레임 간격이 실제가 아니므로 자동으로 바꾸지 않는다. ?xrq=0～3 은 단계 고정 */
  const XQC = { fps: 72, downMs: 15.5, upMs: 11.0, downHold: 2000, upHold: 15000, max: 3, win: 72 };
  const XQ = X.xrq = {
    level: 0, ds: [], last: 0, bad: 0, good: 0, fixed: Q.get('xrq') != null && Q.get('xrq') !== '' ? Math.max(0, Math.min(3, +Q.get('xrq') || 0)) : null,
    auto: !Q.get('xremu'),
    // 1102.s(Jack 퀘스트: 렉이 심함): 실사 3D 를 켠 채 들어가면 한 단계 낮춰(고정 포비에이션 최대 + 실사 계층 VR 화질 1단계) 시작하고, 15초 동안 넉넉하면 올린다
    reset() { this.ds = []; this.last = 0; this.bad = this.good = 0; this.set(this.fixed != null ? this.fixed : (window.KHPRLayer && KHPRLayer.on && this.auto ? 1 : 0)); },
    set(lv) {
      this.level = lv;
      try { const L = S.session && S.session.renderState.baseLayer; if (L && 'fixedFoveation' in L) L.fixedFoveation = lv >= 1 ? 1.0 : store.get('foveation', 0.5); } catch (e) {}
      if (window.KHPRLayer && KHPRLayer.xrQuality) KHPRLayer.xrQuality(lv);
      log('VR 품질 단계', lv);
    },
    tick(time) {
      if (this.last) { this.ds.push(time - this.last); if (this.ds.length > XQC.win) this.ds.shift(); } const dt = this.last ? time - this.last : 0; this.last = time;
      if (this.fixed != null || !this.auto || this.ds.length < XQC.win / 2) return;
      const a = this.ds.slice().sort((x, y) => x - y), p90 = a[Math.floor(a.length * 0.9)];
      if (p90 > XQC.downMs) { this.bad += dt; this.good = 0; } else if (p90 < XQC.upMs) { this.good += dt; this.bad = 0; } else { this.bad = this.good = 0; }
      if (this.bad > XQC.downHold && this.level < XQC.max) { this.set(this.level + 1); this.bad = 0; this.ds = []; }
      else if (this.good > XQC.upHold && this.level > 0) { this.set(this.level - 1); this.good = 0; this.ds = []; }
    }
  };
  /* 간이 프레임 표시: 실기기 착용 확인용. 시야 아래쪽에 작은 판으로 프레임 간격 중앙값·95%와 그리기 호출을 보인다
     실사 계층과 같은 규칙: 기본은 숨김, ?prfps=1 또는 실사 패널 '성능 보기'(localStorage khpr.perf)일 때만, ?prfps=0 이면 끈다 */
  const Fps = X.fps = {
    on: Q.get('prfps') === '1' || (Q.get('prfps') !== '0' && (() => { try { return localStorage.getItem('khpr.perf') === '1'; } catch (e) { return false; } })()),
    ds: [], last: 0, t: 0, mesh: null, cv: null, tex: null,
    set(on) { this.on = !!on; this.ds = []; this.last = 0; if (this.mesh) this.mesh.visible = this.on; },
    tick(time, calls) {
      if (this.last) { this.ds.push(time - this.last); if (this.ds.length > 144) this.ds.shift(); } this.last = time;
      if (!this.mesh) {
        this.cv = document.createElement('canvas'); this.cv.width = 512; this.cv.height = 96; this.tex = new T.CanvasTexture(this.cv);
        this.mesh = new T.Mesh(new T.PlaneGeometry(0.16, 0.03), new T.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
        this.mesh.position.set(0, -0.11, -0.45); this.mesh.renderOrder = 9998; this.mesh.userData.khxr = true; xrCam.add(this.mesh);
      }
      if (time - this.t < 500 || this.ds.length < 10) return; this.t = time;
      const a = this.ds.slice().sort((x, y) => x - y), q = k => a[Math.min(a.length - 1, Math.floor(a.length * k))], med = q(0.5), p95 = q(0.95);
      const g = this.cv.getContext('2d'); g.clearRect(0, 0, 512, 96); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 512, 96);
      g.fillStyle = p95 <= 14.5 ? '#7dffa8' : p95 <= 20 ? '#ffd166' : '#ff7a6b'; g.font = '600 34px ' + FONT; g.textBaseline = 'middle';
      g.fillText(`${(1000 / med).toFixed(0)}fps  중앙 ${med.toFixed(1)}ms  95% ${p95.toFixed(1)}ms`, 14, 32);
      g.fillStyle = '#ffffff'; g.font = '500 26px ' + FONT; g.fillText(`그리기 ${calls}회  ${S.mode || ''}${window.KHPRLayer && KHPRLayer.on ? ' · 실사 3D' : ''}  품질 단계 ${XQ.level}${XQ.fixed != null ? '(고정)' : ''}`, 14, 72);
      this.tex.needsUpdate = true; X.fpsStat = { med: +med.toFixed(1), p95: +p95.toFixed(1), calls };
    }
  };
  /* VR 렌더 모드 밝기 보정(1102.e): 화면의 렌더 모드는 합성기(SSAO·블룸·감마 단계)로 다듬지만 VR 은 후처리 없이 그려 반구광 0.12·노출 0.78 이
     그대로 드러나 우리 건물 유리 입면이 거의 검고 조명이 죽어 보였다. VR 안 렌더 모드(실사 3D 아님)에서만 노출 ×1.3, 반구광 ×3 으로 올리고 나오면 되돌린다.
     Wing 이 그 사이 값을 바꾸면(시간대 변경) 새 값을 기준으로 다시 잡는다 */
  const VRLit = {
    on: false, base: null,
    tick() {
      const W = window.KHPR, want = !!(R.xr.isPresenting && W && W.R3D && W.R3D.on && !(window.KHPRLayer && KHPRLayer.on));
      const H = W && W.hemi;
      if (want) {
        if (!this.on || !this.base || Math.abs(R.toneMappingExposure - this.base.exp * 1.3) > 1e-3 || (H && Math.abs(H.intensity - this.base.hemi * 3) > 1e-3)) {
          if (this.on && this.base) { this.base = { exp: R.toneMappingExposure, hemi: H ? H.intensity : 0 }; }   // Wing 이 값을 바꿈
          else this.base = { exp: R.toneMappingExposure, hemi: H ? H.intensity : 0 };
          this.on = true; R.toneMappingExposure = this.base.exp * 1.3; if (H) H.intensity = this.base.hemi * 3;
        }
      } else if (this.on) { this.on = false; if (this.base) { R.toneMappingExposure = this.base.exp; if (H) H.intensity = this.base.hemi; } this.base = null; }
    }
  };
  /* 진단 판(?prdiag=1): Wing 페이지의 독립 감시 코드(window.__khDiag)가 모은 상태를 VR 시야 왼쪽 아래 판에 1초마다 보인다(퀘스트 실기기 확인용) */
  const Diag = X.diag = {
    on: Q.get('prdiag') === '1', t: 0, mesh: null, cv: null, tex: null,
    tick(time) {
      if (!this.mesh) {
        this.cv = document.createElement('canvas'); this.cv.width = 1024; this.cv.height = 512; this.tex = new T.CanvasTexture(this.cv);
        this.mesh = new T.Mesh(new T.PlaneGeometry(0.3, 0.15), new T.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
        this.mesh.position.set(-0.12, -0.02, -0.5); this.mesh.renderOrder = 9998; this.mesh.userData.khxr = true; xrCam.add(this.mesh);
      }
      if (time - this.t < 1000) return; this.t = time;
      const L = window.__khDiag && window.__khDiag.info ? window.__khDiag.info() : ['감시 코드 없음'], g = this.cv.getContext('2d');
      g.clearRect(0, 0, 1024, 512); g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#fff'; g.font = '500 22px ' + FONT;
      L.slice(0, 18).forEach((s, i) => g.fillText(String(s).slice(0, 80), 14, 30 + i * 27)); this.tex.needsUpdate = true;
    }
  };
  // VR 로딩 패널(1102.s, Jack 퀘스트: 들어가거나 VR 안에서 실사 3D 를 누른 뒤 검은 화면만 길게 보여 고장으로 오해). 머리에 붙은 작은 판에
  // '불러오는 중 · 단계 · 경과 초'를 보이고 점이 돌아 살아 있음을 알린다. 검은 전환 구(반지름 0.25m) 안쪽 0.2m 에 두고 맨 나중에 그린다
  const Load = {
    m: null, cv: null, g: null, tex: null, t0: 0, last: 0, shown: false,
    init() { this.cv = document.createElement('canvas'); this.cv.width = 640; this.cv.height = 150; this.g = this.cv.getContext('2d'); this.tex = new T.CanvasTexture(this.cv);
      this.m = new T.Mesh(new T.PlaneGeometry(0.128, 0.03), new T.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
      this.m.position.set(0, -0.012, -0.2); this.m.renderOrder = 10001; this.m.visible = false; xrCam.add(this.m); },
    busy() { const P = window.KHPRLayer, pg = P && P.progress ? P.progress() : null, env = window.KHENV && KHENV.busy;
      return { on: !!((pg && pg.busy) || env || (S.fade && fadeMesh.visible && fadeMesh.material.opacity > 0.6)) && !(S.tpQuiet && performance.now() < S.tpQuiet), text: pg && pg.text ? pg.text : env ? '주변 건물 받는 중' : Opt.need ? '장면 정리 중' : '화면 준비 중' }; },
    // 1102.u: 무엇이 끝나지 않아도 20초가 지나면 판을 닫는다. 닫기 전 3초는 이유('준비가 늦어 닫습니다: …')를 보이고, 그 일이 끝날 때까지 다시 띄우지 않는다
    tick(now) { if (!this.m) return; let b = S.session ? this.busy() : { on: false };
      if (b.on && this.timed) b = { on: false }; else if (!b.on) this.timed = false;
      if (b.on && this.shown && now - this.t0 > 20000) { this.timed = true; this.why = b.text; this.whyT = now; log('로딩 판 시간 초과', b.text, X.loadWhy ? X.loadWhy() : ''); b = { on: false }; }
      if (this.whyT && now - this.whyT < 3000) { this.m.visible = true; if (now - this.last >= 250) { this.last = now; const g = this.g; g.clearRect(0, 0, 640, 150); g.fillStyle = 'rgba(60,40,18,0.9)'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, 640, 150, 22) : g.rect(0, 0, 640, 150); g.fill();
        g.fillStyle = '#fff'; g.font = '600 36px system-ui, sans-serif'; g.fillText('준비가 늦어 닫습니다', 30, 60); g.fillStyle = '#e8dcc8'; g.font = '28px system-ui, sans-serif'; g.fillText(String(this.why || '').slice(0, 30), 30, 112); this.tex.needsUpdate = true; } return; }
      this.whyT = 0;
      if (b.on && !this.shown) { this.shown = true; this.t0 = now; }
      if (!b.on && this.shown && now - (this.off || (this.off = now)) > 400) { this.shown = false; this.off = 0; } else if (b.on) this.off = 0;
      const vis = this.shown && now - this.t0 > 1500;   /* 1102.v: 1.5초 넘게 이어질 때만(짧은 받기는 표시 없이). 합치기(Opt.need)는 판 이유에서 뺌 */ this.m.visible = vis; if (!vis || now - this.last < 250) return; this.last = now;
      const g = this.g, W = 640, H = 150, sec = ((now - this.t0) / 1000).toFixed(0), dots = '●○○○'.slice(0, 4).split(''), k = Math.floor(now / 250) % 4;
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(18,20,22,0.88)'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, W, H, 22) : g.rect(0, 0, W, H); g.fill();
      g.fillStyle = '#fff'; g.font = '600 40px system-ui, sans-serif'; g.fillText('불러오는 중 ' + dots.map((d, i) => (i === k ? '●' : '○')).join(''), 30, 62);
      g.fillStyle = '#c8ccd0'; g.font = '30px system-ui, sans-serif'; g.fillText((b.text || '').slice(0, 30) + ' · ' + sec + '초', 30, 116); this.tex.needsUpdate = true; },
    hide() { if (this.m) this.m.visible = false; this.shown = false; this.timed = false; this.whyT = 0; }
  };
  X.loading = () => !!(Load.m && Load.m.visible);   // 시험용
  X.loadTimedOut = () => !!Load.timed;   // 시험용
  X.loadWhy = () => { const P = window.KHPRLayer; return (P && P.busyWhy ? P.busyWhy() : '') + (window.KHENV && KHENV.busy ? ' env' : '') + (Opt.need ? ' opt' : '') + (S.fade ? ' fade' : ''); };   // 시험용: 판을 띄우는 이유
  X.fadeA = () => (fadeMesh && fadeMesh.visible ? fadeMesh.material.opacity : 0);   // 시험용: 전환 효과의 검은 정도
  function fadeTick(dt) {
    const F = S.fade; if (!F) { if (dt > 0 && dt < 0.5) S.dtAvg = S.dtAvg ? S.dtAvg * 0.95 + dt * 0.05 : dt; return; }   // 1102.r: 평소 프레임 간격(전환 밖)
    F.t += Math.min(dt, 0.05); const half = F.dur / 2;   // 긴 프레임(합치기 등) 뒤 한꺼번에 밝아지지 않게 한 프레임 진행은 0.05초까지
    if (!F.done && F.t >= half) { F.done = true; try { F.fn(); } catch (e) { log('전환 오류', e.message); }
      // 1102.m: 이동 직후 실사 계층이 몇 프레임에 걸쳐 새 층의 재질·조명을 바꾼다. 바로 합치면 재질이 바뀐 뒤 한 번 더 합쳐(층마다 2번, CPU 4배에서 각 약 200ms)
      // 그 둘째가 밝아진 뒤에 일어나기도 했다. 첫 합치기를 0.45초 뒤로 미뤄 한 번에 합친다(그동안 검은 화면)
      if (S.opt) { Opt.need = true; Opt.due = performance.now() + 450; } }
    // 이동 뒤 다시 합치기(층 이동 등)가 남아 있으면 검은 화면에서 끝내고 밝힌다(1102.k: 밝아지는 도중 합치기·그림자 다시 계산으로 끊김이 보였다). 최대 0.6초
    // 이동 직후 0.3초는 검은 채로 두고 매 프레임 장면 구성을 점검해(실사 층 조명·가구 표시가 몇 프레임 늦게 바뀜), 바뀌었으면 그 합치기도 검은 화면에서 끝낸다(최대 1.5초)
    // 1102.m(최적화 4번): 실사 계층이 아직 받거나 만드는 중이면(처음 가는 층의 가구 등) 또는 방금 긴 프레임(50ms 넘음)이 있었으면 검은 화면을 더 둔다(최대 1.5초 그대로).
    // 처음 1층에 들어갈 때 가구 만들기, 5층의 늦은 합치기가 밝아진 뒤에 일어나 보이는 동안 약 100ms 멈춤이 남았다
    else if (F.done && S.opt) { const t = performance.now(), w = t - (F.h0 || (F.h0 = t)); if (dt > Math.max(0.05, (S.dtAvg || 0) * 1.8)) F.lg = t;   // 1102.r: 긴 프레임은 평소의 1.8배(최소 50ms). 평소가 50ms 안팎인 기기에서 검은 화면이 늘 1.5초까지 갔다
      const busy = !!(window.KHPRLayer && KHPRLayer.settling && KHPRLayer.settling()), long = !!F.lg && t - F.lg < 300;
      if ((w < 300 || Opt.need || busy || long) && w < 1500) { F.t = Math.min(F.t, half); Opt.t = 0; } }
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
  const Fig = X.fig = {
    base: null, target: null, anchor: null, placed: false,
    // 처음 놓을 자리: 감지된 책상 면 → 없으면 눈앞 0.55m, 눈높이보다 0.55m 아래
    place() { this.want = 'place'; },
    doPlace() {
      const h = xrCam.position.clone(), d = V(0, 0, -1).applyQuaternion(xrCam.quaternion); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize();
      const head = h.lengthSq() ? h : V(0, 1.6, 0);
      const t = this.table(head, d);
      S.fig.pos = t || head.clone().addScaledVector(d, 0.55).setY(Math.max(0.4, head.y - 0.55));
      this.placed = true; this.doAnchor();
      UI.toast(t ? '책상 위에 놓았습니다' : '눈앞에 놓았습니다 (그립으로 옮기기)');
    },
    table(head, d) {   // plane-detection: 0.5~1.3m 높이의 수평면 중 시선 앞쪽에서 가장 가까운 곳
      try {
        const f = R.xr.getFrame && R.xr.getFrame(), ref = R.xr.getReferenceSpace(); if (!f || !f.detectedPlanes || !ref) return null;
        let best = null, bd = 9;
        f.detectedPlanes.forEach(pl => {
          if (pl.orientation && pl.orientation !== 'horizontal') return;
          const pose = f.getPose(pl.planeSpace, ref); if (!pose) return;
          const p = pose.transform.position, v = V(p.x, p.y, p.z);
          if (v.y < 0.45 || v.y > 1.3) return;
          const rel = v.clone().sub(head); rel.y = 0; const dist = rel.length(); if (dist > 2.5 || rel.normalize().dot(d) < 0.3) return;
          if (dist < bd) { bd = dist; best = v; }
        });
        return best ? best.add(V(0, 0.01, 0)) : null;
      } catch (e) { return null; }
    },
    saveAnchor() { this.wantAnchor = true; },
    async doAnchor() {
      try {
        const f = R.xr.getFrame && R.xr.getFrame(), ref = R.xr.getReferenceSpace(); if (!f || !f.createAnchor) return;
        const p = S.fig.pos; const a = await f.createAnchor(new XRRigidTransform({ x: p.x, y: p.y, z: p.z }), ref);
        if (this.anchor && this.anchor.delete) this.anchor.delete();
        this.anchor = a;
        if (a && a.requestPersistentHandle) { const hd = await a.requestPersistentHandle(); const old = store.get('anchor', null); if (old && old !== hd && S.session.deletePersistentAnchor) S.session.deletePersistentAnchor(old).catch(() => {}); store.set('anchor', hd); }
        store.set('figState', { yaw: S.fig.yaw, scale: S.fig.scale, crop: S.fig.crop });
      } catch (e) { log('앵커 저장 생략', e.message); }
    },
    async restore() {   // 지난번 자리(영구 앵커)에 다시 놓기
      try {
        const hd = store.get('anchor', null); if (!hd || !S.session.restorePersistentAnchor) return false;
        this.anchor = await S.session.restorePersistentAnchor(hd);
        const st = store.get('figState', null); if (st) Object.assign(S.fig, st);
        this.placed = true; UI.toast('지난번 자리에 놓았습니다'); return true;
      } catch (e) { log('앵커 복원 실패', e.message); return false; }
    },
    update() {
      if (this.want === 'place') { this.want = null; this.doPlace(); }
      if (this.wantAnchor) { this.wantAnchor = false; this.doAnchor(); }
      // 앵커가 있으면 그 위치를 따른다(헤드셋이 원점을 다시 잡아도 같은 자리)
      try {
        if (this.anchor && !Grab.g) { const f = R.xr.getFrame(), ref = R.xr.getReferenceSpace(); const pose = f && this.anchor.anchorSpace && f.getPose(this.anchor.anchorSpace, ref); if (pose) { const p = pose.transform.position; S.fig.pos.set(p.x, p.y, p.z); } }
      } catch (e) {}
      this.baseUpdate();
    },
    baseUpdate() {   // 모형 받침: 자른 범위만 한 판. 자르기 평면에 옆면이 같이 잘리지 않게 자르기 없는 장면(uiScene)에 둔다
      if (!this.base) {
        const side = new T.MeshBasicMaterial({ color: 0x4a5056 }), top = new T.MeshBasicMaterial({ color: 0xd9d5cc }), bot = new T.MeshBasicMaterial({ color: 0x2e3236 });
        const g = this.base = new T.Group(); g.name = 'khxr-base'; g.userData.khxr = true;
        const box = new T.Mesh(new T.BoxGeometry(1, 1, 1).translate(0, -0.5, 0), [side, side, top, bot, side, side]);
        const rim = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
        rim.userData.keep = true; g.add(box, rim); g.userData.box = box; g.userData.rim = rim;
      }
      const on = S.mode === 'fig';
      if (on && this.base.parent !== uiScene) uiScene.add(this.base);
      this.base.visible = on;
      if (on) {
        const r = S.fig.crop, th = 0.022 / S.fig.scale;    // 실제 두께 약 2.2cm
        this.base.position.set(S.center.x, -0.05, S.center.z);
        this.base.userData.box.scale.set(r * 2, th, r * 2);
        this.base.userData.rim.scale.set(r * 2, 1, r * 2); this.base.userData.rim.position.y = 0.06 / (150 * S.fig.scale);
      }
      this.trimUpdate();
    },
    // 자르기 경계에 걸친 주변 건물은 단면이 드러나 어색하므로 통째로 숨긴다(땅·도로처럼 납작한 것만 잘라서 보임)
    trimmed: [], trimSig: '',
    trimUpdate() {
      const on = S.mode === 'fig' && K.full;
      const sig = on ? [S.fig.crop, S.center.x.toFixed(1), S.center.z.toFixed(1), scene.children.length].join(',') : '';
      if (sig === this.trimSig) return;
      this.untrim(); this.trimSig = sig; if (!on) return;
      const c = S.center, r = S.fig.crop + 0.5, b = new T.Box3();
      for (const top of scene.children) {
        if (!top.isGroup || top === K.bld || top === rig || top.userData.khxr || top === Opt.group || !top.visible) continue;
        for (const o of top.children) {
          if (!o.visible || o.userData.khxr) continue;
          b.setFromObject(o); if (b.isEmpty() || b.max.y - b.min.y < 2.5) continue;
          const inside = b.min.x >= c.x - r && b.max.x <= c.x + r && b.min.z >= c.z - r && b.max.z <= c.z + r;
          const away = b.max.x < c.x - r || b.min.x > c.x + r || b.max.z < c.z - r || b.min.z > c.z + r;
          if (!inside && !away) { o.visible = false; this.trimmed.push(o); }
        }
      }
      if (this.trimmed.length && S.opt) Opt.dirty();
    },
    untrim() { if (!this.trimmed.length) return; this.trimmed.forEach(o => { o.visible = true; }); this.trimmed = []; if (S.opt) Opt.dirty(); },
    // 컨트롤러 트리거: 모형의 한 점을 가리켜 놓으면 그 자리로 들어간다
    selectStart(c) {
      aim(c); X.ray.far = 20 * Math.max(1, rig.scale.x);
      const hit = X.ray.intersectObjects(pickables(), true).find(h => visibleForPick(h.object));
      this.target = hit ? { p: hit.point.clone(), c } : null;
      if (this.target) { const mk = X.marker; if (!mk.parent) scene.add(mk); mk.visible = true; mk.position.copy(hit.point); mk.scale.setScalar(rig.scale.x * 0.25); }
    },
    selectEnd(c) {
      const t = this.target; this.target = null; X.marker.scale.setScalar(1);
      if (!t || t.c !== c) return;
      jump(() => this.enterAt(t.p));
    },
    enterAt(p) {
      setMode('vr');
      const lv = K.full ? sortedLevels() : [];
      const c = S.center, r = Math.hypot(p.x - c.x, p.z - c.z);
      let li = -1; for (const s of lv) if (p.y >= s.y - 0.3) li = s.i;
      if (K.full && r < 14 && li >= 0 && p.y > 0.5) {   // 건물을 가리켰으면 그 높이의 층, 가리킨 자리로
        if (!K.I.on) K.enterInt(); K.placeLevel(li, true); wingTarget();
        const L = K.LEVELS[li], ok = !K.walkable || K.walkable(p.x, p.z, L);
        const q = ok ? p : wingTarget().p;
        placeUser(V(q.x, floorY(L), q.z), yawOf(q, c));
      } else {
        if (K.full && K.I.on) K.exitInt();
        placeUser(V(p.x, Math.max(0, p.y), p.z), yawOf(p, c));
      }
      afterChange();
    }
  };
  const CROPS = [[18, '건물만'], [45, '건물과 블록'], [250, '미성아파트 포함']];
  // 모드를 바꾸면서 세션 종류(패스스루 여부)가 달라져야 하면 세션을 다시 연다(1102.s). 메뉴 누르기(select)는 사용자 동작으로 쳐서 바로 새 세션을 청할 수 있다.
  // 청이 거절되면(브라우저 정책) 웹 화면에 안내를 띄운다
  X.setMode = m => { const needAR = m === 'fig' && X.support.ar && Q.get('xrsession') !== 'vr'; if (S.session && m !== 'web' && needAR !== !!S.ar) { swapSession(m); return; }
    fade(() => { if (m === 'vr' && S.mode === 'fig') { setMode('vr'); placeFromDesktop(); } else setMode(m); }); };
  function swapSession(m) { S.swapTo = m; const s = S.session; log('세션 바꾸기', S.sessionMode, '→', m); try { s.end(); } catch (e) { S.swapTo = null; } }
  X.goLevel = goLevel; X.stepFloor = stepFloor; X.goOutside = goOutside; X.goInside = goInside; X.outsideSpot = outsideSpot; X.arc = arc; X.teleportTo = teleportTo; X.jumpTo = (pt, yaw) => jump(() => teleportTo(pt, yaw), true); X.pickables = pickables; X.visibleForPick = visibleForPick;
  X.firstSolid = firstSolid; X.ctrls = ctrls; X.store = store; X.hooks = []; X.floorY = floorY; X.sortedLevels = sortedLevels;
  // 다른 사람 곁으로 가기(멀티플레이 모이기): li 는 그 사람이 있는 층(밖이면 -1)
  X.goTo = (pt, yaw, li) => jump(() => {
    if (li >= 0 && K.full && K.LEVELS[li]) { if (!K.I.on) K.enterInt(); if (K.I.doll) K.setDoll(false); if (K.I.li !== li) K.placeLevel(li, true); wingTarget(); placeUser(V(pt.x, floorY(K.LEVELS[li]), pt.z), yaw); }
    else { if (K.I && K.I.on) K.exitInt(); wingTarget(); placeUser(V(pt.x, pt.y, pt.z), yaw); }
    afterChange();
  });

  /* ================= 11. 최적화 프록시 =================
     XR 동안만 같은 재질 메시를 합친 대체 메시를 쓰고 원본은 숨긴다. 원본이 장면을 바꾸면 다시 만든다. */
  // 원본의 '항상 맨 앞' 표시(실내 높이 치수 빨간 선, 윤곽선 등: depthTest 꺼짐)는 그리는 순서에 따라 나중에 그린 물체에
  // 덮인다. XR 동안은 반투명 목록의 맨 끝(renderOrder 크게)으로 보내 무엇이든 그 위에 그려지게 하고, 끝나면 원복
  const OnTop = X.ontop = {
    done: new Map(), t: 0,
    is(o) { const m = Array.isArray(o.material) ? o.material[0] : o.material; return !!m && m.depthTest === false && !o.userData.khxr; },
    apply(time, force) {
      if (!force && time - this.t < 500) return; this.t = time; let changed = false;
      (function walk(o) {
        if (o === rig || o.userData.khxr) return;
        if ((o.isMesh || o.isLine || o.isSprite || o.isPoints) && OnTop.is(o) && !OnTop.done.has(o)) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          OnTop.done.set(o, { ro: o.renderOrder, tr: ms.map(m => m.transparent) });
          o.renderOrder = 900 + Math.min(99, o.renderOrder || 0); ms.forEach(m => { if (!m.transparent) { m.transparent = true; m.needsUpdate = true; } }); changed = true;
        }
        for (const c of o.children) walk(c);
      })(scene);
      if (changed && S.opt) Opt.dirty();     // 병합 열쇠에 순서가 들어가므로 다시 합침(맨 앞 요소끼리 한 덩어리, 맨 끝에)
    },
    clear() { this.done.forEach((v, o) => { o.renderOrder = v.ro; (Array.isArray(o.material) ? o.material : [o.material]).forEach((m, i) => { if (m.transparent !== v.tr[i]) { m.transparent = v.tr[i]; m.needsUpdate = true; } }); }); this.done.clear(); this.t = 0; }
  };
  const Opt = X.opt = {
    group: null, hidden: [], sig: '', t: 0, stat: null, need: false, roots: null, until: 0, nBuild: 0, msTotal: 0, ui: false, hold: 0, checkMs: 0,
    // withHidden: 합치느라 숨긴 원본도 보이는 것으로 친다(예전에는 점검 때마다 원본을 다 보였다 다시 숨겼다)
    visibleMeshes(withHidden) {
      const hs = withHidden ? this.hiddenSet : null;
      // 화면 합치기(VR 밖, screenOn)는 실사 3D 계층이 정한 묶음만 훑는다. Wing 의 가림 상자(userData.box)는 Wing 이 매 프레임 표시를 바꾸므로 합치지 않는다
      const out = [], scr = this.screen(), seen = scr ? new Set() : null, dyn = this.dynOf = new Map(), masses = [];
      // 지니 모델이 붙은 매스(1102.l): 바깥 보기에서는 모델(자식)도 다른 건물과 합친다. Wing 가림(OCC)이 이 매스를 숨겼다 보였다 해도
      // 다시 합치지 않도록(1102.m: 합친 메시가 가림을 따라가지 못해 우리 건물 앞에 남았다) 숨김과 상관없이 훑고, 합친 메시에서 그 매스의 꼭짓점 구간을 뺀다(dynTick)
      const walk = (o, d) => {
        const envBox = scr && o.userData.box && o.userData.box.isBox3 && o.userData.khEnv;
        if ((!o.visible && !envBox && !(hs && hs.has(o))) || o === rig || o === Opt.group || o.userData.khxr) return;
        if (scr && o.userData.box && o.userData.box.isBox3) { if (envBox && !(K.I && K.I.on) && masses.length < 32) { masses.push(o); for (const c of o.children) walk(c, masses.length); } return; }
        if ((o.isMesh || o.isLineSegments) && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position && (!o.isInstancedMesh || Opt.instOk(o)) && !(seen && seen.has(o))) { out.push(o); if (seen) seen.add(o); if (d) dyn.set(o, d); }
        for (const c of o.children) walk(c, d);
      };
      this.dynMasses = masses;
      if (scr) { for (const r of this.roots()) if (r && inScene(r) && visibleChain(r)) walk(r); } else walk(scene);
      return out;
    },
    screen() { return !!this.roots && !S.session; },
    // 그릴 조각: 일반 메시, 선분, 재질이 여러 개인 메시는 그룹별로 나눈 조각
    parts(list) {
      const out = [];
      for (const o of list) {
        const kind = o.isLineSegments ? 'L' : 'M';
        if (Array.isArray(o.material)) {
          const gs = o.geometry.groups && o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
          gs.forEach(gr => { const m = o.material[gr.materialIndex]; if (m && m.visible !== false) out.push({ o, m, kind, gr, multi: true }); });
        } else if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) out.push({ o, m: o.material, kind, gr: null, multi: false, inst: i }); }
        else if (o.material && o.material.visible !== false) out.push({ o, m: o.material, kind, gr: null, multi: false });
      }
      return out;
    },
    sigOf(list) {   // 메시 집합 + 재질 교체 + 색 변경(원본의 색상 견본은 메시를 다시 만들지 않음)까지 감지
      let h = list.length;
      for (const m of list) { h = (h * 31 + m.id) | 0; for (const a of (Array.isArray(m.material) ? m.material : [m.material])) { if (!a) continue; h = (h * 31 + a.id) | 0; if (a.color) h = (h * 31 + a.color.getHex()) | 0; h = (h * 31 + Math.round((a.opacity == null ? 1 : a.opacity) * 100)) | 0; } }
      return h + ':' + list.length;
    },
    // 묶음 열쇠: 텍스처가 없는 단색 재질은 색을 꼭짓점 색으로 구워 같은 성질(거칠기·금속성 등)끼리 한 번에 그린다
    texKey(a) { return ['map', 'emissiveMap', 'envMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'aoMap', 'lightMap'].map(k => a[k] ? a[k].uuid : '').join(','); },
    // 텍스처 없는 단색 묶음(VC)의 거칠기·금속성 단계: 실사 3D 를 켠 VR 외관 그리기 호출이 200 상한에 붙어 있어(T14) 0.25 → 0.5(거칠기), 2단계(금속성)로 넓혔다.
    // 단색 면은 반사 차이가 작아 눈에 덜 띈다. 값은 상수로 둔다(실기기에서 차이가 보이면 0.25 로 되돌림)
    VCQ: { rough: 0.5, metal: 1 },
    keyOf(pt) {
      const q4 = v => (Math.round((v || 0) * 4) / 4).toFixed(2);   // 거칠기·금속성은 0.25 단위로 묶음
      const a = pt.m, o = pt.o, hx = c => (c && c.getHexString ? c.getHexString() : '');
      const va = !!(a.userData && a.userData.khAtlas), bake = va || (!a.map && !a.vertexColors && !!a.color && !a.isLineDashedMaterial);   // va: 지니 아틀라스 대리 재질(1102.r) = 색·칸 번호를 꼭짓점에 구워 같은 아틀라스끼리
      const qv = (v, st) => (Math.round((v || 0) / st) * st).toFixed(2), qr = bake ? v => qv(v, this.VCQ.rough) : q4, qm = bake ? v => qv(v, this.VCQ.metal) : q4;
      // 단색 묶음은 텍스처 좌표(uv)를 쓰지 않으므로 uv 유무로 나누지 않는다(합칠 때 없는 쪽은 0 으로 채움)
      const attrs = Object.keys(o.geometry.attributes).filter(k => !(bake && ((k === 'uv' && !va) || k === 'uv2'))).sort().join(',');   // uv2: 지니 모델 라이트맵 좌표(단색 묶음은 안 씀, 1102.l)
      return [pt.kind, a.type, va ? 'VA' : bake ? 'VC' : a.uuid, hx(a.emissive), +(a.emissiveIntensity || 0).toFixed(2), this.texKey(a), a.transparent, +(a.opacity == null ? 1 : a.opacity).toFixed(2), a.side,
        qr(a.roughness), qm(a.metalness), a.depthWrite, a.depthTest, a.wireframe, (a.clippingPlanes || []).length, a.linewidth,
        attrs, o.castShadow, o.receiveShadow, o.renderOrder, a.polygonOffset, a.polygonOffsetFactor].join('|');   // 그림자 드리우기·받기가 다른 메시는 섞지 않음(자기 그림자 얼룩 방지)
    },
    // 인스턴스 메시(가구 등)는 인스턴스마다 펼쳐 같은 재질끼리 합친다. 너무 크거나 인스턴스 색·여러 재질이면 그대로 둔다
    instOk(o) { return !o.instanceColor && !Array.isArray(o.material) && o.material && o.material.visible !== false && o.count * o.geometry.attributes.position.count <= 400000; },
    piece(pt, cache) {
      if (pt.inst != null) {
        const g = pt.o.geometry.index ? pt.o.geometry.toNonIndexed() : pt.o.geometry.clone(), m = new T.Matrix4();
        pt.o.getMatrixAt(pt.inst, m); g.applyMatrix4(m.premultiply(pt.o.matrixWorld)); return g;
      }
      let g = cache.get(pt.o);
      if (!g) { g = pt.o.geometry.index ? pt.o.geometry.toNonIndexed() : pt.o.geometry.clone(); g.applyMatrix4(pt.o.matrixWorld); cache.set(pt.o, g); }
      if (!pt.gr) return g;
      const n = g.attributes.position.count, st = Math.max(0, pt.gr.start), en = Math.min(n, st + pt.gr.count), out = new T.BufferGeometry();
      for (const k in g.attributes) { const at = g.attributes[k], sz = at.itemSize; out.setAttribute(k, new T.BufferAttribute(at.array.slice(st * sz, en * sz), sz, at.normalized)); }
      return out;
    },
    merge(pts, bake, cache) {
      const geos = pts.map(pt => this.piece(pt, cache)), names = Object.keys(geos[0].attributes);
      let total = 0; geos.forEach(g => { total += g.attributes.position.count; });
      const out = new T.BufferGeometry();
      for (const n of names) {
        const a0 = geos[0].attributes[n], arr = new a0.array.constructor(total * a0.itemSize);
        let off = 0; for (const g of geos) { const src = g.attributes[n]; if (src) arr.set(src.array, off); off += g.attributes.position.count * a0.itemSize; }
        out.setAttribute(n, new T.BufferAttribute(arr, a0.itemSize, a0.normalized));
      }
      if (pts.some(pt => this.dynOf.has(pt.o))) {   // 가림 매스별 꼭짓점 구간 [매스 번호(1부터, 0 = 가림 없음), 시작, 개수]. 조각 순서는 그대로(바꾸면 땅과 겹친 면의 앞뒤가 달라진다)
        const rs = []; let off = 0;
        pts.forEach((pt, i) => { const d = this.dynOf.get(pt.o) || 0, n = geos[i].attributes.position.count, l = rs[rs.length - 1]; if (l && l[0] === d) l[2] += n; else rs.push([d, off, n]); off += n; });
        out.userData.khr = rs;
      }
      if (bake) {
        const col = new Float32Array(total * 3); let off = 0;
        pts.forEach((pt, i) => { const c = pt.m.color, n = geos[i].attributes.position.count; for (let k = 0; k < n; k++) { col[off++] = c.r; col[off++] = c.g; col[off++] = c.b; } });
        out.setAttribute('color', new T.BufferAttribute(col, 3));
        if (pts[0].m.userData.khAtlas) {   // 아틀라스 칸(열, 행)
          const tl = new Float32Array(total * 2); let o2 = 0;
          pts.forEach((pt, i) => { const c = pt.m.userData.khAtlas || [0, 0], n = geos[i].attributes.position.count; for (let k = 0; k < n; k++) { tl[o2++] = c[0]; tl[o2++] = c[1]; } });
          out.setAttribute('khTile', new T.BufferAttribute(tl, 2));
        }
      }
      geos.forEach(g => { if (!cache.has(g)) g.dispose(); });
      out.computeBoundingSphere(); return out;
    },
    build() {
      if (S.session) OnTop.apply(performance.now(), true);   // 1102.r: 맨 앞 요소 정리(0.5초마다)가 합친 뒤에 바뀌어 층 이동마다 합치기가 두 번 일어났다. 합치기 전에 먼저
      this.clear();
      scene.updateMatrixWorld(true);
      const t0 = performance.now(), objs = this.visibleMeshes(), dynM = this.dynMasses, dynObjs = [], under = this.underground(objs), pts = this.parts(under.size ? objs.filter(o => !under.has(o)) : objs), buckets = new Map(), cache = new Map();
      for (const pt of pts) { const k = this.keyOf(pt); (buckets.get(k) || buckets.set(k, []).get(k)).push(pt); }
      const grp = new T.Group(); grp.name = 'khxr-proxy'; grp.userData.khxr = true;
      this.mats = this.mats || [];
      const merged = new Set();
      // 재질이 여러 개인 메시는 일부 조각만 합치면 나머지가 사라지므로, 조각이 속한 묶음은 크기와 상관없이 모두 만든다
      const multiObjs = new Set(pts.filter(p => p.multi).map(p => p.o));
      for (const [k, list] of buckets) {
        const bake = k.split('|')[2] === 'VC' || k.split('|')[2] === 'VA';
        const must = list.some(p => multiObjs.has(p.o));
        if (list.length < 2 && !bake && !must) continue;
        let mat = list[0].m;
        const dyn = list.some(p => this.dynOf.has(p.o));
        // 반투명을 한 덩어리로 합치면 three 의 물체 단위 정렬(뒤→앞)이 깨진다. 깊이를 쓰면 먼저 그린 가까운 면이
        // 뒤의 반투명(벽 표시·유리 너머 요소)을 지워 버리므로, 합친 반투명은 깊이를 쓰지 않게(XR 동안만, 끝나면 원복)
        if (mat.transparent && mat.depthWrite && !bake) { this.dw = this.dw || new Set(); this.dw.add(mat); mat.depthWrite = false; }
        if (bake) { const f = k.split('|'); mat = mat.clone(); mat.color.setRGB(1, 1, 1); mat.vertexColors = true; if ('roughness' in mat) { mat.roughness = +f[9]; mat.metalness = +f[10]; } if (mat.transparent) mat.depthWrite = false; mat.needsUpdate = true; this.mats.push(mat); }
        if (dyn && bake) this.dynMat(mat, list[0].m);
        if (mat.userData.khAtlas) this.vraMat(mat);
        const geo = this.merge(list, bake, cache);
        const obj = list[0].kind === 'L' ? new T.LineSegments(geo, mat) : new T.Mesh(geo, mat);
        obj.castShadow = list[0].o.castShadow; obj.receiveShadow = list[0].o.receiveShadow; obj.renderOrder = list[0].o.renderOrder;
        obj.matrixAutoUpdate = false; grp.add(obj);
        if (dyn) dynObjs.push(obj);
        { let r = list[0].o; while (r.parent && r.parent !== scene) r = r.parent; obj.userData.khRoot = (r.name || r.type) + (list[0].o.userData.khEnv || (r !== list[0].o && list.some(p => { for (let q = p.o; q; q = q.parent) if (q.userData.khEnv) return true; return false; })) ? '+env' : ''); }   // 진단: 이 묶음의 첫 조각이 속한 장면 최상위 묶음(최적화 5번 그리기 수 분석)
        list.forEach(p => merged.add(p.o));
      }
      cache.forEach(g => g.dispose());
      merged.forEach(o => { o.visible = false; this.hidden.push(o); });
      under.forEach(o => { o.visible = false; this.hidden.push(o); });
      this.hiddenSet = new Set(this.hidden);
      this.dynM = dynM; this.dynObjs = dynObjs; this.dynMask = '';
      scene.add(grp); this.group = grp; this.sig = this.sigOf(objs) + ':' + this.cullUnder();
      this.stat = { objects: objs.length, parts: pts.length, groups: grp.children.length, under: under.size, ms: Math.round(performance.now() - t0) };
      this.nBuild++; this.msTotal += this.stat.ms; this.stat.n = this.nBuild; this.stat.total = this.msTotal;
      R.shadowMap.needsUpdate = true;
      log('최적화', JSON.stringify(this.stat));
    },
    // 가림 매스(1102.m): 단색 묶음 복제 재질에 원래 재질의 셰이더 손질(지니 라이트맵 khPatch, 복제하면 빠진다)을 잇는다
    dynM: [], dynObjs: [], dynMask: '',
    // 지니 아틀라스 묶음(1102.r): 꼭짓점의 칸 번호(khTile)로 아틀라스 안 칸을 찾고, 반복 좌표는 fract 로 칸 안에 접는다.
    // 밉맵은 원래 uv 의 기울기로 고르되(fract 이음매에서 밉맵이 튀지 않게) 칸 둘레(16화소)를 넘지 않게 4단까지만
    vraMat(mat) {
      const A = mat.userData.khVra, ob = mat.onBeforeCompile, ck = mat.customProgramCacheKey;
      mat.onBeforeCompile = (sh, r) => { if (ob) ob.call(mat, sh, r);
        sh.vertexShader = 'attribute vec2 khTile;\nvarying vec2 vKhTile;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvKhTile = khTile;');
        sh.fragmentShader = 'varying vec2 vKhTile;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
  vec2 khQ = fract(vUv), khS = vec2(${(A.tile - 2 * A.pad).toFixed(1)}) / vec2(${A.w.toFixed(1)}, ${A.h.toFixed(1)});
  vec2 khUV = (vKhTile * ${A.tile.toFixed(1)} + ${A.pad.toFixed(1)}) / vec2(${A.w.toFixed(1)}, ${A.h.toFixed(1)}) + khQ * khS;
  vec2 khDx = dFdx(vUv) * khS, khDy = dFdy(vUv) * khS; float khF = max(length(khDx * vec2(${A.w.toFixed(1)}, ${A.h.toFixed(1)})), length(khDy * vec2(${A.w.toFixed(1)}, ${A.h.toFixed(1)})));
  if (khF > 16.0) { khDx *= 16.0 / khF; khDy *= 16.0 / khF; }
  #if __VERSION__ >= 300
  vec4 texelColor = textureGrad(map, khUV, khDx, khDy);
  #else
  vec4 texelColor = texture2D(map, khUV);
  #endif
  texelColor = mapTexelToLinear(texelColor);
  diffuseColor *= texelColor;
#endif`); };
      mat.customProgramCacheKey = () => (ck ? ck.call(mat) : '') + '|vra';
      mat.needsUpdate = true;
    },
    dynMat(mat, src) { const ob = src.onBeforeCompile, ck = src.customProgramCacheKey; mat.onBeforeCompile = (sh, r) => ob.call(src, sh, r); mat.customProgramCacheKey = () => ck.call(src); mat.needsUpdate = true; },
    // 매 프레임(Wing 가림 처리 뒤, 그리기 전): 가림 매스 표시가 바뀌었을 때만 합친 메시의 인덱스를 보이는 매스 구간으로 다시 만든다.
    // 셰이더로 숨기면 후처리(SSAO 등 덮어쓰기 재질)·그림자에 숨긴 건물이 남으므로 꼭짓점 자체를 뺀다(바뀔 때 1ms 안팎)
    dynTick() {
      if (!this.dynObjs.length) return; const vis = this.dynM.map(m => visibleChain(m)), mask = vis.map(v => v ? 1 : 0).join(''); if (mask === this.dynMask) return; this.dynMask = mask;
      this.dynApply(vis);
    },
    dynApply(vis) {
      for (const o of this.dynObjs) {
        const g = o.geometry, rs = g.userData.khr, on = rs.filter(r => !r[0] || vis[r[0] - 1]);
        const n = on.reduce((s, r) => s + r[2], 0); o.visible = n > 0; if (!n) continue;
        // 인덱스는 메시마다 한 벌(전체 크기)을 두고 앞쪽만 채워 그리는 범위를 줄인다(바꿀 때마다 새 버퍼를 만들면 GPU 버퍼가 쌓인다)
        if (!g.index) { if (on.length === rs.length) continue; g.setIndex(new T.BufferAttribute(new Uint32Array(g.attributes.position.count), 1)); }
        const ix = g.index.array; let k = 0; for (const r of on) for (let i = 0; i < r[2]; i++) ix[k++] = r[1] + i; g.index.needsUpdate = true; g.setDrawRange(0, k);
      }
    },
    // 그림자 그리기 동안만 Wing 가림이 숨긴 매스 구간을 되살린다(1102.o, 실사 3D 의 shadowWrap 이 부름). 시대·미성 토글 등으로 묶음째 숨긴 매스는 그대로 뺀다.
    // 되돌리는 함수를 돌려준다
    dynAll() {
      if (!this.dynObjs || !this.dynObjs.length) return null;
      const occ = m => !m.visible && !m.userData.khHide && !m.userData.khDropped && (!m.parent || visibleChain(m.parent));
      const vis = this.dynM.map(m => visibleChain(m) || occ(m)), mask = vis.map(v => v ? 1 : 0).join('');
      if (mask === this.dynMask) return null;
      this.dynApply(vis);
      return () => this.dynApply(this.dynM.map(m => visibleChain(m)));
    },
    clear() {
      this.hidden.forEach(m => { m.visible = true; }); this.hidden = []; this.hiddenSet = null; this.sig = '';
      if (this.group) { this.group.children.forEach(c => c.geometry.dispose()); scene.remove(this.group); this.group = null; }
      (this.mats || []).forEach(m => m.dispose()); this.mats = [];
      if (this.dw) { this.dw.forEach(m => { m.depthWrite = true; }); this.dw.clear(); }
    },
    // VR 에서는 0.15초 안에 들어온 요청을 모아 한 번만 합친다(1102.k: 층 이동 한 번에 같은 구성으로 연달아 두 번 합쳐 퀘스트에서 끊겼다)
    dirty() { if (!this.need) this.due = performance.now() + (S.session ? 150 : 0); this.need = true; },
    // 몰입 VR에서 건물 밖이고 '지하 보기'가 꺼져 있으면 땅 아래에 완전히 묻힌 메시는 보이지 않으므로 합치지도 그리지도 않는다
    cullUnder() { return S.mode === 'vr' && !(K.I && K.I.on) && !(document.getElementById('t-b1') || {}).checked && rigHeadWorld().y > -0.5; },
    underground(objs) {
      const out = new Set(); if (!this.cullUnder()) return out;
      const b = new T.Box3();
      const bi = new T.Box3(), m = new T.Matrix4();
      for (const o of objs) {
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
        if (o.isInstancedMesh) { b.makeEmpty(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); b.union(bi.copy(g.boundingBox).applyMatrix4(m.premultiply(o.matrixWorld))); } }
        else b.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
        if (b.max.y < -1.2) out.add(o);   // 1102.s: 지니 압구정로 단차(차도 −0.30～−0.45)가 −0.3 기준에 걸려 VR 에서 도로·바닥이 통째로 사라졌다(Jack: 주변이 안 보임). 지하층은 −3.3 부터라 −1.2 로
      }
      return out;
    },
    // 장면 구성 점검: VR 세션은 0.5초마다. 화면(1102.k, Wing 윈도우 PC 끊김)은 메시 수천 개를 훑는 서명 계산이 0.5초마다 끊김을 만들어
    // 바뀜 알림(dirty·pause, 화면 조작 이벤트 ui)이 있을 때와 5초마다의 안전 점검만 한다
    check(time) {
      const scr = this.screen();
      if (this.need && this.due && performance.now() < this.due) return;
      if (!this.need && (scr ? !this.ui && time - this.t < 5000 : time - this.t < 500)) return;
      // VR: 지니 주변 모델을 받는 중이거나 걷는 중이면 구성 점검을 미룬다(모델이 하나씩 붙을 때마다 다시 합쳐 끊기지 않게, 1102.l). 끝나면 다음 점검에서 한 번
      if (!scr && !this.need && ((window.KHENV && KHENV.busy) || S.moving)) return;
      this.t = time; this.ui = false;
      if (this.need) { this.need = false; this.build(); return; }
      const t0 = performance.now(), sig = this.sigOf(this.visibleMeshes(true)) + ':' + this.cullUnder(); this.checkMs = Math.round((performance.now() - t0) * 10) / 10;
      if (sig !== this.sig) this.build();
    },
    /* 화면(데스크톱·휴대폰·퀘스트 2D 브라우저) 합치기: 실사 3D 계층이 켠다. roots() = 합칠 묶음 목록.
       VR 세션이 시작되면 세션용 합치기(장면 전체)가 대신하고, 끝나면 다시 화면 합치기로 돌아온다 */
    screenOn(roots) { this.roots = roots; this.need = true;
      if (!this.uiL) { this.uiL = () => { this.ui = true; }; ['change', 'input', 'click'].forEach(e => document.addEventListener(e, this.uiL, true)); } },
    screenOff() { if (!this.roots) return; this.roots = null; if (!S.session) this.clear(); },
    // 장면이 바뀌는 중에는 합친 메시를 걷고(원본이 그대로 보임) ms 동안 바뀜이 없으면 다시 합친다
    pause(ms) { if (!this.screen() || this.busy) return; if (this.group) this.clear(); this.until = performance.now() + (ms || 400); this.need = true; },
    // hold: 실사 3D 가 받는 중(로딩 단계)이면 그 시각을 넣어 둔다. 끝날 때까지(최대 10초) 다시 합치지 않는다
    screenTick(time) { if (!this.screen() || this.busy || time < this.until || (this.hold && time - this.hold < 10000)) return; this.check(time); },
    // 원본 그대로 그려야 하는 순간(유리 반사 지도 등): 합친 메시를 숨기고 원본을 보이게 한 채 fn 실행
    bare(fn) {
      const g = this.group; if (!g || !this.screen()) return fn();
      g.visible = false; this.hidden.forEach(m => { m.visible = true; }); this.busy = true;
      try { return fn(); } finally { this.busy = false; this.hidden.forEach(m => { m.visible = false; }); g.visible = true; }
    }
  };
  function inScene(o) { for (; o; o = o.parent) if (o === scene) return true; return false; }

  /* ================= 12. 메뉴(공간 UI) ================= */
  const UI = X.ui = (function () {
    // 메뉴 캔버스: 왼쪽 세로 탭 레일 + 오른쪽 스크롤 본문. 컨트롤러는 1.25m 곡면(약 72°), 핸드는 0.48m 평면(검지로 누름)
    const W = 1728, H = 900, RAIL = 216, CX = 240, CY = 104, CW = W - CX - 56, CH = H - CY - 52;
    const CURVE = { r: 1.25, a: 72 * Math.PI / 180 }, FLAT = { w: 0.70, d: 0.48 };
    const isHov = k => !!hover && (hover === k || hover.split('|').includes(k));
    let cv, g, tex, panel, panelC, panelF, open = false, cells = [], hover = '', tab = 0, toastMsg = '', toastT = 0, dirtyFlag = true, lastDraw = 0, soon = 0;
    const scroll = {}; let contentH = 0; const thumbs = new Map();
    let cycleTarget = null;    // 조합 넘기기 대상 {name, mode}
    let qcv, qg, qtex, quick, qcells = [];
    const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    function init() {
      cv = document.createElement('canvas'); cv.width = W; cv.height = H; g = cv.getContext('2d');
      tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
      const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: T.DoubleSide });
      const ch = CURVE.r * CURVE.a * H / W, cg = new T.CylinderGeometry(CURVE.r, CURVE.r, ch, 48, 1, true, Math.PI - CURVE.a / 2, CURVE.a);
      const uv = cg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));   // 안쪽에서 볼 때 좌우가 맞게
      panelC = new T.Mesh(cg, mat); panelC.userData.curve = { r: CURVE.r, a: CURVE.a, h: ch };
      panelF = new T.Mesh(new T.PlaneGeometry(FLAT.w, FLAT.w * H / W), mat);
      [panelC, panelF].forEach(m => { m.renderOrder = 1001; m.visible = false; m.userData.khxr = true; m.name = 'khxr-menu'; });
      panel = panelC;
      // 창 손잡이: 아래 가운데 막대(잡고 옮기기), 아래 양 모서리(잡고 크기). 판의 자식이라 크기·위치를 따라감
      const hcv = document.createElement('canvas'); hcv.width = 256; hcv.height = 64; const hg = hcv.getContext('2d');
      hg.fillStyle = '#fff'; hg.beginPath(); hg.roundRect ? hg.roundRect(8, 16, 240, 32, 16) : hg.rect(8, 16, 240, 32); hg.fill();
      const ccv = document.createElement('canvas'); ccv.width = 64; ccv.height = 64; const cg2 = ccv.getContext('2d');
      cg2.strokeStyle = '#fff'; cg2.lineWidth = 12; cg2.lineCap = 'round'; cg2.beginPath(); cg2.moveTo(10, 8); cg2.lineTo(10, 54); cg2.lineTo(56, 54); cg2.stroke();
      const hm = (tx, w, h) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: new T.CanvasTexture(tx), transparent: true, opacity: 0.55, depthTest: false, side: T.DoubleSide })); m.renderOrder = 1002; m.userData.khxr = true; return m; };
      for (const P of [panelC, panelF]) {
        const bar = hm(hcv, 0.2, 0.05); bar.userData.win = 'bar';
        const cl = hm(ccv, 0.07, 0.07); cl.userData.win = 'cl';
        const cr = hm(ccv, 0.07, 0.07); cr.userData.win = 'cr'; cr.scale.x = -1;
        P.add(bar, cl, cr); P.userData.ctl = [bar, cl, cr];
        const C = P.userData.curve, hh = C ? C.h / 2 : P.geometry.parameters.height / 2;
        if (C) { bar.position.set(0, -hh - 0.045, -C.r); [[cl, -1], [cr, 1]].forEach(([m, sg]) => { const th = Math.PI - sg * C.a / 2; m.position.set(C.r * Math.sin(th) * 0.995, -hh - 0.02, C.r * Math.cos(th) * 0.995); m.rotation.y = th - Math.PI; }); }
        else { const hw = P.geometry.parameters.width / 2; bar.position.set(0, -hh - 0.045, 0.002); cl.position.set(-hw - 0.01, -hh - 0.02, 0.002); cr.position.set(hw + 0.01, -hh - 0.02, 0.002); }
      }
      qcv = document.createElement('canvas'); qcv.width = 512; qcv.height = 320; qg = qcv.getContext('2d');
      qtex = new T.CanvasTexture(qcv);
      quick = new T.Mesh(new T.PlaneGeometry(0.2, 0.125), new T.MeshBasicMaterial({ map: qtex, transparent: true, depthTest: false, side: T.DoubleSide }));
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
          { h: S.mode === 'fig' ? '모형 범위' : '', items: S.mode === 'fig' ? CROPS.map(([r, t]) => ({ key: 'crop:' + r, label: t, on: () => S.fig.crop === r, act: () => { S.fig.crop = r; Fig.saveAnchor(); } })).concat([{ key: 'fig:place', label: '다시 놓기 (책상 찾기)', act: () => Fig.place() }]) : [] },
          { h: '시점', items: buttons('.views [data-v]').filter(b => b.key !== 'b:v-int').map(b => Object.assign(b, { act: (el => () => goView(el))(document.getElementById(b.key.slice(2))) })) },
          { h: '층', items: levels },
          { h: '', items: [{ key: 'x:out', label: inside ? '건물 밖으로' : '건물 안으로 (1층)', act: () => inside ? goOutside() : goInside() }] },
          { h: inside || S.mode !== 'vr' ? '' : '출입구 바로가기', items: inside || S.mode !== 'vr' ? [] : (Hot.list || []).map((h, i) => ({ key: 'hotm:' + i, label: h.name, act: () => { closeMenu(); Hot.go(i); } })) },
          { h: '내부 시점', items: inside ? buttons('[data-c],[data-w]') : [] }] },
        { t: '외관', sec: [
          { h: '추천 시안', items: radios('dsg', 'preset') }, { h: '시안 색상', items: swatches('sw-dsg') },
          { h: '마감재', items: radios('cfin', 'combo') }, { h: '마감재 색상', items: swatches('sw-fin') },
          { h: '입면 형태', items: radios('form', 'combo') }, { h: '창 크기', items: radios('win') }] },
        { t: '실내', sec: [
          { h: '1층 안', items: radios('g1') }, { h: '1층 옵션', items: checks($$('#sec-g1 input[type=checkbox]').map(i => i.id)) },
          { h: '주차 방식', items: radios('sch') }, { h: '최상층', items: checks(['t-use7', 't-nost']) },   // 1102.s: 6·7층 분리 임대(VR 기능 대응표)
          { h: '내부 표시', items: inside ? buttons('[data-iv]') : [] }] },
        { t: '빛과 시간', sec: [
          { h: '보기 방식', items: radios('vmode').filter(i => !/photo/.test(i.key)).sort((a, b) => /:real$/.test(b.key) - /:real$/.test(a.key)) },   // 실사 3D('렌더', vm-real)를 맨 앞에(1102.e, 1102.s)
          { h: '시간대', items: radios('tod') }, { h: '계절', items: radios('season') },
          { h: '시각 (적용 버튼으로 반영)', items: range('sun-hour', v => (v | 0) + '시', [7, 9, 12, 15, 17, 19]).concat(buttons('#sun-apply'), buttons('#sun-today'), buttons('#sun-play')) },   // 1102.s: 오늘·하루 재생도(VR 기능 대응표)
          { h: '조명', items: checks(['t-citylights']) }] },
        { t: '보기', sec: [
          { h: '현황과 신축', items: radios('era') }, { h: '미성아파트 일대', items: radios('ms') }, { h: '겹쳐 보기', items: radios('mixq') },
          { h: '주변', items: checks(['t-city', 't-ctx', 't-b1', 't-limits', 't-frame']) },
          { h: '단면', items: inside ? buttons('#secBtn,#secAllBtn') : [] },
          { h: '실사 사진', items: Photo.items() }] },
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
        { h: '걷기 속도', items: [[1.6, '느리게'], [2.6, '보통'], [3.6, '빠르게']].map(([v, t]) => ({ key: 'set:walk' + v, label: t + ' (초당 ' + v + 'm)', on: () => Math.abs(S.walkSpeed - v) < 0.05, act: () => { S.walkSpeed = v; store.set('walkSpeed', v); } })) },
        { h: '편안함', items: [{ key: 'set:vig', label: '이동 중 시야 가장자리 어둡게', check: true, on: () => S.vignette, act: () => { S.vignette = !S.vignette; store.set('vignette', S.vignette); } }] },
        { h: '메뉴', items: [{ key: 'set:mass', label: '매스 조정 보이기', check: true, on: () => S.showMass, act: () => { S.showMass = !S.showMass; store.set('showMass', S.showMass); } }, { key: 'set:help', label: '조작 안내 보기', act: () => Help.show(true) }] },
        { h: '성능', items: [{ key: 'set:opt', label: '메시 합치기 최적화', check: true, on: () => S.opt, act: () => { S.opt = !S.opt; if (S.opt) Opt.build(); else Opt.clear(); } }] },
        { h: Q.get('xrdebug') ? '로그' : '', items: Q.get('xrdebug') ? X.log.slice(-6).map((l, k) => ({ key: 'log' + k, label: l.slice(0, 40) })) : [] }] });
      if (X.mp && X.mp.joined) T0.push({ t: '함께', sec: X.mp.menu() });
      return T0;
    }
    /* ----- 그리기 ----- */
    function fit(t, w, size, weight) {
      let s = size; g.font = weight + ' ' + s + 'px ' + FONT;
      while (s > 15 && g.measureText(t).width > w) { s--; g.font = weight + ' ' + s + 'px ' + FONT; }
      if (g.measureText(t).width > w) { while (t.length > 1 && g.measureText(t + '…').width > w) t = t.slice(0, -1); t += '…'; }
      return t;
    }
    // 시안 사진 썸네일(원본 사진 저장소). 불러오면 다시 그림
    function thumbOf(kind, v) {
      const m = Photo.man(); if (!m || !m.ext) return null;
      const d = (m.ext[kind] || {})[v]; if (!d || !d.img) return null;
      const p = d.img['045'] || Object.values(d.img)[0]; if (!p) return null;
      const url = Photo.url(p); let t = thumbs.get(url);
      if (!t) { t = new Image(); t.crossOrigin = 'anonymous'; t.onload = () => { dirtyFlag = true; }; t.src = url; thumbs.set(url, t); }
      return t;
    }
    function sunSlider() {
      const el = document.getElementById('sun-hour'); if (!el || el.closest('[hidden]')) return [];
      const min = +el.min || 5, max = +el.max || 20, step = +el.step || 0.5;
      return [{ key: 'sl:sun-hour', slider: true, label: '시각', min, max, step, get: () => +el.value,
        set: v => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); },
        commit: () => { el.dispatchEvent(new Event('change', { bubbles: true })); const b = document.getElementById('sun-apply'); if (b && !b.disabled) b.click(); },
        fmt: v => { const h = Math.floor(v), mm = Math.round((v - h) * 60); return h + '시' + (mm ? ' ' + mm + '분' : ''); } }];
    }
    // 탭마다 본문 배치(본문 좌표). 반환: {cells, heads, h}
    function layout(tb) {
      const hand = S.input === 'hand', gap = hand ? 30 : 16, out = [], heads = [];
      let y = 8;
      const head = (t, x = 0) => { if (t) { heads.push({ t, x, y }); y += 44; } };
      const grid = (items, cols, ch, x0 = 0, w = CW) => {
        if (!items.length) return; const cw = (w - gap * (cols - 1)) / cols;
        items.forEach((it, k) => { const c = k % cols, r = (k / cols) | 0; out.push(Object.assign({ x: x0 + c * (cw + gap), y: y + r * (ch + gap), w: cw, h: ch }, it)); });
        y += Math.ceil(items.length / cols) * (ch + gap) + 14;
      };
      const seg = items => { if (!items.length) return; const n = items.length, cw = (CW - gap * (n - 1)) / n; items.forEach((it, k) => out.push(Object.assign({ x: k * (cw + gap), y, w: cw, h: hand ? 84 : 72, seg: true }, it))); y += (hand ? 84 : 72) + 26; };
      const sw = items => { if (!items.length) return; const d = hand ? 84 : 72; items.forEach((it, k) => out.push(Object.assign({ x: k * (d + gap + 6), y, w: d, h: d, round: true }, it))); y += d + 26; };
      const col = hand ? 3 : 4;
      for (const sec of tb.sec) {
        const it = sec.items; if (!it.length) continue;
        if (sec.kind === 'floors') {     // 층 단면: 위층이 위, 지금 층 강조. 왼쪽 열 전체
          const fh = hand ? 84 : 70, x0 = 0, w = 300; let fy = y; heads.push({ t: sec.h, x: x0, y: fy }); fy += 44;
          it.forEach(f => { out.push(Object.assign({ x: x0, y: fy, w, h: fh, floor: true }, f)); fy += fh + (hand ? 30 : 8); });
          tb._side = { x: w + 40, top: y, bottom: fy }; continue;
        }
        const x0 = tb._side ? tb._side.x : 0, w = CW - x0;
        if (sec.h) { heads.push({ t: sec.h, x: x0, y }); y += 44; }
        if (sec.kind === 'thumbs') grid(it, hand ? 3 : 4, hand ? 230 : 210, x0, w);
        else if (sec.kind === 'seg') seg(it);
        else if (sec.kind === 'swatch') sw(it);
        else if (sec.kind === 'slider') { it.forEach(s0 => out.push(Object.assign({ x: x0, y, w, h: 128 }, s0))); y += 128 + 26; }
        else grid(it, sec.cols || (tb._side ? Math.max(2, col - 1) : col), hand ? 84 : 76, x0, w);
      }
      if (tb._side) y = Math.max(y, tb._side.bottom); delete tb._side;
      return { cells: out, heads, h: y };
    }
    function viewTabs() {     // 탭 데이터에 본문 형태를 붙임
      const T0 = tabs();
      T0.forEach(t => t.sec.forEach(sec => {
        if (/^층$/.test(sec.h)) sec.kind = 'floors';
        else if (sec.h === '추천 시안') { sec.kind = 'thumbs'; sec.items.forEach(i => { i.thumb = thumbOf('preset', i.key.split(':')[2]); }); }
        else if (sec.h === '마감재') { sec.kind = 'thumbs'; sec.items.forEach(i => { i.thumb = thumbOf('finish', i.key.split(':')[2]); }); }
        else if (/색상$/.test(sec.h)) sec.kind = 'swatch';
        else if (/^(보기 방식|시간대|계절|창 크기|현황과 신축|미성아파트 일대|회전)$/.test(sec.h)) sec.kind = 'seg';
      }));
      T0.forEach(t => { const i = t.sec.findIndex(x => x.kind === 'floors'); if (i > 0) t.sec.unshift(t.sec.splice(i, 1)[0]); });
      const lt = T0.find(t => t.t === '빛과 시간');
      if (lt && !lt.sec.some(x => x.h === '시간대' && x.items.length)) lt.sec.push({ h: '', items: [{ key: 'info:sun', info: true, label: '시간대·계절·시각은 보기 방식을 실사 3D 나 렌더로 바꾸면 나타납니다' }], cols: 1 });
      if (lt) { const i = lt.sec.findIndex(x => /^시각/.test(x.h)); if (i >= 0) { lt.sec[i] = { h: '시각 (끌어서 맞추고 놓으면 적용)', kind: 'slider', items: sunSlider() }; const bt = buttons('#sun-today').concat(buttons('#sun-play')), j = lt.sec.findIndex(x => x.h === '조명'); if (bt.length && j >= 0) lt.sec[j] = { h: '조명 · 날짜', items: lt.sec[j].items.concat(bt) }; } }   // 1102.s: 오늘·하루 재생 단추(VR 기능 대응표). 새 구역을 더하면 판 밖으로 밀려 '조명'이 안 보였다
      return T0;
    }
    function draw() {
      if (!open) return;
      const T0 = viewTabs(); if (tab >= T0.length) tab = 0;
      const tb = T0[tab], L0 = layout(tb); contentH = L0.h;
      const maxS = Math.max(0, contentH - CH); scroll[tab] = Math.max(0, Math.min(maxS, scroll[tab] || 0)); const sy = scroll[tab];
      cells = [];
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(14,18,20,.95)'; rr(0, 0, W, H, 34); g.fill();
      g.strokeStyle = 'rgba(127,214,255,.35)'; g.lineWidth = 2; rr(1, 1, W - 2, H - 2, 34); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.04)'; rr(8, 8, RAIL, H - 16, 28); g.fill();
      // 위: 위치와 모드 스위치
      const L = curLevel();
      g.fillStyle = '#7fd6ff'; g.font = '600 24px ' + FONT; g.fillText('케이프혼타워', CX, 52);
      g.fillStyle = '#f2f0ea'; g.font = '700 34px ' + FONT; g.fillText(S.mode === 'fig' ? '모형 1:' + Math.round(1 / S.fig.scale) : (L ? (L.name || L.key) : '건물 밖'), CX + 180, 56);
      const modes = [['vr', '몰입'], ['fig', S.ar ? '피규어' : '모형'], ['web', '웹 화면으로']];
      let mx = W - 40 - 84 - 3 * 190 - 2 * 10;
      modes.forEach(([m, t]) => { cells.push({ key: 'mode:' + m, x: mx, y: 18, w: 190, h: 66, label: t, mode: m, on: () => S.mode === m, act: () => (m === 'web' ? exitToWeb() : X.setMode(m)) }); mx += 200; });
      cells.push({ key: 'close', x: W - 40 - 84, y: 18, w: 84, h: 66, label: '✕', act: () => closeMenu() });
      // 왼쪽 세로 탭
      const th = Math.min(110, (H - 40 - 8 * (T0.length - 1)) / T0.length);
      T0.forEach((t, i) => cells.push({ key: 'tab:' + i, x: 20, y: 20 + i * (th + 8), w: RAIL - 24, h: th, label: t.t, tab: i, on: () => tab === i, act: () => { tab = i; } }));
      // 본문(잘라서 스크롤)
      g.save(); g.beginPath(); g.rect(CX - 8, CY, CW + 16, CH); g.clip();
      L0.heads.forEach(h => { g.fillStyle = '#7fd6ff'; g.font = '600 24px ' + FONT; g.fillText(h.t, CX + h.x, CY + h.y - sy + 30); });
      const body = L0.cells.map(c => Object.assign({}, c, { x: CX + c.x, y: CY + c.y - sy })).filter(c => c.y + c.h > CY && c.y < CY + CH);
      body.forEach(c => drawCell(c, true)); g.restore();
      body.forEach(c => { const y0 = Math.max(c.y, CY), y1 = Math.min(c.y + c.h, CY + CH); if (y1 - y0 > 20) cells.push(Object.assign(c, { hy0: y0, hy1: y1 })); });
      // 스크롤 막대와 위·아래 버튼(손으로도 누를 수 있게)
      if (maxS > 0) {
        const bx = W - 44, bh = CH - 2 * 72, kh = Math.max(60, bh * CH / contentH), ky = CY + 72 + (bh - kh) * sy / maxS;
        g.fillStyle = 'rgba(255,255,255,.08)'; rr(bx + 8, CY + 72, 16, bh, 8); g.fill(); g.fillStyle = 'rgba(127,214,255,.7)'; rr(bx + 8, ky, 16, kh, 8); g.fill();
        cells.push({ key: 'sc:-', x: bx - 6, y: CY, w: 44, h: 64, label: '▲', act: () => scrollBy(-CH * 0.6) });
        cells.push({ key: 'sc:+', x: bx - 6, y: CY + CH - 64, w: 44, h: 64, label: '▼', act: () => scrollBy(CH * 0.6) });
      }
      cells.filter(c => c.tab != null || c.mode || c.key === 'close' || /^sc:/.test(c.key)).forEach(c => drawCell(c, false));
      if (toastMsg && performance.now() < toastT) { g.fillStyle = 'rgba(31,92,85,.95)'; rr(W / 2 - 300, H / 2 - 50, 600, 100, 20); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(fit(toastMsg, 560, 32, 600), W / 2, H / 2 + 11); g.textAlign = 'left'; }
      g.fillStyle = '#8a877f'; g.font = '400 20px ' + FONT; g.textAlign = 'right';
      g.fillText(S.input === 'hand' ? '검지로 누르기 · ▲▼로 넘기기' : '트리거로 선택 · 가리킨 채 오른쪽 스틱 위아래로 스크롤 · 그립으로 창 옮기기', W - 40, H - 16); g.textAlign = 'left';
      tex.needsUpdate = true; lastDraw = performance.now(); dirtyFlag = false;
    }
    function drawCell(c) {
      const hov = isHov(c.key), on = c.on ? c.on() : false, off = c.off ? c.off() : false;
      if (c.round || c.color) {   // 색 견본: 원
        const r = Math.min(c.w, c.h) / 2; g.fillStyle = c.color || '#888'; g.beginPath(); g.arc(c.x + r, c.y + r, r - 4, 0, 7); g.fill();
        if (on || hov) { g.strokeStyle = on ? '#7fd6ff' : '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(c.x + r, c.y + r, r - 2, 0, 7); g.stroke(); }
        return;
      }
      if (c.info) { g.fillStyle = '#9a978f'; g.font = '400 24px ' + FONT; g.fillText(c.label, c.x + 4, c.y + c.h / 2 + 8); return; }
      if (c.slider) {     // 시각 막대: 눈금, 손잡이, 지금 값
        const v = c.get(), f = (v - c.min) / (c.max - c.min), tx = c.x + 40, tw = c.w - 80, ty = c.y + 78;
        g.fillStyle = 'rgba(255,255,255,.07)'; rr(c.x, c.y, c.w, c.h, 16); g.fill();
        const grd = g.createLinearGradient(tx, 0, tx + tw, 0); grd.addColorStop(0, '#2b3a55'); grd.addColorStop(0.25, '#f0b56a'); grd.addColorStop(0.5, '#fff4d6'); grd.addColorStop(0.8, '#f08a5a'); grd.addColorStop(1, '#2b2f4a');
        g.fillStyle = grd; rr(tx, ty - 8, tw, 16, 8); g.fill();
        g.fillStyle = '#9a978f'; g.font = '400 20px ' + FONT; g.textAlign = 'center';
        for (let h = Math.ceil(c.min); h <= c.max; h++) { const x = tx + tw * (h - c.min) / (c.max - c.min); g.fillRect(x - 1, ty + 12, 2, h % 3 ? 8 : 14); if (h % 3 === 0) g.fillText(h + '시', x, ty + 44); }
        const kx = tx + tw * f; g.fillStyle = hov || on ? '#7fd6ff' : '#fff'; g.beginPath(); g.arc(kx, ty, 22, 0, 7); g.fill();
        g.fillStyle = '#f2f0ea'; g.font = '700 30px ' + FONT; g.fillText(c.fmt(v), kx, c.y + 40); g.textAlign = 'left';
        return;
      }
      g.fillStyle = on ? '#1f5c55' : hov && !off ? 'rgba(127,214,255,.25)' : 'rgba(255,255,255,.07)'; rr(c.x, c.y, c.w, c.h, 16); g.fill();
      if (on) { g.strokeStyle = '#7fd6ff'; g.lineWidth = 3; rr(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3, 16); g.stroke(); }
      g.fillStyle = off ? '#5d5b56' : on ? '#fff' : '#e8e5dd';
      if (c.thumb !== undefined) {   // 사진 카드
        const ih = c.h - 62;
        if (c.thumb && c.thumb.complete && c.thumb.naturalWidth) { g.save(); rr(c.x + 6, c.y + 6, c.w - 12, ih - 6, 12); g.clip(); const im = c.thumb, s0 = Math.max((c.w - 12) / im.naturalWidth, (ih - 6) / im.naturalHeight); g.drawImage(im, c.x + 6 + (c.w - 12 - im.naturalWidth * s0) / 2, c.y + 6 + (ih - 6 - im.naturalHeight * s0) / 2, im.naturalWidth * s0, im.naturalHeight * s0); g.restore(); }
        else { g.fillStyle = 'rgba(255,255,255,.05)'; rr(c.x + 6, c.y + 6, c.w - 12, ih - 6, 12); g.fill(); g.fillStyle = off ? '#5d5b56' : '#e8e5dd'; }
        g.fillStyle = off ? '#5d5b56' : on ? '#fff' : '#e8e5dd'; g.fillText(fit(c.label, c.w - 24, 26, 600), c.x + 12, c.y + c.h - 22); return;
      }
      if (c.check) {    // 켜고 끄는 항목: 오른쪽 스위치
        const sx = c.x + c.w - 74, sy0 = c.y + c.h / 2 - 16; g.fillStyle = on ? '#3fa98f' : 'rgba(255,255,255,.18)'; rr(sx, sy0, 58, 32, 16); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(on ? sx + 42 : sx + 16, sy0 + 16, 12, 0, 7); g.fill();
        g.fillStyle = off ? '#5d5b56' : '#e8e5dd'; g.fillText(fit(c.label, c.w - 100, 26, 600), c.x + 16, c.y + c.h / 2 + 9); return;
      }
      const center = c.tab != null || c.mode || c.seg || c.key === 'close' || /^sc:/.test(c.key);
      if (center) { g.textAlign = 'center'; g.fillText(fit(c.label, c.w - 16, c.tab != null ? 30 : 28, 600), c.x + c.w / 2, c.y + c.h / 2 + 10); g.textAlign = 'left'; }
      else if (c.sub) { g.fillText(fit(c.label, c.w - 26, 26, 600), c.x + 14, c.y + c.h / 2 - 4); g.fillStyle = '#9a978f'; g.fillText(fit(c.sub, c.w - 26, 19, 400), c.x + 14, c.y + c.h / 2 + 24); }
      else g.fillText(fit(c.label, c.w - 26, 26, 600), c.x + 14, c.y + c.h / 2 + 9);
    }
    function scrollBy(d) { scroll[tab] = (scroll[tab] || 0) + d; dirtyFlag = true; }
    // 트리거를 누른 채 끌기: 시각 막대는 값, 그 밖의 본문은 스크롤(20px 넘게 움직이면 누름 취소)
    let pdrag = null, wdrag = null;
    function winScale() { return Math.max(0.6, Math.min(1.8, +store.get('menuScale' + (S.input === 'hand' ? 'H' : 'C'), 1))); }
    function headW() { return xrCam.getWorldPosition(V(0, 0, 0)); }
    function winStart(c, hit) {
      const F = panelFront();
      wdrag = { c, mode: hit.cell.win, d0: hit.distance, s0: panel.scale.x, F, off: panel.getWorldPosition(V(0, 0, 0)).sub(hit.point), p0: hit.point.clone() };
      click(); haptic();
    }
    // 판 앞면 가운데(월드). 곡면은 중심에서 반지름만큼 앞
    function panelFront() { const C = panel.userData.curve; const p = panel.getWorldPosition(V(0, 0, 0)); if (!C) return p; const f = V(0, 0, -1).applyQuaternion(panel.getWorldQuaternion(new T.Quaternion())); return p.addScaledVector(f, C.r * panel.scale.x * rig.scale.x); }
    function winMove(c, ray) {
      const w = wdrag; if (!w || w.c !== c) return;
      const o = ray.ray.origin, dir = ray.ray.direction, hd = headW();
      if (w.mode === 'bar') {     // 막대가 레이를 따라가고, 창은 늘 사용자를 봄
        const P = o.clone().addScaledVector(dir, w.d0), toP = P.clone().sub(hd); toP.y = 0; if (toP.lengthSq() < 1e-4) return; toP.normalize();
        const yawW = Math.atan2(-toP.x, -toP.z), dy = P.y - w.p0.y;
        const q = new T.Quaternion().setFromAxisAngle(V(0, 1, 0), yawW);
        const off = w.off.clone(); const q0inv = w.q0inv || (w.q0inv = panel.getWorldQuaternion(new T.Quaternion()).invert()); off.applyQuaternion(q0inv).applyQuaternion(q);
        const pw = P.clone().add(off); rig.worldToLocal(pw); panel.position.copy(pw);
        panel.rotation.y = yawW - rig.rotation.y;
      } else {     // 모서리: 앞면 가운데에서 레이가 닿는 점까지 거리 비율로 크기
        const n = hd.clone().sub(w.F).setY(0).normalize(), denom = dir.dot(n); if (Math.abs(denom) < 1e-4) return;
        const t = w.F.clone().sub(o).dot(n) / denom; if (t <= 0) return;
        const P = o.clone().addScaledVector(dir, t), r0 = w.p0.distanceTo(w.F), r1 = P.distanceTo(w.F); if (r0 < 1e-3) return;
        const sc = Math.max(0.6, Math.min(1.8, w.s0 * r1 / r0)), C = panel.userData.curve;
        panel.scale.setScalar(sc);
        if (C) { const f = V(0, 0, -1).applyQuaternion(panel.getWorldQuaternion(new T.Quaternion())); const pw = w.F.clone().addScaledVector(f, -C.r * sc * rig.scale.x); rig.worldToLocal(pw); panel.position.copy(pw); }
      }
    }
    function winEnd(c) { const w = wdrag; if (!w || w.c !== c) return false; wdrag = null; store.set('menuScale' + (S.input === 'hand' ? 'H' : 'C'), +panel.scale.x.toFixed(2)); return true; }
    function pressStart(c, hit) { if (hit && hit.where === 'win') { winStart(c, hit); return; } if (!hit || hit.where !== 'menu' || !hit.uv) return; pdrag = { c, y0: hit.uv.y, s0: scroll[tab] || 0, moved: false, cell: hit.cell }; }
    function pressMove(c, hit, ray) {
      if (wdrag && wdrag.c === c) { winMove(c, ray); return; }
      if (!pdrag || pdrag.c !== c || !hit || hit.where !== 'menu' || !hit.uv) return;
      const cell = pdrag.cell;
      if (cell && cell.slider) { const tx = cell.x + 40, tw = cell.w - 80, f = Math.max(0, Math.min(1, (hit.uv.x * W - tx) / tw)); const v = Math.round((cell.min + f * (cell.max - cell.min)) / cell.step) * cell.step; if (v !== cell.get()) { cell.set(v); dirtyFlag = true; } pdrag.moved = true; return; }
      const dy = (hit.uv.y - pdrag.y0) * H; if (Math.abs(dy) > 20) pdrag.moved = true;
      if (pdrag.moved) { scroll[tab] = pdrag.s0 - dy; dirtyFlag = true; }
    }
    function pressEnd(c) { if (winEnd(c)) return true; const d = pdrag; if (!d || d.c !== c) return false; pdrag = null; if (d.cell && d.cell.slider) { d.cell.commit(); click(); dirtyFlag = true; return true; } return d.moved; }
    /* ----- 빠른 막대: 층 표시 + 4 버튼 ----- */
    function drawQuick() {
      const q = qg, L = curLevel(); qcells = [];
      q.clearRect(0, 0, 512, 320);
      const qh = 312;
      q.fillStyle = 'rgba(14,18,20,.92)'; q.beginPath(); q.roundRect ? q.roundRect(4, 4, 504, qh, 24) : q.rect(4, 4, 504, qh); q.fill();
      q.fillStyle = '#7fd6ff'; q.font = '600 22px ' + FONT; q.fillText(S.mode === 'fig' ? '모형 보기' : '케이프혼타워', 24, 40);
      q.fillStyle = '#f2f0ea'; q.font = '700 40px ' + FONT; q.fillText(S.mode === 'fig' ? '1:' + Math.round(1 / S.fig.scale) : (L ? (L.name || L.key) : '건물 밖'), 24, 88);
      const hand = S.input === 'hand';
      const row1 = S.mode === 'fig'
        ? [['q:in', '몰입', () => X.setMode('vr')], ['q:s+', '크게', () => { S.fig.scale = clampScale(S.fig.scale * 1.25); }], ['q:s-', '작게', () => { S.fig.scale = clampScale(S.fig.scale / 1.25); }], ['q:menu', '메뉴', () => toggleMenu()]]
        : [['q:up', '▲ 위층', () => stepFloor(1)], ['q:dn', '▼ 아래층', () => stepFloor(-1)], ['q:io', K.I && K.I.on ? '밖으로' : '안으로', () => (K.I && K.I.on ? goOutside() : goInside())], ['q:menu', '메뉴', () => toggleMenu()]];
      const row2 = hand ? [['q:cp', '◀ 시안', () => cycle(-1)], ['q:cn', '시안 ▶', () => cycle(1)],
        S.mode === 'fig' ? ['q:rl', '↶ 돌리기', () => { S.fig.yaw -= Math.PI / 8; }] : ['q:rl', '↶ 30°', () => snapTurn(Math.PI / 6)],
        S.mode === 'fig' ? ['q:rr', '돌리기 ↷', () => { S.fig.yaw += Math.PI / 8; }] : ['q:rr', '30° ↷', () => snapTurn(-Math.PI / 6)]] : [];
      [row1, row2].forEach((row, r) => row.forEach(([k, t, a], i) => {
        const c = { key: k, x: 16 + i * 122, y: 112 + r * 104, w: 114, h: 92, label: t, act: a }; qcells.push(c);
        q.fillStyle = isHov(k) ? 'rgba(127,214,255,.3)' : 'rgba(255,255,255,.1)'; q.beginPath(); q.roundRect ? q.roundRect(c.x, c.y, c.w, c.h, 14) : q.rect(c.x, c.y, c.w, c.h); q.fill();
        q.fillStyle = '#fff'; q.font = '600 24px ' + FONT; q.textAlign = 'center'; q.fillText(t, c.x + c.w / 2, c.y + 56); q.textAlign = 'left';
      }));
      if (S.input !== 'hand') {   // 지금 상황(건물 밖·안·피규어·메뉴)에서 쓸 수 있는 버튼 안내
        const ins = K.I && K.I.on, lines = open ? ['메뉴: 가리키고 트리거로 선택', '오른쪽 스틱 위아래: 스크롤 · 왼쪽 스틱 누르기: 닫기']
          : S.mode === 'fig' ? ['그립: 모형 잡아 옮기기 · 두 손 그립: 크기·회전', 'A/X 크게 · B/Y 작게 · 트리거: 들어갈 곳 가리키기']
          : ins ? ['A/X 위층 · B/Y 아래층 · 그립: 건물 밖으로', '트리거: 바닥 가리켜 이동 · 왼쪽 스틱: 걷기(계단·램프)']
          : ['트리거: 바닥이나 빛기둥(출입구) 가리켜 이동', 'A/X·B/Y: 1층으로 들어가기 · 그립: 안으로'];
        q.fillStyle = '#c9c6be'; q.font = '500 21px ' + FONT; lines.forEach((l, i) => q.fillText(l, 22, 246 + i * 36));
      }
      qtex.needsUpdate = true;
    }
    /* ----- 열기/닫기와 배치(입력 방식별 거리) ----- */
    function openMenu() {
      open = true; Help.hide();
      const hand = S.input === 'hand', want = hand ? panelF : panelC;
      if (panel !== want) { if (panel.parent) panel.parent.remove(panel); panel.visible = false; panel = want; }
      const h = xrCam.position.clone(), d = new T.Vector3(0, 0, -1).applyQuaternion(xrCam.quaternion); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize();
      if (panel.parent !== rig) rig.add(panel);
      const yaw = Math.atan2(-d.x, -d.z);
      if (hand) { panel.position.copy(h).addScaledVector(d, FLAT.d); panel.position.y = h.y - 0.22; panel.rotation.set(-0.25, yaw, 0, 'YXZ'); }
      const sc = winScale();
      if (hand) panel.scale.setScalar(sc);
      else { const F = h.clone().addScaledVector(d, CURVE.r); F.y = h.y - 0.1; panel.rotation.set(0, yaw, 0); panel.scale.setScalar(sc); panel.position.copy(F).addScaledVector(d, -CURVE.r * sc); }   // 앞면은 1.25m, 키우면 곡률 중심이 뒤로
      panel.visible = true;
      draw(); click();
    }
    // 칸 중심의 월드 좌표(시험·안내용). 곡면이면 원통 위의 점
    function cellPoint(c) {
      const u = (c.x + c.w / 2) / W, v = (c.y + c.h / 2) / H;
      let lp;
      if (panel.userData.curve) { const C = panel.userData.curve, th = Math.PI - C.a / 2 + (1 - u) * C.a; lp = V(C.r * Math.sin(th), (0.5 - v) * C.h, C.r * Math.cos(th)); }
      else { const P = panel.geometry.parameters; lp = V((u - 0.5) * P.width, (0.5 - v) * P.height, 0); }
      panel.updateMatrixWorld(true); return panel.localToWorld(lp);
    }
    function closeMenu() { open = false; panel.visible = false; hover = ''; dragC = null; }
    let dragC = null;
    function dragStart(c) { dragC = c; c.attach(panel); }
    function dragEnd() { if (!dragC) return; rig.attach(panel); const q = panel.quaternion, e = new T.Euler().setFromQuaternion(q, 'YXZ'); panel.rotation.set(0, e.y, 0); dragC = null; }
    function toggleMenu() { open ? closeMenu() : openMenu(); }
    /* ----- 히트 판정 ----- */
    function cellAt(list, uv, w, h) { const x = uv.x * w, y = (1 - uv.y) * h; return list.find(c => x >= c.x && x <= c.x + c.w && y >= (c.hy0 != null ? c.hy0 : c.y) && y <= (c.hy1 != null ? c.hy1 : c.y + c.h)) || null; }
    function raycast(ray) {
      let best = null;
      if (open && panel.visible && panel.userData.ctl) { const h = ray.intersectObjects(panel.userData.ctl, false)[0]; if (h) { const w = h.object.userData.win; return { key: 'win:' + w, where: 'win', distance: h.distance, point: h.point.clone(), cell: { key: 'win:' + w, win: w } }; } }
      if (open && panel.visible) { const h = ray.intersectObject(panel, false)[0]; if (h) { const c = cellAt(cells, h.uv, W, H); best = { key: c ? c.key : 'panel', cell: c, distance: h.distance, where: 'menu', uv: { x: h.uv.x, y: 1 - h.uv.y } }; } }
      if (!best && quick.visible) { const h = ray.intersectObject(quick, false)[0]; if (h) { const c = cellAt(qcells, h.uv, 512, 320); best = { key: c ? c.key : 'quick', cell: c, distance: h.distance, where: 'quick' }; } }
      if (!best) best = Photo.raycast(ray);
      if (!best) best = Hot.raycast(ray);
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
        for (const [mesh, list, w, h] of [[panel, cells, W, H], [quick, qcells, 512, 320]]) {
          if (!mesh.visible || (mesh === panel && !open) || !mesh.geometry.parameters.width) continue;
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
      const hands = [...S.session.inputSources].some(s => s.hand || s.targetRayMode === 'transient-pointer');
      const was = S.input; S.input = hands ? 'hand' : 'controller';
      if (was !== S.input) { log('입력', S.input); if (open) openMenu(); }
    }
    /* ----- 프레임 ----- */
    function update(time) {
      palmQuick();
      if (S.input === 'hand') handPoke(time);
      const hk = [...new Set(ctrls.map(c => c.userData.uiHit && c.userData.uiHit.key).filter(Boolean))].join('|') || (S.input === 'hand' ? hover : '');   // 1102.r: 두 손이 다 메뉴를 가리키면 둘 다 강조('|' 로 이음)
      if (hk !== hover && S.input !== 'hand') { hover = hk || ''; dirtyFlag = true; }
      if (open && (dirtyFlag || time - lastDraw > 1000 || (soon && performance.now() > soon))) { soon = 0; draw(); }
      if (open && panel.userData.ctl) panel.userData.ctl.forEach(m => { const on = (wdrag && 'win:' + wdrag.mode === 'win:' + m.userData.win) || isHov('win:' + m.userData.win); m.material.opacity = on ? 1 : 0.55; });
      if (quick.visible && (dirtyFlag || time % 500 < 20)) drawQuick();
      if (dirtyFlag && !open) drawQuick();
    }
    function onSessionStart() { detectInput(); drawQuick(); Help.maybe(); }
    function onSessionEnd() { Photo.close(); if (Labels.g) Labels.g.visible = false; closeMenu(); quick.visible = false; [panelC, panelF].forEach(m => { if (m.parent) m.parent.remove(m); }); Help.hide(); }
    return { init, raycast, activate, update, toggleMenu, dragStart, dragEnd, dragging: () => dragC, openMenu, closeMenu, menuOpen: () => open, hover: () => hover, cycle, toast, detectInput, onSessionStart, onSessionEnd,
      dirty: () => { dirtyFlag = true; }, dirtySoon: () => { soon = performance.now() + 150; }, cells: () => cells, qcells: () => qcells, setTab: i => { tab = i; dirtyFlag = true; }, cellPoint, pressStart, pressMove, pressEnd, panelFront, winScale, scrollBy, scrollOf: () => scroll[tab] || 0, contentH: () => contentH, panel: () => panel, tabs: () => tabs().map(t => t.t + ':' + t.sec.reduce((n, s) => n + s.items.length, 0)) };
  })();

  /* ================= 12-1. 모형 층 라벨 ================= */
  const Labels = X.labels = {
    g: null, sig: '',
    update() {
      const want = S.mode === 'fig' && K.full && K.LEVELS;
      if (!want) { if (this.g) this.g.visible = false; return; }
      const ug = !!(document.getElementById('t-b1') || {}).checked;
      const sig = K.LEVELS.map(l => l.key + ':' + floorY(l).toFixed(2)).join('|') + S.center.x.toFixed(1) + ug;
      if (sig !== this.sig) this.build(sig);
      this.g.visible = true;
      // 글자가 늘 사용자 쪽을 보게(모형이 돌아도)
      const head = xrCam.getWorldPosition(V(0, 0, 0));
      this.g.children.forEach(m => { m.lookAt(head.x, m.getWorldPosition(V(0, 0, 0)).y, head.z); });
    },
    build(sig) {
      if (this.g) { this.g.children.forEach(m => { m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); }); if (this.g.parent) this.g.parent.remove(this.g); }
      const g = this.g = new T.Group(); g.userData.khxr = true; this.sig = sig;
      const ox = S.center.x + 16, oz = S.center.z + 16;   // 건물 모서리 바깥쪽 기둥처럼
      const ug = !!(document.getElementById('t-b1') || {}).checked;
      K.LEVELS.forEach(L => {
        if (floorY(L) < -0.5 && !ug) return;    // 땅 아래 층 라벨은 받침 밑에 떠 보여 헷갈리므로 지하 보기일 때만
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
        c.fillStyle = 'rgba(14,18,20,.85)'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#fff'; c.font = '700 30px ' + FONT; c.fillText(L.name || L.key, 12, 42);
        c.fillStyle = '#7fd6ff'; c.font = '400 22px ' + FONT; if (L.area) c.fillText(Math.round(L.area / 3.3058) + '평', 120, 42);
        const m = new T.Mesh(new T.PlaneGeometry(8, 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthTest: false }));
        m.renderOrder = 998; m.position.set(ox, floorY(L) + 1.6, oz); g.add(m);
      });
      uiScene.add(g);   // 자르기 경계에 걸려 잘리지 않게 자르기 없는 패스에서 그림
    }
  };

  /* ================= 11-2. 바로가기 지점(출입구 앞) ================= */
  // 건물 밖 몰입에서 원본 라벨 중 출입구(Ent·출입·램프)를 골라, 그 앞 바닥에 빛기둥 표시. 레이로 가리키고 트리거를 누르면 문을 보고 그 자리로
  const Hot = X.hot = {
    g: null, list: [], sig: '', hover: -1,
    want() { return S.mode === 'vr' && K.full && !(K.I && K.I.on) && !!K.labels; },
    pick() {
      const c = S.center || buildingCenter();
      return (K.labels || []).filter(l => l.fl && l.v && l.v.y < 1.5 && /Ent|출입|램프|계단/.test(l.el ? l.el.textContent : '')).map(l => {
        const t = (l.el.innerHTML || '').replace(/<\/b>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), d = V(l.v.x - c.x, 0, l.v.z - c.z); if (d.lengthSq() < 1e-4) d.set(-1, 0, 0); d.normalize();
        return { name: t, door: V(l.v.x, 0, l.v.z), at: V(l.v.x, 0, l.v.z).addScaledVector(d, 1.8) };
      });
    },
    // 그리기 호출을 아끼려고 모든 지점의 고리·빛기둥을 한 메시(꼭짓점 색), 이름표를 한 메시(한 장의 텍스처)로 그린다
    build() {
      if (this.g) { this.g.traverse(o => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry) o.geometry.dispose(); }); scene.remove(this.g); }
      const g = this.g = new T.Group(); g.userData.khxr = true; g.name = 'khxr-hot';
      this.list = this.pick(); const n = this.list.length; if (!n) { scene.add(g); return; }
      const parts = [], hits = [];
      this.list.forEach((h, i) => {
        const d = firstSolid(V(h.at.x, 3, h.at.z), V(0, -1, 0), 6); if (d) h.at.y = d.point.y;
        const ring = new T.RingGeometry(0.32, 0.45, 32).rotateX(-Math.PI / 2).translate(h.at.x, h.at.y + 0.03, h.at.z);
        const beam = new T.CylinderGeometry(0.06, 0.06, 2.2, 10, 1, true).translate(h.at.x, h.at.y + 1.1, h.at.z);
        [ring, beam].forEach(q => { const g2 = q.index ? q.toNonIndexed() : q; g2.userData = { i }; parts.push(g2); });
        const hit = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 2.9, 10).translate(0, 1.45, 0), new T.MeshBasicMaterial({ visible: false }));
        hit.position.copy(h.at); hit.userData.i = i; hits.push(hit);
      });
      let total = 0; parts.forEach(q => { total += q.attributes.position.count; });
      const pos = new Float32Array(total * 3), col = new Float32Array(total * 3), owner = new Uint8Array(total); let o = 0;
      parts.forEach(q => { const a = q.attributes.position.array; pos.set(a, o * 3); owner.fill(q.userData.i, o, o + q.attributes.position.count); o += q.attributes.position.count; q.dispose(); });
      const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.BufferAttribute(pos, 3)); mg.setAttribute('color', new T.BufferAttribute(col, 3));
      const marks = new T.Mesh(mg, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, side: T.DoubleSide }));
      marks.frustumCulled = false; this.owner = owner; this.marks = marks;
      // 이름표: 512×112 칸을 세로로 쌓은 한 장
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 112 * n; const q = cv.getContext('2d');
      this.list.forEach((h, i) => { q.fillStyle = 'rgba(14,18,20,.88)'; q.beginPath(); q.roundRect ? q.roundRect(0, i * 112, 512, 112, 28) : q.rect(0, i * 112, 512, 112); q.fill(); q.fillStyle = '#fff'; q.font = '700 40px ' + FONT; q.textAlign = 'center'; q.fillText(h.name.slice(0, 16), 256, i * 112 + 70); });
      const tg = new T.BufferGeometry(), tp = new Float32Array(n * 6 * 3), tu = new Float32Array(n * 6 * 2);
      this.list.forEach((h, i) => { const v0 = 1 - (i + 1) / n, v1 = 1 - i / n; tu.set([0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1], i * 12); });
      tg.setAttribute('position', new T.BufferAttribute(tp, 3)); tg.setAttribute('uv', new T.BufferAttribute(tu, 2));
      const tags = new T.Mesh(tg, new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, side: T.DoubleSide }));
      tags.frustumCulled = false; this.tags = tags;
      g.add(marks, tags, ...hits); this.hits = hits; this.colorSig = '';
      scene.add(g);
    },
    update() {
      const on = this.want();
      if (!on) { if (this.g) this.g.visible = false; return; }
      const sig = (K.labels || []).length + ':' + (S.center ? S.center.x.toFixed(1) : '');
      if (sig !== this.sig || !this.g) { this.sig = sig; this.build(); }
      this.g.visible = true; if (!this.list.length) return;
      const head = xrCam.getWorldPosition(V(0, 0, 0)), hk = ctrls.map(c => c.userData.uiHit).find(h => h && h.where === 'hot'), hi = hk ? hk.cell.i : -1;
      if (this.colorSig !== hi) {    // 가리킨 지점만 흰색
        this.colorSig = hi; const c = this.marks.geometry.attributes.color;
        for (let k = 0; k < this.owner.length; k++) { const w = this.owner[k] === hi; c.setXYZ(k, w ? 1 : 0.5, w ? 1 : 0.84, w ? 1 : 1); }
        c.needsUpdate = true;
      }
      // 이름표는 사용자 쪽을 보고, 멀수록 크게
      const tp = this.tags.geometry.attributes.position;
      this.list.forEach((h, i) => {
        const far = Math.max(1, head.distanceTo(h.at) / 12), w = 0.8 * far, ht = 0.175 * far, cy = h.at.y + 2.2 + ht;
        const dx = head.x - h.at.x, dz = head.z - h.at.z, L = Math.hypot(dx, dz) || 1, rx = dz / L * w, rz = -dx / L * w;   // 보는 사람 기준 오른쪽
        const A = [h.at.x - rx, cy - ht, h.at.z - rz], B = [h.at.x + rx, cy - ht, h.at.z + rz], C = [h.at.x + rx, cy + ht, h.at.z + rz], D = [h.at.x - rx, cy + ht, h.at.z - rz];
        tp.array.set([...A, ...B, ...C, ...A, ...C, ...D], i * 18);
      });
      tp.needsUpdate = true;
    },
    raycast(ray) {
      if (!this.g || !this.g.visible || !this.hits || !this.hits.length) return null;
      const hs = ray.intersectObjects(this.hits, false); if (!hs.length) return null;
      const i = hs[0].object.userData.i;
      return { key: 'hot:' + i, where: 'hot', distance: hs[0].distance, cell: { key: 'hot:' + i, i, act: () => Hot.go(i) } };
    },
    go(i) { const h = this.list[i]; if (!h) return; jump(() => { placeUser(h.at, yawOf(h.at, h.door)); afterChange(); UI.toast(h.name); }); }
  };

  /* ================= 12-2. 실사 사진 액자 ================= */
  const Photo = X.photo = {
    mesh: null, list: [], i: 0, tex: null, loading: false,
    man() { return window.PH && window.PH.man; },
    url(path) { const P = window.PH, m = this.man(); return P.src.base + m.tiers.std + path + (m.h && m.h[path] ? '?v=' + m.h[path] : ''); },
    extList() {
      const m = this.man(); if (!m || !m.ext) return [];
      const st = window.CH && CH.state, emode = (document.querySelector('input[name=emode]:checked') || {}).value;
      const d = emode === 'preset' ? (m.ext.preset || {})[st.pdesign] : (m.ext.finish || {})[st.cfin];
      if (!d || !d.img) return [];
      return Object.entries(d.img).map(([a, p]) => ({ t: (d.name || '') + ' ' + a + '°', p }));
    },
    intList() {
      const m = this.man(), L = curLevel(); if (!m || !m.int || !L) return [];
      const k = /^B(\d)/.test(L.key) ? 'pb' + L.key[1] : /^(\d)F/.test(L.key) ? 'f' + L.key[0] : /^PH|roof/i.test(L.key) ? 'roof' : null;
      const d = k && m.int[k]; if (!d || !d.img) return [];
      return Object.entries(d.img).map(([a, p]) => ({ t: (d.name || L.key) + ' ' + a.replace(/^\d+_/, ''), p }));
    },
    items() {
      const out = [];
      if (this.extList().length) out.push({ key: 'ph:ext', label: '외관 실사 사진', sub: '지금 시안', act: () => this.open(this.extList()) });
      if (this.intList().length) out.push({ key: 'ph:int', label: '이 층 실사 사진', sub: (curLevel() || {}).key, act: () => this.open(this.intList()) });
      if (this.mesh) out.push({ key: 'ph:close', label: '사진 닫기', act: () => this.close() });
      return out;
    },
    open(list) {
      if (!list.length) return;
      this.list = list; this.i = 0;
      if (!this.mesh) {
        this.cv = document.createElement('canvas'); this.cv.width = 1600; this.cv.height = 1130; this.g = this.cv.getContext('2d');
        this.tex = new T.CanvasTexture(this.cv);
        this.mesh = new T.Mesh(new T.PlaneGeometry(1.6, 1.13), new T.MeshBasicMaterial({ map: this.tex, depthTest: false, transparent: true }));
        this.mesh.renderOrder = 1003; this.mesh.userData.khxr = true; this.mesh.name = 'khxr-photo';
      }
      const h = xrCam.position.clone(), d = V(0, 0, -1).applyQuaternion(xrCam.quaternion); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize();
      rig.add(this.mesh); this.mesh.position.copy(h).addScaledVector(d, 1.9); this.mesh.position.y = h.y; this.mesh.rotation.set(0, Math.atan2(-d.x, -d.z), 0);
      this.show();
    },
    show() {
      const it = this.list[this.i], g = this.g; this.loading = true; this.paint(null, it);
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { this.loading = false; this.ok = true; this.paint(img, it); };
      img.onerror = () => { this.loading = false; this.ok = false; this.paint(null, it, '사진을 불러오지 못했습니다'); };
      img.src = this.url(it.p);
    },
    paint(img, it, err) {
      const g = this.g; g.fillStyle = '#0e1214'; g.fillRect(0, 0, 1600, 1130);
      if (img) g.drawImage(img, 0, 0, 1600, 1000);
      g.fillStyle = '#f2f0ea'; g.font = '600 40px ' + FONT; g.fillText((err || (this.loading ? '불러오는 중… ' : '')) + it.t + '  (' + (this.i + 1) + '/' + this.list.length + ')', 30, 1080);
      this.cells = [{ key: 'ph:prev', x: 1090, y: 1020, w: 160, h: 100, label: '◀', act: () => { this.i = (this.i - 1 + this.list.length) % this.list.length; this.show(); } },
        { key: 'ph:next', x: 1260, y: 1020, w: 160, h: 100, label: '▶', act: () => { this.i = (this.i + 1) % this.list.length; this.show(); } },
        { key: 'ph:x', x: 1430, y: 1020, w: 150, h: 100, label: '닫기', act: () => this.close() }];
      this.cells.forEach(c => { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(c.x, c.y, c.w, c.h); g.fillStyle = '#fff'; g.font = '600 40px ' + FONT; g.textAlign = 'center'; g.fillText(c.label, c.x + c.w / 2, c.y + 64); g.textAlign = 'left'; });
      this.tex.needsUpdate = true;
    },
    close() { if (this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh); this.mesh = null; },
    raycast(ray) {
      if (!this.mesh || !this.mesh.parent) return null;
      const h = ray.intersectObject(this.mesh, false)[0]; if (!h) return null;
      const x = h.uv.x * 1600, y = (1 - h.uv.y) * 1130, c = (this.cells || []).find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
      return { key: c ? c.key : 'photo', cell: c, distance: h.distance, where: 'photo' };
    },
    update() {}
  };

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
        : ['순간이동: 트리거를 누른 채 바닥을 가리키고 놓기', '층 이동: A/X 위층, B/Y 아래층 · 그립: 건물 밖으로', '메뉴: 왼쪽 스틱 누르기 · 시안은 메뉴의 외관 탭에서', '걷기: 왼쪽 스틱 · 돌기: 오른쪽 스틱 좌우'];
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
