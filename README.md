# Tank Time

Multiplayer tanks with instant local controls and a shared WebSocket match.

## Run locally

Use Node.js 24 and run `npm ci`.

- `npm run dev` starts the Cloudflare Workers runtime at `http://localhost:8787`.
- `npm start` runs the same game server in Node at `http://localhost:8888`.
- `npm test -- --runInBand` runs physics and synchronization regressions.
- `npm run test:worker` starts an isolated local Cloudflare runtime and tests
  real multiplayer WebSockets, production assets, late joins, and reconnects.

## Free hosting

Cloudflare Workers serves both the website and `/ws` on one HTTPS origin. A
SQLite-backed Durable Object binding routes every player to the same match.
This uses the **Workers Free** plan; no paid subscription, external database,
domain purchase, or app secrets are required. The SQLite migration is required
for free-tier eligibility, even though live match state stays in memory.

[Deploy the prepared branch to Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Frjdlee%2FTanks%2Ftree%2Fcodex%2Ftanks-free-hosting)

The deploy flow asks you to sign in, authorize GitHub, and choose a repository
and Worker name. It clones the prepared source into that repository and
provisions the Durable Object automatically. Keep the account on Workers Free.

To use the existing repository instead, connect `rjdlee/Tanks` in Cloudflare's
Workers Git integration, name the Worker `tank-time`, leave the root directory
at `/`, and use `npm run build` and `npm run deploy` for the build and deploy
commands. Keep preview builds off. If setup starts with the repository's default
branch, cancel that initial build and set **Settings > Builds > Branch control >
Production branch** to `codex/tanks-free-hosting`, then save. Push a commit to
that branch to start a fresh production build; retrying an older build retains
its original branch.

Wrangler also builds browser assets automatically. Alternatively, from an
authenticated terminal run `npx wrangler login` followed by `npm run deploy`.

Cloudflare provides the final `https://<worker>.<account>.workers.dev` address.
Open it in two browsers and press Play; `/healthz` returns `{"status":"ok"}`.
Always deploy frontend and backend together.

The shared public match supports up to 32 simultaneous connections. Simulation
and heartbeat timers stop when the match is empty. Silent connections expire
after 45 seconds. Live matches and scores can reset on deployment or runtime
restart; clients reconnect automatically and receive a fresh snapshot.

Free hosting has daily request and compute limits. Exceeding them can interrupt
play until the quota resets; this configuration does not upgrade the account.
See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
and [Durable Objects free limits](https://developers.cloudflare.com/durable-objects/platform/pricing/).

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
