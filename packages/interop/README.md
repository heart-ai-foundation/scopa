# `@heart-ai-foundation/scopa-interop`

Deterministic CASE/UCO export for signed SCOPA evidence packets.

## What the export means

The exporter verifies a native S4 packet before projecting it into CASE/UCO
1.4.0 JSON-LD. It creates:

- one UCO `Action` per SCOPA journal record;
- a UCO `Tool` for the SCOPA runtime;
- a UCO `Identity` for the cryptographic signing-key identifier;
- directional UCO `Relationship` nodes connecting Actions to the runtime and
  the packet to its signing key; and
- an evidence-packet carrier containing the exact native packet bytes.

All ten frozen SCOPA effect categories map to `uco-action:Action`. Their exact
category and `OBSERVE`, `ACT`, or `PRINCIPAL` kind remain explicit SCOPA tags;
the exporter never renames a category to imply a narrower CASE concept.

The `scopa` vocabulary in the local JSON-LD context is a SCOPA namespace, not
a separately published CASE extension ontology.

## Export and verify

```sh
node packages/interop/src/export-cli.js \
  --packet evidence-packet.json \
  --out export.jsonld \
  --timestamp-roots trusted-tsa-roots.pem \
  --timestamp-authority-id expected-authority \
  --timestamp-signer-sha256 expected-signer-certificate-digest \
  --require-timestamp

node packages/interop/src/verify-case-cli.js \
  --export export.jsonld \
  --timestamp-roots trusted-tsa-roots.pem \
  --timestamp-authority-id expected-authority \
  --timestamp-signer-sha256 expected-signer-certificate-digest \
  --require-timestamp
```

The SCOPA verifier requires canonical export bytes, recovers and hash-checks
the exact native packet, applies the caller's S4 trust policy, regenerates the
projection, and rejects any graph drift.

The public in-memory verifier accepts either ordinary JSON-parsed containers
or SCOPA's recursively frozen export document. It rejects custom prototypes,
accessors, symbols, hidden fields, sparse arrays, altered descriptors, and
extra properties before operating on a fresh normalized JSON clone.

## External CASE validation

Install the pinned independent consumer in a separate Python environment:

```sh
python -m pip install -r packages/interop/requirements-case-validator.txt
case_validate --built-version case-1.4.0 export.jsonld
```

Or use the checked wrapper:

```sh
CASE_VALIDATE_BIN=/path/to/case_validate \
  node packages/interop/src/case-validator-cli.js --export export.jsonld
```

`Conforms: True` means the graph satisfies the bundled CASE 1.4.0 SHACL
constraints under the validator's default strict severity policy. It does not
verify the embedded SCOPA signature, timestamp, INFER pins, key backing,
provider provenance, or human identity; run both validators.
