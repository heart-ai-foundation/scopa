# S13 Round 7 proof/evidence review

Verdict: `ACCEPT`

Exact binding:

- source:
  `5a6b29832910db26497095289badb3e859bca48c`;
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`.

## Findings

- critical: 0;
- high: 0;
- medium: 0;
- low: 0.

## Executed review

The fresh reviewer produced two byte-identical official repacks, regenerated
the exact manifest, public proof, and installed receipt, and ran a fresh
offline source-free consumer proof. Both source and installed 41-case parity
runs passed with three accepts and 38 expected rejects.

Independent hostile coverage included 46 path families, every C0 code point
plus DEL, 4096-byte boundaries, 25 closed/false-green mutations, 15
numeric/mode boundaries, and five publication-collision families. Oversized
and hostile paths were rejected without meaningful evidence echo. Only the
two designated private roots changed in publication, and no private root
survived.

All eight named exact-consistency receipt hashes and embedded bindings matched.
Round 6 parity, collision, dependency, installed-surface, public-proof, and
hosted-source transplant attempts were detected.

## False positives and limitations

Npm's executable-mode promotion for the two bin targets was valid; `C:/...`
is POSIX-relative; a literal-dot echo probe matched punctuation; and a fresh
public receipt differed only because `sourceSha256` correctly bound newly
randomized private roots.

The review did not refresh the online advisory database or independently query
the hosted run. Shared-validator parity is internal agreement, not external
attestation. The result supplies no provenance certification,
credential-rotation confirmation, or publication authorization.
