import GameMap from './game_map';
import Util from '../util/util';

const entity_fields = [
{
	type: 'tank',
	alias: 't',
	fields: [
	{
		alias: 'f',
		get: 'barrel_angle',
		set: 'turn_barrel_to'
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
		get: 'time_left',
		set: 'time_left'
	} ]
},
{
	type: 'explosion',
	alias: 'e',
	fields: [
	{
		alias: 't',
		get: 'time_left',
		set: 'time_left'
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
		set: 'set_width'
	},
	{
		alias: 'h',
		get: 'height',
		set: 'set_height'
	} ]
} ];

class GameMapState_Class
{
	encode( map )
	{
		let data = {
			tk: map.tick,
			ti: Date.now(),
			x: map.width,
			y: map.height,
			t: new Object(),
			b: new Object(),
			m: new Object(),
			e: new Object(),
			w: new Object()
		};

		for ( let entity_type of entity_fields )
		{
			let entities = map[ entity_type.type + 's' ];
			for ( let [ entity_id, entity ] of entities )
			{
				let entity_data = this.encode_entity( entity );

				for ( let field of entity_type.fields )
				{
					entity_data[ field.alias ] = entity[ field.get ];
				}

				data[ entity_type.alias ][ entity_id ] = entity_data;
			}
		}

		return data;
	}

	decode( data, map )
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

		map.tick = data.tick;
		map.timestamp = data.timestamp;

		for ( let entity_type of entity_fields )
		{
			let entities = map[ entity_type.type + 's' ];
			let entities_data = data[ entity_type.alias ];

			remove_differences( entities, entities_data );

			for ( let id in entities_data )
			{
				let entity_data = entities_data[ id ];

				let entity = entities.get( id );
				if ( !entity )
				{
					entity = map[ 'spawn_' + entity_type.type ]( id, entity_data.x, entity_data.y );
				}

				for ( let field of entity_type.fields )
				{
					let set_var_or_func = entity[ field.set ];

					if ( Util.is_function( set_var_or_func ) )
					{
						entity[ field.set ]( entity_data[ field.alias ] );
					}
					else
					{
						set_var_or_func = entity_data[ field.alias ];
					}
				}
			}
		}

		return map;

		function remove_differences( original_obj, new_obj )
		{
			for ( let id of original_obj.keys() )
			{
				if ( !( id in new_obj ) )
				{
					original_obj.delete( id );
				}
			}
		}
	}

	encode_entity( entity )
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

	decode_entity( id, data = {}, entity_or_spawn_function )
	{
		if ( typeof entity_or_spawn_function === 'function' )
		{
			entity = entity_or_spawn_function( id, data.x, data.y );
		}
		else
		{
			entity.move_to( data.x, data.y );
		}

		if ( typeof data.pid !== 'undefined' )
		{
			entity.pid = data.pid;
		}

		if ( typeof data.o !== 'undefined' )
		{
			entity.owner = data.o;
		}

		if ( typeof data.a !== 'undefined' )
		{
			entity.turn_to( data.a );
		}

		if ( typeof data.s !== 'undefined' )
		{
			entity.set_speed( data.s );
		}

		return entity;
	}
}

let GameMapState = new GameMapState_Class();
export default GameMapState;