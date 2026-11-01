// 자체 점검 한 번에 돌리기: node photoreal/tests/qa.mjs [--quick] [--only=묶음,…] [--accept="기준 화면 갱신 사유"] [--base=주소]
// - 작업 폴더를 스스로 띄운 로컬 서버(빈 포트)로 연다(--base 를 주면 그 주소).
// - 묶음: reg(기존 회귀 시험 전부), budget(성능 예산), quality(화질 자동 판정), shots(기준 화면 비교), ui(겹침·숨김 규칙·콘솔 오류)
// - --quick: 오래 걸리는 mp·options·net·sw·휴대폰 성능을 뺀다(약 15분). 전체는 약 60분.
// - 결과: docs/qa/report.md(사람용), docs/qa/history/<시각>.json(기록). 직전 기록과 비교해 나빠진 항목에 '악화'를 붙인다.
// - 기준 화면: docs/qa/baseline/*.jpg. --accept 를 주면 이번 화면으로 갱신하고 사유를 docs/qa/baseline/CHANGES.md 에 남긴다.
// - 불안정 항목(mp 공개 중계망, 네트워크 시간)은 정해진 횟수만큼 다시 돌리고 보고서에 '불안정'으로 표시한다.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..'), XRT = path.join(ROOT, 'xr/tests'), QA = path.join(ROOT, 'docs/qa');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const QUICK = !!arg('quick'), ONLY = arg('only') ? new Set(String(arg('only')).split(',')) : null, ACCEPT = arg('accept');
const want = g => !ONLY || ONLY.has(g);
fs.mkdirSync(path.join(QA, 'history'), { recursive: true }); fs.mkdirSync(path.join(QA, 'baseline'), { recursive: true });

/* ---------- 기준값(계획 문서 docs/goal-gap-plan.md 의 기준) ---------- */
const TH = {
  pcCalls: 1000, pcFps: 60, phoneLowCalls: 400, vrCalls: 170, vrCap: 200, vrTris: 1e6, vrFig: 200, texMB: 150, prefetchMB: 18, first10: 12000, revisit10: 3000,
  floorHi: 1.0, allHi: 2.0, satPct: 1.0, ceilBlack: 5.0, nightRatio: 1.0, sunset: -20, ctxSpread: 2.0, leafCV: 0.40, shotDiff: 4.0, shotBig: 3.0,
};
const items = [];   // { group, name, value, limit, pass, note, unstable, key }
const add = (group, name, value, pass, limit = '', note = '', extra = {}) => { items.push({ group, name, value, limit, pass: pass === null ? null : !!pass, note, key: group + ':' + name, ...extra }); console.log((pass === null ? '정보' : pass ? '합격' : '불합격'), group, name, typeof value === 'object' ? JSON.stringify(value) : value, limit ? '(기준 ' + limit + ')' : '', note); };

/* ---------- 서버 ---------- */
let BASE = arg('base'), server = null;
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const LOG = path.join(HERE, 'out', 'qa-server.log');
if (!BASE) {
  const port = await freePort(); fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
  const lf = fs.openSync(LOG, 'w');
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', lf, lf] });
  BASE = 'http://127.0.0.1:' + port;
  for (let i = 0; i < 50; i++) { try { const r = await fetch(BASE + '/new/3d-model.html', { method: 'HEAD' }); if (r.ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 200)); }
}
console.log('점검 주소', BASE, QUICK ? '(빠른 점검)' : '(전체 점검)');

/* ---------- 시험 실행 ---------- */
function run(cwd, file, args = [], env = {}, ms = 30 * 60e3) {
  return new Promise(res => {
    const t0 = Date.now(), p = spawn('node', [file, ...args], { cwd, env: { ...process.env, BASE, ...env } }); let out = '';
    p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { out += d; });
    const to = setTimeout(() => { p.kill('SIGKILL'); out += '\n[시간 초과]'; }, ms);
    p.on('close', code => { clearTimeout(to); res({ out, code, sec: Math.round((Date.now() - t0) / 1000) }); });
  });
}
const frac = out => { const m = [...out.matchAll(/(?:결과\s+(\d+)\/(\d+))|(?:(\d+)\/(\d+)\s*통과)/g)].pop(); return m ? (m[1] ? [+m[1], +m[2]] : [+m[3], +m[4]]) : null; };
const fails = out => out.split('\n').filter(l => /^FAIL/.test(l)).map(l => l.slice(0, 160));
async function regTest(name, cwd, file, args, env, retry = 0) {
  let r, n = 0, f;
  do { r = await run(cwd, file, args, env); f = frac(r.out); n++; } while ((!f || f[0] !== f[1]) && n <= retry);
  const pass = f && f[0] === f[1];
  add('reg', name, f ? f[0] + '/' + f[1] : '실행 실패', pass, '전부 통과', (pass ? '' : fails(r.out).slice(0, 2).join(' / ')) + (n > 1 ? ` (재시도 ${n - 1}회)` : ''), { unstable: retry > 0, sec: r.sec, tries: n });
  return r;
}
const readJ = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };

/* ---------- 1. 회귀 시험 ---------- */
if (want('reg')) {
  await regTest('smoke', XRT, 'smoke.mjs', [BASE]);
  await regTest('compat', XRT, 'compat.mjs', [BASE]);
  await regTest('ux', XRT, 'ux.mjs', [BASE]);
  await regTest('ux pr=1', XRT, 'ux.mjs', [BASE, '--page=new/3d-model.html?pr=1'], {}, 1);   // 계단 걷기가 셰이더 준비로 한 프레임 멈추면 두 단을 건너뛴다(한 번 재시도)
  if (!QUICK) await regTest('mp', XRT, 'mp.mjs', [BASE], {}, 2);   // 공개 중계망(Nostr) 타이밍: 두 번까지 재시도
  for (const t of ['mobile', 'perfui', 'opt', 'ctxloss', 'quality']) await regTest(t, HERE, t + '.mjs');
  if (!QUICK) {
    const r = await run(HERE, 'options.mjs'); const o = readJ(path.join(HERE, 'out/options.json'));
    const s = o && o.summary;
    add('reg', 'options 164', s ? `${s.states}개, 오류 상태 ${s.errorStates}, 미변환 최대 ${s.maxUnconverted}` : '실행 실패', s && s.errorStates === 0 && s.maxUnconverted <= 5, '오류 0, 미변환 ≤ 5', '', { sec: r.sec });
  }
}

/* ---------- 2. 성능 예산 ---------- */
if (want('budget')) {
  await run(HERE, 'perf.mjs', ['pc']); const pc = readJ(path.join(HERE, 'out/perf-pc.json'));
  if (pc) { const ext = ['pr_ext_glass', 'pr_ext_brick', 'pr_ext_stack', 'pr_ext_colonnade', 'pr_ext_sunset', 'pr_ext_night'].map(k => pc[k]).filter(Boolean);
    add('budget', '화면 외관 그리기 호출(최대)', Math.max(...ext.map(e => e.calls)), Math.max(...ext.map(e => e.calls)) < TH.pcCalls, '< ' + TH.pcCalls);
    add('budget', '화면 외관 fps(이동, 최소)', Math.min(...ext.map(e => e.fps)), Math.min(...ext.map(e => e.fps)) >= TH.pcFps, '≥ ' + TH.pcFps, '맥 GPU 기준(실기기 아님). 다른 앱의 CPU·GPU 사용에 크게 흔들린다', { unstable: true });
    add('budget', '화면 외관 정지 fps', pc.pr_ext_glass_still && pc.pr_ext_glass_still.fps, null, '', '정보(측정마다 54～70)');
    add('budget', '화면 실내 그리기 호출 1F·B1·B3', ['pr_1F', 'pr_B1', 'pr_B3'].map(k => pc[k] && pc[k].calls).join('·'), null);
    add('budget', '화면 삼각형(외관 이동)', pc.pr_ext_glass && pc.pr_ext_glass.tris, null); }
  if (!QUICK) { await run(HERE, 'perf.mjs', ['mobile'], { QS: 'prq=low' }); const mo = readJ(path.join(HERE, 'out/perf-mobile.json'));
    if (mo && mo.pr_ext_glass) add('budget', '휴대폰 흉내 낮음 외관 그리기 호출', mo.pr_ext_glass.calls, mo.pr_ext_glass.calls < TH.phoneLowCalls, '< ' + TH.phoneLowCalls, `fps ${mo.pr_ext_glass.fps}(맥 GPU)`); }
  await run(HERE, 'xr.mjs'); const xr = readJ(path.join(HERE, 'out/xr.json'));
  if (xr) { const ext = Object.entries(xr).filter(([k, v]) => /^ext_/.test(k) && v && v.calls).map(([, v]) => v), int = Object.entries(xr).filter(([k, v]) => /^int_/.test(k) && v && v.calls).map(([, v]) => v);
    const mc = Math.max(...ext.map(e => e.calls)), mi = Math.max(...int.map(e => e.calls)), mt = Math.max(...ext.map(e => e.tris));
    add('budget', 'VR 외관 그리기 호출(최대, IWER)', mc, mc <= TH.vrCalls, '≤ ' + TH.vrCalls);
    add('budget', 'VR 실내 그리기 호출(최대)', mi, mi <= TH.vrCap, '≤ ' + TH.vrCap);
    add('budget', 'VR 외관 삼각형(최대)', mt, mt <= TH.vrTris, '≤ 1,000,000'); }
  const cp = readJ(path.join(XRT, 'out/compat.json'));
  if (cp) { const p8 = cp.find(x => /^P8/.test(x.n)); const c = p8 && p8.d && p8.d.fig && p8.d.fig.calls; add('budget', 'VR 가상 방 피규어 그리기 호출(compat P8)', c != null ? c : '없음', c != null && c < TH.vrFig, '< ' + TH.vrFig, want('reg') ? '' : '직전 compat 결과'); }
  const pf = readJ(path.join(ROOT, 'photoreal/prefetch.json')); if (pf) add('budget', '미리받기 목록', +(pf.bytes / 1e6).toFixed(2) + 'MB', pf.bytes / 1e6 <= TH.prefetchMB, '≤ ' + TH.prefetchMB + 'MB');
  if (!QUICK) {
    // 10Mbps 첫 방문: 로컬 서버(gzip 없음). 네트워크 시간은 흔들리므로 두 번 재서 작은 값
    const fr = []; for (let i = 0; i < 2; i++) { await run(HERE, 'net.mjs', ['4g']); const n = readJ(path.join(HERE, 'out/net-4g.json')); if (n) fr.push(n); }
    if (fr.length) { const best = fr.reduce((a, b) => a.allReadyMs < b.allReadyMs ? a : b); add('budget', '10Mbps 첫 방문 전체 준비', best.allReadyMs + 'ms', best.allReadyMs <= TH.first10, '≤ ' + TH.first10 + 'ms', `받은 양 ${best.MB}MB, 두 번 중 작은 값(${fr.map(x => x.allReadyMs).join('·')}), 로컬 서버(gzip 없음)`, { unstable: true }); }
    await run(HERE, 'sw.mjs', [], { LOG }); const sw = readJ(path.join(HERE, 'out/sw.json'));
    if (sw && sw.visits && sw.visits[2]) add('budget', '10Mbps 재방문 전체 준비(서비스 워커)', sw.visits[2].allReadyMs + 'ms', sw.visits[2].allReadyMs <= TH.revisit10, '≤ ' + TH.revisit10 + 'ms', `네트워크 ${sw.visits[2].netMB}MB`, { unstable: true });
  }
}

/* ---------- 3. 화질·4. 기준 화면·5. UI (qmetrics 한 번) ---------- */
if (want('quality') || want('shots') || want('ui') || want('budget')) {
  const only = [want('quality') && 'flicker,alias,still', want('shots') && 'base', want('ui') && 'ui', want('budget') && 'mem'].filter(Boolean).join(',');
  await run(HERE, 'qmetrics.mjs', [], { ONLY: only }, 40 * 60e3);
  const q = readJ(path.join(HERE, 'out/qmetrics.json')) || {};
  if (want('budget') && q.mem) add('budget', '텍스처 GPU 메모리 추정', q.mem.MB + 'MB', q.mem.MB <= TH.texMB, '≤ ' + TH.texMB + 'MB', `고유 텍스처 ${q.mem.textures}장`);
  if (want('quality') && q.flicker) {
    let worstF = { v: 0 }, worstA = { v: 0 };
    for (const [k, r] of Object.entries(q.flicker)) { for (const b of ['near', 'mid', 'far']) if (r[b] && r[b].hiPct > worstF.v) worstF = { v: r[b].hiPct, k: k + ' ' + b }; if (r.all && r.all.hiPct > worstA.v) worstA = { v: r.all.hiPct, k }; }
    add('quality', '바닥 깜빡임(강하게 바뀐 화소 %, 최악)', worstF.v, worstF.v <= TH.floorHi, '≤ ' + TH.floorHi + '%', worstF.k + ' · 구성: 화면·휴대폰(배율 3)·퀘스트 한 눈(916×960×2, 시야 97°)·낮은 시점');
    add('quality', '화면 전체 깜빡임(최악)', worstA.v, worstA.v <= TH.allHi, '≤ ' + TH.allHi + '%', worstA.k);
    for (const [k, r] of Object.entries(q.flicker)) add('quality', '깜빡임 ' + k, ['near', 'mid', 'far'].map(b => r[b] ? r[b].hiPct : '-').join(' / ') + ' · 전체 ' + (r.all ? r.all.hiPct : '-'), null, '', '가까움/중간/멂 %');
  }
  if (want('quality') && q.alias) for (const [k, r] of Object.entries(q.alias)) add('quality', '앨리어싱 ' + k, ['near', 'mid', 'far'].map(b => r[b] ? r[b].hiPct : '-').join(' / '), null, '', '1배 대 4배 초표본, 바닥 고주파 차 8 넘는 화소 %(정보)');
  if (want('quality') && q.still && q.still.derived) { const d = q.still.derived;
    add('quality', '포화 화소(최대)', d.satMaxPct + '%', d.satMaxPct <= TH.satPct, '≤ ' + TH.satPct + '%');
    add('quality', '실내 천장 검은 구멍(최대)', d.ceilBlackMaxPct + '%', d.ceilBlackMaxPct <= TH.ceilBlack, '≤ ' + TH.ceilBlack + '%', '천장(아래를 보는 면) 중 휘도 14 미만');
    add('quality', '석양 처마 밑 검은 면', d.soffitBlackSunsetPct + '%', null, '', '정보: 바깥에서 본 아래 보는 면');
    add('quality', '야간 우리 건물 / 이웃 휘도', d.nightOursOverCtx, d.nightOursOverCtx >= TH.nightRatio, '≥ ' + TH.nightRatio);
    add('quality', '석양 대 오후 화면 휘도', d.sunsetVsPm + '%', d.sunsetVsPm <= TH.sunset, '≤ ' + TH.sunset + '%', `건물+지면 ${d.sunsetVsPmBldGround}%`);
    add('quality', '주변 건물 명도 편차(조감 p90/p10)', d.ctxSpread, d.ctxSpread >= TH.ctxSpread, '≥ ' + TH.ctxSpread);
    add('quality', '잎 휘도 변동계수(앞뒤 색 차)', d.leafCV, d.leafCV <= TH.leafCV, '≤ ' + TH.leafCV, '수정 전(?praa=0) 0.45');
  }
  if (want('shots') && q.shots) {
    const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' }); const p = await b.newPage();
    const changes = [];
    for (const f of q.shots) {
      const cur = path.join(HERE, 'out', f), base = path.join(QA, 'baseline', path.basename(f));
      if (!fs.existsSync(base) || ACCEPT) { fs.copyFileSync(cur, base); add('shots', path.basename(f), ACCEPT ? '기준 갱신' : '기준 새로 만듦', true, '', ACCEPT ? String(ACCEPT) : ''); changes.push(path.basename(f)); continue; }
      const u = x => 'data:image/jpeg;base64,' + fs.readFileSync(x).toString('base64');
      const r = await p.evaluate(async (a, c) => { const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; }); const [I, J] = await Promise.all([ld(a), ld(c)]);
        const w = 480, h = Math.round(I.height * w / I.width), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(I, 0, 0, w, h); const A = g.getImageData(0, 0, w, h).data; g.drawImage(J, 0, 0, w, h); const B = g.getImageData(0, 0, w, h).data;
        let s = 0, big = 0; for (let i = 0; i < A.length; i += 4) { const d = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; s += d; if (d > 40) big++; } return { mean: +(s / (w * h)).toFixed(2), big: +(big / (w * h) * 100).toFixed(2) }; }, u(base), u(cur));
      add('shots', path.basename(f), `평균 차 ${r.mean}, 큰 차 ${r.big}%`, r.mean <= TH.shotDiff && r.big <= TH.shotBig, `≤ ${TH.shotDiff} · ≤ ${TH.shotBig}%`, r.mean > TH.shotDiff || r.big > TH.shotBig ? '의도한 변경이면 --accept="사유"로 기준 갱신' : '');
    }
    if (ACCEPT && changes.length) fs.appendFileSync(path.join(QA, 'baseline/CHANGES.md'), `- ${new Date().toISOString().slice(0, 16)} ${changes.join(', ')}: ${ACCEPT}\n`);
    await b.close();
  }
  if (want('ui') && q.ui) for (const dev of Object.keys(q.ui)) { const u = q.ui[dev];
    const known = /kapehorn-media\/catalog\.js|favicon\.ico/;   // 로컬 서버에만 없는 파일(Wing 이 저장소 밖 미디어 목록을 부른다, 공개 주소에서는 확인 필요)
    add('ui', dev + ' 겹침', u.overlaps.length ? u.overlaps.join(', ') : '없음', !u.overlaps.length);
    add('ui', dev + ' 숨김 규칙(멀티플레이·성능 정보)', `mp ${u.mpBtn ? '보임' : '숨김'} · fps ${u.fps ? '보임' : '숨김'} · 시간 줄 ${u.statVisible ? '보임' : '숨김'} · VR 판 ${u.xrFps ? '켜짐' : '꺼짐'}`, !u.mpBtn && !u.fps && !u.statVisible && !u.xrFps, '모두 숨김');
    const bad = u.http4xx.filter(x => !known.test(x));
    add('ui', dev + ' 콘솔 오류', u.errors.length + '건' + (bad.length ? ', 4xx ' + bad.join(' ') : ''), !u.errors.length && !bad.length, '0', u.http4xx.length - bad.length ? '알려진 4xx(로컬 전용): ' + u.http4xx.filter(x => known.test(x)).join(' ') : '');
  }
  if (q.errors && q.errors.filter(e => !/catalog\.js|favicon|Failed to load resource/.test(e)).length) add('ui', '측정 중 페이지 오류', q.errors.filter(e => !/catalog\.js|favicon|Failed to load resource/.test(e)).slice(0, 3).join(' / '), false, '0');
}

/* ---------- 보고서 ---------- */
if (server) server.kill();
const hist = fs.readdirSync(path.join(QA, 'history')).filter(f => f.endsWith('.json')).sort();
const prev = hist.length ? readJ(path.join(QA, 'history', hist[hist.length - 1])) : null;
const num = v => { const m = String(v).match(/-?[\d.]+/); return m ? +m[0] : null; };
// 나빠짐 판단: 합격 → 불합격, 또는 같은 항목 수치가 기준 쪽으로 10% 넘게 나빠짐(작을수록 좋은 항목은 증가, 클수록 좋은 항목은 감소)
const higherBetter = /fps|휘도 \/|편차/;
for (const it of items) { const pv = prev && prev.items.find(x => x.key === it.key); if (!pv) continue; it.prev = pv.value;
  if (pv.pass === true && it.pass === false) it.worse = true;
  else { const a = num(pv.value), c = num(it.value); if (a != null && c != null && a !== 0 && it.pass !== null && !/^\d+\/\d+$/.test(String(it.value))) { const ch = (c - a) / Math.abs(a); if (higherBetter.test(it.name) ? ch < -0.1 : ch > 0.1) it.worse = true; } } }
const at = new Date(), stamp = at.toISOString().replace(/[:T]/g, '-').slice(0, 16);
const rec = { at: at.toISOString(), base: BASE, quick: QUICK, only: ONLY ? [...ONLY] : null, items };
fs.writeFileSync(path.join(QA, 'history', stamp + '.json'), JSON.stringify(rec, null, 1));
const P = items.filter(i => i.pass === true).length, F = items.filter(i => i.pass === false), W = items.filter(i => i.worse);
const G = { reg: '회귀 시험', budget: '성능 예산', quality: '화질 자동 판정', shots: '기준 화면 비교', ui: 'UI 점검' };
let md = `# 자체 점검 보고서\n\n실행 ${at.toISOString().slice(0, 16).replace('T', ' ')} UTC · ${QUICK ? '빠른 점검' : '전체 점검'}${ONLY ? ' · 묶음 ' + [...ONLY].join(',') : ''} · 주소 ${BASE}\n\n`;
md += `**합격 ${P} · 불합격 ${F.length} · 정보 ${items.filter(i => i.pass === null).length}** · 직전 기록 대비 악화 ${W.length}${prev ? ` (직전 ${prev.at.slice(0, 16).replace('T', ' ')})` : ' (첫 기록)'}\n\n`;
md += '실행: `node photoreal/tests/qa.mjs` (빠른 점검 `--quick`, 일부 `--only=reg,budget,quality,shots,ui`, 의도한 화면 변경 뒤 `--accept="사유"`). 불합격 사유와 실기기 확인 필요 여부는 `docs/qa/notes.md`.\n\n';
if (F.length) md += '## 불합격\n\n' + F.map(i => `- [${G[i.group]}] ${i.name}: ${i.value}${i.limit ? ' (기준 ' + i.limit + ')' : ''}${i.note ? ' · ' + i.note : ''}`).join('\n') + '\n\n';
if (W.length) md += '## 직전보다 나빠진 항목\n\n' + W.map(i => `- ${i.name}: ${i.prev} → ${i.value}`).join('\n') + '\n\n';
for (const g of Object.keys(G)) { const L = items.filter(i => i.group === g); if (!L.length) continue;
  md += `## ${G[g]}\n\n| 항목 | 값 | 기준 | 판정 | 직전 | 비고 |\n|---|---|---|---|---|---|\n`;
  md += L.map(i => `| ${i.name} | ${String(i.value).replace(/\|/g, '/')} | ${i.limit} | ${i.pass === null ? '정보' : i.pass ? '합격' : '**불합격**'}${i.worse ? ' **악화**' : ''}${i.unstable ? ' (불안정)' : ''} | ${i.prev != null ? String(i.prev).replace(/\|/g, '/') : ''} | ${String(i.note || '').replace(/\|/g, '/')} |`).join('\n') + '\n\n'; }
fs.writeFileSync(path.join(QA, 'report.md'), md);
console.log(`\n보고서 docs/qa/report.md · 합격 ${P} · 불합격 ${F.length} · 악화 ${W.length}`);
process.exit(0);
