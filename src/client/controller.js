/*

A controller input controlled player which uses keyboard and mouse events
Extends: Player

*/

import Tank from 'entity/tank';

export default class Controller extends Tank
{
	constructor( id, x, y, angle )
	{
		// Extend the Rectangle class
		Player.call( this, id, x, y, angle );

		this.camera;
		this.key = {
			up: false,
			down: false,
			left: false,
			right: false
		};

		this.checkListeners();
	}

	addCamera( width, height )
	{
		this.camera = new Camera( this.pos.x, this.pos.y, width, height );
	}

	// Assign listeners for mousemove, mousedown, keydown, and keyup
	checkListeners()
	{
		document.addEventListener( 'mousemove', this.mouseMoveListener, false );
		document.addEventListener( 'mousedown', this.mouseDownListener, false );
		document.addEventListener( 'keydown', this.keyDownListener, false );
		document.addEventListener( 'keyup', this.keyUpListener, false );
	};

	mouseMoveListener( e )
	{
		var lastHeading = this.barrel.angle;

		this.barrel.setPosAngle( e.clientX, e.clientY, this.camera );

		// Send event if angle change is > 0.01
		if ( Math.abs( this.barrel.angle - lastHeading ) > 0.05 )
			connect.pushStateEvent( 'm', this.barrel.angle );
	}

	mouseDownListener( map )
	{
		connect.pushStateEvent( 's', this.barrel.angle );
	}

	// If up is pressed before down, move forward. When up is released, move backwards if down is still pressed.
	keyDownListener( e )
	{
		// Forward
		if ( e.keyCode === 38 || e.keyCode === 87 )
		{
			if ( !this.key.down )
			{
				this.setVelocity( 1.5 );
				connect.pushStateEvent( 'v', 1 );
			}

			this.key.up = true;
		}

		// Backward
		else if ( e.keyCode === 40 || e.keyCode === 83 )
		{
			if ( !this.key.up )
			{
				this.setVelocity( -1.5 );
				connect.pushStateEvent( 'v', -1 );
			}

			this.key.down = true;
		}

		// Left
		else if ( e.keyCode === 37 || e.keyCode === 65 )
		{
			if ( !this.key.right )
			{
				this.rotation.speed = -0.05;
				connect.pushStateEvent( 'r', -1 );
			}

			this.key.left = true;
		}

		// Right
		else if ( e.keyCode === 39 || e.keyCode === 68 )
		{
			if ( !this.key.left )
			{
				this.rotation.speed = 0.05;
				connect.pushStateEvent( 'r', 1 );
			}

			this.key.right = true;
		}
	}

	keyUpListener( e )
	{
		// Forward
		if ( e.keyCode === 38 || e.keyCode === 87 )
		{
			this.key.up = false;

			if ( this.key.down )
			{
				this.setVelocity( -1.5 );
				connect.pushStateEvent( 'v', -1 );
			}
			else
			{
				this.setVelocity( 0 );
				connect.pushStateEvent( 'v', 0 );
			}
		}

		// Backward
		else if ( e.keyCode === 40 || e.keyCode === 83 )
		{
			this.key.down = false;

			if ( this.key.up )
			{
				this.setVelocity( 1.5 );
				connect.pushStateEvent( 'v', 1 );
			}
			else
			{
				this.setVelocity( 0 );
				connect.pushStateEvent( 'v', 0 );
			}

			return;
		}

		// Left
		else if ( e.keyCode === 37 || e.keyCode === 65 )
		{
			this.key.left = false;

			if ( this.key.right )
			{
				this.rotation.speed = 0.05;
				connect.pushStateEvent( 'r', 1 );
			}
			else
			{
				this.rotation.speed = 0;
				connect.pushStateEvent( 'r', 0 );
			}
		}

		// Right
		else if ( e.keyCode === 39 || e.keyCode === 68 )
		{
			this.key.right = false;

			if ( this.key.left )
			{
				this.rotation.speed = -0.05;
				connect.pushStateEvent( 'r', -1 );
			}
			else
			{
				this.rotation.speed = 0;
				connect.pushStateEvent( 'r', 0 );
			}
		}
	}
}