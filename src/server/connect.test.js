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

	afterEach( 'Clear the Game event_queue and connect players', function ()
	{
		Game.event_queue.queue[ Game.event_queue.middle ].length = 0;
		connect.connecting_players.length = 0;
	} );

	describe( '#connect_handler()', function ()
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
				connect.connect_handler( socket );
			} );
		} );
	} );

	describe( '#handshake_handler()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'should add a spawn function to the event queue and connecting players list', function ()
			{
				let data = 'client_name';
				connect.handshake_handler( socket, data );

				expect( Game.event_queue.queue[ Game.event_queue.middle ] ).to.have.lengthOf( 1 );
				expect( connect.connecting_players.size ).to.be.equal( 1 );
			} );
		} );
	} );

	describe( '#disconnect_handler()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'should add 2 remove functions to the event queue', function ()
			{
				connect.disconnect_handler( socket );

				expect( Game.event_queue.queue[ Game.event_queue.middle ] ).to.have.lengthOf( 2 );
			} );
		} );
	} );

	describe( '#event_handler()', function ()
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
				Game.game_map.spawn_tank( 0 );
				connect.event_handler( socket, data );

				expect( Game.event_queue.queue[ Game.event_queue.middle ] ).to.have.lengthOf( 5 );
				// console.log( Game.event_queue.queue );
			} );
		} );
	} );
} );