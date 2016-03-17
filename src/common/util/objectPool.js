/** 
 * Create a pool of Objects to minimize memory operations
 *
 * @public
 */
export default class ObjectPool
{
	/** 
	 * @public
	 * @param {integer} size The initial size of the pool
	 * @param {Object} obj The object to populate the pool with
	 */
	constructor( size = 100, obj = Object )
	{
		this.obj = obj;
		this.pool = Array( size );

		for ( let i = 0; i < size; i++ )
		{
			this.pool[ i ] = new obj();
		}
	}

	/**
	 * Add a new object to the pool
	 *
	 * @public
	 */
	spawn()
	{
		this.pool.push( new this.obj() );
	}

	/**
	 * Take an object from the pool
	 *
	 * @public
	 */
	get()
	{
		// Resize the pool if all objects have been allocated
		if ( this.pool.length === 0 )
		{
			this.spawn();
		}

		return this.pool.pop();
	}

	/** 
	 * Put object back in pool and reset it if the object's reset() is defined
	 *
	 * @public
	 */
	release( obj )
	{
		// Object types does not match the pool's type
		if ( !( obj instanceof this.obj ) )
		{
			return;
		}

		// Reset the object to its default state
		if ( typeof obj.reset === 'function' )
		{
			obj.reset();
		}

		this.pool.push( obj );
	}
}