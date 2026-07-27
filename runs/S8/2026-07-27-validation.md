# S8 Validation Run

Date: 2026-07-27
Base commit: `e05ce4f`
Node: `v22.22.2`
npm: `10.9.7`
Claude Code: `2.1.170`
Codex outside reviewer CLI: `0.145.0`

## Focused deterministic gate

Command: `npm run test:s8`

Result: 6 passed, 0 failed.

Coverage includes exact Claude version and invocation constraints, installed
package export, computed partial assurance and overclaim refusal,
launcher-declared identity, wire/transcript/terminal binding, and negative
controls for hidden tools, changed built-in agents, reordered calls, altered
results, false-green output, unknown events, and malformed telemetry.

## Live installed-package gate

Command:
`npm run probe:s8:live -- --output /tmp/scopa-s8-live-proof-remediated.json`

Result: 4 scenarios passed. Claude Code 2.1.170 reported observed model
`claude-sonnet-4-6`; total provider cost was USD 0.10182085.

- Clean: exact six-tool inventory; allowed write through
  `scopa_write_file`; real gate satisfied.
- Denied: `../claude-escape.txt` returned `SCOPA_SCOPE_DENIED`; the target did
  not exist; a contained recovery write succeeded.
- False green: the exit-7 gate remained `blocked` and `canStop: false` in the
  tool result, transcript, and final normalized object.
- Cold restart: a fresh Claude and bridge process read the prior exact file and
  re-established satisfied state without a write.

The live driver packed and installed the root package in a source-free
consumer. The exercised tarball had 107 entries, 89,940 packed bytes, 353,050
unpacked bytes, SHA-1 `93f45f59a4efa6681b2067cd3d4f92f394b51a34`,
and integrity
`sha512-7AjqbKl4KofiWyjIFGExX2WekWdkLGvHADFwv+owIJ+WuIiJreC0xWySrjCxT98zOu+OGaW9OmNqnNbW1rx6eQ==`.

## Accumulated release gate

Command: `npm test`

Result: the established release gate passed 90 tests and all four conformance
probes, then the newly accumulated S8 gate passed 6 tests. No failure was
observed.

Command: `npm audit --json`

Result: 0 vulnerabilities across 14 dependency records.

## Protocol gate

Command: `npm run protocol:check`

Result during active review: clean sync; 35/44 contracts satisfied. CL1-CL3
remained open by design until the required outside reviewer accepted.

## Outside model review

Model: OpenAI GPT-5 Codex through Codex CLI 0.145.0.

Review sequence:

1. HOLD — found unconstrained built-in agent definitions and premature
   README/protocol status drift.
2. HOLD — confirmed both source fixes, but a restricted Codex sandbox blocked
   four established filesystem/process suites.
3. ACCEPT — reran in a disposable exact copy with normal local process
   permissions; `test:s8` passed 6/6, `npm test` passed 90/90 plus 6/6 S8,
   and protocol sync passed. No blocker remained.

The three raw reviewer outputs have SHA-256:

- initial HOLD:
  `bb7368d883aa4126b2fed49534b11686b9dbce93e804650704fbcb7e9df8cbaa`
- restricted remediation review:
  `9b9f3ae1cce4c8c0ca2f11361d0903a386df3e6eeb2cc45a5e5aa419b8268654`
- final ACCEPT:
  `fec18762b121d4f29cb7eac059e945bb6c6b53f930df57a19f9eb906359fb008`

The exact outputs are retained in the private S8 evidence home. The
reviewer-facing verdict is `evidence/S8/outside-review.md`.
