var express = require('express');
var app = express();
var port = Number(process.env.PORT || 8888);
var host = process.env.HOST || '0.0.0.0';
var server = app.listen(port, host, listenHandler);
var WebSocketServer = require('ws').WebSocketServer;
var hub = new (require('./socketHub'))();
var main = require('./main')(hub);
var rooms = new Map();
var webSockets = new WebSocketServer({noServer: true, maxPayload: 16384});
server.on('upgrade', function(request, socket, head) {
  var validOrigin = !request.headers.origin ||
    request.headers.origin === (request.socket.encrypted ? 'https://' : 'http://') + request.headers.host;
  var url = new URL(request.url, 'http://' + request.headers.host);
  var modern = url.searchParams.get('v') === '2', mode = url.searchParams.get('mode') === 'coop' ? 'coop' : 'pvp';
  var code = (url.searchParams.get('room') || 'public').toLowerCase(), roomHub = hub;
  if (modern && /^[a-z0-9-]{1,32}$/.test(code)) {
    var key = mode + ':' + code;
    if (!rooms.has(key)) {var newHub = new (require('./socketHub'))();rooms.set(key,{hub:newHub,game:require('./match')(newHub,mode)});}
    roomHub = rooms.get(key).hub;
  }
  if (url.pathname !== '/ws' || !validOrigin || !/^[a-z0-9-]{1,32}$/.test(code) || roomHub.clients.size >= (modern ? mode === 'coop' ? 2 : 8 : 32)) {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    return;
  }
  webSockets.handleUpgrade(request, socket, head, function(webSocket) {
    roomHub.add(webSocket, require('crypto').randomUUID());
  });
});

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
  hub.close();
  rooms.forEach(function(room) { room.game.stop();room.hub.close(); });
  server.close(function() { process.exit(0); });
  setTimeout(function() { process.exit(1); }, 10000).unref();
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

function listenHandler() {
  console.log('Listening at http://%s:%s', server.address().address, server.address().port);
}
