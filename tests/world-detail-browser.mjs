import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],failed=[];
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.url().includes('/materials/')&&r.status()!==200)failed.push(r.url());});
 await page.goto(process.env.TEST_URL||'http://localhost:5173');await page.click('summary');await page.selectOption('#quality','high');await page.click('summary');
 const timings=[];
 for(const id of ['foundry','harbor','quarry','reactor']){
  await page.click(`[data-map="${id}"]`);await page.selectOption('#difficulty','easy');await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(700);
  const frames=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();const sample=now=>{samples.push(now-last);last=now;if(samples.length===60)resolve(samples.sort((a,b)=>a-b));else requestAnimationFrame(sample);};requestAnimationFrame(sample);}));
  timings.push({map:id,medianMs:Math.round(frames[30]*10)/10,p95Ms:Math.round(frames[57]*10)/10});
  await page.screenshot({path:`detail-${id}.png`});await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:240,movementY:-80})));await page.waitForTimeout(150);await page.screenshot({path:`detail-${id}-side.png`});
  await page.mouse.down();await page.waitForTimeout(180);await page.mouse.up();await page.keyboard.press('KeyR');await page.waitForTimeout(1500);
  await page.evaluate(()=>document.exitPointerLock());await page.click('summary');await page.selectOption('#quality','performance');await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(300);await page.evaluate(()=>document.exitPointerLock());await page.selectOption('#quality','high');await page.click('summary');await page.click('#leave');
 }
 // Exercise disposal and reconstruction after several full matches and quality toggles.
 for(let i=0;i<8;i++)await page.click(`[data-map="${['reactor','quarry','harbor','foundry'][i%4]}"]`);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify(timings));console.log('PASS: four detailed worlds, shooting/reload, both quality modes, repeated map disposal, no shader/WebGL errors or failed textures');
}finally{await browser.close();}
