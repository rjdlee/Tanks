import Util from '../util/util';

const FRAMERATE = 1000 / 60;

export default class GameLoop
{
	constructor( ...game_functions )
	{
		if ( typeof window !== 'undefined' )
		{
			this.clock_function = window.requestAnimationFrame.bind( window, this.frame.bind( this ) );
			this.clock_pause_function = window.cancelAnimationFrame.bind( window, this.clock );
		}
		else
		{
			this.clock_function = setTimeout.bind( null, this.frame.bind( this ), FRAMERATE );
			this.clock_pause_function = clearTimeout.bind( this.clock );
		}

		this.game_functions = game_functions;
	}

	start()
	{
		this.clock = this.clock_function();
	}

	pause()
	{
		this.clock_pause_function();
	}

	frame()
	{
		let now = this.timestamp();

		// Time (sec) since last frame
		let dt = ( now - this.last ) / FRAMERATE;
		this.last = now;

		for ( var func of this.game_functions )
		{
			func( dt );
		}

		this.clock = this.clock_function();
	}

	timestamp()
	{
		if ( typeof window !== 'undefined' &&
			typeof window.performance !== 'undefined' &&
			typeof window.performance.now !== 'undefined' )
			return window.performance.now();

		return new Date().getTime();
	}
}