import BSON from './bson.js';

export default class Connect
{
	send( socket, event, data )
	{
		// Don't send empty objects
		if ( data === Object( data ) && Object.keys( data ).length === 0 )
		{
			return;
		}

		// Don't send empty strings
		if ( typeof data === 'string' && data.length === 0 )
		{
			return;
		}

		socket.emit( event, BSON.encode( data ) );
	}

	receive( socket, event, callback )
	{
		socket.on( event, function ( data )
		{
			if ( typeof data === 'undefined' )
			{
				callback();
			}
			else
			{
				data = BSON.decode( data );
				callback( data );
			}
		} );
	}
}