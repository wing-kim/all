# Claude Code 인계 준비

## 현재 상태 — 2026-10-18 머지 직전 (Claude Code)
- A(카페 완성품)·B(외부 완성품)·C(계약 잔여·회귀·정밀 이미지·전송량) 완료. 다음은 사용자 결정 대기: 원본 저장소 push, PR 갱신, 머지 범위·방식(`docs/360/PR_DESCRIPTION.md`의 결정 사항 4개).
- 최신 소스 HEAD와 배포 SHA는 `docs/360/WORK_STATE.md` 맨 위 요약에 있다. 공개 검토 URL은 아래 격리 검토 주소.
- 테스트 17종: `for t in tools/360/test-*.mjs; do node $t; done`. 배포 전 `node tools/360/test-bake-freshness.mjs` 필수.
- 베이크 재생성: 카페는 `TOWER_REVIEW.frame` 안에서 `tools/360/export-cafe-bake.js` 실행 → `tools/360/cafe-ambient-source.json.gz` → `bake-cafe-room.py`(약 2.5분, 13개 시간대) → `new/360/assets/cafe-room-bake/`에 복사. 외부 하늘 가림은 `TOWER_CINEMA.groundSource()` → `tools/360/bake-static-source.json.gz` → `node bake-ground.mjs`(약 8초). 자세한 절차는 `docs/360/baked-environment.md`, WORK_STATE 체크포인트.
- 캐시 토큰: `new/3d-model.html`의 integrated.js·scene.js 토큰, `new/360/scene.js`의 modern.js 토큰, `new/360/integrated.js`의 자식 revision을 함께 올린다.


현재는 Codex 작업을 계속한다. 이 폴더는50% 한도 이전 전환이 필요할 때 사용하는 예비 진입점이며 완료 보고가 아니다.
소스 복사본을 만들지 않는다. 같은 Git 저장소와 분리 브랜치를 이어받아 이중 수정/이력 누락을 막는다. 별도 작업폴더가 필요하면 clean commit을 기준으로 별도 worktree를 만들되 두 에이전트가 같은 파일을 동시에 수정하지 않는다.

## 시작
1. 현재 Codex 작업/서브에이전트를 종료하거나 쓰기 중단한 것을 확인한다.
2. `git status --short --branch`, `git log -8 --oneline`으로 실제 상태를 확인한다. 미커밋 변경은 보존한다.
3. 저장소 루트에서 Claude Code를 열고 이 폴더의 PROMPT.md 내용을 입력한다. 설치·로그인은 사용자가 관리하며 비밀키를 문서에 넣지 않는다.
4. root AGENTS.md가 지정한3개 기준 문서를 읽는다. 과거 대화 전체를 재수집하지 않는다.

## 저장소/배포
- 개발: wing-kim/all, branch codex/tower-360-validation, PR https://github.com/wing-kim/all/pull/1 (자동 merge 금지).
- 운영: https://wing-kim.github.io/all/ — main 및 배포 설정 보존.
- 격리 검토: https://evyfjae.github.io/kapehorn-3d-preview/
- 격리 저장소: evyfjae/kapehorn-3d-preview(private), 정적 패키지만 공개 Pages.
- 배포 절차 tools/360/PREVIEW_DEPLOYMENT.md. /tmp의 이전 산출물 존재를 전제하지 않는다.

## 실행/검증
저장소 루트에서 `python3 -m http.server 8765 --bind 127.0.0.1`.
http://127.0.0.1:8765/new/3d-model.html?lab=review
카페는 같은 화면의1층 카페3D 버튼 또는 `?lab=review&view=cafe`. 카페 전체 베이크는 기본 켜짐(`&ambientBake=off`로 비교, `&ambientBake=study`는 예전 바닥·천장 연구 경로). 외부 하늘 가림은 `&bake=off`로 비교. 기존 모드는 query없는URL.
렌더러 빌드: `npm --prefix tools/360 run build` (의존성이 없으면 해당 디렉터리에서 npm ci --ignore-scripts).
테스트: `tools/360/test-*.mjs` 전체(17종)와 git diff --check.
브라우저는 사용 가능한 실제 도구로 검증한다. Codex CUA 전용 코드가 Claude에서 실행된다고 가정하지 않는다. 기본 UI와 TOWER_REVIEW.frame.contentWindow.TOWER_CINEMA.status()/resetPerformance() 계측을 사용할 수 있다.

## 전환 판단
주간 계정 사용률과 작업 완료율은 다르다. 최신 실제 조회값은 WORK_STATE에 기록한다.50% 초과 전에 필요하면 전환한다. 최소45%부터 신규범위 확대 중단,48%까지 인계 산출물 완료. Claude 사용량이나 비용을 Codex 수치로 추정하지 않는다. 인계 시 실제 HEAD/dirty상태/배포SHA/미검증 변경을 WORK_STATE에 갱신한다.

## 로컬 실행 위치

```sh
cd "/Users/jaehwak/Documents/Kapehorn/etc/kapehorn tower"
claude
```

위 명령은 Claude Code가 설치·인증된 경우의 시작 방법이다. 실행 후 이 폴더의 PROMPT.md를 읽고 작업하도록 요청한다. 다른 컴퓨터라면 작업 브랜치를 clone한 실제 경로를 사용한다. 별도 코드 사본은 만들지 않아도 된다. 격리 작업이 필요하면 clean HEAD에서 worktree를 만들고 이전 작업자는 쓰기를 중지한다.

## 사용자 확인 후 시작하는 현재 절차 (2026-10-16)
현재 로컬 Claude Code2.1.138 설치 확인. `claude --model opusplan --permission-mode plan`으로 시작한 뒤 PROMPT.md를 읽도록 요청한다. `/model`에서 실제 사용 가능한 모델을 확인한다. 최신 모델이 필요하면 사용자가 `claude update` 후 다시 확인한다. 모델/계정별 접근 가능 여부는 별도이며 설치 확인이 로그인 확인은 아니다.
첫 보고서는 읽기 중심 인수 검토와 목표/전체계획/가능성/검증/자원 계획을 포함하며, 사용자 명시 승인 전 구현·설치·커밋·푸시·배포 금지. 승인 후 Plan Mode의 실행 전환 UI를 사용한다. 계속 Plan Mode라면 표시된 전환 안내/Shift+Tab으로 일반 실행 모드로 바꾼다. opusplan은 계획 Opus/실행 Sonnet이며 자동 독립 검수자가 아니다. 주요 검수는 Plan Mode 재진입 또는 별도 지원 경로를 사용한다.
공식 근거: https://code.claude.com/docs/en/model-config , https://code.claude.com/docs/en/cli-reference .
