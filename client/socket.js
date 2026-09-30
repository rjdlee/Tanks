// Reconnecting WebSocket transport. Game prediction remains in connect.js.
function GameSocket() {
  this.handlers = {};
  this.connected = false;
  this.retry = 0;
  this.connect();
}

GameSocket.prototype.on = function(event, handler) {
  (this.handlers[event] || (this.handlers[event] = [])).push(handler);
  return this;
};

GameSocket.prototype.listeners = function(event) {
  return (this.handlers[event] || []).slice();
};

GameSocket.prototype.removeListener = function(event, handler) {
  this.handlers[event] = this.listeners(event).filter(function(item) { return item !== handler; });
  return this;
};

GameSocket.prototype.dispatch = function(event, data) {
  this.listeners(event).forEach(function(handler) { handler(data); });
};

GameSocket.prototype.connect = function() {
  this.closed = false;
  clearTimeout(this.reconnectTimer);
  if (this.webSocket && this.webSocket.readyState < 2) return this;
  var socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  this.webSocket = socket;
  this.connectTimer = setTimeout(function() {
    if (this.webSocket === socket && !this.connected) socket.close();
  }.bind(this), 15000);
  socket.onopen = function() {
    if (this.webSocket !== socket) return;
    clearTimeout(this.connectTimer);
    this.connected = true;
    this.retry = 0;
    this.lastSeen = Date.now();
    this.heartbeat = setInterval(function() {
      if (Date.now() - this.lastSeen > 45000) return socket.close();
      this.emit('_ping');
    }.bind(this), 15000);
    this.dispatch('connect');
  }.bind(this);
  socket.onmessage = function(message) {
    if (this.webSocket !== socket) return;
    var packet;
    try { packet = JSON.parse(message.data); } catch (error) { return socket.close(); }
    if (!packet || typeof packet !== 'object') return socket.close();
    this.lastSeen = Date.now();
    if (packet.event === 'init' || packet.event === 'e') this.dispatch(packet.event, packet.data);
  }.bind(this);
  socket.onclose = function() {
    if (this.webSocket !== socket) return;
    clearTimeout(this.connectTimer);
    clearInterval(this.heartbeat);
    this.connected = false;
    this.webSocket = null;
    this.dispatch('disconnect');
    if (!this.closed) {
      var delay = Math.min(10000, 500 * Math.pow(2, this.retry++)) + Math.random() * 250;
      this.reconnectTimer = setTimeout(this.connect.bind(this), delay);
    }
  }.bind(this);
  return this;
};

GameSocket.prototype.emit = function(event, data) {
  if (!this.connected || !this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return this;
  // A stalled connection must rejoin with a fresh snapshot, not replay a
  // growing queue of old movement and shots when the network recovers.
  if (this.webSocket.bufferedAmount > 131072) { this.webSocket.close(); return this; }
  this.webSocket.send(JSON.stringify({event: event, data: data}));
  return this;
};

GameSocket.prototype.disconnect = GameSocket.prototype.close = function() {
  this.closed = true;
  clearTimeout(this.reconnectTimer);
  clearTimeout(this.connectTimer);
  clearInterval(this.heartbeat);
  var socket = this.webSocket;
  this.webSocket = null;
  this.connected = false;
  if (socket) socket.close();
  this.dispatch('disconnect');
  return this;
};
