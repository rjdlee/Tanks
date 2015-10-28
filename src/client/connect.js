/*

Note the mapping for sending keydown and keyup is as follows:

		keydown		keyup
Up 		0			4	
Down 	1			5
Left 	2			6
Right	3			7

*/

export default class Connect_Class
{
	constructor()
	{
		this.stateQueue = {};

		this.socket = io( 'http://localhost:3000' );

		this.socket.on( 'connect', function ()
		{
			this.socket.emit( 'init', name );

			this.socket.on( 'init', this.connectHandler );
			this.socket.on( 'disconnect', this.disconnectHandler );
			this.socket.on( 'e', this.eventHandler );
		}.bind( this ) );

		// Attempt different servers if failed to connect to this one
		this.socket.on( 'connect_error', function ()
		{
			if ( this.socket.io.uri === 'http://localhost:3000' )
				this.socket.io.uri = 'http://tankti.me:3000';
			else
				this.socket.io.uri = 'http://localhost:3000';
		}.bind( this ) );

		this.setListeners();
	}

	// Add an event to the queue to be sent to the server
	pushStateEvent( key, data )
	{
		this.stateQueue[ key ] = data;
	}

	// Send the queue of events to the server
	sendStateQueue()
	{
		if ( Object.keys( this.stateQueue ).length === 0 )
			return false;

		this.stateQueue.t = Date.now();
		this.socket.emit( 'e', this.stateQueue );

		this.stateQueue = {};
	};

	setListeners()
	{
		window.onbeforeunload = function ()
		{
			if ( this.socket )
				this.socket.close();
		};
	};

	connectHandler( data )
	{
		// Create a map
		map = new Map( data.boundX, data.boundY );
		renderer = new Renderer( data.boundX, data.boundY );

		// Create new players
		for ( var id in data.players )
		{
			var player = data.players[ id ];

			// Create a new player
			if ( player.id !== data.id )
			{
				map.players[ player.id ] = new Player( player.id, player.pos.x, player.pos.y, player.angle );
				continue;
			}
		}

		// Create a new controller
		map.players[ data.id ] = controller = new Controller( this.socket.id );
		controller.addCamera( window.innerWidth, window.innerHeight );

		// An error has occurred
		if ( !controller )
			return;

		// Create map walls
		for ( var id in data.walls )
		{
			var wall = data.walls[ id ];
			map.walls.push( new Wall( wall.pos.x, wall.pos.y, wall.width, wall.height ) );
		}

		map.grid = data.grid;
		renderer.renderWalls( map.grid, controller.camera );

		for ( var id in data.projectiles )
		{
			var projectile = data.projectiles[ id ];
			map.projectiles[ projectile.id ] = new Projectile( projectile.pid, projectile.pos.x, projectile.pos.y, projectile.angle, projectile.speed );
		}

		drawLeaderboard( data.id, data.leaderboard );
		play();
	}

	disconnectHandler()
	{
		if ( animationClock )
			window.cancelAnimationFrame( animationClock );

		animationClock = undefined;
		controller = undefined;
		map = undefined;
	}

	eventHandler( data )
	{
		if ( !map )
			return;

		if ( !controller )
			return;

		for ( var id in data.players )
		{
			var player = data.players[ id ];

			if ( player === 'remove' )
			{
				map.removePlayer( id );
				continue;
			}

			if ( 'add' in player )
			{
				var playerData = player.add,
					player;

				if ( id === this.socket.id )
				{
					controller.setPos( playerData.pos.x, playerData.pos.y );
					controller.camera.moveTo( playerData.pos.x, playerData.pos.y, map.width, map.height );

					continue;
				}

				map.players[ id ] = player = new Player( id, playerData.pos.x, playerData.pos.y, playerData.angle );
				player.setVelocity( playerData.speed );
				player.barrel.setAngle( playerData.heading );

				continue;
			}

			if ( 'pos' in player )
			{
				var pos = new Vector( player.pos.x, player.pos.y ),
					mapPlayer = map.players[ id ];

				mapPlayer.nextPos = pos.diff( mapPlayer.pos );
				// map.players[ id ].setPos( player.pos.x, player.pos.y );
			}

			if ( 'angle' in player )
			{
				map.players[ id ].setAngle( player.angle );
				// map.players[ id ].angle.nextRad = map.players[ id ].angle.rad - player.angle;
			}

			if ( 'facing' in player )
				map.players[ id ].barrel.setAngle( player.facing );

			if ( 'speed' in player )
				map.players[ id ].setVelocity( player.speed );
		}
		// if ( data.projectiles )
		// console.log( data.projectiles );
		for ( var id in data.projectiles )
		{
			var projectile = data.projectiles[ id ];

			if ( projectile === 'remove' )
			{
				map.removeProjectile( id );

				continue;
			}

			if ( 'add' in projectile )
			{
				var projectileData = projectile.add;
				map.projectiles[ id ] = new Projectile(
					projectileData.pid, projectileData.pos.x, projectileData.pos.y, projectileData.angle, projectileData.speed );
			}

		}
	}
}

var Connect = new Connect_Class();
export default Connect;