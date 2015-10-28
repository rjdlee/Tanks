var wallTexture0 = new Image(),
	wallTexture1 = new Image(),
	floorTexture = new Image();

wallTexture0.src = 'img/wall_1.gif';
wallTexture1.src = 'img/wall_2.gif';
floorTexture.src = 'img/floor_2.jpg';

export default class Renderer
{

	constructor( width, height )
	{
		this.width = width;
		this.height = height;

		this.contexts = new Map();
		this.canvases = new Map( [
			[ 'players', document.getElementById( 'players-canvas' ) ],
			[ 'walls', document.getElementById( 'walls-canvas' ) ]
		] );

		for ( let [ id, cavas ] of this.canvases )
		{
			canvas.width = width;
			canvas.height = height;

			this.contexts[ id ] = canvas.getContext( '2d' );
		}

		this.canvases.players.width = window.innerWidth;
		this.canvases.players.height = window.innerHeight;

		this.contexts.players.fillStyle = '#666666';
		this.contexts.walls.fillStyle = '#F1F1F1';
	}

	draw( tanks, bullets, mines, explosion, walls, camera )
	{
		this.contexts.players.clearRect( 0, 0, window.innerWidth, window.innerHeight );

		this.draw_tanks( tanks, camera );
		this.draw_bullets( bullets, camera );
		this.draw_mines( mines, camera );
		this.draw_explosions( explosions, camera );
		this.draw_walls( walls, camera );
	}

	draw_tanks( tanks, camera )
	{
		let camera_pos_x = camera.pos.x,
			camera_pos_y = camera.pos.y;

		this.contexts.players.beginPath();
		this.contexts.players.fillStyle = '#666666';

		// Draw the players
		for ( var [ id, tank ] of tanks )
			this.draw_rectangle( player, this.contexts.players, camera_pos_x, camera_pos_y );

		this.contexts.players.fill();
		this.contexts.players.save();
		this.contexts.players.beginPath();
		this.contexts.players.fillStyle = '#333';

		for ( var [ id, tank ] of tanks )
			this.draw_rectangle( player.barrel, this.contexts.players, camera_pos_x, camera_pos_y );

		this.contexts.players.fill();
		this.contexts.players.restore();
	}

	draw_bullets( bullets, camera )
	{
		let camera_pos_x = camera.pos.x,
			camera_pos_y = camera.pos.y;

		this.contexts.players.save();
		this.contexts.players.beginPath();
		this.contexts.players.fillStyle = '#FFFFFF';

		for ( var [ id, bullet ] of bullets )
		this.draw_rectangle( bullet.bounding_box.vertices, this.contexts.players, camera_pos_x, camera_pos_y );

		this.contexts.players.fill();
		this.contexts.players.restore();
	}

	draw_mines( mines, camera )
	{
		let camera_pos_x = camera.pos.x,
			camera_pos_y = camera.pos.y;

		this.contexts.players.save();
		this.contexts.players.beginPath();
		this.contexts.players.strokeStyle = '#FF0000';

		for ( let [ id, mine ] of mines )
			this.draw_circle( mine.pos.x, mine.pos.y, mine.radius, camera_pos_x, camera_pos_y );

		this.contexts.players.stroke();
		this.contexts.players.restore();
	}

	draw_explosions( explosions, camera )
	{
		let camera_pos_x = camera.pos.x,
			camera_pos_y = camera.pos.y;

		this.contexts.players.save();
		this.contexts.players.beginPath();
		this.contexts.players.fillStyle = '#FF0000';

		for ( let [ id, explosion ] of explosions )
			this.draw_circle( explosion.pos.x, explosion.pos.y, explosion.radius, camera_pos_x, camera_pos_y );

		this.contexts.players.fill();
		this.contexts.players.restore();
	}

	renderWalls( walls, camera )
	{
		this.contexts.walls.clearRect( 0, 0, this.width, this.height );

		var context = this.contexts.walls;
		for ( var y = 0; y < this.height; y += 400 )
		{
			for ( var x = 0; x < this.width; x += 602 )
			{
				context.drawImage( floorTexture, x, y );
			}
		}

		for ( var x = 0; x < this.width / 50; x++ )
		{
			for ( var y = 0; y < this.height / 50; y++ )
			{
				console.log( 'test' );
			}
		}

		for ( var id in walls )
		{
			var wall = walls[ id ],
				pos = wall.boundingBox[ 2 ];

			if ( wall.width > wall.height )
			{
				for ( var i = 0; i < wall.width; i += 50 )
				{
					context.drawImage( wallTexture0, Math.floor( pos.x + i ), Math.floor( pos.y ) );
				}
			}
			else
			{
				for ( var i = 0; i < wall.height; i += 50 )
				{
					if ( i + 50 < wall.height )
					{
						context.drawImage( wallTexture1, Math.floor( pos.x ), Math.floor( pos.y + i ) );
						continue;
					}
					context.drawImage( wallTexture0, Math.floor( pos.x ), Math.floor( pos.y + i ) );
				}
			}
		}

		// this.contexts.walls.fill();
	}

	draw_walls( walls, camera )
	{
		this.canvases.walls.style.left = -Math.round( camera.pos.x ) + 'px';
		this.canvases.walls.style.top = -Math.round( camera.pos.y ) + 'px';
	}

	draw_polygon( bounding_box, context, offset_x, offset_y )
	{
		var offsetBoundingBox = [];

		for ( var i = 0; i < 4; i++ )
			offsetBoundingBox.push( new Vector( Math.round( bounding_box[ i ].x - offset_x ), Math.round( bounding_box[ i ].y - offset_y ) ) );

		context.moveTo( offsetBoundingBox[ 0 ].x, offsetBoundingBox[ 0 ].y );
		for ( var i = offsetBoundingBox; i < offsetBoundingBox; i++ )
			context.lineTo( offsetBoundingBox[ i ].x, offsetBoundingBox[ i ].y );
		context.lineTo( offsetBoundingBox[ 0 ].x, offsetBoundingBox[ 0 ].y )
	}

	draw_circle( x, y, radius, context, offset_x, offset_y )
	{
		context.arc( x - offset_x, y - offset_y, radius, 0, 6.283185, counterClockwise );
	}

	// draw_players( players, camera )
	// {
	// 	this.contexts.players.fillStyle = '#666666';

	// 	// Draw the players
	// 	for ( var id in players )
	// 	{
	// 		var player = players[ id ];

	// 		this.draw_rectangle( player, this.contexts.players, camera.pos );
	// 		this.draw_rectangle( player.barrel, this.contexts.players, camera.pos );
	// 	}

	// 	this.contexts.players.fill();
	// };

	// var wallStateChange = true;
	// renderWalls( walls, camera )
	// {
	// 	this.contexts.walls.clearRect( 0, 0, this.width, this.height );
	// 	this.contexts.walls.beginPath();

	// 	for ( var id in walls )
	// 	{
	// 		var wall = walls[ id ];

	// 		this.draw_rectangle( wall, this.contexts.walls,
	// 		{
	// 			x: 0,
	// 			y: 0
	// 		} );
	// 	}

	// 	this.contexts.walls.fill();
	// };

	// var wallStateChange = true;

}
