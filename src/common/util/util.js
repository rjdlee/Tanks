export default class Util
{
	static generate_id()
	{
		return Math.random();
	}

	// Efficient approximation for the square root of a and b
	static sqrt_approximation( a, b )
	{
		return 4142 * Math.abs( a ) / 10000 + Math.abs( b );
	}

	static is_function( func )
	{
		return Object.prototype.toString.call( func ) == '[object Function]';
	}

	static timestamp()
	{
		return new Date().getTime();
	}
}

Math.hypot = Math.hypot || function ()
{
	var y = 0;
	var length = arguments.length;

	for ( var i = 0; i < length; i++ )
	{
		if ( arguments[ i ] === Infinity || arguments[ i ] === -Infinity )
		{
			return Infinity;
		}
		y += arguments[ i ] * arguments[ i ];
	}
	return Math.sqrt( y );
};

Math.sign = Math.sign || function ( x )
{
	x = +x; // convert to a number
	if ( x === 0 || isNaN( x ) )
	{
		return x;
	}
	return x > 0 ? 1 : -1;
}

Math.round = function ( num )
{
	return ( 0.5 + num ) << 0;
};