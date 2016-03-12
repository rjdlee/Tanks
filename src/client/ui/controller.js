import Event from '../../common/state/event';
import Game from '../../common/game/game';
import Render from '../render/render';
import Tank from '../../common/entity/tank';
import InputEvent from '../../common/input/input_event';

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
		this.previously_sent_angle = player.barrel.angle;
		this.input_event = new InputEvent( Game );

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

		let d_angle = Math.abs( new_angle - this.previously_sent_angle );
		if ( d_angle > 0.5 )
		{
			Event.publish( 'controller_aim', new_angle );
			this.previously_sent_angle = new_angle;
		}

		this.input_event.mouse( null, this.player, new_angle );
	}

	mouseDownListener( map )
	{
		// Don't interpolate
		this.input_event.mouse( null, this.player );
	}

	keyDownListener( key )
	{
		// Key is already pressed
		if ( this.key[ key ] )
		{
			return;
		}

		if ( key === 'up' )
		{
			this.key.up = true;
			if ( !this.key.down )
			{
				this.input_event.speed( null, this.player, 1 );
				Event.publish( 'controller_up' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = true;
			if ( !this.key.up )
			{
				this.input_event.speed( null, this.player, -1 );
				Event.publish( 'controller_down' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = true;
			if ( !this.key.right )
			{
				this.input_event.turn( null, this.player, 1 );
				Event.publish( 'controller_left' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = true;
			if ( !this.key.left )
			{
				this.input_event.turn( null, this.player, -1 );
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
				this.input_event.speed( null, this.player, -1 );
				Event.publish( 'controller_down' );
			}
			else
			{
				this.input_event.speed( null, this.player, 0 );
				Event.publish( 'controller_no_move' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = false;
			if ( this.key.up )
			{
				this.input_event.speed( null, this.player, 1 );
				Event.publish( 'controller_up' );
			}
			else
			{
				this.input_event.speed( null, this.player, 0 );
				Event.publish( 'controller_no_move' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = false;
			if ( this.key.right )
			{
				this.input_event.turn( null, this.player, 1 );
				Event.publish( 'controller_right' );
			}
			else
			{
				this.input_event.turn( null, this.player, 0 );
				Event.publish( 'controller_no_turn' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = false;
			if ( this.key.left )
			{
				this.input_event.turn( null, this.player, -1 );
				Event.publish( 'controller_left' );
			}
			else
			{
				this.input_event.turn( null, this.player, 0 );
				Event.publish( 'controller_no_turn' );
			}
		}
	}
}