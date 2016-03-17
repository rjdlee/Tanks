import Collision from '../collision/collision';
import Explosion from '../entity/explosion';
import GameMap from './gameMap';
import ObjectPool from '../util/objectPool';

/**
 * Core of the game logic
 *
 * @public
 */
export default class GameClass
{
	constructor()
	{
		this.gameMap = new GameMap();
	}

	/**
	 * Update each type of entity
	 *
	 * @public
	 * @param {NaturalNumber} [dt] - Time between update() calls
	 */
	update( dt )
	{
		this.updateTanks( dt );
		this.updateBullets( dt );
		this.updateMines( dt );
		this.updateExplosions( dt );
	}

	/**
	 * Update tank entities
	 *
	 * @private
	 * @param {NaturalNumber} [dt] - Time between updateTanks() calls
	 */
	updateTanks( dt = 1 )
	{
		for ( let [ id, tank ] of this.gameMap.tanks )
		{
			tank.prevAngle = tank.angle;
			tank.prevPos.set( tank.pos.x, tank.pos.y );

			// Tank is turning
			if ( tank.angularVelocity !== 0 )
			{
				tank.turn( tank.angularVelocity * dt );

				// Check if tank is colliding with walls
				for ( let [ otherId, wall ] of this.gameMap.walls )
				{
					if ( Collision.isColliding( tank, wall ) )
					{
						console.log( 'turncollision' );
						tank.rotateAlongWall( Collision.edge, Collision.overlap );
					}
				}

				// Check if tank is colliding with other tanks
				for ( let [ otherId, otherTank ] of this.gameMap.tanks )
				{
					if ( otherId === id )
					{
						continue;
					}

					if ( Collision.isColliding( tank, otherTank ) )
					{
						tank.rotateAlongPlayer( Collision.edge.unitVector() );
					}
				}
			}

			// Tank is moving
			if ( tank.velocity.length !== 0 )
			{
				let velocity = tank.velocity.clone();

				// Check if tank is colliding with walls
				for ( let [ otherId, wall ] of this.gameMap.walls )
				{
					// Project velocity on the surface the tank is colliding with
					if ( Collision.isColliding( tank, wall ) )
					{
						console.log( 'collision' );
						console.log( tank.pos, wall.pos, wall.width, wall.height );
						velocity.project( Collision.edge.unitVector() );
					}
				}

				// Check if tank is colliding with tanks
				for ( let [ otherId, otherTank ] of this.gameMap.tanks )
				{
					if ( otherId === id )
					{
						continue;
					}

					// Project velocity on the surface the tank is colliding with
					if ( Collision.isColliding( tank, otherTank ) )
					{
						velocity.project( Collision.edge.unitVector() );
					}
				}

				tank.move( velocity.x * dt, velocity.y * dt );
			}
		}
	}

	/**
	 * Update bullet entities
	 *
	 * @private
	 * @param {NaturalNumber} [dt] - Time between updateBullets() calls
	 */
	updateBullets( dt = 1 )
	{
		for ( let [ id, bullet ] of this.gameMap.bullets )
		{
			let velocityX = bullet.velocity.x,
				velocityY = bullet.velocity.y;

			// Bullets destroy one another
			for ( let [ collisionId, collisionBullet ] of this.gameMap.bullets )
			{
				if ( Collision.isColliding( bullet, collisionBullet ) )
				{
					this.gameMap.removeBullet( bullet );
					this.gameMap.removeBullet( collisionBullet );
				}
			}

			// Bullets explode mines
			for ( let [ collisionId, collisionMine ] of this.gameMap.mines )
			{
				if ( Collision.isColliding( bullet, collisionMine ) )
				{
					this.gameMap.removeBullet( bullet );
					this.gameMap.removeMine( collisionMine );
				}
			}

			// Bullets bounce off walls
			for ( let [ collisionId, collisionWall ] of this.gameMap.walls )
			{
				if ( Collision.isColliding( bullet, collisionWall ) )
				{
					bullet.bounce( Collision.edge );

					velocityX = bullet.velocity.x;
					velocityY = bullet.velocity.y;
				}
			}

			bullet.move( velocityX * dt, velocityY * dt );
		}
	}

	/**
	 * Update mine entities
	 *
	 * @private
	 * @param {NaturalNumber} [dt] - Time between updateMines() calls
	 */
	updateMines( dt = 1 )
	{
		for ( var [ id, mine ] of this.gameMap.mines )
		{
			if ( mine.countDown( dt ) )
			{
				this.gameMap.removeMine( mine );
			}
		}
	}

	/**
	 * Update explosion entities
	 *
	 * @private
	 * @param {NaturalNumber} [dt] - Time between updateExplosions() calls
	 */
	updateExplosions( dt = 1 )
	{
		for ( var [ id, explosion ] of this.gameMap.explosions )
		{
			if ( explosion.countDown( dt ) )
			{
				this.gameMap.removeExplosion( explosion );
			}
		}
	}
}