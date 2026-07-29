# S15 remedial direct-continuity preflight

Date: 2026-07-29

No provider request was sent while implementing or testing this preflight.

## Closed allowance

- exactly two Claude Code requests;
- USD 0.20 maximum per request and USD 0.40 maximum in aggregate;
- request one: direct denied-path polarity plus allowed correction;
- request two: fresh Claude and SCOPA bridge processes read the exact state
  produced by request one from the same disposable repository;
- no resume from the exhausted S15 campaign and no third request;
- raw evidence under the fresh external `S15R2` evidence namespace, mode
  `0600`, maximum 25 MiB per run, retained for 168 hours;
- SCOPA-RV1 experiment work excluded.

## Fail-closed ordering

The runner requires a clean committed source candidate, packs and installs that
exact commit, validates the committed policy digest, and refuses evidence
collisions before a request. Each request writes a mode-`0600` pre-call intent,
then a mode-`0600` recovery journal immediately after return. Intent and journal
are removed only after accounting, semantic assertions, evidence persistence,
and cleanup checks succeed.

The second request is attempted only after the direct denied result passes. A
failure leaves bounded recovery material and stops the campaign.

## Qualification sequence

```sh
npm run test:s15
npm run test:s8
npm run test:s14
npm test
npm audit --audit-level=low
npm run protocol:check
npm run probe:s12:installed
```

Provider execution remains gated until this implementation is committed,
pushed, passes hosted CI, and the installed-package probe binds that exact
commit.
