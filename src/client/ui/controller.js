import Event from '../../common/state/event';
import Tank from '../../common/entity/tank';
import Render from '../render/render';

export default class Controller
{
	constructor( player )
	{
		this.player = player;
		this.key = {
			up: false,
			down: false,
			left: false,
			right: false
		};

		Event.subscribe( 'mousemove', this.mouseMoveListener.bind( this ) );
		Event.subscribe( 'mousedown', this.mouseDownListener.bind( this ) );
		Event.subscribe( 'keydown', this.keyDownListener.bind( this ) );
		Event.subscribe( 'keyup', this.keyUpListener.bind( this ) );
	}

	mouseMoveListener( mouse_pos )
	{
		let adjusted_x = this.player.pos.x - mouse_pos.x - Render.camera.pos.x;
		let adjusted_y = this.player.pos.y - mouse_pos.y - Render.camera.pos.y;
		let new_angle = Math.atan2( adjusted_y, -adjusted_x );

		let d_angle = Math.abs( new_angle - this.player.barrel.angle );
		if ( d_angle > 0.05 )
		{
			Event.publish( 'controller_aim', this.player.barrel.angle );
		}

		this.player.turn_barrel_to( new_angle );
	}

	mouseDownListener( map )
	{
		Event.publish( 'controller_shoot', this.player.barrel.angle );
	}

	keyDownListener( key )
	{
		if ( this.key[ key ] )
		{
			return;
		}

		if ( key === 'up' )
		{
			this.key.up = true;
			if ( !this.key.down )
			{
				this.player.set_speed( 1.5 );
				Event.publish( 'controller_up' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = true;
			if ( !this.key.up )
			{
				this.player.set_speed( -1.5 );
				Event.publish( 'controller_down' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = true;
			if ( !this.key.right )
			{
				this.player.set_turn_speed( 0.05 );
				Event.publish( 'controller_left' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = true;
			if ( !this.key.left )
			{
				this.player.set_turn_speed( -0.05 );
				Event.publish( 'controller_right' );
			}
		}
	}

	keyUpListener( key )
	{
		if ( key === 'up' )
		{
			this.key.up = false;
			if ( this.key.down )
			{
				this.player.set_speed( -1.5 );
				Event.publish( 'controller_down' );
			}
			else
			{
				this.player.set_speed( 0 );
				Event.publish( 'controller_no_move' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = false;
			if ( this.key.up )
			{
				this.player.set_speed( 1.5 );
				Event.publish( 'controller_up' );
			}
			else
			{
				this.player.set_speed( 0 );
				Event.publish( 'controller_no_move' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = false;
			if ( this.key.right )
			{
				this.player.set_turn_speed( 0.05 );
				Event.publish( 'controller_right' );
			}
			else
			{
				this.player.set_turn_speed( 0 );
				Event.publish( 'controller_no_turn' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = false;
			if ( this.key.left )
			{
				this.player.set_turn_speed( -0.05 );
				Event.publish( 'controller_left' );
			}
			else
			{
				this.player.set_turn_speed( 0 );
				Event.publish( 'controller_no_turn' );
			}
		}
	}
}