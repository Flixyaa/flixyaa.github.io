import * as T from 'three';
import {boxes} from '../shared/game';
import {weapons,type WeaponId} from '../shared/weapons';
const metal=(color:number,roughness=.4,metalness=.35)=>new T.MeshStandardMaterial({color,roughness,metalness});
function box(parent:T.Object3D,size:number[],pos:number[],material:T.Material){const m=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),material);m.position.set(...pos as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function tube(parent:T.Object3D,r:number,length:number,pos:number[],material:T.Material){const m=new T.Mesh(new T.CylinderGeometry(r,r,length,12),material);m.rotation.x=Math.PI/2;m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
export function weaponModel(id:WeaponId){
 const g=new T.Group(),w=weapons[id],dark=metal(0x182530),steel=metal(0x586776),rubber=metal(0x12191e,.9,.05),accent=metal(w.color,.25,.4);
 const long=id==='marksman',compact=id==='smg',body=compact?.38:.55,barrel=long?.63:compact?.18:.31;
 box(g,[.13,.16,body],[0,0,0],dark);box(g,[.15,.055,body*.8],[0,.085,-.01],steel);
 tube(g,.035,barrel,[0,.018,-body/2-barrel/2],steel);tube(g,.052,.09,[0,.018,-body/2-barrel],dark);
 tube(g,.023,.095,[0,.018,-body/2-barrel-.003],rubber);
 box(g,[.12,.12,.2],[0,-.01,body/2+.09],dark);box(g,[.16,.24,.06],[0,-.045,body/2+.22],rubber);
 const grip=box(g,[.09,.23,.105],[0,-.16,.12],rubber);grip.rotation.x=-.22;
 const mag=box(g,[.095,compact?.26:.2,.12],[0,-.16,-.055],steel);mag.rotation.x=compact?-.13:.12;
 for(let n=0;n<4;n++)box(g,[.1,.012,.125],[0,-.09-n*.035,-.055],rubber);
 box(g,[.025,.06,body*.75],[.076,.02,-.04],accent);
 for(let n=0;n<7;n++)box(g,[.17,.015,.022],[0,.123,-body/2+.04+n*.045],dark);
 for(let n=0;n<4;n++)box(g,[.008,.04,.055],[-.067,.01,-body/2+.04+n*.065],steel);
 box(g,[.045,.035,.085],[.09,.035,.12],steel);
 if(long){box(g,[.08,.06,.23],[0,.15,0],dark);tube(g,.06,.31,[0,.22,-.01],dark);tube(g,.049,.009,[0,.22,-.17],new T.MeshStandardMaterial({color:0x55bacc,emissive:0x16768b,emissiveIntensity:.4,metalness:.8,roughness:.15}));}
 else {
 // Open reflex sight: its optical center sits at y=.20, aligned to the camera in ADS.
 for(const x of [-.067,.067])box(g,[.016,.14,.035],[x,.20,-.03],dark);
 for(const y of [.13,.27])box(g,[.15,.016,.035],[0,y,-.03],dark);
 box(g,[.08,.02,.05],[0,.12,-.03],steel);
 }
 const muzzle=new T.Mesh(new T.ConeGeometry(.085,.24,6),new T.MeshBasicMaterial({color:0xffe1a0,transparent:true,opacity:.9}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.018,-body/2-barrel-.12);muzzle.name='muzzle';muzzle.visible=false;g.add(muzzle);
 return g;
}
export function disposeModel(g:T.Object3D){g.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
export function enhanceArena(scene:T.Scene,renderer:T.WebGLRenderer){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 scene.background=new T.Color(0xb8c6cb);scene.fog=new T.Fog(0xb8c6cb,38,100);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 c.fillStyle='#586b74';c.fillRect(0,0,256,256);c.strokeStyle='#465860';c.lineWidth=3;c.strokeRect(2,2,252,252);c.strokeStyle='#71818a';c.lineWidth=1;c.strokeRect(7,7,242,242);
 for(let i=0;i<1600;i++){const x=(i*73)%256,y=(i*137)%256;c.fillStyle=i%2?'#ffffff08':'#0000000c';c.fillRect(x,y,2,2);}
 const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(18,14);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const floor=new T.Mesh(new T.PlaneGeometry(36,28),new T.MeshStandardMaterial({map:tex,roughness:.82,metalness:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
 const trim=metal(0x263944),light=new T.MeshStandardMaterial({color:0x75ffe6,emissive:0x2edbb7,emissiveIntensity:2}),orange=metal(0xe4a14f);
 for(const b of boxes.slice(5)){
 box(scene,[b.w+.04,.12,b.d+.04],[b.x,b.y+b.h/2+.03,b.z],trim);
 for(const x of [b.x-b.w/2,b.x+b.w/2])box(scene,[.09,b.h,.09],[x,b.y,b.z-b.d/2-.02],trim);
 for(const z of [b.z-b.d/2-.025,b.z+b.d/2+.025]){box(scene,[b.w*.65,.035,.025],[b.x,b.y+b.h*.3,z],light);for(let i=0;i<Math.floor(b.w);i++)box(scene,[.045,b.h*.65,.025],[b.x-b.w/2+.5+i,b.y,z],trim);}
 }
 for(const x of [-17.46,17.46])for(let z=-12;z<=12;z+=4){box(scene,[.07,3.6,.12],[x,2,z],trim);box(scene,[.08,.07,2.5],[x,3.9,z],light);}
 for(const z of [-13.46,13.46])for(let x=-16;x<=16;x+=4){box(scene,[.12,3.6,.07],[x,2,z],trim);box(scene,[2.5,.07,.08],[x,3.9,z],light);}
 for(const x of [-14,14]){for(const z of [-2,2])box(scene,[3.5,.018,.08],[x,.033,z],orange);for(let n=0;n<6;n++)box(scene,[.28,.019,.6],[x-1.4+n*.55,.035,-2.5],orange);}
 for(let i=0;i<18;i++){const x=-36+i*4.5,h=7+(i*7)%9;box(scene,[3,h,4],[x,h/2,-24-(i%3)*4],metal(0x617480,.9,.1));}
 // Pipes stay above the walls, outside the playable collision space.
 for(const x of [-18,18]){const p=tube(scene,.22,27,[x,6.4,0],trim);p.rotation.x=Math.PI/2;}
 const sign=document.createElement('canvas');sign.width=1024;sign.height=256;const ctx=sign.getContext('2d')!;ctx.fillStyle='#18313b';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#76eedb';ctx.font='bold 95px Arial';ctx.fillText('FOUNDRY / 07',65,155);const st=new T.CanvasTexture(sign);st.colorSpace=T.SRGBColorSpace;const board=new T.Mesh(new T.PlaneGeometry(8,2),new T.MeshStandardMaterial({map:st,roughness:.6}));board.position.set(0,4.5,-13.44);scene.add(board);
}
export class ArmoryPreview{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(35,1,.01,20);model:T.Group;
 constructor(private host:HTMLElement,id:WeaponId){this.renderer=new T.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=T.ACESFilmicToneMapping;host.append(this.renderer.domElement);this.scene.add(new T.HemisphereLight(0xc8faff,0x344555,3));const a=new T.DirectionalLight(0xffffff,4);a.position.set(1,3,3);this.scene.add(a);const rim=new T.DirectionalLight(0x65e7d8,5);rim.position.set(-2,1,-2);this.scene.add(rim);this.camera.position.set(.85,.5,1.3);this.camera.lookAt(0,0,-.12);this.model=weaponModel(id);this.scene.add(this.model);}
 select(id:WeaponId){this.scene.remove(this.model);disposeModel(this.model);this.model=weaponModel(id);this.scene.add(this.model);}
 render(now:number){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;if(this.renderer.domElement.width!==Math.floor(w*this.renderer.getPixelRatio())||this.renderer.domElement.height!==Math.floor(h*this.renderer.getPixelRatio()))this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.model.rotation.y=-.7+Math.sin(now*.0003)*.12;this.model.rotation.z=.05;this.renderer.render(this.scene,this.camera);}
}
