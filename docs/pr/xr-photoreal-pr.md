# 렌더(실사 3D)와 VR 을 v107 페이지에 합치기

## 요약

케이프혼타워 3D 모델 페이지의 보기 방식 '렌더'를 실사 3D 로 바꾸고, 퀘스트 3 VR 을 더합니다. Wing v107 원본(SHA-1 `f9e6e081bab8e5f3d5d9b1836196cd9ba87725ca`)과 지니 env_detail(SHA-1 `f9c46ebcc3296d6fcf0ac57eb8996a707c127dde`)을 기준판으로 삼았고, 그 위에 우리 계층을 최소 접점으로 얹었습니다. 기준 브랜치 `main`(dfba839, v93)과 `git merge-tree` 로 충돌이 없음을 확인했습니다. `new/3d-model-vr.html` 은 바꾸지 않았습니다.

## 화면에서 달라지는 것

보기 방식은 Wing v107 구성 그대로 '스케치업 / 렌더 / 실사'이고 '렌더(이전)'는 Wing 처럼 숨김입니다. '렌더'(`vm-real`)를 누르면 실사 3D 계층(`photoreal/kh-photoreal.js`, `window.KHPRLayer`)이 켜집니다. 현황·신축·③ 실측 세 탭 모두에서 스케치업과 렌더의 주변 건물은 지니 실사화 모델로 보이고, 우리 타워와 실내는 실사 재질·구운 빛·가구로 보입니다. 주소 끝 `?pr=1` 은 렌더로 바로 엽니다. VR 은 화면 오른쪽 아래 'VR로 들어가기'이며, 같은 탭과 보기 방식을 손목 메뉴에서 고릅니다.

## 바뀐 파일

| 범위 | 파일 | 내용 |
|---|---|---|
| Wing 페이지 | `new/3d-model.html` | v107 원본 + 지니 env_detail 코드 + 우리 접점(`[PR]`, `[XR]` 표시 60곳). 큰 데이터(KHDATA)는 빼고 `new/models/` 에서 받음 |
| 주변 모델 | `new/models/` | 지니 모델(meshopt .glb, 파일을 바로 연 경우용 .js), 텍스처 KTX2, 라이트맵 아틀라스, VR 아틀라스 |
| 실사 3D | `photoreal/` | 실사 계층, 구운 빛(`bake/`), 텍스처·가구(`tex/`, `assets/`, 무료·오픈 라이선스, `photoreal/README.md` 에 출처), 주변 건물 자료(`context/`, 브이월드·OSM), 도구(`tools/`), 시험(`tests/`) |
| VR | `xr/` | VR 계층(`xr/kh-xr.js`), 시험(`xr/tests/`) |
| 문서 | `docs/` | 작업 기록(`goal-gap-plan.md`), 점검 보고(`qa/`), 인계(`wing-handoff-xr-photoreal.md`), 실기기 목록(`device-checklist.md`), VR 기능 대응표(`vr-feature-matrix.md`) |

시험 산출물(`photoreal/tests/out/`, `xr/tests/out/`, 합계 약 150MB)은 각 폴더의 `.gitignore` 로 이미 빠져 있습니다. 저장소에 들어가는 시험 코드는 약 300KB 입니다. 런타임에 필요한 자산은 약 95MB(주변 모델 48MB 중 절반은 파일을 바로 열 때 쓰는 .js 사본)입니다. 저장소 크기를 줄이려면 `new/models/*.js` 사본과 `docs/qa/history/`, `docs/shots/`(약 5MB)를 빼는 정리 커밋을 따로 만들 수 있습니다(웹 주소로만 볼 때는 .js 사본이 없어도 됩니다).

## 확인 방법

1. 위 미리보기 주소에서 보기 방식 '렌더'를 눌러 외관, 실내(1층·5층·지하), 현황·신축·③ 실측 탭을 차례로 봅니다.
2. 휴대폰과 퀘스트에서 `docs/device-checklist.md` 의 항목을 봅니다.
3. 작업 폴더에서 `node photoreal/tests/qa.mjs` 로 전체 점검을 돌립니다(약 60분, 보고서 `docs/qa/report.md`).

## 점검 결과

전체 점검 합격 기록은 `docs/qa/report.md` 와 `docs/goal-gap-plan.md` §20 에 있습니다.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
