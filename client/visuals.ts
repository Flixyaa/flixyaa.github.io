import {detailedWeapon} from './weapons-visual';
import {finish,concrete,studioEnvironment} from './materials';
import * as T from 'three';
import {boxes} from '../shared/game';
import {weapons,type WeaponId} from '../shared/weapons';
const metal=(color:number,roughness=.4,metalness=.35)=>finish(color,'metal',roughness);
function box(parent:T.Object3D,size:number[],pos:number[],material:T.Material){const m=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),material);m.position.set(...pos as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function tube(parent:T.Object3D,r:number,length:number,pos:number[],material:T.Material){const m=new T.Mesh(new T.CylinderGeometry(r,r,length,12),material);m.rotation.x=Math.PI/2;m.position.set(...pos as [number,number,number]);m.castShadow=true;parent.add(m);return m;}
export const weaponModel=detailedWeapon;
export function disposeModel(g:T.Object3D){g.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
export function enhanceArena(scene:T.Scene,renderer:T.WebGLRenderer){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;studioEnvironment(scene,renderer);
 scene.background=new T.Color(0x91a5b3);scene.fog=new T.Fog(0x91a5b3,38,95);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 c.fillStyle='#586b74';c.fillRect(0,0,256,256);c.strokeStyle='#465860';c.lineWidth=3;c.strokeRect(2,2,252,252);c.strokeStyle='#71818a';c.lineWidth=1;c.strokeRect(7,7,242,242);
 for(let i=0;i<1600;i++){const x=(i*73)%256,y=(i*137)%256;c.fillStyle=i%2?'#ffffff08':'#0000000c';c.fillRect(x,y,2,2);}
 const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(18,14);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const floor=new T.Mesh(new T.PlaneGeometry(36,28),concrete('concrete_floor',9,7));floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
 const trim=metal(0x263944),light=new T.MeshStandardMaterial({color:0x75ffe6,emissive:0x2edbb7,emissiveIntensity:.8}),orange=metal(0xe4a14f);
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
 constructor(private host:HTMLElement,id:WeaponId){this.renderer=new T.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=T.ACESFilmicToneMapping;host.append(this.renderer.domElement);studioEnvironment(this.scene,this.renderer);this.scene.environmentIntensity=.8;this.scene.add(new T.HemisphereLight(0xc8faff,0x344555,1.2));const a=new T.DirectionalLight(0xffffff,2.5);a.position.set(1,3,3);this.scene.add(a);const rim=new T.DirectionalLight(0xb8d8ef,2);rim.position.set(-2,1,-2);this.scene.add(rim);this.camera.position.set(.85,.5,1.3);this.camera.lookAt(0,0,-.12);this.model=weaponModel(id);this.scene.add(this.model);}
 select(id:WeaponId){this.scene.remove(this.model);disposeModel(this.model);this.model=weaponModel(id);this.scene.add(this.model);}
 render(now:number){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;if(this.renderer.domElement.width!==Math.floor(w*this.renderer.getPixelRatio())||this.renderer.domElement.height!==Math.floor(h*this.renderer.getPixelRatio()))this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.model.rotation.y=-.7+Math.sin(now*.0003)*.12;this.model.rotation.z=.05;this.renderer.render(this.scene,this.camera);}
}
