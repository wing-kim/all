# 작업 상태와 다음 행동

현재 지정 작업 루트: `/Users/jaehwak/Documents/Kapehorn/etc/kapehorn tower`. 이전 pm/문서 작성/kapehorn-all 경로의 기록은 과거 위치다.

갱신:2026-10-16. 최신 사용자 정정: 실사3D는 기존 앱의 표현 모드, 기능 연결은 전체 범위. 고품질 모델은 점진 제작 가능. PROJECT_BRIEF.md/VIEWER_CONTRACT.md가 과거 카페 중심 계획보다 우선한다.

## 최신 재개 요약 — 2026-10-18, 운영 미러 미리보기 갱신, PR 보류 (Claude Code)

이 요약과 맨 아래 체크포인트가 현재 상태다. 아래 초기 감사 이력과 이전 요약은 과거 기록이다.

- **사용자 지시(2026-10-18):** PR은 아직 하지 않는다(draft PR #1은 닫음). 운영 페이지에 이번 기능만 더한 별도 페이지에서 기능 완료를 확인한 뒤, 미완 부분까지 끝내고 사용자 측이 먼저 확인한 다음 PR을 보낸다.
- **브랜치:** `codex/tower-360-validation`. origin에는 08dc508까지 있고 이후 로컬 커밋은 push하지 않았다. main `25b111a`(운영과 동일) 보존. 병합 금지.
- **미리보기:** https://evyfjae.github.io/kapehorn-3d-preview/ (배포 98bc815, 소스 939cd45). 운영 main:/ 전체를 그대로 옮기고(`package-preview.py --mirror-base origin/main`) 실사 3D 런타임만 덮음. 경로가 운영과 같다: `/new/`(대시보드), `/new/3d-model.html`(보기 방식에 '실사 3D' 추가). `?lab=off`는 원본 그대로, `?lab=review`는 바로 실사.
- **일반 주소 동작:** 원본 화면(스케치업)으로 시작, '실사 3D'를 고를 때만 실사 장면을 불러온다. 실사 전용 시점 버튼은 실사 모드에서만 표시. main 대비 19단계 조작 상태는 추가된 실사 설정 체크박스 1개 외 동일, 오류 0.
- **남은 일(목적 기준 미달):** 실시간 화질(특히 유리)이 AI 사진 수준 아님, 카페 외 층 실내 시안·인테리어 후보 전환 없음, 현황·비교 실사 미지원, 13개 버튼 외 사용자 일시·하루재생은 카페가 실시간 대체, 실제 휴대폰 미검증·전송량 48MB.
- **주의:** environment.js·cafe.js·가구 자산 수정 시 카페 재베이크. 배포 전 `node tools/360/test-bake-freshness.mjs`.

## 초기 감사 이력 — 현재 상태가 아님
- Repo wing-kim/all, branch codex/tower-360-validation. 기준 main25b111a(이번 fetch로 확인). 이번 문서 수정 전 HEAD427e254, 작업 트리 깨끗했음.
- 실제 사용량 초기화0% 확인 후 계획/감사 진행. 실행 시작마다 현재 수치 재확인. 총 주간50% 상한,45% 정리,48% 산출물 완료. 문서화도 예산 포함.
- 운영 Pages는 main:/ legacy 배포. 별도 private 저장소 evyfjae/kapehorn-3d-preview 생성 및 공개 Pages 활성화 성공. API public:true/https_enforced:true 확인, 첫 빌드와 IAB 브라우저 렌더 검증 완료. CLI evyfjae의 private-source Pages 사용 가능함을 실제 API로 확인했다.
- 카페 진입/복귀, 이중상 수정, lightMap 전달, 무료 의자 후보 확보 완료. 전체 기능 통합/실내외 품질 성공 아님.
- 현재 다른 층은 스케치 우회, 실사 진입은1F 고정. 날짜/시간/계절 연결이 불완전하고 고정 태양 사용. 이 상태로 채광 의사결정 기능 완료라고 보고하지 말 것.
- Blender5.1.1 사용 가능. cafe-gi-study.json.gz는171객체/248139정점,13배치 누락, 텍스처/외부차폐/조명 미포함. 베이크 적용 금지. 자세한 구현 이력은 rendering-checkpoint.txt/ui-integration-checkpoint.txt.
- 원본 평가 보고 docs/360/assessment.md 등은 존재했지만 제품 목적·전체 기능 계약·재개 우선순위를 통합한 기준 문서가 없었음. 이번에 root AGENTS.md와3개 기준 md로 보완.

## 최신 범위 정정과 배포 착수
실사3D 모드만 추가하고 기존 main 기능은 비간섭 보존, 최종 main 병합 가능한 PR이 목표. 원본 상태관리 전면 재작성은 하지 않는다. evyfjae/kapehorn-3d-preview private 저장소 생성 완료. Pages 활성화/첫 빌드/공개 브라우저 접속 및 외관·카페 렌더 확인 완료. 소스 f8f0831의 패키지를 배포 repo 6426fc9로 push했다. 부모가 GitHub/브라우저 검증, Sol이 모드 진입/이탈 비간섭 수정을 담당. 원본 new/index.html의 업무 문서는 배포 패키지에서 제외한다.

## 다음 실행 순서 / 사용량 관리
1. 0~3% 목표: 기존 운영본 보호하며 온라인 검토 배포. URL·버전·실제 접속/렌더 검증. 사용자 검토 환경 확보가 첫 구현 단계.
2. 3~7% 목표: 원본 상태/명령 계약 확정과 핵심 adapter 연결(층·단면·일시). 소수 성공 사례 조사도 이 단계에서 수행. UI만 보기 좋게 새로 만들지 않는다.
3. 7~10% 목표: 원본 태양/구조 상태를 따르는 실내·외부 대표 검증. 10%1차/최대15%한차례 보완은 기존 지침 유지(배포·연결·조사 포함 총량). UI/채광 기반이 미완이면 미완이라고 판정하고 일정 조정 근거 기록.
4. 15~32%: 검증된 방법으로 기능 대응표 완성, 구조만 있는 층까지 연결, 대표 카페2안/외관환경 품질 확장. 모든 층 고급 가구 제작은 선택 범위.
5. 32~40%: 기존 기능과 모드 왕복·일시·단면·후보·성능·배포 회귀검증.
6. 40~45%: 필수 결함 수정.45~48%:최종 배포/증거/후속 담당자 프롬프트.48~50%예비.
수치는 시간 추정이나 성공 보장이 아닌 관리 경계다. 기능 연결 미완을 ‘자산 미제작’이라고 포장하지 않는다. 품질 실패 시 같은 수치 조정 반복 대신 사례/대안/자료 부족 검토. 예산 내 결과와 한계를 인계한다.

## Sol 분담
기본 Sol1개 순차 실행. 구현 단위: 배포 패키지/갱신 → 상태adapter+테스트 → 태양·베이크유효성 → 층/단면/표시 → 대표자산·조명 → 회귀/인계. 각 단위는 담당파일·기준상태·불변조건·완료증거만 전달한다. 전체 대화 복제/중복감사/재귀위임 금지. 부모는 주요diff·구조/채광 일치·대표화면 판단을 맡는다. 실제 모델 정체와 실행 분담은 구분한다.

## 작업 단위 완료 시 기록 양식
- 커밋/변경 파일:
- 기능 계약 행과 상태(완료/부분/미완/미검증):
- 검증 명령·브라우저·캡처·배포URL:
- 사용량 확인값:
- 미해결/추정/베이크 유효성:
- 다음 첫 행동(파일/재현법):

지속 목적은 PROJECT_BRIEF, 계약은 VIEWER_CONTRACT, 변하는 상태는 이 파일에 기록한다. 과거 기록을 반복해서 앞에 붙이지 않는다. 컨텍스트 압축/새 세션에서는 AGENTS의3파일 읽기 순서 후 git/usage를 확인한다. 다음 담당자 최종 프롬프트는 완료 시 final-handoff-prompt-ko.txt에 별도 작성한다.

## 현재 실행 체크포인트
- 원본 작업 커밋96cc17d: additive-only/최종 병합 원칙, f8f0831: allowlist 패키징.
- 패키지 /private/tmp/kapehorn-preview-f8f0831, 80 runtime files/68,225,660 bytes, 정적 참조33개 누락0. new/index.html 업무 자료 제외.
- 검토 URL(실제 접속 확인): https://evyfjae.github.io/kapehorn-3d-preview/
- 운영 Pages API 재확인: wing-kim/all main:/, built, 설정 변경 없음.
- 최신 주간 사용량2%. 다음: 공개 브라우저 검증 후 상태 기록, Sol lifecycle diff 검수/모드 왕복 테스트.

### 배포 검증 결과
- GitHub Pages build6426fc9: built, error:null. HTTPS modern.js200.
- IAB 공개 URL에서 실시간360 외관 렌더 완료 → 카페 전환 → 스케치업 이탈 → 기존 내부 층 목록 B2~PH2 표시 확인.
- 증거: deployed-preview-exterior.jpg, deployed-preview-cafe.jpg. 초기 로딩은 여전히 길었으며 정확한 성능 계측/Chrome/전체 기능 회귀는 미완.
- 공개 배포 성공은 기능 대응/실사 품질 성공이 아니다. 유리의 세로 반사와 가구 단순함/실내외 균일한 명암은 다음 품질 검토 대상.

### 모드 비간섭 수정 / 다음 구현
- a7f0703: 새 모드 비활성 때 disable 무동작, 원본 컨트롤/렌더 소유권 복원, 외관 카메라 전달, 카페 이탈 시 외관 버튼 선택 복구. 원본 HTML/기존 핸들러 변경 없음.
- node tools/360/test-integrated-lifecycle.mjs 통과. IAB 최신 로컬에서 카페→스케치 전환 후 v-int=false/v-corner=true, 기존 내부 진입→렌더 전환 후 v-int=true 및 B2~PH2 층 목록 확인. 증거 lifecycle-original-interior.jpg. 전체 회귀 완료는 아님.
- 격리 배포 업데이트: 소스8a0ba56(수정a7f0703 포함), 배포8c36fc8.
- 다음 첫 작업: VIEWER_CONTRACT의 날짜/시간/계절 전달 및 현재 고정 태양 덮어쓰기 해결을 bounded Sol 작업으로 진행. integrated.js snapshot → scene.js applyConfig/light → tools/360/modern-entry.js alignDaylight 경로. 원본 R3D 태양 계산/기존 applyTime은 변경하지 말고 읽기/adapter로 전달. 이어서 층·단면 연결.

## 2026-10-16 추가 요구: 시점 변경 대기 금지
다음 단계 우선순위를 수정한다. 채광/층 연결 확장 전에 탐색 성능을 계측하고 통과시킨다. 기본 탐색은 카메라 이동/정지 후 정밀 누적을 기다리지 않는 동일 실시간 경로여야 한다. 사진처럼 보이는 품질은 탐색 화면 자체에서 검증하고 정밀 버튼으로 대체하지 않는다.
- 1단계: 회전/이동/휠의 프레임 간격 p50/p95, 200ms 이상 stall, 지오메트리 재생성·probe·정밀요청 횟수 계측. 최초 다운로드/첫 프레임과 반복 탐색을 구분한다. 외부/카페 모두 검사. 목표 데스크톱 탐색 약30fps 이상, 지속100ms+ stall 없음; 측정 환경과 미달을 공개한다. 이는 보장값이 아니라 통과 기준이다.
- 2단계: 고정 간접광+실시간 직사광/반사의 대표 구간 품질 검증. 구조·일시가 바뀌면 오래된 베이크 무효화. 회전만으로 베이크/모델 재계산 금지.
- 3단계: 원본 상태·채광·층·단면 연결, 필요한 변경만 갱신. 기존 모드 비간섭 회귀 유지.
- 4단계: 실내외 품질 확대, 성능 재검증, 격리 배포와 인계. 각 단계 종료 시 수치/화면/미완 보고. 통과 못한 접근을 목표 달성 가능하다고 확약하거나 전체 확대하지 않는다.
- 공식 참고: https://doc.babylonjs.com/guidedLearning/lightmaps/ (베이크 제작/적용), https://threejs.org/examples/webgpu_loader_gltf_compressed (압축 자산 경로). 참고 사례만으로 이 프로젝트 목표 품질을 증명하지 않는다.
- 현재 배포8c36fc8 IAB 첫 계측: parent 초기준비7999ms, renderer 첫프레임3349.8ms. 4초 외관 자동회전 평균 프레임간격34.87ms, CPU 제출31.69ms(초기샘플 포함). 정밀mode interactive, 시안재생성timing 없음. 기존 통계는200ms 이상 간격을 제외하므로 합격 판단 불가; 새 계측 추가 중. Chrome 커넥터 현재 이용 불가, IAB로 검증 중.

### 탐색 성능 1차 결과 (수정75f0907/4835134)
- 비활성 tracer reset/updateCamera 반복을 제거. 기본 카메라 이동은 지오메트리/probe/정밀 누적을 갱신하지 않음을 카운터로 확인.
- 전체5초/고품질/IAB/local: 외관142간격 평균35.16ms,p9537.4ms,max40.4ms; 카페151간격 평균32.84ms,p9534.7ms,max37.1ms. 100ms 이상0. 각 구간 buildingUpdates/probeRefreshes/precisionRequests/precisionSamples 증가0.
- 초기부모준비7299.6ms, renderer첫프레임3303.8ms(콜드 네트워크 벤치마크 아님). GPU시간이 아닌 프레임 간격/CPU 제출 측정이다. docs/360/navigation-performance.json에 원자료.
- 정밀 생성 후 즉시 취소→이동 시험: tracer생성 확인, 추가정밀샘플0이지만543.8ms 간격1회. 정밀 준비 취소 직후 잔여 지연 문제는 미해결. 일반탐색 전체성공/완전성능통과로 보고하지 않는다.
- 계측 버퍼600개로 확장해5초 전체구간을 보존. 긴 간격을 버리지 않고 idle시만 연속측정종료. stats테스트[16,17,500] 통과. lifecycle test도 통과.
- 공식 사례 후보: https://playcanvas.com/project/391368/overview/sponza-lightmap-demo (lightmap성능 시연), https://editor.babylonjs.com/experiments/mansion (고품질 자산/desktop한계 안내). 아직 우리앱과 동등기능/성능 비교 검증은 안했음.

### 정밀 준비 구간 진단 정정
추가 소스 감사: 위543.8ms는 정밀 준비와 취소를 가로질러 이어진 preview 타임스탬프 구간이므로 ‘취소 후 회전만의543ms’로 해석할 수 없다. 라이브러리 setScene은 메인스레드에서 BVH를 동기 생성하며 텍스처 패킹/빛 준비도 한다. precisionSamples0은 이 준비 비용을 제외하지 않는다. 다음 구현은 requestPrecision 경계에서 프레임 구간을 끊고 준비/취소 소요시간을 별도로 기록한 뒤 검증. 실제 긴 준비를 취소 가능하게 하려면 worker/단계별 준비가 필요하며 기본 탐색에 이 경로를 자동 사용하지 않는다.
- 탐색계측 배포 d607851 (소스8002343), 작업브랜치 push 완료. 이후 코드 수정은 없는 진단 기록이다.

## 사용자 지정 단계 종료 보고 규칙
2026-10-16 추가 요청. 모든 단계 종료 보고에 다음을 포함한다.
1. 전체 계획/현재 위치: 0격리배포 → 1탐색성능 → 2실내외 대표 품질 → 3원본 기능 연결 → 4품질확대·회귀·배포·인계. 완료/진행/예정과 통과 근거 표시.
2. 목적 적합성: 기존 main을 보존하며 구조·채광·후보·인테리어 판단에 실사3D가 기여하는지. 보기 좋은 독립 데모로 이탈하지 않았는지.
3. 레퍼런스: 링크, 확인 깊이(발견/문서확인/실제구동/적용검증), 채택한 방법과 미적용 이유. 단순 검색을 실증이라고 보고하지 않는다.
4. 구현 가능성: 실제 화면·성능·형상/기능 일치 근거, 실내/외부 각각, 미검증·실패·자료부족. 기술 성공과 시각 품질 성공 구분.
5. 자원: 최신 주간 계정 사용률과50%까지의 잔여 여유, 이번 단계 사용률 차이(측정했을 때만), Sol 분담과 중복 방지. 사용률을 토큰 수로 환산하지 않는다.
6. 판단: 계속/방법변경/확대보류 중 하나와 이유, 다음 작업/통과기준/배포URL/커밋. 필요한 후속 작업은 기존 승인 범위에서 계속한다.
현재0완료,1진행(기본 외부/카페 짧은 탐색검증 통과, 초기준비/정밀준비/광범위기기 검증 미완),2~4예정. 레퍼런스는 공식문서/데모 후보를 검색 확인한 수준이며 동등조건 직접비교는 미완. 마지막 실제 주간 조회5%, 다음 단계 경계에서 재조회.

## Goal 상태 확인과 재개용 최신 목표
앱 get_goal 실제 상태 blocked, 과거65% 한도 목표가 남아 있음. 목표 도구는 blocked→active 재개나 objective 수정을 지원하지 않으며 사용자 UI 조작이 필요하다. 이 상태를 완료로 바꿔 우회하지 않는다. 현재 대화의 승인된 구현은 계속할 수 있으나 자동 연속 실행 재개를 확인했다고 보고하지 않는다.
재설정할 목표: 기존 main의 구조·시안·층·채광·단면·사진 등 작동하는 기능을 보존하면서 동일 UI에 연결되는 실사3D 표현 모드를 분리 브랜치에 추가한다. 회전 후 누적 대기 없는 기본 탐색, 실내외 대표 품질 검증, 격리 공개 배포, 회귀 테스트와 main 병합 가능한 PR 및 후속 담당자 인계 프롬프트까지 주간 사용량50% 이내에 마무리한다. 단계마다 전체 계획/현재 위치/레퍼런스 적용/타당성/미완/사용량을 보고한다.45% 정리,48% 산출물 완료,50% 상한.
이번 재개 작업: 정밀 준비의 module/scene/tracer/total/cancel CPU 시간을 별도 계측하고 해당 경계에서 탐색 프레임 타임스탬프를 끊었다. 카메라만 움직일 때는 프레임 연속성을 유지한다. 이 변경은 측정 정확도 개선이며 초기 로딩 자체가 빨라졌다는 뜻은 아니다. 브라우저 재측정은 다음 검증에 포함한다.

## 2026-10-16 지속 작업 재개
- 사용자 추가 조작 없이 현재 승인 작업 계속. 보고만 하고 턴을 끝내는 방식으로 중단하지 않는다. Goal 자동재개 상태와 실제 개발 가능 여부를 구분한다.
- 실제 주간 사용률6%. 50% 초과 예상 시 미리 Claude 전환 준비. docs/360/handoff/claude-code/README.md/PROMPT.md 생성, 원본 저장소/분리브랜치를 이어받는 방식. 아직 도구전환 필요 판정 아님.
- 준비/회전 분리 실제검증: precision-preparation-performance.json. tracer초기화4393.7ms/전체4455.5ms, 이후4초회전평균27.02ms,p9530.9,max59.7,100ms이상0. 일반탐색과 명시적 정밀준비 비용 분리 확인. 정밀준비동기차단 및 초기로딩 최적화는 남음.
- 실증 레퍼런스: PlayCanvas Sponza Dynamic→Lightmapped 실제 실행/화면 비교 완료. reference-method-review.md에 적용/미적용/한계 정리. 베이크를 카메라 독립 조명으로 사용하는 원리 확인, 우리목표 전체달성 증거는 아님.
- Sol 현재 작업: daylight_adapter, 원본 일시/계절/태양 벡터와 실사모드 연결, 조명만 바꿀 때 geometry재생성 금지. 부모 CUA 검증 예정. 기존main핸들러 보존.

## 채광 연결 및 유리 검수 체크포인트
- d95cce4 원본 태양/일시/계절 연결: 겨울오전과 사용자2026-06-21 11시 및 야간 source/render 방향·강도 일치. 하루재생 시 geometry 재생성0, light polling200ms. 베이크는 검증된AO만 사용, sunlightBakeValid=false.
- 6b20293 source-aligned analytic sky256cube. 실제 외관 표시 확인. 회전5초 동안 captures1 유지/probeRefresh증가0/geometry0/precision0. 평균38.73ms,p9542.6,max198.7ms,100ms초과1회: 완전 성능 통과 아님. 하늘 captureCPU12.9ms는 GPU완료 시간이 아니다.
- 유리 분리 비교로 밝은 diffuse alpha 층이 불투명 흰 패턴을 강화함 확인. 형상은 유지하고 alpha 근사의 색/opacity/Fresnel/clearcoat를 완화. glass-preview-after.jpg와 daylight-sky-exterior.jpg; 내부 시야도 직접 확인. 물리적 투과/측정 유리 사양이 아닌 실시간 근사이며 실사 목표 미달.
- 증거 daylight-custom-day.jpg/daylight-night.jpg/daylight-cafe-reference-comparison.jpg: 원본 실사 대비 가구·간접광·창밖 명암 개선 필요.
- 실제 주간 사용률10%,50%까지40%p. 다음 Sol: 원본v-int/층 UI 상태와 실사 카메라 연결, 상세자산 없는층 구조보기 유지. 부모: 유리수정 commit 및 통합 검수 후 격리배포. Claude 인계폴더는 준비됨, 지금 전환 필요는 없음.

## 층 연결/자산 단계 체크포인트
- 496d3c4 원본 내부진입/층 선택을 실사모드 유지하며 전달. 실제IAB 1F→3F→B1 floor/camera/target 일치, buildingUpdates0. f5579d0 공간명령/카메라복원 후속 구현, 부모검증 진행. 단면/주석/미니맵 아직미완.
- 9b85423 PolyHaven Dining Chair02(CC0)1K0.9MB공식파일checksum검증. 기존20개 낮은의자 위치 대체, 바스툴유지, 외곽검사20통과, 브라우저크기·방향확인. cafe-dining-asset.jpg. 원본실사와동일제품이아닌검토용예시.
- 새카페5초회전 IAB고품질: 평균34.66ms,p9538.4,max44.5,100ms초과0; geometry/probe/precision증가0. cafe-dining-performance.json. 정확한fps표시는프레임측정사용(telemetry의rafFPS는idle시렌더FPS가아님).
- 주간실측13%. 다음: 공간명령/모드왕복/Home검수, 격리배포갱신. 병행Sol은 실제ambient-only floor/ceiling베이크가능성검증. 새exporter큰batch삼각형필터링, snapshot1946173vertices559objects/skipped0, 로컬37MB는.gitignore로배포/커밋제외. tools/360/cafe-ambient-source.json.gz. bake적용완료아님.

## 공개 배포와 공간 이동 검수
- source affaaba → isolated deployment c98ee69, Pages built/error:null, 공개 ?lab=review&view=cafe 실제카페/원본UI 확인. deployed-connected-cafe.jpg. 원본main배포 변경없음.
- f5579d0 원본3F엘리베이터홀 camera/target/FOV 일치. 실제키d 이동→스케치복귀 floor/pose/FOV보존, Home키실내UI해제 및 공중전체시점 확인.
- coreTop은doll/단면에 의존, 최초연결은.8m거리제한에걸려벽속카메라버그발견. affaaba에서실사모드에서는예고와함께차단, 원본모드그대로동작(일반URL query없음에서3F코어단면직접확인, original-mode-core-regression.jpg). 연결완료아님.
- 9c88dc7 미니맵/패드/나침반연결: 카메라읽어원본미니맵갱신, 원본패드전진/미니맵좌표클릭→실사카메라이동실제확인. 후속fixed-orbitdistance보정/CSS 상태표시위치 변경은 다음로드재검증예정. 원본라벨/단면전체대응여전히미완.
- 221ec21/4f88863 offlineambientproof: 정확한원본바닥11삼각형336.47㎡/천장14삼각형357.09㎡, Cycles32sample256EXR출력. 공개적용아님. 후속Sol512/256samples와 opt-in study runtime연결진행. 원본전형적출처UVrepeat/alpha/유리전달근사한계명시.
- 마지막실제주간조회18%. 잔여32%p(50상한); 계속진행, 전체기능/실사목표성공확약은아님. Claude핸드오프폴더준비완료,45정리48완료원칙유지.

## Ambient study / interior navigation checkpoint
- bffc4a4: exact floor/ceiling indirect-light atlas, Cycles512/256 samples, offline linear bilateral denoise; sourceEXRs retained, runtime~168KB +8KBmanifest. Query ambientBake=study only, default off. Source-state/furniture/receiver checks; night disabled. Direct sun remains source-controlled. Not quantitative daylight/complete GI.
- Actual IAB matched1Fcorner before/after screenshots cafe-ambient-before.jpg, cafe-ambient-after.jpg(raw noisy), cafe-ambient-denoised.jpg. Noise reduced; ceiling/floor shading is calmer but image-reference realism remains unmet. Walls/furniture still have approximate lighting; do not claim whole-interior baking.
- cafe-ambient-performance.json:5sec mean32.18/p9535.6/max44ms,0 over100; geometry/probe/precision increments0. Firstframe4531ms and studyload1145ms; not controlled startup benchmark, no speedup claim.
- e3a3948 original interior text labels and toggles now visible in modern mode. Source/child camera exact afterQ (rotation, unchangedheight/location); A/Dstrafe, Q/E/arrowsrotate likeoriginal. Roomlabeltoggle staysmodern. Screenshotinterior-labels-navigation.jpg. Height/ramp3Dguides, upperoverlay, sections stillunmapped. Compare split hides labels to avoidincorrectprojection.
- Current weekly measured22%; ongoing section/clipping feasibility audit bysameSol, parentvisualQA. Continue boundedimplementation; broaderphotorealquality notpassed.

### 추가 실제 검증 / 예산24%
- g1 straight 변경→ambientStudy source-state-mismatch/receivers0, skin복귀→active2. 야간off/오후on확인. 구조 보존하면서 오래된베이크무효화 확인.
- 외부전체5초 high평균39.94/p9542.1/max60ms (~25fps), balanced평균30.20/p9532.2/max36.2ms (~33fps); 각geometry/probe/precision0,100ms초과0. 카메라각도가 동일하지 않아 엄밀한속도향상비교아님. 다음기본품질balanced권고, 수동high유지. exterior-current-review.jpg. 외관/환경은원본사진수준미달.
- 실제preview 유리58mesh중29개castShadow=true. 임시runtime에서순수유리castShadow제거실험, 현재카페AM/PM구도차이미미. 소스변경안함. 유리투과그림자/주변가림추가검토필요; 관찰근거없이전체광량을높이지않음.
- 단면감사: 원본LG/ceil/extG/well/ramp가시성은modernflatten에서연결누락. Sol은층단면+coreTop만bounded구현중. 종단면은WebGPUClippingGroup/정밀호환영향이커미완명시유지.
- 현재전체품질/기능목표를50%내완성할수있다고확약할근거없음. 현재단면단위검증후잔여범위재판정,45%전인계정리. Claude폴더가있으며사용자추가조작없이Codex구현계속.

## Chrome 공개 검증과 마지막 연결 보완 — 2026-10-16
- 공개 배포33f87ad, 소스727f0a8: Pages built, Chrome 카페 렌더/ambient valid2면 확인. chrome-public-cafe.png.
- 공개 시험 firstFrame13995.6ms, ambientLoad7918.4ms. 초기 자산 검증이 순차 fetch라 c44bd41에서 병렬화, 모든 해시 일치 후에만 활성화하는 실패 시 해제 계약 유지. test-ambient-downloads.mjs는 동시 시작과 불일치/다운로드실패를 검증.
- 변경 후 로컬 IAB firstFrame3442.3ms/ambientLoad250.9ms/valid2면. 공개 전후의 동일조건 비교가 아니므로 4배 개선이라고 주장하지 말 것.
- d7ea3bc/64b044e: 한계선 원본3개 선을 정확히 복사하고 점선/거리/간격 유지, 토글 시 모드 유지 및3개 선 hide 실제 IAB 확인. t-b1은 legacy M→RMAT→배치/베이크 clone 재질 경로가 달라 아직 스케치 복귀. 무작정 투명도만 변경해 동일기능이라고 주장하지 않는다.
- 나란히 비교 실제 IAB: modern 유지, HTML라벨 hidden, 원본사진 표시. cafe-latest-comparison.png. 사진의 강한 자연광/재질·가구 디테일에 미달. 사진시점 메뉴가 상단 원본 버튼 아래 겹치는 배치 문제를 발견, 후속 UI 정리 필요. 높이3D가이드는 토글로 해제 가능.
- 사용자 요청 Claude Code 준비 완료: root CLAUDE.md, handoff/claude-code/README.md의 실제 실행명령 및 PROMPT.md, 독립 인간인계 final-handoff-prompt-ko.txt. 같은 checkout/branch에서 Codex 쓰기 중지 후 시작. 별도 코드사본 불필요.
- 현재36%, 50%까지 여유14%p. 남은 모든 기능+실내외 사진품질 완료를 보장할 수 없으며 Claude 전환 준비가 필요하다고 판단. 우선 공개 검토본 검증/정확한 남은 항목을 남긴다.

## 검토 UI/배포 캐시 보완
- db4a9a7: 사진시점 선택기가 원본 실내 툴바 아래 보이도록 위치 측정/ResizeObserver 적용. 실제 IAB selector 접근 확인. 하단 설명은 이동패드 위로 여유 확보.
- 공개46a260a 검증에서 parent integrated=limits-1인데 child modern=labels-1로 이전 HTML 캐시가 섞임. integrated child iframe URL에 revision=compare-layout-1 추가, parent loader 토큰도 갱신. 앞으로 해당 release token을 함께 갱신해야 함.
- 공개 warmed reload에서 베이크 valid2면/937.2ms, 첫화면5095.5ms였으나 캐시 구버전 혼합이 발견돼 새버전 성능 증거로 사용하지 않는다. 최신 공개검증을 마지막 체크포인트에 기록할 것.

## 최종 공개 검토 및 인계 준비 체크포인트 — 2026-10-16
- 공개 배포 fcb73ec, 소스220429e. Pages built/error null. Chrome public 실제 카페/원본사진 비교 렌더 확인. chrome-public-final-comparison.png.
- child URL revision=compare-layout-1 확인. 원본3개 LineDashedMaterial dash=.6/gap=.4 확인. ambient requested/valid/enabled=true,2면. 캐시 혼합 오류 이후 새버전 동작 확인.
- 공개 Chrome 이번 초기 renderer firstFrame9322.1ms, ambientLoad2532.3ms. 네트워크/캐시/뷰포트가 이전14초와 통제된 비교가 아니므로 개선율로 인용하지 않는다. 전체 페이지 초기 자산 준비는 이 시간 외에도 존재하며 아직 빠르다고 판정하지 않는다.
- 로컬 비교 메뉴 사진2 선택 실제조작 성공, toolbarBottom194.5/photoTop205. 하단설명도 이동패드 위. cafe-comparison-controls-fixed.png.
- 원본 운영 Pages source main:/ 보존 재확인. 원본HTMLdiff는 additive opt-in hook 중심(+33/-8 시점), 기존 기능 전체 회귀 완료 아님.
- 최신 실제 주간38%. 50%까지12%p,45%정리/48%산출물완료 정책 유지. Claude 진입파일/실행절차/현재 근거가 준비됨. 이 문서 최신요약과 마지막 체크포인트가 역사 기록보다 우선.
- **다음 첫 행동:** git/usage 확인 → VIEWER_CONTRACT 미완료 목록 기반으로 단면/윗층투시/지하투시 adapter를 한 단위씩 선택. 사진수준 전체품질 미달을 숨기지 말 것. 전환 시 Codex/Claude 동시쓰기 금지, 동일 branch를 사용. main merge 금지.

## Claude 시작 절차 사용자 정정 — 2026-10-16
사용자는 Claude가 먼저 전체 목적/계획/가능성/자원 계획을 보고하고 최초 승인을 받은 뒤 계속 작업하기를 요청했다. handoff/claude-code/PROMPT.md를 이 조건으로 교체했고 root CLAUDE.md에 초기 승인 gate를 추가했다. 과거의 즉시 구현 재개 지침보다 우선한다. 권장 시작: claude --model opusplan --permission-mode plan. 로컬2.1.138 설치 확인, 인증/계정 모델 접근은 사용자 실행 시 확인.

## Claude Code 앱의 지정 폴더와 지속 문서 — 2026-10-16
사용자는 터미널이 아니라 Claude Code 앱을 사용한다. 지정 폴더는 현재 Git 루트 kapehorn-all이며 지침은 이미 해당 루트/하위 docs에서 Git으로 관리해 왔다. START_HERE_KO.md에 앱의 작업폴더 선택, 첫 메시지, 문서 역할 및 매 단계/압축 후 갱신 절차를 추가했다. CLAUDE.md를 한글로 정리하고 한글 응답과 최초 승인/승인 후 자율 진행의 구분을 명시했다. 앱에 CLI 옵션/opusplan UI가 반드시 존재한다고 가정하지 않는다. 별도 빈 폴더나 중복 소스 사본을 만들지 않는다.

## 독립 작업 공간 이전 — 2026-10-16
- 사용자 지정 `/Users/jaehwak/Documents/Kapehorn/etc/kapehorn tower`에 --no-hardlinks 독립 clone 생성. 작업브랜치 codex/tower-360-validation, 이전 기준 e694ac2 및 전체 조상 이력 보존. origin은 https://github.com/wing-kim/all.git로 설정. 공유 git worktree/alternates 아님.
- Git 제외 tools/360/node_modules와 cafe-ambient-source.json.gz도 새 위치로 이동. 베이크 입력 SHA256 이동 전후 동일 확인.
- 기존 저장소는 미커밋 변경 없음을 확인한 뒤 원래 local main0f250ee로 복귀. 작업 시작 checkout reflog와 일치하며 diff/ignored status도 비어 있음. 원격 최신main으로 임의 갱신하지 않음. 기존 작업 브랜치/이력도 안전을 위해 삭제하지 않음.
- 지침·인계 프롬프트·시작 안내의 실행경로를 새 위치로 변경. GPT/Claude는 새 폴더에서 시작하고 이전 폴더에 타워 기능 수정 금지. 앱의 현재 대화 프로젝트 선택을 도구로 자동 이동했다고 주장하지 말 것.
- 이전 후 검증: integrated lifecycle 및 cafe ambient guard 테스트 통과. localhost8765 서버를 새 루트에서 재시작하고 START_HERE HTTP 응답이 새 파일과 바이트 일치, viewer HTTP200 확인. 렌더 코드 변경 없는 경로 이전이며 전체 시각 회귀를 다시 수행했다는 뜻은 아님.

## Claude 인수 승인과 S-1 실현 가능성 검증 — 2026-10-17
- Claude Code(Opus 5.5) 인수 검토 보고 후, 사용자가 구현 전에 "실제 사례로 화질 상한을 먼저 확인"하도록 순서를 바꿨다. 승인 범위: S-1(사례 조사, 데모 실행·측정, 로컬 Cycles 상한 렌더, 비교 페이지, 문서화). S0～S8 구현 계획 자체의 최초 승인은 아직 받지 않았다.
- 사용자 지시: **무료 구현만**. 유료 스트리밍·유료 제작 도구·유료 에셋은 참고 사례로만 둔다.
- 결과: docs/360/s1-feasibility.md, evidence/s1/(우리 측 이미지 3장), tools/360/render_cafe_reference.py. 비공개 비교 페이지 https://claude.ai/artifact/7j6n9aQFJjvSt9dCB7tkYJ (타사 캡처 포함, 저장소 미포함).
- 핵심: 베이크·스플랫 사례는 회전 대기 없이 사진급(Shapespark p95 9.3ms, CG 학습 스플랫 약 30fps)이나 조명 고정. 동적 태양 사진급 무료 웹 사례 없음. 우리 카페 Cycles 256샘플(39초)도 AI 사진 미달, 주원인은 자산·재질·조명 연출.
- 새 결함/확인: 정밀 이미지 readRenderTargetPixels 오류(내장 브라우저), 가을15시 실시간 창가 햇빛 자국 vs Cycles 실내 직사광 없음 불일치, GLB 내보내기 유리 불투명, 스냅샷 의자 텍스처 누락.
- Claude 사용량: 주간 전체 모델 10%(인수 시점), 추가 과금 꺼짐.
- **다음 첫 행동:** 사용자에게 S-2(카페 한 장면 무료 실증: 재질 보강 + 두 시간대 Cycles 간접광 베이크 + 동일 구도 비교)와 결함 2건 원인 확인 순서를 승인받는다. 승인 전 구현 금지.
- 2026-10-17 추가: 고정 시간대 전체 빛 베이크 방향과 정적 배포(컴퓨터 상시 가동 불필요) 설명. 실시간 석양 실내 직사광 누락 결함 발견(유리 castShadow 추정, 미확정), 창가 밝은 띠는 직사광 아님으로 정정. 가구·재질은 AI 사진 분위기 기준 무료 자산 교체 허용. 상세 s1-feasibility.md 추가 절.
- **다음 첫 행동(갱신):** S-2 승인 시 (1) 실시간 직사광 누락 원인 확인·수정 (2) 카페 가구·재질 무료 자산 교체 (3) 사용자가 고른 시간대 전체 빛 베이크 웹 적용 (4) 목표 스틸과 동일 구도 비교·회전 측정. 시간대 선택은 사용자 확인 필요.
- 2026-10-17 정정: "실시간 석양 직사광 누락 결함"은 오판(스냅샷 ±60m로 서쪽 도시 건물 누락). 기존 12개 시간대 모두 카페 시점 1에 햇빛 무늬가 거의 없음(최대 봄 15시 바닥 11%). 사용자는 원본 시간대 버튼 중 하나로 실증을 요청했고, 후보를 봄+오후로 제시하고 확인 대기. 베이크 대상은 하늘빛·태양 반사광·실내 조명 간접광으로 조정 제안.

## S-2 시간대 베이크 체크포인트 — 2026-10-17 (Claude Code)
- 커밋: bcce974(슬롯 베이크·런타임·표시), 405fc64(가구 교체·재베이크·캐시 우회 해시 검증), 06ec66c(비동기 결합). 배포 9160b8e→b6b9461.
- 베이크 재현: `blender --background --factory-startup --python tools/360/bake-cafe-ambient.py -- tools/360/cafe-ambient-source.json.gz tools/360/ambient-slots/spring-pm --size 512 --samples 256 --slot spring-pm --sun 0.0758,0.6412,0.7636 --sun-strength 2.6 --sun-color 1,0.8714,0.7379 --device GPU` 후 linear PNG와 manifest를 `new/360/assets/cafe-ambient-slots/spring-pm/`로 복사, index.json에 키 등록.
- 가구를 바꾸면 export-cafe-bake.js로 스냅샷 재추출(로컬, gitignore) → 기준·슬롯 재베이크 필수. 이전 스냅샷은 `cafe-ambient-source.2026-10-16-tufted-chairs.json.gz`로 로컬 보관.
- 증거: docs/360/evidence/s2/, 비공개 비교 페이지 https://claude.ai/artifact/7j6n9aQFJjvSt9dCB7tkYJ (S-2 결과 절).
- **다음 첫 행동:** 수신면을 벽·기둥까지 늘리는 베이크(아틀라스 UV 생성) 설계와 실내 조명 베이크 검토. 병행으로 정밀 이미지 오류 원인 확인. 원본 main 설정 범위 안이면 사용자에게 묻지 않고 진행.

## S-3 카페 전체 베이크 체크포인트 — 2026-10-17 (Claude Code)
- 커밋 f9f358b, 배포 7421428. 비교 페이지 S-3 절, 증거 docs/360/evidence/s3/.
- 재현: (1) 리뷰 페이지에서 `tools/360/export-cafe-bake.js`를 실행해 스냅샷을 `tools/360/cafe-ambient-source.json.gz`로 저장(gitignore, 내보내기 상자 x -15～10, z -15～14.5) (2) `blender --background --factory-startup --python tools/360/bake-cafe-room.py -- tools/360/cafe-ambient-source.json.gz tools/360/room-bake/spring-pm --slot spring-pm --sun 0.0758,0.6412,0.7636 --sun-strength 2.6 --sun-color 1,0.8714,0.7379 --lights tools/360/cafe-room-lights.json --size 2048 --samples 256 --device GPU` (3) manifest.json·uv.bin·day/lights PNG를 `new/360/assets/cafe-room-bake/spring-pm/`로 복사 (4) `node tools/360/test-cafe-room-bake.mjs`로 188/188 객체 일치 확인.
- 작업 중 잡은 문제: 스냅샷 상자가 카페 동쪽 5m를 잘라 천장 미일치 → 상자 확대·면적 기준 거부 규칙. 노드 재질 캐시 키가 같아 라이트맵 없는 원래 셰이더가 재사용됨 → customProgramCacheKey 지정. TSL uniform이 첫 값에 고정 → 조명 세기별 재질 교체.
- **다음 첫 행동:** 원본 시간대 버튼 중 야간(봄·야간 또는 기본 계절 야간)을 같은 방식으로 추가해 실내 조명 채널의 가치를 확인하고, 반사(광택) 근사와 재질 텍스처 보강을 검토. 원본 설정 범위 안이면 묻지 않고 진행.

## 야간 슬롯·반사 처리 체크포인트 — 2026-10-18 (Claude Code, 배포 완료)
- 베이크 스크립트를 다중 슬롯 구조로 변경: UV 한 번 펼침, `uv.bin`·`lights-lightmap.png` 공유, 슬롯별 `day-lightmap.png`. 입력 `tools/360/cafe-room-slots.json`(spring-pm, any-night). 원본 야간 버튼은 계절과 무관(달 방향·세기 0.15·0x8AA0C8)이라 `any-night` 하나로 모든 계절 야간에 적용.
- 런타임: 다중 슬롯·같은 레이아웃 검증(room-slot-layout-mismatch), 야간 매칭(matchRoomSlot), 공유 파일 1회 로드, index/manifest no-cache와 파일 해시 `?v=`로 캐시 혼합 방지. 안내 "미리 계산한 빛(야간 · 카페 전체)".
- 반사 검토 결과: three 0.186 노드 재질은 자체 envMap이 없으면 envMapIntensity 대신 scene.environmentIntensity를 써서, 기존 "envMapIntensity=0"은 무효였고 베이크 면에 환경광 확산이 라이트맵과 이중으로 더해지고 있었다(이전 바닥·천장 모듈도 동일). 환경광에서 반사(specular)만 남기는 노드로 교체: 확산은 라이트맵, 반사는 실시간과 동일. 이중 계산 제거로 봄·오후 화면 평균 124.5→101.2, 바닥 126→92.
- 실시간 환경광은 벽·천장 가림을 무시해 실내가 과하게 밝았음. 베이크 하늘을 실시간 HDR 상향 조도에 맞춤(낮 0.6185, 밤 0.0483, HDR 색). 노출 1.4는 후보 비교 원칙상 유지.
- 확인(2026-10-18): 커밋 727c6e8·c0844dd, 배포 3d22d27(소스 c0844dd). 공개 URL에서 봄+오후 spring-pm, 여름+야간 any-night 적용과 안내 문구 확인, 첫 화면 3.8초, 두 슬롯 준비 4.6초. 로컬 회전 p95 봄·오후 43.1ms·야간 43.5ms, 100ms 초과 0. 평균 밝기 오후 끔 148.9/베이크 94.4, 야간 끔 125.5/베이크 69.7. 증거 docs/360/evidence/s4/, 비교 페이지 S-4 절.
- 판단 대기: 베이크 낮 화면이 실시간보다 어둡고 가죽 의자가 검게 보임. 실내 보기 전용 고정 노출 상향(모든 시안·시간대 동일, 자동 노출 아님)을 다음 선택지로 제안함.
- **다음 첫 행동:** 사용자의 노출 판단을 반영(또는 유지)한 뒤, 다른 시간대 슬롯 추가와 재질 텍스처 보강 검토. 원본 설정 범위 안이면 묻지 않고 진행.

## 원본 시간대 전체 베이크 체크포인트 — 2026-10-18 (Claude Code)
- 판단: 노출은 1.4 유지. 실내만 올리면 베이크/실시간 시간대 간 노출이 달라져 채광 비교 원칙(같은 노출)에 어긋나고, 함께 올리면 실시간이 과노출. 대신 원본 시간대 버튼 전체를 베이크로 채워 시간대끼리 같은 조건에서 비교되게 함.
- 슬롯 13개: 4계절 × 오전·오후·석양(태양 벡터·세기·색은 원본 앱 값) + 모든 계절 야간. 입력 `tools/360/cafe-room-slots.json`, 굽기 154초(Metal), 낮 라이트맵 각 약 3MB.
- 런타임: 낮 라이트맵은 고른 시간대만 처음 쓸 때 내려받음(그동안 실시간+loading-slot), 첫 화면 시간대는 결합 전에 미리 받음, 가구 해시 검증은 매니페스트당 1회. 로컬 확인: 첫 화면 2.9초, 기본 가을·오후 즉시 적용, 겨울·석양 첫 전환 3.8초, 여름·오전 0.4초, 내려받은 낮 맵은 고른 4개뿐.
- 배포 99110dc(소스 d9ac526): 공개 첫 화면 2.9초, 기본 가을·오후 즉시 적용, 13개 시간대 목록, 겨울·오전 전환 0.27초 확인.
- **다음 첫 행동:** 재질 텍스처 보강(가죽·목재가 어둡게 보임)과 창밖 야간 반사 문제(실시간 공통) 검토. 원본 설정 범위 안이면 묻지 않고 진행.

## 사용자 지시: 완성까지 3단계 진행 — 2026-10-18 (Claude Code, 자율 진행 승인)
사용자 원문 요지: "카페에 대해 정해진 방법 내에서 최종 사용할 완성품까지 진행 → 외부 공간도 방법 확정 여부(내부와 같은지 다른지) 보고하고 최종 완성품까지 → 내·외부 확정 후 최종 목적에 맞춰 완성하고 main 머지 직전까지 작업." 필요한 판단은 스스로 하며 진행(원본 설정 범위·무료 조건 유지, main 병합·운영 변경·원본 저장소 push는 사용자 확인).
- **A. 카페 완성품:** 방법은 확정(원본 시간대 버튼별 Cycles 베이크 + 실시간 원본 태양 + 반사만 남긴 환경광 + 무료 자산). 남은 일: ① 재질 텍스처 보강(가죽·목재·바닥·벽·천장 실사 질감, Poly Haven CC0, 베이크와 알베도 일관성) ② 밝기(노출 1.4 유지 원칙과 실내 가독성 조정 방법 결정, 자동 노출 금지) ③ 야간 창밖 밝은 반사(실시간 공통) ④ 완성 판정표(기능·품질·성능·라이선스)와 배포.
- **B. 외부:** 방법 확정 여부 보고(외부는 직사광·그림자·하늘이 지배적이라 실시간 원본 태양 + 지면/외벽 AO·간접광 부분 베이크 조합 예상; 현재 baked-ground.js 존재). 결정 후 완성품까지 구현·배포.
- **C. 마무리:** VIEWER_CONTRACT 미완료 행(종단면·윗층투시·지하투시·era 겹침 등) 처리 또는 미지원 명시, 일반 URL·기존 모드 회귀, PR 설명·인계 문서 정리, main 머지 직전 상태로.

## A. 카페 완성품 체크포인트 — 2026-10-18 (Claude Code)
- 노출 1.4 유지 대신 조명 설계로 실내 밝기 확보: 다운라이트 16개(웜 스포트)+바 펜던트 3개를 lights 채널로 굽고 기본 세기 4(`--lights-scale`, 매니페스트 defaultScale). 다운라이트 격자를 동쪽까지 확장(cafe.js), 펜던트 위치를 cafe.userData.pendants로 노출, 가죽색 #b07648.
- 스냅샷 재추출(이전 것은 cafe-ambient-source.2026-10-17-before-fixtures.json.gz로 로컬 보관), 13개 시간대 재베이크 186초, 188/188 일치.
- 화면 평균 밝기: 봄·오후 98.3, 야간 73.5(따뜻한 카페 분위기). 증거 docs/360/evidence/cafe-final/.
- 회전: 이번 측정 시 기기 전체가 느려 베이크 p95 54～67ms, 같은 조건 베이크 끔 78～108ms. 베이크가 상대적으로 빠름. 절대값은 재측정 필요.
- 캐시 토큰 규칙: scene.js·modern.js·integrated.js 토큰과 내부 프레임 revision을 함께 올려야 함(이번에 revision을 안 올려 옛 cafe.js가 실린 사례 있음).

## B. 외부 방법 확정 — 2026-10-18 (Claude Code)
- A(카페) 배포 ccd29cc(소스 aa6f3db) 공개 확인: 기본 가을·오후 active, revision room-bake-16, 펜던트 반영.
- 외부 방법 결정: 내부와 같은 원리(미리 계산 + 실시간 원본 태양)지만 굽는 대상이 다름. 외부는 직사광·그림자·하늘이 지배하고 일시에 따라 바뀌므로 실시간 유지. 굽는 것은 시간과 무관한 하늘 가림(sky occlusion)만: 한 번 구워 13개 시간대 모두에 유효, 실시간 IBL이 건물 사이에서 과하게 밝은 문제를 보정. 기존 baked-ground.js(지면 sky-AO, aoMap)가 이 방식이며 확장한다.
- 외부 품질 격차의 주원인은 조명보다 자산: 주변 건물이 단순 상자, 보도·가로수·가로등·지면 질감 부족. AI 외관 사진은 다른 외장 시안(스택 프레임)이라 1:1 비교 아님.
- B 완성 계획: ① 하늘 가림 베이크를 지면 + 주변 건물 외벽으로 확장(타워 자체는 시안별 형상이 바뀌므로 제외하거나 시안 키로 검증) ② 보도·연석·가로수·가로등·지면 질감 등 거리 자산 보강(CC0) ③ 대표 외관 구도 캡처·회전 측정·배포.
- 의존성 주의: 지면 하늘 가림은 타워 매싱(층수 등)에 의존하므로 해당 상태 키로 유효성 검사 필요(현재 baked-ground는 상태 검사 없음, 개선 대상).

## B. 외부 완성품 체크포인트 — 2026-10-18 (Claude Code)
- 정정: 지면 하늘 가림 베이크는 처음부터 본 건물을 제외하므로 타워 매싱(층수 등)에 의존하지 않는다. 의존 대상은 주변 건물이며, 이를 서명으로 검증하도록 바꿨다.
- 지면 재질: 보도 Concrete Pavement 02(1.8 m), 공터·기본 지면 Concrete Floor 03(2.5 m), 연석은 같은 콘크리트에 회색 화강석 보정. 모두 Poly Haven CC0, 출처·해시 `docs/360/exterior-ground-source.json`. 도로 아스팔트와 타워 대지 포장은 유지.
- 하늘 가림: 실행 장면에서 원천 재추출(주변 건물 408개, 32만 삼각형), 서명 3f490e5c 불일치 시 실시간 유지, 지면 36면 aoMap + 외벽 335 바인딩 aoNode(지면 AO 파생 근사, 높이 10 m까지).
- 야간: 원본 가로등 5개 위치에 SpotLight(낮 세기 0, 개수 고정), 가로수 잎 낮 발광 보정 야간 해제, 원경 헤이즈 색 시간대 연동(낮 색 고정으로 야간 원경 건물이 하얗게 뜨던 문제 해결). 모듈 `tools/360/exterior-night.js`.
- 측정(로컬, 실사 근사 구도 1600×1000, 자동 회전): 가을·오후 p95 54.9/55.4 ms, 야간 54.5/54.3 ms, bake=off 54.6/61.8 ms, 100 ms 초과 0. 하늘 가림 비용은 오차 범위. 증거 `docs/360/evidence/exterior-final/`.
- 한계: 외벽 하늘 가림은 파생 근사이며 외벽 자체 베이크가 아니다. 타워 유리는 이전 검토값 유지(AI 시안의 어두운 반사 유리와 차이). 주변 건물은 원본 매스 기반 상자형. 공터 표시선·거리 가구는 추가하지 않았다(원본 지면 의미가 미지정).
- 다음: 커밋 → 격리 배포·공개 확인 → C단계(VIEWER_CONTRACT 잔여, 회귀, PR·인계 문서, 머지 직전 정리).

## B 배포 후 결함 수정 — 2026-10-18 (Claude Code)
- 배포 b11dcce(소스 47b2280) 공개 확인에서 카페 베이크가 `furniture-mismatch:360/environment.js`로 꺼짐. 카페 베이크가 가구 정의 파일 전체 해시를 검증하는데 외부 지면 수정이 같은 파일을 바꿨기 때문(안전장치는 의도대로 동작, 결과는 실시간 대체).
- 조치: 현재 장면에서 카페 원천 재추출(수신면 242,270 삼각형·188객체 동일, 동쪽 벽 밖 작은 객체 2개 추가 포착) 후 13개 시간대 재베이크(149초). 값은 소수 4자리까지 동일(가을·오후 평균만 +0.0001). 재발 방지로 `tools/360/test-bake-freshness.mjs` 추가(가구 파일·라이트맵·지면 AO 해시 점검).
- 함께 발견: 카페 시점으로 시작하면 외부 하늘 가림이 context-mismatch. 객체 단위 서명이 시작 시점별 배칭 묶음 차이에 민감했음. 삼각형 단위 서명(715cb916, 333,582 삼각형)으로 바꾸고 다중 재질 배치도 그룹별로 처리, 지면 재베이크(meanAO 0.834). 외부·카페 시작 모두 active 확인.
- 규칙: `new/360/environment.js`·`cafe.js`·가구 자산을 고치면 카페 원천 재추출과 전체 슬롯 재베이크(약 2.5분)가 필요하다. 배포 전 `node tools/360/test-bake-freshness.mjs` 필수.

## C-1 계약 잔여 기능 체크포인트 — 2026-10-18 (Claude Code)
- 종단면 2종(6F~PH2, 지하~옥상): 원본 setSection()을 막지 않고 실행, 부모 렌더러 절단면을 자식 실사 장면 ClippingGroup(`tools/360/section-clip.js`)으로 전달. 건물 재생성 중 감싸기 해제·복원, 주변 표시 토글은 감싼 객체까지 순회. 단면 진입 카메라 추적 3.2초.
- 윗층 투시: 브리지 syncInteriorDisplay가 up 값 변경 시 같은 층을 다시 배치해 자식 원본이 위층 오버레이를 만들고, 기존 오버레이 복사 경로가 실사 장면에 반영. 램프 토글은 기존 가시성 미러로 동작 확인.
- 지하층 투시: 원본 applyB1See와 같은 재질 처리(0.3, depthWrite off)를 실사 재질에 적용, 실내 진입 중 해제. 더 이상 실사 모드를 끄지 않음.
- 현황·비교: 실사3D는 신축 전용으로 판단. 원본 화면 전환 + '신축 전용' 안내·라디오 비활성 + 신축 복귀 시 자동 복원. 사용자 확인 대상(최종 보고에 명시).
- 비간섭: 일반 URL 19단계 main 대비 동일, 오류 0. 증거 `docs/360/evidence/viewer-contract-c/`.
- 테스트: test-section-clip.mjs 추가, test-integrated-lifecycle.mjs 문구 갱신(단면 없으면 절단 주장 안 함, 원본 절단면 있으면 표시). 전체 통과.
- 남은 C: 정밀 이미지 readRenderTargetPixels 오류 조사, 콜드 로딩·모바일 측정, 배포·공개 확인, PR 설명·인계 문서, 머지 직전 정리(원본 저장소 push는 확인 후).

## C-2 정밀 이미지 오류 수정 — 2026-10-18 (Claude Code)
- 원인: 낮 하늘 배경이 원본 하늘 큐브 캡처(CubeRenderTarget 256)라 three-gpu-pathtracer가 WebGL 전용 CubeToEquirectGenerator(renderer.readRenderTargetPixels)를 호출해 WebGPU에서 실패. 야간은 등장방형 그라데이션이라 영향 없음.
- 조치: `tools/360/cube-equirect.js`가 큐브를 WebGPU 셰이더로 1024×512 등장방형에 그리고 readRenderTargetPixelsAsync로 읽어 DataTexture로 넘김(하늘 캡처 횟수 키로 캐시, 종료 시 해제).
- 확인: 실사 근사 구도 정밀 렌더 32샘플 완료, 오류 없음, 하늘 방향 정상. 증거 `docs/360/evidence/viewer-contract-c/precision-reference-32spp.jpg`. 경로 추적 결과는 커튼월이 어둡게 반사되고 실내가 따뜻하게 비쳐 AI 외관 사진에 더 가깝다(실시간 미리보기와의 차이는 남음).

## C-3 전송량·모바일·머지 직전 정리 — 2026-10-18 (Claude Code)
- 첫 방문 전송량(공개, encodedBodySize 합): 60.1MB → 48.1MB. tree-small-02.glb 10.9→6.1MB(WebP+Draco 재적용), concept-car.glb 11.5→1.9MB(WebP+Draco), glTF-Transform 4.1.1. 화면 차이 평균 0.76/255, 정밀 렌더 정상.
- 남은 큰 항목: 1K JPG 텍스처 약 27MB(WebP 전환 시 environment.js 수정 → 카페 재베이크 필요), 2K HDR 3.5MB, 카페 라이트맵(현재 슬롯 3MB + 조명 2.3MB + UV 1MB). 후속 후보로 남김.
- 모바일: 375×812 터치 흉내에서 첫 화면 4.3초, 두 베이크 active, 가로 스크롤 없음. 터치 기기 안내 문구 추가. 실제 휴대폰 GPU 성능은 미측정.
- 공개 확인(72524ab): 종단면 적용·해제, 정밀 이미지 32샘플 완료.
- 머지 범위 조사: main 대비 약 203MB 추가(new/360/assets 99MB, docs 82MB, tools 19MB). 운영 Pages 공개 게시 영향이 있어 런타임만 머지 권장. PR 본문 초안 `docs/360/PR_DESCRIPTION.md`.
- 다음 첫 행동: 사용자 결정(4개)과 push 승인 받기 → 승인 시 브랜치 push, PR 본문 갱신. 머지는 하지 않는다.

## D-1 사용자 지적 5건 수정 — 2026-10-18 (Claude Code)
사용자 지시: 대시보드 비공개·관리 제외, 로딩 단축·진행률 표시, 건물·나뭇잎 자글거림과 깜빡임 해결, 타워 오른쪽 건물 깨짐 수정, 조작을 원본(스케치업)과 내외부 모두 동일하게. 이후 남은 일을 하나의 시안에 대해 완성하고 보고, 승인 후 다른 시안으로.
- 공개 범위: 미리보기는 3D 모델 페이지(new/3d-model.html)와 런타임만. 대시보드·newbuild 등 제거(공개 주소 404 확인), 패키징 미러 기능 삭제.
- 조작: 원본 화면이 입력·카메라를 소유하고 실사는 같은 카메라를 그린다(실사 iframe pointer-events 없음, 원본 캔버스 opacity 0). 실사 쪽 WASD·역방향 카메라 복사 제거. 실사 전용 시점은 viewPose로 목표만 계산 후 원본 카메라 애니메이션. 외부 좌클릭 회전·우클릭 이동·휠, 실내 원본 시선 드래그 동일 확인.
- 화질: 원인은 실사 해상도 배율 1 고정(원본은 2)과 MSAA 없음, 가로수 잎 880만·화분 260만·차량 280만 삼각형. 움직일 때 배율 1 상당 MSAA 4배, 멈춘 뒤 0.15초에 기기 배율(최대 2)+FXAA로 한 번 재렌더. 원경 헤이즈는 재질 안개로 이동. 알파 테스트 잎은 alphaToCoverage. 가로수를 ez-tree 구조+CC0 잎(LeafSet024 잔가지 합성)으로 교체(그루당 2.4만), 화분·차량 단순화. 프레임당 삼각형 1,800만→330만. 2cm 이동 시 크게 바뀌는 픽셀 9,084→3,582.
- 오른쪽 건물: 원본 occl()이 카메라-시점 사이 주변 건물 본체를 숨기는데 실사에 덧붙인 부속(난간·설비·창 유닛)은 배칭돼 남아 깨져 보였고, 숨김 상태도 이벤트 때만 동기화돼 다른 시점에 잔상이 남았다. 해당 건물(본체·부속)은 배칭 제외, 원본과 같은 판정을 카메라 변경마다 실사에서 직접 계산.
- 로딩: JPG 38장 WebP(24.9→6.2MB), HDR 2K→1K(5.3→1.4MB), GLB 감소. 진행률 카드(단계·받은 자산 수·퍼센트), 단계 사이 프레임 양보. 렌더러 준비(셰이더) 약 3초는 남음(compileAsync는 8초로 악화돼 되돌림).
- 주변 건물 서명: 배칭 경로 차이에 따른 cm 반올림 잡음 허용(축별 2,000cm). 카페 13개 시간대 재베이크(environment.js·화분 변경).

## D-2 첫 시안 '올 글라스' 완성 — 2026-10-18 (Claude Code)
기준: 미디어 카탈로그(ext.finish '올 글라스') AI 사진 7각도(000～270)와 같은 각도 렌더를 나란히 비교.
- 실내 간접광(tools/360/interior-fill.js): 미리 구운 빛이 없는 2F～PH·지하는 실시간 하늘 환경광이 벽·천장 가림을 몰라 실내가 바깥처럼 밝고 푸르게 떠, 밖에서 유리가 하늘색 판으로 보였다. 원본 층 평면(level.poly) 다각형 × 바닥판 위～위층 바닥판 아랫면 범위 안 픽셀만 환경광을 22%(지하 5%)로 줄이고 약 3500K 실내 조명 간접광을 더한다. 판정점을 면 바깥 방향으로 25cm 옮겨 외벽 바깥면은 제외. 1층 카페 베이크는 그대로. 테스트 test-interior-fill.mjs.
- 유리(움직임/정지 미리보기): 정면 불투명도 18%→34%, 색 #33474e, 환경 반사 1.5배. 정면에서도 하늘·주변 반사가 읽히고 그 너머로 따뜻한 실내가 보이는 시안 인상에 맞춤.
- 의도적으로 따르지 않은 차이: 주변 건물 색(AI는 흰색 일색, 원본은 에스모드서울 회색 등 실제 구분 색), 후면·측면 코어 벽(AI는 사방 유리, 원본 구조는 코어 벽). 원본 구조·의미 보존 원칙 우선.
- 남은 한계: 유리 반사는 주변 큐브맵 근사라 AI 사진만큼 선명한 반사상은 아님. 실내 층별 시안 사진(f2～f7 등)과의 대조는 다음 단계.

## D-3 로딩 후 조작 대기 제거 — 2026-10-18 (Claude Code)
사용자 지적: 로딩 카드가 끝난 뒤에도 조작까지 대기가 있다.
- 원인(측정): 셰이더·노드 준비가 처음 그릴 때 동기로 일어나 iframe과 같은 스레드인 원본 조작까지 멈췄다. 카드가 닫힌 뒤 카페 베이크 도착 시 약 3.6초, 첫 회전 시 움직임용(MSAA) 패스 약 3.6～3.9초 정지. 공개본에서 20초 대기 후 첫 회전도 3.6초 정지 재현.
- 수정(modern-entry.js): 카드 단계에서 보이는 물체를 60개씩 실제 경로(정지 패스+그림자)로 한 프레임에 한 묶음씩 그려 미리 준비하고 진행률(n/N)을 표시. 카페 베이크는 최대 4초 기다려 같은 준비에 포함. 움직임용 패스는 첫 화면 뒤 compileAsync로 백그라운드 준비, 그 전에는 준비된 정지 패스로 그린다. 늦게 바뀐 재질은 비동기 재준비 동안 이전 화면 유지.
- three 0.186 주의: 후처리 안 장면 렌더는 호출 깊이 1 컨텍스트라 compileAsync(항상 깊이 0)가 맞지 않는다. 준비 중에만 렌더 컨텍스트 조회를 깊이 1로 맞춘다. 패스는 프레임당 한 번만 그려서 묶음 준비는 프레임마다 하나씩.
- 결과(로컬 1600×1000): 카드 닫힌 직후 회전 최악 프레임 0.32초, 움직임용 전환 시 0.08초, 실내 진입 0.22초. 이전 3.5～3.9초 정지 없음. 회전 중 프레임 간격 중앙값은 공개본과 같음(약 64ms, 이 창 기준). 카드 시간은 거의 같고 그 동안 진행률이 계속 갱신된다.

## D-4 외장 시안 25종 대조와 공통 결함 수정 — 2026-10-18 (Claude Code)
대상: 프리셋 20종(스택 프레임～키네틱)과 마감 5종(테라코타·석재·메탈 밴드·벽돌·원안 프레임). 미디어 카탈로그 AI 사진(각 7각도, 175장)과 같은 구도(045·000)로 렌더해 대조.
- 지면 사라짐(기존 결함, 1ea6b41에서도 재현): 원본은 건물을 다시 만들 때 램프·선큰 구멍을 뚫은 3km 지면을 새로 만든다. 실사 복사본은 옛 원본에 묶여 있다가 원본이 장면에서 빠지자 숨겨져, 시안을 바꾸면 지면이 하늘색으로 비었다. 건물 갱신 때 같은 재질·크기의 새 원본에 다시 연결하고 기하만 교체(지면 베이크 UV1 재생성, withGroundUV1 분리·테스트).
- 금속이 검게 보임: 원본 금속성 0.6 재질(메탈 밴드·돌출 박스 창 청동 #5a4a3a, 메시 베일 금색 #d4b47a, 키네틱 패널 등)이 약한 장면 환경광(낮 0.32)만 반사해 검게 나왔다. 타워 재질 중 금속성 0.3 이상만 같은 하늘 HDR을 재질 envMap으로 반사(세기 = 장면 환경광 × 3, 밤에는 함께 감소). 주변 캡처(프로브)를 쓰면 하늘색이 과해 기각.
- 텍스처 정리: 건물 갱신 시 장면에 남은 모든 재질의 텍스처는 지우지 않도록 사용 판정을 장면 전체로 넓힘(예방).
- 의도적으로 따르지 않은 차이: 벽돌 색(원본 텍스처 적갈색, AI는 주황 테라코타), 아치 석재의 아치 형태(원본 3D는 격자), 석재·스택 등 밝은 크림색(원본 재질색 기준). 원본 구조·색 보존 원칙. 사용자 판단 필요 항목으로 보고.
- 사용자 결정(2026-10-18): 외장 색은 원본 3D 재질색 유지(AI 사진 색으로 바꾸지 않음).

## D-5 실내 층별 대조와 조명 보정 — 2026-10-18 (Claude Code)
기준: 미디어 카탈로그 실내 사진 94장(pb3～pb1, f1～f7, f6dup, f67, roof). 원본은 사진만 있고 촬영 카메라 위치는 없어, 시점 이름(입구에서 창 쪽 등)에 맞춰 층 안에서 비슷한 시점으로 대조.
- 확인: AI 사진은 층마다 다른 인테리어 시안(2F 흰 천장 사무실, 5F 노출 천장·헤링본 라운지, 지하 LED 주차장, 옥상 태양광 퍼걸러 정원). 원본 3D는 1F 카페 외 층이 "원본 구조·임시 가구·실내 시안 미연결" 상태라 가구·마감 구성은 원본 데이터 범위 밖(별도 결정 필요).
- 수정(interior-fill.js): 천장(아래를 보는 면)에 바닥·창가 반사광 근사로 중립색(약 4000K) 간접광 2.2배. 갈색으로 탁하던 원본 슬레이트 천장(#627078)이 회색으로 읽힘(평균 92,75,55 → 140,129,111). 지하는 중립 백색 LED 수준 간접광(1.1)·가림 0.12로 상향(천장 24,16,3 → 83,80,75). 외관에서 본 유리 너머 실내는 거의 변화 없음.
- 그대로 둔 것: 천장·바닥 등 원본 재질색, 법규 한계선(빨간 선, 원본 표시 설정), 층별 가구.

## D-6 2F 사무실 실내 시안 — 2026-10-18 (Claude Code)
사용자 지시: 카페처럼 한 층(2F 사무실)부터 AI 사진(카탈로그 f2, 7장) 기준으로 인테리어, 원본 구조 유지.
- 구현(new/360/office.js, cafe.js와 같은 방식): 원본 LEVELS(평면·기둥·코어 블록·장애물·슬래브 개구부)를 읽기만 하고 그 위에 가구·마감·조명 기구를 더한다. 바닥 밝은 오크 마루(코어·개구부 제외, CC0 laminate_floor_02 재보정), 흰 도장 천장·기둥 사이 노출 보·덕트, 2.4 m 간격 선형 LED 펜던트, 천장형 냉난방기, 흰 벤치 책상 6클러스터(36석, 서랍장·모니터·하늘색 칸막이·메시 의자), 창가 바 카운터·스툴, 라운지(러그·소파 2·라운지 체어 2·원목 테이블), 회의 테이블, 흰 화분 식재. 배치는 평면 안·기둥/코어/개구부 비간섭 검사를 통과한 후보만.
- scene.js: OFFICE_FLOORS(2F)에는 공통 임시 가구·롤스크린·화분을 두지 않고 office.js를 적용. 상태 문구 "2F 원본 구조 · 사무실 검토용 가구(시안 f2)".
- 조명: 위층 실내 간접광을 3500K·0.55에서 약 4000K(.96,.87,.75)·0.8로 조정(2F 시안 대비 주황·어두움). 외관에서 본 유리 너머 실내는 약간 밝아짐.
- 결과(시점 이름 기준 6시점 대조): 바닥 평균 109,74,35 → 143,112,78(AI 약 200,169,142). 구성(천장·조명 줄·책상 줄·라운지·바 카운터) 일치. 남은 차이: AI는 노출 천장 배관이 더 촘촘하고 전체 노출이 더 밝음, 유리 회의실 없음(원본 평면에 칸막이 없음), 법규 한계선(빨간 선)은 원본 표시 설정으로 보임, 엘리베이터 홀(7_hall)은 원본 코어 구역이라 미적용.
- D-6 후속(사용자 지시: 가구는 직접 모델링하지 말고 인터넷의 비슷한 기존 모델 사용): Poly Haven(CC0)은 클래식·빈티지 위주라 현대 사무 가구가 없어, Sketchfab 공개 검색 API(로그인 불필요)로 CC0/CC-BY 후보를 찾고 같은 uid를 Objaverse 공개 데이터셋에서 받았다(Sketchfab 직접 다운로드는 로그인 필요). 채택 7종(CC BY 4.0): 사무용 의자·모니터·모던 소파·366 라운지 체어·바 스툴·몬스테라·지중해 화분. glTF-Transform으로 41MB → 1.35MB. office.js 가구는 userData.modelSwap 자리(절차적 대체물은 숨김, 재질 묶음 제외)로 바꾸고 새 interior-models.js가 environment.js 처리 뒤 같은 위치·방향·크기로 교체(91자리 전부, 실패 시 대체물 표시, 시안 전환 후에도 재적용). 카페 베이크가 해시로 검증하는 environment.js는 수정하지 않음. 책상·커피 테이블·러그·천장 기구는 맞는 무료 모델이 없어 절차적 유지. 출처는 assets/README에 기록(CC BY 표기 의무). 첫 화면: 캐시 없음 12.9초, 캐시 있음 5.6초.

## D-7 3F 사무실 실내 시안 — 2026-10-18 (Claude Code)
사용자 지시: 출처는 README 기록으로 충분, 다음 층 진행.
- office.js를 층별 STYLES 구조로 일반화(2F 결과 동일 유지, 2F 식물 회전값 포함). OFFICE_FLOORS=2F·3F, OFFICE_CATALOG로 상태 문구("시안 f3") 표시.
- 3F(카탈로그 f3): 광택 콘크리트 바닥(CC0 concrete_floor_02 재보정), 베이지 콘크리트 노출 천장, 원목 벤치 책상 4클러스터(모니터 격자리), 중앙 라운지(황마 러그·곡선 크림 소파·라운지 체어 2·원형 원목 테이블·테라코타 스툴), 원목 4단 선반 3개(작은 화분 포함), 큰 화분 7개(야자·몬스테라·지중해 화분).
- 추가 CC BY 모델 3종(곡선 소파·Harvey Probber 라운지 체어·야자 화분), 각 121～240KB. 곡선 소파는 정면 축이 반대라 yaw 0(위에서 내려본 화면으로 확인).
- 결과: 2F+3F 모델 자리 149개 전부 교체, 카페 베이크 active 유지. 남은 차이: AI 3F는 식물·소품이 훨씬 많고 트랙 조명이 있음.

## D-8 4F·5F·6F 복층·지하 실내 시안 일괄 — 2026-10-18 (Claude Code)
사용자 지시: 층별로 묻지 말고 목표 분량까지 모두 완료 후 보고, 모델 검색은 토큰을 고려해 묶어서.
- 범위 판단: 현재 설계에서 6F는 PH1 천장까지 트인 복층(PH1은 작은 테라스 계단참)이라 카탈로그 'f6dup'(6F 복층)을 적용. 'f6'(스튜디오)·'f7'·'f67'은 6·7층 분리/병합 설계용이라 현재 구조와 맞지 않아 제외. 옥상(PH2)은 기존 정원 꾸밈 유지(이번 범위 밖).
- 모델 일괄 검색(Sketchfab 공개 API → Objaverse): 코냑 가죽 소파·화분 나무·다이닝 체어·바 스툴(CC BY) + Poly Haven Mid Century Lounge Chair(CC0). 스튜디오용으로 받았던 5종은 미사용으로 _trash/2026-10-18_unused-office-models로 이동.
- 텍스처(CC0 Poly Haven 재보정): 4F 회색 트위드 카펫, 5F 월넛 헤링본, 6F 대리석. 지하는 콘크리트 텍스처를 에폭시 톤으로 재사용.
- office.js: 4F(차콜 노출 천장·카펫·월넛/검은 프레임 책상 6클러스터·남색 칸막이·월넛 수납장 5), 5F(헤링본·가죽 라운지 2·월넛 대형 회의 테이블·책상 2클러스터·수납장 3), 6F 복층(PH1 천장 높이 월넛 천장·유리 원통 샹들리에 무리 5·원형 월넛 식탁 18(다이닝 체어 72)·대리석 바와 바 스툴 10·화분 나무). dressTowerParking: B1·B2 회색 에폭시 바닥(주차 구획선 위 덮지 않게 2 mm), 짙은 천장, 선형 LED(45·46), 기둥 하부 띠, 외벽 파란 띠.
- 결과: 모델 자리 367개(15종) 전부 교체, 카페 베이크 active 유지, 첫 화면 6.6초(캐시 있음). 상태 문구 "검토용 실내(시안 f4/f5/f6dup/pb1/pb2)".
- 남은 차이: AI 사진 대비 식물·소품 밀도, 4F·5F 노출 천장 배관 디테일, 6F 메자닌 난간·나선 계단의 원본 형상 차이, 지하 원본 기둥 경고 띠(노랑·검정)는 원본 표시라 유지.

## D-9 첫 방문 로딩 단축(실내 지연 로드) — 2026-10-18 (Claude Code)
사용자 지시: 실내가 늘어 첫 방문 로딩 19초 → 줄이기, 실내 모델은 해당 층 진입 시 로드 등 검토.
- 측정: 첫 화면 전 전송 약 30 MB 중 카페 베이크(라이트맵·UV) 8.4 MB, 실내 가구 모델 약 3.3 MB가 필수 경로에 있었고, 부팅이 카페 베이크를 최대 4초 기다렸다. 첫 화면 시점 물체 3,025개.
- 실내 가구 모델 지연 로드(interior-models.js startInteriorModelLoader): 첫 화면 뒤 층별로. 들어간 층 우선, 나머지는 카메라가 1.5초 멈춰 있을 때 한 층씩. 시안 전환(건물 재생성) 후에도 다시 진행.
- 실사 렌더러 addInteriorObjects: 새 모델을 복사해 장면 밖 임시 묶음에서 실내 간접광·금속 반사를 적용하고 compileAsync(대상 장면 지정, 호출 깊이 1)로 정지·움직임 패스를 준비한 뒤 장면에 넣는다. 그동안 기존 화면은 계속 그린다. 준비 중 건물이 바뀌면 버린다.
- 카페 베이크는 첫 화면 뒤 받기 시작(부팅 대기 제거). 도착 시 새 수신면만 장면 밖에서 준비 후 투입.
- 원인 수정: 카페 베이크가 대체 조명을 숨겨(visible) 조명 구성이 바뀌면 장면 전체 재질이 다시 컴파일됐다(베이크 도착 시 2.6초 정지). 숨기지 않고 세기만 0으로(cafe-room-bake.js·cafe-ambient.js, 테스트 갱신).
- 지연 추가 가구·카페 수신면은 실시간 그림자를 드리우지 않음: 그림자 패스 셰이더는 미리 준비할 수 없어 GPU 캐시가 빈 첫 방문에서 수 초 동기 컴파일됐다(카페는 베이크에 그림자 포함).
- 결과(로컬, 처음 쓰는 주소=빈 캐시): 첫 화면 전 물체 3,025 → 1,883, 필수 전송 약 30 → 18.6 MB(나머지는 첫 화면 뒤). 카드 닫힘 8.4 → 7.9초(로컬은 네트워크 지연이 없어 차이가 작음), 이후 약 5초에 카페 베이크와 2F～6F 모델 완료, 최대 끊김 0.46초. 층 진입 시 해당 층 0.2초 뒤 우선 로드.

## D-10 건물 재생성 대기 표시와 단축 — 2026-10-18 (Claude Code)
사용자 지시: "선택한 건물 적용 중" 같은 대기(예: 주차 방식 변경 시 화면 멈춤)는 로딩창으로 보이고, 가능하면 줄이기. 첫 화면 로드는 현재 수준으로 충분.
- 측정(주차 방식 변경): 원본 재생성 0.07초, 실사 쪽 재생성 0.24초. 멈춤은 새 물체 약 2,400개의 셰이더를 첫 렌더에서 동기 준비(정지 패스 3.7초, 카메라 이동 시 움직임 패스 4.3초)하느라 총 약 11초.
- 수정: 재생성 뒤 부팅과 같은 묶음 준비(정지 패스+그림자, 프레임마다 60개)를 하고 움직임 패스는 백그라운드 compileAsync(완료 전에는 정지 패스로 그림). 부모 화면은 변경 감지 즉시 "선택한 건물 적용 중" 카드를 띄우고 두 프레임 양보 후 재생성, 진행률(n/N)은 자식 TOWER_UPDATE_PROGRESS를 읽는다.
- 결과: 카드 0.24초에 표시, 3.9초에 닫힘(5→95%), 최대 끊김 0.62초, 이후 움직임 패스 준비 완료. 외장 시안 전환도 같은 경로.
- D-10 보완: 재생성 준비 대상을 새 건물·실내 복사본으로 한정, 묶음 80개·준비 중 저해상도(0.25). 원인 추가 발견: 재생성 때 위층 실내 조명(RectAreaLight)을 지우고 새로 만들어 조명 구성 키가 바뀌면 주변 건물까지 모든 재질이 다시 컴파일됐다 → 종류·개수가 같으면 기존 조명 객체에 위치·세기만 옮기는 방식(reconcileInteriorLights). 이미 받은 층의 가구 모델은 재생성 단계에서 바로 다시 끼워(restoreInteriorModels) 카드 아래에서 함께 준비. 대상 외 물체를 숨기면 다시 보일 때 렌더 객체가 새로 생겨 오히려 1.5초 멈춰 숨기지 않음.
- 결과(로컬, 주차 방식 변경, 직전 변경과 6초 이상 간격): 카드 0.4초 표시, 3.4～4.2초 닫힘, 카드 안·뒤 끊김 0.5초 이하. 2.5초 간격으로 연달아 바꾸면 앞 변경의 백그라운드 준비와 겹쳐 최대 약 12초까지 늘 수 있음(카드는 계속 표시).
