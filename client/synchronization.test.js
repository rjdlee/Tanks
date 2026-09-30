const fs = require('fs');
const path = require('path');
const vm = require('vm');

function browser() {
  let now = 0, nextFrame = 0;
  const frames = {}, listeners = {}, handlers = {}, sent = [];
  const canvas = {getContext: () => ({clearRect() {}, beginPath() {}, stroke() {}, fill() {}, moveTo() {}, lineTo() {}, arc() {}})};
  const socket = {
    connected: true,
    on: (event, handler) => { (handlers[event] || (handlers[event] = [])).push(handler); },
    emit: (event, packet) => sent.push({event, packet: packet === undefined ? undefined : JSON.parse(JSON.stringify(packet))}),
    close() {}
  };
  const sandbox = {
    performance: {now: () => now}, innerWidth: 800, innerHeight: 600,
    document: {
      getElementById: () => canvas,
      addEventListener: (event, handler) => { (listeners[event] || (listeners[event] = [])).push(handler); },
      removeEventListener: (event, handler) => { listeners[event] = listeners[event].filter(fn => fn !== handler); }
    },
    addEventListener() {}, removeEventListener() {},
    requestAnimFrame: callback => { frames[++nextFrame] = callback; return nextFrame; },
    cancelAnimationFrame: id => { delete frames[id]; },
    GameSocket: function() { return socket; }, drawLeaderboard() {}, drawScore() {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  ['common/vector2.js', 'common/collision.js', 'common/rectangle.js', 'common/wall.js',
    'common/tankBarrel.js', 'common/tank.js', 'common/player.js', 'common/projectile.js',
    'common/mine.js', 'common/map.js', 'client/camera.js', 'client/user.js',
    'client/connect.js', 'client/main.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox, {filename: file});
  });
  sandbox.init();
  const trigger = (event, packet) => (handlers[event] || []).forEach(fn => fn(packet));
  const init = () => trigger('init', {id: 'self', pos: {x: 300, y: 300}, generation: 0,
    sequence: 0, players: {}, walls: [], projectiles: {}, mines: {}, boundX: 1960, boundY: 1080});
  init();
  return {s: sandbox, sent, frames, listeners, handlers, trigger, init,
    receive: (sequence, players) => trigger('e', {sequence, players}),
    time: value => { now = value; },
    frame: value => {
      now = value;
      const id = Object.keys(frames)[0], callback = frames[id];
      delete frames[id];
      callback(value);
    }};
}

it('does not pull predicted movement backwards when a delayed echo arrives', () => {
  const b = browser(), s = b.s;
  s.connect.pushStateEvent('pos', s.user.pos);
  s.connect.sendStateQueue();
  s.user.movePos(30, 0);
  b.receive(1, {self: {ack: 1, generation: 0, pos: {x: 300, y: 300}}});
  expect(s.user.pos.x).toBe(330);
  expect(Object.keys(s.connect.pending)).toHaveLength(0);
});

it('applies only the server correction and ignores repeated/stale snapshots', () => {
  const b = browser(), s = b.s;
  s.connect.pushStateEvent('pos', s.user.pos);
  s.connect.sendStateQueue();
  s.user.movePos(30, 0);
  b.receive(2, {self: {ack: 1, generation: 0, pos: {x: 295, y: 300}}});
  expect(s.user.pos.x).toBe(325);
  b.receive(2, {self: {ack: 1, generation: 0, pos: {x: 295, y: 300}}});
  b.receive(1, {self: {ack: 1, generation: 0, pos: {x: 0, y: 0}}});
  expect(s.user.pos.x).toBe(325);
});

it('rebases newer predictions so successive acknowledgements do not compound corrections', () => {
  const b = browser(), s = b.s;
  s.connect.pushStateEvent('pos', s.user.pos);
  s.connect.sendStateQueue();
  s.user.movePos(30, 0);
  s.connect.pushStateEvent('pos', s.user.pos);
  s.connect.sendStateQueue();
  s.user.movePos(30, 0);
  b.receive(1, {self: {ack: 1, generation: 0, pos: {x: 295, y: 300}}});
  b.receive(2, {self: {ack: 2, generation: 0, pos: {x: 325, y: 300}}});
  expect(s.user.pos.x).toBe(355);
});

it('renders a shot immediately and matches its acknowledgement without duplicating or rewinding it', () => {
  const b = browser(), s = b.s;
  s.connect.predictAction('shoot');
  const projectile = s.user.projectiles[0];
  expect(projectile).toBeDefined();
  expect(b.sent[b.sent.length - 1].packet.actions[0].kind).toBe('shoot');
  projectile.movePos(-20, 0);
  const x = projectile.pos.x;
  const change = {self: {actions: [{id: 1, kind: 'shoot', object: {id: 'server-shot', pid: 'self', pos: {x: 265, y: 300}, angle: 0, speed: -3, velocity: {x: -3, y: 0}}}]}};
  b.receive(1, change);
  expect(Object.keys(s.map.projectiles)).toEqual(['server-shot']);
  expect(s.user.projectiles).toHaveLength(1);
  expect(s.map.projectiles['server-shot']).toBe(projectile);
  expect(projectile.pos.x).toBe(x);
  s.map.removeProjectile('server-shot');
  b.receive(1, change);
  expect(Object.keys(s.map.projectiles)).toHaveLength(0);
});

it('rolls back rejected shots and mines, including owner inventory', () => {
  const b = browser(), s = b.s;
  s.connect.predictAction('shoot');
  s.connect.predictAction('mine');
  expect(s.user.projectiles).toHaveLength(1);
  expect(s.user.mines).toHaveLength(1);
  b.receive(1, {self: {actions: [{id: 1, kind: 'shoot', object: null}, {id: 2, kind: 'mine', object: null}]}});
  expect(s.user.projectiles).toHaveLength(0);
  expect(s.user.mines).toHaveLength(0);
  expect(Object.keys(s.connect.actions)).toHaveLength(0);
});

it('does not resurrect a predicted shot that already collided before acknowledgement', () => {
  const b = browser(), s = b.s;
  s.connect.predictAction('shoot');
  s.map.removeProjectile(s.user.projectiles[0].id);
  b.receive(1, {self: {actions: [{id: 1, kind: 'shoot', object: {id: 'gone'}}]}});
  expect(Object.keys(s.map.projectiles)).toHaveLength(0);
});

it('resets movement history on respawn and preserves new input after it', () => {
  const b = browser(), s = b.s;
  s.connect.pushStateEvent('pos', s.user.pos);
  s.connect.sendStateQueue();
  b.receive(1, {self: {ack: 1, generation: 1, hit: true, pos: {x: 700, y: 700}}});
  expect(s.user.pos.x).toBe(700);
  expect(Object.keys(s.connect.pending)).toHaveLength(0);
  expect(s.connect.generation).toBe(1);
  s.user.movePos(3, 0);
  b.receive(2, {self: {ack: 2, generation: 1, pos: {x: 700, y: 700}}});
  expect(s.user.pos.x).toBe(703);
});

it('interpolates remote movement and bounds extrapolation during a stall', () => {
  const b = browser(), s = b.s;
  b.time(0);
  b.receive(1, {other: {pos: {x: 100, y: 100}, angle: 3.1, velocity: {x: 1, y: 0}}});
  b.time(50);
  b.receive(2, {other: {pos: {x: 110, y: 100}, angle: -3.1, velocity: {x: 1, y: 0}}});
  s.renderRemotePlayers(75);
  expect(s.map.players.other.pos.x).toBe(105);
  expect(Math.abs(s.map.players.other.angle.rad - Math.PI)).toBeLessThan(0.01);
  s.renderRemotePlayers(1000);
  expect(s.map.players.other.pos.x).toBe(116);
});

it('keeps one set of listeners and one animation loop across reconnects', () => {
  const b = browser();
  b.init();
  expect(b.listeners.keydown).toHaveLength(1);
  expect(Object.keys(b.frames)).toHaveLength(1);
  b.trigger('disconnect');
  expect(b.listeners.keydown).toHaveLength(0);
  expect(Object.keys(b.frames)).toHaveLength(0);
  b.trigger('connect');
  b.init();
  expect(b.listeners.keydown).toHaveLength(1);
  expect(b.handlers.e).toHaveLength(1);
  expect(Object.keys(b.frames)).toHaveLength(1);
});

it('runs the same movement at 30, 60, and 144Hz and caps tab-resume catch-up', () => {
  const positions = [30, 60, 144].map(fps => {
    const b = browser();
    b.s.map.walls = [];
    b.s.user.setVelocity(1.5);
    b.frame(0);
    for (let i = 1; i <= fps; i++) b.frame(i * 1000 / fps);
    expect(b.s.map.ticker).toBe(60);
    const x = b.s.user.pos.x;
    b.frame(60000);
    expect(b.s.map.ticker).toBe(66);
    return x;
  });
  expect(positions).toEqual([390, 390, 390]);
});

it('sends actual movement velocity and a stop when collision or blur prevents movement', () => {
  const b = browser(), s = b.s;
  s.user.setVelocity(1.5);
  s.user.tick(s.map);
  s.connect.sendStateQueue();
  expect(b.sent[b.sent.length - 1].packet.velocity.x).toBe(1.5);
  // Emulate collision resolution returning the tank to its current position.
  s.user.translate = function() {};
  s.user.tick(s.map);
  s.connect.sendStateQueue();
  expect(b.sent[b.sent.length - 1].packet.velocity.x).toBe(0);
  s.user.blurListener();
  expect(s.user.speed).toBe(0);
  expect(b.sent[b.sent.length - 1].packet.velocity.x).toBe(0);
});

it('does not buffer disconnected input or keep references to mutable positions', () => {
  const b = browser(), s = b.s;
  s.connect.pushStateEvent('pos', s.user.pos);
  s.user.movePos(10, 0);
  expect(s.connect.stateQueue.pos.x).toBe(300);
  s.connect.socket.connected = false;
  s.connect.sendStateQueue();
  s.connect.predictAction('shoot');
  expect(b.sent).toHaveLength(0);
  expect(s.user.projectiles).toHaveLength(0);
});

it('restores stable object IDs and projectile bounce state for late joiners', () => {
  const b = browser(), s = b.s;
  const ref = {id: 'bounced', pid: 'self', pos: {x: 100, y: 100},
    angle: 0, speed: -3, velocity: {x: -3, y: 0}, bounceCount: 1};
  s.addActionObject('shoot', ref);
  s.addActionObject('shoot', ref);
  expect(s.user.projectiles).toHaveLength(1);
  expect(s.map.projectiles.bounced.bounceCount).toBe(1);
});
