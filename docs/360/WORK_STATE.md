# 작업 상태와 다음 행동

갱신:2026-10-16. 최신 사용자 정정: 실사3D는 기존 앱의 표현 모드, 기능 연결은 전체 범위. 고품질 모델은 점진 제작 가능. PROJECT_BRIEF.md/VIEWER_CONTRACT.md가 과거 카페 중심 계획보다 우선한다.

## 최신 재개 요약 — 2026-10-16, 54fefde 이후 작업 중

이 요약과 맨 아래 체크포인트가 현재 상태다. 이후의 초기 감사/이력은 과거 상태이므로 다시 구현하거나 현재 결함으로 오인하지 않는다.

- **브랜치:** `codex/tower-360-validation`. main `25b111a` 보존. PR https://github.com/wing-kim/all/pull/1 은 draft, 자동 병합 금지.
- **현재 공개 검토:** https://evyfjae.github.io/kapehorn-3d-preview/new/3d-model.html?lab=review&view=cafe — 배포 `c98ee69`, 소스 `affaaba`. 이후 로컬 수정은 아직 공개 반영 전.
- **확인 완료:** 원본 일시/계절/태양, 층 선택, 모서리/홀/창밖, 미니맵/패드/나침반, 실내 텍스트 라벨, 원본 모드 복귀. 카페 CC0 의자. 기본 이동은 정밀 누적 없이 렌더. 정밀 버튼은 별도이며 준비 약4.4초 차단 문제는 남음.
- **베이크:** `?ambientBake=study`로 exact1F 바닥/천장 간접광 시험. 512²/256samples+offline denoise. 원본 구조/가구 해시와 수신면 검사, 야간/구조 변경 때 해제. 기본 꺼짐. 모든 면/모든 시안의 베이크 또는 정량 채광 해석이 아님.
- **현재 작업/첫 행동:** Sol `daylight_adapter`가 층 단면의 source visibility 연결을 수정 중. 30e05bb/c0776ac는 카메라는 맞지만 실제화면에서 상부층이 남아 QA실패. `environment.js`의 전체 material batch가 층 그룹을 잃은 것이 원인. dirty파일을 보존하고 에이전트 결과 확인→1F/3F/B1 단면/coreTop/걷기 왕복 실제검증. 검증 전 배포하지 않는다.
- **명시적 미완료:** 종단면 전체/상부, 윗층투시, 3D 치수/램프 안내선, 현황/비교 및 일부 표시 토글, 상세 실내 후보 매핑, 원본 사진 수준 실내외 품질, 초기 로딩/정밀준비 최적화, Chrome/모바일 검증. 원본모드는 유지되지만 새모드 전체 기능대응 완료 아님.
- **성능:** IAB 짧은5초시험 카페 베이크 high 평균32.18/p9535.6ms, 외부 high39.94/p9542.1ms, balanced30.20/p9532.2ms. 이동 중 geometry/probe/precision 갱신0. 콜드네트워크/모든기기 보장 아님. 새로운 기본 balanced 적용 후 재검증 예정.
- **예산:** 마지막 실제 주간29%. 상한50%,45%정리/48%산출물완료. 전체실사품질+모든기능을50%내완성한다는 확약 근거 없음. 추가사용자승인대기 없이 작업 계속, 예산 초과 예상 시 Claude 인계.
- **인계:** root `CLAUDE.md` + `docs/360/handoff/claude-code/README.md`, `PROMPT.md`. 같은저장소/브랜치로 이어받고 동시쓰기 금지. 도구 설치/로그인은 사용자 관리. 최종 사용자용 인계프롬프트는 아직 최종화 전.
- **패키지:** `tools/360/package-preview.py`, 배포절차 `tools/360/PREVIEW_DEPLOYMENT.md`. 전체 repo를 공개업로드하지 않고 allowlist runtime+명시된비교페이지/이미지만 패키지. 사용자는 private source/public website를 승인했음.

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
