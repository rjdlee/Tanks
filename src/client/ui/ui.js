import Event from '../../common/state/event';
import GameState from '../../common/state/state';
import Vector from '../../common/util/vector';

class UI_Class
{
	constructor()
	{
		this.mouse_pos = new Vector();
		this.canvases = new Map();
		this.contexts = new Map();
		this.keys = new Map();
		this.keys.set( 37, 'left' );
		this.keys.set( 38, 'up' );
		this.keys.set( 39, 'right' );
		this.keys.set( 40, 'down' );
		this.keys.set( 32, 'space' );
		this.keys.set( 80, 'p' );

		this.menu = document.getElementById( 'menu' );
		this.menu_name = document.getElementById( 'menu_name' );
		this.menu_play = document.getElementById( 'menu_play' );
		this.loading = document.getElementById( 'loading' );
		this.hud = document.getElementById( 'hud' );
		this.hud_leaderboard = document.getElementById( 'hud_leaderboard' );
		this.hud_score = document.getElementById( 'hud_score' );

		this.canvases.set( 'tanks', document.getElementById( 'tanks_canvas' ) );
		this.canvases.set( 'walls', document.getElementById( 'walls_canvas' ) );

		this.menu_name.addEventListener( 'change', this.update_name.bind( this ) );
		this.menu_play.addEventListener( 'click', this.switch_to_loading_UI.bind( this ) );

		window.addEventListener( 'keydown', this.key_down_handler.bind( this ) );
		window.addEventListener( 'keyup', this.key_up_handler.bind( this ) );
		window.addEventListener( 'mousemove', this.mouse_move_handler.bind( this ) );
		window.addEventListener( 'mousedown', this.mouse_down_handler.bind( this ) );
		window.addEventListener( 'beforeunload', this.before_unload_handler.bind( this ) );

		this.get_canvases_contexts();

		GameState.addEventListener( 'play', this.switch_to_game_UI.bind( this ) );
		GameState.onconnect = function ()
		{
			this.menu_play.disabled = false;
		}.bind( this );
		GameState.addEventListener( 'disconnect', function ()
		{
			this.menu_play.disabled = true;
			this.switch_to_menu_UI();
		}.bind( this ) );
	}

	get_canvases_contexts()
	{
		for ( let [ id, canvas ] of this.canvases )
		{
			this.contexts.set( id, canvas.getContext( '2d' ) );
		}
	}

	resize_canvases( width, height )
	{
		for ( let [ id, canvas ] of this.canvases )
		{
			canvas.width = width;
			canvas.height = height;
		}
	}

	show( DOMElement )
	{
		DOMElement.style.visibility = 'visible';
	}

	hide( DOMElement )
	{
		DOMElement.style.visibility = 'hidden';
	}

	key_down_handler( e )
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

	key_up_handler( e )
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

	mouse_move_handler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		this.mouse_pos.set( e.clientX, e.clientY );
		Event.publish( 'mousemove', this.mouse_pos );
	}

	mouse_down_handler( e )
	{
		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		Event.publish( 'mousedown' );
	}

	before_unload_handler()
	{
		Event.publish( 'window_before_unload' );
	}

	switch_to_game_UI()
	{
		this.show( this.hud );

		this.hide( this.menu );
		this.hide( this.loading );
	}

	switch_to_loading_UI()
	{
		this.show( this.loading );

		this.hide( this.menu );
		this.hide( this.hud );

		if ( GameState.is( 'connected' ) )
		{
			GameState.load();
		}
	}

	switch_to_menu_UI()
	{
		this.show( this.menu );

		this.hide( this.hud );
		this.hide( this.loading );

		if ( GameState.is( 'play' ) )
		{
			GameState.pause();
		}
	}

	update_name( e )
	{
		this.name = e.target.value;
	}

	update_score( score = 0 )
	{
		this.id( 'score' )
			.innerHTML = 'Score: ' + score;
	}

	update_leaderboard( controllerID, leaderboard )
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

var UI = new UI_Class();
export default UI;