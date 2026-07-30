# S16-v2 client-store custody stop

Date: 2026-07-29
Status: stopped after one provider call; non-qualifying; no replay

## Exact candidate

- source commit:
  `4e3be5583682804acd3ffeb59918af3ffff98782`
- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- package entries: 174
- package SHA-256:
  `f80a1dfed14afbc83fcf7ff47ea9a88f95e5961d78990583df1a3923b1c4b000`
- policy ID: `S16-v2-production-live-v1`
- authorized policy digest:
  `c159b0f24c78e3625fa385eb8f9c13c5375d7d130ca19deeae1ea555eb313d95`
- deterministic result digest:
  `3351d23cd9f64f11ee0d5835388562464c4d7b871f506d53bc3d365db97cf9b3`
- hosted release gate: `30519332442`, success

## Direct result

The clean scenario launched one fresh Codex CLI 0.146.0 process requesting
`gpt-5.4`. It completed successfully with `canStop: true`, process-group
cleanup, and exact tool order:

1. `scopa_orientation`
2. `scopa_read_file`
3. `scopa_write_file`
4. `scopa_check`
5. `scopa_assurance`
6. `scopa_transcript`

Provider-reported usage was 54,611 input tokens, 43,008 cached input tokens,
361 output tokens, 156 reasoning output tokens, and 55,128 non-double-counted
total tokens. All values were within policy.

## Stop

After the provider result was journaled, the isolated client-store snapshot
exceeded its 2 MiB audit bound. SCOPA therefore refused to accept or publish
the clean run and did not launch denied, false-green, or cold-restart.

The temporary client home and disposable repository were deleted. The mode
`0600` intent and recovery records remain in the private S16R2 namespace for
168 hours. Repository evidence retains only designated public fields and
digests.

The narrow remediation changes future store inspection to metadata-audit
oversized files without reading their content. Unexpected provider-store
files still fail closed; this does not relax the no-residue policy. The
S16-v2 authorization is closed and cannot be replayed.

## Non-goals held

No experiment work, customer data, deployment, publication, release,
visibility change, credential disclosure, private-path publication, assurance
upgrade, evidence reconstruction, or retry occurred.
