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
for(const id of ['viewer','v-corner','v-front','v-int','vm-sketch','vm-precision','precision-light','precision-quality','precision-bake','precision-cafe-compare','precision-cafe','precision-cancel','precision-render','t-city','t-ctx','sec-time','cafe-photo-angle','cafe-reference-image'])ids.set(id,element(id));
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
const C={state:{scheme:'A'},R3D:{on:false,season:'spring'},sourceDaylight:()=>({time:'pm',season:'spring',direction:[1,1,0],intensity:2.6,color:0xffffff}),camera:{position:vector([1,2,3])},controls:{enabled:true,target:vector([4,5,6]),update(){}},interior:()=>false,interiorState:()=>({on:false,key:'1F',camera:C.camera.position.toArray(),target:C.controls.target.toArray()}),setRender(){throw Error('sketch entry should not rebuild')},cancel(){C.cancelled=true}};
let interval,now=100;const context={window:{TOWER_LAB_CONTEXT:C,TOWER_MODERN_ACTIVE:false},document,URL,URLSearchParams,Option:class{},location:{href:'https://example.test/3d-model.html?lab=review',search:'?lab=review'},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},setInterval(fn){interval=fn},requestAnimationFrame(fn){frames.push(fn)},addEventListener(){},console};
vm.runInNewContext(readFileSync(new URL('../../new/360/integrated.js',import.meta.url),'utf8'),context);
const review=context.window.TOWER_REVIEW;
assert.equal(C.controls.enabled,false,'precision owns host controls while active');
assert.equal(ids.get('sec-time').hidden,false,'the original time controls remain visible in precision mode');
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
let daylight={time:'pm',season:'spring',direction:[1,1,0],intensity:2.6,color:0xffffff},lightCalls=[],floorCalls=[];
C.sourceDaylight=()=>daylight;
review.enable();const daylightFrame=review.frame,childListeners=new Map();
daylightFrame.contentWindow={TOWER360:{telemetry:()=>({environment:'ready',camera:[10,20,30],target:[2,3,4]}),quality(){},view(){},light:value=>lightCalls.push(value),interiorPose:(...args)=>floorCalls.push(args)},TOWER_CINEMA:{status:()=>({mode:'interactive',firstFrameMs:1}),pause(){}},TOWER_LAB_CONTEXT:{cafeMode:false},addEventListener(type,fn){childListeners.set(type,fn)}};
interval();daylight={...daylight,direction:[-1,1,0],intensity:1.7};interval();
assert.equal(review.frame,daylightFrame,'daylight-only change keeps the building frame');
assert.equal(lightCalls.length,1,'daylight-only change updates light once');
assert.equal(lightCalls[0].intensity,1.7);
let selectedFloor='1F',sourcePose={camera:[0,1.6,2],target:[0,1.6,1.7],fov:72,spin:false,doll:false};C.interiorState=()=>({on:true,key:selectedFloor,...sourcePose});
interval();assert.equal(floorCalls.length,1);assert.equal(floorCalls[0][0],'1F');
selectedFloor='2F';interval();assert.equal(floorCalls.length,2);assert.equal(floorCalls[1][0],'2F');
assert.equal(review.frame,daylightFrame,'floor selection uses the existing renderer frame');
const click=selector=>listeners.get('click')({target:{closest:query=>query.includes(selector)?{}:null},preventDefault(){},stopImmediatePropagation(){}});
sourcePose={camera:[8,11,13],target:[8,11,12],fov:45,spin:false,doll:false};
click('[data-c]');frames.splice(0).forEach(fn=>fn());
assert.deepEqual(floorCalls.at(-1),['2F',sourcePose.camera,sourcePose.target,45],'authored interior corner pose and field of view reach the child');
sourcePose={...sourcePose,doll:true};click('#coreTop');interval();
const status=ids.get('viewer').children.find(child=>child.id==='precision-status');
assert.match(status.textContent,/단면 절단은 실사 3D 미연결/,'unsupported section clipping stays visible in the status');
now+=200;interval();assert.match(status.textContent,/코어 상부 시점/,'section warning survives status refresh');
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
