"""S-1 상한 확인: bake-cafe-ambient.py와 같은 원본 스냅샷·재질 규칙으로 장면을 만들고,
실시간 뷰어와 같은 카메라·태양으로 Cycles 경로추적 스틸을 렌더한다.
blender -b --factory-startup --python tools/360/render_cafe_reference.py -- tools/360/cafe-ambient-source.json.gz out.png 256  (선택: EXPOSURE=1.0 SUN=4 SKY=.3)
유리는 원본 opacity 기반 투명/불투명 혼합(베이크 스크립트와 동일한 근사)이다.
"""
import gzip, json, math, os, sys
from pathlib import Path
from urllib.parse import urlparse
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/360'))
from cafe_ambient_receivers import source_faces  # noqa: E402

src_path, out, samples = sys.argv[sys.argv.index('--') + 1:]
with gzip.open(src_path, 'rt') as stream:
    src = json.load(stream)
bpy.ops.wm.read_factory_settings(use_empty=True)
axis = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = int(samples)
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.cycles.transparent_max_bounces = 16
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.filepath = str(Path(out).resolve())
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = float(os.environ.get('EXPOSURE', '0'))
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == 'METAL'
    if any(d.type == 'METAL' for d in prefs.devices):
        scene.cycles.device = 'GPU'
except Exception as error:
    print('GPU fallback', error)

cache, missing = {}, []
FALLBACK = {'dining_chair_02': (.33, .12, .05), 'modern_arm_chair_01_legs': (.06, .045, .035)}


def texture(url):
    if not url:
        return None
    path = ROOT / 'new' / urlparse(url).path.lstrip('/').split('new/', 1)[-1]
    if not path.is_file():
        path = ROOT / urlparse(url).path.lstrip('/')
    if path.is_file():
        return path
    missing.append(url)
    return None


def material(key):
    if key in cache:
        return cache[key]
    data = src['materials'][key]
    mat = bpy.data.materials.new(data['name'] or key)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    color = (*[min(1, max(0, x)) for x in data['color']], 1)
    # 스냅샷에 glTF 텍스처가 빠진 가구 재질은 검토용 대체 색을 쓴다(실제 사양 아님)
    if data.get('name') in FALLBACK and not data.get('map') and min(color[:3]) > .95:
        color = (*FALLBACK[data['name']], 1)
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = data.get('roughness', .7)
    bsdf.inputs['Metallic'].default_value = data.get('metalness', 0)
    if path := texture(data.get('map')):
        node = nodes.new('ShaderNodeTexImage'); node.image = bpy.data.images.load(str(path), check_existing=True)
        uv = nodes.new('ShaderNodeUVMap'); uv.uv_map = 'Source UV'
        links.new(uv.outputs['UV'], node.inputs['Vector'])
        tint = nodes.new('ShaderNodeMixRGB'); tint.blend_type = 'MULTIPLY'; tint.inputs[0].default_value = 1
        tint.inputs[1].default_value = color
        links.new(node.outputs['Color'], tint.inputs[2]); links.new(tint.outputs[0], bsdf.inputs['Base Color'])
    if data.get('glazing') or data.get('transparent'):
        transparent = nodes.new('ShaderNodeBsdfTransparent')
        mix = nodes.new('ShaderNodeMixShader')
        mix.inputs[0].default_value = 1 - min(1, max(0, data.get('opacity', 1)))
        links.new(bsdf.outputs['BSDF'], mix.inputs[1]); links.new(transparent.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], nodes.get('Material Output').inputs['Surface'])
    cache[key] = mat
    return mat


for obj in src['objects']:
    geometry = src['geometries'][obj['geometry']]
    pos = geometry['position']
    faces, slots = [], []
    for offset, face in source_faces(geometry):
        faces.append(face)
        index = next((g['materialIndex'] for g in geometry['groups'] if g['start'] <= offset < g['start'] + g['count']), 0)
        slots.append(0 if len(obj['materials']) == 1 else index)
    if not faces:
        continue
    mesh = bpy.data.meshes.new(obj['name'] or obj['geometry'])
    mesh.from_pydata(list(zip(pos[0::3], pos[1::3], pos[2::3])), [], faces)
    for key in obj['materials']:
        mesh.materials.append(material(key))
    for polygon, slot in zip(mesh.polygons, slots):
        polygon.material_index = slot
    if uv := geometry.get('uv'):
        layer = mesh.uv_layers.new(name='Source UV')
        for loop in mesh.loops:
            i = loop.vertex_index * 2
            layer.data[loop.index].uv = (uv[i], uv[i + 1])
    mesh.update()
    o = bpy.data.objects.new(mesh.name, mesh); scene.collection.objects.link(o)
    o.matrix_world = axis @ Matrix([obj['matrix'][i:i + 4] for i in range(0, 16, 4)]).transposed()
print('OBJECTS', len(scene.objects), 'MATERIALS', len(cache), 'MISSING_TEX', len(missing))


def b(v):
    return Vector((v[0], -v[2], v[1]))


# 기본은 가을 15시. SUNDIR에 앱 TOWER_CINEMA.status().daylight.direction 값을 "x,y,z"로 넣는다.
sun_dir = b([float(v) for v in os.environ.get('SUNDIR', '0.0187,0.6092,0.7928').split(',')]).normalized()
world = bpy.data.worlds.new('Daylight'); world.use_nodes = True; scene.world = world
nt = world.node_tree; nt.nodes.clear()
outn = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground')
bg.inputs['Strength'].default_value = float(os.environ.get('SKY', '.3'))
sky = nt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
sky.sun_elevation = math.asin(sun_dir.z); sky.sun_rotation = math.atan2(sun_dir.y, sun_dir.x) - math.pi / 2
sky.sun_disc = False
nt.links.new(sky.outputs['Color'], bg.inputs['Color']); nt.links.new(bg.outputs[0], outn.inputs['Surface'])
sd = bpy.data.lights.new('Sun', 'SUN'); sd.energy = float(os.environ.get('SUN', '4'))
sd.color = tuple(float(v) for v in os.environ.get('SUNCOLOR', '1.0,.92,.80').split(','))
sd.angle = math.radians(1.5)
sun = bpy.data.objects.new('Sun', sd); scene.collection.objects.link(sun)
sun.rotation_euler = (-sun_dir).to_track_quat('-Z', 'Y').to_euler()
cd = bpy.data.cameras.new('Viewer camera'); cam = bpy.data.objects.new('Viewer camera', cd)
scene.collection.objects.link(cam)
cam.location = b((-11.848557692307692, 1.67, -10.870192307692307))
cam.rotation_euler = b((0.461637716614517, 0, 0.8870685534945624)).to_track_quat('-Z', 'Y').to_euler()
cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(72); cd.clip_start = .05
scene.camera = cam
bpy.ops.wm.save_as_mainfile(filepath=str(Path(out).with_suffix('.blend').resolve()))
bpy.ops.render.render(write_still=True)
print('SOURCE_RENDER_COMPLETE', scene.render.filepath)
