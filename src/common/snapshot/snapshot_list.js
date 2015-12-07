import LinkedList from '../util/linked_list';
import Snapshot from './snapshot';

let DEFAULT_NODE_LIMIT = 100;

export default class SnapshotList extends LinkedList
{
	// Return snapshot by epoch datetime
	getByTime( time )
	{

		return this.getClosestSnapshot( time, 'timestamp' );
	}

	// Return snapshot by map tick
	getByTick( tick )
	{

		return this.getClosestSnapshot( tick, 'tick' );
	}

	// Used to retrieve the exact or closest match to either a tick or datetime
	getClosestSnapshot( time, timeType )
	{
		if ( this.length === 0 )
			return;

		var leastDifference = Infinity,
			leastSnapshot = this.head,

			currSnapshot = this.head;

		while ( currSnapshot )
		{
			let difference = Math.abs( currSnapshot[ timeType ] - time );

			if ( difference === 0 )
				return currSnapshot;

			if ( difference < leastDifference )
			{
				leastDifference = difference;
				leastSnapshot = currSnapshot;
			}

			currSnapshot = currSnapshot.prev;
		}

		return leastSnapshot;
	}
}