// Fixed cafe contact-AO bake. No view-dependent accumulation.
import fs from 'node:fs';import zlib from 'node:zlib';import {createHash} from 'node:crypto';import * as T from 'three';import {MeshBVH} from 'three-mesh-bvh';
const input=fs.readFileSync(process.argv[2]),source=JSON.parse(process.argv[2].endsWith('.gz')?zlib.gunzipSync(input):input),positions=source.positions;
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));const bvh=new MeshBVH(geometry,{indirect:true,targetLeafSize:8});
const size=512,samples=64,bounds=[-14,-14,2,10],ao=Buffer.alloc(size*size*3),ray=new T.Ray(),dirs=[];
for(let s=0;s<samples;s++){const r=Math.sqrt((s+.5)/samples),a=s*2.399963229728653;dirs.push(new T.Vector3(r*Math.cos(a),Math.sqrt(1-r*r),r*Math.sin(a)))}
const began=Date.now();
for(let y=0;y<size;y++)for(let x=0;x<size;x++){ray.origin.set(bounds[0]+(x+.5)/size*16,source.floor+.008,bounds[1]+(y+.5)/size*24);let block=0;for(const d of dirs){ray.direction.copy(d);const h=bvh.raycastFirst(ray,T.DoubleSide,.006,2.5);if(h)block+=Math.exp(-h.distance/1.2);}const vis=1-.93*block/samples,k=(y*size+x)*3;ao.fill(Math.round(vis*255),k,k+3);}
function crc(b){let c=0xffffffff;for(const a of b){c^=a;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1}return(c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,sum])}
function png(data){const h=Buffer.alloc(13);h.writeUInt32BE(size,0);h.writeUInt32BE(size,4);h[8]=8;h[9]=2;const scan=Buffer.alloc(size*(size*3+1));for(let y=0;y<size;y++)data.copy(scan,y*(size*3+1)+1,y*size*3,(y+1)*size*3);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))])}
const out='../../new/360/assets/';fs.writeFileSync(out+'cafe-contact-ao.png',png(ao));const meta={sourceSha256:createHash('sha256').update(input).digest('hex'),layout:source.layout,bounds,size,samples,rayDistance:2.5,triangles:positions.length/9,bakeMs:Date.now()-began,scope:'fixed cafe furniture contact AO only, not indirect-light or sun bake'};fs.writeFileSync(out+'cafe-bake.json',JSON.stringify(meta,null,2));console.log(meta);
