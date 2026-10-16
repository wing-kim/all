# 작업 상태와 다음 행동

갱신:2026-10-16. 최신 사용자 정정: 실사3D는 기존 앱의 표현 모드, 기능 연결은 전체 범위. 고품질 모델은 점진 제작 가능. PROJECT_BRIEF.md/VIEWER_CONTRACT.md가 과거 카페 중심 계획보다 우선한다.

## 확인된 상태
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
