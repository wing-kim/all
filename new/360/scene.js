/* Opt-in extension to the existing model. No image switching in this viewport. */
(async function () {
  'use strict';
  const C=window.TOWER_LAB_CONTEXT;
  window.TOWER_ORBIT_ONLY=true;
  const {THREE:T,scene,camera,controls,renderer,state,M,R3D,RMAT,HQ,bld,P,inPoly}=C;
  const scripts=new Map();
  const load=src=>{if(scripts.has(src))return scripts.get(src);const promise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});scripts.set(src,promise);return promise;};
  const style=document.createElement('style');style.textContent='.panel,.views,.tools,.compass,.hint,.labels,.hqtag{display:none!important}.viewer{width:100%}';document.head.appendChild(style);
  let initial={};
  try{initial=JSON.parse(new URLSearchParams(location.hash.slice(1)).get('config')||'{}')}catch(error){console.warn('Invalid review configuration',error)}
  if(initial.state){for(const key of Object.keys(state)){const value=initial.state[key];if(Object.prototype.hasOwnProperty.call(initial.state,key))state[key]=value;}}
  else state.scheme='alt4';
  if(initial.daylight?.time)R3D.time=initial.daylight.time;
  if(initial.daylight?.season)R3D.season=initial.daylight.season;
  C.setRender(true);C.hideGuides();
  window.TOWER_SOURCE_AUDIT={state:JSON.parse(JSON.stringify(state)),levels:C.levels().map(l=>({key:l.key,y:l.y,h:l.h,poly:l.poly.map(p=>p.slice())}))};
  if(C.contextBuildings){C.contextBuildings.current.visible=true;C.contextBuildings.future.visible=false;C.contextBuildings.outline.visible=false;}
  // Remove the drafting north marker only in the opt-in continuous viewer.
  C.site.children.filter(o=>o.children.some(c=>c.geometry?.type==='RingGeometry')).forEach(o=>o.visible=false);
  // Separate ground strata physically; prevent coplanar asphalt intersections from fighting.
  C.site.traverse(o=>{
    if(!o.isMesh)return;
    const m=o.material;
    if(m===RMAT.ground)o.position.y-=.15;
    if(m===RMAT.walk)o.position.y+=.12;
    if(m===RMAT.site)o.position.y+=.08;
    if(m===RMAT.road){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;}
    if(m?.isMeshBasicMaterial&&o.geometry?.type==='BufferGeometry'){o.position.y+=.045; m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-2;}
  });
  camera.fov=45;camera.near=2;camera.far=1800;camera.updateProjectionMatrix();
  controls.enabled=true;controls.enableZoom=true;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=400;
  controls.minPolarAngle=.22;controls.dampingFactor=.075;
  // Permit street-height observation below the building centre without going underground.
  const cameraOffset=new T.Vector3();
  function constrainCameraHeight(){
    if(C.cafeMode){controls.maxPolarAngle=Math.PI-.1;return;}
    cameraOffset.copy(camera.position).sub(controls.target);
    const radius=T.MathUtils.clamp(cameraOffset.length(),controls.minDistance,controls.maxDistance);
    if(camera.position.y<1.5){
      const horizontal=Math.sqrt(Math.max(0,radius*radius-(1.5-controls.target.y)**2)),length=Math.hypot(cameraOffset.x,cameraOffset.z);
      camera.position.set(controls.target.x+(length?cameraOffset.x/length:1)*horizontal,1.5,controls.target.z+(length?cameraOffset.z/length:0)*horizontal);
      camera.lookAt(controls.target);
    }
    controls.maxPolarAngle=Math.acos(T.MathUtils.clamp((1.5-controls.target.y)/Math.max(.001,radius),-1,1));
  }
  controls.addEventListener('change',constrainCameraHeight);constrainCameraHeight();
  let flight=null,lastVisibilityKey='';
  const cancel=()=>{flight=null;C.cancel()};
  controls.addEventListener('start',()=>{cancel();dispatchEvent(new Event('tower-navigation-start'));window.TOWER_CINEMA?.cancelPrecision()});
  const inputCanvas=renderer.domElement;inputCanvas.tabIndex=0;inputCanvas.setAttribute('aria-label','건물 360도 탐색. 휠 확대 축소, WASD 이동, Home 전체 보기');
  inputCanvas.addEventListener('pointerdown',()=>inputCanvas.focus({preventScroll:true}));
  inputCanvas.addEventListener('wheel',e=>{if(!C.cafeMode)return;e.preventDefault();e.stopImmediatePropagation();camera.fov=T.MathUtils.clamp(camera.fov+e.deltaY*.035,35,85);camera.updateProjectionMatrix();window.TOWER_CINEMA?.cancelPrecision();},{capture:true,passive:false});
  function navigateKey(event){
    if(event.target?.closest?.('input,textarea,select,[contenteditable=true]')||event.ctrlKey||event.metaKey||event.altKey)return;
    const code=event.code;
    if(!['Home','Enter','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code))return;
    event.preventDefault();cancel();dispatchEvent(new Event('tower-navigation-start'));controls.autoRotate=false;window.TOWER_CINEMA?.cancelPrecision();
    if(code==='Home'){dispatchEvent(new Event('tower-navigation-home'));view('aerial');return;}
    if(code==='Enter'){if(C.dollMode)dispatchEvent(new Event('tower-navigation-walk'));return;}
    if(C.dollMode){
      const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();
      const right=new T.Vector3(-forward.z,0,forward.x),delta=new T.Vector3();
      if(['ArrowLeft','KeyQ'].includes(code))delta.copy(right).negate();
      if(['ArrowRight','KeyE'].includes(code))delta.copy(right);
      if(['KeyW','ArrowUp'].includes(code))delta.copy(forward);
      if(['KeyS','ArrowDown'].includes(code))delta.copy(forward).negate();
      if(code==='KeyA')delta.copy(right).negate();if(code==='KeyD')delta.copy(right);
      delta.multiplyScalar(Math.max(.4,camera.position.distanceTo(controls.target)*.04));camera.position.add(delta);controls.target.add(delta);controls.update();return;
    }
    // Interior keys keep the original viewer's meaning: Q/E and left/right
    // arrows turn in place; A/D strafe. Exterior Q/E still changes height.
    if(C.cafeMode&&['KeyQ','KeyE','ArrowLeft','ArrowRight'].includes(code)){
      const angle=(['KeyE','ArrowRight'].includes(code)?1:-1)*.065;
      const dx=controls.target.x-camera.position.x,dz=controls.target.z-camera.position.z;
      controls.target.x=camera.position.x+dx*Math.cos(angle)-dz*Math.sin(angle);
      controls.target.z=camera.position.z+dx*Math.sin(angle)+dz*Math.cos(angle);
      controls.update();return;
    }
    const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();
    const right=new T.Vector3().crossVectors(forward,camera.up).normalize(),delta=new T.Vector3();
    if(['KeyW','ArrowUp'].includes(code))delta.copy(forward);
    if(['KeyS','ArrowDown'].includes(code))delta.copy(forward).negate();
    if(['KeyA','ArrowLeft'].includes(code))delta.copy(right).negate();
    if(['KeyD','ArrowRight'].includes(code))delta.copy(right);
    if(code==='KeyQ')delta.y=-1;if(code==='KeyE')delta.y=1;
    delta.multiplyScalar(C.cafeMode?(event.shiftKey?.6:.2):(event.shiftKey?3:1));
    if(C.cafeMode){const L=C.levels().find(l=>l.key===C.interiorFloorKey),p=camera.position.clone().add(delta);if(!L)return;
      const passable=L.key==='1F'?C.cafeIsWalkable?.(p.x,p.z):C.walkable(p.x,p.z,L);
      if(!passable||p.y<C.floorTop(L)+.4||((L.kind!=='roof'&&L.kind!=='terrace')&&p.y>C.ceilOf(L)-.25))return;}
    else if(camera.position.y+delta.y<1.5)delta.y=1.5-camera.position.y;
    camera.position.add(delta);controls.target.add(delta);controls.update();
  }
  addEventListener('keydown',event=>{if(!window.TOWER_MODERN_ACTIVE)return;const code=event.code;if(!['Home','Enter','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code))return;if(event.target?.closest?.('input,textarea,select,[contenteditable=true]'))return;event.stopImmediatePropagation();navigateKey(event)},true);

  R3D.hq=false;HQ.on=false;
  T.Cache.enabled=true;
  await load('360/cafe.js?v=cafe-3');
  async function dressBuilding(){
  const extra=new T.Group();extra.name='illustrative-interiors-and-landscape';scene.add(extra);C.interiorDressing=extra;
  let seed=941;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  const material=(color,roughness=.7)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness});
  const timber=material('#b39570'),fabric=material('#d5c9b5'),dark=material('#373b3c'),pot=material('#aaa394');
  const upholstery=[fabric,material('#8d9692'),material('#796b5b'),material('#a6a49a')];
  const screen=new T.MeshStandardMaterial({color:0x151c20,roughness:.24,metalness:.25});
  const textureLoader=new T.TextureLoader();
  try{
    const [color,normal,rough]=await Promise.all(['color','normal','rough'].map(name=>textureLoader.loadAsync('360/assets/furniture-veneer_'+name+'.jpg')));
    color.encoding=T.sRGBEncoding;
    for(const map of [color,normal,rough]){map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
    timber.map=color;timber.normalMap=normal;timber.normalScale.set(.06,.06);timber.roughnessMap=rough;timber.color.setRGB(1,1,1);timber.roughness=.55;timber.userData.illustrativeTimber=true;
  }catch(error){console.warn('Interior wood texture unavailable',error)}
  try{
    const [color,normal,rough]=await Promise.all(['color','normal','rough'].map(name=>textureLoader.loadAsync('360/assets/interior-stone_'+name+'.jpg')));
    color.encoding=T.sRGBEncoding;
    for(const map of [color,normal,rough]){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.setScalar(1/1.5);map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
    for(const m of [M.floorUp,M.stone]){m.map=color;m.normalMap=normal;m.normalScale.set(.065,.065);m.roughnessMap=rough;m.roughness=.55;m.color.setRGB(1,1.05,1.15);m.needsUpdate=true;}
    bld.updateMatrixWorld(true);const v=new T.Vector3();bld.traverse(o=>{if(!o.isMesh||![M.floorUp,M.stone].includes(o.material))return;
      const p=o.geometry.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv[i*2]=v.x;uv[i*2+1]=v.z}o.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));});
  }catch(error){console.warn('Interior stone texture unavailable',error)}
  const lit=new T.MeshStandardMaterial({color:0xffe8cc,emissive:0xffce91,emissiveIntensity:.8});
  const boxGeo=new T.BoxGeometry(1,1,1);
  function box(parent,x,y,z,w,h,d,m){const o=new T.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
  const chairMetal=material('#737c80',.3);chairMetal.metalness=.78;
  const casterMat=material('#292d2d',.8);
  function padGeometry(w,h,d){const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:3,steps:1});g.translate(0,0,-d/2);return g}
  const seatGeometry=padGeometry(.46,.43,.045);seatGeometry.rotateX(-Math.PI/2);
  const backGeometry=padGeometry(.44,.43,.04),liftGeometry=new T.CylinderGeometry(.027,.035,.31,12),armGeometry=new T.CylinderGeometry(.019,.027,1,8),wheelGeometry=new T.CylinderGeometry(.045,.045,.028,12);
  function deskChair(x,y,z,cloth){
    const root=new T.Group();root.position.set(x,y,z);root.name='Detailed task chair';root.userData.illustrativeFurniture=true;extra.add(root);
    function part(g,m,px,py,pz){const o=new T.Mesh(g,m);o.position.set(px,py,pz);o.castShadow=o.receiveShadow=true;root.add(o);return o}
    part(seatGeometry,cloth,0,.445,0);const back=part(backGeometry,cloth,0,.735,.225);back.rotation.x=.12;
    part(liftGeometry,chairMetal,0,.265,0);
    function rod(a,b,r=1){const A=new T.Vector3(...a),B=new T.Vector3(...b),o=part(armGeometry,chairMetal,...A.clone().add(B).multiplyScalar(.5).toArray());o.scale.set(r,A.distanceTo(B),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());}
    rod([0,.40,.17],[0,.73,.265]);
    for(const side of [-1,1]){rod([side*.245,.43,.08],[side*.245,.65,.08],.75);box(root,side*.245,.66,0,.055,.035,.28,dark);}
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5,dx=Math.sin(a)*.29,dz=Math.cos(a)*.29;rod([0,.13,0],[dx,.10,dz]);
      for(const side of [-1,1]){const wheel=part(wheelGeometry,casterMat,dx+Math.cos(a)*side*.022,.046,dz-Math.sin(a)*side*.022);wheel.rotation.set(0,a,Math.PI/2);}}
  }
  // Interior furnishings are illustrative. Architecture and opening locations remain from the model.
  C.levels().filter(l=>l.kind==='upper').forEach((l,li)=>{
    // Match the original finished floor: ground +70 mm, upper floors +15 mm.
    const y=l.y+(l.kind==='ground'?.07:.015)+.003;
    for(let x=450;x<900;x+=145)for(let z=360;z<1100;z+=170){
      if(![[x-45,z-40],[x+45,z-40],[x-45,z+40],[x+45,z+40]].every(q=>inPoly(q,l.poly)))continue;
      // Keep the rear core clear; only dress the glazed street frontage.
      if(x>640&&z<820)continue;
      const [a,b]=P(x,z),bay=Math.round((x-450)/145+(z-360)/170)+li;
      const cloth=upholstery[bay%upholstery.length];
      if(bay%4===0){
        // Low lounge seating gives each floor readable depth through the glazing.
        const seating=new T.Group();seating.userData.loungeAnchor={x:a,y,z:b};extra.add(seating);
        for(const dx of [-.65,.65])for(const dz of [-.25,.25])box(seating,a+dx,y+.07,b+dz,.06,.14,.06,dark);
        box(seating,a,y+.26,b,1.65,.24,.76,dark);
        for(const dx of [-.4,.4])box(seating,a+dx,y+.43,b,.76,.18,.68,cloth);
        box(seating,a,y+.73,b-.32,1.65,.62,.16,cloth);
        for(const dx of [-.77,.77])box(seating,a+dx,y+.56,b,.15,.38,.78,cloth);
        box(extra,a,y+.32,b+.98,1.1,.065,.48,timber);
        for(const dx of [-.43,.43])box(extra,a+dx,y+.16,b+.98,.035,.3,.38,dark);
      }else{
        box(extra,a,y+.76,b,1.65,.08,.85,timber);
        [-.65,.65].forEach(dx=>[-.3,.3].forEach(dz=>box(extra,a+dx,y+.37,b+dz,.045,.74,.045,dark)));
        deskChair(a,y,b+.85,cloth);
        if(bay%3===0){box(extra,a,y+1.08,b-.18,.57,.34,.035,screen);box(extra,a,y+.86,b-.18,.035,.18,.035,dark);box(extra,a,y+.813,b+.16,.46,.015,.15,dark);}
      }
      if(bay%3!==1)box(extra,a,l.y+l.h-.45,b,1.5,.035,.08,lit);
    }
  });
  // Optional interior dressing follows the existing curtain-wall bay divisions.
  // Facade openings and structural members remain unchanged.
  const shadeCloth=material('#d2d0c7',.92),shadeCase=material('#a6aaa6',.42);shadeCase.metalness=.25;
  const weaveCanvas=document.createElement('canvas');weaveCanvas.width=weaveCanvas.height=64;
  const weaveContext=weaveCanvas.getContext('2d');weaveContext.fillStyle='#888';weaveContext.fillRect(0,0,64,64);
  for(let i=0;i<64;i+=4){weaveContext.fillStyle=i%8?'#969696':'#a0a0a0';weaveContext.fillRect(i,0,1,64);weaveContext.fillRect(0,i,64,1);}
  const weave=new T.CanvasTexture(weaveCanvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(30,30);shadeCloth.bumpMap=weave;shadeCloth.bumpScale=.00025;
  const bayStep=({base:1.25,big:3,front:2.5,mega:6})[state.win],shadeColumns=[];
  bld.updateWorldMatrix(true,true);bld.traverse(o=>{if(o.isMesh&&o.material===M.col)shadeColumns.push(new T.Box3().setFromObject(o))});
  extra.userData.shadePlacement={candidates:0,skippedColumns:0,accepted:0};
  C.levels().filter(l=>l.kind==='upper').forEach((l,li)=>{
    for(const e of l.env||[{poly:l.poly,y0:l.y,y1:l.y+l.h-.38}])for(let edge=0;edge<e.poly.length;edge++){
      const a=P(...e.poly[edge]),b=P(...e.poly[(edge+1)%e.poly.length]),dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(!bayStep||length<2)continue;
      // Only the two street-facing elevations, away from the rear circulation core.
      const midPx=(e.poly[edge][0]+e.poly[(edge+1)%e.poly.length][0])/2,midPy=(e.poly[edge][1]+e.poly[(edge+1)%e.poly.length][1])/2;
      if(midPx>600&&midPy<900)continue;
      const count=Math.max(1,Math.round(length/bayStep)),ux=dx/length,uz=dz/length;let nx=-uz,nz=ux;
      const midx=(a[0]+b[0])/2,midz=(a[1]+b[1])/2;
      if(!inPoly([(midx+nx*.22)*41.6+914,(midz+nz*.22)*41.6+770],e.poly)){nx=-nx;nz=-nz;}
      for(let bay=1;bay<count-1;bay++){
        const key=li*17+edge*7+bay*11;if(key%13>2)continue;
        const along=(bay+.5)*length/count,x=a[0]+ux*along+nx*.22,z=a[1]+uz*along+nz*.22,width=length/count-.16;
        if(![-.5,.5].every(t=>inPoly([(x+ux*width*t)*41.6+914,(z+uz*width*t)*41.6+770],l.poly)))continue;
        const drop=[.65,1.05,1.45][key%3],root=new T.Group();root.name='Illustrative interior roller shade';root.position.set(x,e.y1-.22,z);root.rotation.y=-Math.atan2(dz,dx);root.userData.illustrativeFurniture=true;
        root.userData.shade={floor:l.key,poly:l.poly,edge,bay,bayCount:count,width,drop,glassInset:.22};extra.add(root);
        box(root,0,0,0,width,.09,.09,shadeCase);
        box(root,0,-.06-drop/2,0,width-.035,drop,.006,shadeCloth);
        box(root,0,-.06-drop,0,width-.025,.025,.025,shadeCase);
        extra.userData.shadePlacement.candidates++;root.updateWorldMatrix(true,true);
        const bounds=new T.Box3().setFromObject(root);
        if(shadeColumns.some(b=>b.intersectsBox(bounds))){extra.remove(root);extra.userData.shadePlacement.skippedColumns++;}
        else extra.userData.shadePlacement.accepted++;
      }
    }
  });
  // Instanced leaves, fixed seed: stable shapes from every camera and no per-frame reconstruction.
  const leafGeo=new T.SphereGeometry(1,4,3);leafGeo.scale(.15,.035,.065);
  const leaves=new T.InstancedMesh(leafGeo,material('#607646'),12000);leaves.castShadow=true;leaves.receiveShadow=true;
  let n=0;const dummy=new T.Object3D();
  function plant(x,y,z,size){
    box(extra,x,y+size*.42,z,.10*size,size*.84,.10*size,timber).userData.legacyInteriorFoliage=true;
    const count=Math.round(size*400);
    for(let i=0;i<count&&n<12000;i++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*size*.52,h=(random()-.5)*size*.7;
      dummy.position.set(x+Math.cos(a)*r,y+size*.82+h,z+Math.sin(a)*r);
      dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);dummy.scale.setScalar(.75+random()*.9);dummy.updateMatrix();leaves.setMatrixAt(n++,dummy.matrix);
    }
  }
  [[120,240],[120,610],[120,1020],[520,1310],[1550,910]].forEach(q=>{const [x,z]=P(...q);/* Replaced below by scanned tree assets. */});
  extra.userData.interiorPlantAnchors=[];
  C.levels().filter(l=>l.kind==='upper').forEach(l=>{if(!Array.from({length:8},(_,i)=>[445+Math.cos(i*Math.PI/4)*27,480+Math.sin(i*Math.PI/4)*27]).every(q=>inPoly(q,l.poly)))return;const [x,z]=P(445,480);box(extra,x,l.y+.265,z,.45,.5,.45,pot);plant(x,l.y+.495,z,1.1);extra.userData.interiorPlantAnchors.push({x,y:l.y+.495,z,height:1.35,floor:l.key,poly:l.poly})});
  leaves.count=n;leaves.instanceMatrix.needsUpdate=true;leaves.userData.legacyInteriorFoliage=true;extra.add(leaves);
  await window.dressTowerCafe(C,extra,timber);
  return extra;
  }
  let interiors=await dressBuilding();
  const extra=new T.Group();extra.name='persistent-neighbourhood';scene.add(extra);
  let seed=7231;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  // Fine surface relief, rather than painting lighting into albedo.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  for(let i=0;i<pixels.data.length;i+=4){const v=115+random()*30;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);
  const relief=new T.CanvasTexture(canvas);relief.wrapS=relief.wrapT=T.RepeatWrapping;relief.repeat.set(2,2);
  [RMAT.road,RMAT.walk,RMAT.site].forEach(m=>{m.bumpMap=relief;m.bumpScale=m===RMAT.road?.035:.012;m.needsUpdate=true});
  let env=null,skyTexture=null,environmentStatus='불러오는 중';
  let sourceLight=initial.daylight||C.sourceDaylight();
  function applySourceLight(value){
    if(!value||!Array.isArray(value.direction)||value.direction.length!==3)return;
    sourceLight=value;
    C.reviewDaylight=value;
    const direction=new T.Vector3(...value.direction).normalize();
    C.sun.target.position.set(-3,12,0);C.sun.position.copy(C.sun.target.position).add(direction.multiplyScalar(140));scene.add(C.sun.target);
    C.sun.color.setHex(value.color);C.sun.intensity=value.intensity;
    C.hemi.intensity=value.hemisphereIntensity;
    R3D.sky.material.uniforms.sunPosition.value.copy(C.sun.position).normalize();
  }
  function finishLighting(){
    M.glass.color.set('#698994').convertSRGBToLinear();M.glass.metalness=.38;M.glass.roughness=.085;M.glass.opacity=.38;M.glass.depthWrite=false;M.glass.side=T.FrontSide;M.glass1.side=T.FrontSide;
    M.glass1.color.copy(M.glass.color);M.glass1.metalness=.38;M.glass1.roughness=.1;M.glass1.opacity=.38;M.glass1.depthWrite=false;
    if(env){scene.environment=env;[M.glass,M.glass1].forEach(m=>{m.envMap=env;m.envMapIntensity=.9;m.needsUpdate=true})}
    R3D.grade.uniforms.vig.value=.08;R3D.grade.uniforms.sat.value=1;R3D.grade.uniforms.con.value=1.01;
    renderer.toneMappingExposure=1.02;renderer.outputEncoding=T.LinearEncoding;
    // Tight receiver volume: the legacy city-wide shadow frustum caused banding at this scale.
    applySourceLight(sourceLight);
    Object.assign(C.sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:300});
    C.sun.shadow.camera.updateProjectionMatrix();C.sun.shadow.bias=-.0003;C.sun.shadow.normalBias=.18;
    if(skyTexture){scene.background=skyTexture;R3D.sky.visible=false;}
    R3D.sky.material.uniforms.turbidity.value=2;
    bld.traverse(o=>{if(o.material===M.glass||o.material===M.glass1)o.castShadow=false});
  }
  finishLighting();
  const center=new T.Vector3(-3,16,0);let quality='balanced';
  function interiorPose(key,position,target,fov=72,doll=false,visibility=null){
    const level=C.levels().find(l=>l.key===key);if(!level)return false;
    const visibilityKey=JSON.stringify(visibility||{});
    const displayChanged=!C.cafeMode||C.interiorFloorKey!==key||C.dollMode!==!!doll||lastVisibilityKey!==visibilityKey;
    C.cafeMode=true;C.dollMode=!!doll;C.interiorFloorKey=key;
    if(displayChanged){if(doll)window.TOWER_CINEMA?.cancelPrecision();C.syncInteriorDisplay?.(key,doll,visibility);window.TOWER_CINEMA?.syncSourceVisibility();lastVisibilityKey=visibilityKey}
    cancel(); // Original enterInt/placeLevel/setDoll can start a fly-to; the forwarded pose wins.
    camera.near=doll ? .2 : .08;camera.fov=T.MathUtils.clamp(fov,35,100);camera.updateProjectionMatrix();controls.minDistance=doll ? 3 : .15;controls.maxDistance=doll ? 300 : .8;controls.enableZoom=!!doll;controls.minPolarAngle=.1;controls.maxPolarAngle=doll ? Math.PI*.49 : Math.PI-.1;controls.autoRotate=false;
    camera.position.fromArray(position);controls.target.fromArray(target);controls.update();return true;
  }
  function view(name){
    if(name==='cafe'||name==='cafe-counter'){const y=C.floorTop(C.levels().find(l=>l.kind==='ground'))+1.6,position=name==='cafe'?[-4.6,y,5.5]:[-10,y,-1],lookAt=name==='cafe'?[-9,y,-2]:[-4.4,y,-9.2],target=new T.Vector3(...lookAt).sub(new T.Vector3(...position)).normalize().multiplyScalar(.35).add(new T.Vector3(...position)).toArray();interiorPose('1F',position,target);return;}
    C.cafeMode=false;C.dollMode=false;C.syncInteriorDisplay?.(null,false);window.TOWER_CINEMA?.syncSourceVisibility();
    camera.near=2;camera.fov=45;camera.updateProjectionMatrix();controls.minPolarAngle=.22;
    const directions={reference:[-1,.18,.95],corner:[-1,.12,1.08],street:[-1,-.24,1.08],front:[-1,.16,0],back:[1,.16,0],left:[0,.9,-1],right:[0,.9,1],aerial:[-1,.7,1.1]};
    const a=directions[name];if(!a)return;
    controls.autoRotate=false;controls.enabled=true;controls.enableZoom=true;controls.minDistance=8;controls.maxDistance=400;
    const distance=(name==='reference'?66:62)*Math.max(1,Math.pow(1/Math.max(camera.aspect,.3),.65));
    const viewCenter=center.clone();if(name==='reference')viewCenter.y=15;
    const targetFrom=controls.target.clone();
    cancel();
    const from=new T.Spherical().setFromVector3(camera.position.clone().sub(targetFrom));
    const to=new T.Spherical().setFromVector3(new T.Vector3(...a).normalize().multiplyScalar(distance));
    to.theta=from.theta+Math.atan2(Math.sin(to.theta-from.theta),Math.cos(to.theta-from.theta));
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){controls.target.copy(viewCenter);camera.position.copy(viewCenter).add(new T.Vector3().setFromSpherical(to));controls.update()}
    else flight={from,to,targetFrom,viewCenter,start:performance.now()};
  }
  function setQuality(value){quality=value;window.TOWER_CINEMA?.quality(value);const ratio=value==='high'?Math.min(devicePixelRatio,1.7):1;renderer.setPixelRatio(ratio);R3D.composer.setPixelRatio(ratio);R3D.ao=value==='high';C.resizeR()}
  const compactTouch=parent.innerWidth<=850&&matchMedia('(pointer: coarse)').matches;
  setQuality('balanced');view('corner');
  if(initial.camera&&initial.target){if(initial.floor?.on)interiorPose(initial.floor.key,initial.camera,initial.target,initial.floor.fov,initial.floor.doll,initial.visibility);else{flight=null;camera.position.fromArray(initial.camera);controls.target.fromArray(initial.target);controls.update();}}
  let frames=0,start=performance.now(),fps=0;
  function stats(now){
    if(flight){const t=Math.min(1,(now-flight.start)/1000),s=t*t*(3-2*t),a=flight.from,b=flight.to;
      const q=new T.Spherical(T.MathUtils.lerp(a.radius,b.radius,s),T.MathUtils.lerp(a.phi,b.phi,s),T.MathUtils.lerp(a.theta,b.theta,s));
      controls.target.lerpVectors(flight.targetFrom,flight.viewCenter,s);
      camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(q));controls.update();if(t===1)flight=null;
    }
    frames++;if(now-start>1500){fps=Math.round(frames*1000/(now-start));frames=0;start=now}requestAnimationFrame(stats)}requestAnimationFrame(stats);
  window.TOWER360={
    view,interiorPose,navigateKey,quality:setQuality,appearance:value=>window.TOWER_CINEMA?.appearance(value),
    requestPrecision:()=>window.TOWER_CINEMA?.requestPrecision(),
    cancelPrecision:()=>window.TOWER_CINEMA?.cancelPrecision(),
    applyConfig:async config=>{
      if(!window.TOWER_CINEMA)return false;
      const before=performance.now();window.TOWER_CINEMA.cancelPrecision();
      for(const key of Object.keys(state))if(Object.prototype.hasOwnProperty.call(config.state,key))state[key]=config.state[key];
      // Preserve the neighbourhood and GPU renderer. Only rebuild the authored building.
      if(config.daylight)applySourceLight(config.daylight);
      C.build();C.hideGuides();finishLighting();
      const old=interiors;scene.remove(old);interiors=await dressBuilding();
      await C.enhanceBuildingDetails?.(interiors);
      if(config.display){document.getElementById('t-city').checked=config.display.city!==false;document.getElementById('t-ctx').checked=config.display.ctx!==false}
      C.syncInteriorDisplay?.(config.floor?.on?config.floor.key:null,!!config.floor?.doll,config.visibility);
      window.TOWER_SOURCE_AUDIT={state:JSON.parse(JSON.stringify(state)),levels:C.levels().map(l=>({key:l.key,y:l.y,h:l.h,poly:l.poly.map(p=>p.slice())}))};
      window.TOWER_CINEMA.updateBuilding();
      if(config.floor?.on)interiorPose(config.floor.key,config.floor.camera,config.floor.target,config.floor.fov,config.floor.doll,config.visibility);
      if(config.display&&JSON.stringify(config.display)!==JSON.stringify(initial.display)){C.city.visible=config.display.city!==false;C.ctx.visible=config.display.ctx!==false;window.TOWER_CINEMA.context(config.display);initial.display={...config.display};}
      const geometries=new Set(),materials=new Set();old.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m)});
      // Imported templates share resources with the new dressing; never dispose those.
      interiors.traverse(o=>{geometries.delete(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.delete(m)});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
      window.TOWER_LAST_SWITCH_MS=performance.now()-before;return true;
    },
    pose:(position,target)=>{C.cafeMode=false;C.dollMode=false;C.syncInteriorDisplay?.(null,false);window.TOWER_CINEMA?.syncSourceVisibility();controls.enableZoom=true;camera.near=2;camera.fov=45;camera.updateProjectionMatrix();flight=null;C.cancel();controls.minDistance=8;controls.maxDistance=1800;camera.position.fromArray(position);controls.target.fromArray(target);controls.update()},
    context:show=>{C.city.visible=C.ctx.visible=show;window.TOWER_CINEMA?.context(show)},
    spin:on=>{cancel();controls.autoRotate=!!on;controls.autoRotateSpeed=.65},
    light:value=>{window.TOWER_CINEMA?.cancelPrecision();applySourceLight(value);window.TOWER_CINEMA?.light(value)},
    telemetry:()=>({fps,quality,floor:C.cafeMode?C.interiorFloorKey:null,doll:!!C.dollMode,assetStatus:C.cafeMode?(C.interiorFloorKey==='1F'?'provisional':'provisional-unmapped'):null,environment:window.TOWER_CINEMA?({interactive:'실시간 탐색 · 회전 후 대기 없음',preparing:'정밀 렌더 준비 중…',rendering:'정밀 렌더 계산 중…',complete:'정밀 렌더 완료'})[window.TOWER_CINEMA.status().mode]:window.TOWER_CINEMA_FAILURE?'실시간 화면':environmentStatus,camera:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov,meshes:bld.children.length,geometryCount:renderer.info.memory.geometries}),
    exportModel:async(scope='building')=>{
      await load('360/assets/GLTFExporter.js');
      await load('360/assets/BufferGeometryUtils.js');
      const model=new T.Group(),materials=[],geometries=[],cache=new Map();
      const sources=scope==='scene'?[bld,C.city,C.site,C.ctx,extra,interiors,R3D.street,R3D.props]:[bld];
      sources.forEach(source=>model.add(source.clone(true)));
      model.traverse(o=>{o.userData={};if(!o.material)return;
        const convert=m=>{
          if(cache.has(m))return cache.get(m);
          const copy=new T.MeshStandardMaterial({color:m.color||0xaaaaaa,roughness:m.roughness??.7,metalness:m.metalness??0,opacity:m.opacity,transparent:m.transparent,side:m.side});
          copy.name=Object.entries(M).find(([,v])=>v===m)?.[0]||m.name||'surface-'+m.id;
          if(scope==='scene'){copy.map=m.map||null;copy.emissive.copy(m.emissive||new T.Color(0));copy.emissiveIntensity=m.emissiveIntensity||0}
          materials.push(copy);cache.set(m,copy);return copy;
        };
        o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
        if(o.isInstancedMesh){
          const parts=[],matrix=new T.Matrix4();
          for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);parts.push(o.geometry.clone().applyMatrix4(matrix))}
          const merged=T.BufferGeometryUtils.mergeBufferGeometries(parts);parts.forEach(g=>g.dispose());
          if(merged){o.geometry=merged;o.isInstancedMesh=false;geometries.push(merged)}
        }
      });
      try{return await new Promise((resolve,reject)=>{try{new T.GLTFExporter().parse(model,resolve,{binary:true,onlyVisible:true})}catch(e){reject(e)}})}
      finally{materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose())}
    }
  };
  await load('360/environment.js?v=cafe-3');
  await window.enhanceTowerEnvironment(C,extra,load);
  if(initial.display){document.getElementById('t-city').checked=initial.display.city!==false;document.getElementById('t-ctx').checked=initial.display.ctx!==false;C.city.visible=initial.display.city!==false;C.ctx.visible=initial.display.ctx!==false;}
  renderer.domElement.addEventListener('webglcontextlost',()=>{environmentStatus='그래픽 컨텍스트 중단 · 새로고침 필요'});
  if(new URLSearchParams(location.search).get('engine')==='cinema'){
    environmentStatus='실시간 재질 준비 중';
    try{const modern=await import('./modern.js?v=doll-1');await modern.start(C);return;}
    catch(error){window.TOWER_CINEMA_FAILURE=true;console.warn('Modern viewer unavailable; WebGL fallback',error)}
  }
  try{await load('360/assets/RGBELoader.js');const hdr=await new Promise((resolve,reject)=>new T.RGBELoader().setDataType(T.UnsignedByteType).load('360/assets/urban_courtyard_1k.hdr',resolve,undefined,reject));
    const generator=new T.PMREMGenerator(renderer);const target=generator.fromEquirectangular(hdr);env=target.texture;hdr.dispose();generator.dispose();environmentStatus='HDRI 적용 · 현장 촬영 아님';finishLighting();
    skyTexture=await new Promise((resolve,reject)=>new T.RGBELoader().setDataType(T.UnsignedByteType).load('360/assets/clear-noon-sky_2k.hdr',resolve,undefined,reject));
    skyTexture.mapping=T.EquirectangularReflectionMapping;finishLighting();
    // Capture the actual dressed 3D neighbourhood instead of an unrelated courtyard.
    const cube=new T.WebGLCubeRenderTarget(512,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
    const probe=new T.CubeCamera(1,1000,cube);probe.position.set(-3,18,0);scene.add(probe);
    const visible=bld.visible;bld.visible=false;probe.update(renderer,scene);bld.visible=visible;
    const pmrem=new T.PMREMGenerator(renderer);env=pmrem.fromCubemap(cube.texture).texture;pmrem.dispose();cube.dispose();scene.remove(probe);
    bld.traverse(o=>{if(o.material&&!Array.isArray(o.material)&&o.material.envMap){o.material.envMap=env;o.material.envMapIntensity=.85;o.material.needsUpdate=true}});
    finishLighting();

  }catch(e){environmentStatus='HDRI 실패 · 기존 하늘 조명 사용';console.warn(environmentStatus,e)}
})();
