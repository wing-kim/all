/* 개발용: 데스크톱 브라우저에서 Quest 3 를 흉내 내는 IWER 설치 (?emu=1 일 때만 로드) */
(function () {
  if (!window.IWER) { console.warn('[khxr-emu] IWER 없음'); return; }
  const d = new IWER.XRDevice(IWER.metaQuest3);
  d.installRuntime({ forceInstall: true });
  d.stereoEnabled = new URLSearchParams(location.search).get('stereo') === '1';
  d.position.set(0, 1.6, 0);
  d.controllers.left.position.set(-0.25, 1.3, -0.35);
  d.controllers.right.position.set(0.25, 1.3, -0.35);
  window.KHEMU = d;
  console.log('[khxr-emu] Quest 3 에뮬레이터 설치');
})();
