"""미리받기 목록(photoreal/prefetch.json)을 만든다: python3 tools/prefetch-list.py
페이지를 열면 실사 3D 를 고르기 전에 이 목록을 낮은 우선순위로 받아 브라우저 저장소(HTTP 캐시)에 넣어 둔다.
순서: 코드 → 오후 굽기·낮 하늘 → 텍스처 → 모델 → 나머지 시간대."""
import json, os, hashlib
from pathlib import Path
root = Path(__file__).resolve().parents[1]
skip_ext = {'.md', '.txt', '.json', '.py', '.mjs'}
skip_names = {'BufferGeometryUtils.js', 'RoundedBoxGeometry.js', 'GLTFExporter.js', 'GLTFLoader.js', 'DRACOLoader.js', 'RGBELoader.js', 'BasisTextureLoader.js', 'KTX2Loader.js'}
def files(sub):
    out = []
    for p in sorted((root / sub).rglob('*')):
        if p.is_file() and p.suffix not in skip_ext and not p.name.startswith('.') and not (sub == 'assets' and p.name in skip_names) and 'node_modules' not in p.parts and 'tests' not in p.parts and 'tools' not in p.parts:
            out.append(str(p.relative_to(root)))
    return out
first = ['vendor/RGBELoader.js', 'vendor/GLTFLoader.js', 'vendor/DRACOLoader.js', 'vendor/draco/draco_wasm_wrapper.js', 'vendor/draco/draco_decoder.wasm',
         'codex/cafe.js', 'codex/office.js', 'codex/interior-models.js', 'bake/manifest.json', 'bake/bake-pm.webp', 'tex/daylight-sky_1k.rgbe.webp']
rest = ['context/kh-context.js', 'context/buildings.json', 'context/ground.json'] + [f for f in files('context/facade') + files('tex') + files('assets') + files('bake') if f not in first and not f.endswith('environment.js')]
# 압축본(KTX2 텍스처 .ktx2, 압축 모델 .k.glb)이 있으면 원본 대신 압축본을 받는다(실사 계층이 압축본을 먼저 읽는다)
def packed(f):
    p = root / f
    if f.endswith(('.webp', '.png')) and not f.endswith('.rgbe.webp') and p.with_suffix('.ktx2').exists(): return None
    if f.startswith('bake/') and f.endswith('.png') and p.with_suffix('.webp').exists(): return None
    if f.endswith('.glb') and not f.endswith('.k.glb') and p.with_name(p.stem + '.k.glb').exists(): return None
    if f.endswith('.hdr') and p.with_name(p.stem + '.rgbe.webp').exists(): return None   # 하늘: 무손실 RGBE WebP 묶음을 받는다
    return f
rest = [f for f in rest if packed(f)]
first += ['vendor/BasisTextureLoader.js', 'vendor/KTX2Loader.js', 'vendor/basis/basis_transcoder.js', 'vendor/basis/basis_transcoder.wasm']
rest.sort(key=lambda f: (f.startswith('bake/'), f.endswith(('.hdr', '.rgbe.webp')), f.endswith('.glb') or f.endswith('.gltf') or f.endswith('.bin'), f))
lst = [f for f in first if (root / f).exists()] + rest
size = sum((root / f).stat().st_size for f in lst)
# 서비스 워커(new/kh-pr-sw.js)용 파일별 해시: 미리받기 목록 + 실사 3D 가 쓰는 나머지 자산(json·하늘 등). 실사 3D 코드(kh-photoreal.js)는 넣지 않는다(배포 즉시 새 코드)
extra = ['bake/manifest.json', 'context/kh-context.js', 'context/buildings.json', 'context/ground.json', 'vendor/GLTFLoader.js', 'vendor/DRACOLoader.js', 'vendor/RGBELoader.js'] + [f for f in files('vendor') if f.endswith(('.js', '.wasm'))]
hashed = sorted(set(lst + [f for f in extra if (root / f).exists()]))
h = {f: hashlib.sha1((root / f).read_bytes()).hexdigest()[:12] for f in hashed}
(root / 'prefetch.json').write_text(json.dumps({'files': lst, 'bytes': size, 'hash': h}, ensure_ascii=False))
print(len(lst), 'files', round(size / 1e6, 1), 'MB')
