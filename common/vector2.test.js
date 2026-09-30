const Vector2 = require('./vector2');

let vector2A;
let vector2B;
beforeAll(() => {
    vector2A = new Vector2(25, 75);
    vector2B = new Vector2(50, 50);
});

describe('Vector2', () => {
    it('should construct without error', () => {
        expect(vector2A).toBeInstanceOf(Vector2);
    });

    describe('project', () => {
        it('should return a unit vector', () => {
            const projection = vector2A.project(vector2B);

            expect(projection.x).toEqual(50);
            expect(projection.y).toEqual(50);
        });
    });

    describe('rightNormal', () => {
        it('should return a unit vector', () => {
            const rightNormal = vector2A.rightNormal();

            expect(rightNormal.x).toEqual(-75);
            expect(rightNormal.y).toEqual(25);
        });
    });

    describe('leftNormal', () => {
        it('should return a unit vector', () => {
            const leftNormal = vector2A.leftNormal();

            expect(leftNormal.x).toEqual(75);
            expect(leftNormal.y).toEqual(-25);
        });
    });

    describe('unitVector', () => {
        it('should return a vector with length one and the same direction', () => {
            const unitVector = vector2A.unitVector();

            expect(unitVector.x).toBeCloseTo(1 / Math.sqrt(10));
            expect(unitVector.y).toBeCloseTo(3 / Math.sqrt(10));
            expect(unitVector.magnitude()).toBeCloseTo(1);
        });

        it('should preserve negative components without changing the original vector', () => {
            const vector = new Vector2(-3, 4);
            const unitVector = vector.unitVector();

            expect(unitVector.x).toBeCloseTo(-0.6);
            expect(unitVector.y).toBeCloseTo(0.8);
            expect(unitVector.magnitude()).toBeCloseTo(1);
            expect(vector.x).toEqual(-3);
            expect(vector.y).toEqual(4);
        });

        it('should return a finite zero vector when the vector has no direction', () => {
            const unitVector = new Vector2().unitVector();

            expect(unitVector.x).toEqual(0);
            expect(unitVector.y).toEqual(0);
        });
    });
});
