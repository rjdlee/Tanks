import Connect from '../common/input/connect';
import Game from './game';
import GameMapState from '../common/game/game_map_state';
import InputEvent from '../common/input/input_event';

const SEND_DATA_DELAY = 2; // Ticks between sending data to clients

export default class ServerConnect extends Connect
{
	constructor( io )
	{
		super();

		this.input_event = new InputEvent( Game );

		// Players that have just connected and are waiting for map data
		this.connecting_players = new Map();

		// Last snapshot sent to the clients
		this.prev_snapshot;

		io.on( 'connection', this.connect_handler.bind( this ) );
	}

	render( io )
	{
		let game_map = Game.game_map;

		for ( var [ socket, data ] of this.connecting_players )
		{
			let tank = game_map.tanks.get( socket.client.id );
			if ( !tank )
			{
				return;
			}

			tank.name = data || 'Tank';

			let snapshot = Game.snapshot_list.head.data;
			snapshot.leaderboard = game_map.score.leaderboard;
			this.send( socket, 'handshake', snapshot );
		}

		this.connecting_players.clear();

		if ( Game.game_map.tick % SEND_DATA_DELAY === 0 )
		{
			let head_snapshot = Game.snapshot_list.head;

			if ( this.prev_snapshot )
			{
				var snapshot_diff = head_snapshot.diff( this.prev_snapshot );

				// console.log( head_snapshot.data.t, this.prev_snapshot.data.t );
				// console.log( 'changes', snapshot_diff );
				this.send( io.sockets, 'e', snapshot_diff );
			}

			this.prev_snapshot = head_snapshot;
		}
	}

	connect_handler( socket )
	{
		console.log( socket.client.id + ' connected.' );

		this.receive( socket, 'handshake', this.handshake_handler.bind( this, socket ) );
		this.receive( socket, 'disconnect', this.disconnect_handler.bind( this, socket ) );
		this.receive( socket, 'e', this.event_handler.bind( this, socket ) );
	}

	handshake_handler( socket, data )
	{
		let id = socket.client.id;
		let game_map = Game.game_map;
		let tick = game_map.tick;

		Game.event_queue.insert( tick, tick, game_map.randomly_spawn_tank.bind( game_map, id ) );
		this.connecting_players.set( socket, data );
	}

	disconnect_handler( socket )
	{
		let id = socket.client.id;
		let game_map = Game.game_map;
		let tick = Game.game_map.tick;

		Game.event_queue.insert( tick, tick, game_map.score.remove.bind( game_map.score, id ) );
		Game.event_queue.insert( tick, tick, game_map.remove_tank.bind( game_map, id ) );
		console.log( socket.client.id + ' disconnected.' );
	}

	event_handler( socket, data )
	{
		let id = socket.client.id;
		let game_map = Game.game_map;
		let tank = game_map.tanks.get( id );
		if ( !tank )
		{
			return;
		}

		if ( 'v' in data )
		{
			this.input_event.speed( data.t, tank, data.v );
		}

		if ( 't' in data )
		{
			this.input_event.turn( data.t, tank, data.r );
		}

		if ( 'm' in data )
		{
			this.input_event.mouse( data.t, tank, data.m );
		}

		if ( 'l' in data )
		{
			this.input_event.bullet( data.t, tank );
		}

		if ( 'r' in data )
		{
			this.input_event.mine( data.t, tank );
		}
	}
}