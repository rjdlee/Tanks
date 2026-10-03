// All modes share Battle. Solo is fully local; online modes replay unacknowledged
// input steps against server state, keeping controls and muzzle effects immediate.
function Gameplay(){this.keys={};this.pending=[];this.unsent=[];this.seq=0;this.lastPacket=0;this.lastEvent=0;this.paused=false;this.bound=false;this.room='';this.connected=false;}
Gameplay.prototype.start=function(mode,room){
  this.leave(false);this.mode=mode||'solo';this.room=room|| (this.mode==='coop'?this.code():'public');
  this.keys={};this.pending=[];this.unsent=[];this.seq=0;this.lastPacket=0;this.lastEvent=0;this.paused=false;this.lastSend=0;
  this.bind();getId('menu').hidden=true;getId('hud').hidden=false;getId('mission-panel').hidden=true;
  getId('invite-button').hidden=this.mode==='solo';getId('pause-button').hidden=this.mode!=='solo';
  getId('touch-controls').hidden=false;this.connected=this.mode==='solo';
  if(this.mode==='solo'){
    map=new Battle({mode:'solo'});user=map.addHuman('local',name,0);this.prepareUser();Art.reset();startAnimation();this.hud();
    connectionStatus('');return;
  }
  var params=new URLSearchParams({v:'2',mode:this.mode,room:this.room});
  this.socket=new GameSocket('/ws?'+params.toString());
  this.socket.on('connect',function(){this.socket.emit('init',{name:name});}.bind(this));
  this.socket.on('init',function(packet){this.seq=0;this.lastPacket=0;this.pending=[];this.unsent=[];this.lastEvent=0;this.id=packet.id;
    map=new Battle({mode:this.mode,authority:false});map.players={};map.revision=-1;this.connected=true;this.receive(packet);this.prepareUser();Art.reset();connectionStatus('');startAnimation();
  }.bind(this));
  this.socket.on('e',this.receive.bind(this));
  this.socket.on('disconnect',function(){this.connected=false;this.keys={};this.pending=[];this.unsent=[];connectionStatus('Connection lost. Reconnecting…');}.bind(this));
  connectionStatus('Joining '+this.mode.toUpperCase()+' room '+this.room.toUpperCase()+'…');
  var url=new URL(location.href);url.searchParams.set('mode',this.mode);url.searchParams.set('room',this.room);history.replaceState(null,'',url);
  this.joinTimer=setTimeout(function(){if(!this.connected)connectionStatus('Could not join. The room may be full. Use Menu to try another room.');}.bind(this),12000);
};
Gameplay.prototype.code=function(){var bytes=new Uint8Array(6),alphabet='abcdefghjkmnpqrstuvwxyz23456789';crypto.getRandomValues(bytes);return Array.from(bytes,function(b){return alphabet[b%alphabet.length];}).join('');};
Gameplay.prototype.prepareUser=function(){
  if(!user)return;user.camera=new Camera(user.pos.x,user.pos.y,window.innerWidth,window.innerHeight);
  user.camera.resize=function(w,h){this.screenWidth=w;this.screenHeight=h;this.scale=Math.max(.12,Math.min((w-24)/map.width,(h-142)/map.height));this.width=w/this.scale;this.height=h/this.scale;};
  user.camera.translate=function(){this.pos.set(0,0);this.offsetX=(this.screenWidth-map.width*this.scale)/2;this.offsetY=106+(this.screenHeight-142-map.height*this.scale)/2;};
  user.camera.resize(width,height);user.camera.translate();user.dispose=function(){};
  user.blurListener=function(){gameplay.keys={};gameplay.heldFire=false;gameplay.queueShoot=false;gameplay.queueMine=false;};
};
Gameplay.prototype.leave=function(showMenu){
  clearTimeout(this.joinTimer);if(this.socket){var socket=this.socket;this.socket=null;socket.close();}
  stopAnimation();this.connected=false;this.keys={};this.heldFire=false;this.queueShoot=this.queueMine=false;
  if(user&&user.dispose)user.dispose();map=undefined;user=undefined;this.id=null;
  if(showMenu!==false){getId('menu').hidden=false;getId('hud').hidden=true;getId('mission-panel').hidden=true;getId('touch-controls').hidden=true;connectionStatus('');Art.reset();
    var url=new URL(location.href);url.search='';history.replaceState(null,'',url);}
};
Gameplay.prototype.ready=function(){
  this.keys={};this.heldFire=false;if(!map||!user)return;
  if(this.paused){this.paused=false;this.hud();return;}
  if(this.mode==='solo'){map.begin(user.id);user=map.players[user.id];this.prepareUser();Art.reset();this.hud();}
  else if(this.socket&&this.connected)this.socket.emit('e',{ready:true,epoch:map.epoch});
};
Gameplay.prototype.pause=function(){if(this.mode==='solo'&&map&&map.phase==='active'){this.paused=!this.paused;this.keys={};this.heldFire=false;this.hud();}};
Gameplay.prototype.input=function(){
  var k=this.keys,x=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),y=(k.KeyS||k.ArrowDown?1:0)-(k.KeyW||k.ArrowUp?1:0);
  var heading=user.barrel.angle.rad,shoot=this.queueShoot||this.heldFire,mine=this.queueMine;
  var pads=navigator.getGamepads?navigator.getGamepads():[];
  for(var i=0;i<pads.length;i++){var pad=pads[i];if(!pad)continue;
    if(Math.hypot(pad.axes[0],pad.axes[1])>.2){x=pad.axes[0];y=pad.axes[1];}
    if(Math.hypot(pad.axes[2]||0,pad.axes[3]||0)>.25)heading=Math.atan2(-pad.axes[3],-pad.axes[2]);
    shoot=shoot||pad.buttons[7].pressed||pad.buttons[0].pressed;
    var pressed=pad.buttons[6].pressed||pad.buttons[1].pressed;mine=mine||(pressed&&!this.padMine);this.padMine=pressed;break;
  }
  this.queueShoot=this.queueMine=false;
  if(document.getElementById('help-dialog').open||this.paused)x=y=0,shoot=mine=false;
  return {seq:++this.seq,x:x,y:y,heading:heading,shoot:!!shoot,mine:!!mine};
};
Gameplay.prototype.predict=function(input,feedback){
  map.moveHuman(user,input);
  var id=user.id+':'+user.life+':'+input.seq;
  var acted=false;
  if(input.shoot){var existing=map.projectiles[id+':shoot'];if(existing&&!feedback)map.removeProjectile(existing.id);
    var shot=map.fire(user,id+':shoot');if(shot&&existing&&!feedback){map.projectiles[existing.id]=existing;user.projectiles[user.projectiles.indexOf(shot)]=existing;}
    if(shot){acted=true;if(feedback)Art.action('shoot',user,shot);}}
  if(input.mine){var prior=map.mines[id+':mine'];if(prior&&!feedback)map.removeMine(prior.id);
    var mine=map.drop(user,id+':mine');if(mine&&prior&&!feedback){map.mines[prior.id]=prior;user.mines[user.mines.indexOf(mine)]=prior;}
    if(mine){acted=true;if(feedback)Art.action('mine',user,mine);}}
  return acted;
};
Gameplay.prototype.tick=function(){
  if(!map||!user||this.paused)return;
  if(this.mode==='solo'){
    if(map.phase==='active')this.predict(this.input(),true);
    map.tick();var replacement=map.players[user.id];if(replacement&&replacement!==user){user=replacement;this.prepareUser();}
    this.effects(map.events);return;
  }
  if(!this.connected)return;
  if(map.phase==='active'&&user.alive){var input=this.input(),acted=this.predict(input,true);this.pending.push(input);this.unsent.push(input);
    if(acted)this.send(true);
    if(this.pending.length>600){this.socket.webSocket.close();return;}
  }
  map.tick();
};
Gameplay.prototype.send=function(force){
  if(!this.socket||!this.connected||!this.unsent.length)return;
  var now=performance.now();if(!force&&now-this.lastSend<45)return;this.lastSend=now;
  this.socket.emit('e',{epoch:map.epoch,commands:this.unsent.splice(0,18)});
};
Gameplay.prototype.receive=function(packet){
  if(!map||!packet||packet.sequence<=this.lastPacket||!packet.state)return;this.lastPacket=packet.sequence;
  var state=packet.state,changed=map.epoch!==state.epoch||!user||!state.players[this.id]||user.life!==state.players[this.id].life;
  if(changed){this.pending=[];this.unsent=[];this.keys={};this.heldFire=false;}
  var ack=packet.acks[this.id]||0;this.pending=this.pending.filter(function(input){return input.seq>ack;});
  var revision=map.revision;['ticker','phase','mission','title','lives','epoch','revision','width','height','countdown','elapsed','winner','ready'].forEach(function(key){map[key]=state[key];});
  if(revision!==state.revision){map.walls=state.walls.map(function(w){var object=new Wall(w.x,w.y,w.width,w.height);object.id=w.id;object.material=w.material;return object;});map.navigation=null;}
  var players={};
  Object.keys(state.players).forEach(function(id){var ref=state.players[id],player=map.players[id]||new Player(id,ref.x,ref.y,ref.angle);
    var lifeChanged=player.life!==ref.life;
    ['npc','type','name','slot','color','score','alive','life','controlTick','lastShotTick','lastMineTick','stun','driveSpeed','visibleUntil','protectedUntil','respawnAt'].forEach(function(key){player[key]=ref[key];});
    player.spec=ref.npc?ClassicRules.types[ref.type]:null;player.networkVelocity=ref.velocity||{x:0,y:0};
    if(id===this.id){player.setPos(ref.x,ref.y);player.setAngle(ref.angle);player.barrel.setAngle(ref.heading);user=player;}
    else{var now=performance.now();player._previous=lifeChanged?null:player._network;player._network={x:ref.x,y:ref.y,angle:ref.angle,heading:ref.heading,time:now,velocity:ref.velocity||{x:0,y:0}};
      if(lifeChanged||!player._previous){player.setPos(ref.x,ref.y);player.setAngle(ref.angle);player.barrel.setAngle(ref.heading);}
      if(!player.collisionBody)player.collisionBody=new Rectangle({width:60,height:38});player.collisionBody.setPos(ref.x,ref.y);player.collisionBody.setAngle(ref.angle);
    }player.projectiles=[];player.mines=[];players[id]=player;
  },this);map.players=players;
  var shots={};state.projectiles.forEach(function(s){var existing=map.projectiles[s.id],own=s.pid===this.id&&existing;
    var object=own?existing:new Rectangle({pos:{x:s.x,y:s.y},width:12,height:5,transform:{angle:s.angle}});
    ['id','pid','speed','maxBounces','life'].forEach(function(k){object[k]=s[k];});
    if(!own){object.bounceCount=s.bounceCount;object.age=s.age;object.setVelocity(s.speed);}
    shots[s.id]=object;if(players[s.pid]&&players[s.pid].life===s.life)players[s.pid].projectiles.push(object);
  },this);
  Object.keys(map.projectiles).forEach(function(id){var shot=map.projectiles[id],command=Number(id.split(':').slice(-2)[0]);if(!changed&&shot.pid===this.id&&shot.life===user.life&&command>ack&&!shots[id]){shots[id]=shot;user.projectiles.push(shot);}},this);map.projectiles=shots;
  var mines={};state.mines.forEach(function(m){var object=map.mines[m.id]||{};Object.assign(object,m);object.pos=new Vector2(m.x,m.y);
    if(object.body)object.body.setPos(m.x,m.y);
    object.countdownTime=Date.now()+Math.max(0,m.detonate-state.ticker)*1000/60;object.explodeTime=object.countdownTime+300;object.hitPlayers={};mines[m.id]=object;if(players[m.pid]&&players[m.pid].life===m.life)players[m.pid].mines.push(object);
  });Object.keys(map.mines).forEach(function(id){var mine=map.mines[id],command=Number(id.split(':').slice(-2)[0]);if(!changed&&mine.pid===this.id&&mine.life===user.life&&command>ack&&!mines[id]){mines[id]=mine;user.mines.push(mine);}},this);map.mines=mines;
  if(user&&state.phase==='active')this.pending.forEach(function(input){this.predict(input,false);},this);
  if(user&&!user.camera)this.prepareUser();this.effects(state.events);this.hud();
};
Gameplay.prototype.renderPeers=function(now){if(this.mode==='solo')return;
  Object.keys(map.players).forEach(function(id){var p=map.players[id],b=p._network,a=p._previous||b;if(p===user||!b)return;
    var t=clamp((now-b.time)/50,0,1);p.setPos(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);p.setAngle(a.angle+difference(b.angle,a.angle)*t);p.barrel.setAngle(b.heading);
  });
};
Gameplay.prototype.effects=function(events){
  (events||[]).forEach(function(e){if(e.id<=this.lastEvent)return;this.lastEvent=e.id;
    if(e.kind==='hit'){Art.burst(e.x,e.y,'blast');GameAudio.play('hit');}
    else if(e.kind==='shoot'&&e.pid!==this.id&&this.mode!=='solo')GameAudio.play('shoot');
  },this);
};
Gameplay.prototype.hud=function(){
  if(!map||!user)return;var humans=map.humans(),enemies=Object.keys(map.players).filter(function(id){return map.players[id].npc&&map.players[id].alive;}).length;
  function text(id,value){var element=getId(id);if(element.textContent!==String(value))element.textContent=value;}
  text('mode-label',this.mode==='solo'?'SOLO CAMPAIGN':this.mode==='coop'?'ONLINE CO-OP':'ONLINE PVP');
  text('mission-label',this.mode==='pvp'?Math.max(0,Math.ceil((ClassicRules.pvpDuration-map.elapsed)/60))+'s · FIRST TO 10':'MISSION '+map.mission+' / 100');
  text('lives-value',this.mode==='pvp'?humans.length+' / 8 PLAYERS':map.lives+' LIVES · '+enemies+' ENEMIES');
  text('score-value',user.score);text('shell-count',Math.max(0,ClassicRules.shellLimit-user.projectiles.length)+' / 5');
  text('room-label',this.mode==='solo'?'':this.room.toUpperCase());
  var signature=humans.map(function(p){return p.id+':'+p.name+':'+p.score;}).join('|');if(signature!==this.leaderSignature){this.leaderSignature=signature;drawLeaderboard(user.id,humans);}
  var panel=getId('mission-panel'),phase=this.paused?'paused':map.phase;
  panel.hidden=phase==='active';var title='',detail='',label='READY',canReady=true;
  if(phase==='briefing'||phase==='waiting'){
    title=this.mode==='pvp'?'Ready for battle?':'Mission '+map.mission+' · '+map.title;
    detail=this.mode==='pvp'?'One hit destroys a tank. First to 10 wins; the round lasts 3 minutes.': 'Destroy every enemy. Five shells, two mines, one hit. Watch your own ricochets.';
    if(this.mode==='coop'&&humans.length<2)detail='Share this room with a friend. Both players must be ready to begin.';
    if(this.mode==='pvp'&&humans.length<2)detail='Invite a friend or wait for another player in this room.';
    if(map.ready[user.id])label='WAITING FOR PARTNER',canReady=false;
    else label=this.mode==='solo'?'START MISSION':'READY';
  }else if(phase==='countdown'){title=String(Math.max(1,Math.ceil(map.countdown/60)));detail='Get ready!';canReady=false;}
  else if(phase==='clear'){title='Mission complete!';detail=map.mission%5===0?'Extra life! Your campaign continues.':'Both tanks return for the next mission.';label=map.mission===100?'FINISH CAMPAIGN':'NEXT MISSION';}
  else if(phase==='failed'){title='Try that mission again';detail=map.lives+' lives left. Defeated enemies stay defeated.';label='RETRY MISSION';}
  else if(phase==='over'){title=this.mode==='pvp'?(map.winner==='Draw'?'A draw!':map.winner+' wins!'):'Game over';detail=this.mode==='pvp'?'Ready up together for another round.':'Your campaign ended at mission '+map.mission+'.';label=this.mode==='pvp'?'REMATCH':'NEW CAMPAIGN';}
  else if(phase==='complete'){title='100 missions cleared!';detail='A little tank. A very big victory.';label='NEW CAMPAIGN';}
  else if(phase==='paused'){title='Paused';detail='Take a breath. Your mission is waiting.';label='RESUME';}
  if(phase==='active'&&!user.alive){panel.hidden=false;title=this.mode==='pvp'?'Tank destroyed':'Your partner can still do it';detail=this.mode==='pvp'?'Respawning in '+Math.max(1,Math.ceil((user.respawnAt-map.ticker)/60))+'…':'Stay and watch. You return when the mission is cleared.';canReady=false;}
  if(phase!=='active'&&this.mode!=='solo'&&map.ready[user.id]&&['clear','failed','over','complete'].indexOf(phase)!==-1){label='WAITING FOR PARTNER';canReady=false;}
  text('mission-panel-title',title);text('mission-panel-detail',detail);text('mission-ready',label);getId('mission-ready').hidden=!canReady;
  var roster=getId('enemy-roster'),types=[];Object.keys(map.players).forEach(function(id){var p=map.players[id];if(p.npc&&p.alive)types.push(p.type);});
  var rosterKey=types.join(',');if(roster.dataset.roster!==rosterKey){roster.dataset.roster=rosterKey;roster.replaceChildren();types.forEach(function(type){var token=document.createElement('span');token.textContent=type;token.style.setProperty('--tank-color',ClassicRules.types[type].color);roster.append(token);});}roster.hidden=this.mode==='pvp'||phase==='active';
};
Gameplay.prototype.bind=function(){
  if(this.bound)return;this.bound=true;var self=this;
  function blocked(event){return event.target.closest&&event.target.closest('input,select,button,a,dialog,#mission-panel')||getId('help-dialog').open;}
  document.addEventListener('keydown',function(e){if(!map||blocked(e))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code)!==-1)e.preventDefault();
    self.keys[e.code]=true;if(e.code==='Space'&&!e.repeat)self.queueMine=true;if(e.code==='Escape'||e.code==='KeyP')self.pause();
  });
  document.addEventListener('keyup',function(e){delete self.keys[e.code];});
  window.addEventListener('blur',function(){self.keys={};self.heldFire=false;});
  mainCanvas.addEventListener('pointermove',function(e){if(!user)return;var camera=user.camera,x=(e.clientX-camera.offsetX)/camera.scale,y=(e.clientY-camera.offsetY)/camera.scale;
    user.barrel.setAngle(Math.atan2(user.pos.y-y,user.pos.x-x));
  });
  mainCanvas.addEventListener('pointerdown',function(e){if(!map||map.phase!=='active'||self.paused)return;
    if(e.button===2)self.queueMine=true;else self.queueShoot=true,self.heldFire=true;e.preventDefault();
    mainCanvas.dispatchEvent(new PointerEvent('pointermove',{clientX:e.clientX,clientY:e.clientY}));
  });
  window.addEventListener('pointerup',function(){self.heldFire=false;});mainCanvas.addEventListener('contextmenu',function(e){e.preventDefault();});
  getId('mission-ready').addEventListener('click',function(){GameAudio.unlock();GameAudio.play('start');self.ready();getId('mission-ready').blur();});
  getId('leave-button').addEventListener('click',function(){self.leave();});getId('pause-button').addEventListener('click',function(){self.pause();getId('pause-button').blur();});
  getId('invite-button').addEventListener('click',function(){var url=new URL(location.href);url.searchParams.set('mode',self.mode);url.searchParams.set('room',self.room);
    navigator.clipboard.writeText(url.href).then(function(){getId('invite-button').textContent='COPIED!';setTimeout(function(){getId('invite-button').textContent='INVITE';},1800);},function(){connectionStatus('Share this page URL to invite your friend. Room: '+self.room.toUpperCase());});
  });
  document.querySelectorAll('[data-drive]').forEach(function(button){button.addEventListener('pointerdown',function(e){e.preventDefault();button.setPointerCapture(e.pointerId);self.keys[button.dataset.drive]=true;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){button.addEventListener(event,function(){delete self.keys[button.dataset.drive];});});});
  getId('touch-fire').addEventListener('pointerdown',function(e){e.preventDefault();e.target.setPointerCapture(e.pointerId);self.heldFire=true;self.queueShoot=true;});
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){getId('touch-fire').addEventListener(event,function(){self.heldFire=false;});});
  getId('touch-mine').addEventListener('pointerdown',function(e){e.preventDefault();self.queueMine=true;});
};
var gameplay=new Gameplay();
