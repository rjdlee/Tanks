/*

Taken from http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

*/

// requestAnimationFrame polyfill
( function ()
{
	var lastTime = 0;
	var vendors = [ 'webkit', 'moz' ];
	for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x )
	{
		window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
		window.cancelAnimationFrame =
			window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
	}

	if ( !window.requestAnimationFrame )
		window.requestAnimationFrame = function ( callback, element )
		{
			var currTime = new Date().getTime();
			var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
			var id = window.setTimeout( function ()
				{
					callback( currTime + timeToCall );
				},
				timeToCall );
			lastTime = currTime + timeToCall;
			return id;
		};

	if ( !window.cancelAnimationFrame )
		window.cancelAnimationFrame = function ( id )
		{
			clearTimeout( id );
		};
}() );

// Recursive requestAnimationFrame
window.requestAnimFrame = ( function ()
{
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function ( callback )
		{
			window.setTimeout( callback, 1000 / 60 );
		};
} )();