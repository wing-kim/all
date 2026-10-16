# Cape Horn project: AI entry point

For work on the architectural/interior viewer (`new/3d-model.html`, `new/360`, `tools/360`), read in order:
1. `docs/360/PROJECT_BRIEF.md` — purpose, non-negotiable requirements and scope.
2. `docs/360/VIEWER_CONTRACT.md` — shared state, existing feature parity and acceptance matrix.
3. `docs/360/WORK_STATE.md` — current evidence, next action, budget and checkpoints.
Then read only the implementation files needed for the assigned task.

Branch scope is additive: implement the photoreal mode only, preserving all working main behavior. Existing handlers/data/UI may receive minimal opt-in hooks, not unrelated rewrites. Adapter subscriptions/listeners/resources must be enabled only for this mode and restored/disposed on exit. Ordinary URLs and old modes must retain original behavior. Final delivery is a reviewable PR suitable for merging into main; do not merge without a direct request.

The photoreal viewer is a rendering mode of the existing decision-making application, NOT an independent cafe demo. Keep original controls and their meanings across modes. High-detail assets may be staged, but missing assets must not remove floor/structure/daylight/option functionality or silently switch to SketchUp.
Preserve authored structure. Do not substitute AI-image geometry. Daylight/date/time/orientation and option comparisons take precedence over cosmetic lighting. Keep photographic reference images separate from the continuous photoreal renderer.

Work on `codex/tower-360-validation`; preserve user changes. Do not replace main or the live site's Pages source. Deployment is the first implementation priority; prefer an existing non-mutating entry route, otherwise an isolated private-repo/public-site deployment as already authorized. New costs/public source conversion need user approval.

Use one bounded Sol implementation subagent by default when applying the user's authorized division of work. Do not fork the full conversation; supply relevant files, invariants, ownership and tests. No recursive delegation or overlapping writes without a concrete need. Parent reviews important evidence rather than repeating all work. Do not claim a parent model identity not established by runtime context.

After a meaningful work unit, update WORK_STATE with commit/evidence/remaining issues/exact next step. Resume by checking actual usage, git state and these docs; do not restart an old investigation from chat recollection. PROJECT_BRIEF holds durable intent, WORK_STATE holds changing status. Older txt reports are history unless explicitly referenced; latest user instructions take precedence.
Budget: after the reset, total weekly account use <=50%; 45% wrap-up, finish artifacts by48%, reserve2%. All agents/research/deployment included. Monitor at milestones. Report technical success and visual success separately. Avoid broad searches through bundled/minified lines in the monolithic HTML; use scoped reads or rg --max-columns.

At every stage boundary, report the full roadmap with completed/current/next markers; restate the architectural/interior decision purpose and main noninterference invariant; identify reference sources and distinguish discovered/read/applied/visually verified evidence; report implementation feasibility from actual indoor/outdoor quality and navigation performance; report current weekly account usage (not invented token counts), remaining budget to50%, and Sol delegation efficiency; give a continue/change/hold-expansion judgment with reasons and unresolved items. Save evidence and the exact next action in WORK_STATE. A progress report alone does not complete a stage. Do not repeat research without a specific unresolved question.

## 지정 작업 공간 — 2026-10-16 이전 완료
현재 유일한 타워 실사3D 작업 루트는 `/Users/jaehwak/Documents/Kapehorn/etc/kapehorn tower`이다.
GPT/Codex와 Claude Code 모두 이 폴더를 프로젝트로 선택한다. 명령 실행 전 실제 경로와 브랜치를 확인한다.
기존 `pm/문서 작성/kapehorn-all`은 원래 local main으로 복구했으므로 이 기능 개발을 위해 수정하거나 다시 브랜치 전환하지 않는다.
코드·지침·검증·인계 기록은 현재 루트에서 함께 관리한다. 같은 파일 동시 쓰기는 금지한다.
