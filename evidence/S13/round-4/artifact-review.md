# S13 round 4 artifact/distribution review

Verdict: **REJECT**

## Exact binding

- Source commit: `1d4239cc5a30226bbf41e263fb217b84fb7ecf04`
- Candidate SHA-256:
  `239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`
- npm SHA-1: `834d716ee7fdb5a075785649cb3189e2a4271a44`
- npm integrity:
  `sha512-UD565m0fLjER7XUQNnIl/svkU56HRgsLRdBCPbj69lDtrwyyTDAd2I77vJU2NNsietSyn0kGXsUmPoptNYa4xQ==`
- Inventory: 153 regular files, 144339 packed bytes, 560284 unpacked
  bytes.

Two independent official repacks were byte-identical. Manifest paths, modes,
and sizes matched extraction.

## Finding

**Medium — packaged documentation references resources absent from the
package.**

- `README.md` referenced `spec/SCOPA_Kernel_Specification_v0_1.md`.
- `README.md` referenced `spec/SCOPA_Canon_Amendment_Note_v1_1.md`.
- `packages/interop/README.md` prescribed
  `packages/interop/requirements-case-validator.txt`.

None of those paths was in the candidate inventory. The CASE command was not
source-free as written. The reviewer required the resources to be shipped or
the instructions to be rewritten, plus a pack-time documentation-reference
regression.

## Executed checks that passed

- Offline source-free install from only the tarball.
- No package scripts or development dependencies.
- Both bins executable and all three exports importable.
- Clean fixture reached `canStop: true`; the known exit-7 fixture remained
  blocked through `scopa check` exit 4.
- Direct newline MCP initialization and six-tool inventory.
- Five closed launcher failure envelopes.
- Canonical-path, control-character, duplicate-path, package-privacy, and
  recognizable-credential scans.

## Limits and false positives

`next-prompt-protocols/` appeared only as a forbidden-prefix policy literal.
A nested Node subprocess closed early in the reviewer runner, while direct
installed MCP stdio passed. No external npm/GitHub provenance, detached
signature, credentialed provider, or network check was performed.
