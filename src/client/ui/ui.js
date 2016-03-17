import Event from '../../common/state/event';
import GameState from '../../common/state/state';
import Vector from '../../common/util/vector';

/**
 * Connects the game and the DOM/ browser
 *
 * @class
 * @private
 */
class UIClass
{
	constructor()
	{
		this.mousePos = new Vector();

		/**
		 * Map keycodes to key names
		 *
		 * @private
		 */
		this.keys = new Map();
		this.keys.set( 37, 'left' );
		this.keys.set( 38, 'up' );
		this.keys.set( 39, 'right' );
		this.keys.set( 40, 'down' );
		this.keys.set( 32, 'space' );
		this.keys.set( 80, 'p' );

		/**
		 * Save DOM elements to minimize DOM access
		 *
		 * @private
		 */
		this.menu = document.getElementById( 'menu' );
		this.menuName = document.getElementById( 'menuName' );
		this.menuPlay = document.getElementById( 'menuPlay' );
		this.loading = document.getElementById( 'loading' );
		this.hud = document.getElementById( 'hud' );
		this.hudLeaderboard = document.getElementById( 'hudLeaderboard' );
		this.hudScore = document.getElementById( 'hudScore' );

		/**
		 * Canvases for rendering and their contexts
		 *
		 * @public
		 */
		this.canvases = new Map( [
			[ 'tanks', document.getElementById( 'tanksCanvas' ) ],
			[ 'walls', document.getElementById( 'wallsCanvas' ) ]
		] );
		this.contexts = this.getCanvasesContexts( this.canvases );

		/**
		 * Game menu interactions
		 */
		this.menuName.addEventListener( 'change', this.updateName.bind( this ) );
		this.menuPlay.addEventListener( 'click', this.switchToLoadingUI.bind( this ) );

		/**
		 * Game input mouse and keyboard events
		 */
		window.addEventListener( 'keydown', this.keyDownHandler.bind( this ) );
		window.addEventListener( 'keyup', this.keyUpHandler.bind( this ) );
		window.addEventListener( 'mousemove', this.mouseMoveHandler.bind( this ) );
		window.addEventListener( 'mousedown', this.leftMouseHandler.bind( this ) );
		window.addEventListener( 'contextmenu', this.rightMouseHandler.bind( this ) );
		window.addEventListener( 'beforeunload', this.beforeUnloadHandler.bind( this ) );

		/**
		 * Changes in game state hide and show the game menu
		 */
		GameState.addEventListener( 'play', this.switchToGameUI.bind( this ) );
		GameState.onconnect = function ()
		{
			this.menuPlay.disabled = false;
		}.bind( this );
		GameState.addEventListener( 'disconnect', function ()
		{
			this.menuPlay.disabled = true;
			this.switchToMenuUI();
		}.bind( this ) );
	}

	/**
	 * Gets the 2d contexts of the DOM canvases
	 *
	 * @private
	 * @param {Map} canvases
	 * @return {Map} contexts
	 */
	getCanvasesContexts( canvases )
	{
		let contexts = new Map();

		for ( let [ id, canvas ] of canvases )
		{
			contexts.set( id, canvas.getContext( '2d' ) );
		}

		return contexts;
	}

	/**
	 * Resizes the DOM's canvases
	 *
	 * @public
	 * @param {NaturalNumber} width
	 * @param {NaturalNumber} height 
	 */
	resizeCanvases( width, height )
	{
		for ( let [ id, canvas ] of this.canvases )
		{
			canvas.width = width;
			canvas.height = height;
		}
	}

	/**
	 * Make a DOM element visible
	 *
	 * @private
	 * @param {Element} DOMElement
	 */
	show( DOMElement )
	{
		DOMElement.style.visibility = 'visible';
	}

	/**
	 * Make a DOM element invisible
	 *
	 * @private
	 * @param {Element} DOMElement
	 */
	hide( DOMElement )
	{
		DOMElement.style.visibility = 'hidden';
	}

	/**
	 * Handle key events only if the game is running
	 *
	 * @private
	 * @param {Event} e - Event's data
	 */
	keyDownHandler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		if ( this.keys.has( e.keyCode ) )
		{
			Event.publish( 'keydown', this.keys.get( e.keyCode ) );
		}
	}

	/**
	 * Handle key events only if the game is running
	 *
	 * @private
	 * @param {Event} e - Event's data
	 */
	keyUpHandler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		if ( this.keys.has( e.keyCode ) )
		{
			Event.publish( 'keyup', this.keys.get( e.keyCode ) );
		}
	}

	/**
	 * Handle mouse events only if the game is running
	 *
	 * @private
	 * @param {Event} e - Event's data
	 */
	mouseMoveHandler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		this.mousePos.set( e.clientX, e.clientY );
		Event.publish( 'mousemove', this.mousePos );
	}

	/**
	 * Handle mouse events only if the game is running
	 *
	 * @private
	 * @param {Event} e - Event's data
	 */
	leftMouseHandler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		Event.publish( 'leftmouse' );
	}

	/**
	 * Handle mouse events only if the game is running
	 *
	 * @private
	 * @param {Event} e - Event's data
	 */
	rightMouseHandler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		e.preventDefault();
		Event.publish( 'rightmouse' );
		return false;
	}

	beforeUnloadHandler()
	{
		Event.publish( 'windowBeforeUnload' );
	}

	switchToGameUI()
	{
		this.show( this.hud );

		this.hide( this.menu );
		this.hide( this.loading );
	}

	switchToLoadingUI()
	{
		this.show( this.loading );

		this.hide( this.menu );
		this.hide( this.hud );

		if ( GameState.is( 'connected' ) )
		{
			GameState.load();
		}
	}

	switchToMenuUI()
	{
		this.show( this.menu );

		this.hide( this.hud );
		this.hide( this.loading );

		if ( GameState.is( 'play' ) )
		{
			GameState.pause();
		}
	}

	updateName( e )
	{
		this.name = e.target.value;
	}

	updateScore( score = 0 )
	{
		this.id( 'score' )
			.innerHTML = 'Score: ' + score;
	}

	updateLeaderboard( controllerID, leaderboard )
	{
		var leaderboardHTML = '<h3>Leaderboard</h3>';

		if ( leaderboard )
		{
			for ( var i = 0; i < leaderboard.length; i++ )
			{
				var name = leaderboard[ i ].name
				if ( name.length > 10 )
					name = name.substr( 0, 10 ) + '...';

				if ( leaderboard[ i ].id === controllerID )
					leaderboardHTML += '<li><b>' + name + '</li>';
				else
					leaderboardHTML += '<li>' + name + '</li>';
			}
		}

		this.id( 'leaderboard' )
			.innerHTML = leaderboardHTML;
	}
}

var UI = new UIClass();
export default UI;