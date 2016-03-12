import Game from './game';
import GameLoop from '../common/game/game_loop';

export default class Main
{
	constructor( server_connect, global_io )
	{
		var loop = new GameLoop( 1,
			Game.next_tick.bind( Game ),
			server_connect.render.bind( server_connect, global_io ) );

		loop.start();
	}
}