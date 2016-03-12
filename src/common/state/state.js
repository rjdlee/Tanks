import StateMachine from 'javascript-state-machine';

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

GameState.addEventListener = function ( event_name, callback_function )
{
	let event_listeners_name = event_name + 'listeners';
	if ( this[ event_listeners_name ] )
	{
		this[ event_listeners_name ].push( callback_function );
	}
	else
	{
		this[ event_listeners_name ] = [ callback_function ];
	}

	let onevent_name = 'on' + event_name;
	if ( !this[ onevent_name ] )
	{
		this[ onevent_name ] = function ( data )
		{
			for ( var listener of this[ event_listeners_name ] )
			{
				listener( data );
			}
		};
	}
};

export default GameState;