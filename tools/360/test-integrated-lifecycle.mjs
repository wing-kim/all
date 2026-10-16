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
for(const id of ['viewer','v-corner','v-front','v-int','vm-sketch','vm-precision','precision-light','precision-quality','precision-bake','precision-cafe-compare','precision-cafe','precision-cancel','precision-render','t-city','t-ctx','cafe-photo-angle','cafe-reference-image'])ids.set(id,element(id));
const views=element('views'),group=element('group');
for(const [id,view,pressed] of [['v-corner','corner','true'],['v-front','front','false'],['v-int','int','false']]){
  const button=ids.get(id);button.dataset={v:view};button.setAttribute('aria-pressed',pressed);views.appendChild(button);
}
const document={head:element(),activeElement:null,
  createElement:tag=>element(tag),getElementById:id=>ids.get(id)||element(id),
  querySelector:selector=>selector==='.views'?views:selector==='[aria-label="보기 방식"]'?group:selector==='.views [data-v][aria-pressed="true"]'?views.children.find(b=>b.dataset.v&&b.getAttribute('aria-pressed')==='true'):null,
  querySelectorAll:selector=>selector==='.views [data-v]'?views.children.filter(b=>b.dataset.v):[],
  addEventListener(){},
};
function vector(initial){let values=[...initial];return {toArray:()=>[...values],fromArray(v){values=[...v]},update(){}}}
const C={state:{scheme:'A'},R3D:{on:false,season:'spring'},camera:{position:vector([1,2,3])},controls:{enabled:true,target:vector([4,5,6]),update(){}},interior:()=>false,setRender(){throw Error('sketch entry should not rebuild')},cancel(){C.cancelled=true}};
const context={window:{TOWER_LAB_CONTEXT:C,TOWER_MODERN_ACTIVE:false},document,URL,URLSearchParams,Option:class{},location:{href:'https://example.test/3d-model.html?lab=review',search:'?lab=review'},performance:{now:()=>100},setTimeout:()=>1,clearTimeout(){},setInterval(){},requestAnimationFrame(){},addEventListener(){},console};
vm.runInNewContext(readFileSync(new URL('../../new/360/integrated.js',import.meta.url),'utf8'),context);
const review=context.window.TOWER_REVIEW;
assert.equal(C.controls.enabled,false,'precision owns host controls while active');
const frame=review.frame;
let pauses=[];
frame.contentWindow={TOWER360:{telemetry:()=>({camera:[10,20,30],target:[2,3,4]})},TOWER_LAB_CONTEXT:{cafeMode:false},TOWER_CINEMA:{pause:v=>pauses.push(v),stop(){}}};
review.disable();
assert.deepEqual(C.camera.position.toArray(),[10,20,30],'exterior camera returns to host');
assert.deepEqual(C.controls.target.toArray(),[2,3,4]);
assert.equal(C.controls.enabled,true);
assert.deepEqual(pauses,[true]);

C.controls.enabled=false;context.window.TOWER_MODERN_ACTIVE=true;
review.disable();
assert.equal(C.controls.enabled,false,'inactive adapter leaves original interior controls alone');
assert.equal(context.window.TOWER_MODERN_ACTIVE,true,'inactive adapter leaves render ownership alone');

C.controls.enabled=true;context.window.TOWER_MODERN_ACTIVE=false;
review.enable();
const cafeFrame=review.frame;
cafeFrame.contentWindow={TOWER360:{telemetry:()=>({camera:[99,99,99],target:[98,98,98]})},TOWER_LAB_CONTEXT:{cafeMode:true},TOWER_CINEMA:{pause(){}}};
ids.get('v-corner').setAttribute('aria-pressed','false');ids.get('v-int').setAttribute('aria-pressed','true');
review.disable();
assert.deepEqual(C.camera.position.toArray(),[10,20,30],'cafe camera does not strand original viewer inside building');
assert.equal(ids.get('v-corner').getAttribute('aria-pressed'),'true','original exterior selection is restored');
assert.equal(ids.get('v-int').getAttribute('aria-pressed'),'false');
console.log('integrated lifecycle: passed');
