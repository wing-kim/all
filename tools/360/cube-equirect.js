// 정밀(경로 추적) 이미지용 하늘: three-gpu-pathtracer는 큐브맵 배경을 WebGL 전용 유틸
// (CubeToEquirectGenerator, renderer.readRenderTargetPixels)로 바꾸려다 WebGPU에서 실패한다.
// 원본 하늘 캡처(큐브)를 WebGPU 셰이더로 등장방형에 그린 뒤 읽어 DataTexture로 넘긴다.
import { cubeTexture, uv, vec3, cos, sin } from 'three/tsl';

// three의 등장방형 규약(u=atan(z,x)/2π+0.5, v=asin(y)/π+0.5)의 역변환.
export function equirectDirection(u,v){
 const phi=(u-.5)*Math.PI*2,theta=(v-.5)*Math.PI;
 return [Math.cos(theta)*Math.cos(phi),Math.sin(theta),Math.cos(theta)*Math.sin(phi)];
}

export async function cubeToEquirect(T,renderer,cube,width=1024){
 const height=width/2,target=new T.RenderTarget(width,height,{type:T.FloatType,depthBuffer:false});
 const u=uv(),phi=u.x.sub(.5).mul(Math.PI*2),theta=u.y.sub(.5).mul(Math.PI);
 const material=new T.MeshBasicNodeMaterial();material.colorNode=cubeTexture(cube,vec3(cos(theta).mul(cos(phi)),sin(theta),cos(theta).mul(sin(phi))));
 const quad=new T.QuadMesh(material),previous=renderer.getRenderTarget();
 try{renderer.setRenderTarget(target);quad.render(renderer)}finally{renderer.setRenderTarget(previous)}
 const pixels=await renderer.readRenderTargetPixelsAsync(target,0,0,width,height);
 target.dispose();material.dispose();
 const data=new Float32Array(pixels.buffer?pixels.buffer.slice(pixels.byteOffset,pixels.byteOffset+width*height*16):pixels);
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);
 texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.LinearSRGBColorSpace;
 texture.magFilter=texture.minFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;texture.name='source-sky-equirect';
 return texture;
}
