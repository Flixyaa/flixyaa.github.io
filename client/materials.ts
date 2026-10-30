import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const textures=new Map<string,T.CanvasTexture>();
function surface(kind:'metal'|'cloth'|'rubber'){
 const old=textures.get(kind);if(old)return old;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d')!;
 let seed=1927;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const data=c.createImageData(512,512);for(let i=0;i<data.data.length;i+=4){const x=(i/4)%512,y=Math.floor(i/2048);const weave=kind==='cloth'?((x%4<2?1:-1)+(y%4<2?1:-1))*12:0;const n=180+rand()*45+weave;data.data[i]=data.data[i+1]=data.data[i+2]=n;data.data[i+3]=255;}c.putImageData(data,0,0);
 if(kind==='metal'){for(let i=0;i<170;i++){const x=rand()*512,y=rand()*512;c.strokeStyle='rgba(245,245,245,'+(rand()*.3)+')';c.lineWidth=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+rand()*28,y+rand()*2);c.stroke();}}
 if(kind==='cloth'){for(let i=0;i<120;i++){c.fillStyle=['#91998555','#59675450','#b5b7a544'][i%3];c.beginPath();const x=rand()*512,y=rand()*512;c.ellipse(x,y,rand()*36+8,rand()*12+3,rand()*6,0,Math.PI*2);c.fill();}}
 const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.set(kind,t);return t;
}
export function finish(color:number,kind:'metal'|'cloth'|'rubber'='metal',roughness=kind==='metal'?.38:.88){const map=surface(kind);return new T.MeshStandardMaterial({color,map,roughness,metalness:kind==='metal'?.72:0,bumpMap:map,bumpScale:kind==='cloth'?.0018:.00035,envMapIntensity:.8});}
const loader=new T.TextureLoader();
export function concrete(id:'concrete_floor'|'concrete_wall_003',repeatX:number,repeatY:number){
 const load=(name:string,color=false)=>{const t=loader.load(import.meta.env.BASE_URL+'materials/'+id+'-'+name+'.jpg');t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;return t;};
 return new T.MeshStandardMaterial({map:load('color',true),normalMap:load('normal'),roughnessMap:load('roughness'),normalScale:new T.Vector2(.65,.65),roughness:1,color:0xc3c6c7});
}
export function studioEnvironment(scene:T.Scene,renderer:T.WebGLRenderer){const generator=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const target=generator.fromScene(room,.04);scene.environment=target.texture;scene.environmentIntensity=.36;room.dispose();generator.dispose();return target;}
