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
const Player = require('./player');
const Wall = require('./wall');
const Collision = require('./collision');

it('stops approaching an overlapping peer without a sideways jump and can back away', () => {
    const self = new Player('self', 300, 300);
    const peer = new Player('peer', 325, 300);
    self.setVelocity(1.5);
    self.translate(1960, 1080, [], {self, peer});
    expect(self.pos.x).toBe(300);
    expect(self.pos.y).toBe(300);
    self.setVelocity(-1.5);
    self.translate(1960, 1080, [], {self, peer});
    expect(self.pos.x).toBe(298.5);
    expect(self.pos.y).toBe(300);
});

it('keeps the center fixed when turning against a wall, while allowing a clear turn', () => {
    const self = new Player('self', 300, 300);
    const wall = new Wall(340, 300, 20, 200);
    self.angle.speed = .05;
    for (let i = 0; i < 120; i++) self.translate(1960, 1080, [wall], {self});
    expect(self.pos.x).toBe(300);
    expect(self.pos.y).toBe(300);
    expect(self.angle.rad).toBeCloseTo(0);
    self.setPos(250, 300);
    self.translate(1960, 1080, [wall], {self});
    expect(self.angle.rad).toBeCloseTo(.05);
});

it('slides along a wall, stops at a corner, and never adds distance to an input step', () => {
    const self = new Player('self', 280, 280, Math.PI / 4);
    const walls = [new Wall(350, 300, 50, 300), new Wall(300, 350, 300, 50)];
    self.setVelocity(1.5);
    for (let i = 0; i < 180; i++) {
        const x = self.pos.x, y = self.pos.y;
        self.translate(1960, 1080, walls, {self});
        expect(Math.hypot(self.pos.x - x, self.pos.y - y)).toBeLessThanOrEqual(1.500001);
        expect(self.pos.x).toBeGreaterThanOrEqual(x - .000001);
        expect(self.pos.y).toBeGreaterThanOrEqual(y - .000001);
        walls.forEach(wall => expect(Collision.detect(self, wall)).toBeUndefined());
    }
    expect(self.pos.x).toBeCloseTo(325 - (30 + 19) / Math.sqrt(2), 2);
    expect(self.pos.y).toBeCloseTo(self.pos.x, 2);
    const slide = new Player('slide', 280, 200, Math.PI / 4);
    slide.setVelocity(1.5);
    for (let i = 0; i < 100; i++) slide.translate(1960, 1080, [walls[0]], {slide});
    expect(slide.pos.x).toBeCloseTo(self.pos.x, 2);
    expect(slide.pos.y).toBeGreaterThan(300);
});

it('cannot tunnel through a wall during a large correction and bounds legacy offset motion', () => {
    const self = new Player('self', 300, 300);
    const wall = new Wall(350, 300, 2, 200);
    self.moveWithCollisions(200, 0, [wall], {self});
    expect(self.pos.x).toBeCloseTo(319, 2);
    expect(Collision.detect(self, wall)).toBeUndefined();
    self.offset.set(100, 0);
    const x = self.pos.x;
    self.translate(1960, 1080, [], {self});
    expect(self.pos.x - x).toBeCloseTo(1.5);
});
