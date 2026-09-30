const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Mine explosion lifecycle', () => {
    let now;
    let hit;
    let mine;
    let map;

    beforeEach(() => {
        now = 1000;
        hit = jest.fn();
        const Mine = vm.runInNewContext(
            fs.readFileSync(path.join(__dirname, 'mine.js'), 'utf8') + '\nMine;',
            {
                Vector2: require('./vector2'),
                Rectangle: require('./rectangle'),
                Collision: require('./collision'),
                connect: { pushStateEvent: hit },
                Date: { now: () => now }
            }
        );
        mine = new Mine('owner', 0, 0);
        map = {
            players: {
                local: { pos: { x: 0, y: 0 }, radius: 5, key: {} },
                remote: { pos: { x: 0, y: 0 }, radius: 5 }
            },
            removeMine: jest.fn()
        };
    });

    it('should report one local hit across repeated explosion frames', () => {
        mine.tick(map);
        expect(hit).not.toHaveBeenCalled();

        now = mine.countdownTime;
        mine.tick(map);
        now += 100;
        mine.tick(map);

        expect(hit).toHaveBeenCalledTimes(1);
        expect(hit).toHaveBeenCalledWith('hit', 'owner');
    });

    it('should still hit a player entering the active blast later', () => {
        map.players.local.pos.x = 100;
        now = mine.countdownTime;
        mine.tick(map);
        expect(hit).not.toHaveBeenCalled();

        map.players.local.pos.x = 0;
        now += 100;
        mine.tick(map);
        expect(hit).toHaveBeenCalledTimes(1);
    });

    it('should expire without reporting a late hit after a paused frame', () => {
        now = mine.explodeTime;
        mine.tick(map);

        expect(map.removeMine).toHaveBeenCalledWith(mine.id);
        expect(hit).not.toHaveBeenCalled();
    });
});
