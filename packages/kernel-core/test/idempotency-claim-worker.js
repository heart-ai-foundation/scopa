import { appendFile } from 'node:fs/promises';
import {
  PendingActError,
  PersistentIdempotencyLedger,
} from '../src/idempotency.js';

const [root, actionFile, key, descriptorHash] = process.argv.slice(2);
const ledger = new PersistentIdempotencyLedger(root);

try {
  await ledger.claim(key, descriptorHash);
  await appendFile(actionFile, `${process.pid}\n`, { flag: 'a' });
  process.stdout.write('claimed\n');
} catch (error) {
  if (!(error instanceof PendingActError)) throw error;
  process.stdout.write('pending\n');
}
