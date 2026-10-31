export const weapons={
 rifle:{name:'AK-47',category:'STURMGEWEHR',description:'Kontrollierte Feuerstöße. Eigenes Kobra-Chevron-Visier für präzise Treffer.',damage:25,interval:110,magazine:24,reload:1400,recoil:.012,spread:.004,aimSpread:.001,aimFov:62,color:0x41e6c5},
 smg:{name:'MP5',category:'MASCHINENPISTOLE',description:'Schnelle Feuerstöße. Grünes Ring-Dot-Visier für schnelle Zielwechsel.',damage:18,interval:75,magazine:32,reload:1200,recoil:.034,spread:.035,aimSpread:.014,aimFov:68,color:0xffb44d},
 marksman:{name:'Barrett M82 .50',category:'SCHARFSCHÜTZENGEWEHR',description:'Ein Treffer. 100 Schaden. Eigenes 4×-Mil-Dot-Zielfernrohr.',damage:100,interval:1400,magazine:8,reload:1900,recoil:.095,spread:.04,aimSpread:0,aimFov:25.8,color:0x88aaff}
,
 glock:{name:'Glock 17',category:'SEKUNDÄRWAFFE',description:'Halbautomatische 9-mm-Pistole. 17 Patronen und eigenes Drei-Punkt-Visier.',damage:24,interval:180,magazine:17,reload:1150,recoil:.022,spread:.012,aimSpread:.002,aimFov:68,color:0x8be4ee},
 knife:{name:'Kampfmesser',category:'NAHKAMPF',description:'Schneller laufen. 55 Schaden im Nahkampf bis 1,8 Meter.',damage:55,interval:500,magazine:0,reload:0,recoil:0,spread:0,aimSpread:0,aimFov:85,color:0xc6d4d8}
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

export const primaryIds=['rifle','smg','marksman'] as const;
export type PrimaryId=typeof primaryIds[number];
export type WeaponSlot=1|2|3;
export const isPrimary=(v:unknown):v is PrimaryId=>typeof v==='string'&&(primaryIds as readonly string[]).includes(v);
export const slotWeapon=(primary:PrimaryId,slot:WeaponSlot):WeaponId=>slot===1?primary:slot===2?'glock':'knife';
export const freshAmmo=():Record<WeaponId,number>=>({rifle:weapons.rifle.magazine,smg:weapons.smg.magazine,marksman:weapons.marksman.magazine,glock:weapons.glock.magazine,knife:0});
