var express = require('express');
var app = express();
var server = app.listen(8888, '127.0.0.1', listenHandler);
var io = require('socket.io')(server);
var main = require('./main')(io);

app.use('/', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Serve client files (images, css, html, js files)
app.use('/', express.static(__dirname + '/../client'));
app.use('/', express.static(__dirname + '/../common'));
app.use('/', express.static(__dirname + '/../server/node_modules'));

function listenHandler() {
  console.log('Listening at http://%s:%s', server.address().address, server.address().port);
}
