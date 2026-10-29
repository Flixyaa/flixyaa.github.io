import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.message);});await page.goto(process.env.TEST_URL||'http://localhost:5173');
 await page.waitForSelector('[data-weapon="smg"]');await page.screenshot({path:'armory-lobby.png'});
 for(const [id,name,mag]of [['smg','VX-9 Vector',32],['marksman','MR-8 Longshot',8],['rifle','AR-24 Sentinel',24]]){
 console.log('Testing',id);await page.click(`[data-weapon="${id}"]`);assert.match(await page.locator('#weapon-info').textContent(),new RegExp(name));await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);await page.click('#play');await page.waitForTimeout(300);console.log(await page.locator('#status').textContent());await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(name=>document.querySelector('#stats').textContent.includes(name),name);assert.ok((await page.locator('#stats').textContent()).includes(`${mag} / ${mag}`));
 await page.mouse.down();await page.waitForTimeout(300);await page.mouse.up();assert.ok(!(await page.locator('#stats').textContent()).includes(`${mag} / ${mag}`));await page.screenshot({path:`armory-${id}.png`});await page.keyboard.press('KeyR');await page.waitForTimeout(2100);assert.ok((await page.locator('#stats').textContent()).includes(`${mag} / ${mag}`));
 await page.evaluate(()=>document.exitPointerLock());await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#armory').hidden);await page.waitForTimeout(1500);
 }
 assert.deepEqual(errors,[]);console.log('PASS: lobby, 3 weapon previews, magazine/damage transport, fire, reload and return to lobby.');
}finally{await browser.close();}
