import Bullet from './bullet';
import Entity from './entity';
import Vector from '../util/vector';

export default class Tank extends Entity
{
	constructor( id = '', x = 0, y = 0, angle = 0 )
	{
		super( x, y, 50, 25, angle );

		this.id = id;
		this.name = 'Tanky';
		this.score = 0;
		this.last_bullet_tick = 0;
		this.mines = [];
		this.bullets = [];
		this.barrel = new Entity( x, y, 50, 5, 0, -0.5, 0 );
		this.barrel_angle = 0;
	}

	move( x, y )
	{
		super.move( x, y );
		this.barrel.move( x, y );
	}

	move_to( x, y )
	{
		super.move_to( x, y );
		this.barrel.move_to( x, y );
	}

	turn_barrel_to( angle )
	{
		this.barrel_angle = angle;
		this.barrel.turn_to( angle );
	}

	translateAlongWall( edge )
	{
		// Move by the velocity projected onto the unit vector 
		var dotProduct = this.velocity.x * edge.x + this.velocity.y * edge.y;
		this.move( dotProduct * edge.x, dotProduct * edge.y );
	}

	translateAlongPlayer( edgeUnitVector )
	{
		var dotProduct = this.velocity.x * edgeUnitVector.x + this.velocity.y * edgeUnitVector.y;
		this.move( dotProduct * edgeUnitVector.x, dotProduct * edgeUnitVector.y );
	}

	rotateAlongWall( edge, overlap )
	{
		var displacementVector = {
			x: overlap * edge.y,
			y: overlap * edge.x
		};

		if ( edge.x < 0 )
			displacementVector.y = -displacementVector.y;

		if ( edge.y < 0 )
			displacementVector.x = -displacementVector.x;

		this.move( displacementVector.x, displacementVector.y );
	}

	// Cancel velocity in the direction of the other player's colliding edge
	rotateAlongPlayer( edgeUnitVector )
	{
		var tangentialVelocity = this.radius * this.angular_velocity;
		this.move( tangentialVelocity * edgeUnitVector.x, tangentialVelocity * edgeUnitVector.y );
	}

	// Fire a projectile from the end of barrel and return the reference
	shoot()
	{
		this.barrel.rotateBoundingBox();

		// Set the projectile starting position to the middle of the barrel tip
		var projectilePos = new Vector( this.barrel.boundingBox[ 2 ].x, this.barrel.boundingBox[ 2 ].y );
		// projectilePos.add( -this.barrel.boundingBox[ 2 ].x, -this.barrel.boundingBox[ 2 ].y );
		// projectilePos.divide( 2 );
		// projectilePos.add( this.barrel.boundingBox[ 3 ].x, this.barrel.boundingBox[ 3 ].y );

		var projectile = new Projectile( this.id, projectilePos.x, projectilePos.y, this.barrel.angle );
		this.projectiles.push( projectile );

		return projectile;
	}

	// Returns true if there is a collision between this tank and a tank from players
	isPlayerCollision( player )
	{
		// Don't check this tank with itself
		if ( player.id === this.id )
		{
			return;
		}

		// Return if a collision is found
		var edgeUnitVector = this.isRotatedRectangleCollision( player );
		if ( edgeUnitVector )
		{
			return edgeUnitVector;
		}
	}

	reset()
	{
		this.name = 'Tanky';
		this.score = 0;
		this.lastShotTick = 0;
		this.bullets.length = 0;
		this.mines.length = 0;
	}
}