/**
 * Plugin for EventQueue
 * Inserts events into the event queue
 */
export default class InputEvent
{
	constructor( game )
	{
		this.game = game;
		this.gameMap = game.gameMap;
		this.eventQueue = game.eventQueue;
	}

	handshake( id )
	{
		let tick = this.gameMap.tick;
		this.eventQueue.insert( tick, tick, this.gameMap.randomlySpawnTank.bind( this.gameMap, id ) );
	}

	disconnect( id )
	{
		let tick = this.gameMap.tick;
		this.eventQueue.insert( tick, tick, this.gameMap.score.remove.bind( this.gameMap.score, id ) );
		this.eventQueue.insert( tick, tick, this.gameMap.removeTank.bind( this.gameMap, id ) );
	}

	spawn( tick, id, x, y, angle )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		this.eventQueue.insert( tick, this.gameMap.tick, this.gameMap.spawnTank.bind( this.gameMap, id, x, y, angle ) );
	}

	speed( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		let speed = Math.sign( amount ) * 1.5;
		this.eventQueue.insert( tick, this.gameMap.tick, tank.setSpeed.bind( tank, speed ) );
	}

	turn( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		let turnSpeed = Math.sign( amount ) * 0.05;
		this.eventQueue.insert( tick, this.gameMap.tick, tank.setTurnSpeed.bind( tank, turnSpeed ) );
	}

	mouse( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		this.eventQueue.insert( tick, this.gameMap.tick, tank.turnBarrelTo.bind( tank, amount ) );
	}

	bullet( tick, tank )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		let barrelTip = tank.barrel.boundingBox.vertices[ 2 ];
		let barrelAngle = tank.barrel.angle;
		this.eventQueue.insert( tick, this.gameMap.tick,
			this.gameMap.spawnBullet.bind( this.gameMap, null, barrelTip.x, barrelTip.y, barrelAngle, tank.id ) );
	}

	mine( tick, tank )
	{
		if ( !tick )
		{
			tick = this.gameMap.tick;
		}

		this.eventQueue.insert( tick, this.gameMap.tick,
			this.gameMap.spawnMine.bind( this.gameMap, null, tank.pos.x, tank.pos.y, tank.id ) );
	}
}