import Bullet from '../entity/bullet';
import Explosion from '../entity/explosion';
import Mine from '../entity/mine';
import ObjectPool from '../util/objectPool';
import Score from './score';
import Tank from '../entity/tank';
import Vector from '../util/vector';
import Wall from '../entity/wall';

/**
 * Stores the game's state
 */
export default class GameMap
{
	/**
	 * @constructor
	 * @param {NaturalNumber} width
	 * @param {NaturalNumber} height
	 */
	constructor( width = 4000, height = 2000 )
	{
		this.tick = 10;

		// Sorted scoreboard to track each player's score
		this.score = new Score();

		this.width = width;
		this.height = height;

		// Create pools of entities to minimize memory operations
		this.tankPool = new ObjectPool( 10, Tank );
		this.bulletPool = new ObjectPool( 20, Bullet );
		this.minePool = new ObjectPool( 10, Mine );
		this.wallPool = new ObjectPool( 50, Wall );
		this.explosionPool = new ObjectPool( 10, Explosion );

		// Create a Map for each entity type
		this.tanks = new Map();
		this.bullets = new Map();
		this.mines = new Map();
		this.walls = new Map();
		this.explosions = new Map();
	}

	/**
	 * Spawn a new tank on the game map
	 *
	 * @public
	 * @param {String} id - Tank's unique ID
	 * @param {Number} x - Tank's x position
	 * @param {Number} y - Tank's y position
	 * @param {Number} angle - Tank's angle
	 */
	spawnTank( id, x, y, angle )
	{
		if ( this.tanks.has( id ) )
		{
			return;
		}

		// Get a tank from the pool
		let tank = this.tankPool.get();
		tank.id = id;

		// Set the tank's position
		tank.moveTo( x, y );

		// Set the tank's angle
		if ( angle )
		{
			tank.turnTo( angle );
		}

		// Add the tank to the Map
		this.tanks.set( id, tank );

		return tank;
	}

	/**
	 * Spawn a new bullet on the game map
	 *
	 * @public
	 * @param {String} id - Bullet's unique ID
	 * @param {Number} x - Bullet's x position
	 * @param {Number} y - Bullet's y position
	 * @param {Number} angle - Bullet's angle
	 * @param {String} id - ID of the tank this bullet came from
	 */
	spawnBullet( id, x, y, angle, ownerId )
	{
		let owner = this.tanks.get( ownerId );

		if ( !owner )
		{
			return;
		}

		if ( owner.bullets.size >= 3 )
		{
			return;
		}

		let bullet = this.bulletPool.get();
		bullet.owner = ownerId;
		bullet.moveTo( x, y );

		if ( id )
		{
			bullet.id = id;
		}

		if ( angle )
		{
			bullet.turnTo( angle );
		}

		owner.bullets.set( bullet.id, bullet );
		this.bullets.set( bullet.id, bullet );

		return bullet;
	}

	/**
	 * Spawn a new mine on the game map
	 *
	 * @public
	 * @param {String} id - Mine's unique ID
	 * @param {Number} x - Mine's x position
	 * @param {Number} y - Mine's y position
	 * @param {String} id - ID of the tank this mine came from
	 */
	spawnMine( id, x, y, ownerId )
	{
		let mine = this.minePool.get();
		mine.owner = ownerId;
		mine.moveTo( x, y );

		if ( id )
		{
			mine.id = id;
		}

		this.mines.set( mine.id, mine );

		return mine;
	}

	/**
	 * Spawn a new wall on the game map
	 *
	 * @public
	 * @param {String} id - Wall's unique ID
	 * @param {Number} x - Wall's x position
	 * @param {Number} y - Wall's y position
	 * @param {NaturalNumber} width - Wall's width
	 * @param {NaturalNumber} height - Wall's height
	 */
	spawnWall( id, x, y, width, height )
	{
		let wall = this.wallPool.get();
		wall.moveTo( x, y );

		if ( id )
		{
			wall.id = id;
		}

		if ( width )
		{
			wall.setWidth( width );
		}

		if ( height )
		{
			wall.setHeight( height );
		}

		this.walls.set( wall.id, wall );

		return wall;
	}

	/**
	 * Spawn a new explosion on the game map
	 *
	 * @public
	 * @param {String} id - Explosions's unique ID
	 * @param {Number} x - Explosion's x position
	 * @param {Number} y - Explosion's y position
	 * @param {NaturalNumber} radius - Explosion radius
	 */
	spawnExplosion( id, x, y, radius )
	{
		let explosion = this.explosionPool.get();
		explosion.radius = radius;
		explosion.moveTo( x, y );

		if ( id )
		{
			wall.id = id;
		}

		this.explosions.set( explosion.id, explosion );

		return explosion;
	}

	/**
	 * Remove a tank from the game map and return it to the pool
	 *
	 * @public
	 * @param {String} id - ID of tank to delete
	 */
	removeTank( id )
	{
		let tank = this.tanks.get( id );

		if ( !tank )
		{
			return;
		}

		this.tankPool.release( tank );
		this.tanks.delete( id );
	};

	/**
	 * Remove a bullet from the game map and return it to the pool
	 *
	 * @public
	 * @param {String} id - ID of bullet to delete
	 */
	removeBullet( id )
	{
		let bullet = this.bullets.get( id );

		if ( !bullet )
		{
			return;
		}

		this.tanks.get( bullet.owner ).bullets.delete( id );
		this.bulletPool.release( bullet );
		this.bullets.delete( id );
	}

	/**
	 * Remove a mine from the game map and return it to the pool
	 *
	 * @public
	 * @param {String} id - ID of mine to delete
	 */
	removeMine( id )
	{
		let mine = this.mines.get( id );

		if ( !mine )
		{
			return;
		}

		this.tanks.get( mine.owner ).mines.delete( id );
		this.minePool.release( mine );
		this.mines.delete( id );
	}

	/**
	 * Remove a mine from the game map and return it to the pool
	 *
	 * @public
	 * @param {String} id - ID of wall to delete
	 */
	removeWall( id )
	{
		let wall = this.walls.get( id );

		if ( !wall )
		{
			return;
		}

		this.wallPool.release( wall );
		this.walls.delete( id );
	}

	/**
	 * Remove an explosion from the game map and return it to the pool
	 *
	 * @public
	 * @param {String} id - ID of explosion to delete
	 */
	removeExplosion( id )
	{
		let explosion = this.explosions.get( id );

		if ( !explosion )
		{
			return;
		}

		this.explosionPool.release( explosion );
		this.explosions.delete( explosion );
	}

}