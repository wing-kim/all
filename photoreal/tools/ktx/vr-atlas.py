"""VR 용 지니 색 텍스처 아틀라스(1102.r): python3 -I photoreal/tools/ktx/vr-atlas.py
VR 은 그리기 호출 예산(외관 170) 때문에 지니 건물을 텍스처 평균색의 단색으로 그렸다(재질마다 묶음이 나뉘면 29묶음, 약 +27회).
지니 재질이 쓰는 색 텍스처(KH.mat 의 map, 19장)를 한 장(2048x1024, 칸 256 = 안쪽 224 + 둘레 16 이어붙임)에 모아,
VR 합치기가 텍스처 있는 지니 재질을 몇 묶음으로 그리게 한다(new/3d-model.html khFlatMat, xr/kh-xr.js 아틀라스 묶음).
- 지니 UV 는 반복(타일) 좌표라 셰이더가 fract(uv) 로 칸 안을 찾고, 둘레 16화소는 반대편을 이어붙여(wrap) 밉맵 4단까지 이음매가 없다
- 지니 UV 는 뒤집지 않으므로(flipY=false) 그림을 그대로 붙인다
- 결과: new/models/tex/vr_atlas.ktx2(ETC1S q192, 밉맵) 와 new/models/vr-atlas.js(KH.vra = {v, w, h, tile, pad, tiles: {이름: [열, 행]}})
- 인코더: basisu(Homebrew basis_universal, Apache-2.0)"""
import base64, hashlib, io, json, re, subprocess, tempfile
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[3]
M = root / 'new' / 'models'; tex = M / 'tex'
TILE, PAD, COLS, ROWS = 256, 16, 8, 4
IN = TILE - 2 * PAD
s = (M / 'kh-lib.js').read_text(); i = s.index('KH.mat=') + 7; j = s.index(';KH.ver=')
mat = json.loads(s[i:j])
names = sorted({d['map'] for d in mat.values() if d.get('map')})
assert len(names) <= COLS * ROWS, f'칸 부족: {len(names)} > {COLS * ROWS}'
atlas = Image.new('RGB', (COLS * TILE, ROWS * TILE), (128, 128, 128)); tiles = {}
for k, n in enumerate(names):
    m = re.search(r'data:image/\w+;base64,([A-Za-z0-9+/=]+)', (tex / (n + '.js')).read_text())
    im = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB').resize((IN, IN), Image.LANCZOS)
    t = Image.new('RGB', (TILE, TILE))
    for dx in (-1, 0, 1):   # 둘레 이어붙이기: 3x3 으로 깔아 가운데 칸 기준으로 자른다
        for dy in (-1, 0, 1): t.paste(im, (PAD + dx * IN, PAD + dy * IN))
    c, r = k % COLS, k // COLS; atlas.paste(t, (c * TILE, r * TILE)); tiles[n] = [c, r]
tmp = Path(tempfile.mkdtemp(prefix='khvra-')); png = tmp / 'vr_atlas.png'; atlas.save(png)
dst = tex / 'vr_atlas.ktx2'
subprocess.run(['basisu', '-ktx2', '-mipmap', '-q', '192', '-output_file', str(dst), str(png)], check=True, stdout=subprocess.DEVNULL)
v = hashlib.sha1(dst.read_bytes()).hexdigest()[:10]
(M / 'vr-atlas.js').write_text('(window.KH=window.KH||{tex:{},glb:{}}).vra=' + json.dumps({'v': v, 'w': COLS * TILE, 'h': ROWS * TILE, 'tile': TILE, 'pad': PAD, 'tiles': tiles}) + ';\n')
print(len(names), '장 →', dst.name, atlas.size, dst.stat().st_size // 1024, 'KB', v)
