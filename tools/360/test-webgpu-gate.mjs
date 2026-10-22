// 실사 3D는 WebGPU로만 그린다. 쓸 수 없는 환경에서 선택지를 막고, 멈춘 화면 대신 원본 보기로 되돌리는지 확인한다.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../new/360/integrated.js',import.meta.url),'utf8');

function element(id=''){
  const attrs=new Map();
  return {id,style:{},hidden:false,checked:false,value:'pm',children:[],
    classList:{add(){},remove(){},toggle(){}},
    appendChild(child){this.children.push(child);return child},prepend(child){this.children.unshift(child)},after(node){(this.afterNodes=this.afterNodes||[]).push(node)},remove(){this.removed=true},focus(){},
    setAttribute(key,value){attrs.set(key,String(value))},getAttribute(key){return attrs.get(key)},
    addEventListener(){},add(){},click(){this.onclick?.()},
    querySelector(selector){this._parts=this._parts||new Map();if(!this._parts.has(selector))this._parts.set(selector,element(selector));return this._parts.get(selector)},
    get dataset(){return this._dataset||{}},set dataset(value){this._dataset=value},
  };
}

function boot(gpu){
  const ids=new Map();
  for(const id of ['viewer','intui','v-corner','v-front','v-int','vm-sketch','vm-precision','precision-light','precision-quality','precision-bake','precision-cafe-compare','precision-cafe','precision-cancel','precision-render','t-city','t-ctx','t-labels','t-cxlab','t-limits','t-b1','sec-time','cafe-photo-angle','cafe-reference-image'])ids.set(id,element(id));
  ids.get('viewer').getBoundingClientRect=()=>({top:100,bottom:820});
  ids.get('intui').getBoundingClientRect=()=>({top:110,bottom:294});
  const views=element('views'),group=element('group');
  for(const [id,view] of [['v-corner','corner'],['v-int','int']]){const button=ids.get(id);button.dataset={v:view};button.setAttribute('aria-pressed','true');views.appendChild(button)}
  const document={head:element(),activeElement:null,
    createElement:tag=>element(tag),getElementById:id=>ids.get(id)||element(id),
    querySelector:selector=>selector==='.views'?views:selector==='[aria-label="보기 방식"]'?group:selector==='.views [data-v][aria-pressed="true"]'?views.children[0]:null,
    querySelectorAll:selector=>selector==='.views [data-v]'?views.children.filter(b=>b.dataset.v):[],
    addEventListener(){},
  };
  function vector(initial){let values=[...initial];return {toArray:()=>[...values],fromArray(v){values=[...v]},update(){}}}
  const C={state:{scheme:'A'},R3D:{on:false},sourceDaylight:()=>({time:'pm',season:'spring',direction:[1,1,0],intensity:2.6,color:0xffffff}),
    camera:{position:vector([1,2,3]),fov:45,updateProjectionMatrix(){}},controls:{enabled:true,target:vector([4,5,6]),update(){}},
    interior:()=>false,interiorState:()=>({on:false,key:'1F',camera:[1,2,3],target:[4,5,6]}),setRender(){},cancel(){}};
  let interval,now=100;
  const context={window:{TOWER_LAB_CONTEXT:C,TOWER_MODERN_ACTIVE:false},document,URL,URLSearchParams,Option:class{},
    ResizeObserver:class{observe(){}},location:{href:'https://example.test/3d-model.html?lab=review',search:'?lab=review'},
    performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},setInterval(fn){interval=fn},requestAnimationFrame(){},addEventListener(){},console};
  if(gpu)context.navigator={gpu};
  vm.runInNewContext(source,context);
  const label=group.children[0],note=label.children.find(child=>child.id==='precision-gpu-note');
  const help=(group.afterNodes||[]).find(node=>node.id==='precision-gpu-help');
  const alert=ids.get('viewer').children.find(child=>child.id==='precision-gpu-alert');
  return {review:context.window.TOWER_REVIEW,ids,note,help,alert,tick:()=>interval()};
}

// 1) WebGPU가 없는 브라우저: 선택지를 막고 이유를 보여 주며, 실사 화면 자체를 만들지 않는다.
{
  const {review,ids,note,help}=boot(null);
  assert.equal(ids.get('vm-precision').disabled,true,'WebGPU가 없으면 실사 3D 선택지를 고를 수 없다');
  assert.equal(note.hidden,false,'선택지 옆에 쓸 수 없다고 표시한다');
  assert.equal(help.hidden,false,'왜 못 쓰는지와 해결법을 보기 방식 아래에 보여 준다');
  assert.match(help.textContent,/크롬이나 엣지/,'해결법에 권장 브라우저가 들어 있다');
  assert.match(help.textContent,/macOS 26/,'사파리 조건도 안내한다');
  assert.equal(review.frame,null,'?lab=review로 열어도 실사 화면을 띄우지 않는다');
  review.enable();
  assert.equal(review.frame,null,'직접 켜려 해도 실사 화면을 만들지 않는다');
  assert.equal(ids.get('vm-sketch').checked,true,'원본 보기로 둔다');
}

// 2) WebGPU가 있는 브라우저: 평소대로 실사 화면을 띄운다.
{
  const {review,ids,note,help}=boot({requestAdapter:async()=>({})});
  assert.equal(ids.get('vm-precision').disabled,false,'쓸 수 있으면 선택지를 막지 않는다');
  assert.equal(note.hidden,true,'쓸 수 있으면 표시를 띄우지 않는다');
  assert.equal(help.hidden,true,'쓸 수 있으면 안내 문구를 띄우지 않는다');
  assert.ok(review.frame,'?lab=review는 실사 화면을 띄운다');
}

// 3) 켠 뒤에 렌더러가 실패하면: 멈춘 화면을 남기지 않고 원본 보기로 되돌린다.
{
  const {review,ids,help,alert,tick}=boot({requestAdapter:async()=>({})});
  const frame=review.frame;
  frame.contentWindow={TOWER360:{telemetry:()=>({camera:[10,20,30],target:[2,3,4],fov:45})},TOWER_LAB_CONTEXT:{cafeMode:false},TOWER_CINEMA_FAILURE:true};
  tick();
  assert.equal(review.frame,null,'멈춘 실사 화면을 치운다');
  assert.equal(frame.removed,true,'실사 화면을 문서에서 들어낸다');
  assert.equal(ids.get('vm-sketch').checked,true,'원본 보기로 되돌린다');
  assert.equal(ids.get('vm-precision').checked,false,'실사 3D 선택을 풀어 준다');
  assert.equal(ids.get('vm-precision').disabled,true,'다시 고를 수 없게 막는다');
  assert.equal(help.hidden,false,'보기 방식 아래 안내도 함께 켠다');
  assert.equal(alert.hidden,false,'왜 돌아왔는지 화면에 알린다');
  assert.match(alert.children[0].textContent,/원본 화면으로 돌아왔습니다/,'되돌렸다는 사실을 알린다');
  tick();
  assert.equal(review.frame,null,'되돌린 뒤 다시 만들지 않는다');
}

console.log('webgpu gate ok');
