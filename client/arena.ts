import * as T from 'three';
import {maps,type MapId} from '../shared/maps';
import {concrete} from './materials';
import {batchArena} from './arena-details';
import {WorldKit,groundMaterial,paintedSurface} from './world-kit';
import {coverDetails} from './cover-detail';
import {surroundings,atmosphere} from './world-surroundings';

export function buildArena(id:MapId){
 const map=maps[id],root=new T.Scene(),kit=new WorldKit(root),animated:T.Object3D[]=[];
 let high=true;
 const wall=concrete('concrete_wall_003',1,1),stone=concrete('concrete_floor',1,1);
 wall.color.setHex(id==='quarry'?0xa69375:id==='reactor'?0xb9c8d0:0xa7a9a2);stone.color.setHex(0xc1a079);stone.normalScale.set(1,1);
 for(const mat of [wall,stone])for(const t of [mat.map,mat.normalMap,mat.roughnessMap])if(t)kit.textures.push(t);
 const ground=groundMaterial(id==='quarry'?'sand':id==='harbor'?'asphalt':'concrete',kit.textures);
 const outside=kit.box(root,[165,.1,165],[0,-.6,0],id==='quarry'?stone:ground);outside.castShadow=false;
 const coating=paintedSurface(kit.textures);const colors=new Map<number,T.Material>();
 for(const [i,b]of map.boxes.entries()){
  if(i<5){kit.box(root,[b.w,b.h,b.d],[b.x,b.y,b.z],i===0?ground:wall);continue;}
  if(!colors.has(b.color))colors.set(b.color,id==='quarry'?stone:new T.MeshStandardMaterial({color:b.color,roughness:id==='reactor'?.55:.72,metalness:.18,map:coating,bumpMap:coating,bumpScale:.008}));
  coverDetails(kit,id,b,i-5,colors.get(b.color)!,stone,animated);
 }
 surroundings(kit,map,wall,stone);
 const mark=new T.MeshStandardMaterial({color:id==='reactor'?0x80b9c6:0xcbb274,roughness:.9});
 // Painted routes, floor joints and drainage give empty lanes scale and direction.
 for(const side of [-1,1]){
  for(const z of [-2,2])kit.box(root,[4,.015,.09],[side*map.spawnX,.012,z],mark);
  for(let n=0;n<7;n++){const stripe=kit.box(root,[.28,.015,.7],[side*map.spawnX-1.8+n*.6,.013,-2.6],mark);stripe.rotation.y=.45;}
 }
 if(id!=='quarry'){
  for(let x=-map.width/2+4;x<map.width/2;x+=6)kit.box(root,[.018,.008,map.depth-1],[x,.006,0],kit.dark);
  for(let z=-map.depth/2+4;z<map.depth/2;z+=6)kit.box(root,[map.width-1,.008,.018],[0,.006,z],kit.dark);
  for(const z of [-map.depth*.35,map.depth*.35])for(let x=-map.width/2+4;x<map.width/2-3;x+=4)kit.box(root,[1.7,.012,.08],[x,.01,z],mark);
 }
 // Decals share one texture; keep alpha out of the opaque merge pass.
 const ao=document.createElement('canvas');ao.width=ao.height=128;const ac=ao.getContext('2d')!,gradient=ac.createRadialGradient(64,64,6,64,64,64);gradient.addColorStop(0,'#000b');gradient.addColorStop(1,'#0000');ac.fillStyle=gradient;ac.fillRect(0,0,128,128);const at=new T.CanvasTexture(ao);kit.textures.push(at);
 const shadow=new T.MeshBasicMaterial({map:at,transparent:true,depthWrite:false,opacity:.6});
 for(const b of map.boxes.slice(5)){const m=new T.Mesh(new T.PlaneGeometry(b.w+3,b.d+3),shadow);m.rotation.x=-Math.PI/2;m.position.set(b.x,.023,b.z);m.castShadow=false;root.add(m);}
 const details=new T.Group();details.name='optional-fine-details';details.userData.dynamic=true;root.add(details);
 const wet=new T.MeshPhysicalMaterial({color:0x354e5a,roughness:.19,metalness:.3,clearcoat:1,transparent:true,opacity:.48,depthWrite:false,envMapIntensity:1.4});
 const gravel=new T.MeshStandardMaterial({color:id==='quarry'?0x987e5b:0x6a6c66,roughness:1});
 const twig=new T.MeshStandardMaterial({color:0x77805b,roughness:1,side:T.DoubleSide});
 let seed=1207;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<70;i++){
  const x=(random()-.5)*(map.width-2),z=(random()-.5)*(map.depth-2);
  if(map.boxes.slice(5).some(b=>Math.abs(x-b.x)<b.w/2+.6&&Math.abs(z-b.z)<b.d/2+.6)||Math.abs(x-map.spawnX)<2&&Math.abs(z)<3||Math.abs(x+map.spawnX)<2&&Math.abs(z)<3)continue;
  if(id!=='quarry'&&i%7===0){const g=new T.CircleGeometry(.4+random()*.9,14);const p=g.attributes.position;for(let n=1;n<p.count;n++){const f=.75+random()*.4;p.setXY(n,p.getX(n)*f,p.getY(n)*f);}const m=new T.Mesh(g,wet);m.rotation.x=-Math.PI/2;m.scale.y=.45+random()*.3;m.position.set(x,.027,z);details.add(m);}
  else {const m=new T.Mesh(new T.DodecahedronGeometry(.025+random()*.07,0),gravel);m.position.set(x,.018,z);m.scale.set(1.5,.35,1);details.add(m);}
 }
 for(let i=0;i<40;i++){const side=i%2?1:-1,x=side*(map.width/2-.63),z=-map.depth/2+2+random()*(map.depth-4);for(let n=0;n<3;n++){const m=new T.Mesh(new T.PlaneGeometry(.08,.15+random()*.2),twig);m.position.set(x,.1,z);m.rotation.y=n*Math.PI/3;m.rotation.z=(random()-.5)*.6;details.add(m);}}
 kit.label(root,map.name,'RIFT OPERATIONS / RESTRICTED',8,2,[0,4.5,-map.depth/2+.52],0,id==='reactor'?'#9bdae8':'#dfd1ae');
 for(const side of [-1,1]){const label=kit.label(root,side<0?'A / ENTRY':'B / ENTRY','CAUTION / ACTIVE SECTOR',2.4,1,[side*(map.width/2-.52),2.4,0],side<0?Math.PI/2:-Math.PI/2);label.name='spawn-sign';}
 root.add(atmosphere(map));
 // Sparse dust motes stay translucent and cannot hide opponents.
 const particleGeometry=new T.BufferGeometry(),positions=new Float32Array(96*3);for(let i=0;i<96;i++){positions[i*3]=(random()-.5)*map.width;positions[i*3+1]=1+random()*7;positions[i*3+2]=(random()-.5)*map.depth;}particleGeometry.setAttribute('position',new T.BufferAttribute(positions,3));const dust=new T.Points(particleGeometry,new T.PointsMaterial({color:id==='quarry'?0xe8c99b:0xd8e5e5,size:.045,transparent:true,opacity:.22,depthWrite:false}));dust.userData.dynamic=true;details.add(dust);
 animated.forEach(o=>o.userData.dynamic=true);
 batchArena(root);
 return {root,setQuality(value:boolean){high=value;details.visible=value;},update(now:number){if(!high)return;for(const fan of animated)fan.rotation.y=now*.003;dust.position.y=Math.sin(now*.0002)*.16;},dispose(){const materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const m of [kit.steel,kit.dark,kit.rust,kit.rubber,kit.paint,kit.glass,kit.lamp,wall,stone,wet,gravel,twig])materials.add(m);materials.forEach(m=>m.dispose());kit.textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
