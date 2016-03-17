import Game from './game';
import GameLoop from '../common/game/gameLoop';

export default class Main
{
	constructor( serverConnect, globalIo )
	{
		var loop = new GameLoop( 1,
			Game.update.bind( Game ),
			serverConnect.render.bind( serverConnect, globalIo ) );

		loop.start();
	}
}