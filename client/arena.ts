import * as T from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {maps,type MapId} from '../shared/maps';
import {concrete,finish} from './materials';
import {batchArena} from './arena-details';

export function buildArena(id:MapId){
 const map=maps[id],root=new T.Scene(),ownedTextures:T.Texture[]=[];
 const steel=finish(0x35454d),trim=finish(0x202c34),paint=finish(map.accent,'metal',.6);
 const glow=new T.MeshStandardMaterial({color:map.accent,emissive:map.accent,emissiveIntensity:2.1,roughness:.35});
 const wall=concrete('concrete_wall_003',4,2),floor=concrete('concrete_floor',map.width/4,map.depth/4);wall.color.setHex(map.ground);floor.color.setHex(id==='quarry'?0xc6b08a:0x9ba6ab);
 for(const mat of [wall,floor])for(const t of [mat.map,mat.normalMap,mat.roughnessMap])if(t)ownedTextures.push(t);
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 const colors=new Map<number,T.Material>();
 for(const [i,b]of map.boxes.entries()){
  let mat:T.Material=i===0?floor:wall;
  if(i>=5){if(!colors.has(b.color))colors.set(b.color,id==='quarry'?new T.MeshStandardMaterial({color:b.color,roughness:.96,normalMap:wall.normalMap,normalScale:new T.Vector2(1.3,1.3)}):finish(b.color,'metal',.62));mat=colors.get(b.color)!;}
  box(b.w,b.h,b.d,b.x,b.y,b.z,mat);
  if(i<5)continue;
  box(b.w+.08,.12,b.d+.08,b.x,b.h+.025,b.z,trim);
  for(const z of [b.z-b.d/2-.025,b.z+b.d/2+.025]){
   box(b.w*.65,.045,.028,b.x,b.h-.25,z,glow);
   if(id!=='quarry')for(let x=b.x-b.w/2+.35;x<b.x+b.w/2;x+=.55)box(.045,b.h-.3,.035,x,b.h/2,z,steel);
  }
  if(id!=='quarry')for(const x of [b.x-b.w/2-.025,b.x+b.w/2+.025]){
   for(let z=b.z-b.d/2+.35;z<b.z+b.d/2;z+=.55)box(.035,b.h-.3,.045,x,b.h/2,z,steel);
   box(.028,.045,b.d*.7,x,b.h-.25,b.z,glow);
  }
 }
 // Continuous edge lights, repeated structural bays and floor inlays.
 for(const side of [-1,1]){
  for(let z=-map.depth/2+3;z<map.depth/2;z+=6){box(.15,5,.28,side*(map.width/2-.6),2.5,z,trim);box(.18,.12,3.8,side*(map.width/2-.61),4.8,z,glow);}
  for(let x=-map.width/2+3;x<map.width/2;x+=6){box(.28,5,.15,x,2.5,side*(map.depth/2-.6),trim);box(3.8,.12,.18,x,4.8,side*(map.depth/2-.61),glow);}
  box(map.width-2,.018,.13,0,.012,side*(map.depth/2-2),paint);
  box(.13,.018,map.depth-2,side*(map.width/2-2),.012,0,paint);
  for(const z of [-2,2])box(4,.022,.11,side*map.spawnX,.018,z,paint);
  for(let n=0;n<7;n++){const stripe=box(.3,.025,.8,side*map.spawnX-1.8+n*.6,.02,-2.7,paint);stripe.rotation.y=.45;}
 }
 // Inlaid guide lines and a numbered plate make the three lanes easy to identify.
 for(const z of [-map.depth*.34,map.depth*.34])for(let x=-map.width/2+4;x<map.width/2-3;x+=4)box(1.8,.014,.08,x,.02,z,paint);
 const plate=document.createElement('canvas');plate.width=512;plate.height=256;const pc=plate.getContext('2d')!;pc.fillStyle='#182d36';pc.fillRect(0,0,512,256);pc.fillStyle='#'+map.accent.toString(16).padStart(6,'0');pc.fillRect(20,20,12,216);pc.font='bold 80px Arial';pc.fillText(id==='quarry'?'CAUTION':id==='reactor'?'CORE 09':'CARGO',55,112);pc.font='24px monospace';pc.fillText('RIFT / '+map.id.toUpperCase(),55,168);pc.font='16px monospace';pc.fillText('KEEP CLEAR     //     01 — 08',55,212);const pt=new T.CanvasTexture(plate);pt.colorSpace=T.SRGBColorSpace;ownedTextures.push(pt);const pm=new T.MeshStandardMaterial({map:pt,roughness:.8});
 for(const b of map.boxes.slice(5,8))for(const side of [-1,1]){const label=new T.Mesh(new T.PlaneGeometry(Math.min(2.6,b.d*.55),1.3),pm);label.rotation.y=side*Math.PI/2;label.position.set(b.x+side*(b.w/2+.05),Math.min(2,b.h*.6),b.z);root.add(label);}
 // Soft contact shadows, drawn once per map and shared by cover decals.
 const ao=document.createElement('canvas');ao.width=ao.height=128;const ac=ao.getContext('2d')!,g=ac.createRadialGradient(64,64,12,64,64,64);g.addColorStop(0,'#000b');g.addColorStop(1,'#0000');ac.fillStyle=g;ac.fillRect(0,0,128,128);const at=new T.CanvasTexture(ao);ownedTextures.push(at);
 const shadow=new T.MeshBasicMaterial({map:at,transparent:true,depthWrite:false,opacity:.65});
 for(const b of map.boxes.slice(5)){const o=new T.Mesh(new T.PlaneGeometry(b.w+3,b.d+3),shadow);o.rotation.x=-Math.PI/2;o.position.set(b.x,.025,b.z);root.add(o);}
 const sign=document.createElement('canvas');sign.width=1024;sign.height=256;const ctx=sign.getContext('2d')!;ctx.fillStyle='#142832';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#'+map.accent.toString(16).padStart(6,'0');ctx.fillRect(0,0,18,256);ctx.font='bold 84px Arial';ctx.fillText(map.name,55,125);ctx.font='24px Arial';ctx.fillText('RIFT OPERATIONS   /   SECTOR '+(Object.keys(maps).indexOf(id)+7)+'   /   RESTRICTED',58,191);const st=new T.CanvasTexture(sign);st.colorSpace=T.SRGBColorSpace;ownedTextures.push(st);const board=new T.Mesh(new T.PlaneGeometry(10,2.5),new T.MeshStandardMaterial({map:st,emissiveMap:st,emissive:0xffffff,emissiveIntensity:.25}));board.position.set(0,4.2,-map.depth/2+.52);root.add(board);
 // Landmarks are outside the collision perimeter; playable cover always matches physics.
 if(id==='harbor'){
  for(const side of [-1,1]){const x=side*(map.width/2+5);box(1,22,1,x,11,-7,paint);box(15,.8,1,x-side*5,21,-7,paint);box(.08,12,.08,x-side*11,15,-7,steel);box(3,.5,3,x-side*11,9,-7,trim);}
  for(let n=0;n<7;n++)box(7,3.5,3,-24+n*8,1.75,map.depth/2+6,colors.values().next().value||steel);
 }else if(id==='quarry'){
  for(let n=0;n<20;n++){const angle=n*Math.PI/10,r=48+(n%3)*4;const rock=new T.Mesh(new T.DodecahedronGeometry(6+(n%4),0),new T.MeshStandardMaterial({color:n%2?0x9c8365:0xb09a78,roughness:1}));rock.position.set(Math.cos(angle)*r,2,Math.sin(angle)*r);rock.scale.y=1.2+(n%3)*.4;rock.rotation.set(n*.7,n*.4,0);rock.castShadow=true;root.add(rock);}
  box(1,18,1,-map.width/2-4,9,6,paint);box(18,.8,1,-map.width/2+3,18,6,paint);
 }else if(id==='reactor'){
  for(const side of [-1,1])for(const z of [-16,16]){const x=side*(map.width/2+7),tank=new T.Mesh(new T.CylinderGeometry(3,4,18,20),steel);tank.position.set(x,9,z);tank.castShadow=true;root.add(tank);for(const y of [4,10,16]){const band=new T.Mesh(new T.TorusGeometry(3.8-(y/18),.12,6,32),glow);band.rotation.x=Math.PI/2;band.position.set(x,y,z);root.add(band);}}
  for(const z of [-17,17]){box(map.width,.35,.4,0,8,z,trim);box(map.width-.5,.08,.12,0,7.8,z,glow);}
 }else{
  for(const z of [-10,0,10])box(map.width,.3,.3,0,6.5,z,steel);
  for(let i=0;i<12;i++)box(4,8+i%4*2,5,-28+i*5,4+i%4,-map.depth/2-12,steel);
 }
 const sky=new Sky();sky.scale.setScalar(200);sky.material.uniforms.turbidity.value=id==='quarry'?6:3;sky.material.uniforms.rayleigh.value=id==='reactor'?2.5:1.4;sky.material.uniforms.sunPosition.value.set(-30,id==='harbor'?8:id==='reactor'?3:35,20);root.add(sky);
 batchArena(root);
 return {root,dispose(){const materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});materials.forEach(m=>m.dispose());ownedTextures.forEach(t=>t.dispose());root.removeFromParent();}};
}
