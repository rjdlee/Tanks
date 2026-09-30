const assert = require('assert');
let now = 1000;
Date.now = () => now;
const timers = [];
global.setInterval = (callback, interval) => { timers.push({callback, interval}); return timers.length; };
global.clearInterval = () => {};
const broadcasts = [];
let connection;
const io = {
  sockets: {emit: (event, packet) => broadcasts.push(JSON.parse(JSON.stringify(packet)))},
  on: (event, handler) => { connection = handler; }
};
const game = require('../server/main')(io);
function join(id) {
  const handlers = {}, sent = [];
  const socket = {id, on: (event, fn) => { handlers[event] = fn; },
    emit: (event, packet) => sent.push({event, packet: JSON.parse(JSON.stringify(packet))})};
  connection(socket);
  return {send: packet => handlers.e(packet), disconnect: () => handlers.disconnect(), sent};
}
const a = join('a'), b = join('b');
const flush = () => { timers.find(timer => timer.interval === 50).callback(); return broadcasts[broadcasts.length - 1]; };
const packet = (seq, extra) => Object.assign({seq, generation: 0, pos: {x: 300, y: 300}}, extra);
game.map.walls = [];
a.send(packet(1, {pos: {x: 310, y: 300}}));
a.send(packet(2, {pos: {x: 320, y: 300}}));
a.send(packet(1, {pos: {x: 0, y: 0}}));
let state = flush();
assert.strictEqual(state.players.a.ack, 2);
assert.strictEqual(state.players.a.pos.x, 320);
assert.strictEqual(state.sequence, 1);

// More than one action between broadcasts must survive the batching window.
a.send(packet(3, {actions: [{id: 1, kind: 'mine'}, {id: 2, kind: 'mine'}, {id: 3, kind: 'mine'}]}));
state = flush();
assert.strictEqual(state.players.a.actions.length, 3);
assert(state.players.a.actions[0].object);
assert(state.players.a.actions[1].object);
assert.strictEqual(state.players.a.actions[2].object, null);
assert.strictEqual(game.map.players.a.mines.length, 2);

// A duplicate action ID is harmless, even in a newer input packet.
a.send(packet(4, {actions: [{id: 4, kind: 'shoot', heading: 0}]}));
a.send(packet(5, {actions: [{id: 4, kind: 'shoot', heading: 0}, {id: 5, kind: 'shoot', heading: 0}]}));
state = flush();
assert.strictEqual(state.players.a.actions.length, 2);
assert(state.players.a.actions[0].object);
assert.strictEqual(state.players.a.actions[1].object, null);
assert.strictEqual(game.map.players.a.projectiles.length, 1);
assert.strictEqual(Object.keys(game.map.projectiles).length, 1);

const late = join('late').sent[0].packet;
assert.strictEqual(Object.keys(late.projectiles).length, 1);
assert.strictEqual(Object.keys(late.mines).length, 2);
assert.strictEqual(Object.keys(late.projectiles)[0], state.players.a.actions[0].object.id);

// Exercise real projectile physics, including its shared collision dependency.
const shot = game.map.projectiles[Object.keys(game.map.projectiles)[0]];
const shotX = shot.pos.x;
now += 17;
timers.find(timer => timer.interval !== 50).callback();
assert.strictEqual(shot.pos.x, shotX - 3);

// Hits from the old generation cannot overwrite the new spawn or score twice.
a.send(packet(6, {hit: 'b'}));
state = flush();
const spawn = state.players.a.pos;
assert.strictEqual(state.players.a.generation, 1);
assert.strictEqual(game.map.players.b.score, 1);
a.send(packet(7, {hit: 'b', actions: [{id: 6, kind: 'shoot', heading: 0}]}));
state = flush();
assert.deepStrictEqual(state.players.a.pos, spawn);
assert.strictEqual(state.players.a.actions[0].object, null);
assert.strictEqual(game.map.players.b.score, 1);
assert.strictEqual(state.players.a.ack, 7);
a.send(packet(8, {generation: 1, pos: {x: spawn.x + 3, y: spawn.y}}));
assert.strictEqual(flush().players.a.pos.x, spawn.x + 3);

// Disconnect and malformed input cannot crash an active game.
a.send({seq: 9, generation: 1, pos: {x: NaN, y: Infinity}, actions: [null]});
a.disconnect();
assert.strictEqual(flush().players.a.disconnect, true);
assert.strictEqual(game.map.players.a, undefined);
game.stop();
console.log('protocol passed');
