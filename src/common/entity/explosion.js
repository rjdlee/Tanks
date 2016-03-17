import Entity from './entity';

const EXPLOSIONRADIUS = 5;
const COUNTDOWNTICKS = 10;

/**
 * Mines produce explosions, which are circular entities that destroy other entities
 */
export default class Explosion extends Entity
{
	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} radius
	 * @param {String} owner - ID of tank, which shot this bullet
	 * @param {Number} timeLeft - Number of ticks the explosion lives for
	 */
	constructor( x = 0, y = 0, radius = EXPLOSIONRADIUS, owner, timeLeft = COUNTDOWNTICKS )
	{
		super( x, y );

		this.radius = radius;
		this.owner = owner;
		this.timeLeft = timeLeft;
	}

	/**
	 * Called on each game tick
	 *
	 * @return {Boolean} Returns whether the countdown is over or not
	 */
	countDown( numTicks )
	{
		if ( this.timeLeft <= 1 )
		{
			return true;
		}

		this.timeLeft -= numTicks;
	}

	/**
	 * Resets explosion to factory settings
	 */
	reset()
	{
		this.timeLeft = COUNTDOWNTICKS;
	}
}