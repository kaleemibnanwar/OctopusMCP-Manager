import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const executable = process.platform === 'win32'
  ? join(root, '.venv', 'Scripts', 'pyinstaller.exe')
  : join(root, '.venv', 'bin', 'pyinstaller');

if (!existsSync(executable)) {
  console.error('PyInstaller is missing. Install Python development dependencies first.');
  process.exit(1);
}

mkdirSync(join(root, 'dist-python'), { recursive: true });
const separator = process.platform === 'win32' ? ';' : ':';
const result = spawnSync(executable, [
  '--noconfirm',
  '--clean',
  '--onefile',
  '--name', 'octopusmcp-backend',
  '--distpath', join(root, 'dist-python'),
  '--workpath', join(root, 'build', 'pyinstaller'),
  '--specpath', join(root, 'build'),
  '--add-data', `${join(root, 'catalog')}${separator}catalog`,
  join(root, 'scripts', 'backend_entry.py'),
], { cwd: root, stdio: 'inherit' });

process.exit(result.status ?? 1);

