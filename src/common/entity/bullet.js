import Entity from './entity';

const MAX_BOUNCES = 1;

export default class Bullet extends Entity
{
	constructor( x = 0, y = 0, angle = 0, speed = 3, owner )
	{
		super( x, y, 5, 2.5, angle );

		this.owner = owner;
		this.num_bounces = 0;

		this.set_speed( speed );
	}

	bounce( edge )
	{
		this.num_bounces++;

		if ( this.num_bounces >= MAX_BOUNCES )
			return true;

		if ( edge.x === 0 )
		{
			if ( this.angle < 0 )
				this.turn_to( -Math.PI - this.angle );
			else
				this.turn_to( Math.PI - this.angle );
		}
		else
		{
			this.turn_to( -this.angle );
		}
	}

	reset()
	{
		this.owner = '';
		this.num_bounces = 0;
	}
}