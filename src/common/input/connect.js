import BSON from './bson.js';

/**
 * Wrapper around SocketIO functions
 */
export default class Connect
{
	/**
	 * Send BSON encoded data to the socket
	 *
	 * @param {Socket} socket - Socket to send the event and data to
	 * @param {String} event - Event to send
	 * @param {Object} data - Data to encode and send
	 */
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

	/**
	 * Listen for and decode BSON data from the socket
	 *
	 * @param {Socket} socket - Socket, which will listen for the event
	 * @param {String} event - Event to listen for
	 * @param {Function} callback - Function to call when the event is received
	 */
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