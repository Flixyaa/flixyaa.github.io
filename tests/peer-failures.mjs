import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.RIFT_TEST_URL||'http://127.0.0.1:5173/';
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Accept the socket locally without forwarding to simulate a silent network drop.
 await page.routeWebSocket(/peerjs\.com/,()=>{});
 await page.goto(base);await page.click('#create');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Raumdienst'));
 assert.equal(await page.locator('#create').isDisabled(),true);
 await page.click('#cancel-connect');assert.match(await page.locator('#status').textContent(),/abgebrochen/);
 assert.equal(await page.locator('#create').isEnabled(),true);
 await page.click('#create');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('SIGNAL-TIMEOUT'),null,{timeout:18000});
 assert.equal(await page.locator('#create').isEnabled(),true);
 await page.evaluate(()=>{window.RTCPeerConnection=undefined;});await page.click('#create');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('WebRTC ist'));
 assert.equal(await page.locator('#join').isEnabled(),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: silent signaling timeout, cancel/retry, disabled duplicate attempts, missing WebRTC, no uncaught errors.');
}finally{await browser.close();}
