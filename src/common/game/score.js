/**
 * Tracks all player scores and sorts them from highest to lowest
 */
export default class Score
{
	constructor()
	{
		/** 
		 * Top ten player scores
		 *
		 * @public
		 */
		this.leaderboard = [];

		/** Full sorted list of all player scores
		 *
		 * @private
		 */
		this.scoreboard = [];
		this.scoreboardDict = {};
	}

	/**
	 * Set a tank's score in the scoreboard
	 *
	 * @public
	 * @param {String} id - ID of the tank whose score is being set
	 * @param {NaturalNumber} score - Score to set
	 */
	set( id, score )
	{
		// Entry to be stored in the scoreboard
		var entry = {
			id: id,
			score: score
		};

		// Remove existing entry for this id
		if ( id in this.scoreboardDict )
		{
			this.scoreboard.splice( this.scoreboardDict[ id ], 1 );
		}

		// Add the entry in descending order
		for ( var i = 0; i < this.scoreboard.length; i++ )
		{
			if ( score > this.scoreboard[ i ].score )
			{
				this.scoreboard.splice( i, 0, entry );
				this.scoreboardDict[ id ] = i;

				return;
			}
		}

		// Add the entry to the last position in the scoreboard if lowest score
		this.scoreboard.push( entry );
		this.scoreboardDict[ id ] = this.scoreboard.length - 1;

		this.updateLeaderboard();
	}

	/**
	 * Remove a user from the scoreboard
	 *
	 * @public
	 * @param {String} id - ID of the tank to remove from the scoreboard
	 */
	remove( id )
	{
		this.scoreboard.splice( this.scoreboardDict[ id ], 1 );
		delete this.scoreboardDict[ id ];

		this.updateLeaderboard();
	}

	/**
	 * Update the top ten scores
	 *
	 * @private
	 * @return {Boolean} True if the top ten scores have changed
	 */
	updateLeaderboard()
	{
		let lastLeaderboard = JSON.parse( JSON.stringify( this.leaderboard ) );
		this.leaderboard = this.scoreboard.slice( 0, 10 );

		for ( var i = 0; i < this.leaderboard.length; i++ )
		{
			if ( !( i in lastLeaderboard ) )
			{
				continue;
			}

			if ( this.leaderboard[ i ].id !== lastLeaderboard[ i ].id )
			{
				return true;
			}
		}
	}
}