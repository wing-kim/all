import{$ as mr,$a as Ue,Aa as L,Ba as Sc,C as Hr,Ca as Ic,D as ia,Da as Vi,E as X,Eb as O,F as uc,Fb as Nc,G as F,Gb as he,H as Fn,Ha as ue,Hb as Fc,I as na,Ia as Cc,J as fc,Ja as Un,Jb as Ee,Kb as Mc,L as ot,Lb as at,M as Mn,Mb as N,N as pc,Nb as gr,O as k,Ob as Wt,P as dc,Pb as Gt,Q as En,Qa as Dt,R as hc,S as Me,Sb as Wr,T as xe,Ta as sa,U as Xe,Ub as xr,V as st,Vb as $,W as oa,X as Ln,Y as kn,Z as On,Za as Pc,_ as mc,a as th,aa as gc,b as zr,ba as ye,d as dr,db as fe,e as Ur,ea as xc,eb as Ac,f as Nn,g as Vr,ga as yc,h as $t,ja as vc,jb as Bc,k as ic,ka as zn,kb as Rc,l as Ke,la as bc,m as hr,n as nc,o as nt,ob as $c,p as _e,pa as wc,q as oc,qa as _c,qb as Dc,r as sc,ra as Qe,s as ac,sa as Ui,t as ze,u as Be,v as Se,w as zi,wa as Ht,x as lc,xa as Q,y as cc,ya as Tc,yb as xt}from"./chunk-O3K6DBAA.js";var Gr=Math.pow(2,-24),qt=Symbol("SKIP_GENERATION"),Vn={strategy:0,maxDepth:40,targetLeafSize:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null,[qt]:!1};function ie(s,e,t){return t.min.x=e[s],t.min.y=e[s+1],t.min.z=e[s+2],t.max.x=e[s+3],t.max.y=e[s+4],t.max.z=e[s+5],t}function Hi(s){let e=-1,t=-1/0;for(let r=0;r<3;r++){let i=s[r+3]-s[r];i>t&&(t=i,e=r)}return e}function aa(s,e){e.set(s)}function la(s,e,t){let r,i;for(let o=0;o<3;o++){let n=o+3;r=s[o],i=e[o],t[o]=r<i?r:i,r=s[n],i=e[n],t[n]=r>i?r:i}}function Wi(s,e,t){for(let r=0;r<3;r++){let i=e[s+2*r],o=e[s+2*r+1],n=i-o,a=i+o;n<t[r]&&(t[r]=n),a>t[r+3]&&(t[r+3]=a)}}function qr(s){let e=s[3]-s[0],t=s[4]-s[1],r=s[5]-s[2];return 2*(e*t+t*r+r*e)}function V(s,e){return e[s+15]===65535}function te(s,e){return e[s+6]}function se(s,e){return e[s+14]}function G(s){return s+8}function q(s,e){let t=e[s+6];return s+t*8}function jr(s,e){return e[s+7]}function Hn(s,e,t,r,i){let o=1/0,n=1/0,a=1/0,l=-1/0,f=-1/0,c=-1/0,u=1/0,p=1/0,d=1/0,h=-1/0,g=-1/0,x=-1/0,b=s.offset||0;for(let m=(e-b)*6,v=(e+t-b)*6;m<v;m+=6){let y=s[m+0],w=s[m+1],S=y-w,T=y+w;S<o&&(o=S),T>l&&(l=T),y<u&&(u=y),y>h&&(h=y);let I=s[m+2],A=s[m+3],_=I-A,B=I+A;_<n&&(n=_),B>f&&(f=B),I<p&&(p=I),I>g&&(g=I);let P=s[m+4],R=s[m+5],D=P-R,M=P+R;D<a&&(a=D),M>c&&(c=M),P<d&&(d=P),P>x&&(x=P)}r[0]=o,r[1]=n,r[2]=a,r[3]=l,r[4]=f,r[5]=c,i[0]=u,i[1]=p,i[2]=d,i[3]=h,i[4]=g,i[5]=x}var Nt=32,ih=(s,e)=>s.candidate-e.candidate,jt=new Array(Nt).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Wn=new Float32Array(6);function kc(s,e,t,r,i,o){let n=-1,a=0;if(o===0)n=Hi(e),n!==-1&&(a=(e[n]+e[n+3])/2);else if(o===1)n=Hi(s),n!==-1&&(a=nh(t,r,i,n));else if(o===2){let l=qr(s),f=1.25*i,c=t.offset||0,u=(r-c)*6,p=(r+i-c)*6;for(let d=0;d<3;d++){let h=e[d],b=(e[d+3]-h)/Nt;if(i<Nt/4){let m=[...jt];m.length=i;let v=0;for(let w=u;w<p;w+=6,v++){let S=m[v];S.candidate=t[w+2*d],S.count=0;let{bounds:T,leftCacheBounds:I,rightCacheBounds:A}=S;for(let _=0;_<3;_++)A[_]=1/0,A[_+3]=-1/0,I[_]=1/0,I[_+3]=-1/0,T[_]=1/0,T[_+3]=-1/0;Wi(w,t,T)}m.sort(ih);let y=i;for(let w=0;w<y;w++){let S=m[w];for(;w+1<y&&m[w+1].candidate===S.candidate;)m.splice(w+1,1),y--}for(let w=u;w<p;w+=6){let S=t[w+2*d];for(let T=0;T<y;T++){let I=m[T];S>=I.candidate?Wi(w,t,I.rightCacheBounds):(Wi(w,t,I.leftCacheBounds),I.count++)}}for(let w=0;w<y;w++){let S=m[w],T=S.count,I=i-S.count,A=S.leftCacheBounds,_=S.rightCacheBounds,B=0;T!==0&&(B=qr(A)/l);let P=0;I!==0&&(P=qr(_)/l);let R=1+1.25*(B*T+P*I);R<f&&(n=d,f=R,a=S.candidate)}}else{for(let y=0;y<Nt;y++){let w=jt[y];w.count=0,w.candidate=h+b+y*b;let S=w.bounds;for(let T=0;T<3;T++)S[T]=1/0,S[T+3]=-1/0}for(let y=u;y<p;y+=6){let T=~~((t[y+2*d]-h)/b);T>=Nt&&(T=Nt-1);let I=jt[T];I.count++,Wi(y,t,I.bounds)}let m=jt[Nt-1];aa(m.bounds,m.rightCacheBounds);for(let y=Nt-2;y>=0;y--){let w=jt[y],S=jt[y+1];la(w.bounds,S.rightCacheBounds,w.rightCacheBounds)}let v=0;for(let y=0;y<Nt-1;y++){let w=jt[y],S=w.count,T=w.bounds,A=jt[y+1].rightCacheBounds;S!==0&&(v===0?aa(T,Wn):la(T,Wn,Wn)),v+=S;let _=0,B=0;v!==0&&(_=qr(Wn)/l);let P=i-v;P!==0&&(B=qr(A)/l);let R=1+1.25*(_*v+B*P);R<f&&(n=d,f=R,a=w.candidate)}}}}else console.warn(`BVH: Invalid build strategy value ${o} used.`);return{axis:n,pos:a}}function nh(s,e,t,r){let i=0,o=s.offset;for(let n=e,a=e+t;n<a;n++)i+=s[(n-o)*6+r*2];return i/t}var Yr=class{constructor(){this.boundingData=new Float32Array(6)}};function Oc(s,e,t,r,i,o){let n=r,a=r+i-1,l=o.pos,f=o.axis*2,c=t.offset||0;for(;;){for(;n<=a&&t[(n-c)*6+f]<l;)n++;for(;n<=a&&t[(a-c)*6+f]>=l;)a--;if(n<a){for(let u=0;u<e;u++){let p=s[n*e+u];s[n*e+u]=s[a*e+u],s[a*e+u]=p}for(let u=0;u<6;u++){let p=n-c,d=a-c,h=t[p*6+u];t[p*6+u]=t[d*6+u],t[d*6+u]=h}n++,a--}else return n}}var zc,Gn,ca,Uc,oh=Math.pow(2,32);function qn(s){return"count"in s?1:1+qn(s.left)+qn(s.right)}function Vc(s,e,t){return zc=new Float32Array(t),Gn=new Uint32Array(t),ca=new Uint16Array(t),Uc=new Uint8Array(t),ua(s,e)}function ua(s,e){let t=s/4,r=s/2,i="count"in e,o=e.boundingData;for(let n=0;n<6;n++)zc[t+n]=o[n];if(i)return e.buffer?(Uc.set(new Uint8Array(e.buffer),s),s+e.buffer.byteLength):(Gn[t+6]=e.offset,ca[r+14]=e.count,ca[r+15]=65535,s+32);{let{left:n,right:a,splitAxis:l}=e,f=s+32,c=ua(f,n),u=s/32,d=c/32-u;if(d>oh)throw new Error("MeshBVH: Cannot store relative child node offset greater than 32 bits.");return Gn[t+6]=d,Gn[t+7]=l,ua(c,a)}}function sh(s,e,t,r,i,o){let{maxDepth:n,verbose:a,targetLeafSize:l,_strictLeafSize:f=1/0,strategy:c,onProgress:u}=i,p=s.primitiveBuffer,d=s.primitiveBufferStride,h=new Float32Array(6),g=!1,x=new Yr;return Hn(e,t,r,x.boundingData,h),m(x,t,r,h),x;function b(v){u&&u((v-o.offset)/o.count)}function m(v,y,w,S=null,T=0){!g&&T>=n&&(g=!0,a&&console.warn(`BVH: Max depth of ${n} reached when generating BVH. Consider increasing maxDepth.`));let I=w>f;if(w<=l&&!I||T>=n)return b(y+w),v.offset=y,v.count=w,v;let A=kc(v.boundingData,S,e,y,w,c),_=A.axis===-1?-1:Oc(p,d,e,y,w,A);if(A.axis===-1||_===y||_===y+w){if(!I)return b(y+w),v.offset=y,v.count=w,v;A.axis=Math.max(0,Hi(v.boundingData)),_=y+Math.max(1,Math.floor(w/2))}v.splitAxis=A.axis;let B=new Yr,P=y,R=_-y;v.left=B,Hn(e,P,R,B.boundingData,h),m(B,P,R,h,T+1);let D=new Yr,M=_,W=w-R;return v.right=D,Hn(e,M,W,D.boundingData,h),m(D,M,W,h,T+1),v}}function Hc(s,e){let t=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,r=s.getRootRanges(e.range),i=r[0],o=r[r.length-1],n={offset:i.offset,count:o.offset+o.count-i.offset},a=new Float32Array(6*n.count);a.offset=n.offset,s.computePrimitiveBounds(n.offset,n.count,a),s._roots=r.map(l=>{let f=sh(s,a,l.offset,l.count,e,n),c=qn(f),u=new t(32*c);return Vc(0,f,u),u})}var Yt=class{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){let e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}};var fa=class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let e=[],t=null;this.setBuffer=r=>{t&&e.push(t),t=r,this.float32Array=new Float32Array(r),this.uint16Array=new Uint16Array(r),this.uint32Array=new Uint32Array(r)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}},j=new fa;var Kt,Xr,Kr=[],jn=new Yt(()=>new xe);function Wc(s,e,t,r,i,o){Kt=jn.getPrimitive(),Xr=jn.getPrimitive(),Kr.push(Kt,Xr),j.setBuffer(s._roots[e]);let n=pa(0,s.geometry,t,r,i,o);j.clearBuffer(),jn.releasePrimitive(Kt),jn.releasePrimitive(Xr),Kr.pop(),Kr.pop();let a=Kr.length;return a>0&&(Xr=Kr[a-1],Kt=Kr[a-2]),n}function pa(s,e,t,r,i=null,o=0,n=0){let{float32Array:a,uint16Array:l,uint32Array:f}=j,c=s*2;if(V(c,l)){let p=te(s,f),d=se(c,l);return ie(s,a,Kt),r(p,d,!1,n,o+s/8,Kt)}else{let _=function(P){let{uint16Array:R,uint32Array:D}=j,M=P*2;for(;!V(M,R);)P=G(P),M=P*2;return te(P,D)},B=function(P){let{uint16Array:R,uint32Array:D}=j,M=P*2;for(;!V(M,R);)P=q(P,D),M=P*2;return te(P,D)+se(M,R)},p=G(s),d=q(s,f),h=p,g=d,x,b,m,v;if(i&&(m=Kt,v=Xr,ie(h,a,m),ie(g,a,v),x=i(m),b=i(v),b<x)){h=d,g=p;let P=x;x=b,b=P,m=v}m||(m=Kt,ie(h,a,m));let y=V(h*2,l),w=t(m,y,x,n+1,o+h/8),S;if(w===2){let P=_(h),D=B(h)-P;S=r(P,D,!0,n+1,o+h/8,m)}else S=w&&pa(h,e,t,r,i,o,n+1);if(S)return!0;v=Xr,ie(g,a,v);let T=V(g*2,l),I=t(v,T,b,n+1,o+g/8),A;if(I===2){let P=_(g),D=B(g)-P;A=r(P,D,!0,n+1,o+g/8,v)}else A=I&&pa(g,e,t,r,i,o,n+1);return!!A}}var Gi=new j.constructor,Yn=new j.constructor,Xt=new Yt(()=>new xe),Qr=new xe,Zr=new xe,ha=new xe,ma=new xe,ga=!1;function Gc(s,e,t,r){if(ga)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");ga=!0;let i=s._roots,o=e._roots,n,a=0,l=0,f=new k().copy(t).invert();for(let c=0,u=i.length;c<u;c++){Gi.setBuffer(i[c]),l=0;let p=Xt.getPrimitive();ie(0,Gi.float32Array,p),p.applyMatrix4(f);for(let d=0,h=o.length;d<h&&(Yn.setBuffer(o[d]),n=lt(0,0,t,f,r,a,l,0,0,p),Yn.clearBuffer(),l+=o[d].byteLength/32,!n);d++);if(Xt.releasePrimitive(p),Gi.clearBuffer(),a+=i[c].byteLength/32,n)break}return ga=!1,n}function lt(s,e,t,r,i,o=0,n=0,a=0,l=0,f=null,c=!1){let u,p;c?(u=Yn,p=Gi):(u=Gi,p=Yn);let d=u.float32Array,h=u.uint32Array,g=u.uint16Array,x=p.float32Array,b=p.uint32Array,m=p.uint16Array,v=s*2,y=e*2,w=V(v,g),S=V(y,m),T=!1;if(S&&w)c?T=i(te(e,b),se(e*2,m),te(s,h),se(s*2,g),l,n+e/8,a,o+s/8):T=i(te(s,h),se(s*2,g),te(e,b),se(e*2,m),a,o+s/8,l,n+e/8);else if(S){let I=Xt.getPrimitive();ie(e,x,I),I.applyMatrix4(t);let A=G(s),_=q(s,h);ie(A,d,Qr),ie(_,d,Zr);let B=I.intersectsBox(Qr),P=I.intersectsBox(Zr);T=B&&lt(e,A,r,t,i,n,o,l,a+1,I,!c)||P&&lt(e,_,r,t,i,n,o,l,a+1,I,!c),Xt.releasePrimitive(I)}else{let I=G(e),A=q(e,b);ie(I,x,ha),ie(A,x,ma);let _=f.intersectsBox(ha),B=f.intersectsBox(ma);if(_&&B)T=lt(s,I,t,r,i,o,n,a,l+1,f,c)||lt(s,A,t,r,i,o,n,a,l+1,f,c);else if(_)if(w)T=lt(s,I,t,r,i,o,n,a,l+1,f,c);else{let P=Xt.getPrimitive();P.copy(ha).applyMatrix4(t);let R=G(s),D=q(s,h);ie(R,d,Qr),ie(D,d,Zr);let M=P.intersectsBox(Qr),W=P.intersectsBox(Zr);T=M&&lt(I,R,r,t,i,n,o,l,a+1,P,!c)||W&&lt(I,D,r,t,i,n,o,l,a+1,P,!c),Xt.releasePrimitive(P)}else if(B)if(w)T=lt(s,A,t,r,i,o,n,a,l+1,f,c);else{let P=Xt.getPrimitive();P.copy(ma).applyMatrix4(t);let R=G(s),D=q(s,h);ie(R,d,Qr),ie(D,d,Zr);let M=P.intersectsBox(Qr),W=P.intersectsBox(Zr);T=M&&lt(A,R,r,t,i,n,o,l,a+1,P,!c)||W&&lt(A,D,r,t,i,n,o,l,a+1,P,!c),Xt.releasePrimitive(P)}}return T}var yt=new class{constructor(){let s=null,e=null,t=null,r=!1;this.root=null,this.buffer=null,this.uint32Array=null,this.uint16Array=null,this.setBVH=(o,n)=>{if(r)throw new Error("BVHTraversalHelper: cannot call setBVH during an active traversal.");this.root=n,this.buffer=s=o._roots[n],this.uint16Array=t=new Uint16Array(s),this.uint32Array=e=new Uint32Array(s)},this.reset=()=>{this.root=null,this.buffer=s=null,this.uint16Array=t=null,this.uint32Array=e=null},this.getRangeStart=o=>{let n=o*2;for(;!V(n,t);)o=G(o),n=o*2;return te(o,e)},this.getRangeEnd=o=>{let n=o*2;for(;!V(n,t);)o=q(o,e),n=o*2;return te(o,e)+se(n,t)};let i=(o,n,a)=>{let l=n*2,f=V(l,t);if(!o(a,f,n)&&!f){let u=G(n),p=q(n,e);i(o,u,a+1),i(o,p,a+1)}};this.traverseBuffer=o=>{if(r)throw new Error("BVHTraversalHelper: cannot start a traversal during an active traversal.");r=!0;try{i(o,0,0)}finally{r=!1}},this.traverse=o=>{this.traverseBuffer((n,a,l)=>{if(a){let f=l*2,c=e[l+6],u=t[f+14];return o(n,a,new Float32Array(s,l*4,6),c,u)}else{let f=jr(l,e);return o(n,a,new Float32Array(s,l*4,6),f)}})}}};var qc=new xe,Jr=new Float32Array(6),ei=class{constructor(){this._roots=null,this.primitiveBuffer=null,this.primitiveBufferStride=null}init(e){e={...Vn,...e},"maxLeafSize"in e&&(console.warn('BVH: "maxLeafSize" option has been deprecated. Use "targetLeafSize", instead.'),e={...e,targetLeafSize:e.maxLeafSize}),Hc(this,e)}getRootRanges(){throw new Error("BVH: getRootRanges() not implemented")}writePrimitiveBounds(){throw new Error("BVH: writePrimitiveBounds() not implemented")}writePrimitiveRangeBounds(e,t,r,i){let o=1/0,n=1/0,a=1/0,l=-1/0,f=-1/0,c=-1/0;for(let u=e,p=e+t;u<p;u++){this.writePrimitiveBounds(u,Jr,0);let[d,h,g,x,b,m]=Jr;d<o&&(o=d),x>l&&(l=x),h<n&&(n=h),b>f&&(f=b),g<a&&(a=g),m>c&&(c=m)}return r[i+0]=o,r[i+1]=n,r[i+2]=a,r[i+3]=l,r[i+4]=f,r[i+5]=c,r}computePrimitiveBounds(e,t,r){let i=r.offset||0;for(let o=e,n=e+t;o<n;o++){this.writePrimitiveBounds(o,Jr,0);let[a,l,f,c,u,p]=Jr,d=(a+c)/2,h=(l+u)/2,g=(f+p)/2,x=(c-a)/2,b=(u-l)/2,m=(p-f)/2,v=(o-i)*6;r[v+0]=d,r[v+1]=x+(Math.abs(d)+x)*Gr,r[v+2]=h,r[v+3]=b+(Math.abs(h)+b)*Gr,r[v+4]=g,r[v+5]=m+(Math.abs(g)+m)*Gr}return r}shiftPrimitiveOffsets(e){let t=this._indirectBuffer;if(t)for(let r=0,i=t.length;r<i;r++)t[r]+=e;else{let r=this._roots;for(let i=0;i<r.length;i++){let o=r[i],n=new Uint32Array(o),a=new Uint16Array(o),l=o.byteLength/32;for(let f=0;f<l;f++){let c=8*f,u=2*c;V(u,a)&&(n[c+6]+=e)}}}}traverse(e,t=0){yt.setBVH(this,t),yt.traverse(e),yt.reset()}refit(){let e=this._roots;for(let t=0,r=e.length;t<r;t++){let i=e[t],o=new Uint32Array(i),n=new Uint16Array(i),a=new Float32Array(i),l=i.byteLength/32;for(let f=l-1;f>=0;f--){let c=f*8,u=c*2;if(V(u,n)){let d=te(c,o),h=se(u,n);this.writePrimitiveRangeBounds(d,h,Jr,0),a.set(Jr,c)}else{let d=G(c),h=q(c,o);for(let g=0;g<3;g++){let x=a[d+g],b=a[d+g+3],m=a[h+g],v=a[h+g+3];a[c+g]=x<m?x:m,a[c+g+3]=b>v?b:v}}}}}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(r=>{ie(0,new Float32Array(r),qc),e.union(qc)}),e}shapecast(e){let{boundsTraverseOrder:t,intersectsBounds:r,intersectsRange:i,intersectsPrimitive:o,scratchPrimitive:n,iterate:a}=e;if(i&&o){let u=i;i=(p,d,h,g,x)=>u(p,d,h,g,x)?!0:a(p,d,this,o,h,g,n)}else i||(o?i=(u,p,d,h)=>a(u,p,this,o,d,h,n):i=(u,p,d)=>d);let l=!1,f=0,c=this._roots;for(let u=0,p=c.length;u<p;u++){let d=c[u];if(l=Wc(this,u,r,i,t,f),l)break;f+=d.byteLength/32}return l}bvhcast(e,t,r){let{intersectsRanges:i}=r;return Gc(this,e,t,i)}};function jc(){return typeof SharedArrayBuffer<"u"}function xa(s){return s.index?s.index.count:s.attributes.position.count}function Qt(s){return xa(s)/3}function lh(s,e=ArrayBuffer){return s>65535?new Uint32Array(new e(4*s)):new Uint16Array(new e(2*s))}function Yc(s,e){if(!s.index){let t=s.attributes.position.count,r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,i=lh(t,r);s.setIndex(new st(i,1));for(let o=0;o<t;o++)i[o]=o}}function ch(s,e,t){let r=xa(s)/t,i=e||s.drawRange,o=i.start/t,n=(i.start+i.count)/t,a=Math.max(0,o),l=Math.min(r,n)-a;return{offset:Math.floor(a),count:Math.floor(l)}}function uh(s,e){return s.groups.map(t=>({offset:t.start/e,count:t.count/e}))}function ya(s,e,t){let r=ch(s,e,t),i=uh(s,t);if(!i.length)return[r];let o=[],n=r.offset,a=r.offset+r.count,l=xa(s)/t,f=[];for(let p of i){let{offset:d,count:h}=p,g=d,x=isFinite(h)?h:l-d,b=d+x;g<a&&b>n&&(f.push({pos:Math.max(n,g),isStart:!0}),f.push({pos:Math.min(a,b),isStart:!1}))}f.sort((p,d)=>p.pos!==d.pos?p.pos-d.pos:p.type==="end"?-1:1);let c=0,u=null;for(let p of f){let d=p.pos;c!==0&&d!==u&&o.push({offset:u,count:d-u}),c+=p.isStart?1:-1,u=d}return o}function fh(s,e){let t=s[s.length-1],r=t.offset+t.count>2**16,i=s.reduce((f,c)=>f+c.count,0),o=r?4:2,n=e?new SharedArrayBuffer(i*o):new ArrayBuffer(i*o),a=r?new Uint32Array(n):new Uint16Array(n),l=0;for(let f=0;f<s.length;f++){let{offset:c,count:u}=s[f];for(let p=0;p<u;p++)a[l+p]=c+p;l+=u}return a}var Ft=class extends ei{get indirect(){return!!this._indirectBuffer}get primitiveStride(){return null}get primitiveBufferStride(){return this.indirect?1:this.primitiveStride}set primitiveBufferStride(e){}get primitiveBuffer(){return this.indirect?this._indirectBuffer:this.geometry.index.array}set primitiveBuffer(e){}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("BVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("BVH: Only BufferGeometries are supported.");if(t.useSharedArrayBuffer&&!jc())throw new Error("BVH: SharedArrayBuffer is not available.");super(),this.geometry=e,this.resolvePrimitiveIndex=t.indirect?r=>this._indirectBuffer[r]:r=>r,this.primitiveBuffer=null,this.primitiveBufferStride=null,this._indirectBuffer=null,t={...Vn,...t},t[qt]||this.init(t)}init(e){let{geometry:t,primitiveStride:r}=this;if(e.indirect){let i=ya(t,e.range,r),o=fh(i,e.useSharedArrayBuffer);this._indirectBuffer=o}else Yc(t,e);super.init(e),!t.boundingBox&&e.setBoundingBox&&(t.boundingBox=this.getBoundingBox(new xe))}getRootRanges(e){return this.indirect?[{offset:0,count:this._indirectBuffer.length}]:ya(this.geometry,e,this.primitiveStride)}raycastObject3D(){throw new Error("BVH: raycastObject3D() not implemented")}};var Ve=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let r=1/0,i=-1/0;for(let o=0,n=e.length;o<n;o++){let l=e[o][t];r=l<r?l:r,i=l>i?l:i}this.min=r,this.max=i}setFromPoints(e,t){let r=1/0,i=-1/0;for(let o=0,n=t.length;o<n;o++){let a=t[o],l=e.dot(a);r=l<r?l:r,i=l>i?l:i}this.min=r,this.max=i}isSeparated(e){return this.min>e.max||e.min>this.max}};Ve.prototype.setFromBox=(function(){let s=new F;return function(t,r){let i=r.min,o=r.max,n=1/0,a=-1/0;for(let l=0;l<=1;l++)for(let f=0;f<=1;f++)for(let c=0;c<=1;c++){s.x=i.x*l+o.x*(1-l),s.y=i.y*f+o.y*(1-f),s.z=i.z*c+o.z*(1-c);let u=t.dot(s);n=Math.min(u,n),a=Math.max(u,a)}this.min=n,this.max=a}})();var ph=(function(){let s=new F,e=new F,t=new F;return function(i,o,n){let a=i.start,l=s,f=o.start,c=e;t.subVectors(a,f),s.subVectors(i.end,i.start),e.subVectors(o.end,o.start);let u=t.dot(c),p=c.dot(l),d=c.dot(c),h=t.dot(l),x=l.dot(l)*d-p*p,b,m;x!==0?b=(u*p-h*d)/x:b=0,m=(u+b*p)/d,n.x=b,n.y=m}})(),qi=(function(){let s=new X,e=new F,t=new F;return function(i,o,n,a){ph(i,o,s);let l=s.x,f=s.y;if(l>=0&&l<=1&&f>=0&&f<=1){i.at(l,n),o.at(f,a);return}else if(l>=0&&l<=1){f<0?o.at(0,a):o.at(1,a),i.closestPointToPoint(a,!0,n);return}else if(f>=0&&f<=1){l<0?i.at(0,n):i.at(1,n),o.closestPointToPoint(n,!0,a);return}else{let c;l<0?c=i.start:c=i.end;let u;f<0?u=o.start:u=o.end;let p=e,d=t;if(i.closestPointToPoint(u,!0,e),o.closestPointToPoint(c,!0,t),p.distanceToSquared(u)<=d.distanceToSquared(c)){n.copy(p),a.copy(u);return}else{n.copy(c),a.copy(d);return}}}})(),Kc=(function(){let s=new F,e=new F,t=new kn,r=new Qe;return function(o,n){let{radius:a,center:l}=o,{a:f,b:c,c:u}=n;if(r.start=f,r.end=c,r.closestPointToPoint(l,!0,s).distanceTo(l)<=a||(r.start=f,r.end=u,r.closestPointToPoint(l,!0,s).distanceTo(l)<=a)||(r.start=c,r.end=u,r.closestPointToPoint(l,!0,s).distanceTo(l)<=a))return!0;let g=n.getPlane(t);if(Math.abs(g.distanceToPoint(l))<=a){let b=g.projectPoint(l,e);if(n.containsPoint(b))return!0}return!1}})();var dh=["x","y","z"],Mt=1e-15,Xc=Mt*Mt;function Ze(s){return Math.abs(s)<Mt}var ve=class extends Me{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new F),this.satBounds=new Array(4).fill().map(()=>new Ve),this.points=[this.a,this.b,this.c],this.plane=new kn,this.isDegenerateIntoSegment=!1,this.isDegenerateIntoPoint=!1,this.degenerateSegment=new Qe,this.needsUpdate=!0}intersectsSphere(e){return Kc(e,this)}update(){let e=this.a,t=this.b,r=this.c,i=this.points,o=this.satAxes,n=this.satBounds,a=o[0],l=n[0];this.getNormal(a),l.setFromPoints(a,i);let f=o[1],c=n[1];f.subVectors(e,t),c.setFromPoints(f,i);let u=o[2],p=n[2];u.subVectors(t,r),p.setFromPoints(u,i);let d=o[3],h=n[3];d.subVectors(r,e),h.setFromPoints(d,i);let g=f.length(),x=u.length(),b=d.length();this.isDegenerateIntoPoint=!1,this.isDegenerateIntoSegment=!1,g<Mt?x<Mt||b<Mt?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(e),this.degenerateSegment.end.copy(r)):x<Mt?b<Mt?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(t),this.degenerateSegment.end.copy(e)):b<Mt&&(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(r),this.degenerateSegment.end.copy(t)),this.plane.setFromNormalAndCoplanarPoint(a,e),this.needsUpdate=!1}};ve.prototype.closestPointToSegment=(function(){let s=new F,e=new F,t=new Qe;return function(i,o=null,n=null){let{start:a,end:l}=i,f=this.points,c,u=1/0;for(let p=0;p<3;p++){let d=(p+1)%3;t.start.copy(f[p]),t.end.copy(f[d]),qi(t,i,s,e),c=s.distanceToSquared(e),c<u&&(u=c,o&&o.copy(s),n&&n.copy(e))}return this.closestPointToPoint(a,s),c=a.distanceToSquared(s),c<u&&(u=c,o&&o.copy(s),n&&n.copy(a)),this.closestPointToPoint(l,s),c=l.distanceToSquared(s),c<u&&(u=c,o&&o.copy(s),n&&n.copy(l)),Math.sqrt(u)}})();ve.prototype.intersectsTriangle=(function(){let s=new ve,e=new Ve,t=new Ve,r=new F,i=new F,o=new F,n=new F,a=new Qe,l=new Qe,f=new F,c=new X,u=new X;function p(v,y,w,S){let T=r;!v.isDegenerateIntoPoint&&!v.isDegenerateIntoSegment?T.copy(v.plane.normal):T.copy(y.plane.normal);let I=v.satBounds,A=v.satAxes;for(let P=1;P<4;P++){let R=I[P],D=A[P];if(e.setFromPoints(D,y.points),R.isSeparated(e)||(n.copy(T).cross(D),e.setFromPoints(n,v.points),t.setFromPoints(n,y.points),e.isSeparated(t)))return!1}let _=y.satBounds,B=y.satAxes;for(let P=1;P<4;P++){let R=_[P],D=B[P];if(e.setFromPoints(D,v.points),R.isSeparated(e)||(n.crossVectors(T,D),e.setFromPoints(n,v.points),t.setFromPoints(n,y.points),e.isSeparated(t)))return!1}return w&&(S||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),w.start.set(0,0,0),w.end.set(0,0,0)),!0}function d(v,y,w,S,T,I,A,_,B,P,R){let D=A/(A-_);P.x=S+(T-S)*D,R.start.subVectors(y,v).multiplyScalar(D).add(v),D=A/(A-B),P.y=S+(I-S)*D,R.end.subVectors(w,v).multiplyScalar(D).add(v)}function h(v,y,w,S,T,I,A,_,B,P,R){if(T>0)d(v.c,v.a,v.b,S,y,w,B,A,_,P,R);else if(I>0)d(v.b,v.a,v.c,w,y,S,_,A,B,P,R);else if(_*B>0||A!=0)d(v.a,v.b,v.c,y,w,S,A,_,B,P,R);else if(_!=0)d(v.b,v.a,v.c,w,y,S,_,A,B,P,R);else if(B!=0)d(v.c,v.a,v.b,S,y,w,B,A,_,P,R);else return!0;return!1}function g(v,y,w,S){let T=y.degenerateSegment,I=v.plane.distanceToPoint(T.start),A=v.plane.distanceToPoint(T.end);return Ze(I)?Ze(A)?p(v,y,w,S):(w&&(w.start.copy(T.start),w.end.copy(T.start)),v.containsPoint(T.start)):Ze(A)?(w&&(w.start.copy(T.end),w.end.copy(T.end)),v.containsPoint(T.end)):v.plane.intersectLine(T,r)!=null?(w&&(w.start.copy(r),w.end.copy(r)),v.containsPoint(r)):!1}function x(v,y,w){let S=y.a;return Ze(v.plane.distanceToPoint(S))&&v.containsPoint(S)?(w&&(w.start.copy(S),w.end.copy(S)),!0):!1}function b(v,y,w){let S=v.degenerateSegment,T=y.a;return S.closestPointToPoint(T,!0,r),T.distanceToSquared(r)<Xc?(w&&(w.start.copy(T),w.end.copy(T)),!0):!1}function m(v,y,w,S){if(v.isDegenerateIntoSegment)if(y.isDegenerateIntoSegment){let T=v.degenerateSegment,I=y.degenerateSegment,A=i,_=o;T.delta(A),I.delta(_);let B=r.subVectors(I.start,T.start),P=A.x*_.y-A.y*_.x;if(Ze(P))return!1;let R=(B.x*_.y-B.y*_.x)/P,D=-(A.x*B.y-A.y*B.x)/P;if(R<0||R>1||D<0||D>1)return!1;let M=T.start.z+A.z*R,W=I.start.z+_.z*D;return Ze(M-W)?(w&&(w.start.copy(T.start).addScaledVector(A,R),w.end.copy(T.start).addScaledVector(A,R)),!0):!1}else return y.isDegenerateIntoPoint?b(v,y,w):g(y,v,w,S);else{if(v.isDegenerateIntoPoint)return y.isDegenerateIntoPoint?y.a.distanceToSquared(v.a)<Xc?(w&&(w.start.copy(v.a),w.end.copy(v.a)),!0):!1:y.isDegenerateIntoSegment?b(y,v,w):x(y,v,w);if(y.isDegenerateIntoPoint)return x(v,y,w);if(y.isDegenerateIntoSegment)return g(v,y,w,S)}}return function(y,w=null,S=!1){this.needsUpdate&&this.update(),y.isExtendedTriangle?y.needsUpdate&&y.update():(s.copy(y),s.update(),y=s);let T=m(this,y,w,S);if(T!==void 0)return T;let I=this.plane,A=y.plane,_=A.distanceToPoint(this.a),B=A.distanceToPoint(this.b),P=A.distanceToPoint(this.c);Ze(_)&&(_=0),Ze(B)&&(B=0),Ze(P)&&(P=0);let R=_*B,D=_*P;if(R>0&&D>0)return!1;let M=I.distanceToPoint(y.a),W=I.distanceToPoint(y.b),E=I.distanceToPoint(y.c);Ze(M)&&(M=0),Ze(W)&&(W=0),Ze(E)&&(E=0);let Ye=M*W,Oe=M*E;if(Ye>0&&Oe>0)return!1;i.copy(I.normal),o.copy(A.normal);let gt=i.cross(o),Rt=0,ki=Math.abs(gt.x),Oi=Math.abs(gt.y);Oi>ki&&(ki=Oi,Rt=1),Math.abs(gt.z)>ki&&(Rt=2);let Fe=dh[Rt],fr=this.a[Fe],kr=this.b[Fe],Dn=this.c[Fe],pr=y.a[Fe],Or=y.b[Fe],eh=y.c[Fe];if(h(this,fr,kr,Dn,R,D,_,B,P,c,a))return p(this,y,w,S);if(h(y,pr,Or,eh,Ye,Oe,M,W,E,u,l))return p(this,y,w,S);if(c.y<c.x){let ra=c.y;c.y=c.x,c.x=ra,f.copy(a.start),a.start.copy(a.end),a.end.copy(f)}if(u.y<u.x){let ra=u.y;u.y=u.x,u.x=ra,f.copy(l.start),l.start.copy(l.end),l.end.copy(f)}return c.y<u.x||u.y<c.x?!1:(w&&(u.x>c.x?w.start.copy(l.start):w.start.copy(a.start),u.y<c.y?w.end.copy(l.end):w.end.copy(a.end)),!0)}})();ve.prototype.distanceToPoint=(function(){let s=new F;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}})();ve.prototype.distanceToTriangle=(function(){let s=new F,e=new F,t=["a","b","c"],r=new Qe,i=new Qe;return function(n,a=null,l=null){let f=a||l?r:null;if(this.intersectsTriangle(n,f,!0))return(a||l)&&(a&&f.getCenter(a),l&&f.getCenter(l)),0;let c=1/0;for(let u=0;u<3;u++){let p,d=t[u],h=n[d];this.closestPointToPoint(h,s),p=h.distanceToSquared(s),p<c&&(c=p,a&&a.copy(s),l&&l.copy(h));let g=this[d];n.closestPointToPoint(g,s),p=g.distanceToSquared(s),p<c&&(c=p,a&&a.copy(g),l&&l.copy(s))}for(let u=0;u<3;u++){let p=t[u],d=t[(u+1)%3];r.set(this[p],this[d]);for(let h=0;h<3;h++){let g=t[h],x=t[(h+1)%3];i.set(n[g],n[x]),qi(r,i,s,e);let b=s.distanceToSquared(e);b<c&&(c=b,a&&a.copy(s),l&&l.copy(e))}}return Math.sqrt(c)}})();var de=class{constructor(e,t,r){this.isOrientedBox=!0,this.min=new F,this.max=new F,this.matrix=new k,this.invMatrix=new k,this.points=new Array(8).fill().map(()=>new F),this.satAxes=new Array(3).fill().map(()=>new F),this.satBounds=new Array(3).fill().map(()=>new Ve),this.alignedSatBounds=new Array(3).fill().map(()=>new Ve),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),r&&this.matrix.copy(r)}set(e,t,r){this.min.copy(e),this.max.copy(t),this.matrix.copy(r),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}};de.prototype.update=(function(){return function(){let e=this.matrix,t=this.min,r=this.max,i=this.points;for(let f=0;f<=1;f++)for(let c=0;c<=1;c++)for(let u=0;u<=1;u++){let p=1*f|2*c|4*u,d=i[p];d.x=f?r.x:t.x,d.y=c?r.y:t.y,d.z=u?r.z:t.z,d.applyMatrix4(e)}let o=this.satBounds,n=this.satAxes,a=i[0];for(let f=0;f<3;f++){let c=n[f],u=o[f],p=1<<f,d=i[p];c.subVectors(a,d),u.setFromPoints(c,i)}let l=this.alignedSatBounds;l[0].setFromPointsField(i,"x"),l[1].setFromPointsField(i,"y"),l[2].setFromPointsField(i,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})();de.prototype.intersectsBox=(function(){let s=new Ve;return function(t){this.needsUpdate&&this.update();let r=t.min,i=t.max,o=this.satBounds,n=this.satAxes,a=this.alignedSatBounds;if(s.min=r.x,s.max=i.x,a[0].isSeparated(s)||(s.min=r.y,s.max=i.y,a[1].isSeparated(s))||(s.min=r.z,s.max=i.z,a[2].isSeparated(s)))return!1;for(let l=0;l<3;l++){let f=n[l],c=o[l];if(s.setFromBox(f,t),c.isSeparated(s))return!1}return!0}})();de.prototype.intersectsTriangle=(function(){let s=new ve,e=new Array(3),t=new Ve,r=new Ve,i=new F;return function(n){this.needsUpdate&&this.update(),n.isExtendedTriangle?n.needsUpdate&&n.update():(s.copy(n),s.update(),n=s);let a=this.satBounds,l=this.satAxes;e[0]=n.a,e[1]=n.b,e[2]=n.c;for(let p=0;p<3;p++){let d=a[p],h=l[p];if(t.setFromPoints(h,e),d.isSeparated(t))return!1}let f=n.satBounds,c=n.satAxes,u=this.points;for(let p=0;p<3;p++){let d=f[p],h=c[p];if(t.setFromPoints(h,u),d.isSeparated(t))return!1}for(let p=0;p<3;p++){let d=l[p];for(let h=0;h<4;h++){let g=c[h];if(i.crossVectors(d,g),t.setFromPoints(i,e),r.setFromPoints(i,u),t.isSeparated(r))return!1}}return!0}})();de.prototype.closestPointToPoint=(function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}})();de.prototype.distanceToPoint=(function(){let s=new F;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}})();de.prototype.distanceToBox=(function(){let s=["x","y","z"],e=new Array(12).fill().map(()=>new Qe),t=new Array(12).fill().map(()=>new Qe),r=new F,i=new F;return function(n,a=0,l=null,f=null){if(this.needsUpdate&&this.update(),this.intersectsBox(n))return(l||f)&&(n.getCenter(i),this.closestPointToPoint(i,r),n.closestPointToPoint(r,i),l&&l.copy(r),f&&f.copy(i)),0;let c=a*a,u=n.min,p=n.max,d=this.points,h=1/0;for(let x=0;x<8;x++){let b=d[x];i.copy(b).clamp(u,p);let m=b.distanceToSquared(i);if(m<h&&(h=m,l&&l.copy(b),f&&f.copy(i),m<c))return Math.sqrt(m)}let g=0;for(let x=0;x<3;x++)for(let b=0;b<=1;b++)for(let m=0;m<=1;m++){let v=(x+1)%3,y=(x+2)%3,w=b<<v|m<<y,S=1<<x|b<<v|m<<y,T=d[w],I=d[S];e[g].set(T,I);let _=s[x],B=s[v],P=s[y],R=t[g],D=R.start,M=R.end;D[_]=u[_],D[B]=b?u[B]:p[B],D[P]=m?u[P]:p[B],M[_]=p[_],M[B]=b?u[B]:p[B],M[P]=m?u[P]:p[B],g++}for(let x=0;x<=1;x++)for(let b=0;b<=1;b++)for(let m=0;m<=1;m++){i.x=x?p.x:u.x,i.y=b?p.y:u.y,i.z=m?p.z:u.z,this.closestPointToPoint(i,r);let v=i.distanceToSquared(r);if(v<h&&(h=v,l&&l.copy(r),f&&f.copy(i),v<c))return Math.sqrt(v)}for(let x=0;x<12;x++){let b=e[x];for(let m=0;m<12;m++){let v=t[m];qi(b,v,r,i);let y=r.distanceToSquared(i);if(y<h&&(h=y,l&&l.copy(r),f&&f.copy(i),y<c))return Math.sqrt(y)}}return Math.sqrt(h)}})();var va=class extends Yt{constructor(){super(()=>new ve)}},Re=new va;var ji=new F,ba=new F;function Qc(s,e,t={},r=0,i=1/0){let o=r*r,n=i*i,a=1/0,l=null;if(s.shapecast({boundsTraverseOrder:c=>(ji.copy(e).clamp(c.min,c.max),ji.distanceToSquared(e)),intersectsBounds:(c,u,p)=>p<a&&p<n,intersectsTriangle:(c,u)=>{c.closestPointToPoint(e,ji);let p=e.distanceToSquared(ji);return p<a&&(ba.copy(ji),a=p,l=u),p<o}}),a===1/0)return null;let f=Math.sqrt(a);return t.point?t.point.copy(ba):t.point=ba.clone(),t.distance=f,t.faceIndex=l,t}var Kn=parseInt("186")>=169,hh=parseInt("186")<=161,vr=new F,br=new F,wr=new F,Xn=new X,Qn=new X,Zn=new X,Zc=new F,Jc=new F,eu=new F,Yi=new F;function mh(s,e,t,r,i,o,n,a){let l;if(o===Ur?l=s.intersectTriangle(r,t,e,!0,i):l=s.intersectTriangle(e,t,r,o!==Nn,i),l===null)return null;let f=s.origin.distanceTo(i);return f<n||f>a?null:{distance:f,point:i.clone()}}function tu(s,e,t,r,i,o,n,a,l,f,c){vr.fromBufferAttribute(e,o),br.fromBufferAttribute(e,n),wr.fromBufferAttribute(e,a);let u=mh(s,vr,br,wr,Yi,l,f,c);if(u){if(r){Xn.fromBufferAttribute(r,o),Qn.fromBufferAttribute(r,n),Zn.fromBufferAttribute(r,a),u.uv=new X;let d=Me.getInterpolation(Yi,vr,br,wr,Xn,Qn,Zn,u.uv);Kn||(u.uv=d)}if(i){Xn.fromBufferAttribute(i,o),Qn.fromBufferAttribute(i,n),Zn.fromBufferAttribute(i,a),u.uv1=new X;let d=Me.getInterpolation(Yi,vr,br,wr,Xn,Qn,Zn,u.uv1);Kn||(u.uv1=d),hh&&(u.uv2=u.uv1)}if(t){Zc.fromBufferAttribute(t,o),Jc.fromBufferAttribute(t,n),eu.fromBufferAttribute(t,a),u.normal=new F;let d=Me.getInterpolation(Yi,vr,br,wr,Zc,Jc,eu,u.normal);u.normal.dot(s.direction)>0&&u.normal.multiplyScalar(-1),Kn||(u.normal=d)}let p={a:o,b:n,c:a,normal:new F,materialIndex:0};if(Me.getNormal(vr,br,wr,p.normal),u.face=p,u.faceIndex=o,Kn){let d=new F;Me.getBarycoord(Yi,vr,br,wr,d),u.barycoord=d}}return u}function ru(s){return s&&s.isMaterial?s.side:s}function ti(s,e,t,r,i,o,n){let a=r*3,l=a+0,f=a+1,c=a+2,{index:u,groups:p}=s;s.index&&(l=u.getX(l),f=u.getX(f),c=u.getX(c));let{position:d,normal:h,uv:g,uv1:x}=s.attributes;if(Array.isArray(e)){let b=r*3;for(let m=0,v=p.length;m<v;m++){let{start:y,count:w,materialIndex:S}=p[m];if(b>=y&&b<y+w){let T=ru(e[S]),I=tu(t,d,h,g,x,l,f,c,T,o,n);if(I)if(I.faceIndex=r,I.face.materialIndex=S,i)i.push(I);else return I}}}else{let b=ru(e),m=tu(t,d,h,g,x,l,f,c,b,o,n);if(m)if(m.faceIndex=r,m.face.materialIndex=0,i)i.push(m);else return m}return null}function ae(s,e,t,r){let i=s.a,o=s.b,n=s.c,a=e,l=e+1,f=e+2;t&&(a=t.getX(a),l=t.getX(l),f=t.getX(f)),i.x=r.getX(a),i.y=r.getY(a),i.z=r.getZ(a),o.x=r.getX(l),o.y=r.getY(l),o.z=r.getZ(l),n.x=r.getX(f),n.y=r.getY(f),n.z=r.getZ(f)}function iu(s,e,t,r,i,o,n,a){let{geometry:l,_indirectBuffer:f}=s;for(let c=r,u=r+i;c<u;c++)ti(l,e,t,c,o,n,a)}function nu(s,e,t,r,i,o,n){let{geometry:a,_indirectBuffer:l}=s,f=1/0,c=null;for(let u=r,p=r+i;u<p;u++){let d;d=ti(a,e,t,u,null,o,n),d&&d.distance<f&&(c=d,f=d.distance)}return c}function ou(s,e,t,r,i,o,n){let{geometry:a}=t,{index:l}=a,f=a.attributes.position;for(let c=s,u=e+s;c<u;c++){let p;if(p=c,ae(n,p*3,l,f),n.needsUpdate=!0,r(n,p,i,o))return!0}return!1}function su(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=s.geometry,r=t.index?t.index.array:null,i=t.attributes.position,o,n,a,l,f=0,c=s._roots;for(let p=0,d=c.length;p<d;p++)o=c[p],n=new Uint32Array(o),a=new Uint16Array(o),l=new Float32Array(o),u(0,f),f+=o.byteLength;function u(p,d,h=!1){let g=p*2;if(V(g,a)){let x=te(p,n),b=se(g,a),m=1/0,v=1/0,y=1/0,w=-1/0,S=-1/0,T=-1/0;for(let I=3*x,A=3*(x+b);I<A;I++){let _=r[I],B=i.getX(_),P=i.getY(_),R=i.getZ(_);B<m&&(m=B),B>w&&(w=B),P<v&&(v=P),P>S&&(S=P),R<y&&(y=R),R>T&&(T=R)}return l[p+0]!==m||l[p+1]!==v||l[p+2]!==y||l[p+3]!==w||l[p+4]!==S||l[p+5]!==T?(l[p+0]=m,l[p+1]=v,l[p+2]=y,l[p+3]=w,l[p+4]=S,l[p+5]=T,!0):!1}else{let x=G(p),b=q(p,n),m=h,v=!1,y=!1;if(e){if(!m){let _=x/8+d/32,B=b/8+d/32;v=e.has(_),y=e.has(B),m=!v&&!y}}else v=!0,y=!0;let w=m||v,S=m||y,T=!1;w&&(T=u(x,d,m));let I=!1;S&&(I=u(b,d,m));let A=T||I;if(A)for(let _=0;_<3;_++){let B=x+_,P=b+_,R=l[B],D=l[B+3],M=l[P],W=l[P+3];l[p+_]=R<M?R:M,l[p+_+3]=D>W?D:W}return A}}}function Je(s,e,t,r,i){let o,n,a,l,f,c,u=1/t.direction.x,p=1/t.direction.y,d=1/t.direction.z,h=t.origin.x,g=t.origin.y,x=t.origin.z,b=e[s],m=e[s+3],v=e[s+1],y=e[s+3+1],w=e[s+2],S=e[s+3+2];return u>=0?(o=(b-h)*u,n=(m-h)*u):(o=(m-h)*u,n=(b-h)*u),p>=0?(a=(v-g)*p,l=(y-g)*p):(a=(y-g)*p,l=(v-g)*p),o>l||a>n||((a>o||isNaN(o))&&(o=a),(l<n||isNaN(n))&&(n=l),d>=0?(f=(w-x)*d,c=(S-x)*d):(f=(S-x)*d,c=(w-x)*d),o>c||f>n)?!1:((f>o||o!==o)&&(o=f),(c<n||n!==n)&&(n=c),o<=i&&n>=r)}function au(s,e,t,r,i,o,n,a){let{geometry:l,_indirectBuffer:f}=s;for(let c=r,u=r+i;c<u;c++){let p=f?f[c]:c;ti(l,e,t,p,o,n,a)}}function lu(s,e,t,r,i,o,n){let{geometry:a,_indirectBuffer:l}=s,f=1/0,c=null;for(let u=r,p=r+i;u<p;u++){let d;d=ti(a,e,t,l?l[u]:u,null,o,n),d&&d.distance<f&&(c=d,f=d.distance)}return c}function cu(s,e,t,r,i,o,n){let{geometry:a}=t,{index:l}=a,f=a.attributes.position;for(let c=s,u=e+s;c<u;c++){let p;if(p=t.resolveTriangleIndex(c),ae(n,p*3,l,f),n.needsUpdate=!0,r(n,p,i,o))return!0}return!1}function uu(s,e,t,r,i,o,n){j.setBuffer(s._roots[e]),wa(0,s,t,r,i,o,n),j.clearBuffer()}function wa(s,e,t,r,i,o,n){let{float32Array:a,uint16Array:l,uint32Array:f}=j,c=s*2;if(V(c,l)){let p=te(s,f),d=se(c,l);iu(e,t,r,p,d,i,o,n)}else{let p=G(s);Je(p,a,r,o,n)&&wa(p,e,t,r,i,o,n);let d=q(s,f);Je(d,a,r,o,n)&&wa(d,e,t,r,i,o,n)}}var gh=["x","y","z"];function fu(s,e,t,r,i,o){j.setBuffer(s._roots[e]);let n=_a(0,s,t,r,i,o);return j.clearBuffer(),n}function _a(s,e,t,r,i,o){let{float32Array:n,uint16Array:a,uint32Array:l}=j,f=s*2;if(V(f,a)){let u=te(s,l),p=se(f,a);return nu(e,t,r,u,p,i,o)}else{let u=jr(s,l),p=gh[u],h=r.direction[p]>=0,g,x;h?(g=G(s),x=q(s,l)):(g=q(s,l),x=G(s));let m=Je(g,n,r,i,o)?_a(g,e,t,r,i,o):null;if(m){let w=m.point[p];if(h?w<=n[x+u]:w>=n[x+u+3])return m}let y=Je(x,n,r,i,o)?_a(x,e,t,r,i,o):null;return m&&y?m.distance<=y.distance?m:y:m||y||null}}var Jn=new xe,ri=new ve,ii=new ve,Ki=new k,pu=new de,eo=new de;function du(s,e,t,r){j.setBuffer(s._roots[e]);let i=Ta(0,s,t,r);return j.clearBuffer(),i}function Ta(s,e,t,r,i=null){let{float32Array:o,uint16Array:n,uint32Array:a}=j,l=s*2;if(i===null&&(t.boundingBox||t.computeBoundingBox(),pu.set(t.boundingBox.min,t.boundingBox.max,r),i=pu),V(l,n)){let c=e.geometry,u=c.index,p=c.attributes.position,d=t.index,h=t.attributes.position,g=te(s,a),x=se(l,n);if(Ki.copy(r).invert(),t.boundsTree)return ie(s,o,eo),eo.matrix.copy(Ki),eo.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:m=>eo.intersectsBox(m),intersectsTriangle:m=>{m.a.applyMatrix4(r),m.b.applyMatrix4(r),m.c.applyMatrix4(r),m.needsUpdate=!0;for(let v=g*3,y=(x+g)*3;v<y;v+=3)if(ae(ii,v,u,p),ii.needsUpdate=!0,m.intersectsTriangle(ii))return!0;return!1}});{let b=Qt(t);for(let m=g*3,v=(x+g)*3;m<v;m+=3){ae(ri,m,u,p),ri.a.applyMatrix4(Ki),ri.b.applyMatrix4(Ki),ri.c.applyMatrix4(Ki),ri.needsUpdate=!0;for(let y=0,w=b*3;y<w;y+=3)if(ae(ii,y,d,h),ii.needsUpdate=!0,ri.intersectsTriangle(ii))return!0}}}else{let c=G(s),u=q(s,a);return ie(c,o,Jn),!!(i.intersectsBox(Jn)&&Ta(c,e,t,r,i)||(ie(u,o,Jn),i.intersectsBox(Jn)&&Ta(u,e,t,r,i)))}}var to=new k,Sa=new de,Xi=new de,xh=new F,yh=new F,vh=new F,bh=new F;function hu(s,e,t,r={},i={},o=0,n=1/0){e.boundingBox||e.computeBoundingBox(),Sa.set(e.boundingBox.min,e.boundingBox.max,t),Sa.needsUpdate=!0;let a=s.geometry,l=a.attributes.position,f=a.index,c=e.attributes.position,u=e.index,p=Re.getPrimitive(),d=Re.getPrimitive(),h=xh,g=yh,x=null,b=null;i&&(x=vh,b=bh);let m=1/0,v=null,y=null;return to.copy(t).invert(),Xi.matrix.copy(to),s.shapecast({boundsTraverseOrder:w=>Sa.distanceToBox(w),intersectsBounds:(w,S,T)=>T<m&&T<n?(S&&(Xi.min.copy(w.min),Xi.max.copy(w.max),Xi.needsUpdate=!0),!0):!1,intersectsRange:(w,S)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:I=>Xi.distanceToBox(I),intersectsBounds:(I,A,_)=>_<m&&_<n,intersectsRange:(I,A)=>{for(let _=I,B=I+A;_<B;_++){ae(d,3*_,u,c),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let P=w,R=w+S;P<R;P++){ae(p,3*P,f,l),p.needsUpdate=!0;let D=p.distanceToTriangle(d,h,x);if(D<m&&(g.copy(h),b&&b.copy(x),m=D,v=P,y=_),D<o)return!0}}}});{let T=Qt(e);for(let I=0,A=T;I<A;I++){ae(d,3*I,u,c),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let _=w,B=w+S;_<B;_++){ae(p,3*_,f,l),p.needsUpdate=!0;let P=p.distanceToTriangle(d,h,x);if(P<m&&(g.copy(h),b&&b.copy(x),m=P,v=_,y=I),P<o)return!0}}}}}),Re.releasePrimitive(p),Re.releasePrimitive(d),m===1/0?null:(r.point?r.point.copy(g):r.point=g.clone(),r.distance=m,r.faceIndex=v,i&&(i.point?i.point.copy(b):i.point=b.clone(),i.point.applyMatrix4(to),g.applyMatrix4(to),i.distance=g.sub(i.point).length(),i.faceIndex=y),r)}function mu(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=s.geometry,r=t.index?t.index.array:null,i=t.attributes.position,o,n,a,l,f=0,c=s._roots;for(let p=0,d=c.length;p<d;p++)o=c[p],n=new Uint32Array(o),a=new Uint16Array(o),l=new Float32Array(o),u(0,f),f+=o.byteLength;function u(p,d,h=!1){let g=p*2;if(V(g,a)){let x=te(p,n),b=se(g,a),m=1/0,v=1/0,y=1/0,w=-1/0,S=-1/0,T=-1/0;for(let I=x,A=x+b;I<A;I++){let _=3*s.resolveTriangleIndex(I);for(let B=0;B<3;B++){let P=_+B;P=r?r[P]:P;let R=i.getX(P),D=i.getY(P),M=i.getZ(P);R<m&&(m=R),R>w&&(w=R),D<v&&(v=D),D>S&&(S=D),M<y&&(y=M),M>T&&(T=M)}}return l[p+0]!==m||l[p+1]!==v||l[p+2]!==y||l[p+3]!==w||l[p+4]!==S||l[p+5]!==T?(l[p+0]=m,l[p+1]=v,l[p+2]=y,l[p+3]=w,l[p+4]=S,l[p+5]=T,!0):!1}else{let x=G(p),b=q(p,n),m=h,v=!1,y=!1;if(e){if(!m){let _=x/8+d/32,B=b/8+d/32;v=e.has(_),y=e.has(B),m=!v&&!y}}else v=!0,y=!0;let w=m||v,S=m||y,T=!1;w&&(T=u(x,d,m));let I=!1;S&&(I=u(b,d,m));let A=T||I;if(A)for(let _=0;_<3;_++){let B=x+_,P=b+_,R=l[B],D=l[B+3],M=l[P],W=l[P+3];l[p+_]=R<M?R:M,l[p+_+3]=D>W?D:W}return A}}}function gu(s,e,t,r,i,o,n){j.setBuffer(s._roots[e]),Ia(0,s,t,r,i,o,n),j.clearBuffer()}function Ia(s,e,t,r,i,o,n){let{float32Array:a,uint16Array:l,uint32Array:f}=j,c=s*2;if(V(c,l)){let p=te(s,f),d=se(c,l);au(e,t,r,p,d,i,o,n)}else{let p=G(s);Je(p,a,r,o,n)&&Ia(p,e,t,r,i,o,n);let d=q(s,f);Je(d,a,r,o,n)&&Ia(d,e,t,r,i,o,n)}}var wh=["x","y","z"];function xu(s,e,t,r,i,o){j.setBuffer(s._roots[e]);let n=Ca(0,s,t,r,i,o);return j.clearBuffer(),n}function Ca(s,e,t,r,i,o){let{float32Array:n,uint16Array:a,uint32Array:l}=j,f=s*2;if(V(f,a)){let u=te(s,l),p=se(f,a);return lu(e,t,r,u,p,i,o)}else{let u=jr(s,l),p=wh[u],h=r.direction[p]>=0,g,x;h?(g=G(s),x=q(s,l)):(g=q(s,l),x=G(s));let m=Je(g,n,r,i,o)?Ca(g,e,t,r,i,o):null;if(m){let w=m.point[p];if(h?w<=n[x+u]:w>=n[x+u+3])return m}let y=Je(x,n,r,i,o)?Ca(x,e,t,r,i,o):null;return m&&y?m.distance<=y.distance?m:y:m||y||null}}var ro=new xe,ni=new ve,oi=new ve,Qi=new k,yu=new de,io=new de;function vu(s,e,t,r){j.setBuffer(s._roots[e]);let i=Pa(0,s,t,r);return j.clearBuffer(),i}function Pa(s,e,t,r,i=null){let{float32Array:o,uint16Array:n,uint32Array:a}=j,l=s*2;if(i===null&&(t.boundingBox||t.computeBoundingBox(),yu.set(t.boundingBox.min,t.boundingBox.max,r),i=yu),V(l,n)){let c=e.geometry,u=c.index,p=c.attributes.position,d=t.index,h=t.attributes.position,g=te(s,a),x=se(l,n);if(Qi.copy(r).invert(),t.boundsTree)return ie(s,o,io),io.matrix.copy(Qi),io.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:m=>io.intersectsBox(m),intersectsTriangle:m=>{m.a.applyMatrix4(r),m.b.applyMatrix4(r),m.c.applyMatrix4(r),m.needsUpdate=!0;for(let v=g,y=x+g;v<y;v++)if(ae(oi,3*e.resolveTriangleIndex(v),u,p),oi.needsUpdate=!0,m.intersectsTriangle(oi))return!0;return!1}});{let b=Qt(t);for(let m=g,v=x+g;m<v;m++){let y=e.resolveTriangleIndex(m);ae(ni,3*y,u,p),ni.a.applyMatrix4(Qi),ni.b.applyMatrix4(Qi),ni.c.applyMatrix4(Qi),ni.needsUpdate=!0;for(let w=0,S=b*3;w<S;w+=3)if(ae(oi,w,d,h),oi.needsUpdate=!0,ni.intersectsTriangle(oi))return!0}}}else{let c=G(s),u=q(s,a);return ie(c,o,ro),!!(i.intersectsBox(ro)&&Pa(c,e,t,r,i)||(ie(u,o,ro),i.intersectsBox(ro)&&Pa(u,e,t,r,i)))}}var no=new k,Aa=new de,Zi=new de,_h=new F,Th=new F,Sh=new F,Ih=new F;function bu(s,e,t,r={},i={},o=0,n=1/0){e.boundingBox||e.computeBoundingBox(),Aa.set(e.boundingBox.min,e.boundingBox.max,t),Aa.needsUpdate=!0;let a=s.geometry,l=a.attributes.position,f=a.index,c=e.attributes.position,u=e.index,p=Re.getPrimitive(),d=Re.getPrimitive(),h=_h,g=Th,x=null,b=null;i&&(x=Sh,b=Ih);let m=1/0,v=null,y=null;return no.copy(t).invert(),Zi.matrix.copy(no),s.shapecast({boundsTraverseOrder:w=>Aa.distanceToBox(w),intersectsBounds:(w,S,T)=>T<m&&T<n?(S&&(Zi.min.copy(w.min),Zi.max.copy(w.max),Zi.needsUpdate=!0),!0):!1,intersectsRange:(w,S)=>{if(e.boundsTree){let T=e.boundsTree;return T.shapecast({boundsTraverseOrder:I=>Zi.distanceToBox(I),intersectsBounds:(I,A,_)=>_<m&&_<n,intersectsRange:(I,A)=>{for(let _=I,B=I+A;_<B;_++){let P=T.resolveTriangleIndex(_);ae(d,3*P,u,c),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let R=w,D=w+S;R<D;R++){let M=s.resolveTriangleIndex(R);ae(p,3*M,f,l),p.needsUpdate=!0;let W=p.distanceToTriangle(d,h,x);if(W<m&&(g.copy(h),b&&b.copy(x),m=W,v=R,y=_),W<o)return!0}}}})}else{let T=Qt(e);for(let I=0,A=T;I<A;I++){ae(d,3*I,u,c),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let _=w,B=w+S;_<B;_++){let P=s.resolveTriangleIndex(_);ae(p,3*P,f,l),p.needsUpdate=!0;let R=p.distanceToTriangle(d,h,x);if(R<m&&(g.copy(h),b&&b.copy(x),m=R,v=_,y=I),R<o)return!0}}}}}),Re.releasePrimitive(p),Re.releasePrimitive(d),m===1/0?null:(r.point?r.point.copy(g):r.point=g.clone(),r.distance=m,r.faceIndex=v,i&&(i.point?i.point.copy(b):i.point=b.clone(),i.point.applyMatrix4(no),g.applyMatrix4(no),i.distance=g.sub(i.point).length(),i.faceIndex=y),r)}function Ba(s,e,t){return s===null?null:(s.point.applyMatrix4(e.matrixWorld),s.distance=s.point.distanceTo(t.ray.origin),s.object=e,s)}var oo=new de,so=new On,wu=new F,_u=new k,Tu=new F,Ra=["getX","getY","getZ"],Et=class s extends Ft{static serialize(e,t={}){t={cloneBuffers:!0,...t};let r=e.geometry,i=e._roots,o=e._indirectBuffer,n=r.getIndex(),a={version:1,roots:null,index:null,indirectBuffer:null};return t.cloneBuffers?(a.roots=i.map(l=>l.slice()),a.index=n?n.array.slice():null,a.indirectBuffer=o?o.slice():null):(a.roots=i,a.index=n?n.array:null,a.indirectBuffer=o),a}static deserialize(e,t,r={}){r={setIndex:!0,indirect:!!e.indirectBuffer,...r};let{index:i,roots:o,indirectBuffer:n}=e;e.version||(console.warn("MeshBVH.deserialize: Serialization format has been changed and will be fixed up. It is recommended to regenerate any stored serialized data."),l(o));let a=new s(t,{...r,[qt]:!0});if(a._roots=o,a._indirectBuffer=n||null,r.setIndex){let f=t.getIndex();if(f===null){let c=new st(e.index,1,!1);t.setIndex(c)}else f.array!==i&&(f.array.set(i),f.needsUpdate=!0)}return a;function l(f){for(let c=0;c<f.length;c++){let u=f[c],p=new Uint32Array(u),d=new Uint16Array(u);for(let h=0,g=u.byteLength/32;h<g;h++){let x=8*h,b=2*x;V(b,d)||(p[x+6]=p[x+6]/8-h)}}}}get primitiveStride(){return 3}get resolveTriangleIndex(){return this.resolvePrimitiveIndex}constructor(e,t={}){t.maxLeafTris&&(console.warn('MeshBVH: "maxLeafTris" option has been deprecated. Use "targetLeafSize", instead.'),t={...t,targetLeafSize:t.maxLeafTris}),super(e,t)}shiftTriangleOffsets(e){return super.shiftPrimitiveOffsets(e)}writePrimitiveBounds(e,t,r){let i=this.geometry,o=this._indirectBuffer,n=i.attributes.position,a=i.index?i.index.array:null,f=(o?o[e]:e)*3,c=f+0,u=f+1,p=f+2;a&&(c=a[c],u=a[u],p=a[p]);for(let d=0;d<3;d++){let h=n[Ra[d]](c),g=n[Ra[d]](u),x=n[Ra[d]](p),b=h;g<b&&(b=g),x<b&&(b=x);let m=h;g>m&&(m=g),x>m&&(m=x),t[r+d]=b,t[r+d+3]=m}return t}computePrimitiveBounds(e,t,r){let i=this.geometry,o=this._indirectBuffer,n=i.attributes.position,a=i.index?i.index.array:null,l=n.normalized;if(e<0||t+e-r.offset>r.length/6)throw new Error("MeshBVH: compute triangle bounds range is invalid.");let f=n.array,c=n.offset||0,u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);let p=["getX","getY","getZ"],d=r.offset;for(let h=e,g=e+t;h<g;h++){let b=(o?o[h]:h)*3,m=(h-d)*6,v=b+0,y=b+1,w=b+2;a&&(v=a[v],y=a[y],w=a[w]),l||(v=v*u+c,y=y*u+c,w=w*u+c);for(let S=0;S<3;S++){let T,I,A;l?(T=n[p[S]](v),I=n[p[S]](y),A=n[p[S]](w)):(T=f[v+S],I=f[y+S],A=f[w+S]);let _=T;I<_&&(_=I),A<_&&(_=A);let B=T;I>B&&(B=I),A>B&&(B=A);let P=(B-_)/2,R=S*2;r[m+R+0]=_+P,r[m+R+1]=P+(Math.abs(_)+P)*Gr}}return r}raycastObject3D(e,t,r=[]){let{material:i}=e;if(i===void 0)return;_u.copy(e.matrixWorld).invert(),so.copy(t.ray).applyMatrix4(_u),Tu.setFromMatrixScale(e.matrixWorld),wu.copy(so.direction).multiply(Tu);let o=wu.length(),n=t.near/o,a=t.far/o;if(t.firstHitOnly===!0){let l=this.raycastFirst(so,i,n,a);l=Ba(l,e,t),l&&r.push(l)}else{let l=this.raycast(so,i,n,a);for(let f=0,c=l.length;f<c;f++){let u=Ba(l[f],e,t);u&&r.push(u)}}return r}refit(e=null){return(this.indirect?mu:su)(this,e)}raycast(e,t=dr,r=0,i=1/0){let o=this._roots,n=[],a=this.indirect?gu:uu;for(let l=0,f=o.length;l<f;l++)a(this,l,t,e,n,r,i);return n}raycastFirst(e,t=dr,r=0,i=1/0){let o=this._roots,n=null,a=this.indirect?xu:fu;for(let l=0,f=o.length;l<f;l++){let c=a(this,l,t,e,r,i);c!=null&&(n==null||c.distance<n.distance)&&(n=c)}return n}intersectsGeometry(e,t){let r=!1,i=this._roots,o=this.indirect?vu:du;for(let n=0,a=i.length;n<a&&(r=o(this,n,e,t),!r);n++);return r}shapecast(e){let t=Re.getPrimitive(),r=super.shapecast({...e,intersectsPrimitive:e.intersectsTriangle,scratchPrimitive:t,iterate:this.indirect?cu:ou});return Re.releasePrimitive(t),r}bvhcast(e,t,r){let{intersectsRanges:i,intersectsTriangles:o}=r,n=Re.getPrimitive(),a=this.geometry.index,l=this.geometry.attributes.position,f=this.indirect?h=>{let g=this.resolveTriangleIndex(h);ae(n,g*3,a,l)}:h=>{ae(n,h*3,a,l)},c=Re.getPrimitive(),u=e.geometry.index,p=e.geometry.attributes.position,d=e.indirect?h=>{let g=e.resolveTriangleIndex(h);ae(c,g*3,u,p)}:h=>{ae(c,h*3,u,p)};if(o){if(!(e instanceof s))throw new Error('MeshBVH: "intersectsTriangles" callback can only be used with another MeshBVH.');let h=(g,x,b,m,v,y,w,S)=>{for(let T=b,I=b+m;T<I;T++){d(T),c.a.applyMatrix4(t),c.b.applyMatrix4(t),c.c.applyMatrix4(t),c.needsUpdate=!0;for(let A=g,_=g+x;A<_;A++)if(f(A),n.needsUpdate=!0,o(n,c,A,T,v,y,w,S))return!0}return!1};if(i){let g=i;i=function(x,b,m,v,y,w,S,T){return g(x,b,m,v,y,w,S,T)?!0:h(x,b,m,v,y,w,S,T)}}else i=h}return super.bvhcast(e,t,{intersectsRanges:i})}intersectsBox(e,t){return oo.set(e.min,e.max,t),oo.needsUpdate=!0,this.shapecast({intersectsBounds:r=>oo.intersectsBox(r),intersectsTriangle:r=>oo.intersectsTriangle(r)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,r={},i={},o=0,n=1/0){return(this.indirect?bu:hu)(this,e,t,r,i,o,n)}closestPointToPoint(e,t={},r=0,i=1/0){return Qc(this,e,t,r,i)}};var Iu=new F,Cu=new F,Pu=new F,Lt=new On,Au=new k,_r=new F,Da=new F,Ch=["x","y","z"],ao=parseInt("186")>=169,Ph=parseInt("186")<=161,lo=new X,co=new X,uo=new X,Bu=new F,Ru=new F,$u=new F,vt=class extends Ft{get primitiveStride(){return 3}constructor(e,t={}){if(!e.isMesh)throw new Error("SkinnedMeshBVH: First argument must be a Mesh.");super(e.geometry,{...t,[qt]:!0}),this.mesh=e,t[qt]||this.init(t)}writePrimitiveBounds(e,t,r){let{mesh:i,geometry:o}=this,n=this._indirectBuffer,a=o.index?o.index.array:null,f=(n?n[e]:e)*3,c=f+0,u=f+1,p=f+2;a&&(c=a[c],u=a[u],p=a[p]),i.getVertexPosition(c,Iu),i.getVertexPosition(u,Cu),i.getVertexPosition(p,Pu);for(let d=0;d<3;d++){let h=Ch[d],g=Iu[h],x=Cu[h],b=Pu[h],m=g;x<m&&(m=x),b<m&&(m=b);let v=g;x>v&&(v=x),b>v&&(v=b),t[r+d]=m,t[r+d+3]=v}return t}shapecast(e){let t=new ve;return super.shapecast({...e,intersectsPrimitive:e.intersectsTriangle,scratchPrimitive:t,iterate:Ah})}raycastObject3D(e,t,r=[]){let{material:i}=e;if(i===void 0)return;let{matrixWorld:o}=e,{firstHitOnly:n}=t;Au.copy(o).invert(),Lt.copy(t.ray).applyMatrix4(Au);let a=null,l=1/0;return this.shapecast({boundsTraverseOrder:f=>f.distanceToPoint(Lt.origin),intersectsBounds:f=>{if(n){if(!Lt.intersectBox(f,Da))return 0;let c;return f.containsPoint(Lt.origin)?c=0:(Da.applyMatrix4(o),c=t.ray.origin.distanceTo(Da)),c<l?1:0}else return Lt.intersectsBox(f)?1:0},intersectsTriangle:(f,c)=>{let u=null;if(i.side===dr?u=Lt.intersectTriangle(f.a,f.b,f.c,!0,_r):i.side===Ur?u=Lt.intersectTriangle(f.c,f.b,f.a,!0,_r):u=Lt.intersectTriangle(f.a,f.b,f.c,!1,_r),!u)return;u=u.clone().applyMatrix4(o);let p=t.ray.origin.distanceTo(u);if(p>=t.near&&p<=t.far){if(n&&p>=l)return;let{geometry:d}=this,{index:h}=d,g=this.resolvePrimitiveIndex(c),x=g*3,b=x+0,m=x+1,v=x+2;h&&(b=h.array[b],m=h.array[m],v=h.array[v]);let y={distance:p,point:u.clone(),object:e,uv:null,uv1:null,normal:null,face:{a:b,b:m,c:v,normal:Me.getNormal(f.a,f.b,f.c,new F),materialIndex:0},faceIndex:g};if(ao){let I=new F;Me.getBarycoord(_r,f.a,f.b,f.c,I),y.barycoord=I}let w=d.attributes.uv,S=d.attributes.uv1,T=d.attributes.normal;if(w){lo.fromBufferAttribute(w,b),co.fromBufferAttribute(w,m),uo.fromBufferAttribute(w,v),y.uv=new X;let I=Me.getInterpolation(_r,f.a,f.b,f.c,lo,co,uo,y.uv);ao||(y.uv=I)}if(S){lo.fromBufferAttribute(S,b),co.fromBufferAttribute(S,m),uo.fromBufferAttribute(S,v),y.uv1=new X;let I=Me.getInterpolation(_r,f.a,f.b,f.c,lo,co,uo,y.uv1);ao||(y.uv1=I),Ph&&(y.uv2=y.uv1)}if(T){Bu.fromBufferAttribute(T,b),Ru.fromBufferAttribute(T,m),$u.fromBufferAttribute(T,v),y.normal=new F;let I=Me.getInterpolation(_r,f.a,f.b,f.c,Bu,Ru,$u,y.normal);y.normal.dot(Lt.direction)>0&&y.normal.multiplyScalar(-1),ao||(y.normal=I)}l=y.distance,a=y,n||r.push(y)}}}),n&&a&&r.push(a),r}};function Ah(s,e,t,r,i,o,n){let{mesh:a,geometry:l}=t,f=l.index?l.index.array:null;for(let c=s,u=e+s;c<u;c++){let p=t.resolvePrimitiveIndex(c),d=3*p+0,h=3*p+1,g=3*p+2;if(f&&(d=f[d],h=f[h],g=f[g]),a.getVertexPosition(d,n.a),a.getVertexPosition(h,n.b),a.getVertexPosition(g,n.c),n.needsUpdate=!0,r(n,c,i,o))return!0}return!1}var et=new Q({min:"array<f32, 3>",max:"array<f32, 3>"},"BVHBoundingBox");et.getLength=()=>6;var He=new Q({bounds:"BVHBoundingBox",rightChildOrTriangleOffset:"uint",splitAxisOrTriangleCount:"uint"},"BVHNode");He.getLength=()=>et.getLength()+2;var Du=new Q({matrixWorld:"mat4x4f",inverseMatrixWorld:"mat4x4f",visible:"uint",_alignment0:"uint",_alignment1:"uint",_alignment2:"uint"},"TransformStruct"),z=new Q({origin:"vec3f",direction:"vec3f",maxDist:"float"},"Ray"),Zt=new Q({indices:"vec4u",normal:"vec3f",didHit:"bool",barycoord:"vec3f",objectIndex:"uint",side:"float",dist:"float"},"IntersectionResult"),Ji=new Q({faceIndices:"vec4u",closestPoint:"vec3f",found:"bool",barycoord:"vec3f",objectIndex:"uint",faceNormal:"vec3f",side:"float",distanceSq:"float"},"PointQueryResult");var fo=xr(`

	const BVH_STACK_DEPTH = 60u;
	const INFINITY = 1e20;
	const TRI_INTERSECT_EPSILON = 1e-5;

`),po=xr(`
	struct IntersectionResult {
		indices: vec4u,
		normal: vec3f,
		didHit: bool,
		barycoord: vec3f,
		side: f32,
		dist: f32,
	};
`),Ty=$(`

	fn getVertexAttribute(
		barycoord: vec3f,
		indices: vec3u,
		attributeBuffer: ptr<storage, array<vec3f>, read>
	) -> vec3f {

		let n0 = attributeBuffer[ indices.x ];
		let n1 = attributeBuffer[ indices.y ];
		let n2 = attributeBuffer[ indices.z ];
		return barycoord.x * n0 + barycoord.y * n1 + barycoord.z * n2;

	}

`),Nu=$(`

	fn intersectsBounds(
		ray: Ray,
		bounds: BVHBoundingBox,
		dist: ptr<function, f32>
	) -> bool {

		let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
		let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

		let invDir = 1.0 / ray.direction;
		let tMinPlane = ( boundsMin - ray.origin ) * invDir;
		let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

		let tMinHit = vec3f(
			min( tMinPlane.x, tMaxPlane.x ),
			min( tMinPlane.y, tMaxPlane.y ),
			min( tMinPlane.z, tMaxPlane.z )
		);

		let tMaxHit = vec3f(
			max( tMinPlane.x, tMaxPlane.x ),
			max( tMinPlane.y, tMaxPlane.y ),
			max( tMinPlane.z, tMaxPlane.z )
		);

		let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
		let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

		( *dist ) = max( t0, 0.0 );

		return t1 >= ( *dist );

	}

`,[z,et]);var Na=$(`

	fn intersectsTriangle( ray: Ray, a: vec3f, b: vec3f, c: vec3f ) -> IntersectionResult {

		var result: IntersectionResult;
		result.didHit = false;

		let edge1 = b - a;
		let edge2 = c - a;
		let n = cross( edge1, edge2 );

		let det = - dot( ray.direction, n );

		if ( abs( det ) < TRI_INTERSECT_EPSILON ) {

			return result;

		}

		let invdet = 1.0 / det;

		let AO = ray.origin - a;
		let DAO = cross( AO, ray.direction );

		let u = dot( edge2, DAO ) * invdet;
		let v = -dot( edge1, DAO ) * invdet;
		let t = dot( AO, n ) * invdet;

		let w = 1.0 - u - v;

		if ( u < - TRI_INTERSECT_EPSILON || v < - TRI_INTERSECT_EPSILON || w < - TRI_INTERSECT_EPSILON || t < TRI_INTERSECT_EPSILON ) {

			return result;

		}

		result.didHit = true;
		result.barycoord = vec3f( w, u, v );
		result.dist = t;
		result.side = sign( det );
		result.normal = result.side * normalize( n );

		return result;

	}

`,[z,po,fo]),Bh=$(`

	fn intersectTriangles(
		bvh_position: ptr<storage, array<vec3f>, read>,
		bvh_index: ptr<storage, array<vec3u>, read>,
		offset: u32,
		count: u32,
		ray: Ray
	) -> IntersectionResult {

		var closestResult: IntersectionResult;

		closestResult.didHit = false;
		closestResult.dist = INFINITY;

		for ( var i = offset; i < offset + count; i = i + 1u ) {

			let indices = bvh_index[ i ];
			let a = bvh_position[ indices.x ];
			let b = bvh_position[ indices.y ];
			let c = bvh_position[ indices.z ];

			var triResult = intersectsTriangle( ray, a, b, c );

			if ( triResult.didHit && triResult.dist < closestResult.dist ) {

				closestResult = triResult;
				closestResult.indices = vec4u( indices.xyz, i );

			}

		}

		return closestResult;

	}

`,[Na,z,po,fo]),Ay=$(`

	fn bvhIntersectFirstHit(
		bvh_index: ptr<storage, array<vec3u>, read>,
		bvh_position: ptr<storage, array<vec3f>, read>,
		bvh: ptr<storage, array<BVHNode>,read>,
		ray: Ray,
	) -> IntersectionResult {

		var pointer = 0;
		var stack: array<u32, BVH_STACK_DEPTH>;
		stack[ 0 ] = 0u;

		var bestHit: IntersectionResult;

		bestHit.didHit = false;
		bestHit.dist = INFINITY;

		loop {

			if ( pointer < 0 || pointer >= i32( BVH_STACK_DEPTH ) ) {

				break;

			}

			let currNodeIndex = stack[ pointer ];
			let node = bvh[ currNodeIndex ];

			pointer = pointer - 1;

			var boundsHitDistance: f32 = 0.0;

			if ( ! intersectsBounds( ray, node.bounds, &boundsHitDistance ) || boundsHitDistance > bestHit.dist ) {

				continue;

			}

			let boundsInfox = node.splitAxisOrTriangleCount;
			let boundsInfoy = node.rightChildOrTriangleOffset;

			let isLeaf = ( boundsInfox & 0xffff0000u ) != 0u;

			if ( isLeaf ) {

				let count = boundsInfox & 0x0000ffffu;
				let offset = boundsInfoy;

				let localHit = intersectTriangles(
					bvh_position, bvh_index, offset,
					count, ray
				);

				if ( localHit.didHit && localHit.dist < bestHit.dist ) {

					bestHit = localHit;

				}

			} else {

				let leftIndex = currNodeIndex + 1u;
				let splitAxis = boundsInfox & 0x0000ffffu;
				let rightIndex = currNodeIndex + boundsInfoy;

				let leftToRight = ray.direction[splitAxis] >= 0.0;
				let c1 = select( rightIndex, leftIndex, leftToRight );
				let c2 = select( leftIndex, rightIndex, leftToRight );

				pointer = pointer + 1;
				stack[ pointer ] = c2;

				pointer = pointer + 1;
				stack[ pointer ] = c1;

			}

		}

		return bestHit;

	}

`,[Bh,Nu,z,He,po,fo]);var ho=class extends Ui{static get type(){return"ProxyCallNode"}constructor(e,t){super(),this.proxyNode=e,this.params=t}setup(){return this.proxyNode.proxyNode.call(...this.params)}},en=class{get isNode(){return!0}get proxyNode(){let{proxyObject:e,proxyProperty:t}=this,r=t.split("."),i=e;for(let o=0,n=r.length;o<n;o++)i=i?.[r[o]];return i&&"functionNode"in i?i.functionNode:i??null}constructor(e,t=null){return this.proxyObject=t,this.proxyProperty=e,new Proxy(this,{get(r,i){if(i in r)return Reflect.get(r,i);{let o=r.proxyNode;if(!o)return;let n=Reflect.get(o,i);return typeof n=="function"?n.bind(o):n}},set(r,i,o){if(i in r)return Reflect.set(r,i,o);throw new Error("NodeProxy: Cannot set members of proxied nodes.")}})}},Z=(...s)=>new en(...s),Y=(...s)=>{let e=new en(...s),t=(...r)=>new ho(e,r);return Vi.nodeProxyConstructor(t,e)},Fa=class extends en{get proxyNode(){return super.proxyNode||this.fallbackNode}constructor(e,t){super(e,null),Object.defineProperty(this,"fallbackNode",{value:t})}setup(e){return this.proxyObject=e.getContext(),this.proxyNode.setup(e)}};var Tr=(...s)=>{let e=new Fa(...s),t=(...r)=>new ho(e,r);return Vi.nodeProxyConstructor(t,e)};var Jt=new ot,bt=new ot;function Rh(s,e){let t=s?s.array:null,r=new Uint32Array(e.length*3);for(let i=0,o=e.length;i<o;i++){let n=3*i,a=3*e[i];for(let l=0;l<3;l++)r[n+l]=t?t[a+l]:a+l}return r}function Ma(s,e,t,r){let i=new Uint32Array(r),o=new Float32Array(r);s._roots.forEach(n=>{let a=new Uint16Array(n),l=new Uint32Array(n);for(let f=0,c=n.byteLength/32;f<c;f++){let u=f*8,p=u*2,d=t*8,h=new Float32Array(n,f*32,6);if(f===0)for(let x=0;x<3;x++){let b=h[x+0],m=h[x+3];b>m?(o[d+x+0]=1,o[d+x+3]=-1):(o[d+x+0]=b,o[d+x+3]=m)}else o.set(h,d);if(e===null){t++;continue}if(V(p,a)){let x=l[u+6],b=a[p+14],{transformSlot:m,nodeOffset:v}=b===0?{transformSlot:0,nodeOffset:0}:e[x];if(m>16777215)throw new Error(`packBVHBufferUtils: transform slot ${m} exceeds the 24-bit TLAS leaf limit.`);i[d+6]=v,i[d+7]=4278190080|m&16777215}else i[d+6]=l[u+6],i[d+7]=l[u+7];t++}})}function Fu(s,e){return Mu(new Uint16Array(s),new Uint32Array(s),e)}function Mu(s,e,t){if(V(t*8*2,s))return 1;let i=e[t*8+6];return i+Mu(s,e,t+i)}function Ea(s,e=0){let t=new Uint16Array(s),r=new Uint32Array(s),i=0;return o(e*8,1),i;function o(n,a){let l=n,f=n*2;if(V(f,t))i=Math.max(a,i);else{let u=q(l,r),p=G(l);o(p,a+1),o(u,a+1)}}}function Eu(s,e,t,r,i,o){let n=new Uint16Array(o),a=new Uint32Array(o),l=new Float32Array(o),f=new Uint16Array(s),c=new Uint32Array(s);for(let u=0;u<t;u++){let p=e+u,d=p*8,h=d*2,g=i*8,x=g*2,b=new Float32Array(s,p*32,6);if(u===0)for(let v=0;v<3;v++){let y=b[v+0],w=b[v+3];y>w?(l[g+v+0]=1,l[g+v+3]=-1):(l[g+v+0]=y,l[g+v+3]=w)}else l.set(b,g);V(h,f)?(a[g+6]=c[d+6]+r,n[x+14]=f[h+14],n[x+15]=65535):(a[g+6]=c[d+6],a[g+7]=c[d+7]),i++}}function Lu(s,e,t,r,i){let{geometry:o}=s,{start:n,count:a,vertexStart:l}=e;if(s.indirect){let f=Rh(o.index,s._indirectBuffer);for(let c=0;c<f.length;c++)i[c+r]=f[c]-l+t}else if(o.index)for(let f=0;f<a;f++)i[f+r]=o.index.getX(f+n)-l+t;else for(let f=0;f<a;f++)i[f+r]=f+n+t}function ku(s,e,t,r,i,o){let{geometry:n,mesh:a=null}=s,{vertexStart:l,vertexCount:f}=e,c=new Float32Array(r),u=i.getLength();i.membersLayout.forEach(({name:p},d)=>{let h=n.attributes[p];o.getDefaultAttributeValue(p,Jt);for(let g=0;g<f;g++){if(h){switch(bt.fromBufferAttribute(h,g+l),h.itemSize){case 1:bt.y=Jt.y,bt.z=Jt.z,bt.w=Jt.w;break;case 2:bt.z=Jt.z,bt.w=Jt.w;break;case 3:bt.w=Jt.w;break}a&&(p==="position"||p==="normal"||p==="tangent")&&a.applyBoneTransform(g+l,bt)}else bt.copy(Jt);bt.toArray(c,(t+g)*u+d*4)}})}var La=class extends Ui{constructor(e){super(),this.literal=e}build(){return this.literal}},tn=class extends Ui{constructor(e,t="property"){super(),this.node=e,this.output=t}build(e){return this.node.build(e,this.output)}};function $h(s){return s.isNode?new tn(s):null}function Ou(s){let e=[];for(let t of s)if(Array.isArray(t))for(let r of t){let i=$h(r);i&&e.push(i)}return e}function zu(s,e){return s.map(t=>(t&&!t.isNode&&t instanceof Function&&(t=t(e)),t&&t.isNode?(t.setup(e),t.isWGSLTagCodeNode?new tn(t,"inline"):new tn(t)):t))}function ka(s,e,t){let r="";for(let i=0,o=s.length;i<o;i++)if(r+=s[i],i<e.length){let n=e[i];Array.isArray(n)||(typeof n=="string"||typeof n=="number"?r+=String(n):r+=n.build(t))}return r}var Oa=class extends Ic{static get type(){return"WGSLTagFnNode"}constructor(e,t,r="wgsl"){super("",Ou(t),r),this.isWGSLTagFnNode=!0,this.tokens=e,this.args=t}setup(e){super.setup(e),this._normalizedArgs=zu(this.args,e)}getNodeFunction(e){let{tokens:t,_normalizedArgs:r}=this,i=e.getDataFromNode(this),o=i.nodeFunction;if(o===void 0){let n="";for(let a=0,l=t.length;a<l;a++)if(n+=t[a],a<r.length){let f=r[a];Array.isArray(f)||(typeof f=="string"||typeof f=="number"?n+=String(f):f.isStructLayoutNode?n+=f.getNodeType(e):f.isStruct?n+=f.layout.getNodeType(e):n+="_arg"+a)}n=n.replace(/\/\/.*[\n\r]/g,""),o=e.parser.parseFunction(n),i.nodeFunction=o}return o}generate(e,t){let r=super.generate(e,t),{_normalizedArgs:i}=this,o=ka(this.tokens,i,e),{type:n}=this.getNodeFunction(e),a=e.getCodeFromNode(this,n);return a.code=o.replace(/\/\/.+[\n\r]/g,"").replace(/->\s*void/,"").trim(),r}},za=class extends Sc{static get type(){return"WGSLTagCodeNode"}constructor(e,t,r="wgsl"){super("",Ou(t),r),this.isWGSLTagCodeNode=!0,this.tokens=e,this.args=t}setup(e){super.setup(e),this._normalizedArgs=zu(this.args,e)}build(e,t){return t==="inline"?ka(this.tokens,this._normalizedArgs,e):super.build(e,t)}generate(e){super.generate(e);let t=e.getCodeFromNode(this,this.getNodeType(e));return t.code=ka(this.tokens,this._normalizedArgs,e),t.code}},Dh=s=>{let e=(...t)=>{if(t.length===1&&t[0]&&typeof t[0]=="object"&&!t[0].isNode){let r=t[0];for(let i in r)typeof r[i]=="string"&&(r[i]=new La(r[i]))}return s.call(...t)};return Vi.nodeProxyConstructor(e,s)},C=(s,...e)=>Dh(new Oa(s,e)),Sr=(s,...e)=>new za(s,e);var rn=at(60);function Uu(s,e){let{name:t=`bvh_shapecast_fn_${Math.random().toString(36).substring(2,7)}`,shapeStruct:r,resultStruct:i=null,prefixFn:o=null,boundsOrderFn:n=null,intersectsBoundsFn:a,intersectRangeFn:l,transformShapeFn:f=null,transformResultFn:c=null,resetShapeFn:u=null}=e,{nodes:p,transforms:d}=s.storage,h="";o&&(h=Sr`${o}();`);let g="";c&&(g=Sr`${c}( result, objectIndex );`);let x="";f&&(x=Sr`${f}( &localShape, objectIndex );`);let b="";u&&(b=Sr`${u}( objectIndex );`);let m="";n&&(m=Sr`
			let leftToRight = ${n}( localShape, splitAxis, node );
			c1 = select( rightIndex, leftIndex, leftToRight );
			c2 = select( leftIndex, rightIndex, leftToRight );
		`);let v=i?Sr`result: ptr<function, ${i}>`:"",y=i?"result":"",w=C`
		// fn
		fn ${t}( shape: ${r}, ${v} ) -> bool {

			${h}

			var didHit = false;

			var isTLAS = true;
			var pointer: i32 = 0;
			var stack: array<u32, ${rn}>;
			stack[ 0 ] = 0u;

			var blasDidHit: bool = false;
			var objectIndex: u32 = 0;
			var localShape: ${r} = shape;

			// the stack depth the current cluster's BLAS drains back down to once it is complete
			var tlasReset: i32 = 0;

			loop {

				// The cluster's BLAS has drained back to its TLAS leaf. Finalize the cluster that
				// was just traversed and resume the TLAS.
				if ( ! isTLAS && tlasReset == pointer ) {

					if ( blasDidHit ) {

						blasDidHit = false;
						didHit = true;
						${g}

					}

					${b}

					objectIndex = 0;
					isTLAS = true;
					localShape = shape;

				}

				// check if we've finished all nodes on the stack (or overrun the stack)
				if ( pointer < 0 || pointer >= i32( ${rn} ) ) {

					break;

				}

				let nodeIndex = stack[ pointer ];
				let node = ${p}[ nodeIndex ];
				pointer = pointer - 1;

				// skip the node if we don't intersect the bounds
				if ( ${a}( localShape, node.bounds, ${y} ) == 0u ) {

					continue;

				}

				let infoX = node.splitAxisOrTriangleCount;
				let infoY = node.rightChildOrTriangleOffset;
				let isLeaf = ( infoX & 0xffff0000u ) != 0u;

				if ( isLeaf ) {

					if ( isTLAS ) {

						// the leaf encodes the placement / transform slot in the low 24 bits of infoX
						// and the cluster subtree's absolute node offset in infoY, which is pushed
						// directly as the BLAS entry node. Each TLAS leaf references one cluster.
						objectIndex = infoX & 0x00ffffffu;

						let transform = ${d}[ objectIndex ];
						if ( transform.visible != 0u ) {

							tlasReset = pointer;
							isTLAS = false;
							blasDidHit = false;

							// Transform shape into object local space
							localShape = shape;
							${x}

							pointer = pointer + 1;
							stack[ pointer ] = infoY;

						}

					} else {

						let count = infoX & 0x0000ffffu;
						let offset = infoY;
						blasDidHit = ${l}( localShape, offset, count, ${y} ) || blasDidHit;

					}

				} else {

					let leftIndex = nodeIndex + 1u;
					let splitAxis = infoX & 0x0000ffffu;
					let rightIndex = nodeIndex + infoY;

					var c1 = rightIndex;
					var c2 = leftIndex;
					${m}

					pointer = pointer + 1;
					stack[ pointer ] = c2;

					pointer = pointer + 1;
					stack[ pointer ] = c1;

				}

			}

			return didHit;

		}
	`;return w.outputType=i,w.functionName=t,w}var Vu=C`
	// fn
	fn closestPointToTriangle(
		p: vec3f,
		v0: vec3f,
		v1: vec3f,
		v2: vec3f
	) -> vec3f {

		let v10 = v1 - v0;
		let v21 = v2 - v1;
		let v02 = v0 - v2;
		let p0 = p - v0;
		let p1 = p - v1;
		let p2 = p - v2;

		let nor = cross( v10, v02 );
		let q = cross( nor, p0 );
		let d = 1.0 / dot( nor, nor );
		var u = d * dot( q, v02 );
		var v = d * dot( q, v10 );
		var w = 1.0 - u - v;

		if ( u < 0.0 ) {

			w = clamp( dot( p2, v02 ) / dot( v02, v02 ), 0.0, 1.0 );
			u = 0.0;
			v = 1.0 - w;

		} else if ( v < 0.0 ) {

			u = clamp( dot( p0, v10 ) / dot( v10, v10 ), 0.0, 1.0 );
			v = 0.0;
			w = 1.0 - u;

		} else if ( w < 0.0 ) {

			v = clamp( dot( p1, v21 ) / dot( v21, v21 ), 0.0, 1.0 );
			w = 0.0;
			u = 1.0 - v;

		}

		return vec3f( w, u, v );

	}
`,mo=C`
	// fn
	fn intersectRayTriangle( ray: ${z}, a: vec3f, b: vec3f, c: vec3f, threshold: f32 ) -> ${Zt} {

		const DET_EPSILON = 1e-15;

		var result: ${Zt};
		result.didHit = false;

		let edge1 = b - a;
		let edge2 = c - a;
		let n = cross( edge1, edge2 );

		let det = - dot( ray.direction, n );
		if ( abs( det ) < DET_EPSILON ) {

			return result;

		}

		let invdet = 1.0 / det;

		let AO = ray.origin - a;
		let DAO = cross( AO, ray.direction );

		let u = dot( edge2, DAO ) * invdet;
		if ( u < 0.0 || u > 1.0 ) {

			return result;

		}

		let v = - dot( edge1, DAO ) * invdet;
		if ( v < 0.0 || u + v > 1.0 ) {

			return result;

		}

		let t = dot( AO, n ) * invdet;
		let w = 1.0 - u - v;
		if ( t < threshold ) {

			return result;

		}

		result.didHit = true;
		result.barycoord = vec3f( w, u, v );
		result.dist = t;
		result.side = sign( det );
		result.normal = result.side * normalize( n );

		return result;

	}
`,er=C`
	// fn
	fn ndcToCameraRay( ndc: vec2f, inverseModelViewProjection: mat4x4f ) -> ${z} {

		var homogeneous = vec4f();
		var ray: ${z};

		homogeneous = inverseModelViewProjection * vec4f( ndc, 0.0, 1.0 );
		ray.origin = homogeneous.xyz / homogeneous.w;

		homogeneous = inverseModelViewProjection * vec4f( ndc, 1.0, 1.0 );
		let toFarPlane = ( homogeneous.xyz / homogeneous.w ) - ray.origin;
		ray.maxDist = length( toFarPlane );
		ray.direction = toFarPlane / ray.maxDist;

		return ray;

	}
`;function Hu(s){let{index:e,attributes:t,transforms:r}=s.storage,i=Ue(1).toVar(`bvh_rayScalar_${Math.random().toString(36).substring(2,7)}`);return s.getShapecastFn({name:"bvh_RaycastFirstHit",shapeStruct:z,resultStruct:Zt,boundsOrderFn:C`
			fn getBoundsOrder( ray: ${z}, splitAxis: u32, node: ${He} ) -> bool {

				return ray.direction[ splitAxis ] >= 0.0;

			}
		`,intersectsBoundsFn:C`
			fn rayIntersectsBounds( ray: ${z}, bounds: ${et}, result: ptr<function, ${Zt}> ) -> u32 {

				let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
				let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

				let invDir = 1.0 / ray.direction;
				let tMinPlane = ( boundsMin - ray.origin ) * invDir;
				let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

				let tMinHit = vec3f(
					min( tMinPlane.x, tMaxPlane.x ),
					min( tMinPlane.y, tMaxPlane.y ),
					min( tMinPlane.z, tMaxPlane.z )
				);

				let tMaxHit = vec3f(
					max( tMinPlane.x, tMaxPlane.x ),
					max( tMinPlane.y, tMaxPlane.y ),
					max( tMinPlane.z, tMaxPlane.z )
				);

				let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
				let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

				let dist = max( t0, 0.0 );
				if ( t1 < dist ) {

					return 0u;

				} else if ( ray.maxDist > 0.0 && dist * ${i} >= ray.maxDist ) {

					return 0u;

				} else if ( result.didHit && dist * ${i} >= result.dist ) {

					return 0u;

				} else {

					return 1u;

				}

			}

		`,intersectRangeFn:C`
			fn intersectRange( ray: ${z}, offset: u32, count: u32, result: ptr<function, ${Zt}> ) -> bool {

				var didHit = false;
				for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

					let i0 = ${e}[ ti * 3u ];
					let i1 = ${e}[ ti * 3u + 1u ];
					let i2 = ${e}[ ti * 3u + 2u ];

					let a = ${t}[ i0 ].position.xyz;
					let b = ${t}[ i1 ].position.xyz;
					let c = ${t}[ i2 ].position.xyz;

					var triResult = ${mo}( ray, a, b, c, 0.0 );
					triResult.dist *= ${i};
					if ( triResult.didHit && ( ray.maxDist <= 0.0 || triResult.dist < ray.maxDist ) && ( ! result.didHit || triResult.dist < result.dist ) ) {

						result.didHit = true;
						result.dist = triResult.dist;
						result.normal = triResult.normal;
						result.side = triResult.side;
						result.barycoord = triResult.barycoord;
						result.indices = vec4u( i0, i1, i2, ti );

						didHit = true;

					}

				}

				return didHit;

			}
		`,transformShapeFn:C`
			fn transformRay( ray: ptr<function, ${z}>, objectIndex: u32 ) -> void {

				let toLocal = ${r}[ objectIndex ].inverseMatrixWorld;
				ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
				ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

				let len = length( ray.direction );
				ray.direction /= len;
				${i} = 1.0 / len;

			}
		`,transformResultFn:C`
			fn transformResult( hit: ptr<function, ${Zt}>, objectIndex: u32 ) -> void {

				let toLocal = ${r}[ objectIndex ].inverseMatrixWorld;
				hit.normal = normalize( ( transpose( toLocal ) * vec4f( hit.normal, 0.0 ) ).xyz );
				hit.objectIndex = objectIndex;

			}
		`,resetShapeFn:C`
			fn resetRayScalar( objectIndex: u32 ) -> void {

				${i} = 1.0;

			}
		`})}function Wu(s){let{storage:e,structs:t}=s,r=t.attributes.membersLayout.map(({name:i})=>`result.${i} = a0.${i} * barycoord.x + a1.${i} * barycoord.y + a2.${i} * barycoord.z;`).join(`
`);return C`
		// fn
		fn bvh_sampleTrianglePoint( barycoord: vec3f, indices: vec3u ) -> ${t.attributes} {

			var result: ${t.attributes};
			var a0 = ${e.attributes}[ indices.x ];
			var a1 = ${e.attributes}[ indices.y ];
			var a2 = ${e.attributes}[ indices.z ];
			${r}
			return result;

		}
	`}function Gu(s){let{index:e,attributes:t,transforms:r}=s.storage,i=Rc().toVar("bvh_toWorldMat");return s.getShapecastFn({name:"bvh_ClosestPointToPoint",shapeStruct:"vec3f",resultStruct:Ji,boundsOrderFn:C`
			fn cppBoundsOrder( shape: vec3f, splitAxis: u32, node: ${He} ) -> bool {

				let toWorld = ${i};

				// get center
				let bMin = vec3f( node.bounds.min[ 0 ], node.bounds.min[ 1 ], node.bounds.min[ 2 ] );
				let bMax = vec3f( node.bounds.max[ 0 ], node.bounds.max[ 1 ], node.bounds.max[ 2 ] );
				let center = bMin * 0.5 + bMax * 0.5;

				// determine the order in world space
				let worldCenter = ( toWorld * vec4f( center, 1.0 ) ).xyz;
				let worldAxis = normalize( toWorld[ splitAxis ].xyz );
				return dot( shape - worldCenter, worldAxis ) <= 0.0;

			}
		`,intersectsBoundsFn:C`
			fn cppIntersectsBounds( shape: vec3f, bounds: ${et}, result: ptr<function, ${Ji}> ) -> u32 {

				// return 1u;
				// we need to check this no matter what if the result has not been found yet
				if ( ! result.found ) {

					return 1u;

				}

				let toWorld = ${i};

				// transform to world space
				let bMin = vec3f( bounds.min[ 0 ], bounds.min[ 1 ], bounds.min[ 2 ] );
				let bMax = vec3f( bounds.max[ 0 ], bounds.max[ 1 ], bounds.max[ 2 ] );
				let center = ( bMin + bMax ) * 0.5;
				let halfExtent = ( bMax - bMin ) * 0.5;
				let worldCenter = ( toWorld * vec4f( center, 1.0 ) ).xyz;
				let worldHalfExtent =
					abs( toWorld[ 0 ].xyz ) * halfExtent.x +
				    abs( toWorld[ 1 ].xyz ) * halfExtent.y +
				    abs( toWorld[ 2 ].xyz ) * halfExtent.z;
				let worldMin = worldCenter - worldHalfExtent;
				let worldMax = worldCenter + worldHalfExtent;

				// intersect if the distance to the bounds is not bigger than the already found
				let d = shape - clamp( shape, worldMin, worldMax );
				return select( 0u, 1u, dot( d, d ) < result.distanceSq );

			}
		`,intersectRangeFn:C`
			fn cppIntersectsRange( shape: vec3f, offset: u32, count: u32, result: ptr<function, ${Ji}> ) -> bool {

				var didHit = false;
				let toWorld = ${i};

				for ( var i = offset; i < offset + count; i ++ ) {

					// transform the triangle to world space
					let i0 = ${e}[ i * 3u + 0u ];
					let i1 = ${e}[ i * 3u + 1u ];
					let i2 = ${e}[ i * 3u + 2u ];
					let a = ( toWorld * vec4f( ${t}[ i0 ].position.xyz, 1.0 ) ).xyz;
					let b = ( toWorld * vec4f( ${t}[ i1 ].position.xyz, 1.0 ) ).xyz;
					let c = ( toWorld * vec4f( ${t}[ i2 ].position.xyz, 1.0 ) ).xyz;

					let barycoord = ${Vu}( shape, a, b, c );
					let closestPoint = barycoord.x * a + barycoord.y * b + barycoord.z * c;
					let delta = shape - closestPoint;
					let distSq = dot( delta, delta );

					// copy the content over
					if ( ! result.found || distSq < result.distanceSq ) {

						let normal = normalize( cross( a - b, b - c ) );

						result.closestPoint = closestPoint;
						result.barycoord = barycoord;
						result.distanceSq = distSq;
						result.faceNormal = normal;
						result.side = sign( dot( normal, delta ) );
						result.faceIndices = vec4u( i0, i1, i2, i );
						result.found = true;
						didHit = true;

					}

				}

				return didHit;

			}
		`,resetShapeFn:C`
				fn cppResetShape( objectIndex: u32 ) -> void {

					// node bounds are transformed by "toWorld" during the bounds tests. Only the
					// object-local BLAS bounds need the object's world matrix - the top-level bounds
					// are already in world space - so restore identity before top-level traversal resumes.
					${i} = mat4x4f(
						1.0, 0.0, 0.0, 0.0,
						0.0, 1.0, 0.0, 0.0,
						0.0, 0.0, 1.0, 0.0,
						0.0, 0.0, 0.0, 1.0
					);

				}
			`,transformShapeFn:C`
			fn cppTransformShape( shape: ptr<function, vec3f>, objectIndex: u32 ) -> void {

				${i} = ${r}[ objectIndex ].matrixWorld;

			}
		`,transformResultFn:C`
			fn cppTransformResult( result: ptr<function, ${Ji}>, objectIndex: u32 ) -> void {

				result.objectIndex = objectIndex;

			}
		`})}var on=24,Ua=(1<<on)-1,ju=31-on,Nh=(1<<ju)-1,Va=new k,Ha=new xe,nn=new k,go=class extends ei{constructor(e,t){super(),t={getBVH:(n,a)=>{throw new Error("ClusteredBVH: getBVH callback must be provided ")},shouldCluster:n=>n.isSkinnedMesh||n.isInstancedMesh||n.isBatchedMesh,primitiveLimit:64,matrixWorld:Array.isArray(e)?new k:e.matrixWorld,includeInstances:!0,_strictLeafSize:1,...t};let r=Array.from(Yu(e)),i=Math.ceil(Math.log2(r.length)),o=(1<<i)-1;this.objects=r,this.getBVH=t.getBVH,this.shouldCluster=t.shouldCluster,this.includeInstances=t.includeInstances,this.primitiveLimit=t.primitiveLimit,this.matrixWorld=t.matrixWorld,this.bvhMap=new WeakMap,this.idBits=i,this.idMask=o,this.primitiveBufferStride=2,this.init(t)}init(e){let t=0,{objects:r,bvhMap:i,matrixWorld:o}=this;Va.copy(o).invert(),r.forEach(n=>{let a=[];for(let l=0,f=this._getInstanceCount(n);l<f;l++){let c=this.getBVH(n,l);a.push(c),c&&(t+=this.shouldCluster(n)?c._roots.length:this._countRelevantLeafNodes(c))}i.set(n,a)}),this.primitiveBuffer=new Uint32Array(t*2),this._fillPrimitiveBuffer(this.primitiveBuffer),super.init(e)}getRootRanges(){return[{offset:0,count:this.primitiveBuffer.length/this.primitiveBufferStride}]}refit(...e){Va.copy(this.matrixWorld).invert(),super.refit(...e)}writePrimitiveBounds(e,t,r){let{primitiveBuffer:i,bvhMap:o,objects:n}=this,a=i[2*e+0],l=i[2*e+1],f=n[this.getObjectId(a)],c=this.getInstanceId(a),u=o.get(f)[c],p=this.getBVHRootIndex(l),d=this.getBVHNodeIndex(l);f.isInstancedMesh||f.isBatchedMesh?(f.getMatrixAt(c,nn),nn.premultiply(f.matrixWorld)):nn.copy(f.matrixWorld),nn.premultiply(Va),ie(d,new Float32Array(u._roots[p]),Ha),Ha.applyMatrix4(nn);let{min:h,max:g}=Ha;t[r+0]=h.x,t[r+1]=h.y,t[r+2]=h.z,t[r+3]=g.x,t[r+4]=g.y,t[r+5]=g.z}getInstanceId(e){let{idMask:t,idBits:r}=this;return(e&~t)>>>r}getObjectId(e){let{idMask:t}=this;return e&t}getBVHRootIndex(e){return e>>>on}getBVHNodeIndex(e){return(e&Ua)*8}_getInstanceCount(e){let{includeInstances:t}=this;return e.isInstancedMesh&&t?e.count:e.isBatchedMesh&&t?e.instanceCount:1}_fillPrimitiveBuffer(e){let{objects:t,bvhMap:r,idBits:i,primitiveLimit:o}=this,n=0,a=(l,f,c,u)=>{if(u>Ua)throw new Error(`ClusteredBVH: cluster node index ${u} exceeds the ${on}-bit packing limit and cannot be represented.`);if(c>Nh)throw new Error(`ClusteredBVH: bvh root index ${c} exceeds the ${ju}-bit packing limit and cannot be represented.`);e[2*n+0]=l<<i|f,e[2*n+1]=c<<on|u&Ua,n++};t.forEach((l,f)=>{r.get(l).forEach((c,u)=>{if(c)if(this.shouldCluster(l))for(let p=0,d=c._roots.length;p<d;p++)a(u,f,p,0);else qu(c,o,(p,d)=>{a(u,f,p,d/8)})})})}_countRelevantLeafNodes(e){let{primitiveLimit:t}=this,r=0;return qu(e,t,(i,o,n,a)=>{r++,a&&n>=t&&console.warn(`ClusteredBVH: a leaf node with ${n} primitives exceeds the cluster primitive limit of ${t} and cannot be subdivided further.`)}),r}};function qu(s,e,t){let r=s._roots.length;for(let i=0;i<r;i++)yt.setBVH(s,i),yt.traverseBuffer((o,n,a)=>{let l=yt.getRangeStart(a),c=yt.getRangeEnd(a)-l;return c<e||n?(t(i,a,c,n),!0):!1});yt.reset()}function Yu(s,e=new Set){return Array.isArray(s)?s.forEach(t=>Yu(t,e)):s.traverse(t=>{t.isMesh&&e.add(t)}),e}var Ir=new k,xo=new k,Fh={start:0,count:0,vertexStart:0,vertexCount:0};function Mh(s){let e=s;for(;e;){if(e.visible===!1)return!1;e=e.parent}return!0}function Ku(s){return s._roots.reduce((e,t)=>e+t.byteLength,0)}function Xu(s,e){return`${s}_${e}`}var yo=class{constructor(e,t={}){let{attributes:r={position:"vec4f"},autogenerateBvh:i=!0}=t;Array.isArray(e)||(e=[e]),e=e.map(o=>{if(o.isObject3D)return o;if(o.isBufferGeometry)return new mr(o);if(o instanceof Ft){let n=new mr;return n.geometry.boundsTree=o,n}}),this._bvhCache=new Map,this.autogenerateBvh=i,this.attributes=r,this.objects=e,this.bvh=null,this.storage=new sn,this.structs=new sn({transform:Du}),this.fns=new sn({raycastFirstHit:Hu(this),closestPointToPoint:Gu(this),sampleTrianglePoint:null},Y)}getRootObject(){let{objects:e}=this;if(e.isObject3D)return e;Array.isArray(e)||(e=[e]),e=e.map(r=>{if(r.isObject3D)return r;if(r.isBufferGeometry)return new mr(r);if(r instanceof Ft){let i=new mr;return i.geometry.boundsTree=r,i}});let t=new dc;return t.children=e,t}getShapecastFn(e){return Uu(this,e)}update(){let e=this.getRootObject(),t=0;e.traverse(E=>{E.isMesh&&t++}),this.bvh=new go(e,{strategy:2,getBVH:(E,Ye)=>this.getBVH(E,Ye,Fh),primitiveLimit:t<3?1/0:64}),this.dispose();let{attributes:r,structs:i,bvh:o}=this,n=[],a=[],l=new Map,f=Ku(o),c=0,u=0,p=[],d=0,h=this._getTransformMap(o),{primitiveBuffer:g,primitiveBufferStride:x}=o;for(let E=0,Ye=g.length;E<Ye;E+=x){let Oe=g[E],gt=g[E+1],Rt=o.objects[o.getObjectId(Oe)],ki=o.getInstanceId(Oe),Oi={start:0,count:0,vertexStart:0,vertexCount:0},Lr=this.getBVH(Rt,ki,Oi);if(!Lr)throw new Error("BVHComputeData: BVH not found.");let Fe=n.find(Or=>Or.bvh===Lr);Fe||(Fe={index:n.length,bvh:Lr,range:Oi,geometryOffset:0},c+=Fe.range.count,u+=Fe.range.vertexCount,n.push(Fe));let fr=o.getBVHRootIndex(gt),kr=o.getBVHNodeIndex(gt)/8,Dn=`${Fe.index}_${fr}_${kr}`,pr=l.get(Dn);if(pr===void 0){let Or=Fu(Lr._roots[fr],kr);pr={data:Fe,root:fr,node:kr,size:Or,base:0},l.set(Dn,pr),a.push(pr),f+=Or*32,d=Math.max(d,Ea(Lr._roots[fr],kr))}p.push({transformSlot:h.get(Xu(Oe,fr)).slot,subtree:pr})}if(Ea(o._roots[0])+d-1>rn.value)throw new Error("BVHComputeData: BVH depth overruns the compute stack depth.");let v=Math.max(h.size,2);c=Math.max(c,2),u=Math.max(u,2);let y=new Q(r,"bvh_GeometryStruct"),w=0,S=0,T=new Uint32Array(c),I=new ArrayBuffer(u*y.getLength()*4),A=new ArrayBuffer(f);n.forEach(E=>{E.geometryOffset=S/3,E.bvh.indirect||(E.geometryOffset-=E.range.start/3),Lu(E.bvh,E.range,w,S,T),ku(E.bvh,E.range,w,I,y,this),S+=E.range.count,w+=E.range.vertexCount});let _=Ku(o)/32;a.forEach(E=>{E.base=_,Eu(E.data.bvh._roots[E.root],E.node,E.size,E.data.geometryOffset,_,A),_+=E.size}),p.forEach(E=>E.nodeOffset=E.subtree.base),Ma(o,p,0,A);let B=new ArrayBuffer(i.transform.getLength()*v*4),P=O(new L(new Uint32Array(A),1),He).toReadOnly().setName("bvh_nodes"),R=new L(new Uint32Array(B),1),D=O(R,i.transform).toReadOnly().setName("bvh_transforms"),M=O(new L(T,1),"uint").toReadOnly().setName("bvh_index"),W=O(new L(new Uint32Array(I),y.getLength()),y).toReadOnly().setName("bvh_attributes");this.storage.transforms=D,this.storage.nodes=P,this.storage.index=M,this.storage.attributes=W,this.structs.attributes=y,xo.copy(o.matrixWorld).invert(),h.forEach(E=>{this.writeTransformData(E,xo,E.slot,B)}),this.fns.sampleTrianglePoint=Wu(this),this._bvhCache.clear()}updateTransforms(){let{bvh:e,storage:t}=this;e.refit();let r=t.nodes.proxyNode.value;Ma(e,null,0,r.array.buffer),r.needsUpdate=!0;let i=t.transforms.proxyNode.value,o=i.array.buffer;xo.copy(e.matrixWorld).invert(),this._getTransformMap(e).forEach(n=>{this.writeTransformData(n,xo,n.slot,o)}),i.needsUpdate=!0}writeTransformData(e,t,r,i){let{structs:o}=this,n=new Float32Array(i),a=new Uint32Array(i),{object:l,instanceId:f}=e;l.isInstancedMesh||l.isBatchedMesh?(l.getMatrixAt(f,Ir),Ir.premultiply(l.matrixWorld)):Ir.copy(l.matrixWorld),Ir.premultiply(t),Ir.toArray(n,r*o.transform.getLength()),Ir.invert(),Ir.toArray(n,r*o.transform.getLength()+16);let c=Mh(l);l.isBatchedMesh&&(c=c&&l.getVisibleAt(f)),a[r*o.transform.getLength()+32]=c?1:0}getBVH(e,t,r){let{autogenerateBvh:i,_bvhCache:o}=this,n=null;if(e.boundsTree||e.isSkinnedMesh){let a=e.geometry;if(r.count=a.index?a.index.count:a.attributes.position.count,r.vertexCount=a.attributes.position.count,n=e.boundsTree||null,n===null&&i){let l=e.uuid;n=o.get(l)||new vt(e),o.set(l,n)}}else if(e.isBatchedMesh){let a=e.getGeometryIdAt(t),l=e.getGeometryRangeAt(a);if(Object.assign(r,l),n=e.boundsTrees[a]||null,n===null&&i){let f=`batched_${e.geometry.uuid}_${l.start}_${l.count}`;n=o.get(f)||new Et(e.geometry,{range:{...r}}),o.set(f,n)}}else{let a=e.geometry;if(r.count=a.index?a.index.count:a.attributes.position.count,r.vertexCount=a.attributes.position.count,n=e.geometry.boundsTree||null,n===null&&i){let l=a.uuid;n=o.get(l)||new Et(a),o.set(l,n)}}return n}getDefaultAttributeValue(e,t){switch(e){case"position":case"color":t.set(1,1,1,1);break;default:t.set(0,0,0,0)}return t}dispose(){let{storage:e}=this;for(let t in e)e[t].value?.dispose()}_getTransformMap(e){let{primitiveBuffer:t,primitiveBufferStride:r}=e,i=new Map;for(let o=0,n=t.length;o<n;o+=r){let a=t[o],l=e.getBVHRootIndex(t[o+1]),f=Xu(a,l);if(i.has(f))continue;let c=i.size,u=e.objects[e.getObjectId(a)],p=e.getInstanceId(a);i.set(f,{object:u,instanceId:p,compositeId:a,root:l,slot:c})}return i}},sn=class{constructor(e={},t=Z){let r={};return new Proxy({...e},{get(i,o){return r[o]||(r[o]=t(o,i)),r[o]},set(i,o,n){return i[o]=n,!0}})}};var Eh=new bc(-1,1,1,-1,0,1),Wa=class extends Ln{constructor(){super(),this.setAttribute("position",new oa([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new oa([0,2,0,0,2,0],2))}},Lh=new Wa,kt=class{constructor(e){this._mesh=new mr(Lh,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Eh)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var vo=$(`
	fn sampleTexel( tex: texture_2d<f32>, coord: vec2f ) -> vec4f {

		// Manual bilinear filtering using textureLoad to support filterable float32 textures
		// on all devices
		let size = vec2f( textureDimensions( tex, 0 ) );

		// the path tracer stores its color rows top down
		let pxCoord = vec2f( coord.x, 1.0 - coord.y ) * size - 0.5;
		let px = vec2i( floor( pxCoord ) );
		let fr = fract( pxCoord );

		// get the four sibling samples
		let s00 = textureLoad( tex, clamp( px,                 vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s10 = textureLoad( tex, clamp( px + vec2i( 1, 0 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s01 = textureLoad( tex, clamp( px + vec2i( 0, 1 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s11 = textureLoad( tex, clamp( px + vec2i( 1, 1 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );

		// interpolate on the x axis
		let y0 = mix( s00, s10, fr.x );
		let y1 = mix( s01, s11, fr.x );

		// then y
		return mix( y0, y1, fr.y );

	}
`),bo=class extends Ht{get texture(){return this._texNode.value}set texture(e){this._texNode.value=e}get fromTexture(){return this._fromTexNode.value}set fromTexture(e){this._fromTexNode.value=e}get toneMapping(){return this._toneMapping.toneMapping}set toneMapping(e){this._toneMapping.setToneMapping(e)}get transition(){return this._transitionUniform.value}set transition(e){this._transitionUniform.value=e}get exposure(){return this._toneMapping.exposureNode.value}set exposure(e){this._toneMapping.exposureNode.value=e}constructor(e){super();let t=he(new ue);this._texNode=t;let r=he(new ue);this._fromTexNode=r;let i=Gt(Wt()),o=N(1);this._transitionUniform=o;let n=C`
			fn fade( uv: vec2f ) -> vec4f {

				if ( ${o} <= 0.0 ) {

					return ${vo}( ${r}, uv );

				} else if ( ${o} >= 1.0 ) {

					return ${vo}( ${t}, uv );

				} else {

					let col0 = ${vo}( ${r}, uv );
					let col1 = ${vo}( ${t}, uv );
					return mix( col0, col1, ${o} );

				}

			}
		`,a=Mc($t,1,n(i));this._toneMapping=a,this.transparent=!0,this.colorNode=Wr(a.rgb,a.a),this.setValues(e)}};var Ga=C`
	fn debugHeatColor( t: f32 ) -> vec3f {

		let r = clamp( 1.5 - abs( 4.0 * t - 3.0 ), 0.0, 1.0 );
		let g = clamp( 1.5 - abs( 4.0 * t - 2.0 ), 0.0, 1.0 );
		let b = clamp( 1.5 - abs( 4.0 * t - 1.0 ), 0.0, 1.0 );
		return vec3f( r, g, b );

	}
`,wo=new Q({tlasCount:"uint",blasCount:"uint",didHit:"bool",dist:"float"},"DebugBoundsResult");function Qu(s){let{transforms:e,index:t,attributes:r,materials:i}=s.storage,o=N(new k),n=N(new k),a=N(1),l=N(1),f=N(0),c=N(64),u=at(0).toVar("bvh_debugBoundsLevel"),p=Ue(1).toVar("bvh_debugRayScalar"),d=Ue(0).toVar("bvh_debugMaterialSide"),h=C`
		fn debugGetBoundsOrder( ray: ${z}, splitAxis: u32, node: ${He} ) -> bool {

			return ray.direction[ splitAxis ] >= 0.0;

		}
	`,g=C`
		fn debugIntersectsBounds( ray: ${z}, bounds: ${et}, result: ptr<function, ${wo}> ) -> u32 {

			let boundsMin = vec3( bounds.min[ 0 ], bounds.min[ 1 ], bounds.min[ 2 ] );
			let boundsMax = vec3( bounds.max[ 0 ], bounds.max[ 1 ], bounds.max[ 2 ] );

			let invDir = 1.0 / ray.direction;
			let tMinPlane = ( boundsMin - ray.origin ) * invDir;
			let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

			let tMinHit = min( tMinPlane, tMaxPlane );
			let tMaxHit = max( tMinPlane, tMaxPlane );

			let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
			let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

			let dist = max( t0, 0.0 );
			if ( t1 < dist ) {

				return 0u;

			} else if ( result.didHit && dist * ${p} >= result.dist ) {

				return 0u;

			}

			if ( ${u} == 1u ) {

				result.blasCount = result.blasCount + 1u;

			} else {

				result.tlasCount = result.tlasCount + 1u;

			}

			return 1u;

		}
	`,x=C`
		fn debugIntersectRange( ray: ${z}, offset: u32, count: u32, result: ptr<function, ${wo}> ) -> bool {

			var didHit = false;
			if ( ${f} > 0.5 ) {

				for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

					let i0 = ${t}[ ti * 3u ];
					let i1 = ${t}[ ti * 3u + 1u ];
					let i2 = ${t}[ ti * 3u + 2u ];

					let a = ${r}[ i0 ].position.xyz;
					let b = ${r}[ i1 ].position.xyz;
					let c = ${r}[ i2 ].position.xyz;

					var triResult = ${Na}( ray, a, b, c );
					triResult.dist *= ${p};
					if ( triResult.didHit && ( ! result.didHit || triResult.dist < result.dist ) ) {

						// cull faces that don't match the material side
						if ( ${d} != 0.0 && triResult.side != ${d} ) {

							continue;

						}

						result.didHit = true;
						result.dist = triResult.dist;
						didHit = true;

					}

				}

			}

			return didHit;

		}
	`,b=C`
		fn debugTransformRay( ray: ptr<function, ${z}>, objectIndex: u32 ) -> void {

			let object = ${e}[ objectIndex ];
			let toLocal = object.inverseMatrixWorld;
			ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
			ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

			let len = length( ray.direction );
			ray.direction = ray.direction / len;
			${p} = 1.0 / len;

			${d} = ${i}[ object.materialIndex ].side;
			${u} = 1u;

		}
	`,m=C`
		fn debugResetLevel( objectIndex: u32 ) -> void {

			${p} = 1.0;
			${u} = 0u;

		}
	`,v=s.getShapecastFn({name:"debugBoundsCount",shapeStruct:z,resultStruct:wo,boundsOrderFn:h,intersectsBoundsFn:g,intersectRangeFn:x,transformShapeFn:b,resetShapeFn:m}),y=C`
		fn debugBounds( vUv: vec2f ) -> vec4f {

			let ndc = vUv * 2.0 - vec2f( 1.0 );
			var ray = ${er}( ndc, ${o} * ${n} );
			ray.direction = normalize( ray.direction );

			// count the boxes the ray crosses, pruning those behind the nearest hit surface
			var result: ${wo};
			${v}( ray, &result );

			let tlas = select( 0u, result.tlasCount, ${a} > 0.5 );
			let blas = select( 0u, result.blasCount, ${l} > 0.5 );
			let count = tlas + blas;

			let t = clamp( f32( count ) / max( ${c}, 1.0 ), 0.0, 1.0 );

			return vec4f( ${Ga}( t ), 1.0 );

		}
	`;return y.uniforms={cameraToModelMatrix:o,inverseProjectionMatrix:n,displayTLAS:a,displayBLAS:l,stopAtSurface:f,saturationCount:c},y}var ne=class{get computeNode(){return this.kernel.computeNode}get workgroupSize(){return this.kernel.workgroupSize}set needsUpdate(e){this.setWorkgroupSize(...this.workgroupSize)}constructor(e,t={}){let{workgroupSize:r=[64],context:i={}}=t;this._fn=e,this.kernel=null,this.context=i,this.setWorkgroupSize(...r)}defineUniformAccessors(e){for(let t in e){if(t in this)throw new Error(`ComputeNode: Uniform name ${t} is already defined.`);"value"in e[t]&&Object.defineProperty(this,t,{get(){return e[t].value},set(i){e[t].value=i}})}}setWorkgroupSize(e=64,t=1,r=1){let i=this._fn.context(this.context);return i.parameters=this._fn.parameters,this.kernel?.dispose(),this.kernel=i.computeKernel([e,t,r]),this}dispose(){this.kernel?.dispose(),this.kernel=null}getDispatchSize(e=1,t=1,r=1,i=[]){let[o,n,a]=this.workgroupSize;return i.length=3,i[0]=Math.ceil(e/o),i[1]=Math.ceil(t/n),i[2]=Math.ceil(r/a),i}};var Zu=at(256*256),ef=Ue(1/16777216),kh=xr(`

	const SOBOL_DIRECTIONS_1 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0xa0000000u, 0xf0000000u,
		0x88000000u, 0xcc000000u, 0xaa000000u, 0xff000000u,
		0x80800000u, 0xc0c00000u, 0xa0a00000u, 0xf0f00000u,
		0x88880000u, 0xcccc0000u, 0xaaaa0000u, 0xffff0000u,
		0x80008000u, 0xc000c000u, 0xa000a000u, 0xf000f000u,
		0x88008800u, 0xcc00cc00u, 0xaa00aa00u, 0xff00ff00u,
		0x80808080u, 0xc0c0c0c0u, 0xa0a0a0a0u, 0xf0f0f0f0u,
		0x88888888u, 0xccccccccu, 0xaaaaaaaau, 0xffffffffu
	);

	const SOBOL_DIRECTIONS_2 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0x60000000u, 0x90000000u,
		0xe8000000u, 0x5c000000u, 0x8e000000u, 0xc5000000u,
		0x68800000u, 0x9cc00000u, 0xee600000u, 0x55900000u,
		0x80680000u, 0xc09c0000u, 0x60ee0000u, 0x90550000u,
		0xe8808000u, 0x5cc0c000u, 0x8e606000u, 0xc5909000u,
		0x6868e800u, 0x9c9c5c00u, 0xeeee8e00u, 0x5555c500u,
		0x8000e880u, 0xc0005cc0u, 0x60008e60u, 0x9000c590u,
		0xe8006868u, 0x5c009c9cu, 0x8e00eeeeu, 0xc5005555u
	);

	const SOBOL_DIRECTIONS_3 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0x20000000u, 0x50000000u,
		0xf8000000u, 0x74000000u, 0xa2000000u, 0x93000000u,
		0xd8800000u, 0x25400000u, 0x59e00000u, 0xe6d00000u,
		0x78080000u, 0xb40c0000u, 0x82020000u, 0xc3050000u,
		0x208f8000u, 0x51474000u, 0xfbea2000u, 0x75d93000u,
		0xa0858800u, 0x914e5400u, 0xdbe79e00u, 0x25db6d00u,
		0x58800080u, 0xe54000c0u, 0x79e00020u, 0xb6d00050u,
		0x800800f8u, 0xc00c0074u, 0x200200a2u, 0x50050093u
	);

	const SOBOL_DIRECTIONS_4 = array<u32, 32>(
		0x80000000u, 0x40000000u, 0x20000000u, 0xb0000000u,
		0xf8000000u, 0xdc000000u, 0x7a000000u, 0x9d000000u,
		0x5a800000u, 0x2fc00000u, 0xa1600000u, 0xf0b00000u,
		0xda880000u, 0x6fc40000u, 0x81620000u, 0x40bb0000u,
		0x22878000u, 0xb3c9c000u, 0xfb65a000u, 0xddb2d000u,
		0x78022800u, 0x9c0b3c00u, 0x5a0fb600u, 0x2d0ddb00u,
		0xa2878080u, 0xf3c9c040u, 0xdb65a020u, 0x6db2d0b0u,
		0x800228f8u, 0x400b3cdcu, 0x200fb67au, 0xb00ddb9du
	);

`),tf=at(0).toVar("sobolPixelIndex"),rf=at(0).toVar("sobolPathIndex"),qa=at(0).toVar("sobolBounceIndex"),_o=$(`
	fn getMaskedSobol( index: u32, directions: array<u32, 32> ) -> u32 {

		var X = 0u;
		for ( var bit = 0u; bit < 32u; bit ++ ) {

			let mask = ( index >> bit ) & 1u;
			X ^= mask * directions[ bit ];

		}
		return X;

	}
`),Oh=(s=1)=>{if(s<=0)return;let e=s>1?`vec${s}u`:"u32",t=$(`
		fn sobolReverseBits_${e}( in: ${e} ) -> ${e} {

			var x = in;
			x = ( ( ( x & ${e}( 0xaaaaaaaau ) ) >> ${e}( 1 ) ) | ( ( x & ${e}( 0x55555555u ) ) << ${e}( 1 ) ) );
			x = ( ( ( x & ${e}( 0xccccccccu ) ) >> ${e}( 2 ) ) | ( ( x & ${e}( 0x33333333u ) ) << ${e}( 2 ) ) );
			x = ( ( ( x & ${e}( 0xf0f0f0f0u ) ) >> ${e}( 4 ) ) | ( ( x & ${e}( 0x0f0f0f0fu ) ) << ${e}( 4 ) ) );
			x = ( ( ( x & ${e}( 0xff00ff00u ) ) >> ${e}( 8 ) ) | ( ( x & ${e}( 0x00ff00ffu ) ) << ${e}( 8 ) ) );
			return ( ( x >> ${e}( 16 ) ) | ( x << ${e}( 16 ) ) );

		}
	`),r=$(`
		fn sobolHashCombine_${e}( seed: u32, v: ${e} ) -> ${e} {

			return ${e}( seed ) ^ ( v + ${e}( ( seed << 6 ) + ( seed >> 2 ) ) );

		}
	`),i=$(`
		fn sobolLaineKarrasPermutation_${e}( in: ${e}, seed: ${e} ) -> ${e} {

			var x = in;
			x += seed;
			x ^= x * 0x6c50b47cu;
			x ^= x * 0xb82f1e52u;
			x ^= x * 0xc7afe638u;
			x ^= x * 0x8d22f6e6u;
			return x;

		}
	`),o=C`
		fn nestedUniformScrambleBase2_${e}( x: ${e}, seed: ${e} ) -> ${e} {

			var res = ${i}( x, seed );
			res = ${t}( res );
			return res;

		}
	`;return{reverseBits:t,hashCombine:r,lkPermutation:i,scramble:o}},ct=Array.from({length:5},(s,e)=>Oh(e)),zh=C`
	${[kh]}
	fn generateSobolPoint( id: u32 ) -> vec4f {

		var index = id;
		if ( index >= ${Zu} ) {

			index = index % ${Zu};
			// return vec4( 0.0 );

		}

		// NOTE: this sobol "direction" is also available but we can't write out 5 components
		// uint x = index & 0x00ffffffu;
		let x = ${ct[1].reverseBits}( ${_o}( index, SOBOL_DIRECTIONS_1 ) ) & 0x00ffffffu;
		let y = ${ct[1].reverseBits}( ${_o}( index, SOBOL_DIRECTIONS_2 ) ) & 0x00ffffffu;
		let z = ${ct[1].reverseBits}( ${_o}( index, SOBOL_DIRECTIONS_3 ) ) & 0x00ffffffu;
		let w = ${ct[1].reverseBits}( ${_o}( index, SOBOL_DIRECTIONS_4 ) ) & 0x00ffffffu;

		return vec4( f32( x ), f32( y ), f32( z ), f32( w ) ) * ${ef};

	}
`,Ju=$(`
	fn sobolHash( in: u32 ) -> u32 {

		var x = in;
		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}
`),Uh=C`
	fn sobolGetSeed( effect: u32 ) -> u32 {

		return ${Ju}(
			${ct[1].hashCombine}(
				${ct[1].hashCombine}(
					${Ju}( ${qa} ),
					${tf}
				),
				effect
			)
		);

	}
`,To=(s=1,e=zh)=>{if(s<=0)return;let t=s>1?`vec${s}u`:"u32",r=s>1?`vec${s}f`:"f32",i=".r",o="1u";return s===2?(i=".rg",o="vec2( 1u, 2u )"):s===3?(i=".rgb",o="vec3( 1u, 2u, 3u )"):s===4&&(i="",o="vec4( 1u, 2u, 3u, 4u )"),C`
		fn sobol${s}( effect: u32 ) -> ${r} {

			let seed = ${Uh}( effect );
			let index = ${rf};

			let shuffle_seed = ${ct[1].hashCombine}( seed, 0u );
			let shuffled_index = ${ct[1].scramble}( ${ct[1].reverseBits}( index ), shuffle_seed );
			let sobol_pt = ${e}( shuffled_index )${i};
			var result = ${t}( sobol_pt * 16777216.0 );

			let seed2 = ${ct[s].hashCombine}( seed, ${o} );
			result = ${ct[s].scramble}( result, seed2 );

			return ${ef} * ${r}( result >> ${t}( 8 ) );

		}
	`},nf=To(1),of=To(2),sf=To(3),So=To(4),Io=C`
	fn sobolInit( pixel: vec2u, pathIndex: u32, bounceIndex: u32 ) -> void {

		${tf} = ( pixel.x << 16 ) | pixel.y;
		${rf} = pathIndex;
		${qa} = bounceIndex;

	}
`,Co=C`
	fn sobolNextBounce() -> void {

		${qa}++;

	}
`;var Po=0,Ao=1,af=2,Bo=3,lf=4,Ro=5,$o=6,Do=7,No=50,ut=Tr("random.rngInit",Io),ja=Tr("random.rngNextBounce",Co),wt=Tr("random.rand1",nf),ft=Tr("random.rand2",of),si=Tr("random.rand3",sf),kv=Tr("random.rand4",So);var K=xr(`

	const PI: f32 = 3.141592653589793;
	const EPSILON: f32 = 1e-5;
	const MIN_ROUGHNESS: f32 = 1e-3;
	const MIN_INCIDENT_COS: f32 = 1e-3;

`),Ot=new Q({color:"vec3f",isTransmissive:"bool",direction:"vec3f",pdf:"float"},"ScatterRecord"),Ya=new Q({reflectance:"vec3f",transmittance:"vec3f",reflectProbability:"float"},"TransmissionFresnel"),cf=new Q({color:"vec3",map:"int",metalness:"float",metalnessMap:"int",roughness:"float",roughnessMap:"int",ior:"float",transmission:"float",transmissionMap:"int",emissiveIntensity:"float",emissive:"vec3",emissiveMap:"int",normalMap:"int",normalScale:"vec2",clearcoat:"float",clearcoatMap:"int",clearcoatNormalMap:"int",clearcoatNormalScale:"vec2",clearcoatRoughness:"float",clearcoatRoughnessMap:"int",iridescenceMap:"int",iridescenceThicknessMap:"int",iridescence:"float",iridescenceIor:"float",iridescenceThicknessMinimum:"float",iridescenceThicknessMaximum:"float",diffuseRoughness:"float",dispersion:"float",specularColor:"vec3",specularColorMap:"int",specularIntensity:"float",specularIntensityMap:"int",thinWall:"int",attenuationColor:"vec3",attenuationDistance:"float",alphaMap:"int",castShadow:"int",opacity:"float",alphaTest:"float",side:"float",matte:"int",sheen:"float",sheenColor:"vec3",sheenColorMap:"int",sheenRoughness:"float",sheenRoughnessMap:"int",vertexColors:"int",flatShading:"int",transparent:"int",fogVolume:"int",anisotropy:"float",anisotropyRotation:"float",anisotropyMap:"int",mapTransform:"mat3",metalnessMapTransform:"mat3",roughnessMapTransform:"mat3",transmissionMapTransform:"mat3",emissiveMapTransform:"mat3",normalMapTransform:"mat3",clearcoatMapTransform:"mat3",clearcoatNormalMapTransform:"mat3",clearcoatRoughnessMapTransform:"mat3",sheenColorMapTransform:"mat3",sheenRoughnessMapTransform:"mat3",iridescenceMapTransform:"mat3",iridescenceThicknessMapTransform:"mat3",specularColorMapTransform:"mat3",specularIntensityMapTransform:"mat3",alphaMapTransform:"mat3",anisotropyMapTransform:"mat3"},"Material"),Ie=new Q({volumeParticle:"bool",faceNormal:"vec3f",frontFace:"bool",normal:"vec3f",normalBasis:"mat3x3f",normalInvBasis:"mat3x3f",eta:"f32",f0:"f32",roughness:"f32",diffuseRoughness:"f32",metalness:"f32",anisotropy:"f32",color:"vec3f",emission:"vec3f",opacity:"f32",ior:"f32",transmission:"f32",thinWall:"bool",attenuationColor:"vec3f",attenuationDistance:" f32",clearcoatNormal:"vec3f",clearcoatBasis:"mat3x3f",clearcoatInvBasis:"mat3x3f",clearcoat:"f32",clearcoatRoughness:"f32",sheen:"f32",sheenColor:"vec3f",sheenRoughness:"f32",iridescence:"f32",iridescenceIor:"f32",iridescenceThickness:"f32",specularColor:"vec3f",specularIntensity:"f32"},"SurfaceRecord"),Vv=new Q({rotation:"mat3x3f",intensity:"float",blur:"float",totalSum:"float"},"EnvironmentInfo"),Ka=new Q({color:"vec3f",direction:"vec3f",pdf:"float"},"EnvironmentSample"),zt=new Q({position:"vec3f",lightType:"int",color:"vec3f",intensity:"float",u:"vec3f",visibleToCameraRays:"int",v:"vec3f",area:"float",radius:"float",decay:"float",distance:"float",coneCos:"float",penumbraCos:"float",iesProfile:"int"},"Light"),We=new Q({dist:"float",direction:"vec3f",pdf:"float",emission:"vec3f",lightType:"int"},"LightRecord"),uf=new Q({diffuse:"float",specular:"float",transmission:"float",clearcoat:"float"},"LobeWeights"),Xa=new Q({V:"vec3f",L:"vec3f",H:"vec3f",VdotH:"float"},"BxDFContext");var pf=$(`

	fn inverse(m: mat3x3f) -> mat3x3f {
		var adj: mat3x3f;
		adj[0][0] =   (m[1][1] * m[2][2] - m[2][1] * m[1][2]);
		adj[1][0] = - (m[1][0] * m[2][2] - m[2][0] * m[1][2]);
		adj[2][0] =   (m[1][0] * m[2][1] - m[2][0] * m[1][1]);
		adj[0][1] = - (m[0][1] * m[2][2] - m[2][1] * m[0][2]);
		adj[1][1] =   (m[0][0] * m[2][2] - m[2][0] * m[0][2]);
		adj[2][1] = - (m[0][0] * m[2][1] - m[2][0] * m[0][1]);
		adj[0][2] =   (m[0][1] * m[1][2] - m[1][1] * m[0][2]);
		adj[1][2] = - (m[0][0] * m[1][2] - m[1][0] * m[0][2]);
		adj[2][2] =   (m[0][0] * m[1][1] - m[1][0] * m[0][1]);

		let det = ( m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
			- m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
			+ m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]));

		return adj * ( 1.0 / det );
	}

`),df=$(`

	fn getBasisFromNormal( normal: vec3f ) -> mat3x3f {

		var other: vec3f;
		if ( abs( normal.x ) > 0.5 ) {

			other = vec3f( 0.0, 1.0, 0.0 );

		} else {

			other = vec3f( 1.0, 0.0, 0.0 );

		}

		let ortho = normalize( cross( normal, other ) );
		let ortho2 = normalize( cross( normal, ortho ) );
		return mat3x3f( ortho2, ortho, normal );

	}

`),Ge=$(`

	fn iorToF0( ior: f32 ) -> f32 {
		return pow( ( 1 - ior ) / ( 1 + ior ), 2 );
	}

`),hf=$(`

	fn iorToF0General( transmittedIor: f32, incidentIor: f32 ) -> f32 {

		return pow( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ), 2 );

	}

`),mf=$(`

	fn iorToF0GeneralVec( transmittedIor: vec3f, incidentIor: vec3f ) -> vec3f {

		let v = ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor );
		return v * v;

	}

`),gf=$(`

	fn fresnel0ToIor( f0: vec3f ) -> vec3f {

		let sqrtF0 = sqrt( f0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

`),_t=$(`

	fn schlickFresnel( cosine: f32, f0: f32 ) -> f32 {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

`),ai=$(`

	fn schlickFresnelVec( cosine: f32, f0: vec3f, f90: vec3f ) -> vec3f {

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

`),Mo=$(`

	fn totalInternalReflection( cosTheta: f32, eta: f32 ) -> bool {

		let sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > 1.0;

	}

`),xf=$(`

	fn totalInternalReflectionVec( cosTheta: f32, eta: vec3f ) -> vec3<bool> {

		let sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > vec3f( 1.0 );

	}

`),jv=$(`

	fn evaluateFresnel( cosine: f32, eta: f32, f0: vec3f, f90: vec3f ) -> vec3f {

		if ( totalInternalReflection( cosine, eta ) ) {

			return f90;

		}

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );
	}

`,[Mo]),Cr=$(`

	fn dielectricFresnel( cosThetaI: f32, eta: f32 ) -> f32 {

		// https://schuttejoe.github.io/post/disneybsdf/
		let ni = eta;
		let nt = 1.0;

		// Check for total internal reflection
		let sinThetaISq = 1.0 - cosThetaI * cosThetaI;
		let sinThetaTSq = eta * eta * sinThetaISq;
		if ( sinThetaTSq >= 1.0 ) {

			return 1.0;

		}

		let sinThetaT = sqrt( sinThetaTSq );
		let cosThetaT = sqrt( max( 0.0, 1.0 - sinThetaT * sinThetaT ) );
		let rParallel = ( ( nt * cosThetaI ) - ( ni * cosThetaT ) ) / ( ( nt * cosThetaI ) + ( ni * cosThetaT ) );
		let rPerpendicular = ( ( ni * cosThetaI ) - ( nt * cosThetaT ) ) / ( ( ni * cosThetaI ) + ( nt * cosThetaT ) );
		return ( rParallel * rParallel + rPerpendicular * rPerpendicular ) / 2.0;

	}

`),yf=$(`

	fn disneyFresnel( wo: vec3f, wi: vec3f, wh: vec3f, f0: f32, eta: f32, metalness: f32 ) -> f32 {

		let dotHV = dot( wo, wh );
		if ( totalInternalReflection( dotHV, eta ) ) {

			return 1.0;

		}

		let dotHL = dot( wi, wh );
		let dielectricF = dielectricFresnel( abs( dotHV ), eta );
		let metallicF = schlickFresnel( dotHL, f0 );

		return mix( dielectricF, metallicF, metalness );

	}

`,[Mo,Cr,_t]),li=$(`

	fn isTerminatingScatter( scatterRec: ScatterRecord ) -> bool {

		return scatterRec.pdf <= 0;

	}

`,[Ot]),Te=$(`

	fn clampPathContribution( contribution: vec3f, pathDepth: u32, clampDirect: f32, clampIndirect: f32 ) -> vec3f {

		let limit = select( clampIndirect, clampDirect, pathDepth <= 1u ) * 3.0;
		if ( limit <= 0.0 ) {

			return contribution;

		}

		let strength = dot( abs( contribution ), vec3f( 1.0 ) );
		if ( strength > limit ) {

			return contribution * ( limit / strength );

		}

		return contribution;

	}

`),ff=$(`

	fn applyWrap( v: f32, wrapMode: i32 ) -> f32 {

		var res = v;
		if ( wrapMode == 1 ) {

			// ClampToEdge
			res = clamp( res, 0.0, 1.0 );

		} else if ( wrapMode == 2 ) {

			// MirroredRepeat
			res = 1.0 - abs( 2.0 * fract( res * 0.5 ) - 1.0 );

		} else {

			// Repeat
			res = fract( res );

		}

		return res;

	}

`),tr=$(`

	fn offsetRayOrigin( point: vec3f, direction: vec3f, geometricNormal: vec3f ) -> vec3f {

		let normal = normalize( select( -geometricNormal, geometricNormal, dot( direction, geometricNormal ) >= 0.0 ) );
		let intScale = 256.0;
		let integerOffset = vec3i( intScale * normal );
		let pointBits = bitcast<vec3i>( point );
		let signedOffset = select( integerOffset, -integerOffset, point < vec3f( 0.0 ) );
		let offsetPoint = bitcast<vec3f>( pointBits + signedOffset );
		let origin = 1.0 / 32.0;
		let floatScale = 1.0 / 65536.0;
		return select( offsetPoint, point + floatScale * normal, abs( point ) < vec3f( origin ) );

	}

`),Fo=$(`

	fn wrapTexelIndex( i: i32, size: i32, wrapMode: i32 ) -> i32 {

		if ( wrapMode == 0 ) {

			// Repeat wraps to the opposite edge
			return ( ( i % size ) + size ) % size;

		}

		// ClampToEdge and MirroredRepeat both fold back onto the edge texel
		return clamp( i, 0, size - 1 );

	}

`),Eo=(s,e,t="sampleTexel")=>C`

	fn ${t}( uv: vec2f, packed: i32, lod: f32 ) -> vec4f {

		let texIndex = packed & 0x7FFFFF;
		let wrapS    = ( packed >> 26 ) & 0x3;
		let wrapT    = ( packed >> 28 ) & 0x3;
		let nearest  = ( packed >> 30 ) & 0x1;

		// look up the texture's rect and page within the atlas. three wraps a
		// uniformArray in a struct ( textureInfoStruct ) with a "value" array member.
		let info   = ${s}[ u32( texIndex ) ];
		let offset = vec2f( vec2u( info.x & 0xFFFFu, info.x >> 16u ) );
		let size   = vec2f( vec2u( info.y & 0xFFFFu, info.y >> 16u ) );
		let page   = i32( info.z & 0xFFFFu );

		// wrap is applied on the logical uv first, then remapped into the tile
		let wrappedUv = vec2f(
			${ff}( uv.x, wrapS ),
			${ff}( uv.y, wrapT ),
		);

		if ( nearest == 1 ) {

			let tileTexel = clamp( vec2i( wrappedUv * size ), vec2i( 0 ), vec2i( size ) - vec2i( 1 ) );
			return textureLoad( ${e}, vec2i( offset ) + tileTexel, page, 0 );

		} else {

			// The tile's neighbors in the atlas are unrelated textures, so hardware
			// filtering cannot supply the taps that fall outside it. Filter here instead
			// and resolve each tap through the wrap mode.
			let texelPos = wrappedUv * size - vec2f( 0.5 );
			let basePos = floor( texelPos );
			let base = vec2i( basePos );
			let f = texelPos - basePos;

			let intSize = vec2i( size );
			let x0 = ${Fo}( base.x,     intSize.x, wrapS );
			let x1 = ${Fo}( base.x + 1, intSize.x, wrapS );
			let y0 = ${Fo}( base.y,     intSize.y, wrapT );
			let y1 = ${Fo}( base.y + 1, intSize.y, wrapT );

			let tile = vec2i( offset );
			let c00 = textureLoad( ${e}, tile + vec2i( x0, y0 ), page, 0 );
			let c10 = textureLoad( ${e}, tile + vec2i( x1, y0 ), page, 0 );
			let c01 = textureLoad( ${e}, tile + vec2i( x0, y1 ), page, 0 );
			let c11 = textureLoad( ${e}, tile + vec2i( x1, y1 ), page, 0 );

			return mix(
				mix( c00, c10, f.x ),
				mix( c01, c11, f.x ),
				f.y,
			);

		}

	}
`;var Hh=$(`

	fn sampleSphere( uv: vec2f ) -> vec3f {

		let u = ( uv.x - 0.5 ) * 2.0;
		let t = uv.y * PI * 2.0;
		let f = sqrt( 1.0 - u * u );

		return vec3f( f * cos( t ), f * sin( t ), u );

	}

`,[K]),vf=$(`

	fn diffuseDirection( wo: vec3f, uv: vec2f ) -> vec3f {

		var lightDirection = sampleSphere( uv );
		lightDirection.z += 1.0;
		lightDirection = normalize( lightDirection );

		return lightDirection;

	}

`,[Hh]),Qa=$(`

	fn getLobeWeights( wo: vec3f, wi: vec3f, woClearcoat: vec3f, wh: vec3f, clearcoatIor: f32, surf: SurfaceRecord ) -> LobeWeights {

		var weights: LobeWeights;
		var remaining = 1.0;

		let clearcoatF0 = iorToF0( clearcoatIor );
		let clearcoatFresnel = schlickFresnel( saturate( woClearcoat.z ), clearcoatF0 );
		weights.clearcoat = surf.clearcoat * clearcoatFresnel;
		remaining -= weights.clearcoat;

		// this specular lobe only handles the opaque portion of the specular
		let fEstimate = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		weights.specular = remaining * ( surf.metalness + ( 1.0 - surf.metalness ) * ( 1.0 - surf.transmission ) * fEstimate );
		remaining -= weights.specular;

		// the transmission lobe covers both the reflected and refracted halves of the transmissive portion
		weights.transmission = remaining * surf.transmission;
		remaining -= weights.transmission;

		weights.diffuse = remaining;

		return weights;

	}

`,[yf,_t,Ge,uf,K]),ci=$(`

	fn equirectDirectionToUv(direction: vec3f) -> vec2f {

		// from Spherical.setFromCartesianCoords
		var uv = vec2f( atan2( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2f( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

`),bf=$(`

	fn sampleHemisphere( n: vec3f, uv: vec2f ) -> vec3f {

		// https://www.rorydriscoll.com/2009/01/07/better-sampling/
		// https://graphics.pixar.com/library/OrthonormalB/paper.pdf
		let sign = select( sign( n.z ), 1.0, n.z == 0.0 );
		let a = - 1.0 / ( sign + n.z );
		let b = n.x * n.y * a;
		let b1 = vec3( 1.0 + sign * n.x * n.x * a, sign * b, - sign * n.x );
		let b2 = vec3( b, sign + n.y * n.y * a, - n.y );

		let r = sqrt( uv.x );
		let theta = 2.0 * PI * uv.y;
		let x = r * cos( theta );
		let y = r * sin( theta );
		return x * b1 + y * b2 + sqrt( 1.0 - uv.x ) * n;

	}

`,[K]),Tt=$(`

	fn misHeuristic( a: f32, b: f32 ) -> f32 {

		let aa = a * a;
		let bb = b * b;
		return aa / ( aa + bb );

	}

`),an=$(`

	fn luminance( color: vec3f ) -> f32 {

		return dot( color, vec3f( 0.2126, 0.7152, 0.0722 ) );

	}

`),wf=$(`

	fn equirectUvToDirection( uvIn: vec2f ) -> vec3f {

		// undo the adjustments applied in equirectDirectionToUv
		var uv = uvIn;
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		let theta = uv.x * 2.0 * PI;
		let phi = uv.y * PI;
		let sinPhi = sin( phi );

		return vec3f( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

`,[K]),Zv=$(`

	fn equirectDirectionPdf( direction: vec3f ) -> f32 {

		let uv = equirectDirectionToUv( direction );
		let theta = uv.y * PI;
		let sinTheta = sin( theta );
		if ( sinTheta == 0.0 ) {

			return 0.0;

		}

		return 1.0 / ( 2.0 * PI * PI * sinTheta );

	}

`,[K,ci]),Lo=$(`

	fn weightedAlphaBlend( prevColor: vec4f, newColor: vec4f, weight: f32 ) -> vec4f {

		let invWeight = 1.0 - weight;
		let totalAlpha = prevColor.a * invWeight + newColor.a * weight;
		var blendedColor = vec4f( 0 );
		if ( totalAlpha != 0.0 ) {

			let prevContrib = prevColor.rgb * invWeight * prevColor.a / totalAlpha;
			let resContrib = newColor.rgb * weight * newColor.a / totalAlpha;
			blendedColor = vec4f( prevContrib + resContrib, totalAlpha );

		}

		return blendedColor;

	}

`);var ko=0,Oo=1,Za=2,Ja=3,el=4,ln=5,rr=1e30,zo=1e-5,Uo=$(`

	fn isMISWeightLight( lightType: i32 ) -> bool {

		return lightType == ${ln} || lightType == ${Oo} || lightType == ${ko};

	}

`),tl=$(`

	fn getSpotAttenuation( coneCosine: f32, penumbraCosine: f32, angleCosine: f32 ) -> f32 {

		return smoothstep( coneCosine, penumbraCosine, angleCosine );

	}

`),Vo=$(`

	fn getDistanceAttenuation( lightDistance: f32, cutoffDistance: f32, decayExponent: f32 ) -> f32 {

		// based upon Frostbite 3 Moving to Physically-based Rendering
		// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		var distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), EPSILON );
		if ( cutoffDistance > 0.0 ) {

			let window = clamp( 1.0 - pow( lightDistance / cutoffDistance, 4.0 ), 0.0, 1.0 );
			distanceFalloff *= window * window;

		}

		return distanceFalloff;

	}

`,[K]),_f=$(`

	fn intersectsRectangle( center: vec3f, normal: vec3f, u: vec3f, v: vec3f, rayOrigin: vec3f, rayDirection: vec3f ) -> f32 {

		let t = dot( center - rayOrigin, normal ) / dot( rayDirection, normal );
		if ( t > EPSILON ) {

			let p = rayOrigin + rayDirection * t;
			let vi = p - center;

			let a1 = dot( u, vi );
			if ( abs( a1 ) <= 0.5 ) {

				let a2 = dot( v, vi );
				if ( abs( a2 ) <= 0.5 ) {

					return t;

				}

			}

		}

		return - 1.0;

	}

`,[K]),Tf=$(`

	fn intersectsCircle( position: vec3f, normal: vec3f, u: vec3f, v: vec3f, rayOrigin: vec3f, rayDirection: vec3f ) -> f32 {

		let t = dot( position - rayOrigin, normal ) / dot( rayDirection, normal );
		if ( t > EPSILON ) {

			let hit = rayOrigin + rayDirection * t;
			let vi = hit - position;

			let a1 = dot( u, vi );
			let a2 = dot( v, vi );
			if ( length( vec2f( a1, a2 ) ) <= 0.5 ) {

				return t;

			}

		}

		return - 1.0;

	}

`,[K]),Sf=$(`

	fn randomAreaLightSample( light: Light, rayOrigin: vec3f, ruv: vec2f ) -> LightRecord {

		var randomPos = vec3f( 0.0 );
		if ( light.lightType == ${ko} ) {

			randomPos = light.position + light.u * ( ruv.x - 0.5 ) + light.v * ( ruv.y - 0.5 );

		} else if ( light.lightType == ${Oo} ) {

			let r = 0.5 * sqrt( ruv.x );
			let theta = ruv.y * 2.0 * PI;
			randomPos = light.position + light.u * ( r * cos( theta ) ) + light.v * ( r * sin( theta ) );

		}

		let toLight = randomPos - rayOrigin;
		let lightDistSq = dot( toLight, toLight );
		let dist = sqrt( lightDistSq );
		let direction = toLight / dist;
		let lightNormal = normalize( cross( light.u, light.v ) );

		var lightRec: LightRecord;
		lightRec.lightType = light.lightType;
		lightRec.emission = light.color * light.intensity;
		lightRec.dist = dist;
		lightRec.direction = direction;

		// points behind or edge-on to the light receive no contribution
		let cosTheta = dot( direction, lightNormal );
		if ( cosTheta <= 0.0 ) {

			lightRec.pdf = 0.0;

		} else {

			lightRec.pdf = lightDistSq / ( light.area * cosTheta );

		}

		return lightRec;

	}

`,[zt,We,K]),If=$(`

	fn randomSpotLightSample( light: Light, rayOrigin: vec3f, ruv: vec2f ) -> LightRecord {

		let radius = light.radius * sqrt( ruv.x );
		let theta = ruv.y * 2.0 * PI;
		let x = radius * cos( theta );
		let y = radius * sin( theta );

		let u = light.u;
		let v = light.v;
		let normal = normalize( cross( u, v ) );

		let angle = acos( light.coneCos );
		let angleTan = tan( angle );
		let startDistance = light.radius / max( angleTan, EPSILON );

		let randomPos = light.position - normal * startDistance + u * x + v * y;
		let toLight = randomPos - rayOrigin;
		let lightDistSq = dot( toLight, toLight );
		let dist = sqrt( lightDistSq );

		let direction = toLight / max( dist, EPSILON );
		let distanceAttenuation = getDistanceAttenuation( dist, light.distance, light.decay );

		var lightRec: LightRecord;
		lightRec.lightType = light.lightType;
		lightRec.dist = dist;
		lightRec.direction = direction;
		lightRec.emission = light.color * light.intensity * distanceAttenuation;
		lightRec.pdf = 1.0;

		return lightRec;

	}

`,[zt,We,K,Vo]),Cf=$(`

	fn getSpotLightNearest( light: Light, position: vec3f ) -> vec2f {

		let normal = normalize( cross( light.u, light.v ) );
		let startDistance = light.radius / max( tan( acos( light.coneCos ) ), EPSILON );
		let discCenter = light.position - normal * startDistance;

		let toPosition = position - discCenter;
		let along = dot( toPosition, - normal );
		let across = max( length( toPosition + normal * along ) - light.radius, 0.0 );
		let dist = length( vec2f( along, across ) );
		return vec2f( along / max( dist, EPSILON ), dist );

	}

`,[zt,K]);var Pr=$(`

	fn ggxDirection( incidentDir: vec3f, alpha: vec2f, uv: vec2f ) -> vec3f {

		// Implementation from reference [1]
		// stretch view
		let V = normalize( vec3f( alpha * incidentDir.xy, incidentDir.z ) );

		// orthonormal basis
		var T1: vec3f;
		if ( V.z < 0.9999 ) {

			T1 = normalize( cross( V, vec3( 0.0, 0.0, 1.0 ) ) );

		} else {

			T1 = vec3( 1.0, 0.0, 0.0 );

		}

		let T2 = cross( T1, V );

		// sample point with polar coordinates (r, phi)
		let a = 1.0 / ( 1.0 + V.z );
		let r = sqrt( uv.x );
		var phi: f32;
		if ( uv.y < a ) {

			phi = uv.y / a * PI;

		} else {

			phi = PI + ( uv.y - a ) / ( 1.0 - a ) * PI;

		}

		let P1 = r * cos( phi );
		var P2 = r * sin( phi );
		if ( uv.y >= a ) {

			P2 *= V.z;

		}

		// compute normal
		var N = P1 * T1 + P2 * T2 + V * sqrt( max( 0.0, 1.0 - P1 * P1 - P2 * P2 ) );

		// unstretch
		N = normalize( vec3( alpha * N.xy, max( 0.0, N.z ) ) );

		return N;

	}

`,[K]),Wh=$(`

	fn ggxLambda( V: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		// abs v.z to support transmitted rays
		let NdotV = max( abs( V.z ), MIN_INCIDENT_COS );
		let cos2 = NdotV * NdotV;
		let t = ( alphaT * alphaT * V.x * V.x + alphaB * alphaB * V.y * V.y ) / cos2;
		let numerator = - 1.0 + sqrt( 1.0 + t );
		return numerator / 2.0;

	}

`,[K]),Ho=$(`

	fn ggxShadowMaskG1( V: vec3f, alpha: vec2f ) -> f32 {

		// TODO: this could be collapsed to a simpler form as an optimization
		return 1.0 / ( 1.0 + ggxLambda( V, alpha ) );

	}

`,[Wh]),Pf=$(`

	fn ggxSmithVisibility( V: vec3f, L: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let NdotL = max( L.z, MIN_INCIDENT_COS );

		let TdotV = V.x;
		let TdotL = L.x;

		let BdotV = V.y;
		let BdotL = L.y;

		let GGXV = NdotL * length( vec3f( alphaT * TdotV, alphaB * BdotV, NdotV ) );
		let GGXL = NdotV * length( vec3f( alphaT * TdotL, alphaB * BdotL, NdotL ) );

		return 0.5 / ( GGXV + GGXL );

	}

`,[K]),cn=$(`

	fn ggxDistribution( H: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let NdotH = H.z;
		let TdotH = H.x;
		let BdotH = H.y;

		let a2 = alphaT * alphaB;
		let v = vec3f( alphaB * TdotH, alphaT * BdotH, a2 * NdotH );
		let v2 = dot( v, v );
		let w2 = a2 / v2;

		return a2 * w2 * w2 / PI;

	}

`,[K]),Ar=$(`

	fn ggxReflectionAdjustedPDF( V: vec3f, H: vec3f, alpha: vec2f ) -> f32 {

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let D = ggxDistribution( H, alpha );
		let G1 = ggxShadowMaskG1( V, alpha );

		return D * G1 / ( 4 * NdotV );

	}
`,[cn,Ho]),Wo=$(`

	fn ggxRefractionAdjustedPDF( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f, eta: f32 ) -> f32 {

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let HdotV = dot( V, H );
		let HdotL = dot( L, H );
		let D = ggxDistribution( H, alpha );
		let G1 = ggxShadowMaskG1( V, alpha );

		let denom = eta * HdotV + HdotL;
		return D * G1 * abs( HdotV ) * abs( HdotL ) / ( NdotV * denom * denom );

	}
`,[cn,Ho]);var Gh=C`

	fn ensureValidReflectionNormal( n: vec3f, ng: vec3f, i: vec3f ) -> vec3f {

		// reflected ray
		let R = 2.0 * dot( n, i ) * n - i;

		let Iz = dot( i, ng );

		// reflection rays may always be at least as shallow as the incoming ray
		let threshold = min( 0.9 * Iz, 0.01 );
		if ( dot( ng, R ) >= threshold ) {

			return n;

		}

		// Form coordinate system with Ng as the Z axis and N inside the X-Z-plane.
		// The X axis is found by normalizing the component of N that's orthogonal to Ng.
		// The Y axis isn't actually needed.
		let orthoN = n - dot( n, ng ) * ng;
		let orthoLen = length( orthoN );
		let X = select( n, orthoN / orthoLen, orthoLen != 0.0 );

		// Calculate N.z and N.x in the local coordinate system.
		//
		// The goal of this computation is to find a N' that is rotated towards Ng just enough
		// to lift R' above the threshold (here called t), therefore dot(R', Ng) = t.
		//
		// See the Blender implementation for a full description of the solution.
		let Ix = dot( i, X );

		let a = Ix * Ix + Iz * Iz;
		let b = 2.0 * ( a + Iz * threshold );
		let c = ( threshold + Iz ) * ( threshold + Iz );

		// only one root is valid; the sign of Ix selects it
		var Nz2: f32;
		if ( Ix < 0.0 ) {

			Nz2 = 0.25 * ( b + sqrt( max( b * b - 4.0 * a * c, 0.0 ) ) ) / a;

		} else {

			Nz2 = 0.25 * ( b - sqrt( max( b * b - 4.0 * a * c, 0.0 ) ) ) / a;

		}

		let Nx = sqrt( max( 1.0 - Nz2, 0.0 ) );
		let Nz = sqrt( max( Nz2, 0.0 ) );

		return Nx * X + Nz * ng;

	}

`,qh=C`

	fn ensureValidViewNormal( n: vec3f, ng: vec3f, view: vec3f ) -> vec3f {

		// ensure the view is at least slightly above the surface normal hemisphere
		const MIN_VIEW_COS = 1e-6;

		// if we're positive already then early out
		let c = dot( n, view );
		if ( c > MIN_VIEW_COS ) {

			return n;

		}

		// perpendicular vector to normal and view
		var perp = n - c * view;
		let perpLen = length( perp );

		// if we reach here that means that he view is nearly the opposite direction and
		// we can't derive plan to rotate on towards the view, so just use the geometry
		// normal. This could likely only really happen with a severe normal map application.
		if ( perpLen <= 1e-6 ) {

			return ng;

		}

		perp = perp / perpLen;

		// rotate the normal to be at larger than the above threshold - pythagorean
		// theorem for generating normal with threshold*view component
		return MIN_VIEW_COS * view + sqrt( 1.0 - MIN_VIEW_COS * MIN_VIEW_COS ) * perp;

	}

`,Go=3402823466e29,Af=(s,e,t)=>$(`

	fn getSurfaceRecord(
		material: Material,
		vertexData: bvh_GeometryStruct,
		side: f32,
		faceNormal: vec3f,
		view: vec3f,
		blurRoughness: f32,
	) -> SurfaceRecord {

		// "faceNormal" is provided on the hit side so flip it back to the geometric side
		var normal = faceNormal * side;
		if ( material.flatShading == 0 ) {

			normal = normalize( vertexData.normal.xyz );

		}

		var baseNormal = normal;
		if ( material.normalMap != -1 ) {

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

				// TODO: consider re-orthonormalizing against the normal here since attribute
				// interpolation could result in drift.
				let tangent = normalize( vertexData.tangent.xyz );
				let bitangent = normalize( cross( baseNormal, tangent ) * vertexData.tangent.w );
				let vTBN = mat3x3f( tangent, bitangent, baseNormal );

				let uvPrime = material.normalMapTransform * vec3( getUvFromChannel( vertexData, material.normalMap ), 1.0 );
				var texNormal = sampleTexel( uvPrime.xy, material.normalMap, 0 ).xyz;
				texNormal = texNormal * 2.0 - 1.0;
				texNormal = texNormal * vec3f( material.normalScale, 1.0 );
				normal = normalize( vTBN * texNormal );

			}

		}

		normal *= side;

		normal = ensureValidViewNormal( normal, faceNormal, view );

		normal = ensureValidReflectionNormal( normal, faceNormal, view );

		var albedo = vec4( material.color, material.opacity );
		if ( material.vertexColors == 1 ) {

			albedo *= getColor( vertexData );

		}

		if ( material.map != -1 ) {

			let uvPrime = material.mapTransform * vec3f( getUvFromChannel( vertexData, material.map ), 1 );
			albedo *= sampleTexel( uvPrime.xy, material.map, 0 );

		}

		if ( material.alphaMap != -1 ) {

			let uvPrime = material.alphaMapTransform * vec3f( getUvFromChannel( vertexData, material.alphaMap ), 1 );
			albedo.a *= sampleTexel( uvPrime.xy, material.alphaMap, 0 ).g;

		}

		var roughness = material.roughness;
		if ( material.roughnessMap != -1 ) {

			let uvPrime = material.roughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.roughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.roughnessMap, 0 );
			roughness *= texColor.g;

		}

		var metalness = material.metalness;
		if ( material.metalnessMap != -1 ) {

			let uvPrime = material.metalnessMapTransform * vec3f( getUvFromChannel( vertexData, material.metalnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.metalnessMap, 0 );
			metalness *= texColor.b;

		}

		var emission = material.emissiveIntensity * material.emissive;
		if ( material.emissiveMap != -1 ) {

			let uvPrime = material.emissiveMapTransform * vec3f( getUvFromChannel( vertexData, material.emissiveMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.emissiveMap, 0 );
			emission *= texColor.rgb;

		}

		var transmission = material.transmission;
		if ( material.transmissionMap != -1 ) {

			let uvPrime = material.transmissionMapTransform * vec3f( getUvFromChannel( vertexData, material.transmissionMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.transmissionMap, 0 );
			transmission *= texColor.r;

		}

		var clearcoat = material.clearcoat;
		if ( material.clearcoatMap != -1 ) {

			let uvPrime = material.clearcoatMapTransform * vec3f( getUvFromChannel( vertexData, material.clearcoatMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.clearcoatMap, 0 );
			clearcoat *= texColor.r;

		}

		var clearcoatRoughness = material.clearcoatRoughness;
		if ( material.clearcoatRoughnessMap != -1 ) {

			let uvPrime = material.clearcoatRoughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.clearcoatRoughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.clearcoatRoughnessMap, 0 );
			clearcoatRoughness *= texColor.g;

		}

		var clearcoatNormal = baseNormal;
		if ( material.clearcoatNormalMap != -1 ) {

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

				// TODO: consider re-orthonormalizing against the normal here since attribute
				// interpolation could result in drift.
				let tangent = normalize( vertexData.tangent.xyz );
				let bitangent = normalize( cross( baseNormal, tangent ) * vertexData.tangent.w );
				let vTBN = mat3x3f( tangent, bitangent, baseNormal );

				let uvPrime = material.clearcoatNormalMapTransform * vec3( getUvFromChannel( vertexData, material.clearcoatNormalMap ), 1.0 );
				var texNormal = sampleTexel( uvPrime.xy, material.clearcoatNormalMap, 0 ).xyz;
				texNormal = texNormal * 2.0 - 1.0;
				texNormal = texNormal * vec3f( material.clearcoatNormalScale, 1.0 );
				clearcoatNormal = normalize( vTBN * texNormal );

			}

		}

		clearcoatNormal *= side;

		clearcoatNormal = ensureValidViewNormal( clearcoatNormal, faceNormal, view );

		clearcoatNormal = ensureValidReflectionNormal( clearcoatNormal, faceNormal, view );

		var sheenColor = material.sheenColor;
		if ( material.sheenColorMap != -1 ) {

			let uvPrime = material.sheenColorMapTransform * vec3f( getUvFromChannel( vertexData, material.sheenColorMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.sheenColorMap, 0 );
			sheenColor *= texColor.rgb;

		}

		var sheenRoughness = material.sheenRoughness;
		if ( material.sheenRoughnessMap != -1 ) {

			let uvPrime = material.sheenRoughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.sheenRoughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.sheenRoughnessMap, 0 );
			sheenRoughness *= texColor.r;

		}

		var iridescence = material.iridescence;
		if ( material.iridescenceMap != -1 ) {

			let uvPrime = material.iridescenceMapTransform * vec3f( getUvFromChannel( vertexData, material.iridescenceMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.iridescenceMap, 0 );
			iridescence *= texColor.r;

		}

		var iridescenceThickness = material.iridescenceThicknessMaximum;
		if ( material.iridescenceThicknessMap != -1 ) {

			let uvPrime = material.iridescenceThicknessMapTransform * vec3f( getUvFromChannel( vertexData, material.iridescenceThicknessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.iridescenceThicknessMap, 0 );

			iridescenceThickness = mix(
				material.iridescenceThicknessMinimum,
				material.iridescenceThicknessMaximum,
				texColor.g,
			);

		}

		var specularColor = material.specularColor;
		if ( material.specularColorMap != -1 ) {

			let uvPrime = material.specularColorMapTransform * vec3f( getUvFromChannel( vertexData, material.specularColorMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.specularColorMap, 0 );
			specularColor *= texColor.rgb;

		}

		var specularIntensity = material.specularIntensity;
		if ( material.specularIntensityMap != -1 ) {

			let uvPrime = material.specularIntensityMapTransform * vec3f( getUvFromChannel( vertexData, material.specularIntensityMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.specularIntensityMap, 0 );
			specularIntensity *= texColor.a;

		}

		// extract the anisotropy magnitude vector in tangent space
		var anisotropyDirVec = material.anisotropy * vec2f( cos( material.anisotropyRotation ), sin( material.anisotropyRotation ) );
		if ( material.anisotropyMap != -1 ) {

			let uvPrime = material.anisotropyMapTransform * vec3f( getUvFromChannel( vertexData, material.anisotropyMap ), 1.0 );
			let aniTex = sampleTexel( uvPrime.xy, material.anisotropyMap, 0 );

			// map rg encode the direction ([-1,1]), b the strength; rotate + scale by the material anisotropy.
			let mapDir = aniTex.rg * 2.0 - vec2f( 1.0 );
			let mapStr = aniTex.b;
			let mapLen = length( mapDir );
			if ( mapLen > EPSILON ) {

				anisotropyDirVec = mat2x2f(
					anisotropyDirVec.x, anisotropyDirVec.y,
					- anisotropyDirVec.y, anisotropyDirVec.x
				) * mapStr * mapDir / mapLen;

			}

		}

		// adjust the surface basis to be oriented along the anisotropic vector
		let anisotropyStrength = length( anisotropyDirVec );
		var surfaceBasis = getBasisFromNormal( normal );
		if ( anisotropyStrength > 0.0 && length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

			let anisotropyDir = anisotropyDirVec / anisotropyStrength;

			// re-orthonormalize the tangent against the shading normal so the frame stays orthonormal -
			// normal map adjustments will cause the normal and tangent to become non-orthonormal.
			let tangent = normalize( vertexData.tangent.xyz - normal * dot( normal, vertexData.tangent.xyz ) );
			let bitangent = cross( normal, tangent ) * vertexData.tangent.w;

			surfaceBasis = mat3x3f(
				tangent * anisotropyDir.x + bitangent * anisotropyDir.y,
				bitangent * anisotropyDir.x - tangent * anisotropyDir.y,
				normal
			);

		}

		var surf: SurfaceRecord;

		surf.volumeParticle = false;
		surf.faceNormal = faceNormal;
		surf.normal = normal;

		surf.metalness = metalness;
		surf.diffuseRoughness = material.diffuseRoughness;
		surf.color = albedo.rgb;
		surf.emission = emission;

		surf.opacity = select( 1.0, albedo.a, material.transparent != 0 );

		surf.ior = material.ior;
		surf.transmission = transmission;
		surf.thinWall = material.thinWall == 1;
		surf.attenuationColor = material.attenuationColor;
		surf.attenuationDistance = material.attenuationDistance;

		surf.clearcoatNormal = clearcoatNormal;
		surf.clearcoat = clearcoat;

		surf.iridescence = iridescence;
		surf.iridescenceIor = material.iridescenceIor;
		surf.iridescenceThickness = iridescenceThickness;

		surf.specularColor = specularColor;
		surf.specularIntensity = specularIntensity;

		surf.sheen = material.sheen;
		surf.sheenColor = sheenColor;

		let minRoughness = max( MIN_ROUGHNESS, blurRoughness );
		surf.roughness = clamp( roughness, minRoughness, 1.0 );
		surf.clearcoatRoughness = clamp( clearcoatRoughness, minRoughness, 1.0 );
		surf.sheenRoughness = clamp( sheenRoughness, minRoughness, 1.0 );
		surf.anisotropy = anisotropyStrength;

		// frontFace is used to determine transmissive properties and PDF. If no transmission is used
		// then we can just always assume this is a front face.
		surf.frontFace = side == 1.0 || transmission == 0.0;
		if ( material.thinWall == 1 || surf.frontFace ) {

			surf.eta = 1.0 / material.ior;

		} else {

			surf.eta = material.ior;

		}
		surf.f0 = iorToF0( surf.eta );

		// get the normal frames
		surf.normalBasis = surfaceBasis;
		surf.normalInvBasis = inverse( surf.normalBasis );

		surf.clearcoatBasis = getBasisFromNormal( surf.clearcoatNormal );
		surf.clearcoatInvBasis = inverse( surf.clearcoatBasis );

		return surf;
	}

`,[pf,Ge,df,s,e,t,Ie,K,Gh,qh]),fb=$(`

	fn diffuseBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
		// See equation (4)

		let fl = schlickFresnel( NdotL, 0.0 );
		let fv = schlickFresnel( NdotV, 0.0 );

		let alpha = surf.roughness * surf.roughness;
		let bias = mix( 0.0, 0.5, alpha ) - 1;
		let energyFactor = mix( 1.0, 1.0 / 1.51, alpha );

		let rr = 2.0 * alpha * VdotH * VdotH;
		let retro = rr * ( fl + fv + fl * fv * ( rr + 2.0 * bias ) );
		let fresnel = ( 1.0 + bias * fl ) * ( 1.0f + bias * fv );

		// TODO: subsurface approx?

		return energyFactor * ( surf.color / PI ) * ( retro + fresnel );

	}

`,[K,_t,Ie]),pb=$(`

	fn lambertBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		return surf.color / PI;

	}

`,[K,Ie]),rl=$(`

	fn specularBrdf( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f ) -> vec3f {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let Vis = ggxSmithVisibility( V, L, alpha );
		let D = ggxDistribution( H, alpha );

		return vec3f( D * Vis );

	}

`,[Pf,cn]),ui=$(`

	fn isMatchedIor( eta: f32 ) -> bool {

		return abs( eta - 1.0 ) < EPSILON;

	}

`,[K]),il=$(`

	fn specularBtdf( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f, eta: f32 ) -> vec3f {

		let NdotV = V.z;
		let NdotL = L.z;
		let HdotV = dot( V, H );
		let HdotL = dot( L, H );

		// Heaviside function for G term
		if ( NdotV * HdotV < 0.0 || NdotL * HdotL < 0.0 || HdotV * HdotL > 0.0 ) {

			return vec3f( 0.0 );

		}

		let G1_i = ggxShadowMaskG1( V, alpha );
		let G1_o = ggxShadowMaskG1( L, alpha );

		// separable G2 product, no height correlation
		let denom = eta * HdotV + HdotL;
		let Vis = G1_i * G1_o * abs( HdotV ) * abs( HdotL ) /
			( abs( NdotV ) * abs( NdotL ) * denom * denom );

		let F = dielectricFresnel( abs( HdotV ), eta );

		let D = ggxDistribution( H, alpha );

		return vec3f( ( 1 - F ) * D * Vis );

	}

`,[Ho,cn,Cr]),qo=$(`

	fn thinWallTransmissionRoughness( alpha: f32, eta: f32 ) -> f32 {

		let t = 3.4 * ( eta - 1.0 ) * ( eta - 0.5 ) * ( eta - 0.5 ) / ( eta * eta * eta );
		return saturate( alpha * sqrt( max( t, 0.0 ) ) );

	}

`),jo=$(`

	fn transmissionAttenuation( dist: f32, attColor: vec3f, attDist: f32 ) -> vec3f {

		return pow( attColor, vec3f( dist / attDist ) );

	}

`),fi=360,pi=830,jh=$(`

	fn dispersionIor( ior: f32, dispersion: f32, wavelength: f32 ) -> f32 {

		let nd = max( ior, 1.0 );
		let scale = ( nd - 1.0 ) * max( dispersion, 0.0 ) / 20.0;
		let lambda = clamp( wavelength, ${fi}.0, ${pi}.0 );
		return max( nd + scale * ( 523655.0 / ( lambda * lambda ) - 1.5168 ), 1.0 );

	}

`),Yo=C`

	fn applyDispersion( surf: ptr<function, ${Ie}>, dispersion: f32, wavelength: f32 ) -> void {

		surf.ior = ${jh}( surf.ior, dispersion, wavelength );
		surf.eta = select( surf.ior, 1.0 / surf.ior, surf.thinWall || surf.frontFace );
		surf.f0 = ${Ge}( surf.eta );

	}

`,Ko=$(`

	fn dispersionColorWeight( wavelength: f32 ) -> vec3f {

		let lambda = clamp( wavelength, ${fi}.0, ${pi}.0 );

		let x1 = ( lambda - 442.0 ) * select( 0.0374, 0.0624, lambda < 442.0 );
		let x2 = ( lambda - 599.8 ) * select( 0.0323, 0.0264, lambda < 599.8 );
		let x3 = ( lambda - 501.1 ) * select( 0.0382, 0.0490, lambda < 501.1 );
		let x = 0.362 * exp( - 0.5 * x1 * x1 ) + 1.056 * exp( - 0.5 * x2 * x2 ) - 0.065 * exp( - 0.5 * x3 * x3 );

		let y1 = ( lambda - 568.8 ) * select( 0.0247, 0.0213, lambda < 568.8 );
		let y2 = ( lambda - 530.9 ) * select( 0.0322, 0.0613, lambda < 530.9 );
		let y = 0.821 * exp( - 0.5 * y1 * y1 ) + 0.286 * exp( - 0.5 * y2 * y2 );

		let z1 = ( lambda - 437.0 ) * select( 0.0278, 0.0845, lambda < 437.0 );
		let z2 = ( lambda - 459.0 ) * select( 0.0725, 0.0385, lambda < 459.0 );
		let z = 1.217 * exp( - 0.5 * z1 * z1 ) + 0.681 * exp( - 0.5 * z2 * z2 );

		let linearRgb = max( vec3f(
			3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
			- 0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
			0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
		), vec3f( 0.0 ) );

		return linearRgb * vec3f( 2.6699448, 4.0708066, 4.2980494 );

	}

`),Bf=$(`

	fn fresnelMix( VdotH: f32, f0Color: vec3f, ior: f32, eta: f32, weight: f32, base: vec3f, layer: vec3f ) -> vec3f {

		var f0 = iorToF0( ior ) * f0Color;
		f0 = min( f0, vec3f( 1.0 ) );

		// reflect all light on total internal reflection, matching the WebGL evaluateFresnel function
		var fr = vec3f( 1.0 );
		if ( ! totalInternalReflection( abs( VdotH ), eta ) ) {

			fr = schlickFresnelVec( abs( VdotH ), f0, vec3f( 1.0 ) );

		}

		let maxFr = max( max( fr.r, fr.g ), fr.b );

		return ( 1.0 - weight * maxFr ) * base + weight * fr * layer;

	}

`,[ai,Ge,Mo]),Yh=Bc(3.2404542,-.969266,.0556434,-1.5371385,1.8760108,-.2040259,-.4985314,.041556,1.0572252),Kh=C`

	fn evalSensitivity( OPD: f32, shift: vec3f ) -> vec3f {

		let phase = 2.0 * ${Math.PI} * OPD * 1.0e-9;
		const val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
		const pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
		const _var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

		var xyz = val * sqrt(2.0 * ${Math.PI} * _var) * cos(pos * phase + shift) * exp(-phase * phase * _var);
		xyz.x += 9.7470e-14 * sqrt(2.0 * ${Math.PI} * 4.5282e+09) * cos(2.2399e+06 * phase + shift.x) * exp(-4.5282e+09 * phase * phase);
		xyz /= 1.0685e-7;

		let rgb = ${Yh} * xyz;
		return rgb;

	}

`,nl=$(`

	fn iridescentFresnel(
		cosTheta1: f32, baseF0: vec3f, iridescenceIor: f32,
		outsideIor: f32, iridescenceThickness: f32,
	) -> vec3f {

		let sinTheta2Sq = pow( outsideIor / iridescenceIor, 2.0 ) * ( 1.0 - pow( cosTheta1, 2.0 ) );
		let cosTheta2Sq = 1.0 - sinTheta2Sq;

		// Handle total internal reflection
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		let cosTheta2 = sqrt( cosTheta2Sq );

		// First interface: air -> iridescent thin film
		let R0 = iorToF0General( iridescenceIor, outsideIor );
		let R12 = schlickFresnel( cosTheta1, R0 );
		let R21 = R12;
		let T121 = 1.0 - R12;
		let phi12 = select( 0.0, PI, iridescenceIor < outsideIor );
		let phi21 = PI - phi12;

		// Second interface: iridescent thin film -> base material
		let baseIor = fresnel0ToIor( clamp( baseF0, vec3( 0.0 ), vec3( 0.9999 ) ) ); // guard against 1.0
		let R1 = iorToF0GeneralVec( baseIor, vec3( iridescenceIor ) );
		var R23 = schlickFresnelVec( cosTheta2, R1, vec3( 1.0 ) );

		// Handle total internal reflection at the film -> base interface
		// NOTE: Added separately from the original implementation. Is this correct?
		R23 = select( R23, vec3( 1.0 ), totalInternalReflectionVec( cosTheta2, vec3( iridescenceIor ) / baseIor ) );
		let phi23 = select( vec3( 0.0 ), vec3( PI ), baseIor < vec3( iridescenceIor ) );

		// Phase shift
		let OPD = 2.0 * iridescenceIor * iridescenceThickness * cosTheta2;
		let phi = vec3( phi21 ) + phi23;

		// Analytical integration
		// Compound terms
		let R123 = clamp( R12 * R23, vec3( 1e-5 ), vec3( 0.9999 ) );
		let r123 = sqrt( R123 );
		let Rs = T121 * T121 * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		let C0 = R12 + Rs;
		var I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		var Cm = Rs - T121;
		for (var m = 1; m <= 2; m += 1) {

			Cm *= r123;
			let Sm = 2.0 * evalSensitivity( f32( m ) * OPD, f32( m ) * phi );
			I += Cm * Sm;

		}

		return max( I, vec3(0.0) );

	}

`,[hf,mf,_t,gf,Kh,xf]),Rf=(s=nl)=>C`

	fn transmissionFresnel( cosTheta: f32, surf: ${Ie} ) -> ${Ya} {

		var result: ${Ya};
		let cosine = saturate( abs( cosTheta ) );
		let matchedIor = ${ui}( surf.eta );
		let airIncident = surf.thinWall || surf.frontFace;
		let dielectricFresnel = ${Cr}( cosine, surf.eta );

		// Keep matched media transparent unless a real thin-film layer is present. This avoids
		// introducing the non-physical Schlick F90 reflection produced by KHR_materials_specular
		// when the substrate itself has no IOR boundary.
		var reflectance = vec3f( 0.0 );
		if ( ! matchedIor ) {

			let specularF0 = min( surf.f0 * surf.specularColor, vec3f( 1.0 ) );
			let dielectricReflectance = select(
				vec3f( dielectricFresnel ),
				${ai}( cosine, specularF0, vec3f( 1.0 ) ),
				airIncident,
			);
			reflectance = surf.specularIntensity * dielectricReflectance;

		}

		reflectance = clamp( reflectance, vec3f( 0.0 ), vec3f( 1.0 ) );
		var transmittance = vec3f( 1.0 ) - reflectance;

		if ( surf.iridescence > 0.0 ) {

			// The media on either side of the film are air outside and the volume interior as
			// the base. Swap them on interior hits so film-interface TIR remains possible.
			let outsideIor = select( surf.ior, 1.0, airIncident );
			let filmBaseIor = select( 1.0, surf.ior, airIncident );
			let filmReflectance = clamp( ${s}(
				cosine,
				vec3f( ${Ge}( filmBaseIor ) ),
				surf.iridescenceIor,
				outsideIor,
				surf.iridescenceThickness,
			), vec3f( 0.0 ), vec3f( 1.0 ) );

			reflectance = mix( reflectance, filmReflectance, surf.iridescence );
			transmittance = mix( transmittance, vec3f( 1.0 ) - filmReflectance, surf.iridescence );

		}

		result.reflectance = reflectance;
		result.transmittance = transmittance;

		// Include the base-color tint in the transmission energy, as Cycles does when it
		// computes the glass reflection probability from its two tinted coefficients.
		let reflectEnergy = dot( reflectance, vec3f( 1.0 / 3.0 ) );
		let transmitEnergy = dot( transmittance * surf.color, vec3f( 1.0 / 3.0 ) );
		let totalEnergy = reflectEnergy + transmitEnergy;
		result.reflectProbability = select( 0.0, reflectEnergy / max( totalEnergy, EPSILON ), totalEnergy > EPSILON );

		return result;

	}

`,$f=$(`

	fn conductorFresnel( VdotH: f32, f0: vec3f, specular: vec3f ) -> vec3f {

		return specular * schlickFresnelVec( abs( VdotH ), f0, vec3f( 1 ) );

	}

`,[ai]),Df=$(`

	fn fresnelCoat( VdotNc: f32, ior: f32, base: vec3f, layer: vec3f, weight: f32 ) -> vec3f {

		let f0 = iorToF0( ior );
		let F = schlickFresnel( abs( VdotNc ), f0 );

		return mix( base, layer, weight * F );

	}

`,[Ge,_t]),Nf=s=>C`

	fn albedo(
		eta: f32,
		includeFresnel: bool,
		includeRefraction: bool,
		globalId: vec3u,
		layer: u32,
	) -> void {

		// The matched-IOR limit is a unit-energy delta transmission event, so it cannot
		// be integrated with the rough BTDF below.
		if ( includeRefraction && ${ui}( eta ) ) {

			textureStore( ${s}, vec3( globalId.xy, layer ), vec4( 1.0 ) );
			return;

		}

		// sample the brdf directions in a grid pattern
		const GRID_SIZE = 64u;

		// TODO: this sampling means that energy at 0.0 & 1.0 roughness (and 0 and 90deg cos) are never
		// written to the texture due to the half texel inset, resulting in small, though possibly noticeable,
		// error in common cases.
		let dimensions = textureDimensions( ${s} ).xy;
		let uv = ( vec2f( globalId.xy ) + vec2f( 0.5 ) ) / vec2f( dimensions );

		let cosThetaO = uv.x;
		let roughness = uv.y;
		let alpha = roughness * roughness;

		let wo = vec3( sqrt( 1 - cosThetaO * cosThetaO ), 0 , cosThetaO );

		let f0 = ${Ge}( eta );

		var result = 0.0;
		for ( var x = 0u; x < GRID_SIZE; x++ ) {

			for ( var y = 0u; y < GRID_SIZE; y++ ) {

				// calculate the half vector to sample
				let gridPoint = vec2f( vec2u( x, y ) ) + vec2f( 0.5 );
				let sampleUv = gridPoint / f32( GRID_SIZE );
				let wh = ${Pr}( wo, vec2( alpha ), sampleUv );

				var f = 1.0;
				if ( includeFresnel ) {

					// use the exact dielectric fresnel so the table agrees with the fresnel used
					// for lobe sampling
					f = ${Cr}( dot( wo, wh ), eta );

				}

				// air-incident reflection is evaluated with schlick in bsdfEval - only the
				// volume-incident ( TIR ) glass reflection uses the exact fresnel
				var reflectionF = f;
				if ( eta < 1.0 ) {

					reflectionF = ${_t}( dot( wo, wh ), f0 );

				}

				// reflection lobe - samples landing below the surface are lost
				let wi = - reflect( wo, wh );
				let reflectionPdf = ${Ar}( wo, wh, vec2f( alpha ) );
				if ( wi.z > 0.0 && reflectionPdf != 0.0 ) {

					let specular = ${rl}( wo, wi, wh, vec2f( alpha ) );
					result += reflectionF * specular.x * wi.z / reflectionPdf;

				}

				// refraction lobe - the btdf carries its own ( 1 - F ) fresnel weight, and
				// samples landing back above the surface are lost
				if ( includeRefraction ) {

					let wiRefract = refract( - wo, wh, eta );
					if ( wiRefract.z < 0.0 ) {

						let transmission = ${il}( wo, wiRefract, wh, vec2f( alpha ), eta );
						let pdf = ${Wo}( wo, wiRefract, wh, vec2f( alpha ), eta );
						if ( pdf != 0.0 ) {

							result += transmission.x * abs( wiRefract.z ) / pdf;

						}

					}

				}

			}

		}

		result /= f32( GRID_SIZE * GRID_SIZE );

		textureStore( ${s}, vec3( globalId.xy, layer ), vec4( result ) );

	}

`;var ol={};th(ol,{rand1:()=>nm,rand2:()=>im,rand3:()=>rm,rand4:()=>Zo,rngInit:()=>em,rngNextBounce:()=>tm});function Ff(s,e=Math.random){for(let t=s.length-1;t>0;t--){let r=~~((e()-1e-6)*t),i=s[t];s[t]=s[r],s[r]=i}}function Mf(s,e){s.fill(0);for(let t=0;t<e;t++)s[t]=1}var un=class{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){let{score:e,binaryPattern:t}=this,r=1/0,i=-1;for(let o=0,n=t.length;o<n;o++){if(t[o]!==0)continue;let a=e[o];a<r&&(r=a,i=o)}return i}findCluster(){let{score:e,binaryPattern:t}=this,r=-1/0,i=-1;for(let o=0,n=t.length;o<n;o++){if(t[o]!==1)continue;let a=e[o];a>r&&(r=a,i=o)}return i}setSigma(e){if(e===this.sigma)return;let t=~~(Math.sqrt(20*e**2)+1),r=2*t+1,i=new Float32Array(r*r),o=e*e;for(let n=-t;n<=t;n++)for(let a=-t;a<=t;a++){let l=(t+a)*r+n+t,f=n*n+a*a;i[l]=Math.E**(-f/(2*o))}this.lookupTable=i,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){let{binaryPattern:e,score:t,size:r}=this;t.fill(0);for(let i=0,o=e.length;i<o;i++)if(e[i]===0){let n=~~(i/r),a=i-n*r;this.updateScore(a,n,1),e[i]=1}else e[i]=0}updateScore(e,t,r){let{size:i,score:o,lookupTable:n}=this,a=this.radius,l=2*a+1;for(let f=-a;f<=a;f++)for(let c=-a;c<=a;c++){let u=(a+c)*l+f+a,p=n[u],d=e+f;d=d<0?i+d:d%i;let h=t+c;h=h<0?i+h:h%i;let g=h*i+d;o[g]+=r*p}}addPointIndex(e){this.binaryPattern[e]=1;let t=this.size,r=~~(e/t),i=e-r*t;this.updateScore(i,r,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;let t=this.size,r=~~(e/t),i=e-r*t;this.updateScore(i,r,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}};var Xo=class{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new un(1),this.savedSamples=new un(1)}generate(){let{samples:e,savedSamples:t,sigma:r,majorityPointsRatio:i,size:o}=this;e.resize(o),e.setSigma(r);let n=Math.floor(o*o*i),a=e.binaryPattern;Mf(a,n),Ff(a,this.random);for(let u=0,p=a.length;u<p;u++)a[u]===1&&e.addPointIndex(u);for(;;){let u=e.findCluster();e.removePointIndex(u);let p=e.findVoid();if(u===p){e.addPointIndex(u);break}e.addPointIndex(p)}let l=new Uint32Array(o*o);t.copy(e);let f;for(f=e.count-1;f>=0;){let u=e.findCluster();e.removePointIndex(u),l[u]=f,f--}let c=o*o;for(f=t.count;f<c/2;){let u=t.findVoid();t.addPointIndex(u),l[u]=f,f++}for(t.invert();f<c;){let u=t.findCluster();t.removePointIndex(u),l[u]=f,f++}return{data:l,maxValue:c}}};function Xh(s){return s>=3?4:s}function Qh(s){switch(s){case 1:return zi;case 2:return cc;default:return Se}}var Qo=class extends ye{constructor(e=64,t=1){super(new Float32Array(4),1,1,Se,ze),this.minFilter=nt,this.magFilter=nt,this.size=e,this.channels=t,this.update()}update(){let e=this.channels,t=this.size,r=new Xo;r.channels=e,r.size=t;let i=Xh(e),o=Qh(i);(this.image.width!==t||o!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*i),this.format=o,this.dispose());let n=this.image.data;for(let a=0,l=e;a<l;a++){let f=r.generate(),c=f.data,u=f.maxValue;for(let p=0,d=c.length;p<d;p++){let h=c[p]/u;n[p*i+a]=h}}this.needsUpdate=!0}};var Ef=64,Zh=new Qo(Ef,1),Jh=he(Zh),Lf=Wr(0).toVar("blueDitherSeed"),em=C`
	fn blueDitherInitialize( pixel: vec2u, pathIndex: u32, bounceIndex: u32 ) -> void {

		let coord = vec2i( pixel % vec2u( ${Ef}u ) );
		${Lf} = textureLoad( ${Jh}, coord, 0 );
		${Io}( vec2u( 0 ), pathIndex, bounceIndex );

	}
`,tm=C`
	fn blueDitherNextBounce() -> void {

		${Co}();

	}
`,Zo=C`
	fn blueDitherRand4( effect: u32 ) -> vec4f {

		// Get the scrambled sobol stratified sample
		let stratifiedSample = ${So}( effect );

		// offset it by the blue noise seed and dimension rotation
		return fract( stratifiedSample + ${Lf}.r );

	}
`,rm=C`
	fn blueDitherRand3( effect: u32 ) -> vec3f {

		return ${Zo}( effect ).xyz;

	}
`,im=C`
	fn blueDitherRand2( effect: u32 ) -> vec2f {

		return ${Zo}( effect ).xy;

	}
`,nm=C`
	fn blueDitherRand1( effect: u32 ) -> f32 {

		return ${Zo}( effect ).x;

	}
`;var Jo=0,di=1,es=2,kf=2147483648,hi=1073741824,ir=1073741823;var ts=class extends ne{constructor(){let e={bvhData:{value:null},material:{value:null},envInfo:{value:null},lightsInfo:{value:null},prevOutputTarget:Ee(new ue(1,1)).toReadOnly(),outputTarget:Ee(new ue(1,1)).toWriteOnly(),sampleCountTarget:Ee(new ue(1,1)).toReadWrite(),offset:N(new X),tileSize:N(new X),seed:N(0),maxBounces:N(5),maxTransparentBounces:N(5,"uint"),misEnabled:N(1,"uint"),maxSamples:N(0,"uint"),filterGlossy:N(1),clampDirect:N(0),clampIndirect:N(10),backgroundInfo:{value:null},transmissiveBackground:N(di),textures:he(new ye),textureSampler:xt(new ye),globalId:fe},t=Z("bvhData.value.fns.raycastFirstHit.outputType",e),r=Y("bvhData.value.fns.raycastFirstHit",e),i=Y("bvhData.value.fns.raycastShadow",e),o=Y("bvhData.value.fns.sampleTrianglePoint",e),n=Y("bvhData.value.fns.getSurfaceRecord",e),a=Y("bvhData.value.fns.getCameraRay",e),l=Y("material.value.bsdfSample",e),f=Y("material.value.bsdfEvalPdf",e),c=Z("envInfo.value.totalSumNode",e),u=Z("envInfo.value.intensityNode",e),p=Z("envInfo.value.sampleColor",e),d=Z("envInfo.value.sampleDir",e),h=Z("envInfo.value.getDirPdf",e),g=Z("envInfo.value.getWeight",e),x=Z("backgroundInfo.value.sampleColor",e),b=Z("lightsInfo.value.countNode",e),m=Y("lightsInfo.value.randomLightSample",e),v=Y("lightsInfo.value.intersectLightAtIndex",e),y=Y("lightsInfo.value.getLightWeight",e),w=Y("lightsInfo.value.getLightsWeight",e),S=Y("lightsInfo.value.selectLight",e),T=Y("lightsInfo.value.isLightVisibleToCamera",e),I=C`

			fn compute(

				// indices and target
				globalId: vec3u,

				// tiles
				offset: vec2u,
				tileSize: vec2u,

				// settings
				seed: u32,
				maxBounces: u32,
				maxTransparentBounces: u32,
				misEnabled: u32,
				maxSamples: u32,
				filterGlossy: f32,
				clampDirect: f32,
				clampIndirect: f32,

				transmissiveBackground: u32,

			) -> void {

				let transforms = &${Z("bvhData.value.storage.transforms",e)};
				let materials = &${Z("bvhData.value.storage.materials",e)};

				// make sure we don't bleed over the edge of our tile
				if ( globalId.x >= tileSize.x || globalId.y >= tileSize.y ) {

					return;

				}

				// to screen coordinates
				let indexUV = offset + globalId.xy;
				let targetDimensions = textureDimensions( ${e.outputTarget} );
				if ( indexUV.x >= targetDimensions.x || indexUV.y >= targetDimensions.y ) {

					return;

				}

				// skip the pixel once it has hit the sample limit
				let sampleCount = textureLoad( ${e.sampleCountTarget}, indexUV ).r;
				if ( maxSamples != 0u && sampleCount >= maxSamples ) {

					return;

				}

				let uv = vec2f( indexUV ) / vec2f( targetDimensions );
				${ut}( indexUV.xy, seed, 0 );

				// scene ray
				let jitteredUv = uv + ${ft}( ${Po} ) / vec2f( targetDimensions );
				var ray: ${z};
				if ( ! ${a}( jitteredUv, vec2f( targetDimensions ), &ray ) ) {

					return;

				}

				ray.direction = normalize( ray.direction );

				var resultColor = vec4f( 0, 0, 0, 1 );
				var throughputColor = vec3f( 1.0 );
				var bsdfPdf = 0.0;
				var isFullyTransmissive = true;
				var minPdf = 1.0;
				var transparentBounce = 0u;
				// A negative value marks a sampled wavelength whose RGB reconstruction weight has not been applied yet.
				var dispersionWavelength = - mix( ${fi}.0, ${pi}.0, ${wt}( ${Do} ) );

				// one-sample NEE chooses between the analytic lights and the environment
				let envActive = ${c} > 0.0 && ${u} > 0.0;
				let lightsCount = ${b};
				var envWeight = 0.0;
				if ( envActive ) {

					envWeight = ${g}();

				}

				// added last, since a camera ray miss overwrites the pixel with the background
				var lightHits = vec3f( 0.0 );
				var cameraHitLight = false;

				for ( var bounce = 0u; bounce < maxBounces; bounce ++ ) {

					var hitResult: ${t};
					let didHit = ${r}( ray, &hitResult );
					let surfaceDist = select( ${rr}, hitResult.dist, didHit );

					// NEE's total weight at the vertex this ray left, for MIS. Camera rays have none
					let isMISWeighted = misEnabled != 0u && bounce > 0u;
					var lightTotalWeight = 0.0;
					if ( isMISWeighted ) {

						lightTotalWeight = ${w}( ray.origin ) + envWeight;

					}

					// forward hits on area lights. Camera rays only see visibleToCameraRays lights, at full weight
					for ( var li = 0u; li < lightsCount; li ++ ) {

						if ( bounce == 0u && ! ${T}( li ) ) {

							continue;

						}

						var lightRec: ${We};
						if ( ${v}( ray.origin, ray.direction, li, &lightRec ) && lightRec.dist < surfaceDist ) {

							var misWeight = 1.0;
							if ( isMISWeighted ) {

								let selectionPdf = ${y}( li, ray.origin ) / lightTotalWeight;
								misWeight = ${Tt}( bsdfPdf, lightRec.pdf * selectionPdf );

							}

							lightHits += ${Te}( lightRec.emission * throughputColor * misWeight, bounce, clampDirect, clampIndirect );
							cameraHitLight = cameraHitLight || bounce == 0u;

						}

					}

					if ( didHit ) {

						let objectInfo = transforms[ hitResult.objectIndex ];
						var materialInfo = ( *materials )[ objectInfo.materialIndex ];

						// a matte surface hit by the camera ray renders as a fully transparent
						if ( materialInfo.matte != 0 && bounce == 0u ) {

							resultColor = vec4f( 0.0 );
							break;

						}

						// apply per-object colors
						materialInfo.color *= objectInfo.color.rgb;
						materialInfo.opacity *= objectInfo.color.a;

						let view = - ray.direction;
						var vertexData = ${o}( hitResult.barycoord, hitResult.indices.xyz );
						vertexData.normal = normalize( transpose( objectInfo.inverseMatrixWorld ) * vertexData.normal );
						vertexData.tangent = vec4f( ( objectInfo.matrixWorld * vec4f( vertexData.tangent.xyz, 0.0 ) ).xyz, vertexData.tangent.w );
						vertexData.position = objectInfo.matrixWorld * vertexData.position;

						// blur glossy surfaces after low-probability bounces to suppress fireflies,
						// from the Cycles "filter glossy" approach in integrator/surface_shader.h
						// The smallest pdf seen along the path for the glossy filter is tracked below
						let blurRoughness = sqrt( clamp( 1.0 - filterGlossy * minPdf, 0.0, 1.0 ) ) * 0.5;

						var surface = ${n}( materialInfo, vertexData, hitResult.side, hitResult.normal, view, blurRoughness );

						// Stochastically pass through partially transparent surfaces by restarting
						// the ray at the hit point, advancing the rng but not the bounce count.
						if ( ${wt}( ${No} ) > surface.opacity ) {

							// stop once the transparent bounces run out
							if ( transparentBounce >= maxTransparentBounces ) {

								break;

							}

							ray.origin = ${tr}( vertexData.position.xyz, ray.direction, hitResult.normal );
							${ja}();
							transparentBounce ++;
							bounce --;
							continue;

						}

						let isDispersive = materialInfo.dispersion > 0.0 && surface.ior > 1.0 && surface.transmission > 0.0 && ! surface.thinWall;
						if ( isDispersive ) {

							let wavelength = abs( dispersionWavelength );
							${Yo}( &surface, materialInfo.dispersion, wavelength );
							if ( dispersionWavelength < 0.0 ) {

								dispersionWavelength = wavelength;
								throughputColor *= ${Ko}( wavelength );

							}

						}

						// attenuate the light transmitted through the volume when exiting a backface
						if ( hitResult.side < 0.0 && materialInfo.transmission > 0.0 ) {

							throughputColor *= ${jo}( hitResult.dist, materialInfo.attenuationColor, materialInfo.attenuationDistance );

						}

						// emission, clamped at the depth of the segment that found it, as in Cycles
						let emission = ${Te}( throughputColor * surface.emission, bounce, clampDirect, clampIndirect );
						resultColor += vec4f( emission, 0.0 );

						// next event estimation: choose one light or the environment by its estimated
						// contribution
						if ( misEnabled != 0u ) {

							let ruv = ${si}( ${Ro} );
							var selectionPdf = 0.0;
							let lightIndex = ${S}( vertexData.position.xyz, envWeight, ruv.x, &selectionPdf );
							if ( selectionPdf > 0.0 ) {

								var lightRec: ${We};
								if ( envActive && lightIndex == lightsCount ) {

									// the environment, sampled from its CDF, as a light of kind ENVIRONMENT
									let envSample = ${d}( ruv.yz );
									lightRec.direction = envSample.direction;
									lightRec.emission = envSample.color;
									lightRec.pdf = envSample.pdf;
									lightRec.dist = ${rr};
									lightRec.lightType = ${ln};

								} else {

									lightRec = ${m}( lightIndex, vertexData.position.xyz, ruv.yz );

								}

								if ( lightRec.pdf > 0.0 ) {

									let evalRec = ${f}( view, lightRec.direction, surface );
									if ( evalRec.pdf > 0.0 ) {

										var shadowRay: ${z};
										shadowRay.origin = ${tr}( vertexData.position.xyz, lightRec.direction, hitResult.normal );
										shadowRay.direction = lightRec.direction;
										shadowRay.maxDist = lightRec.dist * ( 1.0 - ${zo} );

										// opaque occlusion up to the light distance. A shadow-specific any hit
										// traversal could support tinted shadows from transmissive and partially
										// opaque objects
										var shadowHit: ${t};
										let occluded = ${i}( shadowRay, &shadowHit );
										if ( ! occluded ) {

											let lightPdf = lightRec.pdf * selectionPdf;

											// env + area lights are also bsdf-sampled, so MIS-weight them - punctual lights take full weight,
											// or when a bsdf ray could never reach the light
											let isMISWeighted = ${Uo}( lightRec.lightType ) && ! shadowHit.forwardBlocked;
											let misWeight = select( 1.0, ${Tt}( lightPdf, evalRec.pdf ), isMISWeighted );
											let directLight = throughputColor * lightRec.emission * evalRec.color * misWeight / lightPdf;
											let contribution = ${Te}( directLight, bounce + 1u, clampDirect, clampIndirect );
											resultColor += vec4f( contribution, 0.0 );

										}

									}

								}

							}

						}

						let scatterRec = ${l}( view, surface );
						if ( ${li}( scatterRec ) ) {

							break;

						}

						isFullyTransmissive = isFullyTransmissive && scatterRec.isTransmissive;

						// track the smallest pdf seen along the path for the glossy filter
						minPdf = min( minPdf, scatterRec.pdf );

						// russian roulette early out:
						// Matches Cycles path_state_continuation_probability in integrator/path_state.h
						if ( bounce >= 3u ) {

							let rrThroughput = throughputColor * scatterRec.color / scatterRec.pdf;
							let rrProb = saturate( sqrt( max( max( rrThroughput.r, rrThroughput.g ), rrThroughput.b ) ) );
							if ( rrProb <= 0.0 || ${wt}( ${$o} ) > rrProb ) {

								break;

							}

							throughputColor /= rrProb;

						}

						throughputColor *= scatterRec.color;
						throughputColor /= scatterRec.pdf;
						bsdfPdf = scatterRec.pdf;

						// exit if our throughput is 0.0
						if ( all( throughputColor == vec3f( 0.0 ) ) ) {

							break;

						}

						ray.origin = ${tr}( vertexData.position.xyz, scatterRec.direction, hitResult.normal );
						ray.direction = scatterRec.direction;
						ray.maxDist = 0.0;

					} else {

						if ( bounce > 0u && ! isFullyTransmissive ) {

							var misWeight = 1.0;
							if ( isMISWeighted && envActive ) {

								// match the env pdf scaling used by the NEE selection so the two estimators balance
								let envPdf = ${h}( ray.direction ) * envWeight / lightTotalWeight;
								misWeight = ${Tt}( bsdfPdf, envPdf );

							}

							let environment = ${p}( ray.direction ).rgb * throughputColor * misWeight;
							let contribution = ${Te}( environment, bounce, clampDirect, clampIndirect );
							resultColor += vec4f( contribution, 0.0 );

						} else {

							// hit the background
							// support multiple transparent background blending techniques
							let rng = ${ft}( ${Ao} );
							let bg = ${x}( ray.direction, rng );
							if ( bounce == 0u ) {

								// sample the background directly if this is the primary ray
								let background = ${Te}( bg.a * bg.rgb, bounce, clampDirect, clampIndirect );
								resultColor = vec4f( background, bg.a );

							} else {

								// transmissive ray handling
								let env = ${p}( ray.direction );
								let avg = saturate( dot( throughputColor, vec3f( 1.0 / 3.0 ) ) );
								let transparency = ( 1.0 - bg.a ) * avg;
								var envMisWeight = 1.0;
								if ( misEnabled != 0u && ${c} > 0.0 ) {

									let envPdf = ${h}( ray.direction );
									envMisWeight = ${Tt}( bsdfPdf, envPdf );

								}

								if ( transmissiveBackground == ${Jo}u ) {

									// display the env map through transmissive surfaces
									let background = ${Te}( env.rgb * throughputColor * envMisWeight, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0,
									);

								} else if ( transmissiveBackground == ${es}u ) {

									// fade the background by the throughput color average
									let background = ${Te}( bg.a * bg.rgb * throughputColor * envMisWeight, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								} else {

									// fade the background by the throughput color average, mixing in env lighting
									var light = mix( env.rgb, bg.rgb, bg.a ) * envMisWeight;
									let background = ${Te}( light * throughputColor, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								}

							}

						}

						break;

					}

					${ja}();

				}

				// visible lights are opaque against a transparent background
				resultColor += vec4f( lightHits, 0.0 );
				if ( cameraHitLight ) {

					resultColor.a = 1.0;

				}

				let nextSampleCount = sampleCount + 1;
				// store the color rows top down to match a rasterized render target
				let colorIndex = vec2u( indexUV.x, targetDimensions.y - 1u - indexUV.y );

				let prevColor = textureLoad( ${e.prevOutputTarget}, colorIndex );
				let blendedColor = ${Lo}( prevColor, resultColor, 1.0 / f32( nextSampleCount ) );
				textureStore( ${e.sampleCountTarget}, indexUV, vec4( nextSampleCount ) );
				textureStore( ${e.outputTarget}, colorIndex, blendedColor );

			}`;super(I(e)),this.defineUniformAccessors(e)}};function rs(s){let e=new Uint16Array(s.length);for(let t=0,r=s.length;t<r;++t)e[t]=Xe.toHalfFloat(s[t]);return e}function Of(s,e,t=0,r=s.length){let i=t,o=t+r-1;for(;i<o;){let n=i+o>>1;s[n]<e?i=n+1:o=n}return i-t}function om(s,e,t){return .2126*s+.7152*e+.0722*t}function sm(s,e=Be){let t=s.clone();t.source=new fc({...t.image});let{width:r,height:i,data:o}=t.image,n=o;if(t.type!==e){e===Be?n=new Uint16Array(o.length):n=new Float32Array(o.length);let a;o instanceof Int8Array||o instanceof Int16Array||o instanceof Int32Array?a=2**(8*o.BYTES_PER_ELEMENT-1)-1:a=2**(8*o.BYTES_PER_ELEMENT)-1;for(let l=0,f=o.length;l<f;l++){let c=o[l];t.type===Be&&(c=Xe.fromHalfFloat(o[l])),t.type!==ze&&t.type!==Be&&(c/=a),e===Be&&(n[l]=Xe.toHalfFloat(c))}t.image.data=n,t.type=e}if(t.flipY){let a=n;n=n.slice();for(let l=0;l<i;l++)for(let f=0;f<r;f++){let c=i-l-1,u=4*(l*r+f),p=4*(c*r+f);n[p+0]=a[u+0],n[p+1]=a[u+1],n[p+2]=a[u+2],n[p+3]=a[u+3]}t.flipY=!1,t.image.data=n}return t}var is=class{constructor(){let e=new ye(rs(new Float32Array([0,0,0,0])),1,1);e.type=Be,e.format=Se,e.minFilter=_e,e.magFilter=_e,e.wrapS=Ke,e.wrapT=Ke,e.generateMipmaps=!1,e.needsUpdate=!0;let t=new ye(rs(new Float32Array([0,1])),1,2);t.type=Be,t.format=zi,t.minFilter=_e,t.magFilter=_e,t.generateMipmaps=!1,t.needsUpdate=!0;let r=new ye(rs(new Float32Array([0,0,1,1])),2,2);r.type=Be,r.format=zi,r.minFilter=_e,r.magFilter=_e,r.generateMipmaps=!1,r.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=r,this.totalSum=0}getPixelWeight(e,t,r){return om(e,t,r)}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){let t=sm(e);t.wrapS=Ke,t.wrapT=hr;let{width:r,height:i,data:o}=t.image,n=new Float32Array(r*i),a=new Float32Array(r*i),l=new Float32Array(i),f=new Float32Array(i),c=0,u=0;for(let x=0;x<i;x++){let b=0;for(let m=0;m<r;m++){let v=x*r+m,y=Xe.fromHalfFloat(o[4*v+0]),w=Xe.fromHalfFloat(o[4*v+1]),S=Xe.fromHalfFloat(o[4*v+2]),T=this.getPixelWeight(y,w,S,x,i);b+=T,c+=T,n[v]=T,a[v]=b}if(b!==0)for(let m=x*r,v=x*r+r;m<v;m++)n[m]/=b,a[m]/=b;u+=b,l[x]=b,f[x]=u}if(u!==0)for(let x=0,b=l.length;x<b;x++)l[x]/=u,f[x]/=u;let p=new Uint16Array(i),d=new Uint16Array(r*i);for(let x=0;x<i;x++){let b=(x+1)/i,m=Of(f,b);p[x]=Xe.toHalfFloat((m+.5)/i)}for(let x=0;x<i;x++)for(let b=0;b<r;b++){let m=x*r+b,v=(b+1)/r,y=Of(a,v,x*r,r);d[m]=Xe.toHalfFloat((y+.5)/r)}this.dispose();let{marginalWeights:h,conditionalWeights:g}=this;h.image={width:i,height:1,data:p},h.needsUpdate=!0,g.image={width:r,height:i,data:d},g.needsUpdate=!0,this.totalSum=c,this.map=t}};var zf=$(`

	fn equirectLuminancePdf( luminance: f32, totalWeight: f32, resolution: vec2u ) -> f32 {

		return f32( resolution.x * resolution.y ) * luminance / ( 2.0 * PI * PI * totalWeight );

	}

`,[K]),mi=class extends is{constructor(){super(),this.mapNode=he(this.map),this.mapSampler=xt(this.mapNode),this.marginalNode=he(this.marginalWeights),this.marginalSampler=xt(this.marginalNode),this.conditionalNode=he(this.conditionalWeights),this.conditionalSampler=xt(this.conditionalNode),this.rotationNode=N(new Fn),this.intensityNode=N(1),this.totalSumNode=N(this.totalSum),this._initFns()}getPixelWeight(e,t,r,i,o){let n=Math.PI*(i+.5)/o;return super.getPixelWeight(e,t,r)*Math.sin(n)}updateFrom(e){super.updateFrom(e);let{mapNode:t,marginalNode:r,conditionalNode:i,totalSumNode:o}=this;t.value=this.map,r.value=this.marginalWeights,i.value=this.conditionalWeights,o.value=this.totalSum}_initFns(){let{mapNode:e,mapSampler:t,marginalNode:r,marginalSampler:i,conditionalNode:o,conditionalSampler:n,totalSumNode:a,rotationNode:l,intensityNode:f}=this;this.sampleColor=C`
			fn sampleEnv( direction: vec3f ) -> vec4f {

				let sampleDir = ${l} * direction;
				let mapUv = ${ci}( sampleDir );
				let col = textureSampleLevel( ${e}, ${t}, mapUv, 0 );

				return vec4f( ${f} * col.rgb, col.a );

			}
		`,this.sampleDir=C`
			fn sampleEnvDir( r: vec2f ) -> ${Ka} {

				var result: ${Ka};

				// walk the CDF: marginal picks the row (v), conditional picks the column (u)
				let v = textureSampleLevel( ${r}, ${i}, vec2f( r.x, 0.0 ), 0 ).x;
				let u = textureSampleLevel( ${o}, ${n}, vec2f( r.y, v ), 0 ).x;
				let uv = vec2f( u, v );
				let totalSum = ${a};

				let direction = ${wf}( uv );
				let color = textureSampleLevel( ${e}, ${t}, uv, 0 ).rgb;

				result.direction = transpose( ${l} ) * direction;
				result.color = color * ${f};

				if ( totalSum != 0.0 ) {

					let lum = ${an}( color );
					let resolution = textureDimensions( ${e} );
					result.pdf = ${zf}( lum, totalSum, resolution );

				} else {

					result.pdf = 0.0;

				}

				return result;

			}
		`,this.getWeight=C`
			fn getEnvWeight() -> f32 {

				let resolution = textureDimensions( ${e} );
				return ${f} * ${Dt} * ${Dt} * ${a} / ( 2.0 * f32( resolution.x * resolution.y ) );

			}
		`,this.getDirPdf=C`
			fn getEnvDirPdf( direction: vec3f ) -> f32 {

				if ( ${a} == 0.0 ) {

					return 0.0;

				}

				let rotatedDir = ${l} * direction;
				let mapUv = ${ci}( rotatedDir );
				let color = textureSampleLevel( ${e}, ${t}, mapUv, 0 ).rgb;
				let lum = ${an}( color );
				let resolution = textureDimensions( ${e} );

				return ${zf}( lum, ${a}, resolution );

			}
		`}};var gi=class{get map(){return this.mapNode.value}set map(e){this.mapNode.value=e}get blur(){return this.blurNode.value}set blur(e){this.blurNode.value=e}get rotation(){return this.rotationNode.value}get intensity(){return this.intensityNode.value}set intensity(e){this.intensityNode.value=e}constructor(){let e=new ye(new Uint8Array([0,0,0,255]),1,1,Se);e.minFilter=_e,e.magFilter=_e,e.wrapS=Ke,e.wrapT=Ke,e.generateMipmaps=!1,e.needsUpdate=!0,this.mapNode=he(e),this.mapSampler=xt(this.mapNode),this.blurNode=N(0),this.rotationNode=N(new k),this.intensityNode=N(1),this._initFns()}dispose(){this.map.dispose()}_initFns(){let{mapNode:e,mapSampler:t,blurNode:r,rotationNode:i,intensityNode:o}=this;this.sampleColor=C`
			fn sampleBackground( direction: vec3f, uv: vec2f ) -> vec4f {

				let rotatedDir = ( ${i} * vec4f( direction, 0.0 ) ).xyz;
				let offsetDir = ${bf}( rotatedDir, uv ) * 0.5 * ${r};
				let sampleDir = normalize( rotatedDir + offsetDir );

				let mapUv = ${ci}( sampleDir );
				let col = textureSampleLevel( ${e}, ${t}, mapUv, 0 );

				return vec4f( ${o} * col.rgb, col.a );

			}
		`}};var am=4096,Uf=new En,Vf=new Fn;function Hf(s){return`${s.source.uuid}:${s.source.version}`}function lm(s,e,t,r){if(s[e].x+t>r)return-1;let o=t,n=0,a=e;for(;o>0;){if(a>=s.length)return-1;n=Math.max(n,s[a].y),o-=s[a].width,a++}return n}function cm(s,e,t,r){let i=e+r,o=[],n=!1;for(let a=0;a<s.length;a++){let l=s[a],f=l.x+l.width;f<=e?o.push(l):l.x>=i?(n||(o.push({x:e,y:t,width:r}),n=!0),o.push(l)):(n||(o.push({x:e,y:t,width:r}),n=!0),f>i&&o.push({x:i,y:l.y,width:f-i}))}n||o.push({x:e,y:t,width:r}),s.length=0;for(let a=0;a<o.length;a++){let l=o[a],f=s[s.length-1];f&&f.y===l.y&&f.x+f.width===l.x?f.width+=l.width:s.push(l)}}function Wf(s,e,t,r,i){let o=1/0,n=0,a=-1;for(let l=0;l<s.length;l++){let f=lm(s,l,e,r);f>=0&&f+t<=i&&f<o&&(o=f,n=s[l].x,a=l)}return a===-1?null:(cm(s,n,o+t,e),{x:n,y:o})}var xi=class{get width(){return this.renderTarget.width}get height(){return this.renderTarget.height}get pageCount(){return this.renderTarget.depth}get texture(){return this.renderTarget.texture}constructor(e={}){this.renderTarget=new Mn(1,1,{depthBuffer:!1,depth:1,...e}),this.texture.isArrayTexture=!0,this.textureInfo=[new ot],this.hashes=[],this.placements=[],this.quadMesh=new Tc(new mc),this.quadMesh.material.blending=Vr}setTextures(e,t){let r=t.map((u,p)=>p);if(r.sort((u,p)=>t[u].source.uuid<t[p].source.uuid?-1:1),t=r.map(u=>t[u]),this._hashesMatch(t)){this._buildCallerTextureInfo(r);return}let i=t.reduce((u,p)=>Math.max(u,p.width,p.height),1);i=Math.min(am,i);let o=i,n=i,{renderTarget:a}=this,{placements:l,pageCount:f}=this._packTextures(t,o,n);a.setSize(o,n,f),this.texture.isArrayTexture=!0,this._renderTextures(e,t,l),this.placements=l;let c=new Array(t.length);for(let u=0,p=t.length;u<p;u++){let d=Hf(t[u]);c[u]=d}this.hashes=c,this._buildCallerTextureInfo(r)}_buildCallerTextureInfo(e){let t=new Array(e.length);for(let r=0,i=e.length;r<i;r++)t[e[r]]=this.placements[r];this._buildTextureInfo(t)}dispose(){this.renderTarget.dispose(),this.quadMesh.material.dispose()}_hashesMatch(e){let t=this.hashes;if(t.length!==e.length)return!1;for(let r=0,i=e.length;r<i;r++)if(t[r]!==Hf(e[r]))return!1;return!0}_packTextures(e,t,r){let i=[];for(let l=0,f=e.length;l<f;l++){let c=e[l];i.push({index:l,w:Math.min(c.width,t),h:Math.min(c.height,r)})}let o=i.sort((l,f)=>f.h-l.h),n=new Array(e.length),a=[];for(let l=0,f=o.length;l<f;l++){let c=o[l],u=null,p=-1;for(let d=0;d<a.length;d++)if(u=Wf(a[d],c.w,c.h,t,r),u){p=d;break}if(!u){let d=[{x:0,y:0,width:t}];u=Wf(d,c.w,c.h,t,r),a.push(d),p=a.length-1}n[c.index]={x:u.x,y:u.y,w:c.w,h:c.h,page:p}}return{placements:n,pageCount:Math.max(a.length,1)}}_buildTextureInfo(e){let t=this.textureInfo;t.length=0;for(let r=0,i=e.length;r<i;r++){let{x:o,y:n,w:a,h:l,page:f}=e[r],c=new ot;c.x=o&65535|(n&65535)<<16,c.y=a&65535|(l&65535)<<16,c.z=f&65535,c.w=0,t.push(c)}t.length===0&&t.push(new ot(0,0,0,0))}_renderTextures(e,t,r){let{quadMesh:i,renderTarget:o,width:n,height:a}=this,l=e.getRenderTarget(),f=e.toneMapping,c=e.autoClear,u=e.getScissorTest(),p=e.getClearAlpha();e.getClearColor(Uf),e.toneMapping=$t,e.autoClear=!1,e.setScissorTest(!0),e.setClearColor(0,0);for(let d=0,h=o.depth;d<h;d++)o.viewport.set(0,0,n,a),o.scissor.set(0,0,n,a),e.setRenderTarget(o,d),e.clear();for(let d=0,h=t.length;d<h;d++){let{x:g,y:x,w:b,h:m,page:v}=r[d],y=t[d];if(o.viewport.set(g,x,b,m),o.scissor.set(g,x,b,m),e.setRenderTarget(o,v),y.isRenderTargetTexture){let w=y.matrixAutoUpdate;Vf.copy(y.matrix),y.matrix.identity(),y.matrixAutoUpdate=!1,i.material.map=y,i.render(e),y.matrixAutoUpdate=w,y.matrix.copy(Vf)}else{let w=y.clone();w.matrixAutoUpdate=!1,w.matrix.identity(),i.material.map=w,i.render(e),w.dispose()}}o.viewport.set(0,0,n,a),o.scissor.set(0,0,n,a),i.material.map=null,e.setClearColor(Uf,p),e.setScissorTest(u),e.autoClear=c,e.setRenderTarget(l),e.toneMapping=f}};function Gf(s){let e=0;if(s.byteLength!==0){let t=new Uint8Array(s);for(let r=0;r<s.byteLength;r++){let i=t[r];e=(e<<5)-e+i,e|=0}}return e}var sl=6,um=11,fm=0,pm=1,dm=2,hm=3,mm=4,pt=new F,Le=new F,qf=new k,yi=new uc,jf=new F,St=new F,gm=new F(0,1,0),ns=class{constructor(){let e=new ye(new Float32Array(4),1,1);e.format=Se,e.type=ze,e.wrapS=hr,e.wrapT=hr,e.generateMipmaps=!1,e.minFilter=nt,e.magFilter=nt,this.tex=e,this.count=0}updateFrom(e,t=[]){let r=this.tex,i=Math.max(e.length*sl,1),o=Math.ceil(Math.sqrt(i));r.image.width!==o&&(r.dispose(),r.image.data=new Float32Array(o*o*4),r.image.width=o,r.image.height=o);let n=r.image.data;for(let l=0,f=e.length;l<f;l++){let c=e[l],u=l*sl*4,p=0;for(let h=0;h<sl*4;h++)n[u+h]=0;c.getWorldPosition(Le),n[u+p++]=Le.x,n[u+p++]=Le.y,n[u+p++]=Le.z;let d=fm;if(c.isRectAreaLight&&c.isCircular?d=pm:c.isSpotLight?d=dm:c.isDirectionalLight||c.isSunLight?d=hm:c.isPointLight&&(d=mm),n[u+p++]=d,n[u+p++]=c.color.r,n[u+p++]=c.color.g,n[u+p++]=c.color.b,n[u+p++]=c.intensity,c.getWorldQuaternion(yi),c.isRectAreaLight)pt.set(c.width,0,0).applyQuaternion(yi),n[u+p++]=pt.x,n[u+p++]=pt.y,n[u+p++]=pt.z,p++,Le.set(0,c.height,0).applyQuaternion(yi),n[u+p++]=Le.x,n[u+p++]=Le.y,n[u+p++]=Le.z,n[u+p++]=pt.cross(Le).length()*(c.isCircular?Math.PI/4:1);else if(c.isSpotLight){let h=c.radius||0;jf.setFromMatrixPosition(c.matrixWorld),St.setFromMatrixPosition(c.target.matrixWorld),qf.lookAt(jf,St,gm),yi.setFromRotationMatrix(qf),pt.set(1,0,0).applyQuaternion(yi),n[u+p++]=pt.x,n[u+p++]=pt.y,n[u+p++]=pt.z,p++,Le.set(0,1,0).applyQuaternion(yi),n[u+p++]=Le.x,n[u+p++]=Le.y,n[u+p++]=Le.z,n[u+p++]=Math.PI*h*h,n[u+p++]=h,n[u+p++]=c.decay,n[u+p++]=c.distance,n[u+p++]=Math.cos(c.angle),n[u+p++]=Math.cos(c.angle*(1-c.penumbra)),n[u+p++]=c.iesMap?t.indexOf(c.iesMap):-1}else if(c.isPointLight){let h=pt.setFromMatrixPosition(c.matrixWorld);n[u+p++]=h.x,n[u+p++]=h.y,n[u+p++]=h.z,p++,p+=4,p+=1,n[u+p++]=c.decay,n[u+p++]=c.distance}else if(c.isDirectionalLight){let h=pt.setFromMatrixPosition(c.matrixWorld),g=Le.setFromMatrixPosition(c.target.matrixWorld);St.subVectors(h,g).normalize(),n[u+p++]=St.x,n[u+p++]=St.y,n[u+p++]=St.z}else c.isSunLight&&(St.setFromMatrixPosition(c.matrixWorld).normalize(),n[u+p++]=St.x,n[u+p++]=St.y,n[u+p++]=St.z);n[u+um]=c.visibleToCameraRays?1:0}this.count=e.length;let a=Gf(n.buffer);return this.hash!==a?(this.hash=a,r.needsUpdate=!0,!0):!1}};var vi=class extends ns{constructor(){super(),this.countNode=N(this.count,"uint"),this.buffer=new L(new Float32Array(2*zt.getLength()),zt.getLength()),this.bufferNode=O(this.buffer,zt).toReadOnly().setName("lights"),this.iesAtlas=new xi({type:Be}),this.iesProfilesNode=he(this.iesAtlas.texture),this.iesInfoNode=gr(this.iesAtlas.textureInfo,"uvec4"),this._initFns()}updateFrom(e,t){let r=Array.from(new Set(t.map(c=>c.iesMap).filter(c=>c))),i=super.updateFrom(t,r);this.iesAtlas.setTextures(e,r),this.iesProfilesNode.value=this.iesAtlas.texture;let o=zt.getLength(),n=this.count,a=Math.max(n,2);this.buffer.array.length!==a*o&&(this.buffer.dispose(),this.buffer=new L(new Float32Array(a*o),o),this.bufferNode.value=this.buffer);let l=this.tex.image.data;this.buffer.array.set(l.subarray(0,n*o));let f=new Int32Array(this.buffer.array.buffer);for(let c=0;c<n;c++){let u=c*o;f[u+3]=Math.round(l[u+3]),f[u+11]=Math.round(l[u+11]),f[u+21]=Math.round(l[u+21])}return this.buffer.needsUpdate=!0,this.countNode.value=this.count,i}_initFns(){let{bufferNode:e,countNode:t,iesProfilesNode:r,iesInfoNode:i}=this,o=Eo(i,r,"sampleIesTexel");this.isLightVisibleToCamera=C`
			fn isLightVisibleToCamera( index: u32 ) -> bool {

				return ${e}[ index ].visibleToCameraRays != 0;

			}
		`,this.getLightWeight=C`
			fn getLightWeight( index: u32, position: vec3f ) -> f32 {

				let light = ${e}[ index ];
				let power = ${an}( light.color * light.intensity );
				if ( light.lightType == ${Za} ) {

					// the most any point on the spot's disc lights the position. Ies profiles are not
					// evaluated here
					let nearest = ${Cf}( light, position );
					var attenuation = 1.0;
					if ( light.iesProfile < 0 ) {

						attenuation = ${tl}( light.coneCos, light.penumbraCos, nearest.x );

					}

					return power * attenuation * ${Vo}( nearest.y, light.distance, light.decay );

				} else if ( light.lightType == ${el} ) {

					// the point light's world position is packed into the u slot
					let dist = length( light.u - position );
					return power * ${Vo}( dist, light.distance, light.decay );

				} else if ( light.lightType == ${Ja} ) {

					return power;

				} else {

					let toLight = light.position - position;
					let distSq = dot( toLight, toLight );
					if ( distSq == 0.0 ) {

						return 0.0;

					}

					// area lights only emit from their front face, and the distance is held above the size
					// of the light so positions on or near it do not dominate
					let normal = normalize( cross( light.u, light.v ) );
					let cosTheta = dot( toLight, normal ) * inverseSqrt( distSq );
					return power * light.area * max( cosTheta, 0.0 ) / max( distSq, light.area );

				}

			}
		`,this.getLightsWeight=C`
			fn getLightsWeight( position: vec3f ) -> f32 {

				var total = 0.0;
				for ( var i = 0u; i < ${t}; i ++ ) {

					total += ${this.getLightWeight}( i, position );

				}

				return total;

			}
		`,this.selectLight=C`
			fn selectLight( position: vec3f, envWeight: f32, r: f32, selectionPdf: ptr<function, f32> ) -> u32 {

				let count = ${t};
				let totalWeight = ${this.getLightsWeight}( position ) + envWeight;
				if ( totalWeight <= 0.0 ) {

					*selectionPdf = 0.0;
					return 0u;

				}

				let targetWeight = r * totalWeight;
				var accumulated = 0.0;
				var lastWeighted = 0u;
				var index = count;
				for ( var i = 0u; i < count; i ++ ) {

					let lightWeight = ${this.getLightWeight}( i, position );
					accumulated += lightWeight;
					if ( lightWeight > 0.0 ) {

						lastWeighted = i;

					}

					if ( targetWeight < accumulated ) {

						index = i;
						break;

					}

				}

				// rounding can carry the target past the last light when there is no environment
				if ( index == count && envWeight <= 0.0 ) {

					index = lastWeighted;

				}

				var weight = envWeight;
				if ( index < count ) {

					weight = ${this.getLightWeight}( index, position );

				}

				*selectionPdf = weight / totalWeight;
				return index;

			}
		`,this.randomLightSample=C`
			fn randomLightSample( lightIndex: u32, rayOrigin: vec3f, ruv: vec2f ) -> ${We} {

				let light = ${e}[ lightIndex ];

				var result: ${We};
				if ( light.lightType == ${Za} ) {

					result = ${If}( light, rayOrigin, ruv );

					let spotNormal = normalize( cross( light.u, light.v ) );
					let cosTheta = dot( result.direction, spotNormal );
					var spotAttenuation: f32;
					if ( light.iesProfile >= 0 ) {

						// half a texel of the profile's tile in the atlas
						let profileInfo = ${i}[ u32( light.iesProfile ) ];
						let texelInset = 0.5 / vec2f( vec2u( profileInfo.y & 0xFFFFu, profileInfo.y >> 16u ) );

						// tilt spans [ 0, 180 ]deg inset to the texel centers, twist covers [ 0, 359 ]deg and wraps
						let tiltAngle = mix( texelInset.x, 1.0 - texelInset.x, acos( cosTheta ) / PI );
						let twistAngle = ( atan2( dot( result.direction, light.v ), dot( result.direction, light.u ) ) + PI ) / ( 2.0 * PI ) + texelInset.y;
						let packedProfile = ( 1 << 26 ) | light.iesProfile;
						spotAttenuation = ${o}( vec2f( tiltAngle, twistAngle ), packedProfile, 0.0 ).r;

					} else {

						spotAttenuation = ${tl}( light.coneCos, light.penumbraCos, cosTheta );

					}

					result.emission *= spotAttenuation;

				} else if ( light.lightType == ${el} ) {

					// the point light's world position is packed into the u slot
					let lightRay = light.u - rayOrigin;
					let lightDist = length( lightRay );
					let cutoffDistance = light.distance;
					var distanceFalloff = 1.0 / max( pow( lightDist, light.decay ), 0.01 );
					if ( cutoffDistance > 0.0 ) {

						let window = clamp( 1.0 - pow( lightDist / cutoffDistance, 4.0 ), 0.0, 1.0 );
						distanceFalloff *= window * window;

					}

					result.direction = normalize( lightRay );
					result.dist = lightDist;
					result.pdf = 1.0;
					result.emission = light.color * light.intensity * distanceFalloff;
					result.lightType = light.lightType;

				} else if ( light.lightType == ${Ja} ) {

					// the directional light's direction is packed into the u slot
					result.dist = ${rr};
					result.direction = light.u;
					result.pdf = 1.0;
					result.emission = light.color * light.intensity;
					result.lightType = light.lightType;

				} else {

					result = ${Sf}( light, rayOrigin, ruv );

				}

				return result;

			}
		`,this.intersectLightAtIndex=C`
			fn intersectLightAtIndex( rayOrigin: vec3f, rayDirection: vec3f, index: u32, lightRec: ptr<function, ${We}> ) -> bool {

				let light = ${e}[ index ];

				var u = light.u;
				var v = light.v;
				let normal = normalize( cross( u, v ) );

				// only front-facing area lights can be hit
				if ( dot( normal, rayDirection ) > 0.0 ) {

					u *= 1.0 / dot( u, u );
					v *= 1.0 / dot( v, v );

					var dist = - 1.0;
					if ( light.lightType == ${ko} ) {

						dist = ${_f}( light.position, normal, u, v, rayOrigin, rayDirection );

					} else if ( light.lightType == ${Oo} ) {

						dist = ${Tf}( light.position, normal, u, v, rayOrigin, rayDirection );

					}

					if ( dist > 0.0 ) {

						let cosTheta = dot( rayDirection, normal );
						lightRec.dist = dist;
						lightRec.pdf = ( dist * dist ) / ( light.area * cosTheta );
						lightRec.emission = light.color * light.intensity;
						lightRec.direction = rayDirection;
						lightRec.lightType = light.lightType;
						return true;

					}

				}

				return false;

			}
		`}dispose(){this.tex.dispose(),this.buffer.dispose(),this.iesAtlas.dispose()}};var fn=class extends ne{constructor(){let e={globalId:fe,outputTarget:Ee(new ue(1,1)).toWriteOnly()},t=C`
			fn compute( globalId: vec3u ) -> void {

				textureStore( ${e.outputTarget}, globalId.xy, vec4( 0, 0, 0, 1 ) );

			}
		`;super(t(e)),this.defineUniformAccessors({target:e.outputTarget})}};var bi=class{constructor(e){this.renderer=e,this.maxBounces=15,this.frameBudget=25e4,this.maxTransparentBounces=15,this.lowResMode=!1,this.maxSamples=0,this._renderTask=null,this.outputTarget=new ue(1,1),this.outputTarget.format=Se,this.outputTarget.type=ze,this.outputTarget.colorSpace=na.workingColorSpace,this.outputTarget.name="Output #0",this.outputTarget.generateMipmaps=!1,this.prevOutputTarget=new ue(1,1),this.prevOutputTarget.format=Se,this.prevOutputTarget.type=ze,this.prevOutputTarget.colorSpace=na.workingColorSpace,this.prevOutputTarget.name="Output #1",this.prevOutputTarget.generateMipmaps=!1,this.sampleCountTarget=new ue(1,1),this.sampleCountTarget.format=lc,this.sampleCountTarget.type=ac,this.sampleCountTarget.name="Sample Count",this.sampleCountTarget.generateMipmaps=!1,this.sampleCountClearKernel=new fn().setWorkgroupSize(8,8,1),this.outputTargetClearKernel=new fn().setWorkgroupSize(8,8,1)}setRandom(e){}setBVHData(e){}setTextures(e){}setMaterial(e){}setFilterGlossy(e){}setClamping(e,t){}setEnvironment(e,t,r){}setLights(e){}setBackground(e,t,r,i){}rebuild(){this._renderTask=null}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t);let{width:r,height:i}=this.outputTarget;return r===e&&i===t?!1:(this.outputTarget.dispose(),this.prevOutputTarget.dispose(),this.sampleCountTarget.dispose(),this.outputTarget=this.outputTarget.clone(),this.prevOutputTarget=this.outputTarget.clone(),this.sampleCountTarget=this.sampleCountTarget.clone(),this.outputTarget.setSize(e,t),this.prevOutputTarget.setSize(e,t),this.sampleCountTarget.setSize(e,t),this.reset(),!0)}getSize(e){let{width:t,height:r}=this.outputTarget;return e.x=t,e.y=r,e}update(){let{renderer:e}=this;e.initialized&&(this._renderTask||(this._renderTask=this.createRenderTask()),this._renderTask.next())}*createRenderTask(){}async getSampleCountsAsync(){return{min:0,max:0,avg:0}}resetSeed(){}reset(){let{renderer:e,outputTargetClearKernel:t,sampleCountClearKernel:r,outputTarget:i,prevOutputTarget:o,sampleCountTarget:n}=this;if(!e.initialized)return;let{width:a,height:l}=i,f=t.getDispatchSize(a,l);t.target=i,e.compute(t.kernel,f),t.target=o,e.compute(t.kernel,f),r.target=n,e.compute(r.kernel,f),this._renderTask=null}dispose(){this.outputTarget.dispose(),this.prevOutputTarget.dispose(),this.sampleCountTarget.dispose(),this.sampleCountClearKernel.dispose(),this.outputTargetClearKernel.dispose(),this._renderTask=null}};var al=new X,os=class extends bi{constructor(e){super(e),this.envInfo=new mi,this._completedSamples=0,this._tileProgress=0,this.kernel=new ts().setWorkgroupSize(8,8,1),this.kernel.envInfo=this.envInfo,this.backgroundInfo=new gi,this.kernel.backgroundInfo=this.backgroundInfo,this.lightsInfo=new vi,this.kernel.lightsInfo=this.lightsInfo}resetSeed(){this.kernel.seed=0}reset(){super.reset(),this._completedSamples=0,this._tileProgress=0}async getSampleCountsAsync(){if(this.lowResMode)return{min:0,max:0,avg:0};let e=this._completedSamples,t=this._tileProgress;return{min:t===1?e+1:e,max:e+1,avg:e+t}}setBVHData(e){this.kernel.bvhData=e,this.rebuild()}rebuild(){super.rebuild(),this.kernel.needsUpdate=!0,this.reset()}setRandom(e){this.kernel.context.random=e,this.kernel.needsUpdate=!0,this.reset()}setMaterial(e){this.kernel.material=e.getData(),this.kernel.needsUpdate=!0,this.reset()}setFilterGlossy(e){this.kernel.filterGlossy=e===0?Go:1/e,this.reset()}setClamping(e,t){this.kernel.clampDirect=e,this.kernel.clampIndirect=t,this.reset()}setEnvironment(e){this.envInfo.updateFrom(e)}setLights(e){this.lightsInfo.updateFrom(this.renderer,e),this.reset()}setMultipleImportanceSampling(e){this.kernel.misEnabled=e?1:0,this.reset()}setEnvironmentParams(e,t){let{envInfo:r}=this,i=new k().makeRotationFromEuler(t).invert();r.rotationNode.value.setFromMatrix4(i),r.intensityNode.value=e}setBackground(e){let{backgroundInfo:t}=this;t.dispose(),t.map=e}setBackgroundParams(e,t,r){let{backgroundInfo:i}=this,o=new k().makeRotationFromEuler(t).invert();i.rotationNode.value.copy(o),i.intensity=e,i.blur=r}setTransmissiveBackground(e){this.kernel.transmissiveBackground=e,this.reset()}*createRenderTask(){let{renderer:e,kernel:t,maxBounces:r,maxTransparentBounces:i,outputTarget:o,sampleCountTarget:n,lowResMode:a}=this,l=new X;t.outputTarget=o,t.sampleCountTarget=n,t.maxBounces=r,t.maxTransparentBounces=i;let f=0;for(;;){if(t.maxSamples=this.maxSamples,this.maxSamples!==0&&f>=this.maxSamples){yield;continue}this.getSize(al);let c=Math.max(1,Math.ceil(al.x*al.y/this.frameBudget));l.x=Math.ceil(Math.sqrt(c)),l.y=Math.ceil(c/l.x);let u=this.lowResMode?1:l.x*l.y,p=0,d=t.tileSize;a?this.getSize(d):this.getSize(d).divide(l).ceil();let h=t.getDispatchSize(d.x,d.y);t.seed+=1,e.copyTextureToTexture(this.outputTarget,this.prevOutputTarget),[this.outputTarget,this.prevOutputTarget]=[this.prevOutputTarget,this.outputTarget],t.prevOutputTarget=this.prevOutputTarget,t.outputTarget=this.outputTarget;for(let g=0;g<l.x;g++)for(let x=0;x<l.y;x++)t.offset.set(g,x).multiply(d),e.compute(t.kernel,h),p=Math.min(p+1,u),this._completedSamples=f,this._tileProgress=p/u,yield;f++}}dispose(){super.dispose(),this.envInfo.dispose(),this.lightsInfo.dispose(),this.kernel.dispose()}};var wi=class extends Q{constructor(e,t,r=[]){super(e,t),this.dependencies=r}setup(e){for(let t of this.dependencies)t.build(e);super.setup(e)}},tt=new Q({throughputColor:"vec3f",currentBounce:"uint",resultColor:"vec4f",emission:"vec3f",scatterPdf:"float",scatterColor:"vec3f",minPdf:"float",origin:"vec3f",isFullyTransmissive:"uint",direction:"vec3f",side:"float",normal:"vec3f",objectIndex:"int",barycoord:"vec3f",pixelIndex:"uint",indices:"vec3u",seed:"uint",lightDirection:"vec3f",lightPdf:"float",lightEmission:"vec3f",lightDist:"float",lightBsdf:"vec3f",lightBsdfPdf:"float",rayIntersectionIndex:"int",shadowRayIntersectionIndex:"int",lightType:"int",dist:"float",alphaDepth:"uint",maxDist:"float",dispersionWavelength:"float"},"RayData"),_i=new Q({origin:"vec3f",pixelIndex:"uint",direction:"vec3f",currentBounce:"uint",seed:"uint",alphaDepth:"uint",maxDist:"float",_alignment0:"uint"},"TraceQueuedRay"),It=new Q({barycoord:"vec3f",objectIndex:"int",position:"vec3f",dist:"float",normal:"vec3f",side:"float",indices:"vec3u",forwardBlocked:"uint"},"TraceResult"),Br=new wi({length:"uint",elements:`array<${_i.name}>`},"RayQueue",[_i]);Br.getLength=()=>4;var Ti=new wi({length:{type:"uint",atomic:!0},elements:`array<${_i.name}>`},"RayQueue",[_i]);Ti.getLength=()=>4;var Rr=new wi({current:{type:"uint",atomic:!0},elementCount:{type:"uint",atomic:!0},elements:"array<atomic<u32>>"},"PixelQueue");Rr.getLength=()=>2;var ll=new wi({current:"uint",elementCount:"uint",elements:"array<u32>"},"PixelQueue");ll.getLength=()=>2;var ss=class extends ne{constructor(){let e={rayDataStorage:O(new L(1,1),tt),pixelQueue:O(new L(1,1),ll),targetDimensions:N(new X),frameBudget:N(0,"uint"),globalId:fe},t=C`
			fn compute( targetDimensions: vec2u, frameBudget: u32, globalId: vec3u ) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let pixelQueue = &${e.pixelQueue};

				if ( globalId.x >= targetDimensions.x || globalId.y >= targetDimensions.y ) {

					return;

				}

				let rayCount = min( frameBudget, arrayLength( rayDataStorage ) );
				let pixelCount = targetDimensions.x * targetDimensions.y;
				if ( globalId.x == 0u && globalId.y == 0u ) {

					pixelQueue.current = 0u;
					pixelQueue.elementCount = select( 0u, pixelCount - rayCount, pixelCount >= rayCount );

				}

				let pixelHash = ( globalId.x << 16 ) | globalId.y;
				let pixelIndex = globalId.x + globalId.y * targetDimensions.x;
				if ( pixelIndex < rayCount ) {

					rayDataStorage[ pixelIndex ].pixelIndex = pixelHash;
					rayDataStorage[ pixelIndex ].resultColor = vec4f( 0.0 );
					rayDataStorage[ pixelIndex ].throughputColor = vec3f( 0.0 );
					rayDataStorage[ pixelIndex ].objectIndex = - 1;
					rayDataStorage[ pixelIndex ].alphaDepth = 0u;
					rayDataStorage[ pixelIndex ].rayIntersectionIndex = - 1;
					rayDataStorage[ pixelIndex ].shadowRayIntersectionIndex = - 1;

				} else {

					pixelQueue.elements[ pixelIndex - rayCount ] = pixelHash;

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};var as=class extends ne{constructor(){let e={envInfo:{value:null},backgroundInfo:{value:null},lightsInfo:{value:null},prevOutputTarget:Ee(new ue(1,1)).toReadOnly(),outputTarget:Ee(new ue(1,1)).toWriteOnly(),sampleCountTarget:Ee(new ue(1,1)).toReadWrite(),misEnabled:N(1,"uint"),rayCount:N(0,"uint"),maxBounces:N(5,"uint"),clampDirect:N(0),clampIndirect:N(10),transmissiveBackground:N(di),rayDataStorage:O(new L(1,1),tt),rayIntersectionsStorage:O(new L(1,1),It),shadowRayIntersectionsStorage:O(new L(1,1),It),globalId:fe},t=Z("envInfo.value.totalSumNode",e),r=Z("envInfo.value.intensityNode",e),i=Z("envInfo.value.sampleColor",e),o=Z("envInfo.value.sampleDir",e),n=Z("envInfo.value.getDirPdf",e),a=Z("envInfo.value.getWeight",e),l=Z("backgroundInfo.value.sampleColor",e),f=Z("lightsInfo.value.countNode",e),c=Y("lightsInfo.value.randomLightSample",e),u=Y("lightsInfo.value.intersectLightAtIndex",e),p=Y("lightsInfo.value.getLightWeight",e),d=Y("lightsInfo.value.getLightsWeight",e),h=Y("lightsInfo.value.selectLight",e),g=Y("lightsInfo.value.isLightVisibleToCamera",e),x=C`

			fn compute(
				// settings
				misEnabled: u32,
				rayCount: u32,
				maxBounces: u32,
				clampDirect: f32,
				clampIndirect: f32,
				transmissiveBackground: u32,

				globalId: vec3u
			) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let rayIntersectionsStorage = &${e.rayIntersectionsStorage};
				let shadowRayIntersectionsStorage = &${e.shadowRayIntersectionsStorage};

				// bound by "rayCount" rather than the pool length. See MaterialKernel
				let index = globalId.x;
				if ( index >= rayCount ) {

					return;

				}

				// skip slots that have never spawned a ray
				let input = ( *rayDataStorage )[ index ];
				if ( input.rayIntersectionIndex < 0 ) {

					return;

				}

				let indexUV = vec2u( input.pixelIndex >> 16, input.pixelIndex & 0xFFFF );
				${ut}( indexUV, input.seed, input.currentBounce + input.alphaDepth );

				// one-sample NEE chooses between the analytic lights and the environment, matched with
				// the megakernel
				let envActive = ${t} > 0.0 && ${r} > 0.0;
				let lightsCount = ${f};
				var envWeight = 0.0;
				if ( envActive ) {

					envWeight = ${a}();

				}

				var resultColor = input.resultColor;
				var throughputColor = input.throughputColor;

				// added last, since a camera ray miss overwrites the pixel with the background
				var lightHits = vec3f( 0.0 );
				var cameraHitLight = false;

				// resolve the previous surface's NEE shadow ray (pre-scatter throughput). The index
				// is negative when no shadow ray was enqueued last frame
				if ( input.shadowRayIntersectionIndex >= 0 && input.lightPdf > 0.0 ) {

					let shadowHit = ( *shadowRayIntersectionsStorage )[ u32( input.shadowRayIntersectionIndex ) ];
					let occluded = shadowHit.objectIndex >= 0;
					if ( ! occluded ) {

						// env + area lights are also bsdf-sampled, so MIS-weight them; punctual take full weight,
						// or when a bsdf ray could never reach the light
						let isMISWeighted = ${Uo}( input.lightType ) && shadowHit.forwardBlocked == 0u;
						let misWeight = select( 1.0, ${Tt}( input.lightPdf, input.lightBsdfPdf ), isMISWeighted );
						let directLight = throughputColor * input.lightEmission * input.lightBsdf * misWeight / input.lightPdf;
						let contribution = ${Te}( directLight, input.currentBounce, clampDirect, clampIndirect );
						resultColor += vec4f( contribution, 0.0 );

					}

				}

				// emission gathered at the previous surface (pre-scatter throughput). Found light clamps
				// at the depth of the segment that found it, as in Cycles, so one less than the current
				let emission = ${Te}( throughputColor * input.emission, max( input.currentBounce, 1u ) - 1u, clampDirect, clampIndirect );
				resultColor += vec4f( emission, 0.0 );

				// reconstruct the scatter record staged by MaterialKernel
				var scatterRec: ${Ot};
				scatterRec.color = input.scatterColor;
				scatterRec.pdf = input.scatterPdf;

				// the bounce limit, russian roulette, and terminating scatter checks all ran in
				// MaterialKernel, which stages a zeroed pdf and skips the bounce trace when they fire
				var isTerminated = all( throughputColor == vec3f( 0.0 ) ) || input.currentBounce >= maxBounces || ${li}( scatterRec );

				if ( ! isTerminated ) {

					// apply the scatter across the traced segment
					throughputColor *= scatterRec.color / scatterRec.pdf;

					let hitResult = ( *rayIntersectionsStorage )[ u32( input.rayIntersectionIndex ) ];
					let didHit = hitResult.objectIndex >= 0;
					let surfaceDist = select( ${rr}, hitResult.dist, didHit );

					// NEE's total weight at the vertex this segment left, for MIS. Camera segments have none
					let isMISWeighted = misEnabled != 0u && input.currentBounce > 0u;
					var lightTotalWeight = 0.0;
					if ( isMISWeighted ) {

						lightTotalWeight = ${d}( input.origin ) + envWeight;

					}

					// forward hits on area lights. Camera rays only see visibleToCameraRays lights, at full weight
					for ( var li = 0u; li < lightsCount; li ++ ) {

						if ( input.currentBounce == 0u && ! ${g}( li ) ) {

							continue;

						}

						var lightRec: ${We};
						if ( ${u}( input.origin, input.direction, li, &lightRec ) && lightRec.dist < surfaceDist ) {

							var misWeight = 1.0;
							if ( isMISWeighted ) {

								let selectionPdf = ${p}( li, input.origin ) / lightTotalWeight;
								misWeight = ${Tt}( input.scatterPdf, lightRec.pdf * selectionPdf );

							}

							lightHits += ${Te}( lightRec.emission * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
							cameraHitLight = cameraHitLight || input.currentBounce == 0u;

						}

					}

					if ( didHit ) {

						// stage the hit for MaterialKernel
						rayDataStorage[ index ].barycoord = hitResult.barycoord;
						rayDataStorage[ index ].normal = hitResult.normal;
						rayDataStorage[ index ].side = hitResult.side;
						rayDataStorage[ index ].indices = hitResult.indices;
						rayDataStorage[ index ].objectIndex = hitResult.objectIndex;
						rayDataStorage[ index ].dist = hitResult.dist;

						// next event estimation: choose one light or the environment by its estimated
						// contribution. MaterialKernel evaluates the bsdf and enqueues the shadow ray.
						var lightPdf = 0.0;
						if ( misEnabled != 0u ) {

							let ruv = ${si}( ${Ro} );
							var selectionPdf = 0.0;
							let lightIndex = ${h}( hitResult.position, envWeight, ruv.x, &selectionPdf );
							if ( selectionPdf > 0.0 ) {

								var lightRec: ${We};
								if ( envActive && lightIndex == lightsCount ) {

									// the environment, sampled from its CDF, as a light of kind ENVIRONMENT
									let envSample = ${o}( ruv.yz );
									lightRec.direction = envSample.direction;
									lightRec.emission = envSample.color;
									lightRec.pdf = envSample.pdf;
									lightRec.dist = ${rr};
									lightRec.lightType = ${ln};

								} else {

									lightRec = ${c}( lightIndex, hitResult.position, ruv.yz );

								}

								lightPdf = lightRec.pdf * selectionPdf;
								rayDataStorage[ index ].lightDirection = lightRec.direction;
								rayDataStorage[ index ].lightEmission = lightRec.emission;
								rayDataStorage[ index ].lightDist = lightRec.dist;
								rayDataStorage[ index ].lightType = lightRec.lightType;

							}

						}

						rayDataStorage[ index ].lightPdf = lightPdf;

					} else {

						// the segment escaped the scene: gather the environment for opaque paths, or
						// the background for camera segments and fully transmissive paths
						if ( input.currentBounce > 0u && input.isFullyTransmissive == 0u ) {

							var misWeight = 1.0;
							if ( isMISWeighted && envActive ) {

								// match the env pdf scaling used by the NEE selection so the two estimators balance
								let envPdf = ${n}( input.direction ) * envWeight / lightTotalWeight;
								misWeight = ${Tt}( input.scatterPdf, envPdf );

							}

							let environment = ${i}( input.direction ).rgb * throughputColor * misWeight;
							let contribution = ${Te}( environment, input.currentBounce, clampDirect, clampIndirect );
							resultColor += vec4f( contribution, 0.0 );

						} else {

							// hit the background
							// support multiple transparent background blending techniques
							let rng = ${ft}( ${Ao} );
							let bg = ${l}( input.direction, rng );
							if ( input.currentBounce == 0u ) {

								// sample the background directly if this is the primary ray
								let background = ${Te}( bg.a * bg.rgb, input.currentBounce, clampDirect, clampIndirect );
								resultColor = vec4f( background, bg.a );

							} else {

								// transmissive ray handling
								let env = ${i}( input.direction );
								let avg = saturate( dot( throughputColor, vec3f( 1.0 / 3.0 ) ) );
								let transparency = ( 1.0 - bg.a ) * avg;

								var misWeight = 1.0;
								if ( misEnabled != 0u && envActive ) {

									let envPdf = ${n}( input.direction );
									misWeight = ${Tt}( input.scatterPdf, envPdf );

								}

								if ( transmissiveBackground == ${Jo}u ) {

									// display the env map through transmissive surfaces
									let background = ${Te}( env.rgb * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0,
									);

								} else if ( transmissiveBackground == ${es}u ) {

									// fade the background by the throughput color average
									let background = ${Te}( bg.a * bg.rgb * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								} else {

									// fade the background by the throughput color average, mixing in env lighting
									var light = mix( env.rgb, bg.rgb, bg.a ) * misWeight;
									let background = ${Te}( light * throughputColor, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								}

							}

						}

						isTerminated = true;

					}

				}

				// visible lights are opaque against a transparent background
				resultColor += vec4f( lightHits, 0.0 );
				if ( cameraHitLight ) {

					resultColor.a = 1.0;

				}

				// the color rows are stored top down to match a rasterized render target
				let colorIndex = vec2u( indexUV.x, textureDimensions( ${e.outputTarget} ).y - 1u - indexUV.y );
				let storedSamples = textureLoad( ${e.sampleCountTarget}, indexUV ).r & ${ir}u;

				if ( isTerminated ) {

					// blend the finished sample into the output and free the slot for a new camera ray
					let sampleCount = storedSamples + 1;
					let prevColor = textureLoad( ${e.prevOutputTarget}, colorIndex );
					let blendedColor = ${Lo}( prevColor, resultColor, 1.0 / f32( sampleCount ) );
					textureStore( ${e.sampleCountTarget}, indexUV, vec4( ${hi}u | sampleCount ) );
					textureStore( ${e.outputTarget}, colorIndex, blendedColor );

					rayDataStorage[ index ].objectIndex = - 1;

				} else {

					// show the path so far, which the first sample overwrites
					if ( storedSamples == 0u ) {

						textureStore( ${e.outputTarget}, colorIndex, resultColor );

					}

					rayDataStorage[ index ].resultColor = resultColor;
					rayDataStorage[ index ].throughputColor = throughputColor;

				}

			}
		`;super(x(e)),this.defineUniformAccessors(e)}};var ls=class extends ne{constructor(){let e={bvhData:{value:null},material:{value:null},seed:N(0,"uint"),targetDimensions:N(new X),maxSamples:N(0,"uint"),rayCount:N(0,"uint"),filterGlossy:N(1),maxTransparentBounces:N(5,"uint"),maxBounces:N(5,"uint"),sampleCountTarget:Ee(new ue(1,1)).toReadWrite(),rayDataStorage:O(new L(1,1),tt),rayQueue:O(new L(1,1),Ti),shadowRayQueue:O(new L(1,1),Ti),pixelQueue:O(new L(1,1),Rr),globalId:fe},t=Y("bvhData.value.fns.getCameraRay",e),r=Y("bvhData.value.fns.sampleTrianglePoint",e),i=Y("bvhData.value.fns.getSurfaceRecord",e),o=Y("material.value.bsdfSample",e),n=Y("material.value.bsdfEvalPdf",e),a=C`

			fn compute(
				seed: u32,
				targetDimensions: vec2u,
				maxSamples: u32,
				rayCount: u32,
				filterGlossy: f32,
				maxTransparentBounces: u32,
				maxBounces: u32,

				globalId: vec3u
			) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let rayQueue = &${e.rayQueue};
				let shadowRayQueue = &${e.shadowRayQueue};
				let pixelQueue = &${e.pixelQueue};

				let materials = &${Z("bvhData.value.storage.materials",e)};
				let transforms = &${Z("bvhData.value.storage.transforms",e)};

				// bound by "rayCount" rather than the pool length. The dispatch rounds up to the
				// workgroup size and those extra slots hold a zeroed pixel index
				let index = globalId.x;
				if ( index >= rayCount ) {

					return;

				}

				let input = ( *rayDataStorage )[ index ];
				if ( input.objectIndex < 0 ) {

					// the slot's path has terminated: recycle the pixel through the overflow queue and
					// generate a fresh camera ray
					var pixelIndex = input.pixelIndex;
					let elementCount = atomicLoad( &pixelQueue.elementCount );
					if ( elementCount > 0u ) {

						// TODO: If we've pulled off a pixel that's already finished we currently just
						// write a no-op ray, wasting a frame. It may be better to iterate over a few
						// points in the queue to see if we can find one we can use.
						let queueIndex = atomicAdd( &pixelQueue.current, 1u ) % elementCount;
						pixelIndex = atomicExchange( &pixelQueue.elements[ queueIndex ], pixelIndex );

					}

					let indexUV = vec2u( pixelIndex >> 16, pixelIndex & 0xFFFF );

					// skip the pixel if it has hit the sample limit
					let combinedField = textureLoad( ${e.sampleCountTarget}, indexUV ).r;
					let samples = ( ${ir}u & combinedField );
					let isComplete = maxSamples != 0u && samples >= maxSamples;

					if ( isComplete ) {

						rayDataStorage[ index ].pixelIndex = pixelIndex;
						rayDataStorage[ index ].rayIntersectionIndex = - 1;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					${ut}( indexUV, seed + samples, 0 );

					let uv = vec2f( indexUV ) / vec2f( targetDimensions );
					let jitteredUv = uv + ${ft}( ${Po} ) / vec2f( targetDimensions );
					var ray: ${z};
					if ( ! ${t}( jitteredUv, vec2f( targetDimensions ), &ray ) ) {

						// the camera declined the pixel, so leave the slot dormant for this round
						// TODO: same as above - this work is a bit wasteful and leaves slots empty for
						// a frame. Is it possible to quickly skip rays outside the mask or are finished?
						rayDataStorage[ index ].pixelIndex = pixelIndex;
						rayDataStorage[ index ].rayIntersectionIndex = - 1;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					ray.direction = normalize( ray.direction );

					let rayIndex = atomicAdd( &rayQueue.length, 1u );
					rayQueue.elements[ rayIndex ].origin = ray.origin;
					rayQueue.elements[ rayIndex ].direction = ray.direction;
					rayQueue.elements[ rayIndex ].pixelIndex = pixelIndex;
					rayQueue.elements[ rayIndex ].currentBounce = 0u;
					rayQueue.elements[ rayIndex ].seed = seed + samples;
					rayQueue.elements[ rayIndex ].alphaDepth = 0u;
					rayQueue.elements[ rayIndex ].maxDist = ray.maxDist;

					rayDataStorage[ index ].origin = ray.origin;
					rayDataStorage[ index ].direction = ray.direction;
					rayDataStorage[ index ].pixelIndex = pixelIndex;
					rayDataStorage[ index ].seed = seed + samples;
					rayDataStorage[ index ].currentBounce = 0u;
					rayDataStorage[ index ].throughputColor = vec3f( 1.0 );
					rayDataStorage[ index ].resultColor = vec4f( 0.0, 0.0, 0.0, 1.0 );
					rayDataStorage[ index ].scatterColor = vec3f( 1.0 );
					rayDataStorage[ index ].scatterPdf = 1.0;
					rayDataStorage[ index ].minPdf = 1.0;
					rayDataStorage[ index ].isFullyTransmissive = 1u;
					rayDataStorage[ index ].emission = vec3f( 0.0 );
					rayDataStorage[ index ].lightPdf = 0.0;
					rayDataStorage[ index ].alphaDepth = 0u;
					rayDataStorage[ index ].maxDist = ray.maxDist;
					rayDataStorage[ index ].rayIntersectionIndex = i32( rayIndex );
					rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
					rayDataStorage[ index ].dispersionWavelength = - mix( ${fi}.0, ${pi}.0, ${wt}( ${Do} ) );

					// write the active params & dispatched flag
					textureStore( ${e.sampleCountTarget}, indexUV, vec4( ${kf}u | ${hi}u | samples ) );

				} else {

					// evaluate the surface staged by LogicKernel
					let indexUV = vec2u( input.pixelIndex >> 16, input.pixelIndex & 0xFFFF );
					${ut}( indexUV, input.seed, input.currentBounce + input.alphaDepth );

					let objectInfo = transforms[ u32( input.objectIndex ) ];
					var materialInfo = ( *materials )[ objectInfo.materialIndex ];

					// a matte surface hit by the camera ray renders as a fully transparent
					let isMatte = materialInfo.matte != 0 && input.currentBounce == 0u;
					if ( isMatte ) {

						rayDataStorage[ index ].resultColor = vec4f( 0.0 );
						rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
						rayDataStorage[ index ].emission = vec3f( 0.0 );
						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					// apply per-object colors
					materialInfo.color *= objectInfo.color.rgb;
					materialInfo.opacity *= objectInfo.color.a;

					var vertexData = ${r}( input.barycoord, input.indices );
					vertexData.normal = normalize( transpose( objectInfo.inverseMatrixWorld ) * vertexData.normal );
					vertexData.tangent = vec4f( ( objectInfo.matrixWorld * vec4f( vertexData.tangent.xyz, 0.0 ) ).xyz, vertexData.tangent.w );
					vertexData.position = objectInfo.matrixWorld * vertexData.position;

					let view = - input.direction;

					// blur glossy surfaces after low-probability bounces to suppress fireflies,
					// from the Cycles "filter glossy" approach in integrator/surface_shader.h
					let blurRoughness = sqrt( clamp( 1.0 - filterGlossy * input.minPdf, 0.0, 1.0 ) ) * 0.5;

					var surface = ${i}( materialInfo, vertexData, input.side, input.normal, view, blurRoughness );

					// Stochastically pass through partially transparent surfaces by re-enqueueing
					// the ray at the hit point, advancing the alpha depth but not the bounce count.
					let passesThrough = ${wt}( ${No} ) > surface.opacity;
					if ( passesThrough ) {

						// out of transparent bounces, so stop rather than shading a surface that
						// should be invisible. A zeroed throughput terminates in LogicKernel.
						if ( input.alphaDepth >= maxTransparentBounces ) {

							rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
							rayDataStorage[ index ].emission = vec3f( 0.0 );
							rayDataStorage[ index ].lightPdf = 0.0;
							rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
							return;

						}

						let alphaIndex = atomicAdd( &rayQueue.length, 1u );
						rayQueue.elements[ alphaIndex ].origin = ${tr}( vertexData.position.xyz, input.direction, input.normal );
						rayQueue.elements[ alphaIndex ].direction = input.direction;
						rayQueue.elements[ alphaIndex ].pixelIndex = input.pixelIndex;
						rayQueue.elements[ alphaIndex ].currentBounce = input.currentBounce;
						rayQueue.elements[ alphaIndex ].seed = input.seed;
						rayQueue.elements[ alphaIndex ].alphaDepth = input.alphaDepth + 1u;
						// the origin advanced to the hit point, so the remaining budget shrinks by the
						// distance already traced
						rayQueue.elements[ alphaIndex ].maxDist = max( input.maxDist - input.dist, 0.0 );

						// the surface is skipped, so no scatter or emission is staged for LogicKernel.
						// "pdf" is left alone so the previous scatter still weights the forward MIS,
						// and "bsdf" matches it so applying the scatter leaves the throughput as is.
						rayDataStorage[ index ].alphaDepth = input.alphaDepth + 1u;
						rayDataStorage[ index ].emission = vec3f( 0.0 );
						rayDataStorage[ index ].scatterColor = vec3f( input.scatterPdf );
						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].origin = rayQueue.elements[ alphaIndex ].origin;
						rayDataStorage[ index ].rayIntersectionIndex = i32( alphaIndex );
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					// apply the hero wavelength to dispersive surfaces, folding the spectral weight
					// into the throughput at the path's first dispersive interaction
					var throughputColor = input.throughputColor;
					let isDispersive = materialInfo.dispersion > 0.0 && surface.ior > 1.0 && surface.transmission > 0.0 && ! surface.thinWall;
					if ( isDispersive ) {

						let wavelength = abs( input.dispersionWavelength );
						${Yo}( &surface, materialInfo.dispersion, wavelength );
						if ( input.dispersionWavelength < 0.0 ) {

							rayDataStorage[ index ].dispersionWavelength = wavelength;
							throughputColor *= ${Ko}( wavelength );
							rayDataStorage[ index ].throughputColor = throughputColor;

						}

					}

					// attenuate the light transmitted through the volume when exiting a backface so
					// the surface's emission and NEE resolve against the attenuated throughput
					if ( input.side < 0.0 && materialInfo.transmission > 0.0 ) {

						throughputColor *= ${jo}( input.dist, materialInfo.attenuationColor, materialInfo.attenuationDistance );
						rayDataStorage[ index ].throughputColor = throughputColor;

					}

					// sample the next bounce direction and stage the scatter state for LogicKernel
					var scatterRec = ${o}( view, surface );
					let newBounce = input.currentBounce + 1u;

					// decide termination now so finished paths skip the bounce trace entirely - a
					// zeroed pdf reads as a terminating scatter in LogicKernel, which still resolves
					// the surface's emission and NEE before freeing the slot
					var isTerminated = newBounce >= maxBounces || all( scatterRec.color == vec3f( 0.0 ) ) || ${li}( scatterRec );

					// russian roulette early out:
					// Matches Cycles path_state_continuation_probability in integrator/path_state.h
					if ( ! isTerminated && newBounce >= 3u ) {

						let rrThroughput = throughputColor * scatterRec.color / scatterRec.pdf;
						let rrProb = saturate( sqrt( max( max( rrThroughput.r, rrThroughput.g ), rrThroughput.b ) ) );
						isTerminated = rrProb <= 0.0 || ${wt}( ${$o} ) > rrProb;
						if ( ! isTerminated ) {

							// fold the survival boost into the scatter color so LogicKernel's
							// throughput update applies it without a separate division
							scatterRec.color /= rrProb;

						}

					}

					// Write the ray storage content here since things like the emissive value is read
					// in the logic kernel on the subsequent frame.
					rayDataStorage[ index ].scatterColor = scatterRec.color;
					rayDataStorage[ index ].scatterPdf = select( scatterRec.pdf, 0.0, isTerminated );
					rayDataStorage[ index ].minPdf = min( input.minPdf, scatterRec.pdf );
					rayDataStorage[ index ].isFullyTransmissive = input.isFullyTransmissive & select( 0u, 1u, scatterRec.isTransmissive );
					rayDataStorage[ index ].emission = surface.emission;
					rayDataStorage[ index ].currentBounce = newBounce;

					// the NEE shadow ray below still resolves the surface's direct light, so only
					// the bounce segment is skipped for finished paths
					if ( ! isTerminated ) {

						let rayIndex = atomicAdd( &rayQueue.length, 1u );
						rayQueue.elements[ rayIndex ].origin = ${tr}( vertexData.position.xyz, scatterRec.direction, input.normal );
						rayQueue.elements[ rayIndex ].direction = scatterRec.direction;
						rayQueue.elements[ rayIndex ].pixelIndex = input.pixelIndex;
						rayQueue.elements[ rayIndex ].currentBounce = newBounce;
						rayQueue.elements[ rayIndex ].seed = input.seed;
						rayQueue.elements[ rayIndex ].alphaDepth = input.alphaDepth;
						rayQueue.elements[ rayIndex ].maxDist = 0.0;
						rayDataStorage[ index ].rayIntersectionIndex = i32( rayIndex );

						rayDataStorage[ index ].origin = rayQueue.elements[ rayIndex ].origin;
						rayDataStorage[ index ].direction = scatterRec.direction;

					}

					// evaluate the bsdf toward the light LogicKernel selected and enqueue the shadow ray.
					// the light pdf will be 0 if NEE is disabled.
					var lightPdf = input.lightPdf;
					if ( lightPdf > 0.0 ) {

						let evalRec = ${n}( view, input.lightDirection, surface );
						if ( evalRec.pdf > 0.0 ) {

							rayDataStorage[ index ].lightBsdf = evalRec.color;
							rayDataStorage[ index ].lightBsdfPdf = evalRec.pdf;

							let shadowIndex = atomicAdd( &shadowRayQueue.length, 1u );
							shadowRayQueue.elements[ shadowIndex ].origin = ${tr}( vertexData.position.xyz, input.lightDirection, input.normal );
							shadowRayQueue.elements[ shadowIndex ].direction = input.lightDirection;
							shadowRayQueue.elements[ shadowIndex ].pixelIndex = input.pixelIndex;
							shadowRayQueue.elements[ shadowIndex ].currentBounce = input.currentBounce;
							shadowRayQueue.elements[ shadowIndex ].seed = input.seed;
							shadowRayQueue.elements[ shadowIndex ].alphaDepth = input.alphaDepth;
							shadowRayQueue.elements[ shadowIndex ].maxDist = input.lightDist * ( 1.0 - ${zo} );
							rayDataStorage[ index ].shadowRayIntersectionIndex = i32( shadowIndex );

						} else {

							lightPdf = 0.0;

						}

					}

					if ( lightPdf <= 0.0 ) {

						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;

					}

				}

			}
		`;super(a(e)),this.defineUniformAccessors(e)}};var cs=class extends ne{constructor(){let e={bvhData:{value:null},rayQueue:O(new L(1,1),Br),rayIntersectionsStorage:O(new L(1,1),It),globalId:fe},t=Z("bvhData.value.fns.raycastFirstHit.outputType",e),r=Z("bvhData.value.fns.raycastFirstHit",e),i=C`

			fn compute( globalId: vec3u ) -> void {

				let rayQueue = &${e.rayQueue};
				let rayIntersectionsStorage = &${e.rayIntersectionsStorage};

				let index = globalId.x;
				if ( index >= rayQueue.length ) {

					return;

				}

				let queuedRay = ( *rayQueue ).elements[ index ];
				let indexUV = vec2u( queuedRay.pixelIndex >> 16, queuedRay.pixelIndex & 0xFFFF );
				${ut}( indexUV, queuedRay.seed, queuedRay.currentBounce + queuedRay.alphaDepth );

				let ray = Ray( queuedRay.origin, queuedRay.direction, queuedRay.maxDist );
				var hitResult: ${t};
				if ( ${r}( ray, &hitResult ) ) {

					rayIntersectionsStorage[ index ].barycoord = hitResult.barycoord;
					rayIntersectionsStorage[ index ].objectIndex = i32( hitResult.objectIndex );
					rayIntersectionsStorage[ index ].position = ray.origin + ray.direction * hitResult.dist;
					rayIntersectionsStorage[ index ].dist = hitResult.dist;
					rayIntersectionsStorage[ index ].normal = hitResult.normal.xyz;
					rayIntersectionsStorage[ index ].side = hitResult.side;
					rayIntersectionsStorage[ index ].indices = hitResult.indices.xyz;

				} else {

					rayIntersectionsStorage[ index ].objectIndex = - 1;

				}

			}
		`;super(i(e)),this.defineUniformAccessors(e)}};var us=class extends ne{constructor(){let e={bvhData:{value:null},shadowRayQueue:O(new L(1,1),Br),shadowRayIntersectionsStorage:O(new L(1,1),It),globalId:fe},t=Z("bvhData.value.fns.raycastFirstHit.outputType",e),r=Z("bvhData.value.fns.raycastShadow",e),i=C`

			fn compute( globalId: vec3u ) -> void {

				let shadowRayQueue = &${e.shadowRayQueue};
				let shadowRayIntersectionsStorage = &${e.shadowRayIntersectionsStorage};

				let index = globalId.x;
				if ( index >= shadowRayQueue.length ) {

					return;

				}

				let queuedRay = ( *shadowRayQueue ).elements[ index ];
				let indexUV = vec2u( queuedRay.pixelIndex >> 16, queuedRay.pixelIndex & 0xFFFF );
				${ut}( indexUV, queuedRay.seed, queuedRay.currentBounce + queuedRay.alphaDepth );

				let ray = Ray( queuedRay.origin, queuedRay.direction, queuedRay.maxDist );
				var hitResult: ${t};
				if ( ${r}( ray, &hitResult ) ) {

					shadowRayIntersectionsStorage[ index ].objectIndex = i32( hitResult.objectIndex );
					shadowRayIntersectionsStorage[ index ].dist = hitResult.dist;

				} else {

					shadowRayIntersectionsStorage[ index ].objectIndex = - 1;

				}

				shadowRayIntersectionsStorage[ index ].forwardBlocked = u32( hitResult.forwardBlocked );

			}
		`;super(i(e)),this.defineUniformAccessors(e)}};var pn=class extends ne{constructor(e=Ti,t=64){let r={queue:O(new L(1,1),e),outputDispatch:O(new Un(3,1),"u32").setName("outputDispatch")},i=C`
			fn compute() -> void {

				let queue = &${r.queue};
				let outputDispatch = &${r.outputDispatch};

				let queueLength = atomicLoad( &queue.length );
				outputDispatch[ 0 ] = ( queueLength + ${t-1}u ) / ${t}u;
				outputDispatch[ 1 ] = 1u;
				outputDispatch[ 2 ] = 1u;

			}
		`;super(i(r)),this.defineUniformAccessors(r)}};var fs=class extends ne{constructor(){let e={rayDataStorage:O(new L(1,1),tt),pixelQueue:O(new L(1,1),Rr),start:N(0,"uint"),end:N(0,"uint"),addingSlots:N(0,"uint"),globalId:fe},t=C`
			fn compute( start: u32, end: u32, addingSlots: u32, globalId: vec3u ) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let pixelQueue = &${e.pixelQueue};

				let index = start + globalId.x;
				if ( index >= end ) {

					return;

				}

				if ( addingSlots == 0u ) {

					// slots being removed hand their pixel back before the pool is discarded
					let queueIndex = atomicAdd( &pixelQueue.elementCount, 1u );
					atomicStore( &pixelQueue.elements[ queueIndex ], rayDataStorage[ index ].pixelIndex );

				} else {

					// the pool never exceeds the pixel count, so the queue holds enough for every new slot
					let previousCount = atomicSub( &pixelQueue.elementCount, 1u );
					rayDataStorage[ index ].pixelIndex = atomicLoad( &pixelQueue.elements[ previousCount - 1u ] );
					rayDataStorage[ index ].resultColor = vec4f( 0.0 );
					rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
					rayDataStorage[ index ].objectIndex = - 1;
					rayDataStorage[ index ].alphaDepth = 0u;
					rayDataStorage[ index ].rayIntersectionIndex = - 1;
					rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};var ps=class extends ne{constructor(e={}){let{type:t="u32"}=e,r={globalId:fe,outputTarget:O(new Un(1,1),t)},i=C`
			fn compute( globalId: vec3u ) -> void {

				${r.outputTarget}[ globalId.x ] = 0;

			}
		`;super(i(r)),this.defineUniformAccessors({target:r.outputTarget})}};var ds=class extends ne{constructor(e){let t={source:O(new L(1,1),e).toReadOnly(),target:O(new L(1,1),e),count:N(0,"uint"),globalId:fe},r=C`
			fn compute( count: u32, globalId: vec3u ) -> void {

				let index = globalId.x;
				if ( index >= count ) {

					return;

				}

				${t.target}[ index ] = ${t.source}[ index ];

			}
		`;super(r(t)),this.defineUniformAccessors(t)}};var Yf=0,Kf=1,Xf=2,Qf=3,Zf=4,cl=5,Jf=4294967296,ep=new Q({minSamples:{type:"uint",atomic:!0},maxSamples:{type:"uint",atomic:!0},totalLo:{type:"uint",atomic:!0},totalHi:{type:"uint",atomic:!0},pixelCount:{type:"uint",atomic:!0}},"SampleCounters"),hs=class extends ne{constructor(){let e={counters:O(new L(1,1),ep)},t=C`
			fn compute() -> void {

				atomicStore( &${e.counters}.minSamples, 0xFFFFFFFFu );
				atomicStore( &${e.counters}.maxSamples, 0u );
				atomicStore( &${e.counters}.totalLo, 0u );
				atomicStore( &${e.counters}.totalHi, 0u );
				atomicStore( &${e.counters}.pixelCount, 0u );

			}
		`;super(t(e)),this.defineUniformAccessors(e)}},ms=class extends ne{constructor(){let e={globalId:fe,counters:O(new L(1,1),ep),sampleCountTarget:Ee(new ue(1,1)).toReadOnly()},t=C`
			fn compute( globalId: vec3u ) -> void {

				let targetDimensions = textureDimensions( ${e.sampleCountTarget} );
				if ( globalId.x >= targetDimensions.x || globalId.y >= targetDimensions.y ) {

					return;

				}

				// pixels without a camera ray aren't part of the image, so skip rather than count zero
				let combinedField = textureLoad( ${e.sampleCountTarget}, globalId.xy ).r;
				if ( ( combinedField & ${hi}u ) == 0u ) {

					return;

				}

				let samples = combinedField & ${ir}u;

				atomicMin( &${e.counters}.minSamples, samples );
				atomicMax( &${e.counters}.maxSamples, samples );
				atomicAdd( &${e.counters}.pixelCount, 1u );

				// the sum overflowed if it came out smaller than the value already there, so carry
				// the wrap into "totalHi"
				let previousTotal = atomicAdd( &${e.counters}.totalLo, samples );
				if ( previousTotal + samples < previousTotal ) {

					atomicAdd( &${e.counters}.totalHi, 1u );

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};var xm=134217728,ym=Math.floor(xm/(tt.getLength()*4)),vm=5,dn=class extends bi{constructor(e){super(e),this.seed=0,this.envInfo=new mi,this.backgroundInfo=new gi,this.lightsInfo=new vi,this.rayCount=0,this.rayDataStorage=null,this.rayQueue=null,this.shadowRayQueue=null,this.rayIntersectionsStorage=null,this.shadowRayIntersectionsStorage=null,this.pixelQueue=null,this.sampleCountersStorage=new L(new Uint32Array(cl),cl),this.sampleCountersStorage.name="Sample Counters",this._samplesPromise=null,this.populatePixelIndicesKernel=new ss().setWorkgroupSize(8,8,1),this.logicKernel=new as().setWorkgroupSize(64,1,1),this.materialKernel=new ls().setWorkgroupSize(64,1,1),this.traceRayKernel=new cs().setWorkgroupSize(64,1,1),this.traceShadowRayKernel=new us().setWorkgroupSize(64,1,1),this.rayDispatchConverter=new pn().setWorkgroupSize(1,1,1),this.shadowDispatchConverter=new pn().setWorkgroupSize(1,1,1),this.primeSampleCountersKernel=new hs().setWorkgroupSize(1,1,1),this.tallySampleCountsKernel=new ms().setWorkgroupSize(8,8,1),this.resetSlotsKernel=new fs().setWorkgroupSize(64,1,1),this.copyRayDataKernel=new ds(tt).setWorkgroupSize(64,1,1),this.logicKernel.envInfo=this.envInfo,this.logicKernel.backgroundInfo=this.backgroundInfo,this.logicKernel.lightsInfo=this.lightsInfo,this.zeroDispatchKernel=new ps().setWorkgroupSize(1,1,1),this.volumeKernel=null}resetSeed(){this.seed=0}reset(){super.reset(),this._samplesPromise=null}setBVHData(e){this.materialKernel.bvhData=e,this.materialKernel.needsUpdate=!0,this.traceRayKernel.bvhData=e,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.bvhData=e,this.traceShadowRayKernel.needsUpdate=!0,this.reset()}rebuild(){super.rebuild(),this.materialKernel.needsUpdate=!0,this.reset()}setRandom(e){this.logicKernel.context.random=e,this.logicKernel.needsUpdate=!0,this.materialKernel.context.random=e,this.materialKernel.needsUpdate=!0,this.traceRayKernel.context.random=e,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.context.random=e,this.traceShadowRayKernel.needsUpdate=!0,this.reset()}setMaterial(e){this.materialKernel.material=e.getData(),this.materialKernel.needsUpdate=!0,this.reset()}setFilterGlossy(e){this.materialKernel.filterGlossy=e===0?Go:1/e,this.reset()}setClamping(e,t){this.logicKernel.clampDirect=e,this.logicKernel.clampIndirect=t,this.reset()}setTransmissiveBackground(e){this.logicKernel.transmissiveBackground=e,this.reset()}setEnvironment(e){this.envInfo.updateFrom(e)}setLights(e){this.lightsInfo.updateFrom(this.renderer,e),this.reset()}setEnvironmentParams(e,t){let{envInfo:r}=this,i=new k().makeRotationFromEuler(t).invert();r.rotationNode.value.setFromMatrix4(i),r.intensityNode.value=e}setMultipleImportanceSampling(e){this.logicKernel.misEnabled=e?1:0,this.reset()}setBackground(e){let{backgroundInfo:t}=this;t.dispose(),t.map=e}setBackgroundParams(e,t,r){let{backgroundInfo:i}=this,o=new k().makeRotationFromEuler(t).invert();i.rotationNode.value.copy(o),i.intensity=e,i.blur=r}dispose(){super.dispose(),this.envInfo.dispose(),this.lightsInfo.dispose(),this.rayDataStorage?.dispose(),this.rayQueue?.dispose(),this.shadowRayQueue?.dispose(),this.rayIntersectionsStorage?.dispose(),this.shadowRayIntersectionsStorage?.dispose(),this.sampleCountersStorage.dispose(),this.pixelQueue?.dispose(),this.rayDispatchConverter.outputDispatch.dispose(),this.shadowDispatchConverter.outputDispatch.dispose(),this.populatePixelIndicesKernel.dispose(),this.logicKernel.dispose(),this.materialKernel.dispose(),this.traceRayKernel.dispose(),this.traceShadowRayKernel.dispose(),this.rayDispatchConverter.dispose(),this.shadowDispatchConverter.dispose(),this.primeSampleCountersKernel.dispose(),this.tallySampleCountsKernel.dispose(),this.resetSlotsKernel.dispose(),this.copyRayDataKernel.dispose(),this.zeroDispatchKernel.dispose()}_updatePixelQueue(e,t){let r=Rr.getLength()+Math.max(e*t,1);(!this.pixelQueue||this.pixelQueue.array.length<r)&&(this.pixelQueue?.dispose(),this.pixelQueue=new L(new Float32Array(r),r),this.pixelQueue.name="Pixel Queue",this.materialKernel.pixelQueue=this.pixelQueue,this.materialKernel.needsUpdate=!0,this.populatePixelIndicesKernel.pixelQueue=this.pixelQueue,this.populatePixelIndicesKernel.needsUpdate=!0,this.resetSlotsKernel.pixelQueue=this.pixelQueue,this.resetSlotsKernel.needsUpdate=!0)}_resizePool(e){let{renderer:t,resetSlotsKernel:r,copyRayDataKernel:i}=this,o=this.rayCount;r.pixelQueue=this.pixelQueue,e<o&&(r.rayDataStorage=this.rayDataStorage,r.start=e,r.end=o,r.addingSlots=!1,t.compute(r.kernel,r.getDispatchSize(o-e,1,1)));let n=new L(e,tt.getLength());n.name="Ray Data";let a=Br.getLength()+e*_i.getLength(),l=new L(new Float32Array(a),a);l.name="Ray Queue";let f=new L(new Float32Array(a),a);f.name="Shadow Ray Queue";let c=new L(e,It.getLength());c.name="Ray Intersections";let u=new L(e,It.getLength());u.name="Shadow Ray Intersections";let p=Math.min(e,o);p>0&&(i.source=this.rayDataStorage,i.target=n,i.count=p,t.compute(i.kernel,i.getDispatchSize(p,1,1))),this.rayDataStorage?.dispose(),this.rayQueue?.dispose(),this.shadowRayQueue?.dispose(),this.rayIntersectionsStorage?.dispose(),this.shadowRayIntersectionsStorage?.dispose(),this.rayDataStorage=n,this.rayQueue=l,this.shadowRayQueue=f,this.rayIntersectionsStorage=c,this.shadowRayIntersectionsStorage=u,this.rayCount=e,this.logicKernel.needsUpdate=!0,this.materialKernel.needsUpdate=!0,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.needsUpdate=!0,this.populatePixelIndicesKernel.needsUpdate=!0,this.resetSlotsKernel.needsUpdate=!0,e>o&&(r.rayDataStorage=n,r.start=o,r.end=e,r.addingSlots=!0,t.compute(r.kernel,r.getDispatchSize(e-o,1,1)))}_getRequestedSlotCount(e){return Math.min(ym,e,Math.max(1,Math.floor(this.frameBudget)))}_applyBudget(e){let t=this._getRequestedSlotCount(e);t!==this.rayCount&&this._resizePool(t)}*createRenderTask(){let{renderer:e,maxTransparentBounces:t,logicKernel:r,materialKernel:i,traceRayKernel:o,traceShadowRayKernel:n,rayDispatchConverter:a,shadowDispatchConverter:l,zeroDispatchKernel:f,populatePixelIndicesKernel:c}=this,u=new X;this.getSize(u),this._updatePixelQueue(u.x,u.y);let p=u.x*u.y;for(this._applyBudget(p),f.target=this.rayQueue,e.compute(f.kernel,[1]),f.target=this.shadowRayQueue,e.compute(f.kernel,[1]),c.rayDataStorage=this.rayDataStorage,c.pixelQueue=this.pixelQueue,c.frameBudget=this.rayCount,c.targetDimensions.copy(u),e.compute(c.kernel,c.getDispatchSize(u.x,u.y,1)),this.seed++;;){let d=this.lowResMode?Math.min(this.maxBounces,vm):1;for(let h=0;h<d;h++){e.copyTextureToTexture(this.outputTarget,this.prevOutputTarget),[this.outputTarget,this.prevOutputTarget]=[this.prevOutputTarget,this.outputTarget],r.prevOutputTarget=this.prevOutputTarget,r.outputTarget=this.outputTarget,r.sampleCountTarget=this.sampleCountTarget,r.rayDataStorage=this.rayDataStorage,r.rayIntersectionsStorage=this.rayIntersectionsStorage,r.shadowRayIntersectionsStorage=this.shadowRayIntersectionsStorage,r.maxBounces=this.maxBounces,r.rayCount=this.rayCount,e.compute(r.kernel,r.getDispatchSize(this.rayCount,1,1)),this._applyBudget(p);let{rayDataStorage:g,rayQueue:x,shadowRayQueue:b,rayIntersectionsStorage:m,shadowRayIntersectionsStorage:v,rayCount:y}=this;f.target=x,e.compute(f.kernel,[1]),f.target=b,e.compute(f.kernel,[1]),i.rayDataStorage=g,i.rayQueue=x,i.shadowRayQueue=b,i.pixelQueue=this.pixelQueue,i.sampleCountTarget=this.sampleCountTarget,i.seed=this.seed,i.maxSamples=this.maxSamples,i.rayCount=y,i.maxTransparentBounces=t,i.maxBounces=this.maxBounces,i.targetDimensions.copy(u),e.compute(i.kernel,i.getDispatchSize(y,1,1)),a.queue=x,e.compute(a.kernel,[1,1,1]),o.rayQueue=x,o.rayIntersectionsStorage=m,e.compute(o.kernel,a.outputDispatch),l.queue=b,e.compute(l.kernel,[1,1,1]),n.shadowRayQueue=b,n.shadowRayIntersectionsStorage=v,e.compute(n.kernel,l.outputDispatch)}yield}}getSampleCountsAsync(){if(this._samplesPromise===null){let e=this._measureSampleCounts().finally(()=>{this._samplesPromise===e&&(this._samplesPromise=null)});this._samplesPromise=e}return this._samplesPromise}async _measureSampleCounts(){let{renderer:e,sampleCountTarget:t,sampleCountersStorage:r,primeSampleCountersKernel:i,tallySampleCountsKernel:o}=this;if(!e.initialized||this.lowResMode)return{min:0,max:0,avg:0};i.counters=r,e.compute(i.kernel,[1,1,1]),o.counters=r,o.sampleCountTarget=t,e.compute(o.kernel,o.getDispatchSize(t.width,t.height));let n=await e.getArrayBufferAsync(r),a=new Uint32Array(n),l=a[Zf];if(l===0)return{min:0,max:0,avg:0};let f=a[Qf]*Jf+a[Xf];return{min:a[Yf],max:a[Kf],avg:f/l}}};var tp=`

	// TODO: possibly this should be renamed something related to material or path tracing logic

	#ifndef RAY_OFFSET
	#define RAY_OFFSET 1e-4
	#endif

	// adjust the hit point by the surface normal by a factor of some offset and the
	// maximum component-wise value of the current point to accommodate floating point
	// error as values increase.
	vec3 stepRayOrigin( vec3 rayOrigin, vec3 rayDirection, vec3 offset, float dist ) {

		vec3 point = rayOrigin + rayDirection * dist;
		vec3 absPoint = abs( point );
		float maxPoint = max( absPoint.x, max( absPoint.y, absPoint.z ) );
		return point + offset * ( maxPoint + 1.0 ) * RAY_OFFSET;

	}

	// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
	vec3 transmissionAttenuation( float dist, vec3 attColor, float attDist ) {

		vec3 ot = - log( attColor ) / attDist;
		return exp( - ot * dist );

	}

	vec3 getHalfVector( vec3 wi, vec3 wo, float eta ) {

		// get the half vector - assuming if the light incident vector is on the other side
		// of the that it's transmissive.
		vec3 h;
		if ( wi.z > 0.0 ) {

			h = normalize( wi + wo );

		} else {

			// Scale by the ior ratio to retrieve the appropriate half vector
			// From Section 2.2 on computing the transmission half vector:
			// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
			h = normalize( wi + wo * eta );

		}

		h *= sign( h.z );
		return h;

	}

	vec3 getHalfVector( vec3 a, vec3 b ) {

		return normalize( a + b );

	}

	// The discrepancy between interpolated surface normal and geometry normal can cause issues when a ray
	// is cast that is on the top side of the geometry normal plane but below the surface normal plane. If
	// we find a ray like that we ignore it to avoid artifacts.
	// This function returns if the direction is on the same side of both planes.
	bool isDirectionValid( vec3 direction, vec3 surfaceNormal, vec3 geometryNormal ) {

		bool aboveSurfaceNormal = dot( direction, surfaceNormal ) > 0.0;
		bool aboveGeometryNormal = dot( direction, geometryNormal ) > 0.0;
		return aboveSurfaceNormal == aboveGeometryNormal;

	}

	// ray sampling x and z are swapped to align with expected background view
	vec2 equirectDirectionToUv( vec3 direction ) {

		// from Spherical.setFromCartesianCoords
		vec2 uv = vec2( atan( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

	vec3 equirectUvToDirection( vec2 uv ) {

		// undo above adjustments
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		// from Vector3.setFromSphericalCoords
		float theta = uv.x * 2.0 * PI;
		float phi = uv.y * PI;

		float sinPhi = sin( phi );

		return vec3( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

	// power heuristic for multiple importance sampling
	float misHeuristic( float a, float b ) {

		float aa = a * a;
		float bb = b * b;
		return aa / ( aa + bb );

	}

	// tentFilter from Peter Shirley's 'Realistic Ray Tracing (2nd Edition)' book, pg. 60
	// erichlof/THREE.js-PathTracing-Renderer/
	float tentFilter( float x ) {

		return x < 0.5 ? sqrt( 2.0 * x ) - 1.0 : 1.0 - sqrt( 2.0 - ( 2.0 * x ) );

	}
`;var ul=class extends yc{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`
				#define ENVMAP_TYPE_CUBE_UV

				uniform samplerCube envMap;
				uniform float flipEnvMap;
				varying vec2 vUv;

				#include <common>
				#include <cube_uv_reflection_fragment>

				${tp}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}},gs=class{constructor(e){this._renderer=e,this._quad=new kt(new ul)}generate(e,t=null,r=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");let i=e.images[0],o=this._renderer,n=this._quad;t===null&&(t=4*i.height),r===null&&(r=2*i.height);let a=new pc(t,r,{type:ze,colorSpace:i.colorSpace}),l=i.height,f=Math.log2(l)-2,c=1/l,u=1/(3*Math.max(Math.pow(2,f),112));n.material.defines.CUBEUV_MAX_MIP=`${f}.0`,n.material.defines.CUBEUV_TEXEL_WIDTH=u,n.material.defines.CUBEUV_TEXEL_HEIGHT=c,n.material.uniforms.envMap.value=e,n.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,n.material.needsUpdate=!0;let p=o.getRenderTarget(),d=o.autoClear;o.autoClear=!0,o.setRenderTarget(a),n.render(o),o.setRenderTarget(p),o.autoClear=d;let h=new Uint16Array(t*r*4),g=new Float32Array(t*r*4);o.readRenderTargetPixels(a,0,0,t,r,g),a.dispose();for(let b=0,m=g.length;b<m;b++)h[b]=Xe.toHalfFloat(g[b]);let x=new ye(h,t,r,Se,Be);return x.minFilter=oc,x.magFilter=_e,x.wrapS=Ke,x.wrapT=Ke,x.mapping=ic,x.needsUpdate=!0,x}dispose(){this._quad.dispose()}};function bm(s,e){return s.uuid<e.uuid?1:s.uuid>e.uuid?-1:0}function rp(s){return`${s.source.uuid}:${s.colorSpace}`}function ip(s){let e=[];return s.traverseVisible(t=>{(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight||t.isSunLight)&&e.push(t)}),e.sort(bm)}var hn=new ot,xs=new Q({matrixWorld:"mat4x4f",inverseMatrixWorld:"mat4x4f",visible:"uint",materialIndex:"uint",visibleToShadowRays:"uint",_alignment0:"uint",color:"vec4f"},"TransformStruct"),ys=new Q({indices:"vec4u",normal:"vec3f",didHit:"bool",barycoord:"vec3f",objectIndex:"uint",side:"float",dist:"float",forwardBlocked:"bool"},"PathTracerIntersectionResult"),vs=class extends yo{constructor(e,t={}){super(e,{attributes:{position:"vec4f",normal:"vec4f",tangent:"vec4f",color:"vec4f",uv:"vec4f"},...t}),this.structs.transform=xs,this.structs.material=cf,this.storage.materials=null,this.materialsMap=new Map,this.materials=[],this.bvhMap=new Map,this.textureAtlas=new xi}updateUvAttributesFromScene(){let{attributes:e}=this,t=new Set(["color"]);for(let r=0;r<8;r++){let i=r===0?"uv":"uv"+r;delete e[i],t.add(i)}this.getRootObject().traverse(r=>{if(r.geometry)for(let i in r.geometry.attributes)t.has(i)&&(e[i]="vec4f")})}updateUvSampleFunction(){let{structs:e,fns:t}=this,r=[],i=null;e.attributes.membersLayout.forEach(({name:o})=>{if(/^uv/.test(o)){let n=o==="uv"?0:Number(o.replace(/^uv/,""));r.push(`
					case ${n}u: {

						return vertexData.${o}.xy;

					}
				`),i===null&&(i=`vertexData.${o}.xy`)}}),t.getUvFromChannel=C`
			fn getUvFromChannel( vertexData: ${e.attributes}, packed: i32 ) -> vec2f {

				// the uv channel is packed into bits 23-25 of the "*Map" descriptor
				let channel = u32( ( packed >> 23 ) & 0x7 );
				switch ( channel ) {

					${r.join(`
`)}
					default: {

						return ${i??"vec2f( 0.0 )"};

					}

				}

			}
		`}updateColorSampleFn(){let{structs:e,fns:t}=this;!!e.attributes.membersLayout.find(({name:i})=>i==="color")?t.getColor=C`
				fn getColor( vertexData: ${e.attributes} ) -> vec4f {

					return vertexData.color;

				}
			`:t.getColor=C`
				fn getColor( vertexData: ${e.attributes} ) -> vec4f {

					return vec4f( 1.0 );

				}
			`}useTransparencyRaycastFn(){let{textureAtlas:e,storage:t,fns:r}=this,i=e.texture,o=gr(e.textureInfo,"uvec4"),n=Eo(o,he(i));r.getSurfaceRecord=Af(n,r.getUvFromChannel,r.getColor);let a=at().toVar("bvh_materialIndex"),l=Ue(1).toVar("bvh_rayScalar"),f=Ue(1).toVar("bvh_baseOpacity"),c=sa(!1).toVar("bvh_isShadowRay"),u=sa(!1).toVar("bvh_skipShadowObject"),p={shapeStruct:z,resultStruct:ys,boundsOrderFn:C`
				fn getBoundsOrder( ray: ${z}, splitAxis: u32, node: ${He} ) -> bool {

					return ray.direction[ splitAxis ] >= 0.0;

				}
			`,intersectsBoundsFn:C`
				fn rayIntersectsBounds( ray: ${z}, bounds: ${et}, result: ptr<function, ${ys}> ) -> u32 {

					// early-out if our object is completely transparent
					if ( ${f} == 0.0 ) {

						return 0u;

					}

					let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
					let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

					let invDir = 1.0 / ray.direction;
					let tMinPlane = ( boundsMin - ray.origin ) * invDir;
					let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

					let tMinHit = min( tMinPlane, tMaxPlane );
					let tMaxHit = max( tMinPlane, tMaxPlane );

					let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
					let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

					let dist = max( t0, 0.0 );
					if ( t1 < dist ) {

						return 0u;

					} else if ( ray.maxDist > 0.0 && dist * ${l} >= ray.maxDist ) {

						return 0u;

					} else if ( result.didHit && dist * ${l} >= result.dist ) {

						return 0u;

					} else {

						return 1u;

					}

				}

			`,intersectRangeFn:C`
				fn intersectRange( ray: ${z}, offset: u32, count: u32, result: ptr<function, ${ys}> ) -> bool {

					var didHit = false;
					for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

						let i0 = ${t.index}[ ti * 3u ];
						let i1 = ${t.index}[ ti * 3u + 1u ];
						let i2 = ${t.index}[ ti * 3u + 2u ];

						let a = ${t.attributes}[ i0 ].position.xyz;
						let b = ${t.attributes}[ i1 ].position.xyz;
						let c = ${t.attributes}[ i2 ].position.xyz;

						var triResult = ${mo}( ray, a, b, c, 0.0 );
						triResult.dist *= ${l};
						if ( triResult.didHit && ( ray.maxDist <= 0.0 || triResult.dist < ray.maxDist ) && ( ! result.didHit || triResult.dist < result.dist ) ) {

							let material = ${t.materials}[ ${a} ];

							// TODO: if material is a transmissive volume we may need to assume double-sidedness
							// shadow rays hit both sides
							if ( ! ${c} && material.side != 0 && triResult.side != material.side ) {

								continue;

							}

							if ( material.transparent != 0 || material.alphaTest > 0.0 ) {

								var opacity = ${f};

								// add support for vertex color opacity
								if ( material.vertexColors == 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getColor}( ${t.attributes}[ i0 ] );
									let b = ${r.getColor}( ${t.attributes}[ i1 ] );
									let c = ${r.getColor}( ${t.attributes}[ i2 ] );
									let col = barycoord.x * a + barycoord.y * b + barycoord.z * c;

									opacity *= col.a;

								}

								// account for alpha component of albedo map
								if ( material.map != - 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getUvFromChannel}( ${t.attributes}[ i0 ], material.map );
									let b = ${r.getUvFromChannel}( ${t.attributes}[ i1 ], material.map );
									let c = ${r.getUvFromChannel}( ${t.attributes}[ i2 ], material.map );
									let uv = barycoord.x * a + barycoord.y * b + barycoord.z * c;
									let uvPrime = material.mapTransform * vec3f( uv, 1 );

									opacity *= ${n}( uvPrime.xy, material.map, 0 ).a;

								}

								// account for green component of alpha map
								if ( material.alphaMap != - 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getUvFromChannel}( ${t.attributes}[ i0 ], material.alphaMap );
									let b = ${r.getUvFromChannel}( ${t.attributes}[ i1 ], material.alphaMap );
									let c = ${r.getUvFromChannel}( ${t.attributes}[ i2 ], material.alphaMap );
									let uv = barycoord.x * a + barycoord.y * b + barycoord.z * c;
									let uvPrime = material.alphaMapTransform * vec3f( uv, 1 );

									opacity *= ${n}( uvPrime.xy, material.alphaMap, 0 ).g;

								}

								// Opacity is resolved at surface processing but skip full transparent hits here.
								if ( material.transparent != 0 && opacity <= 0.0 ) {

									continue;

								}

								if ( opacity < material.alphaTest ) {

									continue;

								}

							}

							// shadow rays pass the objects not visible to them, but a bsdf ray would hit this face
							if ( ${u} ) {

								if ( material.side == 0 || triResult.side == material.side ) {

									result.forwardBlocked = true;

								}

								continue;

							}

							result.didHit = true;
							result.dist = triResult.dist;
							result.normal = triResult.normal;
							result.side = triResult.side;
							result.barycoord = triResult.barycoord;
							result.indices = vec4u( i0, i1, i2, ti );

							didHit = true;

						}

					}

					return didHit;

				}
			`,transformShapeFn:C`
				fn transformRay( ray: ptr<function, ${z}>, objectIndex: u32 ) -> void {

					let toLocal = ${t.transforms}[ objectIndex ].inverseMatrixWorld;
					ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
					ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

					let len = length( ray.direction );
					ray.direction /= len;
					${l} = 1.0 / len;

					let object = ${t.transforms}[ objectIndex ];
					${a} = object.materialIndex;

					let material = ${t.materials}[ object.materialIndex ];
					if ( material.transparent == 1 ) {

						${f} = material.opacity * object.color.a;

					} else {

						${f} = 1.0;

					}

					${u} = ${c} && object.visibleToShadowRays == 0u;

				}
			`,transformResultFn:C`
				fn transformResult( hit: ptr<function, ${ys}>, objectIndex: u32 ) -> void {

					let toLocal = ${t.transforms}[ objectIndex ].inverseMatrixWorld;
					hit.normal = normalize( ( transpose( toLocal ) * vec4f( hit.normal, 0.0 ) ).xyz );
					hit.objectIndex = objectIndex;

				}
			`,resetShapeFn:C`
				fn resetRayScalar( objectIndex: u32 ) -> void {

					${l} = 1.0;
					${f} = 1.0;

				}
			`};r.raycastFirstHit=this.getShapecastFn({...p,name:"raycastFirstHit",prefixFn:C`
				fn initFirstHitCull() -> void {

					${c} = false;

				}
			`}),r.raycastShadow=this.getShapecastFn({...p,name:"raycastShadow",prefixFn:C`
				fn initShadowCull() -> void {

					${c} = true;

				}
			`})}update(){let{structs:e}=this,t=new L(new Uint8Array,e.material.getLength());this.storage.materials=O(t,e.material).toReadOnly().setName("bvh_materials"),this.updateUvAttributesFromScene(),this.updateMaterialsMap(),super.update(),this.updateUvSampleFunction(),this.updateColorSampleFn(),this.updateMaterials(),this.bvhMap.clear(),this.useTransparencyRaycastFn()}updateMaterialsMap(){let{materials:e,materialsMap:t}=this;t.clear(),e.length=0,this.getRootObject().traverse(i=>{i.material&&(Array.isArray(i.material)?i.material.forEach(o=>o&&r(o)):r(i.material))}),e.sort((i,o)=>i.uuid<o.uuid?1:-1).forEach((i,o)=>{t.set(i,o)});function r(i){t.has(i)||(e.push(i),t.set(i,-1))}}updateMaterials(){this.updateMaterialsMap();let{materials:e,storage:t,structs:r,bvh:i}=this,{materialData:o,textures:n}=this.writeMaterialsBuffer(e),a=t.materials.proxyNode,l=t.transforms.proxyNode,f=o.length/r.material.getLength();a.value.count<f&&(a.value.dispose(),a.value=new L(o,r.material.getLength())),a.value.array.set(o),a.value.needsUpdate=!0,this._getTransformMap(i).forEach(c=>{this.writeMaterialData(c,c.slot,l.value.array.buffer)}),l.value.needsUpdate=!0,this.textures=n}writeMaterialsBuffer(e){function t(p){switch(p){case Ke:return 0;case hr:return 1;case nc:return 2;default:return 0}}function r(p,d){if(d in p&&p[d]){let h=p[d],g=rp(h);a.has(g)||(a.set(g,a.size),l.push(h));let x=a.get(g),b=h.channel&7,m=t(h.wrapS),v=t(h.wrapT);return(h.magFilter===nt?1:0)<<30|v<<28|m<<26|b<<23|x&8388607}else return-1}function i(p,d,h){return d in p?p[d]:h}function o(p,d,h,g){let x=p[d]&&p[d].isTexture?p[d]:null;if(x){x.matrixAutoUpdate&&x.updateMatrix();let b=x.matrix.elements;for(let m=0;m<3;m++)h[g+4*m+0]=b[3*m+0],h[g+4*m+1]=b[3*m+1],h[g+4*m+2]=b[3*m+2],h[g+4*m+3]=0}return 12}let n=0,a=new Map,l=[],f=Math.max(e.length,2),c=new Float32Array(f*this.structs.material.getLength()),u=new Int32Array(c.buffer);for(let p=0,d=e.length;p<d;p++){let h=e[p];c[n++]=h.color.r,c[n++]=h.color.g,c[n++]=h.color.b,u[n++]=r(h,"map"),c[n++]=i(h,"metalness",0),u[n++]=r(h,"metalnessMap"),c[n++]=i(h,"roughness",0),u[n++]=r(h,"roughnessMap"),c[n++]=i(h,"ior",1.5),c[n++]=i(h,"transmission",0),u[n++]=r(h,"transmissionMap"),c[n++]=i(h,"emissiveIntensity",0),"emissive"in h?(c[n++]=h.emissive.r,c[n++]=h.emissive.g,c[n++]=h.emissive.b):(c[n++]=0,c[n++]=0,c[n++]=0),u[n++]=r(h,"emissiveMap"),u[n++]=r(h,"normalMap"),n++,"normalScale"in h?(c[n++]=h.normalScale.x,c[n++]=h.normalScale.y):(c[n++]=1,c[n++]=1),c[n++]=i(h,"clearcoat",0),u[n++]=r(h,"clearcoatMap"),u[n++]=r(h,"clearcoatNormalMap"),n++,"clearcoatNormalScale"in h?(c[n++]=h.clearcoatNormalScale.x,c[n++]=h.clearcoatNormalScale.y):(c[n++]=1,c[n++]=1),c[n++]=i(h,"clearcoatRoughness",0),u[n++]=r(h,"clearcoatRoughnessMap"),u[n++]=r(h,"iridescenceMap"),u[n++]=r(h,"iridescenceThicknessMap"),c[n++]=i(h,"iridescence",0),c[n++]=i(h,"iridescenceIOR",1.3);let g=i(h,"iridescenceThicknessRange",[100,400]);c[n++]=g[0],c[n++]=g[1],c[n++]=i(h,"diffuseRoughness",0),c[n++]=i(h,"dispersion",0),"specularColor"in h?(c[n++]=h.specularColor.r,c[n++]=h.specularColor.g,c[n++]=h.specularColor.b):(c[n++]=1,c[n++]=1,c[n++]=1),u[n++]=r(h,"specularColorMap"),c[n++]=i(h,"specularIntensity",1),u[n++]=r(h,"specularIntensityMap");let x=i(h,"thickness",0)===0&&i(h,"attenuationDistance",1/0)===1/0;if(u[n++]=Number(x),n++,"attenuationColor"in h?(c[n++]=h.attenuationColor.r,c[n++]=h.attenuationColor.g,c[n++]=h.attenuationColor.b):(c[n++]=1,c[n++]=1,c[n++]=1),c[n++]=i(h,"attenuationDistance",1/0),u[n++]=r(h,"alphaMap"),u[n++]=Number(i(h,"castShadow",!0)),c[n++]=h.opacity,c[n++]=h.alphaTest,!x&&h.transmission>0)c[n++]=0;else switch(h.side){case dr:c[n++]=1;break;case Ur:c[n++]=-1;break;case Nn:c[n++]=0;break}u[n++]=Number(i(h,"matte",!1)),c[n++]=i(h,"sheen",0),n++,"sheenColor"in h?(c[n++]=h.sheenColor.r,c[n++]=h.sheenColor.g,c[n++]=h.sheenColor.b):(c[n++]=0,c[n++]=0,c[n++]=0),u[n++]=r(h,"sheenColorMap"),c[n++]=i(h,"sheenRoughness",0),u[n++]=r(h,"sheenRoughnessMap"),u[n++]=Number(h.vertexColors),u[n++]=Number(h.flatShading),u[n++]=Number(h.transparent),u[n++]=0,c[n++]=i(h,"anisotropy",0),c[n++]=i(h,"anisotropyRotation",0),u[n++]=r(h,"anisotropyMap"),n++,n++,n++,n+=o(h,"map",c,n),n+=o(h,"metalnessMap",c,n),n+=o(h,"roughnessMap",c,n),n+=o(h,"transmissionMap",c,n),n+=o(h,"emissiveMap",c,n),n+=o(h,"normalMap",c,n),n+=o(h,"clearcoatMap",c,n),n+=o(h,"clearcoatNormalMap",c,n),n+=o(h,"clearcoatRoughnessMap",c,n),n+=o(h,"sheenColorMap",c,n),n+=o(h,"sheenRoughnessMap",c,n),n+=o(h,"iridescenceMap",c,n),n+=o(h,"iridescenceThicknessMap",c,n),n+=o(h,"specularColorMap",c,n),n+=o(h,"specularIntensityMap",c,n),n+=o(h,"alphaMap",c,n),n+=o(h,"anisotropyMap",c,n)}return{materialData:u,textures:l}}writeMaterialData(e,t,r){let{materialsMap:i}=this,{object:o,instanceId:n,root:a}=e,l=o.material;if(Array.isArray(l)){let{materialIndex:p}=o.geometry.groups[a];l=l[p]}let f=new Uint32Array(r),c=i.has(l)?i.get(l):-1;c===-1&&(f[t*xs.getLength()+32]=0),f[t*xs.getLength()+33]=c,o.isInstancedMesh&&o.instanceColor?(o.getColorAt(n,hn),hn.w=1):o.isBatchedMesh&&o._colorsTexture?o.getColorAt(n,hn):hn.setScalar(1);let u=new Float32Array(r);hn.toArray(u,t*xs.getLength()+36)}writeTransformData(e,t,r,i){super.writeTransformData(e,t,r,i),this.writeMaterialData(e,r,i);let o=new Uint32Array(i);o[r*this.structs.transform.getLength()+34]=e.object.visibleToShadowRays===!1?0:1}getBVH(e,t,r){let{bvhMap:i}=this,o=super.getBVH(e,t,r);if(i.has(o)){let n=i.get(o);if(Object.assign(r,n.range),o!==n.bvh&&o instanceof vt){let a=o.mesh,l=n.bvh.mesh;l.matrixWorld.copy(a.matrixWorld).decompose(l.position,l.quaternion,l.scale),o.refit(),o.getBoundingBox(l.boundingBox),o.geometry.computeBoundingBox()}return n.bvh}else if(o.indirect){let n=new Ln;n.attributes=o.geometry.attributes;let a;if(o.geometry.index)a=o.geometry.index.array.slice(r.start,r.count+r.start);else{let{start:f,count:c}=r;a=new Uint32Array(c);for(let u=0,p=r.count;u<p;u++)a[u]=f+u}n.index=new st(a,1),r.start=0;let l;if(o instanceof vt){let f=o.mesh,c=new gc(n);c.copy(f),c.matrixWorld.copy(f.matrixWorld).decompose(c.position,c.quaternion,c.scale),l=new vt(c,{strategy:2,targetLeafSize:5})}else l=new Et(n,{strategy:2,targetLeafSize:5});return i.set(o,{bvh:l,range:{...r}}),l}else return o}dispose(){let{storage:e}=this;for(let t in e)e[t].value?.dispose()}};var bs=class extends Ht{set texture(e){this._texNode.value=e}set layer(e){this._layerUniform.value=e}constructor(){super(),this.blending=Vr,this._texNode=he(new ye),this._layerUniform=N(0),this.colorNode=$(`
			fn atlasDebug( tex: texture_2d_array<f32>, coord: vec2f, layer: f32 ) -> vec4f {

				// flip y so texel origin shows at the top-left
				let dims = vec2f( textureDimensions( tex, 0 ).xy );
				let texel = vec2i( vec2f( coord.x, 1.0 - coord.y ) * dims );
				return textureLoad( tex, texel, i32( layer ), 0 );

			}
		`)(this._texNode,Gt(Wt()),this._layerUniform)}};var ws=class extends Ht{set texture(e){this._texNode.value=e}set minCount(e){this._minUniform.value=e}set maxCount(e){this._maxUniform.value=e}constructor(){super(),this.blending=Vr,this._texNode=he(new ue(1,1)),this._minUniform=N(0),this._maxUniform=N(1);let e=C`
			fn sampleDensity( tex: texture_2d<u32>, coord: vec2f, minCount: f32, maxCount: f32 ) -> vec4f {

				let dims = vec2f( textureDimensions( tex, 0 ) );
				let texel = vec2i( coord * dims );

				// the high bits hold the ray state flags rather than part of the count
				let samples = textureLoad( tex, texel, 0 ).r & ${ir}u;

				// stretched across the recorded range rather than from zero, otherwise a converged
				// image with counts bunched near the max reads as uniformly hot
				let range = max( maxCount - minCount, 1.0 );
				let t = clamp( ( f32( samples ) - minCount ) / range, 0.0, 1.0 );

				return vec4f( ${Ga}( t ), 1.0 );

			}
		`;this.colorNode=e(this._texNode,Gt(Wt()),this._minUniform,this._maxUniform)}};function np(s,e){if(!s.index){let t=s.attributes.position.count,r=new Array(t);for(let i=0;i<t;i++)r[i]=i;s.setIndex(r)}if(!s.attributes.normal&&e&&e.includes("normal")&&s.computeVertexNormals(),!s.attributes.uv&&e&&e.includes("uv")){let t=s.attributes.position.count;s.setAttribute("uv",new st(new Float32Array(t*2),2,!1))}if(!s.attributes.uv2&&e&&e.includes("uv2")){let t=s.attributes.position.count;s.setAttribute("uv2",new st(new Float32Array(t*2),2,!1))}if(!s.attributes.tangent&&e&&e.includes("tangent"))if(s.attributes.uv&&s.attributes.normal)s.computeTangents();else{let t=s.attributes.position.count;s.setAttribute("tangent",new st(new Float32Array(t*4),4,!1))}if(!s.attributes.color&&e&&e.includes("color")){let t=s.attributes.position.count,r=new Float32Array(t*4);r.fill(1),s.setAttribute("color",new st(r,4))}}var _s=class{init(){}getBsdfNode(){return C`

			fn bsdfSample( worldWo: vec3f, surf: SurfaceRecord ) -> ScatterRecord {

				var record: ScatterRecord;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = ${vf}( wo, ${ft}( ${Bo} ) );
				record.color = surf.color * max( wi.z, 0.0 );
				record.pdf = max( wi.z, 0.0 ) / PI;
				record.direction = normalize( surf.normalBasis * wi );

				return record;

			}

		`}getBsdfEvalPdfNode(){return C`

			fn bsdfEvalPdf( worldWo: vec3f, worldWi: vec3f, surf: SurfaceRecord ) -> ScatterRecord {

				var record: ScatterRecord;
				record.direction = worldWi;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = normalize( surf.normalInvBasis * worldWi );
				record.color = surf.color * max( wi.z, 0.0 );
				record.pdf = max( wi.z, 0.0 ) / PI;

				return record;

			}

		`}getData(){return{bsdfSample:this.getBsdfNode(),bsdfEvalPdf:this.getBsdfEvalPdfNode()}}};var wm=$(`

	fn eonDirectionalAlbedo( mu: f32, roughness: f32, A: f32 ) -> f32 {

		let muComp = 1.0 - mu;
		let gOverPi = muComp * (
			0.0571085289 + muComp * (
				0.491881867 + muComp * (
					- 0.332181442 + muComp * 0.0714429953
				)
			)
		);
		return A * ( 1.0 + roughness * gOverPi );

	}

`),op=$(`

	fn fonSingleScatter( NdotV: f32, NdotL: f32, VdotH: f32, roughness: f32, A: f32, rho: vec3f ) -> vec3f {

		let VdotL = 2.0 * VdotH * VdotH - 1.0;
		let s = VdotL - NdotV * NdotL;
		let sOverT = select( s, s / max( NdotV, NdotL ), s > 0.0 );

		return ( rho / PI ) * A * ( 1.0 + roughness * sOverT );

	}

`,[K]),e1=$(`

	fn fonBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		let roughness = surf.diffuseRoughness;
		if ( roughness < 1e-5 ) {

			return surf.color / PI;

		}

		let rho = saturate( surf.color );
		let A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );

		return fonSingleScatter( NdotV, NdotL, VdotH, roughness, A, rho );

	}

`,[K,Ie,op]),sp=$(`

	fn eonBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		let roughness = surf.diffuseRoughness;
		if ( roughness < 1e-5 ) {

			return surf.color / PI;

		}

		let rho = saturate( surf.color );
		let A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		let singleScatter = fonSingleScatter( NdotV, NdotL, VdotH, roughness, A, rho );

		let averageDirectionalAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		let directionalAlbedoV = eonDirectionalAlbedo( NdotV, roughness, A );
		let directionalAlbedoL = eonDirectionalAlbedo( NdotL, roughness, A );

		let rhoMultiScatter = rho * rho * averageDirectionalAlbedo /
			max( vec3f( 1e-7 ), vec3f( 1.0 ) - rho * ( 1.0 - averageDirectionalAlbedo ) );
		let multiScatter = ( rhoMultiScatter / PI ) *
			max( 1e-7, 1.0 - directionalAlbedoV ) *
			max( 1e-7, 1.0 - directionalAlbedoL ) /
			max( 1e-7, 1.0 - averageDirectionalAlbedo );

		return singleScatter + multiScatter;

	}

`,[K,Ie,wm,op]),ap=$(`

	fn eonLtcCoeffs( mu: f32, roughness: f32 ) -> vec4f {

		let a = 1.0 + roughness * (
			0.303392 + ( - 0.518982 + 0.111709 * mu ) * mu +
			( - 0.276266 + 0.335918 * mu ) * roughness
		);
		let b = roughness * (
			- 1.16407 + 1.15859 * mu + ( 0.150815 - 0.150105 * mu ) * roughness
		) / ( mu * mu * mu - 1.43545 );
		let c = 1.0 + roughness * ( 0.20013 + ( - 0.506373 + 0.261777 * mu ) * mu );
		let d = roughness * (
			0.540852 + ( - 1.01625 + 0.475392 * mu ) * mu
		) / ( - 1.0743 + ( 0.0725628 + mu ) * mu );

		return vec4f( a, b, c, d );

	}

`),lp=$(`

	fn eonLtcBasis( wo: vec3f ) -> mat3x3f {

		let lenSqr = dot( wo.xy, wo.xy );
		let invLen = inverseSqrt( max( lenSqr, 1e-7 ) );
		let x = select(
			vec3f( 1.0, 0.0, 0.0 ),
			vec3f( wo.x, wo.y, 0.0 ) * invLen,
			lenSqr > 0.0,
		);
		let y = vec3f( - x.y, x.x, 0.0 );

		return mat3x3f( x, y, vec3f( 0.0, 0.0, 1.0 ) );

	}

`),_m=$(`

	fn eonCltcPdf( wo: vec3f, wi: vec3f, roughness: f32 ) -> f32 {

		let toLtc = transpose( eonLtcBasis( wo ) );
		let wiLtc = toLtc * wi;
		let coeffs = eonLtcCoeffs( saturate( wo.z ), roughness );
		let a = coeffs.x;
		let b = coeffs.y;
		let c = coeffs.z;
		let d = coeffs.w;
		let detM = c * ( a - b * d );
		let wh = vec3f(
			c * ( wiLtc.x - b * wiLtc.z ),
			( a - b * d ) * wiLtc.y,
			- c * ( d * wiLtc.x - a * wiLtc.z ),
		);
		let lenSqr = max( dot( wh, wh ), 1e-7 );
		let vz = inverseSqrt( d * d + 1.0 );
		let s = 0.5 * ( 1.0 + vz );
		let jacobian = detM * detM / ( lenSqr * lenSqr );

		return jacobian * max( wh.z, 0.0 ) / ( PI * s );

	}

`,[K,ap,lp]),Tm=$(`

	fn eonCltcDirection( wo: vec3f, roughness: f32, uv: vec2f ) -> vec3f {

		let coeffs = eonLtcCoeffs( saturate( wo.z ), roughness );
		let a = coeffs.x;
		let b = coeffs.y;
		let c = coeffs.z;
		let d = coeffs.w;
		let radius = sqrt( uv.x );
		let phi = 2.0 * PI * uv.y;
		let y = radius * sin( phi );
		let vz = inverseSqrt( d * d + 1.0 );
		let s = 0.5 * ( 1.0 + vz );
		let x = - mix( sqrt( max( 1.0 - y * y, 0.0 ) ), radius * cos( phi ), s );
		let wh = vec3f( x, y, sqrt( max( 1.0 - x * x - y * y, 0.0 ) ) );
		let wiUnnormalized = vec3f(
			a * wh.x + b * wh.z,
			c * wh.y,
			d * wh.x + wh.z,
		);
		let wi = normalize( eonLtcBasis( wo ) * wiUnnormalized );

		return wi;

	}

`,[K,ap,lp]),Sm=$(`

	fn eonUniformHemisphereSample( uv: vec2f ) -> vec3f {

		let sinTheta = sqrt( max( 1.0 - uv.x * uv.x, 0.0 ) );
		let phi = 2.0 * PI * uv.y;
		return vec3f( sinTheta * cos( phi ), sinTheta * sin( phi ), uv.x );

	}

`,[K]),cp=$(`

	fn eonUniformProbability( wo: vec3f, roughness: f32 ) -> f32 {

		let mu = saturate( wo.z );
		return clamp( pow( roughness, 0.1 ), 0.0, 1.0 ) * (
			0.162925 + ( - 0.372058 + ( 0.538233 - 0.290822 * mu ) * mu ) * mu
		);

	}

`),up=$(`

	fn eonDirection( wo: vec3f, roughness: f32, uv: vec2f ) -> vec3f {

		let uniformProbability = eonUniformProbability( wo, roughness );
		if ( uv.x <= uniformProbability && uniformProbability > 0.0 ) {

			return eonUniformHemisphereSample( vec2f( uv.x / uniformProbability, uv.y ) );

		}

		let cltcProbability = 1.0 - uniformProbability;
		let cltcUv = vec2f(
			( uv.x - uniformProbability ) / max( cltcProbability, 1e-7 ),
			uv.y,
		);
		return eonCltcDirection( wo, roughness, cltcUv );

	}

`,[Tm,Sm,cp]),fp=$(`

	fn eonPdf( wo: vec3f, wi: vec3f, roughness: f32 ) -> f32 {

		// The EON proposal is defined over the positive hemisphere.
		if ( wo.z <= 0.0 || wi.z <= 0.0 ) {

			return 0.0;

		}

		let uniformProbability = eonUniformProbability( wo, roughness );
		let cltcProbability = 1.0 - uniformProbability;
		let uniformPdf = 1.0 / ( 2.0 * PI );

		return uniformProbability * uniformPdf +
			cltcProbability * eonCltcPdf( wo, wi, roughness );

	}

`,[K,_m,cp]);var Im=C`

	fn velvetD( cosThetaH: f32, roughness: f32 ) -> f32 {

		var alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		let invAlpha = 1.0 / alpha;
		let sqrCosThetaH = cosThetaH * cosThetaH;
		let sinThetaH = max( 1.0 - sqrCosThetaH, 0.001 );

		return ( 2.0 + invAlpha ) * pow( sinThetaH, 0.5 * invAlpha ) / ( 2.0 * PI );

	}

`,mn=C`

	fn velvetParamsInterpolate( i: i32, oneMinusAlphaSquared: f32 ) -> f32 {

		let p0 = array<f32, 5>( 25.3245, 3.32435, 0.16801, - 1.27393, - 4.85967 );
		let p1 = array<f32, 5>( 21.5473, 3.82987, 0.19823, - 1.97760, - 4.32054 );

		return mix( p1[ i ], p0[ i ], oneMinusAlphaSquared );

	}

`,fl=C`

	fn velvetL( x: f32, alpha: f32 ) -> f32 {

		let oneMinusAlpha = 1.0 - alpha;
		let oneMinusAlphaSquared = oneMinusAlpha * oneMinusAlpha;

		let a = ${mn}( 0, oneMinusAlphaSquared );
		let b = ${mn}( 1, oneMinusAlphaSquared );
		let c = ${mn}( 2, oneMinusAlphaSquared );
		let d = ${mn}( 3, oneMinusAlphaSquared );
		let e = ${mn}( 4, oneMinusAlphaSquared );

		return a / ( 1.0 + b * pow( abs( x ), c ) ) + d * x + e;

	}

`,pp=C`

	fn velvetLambda( cosTheta: f32, alpha: f32 ) -> f32 {

		if ( abs( cosTheta ) < 0.5 ) {

			return exp( ${fl}( cosTheta, alpha ) );

		} else {

			return exp( 2.0 * ${fl}( 0.5, alpha ) - ${fl}( 1.0 - cosTheta, alpha ) );

		}

	}

`,Cm=C`

	fn velvetG( cosThetaO: f32, cosThetaI: f32, roughness: f32 ) -> f32 {

		var alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		return 1.0 / ( 1.0 + ${pp}( cosThetaO, alpha ) + ${pp}( cosThetaI, alpha ) );

	}

`,dp=C`

	fn directionalAlbedoSheen( cosThetaIn: f32, alpha: f32 ) -> f32 {

		let cosTheta = saturate( cosThetaIn );
		let c = 1.0 - cosTheta;
		let c3 = c * c * c;

		return 0.65584461 * c3 + 1.0 / ( 4.16526551 + exp( -7.97291361 * sqrt( alpha ) + 6.33516894 ) );

	}

`,hp=C`

	fn sheenAlbedoScaling( wo: vec3f, wi: vec3f, surf: ${Ie} ) -> f32 {

		var alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		let maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		let eWo = ${dp}( clamp( wo.z, 0.001, 1.0 ), alpha );
		let eWi = ${dp}( clamp( wi.z, 0.001, 1.0 ), alpha );

		return min( 1.0 - maxSheenColor * eWo, 1.0 - maxSheenColor * eWi );

	}

`,mp=C`

	fn sheenColor( wo: vec3f, wi: vec3f, wh: vec3f, surf: ${Ie} ) -> vec3f {

		let cosThetaO = clamp( wo.z, 0.001, 1.0 );
		let cosThetaI = clamp( wi.z, 0.001, 1.0 );
		let cosThetaH = wh.z;

		let D = ${Im}( cosThetaH, surf.sheenRoughness );
		let G = ${Cm}( cosThetaO, cosThetaI, surf.sheenRoughness );

		// See equation (1) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
		var color = surf.sheenColor;
		color *= D * G / ( 4.0 * abs( cosThetaO * cosThetaI ) );

		return color;

	}

`;var Ts=32,Ss=16,Is=class extends Cc{constructor(){super(Ts,Ts,31),this.type=Be,this.format=Se,this.minFilter=_e,this.magFilter=_e,this.dielectricLayerCount=10,this.transmissiveLayerCount=10,this.minIoR=1,this.maxIoR=2.5,this.sampleConductorFn=Y("_sampleConductorFn",this),this.sampleDielectricFn=Y("_sampleDielectricFn",this),this.sampleTransmissiveFn=Y("_sampleTransmissiveFn",this)}generate(e){let{dielectricLayerCount:t,transmissiveLayerCount:r,minIoR:i,maxIoR:o}=this,n={outputTarget:Nc(this).toWriteOnly(),globalId:fe,eta:N(1),layer:N(0,"uint"),includeFresnel:N(0),includeRefraction:N(0)},a=[Ts/Ss,Ts/Ss,1],l=new ne(Nf(n.outputTarget)(n),{workgroupSize:[Ss,Ss,1]});n.layer.value=0,n.eta.value=1,n.includeFresnel.value=0,n.includeRefraction.value=0,e.compute(l.kernel,a);for(let g=0;g<t;g++)n.layer.value++,n.eta.value=1/ia.mapLinear(g,0,t-1,i,o),n.includeFresnel.value=1,e.compute(l.kernel,a);n.includeFresnel.value=1,n.includeRefraction.value=1;for(let g=0;g<r;g++){let x=ia.mapLinear(g,0,r-1,i,o);n.layer.value=1+t+g,n.eta.value=1/x,e.compute(l.kernel,a),n.layer.value=1+t+r+g,n.eta.value=x,e.compute(l.kernel,a)}l.dispose();let f=C`
			fn mapLinearClamped( v: f32, a0: f32, a1: f32, b0: f32, b1: f32 ) -> f32 {

				let mapped = saturate( ( v - a0 ) / ( a1 - a0 ) );
				return mix( b0, b1, mapped );

			}
		`,c=Fc(this).setName("turquinTexture"),u=xt(this).setName("turquinSampler"),p=1/(1+t+2*r);this._sampleConductorFn=C`
			fn sampleConductor( cosTheta0: f32, roughness: f32 ) -> f32 {

				let layer = 0.5;
				let uvw = vec3f( cosTheta0, roughness, layer * ${p} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`,this._sampleDielectricFn=C`
			fn sampleDielectric( cosTheta0: f32, roughness: f32, ior: f32 ) -> f32 {

				let blockStart = 1.0;
				let layer = ${f}(
					ior,
					f32( ${i} ), f32( ${o} ),
					0.5, f32( ${t} ) - 0.5,
				) + blockStart;

				let uvw = vec3f( cosTheta0, roughness, layer * ${p} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`;let d=1+t,h=1+t+r;this._sampleTransmissiveFn=C`
			fn sampleTransmissive( cosTheta0: f32, roughness: f32, ior: f32, entering: bool ) -> f32 {

				let blockStart = select(
					f32( ${h} ),
					f32( ${d} ),
					entering
				);
				let layer = ${f}(
					ior,
					f32( ${i} ), f32( ${o} ),
					0.5, f32( ${r} ) - 0.5,
				) + blockStart;

				let uvw = vec3f( cosTheta0, roughness, layer * ${p} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`}};var gp=Ue(1.5),xp=Ue(1e6),Cs=class extends _s{constructor(e={}){super();let{specularBrdf:t=rl,specularBtdf:r=il,diffuseBrdf:i=sp,fresnelMix:o=Bf,conductorFresnel:n=$f,fresnelCoat:a=Df,iridescentFresnel:l=nl}=e;this.turquinTexture=new Is,this.specularBrdf=t,this.specularBtdf=r,this.diffuseBrdf=i,this.fresnelMix=o,this.conductorFresnel=n,this.fresnelCoat=a,this.iridescentFresnel=l,this.transmissionFresnel=Rf(l)}init(e){this.turquinTexture.generate(e)}getBsdfNode(){this._bsdfEvalFunc=C`

			// The material is organized as one scoped block per lobe in cascade order - clearcoat,
			// sheen, transmission, specular, diffuse - each accumulating into a shared result and
			// guarding its own hemisphere.
			// TODO: energy only cascades downward through front faces, so the layers are always traversed
			// outside-in and cannot reflect energy back into the glass from below.
			fn bsdfEval( ctx: ${Xa}, surf: ${Ie} ) -> vec3f {

				let NdotV = ctx.V.z;
				let NdotL = ctx.L.z;

				// Each lobe contributes into "result" within its own scope, evaluated in cascade.
				// "attenuation" carries the fraction of energy each layer passes through to
				// the layers beneath it. Every lobe guards its own hemisphere.
				var result = vec3f( 0.0 );
				var attenuation = vec3f( 1.0 );

				// clearcoat
				if ( NdotL > 0.0 && surf.clearcoat > 0.0 ) {

					// the clearcoat evaluates in its own frame
					let toClearcoatMat = surf.clearcoatInvBasis * surf.normalBasis;
					let Vc = normalize( toClearcoatMat * ctx.V );
					let Lc = normalize( toClearcoatMat * ctx.L );
					let Hc = normalize( toClearcoatMat * ctx.H );
					let NdotVc = Vc.z;

					let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;

					// reuse the same pattern for energy conservation used in the dielectric layer
					let clearcoatEnergySS = max( ${this.turquinTexture.sampleConductorFn}( NdotVc, surf.clearcoatRoughness ), 1e-5 );
					let clearcoatBoost = 1.0 + ${Ge}( 1.5 ) * ( 1.0 - clearcoatEnergySS ) / clearcoatEnergySS;

					let clearcoatSpecular = ${this.specularBrdf}( Vc, Lc, Hc, vec2( clearcoatAlpha ) ) * clearcoatBoost;
					let clearcoatFresnel = ${_t}( abs( dot( Vc, Hc ) ), ${Ge}( 1.5 ) );

					// retrieve specular energy reflected by this layer
					let clearcoatFresnelEnergySS = ${this.turquinTexture.sampleDielectricFn}( NdotVc, surf.clearcoatRoughness, 1.5 ) * clearcoatBoost;

					result += surf.clearcoat * clearcoatFresnel * clearcoatSpecular;
					attenuation *= 1.0 - surf.clearcoat * clearcoatFresnelEnergySS;

				}

				// sheen
				if ( NdotL > 0.0 && surf.sheen > 0.0 ) {

					result += attenuation * surf.sheen * ${mp}( ctx.V, ctx.L, ctx.H, surf );
					attenuation *= mix( 1.0, ${hp}( ctx.V, ctx.L, surf ), surf.sheen );

				}

				// transmission
				// handles specular reflection and transmission
				if ( surf.transmission > 0.0 ) {

					let matchedIor = ${ui}( surf.eta );

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// multiscatter compensation
					var glassBoost = 0.0;
					if ( matchedIor ) {

						glassBoost = 1.0;

					} else if ( surf.thinWall ) {

						// thin wall halves are reflection-shaped so each is compensated with the conductor albedo at its own roughness.
						glassBoost = 1.0 / max( ${this.turquinTexture.sampleConductorFn}( NdotV, surf.roughness ), 1e-5 );

					} else {

						// volumetric bsdf is scaled by its total reflected + refracted energy
						glassBoost = 1.0 / max( ${this.turquinTexture.sampleTransmissiveFn}( NdotV, surf.roughness, surf.ior, surf.frontFace ), 1e-5 );

					}

					let fresnelCosine = select( ctx.VdotH, NdotV, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					if ( NdotL < 0.0 ) {

						var refraction = vec3f( 0.0 );
						if ( surf.thinWall && ! matchedIor ) {

							// evaluate the flipped reflection, compensated at the remapped roughness
							let wiMirror = vec3f( ctx.L.xy, - ctx.L.z );
							let thinWallAlpha = vec2f( ${qo}( alphaB, surf.ior ) );
							let thinWallEnergySS = max( ${this.turquinTexture.sampleConductorFn}( NdotV, sqrt( thinWallAlpha.x ) ), 1e-5 );
							refraction = fresnel.transmittance * ${this.specularBrdf}( ctx.V, wiMirror, ctx.H, thinWallAlpha ) / thinWallEnergySS;

						} else if ( ! matchedIor ) {

							// The default BTDF contains the plain dielectric Fresnel complement. Replace it
							// with the colored thin-film-aware coefficient shared by sampling and the PDF.
							let dielectricTransmittance = 1.0 - ${Cr}( abs( ctx.VdotH ), surf.eta );
							if ( dielectricTransmittance > EPSILON ) {

								refraction = ${this.specularBtdf}( ctx.V, ctx.L, ctx.H, alpha, surf.eta ) *
									fresnel.transmittance / dielectricTransmittance * glassBoost;

							}

						}

						// the refracted half is not attenuated by the layers above
						result += ( 1.0 - surf.metalness ) * surf.transmission * refraction * surf.color;

					} else {

						// the raw single scatter lobe scaled by the glass compensation boost rather
						// than the opaque dielectric boost
						let specular = ${this.specularBrdf}( ctx.V, ctx.L, ctx.H, alpha );
						let dielectricSpecular = specular * glassBoost;

						let reflection = dielectricSpecular * fresnel.reflectance;

						result += attenuation * ( 1.0 - surf.metalness ) * surf.transmission * reflection;

					}

				}

				// specular
				// metallic + dielectric + iridescence
				if ( NdotL > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// Sample the single scatter energy for specular at the given roughness
					let energySS = max( ${this.turquinTexture.sampleConductorFn}( NdotV, surf.roughness ), 1e-5 );
					let specular = ${this.specularBrdf}( ctx.V, ctx.L, ctx.H, alpha );

					// metallic with the multiscatter comp
					let metallicBoost = 1.0 + surf.color * ( 1.0 - energySS ) / energySS;
					let metallicSpecular = specular * metallicBoost;
					var metallicReflectance = ${this.conductorFresnel}( ctx.VdotH, surf.color, vec3f( 1.0 ) );

					// dielectric with the multiscatter comp
					let dielectricBoost = 1.0 + surf.f0 * ( 1.0 - energySS ) / energySS;
					let dielectricSpecular = specular * dielectricBoost;

					// KHR_materials_specular: fold the specular color and intensity into the dielectric f0.
					// Schlick is used on both hit sides, matching Cycles - the opaque specular carries no
					// TIR so the energy removed from the base always matches the energy paid back
					let dielectricF0 = min( surf.f0 * surf.specularColor, vec3f( 1.0 ) );
					let dielectricFr = ${ai}( ctx.VdotH, dielectricF0, vec3f( 1.0 ) );
					var dielectricReflectance = surf.specularIntensity * dielectricFr;

					// iridescence
					var filmFresnelMax = 0.0;
					if ( surf.iridescence > 0.0 ) {

						// the media on either side of the film - air outside and the volume interior
						// as the base on front faces, swapped on back faces so TIR can take effect
						let outsideIor = select( surf.ior, 1.0, surf.frontFace );
						let filmBaseIor = select( 1.0, surf.ior, surf.frontFace );

						let metallicFilmFresnel = ${this.iridescentFresnel}( ctx.VdotH, surf.color, surf.iridescenceIor, outsideIor, surf.iridescenceThickness );
						metallicReflectance = mix( metallicReflectance, metallicFilmFresnel, surf.iridescence );

						let dielectricFilmFresnel = ${this.iridescentFresnel}( ctx.VdotH, vec3f( ${Ge}( filmBaseIor ) ), surf.iridescenceIor, outsideIor, surf.iridescenceThickness );
						dielectricReflectance = mix( dielectricReflectance, dielectricFilmFresnel, surf.iridescence );
						filmFresnelMax = max( max( dielectricFilmFresnel.r, dielectricFilmFresnel.g ), dielectricFilmFresnel.b );

					}

					let metallic = metallicSpecular * metallicReflectance;
					let dielectric = dielectricSpecular * dielectricReflectance;

					// the energy the specular interface takes from the layers below
					let fresnelEnergySS = ${this.turquinTexture.sampleDielectricFn}( NdotV, surf.roughness, surf.ior ) * dielectricBoost;

					result += attenuation * mix( ( 1.0 - surf.transmission ) * dielectric, metallic, surf.metalness );
					attenuation *= ( 1.0 - surf.metalness ) * mix( 1.0 - fresnelEnergySS, 1.0 - filmFresnelMax, surf.iridescence );

				}

				// diffuse
				if ( NdotL > 0.0 ) {

					// the dielectric base mixes diffuse with transmission - the transmissive half
					// is carried by the glass lobe above
					let diffuseVdotH = sqrt( saturate( 0.5 * ( 1.0 + dot( ctx.V, ctx.L ) ) ) );
					let reflection = ${this.diffuseBrdf}( NdotV, NdotL, diffuseVdotH, surf );
					let diffuse = ( 1.0 - surf.transmission ) * reflection;

					result += attenuation * diffuse;

				}

				return result;

			}

		`;let e=this.getBsdfEvalPdfNode();return C`

			fn bsdfSample( worldWo: vec3f, surf: ${Ie} ) -> ${Ot} {

				var result: ${Ot};
				result.color = vec3f( 0.0 );
				result.isTransmissive = false;
				result.direction = vec3f( 0.0 );
				result.pdf = 0.0;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let woClearcoat = normalize( surf.clearcoatInvBasis * worldWo );

				// TODO: mirror bsdfEval's layer structure - the glass layer should own both its
				// reflection and refraction halves
				// lobe selection weights and cumulative bounds in cascade order:
				// clearcoat, specular, transmission, diffuse
				let weights = ${Qa}( wo, wo, woClearcoat, vec3( 0, 0, 1 ), ${gp}, surf );
				let cdfClearcoat = weights.clearcoat;
				let cdfSpecular = cdfClearcoat + weights.specular;
				let cdfTransmission = cdfSpecular + weights.transmission;
				let cdfTotal = cdfTransmission + weights.diffuse;

				// random samples for lobes
				let lobeSample = ${wt}( ${af} ) * cdfTotal;
				let directionUV = ${ft}( ${Bo} );

				// output
				var wi: vec3f;
				var wh: vec3f;

				// TODO: see if we can clean up these flags so they're not necessary
				var isTransmissionLobe = false;
				var isDeltaTransmission = false;
				var deltaTransmittance = vec3f( 1.0 );
				var deltaProbability = 1.0;
				var isDead = false;

				if ( lobeSample <= cdfClearcoat ) {

					// clearcoat
					let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;
					let whCoat = ${Pr}( woClearcoat, vec2( clearcoatAlpha ), directionUV );
					let wiCoat = - normalize( reflect( woClearcoat, whCoat ) );

					wi = normalize( surf.normalInvBasis * surf.clearcoatBasis * wiCoat );
					wh = normalize( surf.normalInvBasis * surf.clearcoatBasis * whCoat );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				} else if ( lobeSample <= cdfSpecular ) {

					// specular
					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					wh = ${Pr}( wo, alpha, directionUV );
					wi = - normalize( reflect( wo, wh ) );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				} else if ( lobeSample <= cdfTransmission ) {

					// transmission
					isTransmissionLobe = true;

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// sample the half vector first and select reflection or refraction by the
					// facet fresnel, matching Cycles - total internal reflection drives the
					// fresnel to 1 so TIR facets always reflect with a matching pdf
					wh = ${Pr}( wo, alpha, directionUV );

					let fresnelCosine = select( dot( wo, wh ), wo.z, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					let fresnelSample = ( lobeSample - cdfSpecular ) / ( cdfTransmission - cdfSpecular );
					let doReflect = fresnelSample < fresnel.reflectProbability;
					if ( doReflect ) {

						wi = - normalize( reflect( wo, wh ) );

					} else if ( ${ui}( surf.eta ) ) {

						// With no IOR boundary, rough transmission collapses to straight-through
						// delta transmission independent of the sampled microfacet.
						wi = - wo;
						wh = vec3f( 0.0, 0.0, 1.0 );
						isDeltaTransmission = true;
						deltaTransmittance = fresnel.transmittance;
						deltaProbability = 1.0 - fresnel.reflectProbability;

					} else if ( surf.thinWall ) {

						// model the double refraction as a single reflection flipped through the
						// surface at the remapped thin wall roughness
						let thinWallAlpha = vec2f( ${qo}( alphaB, surf.ior ) );
						wh = ${Pr}( wo, thinWallAlpha, directionUV );
						wi = - normalize( reflect( wo, wh ) );
						wi = vec3f( wi.xy, - wi.z );

					} else {

						wi = refract( - wo, wh, surf.eta );

					}

					// the facet choice must agree with the resulting hemisphere - reflection above,
					// transmission below. Mismatched samples are dropped since their loss is
					// refunded by the energy compensation tables
					isDead = doReflect != ( wi.z > 0.0 );

				} else if ( lobeSample <= cdfTotal ) {

					// diffuse
					// all diffuse BRDF variants share the EON sampling proposal
					wi = ${up}( wo, surf.diffuseRoughness, directionUV );
					wh = normalize( wi + wo );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				}

				let worldWi = normalize( surf.normalBasis * wi );
				if ( isDeltaTransmission ) {

					// Cycles represents a singular event with a large matching BSDF and PDF. Their
					// ratio preserves throughput while forward MIS correctly gives the event full weight.
					result.color = ( 1.0 - surf.metalness ) * surf.transmission * surf.color *
						deltaTransmittance * ${xp};
					result.direction = worldWi;
					result.pdf = weights.transmission * deltaProbability * ${xp};
					result.isTransmissive = dot( worldWi, surf.faceNormal ) < 0.0;

				} else {

					// evaluate the shared eval / pdf function for the sampled direction so the sample
					// and light-sampling paths can never disagree on color or pdf
					result = ${e}( worldWo, worldWi, surf );

				}

				// mismatched glass facets and reflection lobe samples that land below the
				// hemisphere carry no energy - their loss is refunded by the compensation tables
				let invalid = isDead || ( ! isTransmissionLobe && wi.z <= 0.0 );
				result.color *= select( 1.0, 0.0, invalid );

				return result;

			}

		`}getBsdfEvalPdfNode(){if(this._bsdfEvalPdfNode)return this._bsdfEvalPdfNode;this._bsdfEvalFunc||this.getBsdfNode();let e=this._bsdfEvalFunc;return this._bsdfEvalPdfNode=C`

			fn bsdfEvalPdf( worldWo: vec3f, worldWi: vec3f, surf: ${Ie} ) -> ${Ot} {

				var result: ${Ot};
				result.color = vec3f( 0.0 );
				result.isTransmissive = false;
				result.direction = worldWi;
				result.pdf = 0.0;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = normalize( surf.normalInvBasis * worldWi );
				let woClearcoat = normalize( surf.clearcoatInvBasis * worldWo );

				let isTransmission = wi.z < 0.0;
				if ( isTransmission && ${ui}( surf.eta ) ) {

					// Delta transmission has no finite solid-angle BSDF or PDF. It is handled
					// explicitly by bsdfSample, matching PBRT-v4's eta == 1 path.
					return result;

				}

				// reconstruct the half vector bsdfSample would have used for this direction -
				// reflections use the standard half vector while refractions use the generalized
				// form scaled by the ior ratio, oriented into the upper hemisphere
				var wh: vec3f;
				if ( ! isTransmission ) {

					wh = normalize( wo + wi );

				} else if ( surf.thinWall ) {

					// thin wall transmission is modeled as a reflection flipped through the surface
					wh = normalize( wo + vec3f( wi.xy, - wi.z ) );

				} else {

					wh = normalize( wi + wo * surf.eta );
					wh *= sign( wh.z );

				}

				let weights = ${Qa}( wo, wo, woClearcoat, vec3( 0, 0, 1 ), ${gp}, surf );

				// TODO: mirror bsdfEval's layer structure - the glass layer should own both its
				// reflection and refraction halves
				// pdf mixture - every lobe that can produce the direction contributes its share,
				// in the same cascade order and with the same terms as bsdfSample

				// clearcoat
				if ( weights.clearcoat > 0.0 ) {

					// the clearcoat lobe evaluates in its own frame
					let toClearcoatMat = surf.clearcoatInvBasis * surf.normalBasis;
					let wiClearcoat = normalize( toClearcoatMat * wi );
					if ( wiClearcoat.z > 0.0 ) {

						let whClearcoat = normalize( toClearcoatMat * wh );
						let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;
						result.pdf += weights.clearcoat * ${Ar}( woClearcoat, whClearcoat, vec2( clearcoatAlpha ) );

					}

				}

				// specular
				if ( weights.specular > 0.0 && wi.z > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					result.pdf += weights.specular * ${Ar}( wo, wh, alpha );

				}

				// transmission
				if ( weights.transmission > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// the glass lobe selects reflection or refraction by the facet fresnel so
					// each side carries the corresponding share of the transmission pdf
					let fresnelCosine = select( dot( wo, wh ), wo.z, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					if ( wi.z > 0.0 ) {

						result.pdf += weights.transmission * fresnel.reflectProbability * ${Ar}( wo, wh, alpha );

					} else if ( surf.thinWall ) {

						// the flipped reflection shares the reflection pdf at the remapped roughness
						let thinWallAlpha = vec2f( ${qo}( alphaB, surf.ior ) );
						result.pdf += weights.transmission * ( 1.0 - fresnel.reflectProbability ) * ${Ar}( wo, wh, thinWallAlpha );

					} else {

						result.pdf += weights.transmission * ( 1.0 - fresnel.reflectProbability ) * ${Wo}( wo, wi, wh, alpha, surf.eta );

					}

				}

				// diffuse
				if ( weights.diffuse > 0.0 ) {

					result.pdf += weights.diffuse * ${fp}( wo, wi, surf.diffuseRoughness );

				}

				//

				// construct the scatter context
				var ctx: ${Xa};
				ctx.V = wo;
				ctx.L = wi;
				ctx.H = wh;
				ctx.VdotH = saturate( dot( wo, wh ) );

				// evaluate the bsdf for the direction
				result.color = ${e}( ctx, surf ) * abs( wi.z );

				// a direction crossing below the surface enters or leaves the volume
				result.isTransmissive = isTransmission && dot( worldWi, surf.faceNormal ) < 0.0;

				return result;

			}

		`,this._bsdfEvalPdfNode}};var Si=new X,Ps=new En,As=class{constructor(e,t){this.key=t,this.renderer=e,this.texture=null,this.hash=null;let r=new ye(new Uint8Array([255,255,255,255]),1,1);r.minFilter=_e,r.magFilter=_e,this.colorTex=r}dispose(){this.colorTex.dispose(),this.texture?.dispose()}setFromScene(e){let{renderer:t,key:r,colorTex:i}=this,o=e[r],n="";if(o)o.isColor?(i.image.data[0]=o.r*255,i.image.data[1]=o.g*255,i.image.data[2]=o.b*255,i.image.data[3]=255,o=i,n=i.image.data.join(),i.needsUpdate=n!==this.hash):o.isCubeTexture?(n=null,o=new gs(t).generate(o)):(o=o.clone(),n=o.uuid+"_"+o.version);else{let a=t.getClearAlpha();t.getClearColor(Ps),i.image.data[0]=Ps.r*255,i.image.data[1]=Ps.g*255,i.image.data[2]=Ps.b*255,i.image.data[3]=a*255,o=i,n=i.image.data.join(),i.needsUpdate=n!==this.hash}if(n===null)return this.texture?.dispose(),this.texture=o,this.hash=null,!0;{let a=n!==this.hash;return a&&(this.texture?.dispose(),this.texture=o,this.hash=n),a}}},Bs=class{get maxBounces(){return this._pathTracer.maxBounces}set maxBounces(e){this._pathTracer.maxBounces=e,this.reset()}get frameBudget(){return this._pathTracer.frameBudget}set frameBudget(e){this._pathTracer.frameBudget=e}get maxTransparentBounces(){return this._pathTracer.maxTransparentBounces}set maxTransparentBounces(e){this._pathTracer.maxTransparentBounces=e,this.reset()}get maxSamples(){return this._pathTracer.maxSamples}set maxSamples(e){this._pathTracer.maxSamples=e,this._denoiser?.reset()}async getSampleCountsAsync(){let e=this._pathTracer,t=this._lastSampleCounts,r=await e.getSampleCountsAsync();t.min=r.min,t.max=r.max,t.avg=r.avg;let i=this.getRenderTime()/1e3;return t.samplesPerSecond=i>0?t.avg/i:0,{...t}}get transmissiveBackground(){return this._transmissiveBackground}set transmissiveBackground(e){this._transmissiveBackground!==e&&(this._transmissiveBackground=e,this._pathTracer.setTransmissiveBackground(e))}get filterGlossyFactor(){return this._filterGlossyFactor}set filterGlossyFactor(e){this._filterGlossyFactor!==e&&(this._filterGlossyFactor=e,this._pathTracer.setFilterGlossy(e))}get multipleImportanceSampling(){return this._multipleImportanceSampling}set multipleImportanceSampling(e){this._multipleImportanceSampling!==e&&this.setMultipleImportanceSampling(e)}get clampDirect(){return this._clampDirect}set clampDirect(e){e=Math.max(0,e),this._clampDirect!==e&&(this._clampDirect=e,this._pathTracer.setClamping(e,this._clampIndirect))}get clampIndirect(){return this._clampIndirect}set clampIndirect(e){e=Math.max(0,e),this._clampIndirect!==e&&(this._clampIndirect=e,this._pathTracer.setClamping(this._clampDirect,e))}get target(){return this._pathTracer.outputTarget??null}get fadeState(){return this._fadeState}get lowResTarget(){return this._lowResTarget}get lowResMode(){return this._pathTracer.lowResMode}get textureAtlas(){return this._bvhData.textureAtlas}useMegakernel(e){let t=this._pathTracer.maxSamples;this._pathTracer.dispose(),this._pathTracer=e?new os(this._renderer):new dn(this._renderer),this._pathTracer.maxSamples=t,this._pathTracer.setBVHData(this._bvhData),this._pathTracer.setMaterial(this.material),this._pathTracer.setRandom(this.random),this._pathTracer.setMultipleImportanceSampling(this.multipleImportanceSampling),this._pathTracer.setTransmissiveBackground(this._transmissiveBackground),this._pathTracer.setFilterGlossy(this._filterGlossyFactor),this._pathTracer.setClamping(this._clampDirect,this._clampIndirect),this.setCamera(this.camera),this._pathTracer.setEnvironment(this._environmentCache.texture),this._pathTracer.setBackground(this._backgroundCache.texture),this.updateEnvironment(),this.updateLights()}constructor(e){this._renderer=e,this._timer=new _c,this._environmentCache=new As(e,"environment"),this._backgroundCache=new As(e,"background"),this._resetTime=-1,this._fadeState=0,this._lastSampleCounts={min:0,max:0,avg:0,samplesPerSecond:0},this._size=new X,this._blitQuad=new kt(new bo),this._lowResTarget=new ue(1,1),this._lowResTarget.type=ze,this._lowResTarget.generateMipmaps=!1,this._pathTracer=new dn(e),this._denoiser=null,this._upscaler=null,this.minSamples=1,this.renderDelay=500,this.fadeDuration=500,this.dynamicLowRes=!0,this.lowResScale=.1,this.renderScale=1,this.synchronizeRenderSize=!0,this.generateMissingAttributes=!0,this.commonAttributes=["normal","tangent"],this.stableNoise=!0,this.pause=!1,this.filterGlossyFactor=1,this._clampDirect=0,this._clampIndirect=10,this.multipleImportanceSampling=!0,this.transmissiveBackground=di,this.random=ol,this.material=new Cs,this._invViewProjectionMatrix=N(new k),this._cameraRayFnHandle=null,this.setMaterial(this.material),this.setRandom(this.random),this.setScene(new hc,new zn)}setMultipleImportanceSampling(e){this._multipleImportanceSampling=e,this._pathTracer.setMultipleImportanceSampling(e),this.reset()}setDenoiser(e){this._denoiser?.reset(),this._denoiser=e,e&&(e.init(this._renderer),e.setScene(this.scene,this.camera))}setUpscaler(e){this._upscaler=e,e&&e.init(this._renderer)}setScene(e,t){e.updateMatrixWorld(!0),t.updateMatrixWorld(),e.traverse(i=>{this.generateMissingAttributes&&i.geometry?.isBufferGeometry&&np(i.geometry,this.commonAttributes),i.isSkinnedMesh?(i.boundsTree?i.boundsTree.refit():i.boundsTree=new vt(i,{strategy:2,targetLeafSize:5,indirect:!0}),i.boundingBox===null&&(i.boundingBox=new xe),i.boundsTree.getBoundingBox(i.boundingBox)):i.isMesh&&(i.geometry.boundsTree||(i.geometry.boundsTree=new Et(i.geometry,{strategy:2,targetLeafSize:5})))});let r=new vs(e);r.update(),r.textureAtlas.setTextures(this._renderer,r.textures),this._bvhData&&(this._bvhData.dispose(),this._bvhData.textureAtlas.dispose()),this.scene=e,this._bvhData=r,this._pathTracer.setBVHData(r),this.setCamera(t),this.updateEnvironment(),this.updateLights(),this._denoiser?.setScene(e,t)}getMaterial(){return this.material}setMaterial(e){this.material=e,this._pathTracer.setMaterial(e),this.reset()}setRandom(e){this.random=e,this._pathTracer.setRandom(e),this.reset()}setCamera(e){if(this.camera=e,e.getCameraRayFn)this._cameraRayFnHandle=e.getCameraRayFn();else{let t=this._invViewProjectionMatrix;this._cameraRayFnHandle={update:()=>(e.coordinateSystem=Hr,e.updateMatrixWorld(),(e.isOrthographicCamera||e.isPerspectiveCamera)&&e.updateProjectionMatrix(),t.value.multiplyMatrices(e.matrixWorld,e.projectionMatrixInverse),!1),fn:C`
					fn getCameraRay( uv: vec2f, resolution: vec2f, ray: ptr<function, ${z}> ) -> bool {

						let ndc = uv * 2.0 - vec2f( 1.0 );
						*ray = ${er}( ndc, ${t} );
						return true;

					}
				`}}this._bvhData.fns.getCameraRay=this._cameraRayFnHandle.fn,this._cameraRayFnHandle.update(),this._pathTracer.rebuild(),this.reset()}updateMaterials(){let{_bvhData:e,_renderer:t}=this;e.updateMaterials(),e.textureAtlas.setTextures(t,e.textures),this.reset()}updateTransforms(){this.scene.updateMatrixWorld(!0),this._bvhData.updateTransforms(),this.reset()}updateCamera(){let{_cameraRayFnHandle:e,_pathTracer:t}=this;e.update()&&t.rebuild(),this.reset()}updateEnvironment(){let{_pathTracer:e,scene:t,_environmentCache:r,_backgroundCache:i}=this;r.setFromScene(t)&&e.setEnvironment(r.texture),i.setFromScene(t)&&e.setBackground(i.texture),e.setEnvironmentParams(t.environmentIntensity,t.environmentRotation),e.setBackgroundParams(t.backgroundIntensity,t.backgroundRotation,t.backgroundBlurriness),this.reset()}updateLights(){let{_pathTracer:e,scene:t}=this,r=ip(t);e.setLights(r),this.reset()}setSize(e,t){(this._size.x!==e||this._size.y!==t)&&(this._size.set(e,t),this.reset())}reset(){this._pathTracer.reset(),this._denoiser?.reset(),this._resetTime=-1,this._fadeState=0,this._timer.update(),this._lastSampleCounts={min:0,max:0,avg:0,samplesPerSecond:0},this.stableNoise&&this._pathTracer.resetSeed()}renderSample(){let e=this._renderer,t=this._size,r=this._blitQuad,i=this._pathTracer,o=this._lowResTarget,n=this._timer,{renderDelay:a,dynamicLowRes:l,synchronizeRenderSize:f,renderScale:c,lowResScale:u,minSamples:p,maxSamples:d}=this;if(n.update(),!this._renderer._initialized)return;this.material.initialized||(this.material.init(e),this.material.initialized=!0);let h=1e3*n.getDelta(),g=this._resetTime===-1;g&&(this._resetTime=0,h=0),this._resetTime+=h;let x=e.getRenderTarget(),b=e.autoClear;if(f){e.getDrawingBufferSize(Si);let B=Math.floor(c*Si.x),P=Math.floor(c*Si.y);this.setSize(B,P)}let{width:m,height:v}=t,y=this._resetTime<a||g&&l&&p!==0;y&&(m=Math.ceil(u*m),v=Math.ceil(u*v)),i.getSize(Si),(Si.x!==m||Si.y!==v)&&(!y&&l&&(o.setSize(Math.ceil(u*m),Math.ceil(u*v)),e.copyTextureToTexture(i.outputTarget,o)),i.setSize(m,v)),!this.pause&&(!y||y&&l)&&(i.lowResMode=y,i.update());let S=this._denoiser,T=this._upscaler,I=!!S&&!S.complete&&!S.running&&d>0;y||((this._fadeState<1&&p>0||I)&&this.getSampleCountsAsync(),this._lastSampleCounts.min>=p&&(this._fadeState+=h/this.fadeDuration,this._fadeState=Math.min(1,this._fadeState)||1));let A=y&&l?1:this._fadeState,_=i.outputTarget;S&&!y&&(I&&this._lastSampleCounts.min>=d&&S.update(i.outputTarget),_=S.texture??_),T&&!y&&(_=T.upscale(_,this.camera),e.setRenderTarget(x)),e.autoClear=l?!0:A===1,r.material.transition=l?A:1,r.material.opacity=l?1:A,r.material.fromTexture=o,r.material.texture=_,r.render(e),e.autoClear=b,e.setRenderTarget(x)}renderDebugBounds(e={}){let{displayTLAS:t=!0,displayBLAS:r=!0,stopAtSurface:i=!1,saturationCount:o=64}=e,n=this._renderer,a=this.camera;if(!n._initialized)return;a.updateMatrixWorld(),(this._debugBoundsQuad===void 0||this._debugBoundsData!==this._bvhData)&&this._buildDebugBoundsQuad();let l=this._debugBoundsUniforms;l.cameraToModelMatrix.value.copy(a.matrixWorld),l.inverseProjectionMatrix.value.copy(a.projectionMatrixInverse),l.displayTLAS.value=t?1:0,l.displayBLAS.value=r?1:0,l.stopAtSurface.value=i?1:0,l.saturationCount.value=o;let f=n.getRenderTarget(),c=n.autoClear,u=n.toneMapping;n.setRenderTarget(null),n.autoClear=!0,n.toneMapping=$t,this._debugBoundsQuad.render(n),n.setRenderTarget(f),n.autoClear=c,n.toneMapping=u}_buildDebugBoundsQuad(){let e=this._bvhData,t=Qu(e),r=new Ht;r.colorNode=t(Gt(Wt())),this._debugBoundsQuad===void 0?this._debugBoundsQuad=new kt(r):(this._debugBoundsQuad.material.dispose(),this._debugBoundsQuad.material=r),this._debugBoundsUniforms=t.uniforms,this._debugBoundsData=e}renderTextureAtlas(e=0){let t=this._renderer;this._atlasDebugQuad||(this._atlasDebugQuad=new kt(new bs));let r=this._atlasDebugQuad;r.material.texture=this.textureAtlas.texture,r.material.layer=e,t.setRenderTarget(null),r.render(t)}renderSampleDensity(){let e=this._renderer;if(!e._initialized)return;this.getSampleCountsAsync(),this._sampleDensityQuad||(this._sampleDensityQuad=new kt(new ws));let t=e.toneMapping;e.toneMapping=$t;let r=this._sampleDensityQuad;r.material.texture=this._pathTracer.sampleCountTarget,r.material.minCount=this._lastSampleCounts.min,r.material.maxCount=this._lastSampleCounts.max,e.setRenderTarget(null),r.render(e),e.toneMapping=t}dispose(){this._pathTracer.dispose(),this._denoiser?.dispose(),this._upscaler?.dispose(),this._bvhData.dispose(),this._bvhData.textureAtlas.dispose(),this._environmentCache.dispose(),this._backgroundCache.dispose(),this._lowResTarget.dispose(),this._blitQuad.dispose(),this._blitQuad.material.dispose(),this._atlasDebugQuad?.dispose(),this._atlasDebugQuad?.material.dispose(),this._sampleDensityQuad?.dispose(),this._sampleDensityQuad?.material.dispose(),this._debugBoundsQuad!==void 0&&(this._debugBoundsQuad.dispose(),this._debugBoundsQuad.material.dispose())}getRenderTime(){return this._resetTime}};var Rs=class{get texture(){return this._texture}get complete(){return this._complete}get running(){return this._running}constructor(e={}){let{initUNetFromURL:t,auxWeightsUrl:r,colorWeightsUrl:i,useAuxiliaryBuffers:o=!0,maxTileSize:n=null,dynamicTile:a=null}=e;if(!t)throw new Error('OIDNDenoiser: "initUNetFromURL" from "oidn-web" must be provided.');this.initUNetFromURL=t,this.auxWeightsUrl=r,this.colorWeightsUrl=i,this.useAuxiliaryBuffers=o,this.maxTileSize=n,this.dynamicTile=a,this.renderer=null,this.scene=null,this.camera=null,this._texture=null,this._running=!1,this._complete=!1,this._abort=null,this._requestId=0,this._unets={aux:null,color:null},this._resultPipeline=null,this._rawTexture=null,this._auxTarget=null}init(e){this.renderer=e}setScene(e,t){this.scene=e,this.camera=t}update(e){if(this._complete||this._running)return this._texture;let t=null,r=null;if(this.useAuxiliaryBuffers){let i=this._renderAuxiliaryBuffers(e.width,e.height);t=i.textures[0],r=i.textures[1]}return this.denoise(e,t,r),this._texture}async denoise(e,t=null,r=null){if(this._complete||this._running)return;this._running=!0;let i=!!(t&&r),o=++this._requestId,n;try{n=await this._initUNet(i)}catch(p){throw this._running=!1,p}if(o!==this._requestId||!this._running)return;let{renderer:a}=this,l=a.backend;a.initTexture(e);let{width:f,height:c}=e,u={color:{data:l.get(e).texture,width:f,height:c},progress:p=>this._copyOutputToTexture(p,f,c),done:p=>{this._copyOutputToTexture(p,f,c),this._running=!1,this._complete=!0,this._abort=null}};i&&(a.initTexture(t),a.initTexture(r),u.albedo={data:l.get(t).texture,width:f,height:c},u.normal={data:l.get(r).texture,width:f,height:c}),this._abort=n.tileExecute(u)}reset(){this._abort?.(),this._abort=null,this._texture?.dispose(),this._texture=null,this._rawTexture?.destroy(),this._rawTexture=null,this._running=!1,this._complete=!1}dispose(){this.reset(),this._auxTarget?.dispose(),this._auxTarget=null;for(let e in this._unets)this._unets[e]?.then(t=>t.dispose()),this._unets[e]=null}_renderAuxiliaryBuffers(e,t){let{renderer:r,scene:i,camera:o}=this;this._auxTarget||(this._auxTarget=new Mn(1,1,{count:2,type:sc,minFilter:nt,magFilter:nt,samples:4}),this._auxTarget.textures[0].name="output",this._auxTarget.textures[1].name="normal");let n=this._auxTarget;n.setSize(e,t);let a=r.getRenderTarget(),l=r.getMRT(),f=r.toneMapping;return r.toneMapping=$t,r.setRenderTarget(n),r.setMRT($c({output:Pc,normal:Wr(Dc.mul(.5).add(.5),1)})),r.render(i,o),r.setMRT(l),r.setRenderTarget(a),r.toneMapping=f,n}_initUNet(e){let t=e?"aux":"color";return this._unets[t]||(this._unets[t]=(async()=>{let r=this.renderer.backend.device,i=e?this.auxWeightsUrl:this.colorWeightsUrl;if(!i)throw new Error(`OIDNDenoiser: no ${e?"auxWeightsUrl":"colorWeightsUrl"} was provided.`);let o={aux:e,hdr:!0};return this.maxTileSize!==null&&(o.maxTileSize=this.maxTileSize),this.dynamicTile!==null&&(o.dynamicTile=this.dynamicTile),this.initUNetFromURL(i,{device:r,adapterInfo:r.adapterInfo},o)})()),this._unets[t]}_copyOutputToTexture(e,t,r){let i=this.renderer.backend.device;if(!this._resultPipeline){let l=i.createShaderModule({code:`
					@group( 0 ) @binding( 0 ) var<storage, read> src : array<vec4f>;
					@group( 0 ) @binding( 1 ) var dst : texture_storage_2d<rgba16float, write>;

					@compute @workgroup_size( 8, 8 )
					fn main( @builtin( global_invocation_id ) gid : vec3u ) {

						let dims = textureDimensions( dst );
						if ( gid.x >= dims.x || gid.y >= dims.y ) {

							return;

						}

						textureStore( dst, gid.xy, src[ gid.y * dims.x + gid.x ] );

					}
				`});this._resultPipeline=i.createComputePipeline({layout:"auto",compute:{module:l,entryPoint:"main"}})}(!this._rawTexture||this._rawTexture.width!==t||this._rawTexture.height!==r)&&(this._rawTexture?.destroy(),this._rawTexture=i.createTexture({size:[t,r],format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this._texture?.dispose(),this._texture=new xc(this._rawTexture),this._texture.image={width:t,height:r});let o=i.createBindGroup({layout:this._resultPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e.data}},{binding:1,resource:this._rawTexture.createView()}]}),n=i.createCommandEncoder(),a=n.beginComputePass();a.setPipeline(this._resultPipeline),a.setBindGroup(0,o),a.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8)),a.end(),i.queue.submit([n.finish()])}};var $s=class extends vc{constructor(){super(),this.isEquirectCamera=!0}};$s.prototype.getCameraRayFn=function(){let e=N(new k);return{fn:C`
		fn getCameraRay( uv: vec2f, resolution: vec2f, ray: ptr<function, ${z}> ) -> bool {

			// screen uv to spherical direction, matching three.js' equirect orientation
			let theta = ( uv.x - 0.5 ) * 2.0 * ${Dt};
			let phi = ( 1.0 - uv.y ) * ${Dt};
			let sinPhi = sin( phi );
			let direction = vec3f( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

			// equirect ignores the projection - orient by the camera world matrix and place the origin.
			// there is no projection far plane, so the trace distance is unbounded
			ray.origin = ( ${e} * vec4f( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
			ray.direction = ( ${e} * vec4f( direction, 0.0 ) ).xyz;
			ray.maxDist = 0.0;
			return true;

		}
	`,update:()=>(e.value.copy(this.matrixWorld),!1)}};var Ds=class extends zn{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}};var Pm=C`
	fn sampleCircle( uv: vec2f ) -> vec2f {

		let angle = 2.0 * ${Dt} * uv.x;
		let radius = sqrt( uv.y );
		return vec2f( cos( angle ), sin( angle ) ) * radius;

	}
`,Am=C`
	fn sampleTriangle( a: vec2f, b: vec2f, c: vec2f, rIn: vec2f ) -> vec2f {

		let e1 = a - b;
		let e2 = c - b;

		var r = rIn;
		if ( r.x + r.y > 1.0 ) {

			r = vec2f( 1.0 ) - r;

		}

		return e1 * r.x + e2 * r.y;

	}
`,Bm=C`
	fn sampleRegularPolygon( sidesIn: i32, uvw: vec3f ) -> vec2f {

		let sides = max( sidesIn, 3 );
		let anglePerSegment = 2.0 * ${Dt} / f32( sides );
		let segment = floor( f32( sides ) * uvw.x );

		let angle1 = anglePerSegment * segment;
		let angle2 = angle1 + anglePerSegment;
		let a = vec2f( sin( angle1 ), cos( angle1 ) );
		let b = vec2f( 0.0, 0.0 );
		let c = vec2f( sin( angle2 ), cos( angle2 ) );

		return ${Am}( a, b, c, uvw.yz );

	}
`,Rm=C`
	fn sampleAperture( blades: i32, uvw: vec3f ) -> vec2f {

		if ( blades == 0 ) {

			return ${Pm}( uvw.xy );

		} else {

			return ${Bm}( blades, uvw );

		}

	}
`,$m=C`
	fn rotateVector( v: vec2f, t: f32 ) -> vec2f {

		let vc = cos( t );
		let vs = sin( t );
		return vec2f( v.x * vc - v.y * vs, v.x * vs + v.y * vc );

	}
`;Ds.prototype.getCameraRayFn=function(){let e=N(new k),t=N(new k),r=N(0),i=N(0),o=N(0,"int"),n=N(0),a=N(1);return{fn:C`
		fn getCameraRay( uv: vec2f, resolution: vec2f, ray: ptr<function, ${z}> ) -> bool {

			// base ray
			let ndc = uv * 2.0 - vec2f( 1.0 );
			*ray = ${er}( ndc, ${e} );

			// camera state
			let forward = normalize( ( ${t} * vec4f( 0.0, 0.0, - 1.0, 0.0 ) ).xyz );
			let cameraOrigin = ( ${t} * vec4f( 0.0, 0.0, 0.0, 1.0 ) ).xyz;

			// depth of field
			// measure focus distance from the camera origin along the optical axis so the focal
			// surface is a flat plane perpendicular to the camera forward vector rather than a sphere
			let focalPoint = cameraOrigin + ray.direction * ( ${r} / dot( ray.direction, forward ) );
			let nearDistance = dot( ray.origin - cameraOrigin, forward );

			// sample the aperture shape
			let shapeUVW = ${si}( ${lf} );
			var apertureSample = ${Rm}( ${o}, shapeUVW );
			apertureSample *= ${i} * 0.5 * 1e-3;

			// rotate + squash the sample for anamorphic apertures
			apertureSample =
				${$m}( apertureSample, ${n} )
				* vec2f( ${a}, 1.0 / ${a} );

			// aim from the aperture through the focal point, starting on the near plane like the base ray
			ray.origin = cameraOrigin + ( ${t} * vec4f( apertureSample, 0.0, 0.0 ) ).xyz;
			ray.direction = normalize( focalPoint - ray.origin );
			ray.origin += ray.direction * ( nearDistance / dot( ray.direction, forward ) );

			return true;

		}
	`,update:()=>(this.coordinateSystem=Hr,this.updateMatrixWorld(),this.updateProjectionMatrix(),e.value.multiplyMatrices(this.matrixWorld,this.projectionMatrixInverse),t.value.copy(this.matrixWorld),r.value=this.focusDistance,i.value=this.bokehSize,o.value=this.apertureBlades,n.value=this.apertureRotation,a.value=this.anamorphicRatio,!1)}};wc.prototype.getCameraRayFn=function(){let e={fn:null,update:null},t=Ac(0),r=gr([],"mat4"),i=gr([],"vec4");return e.fn=C`
		fn getCameraRay( uv: vec2f, resolution: vec2f, ray: ptr<function, ${z}> ) -> bool {

			let pixel = uv * resolution;

			for ( var i = 0u; i < ${t}u; i ++ ) {

				let viewport = ${i}[ i ];
				let viewportMax = viewport.xy + viewport.zw;
				if ( all( pixel >= viewport.xy ) && all( pixel < viewportMax ) ) {

					let cameraUv = ( pixel - viewport.xy ) / viewport.zw;
					let ndc = cameraUv * 2.0 - vec2f( 1.0 );
					*ray = ${er}( ndc, ${r}[ i ] );
					return true;

				}

			}

			return false;

		}
	`,e.update=()=>{let{cameras:o}=this,n=t.node.value!==o.length;for(t.node.value=o.length;i.array.length<o.length;)i.array.push(new ot),r.array.push(new k);r.array.length=o.length,i.array.length=o.length;for(let a=0;a<o.length;a++){let l=o[a],f=l.viewport;l.coordinateSystem=Hr,l.updateMatrixWorld(),l.updateProjectionMatrix(),r.array[a].multiplyMatrices(l.matrixWorld,l.projectionMatrixInverse),i.array[a].copy(f)}return n},e};var pl=class{dims=[];paddedDims=[];layout="x";dataType="Float32";getByteSize(){let e=1;for(let t of this.paddedDims)e*=t;return this.dataType==="Float32"?e*=4:this.dataType==="Float16"&&(e*=2),e}},dl=class{desc;data;constructor(e,t){this.desc=e,this.data=t}},hl=class{_view;offset=0;constructor(e){this._view=e}read(e){let t=this._view,r=this.offset;switch(this.offset+=e,e){case 1:return t.getUint8(r);case 2:return t.getUint16(r,!0);case 4:return t.getUint32(r,!0);case 8:return Number(t.getBigUint64(r,!0));default:throw new Error("unsupported read size")}}};function yp(s){let e=new Uint8Array(s),t=new hl(new DataView(s));if(t.read(2)!==16855)throw new Error("invalid or corrupted weights blob");let i=t.read(1),o=t.read(1);if(i!==2)throw new Error("unsupported weights blob version");let n=t.read(8);t.offset=n;let a=t.read(4),l=new Map;for(let f=0;f<a;++f){let c=new pl,u=t.read(2),p=new TextDecoder().decode(e.subarray(t.offset,t.offset+u));t.offset+=u;let d=t.read(1);for(let m=0;m<d;++m)c.dims.push(t.read(4));c.paddedDims=[...c.dims],new TextDecoder().decode(e.subarray(t.offset,t.offset+d))==="oihw"&&(c.layout="oihw"),t.offset+=d;let g=String.fromCharCode(t.read(1));if(g==="f")c.dataType="Float32";else if(g==="h")c.dataType="Float16";else throw new Error("invalid tensor data type");let x=t.read(8),b=e.slice(x,x+c.getByteSize());l.set(p,new dl(c,b))}return l}function Dm(s,e){return s.channels===e.channels}var Ns=8,$r=class{autoUpdateOutputBuffer=!0;_label;_device;_outputBuffers={};_pipeline;_bindGroups=[];_needsUpdatePipeline=!0;_needsResizeBuffer=!0;_inputs=[];_outputs=[];_uniforms=[];_uniformBuffers={};_width=10;_height=10;_execWidth;_execHeight;_csCode="";_csMain;_csDefine;_groupOffsets={inputs:0,uniforms:1,outputs:2};constructor(e,t,r){this._label=e,this._device=t,this._csMain=r.csMain,this._csDefine=r.csDefine,this._inputs=r.inputs,this._outputs=r.outputs,this._uniforms=r.uniforms,this.autoUpdateOutputBuffer=r.autoUpdateOutputBuffer??!0,r.uniforms.forEach(i=>{this._uniformBuffers[i.label]=t.createBuffer({label:this._label,size:i.data.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._device.queue.writeBuffer(this._uniformBuffers[i.label],0,i.data)})}setCSCode({csDefine:e,csMain:t}){this._csDefine=e,this._csMain=t,this._needsUpdatePipeline=!0}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t);let r=e!==this._width||t!==this._height;this._width=e,this._height=t,r&&(this._needsResizeBuffer=!0,this._needsUpdatePipeline=!0)}setExecuteSize(e,t){e=Math.ceil(e),t=Math.ceil(t),this._execWidth=e,this._execHeight=t}setOutputParams(e){this.autoUpdateOutputBuffer&&this._updateOutputBuffers(e),this._needsUpdatePipeline=!0}setOutputBuffers(e){this._outputBuffers=Object.keys(e).reduce((t,r)=>(t[r]={buffer:e[r],params:{channels:4}},t),{})}setUniform(e,t){let r=this._uniformBuffers[e];this._device.queue.writeBuffer(r,0,t)}getOutput(e){return this._needsResizeBuffer&&this.autoUpdateOutputBuffer&&(this._resizeOutputBuffers(),this._needsResizeBuffer=!1),this._outputBuffers[e].buffer}dispose(e=!0){Object.keys(this._uniformBuffers).forEach(t=>{this._uniformBuffers[t].destroy()}),e&&Object.keys(this._outputBuffers).forEach(t=>{this._outputBuffers[t].buffer.destroy()})}_createBuffer(e){let t=this._width*this._height*4*4;return this._device.createBuffer({label:this._label,size:Math.max(t,80),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}_resizeOutputBuffers(){let e=this._outputBuffers;for(let t in e){let{buffer:r,params:i}=e[t];r.destroy(),e[t].buffer=this._createBuffer(i)}}_updateOutputBuffers(e){let t=this._outputBuffers;for(let r in e){let i=e[r];if(!Dm(i,t[r]?.params||{})){t[r]?.buffer.destroy();let o=this._createBuffer(i);t[r]={buffer:o,params:i}}}}_updatePipeline(e,t){if(!this._needsUpdatePipeline)return;this._needsUpdatePipeline=!1;let r=this._device,i=this._getFullCs(e,t);i!==this._csCode&&(this._csCode=i,this._pipeline=r.createComputePipeline({label:this._label,layout:"auto",compute:{module:r.createShaderModule({label:this._label,code:i}),entryPoint:"main"}}),this._updateBindGroups())}_getFullCs(e,t){let r=this._inputs,i=this._uniforms,o=0,n=this._groupOffsets={inputs:0,uniforms:0,outputs:0};return r.length>0&&o++,i.length>0&&(n.uniforms=o,o++),n.outputs=o,`
${r.sort().map((l,f)=>{let c=`@group(${n.inputs}) @binding(${f}) `,u=`in_${l}`;return t[l]==="texture"?`${c} var ${u}: texture_2d<f32>;`:`${c} var<storage, read> ${u}: array<vec${e[l].channels}f>;`}).join(`
`)}
${this._uniforms.map((l,f)=>`@group(${n.uniforms}) @binding(${f}) var<uniform> ${l.label}: ${l.type};`).join(`
`)}

${this._outputs.map((l,f)=>`@group(${n.outputs}) @binding(${f}) var<storage, read_write> out_${l}: array<vec${this._outputBuffers[l].params.channels}f>;`).join(`
`)}
${this._csDefine??""}
@compute @workgroup_size(${Ns}, ${Ns}, 1)
fn main(@builtin(global_invocation_id) globalId: vec3u) {
${this._csMain}
}
`}_updateBindGroups(){let e=[],t=this._device,r=this._groupOffsets;this._uniforms.length>0&&(e[r.uniforms]=t.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(r.uniforms),entries:this._uniforms.map((i,o)=>({binding:o,resource:{buffer:this._uniformBuffers[i.label]}}))})),this._bindGroups=e}createPass(e,t){this._needsResizeBuffer&&this.autoUpdateOutputBuffer&&(this._resizeOutputBuffers(),this._needsResizeBuffer=!1);let r=this._inputs.reduce((n,a)=>(n[a]=t[a].buffer?"buffer":"texture",n),{});this._updatePipeline(t,r);let i=this._groupOffsets;this._inputs.length>0&&(this._bindGroups[i.inputs]=this._device.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(i.inputs),entries:this._inputs.map((n,a)=>({binding:a,resource:t[n].buffer?{buffer:t[n].buffer}:t[n].texture.createView()}))})),this._bindGroups[i.outputs]=this._device.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(i.outputs),entries:this._outputs.map((n,a)=>({binding:a,resource:{buffer:this._outputBuffers[n].buffer}}))});let o=e.beginComputePass();o.setPipeline(this._pipeline),this._bindGroups.forEach((n,a)=>{o.setBindGroup(a,n)}),o.dispatchWorkgroups(Math.ceil((this._execWidth??this._width)/Ns),Math.ceil((this._execHeight??this._height)/Ns),1),o.end()}};var ml=1412.83765,gl=1.64593172,xl=.431384981,yl=-.00294139609,vl=.192653254,bl=.00626026094,wl=.998620152,bp=15794576e-13,wp=.0322087631,_p=.00223151711,Tp=.370974749;function Sp(s){return s<=bp?s=ml*s:s<=wp?s=gl*Math.pow(s,xl)+yl:s=vl*Math.log(s+bl)+wl,s}function Nm(s){return s<=_p?s=s/ml:s<=Tp?s=Math.pow((s-yl)/gl,1/xl):s=Math.exp((s-wl)/vl)-bl,s}var Fm=65504,Ip=Sp(Fm),Cp=1/Ip,Pp=Ip,Ii=class{x;y;width;height;constructor(e,t,r,i){this.x=e,this.y=t,this.width=r,this.height=i}};function Ap({data:s,channels:e}){let t=0;for(let n=0;n<s.length;n+=e){let a=s[n],l=s[n+1],f=s[n+2],c=.212671*a+.71516*l+.072169*f;t+=Math.log2(c+1e-4)}let r=s.length/e,i=t/r;return .18/Math.pow(2,i)}function Bp({data:s,channels:e,inputScale:t}){let r=new Float32Array(s.length);r.set(s);for(let i=0;i<r.length;i+=e)for(let o=0;o<3;o++){let n=r[i+o]*t;r[i+o]=Sp(n)*Cp}return r}function Rp({data:s,channels:e,inputScale:t}){let r=new Float32Array(s.length);r.set(s);let i=1/t;for(let o=0;o<r.length;o+=e)for(let n=0;n<3;n++){let a=r[o+n]*Pp;r[o+n]=Nm(a)*i}return r}var vp=`
const a = ${ml};
const b = ${gl};
const c = ${xl};
const d = ${yl};
const e = ${vl};
const f = ${bl};
const g = ${wl};
const y0 =${bp};
const y1 =${wp};
const x0 =${_p};
const x1 =${Tp};

const normScale = ${Cp};
const rcpNormScale = ${Pp};
`,Fs=class{_device;_isHDR;_inputPassAux;_inputPassColor;_outputPass;_copyPass;_isInputTexture;constructor(e,t){this._device=e,this._isHDR=t;let r=[{label:"inputScale",type:"f32",data:new Float32Array([1])},{label:"inputSize",type:"vec2i",data:new Int32Array(2)},{label:"outputSize",type:"vec2i",data:new Int32Array(2)},{label:"inputOffset",type:"vec2i",data:new Int32Array(2)}];this._inputPassAux=new $r("inputPassAux",this._device,{inputs:["color","albedo","normal"],outputs:["color","albedo","normal"],uniforms:r,csDefine:"",csMain:""}),this._inputPassColor=new $r("inputPassColor",this._device,{inputs:["color"],outputs:["color"],uniforms:r,csDefine:"",csMain:""}),this._outputPass=new $r("outputPass",this._device,{inputs:["color","raw"],outputs:["color"],uniforms:[{label:"inputScale",type:"f32",data:new Float32Array([1])},{label:"inputSize",type:"vec2i",data:new Int32Array(2)},{label:"outputSize",type:"vec2i",data:new Int32Array(2)},{label:"imageSize",type:"vec2i",data:new Int32Array(2)},{label:"inputOffset",type:"vec2i",data:new Int32Array(2)},{label:"outputOffset",type:"vec2i",data:new Int32Array(2)}],csDefine:"",csMain:""}),this._copyPass=new $r("copyPass",this._device,{inputs:["color"],outputs:["color"],autoUpdateOutputBuffer:!1,uniforms:[{label:"size",type:"vec2i",data:new Int32Array(2)}],csMain:`
let outIdx = i32(globalId.x + globalId.y * u32(size.x));
out_color[outIdx] = textureLoad(in_color, globalId.xy, 0);
`}),this._inputPassAux.setOutputParams({color:{channels:3},albedo:{channels:3},normal:{channels:3}}),this._inputPassColor.setOutputParams({color:{channels:3}}),this._outputPass.setOutputParams({color:{channels:4}})}_updatePasses(e,t=!1){if(this._isInputTexture!=null&&this._isInputTexture===e)return;this._isInputTexture=e;let r=this._isHDR,i=`
${vp}
fn PUForward(y: f32) -> f32 {
  if (y <= y0) {
    return a * y;
  } else if (y <= y1) {
    return b * pow(y, c) + d;
  } else {
    return e * log(y + f) + g;
  }
}`;function o(a){return e?`textureLoad(in_${a}, globalId.xy + vec2u(inputOffset), 0)`:`in_${a}[inIdx]`}let n=`
let x = i32(globalId.x);
let y = i32(globalId.y);
let inIdx = (y + inputOffset.y) * inputSize.x + (x + inputOffset.x);
let col = ${o("color")};

let outIdx = y * outputSize.x + x;

if (${t}) {
  // Denoise the inversed alpha. Or the anti aliased edge will be too dark after denoised
  out_color[outIdx] = vec3f(1.0 - col.a);
}
else if (${r}) {
  out_color[outIdx] = vec3f(PUForward(col.r * inputScale), PUForward(col.g * inputScale), PUForward(col.b * inputScale)) * normScale;
}
else {
  out_color[outIdx] = col.rgb;
}
`;this._inputPassAux.setCSCode({csDefine:i,csMain:`
${n}
let alb = ${o("albedo")};
let nor = ${o("normal")};
out_normal[outIdx] = nor.rgb;
out_albedo[outIdx] = alb.rgb;
  `}),this._inputPassColor.setCSCode({csDefine:i,csMain:`
${n}
`}),this._outputPass.setCSCode({csDefine:`
${vp}
fn PUInverse(y: f32) -> f32 {
  if (y <= x0) {
    return y / a;
  } else if (y <= x1) {
    return pow((y - d) / b, 1 / c);
  } else {
    return exp((y - g) / e) - f;
  }
}
`,csMain:`
let x = i32(globalId.x);
let y = i32(globalId.y);
if (x >= outputSize.x || y >= outputSize.y) {
  return;
}
let inIdx = (y + inputOffset.y) * inputSize.x + x + inputOffset.x;
let outIdx = (y + outputOffset.y) * imageSize.x + x + outputOffset.x;
let col = in_color[inIdx];
let raw = ${e?"textureLoad(in_raw, globalId.xy + vec2u(outputOffset), 0)":"in_raw[outIdx]"};

if (${t}) {
  out_color[outIdx] = vec4f(raw.rgb, 1.0 - col.r);
}
else if (${r}) {
  out_color[outIdx] = vec4f(
    vec3f(PUInverse(col.r * rcpNormScale), PUInverse(col.g * rcpNormScale), PUInverse(col.b * rcpNormScale)) / inputScale,
    // Pick the alpha
    raw.a
  );
}
else {
  out_color[outIdx] = vec4f(col.rgb, raw.a);
}
`})}setImageSize(e,t){this._inputPassAux.setUniform("inputSize",new Int32Array([e,t])),this._inputPassColor.setUniform("inputSize",new Int32Array([e,t])),this._outputPass.setUniform("imageSize",new Int32Array([e,t])),this._outputPass.setSize(e,t),this._copyPass.setSize(e,t),this._copyPass.setUniform("size",new Int32Array([e,t]))}setInputTile(e){let t=new Int32Array([e.width,e.height]);[this._inputPassAux,this._inputPassColor].forEach(r=>{r.setUniform("inputOffset",new Int32Array([e.x,e.y])),r.setUniform("outputSize",t),r.setSize(t[0],t[1])}),this._outputPass.setUniform("inputSize",t)}setOutputTile(e,t){let r=this._outputPass,i=new Int32Array([e.width,e.height]),o=e.x-t.x,n=e.y-t.y;r.setUniform("outputSize",i),r.setUniform("inputOffset",new Int32Array([o,n])),r.setUniform("outputOffset",new Int32Array([e.x,e.y])),r.setExecuteSize(i[0],i[1])}forward(e,t,r,i){let o=e instanceof GPUTexture;this._updatePasses(o,i);let n=this._inputPassAux,a=this._inputPassColor,l=this._device.createCommandEncoder();function f(c){return c instanceof GPUTexture?{texture:c,channels:4}:{buffer:c,channels:4}}return t&&r?n.createPass(l,{color:f(e),albedo:f(t),normal:f(r)}):a.createPass(l,{color:f(e)}),this._device.queue.submit([l.finish()]),t&&r?{color:n.getOutput("color"),albedo:n.getOutput("albedo"),normal:n.getOutput("normal")}:{color:a.getOutput("color")}}inverse(e,t){let i=this._device.createCommandEncoder(),o=this._outputPass;return o.createPass(i,{color:{buffer:e,channels:4},raw:t instanceof GPUBuffer?{buffer:t,channels:4}:{texture:t,channels:4}}),this._device.queue.submit([i.finish()]),o.getOutput("color")}copyInputDataToOutput(e){let t=this._device.createCommandEncoder(),i=this._outputPass.getOutput("color"),o=this._copyPass;e instanceof GPUTexture?(o.setOutputBuffers({color:i}),o.createPass(t,{color:{texture:e,channels:4}})):t.copyBufferToBuffer(e,0,i,0,i.size),this._device.queue.submit([t.finish()])}dispose(){this._outputPass.dispose(),this._inputPassAux.dispose(),this._inputPassColor.dispose(),this._copyPass.dispose(!1)}};function gn(s,e){return Math.ceil(s/e)*e}function Mm(s,e){return Math.floor(s/e)*e}function _l(s,e,t){return Math.min(Math.max(s,e),t)}function Em(s){let e=[...s].sort((r,i)=>r-i),t=Math.floor(e.length/2);return e.length%2?e[t]:(e[t-1]+e[t])/2}function Tl(s,e){return s<=e?Math.min(gn(s,16),e):e}var Ms=class{enabled;maxTileSize;minTileSize;targetTileTimeMs;_tileSize;_adjustmentStep;constructor(e,t=!0){let r=typeof t=="object"?t:{};this.enabled=t!==!1,this.maxTileSize=Math.max(16,Mm(e,16)),this.minTileSize=_l(gn(r.minTileSize??256,16),16,this.maxTileSize),this.targetTileTimeMs=Math.max(1,r.targetTileTimeMs??16),this._adjustmentStep=Math.max(16,gn(r.adjustmentStep??128,16)),this._tileSize=this.enabled?_l(gn(r.initialTileSize??384,16),this.minTileSize,this.maxTileSize):this.maxTileSize}get tileSize(){return this._tileSize}observe(e){if(!this.enabled||e.length===0)return!1;let t=e.filter(o=>Number.isFinite(o)&&o>=0);if(t.length===0)return!1;let r=Em(t),i=this._tileSize;return r>this.targetTileTimeMs*1.25?i-=this._adjustmentStep:r<this.targetTileTimeMs*.65&&(i+=this._adjustmentStep),i=_l(gn(i,16),this.minTileSize,this.maxTileSize),i===this._tileSize?!1:(this._tileSize=i,!0)}};async function $p(s){try{await s.onSubmittedWorkDone()}catch{}}function H(s,e){return{op:"conv2d",id:s,input:e,weight:`${s}.weight`,bias:`${s}.bias`,activation:"relu",padding:"same"}}function nr(s,e){return{op:"maxPool2d",id:s,input:e,size:2,stride:2,padding:"same"}}function or(s,e){return{op:"upsample2d",id:s,input:e,scale:2,mode:"nearest"}}function sr(s,e,t){return{op:"concat",id:s,inputs:[e,t],axis:"channels"}}var Fp={schemaVersion:1,id:"oidn-unet-small-v1",family:"oidn-unet-small",input:"input",output:"dec_conv0",receptiveField:174,nodes:[H("enc_conv0","input"),H("enc_conv1","enc_conv0"),nr("pool1","enc_conv1"),H("enc_conv2","pool1"),nr("pool2","enc_conv2"),H("enc_conv3","pool2"),nr("pool3","enc_conv3"),H("enc_conv4","pool3"),nr("pool4","enc_conv4"),H("enc_conv5a","pool4"),H("enc_conv5b","enc_conv5a"),or("up4","enc_conv5b"),sr("concat4","up4","pool3"),H("dec_conv4a","concat4"),H("dec_conv4b","dec_conv4a"),or("up3","dec_conv4b"),sr("concat3","up3","pool2"),H("dec_conv3a","concat3"),H("dec_conv3b","dec_conv3a"),or("up2","dec_conv3b"),sr("concat2","up2","pool1"),H("dec_conv2a","concat2"),H("dec_conv2b","dec_conv2a"),or("up1","dec_conv2b"),sr("concat1","up1","input"),H("dec_conv1a","concat1"),H("dec_conv1b","dec_conv1a"),H("dec_conv0","dec_conv1b")]},Mp={schemaVersion:1,id:"oidn-unet-large-v1",family:"oidn-unet-large",input:"input",output:"dec_conv1c",receptiveField:202,nodes:[H("enc_conv1a","input"),H("enc_conv1b","enc_conv1a"),nr("pool1","enc_conv1b"),H("enc_conv2a","pool1"),H("enc_conv2b","enc_conv2a"),nr("pool2","enc_conv2b"),H("enc_conv3a","pool2"),H("enc_conv3b","enc_conv3a"),nr("pool3","enc_conv3b"),H("enc_conv4a","pool3"),H("enc_conv4b","enc_conv4a"),nr("pool4","enc_conv4b"),H("enc_conv5a","pool4"),H("enc_conv5b","enc_conv5a"),or("up4","enc_conv5b"),sr("concat4","up4","pool3"),H("dec_conv4a","concat4"),H("dec_conv4b","dec_conv4a"),or("up3","dec_conv4b"),sr("concat3","up3","pool2"),H("dec_conv3a","concat3"),H("dec_conv3b","dec_conv3a"),or("up2","dec_conv3b"),sr("concat2","up2","pool1"),H("dec_conv2a","concat2"),H("dec_conv2b","dec_conv2a"),or("up1","dec_conv2b"),sr("concat1","up1","input"),H("dec_conv1a","concat1"),H("dec_conv1b","dec_conv1a"),H("dec_conv1c","dec_conv1b")]},Lm=[Fp,Mp];function Ep(s){let e=new Set;for(let t of s.nodes)t.op==="conv2d"&&(e.add(t.weight),e.add(t.bias));return e}function Dp(s){return s.desc.getByteSize()}function Lp(s){return[...s].sort().join(", ")}function Es(s,e=Lm){let t=e.filter(r=>{let i=Ep(r);return[...i].some(o=>!s.has(o))?!1:r.allowAdditionalTensors===!0||[...s.keys()].every(o=>i.has(o))});if(t.length===1)return t[0];throw t.length>1?new Error(`Ambiguous OIDN model topology: ${t.map(r=>r.id).join(", ")}`):new Error(`Unsupported OIDN model topology. TZA tensors: ${Lp(s.keys())}`)}function Np(s,e,t){let r=s.get(e);if(!r)throw new Error(`Model ${t} is missing tensor ${e}`);if(r.data.byteLength!==Dp(r))throw new Error(`Tensor ${e} has ${r.data.byteLength} bytes, expected ${Dp(r)}`);return r}function Sl(s,e=Es(s)){if(e.schemaVersion!==1)throw new Error(`Unsupported model descriptor schema ${e.schemaVersion}`);let t=Ep(e);if(!e.allowAdditionalTensors){let u=[...s.keys()].filter(p=>!t.has(p));if(u.length>0)throw new Error(`Model ${e.id} has unexpected tensors: ${Lp(u)}`)}let r=new Map,i=new Map,o=new Map,n=new Set([e.input]),a,l,f=(u,p)=>{let d=r.get(u);if(d===void 0)throw new Error(`Model ${e.id} node ${p} reads unknown or forward value ${u}`);return d};for(let u of e.nodes){if(n.has(u.id))throw new Error(`Model ${e.id} produces duplicate value ${u.id}`);if(u.op==="conv2d"){let p=Np(s,u.weight,e.id),d=Np(s,u.bias,e.id),h=p.desc.dims;if(p.desc.layout!=="oihw"||h.length!==4)throw new Error(`Tensor ${u.weight} must use OIHW layout`);if(h[2]!==3||h[3]!==3)throw new Error(`Tensor ${u.weight} must use a 3x3 kernel`);if(d.desc.layout!=="x"||d.desc.dims.length!==1)throw new Error(`Tensor ${u.bias} must be a one-dimensional bias`);if(d.desc.dims[0]!==h[0])throw new Error(`Tensor ${u.bias} has ${d.desc.dims[0]} channels, expected ${h[0]}`);if(p.desc.dataType!==d.desc.dataType)throw new Error(`Weight and bias dtype differ for ${u.id}`);if(l&&l!==p.desc.dataType)throw new Error(`Mixed tensor dtypes are not supported by model ${e.id}`);l=p.desc.dataType,u.input===e.input&&a===void 0&&(a=h[1],r.set(e.input,a));let g=f(u.input,u.id);if(g!==h[1])throw new Error(`Tensor ${u.weight} expects ${h[1]} input channels, but ${u.input} provides ${g}`);r.set(u.id,h[0]),i.set(u.id,{weight:p,bias:d,inputChannels:h[1],outputChannels:h[0],kernelHeight:h[2],kernelWidth:h[3]}),o.set(u.id,{inputChannels:h[1],outputChannels:h[0]})}else if(u.op==="concat"){if(u.inputs.length<2)throw new Error(`Concat ${u.id} requires at least two inputs`);let p=u.inputs.reduce((d,h)=>d+f(h,u.id),0);r.set(u.id,p)}else r.set(u.id,f(u.input,u.id));n.add(u.id)}if(a===void 0||l===void 0)throw new Error(`Model ${e.id} has no convolution reading its input`);let c=r.get(e.output);if(c===void 0)throw new Error(`Model ${e.id} output ${e.output} is not produced`);if(c!==3)throw new Error(`Model ${e.id} must produce 3 channels, got ${c}`);return{spec:e,inputChannels:a,outputChannels:c,tensorDataType:l,channelsByValue:r,convChannels:o,convTensors:i}}var kp="This is not an object",Op="This is not a Float16Array object",Il="This constructor is not a subclass of Float16Array",Ls="The constructor property value is not an object",zp="Species constructor didn't return TypedArray object",Up="Derived constructor created TypedArray object which was too small length",Ci="Attempting to access detached ArrayBuffer",xn="Cannot convert undefined or null to object",ks="Cannot mix BigInt and other types, use explicit conversions",Cl="@@iterator property is not callable",Pl="Reduce of empty array with no initial value",Vp="The comparison function must be either a function or undefined",Os="Offset is out of bounds";function le(s){return(e,...t)=>$e(s,e,t)}function Pi(s,e){return le(ar(s,e).get)}var{apply:$e,construct:Ai,defineProperty:Bl,get:Us,getOwnPropertyDescriptor:ar,getPrototypeOf:Bi,has:yn,ownKeys:Vs,set:Rl,setPrototypeOf:$l}=Reflect,Hp=Proxy,{EPSILON:Wp,MAX_SAFE_INTEGER:Dl,isFinite:Hs,isNaN:Ut}=Number,{iterator:qe,species:Gp,toStringTag:Ws,for:qp}=Symbol,Dr=Object,{create:vn,defineProperty:Nr,freeze:jp,is:Nl}=Dr,Al=Dr.prototype,Yp=Al.__lookupGetter__?le(Al.__lookupGetter__):(s,e)=>{if(s==null)throw ce(xn);let t=Dr(s);do{let r=ar(t,e);if(r!==void 0)return Ct(r,"get")?r.get:void 0}while((t=Bi(t))!==null)},Ct=Dr.hasOwn||le(Al.hasOwnProperty),Kp=Array,Fl=Kp.isArray,Gs=Kp.prototype,Xp=le(Gs.join),Qp=le(Gs.push),Zp=le(Gs.toLocaleString),bn=Gs[qe],Jp=le(bn),{abs:ed,trunc:qs}=Math,Ri=ArrayBuffer,td=Ri.isView,rd=Ri.prototype,id=le(rd.slice),nd=Pi(rd,"byteLength"),zs=typeof SharedArrayBuffer<"u"?SharedArrayBuffer:null,od=zs&&Pi(zs.prototype,"byteLength"),js=Bi(Uint8Array),km=js.from,be=js.prototype,sd=be[qe],ad=le(be.keys),ld=le(be.values),cd=le(be.entries),ud=le(be.set),Ml=le(be.reverse),fd=le(be.fill),pd=le(be.copyWithin),El=le(be.sort),$i=le(be.slice),dd=le(be.subarray),we=Pi(be,"buffer"),lr=Pi(be,"byteOffset"),J=Pi(be,"length"),Ll=Pi(be,Ws),hd=Uint8Array,De=Uint16Array,kl=(...s)=>$e(km,De,s),Ys=Uint32Array,md=Float32Array,Vt=Bi([][qe]()),Di=le(Vt.next),gd=le((function*(){})().next),xd=Bi(Vt),yd=DataView.prototype,IS=le(yd.getUint16),CS=le(yd.setUint16),ce=TypeError,Ks=RangeError,Ol=WeakSet,vd=Ol.prototype,bd=le(vd.add),wd=le(vd.has),Ni=WeakMap,zl=Ni.prototype,Fi=le(zl.get),_d=le(zl.has),wn=le(zl.set);var Td=new Ni,Om=vn(null,{next:{value:function(){let e=Fi(Td,this);return Di(e)}},[qe]:{value:function(){return this}}});function _n(s){if(s[qe]===bn&&Vt.next===Di)return s;let e=vn(Om);return wn(Td,e,Jp(s)),e}var Sd=new Ni,Id=vn(xd,{next:{value:function(){let e=Fi(Sd,this);return gd(e)},writable:!0,configurable:!0}});for(let s of Vs(Vt))s!=="next"&&Nr(Id,s,ar(Vt,s));function Ul(s){let e=vn(Id);return wn(Sd,e,s),e}function Fr(s){return s!==null&&typeof s=="object"||typeof s=="function"}function Vl(s){return s!==null&&typeof s=="object"}function Tn(s){return Ll(s)!==void 0}function Xs(s){let e=Ll(s);return e==="BigInt64Array"||e==="BigUint64Array"}function zm(s){try{return Fl(s)?!1:(nd(s),!0)}catch{return!1}}function Hl(s){if(zs===null)return!1;try{return od(s),!0}catch{return!1}}function Cd(s){return zm(s)||Hl(s)}function Wl(s){return Fl(s)?s[qe]===bn&&Vt.next===Di:!1}function Pd(s){return Tn(s)?s[qe]===sd&&Vt.next===Di:!1}function Sn(s){if(typeof s!="string")return!1;let e=+s;return s!==e+""||!Hs(e)?!1:e===qs(e)}var In=qp("__Float16Array__");function Ad(s){if(!Vl(s))return!1;let e=Bi(s);if(!Vl(e))return!1;let t=e.constructor;if(t===void 0)return!1;if(!Fr(t))throw ce(Ls);return yn(t,In)}var Gl=1/Wp;function Um(s){return s+Gl-Gl}var Rd=6103515625e-14,Vm=65504,$d=.0009765625,Bd=$d*Rd,Hm=$d*Gl;function Wm(s){let e=+s;if(!Hs(e)||e===0)return e;let t=e>0?1:-1,r=ed(e);if(r<Rd)return t*Um(r/Bd)*Bd;let i=(1+Hm)*r,o=i-(i-r);return o>Vm||Ut(o)?t*(1/0):t*o}var Dd=new Ri(4),Nd=new md(Dd),Fd=new Ys(Dd),dt=new De(512),ht=new hd(512);for(let s=0;s<256;++s){let e=s-127;e<-24?(dt[s]=0,dt[s|256]=32768,ht[s]=24,ht[s|256]=24):e<-14?(dt[s]=1024>>-e-14,dt[s|256]=1024>>-e-14|32768,ht[s]=-e-1,ht[s|256]=-e-1):e<=15?(dt[s]=e+15<<10,dt[s|256]=e+15<<10|32768,ht[s]=13,ht[s|256]=13):e<128?(dt[s]=31744,dt[s|256]=64512,ht[s]=24,ht[s|256]=24):(dt[s]=31744,dt[s|256]=64512,ht[s]=13,ht[s|256]=13)}function mt(s){Nd[0]=Wm(s);let e=Fd[0],t=e>>23&511;return dt[t]+((e&8388607)>>ht[t])}var ql=new Ys(2048);for(let s=1;s<1024;++s){let e=s<<13,t=0;for(;(e&8388608)===0;)e<<=1,t-=8388608;e&=-8388609,t+=947912704,ql[s]=e|t}for(let s=1024;s<2048;++s)ql[s]=939524096+(s-1024<<13);var Mi=new Ys(64);for(let s=1;s<31;++s)Mi[s]=s<<23;Mi[31]=1199570944;Mi[32]=2147483648;for(let s=33;s<63;++s)Mi[s]=2147483648+(s-32<<23);Mi[63]=3347054592;var Md=new De(64);for(let s=1;s<64;++s)s!==32&&(Md[s]=1024);function oe(s){let e=s>>10;return Fd[0]=ql[Md[e]+(s&1023)]+Mi[e],Nd[0]}function Pt(s){let e=+s;return Ut(e)||e===0?0:qs(e)}function Qs(s){let e=Pt(s);return e<0?0:e<Dl?e:Dl}function Cn(s,e){if(!Fr(s))throw ce(kp);let t=s.constructor;if(t===void 0)return e;if(!Fr(t))throw ce(Ls);let r=t[Gp];return r??e}function Ei(s){if(Hl(s))return!1;try{return id(s,0,0),!1}catch{}return!0}function jl(s,e){let t=Ut(s),r=Ut(e);if(t&&r)return 0;if(t)return 1;if(r||s<e)return-1;if(s>e)return 1;if(s===0&&e===0){let i=Nl(s,0),o=Nl(e,0);if(!i&&o)return-1;if(i&&!o)return 1}return 0}var Yl=2,Js=new Ni;function Mr(s){return _d(Js,s)||!td(s)&&Ad(s)}function re(s){if(!Mr(s))throw ce(Op)}function Zs(s,e){let t=Mr(s),r=Tn(s);if(!t&&!r)throw ce(zp);if(typeof e=="number"){let i;if(t){let o=U(s);i=J(o)}else i=J(s);if(i<e)throw ce(Up)}if(Xs(s))throw ce(ks)}function U(s){let e=Fi(Js,s);if(e!==void 0){let i=we(e);if(Ei(i))throw ce(Ci);return e}let t=s.buffer;if(Ei(t))throw ce(Ci);let r=Ai(Ne,[t,s.byteOffset,s.length],s.constructor);return Fi(Js,r)}function Ed(s){let e=J(s),t=[];for(let r=0;r<e;++r)t[r]=oe(s[r]);return t}var Ld=new Ol;for(let s of Vs(be)){if(s===Ws)continue;let e=ar(be,s);Ct(e,"get")&&typeof e.get=="function"&&bd(Ld,e.get)}var Gm=jp({get(s,e,t){return Sn(e)&&Ct(s,e)?oe(Us(s,e)):wd(Ld,Yp(s,e))?Us(s,e):Us(s,e,t)},set(s,e,t,r){return Sn(e)&&Ct(s,e)?Rl(s,e,mt(t)):Rl(s,e,t,r)},getOwnPropertyDescriptor(s,e){if(Sn(e)&&Ct(s,e)){let t=ar(s,e);return t.value=oe(t.value),t}return ar(s,e)},defineProperty(s,e,t){return Sn(e)&&Ct(s,e)&&Ct(t,"value")?(t.value=mt(t.value),Bl(s,e,t)):Bl(s,e,t)}}),Ne=class s{constructor(e,t,r){let i;if(Mr(e))i=Ai(De,[U(e)],new.target);else if(Fr(e)&&!Cd(e)){let n,a;if(Tn(e)){n=e,a=J(e);let l=we(e);if(Ei(l))throw ce(Ci);if(Xs(e))throw ce(ks);let f=new Ri(a*Yl);i=Ai(De,[f],new.target)}else{let l=e[qe];if(l!=null&&typeof l!="function")throw ce(Cl);l!=null?Wl(e)?(n=e,a=e.length):(n=[...e],a=n.length):(n=e,a=Qs(n.length)),i=Ai(De,[a],new.target)}for(let l=0;l<a;++l)i[l]=mt(n[l])}else i=Ai(De,arguments,new.target);let o=new Hp(i,Gm);return wn(Js,o,i),o}static from(e,...t){let r=this;if(!yn(r,In))throw ce(Il);if(r===s){if(Mr(e)&&t.length===0){let c=U(e),u=new De(we(c),lr(c),J(c));return new s(we($i(u)))}if(t.length===0)return new s(we(kl(e,mt)));let l=t[0],f=t[1];return new s(we(kl(e,function(c,...u){return mt($e(l,this,[c,..._n(u)]))},f)))}let i,o,n=e[qe];if(n!=null&&typeof n!="function")throw ce(Cl);if(n!=null)Wl(e)?(i=e,o=e.length):Pd(e)?(i=e,o=J(e)):(i=[...e],o=i.length);else{if(e==null)throw ce(xn);i=Dr(e),o=Qs(i.length)}let a=new r(o);if(t.length===0)for(let l=0;l<o;++l)a[l]=i[l];else{let l=t[0],f=t[1];for(let c=0;c<o;++c)a[c]=$e(l,f,[i[c],c])}return a}static of(...e){let t=this;if(!yn(t,In))throw ce(Il);let r=e.length;if(t===s){let o=new s(r),n=U(o);for(let a=0;a<r;++a)n[a]=mt(e[a]);return o}let i=new t(r);for(let o=0;o<r;++o)i[o]=e[o];return i}keys(){re(this);let e=U(this);return ad(e)}values(){re(this);let e=U(this);return Ul((function*(){for(let t of ld(e))yield oe(t)})())}entries(){re(this);let e=U(this);return Ul((function*(){for(let[t,r]of cd(e))yield[t,oe(r)]})())}at(e){re(this);let t=U(this),r=J(t),i=Pt(e),o=i>=0?i:r+i;if(!(o<0||o>=r))return oe(t[o])}with(e,t){re(this);let r=U(this),i=J(r),o=Pt(e),n=o>=0?o:i+o,a=+t;if(n<0||n>=i)throw Ks(Os);let l=new De(we(r),lr(r),J(r)),f=new s(we($i(l))),c=U(f);return c[n]=mt(a),f}map(e,...t){re(this);let r=U(this),i=J(r),o=t[0],n=Cn(r,s);if(n===s){let l=new s(i),f=U(l);for(let c=0;c<i;++c){let u=oe(r[c]);f[c]=mt($e(e,o,[u,c,this]))}return l}let a=new n(i);Zs(a,i);for(let l=0;l<i;++l){let f=oe(r[l]);a[l]=$e(e,o,[f,l,this])}return a}filter(e,...t){re(this);let r=U(this),i=J(r),o=t[0],n=[];for(let f=0;f<i;++f){let c=oe(r[f]);$e(e,o,[c,f,this])&&Qp(n,c)}let a=Cn(r,s),l=new a(n);return Zs(l),l}reduce(e,...t){re(this);let r=U(this),i=J(r);if(i===0&&t.length===0)throw ce(Pl);let o,n;t.length===0?(o=oe(r[0]),n=1):(o=t[0],n=0);for(let a=n;a<i;++a)o=e(o,oe(r[a]),a,this);return o}reduceRight(e,...t){re(this);let r=U(this),i=J(r);if(i===0&&t.length===0)throw ce(Pl);let o,n;t.length===0?(o=oe(r[i-1]),n=i-2):(o=t[0],n=i-1);for(let a=n;a>=0;--a)o=e(o,oe(r[a]),a,this);return o}forEach(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=0;n<i;++n)$e(e,o,[oe(r[n]),n,this])}find(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=0;n<i;++n){let a=oe(r[n]);if($e(e,o,[a,n,this]))return a}}findIndex(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=0;n<i;++n){let a=oe(r[n]);if($e(e,o,[a,n,this]))return n}return-1}findLast(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=i-1;n>=0;--n){let a=oe(r[n]);if($e(e,o,[a,n,this]))return a}}findLastIndex(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=i-1;n>=0;--n){let a=oe(r[n]);if($e(e,o,[a,n,this]))return n}return-1}every(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=0;n<i;++n)if(!$e(e,o,[oe(r[n]),n,this]))return!1;return!0}some(e,...t){re(this);let r=U(this),i=J(r),o=t[0];for(let n=0;n<i;++n)if($e(e,o,[oe(r[n]),n,this]))return!0;return!1}set(e,...t){re(this);let r=U(this),i=Pt(t[0]);if(i<0)throw Ks(Os);if(e==null)throw ce(xn);if(Xs(e))throw ce(ks);if(Mr(e))return ud(U(this),U(e),i);if(Tn(e)){let l=we(e);if(Ei(l))throw ce(Ci)}let o=J(r),n=Dr(e),a=Qs(n.length);if(i===1/0||a+i>o)throw Ks(Os);for(let l=0;l<a;++l)r[l+i]=mt(n[l])}reverse(){re(this);let e=U(this);return Ml(e),this}toReversed(){re(this);let e=U(this),t=new De(we(e),lr(e),J(e)),r=new s(we($i(t))),i=U(r);return Ml(i),r}fill(e,...t){re(this);let r=U(this);return fd(r,mt(e),..._n(t)),this}copyWithin(e,t,...r){re(this);let i=U(this);return pd(i,e,t,..._n(r)),this}sort(e){re(this);let t=U(this),r=e!==void 0?e:jl;return El(t,(i,o)=>r(oe(i),oe(o))),this}toSorted(e){re(this);let t=U(this);if(e!==void 0&&typeof e!="function")throw new ce(Vp);let r=e!==void 0?e:jl,i=new De(we(t),lr(t),J(t)),o=new s(we($i(i))),n=U(o);return El(n,(a,l)=>r(oe(a),oe(l))),o}slice(e,t){re(this);let r=U(this),i=Cn(r,s);if(i===s){let h=new De(we(r),lr(r),J(r));return new s(we($i(h,e,t)))}let o=J(r),n=Pt(e),a=t===void 0?o:Pt(t),l;n===-1/0?l=0:n<0?l=o+n>0?o+n:0:l=o<n?o:n;let f;a===-1/0?f=0:a<0?f=o+a>0?o+a:0:f=o<a?o:a;let c=f-l>0?f-l:0,u=new i(c);if(Zs(u,c),c===0)return u;let p=we(r);if(Ei(p))throw ce(Ci);let d=0;for(;l<f;)u[d]=oe(r[l]),++l,++d;return u}subarray(e,t){re(this);let r=U(this),i=Cn(r,s),o=new De(we(r),lr(r),J(r)),n=dd(o,e,t),a=new i(we(n),lr(n),J(n));return Zs(a),a}indexOf(e,...t){re(this);let r=U(this),i=J(r),o=Pt(t[0]);if(o===1/0)return-1;o<0&&(o+=i,o<0&&(o=0));for(let n=o;n<i;++n)if(Ct(r,n)&&oe(r[n])===e)return n;return-1}lastIndexOf(e,...t){re(this);let r=U(this),i=J(r),o=t.length>=1?Pt(t[0]):i-1;if(o===-1/0)return-1;o>=0?o=o<i-1?o:i-1:o+=i;for(let n=o;n>=0;--n)if(Ct(r,n)&&oe(r[n])===e)return n;return-1}includes(e,...t){re(this);let r=U(this),i=J(r),o=Pt(t[0]);if(o===1/0)return!1;o<0&&(o+=i,o<0&&(o=0));let n=Ut(e);for(let a=o;a<i;++a){let l=oe(r[a]);if(n&&Ut(l)||l===e)return!0}return!1}join(e){re(this);let t=U(this),r=Ed(t);return Xp(r,e)}toLocaleString(...e){re(this);let t=U(this),r=Ed(t);return Zp(r,..._n(e))}get[Ws](){if(Mr(this))return"Float16Array"}};Nr(Ne,"BYTES_PER_ELEMENT",{value:Yl});Nr(Ne,In,{});$l(Ne,js);var ea=Ne.prototype;Nr(ea,"BYTES_PER_ELEMENT",{value:Yl});Nr(ea,qe,{value:ea.values,writable:!0,configurable:!0});$l(ea,be);function qm(s){return s.op==="concat"?s.inputs:[s.input]}function jm(s){let e=new Map;for(let t of s.nodes)for(let r of qm(t)){let i=e.get(r)??[];i.push(t),e.set(r,i)}return e}function Kl(s,e,t){let r=s.get(e);if(!(r?.length!==1||r[0].op!==t))return r[0]}function Pn(s,e={}){let t=s.spec,r=jm(t),i=new Map(t.nodes.map(c=>[c.id,c])),o=new Set,n=new Map,a=0,l=0;if(e.fuseConvPool!==!1)for(let c of t.nodes){if(c.op!=="conv2d"||c.activation!=="relu")continue;let u=Kl(r,c.id,"maxPool2d");!u||u.size!==2||u.stride!==2||(o.add(c.id),n.set(u.id,{op:"fusedConvReluMaxPool2d",id:u.id,input:c.input,conv:c,pool:u}),a++)}if(e.fuseUpsampleConcatConv!==!1)for(let c of t.nodes){if(c.op!=="conv2d")continue;let u=i.get(c.input);if(u?.op!=="concat"||u.inputs.length!==2||Kl(r,u.id,"conv2d")!==c)continue;let p=s.channelsByValue.get(u.inputs[0]);if(p===void 0||p%4!==0)continue;let d=u.inputs.map(g=>{let x=i.get(g);return x?.op==="upsample2d"&&x.scale===2&&x.mode==="nearest"&&Kl(r,x.id,"concat")===u?{value:x.input,upsample:x}:{value:g}});if(d.filter(g=>g.upsample).length===1){o.add(u.id);for(let g of u.inputs){let x=i.get(g);x?.op==="upsample2d"&&o.add(x.id)}n.set(c.id,{op:"fusedUpsampleConcatConv2d",id:c.id,inputs:d,conv:c}),l++}}let f=[];for(let c of t.nodes){let u=n.get(c.id);u?f.push(u):o.has(c.id)||f.push(c)}return{spec:t,nodes:f,fusions:{convPool:a,upsampleConcatConv:l}}}function Ym(s){return s.op==="concat"?s.inputs:s.op==="fusedUpsampleConcatConv2d"?s.inputs.map(e=>e.value):[s.input]}function kd(s,e){return s.width===e.width&&s.height===e.height}function Xl(s,e,t,r){if(!Number.isInteger(e)||e<=0||!Number.isInteger(t)||t<=0)throw new Error(`Invalid model input size ${e}x${t}`);let i=Pn(s,r),o={width:e,height:t,channels:s.inputChannels},n=new Map([[s.spec.input,o]]),a=[],l=(u,p)=>{let d=n.get(u);if(!d)throw new Error(`Planned node ${p} reads missing value ${u}`);return d};for(let u of i.nodes){let p;if(u.op==="conv2d"){let d=l(u.input,u.id);p={width:d.width,height:d.height,channels:s.convChannels.get(u.id).outputChannels}}else if(u.op==="maxPool2d"){let d=l(u.input,u.id);p={width:Math.ceil(d.width/2),height:Math.ceil(d.height/2),channels:d.channels}}else if(u.op==="upsample2d"){let d=l(u.input,u.id);p={width:d.width*2,height:d.height*2,channels:d.channels}}else if(u.op==="concat"){let d=u.inputs.map(h=>l(h,u.id));if(d.some(h=>!kd(h,d[0])))throw new Error(`Concat ${u.id} has mismatched spatial shapes`);p={width:d[0].width,height:d[0].height,channels:d.reduce((h,g)=>h+g.channels,0)}}else if(u.op==="fusedConvReluMaxPool2d"){let d=l(u.input,u.id);p={width:Math.ceil(d.width/2),height:Math.ceil(d.height/2),channels:s.convChannels.get(u.conv.id).outputChannels}}else{let d=u.inputs.map(h=>{let g=l(h.value,u.id);return h.upsample?{...g,width:g.width*2,height:g.height*2}:g});if(d.some(h=>!kd(h,d[0])))throw new Error(`Fused decoder ${u.id} has mismatched spatial shapes`);p={width:d[0].width,height:d[0].height,channels:s.convChannels.get(u.conv.id).outputChannels}}n.set(u.id,p),a.push(p)}let f=new Map;i.nodes.forEach((u,p)=>{for(let d of Ym(u))f.set(d,p)}),f.set(s.spec.output,i.nodes.length);let c=i.nodes.map((u,p)=>({node:u,outputShape:a[p],lastUse:f.get(u.id)??p}));return{...i,inputShape:o,valueShapes:n,plannedNodes:c}}var Li=class{_stats=new Map;track(e,t){let r=this._stats.get(e);return r||(r={created:0,destroyed:0,live:0,peakLive:0,resources:new Set},this._stats.set(e,r)),r.resources.has(t)||(r.resources.add(t),r.created++,r.live++,r.peakLive=Math.max(r.peakLive,r.live)),t}release(e,t,r){if(!t)return!1;let i=this._stats.get(e);if(!i?.resources.delete(t))return!1;try{r()}finally{i.destroyed++,i.live--}return!0}snapshot(e=0){let t=0,r=0,i=0,o=0,n={};for(let[a,l]of this._stats){let f={created:l.created,destroyed:l.destroyed,live:l.live,peakLive:l.peakLive};n[a]=f,t+=f.live,r+=f.created,i+=f.destroyed,o+=f.peakLive}return{live:t,created:r,destroyed:i,peakLive:o,pending:e,byKind:n}}};var Od=new WeakMap;function Km(s){let e=Od.get(s);return e||(e={ready:new Map,pending:new Map},Od.set(s,e)),e}var Pe=8,rt=8,Ce=4,Er=rt*Ce,je=rt,ke=8,pe=8,it=pe+2;function Zl(s,e){return Math.ceil(s/e)*e}function ge(s){return Math.ceil(s/4)}function Xm(s,e){return s.width*s.height*ge(s.channels)*4*e}var An;function Hd(s){let e=s&32768?-1:1,t=s>>>10&31,r=s&1023;return t===0?e*r*2**-24:t===31?r===0?e*(1/0):NaN:e*(1+r/1024)*2**(t-15)}function Qm(){if(!An){An=new Float32Array(65536);for(let s=0;s<An.length;s++)An[s]=Hd(s)}return An}function zd(s){if(s.desc.dataType==="Float32")return new Float32Array(s.data.buffer,s.data.byteOffset,s.data.byteLength/4);let e=new Uint16Array(s.data.buffer,s.data.byteOffset,s.data.byteLength/2),t=new Float32Array(e.length);if(e.length<4096)for(let r=0;r<e.length;r++)t[r]=Hd(e[r]);else{let r=Qm();for(let i=0;i<e.length;i++)t[i]=r[e[i]]}return t}function Ql(s,e,t,r){let i=Zl(t.byteLength,4),o=s.createBuffer({label:e,size:i,usage:r,mappedAtCreation:!0});return new Uint8Array(o.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),o.unmap(),o}function Ud(s,e,t){let r=new Uint32Array(Zl(t.length,4));return r.set(t),Ql(s,e,r,GPUBufferUsage.UNIFORM)}function Zm(s,e,t,r){let i=ge(t.inputChannels),o=ge(t.outputChannels),n=o*t.kernelHeight*t.kernelWidth*i*4*4,a=r==="fp16"&&t.weight.desc.dataType==="Float16",l=a?new Uint16Array(n):r==="fp16"?new Ne(n):new Float32Array(n),f=a?new Uint16Array(t.weight.data.buffer,t.weight.data.byteOffset,t.weight.data.byteLength/2):zd(t.weight);for(let p=0;p<o;p++)for(let d=0;d<t.kernelHeight;d++)for(let h=0;h<t.kernelWidth;h++)for(let g=0;g<i;g++)for(let x=0;x<4;x++){let b=p*4+x;for(let m=0;m<4;m++){let v=g*4+m,w=(((p*t.kernelHeight+d)*t.kernelWidth+h)*i+g)*16+m*4+x;if(b<t.outputChannels&&v<t.inputChannels){let S=((b*t.inputChannels+v)*t.kernelHeight+d)*t.kernelWidth+h;l[w]=f[S]}}}let c=new Float32Array(o*4);c.set(zd(t.bias));let u=Ql(s,`oidn/${e}/weights/${r}`,l,GPUBufferUsage.STORAGE);try{return{weights:u,bias:Ql(s,`oidn/${e}/bias`,c,GPUBufferUsage.STORAGE)}}catch(p){throw u.destroy(),p}}function Ae(s){return s==="fp16"?"vec4<f16>":"vec4<f32>"}function At(s){return s==="fp16"?`enable f16;
`:""}function Bt(s,e){return e==="fp16"?`vec4<f16>(${s})`:s}function cr(s,e){return e==="relu"?`max(${s}, vec4<f32>(0.0))`:s}function Rn(s,e,t){return t==="fp32"?`
let inputValue = vec4<f32>(${s});
let weightBase = ${e};
acc = fma(vec4<f32>(weights[weightBase]), vec4<f32>(inputValue.x), acc);
acc = fma(vec4<f32>(weights[weightBase + 1u]), vec4<f32>(inputValue.y), acc);
acc = fma(vec4<f32>(weights[weightBase + 2u]), vec4<f32>(inputValue.z), acc);
acc = fma(vec4<f32>(weights[weightBase + 3u]), vec4<f32>(inputValue.w), acc);
`:`
let inputValue = vec4<f16>(${s});
let weightBase = ${e};
var partial = vec4<f16>(0.0h);
partial = fma(weights[weightBase], vec4<f16>(inputValue.x), partial);
partial = fma(weights[weightBase + 1u], vec4<f16>(inputValue.y), partial);
partial = fma(weights[weightBase + 2u], vec4<f16>(inputValue.z), partial);
partial = fma(weights[weightBase + 3u], vec4<f16>(inputValue.w), partial);
acc += vec4<f32>(partial);
`}function Jm(s,e,t){let r=t==="fp16"?"vec4<f16>":"vec4<f32>",i=t==="fp16"?`var partial = vec4<f16>(0.0h);
partial = fma(subgroupBroadcast(weights[weightBase], 0u), ${r}(inputValue.x), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 1u], 0u), ${r}(inputValue.y), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 2u], 0u), ${r}(inputValue.z), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 3u], 0u), ${r}(inputValue.w), partial);
acc += vec4<f32>(partial);`:`acc = fma(subgroupBroadcast(weights[weightBase], 0u), vec4<f32>(inputValue.x), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 1u], 0u), vec4<f32>(inputValue.y), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 2u], 0u), vec4<f32>(inputValue.z), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 3u], 0u), vec4<f32>(inputValue.w), acc);`;return`
let inputValue = ${r}(${s});
let weightBase = ${e};
${i}
`}function Wd(s){return s==="fp16"?`
    var partial: array<vec4<f16>, ${Ce}>;
    for (var row = 0u; row < ${Ce}u; row++) {
      partial[row] = vec4<f16>(0.0h);
    }
    for (var tileK = 0u; tileK < ${ke}u; tileK++) {
      let weightBase =
        (tileK * ${je}u + localId.x) * 4u;
      for (var row = 0u; row < ${Ce}u; row++) {
        let tileSpatial =
          localId.y * ${Ce}u + row;
        let inputValue =
          inputTile[tileSpatial * ${ke}u + tileK];
        partial[row] = fma(
          weightTile[weightBase],
          vec4<f16>(inputValue.x),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 1u],
          vec4<f16>(inputValue.y),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 2u],
          vec4<f16>(inputValue.z),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 3u],
          vec4<f16>(inputValue.w),
          partial[row]
        );
      }
    }
    for (var row = 0u; row < ${Ce}u; row++) {
      acc[row] += vec4<f32>(partial[row]);
    }
`:`
    for (var tileK = 0u; tileK < ${ke}u; tileK++) {
      let weightBase =
        (tileK * ${je}u + localId.x) * 4u;
      for (var row = 0u; row < ${Ce}u; row++) {
        let tileSpatial =
          localId.y * ${Ce}u + row;
        let inputValue =
          inputTile[tileSpatial * ${ke}u + tileK];
        acc[row] = fma(
          weightTile[weightBase],
          vec4<f32>(inputValue.x),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 1u],
          vec4<f32>(inputValue.y),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 2u],
          vec4<f32>(inputValue.z),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 3u],
          vec4<f32>(inputValue.w),
          acc[row]
        );
      }
    }
`}function eg(s,e,t,r,i){let o=Ae(s),n=Ae(s),a=Ae(e),l=Bt(cr("acc",t),e);return`${At(s)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}

@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${n}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${a}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${i}u) {
    return;
  }
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    if (inputY < 0 || inputY >= i32(params.inputHeight)) { continue; }
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      if (inputX < 0 || inputX >= i32(params.inputWidth)) { continue; }
      let pixelBase = (u32(inputY) * params.inputWidth + u32(inputX)) * ${r}u;
      for (var inputBlock = 0u; inputBlock < ${r}u; inputBlock++) {
        ${Rn("inputData[pixelBase + inputBlock]",`((((gid.z * 3u + ky) * 3u + kx) * ${r}u + inputBlock) * 4u)`,s)}
      }
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${i}u + gid.z;
  outputData[outputIndex] = ${l};
}
`}function tg(s,e,t,r,i){let o=Ae(s),n=Ae(s),a=Ae(e),l=Bt(cr("acc",t),e);return`${At(s)}
enable subgroups;
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${n}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${a}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let outputInBounds =
    gid.x < params.outputWidth && gid.y < params.outputHeight;
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    let clampedY = u32(clamp(inputY, 0, i32(params.inputHeight) - 1));
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      let clampedX = u32(clamp(inputX, 0, i32(params.inputWidth) - 1));
      let inputInBounds =
        outputInBounds && inputX >= 0 && inputY >= 0 &&
        inputX < i32(params.inputWidth) && inputY < i32(params.inputHeight);
      let pixelBase =
        (clampedY * params.inputWidth + clampedX) * ${r}u;
      for (var inputBlock = 0u; inputBlock < ${r}u; inputBlock++) {
        ${Jm(`select(${o}(0.0), inputData[pixelBase + inputBlock], inputInBounds)`,`((((gid.z * 3u + ky) * 3u + kx) * ${r}u + inputBlock) * 4u)`,s)}
      }
    }
  }
  if (outputInBounds) {
    let outputIndex =
      (gid.y * params.outputWidth + gid.x) * ${i}u + gid.z;
    outputData[outputIndex] = ${l};
  }
}
`}function rg(s,e,t,r,i){let o=Ae(s),n=Ae(e),a=Bt(cr("acc",t),e),l=it*it*r,f=pe*pe;return`${At(s)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${o}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${n}>;
@group(0) @binding(4) var<uniform> params: Params;

var<workgroup> inputPatch: array<${o}, ${l}>;

@compute @workgroup_size(${pe}, ${pe}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localLinear =
    localId.y * ${pe}u + localId.x;
  for (
    var loadIndex = localLinear;
    loadIndex < ${l}u;
    loadIndex += ${f}u
  ) {
    let patchPixel = loadIndex / ${r}u;
    let inputBlock = loadIndex % ${r}u;
    let patchX = patchPixel % ${it}u;
    let patchY = patchPixel / ${it}u;
    let inputX =
      i32(workgroupId.x * ${pe}u + patchX) - 1;
    let inputY =
      i32(workgroupId.y * ${pe}u + patchY) - 1;
    var value = ${o}(0.0);
    if (
      inputX >= 0 && inputX < i32(params.inputWidth) &&
      inputY >= 0 && inputY < i32(params.inputHeight)
    ) {
      let inputIndex =
        (u32(inputY) * params.inputWidth + u32(inputX)) *
        ${r}u + inputBlock;
      value = inputData[inputIndex];
    }
    inputPatch[loadIndex] = value;
  }
  workgroupBarrier();

  let outputX =
    workgroupId.x * ${pe}u + localId.x;
  let outputY =
    workgroupId.y * ${pe}u + localId.y;
  let outputBlock = workgroupId.z;
  if (
    outputX >= params.outputWidth || outputY >= params.outputHeight ||
    outputBlock >= ${i}u
  ) {
    return;
  }

  var acc = bias[outputBlock];
  for (var ky = 0u; ky < 3u; ky++) {
    for (var kx = 0u; kx < 3u; kx++) {
      let patchBase =
        ((localId.y + ky) * ${it}u + localId.x + kx) *
        ${r}u;
      for (var inputBlock = 0u; inputBlock < ${r}u; inputBlock++) {
        ${Rn("inputPatch[patchBase + inputBlock]",`((((outputBlock * 3u + ky) * 3u + kx) * ${r}u + inputBlock) * 4u)`,s)}
      }
    }
  }
  let outputIndex =
    (outputY * params.outputWidth + outputX) * ${i}u + outputBlock;
  outputData[outputIndex] = ${a};
}
`}function ig(s,e,t,r,i){let o=Ae(s),n=Ae(e),a=Bt(cr("acc",t),e),l=rt*rt,f=Er*ke,c=ke*je*4;return`${At(s)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${o}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${n}>;
@group(0) @binding(4) var<uniform> params: Params;

var<workgroup> inputTile: array<${o}, ${f}>;
var<workgroup> weightTile: array<${o}, ${c}>;

@compute @workgroup_size(${rt}, ${rt}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let spatialBase =
    workgroupId.x * ${Er}u +
    localId.y * ${Ce}u;
  let outputBlock =
    workgroupId.y * ${je}u + localId.x;
  let spatialCount = params.outputWidth * params.outputHeight;
  var acc: array<vec4<f32>, ${Ce}>;
  if (outputBlock < ${i}u) {
    for (var row = 0u; row < ${Ce}u; row++) {
      acc[row] = bias[outputBlock];
    }
  }

  let localLinear =
    localId.y * ${rt}u + localId.x;
  let totalK = ${r*9}u;
  for (var kBase = 0u; kBase < totalK; kBase += ${ke}u) {
    for (
      var loadIndex = localLinear;
      loadIndex < ${f}u;
      loadIndex += ${l}u
    ) {
      let tileSpatial = loadIndex / ${ke}u;
      let tileK = loadIndex % ${ke}u;
      let inputSpatialIndex =
        workgroupId.x * ${Er}u + tileSpatial;
      let kIndex = kBase + tileK;
      var value = ${o}(0.0);
      if (inputSpatialIndex < spatialCount && kIndex < totalK) {
        let outputY = inputSpatialIndex / params.outputWidth;
        let outputX = inputSpatialIndex % params.outputWidth;
        let inputBlock = kIndex % ${r}u;
        let kernelIndex = kIndex / ${r}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let inputY = i32(outputY) + i32(kernelY) - 1;
        let inputX = i32(outputX) + i32(kernelX) - 1;
        if (
          inputY >= 0 && inputY < i32(params.inputHeight) &&
          inputX >= 0 && inputX < i32(params.inputWidth)
        ) {
          let inputIndex =
            (u32(inputY) * params.inputWidth + u32(inputX)) *
            ${r}u + inputBlock;
          value = inputData[inputIndex];
        }
      }
      inputTile[loadIndex] = value;
    }

    for (
      var loadIndex = localLinear;
      loadIndex < ${c}u;
      loadIndex += ${l}u
    ) {
      let tileK = loadIndex / ${je*4}u;
      let outputRemainder = loadIndex % ${je*4}u;
      let tileOutputBlock = outputRemainder / 4u;
      let outputLane = outputRemainder % 4u;
      let loadedOutputBlock =
        workgroupId.y * ${je}u + tileOutputBlock;
      let kIndex = kBase + tileK;
      var value = ${o}(0.0);
      if (loadedOutputBlock < ${i}u && kIndex < totalK) {
        let inputBlock = kIndex % ${r}u;
        let kernelIndex = kIndex / ${r}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let weightIndex =
          ((((loadedOutputBlock * 3u + kernelY) * 3u + kernelX) *
            ${r}u + inputBlock) * 4u + outputLane);
        value = weights[weightIndex];
      }
      weightTile[loadIndex] = value;
    }

    workgroupBarrier();
    ${Wd(s)}
    workgroupBarrier();
  }

  if (outputBlock < ${i}u) {
    for (var row = 0u; row < ${Ce}u; row++) {
      let spatialIndex = spatialBase + row;
      if (spatialIndex < spatialCount) {
        let outputIndex = spatialIndex * ${i}u + outputBlock;
        outputData[outputIndex] = ${a.replaceAll("acc","acc[row]")};
      }
    }
  }
}
`}function ng(s,e,t,r){let i=Ae(s),o=cr("acc",e);return`${At(s)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${i}>;
@group(0) @binding(1) var<storage, read> weights: array<${i}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${i}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${r}u) {
    return;
  }
  var pooled = vec4<f32>(-3.402823466e+38);
  for (var py = 0u; py < 2u; py++) {
    let centerY = gid.y * 2u + py;
    if (centerY >= params.inputHeight) { continue; }
    for (var px = 0u; px < 2u; px++) {
      let centerX = gid.x * 2u + px;
      if (centerX >= params.inputWidth) { continue; }
      var acc = bias[gid.z];
      for (var ky = 0u; ky < 3u; ky++) {
        let inputY = i32(centerY) + i32(ky) - 1;
        if (inputY < 0 || inputY >= i32(params.inputHeight)) { continue; }
        for (var kx = 0u; kx < 3u; kx++) {
          let inputX = i32(centerX) + i32(kx) - 1;
          if (inputX < 0 || inputX >= i32(params.inputWidth)) { continue; }
          let pixelBase = (u32(inputY) * params.inputWidth + u32(inputX)) * ${t}u;
          for (var inputBlock = 0u; inputBlock < ${t}u; inputBlock++) {
            ${Rn("inputData[pixelBase + inputBlock]",`((((gid.z * 3u + ky) * 3u + kx) * ${t}u + inputBlock) * 4u)`,s)}
          }
        }
      }
      pooled = max(pooled, ${o});
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${r}u + gid.z;
  outputData[outputIndex] = ${Bt("pooled",s)};
}
`}function og(s,e){let t=Ae(s);return`${At(s)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${t}>;
@group(0) @binding(1) var<storage, read_write> outputData: array<${t}>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (
    gid.x >= params.outputWidth ||
    gid.y >= params.outputHeight ||
    gid.z >= ${e}u
  ) {
    return;
  }
  var pooled = vec4<f32>(-3.402823466e+38);
  for (var py = 0u; py < 2u; py++) {
    let inputY = gid.y * 2u + py;
    if (inputY >= params.inputHeight) { continue; }
    for (var px = 0u; px < 2u; px++) {
      let inputX = gid.x * 2u + px;
      if (inputX >= params.inputWidth) { continue; }
      let inputIndex =
        (inputY * params.inputWidth + inputX) * ${e}u + gid.z;
      pooled = max(pooled, vec4<f32>(inputData[inputIndex]));
    }
  }
  let outputIndex =
    (gid.y * params.outputWidth + gid.x) * ${e}u + gid.z;
  outputData[outputIndex] = ${Bt("pooled",s)};
}
`}function sg(s,e,t,r,i){let o=Ae(s),n=t[0]+t[1],a=Bt(cr("acc[row]",e),s),l=rt*rt,f=Er*ke,c=ke*je*4,u=(p,d)=>`
          {
            let sourceBlock = ${d};
            let sourceX = ${p===r?"u32(inputX) / 2u":"u32(inputX)"};
            let sourceY = ${p===r?"u32(inputY) / 2u":"u32(inputY)"};
            let sourceIndex =
              (sourceY * params.source${p}Width + sourceX) *
              ${t[p]}u + sourceBlock;
            value = input${p}[sourceIndex];
          }`;return`${At(s)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${o}>;
@group(0) @binding(1) var<storage, read> input1: array<${o}>;
@group(0) @binding(2) var<storage, read> weights: array<${o}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${o}>;
@group(0) @binding(5) var<uniform> params: Params;

var<workgroup> inputTile: array<${o}, ${f}>;
var<workgroup> weightTile: array<${o}, ${c}>;

@compute @workgroup_size(${rt}, ${rt}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let spatialBase =
    workgroupId.x * ${Er}u +
    localId.y * ${Ce}u;
  let outputBlock =
    workgroupId.y * ${je}u + localId.x;
  let spatialCount = params.outputWidth * params.outputHeight;
  var acc: array<vec4<f32>, ${Ce}>;
  if (outputBlock < ${i}u) {
    for (var row = 0u; row < ${Ce}u; row++) {
      acc[row] = bias[outputBlock];
    }
  }

  let localLinear =
    localId.y * ${rt}u + localId.x;
  let totalK = ${n*9}u;
  for (var kBase = 0u; kBase < totalK; kBase += ${ke}u) {
    for (
      var loadIndex = localLinear;
      loadIndex < ${f}u;
      loadIndex += ${l}u
    ) {
      let tileSpatial = loadIndex / ${ke}u;
      let tileK = loadIndex % ${ke}u;
      let outputSpatialIndex =
        workgroupId.x * ${Er}u + tileSpatial;
      let kIndex = kBase + tileK;
      var value = ${o}(0.0);
      if (outputSpatialIndex < spatialCount && kIndex < totalK) {
        let outputY = outputSpatialIndex / params.outputWidth;
        let outputX = outputSpatialIndex % params.outputWidth;
        let inputBlock = kIndex % ${n}u;
        let kernelIndex = kIndex / ${n}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let inputY = i32(outputY) + i32(kernelY) - 1;
        let inputX = i32(outputX) + i32(kernelX) - 1;
        if (
          inputY >= 0 && inputY < i32(params.outputHeight) &&
          inputX >= 0 && inputX < i32(params.outputWidth)
        ) {
          if (inputBlock < ${t[0]}u) {
            ${u(0,"inputBlock")}
          } else {
            ${u(1,`inputBlock - ${t[0]}u`)}
          }
        }
      }
      inputTile[loadIndex] = value;
    }

    for (
      var loadIndex = localLinear;
      loadIndex < ${c}u;
      loadIndex += ${l}u
    ) {
      let tileK = loadIndex / ${je*4}u;
      let outputRemainder = loadIndex % ${je*4}u;
      let tileOutputBlock = outputRemainder / 4u;
      let outputLane = outputRemainder % 4u;
      let loadedOutputBlock =
        workgroupId.y * ${je}u + tileOutputBlock;
      let kIndex = kBase + tileK;
      var value = ${o}(0.0);
      if (loadedOutputBlock < ${i}u && kIndex < totalK) {
        let inputBlock = kIndex % ${n}u;
        let kernelIndex = kIndex / ${n}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let weightIndex =
          ((((loadedOutputBlock * 3u + kernelY) * 3u + kernelX) *
            ${n}u + inputBlock) * 4u + outputLane);
        value = weights[weightIndex];
      }
      weightTile[loadIndex] = value;
    }

    workgroupBarrier();
    ${Wd(s)}
    workgroupBarrier();
  }

  if (outputBlock < ${i}u) {
    for (var row = 0u; row < ${Ce}u; row++) {
      let spatialIndex = spatialBase + row;
      if (spatialIndex < spatialCount) {
        let outputIndex = spatialIndex * ${i}u + outputBlock;
        outputData[outputIndex] = ${a};
      }
    }
  }
}
`}function ag(s,e,t,r,i){let o=Ae(s),n=t[0]+t[1],a=(f,c)=>{let u=f===r;return`
      {
        let sourceX = ${u?"u32(inputX) / 2u":"u32(inputX)"};
        let sourceY = ${u?"u32(inputY) / 2u":"u32(inputY)"};
        let sourcePixelBase = (sourceY * params.source${f}Width + sourceX) * ${t[f]}u;
        for (var sourceBlock = 0u; sourceBlock < ${t[f]}u; sourceBlock++) {
          let inputBlock = ${c}u + sourceBlock;
          ${Rn(`input${f}[sourcePixelBase + sourceBlock]`,`((((gid.z * 3u + ky) * 3u + kx) * ${n}u + inputBlock) * 4u)`,s)}
        }
      }
`},l=Bt(cr("acc",e),s);return`${At(s)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${o}>;
@group(0) @binding(1) var<storage, read> input1: array<${o}>;
@group(0) @binding(2) var<storage, read> weights: array<${o}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${o}>;
@group(0) @binding(5) var<uniform> params: Params;

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${i}u) {
    return;
  }
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    if (inputY < 0 || inputY >= i32(params.outputHeight)) { continue; }
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      if (inputX < 0 || inputX >= i32(params.outputWidth)) { continue; }
      ${a(0,0)}
      ${a(1,t[0])}
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${i}u + gid.z;
  outputData[outputIndex] = ${l};
}
`}function lg(s,e,t,r,i){let o=Ae(s),n=t[0]+t[1],a=it*it*n,l=pe*pe,f=Bt(cr("acc",e),s),c=(u,p)=>`
      let sourceBlock = ${p};
      let sourceIndex =
        (${u===r?"u32(inputY) / 2u":"u32(inputY)"} * params.source${u}Width + ${u===r?"u32(inputX) / 2u":"u32(inputX)"}) *
        ${t[u]}u + sourceBlock;
      value = input${u}[sourceIndex];`;return`${At(s)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${o}>;
@group(0) @binding(1) var<storage, read> input1: array<${o}>;
@group(0) @binding(2) var<storage, read> weights: array<${o}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${o}>;
@group(0) @binding(5) var<uniform> params: Params;

var<workgroup> inputPatch: array<${o}, ${a}>;

@compute @workgroup_size(${pe}, ${pe}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localLinear =
    localId.y * ${pe}u + localId.x;
  for (
    var loadIndex = localLinear;
    loadIndex < ${a}u;
    loadIndex += ${l}u
  ) {
    let patchPixel = loadIndex / ${n}u;
    let inputBlock = loadIndex % ${n}u;
    let patchX = patchPixel % ${it}u;
    let patchY = patchPixel / ${it}u;
    let inputX =
      i32(workgroupId.x * ${pe}u + patchX) - 1;
    let inputY =
      i32(workgroupId.y * ${pe}u + patchY) - 1;
    var value = ${o}(0.0);
    if (
      inputX >= 0 && inputX < i32(params.outputWidth) &&
      inputY >= 0 && inputY < i32(params.outputHeight)
    ) {
      if (inputBlock < ${t[0]}u) {
        ${c(0,"inputBlock")}
      } else {
        ${c(1,`inputBlock - ${t[0]}u`)}
      }
    }
    inputPatch[loadIndex] = value;
  }
  workgroupBarrier();

  let outputX =
    workgroupId.x * ${pe}u + localId.x;
  let outputY =
    workgroupId.y * ${pe}u + localId.y;
  let outputBlock = workgroupId.z;
  if (
    outputX >= params.outputWidth || outputY >= params.outputHeight ||
    outputBlock >= ${i}u
  ) {
    return;
  }

  var acc = bias[outputBlock];
  for (var ky = 0u; ky < 3u; ky++) {
    for (var kx = 0u; kx < 3u; kx++) {
      let patchBase =
        ((localId.y + ky) * ${it}u + localId.x + kx) *
        ${n}u;
      for (var inputBlock = 0u; inputBlock < ${n}u; inputBlock++) {
        ${Rn("inputPatch[patchBase + inputBlock]",`((((outputBlock * 3u + ky) * 3u + kx) * ${n}u + inputBlock) * 4u)`,s)}
      }
    }
  }
  let outputIndex =
    (outputY * params.outputWidth + outputX) * ${i}u + outputBlock;
  outputData[outputIndex] = ${f};
}
`}function Vd(s,e){let t=Ae(s),r=Array.from({length:e},(a,l)=>`@group(0) @binding(${l}) var<storage, read> input${l}: array<vec4<f32>>;`).join(`
`),i=Array.from({length:e},(a,l)=>{let f=l*3;return`if (channel < ${f+3}u) { return input${l}[pixel][channel - ${f}u]; }`}).join(`
  `),o=e,n=e+1;return`${At(s)}
struct Params {
  width: u32,
  height: u32,
  outputBlocks: u32,
  inputChannels: u32,
}
${r}
@group(0) @binding(${o}) var<storage, read_write> outputData: array<${t}>;
@group(0) @binding(${n}) var<uniform> params: Params;

fn readChannel(pixel: u32, channel: u32) -> f32 {
  ${i}
  return 0.0;
}

@compute @workgroup_size(${Pe}, ${Pe}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height || gid.z >= params.outputBlocks) {
    return;
  }
  let pixel = gid.y * params.width + gid.x;
  let firstChannel = gid.z * 4u;
  let value = vec4<f32>(
    readChannel(pixel, firstChannel),
    readChannel(pixel, firstChannel + 1u),
    readChannel(pixel, firstChannel + 2u),
    readChannel(pixel, firstChannel + 3u)
  );
  outputData[pixel * params.outputBlocks + gid.z] = ${Bt("value",s)};
}
`}function cg(s){return s.op==="concat"?s.inputs:s.op==="fusedUpsampleConcatConv2d"?s.inputs.map(e=>e.value):[s.input]}function Gd(s,e="auto"){let t=s.features.has("shader-f16");if(e==="fp16"&&!t)throw new Error("OIDN FP16 was requested but the GPUDevice does not have shader-f16 enabled");return e==="auto"?t?"fp16":"fp32":e}var Bn=class{_device;precision;kernelSetting;maxSpatialInputBlocks;subgroupsAvailable;_model;_packedConvs=new Map;_pipelineCache;_pipelinePromises;_executionCache=new Map;_retiredExecutions=new Set;_clock=0;_shapeCacheSize;_profileNextExecution=!1;_lastExecutionProfile;_profileOperations=0;_resources=new Li;_disposed=!1;constructor(e,t,r={}){this._device=e;let i=Km(e);if(this._pipelineCache=i.ready,this._pipelinePromises=i.pending,this.precision=Gd(e,r.precision??"auto"),this.kernelSetting=r.kernel??"auto",this.subgroupsAvailable=e.features.has("subgroups"),this.maxSpatialInputBlocks=this.precision==="fp16"&&e.limits.maxComputeInvocationsPerWorkgroup>=pe*pe&&e.limits.maxComputeWorkgroupSizeX>=pe&&e.limits.maxComputeWorkgroupSizeY>=pe?Math.floor(e.limits.maxComputeWorkgroupStorageSize/(it*it*4*2)):0,this._shapeCacheSize=Math.max(1,r.shapeCacheSize??2),t.inputChannels%3!==0||t.inputChannels<3||t.inputChannels>9)throw new Error(`Native OIDN expects 3, 6, or 9 input channels, got ${t.inputChannels}`);this._model={spec:t.spec,inputChannels:t.inputChannels,outputChannels:t.outputChannels,channelsByValue:new Map(t.channelsByValue),convChannels:new Map(t.convChannels)};for(let o of Pn(this._model,{fuseConvPool:!1}).nodes)if(o.op!=="conv2d"&&o.op!=="maxPool2d"&&o.op!=="fusedConvReluMaxPool2d"&&o.op!=="fusedUpsampleConcatConv2d")throw new Error(`Native OIDN descriptor ${t.spec.id} leaves unsupported ${o.op} node ${o.id} after graph optimization`);try{for(let[o,n]of t.convTensors){let a=Zm(e,o,n,this.precision);this._resources.track("gpu-buffer",a.weights),this._resources.track("gpu-buffer",a.bias),this._packedConvs.set(o,a)}}catch(o){for(let n of this._packedConvs.values())this._releaseBuffer(n.weights),this._releaseBuffer(n.bias);throw this._packedConvs.clear(),o}}_pipeline(e,t){let r=this._pipelineCache.get(e);return r||(r=this._device.createComputePipeline({label:`oidn/${e}`,layout:"auto",compute:{module:this._device.createShaderModule({label:`oidn/${e}`,code:t}),entryPoint:"main"}}),this._pipelineCache.set(e,r)),r}_pipelineAsync(e,t){let r=this._pipelineCache.get(e);if(r)return Promise.resolve(r);let i=this._pipelinePromises.get(e);if(i)return i;let o=this._device.createComputePipelineAsync({label:`oidn/${e}`,layout:"auto",compute:{module:this._device.createShaderModule({label:`oidn/${e}`,code:t}),entryPoint:"main"}}).then(n=>(this._pipelineCache.set(e,n),this._pipelinePromises.delete(e),n),n=>{throw this._pipelinePromises.delete(e),n});return this._pipelinePromises.set(e,o),o}_nodePipelineSpec(e,t){if(e.op==="conv2d"){let r=t?"fp32":this.precision,i=ge(this._model.convChannels.get(e.id).inputChannels),o=ge(this._model.convChannels.get(e.id).outputChannels),n=this._selectConvKernel(i,t);return{key:`conv-${n}/${this.precision}/${r}/${e.activation}/in${i}/out${o}`,kernel:n,code:n==="implicit-gemm"?ig(this.precision,r,e.activation,i,o):n==="spatial"?rg(this.precision,r,e.activation,i,o):n==="subgroup"?tg(this.precision,r,e.activation,i,o):eg(this.precision,r,e.activation,i,o)}}if(e.op==="maxPool2d"){let r=ge(this._model.channelsByValue.get(e.id));return{key:`max-pool/${this.precision}/out${r}`,kernel:"direct",code:og(this.precision,r)}}if(e.op==="fusedConvReluMaxPool2d"){let r=ge(this._model.convChannels.get(e.conv.id).inputChannels),i=ge(this._model.convChannels.get(e.conv.id).outputChannels);return{key:`conv-pool/${this.precision}/${e.conv.activation}/in${r}/out${i}`,kernel:"direct",code:ng(this.precision,e.conv.activation,r,i)}}if(e.op==="fusedUpsampleConcatConv2d"){if(e.inputs.length!==2)throw new Error(`Native fused decoder ${e.id} requires two inputs`);let r=e.inputs.map(c=>ge(this._model.channelsByValue.get(c.value))),i=e.inputs.findIndex(c=>c.upsample);if(i!==0&&i!==1)throw new Error(`Native fused decoder ${e.id} has no upsample input`);let o=r[0]+r[1],n=this._selectConvKernel(o,!1),a=n==="subgroup"?"direct":n,l=ge(this._model.convChannels.get(e.conv.id).outputChannels);return{key:`decoder-${a}/${this.precision}/${e.conv.activation}/${r.join("+")}/out${l}/up${i}`,kernel:a,code:a==="implicit-gemm"?sg(this.precision,e.conv.activation,r,i,l):a==="spatial"?lg(this.precision,e.conv.activation,r,i,l):ag(this.precision,e.conv.activation,r,i,l)}}throw new Error(`Native OIDN does not implement unfused ${e.op} node ${e.id}`)}_selectConvKernel(e,t){let r=this.precision==="fp16"&&e<=this.maxSpatialInputBlocks;return this.kernelSetting==="direct"?"direct":this.kernelSetting==="spatial"?r?"spatial":"direct":this.kernelSetting==="implicit-gemm"?t?"direct":"implicit-gemm":this.kernelSetting==="subgroup"?this.subgroupsAvailable?"subgroup":"direct":this.precision==="fp32"&&!t?"implicit-gemm":"direct"}_nodePipeline(e,t){let{key:r,code:i}=this._nodePipelineSpec(e,t);return this._pipeline(r,i)}async prepare(){if(this._disposed)throw new Error("Native OIDN executor is disposed");let e=Pn(this._model,{fuseConvPool:!1}),t=this._model.inputChannels/3,r=[{key:`pack/${this.precision}/${t}`,code:Vd(this.precision,t)},...e.nodes.map(i=>this._nodePipelineSpec(i,i.id===e.spec.output))];await Promise.all(r.map(({key:i,code:o})=>this._pipelineAsync(i,o)))}_createExecution(e,t){let r=Xl(this._model,e,t,{fuseConvPool:!1}),i=new Map,o=[],n=new Map;r.nodes.forEach((f,c)=>{for(let u of cg(f))n.set(u,c)}),n.set(r.spec.output,r.nodes.length);let a=[],l=f=>(a.push(f),this._resources.track("gpu-buffer",f));try{let f=(m,v,y,w)=>{for(let I of o)I.activeValue&&(n.get(I.activeValue)??-1)<w&&(I.activeValue=void 0);let S=Xm(v,y),T=o.filter(I=>!I.activeValue&&I.capacity>=S).sort((I,A)=>I.capacity-A.capacity)[0];T||(T={buffer:l(this._device.createBuffer({label:`oidn/activation/${e}x${t}/${o.length}`,size:Zl(S,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),capacity:S},o.push(T)),T.activeValue=m,i.set(m,T.buffer)};f(r.spec.input,r.inputShape,this.precision==="fp16"?2:4,-1),r.plannedNodes.forEach(({node:m,outputShape:v},y)=>{let w=m.id===r.spec.output;f(m.id,v,w||this.precision==="fp32"?4:2,y)});let c=this._model.inputChannels/3,u=`pack/${this.precision}/${c}`,p=this._pipeline(u,Vd(this.precision,c)),d=[],h=[],g=[],x=[];r.plannedNodes.forEach(({node:m,outputShape:v},y)=>{let w=m.id===r.spec.output,S=this._nodePipelineSpec(m,w),T=this._pipeline(S.key,S.code);d.push(T),h.push(S.kernel??"direct");let I=i.get(m.id),A,_,B;if(m.op==="conv2d"){let R=r.valueShapes.get(m.input);B=m.id,_=[R.width,R.height,v.width,v.height,ge(R.channels),ge(v.channels)];let D=this._packedConvs.get(B);A=[{binding:0,resource:{buffer:i.get(m.input)}},{binding:1,resource:{buffer:D.weights}},{binding:2,resource:{buffer:D.bias}},{binding:3,resource:{buffer:I}}]}else if(m.op==="maxPool2d"){let R=r.valueShapes.get(m.input);_=[R.width,R.height,v.width,v.height,ge(v.channels)],A=[{binding:0,resource:{buffer:i.get(m.input)}},{binding:1,resource:{buffer:I}}]}else if(m.op==="fusedConvReluMaxPool2d"){let R=r.valueShapes.get(m.input);B=m.conv.id,_=[R.width,R.height,v.width,v.height,ge(R.channels),ge(v.channels)];let D=this._packedConvs.get(B);A=[{binding:0,resource:{buffer:i.get(m.input)}},{binding:1,resource:{buffer:D.weights}},{binding:2,resource:{buffer:D.bias}},{binding:3,resource:{buffer:I}}]}else if(m.op==="fusedUpsampleConcatConv2d"){B=m.conv.id;let R=r.valueShapes.get(m.inputs[0].value),D=r.valueShapes.get(m.inputs[1].value);_=[v.width,v.height,ge(v.channels),ge(this._model.convChannels.get(B).inputChannels),R.width,R.height,D.width,D.height];let M=this._packedConvs.get(B);A=[{binding:0,resource:{buffer:i.get(m.inputs[0].value)}},{binding:1,resource:{buffer:i.get(m.inputs[1].value)}},{binding:2,resource:{buffer:M.weights}},{binding:3,resource:{buffer:M.bias}},{binding:4,resource:{buffer:I}}]}else throw new Error(`Unexpected native node ${m.op}`);let P=l(Ud(this._device,`oidn/${m.id}/params/${e}x${t}`,_));x.push(P),A.push({binding:A.length,resource:{buffer:P}}),g.push(this._device.createBindGroup({label:`oidn/${m.id}/bindings`,layout:T.getBindGroupLayout(0),entries:A}))});let b=l(Ud(this._device,`oidn/input/params/${e}x${t}`,[e,t,ge(this._model.inputChannels),this._model.inputChannels]));return x.push(b),{plan:r,valueBuffers:i,slots:o,nodeBindings:g,nodePipelines:d,nodeKernels:h,inputPipeline:p,inputUniform:b,ownedBuffers:x,lastUsed:++this._clock}}catch(f){for(let c of a)this._releaseBuffer(c);throw f}}_execution(e,t){if(this._disposed)throw new Error("Native OIDN executor is disposed");let r=`${e}x${t}`,i=this._executionCache.get(r);if(!i&&(i=this._createExecution(e,t),this._executionCache.set(r,i),this._executionCache.size>this._shapeCacheSize)){let o=[...this._executionCache.entries()].filter(([n])=>n!==r).sort((n,a)=>n[1].lastUsed-a[1].lastUsed)[0];o&&(this._executionCache.delete(o[0]),this._retiredExecutions.add(o[1]),this._device.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{this._retiredExecutions.delete(o[1]),this._destroyExecution(o[1])}))}return i.lastUsed=++this._clock,i}profileNextExecution(){return this._device.features.has("timestamp-query")?(this._profileNextExecution=!0,!0):!1}getLastExecutionProfile(){return this._lastExecutionProfile}execute(e,t,r){let i=this._model.inputChannels/3;if(e.length!==i)throw new Error(`Native OIDN expected ${i} input buffers, got ${e.length}`);let o=this._execution(t,r),n=["input-pack",...o.plan.nodes.map(h=>h.id)],a=this._profileNextExecution&&this._device.features.has("timestamp-query");this._profileNextExecution=!1;let l=n.length*2,f=a?this._resources.track("gpu-query-set",this._device.createQuerySet({type:"timestamp",count:l})):void 0,c=l*8,u,p;try{u=a?this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/profile/resolve/${t}x${r}`,size:c,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC})):void 0,p=a?this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/profile/readback/${t}x${r}`,size:c,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})):void 0}catch(h){throw this._releaseBuffer(p),this._releaseBuffer(u),this._releaseQuerySet(f),h}let d=(h,g)=>({label:h,...f?{timestampWrites:{querySet:f,beginningOfPassWriteIndex:g*2,endOfPassWriteIndex:g*2+1}}:{}});try{let h=this._device.createCommandEncoder({label:`oidn/native/${t}x${r}`}),g=e.map((b,m)=>({binding:m,resource:{buffer:b}}));g.push({binding:i,resource:{buffer:o.valueBuffers.get(o.plan.spec.input)}}),g.push({binding:i+1,resource:{buffer:o.inputUniform}});let x=this._device.createBindGroup({label:"oidn/input/bindings",layout:o.inputPipeline.getBindGroupLayout(0),entries:g});{let b=h.beginComputePass(d("oidn/input-pack",0));b.setPipeline(o.inputPipeline),b.setBindGroup(0,x),b.dispatchWorkgroups(Math.ceil(t/Pe),Math.ceil(r/Pe),ge(this._model.inputChannels)),b.end()}o.plan.plannedNodes.forEach(({node:b,outputShape:m},v)=>{let y=h.beginComputePass(d(`oidn/${o.plan.nodes[v].id}`,v+1));y.setPipeline(o.nodePipelines[v]),y.setBindGroup(0,o.nodeBindings[v]),o.nodeKernels[v]==="implicit-gemm"?y.dispatchWorkgroups(Math.ceil(m.width*m.height/Er),Math.ceil(ge(m.channels)/je),1):y.dispatchWorkgroups(Math.ceil(m.width/Pe),Math.ceil(m.height/Pe),ge(m.channels)),y.end()}),f&&(h.resolveQuerySet(f,0,l,u,0),h.copyBufferToBuffer(u,0,p,0,c)),this._device.queue.submit([h.finish()])}catch(h){throw this._releaseBuffer(p),this._releaseBuffer(u),this._releaseQuerySet(f),h}return f&&(this._profileOperations++,this._lastExecutionProfile=(async()=>{try{await p.mapAsync(GPUMapMode.READ);let h=new BigUint64Array(p.getMappedRange()),g=n.map((x,b)=>({id:x,durationMs:Number(h[b*2+1]-h[b*2])/1e6}));return{totalMs:g.reduce((x,b)=>x+b.durationMs,0),layers:g}}finally{p.mapState==="mapped"&&p.unmap(),this._releaseQuerySet(f),this._releaseBuffer(u),this._releaseBuffer(p),this._profileOperations--}})()),o.valueBuffers.get(o.plan.spec.output)}async executeCPU(e,t,r){let i=t*r*this._model.inputChannels;if(e.length!==i)throw new Error(`Native OIDN CPU input has ${e.length} values, expected ${i}`);let o=this._execution(t,r),n=this._model.inputChannels/3,a=t*r;o.cpuInputBuffers||(o.cpuInputBuffers=Array.from({length:n},(p,d)=>{let h=this._device.createBuffer({label:`oidn/cpu-input/${t}x${r}/${d}`,size:a*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return this._resources.track("gpu-buffer",h),o.ownedBuffers.push(h),h}),o.cpuReadbackBuffer=this._device.createBuffer({label:`oidn/cpu-readback/${t}x${r}`,size:a*16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this._resources.track("gpu-buffer",o.cpuReadbackBuffer),o.ownedBuffers.push(o.cpuReadbackBuffer));for(let p=0;p<n;p++){let d=new Float32Array(a*4);for(let h=0;h<a;h++){let g=h*this._model.inputChannels+p*3,x=h*4;d[x]=e[g],d[x+1]=e[g+1],d[x+2]=e[g+2]}this._device.queue.writeBuffer(o.cpuInputBuffers[p],0,d)}let l=this.execute(o.cpuInputBuffers,t,r),f=this._device.createCommandEncoder({label:`oidn/cpu-readback/${t}x${r}`});f.copyBufferToBuffer(l,0,o.cpuReadbackBuffer,0,a*16),this._device.queue.submit([f.finish()]),await o.cpuReadbackBuffer.mapAsync(GPUMapMode.READ);let c=new Float32Array(o.cpuReadbackBuffer.getMappedRange()),u=new Float32Array(a*3);for(let p=0;p<a;p++)u[p*3]=c[p*4],u[p*3+1]=c[p*4+1],u[p*3+2]=c[p*4+2];return o.cpuReadbackBuffer.unmap(),u}_releaseBuffer(e){this._resources.release("gpu-buffer",e,()=>e.destroy())}_releaseQuerySet(e){this._resources.release("gpu-query-set",e,()=>e.destroy())}_destroyExecution(e){e.slots.forEach(t=>this._releaseBuffer(t.buffer)),e.ownedBuffers.forEach(t=>this._releaseBuffer(t))}getResourceInfo(){return this._resources.snapshot(this._retiredExecutions.size+this._profileOperations)}dispose(){if(!this._disposed){this._disposed=!0;for(let e of this._packedConvs.values())this._releaseBuffer(e.weights),this._releaseBuffer(e.bias);this._packedConvs.clear();for(let e of this._executionCache.values())this._destroyExecution(e);this._executionCache.clear();for(let e of this._retiredExecutions)this._destroyExecution(e);this._retiredExecutions.clear()}}};var qd=new WeakMap;function ug(s,e){let t=qd.get(s);t||(t=new Map,qd.set(s,t));let r=t.get(e);if(!r){let i=s.createShaderModule({label:`oidn/webnn/input-pack/${e}`,code:dg(e)}),o=s.createShaderModule({label:"oidn/webnn/output-unpack",code:hg()});r={input:s.createComputePipeline({label:`oidn/webnn/input-pack/${e}`,layout:"auto",compute:{module:i,entryPoint:"main"}}),output:s.createComputePipeline({label:"oidn/webnn/output-unpack",layout:"auto",compute:{module:o,entryPoint:"main"}})},t.set(e,r)}return r}var ur=8;function Yd(s,e){return Math.ceil(s/e)*e}function fg(s,e,t,r){let i=s.createBuffer({label:e,size:Yd(t.byteLength,4),usage:r,mappedAtCreation:!0});return new Uint8Array(i.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),i.unmap(),i}function jd(s,e,t){let r=new Uint32Array(Yd(t.length,4));return r.set(t),fg(s,e,r,GPUBufferUsage.UNIFORM)}function Jl(s,e,t,r){return!!s?.[e]?.[t]?.dataTypes?.includes?.(r)}function pg(s,e){if(e==="fp16"&&s.desc.dataType==="Float16")return new Uint8Array(s.data.buffer,s.data.byteOffset,s.data.byteLength);if(e==="fp32"&&s.desc.dataType==="Float32")return new Uint8Array(s.data.buffer,s.data.byteOffset,s.data.byteLength);let t=s.desc.dataType==="Float32"?new Float32Array(s.data.buffer,s.data.byteOffset,s.data.byteLength/4):new Ne(s.data.buffer,s.data.byteOffset,s.data.byteLength/2),r=e==="fp16"?new Ne(t):new Float32Array(t);return new Uint8Array(r.buffer,r.byteOffset,r.byteLength)}function dg(s){let e=Array.from({length:s},(r,i)=>`@group(0) @binding(${i}) var<storage, read> input${i}: array<vec4<f32>>;`).join(`
`),t=Array.from({length:s},(r,i)=>{let o=i*3;return`if (channel < ${o+3}u) {
      return input${i}[pixel][channel - ${o}u];
    }`}).join(`
  `);return`enable f16;
struct Params { width: u32, height: u32, channels: u32, padding: u32 }
${e}
@group(0) @binding(${s}) var<storage, read_write> outputData: array<f16>;
@group(0) @binding(${s+1}) var<uniform> params: Params;

fn readChannel(pixel: u32, channel: u32) -> f32 {
  ${t}
  return 0.0;
}

@compute @workgroup_size(${ur}, ${ur}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height || gid.z >= params.channels) {
    return;
  }
  let pixel = gid.y * params.width + gid.x;
  let outputIndex = (gid.z * params.height + gid.y) * params.width + gid.x;
  outputData[outputIndex] = f16(readChannel(pixel, gid.z));
}
`}function hg(){return`enable f16;
struct Params { width: u32, height: u32, padding0: u32, padding1: u32 }
@group(0) @binding(0) var<storage, read> inputData: array<f16>;
@group(0) @binding(1) var<storage, read_write> outputData: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(${ur}, ${ur}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let pixel = gid.y * params.width + gid.x;
  let plane = params.width * params.height;
  outputData[pixel] = vec4<f32>(
    f32(inputData[pixel]),
    f32(inputData[plane + pixel]),
    f32(inputData[plane * 2u + pixel]),
    0.0
  );
}
`}function mg(s,e){if(e==="fp32")throw new Error("OIDN WebNN GPU interop currently requires FP16 exportable tensors");if(!s.features.has("shader-f16"))throw new Error("OIDN WebNN requires shader-f16 on the shared GPUDevice");return"fp16"}function gg(s,e,t){return t==="relu"?s.relu(e):e}var $n=class{_device;_model;precision;support;_context;_builderConstructor;_shapeCache=new Map;_shapePromises=new Map;_retiredExecutions=new Set;_pendingCreationCount=0;_shapeCacheSize;_clock=0;_inputPipeline;_outputPipeline;_resources=new Li;_disposed=!1;constructor(e,t,r={}){this._device=e,this._model=t,this.precision=mg(e,r.precision??"auto"),this._shapeCacheSize=Math.max(1,r.shapeCacheSize??2),this.support={available:!1,fp16Conv:!1,gpuInterop:!1};let i=ug(e,t.inputChannels/3);this._inputPipeline=i.input,this._outputPipeline=i.output}async prepare(){if(this._disposed)throw new Error("OIDN WebNN executor is disposed");let e=globalThis.navigator?.ml,t=globalThis.MLGraphBuilder;if(!e?.createContext||typeof t!="function")throw this.support.reason="WebNN is not exposed by this browser",new Error(this.support.reason);this._builderConstructor=t;try{try{this._context=await e.createContext({deviceType:"gpu",powerPreference:"high-performance"})}catch{this._context=await e.createContext({deviceType:"gpu"})}if(this._resources.track("ml-context",this._context),this._disposed)throw new Error("OIDN WebNN executor is disposed");if(typeof this._context.createExportableTensor!="function"||typeof this._context.exportToGPU!="function")throw this.support.reason="WebNN WebGPU tensor interop is unavailable",new Error(this.support.reason);let r=this._context.opSupportLimits?.()??{};if(this.support.fp16Conv=Jl(r,"conv2d","input","float16")&&Jl(r,"conv2d","filter","float16")&&Jl(r,"conv2d","output","float16"),!this.support.fp16Conv)throw this.support.reason="WebNN does not support FP16 conv2d",new Error(this.support.reason);let i,o;try{i=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[4]},this._device)),o=this._resources.track("gpu-buffer",await this._context.exportToGPU(i)),this.support.gpuInterop=!0}catch(n){throw this.support.reason=`WebNN FP16 WebGPU interop failed: ${String(n)}`,new Error(this.support.reason)}finally{this._releaseBuffer(o),this._releaseTensor(i)}this.support.available=!0}catch(r){throw this._releaseContext(),r}}_constant(e,t){return e.constant({dataType:"float16",shape:[...t.desc.dims]},pg(t,this.precision))}async _createExecution(e,t){if(this._disposed)throw new Error("OIDN WebNN executor is disposed");let r=new this._builderConstructor(this._context),i=new Map,o=new Map;i.set(this._model.spec.input,r.input("input",{dataType:"float16",shape:[1,this._model.inputChannels,t,e]})),o.set(this._model.spec.input,[this._model.inputChannels,t,e]);for(let p of this._model.spec.nodes){let d,h;if(p.op==="conv2d"){let g=o.get(p.input),x=this._model.convTensors.get(p.id),b=r.conv2d(i.get(p.input),this._constant(r,x.weight),{bias:this._constant(r,x.bias),padding:[1,1,1,1],inputLayout:"nchw",filterLayout:"oihw"});d=gg(r,b,p.activation),h=[x.outputChannels,g[1],g[2]]}else if(p.op==="maxPool2d"){let g=o.get(p.input);d=r.maxPool2d(i.get(p.input),{windowDimensions:[2,2],strides:[2,2],padding:[0,g[1]%2,0,g[2]%2],layout:"nchw"}),h=[g[0],Math.ceil(g[1]/2),Math.ceil(g[2]/2)]}else if(p.op==="upsample2d"){let g=o.get(p.input);d=r.resample2d(i.get(p.input),{mode:"nearest-neighbor",axes:[2,3],scales:[2,2]}),h=[g[0],g[1]*2,g[2]*2]}else{let g=p.inputs.map(x=>o.get(x));if(g.some(x=>x[1]!==g[0][1]||x[2]!==g[0][2]))throw new Error(`WebNN concat ${p.id} has mismatched spatial shapes`);d=r.concat(p.inputs.map(x=>i.get(x)),1),h=[g.reduce((x,b)=>x+b[0],0),g[0][1],g[0][2]]}i.set(p.id,d),o.set(p.id,h)}let n,a,l,f,c,u;try{return n=this._resources.track("ml-graph",await r.build({output:i.get(this._model.spec.output)})),a=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[1,this._model.inputChannels,t,e],writable:!0},this._device)),l=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[1,this._model.outputChannels,t,e],readable:!0},this._device)),f=this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/webnn/output/${e}x${t}`,size:e*t*4*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),c=this._resources.track("gpu-buffer",jd(this._device,`oidn/webnn/input/${e}x${t}`,[e,t,this._model.inputChannels])),u=this._resources.track("gpu-buffer",jd(this._device,`oidn/webnn/output/${e}x${t}`,[e,t])),{graph:n,inputTensor:a,outputTensor:l,outputBuffer:f,inputUniform:c,outputUniform:u,width:e,height:t,lastUsed:++this._clock}}catch(p){throw this._releaseBuffer(u),this._releaseBuffer(c),this._releaseBuffer(f),this._releaseTensor(l),this._releaseTensor(a),this._releaseGraph(n),p}}async _execution(e,t){let r=`${e}x${t}`,i=this._shapeCache.get(r);if(!i){let o=this._shapePromises.get(r);o||(o=(async()=>{this._pendingCreationCount++;try{return await this._createExecution(e,t)}finally{this._pendingCreationCount--}})(),this._shapePromises.set(r,o));try{if(i=await o,this._disposed)throw this._destroyExecution(i),new Error("OIDN WebNN executor is disposed");this._shapeCache.set(r,i)}finally{this._shapePromises.get(r)===o&&this._shapePromises.delete(r)}if(this._shapeCache.size>this._shapeCacheSize){let n=[...this._shapeCache.entries()].filter(([a])=>a!==r).sort((a,l)=>a[1].lastUsed-l[1].lastUsed)[0];n&&(this._shapeCache.delete(n[0]),this._retireExecution(n[1]))}}return i.lastUsed=++this._clock,i}async prewarm(e){for(let t of e)await this._execution(t.width,t.height)}async execute(e,t,r){let i=this._model.inputChannels/3;if(e.length!==i)throw new Error(`OIDN WebNN expected ${i} input buffers, got ${e.length}`);let o=await this._execution(t,r),n=this._resources.track("gpu-buffer",await this._context.exportToGPU(o.inputTensor));try{let l=e.map((p,d)=>({binding:d,resource:{buffer:p}}));l.push({binding:i,resource:{buffer:n}}),l.push({binding:i+1,resource:{buffer:o.inputUniform}});let f=this._device.createBindGroup({label:"oidn/webnn/input-bindings",layout:this._inputPipeline.getBindGroupLayout(0),entries:l}),c=this._device.createCommandEncoder({label:"oidn/webnn/input-pack"}),u=c.beginComputePass();u.setPipeline(this._inputPipeline),u.setBindGroup(0,f),u.dispatchWorkgroups(Math.ceil(t/ur),Math.ceil(r/ur),this._model.inputChannels),u.end(),this._device.queue.submit([c.finish()])}finally{this._releaseBuffer(n)}this._context.dispatch(o.graph,{input:o.inputTensor},{output:o.outputTensor});let a=this._resources.track("gpu-buffer",await this._context.exportToGPU(o.outputTensor));try{let l=this._device.createBindGroup({label:"oidn/webnn/output-bindings",layout:this._outputPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:o.outputBuffer}},{binding:2,resource:{buffer:o.outputUniform}}]}),f=this._device.createCommandEncoder({label:"oidn/webnn/output-unpack"}),c=f.beginComputePass();c.setPipeline(this._outputPipeline),c.setBindGroup(0,l),c.dispatchWorkgroups(Math.ceil(t/ur),Math.ceil(r/ur)),c.end(),this._device.queue.submit([f.finish()])}finally{this._releaseBuffer(a)}return o.outputBuffer}async executeCPU(e,t,r){let i=await this._execution(t,r),o=t*r,n=new Ne(o*this._model.inputChannels);for(let f=0;f<o;f++)for(let c=0;c<this._model.inputChannels;c++)n[c*o+f]=e[f*this._model.inputChannels+c];this._context.writeTensor(i.inputTensor,n),this._context.dispatch(i.graph,{input:i.inputTensor},{output:i.outputTensor});let a=new Ne(await this._context.readTensor(i.outputTensor)),l=new Float32Array(o*this._model.outputChannels);for(let f=0;f<o;f++)for(let c=0;c<this._model.outputChannels;c++)l[f*this._model.outputChannels+c]=a[c*o+f];return l}_destroyExecution(e){this._releaseGraph(e.graph),this._releaseTensor(e.inputTensor),this._releaseTensor(e.outputTensor),this._releaseBuffer(e.outputBuffer),this._releaseBuffer(e.inputUniform),this._releaseBuffer(e.outputUniform)}_retireExecution(e){this._retiredExecutions.add(e),this._device.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{this._retiredExecutions.delete(e),this._destroyExecution(e)})}_releaseBuffer(e){this._resources.release("gpu-buffer",e,()=>e.destroy())}_releaseTensor(e){this._resources.release("ml-tensor",e,()=>e.destroy())}_releaseGraph(e){this._resources.release("ml-graph",e,()=>e.destroy?.())}_releaseContext(){this._resources.release("ml-context",this._context,()=>this._context.destroy?.())}getResourceInfo(){return this._resources.snapshot(this._pendingCreationCount+this._retiredExecutions.size)}dispose(){if(!this._disposed){this._disposed=!0;for(let e of this._shapeCache.values())this._destroyExecution(e);this._shapeCache.clear();for(let e of this._retiredExecutions)this._destroyExecution(e);this._retiredExecutions.clear(),this._shapePromises.clear(),this._releaseContext()}}};function Xd(s,e){return Math.ceil(s/e)*e}function ta(s){return s.data instanceof GPUBuffer||s.data instanceof GPUTexture}var ec=class{_device;_tileWidth=0;_tileHeight=0;_tileOverlapX=0;_tileOverlapY=0;_aux;_hdr;_dataProcessGPU;_nativeExecutor;_webNNExecutor;_modelSpec;_inputChannels;_engine;_dynamicTileController;_lastExecution;constructor(e,t,r={}){this._aux=r.aux||!1,this._hdr=r.hdr||!1,this._engine=r.engine??"auto";let i=r.modelSpec??Es(e),o=Sl(e,i);this._modelSpec=o.spec,this._inputChannels=o.inputChannels;let n=this._aux?9:3;if(o.inputChannels!==n)throw new Error(`OIDN model expects ${o.inputChannels} input channels, but aux=${this._aux} provides ${n}`);this._dynamicTileController=new Ms(r.maxTileSize??512,r.dynamicTile),this._device=t.device,this._engine==="webnn"?this._webNNExecutor=new $n(this._device,o,{precision:r.precision}):this._nativeExecutor=new Bn(this._device,o,{precision:r.precision,kernel:r.kernel})}getDevice(){return this._device}async prepare(){if(this._webNNExecutor){await this._webNNExecutor.prepare();let e=Xd(this._modelSpec.receptiveField/2,16),t=[this._dynamicTileController.tileSize,this._dynamicTileController.minTileSize];await this._webNNExecutor.prewarm([...new Set(t)].map(r=>({width:r+2*e,height:r+2*e})));return}await this._nativeExecutor.prepare()}getRuntimeInfo(){return{configuredEngine:this._engine,gpuEngine:this._webNNExecutor?"webnn":"wgsl",precision:(this._webNNExecutor??this._nativeExecutor).precision,kernel:this._nativeExecutor?{configured:this._nativeExecutor.kernelSetting,maxSpatialInputBlocks:this._nativeExecutor.maxSpatialInputBlocks,subgroupsAvailable:this._nativeExecutor.subgroupsAvailable}:void 0,webnn:this._webNNExecutor?.support,resources:(this._webNNExecutor??this._nativeExecutor).getResourceInfo(),model:this._modelSpec.id,modelFamily:this._modelSpec.family,inputChannels:this._inputChannels,dynamicTile:{enabled:this._dynamicTileController.enabled,currentTileSize:this._dynamicTileController.tileSize,minTileSize:this._dynamicTileController.minTileSize,maxTileSize:this._dynamicTileController.maxTileSize,targetTileTimeMs:this._dynamicTileController.targetTileTimeMs},lastExecution:this._lastExecution}}profileNextExecution(){return this._nativeExecutor?.profileNextExecution()??!1}getLastExecutionProfile(){return this._nativeExecutor?.getLastExecutionProfile()}_updateModel(e,t){let r=this._dynamicTileController.tileSize,i=Tl(e,r),o=Tl(t,r),n=Xd(this._modelSpec.receptiveField/2,16),a=n,l=n;e<=r&&(a=0),t<=r&&(l=0);let f=Math.max(i,o),c=Math.max(a,l);i=f,o=f,a=c,l=c,(i!==this._tileWidth||o!==this._tileHeight||a!==this._tileOverlapX||l!==this._tileOverlapY)&&(this._tileWidth=i,this._tileHeight=o,this._tileOverlapX=a,this._tileOverlapY=l)}_getTileSizeWithOverlap(){return{width:this._tileWidth+2*this._tileOverlapX,height:this._tileHeight+2*this._tileOverlapY}}_processImageData(e,t,r,i){let o=e.data,n=o.length/4,a=this._aux?9:3,l=new Float32Array(n*a);if(t&&!r||r&&!t)throw new Error("Normal map and albedo map are both required");if(t&&r&&(t.width!==r.width||t.height!==r.height||e.width!==t.width||e.height!==t.height))throw new Error("Image size mismatch");let f=t?.data,c=r?.data;for(let u=0;u<o.length;u+=4){let p=u/4*a;for(let d=0;d<3;d++)i?l[p+d]=o[u+d]:l[p+d]=o[u+d]/255,f&&(l[p+d+3]=f[u+d]/255),c&&(l[p+d+6]=c[u+d]/255)}return l}_readTile(e,t,r,i){let o=new Float32Array(r.width*r.height*t);for(let n=0;n<r.height;n++)for(let a=0;a<r.width;a++){let l=((n+r.y)*i+(a+r.x))*t,f=(n*r.width+a)*t;for(let c=0;c<t;c++)o[f+c]=e[l+c]}return o}_writeTile(e,t,r,i,o,n){let{data:a,width:l}=e,f=r.x-t.x,c=r.y-t.y;for(let u=0;u<r.height;u++)for(let p=0;p<r.width;p++){let d=((u+c)*o+p+f)*3,h=((u+r.y)*l+(p+r.x))*4;for(let g=0;g<3;g++)n?a[h+g]=i[d+g]:a[h+g]=Math.min(Math.max(i[d+g]*255,0),255);e.data[h+3]=n?1:255}}async _executeTile(e,t,r,i,o,n,a,l,f){let c=this._aux?9:3,u=this._tileOverlapX,p=this._tileOverlapY,d=this._getTileSizeWithOverlap(),h={width:this._tileWidth,height:this._tileHeight},g=i>0?i*h.width-u:0,x=Math.min(g+d.width,n);g=Math.max(x-d.width,0);let b=o>0?o*h.height-p:0,m=Math.min(b+d.height,a);b=Math.max(m-d.height,0);let v=d.width,y=d.height,w=new Ii(g,b,v,y),S,T,I=1,A=this._device,_=this._dataProcessGPU;if(e instanceof Float32Array){let M=this._readTile(e,c,w,n);l&&(I=Ap({data:M,channels:c}),M=Bp({data:M,channels:c,inputScale:I})),T=await(this._webNNExecutor??this._nativeExecutor).executeCPU(M,v,y)}else{_||(_=this._dataProcessGPU=new Fs(A,l)),_.setImageSize(n,a),_.setInputTile(w),i===0&&o===0&&_.copyInputDataToOutput(e.color);let{color:M,albedo:W,normal:E}=_.forward(e.color,this._aux?e.albedo:void 0,this._aux?e.normal:void 0,f);S=await(this._webNNExecutor??this._nativeExecutor).execute(this._aux?[M,W,E]:[M],v,y)}let B,P=Math.min(h.width,n),R=Math.min(h.height,a),D=new Ii(i*P,o*R,P,R);if(D.width=Math.min(D.width,n-D.x),D.height=Math.min(D.height,a-D.y),e instanceof Float32Array){l&&(T=Rp({data:T,channels:3,inputScale:I})),this._writeTile(r,w,D,T,d.width,l);for(let M=0;M<R;M++)for(let W=0;W<P;W++){let E=(M*P+W)*4,Ye=((M+D.y)*n+(W+D.x))*4;for(let Oe=0;Oe<4;Oe++)t.data[E+Oe]=r.data[Ye+Oe]}}else _.setOutputTile(D,w),B=_.inverse(S,e.color);return B}tileExecute({color:e,albedo:t,normal:r,done:i,progress:o,denoiseAlpha:n}){if(this._aux&&(!t||!r))throw new Error("Normal map and albedo map are both required");if(!this._aux&&(t||r))throw new Error("Normal map and albedo map are not required");let a=e.width,l=e.height,f=this._dynamicTileController.tileSize,c=a>f||l>f;this._updateModel(a,l);let u=this._hdr||!1,p;ta(e)||(p=this._processImageData(e,t,r,u));let d=this._tileWidth,h=this._tileHeight,g=Math.ceil(l/h),x=Math.ceil(a/d);function b(_,B){return u?{data:new Float32Array(_*B*4),width:_,height:B}:new ImageData(_,B)}let m=ta(e)?void 0:b(a,l),v=ta(e)?void 0:b(Math.min(d,a),Math.min(h,l)),y=!1,w=()=>typeof performance>"u"?Date.now():performance.now(),S=w(),T=[],I=_=>{typeof requestAnimationFrame>"u"?setTimeout(_,0):requestAnimationFrame(_)},A=async(_,B)=>{if(y)return;let P=w(),R=await this._executeTile(ta(e)?{color:e.data,albedo:t?.data,normal:r?.data}:p,v,m,_,B,a,l,u,n);if(y)return;let D=m||{data:R,width:a,height:l};o?.(D,v,new Ii(_*d,B*h,d,h),_+B*x,x*g);let M=_+1<x||B+1<g,W=()=>{if(T.push(w()-P),!y)if(M)I(()=>{y||(_+1<x?A(_+1,B):B+1<g&&A(0,B+1))});else{let E=[...T].sort((gt,Rt)=>gt-Rt),Ye=Math.floor(E.length/2),Oe=E.length%2?E[Ye]:(E[Ye-1]+E[Ye])/2;this._lastExecution={width:a,height:l,tileWidth:d,tileHeight:h,tileCount:x*g,durationMs:w()-S,tileTimeMs:{min:E[0],median:Oe,mean:E.reduce((gt,Rt)=>gt+Rt,0)/E.length,max:E[E.length-1]}},c&&this._dynamicTileController.observe(T),i(D)}};$p(this._device.queue).then(W)};return A(0,0),()=>{y=!0}}dispose(){this._dataProcessGPU?.dispose(),this._nativeExecutor?.dispose(),this._webNNExecutor?.dispose()}},Qd=ec;async function Zd(){if(!navigator.gpu)throw new Error("WebGPU is not available");let s={powerPreference:"high-performance"},e=await navigator.gpu.requestAdapter(s);if(!e)throw new Error("No WebGPU adapter is available");let t={},r=[];e.features.has("timestamp-query")&&r.push("timestamp-query"),e.features.has("bgra8unorm-storage")&&r.push("bgra8unorm-storage"),e.features.has("shader-f16")&&r.push("shader-f16"),t.requiredFeatures=r;let i=e.limits;t.requiredLimits={maxComputeWorkgroupStorageSize:i.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:i.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:i.maxStorageBufferBindingSize,maxBufferSize:i.maxBufferSize,maxComputeWorkgroupSizeX:i.maxComputeWorkgroupSizeX,maxComputeInvocationsPerWorkgroup:i.maxComputeInvocationsPerWorkgroup};let o=await e.requestDevice(t),n=e.info??await e.requestAdapterInfo?.();return tc(o,n)}async function tc(s,e){return{device:s,adapterInfo:e}}async function xg(s,e,t){let r=await(e?tc(e.device,e.adapterInfo):Zd()),i=yp(s),o=new Qd(i,r,t);return await o.prepare(),o}async function Jd(s,e,t){return fetch(s).then(r=>r.arrayBuffer()).then(r=>xg(r,e,t))}var rc=class extends Rs{_copyOutputToTexture(e,t,r){super._copyOutputToTexture(e,t,r),this._rawTexture&&(this._rawTexture.label=`tower-denoised-${t}x${r}`)}_renderAuxiliaryBuffers(e,t){let r=new Map,i=new Map;this.scene.traverse(o=>{let n=o.material?Array.isArray(o.material)?o.material:[o.material]:[];n.length&&n.every(a=>(r.get(a)??a.transmission)>.9&&a.thickness===0)&&(i.set(o,o.visible),o.visible=!1);for(let a of n)a.transmission>0&&!r.has(a)&&(r.set(a,a.transmission),a.transmission=0,a.needsUpdate=!0)});try{return super._renderAuxiliaryBuffers(e,t)}finally{for(let[o,n]of r)o.transmission=n,o.needsUpdate=!0;for(let[o,n]of i)o.visible=n}}};function SI(s,e,t,r){let i=new Bs(s);return i.maxBounces=8,i.maxTransparentBounces=12,i.frameBudget=15e4,i.lowResScale=.25,i.renderDelay=0,i.maxSamples=r?32:64,i.renderScale=r?.8:1,i.setScene(e,t),i.setDenoiser(new rc({initUNetFromURL:Jd,auxWeightsUrl:r?"360/assets/rt_hdr_alb_nrm_small.tza":"360/assets/rt_hdr_alb_nrm.tza",maxTileSize:256})),i}export{SI as createTracer};
