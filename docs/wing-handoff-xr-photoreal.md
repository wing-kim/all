# Wing 인계: 렌더(실사 3D)·VR 계층 (1102.u)

Wing 님이 이 브랜치(`feature/xr-photoreal`)를 main 에 합치고, 앞으로 Wing 쪽 판을 올릴 때 우리 계층을 다시 맞추는 방법을 정리했습니다.

## 기준판

| 기준 | 파일 | SHA-1 |
|---|---|---|
| Wing v107 원본(Wing 과 지니를 합친 판, 2026-11-04 받음) | `케이프혼타워_3D모델_v107.html` 8,366,255 B | `f9e6e081bab8e5f3d5d9b1836196cd9ba87725ca` |
| 지니 env_detail(주변 모델과 대지·램프 구조 변경, Wing 확인 11-04) | `케이프혼타워_3D모델_v107_env_detail.html` 10,278,471 B | `f9c46ebcc3296d6fcf0ac57eb8996a707c127dde` |
| GitHub main | dfba839 (v93) | 이 브랜치가 포함함, `git merge-tree` 충돌 없음 |

## 확인 순서

1. 미리보기(`https://evyfjae.github.io/kapehorn-preview/xr-photoreal/new/3d-model.html`)에서 스케치업과 렌더를 세 탭에서 눌러 봅니다.
2. 같은 화면을 Wing 님 PC 의 크롬에서 보고, 렌더 첫 전환 시간(우리 측정 1,219ms, 기준 2,000ms)을 알려 주시면 더 줄일지 정합니다.
3. `docs/device-checklist.md` 의 퀘스트·휴대폰 항목을 봅니다.
4. 서버 없이 보려면 단일 HTML(`kapehorn-tower-3d_1102.u.html`)을 크롬으로 엽니다. 렌더를 누르면 실사 3D 가 켜집니다(사파리는 확인 전).

원본과 같은지는 `photoreal/tests/tabmodes.mjs`(세 탭 × 보기 방식 화면 비교, 원본 HTML 경로를 인자로), 렌더에서 Wing 옵션이 같은 뜻으로 동작하는지는 `docs/render-option-matrix.md` 입니다.

## 접점 목록 (`new/3d-model.html`)

Wing 파일에서 우리가 손댄 곳은 모두 줄 끝 주석에 `[PR]`(실사 3D) 또는 `[XR]`(VR) 표시가 있습니다(68줄). 큰 갈래는 다음과 같습니다.

| 접점 | 하는 일 |
|---|---|
| 보기 방식 라디오 | '렌더'(`vm-real`)가 실사 3D 를 켬. '렌더(이전)'는 v107 처럼 숨김 |
| `window.KHXR` 연결 통로 | 실사·VR 계층이 renderer·scene·camera·층 목록·이동 함수를 씀 |
| 렌더 루프 | VR 중에는 `xr/kh-xr.js` 가 그림 |
| 주변 모델 로더(`khGlb`, `khTex`, `khKtx`) | KHDATA 대신 `new/models/` 의 meshopt .glb·KTX2 를 받음. 파일을 바로 열면 .js 사본 |
| 지니 실사 레이어(`KHENV`) | `real(on)` 은 실사 3D 가 켬. `lite(on)` 은 VR·품질 낮음에서 단순화(먼 건물 줄인 형상, VR 아틀라스) |
| 지니 가로수 | 우리 건물 정면·남서 모서리 앞 구간은 자름(`front`), 지니 차량은 받지 않음(실사 3D 차량과 겹침) |
| 미성 일대 | '현재/미래(추정)' 토글 |
| 그 밖 | 렌더러 alpha(퀘스트 패스스루), 합친 메시로 숨긴 원본을 보이는 것으로 치는 `visDeep` |

## 합치는 방법

이 브랜치를 그대로 main 에 병합합니다(충돌 없음). 우리 계층은 `<script src="../photoreal/kh-photoreal.js">`, `<script src="../xr/kh-xr.js">` 두 줄로 붙습니다.

## Wing 이 v108 이후를 올렸을 때 다시 맞추는 절차

1. Wing 새 판에서 큰 데이터(KHDATA)를 뺀 코드를 만들고, 지난 기준판 코드와 우리 `new/3d-model.html` 로 3방향 합치기를 합니다(`git merge-file`). 우리 접점은 `[PR]`/`[XR]` 표시로 찾습니다. 1102.s 에서 지니 env_detail 을 이렇게 합쳤고 충돌은 5곳이었습니다.
2. 주변 모델과 텍스처가 바뀌었으면 `node photoreal/tools/model/jinny-import.mjs "<새 HTML>" --deps <도구 폴더>` 로 들여옵니다(`docs/jinny-import.md`). 바뀐 모델만 다시 압축하고 VR 아틀라스도 다시 굽습니다.
3. `new/3d-model.html` 의 `KH_ENV_VER`, `photoreal/kh-photoreal.js` 와 `xr/kh-xr.js` 의 `VER` 를 같은 값으로 올립니다(다르면 페이지가 버전 불일치로 한 번 다시 열립니다).
4. `node photoreal/tests/qa.mjs` 전체 점검(원본 비교는 `KH_ORIG=<새 원본 HTML>` 으로). 의도한 화면 변경이면 `--accept="사유"` 로 기준 화면을 갱신합니다.
5. `node photoreal/tools/bundle-single.mjs` 로 단일 HTML 을 다시 묶습니다.

지니 코드 쪽에서 우리가 고친 곳도 `[PR]` 표시가 있습니다. 1102.s 에서 더한 것은 두 곳입니다. 스케치업 첫 화면 재질에 지니 원본처럼 스케치업 색 이득을 다시 주는 것(`khSkMat`), 차 출입구 코드(`erApply`)가 우리 주차 차량(`prCar`)을 건드리지 않게 하고 형상이 바뀐 메시는 원래 좌표를 다시 받게 한 것입니다.

1102.t 에서 지니 코드 쪽에 더한 것은 두 곳입니다. 하나는 압구정로 단차의 바닥 자르기(`erSplit`)를 위치·색인이 같은 모델이면 한 번만 하도록 `erSplitC`·`erKey` 로 감싼 것입니다. 스케치업 바닥 모델과 렌더-실사 바닥 모델은 위치가 같고 uv 만 달라, 처음 자른 결과의 무게중심 좌표(원래 삼각형 번호와 세 꼭짓점 무게)로 나머지 속성을 다시 섞습니다. 결과는 `erSplit` 과 같고, 윈도우 흉내에서 첫 렌더 전환 한 프레임 4초 멈춤의 큰 부분이 없어졌습니다. 다른 하나는 `khSkMat` 이 이미 선형으로 바뀐 재질(`userData.lin`)에 표시값(`col0`)을 그대로 넣던 것을 선형으로 바꿔 넣게 한 것입니다. 렌더 상태에서 렌더로 다시 들어가면(`setRender(true)` 두 번, `linearize` 는 건너뜀) 신사중 트랙 같은 색이 바랬습니다. 지니 새 판을 합칠 때 이 두 곳(`[PR] 1102.t` 주석)을 다시 확인해 주세요. 1102.u 에서는 지니 VR 단순화 비율(`khLod` 와 `khPackLite` 의 거리별 비율·허용 오차)을 덜 줄이게 바꿨습니다(`[PR] 1102.u` 주석).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
