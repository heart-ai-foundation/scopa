# GitHub pull-request reporting

SCOPA includes a provider-off local action that validates an optional
privacy-minimized Boundary Card and writes a fixed, sanitized job summary. The
default workflow is intentionally read-only.

## Safe default

The repository workflow at
`.github/workflows/scopa-boundary-check.yml` runs on `pull_request` with only:

```yaml
permissions:
  contents: read
```

Checkout credentials are not persisted. The workflow installs no package,
runs no project script, executes no card-declared gate, receives no secret, and
does not comment. If `scopa-boundary.json` is absent, the summary says
completion, assurance, and scope are `UNKNOWN`, explains that it observed only
the missing card, and gives one fixed correction:

```sh
scopa view --format json --output scopa-boundary.json
```

The action does not execute that command. Add the generated privacy-minimized
card to the pull request if you want the job to validate and report it. Missing
evidence never becomes a green result.

When a card exists, the action validates `scopa.boundary-card.v1`, then reports
only completion, counts, assurance basis, and the source-map digest. It rejects
oversized, malformed, escaping, symlinked, or semantically inconsistent input
before writing the summary. It never includes raw paths, prompts, gate output,
capability evidence, card paths, environment maps, or token values.

When a current card includes aggregate tracked-change observation, the report
shows those counts. A satisfied card with an outside-path or recognized
non-goal contact is headed `SATISFIED — WITH UNVERIFIED CHANGES`; its canonical
completion and `canStop` are unchanged. Observation is reporting only, not a
claim of prevention, control, attribution, or authorization.

## Explicit comment opt-in

Commenting is a separate authority decision. It requires all of the following:

- `comment: "true"` literally;
- an explicit `github-token` input with `pull-requests: write` granted by the
  caller;
- a real `pull_request` event with a validated repository and PR number; and
- trusted action code referenced by a reviewed full 40-character commit SHA.

Never invoke a repository-local action from an untrusted PR checkout while its
job holds write credentials. A write-enabled consumer step must use a full-
commit-pinned reference such as this illustrative shape:

```yaml
permissions:
  contents: read
  pull-requests: write
steps:
  - uses: heart-ai-foundation/scopa/.github/actions/scopa-boundary-check@0123456789abcdef0123456789abcdef01234567
    with:
      card-path: scopa-boundary.json
      comment: "true"
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

Replace the illustrative SHA with the exact reviewed commit containing the
action. Do not use `main`, a mutable tag, or PR-head action bytes for a
write-enabled job. Fork pull requests do not receive a write route from the
default workflow.

The optional comment uses GitHub's API only after those guards pass. Local and
fixture qualification perform no API call. The report is evidence display,
not approval, certification, or a safe-to-merge claim.
