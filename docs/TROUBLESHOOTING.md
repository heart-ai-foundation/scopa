# Troubleshooting

SCOPA fails closed. Diagnose the returned versioned envelope before changing a
policy or broadening scope.

At a terminal, `begin`, `check`, `status`, and `doctor` default to concise
human text. Use `--format json` when following field-level troubleshooting or
when output is consumed by an agent or script; redirects and pipes select the
same canonical JSON automatically.

## `scopa init` refuses existing state

Initialization never overwrites conflicting `.scopa/config.json` or
`.scopa/slice-lock.json` files. Compare the requested definition with the
retained lock. If the task genuinely changed, create a new reviewed slice
definition; do not hand-edit the generated lock.

## `SCOPA_SLICE_LOCK_INVALID`

Common causes:

- an unknown or missing field;
- an absolute, backslash, `..`, or unnormalized path;
- arbitrary glob syntax instead of exact paths or final `/**` subtrees;
- duplicate gate IDs or path rules;
- a shell command encoded as one argv string; or
- a timeout outside 1–300,000 milliseconds.

Validate against the [slice-definition schema](../schemas/scopa.slice-definition.v1.schema.json)
and the [authoring reference](SLICE_DEFINITION.md).

## `SCOPA_SCOPE_DENIED`

Read the denial's `reason`, `requestedPath`, and `allowedPaths`. Do not retry
the same path or silently broaden scope. Check for repository escape, symlink
or hard-link aliases, missing parent directories, or a path omitted from the
active slice.

## `scopa check` exits `4`

Exit `4` means the completion boundary worked: at least one real gate is still
blocked. Run `scopa check --format json` and inspect `error.details.gates` for exit status, timeout, truncation, and
bounded stdout/stderr. Run the gate's argv directly only for local diagnosis;
the authoritative result remains the SCOPA-run gate.

When the gates pass, run `scopa view --format json` before reporting a clean
boundary. `canStop` is a gate result; the card separately reports tracked and
untracked Git working-tree changes outside the task paths or in contact with a
declared non-goal.

## A gate cannot find a command

Gates receive a small environment containing only `CI`, `LANG`, and `PATH`.
They do not use a shell and cannot expand aliases, variables, pipes, redirects,
or `&&`. Put each executable and argument in its own `command` entry and use a
non-interactive command available on `PATH`.

## Gate timeout or output limit

Use finite test commands rather than watch modes. Split unrelated checks into
separate gates. Increase `timeoutMs` only after measuring normal execution;
the maximum is five minutes. Excess output and surviving descendants are
completion failures, not warnings.

## `scopa-mcp` exits with a launcher envelope

The default error is intentionally redacted. Verify that:

- `--repo` resolves to the initialized repository;
- session and matrix files are readable JSON;
- the matrix subject matches the connecting MCP client; and
- the host supports `/proc/self/fd` or `/dev/fd` for governed writes.

For local maintainer diagnosis only, `SCOPA_DEBUG_ERRORS=1` adds a stack. Never
capture that diagnostic into public evidence, and never print the inherited
environment: provider CLIs and shells may contain credentials.

## Evidence verification exits `5`

Signature, chain, INFER-linkage, trust-policy, timestamp, and CASE-recovery
failures all use the stable evidence-verification boundary. Confirm that the
packet bytes, trust root, authority ID, signer fingerprint, and timestamp
requirement are the values your relying party intended. Do not weaken trust
policy merely to make a fixture pass.

## Claude or Codex reports drift

A client version, model label, tool inventory, event schema, feature surface,
or local store changed. Stop the run. Provider evidence is valid only for the
exact reviewed profile; update and requalify the integration deliberately.

## Reporting a problem

Use the bug template for reproducible non-security defects. For a suspected
vulnerability, credential disclosure, or boundary bypass, follow
[SECURITY.md](../SECURITY.md) and do not open a public issue.
