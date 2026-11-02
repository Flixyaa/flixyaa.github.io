import Peer, {type DataConnection} from 'peerjs';
import {Match} from '../server/match';
import {validInput, type Input} from '../shared/game';
import {isMap} from '../shared/maps';
import {isPrimary} from '../shared/weapons';

const prefix='rift-duel-v1-';
// The room creator runs the same match simulation as the optional Node server.
export class PeerGame {
 readyState=0; onopen:(()=>void)|null=null; onclose:(()=>void)|null=null;
 onerror:(()=>void)|null=null; onmessage:((event:{data:string})=>void)|null=null;
 private peer?:Peer; private guest?:DataConnection; private match?:Match;
 private code=''; private host=false; private joined=false;
 private queues=new Map<string,Input[]>(); private sequences=new Map<string,number>();
 private timer?:ReturnType<typeof setInterval>; private deadline?:ReturnType<typeof setTimeout>;
 constructor(){setTimeout(()=>{if(this.readyState===3)return;this.readyState=1;this.onopen?.();},0);}
 private emit(value:unknown){this.onmessage?.({data:JSON.stringify(value)});}
 private fail(message:string){this.close();this.emit({type:'error',message});}
 send(raw:string){
  if(this.readyState!==1)return;
  const message=JSON.parse(raw);
  if(message.type==='create'||message.type==='join'){if(!this.peer)this.start(message);return;}
  if(this.host)this.receive('host',message);
  else if(this.guest?.open)this.guest.send(message);
 }
 private start(message:any){
  this.host=message.type==='create';
  this.code=this.host?Array.from(crypto.getRandomValues(new Uint8Array(3)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase():String(message.code).trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(this.code)){this.fail('Bitte einen gültigen sechsstelligen Raumcode eingeben.');return;}
  if(!isPrimary(message.weapon)||!isMap(message.mapId)){this.fail('Ungültige Ausrüstung oder Map.');return;}
  this.deadline=setTimeout(()=>this.fail('Verbindung nicht möglich. Raumcode prüfen und erneut versuchen; eventuell blockiert das Netzwerk WebRTC.'),20000);
  const peer=this.peer=this.host?new Peer(prefix+this.code):new Peer();
  peer.on('error',error=>this.fail(error.type==='peer-unavailable'?'Raum nicht gefunden. Der Ersteller muss den Raum geöffnet lassen.':error.type==='unavailable-id'?'Raumcode bereits vergeben. Bitte erneut einen Raum erstellen.':'Peer-Verbindung fehlgeschlagen. Bitte erneut versuchen.'));
  peer.on('disconnected',()=>{if(this.readyState!==3)peer.reconnect();});
  peer.on('close',()=>{if(this.readyState!==3)this.fail('Die Raumverbindung wurde beendet.');});
  peer.on('connection',connection=>{
   if(!this.host||this.guest){connection.on('open',()=>{connection.send({type:'error',message:'Raum ist voll.'});setTimeout(()=>connection.close(),200);});return;}
   this.attach(connection);
  });
  peer.on('open',()=>{
   if(this.readyState===3)return;
   this.emit({type:'hello',id:this.host?'host':'guest'});
   if(this.host){
    clearTimeout(this.deadline);this.match=new Match(message.mapId);this.match.add('host',message.weapon);
    this.emit({type:'joined',code:this.code,mapId:this.match.mapId});
    let tick=0;this.timer=setInterval(()=>{
     const inputs=new Map<string,Input>();for(const [id,queue]of this.queues){const input=queue.shift();if(input)inputs.set(id,input);}
     this.match!.tick(Date.now(),inputs);if(++tick%3===0||this.match!.events.length)this.broadcast();
    },1000/60);
   }else{
    const connection=peer.connect(prefix+this.code,{reliable:true,serialization:'json'});this.attach(connection);
    connection.on('open',()=>connection.send({type:'join',weapon:message.weapon}));
   }
  });
 }
 private attach(connection:DataConnection){
  this.guest=connection;
  const handshake=setTimeout(()=>{if(this.guest===connection&&!this.joined)connection.close();},15000);
  connection.on('data',(value)=>{
   if(this.guest!==connection||this.readyState===3||!value||typeof value!=='object')return;
   const message=value as any;
   if(this.host){
    if(message.type==='join'&&!this.joined){
     if(!isPrimary(message.weapon)){connection.close();return;}
     this.match!.add('guest',message.weapon);this.joined=true;clearTimeout(handshake);
     connection.send({type:'joined',code:this.code,mapId:this.match!.mapId});this.broadcast();
    }else if(this.joined)this.receive('guest',message);
   }else{
    if(message.type==='error'){this.fail(String(message.message));return;}
    if(message.type==='joined'){this.joined=true;clearTimeout(handshake);clearTimeout(this.deadline);}
    if(['joined','state','pong','left'].includes(message.type))this.emit(message);
   }
  });
  const lost=()=>{
   clearTimeout(handshake);if(this.guest!==connection||this.readyState===3)return;
   this.guest=undefined;this.joined=false;
   if(!this.host){this.fail('Der Host hat den Raum verlassen oder die Verbindung wurde getrennt.');return;}
   this.queues.delete('guest');this.sequences.delete('guest');this.queues.get('host')?.splice(0);
   this.match!.players=this.match!.players.filter(p=>p.id==='host');this.match!.phase='waiting';
   this.match!.players.forEach(p=>p.ready=false);this.match!.events=[];
   this.emit({type:'left',message:'Gegner getrennt. Du kannst mit demselben Raumcode einen neuen Gegner einladen.'});this.broadcast();
  };
  connection.on('close',lost);connection.on('error',()=>{connection.close();lost();});
 }
 private receive(id:string,message:any){
  if(message.type==='ping'){const pong={type:'pong',at:message.at};if(id==='host')this.emit(pong);else this.guest?.send(pong);return;}
  if(!this.match)return;
  if(message.type==='ready')this.match.ready(id,Date.now());
  if(message.type==='input'&&validInput(message.input)&&message.input.seq>(this.sequences.get(id)??-1)){
   this.sequences.set(id,message.input.seq);const queue=this.queues.get(id)??[];
   if(queue.length<12)queue.push(message.input);this.queues.set(id,queue);
  }
 }
 private broadcast(){
  const m=this.match!;const state={type:'state',now:Date.now(),mapId:m.mapId,phase:m.phase,endAt:m.endAt,round:m.round,roundWinner:m.roundWinner,nextRoundAt:m.nextRoundAt,winner:m.winner,players:m.players,events:m.events};
  this.emit(state);if(this.joined&&this.guest?.open)this.guest.send(state);m.events=[];
 }
 close(){
  if(this.readyState===3)return;this.readyState=3;clearTimeout(this.deadline);clearInterval(this.timer);
  this.guest?.close();this.peer?.destroy();this.onclose?.();
 }
}
