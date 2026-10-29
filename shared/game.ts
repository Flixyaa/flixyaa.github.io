import {type WeaponId} from './weapons.js';
export const DT=1/60, HEIGHT=1.75, RADIUS=.35;
export type Box={x:number,y:number,z:number,w:number,h:number,d:number,color:number};
export const boxes:Box[]=[
 {x:0,y:-.5,z:0,w:36,h:1,d:28,color:0x28394b},
 {x:-18,y:3,z:0,w:1,h:6,d:28,color:0x52667b},{x:18,y:3,z:0,w:1,h:6,d:28,color:0x52667b},
 {x:0,y:3,z:-14,w:36,h:6,d:1,color:0x52667b},{x:0,y:3,z:14,w:36,h:6,d:1,color:0x52667b},
 {x:0,y:2,z:0,w:5,h:4,d:9,color:0x416e7d},
 {x:-10,y:1.5,z:-4,w:3,h:3,d:5,color:0xa77756},{x:10,y:1.5,z:4,w:3,h:3,d:5,color:0xa77756},
 {x:-6,y:.5,z:8,w:4,h:1,d:3,color:0x657b89},{x:6,y:.5,z:-8,w:4,h:1,d:3,color:0x657b89},
 {x:0,y:1,z:10,w:6,h:2,d:3,color:0x416e7d},{x:0,y:1,z:-10,w:6,h:2,d:3,color:0x416e7d},
 {x:-12,y:.4,z:8,w:3,h:.8,d:3,color:0xa77756},{x:12,y:.4,z:-8,w:3,h:.8,d:3,color:0xa77756}
];
export type Input={seq:number,x:number,z:number,yaw:number,pitch:number,jump:boolean,sprint:boolean,fire:boolean,reload:boolean};
export type Body={x:number,y:number,z:number,vx:number,vy:number,vz:number,ground:boolean,yaw:number,pitch:number};
export type Player=Body&{id:string,weapon:WeaponId,hp:number,rounds:number,ammo:number,reloadAt:number,shotAt:number,respawnAt:number,ack:number,ready:boolean,life:number};
export function spawn(slot:number):Body{return {x:slot?14:-14,y:0,z:0,vx:0,vy:0,vz:0,ground:true,yaw:slot?Math.PI/2:-Math.PI/2,pitch:0};}
export function overlap(p:Body,b:Box){return p.x+RADIUS>b.x-b.w/2&&p.x-RADIUS<b.x+b.w/2&&p.z+RADIUS>b.z-b.d/2&&p.z-RADIUS<b.z+b.d/2&&p.y+HEIGHT>b.y-b.h/2+1e-6&&p.y<b.y+b.h/2-1e-6;}
export function move(p:Body,i:Input){
 p.yaw=i.yaw;p.pitch=i.pitch;
 const l=Math.max(1,Math.hypot(i.x,i.z)),speed=i.sprint?10:7.5,acc=p.ground?16:5;
 const tx=(i.x*Math.cos(i.yaw)-i.z*Math.sin(i.yaw))/l*speed,tz=(-i.x*Math.sin(i.yaw)-i.z*Math.cos(i.yaw))/l*speed;
 p.vx+=(tx-p.vx)*Math.min(1,acc*DT);p.vz+=(tz-p.vz)*Math.min(1,acc*DT);
 if(i.jump&&p.ground){p.vy=8;p.ground=false;}p.vy-=22*DT;
 for(const axis of ['x','z','y'] as const){const v=axis==='x'?'vx':axis==='z'?'vz':'vy',delta=p[v]*DT;p[axis]+=delta;if(axis==='y')p.ground=false;
 for(const b of boxes)if(overlap(p,b)){if(axis==='y'){p.y=delta>0?b.y-b.h/2-HEIGHT:b.y+b.h/2;if(delta<=0)p.ground=true;}else p[axis]=b[axis]+(delta>0?-1:1)*((axis==='x'?b.w:b.d)/2+RADIUS);p[v]=0;}}
}
export function direction(yaw:number,pitch:number){return [-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];}
export function rayBox(o:number[],d:number[],min:number[],max:number[]){let near=0,far=100;for(let a=0;a<3;a++){if(Math.abs(d[a])<1e-8){if(o[a]<min[a]||o[a]>max[a])return Infinity;}else{let t1=(min[a]-o[a])/d[a],t2=(max[a]-o[a])/d[a];if(t1>t2)[t1,t2]=[t2,t1];near=Math.max(near,t1);far=Math.min(far,t2);if(near>far)return Infinity;}}return near;}
export function hitDistance(shooter:Body,target:Body){const o=[shooter.x,shooter.y+1.55,shooter.z],d=direction(shooter.yaw,shooter.pitch);const t=rayBox(o,d,[target.x-RADIUS,target.y,target.z-RADIUS],[target.x+RADIUS,target.y+HEIGHT,target.z+RADIUS]);let wall=100;for(const b of boxes)wall=Math.min(wall,rayBox(o,d,[b.x-b.w/2,b.y-b.h/2,b.z-b.d/2],[b.x+b.w/2,b.y+b.h/2,b.z+b.d/2]));return t<wall?t:Infinity;}
export function validInput(v:any):v is Input{return v&&Number.isSafeInteger(v.seq)&&v.seq>=0&&v.seq<2**31&&['x','z','yaw','pitch'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]))&&Math.abs(v.x)<=1&&Math.abs(v.z)<=1&&Math.abs(v.yaw)<=Math.PI*2&&Math.abs(v.pitch)<=1.5&&['jump','sprint','fire','reload'].every(k=>typeof v[k]==='boolean');}
