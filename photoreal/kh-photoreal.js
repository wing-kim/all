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
  const VER = '1101.b';
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
    R.domElement.addEventListener('webglcontextrestored', restore);
    swReg();
    // Wing 은 한 프레임에 장면을 여러 번 그린다(화면 효과 단계마다). 내 매 프레임 처리는 화면 프레임마다 한 번만 한다.
    // 창의 rAF 는 Wing 그리기 뒤에 돌아 다음 프레임 번호를 올린다. VR 중에는 창 rAF 가 멈추므로 그리기마다 처리한다(VR 은 프레임당 한 번 그림)
    (function tk() { PR.tick = (PR.tick || 0) + 1; requestAnimationFrame(tk); })();
    let lastTick = -1;
    scene.onBeforeRender = (function (prev) { return function () { if (prev) prev.apply(this, arguments); if (!PR.on) return; if (R.xr.isPresenting || PR.tick !== lastTick) { lastTick = PR.tick; frame(); } }; })(scene.onBeforeRender);
    // 실사 3D 를 고르기 전에 자산을 낮은 우선순위로 미리 받아 둔다(데이터 절약 모드·느린 회선 제외). 고르는 순간 대부분 저장본에서 읽는다.
    // ?pr=1 로 바로 켜는 경우는 미리받기가 실제 필요한 요청과 대역을 다투므로 하지 않는다(켜는 순간 남은 미리받기도 멈춘다)
    if (Q.get('pr') !== '1') setTimeout(() => { if (!PR.on) prefetch(); }, 2500);
    if (Q.get('pr') === '1') { await new Promise(r => setTimeout(r, 300)); preset(Q.get('pf') || 'glass'); enable(true).then(() => { const lv = Q.get('lv'); if (lv) goLevel(lv); }); }
  }

  /* ================= 1. 자산 ================= */
  // 자산 저장소(서비스 워커, T7): 두 번째 방문부터 실사 3D 자산을 네트워크 없이 읽는다. 파일 해시(prefetch.json)가 바뀐 것만 새로 받는다. ?prsw=0 이면 끈다
  function swReg() {
    if (Q.get('prsw') !== '1' || !('serviceWorker' in navigator) || !window.isSecureContext) return;   // 배치 C(T7)에서 기본 켬으로 바꾼다
    navigator.serviceWorker.register(new URL('../new/kh-pr-sw.js', BASE).href, { scope: new URL('../new/', BASE).href })
      .then(r => { PR.sw = r.active ? 'active' : 'installing'; }).catch(e => log('자산 저장소 등록 실패', e && e.message));
  }
  function prefetch() {
    const c = navigator.connection; if (c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ''))) { log('미리받기 생략(절약 모드)'); return; }
    const q0 = f => BASE + f + (/^(bake|codex|context)\//.test(f) ? '?v=' + VER : '');
    fetch(BASE + 'prefetch.json?v=' + VER).then(r => r.ok ? r.json() : null).then(async j => {
      if (!j) return; const q = j.files.slice(), t0 = now(); PR.pre = { n: q.length, done: 0, bytes: j.bytes };
      const worker = async () => { while (q.length && !PR.on) { const f = q.shift(); try { const r = await fetch(q0(f), { priority: 'low' }); await r.arrayBuffer(); } catch (e) {} PR.pre.done++; } };
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
    }, undefined, () => { log('하늘 실패', key); delete SKYD[key]; fail('하늘', () => skyLoad(key)); res(null); }))));
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
  /* 조합별 굽기(manifest.variants): 기본 한 벌은 자주식3·1층 3안. 다른 주차 방식(sch:*)은 지하층과 1층, 다른 1층 안(g1:*)은 1층만 따로 구웠다.
     지금 조합에 맞는 변형 칸을 기본 아틀라스의 같은 층 칸 위에 덮어 한 장으로 합친다. 칸마다 밝기 척도(scale)가 달라
     합친 장의 척도는 가장 큰 값으로 두고 화소를 다시 맞춘다(감마 2.2 저장이라 화소값에 (원래 척도/새 척도)^(1/2.2)를 곱하면 된다) */
  function bakeVars() {
    const m = BAKE.man, v = m.variants || {}, st = K.state, base = m.state || {}, out = [];
    if (st.scheme && st.scheme !== base.scheme && v['sch:' + st.scheme]) out.push('sch:' + st.scheme);
    if (st.g1 && st.g1 !== base.g1 && v['g1:' + st.g1] && st.scheme !== 'self') out.push('g1:' + st.g1);   // 자주식1은 1층 안이 고정
    return out;
  }
  function bakeTex(slot, vars) {
    const key = slot + '|' + vars.join(',');
    if (BAKE.tex[key]) return BAKE.tex[key];
    const man = BAKE.man, info = man.slots[slot]; if (!info) return null;
    const t = BAKE.tex[key] = new T.Texture(); t.encoding = T.LinearEncoding; t.generateMipmaps = false; t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.userData = { ready: false, scale: info.scale, boxes: {} };
    const load = f => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = BASE + 'bake/' + f + '?v=' + VER; });
    Promise.all([load(info.file), ...vars.map(k => man.variants[k].slots[slot] ? load(man.variants[k].slots[slot].file) : null)]).then(([img, ...vi]) => {
      if (!img) return;
      if (!vars.length) t.image = img;
      else {
        const W = img.width, H = img.height, res = man.res, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        let S = info.scale; vars.forEach(k => { const q = man.variants[k].slots[slot]; if (q) S = Math.max(S, q.scale); });
        const d = g.getImageData(0, 0, W, H), kb = Math.pow(info.scale / S, 1 / 2.2);
        if (kb < 0.999) for (let i = 0; i < d.data.length; i += 4) { d.data[i] *= kb; d.data[i + 1] *= kb; d.data[i + 2] *= kb; }
        vars.forEach((k, j) => {
          const V = man.variants[k], im = vi[j]; if (!im) return;
          const vc = document.createElement('canvas'); vc.width = im.width; vc.height = im.height; const vg = vc.getContext('2d'); vg.drawImage(im, 0, 0);
          const vd = vg.getImageData(0, 0, im.width, im.height), kv = Math.pow(V.slots[slot].scale / S, 1 / 2.2);
          V.levels.forEach(L => {
            const bl = man.levels.find(q => q.key === L.key); if (!bl) return;
            // 칸 번호의 행은 텍스처 아래쪽부터(이미지 flipY): 캔버스 y = 높이 - (행+1)·해상도
            [0, 1].forEach(e => { const sc = L.tile[e] % V.cols, sr = Math.floor(L.tile[e] / V.cols), dc = bl.tile[e] % man.cols, dr = Math.floor(bl.tile[e] / man.cols);
              const sy0 = im.height - (sr + 1) * res, dy0 = H - (dr + 1) * res;
              for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) { const si = ((sy0 + y) * im.width + sc * res + x) * 4, di = ((dy0 + y) * W + dc * res + x) * 4;
                d.data[di] = vd.data[si] * kv; d.data[di + 1] = vd.data[si + 1] * kv; d.data[di + 2] = vd.data[si + 2] * kv; d.data[di + 3] = 255; } });
            t.userData.boxes[L.key] = L.box;
          });
        });
        g.putImageData(d, 0, 0); t.image = c; t.userData.scale = S;
      }
      t.needsUpdate = true; t.userData.ready = true; if (PR.t.bake == null && PR.t.enable0) PR.t.bake = Math.round(now() - PR.t.enable0);
    });
    return t;
  }
  // 매 프레임: 시간대·층 배치가 바뀌었을 때만 uniform 을 바꾼다
  function bakeUpdate() {
    const m = BAKE.man; if (!m) { BAKE.u.on.value = 0; return; }
    const slot = bakeSlot(), vars = bakeVars(), t = bakeTex(slot, vars);
    const sig = slot + '|' + vars.join(',') + '|' + K.LEVELS.map(l => l.key + K.floorTop(l).toFixed(2) + K.ceilOf(l).toFixed(2)).join(',');
    if (t && t.userData.ready && sig !== BAKE.sig) {
      BAKE.sig = sig; BAKE.slot = slot;
      BAKE.u.tex.value = t; BAKE.u.k.value = t.userData.scale * (BAKE.gain[slot] || 1); BAKE.vars = vars;
      let n = 0;
      K.LEVELS.forEach(L => {
        if (n >= 16 || L.kind === 'roof') return;
        const b = m.levels.find(q => q.key === L.key) || m.levels.filter(q => q.kind === L.kind).pop(); if (!b) return;
        // 층고가 바뀌어도 같은 층의 굽기를 늘려 쓴다(현재 층의 바닥·천장 높이 + 굽기의 평면 범위)
        BAKE.u.lv.value[n].set(K.floorTop(L), K.ceilOf(L), b.tile[0], b.tile[1]);
        const [x0, z0, x1, z1] = t.userData.boxes[b.key] || b.box; BAKE.u.box.value[n].set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)); n++;
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
      // 우선 4종 밖 마감재 중 재료 사진으로 질감을 낼 수 있는 것: 테라코타(점토 결), 우드 루버(나뭇결), 아치 석재, 노출 콘크리트
      [FM.terra, { make: () => texMat('concrete-wall', 1.4, { tint: 0xad6243, ns: 0.6 }) }], [FM.terraBand, { make: () => texMat('concrete-wall', 1.4, { tint: 0x8f4a31, ns: 0.6 }) }],
      [DZM.wood, { make: () => texMat('furniture-veneer', 0.9, { tint: 0xd9b48c, ns: 0.6 }) }],
      [DZM.arch, { make: () => texMat('facade-granite', 1.8, { tint: 0xe3d9c6, ns: 0.6 }) }],
      [DZM.conc, { make: () => texMat('concrete-wall', 2.7, { tint: 0xb9b6b0 }) }],
      [FM.bronze, { make: () => metal(0x5a4a3a, 0.36, 0.9) }], [FM.bronzeL, { make: () => metal(0x7a6650, 0.4, 0.9) }], [DZM.bz, { make: () => metal(0x5a4a3a, 0.36, 0.9) }],
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
      if (orig === M.bfloor || orig === M.ramp) return env(texMat('office-concrete', 3, { tint: 0x8a8d91, light: Lp, ns: 0.2, noRough: true, p: { roughness: 0.16 }, under: lin(0xb9bab7) }), 1.0);
      if (orig === BM2.pad) return env(texMat('office-concrete', 3, { tint: 0x96999e, light: Lp, ns: 0.2, noRough: true, p: { roughness: 0.22 } }), 0.9);
      if (orig === M.paint) return env(paint(0xf2f1ec, 0.4, 0.5, Lp));
      if (orig === M.paintY) return env(paint(0xe6b52e, 0.4, 0.5, Lp));
      if (orig === BM2.stop) return env(paint(0x5d6064, 0.6, 0.4, Lp));
      if (orig === M.bceil) return env(texMat('concrete-wall', 2.7, { tint: 0xb9bab7, ns: 0.4, light: { amb: new T.Color(0.16, 0.16, 0.16), lm: LT.lm, box: LT.box, k: 0.5 } }), 0.4);
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
    if (!FURN.open && K.I.on) { FURN.go(); envAssets(); }   // 실내(주차장 차량 포함)로 들어가면 가구·차량을 바로 받는다
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
    // 지하층 안에서는 바깥이 보이지 않으므로 주변 건물·땅을 그리지 않는다(VR 그리기 호출 예산)
    if (CTX.next && CTX.detached.length) { const nw = K.state.era === 'new'; if (!nw) ctxNow(); if (CTX.now) CTX.now.visible = !nw && !inBase; CTX.next.visible = nw && !inBase; }
    if (GND.g) { const nw = K.state.era === 'new', xr = R.xr.isPresenting; GND.g.visible = !!CTX.detached.length && !inBase; GND.now.visible = !nw;
      if (GND.poles) { GND.poles.visible = !(xr && K.I.on); GND.poles.children.forEach(o => { if (o.name !== 'pr-poles') o.visible = !xr; }); }
      if (GND.xrOn !== xr) { GND.xrOn = xr; GND.far.forEach(m => { m.visible = !xr; }); GND.kind.forEach(m => { m.visible = !xr; }); GND.xr.forEach(m => { m.visible = xr; }); }
      if (PF_.xrCtx !== xr) { PF_.xrCtx = xr; [CTX.now, CTX.next].forEach(g => g && g.children.forEach(m => { if (m.userData.cls === 'trim_far' || m.userData.cls === 'dong') m.visible = !xr; })); } }
    NIGHT.value = night ? 1 : 0;
    if (CTX.towers) { let n = 0; CTX.towers.forEach(t => { if (t.bb && !t.mesh.visible && n < 8) TWH.box.value[n++].set(t.bb[0], t.bb[1], t.bb[2], t.bb[3]); }); TWH.n.value = n; }
    if (envDay && !inBase && skyCur.key === wantSky && scene.environment !== envDay) { if (scene.environment && scene.environment !== PR.lastEnv) PR.wingEnv = scene.environment; scene.environment = envDay; PR.lastEnv = envDay; }
    // 내 가구 묶음은 해당 층 묶음의 표시 상태를 따른다(내부 보기의 층 숨김·인형집 보기)
    // 층 묶음은 원본이 재건할 때마다 새로 생기므로 층 이름으로 매번 찾는다
    // 밖(건물 밖 보기)에서는 안쪽 묶음을 숨긴다. VR 은 퀘스트 예산 때문에 밖에서는 1층 창가만, 안에서는 지금 층만 보인다
    const xr = R.xr.isPresenting, inside = K.I.on, Lv = K.I.on && K.Lv && K.Lv(), cur = Lv ? Lv.key : null;
    DR.groups.forEach(([g, key]) => {
      let v = true;
      if (key) { const i = K.LEVELS.findIndex(l => l.key === key), lg = K.LG && K.LG[i]; v = !!(lg && lg.visible && lg.parent); }
      if (g.userData.prDeepG && !inside) v = false;
      if (xr && !inside && key !== '1F') v = false;
      if (xr && inside && key && key !== cur) v = false;
      g.visible = v;
    });
    perf();
    optTick();
  }
  /* ================= 5-3. 화면 메시 합치기(T1) =================
     XR 계층의 합치기(KHXRLayer.opt)를 VR 밖 화면에서도 쓴다: 같은 재질 메시를 한 덩어리로 그려 그리기 호출을 줄인다(외관 약 6,900 → 1,000 미만 목표).
     합칠 묶음은 실사 3D 가 아는 정적 묶음만(우리 건물·대지·주변·가구·땅). 장면 구성이 바뀌면 바로 걷고(원본이 보임) 0.4초 조용하면 다시 합친다.
     ?propt=0 이면 끈다 */
  const OPT = { on: Q.get('propt') !== '0', sig: '' };
  const optApi = () => window.KHXRLayer && window.KHXRLayer.opt && window.KHXRLayer.opt.screenOn ? window.KHXRLayer.opt : null;
  function optRoots() { return [K.bld, K.site, K.city, K.ctx, K.exist, K.R3D.props, DR.group, ENV.group, CTX.now, CTX.next, GND.g]; }
  function optSig() {
    let dv = ''; DR.groups.forEach(([g]) => { dv += g.visible ? 1 : 0; });
    return [PF_.shSig, PF_.dvKey, dv, GND.g ? (GND.g.visible ? 1 : 0) + '' + (GND.now.visible ? 1 : 0) + GND.g.children.length : '-', ENV.added.length, DR.group ? DR.group.children.length : 0, R.xr.isPresenting ? 1 : 0].join('|');
  }
  function optTick() {
    const O = optApi(); if (!O || !OPT.on || R.xr.isPresenting) return;
    if (!O.roots) O.screenOn(optRoots);
    const sg = optSig(); if (sg !== OPT.sig) { OPT.sig = sg; O.pause(400); }
    O.screenTick(now());
    PR.stat.opt = O.stat;
  }
  function optOff() { const O = optApi(); if (O) O.screenOff(); OPT.sig = ''; }
  PR.opt = OPT; PR.optSet = on => { OPT.on = !!on; if (!on) optOff(); };

  /* ================= 5-2. 그리기 부담 줄이기 =================
     측정(10/31, 맥 M5 외관): 프레임당 삼각형 1,950만 개(장면 333만의 6배), 초당 12프레임. 원인과 처리:
     1) Wing 의 해 그림자는 장면을 그릴 때마다(한 프레임에 3번) 다시 계산된다 → 해·장면·보이는 층이 바뀔 때만 계산(그림자 카메라는 고정이라 시점과 무관)
     2) 화면 효과 단계: RenderPass 가 그린 화면을 SSAO 단계가 자기 화면으로 덮어 쓴다 → SSAO 가 켜진 동안 RenderPass 는 건너뛴다(결과 동일)
     3) 실내 가구(장면 삼각형의 82%)는 밖에서도 모두 그려지고 그림자도 드리운다 → 밖에서는 창가 띠(외벽에서 PR_DEEP m 이내)만 보이고 그림자는 끈다.
        VR 에서는 퀘스트 예산에 맞춰 밖에서는 1층 카페 창가만, 안에서는 지금 서 있는 층만 보인다
     5) SSAO(구석 어둡게)는 남은 비용의 40%(초당 30 → 50프레임). 화면을 돌리거나 걷는 동안에는 건너뛰고(장면 한 번만 그림),
        멈추고 0.25초 뒤부터 다시 그린다. 멈춘 화면·저장 이미지는 그대로 SSAO 가 들어간다
     4) Wing 의 유리 반사 지도(정육면체 6면)는 건물을 숨기고 그리는데 내 가구·가로수는 건물 밖 묶음이라 6번 더 그려졌다 → 반사 지도를 그릴 때는 숨긴다 */
  const PR_DEEP = 4.0;
  const PF_ = { shSig: '', shDirty: true, dvKey: '', rp: null, cube: null };
  function dressVisKey() {
    return (K.I.on ? 'in' : 'out') + '|' + (DR.group ? DR.group.uuid + DR.groups.length : '');
  }
  function applyDressVis() {
    const inside = K.I.on;
    if (!DR.group) return;
    DR.group.traverse(o => { if (o.isMesh) o.castShadow = inside && !o.userData.prNoCast; });
    PF_.shDirty = true;
  }
  function perf() {
    // 3) 가구 표시: 상태가 바뀔 때만 훑는다
    const dk = dressVisKey(); if (dk !== PF_.dvKey) { PF_.dvKey = dk; applyDressVis(); }
    xrFlat();
    // 2) RenderPass 건너뛰기(한 번만 감싼다. 실사 3D 를 끄면 원래대로 그린다)
    const C = K.R3D.composer, rp = C && C.passes && C.passes[0];
    if (rp && !rp.prWrap && rp.constructor && rp.constructor.name === 'RenderPass' && K.R3D.ssao) {
      const orig = rp.render, ss = K.R3D.ssao;
      rp.render = function () { if (PR.on && ss.enabled && ss.output === 0) return; return orig.apply(this, arguments); };
      rp.prWrap = true;
    }
    // 5) 움직이는 동안 SSAO 건너뛰기
    const cm = window.KHXR.camera.matrixWorld.elements, lc = PF_.cam || (PF_.cam = new Float64Array(16));
    // 관성(감쇠)으로 아주 느리게 남는 움직임은 멈춘 것으로 본다(회전 성분 5e-4, 위치 5mm 미만)
    let mv = false; for (let i = 0; i < 16; i++) if (Math.abs(cm[i] - lc[i]) > (i >= 12 ? 5e-3 : 5e-4)) { mv = true; break; }
    if (mv) for (let i = 0; i < 16; i++) lc[i] = cm[i];
    if (mv) PF_.moved = now();
    const ss = K.R3D.ssao;
    if (ss && !ss.prWrap) {
      const sr = ss.render;
      ss.render = function (renderer, writeBuffer) {
        if (PR.on && !PR.still && PF_.moved && now() - PF_.moved < 250 && this.output === 0) { renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); renderer.clear(); renderer.render(this.scene, this.camera); return; }
        return sr.apply(this, arguments);
      };
      ss.prWrap = true;
    }
    // 4) 반사 지도: 그릴 때 가구·가로수·워밍업 판을 숨긴다
    const cc = K.R3D.cubeCam;
    if (cc && !cc.prWrap) {
      const up = cc.update;
      cc.update = function () {
        const self = this, args = arguments, O = optApi();
        const run = () => {
          const hide = [DR.group, ENV.group, warmG].filter(g => g && g.visible), t0 = now();
          if (PR.on) hide.forEach(g => { g.visible = false; });
          const r = up.apply(self, args);
          hide.forEach(g => { g.visible = true; });
          PR.stat.cubeMs = Math.round(now() - t0); PF_.shDirty = true;
          return r;
        };
        // 합친 메시에는 건물이 섞여 있어 Wing 이 건물을 숨겨도 반사에 남는다 → 원본으로 되돌린 채 그린다
        return PR.on && O ? O.bare(run) : run();
      };
      cc.prWrap = true;
    }
    // 1) 그림자: 해 위치·세기, 층 배치, 보이는 층, 가구·주변 건물·거리 소품 상태가 바뀔 때만 다시 계산
    const sm = R.shadowMap;
    if (sm.autoUpdate) { PF_.shAuto = true; sm.autoUpdate = false; PF_.shDirty = true; }
    const sp = K.sun.position, f = v => Math.round(v * 10);
    let lgv = ''; if (K.LG) for (let i = 0; i < K.LG.length; i++) lgv += K.LG[i] && K.LG[i].visible && K.LG[i].parent ? '1' : '0';
    const sig = [f(sp.x), f(sp.y), f(sp.z), K.sun.castShadow ? 1 : 0, CUR.sig, lgv, K.bld.children.length, K.bld.visible ? 1 : 0, K.city.visible ? 1 : 0, K.ctx.visible ? 1 : 0, K.exist && K.exist.visible ? 1 : 0,
      CTX.now ? (CTX.now.visible ? 1 : 0) + '' + (CTX.now.parent ? 1 : 0) : '-', CTX.next ? (CTX.next.visible ? 1 : 0) + '' + (CTX.next.parent ? 1 : 0) : '-', ENV.group ? 1 : 0, ENV.added.length, K.state.era].join(',');
    if (sig !== PF_.shSig) { PF_.shSig = sig; PF_.shDirty = true; }
    if (PF_.shDirty) { sm.needsUpdate = true; PF_.shDirty = false; }
  }
  /* VR 그리기 호출: XR 계층은 같은 재질끼리 합쳐 그리므로 호출 수 ≈ 재질 종류 수 × 2(양안). 차량 5종과 가구 모델은 재질이 많아
     실사 3D 를 켜면 336회(Wing 렌더 모드 184회)였다. VR 에서는 차량 전부와 건물 밖에서 보이는 가구를 '꼭짓점 색 + 공유 재질 하나'로
     바꿔 한 묶음으로 합쳐지게 한다. 색은 재질 색 × 텍스처 평균색. 데스크톱과 VR 실내 가구는 원래 재질 그대로다 */
  const FLAT = PR.flat = { mats: {}, geo: new Map(), avg: new Map(), key: '', on: [], off: Q.get('xrflat') === '0' };
  function avgColor(m) {
    if (FLAT.avg.has(m)) return FLAT.avg.get(m);
    const c = m.color ? m.color.clone() : new T.Color(0.7, 0.7, 0.7), img = m.map && m.map.image;
    if (img && (img.width || img.videoWidth)) { try { const cv = document.createElement('canvas'); cv.width = cv.height = 4; const g = cv.getContext('2d'); g.drawImage(img, 0, 0, 4, 4); const d = g.getImageData(0, 0, 4, 4).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < 64; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const t = new T.Color(r / 16 / 255, gg / 16 / 255, b / 16 / 255).convertSRGBToLinear(); c.multiply(t); } catch (e) {} }
    if (m.transparent && m.opacity < 0.7) c.setRGB(0.03, 0.04, 0.05);   // 유리는 어두운 면으로
    FLAT.avg.set(m, c); return c;
  }
  function flatGeo(o) {
    const mats = Array.isArray(o.material) ? o.material : [o.material], key = o.geometry.uuid + '|' + mats.map(m => m.uuid).join(',');
    if (FLAT.geo.has(key)) return FLAT.geo.get(key);
    // 인덱스를 풀어 위치·법선만 새 배열로 읽는다(r128 의 toNonIndexed 는 glTF 의 교차 배치 속성을 잘못 읽는다)
    const G0 = o.geometry, ix = G0.index, n = ix ? ix.count : G0.attributes.position.count, g = new T.BufferGeometry();
    const rd = at => { if (!at) return null; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const k = ix ? ix.getX(i) : i; a[i * 3] = at.getX(k); a[i * 3 + 1] = at.getY(k); a[i * 3 + 2] = at.getZ(k); } return new T.BufferAttribute(a, 3); };
    g.setAttribute('position', rd(G0.attributes.position)); if (G0.attributes.normal) g.setAttribute('normal', rd(G0.attributes.normal)); else g.computeVertexNormals();
    const col = new Float32Array(n * 3), groups = Array.isArray(o.material) && o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: n, materialIndex: 0 }];
    groups.forEach(gr => { const c = avgColor(mats[gr.materialIndex] || mats[0]), st = gr.start, en = Math.min(n, st + gr.count); for (let i = st; i < en; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } });
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeBoundingSphere();
    FLAT.geo.set(key, g); return g;
  }
  function xrFlat() {
    const xr = R.xr.isPresenting, inside = K.I.on;
    const Lv = inside && K.Lv && K.Lv(); const key = xr ? (inside ? 'in:' + (Lv ? Lv.key : '') : 'out') + '|' + ENV.added.length + '|' + (DR.group ? DR.group.uuid : '') + '|' + CUR.sig : '';
    if (key === FLAT.key) return; FLAT.key = key;
    FLAT.on.forEach(o => { o.geometry = o.userData.prFlat.g; o.material = o.userData.prFlat.m; delete o.userData.prFlat; }); FLAT.on = [];
    if (!xr || FLAT.off) return;
    // 구역별 공유 재질(실내 가구와 같은 조명 보정). 구역마다 한 묶음
    const flatMat = zone => FLAT.mats[zone] || (FLAT.mats[zone] = (() => {
      const m = std({ vertexColors: true, roughness: 0.5, metalness: 0.15 }), amb = zone === 'g' ? AMB.g() : zone === 'u' ? AMB.u() : zone === 'b' ? new T.Color(0.32, 0.32, 0.33) : null;
      if (zone === 'b') m.envMap = parkEnv();
      const r = amb ? patch(m, { light: { amb } }) : m; r.userData.prMade = true; keepEnv(r); return r; })());
    const wp = new T.Vector3(), bx = new T.Box3(), sz = new T.Vector3();
    const zoneAt = o => { bx.setFromObject(o); const L = bx.isEmpty() ? null : levelAtY((bx.min.y + bx.max.y) / 2); return !L ? 'x' : L.kind === 'base' ? 'b' : L.kind === 'ground' ? 'g' : 'u'; };
    // 잎처럼 알파로 모양을 내는 재질은 단색으로 바꾸면 네모 카드가 되므로 그대로 둔다
    const alphaShape = m => m.alphaTest > 0 || m.alphaMap || (m.transparent && m.map);
    // 차량은 잎이 없으므로(유리·차체가 반투명 표시를 달고 있어도) 모두 바꾼다
    const take = (o, car) => { if (!o.isMesh || o.isInstancedMesh || o.userData.prFlat || !o.material || o.userData.prLit) return; if (!car && (Array.isArray(o.material) ? o.material : [o.material]).some(alphaShape)) return; // 바닥 마감·큰 판(가로나 세로 3m 이상)은 텍스처가 보이는 면이라 그대로 둔다
      if (!car) { bx.setFromObject(o).getSize(sz); if (Math.max(sz.x, sz.z) > 3) return; }
      o.userData.prFlat = { g: o.geometry, m: o.material }; o.geometry = flatGeo(o); o.material = flatMat(zoneAt(o)); FLAT.on.push(o); };
    ENV.added.forEach(c => c.traverse(o => take(o, true)));
    if (DR.group) DR.groups.forEach(([g]) => { if (g.visible && (inside || !g.userData.prDeepG)) g.traverse(o => take(o, false)); });
    PF_.shDirty = true;
  }
  function perfOff() {
    FLAT.on.forEach(o => { o.geometry = o.userData.prFlat.g; o.material = o.userData.prFlat.m; delete o.userData.prFlat; }); FLAT.on = []; FLAT.key = '';
    if (PF_.shAuto) { R.shadowMap.autoUpdate = true; PF_.shAuto = false; }
    R.shadowMap.needsUpdate = true; PF_.dvKey = ''; PF_.shSig = '';
  }

  /* ================= 5-1. 셰이더 미리 준비 =================
     지하·1층처럼 처음 보는 순간에야 그려지는 재질은 그때 셰이더를 만들며 1～2초 멈춘다.
     켠 직후부터 프레임마다 몇 개씩, 카메라 바로 앞의 아주 작은 판에 씌워 한 번 그려 미리 만들어 둔다. */
  const WARM = [];
  let warmG = null, warmMs = [];
  function warm() {
    if (warmG) { scene.remove(warmG); warmG = null; }
    if (!WARM.length) { if (PR.t.warm == null && PR.t.enable0 && DR.group) { PR.t.warm = Math.round(now() - PR.t.enable0); statLine(); setTimeout(refreshRefl, 50); } return; }
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
  // Wing 의 유리 반사 지도를 실사 재질로 한 번 다시 그린다. 반사 지도용 셰이더 변형(그리는 대상이 정육면체 텍스처라 따로 만들어진다)을
  // 워밍업 끝에 미리 만들어, 첫 조합 전환(첫 벽돌 전환 6.6초 멈춤의 원인)에서 만들지 않게 한다. 주변 건물이 반사에 들어가는 효과도 있다.
  // Wing 은 '주변 도시' 체크 상자가 바뀔 때 반사 지도를 다시 그린다(값은 그대로 두고 알림만 보낸다)
  function refreshRefl() {
    if (!PR.on || !K.R3D.on) return;
    const e = document.getElementById('t-city'); if (!e) return;
    const t0 = now(); PR.silent = true; e.dispatchEvent(new Event('change')); PR.silent = false;
    PR.stat.reflMs = Math.round(now() - t0); log('반사 지도 갱신', PR.stat.reflMs + 'ms');
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
    DR.busy = true;
    await FURN.wait;   // 로딩 순서(T3): 밖에서 켜면 우리 건물·하늘·주변 건물 다음에 받는다. 실내로 들어가면 바로 연다
    const t0 = now();
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
      parkingServices(extra);
      litDress(extra);
      tagDress(extra);
      if (DR.group) { scene.remove(DR.group); }
      DR.group = extra; DR.sig = sig; scene.add(extra);
      if (!DR.groups.length || DR.groups[0][0].parent !== extra) DR.groups = extra.children.map(g => [g, g.userData.fitoutFloor || levelKeyOf(g)]);
      PR.stat.dressMs = Math.round(now() - t0); PR.stat.dressObjects = (() => { let n = 0; extra.traverse(o => { if (o.isMesh) n++; }); return n; })();
      if (PR.t.dress == null && PR.t.enable0) PR.t.dress = Math.round(now() - PR.t.enable0);
      log('실내 꾸밈', PR.stat.dressMs + 'ms', PR.stat.dressObjects + '개');
    } catch (e) { log('실내 꾸밈 실패', e && e.message); console.warn(e); DR.ready = null; fail('실내 가구', () => dress()); }
    DR.busy = false;
    if (DR.again) { DR.again = false; dress(); }
  }
  // 지하주차장 천장 설비: 스프링클러 주관(빨강)·가지관·헤드, 배수관(회색), 케이블 트레이. 실제 지하주차장을 지하주차장답게 보이게 하는 요소.
  // 층마다 종류별 인스턴스 묶음 1개(그리기 호출 층당 5회 안팎), 그림자는 드리우지 않는다(해가 닿지 않음)
  function parkingServices(extra) {
    const levels = K.LEVELS.filter(L => L.kind === 'base' && (window.PARKING_FLOORS || []).includes(L.key));
    if (!levels.length) return;
    const PE = parkEnv(), amb = new T.Color(0.2, 0.2, 0.2);
    const mk = (c, r, met = 0) => { const m = std({ color: lin(c), roughness: r, metalness: met }); m.envMap = PE; m.envMapIntensity = 0.6; return patch(m, { light: { amb } }); };
    const MS = PF_.svc || (PF_.svc = { red: mk(0xa3241c, 0.45), gray: mk(0x8a8d90, 0.6), tray: mk(0x9ea3a6, 0.42, 0.8), head: mk(0xd8c9a0, 0.35, 0.7) });
    const cyl = PF_.cyl || (PF_.cyl = new T.CylinderGeometry(0.5, 0.5, 1, 10, 1, true).rotateZ(Math.PI / 2)), boxG = PF_.boxG || (PF_.boxG = new T.BoxGeometry(1, 1, 1));
    const headG = PF_.headG || (PF_.headG = new T.CylinderGeometry(0.035, 0.05, 0.09, 8));
    const edgeDist = (x, z, P) => { let d = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, az] = P[j], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); d = Math.min(d, Math.hypot(ax + dx * t - x, az + dz * t - z)); } return d; };
    levels.forEach(L => {
      const P = L.poly.map(q => K.P(q[0], q[1])), inside = (x, z, m) => inPolyW([x, z], P) && edgeDist(x, z, P) > m;
      const bd = polyBounds(L), wx = bd[2] - bd[0], wz = bd[3] - bd[1], alongX = wx >= wz;
      // (u: 긴 축, v: 짧은 축) → 월드
      const W = (u, v) => alongX ? [u, v] : [v, u];
      const [u0, u1, v0, v1] = alongX ? [bd[0], bd[2], bd[1], bd[3]] : [bd[1], bd[3], bd[0], bd[2]];
      const yC = K.ceilOf(L), lists = { red: [], gray: [], tray: [], branch: [], head: [] };
      // 한 줄을 다각형 안쪽 구간들로 자른다(0.5m 간격)
      const runs = (fixed, a0, a1, alongU, margin) => { const out = []; let st = null; for (let a = a0; a <= a1 + 1e-6; a += 0.5) { const [x, z] = alongU ? W(a, fixed) : W(fixed, a); const ok = inside(x, z, margin); if (ok && st === null) st = a; if ((!ok || a + 0.5 > a1) && st !== null) { const e = ok ? a : a - 0.5; if (e - st > 1.5) out.push([st, e]); st = null; } } return out; };
      const mains = []; for (let v = v0 + 5; v < v1 - 2; v += 8.5) mains.push(v);
      mains.forEach((v, i) => runs(v, u0, u1, true, 0.8).forEach(([a, b]) => { lists.red.push([a, b, v, yC - 0.32, 0.16, true]); if (i % 2 === 0) lists.gray.push([a, b, v + 0.45, yC - 0.42, 0.12, true]); }));
      const tv = (v0 + v1) / 2 + 1.6; runs(tv, u0, u1, true, 1.2).forEach(([a, b]) => lists.tray.push([a, b, tv, yC - 0.2]));
      for (let u = u0 + 1.6; u < u1 - 1; u += 3.2) runs(u, v0, v1, false, 0.8).forEach(([a, b]) => { lists.branch.push([a, b, u, yC - 0.22, 0.05, false]); for (let v = a + 1.0; v < b; v += 3.2) lists.head.push(W(u, v).concat(yC - 0.3)); });
      const g = new T.Group(); g.name = L.key + ' parking services'; g.userData.fitoutFloor = L.key;
      const M4 = new T.Matrix4(), q = new T.Quaternion(), yAx = new T.Vector3(0, 1, 0), pos = new T.Vector3(), sc = new T.Vector3();
      const inst = (geo, mat, rows, fill) => { if (!rows.length) return; const im = new T.InstancedMesh(geo, mat, rows.length); rows.forEach((r, k) => { fill(r); M4.compose(pos, q, sc); im.setMatrixAt(k, M4); }); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; Object.assign(im.userData, { prLv: L.key, prDeep: false, prNoCast: true, prSkip: true, prLit: true }); g.add(im); };
      // 관: 원기둥(길이 방향 X)을 긴 축이면 그대로, 짧은 축이면 90° 돌린다
      const pipe = ([a, b, fixed, y, d, alongU]) => { const m = (a + b) / 2, [x, z] = alongU ? W(m, fixed) : W(fixed, m); pos.set(x, y, z); const dirX = alongU === alongX; q.setFromAxisAngle(yAx, dirX ? 0 : Math.PI / 2); sc.set(b - a, d, d); };
      inst(cyl, MS.red, lists.red, pipe); inst(cyl, MS.gray, lists.gray, pipe); inst(cyl, MS.red, lists.branch, pipe);
      inst(boxG, MS.tray, lists.tray, ([a, b, fixed, y]) => { const m = (a + b) / 2, [x, z] = W(m, fixed); pos.set(x, y, z); q.setFromAxisAngle(yAx, alongX ? 0 : Math.PI / 2); sc.set(b - a, 0.08, 0.4); });
      inst(headG, MS.head, lists.head, ([x, z, y]) => { pos.set(x, y, z); q.identity(); sc.set(1, 1, 1); });
      // 천장판: 실내 보기에서는 위층(=천장 슬래브)이 숨겨져 천장 자리에 배경(검정)이 보였다. 밝은 회색 도장 콘크리트 천장을 층마다 깐다
      const sh = new T.Shape(P.map(([x, z]) => new T.Vector2(x, z))), cg = new T.ShapeGeometry(sh); cg.rotateX(Math.PI / 2);
      const LT = levelLight(L), CE = PF_.ceil || (PF_.ceil = {}), cm = CE[LT.sig] || (CE[LT.sig] = (() => { const m = texMat('concrete-wall', 2.7, { tint: 0xc4c5c2, ns: 0.4, light: { amb: new T.Color(0.2, 0.2, 0.2), lm: LT.lm, box: LT.box, k: 0.6 } }); m.envMap = PE; m.envMapIntensity = 0.3; m.side = T.DoubleSide; m.userData.prMade = true; WARM.push(m); return m; })());
      const ce = new T.Mesh(cg, cm); ce.position.y = yC - 0.02; ce.castShadow = false; ce.receiveShadow = false; Object.assign(ce.userData, { prLv: L.key, prDeep: false, prNoCast: true, prSkip: true, prLit: true }); g.add(ce);
      extra.add(g);
    });
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
      if (!o.isMesh || !o.material || Array.isArray(o.material) || o.userData.prLit) return;
      o.getWorldPosition(wp);
      const L = K.LEVELS.find(l => wp.y >= K.floorTop(l) - 0.5 && wp.y < K.floorTop(l) + Math.max(l.h, 3) + 2) || null;
      const zone = !L ? 'x' : L.kind === 'base' ? 'b' : L.kind === 'ground' ? 'g' : 'u';
      const m0 = o.material; if (m0.isMeshBasicMaterial || !m0.isMeshStandardMaterial || (m0.emissiveIntensity > 1 && m0.emissive && m0.emissive.getHex())) return;
      const key = m0.uuid + '|' + zone;
      let m = DR.mats.get(key);
      if (!m) {
        const amb = zone === 'g' ? AMB.g() : zone === 'u' ? AMB.u() : zone === 'b' ? new T.Color(0.32, 0.32, 0.33) : null;
        m = amb ? patch(m0.clone(), { light: { amb } }) : m0;
        // 지하: 주차장 반사 환경을 붙이고, 차 도장(금속성·매끈한 면)은 반사를 살린다
        if (zone === 'b' && m !== m0) { m.envMap = parkEnv(); const paintLike = (m.metalness > 0.25 || m.roughness < 0.45) && !m.transparent; m.envMapIntensity = paintLike ? 1.3 : 0.5; if (paintLike) m.roughness = Math.min(m.roughness, 0.3); }
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
    return ENV.p || (ENV.p = vendor().then(() => Promise.all([...CARS.map(c => loadGLB('assets/cars/car-' + c.f + '.glb')), loadGLB('assets/street-tree.glb')]))
      .then(r => {
        ENV.cars = r.slice(0, CARS.length).map((sc, i) => sc && normModel(sc, CARS[i].len, true)).filter(Boolean);
        ENV.tree = r[CARS.length];
        if (!ENV.tree || ENV.cars.length < CARS.length) { ENV.p = null; fail('거리 소품', envAssets); }
        PR.t.env2 = Math.round(now() - PR.t.enable0); log('거리 소품', PR.t.env2 + 'ms');
        if (PR.on) { placeCars(); placeTrees(); }
      }));
  }
  // 실내 화분(1.9MB)은 가장 늦게: 밖에서는 거의 보이지 않는다
  function plantAssets() {
    return ENV.pp || (ENV.pp = vendor().then(() => loadGLB('assets/interior-foliage.glb')).then(g => {
      if (!g) { ENV.pp = null; fail('실내 화분', plantAssets); return; }
      ENV.plant = g; PR.t.plants = Math.round(now() - PR.t.enable0);
      if (PR.on && DR.group) placePlants(DR.group);
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
    // 6M도로 쪽도 출입구·램프 앞(x 1550, 1850)은 뺐다
    [[120, -690], [120, -1000], [120, -1500], [-1240, -690], [2200, walk(2200)], [2550, walk(2550)], [-1240, 1550], [-1240, -1000]].forEach((q, i) => {
      const t = tree.clone(true), s = (9.2 + (i % 3) * 0.8) / h; t.scale.setScalar(s);
      const [x, z] = K.P(q[0], q[1]); t.position.set(x, 0.18, z); t.rotation.y = i * 2.399; g.add(t);
    });
    scene.add(g);
  }
  function placePlants(extra) {
    if (!ENV.plant) return;
    const anchors = (extra.userData.interiorPlantAnchors || []).slice(0, 14);
    const plant = normModel(ENV.plant.clone(true), 1, false), b = new T.Box3().setFromObject(plant), h = b.max.y - b.min.y;
    anchors.forEach((a, i) => { const p = plant.clone(true), s = (a.height || 1.4) / h; p.scale.setScalar(s); p.position.set(a.x, a.y, a.z); p.rotation.y = i * 1.7; p.userData.prPlant = true; extra.add(p); });
    litDress(extra);
    if (extra === DR.group) { tagDress(extra); PF_.dvKey = ''; }
  }
  // 높이 y 가 속한 층: 바닥이 y 바로 아래(0.3m 여유)에 있는 층 중 가장 높은 층. 층 범위를 겹치게 찾으면 바닥 가까운 부품(의자 다리·화분)이 아래층으로 잡힌다
  function levelAtY(y) { let best = null, bt = -1e9; K.LEVELS.forEach(l => { const ft = K.floorTop(l); if (l.kind !== 'roof' && ft - 0.3 <= y && ft > bt) { bt = ft; best = l; } }); return best; }
  // 가구마다 층(prLv)과 '외벽에서 먼 안쪽'(prDeep: 가장 가까운 외벽선까지 PR_DEEP m 넘음)을 적어 둔다. 밖에서 볼 때 안쪽 가구는 그리지 않는다
  function tagDress(root) {
    root.updateMatrixWorld(true);
    const polys = new Map(), box = new T.Box3(), c = new T.Vector3();
    const polyOf = L => { if (!polys.has(L)) polys.set(L, L.poly.map(q => K.P(q[0], q[1]))); return polys.get(L); };
    const edgeDist = (x, z, P) => { let d = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, az] = P[j], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), ex = ax + dx * t - x, ez = az + dz * t - z; d = Math.min(d, Math.hypot(ex, ez)); } return d; };
    let deep = 0, n = 0; const list = [];
    root.traverse(o => {
      if (!o.isMesh || o.userData.prTagged) return;
      if (o.userData.prLv === undefined) {
        box.setFromObject(o); if (box.isEmpty()) return; box.getCenter(c);
        const L = levelAtY(c.y);
        o.userData.prLv = L ? L.key : '';
        o.userData.prDeep = !!(L && L.poly && L.poly.length > 2 && edgeDist(c.x, c.z, polyOf(L)) > PR_DEEP);
      }
      list.push(o);
    });
    // 층마다 '창가'·'안쪽' 두 묶음으로 옮겨 담는다(월드 위치 유지). 표시는 묶음 단위로 바꾼다:
    // XR 계층의 메시 합치기는 보이는 메시를 합치고 원본을 숨기므로, 메시마다 표시를 바꾸면 서로 덮어쓴다. 묶음을 숨기면 합치기도 따라온다
    const cont = (k, d) => { const nm = 'pr-lv-' + (k || '-') + (d ? '-deep' : '-band'); let g = root.getObjectByName(nm); if (!g) { g = new T.Group(); g.name = nm; g.userData.fitoutFloor = k || null; g.userData.prDeepG = d; root.add(g); } return g; };
    list.forEach(o => { o.userData.prTagged = true; n++; if (o.userData.prDeep) deep++; cont(o.userData.prLv, o.userData.prDeep).attach(o); });
    // 비게 된 원래 묶음은 지운다
    root.children.slice().forEach(g => { if (!/^pr-lv-/.test(g.name)) { let any = false; g.traverse(o => { if (o.isMesh) any = true; }); if (!any) root.remove(g); } });
    DR.groups = root.children.map(g => [g, g.userData.fitoutFloor || null]);
    PR.stat.dressDeep = deep + '/' + n;
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
  /* 주변 건물 외벽: 재질 분류마다 실제 재료 사진(벽) + 그 분류의 창 형태를 4칸 × 2층 캔버스에 그린다.
     건물색(꼭짓점 색)은 벽에만 곱한다(거칠기 맵 G 로 벽·유리 판별). 거칠기(G)·금속성(B), 노멀(창이 들어가 있음)도 함께 만든다.
     UV 는 kh-context 규칙(u = 벽 길이 / 3.2m, v = 높이 / 층고)이라 반복은 (1/4, 1/2). */
  const FW = { imgs: null, mats: {}, maps: {} };
  PR.FW = FW;
  function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  async function facadeImgs() {
    if (FW.imgs) return FW.imgs;
    const names = { tile: 'plaster-white', paint: 'wall-beige', stone: 'facade-granite', brick: 'brick', metal: 'concrete-wall', apt: 'plaster-white', glass: 'concrete-wall' };
    const out = {}; await Promise.all(Object.entries(names).map(async ([k, n]) => { out[k] = await loadImg(BASE + 'tex/' + n + '_color.webp'); }));
    return (FW.imgs = out);
  }
  function facadeCanvas(cls) {
    const W = 1024, H = 512, BW = W / 4, FH = H / 2, img = FW.imgs[cls] || FW.imgs.tile;
    const col = document.createElement('canvas'); col.width = W; col.height = H; const g = col.getContext('2d');
    const rm = document.createElement('canvas'); rm.width = W; rm.height = H; const r = rm.getContext('2d');
    const hm = new Float32Array(W * H).fill(1);
    let seed = cls.length * 977 + 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // 벽: 재료 사진을 실제 크기로(1칸 3.2m = 256px → 80px/m), 밝게 중립화해 건물색이 곱해지게
    const tileM = { brick: 1.0, stone: 1.8, tile: 1.2, paint: 3, metal: 2.7, apt: 1.2, glass: 2.7 }[cls] || 1.2, px = 80 * tileM;
    for (let y = 0; y < H; y += px) for (let x = 0; x < W; x += px) if (img) g.drawImage(img, x, y, px, px);
    g.globalCompositeOperation = 'luminosity'; g.fillStyle = cls === 'brick' ? 'rgba(0,0,0,0)' : 'rgba(205,205,205,0.55)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    if (cls === 'tile' || cls === 'apt') { g.strokeStyle = 'rgba(120,120,120,0.35)'; g.lineWidth = 1; for (let y = 0; y < H; y += 10) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); } for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); } }
    if (cls === 'metal') { g.fillStyle = 'rgba(40,40,40,0.35)'; for (let x = 0; x < W; x += BW / 3) g.fillRect(x, 0, 2, H); }
    r.fillStyle = 'rgb(0,220,0)'; r.fillRect(0, 0, W, H);   // 벽: 거칠기 0.86, 금속성 0
    const frame = cls === 'brick' || cls === 'stone' ? '#26282a' : cls === 'glass' ? '#9aa3a8' : '#d9dbdc';
    // 창 하나: 유리(층마다 조금씩 다른 블라인드·실내 밝기) + 틀, 가림판·거칠기·높이 기록
    function win(x, y, w, h, opt = {}) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      const shade = 0.75 + rnd() * 0.5, blind = rnd() < 0.55 ? rnd() * 0.6 : 0;
      // 유리 밑바탕: 하늘·맞은편 건물이 비친 밝은 청회색(위)에서 실내 어둠(아래)으로
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, `rgb(${150 * shade | 0},${168 * shade | 0},${182 * shade | 0})`); gr.addColorStop(0.55, `rgb(${92 * shade | 0},${106 * shade | 0},${118 * shade | 0})`); gr.addColorStop(1, `rgb(${52 * shade | 0},${60 * shade | 0},${68 * shade | 0})`);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (blind > 0.05) { g.fillStyle = `rgba(${200 + rnd() * 40 | 0},${190 + rnd() * 30 | 0},${170 + rnd() * 30 | 0},0.85)`; g.fillRect(x, y, w, h * blind); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = y; yy < y + h * blind; yy += 4) g.fillRect(x, yy, w, 1); }
      g.fillStyle = frame; const t = opt.frame || 4;
      r.fillStyle = 'rgb(255,200,0)'; r.fillRect(x, y, w, h);   // 창틀: 거칠기 맵 R=1 → 건물의 띠·창틀 색(color2) g.fillRect(x, y, w, t); g.fillRect(x, y + h - t, w, t); g.fillRect(x, y, t, h); g.fillRect(x + w - t, y, t, h);
      (opt.mull || []).forEach(f => g.fillRect(x + w * f - t / 2, y, t, h)); if (opt.transom) g.fillRect(x, y + h * opt.transom, w, t);
      r.fillStyle = 'rgb(0,26,0)'; r.fillRect(x + t, y + t, w - 2 * t, h - 2 * t);   // 유리: 거칠기 0.1, 비금속(반사색이 유리색에 물들지 않게)
      for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) hm[yy * W + xx] = (xx < x + t || xx >= x + w - t || yy < y + t || yy >= y + h - t) ? 0.75 : 0.25;
    }
    // 벽 풍화: 층마다 조금 다른 밝기, 창 아래 빗물 자국, 아래로 갈수록 약간 어둡게(창을 그리기 전에)
    for (let f = 0; f < 2; f++) for (let b = 0; b < 4; b++) {
      const x0 = b * BW, y0 = f * FH, k = (rnd() - 0.5) * 0.14;
      g.fillStyle = k > 0 ? `rgba(255,255,255,${k})` : `rgba(0,0,0,${-k})`; g.globalCompositeOperation = 'source-atop';
      g.fillRect(x0, y0, BW, FH);
      for (let n = 0; n < 3; n++) { const sx = x0 + BW * (0.2 + rnd() * 0.6), sw = 3 + rnd() * 8, gr2 = g.createLinearGradient(0, y0 + FH * 0.7, 0, y0 + FH); gr2.addColorStop(0, 'rgba(60,55,50,0.18)'); gr2.addColorStop(1, 'rgba(60,55,50,0)'); g.fillStyle = gr2; g.fillRect(sx, y0 + FH * 0.72, sw, FH * 0.28); }
      g.globalCompositeOperation = 'source-over';
    }
    for (let f = 0; f < 2; f++) for (let b = 0; b < 4; b++) {
      const x0 = b * BW, y0 = f * FH;   // 캔버스 위쪽 = 높은 층(v 큰 쪽): 층 안에서 위 0, 아래 FH
      if (cls === 'tile' || cls === 'paint') win(x0 + BW * 0.2, y0 + FH * 0.22, BW * 0.6, FH * 0.5, { mull: [0.5] });
      else if (cls === 'brick') { win(x0 + BW * 0.22, y0 + FH * 0.18, BW * 0.56, FH * 0.56, { mull: [0.5], transom: 0.3, frame: 5 }); g.fillStyle = 'rgba(60,40,32,0.6)'; g.fillRect(x0 + BW * 0.2, y0 + FH * 0.12, BW * 0.6, FH * 0.05); }
      else if (cls === 'stone') { win(x0, y0 + FH * 0.28, BW, FH * 0.42, { mull: [0.33, 0.66], frame: 3 }); }
      else if (cls === 'metal') { win(x0 + BW * 0.04, y0 + FH * 0.3, BW * 0.92, FH * 0.38, { mull: [0.5], frame: 3 }); }
      else if (cls === 'apt') { win(x0 + BW * 0.08, y0 + FH * 0.15, BW * 0.84, FH * 0.62, { mull: [0.33, 0.66], frame: 4 });
        g.fillStyle = 'rgba(235,236,236,0.95)'; g.fillRect(x0 + BW * 0.06, y0 + FH * 0.62, BW * 0.88, 3); g.fillRect(x0 + BW * 0.06, y0 + FH * 0.77, BW * 0.88, 5);
        for (let k = 0; k < 9; k++) g.fillRect(x0 + BW * (0.06 + k * 0.11), y0 + FH * 0.62, 2, FH * 0.15); }
      else if (cls === 'glass') { win(x0, y0, BW, FH * 0.78, { mull: [0.5], frame: 3 }); g.fillStyle = 'rgb(58,70,80)'; g.fillRect(x0, y0 + FH * 0.78, BW, FH * 0.22); r.fillStyle = 'rgb(0,30,0)'; r.fillRect(x0, y0 + FH * 0.78, BW, FH * 0.22);
        for (let yy = y0 + FH * 0.78 | 0; yy < y0 + FH; yy++) for (let xx = x0; xx < x0 + BW; xx++) hm[yy * W + xx] = 0.4; }
      else if (cls === 'shop') { win(x0, y0 + FH * 0.18, BW, FH * 0.82, { mull: [0.5], frame: 5 }); g.fillStyle = 'rgb(45,48,52)'; g.fillRect(x0, y0, BW, FH * 0.18); }
      if (cls !== 'glass' && cls !== 'shop' && cls !== 'metal') { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x0, y0 + FH - 6, BW, 6); }   // 층 줄눈
    }
    // 벽·유리 구분은 거칠기 맵(G < 60 이면 유리)으로 셰이더에서 읽는다(캔버스는 투명 화소의 색을 지우므로 알파는 쓰지 않는다)
    const nc = document.createElement('canvas'); nc.width = W; nc.height = H; const ng = nc.getContext('2d'), no = ng.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const hx = hm[y * W + ((x + 1) % W)] - hm[y * W + ((x - 1 + W) % W)], hy = hm[((y + 1) % H) * W + x] - hm[((y - 1 + H) % H) * W + x];
      const nx = -hx * 2.5, ny = hy * 2.5, l = Math.hypot(nx, ny, 1), o = (y * W + x) * 4;
      no.data[o] = (nx / l * 0.5 + 0.5) * 255; no.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; no.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; no.data[o + 3] = 255;
    }
    ng.putImageData(no, 0, 0);
    return { col, rm, nc };
  }
  // 야간: 주변 건물 창 일부에 실내 불빛, 간판 발광(시간대가 야간일 때 1)
  const NIGHT = { value: 0 };
  // 간판 아틀라스: 위쪽 4열×8행 가로 간판, 아래쪽 16칸 세로 간판. 상호는 업종 이름만(실제 상호 아님)
  function signAtlas() {
    if (FW.sign) return FW.sign;
    const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
    const W = ['카페', '약국', '부동산', '치킨', '미용실', '학원', '안경', '편의점', '세탁', '분식', '정형외과', '피부과', '베이커리', '김밥', '공인중개사', '수학학원', '영어학원', '꽃집', '네일', '한의원', '치과', '헤어', '국밥', '마트', '스터디카페', '필라테스', '休 커피', '은행', '병원', '피자', '갈비', '떡볶이'];
    const BG = ['#1f3b73', '#b8232f', '#f2f2ee', '#14532d', '#262626', '#f5c518', '#0f766e', '#7c2d12', '#e8e2d4', '#3b0764', '#1e40af', '#c2410c'];
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const font = '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
    for (let i = 0; i < 32; i++) {
      const x = (i % 4) * 256, y = 512 - (Math.floor(i / 4) + 1) * 64, bg = BG[Math.floor(rnd() * BG.length)], light = /#f|#e/.test(bg);
      g.fillStyle = '#2a2a2a'; g.fillRect(x, y, 256, 64); g.fillStyle = bg; g.fillRect(x + 3, y + 4, 250, 56);
      g.fillStyle = light ? '#1b1b1b' : '#ffffff'; g.font = '700 36px ' + font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(W[i % W.length], x + 128 + (rnd() - 0.5) * 30, y + 33, 230);
      if (rnd() < 0.5) { g.font = '500 14px ' + font; g.fillText('TEL 02-' + (500 + (rnd() * 400 | 0)) + '-' + (1000 + (rnd() * 8999 | 0)), x + 128, y + 54, 200); }
    }
    for (let i = 0; i < 16; i++) {
      const x = i * 64, bg = BG[Math.floor(rnd() * BG.length)], light = /#f|#e/.test(bg);
      g.fillStyle = '#2a2a2a'; g.fillRect(x, 512, 64, 512); g.fillStyle = bg; g.fillRect(x + 4, 516, 56, 504);
      g.fillStyle = light ? '#1b1b1b' : '#ffffff'; g.font = '700 40px ' + font; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = W[(i * 5 + 3) % W.length].replace(/ /g, '');
      [...w].slice(0, 5).forEach((ch, k, a) => g.fillText(ch, x + 32, 516 + 504 * (k + 0.5) / Math.max(a.length, 3)));
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return (FW.sign = t);
  }
  // 아파트 측벽 동 표시 아틀라스(16×16칸, 칸 128×64px): 단지명은 작게, 동 번호는 크게. 배경은 투명
  function dongAtlas(labels) {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d'), font = '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
    labels.forEach((l, i) => {
      const x = (i % 16) * 128, y = Math.floor(i / 16) * 64, sp = l.lastIndexOf(' '), brand = sp > 0 ? l.slice(0, sp) : '', num = sp > 0 ? l.slice(sp + 1) : l;
      g.fillStyle = '#3d4b57'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      if (brand) { g.font = '700 15px ' + font; g.fillText(brand, x + 64, y + 18, 118); }
      g.font = '800 ' + (brand ? 40 : 46) + 'px ' + font; g.fillText(num, x + 64, y + (brand ? 58 : 52), 118);
    });
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }
  function ctxFacadeMat(cls, info, fresh) {
    const key = { far_light: 'tile', far_dark: 'brick', far_glass: 'glass' }[cls] || cls;
    if (fresh) { const sv = FW.mats[cls]; delete FW.mats[cls]; const m = ctxFacadeMat(cls, info); if (sv) FW.mats[cls] = sv; else delete FW.mats[cls]; if (m) m.userData.prMadeCtx = true; return m; }
    if (FW.mats[cls]) return FW.mats[cls];
    // 단색 벽(난간벽·옥탑·발코니·측벽·맞벽): 회반죽 재료 사진을 벽면 좌표로, 건물색은 꼭짓점 색
    if (cls === 'trim' || cls === 'trim_far') { const m = texMat('plaster-white', 3, { tint: 0xd4d2cc, env: 0.4 }); m.vertexColors = true; m.userData.prMade = true; keepEnv(m); return (FW.mats[cls] = m); }
    // 지붕: 콘크리트 사진 + 꼭짓점 색(우레탄 방수 초록·회색)
    if (cls === 'roof') { const m = texMat('ground-concrete', 6, { tint: 0xb0b0ac, env: 0.3 }); m.vertexColors = true; m.userData.prMade = true; keepEnv(m); return (FW.mats[cls] = m); }
    if (cls === 'dong') {
      const lk = (info && info.labels || []).join('|');
      if (FW.dong && FW.dong.k === lk) return FW.dong.m;
      const m = std({ map: dongAtlas(info.labels), alphaTest: 0.35, roughness: 0.8 }); m.envMapIntensity = 0.4; m.userData.prMade = m.userData.prMadeCtx = true; keepEnv(m);
      FW.dong = { k: lk, m }; return m;
    }
    if (cls === 'sign') {
      const t = signAtlas(), m = std({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.45 });
      m.envMapIntensity = 0.6; m.userData.prMade = m.userData.prMadeCtx = true; keepEnv(m);
      m.onBeforeCompile = sh => { sh.uniforms.prNight = NIGHT; sh.fragmentShader = 'uniform float prNight;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = emissiveColor.rgb * texture2D(emissiveMap, vUv).rgb * prNight * 1.4;'); };
      m.customProgramCacheKey = () => 'prsign';
      return (FW.mats[cls] = m);
    }
    if (!['tile', 'paint', 'stone', 'glass', 'brick', 'metal', 'apt', 'shop'].includes(key)) return null;
    // 무늬 3장(색·거칠기/금속성·노멀)은 photoreal/context/facade/ 에 미리 만들어 둔 이미지를 쓴다(화소마다 계산하던 2.7초 멈춤 제거).
    // ?ctxgen=1 이면 예전처럼 캔버스로 그린다(photoreal/tests/facade-gen.mjs 가 이 캔버스를 파일로 저장)
    const fit = t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(0.25, 0.5); t.anisotropy = isMobile ? 4 : 8; return t; };
    let maps;
    if (Q.get('ctxgen') === '1') {
      const c = FW.cv && FW.cv[key] || (FW.cv = FW.cv || {}, FW.cv[key] = facadeCanvas(key));
      maps = { col: fit(new T.CanvasTexture(c.col)), rm: fit(new T.CanvasTexture(c.rm)), nc: fit(new T.CanvasTexture(c.nc)) };
    } else {
      const L = FW.loader || (FW.loader = new T.TextureLoader()), f = n => fit(L.load(BASE + 'context/facade/' + key + '-' + n + '?v=' + VER));
      maps = FW.maps[key] || (FW.maps[key] = { col: f('col.webp'), rm: f('rm.png'), nc: f('nc.png') });
    }
    maps.col.encoding = T.sRGBEncoding;
    const m = new T.MeshStandardMaterial({ map: maps.col, roughnessMap: maps.rm, metalnessMap: maps.rm, normalMap: maps.nc, roughness: 1, metalness: 1, vertexColors: key !== 'shop' });
    m.normalScale.set(0.9, 0.9); m.envMapIntensity = 1.0; m.userData.lin = true; m.userData.prEnv = 1.0; EXTRA.add(m);
    // 건물색(꼭짓점 색)은 벽에만 곱한다(거칠기 맵으로 벽 판별)
    m.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute vec3 color2;\nvarying vec3 vColor2;\n' + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\nvColor2 = color2;');
      sh.uniforms.prNight = NIGHT;
      sh.fragmentShader = 'varying vec3 vColor2;\nuniform float prNight;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#ifdef USE_COLOR\n vec4 prRM = texture2D(roughnessMap, vUv); float prWall = step(0.24, prRM.g);\n diffuseColor.rgb *= mix(vec3(1.0), mix(vColor, vColor2 * 1.6, step(0.5, prRM.r)), prWall);\n#endif')
        // 야간 창 불빛: 창(유리) 칸마다 켜짐·꺼짐과 색 온도를 건물색·칸 위치로 정한다(약 45% 켜짐)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (prNight > 0.0) { vec4 prR2 = texture2D(roughnessMap, vUv); vec2 prC = floor(vUv * vec2(4.0, 2.0) * 0.999 + 0.0005);
    #ifdef USE_COLOR
    float prSeed = dot(vColor, vec3(91.7, 37.3, 13.1));
    #else
    float prSeed = 3.1;
    #endif
    float prH = fract(sin(dot(prC, vec2(12.9898, 78.233)) + prSeed) * 43758.5453), prH2 = fract(prH * 7.31);
    totalEmissiveRadiance += (1.0 - step(0.24, prR2.g)) * step(0.55, prH) * mix(vec3(1.0, 0.72, 0.42), vec3(0.85, 0.92, 1.0), step(0.7, prH2)) * (0.6 + prH2) * prNight * 1.3; }`);
    };
    m.customProgramCacheKey = () => 'prctxwall';
    return (FW.mats[cls] = m);
  }
  function inPolyW(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > p[1]) !== (zj > p[1]) && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) c = !c; } return c; }
  function ctxLoad() {
    return CTX.p || (CTX.p = loadScript(BASE + 'context/kh-context.js?v=' + VER).then(async () => {
      const url = BASE + 'context/buildings.json?v=' + VER;
      const area = [[[-9400, -480], [-1430, -480], [-1430, 10400], [-9400, 10400]], [[-10700, -5100], [-5600, -5100], [-5600, -480], [-10700, -480]]].map(q => q.map(p => K.P(p[0], p[1])));
      const redev = b => { const o = b.outline, c = [o.reduce((s, q) => s + q[0], 0) / o.length, o.reduce((s, q) => s + q[1], 0) / o.length]; return area.some(a => inPolyW(c, a)) && b.cls === 'apt'; };
      if (Q.get('ctxgen') === '1') await facadeImgs();
      const r = await fetch(url); if (!r.ok) throw new Error('buildings.json ' + r.status);
      CTX.data = await r.json(); CTX.redev = redev; CTX.area = area;
      const t1 = now();
      CTX.towers = wingTowers();
      CTX.next = ctxPrep(window.KHContext.build(CTX.data, { near: true, far: true, material: ctxFacadeMat, filter: b => !redev(b), detail: CTX_DET, detailNear: CTX_DN }));
      if (CTX.towers.length) CTX.next.add(towerGroup());
      PR.stat.ctxBuildMs = Math.round(now() - t1);
      PR.stat.context = CTX.next.userData.stats; PR.t.context = Math.round(now() - PR.t.enable0); log('주변 건물', PR.t.context + 'ms', '합치기 ' + PR.stat.ctxBuildMs + 'ms', CTX.next.userData.stats.buildings + '동');
      if (PR.on) ctxOn();
    }).catch(e => { log('주변 건물 실패', e && e.message); CTX.p = null; fail('주변 건물', () => ctxLoad()); }));
  }
  // 현황(동광빌딩 시절) 보기: 재개발 구역 아파트까지 넣은 한 벌. 처음 '현황'을 고를 때 만든다
  function ctxNow() {
    if (CTX.now || !CTX.data) return;
    CTX.now = ctxPrep(window.KHContext.build(CTX.data, { near: true, far: true, material: ctxFacadeMat, detail: CTX_DET, detailNear: CTX_DN }));
    if (CTX.detached.length) scene.add(CTX.now);
  }
  const CTXUP = new Map();
  // 상세 형상 반경(난간벽·옥탑·발코니·간판): 학교 뒤 압구정 현대아파트 단지까지 들어가게 1km. 400m 바깥 상세는 VR 에서 숨긴다
  const CTX_DET = 1000, CTX_DN = 400;
  /* Wing 이 신축 모드에서 가정한 미성아파트 재건축 고층 동(100m 이상, 격자 무늬 덩어리)을 같은 자리·높이의 실사 아파트 동으로 바꾼다.
     외곽선은 덩어리 바닥 꼭짓점, 층고는 Wing 값 3.05m. 원래 덩어리는 ctxOn 에서 장면에서 뗀다 */
  // 재건축 가정 동은 따로 묶는다(그리기 호출 3회). Wing 은 카메라와 우리 건물 사이를 가리는 동을 숨기는데(occl, 원래 덩어리의 visible),
  // 그 동의 바닥 범위를 셰이더에 넘겨 그 자리 화소를 버린다. 동마다 메시를 나누지 않아도 된다
  const TWH = { box: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) }, n: { value: 0 } };
  function towerGroup() {
    const g = window.KHContext.build({ buildings: [], meta: CTX.data.meta }, { extra: CTX.towers.map(t => t.b), detail: CTX_DET, detailNear: CTX_DN, material: k => hideable(ctxFacadeMat(k, null, true)) });
    g.name = 'pr-redev-towers'; g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    CTX.towers.forEach(t => { const xs = t.b.outline.map(q => q[0]), zs = t.b.outline.map(q => q[1]); t.bb = [Math.min(...xs) - 2.5, Math.min(...zs) - 2.5, Math.max(...xs) + 2.5, Math.max(...zs) + 2.5]; });
    return g;
  }
  function hideable(m) {
    if (!m) return m;
    const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      sh.uniforms.prHideBox = TWH.box; sh.uniforms.prHideN = TWH.n;
      sh.vertexShader = 'varying vec3 vPrH;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvPrH = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vPrH;\nuniform vec4 prHideBox[8];\nuniform int prHideN;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  for (int i = 0; i < 8; i++) { if (i >= prHideN) break; vec4 b = prHideBox[i]; if (vPrH.x > b.x && vPrH.x < b.z && vPrH.z > b.y && vPrH.z < b.w) discard; }');
    };
    m.customProgramCacheKey = () => pk + 'hide';
    return m;
  }
  function wingTowers() {
    const out = [];
    K.city.updateMatrixWorld(true);
    K.city.traverse(o => {
      if (!o.isMesh || !Array.isArray(o.material) || !o.geometry.attributes.position) return;
      const bb = new T.Box3().setFromObject(o); if (bb.max.y - bb.min.y <= 100) return;
      const pa = o.geometry.attributes.position, v = new T.Vector3(), pts = [];
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (v.y < bb.min.y + 0.5 && !pts.some(q => Math.hypot(q[0] - v.x, q[1] - v.z) < 0.3)) pts.push([v.x, v.z]); }
      if (pts.length < 3) return;
      // 볼록 껍질(반시계)
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]), lo = [], up = [];
      pts.forEach(p => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
      pts.slice().reverse().forEach(p => { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); });
      const hull = lo.slice(0, -1).concat(up.slice(0, -1)), h = bb.max.y, c = hull.reduce((s, q) => [s[0] + q[0] / hull.length, s[1] + q[1] / hull.length], [0, 0]);
      out.push({ mesh: o, b: { id: 'wing:redev-' + out.length, name: '미성 재건축 가정 동', src: 'wing', near: true, dist: Math.hypot(c[0], c[1]), outline: hull.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]),
        h, floors: Math.round(h / 3.05), floor_h: 3.05, cls: 'apt', color: '#e9ecec', color2: '#7f8c93', shop_glass: false } });
    });
    return out;
  }
  function ctxPrep(g0) {
    {
      // 창 패턴 캔버스 재질에 실사 보강(창 반사·벽 질감·창 깊이). 건물 색은 꼭짓점 색
      const up = CTXUP;
      [g0].forEach(g => { g.name = 'pr-context'; g.traverse(o => {
        if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; const m0 = o.material;
        if (m0 && !m0.userData.prMadeCtx && !Object.values(FW.mats).includes(m0) && m0.map && m0.map.image && m0.map.image.getContext) { let m = up.get(m0); if (!m) { m = facadeMat(m0, 1.25); m.vertexColors = true; m.color.set(0xffffff); m.userData.lin = true; keepEnv(m); up.set(m0, m); } o.material = m; }
      }); });
    }
    return g0;
  }
  function ctxOn() {
    if (!CTX.next || CTX.detached.length) return;
    [K.city, K.ctx].forEach(root => {
      const list = []; root.traverse(o => { if (o.isMesh && Array.isArray(o.material)) list.push(o); });
      list.forEach(o => { const b = new T.Box3().setFromObject(o); if (b.max.y - b.min.y > 100) return; const p = o.parent; if (!p) return; p.remove(o); CTX.detached.push([p, o]); });
    });
    (CTX.towers || []).forEach(t => { const o = t.mesh, p = o.parent; if (!p) return; p.remove(o); CTX.detached.push([p, o]); });
    if (CTX.now) scene.add(CTX.now); scene.add(CTX.next);
    if (DIST) DIST.parent && DIST.parent.remove(DIST);
    if (GND.g && !GND.g.parent) scene.add(GND.g);   // 다시 켰을 때(땅은 처음 한 번만 만든다). 처음 받기는 로딩 순서(loadSeq)가 한다
    if (PR.t.warm != null) setTimeout(refreshRefl, 50);   // 주변 건물이 유리 반사에 들어가게(워밍업 전이면 워밍업 끝에 함께)
  }
  function ctxOff() {
    CTX.detached.forEach(([p, o]) => p.add(o)); CTX.detached = [];
    if (CTX.now) scene.remove(CTX.now); if (CTX.next) scene.remove(CTX.next);
    if (GND.g) scene.remove(GND.g);
  }
  /* ================= 6-4. 주변 땅: 도로·보도·차선·녹지·한강·단지 바닥·나무·주차 차량 =================
     photoreal/context/ground.json(OSM 파생, build_ground.py). Wing 이 이미 그린 도로·학교 운동장 같은 바닥판 자리는 비우고 그 바깥만 채운다.
     미성 재개발 구역(Wing 이 신축 모드에서 가정 단지를 두는 곳)의 도로·단지 바닥은 현황 모드에서만 보인다.
     나무는 가로수 모델을 옆에서 한 번 찍은 그림 카드(60°씩 교차한 판 3장)를 인스턴스로 그린다(나무당 삼각형 6개).
     대지에서 350m 바깥의 나무·차는 VR 에서 숨긴다(퀘스트 예산) */
  const GND = { p: null, g: null, now: null, far: [], data: null };
  function groundLoad() {
    return GND.p || (GND.p = fetch(BASE + 'context/ground.json?v=' + VER).then(r => { if (!r.ok) throw new Error('ground.json ' + r.status); return r.json(); }).then(d => { GND.data = d; return envAssets(); })
      .then(() => { if (GND.data && PR.on && !GND.g) { const t0 = now(); groundBuild(); PR.stat.groundMs = Math.round(now() - t0); PR.t.ground = Math.round(now() - PR.t.enable0); log('주변 땅', PR.t.ground + 'ms', '만들기 ' + PR.stat.groundMs + 'ms'); } })
      .catch(e => { log('주변 땅 실패', e && e.message); GND.p = null; fail('주변 땅', groundLoad); }));
  }
  // Wing 이 이미 깐 바닥판(도로·보도·운동장 등, 700m 미만)의 삼각형 격자. 이 자리는 OSM 바닥을 깔지 않는다
  function wingFlats() {
    const tris = [], G = 20, grid = new Map(), v = new T.Vector3();
    const area = CTX.area || [];
    [K.site, K.city].forEach(root => { root.updateMatrixWorld(true); root.traverse(o => {
      if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return;
      const bb = new T.Box3().setFromObject(o); if (bb.isEmpty() || bb.max.y - bb.min.y > 0.3 || bb.max.y > 0.5 || bb.max.x - bb.min.x > 700 || bb.max.z - bb.min.z > 700) return;
      // 미성 재개발 구역의 가정 단지 바닥(신축 모드에서만 보임)은 비울 자리로 치지 않는다(현황 모드에서는 OSM 단지가 보여야 함)
      const c = [(bb.min.x + bb.max.x) / 2, (bb.min.z + bb.max.z) / 2]; if (area.some(a => inPolyP(c, a))) return;
      const pa = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count : pa.count, P = i => { v.fromBufferAttribute(pa, ix ? ix.getX(i) : i).applyMatrix4(o.matrixWorld); return [v.x, v.z]; };
      for (let i = 0; i + 2 < n; i += 3) tris.push([P(i), P(i + 1), P(i + 2)]);
    }); });
    tris.forEach((t, k) => { const xs = t.map(p => p[0]), zs = t.map(p => p[1]);
      for (let i = Math.floor(Math.min(...xs) / G); i <= Math.floor(Math.max(...xs) / G); i++) for (let j = Math.floor(Math.min(...zs) / G); j <= Math.floor(Math.max(...zs) / G); j++) { const q = i * 100003 + j; if (!grid.has(q)) grid.set(q, []); grid.get(q).push(k); } });
    const side = (p, a, b) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    return p => { const l = grid.get(Math.floor(p[0] / G) * 100003 + Math.floor(p[1] / G)); if (!l) return false;
      for (const k of l) { const [a, b, c] = tris[k], d1 = side(p, a, b), d2 = side(p, b, c), d3 = side(p, c, a); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return true; } return false; };
  }
  function inPolyP(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > p[1]) !== (zj > p[1]) && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) c = !c; } return c; }
  function noiseTex(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t; }
  function groundMats() {
    if (GND.mats) return GND.mats;
    let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const grass = noiseTex(256, (g, n) => { g.fillStyle = '#6f8a4e'; g.fillRect(0, 0, n, n); for (let i = 0; i < 9000; i++) { const l = 30 + rnd() * 40; g.fillStyle = `hsla(${78 + rnd() * 30},${30 + rnd() * 25}%,${l}%,0.5)`; g.fillRect(rnd() * n, rnd() * n, 1 + rnd() * 2, 1 + rnd() * 3); } });
    grass.encoding = T.sRGBEncoding;
    const wn = noiseTex(256, (g, n) => { const d = g.createImageData(n, n); const hgt = new Float32Array(n * n);
      for (let k = 0; k < 40; k++) { const fx = 1 + Math.floor(rnd() * 6), fz = 1 + Math.floor(rnd() * 6), ph = rnd() * 6.28, a = 1 / (fx + fz); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) hgt[y * n + x] += a * Math.sin((fx * x + fz * y) / n * 6.283 + ph); }
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const hx = hgt[y * n + (x + 1) % n] - hgt[y * n + (x + n - 1) % n], hy = hgt[((y + 1) % n) * n + x] - hgt[((y + n - 1) % n) * n + x], o = (y * n + x) * 4;
        d.data[o] = 128 - hx * 60; d.data[o + 1] = 128 - hy * 60; d.data[o + 2] = 255; d.data[o + 3] = 255; } g.putImageData(d, 0, 0); });
    const grassMat = (tint, w) => { const m = std({ map: grass, roughness: 0.97, metalness: 0, color: lin(tint) }); m.envMapIntensity = 0.25; return keepEnv(patch(m, { world: 1 / w })); };
    const M = GND.mats = {
      road: texMat('asphalt_02', 3.5, { tint: 0x55575a, env: 0.35 }), park: texMat('asphalt_02', 3.5, { tint: 0x66676a, env: 0.35 }),
      side: texMat('sidewalk-pavers', 1.8, { tint: 0xa9a59e, env: 0.4 }), pave: texMat('ground-concrete', 2.5, { tint: 0x9d9a92, env: 0.3 }),
      dirt: texMat('ground-concrete', 2.5, { tint: 0x8c7a62, env: 0.2 }),
      grass: grassMat(0xd8e0c8, 3), turf: grassMat(0xc8e8b0, 2), curb: paint(0x9c9b96, 0.8, 0.3),
      track: paint(0x9e4636, 0.9, 0.2), play: paint(0x8e7f63, 0.95, 0.2),
      mark: std({ vertexColors: true, roughness: 0.65, metalness: 0 }),
      water: (() => { const m = std({ color: lin(0x34464d), roughness: 0.05, metalness: 0, normalMap: wn }); m.normalScale.set(0.35, 0.35); m.envMapIntensity = 1.1; return keepEnv(patch(m, { world: 1 / 9 })); })(),
    };
    Object.values(M).forEach(m => { m.userData.prMade = true; if (!EXTRA.has(m)) keepEnv(m); });
    return M;
  }
  // 가로수 모델을 옆(왼쪽 절반)·위(오른쪽 위 1/4)에서 찍은 512px 그림 + 그 비율
  function treeCard(rt0) {
    const tree = normModel(ENV.tree.clone(true), 1, false), bb = new T.Box3().setFromObject(tree), sz = bb.getSize(new T.Vector3()), w = Math.max(sz.x, sz.z);
    // 조명 없이 원래 색(알베도)만 찍는다: 장면에서 다시 해·하늘빛을 받으므로 두 번 어두워지지 않게. 잎 안쪽은 조금 어둡게
    tree.traverse(o => { if (o.isMesh && o.material) { const s0 = o.material, leaf = /leaves/i.test(s0.name);
      const m = new T.MeshBasicMaterial({ map: s0.map || null, color: s0.color ? s0.color.clone().multiplyScalar(leaf ? 0.9 : 0.75) : new T.Color(0.4, 0.33, 0.25), side: T.DoubleSide, alphaTest: leaf ? 0.45 : 0, transparent: false });
      o.material = m; } });
    const sc = new T.Scene(); sc.add(tree);
    const rt = rt0 || new T.WebGLRenderTarget(512, 512, { generateMipmaps: true, minFilter: T.LinearMipmapLinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat });
    const prevRT = R.getRenderTarget(), prevAC = R.autoClear, cc = R.getClearColor(new T.Color()), ca = R.getClearAlpha(), xr = R.xr.enabled, sh = R.shadowMap.enabled, tm = R.toneMapping;
    R.xr.enabled = false; R.toneMapping = T.NoToneMapping;
    R.setClearColor(0x56663f, 0); R.setRenderTarget(rt); R.clear(); R.autoClear = false;
    const cam1 = new T.OrthographicCamera(-w / 2, w / 2, sz.y, 0, 0.1, 100); cam1.position.set(0, 0, 50); cam1.lookAt(0, 0, 0); cam1.position.y = 0; cam1.updateMatrixWorld();
    rt.viewport.set(0, 0, 256, 512); rt.scissor.set(0, 0, 256, 512); rt.scissorTest = true; R.setRenderTarget(rt); R.render(sc, cam1);
    const cam2 = new T.OrthographicCamera(-w / 2, w / 2, w / 2, -w / 2, 0.1, 200); cam2.position.set(0, 100, 0); cam2.up.set(0, 0, -1); cam2.lookAt(0, 0, 0); cam2.updateMatrixWorld();
    rt.viewport.set(256, 256, 256, 256); rt.scissor.set(256, 256, 256, 256); R.setRenderTarget(rt); R.render(sc, cam2);
    rt.scissorTest = false; rt.viewport.set(0, 0, 512, 512); rt.scissor.set(0, 0, 512, 512);
    R.setRenderTarget(prevRT); R.autoClear = prevAC; R.setClearColor(cc, ca); R.xr.enabled = xr; R.toneMapping = tm; R.shadowMap.enabled = sh;
    rt.texture.encoding = T.LinearEncoding;
    return { tex: rt.texture, aspect: w / sz.y, rt };
  }
  // 그림 카드 나무 형상(높이 1): 60°씩 교차한 판 3장(옆 그림). 법선은 위쪽으로 기울여 방향과 관계없이 비슷하게 밝게
  function treeGeo(aspect) {
    const P = [], N = [], U = [], hw = aspect / 2;
    const q = (a, b, c, d, ua, ub, uc, ud, n) => { [a, b, c, a, c, d].forEach(p => P.push(...p)); [ua, ub, uc, ua, uc, ud].forEach(u => U.push(...u)); for (let i = 0; i < 6; i++) N.push(...n); };
    [0, Math.PI / 3, Math.PI * 2 / 3].forEach(r => { const cx = Math.cos(r) * hw, cz = Math.sin(r) * hw, n = new T.Vector3(-Math.sin(r) * 0.3, 0.95, Math.cos(r) * 0.3).normalize().toArray();
      q([-cx, 0, -cz], [cx, 0, cz], [cx, 1, cz], [-cx, 1, -cz], [0, 0], [0.5, 0], [0.5, 1], [0, 1], n); });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
    return g;
  }
  function carGeo() {
    // 단순 승용차(길이 4.5m): 차체 + 유리 지붕. 꼭짓점 색: 차체 흰색(인스턴스 색이 곱해짐), 유리 짙은색
    const parts = [[4.5, 0.75, 1.8, 0.62, [1, 1, 1]], [2.5, 0.55, 1.6, 1.25, [0.12, 0.14, 0.16]], [0.12, 0.5, 1.82, 0.62, [0.08, 0.08, 0.08]]];
    const gs = parts.map(([l, h, w, y, c], i) => { const b = new T.BoxGeometry(l, h, w).toNonIndexed(); b.translate(i === 1 ? -0.25 : i === 2 ? 2.2 : 0, y, 0); const col = []; for (let k = 0; k < b.attributes.position.count; k++) col.push(...c); b.setAttribute('color', new T.Float32BufferAttribute(col, 3)); b.deleteAttribute('uv'); return b; });
    const P = [], N = [], C = []; gs.forEach(b => { P.push(...b.attributes.position.array); N.push(...b.attributes.normal.array); C.push(...b.attributes.color.array); });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
    return g;
  }
  function groundBuild() {
    const D = GND.data, M = groundMats(), wing = wingFlats(), area = CTX.area || [], rd = p => area.some(a => inPolyP(p, a));
    const towers = (CTX.towers || []).map(t => t.b.outline), onTower = p => towers.some(o => inPolyP(p, o));
    const sets = { all: {}, now: {} }, B = (set, k) => sets[set][k] || (sets[set][k] = { p: [], c: [] });
    const flatTri = (b, a, c, d, y, col) => { b.p.push(a[0], y, a[1], c[0], y, c[1], d[0], y, d[1]); if (col) b.c.push(...col, ...col, ...col); };
    const quadF = (b, a, c, d, e, y, col) => { flatTri(b, a, d, c, y, col); flatTri(b, a, e, d, y, col); };   // 위에서 보아 반시계(a→b→c→d)면 위를 본다
    const Y = { pave: 0.002, water: 0.003, grass: 0.004, turf: 0.006, track: 0.007, play: 0.006, park: 0.006, dirt: 0.005, road: 0.009, mark: 0.016, side: 0.12 };
    // 1) 면
    const KM = { green: 'grass', pitch: 'turf', track: 'track', play: 'play', parking: 'park', complex: 'pave', dirt: 'dirt', water: 'water' };
    const parkPolys = [];
    D.areas.forEach(([kd, pts]) => {
      const k = KM[kd]; if (!k || pts.length < 3) return;
      const c = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
      if (kd !== 'water' && wing(c)) return;
      const set = kd !== 'water' && rd(c) ? 'now' : 'all';
      let f; try { f = T.ShapeUtils.triangulateShape(pts.map(q => new T.Vector2(q[0], q[1])), []); } catch (e) { return; }
      const b = B(set, k); f.forEach(([i, j, l]) => { const a = pts[i], bb = pts[j], cc = pts[l], cr = (bb[0] - a[0]) * (cc[1] - a[1]) - (bb[1] - a[1]) * (cc[0] - a[0]); if (cr < 0) flatTri(b, a, bb, cc, Y[k]); else flatTri(b, a, cc, bb, Y[k]); });
      if (kd === 'parking') parkPolys.push([pts, set]);
    });
    // 2) 도로: 10m 이하 조각으로 나눠 Wing 바닥판 자리를 비우고, 이음매는 팔각형으로 메운다. 큰길은 차선·보도
    const Wt = [1, 1, 1], Yl = [0.95, 0.7, 0.15];
    D.roads.forEach(([w, kind, pts]) => {
      const hw = w / 2; let run = 0;
      for (let i = 1; i < pts.length; i++) {
        const a0 = pts[i - 1], b0 = pts[i], L = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]); if (L < 0.2) continue;
        const ux = (b0[0] - a0[0]) / L, uz = (b0[1] - a0[1]) / L, nx = -uz, nz = ux, ns = Math.ceil(L / 10);
        for (let s = 0; s < ns; s++) {
          const t0 = L * s / ns, t1 = L * (s + 1) / ns, a = [a0[0] + ux * t0, a0[1] + uz * t0], b = [a0[0] + ux * t1, a0[1] + uz * t1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (wing(m) || (wing(a) && wing(b))) { run += t1 - t0; continue; }
          const set = rd(m) ? 'now' : 'all', O = (p, o) => [p[0] + nx * o, p[1] + nz * o];
          quadF(B(set, kind === 3 ? 'side' : 'road'), O(a, -hw), O(b, -hw), O(b, hw), O(a, hw), Y.road);
          if (s === 0 && i > 1) { const rb = B(set, kind === 3 ? 'side' : 'road'); for (let k = 0; k < 8; k++) { const t = k / 8 * 6.283, t2 = (k + 1) / 8 * 6.283; flatTri(rb, a0, [a0[0] + Math.cos(t2) * hw, a0[1] + Math.sin(t2) * hw], [a0[0] + Math.cos(t) * hw, a0[1] + Math.sin(t) * hw], Y.road - 0.001); } }
          if (kind === 0) {
            const mk = B(set, 'mark'), line = (o, wd, col, dash) => {
              if (!dash) { quadF(mk, O(a, o - wd / 2), O(b, o - wd / 2), O(b, o + wd / 2), O(a, o + wd / 2), Y.mark, col); return; }
              for (let d = Math.ceil(run / 8) * 8 - run; d < t1 - t0; d += 8) { const d1 = Math.min(d + 3, t1 - t0); if (d1 <= d) continue; const p0 = [a[0] + ux * d, a[1] + uz * d], p1 = [a[0] + ux * d1, a[1] + uz * d1];
                quadF(mk, O(p0, o - wd / 2), O(p1, o - wd / 2), O(p1, o + wd / 2), O(p0, o + wd / 2), Y.mark, col); }
            };
            line(-0.2, 0.15, Yl); line(0.2, 0.15, Yl); line(-hw + 0.5, 0.15, Wt); line(hw - 0.5, 0.15, Wt);
            const nl = Math.max(1, Math.round((hw - 0.5) / 3.3)); for (let j = 1; j < nl; j++) { line(-(hw - 0.5) * j / nl, 0.15, Wt, true); line((hw - 0.5) * j / nl, 0.15, Wt, true); }
            const sd = B(set, 'side'), cb = B(set, 'curb');
            [-1, 1].forEach(sg => { const o0 = sg * hw, o1 = sg * (hw + 3.2);
              if (sg > 0) quadF(sd, O(a, o0), O(b, o0), O(b, o1), O(a, o1), Y.side); else quadF(sd, O(a, o1), O(b, o1), O(b, o0), O(a, o0), Y.side);
              const p0 = O(a, o0), p1 = O(b, o0); const c = cb.p; if (sg > 0) c.push(p0[0], 0, p0[1], p1[0], 0, p1[1], p1[0], Y.side, p1[1], p0[0], 0, p0[1], p1[0], Y.side, p1[1], p0[0], Y.side, p0[1]);
              else c.push(p1[0], 0, p1[1], p0[0], 0, p0[1], p0[0], Y.side, p0[1], p1[0], 0, p1[1], p0[0], Y.side, p0[1], p1[0], Y.side, p1[1]); });
          }
          run += t1 - t0;
        }
      }
    });
    const root = GND.g = new T.Group(); root.name = 'pr-ground'; const nowG = GND.now = new T.Group(); nowG.name = 'pr-ground-now'; root.add(nowG);
    // VR 용: 바닥 종류를 꼭짓점 색 한 장으로 합친 메시(차선·연석 제외). VR 에서는 종류별 메시 대신 이것만 그린다(그리기 호출 1회)
    const XC = { road: 0x4c4d4f, park: 0x5c5d5f, side: 0x9b978f, pave: 0x9c998f, dirt: 0x8a7a62, grass: 0x6c8a4c, turf: 0x7ca058, track: 0x9e4636, play: 0x8e7f63, water: 0x3a4c54 };
    const xm = std({ vertexColors: true, roughness: 0.95, metalness: 0 }); xm.envMapIntensity = 0.3; keepEnv(xm); xm.userData.prMade = true;
    GND.kind = []; GND.xr = [];
    ['all', 'now'].forEach(set => {
      const xp = [], xc = [];
      Object.entries(sets[set]).forEach(([k, b]) => {
        if (!b.p.length) return;
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3)); if (b.c.length) g.setAttribute('color', new T.Float32BufferAttribute(b.c, 3));
        g.computeVertexNormals(); g.computeBoundingSphere();
        const m = new T.Mesh(g, M[k]); m.name = 'pr-gnd-' + k; m.receiveShadow = true; m.userData.prSkip = true; m.matrixAutoUpdate = false; m.updateMatrix();
        (set === 'now' ? nowG : root).add(m); GND.kind.push(m);
        if (XC[k]) { const c = new T.Color(XC[k]).convertSRGBToLinear(); for (let i = 0; i < b.p.length; i += 3) { xp.push(b.p[i], b.p[i + 1], b.p[i + 2]); xc.push(c.r, c.g, c.b); } }
      });
      if (!xp.length) return;
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(xp, 3)); g.setAttribute('color', new T.Float32BufferAttribute(xc, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new T.Mesh(g, xm); m.name = 'pr-gnd-xr'; m.visible = false; m.receiveShadow = true; m.userData.prSkip = true; m.matrixAutoUpdate = false; m.updateMatrix();
      (set === 'now' ? nowG : root).add(m); GND.xr.push(m);
    });
    // 3) 나무(그림 카드 인스턴스): 350m 안은 그림자도 드리운다
    const card = GND.card = treeCard(), tg = treeGeo(card.aspect), tm = std({ map: card.tex, alphaTest: 0.42, roughness: 0.9, metalness: 0, side: T.DoubleSide });
    tm.envMapIntensity = 0.3; keepEnv(tm); tm.userData.prMade = true;
    const dm = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: card.tex, alphaTest: 0.42, side: T.DoubleSide });
    const lists = { near: [], far: [], now: [] };
    D.trees.forEach(t => { const p = [t[0], t[1]]; if (wing(p)) return; if (onTower(p)) { lists.now.push(t); return; } lists[Math.hypot(t[0], t[1]) < 350 ? 'near' : 'far'].push(t); });
    const o3 = new T.Object3D(), col = new T.Color();
    const inst = (arr, name, shadow) => {
      if (!arr.length) return null;
      const im = new T.InstancedMesh(tg, tm, arr.length); im.name = name;
      arr.forEach((t, i) => { const h = t[2], sx = t[3] ? 0.6 : 1; o3.position.set(t[0], 0, t[1]); o3.rotation.set(0, (t[0] * 13.7 + t[1] * 7.3) % 6.283, 0); o3.scale.set(h * sx, h, h * sx); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
        const v = ((t[0] * 3.1 + t[1] * 1.7) % 1 + 1) % 1; col.setRGB(0.85 + v * 0.25, 0.9 + v * 0.15, t[3] ? 0.7 : 0.8 + v * 0.15); im.setColorAt(i, col); });
      im.castShadow = shadow; im.receiveShadow = false; im.customDepthMaterial = dm; im.userData.prSkip = true; im.frustumCulled = false;
      return im;
    };
    const tn = inst(lists.near, 'pr-trees-near', true), tf = inst(lists.far, 'pr-trees-far', false), tw = inst(lists.now, 'pr-trees-now', false);
    if (tn) root.add(tn); if (tf) root.add(tf); if (tw) nowG.add(tw);
    // 4) 주차 차량: 지상 주차장(줄마다 2.6m 간격, 65% 채움)과 단지 통로 옆(5.5m 간격, 절반)
    const cars = { near: [], far: [], now: [] }; let sd = 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const addCar = (x, z, r, set) => { const d = Math.hypot(x, z); if (d > 700 || d < 200 || wing([x, z])) return;   // 200m 안은 단순 형상이 가까이 보이므로 두지 않는다
      (set === 'now' ? cars.now : cars[Math.hypot(x, z) < 350 ? 'near' : 'far']).push([x, z, r]); };
    parkPolys.forEach(([pts, set]) => {
      let best = 0, u = [1, 0]; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best) { best = L; u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; } }
      const n = [-u[1], u[0]]; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; pts.forEach(p => { const a = p[0] * u[0] + p[1] * u[1], b = p[0] * n[0] + p[1] * n[1]; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); });
      for (let b = b0 + 3; b < b1 - 2; b += 5.6) for (let a = a0 + 1.5; a < a1 - 1.5; a += 2.6) {
        if (rnd() > 0.65) continue; const p = [u[0] * a + n[0] * b, u[1] * a + n[1] * b]; if (!inPolyP(p, pts)) continue;
        addCar(p[0], p[1], Math.atan2(-n[1], n[0]) + (rnd() < 0.5 ? Math.PI : 0), set);
      }
    });
    D.roads.forEach(([w, kind, pts]) => { if (kind !== 2) return; for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 6) continue; const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      for (let d = 3; d < L - 3; d += 5.5) { if (rnd() > 0.5) continue; const o = w / 2 + 1.1, sg = rnd() < 0.5 ? 1 : -1, x = a[0] + ux * d - uz * o * sg, z = a[1] + uz * d + ux * o * sg, p = [x, z];
        if (onTower(p)) continue; addCar(x, z, Math.atan2(-uz, ux), rd(p) ? 'now' : 'all'); } } });
    const cg = carGeo(), cm = std({ vertexColors: true, roughness: 0.35, metalness: 0.4 }); cm.envMapIntensity = 0.9; keepEnv(cm); cm.userData.prMade = true;
    const PAL = [0xf2f2f0, 0xf2f2f0, 0x1c1c1e, 0x8d9196, 0x5b6066, 0xbfc3c6, 0x2a3b55, 0x6e1d22];
    const cinst = (arr, name, shadow) => {
      if (!arr.length) return null; const im = new T.InstancedMesh(cg, cm, arr.length); im.name = name;
      arr.forEach((c, i) => { o3.position.set(c[0], 0, c[1]); o3.rotation.set(0, c[2], 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); col.set(PAL[i % PAL.length]).convertSRGBToLinear(); im.setColorAt(i, col); });
      im.castShadow = shadow; im.receiveShadow = true; im.userData.prSkip = true; im.frustumCulled = false; return im;
    };
    const cn = cinst(cars.near, 'pr-cars-near', true), cf = cinst(cars.far, 'pr-cars-far', false), cw = cinst(cars.now, 'pr-cars-now', false);
    if (cn) root.add(cn); if (cf) root.add(cf); if (cw) nowG.add(cw);
    GND.far = [tf, cf, cn].filter(Boolean);   // VR 에서 숨김(먼 나무, 주차 차량 전부)
    // 5) 전신주·전선: 대지 300m 안 이면도로(OSM 이면도로, Wing 도로 자리 포함) 한쪽에 약 30m 간격. 우리 건물 앞 35m 안은 비운다
    {
      const bl = (CTX.data ? CTX.data.buildings : []).filter(b => b.dist < 360), G = 25, grid = new Map();
      bl.forEach((b, k) => { const xs = b.outline.map(q => q[0]), zs = b.outline.map(q => q[1]); b._gb = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
        for (let i = Math.floor(b._gb[0] / G); i <= Math.floor(b._gb[2] / G); i++) for (let j = Math.floor(b._gb[1] / G); j <= Math.floor(b._gb[3] / G); j++) { const q = i * 100003 + j; if (!grid.has(q)) grid.set(q, []); grid.get(q).push(k); } });
      const inB = p => (grid.get(Math.floor(p[0] / G) * 100003 + Math.floor(p[1] / G)) || []).some(k => { const b = bl[k], q = b._gb; return p[0] > q[0] - 0.3 && p[0] < q[2] + 0.3 && p[1] > q[1] - 0.3 && p[1] < q[3] + 0.3 && inPolyP(p, b.outline); });
      const poles = [], wires = [];
      D.roads.forEach(([w, kind, pts], ri) => {
        if (kind !== 1 || Math.min(...pts.map(q => Math.hypot(q[0], q[1]))) > 300) return;
        let sg = (ri * 7919 % 13) < 7 ? 1 : -1, acc = 6;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
          const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
          while (acc <= L) {
            const off = w / 2 + 0.35; let p = [a[0] + ux * acc - uz * off * sg, a[1] + uz * acc + ux * off * sg];
            if (inB(p)) { const q = [a[0] + ux * acc + uz * off * sg, a[1] + uz * acc - ux * off * sg]; p = inB(q) ? null : q; }
            const d = p ? Math.hypot(p[0], p[1]) : 0;
            if (p && d < 300 && d > 35) { const pl = { x: p[0], z: p[1], r: Math.atan2(-uz, ux), u: [ux, uz], tr: poles.length % 4 === 1 }; poles.push(pl); }
            acc += 30;
          }
          acc -= L;
        }
      });
      // 전선 잇기: OSM 도로가 여러 토막이라 토막을 넘어서도 잇는다. 전주마다 도로 방향 앞·뒤로 45m 안의 가장 가까운 전주 하나씩
      { const seen = new Set();
        poles.forEach((a, i) => { [1, -1].forEach(dir => { let best = -1, bd = 45;
          poles.forEach((b, j) => { if (j === i) return; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d < 6 || d >= bd) return; if ((dx * a.u[0] + dz * a.u[1]) / d * dir > 0.9) { bd = d; best = j; } });
          if (best >= 0) { const k = Math.min(i, best) + ':' + Math.max(i, best); if (!seen.has(k)) { seen.add(k); wires.push([a, poles[best]]); } } }); }); }
      if (poles.length) {
        const parts = [[new T.CylinderGeometry(0.13, 0.19, 10, 8), 0, 5, 0], [new T.BoxGeometry(0.12, 0.12, 1.9), 0, 9.35, 0], [new T.BoxGeometry(0.1, 0.1, 1.4), 0, 8.7, 0]];
        const P = [], N = []; parts.forEach(([g0, x, y, z]) => { const g = g0.toNonIndexed(); g.translate(x, y, z); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); });
        const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); pg.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
        const pm = paint(0x9b9a95, 0.85, 0.3); keepEnv(pm); pm.userData.prMade = true;
        const im = new T.InstancedMesh(pg, pm, poles.length); im.name = 'pr-poles';
        poles.forEach((q, i) => { o3.position.set(q.x, 0, q.z); o3.rotation.set(0, q.r, 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); });
        im.castShadow = true; im.userData.prSkip = true; im.frustumCulled = false;
        const trs = poles.filter(q => q.tr), tg2 = new T.CylinderGeometry(0.33, 0.33, 1.1, 10), tm2 = paint(0x6f7378, 0.6, 0.5); keepEnv(tm2); tm2.userData.prMade = true;
        const ti = new T.InstancedMesh(tg2, tm2, Math.max(1, trs.length)); ti.name = 'pr-transformers'; ti.count = trs.length;
        trs.forEach((q, i) => { o3.position.set(q.x - Math.sin(q.r) * 0.45, 7.7, q.z - Math.cos(q.r) * 0.45); o3.rotation.set(0, 0, 0); o3.updateMatrix(); ti.setMatrixAt(i, o3.matrix); });
        ti.castShadow = true; ti.userData.prSkip = true; ti.frustumCulled = false;
        // 전선: 팔 끝 2가닥(9.35m) + 가운데 1가닥(8.7m) + 통신선 1가닥(6.4m), 처짐 0.35～0.5m
        const lp = [], at = (q, lat, y) => [q.x + Math.cos(q.r + Math.PI / 2) * lat, y, q.z - Math.sin(q.r + Math.PI / 2) * lat];
        wires.forEach(([a, b]) => [[0.85, 9.35, 0.4], [-0.85, 9.35, 0.4], [0.6, 8.7, 0.35], [0.22, 6.4, 0.5]].forEach(([lat, y, sag]) => {
          const A = at(a, lat, y), B = at(b, lat, y);
          for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, Y = t => -4 * sag * t * (1 - t); lp.push(A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0 + Y(t0), A[2] + (B[2] - A[2]) * t0, A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1 + Y(t1), A[2] + (B[2] - A[2]) * t1); }
        }));
        // 선(LineSegments)은 Wing 렌더 모드가 숨기므로, 토막마다 굵기 5cm 의 십자 판(가로·세로) 두 장으로 그린다
        const wp = [], add = (a, b, c) => wp.push(...a, ...b, ...c);
        for (let i = 0; i < lp.length; i += 6) {
          const A = [lp[i], lp[i + 1], lp[i + 2]], B = [lp[i + 3], lp[i + 4], lp[i + 5]], dx = B[0] - A[0], dz = B[2] - A[2], L = Math.hypot(dx, dz) || 1, nx = -dz / L * 0.025, nz = dx / L * 0.025, h = 0.025;
          add([A[0] - nx, A[1], A[2] - nz], [B[0] - nx, B[1], B[2] - nz], [B[0] + nx, B[1], B[2] + nz]); add([A[0] - nx, A[1], A[2] - nz], [B[0] + nx, B[1], B[2] + nz], [A[0] + nx, A[1], A[2] + nz]);
          add([A[0], A[1] - h, A[2]], [B[0], B[1] - h, B[2]], [B[0], B[1] + h, B[2]]); add([A[0], A[1] - h, A[2]], [B[0], B[1] + h, B[2]], [A[0], A[1] + h, A[2]]);
        }
        const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3)); wg.computeVertexNormals();
        const wmm = std({ color: 0x1b1c1e, roughness: 0.6, side: T.DoubleSide }); keepEnv(wmm); wmm.userData.prMade = true;
        const wl = new T.Mesh(wg, wmm); wl.name = 'pr-wires'; wl.userData.prSkip = true;
        const pgp = GND.poles = new T.Group(); pgp.name = 'pr-poles'; pgp.add(im, ti, wl); root.add(pgp);
        PR.stat.poles = poles.length;
      }
    }
    PR.stat.ground = { trees: lists.near.length + lists.far.length, cars: cars.near.length + cars.far.length, meshes: root.children.length + nowG.children.length };
    scene.add(root);
    PF_.shDirty = true;
    if (PR.t.warm != null) setTimeout(refreshRefl, 50);   // 땅·나무가 유리 반사에 들어가게
  }
  /* ================= 6-6. 그래픽 컨텍스트 복구(T6) =================
     휴대폰·퀘스트는 메모리가 모자라면 WebGL 컨텍스트를 잃는다. three 는 되살아날 때 텍스처·형상·셰이더를 다시 올리지만,
     렌더 타깃에 그려 둔 결과(하늘 배경·환경광, 주차장 반사, 나무 그림 카드, Wing 유리 반사, 그림자)는 비어 있으므로 다시 그린다 */
  function restore() {
    PR.stat.restored = (PR.stat.restored || 0) + 1; log('그래픽 컨텍스트 복구', PR.stat.restored);
    if (scene.background === skyBG) scene.background = null;
    if (scene.environment === envDay) scene.environment = null;
    skyCur.rt = null; skyCur.cam = null; skyCur.env = null; skyCur.key = ''; skyCur.az = 999; skyCur.busy = false; skyBG = null; envDay = null; PR.lastEnv = null;
    if (envPark) {
      const old = envPark; envPark = null; const nw = parkEnv();
      scene.traverse(o => { [].concat(o.material || []).forEach(m => { if (m.envMap === old) m.envMap = nw; }); });
      Object.values(PF_.svc || {}).concat(Object.values(PF_.ceil || {}), Object.values(FLAT.mats)).forEach(m => { if (m && m.envMap === old) m.envMap = nw; });
    }
    if (GND.card && ENV.tree) treeCard(GND.card.rt);
    PF_.shDirty = true; R.shadowMap.needsUpdate = true;
    if (PR.on) { CUR.levels = null; setTimeout(refreshRefl, 50); }
  }
  PR.restore = restore;

  /* ================= 6-5. 로딩 순서와 실패 안내(T3) =================
     회선이 느리면 모든 자산이 같은 대역을 다툰다. 보이는 순서대로 차례로 받는다:
     우리 건물 재질 → 하늘 → 주변 건물 → 실내 가구 → 주변 땅·거리 소품 → 실내 화분. 실내로 들어가면 가구는 바로 받는다.
     단계마다 상태줄에 표시하고, 받지 못한 것은 사람 말로 알리고 '다시 시도' 버튼을 둔다 */
  const FURN = { open: false, wait: null, go: null };
  FURN.wait = new Promise(r => { FURN.go = () => { if (!FURN.open) { FURN.open = true; r(); } }; });
  const STG = PR.stage = { names: ['우리 건물 재질', '하늘', '주변 건물', '실내 가구', '주변 땅·거리 소품', '실내 화분'], cur: -1, fails: new Map(), run: 0 };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function fail(what, retry) { STG.fails.set(what, retry); statLine(); }
  // 첫 단계(우리 건물 텍스처)의 실제 전송 속도(Mbps). 저장본에서 읽었으면(전송 0) 빠른 것으로 본다
  function netMbps() {
    const es = performance.getEntriesByType('resource').filter(e => e.name.startsWith(BASE + 'tex/') && /\.webp|\.ktx2|\.basis/.test(e.name));
    if (!es.length) return 999;
    const bytes = es.reduce((a, e) => a + (e.transferSize || 0), 0), t0 = Math.min(...es.map(e => e.startTime)), t1 = Math.max(...es.map(e => e.responseEnd));
    return bytes < 50e3 ? 999 : bytes * 8 / 1e6 / Math.max(0.05, (t1 - t0) / 1000);
  }
  const FAST_MBPS = 30;   // 이보다 빠르면 단계를 기다리지 않고 한꺼번에 받는다(순서대로 받으면 단계마다 지연이 쌓여 오히려 늦다)
  async function loadSeq() {
    const run = ++STG.run, alive = () => PR.on && STG.run === run, step = i => { STG.cur = i; statLine(); };
    step(0); for (let i = 0; i < 80 && pend.done < pend.n; i++) await sleep(100);   // 최대 8초
    if (!alive()) return;
    const mbps = netMbps(); PR.stat.mbps = Math.round(mbps); STG.fast = mbps >= FAST_MBPS;
    if (STG.fast) {
      // 빠른 회선·저장본: 모두 동시에(주변 땅은 주변 건물 자료가 있어야 만든다)
      step(1); FURN.go(); envAssets(); plantAssets();
      await Promise.all([skyLoad(bakeSlot() === 'night' ? 'night' : bakeSlot() === 'sunset' ? 'sunset' : 'day'), ctxLoad().then(() => { if (alive()) { ctxOn(); return groundLoad(); } }), plantAssets()]);
      step(-1); return;
    }
    step(1); { const sl = bakeSlot(); await Promise.race([skyLoad(sl === 'night' ? 'night' : sl === 'sunset' ? 'sunset' : 'day'), sleep(6000)]); }
    if (!alive()) return;
    step(2); await ctxLoad(); if (!alive()) return; ctxOn();
    step(3); FURN.go(); for (let i = 0; i < 300 && !(DR.group && !DR.busy); i++) await sleep(100);
    if (!alive()) return;
    step(4); await envAssets(); await groundLoad();
    if (!alive()) return;
    step(5); await plantAssets();
    step(-1);
  }
  function retryAll() {
    const f = [...STG.fails.values()]; STG.fails.clear(); statLine();
    f.forEach(fn => { try { const r = fn(); if (r && r.then) r.then(() => { if (PR.on) { if (CTX.next && !CTX.detached.length) ctxOn(); applyAll('다시 시도'); } }); } catch (e) {} });
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
      loadBake();
      loadSeq();
    } else {
      PR.on = false;
      swapOut();
      if (DR.group) { scene.remove(DR.group); DR.group = null; DR.sig = ''; }
      optOff(); envOff(); ctxOff(); perfOff();
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
    document.addEventListener('change', e => { PF_.shDirty = true; if (!PR.on || PR.silent) return; { const O = optApi(); if (O) O.pause(400); } const n = e.target && e.target.name; if (n && n !== 'vmode' && e.target.closest && e.target.closest('aside,.panel,#panel')) { pendingSwitch = { t: now(), what: n }; } }, true);
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
<small id="pr-stat" aria-live="polite">준비 중</small><small id="pr-fail" hidden style="color:var(--fg)"><span></span><button type="button" id="pr-retry">다시 시도</button></small><small>주변 건물: 브이월드(국토교통부 건축물정보), © OpenStreetMap contributors</small>`;
      document.getElementById('viewer').appendChild(PNL);
      PNL.querySelectorAll('[data-pf]').forEach(b => b.addEventListener('click', () => preset(b.dataset.pf)));
      PNL.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => goLevel(b.dataset.lv)));
      PNL.querySelector('#pr-retry').addEventListener('click', retryAll);
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
    if (STG.cur >= 0) a.push(`받는 중 ${STG.cur + 1}/${STG.names.length}: ${STG.names[STG.cur]}` + (STG.cur === 0 && pend.n ? ` ${pend.done}/${pend.n}` : ''));
    else a.push(t.warm != null && t.plants != null ? `준비 완료 ${(Math.max(t.warm, t.plants, t.ground || 0) / 1000).toFixed(1)}초` : pend.n && pend.done < pend.n ? `텍스처 ${pend.done}/${pend.n}` : '');
    if (t.firstFrame != null) a.push(`켜기 ${t.firstFrame}ms`);
    if (t.switch != null) a.push(`조합 전환 ${t.switch}ms`);
    el.textContent = a.filter(Boolean).join(' · ') || '준비 중';
    const fe = document.getElementById('pr-fail');
    if (fe) { const n = [...STG.fails.keys()]; fe.hidden = !n.length; if (n.length) fe.firstChild.textContent = n.join(', ') + '을(를) 받지 못했습니다. 회선을 확인하고 '; }
    panelSync();
  }
  setInterval(() => { if (PR.on) statLine(); }, 1000);
  /* 간이 프레임 표시(?prfps=1): 화면 왼쪽 위에 프레임 간격 중앙값·95%와 한 프레임 그리기 호출. 휴대폰·퀘스트 2D 브라우저 실기기 확인용(VR 안 표시는 XR 계층) */
  if (Q.get('prfps') === '1') {
    const el = document.createElement('div'); el.id = 'pr-fps';
    el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:10000;background:rgba(0,0,0,.65);color:#fff;font:600 12px/1.35 ui-monospace,Menlo,monospace;padding:4px 7px;border-radius:4px;pointer-events:none;white-space:pre';
    const ds = []; let last = 0, t = 0, calls = 0;
    (function fr(n) {
      requestAnimationFrame(fr);
      if (last) { ds.push(n - last); if (ds.length > 120) ds.shift(); } last = n;
      // 한 프레임에 여러 번 그리므로(화면 효과 단계) 프레임 단위로 합산한다
      if (R && !R.xr.isPresenting) { R.info.autoReset = false; calls = R.info.render.calls; R.info.reset(); }
      if (n - t < 500 || ds.length < 10 || !R) return; t = n; if (!el.parentNode && document.body) document.body.appendChild(el);
      const a = ds.slice().sort((x, y) => x - y), q = k => a[Math.min(a.length - 1, Math.floor(a.length * k))], med = q(0.5), p95 = q(0.95);
      el.textContent = `${(1000 / med).toFixed(0)}fps 중앙 ${med.toFixed(1)}ms 95% ${p95.toFixed(1)}ms\n그리기 ${calls}회 · 화소배율 ${R.getPixelRatio().toFixed(2)}${PR.on ? ' · 실사 3D' : ''}${PR.q ? ' · 품질 ' + PR.q.name : ''}`;
      PR.fps = { med: +med.toFixed(1), p95: +p95.toFixed(1) };
    })(0);
  }

  /* ================= 9. 진단 ================= */
  // 한 프레임 전체(후처리 패스 포함)의 그리기 호출·삼각형
  PR.frameInfo = () => new Promise(res => { const inf = R.info; inf.autoReset = false; inf.reset(); requestAnimationFrame(() => requestAnimationFrame(() => { const r = { calls: inf.render.calls, tris: inf.render.triangles, programs: inf.programs.length }; inf.autoReset = true; res(r); })); });
  PR.diag = () => {
    const i = R.info; return { ver: VER, on: PR.on, t: PR.t, stat: PR.stat, programs: i.programs.length, calls: i.render.calls, tris: i.render.triangles, geos: i.memory.geometries, textures: i.memory.textures, pending: pend.n - pend.done, mats: CACHE.size };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
