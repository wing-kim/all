# Reproducing the quality study

The interactive prototype is deliberately separate from the production entry point:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/new/360/`. The original page at `new/3d-model.html` only exposes the study extension with `?lab=360`.

## Browser verification

1. Use all six view buttons. Verify intermediate camera movement stays on an arc outside the building, then drag horizontally through the ±π boundary, vertically, and use the mouse wheel.
2. Compare model vertex arrays and transforms before/after all views. The recorded baseline hash in `docs/360/evidence/tower360-view-tests.json` is a camera-invariance check, not a design-certification check.
3. Test 1440×1000 and 390×844 viewports, the reference toggle, balanced/high quality, lighting, and HDR load failure (fallback to the existing sky).
4. Export the model. Validate GLB magic/version/length and import separately into a DCC.
5. Run the unmodified entry path and exercise sketch/render/photo modes. Preserve original default behavior.

## Offline benchmark

The study iframe exposes `TOWER360.exportModel('scene')` to developer tooling. It returns an ArrayBuffer with the complete study scene; the ordinary export button returns just the building. Shared materials are cached and instanced geometry is flattened for DCC compatibility. Download/save this ArrayBuffer as a `.glb` file locally. Never confuse a still render with the interactive deliverable.

Validated with locally installed Blender 5.1.1; this script uses its `MULTIPLE_SCATTERING` sky node enum:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -t 6 \
  --python tools/360/render_study.py -- \
  /absolute/path/kapehorn-scene-study.glb /absolute/path/cycles-corner.png
```

Creates an editable `.blend` file and a Cycles 1280×800, 64-sample render. Glass transmission and small bevel/normal-detail changes are render studies, not approved material specifications. Uses a procedural sky/sun; generic web HDRI is not used by this offline benchmark. Geometry dimensions and opening positions are retained. Metal GPU is selected if available, otherwise CPU. First-run shader compilation can take several minutes.

## WebGPU renderer revision

Run `npm ci --ignore-scripts` and `npm run build` inside this directory. `modern-entry.js` is the editable source; the committed `../../new/360/modern.js` bundle runs on static hosting. The existing model remains the geometry authority. The renderer copies its buffers and matrices, uses the same camera, and displays a raster preview while the path tracer and local OIDN denoiser converge. WebGPU is optional; `?engine=realtime` keeps the legacy WebGL path.

The Draco tree asset was prepared from Poly Haven Tree Small 02 (1K glTF and its listed dependencies). Reproduce with Blender: `blender -b --python prepare_tree.py -- /absolute/source/tree.gltf /absolute/output/tree-small-02.glb`. The source folder needs its original bin and textures. The script writes a UV-compatible glTF beside the source before importing it, retains deterministic complete leaf components, adjusts their silhouettes, reduces mesh detail and exports Draco.
