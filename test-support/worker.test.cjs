const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const {setTimeout: delay} = require('node:timers/promises');
const WebSocket = require('ws');

test('Cloudflare runtime serves the game and synchronizes real WebSocket clients', {timeout: 60000}, async t => {
  const reserve = net.createServer();
  reserve.listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = reserve.address().port;
  await new Promise(resolve => reserve.close(resolve));
  const origin = 'http://127.0.0.1:' + port;
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tanks-worker-'));
  const clients = [];
  const worker = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js',
    'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0',
    '--persist-to', path.join(scratch, 'state'), '--show-interactive-dev-session', 'false'], {
    cwd: path.resolve(__dirname, '..'),
    env: {...process.env, XDG_CONFIG_HOME: scratch, WRANGLER_SEND_METRICS: 'false'},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  worker.stdout.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
  worker.stderr.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
  t.after(async () => {
    clients.forEach(client => client.ws.terminate());
    if (worker.exitCode === null) {
      const exited = once(worker, 'exit');
      worker.kill('SIGTERM');
      const kill = setTimeout(() => worker.kill('SIGKILL'), 4000);
      await exited;
      clearTimeout(kill);
    }
    fs.rmSync(scratch, {recursive: true, force: true});
  });
  const deadline = Date.now() + 45000;
  while (true) {
    assert.equal(worker.exitCode, null, logs);
    try {
      if ((await fetch(origin + '/healthz', {signal: AbortSignal.timeout(500)})).ok) break;
    } catch (error) {}
    assert.ok(Date.now() < deadline, logs);
    await delay(100);
  }

  function connect(headers = {Origin: origin}) {
    const ws = new WebSocket(origin.replace('http:', 'ws:') + '/ws', {headers});
    const events = [];
    ws.on('message', message => events.push(JSON.parse(String(message))));
    ws.on('error', () => {});
    const client = {
      ws,
      send: (event, data) => ws.send(JSON.stringify({event, data})),
      async wait(event, predicate = () => true) {
        const until = Date.now() + 3000;
        while (Date.now() < until) {
          const index = events.findIndex(packet => packet.event === event && predicate(packet.data));
          if (index !== -1) return events.splice(index, 1)[0].data;
          await delay(10);
        }
        assert.fail('Timed out waiting for ' + event + '\n' + logs);
      }
    };
    clients.push(client);
    return client;
  }

  await t.test('serves production assets and excludes source and tests', async () => {
    assert.deepEqual(await (await fetch(origin + '/healthz')).json(), {status: 'ok'});
    assert.match(await (await fetch(origin)).text(), /socket\.js/);
    assert.equal((await fetch(origin + '/socket.js')).status, 200);
    assert.equal((await fetch(origin + '/vector2.js')).status, 200);
    for (const route of ['/server/main.js', '/synchronization.test.js', '/package.json', '/.dev.vars']) {
      assert.equal((await fetch(origin + route)).status, 404, route);
    }
    assert.equal((await fetch(origin + '/ws')).status, 426);
    const blocked = connect({Origin: 'https://unrelated.example'});
    const [, response] = await once(blocked.ws, 'unexpected-response');
    assert.equal(response.statusCode, 403);
    blocked.ws.terminate();
  });

  const a = connect(), b = connect();
  const ai = await a.wait('init'), bi = await b.wait('init');
  await t.test('shares a match, acknowledges inputs, and confirms each action once', async () => {
    assert.notEqual(ai.id, bi.id);
    assert.deepEqual(ai.walls, bi.walls);
    a.send('init', 'Player A');
    a.send('e', {seq: 1, generation: 0, pos: {x: 350, y: 400},
      actions: [{id: 1, kind: 'mine'}, {id: 2, kind: 'mine'}, {id: 3, kind: 'mine'}]});
    const state = await a.wait('e', packet => packet.players[ai.id]?.ack === 1);
    assert.deepEqual(state.players[ai.id].pos, {x: 350, y: 400});
    const actions = state.players[ai.id].actions;
    assert.equal(actions.length, 3);
    assert.ok(actions[0].object && actions[1].object);
    assert.equal(actions[2].object, null);
    const peer = await b.wait('e', packet => packet.players[ai.id]?.ack === 1);
    assert.deepEqual(peer, state);
    const late = connect();
    const initial = await late.wait('init');
    assert.equal(Object.keys(initial.mines).length, 2);
    assert.ok(initial.players[ai.id] && initial.players[bi.id]);
    a.send('_ping');
    await a.wait('_pong');

    // Old packets cannot overwrite a newer input; duplicate actions in a new
    // packet cannot place additional mines or confirm the same action twice.
    a.send('e', {seq: 1, generation: 0, pos: {x: 0, y: 0}});
    a.send('e', {seq: 2, generation: 0, actions: [{id: 1, kind: 'mine'}]});
    const duplicate = await a.wait('e', packet => packet.players[ai.id]?.ack === 2);
    assert.deepEqual(duplicate.players[ai.id].pos, {x: 350, y: 400});
    assert.equal(duplicate.players[ai.id].actions, undefined);
  });

  await t.test('removes disconnected players and gives reconnects a fresh identity', async () => {
    a.ws.close();
    await b.wait('e', packet => packet.players[ai.id]?.disconnect);
    const rejoined = connect();
    const initial = await rejoined.wait('init');
    assert.notEqual(initial.id, ai.id);
    assert.equal(initial.players[ai.id], undefined);
    assert.ok(initial.players[bi.id]);
  });

  await t.test('bad JSON closes only the bad client and other players stay responsive', async () => {
    const invalid = connect();
    await invalid.wait('init');
    const closed = once(invalid.ws, 'close');
    invalid.ws.send('{');
    assert.equal((await closed)[0], 1007);
    b.send('e', {seq: 1, generation: 0, pos: {x: 600, y: 500}});
    const state = await b.wait('e', packet => packet.players[bi.id]?.ack === 1);
    assert.equal(state.players[bi.id].pos.x, 600);
  });
});
