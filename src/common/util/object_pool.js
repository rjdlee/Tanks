export default class ObjectPool
{
	constructor( size = 100, obj = Object )
	{
		this.obj = obj;
		this.pool = Array( size );

		for ( let i = 0; i < size; i++ )
			this.pool[ i ] = new obj();
	}

	// Add a new object to the pool
	spawn()
	{
		this.pool.push( new this.obj() );
	}

	// Take an object from the pool
	get()
	{
		if ( this.pool.length === 0 )
			this.spawn();

		return this.pool.pop();
	}

	// Put object back in pool and reset it if the object's reset() is defined
	release( obj )
	{
		if ( typeof obj !== typeof this.obj )
			return;

		if ( typeof obj.reset === 'function' )
			obj.reset();

		this.pool.push( obj );
	}
}