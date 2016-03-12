import * as config from './config';
import GameMapState from '../game/game_map_state';
import LinkedList from '../util/linked_list';
import Snapshot from './snapshot';

export default class SnapshotList extends LinkedList
{
	constructor()
	{
		super( config.SNAPSHOT_LIMIT );
	}

	// Saves game_map as a snapshot in this list
	save_snapshot_from_game_map( game_map )
	{
		let data = GameMapState.encode( game_map );
		let snapshot = new Snapshot( data );

		this.unshift( snapshot );
	}

	// Load the snapshot closest to snapshot_tick into game_map
	load_snapshot_into_game_map( snapshot_tick, game_map )
	{
		var snapshot = this.get_by_tick( snapshot_tick );
		if ( !snapshot )
		{
			return;
		}

		GameMapState.decode( snapshot.data, game_map );

		game_map.tick = snapshot.tick;
		game_map.timestamp = snapshot.timestamp;
		game_map.snapshot = snapshot;
	}

	// Returns whether or not the map should take a snapshot
	save_snapshot_if_delay( game_map )
	{
		// Return true if the tick is a multiple of the snapshot delay
		if ( game_map.tick % config.SNAPSHOT_DELAY === 0 )
		{
			this.save_snapshot_from_game_map( game_map );
		}
	}

	// Return snapshot by epoch datetime
	get_by_time( time )
	{

		return this.get_closest_snapshot( time, 'timestamp' );
	}

	// Return snapshot by map tick
	get_by_tick( tick )
	{

		return this.get_closest_snapshot( tick, 'tick' );
	}

	// Used to retrieve the exact or closest match to either a tick or datetime
	get_closest_snapshot( time, timeType )
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