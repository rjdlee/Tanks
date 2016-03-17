import Bullet from './bullet';
import Entity from './entity';
import Vector from '../util/vector';

export default class Tank extends Entity
{
	/**
	 * @param {String} id - Unique ID
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} angle
	 */
	constructor( id = '', x = 0, y = 0, angle = 0 )
	{
		super( x, y, 50, 25, angle );

		this.id = id;
		this.name = 'Tanky';
		this.score = 0;
		this.lastBulletTick = 0;
		this.mines = new Map();
		this.bullets = new Map();
		this.barrel = new Entity( x, y, 50, 5, 0, 0, 0.5 );
		this.barrelAngle = 0;
	}

	/**
	 * Move the tank and its barrel together
	 *
	 * @public
	 * @param {Number} dX - Amount to change x position by
	 * @param {Number} dY - Amount to change y position by
	 */
	moveTo( x, y )
	{
		super.moveTo( x, y );
		this.barrel.moveTo( x, y );
	}

	/**
	 * Turn the tank barrel to an exact angle
	 *
	 * @public
	 * @param {Number} angle - Angle to set barrel to
	 */
	turnBarrelTo( angle )
	{
		this.barrelAngle = angle;
		this.barrel.turnTo( angle );
	}

	/**
	 * Project this tank's velocity onto a surface, which it is colliding with
	 *
	 * @public
	 * @param {Vector} edge - Surface to project velocity onto
	 */
	translateAlongWall( edge )
	{
		// Move by the velocity projected onto the unit vector 
		var dotProduct = this.velocity.x * edge.x + this.velocity.y * edge.y;
		this.move( dotProduct * edge.x, dotProduct * edge.y );
	}

	/**
	 * Project this tank's velocity onto another tank's surface, which it is colliding with
	 *
	 * @public
	 * @param {Vector} edgeUnitVector - Unit Vector of the surface to project velocity onto
	 */
	translateAlongPlayer( edgeUnitVector )
	{
		var dotProduct = this.velocity.x * edgeUnitVector.x + this.velocity.y * edgeUnitVector.y;
		this.move( dotProduct * edgeUnitVector.x, dotProduct * edgeUnitVector.y );
	}

	/**
	 * If a tank rotates into a surface (collision), move it out of the surace
	 *
	 * @public
	 * @param {Vector} edge - Surface tank is colliding with
	 * @param {Number} overlap - Amount the tank is protrudes into the surface
	 */
	rotateAlongWall( edge, overlap )
	{
		var displacementVector = {
			x: overlap * edge.y,
			y: overlap * edge.x
		};

		if ( edge.x < 0 )
		{
			displacementVector.y = -displacementVector.y;
		}

		if ( edge.y < 0 )
		{
			displacementVector.x = -displacementVector.x;
		}

		this.move( displacementVector.x, displacementVector.y );
	}

	/**
	 * If a tank rotates into another tank's surface (collision), move it out of the surace
	 *
	 * @public
	 * @param {Vector} edgeUnitVector - Unit Vector of the surface to project velocity onto
	 */
	rotateAlongPlayer( edgeUnitVector )
	{
		var tangentialVelocity = this.radius * this.angularVelocity;
		this.move( tangentialVelocity * edgeUnitVector.x, tangentialVelocity * edgeUnitVector.y );
	}

	/**
	 * Resets tank to factory settings
	 */
	reset()
	{
		this.name = 'Tanky';
		this.score = 0;
		this.lastShotTick = 0;
		this.bullets.length = 0;
		this.mines.length = 0;
	}
}