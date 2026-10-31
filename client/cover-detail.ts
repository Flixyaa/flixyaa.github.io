import * as T from 'three';
import {WorldKit} from './world-kit';
import type {Box} from '../shared/game';
import type {MapId} from '../shared/maps';

export function coverDetails(k:WorldKit,id:MapId,b:Box,index:number,material:T.Material,rock:T.Material,animated:T.Object3D[]){
 const g=k.group(b.x,0,b.z),w=b.w,d=b.d,h=b.h;
 k.box(g,[w,h,d],[0,h/2,0],material);
 if(id==='quarry'){
  // Cut stone strata follow the exact solid cover volume; no hollow collision shells.
  const seam=new T.MeshStandardMaterial({color:index%2?0x735941:0x8a6b4a,roughness:1});
  for(let y=.35;y<h;y+=.55){const rise=Math.sin(y*5+index)*.035;k.box(g,[w+.012,.025,d+.012],[0,y+rise,0],seam);}
  for(const side of [-1,1])for(let x=-w/2+.6;x<w/2;x+=1.4){const crack=k.box(g,[.018,h*.65,.012],[x,h*.5,side*(d/2+.008)],seam);crack.rotation.z=Math.sin(x+index)*.06;}
  // Broad, fractured caps break up the flat silhouette without obscuring travel lanes.
  if(h>=3){for(let n=0;n<5;n++){const r=.32+(n%3)*.15;const m=new T.Mesh(new T.DodecahedronGeometry(r,0),rock);m.position.set(-w*.35+n*w*.17,h+r*.25,Math.sin(n*3+index)*d*.25);m.scale.set(1.4,.55,1);m.rotation.y=n;g.add(m);m.castShadow=true;}}
  if(h<2){for(const side of [-1,1])k.box(g,[.09,h+.02,d+.02],[side*w*.3,h/2,0],k.rust);}
  if(index<3)k.label(g,'BLAST ZONE','BENCH 04 / KEEP CLEAR',Math.min(2,w*.6),.8,[0,Math.min(1.7,h*.6),d/2+.025],0,'#eccb89');
  return;
 }
 if(id==='harbor'){
  // ISO container corner castings, corrugation, double doors and locking bars.
  for(const x of [-w/2+.055,w/2-.055])for(const z of [-d/2+.055,d/2-.055]){
   k.box(g,[.15,h,.15],[x,h/2,z],k.steel);for(const y of [.1,h-.1])k.box(g,[.22,.20,.22],[x,y,z],k.dark);
  }
  for(const z of [-d/2-.018,d/2+.018])for(let x=-w/2+.25;x<w/2-.15;x+=.3)k.box(g,[.055,h-.3,.035],[x,h/2,z],material);
  for(const x of [-w/2-.018,w/2+.018])for(let z=-d/2+.25;z<d/2-.15;z+=.3)k.box(g,[.035,h-.3,.055],[x,h/2,z],material);
  for(const y of [.08,h-.08])k.box(g,[w,.12,d+.04],[0,y,0],k.dark);
  for(const side of [-1,1]){
   const door=k.group(b.x+side*(w/2+.05),0,b.z,side*Math.PI/2);
   k.box(door,[d-.28,h-.28,.035],[0,h/2,0],material);k.box(door,[.045,h-.25,.055],[0,h/2,.025],k.dark);
   for(const x of [-d*.27,-d*.11,d*.11,d*.27]){k.pipe(door,[x,.22,.065],[x,h-.22,.065],.024);k.box(door,[.22,.045,.05],[x,.85,.08],k.steel);for(const y of [.4,h-.4])k.box(door,[.1,.1,.055],[x,y,.08],k.steel);}
   if(d>4)k.label(door,index%2?'MERIDIAN':'MRCU 708','MAX GROSS 30 480 KG',Math.min(2.8,d*.35),.65,[d*.23,h-.65,.1],0,'#dddac1');
  }
  return;
 }
 if(id==='foundry'){
  // Factory equipment: riveted shell, louvres, service hatch and heat exchanger.
  for(const x of [-w/2+.08,w/2-.08])k.box(g,[.18,h+.12,d+.06],[x,h/2,0],k.dark);
  for(const y of [.12,h-.12])k.box(g,[w,.2,d+.04],[0,y,0],k.steel);
  for(const side of [-1,1]){
   const face=k.group(b.x+side*(w/2+.025),0,b.z,side*Math.PI/2);
   if(h>2){k.vent(face,0,h*.58,.025,Math.min(d-1,3),h*.36);k.box(face,[Math.min(1.1,d*.3),.6,.045],[0,.58,.04],k.dark);k.label(face,'SERVICE','HIGH VOLTAGE',.6,.28,[0,.58,.07]);}
   for(let z=-d/2+.25;z<d/2;z+=.65)for(const y of [.25,h-.25])k.cylinder(face,.035,.035,[z,y,.05],k.steel).rotation.x=Math.PI/2;
  }
  if(h>=3){
   for(const z of [-d*.25,d*.25]){k.cylinder(g,Math.min(w*.24,.8),.6,[0,h+.3,z],k.dark);const r=k.ring(g,Math.min(w*.24,.8),.055,[0,h+.61,z],k.steel);r.rotation.x=Math.PI/2;
    const fan=new T.Group();fan.name='animated-fan';fan.position.set(0,h+.62,z);g.add(fan);for(let i=0;i<4;i++){const blade=k.box(fan,[w*.18,.035,.16],[w*.1,0,0],k.steel);blade.rotation.y=i*Math.PI/2;blade.position.set(Math.cos(i*Math.PI/2)*w*.1,0,Math.sin(i*Math.PI/2)*w*.1);}animated.push(fan);}
   for(const side of [-1,1])k.pipe(g,[side*w*.35,h+.25,-d*.4],[side*w*.35,h+.25,d*.4],.13,k.rust);
  }else{k.crate(g,0,0,0,w-.08,h-.03,d-.08,material);}
  return;
 }
 // Reactor housings: distinct architectural facade rather than corrugated containers.
 for(const side of [-1,1]){
  const face=k.group(b.x+side*(w/2+.03),0,b.z,side*Math.PI/2);
  for(let x=-d/2+.5;x<d/2;x+=1.5){k.box(face,[.045,h,.04],[x,h/2,0],k.dark);if(h>2){k.box(face,[1.12,.7,.04],[x+.5,h-.8,.025],k.glass);k.box(face,[1.2,.06,.06],[x+.5,h-.42,.04],k.steel);}}
  if(h>2){k.box(face,[1.15,2,.055],[0,1,.04],k.dark);k.box(face,[.025,1.7,.06],[0,1,.08],k.steel);k.box(face,[.08,.25,.075],[.35,1,.1],k.steel);k.label(face,'09 / CORE','AUTHORIZED ACCESS',1.4,.5,[0,2.4,.08],0,'#85d8e9');k.vent(face,d*.32,.7,.04,.7,.7);}
 }
 k.box(g,[w+.08,.18,d+.08],[0,h-.09,0],k.steel);
 if(h>=4){k.box(g,[w*.55,1,d*.6],[0,h+.5,0],k.dark);for(let z=-d*.25;z<=d*.25;z+=.6)k.box(g,[w*.5,.07,.16],[0,h+1.04,z],k.steel);for(const side of [-1,1])k.railing(g,[side*w*.44,h,-d*.43],[side*w*.44,h,d*.43]);}
}
