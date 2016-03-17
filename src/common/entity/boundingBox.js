import Vector from '../util/vector';

/**
 * Manages entity bounding box vertices
 */
export default class BoundingBox
{
	/**
	 * @param {Array} vertices - Entity's unrotated bounding box vertices
	 * @param {Number} [angle] - Angle to rotate the vertices by
 * @param	{
		NaturalNumber
	}[ transformOriginX ] - Point on[ 0, 1 ] along the x - axis to rotate the bounding box around * @param
	{
		NaturalNumber
	}[ transformOriginY ] - Point on[ 0, 1 ] along the y - axis to rotate the bounding box around
	 */
	constructor( vertices = [], angle = 0, transformOriginX = 0.5, transformOriginY = 0.5 )
	{
		this.vertices = vertices;
		this.edges = Array( vertices.length );
		this.bounds = Array( 2 );

		this.rotate( angle, transformOriginX, transformOriginY );
	}

	/**
	 * Rotate the bounding box
	 *
	 * @public
	 * @param {Number} angle - Angle to rotate the vertices by
	 * @param {NaturalNumber} [transformOriginX] - Point on [0, 1] along the x-axis to rotate the bounding box around
	 * @param {NaturalNumber} [transformOriginY] - Point on [0, 1] along the y-axis to rotate the bounding box around
	 */
	rotate( angle = 0, transformOriginX = 0.5, transformOriginY = 0.5 )
	{
		let cos = Math.cos( angle );
		let sin = Math.sin( angle );
		let rotationMatrix_2d = [
			[ cos, -sin ],
			[ sin, cos ]
		];
		let posArray = Array( 2 );

		for ( let vertex of this.vertices )
		{
			posArray[ 0 ] = [ vertex.x - transformOriginX ];
			posArray[ 1 ] = [ vertex.y - transformOriginY ];

			let newPos = this.multiplyMatrices( rotationMatrix_2d, posArray );

			vertex.x = newPos[ 0 ][ 1 ] + transformOriginX;
			vertex.y = newPos[ 1 ][ 1 ] + transformOriginY;
		}

		this.updateEdges();
		this.updateBounds();
	}

	/**
	 * Translate bounding box
	 *
	 * @public
	 * @param {Number} dX - Amount to translate the bounding box along the x-axis
	 * @param {Number} dY - Amount to translate the bounding box along the y-axis
	 */
	translate( dX = 0, dY = 0 )
	{
		for ( let vertex of this.vertices )
		{
			vertex.x += dX;
			vertex.y += dY;
		}

		this.updateEdges();
		this.updateBounds();
	}

	/**
	 * Create and save the edges between each bounding box vertex
	 *
	 * @private
	 */
	updateEdges()
	{
		let numVertices = this.vertices.length;
		for ( let i = 0; i < numVertices; i++ )
		{
			let vertex = this.vertices[ i ],
				nextVertex = ( i === numVertices - 1 ) ? this.vertices[ 0 ] : this.vertices[ i + 1 ];

			this.edges[ i ] = nextVertex.subtract( vertex );
		}
	}

	/**
	 * Find and save the bounding box's min. and max. x and y coordinates
	 *
	 * @private
	 */
	updateBounds()
	{
		// Include the index of the edge boundaries
		let lowerBound = {
			x: this.vertices[ 0 ].x,
			y: this.vertices[ 0 ].y,
			xIndex: 0,
			yIndex: 0
		};
		let upperBound = {
			x: this.vertices[ 0 ].x,
			y: this.vertices[ 0 ].y,
			xIndex: 0,
			yIndex: 0
		};

		for ( var i = 1; i < 4; i++ )
		{
			var currentBound = this.vertices[ i ];

			if ( currentBound.x < lowerBound.x )
			{
				lowerBound.xIndex = i;
				lowerBound.x = currentBound.x;
			}
			else if ( currentBound.x > upperBound.x )
			{
				upperBound.xIndex = i;
				upperBound.x = currentBound.boundX
			}

			if ( currentBound.y < lowerBound.y )
			{
				lowerBound.yIndex = i;
				lowerBound.y = currentBound.y;
			}
			else if ( currentBound.y > upperBound.y )
			{
				upperBound.yIndex = i;
				upperBound.y = currentBound.y;
			}
		}

		this.bounds[ 0 ] = lowerBound;
		this.bounds[ 1 ] = upperBound;
	}

	/**
	 * Multiply two matrices
	 * Example input for a 2x2 matrix: [ [0, 1],
	 *									 [1, 0] ]
	 *
	 * @private
	 * @param {Array} matrixA - First matrix to multiply
	 * @param {Array} matrixB - Second matrix to multiply
	 */
	multiplyMatrices( matrixA = [], matrixB = [] )
	{
		if ( matrixA.length === 0 || matrixB.length === 0 )
		{
			return [];
		}

		// Number of rows in matrixA
		let height = matrixA.length;

		// Number of columns in matrixB
		let width = matrixB[ 0 ].length;

		// Create an empty matrix to store the result
		let matrix = Array( height );

		// Iterate through each row of matrixA
		for ( let aY = 0; aY < height; aY++ )
		{
			let aRow = matrixA[ aY ];
			matrix[ aY ] = Array( width );

			// Iterate through each column of matrixB
			for ( let bX = 0; bX < width; bX++ )
			{
				let cell = 0;

				// Iterate through the bigger of the width of matrixA or height of matrixB
				for ( let i = 0; i < Math.max( aRow.length, matrixB.length ); i++ )
				{
					cell += aRow[ i ] * matrixB[ i ][ bX ];
				}

				matrix[ aY ].push( cell );
			}
		}

		return matrix;
	}
}