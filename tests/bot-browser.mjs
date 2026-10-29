import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');
 assert.equal(await page.locator('#difficulty').inputValue(),'easy');
 for(const [value,label] of [['easy','LEICHT'],['medium','MITTEL']]){
 await page.selectOption('#difficulty',value);await page.click('#bot');
 await page.waitForFunction(label=>document.querySelector('#roomcode').textContent.includes(label),label);
 await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#home').hidden);
 }
 await page.selectOption('#difficulty','hard');await page.click('#bot');
 await page.waitForFunction(()=>document.querySelector('#roomcode').textContent.includes('BOT'));
 await page.waitForFunction(()=>document.querySelector('#ready').hidden);
 assert.equal(await page.locator('#copy').isVisible(),false);
 await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(()=>!document.querySelector('#stats').textContent.startsWith('100 HP'),{},{timeout:25000});
 await page.waitForFunction(()=>document.querySelector('#round-banner').textContent.includes('Runde verloren'),{},{timeout:20000});
 await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('Runde 2')&&document.querySelector('#stats').textContent.startsWith('100 HP'),{},{timeout:5000});
 await page.evaluate(()=>document.exitPointerLock());await page.click('#leave');
 await page.waitForFunction(()=>!document.querySelector('#home').hidden);
 await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);
 assert.deepEqual(errors,[]);console.log('PASS: bot menu, automatic start, pointer lock, bot damage, leave and new bot match.');
}finally{await browser.close();}
