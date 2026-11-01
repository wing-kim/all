// 케이프혼타워 멀티플레이 시험: 브라우저 여러 개를 띄워 실제 공개 중계망으로 한 방에 모은다
// 사용: (작업 폴더에서 python3 -m http.server 8790 --bind 127.0.0.1 실행 후)
//   cd xr/tests && node mp.mjs [기준주소=http://localhost:8790] [--page=new/3d-model.html]
// A: PC 화면(방장) · B: VR(에뮬레이터) · C: PC 화면 · D: 정원 3명으로 맞춘 늦은 참가자(스스로 나가야 함)
// 인터넷(공개 Nostr 중계망)이 필요하다. 마이크는 크롬 가짜 장치(삐 소리)를 쓴다.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://localhost:8790';
const PAGE = (process.argv.find(a => a.startsWith('--page=')) || '--page=new/3d-model.html').slice(7);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });
const sep = PAGE.includes('?') ? '&' : '?';
const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const args = ['--window-size=1100,720', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'];
const errors = [];
async function open(tag, query) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args });
  const p = await b.newPage(); await p.setViewport({ width: 1100, height: 720 });
  await p.evaluateOnNewDocument(() => performance.setResourceTimingBufferSize(20000));   // 실사 3D 자산이 많아 기본 250개 기록이 넘친다
  p.on('pageerror', e => errors.push(tag + ' pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|WebSocket|relay/i.test(m.text())) errors.push(tag + ' ' + m.text()); });
  // 헤드리스 PC 는 몰입 VR·AR 이 없어 멀티플레이 버튼이 숨으므로 ?mp=1 로 강제로 보인다(에뮬레이터 B 는 없어도 보임)
  await p.goto(BASE + '/' + PAGE + sep + ['mp=1', query].filter(Boolean).join('&'), { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.rig && document.getElementById('khxr-mp'), { timeout: 60000 });
  return { b, p, tag, ev: (fn, ...a) => p.evaluate(fn, ...a) };
}
async function waitFor(w, fn, ms = 30000, ...a) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await w.ev(fn, ...a)) return true; await sleep(300); } return false; }
async function joinVia(w, name) {
  await w.p.click('#khxr-mp');
  await w.p.waitForFunction(() => window.KHMP && document.querySelector('#khmp [data-a=join]'), { timeout: 20000 });
  await w.ev(n => { document.getElementById('khmp-name').value = n; }, name);
  await w.p.click('#khmp [data-a=join]');
  return waitFor(w, () => KHMP.joined || /가득/.test(KHMP.panel.msg), 20000);
}
const W = [];
try {
  /* 1. 누르기 전에는 아무것도 받지 않음 */
  const A = await open('A'); W.push(A);
  await sleep(1500);
  const pre = await A.ev(() => ({ mp: !!window.KHMP, net: performance.getEntriesByType('resource').filter(e => /kh-mp|trystero/.test(e.name)).length, btn: document.getElementById('khxr-mp').textContent }));
  ok('누르기 전: 멀티플레이 모듈·통신 라이브러리를 받지 않음', !pre.mp && pre.net === 0, pre);

  /* 2. A 가 새 방 만들기 */
  const t0 = Date.now();
  ok('A 새 방 만들기', await joinVia(A, '에이'));
  const room = await A.ev(() => KHMP.roomId), url = await A.ev(() => location.href);
  ok('방 링크에 방 코드가 붙음', new URL(url).searchParams.get('room') === room, room);
  const loaded = await A.ev(() => performance.getEntriesByType('resource').filter(e => /kh-mp|trystero/.test(e.name)).map(e => ({ n: e.name.split('/').pop(), kb: Math.round((e.encodedBodySize || e.transferSize) / 1024) })));
  ok('누른 뒤에만 받음(모듈+라이브러리)', loaded.length === 2, loaded);

  /* 3. B(VR 에뮬레이터)·C(PC) 참가 */
  const B = await open('B', 'room=' + room + '&xremu=1'); W.push(B);
  const C = await open('C', 'room=' + room); W.push(C);
  ok('방 링크로 열면 버튼이 참가로 바뀜', await C.ev(r => document.getElementById('khxr-mp').textContent.includes(r), room));
  await Promise.all([joinVia(B, '비'), joinVia(C, '씨')]);
  const all3 = await Promise.all([A, B, C].map(w => waitFor(w, () => KHMP.peers.size === 2 && [...KHMP.peers.values()].every(p => p.since !== Infinity), 45000)));
  ok('셋이 서로 연결됨', all3.every(Boolean), { 초: Math.round((Date.now() - t0) / 1000), 연결: all3 });
  const names = await C.ev(() => [...KHMP.peers.values()].map(p => p.name).sort());
  ok('이름이 전해짐', JSON.stringify(names) === JSON.stringify(['비', '에이']), names);
  const hosts = await Promise.all([A, B, C].map(w => w.ev(() => KHMP.host === (KHMP.me.id) ? 'me' : KHMP.host)));
  const aId = await A.ev(() => KHMP.me.id);
  ok('방장은 먼저 들어온 A', hosts[0] === 'me' && hosts[1] === aId && hosts[2] === aId, hosts);

  /* 4. 아바타: A 카메라 위치에 A 머리 */
  await A.ev(() => { KHXR.camera.position.set(-40, 12, 30); KHXR.controls.target.set(0, 8, 0); KHXR.controls.update(); });
  await sleep(1800);
  const av = await B.ev(id => { const p = KHMP.peers.get(id); const h = p && p.av && p.av.s.h; return h ? { x: +h.x.toFixed(2), y: +h.y.toFixed(2), z: +h.z.toFixed(2), vis: p.av.g.visible } : null; }, aId);
  ok('B 화면에 A 아바타가 A 카메라 자리에 보임', av && av.vis && Math.hypot(av.x + 40, av.y - 12, av.z - 30) < 0.3, av);

  /* 5. 음성: 서로의 음성 흐름과 말소리 크기 */
  const voice = await waitFor(B, () => [...KHMP.peers.values()].every(p => p.audio && p.audio.stream.getAudioTracks().length), 20000);
  await sleep(1500);
  const lv = await B.ev(async () => { const mx = {}; for (let i = 0; i < 8; i++) { KHMP.peers.forEach(p => { mx[p.id] = Math.max(mx[p.id] || 0, KHMP._t.Voice.level(p.id)); }); await new Promise(r => setTimeout(r, 250)); } return Object.values(mx).map(v => +v.toFixed(3)); });   // 가짜 마이크는 끊겼다 울리는 삐 소리라 2초 중 가장 큰 값
  ok('B 가 A·C 음성을 받음(가짜 마이크 소리 크기 > 0)', voice && lv.every(v => v > 0.01), lv);
  const vol = await B.ev(() => [...KHMP.peers.values()].map(p => +p.audio.el.volume.toFixed(2)));
  ok('거리 음량: 멀어도 45% 아래로 줄지 않음', vol.every(v => v >= 0.45 && v <= 1), vol);

  /* 6. 디자인: 방장 A 가 입면 형태를 바꾸면 B·C 도 같아짐 */
  const pick = await A.ev(() => { const r = [...document.querySelectorAll('#panel input[name=form]')].find(i => !i.checked); r.click(); return r.value; });
  const sync = await Promise.all([B, C].map(w => waitFor(w, v => (document.querySelector('#panel input[name=form]:checked') || {}).value === v, 8000, pick)));
  ok('방장 디자인이 B·C 에 맞춰짐(입면 형태)', sync.every(Boolean), pick);
  const pickSw = await A.ev(() => { const b = document.querySelectorAll('#sw-fin button'); const i = [...b].findIndex(x => !(x.classList.contains('on') || x.getAttribute('aria-pressed') === 'true')); b[i].click(); return i; });
  const syncSw = await waitFor(B, i => KHMP.design.swIdx(document.getElementById('sw-fin')) === i, 8000, pickSw);
  ok('마감재 색상도 맞춰짐', syncSw, pickSw);

  /* 7. C 가 직접 바꾸면 따라가기가 꺼지고, 이후 방장 변경은 C 에 적용되지 않음 */
  const cPick = await C.ev(() => { const r = [...document.querySelectorAll('#panel input[name=win]')].find(i => !i.checked); r.click(); return new Promise(ok => setTimeout(() => ok({ v: r.value, following: KHMP.following }), 300)); });   // 직접 바꿨는지는 값 비교 뒤(다음 차례)에 정한다
  ok('C 가 직접 바꾸면 따라가기 꺼짐', cPick.following === false, cPick);
  const aWin = await A.ev(v => { const r = [...document.querySelectorAll('#panel input[name=win]')].find(i => !i.checked && i.value !== v); r.click(); return r.value; }, cPick.v);
  const bGot = await waitFor(B, v => (document.querySelector('#panel input[name=win]:checked') || {}).value === v, 8000, aWin);
  const cWin = await C.ev(() => document.querySelector('#panel input[name=win]:checked').value);
  ok('따라가는 B 만 바뀌고 C 는 그대로', bGot && cWin === cPick.v, { aWin, cWin });

  /* 8. C 가 디자인 보여 주기를 맡으면 A·B 가 C 를 따름 */
  await C.ev(() => KHMP.design.take());
  const cId = await C.ev(() => KHMP.me.id);
  const took = await Promise.all([A, B].map(w => waitFor(w, id => KHMP.host === id && KHMP.following, 8000, cId)));
  const cForm = await C.ev(() => document.querySelector('#panel input[name=form]:checked').value);
  const syncC = await Promise.all([A, B].map(w => waitFor(w, v => (document.querySelector('#panel input[name=win]:checked') || {}).value === v, 8000, cWin)));
  ok('C 가 맡으면 A·B 가 C 디자인으로 맞춰짐', took.every(Boolean) && syncC.every(Boolean), { cWin, cForm });

  /* 9. B: VR 에 들어가 레이저 켜기 → A 에 레이저가 보임, 함께 탭 */
  await B.ev(() => KHXRLayer.enter('vr'));
  await waitFor(B, () => !!KHXR.renderer.xr.getSession(), 15000);
  await sleep(1200);
  const tabs = await B.ev(() => KHXRLayer.ui.tabs());
  ok('VR 메뉴에 함께 탭', tabs.some(t => t.startsWith('함께:')), tabs);
  await B.ev(() => { const c = KHEMU.controllers.right; c.updateButtonValue('thumbstick', 1); });
  await sleep(400);
  await B.ev(() => { KHEMU.controllers.right.updateButtonValue('thumbstick', 0); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.15, 0, 0)); KHEMU.controllers.right.quaternion.set(q.x, q.y, q.z, q.w); });
  const bLaser = await B.ev(() => KHMP.laser);
  ok('B 오른쪽 스틱 누르기로 레이저 켜짐', bLaser);
  const bId = await B.ev(() => KHMP.me.id);
  const seen = await waitFor(A, id => { const L = KHMP._t.Laser.lines.get(id); return L && L.g.visible; }, 8000, bId);
  ok('A 화면에 B 레이저가 보임', seen);
  const bDev = await A.ev(id => KHMP.peers.get(id).dev, bId);
  ok('B 가 VR 로 표시됨', bDev === 'vr', bDev);

  /* 10. 모이기: A 가 부르면 B(VR) 는 A 근처 땅에, C(PC) 카메라는 A 쪽을 봄 */
  await A.ev(() => { KHXR.camera.position.set(-60, 1.7, 40); KHXR.controls.target.set(0, 5, 0); KHXR.controls.update(); });
  await sleep(1200);
  await A.ev(() => KHMP.gather());
  await sleep(2500);
  const bPos = await B.ev(() => { const h = KHXRLayer.xrCam.getWorldPosition(new THREE.Vector3()); return { x: +h.x.toFixed(1), z: +h.z.toFixed(1) }; });
  ok('B 가 A 곁(3m 안)으로 이동', Math.hypot(bPos.x + 60, bPos.z - 40) < 3, bPos);
  await sleep(1500);
  const cCam = await C.ev(id => { const h = KHMP.peers.get(id).pose.h, p = KHXR.camera.position, t = KHXR.controls.target; const f = new THREE.Vector3().subVectors(t, p).setY(0).normalize(), q = new THREE.Quaternion(h[3], h[4], h[5], h[6]), af = new THREE.Vector3(0, 0, -1).applyQuaternion(q).setY(0).normalize(); return { d: +Math.hypot(p.x - h[0], p.z - h[2]).toFixed(2), dot: +f.dot(af).toFixed(2) }; }, aId);
  ok('C 카메라가 A 머리 바로 뒤에서 A 가 보는 쪽을 봄', cCam.d < 3.5 && cCam.dot > 0.9, cCam);

  /* 11. 핑: C 가 장면을 누르면 A 에 표시 */
  await C.ev(() => KHMP.ping([0, 0.2, 0]));
  ok('C 지점 표시가 A 에 보임', await waitFor(A, () => KHMP._t.Ping.list.length > 0, 6000));

  /* 12. VR 성능: 아바타가 늘린 그리기 호출 */
  const calls = await B.ev(() => { const n = []; KHMP.peers.forEach(p => { let k = 0; if (p.av) p.av.g.traverse(o => { if ((o.isMesh || o.isSprite || o.isLine) && o.visible) k++; }); const L = KHMP._t.Laser.lines.get(p.id); if (L && L.g.visible) k += 2; n.push(k); }); return n; });
  ok('아바타 1명당 그리기 8회 이하(머리·눈가리개·몸·양손·이름표·레이저)', calls.every(k => k <= 8), calls);

  /* 13. 정원: 최대 3명으로 맞춘 D 가 들어오면 스스로 나감 */
  const D = await open('D', 'room=' + room + '&mpmax=3'); W.push(D);
  await joinVia(D, '디');
  const full = await waitFor(D, () => !KHMP.joined && /가득/.test(KHMP.panel.msg), 90000);   // 실사 3D 를 켠 무거운 화면 넷이면 인사가 늦게 모인다
  ok('정원을 넘긴 늦은 참가자는 스스로 나감', full, await D.ev(() => ({ msg: KHMP.panel.msg, joined: KHMP.joined, me: KHMP.me && KHMP.me.since, peers: [...KHMP.peers.values()].map(p => [p.name, p.since]) })));
  const back = await waitFor(A, () => KHMP.peers.size === 2, 20000);
  ok('A 참가자 수는 다시 2명(B·C)', back, await A.ev(() => KHMP.peers.size));

  /* 14. 나가기 */
  await C.ev(() => KHMP.leave());
  ok('C 가 나가면 A·B 에서 사라짐', (await Promise.all([A, B].map(w => waitFor(w, id => !KHMP.peers.has(id), 20000, cId)))).every(Boolean));
  await A.p.screenshot({ path: OUT + 'mp-A.png' });
  ok('페이지 오류 없음', errors.length === 0, errors.slice(0, 5));
} catch (e) {
  ok('시험 진행', false, e.message);
} finally {
  await Promise.all(W.map(w => w.b.close().catch(() => {})));
}
const fail = results.filter(r => !r.pass).length;
console.log(`\n${results.length - fail}/${results.length} 통과`);
fs.writeFileSync(OUT + 'mp-results.json', JSON.stringify(results, null, 1));
process.exit(fail ? 1 : 0);
