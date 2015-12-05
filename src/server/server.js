import express from 'express';
import socketIO from 'socket.io';
import Connect from './main';

let app = express();
let server = app.listen( 3000, '127.0.0.1', listen_handler );
let globalIO = socketIO( server );
let main = new Connect( globalIO );

app.use( express.static( __dirname + '/client' ) );

function listen_handler()
{
	console.log( 'Listening at http://%s:%s', server.address().address, server.address().port );
}