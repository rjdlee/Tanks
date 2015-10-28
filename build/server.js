var express = require( 'express' ),
	app = express(),
	server = app.listen( 3000, '127.0.0.1', function ()
	{
		console.log( 'Listening at http://%s:%s', server.address().address, server.address().port );
	} );
global.io = require( 'socket.io' )( server );
var main = require( './server_src' );

app.use( express.static( __dirname + '/client' ) );