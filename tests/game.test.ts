import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../server/match.js';
import {move,spawn,validInput,hitDistance,type Input} from '../shared/game.js';
const input=(seq=0):Input=>({seq,x:0,z:0,yaw:0,pitch:0,jump:false,sprint:false,fire:false,reload:false});
test('input validation rejects client velocity, NaN and oversized axes',()=>{assert.equal(validInput({...input(),x:2}),false);assert.equal(validInput({...input(),yaw:NaN}),false);assert.equal(validInput({...input(),fire:1}),false);assert.equal(validInput(input()),true);});
test('spawns have no direct line of sight',()=>{const a=spawn(0),b=spawn(1);assert.equal(hitDistance(a,b),Infinity);});
test('movement respects outer walls and lands after jumping',()=>{const p=spawn(0);for(let n=0;n<500;n++)move(p,{...input(n),x:-1});assert.ok(p.x>=-17.151);move(p,{...input(),jump:true});assert.ok(p.y>0);for(let n=0;n<100;n++)move(p,input(n));assert.ok(Math.abs(p.y)<.001);assert.equal(p.ground,true);});
