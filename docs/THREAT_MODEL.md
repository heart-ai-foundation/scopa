# SCOPA developer-preview threat model

## Scope

This model covers the local SCOPA package, CLI, model-neutral MCP bridge,
Claude/Codex launch profiles, packed S10 consumer artifact, evidence verifier,
and GitHub-hosted release gate. It does not cover a production deployment,
customer repository, package registry, provider infrastructure, or separately
privileged local attacker.

Named contributor audit commands and retained gate evidence refer to a SCOPA
source checkout; those scripts are intentionally absent from the source-free
consumer package.

## Assets

- slice scope, gate definition, stop state, and continuity state;
- repository files reachable through registered tools;
- append-only journals, signatures, timestamp evidence, and INFER pins;
- adapter transcripts and capability matrices;
- candidate artifact, integrity manifest, public fixtures, and policy state;
- private vulnerability reports and any credentials used by live model CLIs.

## Trust boundaries

1. Untrusted model or client to the MCP/host tool boundary.
2. Trusted SCOPA dispatcher to the repository filesystem.
3. Gate runner to bounded child processes.
4. Local candidate artifact to a source-free consumer.
5. Evidence producer to an independent verifier with caller-supplied trust.
6. Repository/CI configuration to GitHub-hosted runners and dependency
   registries.
7. Claude/Codex launch configuration to provider, account, session, policy,
   network, plugin, skill, and native execution surfaces.

## Threats and controls

| Threat | Control | Verification | Residual risk |
| --- | --- | --- | --- |
| Path escape, symlink/hard-link alias, or topology swap | Canonical scope check, topology revalidation, dispatcher-only registered mutation | S2 hostile path tests and S7-S10 denied calls | Concurrent privileged processes outside the trusted host remain out of scope |
| Model asserts completion over failure | Real argv gate execution and machine stop state | Exit-7 fixtures and `SCOPA_COMPLETION_BLOCKED` | A malicious operator can replace the host outside the measured boundary |
| Hidden adapter mutation route | Explicit tool inventory and capability/bypass matrix | S8/S9 live proofs and parity report | Claude and Codex remain `partial` because native routes are not all SCOPA-controlled |
| Unknown or reordered model events | Closed stream normalizers bound to SCOPA transcript | S8/S9 negative controls | Provider event formats can change and require a pinned adapter update |
| Journal or packet tampering | Deterministic encoding, hash chain, signatures, optional RFC 3161 anchor | S1/S4 mutation tests and fresh-process verification | Software keys do not prove hardware identity |
| Stale or revoked timestamp signer | Caller-supplied root and signer-certificate pin; explicit offline verification report | S4/S10 native-packet verification | The offline path records `revocationStatus: "not-checked"` and does not fetch CRL/OCSP state |
| Candidate substitution | Git commit, file inventory, SHA-1, SHA-256, and npm SHA-512 integrity binding | S10 candidate manifest | Secure delivery of the expected manifest remains an evaluator responsibility |
| Monorepo-relative or private-path dependency | Explicit package allowlist and source-free install probe | S6 and S10 consumer probes | npm dependencies still rely on their registries/caches |
| False policy readiness | Closed posture schema and constituent policy audit | Retained source-checkout policy-audit evidence | Policies are project commitments, not formal compliance certification |
| Secret or raw-path disclosure | Private raw evidence, deterministic public redaction, path scans | S8-S10 publication receipts | Model/provider telemetry outside SCOPA follows provider controls |
| Supply-chain vulnerability | Exact dependencies, lockfile, `npm audit`, hosted clean install | Accumulated release gate | Audit databases are incomplete and change over time |

## Security controls

- No lifecycle install scripts are required.
- The candidate remains `"private": true` and is packed locally.
- Live models run only in disposable fixture repositories.
- Verification uses caller-supplied timestamp roots and signer pins.
- Offline timestamp verification reports that certificate revocation is not
  checked; revocation-sensitive evaluators need a separate CRL/OCSP check.
- Known-failing fixtures remain part of the release boundary.
- GitHub Actions uses read-only repository contents permission.
- Security reporting avoids public exploit disclosure.

## Explicit non-claims

SCOPA is not an OS sandbox, EDR, container boundary, provider attestation,
formal compliance certification, or guarantee against a privileged local
attacker. Behavior parity between Claude and Codex does not transfer assurance
between them.

## Residual risk

The highest residual risks are adapter-native authority outside SCOPA,
provider/account policy drift, concurrent privileged filesystem mutation,
software-key provenance and offline revocation-status limits,
dependency-registry compromise, and evaluator failure to authenticate the
expected candidate manifest. These risks are documented; they are not
converted into full assurance.
