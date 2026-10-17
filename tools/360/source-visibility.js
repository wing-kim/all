export function sourceVisible(object){
 for(let node=object;node;node=node.parent){if(!node.visible)return false;if(node.isScene)return true;}
 return false; // A replaced overlay mesh is detached even if its own visible flag remains true.
}

export function bindSourceVisibility(copy,source){
 // Object3D.clone() JSON-copies userData. A source Object3D there is circular
 // and would pull the whole original scene into precision-scene clones.
 Object.defineProperty(copy,'sourceVisibilityObject',{value:source,configurable:true});
}

// Source hierarchy remains authoritative after its meshes are flattened into
// the modern scene. Only visibility changes; no geometry is recreated.
export function syncCopiedVisibility(T,scene,C,renderer){
 const doll=!!C.dollMode,level=doll?C.levels().find(l=>l.key===C.interiorFloorKey):null;
 const cap=level?C.ceilOf(level)-.1:Infinity,bounds=new T.Box3();
 const hideOutdoors=doll&&level?.kind==='base';
 let changed=0;
 for(const object of scene.children){
  const source=object.sourceVisibilityObject;
  if(!source){
   const kind=object.userData.contextKind;
   const visible=(kind?C[kind].visible:true)&&!(hideOutdoors&&object.userData.outdoorEnhancement);
   if((kind||object.userData.outdoorEnhancement)&&object.visible!==visible){object.visible=visible;changed++}
   continue;
  }
  let visible=sourceVisible(source);
  if(hideOutdoors&&object.userData.outdoorEnhancement)visible=false;
  if(visible&&level&&object.userData.interiorDressing){
   if(source.isInstancedMesh&&source.userData.legacyInteriorFoliage)visible=false;
   else{bounds.setFromObject(source);if(bounds.min.y>=cap)visible=false}
  }
  if(object.visible!==visible){object.visible=visible;changed++}
 }
 if(changed&&renderer?.shadowMap)renderer.shadowMap.needsUpdate=true;
 return changed;
}
