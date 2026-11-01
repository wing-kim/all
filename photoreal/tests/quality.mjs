// 품질 단계(T4 화면, T5 VR) 시험: node quality.mjs  (BASE=주소, 기본 http://localhost:8791)
// 1) ?prq=low: 합성 화소 배율 0.75·그림자 1024·먼 나무 숨김·SSAO 생략, 한 프레임 그리기 호출  2) 패널 단추로 바꾸고 기억  3) 휴대폰 흉내에서 자동 선택
// 4) VR(에뮬레이터) ?xrq=2: 가까운 나무 카드 숨김, 자동 단계 바꾸기는 꺼짐
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('./out/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const res = { base: BASE, at: new Date().toISOString(), checks: [] };
const ok = (name, pass, info) => { res.checks.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(info)); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ready = p => p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null, { timeout: 180000 });
const errs = [];
async function page(qs, mobile) {
  const p = await b.newPage(); p.on('pageerror', e => errs.push(String(e)));
  if (mobile) await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  else await p.setViewport({ width: 1280, height: 720 });
  await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + qs, { waitUntil: 'load', timeout: 120000 }); await ready(p); await wait(1500); return p;
}
const state = p => p.evaluate(async () => {
  const K = KHPRLayer.K, C = K.R3D.composer, near = KHXR.scene.getObjectByName('pr-trees-far');
  const fi = await KHPRLayer.frameInfo();
  return { q: KHPRLayer.q.key, why: KHPRLayer.q.why, pr: C && +(C._pixelRatio || 1).toFixed(2), shadow: K.sun.shadow.mapSize.x, farTrees: near ? near.visible : null, calls2f: fi.calls };
});
// 1) 낮음 강제
{ const p = await page('&prq=low'); const s = await state(p);
  ok('낮음: 배율 0.75·그림자 1024·먼 나무 숨김', s.q === 'low' && s.pr === 0.75 && s.shadow === 1024 && s.farTrees === false, s);
  // 2) 패널 단추: 보통 → 기억 → 다시 열면 보통
  await p.evaluate(() => document.querySelector('[data-q="medium"]').click()); await wait(800);
  const s2 = await state(p); ok('패널 보통 선택: 배율 1·먼 나무 보임', s2.q === 'medium' && s2.pr === 1 && s2.farTrees === true, s2);
  await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0', { waitUntil: 'load' }); await ready(p); await wait(1000);   // 주소 옵션 없이 다시 열기
  const s3 = await state(p); ok('선택 기억(다시 열어도 보통)', s3.q === 'medium', s3);
  await p.evaluate(() => document.querySelector('[data-q=""]').click()); await wait(300);
  const s4 = await p.evaluate(() => localStorage.getItem('khpr.quality')); ok('자동으로 되돌리면 기억 지움', s4 === null, s4);
  await p.close(); }
// 3) 휴대폰 흉내: 자동 선택(맥 GPU 라 대개 높음이 나온다. 선택이 일어나는지만 본다)
{ const p = await page('', true); await wait(13500); const s = await state(p); const fi = s.calls2f;
  ok('휴대폰 흉내: 10초 측정 뒤 자동 선택', /자동/.test(s.why || ''), s); await p.close(); }
// 휴대폰 흉내 + 낮음: 한 프레임 그리기 호출(이동 중 기준)
{ const p = await page('&prq=low', true);
  const one = await p.evaluate(async () => { const raf = () => new Promise(r => requestAnimationFrame(r)), C = KHXR.controls; C.autoRotate = true; C.autoRotateSpeed = 2; await raf(); await raf(); const inf = KHXR.renderer.info; inf.autoReset = false; inf.reset(); await raf(); const r = inf.render.calls; inf.autoReset = true; C.autoRotate = false; return r; });
  ok('휴대폰 낮음 한 프레임 그리기 호출 400 미만', one < 400, one); await p.close(); }
// 4) VR 단계 고정
{ const p = await page('&xremu=1&xrq=2');
  const r = await p.evaluate(async () => { await KHXRLayer.enter('vr'); await new Promise(r => setTimeout(r, 2500)); const t = KHXR.scene.getObjectByName('pr-trees-near'); const o = { level: KHXRLayer.xrq.level, auto: KHXRLayer.xrq.auto, nearTrees: t ? t.visible : null }; await KHXRLayer.exit(); await new Promise(r => setTimeout(r, 500)); o.after = t ? t.visible : null; return o; });
  ok('VR ?xrq=2: 가까운 나무 카드 숨김, 끝나면 되돌림, 에뮬레이터 자동 꺼짐', r.level === 2 && r.nearTrees === false && r.after === true && r.auto === false, r); await p.close(); }
ok('페이지 오류 없음', errs.length === 0, errs.slice(0, 5));
res.pass = res.checks.filter(c => c.pass).length + '/' + res.checks.length;
fs.writeFileSync(OUT + 'quality.json', JSON.stringify(res, null, 1)); console.log('결과', res.pass);
await b.close();
