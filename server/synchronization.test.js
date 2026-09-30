const childProcess = require('child_process');
const path = require('path');

it('acknowledges inputs, deduplicates actions, restores late joiners, and isolates respawn generations', () => {
  // Isolate the deterministic clock and timer replacements from Jest.
  const result = childProcess.execFileSync(process.execPath,
    [path.join(__dirname, '../test-support/server-sync.cjs')], {encoding: 'utf8', timeout: 10000});
  expect(result.trim()).toBe('protocol passed');
});
