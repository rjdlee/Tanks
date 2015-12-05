import Score from './score';
import GameMap from '../common/game/game_map';
import Snapshot from '../common/snapshot/snapshot';
import SnapshotList from '../common/snapshot/snapshot_list';
import Noise from '../common/util/noise';

let SNAPSHOT_LIMIT = 100,
	SNAPSHOT_DELAY = 3,
	noise = new Noise();

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
		var players = {},
			projectiles = {},
			walls = {};

		for ( var id in this.players )
		{
			var player = this.players[ id ];

			players[ id ] = {
				id: id,
				pos: player.pos.toObject(),
				angle: player.angle,
				facing: player.barrel.angle,
				speed: player.speed
			};
		}

		for ( var id in this.projectiles )
		{
			var projectile = this.projectiles[ id ];

			projectiles[ id ] = {
				id: id,
				pid: projectile.pid,
				pos: projectile.pos.toObject(),
				angle: projectile.angle,
				speed: projectile.speed
			};
		}

		for ( var id in this.walls )
		{
			var wall = this.walls[ id ];

			walls[ id ] = {
				pos: wall.pos.toObject(),
				width: wall.width,
				height: wall.height
			};
		}

		this.snapshots.unshift( new Snapshot( this.tick, players, projectiles, walls ) );
	}

	// Load a snapshot for the given timestamp
	loadSnapshot( timestamp )
	{
		this.saveSnapshot();

		var snapshot = this.snapshots.getByTime( timestamp );

		// No snapshot found
		if ( !snapshot )
			return;

		this.tick = snapshot.tick;
		this.timestamp = snapshot.timestamp;
		this.snapshot = snapshot;

		for ( var id in this.players )
		{
			if ( !( id in snapshot.players ) )
				delete this.players[ id ];
		}

		for ( var id in snapshot.players )
		{
			var player = snapshot.players[ id ];

			if ( id in this.players )
			{
				this.players[ id ].setPos( player.pos.x, player.pos.y );
				this.players[ id ].setAngle( player.angle );
				this.players[ id ].barrel.setAngle( player.facing );

				continue;
			}

			this.players[ player.id ] = new Player( player.id, player.pos.x, player.pos.y, player.angle );
		}

		for ( var id in this.projectiles )
		{
			if ( !( id in snapshot.projectiles ) )
				delete this.projectiles[ id ];
		}

		for ( var id in snapshot.projectiles )
		{
			var projectile = snapshot.projectiles[ id ];

			if ( id in this.projectiles )
			{
				this.projectiles[ id ].setPos( projectile.pos.x, projectile.pos.y );
				this.projectiles[ id ].setAngle( projectile.angle );
				this.projectiles[ id ].setVelocity( projectile.speed );

				continue;
			}

			this.projectiles[ projectile.id ] = new Projectile( projectile.pid, projectile.pos.x, projectile.pos.y, projectile.angle, projectile.speed );
		}

		for ( var id in this.walls )
		{
			if ( !( id in snapshot.walls ) )
				delete this.walls[ id ];
		}

		for ( var id in snapshot.walls )
		{
			var wall = snapshot.walls[ id ];

			if ( id in this.walls )
			{
				this.walls[ id ].setPos( wall.pos.x, wall.pos.y );
				this.walls[ id ].width = wall.width;
				this.walls[ id ].height = wall.height;

				continue;
			}

			this.walls.push( new Wall( wall.pos.x, wall.pos.y, wall.width, wall.height ) );
		}
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

				for ( var id in this.players )
				{
					if ( !( id in snapshot.players ) )
						delete this.players[ id ];
				}

				for ( var id in snapshot.players )
				{
					if ( id in this.players )
						continue;

					var player = snapshot.players[ id ];
					this.players[ player.id ] = new Player( player.id, player.pos.x, player.pos.y, player.angle );
					this.players[ player.id ].barrel.setAngle( player.facing );
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
		var diff = {},
			players,
			projectiles,
			walls;

		if ( !prevSnapshot )
			return snapshot.toJSON();

		players = diffObjects( snapshot.players, prevSnapshot.players );
		projectiles = diffObjects( snapshot.projectiles, prevSnapshot.projectiles );
		walls = diffObjects( snapshot.walls, prevSnapshot.walls );

		if ( Object.keys( players ).length > 0 )
		{
			diff.players = players;
		}

		if ( Object.keys( projectiles ).length > 0 )
			diff.projectiles = projectiles;

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

	update()
	{
		// Draw the players
		for ( var i in this.players )
		{
			var player = this.players[ i ];
			player.rotate();

			for ( var id in this.walls )
			{
				var wall = this.walls[ id ];
				collision = player.isRectangleCollision( wall );

				if ( collision )
				{
					player.rotateAlongWall( collision[ 0 ], collision[ 1 ] );
					continue;
				}
			}

			for ( var id in this.players )
			{
				if ( id === i )
					continue;

				var idPlayer = this.players[ id ];
				collision = player.isPlayerCollision( idPlayer );

				if ( collision )
				{
					var edgeUnitVector = collision;
					player.rotateAlongPlayer( collision );
				}
			}

			if ( !player.velocity.isZero() )
			{
				var velocityAfterCollision = player.velocity.clone();
				for ( var id in this.walls )
				{
					var wall = this.walls[ id ];
					collision = player.isRectangleCollision( wall );

					if ( collision )
					{
						var edgeUnitVector = collision[ 0 ];
						velocityAfterCollision.project( edgeUnitVector );
					}
				}

				for ( var id in this.players )
				{
					if ( id === i )
						continue;

					var idPlayer = this.players[ id ];
					collision = player.isPlayerCollision( idPlayer );

					if ( collision )
					{
						var edgeUnitVector = collision;
						velocityAfterCollision.project( edgeUnitVector );
					}
				}

				player.movePos( velocityAfterCollision.x, velocityAfterCollision.y );
			}
		}

		// Draw projectiles and check for collisions
		for ( var i in this.projectiles )
		{
			var projectile = this.projectiles[ i ];

			// Move with either the same velocity or a reversed velocity from colliding
			projectile.translate();

			// Check for a collision with map boundaries or walls
			for ( var id in this.walls )
			{
				var wall = this.walls[ id ];
				collision = projectile.isRectangleCollision( wall );

				if ( collision )
				{
					projectile.move( -projectile.velocity.x, -projectile.velocity.y );
					if ( !projectile.bounce( collision[ 0 ] ) )
						this.removeProjectile( i );

					projectile.move( projectile.velocity.x, projectile.velocity.y );
				}
			}

			for ( var id in this.projectiles )
			{
				if ( id === i )
					continue;

				var idProjectile = this.projectiles[ id ];

				collision = projectile.isRotatedRectangleCollision( idProjectile );

				if ( collision )
				{
					this.removeProjectile( i );
					this.removeProjectile( id );
				}
			}

			// Bullet collide with tanks
			for ( var id in this.players )
			{
				if ( projectile.isRotatedRectangleCollision( this.players[ id ] ) )
				{
					this.removeProjectile( projectile.id );
					this.kill( id, projectile.pid );
				}
			}
		}

		this.tick++;
	}

	kill( victimID, murdererID )
	{
		var victim = this.players[ victimID ],
			murderer = this.players[ murdererID ];
		// assailantLog = aid in stateQueue ? stateQueue[ aid ] : new Object();

		// Move the player to a new place
		this.spawn( victim );

		// Update scores
		murderer.score++;
		victim.score = 0;

		// Update scoreboard
		this.score.set( murdererID, murderer.score );
		this.score.set( victimID, 0 );

		// stateQueue[ aid ] = assailantLog;
	}

	spawn( playerID )
	{
		var player,
			tries = 0;

		if ( !playerID )
			return;

		if ( playerID instanceof Player )
			player = playerID;
		else
			player = new Player( playerID, 0, 0 );

		// Add the player to the map
		this.players[ playerID ] = player;

		tryLoop: while ( tries < 100 )
		{
			tries++;

			// Choose an empty grid position with no wall
			var pos = this.emptyTiles[ Math.round( Math.random() * ( this.emptyTiles.length - 1 ) ) ];

			// Convert tile to real coordinates
			pos.multiply( 50 );

			// Used for collision detection
			var posObject = {
				pos: pos
			};

			// Check for collisions with players
			for ( var id in this.players )
			{
				if ( this.players[ id ].isRadiusCollision( posObject, 100 ) )
					continue tryLoop;
			}

			// Check for collisions with projectiles
			for ( var id in this.projectiles )
			{
				if ( this.projectiles[ id ].isRadiusCollision( posObject, 70 ) )
					continue tryLoop;
			}

			// Apply the collision free position to the player
			player.setPos( pos.x, pos.y );
			player.translateBoundingBox();
			break tryLoop;
		}

		return player;
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
		noise.seed( Math.random() );

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
				if ( noise.simplex2( x, y ) > threshold )
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

			this.add_wall( centerPosX, centerPosY, wallWidth, wallHeight );
		}

		// Generate walls for the borders of the map
		// - - -         w w w
		// - - -   -->   w - w
		// - - -         w w w
		var halfWidth = this.width >> 1,
			halfHeight = this.height >> 1,
			halfTile = gridSize >> 1;

		// Horizontal wall borders
		this.add_wall( halfWidth, halfTile, this.width, gridSize );
		this.add_wall( halfWidth, this.height - halfTile, this.width, gridSize );

		// Vertical (left and right) wall borders
		this.add_wall( halfTile, halfHeight, gridSize, this.height );
		this.add_wall( this.width - halfTile, halfHeight, gridSize, this.height );

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
		this.walls = walls;
	}
}

// Extract a digit from a random seed ( Ex. Seed: 153 & Digit: 2 -> Return: 5 )
function getSeedDigit( seed, digit )
{
	digit = Math.pow( 10, digit );
	return Math.round( ( seed * digit ) % 10 );
}