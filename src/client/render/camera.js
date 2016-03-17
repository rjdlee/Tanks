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
		this.halfWidth = this.width >> 2;
		this.halfHeight = this.height >> 2;
	}

	// Move the camera to the position at x and y and recalculate its bounding box
	moveTo( x, y, boundX, boundY )
	{
		x = Math.max( x, this.halfWidth );
		y = Math.max( y, this.halfHeight );

		x = Math.min( x, boundX - this.halfWidth );
		y = Math.min( y, boundY + this.halfHeight );

		this.pos.x = x - this.halfWidth;
		this.pos.y = y - this.halfHeight;
	}
}