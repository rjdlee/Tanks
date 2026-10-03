const createMatch=require('./match');

function room(mode){
  let handler;const sent=[];const hub={on:(event,fn)=>handler=fn,sockets:{emit:(event,packet)=>sent.push(packet)}};
  const match=createMatch(hub,mode);
  function join(id){const listeners={},initial=[];handler({id,on:(event,fn)=>listeners[event]=fn,emit:(event,data)=>initial.push(data)});return {send:data=>listeners.e(data),rename:data=>listeners.init(data),disconnect:()=>listeners.disconnect(),initial};}
  return {match,join,sent};
}
it('processes unique input steps, rejects forged kills, and isolates old mission input',()=>{
  const r=room('coop');try{
    const a=r.join('a');r.join('b');const b=r.match.battle;b.phase='active';b.walls=[];b.players.a.setPos(200,425);
    const input={epoch:b.epoch,commands:[{seq:1,x:1,y:0,heading:Math.PI,mine:true}]};a.send(input);const x=b.players.a.pos.x;
    a.send(input);expect(b.players.a.pos.x).toBe(x);expect(b.players.a.mines.length).toBe(1);
    a.send({epoch:b.epoch,hit:'b',score:999,pos:{x:9999,y:9999}});expect(b.players.a.score).toBe(0);expect(b.players.b.alive).toBe(true);
    b.loadMission(2);a.send(input);expect(b.players.a.mines.length).toBe(0);expect(b.players.a.controlTick).toBe(0);
  }finally{r.match.stop();}
});
it('bounds command bursts and makes a room empty before starting a fresh campaign',()=>{
  const r=room('coop');try{
    const a=r.join('a'),b=r.join('b');r.match.battle.phase='active';r.match.battle.walls=[];
    a.send({epoch:r.match.battle.epoch,commands:Array.from({length:1000},(_,i)=>({seq:i+1,x:1,y:0,heading:0}))});expect(r.match.battle.players.a.controlTick).toBeLessThanOrEqual(18);
    r.match.battle.mission=42;a.disconnect();expect(r.match.battle.phase).toBe('waiting');b.disconnect();expect(r.match.battle.mission).toBe(1);expect(r.match.battle.humans().length).toBe(0);
  }finally{r.match.stop();}
});
