"""변형 굽기 결과(bake/var/<변형키>/manifest.json)를 bake/manifest.json 의 "variants" 키로 합친다: python3 tools/bake/merge-variants.py
변형키는 폴더명의 첫 '-' 를 ':' 로 바꾼 것(g1-slant → g1:slant). 기존 키는 건드리지 않는다."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[2] / 'bake'
man = json.loads((root / 'manifest.json').read_text())
var = {}
for d in sorted((root / 'var').iterdir()):
    f = d / 'manifest.json'
    if not f.exists(): continue
    m = json.loads(f.read_text())
    slots = {s: {'file': f"var/{d.name}/{v['file']}", 'scale': v['scale'], 'gamma': v['gamma']} for s, v in m['slots'].items()}
    var[d.name.replace('-', ':', 1)] = {'res': m['res'], 'cols': m['cols'], 'rows': m['rows'], 'levels': m['levels'], 'slots': slots, 'state': m.get('state')}
man['variants'] = var
(root / 'manifest.json').write_text(json.dumps(man, indent=1, ensure_ascii=False))
print(len(var), 'variants:', ', '.join(var))
