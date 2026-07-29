# S14 validation record

Date: 2026-07-28
Candidate source:
`074f5ccddc50680817c7ed18b8bda1914c6c4b56`
Hosted run:
`https://github.com/heart-ai-foundation/scopa/actions/runs/30424813419`

## Focused custody gate

Command:

```sh
npm run test:s14
```

Result: pass, 8/8 top-level tests.

The managed sandbox rejects the nested detached process-group arrangement with
`EPERM`. The unchanged official command passed outside that sandbox. The
underlying test file also passed directly with one worker inside the sandbox:

```sh
node --test --test-concurrency=1 packages/live-run/test/live-run.test.js
```

This runner constraint is not interpreted as provider or runtime evidence.

## Integration regressions

Commands:

```sh
npm run test:s8
npm run test:s9
```

Results: pass, 6/6 Claude tests and 8/8 Codex/parity tests.

## Accumulated gate

Commands:

```sh
npm test
npm audit --audit-level=low
git diff --check
```

Results:

- 127/127 accumulated discovered tests passed;
- S8 6/6, S9 8/8, S10 9/9, S11 9/9, S12 2/2, and S14 8/8 passed;
- replay and containment probes retained their expected positive/fault
  polarity;
- dependency audit reported zero vulnerabilities at every severity;
- diff whitespace check passed.

## Installed candidate

Command:

```sh
npm run probe:s12:installed
```

Result: pass from a clean checkout.

- source commit:
  `074f5ccddc50680817c7ed18b8bda1914c6c4b56`
- package SHA-256:
  `ce3fea3e306babf23e7b5e00a5163a35cea2530c1ba0590303659fd6dae20abb`
- npm integrity:
  `sha512-F9BJC2bsyzLtgxsG0QKfplD6qiT9GObDTGVJEHpXwGjSyA5aHWb+VnWtNKxzl0W1UcTLfsJ+sdnTiIv6rTXppw==`
- packaged entries: 165
- repeated pack: byte-identical
- installed exports: Claude, Codex, and release readiness
- installed bins: `scopa` executable and `scopa-mcp` closed on invalid launch
- package privacy scan: 165 files, zero findings

## Hosted gate

The exact implementation candidate was pushed to private
`heart-ai-foundation/scopa`. GitHub Actions run `30424813419`, job
`90488854792`, passed in 53 seconds. It ran the accumulated SCOPA release gate,
recovered the signed native packet, validated the committed CASE artifact, and
proved the malformed CASE graph is rejected.

## Protocol gate

`npm run protocol:check` passes after S14 closeout and S15 rotation.

No real provider traffic or experiment work occurred in S14.
