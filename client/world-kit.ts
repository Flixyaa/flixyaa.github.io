import * as T from 'three';
import {finish} from './materials';

export class WorldKit{
 textures:T.Texture[]=[];private labels=new Map<string,T.Material>();
 steel=finish(0x64737b,'metal',.48);dark=finish(0x26353c,'metal',.65);rust=finish(0x80513b,'metal',.85);
 rubber=new T.MeshStandardMaterial({color:0x20292b,roughness:.95});
 paint=new T.MeshStandardMaterial({color:0xc5a360,roughness:.8,metalness:.15});
 glass=new T.MeshPhysicalMaterial({color:0x53848d,roughness:.2,metalness:.45,clearcoat:1,envMapIntensity:1.5});
 lamp=new T.MeshStandardMaterial({color:0xffeed2,emissive:0xffd29a,emissiveIntensity:2.5});
 constructor(public root:T.Scene){}
 box(parent:T.Object3D,size:number[],pos:number[],mat:T.Material){
  const g=new T.BoxGeometry(...size as [number,number,number]);
  // Texture scale stays in world units, including long walls and shallow panels.
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.5?p.getZ(i):p.getX(i))/3,(ny>.5?p.getZ(i):p.getY(i))/3);}
  const mesh=new T.Mesh(g,mat);mesh.position.set(...pos as [number,number,number]);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 cylinder(parent:T.Object3D,r:number,h:number,pos:number[],mat:T.Material,top=r){const m=new T.Mesh(new T.CylinderGeometry(top,r,h,16),mat);m.position.set(...pos as [number,number,number]);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 pipe(parent:T.Object3D,a:number[],b:number[],radius:number,mat=this.steel){const start=new T.Vector3(...a as [number,number,number]),end=new T.Vector3(...b as [number,number,number]),delta=end.clone().sub(start);const mesh=this.cylinder(parent,radius,delta.length(),start.clone().add(end).multiplyScalar(.5).toArray(),mat);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;}
 ring(parent:T.Object3D,r:number,t:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.TorusGeometry(r,t,6,24),mat);m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
 group(x:number,y:number,z:number,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;this.root.add(g);return g;}
 label(parent:T.Object3D,title:string,subtitle:string,w:number,h:number,pos:number[],rotation=0,color='#e9cf8f'){
  const key=title+subtitle+color;let mat=this.labels.get(key);
  if(!mat){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d')!;c.fillStyle='#16252b';c.fillRect(0,0,512,256);c.strokeStyle=color;c.lineWidth=8;c.strokeRect(8,8,496,240);c.fillStyle=color;c.font='bold 66px Arial';c.fillText(title,30,110,450);c.font='23px monospace';c.fillText(subtitle,30,170,450);c.fillRect(30,202,150,5);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;this.textures.push(t);mat=new T.MeshStandardMaterial({map:t,roughness:.72,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.08});this.labels.set(key,mat);}
  const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(...pos as [number,number,number]);m.rotation.y=rotation;parent.add(m);return m;
 }
 vent(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number){this.box(parent,[w,h,.06],[x,y,z],this.dark);for(let v=-h/2+.08;v<h/2;v+=.12)this.box(parent,[w-.12,.035,.1],[x,y+v,z+.04],this.steel);}
 ladder(parent:T.Object3D,x:number,y:number,z:number,h:number){for(const side of [-1,1])this.pipe(parent,[x+side*.32,y,z],[x+side*.32,y+h,z],.035);for(let v=.15;v<h;v+=.3)this.pipe(parent,[x-.32,y+v,z],[x+.32,y+v,z],.025);}
 railing(parent:T.Object3D,a:number[],b:number[],height=1){this.pipe(parent,[a[0],a[1]+height,a[2]],[b[0],b[1]+height,b[2]],.035);this.pipe(parent,[a[0],a[1]+height*.5,a[2]],[b[0],b[1]+height*.5,b[2]],.022);const count=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/2);for(let i=0;i<=count;i++){const f=i/count,x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f;this.pipe(parent,[x,a[1],z],[x,a[1]+height,z],.03);}}
 barrel(parent:T.Object3D,x:number,y:number,z:number,mat:T.Material){this.cylinder(parent,.3,.85,[x,y+.425,z],mat);for(const v of [.12,.72]){const r=this.ring(parent,.305,.025,[x,y+v,z],this.steel);r.rotation.x=Math.PI/2;}this.cylinder(parent,.045,.025,[x+.12,y+.86,z],this.dark);}
 crate(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material){this.box(parent,[w,h,d],[x,y+h/2,z],mat);for(const side of [-1,1]){this.box(parent,[w+.03,.09,d+.03],[x,y+(side<0?.06:h-.06),z],this.dark);for(const v of [-1,1])this.box(parent,[.1,h,.1],[x+side*(w/2-.04),y+h/2,z+v*(d/2-.04)],this.dark);}for(let n=0;n<3;n++)this.box(parent,[w,.04,.08],[x,y+h+.02,z-d*.3+n*d*.3],this.steel);}
}

/** Local, deterministic surface maps: no downloads or asynchronous resource races. */
export function groundMaterial(kind:'asphalt'|'sand'|'concrete',textures:T.Texture[]){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!,data=ctx.createImageData(512,512);let seed=7209;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const base=kind==='asphalt'?[76,84,88]:kind==='sand'?[160,136,101]:[124,130,128];
 for(let i=0;i<data.data.length;i+=4){const n=(rand()-.5)*(kind==='sand'?34:23);for(let j=0;j<3;j++)data.data[i+j]=base[j]+n;data.data[i+3]=255;}ctx.putImageData(data,0,0);
 for(let i=0;i<1800;i++){const x=rand()*512,y=rand()*512,s=rand()*1.7+.3;ctx.fillStyle=i%3?'#131c2230':'#f1eadb38';ctx.fillRect(x,y,s,s);}
 if(kind!=='sand'){ctx.strokeStyle='#18272d55';ctx.lineWidth=1;for(let i=0;i<7;i++){let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let k=0;k<10;k++){x+=(rand()-.5)*30;y+=rand()*16;ctx.lineTo(x,y);}ctx.stroke();}}
 const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;textures.push(tex);
 return new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:kind==='sand'?.055:.025,roughness:kind==='asphalt'?.85:.97,color:0xffffff});
}

export function paintedSurface(textures:T.Texture[]){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d')!;c.fillStyle='#d4d7d6';c.fillRect(0,0,512,512);
 let seed=173;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<6000;i++){const v=100+random()*100;c.fillStyle=`rgba(${v},${v},${v},.07)`;c.fillRect(random()*512,random()*512,1+random()*3,1+random()*3);}
 for(let i=0;i<60;i++){const x=random()*512,y=random()*512;c.strokeStyle=i%3?'#4551530a':'#ffffff35';c.lineWidth=.4+random();c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*25,y+random()*3);c.stroke();}
 for(let i=0;i<20;i++){const x=random()*512,y=random()*512,g=c.createLinearGradient(x,y,x,y+130);g.addColorStop(0,'#3c45471b');g.addColorStop(1,'#3c454700');c.fillStyle=g;c.fillRect(x,y,2+random()*8,130);}
 const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;textures.push(tex);return tex;
}
