"""미리받기 목록(photoreal/prefetch.json)을 만든다: python3 tools/prefetch-list.py
페이지를 열면 실사 3D 를 고르기 전에 이 목록을 낮은 우선순위로 받아 브라우저 저장소(HTTP 캐시)에 넣어 둔다.
순서: 코드 → 오후 굽기·낮 하늘 → 텍스처 → 모델 → 나머지 시간대."""
import json, os
from pathlib import Path
root = Path(__file__).resolve().parents[1]
skip_ext = {'.md', '.txt', '.json', '.py', '.mjs'}
skip_names = {'BufferGeometryUtils.js', 'RoundedBoxGeometry.js', 'GLTFExporter.js', 'GLTFLoader.js', 'DRACOLoader.js', 'RGBELoader.js'}
def files(sub):
    out = []
    for p in sorted((root / sub).rglob('*')):
        if p.is_file() and p.suffix not in skip_ext and not p.name.startswith('.') and not (sub == 'assets' and p.name in skip_names) and 'node_modules' not in p.parts and 'tests' not in p.parts:
            out.append(str(p.relative_to(root)))
    return out
first = ['vendor/RGBELoader.js', 'vendor/GLTFLoader.js', 'vendor/DRACOLoader.js', 'vendor/draco/draco_wasm_wrapper.js', 'vendor/draco/draco_decoder.wasm',
         'codex/cafe.js', 'codex/office.js', 'codex/interior-models.js', 'bake/manifest.json', 'bake/bake-pm.png', 'tex/daylight-sky_1k.hdr']
rest = ['context/kh-context.js', 'context/buildings.json', 'context/ground.json'] + [f for f in files('context/facade') + files('tex') + files('assets') + files('bake') if f not in first and not f.endswith('environment.js')]
rest.sort(key=lambda f: (f.startswith('bake/'), f.endswith('.hdr'), f.endswith('.glb') or f.endswith('.gltf') or f.endswith('.bin'), f))
lst = [f for f in first if (root / f).exists()] + rest
size = sum((root / f).stat().st_size for f in lst)
(root / 'prefetch.json').write_text(json.dumps({'files': lst, 'bytes': size}, ensure_ascii=False))
print(len(lst), 'files', round(size / 1e6, 1), 'MB')
