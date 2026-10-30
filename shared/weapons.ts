export const weapons={
 rifle:{name:'AR-24 Sentinel',category:'STURMGEWEHR',description:'Kontrollierte Feuerstöße. Reflexvisier für präzise Treffer.',damage:25,interval:110,magazine:24,reload:1400,recoil:.012,spread:.004,aimSpread:.001,aimFov:62,color:0x41e6c5},
 smg:{name:'VX-9 Vector',category:'MASCHINENPISTOLE',description:'Schnelle Feuerstöße. Starker Rückstoß und breite Streuung.',damage:18,interval:75,magazine:32,reload:1200,recoil:.034,spread:.035,aimSpread:.014,aimFov:68,color:0xffb44d},
 marksman:{name:'MR-8 Longshot',category:'SCHARFSCHÜTZENGEWEHR',description:'Ein Treffer. 100 Schaden. 4×-Zielfernrohr und kräftiger Rückstoß.',damage:100,interval:1400,magazine:8,reload:1900,recoil:.095,spread:.04,aimSpread:0,aimFov:25.8,color:0x88aaff}
} as const;
export type WeaponId=keyof typeof weapons;
export const isWeapon=(v:unknown):v is WeaponId=>typeof v==='string'&&Object.hasOwn(weapons,v);
// Spread is sampled by the match authority, never supplied by the client.
export function shotSpread(id:WeaponId,aiming:boolean,moving:boolean,airborne:boolean){
 const w=weapons[id];return (aiming?w.aimSpread:w.spread)*(moving?1.6:1)*(airborne?2:1);
}
export function spreadAngles(spread:number,random:()=>number=Math.random){
 const radius=Math.sqrt(random())*spread,angle=random()*Math.PI*2;
 return {yaw:Math.cos(angle)*radius,pitch:Math.sin(angle)*radius};
}
