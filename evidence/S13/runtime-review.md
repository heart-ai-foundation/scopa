# S13 initial fresh runtime/containment review

Date: 2026-07-28
Reviewer: fresh isolated Codex subagent `s13_behavior_review`
Source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`
Candidate SHA-256:
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`
Environment: fresh temporary consumer; Node 22.22.2; npm 10.9.7
Network/credentials: none; npm installation forced offline
Repository changes: none
Verdict: `ACCEPT`

## Result

No critical, high, medium, or low finding was reported. The reviewer executed
the installed candidate rather than relying only on static inspection.

## Executed checks

The reviewer computed the candidate SHA-256, initialized a disposable consumer,
and installed only the exact tarball:

```sh
sha256sum "$CANDIDATE"
npm init -y
npm install --offline --ignore-scripts "$CANDIDATE"
```

The digest matched, installation exited 0, 13 packages installed with zero
vulnerabilities, and the installed package retained 152 entries with no
scripts, development dependencies, or source-checkout reference.

It exercised the installed `scopa` command through initialization, status,
governed work, and check. The clean workflow reached `status: satisfied` and
`canStop: true`.

It exercised the exact installed `scopa-mcp` command over newline JSON-RPC and
observed:

- all six documented tools;
- an allowed write to `workspace/consumer.txt`;
- `SCOPA_SCOPE_DENIED` for `../consumer-escape.txt`;
- `SCOPA_SCOPE_DENIED` for a symlink escape through the allowed workspace;
- no outside file after either denial;
- satisfied terminal state; and
- `full` deterministic-fake-agent assurance.

Using the packaged known-failing definition, installed `scopa check` exited 4
with `SCOPA_COMPLETION_BLOCKED`, failed gate `known-exit-7`, and
`canStop: false`.

Installed native-packet verification with the packaged caller-supplied root,
authority ID, and signer pin exited 0 with `ok: true`. Changing the commitment
root caused exit 1 with `SCOPA_JOURNAL_INVALID`; changing the signer pin caused
exit 1 because the signer certificate no longer matched verifier policy.

Validation cases also failed as documented:

| Case | Observed result |
|---|---|
| `scopa verify` without packet | exit 2, `SCOPA_CLI_USAGE` |
| unknown CLI command | exit 2, `SCOPA_CLI_USAGE` |
| `scopa-mcp` without arguments | exit 2, one closed `scopa.launcher-error.v1` envelope |
| unavailable session path | exit 2, closed envelope without path or stack |
| malformed JSON | JSON-RPC `-32700` |
| duplicate request ID | JSON-RPC `-32600` |
| extra tool argument | JSON-RPC `-32602`; no mutation |
| input over 1 MiB | JSON-RPC `-32600`, message exceeds size limit |

All public-proof fields independently reproduced: install success, six tools,
allowed write, scope denial, full assurance, satisfied terminal state,
known-failure exit 4, and successful native verification.

## Reviewer environment note

The reviewer runner suppresses nested Node child-process pipe capture. A
separate generic child-process probe reproduced that runner property, so it
used direct installed-command stdio instead of the packaged convenience
client. The direct execution covered the same JSON-RPC sequence and is not a
SCOPA product finding.

## Claim boundary

`ACCEPT` applied to the initial exact candidate's runtime/containment surface.
The proof/evidence reviewer later returned `REJECT`, so this report cannot
satisfy final RQ2 without a new candidate and fresh final review. It is not
provider attestation, production certification, or permission to publish.
