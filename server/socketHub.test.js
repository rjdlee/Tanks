const SocketHub = require('./socketHub');
const createGame = require('./main');

function webSocket() {
  const handlers = {}, sent = [];
  return {
    sent,
    addEventListener: (event, handler) => { handlers[event] = handler; },
    send: data => sent.push(JSON.parse(data)),
    close: () => handlers.close(),
    receive: data => handlers.message({data: data}),
    lost: () => handlers.close()
  };
}

it('stops all simulation and heartbeat timers when the last player leaves and restarts on rejoin', () => {
  const originalMap = global.Map;
  let now = 1000, nextTimer = 0;
  const active = {};
  const interval = jest.spyOn(global, 'setInterval').mockImplementation((callback, ms) => {
    active[++nextTimer] = {callback, ms};
    return nextTimer;
  });
  const clear = jest.spyOn(global, 'clearInterval').mockImplementation(id => { delete active[id]; });
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  const hub = new SocketHub();
  const game = createGame(hub);
  try {
    expect(global.Map).toBe(originalMap);
    expect(Object.keys(active)).toHaveLength(0);
    const a = webSocket();
    hub.add(a, 'a');
    expect(Object.keys(active)).toHaveLength(3);
    a.receive(JSON.stringify({event: 'e', data: {seq: 1, generation: 0, actions: [{id: 1, kind: 'mine'}]}}));
    expect(Object.keys(game.map.mines)).toHaveLength(1);
    a.lost();
    a.lost(); // Duplicate close notification is harmless.
    expect(Object.keys(active)).toHaveLength(0);
    expect(Object.keys(game.map.players)).toHaveLength(0);
    expect(Object.keys(game.map.mines)).toHaveLength(0);
    now += 60000;
    const b = webSocket();
    hub.add(b, 'b');
    expect(Object.keys(active)).toHaveLength(3);
    expect(b.sent[0].data.players.a).toBeUndefined();
    now += 46000;
    Object.values(active).find(timer => timer.ms === 15000).callback();
    expect(hub.clients.size).toBe(0);
    expect(Object.keys(active)).toHaveLength(0);
  } finally {
    hub.close();
    game.stop();
    interval.mockRestore(); clear.mockRestore(); clock.mockRestore();
  }
});
