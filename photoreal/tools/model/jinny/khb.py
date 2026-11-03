# Shared Blender helpers for the env building models (imported by tools/build_*.py, run inside Blender).
# Geometry goes into one bmesh; material slots are named after tools/materials.json, and the page swaps
# in its shared materials by those names, so the exported GLB carries geometry + UVs only (no images).
import bpy, bmesh, json, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = {k: v for k, v in json.load(open(os.path.join(HERE, 'materials.json'), encoding='utf-8')).items() if not k.startswith('_')}


class Builder:
    def __init__(self, name, keep=False):
        if not keep:
            for o in list(bpy.data.objects): bpy.data.objects.remove(o)
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')
        self.mats = []

    def mi(self, m):
        assert m in LIB, m
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)

    # ---- faces -------------------------------------------------------------
    def face(self, pts, m, uvs=None, smooth=False, x0=0.0):
        """pts in metres (Blender: x east, y north, z up). uvs in metres; default = planar projection by normal."""
        vs = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(vs); f.material_index = self.mi(m); f.smooth = smooth; f.normal_update()
        t = LIB[m].get('tile', 1.0)
        for i, l in enumerate(f.loops):
            if uvs: u, v = uvs[i]
            else:
                p, n = l.vert.co, f.normal
                if abs(n.z) >= max(abs(n.x), abs(n.y)): u, v = p.x - x0, p.y
                elif abs(n.x) >= abs(n.y): u, v = p.y, p.z
                else: u, v = p.x - x0, p.z
            l[self.uv].uv = (u / t, v / t)
        return f

    def box(self, x0, x1, y0, y1, z0, z1, m, skip=()):
        c = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        sides = {'-z': (0, 3, 2, 1), '+z': (4, 5, 6, 7), '-y': (0, 1, 5, 4), '+x': (1, 2, 6, 5), '+y': (2, 3, 7, 6), '-x': (3, 0, 4, 7)}
        for k, idx in sides.items():
            if k not in skip: self.face([c[i] for i in idx], m)

    def prism(self, outline, z0, z1, m, walls=True, top=True, bottom=True, smooth=False):
        """vertical extrusion of a CCW plan outline [(x,y)]"""
        if top: self.face([(x, y, z1) for x, y in outline], m)
        if bottom: self.face([(x, y, z0) for x, y in reversed(outline)], m)
        if walls:
            for i in range(len(outline)):
                (ax, ay), (bx, by) = outline[i], outline[(i + 1) % len(outline)]
                self.face([(ax, ay, z0), (bx, by, z0), (bx, by, z1), (ax, ay, z1)], m, smooth=smooth)

    # ---- walls along a plan edge -------------------------------------------
    def frame_of(self, a, b):
        """edge frame: origin a, unit u along a→b, unit n outward (right of a→b for a CCW outline), length"""
        a, b = Vector((*a, 0)), Vector((*b, 0))
        L = (b - a).length; u = (b - a) / L; n = Vector((u.y, -u.x, 0))
        return a, u, n, L

    def at(self, E, s, o, z):
        a, u, n, _ = E
        return tuple(a + u * s + n * o + Vector((0, 0, z)))

    def quad(self, E, s0, s1, z0, z1, o, m, u0=0.0):
        """facade-aligned quad facing out, at offset o (m, + = outward); UV u runs along the edge from u0"""
        return self.face([self.at(E, s0, o, z0), self.at(E, s1, o, z0), self.at(E, s1, o, z1), self.at(E, s0, o, z1)], m,
                         uvs=[(u0 + s0, z0), (u0 + s1, z0), (u0 + s1, z1), (u0 + s0, z1)])

    def slab(self, E, s0, s1, z0, z1, o0, o1, m, u0=0.0, ends=True):
        """box aligned to the edge: along s0..s1, height z0..z1, depth from o0 (inner) to o1 (outer)"""
        self.quad(E, s0, s1, z0, z1, o1, m, u0)
        self.face([self.at(E, s0, o0, z1), self.at(E, s0, o1, z1), self.at(E, s1, o1, z1), self.at(E, s1, o0, z1)], m)
        self.face([self.at(E, s0, o0, z0), self.at(E, s1, o0, z0), self.at(E, s1, o1, z0), self.at(E, s0, o1, z0)], m)
        if ends:
            self.face([self.at(E, s0, o0, z0), self.at(E, s0, o1, z0), self.at(E, s0, o1, z1), self.at(E, s0, o0, z1)], m,
                      uvs=[(o0, z0), (o1, z0), (o1, z1), (o0, z1)])
            self.face([self.at(E, s1, o1, z0), self.at(E, s1, o0, z0), self.at(E, s1, o0, z1), self.at(E, s1, o1, z1)], m,
                      uvs=[(o1, z0), (o0, z0), (o0, z1), (o1, z1)])

    def wall(self, E, z0, z1, m, openings=(), u0=0.0, s0=0.0, s1=None):
        """flat wall on the edge plane with rectangular holes; openings: dicts with s0,s1,z0,z1
        (+ kind 'win'/'shop'/'void', depth, glass, frame, mull = number of panes).
        Holes get reveals, recessed glass and frames."""
        s1 = E[3] if s1 is None else s1
        ss = sorted({s0, s1, *[o['s0'] for o in openings], *[o['s1'] for o in openings]})
        zz = sorted({z0, z1, *[o['z0'] for o in openings], *[o['z1'] for o in openings]})
        solid = lambda i, j: not any(o['s0'] < (ss[i] + ss[i + 1]) / 2 < o['s1'] and o['z0'] < (zz[j] + zz[j + 1]) / 2 < o['z1'] for o in openings)
        rows = []                                    # solid runs per height band, merged along the wall ...
        for j in range(len(zz) - 1):
            i, runs = 0, []
            while i < len(ss) - 1:
                if solid(i, j):
                    k = i
                    while k + 1 < len(ss) - 1 and solid(k + 1, j): k += 1
                    runs.append((ss[i], ss[k + 1])); i = k + 1
                else: i += 1
            rows.append([zz[j], zz[j + 1], runs])
        merged = []                                  # ... and stacked bands with identical runs merged upward
        for r in rows:
            if merged and merged[-1][2] == r[2] and merged[-1][1] == r[0]: merged[-1][1] = r[1]
            else: merged.append(r)
        for z0_, z1_, runs in merged:
            for a, b in runs: self.quad(E, a, b, z0_, z1_, 0, m, u0)
        for o in openings: self.opening(E, o, m)

    def opening(self, E, o, m):
        d = o.get('depth', .15); a0, a1, b0, b1 = o['s0'], o['s1'], o['z0'], o['z1']
        rv = o.get('reveal', m)
        # reveals (sill faces up, head faces down, jambs face into the hole)
        self.face([self.at(E, a0, 0, b0), self.at(E, a1, 0, b0), self.at(E, a1, -d, b0), self.at(E, a0, -d, b0)], rv)
        self.face([self.at(E, a0, 0, b1), self.at(E, a0, -d, b1), self.at(E, a1, -d, b1), self.at(E, a1, 0, b1)], rv)
        self.face([self.at(E, a0, 0, b0), self.at(E, a0, -d, b0), self.at(E, a0, -d, b1), self.at(E, a0, 0, b1)], rv)
        self.face([self.at(E, a1, -d, b0), self.at(E, a1, 0, b0), self.at(E, a1, 0, b1), self.at(E, a1, -d, b1)], rv)
        if o.get('kind') == 'void': return
        self.quad(E, a0, a1, b0, b1, -d, o.get('glass', 'glass'))
        if o.get('frame', 'frame_grey') is None: return          # light version: recessed glass only
        fr, t = o.get('frame', 'frame_grey'), .05
        n = o.get('mull', 2)
        for k in range(n + 1):
            s = a0 + (a1 - a0) * k / n
            self.slab(E, max(a0, s - t), min(a1, s + t), b0, b1, -d, -d + .05, fr)
        self.slab(E, a0, a1, b0, b0 + .06, -d, -d + .05, fr); self.slab(E, a0, a1, b1 - .06, b1, -d, -d + .05, fr)
        if o.get('transom'): self.slab(E, a0, a1, o['transom'] - .03, o['transom'] + .03, -d, -d + .05, fr)

    # ---- output ------------------------------------------------------------
    def finish(self):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-5)
        me = bpy.data.meshes.new(self.name); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(blender_material(m))
        ob = bpy.data.objects.new(self.name, me); bpy.context.collection.objects.link(ob)
        return ob

    def export(self, ob, path):
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_image_format='NONE', export_yup=True,
                                  export_apply=True, export_normals=True, export_texcoords=True, use_selection=False)
        print('EXPORTED', path, len(ob.data.polygons), 'faces', self.mats)


def blender_material(name):
    """preview material from the library (display colours → linear for Cycles)"""
    if name in bpy.data.materials: return bpy.data.materials[name]
    d = LIB[name]; m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    lin = [c ** 2.2 for c in d.get('color', [1, 1, 1])]
    b.inputs['Base Color'].default_value = (*lin, 1)
    b.inputs['Roughness'].default_value = d.get('rough', .8); b.inputs['Metallic'].default_value = d.get('metal', 0)
    tex = os.path.join(HERE, 'tex')
    if d.get('map'):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(tex, d['map'] + '.jpg'), check_existing=True)
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
        mix.inputs['A'].default_value = (1, 1, 1, 1); mix.inputs['B'].default_value = (*lin, 1)
        nt.links.new(t.outputs['Color'], mix.inputs['A']); nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    if d.get('opacity'): b.inputs['Alpha'].default_value = d['opacity']
    if d.get('alpha'):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(tex, d['alpha'] + '.jpg'), check_existing=True)
        t.image.colorspace_settings.name = 'Non-Color'; nt.links.new(t.outputs['Color'], b.inputs['Alpha'])
    if d.get('normal'):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(tex, d['normal'] + '.jpg'), check_existing=True)
        t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = d.get('nstr', 1)
        nt.links.new(t.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m


def preview(path, cam_loc, look_at, lens=24, size=(1100, 900), sun=(50, 0, -35)):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = size
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (.75, .8, .88, 1)
    s = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(s)
    s.data.energy = 3.0; s.rotation_euler = [math.radians(a) for a in sun]
    g = bpy.data.meshes.new('g'); gb = bmesh.new()
    bmesh.ops.create_grid(gb, x_segments=1, y_segments=1, size=200); gb.to_mesh(g); gb.free()
    sc.collection.objects.link(bpy.data.objects.new('ground', g))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = lens; cam.location = cam_loc
    cam.rotation_euler = (Vector(look_at) - Vector(cam_loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def bake_maps(ob, path, size=1024, top=None, samples=64, grime=True, occluders=(), spheres=(), sun=(-.5, .45, .75)):
    """렌더-mode maps on a second UV set ('AO' → glTF TEXCOORD_1 → three.js uv2), the way games bake static lighting:
      <id>_ao.png  R = ambient occlusion, G = grime multiplier on the albedo (1 when grime=False)
      <id>_lm.png  lightmap: irradiance from the sky (direct + bounces) plus the sun's bounce light only. The page keeps the
                   sun itself and its shadows realtime, so time of day still works ("baked indirect" / mixed lighting).
                   Stored as sqrt(irradiance / 2) so darks keep precision; the page squares it back.
    Both saved as PNG (tools/pack_web.py turns them into JPEGs). occluders = [(outline, z0, z1)] and spheres = [(x, y, z, r)]
    in the object's frame: neighbours and tree crowns that shade and bounce light but are not baked themselves.
    Grime is procedural: splash zone at the base, rain streaks on walls (stronger under the parapet), dirt on up-facing ledges,
    and a faint large-scale blotch."""
    import numpy as np
    sc = bpy.context.scene; me = ob.data
    top = top if top is not None else max(v.co.z for v in me.vertices)
    # lightmap UVs
    uv0 = me.uv_layers[0]; ao = me.uv_layers.new(name='AO'); me.uv_layers.active = ao
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    # bake surroundings: dark grey ground, neighbour prisms, tree crowns (not baked themselves)
    def grey(name, v):
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (v, v, v * .95, 1); b.inputs['Roughness'].default_value = 1
        return m
    extra = []
    def add(name, fill, mat):
        me2 = bpy.data.meshes.new(name); bm2 = bmesh.new(); fill(bm2); bm2.to_mesh(me2); bm2.free()
        me2.materials.append(mat); o = bpy.data.objects.new(name, me2); sc.collection.objects.link(o); extra.append(o); return o
    c = ob.matrix_world.translation
    gro = add('bake_ground', lambda b: bmesh.ops.create_grid(b, x_segments=1, y_segments=1, size=150), grey('bake_ground', .2))
    gro.location = (c.x, c.y, -0.002)
    wall = grey('bake_wall', .55)
    for k, (outline, z0, z1) in enumerate(occluders):
        def fill(b, outline=outline, z0=z0, z1=z1):
            lo = [b.verts.new((x, y, z0)) for x, y in outline]; hi = [b.verts.new((x, y, z1)) for x, y in outline]
            b.faces.new(list(reversed(lo))); b.faces.new(hi)
            for i in range(len(lo)): b.faces.new([lo[i], lo[(i + 1) % len(lo)], hi[(i + 1) % len(lo)], hi[i]])
            bmesh.ops.recalc_face_normals(b, faces=b.faces[:])
        add(f'bake_occ{k}', fill, wall)
    leaf = grey('bake_leaf', .12)
    for k, (x, y, z, r) in enumerate(spheres):
        o = add(f'bake_tree{k}', lambda b: bmesh.ops.create_icosphere(b, subdivisions=2, radius=1), leaf)
        o.location = (x, y, z); o.scale = (r, r, r * .7)
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    if not sc.world: sc.world = bpy.data.worlds.new('w')
    w = sc.world; w.use_nodes = True; w.light_settings.distance = 2.2
    sc.render.bake.margin = 6; sc.render.bake.use_clear = True; sc.render.bake.target = 'IMAGE_TEXTURES'
    img = bpy.data.images.new('bake_' + ob.name, size, size, alpha=False, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    saved = []
    for m in me.materials:
        nt = m.node_tree; t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; t.name = '_bake'
        nt.nodes.active = t; t.select = True
        out = nt.nodes['Material Output']; lk = out.inputs['Surface'].links
        saved.append((m, lk[0].from_socket if lk else None))

    def bake(kind, **kw):
        bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type=kind, **kw)
        return np.array(img.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., :3].copy()

    a = bake('AO')[..., 0]
    # lightmap 1: sky only (gradient, brighter blue at the zenith), direct + indirect, without albedo
    wn = w.node_tree.nodes; wl = w.node_tree.links
    for n in list(wn):
        if n.type != 'OUTPUT_WORLD': wn.remove(n)
    tc = wn.new('ShaderNodeTexCoord'); sep = wn.new('ShaderNodeSeparateXYZ'); ramp = wn.new('ShaderNodeValToRGB'); bg = wn.new('ShaderNodeBackground')
    wl.new(tc.outputs['Generated'], sep.inputs[0]); wl.new(sep.outputs['Z'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].color = (.78, .82, .86, 1); ramp.color_ramp.elements[1].color = (.46, .58, .82, 1)
    wl.new(ramp.outputs['Color'], bg.inputs['Color']); wl.new(bg.outputs[0], [n for n in wn if n.type == 'OUTPUT_WORLD'][0].inputs['Surface'])
    sc.render.bake.use_pass_color = False
    sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True
    lm = bake('DIFFUSE')
    # lightmap 2: the sun's bounce light only (sun from the south-west, a typical afternoon)
    bg.inputs['Strength'].default_value = 0
    sl = bpy.data.objects.new('bake_sun', bpy.data.lights.new('bake_sun', 'SUN')); sc.collection.objects.link(sl); extra.append(sl)
    sl.data.energy = 2.5; sl.rotation_euler = Vector(sun).normalized().to_track_quat('Z', 'Y').to_euler()
    sc.render.bake.use_pass_direct = False
    lm = lm + bake('DIFFUSE')
    sc.render.bake.use_pass_direct = True
    bg.inputs['Strength'].default_value = 1
    if grime:                                            # grime shader → emission
        for m, _ in saved:
            nt = m.node_tree; N = nt.nodes.new; L = nt.links.new
            geo = N('ShaderNodeNewGeometry'); pos = N('ShaderNodeSeparateXYZ'); nrm = N('ShaderNodeSeparateXYZ')
            L(geo.outputs['Position'], pos.inputs[0]); L(geo.outputs['Normal'], nrm.inputs[0])
            def math_(op, a_, b_=None, clamp=False):
                n = N('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
                for i, v in enumerate((a_, b_)):
                    if v is None: continue
                    if isinstance(v, (int, float)): n.inputs[i].default_value = v
                    else: L(v, n.inputs[i])
                return n.outputs[0]
            def noise(scale_xyz, scale, detail):
                vm = N('ShaderNodeVectorMath'); vm.operation = 'MULTIPLY'; vm.inputs[1].default_value = scale_xyz
                L(geo.outputs['Position'], vm.inputs[0])
                nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = detail
                L(vm.outputs[0], nz.inputs['Vector']); return nz.outputs['Fac']
            z = pos.outputs['Z']; nzc = nrm.outputs['Z']
            vert = math_('LESS_THAN', math_('ABSOLUTE', nzc), 0.5)                       # 1 on walls
            base = math_('MULTIPLY', math_('SUBTRACT', 1.0, math_('DIVIDE', z, 0.9), True), 0.20)   # splash zone
            st = math_('MULTIPLY', math_('SUBTRACT', noise((5.0, 5.0, 0.22), 1.0, 3.0), 0.47), 3.0, True)
            topw = math_('ADD', 0.35, math_('MULTIPLY', math_('DIVIDE', math_('SUBTRACT', z, top - 3.0), 3.0), 0.65, True))
            streak = math_('MULTIPLY', math_('MULTIPLY', st, topw), math_('MULTIPLY', vert, 0.16))
            ledge = math_('MULTIPLY', math_('GREATER_THAN', nzc, 0.7), 0.10)
            blot = math_('MULTIPLY', math_('SUBTRACT', noise((1, 1, 1), 0.35, 2.0), 0.5), 0.10)
            dark = math_('ADD', math_('ADD', math_('ADD', base, streak), ledge), blot)
            val = math_('SUBTRACT', 1.0, dark, True)
            em = N('ShaderNodeEmission'); L(val, em.inputs['Color']); L(em.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
        gr = np.clip(bake('EMIT')[..., 0], 0, 1)
    else:
        gr = np.ones_like(a)
    for m, s in saved:                                   # restore preview shading
        out = m.node_tree.nodes['Material Output']
        if s: m.node_tree.links.new(s, out.inputs['Surface'])
        m.node_tree.nodes.remove(m.node_tree.nodes['_bake'])
    for o in extra: bpy.data.objects.remove(o)
    me.uv_layers.active = uv0

    def save(px, p):
        o = bpy.data.images.new('bake_out', size, size, alpha=False); o.colorspace_settings.name = 'Non-Color'
        o.pixels.foreach_set(np.concatenate([px, np.ones_like(px[..., :1])], -1).astype(np.float32).ravel())
        o.filepath_raw = p; o.file_format = 'PNG'; o.save()
    save(np.stack([np.clip(a, 0, 1), gr, np.zeros_like(a)], -1), path)
    save(np.sqrt(np.clip(lm / 2, 0, 1)), path.replace('_ao.png', '_lm.png'))
    print('BAKED', path, 'AO mean %.2f grime mean %.2f lightmap mean %.2f max %.2f' % (a.mean(), gr.mean(), lm.mean(), lm.max()))
