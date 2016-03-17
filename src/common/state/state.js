import StateMachine from 'javascript-state-machine';

/**
 * Finite state machine describing clientside game state
 *
 * @public
 */
let GameState = StateMachine.create(
{
	initial: 'disconnected',
	events: [
	{
		name: 'connect',
		from: 'disconnected',
		to: 'connected'
	},
	{
		name: 'disconnect',
		from: [ 'disconnected', 'connected', 'loaded', 'playing', 'paused' ],
		to: 'disconnected'
	},
	{
		name: 'load',
		from: 'connected',
		to: 'loaded'
	},
	{
		name: 'play',
		from: 'loaded',
		to: 'playing'
	},
	{
		name: 'pause',
		from: 'playing',
		to: 'paused'
	},
	{
		name: 'quit',
		from: [ 'loading', 'playing', 'paused' ],
		to: 'connected'
	} ]
} );

/**
 * Adds event listeners to game state changes
 *
 * @public
 * @param {String} eventName - Event to listen for
 * @param {Function} callbackFunction - Listener function to call when the event occurs
 */
GameState.addEventListener = function ( eventName, callbackFunction )
{
	// Keep an array of each listener for an event
	let eventListenersName = eventName + 'listeners';
	if ( this[ eventListenersName ] )
	{
		this[ eventListenersName ].push( callbackFunction );
	}
	else
	{
		this[ eventListenersName ] = [ callbackFunction ];
	}

	let oneventName = 'on' + eventName;
	if ( !this[ oneventName ] )
	{
		// Create the event listener for the event
		this[ oneventName ] = function ( data )
		{
			// Loop through and call each listener
			for ( var listener of this[ eventListenersName ] )
			{
				listener( data );
			}
		};
	}
};

export default GameState;