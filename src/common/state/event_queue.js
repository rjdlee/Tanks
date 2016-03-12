import * as config from './config';

/*
	Store all the player input events up to a certain point in the past and future
	Uses a circular queue to save memory operations
*/
export default class EventQueue
{
	constructor()
	{
		this.limit = config.SNAPSHOT_LIMIT * config.SNAPSHOT_DELAY; // Index of the top of the queue
		this.top = 2 * this.limit - 1;
		this.middle = this.limit; // Index of the current tick in the queue

		// Store input events up to snapshot limit * delay in the past or the future
		this.queue = new Array( 2 * this.limit );

		// Fill with empty arrays
		for ( var i = 0; i < this.queue.length; i++ )
		{
			this.queue[ i ] = [];
		}

		// Index of the earliest unplayed tick
		this.head = this.middle;
	}

	inc_index( i, amount = 1 )
	{
		i += amount;
		i = i % this.queue.length;
		if ( i < 0 )
		{
			i += this.queue.length;
		}

		return i;
	}

	dec_index( i, amount = 1 )
	{
		i -= amount;
		i = i % this.queue.length;
		if ( i < 0 )
		{
			i += this.queue.length;
		}

		return i;
	}

	/**
	 * Convert a tick to an index in this queue
	 * @param {int} tick - Tick to convert
	 * @param {int} game_map_tick - Current game_map tick
	 */
	tick_to_index( tick, game_map_tick )
	{
		let index = tick - game_map_tick;

		// Limit the index to the size of the queue
		if ( index < -this.limit )
		{
			index = this.inc_index( this.top );
		}
		else if ( index > this.limit )
		{
			index = this.top;
		}
		else
		{
			index = this.inc_index( index, this.middle );
		}

		return index;
	}

	/**
	 * Convert an index to a tick
	 * @param {int} i - Index in the queue
	 * @param {int} game_map_tick - Current game_map tick
	 */
	index_to_tick( i, game_map_tick )
	{
		if ( i < 0 || i >= this.queue.length )
		{
			return;
		}

		let tick = i + game_map_tick - this.middle;
		return tick;
	}

	/**
	 * Iterates through the ticks between the lowest tick and the (current tick + 1)
	 * @param {int} tick - Tick to begin the loop at
	 * @param {int} game_map_tick - Current game_map tick
	 * @param {func} callback - Function to call on each loop iteration
	 */
	for_each( tick, game_map_tick, callback )
	{
		let i = this.tick_to_index( tick, game_map_tick );
		let end_tick = this.inc_index( this.middle );

		// Iterate from lowest_tick to 1 tick in the future
		while ( i < end_tick )
		{
			callback( i );
			i = this.inc_index( i );
		}
	}

	// Add an empty array to the head of this and remove the last element of this
	next_tick()
	{
		let length = this.queue.length;

		this.middle = this.inc_index( this.middle );
		this.top = this.inc_index( this.top );

		// No new memory allocations are needed
		let event_queue = this.queue[ this.top ];
		event_queue.length = 0;

		// The lowest tick is no longer invalid since everything has been shifted
		this.head = this.middle;
	}

	/**
	 * Inserts an event callback function (func) at the index tick
	 * @param {int} tick - Tick to insert into
	 * @param {int} game_map_tick - Current game_map tick
	 * @param {func} func - The function that performs the event
	 */
	insert( tick, game_map_tick, func )
	{
		// Center the index around the middle of this queue (current tick)
		var index = this.tick_to_index( tick, game_map_tick );

		// Keep track of how far back we will have to rewind and replay from
		this.set_head( index );

		this.queue[ index ].push( func );
	}

	/**
	 * Returns the lowest tick index as a tick
	 */
	get_head_tick( game_map_tick )
	{
		return this.tick_to_index( this.head, game_map_tick );
	}

	/**
	 * Sets a new lowest tick if it is lower than the current lowest
	 * @param {int} index - Tick to set to centered around this.middle
	 */
	set_head( index )
	{
		// Set the head only if the index is smaller than the current head
		if ( index >= this.head )
		{
			return;
		}

		// 
		if ( this.top <= this.middle && index <= this.top )
		{
			return;
		}

		this.head = index;
	}
}