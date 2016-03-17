import Event from '../../common/state/event';
import * as config from '../config';
import Game from '../../common/game/game';
import Render from '../render/render';
import Tank from '../../common/entity/tank';

/**
 * Receives and processes user input from a keyboard and mouse
 *
 * @class
 * @public
 */
export default class Controller
{
	/**
	 * @param {Tank} player - User's tank entity
	 */
	constructor( player )
	{
		this.player = player;

		/**
		 * Keys currently pressed
		 */
		this.key = {
			up: false,
			down: false,
			left: false,
			right: false
		};

		/**
		 * Last angle sent to the server
		 */
		this.previouslySentAngle = player.barrel.angle;

		/**
		 * Receive keyboard and mouse events from the class, UI
		 */
		Event.subscribe( 'mousemove', this.mouseMoveListener.bind( this ) );
		Event.subscribe( 'leftmouse', this.leftMouseHandler.bind( this ) );
		Event.subscribe( 'rightmouse', this.rightMouseHandler.bind( this ) );
		Event.subscribe( 'keydown', this.keyDownListener.bind( this ) );
		Event.subscribe( 'keyup', this.keyUpListener.bind( this ) );
	}

	/**
	 * Turns the user's tank's barrel towards the mouse
	 *
	 * @param {Vector} mousePos - (x, y) coordinate of mouse relative to the screen
	 */
	mouseMoveListener( mousePos )
	{
		let adjustedX = this.player.pos.x - mousePos.x - Render.camera.pos.x;
		let adjustedY = this.player.pos.y - mousePos.y - Render.camera.pos.y;
		let newAngle = Math.atan2( adjustedY, -adjustedX );

		let dAngle = Math.abs( newAngle - this.previouslySentAngle );
		if ( dAngle > 0.5 )
		{
			Event.publish( 'controllerAim', newAngle );
			this.previouslySentAngle = newAngle;
		}

		this.player.barrel.turnTo( newAngle );
	}

	/**
	 * Bullet shoot events are sent to the server
	 *
	 * @private
	 */
	leftMouseHandler()
	{
		// Don't interpolate, just send the event to the server
		Event.publish( 'controllerShoot' );
	}

	/**
	 * Landmine drop events are sent to the server
	 *
	 * @private
	 */
	rightMouseHandler()
	{
		// Don't interpolate, just send the event to the server
		Event.publish( 'controllerMine' );
	}

	/**
	 * Key events use a FSM to handle multiple keys pressed simultaneously
	 *
	 * Example:
	 * If "up" and "down" keys are pressed, but "up" was pressed first,
	 * the tank will move forward. If "up" is then released, but "down" is
	 * still pressed, the tank will move down.
	 *
	 * @private
	 * @param {String} key - "up", "down", "left", or "right"
	 */
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
				this.player.setSpeed( config.TANKSPEED );
				Event.publish( 'controllerUp' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = true;
			if ( !this.key.up )
			{
				this.player.setSpeed( -config.TANKSPEED );
				Event.publish( 'controllerDown' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = true;
			if ( !this.key.right )
			{
				this.player.setTurnSpeed( config.TANKTURNSPEED );
				Event.publish( 'controllerLeft' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = true;
			if ( !this.key.left )
			{
				this.player.setTurnSpeed( -config.TANKTURNSPEED );
				Event.publish( 'controllerRight' );
			}
		}
	}

	/**
	 * Refer to keyDownListener(): {@link Controller:#keyDownListener}
	 *
	 * @private
	 * @param {String} key - "up", "down", "left", or "right"
	 */
	keyUpListener( key )
	{
		if ( key === 'up' )
		{
			this.key.up = false;
			if ( this.key.down )
			{
				this.player.setSpeed( -config.TANKSPEED );
				Event.publish( 'controllerDown' );
			}
			else
			{
				this.player.setSpeed( 0 );
				Event.publish( 'controllerNoMove' );
			}
		}
		else if ( key === 'down' )
		{
			this.key.down = false;
			if ( this.key.up )
			{
				this.player.setSpeed( config.TANKSPEED );
				Event.publish( 'controllerUp' );
			}
			else
			{
				this.player.setSpeed( 0 );
				Event.publish( 'controllerNoMove' );
			}
		}
		else if ( key === 'left' )
		{
			this.key.left = false;
			if ( this.key.right )
			{
				this.player.setTurnSpeed( config.TANKTURNSPEED );
				Event.publish( 'controllerRight' );
			}
			else
			{
				this.player.setTurnSpeed( 0 );
				Event.publish( 'controllerNoTurn' );
			}
		}
		else if ( key === 'right' )
		{
			this.key.right = false;
			if ( this.key.left )
			{
				this.player.setTurnSpeed( -config.TANKTURNSPEED );
				Event.publish( 'controllerLeft' );
			}
			else
			{
				this.player.setTurnSpeed( 0 );
				Event.publish( 'controllerNoTurn' );
			}
		}
	}
}