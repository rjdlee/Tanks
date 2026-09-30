const childProcess = require('child_process');

describe('Server mine lifecycle', () => {
    it('should free mine slots on expiry without reporting client blast hits', () => {
        // The legacy server loads shared classes into the global scope with vm.
        // Isolate that loader so it cannot overwrite the test runner's globals.
        const result = childProcess.execFileSync(process.execPath, ['-e', `
            // Match file-based Node startup, where require is not a global.
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
