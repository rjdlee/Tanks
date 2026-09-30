import createGame from '../server/main.js';
import SocketHub from '../server/socketHub.js';

// A stable Durable Object ID routes every player to the same live match.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/healthz') return Response.json({status: 'ok'});
    if (url.pathname !== '/ws') return env.ASSETS.fetch(request);
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket connection required', {status: 426});
    }
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return new Response('Origin not allowed', {status: 403});
    const id = env.GAME.idFromName('tanks-public-v1');
    return env.GAME.get(id).fetch(request);
  }
};

export class GameRoom {
  constructor() {
    this.hub = new SocketHub();
    this.game = null;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket connection required', {status: 426});
    }
    if (this.hub.clients.size >= 32) return new Response('Match is full', {status: 503});
    // Construct the simulation in a request context. No timers run while empty.
    if (!this.game) this.game = createGame(this.hub);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.hub.add(server, crypto.randomUUID());
    return new Response(null, {status: 101, webSocket: client});
  }
}
