import EventQueue from './eventQueue';
import * as config from './config';
var assert = require( 'chai' ).assert;

describe( "EventQueue", function ()
{
	let eventQueue = new EventQueue();
	let eventQueueLength = 2 * config.SNAPSHOTLIMIT * config.SNAPSHOTDELAY;

	afterEach( "Create a new EventQueue", function ()
	{
		eventQueue = new EventQueue();
	} );

	describe( "incIndex()", function ()
	{
		describe( "When called once with index 0", function ()
		{
			it( "Should increment the index by one to 1", function ()
			{
				let index = 0;
				index = eventQueue.incIndex( index );

				assert.equal( index, 1 );
			} );
		} );

		describe( "When called with amount equal to eventQueue length", function ()
		{
			it( "Should set index to 0", function ()
			{
				let index = eventQueue.incIndex( 0, eventQueueLength );

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called with index equal to negative eventQueue length", function ()
		{
			it( "Should increment index to 1 since index is actually 0", function ()
			{
				let index = eventQueue.incIndex( eventQueueLength );

				assert.equal( index, 1 );
			} );
		} );
	} );

	describe( "decIndex()", function ()
	{
		describe( "When called once with index 1", function ()
		{

			it( "Should decrement the index by one to 0", function ()
			{
				let index = 1;
				index = eventQueue.decIndex( index );

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called eventQueue length times", function ()
		{
			it( "Should return top and middle to their original indexes", function ()
			{
				let index = 0;
				for ( var i = 0; i < eventQueueLength; i++ )
				{
					index = eventQueue.decIndex( index );
				}

				assert.equal( index, 0 );
			} );
		} );

		describe( "When called 2 eventQueue length times", function ()
		{
			let index = 0;
			for ( var i = 0; i < 2 * eventQueueLength; i++ )
			{
				index = eventQueue.decIndex( index );
			}
			it( "Should return top and middle to their original indexes", function ()
			{
				assert.equal( index, 0 );
			} );
		} );
	} );

	describe( "tickToIndex()", function ()
	{
		describe( "When called with equal tick and gameTick", function ()
		{
			it( "Should set the index to the middle", function ()
			{
				let index = eventQueue.tickToIndex( 10, 10 );
				let testIndex = eventQueue.middle;

				assert.equal( index, testIndex );
			} );
		} );

		describe( "When called with tick less than gameTick", function ()
		{
			it( "Should set the index to the middle", function ()
			{
				let index = eventQueue.tickToIndex( 9, 10 );
				let testIndex = eventQueue.middle - 1;

				assert.equal( index, testIndex );
			} );
		} );
	} );

	describe( "indexToTick()", function ()
	{
		describe( "When called with an index within the queue", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = eventQueue.indexToTick( 0, 0 );
				let testTick = -eventQueue.middle;

				assert.equal( tick, testTick );
			} );
		} );

		describe( "When called with an index less than 0", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = eventQueue.indexToTick( -1, 0 );

				assert.equal( tick, null );
			} );
		} );

		describe( "When called with an index greater than the queue length", function ()
		{
			it( "Should return a tick", function ()
			{
				let tick = eventQueue.indexToTick( eventQueueLength, 0 );

				assert.equal( tick, null );
			} );
		} );
	} );

	describe( "forEach()", function ()
	{
		describe( "When called with equal tick and gameMap tick", function ()
		{
			it( "Should iterate once", function ()
			{
				let j = 0;
				eventQueue.forEach( 0, 0, function ( i )
				{
					j++;
				} );

				assert.equal( j, 1 );
			} );
		} );

		describe( "When called with tick greater than gameMap tick", function ()
		{
			it( "Should not iterate", function ()
			{
				let j = 0;
				eventQueue.forEach( 1, 0, function ( i )
				{
					j++;
				} );

				assert.equal( j, 0 );
			} );
		} );

		describe( "When called with tick less than gameMap tick", function ()
		{
			it( "Should iterate more than once", function ()
			{
				let j = 0;
				eventQueue.forEach( 0, 1, function ( i )
				{
					j++;
				} );

				assert.equal( j, 2 );
			} );
		} );
	} );

	describe( "nextTick()", function ()
	{
		describe( "When called once with a single event", function ()
		{
			it( "Should shift the top and middle indexes by 1", function ()
			{
				let startTop = eventQueue.top;
				let startMiddle = eventQueue.middle;

				eventQueue.queue[ 1 ] = [ 0 ];
				eventQueue.nextTick();

				// Don't shift the actual contents
				assert.lengthOf( eventQueue.queue[ 1 ], 1 );
				assert.equal( eventQueue.top, 0 );
				assert.equal( eventQueue.middle, startMiddle + 1 );
				assert.equal( eventQueue.head, startMiddle + 1 );
			} );
		} );

		describe( "When called eventQueue length times", function ()
		{
			it( "Should return top and middle to their original indexes", function ()
			{
				let startTop = eventQueue.top;
				let startMiddle = eventQueue.middle;

				eventQueue.queue[ startTop ] = [ 0 ];
				for ( var i = 0; i < eventQueueLength; i++ )
				{
					eventQueue.nextTick();
				}

				for ( var i = 0; i < eventQueueLength; i++ )
				{
					assert.lengthOf( eventQueue.queue[ i ], 0 );
				}
				assert.equal( eventQueue.top, startTop );
				assert.equal( eventQueue.middle, startMiddle );
				assert.equal( eventQueue.head, startMiddle );
			} );
		} );
	} );

	describe( "insert()", function ()
	{
		describe( "When called with equal tick and gameMap tick", function ()
		{
			it( "Should insert a function at the middle index of the queue", function ()
			{
				eventQueue.insert( 0, 0, function () {} );
				let middle = eventQueue.middle;

				assert.lengthOf( eventQueue.queue[ middle ], 1 );
				assert.equal( eventQueue.head, middle );
			} );
		} );

		describe( "When called with tick less than gameMap tick", function ()
		{
			it( "Should insert a function at the (middle - 1) index of the queue", function ()
			{
				eventQueue.insert( 0, 1, function () {} );
				let middle = eventQueue.middle;

				assert.lengthOf( eventQueue.queue[ middle - 1 ], 1 );
				assert.equal( eventQueue.head, middle - 1 );
			} );
		} );
	} );

	describe( "getHeadTick()", function ()
	{
		describe( "When called without changing the head", function ()
		{
			it( "Should return the gameMap tick", function ()
			{
				let tick = eventQueue.getHeadTick( 0 );

				assert.equal( tick, 0 );
			} );
		} );
	} );

	describe( "setHead()", function ()
	{
		describe( "When called with index within queue", function ()
		{
			it( "Should set the head to the index", function ()
			{
				eventQueue.setHead( 0 );

				assert.equal( eventQueue.head, 0 );
			} );
		} );

		describe( "When head is the last index and index is the first index", function ()
		{
			it( "Should set the head to the index", function ()
			{
				eventQueue.head = eventQueueLength - 1;
				eventQueue.setHead( 0 );

				assert.equal( eventQueue.head, 0 );
			} );
		} );

		describe( "When head is less than the index", function ()
		{
			it( "Should not change the head", function ()
			{
				// Shift the top to index 0
				eventQueue.nextTick();

				eventQueue.head = 0;
				eventQueue.setHead( eventQueueLength - 1 );

				assert.equal( eventQueue.head, 0 );
			} );
		} );
	} );

} );