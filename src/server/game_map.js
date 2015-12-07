import GameMap from '../common/game/game_map';
import Collision from '../common/collision/collision';
import GameMapState from '../common/game/game_map_state';
import Noise from '../common/util/noise';
import Score from '../common/game/score';
import Snapshot from '../common/snapshot/snapshot';
import SnapshotList from '../common/snapshot/snapshot_list';
import Tank from '../common/entity/tank';
import Vector from '../common/util/vector';

const SNAPSHOT_LIMIT = 100;
const SNAPSHOT_DELAY = 3;

export default class ServerGameMap extends GameMap
{
	constructor( width, height )
	{
		super( width, height );

		this.score = new Score();
		this.snapshots = new SnapshotList();
		this.isReplayingSnapshot;

		this.generateWalls();
		this.saveSnapshot();
	}

	// Save a snapshot for the current tick and timestamp
	saveSnapshot()
	{
		let data = GameMapState.encode( this );
		this.snapshots.unshift( new Snapshot( data ) );
	}

	// Load a snapshot for the given timestamp
	loadSnapshot( timestamp )
	{
		var snapshot = this.snapshots.getByTime( timestamp );
		if ( !snapshot )
		{
			return;
		}

		GameMapState.decode( snapshot.data, this );

		this.tick = snapshot.tick;
		this.timestamp = snapshot.timestamp;
		this.snapshot = snapshot;
	}

	// Bring a snapshot to the current tick and timestamp
	replaySnapshot()
	{
		var snapshot = this.snapshots.getByTick( this.tick ),
			targetTick = this.snapshots.head.tick;

		this.isReplayingSnapshot = true;

		while ( this.tick < targetTick )
		{
			if ( this.tick >= snapshot.tick )
			{
				snapshot = snapshot.next;

				for ( var id in this.tanks )
				{
					if ( !( id in snapshot.tanks ) )
						delete this.tanks[ id ];
				}

				for ( var id in snapshot.tanks )
				{
					if ( id in this.tanks )
						continue;

					var tank = snapshot.tanks[ id ];
					this.tanks[ tank.id ] = new Tank( tank.id, tank.pos.x, tank.pos.y, tank.angle );
					this.tanks[ tank.id ].barrel.setAngle( tank.facing );
				}

				for ( var id in this.projectiles )
				{
					if ( !( id in snapshot.projectiles ) )
						delete this.projectiles[ id ];
				}

				for ( var id in snapshot.projectiles )
				{
					if ( id in this.projectiles )
						continue;

					var projectile = snapshot.projectiles[ id ];
					this.projectiles[ projectile.id ] = new Projectile( projectile.pid, projectile.pos.x, projectile.pos.y, projectile.angle, projectile.speed );
				}

				for ( var id in this.walls )
				{
					if ( !( id in snapshot.walls ) )
						delete this.walls[ id ];
				}

				for ( var id in snapshot.walls )
				{
					if ( id in this.walls )
						continue;

					var wall = snapshot.walls[ id ];
					this.walls.push( new Wall( wall.pos.x, wall.pos.y, wall.width, wall.height ) );
				}

				snapshot = this.saveSnapshot();
			}

			this.nextTick();
		}

		this.snapshots.shift();
		this.isReplayingSnapshot = false;
	}

	diffSnapshot( snapshot, prevSnapshot )
	{
		let diff = {};

		if ( !prevSnapshot )
		{
			return snapshot.data;
		}

		for ( let data_key in snapshot.data )
		{
			let data_diff = diffObjects( snapshot.data[ data_key ], prevSnapshot.data[ data_key ] );

			if ( Object.keys( data_diff ).length > 0 )
			{
				diff[ data_key ] = data_diff;
			}
		}

		return diff;

		function diffObjects( objects, prevObjects )
		{
			var diff = {};

			for ( var id in objects )
			{
				var object = objects[ id ],
					idDiff = {};

				// Object is not in previous
				if ( !( id in prevObjects ) )
				{
					diff[ id ] = {};
					diff[ id ].add = JSON.parse( JSON.stringify( object ) );
					continue;
				}

				// Convert objects to JSON and do string comparison
				var prevObject = prevObjects[ id ];
				for ( var property in object )
				{
					if ( object.hasOwnProperty( property ) )
					{
						if ( JSON.stringify( object[ property ] ) !== JSON.stringify( prevObject[ property ] ) )
							idDiff[ property ] = JSON.parse( JSON.stringify( object[ property ] ) );
					}
				}

				if ( Object.keys( idDiff ).length > 0 )
				{
					if ( 'id' in object )
						diff[ object.id ] = idDiff;
					else
						diff[ id ] = idDiff;
				}
			}

			// Object is in previous, but not current
			for ( var id in prevObjects )
			{
				if ( !( id in objects ) )
				{
					diff[ id ] = 'remove';
				}
			}

			return diff;
		}
	}

	// update()
	// {
	// 	// Draw the tanks
	// 	for ( var i in this.tanks )
	// 	{
	// 		var tank = this.tanks[ i ];
	// 		tank.rotate();

	// 		for ( var id in this.walls )
	// 		{
	// 			var wall = this.walls[ id ];
	// 			collision = tank.isRectangleCollision( wall );

	// 			if ( collision )
	// 			{
	// 				tank.rotateAlongWall( collision[ 0 ], collision[ 1 ] );
	// 				continue;
	// 			}
	// 		}

	// 		for ( var id in this.tanks )
	// 		{
	// 			if ( id === i )
	// 				continue;

	// 			var idTank = this.tanks[ id ];
	// 			collision = tank.isTankCollision( idTank );

	// 			if ( collision )
	// 			{
	// 				var edgeUnitVector = collision;
	// 				tank.rotateAlongTank( collision );
	// 			}
	// 		}

	// 		if ( !tank.velocity.isZero() )
	// 		{
	// 			var velocityAfterCollision = tank.velocity.clone();
	// 			for ( var id in this.walls )
	// 			{
	// 				var wall = this.walls[ id ];
	// 				collision = tank.isRectangleCollision( wall );

	// 				if ( collision )
	// 				{
	// 					var edgeUnitVector = collision[ 0 ];
	// 					velocityAfterCollision.project( edgeUnitVector );
	// 				}
	// 			}

	// 			for ( var id in this.tanks )
	// 			{
	// 				if ( id === i )
	// 					continue;

	// 				var idTank = this.tanks[ id ];
	// 				collision = tank.isTankCollision( idTank );

	// 				if ( collision )
	// 				{
	// 					var edgeUnitVector = collision;
	// 					velocityAfterCollision.project( edgeUnitVector );
	// 				}
	// 			}

	// 			tank.movePos( velocityAfterCollision.x, velocityAfterCollision.y );
	// 		}
	// 	}

	// 	// Draw projectiles and check for collisions
	// 	for ( var i in this.projectiles )
	// 	{
	// 		var projectile = this.projectiles[ i ];

	// 		// Move with either the same velocity or a reversed velocity from colliding
	// 		projectile.translate();

	// 		// Check for a collision with map boundaries or walls
	// 		for ( var id in this.walls )
	// 		{
	// 			var wall = this.walls[ id ];
	// 			collision = projectile.isRectangleCollision( wall );

	// 			if ( collision )
	// 			{
	// 				projectile.move( -projectile.velocity.x, -projectile.velocity.y );
	// 				if ( !projectile.bounce( collision[ 0 ] ) )
	// 					this.removeProjectile( i );

	// 				projectile.move( projectile.velocity.x, projectile.velocity.y );
	// 			}
	// 		}

	// 		for ( var id in this.projectiles )
	// 		{
	// 			if ( id === i )
	// 				continue;

	// 			var idProjectile = this.projectiles[ id ];

	// 			collision = projectile.isRotatedRectangleCollision( idProjectile );

	// 			if ( collision )
	// 			{
	// 				this.removeProjectile( i );
	// 				this.removeProjectile( id );
	// 			}
	// 		}

	// 		// Bullet collide with tanks
	// 		for ( var id in this.tanks )
	// 		{
	// 			if ( projectile.isRotatedRectangleCollision( this.tanks[ id ] ) )
	// 			{
	// 				this.removeProjectile( projectile.id );
	// 				this.kill( id, projectile.pid );
	// 			}
	// 		}
	// 	}

	// 	this.tick++;
	// }

	kill( victimID, murdererID )
	{
		var victim = this.tanks[ victimID ],
			murderer = this.tanks[ murdererID ];
		// assailantLog = aid in stateQueue ? stateQueue[ aid ] : new Object();

		// Move the tank to a new place
		this.spawn( victim );

		// Update scores
		murderer.score++;
		victim.score = 0;

		// Update scoreboard
		this.score.set( murdererID, murderer.score );
		this.score.set( victimID, 0 );

		// stateQueue[ aid ] = assailantLog;
	}

	randomly_spawn_tank( tankID )
	{
		var tank,
			tries = 0;

		if ( !tankID )
			return;

		if ( tankID instanceof Tank )
			tank = tankID;
		else
			tank = this.spawn_tank( tankID, 0, 0 );

		spawn_loop: while ( tries < 100 )
		{
			tries++;

			// Choose an empty grid position with no wall
			var pos = this.emptyTiles[ Math.round( Math.random() * ( this.emptyTiles.length - 1 ) ) ];

			// Convert tile to real coordinates
			pos.multiply( 50 );

			// Used for collision detection
			let pos_object = {
				pos: pos
			};

			// Check for collisions with tanks
			for ( let [ other_id, other_tank ] of this.tanks )
			{
				if ( Collision.is_near( other_tank, pos_object ) )
				{
					continue spawn_loop;
				}
			}

			// Check for collisions with projectiles
			for ( let [ other_id, other_bullet ] in this.bullets )
			{
				if ( Collision.is_near( other_bullet, pos_object ) )
				{
					continue spawn_loop;
				}
			}

			// Apply the collision free position to the tank
			tank.move_to( pos.x, pos.y );
			break spawn_loop;
		}

		return tank;
	}

	generateWalls()
	{
		let gridSize = 50;
		let gridWidth = Math.floor( this.width / gridSize );
		let gridHeight = Math.floor( this.height / gridSize );
		let grid = [];
		let emptyTiles = [];
		let wallTiles = [];
		let walls = [];
		let threshold = 0;

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

		// Fill in corner tiles where needed
		// w - -         w w -
		// - w -   -->   - w -
		// - - -         - - -
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

		// Combine adjacent 1 x 1 walls into single walls
		// w w -         1 1 -
		// - w -   -->   - 2 -
		// - - -         - - -
		for ( let i = wallTiles.length - 1; i >= 0; i-- )
		{
			let tile = wallTiles[ i ];
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

		// Create actual wall objects from the generated wall grid
		for ( var i = walls.length - 1; i >= 0; i-- )
		{
			var wall = walls[ i ];
			let wallWidth = ( wall.upper_bound.x - wall.lower_bound.x + 1 ) * 50;
			let wallHeight = ( wall.upper_bound.y - wall.lower_bound.y + 1 ) * 50;

			// Rectangles are instantiated with their center's position
			let centerPosX = wall.lower_bound.x * 50 + wallWidth / 2;
			let centerPosY = wall.lower_bound.y * 50 + wallHeight / 2;

			this.spawn_wall( null, centerPosX, centerPosY, wallWidth, wallHeight );
		}

		// Generate walls for the borders of the map
		// - - -         w w w
		// - - -   -->   w - w
		// - - -         w w w
		var halfWidth = this.width >> 1,
			halfHeight = this.height >> 1,
			halfTile = gridSize >> 1;

		// Horizontal wall borders
		this.spawn_wall( null, halfWidth, halfTile, this.width, gridSize );
		this.spawn_wall( null, halfWidth, this.height - halfTile, this.width, gridSize );

		// Vertical (left and right) wall borders
		this.spawn_wall( null, halfTile, halfHeight, gridSize, this.height );
		this.spawn_wall( null, this.width - halfTile, halfHeight, gridSize, this.height );

		// Populate empty tiles with all the grid tiles without a wall
		for ( var y = 1; y < gridHeight - 1; y++ )
		{
			var row = grid[ y ];

			for ( var x = 1; x < gridWidth - 1; x++ )
			{
				if ( row[ x ] === 0 )
					emptyTiles.push( new Vector( x, y ) );
			}
		}

		this.grid = grid;
		this.emptyTiles = emptyTiles;
		this.wallTiles = wallTiles;
	}
}

// Extract a digit from a random seed ( Ex. Seed: 153 & Digit: 2 -> Return: 5 )
function getSeedDigit( seed, digit )
{
	digit = Math.pow( 10, digit );
	return Math.round( ( seed * digit ) % 10 );
}