const childProcess = require('child_process');
const path = require('path');

it('acknowledges inputs, deduplicates actions, restores late joiners, and isolates respawn generations', () => {
  // The legacy shared-class loader replaces global Map; isolate it from Jest.
  const result = childProcess.execFileSync(process.execPath,
    [path.join(__dirname, '../test-support/server-sync.cjs')], {encoding: 'utf8', timeout: 10000});
  expect(result.trim()).toBe('protocol passed');
});
