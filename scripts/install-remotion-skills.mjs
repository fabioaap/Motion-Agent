import {spawnSync} from 'node:child_process';

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(command, ['dlx', 'skills', 'add', 'remotion-dev/skills'], {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
