import * as T from 'three';
const material=(color:number,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
function ellipsoid(parent:T.Object3D,scale:number[],pos:number[],mat:T.Material){const m=new T.Mesh(new T.SphereGeometry(1,16,12),mat);m.scale.set(...scale as [number,number,number]);m.position.set(...pos as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function segment(parent:T.Object3D,a:number[],b:number[],radius:number,mat:T.Material){const start=new T.Vector3(...a as [number,number,number]),end=new T.Vector3(...b as [number,number,number]),delta=end.clone().sub(start);const m=new T.Mesh(new T.CapsuleGeometry(radius,Math.max(.001,delta.length()-radius*2),4,10),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.castShadow=true;parent.add(m);return m;}

function panel(parent:T.Object3D,size:number[],pos:number[],mat:T.Material){const m=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),mat);m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
function torso(parent:T.Object3D,top:number,bottom:number,height:number,depth:number,pos:number[],mat:T.Material){const m=new T.Mesh(new T.CylinderGeometry(top,bottom,height,12),mat);m.scale.z=depth;m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
export function soldierModel(){
 const root=new T.Group(),uniform=material(0x49544d),armor=material(0x303b3c),boots=material(0x161e22),skin=material(0xba8c71),team=material(0xca6550),glass=material(0x172c35,.2);
 torso(root,.21,.22,.22,.65,[0,.87,0],uniform);torso(root,.215,.215,.055,.69,[0,.96,0],boots);panel(root,[.07,.045,.03],[0,.96,-.15],armor);
 const upper=new T.Group();upper.name='upper';upper.position.y=1.23;root.add(upper);
 torso(upper,.26,.20,.5,.6,[0,0,0],uniform);panel(upper,[.36,.34,.08],[0,0,-.14],armor);for(const x of [-.15,.15])panel(upper,[.045,.18,.04],[x,.21,-.11],armor);
 for(const x of [-.12,0,.12]){panel(upper,[.095,.13,.065],[x,-.10,-.21],uniform);panel(upper,[.098,.025,.07],[x,-.045,-.213],armor);}
 segment(upper,[0,.22,0],[0,.34,0],.075,skin);ellipsoid(upper,[.12,.15,.115],[0,.36,0],skin);
 const helmet=new T.Mesh(new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI/2),armor);helmet.scale.set(.139,.10,.139);helmet.position.set(0,.435,0);helmet.castShadow=true;upper.add(helmet);ellipsoid(upper,[.115,.035,.027],[0,.385,-.11],glass);for(const side of [-1,1]){ellipsoid(upper,[.022,.038,.027],[side*.115,.355,0],skin);segment(upper,[side*.10,.43,.03],[side*.08,.27,-.035],.012,boots);}
 ellipsoid(upper,[.025,.03,.035],[0,.335,-.117],skin);
 for(const side of [-1,1]){
  ellipsoid(upper,[.085,.11,.095],[side*.25,.10,0],uniform);
  segment(upper,[side*.27,.1,0],[side*.32,-.09,-.12],.075,uniform);
  segment(upper,[side*.32,-.09,-.12],[side===1?.16:.06,-.08,side===1?-.29:-.52],.062,uniform);
  ellipsoid(upper,[.065,.065,.07],[side===1?.16:.06,-.08,side===1?-.29:-.52],boots);
  panel(upper,[.018,.065,.09],[side*.33,.08,0],team);
  const leg=new T.Group();leg.name=side<0?'leftLeg':'rightLeg';leg.position.set(side*.13,.84,0);root.add(leg);
  segment(leg,[0,0,0],[0,-.36,.015],.105,uniform);ellipsoid(leg,[.095,.085,.07],[0,-.36,-.065],armor);
  const shin=new T.Group();shin.name='shin';shin.position.set(0,-.37,0);leg.add(shin);
  segment(shin,[0,0,0],[0,-.32,0],.075,uniform);ellipsoid(shin,[.085,.085,.15],[0,-.37,-.04],boots);
 }
 return root;
}
export function animateSoldier(root:T.Group,time:number,speed:number,pitch:number,ground:boolean){
 const stride=Math.min(1,speed/7.5),cycle=time*.011;
 for(const [name,offset]of [['leftLeg',0],['rightLeg',Math.PI]] as const){const leg=root.getObjectByName(name)!;leg.rotation.x=ground?Math.sin(cycle+offset)*.55*stride:-.3;leg.getObjectByName('shin')!.rotation.x=ground?Math.max(0,-Math.sin(cycle+offset))*.65*stride:.7;}
 const upper=root.getObjectByName('upper')!;upper.rotation.x=pitch*.65;upper.position.y=1.23+(ground?Math.abs(Math.sin(cycle))*.018*stride:0);
}
export function viewArms(){
 const g=new T.Group(),sleeve=material(0x49544d),glove=material(0x253033);
 segment(g,[.28,-.43,.43],[.19,-.25,.25],.09,sleeve);segment(g,[.19,-.25,.25],[.075,-.15,.12],.07,sleeve);
 ellipsoid(g,[.065,.09,.06],[.035,-.13,.12],glove);
 ellipsoid(g,[.075,.075,.075],[-.23,-.25,-.08],sleeve);segment(g,[-.29,-.42,.37],[-.23,-.25,-.08],.085,sleeve);segment(g,[-.23,-.25,-.08],[-.06,-.10,-.23],.065,sleeve);
 ellipsoid(g,[.065,.065,.09],[-.015,-.095,-.23],glove);return g;
}
