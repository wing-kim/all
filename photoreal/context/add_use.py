#!/usr/bin/env python3
"""buildings.json 에 건축물 주용도 코드(use, 앞 두 자리)를 더한다. build_context.py 다음에 실행.

입력: .cache/vworld.json (브이월드 LT_C_BLDGINFO, usability)
use: 01 단독주택, 02 공동주택, 03 제1종 근린생활, 04 제2종 근린생활, 05 문화·집회, 06 종교, 07 판매, 10 교육연구, 14 업무 ...
겹친 기록을 합친 건물(id 끝 _k)은 같은 원본 id 의 값을 쓴다. 브이월드에 없는 건물(OSM)은 OSM building 태그로 01·02·10 만 채운다.
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
vw = {f['id']: str(f['properties'].get('usability') or '')[:2] for f in json.load(open(os.path.join(HERE, '.cache', 'vworld.json')))}
p = os.path.join(HERE, 'buildings.json'); d = json.load(open(p))
# OSM building 태그 → 용도(브이월드에 없는 건물용)
OSMU = {'school': '10', 'university': '10', 'college': '10', 'kindergarten': '10', 'apartments': '02', 'residential': '02', 'house': '01', 'detached': '01',
        'church': '06', 'commercial': '04', 'retail': '07', 'office': '14'}
otag = {}
try:
    for e in json.load(open(os.path.join(HERE, '.cache', 'osm.json')))['elements']:
        t = (e.get('tags') or {}).get('building')
        if t in OSMU: otag[str(e['id'])] = OSMU[t]
except FileNotFoundError: pass
n = 0
for b in d['buildings']:
    u = ''
    if b['id'].startswith('vw:'): u = vw.get(b['id'][3:].rsplit('_', 1)[0], '')
    if not u and b['id'].startswith('osm:'): u = otag.get(b['id'][4:].split('_')[0], '')
    if not u: u = next((otag[o] for o in b.get('osm', []) if o in otag), '')
    if not u and b.get('cls') == 'apt': u = '02'
    if not u and any(k in (b.get('name') or '') for k in ('학교', '초등', '중학', '고등', '대학')): u = '10'
    if u: b['use'] = u; n += 1
    else: b.pop('use', None)
# 아직 모르는 건물이 학교 건물 바로 옆(중심 80m 안)이면 학교 부속 건물로 본다
cen = lambda b: (sum(q[0] for q in b['outline']) / len(b['outline']), sum(q[1] for q in b['outline']) / len(b['outline']))
schools = [cen(b) for b in d['buildings'] if b.get('use') == '10']
for b in d['buildings']:
    if not b.get('use'):
        c = cen(b)
        if any((c[0] - s[0]) ** 2 + (c[1] - s[1]) ** 2 < 6400 for s in schools): b['use'] = '10'; n += 1
json.dump(d, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
print('용도 채움', n, '/', len(d['buildings']))
