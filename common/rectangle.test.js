const Vector2 = require('./vector2');
const Rectangle = require('./rectangle');

const config = {
    pos: new Vector2(0, 0),
    width: 10,
    height: 10
};
let rectangle;
beforeAll(() => {
   rectangle = new Rectangle(config);
});

describe('Rectangle', () => {
    it('should construct without error', () => {
        expect(rectangle).toBeInstanceOf(Rectangle);
    });

    describe('setPos', () => {
        it('when called once should change the position and last position', () => {
            // Reset position
            rectangle.setPos(0, 0);

            rectangle.setPos(10, 10);

             expect(rectangle.pos.x).toEqual(10);
             expect(rectangle.pos.y).toEqual(10);

            expect(rectangle.lastPos.x).toEqual(0);
            expect(rectangle.lastPos.y).toEqual(0);
        });

        it('when called twice should change the position and last position', () => {
            // Reset position
            rectangle.setPos(0, 0);

           rectangle.setPos(10, 10);
            rectangle.setPos(20, 20);

            expect(rectangle.pos.x).toEqual(20);
            expect(rectangle.pos.y).toEqual(20);

            expect(rectangle.lastPos.x).toEqual(10);
            expect(rectangle.lastPos.y).toEqual(10);

            // Bounding box
            expect(rectangle.boundingBox[0].x).toBeCloseTo(25);
            expect(rectangle.boundingBox[0].y).toBeCloseTo(25);

            expect(rectangle.boundingBox[1].x).toBeCloseTo(15);
            expect(rectangle.boundingBox[1].y).toBeCloseTo(25);

            expect(rectangle.boundingBox[2].x).toBeCloseTo(15);
            expect(rectangle.boundingBox[2].y).toBeCloseTo(15);

            expect(rectangle.boundingBox[3].x).toBeCloseTo(25);
            expect(rectangle.boundingBox[3].y).toBeCloseTo(15);
        });
    });

    describe('movePos', () => {
        it('should translate the position', () => {
           // Reset position
           rectangle.setPos(0, 0);

            rectangle.movePos(15, 15);

            expect(rectangle.pos.x).toEqual(15);
            expect(rectangle.pos.y).toEqual(15);

            expect(rectangle.lastPos.x).toEqual(0);
            expect(rectangle.lastPos.y).toEqual(0);
        });
    });

    describe('setVelocity', () => {
       it('should change the velocity given a new speed magnitude', () => {
          rectangle.setVelocity(10);

          expect(rectangle.speed).toEqual(10);
          expect(rectangle.velocity.x).toEqual(10);
           expect(rectangle.velocity.y).toEqual(0);
       });
    });

    describe('setAngle', () => {
       it('should set angle and velocity, and rotate bounding box', () => {
          rectangle.setAngle(Math.PI);

          expect(rectangle.angle.rad).toEqual(Math.PI);

          // Trigonometry is imperfect
          expect(rectangle.velocity.x).toBeCloseTo(-10, 3);
          expect(rectangle.velocity.y).toBeCloseTo(0, 3);
       });
    });

    describe('rotateBoundingBox', () => {
       it('should rotate the bounding box, edges, and bounds', () => {
          // Reset position
          rectangle.setPos(0, 0);
          rectangle.setAngle(Math.PI);

          // Bounding box
           expect(rectangle.boundingBox[0].x).toBeCloseTo(-5);
           expect(rectangle.boundingBox[0].y).toBeCloseTo(-5);

           expect(rectangle.boundingBox[1].x).toBeCloseTo(5);
           expect(rectangle.boundingBox[1].y).toBeCloseTo(-5);

           expect(rectangle.boundingBox[2].x).toBeCloseTo(5);
           expect(rectangle.boundingBox[2].y).toBeCloseTo(5);

           expect(rectangle.boundingBox[3].x).toBeCloseTo(-5);
           expect(rectangle.boundingBox[3].y).toBeCloseTo(5);

           // Edges
           expect(rectangle.edges[0].x).toBeCloseTo(10);
           expect(rectangle.edges[0].y).toBeCloseTo(0);

           expect(rectangle.edges[1].x).toBeCloseTo(0);
           expect(rectangle.edges[1].y).toBeCloseTo(10);

           expect(rectangle.edges[2].x).toBeCloseTo(-10);
           expect(rectangle.edges[2].y).toBeCloseTo(0);

           expect(rectangle.edges[3].x).toBeCloseTo(0);
           expect(rectangle.edges[3].y).toBeCloseTo(-10);

           // Bounds
           expect(rectangle.boundingBoxBounds[0].x).toBeCloseTo(-5);
           expect(rectangle.boundingBoxBounds[0].y).toBeCloseTo(-5);

           expect(rectangle.boundingBoxBounds[1].x).toBeCloseTo(5);
           expect(rectangle.boundingBoxBounds[1].y).toBeCloseTo(5);
       });
    });

    describe('isRotatedRectangleCollision', () => {
        const rectangleA = new Rectangle(config);

       it('should detect a collision when rectangles are colliding', () => {
           rectangleA.setPos(0, 0);
           rectangle.setPos(10, 5);
           rectangleA.setAngle(1);
           rectangle.setAngle(3);

          const collision = rectangle.isRotatedRectangleCollision(rectangleA);
          expect(collision.x).toBeCloseTo(-1.29);
           expect(collision.y).toBeCloseTo(-7.61);
       });

        it('should detect a collision when rectangles are fully colliding (inside each other)', () => {
            rectangleA.setPos(0, 0);
            rectangle.setPos(0, 0);
            rectangleA.setAngle(0);
            rectangle.setAngle(0);

            const collision = rectangle.isRotatedRectangleCollision(rectangleA);
            expect(collision.x).toBeCloseTo(0);
            expect(collision.y).toBeCloseTo(-10);
        });

        it('should not detect a collision when rectangles are not touching', () => {
            rectangle.setPos(0, 0);
            rectangleA.setPos(20, 20);

            const collision = rectangle.isRotatedRectangleCollision(rectangleA);
            expect(collision).toBeFalsy();
        });
    });
});