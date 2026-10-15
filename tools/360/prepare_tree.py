import bpy,bmesh,random,json
from pathlib import Path
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('output')
parser.add_argument('--leaf-retention',type=float,default=1)
parser.add_argument('--leaf-scale',type=float,default=1)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
if not 0 < args.leaf_retention <= 1 or args.leaf_scale <= 0:parser.error('leaf retention must be in (0,1] and scale must be positive')
source=Path(args.source).resolve()
j=json.loads(source.read_text())
for mesh in j['meshes']:
 for prim in mesh['primitives']:
  mat=j['materials'][prim['material']]
  if 'branches' in mat['name']:
   prim['attributes']['TEXCOORD_0']=prim['attributes']['TEXCOORD_1']
   def fix(v):
    if isinstance(v,dict):
     if 'texCoord' in v:v['texCoord']=0
     for x in v.values():fix(x)
    elif isinstance(v,list):
     for x in v:fix(x)
   fix(mat)
source.with_name('tree-compatible.gltf').write_text(json.dumps(j))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source.with_name('tree-compatible.gltf')))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 if 'leaves' in o.data.materials[0].name:
  bm=bmesh.new();bm.from_mesh(o.data);seen=set();parts=[]
  for v in bm.verts:
   if v in seen:continue
   part=[];stack=[v];seen.add(v)
   while stack:
    x=stack.pop();part.append(x)
    for e in x.link_edges:
     y=e.other_vert(x)
     if y not in seen:seen.add(y);stack.append(y)
   parts.append(part)
   center=sum((v.co for v in part),__import__('mathutils').Vector())/len(part)
   for v in part:v.co=center+(v.co-center)*args.leaf_scale
  print('Leaf components',len(parts),'sizes',sorted(map(len,parts))[:8],flush=True)
  random.seed(42);remove=[v for p in parts if random.random()>args.leaf_retention for v in p];bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(o.data);bm.free()
  mod=o.modifiers.new('Preserve leaf silhouettes','DECIMATE');mod.ratio=.2
 else:
  mod=o.modifiers.new('Web bark reduction','DECIMATE');mod.ratio=min(1,16000/len(o.data.polygons))
 bpy.ops.object.modifier_apply(modifier=mod.name)
 print(o.name,len(o.data.polygons),flush=True)
bpy.ops.export_scene.gltf(filepath=str(Path(args.output).resolve()),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
