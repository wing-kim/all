#!/usr/bin/env python3
"""브이월드 2D 데이터 API(LT_C_BLDGINFO: 건물 외곽선·지상층수·높이)를 대지 반경 1.3km 범위로 받아 .cache/vworld.json 에 저장.

인증키는 저장소에 넣지 않는다. 환경변수로 넘긴다.
  VWORLD_KEY=... VWORLD_DOMAIN=... python3 fetch_vworld.py
(VWORLD_DOMAIN 은 키 발급 때 등록한 서비스 URL. 브이월드 약관상 응답 원본은 .cache/ 에만 두고 커밋하지 않는다)
"""
import json, math, os, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
LAT0, LON0, R = 37.5230, 127.0213, 1300.0
KEY = os.environ.get('VWORLD_KEY'); DOMAIN = os.environ.get('VWORLD_DOMAIN', '')
if not KEY: sys.exit('VWORLD_KEY 환경변수가 필요합니다')

dlat = R / 110574; dlon = R / (111320 * math.cos(math.radians(LAT0)))
TILE = 0.004   # 타일 크기(도). 한 요청 BOX 를 작게 나눠 1000건 한도를 넘지 않게 한다
feats, seen = [], set()
lat = LAT0 - dlat
while lat < LAT0 + dlat:
    lon = LON0 - dlon
    while lon < LON0 + dlon:
        page = 1
        while True:
            q = {'service': 'data', 'request': 'GetFeature', 'data': 'LT_C_BLDGINFO', 'key': KEY, 'domain': DOMAIN,
                 'format': 'json', 'size': 1000, 'page': page, 'crs': 'EPSG:4326', 'geometry': 'true', 'attribute': 'true',
                 'geomFilter': f'BOX({lon:.6f},{lat:.6f},{min(lon + TILE, LON0 + dlon):.6f},{min(lat + TILE, LAT0 + dlat):.6f})'}
            url = 'https://api.vworld.kr/req/data?' + urllib.parse.urlencode(q)
            for attempt in range(3):
                try:
                    d = json.load(urllib.request.urlopen(url, timeout=60)); break
                except Exception as ex:
                    print('재시도', ex); time.sleep(2)
            r = d.get('response', {})
            if r.get('status') == 'NOT_FOUND': break
            if r.get('status') != 'OK': sys.exit('오류: ' + json.dumps(r, ensure_ascii=False)[:400])
            fc = r['result']['featureCollection']['features']
            for f in fc:
                k = f.get('id') or json.dumps(f['geometry']['coordinates'][0][0][:2] if f['geometry']['type'] == 'MultiPolygon' else f['geometry']['coordinates'][0][:2])
                if k in seen: continue
                seen.add(k); feats.append(f)
            total = int(r['page']['total'])
            print(f'{lat:.4f},{lon:.4f} p{page}/{total} +{len(fc)} 누계 {len(feats)}')
            if page >= total: break
            page += 1
        lon += TILE
    lat += TILE
os.makedirs(os.path.join(HERE, '.cache'), exist_ok=True)
json.dump(feats, open(os.path.join(HERE, '.cache', 'vworld.json'), 'w'), ensure_ascii=False)
print('저장', len(feats))
