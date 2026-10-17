import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../../new/3d-model.html',import.meta.url),'utf8');
const orientation=html.match(/const NORTH_DEG=.*?EV=\[.*?\];/)?.[0];
const daylight=html.slice(html.indexOf('const TIMES='),html.indexOf('function setText(id,h)'));
const applyStart=html.indexOf('function applyTime(){');
const originalSun=html.slice(html.indexOf('const T0=TIMES[R3D.time]',applyStart),html.indexOf('  {const H=',applyStart));
assert.ok(orientation&&daylight.includes('function sourceDaylight()'));
const R3D={time:'am',season:'spring',custom:false};
class Vector3{constructor(x,y,z){this.x=x;this.y=y;this.z=z}normalize(){const n=Math.hypot(this.x,this.y,this.z);this.x/=n;this.y/=n;this.z/=n;return this}toArray(){return [this.x,this.y,this.z]}}
const [source,original]=vm.runInNewContext(`${orientation}\n${daylight}\nfunction original(){${originalSun};return {direction:(T.el>0?dir:new THREE.Vector3(-.4,.6,.3).normalize()).toArray(),color:T.sun,intensity:T.si}}\n[sourceDaylight,original]`,{R3D,THREE:{Vector3},ymd:d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});
function matchesOriginal(){const read=source(),actual=original();for(let i=0;i<3;i++)assert.ok(Math.abs(read.direction[i]-actual.direction[i])<1e-10);assert.equal(read.color,actual.color);assert.equal(read.intensity,actual.intensity);return read}
const morning=source();
assert.equal(morning.time,'am');assert.equal(morning.night,false);assert.equal(morning.intensity,2.5);
assert.ok(Math.abs(Math.hypot(...morning.direction)-1)<1e-10);
matchesOriginal();
R3D.time='pm';R3D.season='winter';const winter=source();
assert.notDeepEqual(winter.direction,morning.direction,'season and time change the source sun vector');
matchesOriginal();
R3D.time='sunset';matchesOriginal();R3D.time='night';matchesOriginal();
R3D.custom=true;R3D.cdate=new Date(2026,9,16);R3D.cn=289;R3D.ch=10.5;const custom=source();
assert.equal(custom.date,'2026-10-16');assert.equal(custom.hour,10.5);assert.notDeepEqual(custom.direction,winter.direction);
matchesOriginal();
R3D.ch=20;const afterDark=source();
assert.equal(afterDark.night,true);assert.equal(afterDark.intensity,.15,'night retains the original low sun fill');
assert.equal(afterDark.color,0x8aa0c8);
matchesOriginal();
console.log('source daylight: seasonal, custom hour, vector, and night contract passed');
