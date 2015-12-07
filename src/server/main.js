import BSON from '../common/communication/bson';
import Game from '../common/game/game';
import ServerGameMap from './game_map';
import GameLoop from '../common/game/game_loop';
import GameMapState from '../common/game/game_map_state';
import Wall from '../common/entity/wall';

Game.game_map = new ServerGameMap();

export default class Connect
{
	constructor( io )
	{
		this.state_queue = new Map();
		this.loop = new GameLoop( Game.update.bind( Game ), this.render.bind( this, io ) );
		this.loop.start();

		// Rewind snapshots on a separate map
		// this.snapshot_map = new ServerGameMap();

		// Last snapshot sent to the clients
		this.previous_snapshot;

		io.on( 'connection', this.connect_handler.bind( this ) );
	}

	render( io )
	{
		Game.game_map.saveSnapshot();

		if ( Game.game_map.tick % 60 === 0 )
		{
			if ( !Game.game_map.isReplayingSnapshot )
			{
				Game.game_map.saveSnapshot();
			}

			var stateChange = Game.game_map.diffSnapshot( Game.game_map.snapshots.head, this.previous_snapshot );
			this.previous_snapshot = Game.game_map.snapshots.head;

			if ( Object.keys( stateChange ).length === 0 )
			{
				return;
			}
			// console.log( stateChange );

			io.sockets.emit( 'e', BSON.encode( stateChange ) );
		}
	}

	connect_handler( socket )
	{
		console.log( socket.id + ' connected.' );

		socket.on( 'handshake', this.handshake_handler.bind( socket ) );
		socket.on( 'disconnect', this.disconnect_handler.bind( socket ) );
		socket.on( 'e', this.event_handler.bind( socket ) );
	}

	handshake_handler( data )
	{
		let id = this.id;
		let tank = Game.game_map.randomly_spawn_tank( id );
		tank.name = data || 'Tank';

		setTimeout( function ()
		{
			var snapshot = Game.game_map.snapshots.head.data;
			snapshot.leaderboard = Game.game_map.score.leaderboard;
			snapshot.grid = Game.game_map.grid;

			this.emit( 'handshake', snapshot );
		}.bind( this ), 1000 );
	}

	disconnect_handler()
	{
		var id = this.id;

		// If the tank was on the leaderboard, remove them from it
		Game.game_map.score.remove( id )

		// Remove the tank from the map
		Game.game_map.remove_tank( id );

		console.log( id + ' disconnected.' );
	}

	event_handler( e )
	{
		e = BSON.decode( e );
		let id = this.id;
		let game_map = Game.game_map;
		let tank = game_map.tanks.get( id );

		if ( !tank )
		{
			return;
		}

		if ( !e.t )
		{
			return;
		}

		game_map.loadSnapshot( e.t );

		// Forwards and backwards velocity
		if ( 'v' in e )
		{
			if ( e.v > 0 )
			{
				tank.set_speed( 1.5 );
			}
			else if ( e.v === 0 )
			{
				tank.set_speed( 0 );
			}
			else if ( e.v < 0 )
			{
				tank.set_speed( -1.5 );
			}
		}

		// Left and right rotational speed
		if ( 'r' in e )
		{
			if ( e.r > 0 )
			{
				tank.set_turn_speed( 0.05 );
			}
			else if ( e.r === 0 )
			{
				tank.set_turn_speed( 0 );
			}
			else if ( e.r < 0 )
			{
				tank.set_turn_speed( -0.05 );
			}
		}

		// Mouse movement
		if ( 'm' in e )
		{
			tank.turn_barrel_to( e.m );
		}

		if ( 'c' in e )
		{
			let barrel_tip = tank.barrel.bounding_box.vertices[ 2 ];
			let barrel_angle = tank.barrel.angle;
			game_map.spawn_bullet( null, barrel_tip.x, barrel_tip.y, barrel_angle, id );
		}

		game_map.replaySnapshot();
	}
}