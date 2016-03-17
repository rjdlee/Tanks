import Entity from './entity';

/**
 * Stationary and inert entity
 */
export default class Wall extends Entity
{
	/**
	 * Change the wall's width
	 *
	 * @public
	 * @param {NaturalNumber} width
	 */
	setWidth( width = 0 )
	{
		this.width = width;
		this.boundingBox = this.createRectangularBoundingBox();
	}

	/**
	 * Change the wall's height
	 *
	 * @public
	 * @param {NaturalNumber} heightw
	 */
	setHeight( height = 0 )
	{
		this.height = height;
		this.boundingBox = this.createRectangularBoundingBox();
	}
}