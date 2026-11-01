// 주변 건물 외벽 무늬(재질 분류별 색·거칠기/금속성·노멀) 이미지를 만든다: node facade-gen.mjs   (BASE 기본 http://localhost:8791)
// 실사 계층을 ?ctxgen=1 로 열면 예전처럼 캔버스로 그린다. 그 캔버스를 photoreal/context/facade/<분류>-col.webp, -rm.png, -nc.png 로 저장한다.
// 실행 화면은 이 파일들을 읽기만 하므로 화소 계산 멈춤이 없다. 무늬를 바꾸면 kh-photoreal.js 의 facadeCanvas 를 고치고 이 도구를 다시 돌린다.
// photoreal/tests 에서 실행한다(puppeteer-core 가 여기 있다)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:8791';
const OUT = fileURLToPath(new URL('../context/facade/', import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 800, height: 600 });
await p.goto(BASE + '/new/3d-model.html?pr=1&ctxgen=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.stat && KHPRLayer.stat.context && KHPRLayer.FW.cv, { timeout: 120000 });
const res = await p.evaluate(() => {
  const out = {}; const cv = KHPRLayer.FW.cv;
  for (const [k, c] of Object.entries(cv)) out[k] = { col: c.col.toDataURL('image/webp', 0.9), rm: c.rm.toDataURL('image/png'), nc: c.nc.toDataURL('image/png') };
  return out;
});
for (const [k, v] of Object.entries(res)) for (const [n, url] of Object.entries(v)) {
  const ext = n === 'col' ? 'webp' : 'png';
  fs.writeFileSync(OUT + k + '-' + n + '.' + ext, Buffer.from(url.split(',')[1], 'base64'));
}
const need = ['tile', 'paint', 'stone', 'glass', 'brick', 'metal', 'apt', 'shop'];
console.log('저장', Object.keys(res).join(','), '빠진 분류', need.filter(k => !res[k]).join(',') || '없음');
await b.close();
