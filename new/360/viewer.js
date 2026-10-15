'use strict';
const frame=document.getElementById('scene'),status=document.getElementById('status');
const engine=new URLSearchParams(location.search).get('engine');if(engine!=='realtime'&&navigator.gpu)frame.src='../3d-model.html?lab=360&engine=cinema&model=v87-camera-1';
const api=()=>frame.contentWindow?.TOWER360;
const controls=[...document.querySelectorAll('nav button,.settings button,.settings select')];controls.forEach(e=>e.disabled=true);
const reference=document.getElementById('reference'),label=document.getElementById('reference-label');
const mapping={corner:['045','45° 코너'],street:['045','45° 코너 (카메라 높이 다름)'],aerial:['045','45° 코너 (조감 근사 비교)'],front:['000','0° 정면'],back:['180','180° 후면'],left:['270','270° 좌측'],right:['090','90° 우측']};
const spin=document.getElementById('spin');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{api()?.view(b.dataset.view);spin.setAttribute('aria-pressed','false');document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));const [angle,name]=mapping[b.dataset.view];reference.src=`https://wing-kim.github.io/kapehorn-media/std/ext/glass/${angle}.webp`;label.textContent=name+' · AI 이미지';reference.alt='올 글라스 '+name+' 기존 실사 이미지'});
spin.onclick=()=>{const on=spin.getAttribute('aria-pressed')!=='true';spin.setAttribute('aria-pressed',on);api()?.spin(on)};
document.getElementById('light').onchange=e=>api()?.light(e.target.value);
document.getElementById('quality').onchange=e=>api()?.quality(e.target.value);
document.getElementById('export').onclick=async e=>{const button=e.currentTarget;button.disabled=true;try{const bytes=await api().exportModel();const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='kapehorn-alt4-reference.glb';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}catch(error){status.textContent='GLB 저장 실패: '+error.message}finally{button.disabled=false}};
document.getElementById('compare').onclick=e=>{const solo=document.getElementById('stage').classList.toggle('solo');e.target.setAttribute('aria-pressed',!solo);e.target.textContent=solo?'원본 비교 켜기':'원본 비교 끄기'};
if(matchMedia('(max-width:850px)').matches){document.getElementById('stage').classList.add('solo');const b=document.getElementById('compare');b.setAttribute('aria-pressed','false');b.textContent='원본 비교 켜기';}
reference.onerror=()=>{label.textContent='원본 로딩 실패 · 기존 뷰어에서 확인해 주세요'};
let ready=false,seconds=0;
setInterval(()=>{const a=api();if(!a){if(++seconds>30)status.textContent='모델 로딩 지연 · WebGL 지원 및 새로고침을 확인해 주세요';return}if(!ready){controls.forEach(e=>e.disabled=false);document.getElementById('quality').value=a.telemetry().quality;ready=true}const s=a.telemetry();status.textContent=s.environment.includes('정밀')?s.environment:`${s.fps} FPS · ${s.environment}`},1000);

document.getElementById('context').onclick=e=>{const show=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',show);api()?.context(show)};
