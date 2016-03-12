import Noise from '../util/noise';
import Vector from '../util/vector';

const GRID_SIZE = 50;

class GameMapGeneratorClass
{
	generate_walls( game_map_width, game_map_height, spawn_wall_func )
	{
		let grid_width = Math.floor( game_map_width / GRID_SIZE );
		let grid_height = Math.floor( game_map_height / GRID_SIZE );

		let [ wall_tiles, grid ] = this.generate_initial_walls( grid_width, grid_height );
		this.fill_in_corners( wall_tiles, grid );
		let walls = this.merge_adjacent_walls( wall_tiles, grid );
		this.convert_coords_to_walls( walls, spawn_wall_func );
		this.generate_border_walls( game_map_width, game_map_height, spawn_wall_func );

		return this.generate_empty_tiles( grid_width, grid_height, grid );
	}

	// Randomly generate walls
	generate_initial_walls( grid_width, grid_height )
	{
		let grid = [];
		let threshold = 0; // Probability of a wall being placed
		let wall_tiles = []; // Coordinates with walls

		// Seed the Noise simplex with a random number to give a different map each time
		Noise.seed( Math.random() );

		for ( var y = 0; y < grid_height; y++ )
		{
			var row = new Array( grid_width );
			grid[ y ] = row;

			for ( var x = 0; x < grid_width; x++ )
			{
				// Do not place walls next to the map borders
				if ( y === 0 || y === grid_height - 1 || x === 0 || x === grid_width - 1 )
				{
					row[ x ] = 0;
					continue;
				}

				// Lower the threshold if there is wall above
				if ( y > 0 && grid[ y - 1 ][ x ] )
				{
					threshold = 0;
				}

				// Wall tile if random value is greater than threshold
				if ( Noise.simplex2( x, y ) > threshold )
				{
					row[ x ] = 1;
					threshold = 0;

					wall_tiles.push( new Vector( x, y ) );

					// Increase threshold if next to another wall
					if ( y > 0 && grid[ y - 1 ][ x ] )
						threshold = 0.6;

					continue;
				}

				row[ x ] = 0;
				threshold = 0.6;
			}
		}

		return [ wall_tiles, grid ];
	}

	// Fill in corner tiles where needed
	fill_in_corners( wall_tiles, grid )
	{
		// w - -         w w -
		// - w -   -->   - w -
		// - - -         - - -

		for ( var i in wall_tiles )
		{
			var tile = wall_tiles[ i ];

			for ( var y = -1; y < 2; y += 2 )
			{
				for ( var x = -1; x < 2; x += 2 )
				{
					if ( grid[ tile.y + y ][ tile.x + x ] )
					{
						if ( grid[ tile.y ][ tile.x + x ] )
							continue;

						if ( grid[ tile.y + y ][ tile.x ] )
							continue;

						grid[ tile.y + y ][ tile.x ] = 1;
						wall_tiles.push( new Vector( x, tile.y + y ) );
					}
				}
			}
		}
	}

	// Combine adjacent 1 x 1 walls into single walls
	merge_adjacent_walls( wall_tiles, grid )
	{
		// w's represent 1 x 1 walls
		// 1 and 2 represent combined walls
		// w w -         1 1 -
		// - w -   -->   - 2 -
		// - - -         - - -

		let walls = []; // Instances of Wall

		for ( let i = wall_tiles.length - 1; i >= 0; i-- )
		{
			let tile = wall_tiles[ i ];
			let wall = {
				lower_bound:
				{
					x: tile.x,
					y: tile.y
				},
				upper_bound:
				{
					x: tile.x,
					y: tile.y
				}
			};
			let vertical = false;

			// Skip over wall tiles already assigned to another wall
			if ( grid[ tile.y ][ tile.x ] !== 1 )
				continue;

			grid[ tile.y ][ tile.x ] = 2;

			// Create a vertical wall
			for ( var offset = -1; offset < 2; offset += 2 )
			{
				let cumulative_offset = offset;
				let pos_x = tile.x;
				let pos_y = tile.y + cumulative_offset;
				let current_tile = grid[ pos_y ][ pos_x ];

				while ( current_tile > 0 )
				{
					if ( offset === -1 )
					{
						wall.lower_bound.y += offset;
					}
					else
					{
						wall.upper_bound.y += offset;
					}

					grid[ pos_y ][ pos_x ] = 2;
					vertical = true;

					cumulative_offset += offset;
					pos_y = tile.y + cumulative_offset;
					current_tile = grid[ pos_y ][ pos_x ];
				}
			}

			if ( vertical )
			{
				walls.push( wall );
				continue;
			}

			// Create a horizontal wall if no vertical wall was created
			for ( var offset = -1; offset < 2; offset += 2 )
			{
				let cumulative_offset = offset;
				let pos_x = tile.x + cumulative_offset;
				let pos_y = tile.y;
				let current_tile = grid[ pos_y ][ pos_x ];

				while ( current_tile > 0 )
				{
					if ( offset === -1 )
					{
						wall.lower_bound.x += offset;
					}
					else
					{
						wall.upper_bound.x += offset;
					}

					grid[ pos_y ][ pos_x ] = 2;
					vertical = true;

					cumulative_offset += offset;
					pos_x = tile.x + cumulative_offset;
					current_tile = grid[ pos_y ][ pos_x ];
				}
			}

			walls.push( wall );
		}

		return walls;
	}

	// Create actual wall objects from the generated wall grid
	convert_coords_to_walls( walls, spawn_wall_func )
	{
		for ( var i = walls.length - 1; i >= 0; i-- )
		{
			var wall = walls[ i ];
			let wallWidth = ( wall.upper_bound.x - wall.lower_bound.x + 1 ) * 50;
			let wallHeight = ( wall.upper_bound.y - wall.lower_bound.y + 1 ) * 50;

			// Rectangles are instantiated with their center's position
			let centerPosX = wall.lower_bound.x * 50 + wallWidth / 2;
			let centerPosY = wall.lower_bound.y * 50 + wallHeight / 2;

			spawn_wall_func( null, centerPosX, centerPosY, wallWidth, wallHeight );
		}
	}

	// Generate walls for the borders of the map
	generate_border_walls( game_map_width, game_map_height, spawn_wall_func )
	{
		// - - -         w w w
		// - - -   -->   w - w
		// - - -         w w w
		var halfWidth = this.width >> 1,
			halfHeight = this.height >> 1,
			halfTile = GRID_SIZE >> 1;

		// Horizontal wall borders
		spawn_wall_func( null, halfWidth, halfTile, this.width, GRID_SIZE );
		spawn_wall_func( null, halfWidth, this.height - halfTile, this.width, GRID_SIZE );

		// Vertical (left and right) wall borders
		spawn_wall_func( null, halfTile, halfHeight, GRID_SIZE, this.height );
		spawn_wall_func( null, this.width - halfTile, halfHeight, GRID_SIZE, this.height );
	}

	// Populate empty tiles with all the grid tiles without a wall
	generate_empty_tiles( grid_width, grid_height, grid )
	{
		let empty_tiles = [];

		for ( var y = 1; y < grid_height - 1; y++ )
		{
			var row = grid[ y ];

			for ( var x = 1; x < grid_width - 1; x++ )
			{
				if ( row[ x ] === 0 )
					empty_tiles.push( new Vector( x, y ) );
			}
		}

		return empty_tiles;
	}
}

let GameMapGenerator = new GameMapGeneratorClass();
export default GameMapGenerator;