import Util from '../util/util';

/**
 * Game clock
 */
export default class GameLoop
{
	/**
	 * Initializes a game clock, but does not start it. Use start().
	 *
	 * @constructor
	 * @param {NaturalNumber} ticksPerSecond - Clock ticks per second
	 * @param {...Function} gameFunctions - Game logic functions to call each tick
	 */
	constructor( ticksPerSecond, ...gameFunctions )
	{
		/**
		 * Milliseconds per tick
		 *
		 * @private
		 */
		this.msPerTick = 1000 / ticksPerSecond;

		// Use animation frames instead of timeouts on the clientside since it's more efficient
		if ( typeof window !== 'undefined' && ticksPerSecond === 60 )
		{
			this.clockFunction = window.requestAnimationFrame.bind( window, this.frame.bind( this ) );
			this.clockPauseFunction = window.cancelAnimationFrame.bind( window );
		}
		else
		{
			this.clockFunction = setTimeout.bind( null, this.frame.bind( this ), this.msPerTick );
			this.clockPauseFunction = clearTimeout.bind( null );
		}

		this.gameFunctions = gameFunctions;
	}

	/**
	 * Starts the game clock
	 *
	 * @public
	 */
	start()
	{
		this.clock = this.clockFunction();
	}

	/**
	 * Stops the game clock
	 *
	 * @public
	 */
	pause()
	{
		this.clockPauseFunction( this.clock );
	}

	/**
	 * Computes time between ticks and passes that to each game logic function
	 * Called each tick
	 *
	 * @private
	 */
	frame()
	{
		let now = Util.timestamp();

		// Time (sec) since last frame
		let dt = this.last ? ( now - this.last ) / this.msPerTick : 1;
		this.last = now;

		for ( var func of this.gameFunctions )
		{
			func( dt );
		}

		this.clock = this.clockFunction();
	}
}