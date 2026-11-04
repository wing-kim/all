// VR 기능 대응표 자동 대조(1102.s): node vrmatrix.mjs [기준주소=http://localhost:8790]
// 화면(Wing 설정 패널·위쪽 버튼 줄)의 조작 항목(라디오·체크·슬라이더·버튼)을 모두 뽑고, IWER(Quest 3 흉내)로 VR 에 들어가 메뉴의 모든 탭(건물 밖·안)을
// 훑어 같은 일을 하는 칸이 있는지 맞춘다. 결과: VR 됨 / VR 대체 조작 / VR 안 됨(이유). 이유가 정해지지 않은 '안 됨'이 있으면 실패한다.
// 결과 파일: out/vrmatrix.json, ../../docs/vr-feature-matrix.md(표)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import CHROME from '../../photoreal/tests/chrome.mjs';
const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://localhost:8790';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)), DOC = fileURLToPath(new URL('../../docs/vr-feature-matrix.md', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
// 화면 조작 → VR 대체 조작(같은 결과를 VR 방식으로) 또는 안 되는 이유. 키: 'b:버튼글자', 'c:체크 id', 'r:이름:값', 'g:슬라이더 id'
const ALT = {
  'b:내부 보기': ['대체', "VR 메뉴 '건물 안으로 (1층)' + 층 목록(lv:)"],
  'b:외부로 나가기': ['대체', "VR 메뉴 '건물 밖으로'"],
  'b:정면': ['대체', '순간이동(트리거로 바닥 가리키기)·출입구 바로가기. VR 은 사람이 그 자리에 서므로 정해진 카메라 시점 대신 이동'],
  'b:배치 (위)': ['대체', "VR '피규어'(손 위 모형) 모드로 위에서 보기"],
  'b:층 단면 보기': ['대체', '층 목록(lv:)으로 그 층에 바로 들어감. 단면 바닥 누르기 = 층 이동 + 순간이동'],
  'b:종단면 전체': ['대체', "VR 메뉴 '단면'(건물 안에서 #secAllBtn)"],
  'b:현재 화면 이미지로 저장': ['안 됨', '퀘스트 시스템 캡처(Meta 버튼 + 트리거)로 대신. 페이지 저장 기능은 VR 화면을 받을 수 없다(WebXR 프레임버퍼 읽기 불가)'],
  'r:vmode:photo': ['대체', "VR 메뉴 '실사 사진'(Photo.items, 사진을 VR 안 판으로 띄움)"],
  'r:vmode:render': ['안 됨', "Wing v107 이 '렌더(이전)'를 숨김(화면에도 안 보임)"],
  'c:t-labels': ['안 됨', 'VR 은 글자 라벨 대신 손목 메뉴의 층·공간 이름을 씀(라벨 판이 많으면 그리기 호출 예산 초과)'],
  'c:t-hq': ['안 됨', '고품질 렌더(1.6배 초표본)는 VR 프레임 예산(72fps)과 맞지 않아 VR 에서 쓰지 않음'],
  'c:t-ao': ['안 됨', '화면 공간 그림자(SSAO)는 VR 합성기 밖이라 VR 에서 쓰지 않음(VR 은 구운 빛 사용)'],
  'c:t-cxlab': ['안 됨', '주변 건물 이름 라벨: 위 라벨과 같은 이유'],
  'r:vwm:auto': ['해당 없음', '화면 배치(모바일/PC) 선택: VR 은 화면 배치가 없음'], 'r:vwm:mob': ['해당 없음', '화면 배치 선택: VR 은 화면 배치가 없음'], 'r:vwm:pc': ['해당 없음', '화면 배치 선택: VR 은 화면 배치가 없음'],
  'b:이 날짜·시각으로 보기': ['대체', "VR '시각' 슬라이더는 놓으면 바로 적용(적용 단추가 따로 없음)"],
  'b:펼치기 ▾': ['해당 없음', '화면 패널 접기·펼치기: VR 은 손목 메뉴'], 'b:라벨': ['안 됨', '글자 라벨 켜기(c:t-labels 와 같은 이유)'], 'b:메뉴 ▴': ['대체', "VR 손목 메뉴(왼쪽 스틱 누르기)"], 'b:설정 숨기기 ▸': ['해당 없음', '화면 설정 패널 숨기기: VR 은 손목 메뉴'],
};
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(BASE + '/new/3d-model.html?xremu=1&pr=1&prsw=0', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHXRLayer && KHXRLayer.support && window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.warm != null && !(window.KHENV && KHENV.busy), { timeout: 240000 });
// 1) 화면 조작 목록(보이는 것 + Wing 이 숨긴 것 따로)
const page = await p.evaluate(() => {
  const vis = e => !!e && !(e.disabled || (e.querySelector && e.querySelector('input:disabled'))) && e.getClientRects().length > 0 && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden';
  const txt = e => { const l = e.closest('label'); return ((l ? l.textContent : e.textContent) || e.title || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40); };
  const out = [], panel = document.getElementById('panel') || document.querySelector('aside');
  panel.querySelectorAll('input').forEach(i => { if (i.type === 'radio') out.push({ key: 'r:' + i.name + ':' + i.value, label: txt(i), vis: vis(i.closest('label') || i) }); else if (i.type === 'checkbox' && i.id) out.push({ key: 'c:' + i.id, label: txt(i), vis: vis(i.closest('label') || i) }); else if (i.type === 'range' && i.id) out.push({ key: 'g:' + i.id, label: txt(i) || i.id, vis: vis(i) }); });
  panel.querySelectorAll('button').forEach(e => { if (e.closest('label')) return; const t = txt(e); if (t) out.push({ key: 'b:' + t, id: e.id, label: t, vis: vis(e), pb: true }); });
  document.querySelectorAll('button').forEach(e => { if (panel.contains(e) || e.closest('#khxr-bar,#pr-panel,.pr-panel')) return; const t = txt(e); if (t && vis(e) && !/^[▲▼◀▶▴]$/.test(t)) out.push({ key: 'b:' + t, id: e.id, label: t, vis: true, top: true }); });
  const seen = new Set(); return out.filter(x => !seen.has(x.key) && seen.add(x.key));
});
// 2) VR 메뉴 칸(밖·안 모두, 모든 탭)
const enter = await p.evaluate(async () => { await KHXRLayer.enter('vr'); const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 30; i++) await new Promise(r => s.requestAnimationFrame(() => r())); return !!s; });
const menuCells = async () => p.evaluate(async () => { const U = KHXRLayer.ui, s = KHXR.renderer.xr.getSession(), fr = n => (async () => { for (let i = 0; i < n; i++) await new Promise(r => s.requestAnimationFrame(() => r())); })();
  U.openMenu(); await fr(5); const out = []; const tabs = U.tabs(); for (let i = 0; i < tabs.length; i++) { U.setTab(i); await fr(4); U.cells().forEach(c => out.push({ key: c.key, label: c.label || '', tab: tabs[i] })); } return out; });
const cOut = enter ? await menuCells() : [];
await p.evaluate(async () => { KHXRLayer.goInside(); const s = KHXR.renderer.xr.getSession(); for (let i = 0; i < 60; i++) await new Promise(r => s.requestAnimationFrame(() => r())); });
const cIn = enter ? await menuCells() : [];
const cells = [...cOut, ...cIn], ck = new Set(cells.map(c => c.key)), cl = cells.map(c => c.label);
// 3) 대조
const rows = page.map(x => {
  let st = null, how = '';
  if (ck.has(x.key)) { st = '됨'; how = 'VR 메뉴 ' + cells.find(c => c.key === x.key).tab; }
  else if (x.key.startsWith('g:') && cells.some(c => c.key.startsWith(x.key) || c.key === 'sl:' + x.key.slice(2))) { st = '됨'; how = 'VR 메뉴 ' + cells.find(c => c.key.startsWith(x.key) || c.key === 'sl:' + x.key.slice(2)).tab + '(정해진 값 단추·슬라이더)'; }
  else if (x.id && ck.has('b:' + x.id)) { st = '됨'; how = 'VR 메뉴 ' + cells.find(c => c.key === 'b:' + x.id).tab; }
  else if (x.pb && cl.some(l => l && l.replace(/\s/g, '') === x.label.replace(/\s/g, ''))) { st = '됨'; how = 'VR 메뉴(같은 이름 버튼)'; }
  else if (ALT[x.key]) { st = ALT[x.key][0]; how = ALT[x.key][1]; }
  else if (!x.vis) { st = '해당 없음'; how = '화면에서도 지금 조합에서는 숨김·비활성(Wing 이 조건에 따라 보임. VR 메뉴도 같은 조건으로 나타남)'; }
  else { st = '안 됨'; how = '(이유 미정)'; }
  return { ...x, st, how };
});
const cnt = k => rows.filter(r => r.st === k).length, visRows = rows.filter(r => r.st !== '해당 없음');
const res = { at: new Date().toISOString(), page: page.length, vrCells: ck.size, ok: cnt('됨'), alt: cnt('대체'), no: cnt('안 됨'), na: cnt('해당 없음'), unexplained: rows.filter(r => r.how === '(이유 미정)').map(r => r.key + ' ' + r.label), rows, errs };
fs.writeFileSync(OUT + 'vrmatrix.json', JSON.stringify(res, null, 1));
const md = ['# VR 기능 대응표 (자동 대조, ' + res.at.slice(0, 10) + ')', '',
  '`xr/tests/vrmatrix.mjs` 가 화면(Wing 설정 패널과 위쪽 버튼 줄)의 조작 항목을 모두 뽑아, Quest 3 흉내로 VR 에 들어가 메뉴의 모든 탭(건물 밖·안)과 맞춘 결과입니다. 판정: 됨(같은 칸이 VR 메뉴에 있음), 대체(VR 방식의 다른 조작으로 같은 결과), 안 됨(이유), 해당 없음(지금 조합에서 화면에도 숨김).', '',
  `화면 조작 ${res.page}개(보이는 것 ${visRows.length}개) · VR 메뉴 칸 ${res.vrCells}개 · 됨 ${res.ok} · 대체 ${res.alt} · 안 됨 ${res.no} · 해당 없음 ${res.na}. VR 반영률(됨+대체, 보이는 것 기준) ${Math.round((res.ok + res.alt) / Math.max(1, visRows.length) * 100)}%.`, '',
  '실기기 퀘스트에서만 확인되는 것(흉내로는 잴 수 없음): 72fps 유지, 탭 메모리(브라우저가 탭을 다시 여는지), 멀티플레이 음성 에코와 3명 이상 접속. `docs/device-checklist.md` 의 퀘스트 항목을 봅니다.', '',
  '| 화면 조작 | 키 | 판정 | VR 에서 |', '|---|---|---|---|',
  ...rows.filter(r => r.st !== '해당 없음').map(r => `| ${r.label.replace(/\|/g, '/')} | \`${r.key}\` | ${r.st} | ${r.how.replace(/\|/g, '/')} |`), '',
  '해당 없음(지금 조합에서 화면에도 숨김) ' + res.na + '개는 표에서 뺐습니다. 전체 목록은 `xr/tests/out/vrmatrix.json`.'];
fs.writeFileSync(DOC, md.join('\n') + '\n');
const pass = enter && res.unexplained.length === 0 && errs.length === 0;
console.log(JSON.stringify({ page: res.page, vis: visRows.length, vrCells: res.vrCells, ok: res.ok, alt: res.alt, no: res.no, na: res.na, unexplained: res.unexplained, errs: errs.slice(0, 3) }));
console.log(pass ? 'PASS' : 'FAIL', 'VR 기능 대응표: 이유 없는 \'안 됨\' 0');
console.log(`\n${pass ? 1 : 0}/1 통과`);   // qa.mjs 가 읽는 결과 줄
await b.close(); process.exit(pass ? 0 : 1);
