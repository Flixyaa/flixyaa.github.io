import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {finish} from './materials';
import {weapons,type WeaponId} from '../shared/weapons';
function part(p:T.Object3D,size:number[],pos:number[],mat:T.Material,r=.008){const m=new T.Mesh(new RoundedBoxGeometry(...size as [number,number,number],2,Math.min(r,...size.map(v=>v*.22))),mat);m.position.set(...pos as [number,number,number]);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function cylinder(p:T.Object3D,r:number,length:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.CylinderGeometry(r,r,length,20),mat);m.rotation.x=Math.PI/2;m.position.set(...pos as [number,number,number]);m.castShadow=true;p.add(m);return m;}
function ring(p:T.Object3D,r:number,t:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.TorusGeometry(r,t,6,24),mat);m.position.set(...pos as [number,number,number]);p.add(m);return m;}
// Batch fixed parts by material. Moving magazine, bolt and muzzle remain separate.
function batch(g:T.Group){g.updateMatrixWorld(true);const groups=new Map<T.Material,T.Mesh[]>();for(const o of [...g.children])if(o instanceof T.Mesh&&!o.name&&!Array.isArray(o.material)){const list=groups.get(o.material)||[];list.push(o);groups.set(o.material,list);}for(const [mat,meshes]of groups){const geometries=meshes.map(m=>(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix));const merged=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());if(!merged)continue;meshes.forEach(m=>{g.remove(m);m.geometry.dispose();});const m=new T.Mesh(merged,mat);m.castShadow=m.receiveShadow=true;g.add(m);}}
export function detailedWeapon(id:WeaponId){
 const g=new T.Group(),long=id==='marksman',smg=id==='smg',body=smg?.38:.55,barrel=long?.63:smg?.18:.31;
 const black=finish(0x20282c),steel=finish(0x64717a),tan=finish(long?0x80765b:smg?0x3a4247:0x665f4b),rubber=finish(0x161d20,'rubber'),accent=finish(weapons[id].color);
 part(g,[.125,.145,body],[0,0,0],black);part(g,[.13,.045,body*.92],[0,.084,-.015],tan);
 const fore=long?.32:smg?.13:.24;part(g,[.14,.13,fore],[0,0,-body/2-fore/2+.025],tan);
 for(let n=0;n<(long?6:smg?3:5);n++)for(const side of [-1,1]){part(g,[.005,.028,.027],[side*.071,.015,-body/2+.015-n*.043],rubber,.003);part(g,[.008,.012,.03],[side*.072,-.036,-body/2+.015-n*.043],steel,.002);}
 cylinder(g,.025,barrel,[0,.018,-body/2-barrel/2],steel);cylinder(g,.036,.095,[0,.018,-body/2-barrel],black);
 ring(g,.025,.008,[0,.018,-body/2-barrel-.048],steel);cylinder(g,.022,.002,[0,.018,-body/2-barrel-.05],rubber);
 for(let i=0;i<3;i++)ring(g,.033,.003,[0,.018,-body/2-barrel+.01+i*.018],steel);
 cylinder(g,.037,.18,[0,-.006,body/2+.08],steel);
 part(g,[.11,.14,.23],[0,-.025,body/2+.13],tan);part(g,[.125,.20,.035],[0,-.04,body/2+.255],rubber);part(g,[.115,.035,.16],[0,.055,body/2+.12],rubber);
 for(let side of [-1,1]){part(g,[.006,.055,.10],[side*.057,-.015,body/2+.12],rubber);for(let z of [-.12,.08]){const screw=cylinder(g,.009,.005,[side*.067,.02,z],steel);screw.rotation.set(0,0,Math.PI/2);part(g,[.006,.003,.011],[side*.071,.02,z],rubber,.001);}}
 const grip=part(g,[.085,.205,.095],[0,-.15,.13],rubber);grip.rotation.x=-.22;
 for(let i=0;i<6;i++)part(g,[.089,.007,.075],[0,-.09-i*.024,.13+i*.004],black,.002);
 part(g,[.083,.014,.14],[0,-.105,.025],black);part(g,[.083,.08,.015],[0,-.067,-.042],black);
 const trigger=part(g,[.012,.06,.014],[0,-.065,.035],steel);trigger.rotation.x=-.3;
 const magazine=new T.Group();magazine.name='magazine';magazine.position.set(0,-.15,-.065);g.add(magazine);
 part(magazine,[.09,smg?.26:.18,.115],[0,0,0],black);part(magazine,[.102,.024,.125],[0,smg?-.13:-.09,0],rubber);
 for(let side of [-1,1])for(let n=0;n<3;n++)part(magazine,[.006,smg?.20:.13,.009],[side*.046,0,-.035+n*.03],steel,.002);
 part(g,[.006,.04,.11],[.065,.03,.025],rubber);const bolt=part(g,[.01,.027,.07],[.072,.03,.03],steel);bolt.name='bolt';
 part(g,[.04,.022,.055],[.093,.04,.08],black);
 for(let n=0;n<(smg?8:12);n++)part(g,[.115,.014,.018],[0,.115,.20-n*.04],black,.002);
 if(long){
  for(const z of [-.11,.11]){part(g,[.065,.07,.04],[0,.16,z],black);ring(g,.052,.012,[0,.22,z],steel);}
  cylinder(g,.047,.34,[0,.22,0],black);cylinder(g,.068,.10,[0,.22,-.20],tan);cylinder(g,.058,.07,[0,.22,.20],rubber);
  const lens=new T.MeshPhysicalMaterial({color:0x234c5b,metalness:.2,roughness:.08,clearcoat:1});cylinder(g,.058,.002,[0,.22,-.251],lens);cylinder(g,.048,.002,[0,.22,.236],lens);
  const turret=cylinder(g,.033,.055,[0,.28,0],black);turret.rotation.x=0;for(let n=0;n<12;n++){const angle=n*Math.PI/6;part(g,[.007,.03,.007],[Math.cos(angle)*.033,.29,Math.sin(angle)*.033],steel,.001);}
 }else{
  for(const x of [-.067,.067])part(g,[.016,.14,.035],[x,.20,-.03],black,.005);
  for(const y of [.13,.27])part(g,[.15,.016,.035],[0,y,-.03],black,.005);
  part(g,[.09,.025,.065],[0,.12,-.03],tan);part(g,[.025,.03,.025],[.085,.15,-.03],steel);
 }
 part(g,[.003,.012,.04],[-.065,.05,.12],accent,.001);
 batch(g);
 const muzzle=new T.Group();muzzle.name='muzzle';muzzle.position.set(0,.018,-body/2-barrel-.10);muzzle.visible=false;g.add(muzzle);
 for(let n=0;n<3;n++){const flash=new T.Mesh(new T.ConeGeometry(.035+n*.009,.13+n*.04,5),new T.MeshBasicMaterial({color:n?0xff8c26:0xfff5c0,transparent:true,opacity:.55-n*.12,depthWrite:false,blending:T.AdditiveBlending}));flash.rotation.x=-Math.PI/2;flash.rotation.z=n*2;muzzle.add(flash);}
 return g;
}
export function animateWeapon(g:T.Group,reloadProgress:number,kick:number,time:number){const mag=g.getObjectByName('magazine');if(mag){const drop=reloadProgress>0?Math.sin(Math.PI*reloadProgress):0;mag.position.y=-.15-drop*.32;mag.position.z=-.065+drop*.08;mag.rotation.x=drop*.3;}const bolt=g.getObjectByName('bolt');if(bolt)bolt.position.z=.03+kick*.055;const muzzle=g.getObjectByName('muzzle');if(muzzle)muzzle.rotation.z=time*.04;}
