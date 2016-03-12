import Connect from './connect';
var expect = require( 'chai' ).expect;

describe( 'Connect', function ()
{
	let socket = {
		on: function () {},
		emit: function () {}
	};
	let connect = new Connect();

	describe( '#send()', function ()
	{
		describe( 'When called with string data', function ()
		{
			it( 'should encode the data and emit it', function ()
			{
				socket.emit = function ( e, d )
				{
					expect( e ).to.be.equal( 'event' );
					expect( d ).to.not.be.equal( 'data' );
				};
				connect.send( socket, 'event', 'data' );
			} );
		} );
	} );

	describe( '#receive()', function ()
	{
		describe( 'When called with a callback function', function ()
		{
			it( 'should encode the data before sending it to the callback function', function ()
			{
				socket.on = function ( e, f )
				{
					f( 'data' );
					expect( e ).to.be.equal( 'event' );
				};
				connect.receive( socket, 'event', function ( d )
				{
					expect( d ).to.not.be.equal( 'data' );
				} );
			} );
		} );

		describe( 'When called with a callback function which receives no data', function ()
		{
			it( 'should directly call the callback function', function ()
			{
				socket.on = function ( e, f )
				{
					f();
					expect( e ).to.be.equal( 'event' );
				};
				connect.receive( socket, 'event', function ( d )
				{
					expect( d ).to.be.undefined;
				} );
			} );
		} );
	} );
} );