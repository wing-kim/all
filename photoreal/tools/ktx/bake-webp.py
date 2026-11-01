"""굽기 아틀라스(photoreal/bake/**/*.png)를 손실 webp(q92) 사본으로 만든다: python3 tools/ktx/bake-webp.py
조도 지도는 부드러운 그림이라 손실 압축으로 크기가 약 1/8 이 된다. 실사 계층은 webp 를 먼저 읽고, 없으면 png 를 읽는다.
Blender 굽기 도구(tools/bake)는 계속 png 를 만들므로 굽기를 새로 하면 이 스크립트를 다시 돌린다."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[2] / 'bake'
a = b = 0
for p in sorted(root.rglob('*.png')):
    o = p.with_suffix('.webp'); Image.open(p).convert('RGB').save(o, 'WEBP', quality=92, method=6)
    a += p.stat().st_size; b += o.stat().st_size
print(f'{a/1e6:.2f}MB -> {b/1e6:.2f}MB')
