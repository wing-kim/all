# Neighbourhood used as light occluders when baking lightmaps (khb.bake_maps): footprints from the page's plan polygons,
# heights from the models / page masses, street-tree crowns from the street pack. Blender world frame: (x, −page z), z up.
S, OX, OY = 41.6, 914, 770

def MAP(mx, my):
    dx, dy = mx - 330, my - 555; return [230 + 2.2724 * dx + 3.5755 * dy, 1365 - 3.9635 * dx + 2.1063 * dy]

def plan(q, lim=140):                         # page: backF(mp(q), lim)
    p = [MAP(*a) for a in q]; m0 = min(a[0] for a in p)
    return [((x + 123 if x < m0 + lim else x) - OX) / S for x, _ in p], [-(y - OY) / S for _, y in p]

def ccw(xs, ys):
    pts = list(zip(xs, ys))
    a = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]))
    return pts if a > 0 else pts[::-1]

BUILDINGS = {
    'domino114':    (ccw(*plan([[590, 412], [650, 378], [752, 520], [690, 555]])), 12.4),
    'einstein116':  (ccw(*plan([[665, 340], [770, 282], [873, 415], [775, 495]])), 15.5),
    'office118':    (ccw(*plan([[810, 255], [1050, 165], [1050, 265], [975, 295], [975, 420], [880, 410]], 260)), 18.6),
    'customeat110': (ccw(*plan([[240, 625], [330, 700], [430, 875], [440, 945], [205, 1090], [75, 740]])), 15.2),
    'sauna529':     (ccw([((x - OX) / S) for x in (1150, 1585, 1585, 1150)],
                         [-(y - OY) / S for y in (196, 196, 1365 - 0.3604 * (1585 - 230) - 30, 1365 - 0.3604 * (1150 - 230) - 30)]), 13.0),
    'donggwang':    (ccw([-15.5, 15.5, 15.5, -15.5], [13.0, 13.0, -12.0, -12.0]), 15.5),   # existing 동광빌딩 on the site (현황)
}
TREES = [-70, -65, -52, -41, -32, -23.6, -15, -6, 3, 10.3, 25, 34, 43, 52]      # page z along x = −19 (tools/build_street.py)
YOUNG = {-52: .78, -41: .64, -32: .66}

# 신사중학교: big trees inside the fence (on the raised yard) along 압구정로 and the 진입로, young street trees on the west pavement
YARD = 1.4
SCHOOL_TREES = ([(-58.8, z, YARD, 1.2) for z in range(-40, -103, -7)] + [(x, -35.9, YARD, 1.25) for x in (-95, -88.5, -82, -75.5, -69, -62.5)]
                + [(-51.8, z, 0, .75) for z in range(-36, -127, -9)])

def occluders(skip=()):
    return [(pts, 0, h) for k, (pts, h) in BUILDINGS.items() if k not in skip]

def crowns():
    return [(-19.0, -z, 6.3 * YOUNG.get(z, 1), 3.2 * YOUNG.get(z, 1)) for z in TREES]

def crowns_school():
    return [(x, -z, y + 6.3 * s, 3.2 * s) for x, z, y, s in SCHOOL_TREES]

SUN = (.19, -.98, .78)        # afternoon sun from the south-west (page az 225°, el 38°) in this frame

# Surveyed footprints (OpenStreetMap, fitted to the page frame — see tools/osm_footprints.json)
import json as _json, os as _os
OSM = _json.load(open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'osm_footprints.json'), encoding='utf-8'))['fp']
def osm(key):
    """footprint in Blender (x, y) = (page x, −page z), CCW"""
    return ccw([x for x, z in OSM[key]], [-z for x, z in OSM[key]])
OSM['96'] = [(28.9 if x > 15 else x, z) for x, z in OSM['96']]   # front at the alley line (roadview), see build_block glass529
BUILDINGS.clear()
for _k, _h in (('110', 15.2), ('108', 12.8), ('106', 25.0), ('104', 21.5), ('3', 13.0), ('5', 12.0), ('96', 16.5), ('94', 13.6),
               ('112', 15.5), ('114', 12.4), ('116', 15.5), ('118', 18.6), ('93', 11.0), ('10', 11.6), ('101', 14.0), ('103', 13.4),
               ('w1359383584', 7.8), ('w1359383589', 16.4)):
    BUILDINGS['osm' + _k] = (osm(_k), _h)
