const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'soloman-manager',
    icon: path.join(__dirname, 'public', 'assets', 'logo'),
    ignore: [
      /^\/.github/,
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
    ? [{
        name: '@electron-forge/maker-squirrel',
        config: {
          name: 'soloman_manager',
          setupIcon: path.join(__dirname, 'public', 'assets', 'logo.ico'),
        },
      }, { name: '@electron-forge/maker-zip', config: {} }]
    : process.platform === 'darwin'
      ? [{ name: '@electron-forge/maker-zip', config: {} }]
      : [{
          name: '@electron-forge/maker-deb',
          config: {
            options: {
              name: 'soloman-manager',
              bin: 'soloman-manager',
              productName: 'Soloman Manager',
              genericName: 'Soloman Manager',
              icon: path.join(__dirname, 'public', 'assets', 'logo.png'),
              categories: ['Development', 'Utility'],
            },
          },
        }, { name: '@electron-forge/maker-zip', config: {} }],
};
