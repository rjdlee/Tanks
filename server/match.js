var Battle=require('../common/battle');

// Authoritative combat and AI; client input steps are replayed with the same
// movement solver used for prediction. Clients cannot report kills or scores.
module.exports=function(hub,mode){
  var battle=new Battle({mode:mode==='coop'?'coop':'pvp'}),clients={},timer=null;
  var previous=Date.now(),accumulator=0,broadcast=0,sequence=0;
  function state(id){var acks={};Object.keys(clients).forEach(function(key){acks[key]=clients[key].ack;});return {id:id,sequence:++sequence,acks:acks,state:battle.snapshot()};}
  function flush(){var packet=state();hub.sockets.emit('e',packet);}
  function step(){var now=Date.now();accumulator+=Math.min(100,now-previous);previous=now;
    while(accumulator>=1000/60){battle.tick();accumulator-=1000/60;}
    if(now-broadcast>=50){flush();broadcast=now;}
  }
  function start(){if(timer!==null)return;previous=Date.now();accumulator=0;timer=setInterval(step,1000/60);}
  function stop(){clearInterval(timer);timer=null;}
  hub.on('connection',function(socket){
    start();var slots=battle.humans().map(function(p){return p.slot;}),slot=0;while(slots.indexOf(slot)!==-1)slot++;
    var player=battle.addHuman(socket.id,'Player '+(slot+1),slot);
    if(battle.mode==='coop')battle.phase='waiting';
    var client=clients[socket.id]={ack:0,credit:12,creditAt:Date.now()};
    socket.emit('init',state(socket.id));flush();
    socket.on('init',function(data){if(data&&typeof data.name==='string')player.name=data.name.slice(0,24);flush();});
    socket.on('e',function(packet){
      if(!packet||typeof packet!=='object')return;
      if(packet.ready&&packet.epoch===battle.epoch){battle.begin(socket.id);flush();return;}
      if(packet.epoch!==battle.epoch||!Array.isArray(packet.commands))return;
      var now=Date.now();client.credit=Math.min(18,client.credit+(now-client.creditAt)*.06);client.creditAt=now;
      packet.commands.slice(0,18).forEach(function(input){
        if(!input||!Number.isSafeInteger(input.seq)||input.seq<=client.ack||client.credit<.99)return;
        if(!Number.isFinite(input.x)||!Number.isFinite(input.y)||!Number.isFinite(input.heading))return;
        client.ack=input.seq;client.credit--;player=battle.players[socket.id];
        battle.moveHuman(player,input);
        if(input.shoot)battle.fire(player,socket.id+':'+player.life+':'+input.seq+':shoot');
        if(input.mine)battle.drop(player,socket.id+':'+player.life+':'+input.seq+':mine');
      });
    });
    socket.on('disconnect',function(){delete clients[socket.id];battle.removeHuman(socket.id);
      if(!Object.keys(clients).length){stop();battle=new Battle({mode:battle.mode});}
      else flush();
    });
  });
  return {stop:stop,tick:step,snapshot:function(){return battle.snapshot();},get battle(){return battle;}};
};
