// Local input is rendered immediately. Only corrections to an acknowledged
// position are applied; an old echo must never pull newer movement backwards.
function Connect() {
  this.socket = new GameSocket();
  connectionStatus('Connecting…');
  this.reset();
  this.socket.on('connect', function() {
    this.reset();
    this.socket.emit('init', name);
  }.bind(this));
  this.socket.on('init', connectHandler.bind(this));
  this.socket.on('disconnect', disconnectHandler.bind(this));
  this.socket.on('e', eventHandler.bind(this));
  window.onbeforeunload = function() { this.socket.close(); }.bind(this);
}

Connect.prototype.reset = function() {
  this.stateQueue = {};
  this.sequence = 0;
  this.lastAck = 0;
  this.lastServerSequence = 0;
  this.pending = {};
  this.actions = {};
  this.actionSequence = 0;
  this.generation = 0;
};

Connect.prototype.pushStateEvent = function(key, data) {
  this.stateQueue[key] = data && typeof data === 'object' ? {x: data.x, y: data.y} : data;
};

Connect.prototype.predictAction = function(kind) {
  if (!user || !map || !this.socket.connected) return;
  if (kind === 'shoot' && map.ticker - user.lastShotTick < 18) return;
  var object = kind === 'shoot' ? user.shoot(map.projectiles) : user.drop(map.mines);
  if (!object) return;
  if (typeof Art !== 'undefined') Art.action(kind, user, object);
  if (kind === 'shoot') user.lastShotTick = map.ticker;
  var id = ++this.actionSequence;
  this.actions[id] = {kind: kind, object: object};
  if (!this.stateQueue.actions) this.stateQueue.actions = [];
  this.stateQueue.actions.push({id: id, kind: kind, heading: user.barrel.angle.rad});
  // Clicks are sent immediately, with the position they were rendered from.
  this.pushStateEvent('pos', user.pos);
  this.sendStateQueue();
};

Connect.prototype.sendStateQueue = function() {
  if (!user || !this.socket.connected || !Object.keys(this.stateQueue).length) return;
  var packet = this.stateQueue;
  packet.seq = ++this.sequence;
  packet.generation = this.generation;
  packet.angle = user.angle.rad;
  packet.velocity = {x: user.networkVelocity.x, y: user.networkVelocity.y};
  var position = packet.pos || user.pos;
  this.pending[packet.seq] = {x: position.x, y: position.y};
  // Bound history even during a long network stall.
  delete this.pending[packet.seq - 600];
  this.stateQueue = {};
  this.socket.emit('e', packet);
};

function connectHandler(data) {
  connectionStatus('');
  if (user) user.dispose();
  this.reset();
  this.generation = data.generation || 0;
  this.lastServerSequence = data.sequence || 0;
  map = new Map(data.boundX, data.boundY);
  if (typeof Art !== 'undefined') Art.reset();
  map.addWallBorders();
  map.players[data.id] = user = new User(data.id, data.pos.x, data.pos.y);
  user.lastShotTick = -18;
  user.name = name;
  user.color = data.players[data.id] && data.players[data.id].color;
  user.addCamera(window.innerWidth, window.innerHeight);
  user.camera.translate(user.pos.x, user.pos.y, map.width, map.height);
  for (var id in data.players) {
    if (id === user.id) continue;
    var ref = data.players[id];
    var player = map.players[id] = new Player(id, ref.pos.x, ref.pos.y, ref.angle);
    player.barrel.setAngle(ref.heading || 0);
    player.name = ref.name || 'Player';
    player.score = ref.score || 0;
    player.color = ref.color;
  }
  data.walls.forEach(function(wall) {
    var object = new Wall(wall.pos.x, wall.pos.y, wall.width, wall.height);
    object.material = wall.material;
    map.walls.push(object);
  });
  for (var pid in data.projectiles) addActionObject('shoot', data.projectiles[pid]);
  for (var mid in data.mines) addActionObject('mine', data.mines[mid]);
  drawLeaderboard(user.id, data.leaderboard);
  if (data.players[data.id]) user.score = data.players[data.id].score || 0;
  drawScore(user.score);
  startAnimation();
}

function disconnectHandler() {
  connectionStatus('Connection lost. Reconnecting…');
  if (user) user.dispose();
  stopAnimation();
  user = undefined;
  map = undefined;
  this.reset();
}

function connectionStatus(message) {
  var element = document.getElementById('connection-status');
  if (element) {
    element.textContent = message;
    element.hidden = !message;
  }
}

function addActionObject(kind, ref) {
  var objects = kind === 'shoot' ? map.projectiles : map.mines;
  if (objects[ref.id]) return objects[ref.id];
  var object = kind === 'shoot' ?
    new Projectile(ref.pid, ref.pos.x, ref.pos.y, ref.angle, ref.speed) :
    new Mine(ref.pid, ref.pos.x, ref.pos.y);
  object.id = ref.id;
  if (ref.velocity) object.velocity.set(ref.velocity.x, ref.velocity.y);
  if (kind === 'shoot') object.bounceCount = ref.bounceCount || 0;
  if (kind !== 'shoot') {
    // Durations avoid depending on synchronized client/server wall clocks.
    object.countdownTime = Date.now() + ref.countdown;
    object.explodeTime = Date.now() + ref.expires;
  }
  objects[object.id] = object;
  var owner = map.players[ref.pid];
  if (owner) (kind === 'shoot' ? owner.projectiles : owner.mines).push(object);
  return object;
}

function eventHandler(packet) {
  if (!map || !user || !packet || packet.sequence <= this.lastServerSequence) return;
  this.lastServerSequence = packet.sequence;
  var changes = packet.players, leaderboard;
  if (!changes) return;
  for (var id in changes) {
    var change = changes[id], player = map.players[id];
    if (change.leaderboard) leaderboard = change.leaderboard;
    if (change.disconnect !== undefined) { map.removePlayer(id); continue; }
    if (!player && change.pos) player = map.players[id] = new Player(id, change.pos.x, change.pos.y);
    if (!player) continue;
    if (change.name !== undefined) player.name = change.name;
    if (change.color !== undefined) player.color = change.color;
    if (change.score !== undefined) {
      player.score = change.score;
      if (id === user.id) drawScore(player.score);
    }
    if (id === user.id) {
      if (change.generation > this.generation) {
        if (typeof Art !== 'undefined') { Art.burst(player.pos.x, player.pos.y, 'blast'); GameAudio.play('hit'); }
        this.generation = change.generation;
        this.pending = {};
        this.stateQueue = {};
        player.setPos(change.pos.x, change.pos.y);
        player.offset.set(0, 0);
      } else if (change.generation === this.generation && change.ack > this.lastAck) {
        var sent = this.pending[change.ack];
        if (sent && change.pos) {
          var dx = change.pos.x - sent.x, dy = change.pos.y - sent.y;
          player.movePos(dx, dy);
          // Rebase newer predictions so the same correction is not applied
          // repeatedly as the remaining in-flight inputs are acknowledged.
          for (var pendingSeq in this.pending) {
            if (+pendingSeq > change.ack) {
              this.pending[pendingSeq].x += dx;
              this.pending[pendingSeq].y += dy;
            }
          }
        }
      }
      if (change.ack > this.lastAck) {
        this.lastAck = change.ack;
        for (var seq in this.pending) if (+seq <= change.ack) delete this.pending[seq];
      }
      player.camera.translate(player.pos.x, player.pos.y, map.width, map.height);
    } else if (change.pos) {
      player.snapshots = player.snapshots || [];
      player.snapshots.push({time: performance.now(), x: change.pos.x, y: change.pos.y,
        angle: change.angle === undefined ? player.angle.rad : change.angle,
        heading: change.heading === undefined ? player.barrel.angle.rad : change.heading,
        velocity: change.velocity || {x: 0, y: 0}, hit: change.hit});
      if (player.snapshots.length > 10) player.snapshots.shift();
      if (change.hit) {
        if (typeof Art !== 'undefined') { Art.burst(player.pos.x, player.pos.y, 'blast'); GameAudio.play('hit'); }
        player.snapshots = [player.snapshots[player.snapshots.length - 1]]; player.setPos(change.pos.x, change.pos.y);
      }
    } else if (change.heading !== undefined) player.barrel.setAngle(change.heading);

    (change.actions || []).forEach(function(action) {
      var predicted = id === user.id && this.actions[action.id];
      if (predicted) {
        // Preserve the already moving projectile instead of spawning its echo.
        var objects = predicted.kind === 'shoot' ? map.projectiles : map.mines;
        if (!action.object) {
          if (predicted.kind === 'shoot') map.removeProjectile(predicted.object.id);
          else map.removeMine(predicted.object.id);
        } else if (objects[predicted.object.id]) {
          delete objects[predicted.object.id];
          predicted.object.id = action.object.id;
          objects[predicted.object.id] = predicted.object;
        }
        delete this.actions[action.id];
      } else if (action.object) {
        var object = addActionObject(action.kind, action.object);
        if (typeof Art !== 'undefined') Art.action(action.kind, player, object);
      }
    }, this);
  }
  if (leaderboard) drawLeaderboard(user.id, leaderboard);
}

// Interpolate remote players at the display refresh rate, with at most 100ms
// of extrapolation during jitter. Local controls never wait in this buffer.
function renderRemotePlayers(now) {
  for (var id in map.players) {
    var player = map.players[id], samples = player.snapshots;
    if (player === user || !samples || !samples.length) continue;
    var time = now - 50;
    while (samples.length > 2 && samples[1].time <= time) samples.shift();
    var a = samples[0], b = samples[1] || a;
    var alpha = b.time > a.time ? Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time))) : 1;
    var extra = Math.max(0, Math.min(100, time - b.time)) / (1000 / 60);
    player.setPos(a.x + (b.x - a.x) * alpha + b.velocity.x * extra,
      a.y + (b.y - a.y) * alpha + b.velocity.y * extra);
    var angle = Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle));
    player.setAngle(a.angle + angle * alpha);
    player.barrel.setAngle(b.heading);
  }
}
