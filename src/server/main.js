import Game from 'game/game';
import Util from 'util/util';

var game = new Game(),

	// Track player events
	stateQueue = new Map();

module.exports = function ( io )
{
	init();

	var now,
		dt,
		last = Util.timestamp();

	function init()
	{
		setInterval( frame, 1000 / 60 );
	}

	function frame()
	{
		now = Util.timestamp();
		dt = ( now - last ) / 1000; // In seconds

		update( dt );
		render();

		last = now;
	}

	function update( dt )
	{
		game.update( dt );
	}

	function render()
	{
		if ( game.map.tick % 60 === 0 )
		{
			if ( !game.map.isReplayingSnapshot )
				game.map.saveSnapshot();

			var stateChange = game.map.diffSnapshot( game.map.snapshots.head, game.map.snapshots.head.prev );

			if ( Object.keys( stateChange ).length > 0 )
				io.sockets.emit( 'e', stateChange );
		}
	}

	io.on( 'connection', function ( socket )
	{
		( playerConnectHandler.bind( socket ) )();

		socket.on( 'disconnect', playerDisconnectHandler.bind( socket ) );
		socket.on( 'e', playerEventHandler.bind( socket ) );
	} );

	function playerConnectHandler()
	{
		// map.saveSnapshot();

		var id = this.id,
			player = map.spawn( id ),
			playerLog = id in stateQueue ? stateQueue[ id ] : new Object();

		var snapshot = map.snapshots.head.getData();
		snapshot.id = id;
		snapshot.boundX = map.width;
		snapshot.boundY = map.height;
		snapshot.leaderboard = map.score.leaderboard;
		snapshot.grid = map.grid;

		// Get the client up to date with its id, pos, and the other players
		this.emit( 'init', snapshot );
		this.on( 'init', function ( data )
		{
			map.players[ id ].name = data;
		}.bind( id ) );

		playerLog.pos = player.pos;
		stateQueue[ id ] = playerLog;

		console.log( id + ' connected.' );
	}

	function playerDisconnectHandler()
	{
		var id = this.id;

		// If the player was on the leaderboard, remove them from it
		if ( map.score.remove( id ) )
			playerLog.leaderboard = scoreboard.getLeaderboard();

		// Remove the player from the map
		map.removePlayer( id );

		console.log( id + ' disconnected.' );
	}

	function playerEventHandler( e )
	{
		var id = this.id,
			playerLog = id in stateQueue ? stateQueue[ id ] : new Object(),
			player = map.players[ id ];

		if ( !player )
			return;

		if ( !e.t )
			return;

		map.loadSnapshot( e.t );

		// Forwards and backwards velocity
		if ( 'v' in e )
		{
			if ( e.v > 0 )
			{
				player.setVelocity( 1.5 );
			}
			else if ( e.v === 0 )
			{
				player.setVelocity( 0 );
			}
			else if ( e.v < 0 )
			{
				player.setVelocity( -1.5 );
			}
		}

		// Left and right rotational speed
		if ( 'r' in e )
		{
			if ( e.r > 0 )
			{
				player.rotation.speed = 0.05;
			}
			else if ( e.r === 0 )
			{
				player.rotation.speed = 0;
			}
			else if ( e.r < 0 )
			{
				player.rotation.speed = -0.05;
			}
		}

		// Mouse movement
		if ( 'm' in e )
		{
			player.barrel.setAngle( e.m );
			playerLog.heading = e.m;
		}

		if ( 's' in e )
		{
			var projectile = player.shoot();
			if ( projectile )
			{
				map.projectiles[ projectile.id ] = projectile;
			}
		}

		map.replaySnapshot();

		stateQueue[ id ] = playerLog;
	}
};

// Record change events
function pushStateEvent( id, key, data )
{
	var playerState = {};
	if ( id in stateQueue )
		playerState = stateQueue[ id ];

	if ( key in playerState )
		playerState[ key ].push( data )
	else
		playerState[ key ] = [ data ];

	stateQueue[ id ] = playerState;
	stateChange = true;
}