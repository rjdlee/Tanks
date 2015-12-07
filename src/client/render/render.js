import Camera from './camera';
import UI from '../ui/ui';
import Vector from '../../common/util/vector';

var wallTexture0 = new Image(),
	wallTexture1 = new Image(),
	floorTexture = new Image();

wallTexture0.src = 'img/wall_1.gif';
wallTexture1.src = 'img/wall_2.gif';
floorTexture.src = 'img/floor_2.jpg';

class Render_Class
{
	constructor()
	{
		let window_width = window.innerWidth;
		let window_height = window.innerHeight;
		this.renderedWalls = false;
		this.camera = new Camera( 0, 0, window_width, window_height );
	}

	draw( game_map )
	{
		this.camera.move_to( game_map.controller.player.pos.x, game_map.controller.player.pos.y, game_map.width, game_map.height );

		if ( !this.renderedWalls )
		{
			this.renderedWalls = true;
			UI.resize_canvases( game_map.width, game_map.height );
			this.draw_background( game_map );
			this.draw_walls( game_map );
		}

		this.draw_tanks( game_map.tanks );
		this.draw_bullets( game_map.bullets );
		this.draw_mines( game_map.mines );
		this.draw_explosions( game_map.explosions );
		this.move_walls();
	}

	draw_tanks( tanks )
	{
		let tank_context = UI.contexts.get( 'tanks' );

		tank_context.clearRect( 0, 0, window.innerWidth, window.innerHeight );
		tank_context.beginPath();
		tank_context.fillStyle = '#666666';

		// Draw the tanks
		for ( var [ id, tank ] of tanks )
		{
			this.draw_polygon( tank.bounding_box.vertices, tank_context );
		}

		tank_context.fill();
		tank_context.save();
		tank_context.beginPath();
		tank_context.fillStyle = '#333';

		for ( var [ id, tank ] of tanks )
		{
			this.draw_polygon( tank.barrel.bounding_box.vertices, tank_context );
		}

		tank_context.fill();
		tank_context.restore();
	}

	draw_bullets( bullets )
	{
		let tank_context = UI.contexts.get( 'tanks' );

		tank_context.save();
		tank_context.beginPath();
		tank_context.fillStyle = '#666';

		for ( var [ id, bullet ] of bullets )
		{
			this.draw_polygon( bullet.bounding_box.vertices, tank_context );
		}

		tank_context.fill();
	}


	draw_walls( game_map )
	{
		let walls = game_map.walls;
		let wall_context = UI.contexts.get( 'walls' );

		wall_context.save();
		wall_context.beginPath();
		wall_context.fillStyle = '#999';

		for ( var [ id, wall ] of walls )
		{
			this.draw_polygon( wall.bounding_box.vertices, wall_context );
		}

		wall_context.fill();
	}

	draw_mines( mines )
	{
		let tank_context = UI.contexts.get( 'tanks' );

		tank_context.save();
		tank_context.beginPath();
		tank_context.strokeStyle = '#FF0000';

		for ( let [ id, mine ] of mines )
			this.draw_circle( mine.pos.x, mine.pos.y, mine.radius );

		tank_context.stroke();
		tank_context.restore();
	}

	draw_explosions( explosions )
	{
		let tank_context = UI.contexts.get( 'tanks' );

		tank_context.save();
		tank_context.beginPath();
		tank_context.fillStyle = '#FF0000';

		for ( let [ id, explosion ] of explosions )
			this.draw_circle( explosion.pos.x, explosion.pos.y, explosion.radius );

		tank_context.fill();
		tank_context.restore();
	}

	draw_background( game_map )
	{
		let wall_context = UI.contexts.get( 'walls' );
		for ( var y = 0; y < game_map.height; y += 400 )
		{
			for ( var x = 0; x < game_map.width; x += 602 )
			{
				wall_context.drawImage( floorTexture, x, y );
			}
		}
	}

	// draw_walls( game_map )
	// {
	// 	let walls = game_map.walls;
	// 	let wall_context = UI.contexts.get( 'walls' );

	// 	for ( let [ id, wall ] of walls )
	// 	{
	// 		let pos = wall.bounding_box.vertices[ 2 ];

	// 		if ( wall.width > wall.height )
	// 		{
	// 			for ( var i = 0; i < wall.width; i += 50 )
	// 			{
	// 				wall_context.drawImage( wallTexture0, Math.floor( pos.x + i ), Math.floor( pos.y ) );
	// 			}
	// 		}
	// 		else
	// 		{
	// 			for ( var i = 0; i < wall.height; i += 50 )
	// 			{
	// 				if ( i + 50 < wall.height )
	// 				{
	// 					wall_context.drawImage( wallTexture1, Math.floor( pos.x ), Math.floor( pos.y + i ) );
	// 					continue;
	// 				}
	// 				wall_context.drawImage( wallTexture0, Math.floor( pos.x ), Math.floor( pos.y + i ) );
	// 			}
	// 		}
	// 	}

	// 	// wall_context.fill();
	// }

	move_walls( walls )
	{
		let wall_canvas = UI.canvases.get( 'walls' );

		wall_canvas.style.left = -Math.round( this.camera.pos.x ) + 'px';
		wall_canvas.style.top = -Math.round( this.camera.pos.y ) + 'px';
	}

	draw_polygon( bounding_box, context )
	{
		let adjusted_bounding_box = [];

		for ( let i = 0; i < 4; i++ )
		{
			let adjusted_x = bounding_box[ i ].x - this.camera.pos.x;
			let adjusted_y = bounding_box[ i ].y - this.camera.pos.y;

			adjusted_x = Math.round( adjusted_x );
			adjusted_y = Math.round( adjusted_y );

			let adjusted_vector = new Vector( adjusted_x, adjusted_y );
			adjusted_bounding_box.push( adjusted_vector );
		}

		context.moveTo( adjusted_bounding_box[ 0 ].x, adjusted_bounding_box[ 0 ].y );
		for ( let vector of adjusted_bounding_box )
		{
			context.lineTo( vector.x, vector.y );
		}
		context.lineTo( adjusted_bounding_box[ 0 ].x, adjusted_bounding_box[ 0 ].y )
	}

	draw_circle( x, y, radius, context )
	{
		context.arc( x - this.camera.pos.x, y - this.camera.pos.y, radius, 0, 6.283185, false );
	}

	// draw_tanks( tanks, camera )
	// {
	// 	tank_context.fillStyle = '#666666';

	// 	// Draw the tanks
	// 	for ( var id in tanks )
	// 	{
	// 		var tank = tanks[ id ];

	// 		this.draw_polygon( tank, tank_context, camera.pos );
	// 		this.draw_polygon( tank.barrel, tank_context, camera.pos );
	// 	}

	// 	tank_context.fill();
	// };

	// var wallStateChange = true;
	// renderWalls( walls, camera )
	// {
	// 	wall_context.clearRect( 0, 0, this.width, this.height );
	// 	wall_context.beginPath();

	// 	for ( var id in walls )
	// 	{
	// 		var wall = walls[ id ];

	// 		this.draw_polygon( wall, wall_context,
	// 		{
	// 			x: 0,
	// 			y: 0
	// 		} );
	// 	}

	// 	wall_context.fill();
	// };

	// var wallStateChange = true;
}

let Render = new Render_Class();
export default Render;