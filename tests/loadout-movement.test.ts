import {test} from 'node:test';import assert from 'node:assert/strict';
import {Match} from '../server/match.js';
import {spawn,move,eyeHeight,bodyHeight,hitDistance,validInput,type Input} from '../shared/game.js';
import {maps,type Arena} from '../shared/maps.js';
import {weapons} from '../shared/weapons.js';
const idle:Input={seq:0,x:0,z:0,yaw:0,pitch:0,jump:false,sprint:false,fire:false,reload:false};
const empty:Arena={...maps.quarry,boxes:[maps.quarry.boxes[0]]};
function match(){const m=new Match(),a=m.add('a'),b=m.add('b');m.ready('a',0);m.ready('b',0);Object.assign(a,{x:-14,z:7});Object.assign(b,{x:-14,z:3});return {m,a,b};}
test('primary, Glock and knife slots preserve magazines and enforce draw delay',()=>{
 const {m,a}=match();m.tick(1000,new Map([['a',{...idle,fire:true}]]));assert.equal(a.ammo,23);
 m.tick(1100,new Map([['a',{...idle,slot:2}]]));assert.equal(a.weapon,'glock');assert.equal(a.ammo,17);
 m.tick(1200,new Map([['a',{...idle,fire:true}]]));assert.equal(a.ammo,17);
 m.tick(1350,new Map([['a',idle]]));m.tick(1360,new Map([['a',{...idle,fire:true}]]));assert.equal(a.ammo,16);
 m.tick(1500,new Map([['a',{...idle,slot:1}]]));assert.equal(a.weapon,'rifle');assert.equal(a.ammo,23);
 m.tick(1800,new Map([['a',{...idle,slot:2}]]));assert.equal(a.ammo,16);
 m.tick(2100,new Map([['a',{...idle,slot:3}]]));assert.equal(a.weapon,'knife');assert.equal(a.ammo,0);
 m.startRound(3000);assert.equal(a.slot,1);assert.equal(a.weapon,'rifle');assert.equal(a.ammoByWeapon.glock,17);assert.equal(a.ammo,24);
});
test('Glock is semi-automatic, deals damage and reloads its own magazine',()=>{
 const {m,a,b}=match();m.tick(100,new Map([['a',{...idle,slot:2}]]));m.tick(1000,new Map([['a',{...idle,aim:true,fire:true}]]));assert.equal(b.hp,76);
 m.tick(1500,new Map([['a',{...idle,fire:true}]]));assert.equal(a.ammo,16);
 m.tick(1510,new Map([['a',idle]]));m.tick(1520,new Map([['a',{...idle,aim:true,fire:true}]]));assert.equal(b.hp,52);
 m.tick(1600,new Map([['a',{...idle,reload:true}]]));m.tick(2750,new Map());assert.equal(a.ammo,17);assert.equal(a.ammoByWeapon.rifle,24);
});
test('switch cancels reload without refilling or losing the stored magazine',()=>{
 const {m,a}=match();a.ammo=4;m.tick(1000,new Map([['a',{...idle,reload:true}]]));assert.ok(a.reloadAt);
 m.tick(1100,new Map([['a',{...idle,slot:2}]]));assert.equal(a.reloadAt,0);m.tick(3000,new Map([['a',{...idle,slot:1}]]));assert.equal(a.ammo,4);
});
test('knife only damages nearby targets and cannot stab through cover',()=>{
 const {m,a,b}=match();m.tick(100,new Map([['a',{...idle,slot:3}]]));m.tick(1000,new Map([['a',{...idle,fire:true}]]));assert.equal(b.hp,100);
 b.z=a.z-1.5;m.tick(1600,new Map([['a',{...idle,fire:true}]]));assert.equal(b.hp,45);assert.equal(a.ammo,0);
 m.tick(1700,new Map([['a',{...idle,fire:true,reload:true}]]));assert.equal(b.hp,45);assert.equal(a.reloadAt,0);
 const blocked=new Match();const x=blocked.add('x'),y=blocked.add('y');blocked.ready('x',0);blocked.ready('y',0);Object.assign(x,{x:17,z:0,yaw:-Math.PI/2});Object.assign(y,{x:19,z:0});assert.ok(hitDistance(x,y,empty)<1.8);blocked.tick(100,new Map([['x',{...idle,yaw:-Math.PI/2,slot:3}]]));blocked.tick(1000,new Map([['x',{...idle,yaw:-Math.PI/2,fire:true}]]));assert.equal(y.hp,100);
 m.tick(2200,new Map([['a',{...idle,fire:true}]]));assert.equal(b.hp,0);assert.equal(a.rounds,1);
});
test('knife speed, sprint and crouch are distinct and fixed-step prediction is deterministic',()=>{
 const walk=spawn(0),run=spawn(0),knife=spawn(0),duck=spawn(0);knife.weapon='knife';
 for(let n=0;n<40;n++){move(walk,{...idle,z:1},empty);move(run,{...idle,z:1,sprint:true},empty);move(knife,{...idle,z:1,sprint:true},empty);move(duck,{...idle,z:1,crouch:true},empty);}
 assert.ok(Math.abs(knife.vz)>Math.abs(run.vz)*1.2);assert.ok(Math.abs(run.vz)>Math.abs(walk.vz));assert.ok(Math.abs(duck.vz)<Math.abs(walk.vz));assert.equal(duck.stance,'crouching');assert.ok(eyeHeight(duck)<eyeHeight(walk));
 const a=spawn(0),b=spawn(0);for(let n=0;n<100;n++){const i={...idle,z:1,sprint:true,crouch:n>25};move(a,i,empty);move(b,i,empty);}assert.deepEqual(a,b);
});
test('slide requires sprint momentum, decays, cannot be held to retrigger and respects walls',()=>{
 const p=spawn(0);move(p,{...idle,crouch:true,sprint:true,z:1},empty);assert.notEqual(p.stance,'sliding');move(p,idle,empty);
 for(let n=0;n<25;n++)move(p,{...idle,z:1,sprint:true},empty);move(p,{...idle,z:1,sprint:true,crouch:true},empty);assert.equal(p.stance,'sliding');const speed=Math.abs(p.vz);assert.equal(bodyHeight(p),.8);
 for(let n=0;n<20;n++)move(p,{...idle,z:1,sprint:true,crouch:true},empty);assert.ok(Math.abs(p.vz)<speed);
 for(let n=0;n<120;n++)move(p,{...idle,z:1,sprint:true,crouch:true},empty);assert.equal(p.stance,'crouching');assert.equal(p.slideTicks,0);
 const q=spawn(0);Object.assign(q,{x:-14,z:-9,yaw:0});for(let n=0;n<25;n++)move(q,{...idle,z:1,sprint:true});move(q,{...idle,z:1,sprint:true,crouch:true});for(let n=0;n<100;n++)move(q,{...idle,z:1,crouch:true});assert.ok(q.z>=-13.151);
});
test('crouch changes hitbox and cannot stand up inside a ceiling',()=>{
 const a=spawn(0),b=spawn(0);Object.assign(a,{x:0,z:4,yaw:0});Object.assign(b,{x:0,z:0});assert.ok(Number.isFinite(hitDistance(a,b,empty)));move(b,{...idle,crouch:true},empty);assert.equal(hitDistance(a,b,empty),Infinity);
 const low={...empty,boxes:[...empty.boxes,{x:0,y:1.5,z:0,w:4,h:.5,d:4,color:0}]};move(b,idle,low);assert.equal(b.stance,'crouching');assert.equal(bodyHeight(b),1.05);b.x=4;move(b,idle,low);assert.equal(b.stance,'standing');
});
test('movement payload rejects invalid stance controls and weapon slots',()=>{for(const slot of [0,4,'2',NaN,{}])assert.equal(validInput({...idle,slot}),false);assert.equal(validInput({...idle,crouch:1}),false);assert.equal(validInput({...idle,slot:2,crouch:true}),true);assert.throws(()=>new Match().add('a','glock'));});
