import Game from './game';
import Connect from './connect';
import BSON from '../common/input/bson.js';
var expect = require( 'chai' ).expect;

describe( 'Connect', function ()
{
	let socket = {
		on: function () {},
		client:
		{
			id: 0
		}
	};
	let connect = new Connect( socket );

	afterEach( 'Clear the Game eventQueue and connect players', function ()
	{
		Game.eventQueue.queue[ Game.eventQueue.middle ].length = 0;
		connect.connectingPlayers.length = 0;
	} );

	describe( '#connectHandler()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'should add 3 event handlers to the socket', function ()
			{
				let i = 0;
				socket.on = function ()
				{
					i++;
				};
				connect.connectHandler( socket );
			} );
		} );
	} );

	describe( '#handshakeHandler()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'should add a spawn function to the event queue and connecting players list', function ()
			{
				let data = 'clientName';
				connect.handshakeHandler( socket, data );

				expect( Game.eventQueue.queue[ Game.eventQueue.middle ] ).to.have.lengthOf( 1 );
				expect( connect.connectingPlayers.size ).to.be.equal( 1 );
			} );
		} );
	} );

	describe( '#disconnectHandler()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'should add 2 remove functions to the event queue', function ()
			{
				connect.disconnectHandler( socket );

				expect( Game.eventQueue.queue[ Game.eventQueue.middle ] ).to.have.lengthOf( 2 );
			} );
		} );
	} );

	describe( '#eventHandler()', function ()
	{
		describe( 'When called with 5 types of BSON encoded events', function ()
		{
			it( 'should add 5 functions to the event queue', function ()
			{
				let data = {
					v: 0,
					t: 0,
					m: 0,
					l: 0,
					r: 0
				};
				Game.gameMap.spawnTank( 0 );
				connect.eventHandler( socket, data );

				expect( Game.eventQueue.queue[ Game.eventQueue.middle ] ).to.have.lengthOf( 5 );
				// console.log( Game.eventQueue.queue );
			} );
		} );
	} );
} );