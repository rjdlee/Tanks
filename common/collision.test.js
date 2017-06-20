const Vector2 = require('./vector2');
const Collision = require('./collision');

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
           expect(mtv.y).toBeCloseTo(-10);
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
    });
});