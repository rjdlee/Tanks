import GameClass from './gameClass';
var expect = require( 'chai' ).expect;

describe( 'GameClass', function ()
{
	let gameClass;
	let gameMap;

	beforeEach( 'Create a new instace of GameClass', function ()
	{
		gameClass = new GameClass();
		gameMap = gameClass.gameMap;
		gameClass.gameMap.walls.clear();
	} );

	describe( '#updateTanks()', function ()
	{
		describe( 'When called without dt and when a tank has speed', function ()
		{
			it( 'Should move the tank by the speed', function ()
			{
				let tank = gameClass.gameMap.spawnTank( 0, 0, 0, 0 );
				tank.setSpeed( 1 );

				// Remove all the walls so there are no collisions
				gameClass.gameMap.walls.clear();
				gameClass.updateTanks();

				expect( tank.pos.x ).to.be.equal( 1 );
				expect( tank.pos.y ).to.be.equal( 0 );
			} );
		} );

		describe( 'When called without dt and when a tank has turning speed', function ()
		{
			it( 'Should turn the tank by the turning speed', function ()
			{
				let tank = gameClass.gameMap.spawnTank( 0, 0, 0, 0 );
				tank.setTurnSpeed( 1 );
				gameClass.updateTanks();

				expect( tank.angle ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called with dt of 2 and when a tank has turning speed', function ()
		{
			it( 'Should turn the tank by twice the turning speed', function ()
			{
				let tank = gameClass.gameMap.spawnTank( 0, 0, 0, 0 );
				tank.setTurnSpeed( 1 );
				gameClass.updateTanks( 2 );

				expect( tank.angle ).to.be.equal( 2 );
			} );
		} );
	} );
} );