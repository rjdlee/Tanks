var express = require('express');
var app = express();
var port = Number(process.env.PORT || 8888);
var host = process.env.HOST || '0.0.0.0';
var server = app.listen(port, host, listenHandler);
var io = require('socket.io')(server);
var main = require('./main')(io);

app.disable('x-powered-by');

app.get('/healthz', function(req, res) {
  res.status(200).json({status: 'ok'});
});

// Serve client files (images, css, html, js files)
app.use('/', express.static(__dirname + '/../client'));
app.use('/', express.static(__dirname + '/../common'));

// Hosting platforms send SIGTERM before a restart or deployment. Close sockets
// so clients reconnect immediately instead of waiting for a heartbeat timeout.
function shutdown() {
  main.stop();
  io.close(function() { process.exit(0); });
  setTimeout(function() { process.exit(1); }, 10000).unref();
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

function listenHandler() {
  console.log('Listening at http://%s:%s', server.address().address, server.address().port);
}
