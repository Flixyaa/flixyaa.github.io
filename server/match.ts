import {maps,type MapId} from '../shared/maps.js';
import {weapons,isPrimary,slotWeapon,freshAmmo,shotSpread,spreadAngles,type WeaponId} from '../shared/weapons.js';
import {spawn,move,hitDistance,type Player,type Input} from '../shared/game.js';
export class Match{
 constructor(public readonly mapId:MapId='foundry'){}
 get map(){return maps[this.mapId];}
 players:Player[]=[];phase:'waiting'|'playing'|'roundover'|'finished'='waiting';endAt=0;winner='';roundWinner='';round=0;nextRoundAt=0;events:any[]=[];
 add(id:string,weapon:WeaponId='rifle'){if(!isPrimary(weapon))throw Error('Ungültige Waffe.');if(this.players.length===2)throw Error('Raum ist voll.');const p:Player={...spawn(this.players.length,this.map),id,weapon,primary:weapon,slot:1,ammoByWeapon:freshAmmo(),switchAt:0,triggerHeld:false,hp:100,rounds:0,ammo:weapons[weapon].magazine,reloadAt:0,shotAt:0,respawnAt:0,ack:-1,ready:false,life:0};this.players.push(p);return p;}
 ready(id:string,now:number){if(this.phase==='playing'||this.phase==='roundover')return;const p=this.players.find(p=>p.id===id);if(p)p.ready=true;if(this.players.length===2&&this.players.every(p=>p.ready)){this.winner='';this.round=0;this.players.forEach(p=>{p.rounds=0;p.ready=false;});this.startRound(now);}}
 startRound(now:number){this.round++;this.phase='playing';this.endAt=now+120000;this.roundWinner='';this.nextRoundAt=0;this.players.forEach((p,n)=>Object.assign(p,spawn(n,this.map),{hp:100,weapon:p.primary,slot:1,ammo:weapons[p.primary].magazine,ammoByWeapon:freshAmmo(),switchAt:0,triggerHeld:false,reloadAt:0,shotAt:0,respawnAt:0,life:p.life+1}));}
 endRound(id:string,now:number){this.roundWinner=id;const p=this.players.find(p=>p.id===id);if(p){p.rounds++;if(p.rounds>=5){this.finish(id);return;}}this.phase='roundover';this.nextRoundAt=now+2500;}
 finish(id:string){this.phase='finished';this.winner=id;this.players.forEach(p=>p.ready=false);}
 tick(now:number,inputs:Map<string,Input>){
 if(this.phase==='roundover'){for(const p of this.players){const i=inputs.get(p.id);if(i)p.ack=i.seq;}if(now>=this.nextRoundAt)this.startRound(now);return;}
 if(this.phase!=='playing')return;
 if(now>=this.endAt){const [a,b]=this.players;this.endRound(a.hp===b.hp?'':a.hp>b.hp?a.id:b.id,now);return;}
 for(const p of this.players){
  if(p.hp<=0)continue;
  if(p.reloadAt&&now>=p.reloadAt){p.ammo=weapons[p.weapon].magazine;p.ammoByWeapon[p.weapon]=p.ammo;p.reloadAt=0;}
  const raw=inputs.get(p.id);if(!raw)continue;
  const pressed=raw.fire&&!p.triggerHeld;p.triggerHeld=raw.fire;
  if(raw.slot!==undefined&&raw.slot!==p.slot&&now>=p.switchAt){p.ammoByWeapon[p.weapon]=p.ammo;p.slot=raw.slot;p.weapon=slotWeapon(p.primary,raw.slot);p.ammo=p.ammoByWeapon[p.weapon];p.reloadAt=0;p.switchAt=now+250;}
  const w=weapons[p.weapon],knife=p.weapon==='knife';
  const i={...raw,aim:!knife&&!!raw.aim,reload:!knife&&raw.reload};
  move(p,{...i,sprint:i.sprint&&!p.reloadAt&&now>=p.switchAt},this.map);p.ack=i.seq;
  if(i.reload&&!p.reloadAt&&p.ammo<w.magazine&&now>=p.switchAt)p.reloadAt=now+w.reload;
  if(i.fire&&(p.weapon!=='glock'||pressed)&&!p.reloadAt&&!p.sprinting&&now>=p.switchAt&&now-p.shotAt>=w.interval&&(knife||p.ammo>0)){
   p.shotAt=now;if(!knife){p.ammo--;p.ammoByWeapon[p.weapon]=p.ammo;}
   const enemy=this.players.find(q=>q.id!==p.id&&q.hp>0),spread=shotSpread(p.weapon,!!i.aim,Math.hypot(p.vx,p.vz)>1,!p.ground)*(p.stance==='crouching'?.75:1),angles=spreadAngles(spread);
   const distance=enemy?hitDistance({...p,yaw:p.yaw+angles.yaw,pitch:p.pitch+angles.pitch},enemy,this.map):Infinity;
   const hit=Number.isFinite(distance)&&(!knife||distance<=1.8);
   this.events.push({type:'shot',id:p.id,weapon:p.weapon,hit});
   if(hit&&enemy){enemy.hp=Math.max(0,enemy.hp-w.damage);if(enemy.hp===0){this.endRound(p.id,now);return;}}
  }
 }

 }
}
