/*
  케이프혼타워 XR 계층 (스파이크)
  원칙: Wing 원본 코드는 한 줄도 바꾸지 않는다.
  - THREE 생성자를 감싸 renderer/scene/camera/controls/composer 를 붙잡는다.
  - 원본 렌더 루프는 그대로 돌리고, XR 중에는 XR 프레임 안에서 실행되게 옮긴다.
  - 원본이 정한 카메라(시점 프리셋·내부 걷기)는 XR 중에도 그대로 유지시키고,
    헤드셋 시점은 rig(사용자 몸) 위치로만 반영한다.
  - 원본 DOM 컨트롤을 읽어 공간 패널로 비추고, 누르면 원본 버튼을 그대로 click 한다.
*/
(function () {
  'use strict';
  const T = window.THREE;
  if (!T) { console.warn('[khxr] THREE 없음'); return; }
  const K = window.KHXR = { v: '0.1-spike', composers: [], log: [] };
  const log = (...a) => { K.log.push(a.join(' ')); console.log('[khxr]', ...a); };

  /* ---------- 1. 생성자 후킹 ---------- */
  const wrap = (name, after) => {
    const C = T[name];
    if (!C) return;
    const W = function (...args) { const o = new C(...args); after(o, args); return o; };
    W.prototype = C.prototype;
    Object.setPrototypeOf(W, C);
    T[name] = W;
  };
  // alpha 는 패스스루(투명 배경)에 필요. 화면 모드에서는 clearAlpha=1 로 원래 모습 유지.
  const R0 = T.WebGLRenderer;
  T.WebGLRenderer = function (p) {
    const r = new R0(Object.assign({}, p, { alpha: true }));
    r.setClearAlpha(1);
    r.xr.enabled = true;
    if (!K.renderer) { K.renderer = r; log('renderer 확보'); setup(); }
    return r;
  };
  T.WebGLRenderer.prototype = R0.prototype;
  wrap('Scene', s => { if (!K.scene) { K.scene = s; log('scene 확보'); } });
  wrap('OrbitControls', (c, a) => { if (!K.controls) { K.controls = c; K.camera = a[0]; log('camera·controls 확보'); } });
  wrap('EffectComposer', c => { K.composers.push(c); patchComposer(c); });
  if (T.Sky) wrap('Sky', s => { (K.skies = K.skies || []).push(s); });

  /* ---------- 2. 렌더 루프 이동 ---------- */
  const raf0 = window.requestAnimationFrame.bind(window);
  let queue = [];
  // 원본 메인 루프(문서 파싱 중 처음 등록되는 rAF 콜백)만 XR 프레임으로 옮긴다.
  // 다른 rAF(에뮬레이터·브라우저 내부 등)는 그대로 둔다.
  window.requestAnimationFrame = cb => {
    if (!K.wingLoop && document.readyState === 'loading') { K.wingLoop = cb; log('원본 루프 확보'); }
    if (cb === K.wingLoop && K.renderer && K.renderer.xr.isPresenting) { queue.push(cb); return -1; }
    return raf0(cb);
  };
  function xrFrame(time, frame) {
    K.frame = frame;
    const q = queue; queue = [];
    K.inWing = true;
    q.forEach(cb => { try { cb(time); } catch (e) { console.error(e); } });
    K.inWing = false;
    if (!K.rendered) renderXR();          // 원본이 이번 프레임에 그리지 않았으면 직접 그린다
    K.rendered = false;
    tick(time, frame);
  }

  function patchComposer(c) {
    const r0 = c.render.bind(c);
    c.render = function (dt) {
      if (K.renderer && K.renderer.xr.isPresenting) { renderXR(); return; }   // XR 중 후처리는 생략
      return r0(dt);
    };
  }

  /* ---------- 3. 카메라와 rig ---------- */
  const rig = new T.Group(); rig.name = 'khxr-rig';
  const tmpP = new T.Vector3(), tmpQ = new T.Quaternion(), tmpS = new T.Vector3();
  let wingPose = null;          // 원본이 정한 카메라 로컬 변환
  let render0 = null;
  function setup() {
    const r = K.renderer;
    render0 = r.render.bind(r);
    r.render = function (scene, camera) {
      if (!r.xr.isPresenting || camera !== K.camera) return render0(scene, camera);
      renderXR();
    };
  }
  // XR 전용 카메라: 원본 카메라(near·fov 를 원본이 수시로 바꿈)는 건드리지 않는다
  const xrCam = new T.PerspectiveCamera(70, 1, 0.05, 3000); xrCam.name = 'khxr-cam';
  rig.add(xrCam);
  K.xrCam = xrCam;
  function renderXR() {
    const cam = K.camera, s = K.scene;
    if (!cam || !s) return;
    // 원본이 이번 프레임에 정한 카메라(시점 프리셋·내부 걷기) — 따라가기 판단에만 쓴다
    wingPose = { p: cam.position.clone(), q: cam.quaternion.clone() };
    applyMode();
    // 피규어(사용자 확대)일 때 near/far 는 실제 방 기준 미터로 해석된다
    xrCam.near = X.mode === 'ar' ? 0.02 : 0.05;
    xrCam.far = X.mode === 'ar' ? 50 : 3000;
    if (rig.parent !== s) s.add(rig);
    rig.updateMatrixWorld(true);
    if (!s.__khxrCull) patchCull(s);
    // 피규어: 대지 주변 반경만 남기는 디오라마 자르기(원본 단면용 clippingPlanes 는 잠시 보관 후 복원)
    const r = K.renderer, cp0 = r.clippingPlanes;
    if (X.mode === 'ar') r.clippingPlanes = cropPlanes();
    render0(s, xrCam);
    r.clippingPlanes = cp0;
    K.rendered = true;
  }
  /* ---------- 3-1. XR 최적화 프록시: 같은 재질 메시를 합쳐 draw call 을 줄인다 ----------
     원본 메시는 지우지 않고 XR 동안만 숨긴다. 원본이 씬을 다시 만들거나 표시를 바꾸면
     (보이는 메시 집합이 바뀌면) 프록시를 다시 만든다. */
  const OPT = K.opt = { on: !/[?&]noopt/.test(location.search), group: null, hidden: [], sig: '', t: 0 };
  function visibleMeshes() {
    const out = [];
    (function walk(o) {
      if (!o.visible || o === rig || o === OPT.group) return;
      if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && o.geometry && o.geometry.attributes.position && !Array.isArray(o.material)) out.push(o);
      for (const c of o.children) walk(c);
    })(K.scene);
    return out;
  }
  function attrKey(g) { return Object.keys(g.attributes).sort().join(','); }
  function mergeGroup(list) {
    // 위치·법선·uv 를 월드 좌표로 구워 하나의 BufferGeometry 로 합친다(색인 없는 형태로 통일)
    const names = Object.keys(list[0].geometry.attributes);
    let total = 0;
    const geos = list.map(m => { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld); total += g.attributes.position.count; return g; });
    const out = new T.BufferGeometry();
    for (const n of names) {
      const a0 = geos[0].attributes[n], arr = new a0.array.constructor(total * a0.itemSize);
      let off = 0; for (const g of geos) { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }
      out.setAttribute(n, new T.BufferAttribute(arr, a0.itemSize, a0.normalized));
    }
    geos.forEach(g => g.dispose());
    out.computeBoundingSphere();
    return out;
  }
  function buildProxy() {
    clearProxy();
    const t0 = performance.now();
    const meshes = visibleMeshes();
    const buckets = new Map();
    for (const m of meshes) {
      if (m.material.transparent && m.material.opacity < 0.999 && meshes.length > 0) { /* 투명도 정렬 유지를 위해 투명은 재질 단위로만 합침 */ }
      const k = m.material.uuid + '|' + attrKey(m.geometry) + '|' + m.castShadow;
      (buckets.get(k) || buckets.set(k, []).get(k)).push(m);
    }
    const grp = new T.Group(); grp.name = 'khxr-proxy';
    for (const list of buckets.values()) {
      if (list.length < 2) continue;    // 하나뿐이면 합칠 이득이 없다
      const mesh = new T.Mesh(mergeGroup(list), list[0].material);
      mesh.castShadow = list[0].castShadow; mesh.receiveShadow = list[0].receiveShadow;
      mesh.matrixAutoUpdate = false;
      grp.add(mesh);
      list.forEach(m => { m.visible = false; OPT.hidden.push(m); });
    }
    K.scene.add(grp);
    OPT.group = grp;
    OPT.sig = sigOf(meshes);
    OPT.stat = { meshes: meshes.length, merged: grp.children.length, ms: Math.round(performance.now() - t0) };
    log('최적화 프록시', JSON.stringify(OPT.stat));
  }
  function clearProxy() {
    OPT.hidden.forEach(m => { m.visible = true; }); OPT.hidden = [];
    if (OPT.group) { OPT.group.children.forEach(c => c.geometry.dispose()); K.scene.remove(OPT.group); OPT.group = null; }
  }
  function sigOf(list) { let h = list.length; for (const m of list) h = (h * 31 + m.id) | 0; return h + ':' + list.length; }
  function proxyCheck(time) {
    if (!OPT.on || time - OPT.t < 500) return;
    OPT.t = time;
    // 숨긴 원본은 잠깐 되돌려 "원본이 보이게 하려는 집합"을 계산한다
    OPT.hidden.forEach(m => { m.visible = true; });
    const sig = sigOf(visibleMeshes());
    OPT.hidden.forEach(m => { m.visible = false; });
    if (sig !== OPT.sig) buildProxy();
  }
  K.buildProxy = buildProxy; K.clearProxy = clearProxy;

  function cropPlanes() {
    const c = X.center, R = X.crop || 45;
    if (!X._crop || X._crop.c !== c || X._crop.R !== R) {
      X._crop = { c, R, p: [
        new T.Plane(new T.Vector3(1, 0, 0), -(c.x - R)), new T.Plane(new T.Vector3(-1, 0, 0), c.x + R),
        new T.Plane(new T.Vector3(0, 0, 1), -(c.z - R)), new T.Plane(new T.Vector3(0, 0, -1), c.z + R)] };
    }
    return X._crop.p;
  }
  // r128 은 양눈 시야를 합칠 때 눈 간격을 월드 단위로 재서, rig 를 키우면(피규어)
  // 합친 절두체의 near 가 커져 가까운 모형이 통째로 컬링된다.
  // 프레임 컬링 직전(scene.onBeforeRender)에 넉넉한 대칭 절두체로 바꿔 준다(뷰 공간 = 실제 방 미터).
  function patchCull(s) {
    s.__khxrCull = true;
    const prev = s.onBeforeRender;
    s.onBeforeRender = function (renderer, scene, camera, rt) {
      if (camera.isArrayCamera && rig.scale.x !== 1) {
        const n = 0.01, f = 100, e = n * Math.tan(Math.PI / 3);
        camera.projectionMatrix.makePerspective(-e, e, e, -e, n, f);
      }
      return prev.apply(this, arguments);
    };
  }

  /* ---------- 4. 모드: VR(1:1) / AR(피규어) ---------- */
  const X = K.state = { mode: null, fig: { pos: new T.Vector3(0, 0.75, -0.6), yaw: 0, scale: 1 / 200 }, follow: true, lastWing: null, stillT: 0 };
  const hidden = [];
  function applyMode() {
    const s = K.scene;
    if (X.mode === 'ar') {
      // 배경·안개·하늘·넓은 지면 숨김 (원본이 매 프레임 되돌려도 여기서 다시 적용)
      X.bg = s.background; X.fog = s.fog; s.background = null; s.fog = null;
      K.renderer.setClearAlpha(0);
      if (!X.hid) { hideBig(); X.hid = true; }
      // 피규어: 모형을 줄이는 대신 사용자를 키운다(원본 씬 변형 없음)
      const m = new T.Matrix4().compose(X.fig.pos, new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), X.fig.yaw), new T.Vector3(1, 1, 1).multiplyScalar(X.fig.scale));
      m.multiply(new T.Matrix4().makeTranslation(-X.center.x, -X.center.y, -X.center.z));
      m.invert().decompose(rig.position, rig.quaternion, rig.scale);
    }
  }
  function restoreAR() {
    const s = K.scene;
    if (X.bg !== undefined) s.background = X.bg;
    if (X.fog !== undefined) s.fog = X.fog;
    hidden.forEach(o => { o.visible = o.userData.khxrVis; }); hidden.length = 0; X.hid = false;
    K.renderer.setClearAlpha(1);
    rig.scale.set(1, 1, 1);
  }
  function hideBig() {
    const box = new T.Box3(), sz = new T.Vector3();
    K.scene.traverse(o => {
      if (!o.isMesh || !o.visible || o.parent === rig || (OPT.group && o.parent === OPT.group)) return;
      const sky = (K.skies || []).includes(o) || (o.material && o.material.uniforms && o.material.uniforms.sunPosition);
      let big = false;
      if (!sky) { box.setFromObject(o); box.getSize(sz); big = Math.max(sz.x, sz.z) > 160 && sz.y < 2; }
      if (sky || big) { o.userData.khxrVis = o.visible; o.visible = false; hidden.push(o); }
    });
    log('AR 배경 숨김', hidden.length + '개');
  }
  function sceneCenter() {
    // 우리 건물 중심: 원본 카메라 기본 target(컨트롤 중심)을 사용
    const t = K.controls ? K.controls.target.clone() : new T.Vector3();
    t.y = 0; return t;
  }

  /* ---------- 5. 세션 진입 ---------- */
  async function enter(mode) {
    const r = K.renderer;
    if (!navigator.xr || !r) return;
    const sessionMode = mode === 'ar' ? 'immersive-ar' : 'immersive-vr';
    const session = await navigator.xr.requestSession(sessionMode, {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['hand-tracking', 'bounded-floor', 'plane-detection', 'anchors', 'hit-test']
    });
    X.mode = mode;
    X.center = sceneCenter();
    r.xr.setReferenceSpaceType('local-floor');
    await r.xr.setSession(session);
    if (K.controls) { X.ctl0 = K.controls.enabled; K.controls.enabled = false; }
    if (mode === 'vr') snapToWing(true);
    if (mode === 'ar' && !X.hid) { hideBig(); X.hid = true; }   // 배경 정리 후 프록시를 만들어야 지면이 섞이지 않는다
    if (OPT.on) buildProxy();
    r.setAnimationLoop(xrFrame);
    buildUI();
    session.addEventListener('end', () => {
      r.setAnimationLoop(null);
      clearProxy();
      if (X.mode === 'ar') restoreAR();
      X.mode = null;
      rig.position.set(0, 0, 0); rig.quaternion.identity();
      if (K.controls) K.controls.enabled = X.ctl0 !== false;
      const q = queue; queue = []; q.forEach(cb => raf0(cb));   // 원본 루프를 화면 모드로 되돌림
      log('세션 종료');
    });
    log('세션 시작', sessionMode);
  }
  K.enter = enter;

  // 원본 시점(프리셋·내부 걷기)이 바뀌어 멈추면 사용자 위치를 그 시점으로 옮긴다
  function snapToWing(force) {
    const cam = K.camera; if (!cam) return;
    const p = cam.position, d = new T.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const yaw = Math.atan2(-d.x, -d.z);
    rig.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), yaw);
    // 원본 눈높이 → rig 바닥 높이 (헤드셋 실제 키만큼 내린다)
    rig.position.set(p.x, p.y - 1.6, p.z);
    X.lastWing = p.clone(); X.stillT = 0;
    if (force) log('원본 시점으로 이동', p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1));
  }

  /* ---------- 6. 입력과 이동 ---------- */
  const ray = new T.Raycaster();
  let ctrls = [];
  let lastTurn = 0;
  function tick(time, frame) {
    const r = K.renderer, session = r.xr.getSession();
    if (!session) return;
    // 원본 시점 변화 감지 (VR 만)
    if (X.mode === 'vr' && wingPose && X.follow) {
      if (X.lastWing && wingPose.p.distanceTo(X.lastWing) > 0.05) { X.moving = true; X.stillT = time; X.lastWing.copy(wingPose.p); }
      else if (X.moving && time - X.stillT > 250) { X.moving = false; snapToWing(true); }
    }
    for (const src of session.inputSources) {
      const gp = src.gamepad; if (!gp || src.hand) continue;
      const ax = gp.axes, h = src.handedness;
      if (h === 'left' && ax.length >= 4 && X.mode === 'vr') {
        // 왼쪽 스틱: 머리 방향 기준 걷기
        const x = ax[2], y = ax[3];
        if (Math.abs(x) > 0.15 || Math.abs(y) > 0.15) {
          const d = new T.Vector3(); xrCam.getWorldDirection(d); d.y = 0; d.normalize();
          const side = new T.Vector3(-d.z, 0, d.x);
          rig.position.addScaledVector(d, -y * 0.03).addScaledVector(side, x * 0.03);
          X.follow = false;
        }
      }
      if (h === 'right' && ax.length >= 4) {
        const x = ax[2], y = ax[3];
        if (X.mode === 'vr' && Math.abs(x) > 0.7 && time - lastTurn > 350) {   // 스냅 회전 30°
          rig.rotateY(-Math.sign(x) * Math.PI / 6); lastTurn = time;
        }
        if (X.mode === 'ar') {   // 피규어: 오른쪽 스틱 좌우=회전, 상하=크기
          if (Math.abs(x) > 0.15) X.fig.yaw -= x * 0.03;
          if (Math.abs(y) > 0.15) X.fig.scale = Math.min(1 / 20, Math.max(1 / 1000, X.fig.scale * (1 - y * 0.02)));
        }
      }
    }
    grabUpdate();
    uiUpdate(time);
    proxyCheck(time);
  }

  // 컨트롤러·손 공통: select(트리거/핀치)=패널 누르기·바닥 텔레포트, squeeze(그립)=피규어 잡기
  function initControllers() {
    const r = K.renderer;
    for (let i = 0; i < 2; i++) {
      const c = r.xr.getController(i);
      const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)]), new T.LineBasicMaterial({ color: 0x66ccff }));
      line.scale.z = 3; line.name = 'khxr-ray'; c.add(line);
      c.addEventListener('selectstart', () => onSelect(c));
      c.addEventListener('squeezestart', () => { c.userData.sq = true; grabStart(); });
      c.addEventListener('squeezeend', () => { c.userData.sq = false; grabStart(); });
      rig.add(c); ctrls.push(c);
      const h = r.xr.getHand(i); rig.add(h);
    }
  }
  function aim(c) {
    const m = new T.Matrix4().extractRotation(c.matrixWorld);
    ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
    ray.ray.direction.set(0, 0, -1).applyMatrix4(m).normalize();
    return ray;
  }
  function onSelect(c) {
    aim(c);
    if (UI.mesh && UI.mesh.visible) {
      const hit = ray.intersectObject(UI.mesh, false)[0];
      if (hit) { uiClick(hit.uv); return; }
    }
    if (X.mode === 'vr') {   // 텔레포트: 위를 향한 면에 닿으면 그 자리로
      ray.far = 60;
      const hits = ray.intersectObjects(K.scene.children.filter(o => o !== rig), true);
      const h = hits.find(x => x.face && x.object.visible && new T.Vector3().copy(x.face.normal).transformDirection(x.object.matrixWorld).y > 0.7);
      if (h) {
        const head = xrCam.position;   // rig 로컬 머리 위치(XR 이 매 프레임 갱신)
        const off = new T.Vector3(head.x, 0, head.z).applyQuaternion(rig.quaternion);
        rig.position.set(h.point.x - off.x, h.point.y, h.point.z - off.z);
        X.follow = false;
      }
    }
  }
  // 두 손 그립: 거리=크기, 각도=회전 / 한 손 그립: 이동
  let G = null;
  function grabStart() {
    const on = ctrls.filter(c => c.userData.sq);
    if (X.mode !== 'ar' || !on.length) { G = null; return; }
    G = { n: on.length, c: on, fig: { pos: X.fig.pos.clone(), yaw: X.fig.yaw, scale: X.fig.scale } };
  }
  // 컨트롤러는 rig 하위라 로컬 위치 = 실제 방 좌표(rig 이 피규어 역변환이어도 영향 없음)
  function realPos(c) { return c.position.clone(); }
  function grabUpdate() {
    if (!G) return;
    const now = G.c.map(realPos);
    if (!G.r0) G.r0 = now.map(v => v.clone());
    if (G.n === 1) {
      X.fig.pos.copy(G.fig.pos).add(now[0].clone().sub(G.r0[0]));
    } else {
      const d0 = G.r0[0].distanceTo(G.r0[1]), d1 = now[0].distanceTo(now[1]);
      const a0 = Math.atan2(G.r0[1].x - G.r0[0].x, G.r0[1].z - G.r0[0].z), a1 = Math.atan2(now[1].x - now[0].x, now[1].z - now[0].z);
      X.fig.scale = Math.min(1 / 20, Math.max(1 / 1000, G.fig.scale * d1 / Math.max(d0, 0.01)));
      X.fig.yaw = G.fig.yaw + (a1 - a0);
    }
  }

  /* ---------- 7. 공간 패널: 원본 DOM 컨트롤 미러 ---------- */
  const UI = K.ui = { items: [], page: 0, tab: 0, tabs: [] };
  function collect() {
    // 원본 화면의 실제 컨트롤을 그룹별로 수집(새 기능이 추가돼도 자동 반영)
    const groups = [];
    const add = (name, els) => { els = els.filter(usable); if (els.length) groups.push({ name, els }); };
    add('시점', [...document.querySelectorAll('#views button, .views button, [data-v]')]);
    const panel = document.getElementById('panel');
    if (panel) {
      let cur = null;
      panel.querySelectorAll('h2, button, input, select').forEach(el => {
        if (el.tagName === 'H2') { cur = { name: el.textContent.trim(), els: [] }; groups.push(cur); return; }
        if (cur && !el.closest('.pclose')) cur.els.push(el);
      });
    }
    const intl = document.querySelector('.app.int') ? [...document.querySelectorAll('#catTabs button, [data-iv], #exitInt, #dollBtn, #secBtn, #secAllBtn, #coreTop, #coreHall, [data-c], [data-w]')] : [];
    if (intl.length) groups.unshift({ name: '내부', els: intl });
    return groups.map(g => ({ name: g.name, els: g.els.filter(usable) })).filter(g => g.els.length);
  }
  function usable(el) {
    if (el.disabled || el.closest('[hidden]')) return false;
    if (el.tagName === 'INPUT' && /hidden|file|color|text|number/.test(el.type) && el.type !== 'range') return false;
    const cs = getComputedStyle(el); if (cs.display === 'none') return false;
    let p = el.parentElement; while (p && p !== document.body) { if (getComputedStyle(p).display === 'none' && !p.matches('#panel,.panel,aside')) return false; p = p.parentElement; }
    return true;
  }
  function label(el) {
    if (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox')) {
      const l = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
      return (l ? l.textContent : el.value).trim();
    }
    if (el.tagName === 'SELECT') return '▾ ' + (el.selectedOptions[0] ? el.selectedOptions[0].textContent.trim() : '');
    if (el.type === 'range') { const l = document.querySelector(`label[for="${el.id}"]`); return (l ? l.textContent.trim() + ' ' : '') + el.value; }
    if (el.type === 'date' || el.type === 'time') return el.type + ' ' + el.value;
    return (el.textContent || el.title || el.getAttribute('aria-label') || '').trim();
  }
  function isOn(el) { return el.getAttribute('aria-pressed') === 'true' || el.checked === true; }
  function buildUI() {
    if (!ctrls.length) initControllers();
    if (UI.mesh) { UI.mesh.visible = true; return; }
    UI.cv = document.createElement('canvas'); UI.cv.width = 1024; UI.cv.height = 1280;
    UI.ctx = UI.cv.getContext('2d');
    UI.tex = new T.CanvasTexture(UI.cv);
    UI.mesh = new T.Mesh(new T.PlaneGeometry(0.48, 0.6), new T.MeshBasicMaterial({ map: UI.tex, transparent: true, depthTest: false }));
    UI.mesh.renderOrder = 999; UI.mesh.name = 'khxr-panel';
    rig.add(UI.mesh);
    UI.mesh.position.set(-0.45, 1.35, -0.7); UI.mesh.rotation.y = 0.45;
  }
  const ROW = 70, TOP = 150, PER = 15;
  function draw() {
    const g = UI.ctx, W = 1024, H = 1280;
    UI.tabs = collect();
    if (UI.tab >= UI.tabs.length) UI.tab = 0;
    const tab = UI.tabs[UI.tab] || { name: '-', els: [] };
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(22,26,30,0.92)'; roundRect(g, 0, 0, W, H, 36); g.fill();
    g.font = '600 36px system-ui,sans-serif'; g.fillStyle = '#fff'; g.textBaseline = 'middle';
    g.fillText('케이프혼타워 · ' + (X.mode === 'ar' ? '피규어' : 'VR'), 36, 50);
    // 탭: 이전/다음
    g.font = '30px system-ui,sans-serif'; g.fillStyle = '#9fd';
    g.fillText('◀', 36, 110); g.fillText('▶', W - 70, 110);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(`${tab.name}  (${UI.tab + 1}/${UI.tabs.length})`, W / 2, 110); g.textAlign = 'left';
    UI.items = [];
    const pages = Math.max(1, Math.ceil(tab.els.length / PER)); if (UI.page >= pages) UI.page = 0;
    tab.els.slice(UI.page * PER, UI.page * PER + PER).forEach((el, i) => {
      const y = TOP + i * ROW;
      g.fillStyle = isOn(el) ? '#2f7d6d' : 'rgba(255,255,255,0.08)'; roundRect(g, 30, y, W - 60, ROW - 10, 14); g.fill();
      g.fillStyle = '#fff'; g.font = '30px system-ui,sans-serif';
      g.fillText(label(el).slice(0, 34), 54, y + (ROW - 10) / 2);
      UI.items.push({ y0: y, y1: y + ROW - 10, el });
    });
    const by = H - 90;
    g.fillStyle = 'rgba(255,255,255,0.12)';
    [[30, '이전 쪽'], [270, '다음 쪽'], [510, X.mode === 'ar' ? '안으로 들어가기' : '피규어로 보기'], [770, '나가기']].forEach(([x, t]) => { roundRect(g, x, by, 224, 64, 14); g.fill(); });
    g.fillStyle = '#fff'; g.font = '26px system-ui,sans-serif'; g.textAlign = 'center';
    [[142, `이전 쪽`], [382, `다음 ${UI.page + 1}/${pages}`], [622, X.mode === 'ar' ? '안으로 들어가기' : '피규어로 보기'], [882, '나가기']].forEach(([x, t]) => g.fillText(t, x, by + 32));
    g.textAlign = 'left';
    UI.tex.needsUpdate = true;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  let lastDraw = 0;
  function uiUpdate(time) { if (UI.mesh && time - lastDraw > 400) { lastDraw = time; draw(); } }
  function uiClick(uv) {
    const x = uv.x * 1024, y = (1 - uv.y) * 1280;
    if (y > 80 && y < 140) { UI.tab = (UI.tab + (x < 512 ? -1 : 1) + UI.tabs.length) % UI.tabs.length; UI.page = 0; draw(); return; }
    if (y > 1190) {
      if (x < 254) UI.page = Math.max(0, UI.page - 1);
      else if (x < 494) UI.page++;
      else if (x < 734) switchMode();
      else K.renderer.xr.getSession().end();
      draw(); return;
    }
    const it = UI.items.find(i => y >= i.y0 && y <= i.y1);
    if (it) { press(it.el); setTimeout(draw, 60); }
  }
  function press(el) {
    if (el.tagName === 'SELECT') { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (el.type === 'range') { const st = +(el.step || 1), mx = +el.max, mn = +el.min; let v = +el.value + st * Math.max(1, Math.round((mx - mn) / st / 10)); if (v > mx) v = mn; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    else el.click();
    X.follow = true;
    log('원본 컨트롤 실행:', label(el));
  }
  K.press = press; K.collect = collect;
  // 같은 세션 안에서 피규어 ↔ 1:1 전환 (AR 세션에서 1:1 은 배경을 다시 그려 몰입처럼 보이게)
  function switchMode() {
    if (X.mode === 'ar') { restoreAR(); X.mode = 'vr'; X.arSession = true; snapToWing(true); }
    else { X.mode = 'ar'; X.center = sceneCenter(); }
  }
  K.switchMode = switchMode;

  /* ---------- 8. 진입 버튼 ---------- */
  async function addButtons() {
    if (!navigator.xr) { log('WebXR 없음: 화면 모드만'); return; }
    const [vr, ar] = await Promise.all([navigator.xr.isSessionSupported('immersive-vr').catch(() => false), navigator.xr.isSessionSupported('immersive-ar').catch(() => false)]);
    K.support = { vr, ar };
    if (!vr && !ar) return;
    const box = document.createElement('div');
    box.id = 'khxr-bar';
    box.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;display:flex;gap:10px';
    const mk = (t, m) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font:600 15px system-ui,sans-serif;padding:12px 18px;border-radius:999px;border:0;background:#1f5f5b;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer'; b.onclick = () => enter(m).catch(e => { log('진입 실패', e.message); alert('XR 진입 실패: ' + e.message); }); box.appendChild(b); };
    if (vr) mk('VR로 들어가기', 'vr');
    if (ar) mk('내 공간에 놓기', 'ar');
    document.body.appendChild(box);
    log('XR 버튼 표시', JSON.stringify(K.support));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButtons); else setTimeout(addButtons, 0);
})();
