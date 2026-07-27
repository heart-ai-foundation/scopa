#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { canonicalJsonPretty } from './canonical-json.js';
import { evaluateReplayEquivalence } from './replay-equivalence.js';
import { evaluateUntrustedDataContainment } from './untrusted-data-containment.js';
import {
  runSyntheticWorkflow,
  sequenceObserver,
} from '../../kernel-core/src/synthetic-workflow.js';

async function fixture(relativePath) {
  const url = new URL(`../../../fixtures/${relativePath}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

async function replayProbe(mode) {
  const definition = await fixture(
    mode === 'clean'
      ? 'golden/replay-workflow.json'
      : 'faults/hidden-effect-workflow.json',
  );
  const liveHidden = structuredClone(definition.liveHidden ?? {});
  const replayHidden = structuredClone(definition.replayHidden ?? {});
  return evaluateReplayEquivalence({
    runLive: (context) =>
      runSyntheticWorkflow({
        plan: definition.plan,
        mode: 'live',
        observe: sequenceObserver(structuredClone(definition.observations)),
        observeHidden: sequenceObserver(liveHidden),
        onUnexpectedEffect: context.reportUnexpectedEffect,
      }),
    runReplay: (replaySource, context) =>
      runSyntheticWorkflow({
        plan: definition.plan,
        mode: 'replay',
        replaySource,
        observeHidden: sequenceObserver(replayHidden),
        onUnexpectedEffect: context.reportUnexpectedEffect,
      }),
  });
}

async function containmentProbe(mode) {
  return evaluateUntrustedDataContainment(
    await fixture(
      mode === 'clean'
        ? 'golden/untrusted-data-flow.json'
        : 'faults/instruction-leak-flow.json',
    ),
  );
}

async function main() {
  const [kind, mode] = process.argv.slice(2);
  if (!['replay', 'containment'].includes(kind) || !['clean', 'fault'].includes(mode)) {
    throw new Error('usage: probe.js <replay|containment> <clean|fault>');
  }

  const report =
    kind === 'replay' ? await replayProbe(mode) : await containmentProbe(mode);
  process.stdout.write(canonicalJsonPretty(report));
  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `${canonicalJsonPretty({
      schema: 'scopa.conformance.probe-error.v1',
      ok: false,
      code: error.code ?? 'SCOPA_PROBE_ERROR',
      message: error.message,
    })}`,
  );
  process.exitCode = 2;
});
