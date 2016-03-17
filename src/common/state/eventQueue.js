import * as config from './config';

/*
	Store all the player input events up to a certain point in the past and future
	Uses a circular queue to save memory operations
*/
export default class EventQueue
{
	constructor()
	{
		this.limit = config.SNAPSHOTLIMIT * config.SNAPSHOTDELAY; // Index of the top of the queue
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

	incIndex( i, amount = 1 )
	{
		i += amount;
		i = i % this.queue.length;
		if ( i < 0 )
		{
			i += this.queue.length;
		}

		return i;
	}

	decIndex( i, amount = 1 )
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
	 * @param {int} gameMapTick - Current gameMap tick
	 */
	tickToIndex( tick, gameMapTick )
	{
		let index = tick - gameMapTick;

		// Limit the index to the size of the queue
		if ( index < -this.limit )
		{
			index = this.incIndex( this.top );
		}
		else if ( index > this.limit )
		{
			index = this.top;
		}
		else
		{
			index = this.incIndex( index, this.middle );
		}

		return index;
	}

	/**
	 * Convert an index to a tick
	 * @param {int} i - Index in the queue
	 * @param {int} gameMapTick - Current gameMap tick
	 */
	indexToTick( i, gameMapTick )
	{
		if ( i < 0 || i >= this.queue.length )
		{
			return;
		}

		let tick = i + gameMapTick - this.middle;
		return tick;
	}

	/**
	 * Iterates through the ticks between the lowest tick and the (current tick + 1)
	 * @param {int} tick - Tick to begin the loop at
	 * @param {int} gameMapTick - Current gameMap tick
	 * @param {func} callback - Function to call on each loop iteration
	 */
	forEach( tick, gameMapTick, callback )
	{
		let i = this.tickToIndex( tick, gameMapTick );
		let endTick = this.incIndex( this.middle );

		// Iterate from lowestTick to 1 tick in the future
		while ( i < endTick )
		{
			callback( i );
			i = this.incIndex( i );
		}
	}

	// Add an empty array to the head of this and remove the last element of this
	nextTick()
	{
		let length = this.queue.length;

		this.middle = this.incIndex( this.middle );
		this.top = this.incIndex( this.top );

		// No new memory allocations are needed
		let eventQueue = this.queue[ this.top ];
		eventQueue.length = 0;

		// The lowest tick is no longer invalid since everything has been shifted
		this.head = this.middle;
	}

	/**
	 * Inserts an event callback function (func) at the index tick
	 * @param {int} tick - Tick to insert into
	 * @param {int} gameMapTick - Current gameMap tick
	 * @param {func} func - The function that performs the event
	 */
	insert( tick, gameMapTick, func )
	{
		// Center the index around the middle of this queue (current tick)
		var index = this.tickToIndex( tick, gameMapTick );

		// Keep track of how far back we will have to rewind and replay from
		this.setHead( index );

		this.queue[ index ].push( func );
	}

	/**
	 * Returns the lowest tick index as a tick
	 */
	getHeadTick( gameMapTick )
	{
		return this.tickToIndex( this.head, gameMapTick );
	}

	/**
	 * Sets a new lowest tick if it is lower than the current lowest
	 * @param {int} index - Tick to set to centered around this.middle
	 */
	setHead( index )
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