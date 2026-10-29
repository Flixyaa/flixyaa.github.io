import {spawn,move,hitDistance,type Player,type Input} from '../shared/game.js';
export class Match{
 players:Player[]=[];phase:'waiting'|'playing'|'roundover'|'finished'='waiting';endAt=0;winner='';roundWinner='';round=0;nextRoundAt=0;events:any[]=[];
 add(id:string){if(this.players.length===2)throw Error('Raum ist voll.');const p:Player={...spawn(this.players.length),id,hp:100,rounds:0,ammo:24,reloadAt:0,shotAt:0,respawnAt:0,ack:-1,ready:false,life:0};this.players.push(p);return p;}
 ready(id:string,now:number){if(this.phase==='playing'||this.phase==='roundover')return;const p=this.players.find(p=>p.id===id);if(p)p.ready=true;if(this.players.length===2&&this.players.every(p=>p.ready)){this.winner='';this.round=0;this.players.forEach(p=>{p.rounds=0;p.ready=false;});this.startRound(now);}}
 startRound(now:number){this.round++;this.phase='playing';this.endAt=now+120000;this.roundWinner='';this.nextRoundAt=0;this.players.forEach((p,n)=>Object.assign(p,spawn(n),{hp:100,ammo:24,reloadAt:0,shotAt:0,respawnAt:0,life:p.life+1}));}
 endRound(id:string,now:number){this.roundWinner=id;const p=this.players.find(p=>p.id===id);if(p){p.rounds++;if(p.rounds>=5){this.finish(id);return;}}this.phase='roundover';this.nextRoundAt=now+2500;}
 finish(id:string){this.phase='finished';this.winner=id;this.players.forEach(p=>p.ready=false);}
 tick(now:number,inputs:Map<string,Input>){
 if(this.phase==='roundover'){for(const p of this.players){const i=inputs.get(p.id);if(i)p.ack=i.seq;}if(now>=this.nextRoundAt)this.startRound(now);return;}
 if(this.phase!=='playing')return;
 if(now>=this.endAt){const [a,b]=this.players;this.endRound(a.hp===b.hp?'':a.hp>b.hp?a.id:b.id,now);return;}
 for(const [n,p] of this.players.entries()){
 if(p.hp<=0)continue;
 if(p.reloadAt&&now>=p.reloadAt){p.ammo=24;p.reloadAt=0;}
 const i=inputs.get(p.id);if(!i)continue;move(p,i);p.ack=i.seq;
 if(i.reload&&p.ammo<24&&!p.reloadAt)p.reloadAt=now+1400;
 if(i.fire&&!p.reloadAt&&now-p.shotAt>=110&&p.ammo>0){p.shotAt=now;p.ammo--;const enemy=this.players.find(q=>q.id!==p.id&&q.hp>0);const hit=enemy&&Number.isFinite(hitDistance(p,enemy));this.events.push({type:'shot',id:p.id,hit:!!hit});if(hit&&enemy){enemy.hp=Math.max(0,enemy.hp-25);if(enemy.hp===0){this.endRound(p.id,now);return;}}}
 }
 }
}
