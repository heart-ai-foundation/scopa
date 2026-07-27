# S0 Conformance Harness Decisions

**Slice:** S0
**Date:** 2026-07-26 America/Los_Angeles

## Decisions

### Keep S0 dependency-free

The property checks use a small seeded generator built on Node.js rather than a
third-party property-testing dependency. The seed and case count are explicit,
so failures are reproducible and the first conformance gate adds no supply-chain
surface.

### Compare live output with replay from the captured journal

The replay harness executes a live synthetic workflow, clones its captured
journal, replays from that journal, and compares output, emitted values, exact
journal consumption, and journal immutability. A hidden observation that affects
the result creates a structured `SCOPA_REPLAY_DIVERGENCE`.

### Model containment as provenance, not text filtering

The containment harness tracks trusted, untrusted, and derived nodes. It permits
untrusted content in an `INFER` data channel and rejects any untrusted provenance
in an instruction channel. This avoids pretending that keyword scanning is an
authority boundary.

### Keep the kernel seam synthetic

`packages/kernel-core/src/synthetic-workflow.js` exists only to exercise the S0
contracts. It is not the S1 core, journal, persistence adapter, or execution
loop. Its vocabulary is deliberately small and fixture-oriented.

### Fail closed on malformed evidence

Replay rejects journal entries that do not match the planned effect. Containment
uses closed node and INFER-call schemas and rejects unknown fields, missing
provenance, duplicate nodes or calls, invalid node kinds, provenance laundering,
and provenance cycles.

### Make the release gate executable

The root gate enumerates the current conformance test files, executes them, then
spawns clean and injected-fault probes as separate processes. It succeeds only
when clean probes exit `0` with `ok: true` and fault probes exit `1` with
`ok: false`.

## Generated coverage

- 256 seeded replay workflows.
- 256 seeded provenance DAGs.
- Clean replay and containment golden fixtures.
- Hidden-effect and derived-instruction-leak fault fixtures.
- Date divergence, spoofed journal-consumption, cancelling hidden-effect,
  provenance-laundering, alternate-field, and duplicate-call regressions.

The count describes observed generated paths, not exhaustive state-space
coverage.

## Surprise

The first focused test run correctly rejected an incorrect expected SHA-256
digest in the clean replay baseline. The implementation produced a stable digest
of `971f7d8618808060fff500a786c67f1b9c53eca3e9680593e73d067a8012d601`;
the mistaken test expectation was corrected and the full gate was rerun.

An independent `gpt-5.6-terra` adversarial review found that ordinary object
comparison missed distinct `Date` values, replay consumption could be
self-reported, cancelling hidden effects could disappear, and provenance
records accepted undeclared semantic fields. The harness now owns the replay
cursor, compares dates by value, records declared escaped effects, and validates
closed record schemas. The review also caused the root release gate to be
replaced with an executable multi-process gate.

## Ruled out

- A third-party property-testing library in S0.
- Prompt-text scanning as an injection defense.
- Treating an expected-failure probe as a failing release suite. The release
  suite passes only when it proves the fault probe exits non-zero for the
  expected structured finding.
- Building serialization, sealed journaling, SES lockdown, or persistence ahead
  of S1.

## Non-goals preserved

- No production agent enforcement.
- No journal, signing, anchoring, provider, or CASE/UCO implementation.
- No new effect categories.
- No npm publication or public release.
- No queue entry outside the canonical Macro Delta.

## Coverage boundary

S0 proves that these harnesses detect the declared synthetic faults. It does not
yet prove that all real runtime effects are intercepted, or that every future
transformation preserves provenance. Those claims require S1 implementation and
S2 live-agent evidence.

In particular, an effect deliberately hidden from both the journal and the
synthetic `reportUnexpectedEffect` seam is outside S0's claim. S1 must remove
ambient authority under lockdown; S2 must prove the boundary in a live agent
session.
