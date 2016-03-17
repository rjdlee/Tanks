import ClientConnect from './connect';
import * as config from './config';
import Game from '../common/game/game';
import GameLoop from '../common/game/gameLoop';
import GameState from '../common/state/state';
import Render from './render/render';

/**
 * Entry point for client
 */
( function ()
{
	/**
	 * Number of render calls between each game tick
	 */
	let rendersPerTick = config.RENDERRATE / config.TICKRATE;

	/**
	 * Count the number of render calls during the time between ticks
	 */
	let renderCount = 0;

	/**
	 * Game loop runs rendering and game ticking at different rates
	 */
	let renderLoop = new GameLoop( config.RENDERRATE, function ()
	{
		if ( renderCount === rendersPerTick )
		{
			Game.update();
			ClientConnect.sendStateQueue();
			renderCount = 0;
		}
		else
		{
			renderCount++;
		}

		Render.draw( Game.gameMap );
	} );

	/**
	 * Game loop only runs when player is connected and synced to the multiplayer server
	 */
	GameState.addEventListener( 'play', renderLoop.start.bind( renderLoop ) );
	GameState.addEventListener( 'disconnect', renderLoop.pause.bind( renderLoop ) );
}() );