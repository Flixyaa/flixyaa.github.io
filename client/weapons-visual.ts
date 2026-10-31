import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {finish} from './materials';
import {type WeaponId} from '../shared/weapons';
function part(p:T.Object3D,size:number[],pos:number[],mat:T.Material,r=.008){const m=new T.Mesh(new RoundedBoxGeometry(...size as [number,number,number],2,Math.min(r,...size.map(v=>v*.22))),mat);m.position.set(...pos as [number,number,number]);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function cylinder(p:T.Object3D,r:number,length:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.CylinderGeometry(r,r,length,20),mat);m.rotation.x=Math.PI/2;m.position.set(...pos as [number,number,number]);m.castShadow=true;p.add(m);return m;}
function ring(p:T.Object3D,r:number,t:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.TorusGeometry(r,t,6,24),mat);m.position.set(...pos as [number,number,number]);p.add(m);return m;}
// Batch fixed parts by material. Moving magazine, bolt and muzzle remain separate.
function batch(g:T.Group){g.updateMatrixWorld(true);const groups=new Map<T.Material,T.Mesh[]>();for(const o of [...g.children])if(o instanceof T.Mesh&&!o.name&&!Array.isArray(o.material)){const list=groups.get(o.material)||[];list.push(o);groups.set(o.material,list);}for(const [mat,meshes]of groups){const geometries=meshes.map(m=>(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix));const merged=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());if(!merged)continue;meshes.forEach(m=>{g.remove(m);m.geometry.dispose();});const m=new T.Mesh(merged,mat);m.castShadow=m.receiveShadow=true;g.add(m);}}

// Side-profile prism: coordinates are [z,y]; extrusion gives the weapon its width.
function profile(parent:T.Object3D,points:number[][],width:number,mat:T.Material){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:2,steps:1});geometry.translate(0,0,-width/2);geometry.rotateY(Math.PI/2);const mesh=new T.Mesh(geometry,mat);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function wood(){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d')!;c.fillStyle='#99532a';c.fillRect(0,0,256,128);for(let i=0;i<100;i++){c.strokeStyle=i%3?'#4c250c35':'#edb16840';c.lineWidth=i%4*.45+.3;c.beginPath();for(let x=0;x<=256;x+=8){const y=i*1.3+Math.sin(x*.024+i)*2.5;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map,color:0xa77a55,roughness:.48,metalness:0,bumpMap:map,bumpScale:.0006});}
export function detailedWeapon(id:WeaponId){
 if(id==='glock'||id==='knife')return sidearm(id);
 const g=new T.Group(),black=finish(0x24292c),steel=finish(0x657078),rubber=finish(0x151b1c,'rubber'),polymer=finish(0x303735,'rubber'),woodMat=id==='rifle'?wood():undefined;
 const mag=new T.Group();mag.name='magazine';mag.position.set(0,-.15,-.065);g.add(mag);
 let tip=-.7;
 if(id==='smg'){
  // MP5: tubular receiver, cocking tube, compact polymer fore-end and sliding stock.
  cylinder(g,.057,.39,[0,.025,.005],black);part(g,[.10,.07,.30],[0,-.047,.035],polymer);
  cylinder(g,.023,.32,[0,.075,-.27],black);
  profile(g,[[-.19,.04],[-.39,.025],[-.42,-.05],[-.36,-.09],[-.18,-.07]],.115,polymer);
  for(let side of [-1,1])for(let n=0;n<5;n++)part(g,[.008,.055,.012],[side*.06,-.026,-.22-n*.031],rubber,.002);
  cylinder(g,.021,.14,[0,.015,-.455],steel);cylinder(g,.029,.06,[0,.015,-.54],black);ring(g,.020,.006,[0,.015,-.571],steel);tip=-.58;
  for(const x of [-.062,.062]){part(g,[.014,.026,.32],[x,.012,.30],steel);part(g,[.025,.045,.07],[x,.01,.15],black);}
  part(g,[.145,.18,.035],[0,-.045,.465],rubber);part(g,[.10,.045,.09],[0,.025,.43],polymer);
  profile(mag,[[.045,.065],[-.045,.065],[-.048,-.12],[-.088,-.22],[-.035,-.24],[.025,-.15]],.055,black);
  for(const x of [-.029,.029]){const rib=part(mag,[.004,.20,.008],[x,-.065,-.005],steel,.001);rib.rotation.x=-.17;}
  part(g,[.045,.025,.055],[-.073,.07,-.28],black);ring(g,.043,.008,[0,.09,-.43],black);part(g,[.009,.04,.01],[0,.07,-.43],steel);
  cylinder(g,.033,.026,[0,.115,.135],black);
 }else if(id==='rifle'){
  // AK-47: stamped receiver, wooden furniture, upper gas tube and curved steel magazine.
  part(g,[.115,.135,.37],[0,-.005,.015],black);cylinder(g,.052,.34,[0,.052,.015],black);
  profile(g,[[.20,.045],[.30,.035],[.58,-.035],[.59,-.16],[.46,-.155],[.27,-.075],[.20,-.07]],.102,woodMat!);
  part(g,[.115,.145,.025],[0,-.092,.59],rubber);
  profile(g,[[-.17,-.02],[-.40,-.015],[-.42,-.08],[-.20,-.095]],.115,woodMat!);cylinder(g,.042,.22,[0,.035,-.285],woodMat!);
  for(const z of [-.18,-.40])part(g,[.122,.12,.017],[0,-.022,z],black,.002);
  cylinder(g,.022,.34,[0,.005,-.52],steel);cylinder(g,.017,.25,[0,.085,-.45],black);
  part(g,[.057,.14,.045],[0,.045,-.57],black);part(g,[.043,.13,.028],[0,.05,-.66],black);ring(g,.026,.006,[0,.115,-.66],black);part(g,[.006,.025,.009],[0,.10,-.66],steel);
  cylinder(g,.028,.055,[0,.005,-.715],black);tip=-.75;
  profile(mag,[[.055,.06],[-.065,.06],[-.067,-.055],[-.10,-.155],[-.17,-.235],[-.09,-.285],[-.025,-.22],[.025,-.13]],.072,black);
  for(const side of [-1,1])for(let n=0;n<3;n++){const rib=profile(mag,[[.035-n*.026,.03],[.025-n*.026,-.10],[-.05-n*.026,-.22],[-.06-n*.026,-.22],[.012-n*.026,-.10],[.022-n*.026,.03]],.005,steel);rib.position.x=side*.039;}
  const lever=part(g,[.008,.014,.15],[.063,-.02,.035],steel,.002);lever.rotation.x=.1;
  for(const z of [-.09,.045,.14])for(const x of [-.061,.061]){const pin=cylinder(g,.007,.004,[x,-.035,z],steel);pin.rotation.z=Math.PI/2;}
 }else{
  // Barrett M82 .50: long angular receiver, vented barrel shroud, box magazine and broad brake.
  part(g,[.16,.16,.60],[0,0,.005],black);part(g,[.13,.045,.60],[0,.097,.005],steel);
  profile(g,[[.30,.06],[.49,.055],[.50,-.13],[.38,-.13],[.30,-.065]],.125,black);part(g,[.15,.21,.037],[0,-.035,.51],rubber);part(g,[.12,.035,.17],[0,.085,.38],polymer);
  part(g,[.15,.145,.38],[0,.005,-.48],steel);
  for(const side of [-1,1])for(let n=0;n<7;n++){const hole=cylinder(g,.022,.006,[side*.077,.012,-.33-n*.048],rubber);hole.rotation.set(0,0,Math.PI/2);}
  cylinder(g,.031,.47,[0,.01,-.865],steel);
  part(g,[.17,.095,.14],[0,.01,-1.13],black);for(const side of [-1,1])for(const z of [-1.095,-1.15])part(g,[.006,.055,.032],[side*.087,.01,z],rubber,.001);
  cylinder(g,.023,.003,[0,.01,-1.202],rubber);tip=-1.22;
  part(mag,[.105,.19,.18],[0,-.015,-.015],black);part(mag,[.117,.02,.19],[0,-.11,-.015],rubber);for(const side of [-1,1])for(let n=0;n<3;n++)part(mag,[.005,.14,.013],[side*.055,-.01,-.07+n*.05],steel,.002);
  for(const side of [-1,1]){const leg=part(g,[.022,.25,.024],[side*.08,-.16,-.61],black);leg.rotation.z=-side*.35;part(g,[.065,.018,.06],[side*.12,-.28,-.61],rubber);}
  part(g,[.025,.07,.12],[.096,.055,-.1],black);
 }
 // Common controls retain grip and sight alignment for functional ADS and hand placement.
 const grip=part(g,[.078,.20,.085],[0,-.15,.13],id==='rifle'?woodMat!:polymer);grip.rotation.x=-.24;
 part(g,[.08,.012,.13],[0,-.105,.025],black);part(g,[.08,.075,.012],[0,-.068,-.035],black);const trigger=part(g,[.012,.05,.012],[0,-.07,.035],steel);trigger.rotation.x=-.3;
 const bolt=part(g,[.018,.025,.065],[id==='marksman'?.09:.071,.03,.03],steel);bolt.name='bolt';
 if(id==='marksman'){
  for(let n=0;n<14;n++)part(g,[.12,.012,.018],[0,.125,.26-n*.04],black,.002);
  for(const z of [-.11,.11]){part(g,[.065,.06,.04],[0,.16,z],black);ring(g,.054,.012,[0,.22,z],steel);}
  cylinder(g,.045,.33,[0,.22,0],black);cylinder(g,.071,.12,[0,.22,-.22],black);cylinder(g,.057,.08,[0,.22,.20],rubber);
  const glass=new T.MeshPhysicalMaterial({color:0x24465c,roughness:.06,metalness:.3,clearcoat:1});cylinder(g,.061,.003,[0,.22,-.281],glass);cylinder(g,.048,.003,[0,.22,.241],glass);
  const turret=cylinder(g,.033,.055,[0,.28,0],black);turret.rotation.x=0;const sideTurret=cylinder(g,.027,.055,[.065,.22,0],black);sideTurret.rotation.set(0,0,Math.PI/2);
 }else if(id==='smg'){
  part(g,[.09,.035,.15],[0,.12,-.03],black);for(const z of [-.09,.035])ring(g,.074,.012,[0,.20,z],black);for(const x of [-.071,.071])part(g,[.014,.08,.125],[x,.20,-.027],black);const turret=cylinder(g,.022,.035,[.093,.2,-.03],steel);turret.rotation.z=Math.PI/2;
 }else{
  part(g,[.09,.025,.17],[0,.115,-.03],black);for(const x of [-.067,.067])part(g,[.016,.14,.035],[x,.20,-.03],black,.005);for(const y of [.13,.27])part(g,[.15,.016,.035],[0,y,-.03],black,.005);
 }
 batch(g);
 const muzzle=new T.Group();muzzle.name='muzzle';muzzle.position.set(0,.015,tip-.06);muzzle.visible=false;g.add(muzzle);
 for(let n=0;n<3;n++){const scale=id==='marksman'?1.7:id==='smg'?.65:1;const flash=new T.Mesh(new T.ConeGeometry((.035+n*.009)*scale,(.13+n*.04)*scale,5),new T.MeshBasicMaterial({color:n?0xff8c26:0xfff5c0,transparent:true,opacity:.55-n*.12,depthWrite:false,blending:T.AdditiveBlending}));flash.rotation.x=-Math.PI/2;flash.rotation.z=n*2;muzzle.add(flash);}
 return g;
}
export function animateWeapon(g:T.Group,reloadProgress:number,kick:number,time:number){const mag=g.getObjectByName('magazine');if(mag){const drop=reloadProgress>0?Math.sin(Math.PI*reloadProgress):0;mag.position.y=-.15-drop*.32;mag.position.z=-.065+drop*.08;mag.rotation.x=drop*.3;}const slide=g.getObjectByName('slide');if(slide)slide.position.z=kick*.055;const bolt=g.getObjectByName('bolt');if(bolt)bolt.position.z=.03+kick*.055;const muzzle=g.getObjectByName('muzzle');if(muzzle)muzzle.rotation.z=time*.04;}

function sidearm(id:'glock'|'knife'){
 const g=new T.Group(),black=finish(0x242b30,'metal',.36),steel=finish(0x9aa9b1,'metal',.24),polymer=finish(0x303a3d,'rubber'),rubber=finish(0x182023,'rubber');g.userData.kind=id;
 if(id==='glock'){
  const slide=new T.Group();slide.name='slide';g.add(slide);
  part(slide,[.096,.078,.34],[0,.064,-.045],black,.007);
  part(slide,[.054,.006,.072],[.013,.106,-.019],steel,.002);
  for(const side of [-1,1])for(let n=0;n<7;n++)part(slide,[.004,.058,.004],[side*.049,.064,.078-n*.009],steel,.001);
  cylinder(g,.018,.31,[0,.065,-.067],black);ring(g,.017,.004,[0,.065,-.224],steel);
  profile(g,[[.11,.025],[-.21,.025],[-.21,-.016],[-.04,-.026],[.015,-.15],[.13,-.15],[.10,-.035]],.087,polymer);
  const grip=part(g,[.084,.17,.11],[0,-.085,.08],polymer);grip.rotation.x=-.2;
  for(let n=0;n<5;n++)part(g,[.086,.008,.10],[0,-.05-n*.022,.077+n*.004],rubber,.001);
  part(g,[.08,.012,.12],[0,-.065,-.036],polymer);part(g,[.08,.057,.012],[0,-.035,-.09],polymer);const trigger=part(g,[.012,.04,.013],[0,-.026,-.034],black);trigger.rotation.x=-.2;
  const mag=new T.Group();mag.name='magazine';mag.position.set(0,-.15,-.065);g.add(mag);part(mag,[.089,.025,.12],[0,-.025,.16],rubber);
  for(const x of [-.032,.032])part(slide,[.018,.025,.025],[x,.116,.09],black,.002);part(slide,[.014,.024,.02],[0,.116,-.187],black,.002);
  const dot=new T.MeshBasicMaterial({color:0xe1f3d5});for(const x of [-.032,.032])part(slide,[.008,.009,.002],[x,.118,.104],dot,.001);part(slide,[.007,.009,.002],[0,.118,-.175],dot,.001);
  part(g,[.007,.018,.028],[.049,-.014,.067],steel,.002);
  batch(g);const muzzle=new T.Group();muzzle.name='muzzle';muzzle.position.set(0,.065,-.29);muzzle.visible=false;g.add(muzzle);
  const flash=new T.Mesh(new T.ConeGeometry(.035,.15,5),new T.MeshBasicMaterial({color:0xffcd73,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));flash.rotation.x=-Math.PI/2;muzzle.add(flash);
 }else{
  // Full-tang, bevelled blade and textured handle, kept separate from rifle geometry.
  profile(g,[[.02,.02],[-.28,.025],[-.44,-.005],[-.29,-.065],[.02,-.065]],.018,steel);
  const edge=new T.MeshStandardMaterial({color:0xc6d2d8,metalness:.9,roughness:.17});profile(g,[[.01,-.05],[-.29,-.05],[-.44,-.005],[-.29,-.068],[.01,-.068]],.02,edge);
  part(g,[.065,.10,.022],[0,-.02,.025],black);part(g,[.06,.075,.19],[0,-.022,.133],rubber);
  for(let n=0;n<7;n++)part(g,[.064,.079,.008],[0,-.022,.061+n*.024],polymer,.002);
  for(const z of [.075,.195]){const pin=cylinder(g,.009,.066,[0,-.025,z],steel);pin.rotation.z=Math.PI/2;}
  part(g,[.065,.08,.016],[0,-.02,.237],black);batch(g);const muzzle=new T.Group();muzzle.name='muzzle';muzzle.visible=false;g.add(muzzle);
 }
 return g;
}
