import Connect from '../common/input/connect';
import Game from './game';
import InputEvent from '../common/input/inputEvent';

const SENDDATADELAY = 2; // Ticks between sending data to clients

export default class ServerConnect extends Connect
{
	constructor( io )
	{
		super();

		this.inputEvent = new InputEvent( Game );

		// Players that have just connected and are waiting for map data
		this.connectingPlayers = new Map();

		// Last snapshot sent to the clients
		this.prevSnapshot;

		io.on( 'connection', this.connectHandler.bind( this ) );
	}

	render( io )
	{
		let gameMap = Game.gameMap;

		for ( var [ socket, data ] of this.connectingPlayers )
		{
			console.log( socket.client.id, data );
			let tank = gameMap.tanks.get( socket.client.id );
			if ( !tank )
			{
				console.log( 'Failed to handshake ' + socket.client.id );
				socket.client.disconnect();
				this.connectingPlayers.remove( socket );
				return;
			}

			tank.name = data || 'Tank';

			let snapshot = Game.snapshotList.head.data;
			snapshot.leaderboard = gameMap.score.leaderboard;
			this.send( socket, 'handshake', snapshot );
		}

		this.connectingPlayers.clear();

		if ( Game.gameMap.tick % SENDDATADELAY === 0 )
		{
			let headSnapshot = Game.snapshotList.head;

			if ( this.prevSnapshot )
			{
				var snapshotDiff = headSnapshot.diff( this.prevSnapshot );

				// console.log( headSnapshot.data.t, this.prevSnapshot.data.t );
				// console.log( 'changes', snapshotDiff );
				this.send( io.sockets, 'e', snapshotDiff );
			}

			this.prevSnapshot = headSnapshot;
		}
	}

	connectHandler( socket )
	{
		console.log( socket.client.id + ' connected.' );

		this.receive( socket, 'handshake', this.handshakeHandler.bind( this, socket ) );
		this.receive( socket, 'disconnect', this.disconnectHandler.bind( this, socket ) );
		this.receive( socket, 'e', this.eventHandler.bind( this, socket ) );
	}

	handshakeHandler( socket, data )
	{
		let id = socket.client.id;
		let gameMap = Game.gameMap;
		let tick = gameMap.tick;

		// TODO: Fix this hack. We must recreate the same "random" tank spawn
		let tempTank = gameMap.randomlySpawnTank( 'test' );
		let randomPos = tempTank.pos;
		Game.eventQueue.insert( tick, tick, gameMap.spawnTank.bind( gameMap, id, randomPos.x, randomPos.y ) );
		this.connectingPlayers.set( socket, data );
	}

	disconnectHandler( socket )
	{
		let id = socket.client.id;
		let gameMap = Game.gameMap;
		let tick = Game.gameMap.tick;

		Game.eventQueue.insert( tick, tick, gameMap.score.remove.bind( gameMap.score, id ) );
		Game.eventQueue.insert( tick, tick, gameMap.removeTank.bind( gameMap, id ) );
		console.log( socket.client.id + ' disconnected.' );
	}

	eventHandler( socket, data )
	{
		let id = socket.client.id;
		let gameMap = Game.gameMap;
		let tank = gameMap.tanks.get( id );
		if ( !tank )
		{
			return;
		}

		console.log( socket.client.id, data );

		if ( 'v' in data )
		{
			this.inputEvent.speed( data.t, tank, data.v );
		}

		if ( 't' in data )
		{
			this.inputEvent.turn( data.t, tank, data.r );
		}

		if ( 'm' in data )
		{
			this.inputEvent.mouse( data.t, tank, data.m );
		}

		if ( 'l' in data )
		{
			this.inputEvent.bullet( data.t, tank );
		}

		if ( 'r' in data )
		{
			this.inputEvent.mine( data.t, tank );
		}
	}
}