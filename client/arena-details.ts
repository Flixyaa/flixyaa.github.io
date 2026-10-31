import {Sky} from 'three/addons/objects/Sky.js';
﻿import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {finish} from './materials';
export function industrialDetails(scene:T.Scene){
 const sky=new Sky();sky.scale.setScalar(90);sky.material.uniforms.turbidity.value=4;sky.material.uniforms.rayleigh.value=1.4;sky.material.uniforms.mieCoefficient.value=.004;sky.material.uniforms.sunPosition.value.set(-13,18,9);scene.add(sky);

 const steel=finish(0x4a5050),dark=finish(0x20272a),yellow=finish(0xb58c38),rust=finish(0x805a40),light=new T.MeshStandardMaterial({color:0xf5d5a0,emissive:0xffcf83,emissiveIntensity:2});
 function box(s:number[],p:number[],m:T.Material){const mesh=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),m);mesh.position.set(...p as [number,number,number]);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;}
 // Structure remains above the collision walls and outside navigable space.
 for(const z of [-11,0,11]){box([37,.28,.22],[0,6.3,z],dark);for(const x of [-17.2,17.2]){box([.22,6,.3],[x,3,z],steel);box([.44,.16,.5],[x,.08,z],dark);}}
 for(const z of [-10,10])for(const x of [-12,-6,6,12]){box([1.8,.12,.35],[x,6.05,z],dark);box([1.5,.025,.22],[x,5.98,z],light);}
 for(const x of [-17.4,17.4])for(const z of [-9,-3,3,9]){box([.12,1.1,.6],[x,1.2,z],rust);for(let n=0;n<6;n++)box([.13,.025,.48],[x,1+n*.07,z],dark);}
 for(const z of [-13.4,13.4]){box([34,.28,.14],[0,.25,z],dark);box([34,.04,.15],[0,1.4,z],yellow);}
 for(const x of [-23,23])for(const z of [-16,0,16]){const tank=new T.Mesh(new T.CylinderGeometry(1.4,1.4,8,20),steel);tank.position.set(x,4,z);tank.castShadow=true;scene.add(tank);for(const y of [1,4,7]){const band=new T.Mesh(new T.TorusGeometry(1.42,.06,6,24),rust);band.rotation.x=Math.PI/2;band.position.set(x,y,z);scene.add(band);}}
 // Floor expansion joints and drainage channels.
 for(const x of [-16,16]){box([.32,.016,24],[x,.03,0],dark);for(let z=-12;z<12;z+=.25)box([.31,.018,.035],[x,.04,z],steel);}
 for(const z of [-6,6])box([32,.008,.025],[0,.024,z],dark);
 for(const x of [-8,8])for(let n=0;n<12;n++){const stripe=box([.32,.008,.7],[x+(n%2)*.4,.032,-5+n*.9],yellow);stripe.rotation.y=.45;}
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#d1c4a6';ctx.fillRect(0,0,512,256);ctx.fillStyle='#282c29';ctx.font='bold 64px Arial';ctx.fillText('SECTOR 07',30,85);ctx.font='24px Arial';ctx.fillText('FOUNDRY / RESTRICTED AREA',30,130);ctx.fillStyle='#a78335';ctx.fillRect(30,158,450,14);ctx.font='18px Arial';ctx.fillStyle='#343a35';ctx.fillText('AUTHORIZED PERSONNEL ONLY',30,213);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(2.6,1.3),new T.MeshStandardMaterial({map:t,roughness:.8}));sign.position.set(-10,2.1,-6.51);scene.add(sign);
 // Cheap baked contact darkening at the foot of cover.
 const ao=document.createElement('canvas');ao.width=ao.height=128;const ac=ao.getContext('2d')!,gradient=ac.createRadialGradient(64,64,10,64,64,64);gradient.addColorStop(0,'#0009');gradient.addColorStop(1,'#0000');ac.fillStyle=gradient;ac.fillRect(0,0,128,128);const amap=new T.CanvasTexture(ao);
 for(const [x,z,w,d]of [[0,0,7,11],[-10,-4,5,7],[10,4,5,7],[0,10,8,5],[0,-10,8,5]]){const p=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:amap,transparent:true,depthWrite:false,opacity:.5}));p.rotation.x=-Math.PI/2;p.position.set(x,.022,z);scene.add(p);}
}
export function batchArena(scene:T.Scene){
 scene.updateMatrixWorld(true);const grouped=new Map<string,{material:T.Material,meshes:T.Mesh[]}>();
 scene.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material)||o.material.transparent)return;let p:T.Object3D|null=o;while(p){if(p.userData.dynamic)return;p=p.parent;}const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;const group=grouped.get(key)||{material:o.material,meshes:[] as T.Mesh[]};group.meshes.push(o);grouped.set(key,group);});
 for(const {material,meshes}of grouped.values()){if(meshes.length<2)continue;const geometries=meshes.map(m=>(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrixWorld));const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!geometry)continue;const mesh=new T.Mesh(geometry,material);mesh.castShadow=meshes[0].castShadow;mesh.receiveShadow=meshes[0].receiveShadow;meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});scene.add(mesh);}
}

