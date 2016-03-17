import Collision from '../common/collision/collision';
import GameMap from '../common/game/gameMap';
import GameMapGenerator from '../common/game/gameMapGenerator';
import Score from '../common/game/score';
import Tank from '../common/entity/tank';

/**
 * Same as a regular GameMap, but spawns random walls
 */
export default class ServerGameMap extends GameMap
{
	constructor( width, height )
	{
		super( width, height );

		this.emptyTiles = GameMapGenerator.generateWalls( this ); // Generate random walls
	}

	/**
	 * Handler for events where a tank kills another tank
	 * i.e. Respawn the victim and reset their score. Increase the murderer's score
	 *
	 * @public
	 * @param {String} victimID
	 * @param {String} murdererID
	 */
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

	/**
	 * Spawn a tank in a random, unoccupied location
	 *
	 * @public
	 * @param {String} tankID - Unique ID
	 */
	randomlySpawnTank( tankID )
	{
		let tank;
		let tries = 0;

		if ( !tankID )
			return;

		if ( tankID instanceof Tank )
		{
			tank = tankID;
		}
		else
		{
			tank = this.spawnTank( tankID, 0, 0 );
		}

		spawnLoop: while ( tries < 100 )
		{
			tries++;

			// Choose an empty grid position with no wall
			var pos = this.emptyTiles[ Math.round( Math.random() * ( this.emptyTiles.length - 1 ) ) ];

			// Convert tile to real coordinates
			pos.multiply( 50 );

			// Used for collision detection
			let posObject = {
				pos: pos
			};

			// Check for collisions with tanks
			for ( let [ otherId, otherTank ] of this.tanks )
			{
				if ( Collision.isNear( otherTank, posObject ) )
				{
					continue spawnLoop;
				}
			}

			// Check for collisions with projectiles
			for ( let [ otherId, otherBullet ] in this.bullets )
			{
				if ( Collision.isNear( otherBullet, posObject ) )
				{
					continue spawnLoop;
				}
			}

			// Apply the collision free position to the tank
			tank.moveTo( pos.x, pos.y );
			break spawnLoop;
		}

		return tank;
	}
}