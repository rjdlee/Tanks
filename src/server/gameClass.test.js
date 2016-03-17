import ServerGameClass from './gameClass';
var expect = require( 'chai' ).expect;

describe( 'ServerGameClass', function ()
{
	let serverGameClass;
	let gameMap;

	beforeEach( 'Create a new instace of ServerGameClass', function ()
	{
		serverGameClass = new ServerGameClass();
		gameMap = serverGameClass.gameMap;
		serverGameClass.gameMap.walls.clear();
	} );

	describe( '#update()', function ()
	{
		describe( 'When called with a spawn event during the present tick', function ()
		{
			it( 'Should spawn the tank', function ()
			{
				let tick = gameMap.tick;
				serverGameClass.eventQueue.insert( tick, tick, gameMap.spawnTank.bind( gameMap, 0, 0, 0, 0 ) );

				serverGameClass.update();

				expect( gameMap.tanks.size ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with a spawn event in a past tick', function ()
		{
			it( 'Should rewind the game state and spawn the tank', function ()
			{
				// Since we are creating an event in the past, we need to make sure the past exists
				serverGameClass.update();

				let tick = gameMap.tick;
				serverGameClass.eventQueue.insert( tick - 1, tick, gameMap.spawnTank.bind( gameMap, 0, 0, 0, 0 ) );

				serverGameClass.update();

				expect( gameMap.tanks.size ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with a spawn event in a future tick', function ()
		{
			it( 'Should not do anything to the game state', function ()
			{
				let tick = gameMap.tick;
				serverGameClass.eventQueue.insert( tick + 1, tick, gameMap.spawnTank.bind( gameMap, 0, 0, 0, 0 ) );

				serverGameClass.update();

				expect( gameMap.tanks.size ).to.be.equal( 0 );
			} );
		} );
	} );
} );