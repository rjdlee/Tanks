import Event from 'event/event';

class DOM_Class
{
	constructor()
	{
		this.id( 'menu-play' ).addEventListener( 'click', function ()
		{
			this.render_game_ui();
			this.hide_menu_ui();

			Event.dispatch( 'play', name );
		}.bind( this ) );
	}

	id( id )
	{
		return document.getElementById( id );
	}

	get_by_class( name )
	{
		return Array.prototype.slice.call( document.getElementsByClassName( name ) );
	}

	render_game_ui()
	{
		this.id( 'leaderboard' ).style.visibility = '';
		this.id( 'score' ).style.visibility = '';
	}

	hide_game_ui()
	{
		this.id( 'leaderboard' ).style.visibility = 'hidden';
		this.id( 'score' ).style.visibility = 'hidden';
		this.id( 'score' ).innerHTML = 'Score: 0';
	}

	render_menu_ui()
	{
		this.id( 'menu' ).style.visibility = '';
	}

	hide_menu_ui()
	{
		this.id( 'menu' ).style.visibility = 'hidden';
	}

	update_score( score = 0 )
	{
		this.id( 'score' ).innerHTML = 'Score: ' + score;
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

		this.id( 'leaderboard' ).innerHTML = leaderboardHTML;
	}
}

var DOM = new DOM_Class();
export default DOM;