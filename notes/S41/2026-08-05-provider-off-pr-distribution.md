# S41 Provider-Off Pull-Request Distribution Decisions

- The default PR workflow is evidence-display only. It checks out with
  `persist-credentials: false`, grants only `contents: read`, installs nothing,
  and never executes `begin`, `check`, package scripts, or card-declared gates.
- A missing card is useful negative evidence: completion, assurance, and scope
  are all rendered `UNKNOWN`, with an explicit statement that no project or
  gate command ran.
- A supplied card is treated as caller-supplied evidence, not attestation. The
  runtime validator must accept it before the summary file opens, and the
  report contains only fixed labels, counts, assurance basis, and source-map
  digest.
- Oversized, malformed, escaping, symlinked, multi-link, or semantically
  inconsistent card inputs fail before summary publication. Untrusted card,
  PR, path, prompt, and environment text is never interpolated into Markdown
  or workflow commands.
- The optional comment route is disabled by default and uses no remote action
  dependency. It requires literal opt-in, explicit token input, a valid
  pull-request event, a validated repository identity, a bounded 15-second
  GitHub API request, and documented full-commit-pinned trusted action code.
- The default local action may execute from untrusted PR bytes only because it
  receives no write token or secret. A write-enabled job must never invoke the
  repository-local PR-head action.

Qualification used a stub comment transport and made no GitHub API call,
provider/model call, experiment, network probe, marketplace action,
publication, release, deployment, customer, or external-system mutation.
