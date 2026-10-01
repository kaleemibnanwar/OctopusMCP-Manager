const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

let backend;
let nextRequestId = 1;
const pending = new Map();

function backendCommand() {
  if (app.isPackaged) {
    const executable = process.platform === 'win32' ? 'octopusmcp-backend.exe' : 'octopusmcp-backend';
    return { command: path.join(process.resourcesPath, executable), args: [] };
  }
  const python = process.platform === 'win32'
    ? path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', '.venv', 'bin', 'python');
  return { command: python, args: ['-m', 'octopusmcp.bridge'] };
}

function startBackend() {
  const target = backendCommand();
  backend = spawn(target.command, target.args, {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const lines = readline.createInterface({ input: backend.stdout });
  lines.on('line', (line) => {
    let response;
    try { response = JSON.parse(line); }
    catch { console.error('Invalid Python bridge response:', line); return; }
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    response.ok ? request.resolve(response.result) : request.reject(new Error(response.error?.message || 'Backend request failed'));
  });
  backend.stderr.on('data', (chunk) => console.error(`[python] ${chunk.toString().trimEnd()}`));
  backend.on('exit', (code) => {
    for (const request of pending.values()) request.reject(new Error(`Python backend stopped (${code})`));
    pending.clear();
    backend = undefined;
  });
}

function requestBackend(method, params = {}) {
  if (!backend?.stdin?.writable) return Promise.reject(new Error('Python backend is unavailable'));
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    backend.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#f6f8f5',
    title: 'OctopusMCP Manager',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.removeMenu();
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  ipcMain.handle('backend:request', (_event, method, params) => requestBackend(method, params));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (backend) backend.kill(); });

module.exports = { backendCommand };

