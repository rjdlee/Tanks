// Artwork is independent of simulation: cached terrain and rotating toy sprites.
var Art = (function() {
  var colors = ['#1aa6a2', '#ed715a', '#eebc35', '#a87bce'];
  var tanks = new Image(), props = new Image(), wood = new Image(), terrain, scene;
  var effects = [], tracks = [], previousShots = {}, visualSequence = 0, sceneRevision = -1, npcSprites = {};
  tanks.src = 'assets/tanks.webp'; props.src = 'assets/arena.webp'; wood.src = 'assets/wood.webp';
  tanks.onload = function() { npcSprites = {};document.querySelectorAll('.tank-avatar').forEach(function(canvas) { avatar(canvas, canvas.dataset.player); }); };
  props.onload = wood.onload = function() { terrain = null; };
  function colorIndex(id) { if (typeof map !== 'undefined' && map && map.players[id] && map.players[id].color !== undefined) return map.players[id].color; var hash = 0; id = String(id || ''); for (var i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0; return (hash >>> 0) % 4; }
  function round(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
  function ball(ctx, x, y, r, color) {
    var gradient = ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);
    gradient.addColorStop(0,'#fff5df'); gradient.addColorStop(.24,color); gradient.addColorStop(1,'#37372c');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function tank(ctx, x, y, angle, heading, id, shadow) {
    var index = colorIndex(id), cy = [185, 474, 764, 1054][index];
    var character = typeof map !== 'undefined' && map && map.players[id], type = character && character.npc && character.type;
    ctx.save(); ctx.translate(x, y);
    if (shadow) { ctx.fillStyle='#5c401d35';ctx.beginPath();ctx.ellipse(7,9,34,20,angle,0,Math.PI*2);ctx.fill(); }
    ctx.save();ctx.rotate(angle);
    if (tanks.complete && tanks.naturalWidth) {
      if(type)ctx.drawImage(npcSprite(type,'body'),-30,-19,60,38);
      else ctx.drawImage(tanks,148,cy-135,430,270,-30,-19,60,38);
    }
    else {round(ctx,-28,-17,56,10,4,'#343637');round(ctx,-28,7,56,10,4,'#343637');round(ctx,-25,-12,50,24,5,colors[index]);}
    ctx.restore();ctx.rotate(heading);
    // The cannon reaches the same world coordinate as the simulation's muzzle.
    if (tanks.complete && tanks.naturalWidth) {
      if(type){ctx.drawImage(npcSprite(type,'cannon'),-55,-7,42,14);ctx.drawImage(npcSprite(type,'turret'),-17,-16,35,32);}
      else {ctx.drawImage(tanks,738,cy-40,143,80,-55,-7,42,14);ctx.drawImage(tanks,850,cy-105,230,210,-17,-16,35,32);}
    } else {round(ctx,-54,-4,45,8,3,colors[index]);ball(ctx,0,0,15,colors[index]);ball(ctx,0,0,5,'#535957');}
    ctx.restore();
  }
  function npcSprite(type,part) {
    var key=type+':'+part;if(npcSprites[key])return npcSprites[key];
    var source=part==='body'?[148,50,430,270,60,38]:part==='cannon'?[738,145,143,80,42,14]:[850,80,230,210,35,32];
    var canvas=document.createElement('canvas');canvas.width=source[4];canvas.height=source[5];var ctx=canvas.getContext('2d');
    ctx.drawImage(tanks,source[0],source[1],source[2],source[3],0,0,canvas.width,canvas.height);
    var color=ClassicRules.types[type].color,rgb=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16)];
    var pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
    for(var i=0;i<data.length;i+=4){if(!data[i+3])continue;var shade=(data[i]*.21+data[i+1]*.72+data[i+2]*.07)/145;
      for(var channel=0;channel<3;channel++)data[i+channel]=Math.min(255,rgb[channel]*shade+(shade>1?(shade-1)*45:0));}
    ctx.putImageData(pixels,0,0);npcSprites[key]=canvas;return canvas;
  }
  function avatar(canvas,id) {
    if (!canvas) return; var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(canvas.width/2,canvas.height/2+7);ctx.scale(1.25,1.25);tank(ctx,0,0,-Math.PI/2,Math.PI/2,id,false);ctx.restore();
  }
  function block(ctx,x,y,w,h,material) {
    if (props.complete && props.naturalWidth) {
      if (material === 'pit') ctx.drawImage(props,90,675,540,525,x-w*.035,y-h*.035,w*1.16,h*1.14);
      else if (material === 'crate') ctx.drawImage(props,705,90,510,535,x-w*.063,y-h*.05,w*1.275,h*1.34);
      else ctx.drawImage(props,90,95,510,530,x-w*.048,y-h*.036,w*1.21,h*1.25);
    } else {
      ctx.save();ctx.shadowColor='#63431960';ctx.shadowBlur=12;ctx.shadowOffsetX=7;ctx.shadowOffsetY=12;
      round(ctx,x,y,w,h,5,material === 'pit' ? '#3e3027' : material === 'crate' ? '#b57c49' : '#f4e7ce');ctx.restore();
    }
  }

  function buildTerrain(map) {
    terrain=document.createElement('canvas');var density=Math.min(window.devicePixelRatio || 1,2);terrain.width=Math.ceil(map.width*density);terrain.height=Math.ceil(map.height*density);
    var ctx=terrain.getContext('2d');ctx.scale(density,density);ctx.fillStyle='#deb27c';ctx.fillRect(0,0,map.width,map.height);
    if (wood.complete && wood.naturalWidth) ctx.drawImage(wood,0,0,map.width,map.height);
    map.walls.forEach(function(wall) {
      var x=wall.pos.x-wall.width/2,y=wall.pos.y-wall.height/2;
      if (wall.material === 'pit' || wall.material === 'crate') { block(ctx,x,y,wall.width,wall.height,wall.material);return; }
      var cols=Math.ceil(wall.width/50),rows=Math.ceil(wall.height/50),w=wall.width/cols,h=wall.height/rows;
      for (var row=0;row<rows;row++) for(var col=0;col<cols;col++) block(ctx,x+col*w+.5,y+row*h+.5,w-1,h-1);
    });
    scene=map;sceneRevision=map.revision;
  }
  function burst(x,y,kind,color) {effects.push({x:x,y:y,kind:kind,color:color||'#ffbd3e',start:performance.now()});if(effects.length>80)effects.shift();}
  function action(kind,player,object) {
    if (kind==='shoot') {player.recoilUntil=performance.now()+120;burst(object.pos.x,object.pos.y,'spark',colors[colorIndex(player.id)]);}
    if (typeof GameAudio!=='undefined') GameAudio.play(kind);
  }
  function reset() {terrain=null;scene=null;effects=[];tracks=[];previousShots={};}
  function draw(context,terrainContext,map,user,width,height) {
    if(scene!==map || !terrain || sceneRevision!==map.revision) buildTerrain(map);
    var camera=user.camera,scale=camera.scale||1,ox=camera.offsetX||0,oy=camera.offsetY||0;
    terrainContext.clearRect(0,0,width,height);terrainContext.save();terrainContext.translate(ox,oy);terrainContext.scale(scale,scale);terrainContext.translate(-camera.pos.x,-camera.pos.y);terrainContext.drawImage(terrain,0,0,map.width,map.height);terrainContext.restore();
    context.clearRect(0,0,width,height);context.save();context.translate(ox,oy);context.scale(scale,scale);context.translate(-camera.pos.x,-camera.pos.y);
    var now=performance.now();
    for(var id in map.players) {
      var player=map.players[id],last=player.artTrack;
      if(player.alive===false)continue;
      if(!last || Math.hypot(player.pos.x-last.x,player.pos.y-last.y)>12) {
        if(last && Math.hypot(player.pos.x-last.x,player.pos.y-last.y)<80) tracks.push({x:player.pos.x,y:player.pos.y,angle:player.angle.rad,time:now});
        player.artTrack={x:player.pos.x,y:player.pos.y};
      }
    }
    tracks=tracks.filter(function(track){return now-track.time<9000;}).slice(-650);
    tracks.forEach(function(track){context.save();context.translate(track.x,track.y);context.rotate(track.angle);context.globalAlpha=.12*(1-(now-track.time)/9000);context.fillStyle='#715936';context.fillRect(-3,-17,5,6);context.fillRect(-3,11,5,6);context.restore();});
    for(var mid in map.mines) {
      var mine=map.mines[mid],armed=Date.now()>=mine.countdownTime;
      if(armed) {
        if(!mine.artExploded){mine.artExploded=true;burst(mine.pos.x,mine.pos.y,'blast');GameAudio.play('explode');}
        // The halo represents the actual 25-unit blast radius, including its entire lifetime.
        var blastRadius=map.mode?ClassicRules.blastRadius:25;
        context.fillStyle='#f7a83920';context.strokeStyle='#f3a32966';context.lineWidth=1.5;context.beginPath();context.arc(mine.pos.x,mine.pos.y,blastRadius,0,Math.PI*2);context.fill();context.stroke();
      } else {
        if (props.complete && props.naturalWidth) context.drawImage(props,760,780,385,375,mine.pos.x-13,mine.pos.y-13,26,25);
        else ball(context,mine.pos.x,mine.pos.y,10,'#62615b');
        if (Math.sin(now/110)>.5) {context.fillStyle='#ffdd7766';context.beginPath();context.arc(mine.pos.x,mine.pos.y-3,3,0,Math.PI*2);context.fill();}
      }
    }
    var currentShots={};
    for(var pid in map.projectiles) {
      var shot=map.projectiles[pid],color=colors[colorIndex(shot.pid)];
      var key=shot.artKey || (shot.artKey=++visualSequence),prior=previousShots[key];
      // Read only: effects never mutate the simulation or network action identity.
      if(prior && prior.bounce!==shot.bounceCount){burst(shot.pos.x,shot.pos.y,'spark');GameAudio.play('bounce');}
      currentShots[key]={x:shot.pos.x,y:shot.pos.y,bounce:shot.bounceCount};
      var vx=shot.velocity.x,vy=shot.velocity.y;
      for(var i=5;i>0;i--){context.fillStyle='rgba(255,247,220,'+(.05+(5-i)*.035)+')';context.beginPath();context.arc(shot.pos.x-vx*i*1.6,shot.pos.y-vy*i*1.6,2+i*.8,0,Math.PI*2);context.fill();}
      context.save();context.shadowColor='#69513c60';context.shadowBlur=3;context.shadowOffsetY=3;ball(context,shot.pos.x,shot.pos.y,5.5,color);context.restore();
    }
    for(var missing in previousShots) if(!currentShots[missing]) burst(previousShots[missing].x,previousShots[missing].y,'spark');
    previousShots=currentShots;
    for(var playerID in map.players) {
      var p=map.players[playerID];
      if(p.alive===false){context.strokeStyle='#70563980';context.lineWidth=3;context.beginPath();context.moveTo(p.pos.x-9,p.pos.y-9);context.lineTo(p.pos.x+9,p.pos.y+9);context.moveTo(p.pos.x+9,p.pos.y-9);context.lineTo(p.pos.x-9,p.pos.y+9);context.stroke();continue;}
      if(p.npc&&p.type==='white'&&map.ticker>p.visibleUntil)continue;
      tank(context,p.pos.x,p.pos.y,p.angle.rad,p.barrel.angle.rad,playerID,true);
      if(p.protectedUntil>map.ticker){context.strokeStyle='#a8e5ff';context.lineWidth=2;context.beginPath();context.arc(p.pos.x,p.pos.y,38,0,Math.PI*2);context.stroke();}
      if(p===user){context.strokeStyle='#ffffffa0';context.lineWidth=1.3;context.beginPath();context.arc(p.pos.x,p.pos.y,34,Math.PI*.15,Math.PI*.85);context.stroke();}
    }
    effects=effects.filter(function(effect){return now-effect.start<(effect.kind==='blast'?750:230);});
    effects.forEach(function(effect){
      var duration=effect.kind==='blast'?750:230,t=(now-effect.start)/duration;
      context.save();context.translate(effect.x,effect.y);context.globalAlpha=1-t;
      if(effect.kind==='blast') {
        var size=25+Math.sin(t*Math.PI)*18;
        ['#ee733b','#ffad37','#ffe164','#fff2a1'].forEach(function(color,index){context.fillStyle=color;context.beginPath();for(var i=0;i<20;i++){var a=i*Math.PI/10,r=size*(i%2?.6:1)*(1-index*.19);context.lineTo(Math.cos(a)*r,Math.sin(a)*r);}context.closePath();context.fill();});
        for(var i=0;i<8;i++){var a=i*Math.PI/4;ball(context,Math.cos(a)*(20+t*36),Math.sin(a)*(20+t*36),3*(1-t),'#ffb637');}
      } else {
        context.strokeStyle='#fff4a5';context.lineWidth=2;for(var i=0;i<7;i++){var a=i*Math.PI*2/7;context.beginPath();context.moveTo(Math.cos(a)*3,Math.sin(a)*3);context.lineTo(Math.cos(a)*(8+t*15),Math.sin(a)*(8+t*15));context.stroke();}
      }
      context.restore();
    });
    context.restore();
    if(typeof updateMineInventory==='function') updateMineInventory();
  }
  return {draw:draw,avatar:avatar,reset:reset,action:action,burst:burst,colorIndex:colorIndex};
})();
