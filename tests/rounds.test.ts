import {test} from 'node:test';import assert from 'node:assert/strict';
import {Match} from '../server/match.js';import {Bot} from '../server/bot.js';import {type Input} from '../shared/game.js';
const input:Input={seq:1,x:0,z:0,yaw:0,pitch:0,jump:false,sprint:false,fire:true,reload:false};
test('five round wins, intermission lock, full reset, reload, cadence and rematch',()=>{
 const m=new Match(),a=m.add('a'),b=m.add('b');assert.throws(()=>m.add('c'));m.ready('a',1000);assert.equal(m.phase,'waiting');m.ready('b',1000);let now=2000;
 for(let round=1;round<=5;round++){
 assert.equal(m.round,round);Object.assign(a,{x:-14,z:7,yaw:0});Object.assign(b,{x:-14,z:3});
 for(let shot=0;shot<4;shot++){m.tick(now,new Map([['a',input]]));if(shot===0){assert.equal(b.hp,75);m.tick(now+1,new Map([['a',input]]));assert.equal(b.hp,75);}now+=120;}
 assert.equal(a.rounds,round);assert.equal(b.hp,0);
 if(round<5){assert.equal(m.phase,'roundover');const pos=a.x,ammo=a.ammo;m.tick(now,new Map([['a',{...input,x:1}]]));assert.equal(a.x,pos);assert.equal(a.ammo,ammo);m.ready('a',now);assert.equal(m.phase,'roundover');now=m.nextRoundAt;m.tick(now,new Map());assert.equal(a.hp,100);assert.equal(b.hp,100);assert.equal(a.ammo,24);assert.equal(b.ammo,24);assert.equal(a.x,-14);assert.equal(b.x,14);now+=100;}
 }
 assert.equal(m.phase,'finished');assert.equal(m.winner,'a');m.ready('a',now);m.ready('b',now);assert.equal(m.round,1);assert.equal(a.rounds,0);assert.equal(m.phase,'playing');
 a.ammo=2;m.tick(now,new Map([['a',{...input,fire:false,reload:true}]]));m.tick(now+100,new Map([['a',input]]));assert.equal(a.ammo,2);m.tick(now+1500,new Map());assert.equal(a.ammo,24);
});
test('round timeout awards healthier player; tie starts next round without points',()=>{const m=new Match(),a=m.add('a'),b=m.add('b');m.ready('a',0);m.ready('b',0);m.tick(120000,new Map());assert.equal(m.phase,'roundover');assert.equal(a.rounds,0);assert.equal(b.rounds,0);m.tick(m.nextRoundAt,new Map());b.hp=75;m.tick(m.endAt,new Map());assert.equal(a.rounds,1);assert.equal(m.roundWinner,'a');assert.equal(m.phase,'roundover');});
test('easy bot reacts later and fires less often than medium and hard',()=>{
 const shots:number[]=[];
 for(const difficulty of ['easy','medium','hard'] as const){const m=new Match();const a=m.add('human'),p=m.add('bot');Object.assign(a,{x:-14,z:3});Object.assign(p,{x:-14,z:7,yaw:0,pitch:-.11});const bot=new Bot(difficulty);let count=0,first=0;
 for(let t=1000;t<7000;t+=1000/60){const i=bot.input(p,a,t);p.yaw=i.yaw;p.pitch=i.pitch;if(i.fire){if(!first)first=t;count++;p.shotAt=t;}}
 assert.ok(first>=1000+bot.settings.reaction);shots.push(count);
 }assert.ok(shots[0]<shots[1]&&shots[1]<shots[2]);
});
