# S13 round 4 proof/evidence review

Verdict: **ACCEPT**

## Exact binding

- Source commit: `1d4239cc5a30226bbf41e263fb217b84fb7ecf04`
- Candidate SHA-256:
  `239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`
- Manifest SHA-256:
  `32d6941ef2f8f4a1cabddf4bdb983517adf05cb2b981f83df8908792cadc8e30`
- Raw proof SHA-256:
  `2c444dd8f6a65259be2b9506792ffd55e80803dddbdddd204bb56d9c495458c5`
- Public proof SHA-256:
  `cf9da559b12dd5b723b3a329daf0227087c273b248e1136260cc11768755eaa5`

## Executed checks

- Fresh source-free offline install and clean detached-clone deterministic
  repack.
- Byte-identical public-proof regeneration.
- Runtime and published-contract validation of manifest, raw proof, and
  public proof.
- All 37 parity cases: 3 expected accepts and 34 expected rejects.
- All 66 C0/DEL validator invocations rejected, plus absolute, backslash,
  non-NFC, dot, parent, repeated/trailing separator, and duplicate paths.
- Semantic-claim, closed-field, numeric-boundary, unknown/missing-field, and
  false-green mutations rejected.
- Exact candidate/proof/hash binding and collision-safe publication.
- Only the two designated environment fields changed during publication;
  private-root occurrences were zero.

Critical: 0. High: 0. Medium: 0. Low: 1.

The low finding is that this is a local self-produced receipt without detached
third-party provenance or external attestation. Runtime and published
validation share the shipped AJV implementation, so the result establishes
internal parity rather than cross-engine attestation.
