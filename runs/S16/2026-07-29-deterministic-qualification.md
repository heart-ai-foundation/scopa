# S16 deterministic installed qualification

Date: 2026-07-29
Status: pass; provider gate remains closed

## Exact candidate

- source:
  `695672d3cf5fc4f985ae8e779830d13ce20fa3ca`
- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- package entries: 173
- package SHA-256:
  `eeab466bad7c0651ec778b055826c0ae09f3a767e7cc6f21b6e0f33427e16318`
- package integrity:
  `sha512-A6e/faPifPakURcu1bGaMWOMkaCuRirYxMD6o8n2cEFMbqBon1MwU0IT7w3YtMAvp8GnhvbaqvVtnRAToZKnyg==`
- policy SHA-256:
  `c0b27378715e238fb2af4559ae787b221169181473ce59e572e3018019fca82f`
- deterministic corpus SHA-256:
  `49d71d45a4e6bceec8cc664026f9187182c8e0556e65d6d208dacaa6e0edc7fb`
- result-file SHA-256:
  `1b6424bcee3dc6ef68e85d61debf7abf47f7afce0b9ff7f8fafc714b5ba7c439`

## Commands and results

- `npm run test:s16`: 8/8 pass.
- `npm run test:s9`: 8/8 pass.
- `npm run test:s14`: 8/8 pass.
- `npm test`: pass; 127 accumulated release-gate tests and all focused
  integration gates pass, 193 tests total across the command.
- `npm audit --audit-level=low`: zero vulnerabilities.
- `npm run probe:s12:installed`: repeated official pack is byte-identical,
  both binaries and all exports pass, and 173 shipped files have zero privacy
  findings.
- `npm run probe:s16:deterministic -- --output
  evidence/S16/deterministic-result.json`: pass.

The first generic installed probe caught a concrete private evidence topology
in the shipped Codex policy and schema. That candidate and its deterministic
receipt were invalidated. The remediated public contract uses
`SCOPA_PRIVATE_EVIDENCE_ROOT/S16`; the concrete mapping remains private. A
regression assertion scans both shipped policy files.

## Result

- deterministic scenarios: 21
- expected states observed: all
- expected completion polarities observed: all
- process groups gone: all
- provider invocations: 0
- assurance: `partial`

This run qualifies the installed deterministic surface only. It is not
production-live evidence and does not open the four-call Codex provider policy.
