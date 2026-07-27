import { readFile } from 'node:fs/promises';
import { InteropVerificationError } from './schema.js';

export function parseOptions(argv, specification) {
  const options = {};
  const booleanFlags = new Set(
    Object.entries(specification)
      .filter(([, config]) => config.boolean)
      .map(([flag]) => flag),
  );
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const config = specification[flag];
    if (!config) {
      throw new InteropVerificationError(`unknown argument: ${flag}`);
    }
    if (booleanFlags.has(flag)) {
      options[config.name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new InteropVerificationError(`${flag} requires a value`);
    }
    if (Object.hasOwn(options, config.name)) {
      throw new InteropVerificationError(`duplicate argument: ${flag}`);
    }
    options[config.name] = value;
    index += 1;
  }
  for (const [flag, config] of Object.entries(specification)) {
    if (config.required && options[config.name] === undefined) {
      throw new InteropVerificationError(`missing required argument: ${flag}`);
    }
  }
  return options;
}

export async function packetVerificationOptions(options) {
  return {
    trustedTimestampRootsPem: options.timestampRoots
      ? await readFile(options.timestampRoots, 'utf8')
      : undefined,
    requireTimestamp: Boolean(options.requireTimestamp),
    expectedTimestampAuthorityId: options.timestampAuthorityId,
    expectedTimestampSignerSha256: options.timestampSignerSha256,
  };
}

export const PACKET_TRUST_FLAGS = Object.freeze({
  '--timestamp-roots': { name: 'timestampRoots' },
  '--timestamp-authority-id': { name: 'timestampAuthorityId' },
  '--timestamp-signer-sha256': { name: 'timestampSignerSha256' },
  '--require-timestamp': { name: 'requireTimestamp', boolean: true },
});
