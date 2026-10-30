# 주변 건물 데이터 (photoreal/context)

케이프혼타워 대지(서울 강남구 신사동 529 외 2필지, 압구정로 112 동광빌딩 자리) 주변 건물을 실측 자료로 다시 만든 데이터와 three.js 모듈입니다. 실사 3D 계층(`photoreal/kh-photoreal.js`)이 불러 쓰는 것을 전제로 하며, 이 폴더는 장면에 직접 아무것도 넣지 않습니다. 용도는 내부 검토용 테스트입니다.

## 파일

| 파일 | 내용 |
|---|---|
| `buildings.json` | 근경(대지 중심 250m 이내)과 원경(250m～1.2km) 건물 목록과 좌표 변환 정보 |
| `kh-context.js` | `buildings.json`을 읽어 재질 분류별로 병합한 `THREE.Group`을 돌려주는 모듈(r128 전역 `THREE` 사용) |
| `near_roadview.json` | 로드뷰로 확인한 근경 건물 기록(사람이 작성하는 입력 파일) |
| `build_context.py` | `buildings.json` 생성 스크립트 |
| `fetch_vworld.py` | 브이월드 건물 자료(LT_C_BLDGINFO) 받기(인증키 필요, 받은 원본은 `.cache/`에만 저장) |
| `ref/` | 로드뷰 확인 캡처(카카오 로드뷰 2026년 6월 촬영분, 640px 저용량 JPG) |
| `.cache/` | 원본 자료 보관 위치(커밋하지 않음) |

## buildings.json 구조

```
{
  meta: { transform, counts, classes, license, osm_timestamp, vworld_count },
  wing_diff: [ Wing 근사값과 실측 비교 ],
  buildings: [ {
    id, name, src(osm|vworld), near(bool), dist(m),
    outline: [[x, z], ...],   // Wing 월드 좌표(m)
    h(m), floors, floor_h(m), cls, color("#rrggbb"),
    verify(roadview|api|osm|estimate), verify_all, estimated(bool),
    shop_glass, windows, ref, note   // 로드뷰 확인 건물만
  } ]
}
```

좌표는 Wing의 `new/3d-model.html`과 같습니다. 도면 픽셀 `(px, py)`에 대해 `x = (px-914)/41.6`, `z = (py-770)/41.6`이고 y가 위쪽입니다. 건물은 바닥 y=0에서 `h`까지 세웁니다.

재질 분류(`cls`)는 `tile`(흰 타일·벽돌 타일), `stone`(석재·석재 패널, 띠창), `glass`(유리 커튼월), `brick`(적벽돌·짙은 벽돌), `paint`(도장·회백색 마감), `metal`(금속 패널), `apt`(아파트 도장 외벽과 발코니 창) 7가지입니다. `color`는 외벽 대표색(sRGB)입니다.

## 좌표 변환

- 위경도를 원점 37.5230N 127.0213E 기준의 로컬 동·북 거리(m)로 바꾼 뒤(`east = (lon-lon0)·88288.88`, `north = (lat-lat0)·110574`), 2x2 행렬과 이동량으로 Wing 월드 `[x, z]`로 옮깁니다. 값은 `meta.transform`에 있고 `KHContext.lonLatToWorld(meta, lat, lon)`로 계산할 수 있습니다.
- 변환은 축척 1의 강체 변환(회전, 이동, 도면의 남북 뒤집힘)입니다. Wing의 우리 건물은 설계 도면(대지 749㎡)에서 그려 실제 치수이므로 축척을 고정했습니다.
- 대응점은 우리 대지 두 건물(OSM way 775465793 = 압구정로 112 동광빌딩, 775465794 = 3번지 건물)의 꼭짓점 8개와 Wing의 `existBuilding()` 외곽선입니다. 오차는 최대 2.2m, RMS 1.52m입니다. 이 오차에는 OSM 외곽선 자체의 오차(항공사진 추적)도 섞여 있습니다.
- 변환으로 구한 실제 북쪽은 도면 좌표에서 수평선 위 약 29.5°입니다. Wing의 `NORTH_DEG=36`과 약 6.5° 차이가 납니다(해·그림자 방향에 영향, Wing 값은 고치지 않았습니다).
- 브이월드 연속지적도(필지 경계)를 받으면 `SITE` 네 꼭짓점과 직접 맞출 수 있어 오차가 더 줄어듭니다(남은 일).

## 높이·층수 정하는 순서

1. 로드뷰로 센 층수(`near_roadview.json`) × 층고 + 파라펫 1.2m
2. 브이월드 LT_C_BLDGINFO의 `height`, `grnd_flr`(키를 받아 `fetch_vworld.py`를 돌렸을 때)
3. OSM `height`, `building:levels`
4. 추정: 용도와 바닥면적으로 층수를 정하고(근생 120㎡ 미만 2층, 300㎡ 미만 4층, 800㎡ 미만 5층, 2000㎡ 미만 7층, 그 이상 10층, 아파트 12층, 학교 4층) 층고(근생 3.5m, 업무 3.6m, 아파트 2.9m, 학교 3.8m)를 곱합니다. `estimated: true`, `verify: "estimate"`로 표시합니다.

로드뷰 기록이 없는 건물의 재질·색은 용도와 높이로 정한 추정값입니다(건물 id 해시로 분포를 섞음).

## kh-context.js 사용

```js
// <script src="../photoreal/context/kh-context.js"></script> 뒤에
const grp = await KHContext.load('../photoreal/context/buildings.json', { near: true, far: true });
scene.add(grp);
console.log(grp.userData.stats);   // { buildings, triangles, drawCalls, meshes }
```

- 메시: 근경은 분류별 7개 + 1층 상점 유리 띠(`ctx_shop`), 원경은 `ctx_far_light`·`ctx_far_dark`·`ctx_far_glass` 3개, 지붕은 전체 `ctx_roof` 1개입니다. 현재 자료로 2,702동, 삼각형 약 3.7만 개, 그리기 호출 12회입니다.
- 건물 색은 꼭짓점 색(`color` 속성, 선형값)에 들어 있고 재질 색은 흰색입니다. XR 병합이 원본 재질을 그대로 묶는 방식에 맞췄습니다.
- UV는 u = 벽을 따라간 거리 / 3.2m, v = 높이 / 그 건물의 층고입니다. 창 텍스처 한 칸이 기둥 한 칸·한 층이 되므로 실사 재질을 넘길 때도 이 규칙에 맞춘 반복 텍스처를 쓰면 됩니다.
- 옵션: `material(cls)`로 재질을 직접 넘길 수 있습니다(없으면 64px 절차적 창 텍스처 재질). `exclude: [id]`, `filter(b)`, `maxDist`, `near`, `far`, `shadows`.
- Wing의 `buildContext()`가 만든 근사 주변 건물과 겹치므로, 연동할 때 Wing의 주변 건물 그룹은 숨겨야 합니다(연동은 실사 3D 세션 몫).

## 다시 만드는 절차

```bash
cd photoreal/context
python3 build_context.py                      # .cache/osm.json 이 없으면 Overpass에서 받음
VWORLD_KEY=발급키 VWORLD_DOMAIN=등록URL python3 fetch_vworld.py   # 선택: 브이월드 층수·높이
python3 build_context.py                      # .cache/vworld.json 이 있으면 외곽선·층수·높이를 우선 사용
```

필요한 것은 Python 3와 numpy입니다. 로드뷰로 확인한 건물을 늘리려면 `near_roadview.json`에 OSM way id(또는 `ll:위도,경도`)를 키로 항목을 더하고 다시 생성합니다.

## 자료 출처와 라이선스

| 자료 | 쓰는 곳 | 라이선스·조건 |
|---|---|---|
| OpenStreetMap (Overpass, 기준 2026-07-15) | 외곽선, 일부 층수·높이 | ODbL 1.0. 화면에는 "© OpenStreetMap contributors" 표기. `buildings.json`은 OSM에서 파생된 데이터베이스이므로 공개 배포할 경우 같은 ODbL로 공개해야 합니다 |
| 브이월드 LT_C_BLDGINFO (국토교통부 건축물정보) | 외곽선, 지상층수, 높이(키 발급 후) | 브이월드 저작권정책상 공공누리 표시 확인 후 출처표시. 약관에 무단 저장 금지 조항이 있어 원본 응답은 `.cache/`에만 두고 커밋하지 않습니다 |
| 카카오 로드뷰 (2026년 6월 촬영) | 층수, 외벽 재질·색, 1층 유리, 창 패턴 | 사람이 화면을 보고 값을 기록. `ref/` 캡처는 내부 확인용 참고 자료이며 텍스처로 쓰지 않습니다 |
| Wing `new/3d-model.html` | 좌표계, 대지 건물 외곽선, 비교 대상 | 같은 저장소 |

## 확인 방법별 수와 남은 일

현재 수치는 `buildings.json`의 `meta.counts`에 있습니다. 브이월드 자료를 받기 전에는 대부분의 건물 높이가 추정값입니다.

남은 일:
- 브이월드 인증키 발급 후 `fetch_vworld.py` 실행(층수·높이 실측화).
- 연속지적도로 대지 필지 경계를 받아 좌표 맞춤을 필지 기준으로 다시 하기.
- 로드뷰 확인 범위 넓히기(가로수길 큰 건물, 압구정로10길 블록, 현대고).
