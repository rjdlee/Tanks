import LinkedList from './linkedList';
import Snapshot from './snapshot';

/**
 * Number of map snapshots to cache
 *
 * @private
 */
const snapshotLimit = 10;

/**
 * Delay between snapshots in ticks
 *
 * @private
 */
const snapshotDelay = 1;

/**
 * Linked list containing snapshots of the game map
 * The head of the list contains the snapshot with the most recent tick
 *
 * @public
 */
export default class SnapshotList extends LinkedList
{
	constructor()
	{
		super( snapshotLimit );
	}

	/**
	 * Saves gameMap as a snapshot in this list
	 *
	 * @public
	 * @param {GameMap} gameMap - Game map to save a snapshot of
	 */
	saveSnapshot( gameMap )
	{
		let snapshot = new Snapshot( gameMap );

		this.unshift( snapshot );
	}

	/** 
	 * Reverts the game map to a given tick using snapshots
	 *
	 * @public
	 * @param {NaturalNumber} tick - Tick to revert to
	 * @param {GameMap} gameMap - Game map to revert
	 */
	loadSnapshot( tick, gameMap )
	{
		// Get the snapshot closest to the tick
		let snapshot = this.getByTick( tick );
		if ( !snapshot )
		{
			return;
		}

		Snapshot.decode( snapshot.data, gameMap );

		gameMap.tick = snapshot.tick;
		gameMap.timestamp = snapshot.timestamp;
		gameMap.snapshot = snapshot;
	}

	/**
	 * Returns whether or not the map should take a snapshot
	 * Snapshots should only be taken every x ticks
	 *
	 * @public
	 * @param {GameMap} gameMap - Game map to save a snapshot of
	 */
	saveSnapshotIfDelay( gameMap )
	{
		if ( gameMap.tick % snapshotDelay === 0 )
		{
			this.saveSnapshot( gameMap );
		}
	}

	/**
	 * Get the snapshot closest to the given epoch datetime
	 *
	 * @deprecated
	 * @param {Date} time - Epoch datetime to search for
	 */
	getByTime( time )
	{

		return this.getClosestSnapshot( time, 'timestamp' );
	}

	/**
	 * Get the snapshot closest to the given tick
	 *
	 * @public
	 * @param {NaturalNumber} tick - Tick to search for
	 */
	getByTick( tick )
	{

		return this.getClosestSnapshot( tick, 'tick' );
	}

	/**
	 * Get the exact or closest match to either a tick or datetime
	 *
	 * @private
	 * @param {NaturalNumber|Date} time - Tick or datetime to search for
	 * @param {String} timeType - "timestamp" or "tick"
	 */
	getClosestSnapshot( time, timeType )
	{
		if ( this.length === 0 )
		{
			return;
		}

		// Snapshot closest to the time being searched for
		let leastDifference = Infinity;
		let leastSnapshot = this.head;

		// Loop through each snapshot to find the snapshot closest to the time
		let currentSnapshot = this.head;
		while ( currentSnapshot )
		{
			let difference = currentSnapshot[ timeType ] - time;
			difference = Math.abs( difference );

			if ( !difference )
			{
				return currentSnapshot;
			}

			if ( difference < leastDifference )
			{
				leastDifference = difference;
				leastSnapshot = currentSnapshot;
			}

			currentSnapshot = currentSnapshot.prev;
		}

		return leastSnapshot;
	}
}