# Assets

- `urban_courtyard_1k.hdr`: Sergej Majboroda / Poly Haven, https://polyhaven.com/a/urban_courtyard, CC0. Download: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/urban_courtyard_1k.hdr . Used only as a generic reflection/lighting study, NOT site photography or a surveyed environment.
- `RGBELoader.js`, `GLTFExporter.js`, `BufferGeometryUtils.js`: Three.js r128 examples, MIT; see THREE-LICENSE.txt. Same release as the existing embedded renderer.
- Existing comparison images stay in the author's kapehorn-media repositories; no alteration or replacement.

## Environment revision

- `daylight-sky_2k.hdr`: Poly Haven, Kloofendal 48d Partly Cloudy (Pure Sky), CC0, https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky . Generic sky, not site photography.
- `asphalt_02_*.jpg`, `pavement_04_*.jpg`: Poly Haven CC0 PBR texture sets, https://polyhaven.com/a/asphalt_02 and https://polyhaven.com/a/pavement_04 . 1K color/normal/roughness; downloaded from dl.polyhaven.org.
- `tree-small-02.glb`: adapted from Poly Haven Tree Small 02, CC0, https://polyhaven.com/a/tree_small_02 . Reduced bark meshes and planar leaf simplification for browser display; all source leaf components are retained at their original scale. Trunk-foot anchoring aligns street trees with their planting pits. Illustrative landscaping.
- `concept-car.glb`: Car Concept, Eric Chadwick / Darmstadt Graphics Group GmbH, 2024, CC BY 4.0. https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept . Runtime paint and glass adapted for this viewer. Khronos/3D Commerce marks belong to Khronos. No endorsement implied.
- `GLTFLoader.js`: Three.js r128, MIT, same license file as the other Three.js extensions.
- Urban background blocks and added facade relief are illustrative, not new measured architectural evidence. The primary tower source geometry is unchanged; rendering copies of narrow metal members receive the documented 2.5 mm edge finish within their original bounds.
- `plaster_*.jpg`: Poly Haven Plastered Wall 04, CC0, https://polyhaven.com/a/plastered_wall_04 . Generic context facade finish.
- `DRACOLoader.js`: Three.js r128 MIT. `draco/` decoder: Google Draco, Apache 2.0; included license and authors.
- `modern.js`: bundled Three.js 0.186.1, three-gpu-pathtracer 0.0.27, three-mesh-bvh 0.9.15, oidn-web 0.4.0, and float16, MIT licenses included separately. Source and pinned build manifest are in `tools/360/`.
- `rt_hdr_alb_nrm_small.tza`, `rt_hdr_alb_nrm.tza`: Intel Open Image Denoise weights, Apache 2.0, https://github.com/RenderKit/oidn-weights . See OIDN-LICENSE.txt. Used locally in WebGPU; no remote rendering or uploaded model data.

- `facade-brick_*.jpg`: ambientCG Facade 018 A by Lennart Demes, CC0, https://ambientcg.com/view?id=Facade018A . Procedural PBR facade with brick, glazing roughness and normals; used only for illustrative distant blocks.

- `wood-floor_{color,normal,rough}.jpg`: Poly Haven [Wood Floor](https://polyhaven.com/a/wood_floor), Dimitrios Savva, CC0, 1K JPG diffuse / OpenGL normal / roughness; used for illustrative interior furniture.

- `clear-noon-sky_2k.hdr`: Poly Haven [Kloppenheim 05 (Pure Sky)](https://polyhaven.com/a/kloppenheim_05_puresky), Greg Zaal / Jarod Guest, CC0, 2K HDR. Clear daytime sky and lighting; not site photography.

- `modern-arm-chair/`: Poly Haven [Modern Arm Chair 01](https://polyhaven.com/a/modern_arm_chair_01), Vibrant Nordic, CC0. Original glTF geometry with 1K wood/leather PBR maps, scaled for illustrative lounge furnishings. Not an approved interior specification.

- `facade-office_*.jpg`: ambientCG [Facade019A](https://ambientcg.com/a/Facade019A), Lennart Demes, CC0. Original 1K JPG color, OpenGL normal, roughness and metalness; illustrative distant office buildings only.

- `interior-stone_*.jpg`: Poly Haven [Marble 01](https://polyhaven.com/a/marble_01), Rob Tuytel, CC0, original 1K color/OpenGL normal/roughness. Source dimensions 1.5 × 1.5 m. Interior finish study only; not an approved material specification.

- `RoundedBoxGeometry.js`: Three.js r186 examples geometry, MIT (`THREE-MODERN-LICENSE.txt`). ES module import/export adapted to the existing THREE global; used for rendering-only 2.5 mm metal edge finish.

- `roof-concrete_*.jpg`: Poly Haven [Concrete Floor Worn 02](https://polyhaven.com/a/concrete_floor_worn_02), Dimitrios Savva, CC0. Original 1K diffuse/OpenGL normal/roughness, 2 × 2 m; tinted illustrative roof finish, not confirmed existing roof specifications. Download hashes recorded in `docs/360/roof-texture-source.json`.

- `facade-granite_*.jpg`: Poly Haven [Granite Tile 03](https://polyhaven.com/a/granite_tile_03), Charlotte Baglioni, CC0. Original 1K diffuse/OpenGL normal/roughness, source width 1.8 m. Tinted illustrative finish on existing grey/ESMOD context masses; not a verified site material survey. Source URLs and checked MD5 hashes: `docs/360/context-stone-source.json`.

- `furniture-veneer_*.jpg`: Poly Haven [Oak Veneer 01](https://polyhaven.com/a/oak_veneer_01), Jenelle van Heerden, CC0. Original 1K diffuse/OpenGL normal/roughness, source width 1.8 m; illustrative desk and coffee-table tops. Replaces stretched floorboard maps on this furniture only. Download hashes: `docs/360/furniture-veneer-source.json`.

- `interior-foliage.glb`: stem and leaves from Poly Haven [Potted Plant 01](https://polyhaven.com/a/potted_plant_01), Rico Cilliers, CC0, 1K PBR maps. Original decorative pot/gravel omitted; stem-foot anchor and Draco level 6 applied with `tools/360/prepare_interior_plant.py`. Kept inside the existing illustrative square planters. Source file checksums and derivative metadata: `docs/360/interior-plant-source-study.json`, `docs/360/interior-foliage-source.json`.

- 1F 카페 식탁 의자(2026-10-17): 기존 `modern-arm-chair/` (Poly Haven Modern Arm Chair 01, CC0)를 0.68 m 폭으로 재사용하고, 쿠션은 원본 노멀맵을 유지한 채 코냑 가죽색(#a3653c)으로 바꿨습니다. AI 실사 시안의 원목·가죽 분위기를 따른 예시이며 승인된 가구 사양이 아닙니다. 이전 `dining-chair-02/`는 파일만 남기고 카페에서는 쓰지 않습니다.
- `cafe-ambient-slots/`: 원본 앱의 계절·시간대 버튼 조합별 카페 바닥·천장 베이크(현재 봄·오후). 하늘빛 + 태양 반사광, Blender Cycles로 생성. 원본 자료와 재현 명령은 `tools/360/ambient-slots/`, `tools/360/bake-cafe-ambient.py`.
- `cafe-room-bake/` (2026-10-17): 1층 카페 전체(바닥·천장·벽·기둥·카운터·테이블·의자) 라이트맵. 원본 앱의 계절·시간대 버튼 조합별로 `day`(하늘빛 + 태양 반사광)와 `lights`(카페 천장 조명)를 따로 구웠습니다. Blender Cycles로 생성했고, 재현 명령은 `tools/360/bake-cafe-room.py` 머리말에 있습니다. 화분과 유리, 런타임에서 다시 만드는 둥근 커튼월 멀리언은 실시간으로 남깁니다. 예시 조명 계산이며 조도 검증이 아닙니다.
