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
        it('should return a unit vector', () => {
            const unitVector = vector2A.unitVector();

            expect(unitVector.x).toEqual(0.1);
            expect(unitVector.y).toEqual(0.9);
        });
    });
});