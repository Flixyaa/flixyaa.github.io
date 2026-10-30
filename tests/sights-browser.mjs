import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://localhost:5173');
 for(const id of ['rifle','smg','marksman']){
  await page.click(`[data-weapon="${id}"]`);await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.mouse.down({button:'right'});await page.waitForTimeout(450);
  await page.locator(id==='marksman'?'#scope':'#reflex').waitFor({state:'visible'});
  assert.equal(await page.locator('#cross').isVisible(),false);
  await page.screenshot({path:`sights-${id}.png`});
  // Releasing left click must not interrupt right-click aiming.
  await page.mouse.down({button:'left'});await page.waitForTimeout(100);await page.mouse.up({button:'left'});
  assert.equal(await page.locator(id==='marksman'?'#scope':'#reflex').isVisible(),true);
  await page.keyboard.press('KeyR');await page.waitForTimeout(100);assert.equal(await page.locator(id==='marksman'?'#scope':'#reflex').isVisible(),false);
  await page.waitForTimeout(2000);await page.locator(id==='marksman'?'#scope':'#reflex').waitFor({state:'visible'});
  await page.mouse.up({button:'right'});await page.waitForTimeout(300);assert.equal(await page.locator('#scope').isVisible(),false);assert.equal(await page.locator('#reflex').isVisible(),false);
  await page.screenshot({path:`hip-${id}.png`});
  await page.evaluate(()=>document.exitPointerLock());await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#armory').hidden);
 }
 assert.deepEqual(errors,[]);console.log('PASS: all three ADS views, fire while aiming, reload, release, pointer lock and no browser errors');
}finally{await browser.close();}
