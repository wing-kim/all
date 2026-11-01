// GLB 안 텍스처·형상 크기 보기: node inspect.mjs <glb...>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
for (const f of process.argv.slice(2)) {
  const d = await io.read(f), r = d.getRoot();
  const tex = r.listTextures().map(t => { const s = t.getSize() || [0, 0]; return `${t.getMimeType().replace('image/', '')} ${s[0]}x${s[1]} ${(t.getImage().byteLength / 1e3) | 0}k`; });
  let geo = 0; r.listAccessors().forEach(a => { geo += a.getArray() ? a.getArray().byteLength : 0; });
  console.log(f.split('/').pop(), 'ext=' + r.listExtensionsUsed().map(e => e.extensionName).join(','), 'geo(raw)=' + ((geo / 1e3) | 0) + 'k', 'tex=' + tex.length, tex.join(' | '));
}
