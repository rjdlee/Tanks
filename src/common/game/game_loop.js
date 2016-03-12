import Util from '../util/util';

export default class GameLoop
{
	constructor( ticks_per_second, ...game_functions )
	{
		this.ms_per_tick = 1000 / ticks_per_second;

		if ( typeof window !== 'undefined' && ticks_per_second === 60 )
		{
			this.clock_function = window.requestAnimationFrame.bind( window, this.frame.bind( this ) );
			this.clock_pause_function = window.cancelAnimationFrame.bind( window );
		}
		else
		{
			this.clock_function = setTimeout.bind( null, this.frame.bind( this ), this.ms_per_tick );
			this.clock_pause_function = clearTimeout.bind( null );
		}

		this.game_functions = game_functions;
	}

	start()
	{
		this.clock = this.clock_function();
	}

	pause()
	{
		this.clock_pause_function( this.clock );
	}

	frame()
	{
		let now = Util.timestamp();

		// Time (sec) since last frame
		let dt = ( now - this.last ) / this.ms_per_tick;
		this.last = now;

		for ( var func of this.game_functions )
		{
			func( dt );
		}

		this.clock = this.clock_function();
	}
}