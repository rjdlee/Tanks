import Entity from './entity';

const COUNTDOWN_TICKS = 60 * 10;

export default class Mine extends Entity
{
	constructor( x, y, owner = null, time_left = COUNTDOWN_TICKS )
	{
		super( x, y );

		this.owner = owner;
		this.time_left = COUNTDOWN_TICKS;
	}

	count_down( num_ticks )
	{
		if ( this.time_left <= 1 )
			return true;

		this.time_left -= num_ticks;
	}

	reset()
	{
		this.time_left = COUNTDOWN_TICKS;
	}
}