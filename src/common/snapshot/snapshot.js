import LinkedListNode from './linkedListNode';
import GameMap from '../game/gameMap';
import Util from '../util/util';

/**
 * Describes the minimally needed properties to describe each type of entity
 * Used in encode() and decode()
 *
 * @private
 */
const entityFields =
	[
	{
		type: 'tank',
		alias: 't',
		fields: [
		{
			alias: 'f',
			get: 'barrelAngle',
			set: 'turnBarrelTo'
		} ]
	},
	{
		type: 'bullet',
		alias: 'b',
		fields: []
	},
	{
		type: 'mine',
		alias: 'm',
		fields: [
		{
			alias: 't',
			get: 'timeLeft',
			set: 'timeLeft'
		} ]
	},
	{
		type: 'explosion',
		alias: 'e',
		fields: [
		{
			alias: 't',
			get: 'timeLeft',
			set: 'timeLeft'
		},
		{
			alias: 'r',
			get: 'radius',
			set: 'radius'
		} ]
	},
	{
		type: 'wall',
		alias: 'w',
		fields: [
		{
			alias: 'w',
			get: 'width',
			set: 'setWidth'
		},
		{
			alias: 'h',
			get: 'height',
			set: 'setHeight'
		} ]
	} ];

/**
 * A snapshot of the game map at a certain point in time
 * Contains minimal amount of data to reconstruct map at a point in time
 *
 * @public
 */
export default class Snapshot extends LinkedListNode
{
	/**
	 * @constructor
	 * @param {Object} gameMap - JSON object from gameMapState
	 * @param {Snapshot} [prev] - Previous snapshot in the linked list at a lower tick
	 * @param {Snapshot} [next] - Next snapshot in the linked list at a higher tick
	 */
	constructor( gameMap, prev, next )
	{
		super( prev, next );

		this.tick = gameMap.tick;

		/**
		 * The game has been moved to a tick based model so time is not needed
		 *
		 * @deprecated
		 */
		this.timestamp = gameMap.timestamp;

		/**
		 * encode()'ed game map data. Use decode() to access it
		 *
		 * @private
		 */
		this.data = Snapshot.encode( gameMap );
	}

	/**
	 * Create a minimal representation of the game map so it can be reconstructed later on
	 *
	 * @static
	 * @param {GameMap} gameMap - Game map to take a snapshot of
	 * @return {Object} JSON object containing data on each type of entity on the map
	 */
	static encode( gameMap )
	{
		let data = {
			tk: gameMap.tick,
			// ti: Date.now(),
			x: gameMap.width,
			y: gameMap.height,
			t: new Object(),
			b: new Object(),
			m: new Object(),
			e: new Object(),
			w: new Object()
		};

		for ( let entityType of entityFields )
		{
			let entities = gameMap[ entityType.type + 's' ];

			for ( let [ entityId, entity ] of entities )
			{
				let entityData = this.encodeEntity( entity );

				for ( let field of entityType.fields )
				{
					entityData[ field.alias ] = entity[ field.get ];
				}

				data[ entityType.alias ][ entityId ] = entityData;
			}
		}

		return data;
	}

	/**
	 * Create a minimal representation of an entity such as a bullet
	 *
	 * @private
	 * @static
	 * @param {Entity} entity - Entity to take a snapshot of
	 * @return {Object} JSON object containing data on the entity
	 */
	static encodeEntity( entity )
	{
		let data = {
			x: Math.round( entity.pos.x ),
			y: Math.round( entity.pos.y )
		};

		if ( typeof entity.owner !== 'undefined' )
		{
			data.o = entity.owner;
		}

		if ( entity.angle !== 0 )
		{
			data.a = entity.angle;
		}

		if ( entity.velocity !== 0 )
		{
			data.s = entity.velocity.length;
		}

		return data;
	}

	/**
	 * Restores encode()'ed data (at a certain tick) into the game map
	 *
	 * @static
	 * @param {Object} data - data from the encode() function
	 * @param {GameMap} gameMap - Game map to load the data into
	 * @return {GameMap} Returns the modified gameMap loaded with the data
	 */
	static decode( data, map )
	{
		if ( !map )
		{
			map = new GameMap( data.x, data.y );
		}
		else
		{
			map.width = data.x;
			map.height = data.y;
		}

		map.tick = data.tk;

		// For each entity type
		for ( let entityType of entityFields )
		{
			const entitySpawnFunc = map[ 'spawn' + entityType.type.capitalizeFirstLetter() ].bind( map );
			const entityRemoveFunc = map[ 'remove' + entityType.type.capitalizeFirstLetter() ].bind( map );
			let mapEntities = map[ entityType.type + 's' ];
			let dataEntities = data[ entityType.alias ];

			// Delete entities, which are on the map, but not in the data
			for ( let id of mapEntities )
			{
				if ( !( id in dataEntities ) )
				{
					// Call the map's remove function for this entity type
					entityRemoveFunc( id );
				}
			}

			for ( let id in dataEntities )
			{
				let entityData = dataEntities[ id ];

				// Spawn entities, which are in the data, but not on the map
				let entity = mapEntities.get( id );
				if ( !entity )
				{
					// Call the map's spawn function for this entity type
					entity = entitySpawnFunc( id, entityData.x, entityData.y );
				}

				// Set each property of the entity such as position and velocity
				for ( let field of entityType.fields )
				{
					let setVarOrFunc = entity[ field.set ];

					if ( Util.isFunction( setVarOrFunc ) )
					{
						entity[ field.set ]( entityData[ field.alias ] );
					}
					else
					{
						setVarOrFunc = entityData[ field.alias ];
					}
				}
			}
		}

		return map;
	}

	/**
	 * Find the differences between this and another snapshot
	 *
	 * @public
	 * @param {Snapshot} snapshot - Snapshot to differentiate with
	 * @return {Object} JSON object containing differences
	 */
	diff( snapshot )
	{
		let diff = {};

		if ( !snapshot )
		{
			return this.data;
		}

		// Compare each entity type
		for ( let dataKey in this.data )
		{
			let dataDiff = this.diffObjects( this.data[ dataKey ], snapshot.data[ dataKey ] );

			// Only add non-empty differences to the diff
			if ( Object.keys( dataDiff ).length > 0 )
			{
				diff[ dataKey ] = dataDiff;
			}
		}

		return diff;
	}

	/**
	 * Find the differences between two objects
	 *
	 * Example of an object:
	 * {
	 *		id1: {
	 *			property: value
	 *		},
	 *		id2: {
	 *			property: {}
	 *		}, ...
	 *	}
	 *
	 * @private
	 * @param {Object} objectA - First object to compare
	 * @param {Object} objectB - Second object to compare
	 * @return {Object} JSON object containing differences
	 */
	diffObjects( objectA, objectB )
	{
		var diff = {};

		for ( var id in objectA )
		{
			let object = objectA[ id ];
			let idDiff = {};

			// Continue if object is not in previous
			if ( !( id in objectB ) )
			{
				diff[ id ] = {};
				diff[ id ].add = JSON.parse( JSON.stringify( object ) );
				continue;
			}

			// Convert objects to JSON and do string comparison
			var prevObject = objectB[ id ];
			for ( var property in object )
			{
				if ( object.hasOwnProperty( property ) )
				{
					// Instead of accessing the properties of "property", just compare the objects' strings
					if ( JSON.stringify( object[ property ] ) !== JSON.stringify( prevObject[ property ] ) )
					{
						idDiff[ property ] = JSON.parse( JSON.stringify( object[ property ] ) );
					}
				}
			}

			// Add the differences if there are any
			if ( Object.keys( idDiff ).length > 0 )
			{
				if ( 'id' in object )
				{
					diff[ object.id ] = idDiff;
				}
				else
				{
					diff[ id ] = idDiff;
				}
			}
		}

		// Object is in previous, but not current
		for ( var id in objectB )
		{
			if ( !( id in objectA ) )
			{
				diff[ id ] = 'remove';
			}
		}

		return diff;
	}
}