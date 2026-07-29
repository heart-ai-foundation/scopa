# SCOPA live-run custody

This internal package gives installed SCOPA integrations one bounded lifecycle
contract for child processes and retained evidence.

The supervisor captures a finite number of bytes, launches a dedicated POSIX
process group, terminates the group through a bounded `SIGTERM`/`SIGKILL`
sequence, and returns a closed terminal envelope. Process success does not set
`canStop`; only a successful provider-specific normalizer may do that.

Receipts bind the installed artifact, requested client/model, profile,
capability matrix, scenario, limits, and sanitized environment policy by
value or digest. They do not retain prompts, arguments, environment values,
provider output, repository roots, or control paths.

Private evidence uses an atomic no-overwrite writer with mode `0600`. Its
public derivative replaces only designated private fields, rejects reserved
placeholder and semantic collisions, binds the exact private bytes, and is
byte-deterministic.

This layer is process and evidence custody. It is not an operating-system
sandbox and does not increase either provider integration above partial
assurance.
