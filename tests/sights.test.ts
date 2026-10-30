import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../server/match.js';
import {shotSpread,spreadAngles,weapons} from '../shared/weapons.js';
import {type Input,validInput,spawn,move} from '../shared/game.js';
const shot:Input={seq:0,x:0,z:0,yaw:0,pitch:0,jump:false,sprint:false,fire:true,reload:false,aim:true};
function setup(){const m=new Match(),a=m.add('a','marksman'),b=m.add('b');m.ready('a',0);m.ready('b',0);Object.assign(a,{x:-14,z:7});Object.assign(b,{x:-14,z:3});return {m,a,b};}
test('sniper body hit kills a full-health opponent and awards exactly one round',()=>{const {m,a,b}=setup();m.tick(2000,new Map([['a',shot]]));assert.equal(b.hp,0);assert.equal(a.rounds,1);assert.equal(m.phase,'roundover');assert.equal(a.ammo,7);m.tick(2100,new Map([['a',shot]]));assert.equal(a.rounds,1);});
test('sniper cannot fire again until 1400ms have elapsed, even while holding fire',()=>{const {m,a,b}=setup();const miss={...shot,yaw:Math.PI};m.tick(2000,new Map([['a',miss]]));m.tick(3399,new Map([['a',miss]]));assert.equal(a.ammo,7);m.tick(3400,new Map([['a',miss]]));assert.equal(a.ammo,6);assert.equal(b.hp,100);});
test('ADS reduces spread; moving and jumping increase SMG spread; sniper scope is accurate',()=>{assert.equal(shotSpread('marksman',true,false,false),0);assert.ok(shotSpread('smg',false,false,false)>shotSpread('rifle',false,false,false));assert.ok(shotSpread('smg',true,false,false)<shotSpread('smg',false,false,false));assert.ok(shotSpread('smg',true,true,true)>shotSpread('smg',true,false,false));let index=0;const sequence=[1,0];assert.deepEqual(spreadAngles(.03,()=>sequence[index++]),{yaw:.03,pitch:0});assert.ok(weapons.smg.recoil>.018);assert.ok(weapons.marksman.recoil>.045);});
test('ADS input is validated and prevents sprint speed',()=>{assert.equal(validInput({...shot,aim:'yes'}),false);assert.equal(validInput(shot),true);const p=spawn(0),q=spawn(0);for(let n=0;n<20;n++){move(p,{...shot,fire:false,z:1,sprint:true});move(q,{...shot,fire:false,z:1,sprint:true,aim:false});}assert.ok(Math.hypot(p.vx,p.vz)<Math.hypot(q.vx,q.vz));});
