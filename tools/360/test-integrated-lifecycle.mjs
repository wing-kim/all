import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ids=new Map();
function element(id=''){
  const attrs=new Map();
  return {id,style:{},hidden:false,checked:false,value:'pm',children:[],
    classList:{add(){},remove(){},toggle(){}},
    appendChild(child){this.children.push(child);return child},prepend(child){this.children.unshift(child)},after(){},remove(){},focus(){},
    setAttribute(key,value){attrs.set(key,String(value))},getAttribute(key){return attrs.get(key)},
    addEventListener(){},add(){},click(){this.onclick?.()},
    get dataset(){return this._dataset||{}},set dataset(value){this._dataset=value},
  };
}
for(const id of ['viewer','intui','v-corner','v-front','v-int','vm-sketch','vm-precision','precision-light','precision-quality','precision-bake','precision-cafe-compare','precision-cafe','precision-cancel','precision-render','t-city','t-ctx','t-labels','t-cxlab','t-limits','t-b1','sec-time','cafe-photo-angle','cafe-reference-image'])ids.set(id,element(id));
ids.get('t-limits').checked=true;
ids.get('viewer').getBoundingClientRect=()=>({top:100,bottom:820});
let toolbarBottom=294,resizeObserved;
ids.get('intui').getBoundingClientRect=()=>({top:110,bottom:toolbarBottom});
ids.get('sec-time').hidden=true;
const views=element('views'),group=element('group');
for(const [id,view,pressed] of [['v-corner','corner','true'],['v-front','front','false'],['v-int','int','false']]){
  const button=ids.get(id);button.dataset={v:view};button.setAttribute('aria-pressed',pressed);views.appendChild(button);
}
const listeners=new Map(),frames=[];
const document={head:element(),activeElement:null,
  createElement:tag=>element(tag),getElementById:id=>ids.get(id)||element(id),
  querySelector:selector=>selector==='.views'?views:selector==='[aria-label="보기 방식"]'?group:selector==='.views [data-v][aria-pressed="true"]'?views.children.find(b=>b.dataset.v&&b.getAttribute('aria-pressed')==='true'):null,
  querySelectorAll:selector=>selector==='.views [data-v]'?views.children.filter(b=>b.dataset.v):[],
  addEventListener(type,fn){listeners.set(type,fn)},
};
function vector(initial){let values=[...initial];return {toArray:()=>[...values],fromArray(v){values=[...v]},update(){}}}
const C={state:{scheme:'A'},R3D:{on:false,season:'spring'},sourceDaylight:()=>({time:'pm',season:'spring',direction:[1,1,0],intensity:2.6,color:0xffffff}),camera:{position:vector([1,2,3]),fov:45,updateProjectionMatrix(){this.projectionUpdates=(this.projectionUpdates||0)+1}},controls:{enabled:true,target:vector([4,5,6]),update(){}},interior:()=>false,interiorState:()=>({on:false,key:'1F',camera:C.camera.position.toArray(),target:C.controls.target.toArray()}),setRender(){throw Error('sketch entry should not rebuild')},cancel(){C.cancelled=true}};
let interval,now=100;const context={window:{TOWER_LAB_CONTEXT:C,TOWER_MODERN_ACTIVE:false},document,URL,URLSearchParams,Option:class{},ResizeObserver:class{constructor(callback){resizeObserved=callback}observe(){}},location:{href:'https://example.test/3d-model.html?lab=review',search:'?lab=review'},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},setInterval(fn){interval=fn},requestAnimationFrame(fn){frames.push(fn)},addEventListener(){},console};
vm.runInNewContext(readFileSync(new URL('../../new/360/integrated.js',import.meta.url),'utf8'),context);
const review=context.window.TOWER_REVIEW;
assert.equal(C.controls.enabled,true,'original controls keep mouse/touch/key input while the photoreal view is active');
assert.equal(ids.get('sec-time').hidden,false,'the original time controls remain visible in precision mode');
const comparison=ids.get('precision-cafe-compare'),referencePanel=ids.get('viewer').children.find(child=>child.id==='cafe-reference');
comparison.checked=true;comparison.onchange({target:comparison});frames.splice(0).forEach(fn=>fn());
assert.equal(referencePanel.style.top,'204px','photo selector clears the original interior toolbar');
toolbarBottom=338;resizeObserved();
assert.equal(referencePanel.style.top,'248px','photo panel follows a wrapped or resized original toolbar');
assert.match(document.head.children[0].textContent,/#cafe-reference img\{[^}]*flex:1/,'photo and caption share the remaining panel height');
const frame=review.frame;
let pauses=[];
frame.contentWindow={TOWER360:{telemetry:()=>({camera:[10,20,30],target:[2,3,4]})},TOWER_LAB_CONTEXT:{cafeMode:false},TOWER_CINEMA:{pause:v=>pauses.push(v),stop(){}}};
review.disable();
assert.deepEqual(C.camera.position.toArray(),[10,20,30],'exterior camera returns to host');
assert.deepEqual(C.controls.target.toArray(),[2,3,4]);
assert.equal(C.controls.enabled,true);
assert.equal(ids.get('sec-time').hidden,true,'original sketch mode hides time controls on exit');
assert.deepEqual(pauses,[true]);

C.controls.enabled=false;context.window.TOWER_MODERN_ACTIVE=true;
review.disable();
assert.equal(C.controls.enabled,false,'inactive adapter leaves original interior controls alone');
assert.equal(context.window.TOWER_MODERN_ACTIVE,true,'inactive adapter leaves render ownership alone');

C.controls.enabled=true;context.window.TOWER_MODERN_ACTIVE=false;
review.enable();
const cafeFrame=review.frame;
cafeFrame.contentWindow={TOWER360:{telemetry:()=>({camera:[99,99,99],target:[98,98,98]})},TOWER_LAB_CONTEXT:{cafeMode:true},TOWER_CINEMA:{pause(){},stop(){}}};
ids.get('v-corner').setAttribute('aria-pressed','false');ids.get('v-int').setAttribute('aria-pressed','true');
review.disable();
assert.deepEqual(C.camera.position.toArray(),[10,20,30],'cafe camera does not strand original viewer inside building');
assert.equal(ids.get('v-corner').getAttribute('aria-pressed'),'true','original exterior selection is restored');
assert.equal(ids.get('v-int').getAttribute('aria-pressed'),'false');
let daylight={time:'pm',season:'spring',direction:[1,1,0],intensity:2.6,color:0xffffff},lightCalls=[],floorCalls=[],limitCalls=[];
C.sourceDaylight=()=>daylight;
review.enable();const daylightFrame=review.frame,childListeners=new Map();
daylightFrame.contentWindow={TOWER360:{telemetry:()=>({environment:'ready',camera:[10,20,30],target:[2,3,4]}),quality(){},view(){},light:value=>lightCalls.push(value),limits:value=>limitCalls.push(value),interiorPose:(...args)=>floorCalls.push(args)},TOWER_CINEMA:{status:()=>({mode:'interactive',firstFrameMs:1}),pause(){}},TOWER_LAB_CONTEXT:{cafeMode:false},addEventListener(type,fn){childListeners.set(type,fn)}};
interval();daylight={...daylight,direction:[-1,1,0],intensity:1.7};interval();
assert.deepEqual(limitCalls,[true],'initial authored limit-line state reaches the child');
assert.equal(review.frame,daylightFrame,'daylight-only change keeps the building frame');
assert.equal(lightCalls.length,1,'daylight-only change updates light once');
assert.equal(lightCalls[0].intensity,1.7);
// 원본 카메라가 기준: 원본 컨트롤이 움직인 카메라를 실사 화면에 그대로 넘긴다(역방향 복사 없음).
const driveCalls=[];daylightFrame.contentWindow.TOWER360.drive=(...args)=>driveCalls.push(args);
C.camera.position.fromArray([17,21,32]);C.controls.target.fromArray([3,4,5]);C.camera.fov=58;
frames.splice(0).forEach(fn=>fn());
assert.deepEqual(driveCalls.at(-1),[[17,21,32],[3,4,5],58],'the original camera drives the photoreal view');
assert.deepEqual(C.camera.position.toArray(),[17,21,32],'the photoreal view never overwrites the original camera');
for(const id of ['t-labels','t-cxlab']){
  listeners.get('change')({target:ids.get(id),stopImmediatePropagation(){}});
  assert.equal(C.controls.enabled,true,`${id} keeps original input`);
  assert.equal(review.frame,daylightFrame,`${id} preserves the renderer frame`);
}
ids.get('t-limits').checked=false;
listeners.get('change')({target:ids.get('t-limits'),stopImmediatePropagation(){}});
assert.equal(limitCalls.at(-1),false,'limit-line toggle reaches the child without a model rebuild');
assert.equal(review.frame,daylightFrame);
assert.equal(C.controls.enabled,true,'limit-line toggle keeps original input');
let selectedFloor='1F',sourcePose={camera:[0,1.6,2],target:[0,1.6,1.7],fov:72,spin:false,doll:false};C.interiorState=()=>({on:true,key:selectedFloor,...sourcePose});
interval();assert.equal(floorCalls.length,1);assert.equal(floorCalls[0][0],'1F');
selectedFloor='2F';interval();assert.equal(floorCalls.length,2);assert.equal(floorCalls[1][0],'2F');
assert.equal(review.frame,daylightFrame,'floor selection uses the existing renderer frame');
const click=selector=>listeners.get('click')({target:{closest:query=>query.includes(selector)?{}:null},preventDefault(){},stopImmediatePropagation(){}});
sourcePose={camera:[8,11,13],target:[8,11,12],fov:45,spin:false,doll:false};
// 원본 모서리 버튼이 원본 카메라를 옮기면(실제 앱에서는 interiorState().camera가 그 카메라) 같은 값이 실사로 간다.
click('[data-c]');C.camera.position.fromArray(sourcePose.camera);C.controls.target.fromArray(sourcePose.target);C.camera.fov=45;frames.splice(0).forEach(fn=>fn());
assert.deepEqual(driveCalls.at(-1),[sourcePose.camera,sourcePose.target,45],'authored interior corner pose and field of view reach the child');
sourcePose={...sourcePose,doll:true};click('#coreTop');interval();
const status=ids.get('viewer').children.find(child=>child.id==='precision-status');
assert.equal(floorCalls.at(-1)[4],true,'core top enters the original dollhouse visibility mode');
assert.match(status.textContent,/원본 층별 가시성/);assert.doesNotMatch(status.textContent,/종단면 절단/,'dollhouse visibility alone does not claim a section cut');
// 원본 secBtn이 부모 렌더러에 절단면을 걸면 같은 평면이 실사 장면으로 전달되고 상태 문구에 표시된다.
C.renderer={clippingPlanes:[{normal:{x:0,y:0,z:-1},constant:6.78}]};click('#secBtn');frames.splice(0).forEach(fn=>fn());interval();
assert.match(status.textContent,/원본 종단면 절단/,'section cut is reported only while the original applies one');C.renderer={clippingPlanes:[]};
sourcePose={camera:[3,2,4],target:[3,2,3.7],fov:72,spin:false,doll:false};click('#coreHall');interval();
assert.equal(floorCalls.at(-1)[4],false,'walking back out clears dollhouse visibility');
selectedFloor='3F';interval();sourcePose={...sourcePose,doll:true};click('#dollBtn');interval();
assert.equal(floorCalls.at(-1)[0],'3F');assert.equal(floorCalls.at(-1)[4],true,'another floor can enter dollhouse without rebuilding');
let originalHomeClicks=0;
ids.get('v-corner').onclick=()=>{originalHomeClicks++;C.interiorState=()=>({on:false,key:'2F',look:false})};
childListeners.get('tower-navigation-home')();interval();
assert.equal(originalHomeClicks,1,'child Home invokes the original exterior-view command');
assert.equal(ids.get('v-int').getAttribute('aria-pressed'),'false','child Home clears the source interior selection');
let restored;
C.interior=()=>true;C.interiorState=()=>({on:true,key:'2F',look:true});C.restoreInteriorPose=(...args)=>{restored=args};
daylightFrame.contentWindow.TOWER360.telemetry=()=>({camera:[9,12,14],target:[9,12,13],fov:69,floor:'2F'});
review.disable();assert.deepEqual(restored,[[9,12,14],[9,12,13],69,'2F'],'child navigation returns to the original interior floor and pose');
assert.equal(C.controls.enabled,false,'original interior walk controls are restored on exit');
console.log('integrated lifecycle: passed');
