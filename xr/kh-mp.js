/* 케이프혼타워 멀티플레이: 같은 방 링크로 들어온 2～6명이 한 공간에서 함께 보기
 * - 연결: Trystero(서버 없는 WebRTC, 공개 Nostr 중계망으로 서로 찾기). 무료, 우리 서버 없음
 * - 아바타(머리·몸·양손·이름표), 음성(거리 음량 또는 입체 음향), 레이저 포인터, 지점 표시(핑)
 * - 디자인: 방장의 Wing 패널 상태(라디오·체크·슬라이더·색상·해 시각)를 모두에게 맞춤
 * - 모이기: 모두 내 곁으로 / 그 사람에게 가기(층 포함)
 * kh-xr.js 의 '멀티플레이' 버튼을 누를 때만 이 파일과 통신 라이브러리를 받는다. */
(function () {
  'use strict';
  const X = window.KHXRLayer;
  if (!X || !X.K) { alert('3D 화면이 아직 준비되지 않았습니다. 잠시 뒤 다시 눌러 주세요.'); return; }
  const SRC = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('./', SRC).href;
  const Q = new URLSearchParams(location.search);
  const T = window.THREE, K = X.K, S = X.state, scene = K.scene;
  const MAX = Math.max(2, +(Q.get('mpmax') || 6));     // 한 방 최대 인원(시험용으로만 바꿈)
  const APP = 'kapehorn-tower-xr-v1';
  const FONT = '"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  const COLORS = ['#e8833a', '#4fa3e0', '#6cc070', '#d55fb0', '#e0c341', '#8f7ae6'];
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const log = (...a) => { X.log.push('[mp] ' + a.join(' ')); console.log('[khmp]', ...a); };
  const toast = m => { if (X.ui && S.session) X.ui.toast(m); Panel.note(m); };
  const r3 = v => Math.round(v * 1000) / 1000;
  const colorOf = id => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0; return COLORS[Math.abs(h) % COLORS.length]; };

  const M = window.KHMP = X.mp = {
    joined: false, joining: false, roomId: Q.get('room') || '', peers: new Map(), host: null, following: true,
    laser: false, pointing: false, mic: null, micOn: true, spatial: !!X.store.get('mpSpatial', false), name: X.store.get('mpName', ''),
    me: null, room: null, A: {}, stats: { sent: 0, recv: 0 }
  };

  /* ================= 1. 연결 ================= */
  async function join() {
    if (M.joined || M.joining) return;
    M.name = (Panel.nameVal() || M.name || ('참가자 ' + Math.floor(Math.random() * 90 + 10))).slice(0, 14); X.store.set('mpName', M.name);
    const wantMic = Panel.wantMic();     // 패널을 다시 그리기 전에 입력값을 읽어 둔다
    M.joining = true; Panel.render();
    try {
      const Tr = await import(BASE + 'vendor/trystero-nostr-0.25.4.min.mjs');
      if (!M.roomId) M.roomId = Math.random().toString(36).slice(2, 8);
      const u = new URL(location.href); u.searchParams.set('room', M.roomId); history.replaceState(null, '', u);
      M.me = { id: Tr.selfId, since: Date.now() };
      M.color = colorOf(M.me.id);
      // 음성: 버튼을 누른 이 순간(사용자 동작)에 마이크와 소리 재생을 연다. 거부해도 듣기만으로 참가
      M.ctx = new (window.AudioContext || window.webkitAudioContext)(); M.ctx.resume && M.ctx.resume();
      if (wantMic) {
        try { M.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); M.micOn = true; Voice.meter(M.me.id, M.mic); }
        catch (e) { M.mic = null; Panel.note('마이크를 쓸 수 없어 듣기만 합니다 (' + e.name + ')'); }
      } else M.micOn = false;
      const room = M.room = Tr.joinRoom({ appId: APP, relayConfig: { redundancy: 4, warnOnRelayFailure: false } }, 'khtower-' + M.roomId);
      ['hi', 'pose', 'dsg', 'ctl', 'go', 'ping', 'st'].forEach(n => { M.A[n] = room.makeAction(n); });   // 이름은 12바이트 이하
      M.A.hi.onMessage = (d, { peerId }) => Peers.hello(peerId, d);
      M.A.pose.onMessage = (d, { peerId }) => { M.stats.recv++; const p = M.peers.get(peerId); if (p) { p.pose = d; p.t = performance.now(); } };
      M.A.dsg.onMessage = (d, { peerId }) => Design.recv(peerId, d);
      M.A.ctl.onMessage = (d, { peerId }) => Design.setHost(d.h, peerId);
      M.A.go.onMessage = (d, { peerId }) => Gather.recv(peerId, d);
      M.A.ping.onMessage = (d, { peerId }) => Ping.show(d.p, (M.peers.get(peerId) || {}).color || '#fff', (M.peers.get(peerId) || {}).name || '');
      M.A.st.onMessage = (d, { peerId }) => { const p = M.peers.get(peerId); if (p) { Object.assign(p, d); Avatar.tag(p); Panel.render(); X.ui && X.ui.dirty(); } };
      room.onPeerJoin = id => {
        Peers.add(id);
        M.A.hi.send(hello(), { target: id });
        Design.lastSent = '';     // 방장이면 새로 온 사람에게 지금 디자인을 곧바로 보냄
        if (M.mic) room.addStream(M.mic, { target: id });
      };
      room.onPeerLeave = id => Peers.remove(id);
      room.onPeerStream = (stream, id) => Voice.attach(id, stream);
      M.host = M.me.id; M.joined = true; M.joining = false;
      X.hooks.push(tick); requestAnimationFrame(screenLoop);
      addEventListener('pagehide', leave);
      Design.watchLocal();
      log('방 참가', M.roomId, M.me.id);
      Panel.render(); X.ui && X.ui.dirty();
    } catch (e) {
      M.joining = false; Panel.render(); Panel.note('연결하지 못했습니다: ' + (e.message || e)); log('참가 실패', e.message || e);
    }
  }
  function hello() { return { name: M.name, since: M.me.since, mic: !!(M.mic && M.micOn), host: M.host, dev: device() }; }
  function device() { return S.session ? (S.mode === 'fig' ? 'fig' : 'vr') : (matchMedia('(pointer:coarse)').matches ? 'mobile' : 'pc'); }
  function leave() {
    if (!M.joined) return;
    try { M.room.leave(); } catch (e) {}
    if (M.mic) M.mic.getTracks().forEach(t => t.stop());
    [...M.peers.keys()].forEach(id => Peers.remove(id, true));
    Laser.clear(); Ping.clear();
    const i = X.hooks.indexOf(tick); if (i >= 0) X.hooks.splice(i, 1);
    if (M.ctx) M.ctx.close().catch(() => {});
    Object.assign(M, { joined: false, room: null, mic: null, ctx: null, host: null, laser: false, pointing: false });
    removeEventListener('pagehide', leave);
    Panel.render(); X.ui && X.ui.dirty(); log('방 나감');
  }
  M.join = join; M.leave = leave;

  /* ================= 2. 참가자 ================= */
  const Peers = {
    add(id) {
      if (M.peers.has(id)) return M.peers.get(id);
      const p = { id, name: '연결 중', since: Infinity, color: colorOf(id), pose: null, t: 0, mic: false, dev: '', speaking: false };
      M.peers.set(id, p); Avatar.make(p); Panel.render(); return p;
    },
    hello(id, d) {
      const p = Peers.add(id), first = p.since === Infinity;
      Object.assign(p, { name: String(d.name || '참가자').slice(0, 14), since: +d.since || Date.now(), mic: !!d.mic, dev: d.dev || '' });
      if (p.dev === 'pc' || p.dev === 'mobile') p.scr = p.dev;
      Peers.recolor(); Avatar.tag(p);
      // 늦게 들어온 사람이 정원을 넘기면 스스로 나간다
      const older = [...M.peers.values()].filter(q => q.since < M.me.since).length;
      if (older >= MAX) { leave(); Panel.note('방이 가득 찼습니다 (최대 ' + MAX + '명)'); return; }
      // 방장: 상대가 알려 준 방장이 나보다 먼저 들어온 사람이면 따른다
      if (first) Design.electFrom(d.host);
      if (first) toast(p.name + ' 님이 들어왔습니다');
      Panel.render(); X.ui && X.ui.dirty();
    },
    remove(id, quiet) {
      const p = M.peers.get(id); if (!p) return;
      Avatar.drop(p); Voice.drop(p); M.peers.delete(id);
      if (!quiet) toast(p.name + ' 님이 나갔습니다');
      if (M.host === id) Design.electOldest();
      Peers.recolor(); Panel.render(); X.ui && X.ui.dirty();
    },
    list() { return [...M.peers.values()].sort((a, b) => a.since - b.since); },
    // 들어온 순서대로 서로 다른 색(누가 보든 같은 순서라 색도 같다)
    recolor() {
      const all = [{ id: M.me.id, since: M.me.since, me: true }].concat(Peers.list().filter(p => p.since !== Infinity));
      all.sort((a, b) => a.since - b.since || (a.id < b.id ? -1 : 1));
      all.forEach((o, i) => {
        const c = COLORS[i % COLORS.length];
        if (o.me) { if (M.color !== c) { M.color = c; if (Laser.mine) Laser.paint(Laser.mine, c); } return; }
        const p = M.peers.get(o.id); if (!p || p.color === c) return;
        p.color = c; Avatar.paint(p); const L = Laser.lines.get(p.id); if (L) Laser.paint(L, c);
      });
    }
  };

  /* ================= 3. 내 자세 보내기 ================= */
  const tmpP = V(0, 0, 0), tmpQ = new T.Quaternion();
  function pack(o) { o.getWorldPosition(tmpP); o.getWorldQuaternion(tmpQ); return [r3(tmpP.x), r3(tmpP.y), r3(tmpP.z), r3(tmpQ.x), r3(tmpQ.y), r3(tmpQ.z), r3(tmpQ.w)]; }
  function myPose() {
    const li = K.I && K.I.on ? K.I.li : -1;
    if (S.session) {
      const d = { m: S.mode === 'fig' ? 2 : 1, li, h: pack(X.xrCam), l: 0, r: 0, z: 0, f: r3(X.rig.position.y) };
      for (const c of X.ctrls) { const u = c.userData; if (!u.src) continue; const k = u.hand === 'left' ? 'l' : 'r'; d[k] = pack(c); }
      if (M.laser && S.mode === 'vr') d.z = Laser.hit ? [r3(Laser.hit.x), r3(Laser.hit.y), r3(Laser.hit.z)] : 0;
      return d;
    }
    K.camera.updateMatrixWorld();
    return { m: 0, li, h: pack(K.camera), l: 0, r: 0, z: 0, f: li >= 0 ? r3(X.floorY(K.LEVELS[li])) : 0 };
  }
  let lastSend = 0, lastSig = '', lastBeat = 0;
  function sendPose(now) {
    if (now - lastSend < 66) return;      // 초당 약 15회
    lastSend = now;
    const d = myPose(), sig = JSON.stringify(d);
    if (sig === lastSig && now - lastBeat < 1000) return;   // 그대로면 1초에 한 번만
    lastSig = sig; lastBeat = now; M.A.pose.send(d); M.stats.sent++;
  }

  /* ================= 4. 아바타 ================= */
  const Avatar = {
    make(p) {
      const col = new T.Color(p.color);
      const g = new T.Group(); g.name = 'khmp-av'; g.userData.khxr = true; g.visible = false;
      const mat = new T.MeshStandardMaterial({ color: col, roughness: 0.55, emissive: col.clone().multiplyScalar(0.3) });
      const head = new T.Mesh(new T.SphereGeometry(0.12, 20, 14), mat); head.scale.set(1, 1.12, 1.05);
      const visor = new T.Mesh(new T.BoxGeometry(0.17, 0.065, 0.06), new T.MeshStandardMaterial({ color: 0x14181a, roughness: 0.25, metalness: 0.4 })); visor.position.set(0, 0.015, -0.1);
      const hb = new T.Group(); hb.add(head, visor); g.add(hb);
      const body = new T.Mesh(new T.CylinderGeometry(0.15, 0.12, 0.55, 16), mat); g.add(body);
      const hands = [0, 1].map(() => { const h = new T.Mesh(new T.BoxGeometry(0.05, 0.035, 0.11), mat); h.visible = false; g.add(h); return h; });
      const tagC = document.createElement('canvas'); tagC.width = 512; tagC.height = 128;
      const tag = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(tagC), depthTest: false, transparent: true })); tag.scale.set(0.62, 0.155, 1); tag.renderOrder = 1003; g.add(tag);
      g.traverse(o => { o.userData.khxr = true; });
      scene.add(g);
      p.av = { g, hb, body, hands, tag, tagC, mat, s: { h: null, q: new T.Quaternion(), l: null, r: null } };
      Avatar.tag(p);
    },
    tag(p) {
      if (!p.av) return;
      const c = p.av.tagC, g = c.getContext('2d');
      g.clearRect(0, 0, 512, 128);
      g.fillStyle = 'rgba(14,18,20,.82)'; g.beginPath(); g.roundRect ? g.roundRect(4, 14, 504, 100, 50) : g.rect(4, 14, 504, 100); g.fill();
      g.fillStyle = p.color; g.beginPath(); g.arc(64, 64, p.speaking ? 30 : 22, 0, Math.PI * 2); g.fill();
      if (p.speaking) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); }
      g.fillStyle = '#fff'; g.font = '700 46px ' + FONT; g.fillText(p.name, 108, 70, 300);
      const sub = [M.host === p.id ? '방장' : '', { pc: 'PC', mobile: '모바일', fig: '모형', vr: '' }[p.dev] || '', p.mic ? '' : '음소거'].filter(Boolean).join(' · ');
      g.fillStyle = '#c9c6be'; g.font = '500 28px ' + FONT; g.fillText(sub, 108, 104, 390);
      p.av.tag.material.map.needsUpdate = true;
    },
    update(p, dt, eye) {
      const a = p.av, d = p.pose; if (!a) return;
      const dev = d && d.m === 1 ? 'vr' : d && d.m === 2 ? 'fig' : (p.dev === 'vr' || p.dev === 'fig' ? p.scr || 'pc' : p.dev);
      if (d && dev !== p.dev) { if (d.m === 0) p.scr = dev; p.dev = dev; Avatar.tag(p); Panel.render(); X.ui && X.ui.dirty(); }
      if (!d || !d.h || d.m === 2) { a.g.visible = false; return; }   // 모형 보기 중인 사람은 거인이 되므로 몸은 숨기고 레이저·핑만
      a.g.visible = true;
      const k = 1 - Math.exp(-dt * 14), s = a.s;
      const hp = V(d.h[0], d.h[1], d.h[2]), hq = new T.Quaternion(d.h[3], d.h[4], d.h[5], d.h[6]);
      if (!s.h) s.h = hp.clone(); else s.h.lerp(hp, k);
      s.q.slerp(hq, k);
      // 피규어로 보는 내 화면에서는 작은 모형 위의 사람이 보이도록 키운다
      const big = S.session && S.mode === 'fig' ? Math.max(1, X.rig.scale.x * 0.04) : 1;
      a.g.position.copy(s.h); a.g.scale.setScalar(big);
      a.hb.quaternion.copy(s.q);
      const e = new T.Euler().setFromQuaternion(s.q, 'YXZ');
      a.body.rotation.set(0, e.y, 0); a.body.position.set(0, -0.48, 0);
      a.body.visible = d.m !== 0;
      a.tag.position.set(0, 0.3, 0);
      const far = eye ? Math.min(8, Math.max(1, eye.distanceTo(s.h) / 5)) : 1;   // 멀어도 이름표가 읽히게(5m 넘으면 거리만큼 키움)
      a.tag.scale.set(0.62 * far, 0.155 * far, 1); a.tag.position.y = 0.22 + 0.08 * far;
      ['l', 'r'].forEach((key, i) => {
        const v = d[key], h = a.hands[i];
        if (!v) { h.visible = false; return; }
        const was = h.visible; h.visible = true;
        const lp = V(v[0], v[1], v[2]).sub(s.h).divideScalar(big);
        if (!s[key] || !was) s[key] = lp.clone(); else s[key].lerp(lp, k);
        h.position.copy(s[key]); h.quaternion.set(v[3], v[4], v[5], v[6]);
      });
      Laser.remote(p, d);
    },
    paint(p) { if (!p.av) return; const c = new T.Color(p.color); p.av.mat.color.copy(c); p.av.mat.emissive.copy(c).multiplyScalar(0.3); Avatar.tag(p); },
    drop(p) { if (p.av) { scene.remove(p.av.g); p.av.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); p.av = null; } Laser.drop(p); }
  };

  /* ================= 5. 레이저 포인터(VR) ================= */
  const Laser = {
    hit: null, mine: null, lines: new Map(), t: 0,
    mk(color) {
      const ln = new T.Line(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)), new T.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false }));
      const dot = new T.Mesh(new T.SphereGeometry(0.07, 14, 10), new T.MeshBasicMaterial({ color, depthTest: false, transparent: true }));
      ln.renderOrder = dot.renderOrder = 1001; ln.frustumCulled = false;
      const g = new T.Group(); g.add(ln, dot); g.userData.khxr = true; ln.userData.khxr = dot.userData.khxr = true; g.visible = false; scene.add(g);
      return { g, ln, dot };
    },
    paint(L, c) { L.ln.material.color.set(c); L.dot.material.color.set(c); },
    set(L, a, b) { const pa = L.ln.geometry.attributes.position; pa.setXYZ(0, a.x, a.y, a.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true; L.dot.position.copy(b); L.g.visible = true; },
    local(now) {   // 내 오른손 레이저: 10회/초로 맞는 곳을 찾는다
      const c = X.ctrls.find(c => c.userData.src && c.userData.hand === 'right') || X.ctrls.find(c => c.userData.src);
      if (!M.laser || !S.session || S.mode !== 'vr' || !c) { if (this.mine) this.mine.g.visible = false; this.hit = null; return; }
      const o = V(0, 0, 0).setFromMatrixPosition(c.matrixWorld), dir = V(0, 0, -1).applyMatrix4(new T.Matrix4().extractRotation(c.matrixWorld)).normalize();
      if (now - this.t > 100) { this.t = now; const h = X.firstSolid(o, dir, 300); this.hit = h ? h.point.clone() : o.clone().addScaledVector(dir, 40); }
      if (!this.mine) this.mine = this.mk(M.color);
      this.set(this.mine, o, this.hit);
    },
    remote(p, d) {
      let L = this.lines.get(p.id);
      if (!d.z || !d.r) { if (L) L.g.visible = false; return; }
      if (!L) { L = this.mk(p.color); this.lines.set(p.id, L); }
      this.set(L, V(d.r[0], d.r[1], d.r[2]), V(d.z[0], d.z[1], d.z[2]));
    },
    drop(p) { const L = this.lines.get(p.id); if (L) { scene.remove(L.g); this.lines.delete(p.id); } },
    clear() { [...this.lines.keys()].forEach(id => this.drop({ id })); if (this.mine) { scene.remove(this.mine.g); this.mine = null; } this.hit = null; }
  };
  M.toggleLaser = () => { M.laser = !M.laser; toast(M.laser ? '레이저 포인터 켜짐 (모두에게 보임)' : '레이저 포인터 꺼짐'); X.ui && X.ui.dirty(); };

  /* ================= 6. 지점 표시(핑): 화면 사용자는 클릭으로 ================= */
  const Ping = {
    list: [],
    show(p, color, name) {
      if (!p) return;
      const g = new T.Group(); g.userData.khxr = true;
      const ring = new T.Mesh(new T.RingGeometry(0.35, 0.5, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color, transparent: true, depthTest: false, side: T.DoubleSide }));
      const beam = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 4, 8).translate(0, 2, 0), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthTest: false }));
      ring.renderOrder = beam.renderOrder = 1001; g.add(ring, beam); g.traverse(o => { o.userData.khxr = true; });
      g.position.set(p[0], p[1] + 0.03, p[2]); scene.add(g);
      this.list.push({ g, t0: performance.now() });
      if (name) toast(name + ' 님이 가리킨 곳');
    },
    update(now) {
      this.list = this.list.filter(e => {
        const a = (now - e.t0) / 1000; if (a > 6) { scene.remove(e.g); e.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); return false; }
        const s = 1 + 0.25 * Math.sin(a * 6); e.g.children[0].scale.set(s, 1, s);
        e.g.children.forEach(o => { o.material.opacity = Math.min(1, (6 - a) / 1.5) * (o === e.g.children[1] ? 0.7 : 1); });
        return true;
      });
    },
    clear() { this.list.forEach(e => scene.remove(e.g)); this.list = []; }
  };
  // 화면(PC·모바일): '가리키기'를 켜고 장면을 누르면 그 지점을 모두에게 표시
  function screenPick(ev) {
    if (!M.joined || !M.pointing || S.session) return;
    const cv = K.renderer.domElement, r = cv.getBoundingClientRect();
    const nd = new T.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    const rc = new T.Raycaster(); rc.setFromCamera(nd, K.camera);
    const h = X.firstSolid(rc.ray.origin, rc.ray.direction, 5000); if (!h) return;
    const p = [r3(h.point.x), r3(h.point.y), r3(h.point.z)];
    Ping.show(p, M.color, ''); M.A.ping.send({ p });
    M.pointing = false; Panel.render();
  }
  K.renderer.domElement.addEventListener('pointerup', screenPick);
  M.ping = p => { Ping.show(p, M.color, ''); if (M.joined) M.A.ping.send({ p }); };

  /* ================= 7. 음성 ================= */
  const Voice = {
    meters: new Map(),
    attach(id, stream) {
      const p = Peers.add(id); Voice.drop(p);
      // 크롬은 원격 음성을 audio 요소에 붙여야 소리가 흐른다. 거리 음량 모드는 이 요소로 바로 재생(에코 제거가 확실한 경로)
      const el = new Audio(); el.srcObject = stream; el.autoplay = true; el.playsInline = true; el.muted = M.spatial; el.play().catch(() => {});
      p.audio = { el, stream };
      if (M.spatial && M.ctx) {
        const src = M.ctx.createMediaStreamSource(stream), gain = M.ctx.createGain(), pan = M.ctx.createPanner();
        Object.assign(pan, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1, rolloffFactor: 0 });   // 방향만 입체로, 거리 감쇠는 아래에서 직접(멀어도 대화가 끊기지 않게)
        src.connect(gain).connect(pan).connect(M.ctx.destination);
        Object.assign(p.audio, { src, gain, pan });
      }
      Voice.meter(id, stream);
      p.mic = true; Avatar.tag(p); Panel.render();
    },
    meter(id, stream) {
      if (!M.ctx) return;
      try { const an = M.ctx.createAnalyser(); an.fftSize = 512; M.ctx.createMediaStreamSource(stream).connect(an); Voice.meters.set(id, { an, buf: new Uint8Array(512), lv: 0 }); } catch (e) {}
    },
    level(id) {
      const m = Voice.meters.get(id); if (!m) return 0;
      m.an.getByteTimeDomainData(m.buf); let s = 0; for (let i = 0; i < m.buf.length; i += 4) { const v = (m.buf[i] - 128) / 128; s += v * v; }
      m.lv = Math.max(Math.sqrt(s / (m.buf.length / 4)), m.lv * 0.85); return m.lv;
    },
    update() {
      const me = listener(); if (!me) return;
      const ctx = M.ctx, L = ctx && ctx.listener;
      if (L && M.spatial) {
        const f = V(0, 0, -1).applyQuaternion(me.q), u = V(0, 1, 0).applyQuaternion(me.q);
        if (L.positionX) { L.positionX.value = me.p.x; L.positionY.value = me.p.y; L.positionZ.value = me.p.z; L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = u.x; L.upY.value = u.y; L.upZ.value = u.z; }
        else { L.setPosition(me.p.x, me.p.y, me.p.z); L.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
      }
      for (const p of M.peers.values()) {
        const a = p.audio; if (!a) continue;
        const hp = p.av && p.av.s.h; const d = hp ? hp.distanceTo(me.p) : 3;
        const vol = Math.max(0.45, Math.min(1, 4 / Math.max(d, 0.1)));   // 4m 안은 그대로, 멀어져도 45% 아래로는 줄이지 않음
        if (a.pan) { if (hp) { a.pan.positionX ? (a.pan.positionX.value = hp.x, a.pan.positionY.value = hp.y, a.pan.positionZ.value = hp.z) : a.pan.setPosition(hp.x, hp.y, hp.z); } a.gain.gain.value = vol; }
        else a.el.volume = vol;
      }
    },
    drop(p) { const a = p && p.audio; if (!a) return; try { a.el.pause(); a.el.srcObject = null; if (a.src) a.src.disconnect(); } catch (e) {} p.audio = null; Voice.meters.delete(p.id); },
    rebuild() { for (const p of M.peers.values()) if (p.audio) Voice.attach(p.id, p.audio.stream); }
  };
  function listener() {
    if (S.session) return { p: X.xrCam.getWorldPosition(V(0, 0, 0)), q: X.xrCam.getWorldQuaternion(new T.Quaternion()) };
    return { p: K.camera.getWorldPosition(V(0, 0, 0)), q: K.camera.getWorldQuaternion(new T.Quaternion()) };
  }
  M.setMic = on => {
    if (!M.mic) { Panel.note('마이크가 연결되지 않았습니다. 나갔다가 마이크를 켜고 다시 참가해 주세요.'); return; }
    M.micOn = on; M.mic.getAudioTracks().forEach(t => { t.enabled = on; });
    if (M.joined) M.A.st.send({ mic: on }); Panel.render(); X.ui && X.ui.dirty();
  };
  M.setSpatial = on => { M.spatial = on; X.store.set('mpSpatial', on); Voice.rebuild(); Panel.render(); X.ui && X.ui.dirty(); };

  /* ================= 8. 디자인 맞추기(방장 기준) ================= */
  const SKIP_R = new Set(['vwm']), SKIP_C = new Set(['t-hq', 't-ao', 't-labels', 't-cxlab']), RANGES = ['c-mix', 'c-floors', 'c-h1', 'c-ht'];
  const Design = {
    applying: false, lastSent: '', lastSentT: 0, lastPoll: 0, pending: null,
    snap() {
      const P = document.getElementById('panel'); if (!P) return null;
      const r = {}, c = {}, g = {}, w = {};
      P.querySelectorAll('input[type=radio]').forEach(i => { if (!SKIP_R.has(i.name) && i.checked) r[i.name] = i.value; });
      if (r.vmode === 'photo') delete r.vmode;     // 실사 사진 보기는 기기마다 따로
      P.querySelectorAll('input[type=checkbox]').forEach(i => { if (i.id && !SKIP_C.has(i.id)) c[i.id] = i.checked; });
      RANGES.forEach(id => { const e = document.getElementById(id); if (e) g[id] = e.value; });
      P.querySelectorAll('[id^=sw-]').forEach(b => { w[b.id] = Design.swIdx(b); });
      const R3 = K.R3D, sd = document.getElementById('sun-date'), sh = document.getElementById('sun-hour');
      const sun = R3 && R3.custom && sd && sh ? { d: sd.value, h: sh.value } : null;
      return { r, c, g, w, sun };
    },
    swIdx(b) { return [...b.querySelectorAll('button')].findIndex(x => x.classList.contains('on') || x.getAttribute('aria-pressed') === 'true'); },
    apply(d) {
      const P = document.getElementById('panel'); if (!P || !d) return;
      this.applying = true;
      try {
        for (let pass = 0; pass < 2; pass++) {
          if (pass && JSON.stringify(this.snap()) === JSON.stringify(d)) break;
          P.querySelectorAll('input[type=radio]').forEach(i => { if (d.r[i.name] === i.value && !i.checked) i.click(); });
          P.querySelectorAll('input[type=checkbox]').forEach(i => { if (i.id in d.c && i.checked !== d.c[i.id]) i.click(); });
          RANGES.forEach(id => { const e = document.getElementById(id); if (e && id in d.g && e.value !== d.g[id]) { e.value = d.g[id]; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } });
          P.querySelectorAll('[id^=sw-]').forEach(b => { const k = d.w[b.id]; if (k >= 0 && Design.swIdx(b) !== k) { const bt = b.querySelectorAll('button')[k]; if (bt) bt.click(); } });
          if (d.sun) {
            const sd = document.getElementById('sun-date'), sh = document.getElementById('sun-hour'), R3 = K.R3D;
            if (sd && sh && (!R3.custom || sd.value !== d.sun.d || Math.abs(+sh.value - +d.sun.h) > 0.01)) { sd.value = d.sun.d; sh.value = d.sun.h; const a = document.getElementById('sun-apply'); if (a) a.click(); }
          }
        }
      } finally { this.applying = false; }
      X.ui && X.ui.dirty();
    },
    tick(now) {
      if (!M.joined || M.host !== M.me.id || now - this.lastPoll < 400) return;
      this.lastPoll = now;
      const d = this.snap(); if (!d) return; const s = JSON.stringify(d);
      if (s !== this.lastSent || now - this.lastSentT > 5000) { this.lastSent = s; this.lastSentT = now; M.A.dsg.send(d); }
    },
    recv(from, d) {
      if (from !== M.host) return;
      if (!M.following) { this.pending = d; return; }
      if (JSON.stringify(this.snap()) !== JSON.stringify(d)) { this.apply(d); log('디자인 맞춤', from); }
    },
    // 따라가는 중에 내가 패널을 직접 바꾸면 따라가기를 끈다(바로 되돌려지지 않게)
    watchLocal() {
      if (this.watching) return; this.watching = true;
      const P = document.getElementById('panel'); if (!P) return;
      const off = e => {
        if (this.applying || !M.joined || M.host === M.me.id || !M.following) return;
        const t = e.target; if (!t || !(t.matches('input') || t.closest('[id^=sw-]') || t.id === 'sun-apply')) return;
        if (t.matches('input') && (SKIP_R.has(t.name) || SKIP_C.has(t.id))) return;
        M.following = false; toast('내 화면만 바꿉니다 (방장 디자인 따라가기 꺼짐)'); Panel.render(); X.ui && X.ui.dirty();
      };
      P.addEventListener('change', off, true); P.addEventListener('click', e => { if (e.target.closest && e.target.closest('[id^=sw-],#sun-apply')) off(e); }, true);
    },
    setHost(h, from) {
      if (!h) return; M.host = h; M.following = true; this.lastSent = '';
      const p = M.peers.get(h); toast((h === M.me.id ? '내가' : (p ? p.name + ' 님이' : '다른 사람이')) + ' 디자인을 보여 줍니다');
      M.peers.forEach(q => Avatar.tag(q)); Panel.render(); X.ui && X.ui.dirty();
    },
    take() { M.host = M.me.id; M.A.ctl.send({ h: M.me.id }); this.lastSent = ''; M.peers.forEach(q => Avatar.tag(q)); toast('이제 내 디자인을 모두에게 보여 줍니다'); Panel.render(); X.ui && X.ui.dirty(); },
    electFrom(h) {   // 먼저 있던 사람이 알려 준 방장을 따른다(나보다 먼저 들어온 사람일 때만)
      const p = h && M.peers.get(h);
      if (h === M.me.id) return;
      if (p && p.since <= M.me.since) { M.host = h; M.peers.forEach(q => Avatar.tag(q)); }
      else this.electOldest();
    },
    electOldest() {
      const all = [{ id: M.me.id, since: M.me.since }].concat([...M.peers.values()].filter(p => p.since !== Infinity));
      all.sort((a, b) => a.since - b.since || (a.id < b.id ? -1 : 1));
      M.host = all[0].id; M.peers.forEach(q => Avatar.tag(q));
    },
    follow(on) { M.following = on; if (on && this.pending) { this.apply(this.pending); this.pending = null; } Panel.render(); X.ui && X.ui.dirty(); }
  };
  M.design = Design;

  /* ================= 9. 모이기 ================= */
  const Gather = {
    // 내가 서 있는 곳(발 위치)과 바라보는 방향, 층
    here() {
      const d = myPose(), h = d.h, q = new T.Quaternion(h[3], h[4], h[5], h[6]);
      const yaw = new T.Euler().setFromQuaternion(q, 'YXZ').y;
      let foot = V(h[0], d.f, h[2]);
      if (!S.session && d.li < 0) {   // 화면 사용자가 밖에서 둘러보는 중: 카메라 아래 땅
        const g = X.firstSolid(V(h[0], 300, h[2]), V(0, -1, 0), 600); foot = V(h[0], g ? g.point.y : 0, h[2]);
      }
      return { p: [r3(foot.x), r3(foot.y), r3(foot.z)], yaw: r3(yaw), li: d.li, head: [h[0], h[1], h[2]] };
    },
    all() { if (!M.joined) return; const g = this.here(); M.A.go.send(g); toast('모두를 내 곁으로 불렀습니다'); },
    recv(from, g) {
      const ids = Peers.list().map(p => p.id).concat(M.me.id).filter(id => id !== from).sort();
      const p = M.peers.get(from); toast((p ? p.name : '다른 사람') + ' 님 곁으로 갑니다');
      this.goNear(g, ids.indexOf(M.me.id), ids.length);
    },
    to(id) { const p = M.peers.get(id); if (!p || !p.pose) return; const d = p.pose, q = new T.Quaternion(d.h[3], d.h[4], d.h[5], d.h[6]); this.goNear({ p: [d.h[0], d.f, d.h[2]], yaw: new T.Euler().setFromQuaternion(q, 'YXZ').y, li: d.li, head: d.h.slice(0, 3), screen: d.m === 0 }, 0, 1); },
    // 부른 사람 앞쪽에 반원으로 서서 그 사람을 바라본다
    goNear(g, k, n) {
      const off = n > 1 ? (k - (n - 1) / 2) * 0.55 : 0, yaw = g.yaw + off, R = 1.8;
      const c = V(g.p[0], g.p[1], g.p[2]), pos = c.clone().add(V(-Math.sin(yaw) * R, 0, -Math.cos(yaw) * R));
      const face = Math.atan2(-(c.x - pos.x), -(c.z - pos.z));
      if (S.session) { X.goTo(pos, face, g.li); return; }
      // 화면 사용자: 그 자리 눈높이에서 부른 사람 쪽을 바라봄
      const eye = pos.clone(); eye.y += 1.6; const tgt = V(g.head[0], g.head[1], g.head[2]);
      if (g.li >= 0 && K.LEVELS[g.li]) {
        if (!K.I.on) K.enterInt(); if (K.I.doll) K.setDoll(false); if (K.I.li !== g.li) K.placeLevel(g.li, true);
        K.anim = null; K.camera.position.copy(eye); K.controls.target.copy(tgt); K.controls.update && K.controls.update();
      } else {   // 밖: 궤도 카메라는 목표에 너무 가까이 갈 수 없으므로 부른 사람 머리 바로 뒤에서 그 사람이 보는 쪽을 본다
        if (K.I && K.I.on) K.exitInt();
        const f = V(-Math.sin(g.yaw), 0, -Math.cos(g.yaw)), hd = V(g.head[0], g.head[1], g.head[2]);
        const p1 = hd.clone().addScaledVector(f, -2.5).add(V(0, 0.6, 0)), t1 = hd.clone().addScaledVector(f, 25);
        K.anim = { p0: K.camera.position.clone(), t0: K.controls.target.clone(), p1, t1, s: performance.now() };
      }
    }
  };
  M.gather = () => Gather.all(); M.goToPeer = id => Gather.to(id);

  /* ================= 10. 매 프레임 ================= */
  let lastT = 0, lastSpeak = 0;
  function tick(dt, time) {
    if (!M.joined) return;
    const now = performance.now(); dt = Math.min(0.1, dt || (now - (lastT || now)) / 1000); lastT = now;
    Laser.local(now);
    sendPose(now);
    const eye = listener().p;
    for (const p of M.peers.values()) Avatar.update(p, dt, eye);
    Ping.update(now);
    Voice.update();
    Design.tick(now);
    if (now - lastSpeak > 150) {   // 말하는 사람 이름표 빛내기
      lastSpeak = now;
      for (const p of M.peers.values()) { const sp = p.mic && Voice.level(p.id) > 0.035; if (sp !== p.speaking) { p.speaking = sp; Avatar.tag(p); Panel.speak(p); } }
      const meSp = M.mic && M.micOn && Voice.level(M.me.id) > 0.035; if (meSp !== M.meSpeaking) { M.meSpeaking = meSp; Panel.speak(null); }
    }
  }
  function screenLoop() {   // 화면(PC·모바일)일 때. VR 중에는 kh-xr.js 프레임 갈고리가 부른다
    if (!M.joined) return;
    if (!S.session) tick(0, performance.now());
    requestAnimationFrame(screenLoop);
  }

  /* ================= 11. VR 메뉴 '함께' 탭 ================= */
  M.menu = () => {
    const ppl = Peers.list().map(p => ({ key: 'mp:to:' + p.id, label: p.name + (M.host === p.id ? ' (방장)' : ''), sub: [{ pc: 'PC 화면', mobile: '모바일', fig: '모형 보기', vr: 'VR' }[p.dev] || '', p.mic ? (p.speaking ? '말하는 중' : '') : '음소거', '눌러서 곁으로'].filter(Boolean).join(' · '), act: () => Gather.to(p.id) }));
    return [
      { h: '방 ' + M.roomId + ' · ' + (M.peers.size + 1) + '명 (최대 ' + MAX + ')', items: ppl.length ? ppl : [{ key: 'mp:none', label: '아직 혼자입니다', sub: 'PC에서 방 링크를 보내 주세요' }] },
      { h: '함께 보기', items: [
        { key: 'mp:gather', label: '모두 내 곁으로 모으기', act: () => Gather.all() },
        { key: 'mp:take', label: M.host === M.me.id ? '내가 디자인을 보여 주는 중' : '내 디자인을 모두에게 보여 주기', on: () => M.host === M.me.id, act: () => Design.take() },
        { key: 'mp:follow', label: '방장 디자인 따라가기', check: true, on: () => M.following, act: () => Design.follow(!M.following) },
        { key: 'mp:laser', label: '레이저 포인터 (오른쪽 스틱 누르기)', check: true, on: () => M.laser, act: () => M.toggleLaser() }] },
      { h: '음성', items: [
        { key: 'mp:mic', label: M.mic ? '마이크 켜기' : '마이크 없음 (듣기만)', check: true, on: () => !!(M.mic && M.micOn), act: () => M.setMic(!M.micOn) },
        { key: 'mp:sp', label: '입체 음향 (이어폰 권장)', check: true, on: () => M.spatial, act: () => M.setSpatial(!M.spatial) }] },
      { h: '', items: [{ key: 'mp:leave', label: '방 나가기', act: () => leave() }] }
    ];
  };

  /* ================= 12. 화면 패널(PC·모바일, VR 들어가기 전) ================= */
  const Panel = {
    el: null, msg: '',
    open() {
      if (!this.el) {
        const st = document.createElement('style');
        st.textContent = '#khmp{position:fixed;left:14px;bottom:100px;z-index:10000;width:min(320px,calc(100vw - 28px));max-height:calc(100vh - 140px);overflow:auto;background:#fff;color:#1d2321;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.22);font:14px ' + FONT + ';padding:14px 14px 12px}'
          + '#khmp h3{margin:0 0 8px;font-size:15px;color:#1f5c55;display:flex;justify-content:space-between;align-items:center}#khmp h3 button{border:0;background:none;font-size:18px;cursor:pointer;color:#666}'
          + '#khmp .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}#khmp button.b{flex:1 1 auto;padding:9px 10px;border-radius:8px;border:1px solid #1f5c55;background:#fff;color:#1f5c55;font:600 13px ' + FONT + ';cursor:pointer}#khmp button.b.p{background:#1f5c55;color:#fff}#khmp button.b.on{background:#e6f2ef}'
          + '#khmp input[type=text]{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #ccd;border-radius:8px;font:14px ' + FONT + '}#khmp label{display:flex;gap:6px;align-items:center;margin:6px 0}'
          + '#khmp ul{list-style:none;margin:6px 0;padding:0}#khmp li{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #eee}#khmp li i{width:12px;height:12px;border-radius:50%;flex:none}#khmp li i.sp{box-shadow:0 0 0 3px rgba(31,92,85,.35)}#khmp li span{flex:1}#khmp li small,#khmp .note{color:#777;font-size:12px}#khmp li button{border:0;background:#e6f2ef;color:#1f5c55;font-weight:600;border-radius:6px;padding:4px 8px;cursor:pointer;font:12px ' + FONT + '}'
          + '#khmp .note{margin-top:6px;min-height:1em}';
        document.head.appendChild(st);
        this.el = document.createElement('div'); this.el.id = 'khmp'; document.body.appendChild(this.el);
        this.el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (a) this.act(a.dataset.a, a.dataset.id); });
      }
      this.el.hidden = false; this.render();
    },
    close() { if (this.el) this.el.hidden = true; },
    nameVal() { const i = this.el && this.el.querySelector('#khmp-name'); return i ? i.value.trim() : ''; },
    wantMic() { const i = this.el && this.el.querySelector('#khmp-mic'); return i ? i.checked : true; },
    note(m) { this.msg = m; const n = this.el && this.el.querySelector('.note'); if (n) n.textContent = m; },
    speak(p) {
      if (!this.el) return;
      const i = this.el.querySelector('[data-dot="' + (p ? p.id : 'me') + '"]'); if (i) i.classList.toggle('sp', p ? p.speaking : !!M.meSpeaking);
    },
    render() {
      if (!this.el || this.el.hidden) return;
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      let h = '<h3>멀티플레이 <button data-a="close" title="닫기">✕</button></h3>';
      if (!M.joined) {
        h += '<div>같은 링크로 들어온 사람(최대 ' + MAX + '명)이 한 공간에서 함께 보고 이야기합니다. 누를 때만 연결합니다.</div>'
          + '<label style="display:block;margin-top:10px">이름<input type="text" id="khmp-name" maxlength="14" value="' + esc(M.name) + '" placeholder="예: Jack"></label>'
          + '<label><input type="checkbox" id="khmp-mic" checked> 마이크로 말하기</label>'
          + '<div class="row"><button class="b p" data-a="join"' + (M.joining ? ' disabled' : '') + '>' + (M.joining ? '연결 중…' : (M.roomId ? '방 ' + esc(M.roomId) + ' 참가하기' : '새 방 만들기')) + '</button></div>';
      } else {
        const me = '<li><i data-dot="me" style="background:' + M.color + '"' + (M.meSpeaking ? ' class="sp"' : '') + '></i><span>' + esc(M.name) + ' (나)' + (M.host === M.me.id ? ' · 방장' : '') + '</span><small>' + (M.mic ? (M.micOn ? '' : '음소거') : '듣기만') + '</small></li>';
        const ppl = Peers.list().map(p => '<li><i data-dot="' + p.id + '" style="background:' + p.color + '"' + (p.speaking ? ' class="sp"' : '') + '></i><span>' + esc(p.name) + (M.host === p.id ? ' · 방장' : '') + '</span><small>' + ({ pc: 'PC', mobile: '모바일', fig: '모형', vr: 'VR' }[p.dev] || '') + (p.mic ? '' : ' 음소거') + '</small><button data-a="to" data-id="' + p.id + '">곁으로</button></li>').join('');
        h += '<div>방 <b>' + esc(M.roomId) + '</b> · ' + (M.peers.size + 1) + '명</div>'
          + '<div class="row"><button class="b p" data-a="copy">방 링크 복사</button></div>'
          + '<ul>' + me + ppl + '</ul>'
          + (M.peers.size ? '' : '<div class="note2" style="color:#777;font-size:12px">링크를 받은 사람이 들어오면 여기에 보입니다.</div>')
          + '<div class="row"><button class="b" data-a="gather">모두 내 곁으로</button><button class="b' + (M.pointing ? ' on' : '') + '" data-a="point">' + (M.pointing ? '장면을 눌러 표시' : '지점 가리키기') + '</button></div>'
          + '<div class="row"><button class="b' + (M.host === M.me.id ? ' on' : '') + '" data-a="take">' + (M.host === M.me.id ? '내 디자인을 보여 주는 중' : '내 디자인 보여 주기') + '</button></div>'
          + '<label><input type="checkbox" data-a="follow"' + (M.following ? ' checked' : '') + (M.host === M.me.id ? ' disabled' : '') + '> 방장 디자인 따라가기</label>'
          + '<label><input type="checkbox" data-a="mic"' + (M.mic && M.micOn ? ' checked' : '') + (M.mic ? '' : ' disabled') + '> 마이크 켜기</label>'
          + '<label><input type="checkbox" data-a="spatial"' + (M.spatial ? ' checked' : '') + '> 입체 음향 (이어폰 권장)</label>'
          + '<div class="row"><button class="b" data-a="leave">방 나가기</button></div>';
      }
      h += '<div class="note">' + esc(this.msg) + '</div>';
      this.el.innerHTML = h;
    },
    act(a, id) {
      if (a === 'close') return this.close();
      if (a === 'join') return join();
      if (a === 'copy') { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => this.note('링크를 복사했습니다'), () => { prompt('이 링크를 보내 주세요', u); }); return; }
      if (a === 'to') return Gather.to(id);
      if (a === 'gather') return Gather.all();
      if (a === 'point') { M.pointing = !M.pointing; this.render(); return; }
      if (a === 'take') return Design.take();
      if (a === 'follow') return Design.follow(!M.following);
      if (a === 'mic') return M.setMic(!M.micOn);
      if (a === 'spatial') return M.setSpatial(!M.spatial);
      if (a === 'leave') return leave();
    }
  };
  M.open = () => Panel.open();
  M.panel = Panel;
  M._t = { Design, Gather, Voice, Laser, Ping, Peers, myPose };   // 자동 시험용
  log('불러옴');
})();
