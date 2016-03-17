import Entity from './entity';
var expect = require( 'chai' ).expect;

describe( 'Entity', function ()
{
	let entity;

	beforeEach( 'Create a new instace of GameClass', function ()
	{
		entity = new Entity();
	} );

	describe( '#Entity()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'Should create a bounding box', function ()
			{
				expect( entity.boundingBox ).to.be.ok;
			} );
		} );
	} );

	describe( '#createRectangularBoundingBox()', function ()
	{
		describe( 'When called with a 4x2 entity at (0,0) with angle pi/2', function ()
		{
			it( 'Should create a 2x4 bounding box centered at (0,0)', function ()
			{
				entity = new Entity( 0, 0, 4, 2, Math.PI / 2 );
				let boundingBox = entity.createRectangularBoundingBox();
				let vertices = boundingBox.vertices;

				expect( vertices[ 0 ].x ).to.be.closeTo( -1, 1e-15 );
				expect( vertices[ 0 ].y ).to.be.closeTo( -2, 1e-15 );
				expect( vertices[ 1 ].x ).to.be.closeTo( 1, 1e-15 );
				expect( vertices[ 1 ].y ).to.be.closeTo( -2, 1e-15 );
				expect( vertices[ 2 ].x ).to.be.closeTo( 1, 1e-15 );
				expect( vertices[ 2 ].y ).to.be.closeTo( 2, 1e-15 );
				expect( vertices[ 3 ].x ).to.be.closeTo( -1, 1e-15 );
				expect( vertices[ 3 ].y ).to.be.closeTo( 2, 1e-15 );
			} )
		} );
	} );

	describe( '#move()', function ()
	{
		describe( 'When called twice with positive dX and dY', function ()
		{
			it( 'Should add dX and dY twice to the entity position', function ()
			{
				entity.move( 0.5, 0.5 );
				entity.move( 0.5, 0.5 );

				expect( entity.pos.x ).to.be.equal( 1 );
				expect( entity.pos.y ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called twice with negative dX and dY', function ()
		{
			it( 'Should add dX and dY twice to the entity position', function ()
			{
				entity.move( -0.5, -0.5 );
				entity.move( -0.5, -0.5 );

				expect( entity.pos.x ).to.be.equal( -1 );
				expect( entity.pos.y ).to.be.equal( -1 );
			} );
		} );
	} );

	describe( '#moveTo()', function ()
	{
		describe( 'When called twice with two different positions', function ()
		{
			it( 'Should set the entity position to the second position', function ()
			{
				entity.moveTo( -1, -1 );
				entity.moveTo( 1, 1 );

				expect( entity.pos.x ).to.be.equal( 1 );
				expect( entity.pos.y ).to.be.equal( 1 );
			} );
		} );
	} );

	describe( '#turn()', function ()
	{
		describe( 'When called twice with positive angle', function ()
		{
			it( 'Should add angle twice to the entity angle', function ()
			{
				entity.turn( 0.5 );
				entity.turn( 0.5 );

				expect( entity.angle ).to.be.equal( 1 );
			} );
		} );

		describe( 'When called twice with negative angle', function ()
		{
			it( 'Should add angle twice to the entity angle', function ()
			{
				entity.turn( -0.5 );
				entity.turn( -0.5 );

				expect( entity.angle ).to.be.equal( -1 );
			} );
		} );
	} );

	describe( '#turnTo()', function ()
	{
		describe( 'When called twice with two different angle', function ()
		{
			it( 'Should set the entity angle to the second angle', function ()
			{
				entity.turnTo( -1 );
				entity.turnTo( 1 );

				expect( entity.angle ).to.be.equal( 1 );
			} );
		} );
	} );

	describe( '#setSpeed()', function ()
	{
		describe( 'When called when the entity has an angle of 0', function ()
		{
			it( 'Should set just the x-axis velocity', function ()
			{
				entity.setSpeed( 1 );

				expect( entity.speed ).to.be.equal( 1 );
				expect( entity.velocity.x ).to.be.equal( 1 );
			} );
		} );
	} );

	describe( '#setTurnSpeed()', function ()
	{
		describe( 'When called with some angle', function ()
		{
			it( 'Should set the angular velocity to that angle', function ()
			{
				entity.setTurnSpeed( 1 );

				expect( entity.angularVelocity ).to.be.equal( 1 );
			} );
		} );
	} );
} );