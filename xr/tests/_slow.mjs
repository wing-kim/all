import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const p=await b.newPage(); await p.setViewport({width:1280,height:800});
await p.setUserAgent('Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/38.0.0.1.0 SamsungBrowser/4.0 Chrome/132.0.0.0 VR Safari/537.36');
const c=await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate',{rate:+(process.env.CPU||6)});
await c.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:10e6/8,uploadThroughput:5e6/8});
p.on('console',m=>{const t=m.text(); if(/khpr.*(연결|없어)|error/i.test(t)) console.log('LOG',t.slice(0,200));});
p.on('pageerror',e=>console.log('ERR',e.message));
const t0=Date.now();
await p.goto('https://evyfjae.github.io/kapehorn-preview/xr-photoreal/new/3d-model.html',{waitUntil:'domcontentloaded',timeout:120000});
let seen={};
for(let i=0;i<90;i++){ const s=await p.evaluate(()=>({xr:!!window.KHXR,pr:!!window.KHPR,layer:!!window.KHPRLayer,radio:!!document.getElementById('vm-pr')})).catch(()=>({}));
  for(const k in s) if(s[k]&&!seen[k]) {seen[k]=((Date.now()-t0)/1000).toFixed(1); console.log(k,'at',seen[k],'s');}
  if(s.radio) break; await new Promise(r=>setTimeout(r,1000)); }
console.log('final',JSON.stringify(seen));
await b.close();
