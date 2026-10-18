import { spawnSync } from 'node:child_process';

export function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
