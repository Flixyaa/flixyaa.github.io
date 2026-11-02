import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPeerConfig,parseIceServers,hasRelay} from '../client/peer-config';

test('TURN config validates URLs and browser-scoped credentials',()=>{
 assert.throws(()=>parseIceServers([{urls:'https://example.com'}]));
 assert.throws(()=>parseIceServers([{urls:'turns:relay.example.com:443'}]));
 assert.equal(hasRelay({iceServers:parseIceServers([{urls:'stun:stun.example.com'}])}),false);
 assert.equal(hasRelay({iceServers:parseIceServers([{urls:['turns:relay.example.com:443?transport=tcp'],username:'test-user',credential:'test-only'}])}),true);
});

test('runtime relay config loads fresh credentials and rejects broken configured services',async()=>{
 const original=globalThis.fetch;const calls:string[]=[];
 try{
  globalThis.fetch=async(url,options)=>{
   calls.push(String(url));assert.equal(options?.cache,'no-store');assert.equal(options?.credentials,'omit');
   return new Response(JSON.stringify(calls.length===1?{credentialsUrl:'https://relay.example.com/credentials'}:[{urls:'turns:relay.example.com:443?transport=tcp',username:'test',credential:'test-only'}]));
  };
  assert.equal(hasRelay(await loadPeerConfig('/multiplayer.json')),true);assert.equal(calls.length,2);
  globalThis.fetch=async()=>new Response('',{status:404});
  assert.equal(hasRelay(await loadPeerConfig('/multiplayer.json')),false);
  globalThis.fetch=async()=>new Response('',{status:503});
  await assert.rejects(()=>loadPeerConfig('/multiplayer.json'),/TURN-CONFIG/);
 }finally{globalThis.fetch=original;}
});
