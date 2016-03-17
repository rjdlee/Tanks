import Vector from '../util/vector';
import Util from '../util/util';

/** 
 * Static class for checking collisions between entities
 *
 * @public
 */
export default class Collision
{
	constructor()
	{
		/**
		 * Colliding edge of rectangleB
		 *
		 * @public
		 */
		this.edge;

		/**
		 * Amount vertex of rectangleA extends into rectangleB in a collision
		 *
		 * @public
		 */
		this.overlap;
	}

	/**
	 * Determine if there is a collision between two rectangular entities
	 *
	 * @param {Entity} rectangleA - The first rectangular entity
	 * @param {Entity} rectangleB - The second rectangular entity
	 * @return {boolean} True if two entities are colliding
	 */
	static isColliding( rectangleA, rectangleB )
	{
		if ( !this.isNear( rectangleA, rectangleB ) )
		{
			return false;
		}

		// DEPRECATED: Due to comment below
		// if ( rectangleB.angle === 0 )
		// {
		// 	return this.isCollidingWithUnrotated( rectangleA, rectangleB );
		// }

		// if ( rectangleA.angle === 0 )
		// {
		// 	return this.isCollidingWithUnrotated( rectangleB, rectangleA );
		// }

		return this.isCollidingWithRotated( rectangleA, rectangleB );
	}

	/** 
	 * Rough collision approximation to check if two entities are near each other
	 *
	 * @private
	 * @param {Entity} rectangleA - The first rectangular entity
	 * @param {Entity} rectangleB - The second rectangular entity
	 */
	static isNear( rectangleA, rectangleB, radius )
	{
		// If no radius, use the combinaed radii plus a bit more
		if ( !radius )
		{
			radius = rectangleA.radius + rectangleB.radius;
		}

		let distance = this.hypotenuseApproximation(
			rectangleB.pos.x - rectangleA.pos.x, rectangleB.pos.y - rectangleA.pos.y );

		if ( distance <= radius )
		{
			return true;
		}
	}

	/**
	 * Efficient approximation for the hypotenuse of a and b
	 *
	 * @private
	 * @param {number} a
	 * @param {number} b
	 */
	static hypotenuseApproximation( a, b )
	{
		// http://stackoverflow.com/questions/3506404/fast-hypotenuse-algorithm-for-embedded-processor
		return 4142 * Math.abs( a ) / 10000 + Math.abs( b );
	}

	/** 
	 * DEPRECATED: This algorithm does not work when entities are colliding,
	 * but their vertices are not contained in one another
	 * Check for a collision between rotated or unrotated rectangleA and unrotated rectangleB
	 *
	 * @private
	 * @param {Entity} rectangleA - The first rectangular entity
	 * @param {Entity} rectangleB - The second rectangular entity
	 */
	static isCollidingWithUnrotated( rectangleA, rectangleB )
	{
		let boundingBoxA = rectangleA.boundingBox.vertices;
		let boundingBoxB = rectangleB.boundingBox.vertices;

		// Iterate through the bounds of this
		for ( let vertex of boundingBoxA )
		{
			// Calculate the overlaps of the x and y position of the wall and bound
			let overlaps = [
				vertex.y - boundingBoxB[ 0 ].y,
				vertex.x - boundingBoxB[ 1 ].x,
				vertex.y - boundingBoxB[ 2 ].y,
				vertex.x - boundingBoxB[ 3 ].x
			];

			// If the bound is contained within the wall
			if ( overlaps[ 0 ] <= 0 && overlaps[ 1 ] >= 0 && overlaps[ 2 ] >= 0 && overlaps[ 3 ] <= 0 )
			{
				let edges = rectangleA.boundingBox.edges;
				let edge = 0;
				let overlap = -overlaps[ 0 ];

				// Find the side of least overlap
				for ( let i = 1; i < 4; i++ )
				{
					if ( Math.abs( overlaps[ i ] ) < Math.abs( overlap ) )
					{
						edge = i;
						overlap = -overlaps[ i ];
					}
				}

				this.overlap = overlap;
				this.edge = new Vector(
					Math.sign( edges[ edge ].x ),
					Math.sign( edges[ edge ].y )
				);

				return true;
			}
		}
	}

	/** 
	 * Check for a collision between two rotated rectangles
	 *
	 * @private
	 * @param {Entity} rectangleA - The first rectangular entity
	 * @param {Entity} rectangleB - The second rectangular entity
	 */
	static isCollidingWithRotated( rectangleA, rectangleB )
	{
		if ( this.isSeparatingAxis( rectangleA, rectangleB, true ) )
			return true;

		if ( this.isSeparatingAxis( rectangleA, rectangleB, false ) )
			return true;
	}

	/**
	 * Determine if rectangleA's axes separate rectangleA from rectangleB
	 *
	 * @private
	 * @param {Entity} rectangleA - The first rectangular entity
	 * @param {Entity} rectangleB - The second rectangular entity
	 */
	static isSeparatingAxis( rectangleA, rectangleB, isAMoving )
	{
		// https://stackoverflow.com/questions/115426/algorithm-to-detect-intersection-of-two-rectangles?rq=1
		// http://imgur.com/bNwrzsv

		var aEdges = rectangleA.boundingBox.edges,
			aVertices = rectangleA.boundingBox.vertices,
			bVertices = rectangleB.boundingBox.vertices,
			leastOverlap = Infinity,
			leastOverlapEdge = 0,

			separatingAxis = false,
			oppositeSides,
			normal,

			currentPoint,
			nextPoint,

			shapeVector,
			shape1DotProduct,
			shape1DotProductSign;

		for ( var i = 0; i < aEdges.length; i++ )
		{
			oppositeSides = true;

			normal = {
				x: -aEdges[ i ].y,
				y: aEdges[ i ].x
			};

			currentPoint = aVertices[ i ];
			nextPoint = i < 2 ? aVertices[ i + 2 ] : aVertices[ i - 2 ];

			shapeVector = {
				x: nextPoint.x - currentPoint.x,
				y: nextPoint.y - currentPoint.y
			};
			shape1DotProduct = shapeVector.x * normal.x + shapeVector.y * normal.y;
			shape1DotProductSign = shape1DotProduct >= 0;

			var min = Infinity,
				max = -Infinity;
			for ( var j = 0; j < 4; j++ )
			{
				nextPoint = bVertices[ j ];

				shapeVector = {
					x: nextPoint.x - currentPoint.x,
					y: nextPoint.y - currentPoint.y,
				};

				var shape2DotProduct = shapeVector.x * normal.x + shapeVector.y * normal.y,
					shape2DotProductSign = shape2DotProduct >= 0;

				if ( shape2DotProductSign === shape1DotProductSign )
					oppositeSides = false;

				if ( shape2DotProduct < min )
					min = shape2DotProduct;
				else if ( shape2DotProduct > max )
					max = shape2DotProduct;
			}

			if ( oppositeSides )
			{
				separatingAxis = true;

				if ( isAMoving )
					break;
			}

			var overlap;
			if ( min < shape1DotProduct )
				overlap = max - shape1DotProduct;
			else
				overlap = max - min;

			if ( overlap < leastOverlap )
			{
				leastOverlap = overlap;
				leastOverlapEdge = i;
			}
		}

		this.edge = aEdges[ leastOverlapEdge ];
		this.overlap = leastOverlap;

		return true;
	}
}