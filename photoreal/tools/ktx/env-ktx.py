"""지니 주변 모델 텍스처(new/models/tex/*.js 안의 base64 그림)를 KTX2(Basis Universal ETC1S)로 바꾼다(1102.l): python3 -I photoreal/tools/ktx/env-ktx.py
- 색(…_albedo 등): ETC1S q192, 긴 변 1024 / 라이트맵·노후 맵(_lm·_ao): ETC1S 선형 q160, 512 / 노멀(_normal): ETC1S 노멀 q192, 512
- 지니 모델 UV 는 뒤집지 않으므로(flipY=false) 그대로 저장한다
- 결과: new/models/tex/<이름>.ktx2 와 목록 new/models/ktx-list.js(KH.ktx = {이름: 해시}). 지니 로더(3d-model.html khTex)가 목록에 있으면 KTX2 를 먼저 읽는다
- 인코더: basisu(Homebrew basis_universal 2.50, Apache-2.0)"""
import base64, hashlib, io, json, re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[3]
tex = root / 'new' / 'models' / 'tex'
tmp = Path(tempfile.mkdtemp(prefix='khenvktx-'))
out = {}; avg = {}
# 1102.o: 이름을 주면 그 텍스처만 바꾸고 나머지는 지금 목록(KH.ktx·KH.avg)을 둔다(jinny-import.mjs). 목록 끝의 KH.atlas 는 env-atlas.py 가 다시 붙인다
only = set(sys.argv[1:])
lst = root / 'new' / 'models' / 'ktx-list.js'
if only and lst.exists():
    t = lst.read_text()
    out = json.loads(re.search(r'\.ktx=(\{.*?\});KH\.avg', t).group(1)); avg = json.loads(re.search(r'KH\.avg=(\{.*?\})[;\n]', t).group(1))
for f in sorted(tex.glob('*.js')):
    if only and f.stem not in only: continue
    s = f.read_text()
    m = re.search(r'data:image/\w+;base64,([A-Za-z0-9+/=]+)', s)
    if not m:
        print('그림 없음', f.name); continue
    im = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB')
    n = f.stem
    a = im.resize((1, 1), Image.BOX).getpixel((0, 0)); avg[n] = [round(c / 255, 3) for c in a]   # 평균색(sRGB 0～1): VR 단색 재질용(압축 텍스처는 화소를 읽을 수 없다)
    if n.endswith(('_lm', '_ao')): args, cap = ['-linear', '-q', '160'], 512
    elif n.endswith('_normal'): args, cap = ['-normal_map', '-q', '192'], 512
    else: args, cap = ['-q', '192'], 1024
    if max(im.size) > cap: im = im.resize((cap, cap * im.size[1] // im.size[0]), Image.LANCZOS)
    png = tmp / (n + '.png'); im.save(png)
    dst = tex / (n + '.ktx2')
    subprocess.run(['basisu', '-ktx2', '-mipmap', *args, '-output_file', str(dst), str(png)], check=True, stdout=subprocess.DEVNULL)
    out[n] = hashlib.sha1(dst.read_bytes()).hexdigest()[:10]
    print(n, im.size, f.stat().st_size // 1024, 'KB →', dst.stat().st_size // 1024, 'KB')
(root / 'new' / 'models' / 'ktx-list.js').write_text('(window.KH=window.KH||{tex:{},glb:{}}).ktx=' + json.dumps(out) + ';KH.avg=' + json.dumps(avg) + ';\n')
print(len(out), '개')
