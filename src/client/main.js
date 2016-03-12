import ClientConnect from './connect';
import Game from '../common/game/game';
import GameLoop from '../common/game/game_loop';
import GameState from '../common/state/state';
import Render from './render/render';

let render_loop = new GameLoop( 60, Render.draw.bind( Render, Game.game_map ) );
let game_loop = new GameLoop( 1,
	Game.next_tick.bind( Game ),
	ClientConnect.send_state_queue.bind( ClientConnect )
);

GameState.addEventListener( 'play', render_loop.start.bind( render_loop ) );
GameState.addEventListener( 'play', game_loop.start.bind( game_loop ) );
GameState.addEventListener( 'disconnect', render_loop.pause.bind( render_loop ) );
GameState.addEventListener( 'disconnect', game_loop.pause.bind( game_loop ) );