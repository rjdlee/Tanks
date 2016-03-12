export default class InputEvent
{
	constructor( game )
	{
		this.game = game;
		this.game_map = game.game_map;
		this.event_queue = game.event_queue;
	}

	handshake( id )
	{
		let tick = this.game_map.tick;
		this.event_queue.insert( tick, tick, this.game_map.randomly_spawn_tank.bind( this.game_map, id ) );
	}

	disconnect( id )
	{
		let tick = this.game_map.tick;
		this.event_queue.insert( tick, tick, this.game_map.score.remove.bind( this.game_map.score, id ) );
		this.event_queue.insert( tick, tick, this.game_map.remove_tank.bind( this.game_map, id ) );
	}

	spawn( tick, id, x, y, angle )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		this.event_queue.insert( tick, this.game_map.tick, this.game_map.spawn_tank.bind( this.game_map, id, x, y, angle ) );
	}

	speed( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		let speed = Math.sign( amount ) * 1.5;
		this.event_queue.insert( tick, this.game_map.tick, tank.set_speed.bind( tank, speed ) );
	}

	turn( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		let turn_speed = Math.sign( amount ) * 0.05;
		this.event_queue.insert( tick, this.game_map.tick, tank.set_turn_speed.bind( tank, turn_speed ) );
	}

	mouse( tick, tank, amount )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		this.event_queue.insert( tick, this.game_map.tick, tank.turn_barrel_to.bind( tank, amount ) );
	}

	bullet( tick, tank )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		let barrel_tip = tank.barrel.bounding_box.vertices[ 2 ];
		let barrel_angle = tank.barrel.angle;
		this.event_queue.insert( tick, this.game_map.tick,
			this.game_map.spawn_bullet.bind( this.game_map, null, barrel_tip.x, barrel_tip.y, barrel_angle, tank.id ) );
	}

	mine( tick, tank )
	{
		if ( !tick )
		{
			tick = this.game_map.tick;
		}

		this.event_queue.insert( tick, this.game_map.tick,
			this.game_map.spawn_mine.bind( this.game_map, null, tank.pos.x, tank.pos.y, tank.id ) );
	}
}