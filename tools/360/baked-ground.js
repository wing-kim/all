// Precomputed only; no ray tracing or light baking runs in the user's browser.
export async function applyBakedGround(T,scene){
 const started=performance.now(),loader=new T.TextureLoader();
 const [ao,bounce]=await Promise.all(['ground-sky-ao.png','ground-diffuse-bounce.png'].map(n=>loader.loadAsync('360/assets/'+n)));
 for(const map of [ao,bounce]){map.colorSpace=T.NoColorSpace;map.channel=1;map.flipY=false;map.anisotropy=4;}
 const bindings=[],point=new T.Vector3(),box=new T.Box3(),extent=112;
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.userData.primary||Array.isArray(o.material)||o.material.transparent||o.material.transmission>0)return;
  box.setFromObject(o);if(box.max.y>.7||box.min.y<-.6||box.max.x<-extent||box.min.x>extent||box.max.z<-extent||box.min.z>extent)return;
  const original=o.material,g=o.geometry.clone(),p=g.attributes.position,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv[i*2]=(point.x+extent)/(extent*2);uv[i*2+1]=(point.z+extent)/(extent*2)}
  g.setAttribute('uv1',new T.BufferAttribute(uv,2));o.geometry=g;
  const aoOnly=original.clone();aoOnly.aoMap=ao;aoOnly.aoMapIntensity=.85;
  const baked=aoOnly.clone();baked.lightMap=bounce;baked.lightMapIntensity=.6;o.material=aoOnly;
  bindings.push({object:o,original,aoOnly,baked});
 });
 let enabled=true;return {materials:bindings.flatMap(b=>[b.original,b.aoOnly,b.baked]),count:bindings.length,loadMs:performance.now()-started,setEnabled(value){enabled=value;for(const b of bindings)b.object.material=value?b.aoOnly:b.original},get enabled(){return enabled},sunlightBakeValid:false};
}
