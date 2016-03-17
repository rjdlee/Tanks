import BoundingBox from './boundingBox';
import Util from '../util/util';
import Vector from '../util/vector';

/**
 * Core class for all entites
 */
export default class Entity
{
	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} angle
	 * @param {NaturalNumber} [transformOriginX] - Point on [0, 1] along the x-axis to rotate around (0.5 is center)
	 * @param {NaturalNumber} [transformOriginY] - Point on [0, 1] along the y-axis to rotate around
	 */
	constructor( x = 0, y = 0, width = 0, height = 0, angle = 0, transformOriginX = 0.5, transformOriginY = 0.5 )
	{
		this.id = Util.generateId();
		this.owner;

		this.width = width;
		this.height = height;
		this.radius = Math.hypot( this.width / 2, this.height / 2 );

		this.pos = new Vector( x, y );
		this.prevPos = new Vector( x, y );
		this.nextPos = new Vector( x, y );
		this.velocity = new Vector();
		this.interpVelocity = new Vector();

		// Clockwise from 3 O'clock
		this.angle = angle;
		this.angleCos = Math.cos( angle );
		this.angleSin = Math.sin( angle );
		this.prevAngle = angle;
		this.nextAngle = angle;
		this.angularVelocity = 0;
		this.interpAngularVelocity = 0;

		this.transformOrigin = new Vector( transformOriginX, transformOriginY );
		this.boundingBox = this.createRectangularBoundingBox();
	}

	/**
	 * Create a rectangular bounding box
	 *
	 * @private
	 */
	createRectangularBoundingBox()
	{
		let halfWidth = this.width * this.transformOrigin.x;
		let halfHeight = this.height * this.transformOrigin.y;
		let vertices = [
			new Vector( this.pos.x - halfWidth, this.pos.y + this.height - halfHeight ),
			new Vector( this.pos.x - halfWidth, this.pos.y - halfHeight ),
			new Vector( this.pos.x + this.width - halfWidth, this.pos.y - halfHeight ),
			new Vector( this.pos.x + this.width - halfWidth, this.pos.y + this.height - halfHeight )
		];
		let transformOriginX = this.pos.x;
		let transformOriginY = this.pos.y;

		return new BoundingBox( vertices, this.angle, transformOriginX, transformOriginY );
	}

	/**
	 * Move by an amount
	 *
	 * @public
	 * @param {Number} dX - Amount to change x position by
	 * @param {Number} dY - Amount to change y position by
	 */
	move( dX = 0, dY = 0 )
	{

		this.moveTo( this.pos.x + dX, this.pos.y + dY );
	}

	/**
	 * Move to an exact position
	 *
	 * @public
	 * @param {Number} x - X position to set to
	 * @param {Number} y - Y position to set to
	 */
	moveTo( x = 0, y = 0 )
	{
		let dX = x - this.pos.x,
			dY = y - this.pos.y;

		// this.prevPos.set( this.pos.x, this.pos.y );
		this.pos.set( x, y );
		this.boundingBox.translate( dX, dY );
	}

	/**
	 * Turn by an amount
	 *
	 * @public
	 * @param {Number} dAngle - Amount to change angle by
	 */
	turn( dAngle = 0 )
	{

		this.turnTo( this.angle + dAngle );
	}

	/**
	 * Turn to an exact angle
	 *
	 * @public
	 * @param {Number} angle - Angle to set to
	 */
	turnTo( angle = 0 )
	{
		let dAngle = this.angle - angle;
		let transformOriginX = this.pos.x;
		let transformOriginY = this.pos.y;

		// this.prevAngle = this.angle;
		this.angle = angle;
		this.angleCos = Math.cos( angle );
		this.angleSin = Math.sin( angle );

		if ( Math.abs( this.angle ) >= 6.283185 )
		{
			return this.turnTo( this.angle % 6.283185 );
		}

		// Change direction of velocity
		if ( this.velocity.length > 0 )
		{
			this.setSpeed( this.speed );
		}

		this.boundingBox.rotate( dAngle, transformOriginX, transformOriginY );
	}

	/**
	 * Set velocity/ speed independently of angle
	 *
	 * @public
	 * @param {Number} x - Velocity in the x-axis
	 * @param {Number} y - Velocity in the y-axis
	 */
	setVelocity( x = 0, y = 0 )
	{
		this.velocity.set( x, y );
		this.speed = this.velocity.length;
	}

	/**
	 * Set speed in the direction the entity is facing (its angle)
	 *
	 * @public
	 * @param {Number} speed - Magnitude of the velocity
	 */
	setSpeed( speed = 0 )
	{
		this.speed = speed;
		this.velocity.set( speed * this.angleCos, -speed * this.angleSin );
	}

	/**
	 * Set the turning speed
	 *
	 * @public
	 * @param {Number} speed - Magnitude of the tunring speed
	 */
	setTurnSpeed( speed = 0 )
	{

		this.angularVelocity = speed;
	}
}