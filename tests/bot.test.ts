import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bot} from '../server/bot.js';
import {Match} from '../server/match.js';
import {validInput} from '../shared/game.js';
test('bot navigates around central cover and wins a match through normal inputs',()=>{
 const m=new Match();m.add('human');const p=m.add('bot');const bot=new Bot('hard');m.ready('human',1000);m.ready('bot',1000);
 for(let tick=0;tick<60*180&&m.phase!=='finished';tick++){const now=1000+tick*1000/60;const input=bot.input(p,m.players[0],now);assert.ok(validInput(input));m.tick(now,new Map([['bot',input]]));}
 assert.equal(m.phase,'finished',JSON.stringify({p,path:bot.path,target:m.players[0]}));assert.equal(m.winner,'bot');assert.equal(p.rounds,5);
});
