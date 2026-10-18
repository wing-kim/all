/* 위층 사무실 실내 시안(미디어 카탈로그 f2·f3 등 층별 사진 기준): 가구·마감·조명 기구만 더한다.
   외벽·기둥·코어·슬래브·개구부는 원본 LEVELS가 소유하며 이 파일은 그 위치를 읽기만 한다.
   층별 차이는 STYLES에 둔다(바닥·천장·책상·라운지 구성). */
window.OFFICE_FLOORS=['2F','3F'];
window.OFFICE_CATALOG={'2F':'f2','3F':'f3'};
const OFFICE_STYLES={
 // 2F: 흰 노출 천장, 밝은 오크 마루, 흰 벤치 책상·하늘색 칸막이, 회색 소파 라운지, 창가 바 카운터, 회의 테이블.
 '2F':{floor:{tex:'office-floor',maps:['color','normal','rough'],version:2,repeat:1.6,roughness:.62,normalScale:.35,name:'Office light oak floor'},
  ceiling:'#f8f7f3',duct:'#eeeeea',desk:'white',felt:true,monitorEvery:1,
  clusters:[[-10.2,-10.9],[-6.2,-10.9],[-10.2,-5.9],[-6.2,-5.9],[-10.2,-.6],[-6.2,-.6]],
  lounge:{kind:'grey',at:[[-8.4,5.4],[-8.4,4.6],[-9.4,3.8]]},bar:true,meeting:true,shelves:[],
  plants:[[-12.5,-12.8,1.5],[-12.4,-8.1,1.3],[-12.4,-3.9,1.3],[-4.25,-12.8,1.4],[-4.3,2.0,1.6],[-12.3,6.2,1.6],[-6.2,8.6,1.4],[-0.3,1.6,1.5],[-2.6,-6.6,1.3],[-12.4,.45,1.2]],
  plantModels:['plantA','plantB'],pot:'#eeece6'},
 // 3F: 광택 콘크리트 바닥, 베이지 콘크리트 노출 천장, 원목 책상, 중앙 곡선 소파 라운지(황마 러그·테라코타 스툴), 원목 선반, 큰 화분.
 '3F':{floor:{tex:'office-concrete',maps:['color','normal'],version:2,repeat:3,roughness:.3,normalScale:.25,name:'Office polished concrete floor'},
  ceiling:'#cfc7b9',duct:'#ddd6ca',desk:'oak',felt:false,monitorEvery:2,
  clusters:[[-10.2,-10.9],[-6.2,-10.9],[-10.2,-.6],[-6.2,-.6]],
  lounge:{kind:'curve',at:[[-8.2,-5.6],[-8.2,-5.2]]},bar:false,meeting:false,
  shelves:[[-12.75,5.2,Math.PI/2,2.4],[-1.3,-9.6,-Math.PI/2,2.4],[-1.3,-4.6,-Math.PI/2,2.0]],
  plants:[[-12.5,-12.8,1.7],[-12.4,-8.1,1.5],[-12.4,-3.6,1.6],[-4.25,-12.8,1.7],[-4.3,2.0,1.8],[-12.3,7.4,1.6],[-6.2,8.6,1.6],[-0.3,1.6,1.6],[-2.6,-6.6,1.5],[-4.4,-3.6,1.4],[-0.3,-12.6,1.6],[-9.6,8.0,1.4]],
  plantModels:['palm','plantA','plantB'],pot:'#cbc5bb'},
};
window.dressTowerOffice=async function(C,root,key='2F'){
 const T=C.THREE,L=C.levels().find(l=>l.key===key),S=OFFICE_STYLES[key];if(!L||!S)return null;
 const floor=C.floorTop(L),ceiling=C.ceilOf(L),group=new T.Group();group.name=key+' office illustrative fit-out';root.add(group);
 const mat=(name,color,roughness=.6,metalness=0)=>{const m=new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness,metalness});m.name=name;return m};
 const white=mat('Office white laminate','#f1efe9',.42),paint=mat('Office ceiling paint',S.ceiling,.9),frame=mat('Powder-coated white steel','#e9e7e1',.38,.15),
  mesh=mat('Task chair mesh','#a3a7aa',.85),chairBase=mat('Task chair base','#5d6063',.45,.3),screen=mat('Office monitor','#15191c',.25,.2),felt=mat('Dusty blue felt screen','#b4cad8',.96),
  boucle=mat('Light grey boucle','#cbc9c3',.96),blue=mat('Dusty blue upholstery','#8fa8bb',.92),oak=mat('Light oak','#d5b48b',.5),rug=mat('Grey wool rug','#b8b5ad',1),
  jute=mat('Jute rug','#c8b28c',1),terracotta=mat('Terracotta side table','#b4552f',.7),
  pot=mat('Planter',S.pot,.6),housing=mat('Linear LED housing','#ecebe7',.35,.25),grille=mat('Cassette grille','#cfd0cd',.7),duct=mat('Painted duct',S.duct,.55,.1);
 const deskTop=S.desk==='oak'?oak:white,deskFrame=S.desk==='oak'?oak:frame;
 // 가구 모델(CC BY, Sketchfab 공개 모델을 Objaverse에서 받음, 출처는 assets/README): interior-models.js가 userData.modelSwap 자리를
 // 같은 위치·방향·크기의 모델로 바꾼다. yaw는 모델 정면(+Z)을 절차적 가구 정면(-Z)에 맞춘다.
 const MODEL='360/assets/office/office-',swap=(g,name,fit)=>{g.userData.modelSwap={url:MODEL+name+'.glb',yaw:Math.PI,...fit};return g};
 // 절차적 대체물은 숨겨 둔다(숨긴 물체는 environment.js 재질 묶음에 들어가지 않는다). 모델을 못 받으면 interior-models.js가 다시 보인다.
 const stash=g=>{const fallback=new T.Group();fallback.name='Procedural fallback';fallback.visible=false;fallback.userData.modelFallback=true;while(g.children.length)fallback.add(g.children[0]);g.add(fallback);return g};
 const glow=mat('Linear LED diffuser','#ffffff',.4);glow.emissive.set('#fff3e2');glow.emissiveIntensity=2.4;
 const unit=new T.BoxGeometry(1,1,1),rodGeo=new T.CylinderGeometry(1,1,1,20);
 function add(g,m,x,y,z,parent=group){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 function box(m,x,y,z,w,h,d,parent=group){const o=add(unit,m,x,y,z,parent);o.scale.set(w,h,d);return o}
 function cylinder(m,x,y,z,r,h,parent=group){const o=add(rodGeo,m,x,y,z,parent);o.scale.set(r,h,r);return o}
 function rod(m,a,b,r,parent=group){const A=new T.Vector3(...a),B=new T.Vector3(...b),o=cylinder(m,...A.clone().add(B).multiplyScalar(.5).toArray(),r,A.distanceTo(B),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize());return o}
 // 원본 평면 좌표(px) ↔ 월드(m): C.P의 역변환.
 const px=(x,z)=>[x*41.6+914,z*41.6+770],world=q=>C.P(q[0],q[1]);
 const rects=[...(L.blocks||[]).map(b=>{const [x0,z0]=world([b.r[0],b.r[1]]),[x1,z1]=world([b.r[2],b.r[3]]);return [Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)]}),
  ...[...(L.obst||[]),...(L.slabHoles||[])].map(poly=>{const pts=poly.map(world),xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)]})];
 const cols=(L.cols||[]).map(world);
 // 사각 영역이 평면 안이고 기둥·코어·개구부와 겹치지 않는지.
 function free(x0,z0,x1,z1,margin=.25){
  if(![[x0,z0],[x1,z0],[x0,z1],[x1,z1]].every(([x,z])=>C.inPoly(px(x,z),L.poly)))return false;
  if(cols.some(([x,z])=>x>x0-margin-.35&&x<x1+margin+.35&&z>z0-margin-.35&&z<z1+margin+.35))return false;
  return !rects.some(([a,b,c,d])=>x1+margin>a&&x0-margin<c&&z1+margin>b&&z0-margin<d);
 }
 const keepouts=[];
 const loader=new T.TextureLoader();
 // 바닥 마감(CC0 Poly Haven 텍스처를 시안 사진 톤으로 재보정, assets/README). 코어·개구부는 비운다.
 try{
  const F=S.floor,maps=await Promise.all(F.maps.map(n=>loader.loadAsync('360/assets/'+F.tex+'_'+n+'.webp?v='+F.version)));
  maps[0].encoding=T.sRGBEncoding;for(const t of maps){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1/F.repeat,1/F.repeat);t.anisotropy=8}
  const finish=new T.MeshStandardMaterial({map:maps[0],normalMap:maps[1],roughnessMap:maps[2]||null,roughness:F.roughness,name:F.name});finish.normalScale.set(F.normalScale,F.normalScale);
  const shape=new T.Shape();L.poly.map(world).forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  for(const [a,b,c,d] of rects){const h=new T.Path();h.moveTo(a,-b);h.lineTo(a,-d);h.lineTo(c,-d);h.lineTo(c,-b);h.closePath();shape.holes.push(h)}
  const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const f=add(g,finish,0,floor+.004,0);f.castShadow=false;f.name='Office floor finish';
 }catch(error){console.warn('Office floor texture unavailable',error)}
 // 천장: 슬래브 아래 도장면, 기둥 사이 노출 보·덕트, 길게 이어지는 선형 LED 펜던트, 천장형 냉난방기.
 {
  const shape=new T.Shape();L.poly.map(world).forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
  const g=new T.ShapeGeometry(shape);g.rotateX(Math.PI/2);const c=add(g,paint,0,ceiling-.012,0);c.castShadow=false;c.name='Office painted ceiling';
  const xs=[...new Set(cols.map(p=>+p[0].toFixed(2)))].sort((a,b)=>a-b),zs=[...new Set(cols.map(p=>+p[1].toFixed(2)))].sort((a,b)=>a-b);
  const has=(x,z)=>cols.some(p=>Math.abs(p[0]-x)<.2&&Math.abs(p[1]-z)<.2);
  for(const z of zs)for(let i=0;i<xs.length-1;i++)if(has(xs[i],z)&&has(xs[i+1],z))box(paint,(xs[i]+xs[i+1])/2,ceiling-.24,z,xs[i+1]-xs[i],.46,.34);
  for(const x of xs)for(let i=0;i<zs.length-1;i++)if(has(x,zs[i])&&has(x,zs[i+1]))box(paint,x,ceiling-.24,(zs[i]+zs[i+1])/2,.34,.46,zs[i+1]-zs[i]);
  for(const z of [-6,-.3]){if(free(-12.4,z-.2,-4.2,z+.2,-.1))rod(duct,[-12.4,ceiling-.62,z],[-4.2,ceiling-.62,z],.2)}
  for(const z of [-10.4,-4.6,1.2])if(free(-12.4,z-.05,-4,z+.05,-.1))rod(duct,[-12.4,ceiling-.35,z],[-4,ceiling-.35,z],.045);
  for(let z=-12.2;z<=9.5;z+=2.4){
   let x0=-12.3,x1=-4.3;while(x0<x1&&!C.inPoly(px(x0,z),L.poly))x0+=.2;while(x1>x0&&!C.inPoly(px(x1,z),L.poly))x1-=.2;
   if(x1-x0<2)continue;const y=ceiling-.78,len=x1-x0,cx=(x0+x1)/2;
   box(housing,cx,y,z,len,.05,.07);box(glow,cx,y-.028,z,len-.04,.008,.05);
   for(let x=x0+.4;x<x1;x+=2.2)rod(frame,[x,y+.025,z],[x,ceiling-.02,z],.003);
  }
  for(const [x,z] of [[-8.2,-11],[-8.2,-5.9],[-8.2,-.3],[-8.2,5.2],[-1.3,-10.6]])if(free(x-.45,z-.45,x+.45,z+.45,-.2)){box(housing,x,ceiling-.035,z,.9,.05,.9);box(grille,x,ceiling-.062,z,.62,.006,.62)}
 }
 // 업무 공간: 벤치 책상(마주 보는 두 줄), 서랍장, 모니터, 칸막이(2F), 메시 의자.
 function taskChair(x,z,angle){
  const g=swap(new T.Group(),'chair',{height:1.02});g.position.set(x,floor,z);g.rotation.y=angle;group.add(g);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(chairBase,[0,.06,0],[Math.cos(a)*.3,.05,Math.sin(a)*.3],.016,g);cylinder(chairBase,Math.cos(a)*.3,.03,Math.sin(a)*.3,.025,.05,g)}
  cylinder(chairBase,0,.25,0,.025,.38,g);box(mesh,0,.47,0,.48,.07,.46,g);
  const back=box(mesh,0,.82,.22,.46,.58,.04,g);back.rotation.x=-.12;
  for(const s of [-1,1]){rod(chairBase,[s*.24,.5,.1],[s*.24,.66,.1],.012,g);box(chairBase,s*.24,.67,0,.05,.025,.26,g)}
  stash(g);
 }
 function benchCluster(cx,cz,n){
  const len=n*1.4;if(!free(cx-1.55,cz-len/2-.3,cx+1.55,cz+len/2+.3))return false;
  for(const side of [-1,1]){
   const x=cx+side*.4;box(deskTop,x,floor+.735,cz,.78,.03,len);
   for(let i=0;i<=n;i++){const z=cz-len/2+i*1.4;box(deskFrame,x+side*.33,floor+.36,z,.04,.72,.04);box(deskFrame,x,floor+.7,z,.74,.03,.04);}
   box(deskFrame,x+side*.33,floor+.04,cz,.04,.03,len);
   for(let i=0;i<n;i++){
    const z=cz-len/2+.7+i*1.4;box(white,x+side*.12,floor+.33,z+.42,.4,.6,.42);
    if((i+(side>0?1:0))%S.monitorEvery===0){const m=swap(new T.Group(),'monitor',{width:.56,yaw:0});m.position.set(x-side*.2,floor+.75,z);m.rotation.y=side*Math.PI/2;group.add(m);box(screen,0,.31,0,.52,.3,.022,m);box(chairBase,0,.13,-.02,.03,.24,.03,m);stash(m);}
    box(chairBase,x-side*.1,floor+.756,z,.14,.012,.42);
    taskChair(x+side*.95,z,side>0?Math.PI/2:-Math.PI/2);
   }
  }
  if(S.felt)box(felt,cx,floor+.91,cz,.03,.34,len-.05);
  keepouts.push({x:cx,z:cz,w:3.1,d:len+.6});return true;
 }
 let clusters=0;
 for(const [x,z] of S.clusters)if(benchCluster(x,z,3))clusters++;
 // 창가 바 카운터와 스툴(2F 시안 1·5번 사진 왼쪽).
 if(S.bar){const x=-12.45,z0=3.25,z1=6.45;if(free(x-.3,z0,x+.9,z1,.05)){box(oak,x,floor+1.04,(z0+z1)/2,.42,.04,z1-z0);for(const z of [z0+.2,z1-.2])box(frame,x,floor+.52,z,.05,1.02,.36);
   for(let z=z0+.5;z<z1-.2;z+=.75){const st=swap(new T.Group(),'stool',{height:1.0});st.position.set(x+.55,floor,z);st.rotation.y=Math.PI/2;group.add(st);cylinder(oak,0,.76,0,.18,.04,st);for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;rod(frame,[Math.cos(a)*.12,.74,Math.sin(a)*.12],[Math.cos(a)*.18,0,Math.sin(a)*.18],.012,st)}stash(st)}
   keepouts.push({x:x+.3,z:(z0+z1)/2,w:1.3,d:z1-z0});}}
 // 라운지 가구(모델 교체 대상).
 function sofa(x,z,angle,w=2.2,model='sofa',yaw=Math.PI){const g=swap(new T.Group(),model,{width:w,yaw});g.position.set(x,floor,z);g.rotation.y=angle;group.add(g);
  box(boucle,0,.22,0,w,.3,.9,g);box(boucle,0,.43,.06,w-.3,.14,.76,g);box(boucle,0,.62,.37,w,.5,.2,g);for(const s of [-1,1])box(boucle,s*(w/2-.1),.47,0,.2,.34,.9,g);
  for(let i=0;i<2;i++){const c=box(blue,(i-.5)*w*.45,.62,.22,.42,.36,.1,g);c.rotation.x=-.2}stash(g)}
 function lounge(x,z,angle,model='lounge',height=.8){const g=swap(new T.Group(),model,{height});g.position.set(x,floor,z);g.rotation.y=angle;group.add(g);
  for(const [dx,dz] of [[-.26,-.24],[.26,-.24],[-.26,.24],[.26,.24]])rod(oak,[dx,0,dz],[dx*.85,.36,dz*.85],.018,g);
  box(blue,0,.42,0,.66,.12,.62,g);const b=box(blue,0,.72,.27,.68,.5,.1,g);b.rotation.x=-.18;for(const s of [-1,1])box(blue,s*.33,.56,.02,.08,.22,.55,g);stash(g)}
 function loungeGroup(x,z){
  if(!free(x-2.1,z-1.7,x+2.1,z+1.7,.1))return false;
  if(S.lounge.kind==='curve'){
   // 3F: 황마 러그 위 곡선 크림 소파와 마주 보는 라운지 체어 둘, 원형 원목 테이블, 테라코타 스툴.
   box(jute,x,floor+.006,z,3.9,.012,3.0).castShadow=false;
   sofa(x,z+.95,Math.PI,2.7,'curvesofa',0);// 이 모델은 정면이 -Z라 yaw 0lounge(x-.75,z-1.0,0,'lounge3',.78);lounge(x+.75,z-1.0,0,'lounge3',.78);
   cylinder(oak,x,floor+.2,z+.05,.55,.4);cylinder(terracotta,x+1.55,floor+.23,z+.55,.2,.46);cylinder(terracotta,x-1.6,floor+.23,z+.6,.2,.46);
  }else{
   box(rug,x,floor+.006,z,3.6,.012,2.8).castShadow=false;
   sofa(x,z+1.05,Math.PI);sofa(x+1.45,z-.1,-Math.PI/2,1.8);lounge(x-1.35,z-.55,Math.PI*.82);lounge(x-1.45,z+.35,Math.PI*.62);
   box(oak,x,floor+.36,z,1.1,.06,.66);box(oak,x,floor+.17,z,.98,.34,.54);
  }
  keepouts.push({x,z,w:4.2,d:3.4});return true;
 }
 const lounges=S.lounge.at.some(([x,z])=>loungeGroup(x,z))?1:0;
 // 회의 테이블(2F 동쪽 베이, 코어 앞).
 if(S.meeting){const x=-1.3,z=-10.3;if(free(x-1.2,z-1.6,x+1.2,z+1.6,.05)){box(oak,x,floor+.74,z,1.1,.05,2.6);for(const dz of [-.95,.95])box(frame,x,floor+.36,z+dz,.7,.72,.05);
   for(const dz of [-.8,0,.8])for(const s of [-1,1])taskChair(x+s*.85,z+dz,s>0?Math.PI/2:-Math.PI/2);keepouts.push({x,z,w:2.6,d:3.2});}}
 // 원목 선반(3F 시안 벽면): 4단 판과 기둥, 작은 화분 식물(모델 교체 대상).
 let shelves=0;
 for(const [x,z,angle,w] of S.shelves){
  const along=Math.abs(Math.sin(angle))>.5,hw=w/2;if(!free(along?x-.25:x-hw,along?z-hw:z-.25,along?x+.25:x+hw,along?z+hw:z+.25,.05))continue;
  const g=new T.Group();g.position.set(x,floor,z);g.rotation.y=angle;group.add(g);
  for(const sx of [-hw,0,hw])box(oak,sx,.9,0,.04,1.8,.38,g);
  for(const y of [.08,.55,1.02,1.49,1.78])box(oak,0,y,0,w,.03,.38,g);
  for(let i=0;i<4;i++){const p=swap(new T.Group(),'plantB',{height:.42,yaw:i*1.7});p.position.set(-hw+.35+i*(w-.7)/3,(i%2?1.04:.57),0);g.add(p);cylinder(pot,0,.08,0,.08,.16,p);stash(p)}
  keepouts.push({x,z,w:along?.6:w,d:along?w:.6});shelves++;
 }
 // 식재: 창가·기둥 옆 화분 식물(모델 교체 대상, 층별 모델을 번갈아).
 let plants=0;
 const near=(x,z)=>keepouts.some(o=>Math.abs(x-o.x)<o.w/2+.45&&Math.abs(z-o.z)<o.d/2+.45);
 for(const [x,z,h] of S.plants)
  if(free(x-.3,z-.3,x+.3,z+.3,.02)&&!near(x,z)){const g=swap(new T.Group(),S.plantModels[plants%S.plantModels.length],{height:h,yaw:(plants+1)*2.4});plants++;g.position.set(x,floor,z);group.add(g);cylinder(pot,0,.26,0,.27,.52,g);stash(g)}
 const offices=root.userData.offices||(root.userData.offices={});
 offices[key]={floor:L.key,clusters,lounges,shelves,plants,keepouts,structuralSource:'original LEVELS; fit-out is illustrative (catalog '+window.OFFICE_CATALOG[key]+')'};
 root.userData.office=offices['2F']||offices[key];
 return group;
};
