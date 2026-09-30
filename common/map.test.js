const fs = require('fs');
const path = require('path');
const vm = require('vm');

// The shared map is a browser global, so load it without replacing Node's Map.
const GameMap = vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8') + '\nMap;'
);

describe('Map object cleanup', () => {
    ['mine', 'projectile'].forEach(kind => {
        const collection = kind + 's';
        const remove = kind === 'mine' ? 'removeMine' : 'removeProjectile';

        it('should remove a ' + kind + ' from the map and its owner exactly once', () => {
            const map = new GameMap(100, 100);
            const removed = { id: 'removed', pid: 'owner' };
            const retained = { id: 'retained', pid: 'owner' };
            map.players.owner = { [collection]: [removed, retained] };
            map[collection] = { removed, retained };

            map[remove]('removed');
            map[remove]('removed');

            expect(map[collection]).toEqual({ retained });
            expect(map.players.owner[collection]).toEqual([retained]);
        });

        it('should remove a ' + kind + ' after its owner disconnects', () => {
            const map = new GameMap(100, 100);
            map[collection].orphan = { id: 'orphan', pid: 'disconnected' };

            expect(() => map[remove]('orphan')).not.toThrow();
            expect(map[collection]).toEqual({});
        });
    });
});
