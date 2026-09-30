const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'build/assets');
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
// Shared browser modules use the same paths as local Express hosting. Never
// publish server code, tests, credentials, or node_modules as static assets.
for (const source of ['common', 'client']) {
  fs.cpSync(path.join(root, source), output, {
    recursive: true,
    filter: file => !/\.(test|spec)\.[cm]?js$/.test(file)
  });
}
console.log('Built browser assets in build/assets');
