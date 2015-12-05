/*

Note the mapping for sending keydown and keyup is as follows:

		keydown		keyup
Up 		0			4	
Down 	1			5
Left 	2			6
Right	3			7

*/

import Controller from './ui/controller';
import UI from './ui/ui';
import Event from '../common/state/event';
import Game from '../common/game/game';
import GameState from '../common/state/state';
import GameMapState from '../common/game/game_map_state';

const local_server_URI = 'http://localhost:3000';
const remote_server_URI = 'http://tankti.me:3000';

class Connect_Class
{
	constructor()
	{
		// Events to be sent to server
		this.state_queue = new Map();

		// Time when events are sent to server
		this.state_time = new Date();

		this.socket = io( local_server_URI );
		this.socket.on( 'connect', this.connect_handler.bind( this ) );
		this.socket.on( 'connect_error', this.connect_error_handler.bind( this ) );

		Event.subscribe( 'controller_aim', this.pushStateEvent.bind( this, 'm', 1 ) );
		Event.subscribe( 'controller_shoot', this.pushStateEvent.bind( this, 's' ), 1 );
		Event.subscribe( 'controller_up', this.pushStateEvent.bind( this, 'u' ) );
		Event.subscribe( 'controller_down', this.pushStateEvent.bind( this, 'd' ) );
		Event.subscribe( 'controller_left', this.pushStateEvent.bind( this, 'l' ) );
		Event.subscribe( 'controller_right', this.pushStateEvent.bind( this, 'r' ) );
		Event.subscribe( 'controller_no_move', this.pushStateEvent.bind( this, 'm' ) );
		Event.subscribe( 'controller_no_turn', this.pushStateEvent.bind( this, 't' ) );

		GameState.onload = this.sync_handler.bind( this );
		GameState.onterminate = this.close_socket.bind( this );
	}

	// Add an event to the queue to be sent to the server
	pushStateEvent( key, data )
	{
		console.log( key, data );
		this.state_queue.set( key, data );
	}

	// Send the queue of events to the server
	send_state_queue()
	{
		if ( Object.keys( this.state_queue ).length === 0 )
			return false;

		this.state_time = Date.now();
		this.socket.emit( 'e', this.state_queue );

		this.state_queue.clear();
	};

	close_socket()
	{
		if ( this.socket )
			this.socket.close();
	}

	connect_handler()
	{
		GameState.connect();
		this.socket.on( 'disconnect', this.disconnect_handler.bind( this ) );
	}

	// Attempt different servers if failed to connect to this one
	connect_error_handler()
	{
		if ( this.socket.io.uri === local_server_URI )
			this.socket.io.uri = remote_server_URI;
		else
			this.socket.io.uri = local_server_URI;
	}

	sync_handler()
	{
		// Tell server to send game state
		this.socket.emit( 'handshake', UI.name );

		// Receive server's game state
		this.socket.on( 'handshake', this.handshake_handler.bind( this ) );

		// Listen for server's events
		this.socket.on( 'e', this.event_handler.bind( this ) );
	}

	handshake_handler( data )
	{
		console.log( data );
		let game_map = GameMapState.decode( data, Game.game_map );
		let player = game_map.tanks.get( this.socket.id );

		if ( !player )
		{
			this.socket.emit( 'handshake', UI.name );
			return;
		}

		game_map.grid = data.grid;
		game_map.controller = new Controller( player );

		GameState.play();
	}

	disconnect_handler()
	{
		GameState.disconnect();
	}

	event_handler( data )
	{
		if ( !Game.game_map )
			return;

		if ( !Game.controller )
			return;

		for ( var id in data.tanks )
		{
			var tank = data.tanks[ id ];

			if ( tank === 'remove' )
			{
				game_map.removeTank( id );
				continue;
			}

			if ( 'add' in tank )
			{
				var tankData = tank.add,
					tank;

				if ( id === this.socket.id )
				{
					Game.controller.setPos( tankData.pos.x, tankData.pos.y );
					Game.controller.camera.moveTo( tankData.pos.x, tankData.pos.y, game_map.width, game_map.height );

					continue;
				}

				game_map.tanks[ id ] = tank = new Tank( id, tankData.pos.x, tankData.pos.y, tankData.angle );
				tank.setVelocity( tankData.speed );
				tank.barrel.setAngle( tankData.heading );

				continue;
			}

			if ( 'pos' in tank )
			{
				var pos = new Vector( tank.pos.x, tank.pos.y ),
					mapTank = game_map.tanks[ id ];

				mapTank.next_pos = pos.diff( mapTank.pos );
				// game_map.tanks.get(id).setPos( tank.pos.x, tank.pos.y );
			}

			if ( 'angle' in tank )
			{
				game_map.tanks.get( id ).setAngle( tank.angle );
				// game_map.tanks.get(id).angle.nextRad = game_map.tanks.get(id).angle.rad - tank.angle;
			}

			if ( 'facing' in tank )
				game_map.tanks.get( id ).barrel.setAngle( tank.facing );

			if ( 'speed' in tank )
				game_map.tanks.get( id ).setVelocity( tank.speed );
		}
		// if ( data.bullets )
		// console.log( data.bullets );
		for ( var id in data.bullets )
		{
			var bullet = data.bullets[ id ];

			if ( bullet === 'remove' )
			{
				game_map.removeBullet( id );

				continue;
			}

			if ( 'add' in bullet )
			{
				var bulletData = bullet.add;
				game_map.bullets[ id ] = new Bullet(
					bulletData.pid, bulletData.pos.x, bulletData.pos.y, bulletData.angle, bulletData.speed );
			}

		}
	}
}

var Connect = new Connect_Class();
export default Connect;