import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
 await page.goto(process.env.TEST_URL||'http://localhost:5173');await page.evaluate(()=>localStorage.removeItem('rift-map'));await page.reload();
 assert.equal(await page.locator('[data-map]').count(),4);await page.screenshot({path:'maps-lobby.png'});
 for(const [map,name,weapon]of [['foundry','FOUNDRY 07','rifle'],['harbor','PORT MERIDIAN','smg'],['quarry','REDSTONE BASIN','marksman'],['reactor','REACTOR NINE','rifle']]){
  console.log('Testing',map,weapon);await page.click(`[data-map="${map}"]`);assert.equal(await page.locator(`[data-map="${map}"]`).getAttribute('aria-pressed'),'true');await page.click(`[data-weapon="${weapon}"]`);await page.selectOption('#difficulty','easy');await page.click('#bot');console.log(await page.locator('#status').textContent());await page.waitForFunction(()=>document.querySelector('#ready').hidden);await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);
  assert.match(await page.locator('.brand small').textContent(),new RegExp(name));await page.waitForTimeout(500);await page.screenshot({path:`map-${map}.png`});
  await page.mouse.down({button:'right'});const optic=weapon==='marksman'?'#scope':`#reflex .optic-${weapon}`;await page.locator(optic).waitFor({state:'visible'});await page.waitForTimeout(300);await page.screenshot({path:`optic-${weapon}-${map}.png`});assert.equal(await page.locator('#cross').isVisible(),false);
  await page.mouse.up({button:'right'});await page.locator(optic).waitFor({state:'hidden'});
  await page.evaluate(()=>document.exitPointerLock());await page.click('#leave');await page.locator('#map-select').waitFor({state:'visible'});assert.equal(await page.locator(`[data-map="${map}"]`).getAttribute('aria-pressed'),'true');
 }
 await page.reload();assert.equal(await page.locator('[data-map="reactor"]').getAttribute('aria-pressed'),'true');
 await page.click('summary');await page.selectOption('#quality','performance');await page.click('[data-map="quarry"]');await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);await page.click('#play');await page.waitForTimeout(500);await page.evaluate(()=>document.exitPointerLock());await page.click('#leave');
 await page.setViewportSize({width:1280,height:720});await page.screenshot({path:'maps-lobby-720.png'});assert.ok(await page.locator('#bot').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: four maps, persisted selection, all custom optics, bot transports, performance mode and no browser errors');
}finally{await browser.close();}

