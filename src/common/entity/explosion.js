import Entity from './entity';

const EXPLOSION_RADIUS = 5;
const COUNTDOWN_TICKS = 10;

export default class Explosion extends Entity
{
	constructor( x = 0, y = 0, radius = EXPLOSION_RADIUS, owner, time_left = COUNTDOWN_TICKS )
	{
		super( x, y );

		this.radius = radius;
		this.owner = owner;
		this.time_left = time_left;
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