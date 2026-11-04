// 세 탭 × 보기 방식 원본 비교(1102.s): node tabmodes.mjs [우리 기준주소] [원본 HTML 경로]
// 원본 = Wing v107 + 지니 env_detail 단일 HTML(파일로 염). 우리 = new/3d-model.html.
// 탭(현황 now·신축 new·③ 실측 srv) × 보기 방식을 같은 시점에서 찍어 화면 차를 잰다.
//  - 스케치업(sketch): 원본과 같아야 함(우리 [PR] 접점의 의도한 차이만 남음)
//  - 렌더(이전)(render, 숨김): 원본과 같아야 함
//  - 렌더(real): 원본은 지니 렌더-실사 레이어, 우리는 실사 3D(KHPRLayer). 의도한 차이라 참고 수치만 남기고 실사 3D 가 켜졌는지만 합격 조건
//  - 실사(photo): Wing 사진 보기. 원본과 같아야 함
// 결과: out/tabmodes/<탭>-<방식>-{orig,ours,diff}.png, out/tabmodes.json, 비교 모음 out/tabmodes/sheet.jpg
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import CHROME from './chrome.mjs';
const BASE = process.argv.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8803';
const ORIG = process.argv.find(a => /\.html$/.test(a) && !/^https?:/.test(a)) || '/Users/jaehwak/Downloads/케이프혼타워_3D모델_v107_env_detail.html';
const OUT = fileURLToPath(new URL('./out/tabmodes/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const TABS = (process.env.TABS || 'now,new,srv').split(','), MODES = (process.env.MODES || 'sketch,render,real,photo').split(',');   // TABS·MODES 로 일부만, QX 로 우리 쪽 추가 쿼리
// render 3%: 숨긴 '렌더(이전)'의 신축 타워 유리 반사. 우리 [PR] updateReflections 감싸기(1102.l)가 반사 지도를 그리는 동안 그 지도를 읽는 재질을 떼어
// WebGL 되먹임 오류를 막는데, 원본은 그 순간 지도 자기 자신을 읽어 반사 내용이 조금 다르다(유리 위 세로 반사선 2.5～2.8%, 의도한 차이로 판단·추정)
const LIM = { sketch: 0.02, render: 0.03, photo: 0.01 };   // 다른 화소(채널 차 합 > 40) 비율 상한. real 은 의도한 차이(참고)
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CLIP = { x: 0, y: 0, width: 930, height: 760 };   // 오른쪽 설정 판 제외(우리 쪽은 같은 판에 실사 3D 버튼 상태가 다름)
async function shoot(kind, url) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 760 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  // 같은 난수: Wing 렌더(이전)의 SSAO 표본 방향 등 Math.random 으로 만드는 것이 두 쪽에서 같게(원본끼리도 실행마다 가장자리가 달라짐)
  await p.evaluateOnNewDocument(() => { let x = 123456789; Math.random = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; });
  const errs = []; p.on('pageerror', e => errs.push('PE ' + String(e).slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(url, { waitUntil: 'load', timeout: 300000 }); await sleep(20000);
  // 예열: 첫 촬영이 처음 탭 전환(주변 묶음 높이 이동·스케치업 가로 묶음 받기)과 겹치지 않게 세 탭을 한 바퀴 돈 뒤 시작
  for (const t of [...TABS, 'now']) { await p.evaluate(t => { const e = document.querySelector(`input[name=era][value=${t}]`); if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } }, t); await sleep(6000); }
  const shots = {};
  for (const tab of TABS) for (const mode of MODES) {
    await p.evaluate((t, m) => {
      const pick = (sel) => { const e = document.querySelector(sel); if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); } };
      // 보기 방식을 먼저 스케치업으로 돌려 놓고 탭을 바꾼 뒤 목표 방식으로(매번 같은 순서)
      pick('input[name=vmode][value=sketch]'); pick(`input[name=era][value=${t}]`); pick(`input[name=vmode][value=${m}]`);
    }, tab, mode);
    const t0 = Date.now();
    if (mode === 'real' && kind === 'ours') await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.boot === '준비 완료', { timeout: 180000 }).catch(() => {});
    if (mode === 'real' && kind === 'orig') await p.waitForFunction(() => !(window.KHR && KHR.busy), { timeout: 120000 }).catch(() => {});
    await sleep(mode === 'photo' ? 9000 : mode === 'real' ? 8000 : 5000);
    // 시점을 두 쪽 같게(각 탭 기본 시점은 페이지가 정하므로 그대로 두고, 화면 크기만 같게)
    const st = await p.evaluate(() => ({ vm: (document.querySelector('input[name=vmode]:checked') || {}).value, era: (document.querySelector('input[name=era]:checked') || {}).value, pr: !!(window.KHPRLayer && KHPRLayer.on) }));
    const f = `${tab}-${mode}-${kind}.png`; await p.screenshot({ path: OUT + f, clip: CLIP });
    shots[tab + '-' + mode] = { f, ms: Date.now() - t0, ...st };
  }
  await p.close(); return { shots, errs };
}
const orig = await shoot('orig', pathToFileURL(ORIG).href);
// hqcap=0: Wing 요청으로 바꾼 고화질 배율 상한(1102.k)만 끄고 비교(compat Q2 와 같은 조건). 기본값과의 차이는 가장자리 계단 처리뿐
const ours = await shoot('ours', BASE + '/new/3d-model.html?prsw=0&hqcap=0' + (process.env.QX || ''));
// 화면 차: 브라우저 캔버스로(추가 패키지 없이)
const cmp = await b.newPage();
const res = [];
for (const tab of TABS) for (const mode of MODES) {
  const k = tab + '-' + mode, A = fs.readFileSync(OUT + orig.shots[k].f).toString('base64'), B = fs.readFileSync(OUT + ours.shots[k].f).toString('base64');
  const r = await cmp.evaluate(async (a, bb) => {
    const ld = s => new Promise(q => { const i = new Image(); i.onload = () => q(i); i.src = 'data:image/png;base64,' + s; });
    const [x, y] = await Promise.all([ld(a), ld(bb)]), w = x.width, h = x.height, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.drawImage(x, 0, 0); const P = g.getImageData(0, 0, w, h).data.slice(); g.drawImage(y, 0, 0); const Q = g.getImageData(0, 0, w, h);
    let n = 0, sum = 0; for (let i = 0; i < P.length; i += 4) { const s = Math.abs(P[i] - Q.data[i]) + Math.abs(P[i + 1] - Q.data[i + 1]) + Math.abs(P[i + 2] - Q.data[i + 2]); sum += s / 3; if (s > 40) { n++; Q.data[i] = 255; Q.data[i + 1] = 0; Q.data[i + 2] = 64; } else { const v = (P[i] + P[i + 1] + P[i + 2]) / 3 * 0.35; Q.data[i] = Q.data[i + 1] = Q.data[i + 2] = v; } }
    g.putImageData(Q, 0, 0); return { ratio: n / (w * h), mean: sum / (w * h), png: c.toDataURL('image/png').split(',')[1] };
  }, A, B);
  fs.writeFileSync(OUT + `${k}-diff.png`, Buffer.from(r.png, 'base64'));
  const lim = LIM[mode], o = ours.shots[k];
  const pass = mode === 'real' ? o.pr && o.vm === 'real' && o.era === tab : r.ratio <= lim && o.vm === mode && o.era === tab;
  res.push({ tab, mode, diffRatio: +r.ratio.toFixed(4), meanDiff: +r.mean.toFixed(2), limit: lim ?? '참고(의도한 차이)', pass, ours: o, orig: orig.shots[k] });
  console.log((pass ? 'PASS' : 'FAIL') + `  ${tab} × ${mode}  다른 화소 ${(r.ratio * 100).toFixed(2)}%  평균차 ${r.mean.toFixed(2)}` + (mode === 'real' ? `  실사3D=${o.pr}` : ''));
}
// 비교 모음(탭 × 방식, 원본 | 우리 | 차이)
await cmp.setViewport({ width: 1400, height: 100 });
const rows = res.map(r => `<tr><td>${r.tab}<br>${r.mode}<br>${(r.diffRatio * 100).toFixed(2)}%</td>` + ['orig', 'ours', 'diff'].map(s => `<td><img src="data:image/png;base64,${fs.readFileSync(OUT + `${r.tab}-${r.mode}-${s}.png`).toString('base64')}"></td>`).join('') + '</tr>').join('');
await cmp.setContent(`<style>body{margin:0;font:12px sans-serif}td{padding:2px;vertical-align:top}img{width:420px}</style><table><tr><td></td><td>원본(Wing v107+지니 env_detail)</td><td>우리</td><td>차이(빨강)</td></tr>${rows}</table>`);
await sleep(500); await cmp.screenshot({ path: OUT + 'sheet.jpg', type: 'jpeg', quality: 70, fullPage: true });
const fail = res.filter(r => !r.pass).length;
fs.writeFileSync(fileURLToPath(new URL('./out/tabmodes' + (process.env.TAG || '') + '.json', import.meta.url)), JSON.stringify({ base: BASE, orig: ORIG, res, errs: { orig: orig.errs, ours: ours.errs } }, null, 1));
console.log(`\n${res.length - fail}/${res.length} 통과  오류 원본 ${orig.errs.length} 우리 ${ours.errs.length}`);
if (ours.errs.length) console.log(ours.errs.slice(0, 5).join('\n'));
await b.close(); process.exit(fail ? 1 : 0);
