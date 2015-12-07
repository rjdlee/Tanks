import Bullet from '../entity/bullet';
import Explosion from '../entity/explosion';
import Mine from '../entity/mine';
import ObjectPool from '../util/object_pool';
import Score from './score';
import Tank from '../entity/tank';
import Vector from '../util/vector';
import Wall from '../entity/wall';

const DEFAULT_WIDTH = 4000;
const DEFAULT_HEIGHT = 2000;

export default class GameMap
{
	constructor( width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT )
	{
		this.tick = 0;
		this.score = new Score();

		this.width = width;
		this.height = height;

		this.tank_pool = new ObjectPool( 10, Tank );
		this.bullet_pool = new ObjectPool( 20, Bullet );
		this.mine_pool = new ObjectPool( 10, Mine );
		this.wall_pool = new ObjectPool( 50, Wall );
		this.explosion_pool = new ObjectPool( 10, Explosion );

		this.tanks = new Map();
		this.bullets = new Map();
		this.mines = new Map();
		this.walls = new Map();
		this.explosions = new Map();
	}

	spawn_tank( id, x, y, angle )
	{
		if ( this.tanks.has( id ) )
			return;

		let tank = this.tank_pool.get();
		tank.id = id;
		tank.move_to( x, y );

		if ( angle )
		{
			tank.turn_to( angle );
		}

		this.tanks.set( id, tank );

		return tank;
	}

	spawn_bullet( id, x, y, angle, owner_id )
	{
		let owner = this.tanks.get( owner_id );

		if ( !owner )
		{
			return;
		}

		if ( owner.bullets.size >= 3 )
		{
			return;
		}

		let bullet = this.bullet_pool.get();
		bullet.owner = owner_id;
		bullet.move_to( x, y );

		if ( id )
		{
			bullet.id = id;
		}

		if ( angle )
		{
			bullet.turn_to( angle );
		}

		owner.bullets.set( bullet.id, bullet );
		this.bullets.set( bullet.id, bullet );

		return bullet;
	}

	spawn_mine( id, x, y, p_id )
	{
		let mine = this.mine_pool.get();
		mine.p_id = p_id;
		mine.move_to( x, y );

		if ( id )
		{
			mine.id = id;
		}

		this.mines.set( mine.id, mine );

		return mine;
	}

	spawn_wall( id, x, y, width, height )
	{
		let wall = this.wall_pool.get();
		wall.move_to( x, y );

		if ( id )
		{
			wall.id = id;
		}

		if ( width )
		{
			wall.set_width( width );
		}

		if ( height )
		{
			wall.set_height( height );
		}

		this.walls.set( wall.id, wall );

		return wall;
	}

	spawn_explosion( id, x, y, radius )
	{
		let explosion = this.explosion_pool.get();
		explosion.radius = radius;
		explosion.move_to( x, y );

		if ( id )
		{
			wall.id = id;
		}

		this.explosions.set( explosion.id, explosion );

		return explosion;
	}

	remove_tank( id )
	{
		let tank = this.tanks.get( id );

		if ( !tank )
		{
			return;
		}

		this.tank_pool.release( tank );
		this.tanks.delete( id );
	};

	remove_bullet( id )
	{
		let bullet = this.bullets.get( id );

		if ( !bullet )
		{
			return;
		}

		this.tanks.get( bullet.owner ).bullets.delete( id );
		this.bullet_pool.release( bullet );
		this.bullets.delete( id );
	}

	remove_mine( id )
	{
		let mine = this.mines.get( id );

		if ( !mine )
		{
			return;
		}

		this.tanks.get( mine.owner ).mines.delete( id );
		this.mine_pool.release( mine );
		this.mines.delete( id );
	}

	remove_wall( id )
	{
		let wall = this.mines.get( id );

		if ( !wall )
		{
			return;
		}

		this.wall_pool.release( wall );
		this.walls.delete( id );
	}

	remove_explosion( id )
	{
		let explosion = this.explosions.get( id );

		if ( !explosion )
		{
			return;
		}

		this.explosion_pool.release( explosion );
		this.explosions.delete( explosion );
	}

}