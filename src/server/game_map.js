import Vector from '../common/util/vector';
import Noise from '../common/util/noise';
import LinkedListNode from '../common/util/linked_list_node';
import Snapshot from '../common/snapshot/snapshot';
import SnapshotList from '../common/snapshot/snapshot_list';
import GameMap from '../common/game/game_map';
import GameMapState from '../common/game/game_map_state';
import Tank from '../common/entity/tank';
import Wall from '../common/entity/wall';
import Collision from '../common/collision/collision';

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 2000;
const SNAPSHOT_LIMIT = 100;
const SNAPSHOT_DELAY = 3;

export default class ServerGameMap extends GameMap
{
	constructor( width = MAP_WIDTH, height = MAP_HEIGHT )
	{
		super( width, height );

		this.generateWalls();
		this.snapshots = new SnapshotList();
		this.saveSnapshot();
	}

	// Save a snapshot for the current tick and timestamp
	saveSnapshot()
	{
		let snapshot_data = GameMapState.encode( this );
		let snapshot_node = new LinkedListNode( snapshot_data );
		this.snapshots.unshift( snapshot_node );
	}

	// Load a snapshot for the given timestamp
	loadSnapshot( timestamp )
	{
		var snapshot = this.snapshots.getByTime( timestamp );
		if ( !snapshot )
			return;

		GameMapState.decode( snapshot.data, this );
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
						delete this.tanks.get( id );
				}

				for ( var id in snapshot.tanks )
				{
					if ( id in this.tanks )
						continue;

					var tank = snapshot.tanks.get( id );
					this.tanks[ tank.id ] = new tank( tank.id, tank.pos.x, tank.pos.y, tank.angle );
					this.tanks[ tank.id ].barrel.setAngle( tank.facing );
				}

				for ( var id in this.bullets )
				{
					if ( !( id in snapshot.bullets ) )
						delete this.bullets.set( id );
				}

				for ( var id in snapshot.bullets )
				{
					if ( id in this.bullets )
						continue;

					var bullet = snapshot.bullets.set( id );
					this.bullets[ bullet.id ] = new bullet( bullet.pid, bullet.pos.x, bullet.pos.y, bullet.angle, bullet.speed );
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
		var diff = {},
			tanks,
			bullets,
			walls;

		if ( !prevSnapshot )
			return snapshot.data;

		tanks = diffObjects( snapshot.t, prevSnapshot.t );
		bullets = diffObjects( snapshot.b, prevSnapshot.b );
		walls = diffObjects( snapshot.w, prevSnapshot.w );

		if ( Object.keys( tanks ).length > 0 )
		{
			diff.tanks = tanks;
		}

		if ( Object.keys( bullets ).length > 0 )
			diff.bullets = bullets;

		if ( Object.keys( walls ).length > 0 )
			diff.walls = walls;

		return diff;

		function diffObjects( objects, prevObjects )
		{
			var diff = {};

			for ( var id in objects )
			{
				var object = objects[ id ],
					idDiff = {};

				if ( !( id in prevObjects ) )
				{
					diff[ id ] = {};
					diff[ id ].add = JSON.parse( JSON.stringify( object ) );
					console.log( diff[ id ] );
					continue;
				}

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

				// console.log( id, objects[ id ], prevObjects[ id ], idDiff );
			}

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

	randomly_spawn_tank( tank_id )
	{
		var tank,
			tries = 0;

		if ( !tank_id )
			return;

		if ( tank_id instanceof Tank )
			tank = tank_id;
		else
			tank = this.spawn_tank( tank_id );

		tryLoop: while ( tries < 100 )
		{
			tries++;

			// Choose an empty grid position with no wall
			var pos = this.emptyTiles[ Math.round( Math.random() * ( this.emptyTiles.length - 1 ) ) ];

			// Convert tile to real coordinates
			pos.multiply( 50 );

			// Used for collision detection
			var pos_entity = {
				pos: pos
			};

			// Check for collisions with tanks
			for ( let [ id, tank ] in this.tanks )
			{
				if ( Collision.is_near( tank, pos_entity, 100 ) )
					continue tryLoop;
			}

			// Check for collisions with bullets
			for ( let [ id, bullet ] in this.bullets )
			{
				if ( Collision.is_near( bullet, pos_entity, 70 ) )
					continue tryLoop;
			}

			// Check for collisions with bullets
			for ( let [ id, mine ] of this.mines )
			{
				if ( Collision.is_near( mine, pos_entity, 70 ) )
					continue tryLoop;
			}

			// Apply the collision free position to the tank
			tank.move_to( pos.x, pos.y );
			break tryLoop;
		}

		return tank;
	}

	generateWalls()
	{
		var gridSize = 50,
			gridWidth = Math.floor( this.width / gridSize ),
			gridHeight = Math.floor( this.height / gridSize ),
			grid = [],
			emptyTiles = [],
			wallTiles = [],
			walls = [],

			threshold = 0;

		// Seed the noise simplex with a random number to give a different map each time
		Noise.seed( Math.random() );

		// Populate the grid with walls using simplex noise when values are above a threshold
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

				if ( Noise.simplex2( x, y ) > threshold )
				{
					row[ x ] = 1;
					threshold = 0;

					wallTiles.push( new Vector( x, y ) );

					if ( y > 0 && grid[ y - 1 ][ x ] )
					{
						threshold = 0.6;
					}

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
		for ( var i = wallTiles.length - 1; i >= 0; i-- )
		{
			var tile = wallTiles[ i ],
				wall = [
				{
					x: tile.x,
					y: tile.y
				},
				{
					x: tile.x,
					y: tile.y
				} ],
				vertical = false;

			// Skip over wall tiles already assigned to another wall
			if ( grid[ tile.y ][ tile.x ] !== 1 )
				continue;

			walls.push( wall );
			grid[ tile.y ][ tile.x ] = 2;

			for ( var direction = -1; direction < 2; direction += 2 )
			{
				var offset = direction;

				while ( true )
				{
					if ( grid[ tile.y + offset ][ tile.x ] )
					{
						if ( direction === -1 )
							wall[ 0 ].y += direction;
						else
							wall[ 1 ].y += direction;

						grid[ tile.y + offset ][ tile.x ] = 2;
						offset += direction;
						vertical = true;
					}
					else
					{
						break;
					}
				}
			}

			if ( vertical )
				continue;

			for ( var direction = -1; direction < 2; direction += 2 )
			{
				var offset = direction;

				while ( true )
				{
					if ( grid[ tile.y ][ tile.x + offset ] )
					{
						if ( direction === -1 )
							wall[ 0 ].x += direction;
						else
							wall[ 1 ].x += direction;

						grid[ tile.y ][ tile.x + offset ] = 2;
						offset += direction;
					}
					else
					{
						break;
					}
				}
			}
		}

		// Create actual wall objects from the generated wall grid
		for ( var i = walls.length - 1; i >= 0; i-- )
		{
			var wall = walls[ i ],
				wallWidth = ( wall[ 1 ].x - wall[ 0 ].x + 1 ) * 50,
				wallHeight = ( wall[ 1 ].y - wall[ 0 ].y + 1 ) * 50,

				// Rectangles are instantiated with their center's position
				centerPosX = wall[ 0 ].x * 50 + wallWidth / 2,
				centerPosY = wall[ 0 ].y * 50 + wallHeight / 2;

			walls[ i ] = new Wall( centerPosX, centerPosY, wallWidth, wallHeight );
		}

		// Generate walls for the borders of the map
		// - - -         w w w
		// - - -   -->   w - w
		// - - -         w w w
		var halfWidth = this.width >> 1,
			halfHeight = this.height >> 1,
			halfTile = gridSize >> 1;

		// Horizontal wall borders
		walls.push( new Wall( halfWidth, halfTile, this.width, gridSize ) );
		walls.push( new Wall( halfWidth, this.height - halfTile, this.width, gridSize ) );

		// Vertical (left and right) wall borders
		walls.push( new Wall( halfTile, halfHeight, gridSize, this.height ) );
		walls.push( new Wall( this.width - halfTile, halfHeight, gridSize, this.height ) );

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

		for ( let wall of walls )
		{
			this.walls.set( wall.id, wall );
		}

		this.grid = grid;
		this.emptyTiles = emptyTiles;
		this.wallTiles = wallTiles;
	}
}