# SCOPA legibility

The legibility package derives an observation-limited boundary map from a
verified SCOPA journal. It answers:

- Which coding-agent operations and targets were captured?
- Which captured boundaries were not declared?
- Which declared boundaries were not observed in this session?
- How complete was capture relative to the host's attempted-event counter?

It does not answer what happened outside the observation host.

## Observe mode

`ObserveModeSession.invoke(event, handler)` executes `handler` first and only
then attempts to journal the event. Classification failure, duplicate event
IDs, or journal failure become capture gaps; they do not prevent or rewrite the
tool result.

```js
const result = await session.invoke(
  {
    eventId: 'read-1',
    operation: 'read',
    target: 'src/input.js',
    toolName: 'read_file',
  },
  () => readFile('src/input.js', 'utf8'),
);
```

The initial `coding-agent.v1` profile covers `read`, `query`, `write`,
`execute`, and `emit`. It binds the journal's script hash to the profile
manifest and uses unique event IDs for observation identity.

## Analysis

`analyzeObservationSession` requires:

- a non-empty journal and external chain commitment;
- the host's attempted-event summary;
- the exact profile bound into the journal; and
- optional declared boundary patterns.

The output labels every profile operation `observed` or `not-observed`.
`not-observed` is explicitly not evidence that an operation was absent.
Declared-but-unseen boundaries remain `declared-not-observed` findings.

The reconstructability score is:

```text
complete captured boundary events / host-reported attempted events
```

It is expressed in integer basis points and labeled
`boundary-event-completeness-only`. The host summary is not cryptographically
bound until a later signing layer; the map says so directly.

## Probes

```sh
npm run test:s3
npm run probe:s3
node packages/legibility/src/agent-plan-probe.js plan.json
```

The model-plan probe accepts only a closed, path-confined read/write schema.
The model proposes calls; the trusted driver performs the actual filesystem
operations and compares every event's sequence, ID, operation, target, tool,
and result status against an independent host trace.

The evidence report embeds the sealed record bytes, external commitment, and
host summary. Anyone can recompute the map and trace comparison:

```sh
node packages/legibility/src/verify-agent-plan-evidence.js report.json
```

The model-session capture retains Codex JSONL, the request, output-schema hash,
plan hash, client version, thread ID, and a hash over the local receipt. The
receipt deliberately says `not provider-signed`; independent provider
attestation remains outside S3.
