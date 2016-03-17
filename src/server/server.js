import express from 'express';
import socketIO from 'socket.io';
import ServerConnect from './connect';
import Main from './main';

var app = express();
var server = app.listen( 3000, '127.0.0.1', listenHandler );
var globalIo = socketIO( server );
var serverConnect = new ServerConnect( globalIo );
var main = new Main( serverConnect, globalIo );

// Serve clientside files (images, css, html, js files)
app.use( express.static( __dirname + '/client' ) );

function listenHandler()
{
	console.log( 'Listening at http://%s:%s', server.address().address, server.address().port );
}