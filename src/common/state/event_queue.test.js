import EventQueue from './event_queue';
import * as config from './config';
var assert = require( 'chai' ).assert;

describe( "EventQueue", function ()
{
	let event_queue = new EventQueue();
	let event_queue_length = 2 * config.SNAPSHOT_LIMIT * config.SNAPSHOT_DELAY;

	afterEach( "Create a new EventQueue", function ()
	{
		event_queue = new EventQueue();
	} );

	describe( "inc_index()", function ()
	{
		describe( "When called once with index 0", function ()
		{
			it( "Should increment the index by one to 1", function ()
			{
				let index = 0;
				index = event_queue.inc_index( index );

				assert.equal( index, 1 );
			} );
		} );

		describe( "When called with amount equal to event_queue length", function ()
		{
			it( "Should set index to 0", function ()
			{
				let index = event_queue.inc_index( 0, event_queue_length );

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called with index equal to negative event_queue length", function ()
		{
			it( "Should increment index to 1 since index is actually 0", function ()
			{
				let index = event_queue.inc_index( event_queue_length );

				assert.equal( index, 1 );
			} );
		} );
	} );

	describe( "dec_index()", function ()
	{
		describe( "When called once with index 1", function ()
		{

			it( "Should decrement the index by one to 0", function ()
			{
				let index = 1;
				index = event_queue.dec_index( index );

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called event_queue length times", function ()
		{
			it( "Should return top and middle to their original indexes", function ()
			{
				let index = 0;
				for ( var i = 0; i < event_queue_length; i++ )
				{
					index = event_queue.dec_index( index );
				}

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called 2 event_queue length times", function ()
		{
			let index = 0;
			for ( var i = 0; i < 2 * event_queue_length; i++ )
			{
				index = event_queue.dec_index( index );
			}
			it( "Should return top and middle to their original indexes", function ()
			{
				assert.equal( index, 0 );
			} );
		} );
	} );

	describe( "tick_to_index()", function ()
	{
		describe( "When called with equal tick and game_tick", function ()
		{
			it( "Should set the index to the middle", function ()
			{
				let index = event_queue.tick_to_index( 10, 10 );
				let test_index = event_queue.middle;

				assert.equal( index, test_index );
			} );
		} );

		describe( "When called with tick less than game_tick", function ()
		{
			it( "Should set the index to the middle", function ()
			{
				let index = event_queue.tick_to_index( 9, 10 );
				let test_index = event_queue.middle - 1;

				assert.equal( index, test_index );
			} );
		} );
	} );

	describe( "index_to_tick()", function ()
	{
		describe( "When called with an index within the queue", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = event_queue.index_to_tick( 0, 0 );
				let test_tick = -event_queue.middle;

				assert.equal( tick, test_tick );
			} );
		} );

		describe( "When called with an index less than 0", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = event_queue.index_to_tick( -1, 0 );

				assert.equal( tick, null );
			} );
		} );

		describe( "When called with an index greater than the queue length", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = event_queue.index_to_tick( event_queue_length, 0 );

				assert.equal( tick, null );
			} );
		} );
	} );

	describe( "for_each()", function ()
	{
		describe( "When called with equal tick and game_map tick", function ()
		{
			it( "Should iterate once", function ()
			{
				let j = 0;
				event_queue.for_each( 0, 0, function ( i )
				{
					j++;
				} );

				assert.equal( j, 1 );
			} );
		} );

		describe( "When called with tick greater than game_map tick", function ()
		{
			it( "Should not iterate", function ()
			{
				let j = 0;
				event_queue.for_each( 1, 0, function ( i )
				{
					j++;
				} );

				assert.equal( j, 0 );
			} );
		} );

		describe( "When called with tick less than game_map tick", function ()
		{
			it( "Should iterate more than once", function ()
			{
				let j = 0;
				event_queue.for_each( 0, 1, function ( i )
				{
					j++;
				} );

				assert.equal( j, 2 );
			} );
		} );
	} );

	describe( "next_tick()", function ()
	{
		describe( "When called once with a single event", function ()
		{
			it( "Should shift the top and middle indexes by 1", function ()
			{
				let start_top = event_queue.top;
				let start_middle = event_queue.middle;

				event_queue.queue[ 1 ] = [ 0 ];
				event_queue.next_tick();

				// Don't shift the actual contents
				assert.lengthOf( event_queue.queue[ 1 ], 1 );
				assert.equal( event_queue.top, 0 );
				assert.equal( event_queue.middle, start_middle + 1 );
				assert.equal( event_queue.head, start_middle + 1 );
			} );
		} );

		describe( "When called event_queue length times", function ()
		{
			it( "Should return top and middle to their original indexes", function ()
			{
				let start_top = event_queue.top;
				let start_middle = event_queue.middle;

				event_queue.queue[ start_top ] = [ 0 ];
				for ( var i = 0; i < event_queue_length; i++ )
				{
					event_queue.next_tick();
				}

				for ( var i = 0; i < event_queue_length; i++ )
				{
					assert.lengthOf( event_queue.queue[ i ], 0 );
				}
				assert.equal( event_queue.top, start_top );
				assert.equal( event_queue.middle, start_middle );
				assert.equal( event_queue.head, start_middle );
			} );
		} );
	} );

	describe( "insert()", function ()
	{
		describe( "When called with equal tick and game_map tick", function ()
		{
			it( "Should insert a function at the middle index of the queue", function ()
			{
				event_queue.insert( 0, 0, function () {} );
				let middle = event_queue.middle;

				assert.lengthOf( event_queue.queue[ middle ], 1 );
				assert.equal( event_queue.head, middle );
			} );
		} );

		describe( "When called with tick less than game_map tick", function ()
		{
			it( "Should insert a function at the (middle - 1) index of the queue", function ()
			{
				event_queue.insert( 0, 1, function () {} );
				let middle = event_queue.middle;

				assert.lengthOf( event_queue.queue[ middle - 1 ], 1 );
				assert.equal( event_queue.head, middle - 1 );
			} );
		} );
	} );

	describe( "get_head_tick()", function ()
	{
		describe( "When called without changing the head", function ()
		{
			it( "Should return the game_map tick", function ()
			{
				let tick = event_queue.get_head_tick( 0 );

				assert.equal( tick, 0 );
			} );
		} );
	} );

	describe( "set_head()", function ()
	{
		describe( "When called with index within queue", function ()
		{
			it( "Should set the head to the index", function ()
			{
				event_queue.set_head( 0 );

				assert.equal( event_queue.head, 0 );
			} );
		} );

		describe( "When head is the last index and index is the first index", function ()
		{
			it( "Should set the head to the index", function ()
			{
				event_queue.head = event_queue_length - 1;
				event_queue.set_head( 0 );

				assert.equal( event_queue.head, 0 );
			} );
		} );

		describe( "When head is less than the index", function ()
		{
			it( "Should not change the head", function ()
			{
				// Shift the top to index 0
				event_queue.next_tick();

				event_queue.head = 0;
				event_queue.set_head( event_queue_length - 1 );

				assert.equal( event_queue.head, 0 );
			} );
		} );
	} );

} );