import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {randomBytes} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {Match} from './match.js';
import {Bot} from './bot.js';
const bots=new Map<string,Bot>();
import {validInput,type Input} from '../shared/game.js';
const root=resolve('dist');
const http=createServer(async(req,res)=>{try{const path=new URL(req.url||'/','http://localhost').pathname;if(path==='/health'){res.end('ok');return;}const file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+'/')&&!file.startsWith(root+'\\')){res.writeHead(403).end();return;}const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'} as Record<string,string>)[extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end('Not found');}});
const wss=new WebSocketServer({server:http,path:'/ws',maxPayload:2048});
type Peer={ws:WebSocket,id:string,room?:string,queue:Input[],last:number,tokens:number,at:number,alive:boolean};
const rooms=new Map<string,Match>(),peers=new Map<string,Peer>();
function send(p:Peer,v:unknown){if(p.ws.readyState===WebSocket.OPEN&&p.ws.bufferedAmount<65536)p.ws.send(JSON.stringify(v));}
wss.on('connection',(ws,req)=>{
 if(process.env.ALLOWED_ORIGIN&&req.headers.origin!==process.env.ALLOWED_ORIGIN){ws.close(1008,'Origin');return;}
 if(peers.size>=200){ws.close(1013,'Capacity');return;}
 const p:Peer={ws,id:randomBytes(8).toString('hex'),queue:[],last:-1,tokens:150,at:Date.now(),alive:true};peers.set(p.id,p);send(p,{type:'hello',id:p.id});ws.on('pong',()=>p.alive=true);
 ws.on('message',raw=>{const now=Date.now();p.tokens=Math.min(150,p.tokens+(now-p.at)*.09);p.at=now;if(--p.tokens<0){ws.close(1008,'Zu viele Nachrichten');return;}try{const m=JSON.parse(raw.toString());if(m.type==='ping'){send(p,{type:'pong',at:m.at});return;}
 if(m.type==='create'||m.type==='join'||m.type==='bot'){
 if(p.room)throw Error('Du bist bereits in einem Raum.');if(m.type==='bot'&&m.difficulty!==undefined&&!['easy','medium','hard'].includes(m.difficulty))throw Error('Ungültige Schwierigkeit.');let code:string;
 if(m.type==='create'||m.type==='bot'){do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));rooms.set(code,new Match());}else{if(typeof m.code!=='string'||!/^[A-F0-9]{6}$/i.test(m.code))throw Error('Ungültiger Raumcode.');code=m.code.toUpperCase();}
 const r=rooms.get(code);if(!r)throw Error('Raum wurde nicht gefunden.');r.add(p.id);p.room=code;if(m.type==='bot'){r.add('bot');bots.set(code,new Bot(m.difficulty??'easy'));r.ready('bot',now);r.ready(p.id,now);}send(p,{type:'joined',code,bot:m.type==='bot',difficulty:bots.get(code)?.difficulty});return;}
 const r=p.room?rooms.get(p.room):undefined;if(!r)return;
 if(m.type==='ready'){if(bots.has(p.room!))r.ready('bot',now);r.ready(p.id,now);return;}
 if(m.type==='input'){if(!validInput(m.input))throw Error('Ungültige Eingabe.');if(m.input.seq<=p.last)return;p.last=m.input.seq;if(p.queue.length<12)p.queue.push(m.input);}
 }catch(e){send(p,{type:'error',message:e instanceof Error?e.message:'Ungültige Nachricht'});}});
 ws.on('error',()=>{});ws.on('close',()=>{peers.delete(p.id);if(p.room){const r=rooms.get(p.room);if(r){if(bots.has(p.room)){bots.delete(p.room);rooms.delete(p.room);return;}r.players=r.players.filter(q=>q.id!==p.id);r.phase='waiting';r.players.forEach(q=>{q.ready=false;const peer=peers.get(q.id);if(peer)send(peer,{type:'left',message:'Gegner hat die Verbindung getrennt. Lade einen neuen Gegner ein.'});});if(!r.players.length)rooms.delete(p.room);}}});
});
let tick=0;setInterval(()=>{const now=Date.now();tick++;for(const [code,r]of rooms){const inputs=new Map<string,Input>();for(const p of peers.values())if(p.room===code){const i=p.queue.shift();if(i)inputs.set(p.id,i);}const bot=bots.get(code);if(bot&&r.phase==='playing'){const player=r.players.find(q=>q.id==='bot'),target=r.players.find(q=>q.id!=='bot');if(player&&target)inputs.set('bot',bot.input(player,target,now));}r.tick(now,inputs);if(tick%3===0||r.events.length){const msg={type:'state',now,phase:r.phase,endAt:r.endAt,round:r.round,roundWinner:r.roundWinner,nextRoundAt:r.nextRoundAt,difficulty:bot?.difficulty,winner:r.winner,players:r.players,events:r.events};for(const p of peers.values())if(p.room===code)send(p,msg);r.events=[];}}},1000/60);
setInterval(()=>{for(const p of peers.values()){if(!p.alive)p.ws.terminate();else{p.alive=false;p.ws.ping();}}},10000);
http.listen(Number(process.env.PORT||3001),process.env.HOST||'0.0.0.0',()=>console.log('RIFT DUEL server ready on port '+(process.env.PORT||3001)));

