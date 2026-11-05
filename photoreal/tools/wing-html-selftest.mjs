// wing-html.mjs 자체 시험(1102.v): node photoreal/tools/wing-html-selftest.mjs [우리 단일 HTML] [Wing·지니 원본 HTML]
// 1) 우리 단일 HTML(기본 deliverables 의 가장 최근 판)로 'Wing 이 고친 척한 파일'을 만든다: 페이지 글자 하나, xr/kh-xr.js 에 주석 한 줄, 새 파일 하나
//    → ident(기준 자동 판별) · diff(바뀐 3개만) · merge --out(저장소 현재 + Wing 변경이 둘 다 들어감) 을 확인
// 2) Wing·지니 원본(기본 ~/Downloads/케이프혼타워_3D모델_v107_env_detail.html)으로 'Wing 이 자기 v107 계열 파일을 고친 척' → 우리 new/3d-model.html 에 합쳐지는지
// 결과는 photoreal/tools/out/wing-html/ 아래. 저장소 파일은 바꾸지 않는다
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), DELIVER = path.resolve(ROOT, '../../deliverables'), OUT = path.join(ROOT, 'photoreal/tools/out/wing-html');
fs.mkdirSync(OUT, { recursive: true });
const ourFile = process.argv[2] || fs.readdirSync(DELIVER).filter(n => /^kapehorn-tower-3d_.+\.html$/.test(n)).map(n => path.join(DELIVER, n)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const origFile = process.argv[3] || process.env.KH_ORIG || path.join(os.homedir(), 'Downloads/케이프혼타워_3D모델_v107_env_detail.html');
const tool = (...a) => { const r = spawnSync('node', [path.join(ROOT, 'photoreal/tools/wing-html.mjs'), ...a], { encoding: 'utf8', maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
let pass = 0, n = 0; const ok = (name, c, info) => { n++; if (c) pass++; console.log((c ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
// ---- 1) 우리 단일 HTML 을 고친 척
{
  let h = fs.readFileSync(ourFile, 'utf8');
  const LABEL = '<title>케이프혼타워 3D 모델</title>', LABEL2 = '<title>케이프혼타워 3D 모델(Wing 시험)</title>';
  ok('시험 재료: 페이지에 바꿀 글자 있음', h.includes(LABEL));
  h = h.replace(LABEL, LABEL2);
  const key = 'KHVFS["xr/kh-xr.js"]=["text/javascript","', i = h.indexOf(key), j = h.indexOf('"];', i + key.length);
  const js = Buffer.from(h.slice(i + key.length, j), 'base64').toString('utf8').replace("(function () {", "(function () {\n  // Wing 시험: 이 줄은 Wing 이 고친 척한 주석입니다");
  h = h.slice(0, i + key.length) + Buffer.from(js).toString('base64') + h.slice(j);
  const at = h.indexOf('KHVFS["xr/kh-xr.js"]');
  h = h.slice(0, at) + 'KHVFS["new/models/wing-note.json"]=["application/json","' + Buffer.from('{"note":"Wing 시험 파일"}').toString('base64') + '"];\n' + h.slice(at);
  const fake = path.join(OUT, 'wing-returned-ours.html'); fs.writeFileSync(fake, h);
  const id = JSON.parse(tool('ident', fake).out);
  ok('ident: 우리 단일 HTML 로 알아봄', id.kind === '우리 단일 HTML', id.kind);
  ok('ident: 기준을 보낸 판으로 자동 판별', id.base === ourFile, path.basename(id.base || '없음') + ' / ' + id.why);
  const d = tool('diff', fake); const rep = JSON.parse(fs.readFileSync(path.join(OUT, 'wing-returned-ours/report.json'), 'utf8'));
  const paths = rep.changes.map(c => c.st + ' ' + c.path).sort();
  ok('diff: 바뀐 것이 정확히 3개(페이지·kh-xr.js 바뀜, 새 파일 추가)', paths.join('|') === ['바뀜 new/3d-model.html', '바뀜 xr/kh-xr.js', '추가 new/models/wing-note.json'].sort().join('|'), paths.join(', '));
  const out = path.join(OUT, 'merged-ours'); fs.rmSync(out, { recursive: true, force: true });
  const m = tool('merge', fake, '--out', out);
  const page = fs.readFileSync(path.join(out, 'new/3d-model.html'), 'utf8'), xr = fs.readFileSync(path.join(out, 'xr/kh-xr.js'), 'utf8'), cur = fs.readFileSync(path.join(ROOT, 'new/3d-model.html'), 'utf8'), curX = fs.readFileSync(path.join(ROOT, 'xr/kh-xr.js'), 'utf8');
  ok('merge: 충돌 없음', m.code === 0, m.out.split('\n')[0]);
  ok('merge: 페이지에 Wing 변경 들어감', page.includes(LABEL2));
  ok('merge: 페이지가 Wing 변경 한 줄 말고는 저장소 현재와 같음', page.replace(LABEL2, LABEL) === cur);
  ok('merge: kh-xr.js 에 Wing 주석 + 저장소 현재 내용', xr.includes('Wing 시험: 이 줄은') && xr.replace('\n  // Wing 시험: 이 줄은 Wing 이 고친 척한 주석입니다', '') === curX);
  ok('merge: 새 파일 추가', fs.existsSync(path.join(out, 'new/models/wing-note.json')));
}
// ---- 2) Wing·지니 원본 계열을 고친 척
if (fs.existsSync(origFile)) {
  let h = fs.readFileSync(origFile, 'utf8');
  const LABEL = '<title>케이프혼타워 3D 모델</title>', LABEL2 = '<title>케이프혼타워 3D 모델(Wing v107 시험)</title>';
  ok('원본 시험 재료: 바꿀 글자 있음', h.includes(LABEL));
  const fake = path.join(OUT, 'wing-returned-v107.html'); fs.writeFileSync(fake, h.replace(LABEL, LABEL2));
  const id = JSON.parse(tool('ident', fake).out);
  ok('ident: Wing·지니 원본 계열로 알아보고 기준을 그 원본으로', /원본 계열/.test(id.kind) && id.base && fs.realpathSync(id.base).normalize('NFC') === fs.realpathSync(origFile).normalize('NFC')   /* 맥 파일 이름의 한글은 NFD 로 올 수 있다 */, id.kind + ' / ' + path.basename(id.base || '없음') + ' / ' + id.why);
  const out = path.join(OUT, 'merged-v107'); fs.rmSync(out, { recursive: true, force: true });
  const m = tool('merge', fake, '--out', out), page = fs.readFileSync(path.join(out, 'new/3d-model.html'), 'utf8'), cur = fs.readFileSync(path.join(ROOT, 'new/3d-model.html'), 'utf8');
  ok('merge(원본 계열): 충돌 없음', m.code === 0, m.out.split('\n')[0]);
  ok('merge(원본 계열): 우리 페이지에 Wing 변경만 들어감(큰 데이터는 들어오지 않음)', page.replace(LABEL2, LABEL) === cur && page.includes(LABEL2));
} else console.log('건너뜀: Wing·지니 원본 파일 없음', origFile);
console.log(`\n${pass}/${n} 통과`); process.exit(pass === n ? 0 : 1);
