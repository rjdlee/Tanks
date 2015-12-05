import Collision from '../common/collision/collision';
import Explosion from '../common/entity/explosion';
import ObjectPool from '../common/util/object_pool';
import ServerGameMap from '../common/game/game_map';
import Game from '../common/game/game';

export default class ServerGame extends Game
{
	constructor()
	{
		super();

		this.game_map = new ServerGameMap();
	}

	update_tanks( dt )
	{
		let collision = this.collision_pool.get();

		for ( let [ id, tank ] in this.game_map.tanks )
		{
			if ( tank.rotation.speed !== 0 )
			{
				tank.turn( tank.rotation.speed * dt );

				for ( let [ id, wall ] of this.game_map.walls )
				{
					if ( collision.is_colliding( tank, wall ) )
						player.rotateAlongWall( collision.edge, collision.overlap );
				}

				for ( let [ id, collision_tank ] of this.game_map.tanks )
				{
					if ( collision.is_colliding( tank, collision_tank ) )
						player.rotateAlongPlayer( collision.edge.unit_vector() );
				}
			}

			if ( player.velocity.length !== 0 )
			{
				let velocity = player.velocity.clone();

				for ( let [ id, wall ] of this.game_map.walls )
				{
					if ( collision.is_colliding( tank, wall ) )
						velocity.project( collision.edge.unit_vector() );
				}

				for ( let [ id, collision_tank ] of this.game_map.tanks )
				{
					if ( collision.is_colliding( tank, collision_tank ) )
						velocity.project( collision.edge.unit_vector() );
				}

				player.move( velocity.x * dt, velocity.y * dt );

				if ( id === controller.id )
					controller.camera.moveTo( player.pos.x, player.pos.y, this.width, this.height );
			}

			// Ease towards the next position from the server
			if ( player.next_pos.length() > 0 )
			{
				var dX = player.next_pos.x,
					dY = player.next_pos.y;

				if ( Math.abs( player.next_pos.x ) > 1 )
					dX /= 10;

				if ( Math.abs( player.next_pos.y ) > 1 )
					dY /= 10;

				player.next_pos.add( -dX, -dY );

				player.move( dX, dY );
			}

			if ( Math.abs( player.rotation.nextRad ) > 0 )
			{
				var dAngle = player.rotation.nextRad;

				if ( Math.abs( player.rotation.nextRad ) > 1 )
					dAngle /= 2;

				player.rotation.next_angle -= dAngle;

				player.turn( dAngle );
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
					bullet.bounce( collision.edge );

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