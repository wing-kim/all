// 간단한 정적 서버(시험용, python3 없는 윈도우에서도): node serve.mjs <포트> [폴더]  기본 폴더는 작업 폴더(저장소 뿌리)
// qa.mjs 가 띄운다. 접속 기록은 python http.server 와 같은 모양("GET /경로 HTTP/1.1" 200)으로 표준 오류에 남긴다(sw.mjs 의 LOG 가 센다)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const PORT = +(process.argv[2] || 8791), ROOT = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.ktx2': 'image/ktx2', '.hdr': 'application/octet-stream', '.bin': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400).end(); return; }
  let f = path.join(ROOT, rel); if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  const done = code => process.stderr.write(`127.0.0.1 - - "${req.method} ${req.url} HTTP/1.1" ${code} -\n`);
  fs.stat(f, (e, st) => {
    if (!e && st.isDirectory()) { f = path.join(f, 'index.html'); try { st = fs.statSync(f); } catch (e2) { e = e2; } }
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); done(404); return; }
    const h = { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Last-Modified': st.mtime.toUTCString() };
    if (req.method === 'HEAD') { res.writeHead(200, h).end(); done(200); return; }
    res.writeHead(200, h); fs.createReadStream(f).pipe(res); done(200);
  });
}).listen(PORT, '127.0.0.1', () => console.log('serve', 'http://127.0.0.1:' + PORT, ROOT));
