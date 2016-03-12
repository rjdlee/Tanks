export default class CircularQueue
{
	constructor( length = 1 )
	{
		if ( length < 1 )
		{
			throw "Length must be greater than 1";
		}

		this.queue = new Array( length );
		this.head = 0;
		this.tail = length - 1;
	}


}