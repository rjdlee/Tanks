import EventQueue from '../common/state/eventQueue';
import GameClass from '../common/game/gameClass';
import ServerGameMap from './gameMap';
import SnapshotList from '../common/snapshot/snapshotList';

export default class ServerGameClass extends GameClass
{
	constructor()
	{
		super();

		this.gameMap = new ServerGameMap();
		this.snapshotList = new SnapshotList(); // Complete game states at fixed tick intervals
		this.eventQueue = new EventQueue(); // Events that occurred during all the snapshots

		// Ensure there's always at least one snapshot
		// Save a snapshot after gameMap is instantiated so the initial state includes the walls
		this.snapshotList.saveSnapshot( this.gameMap );
	}

	update( dt )
	{
		let gameMap = this.gameMap;
		let snapshotList = this.snapshotList;
		let eventQueue = this.eventQueue;
		let updateFunc = super.update.bind( this, dt );

		let startTick = eventQueue.getHeadTick( gameMap.tick );
		let endTick = gameMap.tick;

		// Load the lowest tick's snapshot
		snapshotList.loadSnapshot( startTick, gameMap );
		startTick = gameMap.tick;

		// Replay all the events until we reach (present time + 1 tick)
		eventQueue.forEach( startTick, endTick, function ( i )
		{
			for ( var func of eventQueue.queue[ i ] )
			{
				func();
			}

			updateFunc();
			gameMap.tick++;
		}.bind( this ) );

		eventQueue.nextTick();
		snapshotList.saveSnapshotIfDelay( gameMap );
	}
}