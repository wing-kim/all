# Wing v107 반영 기록 (1102.o)

지니가 보낸 `케이프혼타워_3D모델_v107_env (1).html`(SHA-1 05b6a8c5ae72…, 10.1MB)은 Wing 페이지 v107에 지니 주변 환경을 넣은 파일입니다. Wing 저장소 `main`의 `new/3d-model.html`은 아직 v93이라(마지막 변경 2026-10-16 `25b111a`), Wing의 v94～v107 변경은 이 파일에서 골라냈습니다. Wing 원본이 저장소에 올라오면 이 문서의 방법으로 다시 대조합니다.

## 골라낸 방법

1. 기준 맞추기: 지니의 지난 인계(`kapehorn-env-handoff-20261102.zip`, `site/3d-model-vr.html`)는 Wing `main`의 `new/3d-model-vr.html` v93(SHA-1 3608adcb67…, 줄 끝 CRLF)에 주변 환경을 더한 판입니다. 줄 끝을 LF로 맞춘 이 파일(이하 j1102)을 공통 조상으로 씁니다.
2. 큰 데이터 빼기: v107에서 `window.KHDATA`(모델·텍스처 base64)를 자리표로 바꾼 코드 판을 만듭니다(`photoreal/tools/model/jinny-import.mjs`가 같은 일을 함).
3. 3방향 병합: `git merge-file 우리 new/3d-model.html j1102 v107코드`로 j1102→v107 변경(Wing v94～v107 + 지니 1102→v107)을 우리 파일에 얹습니다. 충돌 19곳은 손으로 풀었습니다.
4. 분류: j1102→v107 변경 덩어리 106개 중 `env-test` 주석, `kh*`·`KH*` 이름, 지니 전용 변수(RDP, SKG, KHSK, KHA2, KHA3)가 있는 덩어리는 지니, 나머지는 Wing으로 봤습니다. 같은 덩어리 안에 둘이 섞인 곳은 아래 표에서 손으로 바로잡았습니다.
5. Wing 원본이 올라오면: Wing의 v107 `new/3d-model-vr.html`과 v93을 비교한 덩어리 목록을 아래 표의 Wing 줄과 맞춰 보고, 다른 곳만 다시 봅니다.

## Wing v94～v107 반영 목록

v102 이후는 파일 안의 판 주석으로 판을 알 수 있고, 그 앞(v94～v101)은 판 표시가 없어 묶어 적습니다.

- v94～v101: 주차 방식 '자주식 실측안'(플라건축 DD 2026.10.30, `DD.make`)을 더하고 기본값으로 바꿈. 기계식·자주식1·2·3은 메뉴에서 숨김(코드는 남음), 자주식+카리프트는 준비 중(비활성). ③ 실측 탭(측량 표고·현황 레벨·지하 단면, `SRV`, 실측 보기·상세 설정 패널). 외부 디자인 26종(실사 사진 번호와 같음). 주차·외부 디자인·창을 '건물 설정' 한 카드로 접고 펼침. 시점 단추 정리(코너·측면·출입구·옥상·미성·원경 숨김). 현황 단추는 비교(현황만)로 보이고 비교 기본값은 현황만(0). 지하 4층(B4, 실측안).
- v102: 현황 탭 정리, 내부 보기 단추 정리(외부로 나가기·층 단면 보기·종단면 전체 + 더보기), 고품질 렌더·AO 항상 켬.
- v103: 우리 건물을 가리는 주변 건물을 그 시점에서만 숨김(`occl2`, 층(layer)으로 숨김).
- v104: 메뉴 순서 통일(화면 모드 → 현황·신축·실측 → 보기 방식 → 화면 표시 → 건물 설정 → 탭별 메뉴).
- v105: 화면 전체가 스크롤로 밀리지 않게 고정.
- v106: ③ 실측에서 주변 건물 불투명도.
- v107: 내부 보기(걷기) 확대·축소(휠·두 손가락), 뒷길 측량 높이와 대지 쪽 1m 경사 띠, 층 단면 보기에서 바닥을 누르면 그 자리로 들어가 걷기.

## 우리 쪽에서 맞춘 것

- 보기 방식은 우리 4가지(스케치업·렌더·실사 3D·실사)를 유지합니다. 지니 v107의 '렌더(이전)'·'렌더-실사' 단추와 가로수 체크 상자는 넣지 않았습니다.
- 지니의 내장 데이터(KHDATA)와 Draco 해독기(jsDelivr)는 쓰지 않습니다. 모델은 meshopt `.glb`, 텍스처는 KTX2와 라이트맵 아틀라스로 바꿨습니다(`docs/jinny-import.md`).
- 지니의 스케치업용 가로 묶음(도로·보도·바닥 평면색)과 유휴 미리받기는 부르지 않습니다. 첫 화면에서 가로 요소를 받지 않는 규칙(1102.l) 때문입니다. 도로(`road_env`)·바닥(`ground_fill`)·2·3구역(`a2_*`, `a3_*`, `hyundai_hs`, `singu_es`, `tw_detail`)은 실사 3D에서만 받습니다.
- 미성 일대 현재/미래 토글(`?ms=`)은 ② 신축과 ③ 실측에서 씁니다. 현황 탭(비교)은 Wing v107의 겹쳐 보기 그대로입니다.
- v103 두 번째 가림(`occl2`)은 실사 3D 동안 끕니다. 층으로 숨기는 방식이 화면 합치기의 합친 메시에 닿지 않기 때문입니다. 실사 3D에서는 첫 번째 가림(OCC)과 합치기 구간 빼기(1102.m)를 씁니다.
- 실사 3D의 우선 조합을 자주식3에서 자주식 실측안으로 바꿨습니다(Wing v107이 실측안만 보임). 실측안 빛 굽기를 새로 했습니다(`photoreal/bake/var/sch-dd`). B4는 기본 아틀라스에 빈 칸이 없어 실측안 B1 굽기를 층고만 맞춰 씁니다.
- 신사중학교: 지니 v107 학교는 실측 자리에 있고 서쪽 날개도 실측 길이(112m)라, 우리가 늘려 다시 구운 판(school410r)은 쓰지 않습니다(`photoreal/tools/model/jinny/school410r/`에 보관). 실사 3D에서는 서쪽 날개 가운데를 브이월드 실측에 맞춰 남쪽으로 7.3m 옮깁니다.

## 변경 덩어리 분류표 (j1102 → v107)

| v107 줄 | 바뀜 | 분류 | 첫 줄 |
|---|---|---|---|
| 7～24 | replace 18줄 | Wing | `&lt;style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-t` |
| 26～27 | insert 2줄 | 지니 | `&lt;link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>&lt;!-- env-test: Dr` |
| 46～46 | replace 1줄 | Wing | `html,body{height:100%;overflow:hidden}` |
| 84～87 | replace 4줄 | Wing | `.seg.four{grid-template-columns:repeat(4,1fr)}.seg.d26{grid-template-columns:1fr 1fr}.seg.` |
| 304～310 | insert 7줄 | 지니 | `&lt;script>/* 주변 환경 모델 내장본 (2026.11.03): PC에서 파일을 바로 열어도(file://) 주변 실사 모델이 보이도록 models/ 폴` |
| 318～321 | replace 4줄 | Wing | `      &lt;button id="v-corner" data-v="corner" hidden aria-pressed="true">코너 투시&lt;/button` |
| 323～325 | replace 3줄 | Wing | `      &lt;button id="v-roof" data-v="roof" hidden aria-pressed="false">옥상·태양광&lt;/button>` |
| 384～387 | replace 4줄 | Wing | `    &lt;div class="sec ctl" id="sec-era">` |
| 389～390 | replace 2줄 | Wing | `        &lt;label>&lt;input type="radio" name="era" id="era-srv" value="srv"> ③ 실측&lt;smal` |
| 395～395 | replace 1줄 | Wing | `      &lt;h2>신축과 겹쳐 비교&lt;/h2>` |
| 399～399 | replace 1줄 | Wing | `        &lt;label>&lt;input type="radio" name="mixq" value="0" checked> 현황만&lt;/label>` |
| 401～401 | replace 1줄 | Wing | `        &lt;label>&lt;input type="radio" name="mixq" value="50"> 반반&lt;/label>` |
| 405～405 | replace 1줄 | Wing | `      &lt;label class="chk">&lt;input type="checkbox" id="t-cmpapt"> 미성아파트도 현황 ↔ 재건축 겹쳐 보기` |
| 408～466 | insert 59줄 | Wing | `    &lt;/div>` |
| 485～485 | replace 1줄 | 지니 | `      &lt;div class="seg" role="radiogroup" aria-label="보기 방식">` |
| 487～488 | replace 2줄 | 지니 | `        &lt;label hidden>&lt;input type="radio" name="vmode" id="vm-render" value="render"` |
| 513～514 | replace 2줄 | Wing | `        &lt;label class="chk" id="lb-hq">&lt;input type="checkbox" id="t-hq" checked> 고품질 ` |
| 518～526 | replace 9줄 | Wing | `    &lt;div class="sec ctl newonly" id="sec-sch">` |
| 544～543 | delete 0줄 | Wing | `(삭제)       &lt;div class="glab">최상층 (6F 위)&lt;/div>` |
| 549～579 | replace 31줄 | Wing | `      &lt;h2>외부 디자인 &lt;span class="d26n">26종 · 실사 사진 번호와 같음&lt;/span>&lt;/h2>` |
| 651～651 | insert 1줄 | Wing | `      &lt;/details>` |
| 654～654 | replace 1줄 | Wing | `    &lt;div class="sec ctl newonly" id="sec-win">` |
| 678～682 | replace 5줄 | Wing | `      &lt;div class="glab">최상층 (6F 위)&lt;/div>` |
| 9033～9036 | insert 4줄 | 지니 | `// env-test: 스케치업 takes the 렌더-실사 palette — daylight sky gradient, warm paving, asphalt ro` |
| 9038～9042 | replace 5줄 | 지니 | `  const g=f=>{try{return f()}catch(e){return null}},sk=!g(()=>R3D.on),st=g(()=>skyTex);   ` |
| 9085～9086 | replace 2줄 | 지니 | `var RDP=[];   // env-test: the page's own road paint, signals, gate piers and street lamps` |
| 9109～9109 | replace 1줄 | 지니 | `    site.add(box(xe-0.2,xe+0.2,5.4,5.9,Z-0.65,Z+0.65,hd));const l=box(xe-0.22,xe-0.2,5.5,5` |
| 9141～9142 | replace 2줄 | 지니 | `  const cl=new THREE.Mesh(new THREE.BoxGeometry(.35,.02,480),new THREE.MeshBasicMaterial({` |
| 9146～9146 | replace 1줄 | 지니 | `  gr.addColorStop(0,'#7fb0d6');gr.addColorStop(.55,'#c7dcea');gr.addColorStop(1,'#eef2f1')` |
| 9622～9691 | insert 70줄 | Wing | `// ================= scheme C: 자주식 (실측안 · 플라건축 DD 2026.10.30 「대지경계·현황레벨·지하단면 검토안」) =======` |
| 10006～10006 | replace 1줄 | Wing | `const state={era:'new',scheme:'dd',floors:6,h1:5.4,ht:4.2,frame:true,g1:'skin',upSt:false,` |
| 10029～10029 | replace 1줄 | Wing | `const coreFor=L=>(L.kind==='ground'\|\|L.kind==='upper')&&!L.noCore?COREDET[state.scheme==` |
| 10416～10416 | replace 1줄 | Wing | `  SCH=state.scheme==='dd'?DD.make():state.scheme==='self'?SELF.make():MECH.make(state);` |
| 10441～10441 | replace 1줄 | Wing | `  const mech=state.scheme!=='self'&&state.scheme!=='dd';document.getElementById('sec-g1').` |
| 10444～10444 | replace 1줄 | Wing | `    if(!mech){['t-upstraight','t-skin'].forEach(id=>{const x=document.getElementById(id);x` |
| 10481～10481 | insert 1줄 | Wing | `  if(typeof SRV!=='undefined'&&SRV)SRV.labels(addLabel);` |
| 10491～10491 | replace 1줄 | Wing | `    const want=l.top?(!I.on&&curView==='top'):l.inF!=null?(I.on&&I.li===l.inF&&(I.doll\|\|` |
| 10493～10493 | replace 1줄 | Wing | `    l.el.hidden=!vis;if(vis){l.el.style.left=((tmp.x+1)/2*w)+'px';l.el.style.top=((1-tmp.y` |
| 10498～10499 | replace 2줄 | Wing | `  return {corner:{p:[-54,14+6*k,50+8*k],t:[-3,10+3*k,1]},front:{p:[-57,7+4*k,-1],t:[-2,12+` |
| 10502～10502 | replace 1줄 | Wing | `function lotVis(){if(typeof lotG!=='undefined')lotG.visible=state.era!=='new'&&state.era!=` |
| 10507～10507 | insert 1줄 | Wing | `  if(state.era==='srv'&&v==='stair'&&typeof SRV!=='undefined'){SRV.rampView();return}` |
| 10509～10509 | replace 1줄 | Wing | `  if(v==='int'){if(window.__FOV0&&camera.fov!==window.__FOV0){camera.fov=window.__FOV0;cam` |
| 10513～10517 | replace 5줄 | Wing | `  {const a=camera.aspect\|\|1;if(!window.__FOV0)window.__FOV0=camera.fov;let fov=V.fov\|\|` |
| 10544～10544 | replace 1줄 | Wing | `  const pick=(c,btn)=>{state[k]=c;btns.forEach(b=>b.setAttribute('aria-pressed',b===btn));` |
| 10785～10785 | replace 1줄 | Wing | `  document.getElementById('hint').textContent='드래그 회전 · 우클릭/두 손가락 이동 · 휠 확대';camera.up.set` |
| 10849～10849 | replace 1줄 | Wing | `function walkTo(h){I.back=0;const d=controls.target.clone().sub(camera.position),p=new THR` |
| 10852～10872 | replace 21줄 | Wing | `// v107: 내부 보기(걷기) 확대·축소 — 휠 / 두 손가락. 축소하면 먼저 화각이 넓어지고, 더 축소하면 뒤로 물러나 멀리서 봄 (도로에서 건물 전체 보기` |
| 10979～10983 | replace 5줄 | 지니 | `  // env-test: 압구정로 cars on the surveyed lanes (tools/build_road.py paint): right-hand tra` |
| 10987～10987 | replace 1줄 | 지니 | `    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.13,12,10),skin[5]);hd.position.y=1.` |
| 10995～10995 | replace 1줄 | 지니 | `    const L=new THREE.PointLight(0xffd9a0,0,26,2);L.position.set(hx,7.5,hz);R3D.props.add(` |
| 11047～11047 | replace 1줄 | 지니 | `  const sd=T.el>0?dir:new THREE.Vector3(-0.4,0.6,0.3).normalize();const big=city.visible&&` |
| 11186～11223 | replace 38줄 | 지니 | `  OCC.forEach(m=>{if(m.userData.khHide){m.visible=false;return}const h=ray.intersectBox(m.` |
| 11278～11279 | replace 2줄 | 지니 | `// models/kh-lib.js = 공유 재질 표, models/glb/&lt;id>.glb = 건물(Draco 압축, 형상·UV만), models/tex/&` |
| 11283～11290 | replace 8줄 | 지니 | `const KHCDN='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';` |
| 11293～11298 | replace 6줄 | 지니 | `  if(d.alpha){o.alphaMap=await khTex(d.alpha);o.alphaTest=d.alphaTest\|\|.5}if(d.double)o.` |
| 11307～11308 | replace 2줄 | 지니 | `  if(!(window.KH&&KH.ver&&window.KHDATA)){if(location.protocol==='file:'){console.info('en` |
| 11312～11312 | replace 1줄 | 지니 | `    const g=await khGLTF(q.id),o=g.scene,ms=[];` |
| 11317～11390 | replace 74줄 | 지니 | `    const hid=new THREE.MeshBasicMaterial({visible:false});(q.also\|\|[]).forEach(a=>{if(a` |
| 11398～11398 | replace 1줄 | 지니 | `const khGlb=async id=>{const g=await khGLTF(id),ms=[];` |
| 11416～11416 | replace 1줄 | 지니 | `  KHR.signs.forEach(k=>k.visible=on);khRDP();   /* RDP + khHide: occl() (see-through) must` |
| 11419～11419 | replace 1줄 | 지니 | `function khSeason(){const mo=R3D.custom&&R3D.cdate?R3D.cdate.getMonth()+1:{spring:4,summer` |
| 11421～11423 | replace 3줄 | 지니 | `  const L=KH.mat&&KH.mat.leaves,tex=L?L.flat.map((f,i)=>f/L.color[i]*SKG.leaves[i]):[1,1,1` |
| 11428～11429 | replace 2줄 | 지니 | `  KHR.lampAt=[[-21.4,9,-35],[-21.4,9,-8.5],[-43.8,9,-63],[-43.8,9,-21.5],[-43.8,9,22]].map` |
| 11431～11432 | insert 2줄 | 지니 | `  if(rd){KHR.road=true;khRDP();rd.updateMatrixWorld(true);KHR.grp.add(rd);if(KH.ver['tex/r` |
| 11434～11434 | replace 1줄 | 지니 | `    if(tr){KHR.grp.updateMatrixWorld(true);khTrees(tr,[st,gf],KHR.grp,KHR.trees);KHR.leaf=` |
| 11440～11442 | insert 3줄 | 지니 | `  const a2=await Promise.all(KHA2.ids.map(id=>khGlb(id).catch(e=>{console.warn('env model'` |
| 11450～11450 | replace 1줄 | 지니 | `    const real=on&&KHR.real;if(on)khSkNow(true);khReal(real);sr(on,nb);if(!on)khSkNow(fals` |
| 11469～11469 | replace 1줄 | 지니 | `    const ph=offsetPoly(p118,2.2*S);mass(ph,3.6,0xffffff,'ribbon',null,m,{y0:18.6,rv:3.6,d` |
| 11473～11473 | replace 1줄 | 지니 | `    const pe=rectQ(620,-3700,1300,-3350),me=mass(pe,17,0xffffff,'cw','이비학원 · 민트약국',city,{r` |
| 11475～11476 | replace 2줄 | 지니 | `    for(let k=0;k&lt;12;k++)onFace(mg,pg,0.04+k*0.024,0.05+k*0.024,0.4,10.5,0.35,0.06,SM({` |
| 11479～11479 | replace 1줄 | 지니 | `  {const pb=rectQ(320,-6250,1150,-5420),mb=mass(pb,15,0xc9c9c6,'grey','하람인테리어',city,{rv:15` |
| 11482～11483 | replace 2줄 | 지니 | `    const mk=mass(rectQ(300,-8900,1300,-7950),18,0xffffff,'wrib','김상호EMK학원 (약 5층)',city,{r` |
| 11489～11489 | replace 1줄 | 지니 | `  khModel(mass(mp([[885,605],[1075,483],[1120,610],[980,720]]),14,0xe2d6bf,'office','임도빌딩 ` |
| 11491～11491 | replace 1줄 | 지니 | `  khModel(mass(mp([[1200,330],[1270,320],[1330,470],[1215,475]]),12,0xe9e7e1,'office','5 (` |
| 11493～11493 | replace 1줄 | 지니 | `  // (env-test 2026.10.30, 2026.11.03) 110 화인빌딩 (신사동 528-4): roadview 2026.06–07 + 사용자 사진 ` |
| 11502～11503 | replace 2줄 | 지니 | `  khModel(mass(mp([[1030,1060],[1150,1005],[1185,1170],[1120,1185]]),13,0xe2d6bf,'office')` |
| 11505～11509 | replace 5줄 | 지니 | `  // env-test: 두원빌딩·헬렌비 (525-11), 마마논마마 (525-22), GOALSTUDIO (532), 큐빅디자인빌딩 (525-10) had n` |
| 11517～11517 | replace 1줄 | 지니 | `  for(let y=-250;y&lt;6900;y+=10*S){const y2=Math.min(6900,y+10*S);const [x1,z1]=P(-1400,y` |
| 11524～11525 | replace 2줄 | 지니 | `    const am=B2.map((c,k)=>mass(nbar(c[0],c[1],200,34),44,0xf3f3f1,'apt',k===1?'미성아파트 2차 (` |
| 11527～11528 | replace 2줄 | 지니 | `  {const a1=[[980,40],[780,40],[580,60]].map((c,k)=>mass(nbar(c[0],c[1],170,34),36,0xeeeee` |
| 11555～11555 | replace 1줄 | 지니 | `      const [ax,az]=P(-1990,-4462),pl=new THREE.Mesh(new THREE.PlaneGeometry(14,1.8),new T` |
| 11561～11562 | replace 2줄 | 지니 | `    {const [sx,sz]=P(-2600,-3700),pl=new THREE.Mesh(new THREE.PlaneGeometry(9,1.7),new THR` |
| 11568～11572 | replace 5줄 | 지니 | `      const hs1=mass(rectQ(-6000,-11000,-4500,-5600),18,0xffffff,'office','현대고등학교',hs,{mat` |
| 11701～11701 | replace 1줄 | Wing+지니 | `const CMP={v:0,ol:false,apt:false,spin:false,mats:new Map()};` |
| 11704～11706 | replace 3줄 | 지니 | `function ghostGroup(grp,op){grp.traverse(o=>{if(!o.material)return;` |
| 11710～11710 | replace 1줄 | 지니 | `  if(APT_NOW){const a=on&&CMP.apt;APT_NOW.visible=!a\|\|eOp>0.02;APT_NEW.visible=a&&nOp>0.` |
| 11714～11714 | replace 1줄 | Wing | `  const rows=[['대지면적','약 532㎡ (161평)',st.site.replace('㎡','㎡ ('+(parseFloat(st.site)/3.305` |
| 11716～11718 | replace 3줄 | 지니 | `function applyEra(){const e=state.era;document.body.classList.toggle('inSrv',e==='srv');if` |
| 11722～12247 | replace 526줄 | 지니 | `document.querySelectorAll('input[name=era]').forEach(r=>r.addEventListener('change',e=>{st` |
| 12251～12251 | replace 1줄 | Wing | `  chk('era',state.era==='cmp'?'now':state.era);chk('sch',state.scheme);chk('g1',state.g1);` |
| 12254～12264 | insert 11줄 | Wing | `// 26종 목록: 1~20은 추천 시안, 21~26은 마감재(심플 박스) — 실사 사진과 같은 번호 · 스케치업/렌더/실사 모두 같은 선택` |
| 12270～12269 | delete 0줄 | 지니 | `(삭제) window.KHXR={renderer,scene,camera,controls,enterInt,exitInt,placeLevel,setDoll,floor` |
| 12274～12274 | replace 1줄 | Wing | `  requestAnimationFrame(loop);const dt=Math.min(0.1,(now-last)/1000);last=now;` |
| 12276～12276 | replace 1줄 | Wing | `    step(dt);controls.update();clampIn();occl();occl2();fogFar();{const d=new THREE.Vector` |
| 12279～12279 | replace 1줄 | Wing | `  controls.update();occl();occl2();fogFar();drawFrame();placeLabels();if(I.on)drawMini();d` |
| 12308～12308 | replace 1줄 | Wing | `  window.CH_VER='v107';` |
| 12384～12386 | insert 3줄 | Wing | `    {const era=window.CH.state.era;if(era==='now'\|\|era==='cmp'){const d=M.now\|\|(M.ext&` |
| 12390～12390 | replace 1줄 | Wing | `      T.innerHTML=`${nm}&lt;small>${window.CH.state.era==='srv'?'③ 실측 · 사진은 신축 기준 · ':''}$` |
| 12406～12406 | replace 1줄 | Wing | `  const SCHN={mech:'기계식',dd:'자주식 실측안',self:'자주식1',alt3:'자주식2',alt4:'자주식3'};` |
| 12412～12412 | replace 1줄 | Wing | `    return[document.getElementById('capBtn'),` |
| 12416～12416 | replace 1줄 | Wing | `    if(on){const B=basis();PH.prev={era:s.era,sch:s.scheme};` |
| 12418～12418 | replace 1줄 | Wing | `      {const M=PH.man\|\|{},bs=(M.basis&&M.basis.base)\|\|B.sch[0],nm=k=>(M.sch&&M.sch[k])` |
| 12423～12423 | insert 1줄 | Wing | `  document.querySelectorAll('input[name=era]').forEach(r=>r.addEventListener('change',()=>` |
| 12470～12485 | replace 16줄 | 지니 | `// 2026.11.03: 오른쪽 메뉴 정리 — 주차 방식 · 외부 디자인 · 창 크기를 '건물 설정' 한 카드로, 카드와 각 항목을 접고 펼 수 있게` |
| 12487～12513 | replace 27줄 | 지니 | `  const $=id=>document.getElementById(id);` |
| 12516～12560 | replace 45줄 | Wing | `&lt;script>` |
