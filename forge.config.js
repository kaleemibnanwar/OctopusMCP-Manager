const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'octopusmcp-manager',
    ignore: [
      /^\/.venv/,
      /^\/tests/,
      /^\/build/,
      /^\/out/,
      /^\/dist-python/,
      /^\/.pytest_cache/,
    ],
    extraResource: [path.join(__dirname, 'dist-python', process.platform === 'win32' ? 'octopusmcp-backend.exe' : 'octopusmcp-backend')],
  },
  rebuildConfig: {},
  makers: process.platform === 'win32'
    ? [{ name: '@electron-forge/maker-squirrel', config: { name: 'octopusmcp_manager' } }]
    : process.platform === 'darwin'
      ? [{ name: '@electron-forge/maker-zip', config: {} }]
      : [{ name: '@electron-forge/maker-deb', config: {} }],
};
