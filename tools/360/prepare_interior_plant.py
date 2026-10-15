import bpy,json,sys,argparse
p=argparse.ArgumentParser();p.add_argument("--source",required=True);p.add_argument("--output",required=True);args=p.parse_args(sys.argv[sys.argv.index("--")+1:])
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=args.source)
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
print('OBJECTS',[(o.name,len(o.data.polygons)) for o in objects])
keep=[o for o in objects if 'stem' in o.name or 'leaves' in o.name]
stem=next(o for o in keep if 'stem' in o.name)
verts=[stem.matrix_world@v.co for v in stem.data.vertices];z=min(v.z for v in verts);foot=[v for v in verts if v.z<z+.015]
anchor=Vector(((min(v.x for v in foot)+max(v.x for v in foot))/2,(min(v.y for v in foot)+max(v.y for v in foot))/2,z))
bpy.ops.object.select_all(action='DESELECT')
for o in keep:o.location-=anchor;o.select_set(True)
bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(v) for o in keep for v in o.bound_box]
print('FOLIAGE',json.dumps({'anchor':list(anchor),'min':[min(v[k] for v in pts) for k in range(3)],'max':[max(v[k] for v in pts) for k in range(3)],'polygons':sum(len(o.data.polygons) for o in keep)}))
bpy.ops.export_scene.gltf(filepath=args.output,export_format='GLB',use_selection=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
