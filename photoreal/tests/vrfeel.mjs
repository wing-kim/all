// VR 안 느낌 시험(IWER Quest 3 에뮬레이터, 1102.k Jack 퀘스트 확인 3건): node vrfeel.mjs  (BASE=주소, 기본 http://localhost:8791)
// 1) 패스스루 알파: 실사 3D 를 켜고 VR 에서 나무가 보이는 외관을 볼 때 프레임 버퍼 알파가 1 보다 작은 화소(퀘스트에서 현실이 비치는 자리)가 없는지. 보정을 끈 값도 같이 적는다
// 2) 이동 끊김: 순간이동 10번, 층 이동 5번을 하며 이동 뒤 30프레임의 가장 긴 프레임 간격과 72Hz 기준(20.8ms 초과) 놓친 프레임 수
// 3) 레이: 메뉴 칸을 겨눴을 때 레이가 맞은 지점에서 끊기는지(패널 뒤로 넘어가지 않음), 커서가 보이고 패널보다 앞에 있는지
// 결과: out/vrfeel.json, PASS/FAIL 줄
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1280,800', '--ignore-gpu-blocklist'] });
const res = { at: new Date().toISOString() }, oks = []; const ok = (n, pass, info) => { oks.push(!!pass); console.log(pass ? 'PASS' : 'FAIL', n, JSON.stringify(info)); };
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&prsw=0&pr=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && KHPRLayer.t.dress != null, { timeout: 240000 });
await new Promise(r => setTimeout(r, 3000));
const ev = (f, ...a) => p.evaluate(f, ...a);
await ev(() => { window.F = async n => { const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < n; i++) await new Promise(r => s.requestAnimationFrame(() => r())); };
  // 이동 뒤 n 프레임의 간격(세션 rAF 시각 차)
  // 보이는 프레임만(그 프레임이 시작될 때 전환 효과가 0.9 이상 검었으면 뺀다): 검은 화면의 끊김은 눈에 덜 띈다. 모든 프레임은 FTall
  // FTw: 보이는 프레임 중 가장 긴 프레임에 그 프레임 동안 생긴 일(합치기 횟수·새 셰이더·새 텍스처·구성 점검 시간)을 적는다(최적화 4번 원인 찾기, 1102.m)
  window.FTall = []; window.FTw = null; window.FT = async n => { const s = KHXR.renderer.xr.getSession(), R = KHXR.renderer, O = KHXRLayer.opt, ds = []; FTall = []; FTw = null; let t = null, a0 = 0, st = null;
    const snap = () => ({ b: O.nBuild, p: R.info.programs.length, x: R.info.memory.textures, g: R.info.memory.geometries, c: O.checkMs });
    for (let i = 0; i < n; i++) { const now = await new Promise(r => s.requestAnimationFrame(tt => r(tt))), sn = snap(); if (t != null) { FTall.push(now - t); if (a0 < 0.9) { ds.push(now - t); if (!FTw || now - t > FTw.ms) FTw = { ms: +(now - t).toFixed(1), i, builds: sn.b - st.b, programs: sn.p - st.p, textures: sn.x - st.x, geos: sn.g - st.g, checkMs: sn.c }; } } t = now; st = sn; a0 = KHXRLayer.fadeA(); } return ds; }; });
await ev(() => KHXRLayer.enter('vr')); await new Promise(r => setTimeout(r, 2500)); await ev(() => F(30));
// 1) 알파: 바깥에서 건물과 나무가 보이게(머리 위치·방향은 에뮬레이터)
const alpha = async on => ev(async on => { const A = KHXRLayer.alphaFix; A.on = on; A.probe = true; await F(3); return A.last; }, on);
await ev(() => { const d = KHEMU, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, 0, 0, 'YXZ')); d.position.set(0, 1.6, 0); d.quaternion.set(q.x, q.y, q.z, q.w); });
await ev(() => KHXRLayer.goOutside && KHXRLayer.goOutside()); await ev(() => F(60));
res.alphaOff = await alpha(false); res.alphaOn = await alpha(true);
ok('패스스루 알파: 보정 켜면 알파 1 미만 화소 0%', res.alphaOn && res.alphaOn.belowPct === 0, { on: res.alphaOn, off: res.alphaOff });
// 2) 이동 끊김
const CPU = +(process.env.CPU || 1); res.cpu = CPU; const cdp = await p.target().createCDPSession(); if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });   // 퀘스트 CPU 흉내(CPU=4)
const stat = ds => { const a = ds.slice().sort((x, y) => x - y); return { max: +(a[a.length - 1] || 0).toFixed(1), med: +(a[a.length >> 1] || 0).toFixed(1), missed72: ds.filter(d => d > 1000 / 72 * 1.5).length }; };
res.base = stat(await ev(() => FT(60)));
const tele = [];
for (let i = 0; i < 10; i++) { tele.push(stat(await ev(async i => { const a = i * 0.9, r = 18 + (i % 3) * 8; const n0 = KHXRLayer.opt.nBuild; KHXRLayer.teleportTo(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), a); const ds = await FT(30); window.__nb = KHXRLayer.opt.nBuild - n0; return ds; }, i))); tele[i].builds = await ev(() => window.__nb); }
const fl = [];
for (const k of ['1F', '2F', '5F', 'B1', '1F']) { fl.push({ k, ...stat(await ev(async k => { const n0 = KHXRLayer.opt.nBuild; KHXRLayer.goLevel(KHXR.LEVELS.findIndex(l => l.key === k)); const ds = await FT(45); window.__nb = KHXRLayer.opt.nBuild - n0; window.__all = Math.round(Math.max(...FTall)); window.__ms = KHXRLayer.opt.stat && KHXRLayer.opt.stat.ms; return ds; }, k)), builds: await ev(() => window.__nb), optMs: await ev(() => window.__ms), maxAll: await ev(() => window.__all), worst: await ev(() => window.FTw) }); }
res.teleport = tele; res.floors = fl;
const tMax = Math.max(...tele.map(x => x.max)), fMax = Math.max(...fl.map(x => x.max)), miss = tele.concat(fl).reduce((s, x) => s + x.missed72, 0);
res.move = { teleportMax: tMax, floorMax: fMax, missed72: miss, baseMed: res.base.med };
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
console.log('이동', JSON.stringify({ tele, fl }));
ok('순간이동 10번: 이동 뒤 가장 긴 프레임 ≤ 100ms', tMax <= 100, { tMax, each: tele.map(x => x.max) });
ok('층 이동 5번: 화면이 보이는 동안 가장 긴 프레임 ≤ ' + (CPU > 1 ? 120 : 50) + 'ms', fMax <= (CPU > 1 ? 120 : 50), { fMax, each: fl.map(x => x.k + ':' + x.max + '(검은 화면 포함 ' + x.maxAll + ')') });
// 3) 레이: 메뉴를 열고 가운데 칸을 오른손으로 겨눔
res.ray = await ev(async () => { const U = KHXRLayer.ui; U.openMenu(); await F(8); const P = U.panel(); P.updateMatrixWorld(true);
  const cell = U.cells().find(c => c.act) || U.cells()[0], to = U.cellPoint(cell), c = KHEMU.controllers.right, from = new THREE.Vector3(0.15, 1.3, -0.1), loc = KHXRLayer.rig.worldToLocal(to.clone());
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), loc.clone().sub(from).normalize()); c.position.set(from.x, from.y, from.z); c.quaternion.set(q.x, q.y, q.z, q.w);
  { const L = KHEMU.controllers.left, qd = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.3, 0, 0)); L.position.set(-0.2, 1.0, -0.2); L.quaternion.set(qd.x, qd.y, qd.z, qd.w); }   // 왼손은 아래로(메뉴를 같이 가리키지 않게)
  await F(6);
  const ctl = KHXR.renderer.xr.getController(1), ray = ctl.getObjectByName('khxr-ray'), cur = ctl.userData.cursor, o = new THREE.Vector3().setFromMatrixPosition(ctl.matrixWorld), s = KHXRLayer.rig.scale.x;
  const dPanel = o.distanceTo(to), len = ray ? ray.scale.z * s : null, dCur = cur ? o.distanceTo(cur.getWorldPosition(new THREE.Vector3())) : null;
  const r = { visible: !!(ray && ray.visible), len: len && +len.toFixed(3), dPanel: +dPanel.toFixed(3), cursor: !!(cur && cur.visible), dCur: dCur && +dCur.toFixed(3), hover: U.hover(), cell: cell.key }; U.closeMenu(); return r; });
ok('레이: 메뉴 칸에서 끊김(길이 = 맞은 거리 ±2cm)', res.ray.visible && Math.abs(res.ray.len - res.ray.dPanel) < 0.02, res.ray);
ok('커서: 보이고 패널보다 앞(0～2cm)', res.ray.cursor && res.ray.dCur < res.ray.dPanel && res.ray.dPanel - res.ray.dCur < 0.02, res.ray);
// 피규어(패스스루): 모형 바깥은 투명(알파 < 1 화소가 있어야), 모형이 그려진 곳은 보정으로 불투명 → 보정 켠 쪽의 투명 화소 비율이 끈 쪽보다 크지 않아야
await ev(async () => { KHXRLayer.setMode('fig'); await new Promise(r => setTimeout(r, 2500)); await F(10); });
res.figOff = await alpha(false); res.figOn = await alpha(true);
ok('피규어 알파: 바깥은 투명, 모형 안은 보정(투명 비율 끔 ≥ 켬 > 0)', res.figOn && res.figOn.belowPct > 0 && res.figOn.belowPct <= res.figOff.belowPct, { on: res.figOn, off: res.figOff });
await ev(() => KHXRLayer.exit()); await new Promise(r => setTimeout(r, 1500));
res.cursorAfterExit = await ev(() => { let v = false; KHXR.scene.traverse(o => { if (o.name === 'khxr-cursor' && o.visible) v = true; }); return v; });
ok('메뉴 칸 가리킴 강조(hover = 겨눈 칸)', res.ray.hover === res.ray.cell, res.ray);
ok('VR 종료 뒤 커서 없음·페이지 오류 없음', !res.cursorAfterExit && errs.length === 0, errs.slice(0, 3));
res.errors = errs;
fs.writeFileSync(OUT + 'vrfeel.json', JSON.stringify(res, null, 1));
console.log('결과', oks.filter(Boolean).length + '/' + oks.length);
await b.close();
