// 종단면(원본 secBtn·secAllBtn): 원본이 자기 렌더러에 거는 절단면(renderer.clippingPlanes)을 그대로 받아
// 실사 장면에 적용한다. three WebGPU는 렌더러 전역 절단면이 없으므로 ClippingGroup으로 장면 객체를 감싼다.
// 절단 중에는 객체가 그룹 아래로 옮겨지므로, 장면 직계 자식을 도는 코드는 objects()를 써야 한다.
export function createSectionClip(T,scene){
 const group=new T.ClippingGroup();group.name='tower-section-clip';group.clipShadows=false;
 let key='',planes=[];
 const movable=o=>o!==group&&!o.isLight&&!o.isCamera;
 function adopt(){if(!planes.length)return;if(!group.parent)scene.add(group);for(const o of [...scene.children])if(movable(o))group.add(o)}
 function release(){if(!group.parent)return;for(const o of [...group.children])scene.add(o);scene.remove(group)}
 return {
  // [[nx,ny,nz,constant],...]; 빈 배열이면 해제. 같은 값이면 아무것도 하지 않는다.
  set(values=[]){
   const next=JSON.stringify(values||[]);if(next===key)return false;key=next;
   planes=(values||[]).map(([x,y,z,c])=>new T.Plane(new T.Vector3(x,y,z),c));group.clippingPlanes=planes;
   if(planes.length)adopt();else release();return true;
  },
  // 건물 재생성 전후에 감싸기를 풀고 다시 적용한다(새 복사본도 절단되도록).
  suspend:release,resume:adopt,
  objects:()=>group.parent?[...scene.children.filter(o=>o!==group),...group.children]:scene.children,
  get active(){return planes.length>0},get planes(){return planes.map(p=>[...p.normal.toArray(),p.constant])},group};
}
