import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://flixyaa.github.io/',{waitUntil:'networkidle'});
 await page.waitForSelector('#bot',{timeout:10000});assert.equal(await page.title(),'RIFT DUEL');
 await page.selectOption('#difficulty','hard');await page.click('#bot');await page.waitForFunction(()=>document.querySelector('#ready').hidden);
 await page.click('#play');await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(()=>document.querySelector('#round-banner').textContent.includes('Runde verloren'),{},{timeout:25000});
 await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('Runde 2'),{},{timeout:5000});
 assert.deepEqual(errors,[]);await page.screenshot({path:'published-game.png'});console.log('PASS: public HTTPS site, local bot, pointer lock, damage and round 2; no browser errors.');
}finally{await browser.close();}
