const childProcess = require('child_process');

describe('Server mine lifecycle', () => {
    it('should free mine slots on expiry without reporting client blast hits', () => {
        // Isolate the deterministic clock from other tests.
        const result = childProcess.execFileSync(process.execPath, ['-e', `
            var loadModule = require;
            delete global.require;
            var assert = loadModule('assert');
            var createPlayer = loadModule('./playerRef');
            var map = loadModule('./mapRef')(1960, 1080);
            var now = Date.now();
            Date.now = function() { return now; };
            var player = createPlayer('owner', 100, 100);
            map.players.owner = player;

            var first = player.drop(map.mines);
            var second = player.drop(map.mines);
            assert(first && second);
            assert.strictEqual(player.drop(map.mines), undefined);
            first.tick = second.tick = function() {
                throw new Error('The server must not report client mine hits');
            };

            now = first.explodeTime - 1;
            map.tick();
            assert.strictEqual(player.mines.length, 2);
            now += 1;
            map.tick();
            assert.strictEqual(player.mines.length, 0);
            assert.strictEqual(Object.keys(map.mines).length, 0);
            assert(player.drop(map.mines));
            process.stdout.write('mine lifecycle passed');
        `], { cwd: __dirname, encoding: 'utf8' });

        expect(result).toEqual('mine lifecycle passed');
    });
});

it('spawns tanks clear of every cream block, crate, pit, and border in the reference arena', () => {
  const result = childProcess.execFileSync(process.execPath, ['-e', `
    const assert = require('assert');
    const createPlayer = require('./playerRef');
    const map = require('./mapRef')(1960, 1080);
    const materials = new Set(map.ref.walls.map(wall => wall.material));
    assert(materials.has('cream') && materials.has('crate') && materials.has('pit'));
    for (let i = 0; i < 300; i++) {
      const player = createPlayer('spawn', 0, 0);
      map.placePlayer(player);
      for (const wall of map.walls) assert(!player.isRotatedRectangleCollision(wall));
    }
    process.stdout.write('clear spawns');
  `], {cwd: __dirname, encoding: 'utf8'});
  expect(result).toEqual('clear spawns');
});

it('keeps collision geometry aligned after respawns and chooses unoccupied spawn cells', () => {
    const result = childProcess.execFileSync(process.execPath, ['-e', `
        const assert = require('assert');
        const createPlayer = require('./playerRef');
        const Collision = require('../common/collision');
        const map = require('./mapRef')(1960, 1080);
        Math.random = () => 0;
        for (let i = 0; i < 12; i++) {
            const player = createPlayer('peer' + i, 800, 600);
            map.placePlayer(player);
            const centerX = player.boundingBox.reduce((sum, p) => sum + p.x, 0) / 4;
            const centerY = player.boundingBox.reduce((sum, p) => sum + p.y, 0) / 4;
            assert(Math.abs(centerX - player.pos.x) < .00001);
            assert(Math.abs(centerY - player.pos.y) < .00001);
            for (const id in map.players) assert(!Collision.detect(player, map.players[id]));
            map.players[player.id] = player;
        }
        const respawn = map.players.peer0;
        respawn.setPos(900, 580);
        map.placePlayer(respawn);
        assert(Math.abs(respawn.boundingBox.reduce((sum, p) => sum + p.x, 0) / 4 - respawn.pos.x) < .00001);
        for (const id in map.players) if (id !== respawn.id) assert(!Collision.detect(respawn, map.players[id]));
        process.stdout.write('aligned and clear');
    `], {cwd: __dirname, encoding: 'utf8'});
    expect(result).toEqual('aligned and clear');
});
