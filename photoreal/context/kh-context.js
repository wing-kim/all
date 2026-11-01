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
    if (cls === 'roof' || cls === 'trim' || cls === 'trim_far' || cls === 'sign' || cls === 'dong') return new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95 });
    const p = CLS_PAT[cls] || 'punched', pbr = CLS_PBR[cls] || [0.85, 0];
    const map = texCache[p] || (texCache[p] = canvasTex(PAT[p]));
    return new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map, roughness: pbr[0], metalness: pbr[1] });
  }

  /* ---------- 형상 ---------- */
  const hex = s => { const n = parseInt(s.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); };   // sRGB → linear
  function Buf() { return { p: [], n: [], uv: [], c: [], c2: [], cur2: null, col: [1, 1, 1], tris: 0 }; }   // c2: 띠·창틀 색(color2, 실사 3D 외벽이 씀)
  function tri(B, a, b, c, n, ua, ub, uc, col) {
    // 면 방향이 n 과 맞도록 꼭짓점 순서를 맞춘다
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
    B.p.push(...a, ...b, ...c); B.n.push(...n, ...n, ...n); B.uv.push(...ua, ...ub, ...uc); B.c.push(...col, ...col, ...col); const c2 = B.cur2 || col; B.c2.push(...c2, ...c2, ...c2); B.tris++;
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
    faces.forEach(f => { const [a, b, c] = f.map(i => [pts[i][0], y, pts[i][1]]); tri(B, a, b, c, [0, 1, 0], [a[0] / 8, a[2] / 8], [b[0] / 8, b[2] / 8], [c[0] / 8, c[2] / 8], col); });
  }
  function toMesh(B, mat, name) {
    const T = window.THREE, g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(B.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(B.n, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(B.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(B.c, 3));
    g.setAttribute('color2', new T.Float32BufferAttribute(B.c2, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new T.Mesh(g, mat); m.name = 'ctx_' + name; m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }

  /* ---------- 상세 형상(opts.detail 반경 안): 난간벽·옥탑·발코니·측벽·맞벽·간판 ----------
     벽·창 재질 메시는 그대로 두고, 단색 벽(trim), 간판(sign) 메시를 더한다. trim 은 u·v 가 m/4 단위(재료 사진 반복용).
     detailNear(기본 400m) 바깥의 상세 형상은 trim_far 로 따로 묶어 VR 에서 숨길 수 있게 한다. */
  const hsh = (s, k = 0) => { let h = 2166136261 ^ k; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
  // 사각 면 하나(a,b,c,d 반시계, 법선 n). uv 는 m/4
  function quad(B, a, b, c, d, n, uvs) {
    const q = uvs || (() => { const L = Math.hypot(b[0] - a[0], b[2] - a[2]) || Math.hypot(b[1] - a[1], 0), H = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      return [[0, 0], [L / 4, 0], [L / 4, H / 4], [0, H / 4]]; })();
    tri(B, a, b, c, n, q[0], q[1], q[2], B.col); tri(B, a, c, d, n, q[0], q[2], q[3], B.col);
  }
  // 바닥 사각(중심 cx,cz, 축 u, 크기 w×d, y0～y1) 상자: 옆면 4개는 B, 윗면은 R(지붕)
  function box(B, R, cx, cz, u, w, d, y0, y1, rc) {
    const n = [-u[1], u[0]], P = (a, b) => [cx + u[0] * a + n[0] * b, cz + u[1] * a + n[1] * b], c = [P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)];
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz;
      let nn = [ez / L, 0, -ex / L]; if (nn[0] * mx + nn[2] * mz < 0) nn = [-nn[0], 0, -nn[2]];
      quad(B, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], nn);
    }
    const sv = R.col; R.col = rc || R.col;
    tri(R, [c[0][0], y1, c[0][1]], [c[1][0], y1, c[1][1]], [c[2][0], y1, c[2][1]], [0, 1, 0], [c[0][0] / 8, c[0][1] / 8], [c[1][0] / 8, c[1][1] / 8], [c[2][0] / 8, c[2][1] / 8], R.col);
    tri(R, [c[0][0], y1, c[0][1]], [c[2][0], y1, c[2][1]], [c[3][0], y1, c[3][1]], [0, 1, 0], [c[0][0] / 8, c[0][1] / 8], [c[2][0] / 8, c[2][1] / 8], [c[3][0] / 8, c[3][1] / 8], R.col);
    R.col = sv;
  }
  function inPoly(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > p[1]) !== (zj > p[1]) && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) c = !c; } return c; }
  // 외곽선의 주축(가장 긴 변 방향)과 그 축으로 본 범위
  function axisBox(pts) {
    let best = 0, u = [1, 0];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best) { best = L; u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; } }
    const n = [-u[1], u[0]]; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    pts.forEach(p => { const a = p[0] * u[0] + p[1] * u[1], b = p[0] * n[0] + p[1] * n[1]; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); });
    const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
    return { u, n, L: a1 - a0, W: b1 - b0, at: (a, b) => [u[0] * (ca + a) + n[0] * (cb + b), u[1] * (ca + a) + n[1] * (cb + b)] };
  }
  // 아파트 동 표시: 이름에서 단지명과 동 번호('현대아파트101동' → 현대 101, '미성아파트 제28동' → 미성 28)
  function dongLabel(b) {
    const nm = (b.name || '').replace(/\s+/g, ''), m = nm.match(/(\d{1,4})동$/); if (!m) return null;
    const brand = (nm.split(/아파트|맨션|빌라/)[0] || '').replace(/제$/, '').slice(0, 6);
    return (brand ? brand + ' ' : '') + m[1];
  }
  const SIGN_N = 32;   // 가로 간판 칸 수(아틀라스 위쪽 4열×8행), 세로 간판은 아래쪽 16칸
  function detailOf(b, pts, sgn, col, fh, bufs, buf, isBlank, near, labels, gable) {
    const T = window.THREE, trim = buf(near ? 'trim' : 'trim_far'), roofB = buf('roof'), apt = b.cls === 'apt';
    trim.col = col;
    const dark = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
    // 지붕색: 우레탄 방수(초록)·회색 콘크리트·짙은 회색
    const r = hsh(b.id, 7), rc = r < 0.38 ? [0.16, 0.29, 0.2] : r < 0.78 ? [0.42, 0.42, 0.4] : [0.22, 0.23, 0.24];
    roofB.col = rc;
    // 1) 난간벽(0.9m): 바깥면 + 안쪽면
    const ph = b.h > 6 ? 0.9 : 0.5;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.05) continue;
      const n = [sgn * dz / L, 0, -sgn * dx / L], ni = [-n[0], 0, -n[2]];
      quad(trim, [a[0], b.h, a[1]], [c[0], b.h, c[1]], [c[0], b.h + ph, c[1]], [a[0], b.h + ph, a[1]], n);
      quad(trim, [c[0], b.h, c[1]], [a[0], b.h, a[1]], [a[0], b.h + ph, a[1]], [c[0], b.h + ph, c[1]], ni);
    }
    const ax = axisBox(pts), inside = p => inPoly(p, pts);
    // 2) 옥탑: 아파트는 양 끝 계단실 2개, 그 밖은 3층 이상에 1개 + 실외기·물탱크
    if (apt && b.floors >= 5 && ax.L > 24) {
      [-0.32, 0.32].forEach(t => { const p = ax.at(ax.L * t, 0); if (inside(p)) box(trim, roofB, p[0], p[1], ax.u, Math.min(7, ax.L * 0.12), Math.min(ax.W * 0.7, 9), b.h, b.h + 4.2, rc); });
    } else if (b.floors >= 3 && ax.L > 7 && ax.W > 6) {
      const ox = (hsh(b.id, 3) - 0.5) * ax.L * 0.3, p = ax.at(ox, (hsh(b.id, 4) - 0.5) * ax.W * 0.2);
      if (inside(p)) box(trim, roofB, p[0], p[1], ax.u, Math.min(6.5, ax.L * 0.3), Math.min(4.5, ax.W * 0.45), b.h, b.h + 3, rc);
      if (near) {
        const m = 1 + Math.floor(hsh(b.id, 5) * 3);
        for (let k = 0; k < m; k++) { const q = ax.at((hsh(b.id, 10 + k) - 0.5) * ax.L * 0.7, (hsh(b.id, 20 + k) - 0.5) * ax.W * 0.7); if (inside(q)) box(trim, roofB, q[0], q[1], ax.u, 1.2, 0.8, b.h, b.h + 1.1, [0.55, 0.56, 0.56]); }
        if (hsh(b.id, 6) < 0.4) { const q = ax.at(-ox * 0.8, ax.W * 0.25); if (inside(q)) box(trim, roofB, q[0], q[1], ax.u, 2.4, 2.4, b.h, b.h + 2.0, [0.3, 0.42, 0.55]); }
      }
    }
    // 3) 아파트 발코니: 긴 변마다 층마다 슬래브·난간, 세대 경계 벽
    if (apt && b.floors >= 4) {
      let maxL = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], c = pts[(i + 1) % pts.length]; maxL = Math.max(maxL, Math.hypot(c[0] - a[0], c[1] - a[1])); }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz);
        if (L < 12 || L < maxL * 0.45 || isBlank(i)) continue;
        const ux = dx / L, uz = dz / L, nx = sgn * dz / L, nz = -sgn * dx / L, D = b.h > 80 ? 1.6 : 1.15, e0 = 0.4;
        const P = (t, o, y) => [a[0] + ux * t + nx * o, y, a[1] + uz * t + nz * o], N = [nx, 0, nz], Up = [0, 1, 0], Dn = [0, -1, 0], t0 = e0, t1 = L - e0;
        trim.col = col;
        for (let f = 1; f < b.floors; f++) {
          const y = f * fh;
          quad(trim, P(t0, D, y - 0.12), P(t1, D, y - 0.12), P(t1, D, y + 0.12), P(t0, D, y + 0.12), N);   // 슬래브 앞면
          quad(trim, P(t0, 0, y - 0.12), P(t1, 0, y - 0.12), P(t1, D, y - 0.12), P(t0, D, y - 0.12), Dn, [[0, 0], [L / 4, 0], [L / 4, D / 4], [0, D / 4]]);   // 밑면
          quad(trim, P(t0, D, y + 0.12), P(t1, D, y + 0.12), P(t1, 0, y + 0.12), P(t0, 0, y + 0.12), Up, [[0, 0], [L / 4, 0], [L / 4, D / 4], [0, D / 4]]);   // 윗면
          quad(trim, P(t0, D, y + 0.12), P(t1, D, y + 0.12), P(t1, D, y + 1.0), P(t0, D, y + 1.0), N);   // 난간(벽체)
          quad(trim, P(t0, D, y + 1.0), P(t1, D, y + 1.0), P(t1, D - 0.15, y + 1.0), P(t0, D - 0.15, y + 1.0), Up);
        }
        // 세대 경계 벽(양 끝 + 약 9m 마다): 앞면 + 양 옆면
        const nu = Math.max(1, Math.round((t1 - t0) / 9)), y0 = fh - 0.12, y1 = b.h;
        trim.col = dark;
        for (let k = 0; k <= nu; k++) {
          const t = t0 + (t1 - t0) * k / nu, w = 0.14;
          quad(trim, P(t - w, D + 0.02, y0), P(t + w, D + 0.02, y0), P(t + w, D + 0.02, y1), P(t - w, D + 0.02, y1), N);
          if (k > 0) quad(trim, P(t - w, 0, y0), P(t - w, D + 0.02, y0), P(t - w, D + 0.02, y1), P(t - w, 0, y1), [-ux, 0, -uz]);
          if (k < nu) quad(trim, P(t + w, D + 0.02, y0), P(t + w, 0, y0), P(t + w, 0, y1), P(t + w, D + 0.02, y1), [ux, 0, uz]);
        }
        trim.col = col;
      }
    }
    // 3-1) 측벽 동 표시(양 끝 측벽 위쪽, 벽에서 6cm 띄움). 라벨 아틀라스는 16열×16행, 칸 128×64px
    const lb = apt && labels ? labels.get(dongLabel(b)) : undefined;
    if (lb !== undefined) {
      const L2 = buf('dong'); L2.col = [1, 1, 1];
      const cu = (lb % 16) / 16, cv = 1 - (Math.floor(lb / 16) + 1) / 16;
      for (let i = 0; i < pts.length; i++) {
        if (!gable(i)) continue;
        const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 7) continue;
        const ux = dx / L, uz = dz / L, nx = sgn * dz / L, nz = -sgn * dx / L, w = Math.min(L * 0.62, 10), hh = w * 0.5, y1 = b.h - 1.2, y0 = y1 - hh, t = L / 2;
        const P = (tt, y) => [a[0] + ux * tt + nx * 0.06, y, a[1] + uz * tt + nz * 0.06];
        const fu = sgn > 0 ? [cu + 1 / 16, cu] : [cu, cu + 1 / 16];   // 바깥에서 볼 때 오른쪽 방향 = -sgn·(벽 방향)
        quad(L2, P(t - w / 2, y0), P(t + w / 2, y0), P(t + w / 2, y1), P(t - w / 2, y1), [nx, 0, nz], [[fu[0], cv], [fu[1], cv], [fu[1], cv + 1 / 16], [fu[0], cv + 1 / 16]]);
      }
    }
    // 4) 상가 간판: 1층 상가 띠 위쪽 가로 간판, 3층 이상이면 모서리 세로 간판 하나
    if (near && b._shop) {
      const S = buf('sign'); S.col = [1, 1, 1];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz);
        if (L < 4 || isBlank(i)) continue;
        const ux = dx / L, uz = dz / L, nx = sgn * dz / L, nz = -sgn * dx / L, N = [nx, 0, nz];
        const P = (t, o, y) => [a[0] + ux * t + nx * o, y, a[1] + uz * t + nz * o], m = Math.max(1, Math.round(L / 8)), seg = L / m;
        for (let k = 0; k < m; k++) {
          if (hsh(b.id, 40 + i * 7 + k) < 0.12) continue;
          const w = Math.min(seg - 0.8, 9), t = seg * (k + 0.5), y0 = fh - 1.0, y1 = fh - 0.15, o = 0.2;
          const cell = Math.floor(hsh(b.id, 60 + i * 7 + k) * SIGN_N), cu = (cell % 4) / 4, cv = 0.5 + Math.floor(cell / 4) / 16, du = 1 / 4, dv = 1 / 16;
          const f0 = sgn > 0 ? cu + du : cu, f1 = sgn > 0 ? cu : cu + du;   // 글자가 바깥에서 바로 읽히게
          quad(S, P(t - w / 2, o, y0), P(t + w / 2, o, y0), P(t + w / 2, o, y1), P(t - w / 2, o, y1), N, [[f0, cv], [f1, cv], [f1, cv + dv], [f0, cv + dv]]);
          const e = [[cu + 0.002, cv + 0.002], [cu + 0.003, cv + 0.002], [cu + 0.003, cv + 0.003], [cu + 0.002, cv + 0.003]];
          quad(S, P(t - w / 2, 0, y1), P(t + w / 2, 0, y1), P(t + w / 2, o, y1), P(t - w / 2, o, y1), [0, 1, 0], e);
          quad(S, P(t - w / 2, o, y0), P(t + w / 2, o, y0), P(t + w / 2, 0, y0), P(t - w / 2, 0, y0), [0, -1, 0], e);
          quad(S, P(t - w / 2, 0, y0), P(t - w / 2, o, y0), P(t - w / 2, o, y1), P(t - w / 2, 0, y1), [-ux, 0, -uz], e);
          quad(S, P(t + w / 2, o, y0), P(t + w / 2, 0, y0), P(t + w / 2, 0, y1), P(t + w / 2, o, y1), [ux, 0, uz], e);
        }
        if (i === 0 && b.floors >= 3 && L > 6 && hsh(b.id, 90) < 0.6) {
          const t = 0.6, y0 = fh + 0.6, y1 = Math.min(b.h - 0.5, fh + 0.6 + Math.min(b.floors - 1, 4) * fh * 0.9), dep = 0.9, th = 0.12;
          const cell = Math.floor(hsh(b.id, 91) * 16), cu = cell / 16, uvs = [[cu, 0], [cu + 1 / 16, 0], [cu + 1 / 16, 0.5], [cu, 0.5]];
          quad(S, P(t + th, 0.1, y0), P(t + th, 0.1 + dep, y0), P(t + th, 0.1 + dep, y1), P(t + th, 0.1, y1), [ux, 0, uz], [uvs[0], uvs[1], uvs[2], uvs[3]]);
          quad(S, P(t - th, 0.1 + dep, y0), P(t - th, 0.1, y0), P(t - th, 0.1, y1), P(t - th, 0.1 + dep, y1), [-ux, 0, -uz], [uvs[0], uvs[1], uvs[2], uvs[3]]);
          const e = [[cu + 0.001, 0.001], [cu + 0.002, 0.001], [cu + 0.002, 0.002], [cu + 0.001, 0.002]];
          quad(S, P(t - th, 0.1 + dep, y0), P(t + th, 0.1 + dep, y0), P(t + th, 0.1 + dep, y1), P(t - th, 0.1 + dep, y1), N, e);
        }
      }
    }
  }

  /* ---------- 공개 함수 ---------- */
  function build(data, opts = {}) {
    const T = window.THREE, grp = new T.Group(); grp.name = 'khContext';
    const ex = new Set(opts.exclude || []), want = b => !ex.has(b.id) && (opts.near !== false || !b.near) && (opts.far !== false || b.near)
      && (!opts.maxDist || b.dist <= opts.maxDist) && (!opts.filter || opts.filter(b));
    const bufs = {}, buf = k => bufs[k] || (bufs[k] = Buf());
    const DET = opts.detail || 0, DN = opts.detailNear || 400;
    const list = data.buildings.filter(b => want(b) && b.outline.length >= 3).concat((opts.extra || []).filter(b => b.outline.length >= 3));   // extra(외부에서 넣는 건물)는 거르지 않는다
    // 맞벽 판정용 격자(상세 반경 안 건물): 벽 가운데에서 바깥으로 0.9m 지점이 다른 건물 안이면 창 없는 벽
    const G = 30, grid = new Map(), key = (i, j) => i * 100003 + j;
    if (DET) list.forEach((b, k) => { if (b.dist > DET + 60) return; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; b.outline.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); b._bb = [x0, z0, x1, z1];
      for (let i = Math.floor(x0 / G); i <= Math.floor(x1 / G); i++) for (let j = Math.floor(z0 / G); j <= Math.floor(z1 / G); j++) { const q = key(i, j); if (!grid.has(q)) grid.set(q, []); grid.get(q).push(k); } });
    const covered = (p, self) => { const l = grid.get(key(Math.floor(p[0] / G), Math.floor(p[1] / G))); if (!l) return false;
      for (const k of l) { if (k === self) continue; const o = list[k], bb = o._bb; if (p[0] < bb[0] || p[0] > bb[2] || p[1] < bb[1] || p[1] > bb[3]) continue; if (inPoly(p, o.outline)) return o; } return false; };
    const labels = new Map();
    if (DET) data.buildings.forEach(b => { if (b.cls !== 'apt' || b.dist > DET || labels.size >= 256) return; const l = dongLabel(b); if (l && !labels.has(l)) labels.set(l, labels.size); });
    let nB = 0;
    list.forEach((b, bi) => {
      const pts = b.outline;
      let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
      // 같은 계열 색(밝은 미장 5종이 79%)이 줄지어 같은 밝기로 보이지 않게 건물마다 명도(선형 0.5～1.06배)·색온도(±6%)를 조금씩 다르게(그리기 호출·자료 변화 없음)
      const col = (c => { const k = 0.5 + hsh(b.id, 21) * 0.56, w = (hsh(b.id, 22) - 0.5) * 0.12; return [c[0] * k * (1 + w), c[1] * k, c[2] * k * (1 - w)]; })(hex(b.color));
      const sgn = A > 0 ? 1 : -1, fh = b.floor_h || 3.5;
      const det = DET && b.dist <= DET && Math.abs(A) / 2 > 25, near = b.dist <= DN;
      const cls = (b.near || det) ? (NEAR_CLS.includes(b.cls) ? b.cls : 'paint') : (FAR_OF[b.cls] || 'far_light');
      // 근경 상가(1층 유리): 첫 층은 shop 메시로
      // 상가 띠는 로드뷰로 본 건물, 또는 주용도(use)가 근린생활·판매·업무인 건물만(주택·학교·종교 시설 제외). 용도를 모르면 절반만
      const shopUse = b.shop_glass === true || (b.use ? ['03', '04', '07', '14'].includes(b.use) : hsh(b.id, 9) < 0.5);
      const shop = (b.near || (det && near)) && b.shop_glass !== false && shopUse && b.cls !== 'apt' && b.cls !== 'glass' && b.h > fh + 1 && (b.shop_glass || b.floors <= 8);
      b._shop = shop;
      buf(cls).cur2 = b.color2 ? hex(b.color2) : col; buf('shop').cur2 = [1, 1, 1];
      // 벽마다: 아파트 측벽·맞벽은 창 없는 단색 벽(trim)으로
      let maxL = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], c = pts[(i + 1) % pts.length]; maxL = Math.max(maxL, Math.hypot(c[0] - a[0], c[1] - a[1])); }
      const blank = [], gab = [];
      for (let i = 0; i < pts.length; i++) {
        let bl = false;
        if (det) {
          const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz);
          if (L > 0.05) {
            const nx = sgn * dz / L, nz = -sgn * dx / L, m = [(a[0] + c[0]) / 2 + nx * 0.9, (a[1] + c[1]) / 2 + nz * 0.9];
            const o = covered(m, bi);
            if (o && o.h > 3) bl = true;   // 붙은 건물이 있으면 창 없음(그 건물보다 높은 부분도 단순화를 위해 같이)
            if (b.cls === 'apt' && b.floors >= 4 && (L < 14 || L < maxL * 0.4)) { gab[i] = !bl; bl = true; }
          }
        }
        blank.push(bl);
      }
      // 창 무늬가 건물마다 같은 자리에서 시작하지 않게: 기둥 간격(0.85～1.25배)·시작 칸·시작 층을 건물마다 다르게
      const bay = det && b.cls !== 'apt' && b.cls !== 'glass' ? BAY * (0.85 + hsh(b.id, 1) * 0.4) : BAY, uo = Math.floor(hsh(b.id, 2) * 4), vo = Math.floor(hsh(b.id, 8) * 2);
      const W = (B, y0, y1, colr) => {
        let s = 0;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz);
          if (L < 0.05) continue;
          const n = [sgn * dz / L, 0, -sgn * dx / L];
          const A0 = [a[0], y0, a[1]], B0 = [c[0], y0, c[1]], A1 = [a[0], y1, a[1]], B1 = [c[0], y1, c[1]];
          if (blank[i]) { const t = buf(near ? 'trim' : 'trim_far'); t.col = colr === col ? col : [col[0] * 0.92, col[1] * 0.92, col[2] * 0.92];
            tri(t, A0, B0, B1, n, [s / 4, y0 / 4], [(s + L) / 4, y0 / 4], [(s + L) / 4, y1 / 4], t.col); tri(t, A0, B1, A1, n, [s / 4, y0 / 4], [(s + L) / 4, y1 / 4], [s / 4, y1 / 4], t.col); }
          else {
            const u0 = s / bay + uo, u1 = (s + L) / bay + uo, v0 = y0 / fh + vo, v1 = y1 / fh + vo;
            tri(B, A0, B0, B1, n, [u0, v0], [u1, v0], [u1, v1], colr); tri(B, A0, B1, A1, n, [u0, v0], [u1, v1], [u0, v1], colr);
          }
          s += L;
        }
      };
      if (shop) { W(buf('shop'), 0, fh, [1, 1, 1]); W(buf(cls), fh, b.h, col); }
      else W(buf(cls), 0, b.h, col);
      if (det) detailOf(b, pts, sgn, col, fh, bufs, buf, i => blank[i], near, labels, i => !!gab[i]);
      else { const rc = [col[0] * 0.55 + 0.12, col[1] * 0.55 + 0.12, col[2] * 0.55 + 0.12]; buf('roof').col = rc; }
      const R = buf('roof'), rc = det ? R.col : [col[0] * 0.55 + 0.12, col[1] * 0.55 + 0.12, col[2] * 0.55 + 0.12];
      roof(R, pts, b.h, rc);
      nB++;
    });
    let tris = 0;
    for (const k of Object.keys(bufs)) {
      const B = bufs[k]; if (!B.tris) continue;
      const mat = (opts.material && opts.material(k, { labels: [...labels.keys()] })) || defaultMaterial(k);
      const m = toMesh(B, mat, k), near = !k.startsWith('far_') && k !== 'trim_far';
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
  window.KHContext = { build, load, lonLatToWorld, defaultMaterial, NEAR_CLS, hsh, dongLabel };
})();
