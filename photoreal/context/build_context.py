#!/usr/bin/env python3
"""케이프혼타워 주변 건물 데이터(buildings.json) 생성 스크립트.

입력
  .cache/osm.json      Overpass 응답(없으면 받아 옴, ODbL)
  .cache/vworld.json   브이월드 LT_C_BLDGINFO 응답 묶음(선택, fetch_vworld.py 로 받음)
  near_roadview.json   로드뷰로 확인한 근경 건물 기록(사람이 작성)
출력
  buildings.json       Wing 월드 좌표(m) 외곽선 + 높이·층수·재질 분류·대표색·확인 방법
  diff_wing.md         Wing 근사값과 다른 건물 목록

사용: python3 build_context.py   (numpy 필요)
"""
import json, math, os, sys, urllib.parse, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')
LAT0, LON0 = 37.5230, 127.0213            # 로컬 ENU 원점(대지 부근)
R_NEAR, R_FAR = 250.0, 1200.0             # 근경·원경 반경(m, 대지 중심 기준)
KX = 111320 * math.cos(math.radians(LAT0)); KY = 110574.0

# ---------------- Wing 좌표계 (new/3d-model.html 과 같은 식) ----------------
S, OX, OY = 41.6, 914, 770
def P(x, y): return ((x - OX) / S, (y - OY) / S)
def yRoad(x): return 1365 - 0.3604 * (x - 230)
def yWall(x): return 1215 - 0.3604 * (x - 365)
def MAP(mx, my):
    dx, dy = mx - 330, my - 555
    return (230 + 2.2724 * dx + 3.5755 * dy, 1365 - 3.9635 * dx + 2.1063 * dy)
def mp(pts): return [MAP(*q) for q in pts]
def backF(poly, lim=140):
    m = min(q[0] for q in poly)
    return [(q[0] + 123, q[1]) if q[0] < m + lim else q for q in poly]

# 좌표 맞춤 기준: 우리 대지의 두 건물(동광빌딩 = 압구정로 112, 3번지 건물). Wing 은 설계 도면(대지 749㎡)으로 그려 축척이 실측과 같다고 본다
ANCHORS = {
    '775465793': [(365, 186), (903, 186), (903, yWall(903)), (365, yWall(365))],              # 112 동광빌딩
    '775465794': [(1150, 196), (1585, 196), (1585, yRoad(1585) - 30), (1150, yRoad(1150) - 30)],  # 3번지
}
SITE_IDS = set(ANCHORS)   # 우리 대지 건물은 Wing 장면에 이미 있으므로 출력에서 뺀다
# Wing 이 그린 주변 건물(라벨, 외곽선 px, 높이 m, 대응 OSM id). diff 계산용
WING = [
    ('114 도미노피자 건물 (약 4층)', backF(mp([[590, 412], [650, 378], [752, 520], [690, 555]])), 14.2, '775465796'),
    ('116 아인슈타인학원 (약 5층)', backF(mp([[665, 340], [770, 282], [873, 415], [775, 495]])), 18.4, '775465797'),
    ('118 오피스 (약 6층)', backF(mp([[810, 255], [1050, 165], [1050, 265], [975, 295], [975, 420], [880, 410]]), 260), 18.6, '775465798'),
    ('96 (약 3층)', mp([[712, 640], [795, 595], [895, 745], [810, 790]]), 11, '775465800'),
    ('94 스타벅스 (약 4층)', mp([[885, 605], [1075, 483], [1120, 610], [980, 720]]), 14, '775465799'),
    ('5 양식당더램키친 (약 2층)', mp([[590, 775], [705, 700], [800, 830], [720, 860]]), 8, '775465795'),
    ('93 CU (약 3층)', mp([[880, 940], [1105, 805], [1130, 945], [950, 1020]]), 11, '896202363'),
    ('커스텀잇 · 세레스학원 건물 (약 4층)', backF(mp([[240, 625], [330, 700], [430, 875], [440, 945], [205, 1090], [75, 740]])), 15.2, '775465792'),
    ('오토김밥 (약 3층)', backF(mp([[0, 760], [75, 740], [205, 1090], [110, 1140], [0, 1130]])), 11, '775465791'),
    ('에스모드서울 (약 7층)', [(320, 3990), (1250, 3990), (1250, 4760), (320, 4760)], 26, '775465790'),
]

def enu(lat, lon): return ((lon - LON0) * KX, (lat - LAT0) * KY)
def to_ll(e, n): return (LAT0 + n / KY, LON0 + e / KX)

# Wing 도면의 북쪽 화살표(NORTH_DEG=36): 도면 좌표에서 북 = (-cos36, -sin36), 동 = 북을 시계 방향 90°
_c, _s = math.cos(math.radians(36)), math.sin(math.radians(36))
NV = np.array([-_c, -_s]); EV = np.array([-NV[1], NV[0]])
def north_deg(e, n): return e * EV + n * NV          # ENU → Wing XZ (회전 전 초기값, 거울상 포함)

def area_centroid(pts):
    a = cx = cy = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        c = x1 * y2 - x2 * y1; a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
    if abs(a) < 1e-9: return 0.0, tuple(np.mean(pts, 0))
    return abs(a / 2), (cx / (3 * a), cy / (3 * a))

def simplify(pts, tol):
    """Douglas-Peucker (닫힌 다각형, 첫 점 고정)"""
    if len(pts) <= 4: return pts
    def rdp(seg):
        a, b = np.array(seg[0]), np.array(seg[-1]); ab = b - a; L = np.hypot(*ab)
        dmax, idx = 0, 0
        for i in range(1, len(seg) - 1):
            p = np.array(seg[i]) - a
            d = abs(ab[0] * p[1] - ab[1] * p[0]) / L if L > 1e-9 else np.hypot(*p)
            if d > dmax: dmax, idx = d, i
        if dmax > tol: return rdp(seg[:idx + 1])[:-1] + rdp(seg[idx:])
        return [seg[0], seg[-1]]
    ring = list(pts) + [pts[0]]
    k = int(np.argmax([np.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) for p in pts]))
    out = rdp(ring[:k + 1])[:-1] + rdp(ring[k:])[:-1]
    return out if len(out) >= 3 else pts

# ---------------- 자료 읽기 ----------------
def load_osm():
    f = os.path.join(CACHE, 'osm.json')
    if not os.path.exists(f):
        os.makedirs(CACHE, exist_ok=True)
        q = f'[out:json][timeout:180];(way["building"](around:{R_FAR + 100:.0f},{LAT0},{LON0});relation["building"](around:{R_FAR + 100:.0f},{LAT0},{LON0}););out body geom;'
        for url in ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter']:
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'kapehorn-internal-test'})
                open(f, 'wb').write(urllib.request.urlopen(req, timeout=240).read()); json.load(open(f)); break
            except Exception as ex: print('overpass 실패', url, ex)
    d = json.load(open(f))
    out = {}
    for e in d['elements']:
        t = e.get('tags', {})
        if e['type'] == 'way':
            rings = [[(p['lat'], p['lon']) for p in e['geometry']]]
        else:  # multipolygon: outer 만 사용
            rings = [[(p['lat'], p['lon']) for p in m['geometry']] for m in e.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        for k, r in enumerate(rings):
            if len(r) < 4: continue
            out[str(e['id']) + ('' if k == 0 else f'_{k}')] = {'ring': r[:-1] if r[0] == r[-1] else r, 'tags': t, 'type': e['type']}
    return out, d.get('osm3s', {}).get('timestamp_osm_base', '')

def load_vworld():
    f = os.path.join(CACHE, 'vworld.json')
    if not os.path.exists(f): return []
    out = []
    for feat in json.load(open(f)):
        g = feat['geometry']; pr = feat['properties']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for k, poly in enumerate(polys):
            ring = [(c[1], c[0]) for c in poly[0]]
            if ring[0] == ring[-1]: ring = ring[:-1]
            out.append({'id': f"{pr.get('pnu') or feat.get('id')}_{k}", 'ring': ring, 'props': pr})
    return out

# ---------------- 좌표 맞춤 ----------------
SITE_PX = [(230, 172), (1598, 172), (1598, 872), (230, 1365)]   # Wing SITE (도면 px)
SITE_JIBUN = ('529', '529-1', '529-8')                          # 신사동 529 외 2필지(합 747㎡ = Wing 749㎡)

def rigid(A, B):
    ca, cb = A.mean(0), B.mean(0); U, _, Vt = np.linalg.svd((A - ca).T @ (B - cb)); R = (U @ Vt).T
    return R, cb - R @ ca

def fit_transform(osm):
    """ENU(m) → Wing XZ(m). 거울상(도면 Z 가 남쪽 아래)을 포함한 강체 변환, 축척 1 고정.
    1차: 대지 두 건물(OSM)의 꼭짓점 대응. 2차: 브이월드 연속지적도의 대지 필지 3개를 합친 외곽 꼭짓점과 Wing SITE 네 꼭짓점 대응(있으면 이것을 씀)"""
    A, B = [], []
    c0 = np.mean([north_deg(*enu(*p)) for p in osm['775465793']['ring']], 0)
    w0 = np.mean([P(*q) for q in ANCHORS['775465793']], 0)
    for oid, wp in ANCHORS.items():
        og = [north_deg(*enu(*p)) for p in osm[oid]['ring']]
        for q in wp:
            q = np.array(P(*q)); j = min(range(len(og)), key=lambda i: np.hypot(*(og[i] + w0 - c0 - q)))
            A.append(og[j]); B.append(q)
    A, B = np.array(A), np.array(B)
    R, t = rigid(A, B)
    res_bld = np.hypot(*((R @ A.T).T + t - B).T)
    info = {'method': 'site_buildings_osm', 'building_residual_m': res_bld}
    pf = os.path.join(CACHE, 'parcels.json')
    if os.path.exists(pf):
        feats = json.load(open(pf))['response']['result']['featureCollection']['features']
        rings = [f['geometry']['coordinates'][0][0][:-1] for f in feats if f['properties'].get('jibun', '').split()[0] in SITE_JIBUN]
        if len(rings) == len(SITE_JIBUN):
            pts = [np.array(north_deg(*enu(c[1], c[0]))) for r in rings for c in r]
            W = [np.array(P(*q)) for q in SITE_PX]
            for _ in range(3):   # 가장 가까운 필지 꼭짓점과 SITE 꼭짓점 대응 → 강체 맞춤 반복
                A2 = np.array([min(pts, key=lambda p: np.hypot(*(R @ p + t - w))) for w in W]); B2 = np.array(W)
                R, t = rigid(A2, B2)
            res_site = np.hypot(*((R @ A2.T).T + t - B2).T)
            res_bld = np.hypot(*((R @ A.T).T + t - B).T)
            info = {'method': 'site_parcels_vworld', 'site_corner_residual_m': res_site, 'building_residual_m': res_bld,
                    'parcel_area_m2': round(sum(area_centroid([tuple(north_deg(*enu(c[1], c[0]))) for c in r])[0] for r in rings), 1)}
    M = R @ np.vstack([EV, NV]).T          # ENU → XZ 2x2 (거울상 포함)
    return M, t, info

# ---------------- 높이 추정 ----------------
FLOOR_H = {'apt': 2.9, 'school': 3.8, 'office': 3.6, 'shop': 3.5, 'house': 3.0}
def kind_of(tags, props):
    b = (tags or {}).get('building', '')
    u = str((props or {}).get('usability', '') or '')
    if b in ('apartments', 'residential') or u.startswith('02'): return 'apt'
    if b in ('school', 'university', 'college') or u.startswith('10'): return 'school'
    if b in ('house', 'detached') or u.startswith('01'): return 'house'
    if b in ('office',) or u.startswith('14'): return 'office'
    return 'shop'
def estimate_floors(kind, area):
    if kind == 'apt': return 12 if area > 400 else 5
    if kind == 'school': return 4
    if kind == 'house': return 2
    if area < 120: return 2
    if area < 300: return 4
    if area < 800: return 5
    if area < 2000: return 7
    return 10

# 재질 분류: 근경 로드뷰 값이 없으면 용도·높이로 정한다(추정)
CLS_DEFAULT = {'apt': ('apt', '#e6e7e3'), 'school': ('brick', '#b8a48c'), 'house': ('paint', '#ddd6c8')}
def default_cls(kind, h, area, rnd, year=None):
    """로드뷰 기록이 없는 건물의 재질·색 추정. 용도·높이와 사용승인 연도별 비율로 고른다(강남 저층 근생가 관찰 기반 가정)"""
    if kind in CLS_DEFAULT: return CLS_DEFAULT[kind]
    PAL = {'tile': '#e2e0da', 'paint': '#d8d2c6', 'stone': '#cdc3b0', 'brick': '#a3624c', 'metal': '#9ea3a6', 'glass': '#7f949c'}
    if h >= 30 or area > 2500: w = {'glass': 0.45, 'stone': 0.4, 'metal': 0.15}
    elif year and year >= 2010: w = {'glass': 0.3, 'stone': 0.3, 'metal': 0.2, 'tile': 0.1, 'paint': 0.1}
    elif year and year >= 1995: w = {'stone': 0.3, 'tile': 0.3, 'glass': 0.15, 'paint': 0.15, 'metal': 0.1}
    elif year: w = {'tile': 0.35, 'brick': 0.25, 'paint': 0.25, 'stone': 0.15}
    else: w = {'tile': 0.28, 'paint': 0.24, 'stone': 0.18, 'brick': 0.12, 'metal': 0.08, 'glass': 0.10}
    acc = 0
    for k, ww in w.items():
        acc += ww
        if rnd < acc: return k, PAL[k]
    return k, PAL[k]

def hash01(s):
    h = 2166136261
    for ch in s.encode(): h = ((h ^ ch) * 16777619) & 0xffffffff
    return h / 0xffffffff

def main():
    osm, osm_time = load_osm()
    vw = load_vworld()
    near_rv = json.load(open(os.path.join(HERE, 'near_roadview.json')))
    M, t, fitinfo = fit_transform(osm)
    to_w = lambda lat, lon: M @ np.array(enu(lat, lon)) + t
    site_c = np.mean([P(*q) for q in ANCHORS['775465793'] + ANCHORS['775465794']], 0)

    # 브이월드 외곽선이 있으면 그것을 주 외곽선으로, OSM 은 브이월드에 없는 건물만 보충
    site_poly = [P(*q) for q in SITE_PX]   # Wing SITE
    _bbc = {}
    def _bb(poly):
        k = id(poly)
        if k not in _bbc:
            xs = [p[0] for p in poly]; zs = [p[1] for p in poly]; _bbc[k] = (min(xs), min(zs), max(xs), max(zs), poly)
        return _bbc[k]
    def inside(q, poly):
        bb = _bb(poly)
        if q[0] < bb[0] or q[0] > bb[2] or q[1] < bb[1] or q[1] > bb[3]: return False
        c = False
        for i in range(len(poly)):
            (xi, zi), (xj, zj) = poly[i], poly[i - 1]
            if (zi > q[1]) != (zj > q[1]) and q[0] < (xj - xi) * (q[1] - zi) / (zj - zi) + xi: c = not c
        return c
    feats = []
    for v in vw:
        wp = [tuple(to_w(*p)) for p in v['ring']]
        a, c = area_centroid(wp)
        if inside(c, site_poly): continue                       # 우리 대지 안 건물(동광빌딩·3번지)은 Wing 장면에 있음
        feats.append({'src': 'vworld', 'id': 'vw:' + v['id'], 'ring': v['ring'], 'tags': {}, 'props': dict(v['props']), 'wp': wp, 'c': c, 'a': a})
    # 겹친 기록 정리: 한 건물의 중심이 다른 건물 외곽선 안에 있으면 같은 건물로 보고 넓은 쪽 외곽선 하나만 남긴다(층수·높이는 큰 값)
    feats.sort(key=lambda f: -f['a'])
    kept = []
    for f in feats:
        host = next((k for k in kept if inside(f['c'], k['wp']) or inside(k['c'], f['wp'])), None)
        if host is None: kept.append(f); continue
        for key in ('grnd_flr', 'height'):
            try:
                if float(f['props'].get(key) or 0) > float(host['props'].get(key) or 0): host['props'][key] = f['props'][key]
            except ValueError: pass
        if not (host['props'].get('bld_nm') or '').strip(): host['props']['bld_nm'] = f['props'].get('bld_nm', '')
    feats = kept
    vw_polys = [f['wp'] for f in feats]
    osm_c = {}
    for oid, o in osm.items():
        wp = [tuple(to_w(*p)) for p in o['ring']]; a, c = area_centroid(wp); osm_c[oid] = c
        if oid in SITE_IDS or inside(c, site_poly): continue
        if vw and any(inside(c, vp) for vp in vw_polys): continue
        feats.append({'src': 'osm', 'id': 'osm:' + oid, 'osm_id': oid, 'ring': o['ring'], 'tags': o['tags'], 'props': {}, 'wp': wp, 'c': c})
    for f in feats:
        if 'c' not in f: f['wp'] = [tuple(to_w(*p)) for p in f['ring']]; f['c'] = area_centroid(f['wp'])[1]
    def nearest(q, lim=8.0):
        # q 를 품은 건물, 없으면 중심이 가장 가까운 건물(lim m 이내)
        for f in feats:
            if inside(q, f['wp']): return f
        best = min(feats, key=lambda f: np.hypot(f['c'][0] - q[0], f['c'][1] - q[1]))
        return best if np.hypot(best['c'][0] - q[0], best['c'][1] - q[1]) < lim else None
    # OSM 에서 받은 이름·층수 태그는 브이월드 건물에도 넘겨 준다
    for oid, o in osm.items():
        if not vw or oid in SITE_IDS: continue
        f = nearest(osm_c[oid], 3.0)
        if f and f['src'] == 'vworld':
            for k in ('name', 'building', 'building:levels', 'height', 'addr:housenumber', 'addr:street'):
                if k in o['tags'] and k not in f['tags']: f['tags'][k] = o['tags'][k]
            f.setdefault('osm_ids', []).append(oid)

    # 로드뷰 기록을 건물에 연결(키 = OSM id → 그 OSM 외곽선 중심을 품은 건물, 또는 ll:위도,경도)
    rv_by_id = {}
    for k, v in near_rv.items():
        if k.startswith('_'): continue
        if k.startswith('ll:'):
            la, lo = map(float, k[3:].split(',')); q = tuple(to_w(la, lo))
        else: q = osm_c[k]
        f = nearest(q, 20.0 if k.startswith('ll:') else 8.0)
        if f: rv_by_id[f['id']] = v
        else: print('로드뷰 기록 연결 실패', k)
    wing_ids = {}
    for label, poly, wh, oid in WING:
        f = nearest(osm_c[oid])
        if f: wing_ids[label] = f['id']

    out, stats = [], {'near': 0, 'far': 0, 'verify': {}}
    for f in feats:
        pts = f['wp']
        area, cen = area_centroid(pts)
        if area < 12: continue
        dist = float(np.hypot(*(np.array(cen) - site_c)))
        if dist > R_FAR: continue
        near = dist <= R_NEAR
        pts = simplify(pts, 0.3 if near else 0.8)
        tags, props = f['tags'], f['props']
        kind = kind_of(tags, props)
        rv = rv_by_id.get(f['id'])
        floors = h = None; how = []
        if props:
            gf = props.get('grnd_flr'); ht = props.get('height')
            try: floors = int(gf) if gf not in (None, '', '0') else None
            except ValueError: floors = None
            try: h = float(ht) if ht not in (None, '', '0', '0.0') else None
            except ValueError: h = None
            if h and floors and not (2.4 <= h / floors <= 7.5): h = None   # 높이 값이 층수와 맞지 않으면 버림
            if floors or h: how.append('api')
        if floors is None and tags.get('building:levels'):
            try: floors = int(float(tags['building:levels'])); how.append('osm')
            except ValueError: pass
        if h is None and tags.get('height'):
            try: h = float(str(tags['height']).replace('m', '')); 'osm' in how or how.append('osm')
            except ValueError: pass
        fh = FLOOR_H[kind]
        if rv:
            fh = rv.get('floor_h', fh)
            how.insert(0, 'roadview')
        est = False
        if floors is None and h is None:
            floors = estimate_floors(kind, area); est = True; how.append('estimate')
        api_floors = floors if 'api' in how else None
        if rv and rv.get('floors'): floors = rv['floors']
        if h is None or (rv and rv.get('floors') and (api_floors is None or rv['floors'] != api_floors)):
            h = round(floors * fh + (1.2 if kind != 'apt' else 1.5), 1)   # 파라펫·옥탑 일부 포함
        if floors is None: floors = max(1, round(h / fh))
        if f.get('osm_ids'): b_osm = f['osm_ids']
        else: b_osm = [f['osm_id']] if f.get('osm_id') else []
        if rv: cls, color = rv['cls'], rv['color']
        else:
            yr = props.get('useapr_day') or ''
            cls, color = default_cls(kind, h, area, hash01(f['id']), int(yr[:4]) if yr[:4].isdigit() else None)
        name = (rv or {}).get('name') or tags.get('name') or (props.get('bld_nm') or '').strip() or ''
        if not name and tags.get('addr:housenumber'):
            name = (tags.get('addr:street') or '') + ' ' + tags['addr:housenumber']
        b = {
            'id': f['id'], 'name': name.strip(), 'src': f['src'], 'near': near, 'dist': round(dist, 1),
            'outline': [[round(x, 2 if near else 1), round(z, 2 if near else 1)] for x, z in pts], 'h': round(h, 1), 'floors': floors, 'floor_h': fh,
            'osm': b_osm, 'cls': cls, 'color': color, 'verify': how[0] if how else 'estimate', 'verify_all': how, 'estimated': est,
        }
        if not b['osm']: del b['osm']
        if len(how) <= 1: del b['verify_all']
        if api_floors and api_floors != floors: b['floors_api'] = api_floors
        if props.get('useapr_day'): b['approved'] = props['useapr_day']
        if rv:
            for k in ('shop_glass', 'windows', 'ref', 'note'):
                if k in rv: b[k] = rv[k]
            if rv.get('verify'): b['verify_note'] = rv['verify']
        out.append(b)
        stats['near' if near else 'far'] += 1
        stats['verify'][b['verify']] = stats['verify'].get(b['verify'], 0) + 1

    # Wing 값과 비교
    diffs = []
    byid = {b['id']: b for b in out}
    for label, poly, wh, oid in WING:
        b = byid.get(wing_ids.get(label))
        if not b: continue
        wpts = [P(*q) for q in poly]; wa, wc = area_centroid(wpts); ba, bc = area_centroid([tuple(p) for p in b['outline']])
        d = float(np.hypot(wc[0] - bc[0], wc[1] - bc[1]))
        diffs.append({'wing': label, 'id': b['id'], 'name': b['name'], 'wing_h': wh, 'h': b['h'], 'floors': b['floors'],
                      'verify': b['verify'], 'floors_api': b.get('floors_api'), 'centroid_offset_m': round(d, 1), 'wing_area': round(wa), 'area': round(ba)})

    meta = {
        'about': '케이프혼타워 주변 건물(근경 250m, 원경 1.2km). 좌표는 Wing 월드 좌표(m): x = (px-914)/41.6, z = (py-770)/41.6, y 위쪽. outline 은 [x, z] 목록',
        'generated': '2026-10-30', 'osm_timestamp': osm_time, 'vworld_count': len(vw),
        'transform': {
            'enu_origin_latlon': [LAT0, LON0], 'enu_scale_m_per_deg': [KX, KY],
            'enu_to_world_2x2': [[round(v, 8) for v in r] for r in M.tolist()], 'enu_to_world_t': [round(v, 4) for v in t.tolist()],
            'note': 'world[x,z] = M @ [east_m, north_m] + t, east_m = (lon-lon0)*kx, north_m = (lat-lat0)*ky. 거울상 포함 강체 변환(축척 1)',
            'method': fitinfo['method'],
            **{k: ({'max': round(float(v.max()), 2), 'rms': round(float(np.sqrt((v ** 2).mean())), 2), 'n_points': int(len(v))} if isinstance(v, np.ndarray) else v)
               for k, v in fitinfo.items() if k != 'method'},
            'north_deg_effective': round(math.degrees(math.atan2(-(M @ [0, 1])[1], -(M @ [0, 1])[0])), 2),
        },
        'classes': sorted({b['cls'] for b in out}),
        'counts': stats,
        'license': 'OSM 외곽선 © OpenStreetMap contributors (ODbL 1.0). 브이월드/국토교통부 건물정보(공공누리 1유형, 출처표시). 로드뷰 값은 사람이 보고 기록한 추정치',
    }
    json.dump({'meta': meta, 'wing_diff': diffs, 'buildings': out}, open(os.path.join(HERE, 'buildings.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(meta, ensure_ascii=False, indent=1))
    for d in diffs: print(d)

if __name__ == '__main__':
    main()
