class Event_Class
{
	constructor()
	{
		this.events = new Map();
	}

	// Create a new event if it doesn't already exist
	new_event( event_name )
	{
		if ( this.events.has( event_name ) )
			return false;

		this.events.set( event_name, new Array() );
		return true;
	}

	// Send an event and call the listening functions with the event data
	publish( event_name, event_data )
	{
		if ( this.new_event( event_name ) )
			return;

		let e = this.events.get( event_name );
		for ( let func of e )
		{
			func( event_data );
		}
	}

	// Call the given function when an event occurs
	subscribe( event_name, func )
	{
		this.new_event( event_name )

		let e = this.events.get( event_name );
		e.push( func );
	}
}

let Event = new Event_Class();
export default Event;