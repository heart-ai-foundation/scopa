# S15 bounded Claude campaign result

Date: 2026-07-29

## Exact candidate

- source commit:
  `1af9655ec6e274a518e089077ab6e04aa5412692`
- installed package SHA-256:
  `091d078a06d4d863b3c1fe1da6e8e5f3263e76f1e7ffc91c770c3b6f0bb70b89`
- npm integrity:
  `sha512-tW5yOmvyQzAwqJ0WFJbotKGAn3uu8JYS+BHbnGci7hF5Y1OxaefzfbJe8b785gPCduXcoP+6IDLCHoNpqxWJtw==`
- package entries: 169
- Claude Code: `2.1.220`
- requested model: `sonnet` alias, non-snapshot
- observed model: `claude-sonnet-5`
- hosted release gate: GitHub Actions run `30459644274`, pass

## Bounded continuation

The continuation resumed two already consumed requests: the retained
`clean-profile-drift` evidence and the conservatively recorded
`denied-runner-fault`. It sent only the four remaining authorized provider
requests:

```sh
npm run probe:s15:live -- \
  --policy fixtures/S15/claude-live-policy.json \
  --private-root PRIVATE_S15_ROOT \
  --resume-clean-drift PRIVATE_CLEAN_DRIFT_FILE \
  --resume-runner-fault PRIVATE_DENIED_INCIDENT_FILE
```

The sanitized result recorded six total invocations, four successful
post-remediation runs, reproduced drift, reconstructed continuity state, and
an overall false polarity-acceptance flag. The exact corrected aggregate,
including the USD 0.20 maximum reservation for the lost denied request, is
USD `0.436838899999999986` against USD `1.20`.

## Evidence audit

- four post-remediation private/public scenario bindings verified;
- all four receipts and terminals validated;
- callable init inventory was exactly six `mcp__scopa__*` tools;
- authenticated identity digest was stable across retained runs;
- every private evidence file was mode `0600`;
- public privacy findings: zero;
- stale intent or in-flight journals: zero;
- campaign private binding: verified;
- disposable repository, run-specific provider metadata, and temporary-root
  cleanup: verified.

False-green remained blocked. Cold restart and both repeat reads reached their
expected terminal polarity, but their state was reconstructed after the lost
denied request and is labeled accordingly.

## Gate decision

The six-request policy is exhausted and no seventh request was sent. S15 does
not pass acceptance because the denied request lacks publishable semantic and
process-group evidence, and direct denied-to-restart continuity was therefore
not established. S15 remains active pending separate authority for a fresh
bounded qualification campaign.

## Post-campaign deterministic gates

- `npm run test:s15`: pass, 12/12;
- `npm test`: pass, 127/127 accumulated tests plus all focused S8-S15 gates;
- `npm audit --audit-level=low`: zero vulnerabilities;
- `npm run protocol:check`: pass at 57/70 contracts with S15 still active;
- `git diff --check`: pass.
