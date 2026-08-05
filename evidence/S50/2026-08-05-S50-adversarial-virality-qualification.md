# S50 adversarial virality qualification evidence

## Decision

**QUALIFIED PROVIDER-OFF. RELEASE REMAINS CLOSED.**

Phase 14's changed packed bytes passed the hostile case that motivated the arc.
This is an implementation qualification, not authorization to publish, merge,
release, announce, or execute provider calls.

## Exact candidate

| Property | Value |
| --- | --- |
| Package identity | `@heart-ai-foundation/scopa@0.4.0` candidate bytes |
| Packed bytes | `2,031,371` |
| Unpacked bytes | `8,770,047` |
| Packed entries | `1,146` |
| SHA-256 | `1c5bbb22c8ad065e1ead4292c9d10174680081041f5a907e0a39dbfdddd89f41` |

The tarball was installed offline without lifecycle scripts into an isolated
tool root. Every tested runtime and module path resolved under that installed
package. The temporary candidate was deleted after hashing.

## Credibility exposure reproduction

The installed harness created a real tracked `package.json`, locked the task to
`src/**`, declared `changing dependencies` as a non-goal, passed its real gate,
then modified the manifest through a native route. Installed output proved:

- `observed.versionControlledChanges = 1`;
- `observed.outsideAllowedPaths = 1`;
- `observed.declaredNonGoalContacts = 1`;
- canonical `completion.status = satisfied` and `canStop = true`;
- terminal and PR headline `SATISFIED — WITH UNVERIFIED CHANGES`; and
- badge `PARTIAL · ACTIVE UNCONTROLLED ROUTE` with `1 OUTSIDE · 1 NON-GOAL
  CONTACTS OBSERVED`.

No projection contained `package.json`, the non-goal text, the temporary or
target root, or raw Git output. Observation remained reporting-only.

## Cold first contact

The first CLI invocation came from the offline installed tarball in a clean
marker-free repository. It returned the human `SCOPA boundary snapshot`, made
no repository change, and stayed below the 30-second regression ceiling. The
next cold preview selected the generic `.agents/skills/scopa/SKILL.md` target
and also left the repository unchanged. The complete installed hostile test
ran in approximately 3.34 seconds on this qualification host; this is not a
universal performance benchmark.

## Immutable public baseline

The local annotated `v0.4.0` tag resolves to
`4643cb342e4de3a8641476e0b171139e08f16620`. The four retained S44 baseline
envelopes match the exact SHA-256 values in
`fixtures/S50/public-0.4.0-baseline.json` and remain valid
`scopa.cli-result.v1` documents. Those bytes are compatibility evidence only;
they do not qualify the changed candidate.

## Permanent gate

Root `npm test` now includes S45, S46, S47, S48, S49, and S50. The full run
exited 0. Its core release gate recorded 370 assertions: 369 passed, one
intentional skip, and zero failures. Every named accumulated provider-off gate
and all 38 documentation files passed.

No provider call, experiment, network dependency, release, publication, tag,
merge, announcement, repository setting, telemetry, or external-system action
occurred.
