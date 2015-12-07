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
		this.mines = new Map();
		this.bullets = new Map();
		this.barrel = new Entity( x, y, 50, 5, 0, -0.5, 0 );
		this.barrel_angle = 0;
	}

	move( x, y )
	{
		super.move( x, y );
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

	reset()
	{
		this.name = 'Tanky';
		this.score = 0;
		this.lastShotTick = 0;
		this.bullets.length = 0;
		this.mines.length = 0;
	}
}