import Vector from '../util/vector';
import Util from '../util/util';

export default class Collision
{
	constructor()
	{
		this.edge;
		this.overlap;
	}

	// Determine if there is a collision with rectangle
	static is_colliding( rectangle_a, rectangle_b )
	{
		if ( !this.is_near( rectangle_a, rectangle_b ) )
			return false;

		if ( rectangle_b.angle === 0 )
			return this.is_colliding_with_unrotated( rectangle_a, rectangle_b );

		if ( rectangle_a.angle === 0 )
			return this.is_colliding_with_unrotated( rectangle_b, rectangle_a );

		return this.is_colliding_with_rotated( rectangle_a, rectangle_b );
	}

	// Rough collision approximation to check if rectangle is close to the polygon
	static is_near( rectangle_a, rectangle_b, radius )
	{
		// If no radius, use the combinaed radii plus a bit more
		if ( !radius )
			radius = rectangle_a.radius + rectangle_b.radius;

		let distance = Util.sqrt_approximation( rectangle_b.pos.x - rectangle_a.pos.x, rectangle_b.pos.y - rectangle_a.pos.y )
		if ( distance <= radius )
			return true;
	}

	// Check for a collision between rotated or unrotated rectangle_a and unrotated rectangle_b
	static is_colliding_with_unrotated( rectangle_a, rectangle_b )
	{
		let bounding_box_a = rectangle_a.bounding_box.vertices;
		let bounding_box_b = rectangle_b.bounding_box.vertices;

		// Iterate through the bounds of this
		for ( let vertex of bounding_box_a )
		{
			// Calculate the overlaps of the x and y position of the wall and bound
			let overlaps = [
				vertex.y - bounding_box_b[ 0 ].y,
				vertex.x - bounding_box_b[ 1 ].x,
				vertex.y - bounding_box_b[ 2 ].y,
				vertex.x - bounding_box_b[ 3 ].x
			];

			// If the bound is contained within the wall
			if ( overlaps[ 0 ] <= 0 && overlaps[ 1 ] >= 0 && overlaps[ 2 ] >= 0 && overlaps[ 3 ] <= 0 )
			{
				let edges = rectangle_a.bounding_box.edges;
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

	// Check for a collision between two rotated rectangles
	static is_colliding_with_rotated( rectangle_a, rectangle_b )
	{
		if ( this.is_separating_axis( rectangle_a, rectangle_b, true ) )
			return true;

		if ( this.is_separating_axis( rectangle_a, rectangle_b, false ) )
			return true;
	}

	// Determine if rectangle_a's axes separate rectangle_a from rectangle_b
	static is_separating_axis( rectangle_a, rectangle_b, isAMoving )
	{
		// https://stackoverflow.com/questions/115426/algorithm-to-detect-intersection-of-two-rectangles?rq=1
		// http://imgur.com/bNwrzsv

		var a_edges = rectangle_a.bounding_box.edges,
			a_vertices = rectangle_a.bounding_box.vertices,
			b_vertices = rectangle_b.bounding_box.vertices,
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

		for ( var i = 0; i < a_edges.length; i++ )
		{
			oppositeSides = true;

			normal = {
				x: -a_edges[ i ].y,
				y: a_edges[ i ].x
			};

			currentPoint = a_vertices[ i ];
			nextPoint = i < 2 ? a_vertices[ i + 2 ] : a_vertices[ i - 2 ];

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
				nextPoint = b_vertices[ j ];

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

		this.edge = a_edges[ leastOverlapEdge ];
		this.overlap = leastOverlap;

		return true;
	}
}