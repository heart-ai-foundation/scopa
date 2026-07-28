# S9 validation — 2026-07-27

## Deterministic gate

- `npm run test:s9`
- Eight Codex profile, package export, assurance, identity, JSONL binding,
  negative-control, and parity test groups pass through the conformance
  test runner.
- Native command events, hidden MCP servers, changed results, false terminal
  claims, and unknown warnings are rejected.

## Installed-package live proof

Command:

```sh
npm run probe:s9:live -- \
  --output /home/dylan/llm-memories/projects/scopa/evidence/S9/codex-live-proof.raw.json
```

The probe packed and installed the root artifact in a clean consumer, loaded
the Codex integration and bridge from `node_modules`, and ran four fresh
Codex/bridge processes:

- clean: governed `workspace/codex.txt` write succeeded and the gate passed;
- denied: `../codex-escape.txt` returned `SCOPA_SCOPE_DENIED`, created no
  target, and the correction write succeeded;
- false-green: the real exit-7 gate remained `blocked` and `canStop: false`;
- cold restart: a new Codex/bridge process recovered prior SCOPA state and
  read `CODEX_ALLOWED\n` without writing.

Receipt:

- Codex CLI: `0.145.0`
- MCP client: `codex-mcp-client@0.145.0`
- requested model: `gpt-5.4`
- assurance: `partial`
- package entries: 117
- package packed/unpacked bytes: 99,391 / 407,828
- package SHA-1: `a61e6895bb14a88af78e40c9d87dbac895f322b3`
- package integrity:
  `sha512-5WKplOOIfOd8pTvNA//N1LhDjVck2fCqhb7ufuO0uozdcK0oVrprQQXNCk2GTxB5YsBGqPJWk0ndKj9zKV+jjQ==`
- raw proof SHA-256:
  `744dc75e525c60d96847ebd6519b5420b59fcacbf489af1f4fe1ab72f27c5288`
- public proof SHA-256:
  `a35c7d325ab6e9323d95b1c819784badab21e940f71a9c4c06b38e40b3399772`

The publication receipt replaces one live temporary root and four control
roots. It reports `semanticFieldsChanged: false`.

## Cross-agent parity

`npm run verify:s9:parity` compares the committed S8 Claude proof with the
S9 Codex proof. All four shared behaviors pass with the same six SCOPA tools.
The report's SHA-256 is
`99c1f298fb6d60bc4d0b8e63f5a85af47f2e5fcddb6697e98ca7f4e3160c9233`.
Both providers remain `partial`; their uncontrolled capability IDs are
reported separately.

## Remaining gates

- hosted CI after feature commit

## Final local release gates

- accumulated `npm test`: pass — 90 kernel/conformance tests, 6 Claude
  integration tests, and 8 Codex integration/parity tests
- `npm audit`: pass — 0 vulnerabilities
- `npm run verify:s9:parity`: pass
- `npm run protocol:check`: pass — expected active-S9 progress `38/44`
- `npm pack --json --dry-run`: pass — exact 117-entry package receipt above
- `git diff --check`: pass
- public-evidence path scan: pass — no private home or disposable live-root
  path

## Non-Codex outside review

Claude Sonnet reviewed an exact disposable copy, reproduced `npm run test:s9`,
the accumulated `npm test`, parity verification, the protocol check, and the
zero-vulnerability audit, and returned `VERDICT: ACCEPT S9`.

It reported two low-severity hardening opportunities. The normalizer now
requires an exact closed `id`/`text`/`type` reasoning-item shape and rejects a
command-like extra field. The deterministic suite now also reads the committed
live proof and checks the one-server MCP inventory, narrow
`scopa_write_file.approval_mode = "approve"` override, and successful governed
write. Two focused follow-ups were inconclusive due to a review budget cap and
a later Claude API connection refusal; neither produced a contrary finding.
The review record is in `evidence/S9/outside-review.md`.
