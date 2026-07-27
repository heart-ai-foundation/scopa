# S1 sealed-core decisions

Date: 2026-07-26

- The core runs synchronous generators inside an SES Compartment. Only the
  shell owns ambient authority.
- The journal owns the frozen effect schema so imported records cannot bypass
  the kernel's ten-category ABI.
- SCOPA's dCBOR profile admits safe integers but rejects floats, non-NFC text,
  indefinite forms, duplicate keys, undefined values, and non-canonical bytes.
- Every record pins a lowercase SHA-256 script digest, schema version, kernel
  version, run, scope, sequence, and predecessor.
- Suffix truncation is checked against an external commitment. Authentication
  and third-party anchoring remain S4 work.
- Persistent ACT claims use a publish-after-fsync hard link. Completion
  atomically replaces the pending entry with the fulfillment and exact sealed
  record, allowing repair after a journal-append failure.
- Live execution validates and replays an existing journal prefix into the
  generator before issuing new shell calls. This restores sequence and
  predecessor state and prevents duplicate prefix observations during repair.
- The pending state intentionally fails closed. A crash after a real action but
  before receipt durability requires reconciliation; it never authorizes an
  automatic duplicate action.
- Content blobs use the same publish-after-fsync pattern so readers never
  observe a partially written digest target.
