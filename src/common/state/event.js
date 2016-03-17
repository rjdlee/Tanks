/**
 * Provides publish and subscribe functionality between modules
 */
class EventClass
{
	constructor()
	{
		/**
		 * Holds each event and its listening functions
		 *
		 * @private
		 */
		this.events = new Map();
	}

	/** 
	 * Create a new event if it doesn't already exist
	 *
	 * @private
	 */
	newEvent( eventName )
	{
		if ( this.events.has( eventName ) )
			return false;

		this.events.set( eventName, new Array() );
		return true;
	}

	/**
	 * Call each function listening to the event
	 *
	 * @public
	 * @param {String} eventName - Name of the event to listen to
	 * @param {Object} value - Argument to send to listening functions
	 */
	publish( eventName, eventData )
	{
		if ( this.newEvent( eventName ) )
			return;

		let e = this.events.get( eventName );
		for ( let func of e )
		{
			func( eventData );
		}
	}

	/**
	 * Add a listener for an event
	 *
	 * @public
	 * @param {String} eventName - Name of the event to listen to
	 * @param {Function} func - Function to be called when the event occurs
	 */
	subscribe( eventName, func )
	{
		this.newEvent( eventName )

		let e = this.events.get( eventName );
		e.push( func );
	}
}

/**
 * Singleton of event class to maintain state across modules
 *
 * @public
 */
let Event = new EventClass();
export default Event;