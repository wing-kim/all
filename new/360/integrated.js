/* Branch-only review: the existing controls remain the source of model state. */
(()=>{
  'use strict';
  const C=window.TOWER_LAB_CONTEXT,host=document.getElementById('viewer');
  const style=document.createElement('style');style.textContent=`
    #precision-frame{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2;background:#dce6ef}
    .precision-on .views,.precision-on .tools{z-index:8}
    .precision-on .labels,.precision-on .compass,.precision-on .hint{visibility:hidden}
    #precision-status{position:absolute;left:16px;bottom:18px;z-index:9;background:#172126e8;color:#fff;padding:9px 13px;border-radius:8px;font-size:12px;pointer-events:none;max-width:85%}
    #precision-settings{padding:10px 0;font-size:12px} #precision-settings select{padding:5px;margin:4px}
  `;document.head.appendChild(style);
  const group=document.querySelector('[aria-label="보기 방식"]'),label=document.createElement('label');
  label.innerHTML='<input type="radio" name="vmode" value="precision" id="vm-precision"> 정밀 360°';group.appendChild(label);
  const settings=document.createElement('div');settings.id='precision-settings';settings.hidden=true;
  settings.innerHTML='<label>조명 <select id="precision-light"><option value="pm">맑은 오후</option><option value="am">오전</option><option value="sunset">석양</option></select></label><label>품질 <select id="precision-quality"><option value="high">고품질</option><option value="balanced">균형</option></select></label><div>시안·외장재 변경 시 정밀 장면을 다시 준비합니다. 실사 버튼으로 원본과 비교하세요. 내부·단면·치수 표시는 스케치업으로 전환합니다.</div>';
  group.after(settings);
  const views=document.querySelector('.views');
  const reference=document.createElement('button');reference.textContent='실사 근사 구도';reference.id='precision-reference';views.appendChild(reference);
  reference.onclick=()=>{if(!active)enable();api()?.view('reference');};
  const status=document.createElement('div');status.id='precision-status';status.hidden=true;host.appendChild(status);
  let frame=null,active=false,key='',ready=false,timer=null,poseUntil=0,started=0,following=false;
  const api=()=>frame?.contentWindow?.TOWER360;
  function snapshot(){return {state:{...C.state},display:{city:document.getElementById('t-city').checked,ctx:document.getElementById('t-ctx').checked},time:document.getElementById('precision-light').value,season:C.R3D.season};}
  function copyPose(){api()?.pose(C.camera.position.toArray(),C.controls.target.toArray())}
  function followPose(){
    if(!active||performance.now()>=poseUntil){following=false;return;}
    copyPose();requestAnimationFrame(followPose);
  }
  function rebuild(){
    if(!active)return;
    const config=snapshot(),previous=api()?.telemetry();
    config.camera=previous?.camera||C.camera.position.toArray();config.target=previous?.target||C.controls.target.toArray();
    key=JSON.stringify(snapshot());ready=false;started=performance.now();
    // Unload the old document so GPU resources can be released before the next scene.
    frame?.contentWindow?.TOWER_CINEMA?.stop();frame?.remove();frame=document.createElement('iframe');frame.id='precision-frame';frame.title='선택한 시안의 정밀 360도 화면';
    const url=new URL(location.href);url.search='?lab=360&engine=cinema&model=review-6';url.hash=new URLSearchParams({config:JSON.stringify(config)}).toString();
    frame.src=url.href;host.appendChild(frame);status.textContent='선택한 시안의 재질·조명 준비 중…';
  }
  function disable(){active=false;clearTimeout(timer);frame?.contentWindow?.TOWER_CINEMA?.stop();frame?.remove();frame=null;ready=false;C.controls.enabled=true;window.TOWER_MODERN_ACTIVE=false;host.classList.remove('precision-on');settings.hidden=status.hidden=true;}
  function enable(){
    if(active)return;if(window.PH?.on)window.PH.set(false);
    C.setRender(false);document.getElementById('vm-precision').checked=true;
    active=true;C.controls.enabled=false;window.TOWER_MODERN_ACTIVE=true;host.classList.add('precision-on');settings.hidden=status.hidden=false;rebuild();
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
    if(button){if(button.dataset.v==='int'){disable();document.getElementById('vm-sketch').checked=true;}else {
      const previous=api()?.telemetry();if(previous){C.camera.position.fromArray(previous.camera);C.controls.target.fromArray(previous.target);C.controls.update();}
      poseUntil=performance.now()+1400;if(!following){following=true;requestAnimationFrame(followPose);}
    }}
    if(event.target.closest('#capBtn')){
      event.stopImmediatePropagation();
      const w=frame?.contentWindow,canvas=w?.TOWER_CINEMA?.renderer.domElement||w?.TOWER_LAB_CONTEXT?.renderer.domElement;
      if(canvas){document.getElementById('capImg').src=canvas.toDataURL('image/png');document.getElementById('capTxt').textContent='정밀 360도 현재 화면';document.getElementById('capBox').hidden=false;}
    }
  },true);
  document.getElementById('precision-light').onchange=e=>{api()?.light(e.target.value);key=JSON.stringify(snapshot());};
  document.getElementById('precision-quality').onchange=e=>api()?.quality(e.target.value);
  setInterval(()=>{
    if(!active)return;
    if(C.interior()){disable();document.getElementById('vm-sketch').checked=true;return;}
    const next=JSON.stringify(snapshot());
    if(next!==key){key=next;clearTimeout(timer);timer=setTimeout(rebuild,350);status.textContent='변경한 시안 적용 중…';return;}
    if(!api()){if(performance.now()-started>60000)status.textContent='장면 준비 지연 · 다른 보기로 전환 후 다시 시도해 주세요';return;}
    const w=frame.contentWindow;
    if(!ready&&w.TOWER_CINEMA){ready=true;api().quality(document.getElementById('precision-quality').value);}
    status.textContent=api().telemetry().environment;
    if(w.TOWER_CINEMA_FAILURE)status.textContent='정밀 렌더 미지원 · 실시간 화면 표시';
  },500);
  window.TOWER_REVIEW={enable,disable,snapshot,get frame(){return frame}};
  enable();
})();
