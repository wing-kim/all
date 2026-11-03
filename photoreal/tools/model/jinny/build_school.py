# 신사중학교 (압구정로 123) — Blender build + GLB export
# run: blender -b --factory-startup -P tools/build_school.py -- <out.glb> [preview.png]   (then tools/pack_web.py)
# [케이프혼 1102.n] 실사 3D 판(서쪽 날개 111m): KH_WING_Z1=-16.0 blender -b --factory-startup -P photoreal/tools/model/jinny/build_school.py -- school410r.glb
#   지니 원본과 다른 곳은 WING_Z1 한 줄뿐(기본값이면 원본과 같다). 이 폴더의 khb.py·khctx.py 는 지니 전달물(kapehorn-env-handoff-20261102) 그대로
# Reference: Kakao roadview 2026.06.17 (압구정로) and 2026.07.16 (진입로 south, side street north). S-Map was not available
# for this one, so the layout follows the page's plan, corrected only where the street views show it:
#  - north-east: the new brick hall (dark clinker brick, blue-framed strip windows, a barrel roof of dark zinc diamond shingles
#    rising from the side street to the courtyard, white pilasters and a dark entrance recess on the 압구정로 gable)
#  - a silver metal-panel stair core, then the older cream classroom bar (5F) and the west wing (4F) along the field
#  - a schoolyard raised ~1.4 m above the street: painted retaining wall with green / lime tile bands on 압구정로,
#    rubble-stone wall on the 진입로, green steel fence on top, artificial-turf field with markings and goals, a teal court
# Lettering is left out; the page keeps its own 신사중학교 name plates. Trees are instanced by the page (tools/build_street.py).
# Written in page coordinates (x, z, height y); Blender gets (x, −z, y), so the page adds it at the origin.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import khb, khctx

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
PREVIEW = argv[1] if len(argv) > 1 else None
B = khb.Builder('School410')
YARD = 1.4                                                     # schoolyard level above the street

def poly(pts, y, m, uvs=None):                                 # flat polygon, clockwise in page (x, z) = CCW in Blender
    return B.face([(x, -z, y) for x, z in pts], m, uvs=uvs)
def rect(x0, x1, z0, z1, y, m):
    poly([(x0, z1), (x1, z1), (x1, z0), (x0, z0)], y, m)
def pbox(x0, x1, z0, z1, y0, y1, m, skip=('-z',)):
    B.box(x0, x1, -z1, -z0, y0, y1, m, skip=skip)
def edges(x0, x1, z0, z1):
    """south, east, north, west wall frames of a page rectangle (outward normals), each walked left→right from outside"""
    c = [(x0, -z1), (x1, -z1), (x1, -z0), (x0, -z0)]
    return {k: B.frame_of(c[i], c[(i + 1) % 4]) for i, k in enumerate(('S', 'E', 'N', 'W'))}
def win(s0, s1, z0, z1, glass='glass', frame='frame_grey', mull=2, **k):
    return dict(s0=s0, s1=s1, z0=z0, z1=z1, glass=glass, frame=frame, mull=mull, **k)
def rows(L, bay, w, sills, h, margin=1.2, **k):
    n = int((L - 2 * margin) // bay); m0 = (L - n * bay) / 2
    return [win(m0 + i * bay + (bay - w) / 2, m0 + i * bay + (bay + w) / 2, z, z + h, **k) for i in range(n) for z in sills]
def parapet(x0, x1, z0, z1, h, m, cap='frame_grey', roof='roof_grey'):
    rect(x0 + .25, x1 - .25, z0 + .25, z1 - .25, h - .9, roof)
    for a, b, c, d in ((x0, x1, z0, z0 + .25), (x0, x1, z1 - .25, z1), (x0, x0 + .25, z0, z1), (x1 - .25, x1, z0, z1)):
        pbox(a, b, c, d, h - .9, h, m, skip=('-z',))
    for a, b, c, d in ((x0 - .05, x1 + .05, z0 - .05, z0 + .3), (x0 - .05, x1 + .05, z1 - .3, z1 + .05), (x0 - .05, x0 + .3, z0, z1), (x1 - .3, x1 + .05, z0, z1)):
        pbox(a, b, c, d, h, h + .08, cap, skip=('-z',))

# ---------- brick hall (north-east, on the corner of 압구정로 and the side street) ----------
HX0, HX1, HZ0, HZ1 = -92.0, -59.47, -125.7, -107.45       # faces on the page plan lines (its name plates sit on them)
EAVE, TOPH = 12.5, 17.5
prof = lambda t: EAVE + (TOPH - EAVE) * math.sin(t * math.pi / 2)        # roof height, t = 0 at the side street → 1 at the courtyard
E = edges(HX0, HX1, HZ0, HZ1)
L = E['N'][3]                                                             # north face on the side street (s from east to west)
ops = [dict(s0=.6, s1=9.0, z0=0, z1=3.4, kind='void', depth=3.0, reveal='brick_dark')]            # pilotis entrance under the hall
ops += [win(10.2 + i * 2.7, 11.6 + i * 2.7, 1.1, 2.4, frame='frame_blue', mull=1, depth=.2) for i in range(int((L - 11.5) // 2.7))]
for z0 in (4.4, 7.8):                                                     # long strip windows, 2F / 3F
    ops += [win(a, b, z0, z0 + 1.2, frame='frame_blue', mull=int((b - a) // 2.6), depth=.18) for a, b in ((1.4, 11.6), (12.4, 22.6), (23.4, L - 1.4))]
B.wall(E['N'], 0, EAVE, 'brick_dark', ops)
B.quad(E['N'], .6, 9.0, 0, 3.4, -3.0, 'inner_dark')
for s in (3.4, 6.2):                                                      # columns in the pilotis
    B.slab(E['N'], s - .25, s + .25, 0, 3.4, -2.2, -1.7, 'brick_dark')
L = E['S'][3]                                                             # courtyard face (s from west to east)
ops = [win(a, b, z0, z0 + 1.2, frame='frame_blue', mull=int((b - a) // 2.6), depth=.18) for z0 in (1.2, 4.6, 8.0, 11.4) for a, b in ((1.4, 15.6), (16.6, L - 1.4))]
B.wall(E['S'], 0, TOPH, 'brick_dark', ops)
L = E['E'][3]                                                             # 압구정로 gable (s from south to north)
B.wall(E['E'], 0, EAVE, 'brick_dark', [dict(s0=5.0, s1=12.5, z0=0, z1=3.3, kind='void', depth=1.8, reveal='brick_dark')])
B.quad(E['E'], 5.0, 12.5, 0, 3.3, -1.8, 'glass_shop')
B.wall(E['W'], 0, EAVE, 'brick_dark', ())
N_ARC = 14
for side, x, sg in (('E', HX1, 1), ('W', HX0, -1)):                        # gable caps above the eave following the roof
    pts = [(HZ0 + (HZ1 - HZ0) * i / N_ARC, prof(i / N_ARC)) for i in range(N_ARC + 1)]
    ring = [(x, -HZ1, EAVE)] + [(x, -z, h) for z, h in pts]               # arc runs from the north eave to the south top
    f = B.face(ring, 'brick_dark')
    if f.normal.x * sg < 0: f.normal_flip()
for s in (4.0, 9.0, 14.0):                                                # white pilasters on the 압구정로 gable
    z = HZ1 + (HZ0 - HZ1) * s / (HZ1 - HZ0); t = (z - HZ0) / (HZ1 - HZ0)
    B.slab(E['E'], s - .14, s + .14, 3.8, prof(t) - .3, 0, .14, 'stucco_white')
for i in range(N_ARC):                                                    # zinc barrel roof with a small overhang
    t0, t1 = i / N_ARC, (i + 1) / N_ARC
    za, zb = HZ0 + (HZ1 - HZ0) * t0 - (.4 if i == 0 else 0), HZ0 + (HZ1 - HZ0) * t1
    ha, hb = prof(t0) - (.15 if i == 0 else 0), prof(t1)
    f = B.face([(HX0 - .3, -za, ha), (HX1 + .3, -za, ha), (HX1 + .3, -zb, hb), (HX0 - .3, -zb, hb)], 'roof_zinc',
               uvs=[(HX0, za), (HX1, za), (HX1, zb), (HX0, zb)])
    if f.normal.z < 0: f.normal_flip()
    f = B.face([(HX0 - .3, -za, ha - .12), (HX0 - .3, -zb, hb - .12), (HX1 + .3, -zb, hb - .12), (HX1 + .3, -za, ha - .12)], 'roof_zinc')
    if f.normal.z > 0: f.normal_flip()
for k in range(9):                                                        # diamond skylights in the roof
    t = .25 + .5 * (k % 2); x = HX0 + 3 + k * 3.4; z = HZ0 + (HZ1 - HZ0) * t; h = prof(t) + .03
    f = B.face([(x, -z + .35, h), (x + .35, -z, h), (x, -z - .35, h), (x - .35, -z, h)], 'glass')
    if f.normal.z < 0: f.normal_flip()

# ---------- silver stair core and the older cream blocks ----------
CX0, CX1, CZ0, CZ1, CH = -95.5, -92.0, -126.9, -118.0, 19.5
E = edges(CX0, CX1, CZ0, CZ1)
for k in 'NESW':
    L = E[k][3]
    ops = [win(L / 2 - .5, L / 2 + .5, z, z + .9, frame='frame_dark', mull=1) for z in (5.0, 8.5, 12.0, 15.5)] if k in 'NS' else ()
    B.wall(E[k], 0, CH, 'metal_silver', ops)
rect(CX0, CX1, CZ0, CZ1, CH, 'metal_silver')

def old_block(x0, x1, z0, z1, h, floors, faces):
    E = edges(x0, x1, z0, z1)
    for k in 'NESW':
        L = E[k][3]
        ops = rows(L, 3.4, 2.4, [1.0 + 3.5 * f for f in range(floors)], 1.7, frame=None, depth=.16) if k in faces else ()   # recessed glass, no frame boxes (keeps the file small)
        B.wall(E[k], 0, h - .9, 'paint_cream', ops)
        for f in range(1, floors):                                        # thin floor bands
            B.slab(E[k], 0, L, 3.5 * f - .12, 3.5 * f + .08, 0, .06, 'paint_cream')
    parapet(x0, x1, z0, z1, h, 'paint_cream')
old_block(-110.0, -95.5, -125.7, -107.45, 18.5, 5, 'NS')                    # main classroom bar
WING_Z1 = float(os.environ.get('KH_WING_Z1', '-48.6'))                      # [케이프혼 1102.n] 서쪽 날개 남쪽 끝(지니 원본 -48.6). 실사 3D 판은 -16.0: 실측 ㄱ자 서쪽 날개 111m(브이월드 '신사중학교')에 맞춤
old_block(-110.0, -98.75, -107.45, WING_Z1, 15.0, 4, 'EW')                   # west wing along the field
pbox(-106.0, -101.0, -122.0, -117.0, 18.5 - .9, 18.5 + 1.8, 'metal_unit')  # rooftop water tank

# ---------- raised schoolyard, retaining walls, fence ----------
PX0, PX1, PZ0, PZ1 = -98.75, -56.6, -107.45, -33.5
rect(PX0, PX1, PZ0, PZ1, YARD, 'paver')
B.face([(PX1, -PZ1, 0), (PX1, -PZ0, 0), (PX1, -PZ0, YARD), (PX1, -PZ1, YARD)], 'stucco_white')            # 압구정로 wall (faces +x)
B.face([(PX0, -PZ1, 0), (PX1, -PZ1, 0), (PX1, -PZ1, YARD), (PX0, -PZ1, YARD)], 'stone_wall')             # 진입로 wall (faces +z)
pbox(PX1 - .3, PX1 + .05, PZ0, PZ1, YARD, YARD + .12, 'stucco_white', skip=('-z',))                       # wall copings
pbox(PX0, PX1, PZ1 - .3, PZ1 + .05, YARD, YARD + .12, 'stone_wall', skip=('-z',))
z = PZ1                                                                                                     # green / lime tile band
while z > PZ0 + .3:
    for r, y0 in enumerate((.42, .78)):
        m = 'tile_green' if (int((PZ1 - z) / .6) + r) % 2 == 0 else 'tile_lime'
        B.face([(PX1 + .015, -z, y0), (PX1 + .015, -(z - .58), y0), (PX1 + .015, -(z - .58), y0 + .34), (PX1 + .015, -z, y0 + .34)], m)
    z -= .6
def fence(a, b, y):                                                       # posts + barred infill card along a → b (page x, z)
    L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L // 2.4))
    for i in range(n + 1):
        x, zz = a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n
        pbox(x - .04, x + .04, zz - .04, zz + .04, y, y + 1.25, 'pole_green', skip=('-z',))
    B.face([(a[0], -a[1], y), (b[0], -b[1], y), (b[0], -b[1], y + 1.2), (a[0], -a[1], y + 1.2)], 'fence_green',
           uvs=[(0, 0), (L, 0), (L, 1), (0, 1)])
fence((PX1 - .15, PZ1 - .15), (PX1 - .15, PZ0), YARD + .12)
fence((PX0, PZ1 - .15), (PX1 - .15, PZ1 - .15), YARD + .12)

# ---------- field and court ----------
FX0, FX1, FZ0, FZ1 = -94.0, -62.0, -102.0, -56.0
Y = YARD + .01
rect(FX0, FX1, FZ0, FZ1, Y, 'turf')
def line(x0, x1, z0, z1): rect(x0, x1, z0, z1, Y + .004, 'line_white')
w = .1
for a, b, c, d in ((FX0 + .8, FX1 - .8, FZ0 + .8, FZ0 + .8 + w), (FX0 + .8, FX1 - .8, FZ1 - .8 - w, FZ1 - .8),
                   (FX0 + .8, FX0 + .8 + w, FZ0 + .8, FZ1 - .8), (FX1 - .8 - w, FX1 - .8, FZ0 + .8, FZ1 - .8)):
    line(a, b, c, d)
cx, cz = (FX0 + FX1) / 2, (FZ0 + FZ1) / 2
line(FX0 + .8, FX1 - .8, cz - w / 2, cz + w / 2)
seg = 36
for i in range(seg):                                                      # centre circle
    a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
    r0, r1 = 4.0, 4.0 + w
    pts = [(cx + r1 * math.cos(a0), cz + r1 * math.sin(a0)), (cx + r1 * math.cos(a1), cz + r1 * math.sin(a1)),
           (cx + r0 * math.cos(a1), cz + r0 * math.sin(a1)), (cx + r0 * math.cos(a0), cz + r0 * math.sin(a0))]
    f = poly(pts, Y + .004, 'line_white')
    if f.normal.z < 0: f.normal_flip()
for zz, sg in ((FZ0 + .8, 1), (FZ1 - .8, -1)):                            # penalty boxes and goals
    line(cx - 6, cx - 6 + w, zz, zz + sg * 5) if sg > 0 else line(cx - 6, cx - 6 + w, zz - 5, zz)
    line(cx + 6 - w, cx + 6, zz, zz + sg * 5) if sg > 0 else line(cx + 6 - w, cx + 6, zz - 5, zz)
    line(cx - 6, cx + 6, zz + sg * 5 - (w if sg > 0 else 0), zz + sg * 5 + (0 if sg > 0 else w))
    for x in (cx - 2.5, cx + 2.5):
        pbox(x - .06, x + .06, zz - .06, zz + .06, Y, Y + 2.1, 'line_white', skip=('-z',))
    pbox(cx - 2.56, cx + 2.56, zz - .06, zz + .06, Y + 2.0, Y + 2.12, 'line_white', skip=())
CX0_, CX1_, CZ0_, CZ1_ = -84.0, -62.0, -53.0, -37.0
rect(CX0_, CX1_, CZ0_, CZ1_, Y, 'court_teal')
for a, b, c, d in ((CX0_ + .5, CX1_ - .5, CZ0_ + .5, CZ0_ + .5 + w), (CX0_ + .5, CX1_ - .5, CZ1_ - .5 - w, CZ1_ - .5),
                   (CX0_ + .5, CX0_ + .5 + w, CZ0_ + .5, CZ1_ - .5), (CX1_ - .5 - w, CX1_ - .5, CZ0_ + .5, CZ1_ - .5),
                   ((CX0_ + CX1_) / 2 - w / 2, (CX0_ + CX1_) / 2 + w / 2, CZ0_ + .5, CZ1_ - .5)):
    line(a, b, c, d)
for x, sg in ((CX0_ + .3, 1), (CX1_ - .3, -1)):                           # basketball hoops
    zc = (CZ0_ + CZ1_) / 2
    pbox(x - .08, x + .08, zc - .08, zc + .08, Y, Y + 3.3, 'pole_grey', skip=('-z',))
    pbox(x + sg * .1 - .03, x + sg * .1 + .03, zc - .9, zc + .9, Y + 2.9, Y + 3.95, 'line_white', skip=())

ob = B.finish()
khb.bake_maps(ob, OUT.replace('.glb', '_ao.png'), 512, top=TOPH, spheres=khctx.crowns_school(), sun=khctx.SUN)
B.export(ob, OUT)
if PREVIEW:
    khb.preview(PREVIEW, (-30, 60, 25), (-80, 85, 4), lens=24, size=(1300, 850))
