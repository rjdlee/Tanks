import Util from './util';

export default class Vector
{
	constructor( x = 0, y = 0 )
	{
		this.x = x;
		this.y = y;
		this.length = Math.hypot( this.x, this.y );
	}

	// Set the arguments to its corresponding axis of this vector
	set( x = 0, y = 0 )
	{
		this.x = x;
		this.y = y;
		this.length = Math.hypot( this.x, this.y );

		return this;
	};

	// Add the arguments to its corresponding axis of this vector
	add( x = 0, y = 0 )
	{
		this.x += x;
		this.y += y;
		this.length = Math.hypot( this.x, this.y );

		return this;
	};

	// Divide each axis of this vector by the divisor
	divide( divisor )
	{
		this.x /= divisor;
		this.y /= divisor;
		this.length = Math.hypot( this.x, this.y );

		return this;
	};

	// Multiply each axis of this vector by the multiple
	multiply( multiple )
	{
		this.x *= multiple;
		this.y *= multiple;
		this.length = Math.hypot( this.x, this.y );

		return this;
	};

	// Project this vector onto the vector argument
	project( vector )
	{
		var dotProduct = this.dotProduct( vector );

		this.x = dotProduct * vector.x;
		this.y = dotProduct * vector.y;
		this.length = Math.hypot( this.x, this.y );

		return this;
	};

	// Returns if this vector is zero
	isZero()
	{

		return this.x === 0 && this.y === 0;
	};


	/* Functions below return the result rather than modify contents of this vector */


	// Return the unit vector of this vector
	unitVector()
	{
		var length = this.length,
			x = this.x ? Math.sign( this.x ) * Math.pow( this.x, 2 ) / length : 0,
			y = this.y ? Math.sign( this.y ) * Math.pow( this.y, 2 ) / length : 0;

		return new Vector( x, y );
	};

	// Return a vector containing the difference of each axis
	diff( vector )
	{

		return new Vector( this.x - vector.x, this.y - vector.y );
	};

	// Return a vector containing the difference of each axis
	subtract( vector )
	{

		return new Vector( this.x - vector.x, this.y - vector.y );
	};

	// Return the dot product of the two vectors
	dotProduct( vector )
	{

		return this.x * vector.x + this.y * vector.y;
	};

	// Return a copy of this vector
	clone()
	{

		return new Vector( this.x, this.y );
	};

	// Returns an object containing each non-zero axis
	toObject()
	{
		var vectorObject = {
			x: this.x,
			y: this.y
		};

		return vectorObject;
	};

	toString()
	{
		return 'x: ' + this.x + ' y: ' + this.y;
	};

}