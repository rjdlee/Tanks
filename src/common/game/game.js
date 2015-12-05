import Collision from '../collision/collision';
import Explosion from '../entity/explosion';
import GameMap from './game_map';
import GameState from '../state/state';
import ObjectPool from '../util/object_pool';

class Game_Class
{
	constructor()
	{
		this.game_map = new GameMap();

		this.collision_pool = new ObjectPool( 3, Collision );
		this.explosion_pool = new ObjectPool( 10, Explosion );
	}

	update( dt )
	{
		this.update_tanks( dt );
		this.update_bullets( dt );
		this.update_mines( dt );
		this.update_explosions( dt );
		this.game_map.tick++;
	}

	update_tanks( dt )
	{
		let collision = this.collision_pool.get();

		for ( let [ id, tank ] of this.game_map.tanks )
		{
			if ( tank.angular_velocity !== 0 )
			{
				tank.turn( tank.angular_velocity * dt );

				for ( let [ other_id, wall ] of this.game_map.walls )
				{
					if ( Collision.is_colliding( tank, wall ) )
						tank.rotateAlongWall( Collision.edge, Collision.overlap );
				}

				for ( let [ other_id, other_tank ] of this.game_map.tanks )
				{
					if ( other_id === id )
					{
						continue;
					}

					if ( Collision.is_colliding( tank, other_tank ) )
						tank.rotateAlongPlayer( Collision.edge.unit_vector() );
				}
			}

			if ( tank.velocity.length !== 0 )
			{
				let velocity = tank.velocity.clone();

				for ( let [ other_id, wall ] of this.game_map.walls )
				{
					if ( Collision.is_colliding( tank, wall ) )
					{
						velocity.project( Collision.edge.unit_vector() );
					}
				}

				for ( let [ other_id, other_tank ] of this.game_map.tanks )
				{
					if ( other_id === id )
					{
						continue;
					}

					if ( Collision.is_colliding( tank, other_tank ) )
						velocity.project( Collision.edge.unit_vector() );
				}

				tank.move( velocity.x * dt, velocity.y * dt );
			}

			// Ease towards the next position from the server
			if ( tank.next_pos.length > 0 )
			{
				var dX = tank.next_pos.x,
					dY = tank.next_pos.y;

				if ( Math.abs( tank.next_pos.x ) > 1 )
					dX /= 10;

				if ( Math.abs( tank.next_pos.y ) > 1 )
					dY /= 10;

				tank.next_pos.add( -dX, -dY );

				tank.move( dX, dY );
			}

			if ( Math.abs( tank.next_angle ) > 0 )
			{
				var dAngle = tank.next_angle;

				if ( Math.abs( tank.next_angle ) > 1 )
					dAngle /= 2;

				tank.next_angle -= dAngle;

				tank.turn( dAngle );
			}
		}

		this.collision_pool.release( collision );
	}

	update_bullets( dt )
	{
		let collision = this.collision_pool.get();

		for ( let [ id, bullet ] of this.game_map.bullets )
		{
			let velocity_x = bullet.velocity.x,
				velocity_y = bullet.velocity.y;

			// Cancel bullets
			for ( let [ id, collision_bullet ] of this.game_map.bullets )
			{
				collision = bullet.isRectangleCollision( collision_bullet );

				if ( collision )
				{
					this.game_map.remove_bullet( bullet );
					this.game_map.remove_bullet( collision_bullet );
				}
			}

			// Explode mines
			for ( let [ id, mine ] of this.game_map.mines )
			{
				collision = bullet.isRectangleCollision( mine );

				if ( collision )
				{
					this.game_map.remove_bullet( bullet );
					this.game_map.remove_mine( mine );
				}
			}

			// Bounce off walls
			for ( let [ id, wall ] of this.game_map.walls )
			{
				collision = bullet.isRectangleCollision( wall );

				if ( collision )
				{
					bullet.bounce( Collision.edge );

					velocity_x = bullet.velocity.x;
					velocity_y = bullet.velocity.y;
				}
			}

			bullet.move( velocity_x * dt, velocity_y * dt );
		}

		this.collision_pool.release( collision );
	}

	update_mines( dt )
	{
		for ( var [ id, mine ] of this.game_map.mines )
		{
			if ( mine.count_down( dt ) )
			{
				this.game_map.remove_mine( mine );
			}
		}
	}

	update_explosions( dt )
	{
		for ( var [ id, explosion ] of this.game_map.explosions )
		{
			if ( explosion.count_down( dt ) )
			{
				this.game_map.remove_explosion( explosion );
			}
		}
	}
}

let Game = new Game_Class();
export default Game;