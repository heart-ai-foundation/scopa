# S53 fresh installed-agent report

## Verdict

**PASS — no critical, high, medium, low, or nit product finding.**

A second fresh agent tested only the supplied local candidate tarball. It was
given the expected hash but no implementation context and used only installed
README, `SCOPA_AGENT.md`, documentation, files, help, and CLI output.

## Identity and isolation

- Expected and observed SHA-256:
  `28f0229dd87347cc4409e8c2d0402fb4541ebc663bcc0a17cd8f2363beaa0c26`.
- Package identity: `@heart-ai-foundation/scopa@0.4.0` development candidate.
- Install: local `npm install --offline --ignore-scripts --no-audit --no-fund`.
- The invoked CLI and all four declared runtime dependencies resolved beneath
  the isolated installed package.
- No runtime or module path resolved beneath `/home/dylan/scopa`.

## Journey result

- Cold zero-argument insight was useful, read-only, and gave one continuation.
- Assistant detect, generic preview, install, uninstall preview, and uninstall
  behaved reversibly; previews did not write.
- Malformed `begin` was concise at a terminal and canonical JSON when explicit
  or piped, preserving exit 2.
- Bounded `begin` created closed state and truthfully returned the expected
  failing initial gate with exit 4.
- After task completion, human and JSON checks passed and JSON reported
  `canStop: true`.
- Tracked and nonignored untracked changes inside and outside scope were
  observed; ignored control data was excluded; recognized non-goal contacts
  remained a separate count.
- Terminal and JSON cards agreed on `SATISFIED — WITH UNVERIFIED CHANGES`.
- The map remained partial: 8 controlled, 4 uncontrolled, 0 unknown, 6
  authority-required, 0 disabled, 18 total.
- Evidence export explicitly identified itself as outside the governed task
  mutation boundary. The next card increased untracked and outside counts
  without revealing the path.
- Badge grammar rendered `1 NON-GOAL CONTACT` and `2 NON-GOAL CONTACTS`.
- JSON, singular badge, and plural badge exports disclosed no changed path,
  non-goal prose, temporary root, or raw Git status/diff output.

## Export hashes

| Export | SHA-256 |
| --- | --- |
| JSON Boundary Card | `3ef227c27f398b9c1afa64c9435f9740ceb172bc85e6d90636299283de0cc2bd` |
| Singular badge | `bbde73ba7f77cf7f9f2b86cf07a0b80483c543a82f9ab603b1fb32e1ef396b22` |
| Plural badge | `78abe39e1100911fae9ee114cad90d8c63bfa791a2f78e85165857941e320a22` |

## Adjudicated harness notes

An initial test-only patch used the wrong temporary relative path; an initial
CommonJS dependency-resolution probe did not fit ESM-only `cborg`; and a
semantic synonym did not meet the intentionally conservative lexical non-goal
matcher. Corrected fixtures reproduced the intended assertions. None was a
product defect or contradictory runtime result.

Assistant artifacts were uninstalled, the isolated workspace was removed and
verified absent, and no SCOPA repository file was changed by the agent.
