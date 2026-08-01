# SCOPA 0.2 developer-preview quickstart

This quickstart uses a local candidate tarball. It requires Node.js 22 or
newer and does not require the SCOPA source checkout.

## Install the candidate

Receive the exact candidate and its manifest through the private evaluation
channel. In a new empty directory:

```sh
npm init -y
npm install --ignore-scripts \
  /path/to/heart-ai-foundation-scopa-0.2.0-dev.1.tgz
```

The candidate is not published to npm. Compare the tarball SHA-256 and npm
integrity value with the supplied candidate manifest before continuing.
Also compare the supplied production-closure, bundled-payload, and license-
inventory SHA-256 values with `production-bundle.json` inside the installed
package. Qualified candidates install with lifecycle scripts disabled from an
empty cache without contacting a registry.

## Initialize a clean fixture

```sh
mkdir -p consumer-repo/.git consumer-repo/workspace
cp node_modules/@heart-ai-foundation/scopa/fixtures/S10/clean.slice-definition.json \
  consumer-repo/scopa.slice-definition.json
cd consumer-repo
../node_modules/.bin/scopa init --definition scopa.slice-definition.json
../node_modules/.bin/scopa status
```

## Exercise the supported model-neutral adapter

Run the packaged consumer client. It launches only `scopa-mcp`, inventories the
six SCOPA tools, performs an allowed write, observes `SCOPA_SCOPE_DENIED` for
an escaping write, checks the real terminal state, and captures the adapter
transcript:

```sh
node ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/consumer-client.mjs \
  --server ../node_modules/.bin/scopa-mcp \
  --repo . \
  --session ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/session.json \
  --matrix ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/capability-matrix.json
```

The expected result has `allowedWrite: true`, `scopeDenied: true`,
`terminal.status: "satisfied"`, and `terminal.canStop: true`.

## Independently verify the retained packet

From `consumer-repo`:

```sh
../node_modules/.bin/scopa verify \
  --packet ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/2026-07-26-freetsa-packet.json \
  --timestamp-roots ../node_modules/@heart-ai-foundation/scopa/fixtures/S10/freetsa-root.pem \
  --require-timestamp \
  --timestamp-authority-id freetsa.org-2026 \
  --timestamp-signer-sha256 32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc
```

This is an offline trust-policy check against the caller-supplied root and
signer pin. Its report records `revocationStatus: "not-checked"`: SCOPA does
not fetch or validate CRL/OCSP state in this path. Evaluators who require
current revocation status must perform a separate provider-authoritative
revocation check.

## Prove a known failure remains blocked

Create a second repository with
`fixtures/S10/failing.slice-definition.json`, initialize it, and run
`scopa check`. The expected exit code is `4`, the error code is
`SCOPA_COMPLETION_BLOCKED`, and `canStop` is false.

## Interpretation

This quickstart proves local artifact installation, the model-neutral SCOPA
tool boundary, scope denial, real completion state, cold filesystem state, and
independent packet verification. It does not prove OS sandboxing, provider
identity, production readiness, or full Claude/Codex assurance.
