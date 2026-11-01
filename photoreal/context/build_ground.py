#!/usr/bin/env python3
"""주변 땅(도로·녹지·주차장·단지 바닥·나무) 자료 ground.json 생성.

입력: .cache/ground_osm.json (Overpass, ODbL), buildings.json (좌표 변환·건물 외곽선)
출력: ground.json (Wing 월드 좌표 m, 소수 1자리)
  roads: [[폭, 종류, [[x,z],...]], ...]      종류: 0 큰길(중앙선) 1 이면도로 2 단지·주차 통로 3 보행자 도로
  areas: [[종류, [[x,z],...]], ...]          종류: green pitch track play parking complex dirt
  trees: [[x, z, 높이, 모양], ...]           모양: 0 활엽 1 침엽
없으면 받기: python3 build_ground.py --fetch
"""
import json, math, os, random, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache', 'ground_osm.json')
R = 1000          # 대지 중심 반경(m)
SITE_CLEAR = 60   # 대지 주변은 Wing·실사 계층의 가로수·도로가 있으므로 나무를 만들지 않음

def fetch():
    lat0, lon0 = 37.5230, 127.0213
    q = (f'[out:json][timeout:180];(way["highway"](around:{R},{lat0},{lon0});way["landuse"](around:{R},{lat0},{lon0});'
         f'way["leisure"](around:{R},{lat0},{lon0});way["natural"](around:{R},{lat0},{lon0});way["amenity"="parking"](around:{R},{lat0},{lon0});'
         f'node["natural"="tree"](around:{R},{lat0},{lon0});relation["landuse"](around:{R},{lat0},{lon0});relation["leisure"](around:{R},{lat0},{lon0}););out body geom;')
    req = urllib.request.Request('https://overpass-api.de/api/interpreter', data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'Jack-building-review/1.0'})
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    open(CACHE, 'wb').write(urllib.request.urlopen(req, timeout=200).read())

def main():
    if '--fetch' in sys.argv or not os.path.exists(CACHE): fetch()
    osm = json.load(open(CACHE))['elements']
    bj = json.load(open(os.path.join(HERE, 'buildings.json')))
    t = bj['meta']['transform']; (lat0, lon0), (kx, ky), M, o = t['enu_origin_latlon'], t['enu_scale_m_per_deg'], t['enu_to_world_2x2'], t['enu_to_world_t']
    def W(lat, lon):
        e, n = (lon - lon0) * kx, (lat - lat0) * ky
        return (M[0][0] * e + M[0][1] * n + o[0], M[1][0] * e + M[1][1] * n + o[1])
    rnd = random.Random(529)

    # ---------- 건물 격자 색인(나무가 건물 안에 서지 않게) ----------
    G = 25.0
    def cells(xs, zs):
        for i in range(int(math.floor(min(xs) / G)), int(math.floor(max(xs) / G)) + 1):
            for j in range(int(math.floor(min(zs) / G)), int(math.floor(max(zs) / G)) + 1): yield (i, j)
    def inpoly(p, poly):
        c = False; x, z = p
        for i in range(len(poly)):
            (x1, z1), (x2, z2) = poly[i - 1], poly[i]
            if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1: c = not c
        return c
    bgrid = {}
    blds = [b for b in bj['buildings'] if b['dist'] < R + 150]
    for k, b in enumerate(blds):
        xs = [q[0] for q in b['outline']]; zs = [q[1] for q in b['outline']]
        b['_bb'] = (min(xs) - 2, min(zs) - 2, max(xs) + 2, max(zs) + 2)
        for c in cells([b['_bb'][0], b['_bb'][2]], [b['_bb'][1], b['_bb'][3]]): bgrid.setdefault(c, []).append(k)
    def seg_d(p, a, b):
        dx, dz = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dz * dz or 1e-9
        u = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2))
        return math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dz)
    def in_bld(p, pad=1.5):
        for k in bgrid.get((int(math.floor(p[0] / G)), int(math.floor(p[1] / G))), []):
            b = blds[k]; x0, z0, x1, z1 = b['_bb']
            if not (x0 <= p[0] <= x1 and z0 <= p[1] <= z1): continue
            ol = b['outline']
            if inpoly(p, ol): return True
            if pad and any(seg_d(p, ol[i - 1], ol[i]) < pad for i in range(len(ol))): return True
        return False

    # ---------- 도로 ----------
    WID = {'trunk': 24, 'primary': 22, 'secondary': 19, 'tertiary': 12, 'trunk_link': 7, 'primary_link': 7, 'secondary_link': 7, 'tertiary_link': 6,
           'residential': 6.5, 'unclassified': 6, 'living_street': 5, 'service': 4.5, 'pedestrian': 6, 'busway': 7}
    KIND = {'trunk': 0, 'primary': 0, 'secondary': 0, 'tertiary': 0, 'pedestrian': 3, 'service': 2}
    roads, rsegs, street = [], [], []
    for e in osm:
        tg = e.get('tags', {}); hw = tg.get('highway')
        if e['type'] != 'way' or hw not in WID or 'geometry' not in e: continue
        if tg.get('tunnel') in ('yes', 'building_passage') or tg.get('layer', '0').startswith('-') or tg.get('area') == 'yes': continue
        if hw == 'service' and tg.get('service') in ('driveway',) and len(e['geometry']) < 3: continue
        w = WID[hw]
        try:
            if 'width' in tg: w = float(tg['width'].split()[0])
            elif 'lanes' in tg and hw in ('trunk', 'primary', 'secondary', 'tertiary'): w = max(7, int(tg['lanes']) * 3.3 + (2 if int(tg['lanes']) >= 4 else 0))
        except ValueError: pass
        pts = [W(g['lat'], g['lon']) for g in e['geometry']]
        if min(math.hypot(*p) for p in pts) > R: continue
        k = KIND.get(hw, 1)
        if k == 0 and w < 10: k = 1
        roads.append([round(w, 1), k, [[round(p[0], 1), round(p[1], 1)] for p in pts]])
        if hw in ('primary', 'secondary', 'tertiary') and k == 0: street.append((w, pts))
        for i in range(1, len(pts)): rsegs.append((pts[i - 1], pts[i], w / 2))
    rgrid = {}
    for k, (a, b, hw) in enumerate(rsegs):
        for c in cells([a[0] - hw, b[0] + hw, a[0] + hw, b[0] - hw], [a[1] - hw, b[1] + hw, a[1] + hw, b[1] - hw]): rgrid.setdefault(c, []).append(k)
    def on_road(p, pad=1.0):
        for k in rgrid.get((int(math.floor(p[0] / G)), int(math.floor(p[1] / G))), []):
            a, b, hw = rsegs[k]
            if seg_d(p, a, b) < hw + pad: return True
        return False

    # ---------- 면(녹지·운동장·주차장·단지) ----------
    def area_kind(tg):
        if tg.get('leisure') in ('park', 'garden') or tg.get('landuse') in ('grass', 'village_green', 'recreation_ground') or tg.get('natural') in ('grassland', 'wood', 'scrub'): return 'green'
        if tg.get('leisure') == 'pitch': return 'pitch'
        if tg.get('leisure') == 'track': return 'track'
        if tg.get('leisure') == 'playground': return 'play'
        if tg.get('amenity') == 'parking' and tg.get('parking', 'surface') == 'surface': return 'parking'
        if tg.get('landuse') == 'residential': return 'residential'
        if tg.get('landuse') == 'construction': return 'dirt'
        return None
    rings = []
    for e in osm:
        kd = area_kind(e.get('tags', {}))
        if not kd: continue
        geoms = []
        if e['type'] == 'way' and 'geometry' in e: geoms = [e['geometry']]
        elif e['type'] == 'relation': geoms = [m['geometry'] for m in e.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
        for g in geoms:
            if len(g) < 4 or (g[0]['lat'], g[0]['lon']) != (g[-1]['lat'], g[-1]['lon']): continue
            pts = [W(q['lat'], q['lon']) for q in g[:-1]]
            if min(math.hypot(*p) for p in pts) > R: continue
            rings.append([kd, pts])
    # 주거 구역은 아파트(5층 이상) 단지만 '단지 바닥'으로 쓴다(주택가 전체를 덮지 않게)
    apts = [b for b in blds if b['cls'] == 'apt' and b['floors'] >= 5]
    def cen(ol): return (sum(q[0] for q in ol) / len(ol), sum(q[1] for q in ol) / len(ol))
    areas = []
    for kd, pts in rings:
        if kd == 'residential':
            if not any(inpoly(cen(b['outline']), pts) for b in apts): continue
            kd = 'complex'
        areas.append([kd, pts])

    # 한강 물: 남쪽 기슭(대지 쪽) 선을 위아래로 늘이고 Wing 땅 끝(x=-1500)까지 닫는다
    WCACHE = os.path.join(HERE, '.cache', 'water_osm.json')
    if os.path.exists(WCACHE):
        rel = json.load(open(WCACHE))['elements']
        best = None
        for e in rel:
            for m in e.get('members', []):
                g = [q for q in m.get('geometry', []) if q]
                if m.get('role') != 'outer' or len(g) < 5: continue
                pts = [W(q['lat'], q['lon']) for q in g]
                d = min(math.hypot(*p) for p in pts)
                if best is None or d < best[0]: best = (d, pts)
        if best:
            pts = sorted(best[1], key=lambda p: p[1])
            def ext(a, b, z):
                return (a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]), z)
            line = [ext(pts[0], pts[3], -1500)] + pts + [ext(pts[-4], pts[-1], 1500)]
            areas.append(['water', line + [(-1500, 1500), (-1500, -1500)]])

    # ---------- 나무 ----------
    trees = []
    def add_tree(p, h=None, shape=None):
        if math.hypot(*p) < SITE_CLEAR or math.hypot(*p) > R: return
        if in_bld(p) or on_road(p): return
        trees.append([round(p[0], 1), round(p[1], 1), round(h or rnd.uniform(6.5, 11.5), 1), shape if shape is not None else (1 if rnd.random() < 0.18 else 0)])
    for e in osm:
        tg = e.get('tags', {})
        if e['type'] == 'node' and tg.get('natural') == 'tree': add_tree(W(e['lat'], e['lon']))
        if e['type'] == 'way' and tg.get('natural') == 'tree_row' and 'geometry' in e:
            pts = [W(q['lat'], q['lon']) for q in e['geometry']]
            for i in range(1, len(pts)):
                a, b = pts[i - 1], pts[i]; L = math.hypot(b[0] - a[0], b[1] - a[1])
                for s in range(int(L // 7) + 1): add_tree((a[0] + (b[0] - a[0]) * s * 7 / max(L, 1e-6), a[1] + (b[1] - a[1]) * s * 7 / max(L, 1e-6)))
    # 가로수: 큰길·이면도로 양쪽, 9m 간격(보도 위)
    for w, pts in street:
        for i in range(1, len(pts)):
            a, b = pts[i - 1], pts[i]; dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz)
            if L < 1: continue
            ux, uz = dx / L, dz / L; nx, nz = -uz, ux
            for s in range(int(L // 9)):
                d = s * 9 + 4.5
                for sg in (-1, 1):
                    off = w / 2 + 1.6
                    p = (a[0] + ux * d + nx * off * sg, a[1] + uz * d + nz * off * sg)
                    if in_bld(p, 0.8): continue
                    if math.hypot(*p) < SITE_CLEAR or math.hypot(*p) > R: continue
                    trees.append([round(p[0], 1), round(p[1], 1), round(rnd.uniform(7, 10), 1), 0])
    # 단지·공원 안: 면적에 비례해 흩뿌림(건물·도로·주차장·운동장 피함)
    blockers = [pts for kd, pts in areas if kd in ('parking', 'pitch', 'track', 'play')]
    def area_of(pts): return abs(sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts)))) / 2
    for kd, pts in areas:
        if kd not in ('complex', 'green'): continue
        A = area_of(pts); n = int(A / (85 if kd == 'complex' else 55))
        xs = [q[0] for q in pts]; zs = [q[1] for q in pts]
        tries = 0
        while n > 0 and tries < n * 6:
            tries += 1
            p = (rnd.uniform(min(xs), max(xs)), rnd.uniform(min(zs), max(zs)))
            if not inpoly(p, pts) or any(inpoly(p, q) for q in blockers): continue
            before = len(trees); add_tree(p)
            if len(trees) > before: n -= 1
    out = {
        'meta': {'source': 'OpenStreetMap (ODbL), Overpass', 'radius_m': R, 'site_clear_m': SITE_CLEAR,
                 'roads_kind': ['큰길(중앙선)', '이면도로', '단지·주차 통로', '보행자 도로'], 'tree_shape': ['활엽', '침엽']},
        'roads': roads,
        'areas': [[kd, [[round(p[0], 1), round(p[1], 1)] for p in pts]] for kd, pts in areas],
        'trees': trees,
    }
    json.dump(out, open(os.path.join(HERE, 'ground.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    import collections
    print('도로', len(roads), '면', collections.Counter(a[0] for a in out['areas']), '나무', len(trees), '크기', os.path.getsize(os.path.join(HERE, 'ground.json')) // 1024, 'KB')

if __name__ == '__main__':
    main()
