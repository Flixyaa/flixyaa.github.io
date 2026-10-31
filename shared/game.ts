import {maps,type Arena} from './maps.js';
import {type WeaponId,type PrimaryId,type WeaponSlot} from './weapons.js';
export const DT=1/60, HEIGHT=1.75, RADIUS=.35;
export type Box={x:number,y:number,z:number,w:number,h:number,d:number,color:number};
export const boxes:Box[]=maps.foundry.boxes;
export type Input={seq:number,x:number,z:number,yaw:number,pitch:number,jump:boolean,sprint:boolean,fire:boolean,reload:boolean,aim?:boolean,crouch?:boolean,slot?:WeaponSlot};
export type Stance='standing'|'crouching'|'sliding';
export type Body={x:number,y:number,z:number,vx:number,vy:number,vz:number,ground:boolean,yaw:number,pitch:number,weapon?:WeaponId,stance:Stance,sprinting:boolean,crouchHeld:boolean,slideTicks:number,slideCooldown:number,slideX:number,slideZ:number};
export type Player=Body&{id:string,primary:PrimaryId,weapon:WeaponId,slot:WeaponSlot,ammoByWeapon:Record<WeaponId,number>,switchAt:number,triggerHeld:boolean,hp:number,rounds:number,ammo:number,reloadAt:number,shotAt:number,respawnAt:number,ack:number,ready:boolean,life:number};
export function spawn(slot:number,map:Arena=maps.foundry):Body{return {x:slot?map.spawnX:-map.spawnX,y:0,z:0,vx:0,vy:0,vz:0,ground:true,yaw:slot?Math.PI/2:-Math.PI/2,pitch:0,stance:'standing',sprinting:false,crouchHeld:false,slideTicks:0,slideCooldown:0,slideX:0,slideZ:0};}
export function bodyHeight(p:Body){return p.stance==='sliding'?.8:p.stance==='crouching'?1.05:HEIGHT;}
export function eyeHeight(p:Body){return bodyHeight(p)-.2;}
export function overlap(p:Body,b:Box){return p.x+RADIUS>b.x-b.w/2&&p.x-RADIUS<b.x+b.w/2&&p.z+RADIUS>b.z-b.d/2&&p.z-RADIUS<b.z+b.d/2&&p.y+bodyHeight(p)>b.y-b.h/2+1e-6&&p.y<b.y+b.h/2-1e-6;}
export function move(p:Body,i:Input,map:Arena=maps.foundry){
 p.yaw=i.yaw;p.pitch=i.pitch;p.slideCooldown=Math.max(0,p.slideCooldown-1);
 const crouch=!!i.crouch,pressed=crouch&&!p.crouchHeld;p.crouchHeld=crouch;
 const previousSprint=p.sprinting,momentum=Math.hypot(p.vx,p.vz);
 if(pressed&&p.ground&&previousSprint&&i.sprint&&i.z>0&&!i.aim&&!i.reload&&!p.slideCooldown&&momentum>=7.5){p.slideTicks=39;p.slideCooldown=100;p.slideX=p.vx/momentum;p.slideZ=p.vz/momentum;}
 if(i.jump||!p.ground)p.slideTicks=0;
 if(p.slideTicks>0){p.stance='sliding';p.sprinting=false;}else{
  const wanted:Stance=crouch?'crouching':'standing';
  // Do not expand the hitbox through overhead cover when releasing crouch.
  const candidate={...p,stance:wanted};p.stance=map.boxes.some(b=>overlap(candidate,b))?'crouching':wanted;
  p.sprinting=!crouch&&p.stance==='standing'&&i.sprint&&i.z>0&&!i.aim&&!i.fire&&!i.reload;
 }
 const l=Math.max(1,Math.hypot(i.x,i.z)),knife=p.weapon==='knife',bonus=knife?1.24:p.weapon==='glock'?1.05:1;
 const speed=(p.stance==='crouching'?3.2:i.aim?4.5:p.sprinting?10.5:7.5)*bonus,acc=p.ground?16:5;
 const tx=(i.x*Math.cos(i.yaw)-i.z*Math.sin(i.yaw))/l*speed,tz=(-i.x*Math.sin(i.yaw)-i.z*Math.cos(i.yaw))/l*speed;
 if(p.slideTicks>0){const slideSpeed=(5+8*p.slideTicks/39)*(knife?1.15:1);p.vx=p.slideX*slideSpeed;p.vz=p.slideZ*slideSpeed;p.slideTicks--;}else{p.vx+=(tx-p.vx)*Math.min(1,acc*DT);p.vz+=(tz-p.vz)*Math.min(1,acc*DT);}
 if(i.jump&&p.ground){p.vy=8;p.ground=false;p.sprinting=false;}p.vy-=22*DT;
 for(const axis of ['x','z','y'] as const){const v=axis==='x'?'vx':axis==='z'?'vz':'vy',delta=p[v]*DT;p[axis]+=delta;if(axis==='y')p.ground=false;
  for(const b of map.boxes)if(overlap(p,b)){if(axis==='y'){p.y=delta>0?b.y-b.h/2-bodyHeight(p):b.y+b.h/2;if(delta<=0)p.ground=true;}else p[axis]=b[axis]+(delta>0?-1:1)*((axis==='x'?b.w:b.d)/2+RADIUS);p[v]=0;}
 }
 if(p.stance==='sliding'&&Math.hypot(p.vx,p.vz)<1)p.slideTicks=0;
}
export function direction(yaw:number,pitch:number){return [-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];}
export function rayBox(o:number[],d:number[],min:number[],max:number[]){let near=0,far=100;for(let a=0;a<3;a++){if(Math.abs(d[a])<1e-8){if(o[a]<min[a]||o[a]>max[a])return Infinity;}else{let t1=(min[a]-o[a])/d[a],t2=(max[a]-o[a])/d[a];if(t1>t2)[t1,t2]=[t2,t1];near=Math.max(near,t1);far=Math.min(far,t2);if(near>far)return Infinity;}}return near;}
export function hitDistance(shooter:Body,target:Body,map:Arena=maps.foundry){const o=[shooter.x,shooter.y+eyeHeight(shooter),shooter.z],d=direction(shooter.yaw,shooter.pitch);const t=rayBox(o,d,[target.x-RADIUS,target.y,target.z-RADIUS],[target.x+RADIUS,target.y+bodyHeight(target),target.z+RADIUS]);let wall=100;for(const b of map.boxes)wall=Math.min(wall,rayBox(o,d,[b.x-b.w/2,b.y-b.h/2,b.z-b.d/2],[b.x+b.w/2,b.y+b.h/2,b.z+b.d/2]));return t<wall?t:Infinity;}
export function validInput(v:any):v is Input{return v&&['aim','crouch'].every(k=>v[k]===undefined||typeof v[k]==='boolean')&&(v.slot===undefined||v.slot===1||v.slot===2||v.slot===3)&&Number.isSafeInteger(v.seq)&&v.seq>=0&&v.seq<2**31&&['x','z','yaw','pitch'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]))&&Math.abs(v.x)<=1&&Math.abs(v.z)<=1&&Math.abs(v.yaw)<=Math.PI*2&&Math.abs(v.pitch)<=1.5&&['jump','sprint','fire','reload'].every(k=>typeof v[k]==='boolean');}
