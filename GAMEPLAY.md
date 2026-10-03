# Tank Time gameplay

The game has three separate modes:

- **Solo campaign:** local simulation, with no multiplayer connection required.
- **Online co-op:** two players share a campaign, mission, enemy roster, and lives.
- **Online PvP:** up to eight players, first to 10 kills or the highest score after three minutes. Deaths have a three-second respawn delay and a brief spawn shield, which firing removes.

Use WASD or arrows to drive in world directions and the mouse to aim independently. Click or hold to fire; Space or right-click drops a mine. Gamepads use the left stick to drive, the right stick to aim, and triggers to fire/drop a mine. Touch controls provide a direction pad and fire/mine buttons; tap the arena to aim. Solo supports Pause/P/Escape. Online help stops your input without pausing everyone else.

For online play, choose a mode and enter the same room code. Empty co-op codes create a new room; empty PvP codes join the public room. **Invite** copies a link with the selected mode and room. Both players must ready up to begin co-op. Co-op and PvP rooms have independent simulations and player limits. Reconnecting joins the same room with a fresh tank identity; co-op waits when a partner is missing.

## Combat and campaign

- One hit destroys a tank. Friendly fire and your own ricochets are dangerous.
- Players can have five live shells and two live mines. Slots return when an object expires. Previous-life objects remain in the world without taking the new life's ammunition slots.
- Standard shells bounce once. Teal/black rockets are faster and do not bounce. Green rockets bounce twice. Shells destroy one another; swept collision stops fast shells passing through walls.
- Pits block tanks and let shells pass overhead. Cork crates are destroyed by mines; solid blocks remain.
- Mines have a ten-second fuse. After arming, nearby tanks shorten the fuse; shell hits and explosions trigger them immediately. Explosions affect a radius of 85 world units and chain through nearby mines.
- Campaigns begin with three lives. Losing every human tank costs one life. Defeated enemies and destroyed cork remain defeated/destroyed on retry. A surviving co-op partner can clear the mission and revive both players for the next one. Every fifth clear grants an extra life.

Nine enemy roles have distinct movement, ammunition, firing cooldowns, aiming, and avoidance: brown, gray, teal, yellow, pink, green, purple, white, and black. Brown/green are stationary; yellow emphasizes mines; green plans bank shots; white hides its body but leaves tracks and reveals itself briefly on firing; black pursues quickly with rockets. Mobile enemies navigate around terrain and avoid incoming shells and mines.

## Reference fidelity

This is a **classic-style recreation, not a verified exact reproduction** of Wii Play Tanks. The campaign currently contains 20 authored reconstructed boards and 80 harder roster remixes. Original mission geometry, original rosters, unlock behavior, and exact frame timings still need comparison against verified footage/map data. The tank hull matches the current artwork, not a measured Wii collision model.

Exact original level matching is deferred at the user's request. The supplied reference is https://www.youtube.com/watch?v=orLxrg51xL8 and has not yet been inspected. No original game assets or third-party implementation code were imported.

Community recreation used to cross-check tank role differences and approximate parameters: https://github.com/RighteousRyan1/TanksRebirth . Campaign data lives in `common/missions.js`; rules in `common/rules.js`, so verified original data can replace the reconstructions without replacing the networking.

## Implementation and validation

`common/battle.js` runs locally for solo and authoritatively on the server for online play. Clients predict their own fixed input steps and actions immediately, replay unacknowledged steps after server snapshots, and interpolate other tanks. The server decides damage, deaths, scores, AI, terrain changes, and mission transitions. Old mission/life predictions cannot move a freshly spawned tank or create duplicate ammunition.

The current production branch is `codex/tanks-free-hosting`. Cloudflare routes `/ws?v=2&mode=coop|pvp&room=CODE` to an isolated Durable Object; the existing `/ws` protocol remains compatible with earlier clients. Node development supports the same routes.

Run `npm test -- --runInBand` for geometry, rules, AI, prediction, and protocol regressions; `npm run test:worker` verifies real WebSockets and room isolation in Cloudflare's local runtime. Browser verification covers mission play, death/retry, pause, delayed-network co-op, PvP kills/respawns, reconnection, and responsive controls.
