# 지니 단일 HTML 들여오기

지니(주변 환경 담당)가 보내는 단일 HTML 파일을 우리 실사 3D 방식으로 바꿔 넣는 방법입니다. 지니의 파일은 Wing 페이지에 주변 모델과 텍스처를 base64로 넣은 한 파일(10MB 안팎)입니다. 이 파일을 그대로 쓰면 첫 화면에서 10MB를 받아야 하므로, 모델과 텍스처를 꺼내 `new/models/`에 따로 두고 필요할 때만 받습니다.

## 준비 (한 번만)

작업 폴더 밖의 임시 폴더에 변환 도구를 받아 둡니다. 모두 무료 오픈 라이선스입니다(gltfpack MIT, gltf-transform MIT, draco3dgltf Apache-2.0). Homebrew의 `basisu`(Apache-2.0)와 파이썬 Pillow도 필요합니다.

```bash
mkdir -p ~/khj-deps && cd ~/khj-deps && npm i gltfpack@0.22.0 @gltf-transform/core@4 @gltf-transform/extensions@4 draco3dgltf@1.5.7
```

## 실행

통합 작업 폴더(`feature/xr-photoreal`)에서 실행합니다. 먼저 `--dry`로 무엇이 바뀌는지만 봅니다.

```bash
node photoreal/tools/model/jinny-import.mjs "<지니 HTML 경로>" --deps ~/khj-deps --dry
```

```bash
node photoreal/tools/model/jinny-import.mjs "<지니 HTML 경로>" --deps ~/khj-deps
```

도구가 하는 일은 다음과 같습니다.

1. HTML 안의 `window.KHDATA`(Draco 압축 GLB와 webp 텍스처)를 꺼내, 지난번에 들여온 판의 해시(`photoreal/tools/model/jinny/import-state.json`)와 비교해 바뀐 것만 고릅니다.
2. 바뀐 모델은 Draco를 풀어 `new/models/<id>.js`(파일을 바로 연 file:// 대비)로 쓰고, `env-glb.mjs`로 meshopt 압축 `.glb`와 `bin-list.js`를 갱신합니다. GitHub Pages가 .glb를 gzip으로 보내므로 meshopt 쪽이 Draco보다 받는 양이 비슷하거나 작고, Draco 해독기를 외부 CDN에서 받지 않아도 됩니다.
3. 바뀐 텍스처는 `new/models/tex/<이름>.js`로 쓰고 `env-ktx.py`로 그 텍스처만 KTX2로 바꾼 뒤, `env-atlas.py`로 라이트맵·노후 맵 아틀라스를 다시 만듭니다.
4. HTML의 재질표(`KH.mat`)를 `new/models/kh-lib.js`에 넣고, 바뀐 파일만 캐시 꼬리표(`KH.ver`)를 새로 매깁니다. 우리가 만든 모델(`school410r` 등)은 지우거나 덮지 않습니다.
5. 큰 데이터를 뺀 코드를 지난번 판(`photoreal/tools/model/jinny/import-code.html`)과 줄 단위로 비교해 `photoreal/tests/out/jinny-import/<이전 판>-<새 판>-code.diff`로 남깁니다. 코드 변경은 자동으로 넣지 않습니다.
6. `prefetch-list.py`로 미리받기 목록을 다시 만듭니다.

## 끝난 뒤 손으로 할 일

- 코드 차이 파일을 보고 `new/3d-model.html`에 필요한 부분만 넣습니다. 우리 접점(`[PR]`, `[XR]` 표시)은 유지하고, 보기 방식별 규칙(스케치업은 무광과 외곽선, 렌더는 지니 재질과 Wing 조명, 실사 3D는 라이트맵·가로 요소·가로수까지 전부)을 지킵니다.
- 지니가 Wing 페이지 판을 올렸다면(예: `VER='v107'`), Wing 원본이 저장소에 올라왔는지 먼저 확인하고 Wing 변경과 지니 변경을 나눠 넣습니다. 나누는 방법은 `docs/goal-gap-plan.md`의 v107 반영 기록을 따릅니다.
- `new/3d-model.html`의 `KH_ENV_VER`를 올리고 `node photoreal/tests/qa.mjs`로 점검합니다. 주변 모델 시험은 `env.mjs`와 `envcmp.mjs`입니다.

## 주의

- 지니 판에서 빠진 모델은 지우지 않고 알림만 띄웁니다. 정말 지울지는 확인 후 손으로 정리합니다.
- 우리가 다시 구운 모델(예: 신사중 서쪽 날개를 늘린 `school410r`)은 지니가 원본(`school410`)을 바꿨을 때 다시 구워야 할 수 있습니다. 도구가 `school410`의 변경을 보고하면 `photoreal/tools/model/jinny/build_school.py`로 다시 굽습니다.
