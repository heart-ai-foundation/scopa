# S32 portable assessment decisions

- Full semantic diffs remain local and may contain repository-relative names.
- Portable packets replace every changed identifier with a SHA-256 commitment
  and omit the source map itself.
- Independent verification regenerates the packet from caller-supplied expected
  current and baseline maps; a packet is not self-authenticating.
- Scope expansion and loss of surface evidence are regressions. Moving an
  existing route toward uncontrolled authority is also a regression.
- Packet posture uses `bounded` and `review-required`, never safe, certified,
  compliant, or approved.
