#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { verifyEvidencePacket } from './packet.js';

function argumentsFrom(argv) {
  const options = {
    packet: null,
    report: null,
    requireTimestamp: false,
    roots: null,
    timestampAuthorityId: null,
    timestampSignerSha256: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--packet') options.packet = argv[++index];
    else if (argv[index] === '--timestamp-roots') options.roots = argv[++index];
    else if (argv[index] === '--report-out') options.report = argv[++index];
    else if (argv[index] === '--require-timestamp') options.requireTimestamp = true;
    else if (argv[index] === '--timestamp-authority-id') {
      options.timestampAuthorityId = argv[++index];
    }
    else if (argv[index] === '--timestamp-signer-sha256') {
      options.timestampSignerSha256 = argv[++index];
    }
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  if (!options.packet) throw new Error('--packet is required');
  return options;
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  const packet = JSON.parse(await readFile(options.packet, 'utf8'));
  const trustedTimestampRootsPem = options.roots
    ? await readFile(options.roots, 'utf8')
    : undefined;
  const report = await verifyEvidencePacket(packet, {
    expectedTimestampAuthorityId: options.timestampAuthorityId ?? undefined,
    expectedTimestampSignerSha256: options.timestampSignerSha256 ?? undefined,
    requireTimestamp: options.requireTimestamp,
    trustedTimestampRootsPem,
  });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (options.report) await writeFile(options.report, output);
  process.stdout.write(output);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
