const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'octopusmcp-manager',
    extraResource: [path.join(__dirname, 'dist-python', process.platform === 'win32' ? 'octopusmcp-backend.exe' : 'octopusmcp-backend')],
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: { name: 'octopusmcp_manager' } },
    { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
    { name: '@electron-forge/maker-deb', config: {} },
    { name: '@electron-forge/maker-rpm', config: {} },
  ],
};

