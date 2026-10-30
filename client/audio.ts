import type {WeaponId} from '../shared/weapons';
const noiseCache=new WeakMap<AudioContext,AudioBuffer>();
export function gunshot(audio:AudioContext|undefined,id:WeaponId,volume:number,distant:boolean){
 if(!audio||audio.state!=='running'||volume<=0)return;const now=audio.currentTime,heavy=id==='marksman',duration=heavy?.32:.16;
 let buffer=noiseCache.get(audio);if(!buffer){buffer=audio.createBuffer(1,audio.sampleRate*.4,audio.sampleRate);const a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;noiseCache.set(audio,buffer);}
 const noise=audio.createBufferSource();noise.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=distant?1100:heavy?4200:6500;const gain=audio.createGain();gain.gain.setValueAtTime(volume*(distant?.12:.32),now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);noise.connect(filter).connect(gain).connect(audio.destination);noise.start(now);noise.stop(now+duration);
 const body=audio.createOscillator(),low=audio.createGain();body.type='triangle';body.frequency.setValueAtTime(heavy?120:180,now);body.frequency.exponentialRampToValueAtTime(42,now+.12);low.gain.setValueAtTime(volume*(distant?.08:.28),now);low.gain.exponentialRampToValueAtTime(.0001,now+.16);body.connect(low).connect(audio.destination);body.start(now);body.stop(now+.18);
}
