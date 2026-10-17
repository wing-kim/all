/* Cafe fit-out study: furniture/finishes only; the original plan owns all structure. */
window.dressTowerCafe=async function(C,root,timber){
 const T=C.THREE,L=C.levels().find(l=>l.kind==='ground');if(!L)return;
 const floor=C.floorTop(L),ceiling=C.ceilOf(L),group=new T.Group();group.name='1F cafe illustrative fit-out';root.add(group);
 const mat=(name,color,roughness=.55,metalness=0)=>{const m=new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness,metalness,side:T.DoubleSide});m.name=name;return m};
 const oak=timber.clone();oak.name='Cafe oak veneer';oak.color.set('#d1b08a').convertSRGBToLinear();oak.roughness=.4;
 const leather=mat('Cognac leather','#9c6240',.58),linen=mat('Oatmeal upholstery','#d4c8b4',.85),bronze=mat('Brushed bronze','#6d5035',.3,.7),dark=mat('Cafe dark bronze','#383029',.42,.6),cream=mat('Honed limestone','#ded3c1',.35),white=mat('Porcelain','#eee9df',.24),coffee=mat('Coffee','#25160e',.25);
 const glow=mat('Warm fixture diffuser','#fff2d8',.4);glow.emissive.set('#ffd5a0');glow.emissiveIntensity=3;
 const unit=new T.BoxGeometry(1,1,1),rodGeo=new T.CylinderGeometry(1,1,1,32);
 function mesh(g,m,x,y,z,parent=group){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 function box(m,x,y,z,w,h,d,parent=group){const o=mesh(unit,m,x,y,z,parent);o.scale.set(w,h,d);return o}
 function cylinder(m,x,y,z,r,h,parent=group){const o=mesh(rodGeo,m,x,y,z,parent);o.scale.set(r,h,r);return o}
 function rod(m,a,b,r,parent=group){const A=new T.Vector3(...a),B=new T.Vector3(...b),o=cylinder(m,...A.clone().add(B).multiplyScalar(.5).toArray(),r,A.distanceTo(B),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return o}
 function rounded(w,h,d,r=.035){const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3,steps:1,curveSegments:6});g.translate(0,0,-d/2);return g}
 const seatGeo=rounded(.46,.46,.065);seatGeo.rotateX(-Math.PI/2);
 // Curved upholstered back, four tapered wood legs and thin supporting rails.
 const leafMaterial=mat('Olive leaves','#657448',.8);
 const backGeo=new T.CylinderGeometry(.27,.27,.24,28,1,true,Math.PI*.58,Math.PI*.84);
 function chair(x,z,angle,high=false,upholstery=leather){const g=new T.Group();g.position.set(x,floor,z);g.rotation.y=angle;group.add(g);if(!high)g.userData.diningAnchor={x,z,y:floor,angle,floor:L.key,poly:L.poly};const sy=high?.77:.46;
  mesh(seatGeo,upholstery,0,sy,0,g);mesh(backGeo,upholstery,0,sy+.2,0,g).material=upholstery;
  for(const dx of [-1,1])for(const dz of [-1,1])rod(oak,[dx*.20,.035,dz*.21],[dx*.17,sy-.02,dz*.16],.027,g);
  for(const dx of [-1,1])rod(oak,[dx*.20,sy-.05,-.19],[dx*.20,sy+.27,-.23],.025,g);
  if(high)for(const dz of [-.21,.21])rod(bronze,[-.21,.27,dz],[.21,.27,dz],.013,g);
 }
 const inside=(x,z,margin=.8)=>[[-margin,-margin],[-margin,margin],[margin,-margin],[margin,margin]].every(([a,b])=>C.inPoly([(x+a)*41.6+914,(z+b)*41.6+770],L.poly));
 const blocked=(x,z,r=.7)=>(L.cols||[]).some(q=>{const p=C.P(q[0],q[1]);return Math.hypot(x-p[0],z-p[1])<r+.32})||(L.blocks||[]).some(b=>{const [x0,z0]=C.P(b.r[0],b.r[1]),[x1,z1]=C.P(b.r[2],b.r[3]);return x+r>x0&&x-r<x1&&z+r>z0&&z-r<z1});
 const keepouts=[],pendants=[];let tables=0;
 function cup(x,y,z){cylinder(white,x,y+.045,z,.037,.07);cylinder(coffee,x,y+.081,z,.031,.001);mesh(new T.TorusGeometry(.025,.006,6,12),white,x+.042,y+.048,z).rotation.y=Math.PI/2;}
 function vase(x,y,z){mesh(new T.LatheGeometry([new T.Vector2(.055,0),new T.Vector2(.085,.06),new T.Vector2(.07,.14),new T.Vector2(.025,.20)],16),cream,x,y,z);for(let i=0;i<4;i++){rod(bronze,[x,y+.16,z],[x+(i-1.5)*.045,y+.38+i*.025,z+.02],.003);const leaf=mesh(new T.SphereGeometry(1,8,5),leafMaterial,x+(i-1.5)*.045,y+.34+i*.025,z+.02);leaf.scale.set(.045,.014,.065);leaf.rotation.z=i;}}
 for(const [x,z] of [[-10,-8],[-10,-4],[-10,0],[-10,4],[-6,-4],[-6,0],[-6,4],[-6,7]]){
  if(!inside(x,z,1.25)||blocked(x,z,1.25))continue;
  cylinder(oak,x,floor+.76,z,.57,.05);cylinder(oak,x,floor+.39,z,.15,.70);cylinder(bronze,x,floor+.035,z,.33,.04);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;cylinder(oak,x+Math.cos(a)*.153,floor+.39,z+Math.sin(a)*.153,.009,.67);}
  chair(x-.85,z,Math.PI/2,false,tables%2?linen:leather);chair(x+.85,z,-Math.PI/2,false,leather);vase(x,floor+.8,z);cup(x+.25,floor+.79,z+.15);tables++;keepouts.push({x,z,r:.66});
 }
 // Communal oak table on the open cafe side; leave the core corridor clear.
 if(inside(-2.3,-2,1.8)&&!blocked(-2.3,-2,1.8)){box(oak,-2.3,floor+.76,-2,1.1,.07,3.4);for(const z of [-3.3,-.7])box(oak,-2.3,floor+.38,z,.7,.72,.12);for(const z of [-3.1,-2,-.9]){chair(-3.15,z,Math.PI/2,false,linen);chair(-1.45,z,-Math.PI/2,false,leather);}vase(-2.3,floor+.8,-2);keepouts.push({x:-2.3,z:-2,w:1.1,d:3.4});}
 // Long slatted counter remains on the cafe side of the original rear core.
 const cx=-4.4,cz=-9.2,cw=7.2,cd=1.05;
 if(inside(cx,cz,.7)&&!blocked(cx,cz,1)){
  box(oak,cx,floor+.50,cz,cw,.90,cd);box(dark,cx,floor+.07,cz,cw-.14,.14,cd-.14);
  for(let x=cx-cw/2+.03;x<cx+cw/2;x+=.075)box(oak,x,floor+.53,cz+cd/2+.015,.037,.84,.035);
  box(cream,cx,floor+1.015,cz,cw+.12,.13,cd+.10);
  box(glow,cx,floor+.935,cz+cd/2+.025,cw-.1,.016,.02);
  box(glow,cx,floor+.07,cz+cd/2-.04,cw-.2,.014,.025);
  for(let x=cx-cw/2+.6;x<cx+cw/2-.3;x+=1.0)chair(x,cz+1.0,Math.PI,true);
  // Espresso machine, group heads, drip tray, grinder and stacked cups.
  box(bronze,cx+1.8,floor+1.34,cz,.85,.48,.44);box(dark,cx+1.8,floor+1.15,cz+.30,.90,.035,.22);
  for(const dx of [-.24,0,.24]){cylinder(dark,cx+1.8+dx,floor+1.25,cz+.23,.055,.10);rod(dark,[cx+1.8+dx,floor+1.23,cz+.25],[cx+1.8+dx,floor+1.23,cz+.45],.014);cup(cx+1.8+dx,floor+1.16,cz+.3);}
  cylinder(dark,cx+.9,floor+1.28,cz,.13,.4);cylinder(bronze,cx+.9,floor+1.55,cz,.15,.19);
  for(let i=0;i<5;i++)cup(cx-.2+i*.14,floor+1.09,cz);
  keepouts.push({x:cx,z:cz,w:cw,d:cd});
  for(const x of [cx-2.4,cx,cx+2.4]){rod(dark,[x,ceiling-.03,cz],[x,3.1,cz],.008);cylinder(bronze,x,2.86,cz,.042,.5);cylinder(glow,x,2.604,cz,.032,.012);pendants.push([x,2.56,cz]);}
 }
 // Recessed trim/diffuser geometry; lights are added by the modern renderer.
 const fixtures=[];
 // 2026-10-18: 카페 동쪽(x 0～8 m)까지 다운라이트를 고르게 배치. 위치는 베이크 조명과 같은 목록을 쓴다.
 for(const x of [-10,-6,-2,2,6])for(const z of [-10,-6,-2,2,6,10])if(inside(x,z,.35)&&!blocked(x,z,.25)){
  cylinder(dark,x,ceiling-.016,z,.065,.025);cylinder(glow,x,ceiling-.031,z,.043,.007);fixtures.push([x,ceiling-.08,z]);
 }
 root.userData.cafe={floor,ceiling,tables,fixtures,pendants,keepouts,structuralSource:'original LEVELS; fit-out is illustrative'};
 // Reuse the licensed scanned indoor plants loaded by environment.js.
 // AI 실사 시안처럼 창가·기둥 주변에 화분을 더 둔다. 테이블·통로와 겹치는 후보는 건너뛴다.
 const nearKeepout=(x,z)=>keepouts.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+.75:Math.abs(x-o.x)<o.w/2+.75&&Math.abs(z-o.z)<o.d/2+.75);
 for(const [x,z] of [[-11.8,-11.7],[-11.8,5.7],[-3.9,6.2],[-12.2,-6],[-12.2,2],[-8,8.6],[-0.6,8.4],[1.2,-6.5],[1.2,1.5]])if(inside(x,z,.55)&&!blocked(x,z,.55)&&!nearKeepout(x,z)){
  cylinder(cream,x,floor+.28,z,.30,.54);root.userData.interiorPlantAnchors.push({x,y:floor+.48,z,height:1.55,floor:L.key,poly:L.poly});
 }
 C.cafeIsWalkable=(x,z)=>inside(x,z,.22)&&!blocked(x,z,.25)&&!keepouts.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+.22:Math.abs(x-o.x)<o.w/2+.22&&Math.abs(z-o.z)<o.d/2+.22);
 try{
  const meta=await fetch('360/assets/cafe-bake.json').then(r=>r.json());
  if(JSON.stringify(meta.layout)===JSON.stringify(keepouts)){
   const ao=await new T.TextureLoader().loadAsync('360/assets/cafe-contact-ao.png');ao.flipY=false;
   const stone=C.M.stone.clone();stone.aoMap=ao;stone.aoMapIntensity=1;stone.roughness=.42;stone.color.setRGB(.90,.97,1.1);stone.userData.cafeFloor=true;
   C.bld.updateMatrixWorld(true);const v=new T.Vector3();C.bld.traverse(o=>{if(!o.isMesh||o.material!==C.M.stone)return;const p=o.geometry.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv[i*2]=(v.x+14)/16;uv[i*2+1]=(v.z+14)/24;}o.geometry.setAttribute('uv2',new T.BufferAttribute(uv,2));o.material=stone;});
   root.userData.cafe.contactBake=true;
  }else root.userData.cafe.contactBake=false;
 }catch(error){root.userData.cafe.contactBake=false;console.warn('Cafe contact bake unavailable',error);}
 return group;
};
