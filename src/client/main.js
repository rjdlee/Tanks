import Util from 'util/util';
import Game from 'game/game';
import DOM from './dom';
import Connect from './connect';

var renderer,
	map,
	name,
	controller,
	animationClock;

function play()
{
	requestAnimFrame( frame );
}

var now,
	dt,
	last = Util.timestamp();

function frame()
{
	now = Util.timestamp();
	dt = ( now - last ) / 1000; // In seconds

	if ( map )
	{
		update( dt );
		render( dt );
	}

	last = now;
	requestAnimFrame( frame );
}

function update( dt )
{
	game.update( dt );

	// Send event data to the server
	connect.sendStateQueue();
}

function render( dt )
{
	renderer.draw( map.tanks, map.bullets, map.mines, map.explosions, map.walls, controller.camera );
}