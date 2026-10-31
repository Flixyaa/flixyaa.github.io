import * as T from 'three';
import {WorldKit} from './world-kit';
import type {Arena} from '../shared/maps';

export function surroundings(k:WorldKit,map:Arena,wall:T.Material,rock:T.Material){
 const {width:w,depth:d,id}=map;
 // Architectural perimeter: pilasters, utility cabinets, capping and cable runs.
 for(const side of [-1,1]){
  for(let z=-d/2+2;z<d/2;z+=5){const g=k.group(side*(w/2-.48),0,z,side<0?Math.PI/2:-Math.PI/2);
   k.box(g,[.28,6.4,.14],[0,3.2,0],k.steel);k.box(g,[1.15,.08,.2],[0,4.7,.12],k.dark);k.box(g,[.9,.035,.22],[0,4.65,.13],k.lamp);
   if(id!=='quarry'){k.box(g,[.65,.8,.1],[0,1.45,.08],k.dark);for(let n=0;n<4;n++)k.box(g,[.43,.025,.12],[0,1.22+n*.1,.12],k.steel);}
  }
  k.box(k.root,[.25,.18,d+.4],[side*w/2,6.1,0],k.steel);
  k.box(k.root,[w+.4,.18,.25],[0,6.1,side*d/2],k.steel);
  for(let x=-w/2+2;x<w/2;x+=5){k.box(k.root,[.28,6.4,.15],[x,3.2,side*(d/2-.48)],k.steel);}
  // Drainage grates are flush with the walkable floor.
  k.box(k.root,[.32,.01,d-3],[side*(w/2-1.1),.014,0],k.dark);
  for(let z=-d/2+2;z<d/2-2;z+=.3)k.box(k.root,[.32,.012,.035],[side*(w/2-1.1),.024,z],k.steel);
 }
 if(id==='harbor'){
  // Two fully braced gantry cranes frame the playable container yard.
  for(const side of [-1,1]){const g=k.group(side*(w/2+8),0,-4);for(const z of [-7,7]){
   for(const x of [-2,2]){k.box(g,[.65,23,.65],[x,11.5,z],k.paint);k.box(g,[2,.65,2],[x,.35,z],k.dark);}
   for(let y=1;y<21;y+=4){k.pipe(g,[-2,y,z],[2,y+4,z],.1,k.paint);k.pipe(g,[2,y,z],[-2,y+4,z],.1,k.paint);}
  }
  k.box(g,[24,.75,2],[side*-7,23,0],k.paint);k.box(g,[5,1.5,4],[0,23,0],k.dark);k.box(g,[2.2,2,2.2],[side*-3,21.7,0],k.glass);
  for(let n=0;n<10;n++){k.pipe(g,[-16+n*3,23,-.7],[-13+n*3,25,.7],.07,k.paint);}
  for(const z of [-.7,.7])k.pipe(g,[side*-14,23,z],[side*-14,12,z],.035,k.dark);k.box(g,[3.5,.3,2.8],[side*-14,12,0],k.steel);
  }
  // Container stacks and a dockside ship silhouette beyond the perimeter.
  const cargo=[0x945d43,0x496c79,0x667359].map(color=>new T.MeshStandardMaterial({color,roughness:.8,metalness:.12}));
  for(let row=0;row<2;row++)for(let n=0;n<7;n++){const x=-28+n*9,z=d/2+6+row*7,levels=1+(n+row)%3;for(let y=0;y<levels;y++){k.crate(k.root,x,y*3,z,8,2.9,5,cargo[(n+y)%3]);}}
  const hull=new T.MeshStandardMaterial({color:0x294653,roughness:.6});k.box(k.root,[55,6,10],[0,1,-d/2-23],hull);k.box(k.root,[10,10,8],[18,8,-d/2-23],wall);k.box(k.root,[9,1.8,7],[18,12,-d/2-22.9],k.glass);k.pipe(k.root,[18,13,-d/2-23],[18,24,-d/2-23],.09,k.steel);
 }else if(id==='quarry'){
  // Terraced cut faces, silhouettes and a belt conveyor in the extraction pit.
  for(let n=0;n<24;n++){const angle=n*Math.PI/12,r=48+(n%3)*4,g=k.group(Math.cos(angle)*r,0,Math.sin(angle)*r,angle);
   for(let layer=0;layer<3;layer++){const mesh=new T.Mesh(new T.DodecahedronGeometry(6+n%4,1),rock);mesh.scale.set(1.4,.55,1.2);mesh.position.set(layer*.4,2+layer*4,0);mesh.rotation.y=n*.7;mesh.castShadow=true;g.add(mesh);}
  }
  const g=k.group(-w/2-9,0,0);k.box(g,[4,2,30],[0,10,0],k.dark);for(const x of [-2.1,2.1]){k.box(g,[.15,.4,32],[x,11,0],k.paint);for(const z of [-12,-4,4,12]){k.pipe(g,[x,0,z],[x,10,z],.12,k.steel);k.pipe(g,[x,0,z],[x,10,z+4],.07,k.steel);}}
  for(let z=-14;z<15;z+=1.5){const roller=k.cylinder(g,.15,3.8,[0,11,z],k.steel);roller.rotation.z=Math.PI/2;}
  k.box(g,[9,6,8],[0,12,-18],wall);k.label(g,'REDSTONE','AGGREGATE PROCESSING',6,2,[4.55,13,-18],Math.PI/2,'#f0c480');
 }else if(id==='reactor'){
  for(const side of [-1,1])for(const z of [-18,18]){
   const g=k.group(side*(w/2+9),0,z),points=[];for(let n=0;n<=16;n++){const y=n/16*26,r=4.5-2*Math.sin(n/16*Math.PI*.8);points.push(new T.Vector2(r,y));}
   const tower=new T.Mesh(new T.LatheGeometry(points,32),wall);tower.castShadow=true;g.add(tower);for(const y of [4,12,22]){const ring=k.ring(g,4.5-2*Math.sin(y/26*Math.PI*.8)+.05,.1,[0,y,0],k.steel);ring.rotation.x=Math.PI/2;}
   for(let n=0;n<8;n++){const a=n*Math.PI/4;k.pipe(g,[Math.cos(a)*4.3,0,Math.sin(a)*4.3],[Math.cos(a)*3.9,4,Math.sin(a)*3.9],.16,k.dark);}
  }
  for(const z of [-17,17]){k.box(k.root,[w+16,.6,2],[0,9,z],k.dark);for(const x of [-w/2-3,w/2+3])k.box(k.root,[1,9,1],[x,4.5,z],wall);for(const side of [-1,1])k.railing(k.root,[-w/2-8,9.4,z+side*.9],[w/2+8,9.4,z+side*.9]);k.pipe(k.root,[-w/2-8,9.4,z],[w/2+8,9.4,z],.27,k.steel);}
  k.box(k.root,[28,15,12],[0,7.5,-d/2-13],wall);for(let x=-11;x<=11;x+=4)for(const y of [6,10,13])k.box(k.root,[3,1.4,.05],[x,y,-d/2-6.95],k.glass);
 }else{
  // Overhead trusses and pipe racks never intrude into traversable space.
  for(const z of [-10,0,10]){for(const y of [7,8.2])k.box(k.root,[w+2,.18,.18],[0,y,z],k.steel);for(let x=-w/2;x<w/2;x+=3){k.pipe(k.root,[x,7,z],[x+3,8.2,z],.06,k.steel);k.pipe(k.root,[x,8.2,z],[x+3,7,z],.06,k.steel);}for(const x of [-12,-6,6,12]){k.box(k.root,[1.8,.15,.5],[x,6.9,z],k.dark);k.box(k.root,[1.5,.04,.4],[x,6.8,z],k.lamp);}}
  for(const x of [-w/2-6,w/2+6]){
   for(const z of [-12,0,12]){k.cylinder(k.root,2,11,[x,5.5,z],k.steel);for(const y of [1,5,9]){const r=k.ring(k.root,2.02,.08,[x,y,z],k.rust);r.rotation.x=Math.PI/2;}k.pipe(k.root,[x,11,z],[x,16,z],.5,k.rust);}
   for(const y of [6.7,7.3])k.pipe(k.root,[x,y,-16],[x,y,16],.22,k.rust);
  }
  for(let n=0;n<5;n++){const x=-24+n*12,h=12+(n%3)*3;k.box(k.root,[10,h,8],[x,h/2,-d/2-13],wall);for(let i=0;i<4;i++)k.box(k.root,[1.3,2,.05],[x-3+i*2,h-3,-d/2-8.95],k.glass);k.cylinder(k.root,.8,10,[x,h+5,-d/2-13],k.rust);}
 }
}

export function atmosphere(map:Arena){
 const dusk=map.id==='reactor',warm=map.id==='harbor';
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(dusk?0x19334f:warm?0x577e9b:0x568bac)},horizon:{value:new T.Color(dusk?0x8b95a6:warm?0xe2b887:0xd2d9d1)},sun:{value:new T.Vector3(-.6,warm?.24:dusk?.08:.65,.4).normalize()}},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDir;uniform vec3 top;uniform vec3 horizon;uniform vec3 sun;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(vDir);float up=max(d.y,0.);vec3 c=mix(horizon,top,pow(up,.45));vec2 p=d.xz/(up+.3)*2.;float n=noise(p)*.55+noise(p*2.1)*.27+noise(p*4.3)*.13;float cloud=smoothstep(.49,.76,n)*smoothstep(.02,.24,up)*.36;c=mix(c,vec3(.89,.9,.9),cloud);float s=max(dot(d,sun),0.);c+=vec3(1.,.68,.35)*pow(s,90.)*.22;c+=vec3(1.,.83,.6)*smoothstep(.9996,.9999,s)*1.5;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const sky=new T.Mesh(new T.SphereGeometry(190,24,16),material);sky.name='atmosphere';sky.frustumCulled=false;return sky;
}
