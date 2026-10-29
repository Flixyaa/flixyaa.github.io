export const weapons={
 rifle:{name:'AR-24 Sentinel',category:'STURMGEWEHR',description:'Kontrollierte Feuerstöße. Ausgewogen auf jeder Distanz.',damage:25,interval:110,magazine:24,reload:1400,recoil:.012,color:0x41e6c5},
 smg:{name:'VX-9 Vector',category:'MASCHINENPISTOLE',description:'Hohe Feuerrate und großes Magazin für aggressive Duelle.',damage:18,interval:75,magazine:32,reload:1200,recoil:.018,color:0xffb44d},
 marksman:{name:'MR-8 Longshot',category:'PRÄZISIONSGEWEHR',description:'Zwei Treffer entscheiden. Jeder Schuss muss sitzen.',damage:55,interval:550,magazine:8,reload:1900,recoil:.045,color:0x88aaff}
} as const;
export type WeaponId=keyof typeof weapons;
export const isWeapon=(v:unknown):v is WeaponId=>typeof v==='string'&&Object.hasOwn(weapons,v);
