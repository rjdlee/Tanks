import express from 'express';
import socketIO from 'socket.io';
import ServerConnect from './connect';
import Main from './main';

var app = express();
var server = app.listen( 3000, '127.0.0.1', listen_handler );
var global_io = socketIO( server );
var server_connect = new ServerConnect( global_io );
var main = new Main( server_connect, global_io );

// Serve clientside files (images, css, html, js files)
app.use( express.static( __dirname + '/client' ) );

function listen_handler()
{
	console.log( 'Listening at http://%s:%s', server.address().address, server.address().port );
}