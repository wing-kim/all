// 지하주차장 램프 시험(1102.r): node ramp.mjs  (BASE=주소, 기본 http://localhost:8791, SHOTS=폴더 → 시점 화면 저장)
// 실사 3D 와 기본 화면에서 B1～B4 마다
//  1) 가림: 램프 면(삼각형 중심)에서 위로·위에서 아래로 광선을 쏴, 이 층 바닥·천장 마감이 램프 구멍을 덮었는지(셰이더로 뚫은 구멍 prHoleCuts 는 뚫린 것으로 친다).
//     램프 위 차량·램프 벽은 원래 있는 것이라 뺀다
//  2) 겹침 깜빡임: 층 기본 걷기 자리 눈높이에서 내려가는 램프 입구·올라오는 램프 끝을 보며 0.2mm 씩 6번 옆으로 옮긴 프레임의 밝기 변화
//     (강하게 바뀐 화소 %. 0.2mm 는 3m 앞이 0.05화소 움직이는 양이라 시차는 거의 없고, 같은 높이에서 다투는 면만 깜빡인다)
// 고치기 전(1102.q): 실사 3D 의 주차 바닥 마감·검은 천장이 램프 구멍을 덮었고(B1 내려가는 램프 48/48, 올라가는 램프 30/32 덮임), 마감판 구멍 삼각분할이 깨져 면적이 바닥보다 컸다
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791', SHOTS = process.env.SHOTS || null;
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT + 'qa-shots', { recursive: true }); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const res = { at: new Date().toISOString(), runs: [] }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const errs = [];
for (const [tag, qs] of [['pr', '?pr=1&prsw=0'], ['base', '?prsw=0']]) {
  const p = await b.newPage(); await p.setViewport({ width: 1200, height: 760 });
  p.on('pageerror', e => errs.push(tag + ' ' + String(e).slice(0, 200)));
  await p.goto(BASE + '/new/3d-model.html' + qs, { waitUntil: 'load', timeout: 120000 });
  if (tag === 'pr') { await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null, { timeout: 240000 }).catch(() => errs.push('준비 시간 초과')); await p.waitForFunction(() => !KHPRLayer.settling(), { timeout: 120000 }).catch(() => {}); }
  else await new Promise(r => setTimeout(r, 8000));
  await p.addStyleTag({ content: '.panel,#panel,aside,.side,.pr-panel{display:none!important}' });
  const keys = await p.evaluate(() => KHXR.LEVELS.filter(l => l.kind === 'base').map(l => l.key));
  for (const k of keys) {
    const r = await p.evaluate(async k => {
      const i = KHXR.LEVELS.findIndex(l => l.key === k); KHXR.enterInt(); KHXR.placeLevel(i, true); await new Promise(r => setTimeout(r, 2500)); KHXR.scene.updateMatrixWorld(true);
      const L = KHXR.LEVELS[i], vis = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; }, isR = o => { while (o) { if (o.userData && o.userData.ramp) return true; o = o.parent; } return false; };
      const pip = (pt, poly) => { let c = false; for (let a = 0, j = poly.length - 1; a < poly.length; j = a++) { const [xi, yi] = poly[a], [xj, yj] = poly[j]; if (((yi > pt[1]) !== (yj > pt[1])) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
      const O = window.KHXRLayer && KHXRLayer.opt, src = h => { if (!O || !O.group || h.object.parent !== O.group) return h.object; const rr = new THREE.Raycaster(rc.ray.origin, rc.ray.direction); rr.far = 40; const x = rr.intersectObjects(O.hidden || [], false).filter(q => Math.abs(q.distance - h.distance) < 0.02)[0]; return x ? x.object : h.object; };
      const skip = h => { const m = h.object.material, C = m && m.userData && m.userData.prHoleCuts; if (C && C.some(a => pip([h.point.x, h.point.z], a))) return true; let o = src(h); if (/ramp/i.test((o.material && o.material.name) || '')) return true; while (o) { if (o.userData && (o.userData.prCar || o.userData.car)) return true; if (/car|bmw|sketchfab|g90|genesis/i.test(o.name || '')) return true; o = o.parent; } return false; };
      const rc = new THREE.Raycaster(), down = [], up = [], v = new THREE.Vector3(), w = new THREE.Vector3(), u = new THREE.Vector3();
      KHXR.scene.traverse(o => { if (!(o.isMesh && o.parent && o.parent.userData.ramp && o === o.parent.children[0])) return; const a = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count / 3 : a.count / 3;
        for (let t = 0; t < n; t++) { const I = q => ix ? ix.getX(t * 3 + q) : t * 3 + q; v.fromBufferAttribute(a, I(0)).add(w.fromBufferAttribute(a, I(1))).add(u.fromBufferAttribute(a, I(2))).multiplyScalar(1 / 3).applyMatrix4(o.matrixWorld);
          if (v.y < L.y - 0.4 && v.y > L.y - 2.6) down.push(v.clone()); else if (v.y > L.y + 0.4 && v.y < L.y + L.h - 0.6) up.push(v.clone()); } });
      let dc = 0, uc = 0; const by = {};
      for (const q of down) { rc.set(new THREE.Vector3(q.x, L.y + 0.6, q.z), new THREE.Vector3(0, -1, 0)); rc.far = 4; const f = rc.intersectObjects(KHXR.scene.children, true).filter(h => vis(h.object) && !h.object.isLine && !h.object.isSprite && !isR(h.object) && !skip(h))[0]; if (f && f.point.y > q.y + 0.1) { dc++; const s = src(f), n = (s.name || (s.parent && s.parent.name) || '?') + '/' + (s.material && s.material.name); by[n] = (by[n] || 0) + 1; } }
      for (const q of up) { rc.set(new THREE.Vector3(q.x, q.y + 0.05, q.z), new THREE.Vector3(0, 1, 0)); rc.far = 30; const f = rc.intersectObjects(KHXR.scene.children, true).filter(h => vis(h.object) && !h.object.isLine && !h.object.isSprite && !isR(h.object) && !skip(h))[0]; if (f && f.point.y < L.y + L.h + 0.6 && f.point.y > q.y + 0.3 && f.point.y - q.y < 2.3) { uc++;   /* 1102.s: 위 공간이 2.3m(주차장 램프 유효 높이) 이상 남는 램프 아래쪽 위의 천장은 실제로도 있는 천장(rampCuts 'ceil' 기준과 같음) */ const s = src(f), n = (s.name || (s.parent && s.parent.name) || '?') + '/' + (s.material && s.material.name); by[n] = (by[n] || 0) + 1; } }
      // 눈높이 시점: 내려가는 램프는 입구 뒤 9m 에서 아래로, 올라가는 램프는 끝 앞 9m 에서 위로
      const cen = (arr, lo, hi) => { const c = new THREE.Vector3(); let n = 0; arr.forEach(q => { if (q.y >= lo && q.y <= hi) { c.add(q); n++; } }); return n ? c.multiplyScalar(1 / n) : null; };
      const views = [], home = KHXR.camera.position.clone();   // 층에 들어간 기본 걷기 자리에서 램프 입구·끝을 본다
      { const S = cen(down, L.y - 0.9, L.y - 0.4), D = cen(down, L.y - 2.0, L.y - 1.4); if (S && D) { const d = D.clone().sub(S).setY(0).normalize(); views.push({ n: 'down', c: home.clone().setY(L.y + 1.7).toArray(), t: S.clone().addScaledVector(d, 2).setY(L.y - 0.3).toArray() }); } }
      { const B = cen(up, L.y + 0.4, L.y + 0.9), U = cen(up, L.y + 1.4, L.y + 2.0); if (B && U) { const d = U.clone().sub(B).setY(0).normalize(); views.push({ n: 'up', c: home.clone().setY(L.y + 1.7).toArray(), t: B.clone().setY(L.y + 1.0).toArray() }); } }
      return { k, y: L.y, down: down.length, downCovered: dc, up: up.length, upCovered: uc, by, views };
    }, k);
    r.flick = {};
    for (const vw of r.views) {
      const S = [];
      for (let s = 0; s < 6; s++) {
        await p.evaluate((vw, s) => { const c = KHXR.camera, t = KHXR.controls.target; c.position.set(...vw.c); t.set(...vw.t); c.lookAt(t); const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quaternion); c.position.addScaledVector(rgt, s * 0.0002); t.addScaledVector(rgt, s * 0.0002); KHXR.controls.update(); c.updateMatrixWorld(); }, vw, s);
        await p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 5 ? r() : requestAnimationFrame(f)); f(); }));
        S.push(await p.screenshot({ type: 'png', encoding: 'base64', clip: { x: 0, y: 60, width: 1200, height: 640 } }));
      }
      if (SHOTS) fs.writeFileSync(SHOTS + `/${tag}-${k}-${vw.n}.jpg`, Buffer.from(await p.screenshot({ type: 'jpeg', quality: 85, encoding: 'base64' }), 'base64'));
      if (tag === 'pr' && k === 'B1' && vw.n === 'down') fs.writeFileSync(OUT + 'qa-shots/ramp-B1-down.png', Buffer.from(S[0], 'base64'));
      r.flick[vw.n] = await p.evaluate(async S => { const dec = async s => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height).data; };
        const D = await Promise.all(S.map(dec)); let hi = 0, n = 0; for (let i = 0; i < D[0].length; i += 8) { let a = 0; for (let k = 1; k < D.length; k++) a += Math.abs((D[k][i] + D[k][i + 1] + D[k][i + 2]) - (D[k - 1][i] + D[k - 1][i + 1] + D[k - 1][i + 2])) / 3; a /= D.length - 1; n++; if (a > 12) hi++; } return +(hi / n * 100).toFixed(2); }, S);
    }
    delete r.views; r.tag = tag; res.runs.push(r); console.log(tag, JSON.stringify(r));
  }
  await p.close();
}
const pr = res.runs.filter(r => r.tag === 'pr'), worstF = Math.max(0, ...pr.flatMap(r => Object.values(r.flick)));
ok('실사 3D 램프 구멍이 바닥·천장 마감에 덮이지 않음(B1～B4, 덮인 점 ≤ 2%)', pr.length > 0 && pr.every(r => r.downCovered <= Math.max(0, r.down * 0.02) && r.upCovered <= Math.max(0, r.up * 0.02)) && pr.some(r => r.down + r.up > 0), pr.map(r => ({ k: r.k, d: r.downCovered + '/' + r.down, u: r.upCovered + '/' + r.up, by: r.by })));
ok('램프 시점 겹침 깜빡임(강하게 바뀐 화소 ≤ 1%)', worstF <= 1, pr.map(r => ({ k: r.k, ...r.flick })));
ok('기본 화면도 덮임 없음(원본 비교)', res.runs.filter(r => r.tag === 'base').every(r => r.downCovered === 0 && r.upCovered === 0), res.runs.filter(r => r.tag === 'base').map(r => ({ k: r.k, d: r.downCovered, u: r.upCovered })));
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 3));
fs.writeFileSync(OUT + 'ramp.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
