/**
 * Helper functions
 */
export default class Util
{
	/**
	 * Generate a unique ID
	 *
	 * @public
	 */
	static generateId()
	{
		return Math.random();
	}

	/**
	 * Determine if the argument is of type function
	 *
	 * @public
	 * @param {} func - Variable to check if is a function
	 */
	static isFunction( func )
	{
		return Object.prototype.toString.call( func ) == '[object Function]';
	}

	/**
	 * Get the current time
	 *
	 * @public
	 */
	static timestamp()
	{
		return new Date().getTime();
	}
}

String.prototype.capitalizeFirstLetter = function ()
{
	return this.charAt( 0 ).toUpperCase() + this.slice( 1 );
}

/**
 * Polyfil for Math.hypot
 */
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

/**
 * Polyfill for Math.sign
 */
Math.sign = Math.sign || function ( x )
{
	// Convert x to a number
	x = +x;
	if ( x === 0 || isNaN( x ) )
	{
		return x;
	}
	return x > 0 ? 1 : -1;
}

/**
 * Polyfill for Math.round
 * Makes Math.round more efficient
 */
Math.round = function ( num )
{
	return ( 0.5 + num ) << 0;
};