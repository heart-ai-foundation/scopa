#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { verifyCaseExportBytes } from './round-trip.js';
import {
  PACKET_TRUST_FLAGS,
  packetVerificationOptions,
  parseOptions,
} from './cli-options.js';

async function main() {
  const options = parseOptions(process.argv.slice(2), {
    '--export': { name: 'export', required: true },
    '--report-out': { name: 'reportOut' },
    ...PACKET_TRUST_FLAGS,
  });
  const verificationOptions = await packetVerificationOptions(options);
  const result = await verifyCaseExportBytes(
    await readFile(options.export),
    { verificationOptions },
  );
  const report = {
    schema: result.schema,
    ok: result.ok,
    caseOntologyVersion: result.caseOntologyVersion,
    caseUtilsVersion: result.caseUtilsVersion,
    nativePacketSha256: result.nativePacketSha256,
    graph: result.graph,
    packet: {
      chainLength: result.packetVerification.chain.length,
      chainRootHash: result.packetVerification.chain.rootHash,
      signatureAlgorithm: result.packetVerification.signature.algorithm,
      signatureKeyId: result.packetVerification.signature.keyId,
      timestampAuthorityId:
        result.packetVerification.timestamp?.authorityId ?? null,
    },
    exactNativePacketRecovered: true,
    claim: result.claim,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (options.reportOut) {
    await writeFile(options.reportOut, output, { flag: 'wx' });
  }
  process.stdout.write(output);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
