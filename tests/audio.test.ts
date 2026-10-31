import {test} from 'node:test';import assert from 'node:assert/strict';
import {synthesizeShot,soundProfiles} from '../client/audio.js';
import type {WeaponId} from '../shared/weapons.js';
test('each weapon has a distinct finite, bounded sound with a clean tail',()=>{const durations:number[]=[],crossings:number[]=[];for(const id of ['smg','rifle','marksman'] as WeaponId[]){const samples=synthesizeShot(id,48000);assert.equal(samples.length,Math.ceil(soundProfiles[id].duration*48000));assert.ok(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=.79));assert.equal(Math.abs(samples[0]),0);assert.ok(Math.abs(samples.at(-1)!)<.001);assert.ok(samples.some(x=>Math.abs(x)>.2));durations.push(samples.length);let count=0;for(let n=1;n<4800;n++)if(samples[n]*samples[n-1]<0)count++;crossings.push(count);assert.notDeepEqual(samples,synthesizeShot(id,48000,1));}assert.ok(durations[0]<durations[1]&&durations[1]<durations[2]);assert.ok(crossings[0]>crossings[2]);});

