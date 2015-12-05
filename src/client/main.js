import Connect from './connect';
import Controller from './ui/controller';
import Event from '../common/state/event';
import Game from '../common/game/game';
import GameLoop from '../common/game/game_loop';
import GameState from '../common/state/state';
import Render from './render/render';
import UI from './ui/ui';
import Util from '../common/util/util';

class ClientGameLoop extends GameLoop
{
	constructor( game_functions )
	{
		super( game_functions );

		// GameState.onplay = this.start.bind( this );
		// GameState.addEventListener( 'play', this.start.bind( this ) );
		// GameState.addEventListener( 'disconnect', this.pause.bind( this ) );
	}
}

let game_loop = new GameLoop( Game.update.bind( Game ),
	Connect.send_state_queue.bind( Connect ),
	Render.draw.bind( Render, Game.game_map )
);

// GameState.onplay = game_loop.start.bind( game_loop );
// GameState.ondisconnect = function ()
// {
// 	this.pause.bind( this );
// 	UI.switch_to_menu_UI();
// 	console.log( '1' );
// }.bind( this );

GameState.addEventListener( 'play', game_loop.start.bind( game_loop ) );
GameState.addEventListener( 'disconnect', game_loop.pause.bind( game_loop ) );