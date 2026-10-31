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
- 그리기 부담 줄이기(10/31): 해 그림자는 해·장면·보이는 층이 바뀔 때만 다시 계산합니다. SSAO 가 켜진 동안 RenderPass 는 건너뜁니다(SSAO 가 같은 화면을 다시 그리므로 결과가 같습니다). 화면을 움직이는 동안에는 SSAO 를 건너뛰고, 멈추고 0.25초 뒤부터 다시 그립니다. 유리 반사 지도를 그릴 때는 가구와 가로수를 숨깁니다.
- 실내 가구는 층마다 '창가'(외벽에서 4m 이내)와 '안쪽' 묶음으로 나눕니다. 건물 밖에서는 안쪽 묶음을 숨기고 가구 그림자를 끕니다. VR 에서는 밖에서 1층 창가만, 안에서는 지금 층만 보입니다(묶음 단위로 숨겨 XR 메시 합치기와 충돌하지 않습니다).
- 가구·화분·가로수·차량 모델은 `tools/model/lighten.mjs` 로 가볍게 만들었습니다(일반 형상은 meshoptimizer 단순화, 잎은 카드 절반을 남기고 1.3배 키움).
- 주변 건물 외벽 무늬는 `context/facade/` 의 미리 만든 이미지를 읽습니다. 무늬를 바꾸려면 `facadeCanvas` 를 고치고 `tests/facade-gen.mjs` 로 다시 만듭니다. 현황용(재개발 구역 아파트 포함) 주변 건물은 '현황'을 처음 고를 때 만듭니다.
- 지하주차장은 층마다 천장판(실내 보기에서 위층이 숨겨져 생기던 검은 천장 대신), 스프링클러 주관·가지관·헤드, 배수관, 케이블 트레이를 인스턴스 묶음으로 둡니다.
- VR 그리기 호출: XR 계층은 같은 재질끼리 합쳐 그리므로 호출 수는 재질 종류 수에 비례합니다. VR 에서는 차량 전부와 보이는 가구를 '꼭짓점 색(재질 색 × 텍스처 평균색) + 구역별 공유 재질'로 바꿉니다. 잎처럼 알파로 모양을 내는 재질과 3m 넘는 큰 판은 그대로 둡니다. 데스크톱은 원래 재질입니다. `?xrflat=0` 으로 끌 수 있습니다.
- 주변 건물 상세(11/1 미리보기 1031.c): 대지 1km 안(학교 뒤 압구정 현대아파트 단지까지)은 `kh-context.js` 의 `detail` 옵션으로 난간벽, 옥탑(아파트는 양 끝 계단실, 그 밖은 계단실·실외기·물탱크), 아파트 발코니(층마다 슬래브·난간·세대 경계 벽), 창 없는 측벽과 맞벽, 1층 상가 간판(가로·세로), 아파트 측벽 동 번호를 형상으로 만듭니다. 상가 띠·간판은 건축물 주용도가 근린생활·판매·업무인 건물에만 붙습니다(`context/add_use.py`). 창 무늬는 건물마다 기둥 간격(0.85～1.25배)과 시작 칸을 달리하고, 지붕은 우레탄 방수(초록)·콘크리트색으로 나눕니다. 야간에는 창 일부(약 45%)와 간판이 켜집니다. 400m 바깥의 상세 형상과 동 번호는 VR 에서 숨깁니다.
- 미성 재건축 가정 동(Wing 신축 모드의 100m 이상 덩어리)은 같은 자리·높이의 아파트 동(발코니·옥탑)으로 바꿔 그립니다. Wing 이 카메라와 우리 건물 사이를 가리는 동을 숨기면(occl), 그 동의 바닥 범위 화소를 셰이더에서 버립니다.
- 주변 땅(`context/ground.json`, OSM): 도로(큰길은 차선·보도·연석), 한강 물, 공원·잔디, 운동장, 지상 주차장, 아파트 단지 바닥, 나무 약 8,500그루(가로수 모델을 옆에서 찍은 그림 카드 3장 교차, 인스턴스), 단지·주차장 주차 차량(대지 200～700m, 단순 형상), 대지 300m 안 이면도로의 전신주·변압기·전선을 그립니다. Wing 이 이미 깐 도로·운동장 바닥판 자리는 비웁니다. VR 에서는 바닥 종류를 꼭짓점 색 한 장으로 합치고(호출 1회) 350m 바깥 나무와 차량, 전선을 숨깁니다. 지하층 안에서는 주변 건물과 땅을 그리지 않습니다.
- 조합별 빛 굽기: 지금 주차 방식·1층 안에 맞는 변형(`bake/var/`) 칸을 기본 아틀라스의 같은 층 칸에 덮어 한 장으로 합칩니다(척도는 큰 쪽으로 맞춤).
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
node perf.mjs pc           # 카메라를 돌리며 프레임 간격·프레임당 그리기 양(_still 은 멈춘 화면)
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
| `tex/sunset-sky_1k.hdr` | Poly Haven [Qwantani Sunset (Pure Sky)](https://polyhaven.com/a/qwantani_sunset_puresky) | Greg Zaal, Jarod Guest | CC0 |
| `tex/night-sky_1k.hdr` | Poly Haven [Qwantani Night (Pure Sky)](https://polyhaven.com/a/qwantani_night_puresky) | Greg Zaal, Jarod Guest | CC0 |
| `assets/cars/car-bmwe90.glb` | Sketchfab "BMW 320i E90 Low Polly" ([링크](https://sketchfab.com/3d-models/none-28f0bc2f0083417a8e521150529034d6)) | rifdanzz | CC BY 4.0 |
| `assets/cars/car-renegade.glb` | Sketchfab "Jeep Renegade 2016" ([링크](https://sketchfab.com/3d-models/none-192f7e81dce84c6780434f692a0f96c5)) | pinceladas3d | CC BY 4.0 |
| `assets/cars/car-kiri10.glb` | Sketchfab "Kiri '10 - Low poly model" ([링크](https://sketchfab.com/3d-models/none-7fd6e15785fa4aa9bfd6e31eb7c97ba6)) | DanielZhabotinsky | CC BY 4.0 |
| `assets/cars/car-modelS.glb` | Sketchfab "Tesla Model S(civ)" ([링크](https://sketchfab.com/3d-models/none-565ff2a0b1b64637bfafb7f6ef1a4085)) | David_Holiday | CC BY 4.0 |
| `assets/cars/car-ace11.glb` | Sketchfab "Ace '11 - Low Poly model" ([링크](https://sketchfab.com/3d-models/none-055ff8a21b8d4d279debca089e2fafcd)) | DanielZhabotinsky | CC BY 4.0 |
| `assets/` 나머지 (가구·가로수·식물·사무실 바닥 텍스처) | 예전 실사 3D 자산 그대로. 출처는 `assets/README.md` | 각 파일 참조 | CC0, CC BY 4.0 |
| `vendor/GLTFLoader.js`, `DRACOLoader.js`, `RGBELoader.js` | three.js r128 examples | three.js authors | MIT (`vendor/THREE-LICENSE.txt`) |
| `vendor/draco/` | Google Draco 디코더 | Google | Apache 2.0 (`vendor/draco/LICENSE`) |

CC BY 4.0 모델은 출처 표기가 의무이며, 이 표로 표기합니다(https://creativecommons.org/licenses/by/4.0/). 가구 모델과 일부 텍스처는 예전 실사 3D 작업(`codex/tower-360-validation` 브랜치 `new/360/assets/`)에서 같은 파일을 가져왔고, 그쪽 출처 기록과 같습니다. 모두 검토용 표현이며 실제 마감·가구 사양이 아닙니다.

차량 5종은 Objaverse(allenai/objaverse, Hugging Face)의 같은 uid 파일을 받아 glTF-Transform 4.1.1로 텍스처 512px WebP, 면 수 단순화(레니게이드 제외), Draco 압축했습니다. 형상은 바꾸지 않고 축척과 방향만 맞춥니다.

## 빛 굽기 (photoreal/tools/bake/)

```bash
node tools/bake/export.mjs <작업폴더> glass                 # 현재 우선 조합 장면을 glTF·층 정보·시간대별 태양으로 내보내기
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P tools/bake/bake.py -- <작업폴더> photoreal/bake --samples 32 --res 160
python3 tools/prefetch-list.py                              # 미리받기 목록 갱신
```

Blender Cycles로 층마다 바닥 위·천장 아래 판이 받는 조도를 오전·오후·석양·야간 4개 시간대로 굽고, 시간대별 아틀라스 PNG 한 장으로 저장합니다. 해의 직사광은 실행 화면의 그림자 맵이 그리므로 굽기에서 뺍니다(낮: 하늘 직접광 + 해·하늘 반사광, 야간·지하: 조명 직접광 + 반사광). 평면 좌표로만 쓰므로 외장을 바꿔도 다시 굽지 않고, 층고가 바뀌면 같은 층 굽기를 늘려 씁니다. 1층 평면안, 주차 방식, 층수처럼 층 배치가 바뀌는 조합은 굽기 대상 조합의 값을 근사로 씁니다.

### 변형 굽기 (1층 안 3종, 주차 방식 3종)

우선 조합(주차 `alt4` + 1층 안 `skin`) 외의 조합은 바꾸는 층만 따로 굽습니다. 조합 16개가 아니라 변형 6개이고, 변형 아틀라스에는 바뀌는 층만 담습니다.

```bash
node tools/bake/export.mjs <작업폴더> glass --sch alt4 --g1 slant --levels 1F       # 라디오 sch-*, g1-* 선택 후 지정 층만 내보내기
blender -b --factory-startup -P tools/bake/bake.py -- <작업폴더> photoreal/bake/var/g1-slant --samples 32 --res 160 --levels 1F
python3 tools/bake/merge-variants.py                                                  # bake/var/*/manifest.json 을 manifest.json 의 variants 로 합침
```

변형키와 층: `g1:slant|straight|corner` 는 `1F`(주차 alt4 기준), `sch:mech` 는 `B2,B1,1F`, `sch:self|alt3` 는 `B3,B2,B1,1F`(자주식1은 1층 안 고정, 1F 천장고도 달라 1F 를 포함). `manifest.variants[키]` 는 `{res, cols, rows, levels:[{key,kind,floor,ceil,box,tile}], slots:{am|pm|sunset|night:{file:'var/<폴더>/bake-<시간대>.png', scale, gamma}}, state}` 이며 `tile` 은 그 변형 아틀라스 안의 칸 번호(`cols` 열 기준)입니다. 기존 키(우선 조합)는 `g1:skin`, `sch:alt4` 에 해당합니다.
