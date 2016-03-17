import Entity from './entity';

const COUNTDOWNTICKS = 60 * 10;

/**
 * Stationary weapon "dropped" by tanks
 */
export default class Mine extends Entity
{
	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @param {String} owner - ID of tank, which dropped this mine
	 * @param {Number} timeLeft - Number of ticks until the mine explodes
	 */
	constructor( x, y, owner = null, timeLeft = COUNTDOWNTICKS )
	{
		super( x, y );

		this.owner = owner;
		this.timeLeft = COUNTDOWNTICKS;
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
	 * Resets mine to factory settings
	 */
	reset()
	{
		this.timeLeft = COUNTDOWNTICKS;
	}
}