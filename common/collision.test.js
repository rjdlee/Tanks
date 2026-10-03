const Vector2 = require('./vector2');
const Collision = require('./collision');
const Rectangle = require('./rectangle');

const rectangle1 = {
    pos: { x: 0, y: 0 },
    width: 3,
    height: 4,
    radius: 5,
    edges: [
        new Vector2(-10, 0),
        new Vector2(0, -10),
        new Vector2(0, 10),
        new Vector2(10, 0)
    ],
    boundingBox: [
        new Vector2(5, 5),
        new Vector2(-5, 5),
        new Vector2(-5, -5),
        new Vector2(5, -5)
    ]
};
const rectangle2 = {
    pos: { x: 5, y: 5 },
    width: 3,
    height: 4,
    radius: 5,
    edges: [
        new Vector2(-10, 0),
        new Vector2(0, -10),
        new Vector2(0, 10),
        new Vector2(10, 0)
    ],
    boundingBox: [
        new Vector2(10, 10),
        new Vector2(0, 10),
        new Vector2(0, 0),
        new Vector2(10, 0)
    ]
};

describe('Collision', () => {
    it('should be a singleton', () => {
        expect(Collision).toBeTruthy();
    });

    describe('isRotatedCollisionCollision', () => {

        it('should detect a collision when collisions are colliding', () => {
            rectangle2.pos = { x: 2, y: 2 };
            rectangle2.boundingBox = [
                new Vector2(7, 7),
                new Vector2(-3, 7),
                new Vector2(-3, -3),
                new Vector2(7, -3)
            ];
            const mtv = Collision.detect(rectangle1, rectangle2);

            expect(mtv.x).toBeCloseTo(0);
            expect(mtv.y).toBeCloseTo(-8);
        });

       it('should detect a collision when collisions are fully colliding (inside each other)', () => {
           rectangle2.pos = { x: 0, y: 0 };
           rectangle2.boundingBox = [
               new Vector2(5, 5),
               new Vector2(-5, 5),
               new Vector2(-5, -5),
               new Vector2(5, -5)
           ];
          const mtv = Collision.detect(rectangle1, rectangle2);

          expect(mtv.x).toBeCloseTo(0);
           // Either direction resolves a collision with identical centers.
           expect(Math.abs(mtv.y)).toBeCloseTo(10);
       });

        it('should detect a collision when collisions are not touching', () => {
            rectangle2.pos = { x: 10.1, y: 0 };
            rectangle2.boundingBox = [
                new Vector2(15.1, 5),
                new Vector2(5.1, 5),
                new Vector2(5.1, -5),
                new Vector2(15.1, -5)
            ];
            const mtv = Collision.detect(rectangle1, rectangle2);

            expect(mtv).toBeUndefined();
        });

        it('should not collide across a separating axis with a negative component', () => {
            const first = new Rectangle({
                pos: new Vector2(0, 0),
                width: 10,
                height: 2,
                transform: { angle: Math.PI / 4 }
            });
            const second = new Rectangle({
                pos: new Vector2(-3, 3),
                width: 10,
                height: 2,
                transform: { angle: Math.PI / 4 }
            });

            // Their bounding circles overlap, but their parallel sides do not.
            expect(Collision.near(first, second)).toBe(true);
            expect(Collision.detect(first, second)).toBeUndefined();
        });
    });
});

it('separates a contained rectangle completely and treats edge contact as clear', () => {
    const inner = new Rectangle({pos: new Vector2(0, 0), width: 10, height: 10});
    const outer = new Rectangle({pos: new Vector2(0, 0), width: 100, height: 100});
    const correction = Collision.detect(inner, outer);
    expect(Math.sqrt(correction.magnitude())).toBeCloseTo(55);
    inner.movePos(correction.x, correction.y);
    expect(Collision.detect(inner, outer)).toBeUndefined();
});

it('finds first contact even when a whole movement would pass through a thin wall', () => {
    const tank = new Rectangle({pos: new Vector2(0, 0), width: 50, height: 25});
    const wall = new Rectangle({pos: new Vector2(100, 0), width: 2, height: 100});
    const hit = Collision.sweep(tank, wall, new Vector2(200, 0));
    expect(hit.time).toBeCloseTo(74 / 200);
    expect(hit.normal.x).toBeCloseTo(-1);
    expect(hit.normal.y).toBeCloseTo(0);
    expect(Collision.sweep(tank, wall, new Vector2(-200, 0))).toBeUndefined();
});
