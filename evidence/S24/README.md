# S24 gate process-tree custody evidence

S24 closes the descendant-survivor defect reproduced by the S23-v2 runtime
review. Gate commands now run as isolated POSIX process groups. Timeout and
per-stream output overflow initiate bounded SIGTERM/SIGKILL escalation, and the
runner verifies group disappearance before returning. A successful parent that
leaves a descendant is a failed gate after cleanup; unsupported process-group
custody fails closed.

The adversarial fixture creates a SIGTERM-resistant descendant. Focused tests
proved that timeout, output pressure, and successful-parent exit each leave no
surviving descendant. The unchanged `scopa.gate-result.v1` surface reports each
case as failed, with bounded output metadata and no false green.

Local `npm run test:s2`, the accumulated `npm test`, and `npm run
protocol:check` passed. Hosted run
[`30686962639`](https://github.com/heart-ai-foundation/scopa/actions/runs/30686962639)
passed the accumulated release gate, npm 10/11 bundled-closure parity, clean
official build, signed-packet recovery, and positive/negative CASE validation
for implementation commit `1bd80d0b428b864a96febf61880bbf18d2c8cac7`.

No provider, experiment, publication, release, dependency, candidate, or
unrelated runtime action occurred. S25 must build and qualify fresh bytes; no
S20-S23 candidate assurance transfers.
