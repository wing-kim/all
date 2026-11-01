// Wing 옵션 전수 점검(실사 3D): node options.mjs  (BASE=주소, 기본 http://localhost:8791, ONLY=축이름,... 로 일부만)
// 축별 전수(한 축만 바꾸고 나머지는 기본) + 대표 교차 조합. 상태마다:
//  - 페이지 오류·콘솔 오류 0 (자원 404 는 따로 센다)
//  - 우리 건물(K.bld·K.exist·K.site)의 보이는 조명 재질 중 실사 재질로 바뀌지 않은(Wing 원본 그대로) 수와 목록(기본 변환 수 따로, 무조명 MeshBasic 제외)
//  - 실내 굽기 켜짐 여부, 쓰인 조합별 굽기 변형, 실내 층이 굽기 칸을 찾았는지(못 찾으면 대체 조명)
//  - 작은 스크린샷(out/opt/<번호>-<이름>.jpg)
// 결과: out/options.json, 요약은 콘솔
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/opt/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const wait = ms => new Promise(r => setTimeout(r, ms));

// 상태 정의: set = 바꿀 입력(id, id=값, !id 는 체크 끔, click:id 는 버튼 누름), view = 볼 곳(out·층 키·Wing 시점 v-*)
const R = (axis, ids, view) => ids.map(id => ({ axis, name: id, set: [id], view }));
const AX = [
  ...R('era', ['era-now', 'era-new', 'era-cmp']),
  { axis: 'era', name: 'cmp-현황만', set: ['era-cmp', 'mixq=0'] }, { axis: 'era', name: 'cmp-신축만+윤곽', set: ['era-cmp', 'mixq=100', 't-cmpol'] }, { axis: 'era', name: 'cmp-아파트겹침', set: ['era-cmp', 't-cmpapt'] },
  ...R('vmode', ['vm-sketch', 'vm-render', 'vm-photo']).map(s => ({ ...s, after: ['vm-pr'] })),
  ...R('tod', ['tod-am', 'tod-pm', 'tod-sunset', 'tod-night']),
  ...R('tod-int', ['tod-am', 'tod-sunset', 'tod-night'], '1F'),
  ...R('season', ['season-spring', 'season-summer', 'season-autumn', 'season-winter']),
  { axis: 'sun', name: '날짜시각-07시', set: ['sun-hour=7', 'click:sun-apply'] }, { axis: 'sun', name: '날짜시각-18시', set: ['sun-hour=18', 'click:sun-apply'] }, { axis: 'sun', name: '날짜시각-22시', set: ['sun-hour=22', 'click:sun-apply'] },
  ...R('render', ['t-citylights', '!t-hq', '!t-ao']),
  ...R('sch', ['sch-mech', 'sch-self', 'sch-alt3', 'sch-alt4'], 'B1'),
  ...R('sch-1F', ['sch-mech', 'sch-self', 'sch-alt3'], '1F'),
  ...R('g1', ['g1-slant', 'g1-straight', 'g1-corner', 'g1-skin'], '1F'),
  ...R('g1-out', ['g1-slant', 'g1-straight', 'g1-corner']),
  ...R('toggle', ['!t-upstraight', 't-skin', 't-cglass', 't-cclean', 't-use7', 't-nost', 't-a4park']),
  { axis: 'toggle', name: 't-use7-int', set: ['t-use7'], view: '7F' }, { axis: 'toggle', name: 't-a4park-B1', set: ['t-a4park'], view: 'B1' }, { axis: 'toggle', name: 't-nost-int', set: ['t-nost'], view: '6F' },
  ...['terra', 'stone', 'metal', 'brick', 'glass', 'frame', 'veil', 'arch', 'pixel', 'hex', 'gblock', 'perf', 'woodfin', 'ceramic', 'uglass'].map(k => ({ axis: 'cfin', name: 'sty-' + k, set: ['em-combo', 'form-none', 'sty-' + k] })),
  ...['portal', 'wave', 'twist', 'diagrid', 'corner', 'stack', 'fold', 'ribbon', 'hfin', 'baybox', 'media', 'balcony', 'xbrace', 'checker', 'colonnade', 'kinetic'].map(k => ({ axis: 'form', name: 'form-' + k, set: ['em-combo', 'sty-glass', 'form-' + k] })),
  ...['stack', 'veil', 'arch', 'pixel', 'fold', 'ribbon', 'hfin', 'baybox', 'hex', 'media', 'gblock', 'perf', 'woodfin', 'ceramic', 'uglass', 'balcony', 'xbrace', 'checker', 'colonnade', 'kinetic'].map(k => ({ axis: 'dsg', name: 'dsg-' + k, set: ['em-preset', 'dsg-' + k] })),
  ...R('win', ['win-big', 'win-front', 'win-mega', 'win-base']),
  ...['4', '5', '7', '8'].map(v => ({ axis: 'floors', name: 'floors-' + v, set: ['c-floors=' + v] })),
  { axis: 'floors', name: 'floors-8-int', set: ['c-floors=8'], view: '8F' },
  ...['3.6', '6.5'].map(v => ({ axis: 'h1', name: 'h1-' + v, set: ['c-h1=' + v], view: '1F' })),
  ...['3.0', '5.0'].map(v => ({ axis: 'ht', name: 'ht-' + v, set: ['c-ht=' + v], view: '3F' })),
  ...R('show', ['!t-labels', 't-cxlab', 't-limits', '!t-frame', 't-b1', '!t-ctx', '!t-city']),
  ...['v-int', 'v-front', 'v-side', 'v-stair', 'v-top', 'v-roof', 'v-apt', 'v-far'].map(k => ({ axis: 'view', name: k, set: [], view: k })),
  ...['1F', 'B1', 'B2', 'B3', '2F', '6F', 'PH1'].map(k => ({ axis: 'level', name: 'lv-' + k, set: [], view: k })),
];
// 대표 교차 조합: 굽기 변형이 겹치는 주차×1층 16개 + 마감·형태·시간대·층 구성 교차
const SCH = ['mech', 'self', 'alt3', 'alt4'], G1 = ['slant', 'straight', 'corner', 'skin'];
const CROSS = [
  ...SCH.flatMap(s => G1.map(g => ({ axis: 'x-sch-g1', name: `x-${s}-${g}`, set: ['sch-' + s, 'g1-' + g], view: '1F' }))),
  { axis: 'x', name: 'x-brick-diagrid', set: ['em-combo', 'sty-brick', 'form-diagrid'] },
  { axis: 'x', name: 'x-terra-portal-night', set: ['em-combo', 'sty-terra', 'form-portal', 'tod-night'] },
  { axis: 'x', name: 'x-kinetic-night', set: ['em-preset', 'dsg-kinetic', 'tod-night'] },
  { axis: 'x', name: 'x-use7-floors8-h1', set: ['t-use7', 'c-floors=8', 'c-h1=6.5'], view: '7F' },
  { axis: 'x', name: 'x-cmp-night', set: ['era-cmp', 'tod-night'] },
  { axis: 'x', name: 'x-mech-slant-B1', set: ['sch-mech', 'g1-slant'], view: 'B1' },
  { axis: 'x', name: 'x-stone-mega-sunset', set: ['em-combo', 'sty-stone', 'win-mega', 'tod-sunset'] },
  { axis: 'x', name: 'x-colonnade-nost-use7', set: ['em-preset', 'dsg-colonnade', 't-nost', 't-use7'], view: '7F' },
  { axis: 'x', name: 'x-wave-skin-noupst', set: ['em-combo', 'form-wave', 't-skin', '!t-upstraight'] },
  { axis: 'x', name: 'x-a4park-self-B1', set: ['sch-self', 't-a4park'], view: 'B1' },
  { axis: 'x', name: 'x-now-night-int', set: ['era-now', 'tod-night'], view: 'v-int' },
  { axis: 'x', name: 'x-uglass-winter-am', set: ['em-preset', 'dsg-uglass', 'season-winter', 'tod-am'] },
];
const STATES = [...AX, ...CROSS].filter(s => !ONLY || ONLY.has(s.axis));

const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist', '--window-size=1280,760'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 });
let errs = [], e404 = 0;
p.on('pageerror', e => errs.push('pageerror ' + String(e).slice(0, 200)));
p.on('console', m => { const t = m.text(); if (m.type() !== 'error' && !/THREE\.WebGL(Program|Shader)/.test(t)) return; if (/Failed to load resource/.test(t)) { e404++; return; } errs.push(t.slice(0, 200)); });
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.plants != null && KHPRLayer.t.ground != null, { timeout: 240000 });
await wait(2000);
// 시작 상태(Wing 입력값)를 기억해 두고 상태마다 되돌린다
const snap = await p.evaluate(() => [...document.querySelectorAll('aside input, #panel input')].filter(e => e.id && (e.type === 'radio' ? e.checked : true)).map(e => [e.id, e.type, e.type === 'range' || e.type === 'date' ? e.value : e.checked]));
const setInputs = (specs) => p.evaluate(specs => {
  const fire = (e, t) => e.dispatchEvent(new Event(t, { bubbles: true }));
  for (const sp of specs) {
    if (sp.startsWith('click:')) { const e = document.getElementById(sp.slice(6)); if (e) e.click(); continue; }
    const off = sp[0] === '!', [id, val] = (off ? sp.slice(1) : sp).split('=');
    let e = document.getElementById(id);
    if (!e && val != null) { e = [...document.querySelectorAll(`input[name="${id}"]`)].find(x => x.value === val); if (e) { if (!e.checked) { e.checked = true; fire(e, 'change'); } continue; } }
    if (!e) { console.warn('입력 없음', sp); continue; }
    if (e.type === 'range' || e.type === 'date') { if (e.value !== val) { e.value = val; fire(e, 'input'); fire(e, 'change'); } }
    else if (e.type === 'checkbox') { const want = !off; if (e.checked !== want) { e.checked = want; fire(e, 'change'); } }
    else if (!e.checked) { e.checked = true; fire(e, 'change'); }
  }
}, specs);
const restore = () => p.evaluate(snap => {
  const fire = (e, t) => e.dispatchEvent(new Event(t, { bubbles: true }));
  for (const [id, type, v] of snap) { const e = document.getElementById(id); if (!e) continue;
    if (type === 'range' || type === 'date') { if (e.value !== v) { e.value = v; fire(e, 'input'); fire(e, 'change'); } }
    else if (type === 'checkbox') { if (e.checked !== v) { e.checked = v; fire(e, 'change'); } }
    else if (v && !e.checked) { e.checked = true; fire(e, 'change'); } }
  if (!document.getElementById('vm-pr').checked) { const e = document.getElementById('vm-pr'); e.checked = true; fire(e, 'change'); }
}, snap);
const look = view => p.evaluate(v => {
  const X = window.KHXR, K = KHPRLayer.K;
  if (!v || v === 'out') { if (K.I.on || X.cur !== 'corner') X.go('corner'); return true; }
  if (v.startsWith('v-')) { const bt = document.getElementById(v); if (bt) bt.click(); return !!bt; }
  const i = K.LEVELS.findIndex(l => l.key === v); if (i < 0) return false;
  if (!K.I.on) X.enterInt(); X.placeLevel(i, true); return true;
}, view);
const audit = () => p.evaluate(() => {
  const PR = KHPRLayer, K = PR.K, B = PR.bake;
  // 화면 합치기(T1)로 숨긴 원본 메시는 합친 묶음으로 그려지므로 보이는 것으로 센다
  const hs = window.KHXRLayer && KHXRLayer.opt && KHXRLayer.opt.hiddenSet;
  const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible && !(hs && hs.has(q))) return false; return true; };
  // 무조명 표시 재질(MeshBasic: 바닥 표시선·간판 발광·라벨)은 조명과 무관하므로 따로 센다. gen = 기본 변환으로 바뀐 수
  const un = new Map(); let n = 0, ok = 0, basic = 0, gen = 0;
  [['bld', K.bld], ['exist', K.exist], ['site', K.site]].forEach(([nm, r]) => r && r.traverse(o => { if (!o.isMesh || !vis(o)) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m) return; if (m.isMeshBasicMaterial) { basic++; return; } n++; if (m.userData.prMade) { ok++; if (m.userData.prGen) gen++; return; }
      const k = nm + ':' + (m.name || '-') + ':' + m.type.replace('Material', '') + ':' + (m.color ? '#' + m.color.getHexString() : '') + (m.map ? ':tex' : '') + (m.transparent ? ':t' + (+m.opacity).toFixed(2) : '');
      un.set(k, (un.get(k) || 0) + 1); }); }));
  const lv = K.I.on && K.Lv ? K.Lv() : null, man = B.man;
  const tile = lv && man ? (man.levels.find(q => q.key === lv.key) ? 'own' : man.levels.some(q => q.kind === lv.kind) ? 'kind' : 'none') : '';
  const s = K.state;
  return { on: PR.on, n, ok, gen, basic, unN: n - ok, un: [...un].sort((a, b) => b[1] - a[1]).slice(0, 10), bake: B.u.on.value, slot: B.slot, vars: B.vars || [], level: lv ? lv.key : 'out', tile,
    levels: K.LEVELS.map(l => l.key).join(','), fails: PR.stat.fails || null,
    state: { era: s.era, scheme: s.scheme, g1: s.g1, mode: s.mode, cfin: s.cfin, cform: s.cform, pdesign: s.pdesign, win: s.win, floors: s.floors, use7: s.use7 } };
});
const res = { base: BASE, at: new Date().toISOString(), states: [] };
let i = 0;
for (const st of STATES) {
  i++; errs = [];
  await restore(); await wait(400);
  await setInputs(st.set); if (st.after) { await wait(1500); await setInputs(st.after); }
  await wait(2200);
  const seen = await look(st.view); await wait(st.view ? 2600 : 1200);
  await p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 20 ? r() : requestAnimationFrame(f)); f(); }));
  const a = await audit();
  const file = `${String(i).padStart(3, '0')}-${st.name.replace(/[^\w가-힣+-]/g, '_')}.jpg`;
  await p.screenshot({ path: OUT + file, type: 'jpeg', quality: 55, clip: { x: 0, y: 0, width: 1030, height: 760 } });
  const r = { i, axis: st.axis, name: st.name, view: st.view || 'out', viewOk: seen, ...a, errors: errs.slice(0, 4), file };
  res.states.push(r);
  console.log(`${i}/${STATES.length} ${st.axis} ${st.name}${st.view ? ' @' + st.view : ''} 실사:${a.on ? 'on' : 'OFF'} 미변환:${a.unN}/${a.n}(기본${a.gen}) 굽기:${a.bake}${a.vars.length ? '[' + a.vars + ']' : ''}${a.tile ? ' 칸:' + a.tile : ''} 오류:${errs.length}${seen ? '' : ' (시점 없음)'}`);
}
await restore(); await wait(800);
res.e404 = e404;
const bad = res.states.filter(s => s.errors.length || !s.on);
res.summary = { states: res.states.length, errorStates: bad.length, maxUnconverted: Math.max(...res.states.map(s => s.unN)) };
fs.writeFileSync(OUT + '../options.json', JSON.stringify(res, null, 1));
console.log('요약', JSON.stringify(res.summary), '자원 404:', e404);
await b.close();
