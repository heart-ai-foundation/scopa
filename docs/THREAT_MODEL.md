# Threat model

## Scope

This model covers the public SCOPA package, CLI, trusted reference host,
model-neutral MCP adapter, Claude/Codex launcher profiles, gate subprocesses,
continuity state, evidence verification, source-free package qualification,
and GitHub/npm release delivery.

It does not cover a customer production deployment, provider infrastructure,
the security of arbitrary gate commands, or a separately privileged local
attacker. Contributor-only commands and retained campaign evidence refer to a
source checkout and are not runtime authority for package consumers.

## Protected assets

- slice scope, gate definitions, stop state, and continuity state;
- repository files reachable through registered tools;
- effect journals, signatures, timestamp evidence, and INFER pins;
- adapter sessions, transcripts, and capability matrices;
- package bytes, dependency closure, manifests, and public schemas; and
- private provider output, vulnerability reports, and credentials used by
  opt-in live clients.

## Trust boundaries

1. Untrusted agent or MCP client to the trusted tool host.
2. Trusted dispatcher to repository topology and filesystem operations.
3. Gate runner to bounded child-process trees.
4. Persisted control state to a fresh process.
5. Evidence producer to an independent verifier with caller-supplied trust.
6. Source repository and lockfile to the source-free npm artifact.
7. GitHub/npm delivery to a developer authenticating expected release bytes.
8. Provider launcher to account, model, network, policy, plugin, skill, native
   execution, and client-store surfaces.
9. Private raw evidence to a sanitized public derivative.

## Threats and controls

| Threat | Primary controls | Residual risk |
| --- | --- | --- |
| Out-of-scope or escaping write | Closed path rules, canonical resolution, repository containment, topology revalidation, parent binding | A separately privileged process can interfere outside the trusted-host assumption |
| Symlink or hard-link alias | Existing-ancestor resolution, symlink denial, multi-link target denial | Filesystem and platform semantics outside supported paths may differ |
| Model asserts false completion | Real bounded gates and machine `canStop` | A malicious operator can replace the trusted host or policy |
| Gate hangs, floods output, or leaves descendants | Timeouts, per-stream limits, POSIX process groups, TERM/KILL escalation, survivor verification | Unsupported platforms fail closed; privileged processes remain out of scope |
| Hidden mutation route | Exact tool inventory and capability matrix | Claude/Codex remain `partial` because native routes are not all controlled |
| Provider or client event drift | Pinned profiles and closed stream normalizers | Client upgrades require deliberate requalification |
| Credential or raw-output disclosure | Small environment policies, private mode-0600 evidence, designated redaction, collision and privacy checks | Provider-owned telemetry follows provider controls |
| Consumed provider call loses evidence | Pre-call intent, bounded post-return journal, conservative accounting, no-replay policy | Provider return without durable evidence remains non-qualifying |
| Continuity transplant or silent repair | Hash-bound lock and rotation records, closed schemas, conflict refusal | Operator loss of all trusted state requires explicit recovery decisions |
| Journal or packet tampering | Deterministic encoding, hash chains, signatures, optional timestamp anchors | Software keys do not prove hardware or human identity |
| Stale timestamp trust | Caller roots, signer fingerprint, explicit timestamp policy | Offline verification does not fetch CRL/OCSP state |
| Candidate substitution | Commit, inventory, SHA-1, SHA-256, npm integrity, installed-byte checks | Evaluator must authenticate the expected release digest |
| Transitive dependency substitution | Lockfile integrity, bundled closure inventory, empty-cache offline install, installed-byte comparison | Registries, audit databases, and upstream projects can change or be compromised |
| Newly disclosed dependency vulnerability | Current advisory-database scan, exact-version review, patch update, hostile regression where applicable | Advisory severity may not equal SCOPA exploitability; databases are incomplete |
| Malformed or unbounded MCP traffic | Frame, request-ID, in-flight, transcript, and backpressure bounds | Denial traffic can still consume resources within configured limits |
| Overstated assurance | Computed matrices and explicit non-claims | Users may ignore documentation or attach the wrong matrix |

## Security controls

- No install lifecycle scripts are required.
- Public candidates are built through the qualified bundled-candidate path,
  not raw source-checkout `npm pack`.
- The package carries versioned schemas, threat boundaries, claims, security
  reporting instructions, and known-failing controls.
- Production dependencies are exact at the direct layer and integrity-locked
  transitively. Dependency advisories are reassessed at maintenance time.
- Agent mutations pass through one registered dispatcher.
- Gate commands use `shell: false` and a small inherited environment.
- Model clients run only through explicit, opt-in profiles and do not enter
  default tests or CI.
- Raw prompts, arguments, environment values, provider output, and private
  roots are excluded from public receipts.
- Diagnostic stacks are opt-in and must never be treated as public evidence.
- GitHub Actions uses read-only repository-content permission.
- Vulnerabilities are reported through a private channel.

## Explicit non-claims

SCOPA is not an OS sandbox, hosted service, provider attestation, EDR, formal
certification, guarantee of complete agent capture, or protection against a
privileged local attacker. Behavior parity does not transfer assurance between
integrations.

## Residual risk

The highest residual risks are uncontrolled adapter-native authority,
provider/account policy drift, privileged local filesystem interference,
software-key provenance, offline certificate-revocation limits, dependency and
registry compromise, and evaluator failure to authenticate expected bytes.
These risks are retained as boundaries rather than converted into stronger
claims.
