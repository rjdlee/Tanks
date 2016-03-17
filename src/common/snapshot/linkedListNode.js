/**
 * Node for the bidirectional linked list
 *
 * @private
 */
export default class LinkedListNode
{
	constructor( data, prev, next )
	{
		this.data = data;
		this.prev = prev;
		this.next = next;
	}
}