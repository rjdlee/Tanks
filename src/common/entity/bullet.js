import Entity from './entity';

/**
 * Maximum number of times a bullet can bounce off a surface before exploding
 */
const MAXBOUNCES = 1;

/**
 * Moving projectiles fired from tank barrels
 */
export default class Bullet extends Entity
{
	/**
	 * @param {Number} x - Tank barrel's tip's x position
	 * @param {Number} y - Tank barrel's tip's y position
	 * @param {Number} angle - Tank barrel's angle
	 * @param {Number} speed - Movement speed
	 * @param {String} owner - ID of tank, which shot this bullet
	 */
	constructor( x = 0, y = 0, angle = 0, speed = 3, owner )
	{
		super( x, y, 5, 2.5, angle );

		this.owner = owner;
		this.numBounces = 0;

		this.setSpeed( speed );
	}

	/**
	 * Bounce the bullet off a surface \/
	 *
	 * @param {Vector} edge - Edge to bounce off of
	 */
	bounce( edge )
	{
		this.numBounces++;

		if ( this.numBounces >= MAXBOUNCES )
		{
			return true;
		}

		if ( edge.x === 0 )
		{
			if ( this.angle < 0 )
			{
				this.turnTo( -Math.PI - this.angle );
			}
			else
			{
				this.turnTo( Math.PI - this.angle );
			}
		}
		else
		{
			this.turnTo( -this.angle );
		}
	}

	/**
	 * Resets bullet to factory settings
	 */
	reset()
	{
		this.owner = '';
		this.numBounces = 0;
	}
}