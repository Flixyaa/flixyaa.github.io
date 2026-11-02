// TURN credentials must be scoped for browser use, never an account/admin API key.
const stun:RTCIceServer={urls:'stun:stun.l.google.com:19302'};

export function parseIceServers(value:unknown):RTCIceServer[]{
 if(!Array.isArray(value)||value.length>20)throw Error('Ungültige Relay-Konfiguration.');
 return value.map(entry=>{
  if(!entry||typeof entry!=='object')throw Error('Ungültige Relay-Konfiguration.');
  const urls=typeof entry.urls==='string'?[entry.urls]:entry.urls;
  if(!Array.isArray(urls)||!urls.length||!urls.every((url:unknown)=>typeof url==='string'&&/^(stun|stuns|turn|turns):[^\s]+$/.test(url)))throw Error('Ungültige Relay-Adresse.');
  const relay=urls.some((url:string)=>/^turns?:/.test(url));
  if(relay&&(typeof entry.username!=='string'||!entry.username||typeof entry.credential!=='string'||!entry.credential))throw Error('Dem Relay fehlen Zugangsdaten.');
  return {urls,...(relay?{username:entry.username,credential:entry.credential}:{})};
 });
}

async function readJson(url:string,optional=false):Promise<any>{
 const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),8000);
 try{
  const response=await fetch(url,{signal:abort.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(optional&&response.status===404)return {};
  if(!response.ok)throw Error();return await response.json();
 }catch{throw Error('Relay-Konfiguration nicht erreichbar. Bitte erneut versuchen. [TURN-CONFIG]');}
 finally{clearTimeout(timer);}
}

export async function loadPeerConfig(url:string):Promise<RTCConfiguration>{
 const settings=await readJson(url,true);
 let servers=parseIceServers(settings.iceServers??[]);
 if(settings.credentialsUrl!==undefined){
  if(typeof settings.credentialsUrl!=='string'||!settings.credentialsUrl.startsWith('https://'))throw Error('Der Relay-Dienst benötigt eine HTTPS-Adresse.');
  servers=parseIceServers(await readJson(settings.credentialsUrl));
  if(!servers.some(server=>(typeof server.urls==='string'?[server.urls]:server.urls).some(url=>/^turns?:/.test(url))))throw Error('Der Relay-Dienst hat keine TURN-Server geliefert.');
 }
 return {iceServers:[stun,...servers],iceTransportPolicy:'all'};
}

export function hasRelay(config:RTCConfiguration){
 return config.iceServers?.some(server=>(typeof server.urls==='string'?[server.urls]:server.urls).some(url=>/^turns?:/.test(url)))??false;
}
