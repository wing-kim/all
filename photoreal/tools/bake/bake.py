"""빛 굽기 2단계: export.mjs 가 만든 scene.glb 를 Blender Cycles 로 굽는다.

blender -b --factory-startup -P bake.py -- <입력폴더> <출력폴더> [--samples 96] [--res 256] [--slots am,pm,sunset,night] [--levels B3,B2,B1] [--cols 6]
--levels: bake-input.json 의 층 중 지정한 층만 굽고 그 층 수에 맞는 작은 아틀라스로 저장(변형 굽기). 생략하면 전부.

층마다 바닥판 바로 위(위를 봄)와 천장 바로 아래(아래를 봄)에 보이지 않는 판을 두고 그 판이 받는 빛(조도)을 굽는다.
- 낮(am·pm·sunset): 하늘빛 직접광 + 해·하늘의 반사광(간접). 해의 직사광은 실행 화면의 그림자 맵이 그리므로 뺀다.
- 야간·지하: 실내 조명기구(L_ 재질)의 직접광 + 간접광.
결과는 시간대마다 아틀라스 PNG 한 장(층 × 바닥·천장 타일)과 manifest.json(층 범위, 배율)이다.
실행 쪽은 화면의 표면 높이로 층을 찾고, 법선이 위면 바닥 타일, 아래면 천장 타일을 섞어 간접광으로 더한다.
평면 좌표만 쓰므로 외장을 바꿔도(같은 층 배치) 그대로 쓰고, 층고가 달라져도 가장 가까운 굽기를 늘려 쓴다.
"""
import bpy, sys, json, math, time
from pathlib import Path
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = Path(argv[0]), Path(argv[1])
opt = {'samples': 96, 'res': 256, 'slots': 'am,pm,sunset,night', 'levels': ''}
for i, a in enumerate(argv):
    if a.startswith('--'): opt[a[2:]] = argv[i + 1]
SAMPLES, RES, SLOTS = int(opt['samples']), int(opt['res']), opt['slots'].split(',')
dst.mkdir(parents=True, exist_ok=True)
info = json.loads((src / 'bake-input.json').read_text())
t0 = time.time()

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(src / 'scene.glb'))
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for d in prefs.devices: d.use = True
    sc.cycles.device = 'GPU'
except Exception as e:
    print('GPU 사용 불가, CPU', e)
sc.cycles.samples = SAMPLES
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 2; sc.cycles.transparent_max_bounces = 8
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.bake.margin = 4

# 재질 정리
LIGHT = []
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree; bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if m.name.startswith('G_') and bsdf:
        bsdf.inputs['Alpha'].default_value = 0.12          # 유리: 빛 대부분 통과(그림자 광선 포함)
        try: m.blend_method = 'BLEND'
        except Exception: pass
    elif m.name.startswith('L_') and bsdf:
        col = bsdf.inputs['Base Color'].default_value
        bsdf.inputs['Emission Color'].default_value = col
        LIGHT.append(bsdf)
    elif bsdf:
        bsdf.inputs['Specular IOR Level'].default_value = 0.25

# 하늘과 해
world = bpy.data.worlds.new('sky'); sc.world = world; world.use_nodes = True
wn = world.node_tree.nodes; bg = wn['Background']
sky = wn.new('ShaderNodeTexSky')
try: sky.sky_type = 'NISHITA'; sky.sun_disc = False
except Exception: pass
world.node_tree.links.new(sky.outputs['Color'], bg.inputs['Color'])
sun_obj = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun_obj)
sun_obj.data.angle = math.radians(0.6)

def three_to_blender(v):  # three (x, y, z) Y위 → Blender (x, -z, y) Z위
    return (v[0], -v[2], v[1])

def set_slot(slot, direct_pass):
    s = info['sun'][slot]
    night = s['night']
    d = three_to_blender(s['dir'])
    el = math.asin(max(-1, min(1, d[2]))); az = math.atan2(d[1], d[0])
    try:
        sky.sun_elevation = max(el, math.radians(1)); sky.sun_rotation = math.pi / 2 - az
    except Exception: pass
    # 세기: three(r128, 물리 보정 끔) 의 빛 세기 I 는 조도 πI 에 해당. 하늘은 낮에 해의 약 1/4 수준
    bg.inputs['Strength'].default_value = 0.0 if night else 0.18
    sun_obj.data.energy = 0 if night else math.pi * s['intensity']
    sun_obj.data.color = s['color'][:3]
    sun_obj.rotation_euler = (0, 0, 0)
    import mathutils
    sun_obj.rotation_euler = mathutils.Vector(d).to_track_quat('Z', 'Y').to_euler()
    lit = 9.0 if night else 3.0
    for b in LIGHT: b.inputs['Emission Strength'].default_value = lit
    # 직접광 단계에서는 해를 끄고(실행 화면이 그림자와 함께 그림), 간접광 단계에서는 켠다
    sun_obj.hide_render = (direct_pass or night)

# 굽기 판
levels = [L for L in info['levels'] if L['kind'] != 'roof' and (not opt['levels'] or L['key'] in opt['levels'].split(','))]
assert levels, '굽을 층 없음'
planes = []
for L in levels:
    x0, z0, x1, z1 = L['box']
    for face in ('floor', 'ceil'):
        y = L['floor'] + 0.05 if face == 'floor' else L['ceil'] - 0.05
        cx, cz, w, d = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0
        bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, -cz, y))
        o = bpy.context.active_object; o.scale = (w, d, 1); o.name = f"{L['key']}_{face}"
        if face == 'ceil': o.rotation_euler = (math.pi, 0, 0)   # 아래를 봄(뒤집으면 v 축이 뒤집힌다 → 저장 때 맞춤)
        for attr in ('visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_shadow', 'visible_volume_scatter'):
            if hasattr(o, attr): setattr(o, attr, False)
        img = bpy.data.images.new(o.name, RES, RES, float_buffer=True)
        mat = bpy.data.materials.new(o.name); mat.use_nodes = True
        # 굽기 대상 면에는 확산 셰이더가 있어야 한다(흰색, 결과는 색이 빠진 조도). 이미지 노드는 연결하지 않고 활성으로만 둔다
        mn = mat.node_tree.nodes; dif = mn.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
        outn = next(n for n in mn if n.type == 'OUTPUT_MATERIAL'); [mn.remove(n) for n in list(mn) if n.type == 'BSDF_PRINCIPLED']
        mat.node_tree.links.new(dif.outputs[0], outn.inputs['Surface'])
        tn = mn.new('ShaderNodeTexImage'); tn.image = img; mat.node_tree.nodes.active = tn
        o.data.materials.append(mat)
        planes.append((L, face, o, img))

def bake(filt):
    bpy.ops.object.select_all(action='DESELECT')
    for _, _, o, _ in planes: o.select_set(True)
    bpy.context.view_layer.objects.active = planes[0][2]
    bpy.ops.object.bake(type='DIFFUSE', pass_filter=filt, use_clear=True, margin=4)
    res = {o.name: np.array(img.pixels[:], dtype=np.float32).reshape(RES, RES, 4)[:, :, :3].copy() for _, _, o, img in planes}
    print('  bake', sorted(filt), ' '.join(f"{k}:{v.mean():.3f}" for k, v in list(res.items())[:6]), flush=True)
    return res

base_keys = {L['key'] for L in levels if L['kind'] == 'base'}
cache_base = None
manifest = {'res': RES, 'cols': 0, 'rows': 0, 'levels': [], 'slots': {}, 'samples': SAMPLES, 'state': info.get('state')}
cols = min(int(opt.get('cols', 6)), len(levels) * 2); rows = math.ceil(len(levels) * 2 / cols)
manifest['cols'], manifest['rows'] = cols, rows
for i, L in enumerate(levels):
    manifest['levels'].append({'key': L['key'], 'kind': L['kind'], 'floor': L['floor'], 'ceil': L['ceil'], 'box': L['box'], 'tile': [2 * i, 2 * i + 1]})

for slot in SLOTS:
    ts = time.time()
    night = info['sun'][slot]['night']
    if night:
        set_slot(slot, True); E = bake({'DIRECT', 'INDIRECT'})
    else:
        set_slot(slot, False); A = bake({'INDIRECT'})       # 해·하늘·조명의 반사광
        set_slot(slot, True); B = bake({'DIRECT'})          # 하늘·조명의 직접광(해 직사광 제외)
        E = {k: A[k] + B[k] for k in A}
    # 지하는 시간대와 무관: 야간 조명 기준 한 번만(낮 슬롯에서도 같은 값)
    if base_keys and (night or cache_base is None):
        if not night:
            set_slot('night', True); N = bake({'DIRECT', 'INDIRECT'}); cache_base = {k: v for k, v in N.items() if k.split('_')[0] in base_keys}
        else:
            cache_base = {k: v for k, v in E.items() if k.split('_')[0] in base_keys}
    for k, v in (cache_base or {}).items(): E[k] = v
    atlas = np.zeros((rows * RES, cols * RES, 3), np.float32)
    for i, L in enumerate(levels):
        for j, face in enumerate(('floor', 'ceil')):
            t = 2 * i + j; r, c = t // cols, t % cols
            img = E[f"{L['key']}_{face}"]
            for _ in range(3):   # 조도는 부드럽게 변하므로 작은 상자 흐림 세 번(가우스 근사)으로 표본 잡음을 줄인다
                img = (np.roll(img, 1, 0) + img + np.roll(img, -1, 0)) / 3; img = (np.roll(img, 1, 1) + img + np.roll(img, -1, 1)) / 3
            if face == 'ceil': img = img[::-1]   # 뒤집은 판의 v 축을 바닥과 같게
            atlas[r * RES:(r + 1) * RES, c * RES:(c + 1) * RES] = img
    scale = float(np.percentile(atlas, 99.7)) or 1.0
    enc = np.clip(atlas / scale, 0, 1) ** (1 / 2.2)
    out = bpy.data.images.new('atlas_' + slot, cols * RES, rows * RES)
    rgba = np.concatenate([enc, np.ones(enc.shape[:2] + (1,), np.float32)], axis=2)
    out.pixels[:] = rgba.ravel()
    out.filepath_raw = str(dst / f'bake-{slot}.png'); out.file_format = 'PNG'; out.save()
    manifest['slots'][slot] = {'file': f'bake-{slot}.png', 'scale': scale, 'gamma': 2.2, 'seconds': round(time.time() - ts, 1)}
    print('slot', slot, 'scale', round(scale, 3), 'sec', round(time.time() - ts, 1), flush=True)

manifest['seconds'] = round(time.time() - t0, 1)
(dst / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
print('done', manifest['seconds'])
