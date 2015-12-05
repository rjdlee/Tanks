import Entity from './entity';

export default class Wall extends Entity
{
	set_width( width = 0 )
	{
		this.width = width;
		this.bounding_box = this.create_rectangular_bounding_box();
	}

	set_height( height = 0 )
	{
		this.height = height;
		this.bounding_box = this.create_rectangular_bounding_box();
	}
}