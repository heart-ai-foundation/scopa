# S16-v4 continuation evidence

This fresh namespace is reserved for the two scenarios that S16-v3 did not
launch: false-green and cold-restart. It does not replay S16-v3, reuse its
private evidence, or carry forward residual authorization.

The closed plan permits at most two one-turn `gpt-5.4` invocations with
240,000 input, 8,000 output, and 252,000 counted aggregate tokens. Each run
retains the existing 180-second timeout, 20 MiB capture ceiling, 25 MiB
private-evidence ceiling, mode `0600`, and 168-hour retention.

The provider gate is closed and authorizes zero calls. Drafting, testing,
installed qualification, hosted CI, or the prior principal direction to
continue S16 does not authorize provider traffic. The separate RC1 experiment
and its queued S17 implementation input remain outside this namespace.
