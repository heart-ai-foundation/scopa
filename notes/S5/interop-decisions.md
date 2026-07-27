# S5 CASE/UCO interoperability decisions

Date: 2026-07-26 America/Los_Angeles

## Version and consumer boundary

- The export targets CASE/UCO 1.4.0 because pinned `case-utils 0.17.0`
  includes the `case-1.4.0` build. CASE 1.5.0 is not claimed.
- External conformance uses the CASE community's `case_validate` executable in
  a separate Python environment. The JavaScript exporter does not contain or
  emulate the CASE SHACL validator.
- The JSON-LD document contains a local context, so export, round trip, and
  installed-validator operation require no context retrieval at runtime.
- `https://heart-ai.foundation/scopa/ontology/v1#` is used as a stable SCOPA
  vocabulary namespace. S5 does not claim that it is a separately published
  CASE extension ontology.

## Effect mapping

Every frozen effect category maps one-to-one to a generic UCO Action. The
original category is retained as both `scopa:effectCategory` and an exact
`uco-core:tag`; the effect kind remains `scopa:effectKind`.

| SCOPA category | Kind | UCO type | Label |
| --- | --- | --- | --- |
| `CLOCK` | `OBSERVE` | `uco-action:Action` | Read clock |
| `ENTROPY` | `OBSERVE` | `uco-action:Action` | Request entropy |
| `SOURCE.INGEST` | `OBSERVE` | `uco-action:Action` | Ingest source |
| `SOURCE.EXTRACT` | `OBSERVE` | `uco-action:Action` | Extract source content |
| `INFER` | `OBSERVE` | `uco-action:Action` | Perform model inference |
| `TOOL.QUERY` | `OBSERVE` | `uco-action:Action` | Query through tool |
| `TOOL.COMMAND` | `ACT` | `uco-action:Action` | Execute tool command |
| `EMIT` | `ACT` | `uco-action:Action` | Emit output |
| `SIGN` | `ACT` | `uco-action:Action` | Create signature |
| `DECISION` | `PRINCIPAL` | `uco-action:Action` | Record principal decision |

A generic Action is deliberate. Assigning narrower CASE action types without
the facts those types require would distort SCOPA's evidence.

## Graph and identity boundary

- The Bundle contains the evidence-packet carrier, signing-key Identity, SCOPA
  Tool, one Action per journal record, and directional Relationships.
- Action-to-Tool Relationships mean “recorded by runtime tool,” not that SCOPA
  itself performed every underlying operation.
- The Identity means only the Ed25519 cryptographic key identifier carried by
  the verified packet. It does not identify a person, account, organization,
  device, or provider.
- The packet-to-Identity Relationship means “signed by cryptographic key.”
  S4 key-class and attestation policy remain authoritative.

## Determinism and round trip

- Node IDs are content-derived RFC 4122 UUIDv5 values under namespace
  `1d915dbb-6654-5073-916b-5b9e8721e017`, itself UUIDv5-derived from
  `heart-ai.foundation/scopa/case/v1` under the DNS namespace.
- UUIDv5's SHA-1 is used only for deterministic identifiers, not as an
  integrity or signature primitive. Packet and graph integrity continue to
  use SHA-256 and S4 Ed25519 verification.
- Object keys are sorted recursively and rendered with one canonical,
  newline-terminated JSON form. Graph ordering is deterministic.
- The exact native packet bytes are embedded as canonical base64 and bound by
  SHA-256. Round trip recovers those bytes, runs the S4 verifier under
  caller-supplied timestamp policy, regenerates the projection, and compares
  its complete semantics.
- Unknown top-level fields, missing or duplicate carrier nodes, altered
  categories, reordered nodes, changed descriptions, corrupted packet bytes,
  digest mismatch, or noncanonical JSON fail closed.
- Direct in-memory verification first validates container prototypes, property
  descriptors, symbols, density, and extensibility. It accepts ordinary
  mutable JSON or the exporter's recursively frozen document, then performs all
  graph operations on a fresh normalized JSON clone. This prevents hostile
  prototypes or accessors from supplying verifier behavior.

## Claim boundary

CASE validation establishes CASE/UCO graph conformance under the selected
ontology build. It does not verify the SCOPA journal, signature, timestamp,
INFER pins, key backing, provider provenance, or human identity. The native
S4 verifier remains a separate required path.
