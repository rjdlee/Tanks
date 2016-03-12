import LinkedListNode from '../util/linked_list_node';

export default class Snapshot extends LinkedListNode
{
	constructor( data, prev, next )
	{
		super( prev, next );

		this.tick = data.tk;
		this.timestamp = data.ti;
		this.data = data;
	}

	// Find the differences between this and another snapshot
	diff( snapshot )
	{
		let diff = {};

		if ( !snapshot )
		{
			return this.data;
		}

		// Compare each entity type
		for ( let data_key in this.data )
		{
			let data_diff = diffObjects( this.data[ data_key ], snapshot.data[ data_key ] );

			// Only add non-empty differences to the diff
			if ( Object.keys( data_diff ).length > 0 )
			{
				diff[ data_key ] = data_diff;
			}
		}

		return diff;
	}
}

// Find the differences between two objects
function diffObjects( objectsA, objectsB )
{
	/*
		Objects are of the format:
		{
			id1: {
				property: value
			},
			id2: {
				property: {}
			}, ...
		}
	*/
	var diff = {};

	for ( var id in objectsA )
	{
		let object = objectsA[ id ];
		let idDiff = {};

		// Continue if object is not in previous
		if ( !( id in objectsB ) )
		{
			diff[ id ] = {};
			diff[ id ].add = JSON.parse( JSON.stringify( object ) );
			continue;
		}

		// Convert objects to JSON and do string comparison
		var prevObject = objectsB[ id ];
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
	for ( var id in objectsB )
	{
		if ( !( id in objectsA ) )
		{
			diff[ id ] = 'remove';
		}
	}

	return diff;
}