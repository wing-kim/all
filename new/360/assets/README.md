# Assets

- `urban_courtyard_1k.hdr`: Sergej Majboroda / Poly Haven, https://polyhaven.com/a/urban_courtyard, CC0. Download: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/urban_courtyard_1k.hdr . Used only as a generic reflection/lighting study, NOT site photography or a surveyed environment.
- `RGBELoader.js`, `GLTFExporter.js`, `BufferGeometryUtils.js`: Three.js r128 examples, MIT; see THREE-LICENSE.txt. Same release as the existing embedded renderer.
- Existing comparison images stay in the author's kapehorn-media repositories; no alteration or replacement.

## Environment revision

- `daylight-sky_2k.hdr`: Poly Haven, Kloofendal 48d Partly Cloudy (Pure Sky), CC0, https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky . Generic sky, not site photography.
- `asphalt_02_*.jpg`, `pavement_04_*.jpg`: Poly Haven CC0 PBR texture sets, https://polyhaven.com/a/asphalt_02 and https://polyhaven.com/a/pavement_04 . 1K color/normal/roughness; downloaded from dl.polyhaven.org.
- (2026-10-18부터 사용 안 함, `street-tree.glb`로 대체) `tree-small-02.glb`: adapted from Poly Haven Tree Small 02, CC0, https://polyhaven.com/a/tree_small_02 . Reduced bark meshes and planar leaf simplification for browser display; all source leaf components are retained at their original scale. Trunk-foot anchoring aligns street trees with their planting pits. Illustrative landscaping.
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

- `sidewalk-pavers_*.jpg`: Poly Haven [Concrete Pavement 02](https://polyhaven.com/a/concrete_pavement_02), Charlotte Baglioni, CC0. Original 1K diffuse/OpenGL normal/roughness, source width 1.8 m; neutral-tinted illustrative sidewalk paving (replaces the darker `pavement_04` on walks only). Not a site material survey. SHA256 recorded in `docs/360/exterior-ground-source.json`.

- `ground-concrete_*.jpg`: Poly Haven [Concrete Floor 03](https://polyhaven.com/a/concrete_floor_03), Rob Tuytel / Matterfield, CC0. Original 1K diffuse/OpenGL normal/roughness, source width 2.5 m; neutral-tinted generic open-ground and curb finish (the original page used a plain 0x8f9488 ground). Not a site material survey. SHA256 recorded in `docs/360/exterior-ground-source.json`.

- 2026-10-18 전송량 최적화: `tree-small-02.glb`, `concept-car.glb`를 [glTF-Transform](https://gltf-transform.dev/) CLI 4.1.1(MIT)로 다시 저장했다. 가로수는 텍스처 9장을 WebP(품질 85)로 바꾸고 Draco를 다시 적용(10.9MB → 6.1MB), 차량은 WebP(품질 85) + Draco(11.5MB → 1.9MB). 형상·재질 구성은 같고 화면 평균 차이 0.76/255. 이전 SHA256: tree `0ab40468f8183b1e874238be690f424851195b486103e0ddd7cb62d859a9d90b`, car `c272098089d78c5cd9fd9f24ff50ee8acf8d932c55f2d55fc10adb6c8998966b`; 현재: tree `39e26bf7d40b80f87d585cfcc460e7b40a5e90e13aa82760292aab93e66b241e`, car `fe3260e691f6b62bdd1476da11f86581c0af69f2c116b91dc201b1e9a0a7a5ab`. 두 파일은 카페 베이크 가구 검증·주변 건물 서명 대상이 아니다.

## 2026-10-18 화질·로딩 개선에 따른 자산 변경

- `street-tree.glb` (새 가로수, 기존 `tree-small-02.glb` 대체): 가지 구조는 [ez-tree](https://github.com/dgreenheck/ez-tree) 1.1.0(MIT, Daniel Greenheck)으로 생성. 잎 카드 텍스처는 ambientCG [LeafSet024](https://ambientcg.com/view?id=LeafSet024)(CC0) 낱장 잎 9장을 `tools/360/make-twig-texture.py`로 잔가지 형태로 배열해 만든 것, 나무껍질은 Poly Haven [Tree Small 02](https://polyhaven.com/a/tree_small_02)(CC0) 줄기 텍스처. ez-tree에 포함된 텍스처는 출처 표기가 없어 쓰지 않았다. 생성 도구 `tools/360/tree-gen.html`(옵션은 파일 안 기본값), glTF-Transform 4.1.1로 WebP(85)+Draco. 그루당 23,680 삼각형(기존 약 42만), 843KB. 예시용 조경이며 수종 확정이 아니다.
- `interior-foliage.glb`: 같은 Poly Haven Potted Plant 01 형상을 glTF-Transform `simplify`(ratio 0.15, error 0.004)로 잎 106,900 → 16,035 삼각형으로 줄이고 Draco 재적용. 화면 비교로 외형 유지 확인.
- `concept-car.glb`: glTF-Transform `simplify`(ratio 0.05, error 0.02) 후 Draco. 대당 213,347 → 27,921 삼각형. 거리 시점용 예시 차량.
- 텍스처 38장(`*_color/_normal/_rough/_metal`)을 JPG에서 WebP로 변환(Pillow, 노멀 90·그 외 82 품질). 24.9MB → 6.2MB. 원본 JPG는 저장소 밖 휴지통 폴더로 옮김(git 이력에는 남음). 출처·라이선스는 위 각 항목과 같다.
- `daylight-sky_1k.hdr`: 같은 Poly Haven Kloofendal 48d Partly Cloudy (Pure Sky) 1K(CC0). 기존 2K(5.3MB)를 대체(1.4MB). 환경 반사·간접광 용도.
- `office-floor_*.webp` (2F 사무실 시안 바닥, 2026-10-18): Poly Haven [Laminate Floor 02](https://polyhaven.com/a/laminate_floor_02), Dario Barresi·Charlotte Baglioni, CC0. 1K 원본 diffuse/OpenGL normal/roughness. diffuse는 카탈로그 f2 사진의 밝은 꿀색 오크에 맞춰 선형 공간에서 평균 알베도 sRGB(205,178,148), 결 대비 70%로 재보정. 1.6 m 반복. 실제 마감 사양이 아닌 검토용 표현.

## 2F 사무실 가구 모델 (2026-10-18, CC BY 4.0 — 출처 표기 의무)

Sketchfab 공개 모델(다운로드 허용, CC BY 4.0)을 Objaverse 공개 데이터셋(allenai/objaverse, Hugging Face)의 같은 uid 파일로 받았다. 모두 [glTF-Transform](https://gltf-transform.dev/) CLI 4.1.1로 텍스처 512px WebP·Draco 압축(소파·라운지 체어·스툴은 면 수 35%로 단순화). 형상 변경 없이 축척·방향만 배치 시 맞춘다(실제 제품 사양 아님, 검토용 표현). 라이선스: https://creativecommons.org/licenses/by/4.0/

- `office/office-chair.glb`: "Office Chair" by Red Fox / nokillnando (https://sketchfab.com/3d-models/none-b228a29fa84544c2be501c295653ffe7), CC Attribution.
- `office/office-monitor.glb`: "Computer Monitor 16:9 (Low Poly, Game Ready)" by LiveToWin34 (https://sketchfab.com/3d-models/none-336de680dd9a4d84943d05d9c7dde1b0), CC Attribution.
- `office/office-sofa.glb`: "Modern  Sofa" by 3dimentionalben (https://sketchfab.com/3d-models/none-ac92f6e97eaa43c4ad6cb8f7c65ac43f), CC Attribution.
- `office/office-lounge.glb`: "366 Armchair" by hectopod (https://sketchfab.com/3d-models/none-97e53f749df14e8c9de7a22bf99be753), CC Attribution.
- `office/office-stool.glb`: "Dima upholstered barstool" by Andriano Milanovic (https://sketchfab.com/3d-models/none-2be0e4efd95d4b9b9740eeeaae318af6), CC Attribution.
- `office/office-plantA.glb`: "Monstera Deliciosa Potted Mid-Century plant" by Giora (https://sketchfab.com/3d-models/none-1ab9bf841df04c07b1819be596327629), CC Attribution.
- `office/office-plantB.glb`: "Potted Plant, Mediterranean med leaf, low poly" by dudecon (https://sketchfab.com/3d-models/none-bc7f26baef2a45d18dbd9a5d6d2ec565), CC Attribution.
