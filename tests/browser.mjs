import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const errors=[];const a=await browser.newPage({viewport:{width:1280,height:800}}),b=await browser.newPage();
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await a.goto('http://localhost:5173');await b.goto('http://localhost:5173');
 await a.click('#create');await a.waitForFunction(()=>document.querySelector('#roomcode').textContent.length>5);
 const code=(await a.locator('#roomcode').textContent()).split(' ')[1];
 await b.fill('#code',code);await b.click('#join');await b.waitForFunction(()=>!document.querySelector('#room').hidden);
 await a.click('#ready');await b.click('#ready');await a.waitForFunction(()=>document.querySelector('#ready').hidden);
 await a.click('#play');await a.waitForFunction(()=>!!document.pointerLockElement);
 await a.keyboard.down('KeyW');await a.waitForTimeout(800);await a.keyboard.up('KeyW');
 await a.mouse.down();await a.waitForTimeout(350);await a.mouse.up();
 await a.screenshot({path:'browser-game.png'});
 assert.match(await a.locator('#stats').textContent(),/100 HP/);
 assert.ok(!(await a.locator('#stats').textContent()).includes('24 / 24'));
 await a.keyboard.press('Escape');await a.evaluate(()=>document.exitPointerLock());await a.waitForTimeout(100);
 await a.screenshot({path:'browser-menu.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: two browser clients, room join, ready, WebGL rendering, Pointer Lock, movement input, firing/ammo, pause; no page errors.');
}finally{await browser.close();}
