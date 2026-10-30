/*
  케이프혼타워 주변 건물 (photoreal/context/kh-context.js)
  - buildings.json(Wing 월드 좌표, m)을 읽어 three.js r128 그룹을 만든다. 장면에 직접 넣지 않고 그룹만 돌려준다.
  - 그리기 호출을 줄이려고 재질 분류별로 한 메시로 병합한다.
    근경: 분류별 벽 메시(tile, stone, glass, brick, paint, metal, apt) + 1층 상점 유리 띠(shop)
    원경: 밝은 벽(far_light) · 어두운 벽(far_dark) · 유리(far_glass) 3개
    지붕: 근경·원경 전체 1개
  - 건물마다 대표색은 꼭짓점 색(color 속성)에 넣고 재질 색은 흰색으로 둔다(XR 병합이 원본 재질을 그대로 묶도록 맞춘 방식).
  - UV: u = 벽을 따라간 거리 / 기둥 간격(3.2m), v = 높이 / 그 건물의 층고. 창 텍스처 한 칸이 한 층·한 칸이 된다.
  사용:
    const grp = await KHContext.load('../photoreal/context/buildings.json', { near: true, far: true });
    scene.add(grp);   // grp.userData.stats 에 삼각형·그리기 호출 수
    옵션: material(cls) 로 재질을 직접 넘길 수 있다(없으면 절차적 창 텍스처 재질을 만든다).
          exclude: [id...], filter: b => bool, maxDist: m, shadows: true
*/
(function () {
  'use strict';
  if (window.KHContext) return;
  const BAY = 3.2;
  const NEAR_CLS = ['tile', 'stone', 'glass', 'brick', 'paint', 'metal', 'apt'];
  const FAR_OF = { tile: 'far_light', stone: 'far_light', paint: 'far_light', apt: 'far_light', brick: 'far_dark', metal: 'far_dark', glass: 'far_glass' };

  /* ---------- 절차적 창 텍스처(64x64, 한 칸 = 기둥 간격 x 층고). 흰 벽 위에 창을 그려 꼭짓점 색과 곱해진다 ---------- */
  function canvasTex(draw) {
    const T = window.THREE, c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); draw(g, 64, 64);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; t.encoding = T.sRGBEncoding;
    return t;
  }
  const PAT = {
    // 개별창(흰 타일·도장): 칸 가운데 창 하나
    punched: (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e9e9e9'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
      g.fillStyle = '#4a5157'; g.fillRect(14, 18, 36, 30); g.fillStyle = '#6d777e'; g.fillRect(31, 18, 2, 30); g.fillStyle = '#d0d0d0'; g.fillRect(12, 48, 40, 3); },
    // 띠창(석재·업무): 가로로 이어진 창 띠
    ribbon: (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#3f474e'; g.fillRect(0, 16, w, 30); g.fillStyle = '#69737a'; g.fillRect(0, 16, w, 3);
      g.fillStyle = '#c9c9c9'; for (let x = 0; x < w; x += 32) g.fillRect(x, 16, 2, 30); },
    // 커튼월: 전면 유리, 멀리언
    curtain: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa4aa'); gr.addColorStop(1, '#6f797f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d6dadc'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 2, h); g.fillRect(0, 0, w, 3); g.fillRect(0, 44, w, 2); },
    // 벽돌: 줄눈 + 개별창
    brick: (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d2cf'; for (let y = 0; y < h; y += 4) { g.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 4; x < w; x += 8) g.fillRect(x, y, 1, 4); }
      g.fillStyle = '#3e4246'; g.fillRect(16, 18, 32, 28); g.fillStyle = '#efefef'; g.fillRect(14, 46, 36, 3); },
    // 금속 패널: 세로 줄 + 띠창
    panel: (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#dcdcdc'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h);
      g.fillStyle = '#434a50'; g.fillRect(0, 20, w, 24); },
    // 아파트: 넓은 발코니 창 + 슬래브 띠
    apt: (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#8fa3a5'; g.fillRect(4, 14, 56, 34); g.fillStyle = '#c4d0d1'; g.fillRect(4, 14, 56, 4);
      g.fillStyle = '#e4e4e4'; g.fillRect(0, 48, w, 4); g.fillStyle = '#b8b8b8'; g.fillRect(30, 14, 2, 34); },
    // 1층 상점 유리
    shop: (g, w, h) => { g.fillStyle = '#4b555b'; g.fillRect(0, 0, w, h); g.fillStyle = '#7d878c'; g.fillRect(0, 0, w, 10); g.fillStyle = '#2b3135'; for (let x = 0; x < w; x += 21) g.fillRect(x, 10, 2, h - 10); },
  };
  const CLS_PAT = { tile: 'punched', paint: 'punched', stone: 'ribbon', glass: 'curtain', brick: 'brick', metal: 'panel', apt: 'apt', shop: 'shop',
    far_light: 'punched', far_dark: 'brick', far_glass: 'curtain' };
  const CLS_PBR = { glass: [0.25, 0.35], far_glass: [0.3, 0.3], metal: [0.45, 0.4], shop: [0.2, 0.3] };
  const texCache = {};
  function defaultMaterial(cls) {
    const T = window.THREE;
    if (cls === 'roof') return new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95 });
    const p = CLS_PAT[cls] || 'punched', pbr = CLS_PBR[cls] || [0.85, 0];
    const map = texCache[p] || (texCache[p] = canvasTex(PAT[p]));
    return new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map, roughness: pbr[0], metalness: pbr[1] });
  }

  /* ---------- 형상 ---------- */
  const hex = s => { const n = parseInt(s.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); };   // sRGB → linear
  function Buf() { return { p: [], n: [], uv: [], c: [], tris: 0 }; }
  function tri(B, a, b, c, n, ua, ub, uc, col) {
    // 면 방향이 n 과 맞도록 꼭짓점 순서를 맞춘다
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
    B.p.push(...a, ...b, ...c); B.n.push(...n, ...n, ...n); B.uv.push(...ua, ...ub, ...uc); B.c.push(...col, ...col, ...col); B.tris++;
  }
  function walls(B, pts, y0, y1, fh, col, sgn) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.05) continue;
      const n = [sgn * dz / L, 0, -sgn * dx / L], u0 = s / BAY, u1 = (s + L) / BAY, v0 = y0 / fh, v1 = y1 / fh;
      const A0 = [a[0], y0, a[1]], B0 = [b[0], y0, b[1]], A1 = [a[0], y1, a[1]], B1 = [b[0], y1, b[1]];
      tri(B, A0, B0, B1, n, [u0, v0], [u1, v0], [u1, v1], col);
      tri(B, A0, B1, A1, n, [u0, v0], [u1, v1], [u0, v1], col);
      s += L;
    }
  }
  function roof(B, pts, y, col) {
    const T = window.THREE, v2 = pts.map(q => new T.Vector2(q[0], q[1]));
    let faces;
    try { faces = T.ShapeUtils.triangulateShape(v2, []); } catch (e) { return; }
    faces.forEach(f => { const [a, b, c] = f.map(i => [pts[i][0], y, pts[i][1]]); tri(B, a, b, c, [0, 1, 0], [0, 0], [0, 0], [0, 0], col); });
  }
  function toMesh(B, mat, name) {
    const T = window.THREE, g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(B.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(B.n, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(B.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(B.c, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new T.Mesh(g, mat); m.name = 'ctx_' + name; m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }

  /* ---------- 공개 함수 ---------- */
  function build(data, opts = {}) {
    const T = window.THREE, grp = new T.Group(); grp.name = 'khContext';
    const ex = new Set(opts.exclude || []), want = b => !ex.has(b.id) && (opts.near !== false || !b.near) && (opts.far !== false || b.near)
      && (!opts.maxDist || b.dist <= opts.maxDist) && (!opts.filter || opts.filter(b));
    const bufs = {}, buf = k => bufs[k] || (bufs[k] = Buf());
    let nB = 0;
    for (const b of data.buildings) {
      if (!want(b)) continue;
      const pts = b.outline; if (pts.length < 3) continue;
      let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
      const sgn = A > 0 ? 1 : -1, col = hex(b.color), fh = b.floor_h || 3.5;
      const cls = b.near ? (NEAR_CLS.includes(b.cls) ? b.cls : 'paint') : (FAR_OF[b.cls] || 'far_light');
      // 근경 상가(1층 유리): 첫 층은 shop 메시로
      const shop = b.near && b.shop_glass !== false && b.cls !== 'apt' && b.cls !== 'glass' && b.h > fh + 1 && (b.shop_glass || b.floors <= 8);
      if (shop) { walls(buf('shop'), pts, 0, fh, fh, [1, 1, 1], sgn); walls(buf(cls), pts, fh, b.h, fh, col, sgn); }
      else walls(buf(cls), pts, 0, b.h, fh, col, sgn);
      const rc = [col[0] * 0.55 + 0.12, col[1] * 0.55 + 0.12, col[2] * 0.55 + 0.12];
      roof(buf('roof'), pts, b.h, rc);
      nB++;
    }
    let tris = 0;
    for (const k of Object.keys(bufs)) {
      const B = bufs[k]; if (!B.tris) continue;
      const mat = (opts.material && opts.material(k)) || defaultMaterial(k);
      const m = toMesh(B, mat, k), near = !k.startsWith('far_');
      if (opts.shadows !== false) { m.castShadow = near && k !== 'roof'; m.receiveShadow = true; }
      m.userData.cls = k; grp.add(m); tris += B.tris;
    }
    grp.userData.stats = { buildings: nB, triangles: tris, drawCalls: grp.children.length, meshes: grp.children.map(m => [m.name, m.geometry.attributes.position.count / 3]) };
    grp.userData.meta = data.meta;
    return grp;
  }
  async function load(url, opts) { const r = await fetch(url); if (!r.ok) throw new Error('buildings.json ' + r.status); return build(await r.json(), opts); }
  // 위경도 → Wing 월드 [x, z] (buildings.json meta.transform 사용)
  function lonLatToWorld(meta, lat, lon) {
    const t = meta.transform, [lat0, lon0] = t.enu_origin_latlon, [kx, ky] = t.enu_scale_m_per_deg, M = t.enu_to_world_2x2, o = t.enu_to_world_t;
    const e = (lon - lon0) * kx, n = (lat - lat0) * ky;
    return [M[0][0] * e + M[0][1] * n + o[0], M[1][0] * e + M[1][1] * n + o[1]];
  }
  window.KHContext = { build, load, lonLatToWorld, defaultMaterial, NEAR_CLS };
})();
