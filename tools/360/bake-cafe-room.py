"""Bake the whole 1F cafe (structure + furniture) for original season/time button pairs.

blender --background --factory-startup --python bake-cafe-room.py -- \
  cafe-ambient-source.json.gz room-bake --slots cafe-room-slots.json \
  --lights cafe-room-lights.json --size 2048 --samples 256 --device GPU

카페 안의 수신면(유리·화분 제외)을 객체별로 이어진 UV 아틀라스 하나로 한 번만 펼치고, 모든 슬롯이 그 UV를 공유한다.
- lights-lightmap.png (공유): 카페 천장 면광원(직접+간접). 런타임의 같은 실시간 조명은 베이크 적용 중 끈다.
- <slot>/day-lightmap.png: 하늘빛(직접+간접) × 슬롯 하늘 세기·색 + 해/달 반사광(간접만).
  해/달 직사광은 런타임 그림자 맵이 그린다. 하늘빛은 세기에 선형이라 한 번 구워 슬롯마다 배율만 곱한다.
- uv.bin (공유), <slot>/manifest.json.
런타임은 같은 필터로 삼각형을 다시 골라 객체 해시로 맞춘 뒤 uv.bin의 UV를 붙인다.
필터 규칙을 바꾸면 tools/360/cafe-room-bake.js의 receiverTriangle과 함께 바꿔야 한다.
"""
import argparse
import gzip
import hashlib
import json
import math
import struct
import sys
import time
import zlib
from pathlib import Path
from urllib.parse import urlparse

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cafe_ambient_receivers import discover_receivers, source_faces  # noqa: E402

PLANT_MATERIALS = {'potted_plant_01_leaves', 'potted_plant_01_pot', 'Olive leaves'}
FURNITURE_FILES = ['360/cafe.js', '360/environment.js', '360/assets/interior-foliage.glb',
                   '360/assets/modern-arm-chair/modern-arm-chair.gltf',
                   '360/assets/modern-arm-chair/modern_arm_chair_01.bin']


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--slots', type=Path, required=True, help='JSON list: key, season, time, sun, sunStrength, sunColor, sky, skyTint')
    parser.add_argument('--lights', type=Path, required=True)
    parser.add_argument('--size', type=int, default=2048)
    parser.add_argument('--samples', type=int, default=256)
    parser.add_argument('--device', choices=('CPU', 'GPU'), default='GPU')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:])


args = arguments()
started = time.time()
args.output.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[2]
source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
with gzip.open(args.source, 'rt') as stream:
    src = json.load(stream)
assert src['version'] == 2 and not src['skipped'], 'Incomplete or unexpected source snapshot'
floor_y, ceiling_y = src['floor'], src['ceiling']


# ---- 수신면 범위: 기존 바닥·천장 수신면의 평면 범위 + 0.5 m -------------------------------
def world(matrix, positions, index):
    x, y, z = positions[3 * index:3 * index + 3]
    return (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
            matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
            matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14])


objects = {obj['geometry']: obj for obj in src['objects']}
xs, zs = [], []
for name, (key, height, _facing) in discover_receivers(src).items():
    obj, geometry = objects[key], src['geometries'][key]
    for _offset, face in source_faces(geometry):
        points = [world(obj['matrix'], geometry['position'], i) for i in face]
        if all(abs(p[1] - height) < .001 for p in points):
            xs += [p[0] for p in points]
            zs += [p[2] for p in points]
BOX = {'min': [min(xs) - .5, floor_y - .15, min(zs) - .5], 'max': [max(xs) + .5, ceiling_y + .45, max(zs) + .5]}
# 스냅샷은 내보내기 상자와 겹치는 삼각형만 담는다. 수신 상자가 그 안에 있어야 런타임과 같은 삼각형 집합이 된다.
room_box = src.get('roomBox')
assert room_box and all(room_box['min'][k] <= BOX['min'][k] and BOX['max'][k] <= room_box['max'][k] for k in range(3)), \
    f'Receiver box {BOX} must lie inside the snapshot export box {room_box}; re-export with export-cafe-bake.js'


def glazing(data):
    return bool(data.get('glazing')) or (bool(data.get('transparent')) and data.get('opacity', 1) < .95)


def receiver_triangle(points, data):
    """Same rule as receiverFilter() in cafe-room-bake.js."""
    if glazing(data):
        return False
    lo, hi = BOX['min'], BOX['max']
    if not all(lo[k] <= p[k] <= hi[k] for p in points for k in range(3)):
        return False
    a, b, c = points
    u = [b[k] - a[k] for k in range(3)]
    v = [c[k] - a[k] for k in range(3)]
    n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
    length = math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
    if length < 1e-9:
        return False
    cy = (a[1] + b[1] + c[1]) / 3
    if cy > ceiling_y + .05 and n[1] > .5 * length:
        return False  # 위층 바닥판 윗면
    if cy < floor_y - .05 and n[1] < -.5 * length:
        return False  # 지하 천장 면
    return True


def fnv(hash_value, value):
    return ((hash_value ^ (value & 0xffffffff)) * 16777619) & 0xffffffff


def quantize(value):
    return math.floor(value * 1000 + .5)


def group_material(geometry, obj, offset):
    index = next((g['materialIndex'] for g in geometry['groups'] if g['start'] <= offset < g['start'] + g['count']), 0)
    return 0 if len(obj['materials']) == 1 else index


# ---- 객체별 수신 삼각형과 해시 ------------------------------------------------------------
plans = []
total = 0
for obj in src['objects']:
    geometry = src['geometries'][obj['geometry']]
    names = {src['materials'][m]['name'] for m in obj['materials']}
    excluded = bool(names & PLANT_MATERIALS)
    receiver, other, hash_value, area = [], [], 2166136261, 0.0
    for offset, face in source_faces(geometry):
        slot = group_material(geometry, obj, offset)
        data = src['materials'][obj['materials'][slot]]
        points = [world(obj['matrix'], geometry['position'], i) for i in face]
        if not excluded and receiver_triangle(points, data):
            receiver.append((offset, face, slot))
            a, b, c = points
            u = [b[k] - a[k] for k in range(3)]
            v = [c[k] - a[k] for k in range(3)]
            area += .5 * math.sqrt((u[1] * v[2] - u[2] * v[1]) ** 2 + (u[2] * v[0] - u[0] * v[2]) ** 2 + (u[0] * v[1] - u[1] * v[0]) ** 2)
            for p in points:
                for value in p:
                    hash_value = fnv(hash_value, quantize(value))
        else:
            other.append((offset, face, slot))
    plans.append({'obj': obj, 'receiver': receiver, 'other': other, 'hash': hash_value, 'area': area})
    total += len(receiver)
keys = [(p['hash'], len(p['receiver'])) for p in plans if p['receiver']]
assert len(keys) == len(set(keys)), 'Two receiver objects share a hash; runtime matching would be ambiguous'
print(f'RECEIVERS {total} triangles in {len(keys)} objects, box {BOX}', flush=True)

# ---- Blender 장면 -------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
axis = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
if args.device == 'GPU':
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'METAL'
    assert any(d.use for d in prefs.devices), 'GPU requested but no Metal device'
    scene.cycles.device = 'GPU'
scene.cycles.samples = args.samples
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 0
scene.cycles.transmission_bounces = 4
scene.render.bake.margin = 4
scene.render.bake.use_pass_color = False
world_data = bpy.data.worlds.new('Neutral ambient sky')
world_data.use_nodes = True
background = world_data.node_tree.nodes.get('Background').inputs
background['Color'].default_value = (.8, .8, .8, 1)
scene.world = world_data

material_cache = {}


def local_texture(url):
    if not url:
        return None
    path = root / urlparse(url).path.lstrip('/')
    return path if path.is_file() else None


def source_material(key):
    if key in material_cache:
        return material_cache[key]
    data = src['materials'][key]
    material = bpy.data.materials.new(data['name'] or key)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    color = (*[min(1, max(0, x)) for x in data['color']], 1)
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = data.get('roughness', .7)
    bsdf.inputs['Metallic'].default_value = data.get('metalness', 0)
    bsdf.inputs['Emission Strength'].default_value = 0
    if path := local_texture(data.get('map')):
        node = nodes.new('ShaderNodeTexImage')
        node.image = bpy.data.images.load(str(path), check_existing=True)
        uv = nodes.new('ShaderNodeUVMap')
        uv.uv_map = 'Source UV'
        links.new(uv.outputs['UV'], node.inputs['Vector'])
        tint = nodes.new('ShaderNodeMixRGB')
        tint.blend_type = 'MULTIPLY'
        tint.inputs[0].default_value = 1
        tint.inputs[1].default_value = color
        links.new(node.outputs['Color'], tint.inputs[2])
        links.new(tint.outputs[0], bsdf.inputs['Base Color'])
    if glazing(data):
        transparent = nodes.new('ShaderNodeBsdfTransparent')
        mix = nodes.new('ShaderNodeMixShader')
        mix.inputs[0].default_value = 1 - min(1, max(0, data.get('opacity', 1)))
        links.new(bsdf.outputs['BSDF'], mix.inputs[1])
        links.new(transparent.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], nodes.get('Material Output').inputs['Surface'])
    material_cache[key] = material
    return material


def add_faces(mesh_name, entries, weld=False):
    """entries: list of (obj, geometry, [(offset, face, slot)]); vertices shared within an object.
    weld=True joins corners at the same world position so UV unwrapping sees connected islands
    (batched source meshes are non-indexed). Face and corner order are unchanged."""
    vertices, faces, slots, uvs, materials, material_index = [], [], [], [], [], {}
    for obj, geometry, triangles in entries:
        matrix = obj['matrix']
        positions, source_uv = geometry['position'], geometry.get('uv')
        remap = {}
        for _offset, face, slot in triangles:
            ids = []
            for i in face:
                x, y, z = world(matrix, positions, i)
                key = (round(x, 6), round(y, 6), round(z, 6)) if weld else i
                if key not in remap:
                    remap[key] = len(vertices)
                    vertices.append((x, -z, y))
                ids.append(remap[key])
            faces.append(ids)
            key = obj['materials'][slot]
            if key not in material_index:
                material_index[key] = len(materials)
                materials.append(source_material(key))
            slots.append(material_index[key])
            uvs.append([(source_uv[2 * i], source_uv[2 * i + 1]) if source_uv else (0, 0) for i in face])
    mesh = bpy.data.meshes.new(mesh_name)
    mesh.from_pydata(vertices, [], faces)
    for material in materials:
        mesh.materials.append(material)
    for polygon, slot in zip(mesh.polygons, slots):
        polygon.material_index = slot
    layer = mesh.uv_layers.new(name='Source UV')
    for polygon, corner_uvs in zip(mesh.polygons, uvs):
        for loop_index, uv in zip(polygon.loop_indices, corner_uvs):
            layer.data[loop_index].uv = uv
    mesh.update()
    result = bpy.data.objects.new(mesh_name, mesh)
    scene.collection.objects.link(result)
    return result


for plan in plans:
    if plan['other']:
        obj = plan['obj']
        add_faces('occluder ' + (obj['name'] or obj['geometry']), [(obj, src['geometries'][obj['geometry']], plan['other'])])
receiver_plans = [p for p in plans if p['receiver']]
receiver = add_faces('Cafe room receivers', [(p['obj'], src['geometries'][p['obj']['geometry']], p['receiver']) for p in receiver_plans], weld=True)
assert len(receiver.data.polygons) == total, 'Welding must not drop receiver faces'
print(f'SCENE {len(scene.objects)} objects in {time.time() - started:.1f}s', flush=True)

# ---- 라이트맵 UV ----------------------------------------------------------------------------
mesh = receiver.data
atlas = mesh.uv_layers.new(name='Room lightmap')
mesh.uv_layers.active = atlas
bpy.ops.object.select_all(action='DESELECT')
receiver.select_set(True)
bpy.context.view_layer.objects.active = receiver
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.0015, area_weight=0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
print(f'UNWRAPPED in {time.time() - started:.1f}s', flush=True)

# ---- 조명 --------------------------------------------------------------------------------
slots = json.loads(args.slots.read_text())
for slot in slots:
    assert slot['key'] == slot['season'] + '-' + slot['time'], f"Slot key must be season-time: {slot['key']}"
sun = bpy.data.objects.new('Slot sun', bpy.data.lights.new('Slot sun', 'SUN'))
sun.data.angle = math.radians(.53)
scene.collection.objects.link(sun)


def aim_sun(slot):
    x, y, z = slot['sun']
    toward = Vector((x, -z, y)).normalized()
    sun.rotation_euler = (-toward).to_track_quat('-Z', 'Y').to_euler()
    sun.data.color = slot['sunColor']


light_specs = json.loads(args.lights.read_text())
area_lights = []
for index, spec in enumerate(light_specs):
    data = bpy.data.lights.new(f'Cafe ceiling light {index}', 'AREA')
    data.shape = 'RECTANGLE'
    data.size, data.size_y = spec['width'], spec['height']
    data.color = spec['color']
    light = bpy.data.objects.new(data.name, data)
    px, py, pz = spec['pos']
    dx, dy, dz = spec['dir']
    light.location = (px, -pz, py)
    light.rotation_euler = Vector((dx, -dz, dy)).to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(light)
    # three RectAreaLight intensity is emitted radiance; Cycles area power is pi * radiance * area.
    area_lights.append((light, math.pi * spec['intensity'] * spec['width'] * spec['height']))


def set_lights(sky, sun_energy, interior):
    background['Strength'].default_value = sky
    sun.data.energy = sun_energy
    for light, power in area_lights:
        light.data.energy = power if interior else 0


# ---- 베이크 -------------------------------------------------------------------------------
size = args.size
image = bpy.data.images.new('Room bake target', width=size, height=size, alpha=False, float_buffer=True)
image.colorspace_settings.name = 'Non-Color'
for material in mesh.materials:
    node = material.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = image
    material.node_tree.nodes.active = node
scene.render.bake.target = 'IMAGE_TEXTURES'


def bake(direct, indirect):
    scene.render.bake.use_pass_direct = direct
    scene.render.bake.use_pass_indirect = indirect
    image.pixels.foreach_set(np.zeros(size * size * 4, dtype=np.float32))
    bpy.ops.object.bake(type='DIFFUSE', uv_layer='Room lightmap')
    pixels = np.empty(size * size * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    return pixels.reshape(size, size, 4)[:, :, :3].copy()


passes = {}
for name, lights, direct, indirect in [('sky', (1, 0, False), True, True), ('lights', (0, 0, True), True, True)]:
    set_lights(*lights)
    passes[name] = bake(direct, indirect)
    print(f'BAKED {name} in {time.time() - started:.1f}s, max {passes[name].max():.4f}', flush=True)
for slot in slots:
    aim_sun(slot)
    set_lights(0, slot['sunStrength'], False)
    passes['sun:' + slot['key']] = bake(False, True)
    print(f"BAKED sun indirect {slot['key']} in {time.time() - started:.1f}s", flush=True)


def denoise(rgb, coverage, sigma=1.1, radius=3):
    """Mask-normalised separable Gaussian; uncovered atlas texels never leak into islands."""
    weights = np.exp(-np.arange(-radius, radius + 1) ** 2 / (2 * sigma * sigma)).astype(np.float32)
    mask = coverage.astype(np.float32)[:, :, None]
    def blur(values):
        for axis_index in (0, 1):
            padded = np.pad(values, [(radius, radius) if a == axis_index else (0, 0) for a in range(3)])
            values = sum(w * np.take(padded, range(k, k + size), axis=axis_index) for k, w in enumerate(weights))
        return values
    return np.where(mask > 0, blur(rgb * mask) / np.maximum(blur(mask), 1e-6), 0)


def save_png(path, encoded):
    rows = np.flipud(np.clip(np.round(encoded * 255), 0, 255).astype(np.uint8))
    raw = b''.join(b'\x00' + row.tobytes() for row in rows)
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!IIBBBBB', size, size, 8, 2, 0, 0, 0))
                     + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


coverage = (passes['sky'].max(axis=2) + passes['lights'].max(axis=2)) > 1e-6


def encode(path, rgb):
    clean = denoise(rgb, coverage)
    covered = clean[coverage]
    scale = float(max(np.percentile(covered.max(axis=1), 99.9), 1e-4))
    # sqrt 인코딩: 8비트에서 어두운 간접광의 계조를 지킨다. 런타임은 (x^2)*scale*pi로 복원.
    save_png(path, np.sqrt(np.clip(clean / scale, 0, 1)))
    print(f'ENCODED {path.name}: scale {scale:.4f}, covered mean {covered.mean():.4f}', flush=True)
    return {'scale': scale, 'encoding': 'sqrt(linear/scale) RGB8, top row first; runtime flipY, decode x*x*scale, lightMap intensity pi',
            'coveredMean': float(covered.mean())}


lights_encoding = {'file': '../lights-lightmap.png', **encode(args.output / 'lights-lightmap.png', passes['lights'])}
day_encodings = {}
for slot in slots:
    (args.output / slot['key']).mkdir(exist_ok=True)
    rgb = passes['sky'] * slot['sky'] * np.array(slot['skyTint'], dtype=np.float32) + passes['sun:' + slot['key']]
    day_encodings[slot['key']] = {'file': 'day-lightmap.png', **encode(args.output / slot['key'] / 'day-lightmap.png', rgb)}


# ---- 런타임용 UV와 매니페스트 --------------------------------------------------------------
uv_layer = mesh.uv_layers['Room lightmap'].data
values = np.empty(len(mesh.polygons) * 6, dtype=np.uint16)
cursor = 0
manifest_objects = []
face_index = 0
for plan in receiver_plans:
    count = len(plan['receiver'])
    manifest_objects.append({'hash': plan['hash'], 'triangles': count, 'offset': face_index, 'area': round(plan['area'], 4),
                             'name': plan['obj']['name'] or plan['obj']['geometry']})
    face_index += count
for polygon in mesh.polygons:
    for loop_index in polygon.loop_indices:
        u, v = uv_layer[loop_index].uv
        values[cursor] = round(min(1, max(0, u)) * 65535)
        values[cursor + 1] = round(min(1, max(0, v)) * 65535)
        cursor += 2
(args.output / 'uv.bin').write_bytes(values.astype('<u2').tobytes())
common = {
    'version': 2, 'kind': 'cafe-room',
    'source': args.source.name, 'sourceSha256': source_hash, 'sourceState': src['state'],
    'sourceCafeFloor': floor_y, 'sourceCafeCeiling': ceiling_y,
    'furnitureManifest': {name: hashlib.sha256((root / 'new' / name).read_bytes()).hexdigest() for name in FURNITURE_FILES},
    'box': BOX, 'snapshotRoomBox': room_box, 'triangles': total, 'area': round(sum(o['area'] for o in manifest_objects), 3),
    'objects': manifest_objects,
    'uv': {'file': '../uv.bin', 'format': 'uint16 little-endian u,v per triangle corner, receiver order; value/65535; shared by every slot'},
    'atlasSize': size, 'interiorLights': light_specs,
    'filter': {'excludedMaterials': sorted(PLANT_MATERIALS), 'glazing': 'glazing flag or transparent with opacity < 0.95',
               'box': 'all corners inside box', 'slabTop': 'centroid y > ceiling + 0.05 and normal y > 0.5',
               'slabBottom': 'centroid y < floor - 0.05 and normal y < -0.5',
               'hash': 'FNV-1a 32 over floor(world*1000 + 0.5) of every kept corner, in source triangle order'},
    'settings': {'engine': 'Cycles ' + args.device, 'samples': args.samples, 'bakeMargin': 4,
                 'world': 'neutral RGB .8, strength 1, scaled and tinted per slot after baking (linear)',
                 'day': 'sky direct+indirect x slot sky x slot tint + sun/moon indirect only',
                 'lights': 'cafe ceiling RectAreaLights as Cycles area lights, power = pi * intensity * area, direct+indirect, shared',
                 'diffuseBounces': 3, 'denoise': 'mask-normalised Gaussian sigma 1.1 px', 'seconds': round(time.time() - started, 1)},
    'limitations': [
        'Diffuse lighting only; specular reflections remain realtime approximations.',
        'Potted plants and glazing are excluded and stay on the realtime path.',
        'Emissive fixture diffusers are not light sources in the bake.',
        'Sun indirect assumes the snapshot surroundings; farther context is not an occluder.',
        'Valid only for this original app season/time button pair and the recorded structure/furniture state.',
        'Appearance study, not a daylight or illuminance validation.']}
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


# 파일 내용 해시: 런타임은 ?v=해시로 받아 캐시된 옛 파일과 섞이지 않게 한다.
common['uv']['sha256'] = digest(args.output / 'uv.bin')
lights_encoding['sha256'] = digest(args.output / 'lights-lightmap.png')
for key, encoding in day_encodings.items():
    encoding['sha256'] = digest(args.output / key / 'day-lightmap.png')
for slot in slots:
    manifest = {**common, 'slot': {'key': slot['key'], 'season': slot['season'], 'time': slot['time'], 'sunDirection': slot['sun'],
                                   'sunStrength': slot['sunStrength'], 'sunColorLinear': slot['sunColor'], 'sky': slot['sky'], 'skyTint': slot['skyTint']},
                'lightmaps': {'day': day_encodings[slot['key']], 'lights': lights_encoding}}
    (args.output / slot['key'] / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n')
bpy.ops.wm.save_as_mainfile(filepath=str((args.output / 'room-bake.blend').resolve()))
print(f'ROOM BAKE COMPLETE {args.output} in {time.time() - started:.1f}s', flush=True)
