# S13 round 5 proof/evidence review

Verdict: **ACCEPT**

## Exact binding

- Source commit: `18a50da693282760e1b912258fdaae1c5df049d4`
- Candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- Manifest SHA-256:
  `c28be4ad1312282d70e25eb579379f46c83bb4a96a18701e5a80ee1c628977ca`
- Raw proof SHA-256:
  `3ad9aafcdd20c5e2f47423c5fb10cd8a0de316765bb7996392125811e3b90674`
- Public proof SHA-256:
  `85a9a89d8aa9303a3651939adc1866514894f74f1cbbd27f76b265d112a67c5a`

## Executed checks

- Fresh clean local clone and two official byte-identical repacks.
- Independent tar hashes, 153-file inventory, modes/sizes, and no special
  entries.
- Fresh offline source-free proof and installed-tarball parity run.
- All 37 source and installed parity cases: 3 accepts, 34 rejects.
- 144 additional runtime/published attacks covering all C0/DEL paths,
  separators, aliases, non-NFC, numeric boundaries, closed fields,
  false-green mutations, and tool inventories.
- Exact/substring/reserved publication collisions rejected; overlapping/equal
  roots published safely; only the two designated fields changed.

Critical: 0. High: 0. Medium: 0. Low: 0.

Valid-path calibration and safe overlapping/equal-root cases produced no
false positive. Exact/substring collision rejection is intentionally
conservative.

Runtime and published validation share the packaged AJV implementation and
custom invariant, so agreement is internal consistency rather than independent
certification. The commit has no signed-commit attestation. No network,
credential, provider, or external trust service was used.
