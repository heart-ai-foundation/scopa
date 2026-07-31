# S16-v7 production authorization

On 2026-07-30 the principal explicitly authorized the exact S16-v7 policy
for one stop-on-first-failure campaign of at most two provider invocations,
in this order: `clean`, then `cold-restart`.

Authorization-bound policy digest:
`3c70999175562235238e5409634c1dd2ef7e8e79e28588e2539cb63111e9d91c`

The approved policy limits each run to one turn, 180 seconds, 20 MiB capture,
120,000 input tokens, 4,000 output tokens, 2,000 reasoning tokens, and
126,000 total tokens. Aggregate limits are 240,000 input, 8,000 output, and
252,000 total tokens. Private evidence remains mode `0600`, capped at 25 MiB
per run, and retained for 168 hours under the fresh S16R7 namespace.

The campaign must not replay a consumed or stopped invocation. It must close
the provider gate immediately after the attempt, regardless of outcome.
