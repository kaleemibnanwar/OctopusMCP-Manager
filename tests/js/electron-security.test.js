const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..', '..');

test('Electron loads local files without a UI web server', () => {
  const source = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
  assert.match(source, /loadFile\(/);
  assert.doesNotMatch(source, /loadURL\(/);
  assert.doesNotMatch(source, /localhost:8765/);
});

test('renderer has an isolated preload boundary', () => {
  const source = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
  assert.match(source, /contextIsolation:\s*true/);
  assert.match(source, /nodeIntegration:\s*false/);
  assert.match(source, /sandbox:\s*true/);
});

test('renderer content security policy blocks network connections', () => {
  const html = fs.readFileSync(path.join(root, 'electron', 'renderer', 'index.html'), 'utf8');
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /script-src 'self'/);
});

test('the app owns its title bar and window controls', () => {
  const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'electron', 'renderer', 'index.html'), 'utf8');
  assert.match(main, /frame:\s*false/);
  assert.match(main, /window:minimize/);
  assert.match(main, /window:toggle-maximize/);
  assert.match(main, /window:close/);
  assert.match(html, /class="window-chrome"/);
  assert.match(html, /data-window="close"/);
});
