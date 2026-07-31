# S17.1 resource-bound evidence channels

SCOPA now exposes an opt-in dual-channel adapter contract. A host-selected
path outside the governed repository receives one canonical, mode-`0600`,
no-replace full journal. The agent receives compact check, assurance, and
transcript-index views only.

The compact check retains slice/lock identity, terminal polarity, failed gate
IDs, exit/timeout/duration metadata, exact observed byte counts, output
digests, truncation flags, and at most 2,048 UTF-8 bytes of failure preview.
The compact transcript removes the session request, tool arguments, and tool
results; ordered entries retain their digests and journal-addressed evidence
references. Every agent evidence response is capped at 16,384 serialized
bytes.

The existing bridge remains compatible when no journal sink is configured.
S17.1 establishes and tests the launcher/adapter contract; provider-specific
normalizer adoption remains deterministic implementation work and authorizes
no provider call.
