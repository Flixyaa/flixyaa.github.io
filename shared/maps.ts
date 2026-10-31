import type {Box} from './game.js';
export type MapId='foundry'|'harbor'|'quarry'|'reactor';
export type Arena={id:MapId,name:string,subtitle:string,width:number,depth:number,spawnX:number,accent:number,sky:number,sun:number,ground:number,boxes:Box[]};
const cover=(x:number,z:number,w:number,d:number,h:number,color=0x506c72):Box=>({x,y:h/2,z,w,h,d,color});
function arena(id:MapId,name:string,subtitle:string,width:number,depth:number,spawnX:number,accent:number,sky:number,sun:number,ground:number,cover:Box[]):Arena{
 return {id,name,subtitle,width,depth,spawnX,accent,sky,sun,ground,boxes:[
 {x:0,y:-.5,z:0,w:width,h:1,d:depth,color:ground},
 {x:-width/2,y:3,z:0,w:1,h:6,d:depth,color:ground},{x:width/2,y:3,z:0,w:1,h:6,d:depth,color:ground},
 {x:0,y:3,z:-depth/2,w:width,h:6,d:1,color:ground},{x:0,y:3,z:depth/2,w:width,h:6,d:1,color:ground},...cover]};
}
export const maps:Record<MapId,Arena>={
 foundry:arena('foundry','FOUNDRY 07','Kompakte Industriearena · kurze Wege',36,28,14,0x51e3cc,0x9fbac7,0xffe3ba,0x858b88,[cover(0,0,5,9,4),cover(-10,-4,3,5,3,0xa77756),cover(10,4,3,5,3,0xa77756),cover(-6,8,4,3,1),cover(6,-8,4,3,1),cover(0,10,6,3,2),cover(0,-10,6,3,2),cover(-12,8,3,3,.8),cover(12,-8,3,3,.8)]),
 harbor:arena('harbor','PORT MERIDIAN','Containerhafen · drei Routen · Abendsonne',56,44,23,0xffb65a,0xc5b8a6,0xffc68b,0x777e80,[
 cover(0,0,8,12,4.4,0x375c70),cover(-13,-7,4,12,3.2,0xa05f40),cover(13,7,4,12,3.2,0xa05f40),
 cover(-10,10,10,4,3,0x536b55),cover(10,-10,10,4,3,0x536b55),cover(0,-17,8,3,2),cover(0,17,8,3,2),
 cover(-21,13,3,4,1.2),cover(21,-13,3,4,1.2),cover(-19,-16,4,3,1.5),cover(19,16,4,3,1.5)]),
 quarry:arena('quarry','REDSTONE BASIN','Steinbruch · weite Flanken · lange Sichtachsen',72,56,30,0xf2bd75,0xc9c3ad,0xffe3af,0xa48f73,[
 cover(0,0,10,16,6,0x9b7658),cover(-16,-10,8,6,4,0x94765d),cover(16,10,8,6,4,0x94765d),
 cover(-14,13,6,8,3,0xb28d65),cover(14,-13,6,8,3,0xb28d65),cover(0,23,12,3,2),cover(0,-23,12,3,2),
 cover(-27,19,5,4,1.1),cover(27,-19,5,4,1.1),cover(-26,-21,6,4,2.5),cover(26,21,6,4,2.5),cover(-5,-15,3,3,1.2),cover(5,15,3,3,1.2)]),
 reactor:arena('reactor','REACTOR NINE','Forschungsanlage · vier Flanken · blaue Stunde',64,52,27,0x5ae8ff,0x556b84,0xc3d9ff,0x697989,[
 cover(0,0,9,12,5.5,0x415a6b),cover(-15,-9,5,10,4,0x53677c),cover(15,9,5,10,4,0x53677c),
 cover(-13,13,9,4,2.8),cover(13,-13,9,4,2.8),cover(0,-21,8,3,2),cover(0,21,8,3,2),
 cover(-25,17,3,4,1),cover(25,-17,3,4,1),cover(-24,-19,4,4,2),cover(24,19,4,4,2)])
};
export const isMap=(v:unknown):v is MapId=>typeof v==='string'&&Object.hasOwn(maps,v);
