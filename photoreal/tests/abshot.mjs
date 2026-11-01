// 전후 비교 스크린샷: 같은 시점을 두 주소(또는 두 주소 옵션)로 찍고 화소 차이를 잰다.
// 사용: A=기준주소 B=비교주소 [QA=옵션 QB=옵션 PF=glass TOD=night VIEWS="out,front,1F,5F,B1" OUT=../../docs/shots/이름 W=960 H=540] node abshot.mjs
// REG(또는 REG_<시점>)="이름:x0,y0,x1,y1;..." 를 주면 영역별 평균 밝기(a, b)도 적는다
// 결과: OUT/<시점>-a.jpg, OUT/<시점>-b.jpg(작은 JPEG), OUT/ab.json(평균 화소 차, 큰 차이 화소 %, 평균 밝기)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const A = process.env.A || 'http://localhost:8791', B = process.env.B || A, QA = process.env.QA || '', QB = process.env.QB || '';
const VIEWS = (process.env.VIEWS || 'out,front,1F,5F,B1').split(','), W = +(process.env.W || 960), H = +(process.env.H || 540);
const OUT = path.resolve(process.env.OUT || './out/ab'); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
// 시점: out = Wing 모서리 보기, front = 압구정로에서 본 정면(가까이), 층 이름 = 그 층 실내
async function shots(base, qs, tag) {
  const p = await b.newPage(); await p.setViewport({ width: W, height: H });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(base + '/new/3d-model.html?pr=1&prsw=0&pf=' + (process.env.PF || 'glass') + qs, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.on && KHPRLayer.t.dress != null && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null, { timeout: 180000 }).catch(() => errs.push('timeout'));
  const tod = process.env['TOD' + tag.toUpperCase()] || process.env.TOD;   // TODA/TODB 로 A·B 시간대를 따로 줄 수 있다(예: 오후 대 석양)
  if (tod) { await p.evaluate(t => { const e = document.getElementById('tod-' + t); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, tod); await new Promise(r => setTimeout(r, 4000)); }
  await p.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });   // 웹 화면 단추·패널 숨김(3D 화면만)
  const out = {};
  for (const v of VIEWS) {
    await p.evaluate(v => {
      const X = KHXR, K = KHPRLayer.K;
      if (v === 'out' || v === 'front') { if (K.I.on) X.go('corner'); else X.go('corner'); }
      else { const i = K.LEVELS.findIndex(l => l.key === v); if (!K.I.on) X.enterInt(); X.placeLevel(i, true); }
    }, v);
    await new Promise(r => setTimeout(r, 2500));
    if (v === 'front') await p.evaluate(() => { const c = KHXR.camera, t = KHXR.controls.target, d = c.position.clone().sub(t).multiplyScalar(0.45); c.position.copy(t).add(d); c.position.y = Math.max(c.position.y * 0.5, 4); KHXR.controls.update(); });
    await p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 50 ? r() : requestAnimationFrame(f)); f(); }));
    await new Promise(r => setTimeout(r, 600));
    const jpg = await p.screenshot({ path: path.join(OUT, `${v}-${tag}.jpg`), type: 'jpeg', quality: 72 });
    out[v] = path.join(OUT, `${v}-${tag}.jpg`);
  }
  await p.close();
  return { out, errs };
}
const ra = await shots(A, QA, 'a'), rb = await shots(B, QB, 'b');
const p = await b.newPage();
const res = { A: A + ' ' + QA, B: B + ' ' + QB, pf: process.env.PF || 'glass', tod: process.env.TOD || '', at: new Date().toISOString(), views: {}, errors: [...ra.errs, ...rb.errs].slice(0, 6) };
for (const v of VIEWS) {
  const u = f => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
  res.views[v] = await p.evaluate(async (a, c, R) => {
    const ld = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    const [I, J] = await Promise.all([ld(a), ld(c)]), w = 480, h = Math.round(I.height * 480 / I.width), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    g.drawImage(I, 0, 0, w, h); const da = g.getImageData(0, 0, w, h).data; g.drawImage(J, 0, 0, w, h); const db = g.getImageData(0, 0, w, h).data;
    // 영역별 평균 밝기(REG="이름:x0,y0,x1,y1;..." 화면 비율): 예) 야간 우리 건물 대 이웃 건물
    const reg = {}; (R || '').split(';').filter(Boolean).forEach(q => { const [nm, b4] = q.split(':'), [x0, y0, x1, y1] = b4.split(',').map(Number); let sa = 0, sb = 0, n = 0;
      let pa = 0, pb = 0;   // 포화(세 채널 모두 245 이상) 화소 수
      for (let y = Math.floor(y0 * h); y < Math.floor(y1 * h); y++) for (let x = Math.floor(x0 * w); x < Math.floor(x1 * w); x++) { const i = (y * w + x) * 4; sa += (da[i] + da[i + 1] + da[i + 2]) / 3; sb += (db[i] + db[i + 1] + db[i + 2]) / 3; n++; if (Math.min(da[i], da[i + 1], da[i + 2]) >= 245) pa++; if (Math.min(db[i], db[i + 1], db[i + 2]) >= 245) pb++; }
      reg[nm] = { lum: [+(sa / n).toFixed(1), +(sb / n).toFixed(1)], satPct: [+(pa / n * 100).toFixed(2), +(pb / n * 100).toFixed(2)] }; });
    let s = 0, big = 0, la = 0, lb = 0; for (let i = 0; i < da.length; i += 4) { const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3; s += d; if (d > 40) big++; la += (da[i] + da[i + 1] + da[i + 2]) / 3; lb += (db[i] + db[i + 1] + db[i + 2]) / 3; }
    const n = w * h; return { meanDiff: +(s / n).toFixed(2), bigPct: +(big / n * 100).toFixed(2), lumA: +(la / n).toFixed(1), lumB: +(lb / n).toFixed(1), reg };
  }, u(ra.out[v]), u(rb.out[v]), (process.env['REG_' + v] || process.env.REG || ''));
  console.log(v, JSON.stringify(res.views[v]));
}
fs.writeFileSync(path.join(OUT, 'ab.json'), JSON.stringify(res, null, 1));
if (res.errors.length) console.log('오류', res.errors);
await b.close();
