# 1F cafe review — 2026-10-16

## Scope and baseline

Branch: `codex/tower-360-validation`. Merge commit `230c517` incorporates `origin/main` through `25b111a`, preserving the review bridge. The latest original now supplies `nost` / separate 6F–7F tenancies, slab/stair configuration, interior photo variants and image zoom. Main/public Pages was not replaced.

The original `LEVELS` remains authoritative: polygons, heights, columns, core/walls, doors and openings are not redesigned from AI images. Existing source notes still apply: the plan was scaled from drawings and carries approximation uncertainty. Cafe fit-out is illustrative, not an approved interior layout.

## Implemented

- Dedicated 1F cafe dressing: oak counter with slats and stone top, espresso equipment, upholstered curved-back chairs, round pedestal tables and a communal table, pendants/downlights, small accessories, existing licensed indoor foliage.
- Existing ground-floor office dressing removed; upper-floor examples retained.
- Materials use the existing local wood/stone assets. Warm area-light approximation supplements daylight. It is not a complete indirect-light bake.
- Offline cafe contact AO: 80,420 furniture triangles, 512×512, 64 cosine-distributed rays per texel, 2.5 m maximum range. 72 KB PNG. Source, bake script and parameters are saved. Applies only when furniture placement matches the recorded layout. No per-camera recomputation.
- Render-copy glass omits massing-prism horizontal caps that overlap floor/ceiling slabs. Vertical facade geometry and source meshes remain unchanged. Regression test checks retained faces and unchanged source/bounds.
- Cafe eye-height presets, near clip 0.08 m; drag looks around, wheel changes FOV 35–85°, WASD moves in 0.2 m steps (Shift 0.6 m), Q/E vertical, Home returns outside. Plan/core/column/table/counter checks constrain keyboard movement. This is not a full collision/egress simulator.
- In-page split comparison with all seven original cafe images; URL parameters `view=cafe&compare=1` open it directly. Original photo UI remains available, including 6/7 modern/classic examples. Those other interiors are not recreated as detailed 3D in this change.

## Browser verification

Actual Chrome: current model/source state matched after switching to `alt4`; `use7=true, nost=true` matched both state and structural level data (polygons, columns, walls, slabs, heights). Cafe stayed active and contact bake remained valid. Actual W key changed camera position; wheel changed FOV to 62.2; near clip remained 0.08; legacy click-to-enter mode stayed false.

Observed initial preparation 17,573.5 ms; preceding run 17,286.7 ms. Two model switches 409.6 / 449.6 ms before the final comparison UI addition. Local browser/cache measurements, not a controlled cold-start benchmark; initial loading remains unresolved. The renderer's `frameMs` includes shader compilation and is not FPS.

Manual precision rendering completed at 64/64 samples with denoising and no reported GPU error; captured separately in `cafe-precision.png`. It improves reflections but does not solve default realtime quality. Original photo UI was tested: 6/7 combined → classic selected `int/f67/v2/6f_1_back_mid.webp`.

Final direct-link test opened cafe + split comparison automatically. Actual mouse drag changed the look direction; Home restored outdoor mode, near=2 and wheel zoom. Photo comparison angle 2 resolved the expected catalog image. Original photo + zoom displayed 1.5×. Final Chrome error log was empty.

Node checks: geometry draw ranges, curtain-wall profiles/alignment, static batching/precision source restoration, baked-ground isolation, and new glazing-cap removal. Build and JavaScript syntax checks run.

## Visual judgment / not complete

The result provides an actual continuous room, not image switching. Warm ceiling, wood/stone, furnishing and fixed contact shadows are improved. **It is still visibly below the reference's photoreal quality.** Remaining gaps: direct sunlight/soft bounce balance, correct floor/interior reflections, material microdetail and furniture/props density, and the street seen through the glazing. Camera matching is approximate; AI reference geometry does not override the confirmed source model. No claim of final architectural or interior approval.

Next priority: a coherent cafe lighting bake including room surfaces, UV lightmaps and directional/window illumination; higher-fidelity seating/coffee equipment; measured/approved fit-out layout; parallax-correct or planar reflections. Extend to 6/7 interior variants only after this representative room passes visual review. Separate structural options from decorative schemes.

## Reproduce / handoff

- Build: `npm run build --prefix tools/360`.
- Cafe bake: in `tools/360`, `node bake-cafe.mjs cafe-bake-source.json.gz`.
- Cafe source: `new/360/cafe.js`; navigation: `scene.js`; integration/split view: `integrated.js`; rendering: `tools/360/modern-entry.js` (generated output `new/360/modern.js`).
- The screenshot comparison is `docs/360/cafe-review.html`; live comparison is `/new/3d-model.html?lab=review&view=cafe&compare=1`.
- Preserve the original geometry and branch isolation. Keep screenshot verification and source-state comparison as acceptance criteria when another model continues.
