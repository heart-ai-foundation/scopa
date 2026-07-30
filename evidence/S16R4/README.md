# S16-v4 continuation evidence

This fresh namespace is reserved for the two scenarios that S16-v3 did not
launch: false-green and cold-restart. It does not replay S16-v3, reuse its
private evidence, or carry forward residual authorization.

The closed plan permits at most two one-turn `gpt-5.4` invocations with
240,000 input, 8,000 output, and 252,000 counted aggregate tokens. Each run
retains the existing 180-second timeout, 20 MiB capture ceiling, 25 MiB
private-evidence ceiling, mode `0600`, and 168-hour retention.

On 2026-07-30 the principal explicitly approved this exact policy and its
fresh private destination. The provider gate authorizes one stop-first-failure
execution attempt containing at most the two enumerated one-turn calls. No
provider result is yet claimed and replay is prohibited. The separate RC1
experiment and its queued S17 implementation input remain outside this
namespace.
