import {isMap} from '../shared/maps';
import {isWeapon} from '../shared/weapons';
import {Match} from '../server/match';
import {Bot,type Difficulty} from '../server/bot';
import {validInput,type Input} from '../shared/game';

// Local single-player transport. Online rooms still use the authoritative Node server.
export class LocalGame{
 readyState=0;onopen:(()=>void)|null=null;onclose:(()=>void)|null=null;onerror:(()=>void)|null=null;onmessage:((event:{data:string})=>void)|null=null;
 private match=new Match();private bot=new Bot();private queue:Input[]=[];private timer:ReturnType<typeof setInterval>|undefined;
 constructor(){setTimeout(()=>{if(this.readyState===3)return;this.readyState=1;this.emit({type:'hello',id:'local'});this.onopen?.();let tick=0;this.timer=setInterval(()=>{const now=Date.now(),m=this.match;if(m.players.length!==2)return;const inputs=new Map<string,Input>();const i=this.queue.shift();if(i)inputs.set('local',i);if(m.phase==='playing')inputs.set('bot',this.bot.input(m.players[1],m.players[0],now));m.tick(now,inputs);if(++tick%3===0||m.events.length){this.emit({type:'state',now,mapId:m.mapId,phase:m.phase,endAt:m.endAt,round:m.round,roundWinner:m.roundWinner,nextRoundAt:m.nextRoundAt,winner:m.winner,players:m.players,events:m.events});m.events=[];}},1000/60);},0);}
 private emit(m:unknown){this.onmessage?.({data:JSON.stringify(m)});}
 send(data:string){const m=JSON.parse(data),now=Date.now();if(m.type==='bot'){const difficulty:Difficulty=['easy','medium','hard'].includes(m.difficulty)?m.difficulty:'easy';const mapId=isMap(m.mapId)?m.mapId:'foundry';this.match=new Match(mapId);this.bot=new Bot(difficulty,mapId);this.match.add('local',isWeapon(m.weapon)?m.weapon:'rifle');this.match.add('bot');this.match.ready('local',now);this.match.ready('bot',now);this.emit({type:'joined',code:'LOCAL',bot:true,difficulty,mapId:this.match.mapId});}else if(m.type==='ready'){this.match.ready('local',now);this.match.ready('bot',now);}else if(m.type==='input'&&validInput(m.input)&&this.queue.length<12)this.queue.push(m.input);else if(m.type==='ping')this.emit({type:'pong',at:m.at});}
 close(){this.readyState=3;if(this.timer)clearInterval(this.timer);this.onclose?.();}
}
