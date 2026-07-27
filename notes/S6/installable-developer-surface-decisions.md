# S6 Installable Developer Surface Decisions

Date: 2026-07-27

## Distribution boundary

The root `@heart-ai-foundation/scopa` package owns the `scopa` binary. The
developer-preview version remains `0.0.0`, `private: true`, and local-tarball
only. The package uses an explicit allowlist containing the root README and
package documentation, manifests, and runtime source. Tests, fixtures,
protocol records, notes, runs, evidence, CI files, keys, and temporary
artifacts are not distributable payloads.

The clean-install test invokes the consumer repository's
`node_modules/.bin/scopa` and verifies its real path remains under that
consumer's `node_modules`. This makes a source-checkout fallback observable.

## Command contract

All operational commands return one canonical `scopa.cli-result.v1` JSON
object. Exit codes distinguish invalid usage, scope/tool denial, completion
blocking, and failed evidence verification. `status` is observational and
returns success with `canStop: false`; `check` converts the same real gate
result into exit 4. Agent prose cannot assert completion.

`run` accepts one JSON tool request and passes it to the existing trusted
reference host. It is intentionally described as a raw host call, not a
model-neutral adapter. The adapter contract belongs to S7.

## Safe initialization

`init` publishes `.scopa/config.json` and `.scopa/slice-lock.json` with
exclusive filesystem operations. Identical state is unchanged. Conflicting
state is refused.

The `.scopa` control path must be a real directory, and its control files must
be single-link regular files rather than symlinks or hard links. A slice
definition that resolves outside the repository is refused. Read commands do
not create control state in an uninitialized repository.

The initializer does not modify an existing repository file to make it fit
SCOPA. A principal must resolve any conflict explicitly.

## Claim boundaries

The CLI proves an installable developer surface and preserves the S2 trusted
host boundary. It does not prove that Claude Code, Codex, or another agent has
no alternate mutation path. S7-S9 must enumerate and test those adapter and
provider boundaries separately.
