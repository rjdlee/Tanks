// The game uses the same small event envelope in Node and Durable Objects.
// No Socket.IO runtime, Node globals, or dynamic code evaluation is required.
function SocketHub() {
  this.clients = new Map();
  this.connectionHandler = function() {};
  this.heartbeat = null;
  this.sockets = {emit: function(event, data) {
    this.clients.forEach(function(socket) { socket.emit(event, data); });
  }.bind(this)};
}

SocketHub.prototype.on = function(event, handler) {
  if (event === 'connection') this.connectionHandler = handler;
};

SocketHub.prototype.add = function(webSocket, id) {
  var hub = this, handlers = {}, finished = false;
  var windowStart = Date.now(), messages = 0;
  var socket = {
    id: id,
    lastSeen: Date.now(),
    on: function(event, handler) { handlers[event] = handler; },
    emit: function(event, data) {
      if (finished) return;
      try {
        if (webSocket.bufferedAmount > 131072) return socket.close(1013, 'Connection too slow');
        webSocket.send(JSON.stringify({event: event, data: data}));
      } catch (error) { socket.close(1011, 'Connection interrupted'); }
    },
    close: function(code, reason) {
      finish();
      try { webSocket.close(code || 1000, reason || ''); } catch (error) {}
    }
  };
  function finish() {
    if (finished) return;
    finished = true;
    hub.clients.delete(id);
    if (handlers.disconnect) handlers.disconnect();
    if (!hub.clients.size && hub.heartbeat !== null) {
      clearInterval(hub.heartbeat);
      hub.heartbeat = null;
    }
  }
  webSocket.addEventListener('message', function(message) {
    if (finished) return;
    if (typeof message.data !== 'string' || message.data.length > 16384) {
      return socket.close(1009, 'Message too large');
    }
    var now = Date.now();
    if (now - windowStart >= 1000) { windowStart = now; messages = 0; }
    if (++messages > 240) return socket.close(1008, 'Too many messages');
    var packet;
    try { packet = JSON.parse(message.data); } catch (error) {
      return socket.close(1007, 'Invalid JSON');
    }
    if (!packet || typeof packet !== 'object') return;
    socket.lastSeen = now;
    if (packet.event === '_ping') return socket.emit('_pong');
    if ((packet.event === 'init' || packet.event === 'e') && handlers[packet.event]) {
      handlers[packet.event](packet.data);
    }
  });
  webSocket.addEventListener('close', finish);
  webSocket.addEventListener('error', function() { socket.close(1011, 'Connection interrupted'); });
  this.clients.set(id, socket);
  if (this.heartbeat === null) {
    this.heartbeat = setInterval(function() {
      hub.clients.forEach(function(client) {
        if (Date.now() - client.lastSeen > 45000) client.close(1001, 'Connection timed out');
      });
    }, 15000);
  }
  this.connectionHandler(socket);
  return socket;
};

SocketHub.prototype.close = function() {
  this.clients.forEach(function(socket) { socket.close(1001, 'Server restarting'); });
};

module.exports = SocketHub;
