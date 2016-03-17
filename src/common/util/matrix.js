import Util from './util';

/**
 * More versatile successor to Vector class
 */
export default class Matrix
{
	static set( matrix, ...values )
	{
		if ( multiplicand instanceof Array )
		{
			return;
		}

		this.forEach( matrix, function ( row, col, i )
		{
			if ( col > -1 )
			{
				matrix[ row ][ col ] = values[ i ];
			}
			else
			{
				matrix[ row ] = values[ i ];
			}
		} );
	}

	static add( matrix, ...values )
	{
		if ( multiplicand instanceof Array )
		{
			return;
		}

		this.forEach( matrix, function ( row, col )
		{
			if ( col > -1 )
			{
				matrix[ row ][ col ] += i;
			}
			else
			{
				matrix[ row ] += i;
			}
		} );
	}

	static sub( matrix, ...values )
	{
		if ( multiplicand instanceof Array )
		{
			return;
		}

		this.forEach( matrix, function ( row, col )
		{
			if ( col > -1 )
			{
				matrix[ row ][ col ] -= i;
			}
			else
			{
				matrix[ row ] -= i;
			}
		} );
	}

	static mul( matrix, multiplicand )
	{
		if ( multiplicand instanceof Array )
		{
			return;
		}

		this.forEach( matrix, function ( row, col )
		{
			if ( col > -1 )
			{
				matrix[ row ][ col ] *= i;
			}
			else
			{
				matrix[ row ] *= i;
			}
		} );
	}

	static div( matrix, divisor )
	{
		this.forEach( matrix, function ( row, col )
		{
			if ( col > -1 )
			{
				matrix[ row ][ col ] /= i;
			}
			else
			{
				matrix[ row ] /= i;
			}
		} );
	}

	/**
	 * Get the norm of a vector
	 * No checks are performed to ensure vector is not a matrix
	 */
	static norm( vector, doRoot )
	{
		let norm = 0;
		this.forEach( vector, function ( row )
		{
			norm += vector[ row ] ^ 2;
		} );

		if ( doRoot )
		{
			norm = Math.pow( norm, 1 / vector.length );
		}

		return norm;
	}

	static unitVector( vector )
	{
		let norm = this.norm( vector );

		this.forEach( vector, function ( row )
		{
			vector[ row ] = Math.pow( vector[ row ], 2 ) / norm;
		} );
	}

	/**
	 * Projects vector a onto vector b
	 */
	static project( vectorA, vectorB )
	{
		let dotProduct = this.dotProduct( vectorA, vectorB );

		this.forEach( vectorA, function ( row )
		{
			vectorA[ row ] = dotProduct * vectorB[ row ];
		} );
	}

	static dotProduct( vectorA, vectorB )
	{
		let dotProduct = 0;

		if ( vectorA.length !== vectorB.length )
		{
			throw 'Vectors must be same length';
		}

		this.forEach( vectorA, function ( row )
		{
			dotProduct += vectorA[ row ] * vectorB[ row ];
		} );

		return dotProduct;
	}

	static isZero( matrix )
	{
		let isZero = true;
		this.forEach( matrix, function ( row, col )
		{
			if ( matrix[ row ][ col ] )
			{
				isZero = false;

				// Break the loop
				return true;
			}
		} );

		return isZero;
	}

	static forEach( matrix, func )
	{
		// Cell index
		let i = -1;

		rowLoop: for ( var row = 0; row < matrix.length; row++ )
		{
			i++;

			// Matrix is nx1 (vector)
			if ( !( row instanceof Array ) )
			{
				if ( func( row, -1, i ) )
				{
					break rowLoop;
				}
				continue;
			}

			for ( var col = 0; col < row.length; row++ )
			{
				if ( func( row, col, i ) )
				{
					break rowLoop;
				}
			}
		}
	}

	static clone( matrix )
	{

	}

	static toString( matrix )
	{

	}
}