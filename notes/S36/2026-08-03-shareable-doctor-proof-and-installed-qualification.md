# S36 shareable doctor proof and installed qualification decisions

- Markdown is a projection, not an alternate truth object. Every report carries
  `sourceSchema` and `sourceSha256` over the canonical validated JSON result,
  and the public validator can recompute summary, content, and binding from
  caller-supplied source.
- The shareable summary uses only fixed vocabulary, booleans, and counts. It
  omits diagnostic paths and every caller-supplied workflow string, including
  slice, gate, path, non-goal, client, transport, evidence, prompt, and command
  material.
- Markdown formatting does not change completion polarity. A failing lock
  returns exit 4, `SCOPA_DOCTOR_LOCK_BLOCKED`, `canStop: false`, and a generic
  non-disclosing message.
- JSON remains the default. Unsupported formats reject before any lock input is
  read for mutation or `.scopa` is created.
- Installed qualification packs and locally installs the current source bytes
  outside a clean target. The target receives no dependency manifest or
  dependency tree. Fresh processes diagnose, lock, and cold-repeat the terminal
  semantics.
- The public docs distinguish current source-line behavior from the already
  published `0.2.0` tarball. This arc does not transfer the new behavior to that
  release or authorize another release.
- Package and release-policy inventories now require the doctor guide, both
  schemas, runtime package, and the three reviewed installed fixtures while
  continuing to forbid protocol, note, run, and evidence material.
