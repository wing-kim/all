// Wing 과 HTML 파일로 주고받기(1102.v): node photoreal/tools/wing-html.mjs <명령> ...
// Wing 은 GitHub 대신 단일 HTML 을 고쳐 돌려준다. 그 파일에서 바뀐 코드만 뽑아 저장소 원본에 3방향으로 합친다. 사용법은 docs/wing-html-exchange.md
//
//   ident  <파일.html>                         어떤 파일인지(우리 단일 HTML·Wing/지니 원본), 판(KH_ENV_VER), SHA-1, 바탕으로 볼 기준 파일 후보
//   unpack <파일.html> <폴더>                   풀기. 우리 단일 HTML 이면 묶음(KHVFS) 안 파일을 저장소 경로 그대로 + 페이지를 원본 형태(new/3d-model.html)로 되돌림.
//                                              Wing·지니 원본이면 page.html 하나(큰 데이터 줄은 '/*KHBIG sha1 길이*/' 로 바꾸고 원본은 big/ 에 따로)
//   diff   <받은.html> [--base <보낸.html>]     기준(보낸 판)과 받은 판의 차이: 파일별 같음·바뀜·추가·삭제, 글 파일은 줄 차이(out/<이름>/diff/*.diff), 큰 데이터는 해시 비교
//   merge  <받은.html> [--base <보낸.html>] [--apply | --out <폴더>]
//                                              바뀐 파일마다 git merge-file 로 3방향 합치기(우리 = 저장소 현재, 기준 = 보낸 판, 그쪽 = 받은 판).
//                                              --apply 는 저장소에 쓰고, --out 은 그 폴더에 결과만 쓴다(시험용). 충돌은 <<<<<<< 표시를 남기고 목록을 알린다
//   all    <받은.html> [--base <보낸.html>]     merge --apply → 전체 점검(qa) → 단일 HTML 다시 묶기. 충돌이 있으면 합치기 뒤 멈춘다
//
// 기준 자동 판별(--base 를 주지 않을 때): 받은 파일의 KH_ENV_VER 와 같은 판의 deliverables/kapehorn-tower-3d_<판>.html.
// 우리 단일 HTML 이 아니면(Wing 자체 v107 계열·지니 env_detail) KH_ORIG(기본 ~/Downloads/케이프혼타워_3D모델_v107_env_detail.html) 또는 ~/Downloads 의 '*v107*.html' 중 SHA-1 이 알려진 것.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DELIVER = path.resolve(ROOT, '../../deliverables');
const OUT = path.join(ROOT, 'photoreal/tools/out/wing-html');
const sha1 = b => crypto.createHash('sha1').update(b).digest('hex');
const args = process.argv.slice(2), cmd = args[0], opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const TEXT = /\.(js|mjs|json|html|css|txt|md)$/i, BIG = 20000;   // 한 줄이 2만 자를 넘으면 큰 데이터로 본다(지니 KHDATA, base64 묶음 등)

// ---------- 읽기 ----------
function read(file) {
  const html = fs.readFileSync(file, 'utf8');
  const ver = (html.match(/KH_ENV_VER='([^']+)'/) || [])[1] || null;
  const ours = html.includes('window.KHVFS={}') && /\nKHVFS\["/.test(html);
  return { file, html, ver, ours, sha: sha1(html), bytes: Buffer.byteLength(html) };
}
// 우리 단일 HTML → { files: {경로: Buffer}, page: 원본 형태 페이지 }
function unpackOurs(h) {
  const files = {}; const re = /^KHVFS\[("(?:[^"\\]|\\.)*")\]=\["[^"]*","([A-Za-z0-9+/=]*)"\];$/gm; let m;
  while ((m = re.exec(h.html))) files[JSON.parse(m[1])] = Buffer.from(m[2], 'base64');
  // 페이지: 가로채기·데이터 두 스크립트를 빼고 묶을 때 바꾼 세 곳을 되돌린다(bundle-single.mjs 의 반대)
  let page = h.html;
  const a = page.indexOf('<script>/* 단일 HTML 가상 파일'), b = page.indexOf('</script>', page.indexOf('<script>KHVFS[', a)) + '</script>'.length;
  if (a < 0 || b < a) throw new Error('묶음 스크립트를 못 찾음');
  page = page.slice(0, a).replace(/\n$/, '') + page.slice(b).replace(/^\n/, '');
  page = page.replace('const khBinOK=', "const khBinOK=location.protocol!=='file:'&&");
  for (const s of ['../photoreal/kh-photoreal.js', '../xr/kh-xr.js']) page = page.replace(`<script>__khRun(${JSON.stringify(s)})</script>`, `<script src="${s}"></script>`);
  for (const r of ['photoreal/kh-photoreal.js', 'xr/kh-xr.js']) if (files[r]) { const s = files[r].toString('utf8').replace(/const SRC = 'https:\/\/kh\.vfs\/[^']*';/, 'const SRC = (document.currentScript && document.currentScript.src) || location.href;'); files[r] = Buffer.from(s); }
  return { files, page };
}
// 큰 데이터 줄을 해시 표시로(비교·합치기용). 원본은 big 에 모은다
function stripBig(text, big) { return text.split('\n').map(l => { if (l.length <= BIG) return l; const h = sha1(l); if (big) big[h] = l; return `/*KHBIG ${h} ${l.length}*/`; }).join('\n'); }
function unpack(h) {
  if (h.ours) { const u = unpackOurs(h); u.files['new/3d-model.html'] = Buffer.from(u.page); return { kind: 'ours', files: u.files, big: {} }; }
  const big = {}; return { kind: 'page', files: { 'new/3d-model.html': Buffer.from(stripBig(h.html, big)) }, big };
}
// ---------- 기준 판별 ----------
function knownFiles() {
  const out = [];
  if (fs.existsSync(DELIVER)) for (const n of fs.readdirSync(DELIVER)) if (/^kapehorn-tower-3d_.+\.html$/.test(n)) out.push(path.join(DELIVER, n));
  const dl = path.join(os.homedir(), 'Downloads');
  if (process.env.KH_ORIG) out.push(process.env.KH_ORIG);
  if (fs.existsSync(dl)) for (const n of fs.readdirSync(dl)) if (/v1\d\d.*\.html$/i.test(n) || /env_detail.*\.html$/i.test(n)) out.push(path.join(dl, n));
  return [...new Set(out)].filter(f => fs.existsSync(f));
}
function ident(h) {
  const k = knownFiles().map(f => { const x = read(f); return { f, ver: x.ver, ours: x.ours, sha: x.sha }; });
  const same = k.find(x => x.sha === h.sha);
  let base = null, why = '';
  if (same) { base = same.f; why = '보낸 파일과 똑같음(고친 것 없음)'; }
  else if (h.ours && h.ver) { const b = k.find(x => x.ours && x.ver === h.ver); if (b) { base = b.f; why = `같은 판(${h.ver})의 우리 단일 HTML`; } }
  if (!base && !h.ours) { // Wing·지니 원본 계열: 본문이 가장 비슷한(바뀐 줄이 가장 적은) 원본
    let best = null; for (const x of k.filter(x => !x.ours)) { const a = stripBig(read(x.f).html).split('\n'), bb = stripBig(h.html).split('\n'), A = new Set(a); const d = bb.filter(l => !A.has(l)).length; if (!best || d < best.d) best = { f: x.f, d }; }
    if (best) { base = best.f; why = `Wing·지니 원본 중 바뀐 줄이 가장 적은 것(${best.d}줄)`; } }
  return { file: h.file, kind: h.ours ? '우리 단일 HTML' : 'Wing·지니 원본 계열(묶음 없음)', ver: h.ver, sha1: h.sha, bytes: h.bytes, base, why, known: k.map(x => ({ file: x.f, ver: x.ver, ours: x.ours, sha1: x.sha })) };
}
// ---------- 차이 ----------
function diffSets(baseU, theirU) {
  const keys = [...new Set([...Object.keys(baseU.files), ...Object.keys(theirU.files)])].sort(), res = [];
  for (const k of keys) { const a = baseU.files[k], b = theirU.files[k];
    if (a && !b) res.push({ path: k, st: '삭제' }); else if (!a && b) res.push({ path: k, st: '추가', bytes: b.length });
    else if (sha1(a) !== sha1(b)) res.push({ path: k, st: '바뀜', text: TEXT.test(k), a: sha1(a), b: sha1(b) }); }
  return res;
}
function textDiff(a, b, label) {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'whd-')), fa = path.join(t, 'a'), fb = path.join(t, 'b'); fs.writeFileSync(fa, stripBig(a.toString('utf8'))); fs.writeFileSync(fb, stripBig(b.toString('utf8')));
  const r = spawnSync('git', ['diff', '--no-index', '--no-color', '-U3', '--label', 'a/' + label, '--label', 'b/' + label, fa, fb], { encoding: 'utf8', maxBuffer: 1 << 28 }); fs.rmSync(t, { recursive: true, force: true }); return r.stdout;
}
function load(theirFile) {
  const T = read(theirFile), id = ident(T), bf = opt('base') && opt('base') !== true ? opt('base') : id.base;
  if (!bf) throw new Error('기준 파일을 못 찾았습니다. --base <보낸 파일.html> 로 알려 주세요');
  const B = read(bf); return { T, B, id, bu: unpack(B), tu: unpack(T) };
}
function doDiff(theirFile, quiet) {
  const { T, B, id, bu, tu } = load(theirFile), ch = diffSets(bu, tu), name = path.basename(theirFile).replace(/\.html$/, ''), dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, 'diff'), { recursive: true });
  for (const c of ch.filter(c => c.text)) { const d = textDiff(bu.files[c.path], tu.files[c.path], c.path); c.lines = (d.match(/^[+-](?![+-])/gm) || []).length; fs.writeFileSync(path.join(dir, 'diff', c.path.replace(/\//g, '__') + '.diff'), d); }
  const bigCh = Object.keys(tu.big).filter(h => !bu.big[h]).length;
  const rep = { received: theirFile, base: B.file, baseWhy: id.why, receivedVer: T.ver, baseVer: B.ver, kind: id.kind, changes: ch, bigDataChanged: bigCh };
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(rep, null, 1));
  if (!quiet) { console.log(`받은 파일 ${theirFile} (${id.kind}, 판 ${T.ver})`); console.log(`기준 ${B.file} (판 ${B.ver}) — ${id.why}`);
    if (!ch.length) console.log('바뀐 것 없음'); ch.forEach(c => console.log(`  ${c.st}  ${c.path}${c.lines != null ? '  (' + c.lines + '줄)' : c.bytes ? '  ' + c.bytes + 'B' : ''}`));
    if (bigCh) console.log(`  큰 데이터 줄 ${bigCh}개가 기준과 다름(해시 비교)`); console.log('줄 차이:', path.join(dir, 'diff')); }
  return { rep, bu, tu, dir };
}
// ---------- 합치기 ----------
function doMerge(theirFile) {
  const { rep, bu, tu, dir } = doDiff(theirFile, true), apply = !!opt('apply'), outDir = opt('out') && opt('out') !== true ? path.resolve(opt('out')) : null;
  if (!apply && !outDir) throw new Error('--apply(저장소에 쓰기) 또는 --out <폴더>(결과만) 를 주세요');
  const target = r => apply ? path.join(ROOT, r) : path.join(outDir, r), res = [];
  for (const c of rep.changes) {
    const ours = path.join(ROOT, c.path), w = target(c.path); fs.mkdirSync(path.dirname(w), { recursive: true });
    if (c.st === '추가') { fs.writeFileSync(w, tu.files[c.path]); res.push([c.path, '추가함']); continue; }
    if (c.st === '삭제') { res.push([c.path, '그쪽에서 삭제(저장소에서는 지우지 않음, 확인 필요)']); continue; }
    if (!fs.existsSync(ours)) { fs.writeFileSync(w, tu.files[c.path]); res.push([c.path, '저장소에 없어 그쪽 것을 씀']); continue; }
    if (!c.text) { const o = fs.readFileSync(ours); if (sha1(o) === c.a) { fs.writeFileSync(w, tu.files[c.path]); res.push([c.path, '그쪽 것으로 바꿈(우리는 안 바꿈)']); } else res.push([c.path, '충돌(둘 다 바꾼 이진 파일, 손으로)']); continue; }
    const t = fs.mkdtempSync(path.join(os.tmpdir(), 'whm-')), big = {};
    const fo = path.join(t, 'ours'), fb = path.join(t, 'base'), ft = path.join(t, 'theirs');
    fs.writeFileSync(fo, stripBig(fs.readFileSync(ours, 'utf8'), big)); fs.writeFileSync(fb, stripBig(bu.files[c.path].toString('utf8'), big)); fs.writeFileSync(ft, stripBig(tu.files[c.path].toString('utf8'), big));
    Object.assign(big, tu.big);
    const r = spawnSync('git', ['merge-file', '-p', '-L', '우리(저장소)', '-L', '기준(보낸 판)', '-L', '그쪽(받은 판)', fo, fb, ft], { encoding: 'utf8', maxBuffer: 1 << 28 });
    const merged = r.stdout.split('\n').map(l => { const m = l.match(/^\/\*KHBIG ([0-9a-f]{40}) \d+\*\/$/); return m && big[m[1]] ? big[m[1]] : l; }).join('\n');
    fs.writeFileSync(w, merged); fs.rmSync(t, { recursive: true, force: true });
    res.push([c.path, r.status === 0 ? '자동으로 합침' : r.status > 0 ? `충돌 ${r.status}곳(<<<<<<< 표시, 손으로)` : '합치기 실패 ' + r.stderr]);
  }
  const conflicts = res.filter(x => /충돌|실패/.test(x[1])).length;
  fs.writeFileSync(path.join(dir, 'merge.json'), JSON.stringify({ apply, outDir, res, conflicts }, null, 1));
  console.log(`합치기(${apply ? '저장소에 씀' : outDir}): 바뀐 파일 ${rep.changes.length}개, 충돌 ${conflicts}`); res.forEach(([p, s]) => console.log('  ' + s + '  ' + p));
  return conflicts;
}
// ---------- 명령 ----------
try {
  if (cmd === 'ident') console.log(JSON.stringify(ident(read(args[1])), null, 1));
  else if (cmd === 'unpack') { const h = read(args[1]), u = unpack(h), d = path.resolve(args[2] || path.join(OUT, path.basename(args[1], '.html') + '-files'));
    for (const [r, b] of Object.entries(u.files)) { fs.mkdirSync(path.dirname(path.join(d, r)), { recursive: true }); fs.writeFileSync(path.join(d, r), b); }
    if (Object.keys(u.big).length) { fs.mkdirSync(path.join(d, 'big'), { recursive: true }); for (const [k, v] of Object.entries(u.big)) fs.writeFileSync(path.join(d, 'big', k + '.txt'), v); }
    console.log(`${u.kind === 'ours' ? '우리 단일 HTML' : 'Wing·지니 원본'}: 파일 ${Object.keys(u.files).length}개, 큰 데이터 ${Object.keys(u.big).length}줄 → ${d}`); }
  else if (cmd === 'diff') doDiff(args[1]);
  else if (cmd === 'merge') process.exitCode = doMerge(args[1]) ? 2 : 0;
  else if (cmd === 'all') {
    if (!opt('apply')) args.push('--apply');
    const c = doMerge(args[1]); if (c) { console.log('충돌이 있어 점검·묶기를 하지 않았습니다. 충돌을 풀고 다시 node photoreal/tests/qa.mjs, node photoreal/tools/bundle-single.mjs'); process.exit(2); }
    for (const [d, f, a] of [['photoreal/tests', 'qa.mjs', []], ['.', 'photoreal/tools/bundle-single.mjs', []]]) { console.log('실행:', f); const r = spawnSync('node', [f, ...a], { cwd: path.join(ROOT, d), stdio: 'inherit' }); if (r.status) console.log(f, '종료 코드', r.status); }
  } else { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); }
} catch (e) { console.error('오류:', e.message); process.exit(1); }
