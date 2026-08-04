# Slice-definition reference

A slice definition is the developer-owned contract that SCOPA locks before
work begins. It says what may change, what must pass, and what is explicitly
outside the task. `scopa init` validates the definition and stores a canonical,
SHA-256-bound copy beneath `.scopa/`.

The machine-readable contract is
[`schemas/scopa.slice-definition.v1.schema.json`](../schemas/scopa.slice-definition.v1.schema.json).
Runtime validation remains authoritative and rejects unknown fields.

## Complete example

```json
{
  "schema": "scopa.slice-definition.v1",
  "sliceId": "repair-parser-timeout",
  "allowedPaths": [
    "src/parser/**",
    "test/parser/**",
    "docs/ARCHITECTURE.md"
  ],
  "amendmentPath": ".scopa/amendment.json",
  "gates": [
    {
      "id": "parser-tests",
      "command": ["npm", "test", "--", "test/parser"],
      "cwd": ".",
      "timeoutMs": 120000
    },
    {
      "id": "format",
      "command": ["npm", "run", "format:check"],
      "cwd": ".",
      "timeoutMs": 60000
    }
  ],
  "nonGoals": [
    "No dependency changes",
    "No parser API redesign",
    "No deployment"
  ],
  "stopCondition": {
    "kind": "all-gates-pass"
  }
}
```

## Fields

### `schema`

Required. Must be exactly `scopa.slice-definition.v1`.

### `sliceId`

Required non-empty identifier for this bounded unit of work. Use a stable,
human-readable value; it appears in orientation and stop-state evidence.

### `allowedPaths`

Required non-empty list of unique repository-relative rules. A rule is either:

- one exact path, such as `package.json`; or
- one directory subtree ending in `/**`, such as `src/parser/**`.

SCOPA does not implement general glob syntax. Absolute paths, `..`, backslashes,
unnormalized paths, and wildcard placement other than a final `/**` are
rejected. Permission for a directory subtree does not bypass topology checks:
repository escape, symlink aliases, and hard-linked mutation targets still
fail closed.

Keep the list narrow. If generated files must change, list their destination
explicitly rather than broadening the entire repository.

### `amendmentPath`

Required normalized repository-relative file path. It names the developer-facing
location for an amendment proposal; it does not grant amendment authority.
Changing the active lock requires a separately trusted, lock-hash-bound
principal decision.

### `gates`

Required non-empty list. Each gate contains exactly:

| Field | Contract |
| --- | --- |
| `id` | Unique non-empty identifier |
| `command` | Non-empty argv array; no shell interpolation |
| `cwd` | Existing normalized repository-relative directory, or `.` |
| `timeoutMs` | Integer from 1 through 300,000 milliseconds |

Commands run with `shell: false`, a small environment containing `CI`, `LANG`,
and `PATH`, bounded stdout/stderr capture, and process-tree cleanup. Do not rely
on shell operators, environment-specific aliases, interactive prompts, or
unbounded watch modes.

Good gate:

```json
{
  "id": "unit-tests",
  "command": ["npm", "test", "--", "--runInBand"],
  "cwd": ".",
  "timeoutMs": 120000
}
```

Bad gate:

```json
{
  "id": "tests",
  "command": ["npm", "test"],
  "cwd": ".",
  "timeoutMs": 120000
}
```

Commands are argv arrays, not shell strings. Declare lint as a second gate
instead of joining commands with shell operators.

The bad form requests a single executable whose name contains shell syntax.
Represent independent checks as independent gates.

### `nonGoals`

Required array of non-empty strings; it may be empty. Non-goals orient humans
and agents but do not replace `allowedPaths`. State exclusions concretely:
“No dependency changes” is stronger than “Keep changes small.”

### `stopCondition`

Required object. Version 1 supports only:

```json
{ "kind": "all-gates-pass" }
```

SCOPA sets `canStop: true` only after every gate passes in the same evaluated
stop state.

## Initialization behavior

```sh
scopa init --definition scopa.slice-definition.json
```

Initialization creates `.scopa/config.json` and `.scopa/slice-lock.json`.
Repeating the command with the identical definition is safe. Existing
conflicting files, aliases, or malformed state are not overwritten.

Commit the human-authored definition when it is part of your team's workflow.
Treat `.scopa/slice-lock.json` as generated control evidence: preserve it for
continuity, but do not edit it by hand.

## Design checklist

Before initialization, verify that:

- every intended output is covered by one narrow rule;
- control files and secrets are not accidentally writable;
- every gate terminates non-interactively;
- gate working directories already exist;
- timeouts cover normal CI variance without becoming unbounded;
- at least one gate would fail before the requested work is complete; and
- non-goals identify the tempting adjacent work that must remain out of scope.
