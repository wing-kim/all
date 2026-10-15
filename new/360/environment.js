/* Appearance assets are illustrative surroundings, never surveyed building geometry. */
window.enhanceTowerEnvironment=async function(C,extra,load){
  const {THREE:T,RMAT,P,renderer}=C;
  const loader=new T.TextureLoader(),pendingTextures=[];
  function texture(name,repeat,color){let done;pendingTextures.push(new Promise(resolve=>{done=resolve}));const t=loader.load('360/assets/'+name,()=>done(true),undefined,error=>{console.warn('Environment texture unavailable',name,error);done(false)});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.setScalar(repeat);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.encoding=T.sRGBEncoding;return t}
  function surface(m,asset,repeat){m.map=texture(asset+'_color.jpg',repeat,true);m.normalMap=texture(asset+'_normal.jpg',repeat);m.normalScale.set(.3,.3);m.roughnessMap=texture(asset+'_rough.jpg',repeat);m.bumpMap=null;m.color.set(0xffffff);m.roughness=.95;m.needsUpdate=true}
  surface(RMAT.road,'asphalt_02',.2);surface(RMAT.ground,'asphalt_02',.2);RMAT.ground.color.set('#b4b8bb').convertSRGBToLinear();surface(RMAT.walk,'pavement_04',1/3.1);surface(RMAT.site,'pavement_04',1/3.1);
  // A shared linear albedo correction also survives conversion to the path tracer.
  // The previous WebGL-only shader left the precision pavement brown and much darker.
  [RMAT.walk,RMAT.site].forEach(m=>{m.color.setRGB(1.65,1.85,2.15)});
  const stone=new T.MeshStandardMaterial({color:0x8e8c86,roughness:.86,map:RMAT.walk.map,normalMap:RMAT.walk.normalMap,normalScale:new T.Vector2(.15,.15)});
  const iron=new T.MeshStandardMaterial({color:0x303332,metalness:.75,roughness:.63});
  const soil=new T.MeshStandardMaterial({color:0x3b3020,roughness:1,map:RMAT.road.map,normalMap:RMAT.road.normalMap,normalScale:new T.Vector2(.6,.6)});
  const cube=new T.BoxGeometry(1,1,1);
  const curbShape=new T.Shape();curbShape.moveTo(-.48,-.48);curbShape.lineTo(.48,-.48);curbShape.lineTo(.48,.48);curbShape.lineTo(-.48,.48);curbShape.closePath();
  const curbGeometry=new T.ExtrudeGeometry(curbShape,{depth:.96,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1,steps:1});curbGeometry.translate(0,0,-.48);
  function box(x,y,z,w,h,d,m){const o=new T.Mesh(m===stone?curbGeometry:cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;extra.add(o);return o}
  C.R3D.street.children.forEach(o=>{if(o.isInstancedMesh&&o.geometry.parameters?.height<=.05)o.visible=false});
  function walkStrip(x0,x1,offset){
    const road=x=>1365-.3604*(x-230),a=P(x0,road(x0)+offset),b=P(x1,road(x1)+offset),u=new T.Vector2(b[0]-a[0],b[1]-a[1]).normalize(),n=new T.Vector2(-u.y,u.x),length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const geo=new T.BoxGeometry(length,.16,1.8),m=new T.Mesh(geo,RMAT.walk);m.position.set((a[0]+b[0])/2+n.x*.94,.08,(a[1]+b[1])/2+n.y*.94);m.rotation.y=-Math.atan2(u.y,u.x);m.receiveShadow=true;m.updateMatrixWorld();const pos=geo.attributes.position,uv=geo.attributes.uv,v=new T.Vector3();for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);uv.setXY(i,v.x,v.z)}extra.add(m);
    for(let d=.5;d<length;d+=1.02){const o=box(a[0]+u.x*d,.13,a[1]+u.y*d,.99,.26,.24,stone);o.rotation.y=m.rotation.y;}
  }
  walkStrip(250,3300,266);
  // Continuous granite curb with visible joints at real metre scale.
  for(let z=-45;z<14;z+=1.02)box(-20.48,.13,z,.26,.26,.99,stone);
  const a=P(230,1365),b=P(1598,872),length=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  for(let d=.5;d<length;d+=1.02){const t=d/length,o=box(a[0]+(b[0]-a[0])*t,.13,a[1]+(b[1]-a[1])*t,.99,.26,.26,stone);o.rotation.y=angle}
  for(let z=-35;z<12;z+=12){box(-20.78,.025,z,.48,.045,.8,iron);for(let k=0;k<8;k++)box(-20.78,.052,z-.35+k*.1,.43,.015,.028,stone)}
  // Road maintenance details sit above asphalt but below lane paint (no coplanar decals).
  const repair=RMAT.road.clone();repair.color.setRGB(.73,.75,.76);repair.roughness=.98;
  const seal=new T.MeshStandardMaterial({color:0x292b2a,roughness:.9});
  C.scene.updateMatrixWorld(true);const roadMeshes=[];C.scene.traverse(o=>{if(o.isMesh&&o.material===RMAT.road)roadMeshes.push(o)});
  function roadPatch(px,py,width,depth,rotation=0){
    const [x,z]=P(px,py),ray=new T.Raycaster(new T.Vector3(x,5,z),new T.Vector3(0,-1,0)),hit=ray.intersectObjects(roadMeshes,false)[0],roadY=hit?.point.y??.02;
    const o=box(x,roadY+.001,z,width,.004,depth,repair);o.rotation.y=rotation;o.castShadow=false;o.name='Asphalt repair patch';o.userData.roadY=roadY;
    // Metre-scale UVs match the surrounding road; keep the patch 3 mm above it.
    o.geometry=cube.clone();o.updateMatrixWorld();const position=o.geometry.attributes.position,uv=o.geometry.attributes.uv,v=new T.Vector3();
    for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld);uv.setXY(i,v.x,v.z)}uv.needsUpdate=true;
    return o;
  }
  roadPatch(-300,-750,2.7,4.6);roadPatch(-800,450,2.1,3.4);roadPatch(2050,1365-.3604*(2050-230)+140,3.2,1.65,angle);
  const lidGeometry=new T.CylinderGeometry(.32,.32,.018,32),rimGeometry=new T.TorusGeometry(.345,.022,6,32);
  for(const [px,py] of [[-420,-100],[-420,870],[1400,1080],[2850,565]]){
    const [x,z]=P(px,py),lid=new T.Mesh(lidGeometry,iron);lid.position.set(x,.013,z);lid.receiveShadow=true;extra.add(lid);
    const rim=new T.Mesh(rimGeometry,seal);rim.rotation.x=Math.PI/2;rim.position.set(x,.012,z);extra.add(rim);
    for(let k=-2;k<=2;k++){const length=2*Math.sqrt(.27*.27-(k*.09)**2);box(x,.024,z+k*.09,length,.007,.018,seal).castShadow=false;}
  }
  // Give the existing context facades depth at their existing window texture grid.
  const contextGlasses=['#24343c','#485862','#809099','#4d5b63','#303c45','#77838a','#b0aaa0','#364f5b'].map((col,i)=>new T.MeshStandardMaterial({color:new T.Color(col).convertSRGBToLinear(),metalness:i===6?.05:.42,roughness:i===6?.65:.12+i*.025}));
  const unitMat=new T.MeshStandardMaterial({color:0xb5b6b0,metalness:.28,roughness:.58}),grilleMat=new T.MeshStandardMaterial({color:0x242a2b,roughness:.8});
  const plasterColor=texture('plaster_color.jpg',.25,true),plasterNormal=texture('plaster_normal.jpg',.25),plasterRough=texture('plaster_rough.jpg',.25);
  // Fine architectural finishes, with no change to the original member geometry.
  for(const key of ['core','corewall','col','slab']){const mat=C.M[key];if(!mat)continue;mat.normalMap=plasterNormal;mat.normalScale.set(key==='slab'?.035:.08,key==='slab'?.035:.08);mat.roughnessMap=plasterRough;mat.needsUpdate=true;}
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;
  const grainContext=grainCanvas.getContext('2d'),grainPixels=grainContext.createImageData(128,128);
  let grainSeed=7231;
  for(let x=0;x<128;x++){grainSeed=(Math.imul(grainSeed,1664525)+1013904223)>>>0;const line=190+grainSeed%55;
    for(let y=0;y<128;y++){const i=(y*128+x)*4,value=Math.min(255,line+Math.sin(y*.31+x)*5);grainPixels.data[i]=grainPixels.data[i+1]=grainPixels.data[i+2]=value;grainPixels.data[i+3]=255;}}
  grainContext.putImageData(grainPixels,0,0);const grain=new T.CanvasTexture(grainCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(2,8);grain.anisotropy=4;
  const facadeMetals=new Set();C.bld.traverse(o=>{for(const mat of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])if(mat.metalness>=.6&&!mat.transparent)facadeMetals.add(mat)});
  for(const mat of facadeMetals){mat.roughnessMap=grain;mat.roughness=.34;mat.userData.satinMetal=true;mat.needsUpdate=true;}
  // Appearance study: keep every mullion profile and opening in place, but use
  // a darker satin finish on the narrow vertical curtain-wall members only.
  const mullionFinishes=new Map();C.bld.updateMatrixWorld(true);
  C.bld.traverse(o=>{
    const m=o.material,g=o.geometry;if(!g||!m||Array.isArray(m)||m.metalness!==.85)return;
    g.computeBoundingBox();const dimensions=g.boundingBox.getSize(new T.Vector3());
    if(dimensions.y<=1||dimensions.x>=.35||dimensions.z>=.35||o.getWorldPosition(new T.Vector3()).y>=30.6)return;
    if(!mullionFinishes.has(m)){const finish=m.clone();finish.color.set('#66737a').convertSRGBToLinear();finish.metalness=.72;finish.roughness=.3;finish.userData.satinMetal=true;mullionFinishes.set(m,finish)}
    o.material=mullionFinishes.get(m);
  });
  const frameMat=new T.MeshStandardMaterial({color:0x464d50,metalness:.55,roughness:.4});
  const copingMat=new T.MeshStandardMaterial({color:0x999b96,metalness:.2,roughness:.7});
  const signMats=[0x293c42,0x4b514a,0x786851,0x3d485b].map(color=>new T.MeshStandardMaterial({color,roughness:.68}));
  const masses=[];C.scene.traverse(o=>{if(o.isMesh&&o.userData.box&&o.geometry.parameters?.shapes)masses.push(o)});
  masses.forEach(m=>{
    const shape=m.geometry.parameters.shapes,h=m.geometry.parameters.options.depth;
    if(h>55||h<5||m.userData.box.distanceToPoint(new T.Vector3(-3,0,0))>100)return;
    const kind=m.userData.contextKind,keepFacade=kind==='cw'||m.userData.customContextMaterial;
    const originalChildren=m.children.slice();
    const existingParapet=originalChildren.some(o=>o.isMesh&&o.geometry.parameters?.options?.depth===.95&&Math.abs(o.position.y-h)<.01);
    const roofEquipment=originalChildren.filter(o=>{const p=o.geometry?.parameters;return o.isMesh&&o.geometry.type==='BoxGeometry'&&o.position.y>=h&&p.width>=.8&&p.width<=4&&p.height>=.8&&p.height<=3&&p.depth>=.8&&p.depth<=4});
    const bounds=m.userData.box,facadeSeed=Math.abs(Math.round(bounds.min.x*17+bounds.min.z*31));
    const facadeTints=[[1.48,1.48,1.4],[1.62,1.67,1.68],[1.42,1.35,1.22],[1.58,1.55,1.45],[1.32,1.4,1.45],[1.55,1.47,1.34]];
    const facadeTint=({ribbon:[1.45,1.35,1.12],band:[1.62,1.64,1.6],grey:[1.45,1.46,1.42],wrib:[1.62,1.65,1.64],esm:[.82,.84,.87],tile:[1.65,1.65,1.59],apt:[1.60,1.62,1.60]})[kind]||facadeTints[facadeSeed%facadeTints.length];
    if(Array.isArray(m.material)){m.material=m.material.map((v,i)=>{if(i===0){const roof=v.clone();roof.color.setRGB(1.05,1.08,1.06);roof.map=plasterColor;roof.normalMap=plasterNormal;roof.normalScale?.set(.12,.12);roof.roughnessMap=plasterRough;roof.roughness=.94;return roof}const n=v.clone();if(keepFacade){if(kind==='cw'){n.roughness=.18;n.metalness=.35;}return n}n.map=plasterColor;n.normalMap=plasterNormal;n.normalScale.set(.18,.18);n.roughnessMap=plasterRough;n.color.setRGB(...facadeTint);n.roughness=.86;return n})}
    let apartment=false;for(let node=m;node;node=node.parent)if(node===C.contextBuildings?.current)apartment=true;
    const ribbon=!apartment&&['office','ribbon','band','wrib'].includes(kind),windowWidth=apartment?2.65:ribbon?2.98:kind==='esm'?1.1:kind==='tile'?1.6:2.14;
    const storey=m.userData.contextStoreyHeight||(apartment?2.9:3.4);
    m.userData.environmentDressing={kind,keptFacade:!!keepFacade,existingParapet,existingRoofEquipment:roofEquipment.length,storey,windowWidth};
    const pts=shape.getPoints().map(p=>new T.Vector2(p.x,-p.y));
    function detail(x,y,z,w,height,depth,material,rotation=0){const o=new T.Mesh(cube,material);o.position.set(x,y,z);o.scale.set(w,height,depth);o.rotation.y=rotation;o.castShadow=o.receiveShadow=true;m.add(o);return o}
    // Roof equipment and parapet caps add scale cues without changing the surveyed mass.
    const center=pts.reduce((sum,p)=>sum.add(p),new T.Vector2()).multiplyScalar(1/pts.length);
    if(!roofEquipment.length&&!existingParapet){
      detail(center.x,h+.42,center.y,2.6,.84,1.4,unitMat);
      detail(center.x,h+.87,center.y,2.35,.08,1.15,grilleMat);
      for(let k=0;k<5;k++)detail(center.x-.9+k*.45,h+.92,center.y,.04,.06,1.1,copingMat);
    }else for(const unit of roofEquipment){
      unit.geometry.computeBoundingBox();const b=unit.geometry.boundingBox,size=b.getSize(new T.Vector3()),top=unit.position.y+b.max.y;
      detail(unit.position.x,top+.025,unit.position.z,size.x*.72,.05,size.z*.7,grilleMat);
      for(let k=0;k<5;k++)detail(unit.position.x-size.x*.28+k*size.x*.14,top+.065,unit.position.z,.025,.03,size.z*.66,copingMat);
    }
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],len=a.distanceTo(b);if(len<2)continue;
      const u=new T.Vector2().subVectors(b,a).normalize(),angle=-Math.atan2(u.y,u.x);
      const midpoint=a.clone().add(b).multiplyScalar(.5),inward=new T.Vector2(-u.y,u.x);if(inward.dot(center.clone().sub(midpoint))<0)inward.multiplyScalar(-1);
      if(existingParapet)midpoint.addScaledVector(inward,.14);
      detail(midpoint.x,h+(existingParapet?1.01:.12),midpoint.y,len,existingParapet?.12:.24,.36,copingMat,angle);
      if(keepFacade)continue;
      // A subset of existing blocks uses ribbon glazing and projecting floor ledges.
      // The mass and storey height stay unchanged; this is illustrative facade dressing.
      if(ribbon)for(let floor=3.55;floor<h-.8;floor+=storey)detail((a.x+b.x)/2,floor,(a.y+b.y)/2,len,.12,.48,copingMat,angle);
      // Recessed storefront glazing, sign fascia and door mullions at pedestrian level.
      if(!apartment&&m.userData.contextShop!==false)for(let d=1.7;d<len-1.2;d+=3.5){
        const x=a.x+u.x*d,z=a.y+u.y*d;
        detail(x,1.55,z,2.85,2.65,.25,contextGlasses[(m.id+i)%5],angle);
        detail(x,3.08,z,3.05,.45,.42,signMats[(m.id+i)%4],angle);
        for(const dx of [-1.4,0,1.4])detail(x+u.x*dx,1.55,z+u.y*dx,.055,2.7,.3,frameMat,angle);
        detail(x,.23,z,3,.15,.42,copingMat,angle);
      }
      for(let y=apartment?.8:4.5;y<h-1.8;y+=storey)for(let d=1.5;d<len-.8;d+=3.2){
        const x=a.x+u.x*d,z=a.y+u.y*d;
        const o=new T.Mesh(cube,frameMat);o.position.set(x,y,z);o.rotation.y=angle;o.scale.set(windowWidth+.11,.09,.32);o.castShadow=o.receiveShadow=true;m.add(o);
        const variation=Math.abs(Math.floor(Math.sin(d*8.4+y*1.2+m.id)*9999))%8;const pane=new T.Mesh(cube,contextGlasses[variation]);pane.position.set(x,y+.82,z);pane.rotation.y=angle;pane.scale.set(windowWidth,1.58,.24);m.add(pane);
        if(variation===6){for(let k=0;k<9;k++){const slat=new T.Mesh(cube,frameMat);slat.position.set(x,y+.15+k*.16,z);slat.rotation.y=angle;slat.scale.set(windowWidth-.06,.018,.26);m.add(slat)}}
        if(variation===3&&y<14){const ac=new T.Mesh(cube,unitMat);ac.position.set(x+u.x*.6,y-.48,z+u.y*.6);ac.rotation.y=angle;ac.scale.set(.72,.45,.5);ac.castShadow=true;m.add(ac);const vent=ac.clone();vent.material=grilleMat;vent.scale.set(.52,.3,.515);m.add(vent)}
        const sill=o.clone();sill.position.y=y+1.65;sill.scale.y=.12;m.add(sill);
        for(const dx of [-windowWidth/2,0,windowWidth/2]){const bar=o.clone();bar.position.set(x+u.x*dx,y+.82,z+u.y*dx);bar.scale.set(.045,1.64,.32);m.add(bar)}
      }
    }
  });
  // Distant generic urban fabric: illustrative skyline, not claimed survey data.
  // Whole-facade atlases break the repeated identical-window tile at skyline scale.
  // These are deterministic illustrative elevations, not photographs of the site.
  function urbanFacade(columns,rows,tone,variant){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
    const g=canvas.getContext('2d'),cw=512/columns,ch=1024/rows;
    let seed=613+variant*419;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    g.fillStyle=tone;g.fillRect(0,0,512,1024);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const x=col*cw+cw*.19,y=row*ch+ch*.19,w=cw*.62,h=ch*.6;
      // Recess shadows and pale stone reveals stay subtle at distance.
      g.fillStyle='rgba(37,46,49,.22)';g.fillRect(x-2,y-2,w+4,h+4);
      const sky=g.createLinearGradient(0,y,0,y+h),v=Math.floor(random()*28);
      sky.addColorStop(0,`rgb(${79+v},${100+v},${111+v})`);sky.addColorStop(.52,`rgb(${50+v},${66+v},${73+v})`);sky.addColorStop(1,`rgb(${91+v},${104+v},${109+v})`);
      g.fillStyle=sky;g.fillRect(x,y,w,h);
      if(random()<.38){const blind=h*(.2+random()*.75);g.fillStyle=random()<.5?'#babbb5':'#d0cabb';g.fillRect(x,y,w,blind);g.fillStyle='rgba(72,70,62,.15)';for(let yy=y+4;yy<y+blind;yy+=5)g.fillRect(x,yy,w,1);}
      g.fillStyle='rgba(193,202,203,.75)';g.fillRect(x+w*.5,y,1.5,h);
      g.fillStyle='rgba(235,234,224,.75)';g.fillRect(x-2,y+h,w+4,2);
      const stain=g.createLinearGradient(0,y+h,0,y+h+ch*.2);stain.addColorStop(0,'rgba(72,66,54,.13)');stain.addColorStop(1,'rgba(72,66,54,0)');g.fillStyle=stain;g.fillRect(x,y+h+2,w,ch*.2);
    }
    const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return tex;
  }
  const types=[{h:10,columns:4,rows:3,tone:'#d8d5ca'},{h:23,columns:5,rows:7,tone:'#c8ccca',office:true},{h:42,columns:6,rows:13,tone:'#d3d8d6'},{h:14,columns:5,rows:4,tone:'#c9c2b5',brick:true},{h:76,columns:9,rows:24,tone:'#e0e2df',apartment:true}];
  const roofMat=new T.MeshStandardMaterial({color:0x8e9590,roughness:.93});const roofUnits=new T.InstancedMesh(cube,roofMat,6000);let roofCount=0;C.city.add(roofUnits);
  const cityLayers=types.map((t,index)=>{const asset=t.office?'facade-office':'facade-brick',pbr=t.brick||t.office;const map=pbr?texture(asset+'_color.jpg',1,true):urbanFacade(t.columns,t.rows,t.tone,index);if(pbr)map.repeat.set(t.columns/6,t.rows/6);const mat=new T.MeshStandardMaterial({map,roughness:.8,color:0xffffff});if(pbr){mat.normalMap=texture(asset+'_normal.jpg',1);mat.roughnessMap=texture(asset+'_rough.jpg',1);mat.metalnessMap=texture(asset+'_metal.jpg',1);mat.metalness=.85;mat.normalScale.set(.45,.45);for(const tex of [mat.normalMap,mat.roughnessMap,mat.metalnessMap])tex.repeat.copy(map.repeat)}const mesh=new T.InstancedMesh(cube,[mat,mat,roofMat,roofMat,mat,mat],3000);mesh.name='Illustrative distant urban fabric';mesh.receiveShadow=true;C.city.add(mesh);return {mesh,count:0}});
  const dummy=new T.Object3D();let seed=17;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const occupied=masses.filter(m=>{for(let p=m;p;p=p.parent)if(p===C.contextBuildings?.future)return false;return true}).map(m=>m.userData.box);
  for(let x=-600;x<=600;x+=22)for(let z=-600;z<=600;z+=22){
    const r=Math.hypot(x,z);if(r<110||r>620||Math.abs(x+35)<16||Math.abs(z+104)<12)continue;
    const type=r>260&&rnd()<.055?4:rnd()<.22?3:rnd()<.62?0:rnd()<.72?1:2,t=types[type],layer=cityLayers[type],h=t.h*(.75+rnd()*.45),w=t.apartment?24+rnd()*9:12+rnd()*5,d=t.apartment?9+rnd()*3:11+rnd()*5;
    const px=x+rnd()*5,pz=z+rnd()*5,bounds=new T.Box3(new T.Vector3(px-w/2-2,0,pz-d/2-2),new T.Vector3(px+w/2+2,h,pz+d/2+2));
    if(occupied.some(b=>b.intersectsBox(bounds)))continue;occupied.push(bounds);
    dummy.position.set(px,h/2,pz);dummy.scale.set(w,h,d);dummy.updateMatrix();layer.mesh.setMatrixAt(layer.count,dummy.matrix);layer.mesh.setColorAt(layer.count++,new T.Color(['#e7e4df','#c6c4bc','#d6cec0','#a2aaad','#817a70','#b6aaa0','#9d9690','#ddd8d1'][Math.floor(rnd()*8)]).convertSRGBToLinear());
    dummy.position.y=h+.55;dummy.scale.set(w*.3,1.1,d*.25);dummy.updateMatrix();roofUnits.setMatrixAt(roofCount++,dummy.matrix);
    if(type!==0){dummy.position.set(px+w*.25,h+.3,pz-d*.23);dummy.scale.set(1.8,.6,2.4);dummy.updateMatrix();roofUnits.setMatrixAt(roofCount++,dummy.matrix);}
  }
  roofUnits.count=roofCount;roofUnits.instanceMatrix.needsUpdate=true;
  cityLayers.forEach(({mesh,count})=>{mesh.count=count;mesh.instanceMatrix.needsUpdate=true});
  await load('360/assets/GLTFLoader.js');
  await load('360/assets/DRACOLoader.js');
  const draco=new T.DRACOLoader().setDecoderPath('360/assets/draco/');
  const gltfLoader=new T.GLTFLoader().setDRACOLoader(draco);
  try{
    const asset=await new Promise((resolve,reject)=>gltfLoader.load('360/assets/tree-small-02.glb',resolve,undefined,reject));
    const bounds=new T.Box3().setFromObject(asset.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;const m=o.material;if(m){if(/leaves/.test(m.name)){m.emissive.set('#53612f').convertSRGBToLinear();m.emissiveIntensity=.32;}m.side=T.DoubleSide;m.alphaTest=.45;m.transparent=false;m.needsUpdate=true}}});
    // Keep root pits on the actual sidewalk; the old corner coordinates fell in the road.
    const oppositeWalk=px=>1365-.3604*(px-230)+305;
    const positions=[[120,240],[120,610],[120,1020],[120,1250],[1550,oppositeWalk(1550)],[120,-690],[120,-1000],[120,-1500],[-1240,200],[-1240,650],[-1240,1050],[-1240,-690],[1850,oppositeWalk(1850)],[2200,oppositeWalk(2200),.55],[2550,oppositeWalk(2550),.65],[3250,oppositeWalk(3250),.5],[-1240,1550],[-1240,2050],[-1240,-1000],[-1240,-1500],[120,-2000]];
    positions.forEach((q,i)=>{
      const g=new T.Group(),tree=asset.scene.clone(true),s=(9.2+i%3*.8)/size.y,spread=q[2]||1;
      tree.scale.set(s*spread,s,s*spread);tree.position.set(-center.x*s*spread,-bounds.min.y*s,-center.z*s*spread);g.add(tree);
      const [x,z]=P(...q);g.position.set(x,.16,z);g.rotation.y=i*2.399;g.name='CC0 Tree Small 02';extra.add(g);
      const bed=new T.Group();bed.name='Street tree pit';bed.userData.streetTreePit=true;bed.position.set(x,0,z);
      if(q[0]>230)bed.rotation.y=Math.atan(.3604);extra.add(bed);
      const bedPart=(x,y,z,w,h,d,m)=>{const part=box(x,y,z,w,h,d,m);extra.remove(part);bed.add(part)};
      bedPart(0,.155,0,1.25,.05,1.25,soil);
      for(const side of [-1,1]){bedPart(side*.65,.17,0,.09,.09,1.4,stone);bedPart(0,.17,side*.65,1.4,.09,.09,stone)}
    });
    const roof=C.levels().find(l=>l.kind==='roof');
    if(roof)for(const q of [[450,500],[450,700],[450,900],[450,1050]]){if(!C.inPoly(q,roof.poly))continue;const [x,z]=P(...q);box(x,roof.y+.28,z,.9,.5,.8,stone);const g=new T.Group(),tree=asset.scene.clone(true),s=1.55/size.y;tree.scale.setScalar(s);tree.position.set(-center.x*s,-bounds.min.y*s,-center.z*s);g.add(tree);g.position.set(x,roof.y+.55,z);g.name='CC0 Tree Small 02';extra.add(g)}
  }catch(error){console.warn('Tree asset unavailable',error)}
  try{
    const chair=await new Promise((resolve,reject)=>gltfLoader.load('360/assets/modern-arm-chair/modern-arm-chair.gltf',resolve,undefined,reject));
    const b=new T.Box3().setFromObject(chair.scene),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3()),scale=.76/size.x;
    chair.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});
    for(const fallback of extra.children.slice()){
      const a=fallback.userData.loungeAnchor;if(!a)continue;
      for(const dx of [-.47,.47]){const root=new T.Group(),model=chair.scene.clone(true);model.scale.setScalar(scale);model.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);root.add(model);root.position.set(a.x+dx,a.y,a.z);root.rotation.y=dx<0?.12:-.12;root.name='CC0 lounge armchair';root.userData.illustrativeFurniture=true;extra.add(root)}
      fallback.visible=false;
    }
  }catch(error){console.warn('Lounge chair asset unavailable; retaining simple furnishings',error)}
  // Correct illustrative street furniture that was placed inside the six-metre road.
  const sideRoadY=px=>1365-.3604*(px-230);
  for(const person of C.R3D.props.children){
    if(!person.isGroup||person.children.length!==2||person.children[0].geometry?.type!=='CylinderGeometry'||person.children[1].geometry?.type!=='SphereGeometry')continue;
    const px=person.position.x*41.6+914,py=person.position.z*41.6+770;
    if(px>230&&py-sideRoadY(px)>-20&&py-sideRoadY(px)<286){person.position.z=P(px,sideRoadY(px)-38)[1];person.userData.sidewalkCorrected=true;}
  }
  const sideLampX=P(1480,0)[0];
  for(const part of C.R3D.props.children){
    if((part.isMesh||part.isPointLight)&&Math.abs(part.position.x-sideLampX)<.001&&part.position.y>3){part.position.z-=50/41.6;part.userData.sidewalkCorrected=true;}
  }
  // Reusable authored vehicle meshes, adapted to road headings and passenger-car width.
  try{
    const car=await new Promise((resolve,reject)=>gltfLoader.load('360/assets/concept-car.glb',resolve,undefined,reject));
    const oldCars=[];C.R3D.props.traverse(o=>{if(o.userData.car)oldCars.push(o)});
    const b=new T.Box3().setFromObject(car.scene),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),scale=4.65/Math.max(s.x,s.z);
    oldCars.forEach((old,i)=>{
      const root=new T.Group(),aligned=new T.Group(),model=car.scene.clone(true);
      // Adapt this unusually wide concept body to a plausible 2.1 m passenger-car envelope.
      const widthScale=2.1/s.x;model.scale.set(widthScale,scale,scale);model.position.set(-c.x*widthScale,-b.min.y*scale,-c.z*scale);
      // This glTF faces +Z; the legacy car faces +X. Normalize before road headings.
      aligned.rotation.y=Math.PI/2;aligned.add(model);root.add(aligned);
      if(i<9){
        const lanes=[342.5,68.5,-205.5,205.5,-68.5,-342.5],lane=lanes[i%lanes.length];
        root.position.set(P(-564+lane,770)[0],.012,[-69,-49,-38,-16,2,21,40,61,79][i]);
        root.rotation.y=lane>0?Math.PI/2:-Math.PI/2;
        root.userData.traffic={road:'main',laneOffsetPx:lane,heading:lane>0?'-Z':'+Z'};
      }else{
        const k=i-9,px=[850,1400,2250][k],offset=[70,196,70][k];
        const [x,z]=P(px,1365-.3604*(px-230)+offset);root.position.set(x,.022,z);
        root.rotation.y=Math.atan(.3604)+(offset<133?Math.PI:0);
        root.userData.traffic={road:'side',laneOffsetPx:offset,heading:offset<133?'toward-main':'away-from-main'};
      }
      root.name='Road vehicle '+(i+1);
      model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=o.material.clone();if(/paint|body/i.test(o.material.name)){o.material.color.set(['#b7b9b7','#22282e','#5d686c','#ece9df','#713536','#465e70'][i%6]).convertSRGBToLinear();o.material.metalness=.65;o.material.roughness=.23;}if(o.material.transmission){o.material.transmission=0;o.material.color.set('#24383f');o.material.metalness=.25;o.material.roughness=.12;}}});
      extra.add(root);old.visible=false;
    });
  }catch(error){console.warn('Vehicle asset unavailable',error)}
  await load('360/assets/BufferGeometryUtils.js');
  function batch(root){
    root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
    root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent||o===root)return;
      let visible=true;for(let p=o;p&&p!==root;p=p.parent)if(!p.visible||p.name==='CC0 Tree Small 02')visible=false;if(!visible)return;
      const key=o.material.id+':'+o.castShadow+':'+Object.keys(o.geometry.attributes).sort().join(',');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
    });
    groups.forEach(list=>{if(list.length<3)return;const parts=list.map(o=>o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));
      // Convert all to triangle soup so indexing differences do not prevent a safe merge.
      const geos=parts.map(g=>g.index?g.toNonIndexed():g),merged=T.BufferGeometryUtils.mergeBufferGeometries(geos);
      if(merged){const m=new T.Mesh(merged,list[0].material);m.name='Static material batch';m.castShadow=list[0].castShadow;m.receiveShadow=true;list.forEach(o=>{o.visible=false;o.userData.batched=true});root.add(m)}
      new Set([...parts,...geos]).forEach(g=>g.dispose());
    });
  }
  masses.forEach(batch);batch(C.bld);batch(extra);
  // Conversion to the precision renderer snapshots images: wait for every requested map.
  await Promise.all(pendingTextures);
};
