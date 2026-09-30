# tanks
Multiplayer tanks game

https://tank.rjdlee.com

Run the game with `node server/server.js` and open `http://localhost:8888`.
Run the regression suite with `npm test -- --runInBand`.

## Free hosting

`render.yaml` defines a single Render **Free** web service for both the browser
game and its Socket.IO backend. Keeping them on the same HTTPS origin avoids a
second hosting account and cross-origin multiplayer configuration.

The service installs with `npm ci --omit=dev`, starts with `npm start`, and checks
`/healthz`. It listens on Render's `PORT` on `0.0.0.0`; local development defaults
to port 8888. Render supplies HTTPS and forwards WebSocket connections.

Use one instance: matches and scores live in process memory and reset when the
service restarts. Free instances can sleep while idle and have usage limits;
the first visit after sleep may need time to start. See
[Render's free-service limits](https://render.com/docs/free) and
[WebSocket hosting](https://render.com/docs/websocket). Do not upgrade to a paid
instance to bypass a free-tier limit without the owner's approval.

Automatic deployment is disabled in the Blueprint so unrelated repository
changes do not restart an active game. Deploy frontend and backend together.

## Multiplayer synchronization

Multiplayer uses immediate local movement, aiming, shots, and mine placement.
Inputs carry sequence numbers; acknowledgments reconcile the corresponding
prediction without pulling newer movement back to an old server echo. Action
IDs match confirmed shots/mines to their predicted objects and remove rejected
ones. Respawn generations discard input still in flight from the previous life.

The simulation runs at 60 fixed steps per second, independently of display
refresh rate. The server batches updates at 20 Hz; remote tanks interpolate
over 50 ms and extrapolate for at most 100 ms during network jitter. Rendering
uses requestAnimationFrame, and reconnects dispose of old listeners and loops.

Deploy the frontend and server together and reload existing browser sessions:
the synchronization packet format has changed. Movement and hit detection
retain the game's existing client-reported model; this is not an anti-cheat
or fully server-authoritative physics implementation.
