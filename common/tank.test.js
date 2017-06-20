const Vector2 = require('./vector2');
const Tank = require('./tank');

let tank;
beforeAll(() => {
    tank = new Tank(0, 0, 0);
});

describe('Tank', () => {
    it('should construct without error', () => {
        expect(tank).toBeInstanceOf(Tank);
    });

    describe('setPos', () => {
        it('should change tank and barrel position', () => {
            tank.setPos(10, 10);

            expect(tank.pos.x).toEqual(10);
            expect(tank.pos.y).toEqual(10);

            expect(tank.barrel.pos.x).toEqual(10);
            expect(tank.barrel.pos.y).toEqual(10);
        });
    });

    describe('movePos', () => {
        it('should change tank and barrel position', () => {
            // Reset position
            tank.setPos(0, 0);

            tank.movePos(10, 10);

            expect(tank.pos.x).toEqual(10);
            expect(tank.pos.y).toEqual(10);

            expect(tank.barrel.pos.x).toEqual(10);
            expect(tank.barrel.pos.y).toEqual(10);
        });
    });
});