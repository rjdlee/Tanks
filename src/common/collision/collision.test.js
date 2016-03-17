import Collision from './collision';
import Entity from '../entity/entity';
var expect = require( 'chai' ).expect;

describe( 'Collision', function ()
{
	describe( '#isColliding()', function ()
	{
		describe( 'When called with two entities who are far apart', function ()
		{
			it( 'Should return false', function ()
			{
				// Pos: (0, 0), Size: 2x4, Angle: 0
				let entityA = new Entity( 0, 0, 2, 4, 0 );

				// Pos: (1000, 1000), Size: 2x4, Angle: 0.5
				let entityB = new Entity( 1000, 1000, 2, 4, 0.5 );

				let isColliding = Collision.isColliding( entityA, entityB );
				expect( isColliding ).to.be.false;
			} );
		} );

		describe( 'When called with two colliding entities, first one of which is rotated', function ()
		{
			it( 'Should return true', function ()
			{
				let entityA = new Entity( 0, 0, 2, 4, 0.1 );
				let entityB = new Entity( 0, 0, 2, 4, 0 );

				let isColliding = Collision.isColliding( entityA, entityB );
				expect( isColliding ).to.be.true;
			} );
		} );

		describe( 'When called with two colliding entities, second one of which is rotated', function ()
		{
			it( 'Should return true', function ()
			{
				let entityA = new Entity( 0, 0, 2, 4, 0 );
				let entityB = new Entity( 0, 0, 2, 4, 0.1 );

				let isColliding = Collision.isColliding( entityA, entityB );
				expect( isColliding ).to.be.true;
			} );
		} );

		describe( 'When called with two rotated colliding entities', function ()
		{
			it( 'Should return true', function ()
			{
				let entityA = new Entity( 0, 0, 2, 4, -0.1 );

				// Offset the y axis so that the collision involves a single vertex, not the entire body
				let entityB = new Entity( 0, 2, 2, 4, 0.1 );

				let isColliding = Collision.isColliding( entityA, entityB );
				expect( isColliding ).to.be.true;
				expect( Collision.edge.length ).to.be.equal( 4 );
				expect( Collision.overlap ).to.exist;
			} );
		} );
	} );
} );