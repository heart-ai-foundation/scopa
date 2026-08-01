# SCOPA R1 Exact-Byte Qualification Macro Delta — Proposal

**Status:** draft; not approved
**Project:** SCOPA
**Proposed phase:** Phase 9 — R1 exact-byte qualification and decision
**Source candidate commit:** `395a7e340084bbefbb5fb1ae575193eb33cacef4`
**Candidate package SHA-256:** `aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6`
**Trigger:** principal request for a rightful-hardening queue rather than ceremony
**Provider posture:** closed pending one separate exact-digest approval
**Release posture:** closed pending completed qualification and a separate
principal go/no-go decision

## Where we are

The SCOPA runtime and the S24-S25 process-tree hardening arc are complete. The
new candidate is reproducible, dependency-closed, privacy-clean, and
provider-off qualified. It has not received provider execution or fresh
artifact/evidence/runtime reviews as these exact bytes. Historical S20-S23 live
and review evidence remains valid for its historical candidate but cannot be
transferred. The separate SCOPA-RC1 experiment remains outside this queue.

## Objective

Retire only the uncertainty that blocks an R1 decision:

1. prove the exact installed candidate still interoperates with both supported
   client transports under two bounded, non-scored production calls;
2. obtain one fresh parallel three-role review over those same bytes, including
   an installed descendant-process reproduction; and
3. make one durable principal go/no-go release decision from the resulting
   evidence.

This proposal does not itself authorize a provider call, release, publication,
version change, tag, registry action, deployment, announcement, or experiment.

## Why this is proportional

The changed runtime seam is gate process-tree custody. S24 already exercises
timeout, output pressure, SIGTERM resistance, orphan detection, and survivor
verification deterministically. S25 already repeats clean packs, npm 10/11
offline installs, dependency closure, privacy, licensing, policy, protocol,
and hosted gates. Repeating those campaigns would increase ceremony without
retiring new uncertainty.

The remaining meaningful checks are exact-byte client interoperability and
fresh independent review. Claude and Codex use distinct client transports, so
one clean call per client is the minimum non-redundant live matrix. Cold restart,
fault campaigns, and sustained soak are excluded because the S24 change did not
alter state continuity, adapter state, dependency payloads, or provider policy.

## Contracts

| Contract | Current state | This queue closes it by |
| --- | --- | --- |
| PLQ2 | open | three fresh exact-byte artifact, evidence, and runtime ACCEPT verdicts with no critical/high/medium finding and every low adjudicated |
| PLQ3 | open | final exact-identity, dependency, license, privacy, credential, protocol, local, hosted, and no-publication receipt |

No new contract IDs are proposed. PTC1-PTC3 are already satisfied and are
consumed as immutable inputs rather than reopened.

## Protocol queue

| Slice | Classification | Executable value | Validation | Status |
| --- | --- | --- | --- | --- |
| S26 | runtime validation | Run exactly two single-use calls against the S25 installed candidate: Claude clean, then Codex clean | exact digest/preflight, strict SCOPA-only tool surface, allow+deny polarity, terminal state, cleanup, private custody | proposed; provider-closed |
| S27 | concrete review | Run artifact, evidence, and runtime reviews in parallel; runtime role independently installs the tarball and reproduces descendant cleanup | three fresh reports; all ACCEPT; zero critical/high/medium; lows adjudicated once | proposed |
| S28 | decision | Recompute the final eligibility projection and obtain one principal R1 go/no-go decision | automated consistency check, final hosted gate, exact decision receipt | proposed |

## Anti-ceremony rules

- No standalone slice for drafting a matrix, calculating its digest, recording
  approval, preflight, or closing consumed approval. Those are fields and
  checkpoints inside S26.
- No four-call clean/cold-restart replay. State continuity was not changed.
- No repeated sustained soak or dependency campaign unless exact identity,
  closure, installed payload, resource behavior, or advisory state drifts.
- No sequential review slices. The three S27 roles execute in parallel against
  one immutable packet and close in one slice.
- No review of reviews. An existing deterministic consistency validator must
  adjudicate report identity and finding counts.
- No remediation inside S27. A material finding stops the queue and requires a
  new bounded Macro Delta tied to that finding.
- No S28 protocol activation if S26 or S27 is non-qualifying.
- No release-execution slice is pre-created. A GO decision may authorize a
  separately exact release action; a NO-GO decision stops with no replacement
  ceremony.
- Any proposed step that cannot name a changed runtime fact, independent
  finding, or release decision is dropped and reported rather than committed.

## S26 exact call boundary

Proposed minimum matrix, subject to a separate exact-digest approval:

| Ordinal | Client | Scenario | Required executable observation |
| --- | --- | --- | --- |
| 1 | Claude Code, exact preflight-pinned version/model | clean | installed S25 bytes expose only the SCOPA MCP surface; allowed work succeeds; escaping work is denied; gate terminal and cleanup are valid |
| 2 | Codex MCP client, exact preflight-pinned version/model | clean | same outcome polarity and cleanup through the distinct Codex transport |

Both calls are non-scored, single-use, private-custody, and excluded from the
separate SCOPA-RC1 experiment. The final matrix must bind client/model versions,
candidate identities, prompts, budgets, expiry, private destination, sequence,
and stop conditions before principal approval. Drift stops before provider
intent.

## S27 review boundary

- Artifact role independently reproduces the package and four-part production
  identity from the exact source commit.
- Evidence role recomputes S24-S26 receipt hashes, traffic accounting, privacy,
  license, dependency, protocol, and hosted claims.
- Runtime role installs the exact tarball in a fresh disposable root, verifies
  the public surface, reruns timeout/output/orphan descendant probes, and checks
  the two public live derivatives without provider replay.

The three roles must be fresh to this candidate review packet. They may reuse
tools and immutable inputs, but not prior verdicts.

## S28 decision boundary

S28 is one decision, not another hardening campaign. It may state only:

- `GO`: exact candidate is eligible for a separately bounded R1 release action;
  or
- `NO-GO`: release remains closed, with the concrete failed contract or finding.

S28 cannot publish, tag, change versions, alter repository visibility, deploy,
or announce SCOPA. Those actions require exact principal authority after GO.

## Non-goals

- No experiment, scored work unit, RC1 pilot replay, allocation, analysis, or
  publication work.
- No new runtime feature, adapter, CLI, effect, trust class, assurance level,
  dependency, telemetry, activation service, or proprietary verifier.
- No customer data or uncontrolled repository mutation.
- No assurance transfer from S20-S23 or from one client to another.
- No npm publication, GitHub Release, version/tag change, deployment, public
  announcement, certification, or trademark claim under this draft.

## Stop conditions

- Missing, expired, consumed, or digest-mismatched S26 approval.
- Candidate, package, closure, bundle, install, client, model, prompt, budget,
  tool inventory, or custody drift.
- Provider refusal, rate pressure, timeout, output limit, cleanup failure,
  privacy event, or false green.
- Any S27 critical, high, or medium finding, any REJECT verdict, or an
  unadjudicated low.
- Dependency, license, advisory, protocol, hosted, or credential-policy failure.
- Any experiment, publication, release, deployment, or customer action.
- The next proposed slice merely restates existing evidence.

## Approval boundary

Approval of this Macro Delta would authorize drafting and deterministic
implementation of S26-S28 controls. It would not authorize the two production
calls. Those require a later exact matrix digest approval after the closed
matrix exists. Release execution remains separately closed even if S28 is GO.
