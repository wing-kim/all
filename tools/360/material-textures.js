// Preserve authored lightmaps when moving the original scene to modern Three.
// Legacy Three uses uv2 for baked illumination; the modern bridge names it uv1.
export function copyMaterialTextures(source, target, copyTexture) {
 for (const key of ['map','aoMap','lightMap','normalMap','roughnessMap','metalnessMap','bumpMap','emissiveMap','alphaMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap']) {
  target[key] = source[key] ? copyTexture(source[key]) : null;
 }
 for (const key of ['aoMap','lightMap']) {
  if (!target[key]) continue;
  // One source image may also serve an albedo slot. Do not change that slot's UVs.
  if (Object.keys(target).some(slot => slot !== key && slot !== 'aoMap' && slot !== 'lightMap' && target[slot] === target[key])) {
   target[key] = target[key].clone();
   target[key].needsUpdate = true;
  }
  target[key].channel = 1;
  target[key + 'Intensity'] = source[key + 'Intensity'] ?? 1;
 }
}
