import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const pages=await Promise.all([0,1,2].map(()=>browser.newPage()));
 for(const page of pages){
  await page.goto('http://127.0.0.1:5173/favicon.svg');
  await page.evaluate(async()=>{window.PeerGame=(await import('/client/peer-game.ts')).PeerGame;});
 }
 const [host,guest,third]=pages;
 async function start(page,type,code='',mapId='foundry'){
  await page.evaluate(({type,code,mapId})=>{
   window.game?.close();window.messages=[];window.game=new window.PeerGame();
   game.onmessage=e=>messages.push(JSON.parse(e.data));
   game.onopen=()=>game.send(JSON.stringify({type,code,mapId,weapon:'rifle'}));
  },{type,code,mapId});
 }
 const wait=(page,type)=>page.waitForFunction(type=>messages.some(m=>m.type===type),type,{timeout:30000});
 const send=(page,message)=>page.evaluate(m=>game.send(JSON.stringify(m)),message);
 await start(host,'create','','harbor');await wait(host,'joined');
 const code=await host.evaluate(()=>messages.find(m=>m.type==='joined').code);
 await start(guest,'join',code.toLowerCase());await wait(guest,'joined');
 assert.equal(await guest.evaluate(()=>messages.find(m=>m.type==='joined').mapId),'harbor');
 await start(third,'join',code);await wait(third,'error');
 assert.match(await third.evaluate(()=>messages.find(m=>m.type==='error').message),/voll/);
 await send(host,{type:'ready'});await send(guest,{type:'ready'});
 for(const page of [host,guest])await page.waitForFunction(()=>messages.some(m=>m.type==='state'&&m.phase==='playing'));
 await send(guest,{type:'ping',at:123});await wait(guest,'pong');
 const input={seq:1,x:1,z:0,yaw:0,pitch:0,jump:false,sprint:false,crouch:false,slot:2,aim:false,fire:false,reload:false};
 await send(guest,{type:'input',input});
 for(const page of [host,guest])await page.waitForFunction(()=>messages.some(m=>m.type==='state'&&m.players.some(p=>p.id==='guest'&&p.ack===1&&p.weapon==='glock')));
 await guest.evaluate(()=>game.close());await wait(host,'left');
 await start(third,'join',code);await wait(third,'joined');
 await host.evaluate(()=>game.close());await wait(third,'error');
 assert.match(await third.evaluate(()=>messages.find(m=>m.type==='error').message),/Host/);
 await start(guest,'join','bad');await wait(guest,'error');
 await start(guest,'join',code);await wait(guest,'error');
 assert.match(await guest.evaluate(()=>messages.find(m=>m.type==='error').message),/nicht gefunden/);
 console.log('PASS: real PeerJS signaling/WebRTC, room capacity, map replication, readiness, input/weapon replication, ping, guest replacement, host departure, invalid/missing rooms.');
}finally{await browser.close();}
