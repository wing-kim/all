/*
  케이프혼타워 실사 3D 자산 저장소(서비스 워커) — new/kh-pr-sw.js
  - photoreal/kh-photoreal.js 가 등록한다(Wing 페이지 3d-model.html 은 고치지 않는다). 페이지와 같은 폴더(new/)에 있어야 그 페이지의 요청을 받을 수 있다.
  - photoreal/prefetch.json 의 파일별 해시(hash)로 Cache Storage 에 보관한다: 같은 해시면 네트워크 없이 바로 주고,
    배포로 해시가 바뀐 파일만 새로 받는다(옛 항목은 지운다). 목록에 없는 파일(실사 3D 코드, Wing·XR 파일)은 손대지 않는다.
  - 페이지를 열 때마다 목록을 네트워크에서 새로 읽으므로 배포 직후에도 새 파일을 쓴다.
*/
const ROOT = new URL('../photoreal/', self.location).pathname, CACHE = 'khpr-assets';
let map = null, mapP = null;
function loadMap() {
  return mapP = fetch(ROOT + 'prefetch.json?sw=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (j && j.hash) { map = j.hash; prune(); } return map; }).catch(() => map);
}
async function prune() {
  const c = await caches.open(CACHE), keys = await c.keys();
  await Promise.all(keys.map(k => { const u = new URL(k.url), rel = u.pathname.slice(ROOT.length); return map[rel] === u.searchParams.get('h') ? null : c.delete(k); }));
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const q = e.request, u = new URL(q.url);
  if (q.method !== 'GET' || u.origin !== self.location.origin) return;
  if (q.mode === 'navigate') { loadMap(); return; }   // 페이지를 열 때 목록 새로 읽기(페이지 자체는 그대로 네트워크)
  if (!u.pathname.startsWith(ROOT)) return;
  const rel = u.pathname.slice(ROOT.length);
  if (rel === 'prefetch.json') return;
  e.respondWith(serve(q, rel));
});
async function serve(q, rel) {
  const m = map || await (mapP || loadMap());
  const h = m && m[rel];
  if (!h) return fetch(q);
  const c = await caches.open(CACHE), key = ROOT + rel + '?h=' + h;
  const hit = await c.match(key); if (hit) return hit;
  const r = await fetch(q);
  if (r.ok && r.status === 200) c.put(key, r.clone()).catch(() => {});
  return r;
}
