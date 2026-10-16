"""Bake source-mesh ambient irradiance for the cafe floor and ceiling.

blender --background --factory-startup --python bake-cafe-ambient.py -- \
  cafe-ambient-source.json.gz /tmp/kapehorn-ambient-proof --size 256 --samples 32

This is an offline proof. The filtered linear PNGs can be used by the opt-in
ambientBake=study viewer after manifest and source-key checks pass.
"""
import argparse
import gzip
import hashlib
import json
import math
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import bpy
from mathutils import Matrix, Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cafe_ambient_receivers import discover_receivers, source_faces


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--size', type=int, default=256)
    parser.add_argument('--samples', type=int, default=32)
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:])


args = arguments()
assert args.size in (256, 512), 'Proof atlas must be 256 or 512 pixels'
assert 1 <= args.samples <= 256
args.output.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
with (gzip.open(args.source, 'rt') if args.source.suffix == '.gz' else args.source.open()) as stream:
    src = json.load(stream)
assert src['version'] == 2 and not src['skipped'], 'Incomplete or unexpected source snapshot'
objects = {obj['geometry']: obj for obj in src['objects']}
assert len(objects) == len(src['objects']), 'Geometry keys must uniquely identify source objects'
assert abs(src['floor'] - .07) < .001 and abs(src['ceiling'] - 5.02) < .001
receiver_specs = discover_receivers(src)
root = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
axis = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 0
scene.cycles.transmission_bounces = 4
scene.render.bake.margin = 2
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = False
world = bpy.data.worlds.new('Neutral ambient sky')
world.use_nodes = True
world.node_tree.nodes.get('Background').inputs['Color'].default_value = (.8, .8, .8, 1)
world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 1
scene.world = world
material_cache = {}
texture_used, texture_missing, normalized_groups = [], [], Counter()


def local_texture(url):
    if not url:
        return None
    path = root / urlparse(url).path.lstrip('/')
    if path.is_file():
        texture_used.append(str(path.relative_to(root)))
        return path
    texture_missing.append(url)
    return None


def source_material(key):
    if key in material_cache:
        return material_cache[key]
    data = src['materials'][key]
    material = bpy.data.materials.new(data['name'] or key)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*[min(1, max(0, x)) for x in data['color']], 1)
    bsdf.inputs['Roughness'].default_value = data.get('roughness', .7)
    bsdf.inputs['Metallic'].default_value = data.get('metalness', 0)
    bsdf.inputs['Emission Strength'].default_value = 0
    if path := local_texture(data.get('map')):
        image = bpy.data.images.load(str(path), check_existing=True)
        node = nodes.new('ShaderNodeTexImage')
        node.image = image
        source_uv = nodes.new('ShaderNodeUVMap')
        source_uv.uv_map = 'Source UV'
        links.new(source_uv.outputs['UV'], node.inputs['Vector'])
        tint = nodes.new('ShaderNodeMixRGB')
        tint.blend_type = 'MULTIPLY'
        tint.inputs[0].default_value = 1
        tint.inputs[1].default_value = (*[min(1, max(0, x)) for x in data['color']], 1)
        links.new(node.outputs['Color'], tint.inputs[2])
        links.new(tint.outputs[0], bsdf.inputs['Base Color'])
    # Approximate translucent glazing for ambient visibility. No direct sun exists.
    if data.get('glazing') or data.get('transparent'):
        transparent = nodes.new('ShaderNodeBsdfTransparent')
        mix = nodes.new('ShaderNodeMixShader')
        mix.inputs[0].default_value = 1 - min(1, max(0, data.get('opacity', 1)))
        links.new(bsdf.outputs['BSDF'], mix.inputs[1])
        links.new(transparent.outputs[0], mix.inputs[2])
        output = nodes.get('Material Output')
        links.new(mix.outputs[0], output.inputs['Surface'])
    material_cache[key] = material
    return material


def transform(matrix):
    return axis @ Matrix([matrix[i:i + 4] for i in range(0, 16, 4)]).transposed()


def face_material(geometry, obj, offset):
    index = next((group['materialIndex'] for group in geometry['groups']
                  if group['start'] <= offset < group['start'] + group['count']), 0)
    if len(obj['materials']) == 1:
        if index:
            normalized_groups[index] += 1
        index = 0  # Three ignores groups on a Mesh with one material.
    if index >= len(obj['materials']):
        raise ValueError(f"Invalid material group: {obj['geometry']} face {offset // 3} slot {index}")
    return index


receiver_offsets, receiver_areas, receiver_triangles = {}, {}, {}
for name, (key, height, facing) in receiver_specs.items():
    obj, geometry = objects[key], src['geometries'][key]
    matrix = Matrix([obj['matrix'][i:i + 4] for i in range(0, 16, 4)]).transposed()
    positions = geometry['position']
    selected, triangle_keys = [], []
    area = 0
    for offset, face in source_faces(geometry):
        world_points = [matrix @ Vector((positions[3 * i], positions[3 * i + 1], positions[3 * i + 2], 1)) for i in face]
        if any(abs(v.y - height) > .001 for v in world_points):
            continue
        a, b, c = world_points
        cross = (b - a).to_3d().cross((c - a).to_3d())
        if cross.y * facing <= 0 or abs(cross.y) < .0001:
            continue
        selected.append(offset)
        triangle_keys.append('|'.join(sorted(','.join(f'{0 if abs(value) < .00005 else value:.4f}' for value in vertex[:3]) for vertex in world_points)))
        area += abs(cross.y) / 2
    required = 300 if name == 'floor' else 350
    assert area > required and len(selected) >= 10, f'{name} receiver mismatch: {len(selected)} faces, {area:.2f} m²'
    receiver_offsets[key] = set(selected)
    receiver_areas[name] = area
    receiver_triangles[name] = sorted(triangle_keys)
    print(f'RECEIVER {name}: {key}, {len(selected)} source triangles, {area:.2f} m²', flush=True)


def make_mesh(obj, offsets, name):
    geometry = src['geometries'][obj['geometry']]
    position = geometry['position']
    vertices = list(zip(position[0::3], position[1::3], position[2::3]))
    faces = []
    slots = []
    for offset, face in source_faces(geometry):
        if offset not in offsets:
            continue
        faces.append(face)
        slots.append(face_material(geometry, obj, offset))
    if not faces:
        return None
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    for material_key in obj['materials']:
        mesh.materials.append(source_material(material_key))
    for polygon, slot in zip(mesh.polygons, slots):
        polygon.material_index = slot
    texture_uv = geometry.get('uv')
    if texture_uv:
        layer = mesh.uv_layers.new(name='Source UV')
        for loop in mesh.loops:
            i = loop.vertex_index * 2
            layer.data[loop.index].uv = (texture_uv[i], texture_uv[i + 1])
    mesh.update()
    result = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(result)
    result.matrix_world = transform(obj['matrix'])
    return result


receivers = {}
for obj in src['objects']:
    key = obj['geometry']
    geometry = src['geometries'][key]
    all_offsets = {offset for offset, _ in source_faces(geometry)}
    selected = receiver_offsets.get(key, set())
    if selected:
        receiver = make_mesh(obj, selected, 'Ambient receiver ' + key)
        receivers[next(name for name, spec in receiver_specs.items() if spec[0] == key)] = receiver
    occluder = make_mesh(obj, all_offsets - selected, obj['name'] or key)
    if occluder is None and not selected:
        raise ValueError('Source object yielded no triangles: ' + key)

assert not texture_missing, f'Unresolved albedo textures: {texture_missing}'
furniture_files = ['360/cafe.js', '360/environment.js', '360/assets/interior-foliage.glb',
                   '360/assets/modern-arm-chair/modern-arm-chair.gltf',
                   '360/assets/modern-arm-chair/modern_arm_chair_01.bin',
                   '360/assets/dining-chair-02/dining-chair.gltf',
                   '360/assets/dining-chair-02/dining_chair_02.bin']
furniture_manifest = {name: hashlib.sha256((root / 'new' / name).read_bytes()).hexdigest() for name in furniture_files}
proof = {'source': str(args.source), 'sourceSha256': source_hash,
         'sourceObjects': len(src['objects']), 'sourceVertices': src['vertices'],
         'sourceSkipped': src['skipped'], 'sourceState': src['state'],
         'sourceCafeFloor': src['floor'], 'sourceCafeCeiling': src['ceiling'],
         'furnitureManifest': furniture_manifest, 'receiverGeometry': {},
         'singleMaterialGroupIndexNormalized': dict(normalized_groups),
         'localAlbedoTextures': sorted(set(texture_used)),
         'settings': {'engine': 'Cycles CPU', 'samples': args.samples, 'atlasSize': args.size,
                      'bake': 'DIFFUSE direct+indirect, color OFF', 'world': 'neutral RGB .8, strength 1',
                      'sun': 'none', 'emission': 'off', 'fixedFillLights': 'none',
                      'diffuseBounces': 3, 'transmissionBounces': 4,
                      'runtimeLightMapIntensity': math.pi,
                      'radianceConvention': 'Cycles diffuse/color-off gives outgoing white Lambert radiance; Three PhysicalLightingModel lightMap takes irradiance. Unit-world plane test baked 1, so runtime multiplies by pi.'},
         'limitations': ['Glazing uses source opacity as a transparent/opaque shader mix, not physically calibrated glass.',
                         'Texture UVs are exported, but map repeat/offset/rotation are absent; albedo projection is approximate.',
                         'Normal maps and one alpha-tested material are not represented in the bake shaders.',
                         'Only the largest coplanar source floor and ceiling meshes are receivers; raised finish patches are not baked.',
                         'Nearby exterior assets and non-receiver occluder geometry are not fully fingerprinted by the runtime key.',
                         'Irradiance is ambient-only and independent of source time/season; daylight-specific effects remain dynamic.',
                         'This is a non-quantitative opt-in appearance study, not a daylight or illuminance validation.']}


def save_linear_png(path, pixels, size):
    # Raw linear RGB8. No sRGB/gAMA chunk; runtime reads it with NoColorSpace.
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    rows = bytearray()
    for y in range(size - 1, -1, -1):
        rows.append(0)
        for x in range(size):
            start = (y * size + x) * 4
            rows.extend(round(min(1, max(0, pixels[start + c])) * 255) for c in range(3))
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('!IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(rows), 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)


def denoise_linear_atlas(pixels, size):
    """Edge-aware separable filter over covered texels; preserve transparent atlas margins."""
    radius, sigma_space, sigma_range = 4, 2.0, .22
    spatial = [math.exp(-offset * offset / (2 * sigma_space * sigma_space))
               for offset in range(-radius, radius + 1)]
    current = list(pixels)
    covered = [current[index * 4] > .001 for index in range(size * size)]
    for vertical in (False, True):
        result = current[:]
        for y in range(size):
            for x in range(size):
                pixel = y * size + x
                if not covered[pixel]:
                    continue
                base = pixel * 4
                center = current[base]
                total = [0.0, 0.0, 0.0]
                weight_sum = 0.0
                for offset in range(-radius, radius + 1):
                    nx, ny = (x, y + offset) if vertical else (x + offset, y)
                    if nx < 0 or nx >= size or ny < 0 or ny >= size:
                        continue
                    neighbor = ny * size + nx
                    if not covered[neighbor]:
                        continue
                    sample = neighbor * 4
                    difference = current[sample] - center
                    weight = spatial[offset + radius] * math.exp(
                        -difference * difference / (2 * sigma_range * sigma_range))
                    weight_sum += weight
                    for channel in range(3):
                        total[channel] += current[sample + channel] * weight
                for channel in range(3):
                    result[base + channel] = total[channel] / weight_sum
        current = result
    return current

for name, receiver in receivers.items():
    selected = receiver_offsets[receiver_specs[name][0]]
    mesh = receiver.data
    # Planar UVs on the exact original triangles. Floor and ceiling each use their own atlas.
    points = [receiver.matrix_world @ vertex.co for vertex in mesh.vertices]
    used = {loop.vertex_index for loop in mesh.loops}
    xmin, xmax = min(points[i].x for i in used), max(points[i].x for i in used)
    ymin, ymax = min(points[i].y for i in used), max(points[i].y for i in used)
    atlas = mesh.uv_layers.new(name='Ambient atlas')
    mesh.uv_layers.active = atlas
    for loop in mesh.loops:
        point = points[loop.vertex_index]
        atlas.data[loop.index].uv = (.02 + .96 * (point.x - xmin) / (xmax - xmin),
                                     .02 + .96 * (point.y - ymin) / (ymax - ymin))
    image = bpy.data.images.new(name + ' ambient irradiance', width=args.size, height=args.size, alpha=False, float_buffer=True)
    image.colorspace_settings.name = 'Non-Color'
    for material in mesh.materials:
        node = material.node_tree.nodes.new('ShaderNodeTexImage')
        node.name = 'Ambient bake target ' + name
        node.image = image
        material.node_tree.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT')
    receiver.select_set(True)
    bpy.context.view_layer.objects.active = receiver
    scene.render.bake.target = 'IMAGE_TEXTURES'
    bpy.ops.object.bake(type='DIFFUSE')
    path = args.output / (name + '-ambient.exr')
    image.filepath_raw = str(path)
    image.file_format = 'OPEN_EXR'
    image.save()
    pixels = list(image.pixels)
    red = pixels[0::4]
    covered = [value for value in red if value > .001]
    assert len(covered) > args.size * args.size * .2 and max(covered) > min(covered) + .05, f'{name} bake is blank or flat'
    filtered = denoise_linear_atlas(pixels, args.size)
    linear = args.output / (name + '-ambient-linear.png')
    save_linear_png(linear, filtered, args.size)
    preview = args.output / (name + '-ambient-preview.png')
    image.pixels.foreach_set(filtered)
    image.update()
    image.filepath_raw = str(preview)
    image.file_format = 'PNG'
    image.save()
    proof['receiverGeometry'][name] = {'geometryKey': receiver_specs[name][0], 'faceOffsets': sorted(selected),
                                        'triangleCount': len(selected), 'areaSquareMeters': receiver_areas[name],
                                        'triangleKeys': receiver_triangles[name],
                                        'atlasBoundsXY': [xmin, ymin, xmax, ymax], 'image': path.name,
                                        'runtimeImage': linear.name, 'runtimeEncoding': 'linear RGB8 divided by 255; NoColorSpace; lightMapIntensity pi',
                                        'runtimeFilter': 'separable bilateral radius 4px, spatial sigma 2px, linear-red range sigma 0.22; uncovered atlas texels excluded',
                                        'preview': preview.name, 'redChannelCoveredPixels': len(covered),
                                        'redChannelCoveredMinMaxMean': [min(covered), max(covered), sum(covered) / len(covered)]}
    print(f'BAKED {name}: {path}', flush=True)

(args.output / 'manifest.json').write_text(json.dumps(proof, indent=2, ensure_ascii=False) + '\n')
print('AMBIENT PROOF COMPLETE', args.output, flush=True)
