// 지니 주변 환경 모델 시험(1102.l): node env.mjs  (BASE=주소, 기본 http://localhost:8791)
// 1) 모델이 모두 붙고 원래 회색 매스를 대신하는지(매스 재질이 보이지 않음, 모델이 장면 안에서 보임)
// 2) 실사 3D 를 켜기 전에는 라이트맵(_lm)·노후 맵(_ao)·가로 요소(street_env)·가로수(tree)·차량(cars)을 받지 않는지(네트워크), 켜면 받는지
// 3) ② 신축에서 에가 브레인 사우나(sauna529)가 보이지 않고 ① 현황에서는 보이는지
// 4) 보기 방식 4가지(스케치업·렌더·실사 3D·실사 사진) × 시대 ①②③ × 미성 현재/미래 조합에서 페이지 오류가 없는지, 보기 방식별 지니 재질 규칙(스케치업 = 텍스처 없음)
// 5) 주변 건물 스케치업 기준 화면: out/qa-shots/env-sketch.jpg (qa 의 shots 묶음이 docs/qa/baseline 과 비교)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT + 'qa-shots', { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = { at: new Date().toISOString() }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const reqs = []; p.on('request', r => { const u = r.url(); if (/\/new\/models\//.test(u)) reqs.push(u.split('/new/models/')[1].split('?')[0]); });
await p.goto(BASE + '/new/3d-model.html?prsw=0', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHENV && KHENV.loaded().n === KHENV.loaded().of && KHENV.loaded().of > 0 && !KHENV.busy, { timeout: 120000 }).catch(() => {});
const ev = (f, ...a) => p.evaluate(f, ...a);
// 1) 회색 매스 대신
res.replace = await ev(() => { const shown = o => { for (; o; o = o.parent) { if (!o.visible) return false; if (o === KHXR.scene) return true; } return false; };
  return KHENV.Q.map(q => { const ms = Array.isArray(q.m.material) ? q.m.material : [q.m.material]; let vis = 0; if (q.o) q.o.traverse(k => { if (k.isMesh && shown(k)) vis++; });
    return { id: q.id, model: !!q.o, massHidden: ms.every(m => m && m.visible === false), meshesShown: vis, inEra: shown(q.m) }; }); });
const bad = res.replace.filter(r => !r.model || !r.massHidden || (r.inEra && r.meshesShown === 0));
ok('지니 모델이 모두 붙고 회색 매스를 대신함(' + res.replace.length + '동)', res.replace.length >= 17 && bad.length === 0, { bad, loaded: await ev(() => KHENV.loaded()) });
// 5) 스케치업 기준 화면: 대지 북동쪽 골목(지니 건물이 많은 곳), 패널은 숨김
await p.addStyleTag({ content: '.panel,#panel,aside,.side{display:none!important}' });
await ev(() => { const C = KHXR.controls; KHXR.camera.position.set(-5, 34, -70); C.target.set(25, 6, -10); C.update(); }); await new Promise(r => setTimeout(r, 2000));
await p.screenshot({ path: OUT + 'qa-shots/env-sketch.jpg', type: 'jpeg', quality: 80 });
res.sketchMats = await ev(() => { let tex = 0, n = 0; (KHENV.R.all || []).forEach(k => { if (!k.visible) return; n++; if (k.material.map) tex++; }); return { n, tex }; });
ok('스케치업: 지니 재질 그대로(텍스처 있음, 1102.s Wing·지니 v107 규칙)', res.sketchMats.n > 0 && res.sketchMats.tex > 0, res.sketchMats);   // 1102.l 의 '무광 단색' 규칙은 Wing 요청으로 바뀜
// 2) 실사 3D 전 네트워크
const realRe = /_lm\.(js|ktx2)|_ao\.(js|ktx2)|env_lmao|^tree\.(js|glb)/;   // 1102.s: 도로·바닥·가로·2·3구역 묶음은 Wing·지니 v107 처럼 스케치업에서도 받는다(스케치업 가로 묶음). 라이트맵·AO·가로수만 실사 3D 에서   // 1102.l: 텍스처는 KTX2 를 먼저 받는다. 1102.o: 지니 v107 의 도로·바닥·2·3구역 묶음도 실사 3D 에서만
res.beforeReal = reqs.filter(r => realRe.test(r.replace(/^tex\//, '')));
await ev(() => document.getElementById('vm-render').click()); await new Promise(r => setTimeout(r, 2500));
res.renderMats = await ev(() => { let tex = 0, n = 0; (KHENV.R.all || []).forEach(k => { n++; if (k.material.map) tex++; }); return { n, tex, lm: (KHENV.R.all || []).filter(k => k.material.lightMap).length }; });
res.afterRender = reqs.filter(r => realRe.test(r.replace(/^tex\//, '')));
ok('스케치업·렌더에서는 라이트맵·AO·가로수를 받지 않음', res.afterRender.length === 0, { before: res.beforeReal, render: res.afterRender });
ok('렌더: 지니 재질(텍스처 있음)·라이트맵 없음', res.renderMats.tex > 0 && res.renderMats.lm === 0, res.renderMats);
// 3) 사우나: ② 신축 숨김, ① 현황 보임
const pick = id => ev(id => { const e = document.getElementById(id); if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, id);
const eraIds = await ev(() => [...document.querySelectorAll('input[name=era]')].map(e => e.id));
const sauna = () => ev(() => { const q = KHENV.Q.find(q => q.id === 'sauna529'); if (!q || !q.o) return null; let v = 0; q.o.traverse(k => { if (!k.isMesh) return; let s = true; for (let o = k; o; o = o.parent) { if (!o.visible) { s = false; break; } if (o === KHXR.scene) break; } if (s) v++; }); let inS = false; for (let o = q.o; o; o = o.parent) if (o === KHXR.scene) inS = true; return inS ? v : 0; });
res.sauna = {};
for (const id of eraIds) { await pick(id); await new Promise(r => setTimeout(r, 1200)); res.sauna[id] = await sauna(); }
const eNew = eraIds.find(i => /new/.test(i)), eNow = eraIds.find(i => /now|exist|cur/.test(i)) || eraIds[0];
ok('② 신축에서 사우나(sauna529) 안 보임, ① 현황에서 보임', res.sauna[eNew] === 0 && res.sauna[eNow] > 0, { eraIds, sauna: res.sauna });
// 4) 보기 방식 × 시대 × 미성
const modes = ['vm-sketch', 'vm-render', 'vm-real', 'vm-photo'], msIds = ['ms-now', 'ms-future'], combo = [];
for (const m of modes) {
  await pick(m);
  if (m === 'vm-real') { await p.waitForFunction(() => KHPRLayer.t && KHPRLayer.t.warm != null && KHPRLayer.t.dress != null, { timeout: 180000 }).catch(() => {}); await new Promise(r => setTimeout(r, 2500));
    // 1102.n: 신사중학교 실사 3D 기준 화면(압구정로 쪽, 서쪽 날개 실측 111m. 1102.o 부터 지니 v107 학교). 목표를 학교 상자 밖에 두어 Wing 가림이 학교를 숨기지 않게
    await ev(() => { const C = KHXR.controls; KHXR.camera.position.set(-45, 45, -95); C.target.set(-97, 8, -80); C.update(); }); await new Promise(r => setTimeout(r, 2500));
    await p.screenshot({ path: OUT + 'qa-shots/env-school.jpg', type: 'jpeg', quality: 80 });
    // 1102.o: 지니 v107 학교(서쪽 날개가 실측 길이)를 실측 자리에 맞춘 뒤 서쪽 날개(서쪽 끝에서 17m 안, 높이 12m 위)의 남북 끝
    res.school = await ev(() => { const q = KHENV.models().find(q => q.id === 'school410'), r = q && q.o; if (!r) return null; r.updateMatrixWorld(true); const v = new THREE.Vector3(), pts = [];
      r.traverse(k => { if (!k.isMesh || k.isLineSegments) return; let s = true; for (let o = k; o; o = o.parent) if (!o.visible) s = false; if (!s) return; const a = k.geometry.attributes.position; for (let i = 0; i < a.count; i += 2) { v.fromBufferAttribute(a, i).applyMatrix4(k.matrixWorld); if (v.y > 12) pts.push([v.x, v.z]); } });
      if (!pts.length) return { shown: false }; const x0 = Math.min(...pts.map(p => p[0])), wz = pts.filter(p => p[0] < x0 + 17).map(p => p[1]);
      return { shown: true, west: +x0.toFixed(1), south: +Math.max(...wz).toFixed(1), north: +Math.min(...wz).toFixed(1), fix: KHPRLayer.stat.envSchool }; });
    res.afterPr = reqs.filter(r => realRe.test(r.replace(/^tex\//, ''))).length; res.prEnv = await ev(() => ({ real: KHENV.R.real, lm: (KHENV.R.all || []).filter(k => k.material.lightMap).length, out: (KHPRLayer.stat.envOut || []).length, school: KHPRLayer.stat.envSchool })); }
  else await new Promise(r => setTimeout(r, 1500));
  for (const e of eraIds) for (const s of msIds) { const n0 = errs.length; await pick(e); await pick(s); await new Promise(r => setTimeout(r, 500)); combo.push({ m, e, s, err: errs.length - n0 }); }
}
res.combo = combo;
ok('실사 3D 를 켜면 라이트맵·가로 요소를 받고 지니 라이트맵 적용, 겹친 브이월드·OSM 건물 뺌', res.afterPr > 0 && res.prEnv.real && res.prEnv.lm > 0 && res.prEnv.out >= 10, { reqs: res.afterPr, ...res.prEnv });
ok('실사 3D 신사중학교: 서쪽 날개 남북 끝이 실측(z -28.2 · -139.1) ±1m, 서쪽 끝(x -157.7) ±1m', res.school && res.school.shown && Math.abs(res.school.south + 28.2) <= 1 && Math.abs(res.school.north + 139.1) <= 1 && Math.abs(res.school.west + 157.7) <= 1, res.school);
ok('보기 방식 4 × 시대 ' + eraIds.length + ' × 미성 2 조합에서 페이지 오류 없음(' + combo.length + '개)', combo.every(c => c.err === 0) && errs.length === 0, { errs: errs.slice(0, 3), bad: combo.filter(c => c.err) });
fs.writeFileSync(OUT + 'env.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
