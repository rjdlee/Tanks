import Noise from '../util/noise';
import Vector from '../util/vector';

// Width/ height of each cell in the map grid
const GRIDSIZE = 50;

/**
 * Generates a random arrangement of walls for the game map
 */
class GameMapGeneratorClass
{
	generateWalls( gameMap )
	{
		let gameMapWidth = gameMap.width;
		let gameMapHeight = gameMap.height;
		let spawnWallFunc = gameMap.spawnWall.bind( gameMap )

		let gridWidth = Math.floor( gameMapWidth / GRIDSIZE );
		let gridHeight = Math.floor( gameMapHeight / GRIDSIZE );

		// Random wall generation
		let [ wallTiles, grid ] = this.generateInitialWalls( gridWidth, gridHeight );

		// Clean the walls up
		this.fillInCorners( wallTiles, grid );
		let walls = this.mergeAdjacentWalls( wallTiles, grid );

		// Place walls on the map
		this.convertCoordsToWalls( walls, spawnWallFunc );
		this.generateBorderWalls( gameMapWidth, gameMapHeight, spawnWallFunc );

		return this.generateEmptyTiles( gridWidth, gridHeight, grid );
	}

	/** 
	 * 1st Stage: Randomly generate walls
	 *
	 * @private
	 * @param {NaturalNumber} gridWidth - Game map's width divided by the grid size
	 * @param {NaturalNumber} gridHeight - Game map's height divided by the grid size
	 */
	generateInitialWalls( gridWidth, gridHeight )
	{
		let grid = [];
		let threshold = 0; // Probability of a wall being placed
		let wallTiles = []; // Coordinates with walls

		// Seed the Noise simplex with a random number to give a different map each time
		Noise.seed( Math.random() );

		for ( var y = 0; y < gridHeight; y++ )
		{
			var row = new Array( gridWidth );
			grid[ y ] = row;

			for ( var x = 0; x < gridWidth; x++ )
			{
				// Do not place walls next to the map borders
				if ( y === 0 || y === gridHeight - 1 || x === 0 || x === gridWidth - 1 )
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

					wallTiles.push( new Vector( x, y ) );

					// Increase threshold if next to another wall
					if ( y > 0 && grid[ y - 1 ][ x ] )
						threshold = 0.6;

					continue;
				}

				row[ x ] = 0;
				threshold = 0.6;
			}
		}

		return [ wallTiles, grid ];
	}

	/** 
	 * 2nd Stage: Fill in corner tiles where needed
	 * Let w = 1x1 walls:
	 * w - -         w w -
	 * - w -   -->   - w -
	 * - - -         - - -
	 *
	 * @private
	 * @param {Array} wallTiles - Array of coordinates of walls
	 * @param {Array} grid - Matrix describing the entire game map area as a grid
	 */
	fillInCorners( wallTiles, grid )
	{
		for ( var i in wallTiles )
		{
			var tile = wallTiles[ i ];

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
						wallTiles.push( new Vector( x, tile.y + y ) );
					}
				}
			}
		}
	}

	/** 
	 * 3rd Stage: Combine adjacent 1 x 1 walls into single walls
	 * Let w = 1x1 walls, 1 and 2 = 1xn or nx1 walls:
	 * w w -         1 1 -
	 * - w -   -->   - 2 -
	 * - - -         - - -
	 *
	 * @param {Array} wallTiles - Array of coordinates of walls
	 * @param {Array} grid - Matrix describing the entire game map area as a grid
	 */
	mergeAdjacentWalls( wallTiles, grid )
	{
		let walls = [];

		for ( let i = wallTiles.length - 1; i >= 0; i-- )
		{
			let tile = wallTiles[ i ];
			let wall = {
				lowerBound:
				{
					x: tile.x,
					y: tile.y
				},
				upperBound:
				{
					x: tile.x,
					y: tile.y
				}
			};
			let vertical = false;

			// Skip over wall tiles already assigned to another wall
			if ( grid[ tile.y ][ tile.x ] !== 1 )
			{
				continue;
			}

			grid[ tile.y ][ tile.x ] = 2;

			// Create a vertical wall
			for ( var offset = -1; offset < 2; offset += 2 )
			{
				let cumulativeOffset = offset;
				let posX = tile.x;
				let posY = tile.y + cumulativeOffset;
				let currentTile = grid[ posY ][ posX ];

				while ( currentTile > 0 )
				{
					if ( offset === -1 )
					{
						wall.lowerBound.y += offset;
					}
					else
					{
						wall.upperBound.y += offset;
					}

					grid[ posY ][ posX ] = 2;
					vertical = true;

					cumulativeOffset += offset;
					posY = tile.y + cumulativeOffset;
					currentTile = grid[ posY ][ posX ];
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
				let cumulativeOffset = offset;
				let posX = tile.x + cumulativeOffset;
				let posY = tile.y;
				let currentTile = grid[ posY ][ posX ];

				while ( currentTile > 0 )
				{
					if ( offset === -1 )
					{
						wall.lowerBound.x += offset;
					}
					else
					{
						wall.upperBound.x += offset;
					}

					grid[ posY ][ posX ] = 2;
					vertical = true;

					cumulativeOffset += offset;
					posX = tile.x + cumulativeOffset;
					currentTile = grid[ posY ][ posX ];
				}
			}

			walls.push( wall );
		}

		return walls;
	}

	/** 
	 * 4th Stage: Create actual wall objects from the generated wall grid
	 *
	 * @private
	 * @param {Array} wallTiles - Array of upper and lower coordinates of walls
	 * @param {Function} spawnWallFunc - gameMap.spawnWall()
	 */
	convertCoordsToWalls( walls, spawnWallFunc )
	{
		for ( var i = walls.length - 1; i >= 0; i-- )
		{
			let wall = walls[ i ];
			let wallWidth = ( wall.upperBound.x - wall.lowerBound.x + 1 ) * 50;
			let wallHeight = ( wall.upperBound.y - wall.lowerBound.y + 1 ) * 50;

			// Rectangles are instantiated with their center's position
			let centerPosX = wall.lowerBound.x * 50 + wallWidth / 2;
			let centerPosY = wall.lowerBound.y * 50 + wallHeight / 2;

			spawnWallFunc( null, centerPosX, centerPosY, wallWidth, wallHeight );
		}
	}

	/** 
	 * 5th Stage: Generate walls for the borders of the map
	 * - - -         w w w
	 * - - -   -->   w - w
	 * - - -         w w w
	 *
	 * @private
	 * @param {NaturalNumber} gameMapWidth - gameMap.width
	 * @param {NaturalNumber} gameMapHeight - gameMap.height
	 * @param {Function} spawnWallFunc - gameMap.spawnWall()
	 */
	generateBorderWalls( gameMapWidth, gameMapHeight, spawnWallFunc )
	{
		let halfWidth = this.width >> 1;
		let halfHeight = this.height >> 1;
		let halfTile = GRIDSIZE >> 1;

		// Horizontal wall borders
		spawnWallFunc( null, halfWidth, halfTile, this.width, GRIDSIZE );
		spawnWallFunc( null, halfWidth, this.height - halfTile, this.width, GRIDSIZE );

		// Vertical (left and right) wall borders
		spawnWallFunc( null, halfTile, halfHeight, GRIDSIZE, this.height );
		spawnWallFunc( null, this.width - halfTile, halfHeight, GRIDSIZE, this.height );
	}

	/** 
	 * 6th Stage: Populate empty tiles with all the grid tiles without a wall
	 *
	 * @private
	 * @param {NaturalNumber} gridWidth - Game map's width divided by the grid size
	 * @param {NaturalNumber} gridHeight - Game map's height divided by the grid size
	 * @param {Array} grid - Matrix describing the entire game map area as a grid
	 * @return {Array} An array of coordinates of grid tiles without walls
	 */
	generateEmptyTiles( gridWidth, gridHeight, grid )
	{
		let emptyTiles = [];

		for ( var y = 1; y < gridHeight - 1; y++ )
		{
			var row = grid[ y ];

			for ( var x = 1; x < gridWidth - 1; x++ )
			{
				if ( row[ x ] === 0 )
				{
					emptyTiles.push( new Vector( x, y ) );
				}
			}
		}

		return emptyTiles;
	}
}

let GameMapGenerator = new GameMapGeneratorClass();
export default GameMapGenerator;