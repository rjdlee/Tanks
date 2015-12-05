import Vector from '../util/vector';

export default class BoundingBox
{
	constructor( vertices = [], angle = 0, transform_origin_x = 0, transform_origin_y = 0 )
	{
		this.vertices = vertices;
		this.edges = Array( vertices.length );
		this.bounds = Array( 2 );

		this.rotate( angle, transform_origin_x, transform_origin_y );
	}

	// Rotate bounding box around origin
	rotate( dAngle = 0, transform_origin_x = 0, transform_origin_y = 0 )
	{
		let cos = Math.cos( dAngle ),
			sin = Math.sin( dAngle ),
			rotation_matrix_2d = [
				[ cos, -sin ],
				[ sin, cos ]
			],
			pos_array = Array( 2 );

		for ( let vertex of this.vertices )
		{
			pos_array[ 0 ] = [ vertex.x - transform_origin_x ];
			pos_array[ 1 ] = [ vertex.y - transform_origin_y ];

			let new_pos = this.multiply_matrices( rotation_matrix_2d, pos_array );

			vertex.x = new_pos[ 0 ][ 1 ] + transform_origin_x;
			vertex.y = new_pos[ 1 ][ 1 ] + transform_origin_y;
		}

		this.update_edges();
		this.update_bounds();
	}

	// Translate bounding box
	translate( dX = 0, dY = 0 )
	{
		for ( let vertex of this.vertices )
		{
			vertex.x += dX;
			vertex.y += dY;
		}

		this.update_edges();
		this.update_bounds();
	}

	// Creates a vector for each edge of the shape
	update_edges()
	{
		let num_vertices = this.vertices.length;
		for ( let i = 0; i < num_vertices; i++ )
		{
			let vertex = this.vertices[ i ],
				next_vertex = ( i === num_vertices - 1 ) ? this.vertices[ 0 ] : this.vertices[ i + 1 ];

			this.edges[ i ] = next_vertex.subtract( vertex );
		}
	}

	// Finds the minimum and maximum x and y coordinates of the shape
	update_bounds()
	{
		// Include the index of the edge boundaries
		var lowerBound = {
				x: this.vertices[ 0 ].x,
				y: this.vertices[ 0 ].y,
				x_index: 0,
				y_index: 0
			},
			upperBound = {
				x: this.vertices[ 0 ].x,
				y: this.vertices[ 0 ].y,
				x_index: 0,
				y_index: 0
			};

		for ( var i = 1; i < 4; i++ )
		{
			var currentBound = this.vertices[ i ];

			if ( currentBound.x < lowerBound.x )
			{
				lowerBound.x_index = i;
				lowerBound.x = currentBound.x;
			}
			else if ( currentBound.x > upperBound.x )
			{
				upperBound.x_index = i;
				upperBound.x = currentBound.boundX
			}

			if ( currentBound.y < lowerBound.y )
			{
				lowerBound.y_index = i;
				lowerBound.y = currentBound.y;
			}
			else if ( currentBound.y > upperBound.y )
			{
				upperBound.y_index = i;
				upperBound.y = currentBound.y;
			}
		}

		this.bounds[ 0 ] = lowerBound;
		this.bounds[ 1 ] = upperBound;
	}

	// Multiply two matrices, an example is [[0,1],[1,0]], a 2x2 matrix
	multiply_matrices( matrix_a = [], matrix_b = [] )
	{
		if ( matrix_a.length === 0 || matrix_b.length === 0 )
			return [];

		// Number of rows in matrix_a
		let height = matrix_a.length;

		// Number of columns in matrix_b
		let width = matrix_b[ 0 ].length;

		// Create an empty matrix to store the result
		let matrix = Array( height );

		// Iterate through each row of matrix_a
		for ( let a_y = 0; a_y < height; a_y++ )
		{
			let a_row = matrix_a[ a_y ];
			matrix[ a_y ] = Array( width );

			// Iterate through each column of matrix_b
			for ( let b_x = 0; b_x < width; b_x++ )
			{
				let cell = 0;

				// Iterate through the bigger of the width of matrix_a or height of matrix_b
				for ( let i = 0; i < Math.max( a_row.length, matrix_b.length ); i++ )
				{
					cell += a_row[ i ] * matrix_b[ i ][ b_x ];
				}

				matrix[ a_y ].push( cell );
			}
		}

		return matrix;
	}
}