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
  const VER = '1030.c';
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
    if (Q.get('pr') === '1') { await new Promise(r => setTimeout(r, 300)); preset(Q.get('pf') || 'glass'); enable(true).then(() => { const lv = Q.get('lv'); if (lv) goLevel(lv); }); }
  }

  /* ================= 1. 자산 ================= */
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
  function loadEnv() {
    if (envP) return envP;
    envP = vendor().then(() => new Promise(res => {
      new T.RGBELoader().setDataType(T.HalfFloatType).load(BASE + 'tex/daylight-sky_1k.hdr', h => {
        const pm = new T.PMREMGenerator(R); envDay = pm.fromEquirectangular(h).texture; pm.dispose();
        // 배경: 같은 하늘 사진(구름 포함)을 큐브로 바꿔 Wing 의 하늘 셰이더 대신 쓴다(낮 시간대만)
        skyBG = new T.WebGLCubeRenderTarget(isMobile ? 512 : 1024, { type: T.HalfFloatType }).fromEquirectangularTexture(R, h).texture; h.dispose();
        PR.t.env = Math.round(now() - PR.t.enable0); log('하늘 HDR', PR.t.env + 'ms'); res();
      }, undefined, () => { log('하늘 HDR 실패'); res(); });
    }));
    return envP;
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
    mat.customProgramCacheKey = () => key;
    mat.onBeforeCompile = sh => {
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
        let dec = 'uniform vec3 prAmb;uniform float prK;\n', add = 'irradiance+=prAmb*PI;';
        if (o.light.lm) { U.prLM = { value: o.light.lm }; U.prBox = { value: o.light.box }; dec += 'uniform sampler2D prLM;uniform vec4 prBox;\n'; add += 'irradiance+=texture2D(prLM,(vPrW.xz-prBox.xy)*prBox.zw).rgb*prK*PI*(normalize(vPrN).y<-0.5?0.12:1.0);'; }
        if (o.light.cove) { U.prCove = { value: o.light.cove }; dec += 'uniform vec4 prCove;\n'; add += 'irradiance+=vec3(1.0,0.82,0.62)*prCove.z*PI*smoothstep(prCove.x,prCove.y,vPrW.y);'; }
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
  function facadeMat(orig) {
    const src = orig.map, img = src.image;
    if (img === K.TEX.brick.image) { const m = texMat('brick', 1.0, { ns: 1.1, env: 0.4 }); return m; }
    let f = FAC.get(img);
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
        const k = win ? 0.62 : 1;   // 창은 어둡게(실제 유리는 안이 어둡다), 반사는 환경맵이 맡는다
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
      f = { c: cc, r: rc, n: nc }; FAC.set(img, f);
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
    furnish();   // 1층 가구 배치(→ 1층 라이트맵 G1)
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
        if (sync.includes('emissive')) { m.emissive.copy(orig.emissive); m.emissiveIntensity = orig.emissiveIntensity; }
      }
      if (orig.emissiveMap !== undefined && m.userData.prFacEm !== orig.emissiveMap && !m.userData.pr) {
        // 야간 창 불빛(원본 cityLights)이 바뀐 경우만 따라간다
        if (orig.emissiveMap || m.emissiveMap) { m.emissiveMap = orig.emissiveMap; m.emissive.copy(orig.emissive); m.emissiveIntensity = orig.emissiveIntensity; m.needsUpdate = true; }
        m.userData.prFacEm = orig.emissiveMap;
      }
    });
    EXTRA.forEach(m => { if (m.envMapIntensity !== m.userData.prEnv) m.envMapIntensity = m.userData.prEnv; });
    const R3D = K.R3D, night = R3D.time === 'night', inBase = K.I.on && K.Lv() && K.Lv().kind === 'base';
    const cube = R3D.cube && R3D.cube.texture;
    if (cube) CACHE.forEach(e => { if (e && e.glass && e.m.envMap !== cube) { e.m.envMap = cube; e.m.needsUpdate = true; } });
    if (inBase) { if (R.toneMappingExposure !== 0.95) R.toneMappingExposure = 0.95; if (K.amb.intensity !== 0.04) K.amb.intensity = 0.04; }
    const useSky = skyBG && !night && R3D.time !== 'sunset' && !inBase && !K.I.on;
    if (R3D.sky) R3D.sky.visible = !useSky;
    if (useSky && scene.background !== skyBG) scene.background = skyBG; else if (!useSky && scene.background === skyBG) scene.background = null;
    if (DIST) DIST.visible = !K.I.on || !inBase;
    warm();
    if (envDay && !night && !inBase && scene.environment !== envDay) { PR.wingEnv = scene.environment; scene.environment = envDay; }
    if (night && scene.environment === envDay) scene.environment = PR.wingEnv || null;
    // 내 가구 묶음은 해당 층 묶음의 표시 상태를 따른다(내부 보기의 층 숨김·인형집 보기)
    // 층 묶음은 원본이 재건할 때마다 새로 생기므로 층 이름으로 매번 찾는다
    FUR.groups.forEach(([g, key]) => { const i = K.LEVELS.findIndex(l => l.key === key), lg = K.LG && K.LG[i]; g.visible = !!(lg && lg.visible && lg.parent); });
  }

  /* ================= 5-1. 셰이더 미리 준비 =================
     지하·1층처럼 처음 보는 순간에야 그려지는 재질은 그때 셰이더를 만들며 1～2초 멈춘다.
     켠 직후부터 프레임마다 몇 개씩, 카메라 바로 앞의 아주 작은 판에 씌워 한 번 그려 미리 만들어 둔다. */
  const WARM = [];
  let warmG = null, warmMs = [];
  function warm() {
    if (warmG) { scene.remove(warmG); warmG = null; }
    if (!WARM.length) { if (PR.t.warm == null && PR.t.enable0 && warmMs.length) { PR.t.warm = Math.round(now() - PR.t.enable0); statLine(); } return; }
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
  /* ================= 6. 1층 실내 가구 ================= */
  const FUR = { group: null, groups: [], models: null, sig: '' };
  let gltfP = null;
  function loadModels() {
    if (gltfP) return gltfP;
    gltfP = vendor().then(() => {
      const dl = new T.DRACOLoader(); dl.setDecoderPath(BASE + 'vendor/draco/');
      const gl = new T.GLTFLoader(); gl.setDRACOLoader(dl);
      const one = f => new Promise(res => gl.load(BASE + 'models/' + f + '.glb', g => res(g.scene), undefined, () => { log('모델 실패', f); res(null); }));
      return Promise.all(['office-diningchair', 'office-barstool', 'office-pottedtree', 'office-plantB'].map(one)).then(([chair, stool, tree, plant]) => {
        FUR.models = { chair, stool, tree, plant }; PR.t.models = Math.round(now() - PR.t.enable0); log('가구 모델', PR.t.models + 'ms');
        FUR.sig = ''; if (PR.on) furnish();
      });
    });
    return gltfP;
  }
  // 모델 → 재질별 InstancedMesh 묶음(그리기 호출 = 재질 수). 크기는 높이 기준으로 맞춘다
  function instancer(model, height, list, light) {
    const out = [];
    if (!model || !list.length) return out;
    model.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(model), s = height / Math.max(0.01, bb.max.y - bb.min.y), c = bb.getCenter(new T.Vector3());
    const parts = []; model.traverse(o => { if (o.isMesh) parts.push(o); });
    const M0 = new T.Matrix4(), tmp = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    parts.forEach(p => {
      let mat = p.material;
      if (!mat.userData.prLit) { mat = mat.clone(); mat.envMapIntensity = 0.6; patch(mat, { light }); mat.userData.prLit = true; mat.userData.prMade = true; keepEnv(mat); p.material = mat; }
      const im = new T.InstancedMesh(p.geometry, mat, list.length);
      list.forEach((it, k) => {
        q.setFromAxisAngle(up, it.r || 0);
        M0.compose(new T.Vector3(it.x, it.y, it.z), q, new T.Vector3(s, s, s));
        tmp.makeTranslation(-c.x, -bb.min.y, -c.z); M0.multiply(tmp).multiply(p.matrixWorld);
        im.setMatrixAt(k, M0);
      });
      im.castShadow = true; im.receiveShadow = true; im.userData.prSkip = true; out.push(im);
    });
    return out;
  }
  function furnish() {
    const L = K.LEVELS.find(l => l.kind === 'ground');
    if (!L) return;
    const sig = K.LEVELS.map(l => l.key + l.y.toFixed(1) + l.poly.length).join(',') + '|' + JSON.stringify(L.poly) + '|' + !!FUR.models;
    if (sig === FUR.sig && FUR.group && FUR.group.parent) return;
    FUR.sig = sig;
    if (FUR.group) { scene.remove(FUR.group); FUR.group.traverse(o => { if (o.isInstancedMesh) o.dispose && o.dispose(); }); }
    const grp = FUR.group = new T.Group(); grp.name = 'pr-furniture'; FUR.groups = [];
    const li = K.LEVELS.indexOf(L), lg = K.LG && K.LG[li];
    const sub = new T.Group(); grp.add(sub); FUR.groups.push([sub, L.key]);
    const ft = K.floorTop(L), top = K.ceilOf(L);
    const inPoly = K.inPoly, poly = L.poly, S = 41.6;
    const obst = (L.obst || []).filter(Boolean), cols = L.cols || [];
    const C = K.coreFor ? K.coreFor(L) : null, blocks = (L.blocks || []).map(b => b.r);
    // 가구가 놓일 수 있는 자리: 평면 안, 외벽에서 1.1m, 기둥 0.9m, 코어·장애물 밖
    const ok = (px, py, m) => {
      if (!inPoly([px, py], poly)) return false;
      for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4; if (!inPoly([px + Math.cos(ang) * m * S, py + Math.sin(ang) * m * S], poly)) return false; }
      if (cols.some(c => Math.hypot(c[0] - px, c[1] - py) < 0.95 * S)) return false;
      if (obst.some(o => o && o.length > 2 && inPoly([px, py], o))) return false;
      if (blocks.some(r => r && px > r[0] - 0.8 * S && px < r[2] + 0.8 * S && py > r[1] - 0.8 * S && py < r[3] + 0.8 * S)) return false;
      if (C) { const rs = ['elev', 'eps', 'stair', 'wc', 'r'].map(k => C[k]).filter(r => Array.isArray(r) && r.length === 4); if (rs.some(r => px > Math.min(r[0], r[2]) - 0.9 * S && px < Math.max(r[0], r[2]) + 0.9 * S && py > Math.min(r[1], r[3]) - 0.9 * S && py < Math.max(r[1], r[3]) + 0.9 * S)) return false; }
      return true;
    };
    const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
    const tables = [], chairs = [], pend = [], plants = [];
    const step = 2.9 * S;
    for (let px = Math.min(...xs) + 1.6 * S; px < Math.max(...xs); px += step) for (let py = Math.min(...ys) + 1.6 * S; py < Math.max(...ys); py += step * 0.9) {
      if (!ok(px, py, 1.45)) continue;
      const [x, z] = K.P(px, py); tables.push({ x, z });
      [[0.62, 0, -Math.PI / 2], [-0.62, 0, Math.PI / 2]].forEach(([dx, dz, r]) => chairs.push({ x: x + dx, y: ft, z: z + dz, r }));
      pend.push({ x, z });
    }
    // 화분: 창가 쪽 남는 자리
    // 화분: 외벽에서 0.6～1.4m 띠 안, 서로 3.5m 이상, 식탁과 1.4m 이상
    for (let px = Math.min(...xs) + 0.6 * S; px < Math.max(...xs); px += 0.8 * S) for (let py = Math.min(...ys) + 0.6 * S; py < Math.max(...ys); py += 0.8 * S) {
      if (!ok(px, py, 0.6) || ok(px, py, 1.4)) continue;
      const [x, z] = K.P(px, py);
      if (tables.some(t => Math.hypot(t.x - x, t.z - z) < 1.4) || plants.some(q => Math.hypot(q.x - x, q.z - z) < 3.5)) continue;
      plants.push({ x, y: ft, z, r: (px * 7 + py) % 6 });
    }
    // 바닥 라이트맵: 펜던트 아래 따뜻한 웅덩이
    G1 = bakeLM('g|' + sig, pend.map(p => ({ x: p.x, z: p.z })), polyBounds(L), { base: 'rgb(40,32,24)', r: 2.6, col: 'rgba(255,214,160,0.9)', mid: 'rgba(160,120,80,0.35)' });
    const amb = AMB.g(), light = { amb };
    // 식탁: 원목 상판(인스턴스 상자) + 검은 다리
    if (tables.length) {
      const topM = texMat('furniture-veneer', 1.8, { tint: 0xd9b48a, light }), legM = patch(std({ color: lin(0x222222), metalness: 0.6, roughness: 0.4 }), { light });
      topM.userData.prMade = legM.userData.prMade = true; keepEnv(topM); keepEnv(legM);
      const tg = new T.BoxGeometry(0.85, 0.04, 0.85), lgeo = new T.CylinderGeometry(0.035, 0.05, 0.71, 10);
      const ti = new T.InstancedMesh(tg, topM, tables.length), lI = new T.InstancedMesh(lgeo, legM, tables.length), m4 = new T.Matrix4();
      tables.forEach((t, k) => { ti.setMatrixAt(k, m4.makeTranslation(t.x, ft + 0.74, t.z)); lI.setMatrixAt(k, m4.makeTranslation(t.x, ft + 0.36, t.z)); });
      [ti, lI].forEach(o => { o.castShadow = o.receiveShadow = true; o.userData.prSkip = true; sub.add(o); });
      // 펜던트: 천장에서 내려오는 줄 + 따뜻한 갓(빛나는 재질)
      const cordM = std({ color: 0x111111 }), shadeM = new T.MeshBasicMaterial({ color: new T.Color(1.0, 0.66, 0.3).multiplyScalar(1.3) });
      cordM.userData.prMade = shadeM.userData.prMade = true; keepEnv(cordM); shadeM.userData.lin = true;
      const drop = Math.max(0.6, top - ft - 2.6), cg = new T.CylinderGeometry(0.006, 0.006, drop, 4), sg = new T.CylinderGeometry(0.035, 0.035, 0.34, 12);
      const ci = new T.InstancedMesh(cg, cordM, pend.length), si = new T.InstancedMesh(sg, shadeM, pend.length);
      pend.forEach((p, k) => { ci.setMatrixAt(k, m4.makeTranslation(p.x, top - drop / 2, p.z)); si.setMatrixAt(k, m4.makeTranslation(p.x, top - drop - 0.2, p.z)); });
      [ci, si].forEach(o => { o.userData.prSkip = true; sub.add(o); });
    }
    if (FUR.models) {
      const mdl = FUR.models;
      instancer(mdl.chair, 0.86, chairs.map(c => Object.assign({}, c)), light).forEach(o => sub.add(o));
      instancer(mdl.tree, 2.1, plants.filter((_, i) => i % 2 === 0), light).forEach(o => sub.add(o));
      instancer(mdl.plant, 1.0, plants.filter((_, i) => i % 2 === 1), light).forEach(o => sub.add(o));
    }
    PR.stat.furniture = { tables: tables.length, chairs: chairs.length, plants: plants.length };
    scene.add(grp);
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
      distantCity();
      loadEnv(); loadModels();
    } else {
      PR.on = false;
      swapOut();
      if (FUR.group) { scene.remove(FUR.group); FUR.group = null; FUR.sig = ''; }
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
<small id="pr-stat">준비 중</small>`;
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
