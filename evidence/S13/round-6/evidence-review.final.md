# S13 round 6 proof/evidence review

Verdict: `REJECT`

## Exact target

- source:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- candidate SHA-1: `76558a5f8374eb018949ad326024ff330bbeb722`
- packed/unpacked bytes: 147435 / 571866
- entries: 153
- manifest SHA-256:
  `51e670f3941edc82d63373055991754bafa08f33de99c79e56125cdb0d7fe3fb`
- raw proof SHA-256:
  `93c598ba02e0125acc8882f5ec0f1481f51dc28d1f0b1b85e9bd9d7e02f39b95`
- public proof SHA-256:
  `01866081eab5d8fa6bb7680eee1bd04d5899a52bbd482963688599d75d33105a`
- installed receipt SHA-256:
  `8eafb223e3d4b363c6bb1a2a2060052d67a81de612d2f0a429e68fbab2b6b319`
- parity receipt SHA-256:
  `7501a1388936c05293ea0ee4b3c882fd69d0899efec6519d65e0e4ebd1475022`

## Findings

### Medium — candidate paths have no UTF-8 byte bound

The installed runtime and published validators accepted candidate paths of
4097 ASCII bytes, 4098 UTF-8 bytes, and 1048578 UTF-8 bytes. A 1048577-byte
path was accepted by `validateConsumerProof` and
`createPublicConsumerProof`, survived verbatim in public evidence, and
produced 1061744 bytes of JSON.

This is a false-green evidence boundary: hostile oversized candidate paths
are neither rejected nor prevented from entering retained/public evidence.
The exact candidate is not affected; its longest path is 57 bytes.

### Medium — parity and cross-receipt evidence is transplantable

`proof-contract-parity.json` contains no source commit, candidate digest,
corpus digest, or validator-byte digest. Its bytes are identical across rounds
4, 5, and 6. `exact-artifact-consistency.json` does not hash that receipt and
uses anonymous candidate bindings rather than named receipt bindings. The
dependency audit is also unbound.

The reviewer independently reran the exact installed round 6 parity corpus
successfully, so the current conclusion is true, but the retained evidence
alone cannot distinguish that execution from a stale copied receipt. The
matrix could remain green under self-consistent but stale evidence.

### Low — file modes are only safe-integer bounded

Both validators accept manifest modes `512` and `9007199254740991`. The exact
manifest modes are correct and official packing constrains observed values,
but the published contract accepts nonsensical mode evidence.

## Executed checks

- Created a fresh local clone at the exact commit and a fresh temporary
  consumer without network or credentials.
- Ran `packCandidate` independently twice; both tarballs were byte-identical
  to the retained candidate.
- Recomputed SHA-256, SHA-1, and SHA-512.
- Extracted the tarball and compared all 153 paths, sizes, modes, total
  unpacked bytes, and entry types with the manifest: zero mismatches.
- Installed the exact tarball offline with scripts disabled.
- Checked installed metadata, both bins, all three exports, and inventory.
- Regenerated the installed-surface receipt and public proof byte-for-byte.
- Confirmed identical candidate/source objects across manifest, raw proof,
  public proof, and installed receipt.
- Reran the installed 37-case corpus: 37 cases, 3 accepts, 34 rejects, all
  expected outcomes.
- Attacked C0/DEL, separator, alias, duplicate, NFC, oversized-path,
  false-green, tool, claim, numeric, and semantic-projection boundaries.
- Reran exact, substring, reserved-placeholder, overlapping-root, and
  equal-root publication cases.

## Passing adversarial results

- All 33 C0/DEL cases and the other canonical-path cases rejected.
- Tool inventory, claims, policy, terminal, known-failure, verification, and
  semantic false-green mutations rejected.
- Exact/substring collisions and reserved placeholders rejected.
- Equal and overlapping roots changed only the two designated fields.
- Semantic projection detected unrelated changes.
- No raw private root survived the public proof.

## False positives and limits

Two installed mode differences were npm's expected executable promotion of
bin targets; tar and manifest modes match exactly. `C:/root/file` is valid as
a POSIX-relative path and was not elevated as a separate finding.

No fresh online dependency audit or hosted-run verification was performed.
Runtime and published validation share the shipped AJV implementation, so
agreement is internal consistency rather than external conformance. The raw
proof was hash/schema/binding checked but not regenerated because its
temporary root is intentionally nondeterministic. Credential rotation and
publication authority were not assessed. Review temporary material was
removed; retained bytes were not modified.
