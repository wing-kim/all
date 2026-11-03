"""지니 주변 모델 라이트맵·노후 맵 아틀라스(최적화 1번, 1102.m): python3 -I photoreal/tools/ktx/env-atlas.py
- 건물마다 따로 있던 <id>_lm(RGB)과 <id>_ao(G 만 씀)를 한 장에 모은다: 색 = 라이트맵, 알파 = 노후 맵(없으면 1)
- 칸마다 원래 해상도(512, 큰 것은 512 로 줄임 = 지금 KTX2 와 같음) + 가장자리 4화소 덧댐(밉맵이 옆 칸 색을 끌어오지 않게)
- 두 벌: env_lmao.ktx2(칸 512) 와 env_lmao_256.ktx2(칸 256, 휴대폰·퀘스트·품질 '낮음')
- uv2 는 건물마다 0～1 이므로 로더(3d-model.html khAtlasUV)가 칸 자리로 옮긴다. 칸 자리는 ktx-list.js 의 KH.atlas
- 인코더: basisu(Homebrew basis_universal 2.50, Apache-2.0), ETC1S 선형 q160(지금 라이트맵과 같음)"""
import base64, hashlib, io, json, re, subprocess, tempfile
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[3]
tex = root / 'new' / 'models' / 'tex'
lst = root / 'new' / 'models' / 'ktx-list.js'
tmp = Path(tempfile.mkdtemp(prefix='khenvatlas-'))
def img(n):
    f = tex / (n + '.js')
    if not f.exists(): return None
    m = re.search(r'data:image/\w+;base64,([A-Za-z0-9+/=]+)', f.read_text())
    return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB')
ids = sorted(f.stem[:-3] for f in tex.glob('*_lm.js'))
COLS = 6; ROWS = (len(ids) + COLS - 1) // COLS
out = {'tile': {}, 'cols': COLS, 'rows': ROWS}
for tag, T, PAD in (('', 512, 4), ('_256', 256, 2)):
    C = T + 2 * PAD; W, H = COLS * C, ROWS * C
    at = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    for i, n in enumerate(ids):
        lm = img(n + '_lm').resize((T, T), Image.LANCZOS); ao = img(n + '_ao')
        a = ao.resize((T, T), Image.LANCZOS).getchannel('G') if ao else Image.new('L', (T, T), 255)
        t = lm.copy(); t.putalpha(a)
        # 덧댐: 가장자리 화소를 늘려 붙인다(가운데 T×T 는 원래 그림 그대로)
        cell = t.resize((C, C), Image.NEAREST); cell.paste(t, (PAD, PAD))
        for k in range(PAD):
            cell.paste(t.crop((0, 0, T, 1)), (PAD, k)); cell.paste(t.crop((0, T - 1, T, T)), (PAD, PAD + T + k))
        for k in range(PAD):
            cell.paste(cell.crop((PAD, 0, PAD + 1, C)), (k, 0)); cell.paste(cell.crop((PAD + T - 1, 0, PAD + T, C)), (PAD + T + k, 0))
        x0, y0 = (i % COLS) * C, (i // COLS) * C; at.paste(cell, (x0, y0))
        if not tag: out['tile'][n] = [round((x0 + PAD) / W, 6), round((y0 + PAD) / H, 6), round(T / W, 6), round(T / H, 6)]
    png = tmp / f'env_lmao{tag}.png'; at.save(png)
    dst = tex / f'env_lmao{tag}.ktx2'
    subprocess.run(['basisu', '-ktx2', '-mipmap', '-linear', '-q', '160', '-output_file', str(dst), str(png)], check=True, stdout=subprocess.DEVNULL)
    out['file' + tag] = hashlib.sha1(dst.read_bytes()).hexdigest()[:10]
    print(dst.name, (W, H), dst.stat().st_size // 1024, 'KB')
# 두 판의 칸 자리는 덧댐 비율이 같아(4/512 = 2/256) 같은 uv 를 쓴다
s = re.sub(r';KH\.atlas=.*$', '', lst.read_text().rstrip('\n'))
lst.write_text(s.rstrip(';') + ';KH.atlas=' + json.dumps(out) + ';\n')
print(len(ids), '칸', ids)
