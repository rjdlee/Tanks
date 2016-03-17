import Controller from './ui/controller';
import Connect from '../common/input/connect';
import Event from '../common/state/event';
import Game from '../common/game/game';
import Snapshot from '../common/snapshot/snapshot';
import GameState from '../common/state/state';
import InputEvent from '../common/input/inputEvent';
import UI from './ui/ui';
import Util from '../common/util/util';
import Vector from '../common/util/vector';

// Servers to connect to
const localServerURI = 'http://localhost:3000';
const remoteServerURI = 'http://tankti.me:3000';

/**
 * Communicate with the server
 *
 * @private
 */
class ClientConnectClass extends Connect
{
	constructor()
	{
		super();

		// Events to be sent to server
		this.stateQueue = new Map();
		this.inputEvent = new InputEvent( Game );

		// Establish a connection with the server
		this.socket = io( localServerURI );
		this.socket.on( 'connect', this.connectHandler.bind( this ) );
		this.socket.on( 'connectError', this.connectErrorHandler.bind( this ) );

		// Handle input controller events (send them to the server) 
		Event.subscribe( 'controllerAim', this.pushStateEvent.bind( this, 'm' ) );
		Event.subscribe( 'controllerShoot', this.pushStateEvent.bind( this, 'c' ) );
		Event.subscribe( 'controllerMine', this.pushStateEvent.bind( this, 'r' ) );
		Event.subscribe( 'controllerUp', this.pushStateEvent.bind( this, 'v', -1 ) );
		Event.subscribe( 'controllerDown', this.pushStateEvent.bind( this, 'v', 1 ) );
		Event.subscribe( 'controllerNoMove', this.pushStateEvent.bind( this, 'v', 0 ) );
		Event.subscribe( 'controllerLeft', this.pushStateEvent.bind( this, 't', 1 ) );
		Event.subscribe( 'controllerRight', this.pushStateEvent.bind( this, 't', -1 ) );
		Event.subscribe( 'controllerNoTurn', this.pushStateEvent.bind( this, 't', 0 ) );

		// Watch for client input events
		GameState.onload = this.syncHandler.bind( this );
		GameState.onterminate = this.closeSocket.bind( this );
	}

	/**
	 * Add an event to the queue to be sent to the server
	 *
	 * @private
	 */
	pushStateEvent( key, data )
	{
		this.stateQueue.set( key, data );
	}

	/** 
	 * Send the queue of events to the server
	 *
	 * @private
	 */
	sendStateQueue()
	{
		if ( this.stateQueue.size === 0 )
		{
			return;
		}

		if ( !GameState.is( 'playing' ) )
		{
			return;
		}

		// Convert this damn thing to an object
		let stateQueueObject = {
			t: String( Game.gameMap.tick )
		};
		for ( let [ key, data ] of this.stateQueue.entries() )
		{
			stateQueueObject[ key ] = data;
		}

		this.send( this.socket, 'e', stateQueueObject );
		this.stateQueue.clear();
	};

	/**
	 * Disconnect from the server
	 */
	closeSocket()
	{
		if ( this.socket )
		{
			this.socket.close();
		}
	}

	/** 
	 * Handle initial connection to the server
	 *
	 * @private
	 */
	connectHandler()
	{
		GameState.connect();
		this.receive( this.socket, 'disconnect', this.disconnectHandler.bind( this ) );
	}

	/**
	 * Attempt different servers if failed to connect to this one
	 *
	 * @private
	 */
	connectErrorHandler()
	{
		if ( this.socket.io.uri === localServerURI )
		{
			this.socket.io.uri = remoteServerURI;
		}
		else
		{
			this.socket.io.uri = localServerURI;
		}
	}

	/**
	 * Begin syncing data with the server after player has clicked "play"
	 *
	 * @private
	 */
	syncHandler()
	{
		// Tell server to send game state
		this.send( this.socket, 'handshake', UI.name );

		// Receive server's game state
		this.receive( this.socket, 'handshake', this.handshakeHandler.bind( this ) );

		// Listen for server's events
		this.receive( this.socket, 'e', this.eventHandler.bind( this ) );
	}

	/**
	 * Receive data from the server and create a new game map from it
	 *
	 * @private
	 */
	handshakeHandler( data )
	{
		let gameMap = Snapshot.decode( data, Game.gameMap );
		console.log( data, this.socket.id, Game.gameMap );
		let player = gameMap.tanks.get( this.socket.id );
		gameMap.controller = new Controller( player );

		GameState.play();
	}

	/**
	 * Handle connection interruptions
	 *
	 * @private
	 */
	disconnectHandler()
	{
		GameState.disconnect();
		console.log( GameState );
	}

	/**
	 * Receive state change data from the server
	 *
	 * @private
	 */
	eventHandler( data )
	{
		let gameMap = Game.gameMap;

		if ( !gameMap || !gameMap.controller )
		{
			return;
		}

		for ( var id in data.t )
		{
			// var tank = data.t[ id ];

			// if ( tank === 'remove' )
			// {
			// 	gameMap.removeTank( id );
			// 	continue;
			// }

			// if ( 'add' in tank )
			// {
			// 	let tankData = tank.add;

			// 	if ( id === this.socket.id )
			// 	{
			// 		continue;
			// 	}

			// 	let tankInstance = gameMap.spawnTank( id, tankData.x, tankData.y, tankData.a );
			// 	tankInstance.setSpeed( tankData.s );
			// 	tankInstance.turnBarrelTo( tankData.f );

			// 	continue;
			// }

			// if ( 'x' in tank )
			// {
			// 	let tankInstance = gameMap.tanks.get( id );
			// 	tankInstance.setVelocity( tank.x, tankInstance.velocity.y );
			// }

			// if ( 'y' in tank )
			// {
			// 	let tankInstance = gameMap.tanks.get( id );
			// 	tankInstance.setVelocity( tankInstance.velocity.x, tank.y );
			// }

			// if ( 'a' in tank )
			// {
			// 	let tankInstance = gameMap.tanks.get( id );
			// 	tankInstance.setVelocity( tankInstance )
			// 	tankInstance.turnTo( tank.a );
			// }

			// if ( 'f' in tank )
			// {
			// 	let tankInstance = gameMap.tanks.get( id );
			// 	tankInstance.turnBarrelTo( tank.f );
			// }

			// if ( 's' in tank )
			// {
			// 	let tankInstance = gameMap.tanks.get( id );
			// 	tankInstance.setSpeed( tank.s );
			// }
		}

		for ( var id in data.b )
		{
			var bullet = data.b[ id ];

			if ( bullet === 'remove' )
			{
				gameMap.removeBullet( id );
				continue;
			}

			if ( 'add' in bullet )
			{
				var bulletData = bullet.add;
				gameMap.spawnBullet( id, bulletData.x, bulletData.y, bulletData.a, bulletData.o );
			}

		}
	}
}

/**
 * Export a singleton of the ClientConnectCass to maintain state across modules
 *
 * @public
 */
var ClientConnect = new ClientConnectClass();
export default ClientConnect;