/* Branch-only review: the existing controls remain the source of model state. */
(()=>{
  'use strict';
  const C=window.TOWER_LAB_CONTEXT,host=document.getElementById('viewer');
  const style=document.createElement('style');style.textContent=`
    #precision-frame{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2;background:#dce6ef}
    .precision-on .views,.precision-on .tools{z-index:8}
    .precision-on .intui,.precision-on .ihud{z-index:8}
    .precision-on > canvas{visibility:hidden}
    .precision-on .labels,.precision-on .compass,.precision-on .hint{visibility:hidden}
    .precision-on #mini,.precision-on .pad{visibility:hidden}
    #precision-status{position:absolute;left:16px;bottom:18px;z-index:9;background:#172126e8;color:#fff;padding:9px 13px;border-radius:8px;font-size:12px;pointer-events:none;max-width:85%}
    #cafe-reference{display:none;position:absolute;left:0;top:55px;bottom:55px;width:50%;z-index:3;background:#171b1c;color:white;box-sizing:border-box;padding:10px}
    #cafe-reference img{width:100%;height:calc(100% - 44px);object-fit:contain} #cafe-reference p{font-size:12px;margin:8px 0}
    .precision-on.cafe-compare #cafe-reference{display:block}
    .precision-on.cafe-compare #precision-frame{left:50%;width:50%}
    #precision-settings{padding:10px 0;font-size:12px} #precision-settings select{padding:5px;margin:4px}
  `;document.head.appendChild(style);
  const group=document.querySelector('[aria-label="보기 방식"]'),label=document.createElement('label');
  label.innerHTML='<input type="radio" name="vmode" value="precision" id="vm-precision"> 실시간 360°';group.appendChild(label);
  const settings=document.createElement('div');settings.id='precision-settings';settings.hidden=true;
  settings.innerHTML='<label>조명: 원본 날짜·시간·계절 설정 사용</label><label>품질 <select id="precision-quality"><option value="high">고품질</option><option value="balanced">균형</option></select></label><div><label><input type="checkbox" id="precision-bake" checked> 환경 베이킹·유리 개선</label></div><div style="margin:8px 0"><button id="precision-render" type="button">정밀 이미지 만들기</button> <button id="precision-cancel" type="button" hidden>탐색으로 돌아가기</button></div><div>원본 층 선택을 사용합니다. 1F 카페에는 검토용 가구가 있고 다른 층은 원본 구조와 임시 가구가 표시됩니다. 실내 시안·단면·표시 연결은 준비 중입니다.</div>';
  group.after(settings);document.getElementById('precision-bake').checked=new URLSearchParams(location.search).get('bake')!=='off';
  const compareLabel=document.createElement('label');compareLabel.style.display='block';compareLabel.style.marginTop='10px';compareLabel.innerHTML='<input type="checkbox" id="precision-cafe-compare"> 1층 실사와 나란히 비교';settings.appendChild(compareLabel);
  const referencePanel=document.createElement('section');referencePanel.id='cafe-reference';referencePanel.innerHTML='<p>원본 실사 · AI 인테리어 시안 <select aria-label="카페 실사 시점" id="cafe-photo-angle"></select></p><img id="cafe-reference-image" alt="기존 1층 카페 실사 이미지"><p>구조는 기존 모델 기준 · 가구 배치는 검토용 예시입니다.</p>';host.appendChild(referencePanel);
  const photoKeys=['1_back_mid','2_back_right','3_front_right','4_front_mid','5_front_left','6_back_left','7_hall'];const photoSelect=document.getElementById('cafe-photo-angle');photoKeys.forEach((key,i)=>photoSelect.add(new Option('시점 '+(i+1),key)));
  function cafePhoto(){const key=photoSelect.value,entry=window.PH?.man?.int?.f1;document.getElementById('cafe-reference-image').src=(window.PH?.src?.base||'https://wing-kim.github.io/kapehorn-media/')+(window.PH?.man?.tiers?.std||'std/')+(entry?.img?.[key]||'int/f1/'+key+'.webp');}
  photoSelect.onchange=cafePhoto;
  document.getElementById('precision-cafe-compare').onchange=e=>{host.classList.toggle('cafe-compare',e.target.checked);if(e.target.checked){cafePhoto();document.getElementById('precision-cafe').click();}};
  const views=document.querySelector('.views');
  const reference=document.createElement('button');reference.textContent='실사 근사 구도';reference.id='precision-reference';views.appendChild(reference);
  reference.onclick=()=>{clearComparison();C.cancel();if(C.interior())document.getElementById('v-corner').click();poseUntil=0;if(!active)enable();api()?.view('reference');currentFloorKey=null;};
  const home=document.createElement('button');home.id='precision-home';home.textContent='건물 전체 보기 ↗';home.title='건물 중심 공중 시점으로 복귀 (Home)';views.prepend(home);
  home.onclick=()=>{clearComparison();C.cancel();if(C.interior())document.getElementById('v-corner').click();poseUntil=0;if(!active)enable();api()?.view('aerial');currentFloorKey=null;};
  for(const [id,title,view] of [['precision-cafe','1층 카페 3D','cafe'],['precision-cafe-counter','카페 카운터','cafe-counter']]){const button=document.createElement('button');button.id=id;button.textContent=title;views.appendChild(button);button.onclick=()=>{poseUntil=0;C.cancel();if(!active)enable();C.selectInteriorFloor('1F');syncInterior(true);if(view==='cafe-counter')api()?.view(view);else if(!ready)pendingView='cafe';};}
  // The original floor chips and authored floor poses stay authoritative.
  const originalInterior=document.createElement('button');originalInterior.id='precision-original-interior';originalInterior.textContent='다른 층 · 기존 내부 보기';originalInterior.title='기존 층 선택·단면·실내 실사 보기';views.appendChild(originalInterior);
  originalInterior.textContent='층 선택';originalInterior.title='원본 층 선택을 실시간 3D에서 사용';
  originalInterior.onclick=()=>{clearComparison();if(!active)enable();if(!C.interior())C.enterInterior();syncInterior(true);};
  function clearComparison(){host.classList.remove('cafe-compare');document.getElementById('precision-cafe-compare').checked=false;}
  const reviewParams=new URLSearchParams(location.search);
  let pendingView=reviewParams.get('view')==='cafe'?'cafe':null;
  if(reviewParams.get('compare')==='1'){document.getElementById('precision-cafe-compare').checked=true;host.classList.add('cafe-compare');cafePhoto();pendingView='cafe';}
  if(pendingView==='cafe')C.selectInteriorFloor('1F');
  addEventListener('keydown',event=>{if(!active)return;api()?.navigateKey(event);if(['Home','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)&&!event.target?.closest?.('input,textarea,select,[contenteditable=true]'))event.stopImmediatePropagation()},true);

  const status=document.createElement('div');status.id='precision-status';status.hidden=true;host.appendChild(status);
  let frame=null,active=false,key='',daylightKey='',currentFloorKey=null,ready=false,timer=null,poseUntil=0,started=0,following=false,updating=false,queued=false,notice='',noticeUntil=0;
  let hostControlsEnabled=true,hostModernActive=false,lastExteriorView=null;
  const timings=[];
  const api=()=>frame?.contentWindow?.TOWER360;
  function snapshot(){return {state:{...C.state},display:{city:document.getElementById('t-city').checked,ctx:document.getElementById('t-ctx').checked},daylight:C.sourceDaylight(),floor:C.interiorState()};}
  const modelKey=config=>JSON.stringify({state:config.state,display:config.display});
  function copyPose(){const floor=C.interiorState();if(floor.on)api()?.interiorPose(floor.key,floor.camera,floor.target,floor.fov);else api()?.pose(C.camera.position.toArray(),C.controls.target.toArray())}
  function syncInterior(force=false){const floor=C.interiorState();if(!ready||!api())return;if(floor.on){if(force||currentFloorKey!==floor.key){api().interiorPose(floor.key,floor.camera,floor.target,floor.fov);currentFloorKey=floor.key;}}else if(currentFloorKey){api().view('corner');currentFloorKey=null;}}
  function followPose(){
    if(!active||(performance.now()>=poseUntil&&!C.interiorState().spin)){following=false;return;}
    copyPose();requestAnimationFrame(followPose);
  }
  function showNotice(message){notice=message;noticeUntil=performance.now()+6000;status.textContent=message;}
  async function rebuild(){
    if(!active)return;
    if(updating){queued=true;return;}
    const config=snapshot(),previous=api()?.telemetry();
    if(ready&&api()?.applyConfig&&frame.contentWindow.TOWER_CINEMA){
      updating=true;const current=frame,begin=performance.now();key=modelKey(config);daylightKey=JSON.stringify(config.daylight);
      try{await api().applyConfig(config);timings.push({kind:'switch',ms:performance.now()-begin,state:{...config.state}})}
      catch(error){console.warn('Model update failed',error);status.textContent='시안 적용 실패 · 다시 선택해 주세요';}
      finally{updating=false;if(queued&&active&&frame===current){queued=false;rebuild();}}
      return;
    }
    config.camera=previous?.camera||C.camera.position.toArray();config.target=previous?.target||C.controls.target.toArray();
    key=modelKey(config);daylightKey=JSON.stringify(config.daylight);ready=false;started=performance.now();
    // Unload the old document so GPU resources can be released before the next scene.
    frame?.contentWindow?.TOWER_CINEMA?.stop();frame?.remove();frame=document.createElement('iframe');frame.id='precision-frame';frame.title='선택한 시안의 실시간 360도 화면';
    const url=new URL(location.href);url.search='?lab=360&engine=cinema&model=cafe-2';url.hash=new URLSearchParams({config:JSON.stringify(config)}).toString();
    if(!document.getElementById('precision-bake').checked)url.searchParams.set('bake','off');
    frame.style.visibility='hidden';frame.src=url.href;host.appendChild(frame);status.textContent='선택한 시안의 재질·조명 준비 중…';
  }
  function disable(){
    if(!active)return;
    active=false;poseUntil=0;following=false;clearTimeout(timer);
    const child=frame?.contentWindow,position=child?.TOWER360?.telemetry?.();
    // A cafe camera is inside the building; keep the last usable exterior host
    // camera in that case. Otherwise carry the free exterior viewpoint home.
    if(position&&C.interior())C.restoreInteriorPose(position.camera,position.target,position.fov,position.floor);
    else if(position&&!child.TOWER_LAB_CONTEXT?.cafeMode){
      C.cancel();C.camera.position.fromArray(position.camera);C.controls.target.fromArray(position.target);C.controls.update();
    }
    if(lastExteriorView&&!C.interior()){
      document.querySelectorAll('.views [data-v]').forEach(button=>button.setAttribute('aria-pressed',String(button===lastExteriorView)));
      document.getElementById('v-int').setAttribute('aria-pressed','false');
    }
    child?.TOWER_CINEMA?.pause(true);
    if(frame)frame.style.display='none';
    C.controls.enabled=C.interior()?!C.interiorState().look:hostControlsEnabled;window.TOWER_MODERN_ACTIVE=hostModernActive;host.classList.remove('precision-on');settings.hidden=status.hidden=true;document.getElementById('sec-time').hidden=!C.R3D.on;
    if(document.activeElement===frame)document.getElementById('vm-sketch').focus({preventScroll:true});
  }
  function enable(){
    if(active)return;if(window.PH?.on)window.PH.set(false);
    hostControlsEnabled=C.controls.enabled;hostModernActive=!!window.TOWER_MODERN_ACTIVE;
    lastExteriorView=document.querySelector('.views [data-v][aria-pressed="true"]')||lastExteriorView||document.getElementById('v-corner');
    if(C.R3D.on)C.setRender(false);document.getElementById('vm-precision').checked=true;
    active=true;C.controls.enabled=false;window.TOWER_MODERN_ACTIVE=true;host.classList.add('precision-on');settings.hidden=status.hidden=false;document.getElementById('sec-time').hidden=false;
    if(frame&&ready){frame.style.display='block';frame.contentWindow.TOWER_CINEMA?.pause(false);const config=snapshot();if(modelKey(config)!==key)rebuild();else if(JSON.stringify(config.daylight)!==daylightKey){api()?.light(config.daylight);daylightKey=JSON.stringify(config.daylight);}}
    else rebuild();
  }
  document.addEventListener('change',event=>{
    const el=event.target;
    if(active&&(['t-labels','t-cxlab','t-limits','t-b1'].includes(el.id)||el.name==='era')){
      disable();document.getElementById('vm-sketch').checked=true;
    }
    if(el.name==='vmode'){
      if(el.value==='precision'){event.stopImmediatePropagation();enable();}
      else disable();
    }
  },true);
  document.addEventListener('click',event=>{
    if(!active)return;
    const button=event.target.closest('[data-v]');
    if(button){if(button.dataset.v==='int'){
      // Let the original enterInt() set the selected floor, HUD and floor chips.
      requestAnimationFrame(()=>syncInterior(true));return;
    }else {
      clearComparison();
      lastExteriorView=button;
      const previous=api()?.telemetry();if(previous){C.camera.position.fromArray(previous.camera);C.controls.target.fromArray(previous.target);C.controls.update();}
      poseUntil=performance.now()+1400;if(!following){following=true;requestAnimationFrame(followPose);}
    }}
    if(event.target.closest('#floorChips button'))requestAnimationFrame(()=>syncInterior(true));
    if(event.target.closest('[data-c],#coreHall,[data-w]')){poseUntil=performance.now()+1400;if(!following){following=true;requestAnimationFrame(followPose);}}
    if(event.target.closest('#exitInt'))requestAnimationFrame(()=>syncInterior(true));
    if(event.target.closest('#coreTop,#dollBtn,#secBtn,#secAllBtn,[data-iv]')){event.preventDefault();event.stopImmediatePropagation();showNotice(event.target.closest('#coreTop')?'코어 상부 시점 · 단면 절단은 실사 3D 연결 준비 중입니다.':'단면·표시 도구는 실사 3D 연결 준비 중입니다.');return;}
    if(event.target.closest('#capBtn')){
      event.stopImmediatePropagation();
      const w=frame?.contentWindow,canvas=w?.TOWER_CINEMA?.captureCanvas||w?.TOWER_CINEMA?.renderer.domElement||w?.TOWER_LAB_CONTEXT?.renderer.domElement;
      if(canvas){document.getElementById('capImg').src=canvas.toDataURL('image/png');document.getElementById('capTxt').textContent='360도 현재 화면';document.getElementById('capBox').hidden=false;}
    }
  },true);
  document.getElementById('precision-bake').onchange=e=>api()?.appearance(e.target.checked);
  document.getElementById('precision-render').onclick=()=>api()?.requestPrecision();
  document.getElementById('precision-cancel').onclick=()=>api()?.cancelPrecision();
  document.getElementById('precision-quality').onchange=e=>api()?.quality(e.target.value);
  setInterval(()=>{
    if(!active){frame?.contentWindow?.TOWER_CINEMA?.pause(true);return;}
    const config=snapshot(),next=modelKey(config);
    if(next!==key){key=next;clearTimeout(timer);timer=setTimeout(rebuild,120);status.textContent='변경한 시안 적용 중…';return;}
    const nextDaylight=JSON.stringify(config.daylight);
    if(ready&&nextDaylight!==daylightKey){api()?.light(config.daylight);daylightKey=nextDaylight;}
    if(!api()){if(performance.now()-started>60000)status.textContent='장면 준비 지연 · 다른 보기로 전환 후 다시 시도해 주세요';return;}
    const w=frame.contentWindow;
    if(!ready&&w.TOWER_CINEMA){ready=true;w.addEventListener('tower-navigation-start',()=>{poseUntil=0;C.cancel()});w.addEventListener('tower-navigation-home',()=>{document.getElementById('v-corner').click();poseUntil=0;currentFloorKey=null;});timings.push({kind:'initial',ms:performance.now()-started});api().quality(document.getElementById('precision-quality').value);syncInterior(true);}
    else syncInterior();
    const renderState=w.TOWER_CINEMA?.status();
    const floor=C.interiorState(),inCafe=floor.on&&floor.key==='1F';
    document.getElementById('precision-cafe').setAttribute('aria-pressed',String(inCafe));
    document.getElementById('v-int').setAttribute('aria-pressed',String(floor.on));
    if(floor.on)document.querySelectorAll('[data-v]:not([data-v="int"])').forEach(button=>button.setAttribute('aria-pressed','false'));
    else if(!pendingView)clearComparison();
    if(renderState?.firstFrameMs!=null||w.TOWER_CINEMA_FAILURE){frame.style.visibility='visible';if(pendingView){api().view(pendingView);pendingView=null;}}
    document.getElementById('precision-cancel').hidden=!renderState||renderState.mode==='interactive';
    document.getElementById('precision-render').disabled=!ready||updating||renderState?.mode==='preparing'||renderState?.mode==='rendering'||renderState?.mode==='complete';
    status.textContent=updating?'선택한 건물 적용 중…':renderState?.error?'정밀 계산 실패 · 실시간 탐색 가능':(renderState?.firstFrameMs==null&&!w.TOWER_CINEMA_FAILURE?'재질·조명 준비 중…':api().telemetry().environment+(floor.on?(inCafe?' · 1F 카페 검토용 가구 · WASD 이동':' · '+floor.key+' 원본 구조 · 임시 가구 · 실내 시안 미연결'):' · 휠 확대 · WASD 이동 · Q/E 높이 · Home 전체 보기'));
    if(w.TOWER_CINEMA_FAILURE)status.textContent='정밀 렌더 미지원 · 실시간 화면 표시';
    if(floor.on&&floor.doll)status.textContent+=' · 단면 절단은 실사 3D 미연결';
    if(notice&&performance.now()<noticeUntil)status.textContent+=' · '+notice;
  },200);
  window.TOWER_REVIEW={enable,disable,snapshot,timings,get frame(){return frame}};
  enable();
})();
