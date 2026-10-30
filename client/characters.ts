import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {finish} from './materials';
﻿import * as T from 'three';
const material=(color:number,roughness=.85)=>finish(color,color===0x49544d?'cloth':roughness<.4?'metal':'rubber',roughness);
function ellipsoid(parent:T.Object3D,scale:number[],pos:number[],mat:T.Material){const m=new T.Mesh(new T.SphereGeometry(1,16,12),mat);m.scale.set(...scale as [number,number,number]);m.position.set(...pos as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function segment(parent:T.Object3D,a:number[],b:number[],radius:number,mat:T.Material){const start=new T.Vector3(...a as [number,number,number]),end=new T.Vector3(...b as [number,number,number]),delta=end.clone().sub(start);const m=new T.Mesh(new T.LatheGeometry([new T.Vector2(radius*.60,-delta.length()/2),new T.Vector2(radius*.90,-delta.length()*.38),new T.Vector2(radius,-delta.length()*.1),new T.Vector2(radius*.94,delta.length()*.23),new T.Vector2(radius*.72,delta.length()/2)],12),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.castShadow=true;parent.add(m);return m;}

function panel(parent:T.Object3D,size:number[],pos:number[],mat:T.Material){const m=new T.Mesh(new RoundedBoxGeometry(...size as [number,number,number],2,Math.min(.012,...size.map(v=>v*.2))),mat);m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
function torso(parent:T.Object3D,top:number,bottom:number,height:number,depth:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.CylinderGeometry(top,bottom,height,12),mat);m.scale.z=depth;m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
export function soldierModel(){
 const root=new T.Group(),uniform=material(0x49544d),armor=material(0x303b3c),boots=material(0x161e22),skin=material(0xba8c71),team=material(0xca6550),glass=material(0x172c35,.2);
 torso(root,.21,.22,.22,.65,[0,.87,0],uniform);torso(root,.215,.215,.055,.69,[0,.96,0],boots);panel(root,[.07,.045,.03],[0,.96,-.15],armor);
 const upper=new T.Group();upper.name='upper';upper.position.y=1.23;root.add(upper);
 torso(upper,.26,.20,.5,.6,[0,0,0],uniform);panel(upper,[.36,.34,.08],[0,0,-.14],armor);panel(upper,[.29,.34,.12],[0,-.01,.17],uniform);for(const x of [-.16,.16])panel(upper,[.035,.36,.028],[x,0,.20],armor);for(const x of [-.15,.15])panel(upper,[.045,.18,.04],[x,.21,-.11],armor);
 for(const x of [-.12,0,.12]){panel(upper,[.095,.13,.065],[x,-.10,-.21],uniform);panel(upper,[.098,.025,.07],[x,-.045,-.213],armor);}
 segment(upper,[0,.22,0],[0,.34,0],.075,skin);ellipsoid(upper,[.105,.143,.107],[0,.36,0],boots);panel(upper,[.165,.047,.035],[0,.373,-.093],skin);
 const helmet=new T.Mesh(new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI/2),armor);helmet.scale.set(.139,.10,.139);helmet.position.set(0,.435,0);helmet.castShadow=true;upper.add(helmet);ellipsoid(upper,[.115,.035,.027],[0,.385,-.11],glass);for(const side of [-1,1]){ellipsoid(upper,[.022,.038,.027],[side*.115,.355,0],skin);segment(upper,[side*.10,.43,.03],[side*.08,.27,-.035],.012,boots);}
 ellipsoid(upper,[.085,.061,.045],[0,.309,-.085],uniform);panel(upper,[.11,.025,.01],[0,.30,-.13],armor);
 for(const side of [-1,1]){
  ellipsoid(upper,[.085,.11,.095],[side*.25,.10,0],uniform);
  segment(upper,[side*.27,.1,0],[side*.32,-.09,-.12],.075,uniform);
  ellipsoid(upper,[.065,.065,.065],[side*.32,-.09,-.12],uniform);segment(upper,[side*.32,-.09,-.12],[side===1?.16:.06,-.08,side===1?-.29:-.52],.062,uniform);
  const hand=glovedHand();hand.scale.setScalar(.75);hand.position.set(side===1?.16:.06,-.08,side===1?-.29:-.52);hand.rotation.z=side===1?.1:Math.PI/2;upper.add(hand);
  panel(upper,[.018,.065,.09],[side*.33,.08,0],team);for(let k=0;k<3;k++)panel(upper,[.02,.007,.06],[side*.34,.065+k*.015,0],armor);
  const leg=new T.Group();leg.name=side<0?'leftLeg':'rightLeg';leg.position.set(side*.13,.84,0);root.add(leg);
  segment(leg,[0,0,0],[0,-.36,.015],.105,uniform);ellipsoid(leg,[.095,.085,.07],[0,-.36,-.065],armor);
  const shin=new T.Group();shin.name='shin';shin.position.set(0,-.37,0);leg.add(shin);
  segment(shin,[0,0,0],[0,-.32,0],.07,uniform);ellipsoid(shin,[.077,.07,.13],[0,-.36,-.04],boots);panel(shin,[.155,.025,.26],[0,-.414,-.04],armor);for(let k=0;k<4;k++)panel(shin,[.09,.008,.008],[0,-.31,-.10+k*.022],armor);
 }
 return root;
}
export function animateSoldier(root:T.Group,time:number,speed:number,pitch:number,ground:boolean){
 const stride=Math.min(1,speed/7.5),cycle=time*.011;
 for(const [name,offset]of [['leftLeg',0],['rightLeg',Math.PI]] as const){const leg=root.getObjectByName(name)!;leg.rotation.x=ground?Math.sin(cycle+offset)*.55*stride:-.3;leg.getObjectByName('shin')!.rotation.x=ground?Math.max(0,-Math.sin(cycle+offset))*.65*stride:.7;}
 const upper=root.getObjectByName('upper')!;upper.rotation.x=pitch*.65;upper.position.y=1.23+(ground?Math.abs(Math.sin(cycle))*.018*stride:0);
}

function glovedHand(){
 const g=new T.Group(),glove=finish(0x373b30,'cloth'),pad=finish(0x171d1d,'rubber');
 panel(g,[.085,.10,.043],[0,0,0],glove);
 for(let n=0;n<4;n++){
  const x=-.032+n*.021,len=n===0?.055:n===3?.05:.069;
  segment(g,[x,.025,-.008],[x,-len*.35,-.04],.013,glove);
  segment(g,[x,-len*.35,-.04],[x,-len,-.023],.012,glove);
  ellipsoid(g,[.011,.016,.008],[x,.023,.024],pad);
 }
 segment(g,[.043,.015,0],[.055,-.022,-.028],.017,glove);segment(g,[.055,-.022,-.028],[.028,-.043,-.045],.015,glove);
 panel(g,[.09,.022,.049],[0,.055,0],pad);return g;
}
export function viewArms(){
 const root=new T.Group(),sleeve=finish(0x676a50,'cloth'),cuff=finish(0x282f28,'rubber');
 for(const side of [-1,1]){
  const g=new T.Group();g.name=side<0?'supportArm':'triggerArm';root.add(g);
  const elbow=side<0?[-.23,-.25,-.08]:[.19,-.25,.25],wrist=side<0?[-.06,-.10,-.23]:[.075,-.15,.12];
  segment(g,[side*.29,-.43,.40],elbow,.085,sleeve);ellipsoid(g,[.069,.071,.069],elbow,sleeve);segment(g,elbow,wrist,.062,sleeve);
  ellipsoid(g,[.050,.035,.055],wrist,cuff);
  const hand=glovedHand();hand.position.set(side<0?-.035:.035,side<0?-.09:-.13,side<0?-.24:.12);hand.rotation.z=side<0?Math.PI/2:.12;g.add(hand);
  for(let k=0;k<3;k++){const t=.25+k*.16;const p=elbow.map((v,i)=>v+(wrist[i]-v)*t);ellipsoid(g,[.062,.012,.060],p,sleeve);}
 }
 return root;
}
export function animateArms(g:T.Object3D,progress:number){const arm=g.getObjectByName('supportArm');if(!arm)return;const reach=progress>0?Math.sin(progress*Math.PI):0;arm.position.set(reach*.08,-reach*.12,reach*.16);arm.rotation.x=reach*.4;}
