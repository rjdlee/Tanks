import Bullet from '../entity/bullet';
import Explosion from '../entity/explosion';
import Mine from '../entity/mine';
import ObjectPool from '../util/object_pool';
import Score from './score';
import Tank from '../entity/tank';
import Vector from '../util/vector';
import Wall from '../entity/wall';

export default class GameMap
{
	constructor( width, height )
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
		tank.turn_to( angle );

		this.tanks.set( id, tank );

		return tank;
	}

	spawn_bullet( id, x, y, angle, p_id )
	{
		let bullet = this.bullet_pool.get();
		bullet.p_id = p_id;
		bullet.move_to( x, y );

		this.bullets.set( projectile.id, projectile );

		return projectile;
	}

	spawn_mine( id, x, y, p_id )
	{
		let mine = this.mine_pool.get();
		mine.p_id = p_id;
		mine.move_to( x, y );

		this.mines.set( mine.id, mine );

		return mine;
	}

	spawn_wall( id, x, y, width, height )
	{
		let wall = this.wall_pool.get();
		wall.move_to( x, y );

		this.walls.set( wall.id, wall );

		return wall;
	}

	spawn_explosion( x, y, radius )
	{
		let explosion = this.explosion_pool.get();
		explosion.radius = radius;
		explosion.move_to( x, y );

		this.explosions.set( explosion.id, explosion );

		return explosion;
	}

	remove_tank( id )
	{
		let tank = this.tanks.get( id );

		this.tank_pool.release( tank );
		this.tanks.delete( id );
	};

	remove_bullet( id )
	{
		let bullet = this.bullets.get( id );

		this.bullet_pool.release( bullet );
		this.projectiles.delete( id );
	}

	remove_mine( id )
	{
		let mine = this.mines.get( id );

		this.mine_pool.release( mine );
		this.mines.delete( id );
	}

	remove_wall( id )
	{
		let wall = this.mines.get( id );

		this.wall_pool.release( wall );
		this.walls.delete( id );
	}

	remove_explosion( id )
	{
		let explosion = this.explosions.get( id );

		this.explosion_pool.release( explosion );
		this.explosions.delete( explosion );
	}

}