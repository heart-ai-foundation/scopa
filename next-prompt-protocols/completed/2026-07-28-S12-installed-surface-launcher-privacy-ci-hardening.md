# S12 — Installed Surface, Launcher, Privacy, and CI Hardening

**Class:** `arc`
**Module:** `distribution-hardening`
**Crosses:** [`adapter-host`, `distribution`, `conformance`]
**Advances contracts:** [`DH1`, `DH2`, `DH3`]
**Compound:** false

## Why this exists

S11 closed the two medium proof-integrity findings. The remaining confirmed
release-readiness findings are distribution-boundary defects: the installed
package advertises contributor scripts whose test dependencies are absent,
ordinary launcher validation failures emit stacks and absolute install paths,
the package scanner embeds a contributor-specific path sentinel, and hosted CI
retains Node.js action-runtime deprecation warnings. These must be corrected
before rebuilding a candidate.

## Next objective

Create an explicit consumer package contract. Build the tarball through a
deterministic staging path whose package metadata exposes only runnable
consumer bins and exports, then exercise every retained entry from installed
bytes. Make launcher failures closed, structured, stack-free, and path-free by
default with an explicit diagnostic opt-in. Replace contributor-specific
privacy sentinels with generic structural checks and update hosted actions to
authoritative Node.js 24-compatible versions.

## Descriptor rung check

Executable unlock: a tarball-only command/export matrix and hostile launcher
corpus can prove that the installed surface is coherent and its default errors
do not disclose installation topology.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: consumer staging/packing, installed-surface inventory,
  structured launcher errors, generic privacy scanning, and hosted workflow
  runtime updates.
- New uncertainty reduced: whether the package advertises broken commands,
  leaks local topology on normal failure, embeds contributor identity, or
  depends on deprecated hosted action runtimes.
- Validation: focused S12 tests, installed tarball matrix, privacy/credential
  scan, hostile launcher corpus, accumulated local gate, and hosted CI.
- Consecutive metadata/decision slice check: `pass`; S12 changes executable
  package and launcher behavior.
- Status-report alternative: insufficient because all retained findings
  reproduce from installed artifact bytes or hosted workflow execution.

## Productivity mix

- Runtime behavior: 40%
- Contract/test code: 45%
- Metadata/docs: 15%

## Slice queue

This queue is materialized from the ratified Adversarial Release Hardening
Macro Delta and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S11 | Proof contract and redaction convergence | Align validators and make publication collision-safe | Runtime/schema corpus agrees and receipts cannot falsely claim semantic preservation | Differential mutation corpus, collision corpus, S10 regression, full gate | `completed` |
| S12 | Installed surface, launcher, privacy, and CI hardening | Reconcile shipped commands and bound consumer errors/package residue | Every retained command runs from tarball-only bytes and hostile launcher errors stay structured | Installed-command matrix, package/privacy scan, hosted CI | `active` |
| S13 | Fresh-agent adversarial release requalification | Rebuild and independently requalify the corrected candidate | Three fresh reviewers reproduce corrected boundaries with no critical/high/medium finding | Exact artifact, source-free corpora, outside reviews, hosted gate | `queued` |

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `.github/**`
- `packages/release-readiness/**`
- `packages/adapter-host/**`
- `packages/cli/test/cli.test.js`
- `fixtures/S12/**`
- `next-prompt-protocols/**`
- `notes/S12/**`
- `runs/S12/**`
- `evidence/S12/**`

## Validation speed option

- Fast slice-local command: `npm run test:s12`
- Installed-artifact command: `npm run probe:s12:installed`
- Upstream fixture policy: reuse the minimal S10 consumer fixtures and S11
  proof corpus without rebuilding live Claude/Codex evidence.
- Broad-suite policy: `npm test` remains the accumulated compatibility guard.

## Decision gate

The consumer tarball must not expose contributor-only test and probe scripts.
The source repository may retain its contributor commands, but the staged
consumer `package.json` must carry a closed script surface and remain bound to
the source package identity, dependencies, bins, exports, engine, license,
repository, and package allowlist.

Default launcher failures must return a versioned JSON envelope containing a
closed code, boundary, and bounded message. Stack traces and absolute paths are
permitted only through an explicit diagnostic opt-in and must never appear in
the default path.

GitHub action versions must be selected from the authoritative action
repositories and must target a supported runtime at implementation time.

## Non-goals

- No npm publication, GitHub Release, repository visibility change,
  deployment, customer use, public announcement, certification, or trademark
  claim.
- No removal of consumer bins, exports, public schemas, verifier capability,
  known-failing fixtures, or independently useful free functionality merely
  to make the inventory green.
- No rewrite of S10 or S11 retained evidence.
- No change to enforcement semantics, effect categories, adapter assurance,
  trust policy, signature verification, or proof-contract acceptance.
- No contributor-specific username, home directory, or private evidence path
  in package bytes.
- No default launcher stack, source location, or absolute install path.
- No S13 candidate assembly or outside requalification before rotation.

## Evidence

This slice commits the standard S12 trio:

- `notes/S12/` — consumer/contributor surface decision, launcher-error
  contract, privacy policy, action-version evidence, and non-goals.
- `runs/S12/` — focused tests, installed matrix, package/privacy scan,
  accumulated gate, dependency audit, protocol check, and hosted run.
- `evidence/S12/` — exact staged package inventory, bin/export/script matrix,
  hostile error receipts, privacy scan, and hosted warning audit.

## Acceptance

- `npm run test:s12`
- `npm run probe:s12:installed`
- `npm run test:s11`
- `npm test`
- `npm audit`
- `npm run protocol:check`
- The official pack path is deterministic, source-clean, and produces a
  consumer `package.json` with no contributor-only scripts.
- Every retained bin and export resolves and executes or imports from a fresh
  tarball-only installation.
- Every retained consumer script, if any, executes from installed bytes; no
  command references omitted tests, fixtures, build output, or source paths.
- Invalid session, capability-matrix, launcher-option, and protocol inputs
  fail with a closed versioned JSON envelope.
- Default launcher errors contain no stack, source line, `file:` URL, absolute
  build/install path, or uncontrolled input echo.
- Diagnostic stack output is explicit opt-in and documented.
- Package bytes contain no contributor-specific home/path sentinel,
  recognizable credential value, private evidence root, or repository-only
  control/evidence surface.
- Supported action versions remove the Node.js action-runtime deprecation
  annotation in hosted CI.
- DH1, DH2, and DH3 are independently reviewable and satisfied.
