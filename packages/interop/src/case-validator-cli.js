#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import {
  CASE_ONTOLOGY_VERSION,
  CASE_UTILS_VERSION,
} from './export.js';
import { parseOptions } from './cli-options.js';
import { InteropVerificationError } from './schema.js';

async function main() {
  const options = parseOptions(process.argv.slice(2), {
    '--export': { name: 'export', required: true },
    '--case-validate-bin': { name: 'caseValidateBin' },
    '--report-out': { name: 'reportOut' },
    '--expect-invalid': { name: 'expectInvalid', boolean: true },
  });
  const binary =
    options.caseValidateBin ?? process.env.CASE_VALIDATE_BIN ?? 'case_validate';
  const result = spawnSync(
    binary,
    [
      '--built-version',
      `case-${CASE_ONTOLOGY_VERSION}`,
      options.export,
    ],
    {
      encoding: 'utf8',
      env: { ...process.env },
    },
  );
  if (result.error) throw result.error;
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  const conforms = /^Conforms:\s+True\s*$/m.test(result.stdout ?? '');
  const nonConforms = /^Conforms:\s+False\s*$/m.test(result.stdout ?? '');
  const expectedConforms = !options.expectInvalid;
  const matchedExpectation = expectedConforms
    ? result.status === 0 && conforms
    : result.status !== 0 && nonConforms;
  if (!matchedExpectation) {
    throw new InteropVerificationError(
      `external CASE validator did not produce expected conforms=${expectedConforms} with exit ${result.status}`,
    );
  }
  const report = {
    schema: 'scopa.external-case-validation.v1',
    ok: true,
    validator: 'case_validate',
    caseUtilsVersion: CASE_UTILS_VERSION,
    caseOntologyVersion: CASE_ONTOLOGY_VERSION,
    strictSeverityHandling: true,
    validatorExitCode: result.status,
    expectedConforms,
    conforms,
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
