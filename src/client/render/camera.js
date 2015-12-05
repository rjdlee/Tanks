/*

The viewport
for the active controller, it shifts to center the tank in the screen

*/

import Vector from '../../common/util/vector';

export default class Camera
{
	constructor( x, y, width, height )
	{
		this.pos = new Vector( x, y );

		this.width = width;
		this.height = height;

		// Used to find boundaries since pos is in center
		this.half_width = this.width >> 2;
		this.half_height = this.height >> 2;
	}

	// Move the camera to the position at x and y and recalculate its bounding box
	move_to( x, y, boundX, boundY )
	{
		x = Math.max( x, this.half_width );
		y = Math.max( y, this.half_height );

		x = Math.min( x, boundX - this.half_width );
		y = Math.min( y, boundY + this.half_height );

		this.pos.x = x - this.half_width;
		this.pos.y = y - this.half_height;
	}
}