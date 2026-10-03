var Player = require('./playerRef'),
  Map = require('./mapRef'),
  Scoreboard = require('./scoreboard');

// Keep each running game isolated (also allows deterministic protocol tests).
module.exports = function(io) {
  var boundX = 1960, boundY = 1080;
  var map = new Map(boundX, boundY), scoreboard = new Scoreboard(), stateQueue = {}, version = 0;
  var lastTick = Date.now(), accumulator = 0, step = 1000 / 60;
  var timer = null, broadcast = null;

  function logFor(id) {
    return stateQueue[id] || (stateQueue[id] = {});
  }

  function motion(player, log) {
    log.pos = {x: player.pos.x, y: player.pos.y};
    log.angle = player.angle.rad;
    log.heading = player.barrel.angle.rad;
    log.velocity = player.networkVelocity || {x: 0, y: 0};
    log.ack = player.lastSequence;
    log.generation = player.generation;
  }

  function objectRef(object, kind) {
    var ref = {id: object.id, pid: object.pid, pos: {x: object.pos.x, y: object.pos.y}};
    if (kind === 'shoot') {
      ref.angle = object.angle.rad;
      ref.speed = object.speed;
      ref.bounceCount = object.bounceCount;
      ref.velocity = {x: object.velocity.x, y: object.velocity.y};
    } else {
      ref.countdown = object.countdownTime - Date.now();
      ref.expires = object.explodeTime - Date.now();
    }
    return ref;
  }

  // Physics and rendering use the same fixed step. Network delivery is 20Hz.
  function tick() {
    var now = Date.now();
    accumulator += Math.min(100, now - lastTick);
    lastTick = now;
    while (accumulator + 0.001 >= step) {
      map.tick();
      accumulator -= step;
    }
  }
  function flush() {
    if (Object.keys(stateQueue).length) {
      io.sockets.emit('e', {sequence: ++version, players: stateQueue});
      stateQueue = {};
    }
  }
  function start() {
    if (timer !== null) return;
    lastTick = Date.now();
    accumulator = 0;
    timer = setInterval(tick, step);
    broadcast = setInterval(flush, 50);
  }
  function stop() {
    clearInterval(timer);
    clearInterval(broadcast);
    timer = broadcast = null;
  }

  io.on('connection', function(socket) {
    start();
    var id = socket.id, player = Player(id, 0, 0);
    var occupiedColors = Object.keys(map.players).map(function(pid) { return map.players[pid].color; });
    var color = 0;
    while (color < 4 && occupiedColors.indexOf(color) !== -1) color++;
    player.color = player.ref.color = color % 4;
    player.lastSequence = 0;
    player.lastAction = 0;
    player.generation = 0;
    player.lastShotTick = -18;
    map.placePlayer(player);
    map.players[id] = player;
    map.ref.players[id] = player.ref;
    motion(player, logFor(id));
    logFor(id).color = player.color;

    var projectiles = {}, mines = {};
    for (var pid in map.projectiles) projectiles[pid] = objectRef(map.projectiles[pid], 'shoot');
    for (var mid in map.mines) mines[mid] = objectRef(map.mines[mid], 'mine');
    socket.emit('init', {
      id: id, pos: player.pos, generation: player.generation, sequence: version,
      players: map.ref.players, walls: map.ref.walls, projectiles: projectiles, mines: mines,
      boundX: boundX, boundY: boundY, leaderboard: scoreboard.getLeaderboard()
    });

    socket.on('init', function(name) {
      player.name = player.ref.name = typeof name === 'string' ? name.slice(0, 40) : 'Tanky';
      scoreboard.add(id, player.score, player.name);
      var log = logFor(id);
      log.name = player.name;
      log.leaderboard = scoreboard.getLeaderboard();
    });

    socket.on('disconnect', function() {
      stateQueue[id] = {disconnect: true};
      if (scoreboard.remove(id) <= 10) stateQueue[id].leaderboard = scoreboard.getLeaderboard();
      map.removePlayer(id);
      if (!Object.keys(map.players).length) {
        stop();
        stateQueue = {};
        map.projectiles = {};
        map.mines = {};
      }
    });

    socket.on('e', function(packet) {
      if (!packet || !map.players[id] || !Number.isSafeInteger(packet.seq) || packet.seq <= player.lastSequence) return;
      player.lastSequence = packet.seq;
      var log = logFor(id);
      // Ignore movement/actions sent before a respawn, but send its correction
      // again so in-flight input cannot warp the tank back to its old life.
      if (packet.generation !== player.generation) {
        if (Array.isArray(packet.actions)) {
          log.actions = (log.actions || []).concat(packet.actions.slice(0, 32).filter(function(action) {
            return action && Number.isSafeInteger(action.id) && action.id > player.lastAction;
          }).map(function(action) {
            player.lastAction = Math.max(player.lastAction, action.id);
            return {id: action.id, kind: action.kind, object: null};
          }));
        }
        motion(player, log);
        return;
      }
      if (packet.pos && Number.isFinite(packet.pos.x) && Number.isFinite(packet.pos.y)) {
        player.setPosWarp(packet.pos, map);
      }
      if (Number.isFinite(packet.angle)) player.setAngle(packet.angle);
      if (Number.isFinite(packet.mousemove)) player.setHeading(packet.mousemove);
      if (packet.velocity && Number.isFinite(packet.velocity.x) && Number.isFinite(packet.velocity.y)) {
        player.networkVelocity = {x: packet.velocity.x, y: packet.velocity.y};
      }

      if (Array.isArray(packet.actions)) packet.actions.slice(0, 32).forEach(function(action) {
        if (!action || !Number.isSafeInteger(action.id) || action.id <= player.lastAction) return;
        player.lastAction = action.id;
        var object;
        if (action.kind === 'shoot' && Number.isFinite(action.heading)) {
          player.setHeading(action.heading);
          object = player.shoot(map);
        } else if (action.kind === 'mine') object = player.drop(map.mines);
        if (!log.actions) log.actions = [];
        log.actions.push({id: action.id, kind: action.kind, object: object ? objectRef(object, action.kind) : null});
      });

      if (typeof packet.hit === 'string') {
        var assailant = map.players[packet.hit];
        if (assailant) {
          player.generation++;
          player.networkVelocity = {x: 0, y: 0};
          map.placePlayer(player);
          log.hit = true;
          player.score = log.score = 0;
          var leaderboardChanged = scoreboard.add(id, 0, player.name);
          if (assailant !== player) {
            assailant.score++;
            logFor(assailant.id).score = assailant.score;
            leaderboardChanged = scoreboard.add(assailant.id, assailant.score, assailant.name) || leaderboardChanged;
          }
          if (leaderboardChanged) log.leaderboard = scoreboard.getLeaderboard();
        }
      }
      motion(player, log);
    });
  });

  return {map: map, stop: stop};
};
