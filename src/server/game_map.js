import Collision from '../common/collision/collision';
import GameMap from '../common/game/game_map';
import GameMapGenerator from '../common/game/game_map_generator';
import GameMapState from '../common/game/game_map_state';
import Score from '../common/game/score';
import Tank from '../common/entity/tank';

export default class ServerGameMap extends GameMap
{
	constructor( width, height )
	{
		super( width, height );

		this.emptyTiles = GameMapGenerator.generate_walls( this.width, this.height, this.spawn_wall.bind( this ) ); // Generate random walls
		this.walls.clear(); // TODO: REMOVE AFTER TESTING
	}

	kill( victimID, murdererID )
	{
		var victim = this.tanks[ victimID ],
			murderer = this.tanks[ murdererID ];
		// assailantLog = aid in stateQueue ? stateQueue[ aid ] : new Object();

		// Move the tank to a new place
		this.spawn( victim );

		// Update scores
		murderer.score++;
		victim.score = 0;

		// Update scoreboard
		this.score.set( murdererID, murderer.score );
		this.score.set( victimID, 0 );

		// stateQueue[ aid ] = assailantLog;
	}

	// Spawn a tank in a random, unoccupied location
	randomly_spawn_tank( tankID )
	{
		var tank,
			tries = 0;

		if ( !tankID )
			return;

		if ( tankID instanceof Tank )
		{
			tank = tankID;
		}
		else
		{
			tank = this.spawn_tank( tankID, 0, 0 );
		}

		spawn_loop: while ( tries < 100 )
		{
			tries++;

			// Choose an empty grid position with no wall
			var pos = this.emptyTiles[ Math.round( Math.random() * ( this.emptyTiles.length - 1 ) ) ];

			// Convert tile to real coordinates
			pos.multiply( 50 );

			// Used for collision detection
			let pos_object = {
				pos: pos
			};

			// Check for collisions with tanks
			for ( let [ other_id, other_tank ] of this.tanks )
			{
				if ( Collision.is_near( other_tank, pos_object ) )
				{
					continue spawn_loop;
				}
			}

			// Check for collisions with projectiles
			for ( let [ other_id, other_bullet ] in this.bullets )
			{
				if ( Collision.is_near( other_bullet, pos_object ) )
				{
					continue spawn_loop;
				}
			}

			// Apply the collision free position to the tank
			tank.move_to( pos.x, pos.y );
			break spawn_loop;
		}

		return tank;
	}
}

// Extract a digit from a random seed ( Ex. Seed: 153 & Digit: 2 -> Return: 5 )
function getSeedDigit( seed, digit )
{
	digit = Math.pow( 10, digit );
	return Math.round( ( seed * digit ) % 10 );
}