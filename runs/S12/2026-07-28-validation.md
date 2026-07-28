# S12 validation — 2026-07-28

## Source

- active authority: S12 Installed Surface, Launcher, Privacy, and CI Hardening;
- final executable source: `04cb8052ff80251f9c189650b0e6e349b37fdcbb`;
- branch: `main`;
- remote: `heart-ai-foundation/scopa`;
- implementation commits: `2312274`, `101bc84`, `d141d19`, `04cb805`.

## Focused gate

Command:

```sh
npm run test:s12
```

Result: pass, 2/2 focused distribution-hardening tests.

The accumulated release-gate discovery separately executes the launcher
contract and packed adapter tests: 9/9 adapter-host tests passed.

## Exact clean installed-artifact probe

Command:

```sh
npm run probe:s12:installed -- \
  --output evidence/S12/installed-surface-proof.json
```

Result: pass from a clean `04cb805` worktree.

- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`;
- entry count: 152;
- packed/unpacked bytes: 142233 / 549248;
- first and repeat SHA-256:
  `2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`;
- installed scripts: absent;
- installed development dependencies: absent;
- bins executed: 2/2;
- exports imported: 3/3;
- retained consumer scripts: 0;
- hostile launcher cases: 5/5;
- default path/stack disclosures: 0;
- diagnostic opt-in: envelope-first stack observed;
- privacy/credential findings across installed files: 0.

The full exact manifest, installed metadata, matrices, and hostile receipts are
retained in `evidence/S12/installed-surface-proof.json`. The generated tarball
was destroyed with the private probe directory and is not an S13 candidate.

## Accumulated and regression gates

Commands:

```sh
npm test
npm run test:s11
```

Final result: pass.

- accumulated release-gate discovery: 109/109;
- Claude focused gate: 6/6;
- Codex/parity focused gate: 8/8;
- S10 focused gate: 7/7;
- S11 focused gate: 8/8;
- S12 focused gate: 2/2;
- clean/fault replay and containment probes preserved expected polarity.

## Dependency and protocol gates

Commands:

```sh
npm audit --audit-level=low
npm run protocol:check
git diff --check
```

Results:

- dependency vulnerabilities: 0;
- protocol manifest references exact executable source `04cb805`;
- S12 remains the sole active slice while evidence is committed;
- diff whitespace errors: 0.

## Authoritative action-version evidence

GitHub API inspection on 2026-07-28 returned:

| Action | Release | Published | Runtime |
|---|---|---|---|
| `actions/checkout` | `v7.0.1` | 2026-07-20 | `node24` |
| `actions/setup-node` | `v7.0.0` | 2026-07-14 | `node24` |
| `actions/setup-python` | `v7.0.0` | 2026-07-20 | `node24` |

The exact API/release references are retained in
`evidence/S12/action-runtime-evidence.json`.

## Hosted gate and warning audit

Foundation-hosted run `30339873079` passed on exact executable source
`04cb8052ff80251f9c189650b0e6e349b37fdcbb`.

Job `90212807554` completed successfully in 42 seconds. All setup, dependency,
accumulated release-gate, signed-packet recovery, independent CASE validation,
and malformed-graph rejection steps passed.

The decoded log was searched for `Node.js 20`, `deprecated`, `compatibility`,
and `warning`. It contained no Node.js action-runtime warning. The one generic
warning match is Git's initial-branch-name hint during checkout initialization.
The classification is retained in
`evidence/S12/hosted-warning-audit.json`.

## Boundary

This validates S12 distribution hardening only. It does not authorize public
release or satisfy S13 fresh-agent release requalification. Provider-side
credential rotation confirmation remains an external S13 closeout
prerequisite and no credential value is retained here.
