#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { createCaseExport } from './export.js';
import { verifyCaseExportBytes } from './round-trip.js';
import {
  PACKET_TRUST_FLAGS,
  packetVerificationOptions,
  parseOptions,
} from './cli-options.js';

async function main() {
  const options = parseOptions(process.argv.slice(2), {
    '--packet': { name: 'packet', required: true },
    '--out': { name: 'out', required: true },
    '--report-out': { name: 'reportOut' },
    ...PACKET_TRUST_FLAGS,
  });
  const verificationOptions = await packetVerificationOptions(options);
  const packetBytes = await readFile(options.packet);
  const exported = await createCaseExport({
    packetBytes,
    verificationOptions,
  });
  await writeFile(options.out, exported.jsonBytes, { flag: 'wx' });
  const verified = await verifyCaseExportBytes(exported.jsonBytes, {
    verificationOptions,
  });
  const report = {
    schema: 'scopa.case-export-generation.v1',
    ok: true,
    caseOntologyVersion: verified.caseOntologyVersion,
    caseUtilsVersion: verified.caseUtilsVersion,
    exportPath: options.out,
    nativePacketSha256: verified.nativePacketSha256,
    graph: verified.graph,
    packet: {
      chainLength: verified.packetVerification.chain.length,
      chainRootHash: verified.packetVerification.chain.rootHash,
      signatureAlgorithm: verified.packetVerification.signature.algorithm,
      signatureKeyId: verified.packetVerification.signature.keyId,
      timestampAuthorityId:
        verified.packetVerification.timestamp?.authorityId ?? null,
    },
    claim: verified.claim,
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
