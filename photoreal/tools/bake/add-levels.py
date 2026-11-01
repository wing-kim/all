"""기본 굽기 아틀라스의 빈 칸에 새 층(예: 층수 8의 7F·8F)을 더한다: python3 tools/bake/add-levels.py <굽기 결과 폴더>
굽기 결과 폴더는 bake.py 를 --levels 7F,8F 로 돌린 출력(manifest.json + bake-<시간대>.png). 기본 아틀라스(bake/bake-*.png)의 쓰지 않는 칸에
그 층의 바닥·천장 칸을 옮겨 붙이고 bake/manifest.json 의 levels 에 층 항목을 더한다(이미 있는 층 키는 바꾸지 않는다).
칸마다 밝기 척도(scale)가 다르므로 시간대마다 두 척도 중 큰 값으로 맞추고 화소를 (원래 척도/새 척도)^(1/2.2) 로 다시 맞춘다(감마 2.2 저장).
끝나면 python3 tools/ktx/bake-webp.py 로 webp 사본을 다시 만든다."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parents[2] / 'bake'
src = Path(sys.argv[1])
man = json.loads((root / 'manifest.json').read_text()); add = json.loads((src / 'manifest.json').read_text())
assert man['res'] == add['res'], '해상도가 다르다'
res, cols, rows = man['res'], man['cols'], man['rows']
used = {t for L in man['levels'] for t in L['tile']}
free = [i for i in range(cols * rows) if i not in used]
new = [L for L in add['levels'] if not any(M['key'] == L['key'] for M in man['levels'])]
assert len(free) >= 2 * len(new), f'빈 칸 부족: {len(free)} < {2 * len(new)}'
def box(img, i, c):   # 칸 i 의 화소 범위(행은 텍스처 아래쪽부터: 이미지 y = 높이 - (행+1)·해상도)
    H = img.shape[0]; col, row = i % c, i // c; y = H - (row + 1) * res; return slice(y, y + res), slice(col * res, col * res + res)
for slot, info in man['slots'].items():
    if slot not in add['slots']: continue
    a = info; b = add['slots'][slot]
    A = np.asarray(Image.open(root / a['file']).convert('RGB')).astype(np.float32)
    B = np.asarray(Image.open(src / b['file']).convert('RGB')).astype(np.float32)
    S = max(a['scale'], b['scale'])
    A *= (a['scale'] / S) ** (1 / 2.2); B *= (b['scale'] / S) ** (1 / 2.2)
    for k, L in enumerate(new):
        for j in range(2):
            ys, xs = box(B, L['tile'][j], add['cols']); yd, xd = box(A, free[2 * k + j], cols)
            A[yd, xd] = B[ys, xs]
    Image.fromarray(np.clip(A + 0.5, 0, 255).astype(np.uint8)).save(root / a['file'])
    a['scale'] = S
for k, L in enumerate(new):
    man['levels'].append({**{x: L[x] for x in ('key', 'kind', 'floor', 'ceil', 'box') if x in L}, 'tile': [free[2 * k], free[2 * k + 1]], 'from': str(src.name)})
(root / 'manifest.json').write_text(json.dumps(man, indent=1, ensure_ascii=False))
print('더한 층:', ', '.join(L['key'] for L in new), '칸', free[:2 * len(new)])
