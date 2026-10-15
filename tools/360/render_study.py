"""Independent offline quality gate; does not replace the continuous web viewer.
blender -b -t 6 --python tools/360/render_study.py -- scene.glb output.png
"""
import bpy, math, sys
from mathutils import Vector
from pathlib import Path
source, output = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(source).resolve()))
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.cycles.max_bounces=8
scene.cycles.transmission_bounces=8
scene.cycles.transparent_max_bounces=12
scene.cycles.adaptive_threshold=.025
scene.render.resolution_x=1280
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(Path(output).resolve())
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=-.3
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'
    prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='METAL'
    if any(d.type=='METAL' for d in prefs.devices): scene.cycles.device='GPU'
except Exception as error: print('GPU fallback',error)
# Keep the imported structural coordinates. Clean materials, not building dimensions.
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if not bsdf: continue
    if mat.name in ('glass','glass1','door','guard','rail'):
        bsdf.inputs['Base Color'].default_value=(.90,.96,.98,1)
        bsdf.inputs['Metallic'].default_value=0
        bsdf.inputs['Roughness'].default_value=.07
        bsdf.inputs['Alpha'].default_value=1
        bsdf.inputs['Transmission Weight'].default_value=1
        bsdf.inputs['IOR'].default_value=1.45
    elif bsdf.inputs['Alpha'].default_value<.95:
        bsdf.inputs['Alpha'].default_value=1
    else:
        # Microscopic surface relief does not change the massing or openings.
        nodes=mat.node_tree.nodes;links=mat.node_tree.links
        noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=85
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.012
        links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
for obj in list(scene.objects):
    if obj.type!='MESH': continue
    if obj.name.lower().startswith('sky'): bpy.data.objects.remove(obj,do_unlink=True);continue
    # Small edge highlights, preserving wall/window centerlines.
    if len(obj.data.polygons)<50 and all(m and m.name not in ('glass','glass1','door','guard','rail') for m in obj.data.materials):
        bevel=obj.modifiers.new('edge-highlight-study','BEVEL');bevel.width=.018;bevel.segments=2
        bevel.limit_method='ANGLE'
world=bpy.data.worlds.new('Daylight study');world.use_nodes=True;scene.world=world
nodes=world.node_tree.nodes;links=world.node_tree.links;nodes.clear()
out=nodes.new('ShaderNodeOutputWorld');background=nodes.new('ShaderNodeBackground');background.inputs['Strength'].default_value=.18
sky=nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING';sky.sun_elevation=math.radians(36);sky.sun_rotation=math.radians(145);sky.sun_disc=False;sky.air_density=1.1;sky.aerosol_density=.6
links.new(sky.outputs['Color'],background.inputs['Color']);links.new(background.outputs[0],out.inputs['Surface'])
sun_data=bpy.data.lights.new('Sun','SUN');sun_data.energy=2.6;sun_data.color=(1.0,.91,.78);sun_data.angle=math.radians(3)
sun=bpy.data.objects.new('Sun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(math.radians(32),math.radians(-20),math.radians(-35))
# glTF Y-up becomes Blender Z-up: (x,y,z) -> (x,-z,y).
camera_data=bpy.data.cameras.new('Reference camera');camera=bpy.data.objects.new('Reference camera',camera_data);scene.collection.objects.link(camera)
camera.location=(-56.4957,-57.7754,22.4195)
target=Vector((-3,0,16));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.lens=32.7;camera_data.sensor_width=36;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output).with_suffix('.blend').resolve()))
bpy.ops.render.render(write_still=True)
print('OFFLINE_RENDER_COMPLETE',scene.render.filepath)
