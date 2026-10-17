# 레퍼런스와 적용 판단 — 2026-10-16

## PlayCanvas Sponza Lightmap Demo
- 출처: https://playcanvas.com/project/391368/overview/sponza-lightmap-demo
- 실제 실행: https://playcanv.as/p/txPePQvy/
- 확인 깊이: 공식 문서 읽기 + IAB에서 START→Dynamic→Lightmapped 실제 전환/렌더 확인. screenshots reference-sponza-runtime.jpg / reference-sponza-baked.jpg.
- 관측: 두 경로에서 조명이 유지된 연속 카메라 장면이 표시된다. 데모 자체 FPS 표시가 전환 전17.2/후103인 순간이 있었으나 구도가 움직이고 계측 조건이 통제되지 않았으므로 비교 벤치마크나 우리 프로젝트 예상속도로 사용하지 않는다.
- 채택할 원리: 고정된 조명 결과를 표면에 저장해 카메라 이동 시 조명을 새로 계산하지 않는다. 단순기하만으로 사실감이 생기는 것이 아니라 재질/표면과 그림자 디테일도 필요하다.
- 그대로 쓰지 않을 부분: 원본 프로젝트는 구조/일시 변경이 중요하다. 직사광 전체를 고정시키면 채광 판단을 훼손한다. 따라서 고정 간접광/차폐와 원본 태양을 따르는 실시간 직사광을 분리하고 구조 변경 시 유효성을 검사한다.
- 엔진 교체 판단: 데모의 장점은 베이크/자산 파이프라인이며 지금 즉시 PlayCanvas로 옮겨야 한다는 근거는 아니다. 기존 기능 연결과 변환비용 때문에 현재 렌더러에서 먼저 검증한다.

공식 기술 문서: https://developer.playcanvas.com/user-manual/graphics/lighting/runtime-lightmaps/
문서상 런타임 라이트맵은 GI를 지원하지 않으며, UV1과 배치 처리에 제약이 있다. 현재 프로젝트의 AO를 GI라고 부르면 안 된다. 고품질 간접광에는 별도 오프라인 베이크를 검토한다.

## Babylon Mansion
https://editor.babylonjs.com/experiments/mansion
공식 소개와4K/desktop제약 안내만 확인. 직접 렌더 실행/기능 동등 비교 미완. 목표달성 성공 증거로 사용하지 않는다.

## 현재 케이프혼 판단
- 기본 탐색(외부/카페)에서 카메라 이동에 따른 재생성/정밀누적이 없음을 실제 계측했다. 실사 이미지에 준하는 품질은 아직 미달.
- 정밀렌더 준비는 별도 문제: 33a3b8b IAB에서 tracer생성4393.7ms,전체4455.5ms,취소CPU0ms; 이후4초회전 평균27.02ms,p9530.9ms,max59.7ms,100ms 이상0. 준비 중 메인스레드 차단은 존재하지만 회전마다 반복되지 않는다.
- 초기준비약8초는 여전히 개선 대상. 이 측정은 단일환경/짧은구간이며 모바일/다른GPU보장은 없다.
- 다음: 원본 태양/채광 연결을 먼저 정확히 한 후 동일노출/구도에서 유리·간접광·자산 비교. 색감만 바꿔 불일치한 채광을 가리는 방법은 배제한다.
