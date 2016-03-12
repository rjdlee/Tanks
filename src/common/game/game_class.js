import Collision from '../collision/collision';
import EventQueue from '../state/event_queue';
import Explosion from '../entity/explosion';
import GameMap from './game_map';
import ObjectPool from '../util/object_pool';
import SnapshotList from '../state/snapshot_list';

export default class Game_Class
{
	constructor()
	{
		this.game_map = new GameMap();

		this.snapshot_list = new SnapshotList(); // Complete game states at fixed tick intervals
		this.event_queue = new EventQueue(); // Events that occurred during all the snapshots
		this.snapshot_list.save_snapshot_from_game_map( this.game_map ); // Ensure there's always at least one snapshot

		this.collision_pool = new ObjectPool( 3, Collision );
		this.explosion_pool = new ObjectPool( 10, Explosion );
	}

	next_tick()
	{
		let game_map = this.game_map;
		let snapshot_list = this.snapshot_list;
		let event_queue = this.event_queue;

		let start_tick = event_queue.get_head_tick( game_map.tick );
		let end_tick = game_map.tick;

		// Load the lowest tick's snapshot
		snapshot_list.load_snapshot_into_game_map( start_tick, game_map );
		start_tick = game_map.tick;

		// Replay all the events until we reach (present time + 1 tick)
		event_queue.for_each( start_tick, end_tick, function ( i )
		{
			for ( var func of event_queue.queue[ i ] )
			{
				func();
			}

			this.update();
			game_map.tick++;
		}.bind( this ) );

		event_queue.next_tick();
		snapshot_list.save_snapshot_if_delay( game_map );
	}

	update( dt )
	{
		this.update_tanks( dt );
		this.update_bullets( dt );
		this.update_mines( dt );
		this.update_explosions( dt );
	}

	update_tanks( dt = 1 )
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
					{
						tank.rotateAlongWall( Collision.edge, Collision.overlap );
					}
				}

				for ( let [ other_id, other_tank ] of this.game_map.tanks )
				{
					if ( other_id === id )
					{
						continue;
					}

					if ( Collision.is_colliding( tank, other_tank ) )
					{
						tank.rotateAlongPlayer( Collision.edge.unit_vector() );
					}
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
					{
						velocity.project( Collision.edge.unit_vector() );
					}
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

	update_bullets( dt = 1 )
	{
		let collision = this.collision_pool.get();

		for ( let [ id, bullet ] of this.game_map.bullets )
		{
			let velocity_x = bullet.velocity.x,
				velocity_y = bullet.velocity.y;

			// Cancel bullets
			for ( let [ collision_id, collision_bullet ] of this.game_map.bullets )
			{
				if ( Collision.is_colliding( bullet, collision_bullet ) )
				{
					this.game_map.remove_bullet( bullet );
					this.game_map.remove_bullet( collision_bullet );
				}
			}

			// Explode mines
			for ( let [ collision_id, collision_mine ] of this.game_map.mines )
			{
				if ( Collision.is_colliding( bullet, collision_mine ) )
				{
					this.game_map.remove_bullet( bullet );
					this.game_map.remove_mine( collision_mine );
				}
			}

			// Bounce off walls
			for ( let [ collision_id, collision_wall ] of this.game_map.walls )
			{
				if ( Collision.is_colliding( bullet, collision_wall ) )
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

	update_mines( dt = 1 )
	{
		for ( var [ id, mine ] of this.game_map.mines )
		{
			if ( mine.count_down( dt ) )
			{
				this.game_map.remove_mine( mine );
			}
		}
	}

	update_explosions( dt = 1 )
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