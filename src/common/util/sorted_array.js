class SortedArray extends Array
{
	insert( new_key, min, max )
	{
		array.splice( binary_search( key, 0, this.length ) + 1, 0, key );
	}

	binary_search( key, min, max )
	{
		// Ensure not empty
		if ( max < min )
		{
			return mid;
		}

		// Calculate midpoint
		let mid = ( min + max ) >> 1;

		if ( this[ mid ] > key )
		{
			// Key in lower set
			return binary_search( key, min, mid - 1 );
		}
		else if ( this[ mid ] < key )
		{
			// Key in upper set
			return binary_search( key, mid + 1, max );
		}
		else
		{
			// Match found
			return mid;
		}
	}
}