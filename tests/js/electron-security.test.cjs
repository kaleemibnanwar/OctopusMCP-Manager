const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..', '..');

test('Electron loads the built React app without a UI web server', () => {
  const source = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  assert.match(source, /loadFile\(.*dist.*index\.html/);
  assert.doesNotMatch(source, /loadURL\(/);
});

test('renderer has an isolated preload boundary', () => {
  const source = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  assert.match(source, /contextIsolation:\s*true/);
  assert.match(source, /nodeIntegration:\s*false/);
  assert.match(source, /sandbox:\s*true/);
});

test('production build injects a content security policy', () => {
  const config = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /script-src 'self'/);
  assert.match(config, /object-src 'none'/);
});

test('the app owns its title bar and window controls', () => {
  const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  const titleBar = fs.readFileSync(path.join(root, 'src', 'components', 'layout', 'TitleBar.tsx'), 'utf8');
  assert.match(main, /frame:\s*false/);
  assert.match(main, /window:minimize/);
  assert.match(main, /window:toggle-maximize/);
  assert.match(main, /window:close/);
  assert.match(titleBar, /data-window="close"/);
  assert.match(titleBar, /WebkitAppRegion: "drag"/);
});
