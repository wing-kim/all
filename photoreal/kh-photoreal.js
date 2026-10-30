/*
  케이프혼타워 실사 3D 계층 (photoreal/kh-photoreal.js)
  - new/3d-model.html 끝에서 불러온다. Wing 코드가 열어 준 window.KHPR(연결 통로)로 내부 재질·층 정보를 읽는다.
  - 원칙: 두 번째 렌더러나 장면 복사를 만들지 않는다. Wing의 three.js r128 장면과 '렌더' 모드를 그대로 쓰고,
    재질만 실사 재질로 바꿔 끼운다. 조합을 바꾸면 Wing이 건물을 다시 만들고, 이 계층은 캐시된 재질을 다시 끼울 뿐이라
    텍스처를 다시 받거나 셰이더를 다시 만들지 않는다.
  - 텍스처는 월드 좌표 투영(벽면 방향 기준)으로 붙여서 원본 형상의 UV와 상관없이 실제 크기로 보인다.
  - 조명은 실시간 광원을 늘리지 않는다(광원이 늘면 모든 셰이더가 다시 만들어지고 퀘스트에서 비싸다).
    지하 주차장·1층 실내는 조명기구 위치로 실행 중에 만든 '절차적 라이트맵'을 재질에 더한다.
  - 주소 옵션: ?pr=1 (실사 3D로 시작, 우선 조합) &pf=glass|brick|stack|colonnade &lv=1F|B1|B2|B3
*/
(function () {
  'use strict';
  if (window.KHPRLayer) return;
  const VER = '1030.e';
  const Q = new URLSearchParams(location.search);
  const SRC = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('./', SRC).href;
  const PR = window.KHPRLayer = { ver: VER, on: false, t: {}, log: [], stat: {} };
  const log = (...a) => { const t = a.join(' '); PR.log.push(t); if (PR.log.length > 200) PR.log.shift(); console.log('[khpr]', t); };
  const now = () => performance.now();
  let T, K, R, scene;

  /* ================= 0. 시작 ================= */
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function boot() {
    for (let i = 0; i < 150 && !(window.KHPR && window.KHXR); i++) await new Promise(r => setTimeout(r, 100));
    if (!window.KHPR || !window.KHXR) { log('연결 통로(KHPR)가 없어 실사 3D를 켜지 않습니다'); return; }
    // K 는 복사하지 않는다(LEVELS 등은 읽을 때마다 최신 값)
    T = window.THREE; K = window.KHPR; R = window.KHXR.renderer; scene = window.KHXR.scene;
    PR.K = K;
    ui();
    scene.onBeforeRender = (function (prev) { return function () { if (prev) prev.apply(this, arguments); if (PR.on) frame(); }; })(scene.onBeforeRender);
    // 실사 3D 를 고르기 전에 자산을 낮은 우선순위로 미리 받아 둔다(데이터 절약 모드·느린 회선 제외). 고르는 순간 대부분 저장본에서 읽는다
    setTimeout(prefetch, Q.get('pr') === '1' ? 0 : 2500);
    if (Q.get('pr') === '1') { await new Promise(r => setTimeout(r, 300)); preset(Q.get('pf') || 'glass'); enable(true).then(() => { const lv = Q.get('lv'); if (lv) goLevel(lv); }); }
  }

  /* ================= 1. 자산 ================= */
  function prefetch() {
    const c = navigator.connection; if (c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ''))) { log('미리받기 생략(절약 모드)'); return; }
    const q0 = f => BASE + f + (/^(bake|codex|context)\//.test(f) ? '?v=' + VER : '');
    fetch(BASE + 'prefetch.json?v=' + VER).then(r => r.ok ? r.json() : null).then(async j => {
      if (!j) return; const q = j.files.slice(), t0 = now(); PR.pre = { n: q.length, done: 0, bytes: j.bytes };
      const worker = async () => { while (q.length) { const f = q.shift(); try { const r = await fetch(q0(f), { priority: 'low' }); await r.arrayBuffer(); } catch (e) {} PR.pre.done++; } };
      await Promise.all([worker(), worker(), worker()]); PR.pre.ms = Math.round(now() - t0); log('미리받기 완료', PR.pre.ms + 'ms', Math.round(j.bytes / 1e6) + 'MB');
    }).catch(() => {});
  }

  let vendorP = null;
  function vendor() {
    return vendorP || (vendorP = Promise.all(['RGBELoader.js', 'GLTFLoader.js', 'DRACOLoader.js'].map(f => loadScript(BASE + 'vendor/' + f))));
  }
  const TX = new Map(), pend = { n: 0, done: 0 };
  const isMobile = matchMedia('(pointer:coarse)').matches;
  // 자리표시 이미지: 받는 동안 검게 보이지 않게, 평균색(색상)·평평한 노멀·중간 거칠기로 먼저 그린다
  function solid(rgb) { const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d'); g.fillStyle = rgb; g.fillRect(0, 0, 4, 4); return c; }
  const HOLD = { color: '#9a9690', normal: '#8080ff', rough: '#b0b0b0' };
  function tex(name, kind) {
    const key = name + '_' + kind;
    if (TX.has(key)) return TX.get(key);
    const t = new T.Texture(solid(HOLD[kind] || '#ffffff'));
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = isMobile ? 4 : 8;
    if (kind === 'color') t.encoding = T.sRGBEncoding;
    t.needsUpdate = true; TX.set(key, t);
    pend.n++;
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { t.image = img; t.needsUpdate = true; pend.done++; progress(); };
    img.onerror = () => { pend.done++; log('텍스처 실패', key); progress(); };
    img.src = BASE + 'tex/' + key + '.webp';
    return t;
  }
  const WHITE = (() => { let t = null; return () => t || (t = Object.assign(new T.CanvasTexture(solid('#ffffff')), { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping })); })();
  function progress() {
    const el = document.getElementById('pr-stat'); if (!el) return;
    if (pend.done >= pend.n && !PR.t.assets && PR.t.enable0) { PR.t.assets = Math.round(now() - PR.t.enable0); }
    statLine();
  }
  // 하늘 HDR(Poly Haven, CC0) → PMREM. 받기 전에는 Wing 렌더 모드의 하늘 반사를 그대로 쓴다
  let envDay = null, envPark = null, envP = null, skyBG = null;
  // 시간대별 하늘 사진(Poly Haven CC0): 낮(오전·오후), 석양, 야간. 사진 속 해(가장 밝은 화소)를 Wing 의 실제 태양 방위에 맞춰 돌린 뒤
  // 배경 큐브와 환경광(PMREM)을 만든다. 시간대나 날짜·시각으로 해 방위가 바뀌면(5° 이상) 다시 만든다(약 30～60ms).
  const SKY = { day: 'daylight-sky_1k.hdr', sunset: 'sunset-sky_1k.hdr', night: 'night-sky_1k.hdr' }, SKYD = {};
  let skyCur = { key: '', az: 999, busy: false };
  const half = h => { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 31, f = h & 1023; return e === 0 ? s * 6.1035e-5 * (f / 1024) : e === 31 ? 0 : s * Math.pow(2, e - 15) * (1 + f / 1024); };
  function skyLoad(key) {
    if (SKYD[key]) return SKYD[key];
    return (SKYD[key] = vendor().then(() => new Promise(res => new T.RGBELoader().setDataType(T.HalfFloatType).load(BASE + 'tex/' + SKY[key], h => {
      // 사진 속 해의 가로 위치(u): 위쪽 절반에서 가장 밝은 열
      const { width: w, height: hh, data } = h.image; let best = -1, bu = 0.5;
      for (let y = 0; y < hh / 2; y += 2) for (let x = 0; x < w; x += 2) { const i = (y * w + x) * 4, v = half(data[i]) + half(data[i + 1]) + half(data[i + 2]); if (v > best) { best = v; bu = x / w; } }
      h.magFilter = h.minFilter = T.LinearFilter; h.generateMipmaps = false;
      res({ tex: h, sunU: bu });
    }, undefined, () => { log('하늘 실패', key); res(null); }))));
  }
  function loadEnv() { return skyLoad('day'); }
  async function skyUpdate() {
    const R3D = K.R3D, slot = bakeSlot(), key = slot === 'night' ? 'night' : slot === 'sunset' ? 'sunset' : 'day';
    const d = K.sun.position, azW = Math.atan2(d.z, d.x);
    if (skyCur.busy || (key === skyCur.key && Math.abs(azW - skyCur.az) < 0.09)) return;
    skyCur.busy = true;
    const sd = await skyLoad(key); if (!sd) { skyCur.busy = false; return; }
    // 구 안쪽에 사진을 입혀 돌린 장면 → 큐브 카메라(배경) → PMREM(환경광)
    const sc = new T.Scene(), geo = new T.SphereGeometry(100, 64, 32), mat = new T.MeshBasicMaterial({ map: sd.tex, side: T.BackSide, depthWrite: false });
    mat.color.setScalar({ day: 1, sunset: 0.6, night: 0.12 }[key]);   // 야간 사진은 달·지평선 빛이 있어 Wing 야간 노출(1.35)에서 밝게 보이므로 낮춘다
    const sph = new T.Mesh(geo, mat); sph.rotation.y = (Math.PI - 2 * Math.PI * sd.sunU) - azW; sc.add(sph);
    const size = isMobile ? 512 : 1024;
    if (!skyCur.rt) { skyCur.rt = new T.WebGLCubeRenderTarget(size, { type: T.HalfFloatType, generateMipmaps: true, minFilter: T.LinearMipmapLinearFilter }); skyCur.cam = new T.CubeCamera(1, 1000, skyCur.rt); }
    const keepTM = R.toneMapping, keepEnc = R.outputEncoding; R.toneMapping = T.NoToneMapping; R.outputEncoding = T.LinearEncoding;
    skyCur.cam.update(R, sc);
    const pm = new T.PMREMGenerator(R), env = pm.fromScene(sc, 0).texture; pm.dispose();
    R.toneMapping = keepTM; R.outputEncoding = keepEnc;
    geo.dispose(); mat.dispose();
    if (skyCur.env && skyCur.env !== env) skyCur.env.dispose && skyCur.env.dispose();
    skyCur.env = env; skyBG = skyCur.rt.texture; envDay = env;
    skyCur.key = key; skyCur.az = azW; skyCur.busy = false;
    if (PR.t.env == null && PR.t.enable0) { PR.t.env = Math.round(now() - PR.t.enable0); log('하늘', PR.t.env + 'ms'); }
  }
  // 지하 주차장 반사용 환경: 어두운 천장 + 밝은 LED 줄 + 베이지 벽(실행 중 PMREM, 약 20ms)
  function parkEnv() {
    if (envPark) return envPark;
    const s = new T.Scene(), box = new T.Mesh(new T.BoxGeometry(40, 6, 40), new T.MeshBasicMaterial({ color: 0x26282b, side: T.BackSide }));
    s.add(box);
    const wall = new T.MeshBasicMaterial({ color: 0x8a8274 }), led = new T.MeshBasicMaterial({ color: new T.Color(8, 8, 7.6) });
    [[0, 0, -19.8, 40, 4, 0.1], [0, 0, 19.8, 40, 4, 0.1], [-19.8, 0, 0, 0.1, 4, 40], [19.8, 0, 0, 0.1, 4, 40]].forEach(([x, y, z, w, h, d]) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), wall); m.position.set(x, y - 0.8, z); s.add(m); });
    for (let x = -16; x <= 16; x += 4) for (let z = -16; z <= 16; z += 6) { const m = new T.Mesh(new T.BoxGeometry(0.3, 0.05, 1.6), led); m.position.set(x, 2.9, z); m.scale.setScalar(1); s.add(m); }
    const pm = new T.PMREMGenerator(R); envPark = pm.fromScene(s, 0.02).texture; pm.dispose();
    return envPark;
  }

  /* ================= 2. 셰이더 보강 ================= */
  // 월드 투영 UV: 바닥·천장은 XZ, 벽은 벽면을 따라 (수평 거리, 높이). 원본 UV와 상관없이 실제 크기(prScale = 1/타일 m)
  const VERT_DECL = 'varying vec3 vPrW;\nvarying vec3 vPrN;\n';
  const VERT_MAIN = `
  {vec4 prWP=vec4(transformed,1.0);vec3 prNo=objectNormal;
  #ifdef USE_INSTANCING
  prWP=instanceMatrix*prWP;prNo=mat3(instanceMatrix)*prNo;
  #endif
  prWP=modelMatrix*prWP;vPrW=prWP.xyz;vPrN=normalize(mat3(modelMatrix)*prNo);}`;
  function patch(mat, o) {
    // o: {world:scale|0, glass:{a0,a1}, light:{lm,box,k,amb,cove}}
    mat.userData.pr = o;
    // XR 병합은 텍스처 없는 재질을 복제해 꼭짓점 색으로 굽는데, 복제본에는 셰이더 보강이 따라가지 않는다 → 보강 재질은 흰 텍스처를 붙여 굽기 대상에서 뺀다
    if (!mat.map) mat.map = WHITE();
    const key = ['pr', o.world ? 'w' : '', o.roof ? 'r' : '', o.under ? 'u' : '', o.glass ? 'g' : '', o.light ? 'l' + (o.light.lm ? 'm' : '') + (o.light.cove ? 'c' : '') : ''].join('');
    // 원래 재질이 가진 셰이더 보강(예: glTF 스페큘러·글로시니스 재질)은 지우지 않고 먼저 실행한다
    const prev = mat.onBeforeCompile !== T.Material.prototype.onBeforeCompile ? mat.onBeforeCompile : null, prevKey = prev ? mat.customProgramCacheKey() : '';
    mat.customProgramCacheKey = () => prevKey + key;
    mat.onBeforeCompile = (sh, rr) => {
      if (prev) prev.call(mat, sh, rr);
      const U = sh.uniforms;
      let vs = sh.vertexShader, fs = sh.fragmentShader;
      vs = VERT_DECL + vs.replace('#include <project_vertex>', '#include <project_vertex>' + VERT_MAIN);
      fs = 'varying vec3 vPrW;\nvarying vec3 vPrN;\n' + fs;
      if (o.world) {
        U.prScale = { value: o.world };
        fs = fs.replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\nuniform float prScale;\nvec2 prUV;\n#define vUv prUV\n');
        fs = fs.replace('void main() {', `void main() {
  {vec3 n=normalize(vPrN);if(abs(n.y)>0.7)prUV=vPrW.xz*prScale;else{
    float cv=length(fwidth(n))/max(length(fwidth(vPrW)),1e-4);   // 곡면(둥근 기둥 등)은 축 투영, 평면 벽은 벽면을 따라
    vec2 t=cv>0.5?(abs(n.x)>abs(n.z)?vec2(0.0,1.0):vec2(1.0,0.0)):normalize(vec2(-n.z,n.x));prUV=vec2(dot(vPrW.xz,t),vPrW.y)*prScale;}}`);
      }
      // 아래를 보는 면(바닥판의 밑면 = 아래층 천장)은 천장 색·무광으로
      if (o.under) { U.prUnder = { value: o.under }; fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\nuniform vec3 prUnder;\n');
        fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\nbool prDown=normalize(vPrN).y<-0.5;if(prDown)diffuseColor.rgb=prUnder;');
        fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif(prDown)roughnessFactor=0.92;'); }
      if (o.roof) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\nif(abs(normalize(vPrN).y)>0.7)diffuseColor.rgb=diffuse*0.5;');
      if (o.light) {
        U.prAmb = { value: o.light.amb || new T.Color(0, 0, 0) };
        U.prK = { value: o.light.k || 0 };
        // 굽기(BAKE.u)는 모든 실내 재질이 같은 uniform 객체를 공유한다: 시간대·층이 바뀌면 한 번만 바꾸면 된다
        Object.assign(U, { prBake: BAKE.u.tex, prBakeK: BAKE.u.k, prBakeOn: BAKE.u.on, prLv: BAKE.u.lv, prLvBox: BAKE.u.box, prLvN: BAKE.u.n, prAtlas: BAKE.u.atlas });
        let dec = 'uniform vec3 prAmb;uniform float prK;uniform sampler2D prBake;uniform float prBakeK;uniform float prBakeOn;uniform vec4 prLv[16];uniform vec4 prLvBox[16];uniform int prLvN;uniform vec2 prAtlas;\n';
        let add = 'float prFill=1.0-0.85*prBakeOn;irradiance+=prAmb*PI*prFill;';
        if (o.light.lm) { U.prLM = { value: o.light.lm }; U.prBox = { value: o.light.box }; dec += 'uniform sampler2D prLM;uniform vec4 prBox;\n'; add += 'irradiance+=texture2D(prLM,(vPrW.xz-prBox.xy)*prBox.zw).rgb*prK*PI*prFill*(normalize(vPrN).y<-0.5?0.12:1.0);'; }
        if (o.light.cove) { U.prCove = { value: o.light.cove }; dec += 'uniform vec4 prCove;\n'; add += 'irradiance+=vec3(1.0,0.82,0.62)*prCove.z*PI*smoothstep(prCove.x,prCove.y,vPrW.y);'; }
        // 구운 조도: 표면 높이로 층을 찾고(층 바닥～천장), 바닥 타일(위를 받는 빛)과 천장 타일(아래를 받는 빛)을 법선으로 섞는다
        add += `if(prBakeOn>0.5){vec4 lv=vec4(0.0);vec4 bx=vec4(0.0);bool hit=false;
  for(int i=0;i<16;i++){if(i>=prLvN)break;vec4 q=prLv[i];if(vPrW.y>=q.x-0.4&&vPrW.y<q.y+0.45){lv=q;bx=prLvBox[i];hit=true;}}
  if(hit){vec2 uv=clamp(vec2((vPrW.x-bx.x)*bx.z,1.0-(vPrW.z-bx.y)*bx.w),0.004,0.996);
    vec2 tf=vec2(mod(lv.z,prAtlas.x),floor(lv.z/prAtlas.x)),tc=vec2(mod(lv.w,prAtlas.x),floor(lv.w/prAtlas.x));
    vec3 ef=pow(texture2D(prBake,(tf+uv)/prAtlas).rgb,vec3(2.2)),ec=pow(texture2D(prBake,(tc+uv)/prAtlas).rgb,vec3(2.2));
    irradiance+=mix(ec,ef,clamp(normalize(vPrN).y*0.5+0.5,0.0,1.0))*prBakeK;iblIrradiance*=0.25;}}`;
        fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\n' + dec);
        fs = fs.replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\n' + add);
      }
      if (o.glass) {
        // 프레넬 투명도: 정면에서는 안이 비치고 비스듬히 보면 하늘이 비친다. 반사광은 투명도로 깎지 않는다
        U.prA = { value: new T.Vector2(o.glass.a0, o.glass.a1) };
        fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\nuniform vec2 prA;\n');
        fs = fs.replace('#include <output_fragment>', `
  {float prF=pow(1.0-abs(dot(normalize(vViewPosition),normal)),4.0);float prAl=clamp(mix(prA.x,prA.y,prF)*opacity/0.88,0.03,1.0);
  vec3 prSp=reflectedLight.directSpecular+reflectedLight.indirectSpecular;vec3 prDf=outgoingLight-prSp;
  gl_FragColor=vec4(prDf+prSp/prAl,prAl);}`);
      }
      sh.vertexShader = vs; sh.fragmentShader = fs;
      mat.userData.shader = sh;
    };
    mat.extensions = Object.assign({}, mat.extensions, { derivatives: true });
    mat.needsUpdate = true;
    return mat;
  }

  /* ================= 2-1. 구운 빛 (Blender Cycles, 시간대 4개) =================
     photoreal/bake/manifest.json 과 시간대별 아틀라스(bake-am|pm|sunset|night.png). 만드는 법은 photoreal/tools/bake/.
     Wing 의 시간대(오전·오후·석양·야간)를 따르고, 날짜·시각을 직접 고르면 해 높이로 가장 가까운 시간대를 쓴다. */
  const BAKE = { man: null, tex: {}, slot: null, sig: '', gain: { am: 1, pm: 1, sunset: 1, night: 1 },
    u: { tex: { value: null }, k: { value: 0 }, on: { value: 0 }, lv: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, box: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 1, 1)) }, n: { value: 0 }, atlas: { value: new THREE.Vector2(1, 1) } } };
  let bakeP = null;
  function loadBake() {
    return bakeP || (bakeP = fetch(BASE + 'bake/manifest.json?v=' + VER).then(r => r.ok ? r.json() : null).then(m => { BAKE.man = m; if (m) { BAKE.u.atlas.value.set(m.cols, m.rows); log('굽기 목록', Object.keys(m.slots).join(',')); } }).catch(() => log('굽기 없음')));
  }
  function bakeSlot() {
    const R3D = K.R3D;
    if (!R3D.custom) return R3D.time;
    const c = R3D.sunNow; if (!c || c.el < -2) return 'night'; if (c.el < 7) return 'sunset'; return (R3D.ch || 12) < 12 ? 'am' : 'pm';
  }
  function bakeTex(slot) {
    if (BAKE.tex[slot]) return BAKE.tex[slot];
    const info = BAKE.man.slots[slot]; if (!info) return null;
    const t = BAKE.tex[slot] = new T.Texture(); t.encoding = T.LinearEncoding; t.generateMipmaps = false; t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.userData = { ready: false };
    const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; t.userData.ready = true; if (PR.t.bake == null && PR.t.enable0) PR.t.bake = Math.round(now() - PR.t.enable0); }; img.src = BASE + 'bake/' + info.file + '?v=' + VER;
    return t;
  }
  // 매 프레임: 시간대·층 배치가 바뀌었을 때만 uniform 을 바꾼다
  function bakeUpdate() {
    const m = BAKE.man; if (!m) { BAKE.u.on.value = 0; return; }
    const slot = bakeSlot(), t = bakeTex(slot);
    const sig = slot + '|' + K.LEVELS.map(l => l.key + K.floorTop(l).toFixed(2) + K.ceilOf(l).toFixed(2)).join(',');
    if (t && t.userData.ready && sig !== BAKE.sig) {
      BAKE.sig = sig; BAKE.slot = slot;
      BAKE.u.tex.value = t; BAKE.u.k.value = m.slots[slot].scale * (BAKE.gain[slot] || 1);
      let n = 0;
      K.LEVELS.forEach(L => {
        if (n >= 16 || L.kind === 'roof') return;
        const b = m.levels.find(q => q.key === L.key) || m.levels.filter(q => q.kind === L.kind).pop(); if (!b) return;
        // 층고가 바뀌어도 같은 층의 굽기를 늘려 쓴다(현재 층의 바닥·천장 높이 + 굽기의 평면 범위)
        BAKE.u.lv.value[n].set(K.floorTop(L), K.ceilOf(L), b.tile[0], b.tile[1]);
        const [x0, z0, x1, z1] = b.box; BAKE.u.box.value[n].set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)); n++;
      });
      BAKE.u.n.value = n;
    }
    BAKE.u.on.value = BAKE.u.tex.value && BAKE.u.tex.value.userData.ready ? 1 : 0;
  }
  PR.bake = BAKE;

  /* ================= 3. 재질 처방 ================= */
  const lin = h => new T.Color(h).convertSRGBToLinear();
  // 모든 실사 재질: lin = 이미 선형 색(Wing linearize() 제외), EXTRA = 캐시 밖 재질(가구 등)의 반사 세기 되돌리기 목록
  const EXTRA = new Set();
  function std(o) { const m = new T.MeshStandardMaterial(o); m.userData.lin = true; return m; }
  const keepEnv = m => { m.userData.lin = true; m.userData.prEnv = m.envMapIntensity; EXTRA.add(m); return m; };
  // 텍스처 세트 재질: name 세트의 color/normal/rough, w = 타일 크기(m)
  // 중립 세트: 오프라인에서 색 기울기를 없애고 선형 평균을 0.51로 맞춘 텍스처. tint 는 '보이는 평균색'(sRGB)
  const NEUTRAL = new Set(['asphalt_02', 'ground-concrete', 'plaster-white', 'concrete-wall', 'sidewalk-pavers', 'facade-granite', 'office-concrete', 'wall-beige']);
  function texMat(name, w, o = {}) {
    const m = std(Object.assign({ map: tex(name, 'color'), normalMap: o.noNormal ? null : tex(name, 'normal'), roughnessMap: o.noRough ? null : tex(name, 'rough'), roughness: 1, metalness: 0 }, o.p || {}));
    if (NEUTRAL.has(name)) m.color = lin(o.tint != null ? o.tint : 0xbdbdbd).multiplyScalar(1 / 0.51);
    else if (o.tint != null) m.color = lin(o.tint);
    if (o.ns) m.normalScale.set(o.ns, o.ns);
    m.envMapIntensity = o.env != null ? o.env : 0.7;
    return patch(m, { world: 1 / w, light: o.light, roof: o.roof, under: o.under });
  }
  function glassMat(a0, a1, o = {}) {
    const m = std({ color: 0x8aa0aa, roughness: o.r != null ? o.r : 0.03, metalness: 0, transparent: true, depthWrite: false, side: T.FrontSide, opacity: 0.88 });
    m.envMapIntensity = o.env || 1.15;
    return patch(m, { glass: { a0, a1 } });
  }
  const metal = (c, r, e = 1) => { const m = std({ color: lin(c), metalness: 1, roughness: r }); m.envMapIntensity = e; return m; };
  const paint = (c, r, e = 0.6, light) => { const m = std({ color: lin(c), metalness: 0, roughness: r }); m.envMapIntensity = e; return light ? patch(m, { light }) : m; };

  // 실내 조명 수준(조사광 근사). 1층 카페는 따뜻한 낮 조명, 위층 사무실은 중립 백색
  const AMB = { g: () => new T.Color(1.0, 0.86, 0.68).multiplyScalar(0.55), u: () => new T.Color(0.92, 0.9, 0.86).multiplyScalar(0.45) };

  // 원본 재질 → 실사 재질(구역별). 구역: x 외피, g 1층, u 위층, b:B1… 지하
  const CACHE = new Map();
  let RX = null;   // 처방 표(첫 사용 때 만든다)
  function recipes() {
    if (RX) return RX;
    const { M, FM, DZM, BM2, RMAT, R3D, CM2, DM, FX } = K;
    const glassUp = () => glassMat(0.26, 0.93), glassG = () => glassMat(0.1, 0.85), glassP = () => glassMat(0.16, 0.8);
    RX = new Map([
      [M.glass, { make: glassUp, sync: ['color', 'opacity', 'emissive'] }],
      [M.glass1, { make: glassG, sync: ['color', 'opacity', 'emissive'] }],
      [M.door, { make: glassG }], [FM.gpar, { make: glassP }], [K.CGL, { make: glassP }], [DM.shop, { make: () => glassMat(0.2, 0.85), sync: ['emissive'] }],
      [FM.spandrel, { make: () => { const m = std({ color: lin(0x1b252c), metalness: 0.2, roughness: 0.06 }); m.envMapIntensity = 1.3; return m; } }],
      [FM.silver, { make: () => metal(0xbfc4c8, 0.32) }], [R3D.mullM, { make: () => metal(0xa9aeb2, 0.34) }], [M.metal, { make: () => metal(0xb8bcbe, 0.3) }],
      [R3D.mullD, { make: () => metal(0x2a2d30, 0.38, 0.8) }], [FM.winFrame, { make: () => metal(0x1d1f22, 0.4, 0.7) }], [FM.fascia, { make: () => metal(0x232427, 0.42, 0.7) }], [M.dark, { make: () => metal(0x2b2c2e, 0.45, 0.6) }],
      [FM.brick, { make: () => texMat('brick', 1.0, { ns: 1.2 }) }], [FM.brickHead, { make: () => texMat('brick', 1.0, { tint: 0xb9a49a, ns: 1.2 }) }],
      [DZM.white, { make: () => texMat('plaster-white', 1.2, { tint: 0xf2efe9, ns: 0.5 }) }],
      // 자이언트 오더 기둥: 밝은 석회석 판(화강석 판 줄눈 노멀 + 중립 회반죽 색)
      [DZM.col, { make: () => { const m = texMat('facade-granite', 1.8, { tint: 0xd9ccb6, ns: 0.7 }); return m; } }],
      [DZM.slab, { make: () => texMat('plaster-white', 1.2, { tint: 0xece8e1, ns: 0.4 }) }],
      [FM.stone, { make: () => texMat('facade-granite', 1.8, { tint: 0xd6ccbd }) }],
      [FM.stoneDark, { make: () => texMat('facade-granite', 1.8, { tint: 0x9d968b }) }],
      // 바닥·지면(보이는 평균색 sRGB)
      [RMAT.road, { make: () => texMat('asphalt_02', 3.5, { tint: 0x55575a, env: 0.35 }) }], [M.road, { make: () => texMat('asphalt_02', 3.5, { tint: 0x55575a, env: 0.35 }) }],
      [RMAT.walk, { make: () => texMat('sidewalk-pavers', 1.8, { tint: 0xa9a59e, env: 0.4 }) }], [M.walk, { make: () => texMat('sidewalk-pavers', 1.8, { tint: 0xa9a59e, env: 0.4 }) }],
      [RMAT.site, { make: () => texMat('facade-granite', 1.6, { tint: 0xbdb8af, env: 0.45 }) }], [M.site, { make: () => texMat('facade-granite', 1.6, { tint: 0xbdb8af, env: 0.45 }) }],
      [RMAT.ground, { make: () => texMat('ground-concrete', 2.5, { tint: 0x8c8e8a, env: 0.3 }) }], [M.ground, { make: () => texMat('ground-concrete', 2.5, { tint: 0x8c8e8a, env: 0.3 }) }],
      // 주변 건물 공통
      [CM2.roof, { make: () => texMat('concrete-wall', 2.7, { tint: 0xb4b3ae, env: 0.3 }) }], [DM.par, { make: () => texMat('plaster-white', 1.2, { tint: 0xd8d6d0 }) }],
      [DM.can, { make: () => metal(0x5f6467, 0.5, 0.6) }], [DM.unit, { make: () => metal(0xb4b8ba, 0.55, 0.6) }], [FX.glass, { make: () => { const m = std({ color: lin(0x26323a), metalness: 0.3, roughness: 0.05 }); m.envMapIntensity = 1.3; return m; } }],
      [K.carGlass, { make: () => { const m = std({ color: lin(0x10161a), metalness: 0.2, roughness: 0.04 }); m.envMapIntensity = 1.4; return m; } }],
    ]);
    K.CARC.forEach(c => RX.set(c, { make: () => { const m = std({ color: c.color.clone(), metalness: 0.55, roughness: 0.22 }); m.envMapIntensity = 1.25; return m; } }));
    return RX;
  }
  // 구역별 처방(같은 원본 재질이라도 1층·위층·지하에서 다르게)
  function zoneMake(orig, zone, L) {
    const { M, BM2 } = K;
    const base = zone[0] === 'b', LT = base ? levelLight(L) : null;
    if (base) {
      // 지하: Wing 이 노출을 크게 낮추므로(PR 켜짐 동안 frame() 에서 0.95로 고정) 그 기준으로 맞춘 값
      const Lp = { lm: LT.lm, box: LT.box, k: 1.0, amb: new T.Color(0.05, 0.05, 0.052) }, PE = parkEnv();
      const env = (m, e) => { m.envMap = PE; if (e != null) m.envMapIntensity = e; return m; };
      if (orig === M.bfloor || orig === M.ramp) return env(texMat('office-concrete', 3, { tint: 0x8a8d91, light: Lp, ns: 0.2, noRough: true, p: { roughness: 0.16 }, under: lin(0x2c2f32) }), 1.0);
      if (orig === BM2.pad) return env(texMat('office-concrete', 3, { tint: 0x96999e, light: Lp, ns: 0.2, noRough: true, p: { roughness: 0.22 } }), 0.9);
      if (orig === M.paint) return env(paint(0xf2f1ec, 0.4, 0.5, Lp));
      if (orig === M.paintY) return env(paint(0xe6b52e, 0.4, 0.5, Lp));
      if (orig === BM2.stop) return env(paint(0x5d6064, 0.6, 0.4, Lp));
      if (orig === M.bceil) return env(texMat('concrete-wall', 2.7, { tint: 0x34373a, light: { amb: new T.Color(0.06, 0.06, 0.06) } }), 0.5);
      if (orig === M.bwall || orig === M.rampwall) return env(texMat('wall-beige', 3, { tint: 0xd6cfc4, ns: 0.5, light: { amb: new T.Color(0.2, 0.185, 0.165) } }), 0.5);
      if (orig === BM2.stripe || orig === BM2.stripeK) return env(paint(0x1c1e20, 0.45, 0.6, { amb: new T.Color(0.08, 0.08, 0.08) }));
      if (orig === M.col) return env(texMat('plaster-white', 1.2, { tint: 0xf3f2ef, ns: 0.3, light: { amb: new T.Color(0.3, 0.3, 0.3), lm: LT.lm, box: LT.box, k: 0.35 } }), 0.4);
      if (orig === M.corewall || orig === M.core || orig === M.wellwall) return env(texMat('plaster-white', 1.2, { tint: 0xe3ddd2, ns: 0.3, light: { amb: new T.Color(0.25, 0.24, 0.23) } }), 0.4);
      // LED 줄 조명: 화면에서 빛나 보이게 밝기를 1 이상으로(블룸·톤매핑 기준)
      if (orig === BM2.light) { const m = new T.MeshBasicMaterial({ color: new T.Color(1, 0.98, 0.94).multiplyScalar(4) }); m.userData.lin = true; return m; }
      // 장애인 주차 구역: 파란 바닥 도장(조명 받음)과 선명한 국제 장애인 표지(KS 표지 형태 근사), 경형 표시
      if (orig === K.DISM) return env(paint(0x2b63c6, 0.42, 0.5, Lp));
      if (orig.map && K.DIST && orig.map === K.DIST) return markMat('isa', Lp);
      if (orig.map && K.KEIT && orig.map === K.KEIT) return markMat('kei', Lp);
      if (K.CARC.includes(orig)) return env(patch(Object.assign(std({ color: orig.color.clone(), metalness: 0.35, roughness: 0.25 }), { envMapIntensity: 1.4 }), { light: { amb: new T.Color(0.12, 0.12, 0.12), lm: LT.lm, box: LT.box, k: 0.4 } }));
      return null;
    }
    if (zone === 'g') {
      const amb = AMB.g(), Lg = gLight();
      const lt = Lg ? { amb, lm: Lg.lm, box: Lg.box, k: 1.1 } : { amb };
      if (orig === M.stone) return texMat('interior-stone', 1.5, { tint: 0xf1e6d6, light: lt, env: 0.6 });
      if (orig === M.slab) return texMat('plaster-white', 1.2, { tint: 0xf4f1ec, ns: 0.2, light: { amb: amb.clone().multiplyScalar(1.5) } });
      if (orig === M.col) return texMat('plaster-white', 1.2, { tint: 0xf1ede6, ns: 0.3, light: { amb } });
      if (orig === M.corewall || orig === M.core) return texMat('furniture-veneer', 1.8, { tint: 0xe7c9a6, light: { amb } });
      if (orig === M.roomfloor) return texMat('interior-stone', 1.5, { tint: 0xe9ddca, light: lt });
      return null;
    }
    if (zone === 'u') {
      const amb = AMB.u();
      if (orig === M.floorUp) return texMat('office-concrete', 3, { tint: 0xc9c3b8, noRough: true, p: { roughness: 0.5 }, light: { amb }, env: 0.5 });
      if (orig === M.slab) return texMat('plaster-white', 1.2, { tint: 0xefede8, ns: 0.2, light: { amb: amb.clone().multiplyScalar(1.6) } });
      if (orig === M.col) return texMat('plaster-white', 1.2, { tint: 0xeeebe5, ns: 0.3, light: { amb } });
      if (orig === M.corewall || orig === M.core) return texMat('plaster-white', 1.2, { tint: 0xe3ddd2, ns: 0.3, light: { amb } });
      return null;
    }
    return null;
  }
  // 바닥 표시 글씨·기호: 큰 캔버스에 다시 그려 가까이서도 선명하게(투명 배경, 바닥 도장 위에 얹힘)
  const MARK = {};
  function markTex(kind) {
    if (MARK[kind]) return MARK[kind];
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 512); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'isa') {
      // 휠체어 표지: 머리, 몸, 팔, 다리, 바퀴
      const x = 300, y = 250, s = 1.0;
      g.beginPath(); g.arc(x - 20 * s, y - 150 * s, 30 * s, 0, 7); g.fill();
      g.lineWidth = 34 * s; g.beginPath(); g.moveTo(x - 30 * s, y - 100 * s); g.lineTo(x - 40 * s, y + 10 * s); g.lineTo(x + 70 * s, y + 10 * s); g.lineTo(x + 110 * s, y + 110 * s); g.stroke();
      g.beginPath(); g.moveTo(x - 35 * s, y - 50 * s); g.lineTo(x + 50 * s, y - 50 * s); g.stroke();
      g.lineWidth = 26 * s; g.beginPath(); g.arc(x - 30 * s, y + 70 * s, 95 * s, -1.1, 4.0); g.stroke();
      g.font = '700 150px "IBM Plex Sans KR","Apple SD Gothic Neo",sans-serif'; g.textBaseline = 'middle'; g.fillText('장애인', 500, 200); g.font = '600 92px "IBM Plex Sans KR","Apple SD Gothic Neo",sans-serif'; g.fillText('전용', 520, 350);
    } else {
      g.font = '700 260px "IBM Plex Sans KR","Apple SD Gothic Neo",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2c230'; g.fillText('경형', 512, 270);
    }
    const t = new T.CanvasTexture(c); t.anisotropy = 8; t.encoding = T.sRGBEncoding; return (MARK[kind] = t);
  }
  function markMat(kind, Lp) {
    const m = std({ map: markTex(kind), transparent: true, alphaTest: 0.02, roughness: 0.5, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    m.envMap = parkEnv(); return patch(m, { light: Lp });
  }
  function matFor(orig, zone, L, ctxFacade) {
    if (!orig || !orig.isMaterial || orig.userData.prMade) return orig;
    if (orig.userData.prNone && orig.userData.prNone[zone[0]]) return orig;
    const zk = zone[0] === 'b' ? zone : (zone === 'g' || zone === 'u') ? zone : 'x';
    const key = orig.uuid + '|' + zk;
    let e = CACHE.get(key);
    if (e === undefined) {
      let m = zk !== 'x' ? zoneMake(orig, zk, L) : null, sync = null;
      if (!m) { const r = recipes().get(orig); if (r) { m = r.make(); sync = r.sync || null; } }
      if (!m && ctxFacade && orig.isMeshStandardMaterial && orig.map && orig.map.image && orig.map.image.getContext) m = facadeMat(orig);
      // lin: Wing 의 linearize() 가 색을 한 번 더 바꾸지 않게. prEnv: Wing 이 덮어쓴 반사 세기를 매 프레임 되돌린다
      if (m) { m.userData.prMade = true; m.userData.lin = true; m.userData.prEnv = m.envMapIntensity; m.name = 'pr:' + (orig.name || orig.uuid.slice(0, 6)); }
      if (!m) { (orig.userData.prNone = orig.userData.prNone || {})[zone[0]] = true; return orig; }
      e = { m, orig, sync, glass: !!(m.userData.pr && m.userData.pr.glass) };
      CACHE.set(key, e); WARM.push(m);
    }
    return e ? e.m : orig;
  }
  // 주변 건물: Wing의 창 패턴 캔버스(거리뷰 기준)를 4배 해상도로 다시 그리고 벽 질감·창 반사(금속성·거칠기 맵)를 더한다
  const FAC = new Map();
  function facadeMat(orig, winK = 0.62) {
    const src = orig.map, img = src.image;
    if (img === K.TEX.brick.image) { const m = texMat('brick', 1.0, { ns: 1.1, env: 0.4 }); return m; }
    const fs = FAC.get(img) || {}; FAC.set(img, fs); let f = fs[winK];   // 같은 캔버스라도 창 밝기(winK)별로 따로
    if (!f) {
      const w = img.width, h = img.height, S = Math.max(1, Math.round(256 / Math.max(w, h)));
      const sd = img.getContext('2d').getImageData(0, 0, w, h).data, W = w * S, H = h * S;
      const cc = document.createElement('canvas'); cc.width = W; cc.height = H; const cg = cc.getContext('2d'), co = cg.createImageData(W, H);
      const rc = document.createElement('canvas'); rc.width = W; rc.height = H; const rg = rc.getContext('2d'), ro = rg.createImageData(W, H);
      const hc = new Float32Array(W * H);
      let seed = w * 13 + h; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = ((y / S | 0) * w + (x / S | 0)) * 4, r = sd[i], g = sd[i + 1], b = sd[i + 2], lum = 0.3 * r + 0.59 * g + 0.11 * b, win = b > r + 6 && lum < 190;
        const o = (y * W + x) * 4; const n = (rnd() - 0.5) * (win ? 6 : 16), st = win ? 0 : Math.sin(x * 0.7 + rnd()) * 2;
        const k = win ? winK : 1;   // 창은 어둡게(실제 유리는 안이 어둡다), 반사는 환경맵이 맡는다
        co.data[o] = Math.max(0, Math.min(255, r * k + n + st)); co.data[o + 1] = Math.max(0, Math.min(255, g * k + n + st)); co.data[o + 2] = Math.max(0, Math.min(255, b * k + n + st)); co.data[o + 3] = 255;
        // 거칠기(G)·금속성(B): 창 0.06/0.6, 벽 0.85/0
        ro.data[o] = 0; ro.data[o + 1] = win ? 16 : 215 + rnd() * 30; ro.data[o + 2] = win ? 150 : 0; ro.data[o + 3] = 255;
        hc[y * W + x] = win ? 0 : 1;
      }
      cg.putImageData(co, 0, 0); rg.putImageData(ro, 0, 0);
      // 노멀: 창이 벽보다 들어가 있다(높이 차이의 기울기)
      const nc = document.createElement('canvas'); nc.width = W; nc.height = H; const ng = nc.getContext('2d'), no = ng.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const hx = hc[y * W + ((x + 1) % W)] - hc[y * W + ((x - 1 + W) % W)], hy = hc[((y + 1) % H) * W + x] - hc[((y - 1 + H) % H) * W + x];
        const nx = -hx * 1.2, ny = hy * 1.2, l = Math.hypot(nx, ny, 1), o = (y * W + x) * 4;
        no.data[o] = (nx / l * 0.5 + 0.5) * 255; no.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; no.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; no.data[o + 3] = 255;
      }
      ng.putImageData(no, 0, 0);
      f = fs[winK] = { c: cc, r: rc, n: nc };
    }
    const mk = (c, srgb) => { const t = new T.CanvasTexture(c); t.wrapS = src.wrapS; t.wrapT = src.wrapT; t.repeat.copy(src.repeat); t.offset.copy(src.offset); t.anisotropy = isMobile ? 4 : 8; if (srgb) t.encoding = T.sRGBEncoding; return t; };
    const m = std({ map: mk(f.c, true), roughnessMap: mk(f.r), metalnessMap: mk(f.r), normalMap: mk(f.n), roughness: 1, metalness: 1, color: orig.color.clone() });
    m.normalScale.set(0.8, 0.8); m.envMapIntensity = 1.0;
    return m;
  }

  /* ================= 4. 절차적 라이트맵 ================= */
  // 조명기구 위치로 바닥 빛 웅덩이를 그린 작은 텍스처(1m당 4화소). 실시간 광원 없이 바닥·기둥 밑을 밝힌다
  const LTC = new Map();
  function bakeLM(key, pts, bounds, opt) {
    const [x0, z0, x1, z1] = bounds, ppm = 4, W = Math.max(8, Math.ceil((x1 - x0) * ppm)), H = Math.max(8, Math.ceil((z1 - z0) * ppm));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = opt.base; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    pts.forEach(p => {
      const cx = (p.x - x0) * ppm, cz = (p.z - z0) * ppm, r = opt.r * ppm;
      const gr = g.createRadialGradient(cx, cz, 0, cx, cz, r); gr.addColorStop(0, opt.col); gr.addColorStop(0.45, opt.mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(cx, cz); g.scale(p.sx || 1, p.sz || 1); g.translate(-cx, -cz); g.fillStyle = gr; g.fillRect(cx - r, cz - r, 2 * r, 2 * r); g.restore();
    });
    g.globalCompositeOperation = 'source-over';
    (opt.dark || []).forEach(p => { const cx = (p.x - x0) * ppm, cz = (p.z - z0) * ppm, r = 0.9 * ppm, gr = g.createRadialGradient(cx, cz, 0, cx, cz, r); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - r, cz - r, 2 * r, 2 * r); });
    const t = new T.CanvasTexture(c); t.encoding = T.LinearEncoding; t.magFilter = T.LinearFilter; t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    const e = { lm: t, box: new T.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)) }; LTC.set(key, e); return e;
  }
  function polyBounds(L) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; L.poly.forEach(q => { const [x, z] = K.P(...q); a = Math.min(a, x); b = Math.min(b, z); c = Math.max(c, x); d = Math.max(d, z); }); return [a - 1, b - 1, c + 1, d + 1]; }
  // 조명 배치가 같은 지하층(B1～B3 대부분)은 라이트맵과 재질을 함께 쓴다(XR 병합 묶음 수 = 그리기 호출을 줄인다)
  const LVL = new WeakMap();
  function levelLight(L) {
    if (LVL.has(L)) return LVL.get(L);
    const pts = [], dark = [];
    const g = CUR.levelGroup(L);
    if (g) g.traverse(o => { if (o.isMesh && (o.material === K.BM2.light || (o.userData.prOrig === K.BM2.light))) { pts.push({ x: o.position.x, z: o.position.z, sx: 0.8, sz: 1.6 }); } });
    (L.cols || []).forEach(q => { const [x, z] = K.P(q[0], q[1]); dark.push({ x, z }); });
    const bd = polyBounds(L), r2 = v => Math.round(v * 2) / 2;
    const sig = [bd.map(r2).join(','), pts.map(q => r2(q.x) + ':' + r2(q.z)).sort().join(';'), dark.map(q => r2(q.x) + ':' + r2(q.z)).sort().join(';')].join('|');
    let h = 0; for (let i = 0; i < sig.length; i++) h = (h * 31 + sig.charCodeAt(i)) | 0;
    const key = 'b|' + h;
    const e = LTC.get(key) || bakeLM(key, pts, bd, { base: 'rgb(30,30,31)', r: 3.4, col: 'rgba(255,250,240,0.95)', mid: 'rgba(170,166,158,0.45)', dark });
    e.sig = (h >>> 0).toString(36); LVL.set(L, e); return e;
  }
  let G1 = null;
  function gLight() { return G1; }

  /* ================= 5. 장면 적용 ================= */
  const CUR = { levels: null, sig: '', swapped: [], levelGroup: L => { const i = K.LEVELS.indexOf(L); return K.LG && K.LG[i]; } };
  function zoneOf(o) {
    // 부모를 따라 올라가 층 묶음(userData.li)을 찾는다
    for (let p = o; p; p = p.parent) { if (p.userData && p.userData.li != null) { const L = K.LEVELS[p.userData.li]; if (!L) return ['x', null]; return [L.kind === 'base' ? 'b:' + levelLight(L).sig : L.kind === 'ground' ? 'g' : (L.kind === 'upper' ? 'u' : 'x'), L]; } if (p === K.bld) break; }
    return ['x', null];
  }
  function swapIn(root, zoneFn, ctxFacade) {
    let n = 0;
    root.traverse(o => {
      if (!o.material || o.userData.prSkip) return;
      if (!o.userData.prOrig) o.userData.prOrig = o.material;
      const [zone, L] = zoneFn ? zoneFn(o) : ['x', null];
      const src = o.userData.prOrig;
      const nm = Array.isArray(src) ? src.map(m => matFor(m, zone, L, ctxFacade)) : matFor(src, zone, L, ctxFacade);
      if (nm !== o.material) { o.material = nm; n++; }
      CUR.swapped.push(o);
    });
    return n;
  }
  function swapOut() {
    CUR.swapped.forEach(o => { const m = o.material, mine = Array.isArray(m) ? m.some(x => x && x.userData.prMade) : m && m.userData.prMade; if (o.userData.prOrig && mine) o.material = o.userData.prOrig; delete o.userData.prOrig; });
    CUR.swapped = [];
  }
  let staticDone = false;
  function applyAll(reason) {
    const t0 = now();
    // 원본이 건물을 다시 만들면 바뀐 원본 재질(지면 교체 등)을 다시 읽도록 이전 기록을 지운다
    CUR.swapped.forEach(o => { if (o.userData.prOrig && o.material !== o.userData.prOrig && !(o.material.userData && o.material.userData.prMade)) o.userData.prOrig = o.material; });
    CUR.swapped = [];
    CUR.levels = K.LEVELS; CUR.sig = K.LEVELS.map(l => l.key + l.y.toFixed(1)).join(',');
    G1 = null;
    dress();   // 실내 꾸밈(비동기, 층 배치가 같으면 다시 만들지 않음)
    placeCars(); placeTrees();
    let n = swapIn(K.bld, zoneOf);
    // 주변(도로·지면·주변 건물·차량)은 처음 한 번 + 지면은 매번(원본이 다시 만든다)
    n += swapIn(K.site); n += swapIn(K.city, null, true); n += swapIn(K.ctx, null, true); n += swapIn(K.exist, null, true); n += swapIn(K.R3D.props);
    staticDone = true;
    PR.stat.swap = n; PR.stat.applyMs = Math.round(now() - t0); PR.stat.mats = CACHE.size;
    log('적용', reason, n + '개', PR.stat.applyMs + 'ms');
  }
  // 매 프레임(장면을 그리기 직전): 원본 재건 감지, 원본 쪽 색·투명도 변화 반영, 환경맵 유지, 내 묶음 표시 상태 맞추기
  let pendingSwitch = null;
  function frame() {
    if (K.LEVELS !== CUR.levels) { applyAll('재건'); if (pendingSwitch) { PR.t.switchApply = Math.round(now() - pendingSwitch.t); } }
    if (pendingSwitch && !pendingSwitch.drawn) { pendingSwitch.drawn = true; const t = pendingSwitch.t; requestAnimationFrame(() => { PR.t.switch = Math.round(now() - t); pendingSwitch = null; statLine(); }); }
    CACHE.forEach(e => {
      if (!e) return; const { m, orig, sync } = e;
      if (m.envMapIntensity !== m.userData.prEnv) m.envMapIntensity = m.userData.prEnv;
      if (sync) {
        if (sync.includes('color')) m.color.copy(orig.color).multiplyScalar(e.glass ? 0.35 : 1);
        if (sync.includes('opacity')) m.opacity = orig.opacity;
        // 야간 창 불빛: 실내는 굽기(야간 조명)로 밝아 유리 너머로 보이므로, 유리 자체 발광은 약하게만 따른다
        if (sync.includes('emissive')) { m.emissive.copy(orig.emissive); m.emissiveIntensity = orig.emissiveIntensity * (e.glass ? 0.15 : 1); }
      }
      if (orig.emissiveMap !== undefined && m.userData.prFacEm !== orig.emissiveMap && !m.userData.pr) {
        // 야간 창 불빛(원본 cityLights)이 바뀐 경우만 따라간다
        if (orig.emissiveMap || m.emissiveMap) { m.emissiveMap = orig.emissiveMap; m.emissive.copy(orig.emissive); m.emissiveIntensity = orig.emissiveIntensity; m.needsUpdate = true; }
        m.userData.prFacEm = orig.emissiveMap;
      }
    });
    EXTRA.forEach(m => { if (m.envMapIntensity !== m.userData.prEnv) m.envMapIntensity = m.userData.prEnv; });
    bakeUpdate();
    const R3D = K.R3D, night = R3D.time === 'night', inBase = K.I.on && K.Lv() && K.Lv().kind === 'base';
    const cube = R3D.cube && R3D.cube.texture;
    if (cube) CACHE.forEach(e => { if (e && e.glass && e.m.envMap !== cube) { e.m.envMap = cube; e.m.needsUpdate = true; } });
    if (inBase) { if (R.toneMappingExposure !== 0.95) R.toneMappingExposure = 0.95; if (K.amb.intensity !== 0.04) K.amb.intensity = 0.04; }
    warm();
    skyUpdate();
    const wantSky = night ? 'night' : bakeSlot() === 'sunset' ? 'sunset' : 'day';
    const useSky = skyBG && !inBase && skyCur.key === wantSky;   // 새 시간대 하늘을 받기 전에는 Wing 하늘을 보인다
    if (R3D.sky) R3D.sky.visible = !useSky;
    if (useSky && scene.background !== skyBG) scene.background = skyBG; else if (!useSky && scene.background === skyBG) scene.background = null;
    if (DIST) DIST.visible = !K.I.on || !inBase;
    if (CTX.now && CTX.detached.length) { const nw = K.state.era === 'new'; CTX.now.visible = !nw; CTX.next.visible = nw; }
    if (envDay && !inBase && skyCur.key === wantSky && scene.environment !== envDay) { if (scene.environment && scene.environment !== PR.lastEnv) PR.wingEnv = scene.environment; scene.environment = envDay; PR.lastEnv = envDay; }
    // 내 가구 묶음은 해당 층 묶음의 표시 상태를 따른다(내부 보기의 층 숨김·인형집 보기)
    // 층 묶음은 원본이 재건할 때마다 새로 생기므로 층 이름으로 매번 찾는다
    DR.groups.forEach(([g, key]) => { if (!key) return; const i = K.LEVELS.findIndex(l => l.key === key), lg = K.LG && K.LG[i]; g.visible = !!(lg && lg.visible && lg.parent); });
  }

  /* ================= 5-1. 셰이더 미리 준비 =================
     지하·1층처럼 처음 보는 순간에야 그려지는 재질은 그때 셰이더를 만들며 1～2초 멈춘다.
     켠 직후부터 프레임마다 몇 개씩, 카메라 바로 앞의 아주 작은 판에 씌워 한 번 그려 미리 만들어 둔다. */
  const WARM = [];
  let warmG = null, warmMs = [];
  function warm() {
    if (warmG) { scene.remove(warmG); warmG = null; }
    if (!WARM.length) { if (PR.t.warm == null && PR.t.enable0 && DR.group) { PR.t.warm = Math.round(now() - PR.t.enable0); statLine(); } return; }
    const props = R.properties, cam = window.KHXR.camera;
    warmG = new T.Group(); warmG.userData.khxr = true;   // XR 병합 대상에서 제외
    const geo = warm.geo || (warm.geo = new T.PlaneGeometry(1e-3, 1e-3));
    let n = 0;
    while (WARM.length && n < 4) {
      const m = WARM.shift(); const pp = props.get(m);
      if (pp && pp.program) continue;
      const me = new T.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = -1;
      const d = new T.Vector3(); cam.getWorldDirection(d); me.position.copy(cam.position).addScaledVector(d, Math.max(cam.near * 2, 0.6)); me.quaternion.copy(cam.quaternion);
      warmG.add(me); n++;
    }
    if (n) { scene.add(warmG); warmMs.push(n); }
  }
  /* ================= 6. 실내 꾸밈 =================
     예전 실사 3D(codex/tower-360-validation)의 카페·사무실(2F～6F)·주차장 배치 모듈을 그대로 불러 쓴다.
     그 모듈들은 원래도 Wing 의 r128 장면 객체를 만들던 코드라 이 장면에 바로 붙는다(photoreal/codex/, 자산은 photoreal/assets/).
     층 배치(층 이름·높이·평면)가 같으면 외장만 바뀐 재생성에서는 다시 만들지 않는다. */
  const DR = { group: null, sig: '', busy: false, again: false, ready: null, timber: null, groups: [], mats: new Map() };
  function codexScripts() {
    return DR.ready || (DR.ready = vendor().then(() => Promise.all(['codex/cafe.js', 'codex/office.js', 'codex/interior-models.js'].map(f => loadScript(BASE + f + '?v=' + VER))))
      .then(() => { window.PARKING_FLOORS = ['B1', 'B2', 'B3']; }));
  }
  function dressSig() { return K.LEVELS.map(l => l.key + ':' + l.kind + ':' + l.y.toFixed(2) + ':' + l.h.toFixed(2) + ':' + JSON.stringify(l.poly)).join('|'); }
  async function timber() {
    if (DR.timber) return DR.timber;
    const m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
    m.map = tex('furniture-veneer', 'color'); m.normalMap = tex('furniture-veneer', 'normal'); m.roughnessMap = tex('furniture-veneer', 'rough'); m.normalScale.set(0.06, 0.06);
    m.userData.illustrativeTimber = true; return (DR.timber = m);
  }
  async function dress() {
    const sig = dressSig();
    if (sig === DR.sig && DR.group && DR.group.parent) return;
    if (DR.busy) { DR.again = true; return; }
    DR.busy = true; const t0 = now();
    try {
      await codexScripts();
      const extra = new T.Group(); extra.name = 'pr-dress'; extra.userData.interiorPlantAnchors = [];
      // 모듈이 기대하는 연결 객체(예전 TOWER_LAB_CONTEXT 의 일부). M.stone 은 빈 객체로 넘겨 원본 1층 바닥을 건드리지 않게 한다.
      const C = { THREE: T, bld: K.bld, R3D: K.R3D, inPoly: K.inPoly, levels: () => K.LEVELS, P: K.P, interiorDressing: extra, ceilOf: K.ceilOf, floorTop: K.floorTop, scene, M: { stone: {} }, city: K.city, site: K.site };
      await window.dressTowerCafe(C, extra, await timber());
      for (const key of window.OFFICE_FLOORS || []) await window.dressTowerOffice(C, extra, key);
      for (const key of window.PARKING_FLOORS || []) await window.dressTowerParking(C, extra, key);
      if (window.swapInteriorModels) await window.swapInteriorModels(C, extra);
      placePlants(extra);
      litDress(extra);
      if (DR.group) { scene.remove(DR.group); }
      DR.group = extra; DR.sig = sig; scene.add(extra);
      DR.groups = extra.children.map(g => [g, levelKeyOf(g)]);
      PR.stat.dressMs = Math.round(now() - t0); PR.stat.dressObjects = (() => { let n = 0; extra.traverse(o => { if (o.isMesh) n++; }); return n; })();
      if (PR.t.dress == null && PR.t.enable0) PR.t.dress = Math.round(now() - PR.t.enable0);
      log('실내 꾸밈', PR.stat.dressMs + 'ms', PR.stat.dressObjects + '개');
    } catch (e) { log('실내 꾸밈 실패', e && e.message); console.warn(e); }
    DR.busy = false;
    if (DR.again) { DR.again = false; dress(); }
  }
  function levelKeyOf(g) {
    if (g.userData.fitoutFloor) return g.userData.fitoutFloor;
    const m = /^(B\d|\dF|PH\d)/.exec(g.name || ''); if (m) return m[1];
    if (/cafe/i.test(g.name || '')) return '1F';
    // 이름이 없으면 높이로 층을 찾는다
    const b = new T.Box3().setFromObject(g); if (b.isEmpty()) return null; const y = (b.min.y + b.max.y) / 2;
    const L = K.LEVELS.find(l => y >= K.floorTop(l) - 0.3 && y < K.floorTop(l) + l.h); return L ? L.key : null;
  }
  // 꾸밈 재질에 층별 실내 조명 수준을 더한다(실시간 광원 없이). 같은 재질이라도 층 종류별로 복제
  function litDress(root) {
    root.updateMatrixWorld(true);
    const wp = new T.Vector3();
    root.traverse(o => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      o.getWorldPosition(wp);
      const L = K.LEVELS.find(l => wp.y >= K.floorTop(l) - 0.5 && wp.y < K.floorTop(l) + Math.max(l.h, 3) + 2) || null;
      const zone = !L ? 'x' : L.kind === 'base' ? 'b' : L.kind === 'ground' ? 'g' : 'u';
      const m0 = o.material; if (m0.isMeshBasicMaterial || !m0.isMeshStandardMaterial || (m0.emissiveIntensity > 1 && m0.emissive && m0.emissive.getHex())) return;
      const key = m0.uuid + '|' + zone;
      let m = DR.mats.get(key);
      if (!m) {
        const amb = zone === 'g' ? AMB.g() : zone === 'u' ? AMB.u() : zone === 'b' ? new T.Color(0.32, 0.32, 0.33) : null;
        m = amb ? patch(m0.clone(), { light: { amb } }) : m0;
        keepEnv(m); m.userData.prMade = true; DR.mats.set(key, m); if (m !== m0) WARM.push(m);
      }
      o.material = m;
    });
  }
  /* ================= 6-2. 거리 소품: 차량·가로수·실내 화분 =================
     Wing 의 단순 형상 차(도로·주차장 모두)를 실제 차 모델(CC BY, 5종)로 바꾸고, 예전 실사 3D 의 가로수를 둔다.
     가로수는 우리 건물 앞 압구정로 보도(1층을 가리던 자리)에는 두지 않는다. */
  const CARS = [{ f: 'bmwe90', len: 4.53 }, { f: 'renegade', len: 4.24 }, { f: 'kiri10', len: 4.7 }, { f: 'modelS', len: 4.97 }, { f: 'ace11', len: 4.0 }];
  const ENV = { p: null, cars: null, tree: null, plant: null, group: null, hidden: [], added: [] };
  function gltf() { if (!gltf.l) { const dl = new T.DRACOLoader(); dl.setDecoderPath(BASE + 'vendor/draco/'); gltf.l = new T.GLTFLoader(); gltf.l.setDRACOLoader(dl); } return gltf.l; }
  const loadGLB = f => new Promise(res => gltf().load(BASE + f, g => res(g.scene), undefined, () => { log('모델 실패', f); res(null); }));
  function envAssets() {
    return ENV.p || (ENV.p = vendor().then(() => Promise.all([...CARS.map(c => loadGLB('assets/cars/car-' + c.f + '.glb')), loadGLB('assets/street-tree.glb'), loadGLB('assets/interior-foliage.glb')]))
      .then(r => {
        ENV.cars = r.slice(0, CARS.length).map((sc, i) => sc && normModel(sc, CARS[i].len, true)).filter(Boolean);
        ENV.tree = r[CARS.length]; ENV.plant = r[CARS.length + 1];
        PR.t.env2 = Math.round(now() - PR.t.enable0); log('거리 소품', PR.t.env2 + 'ms');
        if (PR.on) { placeCars(); placeTrees(); if (DR.group) placePlants(DR.group); }
      }));
  }
  // 바닥 중심을 원점에, 긴 축을 X(Wing 차의 길이 방향)로, 길이를 실제 치수로 맞춘 묶음
  function normModel(sc, len, car) {
    sc.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(sc), sz = b.getSize(new T.Vector3()), s = len / Math.max(sz.x, sz.z);
    sc.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
    const inner = new T.Group(); inner.add(sc); inner.scale.setScalar(s); if (car && sz.z > sz.x) inner.rotation.y = Math.PI / 2;
    const outer = new T.Group(); outer.add(inner);
    outer.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.prSkip = true; } });
    return outer;
  }
  function placeCars() {
    if (!ENV.cars || !ENV.cars.length) return;
    const olds = [];
    [K.bld, K.R3D.props].forEach(root => root.traverse(o => { if (o.userData.car && !o.userData.prRep) olds.push(o); }));
    olds.forEach((o, i) => {
      const k = Math.abs(Math.round(o.position.x * 7 + o.position.z * 3)) % ENV.cars.length;
      const c = ENV.cars[k].clone(true); c.userData.prCar = true;
      c.position.copy(o.position); c.rotation.copy(o.rotation);
      o.parent.add(c); o.userData.prRep = true; o.visible = false; ENV.hidden.push(o); ENV.added.push(c);
      litDress(c);
    });
  }
  function placeTrees() {
    if (!ENV.tree || ENV.group) return;
    const g = ENV.group = new T.Group(); g.name = 'pr-street';
    const tree = normModel(ENV.tree.clone(true), 1, false), b = new T.Box3().setFromObject(tree), h = b.max.y - b.min.y;
    // 잎 카드: 양면, 알파 잘라내기(정렬 없이 그려 퀘스트에서도 가볍다), 가을 톤은 Wing 계절에 맞춰 약하게
    tree.traverse(o => { if (o.isMesh && o.material) { const m = o.material; m.side = T.DoubleSide; if (/leaves/i.test(m.name)) { m.alphaTest = 0.45; m.transparent = false; if (K.R3D.season === 'autumn') m.color.setRGB(1.08, 1.0, 0.82); } m.userData.lin = true; m.needsUpdate = true; } });
    const walk = px => 1365 - 0.3604 * (px - 230) + 305;
    // 예전 위치에서 압구정로 쪽 우리 건물 앞(x=120, y 0～1365) 네 그루는 뺐다
    // 압구정로 건너편 보도(x=-1240)도 우리 건물 정면(y -200～1400)을 가리는 세 그루는 뺐다
    [[1550, walk(1550)], [120, -690], [120, -1000], [120, -1500], [-1240, -690], [1850, walk(1850)], [2200, walk(2200)], [2550, walk(2550)], [-1240, 1550], [-1240, -1000]].forEach((q, i) => {
      const t = tree.clone(true), s = (9.2 + (i % 3) * 0.8) / h; t.scale.setScalar(s);
      const [x, z] = K.P(q[0], q[1]); t.position.set(x, 0.18, z); t.rotation.y = i * 2.399; g.add(t);
    });
    scene.add(g);
  }
  function placePlants(extra) {
    if (!ENV.plant) return;
    const anchors = (extra.userData.interiorPlantAnchors || []).slice(0, 14);
    const plant = normModel(ENV.plant.clone(true), 1, false), b = new T.Box3().setFromObject(plant), h = b.max.y - b.min.y;
    anchors.forEach((a, i) => { const p = plant.clone(true), s = (a.height || 1.4) / h; p.scale.setScalar(s); p.position.set(a.x, a.y, a.z); p.rotation.y = i * 1.7; extra.add(p); });
    litDress(extra);
  }
  function envOff() {
    ENV.added.forEach(c => c.parent && c.parent.remove(c)); ENV.added = [];
    ENV.hidden.forEach(o => { o.visible = true; o.userData.prRep = false; }); ENV.hidden = [];
    if (ENV.group) { scene.remove(ENV.group); ENV.group = null; }
  }
  /* ================= 6-1. 원경 도시 =================
     Wing 의 주변 블록(약 200m) 바깥을 비워 두면 땅 끝이 보여 모형처럼 보인다. 250～1,100m 에 낮은 해상도의 도시 덩어리를
     인스턴스 상자 한 묶음(그리기 호출 1회)으로 깐다. 실제 건물이 아니라 원경 분위기용이다(보고서에 명시). */
  let DIST = null;
  function distantCity() {
    if (DIST) { if (!DIST.parent) scene.add(DIST); return; }
    let seed = 529; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const list = [];
    for (let i = 0; i < 2600 && list.length < 360; i++) {
      const a = rnd() * Math.PI * 2, r = 330 + Math.pow(rnd(), 0.8) * 900, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (x < -60 && x > -480 && Math.abs(z) < 480) continue;   // 압구정로 건너편(미성아파트·학교 부지)은 Wing 이 그린다
      // 신사·압구정 일대는 4～8층 근생·오피스가 대부분이고 고층 아파트는 드물다
      const w = 14 + rnd() * 22, d = 12 + rnd() * 18, tall = rnd() < 0.06, h = tall ? 40 + rnd() * 45 : 10 + rnd() * rnd() * 22;
      list.push({ x, z, w, d, h, ry: Math.round(rnd() * 4) * Math.PI / 2 + 0.6, c: 0.72 + rnd() * 0.25, t: rnd() });
    }
    const m = texMat('facade-office', 7, { env: 0.6, ns: 0.6, roof: true });
    m.userData.prMade = true; keepEnv(m);
    const geo = new T.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const im = new T.InstancedMesh(geo, m, list.length), M4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    list.forEach((b, k) => { q.setFromAxisAngle(new T.Vector3(0, 1, 0), b.ry); M4.compose(new T.Vector3(b.x, 0, b.z), q, new T.Vector3(b.w, b.h, b.d)); im.setMatrixAt(k, M4);
      col.setRGB(b.c, b.c * (0.97 + b.t * 0.05), b.c * (0.93 + b.t * 0.08)); im.setColorAt(k, col); });
    im.receiveShadow = false; im.castShadow = false; im.userData.prSkip = true; im.frustumCulled = false;
    DIST = im; DIST.name = 'pr-distant'; scene.add(DIST);
  }
  /* ================= 6-3. 주변 건물(실측) =================
     photoreal/context/(주변 건물 세션 산출물): 브이월드 건물정보·OSM 외곽선·카카오 로드뷰로 정한 3,888동(근경 258, 원경 3,630).
     Wing 의 근사 주변 건물 덩어리는 실사 3D 동안 장면에서 떼어 두고(끄면 되돌림), 신축 모드에서는 Wing 이 가정한
     미성아파트 재건축 고층 동(100m 이상)을 살리고 실측 자료의 현재 미성 단지는 뺀다. */
  const CTX = { p: null, now: null, next: null, detached: [] };
  function inPolyW(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > p[1]) !== (zj > p[1]) && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) c = !c; } return c; }
  function ctxLoad() {
    return CTX.p || (CTX.p = loadScript(BASE + 'context/kh-context.js?v=' + VER).then(async () => {
      const url = BASE + 'context/buildings.json?v=' + VER;
      const area = [[[-9400, -480], [-1430, -480], [-1430, 10400], [-9400, 10400]], [[-10700, -5100], [-5600, -5100], [-5600, -480], [-10700, -480]]].map(q => q.map(p => K.P(p[0], p[1])));
      const redev = b => { const o = b.outline, c = [o.reduce((s, q) => s + q[0], 0) / o.length, o.reduce((s, q) => s + q[1], 0) / o.length]; return area.some(a => inPolyW(c, a)) && b.cls === 'apt'; };
      CTX.now = await window.KHContext.load(url, { near: true, far: true });
      CTX.next = await window.KHContext.load(url, { near: true, far: true, filter: b => !redev(b) });
      // 창 패턴 캔버스 재질에 실사 보강(창 반사·벽 질감·창 깊이). 건물 색은 꼭짓점 색
      const up = new Map();
      [CTX.now, CTX.next].forEach(g => { g.name = 'pr-context'; g.traverse(o => {
        if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; const m0 = o.material;
        if (m0 && m0.map && m0.map.image && m0.map.image.getContext) { let m = up.get(m0); if (!m) { m = facadeMat(m0, 1.25); m.vertexColors = true; m.color.set(0xffffff); m.userData.lin = true; keepEnv(m); up.set(m0, m); } o.material = m; }
      }); });
      PR.stat.context = CTX.now.userData.stats; PR.t.context = Math.round(now() - PR.t.enable0); log('주변 건물', PR.t.context + 'ms', CTX.now.userData.stats.buildings + '동');
      if (PR.on) ctxOn();
    }).catch(e => log('주변 건물 실패', e && e.message)));
  }
  function ctxOn() {
    if (!CTX.now || CTX.detached.length) return;
    [K.city, K.ctx].forEach(root => {
      const list = []; root.traverse(o => { if (o.isMesh && Array.isArray(o.material)) list.push(o); });
      list.forEach(o => { const b = new T.Box3().setFromObject(o); if (b.max.y - b.min.y > 100) return; const p = o.parent; if (!p) return; p.remove(o); CTX.detached.push([p, o]); });
    });
    scene.add(CTX.now); scene.add(CTX.next);
    if (DIST) DIST.parent && DIST.parent.remove(DIST);
  }
  function ctxOff() {
    CTX.detached.forEach(([p, o]) => p.add(o)); CTX.detached = [];
    if (CTX.now) scene.remove(CTX.now); if (CTX.next) scene.remove(CTX.next);
  }
  /* ================= 7. 켜기·끄기 ================= */
  async function enable(on) {
    if (on === PR.on) return;
    if (on) {
      PR.t = { enable0: now() };
      const vr = document.getElementById('vm-render');
      if (window.PH && window.PH.on) window.PH.set(false);
      if (!K.R3D.on) { vr.checked = true; vr.dispatchEvent(new Event('change', { bubbles: true })); }
      document.getElementById('vm-pr').checked = true;
      PR.on = true;
      document.querySelector('.app').classList.add('pr3d');
      applyAll('켜기');
      // 우선 조합 4종에서 쓰는 외장 재질은 아직 장면에 없어도 미리 만들어 셰이더 준비 목록에 올린다(첫 전환 멈춤 방지)
      { const { FM, DZM, R3D } = K; [FM.brick, FM.brickHead, FM.winFrame, FM.fascia, DZM.white, DZM.col, DZM.slab, FM.spandrel, FM.silver, FM.gpar, R3D.mullM, R3D.mullD, FM.stone, FM.stoneDark].forEach(m => matFor(m, 'x', null)); }
      PR.t.firstApply = Math.round(now() - PR.t.enable0);
      requestAnimationFrame(() => requestAnimationFrame(() => { PR.t.firstFrame = Math.round(now() - PR.t.enable0); statLine(); }));
      panel(true);
      if (!CTX.now) distantCity();
      loadEnv(); envAssets(); loadBake(); ctxLoad().then(() => PR.on && ctxOn());
    } else {
      PR.on = false;
      swapOut();
      if (DR.group) { scene.remove(DR.group); DR.group = null; DR.sig = ''; }
      envOff(); ctxOff();
      if (scene.environment === envDay) scene.environment = PR.wingEnv || null;
      if (scene.background === skyBG) scene.background = null; if (K.R3D.sky) K.R3D.sky.visible = true;
      if (DIST) { scene.remove(DIST); }
      CUR.levels = null;
      document.querySelector('.app').classList.remove('pr3d');
      panel(false);
    }
  }
  PR.enable = enable;

  /* ================= 8. 화면 UI ================= */
  function ui() {
    const sk = document.getElementById('vm-sketch'); if (!sk) return;
    const seg = sk.closest('.seg');
    const lb = document.createElement('label'); lb.innerHTML = '<input type="radio" name="vmode" id="vm-pr" value="pr3d"> 실사 3D';
    seg.appendChild(lb);
    const st = document.createElement('style');
    st.textContent = `.pr-panel{position:absolute;left:12px;bottom:12px;z-index:5;background:color-mix(in srgb,var(--panel) 92%,transparent);border:1px solid var(--line);border-radius:6px;padding:8px 10px;font:12px/1.4 var(--font);color:var(--fg);max-width:min(420px,calc(100% - 24px));-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.pr-panel b{font-weight:600}.pr-panel .r{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.pr-panel button{font:500 12px var(--font);padding:4px 8px;border:1px solid var(--line);background:var(--panel);color:var(--fg);border-radius:4px;cursor:pointer}
.pr-panel button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--panel)}.pr-panel small{color:var(--muted);display:block;margin-top:5px}
@media (max-width:760px){.pr-panel{left:8px;bottom:8px;padding:6px 8px}.pr-panel button{padding:4px 6px;font-size:11.5px}}`;
    document.head.appendChild(st);
    document.querySelectorAll('input[name=vmode]').forEach(r => r.addEventListener('change', e => {
      if (e.target.value === 'pr3d') enable(true); else if (PR.on) enable(false);
    }));
    // 조합 변경 감지: Wing 설정 패널의 입력이 바뀐 순간부터 다음 화면까지 잰다
    document.addEventListener('change', e => { if (!PR.on) return; const n = e.target && e.target.name; if (n && n !== 'vmode' && e.target.closest && e.target.closest('aside,.panel,#panel')) { pendingSwitch = { t: now(), what: n }; } }, true);
  }
  const PF = { glass: ['combo', 'sty-glass'], brick: ['combo', 'sty-brick'], stack: ['preset', 'dsg-stack'], colonnade: ['preset', 'dsg-colonnade'] };
  const PFN = { glass: '올 글라스', brick: '벽돌 피어', stack: '스택 프레임', colonnade: '자이언트 오더 기둥' };
  function click(id, val) { const e = document.getElementById(id); if (!e) return; if (e.type === 'checkbox') { if (e.checked === val) return; e.checked = val; } else { if (e.checked) return; e.checked = true; } e.dispatchEvent(new Event('change', { bubbles: true })); }
  // 우선 조합: 자주식3 + 1층 3안(작은 모서리문) + 기준층도 같은 선 + 마감재
  function preset(pf) {
    pendingSwitch = { t: now(), what: pf };
    click('sch-alt4'); click('g1-skin'); click('t-upstraight', true);
    const [mode, id] = PF[pf] || PF.glass;
    click(mode === 'combo' ? 'em-combo' : 'em-preset');
    if (mode === 'combo') { click('form-none'); }
    click(id);
    PR.pf = pf; panelSync();
  }
  function goLevel(key) {
    const X = window.KHXR, L = K.LEVELS.findIndex(l => l.key === key);
    if (key === 'out') { if (K.I.on) X.go('corner'); panelSync(); return; }
    if (L < 0) return;
    if (!K.I.on) X.enterInt();
    X.placeLevel(L, true); panelSync();
  }
  let PNL = null;
  function panel(on) {
    if (!on) { if (PNL) PNL.hidden = true; return; }
    if (!PNL) {
      PNL = document.createElement('div'); PNL.className = 'pr-panel'; PNL.id = 'pr-panel';
      PNL.innerHTML = `<b>실사 3D · 우선 조합</b> <span style="color:var(--muted)">자주식3 · 1층 3안(문 2.4m) · 기준층 같은 선</span>
<div class="r" id="pr-pf">${Object.keys(PF).map(k => `<button data-pf="${k}">${PFN[k]}</button>`).join('')}</div>
<div class="r" id="pr-lv"><button data-lv="out">외관</button><button data-lv="1F">1층</button><button data-lv="B1">B1</button><button data-lv="B2">B2</button><button data-lv="B3">B3</button></div>
<small id="pr-stat">준비 중</small><small>주변 건물: 브이월드(국토교통부 건축물정보), © OpenStreetMap contributors</small>`;
      document.getElementById('viewer').appendChild(PNL);
      PNL.querySelectorAll('[data-pf]').forEach(b => b.addEventListener('click', () => preset(b.dataset.pf)));
      PNL.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => goLevel(b.dataset.lv)));
    }
    PNL.hidden = false; panelSync(); statLine();
  }
  function panelSync() {
    if (!PNL) return; const s = K.state;
    const cur = s.mode === 'preset' ? (s.pdesign === 'stack' ? 'stack' : s.pdesign === 'colonnade' ? 'colonnade' : '') : (s.cfin === 'glass' && s.cform === 'none' ? 'glass' : s.cfin === 'brick' && s.cform === 'none' ? 'brick' : '');
    PNL.querySelectorAll('[data-pf]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pf === cur));
    const lv = K.I.on ? (K.Lv() || {}).key : 'out';
    PNL.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lv === lv));
  }
  function statLine() {
    const el = document.getElementById('pr-stat'); if (!el) return;
    const t = PR.t, a = [];
    a.push(pend.n && pend.done < pend.n ? `텍스처 ${pend.done}/${pend.n}` : t.assets != null ? `자산 완료 ${(t.assets / 1000).toFixed(1)}초` : '');
    if (t.firstFrame != null) a.push(`켜기 ${t.firstFrame}ms`);
    if (t.switch != null) a.push(`조합 전환 ${t.switch}ms`);
    el.textContent = a.filter(Boolean).join(' · ') || '준비 중';
    panelSync();
  }
  setInterval(() => { if (PR.on) statLine(); }, 1000);

  /* ================= 9. 진단 ================= */
  // 한 프레임 전체(후처리 패스 포함)의 그리기 호출·삼각형
  PR.frameInfo = () => new Promise(res => { const inf = R.info; inf.autoReset = false; inf.reset(); requestAnimationFrame(() => requestAnimationFrame(() => { const r = { calls: inf.render.calls, tris: inf.render.triangles, programs: inf.programs.length }; inf.autoReset = true; res(r); })); });
  PR.diag = () => {
    const i = R.info; return { ver: VER, on: PR.on, t: PR.t, stat: PR.stat, programs: i.programs.length, calls: i.render.calls, tris: i.render.triangles, geos: i.memory.geometries, textures: i.memory.textures, pending: pend.n - pend.done, mats: CACHE.size };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
