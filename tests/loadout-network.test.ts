import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {WebSocket} from 'ws';
test('WebSocket state replicates secondary, knife, crouch and slide to the opponent',{timeout:15000},async()=>{
 const proc=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'3103'},stdio:['ignore','pipe','pipe']}),sockets:WebSocket[]=[];
 try{
  await new Promise<void>((r,j)=>{proc.stdout.once('data',()=>r());proc.once('error',j);proc.once('exit',c=>j(Error('Server exit '+c)));});
  async function client(){const ws=new WebSocket('ws://127.0.0.1:3103/ws');sockets.push(ws);const messages:any[]=[];ws.on('message',data=>messages.push(JSON.parse(data.toString())));await new Promise<void>(r=>ws.once('open',r));return {send:(m:unknown)=>ws.send(JSON.stringify(m)),wait:async(fn:(m:any)=>boolean)=>{const end=Date.now()+4000;while(Date.now()<end){const i=messages.findIndex(fn);if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}throw Error('State timeout');}};}
  const a=await client(),b=await client(),hello=await a.wait(m=>m.type==='hello');a.send({type:'create',mapId:'quarry',weapon:'smg'});const room=await a.wait(m=>m.type==='joined');b.send({type:'join',code:room.code});await b.wait(m=>m.type==='joined');a.send({type:'ready'});b.send({type:'ready'});await a.wait(m=>m.type==='state'&&m.phase==='playing');
  let seq=0;const input=(extra={})=>a.send({type:'input',input:{seq:seq++,x:0,z:0,yaw:-Math.PI/2,pitch:0,jump:false,sprint:false,fire:false,reload:false,...extra}});
  const state=async(fn:(p:any)=>boolean)=>(await b.wait(m=>m.type==='state'&&m.players.some((p:any)=>p.id===hello.id&&fn(p)))).players.find((p:any)=>p.id===hello.id);
  input({slot:2,crouch:true});const duck=await state(p=>p.weapon==='glock'&&p.stance==='crouching');assert.equal(duck.ammo,17);assert.equal(duck.primary,'smg');
  await new Promise(r=>setTimeout(r,270));input({slot:3});await state(p=>p.weapon==='knife');await new Promise(r=>setTimeout(r,270));
  for(let n=0;n<28;n++){input({sprint:true,z:1});await new Promise(r=>setTimeout(r,17));}await state(p=>p.sprinting);
  input({sprint:true,z:1,crouch:true});const slide=await state(p=>p.stance==='sliding');assert.ok(slide.slideTicks>0);assert.ok(Math.hypot(slide.vx,slide.vz)>10);
  input({slot:8});assert.match((await a.wait(m=>m.type==='error')).message,/Eingabe/);
 }finally{sockets.forEach(ws=>ws.terminate());proc.kill();}
});
