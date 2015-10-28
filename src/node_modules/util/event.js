export default
{
	events: new Map(),
	dispatch: function ( name, value )
	{
		if ( !this.events.has( name ) )
		{
			this.events.set( name, [] );
		}

		for ( var func of this.events.get( name ) )
		{
			func( value );
		}
	},
	listen: function ( name, func )
	{
		if ( !this.evens.has( name ) )
		{
			this.events.set( name, [ func ] );
		}

		this.events.get( name ).push( func );
	}
};