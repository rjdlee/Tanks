import CircularQueue from './circular_queue';
var expect = require( 'chai' ).expect;

describe( 'CircularQueue', function ()
{
	let circular_queue;

	beforeEach( 'Create a new CircularQueue with length 10', function ()
	{
		circular_queue = new CircularQueue( 10 );
	} );

	describe( 'CircularQueue()', function ()
	{
		describe( 'When called with no arguments', function ()
		{
			it( 'Should create a CircularQueue with length 0', function ()
			{
				circular_queue = new CircularQueue();

				expect( circular_queue.queue ).to.have.lengthOf( 1 );
				expect( circular_queue.head ).to.equal( 0 );
				expect( circular_queue.tail ).to.equal( 0 );
			} );
		} );

		describe( 'When called with length 10', function ()
		{
			it( 'Should create a CircularQueue with length 10', function ()
			{
				circular_queue = new CircularQueue( 10 );

				expect( circular_queue.queue ).to.have.lengthOf( 10 );
				expect( circular_queue.head ).to.equal( 0 );
				expect( circular_queue.tail ).to.equal( 9 );
			} );
		} );

		describe( 'When called with length less than 1', function ()
		{
			it( 'Should throw an error', function ()
			{
				let error;

				try
				{
					circular_queue = new CircularQueue( -10 );
				}
				catch ( e )
				{
					error = e;
				}

				expect( error ).to.exist;
			} );
		} );
	} );

	describe( 'get()', function ( i )
	{
		describe( 'When called with an index within range', function ()
		{
			it( 'Should return undefined', function () {

			} );
		} );

		describe( 'When called with an index out of the range', function ()
		{
			it( 'Should return undefined', function () {

			} );
		} );

		describe( 'When called with an index when ', function ()
		{
			it( 'Should return undefined', function () {

			} );
		} );
	} );

	describe( 'set()', function ( i, value ) {

	} );

	describe( 'insert()', function ( value ) {

	} );
} );