import {maps,type Arena,type MapId} from '../shared/maps.js';
import {boxes,hitDistance,type Player,type Input} from '../shared/game.js';

type Point={x:number,z:number};
class Navigation{
 nodes:Point[]=[];grid:Map<string,Point>;
 constructor(map:Arena){for(let x=-map.width/2+1;x<map.width/2;x++)for(let z=-map.depth/2+1;z<map.depth/2;z++)if(!map.boxes.some(b=>b.y+b.h/2>.05&&Math.abs(x-b.x)<b.w/2+.4&&Math.abs(z-b.z)<b.d/2+.4))this.nodes.push({x,z});this.grid=new Map(this.nodes.map(p=>[this.key(p),p]));}
 key(p:Point){return p.x+','+p.z;}
 nearest(p:Point){return this.nodes.reduce((a,b)=>(a.x-p.x)**2+(a.z-p.z)**2<(b.x-p.x)**2+(b.z-p.z)**2?a:b);}
 route(from:Point,to:Point):Point[]{const start=this.nearest(from),goal=this.nearest(to),queue=[start],seen=new Map<string,Point|null>([[this.key(start),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(this.key(p)===this.key(goal))break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=this.grid.get((p.x+dx)+','+(p.z+dz));if(n&&!seen.has(this.key(n))){seen.set(this.key(n),p);queue.push(n);}}}
 if(!seen.has(this.key(goal)))return [];const path:Point[]=[];let p:Point|null=goal;while(p&&this.key(p)!==this.key(start)){path.push(p);p=seen.get(this.key(p))??null;}return path.reverse();}
}
const navigation=new Map<MapId,Navigation>();
/** Generates ordinary inputs. Damage, movement and weapon rules stay in Match. */
export type Difficulty='easy'|'medium'|'hard';
export const difficultySettings={
 easy:{reaction:1500,cadence:850,error:.16,turn:.025,speed:.55},
 medium:{reaction:900,cadence:450,error:.075,turn:.04,speed:.8},
 hard:{reaction:550,cadence:240,error:.024,turn:.055,speed:1}
};
export class Bot{
 private nav:Navigation;
 constructor(public difficulty:Difficulty='easy',public readonly mapId:MapId='foundry'){let nav=navigation.get(mapId);if(!nav){nav=new Navigation(maps[mapId]);navigation.set(mapId,nav);}this.nav=nav;}
 get settings(){return difficultySettings[this.difficulty];}

 seq=0;path:Point[]=[];planAt=0;visibleAt=0;life=-1;
 input(p:Player,target:Player,now:number):Input{
 if(p.life!==this.life){this.life=p.life;this.path=[];this.planAt=0;this.visibleAt=0;}
 const settings=this.settings;
 const dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz);
 const aimYaw=Math.atan2(-dx,-dz),aimPitch=Math.atan2(target.y-p.y-.45,distance);
 const visible=target.hp>0&&Number.isFinite(hitDistance({...p,yaw:aimYaw,pitch:aimPitch},target,maps[this.mapId]));
 if(!visible)this.visibleAt=0;else if(!this.visibleAt)this.visibleAt=now;
 if(now>=this.planAt){this.path=this.nav.route(p,target);this.planAt=now+600;}
 while(this.path.length&&Math.hypot(this.path[0].x-p.x,this.path[0].z-p.z)<.35)this.path.shift();
 const point=this.path[0];let wx=0,wz=0;
 if(point&&(!visible||distance>11)){wx=point.x-p.x;wz=point.z-p.z;const len=Math.hypot(wx,wz);wx/=len;wz/=len;}
 const desired=visible?aimYaw+(Math.sin(now*.0023)*settings.error):point?Math.atan2(-wx,-wz):p.yaw;
 const turn=Math.atan2(Math.sin(desired-p.yaw),Math.cos(desired-p.yaw));
 const yaw=Math.atan2(Math.sin(p.yaw+Math.max(-settings.turn,Math.min(settings.turn,turn))),Math.cos(p.yaw+Math.max(-settings.turn,Math.min(settings.turn,turn))));
 const pitch=Math.max(-1.5,Math.min(1.5,p.pitch+Math.max(-.04,Math.min(.04,(visible?aimPitch:0)-p.pitch))));
 const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
 return {seq:this.seq++,x:clamp((wx*Math.cos(yaw)-wz*Math.sin(yaw))*settings.speed),z:clamp((-wx*Math.sin(yaw)-wz*Math.cos(yaw))*settings.speed),yaw,pitch,jump:false,sprint:!visible&&this.difficulty==='hard',fire:visible&&now-this.visibleAt>settings.reaction&&Math.abs(turn)<.07&&now-p.shotAt>=settings.cadence,reload:p.ammo===0||(p.ammo<12&&!visible),};
 }
}
