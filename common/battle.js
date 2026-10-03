var BattleMap=typeof Map!=='undefined'?Map:null, BattlePlayer=typeof Player!=='undefined'?Player:null;
var BattleWall=typeof Wall!=='undefined'?Wall:null, BattleRectangle=typeof Rectangle!=='undefined'?Rectangle:null;
var BattleVector=typeof Vector2!=='undefined'?Vector2:null, BattleCollision=typeof Collision!=='undefined'?Collision:null;
var BattleRules=typeof ClassicRules!=='undefined'?ClassicRules:null, BattleMissions=typeof Missions!=='undefined'?Missions:null;
if(typeof require!=='undefined') {
  BattleMap=require('./map');BattlePlayer=require('./player');BattleWall=require('./wall');
  BattleRectangle=require('./rectangle');BattleVector=require('./vector2');BattleCollision=require('./collision');
  BattleRules=require('./rules');BattleMissions=require('./missions');module.exports=Battle;
}
function difference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function Battle(options) {
  options=options||{};BattleMap.call(this,1350,850);
  this.mode=options.mode||'solo';this.authority=options.authority!==false;
  this.mission=1;this.lives=BattleRules.lives;this.phase='briefing';this.epoch=0;
  this.revision=0;this.events=[];this.eventId=0;this.objectId=0;this.ready={};
  this.elapsed=0;this.countdown=0;this.winner='';this.round=0;this.defeated={};
  this.randomSeed=options.seed||1297;this.loadMission(1);
}
Battle.prototype=Object.create(BattleMap.prototype);Battle.prototype.constructor=Battle;
Battle.prototype.random=function(){this.randomSeed=(this.randomSeed*1664525+1013904223)>>>0;return this.randomSeed/4294967296;};
Battle.prototype.event=function(kind,object,extra){this.events.push(Object.assign({id:++this.eventId,kind:kind,x:object.pos.x,y:object.pos.y,pid:object.id||object.pid},extra||{}));if(this.events.length>40)this.events.shift();};
Battle.prototype.humans=function(){var self=this;return Object.keys(this.players).map(function(id){return self.players[id];}).filter(function(p){return !p.npc;});};
Battle.prototype.configure=function(player,type){
  var spec=type?BattleRules.types[type]:null;
  player.npc=!!type;player.type=type||'player';player.spec=spec;player.alive=true;
  player.life=(player.life||0)+1;player.controlTick=0;player.lastShotTick=-999;player.lastMineTick=-999;
  player.stun=0;player.driveSpeed=0;player.projectiles=[];player.mines=[];player.offset.set(0,0);
  player.visibleUntil=this.ticker+120;player.nextThink=0;player.nextMine=this.ticker+240;
  player.setVelocity(0);player.networkVelocity={x:0,y:0};player.collisionBody=null;
  return player;
};
Battle.prototype.safePosition=function(player,x,y,occupied){
  var candidates=[{x:x,y:y}], radius=player.radius+4;
  for(var row=100;row<this.height-50;row+=50)for(var col=100;col<this.width-50;col+=50)candidates.push({x:col,y:row});
  candidates.sort(function(a,b){return distance(a,{x:x,y:y})-distance(b,{x:x,y:y});});
  for(var i=0;i<candidates.length;i++) {
    var pos=candidates[i];if(pos.x<50+radius||pos.x>this.width-50-radius||pos.y<50+radius||pos.y>this.height-50-radius)continue;
    var blocked=this.walls.some(function(w){var dx=Math.max(0,Math.abs(pos.x-w.pos.x)-w.width/2),dy=Math.max(0,Math.abs(pos.y-w.pos.y)-w.height/2);return dx*dx+dy*dy<radius*radius;});
    if(!blocked)blocked=(occupied||[]).some(function(p){return p.alive&&distance(p.pos,pos)<radius+p.radius+8;});
    if(!blocked){player.setPos(pos.x,pos.y);return pos;}
  }
  throw new Error('Mission has no safe tank spawn');
};
Battle.prototype.addHuman=function(id,name,slot){
  var player=this.configure(new BattlePlayer(id,0,0));player.name=String(name||'Player').slice(0,24);
  player.slot=slot===undefined?this.humans().length:slot;player.color=player.slot%4;player.score=0;
  this.players[id]=player;var board=BattleMissions.get(this.mission),spawn=player.slot%2?board.partner:board.start;
  if(this.mode==='pvp')spawn=player.slot%2?[1175,175]:[175,675];
  this.safePosition(player,spawn[0],spawn[1],Object.keys(this.players).filter(function(key){return key!==id;}).map(function(key){return this.players[key];},this));
  if(this.mode==='pvp'&&this.phase==='active')player.protectedUntil=this.ticker+90;
  return player;
};
Battle.prototype.loadMission=function(number,retry){
  var humans=this.humans(),oldWalls=this.walls,defeated=retry?this.defeated:{};
  var board=BattleMissions.get(number);this.mission=board.number;this.title=board.name;this.width=board.width;this.height=board.height;
  this.players={};this.projectiles={};this.mines={};this.walls=[];this.ready={};this.defeated=defeated;
  this.phase=this.mode==='pvp'?'waiting':'briefing';this.epoch++;this.revision++;this.elapsed=0;this.winner='';
  if(retry)this.walls=oldWalls;
  else {board.walls.forEach(function(w,i){var wall=new BattleWall(w.x,w.y,w.width,w.height);wall.material=w.material;wall.id='w'+i;this.walls.push(wall);},this);this.addWallBorders();this.walls.forEach(function(w,i){if(!w.id)w.id='border'+i;});}
  var self=this;
  humans.forEach(function(old){var player=self.addHuman(old.id,old.name,old.slot);player.score=old.score;player.life=old.life+1;});
  if(this.mode!=='pvp')board.enemies.forEach(function(spawn,i){
    var id='npc'+i;if(defeated[id])return;
    var player=self.configure(new BattlePlayer(id,0,0),spawn.type);player.name=spawn.type;player.color=0;
    self.safePosition(player,spawn.x,spawn.y,Object.keys(self.players).map(function(key){return self.players[key];}));
    player.setAngle(Math.PI);player.barrel.setAngle(0);self.players[id]=player;
  });
  this.navigation=null;
};
Battle.prototype.removeHuman=function(id){delete this.players[id];delete this.ready[id];if(this.mode==='coop'&&this.humans().length<2){this.phase='waiting';this.epoch++;}if(this.mode==='pvp'&&this.humans().length<2){this.phase='waiting';this.epoch++;}};
Battle.prototype.begin=function(id){
  if(!this.players[id]||this.players[id].npc)return false;
  if(this.phase==='clear'){
    this.ready[id]=true;if(this.mode==='coop'&&this.humans().some(function(p){return !this.ready[p.id];},this))return true;
    if(this.mission===100){this.phase='complete';this.ready={};this.epoch++;return true;}this.loadMission(this.mission+1);return true;
  }
  if(this.phase==='failed'){this.ready[id]=true;if(this.mode==='coop'&&this.humans().some(function(p){return !this.ready[p.id];},this))return true;this.loadMission(this.mission,true);return true;}
  if(this.phase==='over'||this.phase==='complete'){
    this.ready[id]=true;if(this.mode!=='solo'&&this.humans().some(function(p){return !this.ready[p.id];},this))return true;
    this.lives=BattleRules.lives;this.round++;this.humans().forEach(function(p){p.score=0;});this.loadMission(this.mode==='pvp'?this.round%20+1:1);return true;
  }
  if(this.phase!=='briefing'&&this.phase!=='waiting')return false;
  this.ready[id]=true;var required=this.mode==='solo'?1:2;
  if(this.humans().length<required||this.humans().some(function(p){return !this.ready[p.id];},this))return true;
  this.phase='countdown';this.countdown=120;
  Object.keys(this.players).forEach(function(key){this.players[key].visibleUntil=this.ticker+180;},this);return true;
};
// Directional stick movement, independent turret aim, reverse driving, and a
// short firing stop. Swept contacts keep the same no-jump movement solver.
Battle.prototype.moveHuman=function(player,input){
  if(!player||!player.alive||this.phase!=='active')return;
  player.controlTick++;if(Number.isFinite(input.heading))player.barrel.setAngle(input.heading);
  var x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1);
  if(player.stun>0){player.stun--;player.driveSpeed=0;x=y=0;}
  this.drive(player,x,y,BattleRules.moveSpeed,BattleRules.turnSpeed);
};
Battle.prototype.drive=function(player,x,y,speed,turn){
  var length=Math.hypot(x,y),oldX=player.pos.x,oldY=player.pos.y;
  if(!length){var direction=player.speed<0?-1:1;player.driveSpeed=Math.max(0,(player.driveSpeed||0)-.6);player.setVelocity(direction*player.driveSpeed);player.angle.speed=0;
    player.moveWithCollisions(player.velocity.x,player.velocity.y,this.walls,this.players);player.networkVelocity={x:player.pos.x-oldX,y:player.pos.y-oldY};return;}
  var desired=Math.atan2(y,x),delta=difference(desired,player.angle.rad),sign=1;
  if(Math.abs(delta)>Math.PI/2){desired+=Math.PI;delta=difference(desired,player.angle.rad);sign=-1;}
  player.angle.speed=clamp(delta,-turn,turn);player.setVelocity(0);
  player.rotate(this.width,this.height,this.walls,this.players);player.angle.speed=0;
  player.driveSpeed=Math.min(speed*Math.min(1,length),(player.driveSpeed||0)+.3);
  var alignment=Math.max(0,Math.cos(difference(desired,player.angle.rad)));
  player.setVelocity(sign*player.driveSpeed*alignment);
  player.moveWithCollisions(player.velocity.x,player.velocity.y,this.walls,this.players);
  player.networkVelocity={x:player.pos.x-oldX,y:player.pos.y-oldY};
};
Battle.prototype.fire=function(player,id){
  if(!player||!player.alive||this.phase!=='active')return null;
  var spec=player.spec,tick=player.npc?this.ticker:player.controlTick;
  if(tick-player.lastShotTick<(spec?spec.cooldown:BattleRules.shellCooldown)||player.projectiles.length>=(spec?spec.shells:BattleRules.shellLimit))return null;
  var angle=player.barrel.angle.rad,speed=spec?spec.shotSpeed:BattleRules.shellSpeed;
  var dir={x:-Math.cos(angle),y:-Math.sin(angle)},muzzle=55;
  var shot=new BattleRectangle({pos:player.pos,width:12,height:5,transform:{angle:angle}});
  var launch=new BattleVector(dir.x*55,dir.y*55);
  this.walls.forEach(function(w){if(w.material==='pit')return;var contact=BattleCollision.sweep(shot,w,launch);if(contact)muzzle=Math.min(muzzle,Math.max(0,contact.time*55-.01));});
  shot.movePos(dir.x*muzzle,dir.y*muzzle);
  shot.id=id||'shot'+(++this.objectId);shot.pid=player.id;shot.speed=-speed;shot.setVelocity(-speed);
  shot.bounceCount=0;shot.maxBounces=spec?spec.bounces:1;shot.age=0;shot.life=player.life;
  this.projectiles[shot.id]=shot;player.projectiles.push(shot);player.lastShotTick=tick;
  player.stun=player.npc?(spec.stun||5):BattleRules.shotStun;player.visibleUntil=this.ticker+45;player.protectedUntil=0;
  this.event('shoot',shot);return shot;
};
Battle.prototype.drop=function(player,id){
  if(!player||!player.alive||this.phase!=='active')return null;
  var limit=player.spec?player.spec.mines:BattleRules.mineLimit,tick=player.npc?this.ticker:player.controlTick;
  if(player.mines.length>=limit||tick-player.lastMineTick<BattleRules.mineCooldown)return null;
  var mine={id:id||'mine'+(++this.objectId),pid:player.id,life:player.life,pos:new BattleVector(player.pos.x,player.pos.y),born:this.ticker,
    detonate:this.ticker+BattleRules.mineFuse,exploded:false,hitPlayers:{},countdownTime:Date.now()+10000,explodeTime:Date.now()+10300};
  this.mines[mine.id]=mine;player.mines.push(mine);player.lastMineTick=tick;player.stun=Math.max(player.stun,1);this.event('mine',mine);return mine;
};
Battle.prototype.kill=function(player,owner){
  if(!this.authority||!player.alive||player.protectedUntil>this.ticker)return;
  player.alive=false;player.setVelocity(0);player.networkVelocity={x:0,y:0};player.respawnAt=this.ticker+BattleRules.respawnDelay;
  if(player.npc)this.defeated[player.id]=true;
  var killer=this.players[owner];if(killer&&killer!==player&&(this.mode==='pvp'||player.npc&&!killer.npc))killer.score++;
  this.event('hit',player,{owner:owner,npc:player.npc});
};
// Axis-aligned terrain ray for AI visibility and bank-shot planning. Tank and
// shell collision below uses continuous SAT with the actual rotated hull.
Battle.prototype.ray=function(origin,dir,limit){
  var nearest={distance:limit,normal:{x:0,y:0},wall:null};
  this.walls.forEach(function(w){if(w.material==='pit')return;
    var entry=-Infinity,exit=Infinity,normal;
    ['x','y'].forEach(function(axis){var half=axis==='x'?w.width/2:w.height/2,low=w.pos[axis]-half,high=w.pos[axis]+half;
      if(Math.abs(dir[axis])<1e-10){if(origin[axis]<low||origin[axis]>high)exit=-Infinity;return;}
      var a=(low-origin[axis])/dir[axis],b=(high-origin[axis])/dir[axis],t=Math.min(a,b);
      if(t>entry){entry=t;normal=axis==='x'?{x:dir.x>0?-1:1,y:0}:{x:0,y:dir.y>0?-1:1};}exit=Math.min(exit,Math.max(a,b));
    });
    if(entry>=.001&&entry<=exit&&entry<nearest.distance)nearest={distance:entry,normal:normal,wall:w};
  });return nearest;
};
Battle.prototype.stepShot=function(shot){
  shot.age++;if(shot.age>1800){this.removeProjectile(shot.id);return;}
  var remaining=new BattleVector(shot.velocity.x,shot.velocity.y);
  for(var iteration=0;iteration<4&&remaining.magnitude()>1e-10;iteration++){
    var hit=null,kind='',target=null;
    function consider(contact,type,object){if(contact&&(!hit||contact.time<hit.time)){hit=contact;kind=type;target=object;}}
    this.walls.forEach(function(w){if(w.material!=='pit')consider(BattleCollision.sweep(shot,w,remaining),'wall',w);});
    Object.keys(this.players).forEach(function(id){var p=this.players[id];if(!p.alive||p.protectedUntil>this.ticker)return;
      if(id===shot.pid&&shot.bounceCount===0&&shot.age<10)return;
      consider(BattleCollision.sweep(shot,p.collisionBody||p,remaining),'tank',p);
    },this);
    Object.keys(this.projectiles).forEach(function(id){if(id!==shot.id)consider(BattleCollision.sweep(shot,this.projectiles[id],remaining),'shot',this.projectiles[id]);},this);
    Object.keys(this.mines).forEach(function(id){var m=this.mines[id];if(m.exploded)return;
      if(!m.body)m.body=new BattleRectangle({pos:m.pos,width:20,height:20});consider(BattleCollision.sweep(shot,m.body,remaining),'mine',m);
    },this);
    if(!hit){shot.movePos(remaining.x,remaining.y);break;}
    shot.movePos(remaining.x*hit.time,remaining.y*hit.time);
    if(kind==='tank'){this.kill(target,shot.pid);this.removeProjectile(shot.id);return;}
    if(kind==='shot'){this.removeProjectile(target.id);this.removeProjectile(shot.id);return;}
    if(kind==='mine'){if(this.authority)this.explodeMine(target);this.removeProjectile(shot.id);return;}
    if(shot.bounceCount>=shot.maxBounces){this.removeProjectile(shot.id);return;}
    shot.bounceCount++;var n=hit.normal,dot=shot.velocity.dot(n);
    shot.velocity.subtract(2*n.x*dot,2*n.y*dot);shot.setAngle(Math.atan2(-shot.velocity.y,-shot.velocity.x));
    shot.movePos(n.x*.01,n.y*.01);remaining.set(shot.velocity.x*(1-hit.time),shot.velocity.y*(1-hit.time));
    this.event('bounce',shot);
  }
};
Battle.prototype.explodeMine=function(mine){
  if(mine.exploded)return;mine.exploded=true;mine.detonate=this.ticker;mine.countdownTime=Date.now();mine.explodeTime=Date.now()+300;this.event('blast',mine);
  Object.keys(this.players).forEach(function(id){var p=this.players[id];if(p.alive&&distance(p.pos,mine.pos)<BattleRules.blastRadius+p.radius*.65)this.kill(p,mine.pid);},this);
  Object.keys(this.projectiles).forEach(function(id){if(distance(this.projectiles[id].pos,mine.pos)<BattleRules.blastRadius)this.removeProjectile(id);},this);
  if(this.authority){var before=this.walls.length;this.walls=this.walls.filter(function(w){if(w.material!=='crate')return true;
    var dx=Math.max(0,Math.abs(w.pos.x-mine.pos.x)-w.width/2),dy=Math.max(0,Math.abs(w.pos.y-mine.pos.y)-w.height/2);return dx*dx+dy*dy>BattleRules.blastRadius*BattleRules.blastRadius;});
    if(before!==this.walls.length){this.revision++;this.navigation=null;}
    Object.keys(this.mines).forEach(function(id){var m=this.mines[id];if(!m.exploded&&distance(m.pos,mine.pos)<BattleRules.blastRadius)this.explodeMine(m);},this);
  }
};
Battle.prototype.stepMines=function(){Object.keys(this.mines).forEach(function(id){var mine=this.mines[id];
  if(mine.exploded){if(this.ticker-mine.detonate>=BattleRules.blastDuration)this.removeMine(id);return;}
  if(!this.authority)return;
  if(this.ticker-mine.born>=BattleRules.mineArm&&Object.keys(this.players).some(function(pid){var p=this.players[pid];return p.alive&&distance(p.pos,mine.pos)<60;},this))mine.detonate=Math.min(mine.detonate,this.ticker+BattleRules.mineTrigger);
  mine.countdownTime=Date.now()+Math.max(0,mine.detonate-this.ticker)*1000/60;mine.explodeTime=mine.countdownTime+300;
  if(this.ticker>=mine.detonate)this.explodeMine(mine);
},this);};
Battle.prototype.path=function(player,target){
  var size=50,columns=Math.floor(this.width/size),rows=Math.floor(this.height/size),self=this;
  if(!this.navigation){this.navigation=[];for(var y=0;y<rows;y++)for(var x=0;x<columns;x++){
    var px=x*size+size/2,py=y*size+size/2;this.navigation[y*columns+x]=!this.walls.some(function(w){return Math.abs(px-w.pos.x)<w.width/2+33&&Math.abs(py-w.pos.y)<w.height/2+33;});}}
  var start=Math.floor(player.pos.y/size)*columns+Math.floor(player.pos.x/size),end=Math.floor(target.y/size)*columns+Math.floor(target.x/size);
  var queue=[start],previous={};previous[start]=-1;var found=start,best=Infinity;
  for(var index=0;index<queue.length;index++){
    var cell=queue[index],cx=cell%columns,cy=Math.floor(cell/columns),d=Math.abs(cx-end%columns)+Math.abs(cy-Math.floor(end/columns));
    if(d<best){best=d;found=cell;}if(cell===end)break;
    [cell-1,cell+1,cell-columns,cell+columns].forEach(function(next){if(next<0||next>=columns*rows||Math.abs(next%columns-cx)+Math.abs(Math.floor(next/columns)-cy)!==1||previous[next]!==undefined||!self.navigation[next])return;previous[next]=cell;queue.push(next);});
  }
  var route=[];while(found!==start&&found!==undefined&&found!==-1){route.push({x:(found%columns)*size+size/2,y:Math.floor(found/columns)*size+size/2});found=previous[found];}return route.reverse();
};
Battle.prototype.aimPath=function(player,heading,target){
  var origin={x:player.pos.x,y:player.pos.y},dir={x:-Math.cos(heading),y:-Math.sin(heading)},remaining=2200;
  for(var bounce=0;bounce<=player.spec.bounces;bounce++){
    var wall=this.ray(origin,dir,remaining),nearest=null,along=wall.distance;
    Object.keys(this.players).forEach(function(id){var p=this.players[id];if(p===player||!p.alive)return;var dx=p.pos.x-origin.x,dy=p.pos.y-origin.y,projection=dx*dir.x+dy*dir.y;
      if(projection>20&&projection<along&&Math.abs(dx*dir.y-dy*dir.x)<22){nearest=p;along=projection;}},this);
    if(nearest)return nearest===target;
    if(!wall.wall)return false;remaining-=wall.distance;origin={x:origin.x+dir.x*wall.distance+wall.normal.x*.05,y:origin.y+dir.y*wall.distance+wall.normal.y*.05};
    var dot=dir.x*wall.normal.x+dir.y*wall.normal.y;dir={x:dir.x-2*dot*wall.normal.x,y:dir.y-2*dot*wall.normal.y};
  }return false;
};
Battle.prototype.think=function(player){
  if(!player.alive)return;var targets=this.humans().filter(function(p){return p.alive;});if(!targets.length)return;
  targets.sort(function(a,b){return distance(player.pos,a.pos)-distance(player.pos,b.pos);});var target=targets[0],spec=player.spec;
  var aim={x:target.pos.x,y:target.pos.y};if(spec.lead){aim.x+=(target.networkVelocity.x||0)*20;aim.y+=(target.networkVelocity.y||0)*20;}
  var heading=Math.atan2(player.pos.y-aim.y,player.pos.x-aim.x);
  if(spec.bank&&!this.aimPath(player,heading,target)){
    var mirrors=[{x:100-target.pos.x,y:target.pos.y},{x:2*(this.width-50)-target.pos.x,y:target.pos.y},{x:target.pos.x,y:100-target.pos.y},{x:target.pos.x,y:2*(this.height-50)-target.pos.y}];
    for(var mi=0;mi<mirrors.length;mi++){var candidate=Math.atan2(player.pos.y-mirrors[mi].y,player.pos.x-mirrors[mi].x);if(this.aimPath(player,candidate,target)){heading=candidate;break;}}
  }
  if(player.type==='brown'||player.type==='gray')heading+=Math.sin(this.ticker*.014+Number(player.id.slice(3)))*.13;
  player.barrel.setAngle(player.barrel.angle.rad+clamp(difference(heading,player.barrel.angle.rad),-spec.aim,spec.aim));
  if(this.ticker>=60&&this.aimPath(player,player.barrel.angle.rad,target))this.fire(player);
  if(!spec.speed)return;
  if(this.ticker>=player.nextThink){player.route=this.path(player,target.pos);player.nextThink=this.ticker+45;}
  var waypoint=(player.route||[])[0]||target.pos;
  if(distance(player.pos,waypoint)<24&&player.route&&player.route.length>1){player.route.shift();waypoint=player.route[0];}
  var x=waypoint.x-player.pos.x,y=waypoint.y-player.pos.y,flee=false;
  if(distance(player.pos,target.pos)<190&&player.type!=='black'){x=-x;y=-y;}
  Object.keys(this.projectiles).some(function(id){var s=this.projectiles[id];if(s.pid===player.id&&s.bounceCount===0)return false;var dx=player.pos.x-s.pos.x,dy=player.pos.y-s.pos.y,v2=s.velocity.magnitude(),time=(dx*s.velocity.x+dy*s.velocity.y)/v2;
    if(time<0||time>32||distance(player.pos,s.pos)>spec.dodge)return false;var px=dx-s.velocity.x*time,py=dy-s.velocity.y*time;
    if(Math.hypot(px,py)<48){var side=dx*s.velocity.y-dy*s.velocity.x>0?1:-1;x=s.velocity.y*side;y=-s.velocity.x*side;flee=true;return true;}return false;
  },this);
  Object.keys(this.mines).forEach(function(id){var m=this.mines[id];if(!m.exploded&&distance(player.pos,m.pos)<140){x=player.pos.x-m.pos.x;y=player.pos.y-m.pos.y;
    // A newly dropped mine shares its owner's center. Continue driving out of
    // it instead of treating the zero avoidance vector as a stop command.
    if(Math.hypot(x,y)<.01){var sign=player.speed<0?-1:1;x=Math.cos(player.angle.rad)*sign;y=Math.sin(player.angle.rad)*sign;}
    flee=true;}} ,this);
  if(player.stun>0){player.stun--;player.driveSpeed=0;x=y=0;}this.drive(player,x,y,spec.speed,spec.turn||.08);
  if(spec.mines&&this.ticker>=player.nextMine&&!flee){this.drop(player);player.nextMine=this.ticker+(player.type==='yellow'?180:420)+Math.floor(this.random()*180);}
};
Battle.prototype.tick=function(){
  this.ticker++;
  if(this.phase==='countdown'){if(--this.countdown<=0)this.phase='active';return;}
  if(this.phase!=='active')return;
  if(this.authority){Object.keys(this.players).forEach(function(id){var p=this.players[id];if(p.npc)this.think(p);},this);}
  Object.keys(this.projectiles).forEach(function(id){var shot=this.projectiles[id];if(shot)this.stepShot(shot);},this);this.stepMines();
  if(!this.authority)return;
  if(this.mode==='pvp'){
    this.elapsed++;this.humans().forEach(function(p){if(!p.alive&&this.ticker>=p.respawnAt){this.configure(p);this.safePosition(p,p.slot%2?1175:175,p.slot%2?175:675,this.humans().filter(function(other){return other!==p;}));p.protectedUntil=this.ticker+90;}},this);
    var scores=this.humans().slice().sort(function(a,b){return b.score-a.score;});
    if(scores.length&&(scores[0].score>=BattleRules.pvpTarget||this.elapsed>=BattleRules.pvpDuration)){this.phase='over';this.winner=scores.length>1&&scores[0].score===scores[1].score?'Draw':scores[0].name;this.ready={};this.epoch++;}
  }else{
    var aliveHumans=this.humans().some(function(p){return p.alive;});
    if(!aliveHumans){this.lives--;this.phase=this.lives>0?'failed':'over';this.ready={};this.epoch++;}
    else if(!Object.keys(this.players).some(function(id){return this.players[id].npc&&this.players[id].alive;},this)){
      this.phase='clear';if(this.mission%5===0)this.lives++;this.ready={};this.epoch++;
    }
  }
};
Battle.prototype.snapshot=function(){
  var self=this,players={};Object.keys(this.players).forEach(function(id){var p=self.players[id];players[id]={id:id,x:p.pos.x,y:p.pos.y,angle:p.angle.rad,heading:p.barrel.angle.rad,
    npc:p.npc,type:p.type,name:p.name,slot:p.slot,color:p.color,score:p.score,alive:p.alive,life:p.life,controlTick:p.controlTick,lastShotTick:p.lastShotTick,lastMineTick:p.lastMineTick,
    stun:p.stun,driveSpeed:p.driveSpeed,velocity:p.networkVelocity,visibleUntil:p.visibleUntil,protectedUntil:p.protectedUntil||0,respawnAt:p.respawnAt||0};});
  return {mode:this.mode,ticker:this.ticker,phase:this.phase,mission:this.mission,title:this.title,lives:this.lives,epoch:this.epoch,revision:this.revision,width:this.width,height:this.height,
    countdown:this.countdown,elapsed:this.elapsed,winner:this.winner,ready:this.ready,players:players,
    walls:this.walls.map(function(w){return {id:w.id,x:w.pos.x,y:w.pos.y,width:w.width,height:w.height,material:w.material||'cream'};}),
    projectiles:Object.keys(this.projectiles).map(function(id){var s=self.projectiles[id];return {id:s.id,pid:s.pid,x:s.pos.x,y:s.pos.y,angle:s.angle.rad,speed:s.speed,bounceCount:s.bounceCount,maxBounces:s.maxBounces,age:s.age,life:s.life};}),
    mines:Object.keys(this.mines).map(function(id){var m=self.mines[id];return {id:m.id,pid:m.pid,life:m.life,x:m.pos.x,y:m.pos.y,born:m.born,detonate:m.detonate,exploded:m.exploded};}),events:this.events};
};
