// 바닥 반짝임(앨리어싱) 측정: node shimmer.mjs  (BASE=주소, QS=추가 옵션 예: &praa=0, VIEWS=1F,B1,5F,street)
// 카메라를 MOVE(m, 기본 0.01, 권장 0.0005)씩 옆으로 6번 옮겨 찍고, 잘라낸 영역(CX·CY·CW·CH)의 이웃 프레임 사이 화소 밝기 변화 평균(flick)과
// 12단계 넘게 바뀐 화소 비율(hiPct)을 잰다. SAVE=1 이면 화면과 열지도(빨강 = 깜빡임)를 scratch 폴더(SP)에 남긴다
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const SP=process.env.SP || fileURLToPath(new URL('./out/', import.meta.url));
const BASE = process.env.BASE || 'http://localhost:8791';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error'||/THREE.WebGLProgram|Shader Error/.test(m.text())) errs.push(m.text().slice(0,300)); });
await p.goto(BASE + '/new/3d-model.html?pr=1&prsw=0' + (process.env.QS||''), { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.KHPRLayer && KHPRLayer.t.warm != null && KHPRLayer.t.ground != null, { timeout: 180000 }).catch(()=>{});
await p.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
const VAR = process.env.VAR || '';
const res = {};
for (const v of (process.env.VIEWS||'1F,B1,5F,street').split(',')) {
  await p.evaluate(v => { const X = KHXR, K = KHPRLayer.K;
    if (v==='street') { if (K.I.on) X.exitInt && X.exitInt(); X.go('corner'); }
    else { const i = K.LEVELS.findIndex(l => l.key === v); if (!K.I.on) X.enterInt(); X.placeLevel(i, true); } }, v);
  await new Promise(r=>setTimeout(r,3500));
  if (v==='street' && !process.env.KEEP) await p.evaluate(() => { const X=KHXR,c=X.camera,t=X.controls.target; const d=c.position.clone().sub(t); d.y=0; d.normalize(); t.y=0; c.position.copy(t).addScaledVector(d,60); c.position.y=1.7; t.y=0.0; X.controls.update(); });
  if (VAR) await p.evaluate(VAR);
  await new Promise(r=>setTimeout(r,800));
  const shots = [];
  for (let k=0;k<6;k++) {
    await p.evaluate((k, mv) => { const c=KHXR.camera; if (!c.userData.p0) c.userData.p0=c.position.clone(); const r=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion); c.position.copy(c.userData.p0).addScaledVector(r,k*mv); c.updateMatrixWorld(); }, k, +(process.env.MOVE ?? 0.01));
    await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>4?r():requestAnimationFrame(f)); f(); }));
    shots.push('data:image/png;base64,' + await p.screenshot({ encoding:'base64', clip:{x:+(process.env.CX||0),y:+(process.env.CY||430),width:+(process.env.CW||930),height:+(process.env.CH||290)} }));
  }
  await p.evaluate(() => { const c=KHXR.camera; if (c.userData.p0) { c.position.copy(c.userData.p0); delete c.userData.p0; } });
  if (process.env.SAVE) await p.screenshot({ path: SP+'sh-'+v+(process.env.TAG||'')+'.png' });
  res[v] = await p.evaluate(async S => { const ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;}); const I=await Promise.all(S.map(ld)); const w=I[0].width,h=I[0].height,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
    const D=I.map(i=>{g.drawImage(i,0,0);return g.getImageData(0,0,w,h).data;}); let s=0,n=0,hi=0;const HM=g.createImageData(w,h);
    // 이웃 프레임 사이 밝기 변화의 평균(1cm 이동은 실제 움직임이 매우 작아 대부분 앨리어싱 반짝임)
    for(let i=0;i<w*h*4;i+=4){let a=0;for(let k=1;k<D.length;k++){const l0=(D[k-1][i]+D[k-1][i+1]+D[k-1][i+2])/3,l1=(D[k][i]+D[k][i+1]+D[k][i+2])/3;a+=Math.abs(l1-l0);}a/=D.length-1;HM.data[i]=Math.min(255,a*6);HM.data[i+1]=D[0][i+1]*0.3;HM.data[i+2]=0;HM.data[i+3]=255;s+=a;n++;if(a>12)hi++;}
    const H=g.createImageData(w,h);for(let i=0,j=0;i<w*h*4;i+=4,j++){} ;
    g.putImageData(HM,0,0);return {flick:+(s/n).toFixed(2), hiPct:+(hi/n*100).toFixed(2), heat:cv.toDataURL('image/png')}; }, shots);
  if(process.env.SAVE){(await import('node:fs')).writeFileSync(SP+'heat-'+v+(process.env.TAG||'')+'.png',Buffer.from(res[v].heat.split(',')[1],'base64'));} delete res[v].heat; console.log(v, JSON.stringify(res[v]));
}
console.log('오류', errs.length, errs.slice(0,3)); await b.close();
