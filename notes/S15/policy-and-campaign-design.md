# S15 Claude production live-run policy and campaign

Date: 2026-07-28

## Authorization boundary

The principal explicitly approved the S15 production live-run hardening
campaign in the Next-Prompt Protocol queue. The committed policy has digest:

`ba238484a4e96f10157ac9916d4b8938571ee62e13e6ac0fcff4b8c68f8c2e31`

It binds the current authenticated first-party `claude.ai` Max subscription
class without retaining email, organization identifiers, credentials, or
tokens. Authentication status is checked before every provider invocation.
The private evidence binds a one-way identity digest across runs; repository
evidence omits that digest.

## Closed execution policy

- requested model: `sonnet`, honestly recorded as an alias rather than an
  immutable snapshot;
- callable tools: exactly the six `mcp__scopa__*` tools;
- native mutation routes: disabled by the reviewed invocation profile;
- provider invocations: six;
- per-run limits: 12 turns, 120 seconds, 20 MiB capture, 1 MiB input, and
  USD 0.20;
- campaign budget: USD 1.20;
- repositories: disposable synthetic fixtures only;
- private evidence: mode `0600`, at most 25 MiB per run, retained for
  168 hours outside the repository;
- cleanup: POSIX process-group disappearance, internal control-root deletion,
  disposable-repository deletion, and run-specific Claude project-metadata
  deletion are mandatory.

The network claim is intentionally narrow. Alternate provider environment
routes are removed and the allowed class is Anthropic first-party traffic via
Claude Code, but SCOPA does not claim an operating-system egress firewall.

## Scenario set

The six real requests are:

1. clean allowed write and passing completion;
2. denied path escape followed by an allowed correction;
3. false-green attempt whose failing gate remains authoritative;
4. cold restart in a fresh Claude/bridge process;
5. first repeated read in another fresh process; and
6. second repeated read in another fresh process.

The first execution reproduced a profile drift before the other requests.
Campaign accounting therefore treats that closed failure as invocation one.
The next request reached a normalized denied-path result but exposed a runner
defect while private evidence was being assembled: canonical JSON correctly
rejected the fractional numeric USD cost. Because the disposable state was
already cleaned before the evidence write, that denied result cannot be
published or used as passing evidence. It remains invocation two, is labeled
inconclusive, and reserves the full USD 0.20 per-run maximum.

Only the four unconsumed requests remain authorized. The runner reconstructs
the synthetic allowed file before the cold/repeat chain and labels those
records `reconstructed-state-after-runner-fault`; they are useful live
hardening observations but do not substitute for direct denied-to-restart
continuity. This preserves the six-invocation and USD 1.20 hard caps without
silently replacing a lost request.

All use the exact packed-and-installed candidate from a clean source commit.
Every receipt binds package identity, client version, requested model,
capability matrix, scenario version, limits, environment policy, and hashed
invocation metadata.

## Deterministic edge controls

Before provider traffic, the S15 fault client covers version, model, tool,
agent, and MCP configuration drift; account-boundary mismatch; provider
refusal; rate pressure; execution failure; budget and turn stops; cost/turn
overrun; malformed events; early EOF; timeout; capture exhaustion; and a
TERM-ignoring descendant. All non-success outcomes are closed and cannot
assert completion.

The live drift added a deterministic `StructuredOutput` inventory control and
provider accounting recovery for normalization failures. The CLI
`--json-schema` flag was removed because Claude 2.1.220 exposed that helper as
a seventh callable tool; strict final-output validation remains in the
normalizer.

The second request reproduced a decimal-evidence defect. USD costs are now
encoded as canonical decimal strings in evidence while bounded arithmetic
continues on validated finite numbers. Raw and normalized accounting must
agree. Before each provider call, collision checks and a mode-`0600` intent
record make any uncertain invocation non-replayable. Immediately after each
provider return, the runner writes a size-bounded private recovery journal
before residue, semantic, or publication processing. A successful publication
removes both records; a crash leaves conservative invocation accounting and,
after a provider return, the exact private stream for no-replay investigation.

The sandbox also reproduced a fast asynchronous spawn-denial race. The shared
supervisor now registers its error listener immediately after spawn, so this
path closes as `spawn-failed` instead of losing the error.

## Evidence and deletion

Per-run raw streams and the private campaign record are written only beneath
`llm-memories/projects/scopa/evidence/S15`, mode `0600`. The public derivative
under `evidence/S15` redacts raw streams, standard output/error, repository
roots, and control roots while binding the exact private bytes.

The private campaign record supplies an ISO-8601 `deleteAfter` timestamp.
After that timestamp, an operator should delete the entire S15 private
evidence directory only after retaining any separately approved legal or
security hold. Repository public derivatives can remain because they contain
no raw provider content or account identifier.

## Non-goals

This campaign does not touch the separately running SCOPA-RV1 experiment,
Codex S16, customer repositories, publication, deployment, certification, npm
release, repository visibility, or full-assurance claims.
