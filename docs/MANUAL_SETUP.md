# Manual SCOPA walkthrough

This optional walkthrough exercises the public package without a SCOPA source checkout.
It requires Node.js 22 or newer and a POSIX environment for process-group gate
custody.

You will initialize a bounded repository, call the real `scopa-mcp` process,
observe an allowed write and denied escape, prove the completion gate, and
verify a signed evidence packet.

## 1. Install

Start in a new empty directory:

```sh
mkdir scopa-quickstart
cd scopa-quickstart
npm init -y
npm install --ignore-scripts @heart-ai-foundation/scopa@0.2.0
```

SCOPA does not use install lifecycle scripts. For release-sensitive use, follow
the [exact-byte verification](../README.md#exact-release-bytes) instructions.

## 2. Prepare the example repository

The package includes a reviewed example definition. Copy it into a disposable
repository:

```sh
mkdir -p consumer-repo/.git consumer-repo/workspace
cp node_modules/@heart-ai-foundation/scopa/fixtures/S10/clean.slice-definition.json \
  consumer-repo/scopa.slice-definition.json
cd consumer-repo
```

The definition permits writes only beneath `workspace/**`. Its gate requires
`workspace/consumer.txt` to contain one exact line. Inspect the file before
continuing; real projects should author their own definition using the
[slice-definition reference](SLICE_DEFINITION.md).

## 3. Initialize and inspect

```sh
../node_modules/.bin/scopa init --definition scopa.slice-definition.json
../node_modules/.bin/scopa status
```

`init` should report two created files beneath `.scopa/`. The initial status is
expected to be blocked because the required output does not exist yet:

```json
{
  "gateStatus": "blocked",
  "canStop": false,
  "failedGates": ["consumer-content"]
}
```

SCOPA commands wrap results in a versioned `scopa.cli-result.v1` envelope, so
the fields above appear beneath `result`.

## 4. Exercise the MCP boundary

Run the packaged consumer client. It starts the real `scopa-mcp` executable,
inventories all six tools, writes the allowed file, attempts a repository
escape, evaluates the gate, and captures the adapter transcript:

```sh
node ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/consumer-client.mjs \
  --server ../node_modules/.bin/scopa-mcp \
  --repo . \
  --session ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/session.json \
  --matrix ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/capability-matrix.json
```

The command should exit `0` and report:

```json
{
  "allowedWrite": true,
  "scopeDenied": true,
  "terminal": {
    "status": "satisfied",
    "canStop": true
  }
}
```

The denied tool result carries the stable code `SCOPA_SCOPE_DENIED` and a
correction-bearing explanation of the active path rules.

Confirm that `workspace/consumer.txt` exists and that no
`../consumer-escape.txt` was created.

## 5. Recheck completion

```sh
../node_modules/.bin/scopa check
```

The command should now exit `0` with `status: "satisfied"` and
`canStop: true`. If a gate fails, `scopa check` exits `4`; model text cannot
override that result.

## 6. Independently verify evidence

The package includes a timestamped fixture and its relying-party trust root:

```sh
../node_modules/.bin/scopa verify \
  --packet ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/2026-07-26-freetsa-packet.json \
  --timestamp-roots ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/freetsa-root.pem \
  --require-timestamp \
  --timestamp-authority-id freetsa.org-2026 \
  --timestamp-signer-sha256 32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc
```

The report should return `ok: true` for the chain, signature, INFER linkage,
and RFC 3161 timestamp. This is an offline trust-policy check. Its
`revocationStatus` is `not-checked`; environments that require current
certificate status must perform a separate authoritative CRL/OCSP check.

## 7. Observe a known failure

To prove failure polarity, create another disposable repository using
`fixtures/S10/failing.slice-definition.json`, initialize it, and run
`scopa check`. The expected exit is `4`, the error code is
`SCOPA_COMPLETION_BLOCKED`, and `canStop` remains false.

## What this proves

This walkthrough proves, for the installed artifact and included fixtures:

- source-free package installation;
- real MCP subprocess startup and six-tool inventory;
- an allowed governed write;
- a correction-bearing repository-escape denial;
- gate-derived completion state; and
- independent verification under caller-supplied trust.

It does not prove OS sandboxing, provider identity, hardware key provenance,
production suitability for a particular repository, or full Claude/Codex
assurance. Read [Architecture](ARCHITECTURE.md), [Threat model](THREAT_MODEL.md),
and [Claims](CLAIMS.md) before deploying SCOPA around sensitive work.
