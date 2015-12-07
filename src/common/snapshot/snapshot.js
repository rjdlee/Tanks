import LinkedListNode from '../util/linked_list_node';

export default class Snapshot extends LinkedListNode
{
	constructor( data, prev, next )
	{
		super( prev, next );

		this.tick = data.tk;
		this.timestamp = data.ti;
		this.data = data;
	}
}