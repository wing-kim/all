"""Blender --background --factory-startup --python import-cafe-bake.py -- input.json[.gz] output.blend
Geometry-only preparation, NOT a completed light bake. Input omission report is retained.
"""
import bpy, sys, json, gzip
from mathutils import Matrix, Quaternion, Vector
args=sys.argv[sys.argv.index('--')+1:]
with (gzip.open(args[0],'rt') if args[0].endswith('.gz') else open(args[0])) as f: src=json.load(f)
bpy.ops.wm.read_factory_settings(use_empty=True)
axis=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
mats={}
for key,m in src['materials'].items():
 mat=bpy.data.materials.new(key);mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=(*m['color'],1);bsdf.inputs['Roughness'].default_value=m['roughness'];bsdf.inputs['Metallic'].default_value=m['metalness']
 bsdf.inputs['Emission Color'].default_value=(*m['emissive'],1);bsdf.inputs['Emission Strength'].default_value=m['emissiveIntensity']
 if m.get('transparent'): bsdf.inputs['Transmission Weight'].default_value=1-m.get('opacity',1)
 mats[key]=mat
cache={}
for obj in src['objects']:
 key=(obj['geometry'],tuple(obj['materials']))
 if key not in cache:
  g=src['geometries'][obj['geometry']];p=g['position'];verts=list(zip(p[0::3],p[1::3],p[2::3]));idx=g['index'] or list(range(len(verts)))
  start=g['drawRange']['start'];count=g['drawRange']['count'];end=min(len(idx),start+count) if count is not None else len(idx)
  faces=[tuple(idx[i:i+3]) for i in range(start,end-2,3)];mesh=bpy.data.meshes.new(obj['geometry']);mesh.from_pydata(verts,[],faces)
  for mk in obj['materials']: mesh.materials.append(mats[mk])
  for poly,i in zip(mesh.polygons,range(start,end-2,3)):
   for group in g['groups']:
    if group['start']<=i<group['start']+group['count']:poly.material_index=group['materialIndex'];break
  mesh.update();cache[key]=mesh
 o=bpy.data.objects.new(obj['name'] or 'source-mesh',cache[key]);bpy.context.collection.objects.link(o)
 a=obj['matrix'];o.matrix_world=axis@Matrix([a[i:i+4] for i in range(0,16,4)]).transposed()
c=src['camera'];data=bpy.data.cameras.new('Source camera');cam=bpy.data.objects.new('Source camera',data);bpy.context.collection.objects.link(cam)
x,y,z,w=c['quaternion'];cam.matrix_world=axis@Matrix.LocRotScale(Vector(c['position']),Quaternion((w,x,y,z)),Vector((1,1,1)))
import math
data.angle=math.radians(c['fov']);bpy.context.scene.camera=cam
bpy.context.scene['bake_input_scope']=src['scope'];bpy.context.scene['bake_input_skipped']=json.dumps(src['skipped'])
bpy.context.scene['source_state']=json.dumps(src['state']);bpy.context.scene['lighting_ready']=False
bpy.ops.wm.save_as_mainfile(filepath=args[1]);print('IMPORTED',len(src['objects']),'objects;',len(src['skipped']),'skips; lighting not configured')
