import { spawn } from 'node:child_process';

const mode = process.argv[2];
const descendant = spawn(
  process.execPath,
  [
    '-e',
    "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 10_000)",
  ],
  { stdio: ['ignore', 'pipe', 'ignore'] },
);

await new Promise((resolve, reject) => {
  descendant.stdout.once('data', resolve);
  descendant.once('error', reject);
});
descendant.stdout.destroy();
process.stdout.write(`descendant=${descendant.pid}\n`);

if (mode === 'timeout') {
  setInterval(() => {}, 10_000);
} else if (mode === 'output') {
  process.stdout.write('x'.repeat(80 * 1024));
  setInterval(() => {}, 10_000);
} else if (mode === 'orphan') {
  descendant.unref();
  process.exit(0);
} else {
  process.stderr.write(`unknown fixture mode: ${mode}\n`);
  process.exit(2);
}
