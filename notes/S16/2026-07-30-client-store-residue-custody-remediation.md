# S16 client-store residue custody remediation

## Reproduced gap

S16-v4 correctly stopped after false-green because Codex changed its isolated
client store. The recovery journal retained the bounded provider capture, but
the runner discarded the already-sanitized store delta before it could be
preserved. The stopped campaign remains immutable; the exact changed path is
not reconstructed or inferred.

## Narrow correction

After each post-run client-store snapshot, the runner now creates a
no-overwrite, mode-`0600` private store-audit receipt before deciding whether
the delta is acceptable. The receipt binds the source commit, policy digest,
scenario, before/after entry counts, and path-hashed added, removed, or
changed metadata. It contains no raw client-store path or content.

An unexpected delta still stops the campaign. Its intent, inflight recovery
journal, and store-audit receipt remain for bounded recovery. A clean run
removes all three temporary records only after its normal private/public
evidence persists successfully.

## Deterministic proof

The fault client creates one isolated provider-state file after launch. The
new regression proves that SCOPA rejects the run, retains a mode-`0600`
receipt with one path-hashed addition, leaves no public result, and does not
expose the raw filename. The existing clean campaign regression proves that
temporary store-audit receipts are removed after accepted evidence persists.

## Non-goals

This is not a new provider attempt, does not reopen S16-v4, does not loosen
the no-residue rule, and does not start S17 or RC1 qualification work. A fresh
approved continuation remains required to observe the current Codex residue
under this improved custody contract.
