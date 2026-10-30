# 실사 3D 계층 (photoreal/)

Wing 뷰어(`new/3d-model.html`, three.js r128)의 보기 방식에 **실사 3D**를 더하는 계층입니다. WebXR 계층(`xr/`)과 같은 방식으로, Wing 파일에는 연결 통로 두 줄만 넣었습니다(`[PR]` 표시).

```
new/3d-model.html
  window.KHPR = {...}                       // [PR] 연결 통로 (KHXR 줄 바로 아래)
  <script src="../photoreal/kh-photoreal.js"> // [PR] 실사 3D 보기 (xr 스크립트 바로 아래)
```

## 동작 방식

- 두 번째 렌더러나 장면 복사를 만들지 않습니다. Wing의 '렌더' 모드(태양 그림자, SSAO, ACES 톤매핑)를 켠 뒤 재질만 실사 재질로 바꿔 끼웁니다.
- 조합을 바꾸면 Wing이 건물을 다시 만들고, 이 계층은 원본 재질 → 실사 재질 캐시에서 꺼내 다시 끼울 뿐입니다. 텍스처를 다시 받거나 셰이더를 다시 만들지 않습니다.
- 텍스처는 월드 좌표 투영(`onBeforeCompile`)으로 붙입니다. 벽은 벽면을 따라, 바닥은 XZ로, 둥근 기둥은 축 투영으로 실제 크기(타일 m)에 맞춥니다. 원본 형상의 UV와 상관없습니다.
- 실시간 광원을 늘리지 않습니다. 지하 주차장과 1층 카페는 조명기구 위치로 실행 중에 만든 절차적 라이트맵(1m당 4화소 캔버스)을 재질의 간접광에 더합니다.
- 유리는 프레넬 투명도(정면은 안이 비치고 비스듬히는 반사)와 Wing의 주변 반사 큐브맵을 씁니다.
- 하늘과 환경광은 Poly Haven 하늘 HDR(1K)을 PMREM으로 만든 것을 씁니다. 해 질 녘과 야간에는 Wing의 하늘을 그대로 둡니다.
- 주변 건물은 Wing이 거리뷰를 보고 그린 창 패턴 캔버스를 4배 해상도로 다시 만들고, 벽 질감·창 반사(거칠기·금속성 맵)·창 깊이(노멀)를 더합니다. 형태와 높이는 Wing 데이터 그대로입니다.
- 원경 도시(250～1,100m)는 실제 건물이 아닌 분위기용 상자 묶음(인스턴스 1회 그리기)입니다.
- XR: XR 계층이 같은 장면을 병합해 그리므로 따로 할 일이 없습니다. 셰이더를 보강한 재질에는 흰 텍스처를 붙여 XR 병합의 꼭짓점 색 굽기(재질 복제)에서 빠지게 했습니다.

## 주소 옵션

- `?pr=1`: 실사 3D로 시작하고 우선 조합(자주식3, 1층 3안 작은 모서리문, 기준층 같은 선)을 고릅니다.
- `&pf=glass|brick|stack|colonnade`: 마감(올 글라스, 벽돌 피어, 스택 프레임, 자이언트 오더 기둥).
- `&lv=1F|B1|B2|B3`: 해당 층 내부 보기로 시작.

## 시험

```bash
python3 -m http.server 8791 --bind 127.0.0.1     # 저장소 루트에서
cd photoreal/tests && npm install
node measure.mjs pc        # 빈 캐시 로딩·켜기·조합 전환·층 이동 시간, 화면은 out/
node measure.mjs mobile    # 같은 측정을 휴대폰 화면 크기로(맥 GPU 에뮬레이션, 실기기 아님)
node xr.mjs                # IWER 퀘스트 3 에뮬레이터로 XR 그리기 호출·삼각형
```

배포된 미리보기를 잴 때는 `BASE=https://evyfjae.github.io/kapehorn-preview/<슬러그>` 를 앞에 붙입니다.

## 자산 출처와 라이선스

텍스처는 1K WebP로 바꿨고, 아래 표시한 세트는 색 기울기를 없애고 선형 평균을 0.51로 맞췄습니다(색은 코드의 tint 로 줍니다).

| 파일 | 원본 | 작성자 | 라이선스 |
|---|---|---|---|
| `tex/daylight-sky_1k.hdr` | Poly Haven [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Greg Zaal, Jarod Guest | CC0 |
| `tex/asphalt_02_*` (보정) | Poly Haven [Asphalt 02](https://polyhaven.com/a/asphalt_02) | Rob Tuytel | CC0 |
| `tex/ground-concrete_*` (보정) | Poly Haven [Concrete Floor 03](https://polyhaven.com/a/concrete_floor_03) | Rob Tuytel, Matterfield | CC0 |
| `tex/sidewalk-pavers_*` (보정) | Poly Haven [Concrete Pavement 02](https://polyhaven.com/a/concrete_pavement_02) | Charlotte Baglioni | CC0 |
| `tex/facade-granite_*` (보정) | Poly Haven [Granite Tile 03](https://polyhaven.com/a/granite_tile_03) | Charlotte Baglioni | CC0 |
| `tex/office-concrete_*` (보정) | Poly Haven [Concrete Floor 02](https://polyhaven.com/a/concrete_floor_02) | Rob Tuytel | CC0 |
| `tex/interior-stone_*` | Poly Haven [Marble 01](https://polyhaven.com/a/marble_01) | Rob Tuytel | CC0 |
| `tex/furniture-veneer_*` | Poly Haven [Oak Veneer 01](https://polyhaven.com/a/oak_veneer_01) | Jenelle van Heerden | CC0 |
| `tex/brick_*` | Poly Haven [Red Brick 03](https://polyhaven.com/a/red_brick_03) | Rob Tuytel | CC0 |
| `tex/plaster-white_*` (보정, 대비 45%) | Poly Haven [White Plaster 02](https://polyhaven.com/a/white_plaster_02) | Rob Tuytel | CC0 |
| `tex/concrete-wall_*` (보정, 대비 70%) | Poly Haven [Concrete Wall 008](https://polyhaven.com/a/concrete_wall_008) | Dario Barresi, Charlotte Baglioni | CC0 |
| `tex/wall-beige_*` (보정) | Poly Haven [Beige Wall 001](https://polyhaven.com/a/beige_wall_001) | Dimitrios Savva, Rico Cilliers | CC0 |
| `tex/facade-office_*` | ambientCG [Facade019A](https://ambientcg.com/a/Facade019A) | Lennart Demes | CC0 |
| `models/office-diningchair.glb` | Sketchfab "Dining_chair_241120" ([링크](https://sketchfab.com/3d-models/none-a5aa4613bc5b46baba4d9254d6c9c038)) | 3D Error 404 | CC BY 4.0 |
| `models/office-pottedtree.glb` | Sketchfab "Potted Tree" ([링크](https://sketchfab.com/3d-models/none-dd6c9d90421b4a99acdfebbddd4ccf75)) | dylanheyes | CC BY 4.0 |
| `models/office-plantB.glb` | Sketchfab "Potted Plant, Mediterranean med leaf, low poly" ([링크](https://sketchfab.com/3d-models/none-bc7f26baef2a45d18dbd9a5d6d2ec565)) | dudecon | CC BY 4.0 |
| `vendor/GLTFLoader.js`, `DRACOLoader.js`, `RGBELoader.js` | three.js r128 examples | three.js authors | MIT (`vendor/THREE-LICENSE.txt`) |
| `vendor/draco/` | Google Draco 디코더 | Google | Apache 2.0 (`vendor/draco/LICENSE`) |

CC BY 4.0 모델은 출처 표기가 의무이며, 이 표로 표기합니다(https://creativecommons.org/licenses/by/4.0/). 가구 모델과 일부 텍스처는 예전 실사 3D 작업(`codex/tower-360-validation` 브랜치 `new/360/assets/`)에서 같은 파일을 가져왔고, 그쪽 출처 기록과 같습니다. 모두 검토용 표현이며 실제 마감·가구 사양이 아닙니다.
