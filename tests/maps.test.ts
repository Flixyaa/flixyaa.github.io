import {test} from 'node:test';
import assert from 'node:assert/strict';
import {maps,isMap,type MapId} from '../shared/maps.js';
import {spawn,overlap,hitDistance,move,validInput,type Input} from '../shared/game.js';
import {Match} from '../server/match.js';
import {Bot} from '../server/bot.js';
test('map validation rejects inherited and unknown identifiers',()=>{for(const v of ['__proto__','constructor','missing',null,42])assert.equal(isMap(v),false);});
for(const map of Object.values(maps)){
 test(map.id+': safe spawns, cover blocks spawn shots, walls contain movement',()=>{
  const a=spawn(0,map),b=spawn(1,map);for(const p of [a,b])assert.ok(!map.boxes.some(box=>overlap(p,box)));
  assert.equal(hitDistance(a,b,map),Infinity);
  const i:Input={seq:0,x:-1,z:0,yaw:0,pitch:0,jump:false,sprint:true,fire:false,reload:false};for(let n=0;n<1200;n++)move(a,i,map);assert.ok(a.x>=-map.width/2+.84);assert.ok(a.y>=0);
 });
 test(map.id+': bot navigates the selected map and completes five rounds',()=>{
  const m=new Match(map.id);m.add('human');const p=m.add('bot'),bot=new Bot('hard',map.id);m.ready('human',1000);m.ready('bot',1000);
  for(let t=0;t<60*240&&m.phase!=='finished';t++){const now=1000+t*1000/60,i=bot.input(p,m.players[0],now);assert.ok(validInput(i));m.tick(now,new Map([['bot',i]]));}
  assert.equal(m.winner,'bot',JSON.stringify({map:map.id,position:p,path:bot.path.slice(0,4)}));assert.equal(p.rounds,5);
 });
}
test('simultaneous matches retain independent map geometry and spawn positions',()=>{
 const ids:MapId[]=['quarry','foundry','harbor','reactor'];const matches=ids.map(id=>{const m=new Match(id);m.add('a');m.add('b');m.ready('a',1000);m.ready('b',1000);return m;});
 for(const m of matches){assert.equal(m.players[0].x,-maps[m.mapId].spawnX);assert.equal(m.map.boxes,maps[m.mapId].boxes);m.startRound(2000);assert.equal(m.players[1].x,maps[m.mapId].spawnX);}
});
