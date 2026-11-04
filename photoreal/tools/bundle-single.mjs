// 단일 HTML 묶기(1102.s): node photoreal/tools/bundle-single.mjs [판=KH_ENV_VER]
// new/3d-model.html 과 그것이 부르는 우리 파일(photoreal·xr 스크립트, new/models 의 glb·KTX2·아틀라스, 굽기 그림, 디코더 wasm 등)을 한 HTML 에 넣는다.
// Wing 이 파일 하나만 열어도(file:// 와 아무 서버) 스케치업·렌더(실사 3D)·실사·VR 진입이 동작하게:
//  - 파일마다 base64 문자열로 넣고, 요청이 올 때만 풀어 blob 으로 준다(지니 KHDATA 방식, 첫 로딩에 전부 풀지 않음)
//  - fetch·XMLHttpRequest·<img>·<script>·Worker 주소를 가로채 묶음 안 파일로 돌린다. 기준 주소는 가상 주소 https://kh.vfs/ (photoreal·xr 의 SRC 를 그 주소로 고정)
//  - 파일로 바로 열 때의 .js 모델 대신 압축 .glb 를 쓰게(khBinOK) 하고, 서비스 워커는 끈다
// 결과: dist/kapehorn-tower-3d_<판>.html(.gitignore), 같은 파일을 작업 폴더 밖 deliverables/ 에도 복사
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const page0 = fs.readFileSync(path.join(ROOT, 'new/3d-model.html'), 'utf8');
const VER = process.argv[2] || (page0.match(/KH_ENV_VER='([^']+)'/) || [])[1] || 'dev';
const MIME = { js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', glb: 'model/gltf-binary', gltf: 'model/gltf+json', ktx2: 'image/ktx2', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', wasm: 'application/wasm', hdr: 'application/octet-stream', bin: 'application/octet-stream', txt: 'text/plain', css: 'text/css' };
// 넣을 파일: 실행에 쓰는 것만(시험·도구·문서·라이선스 설명 제외). 압축본이 있는 .js 모델·텍스처 사본은 뺀다
const files = [];
const walk = (rel, keep) => { const abs = path.join(ROOT, rel); if (!fs.existsSync(abs)) return; for (const n of fs.readdirSync(abs)) { const r = path.posix.join(rel, n), a = path.join(ROOT, r), st = fs.statSync(a); if (st.isDirectory()) walk(r, keep); else if (keep(r)) files.push(r); } };
const ext = r => r.split('.').pop().toLowerCase();
walk('new/models', r => { const e = ext(r); if (!MIME[e]) return false; if (e === 'js' && /\/(tex\/)?[^/]+\.js$/.test(r) && !/\/(kh-lib|ktx-list|bin-list|vr-atlas)\.js$/.test(r)) { const b = r.replace(/\.js$/, ''); return !(fs.existsSync(path.join(ROOT, b + '.glb')) || fs.existsSync(path.join(ROOT, b + '.ktx2'))); } return true; });
walk('photoreal', r => !/^photoreal\/(tests|tools)\//.test(r) && !!MIME[ext(r)] && !(ext(r) === 'png' && fs.existsSync(path.join(ROOT, r.replace(/\.png$/, '.webp')))));
walk('xr', r => r === 'xr/kh-xr.js');
// photoreal·xr 의 기준 주소를 가상 주소로
const patch = (r, buf) => {
  if (r === 'photoreal/kh-photoreal.js' || r === 'xr/kh-xr.js') { let s = buf.toString('utf8'); const a = 'const SRC = (document.currentScript && document.currentScript.src) || location.href;'; if (!s.includes(a)) throw new Error('SRC 줄을 못 찾음: ' + r); s = s.replace(a, `const SRC = 'https://kh.vfs/${r}';`); return Buffer.from(s); }
  return buf;
};
let page = page0;
const binLine = "const khBinOK=location.protocol!=='file:'&&";
if (!page.includes(binLine)) throw new Error('khBinOK 줄을 못 찾음'); page = page.replace(binLine, 'const khBinOK=');
for (const s of ['../photoreal/kh-photoreal.js', '../xr/kh-xr.js']) { const tag = `<script src="${s}"></script>`; if (!page.includes(tag)) throw new Error('스크립트 태그를 못 찾음: ' + s); page = page.replace(tag, `<script>__khRun(${JSON.stringify(s)})</script>`); }
// 가로채기(맨 앞에 둔다)
const HOOK = `<script>/* 단일 HTML 가상 파일(1102.s, photoreal/tools/bundle-single.mjs): 요청한 때만 base64 를 풀어 blob 으로 준다 */
(function(){var F=window.KHVFS={},U={},V='https://kh.vfs/',L=location.href.replace(/[?#].*$/,'').replace(/[^/]*$/,'');
function key(u){try{u=String(u);if(/^(blob|data):/.test(u))return null;var a=new URL(u,location.href).href.replace(/[?#].*$/,'');if(a.indexOf(V)===0)return a.slice(V.length);if(a.indexOf(L)===0){var r=new URL(a.slice(L.length),V+'new/').href;return r.slice(V.length)}}catch(e){}return null}
function url(u){var k=key(u);if(k==null||!F[k])return null;if(U[k])return U[k];var d=F[k],b=atob(d[1]),n=b.length,x=new Uint8Array(n);for(var i=0;i<n;i++)x[i]=b.charCodeAt(i);F[k]=[d[0],''];return U[k]=URL.createObjectURL(new Blob([x],{type:d[0]}))}
window.__khVfsUrl=url;
var f0=window.fetch;window.fetch=function(i,o){var u=typeof i==='string'?i:i&&i.url,b=u&&url(u);return f0.call(this,b||i,o)};
var X=XMLHttpRequest.prototype,o0=X.open;X.open=function(m,u){var b=url(u);arguments[1]=b||u;return o0.apply(this,arguments)};
function wrap(P,prop){var d=Object.getOwnPropertyDescriptor(P,prop);Object.defineProperty(P,prop,{configurable:true,enumerable:d.enumerable,get:function(){return d.get.call(this)},set:function(v){var b=url(v);d.set.call(this,b||v)}})}
wrap(HTMLImageElement.prototype,'src');wrap(HTMLScriptElement.prototype,'src');
var W=window.Worker;window.Worker=function(u,o){var b=url(u);return new W(b||u,o)};window.Worker.prototype=W.prototype;
if(navigator.serviceWorker){try{navigator.serviceWorker.register=function(){return Promise.reject(new Error('단일 HTML: 서비스 워커 없음'))}}catch(e){}}
window.__khRun=function(s){var e=document.createElement('script');e.async=false;e.src=new URL(s,V+'new/').href;document.head.appendChild(e)};
})();</script>`;
// 데이터: 파일마다 한 줄(브라우저가 문자열로만 읽고 풀지 않음)
let data = '', raw = 0; const list = [];
for (const r of files.sort()) { const b = patch(r, fs.readFileSync(path.join(ROOT, r))); raw += b.length; list.push([r, b.length]); data += `KHVFS[${JSON.stringify(r)}]=[${JSON.stringify(MIME[ext(r)])},"${b.toString('base64')}"];\n`; }
const vfs = `<script>${data}</script>`;
const headAt = page.search(/<head[^>]*>/i); if (headAt < 0) throw new Error('<head> 없음');
const hEnd = page.indexOf('>', headAt) + 1;
const out = page.slice(0, hEnd) + '\n' + HOOK + '\n' + vfs + '\n' + page.slice(hEnd);
const dist = path.join(ROOT, 'dist'); fs.mkdirSync(dist, { recursive: true });
const name = `kapehorn-tower-3d_${VER}.html`, fp = path.join(dist, name); fs.writeFileSync(fp, out);
const deliver = path.resolve(ROOT, '../../deliverables'); fs.mkdirSync(deliver, { recursive: true }); fs.copyFileSync(fp, path.join(deliver, name));
const sha = crypto.createHash('sha1').update(out).digest('hex');
const ext2 = [...new Set((out.match(/https?:\/\/(?!kh\.vfs)[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)<]*/gi) || []).map(u => u.replace(/^(https?:\/\/[^/]+).*/, '$1')))].sort();
const top = list.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([r, n]) => `${r} ${(n / 1048576).toFixed(1)}MB`);
fs.writeFileSync(path.join(dist, name.replace(/\.html$/, '.json')), JSON.stringify({ ver: VER, file: name, bytes: out.length, sha1: sha, files: files.length, rawBytes: raw, externalHosts: ext2, biggest: top }, null, 1));
console.log(`${name} ${(out.length / 1048576).toFixed(1)}MB (파일 ${files.length}개, 원본 ${(raw / 1048576).toFixed(1)}MB) SHA-1 ${sha}`);
console.log('가장 큰 파일:', top.join(', '));
console.log('본문에 남은 바깥 주소(주석 포함):', ext2.join(' '));
console.log('복사:', path.join(deliver, name));
