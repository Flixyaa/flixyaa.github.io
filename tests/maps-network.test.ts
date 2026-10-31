import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {WebSocket} from 'ws';
test('room owner chooses map, joining client inherits it, other rooms remain independent',{timeout:15000},async()=>{
 const proc=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'3102'},stdio:['ignore','pipe','pipe']}),sockets:WebSocket[]=[];
 try{
  await new Promise<void>((r,j)=>{proc.stdout.once('data',()=>r());proc.once('error',j);proc.once('exit',c=>j(Error('Server exit '+c)));});
  async function client(){const ws=new WebSocket('ws://127.0.0.1:3102/ws');sockets.push(ws);const messages:any[]=[];ws.on('message',data=>messages.push(JSON.parse(data.toString())));await new Promise<void>(r=>ws.once('open',r));return {send:(m:unknown)=>ws.send(JSON.stringify(m)),wait:async(type:string)=>{const end=Date.now()+3000;while(Date.now()<end){const i=messages.findIndex(m=>m.type===type);if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}throw Error('Timeout '+type);}};}
  const a=await client(),b=await client(),c=await client();a.send({type:'create',mapId:'quarry'});const room=await a.wait('joined');assert.equal(room.mapId,'quarry');b.send({type:'join',code:room.code,mapId:'foundry'});assert.equal((await b.wait('joined')).mapId,'quarry');c.send({type:'create',mapId:'invalid'});assert.match((await c.wait('error')).message,/Map/);c.send({type:'create',mapId:'harbor'});assert.equal((await c.wait('joined')).mapId,'harbor');
  const state=await b.wait('state');assert.equal(state.mapId,'quarry');assert.deepEqual(state.players.map((p:any)=>p.x),[-30,30]);assert.equal((await c.wait('state')).mapId,'harbor');
 }finally{sockets.forEach(ws=>ws.terminate());proc.kill();}
});
