let DEFAULT_NODE_LIMIT = 100;

export default class LinkedList
{
	constructor( node_limit = DEFAULT_NODE_LIMIT )
	{
		this.node_limit = node_limit;
		this.length = 0;
	}

	// Return node by array index
	get( index )
	{
		if ( this.length <= index )
			return;

		var node = this.tail;
		for ( var i = 1; i < index; i++ )
		{
			node = node.next;
		}

		return node;
	}

	// Add a new node to the head
	unshift( node )
	{
		if ( this.length >= 1 )
		{
			var head = this.head;

			node.prev = head;
			head.next = node;
			this.head = node;
		}
		else
		{
			this.head = node;
			this.tail = node;
		}

		this.length++;

		// Limit number of nodes
		if ( this.length > this.node_limit )
		{
			var shift = this.length - this.node_limit,
				currNode = this.tail;

			for ( var i = 0; i < shift; i++ )
				currNode = currNode.next;

			currNode.prev = undefined;
			this.tail = currNode;

			this.length = this.node_limit;
		}
	}

	// Remove and return the head node
	shift()
	{
		if ( !this.length )
			return;

		var head = this.head;

		if ( this.length === 1 )
		{
			this.head = undefined;
			this.tail = undefined;
		}
		else
		{
			head.prev.next = undefined;
			this.head = head.prev;
		}

		this.length--;

		return head;
	}
}