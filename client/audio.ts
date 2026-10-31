import type {WeaponId} from '../shared/weapons';
export const soundProfiles={
 smg:{duration:.17,bodyHz:185,bodyDecay:39,noiseDecay:49,noiseMix:.70,bassMix:.28,mechanical:.028,echo:0,seed:51},
 rifle:{duration:.38,bodyHz:132,bodyDecay:22,noiseDecay:29,noiseMix:.92,bassMix:.53,mechanical:.054,echo:.095,seed:149},
 marksman:{duration:.92,bodyHz:68,bodyDecay:9,noiseDecay:15,noiseMix:.80,bassMix:.85,mechanical:.11,echo:.18,seed:307}
,
 glock:{duration:.24,bodyHz:165,bodyDecay:31,noiseDecay:38,noiseMix:.78,bassMix:.38,mechanical:.04,echo:.075,seed:521},
 knife:{duration:.18,bodyHz:380,bodyDecay:28,noiseDecay:20,noiseMix:.3,bassMix:.015,mechanical:.09,echo:0,seed:731}
} as const;
/** Three original layered sound designs; deterministic variants avoid identical automatic bursts. */
export function synthesizeShot(id:WeaponId,sampleRate:number,variant=0){
 const p=soundProfiles[id],samples=new Float32Array(Math.ceil(sampleRate*p.duration));let state=p.seed+variant*7919,low=0,phase=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;state^=state<<13;state^=state>>>17;state^=state<<5;const white=(state>>>0)/2147483648-1;
  low+=((id==='smg'?.62:id==='rifle'?.32:.12))*(white-low);
  const attack=Math.min(1,t/.0007),pitch=p.bodyHz*(1+.75*Math.exp(-t*70));phase+=2*Math.PI*pitch/sampleRate;
  const crack=(id==='smg'?white-low*.45:id==='rifle'?white*.6+low*.6:low)*Math.exp(-t*p.noiseDecay)*p.noiseMix;
  const thump=(Math.sin(phase)+Math.sin(phase*.48)*.35)*Math.exp(-t*p.bodyDecay)*p.bassMix;
  const dt=t-p.mechanical,mechanism=dt>0?(Math.sin(dt*2*Math.PI*(id==='smg'?2300:1550))*.12+white*.2)*Math.exp(-dt*180):0;
  let tail=0;if(p.echo>0&&t>p.echo){const e=t-p.echo;tail=low*Math.exp(-e*(id==='marksman'?6:19))*(id==='marksman'?.38:.18);}
  const fade=Math.min(1,(p.duration-t)/.015);samples[i]=(id==='knife'?Math.sin(Math.PI*t/p.duration):1)*Math.tanh((crack+thump+mechanism+tail)*1.4)*.78*attack*fade;
 }
 return samples;
}
const cache=new WeakMap<AudioContext,Map<string,AudioBuffer>>();let variant=0;
export function gunshot(audio:AudioContext|undefined,id:WeaponId,volume:number,distant:boolean){
 if(!audio||audio.state!=='running'||volume<=0)return;
 let buffers=cache.get(audio);if(!buffers){buffers=new Map();cache.set(audio,buffers);}const key=id+variant;let buffer=buffers.get(key);
 if(!buffer){const samples=synthesizeShot(id,audio.sampleRate,variant);buffer=audio.createBuffer(1,samples.length,audio.sampleRate);buffer.copyToChannel(samples,0);buffers.set(key,buffer);}variant=(variant+1)%3;
 const source=audio.createBufferSource();source.buffer=buffer;const gain=audio.createGain();gain.gain.value=Math.max(0,Math.min(1,volume))*(distant?.19:.46);
 const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=distant?1700:17000;source.connect(filter).connect(gain).connect(audio.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
}
