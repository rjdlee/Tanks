import GameClass from './game_class';
var expect = require( 'chai' ).expect;

describe( 'GameClass', function ()
{
	let game_class;
	let game_map;

	beforeEach( 'Create a new instace of GameClass', function ()
	{
		game_class = new GameClass();
		game_map = game_class.game_map;
		game_class.game_map.walls.clear();
	} );

	describe( '#next_tick()', function ()
	{
		describe( 'When called with a spawn event during the present tick', function ()
		{
			it( 'Should spawn the tank and move it', function ()
			{
				let tick = game_map.tick;
				game_class.event_queue.insert( tick, tick, game_map.spawn_tank.bind( game_map, 0, 0, 0, 0 ) );

				game_class.next_tick();

				expect( game_map.tanks.size ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with a spawn event in a past tick', function ()
		{
			it( 'Should rewind the game state and spawn the tank', function ()
			{
				// Since we are creating an event in the past, we need to make sure the past exists
				game_class.next_tick();

				let tick = game_map.tick;
				game_class.event_queue.insert( tick - 1, tick, game_map.spawn_tank.bind( game_map, 0, 0, 0, 0 ) );

				game_class.next_tick();

				expect( game_map.tanks.size ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with a spawn event in a future tick', function ()
		{
			it( 'Should not do anything to the game state', function ()
			{
				let tick = game_map.tick;
				game_class.event_queue.insert( tick + 1, tick, game_map.spawn_tank.bind( game_map, 0, 0, 0, 0 ) );

				game_class.next_tick();

				expect( game_map.tanks.size ).to.be.equal( 0 );
			} );
		} );
	} );

	describe( '#update_tanks()', function ()
	{
		describe( 'When called without dt and when a tank has speed', function ()
		{
			it( 'Should move the tank by the speed', function ()
			{
				let tank = game_class.game_map.spawn_tank( 0, 0, 0, 0 );
				tank.set_speed( 1 );

				// Remove all the walls so there are no collisions
				game_class.game_map.walls.clear();
				game_class.update_tanks();

				expect( tank.pos.x ).to.be.equal( 1 );
				expect( tank.pos.y ).to.be.equal( 0 );
			} );
		} );

		describe( 'When called without dt and when a tank has turning speed', function ()
		{
			it( 'Should turn the tank by the turning speed', function ()
			{
				let tank = game_class.game_map.spawn_tank( 0, 0, 0, 0 );
				tank.set_turn_speed( 1 );
				game_class.update_tanks();

				expect( tank.angle ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with dt of 2 and when a tank has turning speed', function ()
		{
			it( 'Should turn the tank by twice the turning speed', function ()
			{
				let tank = game_class.game_map.spawn_tank( 0, 0, 0, 0 );
				tank.set_turn_speed( 1 );
				game_class.update_tanks( 2 );

				expect( tank.angle ).to.be.equal( 2 );
			} );
		} );
	} );
} );