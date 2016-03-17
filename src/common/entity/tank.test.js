import Tank from './tank';
var expect = require( 'chai' ).expect;

describe( 'Tank', function ()
{
	let tank;

	beforeEach( 'Create a new tank', function ()
	{
		tank = new Tank();
	} );

	describe( 'Tank()', function ()
	{
		describe( 'When called with no arguments', function ()
		{
			it( 'Should create a tank with default settings', function ()
			{
				expect( tank.id ).to.be.empty;
				expect( tank.pos.x ).to.be.equal( 0 );
				expect( tank.pos.y ).to.be.equal( 0 );
				expect( tank.angle ).to.be.equal( 0 );
			} );
		} );

		describe( 'When called with all arguments', function ()
		{
			it( 'Should create a tank with arguments', function ()
			{
				tank = new Tank( 'id', 1, 2, 3 );

				expect( tank.id ).to.be.equal( 'id' );
				expect( tank.pos.x ).to.be.equal( 1 );
				expect( tank.pos.y ).to.be.equal( 2 );
				expect( tank.angle ).to.be.equal( 3 );
			} );
		} );
	} );

	describe( 'moveTo', function ()
	{
		describe( 'When called with non-zero (x, y)', function ()
		{
			it( 'Should move the tank to (x, y)', function ()
			{
				tank.moveTo( 100, 1000 );

				expect( tank.pos.x ).to.be.equal( 100 );
				expect( tank.pos.y ).to.be.equal( 1000 );

				expect( tank.barrel.pos.x ).to.be.equal( 100 );
				expect( tank.barrel.pos.y ).to.be.equal( 1000 );

				let boundingBox = tank.boundingBox.vertices;
				let halfWidth = tank.width / 2;
				let halfHeight = tank.height / 2;
				expect( boundingBox[ 0 ].x ).to.be.equal( 100 - halfWidth );
				expect( boundingBox[ 0 ].y ).to.be.equal( 1000 + halfHeight );
				expect( boundingBox[ 2 ].x ).to.be.equal( 100 + halfWidth );
				expect( boundingBox[ 2 ].y ).to.be.equal( 1000 - halfHeight );

				boundingBox = tank.barrel.boundingBox.vertices;
				halfHeight = tank.barrel.height / 2;
				expect( boundingBox[ 0 ].x ).to.be.equal( 100 );
				expect( boundingBox[ 0 ].y ).to.be.equal( 1000 + halfHeight );
				expect( boundingBox[ 2 ].x ).to.be.equal( 100 + tank.barrel.width );
				expect( boundingBox[ 2 ].y ).to.be.equal( 1000 - halfHeight );
			} );
		} );
	} );
} );