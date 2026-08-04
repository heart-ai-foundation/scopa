# Claims and non-claims

This document defines the public assurance language for SCOPA `0.2.x`. Claims
are relative to the exact package, configuration, trust policy, integration,
and evidence named by the verifier.

## Runtime claims

The public package is designed and tested to provide the following within its
trusted-host boundary:

- closed, hash-bound slice definitions with exact files or `/**` subtrees;
- repository-escape, symlink-alias, and hard-link mutation denial;
- parent-directory binding and topology revalidation before governed writes;
- real argv-based verification gates with finite output, timeout, and
  process-tree cleanup;
- machine stop state that cannot be overridden by model prose;
- compact, hash-verified continuity state across fresh processes;
- deterministic effect journals and independently verifiable evidence packets;
- optional RFC 3161 timestamp verification under relying-party-supplied trust;
- deterministic CASE/UCO 1.4 export with native-packet recovery; and
- stable, versioned JSON result and error envelopes.

## Package and adapter claims

- `@heart-ai-foundation/scopa` installs without lifecycle scripts.
- Qualified release candidates bundle the reviewed production dependency
  closure and are tested from a source-free consumer directory.
- `scopa-mcp` exposes six closed tools and has no independent mutation,
  process, network, browser, or plugin primitive.
- Adapter transcripts bind the actual MCP client identity and a validated
  capability matrix.
- Unknown tools, malformed frames, duplicate or exhausted request IDs,
  excessive frames, output backpressure, and transcript-capacity exhaustion
  fail within finite bounds.
- Live-run receipts bind exact installed identity, client profile, requested
  model, scenario, limits, capability matrix, and sanitized environment policy.
- Receipt metadata does not retain raw prompts, tool arguments, environment
  values, repository roots, or provider output.

## Adapter assurance

Assurance is computed against an enumerated capability surface:

- the deterministic model-neutral fixture may earn `full` assurance because
  it exposes no native write, process, network, or extension route; and
- Claude Code and Codex remain `partial` because reviewed provider and native
  capabilities remain outside SCOPA.

`Full` never means universally secure. It means that the named fixture has no
active uncontrolled capability in the matrix being evaluated. A successful
scenario on one adapter does not transfer assurance to another.

## Evidence interpretation

- A hash binds bytes; it does not authenticate where the expected hash came
  from.
- A software signature proves possession of the signing key; it does not prove
  human identity, hardware custody, or provider identity.
- An RFC 3161 result proves the asserted timestamp under the caller's roots,
  signer pin, and verification policy. Offline verification records when
  certificate revocation was not checked.
- CASE validation proves graph conformance; it does not verify SCOPA's native
  cryptography or provenance.
- A launcher-observed model string is not provider-signed provenance. Requested
  aliases are labeled as aliases, not immutable model snapshots.

## Non-claims

SCOPA does not:

- provide an operating-system sandbox, container boundary, EDR, or protection
  from a separately privileged local process;
- control native capabilities that a launcher leaves outside the SCOPA tool
  surface;
- attest provider identity, account ownership, immutable model snapshots,
  human identity, or hardware-backed key provenance without separate evidence;
- guarantee complete workflow capture, provider telemetry, billing accuracy,
  or external client-store cleanup beyond the measured policy;
- make Claude/Codex behavior parity a full-assurance claim;
- turn CASE graph validation into cryptographic verification;
- guarantee that vulnerability databases are complete or current;
- provide legal advice, production authorization, or formal compliance
  certification;
- create a hosted service, customer-specific assurance, or trademark
  exclusivity; or
- make verification depend on a paid consultation offering.

Historical live-run policies, budgets, and approvals are retained evidence.
They are not reusable authority for new provider traffic.
