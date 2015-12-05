import BoundingBox from './bounding_box';
import Util from '../util/util';
import Vector from '../util/vector';

export default class Entity
{
	constructor( x = 0, y = 0, width = 0, height = 0, angle = 0, transform_origin_x = 0, transform_origin_y = 0 )
	{
		this.id = Util.generate_id();
		this.owner;

		this.pos = new Vector( x, y );
		this.next_pos = new Vector();
		this.last_pos = new Vector();
		this.velocity = new Vector();

		this.width = width;
		this.height = height;
		this.radius = Math.hypot( this.width / 2, this.height / 2 );

		// Clockwise from 3 O'clock
		this.angle = angle;
		this.next_angle = 0;
		this.angle_cos = Math.cos( angle );
		this.angle_sin = Math.sin( angle );
		this.angular_velocity = 0;

		this.transform_origin = new Vector( transform_origin_x, transform_origin_y );
		this.bounding_box = this.create_rectangular_bounding_box();
	}

	// Create a rectangular bounding box
	create_rectangular_bounding_box()
	{
		let half_width = this.width / 2;
		let half_height = this.height / 2;
		let vertices = [
			new Vector( this.pos.x - half_width, this.pos.y + half_height ),
			new Vector( this.pos.x - half_width, this.pos.y - half_height ),
			new Vector( this.pos.x + half_width, this.pos.y - half_height ),
			new Vector( this.pos.x + half_width, this.pos.y + half_height )
		];
		let transform_origin_x = this.width * this.transform_origin.x + this.pos.x;
		let transform_origin_y = this.height * this.transform_origin.y + this.pos.y;

		return new BoundingBox( vertices, this.angle, transform_origin_x, transform_origin_y );
	}

	move( dX = 0, dY = 0 )
	{

		this.move_to( this.pos.x + dX, this.pos.y + dY );
	}

	move_to( x = 0, y = 0 )
	{
		let dX = x - this.pos.x,
			dY = y - this.pos.y;

		this.pos.set( x, y );
		this.bounding_box.translate( dX, dY );
	}

	turn( dAngle = 0 )
	{

		this.turn_to( this.angle + dAngle );
	}

	turn_to( angle = 0 )
	{
		let dAngle = this.angle - angle;
		let transform_origin_x = this.width * this.transform_origin.x + this.pos.x;
		let transform_origin_y = this.height * this.transform_origin.y + this.pos.y;

		this.angle = angle;
		this.angle_cos = Math.cos( angle );
		this.angle_sin = Math.sin( angle );

		if ( Math.abs( this.angle ) >= 6.283185 )
			return this.turn_to( this.angle % 6.283185 );

		// Change direction of velocity
		if ( this.velocity.length > 0 )
			this.set_speed( this.speed );

		this.bounding_box.rotate( dAngle, transform_origin_x, transform_origin_y );
	}

	set_speed( speed = 0 )
	{
		this.speed = speed;
		this.velocity.set( speed * this.angle_cos, -speed * this.angle_sin );
	}

	set_turn_speed( speed = 0 )
	{

		this.angular_velocity = speed;
	}
}